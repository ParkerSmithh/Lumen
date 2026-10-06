import { installFrameClock } from './frameClock.js';
import { test,expect } from '@playwright/test';
test('SLASH activates, fractures with a deliberate drag, and resets',async({page})=>{
  await installFrameClock(page);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.getByRole('button',{name:'SLASH',exact:true}).click();
  await expect(page.getByRole('button',{name:'LAUNCH',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Mouse / touch fallback'}).click();
  const started=await page.evaluate(()=>performance.now());
  await page.waitForFunction(start=>performance.now()-start>=1300,started,{timeout:30000});
  await page.screenshot({path:'.test-artifacts/slash-crystals.png'});
  // The first crystal enters the middle of the contained camera field.
  const {width,height}=page.viewportSize();
  await page.mouse.move(width*.3,height*.535);await page.mouse.down();
  for(let x=width*.32;x<=width*.72;x+=width*.025){await page.mouse.move(x,height*.535);await page.waitForTimeout(16);}
  await page.screenshot({path:'.test-artifacts/slash-impact.png'});
  await page.mouse.up();
  await expect(page.getByRole('status')).toContainText('Cut registered');
  await page.getByRole('button',{name:'FLOW',exact:true}).click();
  await expect(page.locator('#fluid')).toBeVisible();
  await page.getByRole('button',{name:'SLASH',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Enter with camera');
  await expect(page.locator('video')).toBeHidden();
  expect(errors).toEqual([]);
});
