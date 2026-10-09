import { useEffect, useRef } from 'react';
import { createGlowRenderer } from '../effects/glowRenderer';
import { createPresenceEcho } from '../echoes/presenceEcho.js';

function previewMask() {
  const c = document.createElement('canvas'); c.width = 320; c.height = 400;
  const ctx = c.getContext('2d'); ctx.fillStyle = 'white'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(160, 65, 19, 25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 19;
  for (const points of [[[145,112],[125,151],[96,132],[79,91]], [[175,112],[199,145],[224,120],[235,84]], [[148,218],[143,278],[130,350]], [[172,218],[180,279],[194,350]]]) {
    ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(143,100); ctx.quadraticCurveTo(160,91,178,100); ctx.quadraticCurveTo(191,152,178,224); ctx.lineTo(141,224); ctx.quadraticCurveTo(130,157,143,100); ctx.fill();
  const pixels = ctx.getImageData(0,0,320,400).data;
  return { width: 320, height: 400, sourceWidth: 640, sourceHeight: 800, values: Float32Array.from({ length: 320*400 }, (_,i) => pixels[i*4+3]/255), timestamp: Infinity };
}
export function GlowMode({ maskRef, videoRef, cameraReady, color, preview, echoSession }) {
  const hostRef = useRef(null); const settings = useRef({ color, preview, cameraReady }); settings.current = { color, preview, cameraReady };
  useEffect(() => {
    const host = hostRef.current;
    let canvas, renderer, raf, previousMask, opacity = 0,bodyCenter={x:.5,y:.5};
    const illustrated = previewMask();
    const echoCanvas=document.createElement('canvas');echoCanvas.setAttribute('aria-hidden','true');echoCanvas.style.pointerEvents='none';
    const echoContext=echoCanvas.getContext('2d');
    const unregister=echoSession?.registerMode('GLOW',()=>({playing:settings.current.preview||!!(settings.current.cameraReady&&maskRef.current&&performance.now()-maskRef.current.timestamp<500),paused:false,blocked:false,point:bodyCenter,color:settings.current.color,autoAllowed:false}));
    const presence=createPresenceEcho({onPresence:(input,time)=>{if(input.center)bodyCenter=input.center;echoSession?.beyond.presence(input,time);},drawBeyond:(ctx,w,h,time,reduced)=>echoSession?.beyond.draw(ctx,w,h,time,'GLOW',reduced),emit:(event,epoch)=>{try{echoSession?.emit(event,epoch);}catch{/* Echoes are optional. */}}});
    let echoEpoch=echoSession?.store.epoch;
    const unsubscribe=echoSession?.store.subscribe(()=>{if(echoEpoch!==echoSession.store.epoch){echoEpoch=echoSession.store.epoch;presence.clear();echoContext?.clearRect(0,0,echoCanvas.width,echoCanvas.height);}});
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const resize = () => {
      const video=videoRef?.current,aspect=video?.videoWidth/video?.videoHeight||4/3;
      const box=host.parentElement.getBoundingClientRect(),width=Math.min(box.width,box.height*aspect);
      host.style.width=width+'px';host.style.height=width/aspect+'px';
      const scale = Math.min(devicePixelRatio, 1.5, 1280 / host.clientWidth, 900 / host.clientHeight);
      renderer.resize(Math.round(host.clientWidth * scale), Math.round(host.clientHeight * scale));
      const echoScale=Math.min(1,640/host.clientWidth,480/host.clientHeight);
      echoCanvas.width=Math.max(1,Math.round(host.clientWidth*echoScale));echoCanvas.height=Math.max(1,Math.round(host.clientHeight*echoScale));presence.clear();
    };
    const lost = event => { event.preventDefault(); renderer.dispose(); mount(true); };
    const mount = fallback => {
      canvas?.removeEventListener('webglcontextlost', lost); canvas?.remove();
      canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden','true'); host.append(canvas);
      if (fallback) canvas.getContext('2d');
      try { renderer = createGlowRenderer(canvas); } catch { canvas.remove(); canvas = document.createElement('canvas'); canvas.getContext('2d'); host.append(canvas); renderer = createGlowRenderer(canvas); }
      canvas.addEventListener('webglcontextlost', lost); host.append(echoCanvas); resize();
    };
    mount(false);
    const observer = new ResizeObserver(resize); observer.observe(host.parentElement);
    let aspect=0;
    const draw = time => {
      if(echoSession?.gate.suspended){presence.clear();echoContext?.clearRect(0,0,echoCanvas.width,echoCanvas.height);raf=requestAnimationFrame(draw);return;}
      const video=videoRef?.current;
      if(video?.videoWidth&&aspect!==video.videoWidth/video.videoHeight){aspect=video.videoWidth/video.videoHeight;resize();}
      const live = maskRef.current;
      const fresh = live && time - live.timestamp < 500;
      echoSession?.beyond.chaos.tick('GLOW',time,!!(fresh&&settings.current.cameraReady&&!settings.current.preview&&!document.hidden));
      const mask = settings.current.preview ? illustrated : fresh ? live : null;
      if (mask) previousMask = mask;
      opacity += ((mask ? 1 : 0) - opacity) * .12;
      renderer.draw({ energy:reduced.matches?1:echoSession?.beyond.chaos.snapshot('GLOW').surge?1.9:({CALM:.85,WILD:1.35,MAX:1.6}[echoSession?.beyond.chaos.preferenceIntensity()]||1),video: settings.current.cameraReady && !settings.current.preview ? video : null, mask: opacity > .005 ? previousMask : null, color: settings.current.color, time, reducedMotion: reduced.matches, opacity });
      if(echoContext&&echoSession){
        if(fresh&&settings.current.cameraReady&&!settings.current.preview){presence.sample(live,{time,color:settings.current.color,epoch:echoSession.store.epoch});presence.draw(echoContext,echoCanvas.width,echoCanvas.height,time,live,reduced.matches);}
        else{echoSession.beyond.presence({valid:false},time);presence.clear();if(settings.current.preview)presence.draw(echoContext,echoCanvas.width,echoCanvas.height,time,illustrated,reduced.matches);else echoContext.clearRect(0,0,echoCanvas.width,echoCanvas.height);}
      }
      raf = requestAnimationFrame(draw);
    };
    const visibility=()=>{if(document.hidden)echoSession?.beyond.chaos.leave('GLOW');};document.addEventListener('visibilitychange',visibility);
    raf = requestAnimationFrame(draw);
    return () => { document.removeEventListener('visibilitychange',visibility);cancelAnimationFrame(raf); unregister?.();unsubscribe?.(); presence.dispose(); echoCanvas.remove(); observer.disconnect(); canvas.removeEventListener('webglcontextlost', lost); renderer.dispose(); canvas.remove(); };
  }, [maskRef, videoRef]);
  return <div className="glow-field"><div className="artwork glow-artwork" ref={hostRef} /></div>;
}
