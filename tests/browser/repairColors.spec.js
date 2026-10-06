import {test,expect} from '@playwright/test';
test('selected color survives every mode and camera frame stays contained',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Blue',exact:true}).click();
 for(const mode of ['FLOW','SLASH','LAUNCH','GLOW']){await page.getByRole('button',{name:mode,exact:true}).click();await expect(page.getByRole('button',{name:'Blue',exact:true})).toHaveAttribute('aria-pressed','true');}
 await page.getByRole('button',{name:'Preview light'}).click();
 for(const size of [{width:1366,height:768},{width:390,height:844},{width:800,height:400}]){
  await page.setViewportSize(size);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const r=await page.locator('.glow-artwork').boundingBox();expect(r.width/r.height).toBeCloseTo(4/3,1);expect(r.y).toBeGreaterThan(80);expect(r.y+r.height).toBeLessThan(size.height-100);
 }
});
