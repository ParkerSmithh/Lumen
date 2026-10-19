import {useEffect,useRef,useState} from 'react';
import './experienceLauncher.css';

export const experiences=[
 {id:'trace',mode:'FLOW',name:'FLOW',tagline:'Draw with Motion',description:'Follow luminous paths with a fingertip. Complete patterns and leave fluid trails of light.',input:'HANDS · MOUSE / TOUCH',accent:'#6dbbff',art:'trace'},
 {id:'glow',mode:'GLOW',name:'GLOW',tagline:'Become the Light',description:'Turn your presence into neon energy. Move, explore colors, and shape your own light.',input:'BODY TRACKING',accent:'#bc8bff',art:'presence'},
 {id:'energy',mode:'GLOW',name:'ENERGY RUSH',tagline:'Move to Survive',description:'Collect energy, dodge hazards, and build combos in a 90-second movement challenge.',input:'BODY · KEYBOARD / TOUCH',accent:'#70edbb',art:'energy'},
 {id:'destruction',mode:'SLASH',name:'SLASH',tagline:'Shatter the Light',description:'Slash through digital matter, chain your hits, and chase your best destruction score.',input:'MOTION · MOUSE / TOUCH',accent:'#ff758b',art:'destruction'},
 {id:'kinetic',mode:'LAUNCH',name:'KINETIC',tagline:'Control the Chaos',description:'Create, hold, and throw luminous spheres. Hit targets and test your aim with moving matter.',input:'HANDS · KEYBOARD / TOUCH',accent:'#ffda7a',art:'kinetic'},
];

