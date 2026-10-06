import {test,expect} from '@playwright/test';import fs from 'node:fs';
test('measure Ballpit cost as active count increases',async({page})=>{
 test.setTimeout(Number(process.env.LUMEN_TEST_TIMEOUT||120000));await page.goto('/');const results=await page.evaluate(async()=>{
 const {createBallpit}=await import('/src/effects/Ballpit.jsx');const host=document.createElement('div');host.style.cssText='position:absolute;width:1000px;height:560px';document.body.append(host);const canvas=document.createElement('canvas');host.append(canvas);
 const instance=createBallpit(canvas,{count:201,maxActive:200,interactiveCreation:true,followCursor:false,colors:[0x38206b,0x7160b1],gravity:.01});
 const samples=[],summary=a=>{const sorted=[...a].sort((a,b)=>a-b);return {median:sorted[Math.floor(sorted.length/2)],p95:sorted[Math.floor(sorted.length*.95)]};};
 try{for(const count of [0,50,100,150,200]){
 while(instance.spheres.activeCount<count)instance.spawn({x:(Math.random()-.5)*12,y:(Math.random()-.5)*6,z:(Math.random()-.5)*4},'#4d9fff');
 await new Promise(r=>setTimeout(r,400));const frames=[],cpu=[];let last;
 const step=instance.three.onBeforeRender;instance.three.onBeforeRender=e=>{const start=performance.now();step(e);cpu.push(performance.now()-start);};
 await new Promise(resolve=>{const tick=time=>{if(last)frames.push(time-last);last=time;if(frames.length<90)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});instance.three.onBeforeRender=step;
 samples.push({active:count,frameMs:summary(frames),physicsAndInputMs:summary(cpu)});
 }}finally{instance.dispose();host.remove();}return samples;
 });fs.writeFileSync('.test-artifacts/repair-launch-performance.json',JSON.stringify({environment:`headless ${process.env.LUMEN_BROWSER_EXECUTABLE||process.env.LUMEN_BROWSER_CHANNEL||'msedge'}, 1000x560 renderer, no hand inference`,results},null,2));console.log(JSON.stringify(results));expect(results).toHaveLength(5);
});
