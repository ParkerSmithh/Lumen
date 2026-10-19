import {installCamera} from './cameraSimulation.js';
import {enterArtwork} from './enterArtwork.js';
import {test,expect} from '@playwright/test';
import {installArcadeClock} from './arcadeClock.js';
import {writeFileSync} from 'node:fs';


const saved={version:1,remember:true,autoReconnect:true,deviceId:'usb',facingMode:'user'};
const settings=page=>page.getByRole('dialog',{name:'Camera settings'});
async function open(page){await page.getByRole('button',{name:'Camera settings',exact:true}).click();await expect(settings(page)).toBeVisible();}

test('camera preferences are explicit, selection survives reload and capture stops on disconnect',async({page})=>{
 await installCamera(page);await page.goto('/');await enterArtwork(page);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
 await expect(page.getByText('Connecting remembers this camera and enables future auto-reconnect.')).toBeVisible();
 await open(page);await expect(settings(page).getByLabel('Remember My Camera',{exact:true})).toBeChecked();await expect(settings(page).getByLabel('Auto-Reconnect',{exact:true})).toBeChecked();
 await settings(page).getByRole('button',{name:'Connect Camera',exact:true}).click();await expect(settings(page).getByRole('status')).toContainText('tracking active');
 await settings(page).getByLabel('Remember My Camera',{exact:true}).check();await settings(page).getByLabel('Auto-Reconnect',{exact:true}).check();await settings(page).getByLabel('Preferred webcam',{exact:true}).selectOption('usb');
 await expect.poll(()=>page.evaluate(()=>cameraTest.requests.at(-1).video.deviceId?.exact)).toBe('usb');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.camera.v1')).deviceId)).toBe('usb');
 await page.reload();await enterArtwork(page);await expect(page.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);
 await open(page);await settings(page).getByRole('button',{name:'Disconnect Camera',exact:true}).click();await page.getByRole('button',{name:'Close camera settings'}).click();
 for(const mode of ['FLOW','SLASH','LAUNCH','GLOW'])await page.getByRole('button',{name:mode==='LAUNCH'?'KINETIC':mode,exact:true}).click();expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);expect(await page.evaluate(()=>cameraTest.active)).toBe(0);expect(await page.evaluate(()=>cameraTest.workers)).toBe(0);
 await open(page);await settings(page).getByRole('button',{name:'Reconnect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(1);await settings(page).getByRole('button',{name:'Forget Preference',exact:true}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.camera.v1')))).toEqual({version:1,remember:false,autoReconnect:false,deviceId:'',facingMode:'user',startupConfirmed:false});
 await page.reload();await enterArtwork(page);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);await open(page);await expect(settings(page).getByLabel('Remember My Camera',{exact:true})).not.toBeChecked();await expect(settings(page).getByLabel('Auto-Reconnect',{exact:true})).toBeDisabled();
});
test('editing default opt-ins before first capture cannot trigger automatic first connection',async({page})=>{
 await installCamera(page);await page.goto('/');await enterArtwork(page);await open(page);await expect(settings(page).getByText(/First connection is manual/)).toBeVisible();
 await settings(page).getByLabel('Auto-Reconnect',{exact:true}).uncheck();await settings(page).getByLabel('Auto-Reconnect',{exact:true}).check();
 await page.reload();await enterArtwork(page);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);await open(page);await expect(settings(page).getByLabel('Auto-Reconnect',{exact:true})).toBeChecked();
 await settings(page).getByRole('button',{name:'Connect Camera',exact:true}).click();await expect(settings(page).getByRole('status')).toContainText('tracking active');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.camera.v1')).startupConfirmed)).toBe(true);
 await page.reload();await enterArtwork(page);await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(1);
});
test('explicit default opt-outs survive refresh without restoring capture',async({page})=>{
 await installCamera(page);await page.goto('/');await enterArtwork(page);await open(page);await settings(page).getByLabel('Auto-Reconnect',{exact:true}).uncheck();await page.reload();await enterArtwork(page);await open(page);await expect(settings(page).getByLabel('Remember My Camera',{exact:true})).toBeChecked();await expect(settings(page).getByLabel('Auto-Reconnect',{exact:true})).not.toBeChecked();
 await settings(page).getByLabel('Remember My Camera',{exact:true}).uncheck();await page.reload();await enterArtwork(page);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);await open(page);await expect(settings(page).getByLabel('Remember My Camera',{exact:true})).not.toBeChecked();await expect(settings(page).getByLabel('Auto-Reconnect',{exact:true})).toBeDisabled();
});
for(const permission of ['prompt','denied'])test(`return with ${permission} permission offers manual reconnect without capture`,async({page})=>{
 await installCamera(page,{saved,permission});await page.goto('/');await enterArtwork(page);await open(page);await expect(settings(page).getByText(/browser.*permission|permission.*browser/i).first()).toBeVisible();expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);await settings(page).getByRole('button',{name:'Reconnect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(1);
});
for(const path of ['preview','tutorial','fallback'])test(`first connection disclosure remains visible through ${path}`,async({page})=>{
 await installCamera(page);await page.goto('/');await enterArtwork(page);
 if(path==='preview')await page.getByRole('button',{name:'Preview light',exact:true}).click();
 if(path==='tutorial')await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();
 if(path==='fallback'){await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();}
 const scope=path==='tutorial'?page.getByRole('dialog',{name:'ENERGY RUSH',exact:true}):page;
 await expect(scope.getByText(/Connecting remembers this camera and enables future auto-reconnect/)).toBeVisible();
 if(path!=='tutorial')await expect(scope.getByRole('button',{name:'ENABLE CAMERA',exact:true})).toHaveAccessibleDescription(/Connecting remembers this camera/);
 expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
});
test('revocation and removed preferred camera stop safely without falling back',async({page})=>{
 await installCamera(page,{saved});await page.goto('/');await enterArtwork(page);await expect(page.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');await page.evaluate(()=>cameraTest.revoke());await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(0);await open(page);await expect(settings(page).getByRole('status')).toContainText(/permission/i);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);
});
test('missing saved webcam exposes device recovery in setup and never requests default',async({page})=>{
 await installCamera(page,{saved:{...saved,deviceId:'missing'}});await page.goto('/');await page.getByRole('button',{name:'Choose GLOW',exact:true}).click();await expect(page.getByRole('alert')).toContainText(/saved camera/i);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);await page.getByLabel('Setup webcam',{exact:true}).selectOption('desk');await page.getByRole('button',{name:'CONNECT CAMERA',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(1);
});

test('unavailable storage supports manual camera and explains session-only preferences',async({page})=>{
 await installCamera(page,{storageBlocked:true});await page.goto('/');await enterArtwork(page);await open(page);await settings(page).getByRole('button',{name:'Connect Camera',exact:true}).click();await settings(page).getByLabel('Remember My Camera',{exact:true}).check();await expect(settings(page).getByText(/this session only/i)).toBeVisible();await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(1);
});
test('cancelled startup and device switching release stale streams without overlap',async({page})=>{
 await installCamera(page,{delay:true});await page.goto('/');await enterArtwork(page);await open(page);await settings(page).getByRole('button',{name:'Connect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(1);await settings(page).getByRole('button',{name:'Disconnect Camera',exact:true}).click();await settings(page).getByRole('button',{name:'Reconnect Camera',exact:true}).click();
 await page.evaluate(()=>cameraTest.pending.shift()());await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(2);await page.evaluate(()=>cameraTest.pending.shift()());await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(1);expect(await page.evaluate(()=>cameraTest.peak)).toBe(1);
});
test('camera settings keyboard focus restores and compact viewports keep controls accessible',async({page})=>{
 await installCamera(page);await page.goto('/');await enterArtwork(page);for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);await open(page);await expect(settings(page).getByRole('button',{name:'Forget Preference',exact:true})).toBeVisible();await page.screenshot({path:`.test-artifacts/smart-camera-settings-${viewport.width}.png`});await page.keyboard.press('Escape');await expect(settings(page)).not.toBeVisible();await expect(page.getByRole('button',{name:'Camera settings',exact:true})).toBeFocused();}
});
test('synthetic return timing and fifty cycles retain one stream and clean up tracking',async({page},testInfo)=>{
 await installCamera(page,{saved});await page.goto('/');await enterArtwork(page);await expect(page.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');
 const timing=await page.evaluate(()=>({navigationToVideoMs:cameraTest.started,videoToFirstMaskMs:cameraTest.tracking-cameraTest.started,attempts:cameraTest.attempts,peakStreams:cameraTest.peak,peakWorkers:cameraTest.peakWorkers}));
 await page.evaluate(()=>{cameraTest.tracking=null;cameraTest.recoveryBegan=performance.now();cameraTest.end();});await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(2);await expect.poll(()=>page.evaluate(()=>cameraTest.tracking)).not.toBeNull();const recovery=await page.evaluate(()=>({lossToVideoMs:cameraTest.started-cameraTest.recoveryBegan,videoToFirstMaskMs:cameraTest.tracking-cameraTest.started,lossToFirstMaskMs:cameraTest.tracking-cameraTest.recoveryBegan}));
 await open(page);for(let i=0;i<50;i++){await settings(page).getByRole('button',{name:'Disconnect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.workers)).toBe(0);await settings(page).getByRole('button',{name:'Reconnect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(1);}
 await settings(page).getByRole('button',{name:'Disconnect Camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.workers)).toBe(0);const cleanup=await page.evaluate(()=>({activeStreams:cameraTest.active,workers:cameraTest.workers,peakStreams:cameraTest.peak,attempts:cameraTest.attempts}));await testInfo.attach('synthetic-camera-timing',{body:JSON.stringify({timing,recovery,cleanup},null,2),contentType:'application/json'});writeFileSync('docs/smart-camera-synthetic-timing.json',JSON.stringify({environment:'Headless Edge; synthetic canvas stream, mocked permissions and tracker; not physical webcam latency',timing,recovery,cleanup},null,2)+'\n');expect(cleanup).toEqual({activeStreams:0,workers:0,peakStreams:1,attempts:52});
});
test('a new browser context restores a genuinely saved choice without a fresh opt-in',async({page,browser})=>{
 await installCamera(page);await page.goto('/');await enterArtwork(page);await open(page);await settings(page).getByRole('button',{name:'Connect Camera',exact:true}).click();await expect(settings(page).getByRole('status')).toContainText('tracking active');await settings(page).getByLabel('Remember My Camera',{exact:true}).check();await settings(page).getByLabel('Auto-Reconnect',{exact:true}).check();const state=await page.context().storageState();const context=await browser.newContext({storageState:state});
 try{const second=await context.newPage();await installCamera(second);await second.goto('/');await enterArtwork(second);await expect(second.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');expect(await second.evaluate(()=>cameraTest.attempts)).toBe(1);expect(await second.evaluate(()=>cameraTest.requests[0].video.deviceId.exact)).toBe('desk');}finally{await context.close();}
});
test('removed hardware never silently falls back and bounded recovery does not loop',async({page})=>{
 await installCamera(page,{saved});await page.goto('/');await enterArtwork(page);await expect(page.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');await page.evaluate(()=>{cameraTest.remove();cameraTest.end();});await open(page);await expect(settings(page).getByRole('status')).toContainText(/saved camera/i);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);expect(await page.evaluate(()=>cameraTest.active)).toBe(0);
});
test('camera settings pause an assisted round and closing requires explicit resume',async({page})=>{
 await installCamera(page);await installArcadeClock(page);await page.goto('/');await enterArtwork(page);await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch',exact:true}).click();await page.getByRole('button',{name:'START GAME',exact:true}).click();await page.evaluate(()=>window.advance(3.1));const time=await page.getByLabel('Time remaining').textContent();
 await open(page);await page.evaluate(()=>window.advance(10));await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeVisible();await expect(page.getByLabel('Time remaining')).toHaveText(time);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
});
test('all experiences and gallery navigation retain one camera and only the selected tracking worker',async({page})=>{
 await installCamera(page,{saved});await page.goto('/');await enterArtwork(page);await expect(page.getByRole('status',{name:'Input status'})).toContainText('Body tracking active');for(const mode of ['FLOW','SLASH','LAUNCH','GLOW']){await page.getByRole('button',{name:mode==='LAUNCH'?'KINETIC':mode,exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.workers)).toBe(1);expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);expect(await page.evaluate(()=>cameraTest.active)).toBe(1);}
 await page.getByRole('button',{name:'ECHOES',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.workers)).toBe(0);expect(await page.evaluate(()=>cameraTest.active)).toBe(1);await page.getByRole('button',{name:'BACK TO LUMEN',exact:true}).click();await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);expect(await page.evaluate(()=>cameraTest.peak)).toBe(1);
});
