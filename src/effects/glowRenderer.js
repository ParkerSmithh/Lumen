import { fitContain, toMaskRGBA } from '../tracking/utils';

const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
varying vec2 uv; uniform sampler2D mask; uniform vec2 resolution; uniform vec4 rect;
uniform vec3 color; uniform float time; uniform float opacity;
float body(vec2 p){if(p.x<0.||p.x>1.||p.y<0.||p.y>1.)return 0.;return smoothstep(.25,.75,texture2D(mask,p).a);}
void main(){
 vec2 pixel=vec2(uv.x,1.-uv.y)*resolution;
 vec2 p=(pixel-rect.xy)/rect.zw; p.x=1.-p.x;
 float a=body(p);float bloom=0.;float nearGlow=0.;
 for(int i=0;i<16;i++){
  float angle=float(i)*6.2831853/16.;vec2 d=vec2(cos(angle),sin(angle));
  nearGlow+=body(p+d*8./rect.zw);
  bloom+=body(p+d*24./rect.zw)*.65+body(p+d*52./rect.zw)*.35;
 }
 nearGlow/=16.;bloom/=16.;
 float veins=.5+.5*sin(p.y*19.+sin(p.x*13.+time*.18)*2.-time*.32);
 float cloud=.5+.5*sin(p.x*8.-p.y*5.+time*.22);
 float edge=max(0.,a-nearGlow);
 vec3 emission=color*(a*(.30+veins*.30+cloud*.16)+nearGlow*.42+bloom*.38);
 emission+=mix(color,vec3(1.),.66)*(a*pow(veins,7.)*.42+edge*.6);
 float grain=fract(sin(dot(pixel,vec2(12.9898,78.233)))*43758.5453);
 emission+=color*a*step(.991,grain)*.3;
 gl_FragColor=vec4(emission*opacity,1.);
}`;

export function createGlowRenderer(canvas) {
  let gl;
  try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' }); } catch {}
  if (!gl) return createCanvasRenderer(canvas);
  const shaders = [];
  const compile = (type, source) => {
    const shader = gl.createShader(type); shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
  for (const parameter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, parameter, gl.LINEAR);
  for (const parameter of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, parameter, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  const uniforms = Object.fromEntries(['resolution','rect','color','time','opacity'].map(name => [name, gl.getUniformLocation(program, name)]));
  let previous;
  return {
    resize(width, height) { canvas.width = width; canvas.height = height; gl.viewport(0, 0, width, height); },
    draw({ mask, color, time, reducedMotion, opacity }) {
      if (gl.isContextLost()) return;
      if (mask && mask !== previous) {
        const rgba = toMaskRGBA(mask.values);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, mask.width, mask.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba); previous = mask;
      }
      const rect = fitContain(mask?.sourceWidth || 640, mask?.sourceHeight || 480, canvas.width, canvas.height);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform4f(uniforms.rect, rect.x, rect.y, rect.width, rect.height);
      gl.uniform3fv(uniforms.color, rgb(color)); gl.uniform1f(uniforms.time, reducedMotion ? 0 : time / 1000);
      gl.uniform1f(uniforms.opacity, mask ? opacity : 0); gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    dispose() { gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program); shaders.forEach(shader => gl.deleteShader(shader)); },
  };
}
function rgb(hex) { return [1,3,5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); }
function createCanvasRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const layer = document.createElement('canvas'); const light = layer.getContext('2d'); let previous;
  return {
    resize(width, height) { canvas.width = width; canvas.height = height; },
    draw({ mask, color, opacity }) {
      ctx.fillStyle = '#050407'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (!mask) return;
      if (mask !== previous) { layer.width = mask.width; layer.height = mask.height; light.putImageData(new ImageData(toMaskRGBA(mask.values), mask.width, mask.height), 0, 0); previous = mask; }
      light.globalCompositeOperation = 'source-in';
      const gradient = light.createLinearGradient(0, 0, layer.width, layer.height);
      gradient.addColorStop(0, color); gradient.addColorStop(.45, '#fff2ff'); gradient.addColorStop(.65, color); gradient.addColorStop(1, color);
      light.fillStyle = gradient; light.fillRect(0, 0, layer.width, layer.height); light.globalCompositeOperation = 'source-over';
      const r = fitContain(mask.sourceWidth, mask.sourceHeight, canvas.width, canvas.height);
      ctx.save(); ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.globalCompositeOperation = 'screen';
      for (const [blur, alpha] of [[40,.35],[16,.65],[1,.75]]) { ctx.filter = `blur(${blur}px)`; ctx.globalAlpha = alpha * opacity; ctx.drawImage(layer, r.x, r.y, r.width, r.height); }
      ctx.restore();
    }, dispose() { layer.width = layer.height = 0; },
  };
}
