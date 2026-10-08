import {awardRoundHit} from './roundAward';
import {useEffect,useRef,useState} from 'react';
import {createRoundClock} from './roundClock';
import {personalBests} from './personalBests';
export function useRound({duration,mode,metrics,mouseMode,cameraReady,videoRef,trackingError,onReset}) {
 const [clock]=useState(()=>createRoundClock(duration));
 const stateRef=useRef(clock.tick(0)),epoch=useRef(0),session=useRef(0),finished=useRef(-1);
 const [display,setDisplay]=useState(stateRef.current),settings=useRef(null);
 settings.current={mode,metrics,mouseMode,cameraReady,videoRef,trackingError,onReset};
 const available=()=>{const s=settings.current,v=s.videoRef?.current;return s.mouseMode||!!(s.cameraReady&&!s.trackingError&&v?.readyState>=2&&!v.paused&&!v.ended);};
 const publish=base=>{const s=settings.current,extra=s.metrics?.(base)||{score:base.count*100};let state={...base,...extra};
  if(base.phase==='results'&&session.current>0&&finished.current!==session.current){finished.current=session.current;state={...state,...personalBests.record(s.mode,{score:state.score,count:base.count,accuracy:state.accuracy},true)};}
  else if(base.phase==='results')state={...state,bests:stateRef.current.bests,newBest:stateRef.current.newBest};
  const old=stateRef.current;stateRef.current=state;if(['phase','paused','seconds','countdown','count','pauseReason','score','chain','combo','feedbackId','newBest'].some(k=>old[k]!==state[k]))setDisplay(state);
 };
 useEffect(()=>{let raf;const pause=reason=>{epoch.current++;settings.current.onReset?.(false);publish(clock.pause(performance.now(),reason));};const visibility=()=>{if(document.hidden)pause('visibility');};document.addEventListener('visibilitychange',visibility);const tick=now=>{let state=clock.tick(now);if(!available()&&['countdown','playing'].includes(state.phase)&&!state.paused){pause('camera');state=clock.tick(now);}publish(state);raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);clock.reset();epoch.current++;};},[clock]);
 return {clock,stateRef,display,epoch,session,canPlay:available(),start(){const s=clock.tick(performance.now());if(document.hidden||!available()||!['ready','results'].includes(s.phase))return;epoch.current++;session.current++;settings.current.onReset?.(true);publish(clock.start(performance.now()));},resume(){if(document.hidden||!available())return;epoch.current++;settings.current.onReset?.(false);publish(clock.resume(performance.now()));},hit(n=1,commit){const now=performance.now(),accepted=awardRoundHit(clock,now,n,commit);publish(clock.tick(now));return accepted;},refresh(){publish(clock.tick(performance.now()));}};
}
