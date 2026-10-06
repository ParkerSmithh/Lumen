const clamp=value=>Math.max(0,Math.min(1,value));
const finite=point=>point&&Number.isFinite(point.x)&&Number.isFinite(point.y);
const mirror=point=>({x:clamp(1-point.x),y:clamp(point.y)});

// Raw MCP landmarks mirror here once; the shared wrist is already mirrored.
export function handEdge(hand) {
  if(!hand?.handDetected)return null;
  const points=[hand.landmarks?.[5],hand.landmarks?.[9],hand.landmarks?.[17]];
  if(!finite(hand.wrist)||!points.every(finite))return null;
  const [index,middle,pinky]=points.map(mirror),wrist=hand.wrist;
  return {active:true,center:{x:(wrist.x+index.x+middle.x+pinky.x)/4,y:(wrist.y+index.y+middle.y+pinky.y)/4},
    edge:[{...wrist},pinky],aspect:hand.sourceWidth/hand.sourceHeight||1,
    timestamp:hand.timestamp,sequence:hand.sequence,reset:hand.reset,source:'hand'};
}

export function createSlashDetector({minSpeed=.9,minDistance=.06,maxGap=140}={}) {
  let previous=null,candidate=null,lastSequence=null;
  const reset=()=>{previous=null;candidate=null;lastSequence=null;};
  const baseline=sample=>{previous={...sample,raw:sample.center};candidate=null;};
  return {reset,update(input,now){
    const sample=input?.indexFinger?handEdge(input):input;
    if(!sample?.active||!finite(sample.center)||sample.edge?.length!==2||!sample.edge.every(finite)||!Number.isFinite(sample.timestamp)||now-sample.timestamp>250||sample.timestamp>now+10){reset();return null;}
    if(sample.sequence===lastSequence)return null;
    lastSequence=sample.sequence;
    if(!previous||sample.reset||sample.source!==previous.source){baseline(sample);return null;}
    const elapsed=sample.timestamp-previous.timestamp;
    if(elapsed<=0||elapsed>maxGap){baseline(sample);return null;}
    // Coalesce very close pointer events without losing accumulated elapsed time.
    if(elapsed<8)return null;
    const aspect=sample.aspect||1;
    const edgeJump=sample.edge.some((point,i)=>Math.hypot((point.x-previous.edge[i].x)*aspect,point.y-previous.edge[i].y)>.38);
    const edgeLength=Math.hypot((sample.edge[1].x-sample.edge[0].x)*aspect,sample.edge[1].y-sample.edge[0].y);
    if(edgeJump||edgeLength>.5){baseline(sample);return null;}
    const rawDX=(sample.center.x-previous.raw.x)*aspect,rawDY=sample.center.y-previous.raw.y;
    const rawDistance=Math.hypot(rawDX,rawDY),speed=rawDistance/(elapsed/1000);
    if(rawDistance>.3||speed>6){baseline(sample);return null;}
    const alpha=1-Math.exp(-elapsed/25);
    const center={x:previous.center.x+(sample.center.x-previous.center.x)*alpha,y:previous.center.y+(sample.center.y-previous.center.y)*alpha};
    const current={...sample,center,raw:sample.center};
    const distance=Math.hypot((center.x-previous.center.x)*aspect,center.y-previous.center.y);
    const direction=rawDistance>0?{x:rawDX/rawDistance,y:rawDY/rawDistance}:{x:0,y:0};
    const continuing=candidate?.qualified&&sample.timestamp-candidate.lastFast<=90&&speed>=minSpeed*.7;
    if((speed<minSpeed&&!continuing)||distance<.002){previous=current;candidate=null;return null;}
    const consistent=candidate&&direction.x*candidate.direction.x+direction.y*candidate.direction.y>.5;
    if(!consistent||sample.timestamp-candidate.timestamp>180){candidate={start:previous.center,edge:previous.edge,timestamp:previous.timestamp,distance:0,samples:0,direction,qualified:false,lastFast:sample.timestamp};}
    if(speed>=minSpeed)candidate.lastFast=sample.timestamp;
    candidate.distance+=distance;candidate.samples++;
    const duration=sample.timestamp-candidate.timestamp;
    const qualifies=candidate.qualified||(candidate.samples>=2&&candidate.distance>=minDistance&&duration<=180);
    let slash=null;
    if(qualifies){
      slash={start:candidate.qualified?previous.center:candidate.start,end:center,previousEdge:candidate.qualified?previous.edge:candidate.edge,edge:sample.edge,
        direction,speed,distance:candidate.distance,duration,strength:Math.max(.25,Math.min(1,(speed-minSpeed)/(3-minSpeed)+.3)),timestamp:sample.timestamp};
      candidate.qualified=true;
      // Qualified continuation is a new short segment, not a new two-sample gesture.
      candidate.timestamp=previous.timestamp;candidate.distance=distance;
    }
    candidate.direction=direction;previous=current;
    return slash;
  }};
}
