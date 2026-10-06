import { useCallback, useEffect, useRef, useState } from 'react';
import { cameraErrorMessage } from '../tracking/utils';

export function useWebcam() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const generation = useRef(0);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const release = useCallback(() => {
    generation.current++;
    streamRef.current?.getTracks().forEach(track => { track.onended = null; track.stop(); });
    streamRef.current = null;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
  }, []);
  const stop = useCallback(() => { release(); setStatus('idle'); setError(''); }, [release]);
  const start = useCallback(async () => {
    release();
    const token = generation.current;
    setStatus('loading'); setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw { name: 'SecurityError' };
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user', frameRate: { ideal: 30 } }, audio: false });
      if (token !== generation.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      stream.getVideoTracks().forEach(track => { track.onended = () => { release(); setError('Camera disconnected. Reconnect it and try again.'); setStatus('error'); }; });
      const video = videoRef.current;
      if (!video) { release(); return; }
      video.srcObject = stream;
      await video.play();
      if (token === generation.current) setStatus('ready');
    } catch (err) {
      if (token !== generation.current) return;
      release(); setError(cameraErrorMessage(err)); setStatus('error');
    }
  }, [release]);
  useEffect(() => release, [release]);
  return { videoRef, status, error, start, stop };
}
