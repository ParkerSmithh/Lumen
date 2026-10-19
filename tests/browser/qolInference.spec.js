import {enterArtwork} from './enterArtwork.js';
import {test,expect} from '@playwright/test';import fs from 'node:fs';
test('assisted controls stop unused hand inference while retaining the requested camera',async({page})=>{
 await page.addInitScript(()=>{
  window.inferenceFrames=0;window.workerStops=0;navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const draw=()=>{c.getContext('2d').fillRect(0,0,640,480);requestAnimationFrame(draw);};draw();return c.captureStream(30);};
  window.Worker=class{postMessage(m){m.frame?.close();if(m.type==='frame')window.inferenceFrames++;queueMicrotask(()=>this.onmessage?.({data:m.type==='init'?{type:'ready'}:{type:'hand',landmarks:null,timestamp:m.timestamp,sourceWidth:640,sourceHeight:480}}));}terminate(){window.workerStops++;this.onmessage=null;}};
 });
 await page.goto('/');await enterArtwork(page);await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'ENABLE CAMERA',exact:true}).click();await expect(page.getByRole('status',{name:'Input status'})).toContainText('Camera ready');
 const measure=async()=>{const before=await page.evaluate(()=>window.inferenceFrames);await page.waitForTimeout(500);return await page.evaluate(before=>window.inferenceFrames-before,before);};
 const activeFrames=await measure();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();await page.waitForTimeout(100);const assistedFrames=await measure();
 const cameraLive=await page.locator('video').evaluate(video=>video.srcObject.getVideoTracks().every(t=>t.readyState==='live'));
 fs.writeFileSync(`.test-artifacts/qol-inference-${process.env.LUMEN_QOL_PROFILE||'after'}.json`,JSON.stringify({windowMs:500,activeFrames,assistedFrames,cameraLive,environment:'Chromium; synthetic canvas camera and worker dispatch counter; no physical inference benchmark'},null,2));
 expect(activeFrames).toBeGreaterThan(0);expect(assistedFrames).toBe(0);expect(cameraLive).toBe(true);expect(await page.evaluate(()=>window.workerStops)).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Use camera interaction',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.inferenceFrames)).toBeGreaterThan(activeFrames);
});
