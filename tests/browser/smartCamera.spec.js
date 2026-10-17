import {test,expect} from '@playwright/test';
import {installArcadeClock} from './arcadeClock.js';
import {writeFileSync} from 'node:fs';

async function installCamera(page,{permission='granted',saved=null,storageBlocked=false,delay=false}={}) {
 await page.addInitScript(({permission,saved,storageBlocked,delay})=>{
  if(saved&&!localStorage.getItem('lumen.camera.v1'))localStorage.setItem('lumen.camera.v1',JSON.stringify(saved));
  if(storageBlocked){Object.defineProperty(window,'localStorage',{get(){throw Error('storage disabled');}});}
  const stats=window.cameraTest={attempts:0,active:0,peak:0,workers:0,peakWorkers:0,requests:[],pending:[],permission,devices:[{kind:'videoinput',deviceId:'desk',label:'Desk camera'},{kind:'videoinput',deviceId:'usb',label:'USB camera'}],started:null,tracking:null};
  const permissionStatus=new EventTarget();Object.defineProperty(permissionStatus,'state',{get:()=>stats.permission});
  Object.defineProperty(navigator.permissions,'query',{value:async()=>permissionStatus});
  Object.defineProperty(navigator.mediaDevices,'enumerateDevices',{value:async()=>stats.devices});
  Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async constraints=>{
   stats.attempts++;stats.requests.push(constraints);if(delay)await new Promise(resolve=>stats.pending.push(resolve));
   const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
   const ctx=canvas.getContext('2d');const draw=()=>{ctx.fillStyle='#151827';ctx.fillRect(0,0,640,480);ctx.fillStyle='#ccbbee';ctx.fillRect(200,80,200,360);};draw();
   const stream=canvas.captureStream(30),track=stream.getVideoTracks()[0],stop=track.stop.bind(track);
   stats.active++;stats.peak=Math.max(stats.peak,stats.active);let stopped=false;const timer=setInterval(draw,33);
   track.stop=()=>{if(!stopped){stopped=true;stats.active--;clearInterval(timer);}stop();};
   track.getSettings=()=>({deviceId:constraints.video.deviceId?.exact||'desk',facingMode:constraints.video.facingMode||'user'});
   stats.end=()=>{track.stop();track.dispatchEvent(new Event('ended'));};return stream;
  }});
  stats.revoke=()=>{stats.permission='denied';permissionStatus.dispatchEvent(new Event('change'));};
  stats.remove=()=>{stats.devices=stats.devices.filter(d=>d.deviceId!=='usb');navigator.mediaDevices.dispatchEvent(new Event('devicechange'));};
  window.Worker=class {
   constructor(url){this.url=String(url);this.closed=false;stats.workers++;stats.peakWorkers=Math.max(stats.peakWorkers,stats.workers);}
   postMessage(m){if(this.closed){m.frame?.close();return;}if(m.type==='init')queueMicrotask(()=>{if(!this.closed)this.onmessage?.({data:{type:'ready'}});});
    if(m.type==='frame'){m.frame?.close();if(this.url.includes('segmentation'))queueMicrotask(()=>{if(!this.closed){stats.tracking??=performance.now();this.onmessage?.({data:{type:'mask',width:24,height:18,values:new Float32Array(432).fill(1),timestamp:m.timestamp}});}});}}
   terminate(){if(!this.closed){this.closed=true;stats.workers--;}this.onmessage=null;}
  };
  const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=async function(){await play.call(this);stats.started=performance.now();};
 },{permission,saved,storageBlocked,delay});
}
const saved={version:1,remember:true,autoReconnect:true,deviceId:'usb',facingMode:'user'};
const settings=page=>page.getByRole('dialog',{name:'Camera settings'});
async function open(page){await page.getByRole('button',{name:'Camera settings',exact:true}).click();await expect(settings(page)).toBeVisible();}

