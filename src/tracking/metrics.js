export function createTrackingMetrics(limit=120){
 const samples=[];let dropped=0,losses=0,acquisitions=0,detected=false;
 const summary=values=>{const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);return {median:sorted[Math.floor(sorted.length/2)]||0,p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]||0};};
 return {drop(){dropped++;if(detected){losses++;detected=false;}},record(sample){
 if(sample.detected!==undefined){if(detected&&!sample.detected)losses++;if(!detected&&sample.detected)acquisitions++;detected=sample.detected;}
 samples.push(sample);if(samples.length>limit)samples.shift();},report(){
 const intervals=samples.slice(1).map((s,i)=>s.received-samples[i].received),interval=intervals.reduce((a,b)=>a+b,0)/intervals.length,last=samples.at(-1);
 return {samples:samples.length,dropped,losses,acquisitions,reacquisitions:Math.max(0,acquisitions-1),sourceWidth:last?.sourceWidth,sourceHeight:last?.sourceHeight,hz:interval>0?1000/interval:0,captureMs:summary(samples.map(s=>s.captureMs)),inferenceMs:summary(samples.map(s=>s.inferenceMs)),roundTripMs:summary(samples.map(s=>s.received-s.dispatch)),ageMs:summary(samples.map(s=>s.received-s.timestamp))};
 }};
}
