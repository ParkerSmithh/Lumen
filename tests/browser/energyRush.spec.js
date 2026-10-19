import {enterArtwork} from './enterArtwork.js';
import {startGame} from './startGame.js';
import {test,expect} from '@playwright/test';
test('GLOW preserves preview and offers accessible ENERGY RUSH with keyboard play',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?debugEnergy');await enterArtwork(page);
 await page.getByRole('button',{name:'Preview light',exact:true}).click();await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();
 await expect(page.getByRole('heading',{name:'ENERGY RUSH',exact:true})).toBeVisible();await expect(page.getByText('YOUR BODY IS THE CONTROLLER')).toBeVisible();
 await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await startGame(page);
 await expect(page.getByRole('button',{name:'PAUSE',exact:true})).toBeVisible({timeout:10000});await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');
 expect(await page.evaluate(()=>window.__lumenEnergy.snapshot().inputMode)).toBe('assist');await page.getByRole('button',{name:'PAUSE',exact:true}).click();const elapsed=await page.evaluate(()=>window.__lumenEnergy.snapshot().elapsed);await page.waitForTimeout(300);
 expect(await page.evaluate(()=>window.__lumenEnergy.snapshot().elapsed)).toBe(elapsed);await page.getByRole('button',{name:'RESUME',exact:true}).click();await page.getByRole('button',{name:'EXIT',exact:true}).click();
 await expect(page.getByText('Illustrated preview · camera off')).toBeVisible();await expect(page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true})).toBeVisible();expect(errors).toEqual([]);
});
test('gallery freezes the round and returning requires explicit resume',async({page})=>{
 await page.goto('/?debugEnergy');await enterArtwork(page);await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await startGame(page);await expect(page.getByRole('button',{name:'PAUSE',exact:true})).toBeVisible({timeout:10000});
 await page.getByRole('button',{name:'ECHOES',exact:true}).click();const before=await page.evaluate(()=>window.__lumenEnergy.snapshot().elapsed);await page.waitForTimeout(300);expect(await page.evaluate(()=>window.__lumenEnergy.snapshot().elapsed)).toBe(before);await page.getByRole('button',{name:'BACK TO LUMEN',exact:true}).click();await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeVisible();
});
test('reduced-motion touch play and controls fit mobile and short screens',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.goto('/?debugEnergy');await enterArtwork(page);await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await page.screenshot({path:'.test-artifacts/energy-rush-mobile-ready.png'});await startGame(page);await expect(page.getByRole('button',{name:'PAUSE',exact:true})).toBeVisible({timeout:10000});await expect(page.getByRole('group',{name:'Touch movement'})).toBeVisible();
 await page.screenshot({path:'.test-artifacts/energy-rush-mobile.png'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.setViewportSize({width:390,height:480});await page.getByRole('button',{name:'PAUSE',exact:true}).click();await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeInViewport();await expect(page.getByRole('button',{name:'EXIT',exact:true})).toBeInViewport();await page.screenshot({path:'.test-artifacts/energy-rush-short.png'});
});
test('camera denial offers assisted play without counting an illustrated silhouette',async({page})=>{
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied','NotAllowedError');};});await page.goto('/');await enterArtwork(page);await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await expect(page.getByRole('button',{name:'START GAME',exact:true})).toBeDisabled();await page.getByRole('button',{name:'ENABLE CAMERA',exact:true}).click();await expect(page.getByRole('button',{name:'Keyboard / touch',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await expect(page.getByRole('button',{name:'START GAME',exact:true})).toBeEnabled();
});
test('repeated exit and replay keep canvas ownership bounded and preserve color controls',async({page})=>{
 await page.goto('/?debugEnergy');await enterArtwork(page);const canvases=await page.locator('.glow-artwork canvas').count();
 for(let i=0;i<4;i++){await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await startGame(page);await page.getByRole('button',{name:'EXIT',exact:true}).click();expect(await page.locator('.glow-artwork canvas').count()).toBe(canvases);expect(await page.evaluate(()=>window.__lumenEnergy.snapshot().orbs.length)).toBe(0);}
 await page.getByRole('button',{name:'Blue',exact:true}).click();await expect(page.getByRole('button',{name:'Blue',exact:true})).toHaveAttribute('aria-pressed','true');
});
test('short-screen HUD metrics do not overlap intensity controls',async({page})=>{
 await page.setViewportSize({width:390,height:480});await page.goto('/');await enterArtwork(page);await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await startGame(page);await expect(page.getByRole('button',{name:'PAUSE',exact:true})).toBeVisible({timeout:10000});
 const metrics=await page.locator('.energy-metrics').boundingBox(),intensity=await page.getByRole('group',{name:'Visual intensity'}).boundingBox();expect(metrics.y).toBeGreaterThanOrEqual(intensity.y+intensity.height);
});
test('real touch-pad crossing collects a target once at normal frame cadence',async({page})=>{
 await page.goto('/?debugEnergy');await enterArtwork(page);await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await startGame(page);await expect(page.getByRole('button',{name:'PAUSE',exact:true})).toBeVisible({timeout:10000});
 await expect.poll(()=>page.evaluate(()=>{const s=window.__lumenEnergy.snapshot();return s.orbs.some(o=>s.elapsed-o.born>=.5);}),{timeout:10000}).toBe(true);
 const orb=await page.evaluate(()=>{const s=window.__lumenEnergy.snapshot();return s.orbs.find(o=>s.elapsed-o.born>=.5);}),pad=await page.locator('.energy-touch-pad').boundingBox();
 await page.mouse.move(pad.x+2,pad.y+pad.height*.5);await page.mouse.down();await page.waitForTimeout(80);await page.mouse.move(pad.x+(orb.x-.06)/.88*pad.width,pad.y+(orb.y-.1)/.8*pad.height,{steps:20});await page.mouse.up();
 await expect.poll(()=>page.evaluate(()=>window.__lumenEnergy.snapshot().collections)).toBe(1);await page.waitForTimeout(200);expect(await page.evaluate(()=>window.__lumenEnergy.snapshot().collections)).toBe(1);
});
test('completed corrected-rule round records v2 bests and replays cleanly',async({page})=>{
 await page.addInitScript(()=>{const native=requestAnimationFrame.bind(window);let time=performance.now(),last=null;performance.now=()=>time;window.requestAnimationFrame=fn=>native(t=>{if(t!==last){last=t;time+=100;}fn(time);});});
 await page.goto('/?debugEnergy');await enterArtwork(page);await page.getByRole('button',{name:'PLAY ENERGY RUSH',exact:true}).click();await page.getByRole('button',{name:'Keyboard / touch',exact:true}).click();await startGame(page);await expect(page.getByRole('button',{name:'REPLAY',exact:true})).toBeVisible({timeout:20000});
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.arcade.bests.energy-rush.v2.assist')).rulesVersion)).toBe(2);await page.getByRole('button',{name:'REPLAY',exact:true}).click();expect(await page.evaluate(()=>window.__lumenEnergy.snapshot().score)).toBe(0);expect(await page.evaluate(()=>window.__lumenEnergy.snapshot().shields)).toBe(3);
});
