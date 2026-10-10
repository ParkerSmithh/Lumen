import test from 'node:test';
import assert from 'node:assert/strict';
import * as tracking from '../src/tracking/bodyTrackingBudget.js';

test('optional pose requires measured headroom and never overlaps primary inference', () => {
  assert.equal(typeof tracking.createBodyTrackingBudget, 'function');
  const budget = tracking.createBodyTrackingBudget({ enabled: true, supported: true, reserveMs: 4 });
  assert.equal(budget.acquire('pose', 100, 130), false);
  assert.equal(budget.acquire('pose', 100, 130, 27), false);
  assert.equal(budget.acquire('pose', 100, 130, 20), true);
  assert.equal(budget.acquire('hand', 105), false);
  assert.equal(budget.release('hand', 110), false);
  assert.equal(budget.acquire('segmentation', 111), false);
  assert.equal(budget.release('pose', 120), true);
  assert.equal(budget.acquire('hand', 121), true);
  assert.equal(budget.acquire('pose', 122, 155, 10), false);
});

test('disabled or unsupported pose leaves primary inference available', () => {
  const disabled = tracking.createBodyTrackingBudget();
  assert.equal(disabled.acquire('pose', 0, 100, 10), false);
  assert.equal(disabled.acquire('segmentation', 0), true);
  const unsupported = tracking.createBodyTrackingBudget({ enabled: true, supported: false });
  assert.equal(unsupported.acquire('pose', 0, 100, 10), false);
  assert.equal(unsupported.acquire('hand', 0), true);
});

test('cadence regression beyond ten percent suspends supplemental inference', () => {
  const budget = tracking.createBodyTrackingBudget({ enabled: true, supported: true });
  budget.setCadence(30, 27);
  assert.equal(budget.acquire('pose', 0, 100, 10), true);
  budget.release('pose', 10);
  budget.setCadence(30, 26.9);
  assert.equal(budget.acquire('pose', 100, 200, 10), false);
  assert.equal(budget.acquire('hand', 101), true);
  assert.equal(budget.diagnostics.reason, 'primary-cadence');
});

test('diagnostics cannot mutate admission and release records measured duration', () => {
  const budget = tracking.createBodyTrackingBudget({ enabled: true, supported: true });
  const snapshot = budget.diagnostics;
  assert.ok(Object.isFrozen(snapshot));
  assert.equal(snapshot.combinedMaskReplacement, false);
  budget.acquire('pose', 10, 100, 20);
  budget.release('pose', 32);
  assert.equal(budget.diagnostics.lastPoseMs, 22);
  assert.equal(snapshot.lastPoseMs, null);
  assert.equal(budget.acquire('pose', NaN, 100, 10), false);
  assert.equal(budget.acquire('pose', 50, Infinity, 10), false);
});
