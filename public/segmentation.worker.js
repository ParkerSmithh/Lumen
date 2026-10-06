importScripts(new URL('vision/vision_bundle.js', self.location.href).href);
const { FilesetResolver, ImageSegmenter } = Vision;
let task;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      const assetBase = data.assetBase || new URL('./', self.location.href).href;
      const files = await FilesetResolver.forVisionTasks(assetBase + 'vision');
      task = await ImageSegmenter.createFromOptions(files, {
        baseOptions: { modelAssetPath: assetBase + 'models/selfie_segmenter.tflite', delegate: 'CPU' },
        runningMode: 'VIDEO', outputConfidenceMasks: true, outputCategoryMask: false,
      });
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'frame' && task) {
      task.segmentForVideo(data.frame, data.timestamp, result => {
        const mask = result.confidenceMasks?.[0];
        if (!mask) throw new Error('No person mask returned');
        const values = mask.getAsFloat32Array().slice();
        self.postMessage({ type: 'mask', width: mask.width, height: mask.height, sourceWidth: data.frame.width, sourceHeight: data.frame.height, values, timestamp: data.timestamp }, [values.buffer]);
      });
    } else if (data.type === 'dispose') { task?.close(); task = null; self.close(); }
  } catch (error) { self.postMessage({ type: 'error', message: error.message }); }
  finally { data.frame?.close(); }
};

