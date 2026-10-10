import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

// CPU/model smoke measurements only: synthetic frames do not validate person masks,
// tracking-cost paths, landmark reliability, or two-hand identity stability.
test('real local CPU models report synthetic-frame costs without claiming quality acceptance', async ({ page }, testInfo) => {
  test.setTimeout(180000);
  await page.goto('/');
  const report = await page.evaluate(async () => {
    const vision = await import('/vision/vision_bundle.mjs').catch(() => null);
    if (!vision) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script'); script.src = '/vision/vision_bundle.js';
        script.onload = resolve; script.onerror = reject; document.head.append(script);
      });
    }
    const { FilesetResolver, ImageSegmenter, PoseLandmarker, HandLandmarker } = vision || window.Vision;
    const files = await FilesetResolver.forVisionTasks('/vision');
    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#161b23'; ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = '#273344'; ctx.fillRect(0, 150, 320, 90);
    let timestamp = 0;
    const measure = async (name, create, infer) => {
      const task = await create(); const times = [];
      try {
        for (let i = 0; i < 18; i++) {
          timestamp += 70; const start = performance.now(); infer(task, canvas, timestamp);
          if (i >= 3) times.push(performance.now() - start);
        }
      } finally { task.close(); }
      times.sort((a, b) => a - b);
      return { name, samples: times.length, medianMs: times[7], p95Ms: times[14] };
    };
    const base = model => ({ modelAssetPath: '/models/' + model, delegate: 'CPU' });
    const measurements = [];
    measurements.push(await measure('segmenter', () => ImageSegmenter.createFromOptions(files, {
      baseOptions: base('selfie_segmenter.tflite'), runningMode: 'VIDEO', outputConfidenceMasks: true, outputCategoryMask: false,
    }), (task, frame, time) => task.segmentForVideo(frame, time, () => {})));
    for (const masks of [false, true]) measurements.push(await measure(masks ? 'pose-plus-mask' : 'pose', () => PoseLandmarker.createFromOptions(files, {
      baseOptions: base('pose_landmarker_lite.task'), runningMode: 'VIDEO', numPoses: 1, outputSegmentationMasks: masks,
      minPoseDetectionConfidence: .5, minPosePresenceConfidence: .5, minTrackingConfidence: .5,
    }), (task, frame, time) => task.detectForVideo(frame, time, result => { result.segmentationMasks?.forEach(mask => mask.getAsFloat32Array()); })));
    for (const numHands of [1, 2]) measurements.push(await measure('hands-' + numHands, () => HandLandmarker.createFromOptions(files, {
      baseOptions: base('hand_landmarker.task'), runningMode: 'VIDEO', numHands,
      minHandDetectionConfidence: .5, minHandPresenceConfidence: .5, minTrackingConfidence: .5,
    }), (task, frame, time) => task.detectForVideo(frame, time)));
    return { input: 'synthetic empty room, 320x240', maskQualityAccepted: false, twoHandIdentityAccepted: false, measurements };
  });
  expect(report.measurements).toHaveLength(5);
  for (const measurement of report.measurements) {
    expect(measurement.p95Ms).toBeGreaterThan(0);
    expect(measurement.samples).toBe(15);
  }
  await testInfo.attach('bodyshift-cpu-model-smoke.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  console.log('BODYSHIFT_MODEL_SMOKE', JSON.stringify(report));
});

