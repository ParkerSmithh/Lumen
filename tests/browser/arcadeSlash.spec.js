import {test,expect} from '@playwright/test';
import {installArcadeClock,slashPointerStep} from './arcadeClock.js';
for(const driverDelay of [0,150])test('SLASH truthful multi-hit count, combo score, expiration and overload; driver delay '+driverDelay,async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>.5;});
 await installArcadeClock(page);
 await page.goto('/?debugSlash');await page.getByRole('button',{name:'SLASH',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();await page.getByRole('button',{name:'START',exact:true}).click();await page.evaluate(()=>window.arcadeAdvance(3));await expect(page.getByLabel('Time remaining')).toBeVisible();
 for(let n=0;n<60;n++){await page.evaluate(()=>window.arcadeAdvance(.1));await page.evaluate(()=>new Promise(requestAnimationFrame));}
 await page.evaluate(()=>window.arcadeClock.hold());
 const objects=await page.evaluate(()=>window.__lumenSlash.inspect().objects);expect(objects.length).toBe(3);
 const points=objects.sort((a,b)=>a.x-b.x);await slashPointerStep(page,points[0].x-80,points[0].y,{driverDelay});await page.mouse.down();await page.evaluate(()=>new Promise(requestAnimationFrame));
 let previous={x:points[0].x-80,y:points[0].y};for(const point of [...points,{x:points.at(-1).x+80,y:points.at(-1).y}]){const steps=Math.ceil(Math.hypot(point.x-previous.x,point.y-previous.y)/38);for(let i=1;i<=steps;i++){await slashPointerStep(page,previous.x+(point.x-previous.x)*i/steps,previous.y+(point.y-previous.y)*i/steps,{driverDelay});}previous=point;}await page.mouse.up();await page.evaluate(()=>window.arcadeClock.release());
 await expect(page.getByLabel('Objects slashed')).toHaveText('3');await expect(page.getByLabel('Score',{exact:true})).toHaveText('400');await expect(page.getByText('COMBO 3',{exact:true})).toBeVisible();
 await page.evaluate(()=>window.arcadeAdvance(2.01));await expect(page.getByText('COMBO 3',{exact:true})).toHaveCount(0);
 await page.evaluate(()=>window.arcadeAdvance(100));await expect(page.getByText('OVERLOAD',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>window.__lumenSlash.state().cap)).toBe(10);
 await page.evaluate(()=>window.arcadeAdvance(120));await expect(page.getByRole('button',{name:'PLAY AGAIN'})).toBeVisible();await expect(page.getByText('NEW BEST',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.arcade.bests.chaos.v1.SLASH')).metrics)).toMatchObject({score:400,count:3});
});
