const W=32,H=24;
let serial=0;
function coarse(mask){
 if(!mask?.values||!mask.width||!mask.height)return null;
 const cells=new Uint8Array(W*H);let sx=0,sy=0,total=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const mx=Math.min(mask.width-1,Math.floor((x+.5)*mask.width/W)),my=Math.min(mask.height-1,Math.floor((y+.5)*mask.height/H));
  const value=mask.values[my*mask.width+mx]>.35?255:0;const dx=W-1-x;cells[y*W+dx]=value;if(value){sx+=(dx+.5)/W;sy+=(y+.5)/H;total++;}
 }
 return {cells,center:total?{x:sx/total,y:sy/total}:null};
}
export function createPresenceEcho({emit,onPresence,drawBeyond}){
 let previous=null,lastTime=-Infinity,lastTimestamp=null,echoes=[],scratch;
 const expire=time=>{echoes=echoes.filter(e=>time-e.time<800);};
 return {get size(){return echoes.length;},expire,clear(){previous=null;echoes=[];lastTime=-Infinity;lastTimestamp=null;},
 sample(mask,{time,color,epoch}){
  expire(time);if(!Number.isFinite(mask?.timestamp)||mask.timestamp===lastTimestamp||time-lastTime<200)return;
  const next=coarse(mask);if(!next)return;lastTime=time;lastTimestamp=mask.timestamp;
  let moving=false;
  if(previous?.center&&next.center){let changed=0;for(let i=0;i<next.cells.length;i++)if(next.cells[i]!==previous.cells[i])changed++;
   moving=changed>=12;
   if(moving){const intensity=Math.min(1,changed/(W*H)*3);echoes.push({cells:previous.cells,color,time,intensity});if(echoes.length>3)echoes.shift();
    // Store only a broad movement mark; never the segmentation shape or timed trajectory.
    const center={x:Math.round(next.center.x*16)/16,y:Math.round(next.center.y*16)/16};
    emit?.({id:'presence:'+serial++,mode:'GLOW',kind:'presence',color,points:[center],intensity,duration:.8},epoch);
   }
  }try{onPresence?.({valid:!!next.center,moving,center:next.center,color,timestamp:mask.timestamp},time);}catch{}previous=next;
 },draw(ctx,w,h,time,mask,reducedMotion=false){
  expire(time);ctx.clearRect(0,0,w,h);if(!echoes.length&&!drawBeyond)return;
  scratch??=document.createElement('canvas');scratch.width=W;scratch.height=H;const s=scratch.getContext('2d');
  const current=coarse(mask)?.cells;ctx.save();ctx.filter=`blur(${Math.max(3,Math.min(w,h)*.018)}px)`;
  for(const echo of echoes){const image=s.createImageData(W,H);const rgb=[1,3,5].map(i=>parseInt(echo.color.slice(i,i+2),16));
   for(let i=0;i<echo.cells.length;i++){image.data[i*4]=rgb[0];image.data[i*4+1]=rgb[1];image.data[i*4+2]=rgb[2];image.data[i*4+3]=echo.cells[i];}s.putImageData(image,0,0);
   ctx.globalAlpha=(1-(time-echo.time)/800)*.085*(reducedMotion ? .65 : 1);ctx.drawImage(scratch,0,0,w,h);
  }
  try{drawBeyond?.(ctx,w,h,time,reducedMotion);}catch{}
  ctx.filter='none';ctx.globalAlpha=1;
  if(current){const image=s.createImageData(W,H);
   // Expand the current foreground one cell to keep blur off facial/body details.
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){let covered=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<W&&y+dy>=0&&y+dy<H&&current[(y+dy)*W+x+dx])covered=true;image.data[(y*W+x)*4+3]=covered?255:0;}
   s.putImageData(image,0,0);ctx.globalCompositeOperation='destination-out';ctx.drawImage(scratch,0,0,w,h);
  }ctx.restore();
 },dispose(){previous=null;echoes=[];if(scratch){scratch.width=scratch.height=0;scratch=null;}}};
}


