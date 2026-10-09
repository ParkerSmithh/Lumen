// React Bits GridScan shader supplied by the user; camera/face paths removed.
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {BloomEffect,ChromaticAberrationEffect,EffectComposer,EffectPass,RenderPass} from 'postprocessing';
import './GridScan.css';
const vert = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const frag = `
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec2 uSkew;
uniform float uTilt;
uniform float uYaw;
uniform float uLineThickness;
uniform vec3 uLinesColor;
uniform vec3 uScanColor;
uniform float uGridScale;
uniform float uLineStyle;
uniform float uLineJitter;
uniform float uScanOpacity;
uniform float uScanDirection;
uniform float uNoise;
uniform float uBloomOpacity;
uniform float uScanGlow;
uniform float uScanSoftness;
uniform float uPhaseTaper;
uniform float uScanDuration;
uniform float uScanDelay;
uniform float uLightMode;
varying vec2 vUv;

uniform float uScanStarts[8];
uniform float uScanCount;

const int MAX_SCANS = 8;

float smoother01(float a, float b, float x){
  float t = clamp((x - a) / max(1e-5, (b - a)), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

    vec3 ro = vec3(0.0);
    vec3 rd = normalize(vec3(p, 2.0));

    float cR = cos(uTilt), sR = sin(uTilt);
    rd.xy = mat2(cR, -sR, sR, cR) * rd.xy;

    float cY = cos(uYaw), sY = sin(uYaw);
    rd.xz = mat2(cY, -sY, sY, cY) * rd.xz;

    vec2 skew = clamp(uSkew, vec2(-0.7), vec2(0.7));
    rd.xy += skew * rd.z;

    vec3 color = vec3(0.0);
  float minT = 1e20;
  float gridScale = max(1e-5, uGridScale);
    float fadeStrength = 2.0;
    vec2 gridUV = vec2(0.0);

  float hitIsY = 1.0;
    for (int i = 0; i < 4; i++)
    {
        float isY = float(i < 2);
        float pos = mix(-0.2, 0.2, float(i)) * isY + mix(-0.5, 0.5, float(i - 2)) * (1.0 - isY);
        float num = pos - (isY * ro.y + (1.0 - isY) * ro.x);
        float den = isY * rd.y + (1.0 - isY) * rd.x;
        float t = num / den;
        vec3 h = ro + rd * t;

        float depthBoost = smoothstep(0.0, 3.0, h.z);
        h.xy += skew * 0.15 * depthBoost;

    bool use = t > 0.0 && t < minT;
    gridUV = use ? mix(h.zy, h.xz, isY) / gridScale : gridUV;
    minT = use ? t : minT;
    hitIsY = use ? isY : hitIsY;
    }

    vec3 hit = ro + rd * minT;
    float dist = length(hit - ro);

  float jitterAmt = clamp(uLineJitter, 0.0, 1.0);
  if (jitterAmt > 0.0) {
    vec2 j = vec2(
      sin(gridUV.y * 2.7 + iTime * 1.8),
      cos(gridUV.x * 2.3 - iTime * 1.6)
    ) * (0.15 * jitterAmt);
    gridUV += j;
  }
  float fx = fract(gridUV.x);
  float fy = fract(gridUV.y);
  float ax = min(fx, 1.0 - fx);
  float ay = min(fy, 1.0 - fy);
  float wx = fwidth(gridUV.x);
  float wy = fwidth(gridUV.y);
  float halfPx = max(0.0, uLineThickness) * 0.5;

  float tx = halfPx * wx;
  float ty = halfPx * wy;

  float aax = wx;
  float aay = wy;

  float lineX = 1.0 - smoothstep(tx, tx + aax, ax);
  float lineY = 1.0 - smoothstep(ty, ty + aay, ay);
  if (uLineStyle > 0.5) {
    float dashRepeat = 4.0;
    float dashDuty = 0.5;
    float vy = fract(gridUV.y * dashRepeat);
    float vx = fract(gridUV.x * dashRepeat);
    float dashMaskY = step(vy, dashDuty);
    float dashMaskX = step(vx, dashDuty);
    if (uLineStyle < 1.5) {
      lineX *= dashMaskY;
      lineY *= dashMaskX;
    } else {
      float dotRepeat = 6.0;
      float dotWidth = 0.18;
      float cy = abs(fract(gridUV.y * dotRepeat) - 0.5);
      float cx = abs(fract(gridUV.x * dotRepeat) - 0.5);
      float dotMaskY = 1.0 - smoothstep(dotWidth, dotWidth + fwidth(gridUV.y * dotRepeat), cy);
      float dotMaskX = 1.0 - smoothstep(dotWidth, dotWidth + fwidth(gridUV.x * dotRepeat), cx);
      lineX *= dotMaskY;
      lineY *= dotMaskX;
    }
  }
  float primaryMask = max(lineX, lineY);

  vec2 gridUV2 = (hitIsY > 0.5 ? hit.xz : hit.zy) / gridScale;
  if (jitterAmt > 0.0) {
    vec2 j2 = vec2(
      cos(gridUV2.y * 2.1 - iTime * 1.4),
      sin(gridUV2.x * 2.5 + iTime * 1.7)
    ) * (0.15 * jitterAmt);
    gridUV2 += j2;
  }
  float fx2 = fract(gridUV2.x);
  float fy2 = fract(gridUV2.y);
  float ax2 = min(fx2, 1.0 - fx2);
  float ay2 = min(fy2, 1.0 - fy2);
  float wx2 = fwidth(gridUV2.x);
  float wy2 = fwidth(gridUV2.y);
  float tx2 = halfPx * wx2;
  float ty2 = halfPx * wy2;
  float aax2 = wx2;
  float aay2 = wy2;
  float lineX2 = 1.0 - smoothstep(tx2, tx2 + aax2, ax2);
  float lineY2 = 1.0 - smoothstep(ty2, ty2 + aay2, ay2);
  if (uLineStyle > 0.5) {
    float dashRepeat2 = 4.0;
    float dashDuty2 = 0.5;
    float vy2m = fract(gridUV2.y * dashRepeat2);
    float vx2m = fract(gridUV2.x * dashRepeat2);
    float dashMaskY2 = step(vy2m, dashDuty2);
    float dashMaskX2 = step(vx2m, dashDuty2);
    if (uLineStyle < 1.5) {
      lineX2 *= dashMaskY2;
      lineY2 *= dashMaskX2;
    } else {
      float dotRepeat2 = 6.0;
      float dotWidth2 = 0.18;
      float cy2 = abs(fract(gridUV2.y * dotRepeat2) - 0.5);
      float cx2 = abs(fract(gridUV2.x * dotRepeat2) - 0.5);
      float dotMaskY2 = 1.0 - smoothstep(dotWidth2, dotWidth2 + fwidth(gridUV2.y * dotRepeat2), cy2);
      float dotMaskX2 = 1.0 - smoothstep(dotWidth2, dotWidth2 + fwidth(gridUV2.x * dotRepeat2), cx2);
      lineX2 *= dotMaskY2;
      lineY2 *= dotMaskX2;
    }
  }
    float altMask = max(lineX2, lineY2);

    float edgeDistX = min(abs(hit.x - (-0.5)), abs(hit.x - 0.5));
    float edgeDistY = min(abs(hit.y - (-0.2)), abs(hit.y - 0.2));
    float edgeDist = mix(edgeDistY, edgeDistX, hitIsY);
    float edgeGate = 1.0 - smoothstep(gridScale * 0.5, gridScale * 2.0, edgeDist);
    altMask *= edgeGate;

  float lineMask = max(primaryMask, altMask);

    float fade = exp(-dist * fadeStrength);

    float dur = max(0.05, uScanDuration);
    float del = max(0.0, uScanDelay);
    float scanZMax = 2.0;
    float widthScale = max(0.1, uScanGlow);
    float sigma = max(0.001, 0.18 * widthScale * uScanSoftness);
    float sigmaA = sigma * 2.0;

    float combinedPulse = 0.0;
    float combinedAura = 0.0;

    float cycle = dur + del;
    float tCycle = mod(iTime, cycle);
    float scanPhase = clamp((tCycle - del) / dur, 0.0, 1.0);
    float phase = scanPhase;
    if (uScanDirection > 0.5 && uScanDirection < 1.5) {
      phase = 1.0 - phase;
    } else if (uScanDirection > 1.5) {
      float t2 = mod(max(0.0, iTime - del), 2.0 * dur);
      phase = (t2 < dur) ? (t2 / dur) : (1.0 - (t2 - dur) / dur);
    }
    float scanZ = phase * scanZMax;
    float dz = abs(hit.z - scanZ);
    float lineBand = exp(-0.5 * (dz * dz) / (sigma * sigma));
    float taper = clamp(uPhaseTaper, 0.0, 0.49);
    float headW = taper;
    float tailW = taper;
    float headFade = smoother01(0.0, headW, phase);
    float tailFade = 1.0 - smoother01(1.0 - tailW, 1.0, phase);
    float phaseWindow = headFade * tailFade;
    float pulseBase = lineBand * phaseWindow;
    combinedPulse += pulseBase * clamp(uScanOpacity, 0.0, 1.0);
    float auraBand = exp(-0.5 * (dz * dz) / (sigmaA * sigmaA));
    combinedAura += (auraBand * 0.25) * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);

    for (int i = 0; i < MAX_SCANS; i++) {
      if (float(i) >= uScanCount) break;
      float tActiveI = iTime - uScanStarts[i];
      float phaseI = clamp(tActiveI / dur, 0.0, 1.0);
      if (uScanDirection > 0.5 && uScanDirection < 1.5) {
        phaseI = 1.0 - phaseI;
      } else if (uScanDirection > 1.5) {
        phaseI = (phaseI < 0.5) ? (phaseI * 2.0) : (1.0 - (phaseI - 0.5) * 2.0);
      }
      float scanZI = phaseI * scanZMax;
      float dzI = abs(hit.z - scanZI);
      float lineBandI = exp(-0.5 * (dzI * dzI) / (sigma * sigma));
      float headFadeI = smoother01(0.0, headW, phaseI);
      float tailFadeI = 1.0 - smoother01(1.0 - tailW, 1.0, phaseI);
      float phaseWindowI = headFadeI * tailFadeI;
      combinedPulse += lineBandI * phaseWindowI * clamp(uScanOpacity, 0.0, 1.0);
      float auraBandI = exp(-0.5 * (dzI * dzI) / (sigmaA * sigmaA));
      combinedAura += (auraBandI * 0.25) * phaseWindowI * clamp(uScanOpacity, 0.0, 1.0);
    }

  float lineVis = lineMask;
  vec3 gridCol = uLinesColor * lineVis * fade;
  vec3 scanCol = uScanColor * combinedPulse;
  vec3 scanAura = uScanColor * combinedAura;

    color = gridCol + scanCol + scanAura;

  float n = fract(sin(dot(gl_FragCoord.xy + vec2(iTime * 123.4), vec2(12.9898,78.233))) * 43758.5453123);
  color += (n - 0.5) * uNoise;
  color = clamp(color, 0.0, 1.0);
  float alpha = clamp(max(lineVis, combinedPulse), 0.0, 1.0);
  float gx = 1.0 - smoothstep(tx * 2.0, tx * 2.0 + aax * 2.0, ax);
  float gy = 1.0 - smoothstep(ty * 2.0, ty * 2.0 + aay * 2.0, ay);
  float halo = max(gx, gy) * fade;
  alpha = max(alpha, halo * clamp(uBloomOpacity, 0.0, 1.0));
  if (uLightMode > 0.5) {
    float energy = max(max(color.r, color.g), color.b);
    float coverage = clamp(max(alpha, smoothstep(0.0, 0.55, energy) * 0.82), 0.0, 0.9);
    coverage *= smoothstep(0.015, 0.12, energy);
    vec3 chroma = clamp(color / max(energy, 0.0001), 0.0, 1.0);
    chroma = pow(chroma, vec3(1.2));
    fragColor = vec4(mix(vec3(1.0), chroma, coverage * 0.94), 1.0);
  } else {
    fragColor = vec4(color, alpha);
  }
}

void main(){
  vec4 c;
  mainImage(c, vUv * iResolution.xy);
  gl_FragColor = c;
}
`;


