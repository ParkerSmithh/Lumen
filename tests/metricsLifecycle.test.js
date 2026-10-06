import test from 'node:test';import assert from 'node:assert/strict';import {createTrackingMetrics} from '../src/tracking/metrics.js';
test('initial detection is acquisition and later loss/re-entry is reacquisition',()=>{
 const m=createTrackingMetrics();const s={timestamp:0,received:10,captureMs:1,inferenceMs:5,dispatch:1,sourceWidth:640,sourceHeight:480};m.record({...s,detected:true});assert.equal(m.report().reacquisitions,0);m.record({...s,detected:false});m.record({...s,detected:true});assert.equal(m.report().losses,1);assert.equal(m.report().reacquisitions,1);assert.equal(m.report().sourceWidth,640);
});
