import test from 'node:test';import assert from 'node:assert/strict';import {createPushDetector} from '../src/tracking/pushDetector.js';import {mapLaunchPointer} from '../src/tracking/launchInput.js';
const p=(t,scale,pointing=true)=>({active:true,timestamp:t,sequence:t,source:'hand',features:{scale,depth:-.04,pointing}});
test('long pose uncertainty while held cannot reset creation without retraction',()=>{
 const d=createPushDetector();for(let t=0;t<=150;t+=50)d.update(p(t,.1),t);for(let t=200;t<=400;t+=50)d.update(p(t,.13),t);
 for(let t=450;t<=1000;t+=50)assert.equal(d.update(p(t,.13,false),t).spawn,false);
 for(let t=1050;t<=1400;t+=50){const r=d.update(p(t,.15),t);assert.equal(r.spawn,false);assert.equal(r.state,'WAIT_FOR_RETRACTION');}
});
test('prediction does not invalidate accepted hand samples before the common freshness limit',()=>{
 const h={handDetected:true,indexFinger:{x:.5,y:.5},velocity:{x:1,y:0},sourceWidth:640,sourceHeight:480,timestamp:100,sequence:1};assert.ok(mapLaunchPointer(h,1000,500,300));assert.equal(mapLaunchPointer(h,1000,500,400),null);
});
test('one false closure after uncertainty cannot rearm creation',()=>{
 const d=createPushDetector();for(let t=0;t<=150;t+=50)d.update(p(t,.1),t);for(let t=200;t<=400;t+=50)d.update(p(t,.13),t);
 for(let t=450;t<=1000;t+=50)d.update(p(t,.13,false),t);
 const closed=p(1050,.13,false);closed.features.resetPose=true;d.update(closed,1050);
 for(let t=1100;t<=1450;t+=50){const r=d.update(p(t,.15),t);assert.equal(r.spawn,false);assert.equal(r.state,'WAIT_FOR_RETRACTION');}
});
