'use client';
import { useEffect, useMemo, useRef } from "react";

/* ================= CONFIGURATION ================= */
const CONFIG = {
  colors: {
    bg: "var(--cream-100, #f4efe6)",
    olive: "var(--olive-500, #6e8b5e)",
    terra: "var(--terra-500, #c08a5a)",
    sable: "var(--sable-300, #e2c98f)",
  },
  sizes: {
    olive: { min: 80, max: 130 },
    terra: { min: 70, max: 110 },
    sable: { min: 90, max: 150 },
  },
  coverage: {
    min: 0.30,
    max: 0.60,
    checkInterval: 2000,
  },
  initialCount: 10,
  minCells: 8,
  maxCells: 25,
  physics: {
    baseSpeed: 2.0,
    maxSpeed: 3.5,
    deceleration: 0.97,
    rotationDamping: 0.97,
    acceleration: 0.02,
    wanderRadius: 200,
    wanderStrength: 1.5,
    rotationMaxSpeed: 0.04,
    rotationAcceleration: 0.05,
    repulsionSoftness: 5.0,
    attractionForce: 5.0,
    fissionThreshold: 2.2,
  },
  animation: {
    fps: 30,
    breathingSpeed: 0.002,
    pointCount: 16,
    pointCountMobile: 12,
  },
  gooey: {
    blur: 18,
    blurMobile: 12,
    matrixThreshold: 30,
    matrixOffset: -12,
  },
  fusion: {
    baseDuration: 0.8,
    sizeFactor: 200,
    approachPhase: 0.6,
    pseudopodStrength: 0.15,
    pseudopodAngle: Math.PI / 3,
    shrinkSpeed: 1.5,
  },
  fission: {
    baseDuration: 1.2,
    sizeFactor: 150,
    elongateEnd: 0.4,
    pinchEnd: 0.75,
    maxStretch: 1.6,
    maxPerpCompress: 0.75,
    pinchStrength: 0.4,
    ejectSpeed: 1.5,
  },
  cooldown: 2000,
};

/* ================= UTILS ================= */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function noise2D(x, y, seed = 0) {
  const dot = (gx, gy, dx, dy) => gx * dx + gy * dy;
  const mix = (a, b, t) => a * (1 - t) + b * t;
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = smoothstep(xf);
  const v = smoothstep(yf);
  const grad = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];
  const hash = (hx, hy) => {
    const h = (hx * 374761393 + hy * 668265263 + seed * 1013904223) & 0x7fffffff;
    return grad[h % 8];
  };
  const g00 = hash(X, Y);
  const g10 = hash(X + 1, Y);
  const g01 = hash(X, Y + 1);
  const g11 = hash(X + 1, Y + 1);
  const n00 = dot(g00[0], g00[1], xf, yf);
  const n10 = dot(g10[0], g10[1], xf - 1, yf);
  const n01 = dot(g01[0], g01[1], xf, yf - 1);
  const n11 = dot(g11[0], g11[1], xf - 1, yf - 1);
  return mix(mix(n00, n10, u), mix(n01, n11, u), v);
}

