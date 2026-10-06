import { test, expect } from '@playwright/test';
test('FLOW paints with fallback and GLOW retains six colors', async ({page}) => {
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/'); await page.getByRole('button',{name:'FLOW',exact:true}).click();
  await page.getByRole('button',{name:'Use mouse / touch'}).click();
  await page.mouse.move(300,350);
  for(let i=0;i<20;i++) await page.mouse.move(300+i*25,350+Math.sin(i*.5)*90);
  await page.waitForTimeout(100);
  await page.screenshot({path:'.test-artifacts/flow-mouse.png'});
  await expect(page.locator('#fluid')).toBeVisible();
  await expect(page.locator('video')).toBeHidden();
  for(let i=0;i<4;i++) { await page.getByRole('button',{name:'GLOW',exact:true}).click(); await page.getByRole('button',{name:'FLOW',exact:true}).click(); }
  await page.getByRole('button',{name:'GLOW',exact:true}).click();
  for(const name of ['Red','Orange','Yellow','Green','Blue','Purple']) await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});
test('FLOW WebGL failure leaves GLOW available', async ({page}) => {
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:original.call(this,type,...args)};});
  await page.goto('/'); await page.getByRole('button',{name:'FLOW',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('WebGL');
  await page.getByRole('button',{name:'GLOW',exact:true}).click();
  await page.getByRole('button',{name:'Preview light'}).click();
  await expect(page.getByText('Illustrated preview · camera off')).toBeVisible();
});
