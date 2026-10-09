import {colors} from '../colors.js';
import {simplifyEchoPoints} from './echoGeometry.js';
const palette=new Set(colors.map(([,hex])=>hex));
const kinds={GLOW:new Set(['presence']),FLOW:new Set(['creation']),SLASH:new Set(['destruction']),LAUNCH:new Set(['force','throw','hit'])};
const bounded=(n,fallback,min,max)=>Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
export function createEchoStore(){
 let epoch=0,records=[];const seen=new Set(),listeners=new Set();
 const notify=()=>{for(const fn of listeners){try{fn();}catch{/* Observers cannot interrupt gameplay. */}}};
 const copy=r=>({...r,points:r.points.map(p=>({...p}))});
 return {get epoch(){return epoch;},append(event,expectedEpoch=epoch){
  if(expectedEpoch!==epoch||!event||!kinds[event.mode]?.has(event.kind)||!palette.has(event.color)||typeof event.id!=='string'||!event.id.length||event.id.length>128)return null;
  const key=event.mode+':'+event.id;if(seen.has(key))return null;
  const points=simplifyEchoPoints(event.points,64);if(!points.length)return null;
  const record={id:event.id,mode:event.mode,kind:event.kind,color:event.color,points,aspect:bounded(event.aspect,1,.25,4),intensity:bounded(event.intensity,.5,0,1),duration:bounded(event.duration,2,.1,3),sequence:records.length?records.at(-1).sequence+1:0};
  records.push(record);seen.add(key);if(seen.size>1024)seen.delete(seen.values().next().value);
  if(records.filter(r=>r.mode===event.mode).length>64)records.splice(records.findIndex(r=>r.mode===event.mode),1);
  if(records.length>256)records.shift();notify();return copy(record);
 },snapshot(){return records.map(copy);},clear(){epoch++;records=[];seen.clear();notify();},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}};
}
