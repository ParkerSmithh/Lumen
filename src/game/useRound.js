import {useGameInstructions} from './useGameInstructions';
import {awardRoundHit} from './roundAward';
import {useEffect,useRef,useState} from 'react';
import {createRoundClock} from './roundClock';
import {personalBests} from './personalBests';
import {inputReady} from './inputReadiness';
export function useRound({duration,mode,metrics,mouseMode,cameraReady,videoRef,trackingError,onReset,echoSession,color,onCamera,onChooseInput,instructionCamera}) {
 const [clock]=useState(()=>createRoundClock(duration));
 const stateRef=useRef(clock.tick(0)),epoch=useRef(0),session=useRef(0),finished=useRef(-1);
 const [display,setDisplay]=useState(stateRef.current),settings=useRef(null);
 settings.current={mode,metrics,mouseMode,cameraReady,videoRef,trackingError,onReset,instructionCamera};
 useEffect(()=>echoSession?.gate.subscribe(open=>{if(open){epoch.current++;settings.current.onReset?.(false);publish(clock.pause(performance.now(),"echoes"));}}),[clock,echoSession]);
 const available=()=>{const s=settings.current;return inputReady({assisted:s.mouseMode,cameraReady:s.cameraReady,video:s.videoRef?.current,trackingStatus:s.instructionCamera?.trackingStatus,trackingError:s.trackingError});};
 const publish=base=>{const s=settings.current,extra=s.metrics?.(base)||{score:base.count*100};let state={...base,...extra};
  if(base.phase==='results'&&session.current>0&&finished.current!==session.current){finished.current=session.current;state={...state,...personalBests.record(s.mode,{score:state.score,count:base.count,accuracy:state.accuracy},true)};}
  else if(base.phase==='results')state={...state,bests:stateRef.current.bests,newBest:stateRef.current.newBest};
  const old=stateRef.current;stateRef.current=state;if(['phase','paused','seconds','countdown','count','pauseReason','score','chain','combo','feedbackId','newBest'].some(k=>old[k]!==state[k]))setDisplay(state);
 };
 const pause=(reason='user')=>{epoch.current++;settings.current.onReset?.(false);publish(clock.pause(performance.now(),reason));};
 useEffect(()=>{let raf;const pause=reason=>{echoSession?.beyond.chaos.leave(settings.current.mode);echoSession?.beyond.bodyshift.leave(settings.current.mode);epoch.current++;settings.current.onReset?.(false);publish(clock.pause(performance.now(),reason));};const visibility=()=>{if(document.hidden)pause('visibility');};const blur=()=>pause('focus');const key=e=>{if(e.key==='Escape'&&!echoSession?.gate.suspended){e.preventDefault();pause('user');}};window.addEventListener('blur',blur);document.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);const tick=now=>{if(echoSession?.gate.suspended){raf=requestAnimationFrame(tick);return;}let state=clock.tick(now);if(!available()&&['countdown','playing'].includes(state.phase)&&!state.paused){pause('camera');state=clock.tick(now);}echoSession?.beyond.chaos.tick(settings.current.mode,now,state.phase==='playing'&&!state.paused&&!document.hidden);echoSession?.beyond.bodyshift.tick(settings.current.mode,now,state.phase==='playing'&&!state.paused&&!document.hidden);publish(state);raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(raf);window.removeEventListener('blur',blur);document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);echoSession?.beyond.chaos.leave(settings.current.mode);clock.reset();epoch.current++;};},[clock]);
 const api={clock,stateRef,display,epoch,session,pause,canPlay:available(),start(){const s=clock.tick(performance.now());if(echoSession?.gate.suspended||document.hidden||!available()||!['ready','results'].includes(s.phase))return;epoch.current++;session.current++;echoSession?.beyond.chaos.replay(settings.current.mode);echoSession?.beyond.bodyshift.leave(settings.current.mode);settings.current.onReset?.(true);publish(clock.start(performance.now()));},resume(){if(echoSession?.gate.suspended||document.hidden||!available())return;epoch.current++;settings.current.onReset?.(false);publish(clock.resume(performance.now()));},hit(n=1,commit){if(echoSession?.gate.suspended)return false;const now=performance.now(),accepted=awardRoundHit(clock,now,n,commit);publish(clock.tick(now));return accepted;},refresh(){publish(clock.tick(performance.now()));}};

 const instructions=useGameInstructions(mode,{echoSession,color,instructionCamera,assisted:mouseMode,ready:available(),readiness:available()?(mouseMode?'Mouse / touch ready':'Camera ready'):'Enable camera or choose mouse / touch',onCamera,onChooseInput,start:api.start,running:['playing','countdown'].includes(display.phase)||display.paused});
 return {...api,start:instructions.start,instructions};
}
