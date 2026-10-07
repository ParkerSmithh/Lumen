import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { browserOptions } from './browser-options.mjs';
import fs from 'node:fs';

// Synthetic capture, real MediaPipe worker and production scene/recognition modules.
// No physical body: these measurements establish machine cost, not playability.
const server=await createServer({server:{host:'127.0.0.1',port:0}});
await server.listen();
let browser;
try {
  browser=await chromium.launch({...browserOptions,headless:true});
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{
    const now=performance.now.bind(performance),raf=requestAnimationFrame.bind(window);let offset=0;
    window.modeFrameCosts=[];window.advanceSlashTime=seconds=>{offset+=seconds*1000;};
    performance.now=()=>now()+offset;
    window.requestAnimationFrame=callback=>raf(time=>{const start=now();callback(time+offset);if(callback.name==='draw')window.modeFrameCosts.push(now()-start);});
    navigator.mediaDevices.getUserMedia=async()=>{
      const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d');
      let paint;const paintCamera=()=>{ctx.fillStyle='#141018';ctx.fillRect(0,0,640,480);paint=requestAnimationFrame(paintCamera);};paintCamera();
      const stream=c.captureStream(30);stream.getVideoTracks()[0].addEventListener('ended',()=>cancelAnimationFrame(paint));return stream;
    };
  });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?debugTracking&debugSlash`);
  await page.getByRole('button',{name:'SLASH',exact:true}).click();
  await page.getByRole('button',{name:'Enter with camera',exact:true}).click();
  await page.waitForFunction(()=>window.__lumenTracking?.metrics?.report().samples>=15);
  // Keep capture/inference and the visible camera preview running, but avoid a second active scene.
  const result=await page.evaluate(async()=>{
    const {createSlashScene}=await import('/src/effects/slashScene.js');
    const {createSlashGame}=await import('/src/game/slashGame.js');
    const canvas=document.querySelector('.slash-artwork'),ctx=canvas.getContext('2d');
    const scene=createSlashScene(ctx),game=createSlashGame();game.start(0);
    scene.setSize(1366,768,{x:171,y:92,width:1024,height:584});
    const cpu=[],updates=[],draws=[],cuts=[],frames=[],ages=[];let last,peak=0,maxEffects=0,hits=0;
    const summarize=values=>{const sorted=values.slice().sort((a,b)=>a-b);return{median:sorted[Math.floor(sorted.length*.5)]??0,p95:sorted[Math.floor(sorted.length*.95)]??0};};
    for(let frame=1;frame<=6000;frame++)scene.update(1/60,game.tick(3000+frame/60*1000));
    const activeAtStart=scene.inspect().objects.length;
    const wallStart=performance.now();
    await new Promise(resolve=>{
      const frame=time=>{
        if(last!==undefined)frames.push(time-last);last=time;
        const started=performance.now(),state=game.tick(103000+(time-wallStart));
        scene.update(1/60,state);const updated=performance.now();updates.push(updated-started);
        const targets=scene.inspect().objects;peak=Math.max(peak,targets.length);
        if(time-wallStart>=3000&&cpu.length%45===0){
          const path=targets.map(o=>({center:{x:o.x,y:o.y},edge:[{x:o.x,y:o.y-20},{x:o.x,y:o.y+20}]}));
          if(path.length){const cutStart=performance.now();hits+=scene.cut({start:path[0].center,end:path.at(-1).center,edge:path.at(-1).edge,previousEdge:path[0].edge,path,source:'camera-motion',strength:.8});cuts.push(performance.now()-cutStart);}
        }
        const drawStart=performance.now();scene.draw();draws.push(performance.now()-drawStart);cpu.push(performance.now()-started);
        const effect=scene.inspect().effects;maxEffects=Math.max(maxEffects,effect.particles);
        const hand=window.__lumenTracking.handRef.current;if(hand)ages.push(performance.now()-hand.timestamp);
        if(time-wallStart<10000)requestAnimationFrame(frame);else resolve();
      };requestAnimationFrame(frame);
    });
    const tracking=window.__lumenTracking.metrics.report();scene.dispose();
    return{frames:cpu.length,activeAtStart,peak,hits,maxParticles:maxEffects,wallSeconds:(performance.now()-wallStart)/1000,
      cpuMs:summarize(cpu),updateMs:summarize(updates),drawMs:summarize(draws),cutMs:summarize(cuts),frameMs:summarize(frames),handPacketAgeMs:summarize(ages),tracking};
  });
  await page.getByRole('button',{name:'START',exact:true}).click();
  await page.evaluate(()=>window.advanceSlashTime(103));
  // Let actual gameplay fill its cap and let inference recover from the deliberate clock jump.
  await page.waitForTimeout(3500);
  const integrated=await page.evaluate(async()=>{
    window.modeFrameCosts.length=0;
    const frames=[],ages=[];let previous,peak=0;const start=performance.now();
    await new Promise(resolve=>{const sample=time=>{
      if(previous!==undefined)frames.push(time-previous);previous=time;
      peak=Math.max(peak,window.__lumenSlash.inspect().objects.length);
      const hand=window.__lumenTracking.handRef.current;if(hand)ages.push(performance.now()-hand.timestamp);
      if(time-start<10000)requestAnimationFrame(sample);else resolve();
    };requestAnimationFrame(sample);});
    const stats=values=>{const s=values.slice().sort((a,b)=>a-b);return{median:s[Math.floor(s.length*.5)]??0,p95:s[Math.floor(s.length*.95)]??0};};
    return{peak,frames:frames.length,modeCpuMs:stats(window.modeFrameCosts),frameMs:stats(frames),handPacketAgeMs:stats(ages),tracking:window.__lumenTracking.metrics.report(),endingState:window.__lumenSlash.state()};
  });
  const report={environment:'Windows headless Edge, 1366x768, synthetic 640x480 canvas camera at 30fps, actual MediaPipe worker, visible webcam preview; controller advanced to 100s, then 10s real-time sampling (3s at full cap, 7s repeated multi-object cuts), followed by 10s integrated actual gameplay at 103.5–113.5s with camera-motion processing enabled. CPU excludes deferred GPU work. Blank input contains no physical hand.',...result,integrated};
  fs.mkdirSync('.test-artifacts',{recursive:true});fs.writeFileSync('.test-artifacts/slash-game-performance.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
}finally{await browser?.close();await server.close();}
