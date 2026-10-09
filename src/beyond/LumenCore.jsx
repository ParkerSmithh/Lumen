import {useEffect,useState} from 'react';
import './beyond.css';
const modes=['GLOW','FLOW','SLASH','LAUNCH'];
export function LumenCore({session,onConverge}){
 const [state,setState]=useState(()=>session.beyond.snapshot());
 useEffect(()=>{setState(session.beyond.snapshot());return session.beyond.subscribe(()=>setState(session.beyond.snapshot()));},[session]);
 const count=modes.filter(mode=>state.activated?.[mode]).length;
 return <div className="lumen-core"><span className={`lumen-core-orb${state.complete?' is-complete':''}`} role="img" aria-label={`LUMEN CORE: ${count} of 4 modes activated`}>{modes.map(mode=><i key={mode} className={state.activated?.[mode]?'is-active':''}/>)}</span>{state.complete&&<button onPointerDown={onConverge} onClick={onConverge}>START CONVERGENCE</button>}</div>;
}
export default LumenCore;
