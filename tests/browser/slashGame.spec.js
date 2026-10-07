import { test, expect } from '@playwright/test';

async function setup(page, camera = false) {
  await page.addInitScript(({ camera }) => {
    const now = performance.now.bind(performance), raf = requestAnimationFrame.bind(window);
    let offset = 0;
    performance.now = () => now() + offset;
    window.requestAnimationFrame = callback => raf(time => callback(time + offset));
    Math.random=()=>.5;
    window.advanceSlashTime = seconds => { offset += seconds * 1000; };
    window.setHidden = hidden => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
      document.dispatchEvent(new Event('visibilitychange'));
    };
    if (camera) {
      navigator.mediaDevices.getUserMedia = async () => {
        const canvas = document.createElement('canvas'); canvas.width=640; canvas.height=480;
        canvas.getContext('2d').fillRect(0,0,640,480);
        return canvas.captureStream(30);
      };
      window.Worker = class {
        postMessage(data) {
          if(data.type==='init')queueMicrotask(()=>this.onmessage?.({data:{type:'ready'}}));
          if(data.type==='frame'){data.frame.close();queueMicrotask(()=>this.onmessage?.({data:{type:'hand',landmarks:null,timestamp:data.timestamp,sourceWidth:640,sourceHeight:480}}));}
        }
        terminate(){}
      };
    }
  }, { camera });
  await page.goto('/?debugSlash');
  await page.getByRole('button',{name:'SLASH',exact:true}).click();
  if(camera)await page.getByRole('button',{name:'Enter with camera',exact:true}).click();
  else await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();
}
async function advance(page, seconds) {
  await page.evaluate(seconds=>window.advanceSlashTime(seconds),seconds);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

test('keyboard starts countdown, multi-hit score ends exactly, replay and leaving reset', async ({page})=>{
  await setup(page);
  await page.waitForTimeout(350);
  for(const viewport of [{width:1366,height:768},{width:390,height:844},{width:390,height:480},{width:667,height:375}]){
    await page.setViewportSize(viewport);
    await page.screenshot({path:`.test-artifacts/slash-game-ready-${viewport.width}-${viewport.height}.png`});
    const overlay=await page.getByLabel('SLASH game',{exact:true}).boundingBox();
    expect(overlay.x).toBeGreaterThanOrEqual(0);expect(overlay.y).toBeGreaterThanOrEqual(0);
    expect(overlay.x+overlay.width).toBeLessThanOrEqual(viewport.width);
    expect(overlay.y+overlay.height).toBeLessThanOrEqual(viewport.height);
    await expect(page.getByRole('status')).toHaveCSS('opacity','0');
  }
  await page.setViewportSize({width:1366,height:768});
  await expect(page.getByRole('button',{name:'START',exact:true})).toBeVisible();
  await expect(page.getByLabel('Interaction guide')).toContainText('SWIPE / DRAG');
  await page.getByRole('button',{name:'START',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(page.getByLabel('Starting in')).toHaveText('3');
  await advance(page,1);await expect(page.getByLabel('Starting in')).toHaveText('2');
  await advance(page,1);await expect(page.getByLabel('Starting in')).toHaveText('1');
  await advance(page,1);await expect(page.getByLabel('Time remaining')).toHaveText('2:00');
  await page.screenshot({path:'.test-artifacts/slash-game-playing-desktop.png'});
  // Advance gradually to fill three targets, then use the actual pointer recognition/collision path.
  for(let i=0;i<60;i++)await advance(page,.1);
  await expect.poll(()=>page.evaluate(()=>window.__lumenSlash.inspect().objects.length)).toBe(3);
  const objects=await page.evaluate(()=>window.__lumenSlash.inspect().objects);
  const targets=objects.sort((a,b)=>a.x-b.x);
  await page.mouse.move(targets[0].x-70,targets[0].y);await page.mouse.down();
  let previous={x:targets[0].x-70,y:targets[0].y};
  for(const target of [...targets,{x:targets.at(-1).x+70,y:targets.at(-1).y}]){
    const steps=Math.ceil(Math.hypot(target.x-previous.x,target.y-previous.y)/38);
    for(let i=1;i<=steps;i++){await page.mouse.move(previous.x+(target.x-previous.x)*i/steps,previous.y+(target.y-previous.y)*i/steps);await page.waitForTimeout(16);}
    previous=target;
  }
  await page.mouse.up();
  await expect(page.getByLabel('Objects slashed')).toHaveText('3');
  await advance(page,120);
  await expect(page.getByLabel('Final result')).toHaveText('3 SLASHED');
  await page.waitForTimeout(800);
  await page.screenshot({path:'.test-artifacts/slash-game-results-desktop.png'});
  await expect(page.getByLabel('Time remaining')).toHaveText('0:00');
  await page.getByRole('button',{name:'PLAY AGAIN',exact:true}).focus();await page.keyboard.press('Space');
  await expect(page.getByLabel('Starting in')).toHaveText('3');
  expect(await page.evaluate(()=>window.__lumenSlash.inspect().objects.length)).toBe(0);
  await page.getByRole('button',{name:'FLOW',exact:true}).click();
  expect(await page.evaluate(()=>!!window.__lumenSlash)).toBe(false);
  await page.getByRole('button',{name:'SLASH',exact:true}).click();
  await expect(page.getByRole('button',{name:'START',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'START',exact:true})).toBeDisabled();
});

test('hidden countdown and active game freeze until explicit keyboard resume',async({page})=>{
  await setup(page);await page.getByRole('button',{name:'START',exact:true}).click();
  await page.evaluate(()=>window.setHidden(true));await advance(page,50);
  await page.evaluate(()=>window.setHidden(false));
  await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.__lumenSlash.state().countdown)).toBe(3);
  await page.getByRole('button',{name:'RESUME',exact:true}).focus();await page.keyboard.press('Enter');
  await advance(page,4);const before=await page.getByLabel('Time remaining').innerText();
  await page.mouse.move(350,410);await page.mouse.down();
  await page.evaluate(()=>window.setHidden(true));await advance(page,100);
  await page.evaluate(()=>window.setHidden(false));
  await expect(page.getByLabel('Time remaining')).toHaveText(before);
  await page.getByRole('button',{name:'RESUME',exact:true}).click();
  await page.mouse.move(850,410);await page.mouse.up();
  await advance(page,1);expect(await page.getByLabel('Time remaining').innerText()).not.toBe(before);
  expect(await page.evaluate(()=>window.__lumenSlash.state().count)).toBe(0);
});

test('camera interruption freezes play, restart requires resume without a false hit',async({page})=>{
  await setup(page,true);await page.getByRole('button',{name:'START',exact:true}).click();
  await advance(page,5);await page.getByRole('button',{name:'Stop camera',exact:true}).click();
  await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeDisabled();
  const before=await page.getByLabel('Time remaining').innerText();await advance(page,90);
  await expect(page.getByLabel('Time remaining')).toHaveText(before);
  await page.getByRole('button',{name:'Enter with camera',exact:true}).click();
  await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'RESUME',exact:true}).click();await advance(page,.1);
  await expect(page.getByLabel('Objects slashed')).toHaveText('0');
});

test('paused video freezes play even while webcam status is ready',async({page})=>{
  await setup(page,true);await page.getByRole('button',{name:'START',exact:true}).click();
  await advance(page,5);
  await page.locator('video').evaluate(video=>video.pause());
  await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeDisabled();
  const before=await page.getByLabel('Time remaining').innerText();await advance(page,90);
  await expect(page.getByLabel('Time remaining')).toHaveText(before);
  await page.locator('video').evaluate(video=>video.play());
  await expect(page.getByRole('button',{name:'RESUME',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'RESUME',exact:true}).click();await advance(page,.1);
  await expect(page.getByLabel('Objects slashed')).toHaveText('0');
});
