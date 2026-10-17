import {useEffect,useRef,useState} from 'react';
import './energyRush.css';
const challengeLabels={left:'MOVE LEFT',right:'MOVE RIGHT',expand:'EXPAND YOUR ENERGY FIELD',reach:'REACH HIGH'};
export function EnergyRushHUD({game,cameraReady,preview,onCamera,poseEnabled,onPoseToggle,poseStatus,instructions}){
 const s=game.display,action=useRef(null),pad=useRef(null),lastPhase=useRef(s.phase),activePointer=useRef(null);
 useEffect(()=>{activePointer.current=null;},[s.phase]);
 const [announcement,setAnnouncement]=useState(''),previous=useRef({shields:3,fever:false});
 useEffect(()=>{if(s.shields<previous.current.shields)setAnnouncement(`Shield used. ${s.shields} shields remaining.`);else if(s.fever&&!previous.current.fever)setAnnouncement('ENERGY FEVER. Eight active seconds of extra light.');else if(!s.fever&&previous.current.fever)setAnnouncement('ENERGY FEVER complete. Keep collecting the light.');previous.current={shields:s.shields,fever:s.fever};},[s.shields,s.fever]);
 useEffect(()=>{if(!announcement)return;const timer=setTimeout(()=>setAnnouncement(''),2400);return()=>clearTimeout(timer);},[announcement]);
 useEffect(()=>{if(lastPhase.current!==s.phase&&['PAUSED','RESULTS'].includes(s.phase)){action.current?.focus({preventScroll:true});action.current?.scrollIntoView({block:'nearest',behavior:'instant'});}lastPhase.current=s.phase;},[s.phase]);
 const assisted=game.inputMode==='assist',ready=s.phase==='READY'||s.phase==='RESULTS';
 const touch=e=>{const r=pad.current.getBoundingClientRect();game.move(.06+(e.clientX-r.left)/r.width*.88,.1+(e.clientY-r.top)/r.height*.8);};
 return <><div className="energy-ui" data-energy-phase={s.phase}>
  {instructions?.dialog}<button className="game-how-to" onClick={instructions?.show}>HOW TO PLAY</button><span className="sr-only" role="status">{announcement}</span>{announcement&&s.phase==='PLAYING'&&<div className="energy-event" aria-hidden="true">{announcement}</div>}
  <div className="energy-top" data-energy-exclude>
   <div className="energy-name">ENERGY RUSH <span>{assisted?'KEYBOARD / TOUCH':'BODY PLAY'}</span></div>
   {!ready&&<div className="energy-metrics" aria-label="ENERGY RUSH session">
    <div><span>SCORE</span><strong aria-label="Score">{s.score.toLocaleString()}</strong></div>
    <div><span>COMBO</span><strong aria-label="Combo multiplier">{s.multiplier}×</strong></div>
    <div><span>SHIELDS</span><strong aria-label="Shield charges">{s.shields} / 3</strong></div>
    <div><span>TIME</span><time aria-label="Time remaining">{Math.floor(Math.ceil(s.remaining)/60)}:{String(Math.ceil(s.remaining)%60).padStart(2,'0')}</time></div>
   </div>}
   <div className="energy-best">BEST {s.bests?.score?.toLocaleString()??0} <span>{s.fever?`ENERGY FEVER · ${Math.ceil(s.feverRemaining)}s`:'90 SECONDS OF LIGHT'}</span></div>
  </div>
  {s.phase==='PLAYING'&&<>{s.challenge&&<div className="energy-challenge" data-energy-exclude role="status">{challengeLabels[s.challenge.kind]} <span>+250 · {s.challenge.remaining}s</span></div>}<div className="energy-feedback" aria-hidden="true">{s.feedback}</div></>}
  {s.phase!=='PLAYING'&&<section className="energy-panel" aria-label="ENERGY RUSH game">
   {ready?<><h2>{s.phase==='RESULTS'?'Light collected.':'ENERGY RUSH'}</h2>
    {s.phase==='RESULTS'?<><div className="energy-result" aria-label="Final score">{s.score.toLocaleString()} <span>POINTS</span></div><p>{s.collections} orbs · {s.challenges} challenges · {s.maxCombo} best combo</p>{s.newBest&&<p role="status">NEW PERSONAL BEST</p>}<p>{s.endReason==='shields'?'Your shields have faded.':'Your 90 seconds are complete.'}</p></>:<><p>Move your body to collect the light.</p><p>Avoid the red energy. Build your combo.</p><p className="energy-detail">Sit or stand comfortably. Small movements count.<br/>Three shields. Ninety seconds. Your world stays in view.</p></>}
    <div className="energy-input-choice" role="group" aria-label="Interaction method"><button aria-pressed={!assisted} onClick={()=>game.chooseInput('body')}>Body play</button><button aria-pressed={assisted} onClick={()=>game.chooseInput('assist')}>Keyboard / touch</button></div>
    {!assisted&&(!cameraReady||preview)&&<>{instructions?.cameraNotice&&<p className="energy-detail">{instructions.cameraNotice}</p>}<button className="energy-camera" onClick={onCamera}>ENABLE CAMERA</button></>}
    {!assisted&&cameraReady&&<label className="energy-pose"><input type="checkbox" checked={poseEnabled} onChange={e=>onPoseToggle?.(e.target.checked)}/> Optional pose challenges <span>{poseStatus==='fallback'?'Coarse tracking available':poseStatus==='loading'?'Preparing pose tracking':''}</span></label>}
    {assisted&&<p className="energy-detail">Arrow keys / WASD move your energy field.<br/>Or drag the touch pad. Assisted bests are kept separately.</p>}
    <button className="energy-primary" ref={action} disabled={!assisted&&(!cameraReady||preview||!game.grid.fresh(performance.now()))} onClick={game.start}>{s.phase==='RESULTS'?'REPLAY':'START'}</button>
   </>:s.phase==='CALIBRATING'?<><h2>Find your range.</h2><p>{s.calibration.stage==='neutral'?'Hold comfortably still for a moment.':'Show a comfortable movement, then return to center.'}</p><p className="energy-detail">Move a little sideways, widen your arms, or reach with pose tracking.<br/>You can stay seated. No whole-body framing needed.</p>{s.calibration.stage==='explore'&&<button className="energy-primary" disabled={!s.calibration.capabilities.length} onClick={game.finishCalibration}>USE THIS RANGE</button>}<p className="energy-detail" role="status">{s.calibration.reason||(s.calibration.stage==='explore'&&!s.calibration.capabilities.length?'Try a small movement, recalibrate, or use keyboard / touch.':s.calibration.capabilities.length?'Comfortable movement detected.':'')}</p><button onClick={()=>game.chooseInput('assist')}>Use keyboard / touch</button></>:s.phase==='COUNTDOWN'?<><h2 className="energy-countdown" aria-label="Starting in">{s.countdown}</h2><p>{game.inputMode==='body'?'Range ready. Collect the light. Avoid the danger.':'Collect the light. Avoid the danger.'}</p></>:<><h2>Paused</h2><p>{s.blockers.includes('tracking')||s.blockers.includes('camera')?'Tracking paused. Return comfortably to view; wait for stable tracking.':s.blockers.includes('framing')?'Your framing changed. Recalibrate your comfortable range.':'Your light is waiting. Continue when you are ready.'}</p><p className="energy-detail">Time, shields, and FEVER are safe.</p><button className="energy-primary" ref={action} disabled={!s.canResume} onClick={game.resume}>RESUME</button><button onClick={()=>game.chooseInput('assist')}>Start with keyboard / touch</button></>}
  </section>}
  <div className="energy-bottom" data-energy-exclude>
   <div className="energy-round-actions">{s.phase==='PLAYING'&&<button onClick={game.pause}>PAUSE</button>}{!ready&&<button onClick={game.recalibrate}>RECALIBRATE</button>}<button onClick={game.exit}>EXIT</button></div>
   {assisted&&s.phase==='PLAYING'&&<div className="energy-assist" role="group" aria-label="Touch movement">
    <div className="energy-touch-pad" ref={pad} onPointerDown={e=>{activePointer.current=e.pointerId;try{e.currentTarget.setPointerCapture(e.pointerId);}catch{/* Synthetic input has no native capture. */}touch(e);}} onPointerMove={e=>{if(activePointer.current===e.pointerId&&e.buttons)touch(e);}} onPointerUp={()=>{activePointer.current=null;}} onPointerCancel={()=>{activePointer.current=null;}} onLostPointerCapture={()=>{activePointer.current=null;}} aria-hidden="true"><span>DRAG TO MOVE</span></div>
    {s.challenge&&['expand','reach'].includes(s.challenge.kind)&&<button onPointerDown={()=>game.action(s.challenge.kind,true)} onPointerUp={()=>game.action(s.challenge.kind,false)} onPointerCancel={()=>game.action(s.challenge.kind,false)} onPointerLeave={()=>game.action(s.challenge.kind,false)} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();game.action(s.challenge.kind,true);}}} onKeyUp={()=>game.action(s.challenge.kind,false)}>HOLD TO {s.challenge.kind==='reach'?'REACH':'EXPAND'}</button>}
   </div>}
  </div>
 </div></>;
}
