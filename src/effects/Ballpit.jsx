import {isBankBounce} from '../game/launchArcade';
import { RingGeometry, MeshBasicMaterial, Mesh, DoubleSide } from 'three';
import {createKineticTargets} from '../game/kineticTargets';
import { createGrabController } from './grabController';
'use client';

import { useEffect, useRef } from 'react';
import { consumeLaunchInput, localImpulse } from '../tracking/launchInput';
// Exact supplied Ballpit source; LUMEN adaptations isolate input, stability and ownership.
import {
  Vector3 as a,
  MeshPhysicalMaterial as c,
  InstancedMesh as d,
  Timer as e,
  AmbientLight as f,
  SphereGeometry as g,
  ShaderChunk as h,
  Scene as i,
  Color as l,
  Object3D as m,
  SRGBColorSpace as n,
  MathUtils as o,
  PMREMGenerator as p,
  Vector2 as r,
  WebGLRenderer as s,
  PerspectiveCamera as t,
  PointLight as u,
  ACESFilmicToneMapping as v,
  Plane as w,
  Raycaster as y
} from 'three';
import { RoomEnvironment as z } from 'three/examples/jsm/environments/RoomEnvironment.js';

class x {
  #e;
  canvas;
  camera;
  cameraMinAspect;
  cameraMaxAspect;
  cameraFov;
  maxPixelRatio;
  minPixelRatio;
  scene;
  renderer;
  #t;
  size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
  render = this.#i;
  onBeforeRender = () => {};
  onAfterRender = () => {};
  onAfterResize = () => {};
  #s = false;
  #n = false;
  // Bind once: `.bind()` returns a new function on every call, so binding again
  // in the teardown would hand removeEventListener a function that was never
  // registered, leaving the listener attached for the lifetime of the page.
  #boundResize = this.#f.bind(this);
  #boundVisibilityChange = this.#v.bind(this);
  isDisposed = false;
  #o;
  #r;
  #a;
  #c = new e();
  #h = { elapsed: 0, delta: 0 };
  #l;
  constructor(e) {
    this.#e = { ...e };
    try {
      this.#m(); this.#d(); this.#p(); this.resize(); this.#g();
    } catch (error) { this.dispose(); throw error; }
  }
  #m() {
    this.camera = new t();
    this.cameraFov = this.camera.fov;
  }
  #d() {
    this.scene = new i();
  }
  #p() {
    if (this.#e.canvas) {
      this.canvas = this.#e.canvas;
    } else if (this.#e.id) {
      this.canvas = document.getElementById(this.#e.id);
    } else {
      console.error('Three: Missing canvas or id parameter');
    }
    this.canvas.style.display = 'block';
    const e = {
      canvas: this.canvas,
      powerPreference: 'high-performance',
      ...(this.#e.rendererOptions ?? {})
    };
    this.renderer = new s(e);
    this.renderer.outputColorSpace = n;
    this.renderer.debug.onShaderError = () => { throw new Error('Ballpit shader compilation failed'); };
  }
  #g() {
    if (!(this.#e.size instanceof Object)) {
      window.addEventListener('resize', this.#boundResize);
      if (this.#e.size === 'parent' && this.canvas.parentNode) {
        this.#r = new ResizeObserver(this.#f.bind(this));
        this.#r.observe(this.canvas.parentNode);
      }
    }
    this.#o = new IntersectionObserver(this.#u.bind(this), {
      root: null,
      rootMargin: '0px',
      threshold: 0
    });
    this.#o.observe(this.canvas);
    document.addEventListener('visibilitychange', this.#boundVisibilityChange);
  }
  #y() {
    window.removeEventListener('resize', this.#boundResize);
    this.#r?.disconnect();
    this.#o?.disconnect();
    document.removeEventListener('visibilitychange', this.#boundVisibilityChange);
  }
  #u(e) {
    if (this.isDisposed) return;
    this.#s = e[0].isIntersecting;
    this.#s ? this.#w() : this.#z();
  }
  #v() {
    if (this.isDisposed) return;
    if (this.#s) {
      document.hidden ? this.#z() : this.#w();
    }
  }
  #f() {
    if (this.isDisposed) return;
    if (this.#a) clearTimeout(this.#a);
    this.#a = setTimeout(this.resize.bind(this), 100);
  }
  resize() {
    if (this.isDisposed) return;
    let e, t;
    if (this.#e.size instanceof Object) {
      e = this.#e.size.width;
      t = this.#e.size.height;
    } else if (this.#e.size === 'parent' && this.canvas.parentNode) {
      e = this.canvas.parentNode.offsetWidth;
      t = this.canvas.parentNode.offsetHeight;
    } else {
      e = window.innerWidth;
      t = window.innerHeight;
    }
    this.size.width = e;
    this.size.height = t;
    this.size.ratio = e / t;
    this.#x();
    this.#b();
    this.onAfterResize(this.size);
  }
  #x() {
    this.camera.aspect = this.size.width / this.size.height;
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) {
        this.#A(this.cameraMinAspect);
      } else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
        this.#A(this.cameraMaxAspect);
      } else {
        this.camera.fov = this.cameraFov;
      }
    }
    this.camera.updateProjectionMatrix();
    this.updateWorldSize();
  }
  #A(e) {
    const t = Math.tan(o.degToRad(this.cameraFov / 2)) / (this.camera.aspect / e);
    this.camera.fov = 2 * o.radToDeg(Math.atan(t));
  }
  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const e = (this.camera.fov * Math.PI) / 180;
      this.size.wHeight = 2 * Math.tan(e / 2) * this.camera.position.length();
      this.size.wWidth = this.size.wHeight * this.camera.aspect;
    } else if (this.camera.isOrthographicCamera) {
      this.size.wHeight = this.camera.top - this.camera.bottom;
      this.size.wWidth = this.camera.right - this.camera.left;
    }
  }
  #b() {
    this.renderer.setSize(this.size.width, this.size.height);
    this.#t?.setSize(this.size.width, this.size.height);
    let e = Math.min(window.devicePixelRatio || 1, 1.5, 1280 / this.size.width, 900 / this.size.height);
    if (this.maxPixelRatio && e > this.maxPixelRatio) {
      e = this.maxPixelRatio;
    } else if (this.minPixelRatio && e < this.minPixelRatio) {
      e = this.minPixelRatio;
    }
    this.renderer.setPixelRatio(e);
    this.size.pixelRatio = e;
  }
  get postprocessing() {
    return this.#t;
  }
  set postprocessing(e) {
    this.#t = e;
    this.render = e.render.bind(e);
  }
  #w() {
    if (this.#n || this.isDisposed) return;
    const animate = () => {
      this.#l = requestAnimationFrame(animate);
      this.#c.update();
      this.#h.delta = Math.min(this.#c.getDelta(), .033);
      this.#h.elapsed += this.#h.delta;
      try {
        this.onBeforeRender(this.#h); this.render(); this.onAfterRender(this.#h);
      } catch (error) { this.#z(); this.onError?.(error); }
    };
    this.#n = true;
    this.#c.reset();
    animate();
  }
  #z() {
    if (this.#n) {
      cancelAnimationFrame(this.#l);
      this.#n = false;
    }
  }
  #i() {
    this.renderer.render(this.scene, this.camera);
  }
  clear() {
    this.scene?.traverse(e => {
      if (e.isMesh && typeof e.material === 'object' && e.material !== null) {
        Object.keys(e.material).forEach(t => {
          const i = e.material[t];
          if (i !== null && typeof i === 'object' && typeof i.dispose === 'function') {
            i.dispose();
          }
        });
        e.material.dispose();
        e.geometry.dispose();
        e.dispose?.();
        e.environmentTarget?.dispose();
      }
    });
    this.scene?.clear();
  }
  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;
    clearTimeout(this.#a);
    this.#y();
    this.#z();
    this.#c.dispose();
    this.clear();
    this.#t?.dispose();
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.isDisposed = true;
  }
}

