import test from 'node:test';
import assert from 'node:assert/strict';
import { createLaunchArcade, targetBehavior, movingTargetPosition, relativeTargetHit, isBankBounce } from '../src/game/launchArcade.js';

test('wall banks include three seconds, award once, and targets score once', () => {
  const game = createLaunchArcade(); game.created(1); game.wallBounce(1, 10);
  assert.deepEqual(game.hit({ id: 1, type: 'normal', slot: 1 }, 13), { score: 200, count: 1, label: 'BANK +100' });
  assert.equal(game.hit({ id: 1, type: 'bonus', slot: 1 }, 13).score, 200);
  assert.equal(game.hit({ id: 2, type: 'bonus', slot: 1 }, 13).score, 400);
  game.wallBounce(1, 14);
  assert.equal(game.hit({ id: 3, type: 'normal', slot: 1 }, 17.001).score, 500);
});
test('grabs, recycled generations, resets, and invalid events cannot retain bank eligibility', () => {
  const game = createLaunchArcade(); const old = game.created(2); game.wallBounce(2, 0);
  game.grabbed(2);
  assert.equal(game.hit({ id: 1, type: 'normal', slot: 2 }, 1).score, 100);
  game.wallBounce(2, 2); const fresh = game.created(2);
  assert.notEqual(fresh, old); game.wallBounce(2, 3, old);
  assert.equal(game.hit({ id: 2, type: 'normal', slot: 2, generation: old }, 3).score, 100);
  assert.equal(game.hit({ id: 2, type: 'normal', slot: 2, generation: fresh }, 3).score, 200);
  game.wallBounce(2, NaN); game.wallBounce(-1, 4);
  assert.equal(game.hit({ id: 3, type: 'nope', slot: 2 }, 4).score, 200);
  assert.equal(game.hit({ id: 3, type: 'normal', slot: 9 }, 4).score, 200);
  game.reset(); assert.deepEqual(game.snapshot(), { score: 0, count: 0, label: null });
  assert.equal(game.hit({ id: 3, type: 'normal', slot: 2 }, 4).score, 0);
});
test('future or stale bounce times never qualify and new bounces refresh eligibility', () => {
  const game = createLaunchArcade(); game.created(0); game.wallBounce(0, 10);
  assert.equal(game.hit({ id: 1, type: 'normal', slot: 0 }, 9).score, 100);
  game.wallBounce(0, 11); game.wallBounce(0, 8);
  assert.equal(game.hit({ id: 2, type: 'normal', slot: 0 }, 14).score, 300);
});
test('bonus takes priority over moving and reduced motion keeps normal targets stationary', () => {
  assert.equal(targetBehavior(6, 19.99).type, 'normal');
  assert.deepEqual(targetBehavior(6, 20), { type: 'bonus', moving: false, duration: 8, radiusMultiplier: 1.35 });
  assert.equal(targetBehavior(3, 44.99).moving, false);
  assert.equal(targetBehavior(3, 45).moving, true);
  assert.equal(targetBehavior(6, 45).moving, false);
  assert.equal(targetBehavior(3, 45, true).moving, false);
  assert.equal(targetBehavior(4, 45).moving, false);
  assert.equal(targetBehavior(4, 45).duration, Infinity);
});
test('banks require finite inside-to-outside crossings with outward incident speed', () => {
  const event = { previous: 4, position: 4.6, velocity: .02, limit: 5, radius: .5 };
  assert.equal(isBankBounce(event), true);
  assert.equal(isBankBounce({ ...event, previous: -4, position: -4.6, velocity: -.01 }), true);
  assert.equal(isBankBounce({ ...event, velocity: .00999 }), false);
  assert.equal(isBankBounce({ ...event, velocity: -.02 }), false);
  assert.equal(isBankBounce({ ...event, previous: 4.51 }), false);
  assert.equal(isBankBounce({ ...event, previous: 4.5, position: 4.5 }), false);
  assert.equal(isBankBounce({ ...event, held: true }), false);
  assert.equal(isBankBounce({ ...event, position: NaN }), false);
  assert.equal(isBankBounce({ ...event, previous: Infinity }), false);
  assert.equal(isBankBounce({ ...event, limit: .4 }), false);
  assert.equal(isBankBounce({ ...event, previous: 4.5000005 }), true);
  assert.equal(isBankBounce({ ...event, previous: 4.500002 }), false);
});
test('motion is deterministic with an eight-second period, bounded amplitude and adjacent centers', () => {
  const t = { x: 1, y: 2, z: 3, moving: true, motionAmplitude: 10 };
  const p = movingTargetPosition(t, 2, 2);
  assert.deepEqual(p.previous, { x: 1, y: 2, z: 3 });
  assert.ok(Math.abs(p.current.x - 1.6) < 1e-12);
  assert.ok(Math.abs(movingTargetPosition(t, 10, 0).current.x - p.current.x) < 1e-12);
  assert.equal(movingTargetPosition({ ...t, maxX: 1.2 }, 2, 0).current.x, 1.2);
  assert.deepEqual(movingTargetPosition({ ...t, moving: false }, 2, 1).current, { x: 1, y: 2, z: 3 });
});
test('relative sweep catches moving targets crossing still balls and rejects parallel and depth misses', () => {
  const ball = { x: 0, y: 0, z: 0 };
  const start = { x: -2, y: 0, z: 0, radius: .2, halfDepth: .2 };
  const end = { ...start, x: 2 };
  assert.equal(relativeTargetHit(ball, ball, .1, start, end), true);
  assert.equal(relativeTargetHit({ x: -1, y: 0, z: 0 }, { x: 3, y: 0, z: 0 }, .1, start, end), false);
  assert.equal(relativeTargetHit({ ...ball, z: 2 }, { ...ball, z: 2 }, .1, start, end), false);
  assert.equal(relativeTargetHit({ ...ball, y: 1 }, { ...ball, y: 1 }, .1, start, end), false);
});