/* ================= ORGANIC CELL ================= */
class OrganicCell {
  constructor({ x, y, color, size, rnd, id, bounds, fromEdge = false, pointCount = CONFIG.animation.pointCount }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.color = color;
    this.baseSize = size;
    this.size = size;
    this.bounds = bounds;
    this.rnd = rnd;
    this.isDead = false;
    this.age = 0;
    this.pointCount = pointCount;

    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;

    this.rotation = rnd() * Math.PI * 2;
    this.rotationSpeed = 0;
    this.targetRotationSpeed = (rnd() - 0.5) * 0.02;

    this.breathPhase = rnd() * Math.PI * 2;
    this.breathRate = 0.6 + rnd() * 0.6;
    this.breathAmplitude = 0.06 + rnd() * 0.04;

    this.scale = fromEdge ? 0.1 : 1;
    this.opacity = fromEdge ? 0 : 1;

    this.points = [];
    this.pointVelocities = [];
    for (let i = 0; i < this.pointCount; i++) {
      const radius = 0.9 + rnd() * 0.2;
      this.points.push({ r: radius, a: 0, targetR: radius, targetA: 0, baseR: radius });
      this.pointVelocities.push({ r: 0, a: 0 });
    }

    this.stretchX = 1;
    this.stretchY = 1;
    this.skew = 0;

    // Fusion state machine
    this.fusionState = 'none';
    this.fusionPartnerId = null;
    this.fusionRole = null;
    this.fusionTimer = 0;
    this.fusionDuration = 0;
    this.fusionTargetSize = 0;

    // Fission state machine
    this.fissionState = 'none';
    this.fissionProgress = 0;
    this.fissionDuration = 0;
    this.fissionAxis = 0;
    this.fissionChildCreated = false;
    this.fissionChildId = null;

    // Cooldown
    this.lastFusionTime = -CONFIG.cooldown;
    this.lastFissionTime = -CONFIG.cooldown;

    this.wanderAngle = rnd() * Math.PI * 2;
    this.wanderTarget = { x, y };

    if (fromEdge) this.spawnFromEdge();
  }

  spawnFromEdge() {
    const side = Math.floor(this.rnd() * 4);
    const margin = 50;
    switch (side) {
      case 0:
        this.x = this.rnd() * this.bounds.width;
        this.y = -margin;
        this.vx = (this.rnd() - 0.5) * 2;
        this.vy = 2 + this.rnd() * 2;
        break;
      case 1:
        this.x = this.bounds.width + margin;
        this.y = this.rnd() * this.bounds.height;
        this.vx = -(2 + this.rnd() * 2);
        this.vy = (this.rnd() - 0.5) * 2;
        break;
      case 2:
        this.x = this.rnd() * this.bounds.width;
        this.y = this.bounds.height + margin;
        this.vx = (this.rnd() - 0.5) * 2;
        this.vy = -(2 + this.rnd() * 2);
        break;
      case 3:
        this.x = -margin;
        this.y = this.rnd() * this.bounds.height;
        this.vx = 2 + this.rnd() * 2;
        this.vy = (this.rnd() - 0.5) * 2;
        break;
    }
  }

  updateWanderTarget() {
    if (!this.bounds) return;
    const angle = this.wanderAngle + (this.rnd() - 0.5) * Math.PI * 0.5;
    const dist = CONFIG.physics.wanderRadius * (0.5 + this.rnd() * 0.5);
    this.wanderTarget = {
      x: Math.max(50, Math.min(this.bounds.width - 50, this.x + Math.cos(angle) * dist)),
      y: Math.max(50, Math.min(this.bounds.height - 50, this.y + Math.sin(angle) * dist)),
    };
    this.wanderAngle = angle;
  }

  findPartner(allCells) {
    if (!this.fusionPartnerId) return null;
    return allCells.find(c => c.id === this.fusionPartnerId) || null;
  }

