import test from 'node:test';
import assert from 'node:assert/strict';
import { slashProgression } from '../src/effects/slashProgression.js';

test('spawn pacing eases from two seconds to a bounded late cadence', () => {
  assert.equal(slashProgression(0).interval, 1.8);
  assert.equal(slashProgression(30).interval, 1.2);
  assert.equal(slashProgression(120).interval, .35);
  assert.equal(slashProgression(300).interval, .35);
  let previous = 1.8;
  for (let time = 0; time <= 120; time += .1) {
    const { interval, cap } = slashProgression(time);
    assert.ok(interval <= previous + 1e-10 && interval >= .35);
    assert.ok(cap >= 3 && cap <= 8);
    previous = interval;
  }
});

test('opening stays sparse while the later scene permits eight objects', () => {
  assert.equal(slashProgression(0).cap, 3);
  assert.equal(slashProgression(30).cap, 5);
  assert.equal(slashProgression(60).cap, 7);
  assert.equal(slashProgression(90).cap, 8);
});
