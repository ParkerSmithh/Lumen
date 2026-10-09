import {grabFeatures} from './grabDetector.js';
import {pushFeatures} from './pushDetector.js';
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
export function buildPulseHandInput(hand,blocked=false){
 const grab=grabFeatures(hand),push=pushFeatures(hand),open=!!grab&&grab.ratios.every(r=>r>1.12);
 return {active:!!(hand?.handDetected??hand?.active)&&!!grab&&!!push,timestamp:hand?.timestamp,sequence:hand?.sequence,reset:hand?.reset,motionRejected:hand?.motionRejected,open,neutral:!!grab&&!open&&!grab.closed&&!push?.pointing,center:grab?.center,scale:push?.scale,blocked};
}
export function createPulseDetector(){
 let state='WAIT_NEUTRAL',lastSequence,lastTime=null,neutralStart=null,holdStart=null,anchor=null,baseScale=0,samples=0,lastFire=-Infinity;
 const disarm=()=>{state='WAIT_NEUTRAL';neutralStart=holdStart=null;anchor=null;samples=0;};
 const reset=()=>{disarm();lastSequence=undefined;lastTime=null;lastFire=-Infinity;};
 const result=(triggered=false,p=null)=>({triggered,state,point:p?{...p}:null});
 return {reset,update(input,now){
  if(state==='FIRED')disarm();
  const invalid=!Number.isFinite(now)||!input?.active||!Number.isFinite(input.timestamp)||input.timestamp>now||now-input.timestamp>150||input.reset||input.motionRejected||input.blocked||!point(input.center)||!Number.isFinite(input.scale)||input.scale<=0;
  if(invalid){disarm();lastTime=null;lastSequence=input?.sequence;return result();}
  if(input.sequence===lastSequence)return result();
  const gap=lastTime!==null&&(input.timestamp-lastTime>150||input.timestamp<=lastTime);
  lastSequence=input.sequence;lastTime=input.timestamp;
  if(gap){disarm();return result();}
  if(state==='WAIT_NEUTRAL'){
   if(input.neutral){neutralStart??=input.timestamp;if(input.timestamp-neutralStart>=200&&now-lastFire>=3000)state='ARMED';}else neutralStart=null;
   return result();
  }
  if(!input.open){holdStart=null;samples=0;state='ARMED';return result();}
  if(state==='ARMED'){state='HOLDING';holdStart=input.timestamp;anchor={...input.center};baseScale=input.scale;samples=1;return result();}
  if(Math.hypot(input.center.x-anchor.x,input.center.y-anchor.y)>.035||Math.abs(input.scale/baseScale-1)>.08){disarm();return result();}
  samples++;
  if(input.timestamp-holdStart>=1200&&samples>=12){lastFire=now;disarm();state='FIRED';return result(true,input.center);}
  return result();
 }};
}


