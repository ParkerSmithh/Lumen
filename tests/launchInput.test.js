import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeLaunchInput,localImpulse,mapLaunchPointer } from '../src/tracking/launchInput.js';
const pointer=(x,t,extra={})=>({x,y:.5,active:true,timestamp:t,sequence:t,source:'hand',aspect:4/3,...extra});
test('launch input consumes each result once, nudges slowly, and flicks locally',()=>{
  const state={};assert.equal(consumeLaunchInput(state,pointer(.2,0),0).strength,0);
  const slow=consumeLaunchInput(state,pointer(.21,50),50);assert.equal(slow.strength,0);
  const fast=consumeLaunchInput(state,pointer(.29,100),100);assert.ok(fast.strength>0);
  assert.equal(consumeLaunchInput(state,pointer(.29,100),110),null);
  assert.ok(localImpulse(.2,2,fast.strength)>0);assert.equal(localImpulse(3,2,fast.strength),0);
});
test('launch resets on lost, stale, reacquired, invalid, or impossible input',()=>{
  const state={};consumeLaunchInput(state,pointer(.2,0),0);
  assert.equal(consumeLaunchInput(state,null,10),null);
  assert.equal(consumeLaunchInput(state,pointer(.8,50),50).strength,0);
  assert.equal(consumeLaunchInput(state,pointer(.1,100),100).strength,0);
  assert.equal(consumeLaunchInput(state,pointer(.2,150,{reset:true}),150).strength,0);
  assert.equal(consumeLaunchInput(state,pointer(.3,200),600),null);
  assert.equal(consumeLaunchInput(state,pointer(.4,650),650).strength,0);
  assert.equal(consumeLaunchInput(state,pointer(NaN,700),700),null);
});
test('force remains bounded and a long frame gap creates a new baseline',()=>{
  const state={};consumeLaunchInput(state,pointer(.2,0),0);
  const fast=consumeLaunchInput(state,pointer(.35,50),50);
  assert.ok(fast.strength<=1);assert.ok(localImpulse(0,2,fast.strength)<=.12);
  assert.equal(consumeLaunchInput(state,pointer(.45,500),500).baseline,true);
});
test('camera mapping preserves containment and never mirrors the mirrored fingertip',()=>{
  const p=mapLaunchPointer({handDetected:true,indexFinger:{x:.75,y:.25},sourceWidth:640,sourceHeight:480,velocity:{x:1,y:0},timestamp:10,sequence:1},1000,500);
  assert.ok(p.x>.5);assert.ok(Math.abs(p.y-.25)<1e-6);assert.equal(p.active,true);
});
