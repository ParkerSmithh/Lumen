import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
test('legacy and neon renderer timing and resource plateau',async({page})=>{
 test.setTimeout(1200000);await page.goto('/');
 page.on('console',message=>{if(message.text().startsWith('[neon profile]'))console.log(message.text());});
 const full=process.env.LUMEN_NEON_PROFILE==='1';
 const canvasOnly=process.env.LUMEN_NEON_CANVAS_ONLY==='1';
 const rows=await page.evaluate(async({full,canvasOnly})=>{
  const {neonGlowScene}=await import('/tests/fixtures/neonGlowScene.js');const scene=neonGlowScene();const rows=[];
  const legacy=await import('/tests/fixtures/legacyGlowRenderer.js'),current=await import('/src/effects/glowRenderer.js');
  for(const [name,mod] of [['OLD',legacy],['NEON',current]])for(const fallback of [false,true])for(let run=0;run<(full?3:1);run++){
   if(canvasOnly&&(name!=='NEON'||!fallback))continue;
   const canvas=document.createElement('canvas');let counts={textures:0,framebuffers:0,buffers:0,programs:0,shaders:0};if(fallback)canvas.getContext('2d');else{
    const g=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
    for(const [kind,key] of [['Texture','textures'],['Framebuffer','framebuffers'],['Buffer','buffers'],['Program','programs'],['Shader','shaders']]){const create=g[`create${kind}`].bind(g),remove=g[`delete${kind}`].bind(g);g[`create${kind}`]=(...args)=>{const v=create(...args);if(v)counts[key]++;return v;};g[`delete${kind}`]=v=>{if(v)counts[key]--;return remove(v);};}
   }const r=mod.createGlowRenderer(canvas);r.resize(960,720);
   const gl=fallback?null:canvas.getContext('webgl'),ext=gl?.getExtension('EXT_disjoint_timer_query'),gpu=[],times=[],intervals=[],maskTimes=[];let pending=null,last=performance.now(),i=0;
   const begin=performance.now(),warmup=full?5000:500,duration=full?35000:3000;let currentMask=scene.mask;
   while(performance.now()-begin<duration){
    const now=performance.now(),sampling=now-begin>=warmup;if(i%4===0)currentMask={...scene.mask,timestamp:now};
    if(pending&&ext.getQueryObjectEXT(pending,ext.QUERY_RESULT_AVAILABLE_EXT)){if(!gl.getParameter(ext.GPU_DISJOINT_EXT)&&sampling)gpu.push(ext.getQueryObjectEXT(pending,ext.QUERY_RESULT_EXT)/1e6);ext.deleteQueryEXT(pending);pending=null;}
    const q=ext&&!pending?ext.createQueryEXT():null;if(q)ext.beginQueryEXT(ext.TIME_ELAPSED_EXT,q);
    const start=performance.now();r.draw({video:scene.camera,mask:currentMask,color:'#ff354e',opacity:1,time:now});const cpu=performance.now()-start;
    if(q){ext.endQueryEXT(ext.TIME_ELAPSED_EXT);pending=q;}if(sampling){times.push(cpu);intervals.push(now-last);if(i%4===0){const maskMs=r.diagnostics?.().maskMs;if(Number.isFinite(maskMs))maskTimes.push(maskMs);}}last=now;i++;await new Promise(requestAnimationFrame);
   }
   if(pending)ext.deleteQueryEXT(pending);
   const stats=a=>{a.sort((a,b)=>a-b);return {samples:a.length,medianMs:a[Math.floor(a.length*.5)]??null,p95Ms:a[Math.min(a.length-1,Math.floor(a.length*.95))]??null};};
   const before=r.diagnostics?.()||(!fallback?{...counts}:null);r.dispose();rows.push({name,fallback,run,cpu:stats(times),gpu:ext?stats(gpu):{available:false},frameInterval:stats(intervals),maskPreparation:{available:maskTimes.length>0,...stats(maskTimes)},before,after:r.diagnostics?.()||(!fallback?{...counts}:null)});console.log('[neon profile]',JSON.stringify(rows.at(-1)));
  }return rows;
 },{full,canvasOnly});
 writeFileSync(canvasOnly?'docs/true-neon-glow-canvas-recheck.json':full?'docs/true-neon-glow-performance.json':'.test-artifacts/neon-timing.json',JSON.stringify({method:canvasOnly?'Canvas-only three-run recheck after fractional-confidence morphology correction, same 5s warmup and 30s sample at 960x720; synthetic input, fresh mask every fourth RAF.':full?'Three sequential runs per backend and renderer, 5s warmup plus 30s sample at 960x720. Synthetic camera and fresh masks every fourth frame. CPU submission and optional asynchronous non-disjoint GPU queries reported separately.':'Short diagnostic: 0.5s warmup, 2.5s sample.',rows},null,2));
 expect(rows).toHaveLength(canvasOnly?3:full?12:4);
});

test('bounded resources across 50 lifecycles and sustained rendering',async({page})=>{
 test.setTimeout(700000);await page.goto('/');const full=process.env.LUMEN_NEON_PROFILE==='1';
 page.on('console',message=>{if(message.text().startsWith('[neon profile]'))console.log(message.text());});
 const result=await page.evaluate(async full=>{
  const {createGlowRenderer}=await import('/src/effects/glowRenderer.js');const {neonGlowScene}=await import('/tests/fixtures/neonGlowScene.js');const scene=neonGlowScene(),c=document.createElement('canvas');const cycles=[];
  for(let i=0;i<50;i++){const r=createGlowRenderer(c);r.resize(640,480);r.draw({video:scene.camera,mask:scene.mask,color:'#ff354e',opacity:1,time:i*100});r.dispose();cycles.push(r.diagnostics());}
  const r=createGlowRenderer(c);r.resize(960,720);const start=performance.now(),samples=[];let last=0,i=0;
  while(performance.now()-start<(full?600000:2000)){const now=performance.now();r.draw({video:scene.camera,mask:{...scene.mask,timestamp:now},color:'#ff354e',opacity:1,time:now,intensity:['SOFT','NEON','SUPERNOVA'][Math.floor(i/120)%3]});if(now-last>=1000){samples.push({...r.diagnostics(),elapsedMs:now-start,heap:performance.memory?.usedJSHeapSize});last=now;if(samples.length%60===0)console.log('[neon profile]',JSON.stringify(samples.at(-1)));}i++;await new Promise(requestAnimationFrame);}
  r.dispose();return {cycles,samples,frames:i,elapsedMs:performance.now()-start,disposed:r.diagnostics()};
 },full);
 writeFileSync(full?'docs/true-neon-glow-soak.json':'.test-artifacts/neon-soak.json',JSON.stringify(result,null,2));
 for(const s of result.samples){expect(s.textures).toBe(9);expect(s.framebuffers).toBe(7);expect(s.targetBytes).toBeLessThan(4*1024*1024);}for(const s of result.cycles)expect(s.textures).toBe(0);expect(result.disposed.textures).toBe(0);
});
