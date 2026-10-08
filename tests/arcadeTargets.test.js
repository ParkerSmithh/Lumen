import test from 'node:test';import assert from 'node:assert/strict';
import {createKineticTargets} from '../src/game/kineticTargets.js';
const physics=()=>({config:{maxX:6,maxY:5,activeCount:1},positionData:new Float32Array(453),sizeData:new Float32Array(151).fill(.4)});
test('bonus lifetime and replacements preserve one target; moving poses use fixed simulation time',()=>{
 const p=physics(),expired=[];const g=createKineticTargets({arcade:true,random:()=>.5,onExpired:t=>expired.push(t.id)});
 for(let n=1;n<=6;n++)g.spawn(p,.5,undefined,60,0);
 assert.equal(g.target.type,'bonus');const id=g.target.id;g.advance(p,68,0,1/60);assert.equal(g.target,null);assert.deepEqual(expired,[id]);
 for(let n=7;n<=9;n++)g.spawn(p,.5,undefined,70,1);
 assert.equal(g.target.moving,true);const x=g.target.x;g.advance(p,70,2,1/60);assert.notEqual(g.target.x,x);assert.ok(Math.abs(g.target.x-g.target.baseX)<=.6);
});
test('arcade placement rejects overlaps and does not consume serials on failed placement',()=>{
 const p=physics();p.config.activeCount=2;const g=createKineticTargets({arcade:true,random:()=>.5});p.positionData.set([0,0,-.65],3);
 assert.equal(g.spawn(p,0,{x:.25,y:.25,width:.5,height:.5},0,0),null);p.positionData[3]=5;
 assert.equal(g.spawn(p,0,undefined,0,0).serial,1);
});
test('moving collisions report the actual ball/target once and resize cannot create a hit',()=>{
 const p=physics(),hits=[];const g=createKineticTargets({arcade:true,random:()=>.5,onHit:event=>hits.push(event)});
 for(let n=1;n<=3;n++)g.spawn(p,.5,undefined,50,0);
 const t=g.target;p.config.activeCount=2;p.positionData.set([t.x-3,t.y,t.z],3);const old=p.positionData.slice();p.positionData[3]=t.x+3;g.advance(p,50,.05,1/60);
 assert.equal(g.check(p,old),true);assert.equal(g.check(p,old),false);assert.equal(hits[0].slot,1);assert.equal(hits[0].type,'normal');
});

test('unsafe bonus falls back to a clear normal target without a bonus lifetime',()=>{const p=physics(),g=createKineticTargets({arcade:true,random:()=>.5});for(let n=0;n<5;n++)g.spawn(p,.5,undefined,60,0);p.config.activeCount=2;p.positionData.set([1.6,.25,-.65],3);const target=g.spawn(p,.5,undefined,60,0);assert.equal(target.type,'normal');assert.equal(target.expiresAt,Infinity);});

test('relocation establishes a new collision baseline and preserves an active target lifetime',()=>{const p=physics(),g=createKineticTargets({arcade:true,random:()=>.5});g.spawn(p,.5,undefined,50,0);const id=g.target.id;p.config.maxX=2;p.config.activeCount=2;p.positionData.set([5,0,-.65],3);const t=g.relocate(p,.5,undefined,51,1);assert.equal(t.id,id);assert.ok(Math.abs(t.x)+t.radius<p.config.maxX);assert.deepEqual(t.previousCenter,{x:t.x,y:t.y,z:t.z});assert.equal(g.check(p,p.positionData.slice()),false);});
