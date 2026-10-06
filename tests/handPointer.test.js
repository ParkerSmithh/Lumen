import test from 'node:test';
import assert from 'node:assert/strict';
import { updateHand, consumePointer } from '../src/tracking/handPointer.js';
const landmarks = (x,y=.5) => Array.from({length:21}, () => ({x,y,z:0}));
test('hand coordinates mirror exactly once and velocity uses elapsed time', () => {
  const a = updateHand(null, landmarks(.7), 100, 1);
  assert.ok(Math.abs(a.indexFinger.x-.3)<1e-6);
  assert.equal(a.velocity.x,0);
  const b = updateHand(a, landmarks(.6), 150, 2);
  assert.ok(b.indexFinger.x>a.indexFinger.x);
  assert.ok(Math.abs(b.velocity.x-(b.indexFinger.x-a.indexFinger.x)/.05)<1e-6);
});
test('loss, stale input and extreme jumps establish new baselines', () => {
  const a = updateHand(null, landmarks(.2),100,1);
  const lost = updateHand(a,null,150,2);
  assert.equal(lost.handDetected,false);
  const returned = updateHand(lost,landmarks(.8),200,3);
  assert.equal(returned.velocity.x,0); assert.equal(returned.reset,true);
  assert.equal(updateHand(a,landmarks(.9),150,2).reset,true);
  assert.equal(updateHand(a,landmarks(.25),1000,3).velocity.x,0);
});
test('each pointer sequence is consumed once; reacquisition cannot splat', () => {
  const state = {};
  assert.equal(consumePointer(state,{active:true,x:.2,y:.5,sequence:1,timestamp:100,reset:true},100).baseline,true);
  const pointer = {active:true,x:.25,y:.5,velocityX:1,velocityY:0,sequence:2,timestamp:150};
  assert.ok(consumePointer(state,pointer,150).deltaX>0);
  assert.equal(consumePointer(state,pointer,160),null);
  assert.equal(consumePointer(state,pointer,600),null);
  assert.equal(consumePointer(state,{...pointer,sequence:3,timestamp:650},650).baseline,true);
});
test('pointer force and deltas are bounded even for faulty inputs', () => {
  const state={}; consumePointer(state,{active:true,x:.1,y:.1,sequence:1,timestamp:0},0);
  const movement=consumePointer(state,{active:true,x:.25,y:.2,sequence:2,timestamp:50,velocityX:999},50);
  assert.ok(Math.hypot(movement.deltaX,movement.deltaY)<=.080001);
  assert.ok(movement.force<=1.6);
  assert.equal(consumePointer(state,{active:true,x:NaN,y:.2,sequence:3,timestamp:100},100),null);
});
