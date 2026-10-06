import test from 'node:test';import assert from 'node:assert/strict';import {updateHand,consumePointer} from '../src/tracking/handPointer.js';
const hand=x=>Array.from({length:21},()=>({x,y:.5,z:0}));
test('coordinated fast hand movement is not discarded as a fingertip teleport',()=>{
 const a=updateHand(null,hand(.8),100,1),b=updateHand(a,hand(.5),166,2);assert.equal(b.reset,false);assert.ok(b.indexFinger.x>.48);assert.ok(b.velocity.x>3);
});
test('slow movement has no hard fingertip dead zone',()=>{
 const a=updateHand(null,hand(.5),100,1),b=updateHand(a,hand(.499),150,2);assert.ok(b.indexFinger.x>a.indexFinger.x);
});
test('isolated fingertip spike is rejected without connecting a stroke',()=>{
 const a=updateHand(null,hand(.8),100,1),spike=hand(.8);spike[8].x=.35;const b=updateHand(a,spike,133,2);assert.equal(b.motionRejected,true);assert.equal(b.indexFinger.x,a.indexFinger.x);assert.equal(b.velocity.x,0);
 const c=updateHand(b,hand(.79),166,3);assert.equal(c.reset,false);assert.ok(c.indexFinger.x<.24);
});
test('FLOW keeps long accepted movement geometry while bounding its force',()=>{
 const state={};consumePointer(state,{active:true,x:.2,y:.5,timestamp:100,sequence:1,source:'hand'},100);
 const m=consumePointer(state,{active:true,x:.5,y:.5,timestamp:166,sequence:2,source:'hand',velocityX:5},166);assert.equal(m.baseline,false);assert.equal(m.startX,.2);assert.equal(m.x,.5);assert.ok(Math.hypot(m.deltaX,m.deltaY)<=.080001);
});
