const clamp=(v,min=0,max=1)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):min;
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1?{x:p.x,y:p.y}:null;
const direction=d=>({x:Number.isFinite(d)?clamp(d,-1,1):clamp(Number.isFinite(d?.x)?d.x:0,-1,1),y:Number.isFinite(d)?0:clamp(Number.isFinite(d?.y)?d.y:0,-1,1)});
const SEEDS=new Float32Array(96);
for(let i=0;i<48;i++){SEEDS[i*2]=i*2.399963;SEEDS[i*2+1]=.75+(i%7)/14;}
export function sanitizeBodySummary(input){
 const center=point(input?.center);if(!center||input?.valid!==true||(!input.ready&&!input.shockwave))return null;
 const wave=input.shockwave&&Number.isFinite(input.shockwave.strength)?{kind:input.shockwave.kind==='burst'?'burst':'wave',direction:direction(input.shockwave.direction),strength:clamp(input.shockwave.strength)}:null;
 return {center,direction:direction(input.direction),scale:clamp(input.scale??1,.88,1.12),displacement:{x:clamp(input.displacement?.x??0,-.04,.04),y:clamp(input.displacement?.y??0,-.04,.04)},reach:Number.isFinite(input.reach)?clamp(input.reach,0,2):null,spread:Number.isFinite(input.spread)?clamp(input.spread,0,4):null,lean:Number.isFinite(input.lean)?clamp(input.lean,-1,1):null,overdrive:input.overdrive?.active===true,shockwave:wave};
}
export const bodyAnchors=anchors=>Array.isArray(anchors)?anchors.map(point).filter(Boolean).slice(0,2):[];
export function drawBodyEffect(ctx,e,w,h,age,profile,{remainingParticles=0,time=0,surge=false}={}){
 const s=e.summary,x=s.center.x*w,y=s.center.y*h,level=profile.records>=48?3:profile.records>=32?2:1;
 const amp=Math.max(surge?1.35:1,s.overdrive?1.5:1),radius=.2*Math.min(w,h)*clamp(s.scale+(s.spread===null?0:Math.max(0,s.spread-1.5)*.06),.88,1.12),moving=profile.moving;
 ctx.globalAlpha=(1-age)*(moving?.14*Math.min(1.35,amp):.09);ctx.strokeStyle=e.color;ctx.fillStyle=e.color;ctx.lineWidth=1+level*.3;ctx.beginPath();
 if(!moving){ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();return 0;}
 if(e.type==='bodywave'){
  for(let i=0;i<level;i++){const r=radius+(age*(80+i*24)+i*9)*amp;ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,Math.PI*2);}ctx.stroke();return 0;
 }
 if(e.type==='bodywake'){
  const points=e.points;for(let ribbon=0;ribbon<level*2;ribbon++){const offset=(ribbon-(level*2-1)/2)*4;for(let i=0;i<points.length;i++){const p=points[i];if(i===0)ctx.moveTo(p.x*w,p.y*h+offset);else ctx.lineTo(p.x*w,p.y*h+offset);}}ctx.stroke();return 0;
 }
 // Distortion stays in this background decoration; no camera pixels are sampled.
 const driftX=clamp(s.displacement.x+(s.lean===null?0:s.lean*.08),-.04,.04)*w,driftY=clamp(s.displacement.y-(s.reach===null?0:Math.max(0,s.reach-.25)*.025),-.04,.04)*h;
 e.bodyPhase=(e.bodyPhase??0)+Math.max(0,Math.min(100,time-(e.lastBodyDraw??time)))*.00035*amp;e.lastBodyDraw=Math.max(time,e.lastBodyDraw??time);const phase=e.bodyPhase;
 for(let i=0;i<level*2;i++){const a=i*Math.PI/(level*2)+phase,r=radius*(1+i*.13);ctx.moveTo(x+Math.cos(a)*r+driftX,y+Math.sin(a)*r+driftY);ctx.arc(x+driftX,y+driftY,r,a,a+Math.PI*.7);}
 ctx.stroke();const count=Math.min(remainingParticles,[12,32,48][level-1]);ctx.beginPath();
 for(let i=0;i<count;i++){const anchor=e.anchors.length?e.anchors[i%e.anchors.length]:s.center,a=SEEDS[i*2]+phase*(1+Math.hypot(s.displacement.x,s.displacement.y)),r=radius*SEEDS[i*2+1]*amp;const px=anchor.x*w+Math.cos(a)*r,py=anchor.y*h+Math.sin(a)*r;ctx.moveTo(px+1.4,py);ctx.arc(px,py,1.4,0,Math.PI*2);}
 if(count)ctx.fill?.();return count;
}
