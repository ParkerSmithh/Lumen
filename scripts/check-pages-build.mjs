import { shapePath } from '../src/game/lightTrace.js';
import { installFrameClock } from '../tests/browser/frameClock.js';
import { browserOptions } from './browser-options.mjs';
import { chromium, expect as baseExpect } from '@playwright/test';
const expect = baseExpect.configure({ timeout: Number(process.env.LUMEN_EXPECT_TIMEOUT || 5000) });
import { preview } from 'vite';
import { readFile } from 'node:fs/promises';

const referenceClock = process.env.LUMEN_REFERENCE_CLOCK === '1';
const offlineFonts = process.env.LUMEN_OFFLINE_FONTS === '1';
const target = process.argv[2] || 'http://127.0.0.1:4173/Lumen/';
if (!new URL(target).pathname.endsWith('/Lumen/')) throw new Error('Verify the production /Lumen/ path.');
let server, browser;
try {
  if (!process.argv[2]) server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
  browser = await chromium.launch({ ...browserOptions, headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  if (referenceClock) await installFrameClock(page);
  if (offlineFonts) await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '/* Verify the supported system font fallback. */' }));
  const errors = [], failed = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  page.on('console', message => {
    // MediaPipe sends this harmless initialization notice through console.error.
    if (message.type() === 'error' && !message.text().startsWith('INFO: Created TensorFlow Lite XNNPACK delegate for CPU.')) errors.push(message.text());
  });
  await page.goto(target+'?debugTracking&debugTrace&debugKinetic');
  if(await page.locator('[aria-label="Development tracking diagnostics"]').count()||await page.evaluate(()=>!!window.__lumenTracking||!!window.__lumenSlash))throw new Error('Development diagnostics escaped into production.');
  await expect(page.getByRole('heading', { name: 'LUMEN' })).toBeVisible();
  const localHTML = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  const entry = localHTML.match(/src="([^"]+\/assets\/index-[^"]+\.js)"/)?.[1];
  if (!entry || !requests.some(url => new URL(url).pathname === entry)) throw new Error('Deployment does not match the verified build.');
  if (requests.some(url => /LaunchMode-.*\.js/.test(url))) throw new Error('LAUNCH loaded before selection.');

  const assets = ['segmentation.worker.js', 'hand-tracking.worker.js', 'models/selfie_segmenter.tflite', 'models/hand_landmarker.task',
    'vision/vision_bundle.js', 'vision/vision_wasm_internal.js', 'vision/vision_wasm_internal.wasm',
    'vision/vision_wasm_module_internal.js', 'vision/vision_wasm_module_internal.wasm',
    'vision/vision_wasm_nosimd_internal.js', 'vision/vision_wasm_nosimd_internal.wasm'];
  const favicon = await page.locator('link[rel="icon"]').getAttribute('href');
  assets.push(favicon);
  for (const asset of assets) {
    const url = new URL(asset, target);
    if (!url.pathname.startsWith('/Lumen/')) throw new Error(`Asset escapes deployment path: ${url.pathname}`);
    const response = await page.request.get(url.href);
    if (!response.ok() || /text\/html/.test(response.headers()['content-type'] || '')) throw new Error(`Missing production asset: ${url.pathname}`);
    await response.dispose();
  }
  const inference = await page.evaluate(async () => {
    const results = [];
    for (const name of ['segmentation.worker.js', 'hand-tracking.worker.js']) {
      const worker = new Worker(new URL(name, location.href));
      results.push(await new Promise(resolve => {
        const finish = result => { clearTimeout(timer); worker.terminate(); resolve(result); };
        const timer = setTimeout(() => finish({ name, error: 'timeout' }), 30000);
        worker.onerror = event => finish({ name, error: event.message });
        worker.onmessage = ({ data }) => {
          if (data.type === 'ready') {
            const canvas = new OffscreenCanvas(320, 240); canvas.getContext('2d').fillRect(0, 0, 320, 240);
            const frame = canvas.transferToImageBitmap(); worker.postMessage({ type: 'frame', frame, timestamp: 1 }, [frame]);
          } else finish({ name, type: data.type, error: data.message, detected: !!data.landmarks, maskLength: data.values?.length });
        };
        worker.postMessage({ type: 'init', assetBase: new URL('./', location.href).href });
      }));
    }
    return results;
  });
  if (inference.some(result => result.error) || inference[0].type !== 'mask' || inference[1].type !== 'hand') throw new Error(JSON.stringify(inference));
  await page.screenshot({ path: '.test-artifacts/repair-entry-1366.png' });
  await page.getByRole('button',{name:'Blue',exact:true}).click();
  await page.getByRole('button', { name: 'Preview light' }).click();
  await expect(page.getByLabel('Interaction guide')).toContainText('SHOW YOURSELF');
  await page.screenshot({ path: '.test-artifacts/repair-glow-1366.png' });
  for (const mode of ['FLOW', 'SLASH', 'LAUNCH']) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    await expect(page.getByRole('button',{name:'Blue',exact:true})).toHaveAttribute('aria-pressed','true');
    if(await page.locator('[aria-label="Development tracking diagnostics"]').count()||await page.evaluate(()=>!!window.__lumenTrace||!!window.__lumenKinetic))throw new Error('Production diagnostic overlay');
    for(const label of ({FLOW:['POINT + MOVE'],SLASH:['SWIPE TO SLASH'],LAUNCH:['POINT + RAPID PUSH','CLOSE HAND','MOVE + RELEASE']})[mode])await expect(page.getByLabel('Interaction guide')).toContainText(label);
    await page.getByRole('button', { name: 'Mouse / touch fallback' }).click();
    if (['FLOW','SLASH','LAUNCH'].includes(mode)) {
      await page.getByRole('button', { name: 'START', exact: true }).click();
      await expect(page.getByLabel('Time remaining')).toBeVisible({ timeout: 30000 });
    }
    const canvas = mode === 'FLOW' ? '#fluid' : mode === 'SLASH' ? '.slash-artwork' : '.launch-artwork canvas';
    await expect(page.locator(canvas)).toBeVisible();
    if (mode === 'SLASH' && referenceClock) {
      const started = await page.evaluate(() => performance.now());
      await page.waitForFunction(start => performance.now() - start >= 1400, started, { timeout: 60000 });
    } else await page.waitForTimeout(1400);
    if (mode === 'SLASH') {
      await page.mouse.move(1366 * .3, 768 * .535); await page.mouse.down();
      for (let x = 1366 * .32; x < 1366 * .72; x += 1366 * .025) { await page.mouse.move(x, 768 * .535); await page.waitForTimeout(16); }
      await page.mouse.up();
      await expect(page.getByRole('status')).toContainText('Cut registered');
    } else {
      if(mode==='LAUNCH')await page.mouse.click(420,360);
      await page.mouse.move(420, 360); await page.waitForTimeout(70); await page.mouse.move(600, 380, { steps: 12 });
    }
    await page.screenshot({ path: `.test-artifacts/repair-${mode.toLowerCase()}-1366.png` });
  }
  if (!requests.some(url => /\/Lumen\/assets\/LaunchMode-.*\.js/.test(url))) throw new Error('LAUNCH dynamic chunk was not requested from /Lumen/.');
  await page.getByRole('button', { name: 'GLOW', exact: true }).click();
  for (const size of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 480 }, { width: 800, height: 400 }]) {
    await page.setViewportSize(size);
    for (const mode of ['GLOW', 'FLOW', 'SLASH', 'LAUNCH']) {
      await page.getByRole('button', { name: mode, exact: true }).click();
      if (mode === 'LAUNCH') await expect(page.locator('.launch-artwork canvas')).toBeVisible();
      const layout = await page.evaluate(() => ({ scroll: document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth,
        controls: [...document.querySelectorAll('nav button, footer button')].map(element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom }; }) }));
      if (layout.scroll || layout.controls.some(r => r.x < 0 || r.y < 0 || r.right > size.width || r.bottom > size.height)) throw new Error(`Overflow in ${mode} at ${size.width}×${size.height}`);
    }
    await page.getByRole('button', { name: 'GLOW', exact: true }).click();
    await page.screenshot({ path: `.test-artifacts/repair-entry-${size.width}.png` });
  }
  const gamePage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  gamePage.on('pageerror', error => errors.push(error.message));
  if (offlineFonts) await gamePage.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await gamePage.addInitScript(() => {
    const now = performance.now.bind(performance), raf = requestAnimationFrame.bind(window); let offset = 0;
    performance.now = () => now() + offset;
    window.requestAnimationFrame = callback => raf(time => callback(time + offset));
    window.advanceGameTime = seconds => { offset += seconds * 1000; };
    Math.random = () => .5;
  });
  const advance = async seconds => {
    await gamePage.evaluate(seconds => window.advanceGameTime(seconds), seconds);
    await gamePage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  await gamePage.goto(target + '?debugSlash&debugEchoes');
  if (await gamePage.evaluate(() => !!window.__lumenSlash||!!window.__lumenEchoes)) throw new Error('SLASH diagnostics escaped into production.');
  await gamePage.getByRole('button', { name: 'SLASH', exact: true }).click();
  await expect(gamePage.getByRole('button', { name: 'START', exact: true })).toBeDisabled();
  await gamePage.getByRole('button', { name: 'Mouse / touch fallback' }).click();
  await gamePage.getByRole('button', { name: 'START', exact: true }).focus(); await gamePage.keyboard.press('Enter');
  await expect(gamePage.getByLabel('Starting in')).toHaveText('3');
  await advance(1); await expect(gamePage.getByLabel('Starting in')).toHaveText('2');
  await advance(1); await expect(gamePage.getByLabel('Starting in')).toHaveText('1');
  await advance(1); await expect(gamePage.getByLabel('Time remaining')).toHaveText('2:00');
  await advance(120); await expect(gamePage.getByLabel('Final result')).toHaveText('0 SLASHED');
  await expect(gamePage.getByLabel('Time remaining')).toHaveText('0:00');
  await gamePage.getByRole('button', { name: 'PLAY AGAIN', exact: true }).click();
  await expect(gamePage.getByLabel('Starting in')).toHaveText('3');
  await gamePage.getByRole('button', { name: 'FLOW', exact: true }).click();
  await gamePage.getByRole('button', { name: 'SLASH', exact: true }).click();
  await expect(gamePage.getByRole('button', { name: 'START', exact: true })).toBeVisible();
  for(const [mode,duration] of [['FLOW',90],['LAUNCH',120]]){
    await gamePage.getByRole('button',{name:mode,exact:true}).click();
    await expect(gamePage.getByRole('button',{name:'START',exact:true})).toBeDisabled();
    await gamePage.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();
    await gamePage.getByRole('button',{name:'START',exact:true}).click();await advance(3);
    await expect(gamePage.getByLabel('Time remaining')).toHaveText(duration===90?'1:30':'2:00');
    await expect(gamePage.getByLabel('Score',{exact:true})).toHaveText('0');
    if(mode==='FLOW'){
      for(const p of shapePath(0,{x:.16,y:.3,width:.68,height:.38},1366,768)){await gamePage.mouse.move(p.x*1366,p.y*768);await gamePage.waitForTimeout(16);}
    }else await gamePage.mouse.click(683,384);
    const expectedScore=mode==='FLOW'?200:100;
    await expect(gamePage.getByLabel('Score',{exact:true})).toHaveText(String(expectedScore));
    await advance(duration);
    await expect(gamePage.getByText('NEW BEST',{exact:true})).toBeVisible();
    const saved=await gamePage.evaluate(mode=>JSON.parse(localStorage.getItem('lumen.arcade.bests.v1.'+mode)).metrics,mode);
    if(saved.score!==expectedScore||saved.count!==1)throw new Error('Incorrect production arcade record '+mode);
    await expect(gamePage.getByRole('button',{name:'PLAY AGAIN',exact:true})).toBeVisible();
    await gamePage.getByRole('button',{name:'PLAY AGAIN',exact:true}).click();await expect(gamePage.getByLabel('Starting in')).toHaveText('3');
  }
  await advance(3);
  const echoTime=await gamePage.getByLabel('Time remaining').textContent();
  await gamePage.getByRole('button',{name:'ECHOES',exact:true}).click();
  await expect(gamePage.getByRole('img',{name:/Generative echo artwork from FLOW, LAUNCH/})).toBeVisible();
  const pngPromise=gamePage.waitForEvent('download');await gamePage.getByRole('button',{name:'SAVE IMAGE',exact:true}).click();
  const png=await pngPromise,pngBytes=await readFile(await png.path());
  if(pngBytes.readUInt32BE(16)!==2048||pngBytes.readUInt32BE(20)!==2048)throw new Error('Wrong ECHOES export dimensions');
  await advance(30);await gamePage.getByRole('button',{name:'BACK TO LUMEN'}).click();
  await expect(gamePage.getByRole('button',{name:'RESUME',exact:true})).toBeVisible();
  await expect(gamePage.getByLabel('Time remaining')).toHaveText(echoTime);
  await gamePage.getByRole('button',{name:'ECHOES',exact:true}).click();
  await gamePage.getByRole('button',{name:'CLEAR ECHOES'}).click();await gamePage.getByRole('button',{name:'CLEAR ARTWORK AND CORE'}).click();
  await expect(gamePage.getByRole('button',{name:'SAVE IMAGE'})).toBeDisabled();
  await gamePage.close();
  if (errors.length || failed.length) throw new Error(JSON.stringify({ errors, failed }));
  console.log(JSON.stringify({ target, referenceClock, offlineFonts, assets: assets.length, inference, echoes:"actual FLOW/LAUNCH artwork, 2048 PNG, pause/back/clear verified", lazyLaunch: true, layout: 'all modes, five viewport sizes', consoleErrors: 0, interactionGuides: 'four modes verified', slashGame: 'ready, keyboard countdown, 120-second expiry, results, replay, mode reset verified',flowGame:'90-second expiry, exact trace score 200, saved best and replay verified',kineticGame:'120-second expiry, target score 100, saved best and replay verified' }));
} finally {
  await browser?.close();
  if (server) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
