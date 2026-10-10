import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnergyCalibration} from '../src/game/energyCalibration.js';
const sample=(t,x=.5,width=.25,occupancy=.2)=>({valid:true,timestamp:t,center:{x,y:.5},bounds:{minX:x-width/2,maxX:x+width/2,minY:.2,maxY:.8},occupancy});
function neutral(c){for(let t=0;t<=1200;t+=100)c.sample(sample(t),t);}
test('calibration requires distinct stable frames before exploring',()=>{
 const c=createEnergyCalibration();for(let t=0;t<1500;t+=100)c.sample(sample(0),t);assert.equal(c.snapshot.stage,'neutral');
 c.reset();neutral(c);assert.equal(c.snapshot.stage,'explore');
});
test('small seated range creates relative targets, never an assumed full body envelope',()=>{
 const c=createEnergyCalibration();neutral(c);for(let t=1300;t<=2000;t+=100)c.sample(sample(t,.47),t);for(let t=2100;t<=3000;t+=100)c.sample(sample(t,.53),t);
 const s=c.finish();assert.equal(s.ready,true);assert.ok(s.targets.left<.03);assert.ok(s.envelope.minX>=.3);assert.ok(s.envelope.maxX<=.7);assert.deepEqual(s.capabilities,['left','right']);
});
test('camera approach cannot establish lateral or expansion capabilities',()=>{
 const c=createEnergyCalibration();neutral(c);for(let t=1300;t<4000;t+=100)c.sample(sample(t,.6,.5,.5),t);
 assert.equal(c.finish().ready,false);
});
test('stale inputs do not calibrate or reacquire and baseline exposes only scalars',()=>{
 const c=createEnergyCalibration();for(let t=0;t<2000;t+=100)c.sample(sample(t),t+300);assert.equal(c.snapshot.stage,'neutral');
 neutral(c);assert.equal('cells' in c.snapshot,false);assert.equal('landmarks' in c.snapshot,false);
});
test('reach capability cannot be calibrated by replaying one cached pose',()=>{
 const c=createEnergyCalibration();for(let t=0;t<=1200;t+=100)c.sample(sample(t),t,{valid:true,reach:0,timestamp:t});
 for(let t=1300;t<=1700;t+=100)c.sample(sample(t),t,{valid:true,reach:1,timestamp:1300});assert.equal(c.snapshot.capabilities.includes('reach'),false);
 for(let t=1800;t<=2300;t+=100)c.sample(sample(t),t,{valid:true,reach:1,timestamp:t});assert.equal(c.snapshot.capabilities.includes('reach'),true);
});
