import {enterArtwork} from '../tests/browser/enterArtwork.js';
import {preview} from 'vite';
import {chromium, expect} from '@playwright/test';
import {browserOptions} from './browser-options.mjs';

// Exercise the actual built /Lumen/ entry and native tracking workers. Only the
// permission/device boundary and the camera source are synthetic; no webcam opens.
const server = await preview({preview:{host:'127.0.0.1', port:4174, strictPort:true}});
let browser;
try {
  browser = await chromium.launch({...browserOptions, headless:true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({status:200,contentType:'text/css',body:'/* Offline font fallback */'}));
  await page.addInitScript(() => {
    localStorage.setItem('lumen.camera.v1', JSON.stringify({version:1,remember:true,autoReconnect:true,deviceId:'synthetic',facingMode:'user'}));
    const stats = window.cameraBuildCheck = {attempts:0, active:0, peak:0, workers:0};
    const permission = new EventTarget(); permission.state = 'granted';
    Object.defineProperty(navigator.permissions, 'query', {value:async () => permission});
    Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', {value:async () => [{kind:'videoinput',deviceId:'synthetic',label:'Synthetic camera'}]});
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {value:async constraints => {
      if (constraints.video.deviceId?.exact !== 'synthetic' || constraints.audio !== false) throw Error('Unexpected capture constraints');
      stats.attempts++;
      const canvas = document.createElement('canvas'); canvas.width=640;canvas.height=480;
      const ctx=canvas.getContext('2d'), draw=()=>{ctx.fillStyle='#17121d';ctx.fillRect(0,0,640,480);};draw();
      const stream=canvas.captureStream(30), track=stream.getVideoTracks()[0], stop=track.stop.bind(track);
      stats.active++;stats.peak=Math.max(stats.peak,stats.active);
      let stopped=false;const timer=setInterval(draw,33);
      track.stop=()=>{if(!stopped){stopped=true;stats.active--;clearInterval(timer);}stop();};
      track.getSettings=()=>({deviceId:'synthetic',facingMode:'user'});
      return stream;
    }});
    const NativeWorker=window.Worker;
    window.Worker=class extends NativeWorker {
      constructor(...args){super(...args);stats.workers++;this.counted=true;}
      terminate(){if(this.counted){stats.workers--;this.counted=false;}super.terminate();}
    };
  });
  await page.goto('http://127.0.0.1:4174/Lumen/');await enterArtwork(page);
  const input=page.getByRole('status',{name:'Input status'});
  await expect(input).toContainText(/Camera ready|Body tracking active/, {timeout:30000});
  expect(await page.evaluate(()=>cameraBuildCheck.attempts)).toBe(1);
  await page.getByRole('button',{name:'Camera settings',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Camera settings'});
  await expect(dialog.getByLabel('Remember My Camera',{exact:true})).toBeChecked();
  await expect(dialog.getByLabel('Auto-Reconnect',{exact:true})).toBeChecked();
  await dialog.getByRole('button',{name:'Disconnect Camera',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>cameraBuildCheck.workers)).toBe(0);
  expect(await page.evaluate(()=>cameraBuildCheck.active)).toBe(0);
  await page.getByRole('button',{name:'Close camera settings'}).click();
  for(const mode of ['FLOW','SLASH','LAUNCH','GLOW'])await page.getByRole('button',{name:mode==='LAUNCH'?'KINETIC':mode,exact:true}).click();
  expect(await page.evaluate(()=>cameraBuildCheck.attempts)).toBe(1);
  await page.getByRole('button',{name:'Camera settings',exact:true}).click();
  await dialog.getByRole('button',{name:'Reconnect Camera',exact:true}).click();
  await expect(dialog.getByRole('status')).toContainText(/tracking active|move into view/, {timeout:30000});
  await dialog.getByRole('button',{name:'Forget Preference',exact:true}).click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.camera.v1')))).toEqual({version:1,remember:false,autoReconnect:false,deviceId:'',facingMode:'user',startupConfirmed:false});
  await dialog.getByRole('button',{name:'Disconnect Camera',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>cameraBuildCheck.workers)).toBe(0);
  const resources=await page.evaluate(()=>cameraBuildCheck);
  expect(resources).toEqual({attempts:2,active:0,peak:1,workers:0});
  expect(errors).toEqual([]);
  console.log(JSON.stringify({target:'built /Lumen/',source:'synthetic camera, mocked permission; real tracking worker',resources,pageErrors:errors.length,physicalWebcam:'NOT RUN'}));
} finally {await browser?.close();await server.close();}
