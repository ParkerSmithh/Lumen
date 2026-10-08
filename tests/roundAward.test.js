import test from 'node:test';import assert from 'node:assert/strict';
import {createRoundClock} from '../src/game/roundClock.js';
import {awardRoundHit} from '../src/game/roundAward.js';
test('score mutation and count acceptance share one deadline and pause check',()=>{
 const clock=createRoundClock(90);clock.start(0);let score=0;
 assert.equal(awardRoundHit(clock,93000,1,()=>score+=200),false);assert.equal(score,0);assert.equal(clock.tick(93000).count,0);
 clock.start(94000);assert.equal(awardRoundHit(clock,97000,1,()=>score+=200),true);assert.equal(score,200);assert.equal(clock.tick(97000).count,1);
 clock.pause(98000,'camera');assert.equal(awardRoundHit(clock,99000,1,()=>score+=200),false);assert.equal(score,200);
});
