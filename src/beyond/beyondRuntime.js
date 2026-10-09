import {createChaosRuntime} from './chaosRuntime.js';
import {colors} from '../colors.js';
const modes=['GLOW','FLOW','SLASH','LAUNCH'],palette=new Set(colors.map(([,hex])=>hex));
const validPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
const point=p=>({x:p.x,y:p.y});
export function createBeyondRuntime({enabled=true,now=()=>performance.now(),chaosEnabled=true}={}){
 const chaos=createChaosRuntime({enabled:enabled&&chaosEnabled,now});
 let bits=Object.fromEntries(modes.map(m=>[m,false])),version=0,suspended=false,atmosphere=[],resonance=[],pulseMark=null,fluidPulse=null,presenceBase=null,chainMarked=false;
 const seen=new Set(),listeners=new Set(),cooldowns=new Map(),pulseTimes=new Map();
 const notify=()=>{version++;for(const fn of listeners){try{fn();}catch{}}};
 const activate=m=>{if(!bits[m]){bits[m]=true;notify();}};
 const available=t=>enabled&&!suspended&&Number.isFinite(t);
 const prune=t=>{atmosphere=atmosphere.filter(m=>t-m.born<1800);resonance=resonance.filter(m=>t-m.born<3000);if(pulseMark&&t-pulseMark.born>=3000)pulseMark=null;};
 const addResonance=(mode,p,color,t)=>{if(t-(cooldowns.get(mode)??-Infinity)<(mode==='GLOW'?20000:15000))return;cooldowns.set(mode,t);chaos.activity(mode,{type:'resonance',point:p,color,intensity:.8},t);resonance.push({mode,point:point(p),color,born:t});if(resonance.length>2)resonance.shift();};
 const clearTransient=()=>{atmosphere=[];resonance=[];pulseMark=fluidPulse=presenceBase=null;};
 const api={chaos,
  get stateEnabled(){return enabled;},setEnabled(value){enabled=!!value;if(!enabled)clearTransient();},
  snapshot(){const activated={...bits},count=Object.values(bits).filter(Boolean).length;return {activated,count,complete:count===4,version};},
  subscribe(fn){if(typeof fn==='function')listeners.add(fn);return()=>listeners.delete(fn);},
  reset(){chaos.reset();bits=Object.fromEntries(modes.map(m=>[m,false]));seen.clear();cooldowns.clear();pulseTimes.clear();chainMarked=false;clearTransient();notify();},
  suspend(open){chaos.setSuspended(open);suspended=!!open;clearTransient();},
  combo(value){chaos.combo(value);if(value===0)chainMarked=false;},
  accept(record,details={},time=now()){
   if(!available(time)||!record||!modes.includes(record.mode)||!palette.has(record.color)||typeof record.id!=='string'||!record.id.length||record.id.length>128||!Array.isArray(record.points)||!record.points.length||!record.points.every(validPoint))return false;
   const kind={GLOW:'presence',FLOW:'creation',SLASH:'destruction',LAUNCH:'hit'}[record.mode];if(record.kind!==kind)return false;
   const key=record.mode+':'+record.id;if(seen.has(key))return false;seen.add(key);if(seen.size>512)seen.delete(seen.values().next().value);
   if(record.mode==='GLOW')return false;activate(record.mode);const p=record.points.at(-1);
   api.activity(record.mode,{point:p,color:record.color,intensity:record.intensity},time);
   let earned=record.mode==='FLOW'&&Number.isFinite(details?.accuracy)&&details.accuracy>=95||record.mode==='LAUNCH'&&details?.bank===true;
   if(record.mode==='SLASH'){const combo=details?.combo??record.meta?.combo;if(combo===0)chainMarked=false;if(Number.isFinite(combo)&&combo>=10&&!chainMarked){chainMarked=true;earned=true;}}
   if(earned)addResonance(record.mode,p,record.color,time);return true;
  },
  presence(input,time=now()){
   chaos.presence(input,time);
   if(!available(time)||!input?.valid||!validPoint(input.center)||!palette.has(input.color)||!Number.isFinite(input.timestamp)||input.timestamp>time||time-input.timestamp>500){presenceBase=null;return false;}
   if(presenceBase&&input.timestamp===presenceBase.last)return false;
   if(!presenceBase||input.timestamp-presenceBase.last>500||input.timestamp<presenceBase.last)presenceBase={start:input.timestamp,last:input.timestamp,anchor:point(input.center),samples:0,motionStart:null};
   const b=presenceBase;b.last=input.timestamp;
   if(input.moving&&Math.hypot(input.center.x-b.anchor.x,input.center.y-b.anchor.y)>=.008){b.samples++;b.motionStart??=input.timestamp;}
   api.activity('GLOW',{point:input.center,color:input.color},time);
   if(input.timestamp-b.start>=3000&&b.samples>=3&&input.timestamp-b.motionStart>=1000){activate('GLOW');addResonance('GLOW',input.center,input.color,time);return true;}return false;
  },
  activity(mode,input,time=now()){
   if(!available(time)||!modes.includes(mode)||!validPoint(input?.point)||!palette.has(input.color))return false;prune(time);
   if(mode==='GLOW'){const halo=atmosphere.find(m=>m.mode==='GLOW');if(halo){const alpha=1-Math.exp(-Math.max(0,time-halo.born)/180);halo.point.x+=(input.point.x-halo.point.x)*alpha;halo.point.y+=(input.point.y-halo.point.y)*alpha;halo.color=input.color;halo.born=time;return true;}}
   atmosphere.push({mode,point:point(input.point),color:input.color,intensity:Number.isFinite(input.intensity)?Math.max(0,Math.min(1,input.intensity)):.5,born:time});
   const matching=atmosphere.filter(m=>m.mode===mode);if(matching.length>4)atmosphere.splice(atmosphere.indexOf(matching[0]),1);return true;
  },
  pulse(mode,p,color,time=now()){if(!available(time)||!modes.includes(mode)||!validPoint(p)||!palette.has(color)||time-(pulseTimes.get(mode)??-Infinity)<3000)return false;pulseTimes.set(mode,time);chaos.activity(mode,{type:'pulse',point:p,color,intensity:.7},time);pulseMark={mode,point:point(p),color,born:time};fluidPulse=mode==='FLOW'?{point:point(p),color}:null;return true;},
  takeFluidPulse(){const value=fluidPulse;fluidPulse=null;return value;},
  counts(){return {atmosphere:atmosphere.length,resonance:resonance.length,pulse:pulseMark?1:0,presence:presenceBase?1:0,accepted:seen.size};},
  draw(ctx,w,h,time=now(),mode,reduced=false){
   if(!available(time)||!ctx||!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return;prune(time);
   chaos.draw(ctx,w,h,time,mode,reduced);
   try{ctx.save();for(const m of [...atmosphere,...resonance,...(pulseMark?[pulseMark]:[])]){if(m.mode!==mode)continue;const isPulse=m===pulseMark,isRes=resonance.includes(m),life=isPulse||isRes?3000:1800,age=Math.max(0,(time-m.born)/life);ctx.globalAlpha=(1-age)*(isPulse?.22:isRes?.16:.055);ctx.strokeStyle=m.color;ctx.lineWidth=isPulse?2:1;const x=m.point.x*w,y=m.point.y*h,size=18+(m.intensity??.5)*14,drift=reduced?0:age*12;
ctx.beginPath();
if(!isPulse&&m.mode==='FLOW'){
 ctx.moveTo(x-size,y+6+drift);ctx.quadraticCurveTo(x,y-size*.55+drift,x+size,y-6+drift);
 if(isRes){ctx.moveTo(x-size*.8,y+12);ctx.quadraticCurveTo(x,y-size*.25,x+size*.8,y);}
}else if(!isPulse&&m.mode==='SLASH'){
 for(let i=0;i<3;i++){const angle=i*2.1+.4,dx=Math.cos(angle)*size,dy=Math.sin(angle)*size;ctx.moveTo(x+dx*.25,y+dy*.25);ctx.lineTo(x+dx,y+dy);if(isRes)ctx.lineTo(x+dx+5,y+dy-4);}
}else{
 ctx.arc(x,y,(isPulse?32:isRes?22:m.mode==='LAUNCH'?18:36)+(reduced?0:age*(isPulse?75:20)),0,Math.PI*2);
 if(!isPulse&&m.mode==='LAUNCH'){ctx.moveTo(x+size*.65,y);ctx.arc(x,y,size*.65,0,Math.PI*2);}
}
ctx.stroke();} }catch{}finally{try{ctx.restore();}catch{}}
  }
 };return api;
}



