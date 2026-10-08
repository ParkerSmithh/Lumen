// A luminous disc with generous depth: firing travels in Z, throws travel in XY.
export function sweptTargetHit(a,b,ballRadius,t) {
 let lo=0,hi=1;const depth=t.halfDepth+ballRadius,dz=b.z-a.z;
 if(Math.abs(dz)<1e-9){if(Math.abs(a.z-t.z)>depth)return false;}else{let p=(t.z-depth-a.z)/dz,q=(t.z+depth-a.z)/dz;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);if(lo>hi)return false;}
 const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;const u=Math.max(lo,Math.min(hi,den?((t.x-a.x)*dx+(t.y-a.y)*dy)/den:lo));return Math.hypot(a.x+dx*u-t.x,a.y+dy*u-t.y)<=t.radius+ballRadius;
}
export function createKineticTargets() {
 let target=null,id=0;const blocked=new Set();const point=(p,i)=>({x:p[i*3],y:p[i*3+1],z:p[i*3+2]});
 const overlaps=(p,i,t)=>sweptTargetHit(point(p.positionData,i),point(p.positionData,i),p.sizeData[i],t);
 return {get target(){return target;},reset(){target=null;id=0;blocked.clear();},arm(p){blocked.clear();for(let i=1;i<p.config.activeCount;i++)if(overlaps(p,i,target))blocked.add(i);},spawn(p,progress,reach={x:.15,y:.25,width:.7,height:.45}){
 const radius=Math.max(.7,1.25-progress*.4),maxX=Math.max(0,p.config.maxX-radius-.6),maxY=Math.max(0,p.config.maxY-radius-.6);let best=null,bestCount=Infinity;
 for(let attempt=0;attempt<24;attempt++){const u=reach.x+reach.width*(.15+Math.random()*.7),v=reach.y+reach.height*(.15+Math.random()*.7);const t={id:++id,x:Math.max(-maxX,Math.min(maxX,(u-.5)*p.config.maxX*2)),y:Math.max(-maxY,Math.min(maxY,(.5-v)*p.config.maxY*2)),z:-.65,radius,halfDepth:.9};let count=0;for(let i=1;i<p.config.activeCount;i++)if(overlaps(p,i,t))count++;if(count<bestCount){best=t;bestCount=count;}if(!count)break;}
 target=best;blocked.clear();for(let i=1;i<p.config.activeCount;i++)if(overlaps(p,i,target))blocked.add(i);return target;},
 check(p,previous){if(!target)return false;for(let i=1;i<p.config.activeCount;i++){if(blocked.has(i)){if(!overlaps(p,i,target))blocked.delete(i);continue;}if(p.grabController?.has(i))continue;if(sweptTargetHit(point(previous,i),point(p.positionData,i),p.sizeData[i],target)){target=null;blocked.clear();return true;}}return false;}};
}
