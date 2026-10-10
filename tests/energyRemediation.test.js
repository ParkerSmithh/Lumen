import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnergyRush} from '../src/game/energyRush.js';
import {createSilhouetteGrid} from '../src/tracking/silhouetteGrid.js';
import {createAssistField} from '../src/game/energyInput.js';

function body(seed=8,shape='rectangle'){
 const g=createEnergyRush({seed}),grid=createSilhouetteGrid();let t=0;
 const frame=(shift=0,flicker=0,reach=0,raised=false,expanded=false)=>{
  t+=100;const values=new Float32Array(64*48);
  if(shape==='rectangle')for(let y=6;y<43;y++)for(let x=24+shift;x<40+shift+flicker;x++)values[y*64+x]=1;
  else{for(let y=8;y<40;y++)for(let x=28+shift;x<36+shift;x++)values[y*64+x]=1;for(let y=23;y<25;y++)for(let x=18+shift;x<46+shift;x++)values[y*64+x]=1;}
  if(raised)for(let y=5;y<8;y++)for(let x=27;x<31;x++)values[y*64+x]=1;
  if(expanded)for(let y=23;y<25;y++)for(let x=18;x<46;x++)values[y*64+x]=1;
  grid.update({values,width:64,height:48,sourceWidth:640,sourceHeight:480,timestamp:t},t);
  g.frame(t,{input:grid,body:{valid:true,reach,timestamp:t}});return g.snapshot;
 };
 g.start(0,'body');for(let i=0;i<13;i++)frame();
 return {g,grid,frame,get time(){return t;}};
}
function lateral(r){for(let i=0;i<5;i++)r.frame(4);for(let i=0;i<5;i++)r.frame(-4);for(let i=0;i<4;i++)r.frame();assert.equal(r.g.finishCalibration(),true);for(let i=0;i<31;i++)r.frame();}
test('calibration-rejected disconnected geometry cannot enlarge reachable space',()=>{
 const g=createEnergyRush({seed:8}),grid=createSilhouetteGrid();let t=0;
 const frame=(shift=0,artifact=false)=>{t+=100;const values=new Float32Array(64*48);for(let y=8;y<40;y++){for(let x=28+shift;x<36+shift;x++)values[y*64+x]=1;if(artifact)for(let x=5;x<13;x++)values[y*64+x]=1;}grid.update({values,width:64,height:48,timestamp:t},t);g.frame(t,{input:grid});};
 g.start(0,'body');for(let i=0;i<13;i++)frame();for(let i=0;i<5;i++)frame(3);for(let i=0;i<5;i++)frame(-3);for(let i=0;i<3;i++)frame(0,true);for(let i=0;i<4;i++)frame();assert.equal(g.finishCalibration(),true);assert.ok(g.snapshot.calibration.envelope.maxX<=.625);for(let i=0;i<90;i++){frame();for(const orb of g.snapshot.orbs)assert.ok(orb.x<.65);}
});
test('uncorroborated lateral excursion cannot enlarge reachable space',()=>{
 const g=createEnergyRush({seed:8}),grid=createSilhouetteGrid();let t=0;
 const frame=(shift=0,artifact=false)=>{t+=100;const values=new Float32Array(64*48);for(let y=8;y<40;y++){for(let x=28+shift;x<36+shift;x++)values[y*64+x]=1;if(artifact)for(let x=5;x<13;x++)values[y*64+x]=1;}grid.update({values,width:64,height:48,timestamp:t},t);g.frame(t,{input:grid});};
 g.start(0,'body');for(let i=0;i<13;i++)frame();for(let i=0;i<5;i++)frame(3);for(let i=0;i<5;i++)frame(-3);for(let i=0;i<4;i++)frame();for(let i=0;i<3;i++)frame(-20);for(let i=0;i<4;i++)frame();assert.equal(g.finishCalibration(),true);assert.ok(g.snapshot.calibration.envelope.maxX<=.625);for(let i=0;i<90;i++){frame();for(const orb of g.snapshot.orbs)assert.ok(orb.x<.65);}
});
test('exact one-column stationary flicker never collects or adds noise-only hazard contacts',()=>{
 const r=body();lateral(r);for(let i=0;i<900&&r.g.snapshot.phase!=='RESULTS';i++){r.frame(0,i%2);assert.equal(r.grid.contact(1-40.5/64,.5,0,true),false);assert.equal(r.grid.contact(.36,.5,.009),false);}
 assert.equal(r.g.snapshot.collections,0);assert.equal(r.g.snapshot.score,0);assert.equal(r.g.snapshot.shields,3);
});
test('reach-only calibration without demonstrated geometry stays safe and explains recovery',()=>{
 const r=body();for(let i=0;i<6;i++)r.frame(0,0,1);assert.equal(r.g.finishCalibration(),false);assert.equal(r.g.snapshot.phase,'CALIBRATING');assert.match(r.g.snapshot.calibration.reason,/reachable|range|space/i);
});
test('reach-only observed geometry supplies actual collectible paths without forced lateral movement',()=>{
 const r=body(8,'arms');for(let i=0;i<6;i++)r.frame(0,0,1,true);for(let i=0;i<4;i++)r.frame();assert.equal(r.g.finishCalibration(),true);assert.deepEqual(r.g.snapshot.calibration.capabilities,['reach']);for(let i=0;i<60;i++)r.frame();assert.ok(r.g.snapshot.orbs.length>0);for(let i=0;i<7;i++)r.frame(0,0,1,true);assert.ok(r.g.snapshot.collections>0);
});
test('expansion-only demonstrated geometry yields collectible orbs',()=>{
 const r=body();for(let i=0;i<6;i++)r.frame(0,0,0,false,true);for(let i=0;i<4;i++)r.frame();assert.equal(r.g.finishCalibration(),true);assert.deepEqual(r.g.snapshot.calibration.capabilities,['expand']);for(let i=0;i<60;i++)r.frame();assert.ok(r.g.snapshot.orbs.length>0);for(let i=0;i<7;i++)r.frame(0,0,0,false,true);assert.ok(r.g.snapshot.collections>0);
});
test('deliberate slow body movement remains collectable with small-range calibration',()=>{
 const r=body();lateral(r);for(let i=0;i<20;i++)r.frame();const orb=r.g.snapshot.orbs[0];assert.ok(orb);const direction=orb.x>.5?-1:1;
 for(let step=1;step<=4;step++)for(let i=0;i<5;i++)r.frame(direction*step);assert.ok(r.g.snapshot.collections>0);
});
test('stable stationary masks never collect even while orbs drift',()=>{
 const r=body();lateral(r);for(let i=0;i<400;i++)r.frame();assert.equal(r.g.snapshot.collections,0);assert.equal(r.g.snapshot.score,0);assert.equal(r.g.snapshot.shields,3);
});
test('confidence threshold flicker cannot create new stable silhouette entry',()=>{
 const g=createSilhouetteGrid();for(let t=0;t<=300;t+=100){const values=new Float32Array(64*48);for(let y=6;y<43;y++)for(let x=24;x<40;x++)values[y*64+x]=1;g.update({values,width:64,height:48,timestamp:t},t);}
 for(let t=400;t<=3000;t+=100){const values=new Float32Array(64*48);for(let y=6;y<43;y++)for(let x=24;x<40;x++)values[y*64+x]=1;for(let y=6;y<43;y++)values[y*64+40]=t%200?.59:.61;g.update({values,width:64,height:48,timestamp:t},t);assert.equal(g.contact(.36,.5,.009),false);}
});
test('unusable space cannot start countdown underneath excluded HUD regions',()=>{
 const r=body();for(let i=0;i<5;i++)r.frame(4);for(let i=0;i<5;i++)r.frame(-4);for(let i=0;i<4;i++)r.frame();r.g.frame(r.time,{input:r.grid,excluded:[{minX:0,minY:0,maxX:1,maxY:1}]});assert.equal(r.g.finishCalibration(),false);assert.equal(r.g.snapshot.phase,'CALIBRATING');
});
test('nonrectangular calibrated silhouettes keep every drifting orb reachable',()=>{
 const r=body(8,'arms');lateral(r);for(let i=0;i<300;i++){const s=r.frame();for(const o of s.orbs){let reachable=false;for(let n=0;n<=1000;n++){const target=s.calibration.baseline.x+(s.calibration.envelope.minX-s.calibration.baseline.minX)+(s.calibration.envelope.maxX-s.calibration.baseline.maxX-(s.calibration.envelope.minX-s.calibration.baseline.minX))*n/1000;if(r.grid.contact(o.x-(target-r.grid.snapshot.center.x),o.y,o.radius))reachable=true;}assert.equal(reachable,true);}}
});
for(const hz of [30,60,120,144,240])test(`assisted crossing at ${hz}Hz produces exactly one real entry`,()=>{
 const f=createAssistField();let contacts=0;f.update(0,{x:.35,y:.5});for(let i=1;i<=Math.ceil(hz*.9);i++){f.update(i*1000/hz,{x:.35+.45*i/hz,y:.5});if(f.contact(.55,.5,.024,true))contacts++;}assert.equal(contacts,1);
});
test('slow precise touch movement collects without synthetic repeat entry',()=>{
 const f=createAssistField();let contacts=0;f.update(0,{x:.35,y:.5});for(let i=1;i<=400;i++){f.update(i*1000/60,{x:.35+.001*i,y:.5});if(f.contact(.55,.5,.024,true))contacts++;}assert.equal(contacts,1);
});
test('fast real assisted crossing is swept once but an idle field cannot farm a drifting target',()=>{
 const f=createAssistField();f.update(0,{x:.2,y:.5});f.update(50,{x:.8,y:.5});assert.equal(f.sweep({x:.5,y:.5},{x:.5,y:.5},.024,true),true);f.update(100,{x:.8,y:.5});assert.equal(f.sweep({x:.5,y:.5},{x:.8,y:.5},.024,true),false);
});
test('portrait assisted contact follows the visible circular field',()=>{
 const f=createAssistField();f.update(0,{x:.5,y:.5,aspect:.75});f.update(50,{x:.5,y:.5,aspect:.75});assert.equal(f.contact(.5,.6,.024),false);
});
test('damage during FEVER allows a new earned FEVER after expiry',()=>{
 const g=createEnergyRush({seed:17});let t=0,collect=true,damage=false;const input={snapshot:null,fresh:()=>true,contact:()=>false,sweep:(a,b,r,entry)=>entry?collect:damage};
 const step=()=>{t+=100;input.snapshot={valid:true,timestamp:t,center:{x:.5,y:.5},occupancy:.05,bounds:{minX:.43,maxX:.57,minY:.41,maxY:.59},actions:{}};g.frame(t,{input});assert.ok(t<90000);};
 g.start(0,'assist');while(!g.snapshot.fever)step();collect=false;damage=true;while(g.snapshot.shields===3)step();damage=false;while(g.snapshot.fever)step();collect=true;while(g.snapshot.combo<9)step();assert.equal(g.snapshot.fever,true);
});
test('FEVER suspension freezes active time and replay resets its lifecycle',()=>{
 const g=createEnergyRush({seed:17});let t=0;const input={snapshot:null,fresh:()=>true,contact:()=>false,sweep:(a,b,r,entry)=>!!entry};
 const step=(delta=100,blocked=[])=>{t+=delta;input.snapshot={valid:true,timestamp:t,center:{x:.5,y:.5},occupancy:.05,bounds:{minX:.43,maxX:.57,minY:.41,maxY:.59},actions:{}};g.frame(t,{input,blocked});assert.ok(t<90000);};
 g.start(0,'assist');while(!g.snapshot.fever)step();g.pause('user',t);const remaining=g.snapshot.feverRemaining;step(5000,['echoes']);assert.equal(g.snapshot.feverRemaining,remaining);assert.equal(g.resume(t),false);step(100);assert.equal(g.resume(t),true);step();assert.ok(g.snapshot.feverRemaining<remaining);g.exit();g.start(t,'assist');assert.equal(g.snapshot.fever,false);assert.equal(g.snapshot.combo,0);assert.equal(g.snapshot.shields,3);
});
test('damage then a milestone reached during FEVER can earn FEVER on a fresh post-expiry collection',()=>{
 const g=createEnergyRush({seed:17});let t=0,collect=true,damage=false;const input={snapshot:null,fresh:()=>true,contact:()=>false,sweep:(a,b,r,entry)=>entry?collect:damage};
 const step=()=>{t+=100;input.snapshot={valid:true,timestamp:t,center:{x:.5,y:.5},occupancy:.05,bounds:{minX:.43,maxX:.57,minY:.41,maxY:.59},actions:{}};g.frame(t,{input});assert.ok(t<90000);};
 g.start(0,'assist');while(!g.snapshot.fever)step();damage=true;while(g.snapshot.shields===3)step();damage=false;while(g.snapshot.combo<9)step();const oldEnd=g.snapshot.elapsed+g.snapshot.feverRemaining;while(g.snapshot.elapsed<=oldEnd+.1)step();while(!g.snapshot.fever)step();assert.ok(g.snapshot.combo>=9);
});
test('deliberate slow body contact still damages once per hazard',()=>{
 const r=body();lateral(r);const damageIds=new Set();let damages=0;
 for(let i=0;i<500&&r.g.snapshot.phase!=='RESULTS';i++){
  const step=i%80,shift=step<40?Math.floor(step/5)-4:4-Math.floor((step-40)/5);r.frame(shift);
  for(const e of r.g.drainEvents())if(e.kind==='energy-damage'){assert.equal(damageIds.has(e.id),false);damageIds.add(e.id);damages++;}
 }
 assert.ok(damages>0);assert.equal(r.g.snapshot.shields,3-damages);
});
