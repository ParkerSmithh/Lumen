import test from 'node:test';
import assert from 'node:assert/strict';
import { slashProgression } from '../src/effects/slashProgression.js';

test('spawn pacing eases from two seconds to a bounded late cadence', () => {
  assert.equal(slashProgression(0).interval, 2);
  assert.equal(slashProgression(17.5).interval, 1.2);
  assert.equal(slashProgression(35).interval, .4);
  assert.equal(slashProgression(300).interval, .4);
  let previous = 2;
  for (let time = 0; time <= 60; time += .1) {
    const { interval, cap } = slashProgression(time);
    assert.ok(interval <= previous + 1e-10 && interval >= .4);
    assert.ok(cap >= 1 && cap <= 8);
    previous = interval;
  }
});

test('opening stays sparse while the later scene permits eight objects', () => {
  assert.equal(slashProgression(1).cap, 1);
  assert.equal(slashProgression(5).cap, 2);
  assert.equal(slashProgression(10).cap, 3);
  assert.equal(slashProgression(45).cap, 8);
});
