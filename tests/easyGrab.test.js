import test from 'node:test';
import assert from 'node:assert/strict';
import * as detector from '../src/tracking/grabDetector.js';
import {createGrabController} from '../src/effects/grabController.js';
const input=(t,closed=false)=>({active:true,sequence:t,timestamp:t,features:{closed,open:!closed,center:{x:.5,y:.5}}});
test('closure requires fresh poses spanning sixty milliseconds and intent expires',()=>{
 const d=detector.createGrabDetector();d.update(input(0),0);d.update(input(30,true),30);
 assert.equal(d.update(input(60,true),60).active,false);
 const held=d.update(input(90,true),90);assert.equal(held.begin,true);assert.equal(held.canAcquire,true);
 d.update(input(190,true),190);assert.equal(d.update(input(230,true),230).canAcquire,true);
 assert.equal(d.update(input(250,true),250).canAcquire,false);
 d.update(input(280),280);assert.equal(d.update(input(310),310).released,false);
 assert.equal(d.update(input(340),340).released,true);
});
test('brief tracking gaps freeze holding and never confirm release',()=>{
 const d=detector.createGrabDetector();d.update(input(0),0);d.update(input(30,true),30);d.update(input(90,true),90);
 const gap=d.update(null,150);assert.equal(gap.active,true);assert.equal(gap.fresh,false);assert.deepEqual(gap.center,{x:.5,y:.5});
 assert.equal(d.update(null,211).lost,true);
});
test('explicit screen-selected sphere bypasses unrelated world-radius candidates',()=>{
 const p={positionData:new Float32Array([0,0,0,0,0,0,4,0,0]),velocityData:new Float32Array(9),sizeData:new Float32Array([0,.25,.25]),config:{activeCount:3,maxX:5,maxY:5,maxZ:5,maxVelocity:.15}};
 const g=createGrabController();assert.equal(g.begin({x:0,y:0,z:0},p,0,{index:2}),1);assert.deepEqual(g.indices,[2]);
 g.release(p);assert.equal(g.begin({x:0,y:0,z:0},p),1);assert.deepEqual(g.indices,[1]);
 assert.equal(g.begin({x:0,y:0,z:0},p,0,{index:9}),0);
});
test('duplicate render observations preserve pending fresh confirmation',()=>{
 const d=detector.createGrabDetector();d.update(input(0),0);d.update(input(30,true),30);d.update(input(30,true),45);
 assert.equal(d.update(input(90,true),90).begin,true);
});
test('launch curl classification accepts three curled fingers without forcing index curl',()=>{
 const p=Array.from({length:21},()=>({x:0,y:0,z:0}));
 for(const i of [6,10,14,18])p[i]={x:1,y:0,z:0};
 p[8]={x:1.3,y:0,z:0};for(const i of [12,16,20])p[i]={x:1,y:0,z:0};
 assert.equal(detector.launchGrabFeatures({rawLandmarks:p}).closed,true);
 assert.equal(detector.grabFeatures({rawLandmarks:p}).closed,false);
});
test('a fresh pose after an unobserved long gap cannot throw stale holding',()=>{
 const d=detector.createGrabDetector();d.update(input(0),0);d.update(input(30,true),30);d.update(input(90,true),90);
 const recovered=d.update(input(220),220);assert.equal(recovered.active,false);assert.equal(recovered.lost,true);assert.equal(recovered.released,false);
});

test('explicit attach follows hand center smoothly without teleporting acquisition',()=>{
 const p={positionData:new Float32Array([0,0,0,4,0,0]),velocityData:new Float32Array(6),sizeData:new Float32Array([0,.25]),config:{activeCount:2,maxX:5,maxY:5,maxZ:5,maxVelocity:.15}};
 const g=createGrabController();assert.equal(g.begin({x:0,y:0,z:0},p,0,{index:1,attach:true}),1);
 assert.equal(p.positionData[3],4);g.step(p,1/60);assert.ok(p.positionData[3]>0&&p.positionData[3]<4);
 for(let i=0;i<30;i++)g.step(p,1/60);assert.ok(p.positionData[3]<.001);
 assert.ok([...p.positionData,...p.velocityData].every(Number.isFinite));assert.ok(Math.hypot(...p.velocityData.slice(3,6))<=.150001);
});
