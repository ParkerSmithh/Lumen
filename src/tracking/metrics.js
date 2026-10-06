export function createTrackingMetrics(limit=120){
 const samples=[];let dropped=0,losses=0,acquisitions=0,detected=false,rejectedSpikes=0;const resets={};
 const summary=values=>{const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);return {median:sorted[Math.floor(sorted.length/2)]||0,p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]||0};};
 const cadence=intervals=>intervals.length?1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length):null;
 return {drop(){dropped++;if(detected){losses++;detected=false;}},record(sample){
 if(sample.detected!==undefined){if(detected&&!sample.detected)losses++;if(!detected&&sample.detected)acquisitions++;detected=sample.detected;}
 if(sample.motionRejected)rejectedSpikes++;else if(sample.resetReason&&sample.resetReason!=='loss')resets[sample.resetReason]=(resets[sample.resetReason]||0)+1;
 samples.push(sample);if(samples.length>limit)samples.shift();},report(){
 const intervals=samples.slice(1).map((s,i)=>s.received-samples[i].received),motionIntervals=samples.slice(1).flatMap((s,i)=>s.moving&&samples[i].moving?[s.received-samples[i].received]:[]),last=samples.at(-1);
 return {samples:samples.length,dropped,losses,acquisitions,reacquisitions:Math.max(0,acquisitions-1),resets:{...resets,loss:losses},rejectedSpikes,sourceWidth:last?.sourceWidth,sourceHeight:last?.sourceHeight,hz:cadence(intervals)||0,motionHz:cadence(motionIntervals),filterLag:summary(samples.map(s=>s.filterLag)),smoothingMs:summary(samples.map(s=>s.smoothingMs)),estimatedFilterDelayMs:summary(samples.filter(s=>s.rawSpeed>.2&&!s.motionRejected).map(s=>s.filterLag/s.rawSpeed*1000)),captureMs:summary(samples.map(s=>s.captureMs)),inferenceMs:summary(samples.map(s=>s.inferenceMs)),roundTripMs:summary(samples.map(s=>s.received-s.dispatch)),ageMs:summary(samples.map(s=>s.received-s.timestamp))};
 }};
}
