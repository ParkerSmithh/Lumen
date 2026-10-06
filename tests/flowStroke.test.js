import test from 'node:test';import assert from 'node:assert/strict';
import {interpolateStroke} from '../src/tracking/flowStroke.js';
test('stroke spans the full segment with a bounded total ink and force budget',()=>{
 const points=interpolateStroke({startX:.1,startY:.2,x:.3,y:.3,deltaX:.08,deltaY:.04,force:1.4,baseline:false},.01);
 assert.ok(points.length>1&&points.length<=24);assert.equal(points.at(-1).x,.3);assert.equal(points.at(-1).y,.3);
 assert.ok(Math.abs(points.reduce((sum,p)=>sum+p.dx,0)-.08*1.4)<1e-10);assert.ok(Math.abs(points.reduce((sum,p)=>sum+p.ink,0)-1)<1e-10);
 assert.equal(interpolateStroke({baseline:true},.01).length,0);
});
