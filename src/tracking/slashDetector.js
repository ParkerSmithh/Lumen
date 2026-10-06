const clamp=value=>Math.max(0,Math.min(1,value));
const finite=point=>point&&Number.isFinite(point.x)&&Number.isFinite(point.y);
const mirror=point=>({x:clamp(1-point.x),y:clamp(point.y)});

// Raw MCP landmarks mirror here once; the shared wrist is already mirrored.
export function handEdge(hand) {
  if(!hand?.handDetected)return null;
  const landmarks=hand.rawLandmarks||hand.landmarks;
  const points=[landmarks?.[5],landmarks?.[9],landmarks?.[17]];
  if(!finite(hand.wrist)||!points.every(finite)){
    if(!finite(hand.palm))return null;
    const v=hand.palmVelocity||hand.velocity||{x:0,y:0},length=Math.hypot(v.x,v.y)||1;
    const normal={x:-v.y/length,y:v.x/length},radius=.045;
    return {active:true,center:hand.palm,edge:[{x:hand.palm.x+normal.x*radius,y:hand.palm.y+normal.y*radius},{x:hand.palm.x-normal.x*radius,y:hand.palm.y-normal.y*radius}],aspect:hand.sourceWidth/hand.sourceHeight||1,timestamp:hand.timestamp,sequence:hand.sequence,reset:hand.reset,source:'hand'};
  }
  const [index,middle,pinky]=points.map(mirror),wrist=finite(hand.rawLandmarks?.[0])?mirror(hand.rawLandmarks[0]):hand.wrist;
  return {active:true,center:{x:(wrist.x+index.x+middle.x+pinky.x)/4,y:(wrist.y+index.y+middle.y+pinky.y)/4},
    edge:[{...wrist},pinky],aspect:hand.sourceWidth/hand.sourceHeight||1,
    timestamp:hand.timestamp,sequence:hand.sequence,reset:hand.reset&&!['jump','jump-confirmed','spike'].includes(hand.resetReason),source:'hand'};
}

export function createSlashDetector({minSpeed=.9,minDistance=.06,maxGap=140}={}) {
  let previous=null,candidate=null,lastSequence=null;
  const reset=()=>{previous=null;candidate=null;lastSequence=null;};
  const blade=(center,direction,aspect)=>{const radius=.065;return [{x:center.x-direction.y*radius/aspect,y:center.y+direction.x*radius},{x:center.x+direction.y*radius/aspect,y:center.y-direction.x*radius}];};
  const baseline=sample=>{previous={...sample,raw:sample.center,edge:sample.source==='hand'?blade(sample.center,{x:1,y:0},sample.aspect||1):sample.edge};candidate=null;};
  return {reset,update(input,now){
    let sample=input?.indexFinger?handEdge(input):input;
    if(!sample?.active||!finite(sample.center)||sample.edge?.length!==2||!sample.edge.every(finite)||!Number.isFinite(sample.timestamp)||now-sample.timestamp>250||sample.timestamp>now+10){reset();return null;}
    if(sample.sequence===lastSequence)return null;
    lastSequence=sample.sequence;
    if(!previous||sample.reset||sample.source!==previous.source){baseline(sample);return null;}
    const elapsed=sample.timestamp-previous.timestamp;
    const camera=sample.source==='camera-motion',robust=sample.source==='hand'||camera,threshold=camera?1.1:robust?.65:minSpeed,travelThreshold=camera?.08:robust?.045:minDistance,window=robust?280:180;
    if(elapsed<=0||elapsed>(robust?220:maxGap)){baseline(sample);return null;}
    // Coalesce very close pointer events without losing accumulated elapsed time.
    if(elapsed<8)return null;
    const aspect=sample.aspect||1;
    const edgeJump=sample.edge.some((point,i)=>Math.hypot((point.x-previous.edge[i].x)*aspect,point.y-previous.edge[i].y)>.38);
    const edgeLength=Math.hypot((sample.edge[1].x-sample.edge[0].x)*aspect,sample.edge[1].y-sample.edge[0].y);
    if(!robust&&(edgeJump||edgeLength>.5)){baseline(sample);return null;}
    const rawDX=(sample.center.x-previous.raw.x)*aspect,rawDY=sample.center.y-previous.raw.y;
    const rawDistance=Math.hypot(rawDX,rawDY),speed=rawDistance/(elapsed/1000);
    if(rawDistance>(robust?.65:.3)||speed>(robust?14:6)){baseline(sample);return null;}
    const alpha=robust?1:1-Math.exp(-elapsed/25);
    const center={x:previous.center.x+(sample.center.x-previous.center.x)*alpha,y:previous.center.y+(sample.center.y-previous.center.y)*alpha};
    let current={...sample,center,raw:sample.center};
    const distance=Math.hypot((center.x-previous.center.x)*aspect,center.y-previous.center.y);
    const direction=rawDistance>0?{x:rawDX/rawDistance,y:rawDY/rawDistance}:{x:0,y:0};
    if(robust){sample={...sample,edge:blade(center,direction,aspect)};current.edge=sample.edge;}
    if(robust&&candidate&&rawDistance<.006&&sample.timestamp-candidate.lastFast<120){previous=current;return null;}
    const continuing=candidate&&(candidate.qualified||robust)&&sample.timestamp-candidate.lastFast<=120&&speed>=threshold*(robust?.4:.7);
    if((speed<threshold&&!continuing)||distance<.002){previous=current;candidate=null;return null;}
    const consistent=candidate&&direction.x*candidate.direction.x+direction.y*candidate.direction.y>(robust?-.2:.5);
    if(!consistent||sample.timestamp-candidate.timestamp>window){candidate={start:previous.center,edge:previous.edge,timestamp:previous.timestamp,distance:0,samples:0,direction,qualified:false,lastFast:sample.timestamp,path:[{center:previous.center,edge:previous.edge}]};}
    if(speed>=threshold)candidate.lastFast=sample.timestamp;
    candidate.distance+=distance;candidate.samples++;candidate.path.push({center,edge:sample.edge});if(candidate.path.length>12)candidate.path.shift();
    const duration=sample.timestamp-candidate.timestamp;
    const qualifies=candidate.qualified||((candidate.samples>=2||robust&&distance>=(camera?.12:.09)&&speed>=threshold*1.15)&&candidate.distance>=travelThreshold&&duration<=window&&(!robust||candidate.distance/(duration/1000)>=threshold*.8));
    let slash=null;
    if(qualifies){
      slash={start:candidate.qualified?previous.center:candidate.start,end:center,previousEdge:candidate.qualified?previous.edge:candidate.edge,edge:sample.edge,
        robust,source:sample.source,path:candidate.qualified?candidate.path.slice(-2):candidate.path.slice(),direction,speed,distance:candidate.distance,duration,strength:Math.max(.25,Math.min(1,(speed-threshold)/(3-threshold)+.3)),timestamp:sample.timestamp};
      candidate.qualified=true;
      // Qualified continuation is a new short segment, not a new two-sample gesture.
      candidate.timestamp=previous.timestamp;candidate.distance=distance;
    }
    candidate.direction=direction;previous=current;
    return slash;
  }};
}
