import {test,expect} from '@playwright/test';import fs from 'node:fs';
test('measure arcade high-load effects and moving target evaluation',async({page})=>{
 await page.goto('/');const result=await page.evaluate(async()=>{
  const {createSlashScene}=await import('/src/effects/slashScene.js'),{createKineticTargets}=await import('/src/game/kineticTargets.js'),{shapePath,createTraceEvaluator}=await import('/src/game/lightTrace.js');
  const summary=a=>{a.sort((a,b)=>a-b);return {medianMs:a[Math.floor(a.length/2)],p95Ms:a[Math.floor(a.length*.95)]};};
  const canvas=document.createElement('canvas');canvas.width=1366;canvas.height=768;const scene=createSlashScene(canvas.getContext('2d'),{arcade:true,random:()=>.1});scene.setSize(1366,768,{x:0,y:0,width:1366,height:768});scene.setCombo(10);scene.setOverload(true);const drawing=[];let maxObjects=0,maxParticles=0;
  const slash={start:{x:0,y:0},end:{x:1366,y:768},previousEdge:[{x:0,y:0},{x:0,y:768}],edge:[{x:1366,y:0},{x:1366,y:768}],strength:1,source:'camera-motion'};
  for(let i=0;i<1200;i++){const start=performance.now();scene.update(1/60,{phase:'playing',paused:false,elapsed:100+i/60,interval:.28,cap:8});if(i===499){const parent=scene.inspect().objects.find(o=>o.type==='splitting');if(parent)scene.cut({...slash,start:{x:parent.x-70,y:parent.y},end:{x:parent.x+70,y:parent.y},previousEdge:[{x:parent.x-70,y:parent.y-5},{x:parent.x-70,y:parent.y+5}],edge:[{x:parent.x+70,y:parent.y-5},{x:parent.x+70,y:parent.y+5}]});}if(i>500&&i%180===0)scene.cut(slash);scene.draw();drawing.push(performance.now()-start);const state=scene.inspect();maxObjects=Math.max(maxObjects,state.objects.length);maxParticles=Math.max(maxParticles,state.effects.particles);}
  scene.dispose();
  const p={config:{maxX:14,maxY:8,activeCount:151},positionData:new Float32Array(453),sizeData:new Float32Array(151).fill(.4)};for(let i=1;i<151;i++)p.positionData.set([11,-6,0],i*3);const targets=createKineticTargets({arcade:true,random:()=>.5});for(let i=0;i<3;i++)targets.spawn(p,.5,undefined,50,0);const previous=p.positionData.slice(),targetTimes=[],traceTimes=[];const path=shapePath(7,{x:.16,y:.3,width:.68,height:.38},1366,768);let physicsStep=0;let evaluator=createTraceEvaluator(path,1366,768),sequence=0;
  for(let batch=0;batch<100;batch++){
   let start=performance.now();for(let i=0;i<100;i++){targets.advance(p,50,++physicsStep/60,1/60);targets.check(p,previous);}targetTimes.push((performance.now()-start)/100);
   start=performance.now();for(let i=0;i<100;i++){const index=sequence%101;if(index===0)evaluator=createTraceEvaluator(path,1366,768);evaluator.sample({...path[index],active:true,source:'hand',sequence,timestamp:sequence++*33});}traceTimes.push((performance.now()-start)/100);
  }
  return {slashOverload:summary(drawing),maxObjects,maxParticles,moving150:summary(targetTimes),figureEight:summary(traceTimes)};
 });fs.writeFileSync('.test-artifacts/arcade-performance.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));expect(result.maxObjects).toBeLessThanOrEqual(8);expect(result.maxParticles).toBeLessThanOrEqual(192);expect(result.moving150.p95Ms).toBeLessThan(2);expect(result.figureEight.p95Ms).toBeLessThan(2);
});
