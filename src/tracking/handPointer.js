const clamp = (value,min=0,max=1) => Math.max(min,Math.min(max,value));

// Mirroring lives here. Renderers receive already mirrored, top-left coordinates.
export function updateHand(previous, landmarks, timestamp, sequence) {
  const tip=landmarks?.[8], wrist=landmarks?.[0];
  if (!tip || !wrist || !Number.isFinite(tip.x+tip.y+wrist.x+wrist.y)) return { handDetected:false, timestamp, sequence, velocity:{x:0,y:0}, reset:true,resetReason:'loss' };
  const raw={x:clamp(1-tip.x),y:clamp(tip.y)};
  const dt=previous ? (timestamp-previous.timestamp)/1000 : 0;
  const reset=!previous?.handDetected || dt<=0 || dt>.25 || Math.hypot(raw.x-previous.indexFinger.x,raw.y-previous.indexFinger.y)>.25;
  const resetReason=!previous?.handDetected?'acquired':dt<=0?'timestamp':dt>.25?'gap':reset?'jump':null;
  const alpha=reset ? 1 : 1-Math.exp(-dt/.035);
  const point=reset ? raw : {x:previous.indexFinger.x+(raw.x-previous.indexFinger.x)*alpha,y:previous.indexFinger.y+(raw.y-previous.indexFinger.y)*alpha};
  let dx=reset ? 0 : point.x-previous.indexFinger.x,dy=reset ? 0 : point.y-previous.indexFinger.y;
  if (Math.hypot(dx,dy)<.0015 && !reset) { point.x=previous.indexFinger.x; point.y=previous.indexFinger.y; dx=dy=0; }
  const knuckles=[5,9,17].map(i=>landmarks[i]);
  const palm=knuckles.every(p=>p&&Number.isFinite(p.x+p.y))?{x:clamp(1-(wrist.x+knuckles.reduce((sum,p)=>sum+p.x,0))/4),y:clamp((wrist.y+knuckles.reduce((sum,p)=>sum+p.y,0))/4)}:null;
  const palmVelocity=reset||!palm||!previous?.palm?{x:0,y:0}:{x:clamp((palm.x-previous.palm.x)/dt,-3,3),y:clamp((palm.y-previous.palm.y)/dt,-3,3)};
  return { handDetected:true,rawIndex:raw,indexFinger:point,palm,palmVelocity,wrist:{x:clamp(1-wrist.x),y:clamp(wrist.y)},landmarks,
    velocity:{x:reset?0:clamp(dx/dt,-3,3),y:reset?0:clamp(dy/dt,-3,3)},timestamp,sequence,reset,resetReason };
}

// Consume once per inference/event, never once per display frame.
export function consumePointer(state, pointer, now) {
  if (!pointer?.active || now-pointer.timestamp>250 || !Number.isFinite(pointer.x+pointer.y)) { state.active=false; return null; }
  if (pointer.sequence===state.sequence) return null;
  const x=clamp(pointer.x),y=clamp(pointer.y);
  const baseline=!state.active || pointer.reset || pointer.source!==state.source || Math.hypot(x-state.x,y-state.y)>.25;
  const startX=baseline?x:state.x,startY=baseline?y:state.y;
  let dx=x-startX,dy=y-startY;
  const length=Math.hypot(dx,dy);
  if(length>.08){dx*=.08/length;dy*=.08/length;}
  Object.assign(state,{active:true,x,y,sequence:pointer.sequence,source:pointer.source});
  const speed=Math.min(3,Math.hypot(pointer.velocityX||0,pointer.velocityY||0));
  return {x,y,startX,startY,deltaX:dx,deltaY:dy,baseline,force:clamp(.65+speed*.32,.65,1.6)};
}