export function ExperienceLauncher({selected,camera,onSelect,onConnect,onContinue,onCancel,onFallback,onEchoes,onResume,canResume}){
 const heading=useRef(null),surface=useRef(null),lastChoice=useRef(null);
 const [device,setDevice]=useState(camera.prefs.deviceId),[facing,setFacing]=useState(camera.prefs.facingMode);
 useEffect(()=>{if(surface.current)surface.current.scrollTop=0;heading.current?.focus({preventScroll:true});if(!selected&&lastChoice.current)document.querySelector(`[data-experience="${lastChoice.current}"] button`)?.focus();},[selected?.id]);
 useEffect(()=>{if(selected){setDevice(camera.prefs.deviceId);setFacing(camera.prefs.facingMode);void camera.refreshDevices();}},[selected?.id]);
 const busy=camera.status==='loading',live=camera.status==='ready';
 useEffect(()=>{const key=event=>{if(event.key!=='Escape'||document.querySelector('dialog[open]'))return;if(selected){event.preventDefault();onCancel();}else if(canResume){event.preventDefault();onResume();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[selected,canResume,onCancel,onResume]);
 return <section ref={surface} className={`experience-launcher ${selected?'is-setup':''}`} aria-label={selected?'Experience camera setup':'Experience selection'} style={{'--experience-accent':selected?.accent||'#bc8bff'}}>
  {selected?<div className="launcher-setup">
   <button className="launcher-back" onClick={onCancel}>Back to experiences</button>
   <div className={`launcher-art ${selected.art}`} aria-hidden="true"><i/><i/><i/><i/></div>
   <h2 ref={heading} tabIndex={-1}>Set up {selected.name}</h2><p className="setup-tagline">{selected.tagline}</p>
   <p>{selected.mode==='GLOW'?'Your camera turns body movement into light. Step back until your body fits in view.':'Your camera brings your hands and movement into the experience. Keep your hand in view with room to move.'} Video stays on your device.</p>
   <p className="setup-status" role="status" aria-live="polite">{live?'Camera connected. Continue to prepare tracking in your experience.':busy?camera.detail:camera.detail||'Camera off. Connect when you’re ready.'}</p>
   {camera.error&&<p role="alert">{camera.error}</p>}
   <label className="setup-field">Preferred webcam<select aria-label="Setup webcam" disabled={busy} value={device} onChange={e=>setDevice(e.target.value)}><option value="">Browser default / facing preference</option>{device&&!camera.devices.some(d=>d.deviceId===device)&&<option value={device}>Saved camera · unavailable or not yet visible</option>}{camera.devices.filter(d=>d.deviceId).map(d=><option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}</select></label>
   <label className="setup-field">Mobile camera facing<select disabled={busy} value={facing} onChange={e=>{setDevice('');setFacing(e.target.value);}}><option value="user">Front / selfie</option><option value="environment">Rear / environment</option></select></label>
   {!live&&<p className="setup-note">Your browser may hide camera names until you allow access. Choose Connect Camera to request permission; you can change devices afterward in Camera settings.</p>}
   <div className="setup-preferences"><label><input type="checkbox" checked={camera.prefs.remember} onChange={e=>camera.setPreferences({remember:e.target.checked})}/>Remember My Camera</label><label><input type="checkbox" checked={camera.prefs.autoReconnect} disabled={!camera.prefs.remember} onChange={e=>camera.setPreferences({autoReconnect:e.target.checked})}/>Auto-Reconnect</label></div>
   {camera.prefs.remember&&camera.prefs.autoReconnect&&!camera.prefs.startupConfirmed&&<p className="setup-note">Connecting remembers this camera and enables future auto-reconnect. Turn either option off above before connecting if you prefer.</p>}
   <div className="setup-actions"><button className="launcher-primary" disabled={busy} onClick={()=>live&&device===camera.prefs.deviceId&&facing===camera.prefs.facingMode?onContinue():onConnect(device,facing)}>{busy?'CONNECTING CAMERA…':live&&device===camera.prefs.deviceId&&facing===camera.prefs.facingMode?'CONTINUE':'CONNECT CAMERA'}</button><button onClick={onFallback}>Explore without camera</button></div>
   <p className="setup-note">{selected.id==='glow'?'Explore the artwork and its illustrated preview with your camera off.':'Alternate controls are explained in HOW TO PLAY. Choose PLAY when you’re ready.'}</p>
  </div>:<>
   <div className="launcher-heading"><div><h2 ref={heading} tabIndex={-1}>CHOOSE YOUR<br className="launcher-heading-break"/> EXPERIENCE</h2><p>Your movement. Your energy. Your world.</p></div><div className="launcher-camera" role="status"><span className={live?'is-live':''}/>{live?'Remembered camera connected':busy?'Checking remembered camera':camera.status==='error'?'Camera needs attention':'Camera off · connect after choosing'}{live&&<button onClick={camera.stop}>Disconnect camera</button>}</div></div>
   <div className="launcher-grid">{experiences.map(exp=><article key={exp.id} data-experience={exp.id} className={`launcher-card ${selected?.id===exp.id?'is-selected':''}`} style={{'--experience-accent':exp.accent}}>
    <div className={`launcher-art ${exp.art}`} aria-hidden="true"><i/><i/><i/><i/></div>
    <div className="launcher-card-content"><span className="launcher-input">{exp.input}</span><h3>{exp.name}</h3><p className="launcher-tagline">{exp.tagline}</p><p className="launcher-description">{exp.description}</p><button aria-label={`Choose ${exp.name}`} onClick={()=>{lastChoice.current=exp.id;onSelect(exp);}}>{exp.id==='glow'?'EXPLORE':'PLAY'}<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button></div>
   </article>)}</div>
   <div className="launcher-creative"><div><h3>Beyond the games.</h3><p>ECHOES collects abstract marks from your movement into a session gallery. BEYOND grows through play; complete its progression to unlock CONVERGENCE.</p></div><button onClick={onEchoes}>EXPLORE ECHOES <span>SESSION GALLERY</span></button></div>
   <div className="launcher-bottom"><p>Choose an experience. Connect when ready. Make it yours.</p>{canResume&&<button onClick={onResume}>Return to experience</button>}</div>
  </>}
 </section>;
}
