const finite=p=>p&&Number.isFinite(p.x+p.y+p.z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createGrabController({radius=1.6,maxGrabbed=12,followResponse=36,historyMs=120,throwGain=1.6,spread=.06}={}){
 const held=new Map();let target=null,lastTime=0,velocity={x:0,y:0,z:0};const history=[];
 const boundVelocity=(v,max)=>{const scale=Math.min(1,max/(Math.hypot(v.x,v.y,v.z)||1));return {x:v.x*scale,y:v.y*scale,z:v.z*scale};};
 // Segment medians reject an isolated landmark spike and its return segment.
 function estimate(){
  const segments=[];
  for(let i=1;i<history.length;i++){
   const a=history[i-1],b=history[i],dt=(b.time-a.time)/1000;
   if(dt<.012)continue;
   segments.push(boundVelocity({x:(b.x-a.x)/dt/60,y:(b.y-a.y)/dt/60,z:(b.z-a.z)/dt/60},.3));
  }
  if(!segments.length)return {x:0,y:0,z:0};
  const result={};
  for(const axis of ['x','y','z']){const values=segments.map(v=>v[axis]).sort((a,b)=>a-b),mid=Math.floor(values.length/2);result[axis]=(values.length%2?values[mid]:(values[mid-1]+values[mid])/2)*throwGain;}
  return result;
 }
 function release(physics,throwing=false){
  const base=throwing?boundVelocity(velocity,physics.config.maxVelocity):{x:0,y:0,z:0},speed=Math.hypot(base.x,base.y,base.z);
  let center={x:0,y:0,z:0};for(const offset of held.values())for(const axis of ['x','y','z'])center[axis]+=offset[axis]/held.size;
  for(const [i,offset]of held){
   const length=Math.hypot(offset.x-center.x,offset.y-center.y,offset.z-center.z)||1;
   const variation=held.size>1?speed*spread:0;
   const v=boundVelocity({x:base.x+(offset.x-center.x)/length*variation,y:base.y+(offset.y-center.y)/length*variation,z:base.z+(offset.z-center.z)/length*variation},physics.config.maxVelocity);
   physics.velocityData.set([v.x,v.y,v.z],i*3);
  }
  held.clear();target=null;velocity={x:0,y:0,z:0};lastTime=0;history.length=0;
 }
 return {get count(){return held.size;},get indices(){return [...held.keys()];},has(i){return held.has(i);},release,
 begin(point,physics,time=0){release(physics);if(!finite(point))return 0;const candidates=[];for(let i=1;i<physics.config.activeCount;i++){const o=i*3,dx=physics.positionData[o]-point.x,dy=physics.positionData[o+1]-point.y,dz=physics.positionData[o+2]-point.z;const d=Math.hypot(dx,dy,dz*.35);if(d<=radius+physics.sizeData[i])candidates.push({i,d,offset:{x:dx,y:dy,z:dz}});}candidates.sort((a,b)=>a.d-b.d);for(const c of candidates.slice(0,maxGrabbed))held.set(c.i,c.offset);target={...point};lastTime=time;history.push({...point,time});return held.size;},
 move(point,time){
  if(!finite(point)||!held.size||!Number.isFinite(time)||time<=lastTime)return;
  if(time-lastTime>250)history.length=0;
  history.push({...point,time});
  while(history.length>1&&history[0].time<time-historyMs)history.shift();
  velocity=estimate();target={...point};lastTime=time;
 },
 step(physics,dt){if(!target||!held.size)return;const bounds={x:[-Infinity,Infinity],y:[-Infinity,Infinity],z:[-Infinity,Infinity]};for(const [i,offset]of held){const size=physics.sizeData[i];for(const axis of ['x','y','z']){const max=physics.config['max'+axis.toUpperCase()];bounds[axis][0]=Math.max(bounds[axis][0],-max+size-offset[axis]);bounds[axis][1]=Math.min(bounds[axis][1],max-size-offset[axis]);}}const center={};for(const axis of ['x','y','z'])center[axis]=clamp(target[axis],...bounds[axis]);const alpha=1-Math.exp(-Math.max(0,dt)*followResponse);for(const [i,offset]of held){const o=i*3,delta=[];for(const [j,axis]of ['x','y','z'].entries()){const old=physics.positionData[o+j],next=old+(center[axis]+offset[axis]-old)*alpha;physics.positionData[o+j]=next;delta[j]=(next-old)/Math.max(.001,dt)/60;}const v=boundVelocity({x:delta[0],y:delta[1],z:delta[2]},physics.config.maxVelocity);physics.velocityData.set([v.x,v.y,v.z],o);}}
 };
}
