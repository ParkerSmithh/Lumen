import { test,expect } from '@playwright/test';
test('LAUNCH renders, supports fallback, and repeatedly remounts',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&message.text().includes('THREE.'))errors.push(message.text());});
  await page.goto('/');await page.getByRole('button',{name:'LAUNCH',exact:true}).click();
  await expect(page.locator('.launch-artwork canvas')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Enter with camera');
  await page.getByRole('button',{name:'Mouse / touch fallback'}).click();
  await page.mouse.click(440,450);await page.mouse.move(440,450);await page.waitForTimeout(60);
  for(let x=450;x<650;x+=5){await page.mouse.move(x,450);await page.waitForTimeout(25);}
  await page.screenshot({path:'.test-artifacts/launch-slow.png'});
  for(let x=650;x<1000;x+=45){await page.mouse.move(x,450);await page.waitForTimeout(20);}
  await page.screenshot({path:'.test-artifacts/launch-fast.png'});
  for(let i=0;i<3;i++){await page.getByRole('button',{name:'FLOW',exact:true}).click();await expect(page.locator('#fluid')).toBeVisible();await page.getByRole('button',{name:'LAUNCH',exact:true}).click();await expect(page.locator('.launch-artwork canvas')).toBeVisible();}
  await page.getByRole('button',{name:'SLASH',exact:true}).click();await expect(page.locator('.slash-artwork')).toBeVisible();
  await page.getByRole('button',{name:'GLOW',exact:true}).click();await expect(page.getByRole('button',{name:'Purple',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});
test('LAUNCH WebGL failure leaves navigation and GLOW available',async({page})=>{
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:original.call(this,type,...args)};});
  await page.goto('/');await page.getByRole('button',{name:'LAUNCH',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('unavailable');
  await page.getByRole('button',{name:'GLOW',exact:true}).click();await page.getByRole('button',{name:'Preview light'}).click();
  await expect(page.getByText('Illustrated preview · camera off')).toBeVisible();
});
