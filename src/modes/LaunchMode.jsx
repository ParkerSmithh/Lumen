import { useEffect,useRef } from 'react';
import Ballpit from '../effects/Ballpit';
import { mapLaunchPointer } from '../tracking/launchInput';

export function LaunchMode({handRef,mouseMode,onFailure,onInteraction}) {
  const hostRef=useRef(null),pointerRef=useRef(null);
  const reduced=useRef(matchMedia('(prefers-reduced-motion: reduce)').matches).current;
  const count=useRef(innerWidth<700?120:200).current;
  useEffect(()=>{
    let raf,sequence=0;
    pointerRef.current=null;
    const host=hostRef.current;
    const reset=()=>{pointerRef.current=null;};
    const mouse=event=>{
      if(!mouseMode)return;
      if(event.target.closest?.('button,nav,header,footer')){reset();return;}
      const rect=host.getBoundingClientRect();
      pointerRef.current={active:true,x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height,
        timestamp:performance.now(),sequence:++sequence,source:'mouse',aspect:rect.width/rect.height,reset:event.type==='pointerdown'||!pointerRef.current};
      if(event.pointerType==='touch')event.preventDefault();
    };
    const visibility=()=>{if(document.hidden)reset();};
    if(mouseMode){window.addEventListener('pointermove',mouse,{passive:false});window.addEventListener('pointerdown',mouse);window.addEventListener('pointerup',reset);document.addEventListener('pointerleave',reset);window.addEventListener('pointercancel',reset);window.addEventListener('blur',reset);}
    document.addEventListener('visibilitychange',visibility);
    const tick=time=>{
      if(!mouseMode){
        const hand=handRef.current;
        pointerRef.current=!document.hidden&&hand&&time-hand.timestamp<250?mapLaunchPointer(hand,host.clientWidth,host.clientHeight):null;
      }
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(raf);reset();window.removeEventListener('pointermove',mouse);window.removeEventListener('pointerdown',mouse);window.removeEventListener('pointerup',reset);document.removeEventListener('pointerleave',reset);window.removeEventListener('pointercancel',reset);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',visibility);};
  },[handRef,mouseMode]);
  return <div className={`artwork launch-artwork ${mouseMode?'':'hand-input'}`} ref={hostRef}>
    <Ballpit pointerRef={pointerRef} onFailure={onFailure} onInteraction={onInteraction} followCursor={false} count={count}
      gravity={reduced?.004:.01} friction={.9975} wallBounce={.95} maxVelocity={reduced?.075:.15}
      minSize={.25} maxSize={.55} size0={.85} maxZ={3} controllerForce={.35} reducedMotion={reduced}
      colors={[0x38206b,0x7160b1,0xb7a9e1,0x514caf]} ambientColor={0xb5a6df} ambientIntensity={.65} lightIntensity={130}
      materialParams={{metalness:.55,roughness:.24,clearcoat:1,clearcoatRoughness:.12,emissive:0x100721,emissiveIntensity:.5,envMapIntensity:1.1}}/>
  </div>;
}
