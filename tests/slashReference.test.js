import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createSlashDetector} from '../src/tracking/slashDetector.js';import {createSlashFrameMotion} from '../src/tracking/slashFrameMotion.js';import {sweptHit} from '../src/effects/slashGeometry.js';
test('qualifying a curved swipe preserves every accepted segment',()=>{
 const d=createSlashDetector(),sample=(x,y,t)=>({active:true,center:{x,y},edge:[{x,y:y-.04},{x,y:y+.04}],aspect:1,timestamp:t,sequence:t,source:'hand'});
 d.update(sample(.2,.3,0),0);d.update(sample(.25,.3,50),50);const cut=d.update(sample(.25,.35,100),100);assert.ok(cut);assert.equal(cut.path.length,3);
});
test('collision follows the reconstructed bend rather than cutting across a shortcut',()=>{
 const points=[{x:0,y:0},{x:100,y:0},{x:100,y:100}].map(center=>({center,edge:[center,center]}));const slash={start:points[0].center,end:points[2].center,previousEdge:points[0].edge,edge:points[2].edge,path:points};assert.equal(sweptHit(slash,{x:100,y:0,radius:5},0),true);assert.equal(sweptHit(slash,{x:50,y:50,radius:5},0),false);
});
test('recorded frame-motion data recognizes the reference chops and stays quiet outside them',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('./fixtures/slash-motion-reference.json',import.meta.url))),motion=createSlashFrameMotion(),detector=createSlashDetector(),times=[];
 for(const [sequence,s] of data.samples.entries()){const time=s.time*1000,p=motion.consume(s.motion,data.width,data.height,time,sequence),cut=detector.update(p,time);if(cut)times.push(s.time);}
 const windows=[[.95,1.3],[1.75,2],[2.5,2.8],[3.05,3.3],[3.75,4],[4.35,4.6],[5.05,5.35],[6.1,6.5],[6.85,7.15],[7.4,7.8],[8.1,8.4]];const hits=windows.filter(([a,b])=>times.some(t=>t>=a&&t<=b));assert.ok(hits.length>=9,`matched ${hits.length}/${windows.length}, events ${times}`);assert.ok(times.every(t=>t>.6&&t<8.5));
});
