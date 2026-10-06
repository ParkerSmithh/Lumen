import { lazy, Suspense, useMemo, useState } from 'react';
import { useWebcam } from './hooks/useWebcam';
import { useBodyTracking } from './hooks/useBodyTracking';
import { useHandTracking } from './hooks/useHandTracking';
import { useArtworkGuidance } from './hooks/useArtworkGuidance';
import { GlowMode } from './modes/GlowMode';
import { FlowMode } from './modes/FlowMode';
import { SlashMode } from './modes/SlashMode';
import { ModeBoundary } from './ModeBoundary';

const colors = [['Red','#ff354e'],['Orange','#ff873b'],['Yellow','#ffd84a'],['Green','#5fffa4'],['Blue','#4d9fff'],['Purple','#b06aff']];
const modes = ['GLOW', 'FLOW', 'SLASH', 'LAUNCH'];
const concepts = ['PRESENCE', 'CREATION', 'DESTRUCTION', 'FORCE'];

export default function App() {
  const [mode, setMode] = useState('GLOW');
  const camera = useWebcam();
  const tracking = useBodyTracking(camera.videoRef, camera.status === 'ready' && mode === 'GLOW');
  const hands = useHandTracking(camera.videoRef, camera.status === 'ready' && mode !== 'GLOW');
  const [color, setColor] = useState(colors[5]);
  const [preview, setPreview] = useState(false);
  const [mouseMode, setMouseMode] = useState(false);
  const [modeError, setModeError] = useState('');
  const [reloadNeeded, setReloadNeeded] = useState(false);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [slashHit, setSlashHit] = useState(false);
  const LaunchMode = useMemo(() => lazy(() => import('./modes/LaunchMode')
    .then(module => ({ default: module.LaunchMode }))
    .catch(() => { throw Object.assign(new Error('Light unavailable'), { reloadArtwork: true }); })), [renderAttempt]);
  const active = camera.status === 'ready' || camera.status === 'loading';
  const tracker = mode === 'GLOW' ? tracking : hands;
  const error = camera.error || modeError || (!mouseMode && !preview ? tracker.error : '');
  const { quiet, understood } = useArtworkGuidance({ mode, mouseMode, cameraStatus: camera.status, trackingStatus: tracker.status, error, preview });
  const detected = tracker.status === 'tracking' || tracker.status === 'drawing';
  let message;
  if (error) message = error;
  else if (preview) message = '';
  else if (camera.status === 'loading') message = 'Waiting for camera permission…';
  else if (!mouseMode && tracker.status === 'loading') message = 'Preparing the light…';
  else if (mode === 'GLOW') message = camera.status !== 'ready' ? '' : detected ? 'Become light.' : 'Step into view. Move back until your whole body fits.';
  else if (mouseMode) message = mode === 'FLOW' ? 'Move to create.' : mode === 'SLASH' ? slashHit ? 'Cut registered · mouse fallback' : 'Fast drag through the light.' : 'Move slowly. Then flick.';
  else if (camera.status !== 'ready') message = 'Enter with camera to begin.';
  else message = mode === 'SLASH' ? detected ? 'Slash through the light.' : 'Raise your hand.' : detected ? mode === 'FLOW' ? 'Move to create.' : 'Move slowly. Then flick.' : 'Raise your index finger.';

  const enter = () => { setPreview(false); camera.start(); };
  const retryTracking = async () => { camera.stop(); await new Promise(resolve => setTimeout(resolve, 0)); enter(); };
  const retryArtwork = () => { setModeError(''); setRenderAttempt(value => value + 1); };
  const renderingFailed = () => setModeError('This light is unavailable on this device. Try again, or choose another mode.');
  const boundaryFailed = (message, reload) => { setModeError(message); setReloadNeeded(reload); };
  const selectMode = next => {
    if (next === mode) return;
    setMode(next); setPreview(false); setMouseMode(false); setModeError(''); setReloadNeeded(false); setSlashHit(false);
  };
  const entry = mode === 'GLOW' && !active && !preview;
  const caption = <div className={entry ? 'entry-caption' : `live-caption ${quiet && !error ? 'quiet' : ''}`} role="status" aria-live="polite">
    {message && <><span className={`signal ${detected ? 'detected' : ''}`} />{message}</>}
    {!mouseMode && tracker.status === 'error' && <button className="preview-link" onClick={mode === 'GLOW' ? retryTracking : hands.retry}>{mode === 'GLOW' ? 'Retry body tracking' : 'Retry hand tracking'}</button>}
    {modeError && <button className="preview-link" onClick={reloadNeeded ? () => location.reload() : retryArtwork}>{reloadNeeded ? 'Reload artwork' : 'Try this mode again'}</button>}
  </div>;

  return <main style={{ '--light': mode === 'GLOW' ? color[1] : '#a855f7' }}>
    <video ref={camera.videoRef} className="camera-input" muted playsInline aria-hidden="true" />
    <div className="mode-stage" key={`${mode}:${renderAttempt}`}>
      <ModeBoundary onFailure={boundaryFailed}>
        {mode === 'GLOW' ? <GlowMode maskRef={tracking.maskRef} color={color[1]} preview={preview} />
          : mode === 'FLOW' ? <FlowMode handRef={hands.handRef} mouseMode={mouseMode} onFailure={renderingFailed} onInteraction={understood} />
          : mode === 'SLASH' ? <SlashMode handRef={hands.handRef} mouseMode={mouseMode} onFailure={renderingFailed} onSlash={hit => { if (hit) setSlashHit(true); understood(); }} />
          : <Suspense fallback={<div className="mode-loading" aria-live="polite">Preparing matter…</div>}>
            <LaunchMode handRef={hands.handRef} mouseMode={mouseMode} onFailure={renderingFailed} onInteraction={understood} />
          </Suspense>}
      </ModeBoundary>
    </div>
    <div className="atmosphere" aria-hidden="true" />
    <header><div><h1>LUMEN</h1><p>BODY / LIGHT / DIGITAL MATTER</p></div><span className="edition">AN INTERACTIVE EXPERIMENT<br />0{modes.indexOf(mode) + 1} — {concepts[modes.indexOf(mode)]}</span></header>
    <nav aria-label="Artwork modes">{modes.map((name, i) => <button key={name} onClick={() => selectMode(name)} aria-label={name} aria-current={mode === name ? 'page' : undefined}><span className="mode-number">0{i + 1}</span>{name}{mode === name && <span className="active-dot" />}</button>)}</nav>
    {entry && <section className="invitation"><h2>Become<br /><em>light.</em></h2><p>A gesture. A silhouette. A different kind of presence.</p><button className="enter" onClick={enter}>{camera.status === 'error' ? 'Try camera again' : 'Enter with camera'}<span aria-hidden="true">↗</span></button>{!error && <p className="privacy">Your camera brings movement into the work.<br />Video stays on your device, out of view.</p>}<button className="preview-link" onClick={() => setPreview(true)}>Preview light</button>{caption}</section>}
    {!entry && caption}
    {mode === 'GLOW' && preview && <div className="preview-label">Illustrated preview · camera off <button onClick={() => setPreview(false)} aria-label="Close preview">×</button></div>}
    <footer>{mode === 'GLOW' ? <div className="color-picker"><span>EMISSION <b>{color[0]}</b></span><div role="group" aria-label="Glow color">{colors.map(entry => <button key={entry[0]} className="color" style={{ '--swatch': entry[1] }} aria-label={entry[0]} aria-pressed={color[0] === entry[0]} onClick={() => setColor(entry)} />)}</div></div>
      : <div className="flow-controls"><span>{mode === 'FLOW' ? 'LIGHT, IN MOTION' : mode === 'SLASH' ? 'DIGITAL MATTER' : 'MATTER, IN MOTION'}</span><button aria-pressed={mouseMode} onClick={() => { setMouseMode(value => !value); setSlashHit(false); }}>{mouseMode ? 'Use camera interaction' : 'Mouse / touch fallback'}</button></div>}
      <div className="camera-controls">{active ? <button onClick={camera.stop}>Stop camera</button> : preview || mode !== 'GLOW' ? <button onClick={enter}>{camera.status === 'error' ? 'Try camera again' : 'Enter with camera'} <span aria-hidden="true">↗</span></button> : <span>CAMERA PROCESSED ON YOUR DEVICE</span>}<button aria-label="Fullscreen" onClick={() => { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())?.catch(() => {}); }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /></svg></button></div>
    </footer>
  </main>;
}
