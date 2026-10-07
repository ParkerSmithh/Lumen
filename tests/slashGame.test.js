import test from 'node:test';
import assert from 'node:assert/strict';
import { createSlashGame, slashDifficulty } from '../src/game/slashGame.js';

test('ready, exact countdown boundaries and two-minute end use one elapsed clock', () => {
  const game = createSlashGame();
  assert.equal(game.tick(0).phase, 'ready');
  game.start(100);
  assert.equal(game.tick(100).countdown, 3);
  assert.equal(game.tick(1099).countdown, 3);
  assert.equal(game.tick(1100).countdown, 2);
  assert.equal(game.tick(2100).countdown, 1);
  assert.equal(game.tick(3100).remaining, 120);
  assert.equal(game.tick(3100).phase, 'playing');
  assert.equal(game.tick(63100).remaining, 60);
  assert.equal(game.tick(123099).phase, 'playing');
  assert.equal(game.tick(123100).phase, 'results');
  assert.equal(game.tick(999999).remaining, 0);
});

test('counts each destroyed object, freezes at deadline and resets on replay', () => {
  const game = createSlashGame();
  game.addHits(3, 0); assert.equal(game.tick(0).count, 0);
  game.start(0); game.addHits(3, 2999); assert.equal(game.tick(2999).count, 0);
  game.addHits(3, 3000); game.addHits(0, 4000);
  assert.equal(game.tick(4000).count, 3);
  game.addHits(2, 123000); assert.equal(game.tick(123000).count, 3);
  game.start(124000); assert.equal(game.tick(124000).count, 0);
  assert.equal(game.tick(127000).elapsed, 0);
  assert.equal(game.tick(127000).remaining, 120);
});

test('countdown and playing pauses exclude hidden time, require explicit resume', () => {
  const game = createSlashGame(); game.start(0); game.pause(500, 'visibility');
  assert.equal(game.tick(20000).countdown, 3);
  assert.equal(game.tick(20000).paused, true);
  game.resume(20000); assert.equal(game.tick(22500).phase, 'playing');
  game.pause(23500, 'camera'); game.addHits(4, 50000);
  assert.equal(game.tick(50000).elapsed, 1);
  assert.equal(game.tick(50000).count, 0);
  game.resume(50000); assert.equal(game.tick(169000).phase, 'results');
});

test('a rendering stall expires the session without stretching its duration', () => {
  const game = createSlashGame(); game.start(0);
  assert.equal(game.tick(130000).phase, 'results');
  assert.equal(game.tick(130000).progress, 1);
  game.reset(); assert.equal(game.tick(999999).phase, 'ready');
});

test('difficulty hits approved anchors and remains monotonic and bounded', () => {
  for (const [seconds, interval, cap] of [[0,1.8,3],[30,1.2,5],[60,.8,7],[90,.45,8],[120,.35,8]]) {
    const value = slashDifficulty(seconds / 120);
    assert.equal(value.interval, interval); assert.equal(value.cap, cap);
  }
  let previous = slashDifficulty(0);
  for (let i=0;i<=1200;i++) {
    const current=slashDifficulty(i/1200);
    assert.ok(current.interval<=previous.interval && current.interval>=.35);
    assert.ok(current.cap>=previous.cap && current.cap<=8);
    previous=current;
  }
});
