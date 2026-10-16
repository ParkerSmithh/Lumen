import {fitContain} from '../tracking/utils.js';
import {createVisualMask} from './glowMask.js';
import {resolveGlowProfile,paletteLight} from './glowProfiles.js';
import {createGlowTargets} from './glowTargets.js';
import {vertex,edge,blur,composite} from './glowShaders.js';
import {createCanvasRenderer} from './glowCanvasRenderer.js';
import {ambientMeter} from './glowExposure.js';

export function createGlowRenderer(canvas){
 let gl;try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});}catch{}
 if(!gl)return createCanvasRenderer(canvas);
 const resources=createGlowTargets(gl),visual=createVisualMask();
 try{
 const edgeProgram=resources.program(vertex,edge),blurProgram=resources.program(vertex,blur),finalProgram=resources.program(vertex,composite);
 const maskTexture=resources.texture(),cameraTexture=resources.texture(),shape=resources.target(),levels=Array.from({length:3},()=>[resources.target(),resources.target()]);
 // Validate framebuffer support during construction so GlowMode's existing mount
 // recovery can select Canvas before the first animation frame.
 for(const target of [shape,...levels.flat()])resources.resize(target,1,1);
 const buffer=resources.buffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const locations=new Map();const loc=(p,n)=>{let map=locations.get(p);if(!map){map=new Map();locations.set(p,map);}if(!map.has(n))map.set(n,gl.getUniformLocation(p,n));return map.get(n);};
 const use=(p,target)=>{gl.useProgram(p);gl.bindFramebuffer(gl.FRAMEBUFFER,target?.framebuffer||null);gl.viewport(0,0,target?.width||canvas.width,target?.height||canvas.height);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const a=gl.getAttribLocation(p,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);};
 const bind=(p,name,texture,unit)=>{gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(loc(p,name),unit);};
 const f=(p,n,v)=>gl.uniform1f(loc(p,n),v);const render=()=>gl.drawArrays(gl.TRIANGLES,0,6);
 let revision=-1,key='',disposed=false,quality='high',slow=0,fast=0,passes=0,updates=0,maskMs=0,drawMs=0,maskBytes=0,lastFrame=0;const exposure=ambientMeter();
 return {
 resize(w,h){if(disposed)return;w=Math.max(1,Math.round(w));h=Math.max(1,Math.round(h));if(canvas.width===w&&canvas.height===h)return;canvas.width=w;canvas.height=h;key='';},
 draw({video,mask,color='#ff354e',opacity=1,energy=1,bodyAura=0,time=performance.now(),reducedMotion=false,intensity='NEON',quality:forcedQuality}){
  if(disposed||gl.isContextLost())return;const start=performance.now(),profile=resolveGlowProfile(intensity,forcedQuality||(reducedMotion?'low':quality));
  const live=video&&(video.readyState===undefined||video.readyState>=2);const maskStart=performance.now();const m=visual.update(mask,time);maskMs=performance.now()-maskStart;
  const r=fitContain(video?.videoWidth||video?.width||mask?.sourceWidth||640,video?.videoHeight||video?.height||mask?.sourceHeight||480,canvas.width,canvas.height);
  if(live){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,cameraTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);}
  if(m){
   const cacheKey=`${m.width}:${m.height}:${profile.bloomSize}:${profile.radius}:${profile.scales}:${r.width}:${r.height}`;
   if(revision!==m.revision||key!==cacheKey){
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,maskTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,m.width,m.height,0,gl.RGBA,gl.UNSIGNED_BYTE,m.data);maskBytes=m.width*m.height*4;
    resources.resize(shape,m.width,m.height);use(edgeProgram,shape);bind(edgeProgram,'source',maskTexture,0);gl.uniform2f(loc(edgeProgram,'stepSize'),Math.max(1/m.width,1.25/r.width),Math.max(1/m.height,1.25/r.height));render();passes++;
    let input=shape;
    for(let i=0;i<3;i++){
     const size=profile.bloomSize/2**i,scale=Math.min(1,size/Math.max(m.width,m.height)),w=Math.max(1,Math.round(m.width*scale)),h=Math.max(1,Math.round(m.height*scale));
     for(const t of levels[i])resources.resize(t,w,h);
     if(i>=profile.scales){use(blurProgram,levels[i][1]);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);continue;}
     const radius=(i===0?2.5:i===1?3:4)*profile.radius;
     use(blurProgram,levels[i][0]);bind(blurProgram,'source',input.texture,0);f(blurProgram,'seed',i===0?1:0);gl.uniform2f(loc(blurProgram,'stepSize'),radius/w,0);render();
     use(blurProgram,levels[i][1]);bind(blurProgram,'source',levels[i][0].texture,0);f(blurProgram,'seed',0);gl.uniform2f(loc(blurProgram,'stepSize'),0,radius/h);render();passes+=2;input=levels[i][1];
    }
    revision=m.revision;key=cacheKey;updates++;
   }
  }else{revision=-1;key='';}
  use(finalProgram);bind(finalProgram,'camera',cameraTexture,0);bind(finalProgram,'silhouette',shape.texture,1);bind(finalProgram,'innerGlow',levels[0][1].texture,2);bind(finalProgram,'midGlow',levels[1][1].texture,3);bind(finalProgram,'outerGlow',levels[2][1].texture,4);
  gl.uniform2f(loc(finalProgram,'resolution'),canvas.width,canvas.height);gl.uniform4f(loc(finalProgram,'rect'),r.x,r.y,r.width,r.height);gl.uniform3fv(loc(finalProgram,'color'),paletteLight(color));
  for(const [n,v] of Object.entries({opacity:m?Math.max(0,Math.min(1,opacity)):0,live:live?1:0,darkness:exposure(live?video:null,mask),rimStrength:profile.rim,bloomStrength:profile.bloom,lighting:profile.lighting,energy,aura:bodyAura,phase:reducedMotion?0:time*.0016}))f(finalProgram,n,v);
  render();drawMs=performance.now()-start;
  // Submission timing is a fallback signal, never a claimed GPU duration.
  const gap=lastFrame?time-lastFrame:0;lastFrame=time;
  slow=drawMs>8||gap>28&&gap<200?slow+1:Math.max(0,slow-1);fast=drawMs<3&&gap<20?fast+1:0;if(slow>30){quality='low';slow=0;}if(fast>600){quality='high';fast=0;}
 },
 resetVisual(){visual.reset();exposure.reset();revision=-1;key='';lastFrame=0;},
 diagnostics(){const stats=resources.stats();return {backend:'webgl',...stats,auxiliaryBytes:stats.targetBytes+maskBytes,visualBytes:visual.stats().bytes,quality,passes,updates,maskMs,drawMs};},
 dispose(){if(disposed)return;disposed=true;visual.dispose();exposure.dispose();maskBytes=0;resources.dispose();}
 };
 }catch(error){visual.dispose();resources.dispose();throw error;}
}
