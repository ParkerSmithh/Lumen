import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { browserOptions } from '../../scripts/browser-options.mjs';

// This fixture exercises mounted modes. Only camera input/inference is synthetic.
function installBenchmark() {
  const nativeNow = performance.now.bind(performance);
  const nativeRAF = requestAnimationFrame.bind(window);
  let offset = 0, seed = 90210;
  // Keep SLASH's measured population at ten: exclude capacity-reserving splitters.
  Math.random = () => .2 + .8 * ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  Object.defineProperty(performance, 'now', { value: () => nativeNow() + offset });
  const buckets = new Map(), trackingSamples = [];
  window.requestAnimationFrame = callback => nativeRAF(timestamp => {
    const started = nativeNow();
    try { callback(timestamp + offset); }
    finally {
      const bucket = buckets.get(timestamp) || { cpu: 0, callbacks: [] };
      const duration = nativeNow() - started;
      bucket.cpu += duration; bucket.callbacks.push(duration); buckets.set(timestamp, bucket);
    }
  });
  const next = () => new Promise(resolve => nativeRAF(resolve));
  const summary = samples => {
    const sorted = [...samples].sort((a, b) => a - b);
    return { samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))] };
  };
  window.__beyondBench = {
    advance: milliseconds => { offset += milliseconds; },
    next,
    async measure(mode, warmup = 60, frames = 180) {
      trackingSamples.length = 0;
      const cpu = [], callback = [], intervals = [];
      let previous, maximumObjects = 0, maximumParticles = 0, cutsBefore = window.__lumenSlash?.input().recognizedSegments || 0;
      const host = document.querySelector(mode === 'FLOW' ? '.flow-artwork' : mode === 'SLASH' ? '.slash-artwork' : '.launch-artwork');
      const bounds = host?.getBoundingClientRect();
      let pressed = false, sweepStart = null, sweepTarget = null, nextSweep = 0;
      const pointer = (type, x, y) => host?.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, pointerType: 'mouse', buttons: 1, clientX: bounds.left + x, clientY: bounds.top + y }));
      for (let frame = 0; frame < warmup + frames + 1; frame++) {
        const timestamp = await next();
        if (previous !== undefined && frame > warmup) {
          // RAF registration order may place application callbacks before the observer.
          // Drain all callbacks since the previous native observation, rather than
          // assuming every callback ran after that observation's timestamp.
          const bucket = { cpu: 0, callbacks: [] };
          for (const pending of buckets.values()) { bucket.cpu += pending.cpu; bucket.callbacks.push(...pending.callbacks); }
          cpu.push(bucket.cpu); callback.push(...bucket.callbacks); intervals.push(timestamp - previous);
        }
        buckets.clear(); previous = timestamp;
        if (frame === 0) document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, code: 'KeyP', key: 'p' }));
        if (mode === 'FLOW') {
          // Real pointer trail drives both fluid and trace evaluation; same trajectory for each pair.
          const path = window.__lumenTrace?.target();
          const point = path?.[frame % path.length];
          pointer('pointermove', point ? point.x * bounds.width : bounds.width * (.5 + .3 * Math.sin(frame * .14)), point ? point.y * bounds.height : bounds.height * (.5 + .2 * Math.cos(frame * .19)));
        }
        if(mode==='LAUNCH'&&frame%30===0){const pit=window.__lumenKinetic?.instance,target=pit?.target;if(target)pit.spawn({x:target.x,y:target.y,z:target.z+1.4},'#b06aff',.65);}
        if (mode === 'SLASH') {
          const state = window.__lumenSlash.inspect();
          maximumObjects = Math.max(maximumObjects, state.objects.length);
          maximumParticles = Math.max(maximumParticles, state.effects.particles);
          // Use a native-time gesture: headless RAF can run faster than display cadence.
          // A 180px / 140ms drag stays below the detector's spike rejection ceiling.
          const now = nativeNow();
          if (!pressed && now >= nextSweep && state.objects.length) {
            sweepTarget = state.objects[0]; sweepStart = now;
            pointer('pointerdown', sweepTarget.x - 90, sweepTarget.y); pressed = true;
          }
          if (pressed) {
            const progress = Math.min(1, (now - sweepStart) / 140);
            pointer('pointermove', sweepTarget.x - 90 + progress * 180, sweepTarget.y);
            if (progress === 1) { pointer('pointerup', sweepTarget.x + 90, sweepTarget.y); pressed = false; nextSweep = now + 450; }
          }
        }
      }
      if (pressed) pointer('pointerup', bounds.width / 2, bounds.height / 2);
      const physics = window.__lumenKinetic?.instance?.spheres.physics;
      return {
        syntheticTracking: { samples: trackingSamples.length, latency: trackingSamples.length ? summary(trackingSamples.map(x => x.latency)) : null, cadence: trackingSamples.length > 1 ? summary(trackingSamples.slice(1).map((x,i) => x.at - trackingSamples[i].at)) : null },
        cpuCallbacksPerFrame: summary(cpu), cpuPerCallback: summary(callback), nativeFrameInterval: summary(intervals),
        maximumObjects, maximumParticles, recognizedCuts: (window.__lumenSlash?.input().recognizedSegments || 0) - cutsBefore,
        slashState: window.__lumenSlash?.state(), activeBalls: window.__lumenKinetic?.instance?.spheres.activeCount,
        launchTarget:window.__lumenKinetic?.instance?.target, launchRound: window.__lumenKinetic?.game?.(), finitePhysics: physics ? [...physics.positionData, ...physics.velocityData].every(Number.isFinite) : undefined,
        chaos: window.__lumenChaos?.snapshot?.(mode), chaosCounts: window.__lumenChaos?.counts?.(), beyondEnabled: window.__lumenBeyond?.enabled?.(), beyond: window.__lumenBeyond?.snapshot?.(), counts: window.__lumenBeyond?.counts?.(),
      };
    },
  };
  navigator.mediaDevices.getUserMedia = async () => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext('2d'); let id, tick = 0;
    const paint = () => { ctx.fillStyle = '#304060'; ctx.fillRect(0, 0, 640, 480); ctx.fillStyle = '#b09080'; ctx.fillRect(200 + Math.sin(tick++ / 10) * 20, 60, 150, 360); id = nativeRAF(paint); };
    paint(); const stream = canvas.captureStream(30);
    stream.getTracks()[0].addEventListener('ended', () => cancelAnimationFrame(id)); return stream;
  };
  const ActualWorker = window.Worker;
  window.Worker = class {
    constructor(url, options) {
      if (!String(url).includes('segmentation.worker')) return new ActualWorker(url, options);
      this.closed = false; this.sequence = 0;
    }
    postMessage(message) {
      if (this.closed) return;
      message.frame?.close();
      if (message.type === 'init') { setTimeout(() => this.onmessage?.({ data: { type: 'ready' } }), 0); return; }
      const width = 160, height = 120, values = new Float32Array(width * height), center = 80 + Math.sin(this.sequence++ / 8) * 7;
      for (let y = 10; y < 110; y++) for (let x = 0; x < width; x++) if (Math.abs(x - center) < 23 + Math.sin(y / 12) * 5) values[y * width + x] = 1;
      setTimeout(() => { if(this.closed)return; trackingSamples.push({at:nativeNow(),latency:performance.now()-message.timestamp}); if(trackingSamples.length>10000)trackingSamples.shift(); this.onmessage?.({ data: { type: 'mask', values, width, height, sourceWidth: 640, sourceHeight: 480, timestamp: message.timestamp } }); }, 0);
    }
    terminate() { this.closed = true; }
  };
}

