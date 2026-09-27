// Drift Pro Advanced Particle Fragment Shader
// Features: Circular point disc rasterization with smooth Gaussian radial falloff

precision highp float;

varying vec3 vCol;
varying float vA;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  
  // Smooth antialiased boundary falloff
  float a = 1.0 - smoothstep(0.36, 0.5, d);
  gl_FragColor = vec4(vCol * 0.95, a * vA);
}