  update(deltaTime, allCells) {
    const dt = Math.max(0, deltaTime) / 1000;
    this.age += deltaTime;
    this.prevX = this.x;
    this.prevY = this.y;

    // Spawn scale-in
    if (this.scale < 1 && this.fusionState === 'none' && this.fissionState === 'none') {
      const scaleSpeed = 0.005 + smoothstep(this.scale) * 0.01;
      this.scale = Math.min(1, this.scale + scaleSpeed);
      this.opacity = Math.min(1, this.opacity + scaleSpeed);
    }

    // Respiration
    this.breathPhase += CONFIG.animation.breathingSpeed * this.breathRate * deltaTime;
    const breathing = Math.sin(this.breathPhase) * this.breathAmplitude;

    // Skip normal movement during active fusion/fission
    const isBusy = this.fusionState !== 'none' || this.fissionState !== 'none';

    if (!isBusy) {
      // Wander
      if (!this.wanderTarget || Math.random() < 0.01 ||
          (Math.abs(this.x - this.wanderTarget.x) < 20 && Math.abs(this.y - this.wanderTarget.y) < 20)) {
        this.updateWanderTarget();
      }
      const wanderDx = this.wanderTarget.x - this.x;
      const wanderDy = this.wanderTarget.y - this.y;
      const wanderDist = Math.hypot(wanderDx, wanderDy);
      if (wanderDist > 1) {
        const wanderForce = CONFIG.physics.wanderStrength * smoothstep(Math.min(1, wanderDist / 200));
        this.ax += (wanderDx / wanderDist) * wanderForce;
        this.ay += (wanderDy / wanderDist) * wanderForce;
      }

      // Noise + convection
      this.ax += noise2D(this.x * 0.003, this.age * 0.00008, 0) * 0.5;
      this.ay += noise2D(this.y * 0.003, this.age * 0.00008, 100) * 0.5;
      if (this.bounds) {
        const normalizedY = this.y / this.bounds.height;
        this.ay += (0.5 - normalizedY) * 0.3;
        this.ax += Math.sin(this.age * 0.0001 + this.x * 0.005) * 0.15;
      }

      // Interactions
      if (Array.isArray(allCells)) {
        for (const other of allCells) {
          if (!other || other.id === this.id || !isFinite(other.x) || !isFinite(other.y)) continue;
          const dx = this.x - other.x;
          const dy = this.y - other.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.1 && dist < 300) {
            const minDist = (this.size + other.size) * 0.9;
            if (other.color !== this.color && dist < minDist * 2) {
              const normalizedDist = dist / (minDist * 2);
              const repulsion = 1 / (1 + Math.exp((normalizedDist - 0.5) * CONFIG.physics.repulsionSoftness));
              this.ax += (dx / dist) * repulsion * 15 * dt;
              this.ay += (dy / dist) * repulsion * 15 * dt;
            } else if (other.color === this.color && dist < minDist * 0.8 && dist > minDist * 0.5) {
              const attraction = CONFIG.physics.attractionForce * (1 - dist / (minDist * 0.8));
              this.ax -= (dx / dist) * attraction;
              this.ay -= (dy / dist) * attraction;
            }
          }
        }
      }
    }

    // --- FUSION UPDATE ---
    if (this.fusionState !== 'none') {
      this.updateFusion(dt, allCells);
    }

    // --- FISSION UPDATE ---
    if (this.fissionState !== 'none') {
      this.updateFission(dt, allCells);
    }

