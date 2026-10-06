import test from 'node:test';import assert from 'node:assert/strict';import {handEdge,createSlashDetector} from '../src/tracking/slashDetector.js';
test('a valid shared palm supports slashing when pinky edge is briefly missing',()=>{
 const sample=x=>handEdge({handDetected:true,palm:{x,y:.5},wrist:{x,y:.6},landmarks:[],velocity:{x:1,y:0},palmVelocity:{x:1,y:0},timestamp:x*1000,sequence:x,sourceWidth:640,sourceHeight:480});
 const detector=createSlashDetector();assert.equal(detector.update(sample(.2),200),null);detector.update(sample(.25),250);assert.ok(detector.update(sample(.31),310));
 detector.reset();assert.equal(detector.update(sample(.4),400),null);
});