export default function GridScan({sensitivity=.55,lineThickness=1,linesColor='#2F293A',gridScale=.1,scanColor='#FF9FFC',scanOpacity=.4,enablePost=true,bloomIntensity=.6,chromaticAberration=.002,noiseIntensity=.01,lineJitter=.1,scanGlow=.5,scanSoftness=2,echoSession,paused=false}){
 const hostRef=useRef(null),settings=useRef(null);settings.current={paused,echoSession};const [failed,setFailed]=useState(false);
 useEffect(()=>{
  const host=hostRef.current;if(!host)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let canvas,renderer,material,quad,composer,raf,observer,alive=true,last=performance.now(),time=0,painted=false,wasReduced=reduced.matches;
  const look=new THREE.Vector2(),target=new THREE.Vector2(),velocity=new THREE.Vector2();
  const s=THREE.MathUtils.clamp(sensitivity,0,1),skewScale=THREE.MathUtils.lerp(.06,.2,s),smoothTime=THREE.MathUtils.lerp(.45,.12,s),yBoost=THREE.MathUtils.lerp(1.2,1.6,s);
  const dispose=()=>{alive=false;cancelAnimationFrame(raf);observer?.disconnect();window.removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',visibility);renderer?.domElement.removeEventListener('webglcontextlost',lost);try{composer?.dispose();}catch{}material?.dispose();quad?.geometry.dispose();try{renderer?.dispose();renderer?.forceContextLoss();}catch{}canvas?.remove();};
  const lost=e=>{e.preventDefault();dispose();setFailed(true);};
  const move=e=>{if(reduced.matches||settings.current.paused||settings.current.echoSession?.gate.suspended||document.hidden)return;const r=host.getBoundingClientRect();if(r.width&&r.height)target.set(((e.clientX-r.left)/r.width)*2-1,-(((e.clientY-r.top)/r.height)*2-1));};
  const visibility=()=>{last=performance.now();painted=false;};
  try{
   canvas=document.createElement('canvas');host.append(canvas);renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:true,powerPreference:'low-power',depth:false,stencil:false});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.autoClear=false;renderer.setClearColor(0x000000,0);renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);renderer.domElement.addEventListener('webglcontextlost',lost);
   const uniforms={iResolution:{value:new THREE.Vector3()},iTime:{value:0},uSkew:{value:new THREE.Vector2()},uTilt:{value:0},uYaw:{value:0},uLineThickness:{value:lineThickness},uLinesColor:{value:srgbColor(linesColor)},uScanColor:{value:srgbColor(scanColor)},uGridScale:{value:gridScale},uLineStyle:{value:0},uLineJitter:{value:lineJitter},uScanOpacity:{value:scanOpacity},uScanDirection:{value:2},uNoise:{value:noiseIntensity},uBloomOpacity:{value:bloomIntensity},uScanGlow:{value:scanGlow},uScanSoftness:{value:scanSoftness},uPhaseTaper:{value:.9},uScanDuration:{value:2},uScanDelay:{value:2},uLightMode:{value:0},uScanStarts:{value:new Array(8).fill(0)},uScanCount:{value:0}};
   material=new THREE.ShaderMaterial({uniforms,vertexShader:vert,fragmentShader:frag,transparent:true,depthWrite:false,depthTest:false});
   const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);scene.add(quad);
   let chroma;if(enablePost){composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new BloomEffect({intensity:1,luminanceThreshold:0,luminanceSmoothing:0});bloom.blendMode.opacity.value=bloomIntensity;chroma=new ChromaticAberrationEffect({offset:new THREE.Vector2(chromaticAberration,chromaticAberration),radialModulation:true,modulationOffset:0});const pass=new EffectPass(camera,bloom,chroma);pass.renderToScreen=true;composer.addPass(pass);}
   const resize=()=>{if(!alive)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5,1280/w,900/h));renderer.setSize(w,h);uniforms.iResolution.value.set(w,h,renderer.getPixelRatio());composer?.setSize(w,h);painted=false;};
   observer=new ResizeObserver(resize);observer.observe(host);resize();window.addEventListener('pointermove',move,{passive:true});document.addEventListener('visibilitychange',visibility);
   const tick=now=>{if(!alive)return;raf=requestAnimationFrame(tick);const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;if(settings.current.paused||settings.current.echoSession?.gate.suspended||document.hidden)return;
    if(wasReduced!==reduced.matches){painted=false;wasReduced=reduced.matches;}if(reduced.matches&&painted)return;
    if(!reduced.matches){time+=dt;look.copy(smoothDampVec2(look,target,velocity,smoothTime,Infinity,dt));}
    uniforms.iTime.value=reduced.matches?3:time;uniforms.uSkew.value.set(reduced.matches?0:look.x*skewScale,reduced.matches?0:-look.y*yBoost*skewScale);uniforms.uNoise.value=reduced.matches?0:noiseIntensity;uniforms.uLineJitter.value=reduced.matches?0:lineJitter;if(chroma)chroma.offset.setScalar(reduced.matches?0:chromaticAberration);
    renderer.clear(true,true,true);if(composer)composer.render(dt);else renderer.render(scene,camera);painted=true;
   };raf=requestAnimationFrame(tick);
  }catch{dispose();setFailed(true);}
  return dispose;
 },[sensitivity,lineThickness,linesColor,gridScale,scanColor,scanOpacity,enablePost,bloomIntensity,chromaticAberration,noiseIntensity,lineJitter,scanGlow,scanSoftness]);
 return <div ref={hostRef} className={'gridscan'+(failed?' gridscan--fallback':'')} aria-hidden="true"/>;
}
function srgbColor(hex) {
  // Three.js already converts hexadecimal sRGB inputs to linear.
  return new THREE.Color(hex);
}

function smoothDampVec2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime) {
  const out = current.clone();
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

  let change = current.clone().sub(target);
  const originalTo = target.clone();

  const maxChange = maxSpeed * smoothTime;
  if (change.length() > maxChange) change.setLength(maxChange);

  target = current.clone().sub(change);
  const temp = currentVelocity.clone().addScaledVector(change, omega).multiplyScalar(deltaTime);
  currentVelocity.sub(temp.clone().multiplyScalar(omega));
  currentVelocity.multiplyScalar(exp);

  out.copy(target.clone().add(change.add(temp).multiplyScalar(exp)));

  const origMinusCurrent = originalTo.clone().sub(current);
  const outMinusOrig = out.clone().sub(originalTo);
  if (origMinusCurrent.dot(outMinusOrig) > 0) {
    out.copy(originalTo);
    currentVelocity.set(0, 0);
  }
  return out;
}

