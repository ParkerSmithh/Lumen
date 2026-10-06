import {test,expect} from '@playwright/test';
test('GLOW has shadow emission while preserving internal contrast and the room',async({page})=>{
 await page.goto('/');const pixels=await page.evaluate(async()=>{
 const {createGlowRenderer}=await import('/src/effects/glowRenderer.js');const source=document.createElement('canvas');source.width=160;source.height=120;const c=source.getContext('2d');c.fillStyle='#0c0c0c';c.fillRect(0,0,160,120);c.fillStyle='#646464';c.fillRect(20,40,20,20);
 const values=new Float32Array(160*120);for(let y=0;y<120;y++)for(let x=0;x<80;x++)values[y*160+x]=1;
 const canvas=document.createElement('canvas'),r=createGlowRenderer(canvas);r.resize(160,120);r.draw({video:source,mask:{values,width:160,height:120,sourceWidth:160,sourceHeight:120},color:'#ff354e',opacity:1});
 const read=document.createElement('canvas');read.width=160;read.height=120;const ctx=read.getContext('2d');ctx.drawImage(canvas,0,0);const pixel=(x,y)=>[...ctx.getImageData(x,y,1,1).data];const out={dark:pixel(100,85),detail:pixel(130,50),room:pixel(20,85)};r.dispose();return out;
 });expect(pixels.dark[0]).toBeGreaterThan(70);expect(pixels.detail[0]-pixels.dark[0]).toBeGreaterThan(50);expect(pixels.room.slice(0,3)).toEqual([12,12,12]);
});
