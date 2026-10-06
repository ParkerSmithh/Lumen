const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const finite=p=>p&&Number.isFinite(p.x+p.y);
const delta=(a,b)=>a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;
const boundedVelocity=(x,y)=>{const length=Math.hypot(x,y),scale=length>6?6/length:1;return {x:x*scale,y:y*scale};};

// Mirror once here. Gesture consumers receive the same accepted motion.
export function updateHand(previous,landmarks,timestamp,sequence){
 const tip=landmarks?.[8],wristRaw=landmarks?.[0];
 if(!finite(tip)||!finite(wristRaw))return {handDetected:false,timestamp,sequence,velocity:{x:0,y:0},reset:true,resetReason:'loss',lastValid:previous?.handDetected?previous:previous?.lastValid};
 const raw={x:clamp(1-tip.x),y:clamp(tip.y)},wrist={x:clamp(1-wristRaw.x),y:clamp(wristRaw.y)};
 const knuckles=[5,9,17].map(i=>landmarks[i]);
 const palm=knuckles.every(finite)?{x:clamp(1-(wristRaw.x+knuckles.reduce((sum,p)=>sum+p.x,0))/4),y:clamp((wristRaw.y+knuckles.reduce((sum,p)=>sum+p.y,0))/4)}:wrist;
 const dt=previous?.handDetected?(timestamp-(previous.motionTimestamp??previous.timestamp))/1000:0;
 const accepted=previous?.acceptedRaw||previous?.rawIndex||previous?.indexFinger;
 const travel=delta(raw,accepted),palmTravel=delta(palm,previous?.palm),wristTravel=delta(wrist,previous?.wrist);
 const coordinated=Math.max(palmTravel,wristTravel)>=travel*.3;
 let resetReason=!previous?.handDetected?'acquired':dt<=0?'timestamp':dt>.25?'gap':travel>.65?'jump':null;
 if(!resetReason&&travel>.28&&!coordinated){
  if(previous?.motionRejected&&delta(raw,previous.rejectedRaw)<.05)resetReason='jump-confirmed';
  else return {...previous,rawIndex:raw,rejectedRaw:raw,motionRejected:true,timestamp,sequence,velocity:{x:0,y:0},palmVelocity:{x:0,y:0},reset:false,resetReason:'spike',filterLag:delta(raw,previous.indexFinger)};
 }
 const reset=!!resetReason,speed=reset?0:travel/dt;
 // Stationary jitter remains filtered; deliberate motion follows almost immediately.
 const smoothingMs=28-22*clamp(speed/1.2),alpha=reset?1:1-Math.exp(-dt/(smoothingMs/1000));
 const point=reset?raw:{x:previous.indexFinger.x+(raw.x-previous.indexFinger.x)*alpha,y:previous.indexFinger.y+(raw.y-previous.indexFinger.y)*alpha};
 const velocity=reset?{x:0,y:0}:boundedVelocity((point.x-previous.indexFinger.x)/dt,(point.y-previous.indexFinger.y)/dt);
 const palmVelocity=reset||!previous.palm?{x:0,y:0}:boundedVelocity((palm.x-previous.palm.x)/dt,(palm.y-previous.palm.y)/dt);
 const history=[...(reset?[]:previous.history||[]),{point,raw,palm,timestamp}].slice(-5);
 return {handDetected:true,rawIndex:raw,acceptedRaw:raw,indexFinger:point,palm,palmVelocity,wrist,landmarks,velocity,timestamp,motionTimestamp:timestamp,sequence,reset,resetReason,motionRejected:false,smoothingMs,filterLag:delta(raw,point),rawSpeed:speed,travel,coordinated,history};
}

export function predictHandPoint(hand,now){
 if(!hand?.handDetected||!hand.indexFinger||now-hand.timestamp>250)return null;
 const point=hand.indexFinger;
 if(hand.reset||hand.motionRejected)return {...point};
 const seconds=Math.max(0,Math.min(45,now-hand.timestamp))/1000;
 let dx=hand.velocity.x*seconds,dy=hand.velocity.y*seconds,length=Math.hypot(dx,dy);
 if(length>.04){dx*=.04/length;dy*=.04/length;}
 return {x:clamp(point.x+dx),y:clamp(point.y+dy)};
}

// Geometry follows accepted travel. Only applied force is capped.
export function consumePointer(state,pointer,now){
 if(!pointer?.active||!Number.isFinite(pointer.timestamp)||now-pointer.timestamp>250||pointer.timestamp>now+10||!Number.isFinite(pointer.x+pointer.y)){state.active=false;return null;}
 if(pointer.sequence===state.sequence)return null;
 const x=clamp(pointer.x),y=clamp(pointer.y),gap=pointer.timestamp-state.timestamp;
 const baseline=!state.active||pointer.reset||pointer.source!==state.source||gap<=0||gap>250||Math.hypot(x-state.x,y-state.y)>.65;
 const startX=baseline?x:state.x,startY=baseline?y:state.y;
 let dx=x-startX,dy=y-startY,length=Math.hypot(dx,dy);
 if(length>.08){dx*=.08/length;dy*=.08/length;}
 Object.assign(state,{active:true,x,y,timestamp:pointer.timestamp,sequence:pointer.sequence,source:pointer.source});
 const speed=Math.min(6,Math.hypot(pointer.velocityX||0,pointer.velocityY||0));
 return {x,y,startX,startY,deltaX:dx,deltaY:dy,baseline,force:clamp(.8+speed*.25,.8,1.6),inkEnergy:clamp(1+length*10,1,4)};
}
