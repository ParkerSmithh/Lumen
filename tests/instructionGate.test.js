import test from 'node:test';
import assert from 'node:assert/strict';
import {createEchoGate} from '../src/echoes/echoGate.js';
test('instruction and gallery suspension cannot clear each other',()=>{
 const gate=createEchoGate();gate.set(true,'instructions');gate.set(true);
 gate.set(false,'instructions');assert.equal(gate.suspended,true);
 gate.set(false);assert.equal(gate.suspended,false);
});
