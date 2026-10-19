import './game/gameInstructions.css';
import {GameInstructionProvider} from './game/useGameInstructions';
import { lazy, Suspense, useMemo, useState, useEffect, useRef } from 'react';
import { useWebcam } from './hooks/useWebcam';
import {CameraSettings} from './camera/CameraSettings';
import { useBodyTracking } from './hooks/useBodyTracking';
import { useHandTracking } from './hooks/useHandTracking';
import { useArtworkGuidance } from './hooks/useArtworkGuidance';
import { GlowMode } from './modes/GlowMode';
import {GlowIntensityControl} from './effects/GlowIntensityControl';
import { FlowMode } from './modes/FlowMode';
import { SlashMode } from './modes/SlashMode';
import { ModeBoundary } from './ModeBoundary';
import { InteractionGuide } from './InteractionGuide';
import {ExperienceLauncher,experiences} from './ExperienceLauncher';
import {ExploreDialog} from './ExploreDialog';

import {TrackingStatus} from './TrackingStatus';
import { TrackingDiagnostics } from './TrackingDiagnostics';
import { colors } from './colors';
import {createEchoSession} from './echoes/echoRuntime';
import LumenCore from './beyond/LumenCore';
import {BodyControl} from './beyond/BodyControl';
import {ChaosControl} from './beyond/ChaosControl';
import {PulseControl} from './beyond/PulseControl';
const Convergence=lazy(()=>import('./beyond/Convergence'));
const EchoGallery=lazy(()=>import('./echoes/EchoGallery'));
const modes = ['FLOW', 'GLOW', 'SLASH', 'LAUNCH'];
const navigation = ['FLOW','GLOW','ENERGY_RUSH','SLASH','LAUNCH'];
const modeLabels = {LAUNCH:'KINETIC',ENERGY_RUSH:'ENERGY RUSH'};
const concepts = ['CREATION', 'PRESENCE', 'DESTRUCTION', 'FORCE'];

