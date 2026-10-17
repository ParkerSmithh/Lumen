import {useGameInstructions} from '../game/useGameInstructions';
import {freshBodyPose} from '../tracking/bodySignals.js';
import { useEffect, useRef } from 'react';
import { createGlowRenderer } from '../effects/glowRenderer';
import { createPresenceEcho } from '../echoes/presenceEcho.js';
import {useEnergyRush} from '../game/useEnergyRush.js';
import {EnergyRushHUD} from '../game/EnergyRushHUD.jsx';
import {drawEnergyRush} from '../effects/energyRushRenderer.js';
import {fitContain} from '../tracking/utils.js';

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
export function GlowMode({ intensity='NEON', maskRef, videoRef, cameraReady, color, preview, poseRef, echoSession,energyRush=false,onExitEnergy,onCamera,poseEnabled,onPoseToggle,poseStatus,instructionCamera,onChooseInput }) {
  const game=useEnergyRush({enabled:energyRush,cameraReady,preview,videoRef,echoSession,onExit:onExitEnergy,color});
  useEffect(()=>{if(energyRush)onChooseInput?.(game.inputMode);},[energyRush,game.inputMode]);
  const backFromInstructions=()=>{
    game.exit();
    // The launch control remounts after exiting; the dialog's original trigger
    // was removed when entering ENERGY RUSH, so restore focus after that commit.
    requestAnimationFrame(()=>document.querySelector('button.glow-play')?.focus({preventScroll:true}));
  };
  const instructions=useGameInstructions('ENERGY_RUSH',{echoSession,color,instructionCamera,assisted:game.inputMode==='assist',ready:game.inputMode==='assist'||cameraReady&&!preview&&game.grid.fresh(performance.now()),readiness:game.inputMode==='assist'?'Keyboard / touch ready':cameraReady&&!preview?'Waiting for fresh body tracking':'Enable camera or choose keyboard / touch',onCamera,onChooseInput:mode=>game.chooseInput(mode),start:game.start,back:backFromInstructions,running:!['READY','RESULTS'].includes(game.display.phase)});
  useEffect(()=>{if(energyRush&&instructions.first)instructions.show();},[energyRush]);
  const gameRef=useRef(game);gameRef.current=game;
  const hostRef = useRef(null); const settings = useRef({ color, preview, cameraReady,energyRush,intensity }); settings.current = { color, preview, cameraReady,energyRush,intensity };
  useEffect(() => {
    const host = hostRef.current;
    let canvas, renderer, raf, previousMask, opacity = 0,lastDraw=0,lastVideo=null,lastStream=null,lastPreview=null,lastCameraReady=null,bodyCenter={x:.5,y:.5};
    const illustrated = previewMask();
    const echoCanvas=document.createElement('canvas');echoCanvas.setAttribute('aria-hidden','true');echoCanvas.style.pointerEvents='none';
    const echoContext=echoCanvas.getContext('2d');
    const arenaCanvas=document.createElement('canvas');arenaCanvas.setAttribute('aria-hidden','true');arenaCanvas.style.pointerEvents='none';const arenaContext=arenaCanvas.getContext('2d');
    const unregister=echoSession?.registerMode('GLOW',()=>({playing:settings.current.energyRush?gameRef.current.engine.snapshot.phase==='PLAYING':settings.current.preview||!!(settings.current.cameraReady&&maskRef.current&&performance.now()-maskRef.current.timestamp<500),paused:settings.current.energyRush&&gameRef.current.engine.snapshot.phase==='PAUSED',blocked:false,point:bodyCenter,color:settings.current.color,autoAllowed:false}));
    const presence=createPresenceEcho({onPresence:(input,time)=>{echoSession?.beyond.bodyshift.sample('GLOW',{...input,pose:freshBodyPose(poseRef?.current,time)},time,input.color,(freshBodyPose(poseRef?.current,time)?poseRef.current.landmarks?.filter((p,i)=>[15,16].includes(i)&&p.visibility>=.7).map(p=>({x:1-p.x,y:p.y})):[])||[]);if(input.center)bodyCenter=input.center;if(!settings.current.energyRush||gameRef.current.engine.snapshot.phase==='PLAYING'&&gameRef.current.engine.snapshot.inputMode==='body')echoSession?.beyond.presence(input,time);},drawBeyond:(ctx,w,h,time,reduced)=>echoSession?.beyond.draw(ctx,w,h,time,'GLOW',reduced),emit:(event,epoch)=>{if(settings.current.energyRush)return;try{echoSession?.emit(event,epoch);}catch{/* Echoes are optional. */}}});
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
      arenaCanvas.width=echoCanvas.width;arenaCanvas.height=echoCanvas.height;
    };
    const lost = event => { event.preventDefault(); renderer.dispose(); mount(true); };
    const mount = fallback => {
      canvas?.removeEventListener('webglcontextlost', lost); canvas?.remove();
      canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden','true'); host.append(canvas);
      if (fallback) canvas.getContext('2d');
      try { renderer = createGlowRenderer(canvas); } catch { canvas.remove(); canvas = document.createElement('canvas'); canvas.getContext('2d'); host.append(canvas); renderer = createGlowRenderer(canvas); }
      canvas.addEventListener('webglcontextlost', lost); host.append(echoCanvas,arenaCanvas); resize();
    };
    mount(false);
    const renderFrame=input=>{try{renderer.draw(input);}catch{renderer.dispose();mount(true);renderer.draw(input);}};
    const observer = new ResizeObserver(resize); observer.observe(host.parentElement);
    let aspect=0;
    const draw = time => {
      if(echoSession?.gate.suspended){if(settings.current.energyRush)gameRef.current.frame(time,maskRef.current,poseRef?.current);presence.clear();echoContext?.clearRect(0,0,echoCanvas.width,echoCanvas.height);raf=requestAnimationFrame(draw);return;}
      const video=videoRef?.current;
      if(video?.videoWidth&&aspect!==video.videoWidth/video.videoHeight){aspect=video.videoWidth/video.videoHeight;resize();}
      if(video!==lastVideo||video?.srcObject!==lastStream||settings.current.preview!==lastPreview||settings.current.cameraReady!==lastCameraReady){previousMask=null;opacity=0;renderer.resetVisual?.();lastVideo=video;lastStream=video?.srcObject;lastPreview=settings.current.preview;lastCameraReady=settings.current.cameraReady;}
      const live = maskRef.current;
      const fresh = live && time - live.timestamp < 500;
      const gamePhase=gameRef.current.engine.snapshot.phase;
      if(!settings.current.energyRush)echoSession?.beyond.chaos.tick('GLOW',time,!!((settings.current.preview||fresh&&settings.current.cameraReady)&&!document.hidden));
      echoSession?.beyond.bodyshift.tick('GLOW',time,!!((settings.current.preview||fresh&&settings.current.cameraReady)&&!document.hidden&&(!settings.current.energyRush||['CALIBRATING','COUNTDOWN','PLAYING'].includes(gamePhase))));
      const mask = settings.current.preview ? illustrated : fresh ? live : null;
      if (mask) previousMask = mask;
      const dt=Math.min(100,Math.max(0,time-(lastDraw||time)));lastDraw=time;
      opacity += ((mask ? 1 : 0) - opacity) * (1-Math.exp(-dt/(mask?90:110)));
      if(!mask&&opacity<=.005)previousMask=null;
      const drive=echoSession?.beyond.bodyshift.snapshot('GLOW').overdrive?.active,fever=settings.current.energyRush&&gameRef.current.engine.snapshot.fever;renderFrame({intensity:settings.current.intensity,bodyAura:echoSession?.beyond.bodyshift.enabled?(reduced.matches?.35:({CALM:.4,WILD:1,MAX:1.35}[echoSession.beyond.chaos.preferenceIntensity()]||1)):0,energy:reduced.matches?1:drive||fever?1.9:echoSession?.beyond.chaos.snapshot('GLOW').surge?1.9:({CALM:.85,WILD:1.35,MAX:1.6}[echoSession?.beyond.chaos.preferenceIntensity()]||1),video: settings.current.cameraReady && !settings.current.preview ? video : null, mask: opacity > .005 ? previousMask : null, color: settings.current.color, time, reducedMotion: reduced.matches, opacity });
      if(echoContext&&echoSession){
        if(fresh&&settings.current.cameraReady&&!settings.current.preview){presence.sample(live,{time,color:settings.current.color,epoch:echoSession.store.epoch});presence.draw(echoContext,echoCanvas.width,echoCanvas.height,time,live,reduced.matches);}
        else{if(!settings.current.preview)echoSession.beyond.bodyshift.sample('GLOW',{valid:false},time,settings.current.color);echoSession.beyond.presence({valid:false},time);presence.clear();if(settings.current.preview)presence.draw(echoContext,echoCanvas.width,echoCanvas.height,time,illustrated,reduced.matches);else echoContext.clearRect(0,0,echoCanvas.width,echoCanvas.height);}
      }
      if(settings.current.energyRush){
        const body=echoSession?.beyond.bodyshift.snapshot('GLOW');
        const scene=gameRef.current.frame(time,settings.current.preview?null:live,{...body,timestamp:body?.poseTimestamp});
        const rect=fitContain(video?.videoWidth||live?.sourceWidth||640,video?.videoHeight||live?.sourceHeight||480,arenaCanvas.width,arenaCanvas.height);
        drawEnergyRush(arenaContext,arenaCanvas.width,arenaCanvas.height,scene,{color:settings.current.color,reduced:reduced.matches,intensity:echoSession?.beyond.chaos.preferenceIntensity(),budget:echoSession?.beyond.chaos.budget('GLOW',reduced.matches),rect});
      }else arenaContext?.clearRect(0,0,arenaCanvas.width,arenaCanvas.height);
      raf = requestAnimationFrame(draw);
    };
    const visibility=()=>{if(document.hidden){echoSession?.beyond.chaos.leave('GLOW');echoSession?.beyond.bodyshift.leave('GLOW');}};document.addEventListener('visibilitychange',visibility);
    raf = requestAnimationFrame(draw);
    return () => { document.removeEventListener('visibilitychange',visibility);cancelAnimationFrame(raf); unregister?.();unsubscribe?.(); presence.dispose(); echoCanvas.remove();arenaCanvas.remove(); observer.disconnect(); canvas.removeEventListener('webglcontextlost', lost); renderer.dispose(); canvas.remove(); };
  }, [maskRef, videoRef]);
  useEffect(()=>{
    if(!energyRush)return;
    const update=()=>{const host=hostRef.current;if(!host)return;const r=host.getBoundingClientRect();if(!r.width||!r.height)return;const regions=[...document.querySelectorAll('[data-energy-exclude],.lumen-chrome button,.lumen-chrome input')].filter(e=>e.getClientRects().length).map(e=>{const b=e.getBoundingClientRect();return {minX:(b.left-r.left)/r.width,maxX:(b.right-r.left)/r.width,minY:(b.top-r.top)/r.height,maxY:(b.bottom-r.top)/r.height};});gameRef.current.setExcluded(regions);};
    update();const timer=setInterval(update,250);window.addEventListener('resize',update);return()=>{clearInterval(timer);window.removeEventListener('resize',update);};
  },[energyRush]);
  useEffect(()=>{if(!import.meta.env.DEV||!new URLSearchParams(location.search).has('debugEnergy'))return;window.__lumenEnergy={snapshot:()=>gameRef.current.engine.snapshot};return()=>{delete window.__lumenEnergy;};},[]);
  return <><div className="glow-field"><div className="artwork glow-artwork" ref={hostRef} /></div>{energyRush&&<EnergyRushHUD instructions={instructions} game={{...game,start:instructions.start}} cameraReady={cameraReady} preview={preview} onCamera={onCamera} poseEnabled={poseEnabled} onPoseToggle={onPoseToggle} poseStatus={poseStatus}/>}</>;
}

