import fs from 'node:fs';import {createPushDetector} from '../src/tracking/pushDetector.js';
import test from 'node:test';import assert from 'node:assert/strict';import {createGrabDetector,grabFeatures,launchGrabFeatures,launchPointFeatures} from '../src/tracking/grabDetector.js';import {createGrabController} from '../src/effects/grabController.js';
const input=(t,closed=false)=>({active:true,source:'hand',sequence:t,timestamp:t,features:{closed,open:!closed,center:{x:.5,y:.5}}});
test('grab uses open-to-closed hysteresis, never pointing, and loses safely',()=>{const d=createGrabDetector();assert.equal(d.update(input(0),0).active,false);assert.equal(d.update(input(33,true),33).active,false);assert.equal(d.update(input(99,true),99).begin,true);assert.equal(d.update(input(120,true),120).active,true);d.update(input(132),132);assert.equal(d.update(input(198),198).released,true);d.update(input(231,true),231);d.update(input(297,true),297);assert.equal(d.update(null,430).lost,true);assert.equal(d.update(input(460,true),460).active,false);});
const physics=()=>({positionData:new Float32Array([0,0,0,.3,.1,0,-.3,.1,.1,4,0,0]),velocityData:new Float32Array(12),sizeData:new Float32Array([0,.25,.25,.25]),config:{activeCount:4,maxX:5,maxY:5,maxZ:3,maxVelocity:.15}});
test('grab captures one nearby sphere, follows and releases bounded momentum',()=>{const p=physics(),g=createGrabController();assert.equal(g.begin({x:0,y:0,z:0},p),1);const neighbor=p.positionData[6];g.move({x:1,y:1,z:0},33);for(let n=0;n<10;n++)g.step(p,1/60);assert.ok(p.positionData[3]>.9);assert.equal(p.positionData[6],neighbor);assert.equal(p.positionData[9],4);g.release(p,true);assert.equal(g.count,0);assert.ok(Math.hypot(...p.velocityData.slice(3,6))<=.150001);assert.ok(Math.hypot(...p.velocityData.slice(3,6))>0);});
test('empty and remote grabs capture nothing; one sphere is eligible; loss drops without throwing',()=>{const p=physics(),g=createGrabController();assert.equal(g.begin({x:10,y:10,z:0},p),0);assert.equal(g.begin({x:4,y:0,z:0},p),1);g.move({x:3,y:0,z:0},33);g.step(p,1/60);g.release(p,false);assert.equal(g.count,0);assert.equal(Math.hypot(...p.velocityData.slice(9,12)),0);});
test('grab has one held sphere and positions stay inside physics boundaries',()=>{const p=physics(),g=createGrabController({maxGrabbed:1});assert.equal(g.begin({x:0,y:0,z:0},p),1);g.move({x:100,y:100,z:100},33);for(let n=0;n<60;n++)g.step(p,1/60);for(const i of g.indices)assert.ok(Math.abs(p.positionData[i*3])+p.sizeData[i]<=5.00001);});

