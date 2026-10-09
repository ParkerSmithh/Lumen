import {useEffect,useState} from 'react';
export function PulseControl({session,mode}){const [available,setAvailable]=useState(false),[notice,setNotice]=useState('');
 const fire=()=>{if(session.requestPulse(mode))setNotice('PULSE');};
 useEffect(()=>{const update=()=>setAvailable(session.canPulse(mode));update();const timer=setInterval(update,200);const key=e=>{if(e.code!=='KeyP'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;if(session.canPulse(mode)){e.preventDefault();session.requestPulse(mode);setNotice('PULSE');}};document.addEventListener('keydown',key);return()=>{clearInterval(timer);document.removeEventListener('keydown',key);};},[session,mode]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),1200);return()=>clearTimeout(timer);},[notice]);
 return <div className="pulse-control"><button disabled={!available} onClick={fire} aria-label="PULSE" title="PULSE (P)">PULSE <small>P</small></button><span aria-live="polite">{notice}</span></div>;
}
