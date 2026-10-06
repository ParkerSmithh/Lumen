import { useEffect, useRef } from 'react';
import SplashCursor from '../effects/SplashCursor';
import { predictHandPoint } from '../tracking/handPointer';
import { fitContain } from '../tracking/utils';
export function FlowMode({handRef,color,mouseMode,onFailure,onInteraction}) {
  const hostRef=useRef(null),pointerRef=useRef(null),lightRef=useRef(null),colorRef=useRef(color);colorRef.current=color;
  const interactionRef=useRef(onInteraction);interactionRef.current=onInteraction;
  useEffect(()=>{
    let raf,sequence=0,lastMouse=null;
    pointerRef.current=null;
    const host=hostRef.current,canvas=lightRef.current,ctx=canvas.getContext('2d');
    const trace=[];let lastSequence=null;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resize=()=>{const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(host.clientWidth*ratio);canvas.height=Math.round(host.clientHeight*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);trace.length=0;};
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
      if(!mouseMode||event.target.closest?.('button,nav,header,footer'))return;
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
      drawLight(time);raf=requestAnimationFrame(update);
    };
    raf=requestAnimationFrame(update);
    return()=>{observer.disconnect();canvas.width=canvas.height=0;cancelAnimationFrame(raf);pointerRef.current=null;window.removeEventListener('pointermove',mouse);window.removeEventListener('pointerdown',mouse);window.removeEventListener('blur',leave);document.removeEventListener('pointerleave',leave);};
  },[handRef,mouseMode]);
  return <div className={`artwork flow-artwork ${mouseMode?'':'hand-input'}`} ref={hostRef}>
    <SplashCursor pointerRef={pointerRef} onFailure={onFailure} SIM_RESOLUTION={128} DYE_RESOLUTION={512}
      DENSITY_DISSIPATION={.25} VELOCITY_DISSIPATION={2} PRESSURE={.1} CURL={3}
      SPLAT_RADIUS={.2} SPLAT_FORCE={6000} COLOR_UPDATE_SPEED={10} SHADING RAINBOW_MODE={false} COLOR={color} />
    <canvas ref={lightRef} className="flow-light" aria-hidden="true"/>
  </div>;
}
