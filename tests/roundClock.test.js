import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoundClock} from '../src/game/roundClock.js';
test('configurable round freezes countdown and time, expires, replays and resets',()=>{const g=createRoundClock(90);assert.equal(g.tick(0).phase,'ready');g.start(0);assert.equal(g.tick(1000).countdown,2);g.pause(1000,'camera');assert.equal(g.tick(50000).countdown,2);g.resume(50000);assert.equal(g.tick(52000).seconds,90);assert.equal(g.tick(142000).phase,'results');assert.equal(g.start(143000).countdown,3);g.reset();assert.equal(g.tick(150000).phase,'ready');});
