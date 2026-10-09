import {galleryEchoRecords,drawEchoMark} from '../echoes/echoComposition.js';
export const CONVERGENCE_MODES=['GLOW','FLOW','SLASH','LAUNCH'];
export function createConvergenceModel(input=[]){
 const counts={};const selected=[];
 for(let i=input.length-1;i>=0;i--){const r=input[i];if(!CONVERGENCE_MODES.includes(r?.mode)||!r.points?.length||(counts[r.mode]??0)>=16)continue;counts[r.mode]=(counts[r.mode]??0)+1;selected.push({...r,points:r.points.slice(0,64).map(p=>({...p}))});}
 selected.reverse();const records=galleryEchoRecords(selected);
 // Only captured geometry, its palette and its chronological ordering seed layout.
 const source=JSON.stringify(records.map(r=>[r.mode,r.color,r.intensity,r.points]));let hash=2166136261;
 for(let i=0;i<source.length;i++){hash^=source.charCodeAt(i);hash=Math.imul(hash,16777619)>>>0;}
 const complete=CONVERGENCE_MODES.every(mode=>records.some(r=>r.mode===mode));
 const motifs=records.map((record,index)=>{const mode=CONVERGENCE_MODES.indexOf(record.mode),angle=mode*Math.PI/2-Math.PI/2;const turn=((hash>>>((index%4)*8))&255)/255;return {record,angle,scale:.35+turn*.12,radius:.045+(index%16)/16*.13};});
 const rotation=.12+(hash%31)/100;
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const {record,angle,scale,radius} of motifs){
  const x=Math.cos(angle+rotation)*radius,y=Math.sin(angle+rotation)*radius,zoom=scale*1.045;
  const padding=zoom*(record.mode==='GLOW'?.008+.012*record.intensity:record.mode==='SLASH'?.003:.0015);
  for(const p of record.points){const px=x+zoom*(p.x-.5),py=y+zoom*(p.y-.5);minX=Math.min(minX,px-padding);maxX=Math.max(maxX,px+padding);minY=Math.min(minY,py-padding);maxY=Math.max(maxY,py+padding);}
 }
 const finalBounds=motifs.length?{minX,minY,maxX,maxY}:{minX:0,minY:0,maxX:0,maxY:0};
 const fit={scale:Math.min(5,.9/Math.max(.001,finalBounds.maxX-finalBounds.minX,finalBounds.maxY-finalBounds.minY)),centerX:(finalBounds.minX+finalBounds.maxX)/2,centerY:(finalBounds.minY+finalBounds.maxY)/2};
 return {complete,records,hash:hash.toString(16).padStart(8,'0'),motifs,finalBounds,fit};
}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function drawConvergence(ctx,model,width,height,elapsed=20,reduced=false){
 ctx.save();ctx.fillStyle='#050407';ctx.fillRect(0,0,width,height);
 if(!model?.complete){ctx.restore();return;}
 const t=reduced?20:Math.max(0,Math.min(20,elapsed)),attract=smooth((t-4)/6),converge=smooth((t-10)/6),release=smooth((t-16)/4),size=Math.min(width,height)*.88;
 ctx.translate(width/2,height/2);
 const fitScale=1+(model.fit.scale-1)*converge;ctx.scale(fitScale,fitScale);ctx.translate(-model.fit.centerX*size*converge,-model.fit.centerY*size*converge);
 for(const motif of model.motifs){const {record,angle,scale,radius}=motif;const orbit=.36*(1-attract)+radius*attract;const rotation=converge*(.12+(parseInt(model.hash,16)%31)/100);const x=Math.cos(angle+rotation)*orbit*size,y=Math.sin(angle+rotation)*orbit*size;
  ctx.save();ctx.translate(x,y);const zoom=scale*(.7+.3*converge)*(1+.045*release);ctx.scale(zoom,zoom);ctx.translate(-size/2,-size/2);drawEchoMark(ctx,record,size,size,(.12+.7*smooth(t/4))*(1-.12*release));ctx.restore();
 }
 ctx.restore();
}

