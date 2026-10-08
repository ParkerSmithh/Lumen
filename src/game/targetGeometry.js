export function sweptTargetHit(a,b,ballRadius,t) {
 let lo=0,hi=1;const depth=t.halfDepth+ballRadius,dz=b.z-a.z;
 if(Math.abs(dz)<1e-9){if(Math.abs(a.z-t.z)>depth)return false;}else{let p=(t.z-depth-a.z)/dz,q=(t.z+depth-a.z)/dz;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);if(lo>hi)return false;}
 const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;const u=Math.max(lo,Math.min(hi,den?((t.x-a.x)*dx+(t.y-a.y)*dy)/den:lo));return Math.hypot(a.x+dx*u-t.x,a.y+dy*u-t.y)<=t.radius+ballRadius;
}
