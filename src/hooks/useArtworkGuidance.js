import { useCallback, useEffect, useRef, useState } from 'react';

export function useArtworkGuidance({ mode, mouseMode, cameraStatus, trackingStatus, error, preview, guidanceKey = '' }) {
  const scope = `${mode}:${mouseMode}:${cameraStatus}:${preview}:${Boolean(error)}:${guidanceKey}`;
  const current = useRef(null), latest = useRef(null);
  latest.current = { scope, trackingStatus, error };
  const [quietScope, setQuietScope] = useState(null);
  useEffect(() => {
    const state = { scope, alive: true, fade: null, loss: null, learned: false };
    current.current = state; setQuietScope(null);
    return () => { state.alive = false; clearTimeout(state.fade); clearTimeout(state.loss); };
  }, [scope]);
  const understood = useCallback(() => {
    const state = current.current;
    if (!state?.alive || state.scope !== scope || latest.current.scope !== scope || latest.current.error || state.learned || state.fade) return;
    state.fade = setTimeout(() => {
      state.fade = null;
      if (!state.alive || latest.current.scope !== scope || latest.current.error || (!mouseMode && latest.current.trackingStatus === 'searching')) return;
      state.learned = true; setQuietScope(scope);
    }, 2000);
  }, [scope, mouseMode]);
  useEffect(() => {
    const state = current.current;
    if (!state || error || preview || (!mouseMode && cameraStatus !== 'ready')) return;
    if (!mouseMode && trackingStatus === 'searching') {
      clearTimeout(state.fade); state.fade = null;
      if (!state.loss) state.loss = setTimeout(() => {
        state.loss = null;
        if (!state.alive || latest.current.scope !== scope || latest.current.trackingStatus !== 'searching') return;
        state.learned = false; setQuietScope(null);
      }, 1500);
      return;
    }
    clearTimeout(state.loss); state.loss = null;
    if (!mouseMode && ((mode === 'GLOW' && trackingStatus === 'tracking') || (mode === 'FLOW' && trackingStatus === 'drawing'))) understood();
  }, [scope, mode, mouseMode, cameraStatus, trackingStatus, error, preview, understood]);
  return { quiet: !error && quietScope === scope, understood };
}
