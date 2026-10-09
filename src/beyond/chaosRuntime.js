import {colors} from '../colors.js';
const MODES=['GLOW','FLOW','SLASH','LAUNCH'],PALETTE=new Set(colors.map(([,hex])=>hex));
const validPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
const copy=p=>({x:p.x,y:p.y});
const KEY='lumen-chaos-intensity-v1';
const PROFILES=Object.freeze(Object.fromEntries(['CALM','WILD','MAX'].map((name,i)=>[name,Object.freeze({records:[12,32,48][i],sparks:[12,32,48][i],orbiters:[8,24,40][i],trails:[4,10,16][i],trailPoints:[8,12,16][i],particles:[96,256,320][i],fragments:[12,32,48][i],moving:true})])));
const REDUCED=Object.freeze({...PROFILES.CALM,records:8,sparks:0,orbiters:0,trails:0,moving:false});
export function createChaosRuntime({now=()=>performance.now(),storage=()=>globalThis.localStorage,enabled=true}={}){
 let intensity='WILD',suspended=false,version=0,comboHigh=0,presence=null,effects=[],fluid=[];
 const listeners=new Set(),seen=new Set(),visualSeen=new Set(),progress=new Map(),releaseIds=new Set();
 const states=Object.fromEntries(MODES.map(m=>[m,{meter:0,state:'BUILDING',remaining:0,last:null,active:false}]));
 try{const value=storage()?.getItem(KEY);if(PROFILES[value])intensity=value;}catch{}
 const available=t=>enabled&&!suspended&&Number.isFinite(t);
 const accumulating=mode=>states[mode]?.active===true;
 const remember=(set,key)=>{if(set.has(key))return false;set.add(key);if(set.size>512)set.delete(set.values().next().value);return true;};
 const prune=t=>{effects=effects.filter(e=>t-e.born<e.lifetime);};
 const clear=mode=>{effects=mode?effects.filter(e=>e.mode!==mode):[];fluid=mode?fluid.filter(e=>e.mode!==mode):[];presence=null;};
 const add=(mode,value,input,time)=>{const s=states[mode];if(!s||s.state!=='BUILDING')return;s.meter=Math.min(100,s.meter+value);version++;if(s.meter===100){s.meter=0;s.state='SURGE';s.remaining=6000;if(input)api.activity(mode,{...input,type:'surge'},time);}};
 const api={
  preferenceIntensity:()=>intensity,
  setIntensity(value){if(!PROFILES[value])return false;if(value===intensity)return true;intensity=value;try{storage()?.setItem(KEY,value);}catch{}effects=effects.slice(-PROFILES[value].records);for(const fn of listeners)try{fn(value);}catch{}return true;},
  subscribePreference(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  profile(mode,reduced=false){return reduced?REDUCED:PROFILES[intensity];},
  snapshot(mode){const s=states[mode];return s?{meter:s.meter,state:s.state,surge:s.state==='SURGE',version}:{meter:0,state:'BUILDING',surge:false,version};},
  tick(mode,time=now(),active=true){const s=states[mode];if(!s||!Number.isFinite(time))return;if(s.active&&!active)clear(mode);prune(time);const dt=s.last!==null&&s.active&&active&&!suspended&&enabled?Math.max(0,time-s.last):0;s.last=time;s.active=!!active&&!suspended&&enabled;if(s.state!=='BUILDING'&&dt){let remaining=dt;while(s.state!=='BUILDING'&&remaining>=s.remaining){remaining-=s.remaining;if(s.state==='SURGE'){s.state='COOLDOWN';s.remaining=8000;}else{s.state='BUILDING';s.remaining=0;}version++;}if(s.state!=='BUILDING')s.remaining-=remaining;}},
  setSuspended(value){suspended=!!value;clear();for(const s of Object.values(states)){s.last=null;s.active=false;}},
  leave(mode){clear(mode);if(states[mode]){states[mode].last=null;states[mode].active=false;}},
  combo(value){if(value===0)comboHigh=0;},
  replay(mode){if(mode==='SLASH')comboHigh=0;api.leave(mode);if(states[mode])Object.assign(states[mode],{meter:0,state:'BUILDING',remaining:0,last:null,active:false});progress.clear();releaseIds.clear();version++;},
  reset(){for(const mode of MODES)api.replay(mode);seen.clear();visualSeen.clear();clear();},
  flowProgress(shapeId,value,time=now(),input,previousProgress=0){if(!available(time)||!accumulating('FLOW')||typeof shapeId!=='string'||!shapeId||!Number.isFinite(value))return false;const milestone=Math.floor(Math.max(0,Math.min(1,value))*20+1e-7),previous=progress.get(shapeId)??Math.floor(Math.max(0,Math.min(1,previousProgress))*20+1e-7);if(milestone<=previous)return false;progress.set(shapeId,milestone);if(progress.size>64)progress.delete(progress.keys().next().value);add('FLOW',(milestone-previous)*3,input,time);return true;},
  accept(record,details={},time=now()){
   if(!available(time)||!record||!MODES.includes(record.mode)||!accumulating(record.mode)||typeof record.id!=='string'||!record.id||record.id.length>128||!PALETTE.has(record.color)||!Array.isArray(record.points)||!record.points.length||!record.points.every(validPoint))return false;
   const valid={FLOW:['creation'],SLASH:['destruction'],LAUNCH:['hit','force','throw'],GLOW:[]}[record.mode];if(!valid.includes(record.kind)||!remember(seen,record.mode+':'+record.id))return false;
   const mark={point:record.points.at(-1),color:record.color,intensity:record.intensity};
   if(record.mode==='FLOW'){add('FLOW',20,mark,time);if(Number.isFinite(details.chain)&&details.chain>1)api.activity('FLOW',{...mark,type:'vortex',intensity:Math.min(1,details.chain/10)},time);}
   if(record.mode==='SLASH'){const milestone=Number.isFinite(details.combo)?Math.max(0,Math.floor(details.combo/5)):0;const bonus=milestone>comboHigh?Math.min(8,(milestone-comboHigh)*4):0;comboHigh=Math.max(comboHigh,milestone);add('SLASH',8+bonus,mark,time);}
   if(record.mode==='LAUNCH'&&record.kind==='hit')add('LAUNCH',25,mark,time);
   else if(record.mode==='LAUNCH'&&details.meaningful===true&&typeof details.releaseId==='string'&&remember(releaseIds,details.releaseId))add('LAUNCH',15,mark,time);
   api.activity(record.mode,{id:'accepted:'+record.id,type:details.bank?'bankarc':details.bonus?'bonushit':record.kind,point:record.points.at(-1),points:record.points,color:record.color,intensity:record.intensity},time);return true;
  },
  presence(input,time=now()){
   if(!available(time)||!accumulating('GLOW')||!input?.valid||!validPoint(input.center)||!PALETTE.has(input.color)||!Number.isFinite(input.timestamp)||input.timestamp>time||time-input.timestamp>500){presence=null;return false;}
   if(presence&&input.timestamp<=presence.timestamp)return false;
   if(!presence||input.timestamp-presence.timestamp>500){presence={timestamp:input.timestamp,center:copy(input.center),awards:[]};return false;}
   const delta={x:input.center.x-presence.center.x,y:input.center.y-presence.center.y};presence.timestamp=input.timestamp;presence.center=copy(input.center);presence.awards=presence.awards.filter(t=>time-t<1000);
   if(!input.moving||Math.hypot(delta.x,delta.y)<.015||presence.awards.length>=3)return false;
   presence.awards.push(time);add('GLOW',4,{point:input.center,color:input.color},time);api.activity('GLOW',{point:input.center,color:input.color,type:'ribbon',direction:delta,intensity:Math.min(1,Math.hypot(delta.x,delta.y)*5)},time);return true;
  },
  activity(mode,input,time=now()){
   if(!available(time)||!MODES.includes(mode)||!accumulating(mode)||!validPoint(input?.point)||!PALETTE.has(input.color))return false;prune(time);
   if(input.id!==undefined&&(typeof input.id!=='string'||!remember(visualSeen,mode+':'+input.id)))return false;
   const p=PROFILES[intensity],value={mode,type:typeof input.type==='string'?input.type:'spark',point:copy(input.point),color:input.color,intensity:Number.isFinite(input.intensity)?Math.max(0,Math.min(1,input.intensity)):.5,direction:input.direction&&Number.isFinite(input.direction.x)&&Number.isFinite(input.direction.y)?{x:Math.max(-1,Math.min(1,input.direction.x)),y:Math.max(-1,Math.min(1,input.direction.y))}:{x:0,y:-.04},points:Array.isArray(input.points)?input.points.filter(validPoint).slice(-16).map(copy):[],born:time,lifetime:intensity==='CALM'?700:intensity==='MAX'?1800:1200};
   effects.push(value);if(effects.length>p.records)effects.shift();if(mode==='FLOW'&&['creation','pulse','surge'].includes(value.type)){fluid.push({mode,point:copy(value.point),color:value.color,intensity:value.intensity});if(fluid.length>4)fluid.shift();}return true;
  },
  takeFluidCommands(){const result=fluid;fluid=[];return result;},
  counts(){return {effects:effects.length,fluid:fluid.length,accepted:seen.size,visualDedup:visualSeen.size,shapes:progress.size};},
  draw(ctx,w,h,time=now(),mode,reduced=false){
   if(!available(time)||!accumulating(mode)||!ctx||w<=0||h<=0)return;prune(time);const p=api.profile(mode,reduced),surge=states[mode]?.state==='SURGE',level=intensity==='CALM'?1:intensity==='MAX'?3:2;
   let particles=0;const particleCap=mode==='FLOW'?p.orbiters:mode==='GLOW'?p.sparks:Math.min(32,p.records);
   try{ctx.save();let used=0;for(const e of effects){if(e.mode!==mode||used++>=p.records)continue;const age=Math.max(0,(time-e.born)/e.lifetime),x=e.point.x*w,y=e.point.y*h,size=8+e.intensity*18,amp=surge?1.35:1;
    ctx.globalAlpha=(1-age)*(reduced?.12:.18+.035*level);ctx.strokeStyle=e.color;ctx.fillStyle=e.color;ctx.lineWidth=reduced?1:1.1+.25*level;ctx.beginPath();
    if(reduced){ctx.arc(x,y,size,0,Math.PI*2);}
    else if(e.type==='trail'||e.type==='bankarc'){
     if(e.points.length>1){ctx.moveTo(e.points[0].x*w,e.points[0].y*h);for(let i=1;i<e.points.length;i++)ctx.lineTo(e.points[i].x*w,e.points[i].y*h);}
     if(e.type==='bankarc')ctx.arc(x,y,size+age*40,0,Math.PI*2);
    }else if(['hit','creation','bonushit','surge','pulse','resonance'].includes(e.type)){
     const rings=e.type==='surge'||e.type==='bonushit'?level+1:level;for(let i=0;i<rings;i++){const radius=size+age*(35+i*14)*amp+i*7;ctx.moveTo(x+radius,y);ctx.arc(x,y,radius,0,Math.PI*2);}
    }else if(mode==='FLOW'||mode==='GLOW'){
     const dx=e.direction.x*w*age,dy=e.direction.y*h*age;for(let i=0;i<level;i++){const offset=(i-(level-1)/2)*5;ctx.moveTo(x-size,y+size*.3+offset);ctx.quadraticCurveTo(x+dx,y-size+dy+offset,x+size+dx,y+dy+offset);}
     if(mode==='FLOW'&&e.type==='vortex'){for(let i=0;i<level;i++){const radius=size+i*12;ctx.moveTo(x+radius,y);ctx.arc(x,y,radius,age*2,age*2+Math.PI*1.5);}}
    }else{ctx.arc(x,y,size+age*35*amp,0,Math.PI*2);for(let i=0;i<4;i++){const a=i*Math.PI/2+.3;ctx.moveTo(x+Math.cos(a)*size,y+Math.sin(a)*size);ctx.lineTo(x+Math.cos(a)*(size+age*28),y+Math.sin(a)*(size+age*28));}}
    ctx.stroke();
    if(!reduced&&intensity!=='CALM')for(let i=0;i<level+(surge?1:0)&&particles<particleCap;i++,particles++){
     const seed=(used*2.399+i*1.7),a=seed+(mode==='FLOW'?age*3:0),radius=size+(mode==='GLOW'?age*50:age*20)*amp;
     ctx.beginPath();ctx.arc(x+Math.cos(a)*radius,y+Math.sin(a)*radius,mode==='GLOW'?1.5:2,0,Math.PI*2);ctx.fill?.();
    }
   }}catch{}finally{try{ctx.restore();}catch{}}
  }
 };return api;
}
