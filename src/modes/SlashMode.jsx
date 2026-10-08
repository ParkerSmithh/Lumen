import {createSlashArcade,slashArcadeDifficulty} from '../game/slashArcade';
import {personalBests} from '../game/personalBests';
import {awardRoundHit} from '../game/roundAward';
import { useEffect,useRef,useState } from 'react';
import { createSlashDetector,handEdge } from '../tracking/slashDetector';
import { createSlashFrameMotion } from '../tracking/slashFrameMotion';
import { fitContain } from '../tracking/utils';
import { createSlashScene } from '../effects/slashScene';
import { createSlashGame } from '../game/slashGame';
import { SlashHUD } from '../game/SlashHUD';

export function SlashMode({handRef,videoRef,color,mouseMode,cameraReady,onSlash,onFailure,onSessionStart,onStateChange}) {
  const [arcade]=useState(createSlashArcade);
  const [game]=useState(createSlashGame),[display,setDisplay]=useState(()=>game.tick(performance.now()));
  const actions=useRef(null);
  const [usableCamera,setUsableCamera]=useState(false);
  const canvasRef=useRef(null),settings=useRef({mouseMode,color,cameraReady,onSlash,onFailure,onSessionStart,onStateChange});settings.current={mouseMode,color,cameraReady,onSlash,onFailure,onSessionStart,onStateChange};
  useEffect(()=>{
    const canvas=canvasRef.current,ctx=canvas.getContext('2d');
    if(!ctx){settings.current.onFailure('SLASH needs Canvas rendering. Try another browser.');return;}
    const destroyed=[];let bestResult=null,finished=false,lastFeedback=null;
    const scene=createSlashScene(ctx,{arcade:true,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,onLifecycle:event=>{if(event.kind==='destroyed')destroyed.push(event);}}),detector=createSlashDetector(),motionDetector=createSlashDetector(),frameMotion=createSlashFrameMotion();
    const frameCanvas=document.createElement('canvas'),frameContext=frameCanvas.getContext('2d',{willReadFrequently:true});
    let lastVideoTime=-1,lastFrameTime=0,frameSequence=0,recognizedSegments=0;
    let raf,last=performance.now(),rect,width,height,mouse=null,pressed=false,sequence=0,mode=settings.current.mouseMode,sourceAspect=4/3;
    let displayKey='',lastCameraAvailability=null;
    const publish=base=>{let state={...base,...arcade.snapshot(base.elapsed),...slashArcadeDifficulty(base.progress)};if(state.phase==='results'&&!finished){finished=true;bestResult=personalBests.record('SLASH',{score:state.score,count:state.count},true);}if(state.phase==='results')Object.assign(state,bestResult);state.feedbackLabel=lastFeedback&&state.elapsed<lastFeedback.until?lastFeedback.label:null;

      const key=[state.phase,state.paused,state.pauseReason,state.seconds,state.countdown,state.count,state.score,state.combo,state.overload,state.feedbackLabel].join(':');
      if(key!==displayKey){displayKey=key;setDisplay(state);settings.current.onStateChange?.(state);}
    };
    const resize=()=>{
      width=canvas.clientWidth;height=canvas.clientHeight;
      const ratio=Math.min(devicePixelRatio||1,1.5,1280/width,900/height);
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
      const contained=fitContain(sourceAspect,1,width,height);
      // Keep spawn positions reachable and clear of the navigation/footer.
      rect={x:contained.x,y:contained.y+contained.height*.12,width:contained.width,height:contained.height*.76};
      scene.setSize(width,height,rect);detector.reset();motionDetector.reset();frameMotion.reset();
    };
    resize();const observer=new ResizeObserver(resize);observer.observe(canvas);
    const reset=()=>{pressed=false;mouse=null;detector.reset();motionDetector.reset();frameMotion.reset();lastVideoTime=-1;lastFrameTime=0;};
    const cameraUsable=()=>{const video=videoRef?.current;return !!(settings.current.cameraReady&&video&&video.readyState>=2&&!video.paused&&!video.ended);};
    const canPlay=()=>settings.current.mouseMode||cameraUsable();
    actions.current={
      start(){if(!canPlay()||document.hidden)return;const state=game.tick(performance.now());if(state.phase!=='ready'&&state.phase!=='results')return;reset();scene.reset();arcade.reset();finished=false;bestResult=null;lastFeedback=null;last=performance.now();publish(game.start(last));settings.current.onSessionStart?.();},
      resume(){if(!canPlay()||document.hidden)return;reset();last=performance.now();publish(game.resume(last));},
    };
    if(import.meta.env.DEV&&new URLSearchParams(location.search).has('debugSlash'))window.__lumenSlash={state:()=>({...game.tick(performance.now()),...arcade.snapshot(game.tick(performance.now()).elapsed),...slashArcadeDifficulty(game.tick(performance.now()).progress)}),inspect:scene.inspect,input:()=>({pressed,mouse,recognizedSegments})};
    const move=event=>{
      const state=game.tick(performance.now());
      if(!settings.current.mouseMode||!pressed||state.phase!=='playing'||state.paused)return;
      if(event.target.closest?.('button,nav,header,footer,.slash-game-overlay')){mouse=null;detector.reset();return;}
      const bounds=canvas.getBoundingClientRect(),x=(event.clientX-bounds.left)/width,y=(event.clientY-bounds.top)/height;
      mouse={active:true,center:{x,y},edge:[{x,y:y-.018},{x,y:y+.018}],aspect:width/height,timestamp:performance.now(),sequence:++sequence,source:'mouse'};
      if(event.pointerType==='touch')event.preventDefault();
    };
    const down=event=>{const state=game.tick(performance.now());if(!settings.current.mouseMode||state.phase!=='playing'||state.paused||event.target.closest?.('button,nav,header,footer,.slash-game-overlay'))return;event.preventDefault();pressed=true;detector.reset();move(event);};
    const visibility=()=>{last=performance.now();if(document.hidden){reset();publish(game.pause(last,'visibility'));}};
    window.addEventListener('pointerdown',down);window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',reset);window.addEventListener('pointercancel',reset);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',visibility);
    const draw=time=>{
      if(mode!==settings.current.mouseMode){mode=settings.current.mouseMode;reset();}
      const dt=(time-last)/1000;last=time;
      if(document.hidden){reset();raf=requestAnimationFrame(draw);return;}
      const available=cameraUsable();
      if(available!==lastCameraAvailability){lastCameraAvailability=available;setUsableCamera(available);}
      let state=game.tick(performance.now());
      if(!canPlay()&&(state.phase==='playing'||state.phase==='countdown')){state=game.pause(time,'camera');reset();}
      scene.setColor(settings.current.color);const difficulty=slashArcadeDifficulty(state.progress);scene.setCombo?.(arcade.snapshot(state.elapsed).combo);scene.setOverload?.(difficulty.overload);scene.update(dt,{...state,...difficulty});publish(state);
      if(state.phase!=='playing'||state.paused){reset();scene.draw();raf=requestAnimationFrame(draw);return;}
      const hand=handRef.current;
      let sample;
      if(mode)sample=mouse;
      else{
        sample=handEdge(hand);
        if(hand?.sourceWidth&&Math.abs(sourceAspect-hand.sourceWidth/hand.sourceHeight)>.001){sourceAspect=hand.sourceWidth/hand.sourceHeight;resize();}
      }
      let fallback=null;
      const video=videoRef?.current;
      if(!mode&&video&&!video.paused&&video.readyState>=2&&video.currentTime!==lastVideoTime&&time-lastFrameTime>=30&&frameContext){
        lastVideoTime=video.currentTime;lastFrameTime=time;
        const aspect=video.videoWidth/video.videoHeight;
        if(Math.abs(sourceAspect-aspect)>.001){sourceAspect=aspect;resize();}
        const h=128,w=Math.max(32,Math.round(h*aspect));
        if(frameCanvas.width!==w||frameCanvas.height!==h){frameCanvas.width=w;frameCanvas.height=h;frameMotion.reset();motionDetector.reset();}
        frameContext.drawImage(video,0,0,w,h);
        const packet=frameMotion.update(frameContext.getImageData(0,0,w,h).data,w,h,time,++frameSequence);
        fallback=motionDetector.update(packet,time);
      }else if(!mode&&(!video||video.paused||video.readyState<2)){frameMotion.reset();motionDetector.reset();}
      let slash=detector.update(sample,time)||fallback;

      recognizedSegments+=slash?1:0;
      if(import.meta.env.DEV&&hand)hand.slashDebug={recognizedSegments,source:slash?.source,speed:Math.hypot(hand.palmVelocity?.x||0,hand.palmVelocity?.y||0),threshold:.65,qualified:!!slash};
      if(slash){
        // Tracking occupies the whole contained camera frame; it is never stretched.
        const mapping=mode?{x:0,y:0,width,height}:fitContain(sourceAspect,1,width,height);
        const project=point=>({x:mapping.x+point.x*mapping.width,y:mapping.y+point.y*mapping.height});
        destroyed.length=0;
        const hit=scene.cut({...slash,start:project(slash.start),end:project(slash.end),edge:slash.edge.map(project),previousEdge:slash.previousEdge.map(project),path:slash.path?.map(node=>({center:project(node.center),edge:node.edge.map(project)}))});
        const now=performance.now();if(hit>0)awardRoundHit(game,now,hit,accepted=>{arcade.record(destroyed,accepted.elapsed);if(destroyed.some(event=>event.type==='bonus'))lastFeedback={label:'BONUS',until:accepted.elapsed+1};});scene.setCombo?.(arcade.snapshot(game.tick(now).elapsed).combo);publish(game.tick(now));
        settings.current.onSlash(hit>0);
      }
      scene.draw();raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('pointerdown',down);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',reset);window.removeEventListener('pointercancel',reset);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',visibility);reset();game.reset();actions.current=null;if(import.meta.env.DEV)delete window.__lumenSlash;frameCanvas.width=frameCanvas.height=0;scene.dispose();canvas.width=canvas.height=0;};
  },[handRef,videoRef,game,arcade]);
  return <><canvas ref={canvasRef} className={`artwork slash-artwork ${mouseMode?'':'hand-input'}`} aria-hidden="true"/><SlashHUD game={display} canPlay={mouseMode||(cameraReady&&usableCamera)} onStart={()=>actions.current?.start()} onResume={()=>actions.current?.resume()}/></>;
}
