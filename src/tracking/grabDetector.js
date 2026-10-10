import {pushFeatures} from './pushDetector.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
export function launchPointFeatures(hand){
 const f=pushFeatures(hand),p=hand?.rawLandmarks||hand?.landmarks;if(!f||!p)return f;
 const reach=distance(p[0],p[8]);
 return {...f,pointing:f.pointing&&[12,16,20].filter(i=>distance(p[0],p[i])<reach*.65).length>=2};
}
export function grabFeatures(hand){
 const p=hand?.rawLandmarks||hand?.landmarks;if(!p||![0,5,6,8,9,10,12,14,16,17,18,20].every(i=>p[i]&&Number.isFinite(p[i].x+p[i].y+(p[i].z||0))))return null;
 const ratios=[8,12,16,20].map(i=>distance(p[0],p[i])/Math.max(.001,distance(p[0],p[i-2])));
 const curled=ratios.filter(r=>r<.95).length;
 const center={x:1-[0,5,9,17].reduce((sum,i)=>sum+p[i].x,0)/4,y:[0,5,9,17].reduce((sum,i)=>sum+p[i].y,0)/4};
 return {closed:ratios[0]<.95&&curled>=3,open:ratios[0]>1.12&&ratios.filter(r=>r>1.12).length>=3,center,ratios};
}
export function launchGrabFeatures(hand){
 const f=grabFeatures(hand);return f&&{...f,closed:!launchPointFeatures(hand)?.pointing&&f.ratios.filter(r=>r<1.02).length>=3,open:f.ratios.filter(r=>r>1.12).length>=3};
}
// Confirmation uses fresh observations, never repeated render frames or missing poses.
export function createGrabDetector(){
 let active=false,ready=false,lastSequence=null,lastTime=-Infinity,lastCenter=null,closeSince=null,openSince=null,closeSamples=0,openSamples=0,intentUntil=-Infinity;
 const reset=()=>{active=false;ready=false;lastSequence=null;lastTime=-Infinity;lastCenter=null;closeSince=openSince=null;closeSamples=openSamples=0;intentUntil=-Infinity;};
 const output=(now,extra={})=>({active,begin:false,released:false,lost:false,center:lastCenter,fresh:false,canAcquire:active&&now<=intentUntil,grabIntentUntil:intentUntil,blocksCreation:active,...extra});
 const lose=now=>{const lost=active;reset();return output(now,{lost});};
 return {reset,update(input,now){
  if(!Number.isFinite(now))return lose(now);
  const age=now-lastTime;
  const hardInvalid=input&&(input.timestamp>now+10||Number.isFinite(input.timestamp)&&now-input.timestamp>250);
  if(hardInvalid)return lose(now);
  const f=input?.features;
  if(input?.active&&!input.motionRejected&&input.sequence===lastSequence&&f?.center){if(age>120)return lose(now);return output(now,{blocksCreation:active||f.closed||f.open});}
  if(!input?.active||!f?.center||!Number.isFinite(f.center.x+f.center.y)||!Number.isFinite(input.timestamp)||input.motionRejected||input.sequence===lastSequence){
   closeSince=openSince=null;closeSamples=openSamples=0;
   if(age>120)return lose(now);
   return output(now,{canAcquire:false,blocksCreation:active||!!input?.motionRejected});
  }
  const dt=input.timestamp-lastTime,jump=lastCenter&&Math.hypot(f.center.x-lastCenter.x,f.center.y-lastCenter.y)>.35;
  if(dt<=0||dt>250||active&&dt>120||jump||input.reset&&!['jump','jump-confirmed','spike'].includes(input.resetReason)){
   const lost=active;reset();lastSequence=input.sequence;lastTime=input.timestamp;lastCenter=f.center;ready=f.open;
   return output(now,{lost,fresh:true,blocksCreation:f.closed||f.open});
  }
  lastSequence=input.sequence;lastTime=input.timestamp;lastCenter={...f.center};
  let begin=false,released=false;
  if(!active){
   if(f.open)ready=true;
   if(ready&&f.closed){closeSince??=input.timestamp;closeSamples++;}else{closeSince=null;closeSamples=0;}
   if(closeSamples>=2&&input.timestamp-closeSince>=60){active=true;begin=true;intentUntil=now+150;closeSince=null;closeSamples=0;}
  }else{
   if(f.open){openSince??=input.timestamp;openSamples++;}else{openSince=null;openSamples=0;}
   if(openSamples>=2&&input.timestamp-openSince>=60){active=false;released=true;ready=true;openSince=null;openSamples=0;intentUntil=-Infinity;}
  }
  return output(now,{begin,released,fresh:true,blocksCreation:active||f.closed||f.open||released});
 }};
}
