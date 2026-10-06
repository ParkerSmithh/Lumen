import test from 'node:test';import assert from 'node:assert/strict';
import {createTrackingMetrics} from '../src/tracking/metrics.js';
test('tracking metrics bound histories and distinguish capture, inference, transport and cadence',()=>{
 const metrics=createTrackingMetrics(3);for(let n=0;n<5;n++)metrics.record({timestamp:n*50,received:n*50+25,captureMs:3,inferenceMs:15,dispatch:n*50+3});
 const report=metrics.report();assert.equal(report.samples,3);assert.equal(report.hz,20);assert.equal(report.ageMs.p95,25);assert.equal(report.inferenceMs.median,15);assert.equal(report.roundTripMs.median,22);
});