test('compare actual mode frame cost with CHAOS off WILD and MAX', async ({ browser }) => {
  test.setTimeout(Number(process.env.LUMEN_TEST_TIMEOUT || 120000));
  const results = [];
  for (const mode of ['GLOW', 'FLOW', 'SLASH', 'LAUNCH']) {
    for (const intensity of ['OFF', 'WILD', 'MAX']) {
      const enabled = intensity !== 'OFF';
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      try {
        await page.addInitScript(installBenchmark);
        await page.addInitScript(value => localStorage.setItem('lumen-chaos-intensity-v1', value), enabled ? intensity : 'WILD');
        await page.goto('/?debugBeyond&debugChaos&debugSlash&debugKinetic&debugTrace' + (enabled ? '' : '&chaosOff'));
        if (mode !== 'GLOW') await page.getByRole('button', { name: mode, exact: true }).click();
        if (mode === 'GLOW') {
          await page.getByRole('button', { name: 'ENABLE CAMERA', exact: true }).click();
          await expect(page.getByRole('button', { name: 'Stop camera' })).toBeVisible();
          await expect(page.getByRole('status')).toContainText('Become light.', { timeout: 15000 });
        } else {
          await page.getByRole('button', { name: 'Mouse / touch fallback', exact: true }).click();
          await page.getByRole('button', { name: 'START', exact: true }).click();
          await page.evaluate(async () => { window.__beyondBench.advance(3100); await window.__beyondBench.next(); await window.__beyondBench.next(); });
          if (mode === 'SLASH') {
            await page.evaluate(async () => { window.__beyondBench.advance(100000); await window.__beyondBench.next(); });
            await expect.poll(() => page.evaluate(() => window.__lumenSlash?.inspect().objects.length), { timeout: 10000 }).toBeGreaterThanOrEqual(6);
          }
          if (mode === 'LAUNCH') {
            await expect.poll(() => page.evaluate(() => !!window.__lumenKinetic?.instance)).toBe(true);
            await page.evaluate(async () => {
              // Allow the mounted game's session reset before populating its actual solver.
              await window.__beyondBench.next(); await window.__beyondBench.next();
              const instance = window.__lumenKinetic.instance, config = instance.spheres.config;
              for (let i = 0; i < 150; i++) instance.spawn({ x: ((i % 15) / 14 - .5) * config.maxX * 1.5, y: (Math.floor(i / 15) / 9 - .5) * config.maxY * 1.3, z: ((i % 3) - 1) * .8 }, '#b06aff', .65);
            });
          }
        }
        // Respect the real PULSE idle gates after creation, tracing, or gestures.
        await page.waitForTimeout(1600);
        const result = await page.evaluate(mode => window.__beyondBench.measure(mode,60,mode==='LAUNCH'?360:180), mode);
        results.push({ mode, intensity, ...result });
        if(enabled){fs.mkdirSync('.test-artifacts',{recursive:true});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'.test-artifacts/chaos-'+mode.toLowerCase()+'-'+intensity.toLowerCase()+'.png'});}
        if(mode==='LAUNCH')console.log(JSON.stringify({intensity,launchTarget:result.launchTarget,launchRound:result.launchRound,chaos:result.chaos,counts:result.chaosCounts}));
        expect(result.beyondEnabled).toBe(true);
        expect(result.chaos).toBeTruthy();expect(result.chaosCounts).toBeTruthy();
        for(const [key,cap] of Object.entries({effects:48,fluid:4,accepted:512,visualDedup:512,shapes:64})) { expect(Number.isFinite(result.chaosCounts[key])).toBe(true);expect(result.chaosCounts[key]).toBeGreaterThanOrEqual(0);expect(result.chaosCounts[key]).toBeLessThanOrEqual(cap); }
        if(!enabled)expect(result.chaosCounts.effects).toBe(0);
        expect(result.beyond.count).toBeGreaterThanOrEqual(0); expect(result.beyond.count).toBeLessThanOrEqual(4);
        const caps = { atmosphere: 16, resonance: 2, pulse: 1, presence: 1, accepted: 512 };
        for (const [key, cap] of Object.entries(caps)) { expect(Number.isFinite(result.counts[key])).toBe(true); expect(result.counts[key]).toBeGreaterThanOrEqual(0); expect(result.counts[key]).toBeLessThanOrEqual(cap); }
        
        expect(result.counts.pulse).toBe(1);
        for (const metric of [result.cpuCallbacksPerFrame, result.cpuPerCallback, result.nativeFrameInterval]) {
          expect(metric.samples).toBeGreaterThan(0); expect(Number.isFinite(metric.medianMs)).toBe(true); expect(Number.isFinite(metric.p95Ms)).toBe(true);
        }
        expect(result.cpuCallbacksPerFrame.samples).toBe(mode==='LAUNCH'?360:180);
        if (mode === 'SLASH') { expect(result.maximumObjects).toBeGreaterThanOrEqual(6); expect(result.maximumObjects).toBeLessThanOrEqual(12); expect(result.maximumParticles).toBeLessThanOrEqual(320); expect(result.slashState.overload).toBe(true); expect(result.recognizedCuts).toBeGreaterThan(0); }
        if (mode === 'LAUNCH') { expect(result.activeBalls).toBe(150); expect(result.finitePhysics).toBe(true); if(enabled){expect(result.chaosCounts.accepted).toBeGreaterThanOrEqual(4);expect(['SURGE','COOLDOWN']).toContain(result.chaos.state);expect(result.chaosCounts.effects).toBeGreaterThan(0);} }
      } finally { await context.close(); }
    }
  }
  const comparisons = ['GLOW', 'FLOW', 'SLASH', 'LAUNCH'].map(mode => {
    const off = results.find(r => r.mode === mode && r.intensity === 'OFF'), on = results.find(r => r.mode === mode && r.intensity === 'WILD'), max = results.find(r => r.mode === mode && r.intensity === 'MAX');
    return { mode, maxP95CpuDeltaMs: max.cpuCallbacksPerFrame.p95Ms - off.cpuCallbacksPerFrame.p95Ms, medianCpuDeltaMs: on.cpuCallbacksPerFrame.medianMs - off.cpuCallbacksPerFrame.medianMs, p95CpuDeltaMs: on.cpuCallbacksPerFrame.p95Ms - off.cpuCallbacksPerFrame.p95Ms, medianFrameDeltaMs: on.nativeFrameInterval.medianMs - off.nativeFrameInterval.medianMs, p95FrameDeltaMs: on.nativeFrameInterval.p95Ms - off.nativeFrameInterval.p95Ms };
  });
  fs.mkdirSync('.test-artifacts', { recursive: true });
  fs.writeFileSync('.test-artifacts/chaos-performance.json', JSON.stringify({
    environment: { browser: browserOptions.executablePath || browserOptions.channel, headless: true, viewport: '1366x768', deviceScaleFactor: 1, warmupFrames: 60, measuredFrames: { GLOW:180,FLOW:180,SLASH:180,LAUNCH:360 } },
    method: 'CHAOS OFF/WILD/MAX with identical new density rules. Mounted GLOW renderer and segmentation hook with synthetic camera/masks; mounted FLOW fluid with pointer trails; mounted SLASH Overload with ten objects, real cuts and GridScan; mounted LAUNCH renderer/solver with 150 balls and real spawn-at-current-target hit events. Seeded input and geometry paired by mode; identical KeyP input before warmup after a 1.6-second idle gate invokes the real PULSE control when BEYOND is enabled. Native clock measures aggregate synchronous RAF callback CPU and native frame intervals; coherent offset only advances game setup.',
    limitations: 'Synthetic camera and mask worker exclude neural inference. Synthetic callback cadence/latency are reported solely for scheduling diagnostics; they are not neural tracking measurements. React commits are measured separately by a standalone actual ChaosControl Profiler test; mounted full-app React commits are not instrumented. RAF CPU excludes async tasks, GPU completion and compositor work. Frame intervals include browser scheduling and GPU contention. Sequential headless pairs are diagnostic, not causal or real-device acceptance; no human visual acceptance has occurred. No timing threshold is asserted.',
    results, comparisons,
  }, null, 2));
  console.log(JSON.stringify(comparisons));
});









