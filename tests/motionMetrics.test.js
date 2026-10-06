import test from 'node:test';import assert from 'node:assert/strict';import {createTrackingMetrics} from '../src/tracking/metrics.js';
test('motion diagnostics distinguish resets, rejected spikes, filter lag and movement cadence',()=>{
 const m=createTrackingMetrics();for(let n=0;n<6;n++)m.record({timestamp:n*40,received:n*40+15,dispatch:n*40+1,captureMs:1,inferenceMs:12,detected:true,moving:true,resetReason:n===0?'acquired':null,motionRejected:n===3,filterLag:.01,smoothingMs:8,rawSpeed:1});
 const r=m.report();assert.equal(r.motionHz,25);assert.equal(r.resets.acquired,1);assert.equal(r.rejectedSpikes,1);assert.equal(r.filterLag.median,.01);assert.equal(r.estimatedFilterDelayMs.median,10);
});
