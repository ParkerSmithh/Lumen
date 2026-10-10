import test from 'node:test';import assert from 'node:assert/strict';
import {createPersonalBests} from '../src/game/personalBests.js';
import {createEchoSession} from '../src/echoes/echoRuntime.js';
import {createEnergyEvents} from '../src/game/energyEvents.js';
const color='#b06aff';
test('ENERGY RUSH body and assisted bests are versioned independently of other games',()=>{
 const data=new Map(),b=createPersonalBests(()=>({getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}));
 b.record('ENERGY_RUSH_BODY',{score:1200,count:9},true);b.record('ENERGY_RUSH_ASSIST',{score:4000,count:20},true);
 assert.equal(b.read('ENERGY_RUSH_BODY').score,1200);assert.equal(b.read('ENERGY_RUSH_ASSIST').score,4000);assert.equal(b.read('FLOW').score,0);
 assert.ok(data.has('lumen.arcade.bests.energy-rush.v2.body'));b.record('ENERGY_RUSH_BODY',{score:99999,count:90},false);assert.equal(b.read('ENERGY_RUSH_BODY').score,1200);
});
test('pre-remediation noisy scores remain preserved but do not become corrected-rule bests',()=>{
 const data=new Map([['lumen.arcade.bests.energy-rush.v1.body',JSON.stringify({version:1,metrics:{score:4200,count:19}})]]),b=createPersonalBests(()=>({getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}));assert.equal(b.read('ENERGY_RUSH_BODY').score,0);b.record('ENERGY_RUSH_BODY',{score:100,count:1},true);assert.equal(b.read('ENERGY_RUSH_BODY').score,100);assert.equal(JSON.parse(data.get('lumen.arcade.bests.energy-rush.v1.body')).metrics.score,4200);assert.equal(JSON.parse(data.get('lumen.arcade.bests.energy-rush.v2.body')).rulesVersion,2);
});
test('game events are abstract bounded ECHOES marks and never activate CORE',()=>{
 const session=createEchoSession(),events=createEnergyEvents(session);session.beyond.chaos.tick('GLOW',performance.now(),true);events.reset('body');
 for(let i=0;i<100;i++)events.accept({kind:'energy-orb',id:'orb:'+i,x:.513,y:.621,points:100,combo:i+1},color);
 for(let i=0;i<20;i++)events.accept({kind:'energy-challenge',id:'challenge:'+i,x:.2,y:.5,points:250},color);
 const records=session.store.snapshot();assert.ok(records.length<=24);assert.ok(records.length>0);assert.equal(records[0].points[0].x,.5);assert.equal('cells' in records[0],false);assert.equal('landmarks' in records[0],false);assert.equal(session.beyond.snapshot().activated.GLOW,false);
});
test('event deduplication and suspension prevent extra CHAOS meter and ECHOES awards',()=>{
 const session=createEchoSession(),events=createEnergyEvents(session);session.beyond.chaos.tick('GLOW',performance.now(),true);events.reset('body');const event={kind:'energy-orb',id:'one',x:.5,y:.5,points:100};events.accept(event,color);const meter=session.beyond.chaos.snapshot('GLOW').meter;
 events.accept(event,color);assert.equal(session.store.snapshot().length,1);assert.equal(session.beyond.chaos.snapshot('GLOW').meter,meter);
 session.gate.set(true);events.accept({...event,id:'two'},color);assert.equal(session.store.snapshot().length,1);
});
test('assisted accepted events do not count as physical participation',()=>{
 const session=createEchoSession(),events=createEnergyEvents(session);events.reset('assist');events.accept({kind:'energy-orb',id:'one',x:.5,y:.5,points:100},color);assert.equal(session.beyond.snapshot().activated.GLOW,false);
});
test('FEVER feedback, SURGE and BODYSHIFT share bounded records and shockwaves',()=>{
 const session=createEchoSession(),chaos=session.beyond.chaos;chaos.tick('GLOW',performance.now(),true);chaos.setEnergyRush(true);
 for(const level of ['CALM','WILD','MAX']){
  chaos.setIntensity(level);for(let i=0;i<200;i++)chaos.activity('GLOW',{id:level+i,type:'energy-orb',point:{x:.5,y:.5},color,intensity:1});
  const b=chaos.budget('GLOW'),p=chaos.profile('GLOW');assert.ok(chaos.counts().effects+b.records<=p.records);assert.ok(chaos.counts().effects<=b.shockwaves);
 }
});
