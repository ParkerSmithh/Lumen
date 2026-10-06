import { useEffect,useRef } from 'react';
import Ballpit from '../effects/Ballpit';
import { createPushDetector } from '../tracking/pushDetector';
import { createGrabDetector,grabFeatures,launchPointFeatures } from '../tracking/grabDetector';
import { fitContain } from '../tracking/utils';
import { mapLaunchPointer } from '../tracking/launchInput';

export function LaunchMode({handRef,color,mouseMode,onFailure,onInteraction}) {
  const hostRef=useRef(null),pointerRef=useRef(null),colorRef=useRef(color);colorRef.current=color;
  const reduced=useRef(matchMedia('(prefers-reduced-motion: reduce)').matches).current;
  useEffect(()=>{
    let raf,sequence=0,pendingCreation=null,lastHandSequence=null;
    const push=createPushDetector(),grab=createGrabDetector(),host=hostRef.current;pointerRef.current=null;
    const reset=()=>{pointerRef.current=null;pendingCreation=null;lastHandSequence=null;push.reset();grab.reset();};
    const retainCreation=()=>{if(pendingCreation?.consumed)pendingCreation=null;return pendingCreation;};
    const mouse=event=>{
      if(!mouseMode)return;
      if(event.target.closest?.('button,nav,header,footer'))return;
      const rect=host.getBoundingClientRect(),time=performance.now();
      const pointer={active:true,x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height,timestamp:time,sequence:++sequence,source:'mouse',aspect:rect.width/rect.height,reset:event.type==='pointerdown'||!pointerRef.current};
      retainCreation();
      if(event.type==='pointerdown'&&!pendingCreation)pendingCreation={x:pointer.x,y:pointer.y,color:colorRef.current,timestamp:time,consumed:false};
      pointerRef.current={...pointer,creation:pendingCreation,suppressForce:event.type==='pointerdown'};
      if(event.pointerType==='touch')event.preventDefault();
    };
    // A quick tap can finish before rendering. Keep its creation until acknowledged.
    const release=()=>{
      retainCreation();
      if(!pendingCreation){pointerRef.current=null;return;}
      pointerRef.current={...pointerRef.current,x:pendingCreation.x,y:pendingCreation.y,creation:pendingCreation,reset:true,releaseAfterCreation:true};
    };
    const visibility=()=>{if(document.hidden)reset();};
    if(mouseMode){window.addEventListener('pointermove',mouse,{passive:false});window.addEventListener('pointerdown',mouse);window.addEventListener('pointerup',release);document.addEventListener('pointerleave',reset);window.addEventListener('pointercancel',reset);window.addEventListener('blur',reset);}
    document.addEventListener('visibilitychange',visibility);
    const tick=time=>{
      retainCreation();
      if(mouseMode){if(pointerRef.current?.releaseAfterCreation&&!pendingCreation)pointerRef.current=null;}
      else{
        const hand=handRef.current;
        const pointer=!document.hidden&&hand&&time-hand.timestamp<250?mapLaunchPointer(hand,host.clientWidth,host.clientHeight,time):null;
        if(!pointer){reset();}
        else if(lastHandSequence!==pointer.sequence){
          lastHandSequence=pointer.sequence;
          const held=grab.update({...pointer,features:grabFeatures(hand)},time);
          if(held.blocksCreation)push.reset();
          const gesture=held.blocksCreation?{spawn:false,suppressForce:true,state:'GRABBING'}:push.update({...pointer,features:launchPointFeatures(hand)},time);
          const rect=fitContain(hand.sourceWidth,hand.sourceHeight,host.clientWidth,host.clientHeight);
          const grabPoint=held.center?{x:(rect.x+held.center.x*rect.width)/host.clientWidth,y:(rect.y+held.center.y*rect.height)/host.clientHeight}:pointer;
          if(import.meta.env.DEV){hand.pushDebug=gesture;hand.grabDebug=held;}
          if(gesture.spawn){
            const rawTip=(hand.rawLandmarks||hand.landmarks)?.[8],rect=fitContain(hand.sourceWidth,hand.sourceHeight,host.clientWidth,host.clientHeight);
            const x=rawTip?(rect.x+(1-rawTip.x)*rect.width)/host.clientWidth:pointer.x,y=rawTip?(rect.y+rawTip.y*rect.height)/host.clientHeight:pointer.y;
            pendingCreation={x,y,strength:gesture.strength,color:colorRef.current,timestamp:pointer.timestamp,consumed:false};
          }
          pointerRef.current={...pointer,...(held.active||held.released?grabPoint:{}),grab:held,creation:held.blocksCreation?null:pendingCreation,suppressForce:gesture.suppressForce};
        }
      }
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(raf);reset();window.removeEventListener('pointermove',mouse);window.removeEventListener('pointerdown',mouse);window.removeEventListener('pointerup',release);document.removeEventListener('pointerleave',reset);window.removeEventListener('pointercancel',reset);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',visibility);};
  },[handRef,mouseMode]);
  return <div className={`artwork launch-artwork ${mouseMode?'':'hand-input'}`} ref={hostRef}>
    <Ballpit creationColor={color} pointerRef={pointerRef} onFailure={onFailure} onInteraction={onInteraction} followCursor={false} count={201} maxActive={150} interactiveCreation
      gravity={reduced?.004:.01} friction={.9975} wallBounce={.95} maxVelocity={reduced?.075:.15}
      minSize={.25} maxSize={.55} size0={.85} maxZ={3} controllerForce={.35} controllerResponse={40} reducedMotion={reduced}
      colors={[0xffffff,0xffffff]} ambientColor={0xffffff} ambientIntensity={.65} lightIntensity={130}
      materialParams={{metalness:.55,roughness:.24,clearcoat:1,clearcoatRoughness:.12,emissive:0x080808,emissiveIntensity:.5,envMapIntensity:1.1}}/>
  </div>;
}