export default function App(){return <GameInstructionProvider><LumenApp/></GameInstructionProvider>;}
function LumenApp() {
  const [mode, setMode] = useState('GLOW');const [poseEnabled,setPoseEnabled]=useState(false);const [energyRush,setEnergyRush]=useState(false);
  const [mouseMode, setMouseMode] = useState(false);
  const [panel,setPanel]=useState(null);
  const [launcher,setLauncher]=useState('browse'),[selected,setSelected]=useState(null),[hasEntered,setHasEntered]=useState(false);
  const [activation,setActivation]=useState({mode:null,serial:0});
  const connectionRequested=useRef(false),launcherTrigger=useRef(null);
  const browsing=launcher!==null;
  const activeTab=selected?(selected.id==='energy'?'ENERGY_RUSH':selected.mode):hasEntered?(energyRush?'ENERGY_RUSH':mode):null;
  const camera = useWebcam();
  const [echoSession]=useState(()=>createEchoSession({bodyshiftEnabled:!(import.meta.env.DEV&&new URLSearchParams(location.search).has("bodyOff")),chaosEnabled:!(import.meta.env.DEV&&new URLSearchParams(location.search).has("chaosOff")),beyondEnabled:!(import.meta.env.DEV&&new URLSearchParams(location.search).has("beyondOff"))}));
  const galleryTrigger=useRef(null);
  const [view,setView]=useState('lumen');const gallery=view!=='lumen';
  useEffect(()=>{if(import.meta.env.DEV&&new URLSearchParams(location.search).has('debugBeyond')){window.__lumenBeyond={snapshot:()=>echoSession.beyond.snapshot(),counts:()=>echoSession.beyond.counts(),enabled:()=>echoSession.beyond.stateEnabled};return()=>{delete window.__lumenBeyond;};}},[echoSession]);
  useEffect(()=>{if(import.meta.env.DEV&&new URLSearchParams(location.search).has('debugChaos')){window.__lumenChaos={snapshot:mode=>echoSession.beyond.chaos.snapshot(mode),counts:()=>echoSession.beyond.chaos.counts(),profile:mode=>echoSession.beyond.chaos.profile(mode)};return()=>{delete window.__lumenChaos;};}},[echoSession]);
  useEffect(()=>{if(import.meta.env.DEV&&new URLSearchParams(location.search).has('debugBodyshift')){window.__lumenBodyshift={snapshot:mode=>echoSession.beyond.bodyshift.snapshot(mode),counts:()=>echoSession.beyond.chaos.counts()};return()=>{delete window.__lumenBodyshift;};}},[echoSession]);
  const openConvergence=()=>{if(view==='convergence'||!echoSession.beyond.snapshot().complete)return;echoSession.gate.set(true);echoSession.clearLive();setView('convergence');};
  useEffect(()=>{if(import.meta.env.DEV&&new URLSearchParams(location.search).has("debugEchoes")){window.__lumenEchoes={snapshot:()=>echoSession.store.snapshot()};return()=>{delete window.__lumenEchoes;};}},[echoSession]);
  const openEchoes=()=>{if(echoSession.gate.suspended)return;echoSession.gate.set(true);echoSession.clearLive();setView('echoes');};
  const closeEchoes=()=>{echoSession.gate.set(false);setView('lumen');requestAnimationFrame(()=>galleryTrigger.current?.focus({preventScroll:true}));};
  const tracking = useBodyTracking(camera.videoRef, camera.status === 'ready' && !gallery && !browsing && mode === 'GLOW',poseEnabled);
  const hands = useHandTracking(camera.videoRef, camera.status === 'ready' && !gallery && !browsing && !mouseMode && mode !== 'GLOW');
  const [color, setColor] = useState(colors[5]);
  const [glowIntensity,setGlowIntensity]=useState('NEON');
  const [bodyBrightness,setBodyBrightness]=useState('RADIANT');
  const [preview, setPreview] = useState(false);
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
  const cameraDefaultsNotice = camera.prefs.remember && camera.prefs.autoReconnect && !camera.prefs.startupConfirmed;
  const cameraConnectionNotice = cameraDefaultsNotice ? 'Connecting remembers this camera and enables future auto-reconnect. Change this in Camera settings.' : '';
  const tracker = mode === 'GLOW' ? tracking : hands;
  const error = camera.error || modeError || (!mouseMode && !preview && mode!=='SLASH' ? tracker.error : '');
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
  else if (camera.status === 'loading') message = camera.detail;
  else if (!mouseMode && tracker.status === 'loading') message = mode==='GLOW'?'Camera live. Preparing body tracking\u2026':'Camera live. Preparing hand tracking\u2026';
  else if (mode === 'GLOW') message = camera.status !== 'ready' ? '' : detected ? 'Become light.' : 'Step into view. Move back until your whole body fits.';
  else if (mouseMode) message = mode === 'FLOW' ? 'Move to create.' : mode === 'SLASH' ? slashHit ? 'Cut registered · mouse fallback' : 'Fast drag through the light.' : 'Press to create. Move slowly, then flick.';
  else if (camera.status !== 'ready') message = 'Enter with camera to begin.';
  else message = mode === 'SLASH' ? detected ? 'Slash through the light.' : 'Raise your hand.' : detected ? mode === 'FLOW' ? 'Move to create.' : 'Point. Push forward to create. Retract to create again.' : 'Raise your index finger.';

  const cameraAction = camera.status === 'error' ? 'RETRY CAMERA' : camera.prefs.startupConfirmed ? 'RECONNECT CAMERA' : 'ENABLE CAMERA';
  const enter = () => { setPreview(false); camera.start(); };
  const retryTracking = async () => { camera.stop(); await new Promise(resolve => setTimeout(resolve, 0)); enter(); };
  const retryArtwork = () => { setModeError(''); setRenderAttempt(value => value + 1); };
  const renderingFailed = () => setModeError('This light is unavailable on this device. Try again, or choose another mode.');
  const boundaryFailed = (message, reload) => { setModeError(message); setReloadNeeded(reload); };
  const selectMode = next => {
    if (next === mode && !energyRush) return;
    setEnergyRush(false);setPoseEnabled(false);setMode(next); setPreview(false); setMouseMode(false); setModeError(''); setReloadNeeded(false); setSlashHit(false); setSlashOverlay(true); setGuideInteraction(null);
  };
  const finishSelection = (fallback=false) => {
    connectionRequested.current=false;
    if(selected){selectMode(selected.mode);setEnergyRush(selected.id==='energy');}
    setMouseMode(fallback&&selected?.mode!=='GLOW');
    setHasEntered(true);setLauncher(null);setSelected(null);
    requestAnimationFrame(()=>document.querySelector('nav button[aria-current="page"]')?.focus({preventScroll:true}));
  };
  useEffect(()=>{if(connectionRequested.current&&camera.status==='ready')finishSelection();},[camera.status]);
  useEffect(()=>{echoSession.gate.set(browsing,'launcher');return()=>echoSession.gate.set(false,'launcher');},[browsing,echoSession]);
  const cancelSetup=()=>{if(connectionRequested.current){connectionRequested.current=false;camera.stop();}setSelected(null);setLauncher('browse');};
  const chooseExperience=exp=>{if(connectionRequested.current)camera.stop();connectionRequested.current=false;setSelected(exp);setLauncher('setup');setActivation(v=>({mode:matchMedia('(prefers-reduced-motion: reduce)').matches?null:(exp.id==='energy'?'ENERGY_RUSH':exp.mode),serial:v.serial+1}));};
  const browseExperiences=()=>{if(connectionRequested.current){connectionRequested.current=false;camera.stop();}launcherTrigger.current=document.activeElement;setSelected(null);setLauncher('browse');setPanel(null);};
  const resumeExperience=()=>{setLauncher(null);requestAnimationFrame(()=>launcherTrigger.current?.focus({preventScroll:true}));};
  const activateTab=next=>{
    setActivation(v=>({mode:matchMedia('(prefers-reduced-motion: reduce)').matches?null:next,serial:v.serial+1}));
    if(!hasEntered){chooseExperience(experiences.find(exp=>next==='ENERGY_RUSH'?exp.id==='energy':exp.mode===next));return;}
    if(connectionRequested.current){connectionRequested.current=false;camera.stop();}
    setLauncher(null);setSelected(null);if(next==='ENERGY_RUSH'){selectMode('GLOW');setEnergyRush(true);}else selectMode(next);
  };
  const connectSelected=(deviceId,facingMode)=>{connectionRequested.current=true;if(deviceId!==camera.prefs.deviceId||facingMode!==camera.prefs.facingMode)camera.selectCamera(deviceId,facingMode);else camera.start();};
  const entry = mode === 'GLOW' && !active && !preview && !energyRush;
  const caption = <div className={entry ? 'entry-caption' : `live-caption ${quiet && !error ? 'quiet' : ''}${error ? ' has-error' : ''}`} role="status" aria-label="Artwork guidance" aria-live="polite">
    {message && <><span className={`signal ${detected ? 'detected' : ''}`} />{message}</>}
    {!mouseMode && tracker.status === 'error' && <button className="preview-link" onClick={mode === 'GLOW' ? retryTracking : hands.retry}>{mode === 'GLOW' ? 'Retry body tracking' : 'Retry hand tracking'}</button>}
    {modeError && <button className="preview-link" onClick={reloadNeeded ? () => location.reload() : retryArtwork}>{reloadNeeded ? 'Reload artwork' : 'Try this mode again'}</button>}
  </div>;

  return <main data-launcher={browsing} data-entry={entry} style={{ '--light': color[1] }} data-slash-overlay={mode === 'SLASH' && slashOverlay}>
    <video ref={camera.videoRef} className={`camera-input${camera.status === 'ready' && !gallery && mode !== 'GLOW' ? ' camera-preview' : ''}`} muted playsInline aria-label="Live webcam preview" aria-hidden={browsing || gallery || camera.status !== 'ready' || mode === 'GLOW'} />
    <div className="mode-stage" inert={gallery||browsing} aria-hidden={gallery||browsing} style={gallery||browsing?{visibility:"hidden"}:undefined} key={`${mode}:${renderAttempt}`}>
      {hasEntered && <ModeBoundary onFailure={boundaryFailed}>
        {mode === 'GLOW' ? <GlowMode bodyBrightness={bodyBrightness} intensity={glowIntensity} instructionCamera={{status:camera.status,error:camera.error,trackingStatus:tracker.status,trackingError:tracker.error,connectionNotice:cameraConnectionNotice}} energyRush={energyRush} onExitEnergy={()=>setEnergyRush(false)} onCamera={enter} poseEnabled={poseEnabled} onPoseToggle={setPoseEnabled} poseStatus={tracking.poseStatus} poseRef={tracking.poseRef} echoSession={echoSession} onChooseInput={value=>setMouseMode(value==='assist')} maskRef={tracking.maskRef} videoRef={camera.videoRef} cameraReady={camera.status === 'ready'} color={color[1]} preview={preview} />
          : mode === 'FLOW' ? <FlowMode echoSession={echoSession} instructionCamera={{status:camera.status,error:camera.error,trackingStatus:tracker.status,trackingError:tracker.error,connectionNotice:cameraConnectionNotice}} onCamera={enter} onChooseInput={value=>setMouseMode(value==='assist')} cameraReady={camera.status === 'ready'} videoRef={camera.videoRef} trackingError={hands.status === 'error'} handRef={hands.handRef} color={color[1]} mouseMode={mouseMode} onFailure={renderingFailed} onInteraction={interacted} />
          : mode === 'SLASH' ? <SlashMode echoSession={echoSession} instructionCamera={{status:camera.status,error:camera.error,trackingStatus:tracker.status,trackingError:tracker.error,connectionNotice:cameraConnectionNotice}} onCamera={enter} onChooseInput={value=>setMouseMode(value==='assist')} videoRef={camera.videoRef} handRef={hands.handRef} cameraReady={camera.status === 'ready'} color={color[1]} mouseMode={mouseMode} onFailure={renderingFailed} onStateChange={state => setSlashOverlay(state.phase !== 'playing' || state.paused)} onSessionStart={() => { setSlashHit(false); setSlashSession(value => value + 1); setGuideInteraction(null); }} onSlash={hit => { if (hit) setSlashHit(true); interacted(); }} />
          : <Suspense fallback={<div className="mode-loading" aria-live="polite">Preparing matter…</div>}>
            <LaunchMode echoSession={echoSession} instructionCamera={{status:camera.status,error:camera.error,trackingStatus:tracker.status,trackingError:tracker.error,connectionNotice:cameraConnectionNotice}} onCamera={enter} onChooseInput={value=>setMouseMode(value==='assist')} cameraReady={camera.status === 'ready'} videoRef={camera.videoRef} trackingError={hands.status === 'error'} handRef={hands.handRef} color={color[1]} mouseMode={mouseMode} onFailure={renderingFailed} onInteraction={interacted} />
          </Suspense>}
      </ModeBoundary>}
    </div>
    {import.meta.env.DEV && new URLSearchParams(location.search).has('debugTracking') && mode !== 'GLOW' && <TrackingDiagnostics hands={hands} mode={mode} />}
    <div className="atmosphere" aria-hidden="true" />
    <div className="lumen-chrome" inert={gallery} aria-hidden={gallery} style={gallery?{visibility:"hidden"}:undefined}><header><div><h1>LUMEN</h1><p>BODY / LIGHT / DIGITAL MATTER</p></div><span className="edition">AN INTERACTIVE EXPERIMENT<br />{!hasEntered&&!selected?'CHOOSE AN EXPERIENCE':<>0{modes.indexOf(selected?.mode||mode) + 1} / {concepts[modes.indexOf(selected?.mode||mode)]}</>}</span></header>
    <nav aria-label="Artwork modes">{navigation.map((name, i) => <button key={name} onClick={() => activateTab(name)} className={activation.mode===name?`tab-activated tab-activation-${activation.serial%2}`:undefined} onAnimationEnd={event=>{if(event.animationName.startsWith("tab-burst"))setActivation(v=>v.mode===name?{...v,mode:null}:v);}} style={{"--tab-accent":experiences.find(exp=>name==='ENERGY_RUSH'?exp.id==='energy':exp.mode===name)?.accent}} aria-label={modeLabels[name]||name} aria-current={activeTab === name ? 'page' : undefined}><span className="mode-number">0{i + 1}</span>{modeLabels[name]||name}{activeTab === name && <span className="active-dot" />}</button>)}</nav><div className="shell-links"><button onClick={browseExperiences}>EXPLORE MODES</button><button onClick={()=>setPanel('about')}>ABOUT LUMEN</button></div><button ref={galleryTrigger} className="echoes-open" onPointerDown={openEchoes} onClick={openEchoes}>ECHOES</button><LumenCore session={echoSession} onConverge={openConvergence}/><PulseControl session={echoSession} mode={mode}/><ChaosControl session={echoSession} mode={mode}/><BodyControl session={echoSession} mode={mode} poseEnabled={poseEnabled} onPoseToggle={setPoseEnabled} poseStatus={tracking.poseStatus} cameraReady={camera.status==='ready'} visible={!entry&&!energyRush}/>
    {entry && <section className="invitation" aria-label="Welcome to LUMEN"><div className="welcome-intro"><div className="welcome-wordmark" aria-hidden="true">LUMEN</div><p>Your body becomes the light.</p></div><button className="welcome-explore" onClick={()=>setPanel('modes')}>ENTER LUMEN <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button><button className="enter" onClick={enter}>{cameraAction}<span aria-hidden="true">↗</span></button>{(!error || cameraDefaultsNotice) && <p className="privacy">{cameraDefaultsNotice ? <>Connecting remembers this camera and enables future auto-reconnect.<br />Change this in Camera settings. Video stays on your device.</> : <>Your camera brings movement into the work.<br />Video stays on your device. GLOW shows your live scene.</>}</p>}<details className="quick-start"><summary>NEW HERE? QUICK START</summary><ol><li>Connect your camera when ready.</li><li>Step back until your body fits in view.</li><li>Move to illuminate. Choose a mode to explore more.</li></ol><p>Prefer another input? Games explain their keyboard, mouse, or touch controls in HOW TO PLAY.</p></details><div className="entry-actions"><button className="preview-link" onClick={() => setPreview(true)}>Preview light</button><button className="glow-play" onClick={()=>setEnergyRush(true)}>PLAY ENERGY RUSH</button></div>{caption}</section>}
    {!entry && caption}
    {mode !== 'GLOW' && !active && !mouseMode && <section className="camera-invitation" aria-label="Camera connection"><button className="enter" onClick={enter}>{cameraAction}</button><p>{camera.status === 'error' ? 'Camera access needs your attention. Retry when ready, or use mouse / touch.' : cameraDefaultsNotice ? 'Connecting remembers this camera and enables future auto-reconnect. Change this in Camera settings.' : 'Bring your movement into the light.'}</p></section>}
    {mode === 'GLOW' && preview && <div className="preview-label">Illustrated preview · camera off <button onClick={() => setPreview(false)} aria-label="Close preview">×</button></div>}
    {mode==='GLOW'&&!energyRush&&!entry&&<button className="glow-play" onClick={()=>setEnergyRush(true)}>PLAY ENERGY RUSH</button>}
    {!energyRush&&<InteractionGuide mode={mode} mouseMode={mouseMode} quiet={guideQuiet} />}
    <footer><TrackingStatus camera={camera.status} tracking={tracker.status} assisted={mouseMode} frameMotion={mode==='SLASH'} body={mode==='GLOW'} error={error}/><div className="color-picker"><span>EMISSION <b>{color[0]}</b></span><div role="group" aria-label="Light color">{colors.map(entry => <button key={entry[0]} className="color" style={{ '--swatch': entry[1] }} aria-label={entry[0]} aria-pressed={color[0] === entry[0]} onClick={() => setColor(entry)} />)}</div></div>
      {mode === 'GLOW' && !entry && <GlowIntensityControl bodyBrightness={bodyBrightness} onBodyChange={setBodyBrightness} value={glowIntensity} onChange={setGlowIntensity}/>}
      {mode !== 'GLOW' && <div className="flow-controls"><span>{mode === 'FLOW' ? 'LIGHT, IN MOTION' : mode === 'SLASH' ? 'DIGITAL MATTER' : 'MATTER, IN MOTION'}</span><button aria-pressed={mouseMode} onClick={() => { setMouseMode(value => !value); setSlashHit(false); }}>{mouseMode ? 'Use camera interaction' : 'Mouse / touch fallback'}</button></div>}
      <div className="camera-controls">{active ? <button onClick={camera.stop}>Stop camera</button> : preview || (mode !== 'GLOW' && mouseMode) ? <button className="camera-connect" aria-label={cameraAction} aria-describedby={cameraConnectionNotice ? 'camera-connect-defaults' : undefined} disabled={camera.status === 'loading'} onClick={enter}>{cameraAction} <span aria-hidden="true">↗</span>{cameraConnectionNotice && <small id="camera-connect-defaults" className="camera-connect-notice">{cameraConnectionNotice}</small>}</button> : <span>CAMERA PROCESSED ON YOUR DEVICE</span>}<CameraSettings camera={camera} tracking={tracker.status} gate={echoSession.gate}/><button aria-label="Fullscreen" onClick={() => { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())?.catch(() => {}); }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /></svg></button></div>
    </footer></div>
    {browsing&&!gallery&&<ExperienceLauncher selected={selected} camera={camera} onSelect={chooseExperience} onConnect={connectSelected} onContinue={()=>finishSelection()} onCancel={cancelSetup} onFallback={()=>{connectionRequested.current=false;camera.stop();finishSelection(true);}} onEchoes={()=>{echoSession.gate.set(true);echoSession.clearLive();setView('echoes');}} canResume={hasEntered} onResume={resumeExperience}/>}
    {panel&&<ExploreDialog kind={panel} gate={echoSession.gate} onClose={()=>setPanel(null)} onMode={next=>{selectMode(next);setPanel(null);}} onEnergy={()=>{selectMode('GLOW');setEnergyRush(true);setPanel(null);}}/>}
    {view==='echoes'&&<ModeBoundary fallback={<GalleryUnavailable onBack={closeEchoes}/>}><Suspense fallback={<section className="echo-loading"><p>Gathering echoes?</p><button onClick={closeEchoes}>BACK TO LUMEN</button></section>}><EchoGallery store={echoSession.store} session={echoSession} onConverge={openConvergence} onBack={closeEchoes}/></Suspense></ModeBoundary>}
    {view==='convergence'&&<ModeBoundary fallback={<GalleryUnavailable onBack={closeEchoes}/>}><Suspense fallback={<section className="echo-loading"><p>Gathering light...</p><button onClick={closeEchoes}>BACK TO LUMEN</button></section>}><Convergence session={echoSession} onBack={closeEchoes}/></Suspense></ModeBoundary>}
  </main>;
}


function GalleryUnavailable({onBack}) {return <section className="echo-loading" role="alert"><h2>Light interrupted.</h2><p>This artwork could not open. Return to LUMEN, or reload to try again.</p><button autoFocus onClick={onBack}>BACK TO LUMEN</button><button onClick={()=>location.reload()}>RELOAD LUMEN</button></section>;}