const b = new Map(),
  A = new r();
let R = false;
function S(e) {
  const t = {
    position: new r(),
    nPosition: new r(),
    hover: false,
    touching: false,
    onEnter() {},
    onMove() {},
    onClick() {},
    onLeave() {},
    ...e
  };
  (function (e, t) {
    if (!b.has(e)) {
      b.set(e, t);
      if (!R) {
        document.body.addEventListener('pointermove', M);
        document.body.addEventListener('pointerleave', L);
        document.body.addEventListener('click', C);

        document.body.addEventListener('touchstart', TouchStart, { passive: false });
        document.body.addEventListener('touchmove', TouchMove, { passive: false });
        document.body.addEventListener('touchend', TouchEnd, { passive: false });
        document.body.addEventListener('touchcancel', TouchEnd, { passive: false });

        R = true;
      }
    }
  })(e.domElement, t);
  t.dispose = () => {
    const t = e.domElement;
    b.delete(t);
    if (b.size === 0) {
      document.body.removeEventListener('pointermove', M);
      document.body.removeEventListener('pointerleave', L);
      document.body.removeEventListener('click', C);

      document.body.removeEventListener('touchstart', TouchStart);
      document.body.removeEventListener('touchmove', TouchMove);
      document.body.removeEventListener('touchend', TouchEnd);
      document.body.removeEventListener('touchcancel', TouchEnd);

      R = false;
    }
  };
  return t;
}

