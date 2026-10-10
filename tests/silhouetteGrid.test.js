import test from 'node:test';
import assert from 'node:assert/strict';
import {createSilhouetteGrid, arenaPoint} from '../src/tracking/silhouetteGrid.js';

function mask(t, left=0, right=16) {
  const values=new Float32Array(64*48);
  for(let y=12;y<36;y++)for(let x=left;x<right;x++)values[y*64+x]=1;
  return {width:64,height:48,sourceWidth:640,sourceHeight:480,values,timestamp:t};
}
test('source-left foreground collides on mirrored display-right only',()=>{
  const g=createSilhouetteGrid();for(const t of [0,70,140])assert.equal(g.update(mask(t),t),true);
  assert.equal(g.contact(.88,.5,.03),true);assert.equal(g.contact(.12,.5,.03),false);
  assert.deepEqual(arenaPoint(.25,.5,{x:20,y:10,width:400,height:300}),{x:320,y:160});
});
test('stale, future, malformed and out-of-order masks cannot remain collision input',()=>{
  const g=createSilhouetteGrid();g.update(mask(100),100);
  assert.equal(g.fresh(351),false);
  for(const m of [mask(Infinity),mask(500),{...mask(200),values:new Float32Array(1)},mask(99)]){
    assert.equal(g.update(m,300),false);assert.equal(g.snapshot.valid,false);
  }
});
test('duplicate masks cannot create fresh-entry evidence and stationary occupancy cannot farm',()=>{
  const g=createSilhouetteGrid();for(const t of [0,70,140])g.update(mask(t),t);
  assert.equal(g.contact(.88,.5,.03,true),false);
  assert.equal(g.update(mask(140,16,32),150),false);
  for(const t of [210,280,350])g.update(mask(t,16,32),t);
  assert.equal(g.contact(.62,.5,.03,true),true);
});
test('swept contact tests local body cells without bridging stale gaps',()=>{
  const g=createSilhouetteGrid();for(const t of [0,70,140])g.update(mask(t,28,36),t);
  assert.equal(g.sweep({x:.2,y:.5},{x:.8,y:.5},.02),true);
  g.invalidate();assert.equal(g.sweep({x:.2,y:.5},{x:.8,y:.5},.02),false);
});
test('nonfinite sampled confidence and empty occupancy invalidate the grid',()=>{
  const g=createSilhouetteGrid(),m=mask(0);m.values.fill(NaN);
  assert.equal(g.update(m,0),false);assert.equal(g.update(mask(70,0,0),70),false);
});
