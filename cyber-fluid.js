// ==========================================
// CYBER-FLUID ADVANCED PHYSICS ENGINE
// ==========================================

const waterClip = document.getElementById('water-clip');
const waterShape = document.getElementById('water-shape');
const displacementMap = document.getElementById('displacement');
const cursorGlow = document.getElementById('cursor-glow');
const metaballChainGroup = document.getElementById('metaball-chain');
const rippleLayerGroup = document.getElementById('ripple-layer');

const headlineTop = document.getElementById('headline-top');
const headlineBottom = document.getElementById('headline-bottom');
const textureOverlay = document.getElementById('texture-overlay');

// --- Input Tracking ---
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let lastMouseX = mouseX;
let lastMouseY = mouseY;
let isPressing = false;
let idleFrames = 0;
let gravityOffset = 0;

// --- Physics Properties ---
let circleX = mouseX;
let circleY = mouseY;
let velX = 0;
let velY = 0;

// Presets
const VISCOSITY_PRESETS = {
  mercury: { name: 'Mercury', tension: 0.11, friction: 0.85, stretchMult: 0.028, chainTension: 0.28 },
  splash: { name: 'Splash', tension: 0.22, friction: 0.89, stretchMult: 0.016, chainTension: 0.45 }
};

let currentViscosityKey = 'mercury';
let currentViscosity = VISCOSITY_PRESETS[currentViscosityKey];

// Radii
const defaultRadius = 40;
const clickRadius = 90;
let targetRadius = defaultRadius;
let currentRadius = defaultRadius;
let radiusVel = 0;

// Simulation Mode
let isFlameMode = false;
let isHardTextureOn = true;

// ==========================================
// 1. METABALL TENDRIL CHAIN INITIALIZATION
// ==========================================
const CHAIN_COUNT = 6;
const chainNodes = [];
for (let i = 0; i < CHAIN_COUNT; i++) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  el.setAttribute('fill', 'white');
  metaballChainGroup.appendChild(el);
  chainNodes.push({
    el,
    x: mouseX,
    y: mouseY,
    vx: 0,
    vy: 0,
    baseRadius: 30 * Math.pow(0.80, i + 1)
  });
}

// ==========================================
// 2. DROPLETS & SHOCKWAVE RIPPLES ARRAYS
// ==========================================
const drops = [];
const ripples = [];
const MAX_DROPS = 70;
const MAX_RIPPLES = 6;

function spawnDrop(x, y, vx, vy, radius, shrinkRate, isFlame = false) {
  if (drops.length >= MAX_DROPS) {
    const old = drops.shift();
    if (old && old.el) old.el.remove();
  }
  const dropEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dropEl.setAttribute('fill', 'white');
  waterClip.appendChild(dropEl);
  drops.push({ el: dropEl, x, y, vx, vy, r: radius, shrinkRate, isFlame });
}

function spawnRipple(x, y, maxRadius = 140) {
  if (ripples.length >= MAX_RIPPLES) {
    const old = ripples.shift();
    if (old && old.el) old.el.remove();
  }
  const rippleEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  rippleEl.setAttribute('fill', 'none');
  rippleEl.setAttribute('stroke', 'white');
  rippleEl.setAttribute('stroke-width', '18');
  rippleLayerGroup.appendChild(rippleEl);
  ripples.push({ el: rippleEl, x, y, r: 12, maxR: maxRadius, strokeW: 18, life: 1.0 });
}

// ==========================================
// 3. EVENT LISTENERS & CYBER DOCK CONTROLS
// ==========================================
window.addEventListener('pointermove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener('pointerdown', (e) => {
  // Ignore clicks on control dock
  if (e.target.closest('#cyber-dock')) return;

  isPressing = true;
  targetRadius = clickRadius;

  // Trigger liquid shockwave ring
  spawnRipple(circleX, circleY, isFlameMode ? 160 : 130);

  // Splash Burst
  let numDrops = isFlameMode ? 12 : 9;
  for (let i = 0; i < numDrops; i++) {
    let angle = Math.random() * Math.PI * 2;
    let burstSpeed = (12 + Math.random() * 20);
    let vyOffset = isFlameMode ? -(4 + Math.random() * 8) : 0;
    spawnDrop(
      circleX + Math.cos(angle) * (currentRadius * 0.4),
      circleY + Math.sin(angle) * (currentRadius * 0.4),
      Math.cos(angle) * burstSpeed,
      Math.sin(angle) * burstSpeed + vyOffset,
      14 + Math.random() * 22,
      0.35 + Math.random() * 0.5,
      isFlameMode
    );
  }
});

window.addEventListener('pointerup', () => { isPressing = false; targetRadius = defaultRadius; });
window.addEventListener('pointercancel', () => { isPressing = false; targetRadius = defaultRadius; });

// Mode Buttons
const btnFluid = document.getElementById('btn-fluid');
const btnFlame = document.getElementById('btn-flame');
const btnViscosity = document.getElementById('btn-viscosity');
const viscosityLabel = document.getElementById('viscosity-label');
const btnTexture = document.getElementById('btn-texture');
const textureLabel = document.getElementById('texture-label');

