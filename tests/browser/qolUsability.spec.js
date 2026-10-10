import {test,expect} from '@playwright/test';
import {installArcadeClock} from './arcadeClock.js';
test('LAUNCH instructions expose the full reach close hold open sequence',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'LAUNCH',exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('REACH → CLOSE FIST → HOLD → OPEN HAND TO THROW');
});
test('compact tracking status remains readable after the atmospheric caption fades',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();
 await expect(page.getByRole('status',{name:'Input status'})).toContainText(/mouse.*touch ready/i);
 await page.waitForTimeout(800);await expect(page.getByRole('status',{name:'Input status'})).toBeVisible();
});
test('ENERGY RUSH focus loss clears held actions and requires explicit resume',async({page})=>{
 await installArcadeClock(page);await page.goto('/?debugEnergy');await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await page.getByRole('button',{name:'START GAME',exact:true}).click();
 await page.evaluate(()=>window.advance(3.1));await expect(page.getByRole('button',{name:'PAUSE',exact:true})).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeVisible();
 const elapsed=await page.evaluate(()=>window.__lumenEnergy.snapshot().elapsed);await page.evaluate(()=>window.advance(10));
 expect(await page.evaluate(()=>window.__lumenEnergy.snapshot().elapsed)).toBe(elapsed);
 await page.getByRole('button',{name:'RESUME',exact:true}).click();await expect(page.getByRole('button',{name:'PAUSE',exact:true})).toBeVisible();
});
test('tracking search has a grace period and recovers without camera reconnection',async({page})=>{
 await page.addInitScript(()=>{
  window.poseVisible=true;navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const draw=()=>{c.getContext('2d').fillRect(0,0,640,480);requestAnimationFrame(draw);};draw();return c.captureStream(30);};
  window.Worker=class{postMessage(m){m.frame?.close();queueMicrotask(()=>{const landmarks=window.poseVisible?Array.from({length:21},()=>({x:.5,y:.5,z:0})):null;this.onmessage?.({data:m.type==='init'?{type:'ready'}:{type:'hand',landmarks,timestamp:m.timestamp,sourceWidth:640,sourceHeight:480}});});}terminate(){this.onmessage=null;}};
 });
 await page.goto('/');await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'ENABLE CAMERA',exact:true}).click();
 const status=page.getByRole('status',{name:'Input status'});await expect(status).toContainText('Hand tracking active');
 await page.getByRole('button',{name:'PLAY',exact:true}).click();await page.getByRole('button',{name:'START GAME',exact:true}).click();await expect(page.getByLabel('Time remaining')).toBeVisible();
 await page.evaluate(()=>window.poseVisible=false);await page.waitForTimeout(200);await expect(status).not.toContainText('Tracking lost');
 await expect(status).toContainText('Tracking lost');await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeDisabled();
 const time=await page.getByLabel('Time remaining').textContent();await page.waitForTimeout(300);await expect(page.getByLabel('Time remaining')).toHaveText(time);
 await page.evaluate(()=>window.poseVisible=true);await expect(status).toContainText('Hand tracking active');await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeEnabled();await page.getByRole('button',{name:'RESUME',exact:true}).click();
});
test('real Ballpit ownership survives detector loss grace and sustained loss cannot throw',async({page})=>{
 await page.goto('/');const result=await page.evaluate(async()=>{
  const {createBallpit}=await import('/src/effects/Ballpit.jsx'),{createGrabDetector}=await import('/src/tracking/grabDetector.js');
  const host=document.createElement('div');host.style.cssText='position:absolute;width:640px;height:480px';document.body.append(host);const canvas=document.createElement('canvas');host.append(canvas);
  let now=0;const originalNow=performance.now.bind(performance);performance.now=()=>now;
  const pointerRef={current:null},pit=createBallpit(canvas,{count:4,maxActive:3,interactiveCreation:true,followCursor:false,gravity:0,minSize:.25,maxSize:.25,colors:[0xffffff,0xffffff]},{current:{pointerRef}}),step=pit.three.onBeforeRender;pit.three.onBeforeRender=()=>{};
  const detector=createGrabDetector({lossGraceMs:350});let sequence=0;
  const feed=(t,closed,x=.5)=>{now=t;const packet=detector.update(closed===null?null:{active:true,sequence:++sequence,timestamp:t,features:{closed,open:!closed,center:{x,y:.5}}},t);pointerRef.current={active:true,x,y:.5,source:'hand',timestamp:t,sequence,aspect:4/3,grab:packet,suppressForce:true};step({delta:1/60,elapsed:t/1000});};
  try{pit.spawn({x:0,y:0,z:0},'#4d9fff');pit.spheres.physics.velocityData.fill(0);feed(0,false);feed(30,true);feed(90,true);const grabbed=pit.grabbedCount;feed(120,true,.52);feed(250,null,.52);const frozen=pit.grabbedCount;feed(300,true,.52);const recovered=pit.grabbedCount;feed(651,null,.52);return {grabbed,frozen,recovered,released:pit.grabbedCount,speed:Math.hypot(...pit.spheres.physics.velocityData.slice(3,6))};}
  finally{pit.dispose();host.remove();performance.now=originalNow;}
 });expect(result.grabbed).toBe(1);expect(result.frozen).toBe(1);expect(result.recovered).toBe(1);expect(result.released).toBe(0);expect(result.speed).toBe(0);
});
test('ENERGY RUSH announces shield loss and both FEVER transitions',async({page})=>{
 await page.goto('/');await page.evaluate(async()=>{
  const React=await import('/node_modules/.vite/deps/react.js'),DOM=await import('/node_modules/.vite/deps/react-dom_client.js'),{EnergyRushHUD}=await import('/src/game/EnergyRushHUD.jsx');
  const host=document.createElement('div');document.body.append(host);const root=(DOM.createRoot||DOM.default.createRoot)(host);const state={phase:'PLAYING',score:0,shields:3,multiplier:1,remaining:90,fever:false};window.hudUpdate=patch=>{Object.assign(state,patch);root.render((React.createElement||React.default.createElement)(EnergyRushHUD,{game:{display:{...state},inputMode:'assist',move(){},action(){},pause(){},exit(){},recalibrate(){}},instructions:{show(){}}}));};window.hudUpdate({});window.hudCleanup=()=>{root.unmount();host.remove();};
 });
 await page.evaluate(()=>window.hudUpdate({shields:2}));await expect(page.locator('.energy-event')).toContainText('2 shields remaining');
 await page.evaluate(()=>window.hudUpdate({fever:true}));await expect(page.locator('.energy-event')).toContainText('Eight active seconds');
 await page.evaluate(()=>window.hudUpdate({fever:false}));await expect(page.locator('.energy-event')).toContainText('FEVER complete');await page.evaluate(()=>window.hudCleanup());
});
