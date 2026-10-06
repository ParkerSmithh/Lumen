import { useEffect, useRef } from 'react';
import { createGlowRenderer } from '../effects/glowRenderer';

function previewMask() {
  const c = document.createElement('canvas'); c.width = 320; c.height = 400;
  const ctx = c.getContext('2d'); ctx.fillStyle = 'white'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(160, 65, 19, 25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 19;
  for (const points of [[[145,112],[125,151],[96,132],[79,91]], [[175,112],[199,145],[224,120],[235,84]], [[148,218],[143,278],[130,350]], [[172,218],[180,279],[194,350]]]) {
    ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(143,100); ctx.quadraticCurveTo(160,91,178,100); ctx.quadraticCurveTo(191,152,178,224); ctx.lineTo(141,224); ctx.quadraticCurveTo(130,157,143,100); ctx.fill();
  const pixels = ctx.getImageData(0,0,320,400).data;
  return { width: 320, height: 400, sourceWidth: 640, sourceHeight: 800, values: Float32Array.from({ length: 320*400 }, (_,i) => pixels[i*4+3]/255), timestamp: Infinity };
}
export function GlowMode({ maskRef, color, preview }) {
  const hostRef = useRef(null); const settings = useRef({ color, preview }); settings.current = { color, preview };
  useEffect(() => {
    const host = hostRef.current;
    let canvas, renderer, raf, previousMask, opacity = 0;
    const illustrated = previewMask();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const resize = () => {
      const scale = Math.min(devicePixelRatio, 1.5, 1280 / host.clientWidth, 900 / host.clientHeight);
      renderer.resize(Math.round(host.clientWidth * scale), Math.round(host.clientHeight * scale));
    };
    const lost = event => { event.preventDefault(); renderer.dispose(); mount(true); };
    const mount = fallback => {
      canvas?.removeEventListener('webglcontextlost', lost); canvas?.remove();
      canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden','true'); host.append(canvas);
      if (fallback) canvas.getContext('2d');
      try { renderer = createGlowRenderer(canvas); } catch { canvas.remove(); canvas = document.createElement('canvas'); canvas.getContext('2d'); host.append(canvas); renderer = createGlowRenderer(canvas); }
      canvas.addEventListener('webglcontextlost', lost); resize();
    };
    mount(false);
    const observer = new ResizeObserver(resize); observer.observe(host);
    const draw = time => {
      const live = maskRef.current;
      const fresh = live && time - live.timestamp < 500;
      const mask = settings.current.preview ? illustrated : fresh ? live : null;
      if (mask) previousMask = mask;
      opacity += ((mask ? 1 : 0) - opacity) * .12;
      renderer.draw({ mask: opacity > .005 ? previousMask : null, color: settings.current.color, time, reducedMotion: reduced.matches, opacity });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); canvas.removeEventListener('webglcontextlost', lost); renderer.dispose(); canvas.remove(); };
  }, [maskRef]);
  return <div className="artwork" ref={hostRef} />;
}
