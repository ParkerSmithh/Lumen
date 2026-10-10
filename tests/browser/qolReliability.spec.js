import {test,expect} from '@playwright/test';
import {installArcadeClock} from './arcadeClock.js';
async function start(page,mode){
 await installArcadeClock(page);await page.goto('/?debugTrace&debugSlash&debugKinetic');
 await page.getByRole('button',{name:mode,exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();
 await page.getByRole('button',{name:mode==='LAUNCH'?'Keyboard / touch':'Mouse / touch',exact:true}).click();
 await page.getByRole('button',{name:'START GAME',exact:true}).click();await page.evaluate(()=>window.advance(3.1));await expect(page.getByLabel('Time remaining')).toBeVisible();
}
for(const mode of ['FLOW','SLASH','LAUNCH'])test(`${mode} blur pauses and repeated explicit resume preserves round time and score`,async({page})=>{
 await start(page,mode);
 for(let i=0;i<3;i++){
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeVisible();
  const time=await page.getByLabel('Time remaining').textContent(),score=await page.getByLabel('Score',{exact:true}).textContent();
  await page.evaluate(()=>window.advance(10));await page.mouse.move(500,400);await page.mouse.down();await page.mouse.move(700,400);await page.mouse.up();
  await expect(page.getByLabel('Time remaining')).toHaveText(time);await expect(page.getByLabel('Score',{exact:true})).toHaveText(score);
  await page.getByRole('button',{name:'RESUME',exact:true}).click();await expect(page.getByRole('button',{name:'RESUME',exact:true})).toHaveCount(0);
 }
});
test('FLOW viewport change pauses with an explanation and preserves round score',async({page})=>{
 await start(page,'FLOW');const score=await page.getByLabel('Score',{exact:true}).textContent();
 await page.setViewportSize({width:768,height:1024});await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeVisible();
 await expect(page.getByText(/screen changed/i)).toBeVisible();await expect(page.getByLabel('Score',{exact:true})).toHaveText(score);
 await page.getByRole('button',{name:'RESUME',exact:true}).click();await expect(page.getByLabel('Time remaining')).toBeVisible();
});
test('a stalled camera request ends loading and a late stream is released',async({page})=>{
 await page.addInitScript(()=>{
  const timer=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>timer(fn,ms===15000?50:ms,...args);
  navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>window.resolveCamera=resolve);
 });
 await page.goto('/');await page.getByRole('button',{name:'ENABLE CAMERA',exact:true}).click();
 await expect(page.getByRole('button',{name:'RETRY CAMERA',exact:true})).toBeVisible();
 await expect(page.getByText(/taking longer/i)).toBeVisible();
 const stopped=await page.evaluate(async()=>{let stops=0;window.resolveCamera({getTracks:()=>[{stop:()=>stops++}]});await new Promise(r=>setTimeout(r,0));return stops;});expect(stopped).toBe(1);
});
test('FLOW and LAUNCH wait for the hand pipeline while SLASH accepts frame motion',async({page})=>{
 await page.addInitScript(()=>{
  navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d');const draw=()=>{ctx.fillRect(0,0,640,480);requestAnimationFrame(draw);};draw();return c.captureStream(30);};
  window.Worker=class {postMessage(m){m.frame?.close();}terminate(){}};
 });
 await page.goto('/');
 for(const mode of ['FLOW','LAUNCH','SLASH']){
  await page.getByRole('button',{name:mode,exact:true}).click();await page.getByRole('button',{name:'PLAY',exact:true}).click();
  const dialog=page.getByRole('dialog');const enable=dialog.getByRole('button',{name:'ENABLE CAMERA',exact:true});if(await enable.isVisible())await enable.click();
  if(mode==='SLASH')await expect(dialog.getByRole('button',{name:'START GAME',exact:true})).toBeEnabled();
  else {await expect(dialog.getByRole('status')).toContainText(/preparing tracking/i);await expect(dialog.getByRole('button',{name:'START GAME',exact:true})).toBeDisabled();}
  await dialog.getByRole('button',{name:'BACK',exact:true}).click();await expect(dialog).toHaveCount(0);
 }
});
