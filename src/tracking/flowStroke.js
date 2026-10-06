export function interpolateStroke(movement,spacing=.012){
 if(movement.baseline)return [];
 const length=Math.hypot(movement.x-movement.startX,movement.y-movement.startY);
 if(!Number.isFinite(length)||length<.0005)return [];
 const count=Math.max(1,Math.min(24,Math.ceil(length/Math.max(.003,spacing))));
 return Array.from({length:count},(_,i)=>({x:movement.startX+(movement.x-movement.startX)*(i+1)/count,y:movement.startY+(movement.y-movement.startY)*(i+1)/count,dx:movement.deltaX*movement.force/count,dy:movement.deltaY*movement.force/count,ink:1/count}));
}