// Deliberately isolated public scene workload: forces all visual flags together,
// without claiming that this configures an actual mounted game's CHAOS state.
test('bounded twelve-crystal storm overload surge scene workload', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createSlashScene } = await import('/src/effects/slashScene.js');
    const canvas=document.createElement('canvas');canvas.width=1366;canvas.height=768;
    let destroyed=0;
    const scene=createSlashScene(canvas.getContext('2d'),{chaos:true,arcade:true,random:()=>.2,onLifecycle:event=>{if(event.kind==='destroyed')destroyed++;}});
    scene.setSize(1366,768,{x:0,y:0,width:1366,height:768});
    scene.setChaosProfile({particles:320,fragments:48});scene.setCombo(10);scene.setStorm(true);scene.setOverload(true);scene.setSurge(true);
    const game={phase:'playing',paused:false,elapsed:100,cap:12,interval:.28};
    let peakObjects=0,peakParticles=0,peakFragments=0,peakFlashes=0,peakReservation=0;const cpu=[];
    for(let frame=0;frame<240;frame++){
      const begin=performance.now();game.elapsed+=.3;scene.update(0,game);
      const state=scene.inspect();peakObjects=Math.max(peakObjects,state.objects.length);peakReservation=Math.max(peakReservation,state.objects.length+state.reserved);
      if(frame%8===7)for(const object of state.objects)scene.cut({start:{x:object.x-90,y:object.y},end:{x:object.x+90,y:object.y},previousEdge:[{x:object.x-90,y:object.y-5},{x:object.x-90,y:object.y+5}],edge:[{x:object.x+90,y:object.y-5},{x:object.x+90,y:object.y+5}],strength:1,source:'pointer',robust:true});
      scene.draw();const effects=scene.inspect().effects;
      peakParticles=Math.max(peakParticles,effects.particles);peakFragments=Math.max(peakFragments,effects.fragments);peakFlashes=Math.max(peakFlashes,effects.flashes);cpu.push(performance.now()-begin);
      scene.update(1/60,{...game,elapsed:game.elapsed});
    }
    scene.reset();const clean=scene.inspect();cpu.sort((a,b)=>a-b);
    return {peakObjects,peakReservation,peakParticles,peakFragments,peakFlashes,destroyed,clean,cpuMedianMs:cpu[120],cpuP95Ms:cpu[228]};
  });
  expect(result.peakObjects).toBe(12);expect(result.peakReservation).toBeLessThanOrEqual(12);
  expect(result.peakParticles).toBeLessThanOrEqual(320);expect(result.peakFragments).toBeLessThanOrEqual(48);expect(result.peakFlashes).toBeLessThanOrEqual(12);expect(result.destroyed).toBeGreaterThan(0);
  expect(result.clean.objects).toHaveLength(0);expect(Object.values(result.clean.effects).every(value=>value===0)).toBe(true);
  fs.mkdirSync('.test-artifacts',{recursive:true});fs.writeFileSync('.test-artifacts/chaos-storm-performance.json',JSON.stringify({method:'Isolated actual Canvas SLASH scene with public storm, Overload and Surge flags; twelve-crystal cap; real swept cuts. Measures synchronous update/draw workload only, not mounted-mode scheduling or GPU completion.',...result},null,2));
});