function M(e) {
  A.x = e.clientX;
  A.y = e.clientY;
  processInteraction();
}

function processInteraction() {
  for (const [elem, t] of b) {
    const i = elem.getBoundingClientRect();
    if (D(i)) {
      P(t, i);
      if (!t.hover) {
        t.hover = true;
        t.onEnter(t);
      }
      t.onMove(t);
    } else if (t.hover && !t.touching) {
      t.hover = false;
      t.onLeave(t);
    }
  }
}

function C(e) {
  A.x = e.clientX;
  A.y = e.clientY;
  for (const [elem, t] of b) {
    const i = elem.getBoundingClientRect();
    P(t, i);
    if (D(i)) t.onClick(t);
  }
}

function L() {
  for (const t of b.values()) {
    if (t.hover) {
      t.hover = false;
      t.onLeave(t);
    }
  }
}

function TouchStart(e) {
  if (e.touches.length > 0) {
    e.preventDefault();
    A.x = e.touches[0].clientX;
    A.y = e.touches[0].clientY;

    for (const [elem, t] of b) {
      const rect = elem.getBoundingClientRect();
      if (D(rect)) {
        t.touching = true;
        P(t, rect);
        if (!t.hover) {
          t.hover = true;
          t.onEnter(t);
        }
        t.onMove(t);
      }
    }
  }
}

function TouchMove(e) {
  if (e.touches.length > 0) {
    e.preventDefault();
    A.x = e.touches[0].clientX;
    A.y = e.touches[0].clientY;

    for (const [elem, t] of b) {
      const rect = elem.getBoundingClientRect();
      P(t, rect);

      if (D(rect)) {
        if (!t.hover) {
          t.hover = true;
          t.touching = true;
          t.onEnter(t);
        }
        t.onMove(t);
      } else if (t.hover && t.touching) {
        t.onMove(t);
      }
    }
  }
}

function TouchEnd() {
  for (const [, t] of b) {
    if (t.touching) {
      t.touching = false;
      if (t.hover) {
        t.hover = false;
        t.onLeave(t);
      }
    }
  }
}

function P(e, t) {
  const { position: i, nPosition: s } = e;
  i.x = A.x - t.left;
  i.y = A.y - t.top;
  s.x = (i.x / t.width) * 2 - 1;
  s.y = (-i.y / t.height) * 2 + 1;
}
function D(e) {
  const { x: t, y: i } = A;
  const { left: s, top: n, width: o, height: r } = e;
  return t >= s && t <= s + o && i >= n && i <= n + r;
}

const { randFloat: k, randFloatSpread: E } = o;
const F = new a();
const I = new a();
const O = new a();
const V = new a();
const B = new a();
const N = new a();
const _ = new a();
const j = new a();
const H = new a();
const T = new a();

