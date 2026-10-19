import {test,expect} from '@playwright/test';

test('welcome and mode cards explore without requesting a camera',async({page})=>{
  await page.addInitScript(()=>{window.captureAttempts=0;navigator.mediaDevices.getUserMedia=async()=>{window.captureAttempts++;throw new DOMException('Test denial','NotAllowedError');};});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'LUMEN',exact:true}).last()).toBeVisible();
  const picker=page.getByRole('region',{name:'Experience selection'});
  await expect(picker).toBeVisible();
  for(const name of ['Choose GLOW','Choose FLOW','Choose SLASH','Choose KINETIC','Choose ENERGY RUSH'])await expect(picker.getByRole('button',{name:name==='LAUNCH'?'KINETIC':name,exact:true})).toBeVisible();
  await picker.getByRole('button',{name:'Choose FLOW',exact:true}).click();await page.getByRole('button',{name:'Explore without camera',exact:true}).click();
  await expect(page.getByRole('button',{name:'FLOW',exact:true})).toHaveAttribute('aria-current','page');
  expect(await page.evaluate(()=>window.captureAttempts)).toBe(0);
  await page.getByRole('button',{name:'EXPLORE MODES',exact:true}).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'EXPLORE MODES',exact:true})).toBeFocused();
});

test('About explains local processing and restores focus without changing camera preferences',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('lumen.camera.v1',JSON.stringify({version:1,remember:false,autoReconnect:false,deviceId:'',facingMode:'user'})));
  await page.goto('/');
  const before=await page.evaluate(()=>localStorage.getItem('lumen.camera.v1'));
  const open=page.getByRole('button',{name:'ABOUT LUMEN',exact:true});await open.click();
  const about=page.getByRole('dialog',{name:'Movement becomes light.'});
  await expect(about.getByRole('heading',{name:'Privacy, by design.'})).toBeVisible();
  await expect(about.getByText(/never uploads or records your camera feed/)).toBeVisible();
  await page.keyboard.press('Escape');await expect(open).toBeFocused();
  expect(await page.evaluate(()=>localStorage.getItem('lumen.camera.v1'))).toBe(before);
});

test('mode picker remains scrollable and keyboard accessible on short screens with reduced motion',async({page})=>{
  await page.setViewportSize({width:667,height:375});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await page.getByRole('button',{name:'EXPLORE MODES',exact:true}).click();
  const picker=page.getByRole('region',{name:'Experience selection'});
  await picker.getByRole('button',{name:'Choose KINETIC',exact:true}).click();await page.getByRole('button',{name:'Explore without camera',exact:true}).click();
  await expect(picker).toHaveCount(0);await expect(page.getByRole('button',{name:'KINETIC',exact:true})).toBeFocused();
});
