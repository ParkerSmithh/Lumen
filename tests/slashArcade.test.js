import test from 'node:test';
import assert from 'node:assert/strict';
import { createSlashArcade, slashArcadeDifficulty, selectCrystalType } from '../src/game/slashArcade.js';

test('combo thresholds score every destroyed crystal before applying multiplier', () => {
  const game = createSlashArcade();
  const expected = [100,200,400,600,800,1100,1400,1700,2000,2400];
  expected.forEach((score,i) => assert.equal(game.record([{id:i,type:'normal'}],i).score,score));
  assert.equal(game.snapshot(9).maxCombo,10);
});

test('batch scoring sorts numeric IDs and deduplicates destruction across calls', () => {
  const game = createSlashArcade();
  const events = [{id:3,type:'bonus'},{id:1,type:'splitting'},{id:2,type:'child'}];
  assert.equal(game.record(events,0).score,800);
  assert.equal(game.record(events,1).score,800);
  assert.equal(game.snapshot(1).combo,3);
  assert.deepEqual(events.map(event => event.id),[3,1,2]);
  game.reset();
  assert.equal(game.record([{id:1,type:'normal'}],0).score,100);
});

test('active elapsed controls exact combo boundary, paused time, and expiry', () => {
  const game = createSlashArcade();
  game.record([{id:1,type:'normal'}],5);
  assert.equal(game.snapshot(5).combo,1);
  assert.equal(game.snapshot(7).combo,1);
  assert.equal(game.record([{id:2,type:'normal'}],7).combo,2);
  assert.equal(game.snapshot(9.001).combo,0);
  assert.equal(game.snapshot(9.001).maxCombo,2);
  assert.equal(game.record([{id:3,type:'normal'}],10).combo,1);
  assert.equal(game.snapshot(10).comboExpiresAt,12);
});

test('misses and malformed inputs cannot award score or extend combo', () => {
  const game=createSlashArcade();
  game.record([{id:1,type:'normal'}],0);
  game.record([{id:2,type:'missed'},{id:NaN,type:'bonus'},null,{id:3}],1);
  game.record([{id:4,type:'normal'}],Infinity);
  game.record(null,1);
  assert.equal(game.snapshot(1).score,100);
  assert.equal(game.snapshot(1).comboExpiresAt,2);
  assert.equal(game.snapshot(3).combo,0);
});

test('OVERLOAD preserves early ramp and smoothly intensifies final twenty seconds under cap eight', () => {
  for(const [seconds,interval,cap] of [[0,1.8,3],[30,1.2,5],[60,.8,7],[90,.45,8]]) {
    assert.deepEqual(slashArcadeDifficulty(seconds/120),{interval,cap,overload:false});
  }
  assert.ok(Math.abs(slashArcadeDifficulty(100/120).interval-.4240740740740741)<1e-12);
  assert.equal(slashArcadeDifficulty(100/120).overload,true);
  assert.equal(slashArcadeDifficulty(1).interval,.28);
  let previous=Infinity;
  for(let i=0;i<=1200;i++) {
    const value=slashArcadeDifficulty(i/1200);
    assert.ok(value.interval<=previous && value.interval>=.28 && value.cap<=8);
    previous=value.interval;
  }
});

test('special selection respects warmup, probability boundaries and splitting capacity', () => {
  const choose=(random,extra={})=>selectCrystalType({elapsed:15,random:()=>random,hasSplitter:false,capacityAvailable:2,...extra});
  assert.equal(choose(0,{elapsed:14.999}),'normal');
  assert.equal(choose(0),'bonus');
  assert.equal(choose(.0799),'bonus');
  assert.equal(choose(.08),'splitting');
  assert.equal(choose(.1799),'splitting');
  assert.equal(choose(.18),'normal');
  assert.equal(choose(.1,{hasSplitter:true}),'normal');
  assert.equal(choose(.1,{capacityAvailable:1}),'normal');
});
