import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function workerHarness(infer) {
  const posted = []; let options; let closed = 0; let stopped = 0;
  const task = { detectForVideo: infer, close() { closed++; } };
  const context = vm.createContext({
    URL, performance: { now: () => 20 }, importScripts() {},
    Vision: { FilesetResolver: { forVisionTasks: async () => ({}) }, PoseLandmarker: {
      createFromOptions: async (_, value) => { options = value; return task; },
    } },
    self: { location: { href: 'http://localhost/app/pose-tracking.worker.js' },
      postMessage: value => posted.push(value), close: () => { stopped++; } },
  });
  vm.runInContext(await readFile(new URL('../public/pose-tracking.worker.js', import.meta.url), 'utf8'), context);
  return { send: data => context.self.onmessage({ data }), posted, get options() { return options; }, get closed() { return closed; }, get stopped() { return stopped; } };
}

test('pose worker uses CPU and local lite model without replacing segmentation', async () => {
  const worker = await workerHarness(() => ({ landmarks: [] }));
  await worker.send({ type: 'init', assetBase: 'http://localhost/app/' });
  assert.equal(worker.options.baseOptions.modelAssetPath, 'http://localhost/app/models/pose_landmarker_lite.task');
  assert.equal(worker.options.baseOptions.delegate, 'CPU');
  assert.equal(worker.options.outputSegmentationMasks, false);
  assert.equal(worker.options.minPoseDetectionConfidence, .5);
  assert.equal(worker.posted[0].type, 'ready');
  let framesClosed = 0;
  await worker.send({ type: 'frame', timestamp: 100, frame: { width: 320, height: 240, close() { framesClosed++; } } });
  assert.equal(worker.posted[1].type, 'pose');
  assert.equal(worker.posted[1].landmarks, null);
  assert.equal(worker.posted[1].timestamp, 100);
  assert.equal(framesClosed, 1);
  await worker.send({ type: 'dispose' });
  assert.equal(worker.closed, 1);
  assert.equal(worker.stopped, 1);
});

test('pose worker releases frame when inference fails', async () => {
  const worker = await workerHarness(() => { throw new Error('Inference unavailable'); });
  await worker.send({ type: 'init' });
  let framesClosed = 0;
  await worker.send({ type: 'frame', timestamp: 100, frame: { close() { framesClosed++; } } });
  assert.equal(worker.posted[1].type, 'error');
  assert.equal(framesClosed, 1);
});
