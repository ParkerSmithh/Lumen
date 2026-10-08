import {test,expect} from '@playwright/test';
async function clock(page){await page.addInitScript(()=>{let offset=0;const now=performance.now.bind(performance),raf=requestAnimationFrame.bind(window);performance.now=()=>now()+offset;window.requestAnimationFrame=f=>raf(t=>f(t+offset));window.advanceArcade=s=>offset+=s*1000;});}
test('arcade ready, playing and results remain accessible at desktop and small viewports',async({page})=>{
 await clock(page);await page.goto('/');
 for(const size of [{width:1366,height:768},{width:390,height:480},{width:667,height:375}]){
  await page.setViewportSize(size);
  for(const mode of ['FLOW','SLASH','LAUNCH']){
   await page.getByRole('button',{name:mode,exact:true}).click();await expect(page.getByRole('button',{name:'START',exact:true})).toBeVisible();
   await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();
   await page.waitForTimeout(350);await page.screenshot({path:'.test-artifacts/arcade-'+mode+'-ready-'+size.width+'.png'});
   await page.getByRole('button',{name:'START',exact:true}).focus();await page.keyboard.press('Enter');await page.evaluate(()=>window.advanceArcade(3));await expect(page.getByLabel('Time remaining')).toBeVisible();
   await page.screenshot({path:'.test-artifacts/arcade-'+mode+'-playing-'+size.width+'.png'});
   await page.evaluate(()=>window.advanceArcade(121));await expect(page.getByRole('button',{name:'PLAY AGAIN',exact:true})).toBeVisible();
   const button=page.getByRole('button',{name:'PLAY AGAIN',exact:true});expect(await button.evaluate(el=>{const r=el.getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
   await page.waitForTimeout(350);await page.screenshot({path:'.test-artifacts/arcade-'+mode+'-results-'+size.width+'.png'});
   await page.getByRole('button',{name:'GLOW',exact:true}).click();
  }
 }
});
test('storage denied and reduced motion preserve completed games and stationary targets',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await clock(page);
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}});});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?debugKinetic');
 await page.getByRole('button',{name:'LAUNCH',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();await page.getByRole('button',{name:'START',exact:true}).click();await page.evaluate(()=>window.advanceArcade(3));await expect(page.getByLabel('Time remaining')).toBeVisible();
 await page.evaluate(()=>window.advanceArcade(50));await expect.poll(()=>page.evaluate(()=>!!window.__lumenKinetic.instance.target)).toBe(true);
 expect(await page.evaluate(()=>window.__lumenKinetic.instance.target.moving)).toBe(false);
 await page.evaluate(()=>window.advanceArcade(120));await expect(page.getByRole('button',{name:'PLAY AGAIN',exact:true})).toBeEnabled();expect(errors).toEqual([]);
});