test('camera preferences are explicit, selection survives reload and capture stops on disconnect',async({page})=>{
 await installCamera(page);await page.goto('/');expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
 await expect(page.getByText('Connecting remembers this camera and enables future auto-reconnect.')).toBeVisible();
 await open(page);await expect(settings(page).getByLabel('Remember My Camera',{exact:true})).toBeChecked();await expect(settings(page).getByLabel('Auto-Reconnect',{exact:true})).toBeChecked();
 await settings(page).getByRole('button',{name:'Connect Camera',exact:true}).click();await expect(settings(page).getByRole('status')).toContainText('tracking active');
 await settings(page).getByLabel('Remember My Camera',{exact:true}).check();await settings(page).getByLabel('Auto-Reconnect',{exact:true}).check();await settings(page).getByLabel('Preferred webcam',{exact:true}).selectOption('usb');
 await expect.poll(()=>page.evaluate(()=>cameraTest.requests.at(-1).video.deviceId?.exact)).toBe('usb');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.camera.v1')).deviceId)).toBe('usb');
 await page.reload();await expect(page.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);
 await open(page);await settings(page).getByRole('button',{name:'Disconnect Camera',exact:true}).click();await page.getByRole('button',{name:'Close camera settings'}).click();
 for(const mode of ['FLOW','SLASH','LAUNCH','GLOW'])await page.getByRole('button',{name:mode,exact:true}).click();expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);expect(await page.evaluate(()=>cameraTest.active)).toBe(0);expect(await page.evaluate(()=>cameraTest.workers)).toBe(0);
 await open(page);await settings(page).getByRole('button',{name:'Reconnect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(1);await settings(page).getByRole('button',{name:'Forget Preference',exact:true}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.camera.v1')))).toEqual({version:1,remember:false,autoReconnect:false,deviceId:'',facingMode:'user',startupConfirmed:false});
 await page.reload();expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);await open(page);await expect(settings(page).getByLabel('Remember My Camera',{exact:true})).not.toBeChecked();await expect(settings(page).getByLabel('Auto-Reconnect',{exact:true})).toBeDisabled();
});
test('editing default opt-ins before first capture cannot trigger automatic first connection',async({page})=>{
 await installCamera(page);await page.goto('/');await open(page);await expect(settings(page).getByText(/First connection is manual/)).toBeVisible();
 await settings(page).getByLabel('Auto-Reconnect',{exact:true}).uncheck();await settings(page).getByLabel('Auto-Reconnect',{exact:true}).check();
 await page.reload();expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);await open(page);await expect(settings(page).getByLabel('Auto-Reconnect',{exact:true})).toBeChecked();
 await settings(page).getByRole('button',{name:'Connect Camera',exact:true}).click();await expect(settings(page).getByRole('status')).toContainText('tracking active');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.camera.v1')).startupConfirmed)).toBe(true);
 await page.reload();await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(1);
});
test('explicit default opt-outs survive refresh without restoring capture',async({page})=>{
 await installCamera(page);await page.goto('/');await open(page);await settings(page).getByLabel('Auto-Reconnect',{exact:true}).uncheck();await page.reload();await open(page);await expect(settings(page).getByLabel('Remember My Camera',{exact:true})).toBeChecked();await expect(settings(page).getByLabel('Auto-Reconnect',{exact:true})).not.toBeChecked();
 await settings(page).getByLabel('Remember My Camera',{exact:true}).uncheck();await page.reload();expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);await open(page);await expect(settings(page).getByLabel('Remember My Camera',{exact:true})).not.toBeChecked();await expect(settings(page).getByLabel('Auto-Reconnect',{exact:true})).toBeDisabled();
});
for(const permission of ['prompt','denied'])test(`return with ${permission} permission offers manual reconnect without capture`,async({page})=>{
 await installCamera(page,{saved,permission});await page.goto('/');await open(page);await expect(settings(page).getByText(/browser.*permission|permission.*browser/i).first()).toBeVisible();expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);await settings(page).getByRole('button',{name:'Reconnect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(1);
});
for(const path of ['preview','tutorial','fallback'])test(`first connection disclosure remains visible through ${path}`,async({page})=>{
 await installCamera(page);await page.goto('/');
 if(path==='preview')await page.getByRole('button',{name:'Preview light',exact:true}).click();
 if(path==='tutorial')await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();
 if(path==='fallback'){await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();}
 const scope=path==='tutorial'?page.getByRole('dialog',{name:'ENERGY RUSH',exact:true}):page;
 await expect(scope.getByText(/Connecting remembers this camera and enables future auto-reconnect/)).toBeVisible();
 if(path!=='tutorial')await expect(scope.getByRole('button',{name:'ENABLE CAMERA',exact:true})).toHaveAccessibleDescription(/Connecting remembers this camera/);
 expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
});
test('revocation and removed preferred camera stop safely without falling back',async({page})=>{
 await installCamera(page,{saved});await page.goto('/');await expect(page.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');await page.evaluate(()=>cameraTest.revoke());await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(0);await open(page);await expect(settings(page).getByRole('status')).toContainText(/permission/i);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);
});
test('missing saved webcam exposes Change Camera and never requests default',async({page})=>{
 await installCamera(page,{saved:{...saved,deviceId:'missing'}});await page.goto('/');await open(page);await expect(settings(page).getByRole('status')).toContainText(/saved camera/i);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);await settings(page).getByLabel('Preferred webcam',{exact:true}).selectOption('desk');await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(1);
});
test('unavailable storage supports manual camera and explains session-only preferences',async({page})=>{
 await installCamera(page,{storageBlocked:true});await page.goto('/');await open(page);await settings(page).getByRole('button',{name:'Connect Camera',exact:true}).click();await settings(page).getByLabel('Remember My Camera',{exact:true}).check();await expect(settings(page).getByText(/this session only/i)).toBeVisible();await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(1);
});
test('cancelled startup and device switching release stale streams without overlap',async({page})=>{
 await installCamera(page,{delay:true});await page.goto('/');await open(page);await settings(page).getByRole('button',{name:'Connect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(1);await settings(page).getByRole('button',{name:'Disconnect Camera',exact:true}).click();await settings(page).getByRole('button',{name:'Reconnect Camera',exact:true}).click();
 await page.evaluate(()=>cameraTest.pending.shift()());await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(2);await page.evaluate(()=>cameraTest.pending.shift()());await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(1);expect(await page.evaluate(()=>cameraTest.peak)).toBe(1);
});
test('camera settings keyboard focus restores and compact viewports keep controls accessible',async({page})=>{
 await installCamera(page);await page.goto('/');for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);await open(page);await expect(settings(page).getByRole('button',{name:'Forget Preference',exact:true})).toBeVisible();await page.screenshot({path:`.test-artifacts/smart-camera-settings-${viewport.width}.png`});await page.keyboard.press('Escape');await expect(settings(page)).not.toBeVisible();await expect(page.getByRole('button',{name:'Camera settings',exact:true})).toBeFocused();}
});
test('synthetic return timing and fifty cycles retain one stream and clean up tracking',async({page},testInfo)=>{
 await installCamera(page,{saved});await page.goto('/');await expect(page.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');
 const timing=await page.evaluate(()=>({navigationToVideoMs:cameraTest.started,videoToFirstMaskMs:cameraTest.tracking-cameraTest.started,attempts:cameraTest.attempts,peakStreams:cameraTest.peak,peakWorkers:cameraTest.peakWorkers}));
 await page.evaluate(()=>{cameraTest.tracking=null;cameraTest.recoveryBegan=performance.now();cameraTest.end();});await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(2);await expect.poll(()=>page.evaluate(()=>cameraTest.tracking)).not.toBeNull();const recovery=await page.evaluate(()=>({lossToVideoMs:cameraTest.started-cameraTest.recoveryBegan,videoToFirstMaskMs:cameraTest.tracking-cameraTest.started,lossToFirstMaskMs:cameraTest.tracking-cameraTest.recoveryBegan}));
 await open(page);for(let i=0;i<50;i++){await settings(page).getByRole('button',{name:'Disconnect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.workers)).toBe(0);await settings(page).getByRole('button',{name:'Reconnect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(1);}
 await settings(page).getByRole('button',{name:'Disconnect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.workers)).toBe(0);const cleanup=await page.evaluate(()=>({activeStreams:cameraTest.active,workers:cameraTest.workers,peakStreams:cameraTest.peak,attempts:cameraTest.attempts}));await testInfo.attach('synthetic-camera-timing',{body:JSON.stringify({timing,recovery,cleanup},null,2),contentType:'application/json'});writeFileSync('docs/smart-camera-synthetic-timing.json',JSON.stringify({environment:'Headless Edge; synthetic canvas stream, mocked permissions and tracker; not physical webcam latency',timing,recovery,cleanup},null,2)+'\n');expect(cleanup).toEqual({activeStreams:0,workers:0,peakStreams:1,attempts:52});
});
test('a new browser context restores a genuinely saved choice without a fresh opt-in',async({page,browser})=>{
 await installCamera(page);await page.goto('/');await open(page);await settings(page).getByRole('button',{name:'Connect Camera',exact:true}).click();await expect(settings(page).getByRole('status')).toContainText('tracking active');await settings(page).getByLabel('Remember My Camera',{exact:true}).check();await settings(page).getByLabel('Auto-Reconnect',{exact:true}).check();const state=await page.context().storageState();const context=await browser.newContext({storageState:state});
 try{const second=await context.newPage();await installCamera(second);await second.goto('/');await expect(second.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');expect(await second.evaluate(()=>cameraTest.attempts)).toBe(1);expect(await second.evaluate(()=>cameraTest.requests[0].video.deviceId.exact)).toBe('desk');}finally{await context.close();}
});
test('removed hardware never silently falls back and bounded recovery does not loop',async({page})=>{
 await installCamera(page,{saved});await page.goto('/');await expect(page.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');await page.evaluate(()=>{cameraTest.remove();cameraTest.end();});await open(page);await expect(settings(page).getByRole('status')).toContainText(/saved camera/i);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);expect(await page.evaluate(()=>cameraTest.active)).toBe(0);
});
test('camera settings pause an assisted round and closing requires explicit resume',async({page})=>{
 await installCamera(page);await installArcadeClock(page);await page.goto('/');await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch',exact:true}).click();await page.getByRole('button',{name:'START GAME',exact:true}).click();await page.evaluate(()=>window.advance(3.1));const time=await page.getByLabel('Time remaining').textContent();
 await open(page);await page.evaluate(()=>window.advance(10));await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeVisible();await expect(page.getByLabel('Time remaining')).toHaveText(time);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
});
test('all experiences and gallery navigation retain one camera and only the selected tracking worker',async({page})=>{
 await installCamera(page,{saved});await page.goto('/');await expect(page.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');for(const mode of ['FLOW','SLASH','LAUNCH','GLOW']){await page.getByRole('button',{name:mode,exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.workers)).toBe(1);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);expect(await page.evaluate(()=>cameraTest.active)).toBe(1);}
 await page.getByRole('button',{name:'ECHOES',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.workers)).toBe(0);expect(await page.evaluate(()=>cameraTest.active)).toBe(1);await page.getByRole('button',{name:'BACK TO LUMEN',exact:true}).click();await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);expect(await page.evaluate(()=>cameraTest.peak)).toBe(1);
});
