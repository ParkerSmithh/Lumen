import {test,expect} from '@playwright/test';
test('SLASH truthful multi-hit count, combo score, expiration and overload',async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>.5;let offset=0;const now=performance.now.bind(performance),raf=requestAnimationFrame.bind(window);performance.now=()=>now()+offset;window.requestAnimationFrame=f=>raf(t=>f(t+offset));window.arcadeAdvance=s=>offset+=s*1000;});
 await page.goto('/?debugSlash');await page.getByRole('button',{name:'SLASH',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();await page.getByRole('button',{name:'START',exact:true}).click();await page.evaluate(()=>window.arcadeAdvance(3));await expect(page.getByLabel('Time remaining')).toBeVisible();
 for(let n=0;n<60;n++){await page.evaluate(()=>window.arcadeAdvance(.1));await page.evaluate(()=>new Promise(requestAnimationFrame));}
 const objects=await page.evaluate(()=>window.__lumenSlash.inspect().objects);expect(objects.length).toBe(3);
 const points=objects.sort((a,b)=>a.x-b.x);await page.mouse.move(points[0].x-80,points[0].y);await page.mouse.down();
 for(const point of [...points,{x:points.at(-1).x+80,y:points.at(-1).y}]){await page.mouse.move(point.x,point.y,{steps:8});await page.waitForTimeout(20);}await page.mouse.up();
 await expect(page.getByLabel('Objects slashed')).toHaveText('3');await expect(page.getByLabel('Score',{exact:true})).toHaveText('400');await expect(page.getByText('COMBO 3',{exact:true})).toBeVisible();
 await page.evaluate(()=>window.arcadeAdvance(2.01));await expect(page.getByText('COMBO 3',{exact:true})).toHaveCount(0);
 await page.evaluate(()=>window.arcadeAdvance(100));await expect(page.getByText('OVERLOAD',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>window.__lumenSlash.state().cap)).toBe(8);
 await page.evaluate(()=>window.arcadeAdvance(120));await expect(page.getByRole('button',{name:'PLAY AGAIN'})).toBeVisible();await expect(page.getByText('NEW BEST',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.arcade.bests.v1.SLASH')).metrics)).toMatchObject({score:400,count:3});
});