test('recorded grab motion never creates matter and rapid-fire reference remains intact',()=>{for(const [name,expected]of [['grab-reference',0],['launch-intent-reference',17]]){const data=JSON.parse(fs.readFileSync(new URL('./fixtures/'+name+'.json',import.meta.url))),g=createGrabDetector(),p=createPushDetector();let fires=0,grabs=0;for(const sample of data){const time=sample.time*1000,held=g.update({...sample,features:sample.grab},time);if(held.begin)grabs++;if(held.blocksCreation)p.reset();else if(p.update({...sample,features:sample.point},time).spawn)fires++;}assert.equal(fires,expected);if(name==='grab-reference')assert.equal(grabs,3);else assert.equal(grabs,0);}});
test('rejected frames cannot confirm poses or move holding and stale control drops',()=>{
 const d=createGrabDetector();d.update(input(0),0);d.update(input(30,true),30);
 assert.equal(d.update({...input(90,true),motionRejected:true},90).active,false);
 assert.equal(d.update(input(120,true),120).active,false);
 assert.equal(d.update(input(180,true),180).begin,true);
 d.update(input(210),210);
 const rejected=d.update({...input(270),motionRejected:true,features:{closed:false,open:true,center:{x:.8,y:.8}}},270);
 assert.equal(rejected.active,true);assert.equal(rejected.fresh,false);assert.deepEqual(rejected.center,{x:.5,y:.5});
 assert.equal(d.update(input(300),300).released,false);assert.equal(d.update(input(360),360).released,true);
 d.update(input(390,true),390);d.update(input(450,true),450);
 assert.equal(d.update({...input(800,true),motionRejected:true},800).lost,true);
});
test('recorded landmark examples distinguish open presence, closed grab and pointing',()=>{const poses=JSON.parse(fs.readFileSync(new URL('./fixtures/gesture-landmarks.json',import.meta.url)));assert.equal(grabFeatures({rawLandmarks:poses.open}).open,true);assert.equal(launchPointFeatures({rawLandmarks:poses.open}).pointing,false);assert.equal(grabFeatures({rawLandmarks:poses.closed}).closed,true);assert.equal(launchPointFeatures({rawLandmarks:poses.closed}).pointing,false);assert.equal(grabFeatures({rawLandmarks:poses.point}).closed,false);assert.equal(launchPointFeatures({rawLandmarks:poses.point}).pointing,true);});
test('slow release is gentle while fast release remains bounded',()=>{const p=physics(),g=createGrabController();g.begin({x:0,y:0,z:0},p,0);g.move({x:.01,y:0,z:0},33);g.release(p,true);assert.ok(Math.hypot(...p.velocityData.slice(3,6))<.01);g.begin({x:0,y:0,z:0},p,100);g.move({x:3,y:2,z:0},133);g.release(p,true);assert.ok(Math.hypot(...p.velocityData.slice(3,6))>.1);assert.ok(Math.hypot(...p.velocityData.slice(3,6))<=.150001);});

test('recent history rejects an isolated spike and throws only the selected sphere',()=>{
 const run=noisy=>{const p=physics(),g=createGrabController();g.begin({x:0,y:0,z:0},p,0);
 for(let i=1;i<=5;i++)g.move({x:i*.06+(noisy&&i===4?80:0),y:0,z:0},i*25);
 g.release(p,true);return p;};
 const clean=run(false),noisy=run(true);
 assert.ok(Math.abs(clean.velocityData[3]-noisy.velocityData[3])<1e-6);
 assert.ok(noisy.velocityData[3]>.03);
 assert.equal(noisy.velocityData[6],0);
 assert.ok(clean.velocityData[3]>.03);
 for(const i of [1,2])assert.ok(Math.hypot(...noisy.velocityData.slice(i*3,i*3+3))<=.150001);
});
test('stationary hand loses old momentum and stale movement cannot determine a throw',()=>{
 const p=physics(),g=createGrabController();g.begin({x:0,y:0,z:0},p,0);
 g.move({x:1,y:0,z:0},25);
 for(let i=2;i<=8;i++)g.move({x:1,y:0,z:0},i*25);
 g.release(p,true);assert.equal(Math.hypot(...p.velocityData.slice(3,6)),0);
 g.begin({x:0,y:0,z:0},p,300);g.move({x:50,y:0,z:0},600);g.release(p,true);
 assert.equal(Math.hypot(...p.velocityData.slice(3,6)),0);
});

test('recorded pointing pose stays creation intent rather than relaxed fist',()=>{
 const poses=JSON.parse(fs.readFileSync(new URL('./fixtures/gesture-landmarks.json',import.meta.url)));
 const hand={rawLandmarks:poses.point};
 assert.equal(launchPointFeatures(hand).pointing,true);
 assert.equal(launchGrabFeatures(hand).closed,false);
 const push=createPushDetector(),grab=createGrabDetector();let spawns=0;
 const samples=JSON.parse(fs.readFileSync(new URL('./fixtures/launch-intent-reference.json',import.meta.url)));
 for(const sample of samples){const time=sample.time*1000;const held=grab.update({...sample,features:launchGrabFeatures(hand)},time);if(held.blocksCreation)push.reset();else if(push.update({...sample,features:sample.point},time).spawn)spawns++;}
 assert.equal(spawns,17);
});
