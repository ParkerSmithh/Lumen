import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { browserOptions } from '../../scripts/browser-options.mjs';

// This fixture exercises mounted modes. Only camera input/inference is synthetic.
function installBenchmark() {
  const nativeNow = performance.now.bind(performance);
  const nativeRAF = requestAnimationFrame.bind(window);
  let offset = 0, seed = 90210;
  // Keep SLASH's measured population at eight: exclude capacity-reserving splitters.
  Math.random = () => .2 + .8 * ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  Object.defineProperty(performance, 'now', { value: () => nativeNow() + offset });
  const buckets = new Map();
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
        cpuCallbacksPerFrame: summary(cpu), cpuPerCallback: summary(callback), nativeFrameInterval: summary(intervals),
        maximumObjects, maximumParticles, recognizedCuts: (window.__lumenSlash?.input().recognizedSegments || 0) - cutsBefore,
        slashState: window.__lumenSlash?.state(), activeBalls: window.__lumenKinetic?.instance?.spheres.activeCount,
        finitePhysics: physics ? [...physics.positionData, ...physics.velocityData].every(Number.isFinite) : undefined,
        beyondEnabled: window.__lumenBeyond?.enabled?.(), beyond: window.__lumenBeyond?.snapshot?.(), counts: window.__lumenBeyond?.counts?.(),
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
      setTimeout(() => !this.closed && this.onmessage?.({ data: { type: 'mask', values, width, height, sourceWidth: 640, sourceHeight: 480, timestamp: message.timestamp } }), 0);
    }
    terminate() { this.closed = true; }
  };
}

test('compare actual mode frame cost with BEYOND enabled and disabled', async ({ browser }) => {
  test.setTimeout(Number(process.env.LUMEN_TEST_TIMEOUT || 120000));
  const results = [];
  for (const mode of ['GLOW', 'FLOW', 'SLASH', 'LAUNCH']) {
    for (const enabled of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      try {
        await page.addInitScript(installBenchmark);
        await page.goto('/?debugBeyond&debugSlash&debugKinetic&debugTrace' + (enabled ? '' : '&beyondOff'));
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
            await expect.poll(() => page.evaluate(() => window.__lumenSlash?.inspect().objects.length), { timeout: 10000 }).toBe(8);
          }
          if (mode === 'LAUNCH') {
            await expect.poll(() => page.evaluate(() => !!window.__lumenKinetic?.instance)).toBe(true);
            await page.evaluate(async () => {
              // Allow the mounted game's session reset before populating its actual solver.
              await window.__beyondBench.next(); await window.__beyondBench.next();
              const instance = window.__lumenKinetic.instance, config = instance.spheres.config;
              for (let i = 0; i < 150; i++) instance.spawn({ x: ((i % 15) / 14 - .5) * config.maxX * 1.5, y: (Math.floor(i / 15) / 9 - .5) * config.maxY * 1.3, z: ((i % 3) - 1) * .8 }, '#ff9ffc', .65);
            });
          }
        }
        // Respect the real PULSE idle gates after creation, tracing, or gestures.
        await page.waitForTimeout(1600);
        const result = await page.evaluate(mode => window.__beyondBench.measure(mode), mode);
        results.push({ mode, enabled, ...result });
        expect(result.beyondEnabled).toBe(enabled);
        expect(result.beyond.count).toBeGreaterThanOrEqual(0); expect(result.beyond.count).toBeLessThanOrEqual(4);
        const caps = { atmosphere: 16, resonance: 2, pulse: 1, presence: 1, accepted: 512 };
        for (const [key, cap] of Object.entries(caps)) { expect(Number.isFinite(result.counts[key])).toBe(true); expect(result.counts[key]).toBeGreaterThanOrEqual(0); expect(result.counts[key]).toBeLessThanOrEqual(cap); }
        if (!enabled) expect(Object.values(result.counts).every(value => value === 0)).toBe(true);
        if (enabled) expect(result.counts.pulse).toBe(1);
        for (const metric of [result.cpuCallbacksPerFrame, result.cpuPerCallback, result.nativeFrameInterval]) {
          expect(metric.samples).toBeGreaterThan(0); expect(Number.isFinite(metric.medianMs)).toBe(true); expect(Number.isFinite(metric.p95Ms)).toBe(true);
        }
        expect(result.cpuCallbacksPerFrame.samples).toBe(180);
        if (mode === 'SLASH') { expect(result.maximumObjects).toBe(8); expect(result.maximumParticles).toBeLessThanOrEqual(192); expect(result.slashState.overload).toBe(true); expect(result.recognizedCuts).toBeGreaterThan(0); }
        if (mode === 'LAUNCH') { expect(result.activeBalls).toBe(150); expect(result.finitePhysics).toBe(true); }
      } finally { await context.close(); }
    }
  }
  const comparisons = ['GLOW', 'FLOW', 'SLASH', 'LAUNCH'].map(mode => {
    const off = results.find(r => r.mode === mode && !r.enabled), on = results.find(r => r.mode === mode && r.enabled);
    return { mode, medianCpuDeltaMs: on.cpuCallbacksPerFrame.medianMs - off.cpuCallbacksPerFrame.medianMs, p95CpuDeltaMs: on.cpuCallbacksPerFrame.p95Ms - off.cpuCallbacksPerFrame.p95Ms, medianFrameDeltaMs: on.nativeFrameInterval.medianMs - off.nativeFrameInterval.medianMs, p95FrameDeltaMs: on.nativeFrameInterval.p95Ms - off.nativeFrameInterval.p95Ms };
  });
  fs.mkdirSync('.test-artifacts', { recursive: true });
  fs.writeFileSync('.test-artifacts/beyond-performance.json', JSON.stringify({
    environment: { browser: browserOptions.executablePath || browserOptions.channel, headless: true, viewport: '1366x768', deviceScaleFactor: 1, warmupFrames: 60, measuredFrames: 180 },
    method: 'Mounted GLOW renderer and segmentation hook with synthetic camera/masks; mounted FLOW fluid with pointer trails; mounted SLASH Overload with eight objects, real cuts and GridScan; mounted LAUNCH renderer/solver with 150 balls. Seeded input and geometry paired by mode; identical KeyP input before warmup after a 1.6-second idle gate invokes the real PULSE control when BEYOND is enabled. Native clock measures aggregate synchronous RAF callback CPU and native frame intervals; coherent offset only advances game setup.',
    limitations: 'Synthetic camera and mask worker exclude neural inference. RAF CPU excludes async tasks, GPU completion and compositor work. Frame intervals include browser scheduling and GPU contention. Sequential headless pairs are diagnostic, not causal or real-device acceptance; no human visual acceptance has occurred. No timing threshold is asserted.',
    results, comparisons,
  }, null, 2));
  console.log(JSON.stringify(comparisons));
});








