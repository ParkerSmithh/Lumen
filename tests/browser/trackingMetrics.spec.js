import {test,expect} from '@playwright/test';import fs from 'node:fs';
test('measure shared worker capture-to-result cadence without inference backlog',async({page})=>{
 test.setTimeout(180000);
 await page.addInitScript(()=>{
 navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d');ctx.fillStyle='#555';let raf;const paint=()=>{ctx.fillRect(0,0,640,480);raf=requestAnimationFrame(paint);};paint();const stream=c.captureStream(30);stream.getTracks()[0].addEventListener('ended',()=>cancelAnimationFrame(raf));return stream;};
 });
 const results=[];
 for(const cadence of ['20','30','max']){
 await page.goto('/?trackingHz='+cadence);await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'Enter with camera',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__lumenTracking?.metrics.report().samples||0),{timeout:60000}).toBeGreaterThanOrEqual(50);
 results.push({requested:cadence,...await page.evaluate(()=>window.__lumenTracking.metrics.report())});
 await page.getByRole('button',{name:'Stop camera'}).click();
 }
 fs.writeFileSync('.test-artifacts/repair-tracking-cadence.json',JSON.stringify({environment:'headless Edge, synthetic 640x480 30 fps scene, actual CPU MediaPipe worker, no real hand',results},null,2));console.log(JSON.stringify(results));
});
