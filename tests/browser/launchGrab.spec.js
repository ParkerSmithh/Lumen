import {test,expect} from '@playwright/test';
test('Ballpit carries a nearby handful with stable offsets and bounded throw, preserving colors',async({page})=>{
 await page.goto('/');const r=await page.evaluate(async()=>{
 const {createBallpit}=await import('/src/effects/Ballpit.jsx');const {Color,Matrix4,Vector3}=await import('/node_modules/three/build/three.module.js');
 const host=document.createElement('div');host.style.cssText='position:absolute;width:640px;height:480px';document.body.append(host);const canvas=document.createElement('canvas');host.append(canvas);const pointerRef={current:null},pit=createBallpit(canvas,{count:5,maxActive:4,interactiveCreation:true,followCursor:false,gravity:.01,minSize:.25,maxSize:.25,colors:[0xffffff,0xffffff]}, {current:{pointerRef}});const wait=ms=>new Promise(r=>setTimeout(r,ms));let seq=0;
 const feed=(x,y,grab)=>{pointerRef.current={active:true,source:'hand',x,y,timestamp:performance.now(),sequence:++seq,aspect:4/3,grab,suppressForce:!!grab.active};};
 try{pit.spawn({x:.3,y:0,z:0},'#4d9fff');pit.spawn({x:-.3,y:0,z:0},'#ff354e');pit.spawn({x:-4,y:0,z:0},'#ffd84a');pit.spheres.physics.positionData.set([.3,0,0,-.3,0,0,-4,0,0],3);pit.spheres.physics.velocityData.fill(0);
 feed(.5,.5,{active:true,begin:true});await wait(40);const captured=pit.grabbedCount,m=new Matrix4(),scale=new Vector3();pit.spheres.getMatrixAt(1,m);scale.setFromMatrixScale(m);const heldScale=scale.x;
 for(let n=1;n<=4;n++){feed(.5+n*.025,.5-n*.012,{active:true,begin:false});await wait(40);}const pos=[...pit.spheres.physics.positionData],offset=pos[3]-pos[6],moved=pos[3]>.6;
 feed(.62,.44,{active:false,released:true});await wait(20);const released=pit.grabbedCount,speed=Math.hypot(...pit.spheres.physics.velocityData.slice(3,6));const c=new Color();pit.spheres.getColorAt(1,c);const color=c.getHexString();
 feed(.62,.44,{active:true,begin:true});await wait(30);const recaptured=pit.grabbedCount;pointerRef.current=null;await wait(40);const lost=pit.grabbedCount;
 return {captured,offset,moved,released,speed,color,heldScale,recaptured,lost,finite:[...pit.spheres.physics.positionData].every(Number.isFinite)};
 }finally{pit.dispose();host.remove();}
 });expect(r.captured).toBe(2);expect(r.offset).toBeCloseTo(.6,3);expect(r.moved).toBe(true);expect(r.released).toBe(0);expect(r.speed).toBeGreaterThan(0);expect(r.speed).toBeLessThanOrEqual(.150001);expect(r.color).toBe('4d9fff');expect(r.heldScale).toBeGreaterThan(.25);expect(r.recaptured).toBe(2);expect(r.lost).toBe(0);expect(r.finite).toBe(true);
});

