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
// Two valid poses confirm closure/release. Acquisition in a fist must open first.
export function createGrabDetector(){
 let active=false,ready=false,lastSequence=null,lastTime=-Infinity,closeSamples=0,openSamples=0,lastCenter=null;
 const reset=()=>{active=false;ready=false;lastSequence=null;lastTime=-Infinity;closeSamples=openSamples=0;lastCenter=null;};
 return {reset,update(input,now){
  const invalid=!input?.active||!input.features?.center||!Number.isFinite(input.features.center.x+input.features.center.y)||!Number.isFinite(input.timestamp)||now-input.timestamp>250||input.timestamp>now+10||input.motionRejected&&now-lastTime>250;
  if(invalid){const lost=active;reset();return {active:false,begin:false,released:false,lost};}
  if(input.sequence===lastSequence)return {active,begin:false,released:false,center:lastCenter};
  if(input.motionRejected){lastSequence=input.sequence;return {active,begin:false,released:false,center:lastCenter,blocksCreation:true};}
  const f=input.features,dt=input.timestamp-lastTime,jump=lastCenter&&Math.hypot(f.center.x-lastCenter.x,f.center.y-lastCenter.y)>.35;
  if(!Number.isFinite(f.center.x+f.center.y)||dt<=0||dt>250||jump||input.reset&&!['jump','jump-confirmed','spike'].includes(input.resetReason)){const lost=active;reset();lastSequence=input.sequence;lastTime=input.timestamp;lastCenter=f.center;ready=f.open;return {active:false,begin:false,released:false,lost,center:f.center,blocksCreation:f.closed||f.open};}
  lastSequence=input.sequence;lastTime=input.timestamp;lastCenter=f.center;
  let begin=false,released=false;
  if(!active){if(f.open)ready=true;closeSamples=ready&&f.closed?closeSamples+1:0;if(closeSamples>=2){active=true;begin=true;closeSamples=0;}}
  else{openSamples=f.open?openSamples+1:0;if(openSamples>=2){active=false;released=true;ready=true;openSamples=0;}}
  return {active,begin,released,lost:false,center:f.center,blocksCreation:active||f.closed||f.open||released};
 }};
}
