// Conservative initial artistic approximation; real-hand tuning remains required.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
export function pushFeatures(hand){
 const p=hand?.landmarks;if(!p||![0,5,6,8,9,12,16,17,20].every(i=>p[i]&&Number.isFinite(p[i].x+p[i].y)))return null;
 const scale=(distance(p[0],p[9])+distance(p[5],p[17]))/2;
 if(scale<.015)return null;
 const depth=((p[8].z||0)-(p[5].z||0));
 const index=distance(p[0],p[8]),joint=distance(p[0],p[6]);
 const others=[12,16,20].filter(i=>distance(p[0],p[i])<index*.9).length;
 const pointing=(index>joint*1.12&&others>=2)||(depth<-.035&&others>=1);
 return {scale,depth,pointing};
}
export function createPushDetector(){
 let state='ACQUIRING',history=[],baseline=null,lastSequence,lastTime=-Infinity,spawnTime=-Infinity,retractTime=null,source=null,acquireStart=null;
 const reset=()=>{state='ACQUIRING';history=[];baseline=null;lastSequence=undefined;lastTime=-Infinity;retractTime=null;source=null;acquireStart=null;};
 const result=(spawn=false,suppressForce=false,features=null)=>({spawn,suppressForce,state,scaleRatio:baseline&&features?features.scale/baseline.scale:1,depthDelta:baseline&&features?features.depth-baseline.depth:0});
 return {reset,update(input,now){
  if(!input?.active||!Number.isFinite(input.timestamp)||now-input.timestamp>250||input.timestamp>now+10){reset();return result();}
  if(input.sequence===lastSequence)return result(false,state==='WAIT_FOR_RETRACTION');
  if(input.reset||input.source!==source||input.timestamp-lastTime>250){reset();source=input.source;}
  lastTime=input.timestamp;lastSequence=input.sequence;
  const f=input.features;
  if(!f||!Number.isFinite(f.scale+f.depth)||!f.pointing){
   // Losing the pointing pose is a reset only after cooldown; it never spawns.
   if(state==='WAIT_FOR_RETRACTION'&&now-spawnTime<600)return result(false,true,f);
   state='ACQUIRING';history=[];baseline=null;acquireStart=null;return result(false,false,f);
  }
  history.push({...f,timestamp:input.timestamp});if(history.length>5)history.shift();
  if(state==='ACQUIRING'){
   acquireStart??=input.timestamp;
   const range=history.map(h=>h.scale);
   if(Math.max(...range)/Math.min(...range)>=1.12)acquireStart=input.timestamp;
   if(history.length>=3&&input.timestamp-acquireStart>=120){
    const scales=history.map(h=>h.scale).sort((a,b)=>a-b);
    if(scales.at(-1)/scales[0]<1.12){baseline={scale:scales[Math.floor(scales.length/2)],depth:history.reduce((s,h)=>s+h.depth,0)/history.length};state='READY';}
   }return result(false,false,f);
  }
  const ratio=f.scale/baseline.scale,depthDelta=f.depth-baseline.depth;
  if(state==='WAIT_FOR_RETRACTION'){
   if(ratio<1.08&&depthDelta>-.02&&now-spawnTime>=600){retractTime??=now;if(now-retractTime>=120){state='READY';history=[];retractTime=null;}}
   else retractTime=null;
   return result(false,true,f);
  }
  const recent=history.filter(h=>input.timestamp-h.timestamp<=250),first=recent[0];
  const forward=(ratio>=1.18&&depthDelta<=-.025)||ratio>=1.28;
  const coherent=first&&f.scale/first.scale>=1.12;
  if(forward&&coherent){state='WAIT_FOR_RETRACTION';spawnTime=now;retractTime=null;return result(true,true,f);}
  // Suppress flick impulses during a developing forward gesture, not just on spawn.
  return result(false,ratio>1.08&&depthDelta<-.01,f);
 }};
}
