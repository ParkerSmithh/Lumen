import {test,expect} from '@playwright/test';
for(const reset of [false,true])test('actual boundary reflection earns one bank bonus'+(reset?' after count reset':''),async({page})=>{
 await page.goto('/');const result=await page.evaluate(async reset=>{
  const {createBallpit}=await import('/src/effects/Ballpit.jsx'),{createLaunchArcade}=await import('/src/game/launchArcade.js');
  Math.random=()=>.5;const host=document.createElement('div');host.style.cssText='position:absolute;width:1000px;height:560px';document.body.append(host);const canvas=document.createElement('canvas');host.append(canvas);let elapsed=0,walls=0;const arcade=createLaunchArcade();
  const gameRef={current:{session:1,state:()=>({phase:'playing',paused:false,elapsed,progress:elapsed/120}),color:()=> '#4d9fff',created:slot=>arcade.created(slot),grabbed:slot=>arcade.grabbed(slot),wallBounce:slot=>{walls++;arcade.wallBounce(slot,elapsed);},hit:event=>{arcade.hit(event,elapsed);return true;},reach:()=>({x:.25,y:.25,width:.5,height:.5})}};
  const pit=createBallpit(canvas,{count:151,maxActive:150,interactiveCreation:true,followCursor:false,gravity:.01,friction:1,wallBounce:.95,maxVelocity:.15,minSize:.4,maxSize:.4,colors:[0xffffff,0xffffff]}, {current:{gameRef}});const step=pit.three.onBeforeRender;pit.three.onBeforeRender=()=>{};
  try{step({delta:1/60,elapsed:0});if(reset)pit.setCount(151);const p=pit.spheres.physics;pit.spawn({x:p.config.maxX-.43,y:0,z:-.65},'#4d9fff');p.velocityData.set([.14,0,0],3);
   for(let n=0;n<170&&arcade.snapshot().count===0;n++){elapsed+=1/60;step({delta:1/60,elapsed});}
   return {...arcade.snapshot(),walls};
  }finally{pit.dispose();host.remove();}
 },reset);expect(result.count).toBe(1);expect(result.score).toBe(200);expect(result.walls).toBe(1);
});
test('moving and bonus targets, scores, replay and local records run through the mode',async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>.5;let offset=0;const now=performance.now.bind(performance),raf=requestAnimationFrame.bind(window);performance.now=()=>now()+offset;window.requestAnimationFrame=f=>raf(t=>f(t+offset));window.advanceArcade=s=>offset+=s*1000;});
 await page.goto('/?debugKinetic');await page.getByRole('button',{name:'LAUNCH',exact:true}).click();await page.getByRole('button',{name:'Mouse / touch fallback',exact:true}).click();await page.getByRole('button',{name:'START',exact:true}).click();await page.evaluate(()=>window.advanceArcade(3));await expect(page.getByLabel('Time remaining')).toBeVisible();
 await page.mouse.click(683,384);await expect(page.getByLabel('Score',{exact:true})).toHaveText('100');await expect(page.getByLabel('TARGETS HIT',{exact:true})).toHaveText('1');
 await page.evaluate(()=>window.advanceArcade(50));
 await page.evaluate(()=>{const pit=window.__lumenKinetic.instance;pit.spheres.physics.positionData.fill(0);pit.spheres.physics.config.activeCount=1;});
 // Retire targets through real swept shots, clearing only test fixture matter between shots.
 for(let n=1;n<6;n++){
  await expect.poll(()=>page.evaluate(()=>!!window.__lumenKinetic.instance.target)).toBe(true);
  if(n===2){expect(await page.evaluate(()=>window.__lumenKinetic.instance.target.moving)).toBe(true);const x=await page.evaluate(()=>window.__lumenKinetic.instance.target.x);await page.waitForTimeout(180);expect(await page.evaluate(()=>window.__lumenKinetic.instance.target.x)).not.toBe(x);}if(n===5)expect(await page.evaluate(()=>window.__lumenKinetic.instance.target.type)).toBe('bonus');
  await page.evaluate(()=>{const pit=window.__lumenKinetic.instance,t=pit.target;pit.spawn({x:t.x,y:t.y,z:1.4},'#4d9fff');});
  await expect(page.getByLabel('TARGETS HIT',{exact:true})).toHaveText(String(n+1));
  await page.evaluate(()=>{const pit=window.__lumenKinetic.instance;pit.spheres.physics.config.activeCount=1;});
 }
 await page.evaluate(()=>window.advanceArcade(120));await expect(page.getByRole('button',{name:'PLAY AGAIN'})).toBeVisible();await expect(page.getByText('NEW BEST',{exact:true})).toBeVisible();
 const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('lumen.arcade.bests.v1.LAUNCH')).metrics);expect(record.count).toBe(6);expect(record.score).toBeGreaterThanOrEqual(600);
 await page.getByRole('button',{name:'PLAY AGAIN'}).click();await page.evaluate(()=>window.advanceArcade(3));await expect(page.getByLabel('Score',{exact:true})).toHaveText('0');expect(await page.evaluate(()=>window.__lumenKinetic.instance.spheres.activeCount)).toBe(0);
});
