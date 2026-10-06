import { installFrameClock } from './frameClock.js';
import {test,expect} from '@playwright/test';
async function camera(page){await installFrameClock(page);await page.addInitScript(()=>{
 const make=(x=.65,scale=1)=>{
  const p=Array.from({length:21},()=>({x:.5,y:.63,z:0}));p[0]={x:.5,y:.7,z:0};p[5]={x:.45,y:.5,z:0};p[6]={x:.45,y:.4,z:-.015};p[7]={x:.45,y:.32,z:-.03};p[8]={x:.45,y:.25,z:-.06};p[9]={x:.5,y:.48,z:0};p[17]={x:.6,y:.53,z:0};
  return p.map(v=>({x:x+(v.x-.5)*scale,y:.7+(v.y-.7)*scale,z:v.z}));
 };window.motionPose=make();window.setPose=(x,scale)=>{window.motionPose=make(x,scale);};
 navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d');let raf;const paint=()=>{ctx.fillRect(0,0,640,480);raf=requestAnimationFrame(paint);};paint();const stream=c.captureStream(30);stream.getVideoTracks()[0].addEventListener('ended',()=>cancelAnimationFrame(raf));return stream;};
 window.Worker=class{postMessage(data){if(data.type==='init')queueMicrotask(()=>this.onmessage?.({data:{type:'ready'}}));if(data.type==='frame'){data.frame.close();queueMicrotask(()=>this.onmessage?.({data:{type:'hand',landmarks:window.motionPose,timestamp:data.timestamp,sourceWidth:640,sourceHeight:480,inferenceMs:0}}));}}terminate(){this.onmessage=null;}};
 const original=HTMLCanvasElement.prototype.getContext;window.launchInstances=0;HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=original.call(this,type,...args);if(gl&&type==='webgl2'&&this.closest('.launch-artwork')){const draw=gl.drawElementsInstanced.bind(gl);gl.drawElementsInstanced=(...args)=>{window.launchInstances=args[4];return draw(...args);};}return gl;};
 });}

test('generated hand movement reaches the bright FLOW emitter without a false reset',async({page})=>{
 await camera(page);await page.goto('/?debugTracking&trackingHz=30');await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'Blue',exact:true}).click();await page.getByRole('button',{name:'Enter with camera',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__lumenTracking?.handRef.current?.handDetected)).toBe(true);
 await page.evaluate(()=>window.setPose(.35,1));
 await expect.poll(()=>page.evaluate(()=>window.__lumenTracking.handRef.current.indexFinger.x)).toBeGreaterThan(.68);
 const readEmitter=()=>page.evaluate(()=>{const h=window.__lumenTracking.handRef.current,c=document.querySelector('.flow-light'),rectWidth=innerHeight*4/3,x=(innerWidth-rectWidth)/2+h.indexFinger.x*rectWidth,y=h.indexFinger.y*innerHeight,ratio=c.width/innerWidth;const pixel=[...c.getContext('2d').getImageData(Math.round((x+8)*ratio),Math.round(y*ratio),1,1).data];return {pixel,report:window.__lumenTracking.metrics.report()};});
 await expect.poll(async()=> (await readEmitter()).pixel[3]).toBeGreaterThan(20);
 const result=await readEmitter();expect(result.pixel[3]).toBeGreaterThan(20);expect(result.pixel[2]).toBeGreaterThan(result.pixel[0]);expect(result.report.resets.jump||0).toBe(0);await page.screenshot({path:'.test-artifacts/tuning-flow-motion.png'});
});

test('generated camera push creates once, holds, retracts and creates again',async({page})=>{
 await camera(page);await page.goto('/?debugTracking&trackingHz=30');await page.getByRole('button',{name:'LAUNCH',exact:true}).click();await page.getByRole('button',{name:'Enter with camera',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__lumenTracking?.handRef.current?.pushDebug?.state)).toBe('READY');expect(await page.evaluate(()=>window.launchInstances)).toBe(1);
 await page.evaluate(()=>window.setPose(.5,1.18));await expect.poll(()=>page.evaluate(()=>window.launchInstances)).toBe(2);await page.waitForTimeout(700);expect(await page.evaluate(()=>window.launchInstances)).toBe(2);
 await expect.poll(()=>page.evaluate(()=>window.__lumenTracking.handRef.current?.pushDebug?.suppressForce)).toBe(false);
 await page.evaluate(()=>window.setPose(.5,1));await expect.poll(()=>page.evaluate(()=>window.__lumenTracking.handRef.current?.pushDebug?.state)).toBe('READY');
 await page.evaluate(()=>window.setPose(.5,1.18));await expect.poll(()=>page.evaluate(()=>window.launchInstances)).toBe(3);
});
