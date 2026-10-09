import {drawEchoMark} from '../echoes/echoComposition';
import {createLaunchArcade} from '../game/launchArcade';
import {GameFeedback} from '../game/GameFeedback';
import {useRound} from '../game/useRound';
import {GameHUD} from '../game/GameHUD';
import { useEffect,useRef,useState } from 'react';
import Ballpit from '../effects/Ballpit';
import { createPushDetector } from '../tracking/pushDetector';
import { createGrabDetector,grabFeatures,launchPointFeatures } from '../tracking/grabDetector';
import { fitContain } from '../tracking/utils';
import { mapLaunchPointer } from '../tracking/launchInput';

export function LaunchMode({handRef,color,mouseMode,onFailure,onInteraction,cameraReady,videoRef,trackingError,echoSession}) {
  const echoCanvas=useRef(null),forcePathsRef=useRef([]),launchInteraction=useRef({held:0}),lastLaunchAction=useRef(-Infinity),hitDetails=useRef(null);
  const hostRef=useRef(null),pointerRef=useRef(null),colorRef=useRef(color);colorRef.current=color;
  const [arcade]=useState(createLaunchArcade),feedbackRef=useRef(null),feedbackSerial=useRef(0);
  const round=useRound({echoSession,duration:120,mode:'LAUNCH',metrics:state=>({...arcade.snapshot(),feedbackId:feedbackRef.current&&state.elapsed<feedbackRef.current.until?feedbackRef.current.id:null}),onReset:full=>{if(full){arcade.reset();feedbackRef.current=null;}},mouseMode,cameraReady,videoRef,trackingError});const gameRef=useRef(null);gameRef.current={echoSession,publishInteraction:state=>{launchInteraction.current=state;},observedAction:()=>{lastLaunchAction.current=performance.now();},hitDetails:event=>hitDetails.current?.id===event.id?hitDetails.current:null,pendingForce:paths=>{forcePathsRef.current=paths;},session:round.session.current,state:()=>round.clock.tick(performance.now()),hit:event=>round.hit(1,accepted=>{const reward=arcade.hit(event,accepted.elapsed);hitDetails.current={id:event.id,bank:!!reward.label?.startsWith("BANK")};if(reward.label)feedbackRef.current={id:++feedbackSerial.current,label:reward.label.startsWith('BANK')?'BANK SHOT':'BONUS',anchor:event.anchor,until:accepted.elapsed+1};}),created:slot=>{lastLaunchAction.current=performance.now();return arcade.created(slot);},grabbed:slot=>{lastLaunchAction.current=performance.now();return arcade.grabbed(slot);},wallBounce:slot=>arcade.wallBounce(slot,round.clock.tick(performance.now()).elapsed),notify:(label,anchor)=>{feedbackRef.current={id:++feedbackSerial.current,label,anchor,until:round.clock.tick(performance.now()).elapsed+1};round.refresh();},color:()=>colorRef.current,reach:()=>{const h=handRef.current,w=hostRef.current?.clientWidth||1,hg=hostRef.current?.clientHeight||1,r=fitContain(h?.sourceWidth||4,h?.sourceHeight||3,w,hg);return {x:(r.x+r.width*.16)/w,y:(r.y+r.height*.30)/hg,width:r.width*.68/w,height:r.height*.40/hg};}};
  useEffect(()=>echoSession?.registerMode('LAUNCH',()=>{const state=round.clock.tick(performance.now()),p=pointerRef.current;return {playing:state.phase==='playing',paused:state.paused,blocked:launchInteraction.current.held>0||!!p?.grab?.active||!!p?.grab?.released||!!(p?.creation&&!p.creation.consumed)||performance.now()-lastLaunchAction.current<1500,point:p||{x:.5,y:.5},color:colorRef.current,autoAllowed:false};}),[echoSession,round.clock]);
  const reduced=useRef(matchMedia('(prefers-reduced-motion: reduce)').matches).current;
  useEffect(()=>{
    let raf,sequence=0,pendingCreation=null,lastHandSequence=null,lastEpoch=round.epoch.current,dragging=false,grabPacket=null;
    const push=createPushDetector(),grab=createGrabDetector(),host=hostRef.current;pointerRef.current=null;
    const reset=()=>{forcePathsRef.current=[];pointerRef.current=null;pendingCreation=null;lastHandSequence=null;dragging=false;grabPacket=null;push.reset();grab.reset();};
    const retainCreation=()=>{if(pendingCreation?.consumed)pendingCreation=null;return pendingCreation;};
    const mouse=event=>{
      if(echoSession?.gate.suspended)return;
      if(!mouseMode)return;
      if(event.target.closest?.('button,nav,header,footer,.slash-game-overlay,.camera-invitation'))return;
      const state=round.clock.tick(performance.now());if(state.phase!=='playing'||state.paused)return;
      const rect=host.getBoundingClientRect(),time=performance.now();
      const pointer={active:true,x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height,timestamp:time,sequence:++sequence,source:'mouse',aspect:rect.width/rect.height,reset:event.type==='pointerdown'||!pointerRef.current};
      retainCreation();
      if(event.type==='pointerdown'){dragging=true;grabPacket={begin:true};}
      if(event.type==='pointerdown'&&!pendingCreation)pendingCreation={x:pointer.x,y:pointer.y,color:colorRef.current,timestamp:time,consumed:false};
      pointerRef.current={...pointer,creation:pendingCreation,suppressForce:event.type==='pointerdown',mouseGrab:dragging?grabPacket:null};
      if(event.pointerType==='touch')event.preventDefault();
    };
    // A quick tap can finish before rendering. Keep its creation until acknowledged.
    const release=()=>{
      if(dragging&&pointerRef.current){dragging=false;retainCreation();pointerRef.current={...pointerRef.current,sequence:++sequence,timestamp:performance.now(),creation:pendingCreation,mouseGrab:{...grabPacket,released:true},releaseAfterCreation:!!pendingCreation};return;}
      retainCreation();
      if(!pendingCreation){pointerRef.current=null;return;}
      pointerRef.current={...pointerRef.current,x:pendingCreation.x,y:pendingCreation.y,creation:pendingCreation,reset:true,releaseAfterCreation:true};
    };
    const visibility=()=>{if(document.hidden)reset();};
    if(mouseMode){window.addEventListener('pointermove',mouse,{passive:false});window.addEventListener('pointerdown',mouse);window.addEventListener('pointerup',release);document.addEventListener('pointerleave',reset);window.addEventListener('pointercancel',reset);window.addEventListener('blur',reset);}
    document.addEventListener('visibilitychange',visibility);
    const tick=time=>{
      if(echoSession?.gate.suspended){reset();raf=requestAnimationFrame(tick);return;}
      if(lastEpoch!==round.epoch.current){lastEpoch=round.epoch.current;reset();dragging=false;}
      const state=round.clock.tick(time);if(state.phase!=='playing'||state.paused){reset();const c=echoCanvas.current;c?.getContext('2d')?.clearRect(0,0,c.width,c.height);raf=requestAnimationFrame(tick);return;}
      const canvas=echoCanvas.current,ctx=canvas?.getContext('2d');if(ctx){const scale=Math.min(1,1280/host.clientWidth,900/host.clientHeight),w=Math.max(1,Math.round(host.clientWidth*scale)),h=Math.max(1,Math.round(host.clientHeight*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.clearRect(0,0,w,h);echoSession?.draw(ctx,w,h,time,'LAUNCH',reduced);echoSession?.beyond.draw(ctx,w,h,time,'LAUNCH',reduced);for(const path of forcePathsRef.current)try{drawEchoMark(ctx,path,w,h,.25);}catch{/* Optional light. */}}
      retainCreation();
      if(mouseMode){if(dragging&&pointerRef.current)pointerRef.current.timestamp=time; if(pointerRef.current?.releaseAfterCreation&&!pendingCreation)pointerRef.current=null;}
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
  return <><div className={`artwork launch-artwork ${mouseMode?'':'hand-input'}`} ref={hostRef}>
    <Ballpit gameRef={gameRef} creationColor={color} pointerRef={pointerRef} onFailure={onFailure} onInteraction={onInteraction} followCursor={false} count={201} maxActive={150} interactiveCreation
      gravity={reduced?.004:.01} friction={.9975} wallBounce={.95} maxVelocity={reduced?.075:.15}
      minSize={.25} maxSize={.55} size0={.85} maxZ={3} controllerForce={.35} controllerResponse={40} reducedMotion={reduced}
      colors={[0xffffff,0xffffff]} ambientColor={0xffffff} ambientIntensity={.65} lightIntensity={130}
      materialParams={{metalness:.55,roughness:.24,clearcoat:1,clearcoatRoughness:.12,emissive:0x080808,emissiveIntensity:.5,envMapIntensity:1.1}}/>
  </div><canvas ref={echoCanvas} className="echo-layer" aria-hidden="true"/><GameHUD round={round} title="KINETIC" introduction="Create and throw digital matter into the target." label="TARGETS HIT"/><GameFeedback label={feedbackRef.current?.label} anchor={feedbackRef.current?.anchor} active={round.display.phase==='playing'&&!round.display.paused&&round.display.feedbackId!=null}/></>;
}
