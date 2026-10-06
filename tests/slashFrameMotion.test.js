import test from 'node:test';import assert from 'node:assert/strict';import {createSlashFrameMotion} from '../src/tracking/slashFrameMotion.js';
const image=(x,y,w=10,h=55,level=220)=>{const a=new Uint8ClampedArray(128*96*4);for(let yy=0;yy<96;yy++)for(let xx=0;xx<128;xx++){const i=(yy*128+xx)*4,v=xx>=x&&xx<x+w&&yy>=y&&yy<y+h?level-((yy-y)%6)*28:25;a[i]=a[i+1]=a[i+2]=v;a[i+3]=255;}return a;};
test('SLASH-only image motion supplies a continuous mirrored arm path when landmarks are missing',()=>{
 const tracker=createSlashFrameMotion();tracker.update(image(30,35),128,96,0,0);const samples=[];for(let n=1;n<=6;n++){const s=tracker.update(image(30,35-n*5),128,96,n*50,n);if(s)samples.push(s);}assert.ok(samples.length>=3);assert.ok(samples.at(-1).center.y<samples[0].center.y);assert.ok(samples[0].center.x>.5);assert.equal(samples[0].source,'camera-motion');
});
test('small face-like movement and whole-frame exposure changes are rejected',()=>{
 const tracker=createSlashFrameMotion();tracker.update(image(40,40,15,15),128,96,0,0);assert.equal(tracker.update(image(41,40,15,15),128,96,50,1),null);
 const black=image(-1,-1,0,0),white=new Uint8ClampedArray(black.length).fill(255);tracker.reset();tracker.update(black,128,96,0,0);assert.equal(tracker.update(white,128,96,50,1),null);
});