class W {
  constructor(e) {
    this.config = e;
    this.positionData = new Float32Array(3 * e.count).fill(0);
    this.velocityData = new Float32Array(3 * e.count).fill(0);
    this.sizeData = new Float32Array(e.count).fill(1);
    this.center = new a();
    this.#R();
    this.setSizes();
  }
  #R() {
    const { config: e, positionData: t } = this;
    this.center.toArray(t, 0);
    for (let i = 1; i < (e.activeCount ?? e.count); i++) {
      const s = 3 * i;
      t[s] = E(2 * e.maxX);
      t[s + 1] = E(2 * e.maxY);
      t[s + 2] = E(2 * e.maxZ);
    }
  }
  setSizes() {
    const { config: e, sizeData: t } = this;
    t[0] = e.size0;
    for (let i = 1; i < e.count; i++) {
      t[i] = k(e.minSize, e.maxSize);
    }
  }
  update(e) {
    const { config: t, center: i, positionData: s, sizeData: n, velocityData: o } = this;
    let r = this.config.followCursor === false ? 1 : 0;
    if (t.controlSphere0) {
      r = 1;
      F.fromArray(s, 0);
      F.lerp(i, 1 - Math.exp(-Math.min(e.delta, .033) * (t.controllerResponse??22))).toArray(s, 0);
      F.fromArray(s, 0);
      V.set(0, 0, 0).toArray(o, 0);
    }
    for (let idx = r; idx < (t.activeCount ?? t.count); idx++) {
      const base = 3 * idx;
      if(this.grabController?.has(idx))continue;
      I.fromArray(s, base);
      B.fromArray(o, base);
      B.y -= e.delta * t.gravity * n[idx];
      B.multiplyScalar(t.friction);
      B.clampLength(0, t.maxVelocity);
      I.add(B);
      I.toArray(s, base);
      B.toArray(o, base);
    }
    for (let idx = r; idx < (t.activeCount ?? t.count); idx++) {
      const base = 3 * idx;
      I.fromArray(s, base);
      B.fromArray(o, base);
      const radius = n[idx];
      for (let jdx = idx + 1; jdx < (t.activeCount ?? t.count); jdx++) {
        if(this.grabController?.has(idx)&&this.grabController?.has(jdx))continue;
        const otherBase = 3 * jdx;
        O.fromArray(s, otherBase);
        N.fromArray(o, otherBase);
        const otherRadius = n[jdx];
        _.copy(O).sub(I);
        let dist = _.length();
        if(dist<1e-6){_.set((idx+jdx)%2?1:-1,0,0);dist=1e-6;}
        const sumRadius = radius + otherRadius;
        if (dist < sumRadius) {
          const overlap = sumRadius - dist;
          j.copy(_)
            .normalize()
            .multiplyScalar(0.5 * overlap);
          H.copy(j).multiplyScalar(Math.max(B.length(), 1));
          T.copy(j).multiplyScalar(Math.max(N.length(), 1));
          const heldI=this.grabController?.has(idx),heldJ=this.grabController?.has(jdx);
          if(!heldI){I.addScaledVector(j,heldJ?-2:-1);B.sub(H);}
          I.toArray(s, base);
          B.toArray(o, base);
          if(!heldJ){O.addScaledVector(j,heldI?2:1);N.add(T);}
          O.toArray(s, otherBase);
          N.toArray(o, otherBase);
        }
      }
      if (t.controlSphere0) {
        _.copy(F).sub(I);
        const dist = _.length();
        const sumRadius0 = radius + n[0];
        if (dist < sumRadius0) {
          const diff = sumRadius0 - dist;
          j.copy(_.normalize()).multiplyScalar(diff);
          H.copy(j).multiplyScalar(Math.max(B.length(), t.controllerForce ?? 2));
          I.sub(j);
          B.sub(H);
        }
      }
      if (Math.abs(I.x) + radius > t.maxX) {
        if(this.onWallBounce&&isBankBounce({previous:this.stepPrevious?.[base+0],position:I.x,velocity:B.x,limit:t.maxX,radius,held:this.grabController?.has(idx)}))this.onWallBounce(idx);
        I.x = Math.sign(I.x) * (t.maxX - radius);
        B.x = -Math.sign(I.x) * Math.abs(B.x) * t.wallBounce;
      }
      if (Math.abs(I.y) + radius > t.maxY) {
        if(this.onWallBounce&&isBankBounce({previous:this.stepPrevious?.[base+1],position:I.y,velocity:B.y,limit:t.maxY,radius,held:this.grabController?.has(idx)}))this.onWallBounce(idx);
        I.y = Math.sign(I.y) * (t.maxY - radius);
        B.y = -Math.sign(I.y) * Math.abs(B.y) * t.wallBounce;
      }
      const maxBoundary = Math.max(t.maxZ, t.maxSize);
      if (Math.abs(I.z) + radius > maxBoundary) {
        if(this.onWallBounce&&isBankBounce({previous:this.stepPrevious?.[base+2],position:I.z,velocity:B.z,limit:maxBoundary,radius,held:this.grabController?.has(idx)}))this.onWallBounce(idx);
        I.z = Math.sign(I.z) * (maxBoundary - radius);
        B.z = -Math.sign(I.z) * Math.abs(B.z) * t.wallBounce;
      }
      I.toArray(s, base);
      B.toArray(o, base);
    }
    for (let idx = 1; idx < (t.activeCount ?? t.count); idx++) {
      B.fromArray(o, idx * 3).clampLength(0, t.maxVelocity).toArray(o, idx * 3);
    }
  }
}

class Y extends c {
  constructor(e) {
    super(e);
    this.uniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2 },
      thicknessScale: { value: 10 }
    };
    this.defines.USE_UV = '';
    this.onBeforeCompile = e => {
      Object.assign(e.uniforms, this.uniforms);
      e.fragmentShader =
        '\n        uniform float thicknessPower;\n        uniform float thicknessScale;\n        uniform float thicknessDistortion;\n        uniform float thicknessAmbient;\n        uniform float thicknessAttenuation;\n      ' +
        e.fragmentShader;
      e.fragmentShader = e.fragmentShader.replace(
        'void main() {',
        '\n        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {\n          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));\n          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;\n          #ifdef USE_COLOR\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor.rgb;\n          #else\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;\n          #endif\n          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;\n        }\n\n        void main() {\n      '
      );
      const t = h.lights_fragment_begin.replaceAll(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
        '\n          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);\n        '
      );
      e.fragmentShader = e.fragmentShader.replace('#include <lights_fragment_begin>', t);
      if (this.onBeforeCompile2) this.onBeforeCompile2(e);
    };
  }
}

