import {test,expect} from '@playwright/test';
async function setup(page){
 await page.addInitScript(()=>{let offset=0;const now=performance.now.bind(performance),raf=requestAnimationFrame.bind(window);performance.now=()=>now()+offset;window.requestAnimationFrame=f=>raf(t=>f(t+offset));window.arcadeAdvance=s=>offset+=s*1000;});
 await page.goto('/?debugTrace');await page.getByRole('button',{name:'FLOW',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();await page.getByRole('button',{name:'START',exact:true}).click();await page.evaluate(()=>window.arcadeAdvance(3));await expect(page.getByLabel('Time remaining')).toBeVisible();
}
test('quality score, chain, skip isolation and completed-only personal bests',async({page})=>{
 await setup(page);const path=await page.evaluate(()=>window.__lumenTrace.target());
 for(const p of path){await page.mouse.move(p.x*1366,p.y*768);await page.waitForTimeout(16);}
 await expect(page.getByLabel('SHAPES',{exact:true})).toHaveText('1');await expect(page.getByLabel('Score',{exact:true})).toHaveText('200');
 await expect(page.getByText('PERFECT TRACE',{exact:true})).toBeVisible();await expect(page.getByText('CHAIN 1',{exact:true})).toBeVisible();
 await page.waitForTimeout(700);await page.getByRole('button',{name:'SKIP',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(page.getByLabel('SHAPES',{exact:true})).toHaveText('1');await expect(page.getByLabel('Score',{exact:true})).toHaveText('200');await expect(page.getByText('CHAIN 1',{exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('lumen.arcade.bests.v1.FLOW'))).toBeNull();
 await page.evaluate(()=>window.arcadeAdvance(90));await expect(page.getByRole('button',{name:'PLAY AGAIN'})).toBeVisible();
 await expect(page.getByText('NEW BEST',{exact:true})).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.arcade.bests.v1.FLOW')).metrics)).toMatchObject({score:200,count:1});
 await page.getByRole('button',{name:'PLAY AGAIN'}).click();await page.evaluate(()=>window.arcadeAdvance(3));await expect(page.getByLabel('Score',{exact:true})).toHaveText('0');
 await page.getByRole('button',{name:'GLOW',exact:true}).click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.arcade.bests.v1.FLOW')).metrics.score)).toBe(200);
});