test('CHAOS meter updates without idle React commits',async({page})=>{
 await page.goto('/');const result=await page.evaluate(async()=>{
  const React=await import('/node_modules/.vite/deps/react.js'),DOM=await import('/node_modules/.vite/deps/react-dom_client.js'),{ChaosControl}=await import('/src/beyond/ChaosControl.jsx'),{createEchoSession}=await import('/src/echoes/echoRuntime.js');
  const react=React.default||React,host=document.createElement('div');document.body.append(host);const root=(DOM.createRoot||DOM.default.createRoot)(host),session=createEchoSession(),durations=[];
  root.render(react.createElement(react.Profiler,{id:'chaos',onRender:(id,phase,duration)=>durations.push(duration)},react.createElement(ChaosControl,{session,mode:'FLOW'})));
  for(let frame=0;frame<120;frame++)await new Promise(requestAnimationFrame);
  const idleCommits=durations.length;session.beyond.chaos.setIntensity(session.beyond.chaos.preferenceIntensity()==='MAX'?'CALM':'MAX');
  for(let frame=0;frame<10;frame++)await new Promise(requestAnimationFrame);
  const totalCommits=durations.length;root.unmount();host.remove();return {idleCommits,totalCommits,durations};
 });expect(result.idleCommits).toBe(1);expect(result.totalCommits).toBe(2);fs.writeFileSync('.test-artifacts/chaos-react-performance.json',JSON.stringify(result,null,2));
});

