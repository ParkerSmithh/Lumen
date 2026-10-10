import test from 'node:test';
import assert from 'node:assert/strict';
import * as selection from '../src/tracking/grabSelection.js';
const ball=(index,x,depth=1,extra={})=>({index,x,y:100,radius:20,depth,visible:true,...extra});
test('screen selection uses closest visible sphere with bounded assistance',()=>{
 assert.equal(selection.selectGrabCandidate([ball(1,100),ball(2,120)],{x:112,y:100}).index,2);
 assert.equal(selection.selectGrabCandidate([ball(1,100,1,{visible:false}),ball(2,105,-1)],{x:100,y:100}),null);
 assert.equal(selection.selectGrabCandidate([ball(1,100)],{x:140,y:100}),null);
 assert.equal(selection.selectGrabCandidate([ball(1,100)],{x:130,y:100}).index,1);
});
test('foreground covering a rear center prevents hidden rear acquisition',()=>{
 assert.equal(selection.selectGrabCandidate([ball(1,100,2),ball(2,103,1)],{x:100,y:100}).index,2);
});
test('candidate hysteresis retains identity until challenger is clearly closer',()=>{
 const balls=[ball(1,100),ball(2,145)];
 assert.equal(selection.selectGrabCandidate(balls,{x:123,y:100},{previousIndex:1}).index,1);
 assert.equal(selection.selectGrabCandidate(balls,{x:130,y:100},{previousIndex:1}).index,2);
 assert.equal(selection.selectGrabCandidate([ball(1,100)],{x:140,y:100},{previousIndex:1}).index,1);
 assert.equal(selection.selectGrabCandidate([ball(1,100)],{x:143,y:100},{previousIndex:1}),null);
});
test('assistance scales projected effective grab radius and respects configured cap',()=>{
 const balls=[ball(1,100,1,{baseRadius:100})];
 assert.equal(selection.selectGrabCandidate(balls,{x:270,y:100},{maxRadius:180})?.index,1);
 assert.equal(selection.selectGrabCandidate(balls,{x:280,y:100},{maxRadius:180}),null);
 assert.equal(selection.selectGrabCandidate(balls,{x:170,y:100}),null);
 assert.equal(selection.selectGrabCandidate(balls,{x:230,y:100},{maxRadius:120}),null);
});
