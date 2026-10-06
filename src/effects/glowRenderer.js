import { fitContain, toMaskRGBA } from '../tracking/utils';
const vertex=`attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision highp float;
varying vec2 uv; uniform sampler2D mask; uniform sampler2D camera; uniform vec2 resolution; uniform vec4 rect; uniform vec3 color; uniform float opacity; uniform float live; uniform float darkness;
float body(vec2 p){if(p.x<0.||p.x>1.||p.y<0.||p.y>1.)return 0.;return texture2D(mask,p).a;}
void main(){
 vec2 pixel=vec2(uv.x,1.-uv.y)*resolution;vec2 p=(pixel-rect.xy)/rect.zw;p.x=1.-p.x;
 if(p.x<0.||p.x>1.||p.y<0.||p.y>1.){gl_FragColor=vec4(.02,.016,.027,1.);return;}
 float a=body(p)*opacity;float nearGlow=0.;float bloom=0.;float outer=0.;
 for(int i=0;i<12;i++){float angle=float(i)*6.2831853/12.;vec2 d=vec2(cos(angle),sin(angle));nearGlow+=body(p+d*3./rect.zw);bloom+=body(p+d*12./rect.zw);outer+=body(p+d*28./rect.zw);}
 nearGlow/=12.;bloom/=12.;outer/=12.;vec3 original=texture2D(camera,p).rgb;
 float luminance=dot(original,vec3(.2126,.7152,.0722));
 // In dim rooms, lift the selected color without flattening facial shading.
 vec3 tinted=original*(vec3(.88)+color*.12)+color*(.24+darkness*.30+luminance*(.45+darkness*.35))*(vec3(1.)-original);
 float edge=max(0.,a-nearGlow*opacity);vec3 halo=color*(edge*.55+max(0.,bloom-a)*opacity*.25+max(0.,outer-a)*opacity*.16);
 vec3 background=original*(1.-darkness*.82*opacity);
 halo+=color*darkness*opacity*(edge*1.8+max(0.,nearGlow-body(p))*.85+max(0.,bloom-body(p))*.65+max(0.,outer-body(p))*.35);
 vec3 scene=mix(background,tinted,a)+halo*(vec3(1.)-original);vec3 preview=color*(a*.62+nearGlow*opacity*.25+bloom*opacity*.12);
 gl_FragColor=vec4(mix(preview,scene,live),1.);
}`;
// Sample only background pixels at 5 Hz. Smooth exposure changes to avoid flicker.
function ambientMeter(){
 const sample=document.createElement('canvas');sample.width=24;sample.height=18;
 const ctx=sample.getContext('2d',{willReadFrequently:true});let last=-Infinity,value;
 return (video,mask)=>{
  if(!video||!mask)return 0;
  const now=performance.now();if(now-last<200)return value??0;last=now;
  try{
   ctx.drawImage(video,0,0,24,18);const pixels=ctx.getImageData(0,0,24,18).data;let total=0,count=0;
   for(let y=0;y<18;y++)for(let x=0;x<24;x++){
    const mx=Math.min(mask.width-1,Math.floor((x+.5)*mask.width/24)),my=Math.min(mask.height-1,Math.floor((y+.5)*mask.height/18));
    if(mask.values[my*mask.width+mx]>.2)continue;
    const i=(y*24+x)*4;total+=(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;count++;
   }
   if(count<24)return value??0;
   const u=Math.max(0,Math.min(1,(.24-total/count)/.18)),target=u*u*(3-2*u);
   value=value===undefined?target:value+(target-value)*.25;
  }catch{return value??0;}
  return value;
 };
}
export function createGlowRenderer(canvas){
 let gl;try{gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});}catch{}
 if(!gl)return createCanvasRenderer(canvas);
 const shaders=[],textures=[];
 const compile=(type,source)=>{const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
 const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const texture=(unit,name)=>{const value=gl.createTexture();textures.push(value);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,value);for(const param of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,param,gl.LINEAR);for(const param of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,param,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));gl.uniform1i(gl.getUniformLocation(program,name),unit);return value;};
 const maskTexture=texture(0,'mask'),cameraTexture=texture(1,'camera');
 const uniforms=Object.fromEntries(['resolution','rect','color','opacity','live','darkness'].map(name=>[name,gl.getUniformLocation(program,name)]));let previous;const measure=ambientMeter();
 return {
 resize(w,h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);},
 draw({video,mask,color,opacity}){if(gl.isContextLost())return;const live=video&&(video.readyState===undefined||video.readyState>=2);
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,cameraTexture);if(live)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,maskTexture);if(mask&&mask!==previous){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,mask.width,mask.height,0,gl.RGBA,gl.UNSIGNED_BYTE,toMaskRGBA(mask.values));previous=mask;}
 const r=fitContain(video?.videoWidth||video?.width||mask?.sourceWidth||640,video?.videoHeight||video?.height||mask?.sourceHeight||480,canvas.width,canvas.height);
 gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform4f(uniforms.rect,r.x,r.y,r.width,r.height);gl.uniform3fv(uniforms.color,[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255));gl.uniform1f(uniforms.darkness,measure(live?video:null,mask));gl.uniform1f(uniforms.live,live?1:0);gl.uniform1f(uniforms.opacity,mask?opacity:0);gl.drawArrays(gl.TRIANGLES,0,6);},
 dispose(){textures.forEach(t=>gl.deleteTexture(t));gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));}
 };
}
function createCanvasRenderer(canvas){
 const ctx=canvas.getContext('2d'),layer=document.createElement('canvas'),light=layer.getContext('2d');
 const halo=document.createElement('canvas'),h=halo.getContext('2d');
 const tint=document.createElement('canvas'),t=tint.getContext('2d'),m=document.createElement('canvas');let previous;const measure=ambientMeter();
 return {
 resize(w,h){canvas.width=layer.width=tint.width=halo.width=w;canvas.height=layer.height=tint.height=halo.height=h;},
 draw({video,mask,color,opacity}){ctx.fillStyle='#050407';ctx.fillRect(0,0,canvas.width,canvas.height);const live=video&&(video.readyState===undefined||video.readyState>=2);
 const r=fitContain(video?.videoWidth||video?.width||mask?.sourceWidth||640,video?.videoHeight||video?.height||mask?.sourceHeight||480,canvas.width,canvas.height);const darkness=measure(live?video:null,mask);ctx.save();ctx.translate(canvas.width,0);ctx.scale(-1,1);if(live){ctx.drawImage(video,r.x,r.y,r.width,r.height);ctx.fillStyle='black';ctx.globalAlpha=darkness*.82*opacity;ctx.fillRect(r.x,r.y,r.width,r.height);ctx.globalAlpha=1;}
 if(mask){if(previous!==mask){m.width=mask.width;m.height=mask.height;m.getContext('2d').putImageData(new ImageData(toMaskRGBA(mask.values),mask.width,mask.height),0,0);previous=mask;}
 light.clearRect(0,0,layer.width,layer.height);light.drawImage(m,r.x,r.y,r.width,r.height);light.globalCompositeOperation='source-in';light.fillStyle=color;light.fillRect(0,0,layer.width,layer.height);light.globalCompositeOperation='source-over';
 if(live){t.clearRect(0,0,tint.width,tint.height);t.drawImage(video,r.x,r.y,r.width,r.height);t.globalCompositeOperation='multiply';t.globalAlpha=.3;t.fillStyle=color;t.fillRect(0,0,tint.width,tint.height);t.globalAlpha=1;t.globalCompositeOperation='destination-in';t.drawImage(layer,0,0);t.globalCompositeOperation='source-over';ctx.globalAlpha=opacity*.65;ctx.drawImage(tint,0,0);ctx.globalCompositeOperation='screen';ctx.globalAlpha=opacity*(.28+darkness*.12);ctx.drawImage(layer,0,0);}else{ctx.globalAlpha=opacity*.8;ctx.drawImage(layer,0,0);}
 ctx.globalCompositeOperation='screen';
 for(const [radius,strength] of [[9,.1+darkness*.5],[22,.08+darkness*.25]]){
  if(radius===22&&!live)continue;
  h.clearRect(0,0,halo.width,halo.height);h.filter=`blur(${radius}px)`;h.drawImage(layer,0,0);h.filter='none';
  // Keep bloom outside the person so facial detail does not wash out.
  if(live){h.globalCompositeOperation='destination-out';h.drawImage(layer,0,0);h.globalCompositeOperation='source-over';}
  ctx.globalAlpha=opacity*strength;ctx.drawImage(halo,0,0);
 }}
 ctx.restore();},dispose(){layer.width=layer.height=tint.width=tint.height=halo.width=halo.height=m.width=m.height=0;}
 };
}
