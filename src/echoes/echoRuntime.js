import {createEchoStore} from './echoStore.js';
import {createEchoGate} from './echoGate.js';
import {drawEchoMark} from './echoComposition.js';
import {createBeyondRuntime} from '../beyond/beyondRuntime.js';
export function createEchoSession({beyondEnabled=true,chaosEnabled=true}={}){
 const store=createEchoStore(),gate=createEchoGate(),beyond=createBeyondRuntime({enabled:beyondEnabled,chaosEnabled});
 let live=[],epoch=store.epoch,scope=0;const providers=new Map(),observers=new Set(),pulseTimes=new Map();
 store.subscribe(()=>{if(epoch!==store.epoch){epoch=store.epoch;live=[];pulseTimes.clear();beyond.reset();}});
 gate.subscribe(open=>beyond.suspend(open));
 const api={store,gate,beyond,allocateScope:()=>++scope,
  registerMode(mode,provider){providers.set(mode,provider);return()=>{beyond.chaos.leave(mode);if(providers.get(mode)===provider)providers.delete(mode);};},
  observeInteractions(fn){observers.add(fn);return()=>observers.delete(fn);},
  canPulse(mode,automatic=false){if(!beyond.stateEnabled||gate.suspended||globalThis.document?.hidden||performance.now()-(pulseTimes.get(mode)??-Infinity)<3000)return false;try{const s=providers.get(mode)?.();return !!(s?.playing&&!s.paused&&!s.blocked&&(!automatic||s.autoAllowed));}catch{return false;}},
  requestPulse(mode,automatic=false){if(!api.canPulse(mode,automatic))return false;const s=providers.get(mode)();if(!beyond.pulse(mode,s.point??{x:.5,y:.5},s.color))return false;pulseTimes.set(mode,performance.now());return true;},
  emit(event,token,details={}){if(gate.suspended)return null;try{const record=store.append(event,token);if(record){beyond.accept(record,details);beyond.chaos.accept(record,details);for(const fn of observers)try{fn(record,details);}catch{}live.push({record,born:performance.now()});const cap=record.mode==='FLOW'?3:record.mode==='LAUNCH'?6:8,matching=live.filter(v=>v.record.mode===record.mode);if(matching.length>cap)live.splice(live.indexOf(matching[0]),1);}return record;}catch{return null;}},
  draw(ctx,w,h,time,mode,reduced){live=live.filter(v=>time-v.born<v.record.duration*1000);for(const v of live){if(v.record.mode!==mode)continue;const age=(time-v.born)/(v.record.duration*1000);try{drawEchoMark(ctx,v.record,w,h,(1-age)*.3,reduced?0:age*.012);}catch{}}},
  clearLive(){live=[];}
 };return api;
}
