import test from 'node:test';import assert from 'node:assert/strict';
import {createSilhouetteGrid} from '../src/tracking/silhouetteGrid.js';
import {createEnergyRush} from '../src/game/energyRush.js';
function bodyGame(){
 const g=createEnergyRush({seed:8}),grid=createSilhouetteGrid();let time=0;
 const frame=(x=.5,width=16,extra={})=>{time+=100;const values=new Float32Array(64*48),left=Math.round((1-x)*64)-width/2;for(let y=6;y<43;y++)for(let xx=Math.max(0,left);xx<Math.min(64,left+width);xx++)values[y*64+xx]=1;grid.update({width:64,height:48,sourceWidth:640,sourceHeight:480,timestamp:time,values},time);g.frame(time,{input:grid,...extra});return g.snapshot;};
 g.start(0,'body');for(let i=0;i<13;i++)frame();for(let i=0;i<5;i++)frame(.44);for(let i=0;i<5;i++)frame(.56);for(let i=0;i<4;i++)frame();g.finishCalibration();for(let i=0;i<31;i++)frame();return {g,grid,frame,get time(){return time;}};
}
test('physical calibration uses the real mirrored mask and supports sub-full-body occupancy',()=>{
 const r=bodyGame();assert.equal(r.g.snapshot.phase,'PLAYING');assert.deepEqual(r.g.snapshot.calibration.capabilities,['left','right']);assert.ok(r.g.snapshot.calibration.targets.left<.06);
});
test('framing changes safely pause until explicit recalibration without consuming time',()=>{
 const r=bodyGame(),before=r.g.snapshot.elapsed;r.frame(.5,28);assert.equal(r.g.snapshot.phase,'PAUSED');assert.ok(r.g.snapshot.blockers.includes('framing'));assert.equal(r.g.snapshot.elapsed,before);assert.equal(r.g.resume(r.time),false);
 r.g.recalibrate(r.time);assert.equal(r.g.snapshot.phase,'CALIBRATING');assert.equal(r.g.snapshot.score,0);
});
test('HUD exclusions and impossible spawn regions defer spawns rather than placing unfair objects',()=>{
 const r=bodyGame();for(let i=0;i<40;i++)r.frame(.5,16,{excluded:[{minX:0,minY:0,maxX:1,maxY:1}]});assert.equal(r.g.snapshot.orbs.length,0);assert.equal(r.g.snapshot.hazards.length,0);
});
test('stale silhouette cannot score even while the renderer could still fade its previous mask',()=>{
 const r=bodyGame();for(let i=0;i<20;i++)r.frame();const before=r.g.snapshot;r.g.frame(r.time+251,{input:r.grid});assert.equal(r.g.snapshot.phase,'PAUSED');assert.equal(r.g.snapshot.score,before.score);assert.equal(r.g.snapshot.shields,before.shields);assert.equal(r.g.snapshot.elapsed,before.elapsed);
});
test('small-range body play receives reachable orbs and earns a collection through fresh silhouette entry',()=>{
 const r=bodyGame();for(let i=0;i<20;i++)r.frame();const s=r.g.snapshot,orb=s.orbs.find(o=>s.elapsed-o.born>.5);assert.ok(orb,'a demonstrated six-percent movement range must have a reachable orb');
 r.frame(orb.x<.5?.44:.56);assert.ok(r.g.snapshot.score>=100);
});