    // Physics integration
    const maxAccel = CONFIG.physics.acceleration;
    const accelMag = Math.hypot(this.ax, this.ay);
    if (accelMag > maxAccel) {
      this.ax = (this.ax / accelMag) * maxAccel;
      this.ay = (this.ay / accelMag) * maxAccel;
    }
    this.vx += this.ax * dt * 60;
    this.vy += this.ay * dt * 60;
    this.vx *= CONFIG.physics.deceleration;
    this.vy *= CONFIG.physics.deceleration;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > CONFIG.physics.maxSpeed) {
      const factor = CONFIG.physics.maxSpeed / speed;
      this.vx *= factor;
      this.vy *= factor;
    }
    this.x += this.vx;
    this.y += this.vy;
    this.ax = 0;
    this.ay = 0;

    // Rotation
    if (Math.random() < 0.002) {
      this.targetRotationSpeed = (this.rnd() - 0.5) * CONFIG.physics.rotationMaxSpeed;
    }
    this.rotationSpeed = (this.rotationSpeed + (this.targetRotationSpeed - this.rotationSpeed) * CONFIG.physics.rotationAcceleration) * CONFIG.physics.rotationDamping;
    this.rotation += this.rotationSpeed;

    // Movement deformation (only when not in fission)
    if (this.fissionState === 'none') {
      const realVx = this.x - this.prevX;
      const realVy = this.y - this.prevY;
      const realSpeed = Math.hypot(realVx, realVy);
      if (realSpeed > 0.1) {
        const deformFactor = Math.min(1, realSpeed / CONFIG.physics.maxSpeed);
        this.stretchX += (1 + realVx * 0.02 * deformFactor - this.stretchX) * 0.03;
        this.stretchY += (1 + realVy * 0.02 * deformFactor - this.stretchY) * 0.03;
        this.skew += (Math.sin(Math.atan2(realVy, realVx)) * deformFactor * 0.1 - this.skew) * 0.02;
      } else {
        this.stretchX += (1 - this.stretchX) * 0.01;
        this.stretchY += (1 - this.stretchY) * 0.01;
        this.skew *= 0.99;
      }
    }

    // Point animation
    const realVx2 = this.x - this.prevX;
    const realVy2 = this.y - this.prevY;
    const realSpeed2 = Math.hypot(realVx2, realVy2);
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      const velocity = this.pointVelocities[i];
      const wave1 = Math.sin(this.age * 0.0015 + i * 0.8) * 0.08;
      const wave2 = Math.sin(this.age * 0.0008 + i * 1.3 + 2.0) * 0.05;
      const wave3 = Math.sin(this.age * 0.003 + i * 0.4) * 0.03;
      const movementInfluence = realSpeed2 * 0.04;
      const turbulence = (this.rnd() - 0.5) * 0.06 * (1 + movementInfluence);
      point.targetR = point.baseR * (1 + breathing + wave1 + wave2 + wave3) + turbulence;
      point.targetA = (this.rnd() - 0.5) * 0.25 * (1 + movementInfluence);
      velocity.r += (point.targetR - point.r) * 0.015;
      velocity.a += (point.targetA - point.a) * 0.012;
      velocity.r *= 0.90;
      velocity.a *= 0.90;
      point.r += velocity.r;
      point.a += velocity.a;
      point.r = Math.max(0.3, Math.min(1.8, point.r));
      point.a = Math.max(-0.6, Math.min(0.6, point.a));
    }

    // Out of bounds death
    if (this.bounds && (this.x < -200 || this.x > this.bounds.width + 200 || this.y < -200 || this.y > this.bounds.height + 200)) {
      this.opacity *= 0.95;
      if (this.opacity < 0.01) this.isDead = true;
    }
  }

  // ---- FUSION ----

  updateFusion(dt, allCells) {
    const partner = this.findPartner(allCells);
    if (!partner || partner.isDead) {
      this.resetFusion();
      return;
    }

    this.fusionTimer += dt;
    const progress = Math.min(1, this.fusionTimer / this.fusionDuration);
    const dx = partner.x - this.x;
    const dy = partner.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.fusionState === 'approaching') {
      const t = smoothstep(progress / CONFIG.fusion.approachPhase);
      // Mutual attraction
      if (dist > 1) {
        const force = t * 0.12;
        this.ax += (dx / dist) * force;
        this.ay += (dy / dist) * force;
      }
      // Pseudopod toward partner
      if (dist > 1) {
        const angleToPartner = Math.atan2(dy, dx);
        for (let i = 0; i < this.points.length; i++) {
          const pointAngle = (i / this.points.length) * Math.PI * 2 + this.rotation;
          const angleDiff = Math.abs(((pointAngle - angleToPartner + Math.PI) % (Math.PI * 2)) - Math.PI);
          if (angleDiff < CONFIG.fusion.pseudopodAngle) {
            const bulge = CONFIG.fusion.pseudopodStrength * t * (1 - angleDiff / CONFIG.fusion.pseudopodAngle);
            this.points[i].targetR = this.points[i].baseR + bulge;
          }
        }
      }
      // Transition to merging when close enough
      if (dist < (this.size + partner.size) * 0.3 || progress >= CONFIG.fusion.approachPhase) {
        this.fusionState = 'merging';
      }
    }

    if (this.fusionState === 'merging') {
      const mergeProgress = smoothstep((progress - CONFIG.fusion.approachPhase) / (1 - CONFIG.fusion.approachPhase));

      if (this.fusionRole === 'absorbed') {
        // Shrink toward partner
        this.scale = Math.max(0.05, 1 - mergeProgress * 0.95);
        if (dist > 1) {
          this.ax += (dx / dist) * 0.15;
          this.ay += (dy / dist) * 0.15;
        }
        if (this.scale < 0.1) {
          this.isDead = true;
        }
      } else {
        // Absorber grows toward target
        this.size += (this.fusionTargetSize - this.size) * 0.03;
        // Slight attraction to center of mass
        if (dist > 1) {
          this.ax += (dx / dist) * 0.02;
          this.ay += (dy / dist) * 0.02;
        }
        if (mergeProgress >= 1 || !partner || partner.isDead) {
          this.size = this.fusionTargetSize;
          this.resetFusion();
          this.lastFusionTime = this.age;
          for (let i = 0; i < this.points.length; i++) {
            this.points[i].baseR = 0.9 + this.rnd() * 0.2;
            this.points[i].targetR = this.points[i].baseR;
          }
        }
      }
    }
  }

  resetFusion() {
    this.fusionState = 'none';
    this.fusionPartnerId = null;
    this.fusionRole = null;
    this.fusionTimer = 0;
    this.fusionDuration = 0;
    this.fusionTargetSize = 0;
  }

  canFuseWith(other) {
    if (!other || other.isDead || this.isDead) return false;
    if (this.color !== other.color) return false;
    if (this.fusionState !== 'none' || other.fusionState !== 'none') return false;
    if (this.fissionState !== 'none' || other.fissionState !== 'none') return false;
    if ((this.age - this.lastFusionTime) < CONFIG.cooldown) return false;
    if ((other.age - other.lastFusionTime) < CONFIG.cooldown) return false;
    const dist = Math.hypot(this.x - other.x, this.y - other.y);
    return dist < (this.size + other.size) * 0.5;
  }

  // ---- FISSION ----

  updateFission(dt, allCells) {
    this.fissionProgress += dt / this.fissionDuration;
    if (this.fissionProgress > 1) this.fissionProgress = 1;
    const p = this.fissionProgress;

    const axCos = Math.cos(this.fissionAxis);
    const axSin = Math.sin(this.fissionAxis);

    if (p <= CONFIG.fission.elongateEnd) {
      // Phase 1: Elongate
      const t = smoothstep(p / CONFIG.fission.elongateEnd);
      const axisStretch = 1 + (CONFIG.fission.maxStretch - 1) * t;
      const perpStretch = 1 - (1 - CONFIG.fission.maxPerpCompress) * t;
      this.applyAxisStretch(axCos, axSin, axisStretch, perpStretch);
    } else if (p <= CONFIG.fission.pinchEnd) {
      // Phase 2: Pinch
      const t = smoothstep((p - CONFIG.fission.elongateEnd) / (CONFIG.fission.pinchEnd - CONFIG.fission.elongateEnd));
      const axisStretch = CONFIG.fission.maxStretch + 0.2 * t;
      const perpStretch = CONFIG.fission.maxPerpCompress;
      this.applyAxisStretch(axCos, axSin, axisStretch, perpStretch);
      // Pinch equator points
      for (let i = 0; i < this.points.length; i++) {
        const pointAngle = (i / this.points.length) * Math.PI * 2;
        const perpAngle1 = this.fissionAxis + Math.PI / 2;
        const perpAngle2 = this.fissionAxis - Math.PI / 2;
        const diff1 = Math.abs(((pointAngle - perpAngle1 + Math.PI) % (Math.PI * 2)) - Math.PI);
        const diff2 = Math.abs(((pointAngle - perpAngle2 + Math.PI) % (Math.PI * 2)) - Math.PI);
        const minDiff = Math.min(diff1, diff2);
        if (minDiff < Math.PI / 4) {
          const pinch = CONFIG.fission.pinchStrength * t * (1 - minDiff / (Math.PI / 4));
          this.points[i].targetR = this.points[i].baseR * (1 - pinch);
        }
      }
    } else {
      // Phase 3: Split - handled by animation loop creating child
      // Relax deformation
      const t = smoothstep((p - CONFIG.fission.pinchEnd) / (1 - CONFIG.fission.pinchEnd));
      const axisStretch = (CONFIG.fission.maxStretch + 0.2) * (1 - t) + 1 * t;
      const perpStretch = CONFIG.fission.maxPerpCompress * (1 - t) + 1 * t;
      this.applyAxisStretch(axCos, axSin, axisStretch, perpStretch);

      if (p >= 1) {
        this.fissionState = 'none';
        this.fissionProgress = 0;
        this.fissionChildCreated = false;
        this.lastFissionTime = this.age;
        this.stretchX = 1;
        this.stretchY = 1;
        this.skew = 0;
      }
    }
  }

  applyAxisStretch(axCos, axSin, axisStretch, perpStretch) {
    // Rotate stretch into axis-aligned space then back
    // stretchX/Y are in screen space, we need to project axis stretch
    this.stretchX = axCos * axCos * axisStretch + axSin * axSin * perpStretch;
    this.stretchY = axSin * axSin * axisStretch + axCos * axCos * perpStretch;
    this.skew = axCos * axSin * (axisStretch - perpStretch) * 0.3;
  }

  startFission() {
    this.fissionState = 'elongating';
    this.fissionProgress = 0;
    this.fissionChildCreated = false;
    this.fissionChildId = null;
    const spd = Math.hypot(this.vx, this.vy);
    this.fissionAxis = spd > 0.5 ? Math.atan2(this.vy, this.vx) : this.rnd() * Math.PI * 2;
    this.fissionDuration = CONFIG.fission.baseDuration + this.size / CONFIG.fission.sizeFactor;
  }

  createFissionChild(bounds) {
    const area = Math.PI * this.size * this.size;
    const newSize = Math.sqrt(area / 2 / Math.PI);
    const ejectDist = newSize * 0.5;
    const child = new OrganicCell({
      x: this.x + Math.cos(this.fissionAxis) * ejectDist,
      y: this.y + Math.sin(this.fissionAxis) * ejectDist,
      color: this.color,
      size: newSize,
      rnd: this.rnd,
      id: `cell_${Date.now()}_fiss_${Math.random().toString(36).slice(2, 6)}`,
      bounds,
      fromEdge: false,
      pointCount: this.pointCount,
    });
    child.scale = 0.3;
    child.opacity = 1;
    child.vx = Math.cos(this.fissionAxis) * CONFIG.fission.ejectSpeed;
    child.vy = Math.sin(this.fissionAxis) * CONFIG.fission.ejectSpeed;
    child.lastFissionTime = child.age;

    // Shrink parent, push opposite
    this.size = newSize;
    this.vx -= Math.cos(this.fissionAxis) * CONFIG.fission.ejectSpeed;
    this.vy -= Math.sin(this.fissionAxis) * CONFIG.fission.ejectSpeed;
    this.fissionChildCreated = true;
    this.fissionChildId = child.id;

    return child;
  }

  getPath() {
    if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.size) || !isFinite(this.scale)) return '';
    const pts = [];
    const n = this.points.length;
    if (n < 3) return '';
    for (let i = 0; i < n; i++) {
      const point = this.points[i];
      const angle = (i / n) * Math.PI * 2 + (isFinite(point.a) ? point.a : 0) + (isFinite(this.rotation) ? this.rotation : 0);
      let px = Math.cos(angle) * (isFinite(point.r) ? point.r : 1);
      let py = Math.sin(angle) * (isFinite(point.r) ? point.r : 1);
      px *= this.stretchX;
      py *= this.stretchY;
      px += py * this.skew;
      px *= this.size * this.scale;
      py *= this.size * this.scale;
      const fx = this.x + px;
      const fy = this.y + py;
      if (!isFinite(fx) || !isFinite(fy)) return '';
      pts.push([fx, fy]);
    }
    let path = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    const tension = 0.4 + smoothstep(Math.min(1, this.age / 3000)) * 0.4;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension / 3;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension / 3;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension / 3;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension / 3;
      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return path + ' Z';
  }
}

