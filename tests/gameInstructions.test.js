import test from 'node:test';
import assert from 'node:assert/strict';
import {GAME_INSTRUCTIONS,getGameInstructions} from '../src/game/gameInstructions.js';

test('every game has three distinct camera and assisted instruction steps',()=>{
 for(const gameId of ['ENERGY_RUSH','FLOW','SLASH','LAUNCH']){
  const camera=getGameInstructions(gameId),assist=getGameInstructions(gameId,true);
  assert.equal(camera.steps.length,3);assert.equal(assist.steps.length,3);
  assert.notDeepEqual(camera.steps,assist.steps);
  assert.equal(camera.title,GAME_INSTRUCTIONS[gameId].title);
 }
});
test('kinetic instructions separate creation, acquisition, and intentional release',()=>{
 const steps=getGameInstructions('LAUNCH',true).steps.map(step=>step.join(' '));
 assert.match(steps[0],/empty space/);assert.match(steps[0],/Press C/);
 assert.match(steps[1],/Space to grab/);assert.match(steps[2],/release.*Space/i);
 const camera=getGameInstructions('LAUNCH').steps.flat().join(' ');
 assert.match(camera,/open-palm push/);assert.match(camera,/single grab candidate/);
});
test('invalid game identities fail explicitly',()=>assert.throws(()=>getGameInstructions('UNKNOWN'),/Unknown instruction game/));
