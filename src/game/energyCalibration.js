const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function freshEnergyPose(body,now){return body?.valid&&Number.isFinite(body.reach)&&Number.isFinite(body.timestamp)&&body.timestamp<=now&&now-body.timestamp<=500?body:null;}
export function createEnergyCalibration(){
 let stage='neutral',last=-Infinity,start=null,count=0,anchor=null,baseline=null,jitter=.005;
 let left=0,right=0,expansion=0,reach=0,candidate=null,lastPose=-Infinity,poseCandidate=null;
 const snapshot=()=>({stage,ready:stage==='done',baseline:baseline&&{...baseline},targets:{left:Math.max(.015,left*.55,jitter*3),right:Math.max(.015,right*.55,jitter*3),expand:expansion*.6,reach:reach*.6},
  capabilities:[...(left>=Math.max(.02,jitter*4)?['left']:[]),...(right>=Math.max(.02,jitter*4)?['right']:[]),...(expansion>.08?['expand']:[]),...(reach>.3?['reach']:[])],
  envelope:baseline?{minX:clamp(baseline.minX-left,.04,.96),maxX:clamp(baseline.maxX+right,.04,.96),minY:clamp(baseline.minY,.08,.9),maxY:clamp(baseline.maxY,.1,.92)}:null});
 const api={get snapshot(){return snapshot();},reset(){stage='neutral';last=-Infinity;start=null;count=0;anchor=baseline=candidate=null;jitter=.005;left=right=expansion=reach=0;lastPose=-Infinity;poseCandidate=null;},
  sample(s,now,body){
   if(!s?.valid||!s.center||!s.bounds||!Number.isFinite(s.timestamp)||s.timestamp>now||now-s.timestamp>250||s.timestamp<=last)return snapshot();
   if(last!==-Infinity&&s.timestamp-last>250){if(stage==='neutral'){start=null;count=0;}candidate=null;}
   last=s.timestamp;
   const pose=freshEnergyPose(body,now);
   const width=s.bounds.maxX-s.bounds.minX,height=s.bounds.maxY-s.bounds.minY;
   if(stage==='neutral'){
    if(start===null||Math.hypot(s.center.x-anchor.x,s.center.y-anchor.y)>.025||Math.abs(s.occupancy/anchor.occupancy-1)>.15){start=last;count=0;anchor={...s.center,occupancy:s.occupancy};}
    count++;jitter=Math.max(jitter,Math.abs(s.center.x-anchor.x));
    if(last-start>=1000&&count>=8){baseline={...anchor,width,height,...s.bounds,reach:pose?.reach??null,spread:pose?.spread??null};stage='explore';}
   }else if(stage==='explore'){
    const ratio=s.occupancy/baseline.occupancy,scale=width/baseline.width,heightRatio=height/baseline.height;
    if(ratio<.75||ratio>1.25||heightRatio<.8||heightRatio>1.2){candidate=null;return snapshot();}
    const dx=s.center.x-baseline.x;
    const kind=dx<-.015?'left':dx>.015?'right':'neutral';
    if(!candidate||candidate.kind!==kind)candidate={kind,start:last,count:0};candidate.count++;
    if(last-candidate.start>=250&&candidate.count>=3&&scale>.8&&scale<1.2){if(dx<0)left=Math.max(left,-dx);else right=Math.max(right,dx);}
    // Widening with constant occupied area/height is evidence of changed posture,
    // whereas uniform growth toward the camera is not.
    if(Math.abs(ratio-1)<.15&&Math.abs(heightRatio-1)<.08&&Math.abs(dx)<.03&&scale>1.08)expansion=Math.max(expansion,scale-1);
    if(!pose){poseCandidate=null;}
    else if(baseline.reach!==null&&pose.timestamp>lastPose){
     const delta=pose.reach-baseline.reach;
     if(delta<.3)poseCandidate=null;
     else{if(!poseCandidate||pose.timestamp-lastPose>500)poseCandidate={start:pose.timestamp,count:0,peak:delta};poseCandidate.count++;poseCandidate.peak=Math.max(poseCandidate.peak,delta);if(poseCandidate.count>=3&&pose.timestamp-poseCandidate.start>=250)reach=Math.max(reach,poseCandidate.peak);}
     lastPose=pose.timestamp;
    }
   }
   return snapshot();
  },
  finish(){const s=snapshot();if(baseline&&s.capabilities.length){stage='done';}return snapshot();},
  assisted(){baseline={x:.5,y:.5,occupancy:.05,width:.14,height:.18,minX:.43,maxX:.57,minY:.41,maxY:.59,reach:0,spread:0};left=right=.3;expansion=.5;reach=1;stage='done';return snapshot();}
 };return api;
}
