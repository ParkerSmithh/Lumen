import {useEffect,useRef,useState} from 'react';
import {createConvergenceModel,drawConvergence} from './convergenceComposition.js';
import {createConvergenceTimeline} from './convergenceTimeline.js';
import './beyond.css';
export function Convergence({session,onBack}){
 const capture=useRef(null);
 if(!capture.current)capture.current={epoch:session.store.epoch,model:createConvergenceModel(session.store.snapshot()),allowed:session.beyond.snapshot().complete&&session.gate.suspended};
 const {epoch,model,allowed}=capture.current;
 const canvasRef=useRef(null),backRef=useRef(null),timeline=useRef(createConvergenceTimeline()),mounted=useRef(false),repaint=useRef(()=>{});
 const [phase,setPhase]=useState({stage:'AWAKEN',complete:false,paused:false}),[invalid,setInvalid]=useState(!allowed||!model.complete),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
 const current=()=>mounted.current&&session.store.epoch===epoch&&session.gate.suspended;
 useEffect(()=>{mounted.current=true;backRef.current?.focus();const unsubscribe=session.store.subscribe(()=>{if(session.store.epoch!==epoch){setInvalid(true);setMessage('Your echoes were cleared. Return to LUMEN to begin again.');}});return()=>{mounted.current=false;unsubscribe();};},[session,epoch]);
 useEffect(()=>{
  if(invalid)return;
  const canvas=canvasRef.current,ctx=canvas?.getContext('2d',{alpha:false});if(!ctx)return;
  let frame=0,stopped=false;const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=state=>setPhase(old=>old.stage===state.stage&&old.complete===state.complete&&old.paused===state.paused?old:state);
  const paint=()=>{if(!current()||stopped)return;const state=timeline.current.tick(performance.now());drawConvergence(ctx,model,canvas.width,canvas.height,state.elapsed,media.matches);update(state);};
  const schedule=()=>{cancelAnimationFrame(frame);if(!stopped&&!document.hidden){const state=timeline.current.tick(performance.now());if(!state.paused&&!state.complete)frame=requestAnimationFrame(run);}};
  const run=()=>{paint();schedule();};
  const resize=()=>{const size=Math.max(1,Math.min(1600,Math.round(canvas.clientWidth*Math.min(window.devicePixelRatio||1,2))));canvas.width=size;canvas.height=size;paint();};
  const visibility=()=>{if(document.hidden){update(timeline.current.pause(performance.now()));cancelAnimationFrame(frame);}else paint();};
  const preference=()=>{if(media.matches){update(timeline.current.skip());paint();cancelAnimationFrame(frame);}};
  timeline.current.start(performance.now());if(media.matches)timeline.current.skip();
  if(document.hidden)timeline.current.pause(performance.now());
  repaint.current=()=>{paint();schedule();};
  resize();schedule();const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(canvas);
  if(!observer)window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',visibility);media.addEventListener('change',preference);
  return()=>{stopped=true;cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',preference);repaint.current=()=>{};canvas.width=0;canvas.height=0;};
 },[session,model,invalid,epoch]);
 const save=async()=>{if(saving||invalid||!phase.complete||!current())return;setSaving(true);setMessage('');try{const {exportEchoPng}=await import('../echoes/echoExport.js');if(!current())return;const saved=await exportEchoPng(model.records,{draw:ctx=>drawConvergence(ctx,model,2048,2048,20,true),filename:'lumen-signature.png',isCurrent:current});if(saved&&current())setMessage('Your LUMEN signature is ready for download.');}catch{if(current())setMessage('Could not save the artwork. Try again.');}finally{if(mounted.current)setSaving(false);}};
 return <section className="convergence" aria-labelledby="convergence-title"><header className="convergence-header"><button ref={backRef} onClick={onBack}>BACK TO LUMEN</button><h1 id="convergence-title">BEYOND</h1><span>LUMEN SIGNATURE</span></header><div className="convergence-artwork">{invalid?<p>Your signature needs echoes from all four modes.<br/>Return to LUMEN to continue.</p>:<canvas ref={canvasRef} role="img" aria-label="Your LUMEN signature, made from GLOW, FLOW, SLASH and LAUNCH echoes"/>}</div><footer className="convergence-footer"><p aria-live="polite">{invalid?'RETURN TO LUMEN':phase.complete?'YOUR LUMEN SIGNATURE':phase.paused?'ANIMATION PAUSED':phase.stage}</p><div>{!invalid&&!phase.complete&&(phase.paused?<button onClick={()=>{setPhase(timeline.current.resume(performance.now()));repaint.current();}}>RESUME ANIMATION</button>:<button onClick={()=>{setPhase(timeline.current.skip());repaint.current();}}>SKIP ANIMATION</button>)}<button disabled={invalid||saving||!phase.complete} onClick={save}>{saving?'SAVING ARTWORK…':'SAVE ARTWORK'}</button></div></footer><p className="convergence-status" role="status">{message}</p></section>;
}
export default Convergence;

