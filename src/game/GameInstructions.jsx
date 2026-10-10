import {useEffect,useId,useRef,useState} from 'react';
import {getGameInstructions} from './gameInstructions';
import {GameInstructionDemo} from './GameInstructionDemo.jsx';

export function GameInstructions({gameId,assisted=false,ready=false,readiness,onStart,onBack,onCamera,onChooseInput,color,primaryLabel='START GAME',resumeOnly=false}) {
 const config=getGameInstructions(gameId,assisted),dialog=useRef(null),heading=useRef(null),id=useId();
 const [closing,setClosing]=useState(false),pending=useRef(null),exitTimer=useRef(null),callbacks=useRef(null);
 callbacks.current={onStart,onBack};
 const exit=action=>{
  if(pending.current)return;
  pending.current=action;setClosing(true);
  const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?0:180;
  exitTimer.current=setTimeout(()=>{
   if(callbacks.current[action]?.()===false){pending.current=null;setClosing(false);}
  },delay);
 };
 const requestBack=useRef(null);requestBack.current=()=>exit('onBack');
 useEffect(()=>{
  const previous=document.activeElement;heading.current?.focus({preventScroll:true});
  const focusable=()=>Array.from(dialog.current?.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), [tabindex="0"]')||[]).filter(el=>!el.hidden);
  const key=e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();requestBack.current();}
   if(e.key==='Tab'){
    const items=focusable(),first=items[0],last=items.at(-1);
    if(!first){e.preventDefault();heading.current?.focus();}
    else if(e.shiftKey&&(document.activeElement===first||document.activeElement===heading.current||!node.contains(document.activeElement))){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===heading.current||!node.contains(document.activeElement))){e.preventDefault();first.focus();}
   }
  };
  const contain=e=>{if(dialog.current&&!dialog.current.contains(e.target))heading.current?.focus({preventScroll:true});};
  const stop=e=>e.stopPropagation();
  const node=dialog.current;node?.addEventListener('keydown',stop);document.addEventListener('keydown',key,true);document.addEventListener('focusin',contain);
  return()=>{
   clearTimeout(exitTimer.current);node?.removeEventListener('keydown',stop);document.removeEventListener('keydown',key,true);document.removeEventListener('focusin',contain);
   if(previous?.isConnected)previous.focus({preventScroll:true});
  };
 },[]);
 const status=typeof readiness==='string'?readiness:readiness?.message||readiness?.reason;
 return <div className="game-instructions-layer" data-state={closing?'closing':'open'} style={{'--light':color||'#d1aeff'}} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()}>
  <section ref={dialog} className="game-instructions" data-game={gameId} data-state={closing?'closing':'open'} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-subtitle`} data-energy-exclude>
   <div className="game-instructions-scroll">
    <h2 ref={heading} tabIndex={-1} id={`${id}-title`}>{config.title}</h2><p className="game-instructions-subtitle" id={`${id}-subtitle`}>{config.subtitle}</p>
    <GameInstructionDemo gameId={gameId}/>
    <ol className="game-instructions-steps">{config.steps.map(([title,text])=><li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol>
    {config.note&&<p className="game-instructions-note">{config.note}</p>}
    {onChooseInput&&!resumeOnly&&<div className="game-instructions-input" role="group" aria-label="Interaction method">
     <button disabled={closing} aria-pressed={!assisted} onClick={()=>onChooseInput(gameId==='ENERGY_RUSH'?'body':'camera')}>{gameId==='ENERGY_RUSH'?'Body play':'Camera gestures'}</button>
     <button disabled={closing} aria-pressed={assisted} onClick={()=>onChooseInput('assist')}>{config.assistedLabel||'Keyboard / touch'}</button>
    </div>}
    <div className="game-instructions-readiness" role="status">{status||(!ready&&!resumeOnly?'Choose an input method or enable your camera to begin.':'Ready when you are.')}{!assisted&&!ready&&onCamera&&!resumeOnly&&<button disabled={closing} onClick={onCamera}>ENABLE CAMERA</button>}</div>
   </div>
   <div className="game-instructions-actions"><button disabled={closing} onClick={()=>exit('onBack')}>BACK</button><button className="game-instructions-start" disabled={closing||(!resumeOnly&&!ready)} onClick={()=>exit('onStart')}>{primaryLabel}</button></div>
  </section>
 </div>;
}
