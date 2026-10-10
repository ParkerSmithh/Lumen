import {test,expect} from '@playwright/test';
import {installArcadeClock} from './arcadeClock.js';
async function instructionScreenshot(page,path){
 await page.locator('.game-instructions-layer').evaluate(node=>Promise.all(node.getAnimations().map(animation=>animation.finished)));
 await page.screenshot({path});
}
for(const [mode,title] of [['FLOW','LIGHT TRACE'],['SLASH','DESTRUCTION'],['LAUNCH','KINETIC']])test(`${mode} first-play instructions freeze ready state and BACK does not start`,async({page})=>{
 await installArcadeClock(page);await page.goto('/?debugTrace&debugSlash&debugKinetic');
 await page.getByRole('button',{name:mode,exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:title});await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'START GAME',exact:true})).toBeDisabled();await instructionScreenshot(page,`.test-artifacts/instructions-${mode}-desktop.png`);
 await page.evaluate(()=>window.advance(20));await expect(page.getByLabel('Starting in')).toHaveCount(0);
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.getByRole('button',{name:'PLAY',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'PLAY',exact:true}).click();await page.getByRole('button',{name:mode==='LAUNCH'?'Keyboard / touch':'Mouse / touch',exact:true}).click();await page.getByRole('button',{name:'START GAME',exact:true}).click();
 await page.evaluate(()=>window.advance(3.1));await expect(page.getByLabel('Time remaining')).toBeVisible();
 const time=await page.getByLabel('Time remaining').textContent();await page.getByRole('button',{name:'HOW TO PLAY',exact:true}).click();await expect(dialog).toBeVisible();
 await page.evaluate(()=>window.advance(20));await page.mouse.move(400,350);await page.mouse.down();await page.mouse.move(900,450);await page.mouse.up();
 await page.getByRole('button',{name:'BACK TO GAME',exact:true}).click();await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeVisible();await expect(page.getByLabel('Time remaining')).toHaveText(time);
 await page.getByRole('button',{name:'RESUME',exact:true}).click();await page.evaluate(()=>window.advance(130));await expect(page.getByRole('button',{name:'PLAY AGAIN',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'PLAY AGAIN',exact:true}).click();await expect(dialog).toHaveCount(0);await expect(page.getByLabel('Starting in')).toBeVisible();
});

test('each tutorial explains its scoring rules and only offers supported inputs',async({page})=>{
 await page.goto('/');
 for(const [mode,title,mechanics] of [
  ['GLOW','ENERGY RUSH',/90 seconds.*shields/i],
  ['FLOW','LIGHT TRACE',/CLEAN.*85%.*PERFECT.*95%/],
  ['SLASH','DESTRUCTION',/FRACTURE STORM.*OVERLOAD/],
  ['LAUNCH','KINETIC',/Bank shots.*bonus targets/i],
 ]){
  if(mode!=='GLOW')await page.getByRole('button',{name:mode,exact:true}).click();
  await page.getByRole('button',{name:mode==='GLOW'?'PLAY ENERGY RUSH':'PLAY',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:title});
  await expect(dialog).toContainText(mechanics);
  await dialog.getByRole('button',{name:['FLOW','SLASH'].includes(mode)?'Mouse / touch':'Keyboard / touch',exact:true}).click();
  await expect(dialog.getByRole('button',{name:'START GAME',exact:true})).toBeEnabled();
  if(['FLOW','SLASH'].includes(mode))await expect(dialog).toContainText(/no keyboard movement/i);
  await dialog.getByRole('button',{name:'BACK',exact:true}).click();
 }
});

for(const mode of ['GLOW','FLOW'])test(`${mode} camera denial is explained inside the tutorial and does not unlock camera play`,async({page})=>{
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied','NotAllowedError');};});
 await page.goto('/');if(mode!=='GLOW')await page.getByRole('button',{name:mode,exact:true}).click();await page.getByRole('button',{name:mode==='GLOW'?'PLAY ENERGY RUSH':'PLAY',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'ENABLE CAMERA',exact:true}).click();
 await expect(dialog.getByRole('status')).toContainText(/denied|blocked/i);
 await expect(dialog.getByRole('button',{name:'START GAME',exact:true})).toBeDisabled();
 await dialog.getByRole('button',{name:mode==='GLOW'?'Keyboard / touch':'Mouse / touch',exact:true}).click();
 await expect(dialog.getByRole('status')).toContainText(/touch ready/i);
});

