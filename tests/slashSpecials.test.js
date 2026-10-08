import test from 'node:test';
import assert from 'node:assert/strict';
import { createSlashScene, slashObjectTypes } from '../src/effects/slashScene.js';
const state=(elapsed,extra={})=>({phase:'playing',paused:false,elapsed,interval:1,cap:8,...extra});
const slash={start:{x:0,y:280},end:{x:1000,y:280},previousEdge:[{x:0,y:0},{x:0,y:560}],edge:[{x:1000,y:0},{x:1000,y:560}],strength:.6,source:'camera-motion'};
function fixture(random=.1,options={}) {
  const events=[],commands=[];
  const gradient={addColorStop(){}};
  const ctx=new Proxy({}, {get:(_,key)=>key.startsWith('create')?()=>gradient:(...args)=>commands.push([key,...args])});
  const scene=createSlashScene(ctx,{arcade:true,random:()=>random,onLifecycle:event=>events.push(event),...options});
  scene.setSize(1000,560,{x:0,y:0,width:1000,height:560});
  return {scene,events,commands};
}

test('special births honor warmup, unique splitter and reserved eight-object capacity',()=>{
  const {scene}=fixture(); scene.update(.04,state(14));
  assert.equal(scene.inspect().objects[0].type,'normal');
  for(let elapsed=15;elapsed<=25;elapsed++) {
    scene.update(.04,state(elapsed));
    const {objects,reserved}=scene.inspect();
    assert.ok(objects.length+reserved<=8);
    assert.ok(objects.filter(o=>o.type==='splitting').length<=1);
  }
  assert.equal(scene.inspect().reserved,1);
  assert.equal(scene.inspect().objects.length,7);
});

test('parent destruction creates two independent children after swipe, never hits them in same cut',()=>{
  const {scene,events}=fixture();scene.update(.04,state(15));
  assert.equal(scene.cut(slash),1);
  const children=scene.inspect().objects;
  assert.equal(children.length,2);
  assert.ok(children.every(o=>o.type==='child'&&o.radius>=20&&o.points===100));
  assert.equal(new Set(children.map(o=>o.id)).size,2);
  assert.equal(scene.inspect().reserved,0);
  assert.equal(events.length,1);assert.equal(events[0].type,'splitting');
  assert.equal(scene.cut(slash),2); assert.equal(scene.cut(slash),0);
  assert.equal(new Set(events.map(e=>e.id)).size,3);
  assert.ok(events.every(e=>e.kind==='destroyed'&&e.value===1));
});

test('children expire once after six active seconds and stay reachable while paused',()=>{
  const {scene,events}=fixture();scene.update(.04,state(15));scene.cut(slash);
  const ids=scene.inspect().objects.map(o=>o.id);
  scene.update(50,state(15,{paused:true}));
  assert.ok(ids.every(id=>scene.inspect().objects.some(o=>o.id===id)));
  for(let t=15.1;t<21;t+=.1)scene.update(.1,state(t,{interval:100}));
  assert.ok(scene.inspect().objects.filter(o=>ids.includes(o.id)).every(o=>o.x>=o.radius&&o.x<=1000-o.radius&&o.y>=o.radius&&o.y<=560-o.radius));
  scene.update(.04,state(21,{interval:100}));scene.update(.04,state(21.1,{interval:100}));
  assert.ok(!scene.inspect().objects.some(o=>ids.includes(o.id)));
  assert.equal(events.filter(e=>e.kind==='expired'&&ids.includes(e.id)).length,2);
});

test('expiry and reset release splitter reservations, while nonarcade scenes stay normal',()=>{
  const {scene}=fixture();scene.update(.04,state(15));
  for(let i=0;i<360;i++)scene.update(.04,state(15+i*.04,{cap:1,interval:100}));
  assert.equal(scene.inspect().reserved,0);
  scene.reset();assert.equal(scene.inspect().reserved,0);
  assert.deepEqual(scene.inspect().effects,{trails:0,flashes:0,fragments:0,particles:0});
  scene.update(.04,state(15));scene.dispose();assert.equal(scene.inspect().objects.length,0);
  const plain=fixture(0,{arcade:false});plain.scene.update(.04,state(30));
  assert.equal(plain.scene.inspect().objects[0].type,'normal');
});

test('bonus and splitter geometry is distinguishable across colors and keeps point values',()=>{
  for(const color of ['#b06aff','#29cc77','#ff9900']) {
    const draws=[];
    for(const sample of [.5,0,.1]) {
      const {scene,commands}=fixture(sample);scene.setColor(color);scene.update(.04,state(15));scene.draw();
      draws.push(commands.filter(command=>command[0]==='lineTo').length);
    }
    assert.ok(draws[1]>draws[0]);assert.ok(draws[2]>draws[0]);
  }
  assert.equal(slashObjectTypes.normal.points,100);assert.equal(slashObjectTypes.bonus.points,300);
  assert.equal(slashObjectTypes.splitting.points,100);assert.equal(slashObjectTypes.child.points,100);
});

test('a filled reserved population splits without exceeding cap and insufficient space stays normal',()=>{
  const {scene}=fixture();for(let t=15;t<=22;t++)scene.update(.04,state(t));
  const parent=scene.inspect().objects.find(o=>o.type==='splitting');
  assert.equal(scene.inspect().objects.length,7);
  const local={start:{x:parent.x-80,y:parent.y},end:{x:parent.x+80,y:parent.y},previousEdge:[{x:parent.x-80,y:parent.y-5},{x:parent.x-80,y:parent.y+5}],edge:[{x:parent.x+80,y:parent.y-5},{x:parent.x+80,y:parent.y+5}],strength:.6};
  assert.equal(scene.cut(local),1);
  assert.equal(scene.inspect().objects.length,8);
  assert.equal(scene.inspect().objects.filter(o=>o.type==='child').length,2);
  const tiny=fixture();tiny.scene.update(.04,state(15,{cap:1}));
  assert.equal(tiny.scene.inspect().objects[0].type,'normal');
  assert.equal(tiny.scene.inspect().reserved,0);
});

test('reduced motion children do not gain separation movement or extra combo particles',()=>{
  const {scene}=fixture(.1,{reducedMotion:true});scene.setCombo(100);scene.update(.04,state(15));scene.cut(slash);
  const before=scene.inspect().objects.map(({x,y})=>({x,y}));
  scene.update(.04,state(15.04));
  assert.deepEqual(scene.inspect().objects.map(({x,y})=>({x,y})),before);
  assert.ok(scene.inspect().effects.particles<=44);
});

