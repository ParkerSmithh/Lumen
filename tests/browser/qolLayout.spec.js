import {test,expect} from '@playwright/test';
for(const size of [{width:1366,height:768},{width:768,height:1024},{width:390,height:844},{width:320,height:568},{width:844,height:390}])test(`QOL controls fit and have comfortable targets at ${size.width}x${size.height}`,async({page})=>{
 await page.setViewportSize(size);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 for(const mode of ['GLOW','FLOW','SLASH','LAUNCH']){
  await page.getByRole('button',{name:mode,exact:true}).click();
  const checks=await page.locator('nav button,.color-picker button,.chaos-control button,.camera-controls button:last-child,.echoes-open').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {name:el.getAttribute('aria-label')||el.textContent,width:r.width,height:r.height,inside:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
  for(const c of checks){expect(c.height,c.name).toBeGreaterThanOrEqual(44);expect(c.width,c.name).toBeGreaterThanOrEqual(44);expect(c.inside&&c.hit,c.name).toBe(true);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await expect(page.locator('.mode-loading')).toHaveCount(0);await page.screenshot({path:`.test-artifacts/qol-layout-${size.width}x${size.height}.png`});
});
