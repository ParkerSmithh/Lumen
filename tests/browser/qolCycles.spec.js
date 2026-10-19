import {enterArtwork} from './enterArtwork.js';
import {test,expect} from '@playwright/test';
import {installArcadeClock} from './arcadeClock.js';
test('repeated all-game pause instruction finish replay navigation keeps scores and canvas ownership bounded',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await installArcadeClock(page);await page.goto('/');await enterArtwork(page);
 for(const mode of ['GLOW','FLOW','SLASH','LAUNCH']){
  await page.getByRole('button',{name:mode==='LAUNCH'?'KINETIC':mode,exact:true}).click();const energy=mode==='GLOW';
  await page.getByRole('button',{name:energy?'PLAY ENERGY RUSH':'PLAY',exact:true}).click();await page.getByRole('button',{name:energy||mode==='LAUNCH'?'Keyboard / touch':'Mouse / touch',exact:true}).click();await page.getByRole('button',{name:'START GAME',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  let canvases;
  // ENERGY RUSH deliberately pauses wall-time gaps >250ms. Drive admitted
  // 200ms frames rather than bypassing that protection with a time jump.
  const advance=async seconds=>{if(!energy){await page.evaluate(seconds=>window.advance(seconds),seconds);return;}await page.evaluate(async seconds=>{window.arcadeClock.hold();for(let i=0;i<Math.ceil(seconds*5);i++){window.advance(.2);await new Promise(requestAnimationFrame);if(document.querySelector('.energy-ui')?.dataset.energyPhase==='RESULTS')break;}},seconds);};
  for(let cycle=0;cycle<2;cycle++){
   await advance(3.1);await expect(page.getByRole('button',{name:'PAUSE',exact:true})).toBeVisible();await expect(page.getByLabel('Score',{exact:true})).toHaveText('0');if(mode==='SLASH')await expect(page.locator('.slash-grid-background canvas')).toBeVisible();canvases??=await page.locator('canvas').count();
   await page.getByRole('button',{name:'PAUSE',exact:true}).click();await page.getByRole('button',{name:'HOW TO PLAY',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.evaluate(()=>window.advance(10));await page.getByRole('button',{name:'BACK TO GAME',exact:true}).click();await page.getByRole('button',{name:'RESUME',exact:true}).click();
   await advance(200);const replay=page.getByRole('button',{name:energy?'REPLAY':'PLAY AGAIN',exact:true});await expect(replay).toBeVisible();expect(await page.locator('canvas').count()).toBe(canvases);
   if(cycle===0){await replay.click();await expect(page.getByRole('dialog')).toHaveCount(0);}
  }
  if(energy)await page.getByRole('button',{name:'EXIT',exact:true}).click();
 }
 expect(errors).toEqual([]);
});
