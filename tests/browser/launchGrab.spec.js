import {enterArtwork} from './enterArtwork.js';
import {test,expect} from '@playwright/test';
test('Ballpit carries exactly one projected candidate with bounded throw, preserving colors',async({page})=>{
 await page.goto('/');await enterArtwork(page);const r=await page.evaluate(async()=>{
 const {createBallpit}=await import('/src/effects/Ballpit.jsx');const {Color,Matrix4,Vector3}=await import('/node_modules/three/build/three.module.js');
 const host=document.createElement('div');host.style.cssText='position:absolute;width:640px;height:480px';document.body.append(host);const canvas=document.createElement('canvas');host.append(canvas);const pointerRef={current:null},pit=createBallpit(canvas,{count:5,maxActive:4,interactiveCreation:true,followCursor:false,gravity:.01,minSize:.25,maxSize:.25,colors:[0xffffff,0xffffff]}, {current:{pointerRef}});const step=pit.three.onBeforeRender;pit.three.onBeforeRender=()=>{};pit.three.camera.updateMatrixWorld();let seq=0,clock=performance.now()-200;const tick=()=>step({delta:1/60,elapsed:0});
 const feed=(x,y,grab)=>{pointerRef.current={active:true,source:'hand',x,y,timestamp:clock+(seq+1)*25,sequence:++seq,aspect:4/3,grab,suppressForce:!!grab.active};};
 try{pit.spawn({x:.3,y:0,z:0},'#4d9fff');pit.spawn({x:-.3,y:0,z:0},'#ff354e');pit.spawn({x:-4,y:0,z:0},'#ffd84a');pit.spheres.physics.positionData.set([.3,0,0,-.3,0,0,-4,0,0],3);pit.spheres.physics.velocityData.fill(0);
 feed(.5,.5,{active:true,begin:true});tick();const captured=pit.grabbedCount,m=new Matrix4(),scale=new Vector3();pit.spheres.getMatrixAt(1,m);scale.setFromMatrixScale(m);const heldScale=scale.x;
 for(let n=1;n<=4;n++){feed(.5+n*.025,.5-n*.012,{active:true,begin:false});tick();}const pos=[...pit.spheres.physics.positionData],offset=pos[3]-pos[6],moved=pos[3]>.6;
 feed(.62,.44,{active:false,released:true});tick();const released=pit.grabbedCount,speed=Math.hypot(...pit.spheres.physics.velocityData.slice(3,6));const c=new Color();pit.spheres.getColorAt(1,c);const color=c.getHexString();
 feed(.62,.44,{active:true,begin:true});tick();const recaptured=pit.grabbedCount;pointerRef.current=null;tick();const lost=pit.grabbedCount;
 return {captured,offset,moved,released,speed,color,heldScale,recaptured,lost,finite:[...pit.spheres.physics.positionData].every(Number.isFinite)};
 }finally{pit.dispose();host.remove();}
 });expect(r.captured).toBe(1);expect(r.offset).toBeGreaterThan(.6);expect(r.moved).toBe(true);expect(r.released).toBe(0);expect(r.speed).toBeGreaterThan(0);expect(r.speed).toBeLessThanOrEqual(.150001);expect(r.color).toBe('4d9fff');expect(r.heldScale).toBeGreaterThan(.25);expect(r.recaptured).toBeLessThanOrEqual(1);expect(r.lost).toBe(0);expect(r.finite).toBe(true);
});

test('projected selection respects depth and brief stale hold cannot throw',async({page})=>{
 await page.goto('/');await enterArtwork(page);const result=await page.evaluate(async()=>{
  const {createBallpit}=await import('/src/effects/Ballpit.jsx');const host=document.createElement('div');host.style.cssText='position:absolute;width:640px;height:480px';document.body.append(host);const canvas=document.createElement('canvas');host.append(canvas);
  const pointerRef={current:null},pit=createBallpit(canvas,{count:4,maxActive:3,maxZ:3,interactiveCreation:true,followCursor:false,gravity:0,minSize:.25,maxSize:.25,colors:[0xffffff,0xffffff]}, {current:{pointerRef}}),step=pit.three.onBeforeRender;pit.three.onBeforeRender=()=>{};
  const physics=pit.spheres.physics;let sequence=0;const time=performance.now()-100;
  const feed=(x,y,grab)=>{pointerRef.current={active:true,source:'hand',x,y,timestamp:time+(++sequence)*20,sequence,aspect:4/3,grab,suppressForce:true};step({delta:1/60,elapsed:0});};
  try{pit.spawn({x:0,y:0,z:2},'#4d9fff');pit.spawn({x:0,y:0,z:-2},'#ff354e');physics.positionData.set([0,0,2,0,0,-2],3);physics.velocityData.fill(0);feed(.5,.5,{active:true,begin:true,fresh:true});const selected=physics.grabController.indices;
   feed(.56,.48,{active:true,fresh:true});const z=physics.positionData[5];pit.spawn({x:4,y:0,z:0},'#ffd84a');const countAfterSpawn=pit.grabbedCount;feed(.95,.1,{active:true,fresh:false});const frozen=physics.grabController.indices;
   pointerRef.current={...pointerRef.current,grab:{active:false,lost:true,fresh:false}};step({delta:1/60,elapsed:0});return {selected,z,frozen,countAfterSpawn,count:pit.grabbedCount,speed:Math.hypot(...physics.velocityData.slice(3,6)),backZ:physics.positionData[8]};
  }finally{pit.dispose();host.remove();}
 });expect(result.selected).toEqual([1]);expect(result.countAfterSpawn).toBe(1);expect(result.frozen).toEqual([1]);expect(result.z).toBeCloseTo(2,3);expect(result.backZ).toBeCloseTo(-2,3);expect(result.count).toBe(0);expect(result.speed).toBe(0);
});

