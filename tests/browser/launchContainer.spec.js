import { test, expect } from '@playwright/test';

test('gravity-enabled Ballpit bounces at all six walls and retains collisions after cluster throws and rapid spawning', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createBallpit } = await import('/src/effects/Ballpit.jsx');
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;width:640px;height:480px';
    document.body.append(host);
    const canvas = document.createElement('canvas'); host.append(canvas);
    const pit = createBallpit(canvas, { count: 7, maxActive: 6, interactiveCreation: true, followCursor: false, gravity: .01, friction: 1, wallBounce: .95, maxVelocity: .15, minSize: .1, maxSize: .1, colors: [0xffffff, 0xffffff] });
    pit.three.onBeforeRender = () => {};
    const p = pit.spheres.physics, config = p.config, step = () => p.update({ delta: 1 / 60 });
    try {
      pit.spawn({ x: 0, y: 0, z: 0 }, '#4d9fff');
      const walls = [];
      for (const [axis, name] of ['X', 'Y', 'Z'].entries()) for (const sign of [-1, 1]) {
        p.positionData.fill(0); p.velocityData.fill(0);
        p.positionData[3 + axis] = sign * (config['max' + name] - .05);
        p.velocityData[3 + axis] = sign * .08;
        step();
        walls.push({ name, sign, velocity: p.velocityData[3 + axis], position: p.positionData[3 + axis], limit: config['max' + name] - p.sizeData[1] });
      }
      pit.spawn({ x: 0, y: 0, z: 0 }, '#ff354e');
      p.positionData.set([0, 0, 0, -.08, 0, 0, .08, 0, 0]); p.velocityData.fill(0);
      p.velocityData[3] = .04; p.velocityData[6] = -.04; step();
      const collision = p.velocityData[3] < 0 && p.velocityData[6] > 0;
      p.positionData.set([0, 0, 0, -.2, 0, 0, .2, 0, 0]); p.velocityData.fill(0);
      const g = p.grabController;
      const captured = g.begin({ x: 0, y: 0, z: 0 }, p, 0);
      for (let i = 1; i <= 4; i++) { g.move({ x: i * .1, y: i * .05, z: 0 }, i * 25); g.step(p, 1 / 60); }
      const heldOffset = p.positionData[6] - p.positionData[3];
      g.release(p, true);
      const throwSpeeds = [1, 2].map(i => Math.hypot(...p.velocityData.slice(i * 3, i * 3 + 3)));
      const before = p.positionData[3]; step(); const throwMoves = p.positionData[3] > before;
      for (let i = 0; i < 3; i++) pit.spawn({ x: -1 + i, y: 1, z: 0 }, '#ffd84a', 1);
      const rapidSpeeds = [3, 4, 5].map(i => Math.hypot(...p.velocityData.slice(i * 3, i * 3 + 3)));
      const rapidBefore = p.positionData[11]; step(); const rapidMoves = p.positionData[11] !== rapidBefore;
      // Throw toward a wall, then overlap the thrown ball with another: same solver remains active.
      config.activeCount = 3;
      p.positionData.set([0, 0, 0, config.maxX - .11, 0, 0, -1, 0, 0]); p.velocityData.fill(0); p.velocityData[3] = .1; step();
      const thrownBounce = p.velocityData[3] < 0;
      p.positionData.set([0, 0, 0, -.08, 0, 0, .08, 0, 0]); p.velocityData.fill(0); p.velocityData[3] = .04; p.velocityData[6] = -.04; step();
      const thrownCollision = p.velocityData[3] < 0 && p.velocityData[6] > 0;
      return { walls, collision, captured, heldOffset, throwSpeeds, throwMoves, rapidSpeeds, rapidMoves, thrownBounce, thrownCollision };
    } finally { pit.dispose(); host.remove(); }
  });
  for (const wall of result.walls) {
    expect(wall.velocity * wall.sign, `${wall.name} ${wall.sign} reflection`).toBeLessThan(0);
    expect(Math.abs(wall.position)).toBeLessThanOrEqual(wall.limit + 1e-6);
  }
  expect(result.collision).toBe(true); expect(result.captured).toBe(2);
  expect(result.heldOffset).toBeCloseTo(.4, 5);
  for (const speed of result.throwSpeeds) { expect(speed).toBeGreaterThan(.08); expect(speed).toBeLessThanOrEqual(.150001); }
  expect(result.throwMoves).toBe(true);
  for (const speed of result.rapidSpeeds) expect(speed).toBeGreaterThan(.1);
  expect(result.rapidMoves).toBe(true); expect(result.thrownBounce).toBe(true); expect(result.thrownCollision).toBe(true);
});
