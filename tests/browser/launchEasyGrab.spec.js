import {test,expect} from '@playwright/test';
import {installArcadeClock} from './arcadeClock.js';
import {startGame} from './startGame.js';
test('keyboard acquires one visible ball and C cannot erase a held ball',async({page})=>{
 await installArcadeClock(page);await page.goto('/?debugKinetic');await page.getByRole('button',{name:'LAUNCH',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();await startGame(page);await page.evaluate(()=>window.advance(3.1));await expect(page.getByLabel('Time remaining')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>!!window.__lumenKinetic.instance.target)).toBe(true);
 const separation=await page.evaluate(()=>{
  const pit=window.__lumenKinetic.instance,p=pit.spheres.physics,target=pit.target,y=-pit.three.size.wHeight*.1;
  // Keep the random target away from this acquisition fixture. A free ball can
  // legitimately score between spawning/teleporting and the native Space input.
  const x=target.maxX,top=p.config.maxY-target.radius-.6;
  Object.assign(target,{x,baseX:x,y:top,baseY:top,previousCenter:{x,y:top,z:target.z}});
  pit.spawn({x:0,y,z:0},'#4d9fff');p.positionData.set([0,y,0],3);p.velocityData.fill(0);document.body.tabIndex=-1;document.body.focus();
  return {distance:Math.hypot(x,top-y),radii:target.radius+p.sizeData[1]};
 });
 expect(separation.distance).toBeGreaterThan(separation.radii);
 await page.keyboard.down('Space');await expect.poll(()=>page.evaluate(()=>window.__lumenKinetic.instance.grabbedCount)).toBe(1);const count=await page.evaluate(()=>window.__lumenKinetic.instance.spheres.config.activeCount);
 await page.keyboard.press('c');await page.waitForTimeout(100);expect(await page.evaluate(()=>window.__lumenKinetic.instance.grabbedCount)).toBe(1);expect(await page.evaluate(()=>window.__lumenKinetic.instance.spheres.config.activeCount)).toBe(count);
 // Acquiring and holding alone earn no points. A released throw can hit a target.
 await expect(page.getByLabel('Score',{exact:true})).toHaveText('0');
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(120);await page.keyboard.up('ArrowRight');await page.keyboard.up('Space');await expect.poll(()=>page.evaluate(()=>window.__lumenKinetic.instance.grabbedCount)).toBe(0);
 await page.keyboard.press('c');await expect.poll(()=>page.evaluate(()=>window.__lumenKinetic.instance.spheres.config.activeCount)).toBe(count+1);
});
