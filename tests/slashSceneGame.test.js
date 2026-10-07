import test from 'node:test';
import assert from 'node:assert/strict';
import { createSlashScene } from '../src/effects/slashScene.js';
import { createSlashGame } from '../src/game/slashGame.js';

const gradient={addColorStop(){}};
function fixture() {
  const events=[];
  const ctx=new Proxy({}, {get:(_,key)=>key.startsWith('create')?()=>gradient:()=>{}});
  const scene=createSlashScene(ctx,{onLifecycle:event=>events.push(event)});
  scene.setSize(1000,560,{x:0,y:0,width:1000,height:560});
  const game=createSlashGame(); game.start(0);
  return {scene,game,events};
}
const cut={start:{x:0,y:280},end:{x:1000,y:280},previousEdge:[{x:0,y:0},{x:0,y:560}],edge:[{x:1000,y:0},{x:1000,y:560}],strength:.6,source:'camera-motion'};

test('scene waits for play, emits unique object destruction events and multi-hit count',()=>{
  const {scene,game,events}=fixture(); scene.update(.04,game.tick(2000));
  assert.equal(scene.inspect().objects.length,0);
  for(let t=3;t<=9;t+=.1)scene.update(.1,game.tick(t*1000));
  const objects=scene.inspect().objects; assert.equal(objects.length,3);
  assert.equal(new Set(objects.map(o=>o.id)).size,3);
  assert.ok(objects.every(o=>o.type==='normal'&&o.value===1));
  assert.equal(scene.cut(cut),3); assert.equal(scene.cut(cut),0);
  assert.equal(events.filter(e=>e.kind==='destroyed').length,3);
  assert.deepEqual(events.filter(e=>e.kind==='destroyed').map(e=>e.id).sort(),objects.map(o=>o.id).sort());
});

test('end rejects cuts and spawning, fades targets without awarding expiry; replay clears all effects',()=>{
  const {scene,game,events}=fixture(); scene.update(.04,game.tick(4000));
  assert.equal(scene.inspect().objects.length,1);
  scene.update(.04,game.tick(123000)); assert.equal(scene.cut(cut),0);
  for(let i=0;i<20;i++)scene.update(.04,game.tick(124000+i*40));
  assert.equal(scene.inspect().objects.length,0); assert.equal(events.length,0);
  scene.reset(); game.start(125000); scene.update(.04,game.tick(128000));
  assert.equal(scene.inspect().objects.length,0);
  scene.update(.04,game.tick(129000)); assert.equal(scene.cut(cut),1);
  scene.reset(); assert.deepEqual(scene.inspect().effects,{trails:0,flashes:0,fragments:0,particles:0});
});

test('expiry events occur once and full capacity or stalls cannot queue a spawn burst',()=>{
  const {scene,game,events}=fixture();
  for(let t=3;t<=110;t+=.04)scene.update(.04,game.tick(t*1000));
  assert.ok(events.some(e=>e.kind==='expired'));
  assert.equal(new Set(events.map(e=>e.id)).size,events.length);
  assert.equal(scene.inspect().objects.length,8);
  scene.cut(cut); const at=game.tick(110500); scene.update(.04,at);
  assert.ok(scene.inspect().objects.length<=1);
  scene.update(.04,game.tick(110501)); assert.ok(scene.inspect().objects.length<=1);
  scene.reset(); scene.update(.04,game.tick(115000));
  assert.equal(scene.inspect().objects.length,1);
  scene.update(.04,game.tick(115001)); assert.equal(scene.inspect().objects.length,1);
});

test('paused scene preserves objects and effects without accepting hits',()=>{
  const {scene,game}=fixture(); scene.update(.04,game.tick(4000));
  game.pause(4000,'visibility'); const before=scene.inspect();
  scene.update(50,game.tick(54000)); assert.deepEqual(scene.inspect(),before);
  assert.equal(scene.cut(cut),0);
});
