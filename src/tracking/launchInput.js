import { predictHandPoint } from './handPointer.js';
import { fitContain } from './utils.js';
export function mapLaunchPointer(hand,width,height,now=hand?.timestamp) {
  if(!hand?.handDetected)return null;
  const point=predictHandPoint(hand,now);if(!point)return null;
  const rect=fitContain(hand.sourceWidth,hand.sourceHeight,width,height);
  return {active:true,x:(rect.x+point.x*rect.width)/width,y:(rect.y+point.y*rect.height)/height,
    timestamp:hand.timestamp,sequence:hand.sequence,reset:hand.reset,motionRejected:hand.motionRejected,resetReason:hand.resetReason,source:'hand',aspect:width/height};
}
export function consumeLaunchInput(state,pointer,now) {
  if(!pointer?.active||!Number.isFinite(pointer.x)||!Number.isFinite(pointer.y)||!Number.isFinite(pointer.timestamp)||now-pointer.timestamp>250||pointer.timestamp>now+10){state.active=false;return null;}
  if(pointer.sequence===state.sequence)return null;
  const x=Math.max(0,Math.min(1,pointer.x)),y=Math.max(0,Math.min(1,pointer.y));
  const dt=(pointer.timestamp-state.timestamp)/1000;
  const dx=(x-state.x)*(pointer.aspect||1),dy=y-state.y;
  const distance=Math.hypot(dx,dy),speed=distance/dt;
  const baseline=!state.active||pointer.reset||pointer.source!==state.source||dt<=0||dt>.25||distance>.65||speed>12;
  Object.assign(state,{x,y,timestamp:pointer.timestamp,sequence:pointer.sequence,source:pointer.source,active:true});
  const strength=baseline?0:Math.max(0,Math.min(1,(speed-.8)/1.6));
  const nudge=baseline?0:Math.max(0,Math.min(.06,(speed-.05)*.08));
  return {x,y,baseline,strength,nudge,speed:baseline?0:Math.min(4,speed),dt:baseline?0:dt};
}
// Units are the supplied solver's per-step velocity, not world units/second.
export function localImpulse(distance,radius,strength) {
  if(!Number.isFinite(distance+radius+strength)||radius<=0||distance>=radius)return 0;
  const falloff=Math.max(0,1-distance/radius);
  return .12*Math.max(0,Math.min(1,strength))*falloff*falloff;
}
