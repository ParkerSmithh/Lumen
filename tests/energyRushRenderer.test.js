import test from 'node:test';import assert from 'node:assert/strict';
import {drawEnergyRush} from '../src/effects/energyRushRenderer.js';
function context(){const calls=[];return new Proxy({calls,createRadialGradient:()=>({addColorStop(){}})}, {get(o,key){if(key in o)return o[key];return (...args)=>calls.push([key,...args]);},set(o,key,v){o[key]=v;return true;}});}
test('reduced motion removes trails and uses a single stationary arena ring',()=>{
 const ctx=context(),scene={phase:'PLAYING',clock:5,fever:false,inputMode:'body',orbs:[{active:true,x:.5,y:.5,radius:.025,colorIndex:0,born:0,warning:.5,trail:new Float32Array(24),trailCount:12}],hazards:[]};
 drawEnergyRush(ctx,640,480,scene,{reduced:true,intensity:'MAX'});assert.equal(ctx.calls.filter(c=>c[0]==='ellipse').length,1);assert.equal(ctx.calls.filter(c=>c[0]==='lineTo').length,0);
});
test('arena ring decoration respects remaining shared effect capacity',()=>{
 const ctx=context(),scene={phase:'PLAYING',clock:5,fever:true,inputMode:'body',orbs:[],hazards:[]};drawEnergyRush(ctx,640,480,scene,{intensity:'MAX',budget:{records:0}});assert.equal(ctx.calls.filter(c=>c[0]==='ellipse').length,0);
});
test('hazards have warning text and geometric symbols independent of red color',()=>{
 const ctx=context(),scene={phase:'PLAYING',clock:0,inputMode:'body',orbs:[],hazards:[{active:true,x:.5,y:.5,radius:.025,born:0,warning:1.2}]};drawEnergyRush(ctx,640,480,scene);assert.ok(ctx.calls.some(c=>c[0]==='fillText'&&c[1]==='DANGER'));assert.ok(ctx.calls.some(c=>c[0]==='closePath'));assert.ok(ctx.calls.some(c=>c[0]==='setLineDash'&&c[1].length===2));
});
