import {test,expect} from '@playwright/test';
for(const fallback of [false,true]) test(`GLOW darkens dim rooms and strengthens the person (${fallback?'Canvas':'WebGL'})`,async({page})=>{
 await page.goto('/');const pixels=await page.evaluate(async fallback=>{
 const {createGlowRenderer}=await import('/src/effects/glowRenderer.js');const source=document.createElement('canvas');source.width=160;source.height=120;const c=source.getContext('2d');c.fillStyle='#0c0c0c';c.fillRect(0,0,160,120);c.fillStyle='#646464';c.fillRect(20,40,20,20);
 const values=new Float32Array(160*120);for(let y=0;y<120;y++)for(let x=0;x<80;x++)values[y*160+x]=1;
 const canvas=document.createElement('canvas');if(fallback)canvas.getContext('2d');const r=createGlowRenderer(canvas);r.resize(160,120);r.draw({video:source,mask:{values,width:160,height:120,sourceWidth:160,sourceHeight:120},color:'#ff354e',opacity:1});
 const read=document.createElement('canvas');read.width=160;read.height=120;const ctx=read.getContext('2d');ctx.drawImage(canvas,0,0);const pixel=(x,y)=>[...ctx.getImageData(x,y,1,1).data];const out={dark:pixel(100,85),detail:pixel(130,50),room:pixel(20,85),halo:pixel(75,85)};r.dispose();return out;
 },fallback);expect(pixels.dark[0]).toBeGreaterThan(70);expect(pixels.detail[0]-pixels.dark[0]).toBeGreaterThan(30);expect(pixels.room[0]).toBeLessThan(8);expect(pixels.halo[0]).toBeGreaterThan(pixels.room[0]+15);
});

for(const fallback of [false,true]) test(`GLOW adapts smoothly to lights switching off (${fallback?'Canvas':'WebGL'})`,async({page})=>{
 await page.goto('/');const result=await page.evaluate(async fallback=>{
  const {createGlowRenderer}=await import('/src/effects/glowRenderer.js');
  const source=document.createElement('canvas');source.width=160;source.height=120;
  const c=source.getContext('2d'),canvas=document.createElement('canvas');if(fallback)canvas.getContext('2d');
  const r=createGlowRenderer(canvas);r.resize(160,120);
  const values=new Float32Array(160*120);for(let y=0;y<120;y++)for(let x=0;x<80;x++)values[y*160+x]=1;
  const mask={values,width:160,height:120,sourceWidth:160,sourceHeight:120};
  let clock=0;Object.defineProperty(performance,'now',{value:()=>clock,configurable:true});
  const read=document.createElement('canvas');read.width=160;read.height=120;const ctx=read.getContext('2d');
  function draw(background){c.fillStyle=background;c.fillRect(0,0,160,120);c.fillStyle='#303030';c.fillRect(0,0,80,120);r.draw({video:source,mask,color:'#ff354e',opacity:1});ctx.drawImage(canvas,0,0);return ctx.getImageData(110,80,1,1).data[0];}
  const bright=draw('#808080');clock=200;const first=draw('#0c0c0c');clock=400;const second=draw('#0c0c0c');let settled;for(let i=0;i<20;i++){clock+=200;settled=draw('#0c0c0c');}
  r.dispose();return {bright,first,second,settled};
 },fallback);
 expect(result.second).toBeGreaterThan(result.first);expect(result.settled).toBeGreaterThan(result.second+5);
});
