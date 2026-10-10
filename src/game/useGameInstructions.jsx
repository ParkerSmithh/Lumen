import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {GameInstructions} from './GameInstructions.jsx';
import {instructionReadiness} from './gameInstructions.js';

const InstructionContext=createContext(null);
export function GameInstructionProvider({children}){
 const seen=useRef(new Set()),[active,setActive]=useState(null);
 const value=useMemo(()=>({seen:seen.current,active,open:id=>setActive(id),close:()=>setActive(null)}),[active]);
 return <InstructionContext.Provider value={value}>{children}</InstructionContext.Provider>;
}
export function useGameInstructions(gameId,settings){
 const context=useContext(InstructionContext),latest=useRef(settings);latest.current=settings;
 const [resumeOnly,setResumeOnly]=useState(false),trigger=useRef(null);
 const open=context?.active===gameId;
 const show=useCallback((review=false)=>{
  if(!context)return;
  trigger.current=document.activeElement;setResumeOnly(review&&latest.current.running);
  context.open(gameId);
 },[context,gameId]);
 const close=()=>{const main=document.querySelector('#root main');if(main){main.inert=false;main.removeAttribute('aria-hidden');}context?.close();requestAnimationFrame(()=>{if(trigger.current?.isConnected)trigger.current.focus({preventScroll:true});});};
 useEffect(()=>{
  if(!open)return;
  const gate=latest.current.echoSession?.gate,main=document.querySelector('#root main');
  gate?.set(true,'instructions');if(main){main.inert=true;main.setAttribute('aria-hidden','true');}
  return()=>{gate?.set(false,'instructions');if(main){main.inert=false;main.removeAttribute('aria-hidden');}};
 },[open]);
 useEffect(()=>()=>{if(open)context?.close();},[gameId,open]);
 const start=()=>{
  const s=latest.current;
  if(!context||context.seen.has(gameId)){s.start();return;}
  show(false);
 };
 const accept=()=>{
  const s=latest.current;if(!resumeOnly&&(!s.ready||document.hidden))return false;
  s.echoSession?.gate.set(false,'instructions');close();
  if(!resumeOnly){context?.seen.add(gameId);s.start();}
 };
 const back=()=>{close();if(!resumeOnly)latest.current.back?.();};
 const readiness=resumeOnly?'Round paused. Your time and score are safe. Close these instructions, then choose RESUME.':instructionReadiness(gameId,settings.assisted,settings.ready,settings.instructionCamera);
 const dialog=open?createPortal(<GameInstructions gameId={gameId} assisted={settings.assisted} ready={resumeOnly||settings.ready} readiness={readiness} onStart={accept} onBack={back} onCamera={settings.onCamera} onChooseInput={settings.onChooseInput} color={settings.color} resumeOnly={resumeOnly} primaryLabel={resumeOnly?'BACK TO GAME':'START GAME'}/>,document.body):null;
 return {supported:!!context,start,show:()=>show(true),dialog,open,first:!context?.seen.has(gameId)};
}
