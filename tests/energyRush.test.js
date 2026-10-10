import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnergyRush, comboMultiplier} from '../src/game/energyRush.js';
import {createAssistField} from '../src/game/energyInput.js';
import {createSilhouetteGrid} from '../src/tracking/silhouetteGrid.js';

function game(scope=0){const g=createEnergyRush({seed:17,scope}),input=createAssistField();let time=0;g.start(0,'assist');const step=(ms=100,position)=>{time+=ms;input.update(time,position);g.frame(time,{input});return g.snapshot;};for(let i=0;i<32;i++)step();return {g,input,step,get time(){return time;}};}
test('countdown finishes before ninety active seconds and replay clears earned state',()=>{
 const r=game();assert.equal(r.g.snapshot.phase,'PLAYING');for(let i=0;i<900;i++)r.step();assert.equal(r.g.snapshot.phase,'RESULTS');assert.equal(r.g.snapshot.remaining,0);
 r.g.start(r.time,'assist');assert.equal(r.g.snapshot.score,0);assert.equal(r.g.snapshot.shields,3);assert.equal(r.g.snapshot.orbs.length,0);
});
test('nested pauses freeze clocks, prevent resume through gallery and require explicit resume',()=>{
 const r=game();const before=r.g.snapshot.elapsed;r.g.pause('user',r.time);r.input.update(r.time+10000);r.g.frame(r.time+10000,{input:r.input,blocked:['echoes']});assert.equal(r.g.resume(r.time+10000),false);assert.equal(r.g.snapshot.elapsed,before);
 r.input.update(r.time+10010);r.g.frame(r.time+10010,{input:r.input,blocked:[]});assert.equal(r.g.snapshot.phase,'PAUSED');assert.equal(r.g.resume(r.time+10010),true);
});
test('orb requires grace and fresh moving contact; collection identity awards once',()=>{
 const r=game();for(let i=0;i<10;i++)r.step();const orb=r.g.snapshot.orbs[0];assert.ok(orb);r.step(100,{x:orb.x,y:orb.y});const score=r.g.snapshot.score;assert.equal(score,100);
 for(let i=0;i<3;i++)r.step(100,{x:orb.x,y:orb.y});assert.equal(r.g.snapshot.score,score);assert.equal(r.g.snapshot.combo,1);
});
test('stationary assisted body cannot farm drifted orbs and spawns remain bounded',()=>{
 const r=game();for(let i=0;i<500;i++)r.step();assert.equal(r.g.snapshot.score,0);assert.ok(r.g.snapshot.orbs.length<=6);assert.ok(r.g.snapshot.hazards.length<=2);
});
test('hazards are telegraphed, accept distinct contact, deduplicate damage and grant invulnerability',()=>{
 const r=game();for(let i=0;i<90;i++)r.step();const h=r.g.snapshot.hazards[0];assert.ok(h);r.step(100,{x:h.x,y:h.y});assert.equal(r.g.snapshot.shields,3);r.step(100,{x:h.x,y:h.y});assert.equal(r.g.snapshot.shields,2);
 for(let i=0;i<5;i++)r.step(100,{x:h.x,y:h.y});assert.equal(r.g.snapshot.shields,2);assert.equal(r.g.snapshot.combo,0);
});
test('multiplier applies at exact earned collection boundaries',()=>{
 assert.deepEqual([0,1,2,3,4,5,6,7,8,9,50].map(comboMultiplier),[1,1,1,2,2,3,3,4,4,5,5]);
});
test('invalid tracking suspends without spending time or shields and needs stable reacquisition',()=>{
 const r=game();const before=r.g.snapshot.elapsed;r.g.frame(r.time+100,{input:null});assert.equal(r.g.snapshot.phase,'PAUSED');assert.equal(r.g.snapshot.elapsed,before);assert.equal(r.g.resume(r.time+100),false);assert.equal(r.g.snapshot.shields,3);
 for(let t=r.time+200;t<=r.time+1500;t+=100){r.input.update(t);r.g.frame(t,{input:r.input});}assert.equal(r.g.resume(r.time+1500),true);
});
test('recalibration freezes earned time and score, and exit returns to clean READY',()=>{
 const r=game();const before=r.g.snapshot.elapsed;r.g.recalibrate(r.time);assert.equal(r.g.snapshot.phase,'CALIBRATING');assert.equal(r.g.snapshot.elapsed,before);r.g.exit();assert.equal(r.g.snapshot.phase,'READY');assert.equal(r.g.snapshot.orbs.length,0);
});
test('same seed and inputs give deterministic spawn identities and bounded events',()=>{
 const a=game(),b=game();for(let i=0;i<30;i++){a.step();b.step();}assert.deepEqual(a.g.snapshot.orbs,b.g.snapshot.orbs);assert.ok(a.g.drainEvents().length<=16);
});
test('earned FEVER lasts eight active seconds and cannot retrigger from further collections',()=>{
 const r=game();let feverAt=null;
 for(let i=0;i<250&&r.g.snapshot.combo<10;i++){
  const s=r.g.snapshot,orb=s.orbs.find(o=>s.elapsed-o.born>=.5);
  r.step(100,orb?{x:orb.x,y:orb.y}:{x:.5,y:.5});
  if(r.g.snapshot.fever&&feverAt===null)feverAt=r.g.snapshot.elapsed;
 }
 assert.ok(feverAt!==null);const remaining=r.g.snapshot.feverRemaining;
 r.g.pause('user',r.time);r.input.update(r.time+1000);r.g.frame(r.time+1000,{input:r.input});assert.equal(r.g.snapshot.feverRemaining,remaining);r.g.resume(r.time+1000);
 for(let t=r.time+1100;t<r.time+10000;t+=100){r.input.update(t,{x:.5,y:.5});r.g.frame(t,{input:r.input});}
 assert.equal(r.g.snapshot.fever,false);
});
test('motion challenges require neutral rearming and sustained fresh relative movement',()=>{
 const r=game();for(let i=0;i<160;i++)r.step();const c=r.g.snapshot.challenge;assert.ok(c);
 // Seeded challenge may be lateral or an assisted expansion/reach.
 r.step(100,{x:.5,y:.5});const position=c.kind==='left'?{x:.2,y:.5}:c.kind==='right'?{x:.8,y:.5}:c.kind==='expand'?{x:.5,y:.5,expand:true}:{x:.5,y:.5,reach:true};
 for(let i=0;i<5;i++)r.step(100,position);
 assert.equal(r.g.snapshot.challenges,1);assert.deepEqual(r.g.drainEvents().filter(e=>e.kind==='energy-challenge').map(e=>e.points),[250]);
});
test('tracking cannot recover across missing samples',()=>{
 const r=game();r.g.frame(r.time+100,{input:null});r.input.update(r.time+200);r.g.frame(r.time+200,{input:r.input});r.input.update(r.time+1400);r.g.frame(r.time+1400,{input:r.input});assert.equal(r.g.resume(r.time+1400),false);
});
test('ninety active seconds end the round even at a valid 200ms rendering cadence',()=>{
 const g=createEnergyRush({seed:17}),input=createAssistField();g.start(0,'assist');let t=0;
 for(let i=0;i<16;i++){t+=200;input.update(t);g.frame(t,{input});}
 for(let i=0;i<450;i++){t+=200;input.update(t);g.frame(t,{input});}
 assert.equal(g.snapshot.phase,'RESULTS');assert.equal(g.snapshot.remaining,0);
});
test('fresh masks cannot turn repeated pose timestamps into an earned reach bonus',()=>{
 const g=createEnergyRush({seed:8});let t=0;
 const input=createSilhouetteGrid();
 const frame=(reach=0,poseTime,raised=false)=>{t+=100;const values=new Float32Array(64*48);for(let y=6;y<43;y++)for(let x=24;x<40;x++)values[y*64+x]=1;if(raised)for(let y=3;y<6;y++)for(let x=26;x<30;x++)values[y*64+x]=1;input.update({values,width:64,height:48,sourceWidth:640,sourceHeight:480,timestamp:t},t);g.frame(t,{input,body:{valid:true,reach,timestamp:poseTime??t}});};
 g.start(0,'body');for(let i=0;i<13;i++)frame();for(let i=0;i<6;i++)frame(1,undefined,true);for(let i=0;i<4;i++)frame();assert.equal(g.finishCalibration(),true);for(let i=0;i<190;i++)frame();assert.equal(g.snapshot.challenge?.kind,'reach');const frozen=t;for(let i=0;i<4;i++)frame(1,frozen);
 assert.equal(g.snapshot.challenges,0);assert.equal(g.snapshot.score,0);
 for(let i=0;i<6;i++)frame(1);assert.equal(g.snapshot.challenges,1);assert.equal(g.snapshot.score,250);
});
test('mode remounts namespace collision and accepted-event identities independently',()=>{
 const a=game(1),b=game(2);for(let i=0;i<10;i++){a.step();b.step();}const ao=a.g.snapshot.orbs[0],bo=b.g.snapshot.orbs[0];assert.notEqual(ao.id,bo.id);
 a.step(100,{x:ao.x,y:ao.y});b.step(100,{x:bo.x,y:bo.y});assert.notEqual(a.g.drainEvents()[0].id,b.g.drainEvents()[0].id);
});
