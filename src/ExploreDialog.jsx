import {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';

const experiences = [
  {mode:'GLOW', title:'Presence, illuminated.', description:'Become a living silhouette of neon light. Move, turn, and watch the light follow.', input:'Webcam · body movement', color:'#b06aff', shape:'presence'},
  {mode:'FLOW', title:'Leave a little light.', description:'Draw fluid trails with a fingertip. Play LIGHT TRACE to follow a path with precision.', input:'Webcam · mouse / touch', color:'#4d9fff', shape:'flow'},
  {mode:'SLASH', title:'Break the stillness.', description:'Cut through digital matter. Build a combo and chase your best destruction score.', input:'Webcam · mouse / touch', color:'#ff354e', shape:'slash'},
  {mode:'LAUNCH', title:'Set matter in motion.', description:'Create, hold, and throw luminous spheres. Hit targets in KINETIC to test your aim.', input:'Webcam · keyboard / touch', color:'#ffd84a', shape:'launch'},
];

// Native modal semantics protect focus; the existing gate owns gameplay suspension.
export function ExploreDialog({kind, gate, onClose, onMode, onEnergy}) {
  const dialog=useRef(null), choseMode=useRef(false);
  useEffect(()=>{
    const previous=document.activeElement, node=dialog.current;
    gate.set(true,'explore');node.showModal();
    return()=>{node.close();gate.set(false,'explore');requestAnimationFrame(()=>{
      const target=!choseMode.current&&previous?.isConnected?previous:document.querySelector('nav button[aria-current="page"]');
      target?.focus({preventScroll:true});
    });};
  },[gate]);
  const modes=kind==='modes';
  return createPortal(<dialog ref={dialog} className={`explore-dialog ${modes?'mode-picker':'about-dialog'}`} aria-labelledby="explore-title" onCancel={event=>{event.preventDefault();onClose();}}>
    <div className="explore-heading"><div><h2 id="explore-title">{modes?'Choose your light.':'Movement becomes light.'}</h2><p>{modes?'Four ways to move. One world to make your own.':'An interactive experiment in body, light, and digital matter.'}</p></div><button className="dialog-close" aria-label={modes?'Close mode selection':'Close About'} onClick={onClose}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    {modes?<>
      <div className="experience-grid">{experiences.map(({mode,title,description,input,color,shape})=><article className="experience-card" key={mode} style={{'--accent':color}}>
        <div className={`experience-art ${shape}`} aria-hidden="true"><i/><i/><i/></div>
        <div className="experience-content"><div className="experience-label"><h3>{mode}</h3>{mode==='GLOW'&&<span>START HERE</span>}</div><h4>{title}</h4><p>{description}</p><small>{input}</small><button className="experience-play" aria-label={`Explore ${mode}`} onClick={()=>{choseMode.current=true;onMode(mode);}}>PLAY {mode}<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button></div>
      </article>)}</div>
      <div className="energy-discovery"><div><h3>More energy?</h3><p>ENERGY RUSH turns your movement into a 90-second arcade challenge. Body play or keyboard / touch.</p></div><button onClick={()=>{choseMode.current=true;onEnergy();}}>EXPLORE ENERGY RUSH</button></div>
      <p className="explore-note">Choosing an experience does not connect your camera. Connect when you’re ready, or use the available alternate controls.</p>
    </>:<div className="about-content">
      <section><h3>How it works.</h3><p>LUMEN translates movement into a real-time artwork. MediaPipe estimates body silhouettes and hand positions on your device; WebGL, Three.js, and Canvas turn those signals into light, fluid trails, and moving matter. React connects the experience.</p></section>
      <section><h3>Find your starting point.</h3><ol><li><strong>Connect when ready.</strong> Choose ENABLE CAMERA or open Camera settings. Your browser controls permission.</li><li><strong>Make room for movement.</strong> For GLOW, step back until your body fits. For the other modes, raise a hand into view.</li><li><strong>Explore, then play.</strong> Try the artwork or choose PLAY. HOW TO PLAY explains each game and its alternate controls.</li></ol></section>
      <section><h3>Four ways to interact.</h3><p><strong>GLOW</strong> illuminates your presence and includes ENERGY RUSH. <strong>FLOW</strong> creates light trails and includes LIGHT TRACE. <strong>SLASH</strong> cuts digital matter. <strong>LAUNCH</strong> creates and throws spheres, with KINETIC target play.</p><p>Mouse, keyboard, and touch alternatives vary by mode and are described in HOW TO PLAY. Use the mode navigation to switch experiences. ECHOES gathers abstract marks from your interactions into an artwork.</p></section>
      <section><h3>Privacy, by design.</h3><p>LUMEN processes video locally and never uploads or records your camera feed. GLOW displays your live scene; the other modes can show a mirrored preview. Camera capture requests no audio.</p><p>First connection is manual. Connecting can remember your camera and enable future auto-reconnect when browser permission allows. Camera settings explains your current choices. Saved OFF choices and intentional disconnect remain respected. Disconnect stops capture; Forget removes camera preferences without stopping a current live stream.</p><p>Personal bests and some preferences are saved in this browser. ECHOES lasts for the session. SAVE IMAGE exports abstract artwork only, after your explicit action; it does not export camera imagery.</p></section>
      <section><h3>Comfort and control.</h3><p>LUMEN follows your device’s reduced-motion preference. Games pause for interruptions and offer explicit resume. If tracking is lost, move back into view; if the camera fails, use Camera settings or the available alternate input. For denied access, allow camera permission in your browser. For a busy camera, close the other camera app and reconnect.</p></section>
    </div>}
    <div className="explore-footer"><span>BODY / LIGHT / DIGITAL MATTER</span><button onClick={onClose}>BACK TO LUMEN</button></div>
  </dialog>,document.body);
}
