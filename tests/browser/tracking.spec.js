import { test, expect } from '@playwright/test';
test('real model initializes and processes an input frame', async ({ browser }) => {
  const context = await browser.newContext({ permissions: ['camera'] });
  const page = await context.newPage();
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const worker = new Worker('/segmentation.worker.js');
    return await new Promise(resolve => {
      const timeout = setTimeout(() => { worker.terminate(); resolve({ error: 'timeout' }); }, 30000);
      worker.onerror = event => { clearTimeout(timeout); worker.terminate(); resolve({ error: event.message }); };
      worker.onmessage = async ({ data }) => {
        if (data.type === 'ready') {
          const canvas = new OffscreenCanvas(320, 240); const ctx = canvas.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0,0,320,240);
          const frame = canvas.transferToImageBitmap(); worker.postMessage({ type: 'frame', frame, timestamp: 1 }, [frame]);
        } else { clearTimeout(timeout); worker.terminate(); resolve({ type: data.type, error: data.message, width: data.width, length: data.values?.length }); }
      };
      worker.postMessage({ type: 'init', origin: location.origin });
    });
  });
  expect(result.error).toBeUndefined(); expect(result.type).toBe('mask'); expect(result.length).toBeGreaterThan(0);
  await context.close();
});
