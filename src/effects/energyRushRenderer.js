const ORB_COLORS=['#67f8ff','#5fffa4','#ffd84a','#d9afff'];
export function drawEnergyRush(ctx,w,h,scene,{color='#b06aff',reduced=false,intensity='WILD',budget={records:3},rect={x:0,y:0,width:w,height:h}}={}){
 ctx.clearRect(0,0,w,h);if(!scene||scene.phase==='READY'||scene.phase==='CALIBRATING')return;
 const x=p=>rect.x+p*rect.width,y=p=>rect.y+p*rect.height,t=scene.clock;
 ctx.save();ctx.beginPath();ctx.rect(rect.x,rect.y,rect.width,rect.height);ctx.clip();
 const level=intensity==='CALM'?1:intensity==='MAX'?3:2;
 const rings=Math.min(reduced?1:level,budget.records);
 for(let i=0;i<rings;i++){
  ctx.strokeStyle=color;ctx.globalAlpha=scene.fever?.17:.055;ctx.lineWidth=1;
  ctx.beginPath();const size=rect.width*(.25+i*.1)+(reduced?0:Math.sin(t*.45+i)*rect.width*.015);
  ctx.ellipse(x(.5),y(.52),size,size*.65,reduced?0:Math.sin(t*.15)*.12,0,Math.PI*2);ctx.stroke();
 }
 if(scene.fever){const glow=ctx.createRadialGradient(x(.5),y(.5),rect.width*.2,x(.5),y(.5),rect.width*.65);glow.addColorStop(0,'#b06aff00');glow.addColorStop(1,'#b06aff30');ctx.globalAlpha=1;ctx.fillStyle=glow;ctx.fillRect(rect.x,rect.y,rect.width,rect.height);}
 // Short trails belong to bounded gameplay objects, not another particle pool.
 if(!reduced)for(const orb of scene.orbs)if(orb.active){ctx.strokeStyle=ORB_COLORS[orb.colorIndex];ctx.lineWidth=2;ctx.globalAlpha=.24;ctx.beginPath();const count=Math.min(orb.trailCount,[4,8,12][level-1]);for(let i=0;i<count;i++){const px=x(orb.trail[i*2]),py=y(orb.trail[i*2+1]);if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.stroke();}
 ctx.globalAlpha=1;
 for(const orb of scene.orbs)if(orb.active){
  const px=x(orb.x),py=y(orb.y),r=orb.radius*rect.width,grace=t-orb.born<orb.warning;
  const glow=ctx.createRadialGradient(px,py,0,px,py,r*3);glow.addColorStop(0,ORB_COLORS[orb.colorIndex]);glow.addColorStop(.3,ORB_COLORS[orb.colorIndex]+'bb');glow.addColorStop(1,ORB_COLORS[orb.colorIndex]+'00');ctx.globalAlpha=grace?.4:1;ctx.fillStyle=glow;ctx.beginPath();ctx.arc(px,py,r*3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#efffff';ctx.lineWidth=1.5;ctx.fillStyle=ORB_COLORS[orb.colorIndex];ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px-r*.2,py-r*.2,r*.24,0,Math.PI*2);ctx.fill();
 }
 ctx.globalAlpha=1;
 for(const hazard of scene.hazards)if(hazard.active){
  const px=x(hazard.x),py=y(hazard.y),r=hazard.radius*rect.width,warning=t-hazard.born<hazard.warning;
  ctx.strokeStyle='#ff354e';ctx.fillStyle='#19030ae6';ctx.lineWidth=3;ctx.setLineDash(warning?[5,5]:[]);ctx.beginPath();ctx.arc(px,py,r*(warning?2:1.4),0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);
  // A diamond, split ring and exclamation distinguish danger without color.
  ctx.strokeStyle='#fff0f1';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px,py-r*.8);ctx.lineTo(px+r*.8,py);ctx.lineTo(px,py+r*.8);ctx.lineTo(px-r*.8,py);ctx.closePath();ctx.stroke();ctx.strokeStyle='#ffb6c4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py-r*.32);ctx.lineTo(px,py+r*.08);ctx.stroke();ctx.fillStyle='#fff0f1';ctx.beginPath();ctx.arc(px,py+r*.35,1.5,0,Math.PI*2);ctx.fill();
  if(warning){ctx.font=`${Math.max(10,rect.width*.018)}px 'DM Sans',sans-serif`;ctx.textAlign='center';ctx.fillStyle='#fff0f1';ctx.fillText('DANGER',px,py-r*2.8);}
 }
 if(scene.inputMode==='assist'&&scene.center){ctx.strokeStyle=scene.invulnerable?'#fff':'#67f8ff';ctx.lineWidth=2;ctx.fillStyle='#67f8ff10';ctx.beginPath();ctx.arc(x(scene.center.x),y(scene.center.y),rect.width*.065,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x(scene.center.x)-5,y(scene.center.y));ctx.lineTo(x(scene.center.x)+5,y(scene.center.y));ctx.moveTo(x(scene.center.x),y(scene.center.y)-5);ctx.lineTo(x(scene.center.x),y(scene.center.y)+5);ctx.stroke();}
 ctx.restore();
}
