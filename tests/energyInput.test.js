import test from 'node:test';import assert from 'node:assert/strict';
import {createAssistField, energyKeyDirection} from '../src/game/energyInput.js';
test('keyboard direction excludes editable controls and irrelevant keys',()=>{
 assert.deepEqual(energyKeyDirection('ArrowLeft'),{x:-1,y:0});assert.deepEqual(energyKeyDirection('KeyW'),{x:0,y:-1});assert.equal(energyKeyDirection('KeyP'),null);
});
test('touch/keyboard field is clamped and entry contact requires real movement',()=>{
 const a=createAssistField();a.update(0,{x:.5,y:.5});a.update(70,{x:.5,y:.5});assert.equal(a.contact(.5,.5,.02,true),false);
 a.update(140,{x:.6,y:.5});assert.equal(a.contact(.64,.5,.02,true),true);a.update(210,{x:10,y:-10});assert.deepEqual(a.snapshot.center,{x:.94,y:.1});
});
