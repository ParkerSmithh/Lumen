import { useEffect, useState } from 'react';
import { useWebcam } from './hooks/useWebcam';
import { useRef } from 'react';
import { useBodyTracking } from './hooks/useBodyTracking';
import { useHandTracking } from './hooks/useHandTracking';
import { GlowMode } from './modes/GlowMode';
import { FlowMode } from './modes/FlowMode';
const colors = [['Red','#ff354e'],['Orange','#ff873b'],['Yellow','#ffd84a'],['Green','#5fffa4'],['Blue','#4d9fff'],['Purple','#b06aff']];
export default function App() {
  const [mode,setMode]=useState('GLOW');
  const camera=useWebcam();
  const tracking=useBodyTracking(camera.videoRef,camera.status==='ready'&&mode==='GLOW');
  const hands=useHandTracking(camera.videoRef,camera.status==='ready'&&mode==='FLOW');
  const [color,setColor]=useState(colors[5]),[preview,setPreview]=useState(false);
  const [mouseMode,setMouseMode]=useState(false),[flowError,setFlowError]=useState(''),[quiet,setQuiet]=useState(false);
  const guidance=useRef({started:false,fade:null,loss:null});
  const active=camera.status==='ready'||camera.status==='loading';
  useEffect(()=>{
    const state=guidance.current;
    const reset=()=>{clearTimeout(state.fade);clearTimeout(state.loss);state.started=false;state.fade=state.loss=null;setQuiet(false);};
    if(mode!=='FLOW'||camera.status!=='ready'||hands.status==='error'){reset();return;}
    if(hands.status==='searching'){
      if(!state.loss)state.loss=setTimeout(reset,800);
      return;
    }
    clearTimeout(state.loss);state.loss=null;
    if(hands.status==='drawing'&&!state.started){state.started=true;state.fade=setTimeout(()=>setQuiet(true),2000);}
  },[mode,hands.status,camera.status]);
  useEffect(()=>()=>{clearTimeout(guidance.current.fade);clearTimeout(guidance.current.loss);},[]);
  const glowMessage=camera.error||tracking.error||(camera.status==='loading'?'Waiting for camera permission…':tracking.status==='loading'?'Preparing the light…':tracking.status==='tracking'?'Presence detected · become light':camera.status==='ready'?'Step into view. Move back until your whole body fits.':'Your body is the instrument.');
  const flowMessage=flowError||camera.error||(mouseMode?'Move to create · mouse / touch':hands.error||(camera.status==='loading'?'Waiting for camera permission…':hands.status==='loading'?'Preparing the light…':camera.status!=='ready'?'Enter with camera. Raise your index finger.':hands.status==='drawing'||hands.status==='tracking'?'Move to create.':'Raise your index finger.'));
  const message=mode==='GLOW'?glowMessage:flowMessage;
  const enter=()=>{setPreview(false);camera.start();};
  const retryTracking=async()=>{camera.stop();await new Promise(resolve=>setTimeout(resolve,0));enter();};
  const selectMode=next=>{if(next===mode)return;setMode(next);setPreview(false);setMouseMode(false);setFlowError('');setQuiet(false);};
  return <main style={{'--light':mode==='GLOW'?color[1]:'#a855f7'}}>
    <video ref={camera.videoRef} className="camera-input" muted playsInline aria-hidden="true" />
    {mode==='GLOW'?<GlowMode maskRef={tracking.maskRef} color={color[1]} preview={preview}/>:<FlowMode handRef={hands.handRef} mouseMode={mouseMode} onFailure={setFlowError}/>}
    <div className="atmosphere" aria-hidden="true"/>
    <header><div><h1>LUMEN</h1><p>BODY / LIGHT / DIGITAL MATTER</p></div><span className="edition">AN INTERACTIVE EXPERIMENT<br/>{mode==='GLOW'?'01 — PRESENCE':'02 — CREATION'}</span></header>
    <nav aria-label="Artwork modes">{['GLOW','FLOW','SLASH','LAUNCH'].map((name,i)=><button key={name} disabled={i>1} onClick={()=>selectMode(name)} aria-label={i>1?`${name} — coming later`:name} aria-current={mode===name?'page':undefined}><span className="mode-number">0{i+1}</span>{name}{mode===name&&<span className="active-dot"/>}</button>)}</nav>
    {mode==='GLOW'&&!active&&!preview&&<section className="invitation"><span className="eyebrow">PRESENCE, TRANSLATED</span><h2>Become<br/><em>light.</em></h2><p>A gesture. A silhouette. A different kind of presence.</p><button className="enter" onClick={enter}>{camera.status==='error'?'Try camera again':'Enter with camera'}<span aria-hidden="true">↗</span></button><button className="preview-link" onClick={()=>setPreview(true)}>Preview light</button></section>}
    <div className={`live-caption ${mode==='FLOW'&&quiet&&!mouseMode&&!flowError?'quiet':''}`} role="status"><span className={`signal ${(mode==='GLOW'?tracking.status==='tracking':hands.status==='drawing'||hands.status==='tracking')?'detected':''}`}/>{message}{mode==='GLOW'&&tracking.status==='error'&&<button className="preview-link" onClick={retryTracking}>Retry body tracking</button>}{mode==='FLOW'&&hands.status==='error'&&!mouseMode&&<button className="preview-link" onClick={hands.retry}>Retry hand tracking</button>}</div>
    {mode==='GLOW'&&preview&&<div className="preview-label">Illustrated preview · camera off <button onClick={()=>setPreview(false)} aria-label="Close preview">×</button></div>}
    <footer>{mode==='GLOW'?<div className="color-picker"><span>EMISSION <b>{color[0]}</b></span><div role="group" aria-label="Glow color">{colors.map(entry=><button key={entry[0]} className="color" style={{'--swatch':entry[1]}} aria-label={entry[0]} aria-pressed={color[0]===entry[0]} onClick={()=>setColor(entry)}/>)}</div></div>:<div className="flow-controls"><span>LIGHT, IN MOTION</span><button onClick={()=>setMouseMode(value=>!value)}>{mouseMode?'Use index finger':'Use mouse / touch'}</button></div>}
      <div className="camera-controls">{active?<button onClick={camera.stop}>Stop camera</button>:preview||mode==='FLOW'?<button onClick={enter}>{camera.status==='error'?'Try camera again':'Enter with camera'} <span aria-hidden="true">↗</span></button>:<span>CAMERA PROCESSED ON YOUR DEVICE</span>}<button aria-label="Fullscreen" onClick={()=>{(document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.())?.catch(()=>{});}}>⛶</button></div>
    </footer>
  </main>;
}