function setMode(flame) {
  isFlameMode = flame;
  document.body.classList.toggle('flame-mode', isFlameMode);
  
  if (btnFluid && btnFlame) {
    btnFluid.classList.toggle('active', !isFlameMode);
    btnFlame.classList.toggle('active', isFlameMode);
  }

  // Update crisp headline text
  if (headlineTop && headlineBottom) {
    const text = isFlameMode ? 'Solar Flame' : 'Liquid Flow';
    headlineTop.innerText = text;
    headlineBottom.innerText = text;
  }
}

if (btnFluid) btnFluid.addEventListener('click', (e) => { e.stopPropagation(); setMode(false); });
if (btnFlame) btnFlame.addEventListener('click', (e) => { e.stopPropagation(); setMode(true); });

// Viscosity Toggle
if (btnViscosity) {
  btnViscosity.addEventListener('click', (e) => {
    e.stopPropagation();
    currentViscosityKey = currentViscosityKey === 'mercury' ? 'splash' : 'mercury';
    currentViscosity = VISCOSITY_PRESETS[currentViscosityKey];
    viscosityLabel.innerText = currentViscosity.name;
    btnViscosity.classList.toggle('active', currentViscosityKey === 'splash');
  });
}

// Hard Texture Toggle
if (btnTexture) {
  btnTexture.addEventListener('click', (e) => {
    e.stopPropagation();
    isHardTextureOn = !isHardTextureOn;
    textureOverlay.classList.toggle('disabled', !isHardTextureOn);
    btnTexture.classList.toggle('active', isHardTextureOn);
    textureLabel.innerText = isHardTextureOn ? 'Texture: ON' : 'Texture: OFF';
  });
}

// Visibility observer to save CPU when off-tab
let isVisible = true;
if ('IntersectionObserver' in window) {
  new IntersectionObserver((entries) => {
    isVisible = entries[0].isIntersecting;
  }, { threshold: 0.01 }).observe(document.body);
}

