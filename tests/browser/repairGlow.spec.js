import { test, expect } from '@playwright/test';

for (const fallback of [false, true]) test(`GLOW preserves mirrored scene and internal detail (${fallback ? 'Canvas' : 'WebGL'})`, async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async fallback => {
    const { createGlowRenderer } = await import('/src/effects/glowRenderer.js');
    const source = document.createElement('canvas'); source.width = 80; source.height = 60;
    const c = source.getContext('2d'); c.fillStyle = '#306090'; c.fillRect(0, 0, 80, 60);
    c.fillStyle = '#a08060'; c.fillRect(0, 0, 40, 60);
    c.fillStyle = '#302010'; c.fillRect(10, 15, 10, 10);
    const canvas = document.createElement('canvas'); if (fallback) canvas.getContext('2d');
    const renderer = createGlowRenderer(canvas); renderer.resize(80, 60);
    const values = new Float32Array(80 * 60); for (let y=0;y<60;y++) for(let x=0;x<40;x++) values[y*80+x]=1;
    renderer.draw({ video: source, mask: { values, width:80,height:60,sourceWidth:80,sourceHeight:60 }, color:'#ff354e',opacity:1,time:0 });
    const read = document.createElement('canvas'); read.width=80;read.height=60; const ctx=read.getContext('2d');ctx.drawImage(canvas,0,0);
    const pixel=(x,y)=>[...ctx.getImageData(x,y,1,1).data].slice(0,3);
    const background=pixel(10,30),body=pixel(50,30),detail=pixel(65,20);
    renderer.draw({video:source,mask:null,color:'#ff354e',opacity:0,time:0});ctx.drawImage(canvas,0,0);
    const withoutMask=pixel(10,30); renderer.dispose();
    return {background,body,detail,withoutMask};
  }, fallback);
  expect(result.background[2]).toBeGreaterThan(result.background[0]);
  expect(result.withoutMask).toEqual([48,96,144]);
  expect(result.body[0]).toBeGreaterThan(result.body[2]);
  expect(result.body[0]-result.detail[0]).toBeGreaterThan(50);
});
