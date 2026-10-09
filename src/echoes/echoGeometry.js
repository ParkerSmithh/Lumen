const quantize=n=>Math.round(Math.max(0,Math.min(1,n))*1024)/1024;
export function simplifyEchoPoints(input,limit=64){
 if(!Array.isArray(input))return [];
 // Bound work even for an invalid/malicious producer.
 const points=input.slice(0,4096).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:quantize(p.x),y:quantize(p.y),...(p.break?{break:true}:{})}));
 const cap=Math.max(2,Math.min(256,Math.floor(limit)||64));
 if(points.length<=cap)return points;
 // Preserve gap endpoints before selecting the remaining points. Never join across a dropped gap.
 const selected=new Set([0,points.length-1]);for(let i=1;i<points.length&&selected.size<cap;i++)if(points[i].break){selected.add(i);if(selected.size<cap)selected.add(i-1);}
 for(let i=1;selected.size<cap&&i<cap;i++)selected.add(Math.round(i*(points.length-1)/(cap-1)));
 const indices=[...selected].sort((a,b)=>a-b);return indices.map((index,j)=>({...points[index],...(j&&points.slice(indices[j-1]+1,index+1).some(p=>p.break)?{break:true}:{})}));
}
export function createEchoPath(limit=256){
 let points=[],last=null,sequence=null;
 return {sample(p){
  if(!p?.active||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.timestamp)){last=null;return;}
  if(p.sequence!==undefined&&p.sequence===sequence)return;sequence=p.sequence;
  const distance=last?Math.hypot(p.x-last.x,p.y-last.y):0;
  const connected=last&&!p.reset&&p.source===last.source&&p.timestamp>last.timestamp&&p.timestamp-last.timestamp<=250&&distance<=.18;
  points.push({x:p.x,y:p.y,...(points.length&&!connected?{break:true}:{})});
  if(points.length>limit)points=simplifyEchoPoints(points,limit);last={x:p.x,y:p.y,source:p.source,timestamp:p.timestamp};
 },points(){return simplifyEchoPoints(points,limit);},clear(){points=[];last=null;sequence=null;}};
}
