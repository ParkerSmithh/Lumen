// Low-resolution, SLASH-only motion evidence. It does not alter hand inference.
export function frameMotionRegion(previous,pixels,width,height){
 if(!previous||previous.length!==pixels.length)return null;
 const w=Math.floor(width/2),h=Math.floor(height/2),mask=new Uint8Array(w*h);let changed=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let sum=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=((y*2+dy)*width+x*2+dx)*4;sum+=Math.abs(previous[i]-pixels[i])+Math.abs(previous[i+1]-pixels[i+1])+Math.abs(previous[i+2]-pixels[i+2]);}
  if(sum>180){mask[y*w+x]=1;changed++;}
 }
 if(changed/(w*h)>.65)return null;
 let best=null;
 for(let i=0;i<mask.length;i++)if(mask[i]){
  const queue=[i];mask[i]=0;let count=0,sx=0,sy=0,minX=w,maxX=0,minY=h,maxY=0;
  for(let q=0;q<queue.length;q++){
   const index=queue[q],x=index%w,y=Math.floor(index/w);count++;sx+=x;sy+=y;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,next=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&mask[next]){mask[next]=0;queue.push(next);}}
  }
  if(count>12&&(!best||count>best.count))best={count,x:sx/count/w,y:sy/count/h,minX:minX/w,maxX:maxX/w,minY:minY/h,maxY:maxY/h};
 }
 if(!best)return null;
 const support=best.count/(w*h),rw=(best.maxX-best.minX)*width/height,rh=best.maxY-best.minY;
 if(support<.008||Math.max(rw,rh)<.12)return null;
 return {...best,support,elongation:Math.max(rw,rh)/Math.max(.01,Math.min(rw,rh))};
}

export function createSlashFrameMotion(){
 let previous=null,lastTime=-Infinity,lastMotion=-Infinity,armUntil=-Infinity,history=[];
 const reset=()=>{previous=null;lastTime=lastMotion=armUntil=-Infinity;history=[];};
 const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
 function consume(region,width,height,time,sequence){
  if(!region||region.support<.02)return null;
  if(region.elongation>=1.4&&region.support>=.03)armUntil=time+160;
  if(region.elongation<1.4&&time>armUntil)return null;
  const baseline=time-lastMotion>120;if(baseline)history=[];
  history.push(region);history=history.slice(-3);lastMotion=time;
  const center={x:1-median(history.map(p=>p.x)),y:median(history.map(p=>p.y))};
  return {active:true,source:'camera-motion',method:'frame-motion',center,edge:[{x:center.x,y:center.y-.065},{x:center.x,y:center.y+.065}],aspect:width/height,timestamp:time,sequence,reset:baseline,support:region.support};
 }
 return {reset,consume,update(pixels,width,height,time,sequence){
  if(!Number.isFinite(time)||time-lastTime>250||time<=lastTime){previous=pixels;lastTime=time;history=[];lastMotion=-Infinity;armUntil=-Infinity;return null;}
  const region=frameMotionRegion(previous,pixels,width,height);previous=pixels;lastTime=time;
  return consume(region,width,height,time,sequence);
 }};
}