test('optional GLOW pose shares one camera and serializes inference without degrading primary cadence', async ({ page }, testInfo) => {
  test.setTimeout(180000);
  await page.addInitScript(() => {
    const state = window.bodyTrackingProbe = { cameraCalls: 0, inflight: 0, maxInflight: 0, masks: [], poses: 0, errors: [] };
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args); this.started = null;
        this.addEventListener('message', ({ data }) => {
          if (['mask', 'pose', 'error'].includes(data.type) && this.started !== null) {
            const now = performance.now();
            if (data.type === 'mask') state.masks.push({ now, latencyMs: now - this.started });
            if (data.type === 'pose') state.poses++;
            if (data.type === 'error') state.errors.push(data.message);
            state.inflight--; this.started = null;
          }
        });
      }
      postMessage(data, ...args) {
        if (data.type === 'frame') { this.started = performance.now(); state.inflight++; state.maxInflight = Math.max(state.maxInflight, state.inflight); }
        return super.postMessage(data, ...args);
      }
      terminate() { if (this.started !== null) { state.inflight--; this.started = null; } return super.terminate(); }
    };
    navigator.mediaDevices.getUserMedia = async () => {
      state.cameraCalls++;
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext('2d'); let raf; let frame = 0;
      const paint = () => {
        ctx.fillStyle = '#161b23'; ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#273344'; ctx.fillRect(0, 300, 640, 180);
        ctx.fillStyle = frame++ % 2 ? '#333' : '#343434'; ctx.fillRect(0, 0, 8, 8);
        raf = requestAnimationFrame(paint);
      };
      paint(); const stream = canvas.captureStream(30);
      stream.getVideoTracks()[0].addEventListener('ended', () => cancelAnimationFrame(raf)); return stream;
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'ENABLE CAMERA', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.bodyTrackingProbe.masks.length), { timeout: 60000 }).toBeGreaterThanOrEqual(45);
  const off = await page.evaluate(() => window.bodyTrackingProbe.masks.slice(-40));
  const before = await page.evaluate(() => window.bodyTrackingProbe.masks.length);
  await page.getByRole('checkbox', { name: 'FULL BODY' }).check();
  await expect.poll(() => page.evaluate(() => window.bodyTrackingProbe.masks.length), { timeout: 60000 }).toBeGreaterThanOrEqual(before + 45);
  const on = await page.evaluate(() => window.bodyTrackingProbe.masks.slice(-40));
  const probe = await page.evaluate(() => ({ cameraCalls: window.bodyTrackingProbe.cameraCalls, maxInflight: window.bodyTrackingProbe.maxInflight,
    poses: window.bodyTrackingProbe.poses, errors: window.bodyTrackingProbe.errors }));
  const summarize = samples => {
    const latency = samples.map(sample => sample.latencyMs).sort((a, b) => a - b);
    return { samples: samples.length, hz: (samples.length - 1) * 1000 / (samples.at(-1).now - samples[0].now), p95LatencyMs: latency[Math.ceil(latency.length * .95) - 1] };
  };
  const baseline = summarize(off), optional = summarize(on);
  const fallback = await page.getByLabel('BODYSHIFT controls').textContent();
  const report = { input: 'synthetic empty room 640x480 30fps, CPU native workers; no human quality acceptance', baseline, optional, ...probe,
    fallback: fallback.includes('COARSE MOVEMENT'), cadenceDegradation: (baseline.hz - optional.hz) / baseline.hz,
    latencyDegradation: (optional.p95LatencyMs - baseline.p95LatencyMs) / baseline.p95LatencyMs,
    personMaskQualityAccepted: false, trackedPoseCostAccepted: false };
  await testInfo.attach('bodyshift-pose-serialization.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  writeFileSync('docs/bodyshift-pose-serialization.json', JSON.stringify(report, null, 2));
  console.log('BODYSHIFT_POSE_SERIALIZATION', JSON.stringify(report));
  expect(probe.cameraCalls).toBe(1);
  expect(probe.maxInflight).toBeLessThanOrEqual(1);
  expect(probe.poses > 0 || report.fallback).toBe(true);
  expect(report.cadenceDegradation).toBeLessThanOrEqual(.1);
  // Result latency is reported separately; cadence is the primary non-regression gate.
  await page.getByRole('button', { name: 'Stop camera' }).click();
  await expect.poll(() => page.evaluate(() => window.bodyTrackingProbe.inflight)).toBe(0);
});

