import {enterArtwork} from './enterArtwork.js';
import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {startGame} from './startGame.js';

test('OLD versus TRUE NEON mounted FREE GLOW and ENERGY RUSH tracking budget',async({browser})=>{
 test.setTimeout(240000);const rows=[];
 for(const legacy of [true,false])for(const intensity of ['CALM','WILD','MAX'])for(const mode of ['FREE','RUSH']){
  const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();
  if(legacy)await page.route('**/src/effects/glowRenderer.js',route=>route.fulfill({contentType:'text/javascript',body:"export {createGlowRenderer} from '/tests/fixtures/legacyGlowRenderer.js';"}));
  await page.addInitScript(()=>{
   const nativeRAF=requestAnimationFrame.bind(window),now=performance.now.bind(performance);window.neonBench={masks:[],buckets:new Map()};
   window.requestAnimationFrame=fn=>nativeRAF(t=>{const start=now();try{fn(t);}finally{const b=window.neonBench.buckets;b.set(t,(b.get(t)||0)+now()-start);if(b.size>1200)b.delete(b.keys().next().value);}});
   const Native=Worker;window.Worker=class extends Native{constructor(...args){super(...args);if(String(args[0]).includes('segmentation.worker'))this.addEventListener('message',({data})=>{if(data.type==='mask'){window.neonBench.masks.push({time:data.timestamp,returned:now()});if(window.neonBench.masks.length>100)window.neonBench.masks.shift();}});}};
   navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const x=c.getContext('2d');const draw=()=>{x.fillStyle='#263549';x.fillRect(0,0,640,480);x.fillStyle='#ac8972';x.fillRect(250,60,140,350);nativeRAF(draw);};draw();return c.captureStream(30);};
  });
  await page.goto('/');await enterArtwork(page);await page.getByRole('button',{name:'ENABLE CAMERA',exact:true}).click();await page.getByRole('button',{name:intensity,exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.neonBench.masks.length),{timeout:20000}).toBeGreaterThan(10);
  if(mode==='RUSH'){await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await startGame(page);}
  const row=await page.evaluate(async()=>{
   const b=window.neonBench;b.masks=[];b.buckets.clear();const start=performance.now();while(b.masks.length<40&&performance.now()-start<15000)await new Promise(r=>setTimeout(r,100));
   const stat=a=>{a.sort((a,b)=>a-b);return {samples:a.length,medianMs:a[Math.floor(a.length/2)],p95Ms:a[Math.min(a.length-1,Math.floor(a.length*.95))]};};return {cadence:stat(b.masks.slice(1).map((m,i)=>m.returned-b.masks[i].returned)),latency:stat(b.masks.map(m=>m.returned-m.time)),mainThreadRAF:stat([...b.buckets.values()])};
  });rows.push({renderer:legacy?'OLD':'TRUE NEON',intensity,mode,...row});expect(row.cadence.samples).toBeGreaterThan(30);await context.close();
 }
 const comparisons=rows.filter(r=>r.renderer==='TRUE NEON').map(r=>{const old=rows.find(o=>o.renderer==='OLD'&&o.mode===r.mode&&o.intensity===r.intensity);return {mode:r.mode,intensity:r.intensity,cadenceMedianChangePercent:(r.cadence.medianMs/old.cadence.medianMs-1)*100,mainThreadP95DeltaMs:r.mainThreadRAF.p95Ms-old.mainThreadRAF.p95Ms};});
 writeFileSync('docs/true-neon-glow-mounted-performance.json',JSON.stringify({method:'Sequential fresh contexts; actual segmentation worker/model, synthetic canvas stream; forty returned masks after warmup. All three CHAOS intensities; default NEON visual preset. This measures scheduling, not physical segmentation quality; deterministic mask renderer profiling separately measures bloom workload.',rows,comparisons},null,2));
});
