import { test,expect } from '@playwright/test';
test('the supplied solver receives one local flick impulse, retains gentle control and clamps collisions',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {createBallpit}=await import('/src/effects/Ballpit.jsx');
    const host=document.createElement('div');host.style.cssText='position:absolute;width:640px;height:480px';document.body.append(host);
    const canvas=document.createElement('canvas');host.append(canvas);
    const pointerRef={current:null};
    const instance=createBallpit(canvas,{count:4,followCursor:false,gravity:0,friction:1,minSize:.1,maxSize:.1,size0:.1,maxVelocity:.15,controllerForce:.35,colors:[0x663399,0xaaaaee]}, {current:{pointerRef}});
    const step=instance.three.onBeforeRender;
    instance.three.onBeforeRender=()=>{}; // Freeze automatic integration; exercise the real source synchronously.
    const physics=instance.spheres.physics;
    const setPointer=(x,sequence,reset=false,age=0)=>{pointerRef.current={active:true,x,y:.5,sequence,timestamp:performance.now()-age,source:'mouse',aspect:4/3,reset};};
    const tick=()=>step({delta:1/60,elapsed:0});
    try{
      setPointer(.5,1,false,50);tick();
      physics.positionData.set([0,0,0,.1,.1,0,5,4,0,-5,4,0]);physics.velocityData.fill(0);
      setPointer(.502,2);tick();
      const gentleControl=instance.spheres.config.controlSphere0;
      const gentleSpeed=Math.hypot(...physics.velocityData.slice(3,6));
      pointerRef.current=null;tick();
      setPointer(.5,3,true,50);tick();
      const baselineNoForce=!instance.spheres.config.controlSphere0;
      const targetX=.08*instance.three.size.wWidth;
      physics.positionData.set([0,0,0,targetX,.5,0,5,4,0,-5,4,0]);physics.velocityData.fill(0);
      setPointer(.58,4);tick();
      const nearSpeed=Math.hypot(...physics.velocityData.slice(3,6));
      const farSpeed=Math.hypot(...physics.velocityData.slice(6,9));
      const velocities=[...physics.velocityData];tick();
      const repeatedVelocityUnchanged=velocities.every((value,index)=>Math.abs(value-physics.velocityData[index])<1e-6);
      // A collision impulse cannot bypass the final maxVelocity ceiling.
      physics.positionData.set([0,0,0,1,1,0,1.05,1,0,-5,4,0]);physics.velocityData.fill(0);pointerRef.current=null;tick();
      const maxSpeed=Math.max(...[1,2,3].map(index=>Math.hypot(...physics.velocityData.slice(index*3,index*3+3))));
      physics.positionData.set([0,0,0,2,2,0,-5,4,0,5,4,0]);physics.velocityData.fill(0);physics.velocityData[3]=.06;
      const before=physics.positionData[3];
      for(let i=0;i<4;i++)step({delta:1/240,elapsed:0});
      const highRefreshDisplacement=physics.positionData[3]-before;
      return{gentleControl,gentleSpeed,baselineNoForce,nearSpeed,farSpeed,repeatedVelocityUnchanged,maxSpeed,highRefreshDisplacement};
    }finally{instance.dispose();host.remove();}
  });
  expect(result.gentleControl).toBe(true);expect(result.baselineNoForce).toBe(true);
  expect(result.nearSpeed).toBeGreaterThan(0);expect(result.farSpeed).toBe(0);
  expect(result.nearSpeed).toBeGreaterThan(result.gentleSpeed);
  expect(result.repeatedVelocityUnchanged).toBe(true);expect(result.maxSpeed).toBeLessThanOrEqual(.150001);
  expect(result.highRefreshDisplacement).toBeCloseTo(.06,5);
});
