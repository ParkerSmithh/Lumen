import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ permissions: ['camera'], viewport: { width: 1440, height: 900 } });
try {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173');
  const devices = await page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === 'videoinput').length);
  console.log(`Physical video input devices reported: ${devices}`);
  await page.getByRole('button', { name: 'Enter with camera' }).click();
  await page.waitForFunction(() => { const video = document.querySelector('video'); return video?.videoWidth > 0 || /denied|found|could not|another app/.test(document.querySelector('[role=status]').textContent); }, { timeout: 15000 });
  console.log(await page.evaluate(() => ({ status: document.querySelector('[role=status]').textContent, videoWidth: document.querySelector('video').videoWidth, videoHeight: document.querySelector('video').videoHeight })));
  if (await page.locator('video').evaluate(video => video.videoWidth > 0)) {
    await page.waitForFunction(() => /Presence detected|Step into view|could not load/.test(document.querySelector('[role=status]').textContent), { timeout: 30000 });
    await page.waitForTimeout(1500);
    console.log('Tracking:', await page.getByRole('status').innerText());
    await page.screenshot({ path: '.test-artifacts/real-camera-artwork.png' });
    await page.getByRole('button', { name: 'Stop camera' }).click();
    console.log('Stream released:', await page.locator('video').evaluate(video => video.srcObject === null));
  }
} finally { await context.close(); await browser.close(); }
