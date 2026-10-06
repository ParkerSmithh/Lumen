import { useEffect, useRef, useState } from 'react';

export function useBodyTracking(videoRef, enabled) {
  const maskRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  useEffect(() => {
    maskRef.current = null; setError('');
    if (!enabled) { setStatus('idle'); return; }
    setStatus('loading');
    let stopped = false, failed = false, pending = false, ready = false, raf, last = 0, lastVideo = -1, lastPresence = false;
    const worker = new Worker(`${import.meta.env.BASE_URL}segmentation.worker.js`);
    const fail = () => {
      if (stopped || failed) return;
      failed = true; clearTimeout(timeout); cancelAnimationFrame(raf); worker.terminate();
      ready = false; pending = false; maskRef.current = null;
      setStatus('error'); setError('Body tracking could not load. Retry, or run npm run setup:assets if the model is missing.');
    };
    const timeout = setTimeout(fail, 30000);
    worker.onerror = fail;
    worker.onmessage = ({ data }) => {
      if (stopped || failed) return;
      if (data.type === 'ready') { clearTimeout(timeout); ready = true; setStatus('searching'); }
      else if (data.type === 'mask') {
        pending = false;
        let foreground = 0;
        for (let i = 0; i < data.values.length; i += 4) if (data.values[i] > .6) foreground++;
        const presence = foreground > data.values.length * .003;
        maskRef.current = presence ? data : null;
        if (presence !== lastPresence) { lastPresence = presence; setStatus(presence ? 'tracking' : 'searching'); }
      } else if (data.type === 'error') { clearTimeout(timeout); fail(); }
    };
    worker.postMessage({ type: 'init', assetBase: new URL(import.meta.env.BASE_URL, location.origin).href });
    const tick = async time => {
      if (stopped || failed) return;
      raf = requestAnimationFrame(tick);
      const video = videoRef.current;
      if (!ready || pending || document.hidden || !video || video.readyState < 2 || time - last < 66 || video.currentTime === lastVideo) return;
      pending = true; last = time; lastVideo = video.currentTime;
      try {
        const frame = await createImageBitmap(video);
        if (stopped || failed) { frame.close(); return; }
        worker.postMessage({ type: 'frame', frame, timestamp: time }, [frame]);
      } catch { if (!stopped) fail(); }
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; clearTimeout(timeout); cancelAnimationFrame(raf); maskRef.current = null; worker.terminate(); };
  }, [enabled, videoRef]);
  return { maskRef, status, error };
}
