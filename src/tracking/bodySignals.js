const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const finite = Number.isFinite;
const point = p => p && finite(p.x) && finite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;

// Local scalar signals only: no frames, contours, or landmark histories are retained.
export function createBodySignals({ now = () => performance.now() } = {}) {
  let enabled = false, clockLast = null, activeClock = 0, end = 0, cooldownEnd = 0;
  let baseline, calibration, lastTime, lastSequence, smooth;
  let state = 'NEUTRAL', candidate, lastFire = -Infinity, gentleArmed = true, gentle;
  let sequence = [], poseSequence = [], poseBase, poseArmed = false, lastPoseTime, lowering, lowered;
  let summary;
  function clearTracking() {
    baseline = calibration = lastTime = lastSequence = smooth = poseBase = lastPoseTime = lowering = lowered = undefined;
    state = 'NEUTRAL'; poseArmed = false; candidate = gentle = undefined; gentleArmed = true; sequence = []; poseSequence = [];
  }
  function overdrive() { return { active: end > activeClock, remaining: Math.max(0,end-activeClock), cooldown: Math.max(0,cooldownEnd-activeClock), progress: Math.max(sequence.length,poseSequence.length)/3 }; }
  function blank(reason='calibrating') { return { ready:false,source:'coarse',center:null,direction:{x:0,y:0},scale:1,displacement:{x:0,y:0},reach:null,spread:null,lean:null,shockwave:null,overdrive:overdrive(),valid:false,reason }; }
  summary = blank();
  function result(extra={}) { summary={...summary,shockwave:null,...extra,overdrive:overdrive()}; return {...summary,center:summary.center && {...summary.center},direction:{...summary.direction},displacement:{...summary.displacement}}; }
  function activate() { if(activeClock>=cooldownEnd){end=activeClock+6000;cooldownEnd=end+12000;}sequence=[];poseSequence=[]; }
  function action(kind,direction,time) {
    sequence=sequence.filter(a=>time-a.time<=5000);
    poseSequence=poseSequence.filter(a=>time-a.time<=5000);
    if(kind==='lateral') {
      const expected = sequence.length===1 ? 1 : -1;
      if(direction===expected)sequence.push({time}); else sequence=direction===-1?[{time}]:[];
      if(sequence.length===3)activate();
      if(!poseSequence.length)poseSequence=[{kind,time,direction}];
      else if(poseSequence.length===2 && direction!==poseSequence[0].direction){poseSequence.push({kind,time});activate();}
    } else if((kind==='reach'||kind==='spread')&&poseSequence.length===1)poseSequence.push({kind,time});
  }
  function recognize(kind,magnitude,direction,time,threshold,body=true) {
    const neutral=magnitude<threshold*.45;
    if(time-lastFire<3000){state='COOLDOWN';candidate=undefined;return null;}
    if(state==='FIRED')state='COOLDOWN';
    if(state==='COOLDOWN'){if(time-lastFire>=3000&&neutral)state='ARMED';return null;}
    if(neutral){state='ARMED';candidate=undefined;return null;}
    if(state==='NEUTRAL')return null;
    if(magnitude<threshold*.7){state='ARMED';candidate=undefined;return null;}
    if(magnitude<threshold)return null;
    if(!candidate||candidate.kind!==kind||candidate.direction!==direction||time-candidate.start>(kind==='lateral'?500:800)){candidate={kind,direction,start:time,count:1};state='CANDIDATE';return null;}
    candidate.count++;
    if(candidate.count>=3&&time-candidate.start>=250){state='FIRED';lastFire=time;candidate=undefined;if(body)action(kind,direction,time);return {kind,direction,strength:clamp(magnitude/threshold,0,2)};}
    return null;
  }
  function sample(input,time=now()) {
    const coarse=input?.coarse??input;
    if(!enabled)return result({...blank('inactive')});
    if(!coarse?.valid||!point(coarse.center)||!finite(coarse.occupancy)||coarse.occupancy<=0||!finite(coarse.timestamp)||time-coarse.timestamp>500||coarse.timestamp>time+20){clearTracking();return result({...blank('invalid')});}
    if(coarse.timestamp===lastTime||coarse.sequence!==undefined&&coarse.sequence===lastSequence)return result({reason:'duplicate'});
    if(lastTime!==undefined&&(coarse.timestamp<lastTime||coarse.timestamp-lastTime>500))clearTracking();
    const dt=lastTime===undefined?0:coarse.timestamp-lastTime;
    lastTime=coarse.timestamp;lastSequence=coarse.sequence;
    const p=coarse.center;
    if(!calibration)calibration={start:lastTime,count:0,x:p.x,y:p.y,occupancy:coarse.occupancy};
    if(!baseline){
      if(Math.hypot(p.x-calibration.x,p.y-calibration.y)>.025||Math.abs(coarse.occupancy-calibration.occupancy)>.04)calibration={start:lastTime,count:0,x:p.x,y:p.y,occupancy:coarse.occupancy};
      calibration.count++;
      if(lastTime-calibration.start>=1000&&calibration.count>=5){baseline={x:calibration.x,y:calibration.y,occupancy:calibration.occupancy};state='ARMED';}
    }
    const alpha=dt?1-Math.exp(-dt/clamp(80-Math.hypot(p.x-(smooth?.x??p.x),p.y-(smooth?.y??p.y))*100,40,80)):1;
    smooth=smooth?{x:smooth.x+(p.x-smooth.x)*alpha,y:smooth.y+(p.y-smooth.y)*alpha}:{x:p.x,y:p.y};
    const dx=baseline?p.x-baseline.x:0,dy=baseline?p.y-baseline.y:0;
    let reach=null,spread=null,lean=null,rise=null;
    const pose=input.pose;
    const landmarks=pose?.landmarks??input.landmarks;
    const poseFresh=landmarks && (pose?.timestamp===undefined||finite(pose.timestamp)&&time-pose.timestamp<=500&&pose.timestamp<=time+20);
    const poseTime=pose?.timestamp;
    const poseDistinct=poseFresh&&finite(poseTime)&&(lastPoseTime===undefined||poseTime>lastPoseTime);
    if(poseDistinct)lastPoseTime=poseTime;
    const reliable=ids=>poseFresh&&ids.every(i=>point(landmarks[i])&&landmarks[i].visibility>=.7);
    if(reliable([11,12,15,16])){const width=Math.max(.05,Math.abs(landmarks[11].x-landmarks[12].x));reach=clamp(((landmarks[11].y-landmarks[15].y)+(landmarks[12].y-landmarks[16].y))/2/width,0,2);spread=clamp(Math.abs(landmarks[15].x-landmarks[16].x)/width,0,4);}
    if(reliable([11,12,23,24]))lean=clamp(-((landmarks[11].x+landmarks[12].x)-(landmarks[23].x+landmarks[24].x))/2,-1,1);
    if(reliable([23,24,25,26])&&poseDistinct){
      const hip=(landmarks[23].y+landmarks[24].y)/2;
      if(!poseBase)poseBase={hip,occupancy:coarse.occupancy};
      const stableScale=Math.abs(coarse.occupancy/poseBase.occupancy-1)<.15;
      if(!stableScale){lowering=lowered=undefined;}
      else if(hip-poseBase.hip>.09){
        if(!lowering||poseTime-lowering.start>800)lowering={start:poseTime,count:1,hip};else{lowering.count++;lowering.hip=Math.max(hip,lowering.hip);}
        if(lowering.count>=3&&poseTime-lowering.start>=250)lowered={hip:lowering.hip,time:poseTime};
      }else if(lowered&&poseTime-lowered.time<=2500&&hip-poseBase.hip<.04){rise=lowered.hip-hip;}
      else if(lowered&&poseTime-lowered.time>2500){lowering=lowered=undefined;}
    }else if(!reliable([23,24,25,26])){lowering=lowered=undefined;}
    if(poseDistinct&&reach!==null&&spread!==null&&reach<.25&&spread<1.5)poseArmed=true;
    if(reach===null&&spread===null){poseArmed=false;if(candidate&&candidate.kind!=='lateral'){candidate=undefined;state='ARMED';}}
    let shockwave=null;
    if(baseline){
      const body=coarse.source!=='hand';
      if(!body){sequence=[];poseSequence=[];}
      const magnitude=Math.abs(dx);
      if(magnitude<.025){gentleArmed=true;gentle=undefined;}
      else if(gentleArmed&&magnitude>=.055){const direction=Math.sign(dx);if(!gentle||gentle.direction!==direction||time-gentle.start>500)gentle={direction,start:time,count:1};else gentle.count++;if(gentle.count>=3&&time-gentle.start>=250){gentleArmed=false;if(body)action('lateral',direction,time);}}
      let kind='lateral',value=magnitude,threshold=.10,direction=Math.sign(dx);
      if(poseArmed&&reach!==null&&reach>.65){kind='reach';value=reach;threshold=.65;direction=0;}
      else if(poseArmed&&spread!==null&&spread>2.2){kind='spread';value=spread;threshold=2.2;direction=0;}
      else if(rise!==null&&rise>.08){kind='rise';value=rise;threshold=.08;direction=0;}
      if((kind==='lateral'&&(!candidate||candidate.kind==='lateral'))||poseDistinct)shockwave=recognize(kind,value,direction,time,threshold,body);
      if(shockwave&&kind==='rise')lowering=lowered=undefined;
      if(shockwave&&(kind==='reach'||kind==='spread'))poseArmed=false;
    }
    return result({ready:!!baseline,valid:true,reason:baseline?'ready':'calibrating',source:coarse.source??(reach!==null?'pose':'coarse'),center:{...smooth},direction:{x:dx,y:dy},scale:baseline?clamp(Math.sqrt(coarse.occupancy/baseline.occupancy),.88,1.12):1,displacement:{x:clamp(dx*.2,-.04,.04),y:clamp(dy*.2,-.04,.04)},reach,spread,lean,shockwave,poseTimestamp:poseFresh?poseTime:null});
  }
  function tick(time=now(),active=false){
    if(active&&enabled&&clockLast!==null)activeClock+=Math.max(0,time-clockLast);
    enabled=!!active;clockLast=clockLast===null?time:Math.max(clockLast,time);
    if(!active){clearTracking();return result({...blank('inactive')});}
    if(lastTime!==undefined&&time-lastTime>500){clearTracking();return result({...blank('stale')});}
    return result();
  }
  function suspend(){enabled=false;clockLast=null;clearTracking();return result({...blank('suspended')});}
  function reset(){suspend();activeClock=end=cooldownEnd=0;lastFire=-Infinity;return result({...blank()});}
  function wave(time=now()){if(!enabled||time-lastFire<3000)return result();lastFire=time;return result({shockwave:{kind:'manual',direction:0,strength:1}});}
  return {sample,tick,suspend,reset,wave};
}






export function freshBodyPose(pose,time){return pose?.landmarks&&Number.isFinite(pose.timestamp)&&Number.isFinite(time)&&pose.timestamp<=time&&time-pose.timestamp<=500?pose:null;}