async function installInstructionCamera(page){
 await page.addInitScript(()=>{
  const raf=requestAnimationFrame.bind(window);navigator.mediaDevices.getUserMedia=async()=>{
   const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d');
   const draw=()=>{ctx.fillStyle='#171020';ctx.fillRect(0,0,640,480);raf(draw);};draw();return c.captureStream(30);
  };
  const Native=Worker;window.Worker=class {
   constructor(url,options){if(!String(url).includes('hand-tracking.worker'))return new Native(url,options);}
   postMessage(m){m.frame?.close();setTimeout(()=>{if(!this.closed)this.onmessage?.({data:m.type==='init'?{type:'ready'}:{type:'hand',landmarks:null,timestamp:m.timestamp,sourceWidth:640,sourceHeight:480}});},0);}
   terminate(){this.closed=true;}
  };
 });
}
test('SLASH camera enabled inside instructions becomes available without starting gameplay',async({page})=>{
 await installInstructionCamera(page);
 await page.goto('/?debugSlash');await page.getByRole('button',{name:'SLASH',exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog.getByRole('button',{name:'START GAME',exact:true})).toBeDisabled();
 await dialog.getByRole('button',{name:'ENABLE CAMERA',exact:true}).click();
 await expect(dialog.getByRole('button',{name:'START GAME',exact:true})).toBeEnabled();
 await expect(dialog.getByRole('status')).toContainText(/Camera connected.*Raise your hand/);
 expect(await page.evaluate(()=>window.__lumenSlash.state().phase)).toBe('ready');
 await dialog.getByRole('button',{name:'START GAME',exact:true}).click();await expect(page.getByLabel('Starting in')).toBeVisible();
});

test('camera disconnect during tutorial exit recovers without starting or hiding the dialog',async({page})=>{
 await installInstructionCamera(page);await page.goto('/?debugSlash');await page.getByRole('button',{name:'SLASH',exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'ENABLE CAMERA',exact:true}).click();await expect(dialog.getByRole('button',{name:'START GAME',exact:true})).toBeEnabled();
 await dialog.getByRole('button',{name:'START GAME',exact:true}).click();await page.getByLabel('Live webcam preview',{exact:true}).evaluate(video=>video.pause());
 await expect(dialog).toHaveAttribute('data-state','open');await expect(dialog.getByRole('button',{name:'START GAME',exact:true})).toBeDisabled();
 expect(await page.evaluate(()=>window.__lumenSlash.state().phase)).toBe('ready');
 await dialog.getByRole('button',{name:'Mouse / touch',exact:true}).click();await dialog.getByRole('button',{name:'START GAME',exact:true}).click();await expect(page.getByLabel('Starting in')).toBeVisible();
});

for(const mode of ['FLOW','SLASH','LAUNCH'])test(`${mode} review freezes score and gameplay objects, then releases the instruction gate`,async({page})=>{
 await installArcadeClock(page);await page.goto('/?debugTrace&debugSlash&debugKinetic&debugEchoes');
 await page.getByRole('button',{name:mode,exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();
 await page.getByRole('button',{name:'PLAY',exact:true}).click();await page.getByRole('button',{name:'START GAME',exact:true}).click();
 await page.evaluate(()=>window.advance(3.1));await expect(page.getByLabel('Time remaining')).toBeVisible();
 await page.getByRole('button',{name:'HOW TO PLAY',exact:true}).click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 const snapshot=()=>page.evaluate(mode=>{
  const main=document.querySelector('main'),score=main.querySelector('[aria-label="Score"]')?.textContent;
  const time=main.querySelector('[aria-label="Time remaining"]')?.textContent;
  const detail=mode==='FLOW'?window.__lumenTrace.state():mode==='SLASH'?window.__lumenSlash.state():window.__lumenKinetic.instance.spheres.physics.positionData.slice(0,30);
  return {score,time,detail:ArrayBuffer.isView(detail)?Array.from(detail):detail};
 },mode);
 const before=await snapshot();await page.evaluate(()=>window.advance(30));
 await page.mouse.move(400,320);await page.mouse.down();await page.mouse.move(900,450,{steps:5});await page.mouse.up();await page.keyboard.press('c');await page.keyboard.press('Space');
 expect(await snapshot()).toEqual(before);await expect(dialog.getByRole('group',{name:'Interaction method'})).toHaveCount(0);
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
 await expect(page.getByRole('button',{name:'HOW TO PLAY',exact:true})).toBeFocused();
 expect(await page.locator('main').evaluate(node=>node.inert||node.hasAttribute('aria-hidden'))).toBe(false);
 await page.getByRole('button',{name:'RESUME',exact:true}).click();await page.evaluate(()=>window.advance(1));
 await expect(page.getByLabel('Time remaining')).not.toHaveText(before.time);
 await page.getByRole('button',{name:'GLOW',exact:true}).click();await page.getByRole('button',{name:'FLOW',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'ECHOES',exact:true}).click();await expect(page.getByRole('button',{name:'BACK TO LUMEN',exact:true})).toBeVisible();
});

for(const size of [{width:390,height:844},{width:844,height:390},{width:768,height:1024}])test(`all instruction layouts fit ${size.width}x${size.height}`,async({page})=>{
 await page.setViewportSize(size);await page.goto('/');
 for(const mode of ['GLOW','FLOW','SLASH','LAUNCH']){
  if(mode!=='GLOW')await page.getByRole('button',{name:mode,exact:true}).click();
  await page.getByRole('button',{name:mode==='GLOW'?'PLAY ENERGY RUSH':'PLAY',exact:true}).click();const dialog=page.getByRole('dialog');
  await expect(dialog.getByRole('button',{name:'BACK',exact:true})).toBeInViewport();await expect(dialog.getByRole('button',{name:'START GAME',exact:true})).toBeInViewport();
  expect(await dialog.evaluate(node=>{const r=node.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight&&node.scrollWidth<=node.clientWidth;})).toBe(true);
  if(size.width===844)expect(await page.locator('.game-instructions-scroll').evaluate(node=>node.scrollHeight<=node.clientHeight)).toBe(true);
  await instructionScreenshot(page,`.test-artifacts/instructions-${mode}-${size.width}x${size.height}.png`);
  await dialog.getByRole('button',{name:'BACK',exact:true}).click();
 }
});

test('hiding the page during START exit keeps instructions available without consuming first play',async({page})=>{
 await page.goto('/?debugSlash');await page.getByRole('button',{name:'SLASH',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'START GAME',exact:true}).click();
 await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:true}));
 await expect(dialog).toHaveAttribute('data-state','open');expect(await page.evaluate(()=>window.__lumenSlash.state().phase)).toBe('ready');
 await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,value:false}));
 await dialog.getByRole('button',{name:'BACK',exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();await expect(dialog).toBeVisible();
 await dialog.getByRole('button',{name:'START GAME',exact:true}).click();await expect(page.getByLabel('Starting in')).toBeVisible();
});