// Expose the existing solver for CPU benchmarks without allocating a WebGL renderer.
export { W as BallpitPhysics };

const X = {
  count: 200,
  colors: [0, 0, 0],
  ambientColor: 16777215,
  ambientIntensity: 1,
  lightIntensity: 200,
  materialParams: {
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.15
  },
  minSize: 0.5,
  maxSize: 1,
  size0: 1,
  gravity: 0.5,
  friction: 0.9975,
  wallBounce: 0.95,
  maxVelocity: 0.15,
  maxX: 5,
  maxY: 5,
  maxZ: 2,
  controlSphere0: false,
  followCursor: true
};

const U = new m();

class Z extends d {
  constructor(e, t = {}) {
    const i = { ...X, ...t };
    i.activeCount=i.interactiveCreation?1:i.count;
    const room = new z();
    const generator = new p(e);
    let target;
    try { target = generator.fromScene(room, .04); }
    finally { generator.dispose(); room.dispose(); }
    const n = target.texture;
    const o = new g();
    const r = new Y({ envMap: n, ...i.materialParams });
    r.envMapRotation.x = -Math.PI / 2;
    super(o, r, i.count);
    this.environmentTarget = target;
    this.capacity=i.count;this.count=i.activeCount;this.frustumCulled=false;
    this.config = i;
    this.physics = new W(i);
    this.#S();
    this.setColors(i.colors);
  }
  #S() {
    this.ambientLight = new f(this.config.ambientColor, this.config.ambientIntensity);
    this.add(this.ambientLight);
    this.light = new u(this.config.colors[0], this.config.lightIntensity);
    this.add(this.light);
  }
  get activeCount(){return this.config.activeCount-1;}
  setColors(e) {
    if (Array.isArray(e) && e.length > 1) {
      const t = (function (e) {
        let t, i;
        function setColors(e) {
          t = e;
          i = [];
          t.forEach(col => {
            i.push(new l(col));
          });
        }
        setColors(e);
        return {
          setColors,
          getColorAt: function (ratio, out = new l()) {
            const scaled = Math.max(0, Math.min(1, ratio)) * (t.length - 1);
            const idx = Math.floor(scaled);
            const start = i[idx];
            if (idx >= t.length - 1) return start.clone();
            const alpha = scaled - idx;
            const end = i[idx + 1];
            out.r = start.r + alpha * (end.r - start.r);
            out.g = start.g + alpha * (end.g - start.g);
            out.b = start.b + alpha * (end.b - start.b);
            return out;
          }
        };
      })(e);
      for (let idx = 0; idx < this.capacity; idx++) {
        this.setColorAt(idx, t.getColorAt(idx / this.capacity));
        if (idx === 0) {
          this.light.color.copy(t.getColorAt(idx / this.capacity));
        }
      }
      this.instanceColor.needsUpdate = true;
    }
  }
  update(e) {
    this.physics.update(e);
    this.physics.grabController?.step(this.physics,e.delta);
    for (let idx = 0; idx < this.count; idx++) {
      U.position.fromArray(this.physics.positionData, 3 * idx);
      if (idx === 0 && this.config.followCursor === false) {
        U.scale.setScalar(0);
      } else {
        U.scale.setScalar(this.physics.sizeData[idx]*(this.physics.grabController?.has(idx)?1.04:1));
      }
      U.updateMatrix();
      this.setMatrixAt(idx, U.matrix);
      if (idx === 0) this.light.position.copy(U.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }
}

export function createBallpit(e, t = {}, inputRef = { current: {} }) {
  const i = new x({
    canvas: e,
    size: 'parent',
    rendererOptions: { antialias: true, alpha: true }
  });
  let s;
  let disposed = false;
  i.onError = error => inputRef.current.onFailure?.(error);
  i.renderer.toneMapping = v;
  i.camera.position.set(0, 0, 20);
  i.camera.lookAt(0, 0, 0);
  i.cameraMaxAspect = 1.5;
  i.resize();
  try { initialize({ ...t, maxX: i.size.wWidth / 2, maxY: i.size.wHeight / 2 }); } catch (error) { i.dispose(); throw error; }
  const n = new y();
  const o = new w(new a(0, 0, 1), 0);
  const r = new a();
  let c = false,created=0;

  e.style.touchAction = 'none';
  e.style.userSelect = 'none';
  e.style.webkitUserSelect = 'none';

  const consumed = {};
  const grabController=createGrabController();s.physics.grabController=grabController;let lastGrabSequence=null;
  const lastWorld = new a();
  const direction = new a();
  const radial = new a();
  const position = new a();
  const velocity = new a();
  const ndc = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; } };
  const lost = event => { grabController.release(s.physics);event.preventDefault(); consumed.active = false; s.config.controlSphere0 = false; i.onError(new Error('WebGL context lost')); };
  e.addEventListener('webglcontextlost', lost);
  const visibility = () => { if (document.hidden) { grabController.release(s.physics);consumed.active = false; s.config.controlSphere0 = false; } };
  document.addEventListener('visibilitychange', visibility);
  function applyInput() {
    const raw = inputRef.current.pointerRef?.current;
    const result = consumeLaunchInput(consumed, raw, performance.now());
    if (!consumed.active || document.hidden) { grabController.release(s.physics);lastGrabSequence=null;s.config.controlSphere0 = false; return; }
    const creation=raw.creation&&!raw.creation.consumed?raw.creation:null;
    if(creation&&performance.now()-creation.timestamp>250){creation.consumed=true;return;}
    if(!result&&!creation)return;
    const point=creation||result;
    ndc.set(point.x*2-1,1-point.y*2);
    n.setFromCamera(ndc, i.camera);
    i.camera.getWorldDirection(o.normal);
    if (!n.ray.intersectPlane(o, r) || !Number.isFinite(r.x + r.y + r.z)) { grabController.release(s.physics);consumed.active = false; s.config.controlSphere0 = false; return; }
    s.physics.center.copy(r);
    if(raw.grab?.active){
      if(raw.sequence!==lastGrabSequence){
        if(raw.grab.begin){grabController.begin(r,s.physics,raw.timestamp);for(const slot of grabController.indices)inputRef.current.gameRef?.current?.grabbed?.(slot);}else grabController.move(r,raw.timestamp);
        lastGrabSequence=raw.sequence;
      }
      r.toArray(s.physics.positionData,0);lastWorld.copy(r);s.config.controlSphere0=false;
      if(grabController.count)inputRef.current.onInteraction?.();return;
    }
    if(grabController.count&&!raw.mouseGrab){grabController.move(r,raw.timestamp);grabController.release(s.physics,!!raw.grab?.released);lastGrabSequence=null;r.toArray(s.physics.positionData,0);lastWorld.copy(r);s.config.controlSphere0=false;return;}
    if(raw.mouseGrab){
      if(raw.mouseGrab.begin){grabController.begin(r,s.physics,raw.timestamp);for(const slot of grabController.indices)inputRef.current.gameRef?.current?.grabbed?.(slot);raw.mouseGrab.begin=false;}else if(raw.mouseGrab.released){grabController.move(r,raw.timestamp);grabController.release(s.physics,true);}else grabController.move(r,raw.timestamp);
      const captured=grabController.count;if(raw.mouseGrab.released&&captured)grabController.release(s.physics,true);
      if(captured||(raw.mouseGrab.released&&!creation)){if(creation)creation.consumed=true;lastWorld.copy(r);s.config.controlSphere0=false;return;}
    }
    if(creation){creation.consumed=true;spawn(r,creation.color,creation.strength);inputRef.current.onInteraction?.();}
    if(raw.suppressForce||creation){r.toArray(s.physics.positionData,0);lastWorld.copy(r);s.config.controlSphere0=false;return;}
    if (result.baseline) {
      r.toArray(s.physics.positionData, 0); lastWorld.copy(r);
      s.config.controlSphere0 = false; return;
    }
    s.config.controlSphere0 = true;
    direction.copy(r).sub(lastWorld);
    if (direction.lengthSq() > 0) direction.normalize();
    lastWorld.copy(r);
    if (result.strength <= 0 && result.nudge <= 0) return;
    const radius = Math.max(2.4, s.config.size0 * 2.8);
    let affected = 0;
    for (let idx = 1; idx < s.config.activeCount; idx++) {
      const offset = idx * 3;
      position.fromArray(s.physics.positionData, offset);
      radial.copy(position).sub(r);
      const impulse = localImpulse(Math.hypot(radial.x,radial.y,radial.z*.35), radius, Math.max(result.strength,result.nudge||0)) * (t.reducedMotion ? .5 : 1);
      if (!impulse) continue;
      radial.normalize();
      velocity.fromArray(s.physics.velocityData, offset);
      velocity.addScaledVector(direction, impulse).addScaledVector(radial, impulse * .3);
      velocity.clampLength(0, s.config.maxVelocity).toArray(s.physics.velocityData, offset);
      affected++;
    }
    if (affected) inputRef.current.onInteraction?.();
  }
  function spawn(point,color,strength=.5){
    if(!s.config.interactiveCreation)return false;
    grabController.release(s.physics);
    const max=Math.min(s.capacity-1,s.config.maxActive||150),slot=1+(created++%max),offset=slot*3;
    const radius=s.physics.sizeData[slot];
    const p=new a(Math.max(-s.config.maxX+radius,Math.min(s.config.maxX-radius,point.x)),Math.max(-s.config.maxY+radius,Math.min(s.config.maxY-radius,point.y)),Math.max(-s.config.maxZ+radius,Math.min(s.config.maxZ-radius,point.z)));
    // Modest depth separation avoids exact coincidence for repeated pushes.
    p.z=Math.max(-s.config.maxZ+radius,Math.min(s.config.maxZ-radius,p.z+(slot%3-1)*radius*.6));
    p.toArray(s.physics.positionData,offset);const launchSpeed=Math.min(s.config.maxVelocity,.10+Math.max(0,Math.min(1,strength))*.045)*(t.reducedMotion?.5:1);
    new a(0,launchSpeed*.08,-launchSpeed).clampLength(0,s.config.maxVelocity).toArray(s.physics.velocityData,offset);
    s.setColorAt(slot,new l(color));s.instanceColor.needsUpdate=true;
    inputRef.current.gameRef?.current?.created?.(slot);
    s.config.activeCount=Math.max(s.config.activeCount,slot+1);s.count=s.config.activeCount;
    U.position.copy(p);U.scale.setScalar(radius);U.updateMatrix();s.setMatrixAt(slot,U.matrix);s.instanceMatrix.needsUpdate=true;
    return true;
  }
  function initialize(e) {
    if (s) {
      i.scene.remove(s);
      s.geometry.dispose();s.material.dispose();s.environmentTarget?.dispose();s.dispose?.();
    }
    s = new Z(i.renderer, e);
    if(inputRef.current.gameRef)s.physics.onWallBounce=idx=>inputRef.current.gameRef?.current?.wallBounce?.(idx);
    i.scene.add(s);
  }
  const targets=createKineticTargets({arcade:!!inputRef.current.gameRef,reducedMotion:t.reducedMotion,onHit:event=>{
    const game=inputRef.current.gameRef?.current;if(!game)return;
    position.set(event.x,event.y,event.z).project(i.camera);
    const accepted=game.hit({...event,anchor:{x:(position.x+1)/2,y:(1-position.y)/2}});
    if(accepted){burst=1;burstRadius=event.radius;burstMesh.position.set(event.x,event.y,event.z);targetMesh.visible=false;}
  }});
  const targetMesh=new Mesh(new RingGeometry(.88,1,64),new MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,side:DoubleSide,depthTest:false}));targetMesh.visible=false;i.scene.add(targetMesh);
  const burstMesh=new Mesh(new RingGeometry(.94,1,48),new MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:DoubleSide,depthTest:false}));burstMesh.visible=false;i.scene.add(burstMesh);
  let previous=new Float32Array(s.physics.positionData.length);let lastSession=-1,burst=0,burstRadius=1,simulationTime=0,nextPlacement=0,lastTargetId=null;
  function gameStep(dt){const game=inputRef.current.gameRef?.current;if(!game)return true;
    if(game.session!==lastSession){lastSession=game.session;targets.reset();simulationTime=0;nextPlacement=0;lastTargetId=null;burst=0;burstMesh.visible=false;created=0;grabController.release(s.physics);s.config.activeCount=1;s.count=1;s.physics.positionData.fill(0);s.physics.velocityData.fill(0);consumed.active=false;accumulated=0;}
    const state=game.state();const playing=state.phase==='playing'&&!state.paused;
    if(!playing){targetMesh.visible=false;burstMesh.visible=false;grabController.release(s.physics);consumed.active=false;s.config.controlSphere0=false;return false;}
    burst=Math.max(0,burst-Math.max(0,dt)*3);burstMesh.visible=burst>0;burstMesh.material.opacity=burst*.6;burstMesh.material.color.set(game.color());burstMesh.scale.setScalar(burstRadius*(1+(1-burst)*.4));
    if(!targets.target&&state.elapsed>=nextPlacement){targets.spawn(s.physics,state.progress,game.reach?.(),state.elapsed,simulationTime);nextPlacement=state.elapsed+.25;}
    if(!targets.target){targetMesh.visible=false;return true;}
    const target=targets.target;if(target.id!==lastTargetId){lastTargetId=target.id;if(target.type==='bonus'){position.set(target.x,target.y,target.z).project(i.camera);game.notify?.('BONUS',{x:(position.x+1)/2,y:(1-position.y)/2});}}targetMesh.position.set(target.x,target.y,target.z);targetMesh.scale.setScalar(target.radius);targetMesh.material.color.set(game.color());targetMesh.material.opacity=(target.type==='bonus'?.95:.7)+Math.min(.3,burst);targetMesh.visible=true;return true;
  }
  let accumulated = 0;
  i.onBeforeRender = e => {
    if (c) { accumulated = 0; return; }
    if(!gameStep(e.delta)){accumulated=0;return;}
    applyInput();
    // The supplied solver uses per-step velocities/friction. Keep that solver at 60 Hz.
    accumulated = Math.min(accumulated + Math.max(0, e.delta), .05);
    while (accumulated + 1e-8 >= 1 / 60) {
      if(inputRef.current.gameRef?.current){if(previous.length!==s.physics.positionData.length)previous=new Float32Array(s.physics.positionData.length);previous.set(s.physics.positionData);}
      const game=inputRef.current.gameRef?.current;
      if(game){simulationTime+=1/60;s.physics.stepPrevious=previous;targets.advance(s.physics,game.state().elapsed,simulationTime,1/60);}
      s.update({ delta: 1 / 60, elapsed: e.elapsed });
      if(game)targets.check(s.physics,previous);
      accumulated -= 1 / 60;
    }
    if(inputRef.current.gameRef?.current){const target=targets.target;targetMesh.visible=!!target;if(target){targetMesh.position.set(target.x,target.y,target.z);targetMesh.scale.setScalar(target.radius);}}
  };
  i.onAfterResize = e => {
    s.config.maxX = e.wWidth / 2;
    s.config.maxY = e.wHeight / 2;
    const game=inputRef.current.gameRef?.current;if(game&&targets.target)targets.relocate(s.physics,game.state().progress,game.reach?.(),game.state().elapsed,simulationTime);
  };
  return {
    three: i,
    spawn,
    get target(){return targets.target;},
    get grabbedCount(){return grabController.count;},
    get spheres() {
      return s;
    },
    setCount(e) {
      grabController.release(s.physics);initialize({ ...s.config, count: e });s.physics.grabController=grabController;lastGrabSequence=null;
    },
    updateConfig(newProps) {
      if (newProps.count !== undefined && newProps.count !== s.config.count) {
        grabController.release(s.physics);initialize({ ...s.config, ...newProps });s.physics.grabController=grabController;lastGrabSequence=null;
      } else {
        Object.assign(s.config, newProps);
        if (newProps.colors) {
          s.setColors(s.config.colors);
        }
        if (newProps.minSize !== undefined || newProps.maxSize !== undefined || newProps.size0 !== undefined) {
          s.physics.setSizes();
        }
      }
    },
    togglePause() {
      c = !c;if(c)grabController.release(s.physics);
    },
    dispose() {
      if (disposed) return;
      disposed = true;grabController.release(s.physics);
      e.removeEventListener('webglcontextlost', lost);
      document.removeEventListener('visibilitychange', visibility);
      i.dispose();
    }
  };
}

