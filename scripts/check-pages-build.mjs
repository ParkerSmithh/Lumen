import { chromium, expect } from '@playwright/test';
import { preview } from 'vite';
import { readFile } from 'node:fs/promises';

const target = process.argv[2] || 'http://127.0.0.1:4173/Lumen/';
if (!new URL(target).pathname.endsWith('/Lumen/')) throw new Error('Verify the production /Lumen/ path.');
let server, browser;
try {
  if (!process.argv[2]) server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [], failed = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  page.on('console', message => {
    // MediaPipe sends this harmless initialization notice through console.error.
    if (message.type() === 'error' && !message.text().startsWith('INFO: Created TensorFlow Lite XNNPACK delegate for CPU.')) errors.push(message.text());
  });
  await page.goto(target+'?debugTracking');
  if(await page.locator('[aria-label="Development tracking diagnostics"]').count()||await page.evaluate(()=>!!window.__lumenTracking))throw new Error('Development diagnostics escaped into production.');
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
  await page.screenshot({ path: '.test-artifacts/repair-glow-1366.png' });
  for (const mode of ['FLOW', 'SLASH', 'LAUNCH']) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    await expect(page.getByRole('button',{name:'Blue',exact:true})).toHaveAttribute('aria-pressed','true');
    if(await page.locator('[aria-label="Development tracking diagnostics"]').count())throw new Error('Production diagnostic overlay');
    await page.getByRole('button', { name: 'Mouse / touch fallback' }).click();
    const canvas = mode === 'FLOW' ? '#fluid' : mode === 'SLASH' ? '.slash-artwork' : '.launch-artwork canvas';
    await expect(page.locator(canvas)).toBeVisible();
    await page.waitForTimeout(1400);
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
  if (errors.length || failed.length) throw new Error(JSON.stringify({ errors, failed }));
  console.log(JSON.stringify({ target, assets: assets.length, inference, lazyLaunch: true, layout: 'all modes, five viewport sizes', consoleErrors: 0 }));
} finally {
  await browser?.close();
  if (server) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
