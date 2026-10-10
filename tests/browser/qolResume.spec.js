import {test,expect} from '@playwright/test';
import {startGame} from './startGame.js';
test('LAUNCH ignores held-key repeats after resume until a fresh press',async({page})=>{
 await page.goto('/?debugKinetic');await page.getByRole('button',{name:'LAUNCH',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();await startGame(page);await expect(page.getByLabel('Time remaining')).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.getByRole('button',{name:'RESUME',exact:true}).click();
 await page.evaluate(()=>{document.body.tabIndex=-1;document.body.focus();window.dispatchEvent(new KeyboardEvent('keydown',{code:'ArrowRight',key:'ArrowRight',repeat:true,bubbles:true}));});await page.waitForTimeout(150);
 expect(await page.evaluate(()=>window.__lumenKinetic.input())).toBeNull();
 await page.keyboard.down('ArrowRight');await expect.poll(()=>page.evaluate(()=>window.__lumenKinetic.input()?.source)).toBe('mouse');await page.keyboard.up('ArrowRight');
});
test('ENERGY touch pad requires a pointer initiated on the current pad',async({page})=>{
 await page.goto('/');await page.evaluate(async()=>{
  const React=await import('/node_modules/.vite/deps/react.js'),DOM=await import('/node_modules/.vite/deps/react-dom_client.js'),{EnergyRushHUD}=await import('/src/game/EnergyRushHUD.jsx');
  const host=document.createElement('div');document.body.append(host);const root=(DOM.createRoot||DOM.default.createRoot)(host);window.padMoves=0;root.render((React.createElement||React.default.createElement)(EnergyRushHUD,{game:{display:{phase:'PLAYING',score:0,shields:3,multiplier:1,remaining:90},inputMode:'assist',move(){window.padMoves++;},action(){},pause(){},exit(){},recalibrate(){}},instructions:{show(){}}}));window.padCleanup=()=>{root.unmount();host.remove();};
 });
 const pad=page.locator('.energy-touch-pad');await expect(pad).toBeVisible();await pad.dispatchEvent('pointermove',{pointerId:7,buttons:1,clientX:10,clientY:10});expect(await page.evaluate(()=>window.padMoves)).toBe(0);
 await pad.dispatchEvent('pointerdown',{pointerId:7,buttons:1,clientX:10,clientY:10});await pad.dispatchEvent('pointermove',{pointerId:7,buttons:1,clientX:20,clientY:20});expect(await page.evaluate(()=>window.padMoves)).toBe(2);
 await pad.dispatchEvent('pointercancel',{pointerId:7});await pad.dispatchEvent('pointermove',{pointerId:7,buttons:1,clientX:30,clientY:30});expect(await page.evaluate(()=>window.padMoves)).toBe(2);await page.evaluate(()=>window.padCleanup());
});
test('ENERGY RUSH rejects OS key repeats after resume and accepts a fresh press',async({page})=>{
 await page.goto('/');await page.evaluate(async()=>{
  const React=await import('/node_modules/.vite/deps/react.js'),DOM=await import('/node_modules/.vite/deps/react-dom_client.js'),{useEnergyRush}=await import('/src/game/useEnergyRush.js');
  const host=document.createElement('div');document.body.append(host);const root=(DOM.createRoot||DOM.default.createRoot)(host);const react=React.default||React;
  function Probe(){window.energyProbe=useEnergyRush({enabled:true,cameraReady:false,preview:false});return null;}root.render(react.createElement(Probe));window.energyCleanup=()=>{root.unmount();host.remove();};
 });
 await expect.poll(()=>page.evaluate(()=>!!window.energyProbe)).toBe(true);await page.evaluate(()=>window.energyProbe.chooseInput('assist'));await expect.poll(()=>page.evaluate(()=>window.energyProbe.inputMode)).toBe('assist');
 const result=await page.evaluate(()=>{
  const original=performance.now.bind(performance);let now=original();performance.now=()=>now;
  const step=n=>{for(let i=0;i<n;i++){now+=1000/60;window.energyProbe.frame(now,null,null);}};
  const key=repeat=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',code:'ArrowRight',repeat,bubbles:true}));
  try{window.energyProbe.start();step(200);key(false);step(6);window.energyProbe.pause();step(30);window.energyProbe.resume();step(1);const before=window.energyProbe.engine.scene.center.x;key(true);step(10);const after=window.energyProbe.engine.scene.center.x;document.dispatchEvent(new KeyboardEvent('keyup',{code:'ArrowRight',bubbles:true}));key(false);step(6);return {before,after,fresh:window.energyProbe.engine.scene.center.x};}
  finally{performance.now=original;window.energyCleanup();}
 });expect(result.after).toBe(result.before);expect(result.fresh).toBeGreaterThan(result.after);
});
