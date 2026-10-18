import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bodyLight,resolveBodyProfile,relightChannel,decodeLight,encodeLight} from '../src/effects/bodyIllumination.js';
import {colors} from '../src/colors.js';

test('relighting lifts dark input monotonically without suppressing camera channels',()=>{
 for(const [,hex] of colors)for(const color of bodyLight(hex)){
  let previous=0;
  for(const name of ['NATURAL','RADIANT','BLAZING']){const v=relightChannel(.16,color,resolveBodyProfile(name));assert.ok(v>.16&&v>previous&&v<1);previous=v;}
  for(const name of ['NATURAL','RADIANT','BLAZING']){let last=-1;for(let i=0;i<=255;i++){const v=relightChannel(i/255,color,resolveBodyProfile(name));assert.ok(v>=last&&v<=1&&Number.isFinite(v));last=v;}}
 }
});
test('linear-light transfer round trips darks, midtones and highlights',()=>{
 for(const v of [0,.001,.02,.04,.18,.5,.9,1])assert.ok(Math.abs(encodeLight(decodeLight(v))-v)<1e-6);
});
test('unknown body preset recovers to the recommended curve',()=>{
 assert.equal(relightChannel(.2,1,resolveBodyProfile('invalid')),relightChannel(.2,1,resolveBodyProfile('RADIANT')));
});
