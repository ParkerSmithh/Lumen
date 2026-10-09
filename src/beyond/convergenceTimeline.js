export const CONVERGENCE_DURATION = 20;
export function createConvergenceTimeline(){
 let elapsed=0,last=0,paused=false,started=false;
 const state=()=>({elapsed,stage:elapsed<4?'AWAKEN':elapsed<10?'ATTRACT':elapsed<16?'CONVERGE':'RELEASE',complete:elapsed>=20,paused});
 const tick=now=>{if(started&&!paused&&elapsed<20&&Number.isFinite(now)){const next=Math.max(last,now);elapsed=Math.min(20,elapsed+(next-last)/1000);last=next;}return state();};
 return {start(now){elapsed=0;last=Number.isFinite(now)?now:0;paused=false;started=true;return state();},tick,pause(now){tick(now);paused=true;return state();},resume(now){if(paused){last=Math.max(last,Number.isFinite(now)?now:last);paused=false;}return state();},skip(){elapsed=20;paused=false;return state();}};
}
