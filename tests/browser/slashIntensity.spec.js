import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('peak SLASH keeps eight targets responsive and cuts them with the existing curved swept path', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createSlashScene } = await import('/src/effects/slashScene.js');
    const { createSlashGame } = await import('/src/game/slashGame.js');
    const game = createSlashGame(); game.start(0);
    const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 560; document.body.append(canvas);
    const ctx = canvas.getContext('2d'), positions = [], samples = [];
    const translate = ctx.translate.bind(ctx); ctx.translate = (x, y) => { positions.push({ x, y }); translate(x, y); };
    const scene = createSlashScene(ctx); scene.setSize(1000, 560, { x: 0, y: 0, width: 1000, height: 560 });
    let maximum = 0; const populations = [];
    try {
      for (let frame = 1; frame <= 6000; frame++) {
        scene.update(1 / 60,game.tick(3000+frame/60*1000)); positions.length = 0; scene.draw(); maximum = Math.max(maximum, positions.length);
        if (frame % 600 === 0) populations.push({ seconds: frame / 60, count: positions.length });
      }
      await new Promise(resolve => {
        const tick = () => { const start = performance.now(); scene.update(1 / 60,game.tick(103000+samples.length/60*1000)); positions.length = 0; scene.draw(); samples.push(performance.now() - start); if (samples.length < 120) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick);
      });
      const active = positions.length;
      // A bent path through all current targets exercises the real scene's multi-target cut.
      const path = positions.map(center => ({ center, edge: [{ x: center.x, y: center.y - 20 }, { x: center.x, y: center.y + 20 }] }));
      const hits = scene.cut({ start: path[0].center, end: path.at(-1).center, previousEdge: path[0].edge, edge: path.at(-1).edge, path, strength: .6, source: 'camera-motion' });
      const sorted = samples.sort((a, b) => a - b);
      return { maximum, populations, active, hits, cpuMs: { median: sorted[60], p95: sorted[114] } };
    } finally { scene.dispose(); canvas.remove(); }
  });
  fs.writeFileSync('.test-artifacts/slash-intensity.json', JSON.stringify({ environment: 'headless Chromium, 1000x560, no live tracking; CPU update/draw excludes deferred GPU work', ...result }, null, 2));
  expect(result.maximum).toBe(8); expect(result.populations.find(p => p.seconds === 90).count).toBeGreaterThanOrEqual(7);
  expect(result.active).toBe(8); expect(result.hits).toBe(result.active);
  expect(result.cpuMs.p95).toBeLessThan(16.7);
});
