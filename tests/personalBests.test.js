import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersonalBests} from '../src/game/personalBests.js';

test('only completed rounds persist independent maxima; ties and empty results do not claim new best',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const best=createPersonalBests(()=>storage);
 assert.equal(best.record('FLOW',{score:200,count:1,accuracy:96},false).newBest,false);
 assert.equal(data.size,0);
 assert.equal(best.record('FLOW',{score:0,count:0,accuracy:100},true).newBest,false);
 const first=best.record('FLOW',{score:200,count:1,accuracy:96},true);assert.equal(first.newBest,true);
 assert.equal(best.record('FLOW',{score:200,count:1,accuracy:96},true).newBest,false);
 best.record('FLOW',{score:150,count:2,accuracy:90},true);
 assert.deepEqual(createPersonalBests(()=>storage).read('FLOW'),{score:200,count:2,accuracy:96});
 assert.deepEqual(best.read('LAUNCH'),{score:0,count:0,accuracy:null});
});
test('corruption, invalid metrics and unavailable storage cannot break gameplay',()=>{
 const broken=createPersonalBests(()=>{throw new Error('blocked');});
 assert.equal(broken.record('LAUNCH',{score:100,count:1},true).newBest,true);
 assert.equal(broken.read('LAUNCH').score,100);
 const bad=createPersonalBests(()=>({getItem:()=>'{bad',setItem(){throw new Error('quota');}}));
 assert.equal(bad.read('FLOW').accuracy,null);
 assert.equal(bad.record('SLASH',{score:NaN,count:-1},true).newBest,false);
 assert.equal(bad.record('FLOW',{score:100,count:1,accuracy:102},true).bests.accuracy,null);
});
