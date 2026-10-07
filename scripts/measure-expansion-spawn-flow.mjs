import { browserOptions } from './browser-options.mjs';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const output = '.test-artifacts/expansion-spawn-flow';
fs.mkdirSync(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, plugins: [{
  name: 'expansion-measurement',
  configureServer(server) {
    server.middlewares.use('/expansion-measurement', async (_, response) => {
      response.setHeader('Content-Type', 'text/html');
      response.end(await server.transformIndexHtml('/expansion-measurement', '<html><body style="margin:0;background:black"><script type="module" src="/expansion-entry.jsx"></script></body></html>'));
    });
  },
  resolveId(id) { if (id === '/expansion-entry.jsx') return '\0expansion-measurement'; },
  load(id) {
    if (id !== '\0expansion-measurement') return;
    return `import React from 'react';
import {createRoot} from 'react-dom/client';
import SplashCursor from '/src/effects/SplashCursor.jsx';
const pointer={current:null};window.measurePointer=pointer;
const host=document.createElement('div');host.style.cssText='width:1000px;height:560px;position:relative';document.body.append(host);
window.measureRoot=createRoot(host);window.measureRoot.render(React.createElement(SplashCursor,{pointerRef:pointer,onFailure:e=>window.failure=String(e),SIM_RESOLUTION:128,DYE_RESOLUTION:512,DENSITY_DISSIPATION:Number(new URLSearchParams(location.search).get('density')),VELOCITY_DISSIPATION:2,PRESSURE:.1,CURL:3,SPLAT_RADIUS:.2,SPLAT_FORCE:6000,COLOR_UPDATE_SPEED:10,SHADING:true,RAINBOW_MODE:false,COLOR:'#b06aff'}));`;
  },
}] });
await server.listen();
const address = server.httpServer.address();
const browser = await chromium.launch({ ...browserOptions, headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 560 } });
const errors = [];
page.on('pageerror', error => { errors.push(error.message); console.log(error.message); });
const results = { environment: 'Headless browser, 1000x560, no camera inference; real wall-clock fluid simulation', flow: [], slash: null };
const slashOnly = process.argv.includes('--slash-only');
if (slashOnly && fs.existsSync(`${output}/measurements.json`)) results.flow = JSON.parse(fs.readFileSync(`${output}/measurements.json`)).flow;
const summarize = samples => {
  const sorted = [...samples].sort((a, b) => a - b);
  return { median: sorted[Math.floor(sorted.length / 2)], p95: sorted[Math.floor(sorted.length * .95)] };
};
try {
  for (const density of slashOnly ? [] : [1.8, .25]) for (const shape of ['S', 'circle']) {
    await page.goto(`http://127.0.0.1:${address.port}/expansion-measurement?density=${density}`);
    await page.waitForSelector('#fluid');
    await page.waitForTimeout(400);
    const stroke = await page.evaluate(async shape => {
      const frames = []; let previous; let sequence = 0;
      await new Promise(resolve => {
        const draw = time => {
          if (previous) frames.push(time - previous); previous = time;
          const t = sequence / 120;
          const x = shape === 'S' ? .5 + .18 * Math.sin(t * Math.PI * 2) : .5 + .2 * Math.cos(t * Math.PI * 2);
          const y = shape === 'S' ? .22 + .56 * t : .5 + .32 * Math.sin(t * Math.PI * 2);
          window.measurePointer.current = { active: true, source: 'mouse', sequence: sequence++, timestamp: performance.now(), reset: t === 0, x, y };
          if (sequence <= 120) requestAnimationFrame(draw); else { window.measurePointer.current = null; resolve(); }
        }; requestAnimationFrame(draw);
      });
      return { end: Date.now(), frames };
    }, shape);
    const samples = []; let initial;
    for (const seconds of [0, 3, 10, 13]) {
      await page.waitForTimeout(Math.max(0, stroke.end + seconds * 1000 - Date.now()));
      const buffer = await page.screenshot({ path: `${output}/${shape}-${density}-${seconds}s.png` });
      const metric = await page.evaluate(async ({ url, initial }) => {
        const image = new Image(); image.src = url; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = 100; canvas.height = 56;
        const context = canvas.getContext('2d'); context.drawImage(image, 0, 0, 100, 56);
        const rgba = context.getImageData(0, 0, 100, 56).data;
        const luminance = Array.from({ length: 5600 }, (_, i) => .2126 * rgba[i * 4] + .7152 * rgba[i * 4 + 1] + .0722 * rgba[i * 4 + 2]);
        let dot = 0, norm = 0, referenceNorm = 0;
        if (initial) for (let i = 0; i < luminance.length; i++) { dot += luminance[i] * initial[i]; norm += luminance[i] ** 2; referenceNorm += initial[i] ** 2; }
        return { luminance, mean: luminance.reduce((a, b) => a + b, 0) / 5600, brightPixels: luminance.filter(x => x > 8).length, cosineToInitial: initial ? dot / Math.sqrt(norm * referenceNorm) || 0 : 1 };
      }, { url: `data:image/png;base64,${buffer.toString('base64')}`, initial });
      if (!initial) initial = metric.luminance;
      delete metric.luminance;
      samples.push({ seconds, actualElapsed: (Date.now() - stroke.end) / 1000, ...metric });
    }
    results.flow.push({ density, shape, strokeFrameMs: summarize(stroke.frames), samples });
    console.log(JSON.stringify(results.flow.at(-1)));
  }
  if (slashOnly) {
    await page.goto(`http://127.0.0.1:${address.port}/expansion-measurement?density=.25`);
    await page.waitForSelector('#fluid');
  }
  results.slash = await page.evaluate(async () => {
    window.measureRoot.unmount();
    const { createSlashScene } = await import('/src/effects/slashScene.js');
    const { createSlashGame } = await import('/src/game/slashGame.js');
    const game = createSlashGame(); game.start(0);
    document.body.innerHTML = ''; const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 560; document.body.append(canvas);
    const context = canvas.getContext('2d'); let active = 0;
    const radial = context.createRadialGradient.bind(context); context.createRadialGradient = (...args) => { active++; return radial(...args); };
    const scene = createSlashScene(context); scene.setSize(1000, 560, { x: 0, y: 0, width: 1000, height: 560 });
    const populations = []; let maximum = 0;
    for (let frame = 0; frame <= 6600; frame++) { scene.update(1 / 60, game.tick(3000 + frame / 60 * 1000)); active = 0; scene.draw(); maximum = Math.max(maximum, active); if (frame % 300 === 0) populations.push({ seconds: frame / 60, active }); }
    const draws = [], frames = []; let last;
    await new Promise(resolve => { const tick = time => { if (last) frames.push(time - last); last = time; const start = performance.now(); scene.update(1 / 60, game.tick(113000 + draws.length / 60 * 1000)); active = 0; scene.draw(); draws.push(performance.now() - start); if (draws.length < 180) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick); });
    const lateActive = active; scene.dispose();
    const fresh = createSlashScene(context); fresh.setSize(1000, 560, { x: 0, y: 0, width: 1000, height: 560 });
    const freshGame = createSlashGame(); freshGame.start(0);
    for (let i = 0; i < 59; i++) fresh.update(1 / 60, freshGame.tick(3000 + i / 60 * 1000)); active = 0; fresh.draw(); const beforeOneSecond = active;
    fresh.update(1 / 60, freshGame.tick(4000)); active = 0; fresh.draw(); const atOneSecond = active;
    fresh.dispose(); return { populations, maximum, lateActive, draws, frames, beforeOneSecond, atOneSecond };
  });
  results.slash.drawMs = summarize(results.slash.draws); results.slash.frameMs = summarize(results.slash.frames);
  delete results.slash.draws; delete results.slash.frames;
  results.errors = errors;
  fs.writeFileSync(`${output}/measurements.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.slash));
} finally { await browser.close(); await server.close(); }

