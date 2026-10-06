import test from 'node:test';import assert from 'node:assert/strict';import {predictHandPoint} from '../src/tracking/handPointer.js';
test('render prediction is bounded, expires, and stops on reset/spike',()=>{
 const h={handDetected:true,indexFinger:{x:.5,y:.5},velocity:{x:6,y:0},timestamp:100};const p=predictHandPoint(h,140);assert.ok(p.x>.5&&p.x<=.540001);assert.equal(predictHandPoint(h,400),null);assert.deepEqual(predictHandPoint({...h,reset:true},140),h.indexFinger);assert.deepEqual(predictHandPoint({...h,motionRejected:true},140),h.indexFinger);
});
