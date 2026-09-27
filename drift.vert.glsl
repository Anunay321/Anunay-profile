// Drift Pro Advanced Particle Vertex Shader
// Features: GPU Morphing, Gravitational Lensing, Doppler Beaming, Dynamic Kinetic Waves

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
uniform vec2 uMouse;
uniform float uMouseOn;
uniform vec3 uPulse;

const int SCENE_COUNT = 14;
uniform vec3 uA[SCENE_COUNT];
uniform vec3 uB[SCENE_COUNT];
uniform float uHot[SCENE_COUNT];

varying vec3 vCol;
varying float vA;

void main() {
  // Smooth cubic ease interpolation between active scene pair
  float lf = clamp(uF * 1.5 - aRnd.x * 0.5, 0.0, 1.0);
  float e = lf * lf * (3.0 - 2.0 * lf);
  vec3 pos = mix(aFrom, aTo, e);

  // Transition turbulence & chaotic expansion
  float s = sin(3.14159265 * e);
  pos += (aRnd - 0.5) * s * 2.4;
  
  float ang = s * 1.2 * (aRnd.y - 0.3);
  float c = cos(ang), sn = sin(ang);
  pos.xz = mat2(c, -sn, sn, c) * pos.xz;

  // Orbital dynamics & azimuthal twist
  vec2 ob = mix(aOrbFrom, aOrbTo, e);
  float oa = uTime * ob.x / (0.5 + pow(length(pos.xz), 1.5));
  float co = cos(oa), so = sin(oa);
  pos.xz = mat2(co, -so, so, co) * pos.xz;

  float ct = cos(ob.y), st = sin(ob.y);
  pos.yz = mat2(ct, st, -st, ct) * pos.yz;

  // Harmonic breathing oscillation
  pos.y += 0.03 * sin(uTime * 1.2 + pos.x * 2.0 + aRnd.z * 6.28318);
  pos *= 1.0 + 0.012 * sin(uTime * 1.4 + aRnd.z * 6.28318);

  // Temperature / Core heat
  int ii = int(uIdx + 0.5);
  float hot = mix(uHot[ii], uHot[ii + 1], e) * smoothstep(2.6, 0.9, length(pos));

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  // Gravitational lensing & relativistic Doppler beaming
  vec4 c4 = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  vec2 dd = mv.xy - c4.xy;
  float rr = length(dd);
  float behind = smoothstep(-0.2, 0.9, c4.z - mv.z);
  float bend = uLens * (0.55 * behind + 0.12) * smoothstep(2.9, 0.8, rr) / (0.35 + rr);
  mv.xy += dd / (rr + 1e-3) * bend * 0.6;
  float dop = 1.0 + uLens * 0.55 * clamp(dd.x / (rr + 0.5), -1.0, 1.0);

  // Kinetic Mouse Field interaction
  vec2 d = mv.xy - uMouse;
  float push = uMouseOn * smoothstep(1.4, 0.0, length(d));
  mv.xy += normalize(d + 1e-4) * push * 0.6;

  // Gravitational Shockwave pulse ring
  vec2 pd = mv.xy - uPulse.xy;
  float rw = (length(pd) - uPulse.z * 5.5) * 2.4;
  float ring = exp(-rw * rw) * (1.0 - uPulse.z);
  mv.xy += normalize(pd + 1e-4) * ring * 0.55;

  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(aSize * uPR * uScale / (-mv.z), 1.6 * uPR);

  // Chromatic color blend
  vec3 cA = mix(uA[ii], uA[ii + 1], e);
  vec3 cB = mix(uB[ii], uB[ii + 1], e);
  vec3 col = mix(cA, cB, aRnd.z * 0.85) * (0.8 + 0.4 * aRnd.y);
  col = mix(col, vec3(1.0, 0.93, 0.8), hot * 0.75) * dop;
  vCol = col + push * 0.4 + ring * 0.5;
  vA = (0.55 + 0.45 * smoothstep(8.2, 5.0, -mv.z)) * 0.9;
}
