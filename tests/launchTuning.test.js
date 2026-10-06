import test from 'node:test';import assert from 'node:assert/strict';import {createPushDetector,pushFeatures} from '../src/tracking/pushDetector.js';import {consumeLaunchInput} from '../src/tracking/launchInput.js';
const p=(t,scale=.1,pointing=true)=>({active:true,timestamp:t,sequence:t,source:'hand',features:{scale,depth:-.04,pointing}});
test('a gradual forward push survives a brief uncertain pointing sample without depending on Z',()=>{
 const d=createPushDetector();for(let t=0;t<=150;t+=50)d.update(p(t),t);let spawned=0;
 for(let n=1;n<=10;n++){const t=150+n*50;spawned+=d.update(p(t,.1+n*.002,n!==3),t).spawn?1:0;}assert.equal(spawned,1);
 for(let t=700;t<=1100;t+=50)assert.equal(d.update(p(t,.12),t).spawn,false);
});
test('holding after creation allows lateral force while still preventing more creations',()=>{
 const d=createPushDetector();for(let t=0;t<=150;t+=50)d.update(p(t),t);
 for(let t=200;t<=350;t+=50)d.update(p(t,.13),t);
 const held=d.update(p(800,.13),800); // A long tracking gap resets: establish normal continuous holding below.
 const d2=createPushDetector();for(let t=0;t<=150;t+=50)d2.update(p(t),t);
 let result;for(let t=200;t<=900;t+=50)result=d2.update(p(t,.13),t);
 assert.equal(result.state,'WAIT_FOR_RETRACTION');assert.equal(result.spawn,false);assert.equal(result.suppressForce,false);
});
test('fast lateral motion is accepted with bounded force; short gaps retain gentle control',()=>{
 const state={};const sample=(x,t)=>({active:true,x,y:.5,timestamp:t,sequence:t,source:'hand',aspect:4/3});consumeLaunchInput(state,sample(.2,0),0);
 const fast=consumeLaunchInput(state,sample(.55,66),66);assert.equal(fast.baseline,false);assert.ok(fast.strength>0&&fast.strength<=1);
 const slow=consumeLaunchInput(state,sample(.57,246),246);assert.equal(slow.baseline,false);assert.ok(slow.nudge>0);
});
