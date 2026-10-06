import test from 'node:test';
import assert from 'node:assert/strict';
import { createSlashDetector, handEdge } from '../src/tracking/slashDetector.js';
import { sweptHit } from '../src/effects/slashGeometry.js';
const sample=(x,time,extra={})=>({active:true,center:{x,y:.5},edge:[{x,y:.46},{x,y:.54}],aspect:1,timestamp:time,sequence:time,...extra});
test('deliberate consistent motion triggers while slow motion and jitter do not',()=>{
  const detector=createSlashDetector();
  assert.equal(detector.update(sample(.2,0),0),null);
  assert.equal(detector.update(sample(.25,50),50),null);
  const slash=detector.update(sample(.31,100),100);
  assert.ok(slash);assert.ok(slash.speed>=.9);assert.ok(slash.distance>=.06);
  assert.equal(detector.update(sample(.31,100),110),null);
  detector.reset();
  for(let t=0;t<=400;t+=50)assert.equal(detector.update(sample(.2+t*.0001, t),t),null);
  detector.reset();
  for(let t=0;t<=400;t+=50)assert.equal(detector.update(sample(.2+(t%100?.002:0),t),t),null);
});
test('loss, reacquisition, stale frames and jumps never bridge a cut',()=>{
  const detector=createSlashDetector();
  detector.update(sample(.2,0),0);detector.update(sample(.26,50),50);
  assert.equal(detector.update(null,60),null);
  assert.equal(detector.update(sample(.5,100),100),null);
  assert.equal(detector.update(sample(.55,150,{reset:true}),150),null);
  assert.equal(detector.update(sample(.6,200),600),null);
  assert.equal(detector.update(sample(.7,650),650),null);
  assert.equal(detector.update(sample(.9,700),700),null);
  assert.equal(detector.update(sample(.95,1000),1000),null);
});
test('impossible speed and direction reversals reject the candidate',()=>{
  const detector=createSlashDetector();detector.update(sample(.1,0),0);
  assert.equal(detector.update(sample(.8,50),50),null);
  assert.equal(detector.update(sample(.74,100),100),null);
  assert.equal(detector.update(sample(.8,150),150),null);
});
test('wrist-to-pinky geometry mirrors raw landmarks once',()=>{
  const landmarks=Array.from({length:21},()=>({x:.7,y:.5}));landmarks[17]={x:.6,y:.4};
  const edge=handEdge({handDetected:true,wrist:{x:.3,y:.6},landmarks,indexFinger:{x:.3,y:.4},timestamp:1,sequence:1,sourceWidth:640,sourceHeight:480});
  assert.deepEqual(edge.edge[0],{x:.3,y:.6});assert.deepEqual(edge.edge[1],{x:.4,y:.4});
  assert.ok(edge.center.x<.5);
});
test('qualified stroke survives one brief speed dip, but slow movement cannot sustain it',()=>{
  const detector=createSlashDetector();
  detector.update(sample(.2,0),0);detector.update(sample(.26,50),50);
  assert.ok(detector.update(sample(.32,100),100));
  assert.ok(detector.update(sample(.362,150),150));
  assert.ok(detector.update(sample(.422,200),200));
  assert.equal(detector.update(sample(.43,250),250),null);
  assert.equal(detector.update(sample(.48,300),300),null);
});
test('a teleporting edge cannot sweep an otherwise steady palm across objects',()=>{
  const detector=createSlashDetector();detector.update(sample(.2,0),0);detector.update(sample(.26,50),50);
  assert.equal(detector.update(sample(.32,100,{edge:[{x:.32,y:.01},{x:.32,y:.99}]}),100),null);
});
test('swept edge catches a crystal between sampled edges; misses are preserved',()=>{
  const slash={start:{x:10,y:50},end:{x:90,y:50},previousEdge:[{x:10,y:10},{x:10,y:90}],edge:[{x:90,y:10},{x:90,y:90}]};
  assert.equal(sweptHit(slash,{x:50,y:25,radius:5}),true);
  assert.equal(sweptHit(slash,{x:120,y:130,radius:5}),false);
  assert.equal(sweptHit(slash,{x:97,y:50,radius:5}),true);
});
