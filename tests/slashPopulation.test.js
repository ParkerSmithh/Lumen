import test from 'node:test';
import assert from 'node:assert/strict';
import { createSlashScene } from '../src/effects/slashScene.js';

// Canvas is unavailable in Node; record the crystal halo draw, not private scene state.
function fixture() {
  let crystals = 0;
  const gradient = { addColorStop() {} };
  const context = new Proxy({
    createRadialGradient() { crystals++; return gradient; },
    createLinearGradient() { return gradient; },
  }, { get: (target, key) => target[key] || (() => {}) });
  const scene = createSlashScene(context);
  scene.setSize(1000, 560, { x: 0, y: 0, width: 1000, height: 560 });
  return { scene, count() { crystals = 0; scene.draw(); return crystals; } };
}

test('scene opens at one second and grows to six through eight visible targets', () => {
  const { scene, count } = fixture();
  for (let i = 0; i < 59; i++) scene.update(1 / 60);
  assert.equal(count(), 0);
  scene.update(1 / 60);
  assert.equal(count(), 1);
  for (let i = 60; i < 420; i++) { scene.update(1 / 60); assert.ok(count() <= 2); }
  let lateMaximum = 0;
  for (let i = 420; i < 4200; i++) {
    scene.update(1 / 60); const active = count(); assert.ok(active <= 8);
    if (i > 2700) lateMaximum = Math.max(lateMaximum, active);
  }
  assert.ok(lateMaximum >= 6, `late maximum ${lateMaximum}`);
  scene.dispose(); assert.equal(count(), 0);
  const fresh = fixture(); fresh.scene.update(.04); assert.equal(fresh.count(), 0);
});

test('continuous cuts cannot bypass the minimum spawn interval or queue a burst at capacity', () => {
  let count = 0;
  const gradient = { addColorStop() {} };
  const context = new Proxy({
    createRadialGradient(x, y) { if (x === 0 && y === 0) count++; return gradient; },
    createLinearGradient() { return gradient; },
  }, { get: (target, key) => target[key] || (() => {}) });
  const scene = createSlashScene(context);
  scene.setSize(1000, 560, { x: 0, y: 0, width: 1000, height: 560 });
  const slash = { start: { x: 0, y: 280 }, end: { x: 1000, y: 280 }, previousEdge: [{ x: 0, y: 0 }, { x: 0, y: 560 }], edge: [{ x: 1000, y: 0 }, { x: 1000, y: 560 }], strength: .5 };
  const births = [];
  for (let frame = 1; frame <= 3600; frame++) {
    scene.update(1 / 60); count = 0; scene.draw();
    if (count) { assert.equal(count, 1); births.push(frame / 60); assert.equal(scene.cut(slash), 1); }
  }
  assert.ok(births.length > 60);
  for (let i = 1; i < births.length; i++) assert.ok(births[i] - births[i - 1] >= .4 - 1e-8);
  scene.dispose();
});

test('slow rendering does not delay the wall-clock intensity ramp', () => {
  const { scene, count } = fixture();
  for (let frame = 0; frame < 9; frame++) scene.update(.1);
  assert.equal(count(), 0);
  for (let frame = 9; frame < 400; frame++) scene.update(.1);
  assert.equal(count(), 8);
  scene.dispose();
});