/* ================= FUSION INIT ================= */
function initiateFusion(a, b) {
  const areaA = Math.PI * a.size * a.size;
  const areaB = Math.PI * b.size * b.size;
  const combinedSize = Math.sqrt((areaA + areaB) / Math.PI);
  const duration = CONFIG.fusion.baseDuration + (a.size + b.size) / CONFIG.fusion.sizeFactor;

  const absorber = a.size >= b.size ? a : b;
  const absorbed = a.size >= b.size ? b : a;

  absorber.fusionState = 'approaching';
  absorber.fusionPartnerId = absorbed.id;
  absorber.fusionRole = 'absorber';
  absorber.fusionTimer = 0;
  absorber.fusionDuration = duration;
  absorber.fusionTargetSize = combinedSize;

  absorbed.fusionState = 'approaching';
  absorbed.fusionPartnerId = absorber.id;
  absorbed.fusionRole = 'absorbed';
  absorbed.fusionTimer = 0;
  absorbed.fusionDuration = duration;
  absorbed.fusionTargetSize = 0;
}

/* ================= PAGE SIZE HOOK ================= */
function usePageSize() {
  const sizeRef = useRef({ width: 1200, height: 800 });
  const cbRef = useRef(null);

  useEffect(() => {
    function updateSize() {
      const docHeight = Math.max(
        document.body.scrollHeight, document.body.offsetHeight,
        document.documentElement.clientHeight, document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      sizeRef.current = { width: window.innerWidth, height: docHeight };
      if (cbRef.current) cbRef.current(sizeRef.current);
    }
    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(document.body);
    window.addEventListener('resize', updateSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return { sizeRef, cbRef };
}

/* ================= COMPONENT ================= */
export default function MatisseWallpaper() {
  const { sizeRef, cbRef } = usePageSize();
  const gRef = useRef(null);
  const cellsRef = useRef([]);
  const domMapRef = useRef(new Map());
  const rafRef = useRef(0);
  const coverageCheckRef = useRef(0);
  const initRef = useRef(false);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const pointCount = isMobile ? CONFIG.animation.pointCountMobile : CONFIG.animation.pointCount;
  const blurValue = isMobile ? CONFIG.gooey.blurMobile : CONFIG.gooey.blur;

  const rnd = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return mulberry32(arr[0] >>> 0);
    }
    return mulberry32(Date.now() >>> 0);
  }, []);

  // Sync DOM imperatively
  const syncDOM = (cells) => {
    const g = gRef.current;
    if (!g) return;
    const map = domMapRef.current;
    const activeIds = new Set();

    for (const cell of cells) {
      activeIds.add(cell.id);
      const d = cell.getPath();
      if (!d) continue;

      let el = map.get(cell.id);
      if (!el) {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('fill', CONFIG.colors[cell.color]);
        el.style.willChange = 'd';
        g.appendChild(el);
        map.set(cell.id, el);
      }
      el.setAttribute('d', d);
      el.setAttribute('opacity', cell.opacity);
    }

    // Remove dead elements
    for (const [id, el] of map) {
      if (!activeIds.has(id)) {
        el.remove();
        map.delete(id);
      }
    }
  };

  // Update SVG dimensions
  const updateSvgSize = (size) => {
    if (svgRef.current) {
      svgRef.current.setAttribute('height', size.height);
      svgRef.current.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
    }
    if (containerRef.current) {
      containerRef.current.style.height = `${size.height}px`;
    }
  };

  useEffect(() => {
    cbRef.current = updateSvgSize;
    const { width: docW, height: docH } = sizeRef.current;
    if (!docW || !docH || initRef.current) return;
    initRef.current = true;

    updateSvgSize(sizeRef.current);

    // Initialize cells
    const bounds = { width: docW, height: docH };
    const cells = [];
    const colors = ['olive', 'terra', 'sable'];
    const margin = 80;
    const placed = [];

    for (let i = 0; i < CONFIG.initialCount; i++) {
      const color = colors[i % colors.length];
      const { min, max } = CONFIG.sizes[color];
      const size = min + rnd() * (max - min);
      let x, y, attempts = 0;
      do {
        x = margin + rnd() * (docW - margin * 2);
        y = margin + rnd() * (docH - margin * 2);
        attempts++;
      } while (attempts < 30 && placed.some(p => Math.hypot(p.x - x, p.y - y) < (p.size + size) * 0.8));

      placed.push({ x, y, size });
      cells.push(new OrganicCell({
        x, y, color, size, rnd,
        id: `cell_${Date.now()}_${i}`,
        bounds,
        fromEdge: false,
        pointCount,
      }));
    }
    cellsRef.current = cells;

    // Animation loop
    const frameInterval = 1000 / CONFIG.animation.fps;
    let last = 0;
    let acc = 0;

    const animate = (t) => {
      if (!last) last = t;
      const elapsed = Math.min(t - last, 100); // cap to avoid spiral
      last = t;
      acc += elapsed;

      while (acc >= frameInterval) {
        const cells = cellsRef.current;
        const bounds = sizeRef.current;

        // Update all cells
        for (const cell of cells) {
          cell.bounds = bounds;
          cell.update(frameInterval, cells);
        }

        // Purge dead / NaN
        cellsRef.current = cells.filter(c =>
          !c.isDead && isFinite(c.x) && isFinite(c.y) && isFinite(c.size) && isFinite(c.scale)
        );

        // Fusion detection (both stay in array)
        const cur = cellsRef.current;
        for (let i = 0; i < cur.length; i++) {
          if (cur[i].fusionState !== 'none') continue;
          for (let j = i + 1; j < cur.length; j++) {
            if (cur[j].fusionState !== 'none') continue;
            if (cur[i].canFuseWith(cur[j])) {
              initiateFusion(cur[i], cur[j]);
            }
          }
        }

        // Fission
        const toAdd = [];
        for (const cell of cellsRef.current) {
          // Trigger fission
          if (cell.fissionState === 'none' &&
              cell.fusionState === 'none' &&
              cell.size > cell.baseSize * CONFIG.physics.fissionThreshold &&
              (cell.age - cell.lastFissionTime) > CONFIG.cooldown &&
              cellsRef.current.length < CONFIG.maxCells) {
            cell.startFission();
          }
          // Create child at split point
          if (cell.fissionState !== 'none' &&
              cell.fissionProgress >= CONFIG.fission.pinchEnd &&
              !cell.fissionChildCreated) {
            toAdd.push(cell.createFissionChild(bounds));
          }
        }
        if (toAdd.length) cellsRef.current.push(...toAdd);

        // Coverage control
        coverageCheckRef.current += frameInterval;
        if (coverageCheckRef.current >= CONFIG.coverage.checkInterval) {
          coverageCheckRef.current = 0;
          const cur2 = cellsRef.current;
          let area = 0;
          for (const c of cur2) area += Math.PI * (c.size * c.scale) ** 2;
          const coverage = area / Math.max(1, bounds.width * bounds.height);

          if (coverage < CONFIG.coverage.min && cur2.length < CONFIG.maxCells) {
            const color = colors[Math.floor(rnd() * colors.length)];
            const { min, max } = CONFIG.sizes[color];
            const size = min + rnd() * (max - min);
            cur2.push(new OrganicCell({
              x: 0, y: 0, color, size, rnd,
              id: `cell_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              bounds, fromEdge: true, pointCount,
            }));
          } else if (coverage > CONFIG.coverage.max && cur2.length > CONFIG.minCells) {
            for (const c of cur2) {
              if (c.x < 100 || c.x > bounds.width - 100 || c.y < 100 || c.y > bounds.height - 100) {
                c.opacity *= 0.98;
                if (c.opacity < 0.01) c.isDead = true;
              }
            }
            cellsRef.current = cur2.filter(c => !c.isDead);
          }
        }

        // Sync DOM
        syncDOM(cellsRef.current);
        acc -= frameInterval;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      // Cleanup DOM elements
      const g = gRef.current;
      if (g) while (g.firstChild) g.removeChild(g.firstChild);
      domMapRef.current.clear();
    };
  }, [rnd, pointCount, blurValue]);

  const { width: initW, height: initH } = sizeRef.current;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: '100%',
        height: `${initH}px`,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height={initH}
        viewBox={`0 0 ${initW} ${initH}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ background: CONFIG.colors.bg, transform: 'translateZ(0)' }}
      >
        <defs>
          <filter id="organic" x="-50%" y="-50%" width="200%" height="200%"
                  colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blurValue} result="blur" />
            <feColorMatrix
              in="blur" type="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${CONFIG.gooey.matrixThreshold} ${CONFIG.gooey.matrixOffset}`}
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
        <g ref={gRef} filter="url(#organic)" />
      </svg>
    </div>
  );
}
