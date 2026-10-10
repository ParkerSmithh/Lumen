const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function energyKeyDirection(code){return ({ArrowLeft:{x:-1,y:0},KeyA:{x:-1,y:0},ArrowRight:{x:1,y:0},KeyD:{x:1,y:0},ArrowUp:{x:0,y:-1},KeyW:{x:0,y:-1},ArrowDown:{x:0,y:1},KeyS:{x:0,y:1}})[code]??null;}
export function createAssistField(){
 let center={x:.5,y:.5},previous={...center},timestamp=-Infinity,prior=-Infinity,actions={expand:false,reach:false};
 let aspect=4/3;const radius=.065;
 function hit(p,x,y,r){return (p.x-x)**2+((p.y-y)/aspect)**2<=(radius+r)**2;}
 return {get snapshot(){const r=radius*(actions.expand?1.5:1);return {valid:Number.isFinite(timestamp),timestamp,center:{...center},occupancy:.05,aspect,continuous:timestamp-prior<=250,bounds:{minX:center.x-r,maxX:center.x+r,minY:center.y-r*aspect,maxY:center.y+r*aspect},actions:{...actions},assisted:true};},
  update(time,position){if(!Number.isFinite(time)||time<=timestamp)return;prior=timestamp;previous={...center};timestamp=time;if(Number.isFinite(position?.aspect)&&position.aspect>0)aspect=clamp(position.aspect,.25,4);if(position&&Number.isFinite(position.x)&&Number.isFinite(position.y))center={x:clamp(position.x,.06,.94),y:clamp(position.y,.1,.9)};actions={expand:!!position?.expand,reach:!!position?.reach};},
  fresh(now){return now>=timestamp&&now-timestamp<=250;},
  contact(x,y,r,entry=false){const current=hit(center,x,y,r);return current&&(!entry||timestamp>prior&&!hit(previous,x,y,r));},
  sweep(a,b,r,entry=false){
   if(!entry)return hit(center,b.x,b.y,r);
   if(timestamp-prior>250||Math.hypot(center.x-previous.x,center.y-previous.y)<1e-9||hit(previous,a.x,a.y,r))return false;
   const sx=previous.x-a.x,sy=(previous.y-a.y)/aspect,dx=center.x-b.x-sx,dy=(center.y-b.y)/aspect-sy,length=dx*dx+dy*dy;
   const u=length?clamp(-(sx*dx+sy*dy)/length,0,1):0;
   return (sx+u*dx)**2+(sy+u*dy)**2<=(radius+r)**2;
  },
  reset(){center={x:.5,y:.5};previous={...center};timestamp=prior=-Infinity;aspect=4/3;actions={expand:false,reach:false};}
 };
}
