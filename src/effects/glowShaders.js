export const vertex=`attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
export const edge=`precision highp float; varying vec2 uv; uniform sampler2D source; uniform vec2 stepSize;
float sampleMask(vec2 p){if(p.x<0.||p.y<0.||p.x>1.||p.y>1.)return 0.;return texture2D(source,p).a;}
void main(){float a=sampleMask(uv),lo=a,hi=a;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){float n=sampleMask(uv+vec2(float(x),float(y))*stepSize);lo=min(lo,n);hi=max(hi,n);}gl_FragColor=vec4(smoothstep(.03,.8,hi-lo),a,0.,1.);}`;
export const blur=`precision highp float; varying vec2 uv; uniform sampler2D source; uniform vec2 stepSize; uniform float seed;
vec2 value(vec2 p){if(p.x<0.||p.y<0.||p.x>1.||p.y>1.)return vec2(0.);vec4 v=texture2D(source,p);return mix(v.rg,vec2(max(v.r,v.g*.24),v.g),seed);}
void main(){vec2 v=value(uv)*.227027;v+=(value(uv+stepSize*1.384615)+value(uv-stepSize*1.384615))*.316216;v+=(value(uv+stepSize*3.230769)+value(uv-stepSize*3.230769))*.070270;gl_FragColor=vec4(v,0.,1.);}`;
export const composite=`precision highp float; varying vec2 uv;
uniform sampler2D camera;uniform sampler2D silhouette;uniform sampler2D innerGlow;uniform sampler2D midGlow;uniform sampler2D outerGlow;
uniform vec2 resolution;uniform vec2 cameraSize;uniform vec4 rect;uniform vec3 color;uniform float opacity;uniform float live;uniform float darkness;uniform float rimStrength;uniform float bloomStrength;uniform float lighting;uniform float energy;uniform float aura;uniform float phase;
uniform vec3 bodyColor;uniform float bodyPower;uniform float bodyFill;uniform float bodyScatter;uniform float bodyDetail;uniform float bodyChroma;
vec3 decode(vec3 v){return mix(v/12.92,pow((v+.055)/1.055,vec3(2.4)),step(vec3(.04045),v));}
vec3 encode(vec3 v){return mix(v*12.92,1.055*pow(max(v,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),v));}
vec3 coveredNeighbor(vec2 p,vec3 original){float a=texture2D(silhouette,p).g;return mix(original,texture2D(camera,p).rgb,a);}
void main(){vec2 pixel=vec2(uv.x,1.-uv.y)*resolution;vec2 p=(pixel-rect.xy)/rect.zw;p.x=1.-p.x;
if(p.x<0.||p.y<0.||p.x>1.||p.y>1.){gl_FragColor=vec4(.02,.016,.027,1.);return;}
vec4 shape=texture2D(silhouette,p);float a=shape.g;float rim=shape.r;vec3 original=texture2D(camera,p).rgb;float lum=dot(original,vec3(.2126,.7152,.0722));
vec3 background=original*(1.-opacity*(.32+darkness*.50));
// Fixed linear-light shadow/midtone lift: no ambient or gameplay gain modulation.
vec3 linear=decode(original);vec3 lifted=.2*linear+.8*pow(linear,vec3(bodyPower));
vec3 lit=encode(lifted+(1.-lifted)*bodyFill*bodyColor);
vec2 d=vec2(8.)/cameraSize;
vec3 local=(coveredNeighbor(p+vec2(d.x,0.),original)+coveredNeighbor(p-vec2(d.x,0.),original)+coveredNeighbor(p+vec2(0.,d.y),original)+coveredNeighbor(p-vec2(0.,d.y),original))*.25;
vec3 detail=original-local;
lit+=detail*bodyDetail*mix(vec3(1.35),vec3(1.),step(vec3(0.),detail));
float tintLuma=dot(bodyColor,vec3(.2126,.7152,.0722));
float tintRange=max(.1,max(max(bodyColor.r,bodyColor.g),bodyColor.b)-min(min(bodyColor.r,bodyColor.g),bodyColor.b));
lit+=(bodyColor-tintLuma)/tintRange*bodyChroma*max(0.,1.-dot(lit,vec3(.2126,.7152,.0722)));
lit=min(lit,vec3(.94))+vec3(.045)*(1.-exp(-max(lit-.94,vec3(0.))/.045));
lit=max(lit,vec3(0.));
// Coverage scatter is cached; current camera luminance gates emission every frame.
float scatter=texture2D(innerGlow,p).g;
lit+=bodyColor*bodyScatter*scatter*(1.-lit)*(.35+.65*(1.-lum));
// Locally bright material keeps its original highlight texture and headroom.
lit=mix(lit,original*.985,smoothstep(.72,.88,max(lum,dot(local,vec3(.2126,.7152,.0722)))));
vec3 scene=mix(background,lit,a*opacity);float inner=texture2D(innerGlow,p).r,mid=texture2D(midGlow,p).r,outer=texture2D(outerGlow,p).r;
float halo=(inner*.72+mid*.85+outer*.72)*(1.-a)*bloomStrength;
float field=aura*(mid*.2+inner*.2)*(.85+.15*sin(pixel.x*.06+pixel.y*.04+phase));
vec3 emission=color*(halo+field)*min(energy,1.5)*opacity;scene=1.-(1.-scene)*exp(-emission);
vec3 core=color*rim*rimStrength*opacity;core+=mix(color,vec3(1.),.55)*pow(rim,3.)*.30*rimStrength*opacity;scene=1.-(1.-scene)*exp(-core);
vec3 preview=1.-exp(-(color*a*.58*opacity+emission+core));gl_FragColor=vec4(mix(preview,scene,live),1.);}`;


