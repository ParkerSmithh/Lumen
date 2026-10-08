import {createFlowArcade} from '../game/flowArcade';
import {GameFeedback} from '../game/GameFeedback';
import {useRound} from '../game/useRound';
import {GameHUD} from '../game/GameHUD';
import {shapePath,createTraceEvaluator} from '../game/lightTrace';
﻿import { useEffect, useRef, useState } from 'react';
import SplashCursor from '../effects/SplashCursor';
import { predictHandPoint } from '../tracking/handPointer';
import { fitContain } from '../tracking/utils';
export function FlowMode({handRef,color,mouseMode,onFailure,onInteraction,cameraReady,videoRef,trackingError}) {
  const hostRef=useRef(null),pointerRef=useRef(null),lightRef=useRef(null),colorRef=useRef(color);colorRef.current=color;
  const guideRef=useRef(null),scores=useRef([]),targetRef=useRef(null);const [accuracy,setAccuracy]=useState(null);
  const [arcade]=useState(createFlowArcade),effectRef=useRef(null),feedbackRef=useRef(null),shapeSerial=useRef(0);
  const round=useRound({duration:90,mode:'FLOW',metrics:state=>({...arcade.snapshot(),accuracy:scores.current.length?scores.current.reduce((a,b)=>a+b,0)/scores.current.length:null,feedbackId:feedbackRef.current&&state.elapsed<feedbackRef.current.expiresAt?feedbackRef.current.id:null}),mouseMode,cameraReady,videoRef,trackingError,onReset:full=>{pointerRef.current=null;targetRef.current?.evaluator.sample(null);if(full){targetRef.current=null;scores.current=[];setAccuracy(null);arcade.reset();shapeSerial.current=0;effectRef.current=null;feedbackRef.current=null;}}});
  const interactionRef=useRef(onInteraction);interactionRef.current=onInteraction;
  useEffect(()=>{
    let raf,sequence=0,lastMouse=null;
    pointerRef.current=null;
    const host=hostRef.current,canvas=lightRef.current,ctx=canvas.getContext('2d');
    const trace=[];let lastSequence=null,lastEpoch=round.epoch.current;
    const guide=guideRef.current,gctx=guide.getContext('2d');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resize=()=>{const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(host.clientWidth*ratio);canvas.height=Math.round(host.clientHeight*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);trace.length=0;guide.width=canvas.width;guide.height=canvas.height;gctx?.setTransform(ratio,0,0,ratio,0,0);targetRef.current=null;};
    resize();const observer=new ResizeObserver(resize);observer.observe(host);
    const drawLight=time=>{
      if(!ctx)return;
      const pointer=pointerRef.current,w=host.clientWidth,h=host.clientHeight;
      ctx.clearRect(0,0,w,h);
      if(pointer?.active&&pointer.sequence!==lastSequence){
        if(pointer.reset||trace.at(-1)?.source!==pointer.source)trace.length=0;
        trace.push({...pointer});if(trace.length>8)trace.shift();lastSequence=pointer.sequence;
      }
      while(trace.length&&time-trace[0].timestamp>170)trace.shift();
      const color=colorRef.current;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.shadowColor=color;ctx.shadowBlur=reduced?8:16;
      for(let i=1;i<trace.length;i++){
        ctx.globalAlpha=Math.max(0,1-(time-trace[i].timestamp)/170)*.8;
        ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(trace[i-1].x*w,trace[i-1].y*h);ctx.lineTo(trace[i].x*w,trace[i].y*h);ctx.stroke();
      }
      if(pointer?.active&&time-pointer.timestamp<100){
        const x=pointer.x*w,y=pointer.y*h,alpha=Math.max(0,1-(time-pointer.timestamp)/100);
        const glow=ctx.createRadialGradient(x,y,0,x,y,19);glow.addColorStop(0,'#ffffff');glow.addColorStop(.16,color);glow.addColorStop(1,color+'00');
        const end=trace.at(-1);if(end){ctx.globalAlpha=alpha*.7;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(end.x*w,end.y*h);ctx.lineTo(x,y);ctx.stroke();}
        ctx.globalAlpha=alpha*.85;ctx.fillStyle=glow;ctx.fillRect(x-19,y-19,38,38);
      }
      ctx.globalAlpha=1;ctx.shadowBlur=0;
    };
    const mouse=event=>{
      if(!mouseMode||event.target.closest?.('button,nav,header,footer,.slash-game-overlay,.camera-invitation'))return;
      const rect=host.getBoundingClientRect(),time=performance.now();
      const x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
      const dt=lastMouse?(time-lastMouse.timestamp)/1000:0;
      if(lastMouse&&Math.hypot(x-lastMouse.x,y-lastMouse.y)>.002)interactionRef.current?.();
      pointerRef.current={active:true,x,y,source:'mouse',sequence:++sequence,timestamp:time,
        reset:!lastMouse||dt>.25,velocityX:dt>0?(x-lastMouse.x)/dt:0,velocityY:dt>0?(y-lastMouse.y)/dt:0};
      lastMouse=pointerRef.current;
    };
    const leave=()=>{lastMouse=null;pointerRef.current=null;};
    if(mouseMode){window.addEventListener('pointermove',mouse);window.addEventListener('pointerdown',mouse);window.addEventListener('blur',leave);document.addEventListener('pointerleave',leave);}
    const update=time=>{
      if(!mouseMode){
        const hand=handRef.current;
        if(!hand?.handDetected||time-hand.timestamp>250)pointerRef.current=null;
        else{
          const point=predictHandPoint(hand,time)||hand.indexFinger;
          const width=host.clientWidth,height=host.clientHeight;
          const rect=fitContain(hand.sourceWidth,hand.sourceHeight,width,height);
          pointerRef.current={x:(rect.x+point.x*rect.width)/width,y:(rect.y+point.y*rect.height)/height,
            active:true,source:'hand',reset:hand.reset,sequence:hand.sequence,timestamp:hand.timestamp,
            velocityX:hand.velocity.x*rect.width/width,velocityY:hand.velocity.y*rect.height/height};
        }
      }
      if(lastEpoch!==round.epoch.current){lastEpoch=round.epoch.current;pointerRef.current=null;lastMouse=null;lastSequence=null;trace.length=0;}
      const state=round.clock.tick(time),w=host.clientWidth,h=host.clientHeight;gctx?.clearRect(0,0,w,h);
      if(state.phase==='playing'&&!state.paused&&gctx){
        if(targetRef.current?.completedAt!=null&&state.elapsed>=targetRef.current.completedAt+.6)targetRef.current=null;
        if(!targetRef.current){const hand=handRef.current;const camera=mouseMode?{x:0,y:0,width:w,height:h}:fitContain(hand?.sourceWidth||4,hand?.sourceHeight||3,w,h);const left=Math.max(w*.16,camera.x+camera.width*.1),right=Math.min(w*.84,camera.x+camera.width*.9),top=Math.max(h*.3,camera.y+camera.height*.15),bottom=Math.min(h*.68,camera.y+camera.height*.85);const rect={x:left/w,y:top/h,width:(right-left)/w,height:(bottom-top)/h};const index=shapeSerial.current<8?shapeSerial.current:3+(shapeSerial.current-8)%5;const path=shapePath(index,rect,w,h);targetRef.current={id:shapeSerial.current,path,completedAt:null,evaluator:createTraceEvaluator(path,w,h),created:time};}
        const target=targetRef.current;gctx.strokeStyle=colorRef.current;gctx.shadowColor=colorRef.current;gctx.shadowBlur=8;gctx.lineWidth=1.5;gctx.globalAlpha=target.completedAt===null?.55+.1*Math.cos((time-target.created)/450):.9;gctx.beginPath();target.path.forEach((p,i)=>i?gctx.lineTo(p.x*w,p.y*h):gctx.moveTo(p.x*w,p.y*h));gctx.stroke();const start=target.path[0];gctx.globalAlpha=.9;gctx.beginPath();gctx.arc(start.x*w,start.y*h,4,0,Math.PI*2);gctx.stroke();gctx.shadowBlur=0;gctx.globalAlpha=1;
        const result=target.completedAt===null?target.evaluator.sample(pointerRef.current):{};if(result.newCompletion){round.hit(1,accepted=>{scores.current.push(result.accuracy);setAccuracy(scores.current.reduce((a,b)=>a+b,0)/scores.current.length);const award=arcade.complete(target.id,result.accuracy,accepted.elapsed);target.completedAt=accepted.elapsed;shapeSerial.current++;feedbackRef.current={id:target.id,label:award.quality,expiresAt:accepted.elapsed+1};if(!reduced)effectRef.current={points:target.path.filter((_,i)=>i%13===0),cursor:0,nextAt:time,paused:false};});}
      }
      if(effectRef.current)effectRef.current.paused=state.phase!=='playing'||state.paused;
      drawLight(time);raf=requestAnimationFrame(update);
    };
    if(import.meta.env.DEV&&new URLSearchParams(location.search).has('debugTrace'))window.__lumenTrace={target:()=>targetRef.current?.path,state:()=>round.clock.tick(performance.now())};
    raf=requestAnimationFrame(update);
    return()=>{if(import.meta.env.DEV)delete window.__lumenTrace;observer.disconnect();canvas.width=canvas.height=0;cancelAnimationFrame(raf);pointerRef.current=null;window.removeEventListener('pointermove',mouse);window.removeEventListener('pointerdown',mouse);window.removeEventListener('blur',leave);document.removeEventListener('pointerleave',leave);};
  },[handRef,mouseMode]);
  return <><div className={`artwork flow-artwork ${mouseMode?'':'hand-input'}`} ref={hostRef}>
    <SplashCursor effectRef={effectRef} pointerRef={pointerRef} onFailure={onFailure} SIM_RESOLUTION={128} DYE_RESOLUTION={512}
      DENSITY_DISSIPATION={.25} VELOCITY_DISSIPATION={2} PRESSURE={.1} CURL={3}
      SPLAT_RADIUS={.2} SPLAT_FORCE={6000} COLOR_UPDATE_SPEED={10} SHADING RAINBOW_MODE={false} COLOR={color} />
    <canvas ref={guideRef} className="flow-guide" aria-hidden="true"/><canvas ref={lightRef} className="flow-light" aria-hidden="true"/>
  </div><GameHUD round={round} title="LIGHT TRACE" introduction="Follow the light with your finger." label="SHAPES" accuracy={accuracy} onSkip={()=>{const state=round.clock.tick(performance.now()),target=targetRef.current;if(state.phase!=='playing'||state.paused||!target||target.completedAt!==null)return;arcade.skip(target.id,state.elapsed);shapeSerial.current++;targetRef.current=null;feedbackRef.current=null;effectRef.current=null;pointerRef.current=null;round.epoch.current++;round.refresh();}}/><div className="arcade-state">{round.display.phase==='playing'&&round.display.chain>0&&<span>CHAIN {round.display.chain}</span>}</div><GameFeedback label={feedbackRef.current?.label} active={round.display.phase==='playing'&&!round.display.paused&&round.display.feedbackId!=null}/></>;
}
