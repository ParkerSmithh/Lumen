import { useEffect, useRef } from 'react';
import SplashCursor from '../effects/SplashCursor';
import { fitContain } from '../tracking/utils';
export function FlowMode({handRef,mouseMode,onFailure}) {
  const hostRef=useRef(null),pointerRef=useRef(null);
  useEffect(()=>{
    let raf,sequence=0,lastMouse=null;
    pointerRef.current=null;
    const host=hostRef.current;
    const mouse=event=>{
      if(!mouseMode||event.target.closest?.('button,nav,header,footer'))return;
      const rect=host.getBoundingClientRect(),time=performance.now();
      const x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
      const dt=lastMouse?(time-lastMouse.timestamp)/1000:0;
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
          const width=host.clientWidth,height=host.clientHeight;
          const rect=fitContain(hand.sourceWidth,hand.sourceHeight,width,height);
          pointerRef.current={x:(rect.x+hand.indexFinger.x*rect.width)/width,y:(rect.y+hand.indexFinger.y*rect.height)/height,
            active:true,source:'hand',reset:hand.reset,sequence:hand.sequence,timestamp:hand.timestamp,
            velocityX:hand.velocity.x*rect.width/width,velocityY:hand.velocity.y*rect.height/height};
        }
      }
      raf=requestAnimationFrame(update);
    };
    raf=requestAnimationFrame(update);
    return()=>{cancelAnimationFrame(raf);pointerRef.current=null;window.removeEventListener('pointermove',mouse);window.removeEventListener('pointerdown',mouse);window.removeEventListener('blur',leave);document.removeEventListener('pointerleave',leave);};
  },[handRef,mouseMode]);
  return <div className={`artwork flow-artwork ${mouseMode?'':'hand-input'}`} ref={hostRef}>
    <SplashCursor pointerRef={pointerRef} onFailure={onFailure} SIM_RESOLUTION={128} DYE_RESOLUTION={512}
      DENSITY_DISSIPATION={3.5} VELOCITY_DISSIPATION={2} PRESSURE={.1} CURL={3}
      SPLAT_RADIUS={.2} SPLAT_FORCE={6000} COLOR_UPDATE_SPEED={10} SHADING RAINBOW_MODE={false} COLOR="#A855F7" />
  </div>;
}