// ==========================================
// 4. ANIMATION & INTEGRATION LOOP
// ==========================================
let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);
  if (!isVisible) return;
  frameCount++;

  // Idle Gravity & Buoyancy
  let mouseMoved = Math.abs(mouseX - lastMouseX) > 0.5 || Math.abs(mouseY - lastMouseY) > 0.5;
  if (mouseMoved) {
    idleFrames = 0;
    gravityOffset = 0;
  } else {
    idleFrames++;
  }
  lastMouseX = mouseX;
  lastMouseY = mouseY;

  let targetY = mouseY;
  if (idleFrames > 50) {
    let dripTime = idleFrames - 50;
    gravityOffset += dripTime * 0.03;
    targetY += isFlameMode ? -gravityOffset * 2.2 : gravityOffset;
  }

  // Flame Mode: Thermal embers rising
  if (isFlameMode && Math.random() > 0.45) {
    let sparkSource = chainNodes[Math.floor(Math.random() * chainNodes.length)];
    let sx = sparkSource ? sparkSource.x : circleX;
    let sy = sparkSource ? sparkSource.y : circleY;
    spawnDrop(
      sx + (Math.random() - 0.5) * 20,
      sy - 5,
      velX * 0.2 + (Math.random() - 0.5) * 5,
      -3 - Math.random() * 7,
      10 + Math.random() * 14,
      0.5 + Math.random() * 0.4,
      true
    );
  }

  // --- 1. Main Cursor Physics ---
  let targetTension = isFlameMode ? 0.08 : currentViscosity.tension;
  let dx = mouseX - circleX;
  let dy = targetY - circleY;

  velX += dx * targetTension;
  velY += dy * targetTension;
  velX *= currentViscosity.friction;
  velY *= currentViscosity.friction;

  circleX += velX;
  circleY += velY;

  // Window Edge Bounce
  let edgeMargin = currentRadius * 0.7;
  let hitSpeedX = Math.abs(velX);
  let hitSpeedY = Math.abs(velY);

  if (circleX < edgeMargin) {
    circleX = edgeMargin;
    velX = hitSpeedX * 0.65;
    if (hitSpeedX > 14) spawnDrop(circleX, circleY, hitSpeedX * 0.4, velY * 0.2, 16, 0.4);
  } else if (circleX > window.innerWidth - edgeMargin) {
    circleX = window.innerWidth - edgeMargin;
    velX = -hitSpeedX * 0.65;
    if (hitSpeedX > 14) spawnDrop(circleX, circleY, -hitSpeedX * 0.4, velY * 0.2, 16, 0.4);
  }

  if (circleY < edgeMargin) {
    circleY = edgeMargin;
    velY = hitSpeedY * 0.65;
    if (hitSpeedY > 14) spawnDrop(circleX, circleY, velX * 0.2, hitSpeedY * 0.4, 16, 0.4);
  } else if (circleY > window.innerHeight - edgeMargin) {
    circleY = window.innerHeight - edgeMargin;
    velY = -hitSpeedY * 0.65;
    if (hitSpeedY > 14) spawnDrop(circleX, circleY, velX * 0.2, -hitSpeedY * 0.4, 16, 0.4);
  }

  // --- 2. Kinetic Velocity & Dynamic Rotation ---
  let speed = Math.sqrt(velX * velX + velY * velY);
  let angle = Math.atan2(velY, velX) * (180 / Math.PI);

  // --- 3. Fluid Stretch & Squish Deformation ---
  let stretchFactor = 1 + (speed * currentViscosity.stretchMult);
  stretchFactor = Math.min(stretchFactor, 2.7);
  let squishFactor = 1 / stretchFactor;

  // Radius elasticity
  let dynamicTargetRadius = Math.max(targetRadius - (speed * 0.5), 24);
  radiusVel += (dynamicTargetRadius - currentRadius) * 0.16;
  radiusVel *= 0.76;
  currentRadius = Math.max(currentRadius + radiusVel, 16);

  let rx = currentRadius * stretchFactor;
  let ry = currentRadius * squishFactor;

  // Update Lead SVG Shape
  waterShape.setAttribute('cx', circleX);
  waterShape.setAttribute('cy', circleY);
  waterShape.setAttribute('rx', rx);
  waterShape.setAttribute('ry', ry);
  waterShape.setAttribute('transform', `rotate(${angle}, ${circleX}, ${circleY})`);

  // Update Cursor Glow
  cursorGlow.style.transform = `translate3d(${circleX}px, ${circleY}px, 0)`;
  cursorGlow.style.opacity = 0.5 + Math.min(speed * 0.025, 0.5);

  // Dynamic turbulence reaction
  let targetDisplacement = 16 + (speed * 1.3);
  let currentDisplacement = parseFloat(displacementMap.getAttribute('scale'));
  displacementMap.setAttribute('scale', currentDisplacement + (targetDisplacement - currentDisplacement) * 0.1);

  // --- 4. Trailing Metaball Spring Chain Physics ---
  let leaderX = circleX;
  let leaderY = circleY;

  for (let i = 0; i < CHAIN_COUNT; i++) {
    const node = chainNodes[i];
    let ndx = leaderX - node.x;
    let ndy = leaderY - node.y;

    // Upward buoyancy in flame mode
    let buoyancyY = isFlameMode ? -(3.5 + i * 1.8) : 0;
    let flameWiggleX = isFlameMode ? Math.sin(frameCount * 0.1 + i) * 1.8 : 0;

    let cTension = currentViscosity.chainTension / (1 + i * 0.18);
    node.vx += (ndx * cTension) + flameWiggleX;
    node.vy += (ndy * cTension) + buoyancyY;
    node.vx *= 0.78;
    node.vy *= 0.78;

    node.x += node.vx;
    node.y += node.vy;

    // Node dynamic radius reacts to speed
    let nodeSpeed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    let nodeRadius = Math.max(node.baseRadius * (1 - Math.min(nodeSpeed * 0.02, 0.4)), 4);

    node.el.setAttribute('cx', node.x);
    node.el.setAttribute('cy', node.y);
    node.el.setAttribute('r', nodeRadius);

    leaderX = node.x;
    leaderY = node.y;
  }

  // --- 5. Kinetic Trail Droplets ---
  if (speed > 16 && Math.random() > 0.4) {
    spawnDrop(
      circleX - (velX * 0.4),
      circleY - (velY * 0.4),
      velX * 0.12,
      velY * 0.12,
      16 + Math.random() * 20,
      0.3 + Math.random() * 0.4,
      isFlameMode
    );
  }

  // --- 6. Update Droplets Physics ---
  for (let i = drops.length - 1; i >= 0; i--) {
    let drop = drops[i];

    if (drop.isFlame) {
      drop.vy -= 0.35; // thermal lift
      drop.vx += Math.sin(frameCount * 0.15 + i) * 0.3; // wind curl
    }

    drop.x += drop.vx;
    drop.y += drop.vy;
    drop.vx *= 0.92;
    drop.vy *= 0.92;

    drop.r -= drop.shrinkRate;

    if (drop.r <= 0) {
      drop.el.remove();
      drops.splice(i, 1);
    } else {
      drop.el.setAttribute('cx', drop.x);
      drop.el.setAttribute('cy', drop.y);
      drop.el.setAttribute('r', drop.r);
    }
  }

  // --- 7. Update Expanding Shockwave Ripples ---
  for (let i = ripples.length - 1; i >= 0; i--) {
    let rip = ripples[i];
    rip.r += (rip.maxR - rip.r) * 0.12 + 2;
    rip.strokeW *= 0.94;
    rip.life -= 0.025;

    if (rip.life <= 0 || rip.strokeW <= 1) {
      rip.el.remove();
      ripples.splice(i, 1);
    } else {
      rip.el.setAttribute('cx', rip.x);
      rip.el.setAttribute('cy', rip.y);
      rip.el.setAttribute('r', rip.r);
      rip.el.setAttribute('stroke-width', rip.strokeW);
      rip.el.setAttribute('opacity', rip.life);
    }
  }
}

animate();
