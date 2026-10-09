export function drawEchoMark(ctx,record,w,h,alpha=1,drift=0){
 if(!record?.points?.length)return;
 ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,alpha))*(.22+.48*record.intensity);ctx.strokeStyle=record.color;ctx.fillStyle=record.color;ctx.lineWidth=Math.max(1,Math.min(w,h)/700);ctx.lineCap='round';ctx.lineJoin='round';
 const x=p=>p.x*w,y=p=>p.y*h-drift*Math.min(w,h)*.018;
 if(record.mode==='GLOW'){
  // Abstract occupancy marks, not contours or stored body imagery.
  for(const p of record.points){ctx.beginPath();ctx.arc(x(p),y(p),Math.min(w,h)*(.008+.012*record.intensity),0,Math.PI*2);ctx.fill();}
 }else{
  ctx.beginPath();for(let i=0;i<record.points.length;i++){const p=record.points[i];if(!i||p.break)ctx.moveTo(x(p),y(p));else ctx.lineTo(x(p),y(p));}ctx.stroke();
  if(record.mode==='SLASH')for(const p of record.points){ctx.beginPath();ctx.arc(x(p),y(p),Math.max(1,Math.min(w,h)*.002),0,Math.PI*2);ctx.fill();}
 }
 ctx.restore();
}
export function galleryEchoRecords(records){return records.map(record=>{const aspect=record.aspect??1,sx=Math.min(1,aspect),sy=Math.min(1,1/aspect);return {...record,points:record.points.map(p=>({...p,x:.5+(p.x-.5)*sx,y:.5+(p.y-.5)*sy}))};});}
export function drawEchoComposition(ctx,records,width,height){
 records=galleryEchoRecords(records);
 ctx.save();ctx.fillStyle='#050407';ctx.fillRect(0,0,width,height);
 const size=Math.min(width,height)*.88,ox=(width-size)/2,oy=(height-size)/2;ctx.translate(ox,oy);
 const points=records.flatMap(record=>record.points);if(points.length){const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const zoom=Math.min(2.5,.82/Math.max(.1,maxX-minX,maxY-minY));ctx.translate(size/2,size/2);ctx.scale(zoom,zoom);ctx.translate(-(minX+maxX)*size/2,-(minY+maxY)*size/2);}
 for(const mode of ['GLOW','FLOW','SLASH','LAUNCH'])for(const record of records)if(record.mode===mode)drawEchoMark(ctx,record,size,size,.8);
 ctx.restore();
}
