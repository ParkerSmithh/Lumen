const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
export function pushFeatures(hand){
 const p=hand?.landmarks;if(!p||![0,5,6,7,8,9,12,16,17,20].every(i=>p[i]&&Number.isFinite(p[i].x+p[i].y)))return null;
 const scale=(distance(p[0],p[9])+distance(p[5],p[17]))/2;if(scale<.015)return null;
 const depth=(p[8].z||0)-(p[5].z||0),index=distance(p[0],p[8]),joint=distance(p[0],p[6]);
 const chain=distance(p[5],p[6])+distance(p[6],p[7])+distance(p[7],p[8]);
 const straightness=chain>0?distance(p[5],p[8])/chain:0;
 const extended=index>joint*1.04||distance(p[5],p[8])>distance(p[5],p[6])*1.4;
 const others=[12,16,20].filter(i=>distance(p[0],p[i])<index*.98).length;
 const pointing=extended&&straightness>.65&&(others>=1||depth/scale<-.2);
 return {scale,depth,pointing,straightness,resetPose:!extended&&straightness<.6};
}

export function createPushDetector(){
 let state='ACQUIRING',history=[],baseline=null,lastSequence,lastTime=-Infinity,spawnTime=-Infinity,spawnScale=0,retractTime=null,source=null,acquireStart=null,uncertainSince=null,closedSince=null,forwardStart=null;
 const reset=()=>{state='ACQUIRING';history=[];baseline=null;lastSequence=undefined;lastTime=-Infinity;retractTime=null;source=null;acquireStart=null;uncertainSince=null;closedSince=null;forwardStart=null;};
 const result=(spawn=false,suppressForce=false,f=null)=>({spawn,suppressForce,state,scaleRatio:baseline&&f?f.scale/baseline.scale:1,depthDelta:baseline&&f?f.depth-baseline.depth:0});
 return {reset,update(input,now){
  if(!input?.active||!Number.isFinite(input.timestamp)||now-input.timestamp>250||input.timestamp>now+10){reset();return result();}
  if(input.sequence===lastSequence)return result(false,state==='WAIT_FOR_RETRACTION'&&now-spawnTime<180);
  if(input.reset||input.source!==source||input.timestamp-lastTime>250||input.timestamp<=lastTime){reset();source=input.source;}
  lastTime=input.timestamp;lastSequence=input.sequence;
  const f=input.features;
  if(input.motionRejected)return result(false,true,f);
  if(!f||!Number.isFinite(f.scale+f.depth)||f.scale<=0||!f.pointing){
   uncertainSince??=now;closedSince=f?.resetPose?(closedSince??now):null;
   // Pose uncertainty is not hand loss; a single imperfect sample does not disarm.
   if(now-uncertainSince<160)return result(false,state==='WAIT_FOR_RETRACTION'&&now-spawnTime<180,f);
   if(state==='WAIT_FOR_RETRACTION'&&(closedSince===null||now-spawnTime<450||now-closedSince<200))return result(false,now-spawnTime<180,f);
   state='ACQUIRING';history=[];baseline=null;acquireStart=null;forwardStart=null;return result(false,false,f);
  }
  uncertainSince=null;closedSince=null;
  const prior=history.at(-1);history.push({...f,timestamp:input.timestamp});history=history.filter(h=>input.timestamp-h.timestamp<=650).slice(-32);
  if(state==='ACQUIRING'){
   acquireStart??=input.timestamp;
   const recent=history.slice(-5),scales=recent.map(h=>h.scale).sort((a,b)=>a-b);
   if(scales.at(-1)/scales[0]>1.25)acquireStart=input.timestamp;
   if(recent.length>=3&&input.timestamp-acquireStart>=100){baseline={scale:scales[Math.floor(scales.length/2)],depth:recent.reduce((s,h)=>s+h.depth,0)/recent.length};state='READY';history=[];}
   return result(false,false,f);
  }
  const ratio=f.scale/baseline.scale,depthDelta=f.depth-baseline.depth;
  const recent=history.filter(h=>input.timestamp-h.timestamp<=120),growth=recent.length>1?f.scale/recent[0].scale-1:0;
  if(state==='WAIT_FOR_RETRACTION'){
   // Retraction, not elapsed time, rearms creation. Holding can still move matter.
   if(f.scale<Math.min(spawnScale*.92,baseline.scale*1.1)&&now-spawnTime>=450){
    retractTime??=now;if(now-retractTime>=100){state='READY';history=[];retractTime=null;forwardStart=null;}
   }else retractTime=null;
   return result(false,now-spawnTime<180||growth>.06,f);
  }
  const forward=ratio>=1.14||(ratio>=1.08&&depthDelta<=-.015);
  if(forward){
   forwardStart??=input.timestamp;
   const compound=ratio>=1.2&&depthDelta<=-.025&&(!prior||f.scale/prior.scale>=1.1);
   const sustained=input.timestamp-forwardStart>=60&&history.filter(h=>h.scale>=baseline.scale*1.12).length>=2;
   if(compound||sustained){state='WAIT_FOR_RETRACTION';spawnTime=now;spawnScale=f.scale;retractTime=null;forwardStart=null;return result(true,true,f);}
  }else forwardStart=null;
  return result(false,ratio>1.08&&growth>.04,f);
 }};
}
