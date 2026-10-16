import {fitContain} from '../tracking/utils.js';
import {createVisualMask} from './glowMask.js';
import {resolveGlowProfile,paletteLight} from './glowProfiles.js';
import {ambientMeter} from './glowExposure.js';
export function createCanvasRenderer(canvas){
 const ctx=canvas.getContext('2d'),visual=createVisualMask(),meter=ambientMeter();
 const make=()=>{const c=document.createElement('canvas');c.width=c.height=1;return c;};
 const coverage=make(),rim=make(),tint=make(),scratch=make(),blooms=[make(),make(),make()];const owned=[coverage,rim,tint,scratch,...blooms];
 let disposed=false,revision=-1,key='',last=-Infinity,updates=0,drawMs=0;
 const size=(c,w,h)=>{if(c.width!==w||c.height!==h){c.width=w;c.height=h;}};
 const paint=(c,input,color)=>{const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.drawImage(input,0,0,c.width,c.height);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,c.width,c.height);x.globalCompositeOperation='source-over';};
 return {
 resize(w,h){if(disposed)return;w=Math.max(1,Math.round(w));h=Math.max(1,Math.round(h));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;key='';}},
 draw({video,mask,color='#ff354e',opacity=1,energy=1,bodyAura=0,time=performance.now(),intensity='NEON',reducedMotion=false,quality='low'}){
  if(disposed)return;const start=performance.now(),m=visual.update(mask,time),profile=resolveGlowProfile(intensity,reducedMotion?'low':quality),live=video&&(video.readyState===undefined||video.readyState>=2);
  const r=fitContain(video?.videoWidth||video?.width||mask?.sourceWidth||640,video?.videoHeight||video?.height||mask?.sourceHeight||480,canvas.width,canvas.height),darkness=meter(live?video:null,mask);
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#050407';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(canvas.width,0);ctx.scale(-1,1);
  if(live){ctx.drawImage(video,r.x,r.y,r.width,r.height);ctx.fillStyle='black';ctx.globalAlpha=(.32+darkness*.5)*opacity*(m?1:0);ctx.fillRect(r.x,r.y,r.width,r.height);ctx.globalAlpha=1;}
  if(m){
   const nextKey=`${m.width}:${m.height}:${color}:${intensity}:${profile.scales}:${profile.radius}`;
   if(key!==nextKey||revision!==m.revision&&time-last>=1000/30){
    size(coverage,m.width,m.height);coverage.getContext('2d').putImageData(new ImageData(m.data,m.width,m.height),0,0);
    size(rim,m.width,m.height);const rc= rim.getContext('2d');rc.clearRect(0,0,m.width,m.height);
    // Eight-neighbor dilation minus erosion, bounded at mask resolution.
    for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)rc.drawImage(coverage,x,y);
    rc.globalCompositeOperation='destination-out';size(scratch,m.width,m.height);const sc=scratch.getContext('2d');sc.clearRect(0,0,m.width,m.height);sc.drawImage(coverage,0,0);sc.globalCompositeOperation='destination-in';for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)sc.drawImage(coverage,x,y);sc.globalCompositeOperation='source-over';rc.drawImage(scratch,0,0);rc.globalCompositeOperation='source-in';rc.fillStyle=color;rc.fillRect(0,0,m.width,m.height);rc.globalCompositeOperation='source-over';
    const rgb=paletteLight(color).map(v=>Math.round(v*255)),neon=`rgb(${rgb.join(',')})`;
    paint(scratch,coverage,neon);const sc2=scratch.getContext('2d');sc2.globalAlpha=.62;sc2.globalCompositeOperation='destination-in';sc2.fillRect(0,0,m.width,m.height);sc2.globalAlpha=1;sc2.globalCompositeOperation='screen';sc2.drawImage(rim,0,0);sc2.globalCompositeOperation='source-over';
    for(let i=0;i<3;i++){const b=blooms[i],scale=Math.min(1,(128/2**i)/Math.max(m.width,m.height));size(b,Math.max(1,Math.round(m.width*scale)),Math.max(1,Math.round(m.height*scale)));const bc=b.getContext('2d');bc.clearRect(0,0,b.width,b.height);if(i>=profile.scales)continue;bc.filter=`blur(${(i===0?2:3)*profile.radius}px)`;bc.drawImage(i===0?scratch:blooms[i-1],0,0,b.width,b.height);bc.filter='none';}
    for(const b of blooms){const bc=b.getContext('2d');bc.globalCompositeOperation='destination-out';bc.globalAlpha=1;bc.drawImage(coverage,0,0,b.width,b.height);bc.globalAlpha=1;bc.globalCompositeOperation='source-over';}
    revision=m.revision;key=nextKey;last=time;updates++;
   }
   // Camera texture multiplied by color and screened through the mask preserves shading.
   size(tint,Math.min(640,Math.max(1,Math.round(r.width))),Math.min(480,Math.max(1,Math.round(r.height))));const t=tint.getContext('2d');t.clearRect(0,0,tint.width,tint.height);
   if(live){t.drawImage(video,0,0,tint.width,tint.height);t.globalCompositeOperation='screen';t.globalAlpha=(.18+darkness*.10)*profile.lighting;t.fillStyle=color;t.fillRect(0,0,tint.width,tint.height);t.globalAlpha=1;}else{t.fillStyle=color;t.fillRect(0,0,tint.width,tint.height);}
   t.globalCompositeOperation='destination-in';t.drawImage(coverage,0,0,tint.width,tint.height);t.globalCompositeOperation='source-over';ctx.globalAlpha=opacity;ctx.drawImage(tint,r.x,r.y,r.width,r.height);
   ctx.globalCompositeOperation='screen';for(let i=2;i>=0;i--){ctx.globalAlpha=Math.min(1,opacity*profile.bloom*(i===0?.72:.8)*Math.min(energy,1.5)/4);for(let repeat=0;repeat<4;repeat++)ctx.drawImage(blooms[i],r.x,r.y,r.width,r.height);}
   ctx.globalAlpha=Math.min(1,opacity*profile.rim*.55);ctx.drawImage(rim,r.x,r.y,r.width,r.height);ctx.globalAlpha=opacity*.55;ctx.drawImage(rim,r.x,r.y,r.width,r.height);
   if(bodyAura){ctx.globalAlpha=opacity*Math.min(.2,bodyAura*.1);ctx.drawImage(blooms[1],r.x,r.y,r.width,r.height);}
  }else{visual.reset();revision=-1;key='';}
  ctx.restore();drawMs=performance.now()-start;
 },
 resetVisual(){visual.reset();meter.reset();revision=-1;key='';},
 diagnostics(){return {backend:'canvas',canvases:disposed?0:owned.length,targetBytes:owned.reduce((n,c)=>n+c.width*c.height*4,0),visualBytes:visual.stats().bytes,updates,drawMs,disposed};},
 dispose(){if(disposed)return;disposed=true;visual.dispose();meter.dispose();for(const c of owned)c.width=c.height=0;}
 };
}





