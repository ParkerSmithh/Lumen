import {useCallback,useEffect,useRef,useState} from 'react';
import {createSilhouetteGrid} from '../tracking/silhouetteGrid.js';
import {createEnergyRush} from './energyRush.js';
import {createAssistField,energyKeyDirection} from './energyInput.js';
import {createEnergyEvents} from './energyEvents.js';
import {personalBests} from './personalBests.js';

export function useEnergyRush({enabled,cameraReady,preview,videoRef,echoSession,onExit,color}){
 const [engine]=useState(()=>createEnergyRush({scope:echoSession?.allocateScope()??0}));
 const [grid]=useState(createSilhouetteGrid),[assist]=useState(createAssistField),[events]=useState(()=>createEnergyEvents(echoSession));
 const [display,setDisplay]=useState(()=>engine.snapshot),[inputMode,setInputMode]=useState('body');
 const settings=useRef(null);settings.current={enabled,cameraReady,preview,videoRef,echoSession,onExit,inputMode,color};
 const keys=useRef(new Set()),point=useRef({x:.5,y:.5}),actions=useRef({}),lastMask=useRef(null),lastFrame=useRef(null),lastPublish=useRef(-Infinity),phase=useRef('READY'),finished=useRef(-1),resultAt=useRef(-Infinity),best=useRef(null),excluded=useRef([]);
 const bestMode=()=>engine.snapshot.inputMode==='assist'?'ENERGY_RUSH_ASSIST':'ENERGY_RUSH_BODY';
 const publish=useCallback(()=>{const s=engine.snapshot;setDisplay({...s,bests:best.current?.bests??personalBests.read(s.phase==='READY'?(settings.current.inputMode==='assist'?'ENERGY_RUSH_ASSIST':'ENERGY_RUSH_BODY'):bestMode()),newBest:best.current?.newBest??false});},[engine]);
 useEffect(()=>{if(!enabled){engine.exit();grid.reset();assist.reset();lastMask.current=null;keys.current.clear();echoSession?.beyond.chaos.setEnergyRush(false);publish();}return()=>{keys.current.clear();};},[enabled]);
 useEffect(()=>{
  const suspend=reason=>{if(!settings.current.enabled)return;keys.current.clear();engine.pause(reason,performance.now());publish();};
  const visibility=()=>{if(document.hidden)suspend('visibility');};
  const unsubscribe=echoSession?.gate.subscribe(open=>{if(open)suspend('echoes');});
  const editable=e=>e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea,select,[contenteditable=true]');
  const down=e=>{if(!settings.current.enabled||editable(e)||echoSession?.gate.suspended||document.hidden)return;
   if(e.code==='Escape'&&engine.snapshot.phase==='PLAYING'){e.preventDefault();suspend('user');return;}
   if(settings.current.inputMode!=='assist'||engine.snapshot.phase!=='PLAYING')return;
   if(energyKeyDirection(e.code)){e.preventDefault();keys.current.add(e.code);}
  };
  const up=e=>keys.current.delete(e.code),blur=()=>{keys.current.clear();};
  document.addEventListener('visibilitychange',visibility);document.addEventListener('keydown',down);document.addEventListener('keyup',up);window.addEventListener('blur',blur);
  return()=>{unsubscribe?.();document.removeEventListener('visibilitychange',visibility);document.removeEventListener('keydown',down);document.removeEventListener('keyup',up);window.removeEventListener('blur',blur);echoSession?.beyond.chaos.setEnergyRush(false);engine.exit();grid.reset();assist.reset();};
 },[engine,echoSession]);
 const frame=useCallback((now,mask,body)=>{
  if(!settings.current.enabled)return engine.scene;
  const s=settings.current;
  if(mask!==lastMask.current){lastMask.current=mask;if(mask)grid.update(mask,now);else grid.invalidate();}
  const blocked=[];if(document.hidden)blocked.push('visibility');if(s.echoSession?.gate.suspended)blocked.push('echoes');
  if(s.inputMode==='body'){const v=s.videoRef?.current;if(!s.cameraReady||s.preview||!v||v.readyState<2||v.paused||v.ended)blocked.push('camera');}
  const dt=Math.min(.07,Math.max(0,(now-(lastFrame.current??now))/1000));lastFrame.current=now;
  if(s.inputMode==='assist'){
   if(engine.snapshot.phase==='PLAYING'&&!blocked.length){let dx=0,dy=0;for(const key of keys.current){const d=energyKeyDirection(key);dx+=d.x;dy+=d.y;}const length=Math.max(1,Math.hypot(dx,dy));point.current={x:Math.max(.06,Math.min(.94,point.current.x+dx/length*dt*.45)),y:Math.max(.1,Math.min(.9,point.current.y+dy/length*dt*.6))};}
   const video=s.videoRef?.current;
   assist.update(now,{...point.current,...actions.current,aspect:video?.videoWidth/video?.videoHeight||4/3});
  }
  engine.frame(now,{input:s.inputMode==='assist'?assist:grid,body,blocked,excluded:excluded.current});
  const state=engine.snapshot;
  const playing=state.phase==='PLAYING';
  if(state.phase==='RESULTS'&&finished.current!==state.session){finished.current=state.session;resultAt.current=now;best.current=personalBests.record(bestMode(),{score:state.score,count:state.collections},true);}
  s.echoSession?.beyond.chaos.tick('GLOW',now,playing||state.phase==='RESULTS'&&now-resultAt.current<1600);
  for(const event of engine.drainEvents())events.accept(event,s.color??'#b06aff');
  if(state.phase!==phase.current||now-lastPublish.current>=100){phase.current=state.phase;lastPublish.current=now;publish();}
  return engine.scene;
 },[engine,grid,assist,events,publish]);
 return {engine,display,inputMode,grid,frame,
  setColor(color){settings.current.color=color;},
  setExcluded(rectangles){excluded.current=rectangles.slice(0,24);},
  start(){const now=performance.now();if(!enabled||document.hidden||echoSession?.gate.suspended||inputMode==='body'&&(!cameraReady||preview||!grid.fresh(now)))return;point.current={x:.5,y:.5};actions.current={};keys.current.clear();assist.reset();best.current=null;events.reset();echoSession?.beyond.chaos.replay('GLOW');engine.start(now,inputMode);publish();},
  pause(){engine.pause('user',performance.now());keys.current.clear();publish();},
  resume(){if(document.hidden||echoSession?.gate.suspended)return;engine.resume(performance.now());publish();},
  recalibrate(){keys.current.clear();echoSession?.beyond.bodyshift.leave('GLOW');engine.recalibrate(performance.now());publish();},
  finishCalibration(){engine.finishCalibration();publish();},
  chooseInput(mode){engine.exit();assist.reset();grid.reset();lastMask.current=null;keys.current.clear();best.current=null;setInputMode(mode);},
  move(x,y){if(engine.snapshot.phase==='PLAYING')point.current={x,y};},
  action(kind,pressed){actions.current={...actions.current,[kind]:pressed};},
  exit(){engine.exit();echoSession?.beyond.chaos.setEnergyRush(false);onExit?.();publish();}
 };
}
