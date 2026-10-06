import test from 'node:test';import assert from 'node:assert/strict';import {createPushDetector} from '../src/tracking/pushDetector.js';
for(const hz of [20,30,60])test(`push acquisition arms at ${hz} Hz`,()=>{
 const d=createPushDetector();let result;for(let n=0;n<20;n++){const t=n*1000/hz;result=d.update({active:true,source:'hand',sequence:n,timestamp:t,features:{pointing:true,scale:.1,depth:-.04}},t);}assert.equal(result.state,'READY');
});
