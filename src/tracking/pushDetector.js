const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0));
export function pushFeatures(hand){
 const p=hand?.rawLandmarks||hand?.landmarks;if(!p||![0,5,6,7,8,9,12,16,17,20].every(i=>p[i]&&Number.isFinite(p[i].x+p[i].y)))return null;
 const scale=(distance(p[0],p[9])+distance(p[5],p[17]))/2;if(scale<.015)return null;
 const depth=(p[8].z||0)-(p[5].z||0),index=distance(p[0],p[8]),joint=distance(p[0],p[6]);
 const chain=distance(p[5],p[6])+distance(p[6],p[7])+distance(p[7],p[8]);
 const straightness=chain>0?distance(p[5],p[8])/chain:0;
 const extended=index>joint*1.04||distance(p[5],p[8])>distance(p[5],p[6])*1.4;
 const others=[12,16,20].filter(i=>distance(p[0],p[i])<index*.98).length;
 const pointing=extended&&straightness>.65&&(others>=1||depth/scale<-.2);
 return {scale,depth,pointing,straightness,pose:(p[8].y-p[5].y)/scale,anchor:{x:p[0].x,y:p[0].y},resetPose:!extended&&straightness<.6};
}

// Reference-derived rising edges. A small local fall rearms; time alone never does.
export function createPushDetector({fireThreshold=.11,releaseDrop=.07,debounceMs=55}={}){
 let state='ACQUIRING',source=null,lastSequence,lastTime=-Infinity,lastFire=-Infinity,filtered=null,trough=0,peak=0,lastPose=null,lastAnchor=null,releaseSamples=0;
 const reset=()=>{state='ACQUIRING';source=null;lastSequence=undefined;lastTime=-Infinity;filtered=null;lastPose=null;lastAnchor=null;releaseSamples=0;};
 const output=(spawn=false,suppressForce=false,strength=0)=>({spawn,suppressForce,strength,state,forwardSignal:filtered,signalRise:filtered===null?0:filtered-trough,release:filtered===null?0:peak-filtered});
 return {reset,update(input,now){
  if(!input?.active||!Number.isFinite(input.timestamp)||now-input.timestamp>250||input.timestamp>now+10){reset();return output();}
  if(input.sequence===lastSequence)return output(false,now-lastFire<80);
  if(input.motionRejected){lastSequence=input.sequence;lastTime=input.timestamp;return output(false,true);}
  const f=input.features;
  if(!f||!Number.isFinite(f.scale+f.depth)||f.scale<.015){reset();lastSequence=input.sequence;return output(false,true);}
  const dt=input.timestamp-lastTime;
  const anchorJump=f.anchor&&lastAnchor&&Math.hypot(f.anchor.x-lastAnchor.x,f.anchor.y-lastAnchor.y)>.35;
  const explicitReset=input.reset&&!['jump','jump-confirmed','spike'].includes(input.resetReason);
  if(source!==input.source||dt<=0||dt>250||explicitReset||anchorJump)reset();
  const signal=Math.log(f.scale)+Math.max(-.5,Math.min(2,-f.depth/f.scale))*.45;
  if(!Number.isFinite(signal)||filtered!==null&&Math.abs(signal-filtered)>.9){reset();lastSequence=input.sequence;return output(false,true);}
  const baseline=filtered===null,previous=filtered;
  const alpha=baseline?1:1-Math.exp(-Math.max(1,dt)/18);
  filtered=baseline?signal:filtered+(signal-filtered)*alpha;
  const change=baseline?0:filtered-previous,poseChange=f.pose!==undefined&&lastPose!==null?Math.abs(f.pose-lastPose):0;
  source=input.source;lastSequence=input.sequence;lastTime=input.timestamp;lastPose=f.pose??null;lastAnchor=f.anchor??null;
  if(baseline){trough=peak=filtered;state='READY';return output(false,true);}
  if(state==='WAIT_FOR_RETRACTION'){
   peak=Math.max(peak,filtered);
   releaseSamples=peak-filtered>=releaseDrop?releaseSamples+1:0;
   if(releaseSamples>=2){state='READY';trough=filtered;releaseSamples=0;}
   return output(false,now-lastFire<80||Math.abs(change)>.035||poseChange>.2);
  }
  trough=Math.min(trough,filtered);
  const rise=filtered-trough;
  if(f.pointing!==false&&rise>=fireThreshold&&change>.004&&now-lastFire>=debounceMs){
   state='WAIT_FOR_RETRACTION';peak=filtered;lastFire=now;releaseSamples=0;
   return output(true,true,Math.max(.25,Math.min(1,rise/.4+Math.max(0,change)/.3)));
  }
  return output(false,change>.035||poseChange>.2);
 }};
}
