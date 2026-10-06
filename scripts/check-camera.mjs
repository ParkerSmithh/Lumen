import { chromium } from '@playwright/test';
import { preview } from 'vite';
const server = await preview({ preview: { host: '127.0.0.1', port: 4174, strictPort: true } });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ permissions: ['camera'], viewport: { width: 1440, height: 900 } });
try {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4174/Lumen/');
  const devices = await page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === 'videoinput').length);
  console.log(`Physical video input devices reported: ${devices}`);
  await page.getByRole('button', { name: 'Enter with camera' }).click();
  await page.waitForFunction(() => { const video = document.querySelector('video'); return video?.videoWidth > 0 || /denied|found|could not|another app/.test(document.querySelector('[role=status]').textContent); }, { timeout: 15000 });
  console.log(await page.evaluate(() => ({ status: document.querySelector('[role=status]').textContent, videoWidth: document.querySelector('video').videoWidth, videoHeight: document.querySelector('video').videoHeight })));
  if (await page.locator('video').evaluate(video => video.videoWidth > 0)) {
    await page.waitForFunction(() => /Become light|Step into view|unavailable/.test(document.querySelector('[role=status]').textContent), null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    console.log('GLOW:', await page.getByRole('status').innerText(), 'Real body detected:', /Become light/.test(await page.getByRole('status').innerText()));
    await page.screenshot({ path: '.test-artifacts/real-camera-artwork.png' });
    await page.getByRole('button',{name:'FLOW',exact:true}).click();
    await page.waitForFunction(()=>/Raise your index finger|Move to create|Hand tracking is unavailable/.test(document.querySelector('[role=status]').textContent),{timeout:30000});
    let handDetected=false;
    for(let i=0;i<20;i++) {
      if(/Move to create/.test(await page.getByRole('status').innerText()))handDetected=true;
      await page.waitForTimeout(250);
    }
    console.log('FLOW:',await page.getByRole('status').innerText(),'Real hand detected:',handDetected);
    await page.screenshot({path:'.test-artifacts/real-camera-flow.png'});
    await page.getByRole('button',{name:'SLASH',exact:true}).click();
    let slashHandDetected=false;
    for(let i=0;i<20;i++){
      if(/Slash through the light/.test(await page.getByRole('status').innerText()))slashHandDetected=true;
      await page.waitForTimeout(250);
    }
    console.log('SLASH:',await page.getByRole('status').innerText(),'Real hand detected:',slashHandDetected);
    await page.screenshot({path:'.test-artifacts/real-camera-slash.png'});
    await page.getByRole('button',{name:'LAUNCH',exact:true}).click();
    let launchHandDetected=false;
    for(let i=0;i<20;i++){
      if(/Move slowly/.test(await page.getByRole('status').innerText()))launchHandDetected=true;
      await page.waitForTimeout(250);
    }
    console.log('LAUNCH:',await page.getByRole('status').innerText(),'Real hand detected:',launchHandDetected);
    await page.screenshot({path:'.test-artifacts/real-camera-launch.png'});
    await page.getByRole('button',{name:'GLOW',exact:true}).click();
    await page.getByRole('button', { name: 'Stop camera' }).click();
    console.log('Stream released:', await page.locator('video').evaluate(video => video.srcObject === null));
    await page.getByRole('button', { name: 'Enter with camera', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('video').videoWidth > 0, null, { timeout: 15000 });
    console.log('Re-enter camera ready:', await page.locator('video').evaluate(video => video.srcObject?.getVideoTracks()[0]?.readyState === 'live'));
    await page.getByRole('button', { name: 'Stop camera' }).click();
  }
} finally {
  await context.close(); await browser.close();
  await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
}
