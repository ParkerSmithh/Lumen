import test from 'node:test';
import assert from 'node:assert/strict';
import * as utils from '../src/tracking/utils.js';

test('camera image fits without cropping or stretching, including portrait screens', () => {
  assert.equal(typeof utils.fitContain, 'function');
  const fit = utils.fitContain(640, 480, 1000, 500);
  assert.equal(fit.width / fit.height, 640 / 480);
  assert.equal(fit.height, 500);
  assert.ok(fit.x > 0);
  const portrait = utils.fitContain(640, 480, 360, 600);
  assert.equal(portrait.width, 360);
  assert.equal(portrait.height, 270);
  assert.equal(portrait.y, 165);
});

test('confidence mask makes the body opaque and leaves the room transparent', () => {
  assert.equal(typeof utils.toMaskRGBA, 'function');
  const rgba = utils.toMaskRGBA(new Float32Array([0, 0.2, 0.5, 0.8, 1]));
  assert.equal(rgba.length, 20);
  assert.equal(rgba[3], 0);
  assert.equal(rgba[19], 255);
  assert.ok(rgba[11] > 0 && rgba[11] < 255);
  assert.equal(rgba[7], 0);
  assert.equal(rgba[15], 255);
});

test('mirroring maps the entire mask including feet inside the image bounds', () => {
  assert.equal(typeof utils.mapPoint, 'function');
  const rect = { x: 20, y: 10, width: 400, height: 300 };
  assert.deepEqual(utils.mapPoint(0, 0, rect, true), { x: 420, y: 10 });
  assert.deepEqual(utils.mapPoint(1, 1, rect, true), { x: 20, y: 310 });
});

test('camera failures produce understandable retry guidance', () => {
  assert.equal(typeof utils.cameraErrorMessage, 'function');
  assert.match(utils.cameraErrorMessage({ name: 'NotAllowedError' }), /permission/i);
  assert.match(utils.cameraErrorMessage({ name: 'NotFoundError' }), /no camera/i);
  assert.match(utils.cameraErrorMessage({ name: 'NotReadableError' }), /another app/i);
  assert.match(utils.cameraErrorMessage({ name: 'SecurityError' }), /localhost|https/i);
});