import test from 'node:test';import assert from 'node:assert/strict';import {createSlashDetector} from '../src/tracking/slashDetector.js';
const sample=(x,y,t,extra={})=>({active:true,center:{x,y},edge:[{x,y:y-.05},{x,y:y+.05}],aspect:4/3,timestamp:t,sequence:t,source:'hand',...extra});
for(const direction of [[1,0],[0,1],[.7,.7]])test(`rough deliberate swipe survives edge instability ${direction}`,()=>{
 const d=createSlashDetector();d.update(sample(.3,.3,0),0);d.update(sample(.3+direction[0]*.06,.3+direction[1]*.06,80),80);
 const cut=d.update(sample(.3+direction[0]*.13,.3+direction[1]*.13,170,{edge:[{x:0,y:0},{x:1,y:1}]}),170);assert.ok(cut);assert.ok(cut.robust);
});
test('rough tracking gap below expiry still qualifies a deliberate swipe',()=>{
 const d=createSlashDetector();d.update(sample(.2,.5,0),0);d.update(sample(.27,.5,80),80);assert.ok(d.update(sample(.42,.5,240),240));
 d.reset();for(let t=0;t<=400;t+=50)assert.equal(d.update(sample(.3+t*.0001,.5,t),t),null);
});
