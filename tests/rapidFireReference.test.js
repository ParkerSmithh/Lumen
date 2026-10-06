import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createPushDetector} from '../src/tracking/pushDetector.js';
const sample=(time,scale=.1,depth=-.04)=>({active:true,source:'hand',timestamp:time,sequence:time,features:{pointing:true,scale,depth}});
test('small back-and-forth release allows repeated firing at reference rhythm',()=>{
 const d=createPushDetector();d.update(sample(0),0);d.update(sample(33),33);const events=[];
 for(let n=0;n<10;n++){const t=100+n*280;for(const [offset,scale,depth] of [[0,.117,-.06],[33,.123,-.07],[66,.124,-.07],[100,.112,-.043],[133,.106,-.04],[166,.106,-.04]]){const now=t+offset;if(d.update(sample(now,scale,depth),now).spawn)events.push(now);}}
 assert.equal(events.length,10);const held=createPushDetector();held.update(sample(0),0);let count=0;for(let t=33;t<1000;t+=33)if(held.update(sample(t,.124,-.07),t).spawn)count++;assert.equal(count,1);
});
test('recorded rapid-fire landmark signal produces approximately one creation per visible impulse',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('./fixtures/rapid-fire-reference.json',import.meta.url)));const d=createPushDetector();const fires=[];
 for(const [sequence,s] of data.entries()){const t=s.time*1000,r=d.update(s.features?{active:true,source:'hand',sequence,timestamp:t,features:s.features}:null,t);if(r.spawn)fires.push(s.time);}
 assert.ok(fires.length>=14&&fires.length<=19,`recorded impulses: ${fires.length}, times ${fires}`);
});
test('a single noisy release sample cannot double-fire a held finger',()=>{
 const d=createPushDetector();d.update(sample(0),0);let count=0;for(const [t,s,z] of [[33,.124,-.07],[66,.124,-.07],[100,.124,-.07],[133,.124,-.07],[166,.106,-.04],[199,.124,-.07],[232,.124,-.07]])if(d.update(sample(t,s,z),t).spawn)count++;assert.equal(count,1);
});

test('rejected tracking spikes cannot fire or rearm a held gesture',()=>{const d=createPushDetector();d.update(sample(0),0);assert.equal(d.update({...sample(33,.15),motionRejected:true},33).spawn,false);assert.equal(d.update(sample(66),66).spawn,false);assert.equal(d.update(sample(100,.124,-.07),100).spawn,true);d.update({...sample(133,.1),motionRejected:true},133);assert.equal(d.update(sample(166,.124,-.07),166).spawn,false);});
