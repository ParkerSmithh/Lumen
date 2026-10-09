import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('compare bounded ECHOES overhead at SLASH caps and 150-ball LAUNCH load', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const { createSlashScene } = await import('/src/effects/slashScene.js');
    const { BallpitPhysics } = await import('/src/effects/Ballpit.jsx');
    const { createGrabController } = await import('/src/effects/grabController.js');
    const { createEchoSession } = await import('/src/echoes/echoRuntime.js');
    const { createForceEcho } = await import('/src/echoes/forceEcho.js');
    const summary = values => {
      const sorted = [...values].sort((a, b) => a - b);
      return { samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)] };
    };
    const seed = () => { let value = 15329; return () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296); };
    const originalRandom = Math.random;
    const canvas = document.createElement('canvas'); canvas.width = 1366; canvas.height = 768;
    const ctx = canvas.getContext('2d');
    const slashResults = [];
    try {
      // Same seed, geometry, input and drawing in both runs. The accelerated
      // spawn interval is an explicit worst-case stress fixture, not gameplay.
      for (const enabled of [false, true]) {
        Math.random = seed();
        const session = createEchoSession();
        const scene = createSlashScene(ctx, { arcade: true, random: () => .5, onLifecycle: event => {
          if (enabled && event.kind === 'destroyed') session.emit({ id: `cut:${event.id}`, mode: 'SLASH', kind: 'destruction', color: event.color, points: event.echoPoints, intensity: event.strength, duration: 2 });
        } });
        scene.setSize(1366, 768, { x: 0, y: 0, width: 1366, height: 768 }); scene.setCombo(10); scene.setOverload(true);
        const samples = []; let maxObjects = 0, maxParticles = 0, hits = 0;
        const slash = { start: { x: 0, y: 384 }, end: { x: 1366, y: 384 }, previousEdge: [{ x: 0, y: 0 }, { x: 0, y: 768 }], edge: [{ x: 1366, y: 0 }, { x: 1366, y: 768 }], strength: 1, source: 'camera-motion' };
        for (let frame = 0; frame < 660; frame++) {
          const start = performance.now();
          scene.update(1 / 60, { phase: 'playing', paused: false, elapsed: 100 + frame / 60, interval: .001, cap: 8 });
          // Eight existing crystals are destroyed every twelve frames, exercising
          // the original 192-particle pool plus actual destruction geometry.
          const before = scene.inspect(); maxObjects = Math.max(maxObjects, before.objects.length);
          if (frame % 12 === 11) hits += scene.cut(slash);
          scene.draw();
          if (enabled) session.draw(ctx, 1366, 768, performance.now(), 'SLASH', false);
          if (frame >= 60) samples.push(performance.now() - start);
          maxParticles = Math.max(maxParticles, scene.inspect().effects.particles);
        }
        slashResults.push({ enabled, cpu: summary(samples), maxObjects, maxParticles, hits, records: session.store.snapshot().length });
        scene.dispose(); session.store.clear();
      }
      const launchResults = [];
      for (const scenario of ['airborne', 'crowded', 'resting']) {
        for (const enabled of [false, true]) {
          Math.random = seed();
          const physics = new BallpitPhysics({ count: 151, activeCount: 151, followCursor: false, controlSphere0: false, minSize: .25, maxSize: .55, size0: .85, gravity: .01, friction: .9975, wallBounce: .95, maxVelocity: .15, maxX: 12, maxY: 7, maxZ: 3 });
          physics.grabController = createGrabController();
          const session = createEchoSession(), force = createForceEcho(session);
          for (let i = 1; i <= 150; i++) {
            const j = i * 3;
            if (scenario === 'crowded') physics.positionData.set([((i % 10) - 5) * .35, Math.floor(i / 10) * .35 - 3, 0], j);
            if (scenario === 'resting') physics.positionData.set([((i % 15) - 7) * 1.1, -6 + Math.floor(i / 15) * .5, (i % 3 - 1) * .6], j);
            physics.velocityData.set(scenario === 'resting' ? [0, 0, 0] : [.1, .02, -.01], j);
            if (enabled) force.created(i, '#b06aff');
          }
          const samples = []; let maxSpeed = 0;
          for (let frame = 0; frame < 660; frame++) {
            const start = performance.now();
            physics.update({ delta: 1 / 60 }); physics.grabController.step(physics, 1 / 60);
            if (enabled) {
              for (let i = 1; i <= 150; i++) {
                const j = i * 3;
                force.sample(i, { x: (physics.positionData[j] + 12) / 24, y: (7 - physics.positionData[j + 1]) / 14 }, frame / 60);
              }
              if (frame % 180 === 0) force.release([1, 2, 3, 4, 5, 6], true, .15);
              // These deterministic hit notifications exercise accepted-event
              // capture cost only; they do not claim a target collision occurred.
              if (frame % 30 === 29) force.hit(7, `fixture:${frame}`, '#b06aff');
              ctx.clearRect(0, 0, 1366, 768);
              session.draw(ctx, 1366, 768, performance.now(), 'LAUNCH', false);
            }
            if (frame >= 60) samples.push(performance.now() - start);
            for (let i = 1; i <= 150; i++) maxSpeed = Math.max(maxSpeed, Math.hypot(...physics.velocityData.subarray(i * 3, i * 3 + 3)));
          }
          launchResults.push({ scenario, enabled, cpu: summary(samples), finite: [...physics.positionData, ...physics.velocityData].every(Number.isFinite), maxSpeed, positions: Array.from(physics.positionData), records: session.store.snapshot().length });
          force.reset(); session.store.clear();
        }
      }
      return { slash: slashResults, launch: launchResults };
    } finally { Math.random = originalRandom; canvas.width = canvas.height = 0; }
  });
  fs.mkdirSync('.test-artifacts', { recursive: true });
  const report = { environment: 'Browser CPU benchmark: deterministic original SLASH canvas renderer and Ballpit solver; 60 warmup + 600 measured frames; no webcam or LAUNCH GPU render. LAUNCH includes 150 rolling buffers, six throw paths and explicit hit-event fixtures.', ...results, launch: results.launch.map(({ positions, ...rest }) => rest) };
  fs.writeFileSync('.test-artifacts/echo-performance.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  for (const result of results.slash) {
    expect(result.maxObjects).toBe(8); expect(result.maxParticles).toBe(192); expect(result.hits).toBeGreaterThan(100); expect(result.records).toBeLessThanOrEqual(64);
  }
  expect(results.slash[0].hits).toBe(results.slash[1].hits);
  for (let i = 0; i < results.launch.length; i += 2) {
    expect(results.launch[i + 1].positions).toEqual(results.launch[i].positions);
    expect(results.launch[i + 1].records).toBeGreaterThan(0);
  }
  for (const result of results.launch) { expect(result.finite).toBe(true); expect(result.maxSpeed).toBeLessThanOrEqual(.150001); expect(result.cpu.p95Ms).toBeLessThan(16.7); }
});
