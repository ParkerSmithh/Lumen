export const SHAPE_NAMES=['LINE','CIRCLE','WAVE','S-CURVE','SPIRAL'];
export function shapePath(index,rect,w,h){
 const raw=[];const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2,scale=Math.min(rect.width*w,rect.height*h)*.82,sx=scale/w,sy=scale/h;
 for(let i=0;i<=240;i++){const t=i/240;let x,y;switch(index%5){case 0:x=t-.5;y=0;break;case 1:x=.45*Math.cos(-Math.PI/2+t*Math.PI*2);y=.45*Math.sin(-Math.PI/2+t*Math.PI*2);break;case 2:x=t-.5;y=.22*Math.sin(t*Math.PI*2);break;case 3:x=.3*Math.sin(t*Math.PI*2);y=t-.5;break;default:const a=t*Math.PI*4,r=.08+.38*t;x=r*Math.cos(a);y=r*Math.sin(a);}
 raw.push({x:cx+x*sx,y:cy+y*sy});}
 const lengths=[0];for(let i=1;i<raw.length;i++)lengths.push(lengths.at(-1)+Math.hypot((raw[i].x-raw[i-1].x)*w,(raw[i].y-raw[i-1].y)*h));
 const out=[];let j=1;for(let i=0;i<=100;i++){const d=lengths.at(-1)*i/100;while(j<raw.length-1&&lengths[j]<d)j++;const f=(d-lengths[j-1])/(lengths[j]-lengths[j-1]||1);out.push({x:raw[j-1].x+(raw[j].x-raw[j-1].x)*f,y:raw[j-1].y+(raw[j].y-raw[j-1].y)*f});}return out;
}
export function createTraceEvaluator(path,w,h){
 const tolerance=Math.max(18,Math.min(38,Math.min(w,h)*.045));let cursor=0,last=null,sequence=null,complete=false,totalDistance=0,errorDistance=0,travel=0;
 const distance=(a,b)=>Math.hypot((a.x-b.x)*w,(a.y-b.y)*h);const length=path.slice(1).reduce((n,p,i)=>n+distance(p,path[i]),0);
 return {get progress(){return cursor/(path.length-1);},sample(p){let newCompletion=false;
 if(complete)return {complete,accuracy:100*Math.max(0,1-errorDistance/(totalDistance*tolerance||1)),newCompletion};
 if(!p?.active||!Number.isFinite(p.x+p.y+p.timestamp)){last=null;return {complete:false};}
 if(p.sequence===sequence)return {complete:false};sequence=p.sequence;
 const valid=last&&!p.reset&&p.source===last.source&&p.timestamp>last.timestamp&&p.timestamp-last.timestamp<=250&&distance(p,last)<=Math.max(80,Math.min(w,h)*.18);
 const segment=valid?distance(last,p):0;const steps=valid?Math.min(24,Math.max(1,Math.ceil(segment/6))):1;
 for(let k=1;k<=steps;k++){const q=valid?{x:last.x+(p.x-last.x)*k/steps,y:last.y+(p.y-last.y)*k/steps}:p;let best=cursor,dist=Infinity;for(let i=Math.max(0,cursor-2);i<=Math.min(path.length-1,cursor+7);i++){const d=distance(q,path[i]);if(d<dist){dist=d;best=i;}}
 if(valid){const part=segment/steps;totalDistance+=part;errorDistance+=Math.min(tolerance,dist)*part;if(dist<=tolerance)travel+=part;}
 if(dist<=tolerance&&(valid||cursor===0&&best<=3))cursor=Math.max(cursor,best);
 }
 last={...p};if(cursor>=path.length-4&&travel>=length*.75){complete=true;newCompletion=true;}
 return {complete,newCompletion,accuracy:100*Math.max(0,1-errorDistance/(totalDistance*tolerance||1)),progress:cursor/(path.length-1)};
 }};
}
