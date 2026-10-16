import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVisualMask,writeVisualRim} from '../src/effects/glowMask.js';
import {resolveGlowProfile} from '../src/effects/glowProfiles.js';
import {createSilhouetteGrid} from '../src/tracking/silhouetteGrid.js';
test('visual mask is bounded, sanitized and never mutates gameplay values',()=>{
 const v=createVisualMask(),values=new Float32Array([0,.5,1,NaN]);const original=values.slice();
 const mask={width:2,height:2,values,timestamp:0};const out=v.update(mask,0);
 assert.deepEqual(values,original);assert.equal(out.data[3],0);assert.equal(out.data[11],255);assert.equal(out.data[15],0);
 assert.equal(v.update(mask,10),out);assert.equal(v.update({width:0,height:2,values},20),null);
 const huge=v.update({width:1024,height:512,values:new Float32Array(1024*512).fill(1)},30);assert.equal(huge.width,512);assert.equal(huge.height,256);
 v.dispose();assert.equal(v.stats().bytes,0);
});
test('visual history rejects sudden movement and resets geometry and loss',()=>{
 const v=createVisualMask();v.update({width:1,height:1,values:new Float32Array([1]),timestamp:1},0);
 assert.equal(v.update({width:1,height:1,values:new Float32Array([0]),timestamp:2},66).data[3],0);
 v.reset();assert.equal(v.update({width:1,height:1,values:new Float32Array([.5])},100).data[3],128);
});
test('presets and quality keep rim while reducing bloom cost',()=>{
 const soft=resolveGlowProfile('SOFT'),neon=resolveGlowProfile(),nova=resolveGlowProfile('SUPERNOVA'),low=resolveGlowProfile('NEON','low');
 assert.ok(soft.rim<neon.rim&&neon.rim<nova.rim);assert.equal(neon.rim,low.rim);assert.ok(low.bloomSize<neon.bloomSize);assert.equal(resolveGlowProfile('invalid').name,'NEON');
});
test('visual refinement leaves gameplay anti-jitter grid identical',()=>{
 const a=createSilhouetteGrid(),b=createSilhouetteGrid(),v=createVisualMask();
 for(let time=0;time<500;time+=66){const mask={width:64,height:48,values:Float32Array.from({length:64*48},(_,i)=>i%64<32?(time===132?.59:.8):.1),timestamp:time};a.update(mask,time);v.update(mask,time);b.update(mask,time);assert.deepEqual(a.snapshot,b.snapshot);}
});
test('visual revisions survive reset and same-sized source changes',()=>{
 const v=createVisualMask(),mask={width:1,height:1,values:new Float32Array([1])};const first=v.update(mask,0).revision;v.reset();assert.ok(v.update({...mask,sourceWidth:800},66).revision>first);
});
test('confidence extremes, empty masks and reused buffers remain finite',()=>{
 const v=createVisualMask();assert.equal(v.update(null),null);assert.equal(v.update({width:2,height:2,values:[]}),null);
 const data=new Float32Array([-1,Infinity,.5,2]),m={width:2,height:2,values:data,timestamp:1};const first=v.update(m,0),storage=first.data;
 assert.deepEqual([storage[3],storage[7],storage[11],storage[15]],[0,0,128,255]);m.timestamp=2;data.fill(0);assert.equal(v.update(m,66).data,storage);assert.equal(storage[15],0);
});
test('fractional confidence plateaus have no phantom interior rim',()=>{
 const v=createVisualMask(),mask=v.update({width:5,height:5,values:new Float32Array(25).fill(.5)},0),out=new Uint8ClampedArray(100);writeVisualRim(mask,out,[255,0,0]);assert.equal(out[(2*5+2)*4+3],0);assert.ok(out[3]>0);
 const hard=v.update({width:5,height:5,values:Float32Array.from({length:25},(_,i)=>i%5<2?1:0)},66);writeVisualRim(hard,out,[0,0,255]);assert.equal(out[(2*5+1)*4+3],255);assert.equal(out[(2*5+1)*4+2],255);assert.equal(out[(2*5+4)*4+3],0);
});