function installRealSegmentationBenchmark(){
 const nativeNow=performance.now.bind(performance),nativeRAF=requestAnimationFrame.bind(window),NativeWorker=window.Worker;
 const results=[],buckets=new Map();
 window.requestAnimationFrame=callback=>nativeRAF(timestamp=>{const start=nativeNow();try{callback(timestamp);}finally{buckets.set(timestamp,(buckets.get(timestamp)||0)+nativeNow()-start);if(buckets.size>8192)buckets.delete(buckets.keys().next().value);}});
 window.Worker=class{constructor(url,options){const worker=new NativeWorker(url,options);if(String(url).includes('segmentation.worker'))worker.addEventListener('message',event=>{if(event.data.type==='mask'){results.push({at:nativeNow(),capture:event.data.timestamp,latency:nativeNow()-event.data.timestamp});if(results.length>100)results.shift();}});return worker;}};
 navigator.mediaDevices.getUserMedia=async()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');let id,tick=0;const paint=()=>{ctx.fillStyle='#304060';ctx.fillRect(0,0,640,480);ctx.fillStyle='#b09080';ctx.fillRect(200+Math.sin(tick++/10)*20,60,150,360);id=nativeRAF(paint);};paint();const stream=canvas.captureStream(30);stream.getTracks()[0].addEventListener('ended',()=>cancelAnimationFrame(id));return stream;};
 const summary=values=>{const sorted=[...values].sort((a,b)=>a-b);return {samples:sorted.length,medianMs:sorted[Math.floor(sorted.length/2)],p95Ms:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]};};
 window.__realSegmentationBench={count:()=>results.length,snapshot:()=>{const measured=results.slice(5,45),start=measured[0].capture,end=measured.at(-1).at,cpu=[...buckets].filter(([at])=>at>=start&&at<=end).map(([,value])=>value);return {returnedMasks:measured.length,latency:summary(measured.map(r=>r.latency)),returnedMaskCadence:summary(measured.slice(1).map((r,i)=>r.at-measured[i].at)),captureCadence:summary(measured.slice(1).map((r,i)=>r.capture-measured[i].capture)),mainThreadRAF:summary(cpu)};}};
}
test('actual GLOW segmentation worker cadence with CHAOS off WILD MAX',async({browser})=>{
 test.setTimeout(180000);const results=[];
 for(const intensity of ['OFF','WILD','MAX']){const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});const page=await context.newPage();try{
  await page.addInitScript(installRealSegmentationBenchmark);await page.addInitScript(value=>localStorage.setItem('lumen-chaos-intensity-v1',value),intensity==='OFF'?'WILD':intensity);
  await page.goto('/?debugChaos'+(intensity==='OFF'?'&chaosOff':''));await page.getByRole('button',{name:'ENABLE CAMERA',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.__realSegmentationBench.count()),{timeout:90000,intervals:[250]}).toBeGreaterThanOrEqual(45);
  const result=await page.evaluate(()=>window.__realSegmentationBench.snapshot());expect(result.returnedMasks).toBe(40);for(const metric of [result.latency,result.returnedMaskCadence,result.captureCadence,result.mainThreadRAF]){expect(metric.samples).toBeGreaterThan(0);expect(Number.isFinite(metric.p95Ms)).toBe(true);}
  results.push({intensity,...result});
 }finally{await context.close();}}
 const off=results[0],comparisons=results.slice(1).map(r=>({intensity:r.intensity,latencyP95DeltaMs:r.latency.p95Ms-off.latency.p95Ms,returnedCadenceMedianChangePercent:(r.returnedMaskCadence.medianMs/off.returnedMaskCadence.medianMs-1)*100,captureCadenceMedianChangePercent:(r.captureCadence.medianMs/off.captureCadence.medianMs-1)*100}));
 fs.mkdirSync('.test-artifacts',{recursive:true});fs.writeFileSync('.test-artifacts/chaos-real-segmentation-performance.json',JSON.stringify({method:'Actual mounted GLOW and untouched MediaPipe segmentation worker/model; native Worker message listener observes original capture timestamps. Synthetic painted canvas camera input only. Five model-result warmup frames, forty measured returned masks per preference in fresh contexts.',limitations:'Painted input is not a real person and need not produce foreground segmentation; this measures the real inference/capture pipeline while a separate synthetic-mask benchmark stresses decorative rendering. Main-thread RAF CPU excludes worker inference CPU, GPU completion and compositor work. Sequential headless samples do not establish real-webcam comfort or device acceptance; no timing threshold is asserted.',results,comparisons},null,2));console.log(JSON.stringify({results,comparisons}));
});
