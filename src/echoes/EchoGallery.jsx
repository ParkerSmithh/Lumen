import { useEffect, useRef, useState } from 'react';
import { drawEchoComposition } from './echoComposition.js';
import './gallery.css';

export function EchoGallery({ store, session, onConverge, onBack }) {
  const [records, setRecords] = useState(() => store.snapshot());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmClear,setConfirmClear]=useState(false);
  const [coreComplete,setCoreComplete]=useState(()=>!!session?.beyond.snapshot().complete);
  useEffect(()=>session?.beyond.subscribe(()=>setCoreComplete(session.beyond.snapshot().complete)),[session]);
  const canvasRef = useRef(null);
  const backRef = useRef(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    backRef.current?.focus();
    setRecords(store.snapshot());
    const unsubscribe = store.subscribe(() => setRecords(store.snapshot()));
    return () => { mounted.current = false; unsubscribe(); };
  }, [store]);
  useEffect(() => {
    if (!records.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const paint = () => {
      const size = Math.max(1, Math.min(1600, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2))));
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d', { alpha: false });
      if (context) drawEchoComposition(context, records, size, size);
    };
    paint();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(paint) : null;
    observer?.observe(canvas);
    if (!observer) window.addEventListener('resize', paint);
    return () => { observer?.disconnect(); window.removeEventListener('resize', paint); canvas.width = 0; canvas.height = 0; };
  }, [records]);
  const save = async () => {
    if (saving || !records.length) return;
    setSaving(true);
    setMessage('');
    const epoch = store.epoch;
    try {
      const { exportEchoPng } = await import('./echoExport.js');
      if (!mounted.current || epoch !== store.epoch) return;
      const saved = await exportEchoPng(records, { isCurrent: () => mounted.current && epoch === store.epoch });
      if (mounted.current && saved) setMessage('PNG ready for download.');
    } catch {
      if (mounted.current) setMessage('Could not save the image. Your echoes are still here. Try again.');
    } finally {
      if (mounted.current) setSaving(false);
    }
  };
  const modes = ['GLOW', 'FLOW', 'SLASH', 'LAUNCH'].filter(mode => records.some(record => record.mode === mode));
  return <section className="echo-gallery" aria-labelledby="echo-gallery-title">
    <header className="echo-gallery-header">
      <button className="echo-gallery-back" ref={backRef} onClick={onBack}>BACK TO LUMEN</button>
      <div className="echo-gallery-heading"><h1 id="echo-gallery-title">ECHOES</h1></div>
      <p className="echo-gallery-note">An artwork made from your interactions.<br />Here for this session.</p>
    </header>
    <div className="echo-gallery-artwork">
      {records.length ? <canvas ref={canvasRef} role="img" aria-label={`Generative echo artwork from ${modes.join(', ')} interactions`} /> : <div className="echo-gallery-empty">
        <h2>Your echoes begin with movement.</h2>
        <p>Move in GLOW, complete a FLOW shape, destroy a crystal, or throw and hit targets in LAUNCH.</p>
        <p className="echo-gallery-empty-note">Return to LUMEN to leave your first echo.</p>
      </div>}
    </div>
    <footer className="echo-gallery-footer">
      <p className="echo-gallery-sources">{modes.length ? modes.join(' / ') : 'PRESENCE / CREATION / DESTRUCTION / FORCE'}</p>
      <div className="echo-gallery-actions">
        {coreComplete&&<button onClick={onConverge}>START CONVERGENCE</button>}
        <button disabled={!records.length} onClick={() => {if(session?.beyond.snapshot().count>0){setConfirmClear(true);return;}store.clear();setMessage('Echoes cleared. Your next interaction begins a new artwork.');}} >CLEAR ECHOES</button>
        <button className="echo-gallery-save" disabled={!records.length || saving} onClick={save}>{saving ? 'SAVING IMAGE…' : 'SAVE IMAGE'}</button>
      </div>
    </footer>
    {confirmClear&&<div className="echo-clear-confirm" role="group" aria-label="Confirm clearing echoes and CORE"><p>Clear your artwork and LUMEN CORE progress?</p><button onClick={()=>{store.clear();setConfirmClear(false);setMessage("Echoes and CORE progress cleared.");}}>CLEAR ARTWORK AND CORE</button><button onClick={()=>setConfirmClear(false)}>CANCEL</button></div>}
    <p className="echo-gallery-status" role="status">{message}</p>
  </section>;
}

export default EchoGallery;

