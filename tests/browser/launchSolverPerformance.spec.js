import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('original Ballpit solver stays within frame budget at 150 balls without a GPU', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const { BallpitPhysics } = await import('/src/effects/Ballpit.jsx');
    const { createGrabController } = await import('/src/effects/grabController.js');
    const results = [];
    for (const count of [50, 100, 150, 200]) {
      const physics = new BallpitPhysics({ count: 201, activeCount: count + 1, followCursor: false, controlSphere0: false, minSize: .25, maxSize: .55, size0: .85, gravity: .01, friction: .9975, wallBounce: .95, maxVelocity: .15, maxX: 12, maxY: 7, maxZ: 3 });
      physics.grabController = createGrabController();
      for (let i = 1; i <= count; i++) physics.velocityData[i * 3] = .1;
      const samples = [];
      for (let frame = 0; frame < 630; frame++) {
        const start = performance.now();
        physics.update({ delta: 1 / 60 }); physics.grabController.step(physics, 1 / 60);
        if (frame >= 30) samples.push(performance.now() - start);
      }
      samples.sort((a, b) => a - b);
      results.push({ active: count, samples: samples.length, cpuMs: { median: samples[300], p95: samples[570] }, finite: [...physics.positionData, ...physics.velocityData].every(Number.isFinite), maxSpeed: Math.max(...Array.from({ length: count }, (_, i) => Math.hypot(...physics.velocityData.slice((i + 1) * 3, (i + 2) * 3)))) });
    }
    return results;
  });
  fs.writeFileSync('.test-artifacts/throwing-solver-performance.json', JSON.stringify({ environment: 'Chromium, original Ballpit solver at 60 Hz; CPU only, no rendering or real tracking; 30 warmup and 600 measured updates per population', results }, null, 2));
  for (const result of results) { expect(result.finite).toBe(true); expect(result.maxSpeed).toBeLessThanOrEqual(.150001); }
  expect(results.find(result => result.active === 150).cpuMs.p95).toBeLessThan(16.7);
});
