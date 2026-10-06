import { useState } from 'react';
import { useWebcam } from './hooks/useWebcam';
import { useBodyTracking } from './hooks/useBodyTracking';
import { GlowMode } from './modes/GlowMode';
const colors = [['Red','#ff354e'],['Orange','#ff873b'],['Yellow','#ffd84a'],['Green','#5fffa4'],['Blue','#4d9fff'],['Purple','#b06aff']];
export default function App() {
  const camera = useWebcam(); const tracking = useBodyTracking(camera.videoRef, camera.status === 'ready');
  const [color, setColor] = useState(colors[5]); const [preview, setPreview] = useState(false);
  const active = camera.status === 'ready' || camera.status === 'loading';
  const message = camera.error || tracking.error || (camera.status === 'loading' ? 'Waiting for camera permission…' : tracking.status === 'loading' ? 'Preparing the light…' : tracking.status === 'tracking' ? 'Presence detected · become light' : camera.status === 'ready' ? 'Step into view. Move back until your whole body fits.' : 'Your body is the instrument.');
  const enter = () => { setPreview(false); camera.start(); };
  const retryTracking = async () => { camera.stop(); await new Promise(resolve => setTimeout(resolve, 0)); enter(); };
  return <main style={{ '--light': color[1] }}>
    <video ref={camera.videoRef} className="camera-input" muted playsInline aria-hidden="true" />
    <GlowMode maskRef={tracking.maskRef} color={color[1]} preview={preview} />
    <div className="atmosphere" aria-hidden="true" />
    <header><div><h1>LUMEN</h1><p>BODY / LIGHT / DIGITAL MATTER</p></div><span className="edition">AN INTERACTIVE EXPERIMENT<br />01 — PRESENCE</span></header>
    <nav aria-label="Artwork modes">{['GLOW','FLOW','SLASH','LAUNCH'].map((mode,i) => <button key={mode} disabled={i > 0} aria-label={i ? `${mode} — coming later` : mode} aria-current={i === 0 ? 'page' : undefined}><span className="mode-number">0{i+1}</span>{mode}{i === 0 && <span className="active-dot" />}</button>)}</nav>
    {!active && !preview && <section className="invitation"><span className="eyebrow">PRESENCE, TRANSLATED</span><h2>Become<br /><em>light.</em></h2><p>A gesture. A silhouette. A different kind of presence.</p><button className="enter" onClick={enter}>{camera.status === 'error' ? 'Try camera again' : 'Enter with camera'}<span aria-hidden="true">↗</span></button><button className="preview-link" onClick={() => setPreview(true)}>Preview light</button></section>}
    <div className="live-caption" role="status"><span className={`signal ${tracking.status === 'tracking' ? 'detected' : ''}`} />{message}{tracking.status === 'error' && <button className="preview-link" onClick={retryTracking}>Retry body tracking</button>}</div>
    {preview && <div className="preview-label">Illustrated preview · camera off <button onClick={() => setPreview(false)} aria-label="Close preview">×</button></div>}
    <footer><div className="color-picker"><span>EMISSION <b>{color[0]}</b></span><div role="group" aria-label="Glow color">{colors.map(entry => <button key={entry[0]} className="color" style={{ '--swatch': entry[1] }} aria-label={entry[0]} aria-pressed={color[0] === entry[0]} onClick={() => setColor(entry)} />)}</div></div><div className="camera-controls">{active ? <button onClick={camera.stop}>Stop camera</button> : preview ? <button onClick={enter}>Enter with camera <span aria-hidden="true">↗</span></button> : <span>CAMERA PROCESSED ON YOUR DEVICE</span>}<button aria-label="Fullscreen" onClick={() => { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())?.catch(() => {}); }}>⛶</button></div></footer>
  </main>;
}
