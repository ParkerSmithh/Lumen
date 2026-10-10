import test from 'node:test';
import assert from 'node:assert/strict';
import {createGrabDetector} from '../src/tracking/grabDetector.js';
import {createGrabController} from '../src/effects/grabController.js';
import {inputReady} from '../src/game/inputReadiness.js';
const input=(t,closed=true)=>({active:true,timestamp:t,sequence:t,features:{closed,open:!closed,center:{x:.5,y:.5}}});
const holding=()=>{const d=createGrabDetector({lossGraceMs:350});d.update(input(0,false),0);d.update(input(30),30);assert.equal(d.update(input(90),90).begin,true);return d;};
test('LAUNCH retains possession for a bounded 350ms gap without fresh movement or acquisition',()=>{
 const d=holding(),gap=d.update(null,300);
 assert.equal(gap.active,true);assert.equal(gap.fresh,false);assert.equal(gap.canAcquire,false);assert.equal(gap.released,false);
 assert.equal(d.update(null,441).lost,true);assert.equal(d.update(input(480,false),480).released,false);
});
test('LAUNCH reacquisition retains possession but clears pre-loss throw history',()=>{
 const d=holding();d.update(null,250);const recovered=d.update({...input(300),reset:true,resetReason:'acquired'},300);
 assert.equal(recovered.active,true);assert.equal(recovered.rebased,true);assert.equal(recovered.released,false);
 assert.equal(d.update(input(330,false),330).released,false);assert.equal(d.update(input(390,false),390).released,true);
});
test('LAUNCH rejected or stale opening samples cannot synthesize release',()=>{
 const d=holding();assert.equal(d.update({...input(250,false),motionRejected:true},250).released,false);
 assert.equal(d.update(input(90,false),300).released,false);
 assert.equal(d.update(null,500).released,false);
});
test('rebase preserves the selected ball and zeroes pre-interruption momentum',()=>{
 const physics={config:{activeCount:2,maxVelocity:.15},positionData:new Float32Array([0,0,0,.2,0,0]),velocityData:new Float32Array(6),sizeData:new Float32Array([0,.25])};
 const g=createGrabController();g.begin({x:0,y:0,z:0},physics,0);g.move({x:1,y:0,z:0},30);
 g.rebase({x:1,y:0,z:0},300);assert.equal(g.count,1);g.release(physics,true);
 assert.equal(Math.hypot(...physics.velocityData.slice(3)),0);
});
test('normal repeated render observations do not interrupt throw history',()=>{
 const d=holding();const repeat=d.update(input(90),110);assert.equal(repeat.interrupted,false);
 assert.equal(d.update(null,120).interrupted,true);assert.equal(d.update(input(150),150).rebased,true);
});
test('prepared inputs distinguish hand initialization, camera-frame motion and fallback',()=>{
 const camera={cameraReady:true,video:{readyState:2,paused:false,ended:false},trackingStatus:'loading'};
 assert.equal(inputReady(camera),false);assert.equal(inputReady({...camera,frameMotion:true,trackingError:true}),true);
 assert.equal(inputReady({...camera,assisted:true,cameraReady:false}),true);
 assert.equal(inputReady({...camera,assisted:true,renderReady:false}),false);
 assert.equal(inputReady({...camera,trackingStatus:'searching'}),true);
 assert.equal(inputReady({...camera,trackingStatus:'tracking',video:{readyState:1}}),false);
});
