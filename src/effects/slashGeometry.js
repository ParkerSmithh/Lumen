export function segmentDistance(point,a,b) {
  const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length)):0;
  return Math.hypot(point.x-a.x-dx*t,point.y-a.y-dy*t);
}
function insideTriangle(point,a,b,c) {
  const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  if(Math.abs(cross(a,b,c))<.00001)return false;
  const signs=[cross(a,b,point),cross(b,c,point),cross(c,a,point)];
  return signs.every(value=>value>=0)||signs.every(value=>value<=0);
}
export function sweptHit(slash,object,padding=8) {
  if(slash.path?.length>1)return slash.path.slice(1).some((node,i)=>sweptHit({...slash,path:null,start:slash.path[i].center,end:node.center,previousEdge:slash.path[i].edge,edge:node.edge},object,padding));
  const radius=object.radius+padding;
  if(segmentDistance(object,slash.start,slash.end)<=radius)return true;
  const [a,b]=slash.previousEdge,[d,c]=slash.edge;
  if(insideTriangle(object,a,b,c)||insideTriangle(object,a,c,d))return true;
  return [[a,b],[b,c],[c,d],[d,a]].some(([start,end])=>segmentDistance(object,start,end)<=radius);
}
