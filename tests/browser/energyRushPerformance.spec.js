import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';

test('mounted FREE GLOW and ENERGY RUSH share real segmentation cadence under CALM WILD MAX',async({browser})=>{
 test.setTimeout(180000);const rows=[];
 for(const intensity of ['CALM','WILD','MAX'])for(const mode of ['FREE','RUSH']){
  const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();
  await page.addInitScript(()=>{
   const nativeRAF=requestAnimationFrame.bind(window),nativeNow=performance.now.bind(performance),buckets=new Map();window.energyTiming={masks:[],buckets};
   window.requestAnimationFrame=fn=>nativeRAF(t=>{const start=nativeNow();try{fn(t);}finally{buckets.set(t,(buckets.get(t)||0)+nativeNow()-start);if(buckets.size>1200)buckets.delete(buckets.keys().next().value);}});
   const Native=window.Worker;window.Worker=class extends Native{constructor(...args){super(...args);if(String(args[0]).includes('segmentation.worker'))this.addEventListener('message',({data})=>{if(data.type==='mask'){window.energyTiming.masks.push({timestamp:data.timestamp,returned:nativeNow()});if(window.energyTiming.masks.length>100)window.energyTiming.masks.shift();}});}};
   navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d');const draw=()=>{ctx.fillStyle='#263549';ctx.fillRect(0,0,640,480);ctx.fillStyle='#ac8972';ctx.fillRect(250,60,140,350);nativeRAF(draw);};draw();return c.captureStream(30);};
  });
  await page.goto('/?debugEnergy');await page.getByRole('button',{name:'ENABLE CAMERA',exact:true}).click();await page.getByRole('button',{name:intensity,exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.energyTiming.masks.length),{timeout:15000}).toBeGreaterThan(10);
  if(mode==='RUSH'){await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await page.getByRole('button',{name:'START',exact:true}).click();await expect(page.getByRole('button',{name:'PAUSE',exact:true})).toBeVisible({timeout:10000});}
  const row=await page.evaluate(async({mode,intensity})=>{
   window.energyTiming.masks=[];window.energyTiming.buckets.clear();const begin=performance.now();while(window.energyTiming.masks.length<40&&performance.now()-begin<10000)await new Promise(r=>setTimeout(r,100));
   const masks=window.energyTiming.masks,stats=a=>{a.sort((x,y)=>x-y);return {samples:a.length,medianMs:a[Math.floor(a.length/2)],p95Ms:a[Math.min(a.length-1,Math.floor(a.length*.95))]};};
   return {mode,intensity,maskLatency:stats(masks.map(m=>m.returned-m.timestamp)),maskCadence:stats(masks.slice(1).map((m,i)=>m.returned-masks[i].returned)),mainThreadRAF:stats([...window.energyTiming.buckets.values()]),state:window.__lumenEnergy?.snapshot()};
  },{mode,intensity});
  expect(row.maskCadence.samples).toBeGreaterThan(30);if(mode==='RUSH'){expect(row.state.orbs.length).toBeLessThanOrEqual(6);expect(row.state.hazards.length).toBeLessThanOrEqual(2);}delete row.state;rows.push(row);await context.close();
 }
 const comparisons=['CALM','WILD','MAX'].map(intensity=>{const free=rows.find(r=>r.intensity===intensity&&r.mode==='FREE'),rush=rows.find(r=>r.intensity===intensity&&r.mode==='RUSH');return {intensity,cadenceMedianChangePercent:(rush.maskCadence.medianMs/free.maskCadence.medianMs-1)*100,mainThreadP95DeltaMs:rush.mainThreadRAF.p95Ms-free.mainThreadRAF.p95Ms};});
 writeFileSync('docs/energy-rush-performance.json',JSON.stringify({method:'Mounted actual GLOW renderer and actual segmentation worker/model. Painted canvas camera; physical person-mask quality is not measured. Supplemental pose off. Forty returned masks after warmup in fresh sequential headless contexts. RAF timings measure aggregate synchronous main-thread callbacks, excluding inference CPU, GPU completion and compositor work.',limitations:'Synthetic input and sequential headless timings do not establish real-webcam reliability or device acceptance. Cadence comparison is diagnostic, not a causal performance guarantee.',rows,comparisons},null,2));
});