test('motion has an entrance and exit, and Escape cannot start a round during the exit',async({page})=>{
 await page.goto('/?debugSlash');await page.getByRole('button',{name:'SLASH',exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveAttribute('data-state','open');
 await page.getByRole('button',{name:'BACK',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveAttribute('data-state','closing');
 await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toHaveCount(0);
 expect(await page.evaluate(()=>window.__lumenSlash.state().phase)).toBe('ready');
});
test('ENERGY RUSH tutorial supports assisted first play and BACK preserves FREE GLOW',async({page})=>{
 await page.goto('/?debugEnergy');await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await expect(page.getByRole('dialog',{name:'ENERGY RUSH'})).toBeVisible();
 await page.getByRole('button',{name:'BACK',exact:true}).click();await expect(page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await page.getByRole('button',{name:'START GAME',exact:true}).click();
 await expect(page.getByLabel('Starting in')).toBeVisible();await page.getByRole('button',{name:'EXIT',exact:true}).click();
 await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'START',exact:true})).toBeVisible();
});
test('tutorial is keyboard-contained and usable on reduced-motion short portrait',async({page})=>{
 await page.setViewportSize({width:390,height:600});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.getByRole('button',{name:'SLASH',exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(page.getByRole('button',{name:'START GAME'})).toBeDisabled();
 await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement.closest('[role=dialog]')!==null)).toBe(true);
 expect(await dialog.evaluate(node=>{const r=node.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
 expect(await page.locator('path.demo-slash').evaluate(node=>getComputedStyle(node).animationName)).toBe('none');await instructionScreenshot(page,'.test-artifacts/instructions-portrait.png');
 await page.getByRole('button',{name:'BACK',exact:true}).click();await expect(page.getByRole('button',{name:'PLAY',exact:true})).toBeFocused();
});
test('reviewing ENERGY RUSH preserves round progress and prevents input-method reset',async({page})=>{
 await page.goto('/?debugEnergy');await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await page.getByRole('button',{name:'START GAME',exact:true}).click();await expect(page.getByRole('button',{name:'PAUSE',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'HOW TO PLAY',exact:true}).click();const before=await page.evaluate(()=>window.__lumenEnergy.snapshot());await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('dialog').getByRole('group',{name:'Interaction method'})).toHaveCount(0);await page.waitForTimeout(300);
 await page.getByRole('button',{name:'BACK TO GAME',exact:true}).click();const after=await page.evaluate(()=>window.__lumenEnergy.snapshot());expect(after.elapsed).toBe(before.elapsed);expect(after.score).toBe(before.score);expect(after.session).toBe(before.session);expect(after.phase).toBe('PAUSED');await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeEnabled();
});
