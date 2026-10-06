import test from 'node:test';import assert from 'node:assert/strict';import {createPushDetector} from '../src/tracking/pushDetector.js';
const input=(time,scale=.1,depth=-.04,extra={})=>({active:true,timestamp:time,sequence:time,source:'hand',features:{pointing:true,scale,depth},...extra});
test('push creates one ball, holding never rearms, retraction permits another',()=>{
 const d=createPushDetector();for(let t=0;t<=150;t+=50)assert.equal(d.update(input(t),t).spawn,false);
 assert.equal(d.update(input(200,.125,-.08),200).spawn,true);
 for(let t=250;t<=1200;t+=50)assert.equal(d.update(input(t,.125,-.08),t).spawn,false);
 for(let t=1250;t<=1450;t+=50)assert.equal(d.update(input(t),t).spawn,false);
 assert.equal(d.update(input(1500,.126,-.08),1500).spawn,true);
});
test('loss, resets, duplicates, stale and lateral pointing do not create matter',()=>{
 const d=createPushDetector();for(let t=0;t<=250;t+=50)assert.equal(d.update(input(t),t).spawn,false);
 assert.equal(d.update(input(250,.14,-.09),260).spawn,false);
 assert.equal(d.update(null,300).spawn,false);assert.equal(d.update(input(350,.14,-.09),350).spawn,false);
 assert.equal(d.update(input(400,.2,-.1,{reset:true}),400).spawn,false);
 assert.equal(d.update(input(450,.25,-.12),1000).spawn,false);
});
