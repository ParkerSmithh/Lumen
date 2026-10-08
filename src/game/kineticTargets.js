import {sweptTargetHit} from './targetGeometry.js';
import {targetBehavior,movingTargetPosition,relativeTargetHit} from './launchArcade.js';
export {sweptTargetHit} from './targetGeometry.js';
export function createKineticTargets({arcade=false,reducedMotion=false,random=Math.random,onHit,onExpired}={}) {
 let target=null,id=0,serial=0;const blocked=new Set();
 const point=(data,i)=>({x:data[i*3],y:data[i*3+1],z:data[i*3+2]});
 const overlaps=(p,i,t)=>sweptTargetHit(point(p.positionData,i),point(p.positionData,i),p.sizeData[i],t);
 function arm(p){blocked.clear();if(target)for(let i=1;i<p.config.activeCount;i++)if(overlaps(p,i,target))blocked.add(i);}
 function place(p,progress,reach={x:.15,y:.25,width:.7,height:.45},elapsed=progress*120,simulation=0,preserve=null){
  const nextSerial=preserve?.serial??serial+1;
  let behavior=arcade?targetBehavior(nextSerial,elapsed,reducedMotion):{type:'normal',moving:false,duration:Infinity,radiusMultiplier:1};
  if(preserve)behavior={type:preserve.type,moving:preserve.moving,duration:Infinity,radiusMultiplier:preserve.type==='bonus'?1.35:1};
  let best=null,bestCount=Infinity;
  const attempts=behavior.type==='bonus'?2:1;
  for(let pass=0;pass<attempts;pass++){
   const radius=Math.max(.7,1.25-progress*.4)*behavior.radiusMultiplier;
   const maxX=Math.max(0,p.config.maxX-radius-.6),maxY=Math.max(0,p.config.maxY-radius-.6);
   for(let attempt=0;attempt<24;attempt++){
    const u=reach.x+reach.width*(.15+random()*.7),v=reach.y+reach.height*(.15+random()*.7);
    const t={id:preserve?.id??id+1,serial:nextSerial,type:behavior.type,moving:behavior.moving,x:Math.max(-maxX,Math.min(maxX,(u-.5)*p.config.maxX*2)),y:Math.max(-maxY,Math.min(maxY,(.5-v)*p.config.maxY*2)),z:-.65,radius,halfDepth:.9,minX:-maxX,maxX,motionStart:simulation,motionAmplitude:Math.min(.6,maxX),expiresAt:preserve&&preserve.type===behavior.type?preserve.expiresAt:elapsed+behavior.duration};
    t.baseX=t.x;t.baseY=t.y;t.previousCenter={x:t.x,y:t.y,z:t.z};let count=0;
    for(let i=1;i<p.config.activeCount;i++)if(overlaps(p,i,t))count++;
    if(!arcade&&count<bestCount){best=t;bestCount=count;}if(count===0){best=t;break;}
   }
   if(best)break;
   behavior={type:'normal',moving:false,duration:Infinity,radiusMultiplier:1};
  }
  if(!best){target=null;blocked.clear();return null;}
  if(!preserve){serial=nextSerial;id++;}target=best;arm(p);return target;
 }
 return {get target(){return target;},reset(){target=null;id=serial=0;blocked.clear();},arm,spawn:place,
  relocate(p,progress,reach,elapsed,simulation){return place(p,progress,reach,elapsed,simulation,target);},
  advance(p,elapsed,simulation,dt){if(!target)return;if(elapsed>=target.expiresAt){const expired=target;target=null;blocked.clear();onExpired?.(expired);return;}
   target.previousCenter={x:target.x,y:target.y,z:target.z};const pose=movingTargetPosition({...target,x:target.baseX,y:target.baseY},simulation,dt);Object.assign(target,pose.current);
  },
  check(p,previous){if(!target)return false;for(let i=1;i<p.config.activeCount;i++){
   if(blocked.has(i)){if(!overlaps(p,i,target))blocked.delete(i);continue;}if(p.grabController?.has(i))continue;
   const hit=arcade?relativeTargetHit(point(previous,i),point(p.positionData,i),p.sizeData[i],target.previousCenter||target,target):sweptTargetHit(point(previous,i),point(p.positionData,i),p.sizeData[i],target);
   if(hit){const event={...target,slot:i};target=null;blocked.clear();onHit?.(event);return true;}
  }return false;}
 };
}
