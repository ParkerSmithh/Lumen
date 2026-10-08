import {test,expect} from '@playwright/test';
import { startSlashSession } from './slashSession.js';
test('SLASH camera motion reaches recognition even when MediaPipe returns no hand',async({page})=>{
 await page.addInitScript(()=>{
  navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d');let raf;window.motionEnabled=false;let start=performance.now();const draw=()=>{ctx.fillStyle='#101010';ctx.fillRect(0,0,640,480);const y=window.motionEnabled?160+Math.sin((performance.now()-start)/180)*120:160;for(let row=0;row<180;row++){ctx.fillStyle=`rgb(${220-Math.floor(row/4)%6*28},${220-Math.floor(row/4)%6*28},${220-Math.floor(row/4)%6*28})`;ctx.fillRect(270,y+row,80,1);}raf=requestAnimationFrame(draw);};draw();const stream=c.captureStream(30);stream.getVideoTracks()[0].addEventListener('ended',()=>cancelAnimationFrame(raf));return stream;};
  window.Worker=class{postMessage(d){if(d.type==='init')queueMicrotask(()=>this.onmessage?.({data:{type:'ready'}}));if(d.type==='frame'){d.frame.close();queueMicrotask(()=>this.onmessage?.({data:{type:'hand',landmarks:null,timestamp:d.timestamp,sourceWidth:640,sourceHeight:480,inferenceMs:0}}));}}terminate(){this.onmessage=null;}};
 });
 await page.goto('/?debugTracking');await page.getByRole('button',{name:'SLASH',exact:true}).click();await page.getByRole('button',{name:'ENABLE CAMERA',exact:true}).click();await startSlashSession(page);await page.waitForTimeout(700);
 expect(await page.evaluate(()=>window.__lumenTracking.handRef.current?.slashDebug?.recognizedSegments||0)).toBe(0);
 await page.evaluate(()=>window.motionEnabled=true);await expect.poll(()=>page.evaluate(()=>window.__lumenTracking.handRef.current?.slashDebug?.recognizedSegments||0)).toBeGreaterThan(2);
 expect(await page.evaluate(()=>window.__lumenTracking.handRef.current.handDetected)).toBe(false);
});