const Ballpit = ({ className = '', gameRef, pointerRef, onFailure, onInteraction, creationColor, followCursor = false, ...props }) => {
  const hostRef = useRef(null);
  const inputRef = useRef({ gameRef, pointerRef, onFailure, onInteraction, creationColor });
  inputRef.current = { gameRef, pointerRef, onFailure, onInteraction, creationColor };
  useEffect(() => {
    const host = hostRef.current;
    const canvas = document.createElement('canvas');
    canvas.style.width = canvas.style.height = '100%';
    canvas.setAttribute('aria-hidden', 'true');
    host.append(canvas);
    let instance;
    const failure = error => { instance?.dispose(); inputRef.current.onFailure?.('LAUNCH requires WebGL on this device. Try another browser or mode.'); };
    const bridge = { get current() { return { ...inputRef.current, onFailure: failure }; } };
    try { instance = createBallpit(canvas, { followCursor, ...props }, bridge); }
    catch (error) { failure(error); }
    if(import.meta.env.DEV&&new URLSearchParams(location.search).has('debugKinetic'))window.__lumenKinetic={get instance(){return instance;},input:()=>inputRef.current.pointerRef?.current,game:()=>inputRef.current.gameRef?.current?.state()};
    return () => { if(import.meta.env.DEV)delete window.__lumenKinetic;instance?.dispose(); canvas.remove(); };
  }, []);
  return <div className={className} ref={hostRef} style={{ width: '100%', height: '100%' }} />;
};
export default Ballpit;
