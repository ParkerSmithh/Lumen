import { test,expect } from '@playwright/test';
test('SLASH activates, fractures with a deliberate drag, and resets',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.getByRole('button',{name:'SLASH',exact:true}).click();
  await expect(page.getByRole('button',{name:'LAUNCH — coming later'})).toBeDisabled();
  await page.getByRole('button',{name:'Mouse fallback'}).click();
  await page.waitForTimeout(1300);
  await page.screenshot({path:'.test-artifacts/slash-crystals.png'});
  // The first crystal enters the middle of the contained camera field.
  await page.mouse.move(450,485);await page.mouse.down();
  for(let x=480;x<=980;x+=35){await page.mouse.move(x,485);await page.waitForTimeout(16);}
  await page.screenshot({path:'.test-artifacts/slash-impact.png'});
  await page.mouse.up();
  await expect(page.getByRole('status')).toContainText('Cut registered');
  await page.getByRole('button',{name:'FLOW',exact:true}).click();
  await expect(page.locator('#fluid')).toBeVisible();
  await page.getByRole('button',{name:'SLASH',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Raise your hand');
  await expect(page.locator('video')).toBeHidden();
  expect(errors).toEqual([]);
});
