// Deterministic camera and confidence data. Test-only readbacks never run in production.
export function neonGlowScene({bright=false,light=false,arms=true,partial=false,offset=0,noise=0,skin='#987563'}={}){
 const camera=document.createElement('canvas');camera.width=320;camera.height=240;const c=camera.getContext('2d');
 const silhouette=document.createElement('canvas');silhouette.width=320;silhouette.height=240;const s=silhouette.getContext('2d');
 s.fillStyle='white';s.strokeStyle='white';s.lineWidth=18;s.lineCap='round';
 s.beginPath();s.ellipse(160+offset,62,29,39,0,0,Math.PI*2);s.fill();s.fillRect(116+offset,96,88,160);
 if(arms){s.beginPath();s.moveTo(122+offset,110);s.lineTo(80+offset,82);s.lineTo(66+offset,34);s.moveTo(198+offset,110);s.lineTo(240+offset,82);s.lineTo(254+offset,34);s.stroke();}
 for(let i=0;i<13;i++){s.beginPath();s.moveTo(138+i*3+offset,34);s.lineTo(136+i*3+offset,19+(i%4)*3);s.lineWidth=2;s.stroke();}
 if(partial)s.clearRect(0,186,320,54);
 c.save();c.drawImage(silhouette,0,0);c.globalCompositeOperation='source-in';c.fillStyle=light?'#b5b2ad':'#282a31';c.fillRect(0,0,320,240);c.restore();
 // Restore background outside subject after source-in.
 c.globalCompositeOperation='destination-over';c.fillStyle=bright?'#c4c8cc':'#10141b';c.fillRect(0,0,320,240);c.globalCompositeOperation='source-over';
 c.fillStyle=skin;c.beginPath();c.ellipse(160+offset,66,23,29,0,0,Math.PI*2);c.fill();
 c.fillStyle='#30242a';c.fillRect(145+offset,58,9,4);c.fillRect(166+offset,58,9,4);c.fillRect(151+offset,79,18,3);c.fillStyle='#c59a7c';c.fillRect(159+offset,64,4,11);
 for(let y=115;y<185;y+=5){c.fillStyle=light?'#92918e':'#41434b';c.fillRect(124+offset,y,72,2);}
 const pixels=s.getImageData(0,0,320,240).data,values=new Float32Array(320*240);
 for(let i=0;i<values.length;i++)values[i]=Math.max(0,Math.min(1,pixels[i*4+3]/255+(pixels[i*4+3]>0?Math.sin(i*7)*noise:0)));
 return {camera,mask:{width:320,height:240,sourceWidth:320,sourceHeight:240,values,timestamp:0}};
}
