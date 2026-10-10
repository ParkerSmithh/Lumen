import {GRID_WIDTH as W,GRID_HEIGHT as H} from '../tracking/silhouetteGrid.js';
// Fixed transient occupancy union, not a mask/pose history or persisted artwork.
export function createEnergyReachability(){
 const neutral=new Uint8Array(W*H),observed=new Uint8Array(W*H),reachable=new Uint8Array(W*H);
 let captured=false,aspect=4/3,points=[],timestamp=-Infinity;
 const contact=(x,y,r)=>{
  const ry=r*aspect,tol=r+Math.min(1/W,1/(H*aspect))*.5;
  for(let yy=Math.max(0,Math.floor((y-ry)*H));yy<=Math.min(H-1,Math.floor((y+ry)*H));yy++)for(let xx=Math.max(0,Math.floor((x-r)*W));xx<=Math.min(W-1,Math.floor((x+r)*W));xx++)if(reachable[yy*W+xx]&&((xx+.5)/W-x)**2+(((yy+.5)/H-y)/aspect)**2<=tol*tol)return true;
  return false;
 };
 return {reset(){neutral.fill(0);observed.fill(0);reachable.fill(0);captured=false;points=[];timestamp=-Infinity;},
  sample(s,cal){
   if(!cal.accepted||cal.stage!=='explore'||!s?.cells||s.cells.length!==W*H||s.timestamp<=timestamp)return;
   timestamp=s.timestamp;
   const dx=s.center.x-cal.baseline.x,posture=cal.capabilities.includes('reach')||cal.capabilities.includes('expand');
   const tolerance=posture?.03:.015;
   // Valid framing alone does not prove a sustained movement capability.
   if(dx<cal.envelope.minX-cal.baseline.minX-tolerance||dx>cal.envelope.maxX-cal.baseline.maxX+tolerance)return;
   if(!captured){neutral.set(s.cells);captured=true;}aspect=s.aspect||4/3;for(let i=0;i<observed.length;i++)observed[i]|=s.cells[i];
  },
  prepare(cal,input,excluded=[]){
   points=[];if(!captured)return null;reachable.set(observed);
   const left=Math.floor((cal.envelope.minX-cal.baseline.minX)*W),right=Math.ceil((cal.envelope.maxX-cal.baseline.maxX)*W);
   for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++)if(neutral[yy*W+xx])for(let dx=left;dx<=right;dx++)if(xx+dx>=0&&xx+dx<W)reachable[yy*W+xx+dx]=1;
   const range=Math.max(-left/W,right/W),radius=Math.max(.008,Math.min(.024,range*.3||.008));
   let minX=1,minY=1,maxX=0,maxY=0;
   for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++)if(reachable[yy*W+xx]){minX=Math.min(minX,xx/W);minY=Math.min(minY,yy/H);maxX=Math.max(maxX,(xx+1)/W);maxY=Math.max(maxY,(yy+1)/H);}
   // Once-per-calibration scan proves usable space; per-spawn queries stay local.
   for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){
    const x=(xx+.5)/W,y=(yy+.5)/H;
    if(x<.04||x>.96||y<.08||y>.92||!contact(x,y,radius)||input.contact(x,y,radius)||excluded.some(b=>x+radius*2>b.minX&&x-radius*2<b.maxX&&y+radius*2*aspect>b.minY&&y-radius*2*aspect<b.maxY))continue;
    points.push({x,y});
   }
   return points.length?{envelope:{minX,minY,maxX,maxY},radius}:null;
  },contact,
  candidate(random){return points.length?points[Math.min(points.length-1,Math.floor(random*points.length))]:null;}
 };
}
