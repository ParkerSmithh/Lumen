import {createEnergyCalibration,freshEnergyPose} from './energyCalibration.js';
export const ENERGY_RULES_VERSION=1;
export const ENERGY_LIMITS=Object.freeze({orbs:6,hazards:2,trailSamples:12,spawnAttempts:12,events:16,duration:90});
export const comboMultiplier=n=>Math.min(5,Math.max(1,Math.ceil(n/2)));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const slot=()=>({active:false,generation:0,trail:new Float32Array(24),trailCount:0});
export function createEnergyRush({seed=Date.now(),scope=0}={}){
 const calibration=createEnergyCalibration(),orbPool=Array.from({length:6},slot),hazardPool=Array.from({length:2},slot);
 let randomSeed=seed>>>0,phase='READY',returnPhase='PLAYING',inputMode='body',session=0,last=null,clock=0,countdown=3,score=0,combo=0,maxCombo=0,shields=3,collections=0,challenges=0;
 let feverEnd=0,feverArmed=true,invulnerableUntil=0,nextOrb=.2,nextHazard=3,nextChallenge=15,challenge=null,challengeSerial=0,events=[],cal=null,calStart=null,calElapsed=0,recalibrating=false;
 let freshStart=null,recoveryAnchor=null,recovered=true,needsRecalibration=false,lastSample=-Infinity,lastContact=-Infinity,exclusions=[],lastInput=null,feedback='',feedbackUntil=0,endReason='';
 const blockers=new Set(),external=new Set();
 const rng=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;};
 const active=pool=>pool.filter(o=>o.active);
 const fever=()=>clock<feverEnd;
 const emit=(kind,p,extra={})=>{const {id,...details}=extra;events.push({kind,id:`rush:${scope}:${session}:${kind}:${id??Math.round(clock*1000)}`,x:p.x,y:p.y,time:clock,...details});if(events.length>16)events.shift();};
 const notice=text=>{feedback=text;feedbackUntil=clock+1.2;};
 const clearObjects=()=>{for(const o of [...orbPool,...hazardPool]){o.active=false;o.trailCount=0;o.contactCount=0;}lastContact=-Infinity;};
 const fresh=(input,now)=>!!(input?.snapshot.valid&&input.fresh(now));
 const clean=()=>{clock=score=combo=maxCombo=collections=challenges=feverEnd=0;shields=3;countdown=3;nextOrb=.2;nextHazard=3;nextChallenge=15;feverArmed=true;invulnerableUntil=0;challenge=null;events=[];blockers.clear();external.clear();feedback='';endReason='';calibration.reset();cal=null;calStart=null;calElapsed=0;recalibrating=false;freshStart=null;recoveryAnchor=null;recovered=true;needsRecalibration=false;lastSample=-Infinity;clearObjects();};
 function finish(reason){phase='RESULTS';endReason=reason;challenge=null;clearObjects();emit('energy-end',{x:.5,y:.5},{score});}
 function inExcluded(x,y,r){return exclusions.some(b=>x+r>b.minX&&x-r<b.maxX&&y+r*4/3>b.minY&&y-r*4/3<b.maxY);}
 function reachable(input,x,y,r){
  if(inputMode==='assist')return true;
  const b=cal.baseline,center=input.snapshot.center;
  const left=cal.envelope.minX-b.minX,right=cal.envelope.maxX-b.maxX;
  // Translate the current real silhouette through the demonstrated lateral
  // envelope. A bounding box alone can include unreachable empty corners.
  for(let i=0;i<5;i++){const target=b.x+left+(right-left)*i/4;if(input.contact(x-(target-center.x),y,r))return true;}
  return false;
 }
 function spawn(pool,hazard,input){
  const o=pool.find(v=>!v.active),env=cal?.envelope;if(!o||!env)return;
  const range=Math.max(cal.baseline.minX-env.minX,env.maxX-cal.baseline.maxX);
  const radius=hazard?.026:inputMode==='assist'?.024:clamp(range*.3,.008,.024);
  if(env.maxX-env.minX<radius*4||env.maxY-env.minY<radius*4)return;
  for(let attempt=0;attempt<12;attempt++){
   const x=env.minX+radius+(env.maxX-env.minX-radius*2)*rng(),y=env.minY+radius*4/3+(env.maxY-env.minY-radius*8/3)*rng();
   if(inExcluded(x,y,radius*2)||input.contact(x,y,radius)||!hazard&&!reachable(input,x,y,radius)||[...active(orbPool),...active(hazardPool)].some(p=>Math.hypot(p.x-x,p.y-y)<.11))continue;
   o.generation++;Object.assign(o,{active:true,id:`${scope}:${session}:${hazard?'h':'o'}:${pool.indexOf(o)}:${o.generation}`,x,y,px:x,py:y,radius,born:clock,warning:hazard?1.2:.5,life:hazard?8:7,vx:(rng()-.5)*(hazard?.06:.025),vy:(rng()-.5)*.02,kind:hazard?(rng()>.5?'ring':'danger'):'orb',contactCount:0,trailCount:0,colorIndex:Math.floor(rng()*4)});return;
  }
 }
 function move(pool,dt){for(const o of pool)if(o.active){o.px=o.x;o.py=o.y;if(clock-o.born<o.warning)continue;o.x=clamp(o.x+o.vx*dt,cal.envelope.minX+o.radius,cal.envelope.maxX-o.radius);o.y=clamp(o.y+o.vy*dt,cal.envelope.minY+o.radius,cal.envelope.maxY-o.radius);if(o.x===cal.envelope.minX+o.radius||o.x===cal.envelope.maxX-o.radius)o.vx*=-1;if(clock-o.born>o.life){o.active=false;continue;}if(o.trailCount<12)o.trailCount++;o.trail.copyWithin(2,0,22);o.trail[0]=o.x;o.trail[1]=o.y;}}
 function collide(input,s){
  if(s.timestamp<=lastContact)return;const distinct=s.timestamp-lastContact<=250;lastContact=s.timestamp;
  for(const o of orbPool)if(o.active&&clock-o.born>=o.warning){
   if(inExcluded(o.x,o.y,o.radius))continue;
   if(input.sweep({x:o.px,y:o.py},{x:o.x,y:o.y},o.radius,true)){
    o.active=false;combo++;maxCombo=Math.max(maxCombo,combo);const points=100*comboMultiplier(combo);score+=points;collections++;
    emit('energy-orb',o,{id:o.id,points,combo});notice(`+${points} · ${comboMultiplier(combo)}×`);
    if(combo===9&&feverArmed&&!fever()){feverEnd=clock+8;feverArmed=false;emit('energy-milestone',o,{id:`fever:${o.id}`,combo});notice('ENERGY FEVER');}
   }
  }
  for(const h of hazardPool)if(h.active&&clock-h.born>=h.warning){
   if(inExcluded(h.x,h.y,h.radius)){h.contactCount=0;continue;}
   const hit=input.sweep({x:h.px,y:h.py},{x:h.x,y:h.y},h.radius);
   h.contactCount=hit?(distinct?h.contactCount+1:1):0;
   if(h.contactCount>=2&&clock>=invulnerableUntil){h.active=false;shields--;combo=0;if(!fever())feverArmed=true;invulnerableUntil=clock+1.5;emit('energy-damage',h,{id:h.id});notice('SHIELD USED');if(shields===0){finish('shields');return;}}
  }
 }
 function challengeStep(s,body,now){
  const pose=inputMode==='assist'?null:freshEnergyPose(body,now);
  const ratio=s.occupancy/cal.baseline.occupancy,stable=inputMode==='assist'||ratio>.75&&ratio<1.25;
  if(!challenge&&clock>=nextChallenge){
   const kinds=cal.capabilities.filter(k=>k!=='reach'||inputMode==='assist'||pose);
   if(kinds.length){const kind=kinds[Math.floor(rng()*kinds.length)];challenge={id:++challengeSerial,kind,start:clock,end:clock+8,neutral:false,hold:0,last:null};}
   nextChallenge=clock+15;
  }
  if(!challenge)return;
  if(clock>=challenge.end||challenge.kind==='reach'&&inputMode!=='assist'&&!pose){challenge=null;return;}
  const dx=s.center.x-cal.baseline.x,width=s.bounds.maxX-s.bounds.minX;
  const value=challenge.kind==='left'?-dx:challenge.kind==='right'?dx:challenge.kind==='expand'?(inputMode==='assist'?(s.actions.expand?.5:0):width/cal.baseline.width-1):(inputMode==='assist'?(s.actions.reach?1:0):pose.reach-cal.baseline.reach);
  const target=cal.targets[challenge.kind];
  if(value<target*.4)challenge.neutral=true;
  const evidenceTime=challenge.kind==='reach'&&inputMode==='body'?pose.timestamp:s.timestamp;
  if(challenge.last!==null&&evidenceTime<=challenge.last)return;
  const gap=challenge.last===null?0:evidenceTime-challenge.last;
  if(gap>(challenge.kind==='reach'?500:250))challenge.hold=0;
  const dt=challenge.last===null?0:Math.min(.25,gap/1000);challenge.last=evidenceTime;
  challenge.hold=stable&&challenge.neutral&&value>=target?challenge.hold+dt:0;
  if(challenge.hold>=.3){score+=250;challenges++;emit('energy-challenge',s.center,{id:`challenge:${challenge.id}`,points:250});notice('CHALLENGE +250');challenge=null;}
 }
 const api={
  get snapshot(){return {phase,inputMode,session,score,combo,multiplier:comboMultiplier(combo),maxCombo,shields,collections,challenges,elapsed:clock,remaining:Math.max(0,90-clock),countdown:Math.ceil(countdown),fever:fever(),feverRemaining:Math.max(0,feverEnd-clock),invulnerable:clock<invulnerableUntil,calibration:calibration.snapshot,canResume:phase==='PAUSED'&&recovered&&external.size===0,blockers:[...blockers],endReason,feedback:clock<feedbackUntil?feedback:'',challenge:challenge&&{kind:challenge.kind,remaining:Math.ceil(challenge.end-clock)},orbs:active(orbPool).map(({trail,...o})=>({...o})),hazards:active(hazardPool).map(({trail,...o})=>({...o}))};},
  get scene(){return {phase,inputMode,clock,fever:fever(),invulnerable:clock<invulnerableUntil,orbs:orbPool,hazards:hazardPool,center:lastInput?.snapshot.center,feedback:clock<feedbackUntil?feedback:'',shields};},
  start(now,mode='body'){if(!['READY','RESULTS'].includes(phase))return false;clean();session++;inputMode=mode;last=now;if(mode==='assist'){cal=calibration.assisted();phase='COUNTDOWN';}else phase='CALIBRATING';return true;},
  pause(reason='user',now=last){if(!['CALIBRATING','COUNTDOWN','PLAYING','PAUSED'].includes(phase))return; if(phase!=='PAUSED')returnPhase=phase;phase='PAUSED';blockers.add(reason);last=now;lastContact=-Infinity;},
  resume(now){if(phase!=='PAUSED'||!recovered||external.size)return false;blockers.clear();phase=returnPhase;last=now;lastSample=lastContact=-Infinity;invulnerableUntil=Math.max(invulnerableUntil,clock+.5);for(const h of hazardPool)if(h.active){h.born=clock;h.contactCount=0;}return true;},
  recalibrate(now){if(!['PLAYING','PAUSED','COUNTDOWN','CALIBRATING'].includes(phase))return;clearObjects();calibration.reset();calStart=null;calElapsed=0;cal=null;challenge=null;needsRecalibration=false;recalibrating=true;phase='CALIBRATING';last=now;blockers.clear();},
  finishCalibration(){const result=calibration.finish();if(result.ready){cal=result;phase=recalibrating?'PAUSED':'COUNTDOWN';returnPhase='PLAYING';recovered=true;if(recalibrating)blockers.add('recalibration');}return result.ready;},
  exit(){clean();phase='READY';last=null;lastInput=null;},
  drainEvents(){const out=events;events=[];return out;},
  frame(now,{input,body=null,blocked=[],excluded=[]}={}){
   if(!Number.isFinite(now)||last!==null&&now<last)return;
   const dt=last===null?0:(now-last)/1000;last=now;lastInput=input;exclusions=excluded;
   if(phase==='READY'||phase==='RESULTS')return;
   external.clear();for(const reason of blocked)external.add(reason);
   const isFresh=fresh(input,now),s=input?.snapshot;
   if(!isFresh){external.add('tracking');recovered=false;freshStart=null;recoveryAnchor=null;lastSample=-Infinity;}
   else if(!recovered&&s.timestamp>lastSample){
    if(s.timestamp-lastSample>250||!recoveryAnchor||Math.hypot(s.center.x-recoveryAnchor.x,s.center.y-recoveryAnchor.y)>.025||Math.abs(s.occupancy/recoveryAnchor.occupancy-1)>.15){freshStart=s.timestamp;recoveryAnchor={...s.center,occupancy:s.occupancy};}
    lastSample=s.timestamp;if(s.timestamp-freshStart>=1000)recovered=true;
   }
   if(isFresh&&inputMode==='body'&&cal&&phase!=='CALIBRATING'){
    const ratio=s.occupancy/cal.baseline.occupancy,width=(s.bounds.maxX-s.bounds.minX)/cal.baseline.width,height=(s.bounds.maxY-s.bounds.minY)/cal.baseline.height;
    if(ratio<.65||ratio>1.5||(width<.75||width>1.25)&&(height<.8||height>1.2))needsRecalibration=true;
   }
   if(needsRecalibration)external.add('framing');
   if(external.size){for(const reason of external)api.pause(reason,now);return;}
   if(phase==='PAUSED')return;
   if(dt>.25){api.pause('interrupted',now);return;}
   if(phase==='CALIBRATING'){
    if(inputMode==='assist'){cal=calibration.assisted();phase='PAUSED';returnPhase='PLAYING';blockers.add('recalibration');return;}
    calibration.sample(s,now,body);calStart??=now;calElapsed+=dt;
    if(calibration.snapshot.stage==='explore'&&calElapsed>=6)api.finishCalibration();return;
   }
   if(phase==='COUNTDOWN'){countdown=Math.max(0,countdown-dt);if(countdown===0){phase='PLAYING';lastContact=-Infinity;}return;}
   // Bound physical catch-up independently: accepted active time must never slow
   // down with rendering cadence while masks are still fresh.
   clock=Math.min(90,clock+dt);if(clock>=90){finish('time');return;}
   let remaining=Math.min(dt,4/30);
   while(remaining>0&&phase==='PLAYING'){
    const step=Math.min(remaining,1/30);remaining-=step;
    move(orbPool,step);move(hazardPool,step);
   }
   const cap=fever()?6:4;
   if(clock>=nextOrb){if(active(orbPool).length<cap)spawn(orbPool,false,input);nextOrb=clock+(fever()?.55:.9);}
   if(clock>=nextHazard){if(active(hazardPool).length<2)spawn(hazardPool,true,input);nextHazard=clock+4.5;}
   collide(input,s);if(phase==='PLAYING')challengeStep(s,body,now);
  }
 };return api;
}
