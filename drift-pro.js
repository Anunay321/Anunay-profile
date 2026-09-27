/**
 * Drift Pro - Advanced Three.js Particle Physics Experience
 * Features:
 * - 14 Procedural Morphing Geometries (Torus, Klein Bottle, Lorenz Attractor, Supernova, etc.)
 * - GPU Shader Morphing with Additive Blending & Gravitational Lensing
 * - Dual Camera Modes: Cinematic Scroll vs Free 3D Orbit Controls
 * - Web Audio Generative Ambient Soundscape
 * - Interactive Scene Gallery Modal
 */

(function () {
  'use strict';

  // ---- 1. SCENE DEFINITIONS & COLOR PALETTES ----
  const scenes = [
    { name: 'Ember',      a: '#ff3fa4', b: '#ffa0d6', hot: 0.35, line: 'It begins as a single spark',      sub: 'A small point of light, waiting for a nudge.', freq: 220 },
    { name: 'Passage',    a: '#19c6ff', b: '#9af5ff', hot: 0.0,  line: 'Then it opens into a passage',     sub: 'Move through it. The particles part around you.', freq: 246.94 },
    { name: 'Vortex',     a: '#8b5cf6', b: '#f0a6ff', hot: 0.0,  line: 'Then it draws you inward',         sub: 'Everything spirals toward one quiet center.', freq: 261.63 },
    { name: 'Black hole', a: '#ff6a1a', b: '#ffe2a8', hot: 1.0,  lens: 1, still: 1, line: 'Past the point of no return', sub: 'Light bends around an empty center. Tap to send a shockwave.', freq: 196 },
    { name: 'Entwine',    a: '#10e6a0', b: '#c4ffe9', hot: 0.0,  line: 'Two threads wind into one',        sub: 'Structure appears where there was only motion.', freq: 293.66 },
    { name: 'Mobius',     a: '#a3e635', b: '#f4ffc4', hot: 0.0,  line: 'One side, one edge, no end',       sub: 'Follow the surface and you return to the start, flipped.', freq: 329.63 },
    { name: 'Knot',       a: '#ffd23f', b: '#fff3b0', hot: 0.0,  line: 'One line that never ends',         sub: 'A single curve looping through itself.', freq: 349.23 },
    { name: 'Torus',      a: '#3b82f6', b: '#bcd7ff', hot: 0.0,  line: 'A ring that holds its shape',      sub: 'Rings and meridians, evenly spaced.', freq: 392 },
    { name: 'Klein',      a: '#e879f9', b: '#ffd9ff', hot: 0.0,  line: 'A bottle with no inside',          sub: 'A surface that passes straight through itself.', freq: 440 },
    { name: 'Lorenz',     a: '#4dd8ff', b: '#b9a6ff', hot: 0.0,  line: 'Order hidden inside chaos',        sub: 'A weather model that never repeats and never escapes.', freq: 493.88 },
    { name: 'Tide',       a: '#ff4d5e', b: '#ffb8a8', hot: 0.0,  line: 'Motion settles into waves',        sub: 'Ripples travel outward and fade.', freq: 523.25 },
    { name: 'Globe',      a: '#2ee6c8', b: '#7c9cff', hot: 0.0,  line: 'A world drawn in lines',           sub: 'Latitude and longitude, one particle at a time.', freq: 587.33 },
    { name: 'Supernova',  a: '#ff3b30', b: '#ffd166', hot: 0.9,  line: 'Then everything lets go',          sub: 'A star\'s last light, thrown outward. Tap to feel it.', freq: 659.25 },
    { name: 'Halo',       a: '#5eb0ff', b: '#ff9de6', hot: 0.0,  line: 'And finally, into orbit',          sub: 'Scroll back up to run the whole sequence again.', freq: 440 }
  ];

  const NS = scenes.length;
  const MAXP = NS - 1;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.matchMedia('(max-width: 700px)').matches;
  const N = isSmall ? 45000 : 100000;
  const TAU = Math.PI * 2;

  function hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  scenes.forEach(s => {
    s.A = hexToRgb(s.a);
    s.B = hexToRgb(s.b);
  });

  // ---- 3. THREE.JS RENDERER & SCENE SETUP ----
  const canvas = document.getElementById('gl');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    document.body.classList.add('nogl');
    return;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);
  camera.position.z = 6.6;
  const halfH = Math.tan(THREE.MathUtils.degToRad(22.5)) * camera.position.z;

  // Math Helpers
  const R = Math.random;
  function tilt(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
  }
  function sph() {
    const u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(Math.max(0, 1 - u * u));
    return [s * Math.cos(a), u, s * Math.sin(a)];
  }
  function P(p, orb, tl) { return [p[0], p[1], p[2], orb || 0, tl || 0]; }
  function T(p, a) { return P(tilt(p, a)); }
  function q(v, n) { return Math.round(v * n) / n; }

  // Lorenz Attractor Numerical ODE cache
  const lor = [];
  let lx = 0.1, ly = 0, lz = 0;
  function advLorenz() {
    const dx = 10 * (ly - lx), dy = lx * (28 - lz) - ly, dz = lx * ly - (8 / 3) * lz;
    lx += dx * 0.006; ly += dy * 0.006; lz += dz * 0.006;
  }
  for (let i = 0; i < 3000; i++) advLorenz();
  for (let i = 0; i < 24000; i++) { advLorenz(); advLorenz(); lor.push([lx, ly, lz]); }

  const DIRS = [];
  for (let i = 0; i < 240; i++) DIRS.push(sph());

  // 14 Procedural Shape Formulations
  const shapes = [
    function ember() {
      const d = sph(), dx = d[0], dy = d[1], dz = d[2];
      const lump = 1 + 0.22 * Math.sin(3.1 * dx + 1.7 * dy) * Math.cos(2.3 * dz + 0.6 * dy) + 0.1 * Math.sin(6 * dy + 4 * dx);
      const r = 1.55 * lump * (0.35 + 0.65 * Math.pow(R(), 0.45));
      return P([dx * r, dy * r * 1.12, dz * r]);
    },
    function passage() {
      const u = R() * 2 - 1, qq = q((u + 1) * 0.5, 64) * 2 - 1, uu = R() < 0.78 ? qq : u, a = R() * TAU;
      const rad = (0.85 + 0.55 * Math.cos(uu * 1.5708)) * (1 + (R() - 0.5) * 0.03);
      return T([uu * 2.35, Math.cos(a) * rad * 0.9, Math.sin(a) * rad], 0.25);
    },
    function vortex() {
      const t = Math.pow(R(), 0.85), arm = Math.floor(R() * 3);
      const ang = t * 11 + arm * TAU / 3 + (R() - 0.5) * 0.22;
      const r = 0.12 + 2.4 * Math.pow(1 - t, 1.5) + (R() - 0.5) * 0.12;
      return P([Math.cos(ang) * r, (0.5 - t) * 4.3 + (R() - 0.5) * 0.1, Math.sin(ang) * r]);
    },
    function blackhole() {
      const qq = R();
      if (qq < 0.70) {
        const r = 1.18 + Math.pow(R(), 1.7) * 2.15, a = R() * TAU;
        return P([Math.cos(a) * r, (R() - 0.5) * 0.05 * r, Math.sin(a) * r], 1.3, 0.42);
      }
      if (qq < 0.85) {
        const a = R() * TAU, rr = 1.06 + (R() - 0.5) * 0.07 + Math.pow(R(), 4) * 0.18;
        return P([Math.cos(a) * rr, Math.sin(a) * rr, (R() - 0.5) * 0.06]);
      }
      const a = (R() < 0.5 ? 1 : -1) * Math.PI / 2 + (R() - 0.5) * 2.4, r2 = 1.16 + R() * 0.5;
      return P([Math.cos(a) * r2, Math.sin(a) * r2 * 1.05, (R() - 0.5) * 0.1]);
    },
    function entwine() {
      const rr = 0.95;
      if (R() < 0.86) {
        const t = R() * 2 - 1, a = t * TAU * 1.6 + (R() < 0.5 ? 0 : Math.PI);
        return P([Math.cos(a) * rr + (R() - 0.5) * 0.06, t * 2.3, Math.sin(a) * rr + (R() - 0.5) * 0.06]);
      }
      const t = q(R() * 2 - 1, 14), a = t * TAU * 1.6, k = R() * 2 - 1;
      return P([Math.cos(a) * rr * k, t * 2.3, Math.sin(a) * rr * k]);
    },
    function mobius() {
      const u = R() * TAU, m = R();
      const v = m < 0.2 ? (R() < 0.5 ? -1 : 1) * (0.97 + R() * 0.04) : R() * 2 - 1;
      const rad = 1 + 0.8 * v * Math.cos(u / 2), Sc = 1.6;
      return T([Sc * rad * Math.cos(u) + (R() - 0.5) * 0.015, Sc * 0.8 * v * Math.sin(u / 2), Sc * rad * Math.sin(u)], 0.5);
    },
    function knot() {
      const t = R() * TAU, rc = Math.cos(3 * t) + 2;
      const c = [rc * Math.cos(2 * t) * 0.7, rc * Math.sin(2 * t) * 0.7, -Math.sin(3 * t) * 0.7];
      const d = sph(), m = 0.14 * Math.sqrt(R());
      return T([c[0] + d[0] * m, c[1] + d[1] * m, c[2] + d[2] * m], 0.3);
    },
    function torus() {
      const u = R() * TAU, v = R() * TAU, m = R();
      const rad = 1.7 + 0.68 * Math.cos(v);
      return T([rad * Math.cos(u), 0.68 * Math.sin(v), rad * Math.sin(u)], 0.55);
    },
    function klein() {
      const u = R() * TAU, v = R() * TAU;
      const cu = Math.cos(u / 2), su = Math.sin(u / 2), rad = 2 + cu * Math.sin(v) - su * Math.sin(2 * v), sc = 0.62;
      return T([rad * Math.cos(u) * sc, (su * Math.sin(v) + cu * Math.sin(2 * v)) * sc * 1.05, rad * Math.sin(u) * sc], 0.45);
    },
    function lorenz() {
      const p = lor[Math.floor(R() * lor.length)], sc = 0.085, j = 0.05;
      return T([p[0] * sc + (R() - 0.5) * j, (p[2] - 25) * sc + (R() - 0.5) * j, p[1] * sc + (R() - 0.5) * j], 0.12);
    },
    function tide() {
      const r = 2.85 * Math.sqrt(R()), a = R() * TAU;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const y = 0.5 * Math.sin(r * 3.0) * Math.exp(-r * 0.28) + 0.12 * Math.sin(x * 4) * Math.cos(z * 3);
      return T([x, y, z], 0.5);
    },
    function globe() {
      const r = 1.75;
      let ph, th;
      if (R() < 0.5) {
        // Latitude lines (horizontal rings)
        ph = q(R() * 2 - 1, 8) * 1.35;
        th = R() * TAU;
      } else {
        // Longitude lines (vertical meridians)
        ph = (R() * 2 - 1) * 1.35;
        th = q(R(), 16) * TAU;
      }
      return T([r * Math.cos(ph) * Math.cos(th), r * Math.sin(ph), r * Math.cos(ph) * Math.sin(th)], 0.4);
    },
    function supernova() {
      const qq = R();
      if (qq < 0.62) {
        const d = DIRS[Math.floor(R() * DIRS.length)], r = 0.25 + Math.pow(R(), 0.75) * 2.7, j = 0.02 + r * 0.014;
        return P([d[0] * r + (R() - 0.5) * j, d[1] * r + (R() - 0.5) * j, d[2] * r + (R() - 0.5) * j]);
      }
      const d = sph();
      const r = qq < 0.86 ? 1.95 + (R() - 0.5) * 0.08 + 0.12 * Math.sin(d[0] * 5 + d[1] * 3) : 0.55 * Math.pow(R(), 0.6);
      return P([d[0] * r, d[1] * r, d[2] * r]);
    },
    function halo() {
      // A massive glowing planetary ring / halo
      const a = R() * TAU;
      const spread = R();
      // Dense core, softer edges
      const r = 2.4 + (spread * spread * spread) * (R() < 0.5 ? 1 : -1) * 0.9;
      const y = (R() - 0.5) * (0.04 + Math.pow(spread, 2) * 0.3);
      return P([Math.cos(a) * r, y, Math.sin(a) * r], 0.9, 0.6);
    }
  ];

  // Precompute shapes
  const targets = shapes.map(() => new Float32Array(N * 3));
  const orbs = shapes.map(() => new Float32Array(N * 2));
  const rnd = new Float32Array(N * 3);
  const size = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    for (let s = 0; s < NS; s++) {
      const p = shapes[s](i);
      targets[s][i * 3] = p[0];
      targets[s][i * 3 + 1] = p[1];
      targets[s][i * 3 + 2] = p[2];
      orbs[s][i * 2] = p[3];
      orbs[s][i * 2 + 1] = p[4];
    }
    rnd[i * 3] = R();
    rnd[i * 3 + 1] = R();
    rnd[i * 3 + 2] = R();
    size[i] = 0.8 + R() * 0.9;
  }

  // Double buffering GPU attributes
  const fromArr = new Float32Array(N * 3);
  const toArr = new Float32Array(N * 3);
  const oFromArr = new Float32Array(N * 2);
  const oToArr = new Float32Array(N * 2);

  function createDynamicAttr(arr, size) {
    const attr = new THREE.BufferAttribute(arr, size);
    attr.setUsage(THREE.DynamicDrawUsage);
    return attr;
  }

  const aFrom = createDynamicAttr(fromArr, 3);
  const aTo = createDynamicAttr(toArr, 3);
  const aOF = createDynamicAttr(oFromArr, 2);
  const aOT = createDynamicAttr(oToArr, 2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('aFrom', aFrom);
  geo.setAttribute('aTo', aTo);
  geo.setAttribute('aOrbFrom', aOF);
  geo.setAttribute('aOrbTo', aOT);
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  let pair = -1;
  function setPair(i0) {
    if (i0 === pair) return;
    pair = i0;
    fromArr.set(targets[i0]);
    toArr.set(targets[i0 + 1]);
    oFromArr.set(orbs[i0]);
    oToArr.set(orbs[i0 + 1]);
    aFrom.needsUpdate = aTo.needsUpdate = aOF.needsUpdate = aOT.needsUpdate = true;
  }
  setPair(0);

  function v3(c) {
    return new THREE.Vector3(c[0] / 255, c[1] / 255, c[2] / 255);
  }

  const uniforms = {
    uIdx: { value: 0 },
    uF: { value: 0 },
    uTime: { value: 0 },
    uPR: { value: 1 },
    uScale: { value: 9.5 },
    uLens: { value: 0 },
    uStill: { value: 0 },
    uMouse: { value: new THREE.Vector2(9, 9) },
    uMouseOn: { value: 0 },
    uPulse: { value: new THREE.Vector3(0, 0, 1) },
    uA: { value: scenes.map(s => v3(s.A)) },
    uB: { value: scenes.map(s => v3(s.B)) },
    uHot: { value: scenes.map(s => s.hot || 0) }
  };

  const vertexShader = `
    attribute vec3 aFrom;
    attribute vec3 aTo;
    attribute vec3 aRnd;
    attribute float aSize;
    attribute vec2 aOrbFrom;
    attribute vec2 aOrbTo;

    uniform float uIdx;
    uniform float uF;
    uniform float uTime;
    uniform float uPR;
    uniform float uScale;
    uniform float uLens;
    uniform float uStill;
    uniform vec2 uMouse;
    uniform float uMouseOn;
    uniform vec3 uPulse;

    uniform vec3 uA[${NS}];
    uniform vec3 uB[${NS}];
    uniform float uHot[${NS}];

    varying vec3 vCol;
    varying float vA;

    void main(){
      float lf = clamp(uF * 1.5 - aRnd.x * 0.5, 0.0, 1.0);
      float e = lf * lf * (3.0 - 2.0 * lf);
      vec3 pos = mix(aFrom, aTo, e);

      float s = sin(3.14159 * e);
      pos += (aRnd - 0.5) * s * 2.4;

      float ang = s * 1.2 * (aRnd.y - 0.3);
      float c = cos(ang), sn = sin(ang);
      pos.xz = mat2(c, -sn, sn, c) * pos.xz;

      vec2 ob = mix(aOrbFrom, aOrbTo, e);
      float oa = uTime * ob.x / (0.5 + pow(length(pos.xz), 1.5));
      float co = cos(oa), so = sin(oa);
      pos.xz = mat2(co, -so, so, co) * pos.xz;

      float ct = cos(ob.y), st = sin(ob.y);
      pos.yz = mat2(ct, st, -st, ct) * pos.yz;

      float jitterDamp = 1.0 - uStill * 0.88;
      pos.y += 0.03 * jitterDamp * sin(uTime * 1.2 + pos.x * 2.0 + aRnd.z * 6.283);
      pos *= 1.0 + 0.012 * jitterDamp * sin(uTime * 1.4 + aRnd.z * 6.283);

      int ii = int(uIdx + 0.5);
      float hot = mix(uHot[ii], uHot[ii+1], e) * smoothstep(2.6, 0.9, length(pos));

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);

      // Gravitational lensing
      vec4 c4 = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      vec2 dd = mv.xy - c4.xy;
      float rr = length(dd);
      float behind = smoothstep(-0.2, 0.9, c4.z - mv.z);
      float bend = uLens * (0.55 * behind + 0.12) * smoothstep(2.9, 0.8, rr) / (0.35 + rr);
      mv.xy += dd / (rr + 1e-3) * bend * 0.6;
      float dop = 1.0 + uLens * 0.55 * clamp(dd.x / (rr + 0.5), -1.0, 1.0);

      // Kinetic mouse repulsion
      vec2 d = mv.xy - uMouse;
      float push = uMouseOn * smoothstep(1.4, 0.0, length(d));
      mv.xy += normalize(d + 1e-4) * push * 0.6;

      // Shockwave pulse
      vec2 pd = mv.xy - uPulse.xy;
      float rw = (length(pd) - uPulse.z * 5.5) * 2.4;
      float ring = exp(-rw * rw) * (1.0 - uPulse.z);
      mv.xy += normalize(pd + 1e-4) * ring * 0.55;

      gl_Position = projectionMatrix * mv;
      gl_PointSize = max(aSize * uPR * uScale / (-mv.z), 1.6 * uPR);

      vec3 cA = mix(uA[ii], uA[ii+1], e);
      vec3 cB = mix(uB[ii], uB[ii+1], e);
      vec3 col = mix(cA, cB, aRnd.z * 0.85) * (0.8 + 0.4 * aRnd.y);
      col = mix(col, vec3(1.0, 0.93, 0.8), hot * 0.75) * dop;
      vCol = col + push * 0.4 + ring * 0.5;
      vA = (0.55 + 0.45 * smoothstep(8.2, 5.0, -mv.z)) * 0.9;
    }
  `;

  const fragmentShader = `
    varying vec3 vCol;
    varying float vA;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      if(d > 0.5) discard;
      float a = 1.0 - smoothstep(0.36, 0.5, d);
      gl_FragColor = vec4(vCol * 0.95, a * vA);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  scene.add(points);

  // Background stars
  const SN = isSmall ? 600 : 1400;
  const sp = new Float32Array(SN * 3);
  for (let k = 0; k < SN; k++) {
    const d = sph(), r = 14 + R() * 18;
    sp[k * 3] = d[0] * r;
    sp[k * 3 + 1] = d[1] * r;
    sp[k * 3 + 2] = d[2] * r;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(
    sg,
    new THREE.PointsMaterial({
      color: 0x9a95c8,
      size: 0.035,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(stars);

  // ---- 4. UI CREATION & DOCK ----
  const capEl = document.getElementById('caption');
  const railEl = document.getElementById('rail');
  const countEl = document.getElementById('count');
  const nameEl = document.getElementById('name');
  const barEl = document.getElementById('bar');
  const hintEl = document.getElementById('hint');
  const cursorEl = document.getElementById('cursor');
  const rootEl = document.documentElement;

  const lines = scenes.map((s, idx) => {
    const div = document.createElement('div');
    div.className = 'line';
    const words = s.line.split(' ');
    div.innerHTML = `<h2>${words.map(w => `<span class="w">${w}</span>`).join(' ')}</h2><p>${s.sub}</p>`;
    if (capEl) capEl.appendChild(div);

    const b = document.createElement('button');
    b.setAttribute('aria-label', s.name);
    b.dataset.scene = idx;
    if (railEl) railEl.appendChild(b);

    return { el: div, words: div.querySelectorAll('.w'), sub: div.querySelector('p'), n: words.length, dot: b };
  });

  // Populate Gallery Grid Modal
  const galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid) {
    scenes.forEach((s, idx) => {
      const item = document.createElement('button');
      item.className = 'gallery-item' + (idx === 0 ? ' active' : '');
      item.innerHTML = `<div class="item-num">${(idx + 1 < 10 ? '0' : '') + (idx + 1)} / ${NS}</div><div class="item-title">${s.name}</div>`;
      item.addEventListener('click', () => {
        if (typeof isHologramMode !== 'undefined' && isHologramMode) {
          if (typeof setHologramMode === 'function') setHologramMode(false);
        }
        setTarget(idx);
        closeGallery();
      });
      galleryGrid.appendChild(item);
    });
  }

  const galleryModal = document.getElementById('gallery-modal');
  function openGallery() { if (galleryModal) galleryModal.classList.add('open'); }
  function closeGallery() { if (galleryModal) galleryModal.classList.remove('open'); }
  const galleryCloseBtn = document.getElementById('gallery-close');
  if (galleryCloseBtn) galleryCloseBtn.addEventListener('click', closeGallery);

  // Camera Orbit Toggle
  let isOrbitMode = false;
  let orbitRotX = 0;
  let orbitRotY = 0;
  let orbitDrag = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  const btnOrbit = document.getElementById('btn-orbit');
  if (btnOrbit) {
    btnOrbit.addEventListener('click', () => {
      isOrbitMode = !isOrbitMode;
      btnOrbit.classList.toggle('active', isOrbitMode);
      btnOrbit.innerHTML = isOrbitMode ? '<span>🔄</span> Mode: 3D Orbit' : '<span>📽️</span> Mode: Sequence';
    });
  }


  const btnGallery = document.getElementById('btn-gallery');
  if (btnGallery) btnGallery.addEventListener('click', openGallery);

  // Resize handler
  function resize() {
    const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uPR.value = dpr;
    points.scale.setScalar(Math.min(1, Math.max(0.5, camera.aspect * 1.05)));
    points.position.y = camera.aspect < 0.8 ? 0.6 : 0.4;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- 5. INPUT & KINETIC ENGINE ----
  let nx = 0, ny = 0, sx = 0, sy = 0, mouseOn = 0, mouseOnT = 0;
  let cx = -100, cy = -100, tx = -100, ty = -100;
  let target = 0, ps = 0, mom = 0, drag = null, pulseT = 1;

  function setTarget(v) {
    target = Math.min(MAXP, Math.max(0, v));
  }

  function toNdc(e) {
    nx = (e.clientX / window.innerWidth) * 2 - 1;
    ny = -((e.clientY / window.innerHeight) * 2 - 1);
  }

  window.addEventListener('pointermove', (e) => {
    toNdc(e);
    mouseOnT = 1;
    tx = e.clientX;
    ty = e.clientY;

    if (isOrbitMode && orbitDrag) {
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      orbitRotY += dx * 0.006;
      orbitRotX += dy * 0.006;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    } else if (drag && e.pointerId === drag.id) {
      const dp = -(e.clientY - drag.y) / (window.innerHeight * 0.55);
      drag.y = e.clientY;
      setTarget(target + dp);
      mom = dp;
    }
  }, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    toNdc(e);
    mouseOnT = 1;
    if (cursorEl) cursorEl.classList.add('down');

    if (e.target.closest && (e.target.closest('button') || e.target.closest('.control-dock') || e.target.closest('.nav') || e.target.closest('.gallery-modal'))) {
      return;
    }

    if (isOrbitMode) {
      orbitDrag = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    } else {
      drag = { y: e.clientY, id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now() };
      mom = 0;
    }

    uniforms.uPulse.value.x = nx * halfH * camera.aspect;
    uniforms.uPulse.value.y = ny * halfH;
    pulseT = 0;
  }, { passive: true });

  function onPointerUp(e) {
    if (cursorEl) cursorEl.classList.remove('down');
    if (drag) setTarget(target + mom * 10);
    drag = null;
    orbitDrag = false;
    mom = 0;
    if (e.pointerType && e.pointerType !== 'mouse') mouseOnT = 0;
  }

  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerUp, { passive: true });
  document.addEventListener('pointerleave', () => { mouseOnT = 0; });

  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    setTarget(target + e.deltaY / 850);
  }, { passive: false });

  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown' || ev.key === 'PageDown' || ev.key === ' ') {
      ev.preventDefault();
      setTarget(Math.round(target) + 1);
    }
    if (ev.key === 'ArrowUp' || ev.key === 'PageUp') {
      ev.preventDefault();
      setTarget(Math.round(target) - 1);
    }
    if (ev.key === 'Escape') closeGallery();
  });

  document.querySelectorAll('[data-scene]').forEach(b => {
    b.addEventListener('click', () => {
      setTarget(Number(b.dataset.scene));
    });
  });

  // ---- 6. UI UPDATER ----
  let activeIdx = -1, lastCss = -9;
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function mixc(a, b, t) {
    return Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t);
  }

  function updateUI() {
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i], w = clamp(1.5 - Math.abs(ps - i) * 2.2, 0, 1);
      for (let k = 0; k < L.words.length; k++) {
        const o = clamp((w - (0.3 + 0.35 * (k / L.n))) / 0.15, 0, 1);
        const st = L.words[k].style;
        st.opacity = o.toFixed(3);
        st.transform = `translateY(${((1 - o) * 18).toFixed(1)}px)`;
      }
      L.sub.style.opacity = clamp((w - 0.7) / 0.3, 0, 1).toFixed(3);
    }

    const idx = Math.round(ps);
    if (idx !== activeIdx) {
      if (activeIdx >= 0) lines[activeIdx].dot.classList.remove('on');
      lines[idx].dot.classList.add('on');
      activeIdx = idx;

      if (countEl) countEl.textContent = `${pad(idx + 1)} / ${pad(NS)}`;
      if (nameEl) {
        nameEl.classList.add('swap');
        setTimeout(() => {
          nameEl.textContent = scenes[idx].name;
          nameEl.classList.remove('swap');
        }, 180);
      }

      // Update gallery active state
      const galleryItems = document.querySelectorAll('.gallery-item');
      galleryItems.forEach((el, i) => {
        el.classList.toggle('active', i === idx);
      });

    }

    if (barEl) barEl.style.transform = `scaleX(${(ps / MAXP).toFixed(4)})`;
    if (hintEl) hintEl.style.opacity = (1 - clamp(ps * 6, 0, 1)).toFixed(3);

    if (Math.abs(ps - lastCss) > 0.003) {
      lastCss = ps;
      const i0 = Math.min(Math.floor(ps), NS - 2), f = ps - i0, ef = f * f * (3 - 2 * f);
      rootEl.style.setProperty('--accent-rgb', mixc(scenes[i0].A, scenes[i0 + 1].A, ef));
      rootEl.style.setProperty('--accent2-rgb', mixc(scenes[i0].B, scenes[i0 + 1].B, ef));
    }
  }

  // ---- 7. ANIMATION LOOP ----
  let lastTime = 0;
  let isVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => {
      isVisible = e[0].isIntersecting;
    }, { threshold: 0 }).observe(document.body);
  }

  function frame(ms) {
    requestAnimationFrame(frame);
    if (!isVisible) return;

    const t = ms / 1000;
    const dt = Math.min(0.05, t - lastTime);
    lastTime = t;

    ps += (target - ps) * (reduce ? 1 : 0.075);
    sx += (nx - sx) * 0.06;
    sy += (ny - sy) * 0.06;
    mouseOn += (mouseOnT - mouseOn) * 0.12;
    pulseT = Math.min(1, pulseT + dt * 0.8);

    const i0 = Math.min(Math.max(Math.floor(ps), 0), NS - 2);
    const f0 = ps - i0;
    const ef0 = f0 * f0 * (3 - 2 * f0);

    setPair(i0);
    uniforms.uIdx.value = i0;
    uniforms.uF.value = f0;
    uniforms.uLens.value = (scenes[i0].lens || 0) + ((scenes[i0 + 1].lens || 0) - (scenes[i0].lens || 0)) * ef0;

    const still = (scenes[i0].still || 0) + ((scenes[i0 + 1].still || 0) - (scenes[i0].still || 0)) * ef0;
    uniforms.uStill.value = still;
    uniforms.uTime.value = reduce ? 0 : t;
    uniforms.uMouseOn.value = mouseOn;
    uniforms.uMouse.value.set(nx * halfH * camera.aspect, ny * halfH);
    uniforms.uPulse.value.z = pulseT;

    if (isOrbitMode) {
      points.rotation.y = orbitRotY;
      points.rotation.x = orbitRotX;
    } else {
      let ry = (reduce ? 0 : t * 0.14) + ps * 0.6;
      ry = ry * (1 - still) + Math.sin(t * 0.3) * 0.25 * still;
      points.rotation.y = ry + sx * 0.3;
      points.rotation.x = -sy * 0.18;
    }

    stars.rotation.y = t * 0.01 + ps * 0.15;
    stars.rotation.x = ps * 0.04;

    cx += (tx - cx) * 0.2;
    cy += (ty - cy) * 0.2;
    if (cursorEl) cursorEl.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;

    updateUI();
    renderer.render(scene, camera);
  }

  requestAnimationFrame(frame);
})();
