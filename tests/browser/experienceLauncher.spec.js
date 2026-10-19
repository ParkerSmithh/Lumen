import {test,expect} from '@playwright/test';
import {installCamera} from './cameraSimulation.js';

test('every homepage reload returns to selection after each experience was entered',async({page})=>{
 await installCamera(page);await page.goto('/');
 for(const name of ['FLOW','GLOW','ENERGY RUSH','SLASH','KINETIC']){
  await page.getByRole('button',{name:`Choose ${name}`,exact:true}).click();
  await page.getByRole('button',{name:'Explore without camera',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('heading',{name:'CHOOSE YOUR EXPERIENCE'})).toBeVisible();
  await expect(page.locator('.launcher-card')).toHaveCount(5);
  await expect(page.locator('.mode-stage canvas')).toHaveCount(0);
  await expect(page.locator('nav button[aria-current]')).toHaveCount(0);
  expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
 }
});

test('reload shows selection even when an approved saved camera reconnects',async({page})=>{
 await installCamera(page,{saved:{version:1,remember:true,autoReconnect:true,startupConfirmed:true,deviceId:'usb',facingMode:'user'}});await page.goto('/');
 await expect(page.getByRole('status').filter({hasText:'Remembered camera connected'})).toBeVisible();
 await page.getByRole('button',{name:'Choose KINETIC',exact:true}).click();await page.getByRole('button',{name:'CONTINUE',exact:true}).click();
 await expect(page.getByRole('heading',{name:'KINETIC',exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:'CHOOSE YOUR EXPERIENCE'})).toBeVisible();
 await expect(page.getByRole('status').filter({hasText:'Remembered camera connected'})).toBeVisible();
 expect(await page.evaluate(()=>({active:cameraTest.active,workers:cameraTest.workers}))).toEqual({active:1,workers:0});
 await expect(page.locator('.mode-stage canvas')).toHaveCount(0);
 await expect(page.locator('nav button[aria-current]')).toHaveCount(0);
});

test('ENERGY RUSH tab uses selection-first setup and has its own active state',async({page})=>{
 await installCamera(page);await page.goto('/');
 const nav=page.getByRole('navigation',{name:'Artwork modes'});
 await nav.getByRole('button',{name:'ENERGY RUSH',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Set up ENERGY RUSH'})).toBeVisible();
 await expect(nav.getByRole('button',{name:'ENERGY RUSH',exact:true})).toHaveAttribute('aria-current','page');
 await expect(nav.getByRole('button',{name:'GLOW',exact:true})).not.toHaveAttribute('aria-current','page');
 expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
 await page.getByRole('button',{name:'Explore without camera',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'ENERGY RUSH',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'BACK',exact:true}).click();
 await expect(nav.getByRole('button',{name:'GLOW',exact:true})).toHaveAttribute('aria-current','page');
 await nav.getByRole('button',{name:'ENERGY RUSH',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'ENERGY RUSH',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
});

for(const touch of [false,true])test(`whole game cards activate from artwork, text and padding with ${touch?'touch':'mouse'}`,async({browser})=>{
 const context=await browser.newContext({hasTouch:touch,viewport:touch?{width:390,height:844}:{width:1440,height:900}});
 try{const page=await context.newPage();await installCamera(page);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  for(const [id,name] of [['trace','FLOW'],['glow','GLOW'],['energy','ENERGY RUSH'],['destruction','SLASH'],['kinetic','KINETIC']]){
   for(const area of ['.launcher-art','h3','.launcher-description','padding']){
    const card=page.locator(`[data-experience="${id}"]`);await card.scrollIntoViewIfNeeded();
    const box=await (area==='padding'?card:card.locator(area)).boundingBox();
    const x=area==='padding'?box.x+box.width-8:box.x+box.width/2,y=area==='padding'?box.y+box.height-8:box.y+box.height/2;
    if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
    await expect(page.getByRole('heading',{name:`Set up ${name}`,exact:true})).toBeVisible();
    expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
    await page.getByRole('button',{name:'Back to experiences',exact:true}).click();
   }
  }
 }finally{await context.close();}
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`FLOW leads visual and keyboard navigation at ${viewport.width}px without launching`,async({page})=>{
 await page.setViewportSize(viewport);await page.goto('/');
 const tabs=page.getByRole('navigation',{name:'Artwork modes'}).getByRole('button');
 await expect(tabs).toHaveCount(5);
 expect(await tabs.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')))).toEqual(['FLOW','GLOW','ENERGY RUSH','SLASH','KINETIC']);
 await expect(page.locator('.launcher-card h3')).toHaveText(['FLOW','GLOW','ENERGY RUSH','SLASH','KINETIC']);
 await expect(page.locator('nav button[aria-current]')).toHaveCount(0);
 await expect(page.locator('.mode-stage canvas')).toHaveCount(0);
 await tabs.first().focus();
 for(const name of ['FLOW','GLOW','ENERGY RUSH','SLASH','KINETIC']){await expect(page.getByRole('navigation').getByRole('button',{name:name==='LAUNCH'?'KINETIC':name,exact:true})).toBeFocused();await page.keyboard.press('Tab');}
});

test('first visit offers all experiences without starting a game or capture',async({page})=>{
 await page.addInitScript(()=>{window.captureAttempts=0;navigator.mediaDevices.getUserMedia=async()=>{window.captureAttempts++;throw new DOMException('Denied','NotAllowedError');};});
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'CHOOSE YOUR EXPERIENCE'})).toBeVisible();
 for(const name of ['GLOW','ENERGY RUSH','FLOW','SLASH','KINETIC'])await expect(page.getByRole('button',{name:`Choose ${name}`,exact:true})).toBeVisible();
 await expect(page.locator('.mode-stage canvas')).toHaveCount(0);
 await expect(page.locator('nav button[aria-current]')).toHaveCount(0);
 await expect(page.getByRole('navigation',{name:'Artwork modes'})).toBeVisible();
 expect(await page.evaluate(()=>captureAttempts)).toBe(0);
 await page.getByRole('button',{name:'Choose FLOW',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Set up FLOW'})).toBeVisible();
 expect(await page.evaluate(()=>captureAttempts)).toBe(0);
 await page.getByRole('button',{name:'CONNECT CAMERA',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText(/camera|permission|access/i);
 await page.getByRole('button',{name:'Back to experiences',exact:true}).click();
 await expect(page.getByRole('heading',{name:'CHOOSE YOUR EXPERIENCE'})).toBeVisible();
});

test('device choice is staged until Connect, then enters selected experience with one stream',async({page})=>{
 await installCamera(page);await page.goto('/');
 await page.getByRole('button',{name:'Choose FLOW',exact:true}).click();
 await page.getByLabel('Setup webcam',{exact:true}).selectOption('usb');
 expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
 await page.getByRole('button',{name:'CONNECT CAMERA',exact:true}).click();
 await expect(page.getByRole('heading',{name:'LIGHT TRACE',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>cameraTest.requests[0].video.deviceId.exact)).toBe('usb');
 for(const mode of ['SLASH','FLOW','LAUNCH','GLOW','FLOW'])await page.getByRole('navigation').getByRole('button',{name:mode==='LAUNCH'?'KINETIC':mode,exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>cameraTest.workers)).toBe(1);
 expect(await page.evaluate(()=>({attempts:cameraTest.attempts,peak:cameraTest.peak}))).toEqual({attempts:1,peak:1});
 await page.getByRole('button',{name:'EXPLORE MODES',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>cameraTest.workers)).toBe(0);
 expect(await page.evaluate(()=>cameraTest.active)).toBe(1);
});

test('canceling an in-flight connection releases a late stream and stays in selection',async({page})=>{
 await installCamera(page,{delay:true});await page.goto('/');
 await page.getByRole('button',{name:'Choose KINETIC',exact:true}).click();
 await page.getByRole('button',{name:'CONNECT CAMERA',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(1);
 await page.getByRole('button',{name:'Back to experiences',exact:true}).click();
 await page.evaluate(()=>cameraTest.pending.shift()());
 await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(0);
 await expect(page.getByRole('heading',{name:'CHOOSE YOUR EXPERIENCE'})).toBeVisible();
 expect(await page.evaluate(()=>cameraTest.workers)).toBe(0);
});

test('approved reconnect is visible on the launcher but starts no game or tracking worker',async({page})=>{
 await installCamera(page,{saved:{version:1,remember:true,autoReconnect:true,startupConfirmed:true,deviceId:'usb',facingMode:'user'}});await page.goto('/');
 await expect(page.getByRole('status').filter({hasText:'Remembered camera connected'})).toBeVisible();
 expect(await page.evaluate(()=>({active:cameraTest.active,workers:cameraTest.workers}))).toEqual({active:1,workers:0});
 await page.getByRole('button',{name:'Choose KINETIC',exact:true}).click();
 await page.getByRole('button',{name:'CONTINUE',exact:true}).click();
 await expect(page.getByRole('heading',{name:'KINETIC',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>cameraTest.attempts)).toBe(1);
});

test('saved OFF preferences survive browsing, setup, fallback and reload',async({page})=>{
 const saved={version:1,remember:false,autoReconnect:false,startupConfirmed:false,deviceId:'',facingMode:'user'};
 await installCamera(page,{saved});await page.goto('/');
 await page.getByRole('button',{name:'Choose SLASH',exact:true}).click();
 await expect(page.getByLabel('Remember My Camera',{exact:true})).not.toBeChecked();
 await expect(page.getByLabel('Auto-Reconnect',{exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Explore without camera',exact:true}).click();await page.reload();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.camera.v1')))).toEqual(saved);
 expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
});

test('tab hover and activation are distinct, settle, and respect reduced motion',async({page})=>{
 await page.goto('/');
 for(const name of ['FLOW','GLOW','ENERGY RUSH','SLASH','KINETIC']){
  const tab=page.getByRole('navigation').getByRole('button',{name:name==='LAUNCH'?'KINETIC':name,exact:true});
  await tab.hover();expect(await tab.evaluate(el=>getComputedStyle(el,'::before').transitionDuration)).not.toBe('0s');
  await tab.click();await expect(tab).toHaveClass(/tab-activated/);await expect(tab).not.toHaveClass(/tab-activated/);
 }
 const flow=page.getByRole('navigation').getByRole('button',{name:'FLOW',exact:true});
 await page.emulateMedia({reducedMotion:'reduce'});await flow.press('Enter');
 expect(await flow.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});

test('Explore Modes cancels pending setup instead of entering when permission settles',async({page})=>{
 await installCamera(page,{delay:true});await page.goto('/');await page.getByRole('button',{name:'Choose FLOW',exact:true}).click();
 await page.getByRole('button',{name:'CONNECT CAMERA',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.attempts)).toBe(1);
 await page.getByRole('button',{name:'EXPLORE MODES',exact:true}).click();await page.evaluate(()=>cameraTest.pending.shift()());
 await expect(page.getByRole('heading',{name:'CHOOSE YOUR EXPERIENCE'})).toBeVisible();await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(0);
});

test('camera-free choice disconnects a restored stream and preserves intentional disconnect',async({page})=>{
 await installCamera(page,{saved:{version:1,remember:true,autoReconnect:true,startupConfirmed:true,deviceId:'usb',facingMode:'user'}});await page.goto('/');
 await expect(page.getByRole('status').filter({hasText:'Remembered camera connected'})).toBeVisible();await page.getByRole('button',{name:'Choose GLOW',exact:true}).click();
 await page.getByRole('button',{name:'Explore without camera',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.active)).toBe(0);
 expect(await page.evaluate(()=>cameraTest.workers)).toBe(0);
});

test('connecting the same experience after fallback restores camera interaction',async({page})=>{
 await installCamera(page);await page.goto('/');await page.getByRole('button',{name:'Choose FLOW',exact:true}).click();await page.getByRole('button',{name:'Explore without camera',exact:true}).click();
 await page.getByRole('button',{name:'EXPLORE MODES',exact:true}).click();await page.getByRole('button',{name:'Choose FLOW',exact:true}).click();
 await page.getByRole('button',{name:'CONNECT CAMERA',exact:true}).click();await expect.poll(()=>page.evaluate(()=>cameraTest.workers)).toBe(1);
 await expect(page.getByRole('button',{name:'Mouse / touch fallback',exact:true})).toBeVisible();
});

test('choosing ENERGY RUSH from an entered artwork leaves setup accessible and cancellation retains the artwork',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Choose FLOW',exact:true}).click();await page.getByRole('button',{name:'Explore without camera',exact:true}).click();
 await page.getByRole('button',{name:'EXPLORE MODES',exact:true}).click();await page.getByRole('button',{name:'Choose ENERGY RUSH',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Set up ENERGY RUSH'})).toBeVisible();await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'Back to experiences',exact:true}).click();await page.getByRole('button',{name:'Return to experience',exact:true}).click();
 await expect(page.getByRole('navigation').getByRole('button',{name:'FLOW',exact:true})).toHaveAttribute('aria-current','page');
 await expect(page.getByRole('heading',{name:'LIGHT TRACE',exact:true})).toBeVisible();
});

for(const [name,mode,title] of [['GLOW','GLOW',null],['ENERGY RUSH','GLOW','ENERGY RUSH'],['FLOW','FLOW','LIGHT TRACE'],['SLASH','SLASH','SLASH'],['KINETIC','LAUNCH','KINETIC']])test(`${name} opens its actual experience and supports camera-free exploration`,async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:`Choose ${name}`,exact:true}).click();
 await expect(page.getByRole('heading',{name:`Set up ${name}`})).toBeVisible();
 await page.getByRole('button',{name:'Explore without camera',exact:true}).click();
 if(name==='ENERGY RUSH'){await expect(page.getByRole('dialog',{name:'ENERGY RUSH',exact:true})).toBeVisible();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await expect(page.getByRole('button',{name:'START GAME',exact:true})).toBeEnabled();await page.getByRole('button',{name:'BACK',exact:true}).click();}
 await expect(page.getByRole('navigation').getByRole('button',{name:mode==='LAUNCH'?'KINETIC':mode,exact:true})).toHaveAttribute('aria-current','page');
 if(title&&name!=='ENERGY RUSH')await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
 await page.getByRole('button',{name:'EXPLORE MODES',exact:true}).click();
 await expect(page.getByRole('heading',{name:'CHOOSE YOUR EXPERIENCE'})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'EXPLORE MODES',exact:true})).toBeFocused();
});

for(const viewport of [{width:1440,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:568},{width:667,height:375},{width:844,height:390}])test(`launcher remains reachable at ${viewport.width}x${viewport.height}`,async({page})=>{
 await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 const blocked=await page.locator('nav button').evaluateAll(nodes=>nodes.filter(el=>{const r=el.getBoundingClientRect();return r.x<0||r.right>innerWidth||r.height<44||!el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}).map(el=>el.getAttribute('aria-label')));
 expect(blocked).toEqual([]);
 await page.getByRole('button',{name:'Choose KINETIC',exact:true}).scrollIntoViewIfNeeded();
 await page.getByRole('button',{name:'Choose KINETIC',exact:true}).press('Enter');
 await expect(page.getByRole('heading',{name:'Set up KINETIC'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Choose KINETIC',exact:true})).toBeFocused();
});

test('touch selection, setup cancellation and top tabs stay usable without capture',async({browser})=>{
 const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:844}});
 try{const page=await context.newPage();await installCamera(page);await page.goto('/');
  await page.getByRole('button',{name:'Choose KINETIC',exact:true}).tap();await expect(page.getByRole('heading',{name:'Set up KINETIC'})).toBeVisible();
  await page.getByRole('button',{name:'Back to experiences',exact:true}).tap();
  await page.getByRole('navigation').getByRole('button',{name:'FLOW',exact:true}).tap();await page.getByRole('button',{name:'Explore without camera',exact:true}).tap();
  await expect(page.getByRole('heading',{name:'LIGHT TRACE',exact:true})).toBeVisible();expect(await page.evaluate(()=>cameraTest.attempts)).toBe(0);
 }finally{await context.close();}
});
