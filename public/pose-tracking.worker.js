importScripts(new URL('vision/vision_bundle.js', self.location.href).href);
let task;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      const base = data.assetBase || new URL('./', self.location.href).href;
      const files = await Vision.FilesetResolver.forVisionTasks(base + 'vision');
      task = await Vision.PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: base + 'models/pose_landmarker_lite.task', delegate: 'CPU' },
        runningMode: 'VIDEO', numPoses: 1, outputSegmentationMasks: false,
        minPoseDetectionConfidence: .5, minPosePresenceConfidence: .5, minTrackingConfidence: .5,
      });
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'frame' && task) {
      const start = performance.now();
      const result = task.detectForVideo(data.frame, data.timestamp);
      self.postMessage({ type: 'pose', landmarks: result.landmarks[0] || null,
        timestamp: data.timestamp, inferenceMs: performance.now() - start,
        sourceWidth: data.frame.width, sourceHeight: data.frame.height });
    } else if (data.type === 'dispose') { task?.close(); task = null; self.close(); }
  } catch (error) { self.postMessage({ type: 'error', message: error.message }); }
  finally { data.frame?.close(); }
};
