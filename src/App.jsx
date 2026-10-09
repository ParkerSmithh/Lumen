import { lazy, Suspense, useMemo, useState, useEffect } from 'react';
import { useWebcam } from './hooks/useWebcam';
import { useBodyTracking } from './hooks/useBodyTracking';
import { useHandTracking } from './hooks/useHandTracking';
import { useArtworkGuidance } from './hooks/useArtworkGuidance';
import { GlowMode } from './modes/GlowMode';
import { FlowMode } from './modes/FlowMode';
import { SlashMode } from './modes/SlashMode';
import { ModeBoundary } from './ModeBoundary';
import { InteractionGuide } from './InteractionGuide';

import { TrackingDiagnostics } from './TrackingDiagnostics';
import { colors } from './colors';
import {createEchoSession} from './echoes/echoRuntime';
import LumenCore from './beyond/LumenCore';
import {PulseControl} from './beyond/PulseControl';
const Convergence=lazy(()=>import('./beyond/Convergence'));
const EchoGallery=lazy(()=>import('./echoes/EchoGallery'));
const modes = ['GLOW', 'FLOW', 'SLASH', 'LAUNCH'];
const concepts = ['PRESENCE', 'CREATION', 'DESTRUCTION', 'FORCE'];

export default function App() {
  const [mode, setMode] = useState('GLOW');
  const camera = useWebcam();
  const [echoSession]=useState(()=>createEchoSession({beyondEnabled:!(import.meta.env.DEV&&new URLSearchParams(location.search).has("beyondOff"))}));
  const [view,setView]=useState('lumen');const gallery=view!=='lumen';
  useEffect(()=>{if(import.meta.env.DEV&&new URLSearchParams(location.search).has('debugBeyond')){window.__lumenBeyond={snapshot:()=>echoSession.beyond.snapshot(),counts:()=>echoSession.beyond.counts(),enabled:()=>echoSession.beyond.stateEnabled};return()=>{delete window.__lumenBeyond;};}},[echoSession]);
  const openConvergence=()=>{if(view==='convergence'||!echoSession.beyond.snapshot().complete)return;echoSession.gate.set(true);echoSession.clearLive();setView('convergence');};
  useEffect(()=>{if(import.meta.env.DEV&&new URLSearchParams(location.search).has("debugEchoes")){window.__lumenEchoes={snapshot:()=>echoSession.store.snapshot()};return()=>{delete window.__lumenEchoes;};}},[echoSession]);
  const openEchoes=()=>{if(echoSession.gate.suspended)return;echoSession.gate.set(true);echoSession.clearLive();setView('echoes');};
  const closeEchoes=()=>{echoSession.gate.set(false);setView('lumen');};
  const tracking = useBodyTracking(camera.videoRef, camera.status === 'ready' && !gallery && mode === 'GLOW');
  const hands = useHandTracking(camera.videoRef, camera.status === 'ready' && !gallery && mode !== 'GLOW');
  const [color, setColor] = useState(colors[5]);
  const [preview, setPreview] = useState(false);
  const [mouseMode, setMouseMode] = useState(false);
  const [modeError, setModeError] = useState('');
  const [reloadNeeded, setReloadNeeded] = useState(false);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [slashHit, setSlashHit] = useState(false);
  const [slashSession, setSlashSession] = useState(0);
  const [slashOverlay, setSlashOverlay] = useState(true);
  const LaunchMode = useMemo(() => lazy(() => import('./modes/LaunchMode')
    .then(module => ({ default: module.LaunchMode }))
    .catch(() => { throw Object.assign(new Error('Light unavailable'), { reloadArtwork: true }); })), [renderAttempt]);
  const active = camera.status === 'ready' || camera.status === 'loading';
  const tracker = mode === 'GLOW' ? tracking : hands;
  const error = camera.error || modeError || (!mouseMode && !preview ? tracker.error : '');
  const guidanceKey = mode === 'SLASH' ? slashSession : '';
  const { quiet, understood } = useArtworkGuidance({ mode, mouseMode, cameraStatus: camera.status, trackingStatus: tracker.status, error, preview, guidanceKey });
  const [guideInteraction, setGuideInteraction] = useState(null);
  const guideScope = `${mode}:${mouseMode}:${camera.status}:${preview}:${guidanceKey}`;
  const interacted = () => { setGuideInteraction(guideScope); understood(); };
  const detected = tracker.status === 'tracking' || tracker.status === 'drawing';
  const guideQuiet = !error && (quiet || guideInteraction === guideScope || (!mouseMode && ((mode === 'GLOW' && detected) || (mode === 'FLOW' && tracker.status === 'drawing'))));
  let message;
  if (error) message = error;
  else if (preview) message = '';
  else if (camera.status === 'loading') message = 'Waiting for camera permission…';
  else if (!mouseMode && tracker.status === 'loading') message = 'Preparing the light…';
  else if (mode === 'GLOW') message = camera.status !== 'ready' ? '' : detected ? 'Become light.' : 'Step into view. Move back until your whole body fits.';
  else if (mouseMode) message = mode === 'FLOW' ? 'Move to create.' : mode === 'SLASH' ? slashHit ? 'Cut registered · mouse fallback' : 'Fast drag through the light.' : 'Press to create. Move slowly, then flick.';
  else if (camera.status !== 'ready') message = 'Enter with camera to begin.';
  else message = mode === 'SLASH' ? detected ? 'Slash through the light.' : 'Raise your hand.' : detected ? mode === 'FLOW' ? 'Move to create.' : 'Point. Push forward to create. Retract to create again.' : 'Raise your index finger.';

  const enter = () => { setPreview(false); camera.start(); };
  const retryTracking = async () => { camera.stop(); await new Promise(resolve => setTimeout(resolve, 0)); enter(); };
  const retryArtwork = () => { setModeError(''); setRenderAttempt(value => value + 1); };
  const renderingFailed = () => setModeError('This light is unavailable on this device. Try again, or choose another mode.');
  const boundaryFailed = (message, reload) => { setModeError(message); setReloadNeeded(reload); };
  const selectMode = next => {
    if (next === mode) return;
    setMode(next); setPreview(false); setMouseMode(false); setModeError(''); setReloadNeeded(false); setSlashHit(false); setSlashOverlay(true); setGuideInteraction(null);
  };
  const entry = mode === 'GLOW' && !active && !preview;
  const caption = <div className={entry ? 'entry-caption' : `live-caption ${quiet && !error ? 'quiet' : ''}${error ? ' has-error' : ''}`} role="status" aria-live="polite">
    {message && <><span className={`signal ${detected ? 'detected' : ''}`} />{message}</>}
    {!mouseMode && tracker.status === 'error' && <button className="preview-link" onClick={mode === 'GLOW' ? retryTracking : hands.retry}>{mode === 'GLOW' ? 'Retry body tracking' : 'Retry hand tracking'}</button>}
    {modeError && <button className="preview-link" onClick={reloadNeeded ? () => location.reload() : retryArtwork}>{reloadNeeded ? 'Reload artwork' : 'Try this mode again'}</button>}
  </div>;

  return <main style={{ '--light': color[1] }} data-slash-overlay={mode === 'SLASH' && slashOverlay}>
    <video ref={camera.videoRef} className={`camera-input${camera.status === 'ready' && !gallery && mode !== 'GLOW' ? ' camera-preview' : ''}`} muted playsInline aria-label="Live webcam preview" aria-hidden={gallery || camera.status !== 'ready' || mode === 'GLOW'} />
    <div className="mode-stage" inert={gallery} aria-hidden={gallery} style={gallery?{visibility:"hidden"}:undefined} key={`${mode}:${renderAttempt}`}>
      <ModeBoundary onFailure={boundaryFailed}>
        {mode === 'GLOW' ? <GlowMode echoSession={echoSession} maskRef={tracking.maskRef} videoRef={camera.videoRef} cameraReady={camera.status === 'ready'} color={color[1]} preview={preview} />
          : mode === 'FLOW' ? <FlowMode echoSession={echoSession} cameraReady={camera.status === 'ready'} videoRef={camera.videoRef} trackingError={hands.status === 'error'} handRef={hands.handRef} color={color[1]} mouseMode={mouseMode} onFailure={renderingFailed} onInteraction={interacted} />
          : mode === 'SLASH' ? <SlashMode echoSession={echoSession} videoRef={camera.videoRef} handRef={hands.handRef} cameraReady={camera.status === 'ready'} color={color[1]} mouseMode={mouseMode} onFailure={renderingFailed} onStateChange={state => setSlashOverlay(state.phase !== 'playing' || state.paused)} onSessionStart={() => { setSlashHit(false); setSlashSession(value => value + 1); setGuideInteraction(null); }} onSlash={hit => { if (hit) setSlashHit(true); interacted(); }} />
          : <Suspense fallback={<div className="mode-loading" aria-live="polite">Preparing matter…</div>}>
            <LaunchMode echoSession={echoSession} cameraReady={camera.status === 'ready'} videoRef={camera.videoRef} trackingError={hands.status === 'error'} handRef={hands.handRef} color={color[1]} mouseMode={mouseMode} onFailure={renderingFailed} onInteraction={interacted} />
          </Suspense>}
      </ModeBoundary>
    </div>
    {import.meta.env.DEV && new URLSearchParams(location.search).has('debugTracking') && mode !== 'GLOW' && <TrackingDiagnostics hands={hands} mode={mode} />}
    <div className="atmosphere" aria-hidden="true" />
    <div className="lumen-chrome" inert={gallery} aria-hidden={gallery} style={gallery?{visibility:"hidden"}:undefined}><header><div><h1>LUMEN</h1><p>BODY / LIGHT / DIGITAL MATTER</p></div><span className="edition">AN INTERACTIVE EXPERIMENT<br />0{modes.indexOf(mode) + 1} — {concepts[modes.indexOf(mode)]}</span></header>
    <nav aria-label="Artwork modes">{modes.map((name, i) => <button key={name} onClick={() => selectMode(name)} aria-label={name} aria-current={mode === name ? 'page' : undefined}><span className="mode-number">0{i + 1}</span>{name}{mode === name && <span className="active-dot" />}</button>)}</nav><button className="echoes-open" onPointerDown={openEchoes} onClick={openEchoes}>ECHOES</button><LumenCore session={echoSession} onConverge={openConvergence}/><PulseControl session={echoSession} mode={mode}/>
    {entry && <section className="invitation"><h2>Become<br /><em>light.</em></h2><p>Your body becomes light. Your world stays in view.</p><button className="enter" onClick={enter}>{camera.status === 'error' ? 'RETRY CAMERA' : 'ENABLE CAMERA'}<span aria-hidden="true">↗</span></button>{!error && <p className="privacy">Your camera brings movement into the work.<br />Video stays on your device. GLOW shows your live scene.</p>}<button className="preview-link" onClick={() => setPreview(true)}>Preview light</button>{caption}</section>}
    {!entry && caption}
    {mode !== 'GLOW' && !active && !mouseMode && <section className="camera-invitation" aria-label="Camera connection"><button className="enter" onClick={enter}>{camera.status === 'error' ? 'RETRY CAMERA' : 'ENABLE CAMERA'}</button><p>{camera.status === 'error' ? 'Camera access needs your attention. Retry when ready, or use mouse / touch.' : 'Bring your movement into the light.'}</p></section>}
    {mode === 'GLOW' && preview && <div className="preview-label">Illustrated preview · camera off <button onClick={() => setPreview(false)} aria-label="Close preview">×</button></div>}
    <InteractionGuide mode={mode} mouseMode={mouseMode} quiet={guideQuiet} />
    <footer><div className="color-picker"><span>EMISSION <b>{color[0]}</b></span><div role="group" aria-label="Light color">{colors.map(entry => <button key={entry[0]} className="color" style={{ '--swatch': entry[1] }} aria-label={entry[0]} aria-pressed={color[0] === entry[0]} onClick={() => setColor(entry)} />)}</div></div>
      {mode !== 'GLOW' && <div className="flow-controls"><span>{mode === 'FLOW' ? 'LIGHT, IN MOTION' : mode === 'SLASH' ? 'DIGITAL MATTER' : 'MATTER, IN MOTION'}</span><button aria-pressed={mouseMode} onClick={() => { setMouseMode(value => !value); setSlashHit(false); }}>{mouseMode ? 'Use camera interaction' : 'Mouse / touch fallback'}</button></div>}
      <div className="camera-controls">{active ? <button onClick={camera.stop}>Stop camera</button> : preview || (mode !== 'GLOW' && mouseMode) ? <button className="camera-connect" disabled={camera.status === 'loading'} onClick={enter}>{camera.status === 'error' ? 'RETRY CAMERA' : 'ENABLE CAMERA'} <span aria-hidden="true">↗</span></button> : <span>CAMERA PROCESSED ON YOUR DEVICE</span>}<button aria-label="Fullscreen" onClick={() => { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())?.catch(() => {}); }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /></svg></button></div>
    </footer></div>
    {view==='echoes'&&<Suspense fallback={<section className="echo-loading"><p>Gathering echoes?</p><button onClick={closeEchoes}>BACK TO LUMEN</button></section>}><EchoGallery store={echoSession.store} session={echoSession} onConverge={openConvergence} onBack={closeEchoes}/></Suspense>}
    {view==='convergence'&&<Suspense fallback={<section className="echo-loading"><p>Gathering light...</p><button onClick={closeEchoes}>BACK TO LUMEN</button></section>}><Convergence session={echoSession} onBack={closeEchoes}/></Suspense>}
  </main>;
}
