'use client';
import { useEffect, useMemo, useState, useRef } from "react";

/* ================= CONFIGURATION ================= */
const CONFIG = {
  colors: {
    bg: "var(--cream-100, #f4efe6)",
    olive: "var(--olive-500, #6e8b5e)",
    terra: "var(--terra-500, #c08a5a)",
    sable: "var(--sable-300, #e2c98f)",
  },
  
  // Tailles de base des cellules (plus de variété)
  sizes: {
    olive: { min: 80, max: 120 },
    terra: { min: 70, max: 100 },
    sable: { min: 90, max: 140 },
  },
  
  // Nombre de cellules et couverture
  coverage: {
    min: 0.3, // 30% de couverture minimum
    max: 0.6, // 60% de couverture maximum
    target: 0.45, // Cible idéale
    checkInterval: 2000, // Vérifier toutes les 2 secondes
  },
  initialCount: 10,
  minCells: 8,
  maxCells: 25,
  
  // Physique organique
  physics: {
    baseSpeed: 8, // Vitesse réduite pour plus de fluidité
    maxSpeed: 15,
    viscosity: 0.96, // Viscosité du milieu (comme dans un fluide)
    turbulence: 0.3, // Force de turbulence
    rotationInertia: 0.98, // Inertie de rotation
    deformationResponse: 0.4, // Réponse de déformation au mouvement
  },
  
  // Animation organique
  animation: {
    fps: 60, // 60 FPS pour ultra smooth
    breathingSpeed: 0.0008, // Respiration très lente
    morphSmoothness: 0.015, // Lissage du morphing
    tensionRelaxation: 0.02, // Relaxation de la tension
    pointCount: 12, // Plus de points pour plus de fluidité
  }
};

/* ================= UTILS ================= */
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fonction d'interpolation smooth (ease in-out)
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// Noise Perlin simplifié pour mouvement organique
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
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];
  
  const hash = (x, y) => {
    const h = (x * 374761393 + y * 668265263 + seed * 1013904223) & 0x7fffffff;
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
  
  const nx0 = mix(n00, n10, u);
  const nx1 = mix(n01, n11, u);
  
  return mix(nx0, nx1, v);
}

/* ================= CLASSE CELLULE ORGANIQUE ================= */
class OrganicCell {
  constructor({ x, y, color, size, rnd, id, bounds, fromEdge = false }) {
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
    
    // Physique fluide
    this.vx = 0;
    this.vy = 0;
    this.ax = 0; // Accélération
    this.ay = 0;
    
    // Rotation organique
    this.rotation = rnd() * Math.PI * 2;
    this.rotationSpeed = 0;
    this.rotationAccel = 0;
    this.targetRotationSpeed = (rnd() - 0.5) * 0.05;
    
    // État de respiration
    this.breathPhase = rnd() * Math.PI * 2;
    this.breathRate = 0.5 + rnd() * 0.5; // Vitesse de respiration variable
    this.breathAmplitude = 0.03 + rnd() * 0.02;
    
    // Animation
    this.scale = fromEdge ? 0.1 : 1;
    this.opacity = fromEdge ? 0 : 1;
    
    // Forme organique avec tension
    this.points = [];
    this.pointVelocities = [];
    this.pointTensions = [];
    const numPoints = CONFIG.animation.pointCount;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = 0.9 + rnd() * 0.2;
      
      this.points.push({
        r: radius,
        a: 0,
        targetR: radius,
        targetA: 0
      });
      
      this.pointVelocities.push({ r: 0, a: 0 });
      this.pointTensions.push(0);
    }
    
    // États de déformation
    this.stretchX = 1;
    this.stretchY = 1;
    this.skew = 0;
    
    // Fusion organique
    this.isFusing = false;
    this.fusionPartner = null;
    this.fusionProgress = 0;
    
    // Turbulence locale
    this.turbulencePhase = rnd() * Math.PI * 2;
    this.turbulenceSpeed = 0.001 + rnd() * 0.002;
    
    if (fromEdge) {
      this.spawnFromEdge();
    }
  }
  
  spawnFromEdge() {
    const side = Math.floor(this.rnd() * 4);
    const margin = 50;
    
    switch(side) {
      case 0: // Haut
        this.x = this.rnd() * this.bounds.width;
        this.y = -margin;
        this.vx = (this.rnd() - 0.5) * 2;
        this.vy = 2 + this.rnd() * 2;
        break;
      case 1: // Droite
        this.x = this.bounds.width + margin;
        this.y = this.rnd() * this.bounds.height;
        this.vx = -(2 + this.rnd() * 2);
        this.vy = (this.rnd() - 0.5) * 2;
        break;
      case 2: // Bas
        this.x = this.rnd() * this.bounds.width;
        this.y = this.bounds.height + margin;
        this.vx = (this.rnd() - 0.5) * 2;
        this.vy = -(2 + this.rnd() * 2);
        break;
      case 3: // Gauche
        this.x = -margin;
        this.y = this.rnd() * this.bounds.height;
        this.vx = 2 + this.rnd() * 2;
        this.vy = (this.rnd() - 0.5) * 2;
        break;
    }
  }
  
  updateWanderTarget() {
    // Vérifier que les bounds existent
    if (!this.bounds) return;
    
    // Nouveau point d'exploration dans un rayon
    const angle = this.wanderAngle + (this.rnd() - 0.5) * Math.PI * 0.5;
    const dist = CONFIG.physics.wanderRadius * (0.5 + this.rnd() * 0.5);
    
    // S'assurer que la cible reste dans les limites
    const targetX = this.x + Math.cos(angle) * dist;
    const targetY = this.y + Math.sin(angle) * dist;
    
    this.wanderTarget = {
      x: Math.max(50, Math.min(this.bounds.width - 50, targetX)),
      y: Math.max(50, Math.min(this.bounds.height - 50, targetY))
    };
    this.wanderAngle = angle;
  }
  
  update(deltaTime, allCells) {
    const dt = deltaTime / 1000;
    this.age += deltaTime;
    
    // Sauvegarder position précédente
    this.prevX = this.x;
    this.prevY = this.y;
    
    // Fade in ultra smooth
    if (this.scale < 1) {
      const scaleSpeed = 0.005 + smoothstep(this.scale) * 0.01;
      this.scale = Math.min(1, this.scale + scaleSpeed);
      this.opacity = Math.min(1, this.opacity + scaleSpeed);
    }
    
    // Respiration naturelle
    this.breathPhase += CONFIG.animation.breathingSpeed * this.breathRate * deltaTime;
    const breathing = Math.sin(this.breathPhase) * this.breathAmplitude;
    
    // === EXPLORATION AUTONOME ===
    // Mise à jour occasionnelle de la cible d'exploration
    if (Math.random() < 0.01 || 
        Math.abs(this.x - this.wanderTarget.x) < 20 && 
        Math.abs(this.y - this.wanderTarget.y) < 20) {
      this.updateWanderTarget();
    }
    
    // Force d'exploration vers la cible (très douce)
    const wanderDx = this.wanderTarget.x - this.x;
    const wanderDy = this.wanderTarget.y - this.y;
    const wanderDist = Math.sqrt(wanderDx * wanderDx + wanderDy * wanderDy);
    
    if (wanderDist > 1) {
      const wanderForce = CONFIG.physics.wanderStrength * smoothstep(Math.min(1, wanderDist / 200));
      this.ax += (wanderDx / wanderDist) * wanderForce;
      this.ay += (wanderDy / wanderDist) * wanderForce;
    }
    
    // Bruit organique pour le mouvement (plus subtil)
    const noiseX = noise2D(this.x * 0.005, this.age * 0.00005, 0) * 0.2;
    const noiseY = noise2D(this.y * 0.005, this.age * 0.00005, 100) * 0.2;
    this.ax += noiseX;
    this.ay += noiseY;
    
    // === INTERACTIONS AVEC LES AUTRES CELLULES ===
    allCells.forEach(other => {
      if (other.id !== this.id) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0.1 && dist < 300) {
          const minDist = (this.size + other.size) * 0.9;
          
          if (other.color !== this.color && dist < minDist * 2) {
            // Répulsion ultra douce avec fonction sigmoïde
            const normalizedDist = dist / (minDist * 2);
            const repulsion = 1 / (1 + Math.exp((normalizedDist - 0.5) * CONFIG.physics.repulsionSoftness));
            const force = repulsion * 15;
            this.ax += (dx / dist) * force * dt;
            this.ay += (dy / dist) * force * dt;
          } else if (other.color === this.color && dist < minDist * 0.8 && dist > minDist * 0.5) {
            // Attraction très légère pour cohésion (pas fusion immédiate)
            const attraction = CONFIG.physics.attractionForce * (1 - dist / (minDist * 0.8));
            this.ax -= (dx / dist) * attraction;
            this.ay -= (dy / dist) * attraction;
          }
        }
      }
    });
    
    // === ACCÉLÉRATION ET VITESSE PROGRESSIVES ===
    // Limiter l'accélération pour éviter les mouvements brusques
    const maxAccel = CONFIG.physics.acceleration;
    const accelMag = Math.sqrt(this.ax * this.ax + this.ay * this.ay);
    if (accelMag > maxAccel) {
      this.ax = (this.ax / accelMag) * maxAccel;
      this.ay = (this.ay / accelMag) * maxAccel;
    }
    
    // Intégration de la vitesse avec accélération progressive
    this.vx += this.ax * dt * 60;
    this.vy += this.ay * dt * 60;
    
    // Décélération naturelle (friction)
    this.vx *= CONFIG.physics.deceleration;
    this.vy *= CONFIG.physics.deceleration;
    
    // Limiter la vitesse en douceur
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > CONFIG.physics.maxSpeed) {
      const factor = CONFIG.physics.maxSpeed / speed;
      this.vx *= factor;
      this.vy *= factor;
    }
    
    // Mise à jour position
    this.x += this.vx;
    this.y += this.vy;
    
    // Reset accélération pour le prochain frame
    this.ax = 0;
    this.ay = 0;
    
    // === ROTATION ULTRA PROGRESSIVE ===
    // Changement très occasionnel et doux de la cible de rotation
    if (Math.random() < 0.002) {
      this.targetRotationSpeed = (this.rnd() - 0.5) * CONFIG.physics.rotationMaxSpeed;
    }
    
    // Accélération rotationnelle progressive
    const rotationAccel = (this.targetRotationSpeed - this.rotationSpeed) * CONFIG.physics.rotationAcceleration;
    this.rotationSpeed += rotationAccel;
    this.rotationSpeed *= CONFIG.physics.rotationDamping; // Amortissement
    this.rotation += this.rotationSpeed;
    
    // === DÉFORMATION BASÉE SUR LE MOUVEMENT ===
    const realVx = this.x - this.prevX;
    const realVy = this.y - this.prevY;
    const realSpeed = Math.sqrt(realVx * realVx + realVy * realVy);
    
    // Déformation très progressive
    if (realSpeed > 0.1) {
      const deformFactor = Math.min(1, realSpeed / CONFIG.physics.maxSpeed);
      const targetStretchX = 1 + realVx * 0.02 * deformFactor;
      const targetStretchY = 1 + realVy * 0.02 * deformFactor;
      
      this.stretchX += (targetStretchX - this.stretchX) * 0.03;
      this.stretchY += (targetStretchY - this.stretchY) * 0.03;
      
      // Légère inclinaison dans la direction du mouvement
      const movementAngle = Math.atan2(realVy, realVx);
      const targetSkew = Math.sin(movementAngle) * deformFactor * 0.1;
      this.skew += (targetSkew - this.skew) * 0.02;
    } else {
      // Retour très lent à la forme normale
      this.stretchX += (1 - this.stretchX) * 0.01;
      this.stretchY += (1 - this.stretchY) * 0.01;
      this.skew *= 0.99;
    }
    
    // === ANIMATION DES POINTS POUR FORME IRRÉGULIÈRE ===
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      const velocity = this.pointVelocities[i];
      
      // Oscillation naturelle avec phases différentes
      const wavePhase = this.age * 0.001 + i * 0.5;
      const wave = Math.sin(wavePhase) * 0.05;
      
      // Cible avec variation et mouvement
      const movementInfluence = realSpeed * 0.02;
      point.targetR = point.baseR * (1 + breathing + wave) + (this.rnd() - 0.5) * 0.05 * (1 + movementInfluence);
      point.targetA = (this.rnd() - 0.5) * 0.2 * (1 + movementInfluence);
      
      // Animation avec inertie
      velocity.r += (point.targetR - point.r) * 0.008;
      velocity.a += (point.targetA - point.a) * 0.008;
      velocity.r *= 0.92; // Amortissement
      velocity.a *= 0.92;
      
      point.r += velocity.r;
      point.a += velocity.a;
      
      // Limites pour éviter les déformations extrêmes
      point.r = Math.max(0.3, Math.min(1.7, point.r));
      point.a = Math.max(-0.5, Math.min(0.5, point.a));
    }
    
    // Gestion de la fusion
    if (this.isFusing && this.fusionPartner) {
      this.fusionProgress += dt * 2; // 0.5 seconde pour fusion complète
      
      if (this.fusionProgress >= 1) {
        this.completeFusion();
      } else {
        // Mouvement vers le partenaire avec déformation
        const t = smoothstep(this.fusionProgress);
        const dx = this.fusionPartner.x - this.x;
        const dy = this.fusionPartner.y - this.y;
        
        this.vx += dx * t * 0.1;
        this.vy += dy * t * 0.1;
        
        // Déformation pendant la fusion
        this.stretchX = 1 + dx * 0.001 * t;
        this.stretchY = 1 + dy * 0.001 * t;
      }
    }
    
    // Mort hors limites
    if (this.x < -200 || this.x > this.bounds.width + 200 ||
        this.y < -200 || this.y > this.bounds.height + 200) {
      this.opacity *= 0.95;
      if (this.opacity < 0.01) {
        this.isDead = true;
      }
    }
  }
  
  canFuseWith(other) {
    if (this.color !== other.color) return false;
    if (this.isFusing || other.isFusing) return false;
    
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = (this.size + other.size) * 0.5;
    
    return dist < minDist;
  }
  
  startFusion(other) {
    this.isFusing = true;
    this.fusionPartner = other;
    this.fusionProgress = 0;
  }
  
  completeFusion() {
    if (!this.fusionPartner) return;
    
    // Conservation de la surface
    const area1 = Math.PI * this.size * this.size;
    const area2 = Math.PI * this.fusionPartner.size * this.fusionPartner.size;
    const newArea = area1 + area2;
    this.size = Math.sqrt(newArea / Math.PI);
    
    // Conservation de la quantité de mouvement
    const m1 = area1;
    const m2 = area2;
    const totalMass = m1 + m2;
    this.vx = (this.vx * m1 + this.fusionPartner.vx * m2) / totalMass;
    this.vy = (this.vy * m1 + this.fusionPartner.vy * m2) / totalMass;
    
    // Position pondérée
    this.x = (this.x * m1 + this.fusionPartner.x * m2) / totalMass;
    this.y = (this.y * m1 + this.fusionPartner.y * m2) / totalMass;
    
    // Reset
    this.isFusing = false;
    this.fusionPartner = null;
    this.fusionProgress = 0;
    
    // Nouvelle forme après fusion
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].targetR = 0.9 + this.rnd() * 0.2;
      this.points[i].targetA = (this.rnd() - 0.5) * 0.1;
    }
  }
  
  getPath() {
    const points = [];
    const numPoints = this.points.length;
    
    if (numPoints < 3) return '';
    
    for (let i = 0; i < numPoints; i++) {
      const point = this.points[i];
      if (!point) continue;
      
      const angle = (i / numPoints) * Math.PI * 2 + point.a + this.rotation;
      
      // Appliquer les déformations
      let x = Math.cos(angle) * point.r;
      let y = Math.sin(angle) * point.r;
      
      // Étirement
      x *= this.stretchX;
      y *= this.stretchY;
      
      // Skew
      x += y * this.skew;
      
      // Échelle finale
      x *= this.size * this.scale;
      y *= this.size * this.scale;
      
      points.push([this.x + x, this.y + y]);
    }
    
    if (points.length < 3) return '';
    
    // Courbe de Bézier ultra smooth avec tension variable
    let path = `M ${points[0][0]},${points[0][1]}`;
    const tension = 0.4 + smoothstep(Math.min(1, this.age / 3000)) * 0.4; // Tension progressive
    
    for (let i = 0; i < points.length; i++) {
      const p0 = points[(i - 1 + points.length) % points.length];
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const p3 = points[(i + 2) % points.length];
      
      if (!p1 || !p2 || !p0 || !p3) continue;
      
      // Tangentes Catmull-Rom
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension / 3;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension / 3;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension / 3;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension / 3;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    
    return path + ' Z';
  }
}

/* ================= HOOK TAILLE PAGE ================= */
function usePageSize() {
  const [size, setSize] = useState({ width: 1200, height: 800 });
  
  useEffect(() => {
    function updateSize() {
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      setSize({ 
        width: window.innerWidth,
        height: docHeight
      });
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
  
  return size;
}

/* ================= COMPOSANT PRINCIPAL ================= */
export default function MatisseWallpaper() {
  const [cells, setCells] = useState([]);
  const { width: docW, height: docH } = usePageSize();
  const animationRef = useRef();
  const lastTimeRef = useRef(performance.now());
  const coverageCheckRef = useRef(0);
  
  const rnd = useMemo(() => {
    const seed = typeof crypto !== "undefined" && crypto.getRandomValues ? 
      crypto.getRandomValues(new Uint32Array(1))[0] : Date.now();
    return mulberry32(seed);
  }, []);
  
  // Calculer la couverture
  const calculateCoverage = (cellList, width, height) => {
    const totalArea = width * height;
    let cellsArea = 0;
    
    cellList.forEach(cell => {
      cellsArea += Math.PI * cell.size * cell.size * cell.scale * cell.scale;
    });
    
    return cellsArea / totalArea;
  };
  
  // Initialisation
  useEffect(() => {
    const bounds = { width: docW, height: docH };
    const newCells = [];
    const colors = ['olive', 'terra', 'sable'];
    
    const cols = 4;
    const rows = 3;
    const cellWidth = docW / cols;
    const cellHeight = docH / rows;
    
    for (let i = 0; i < CONFIG.initialCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const color = colors[i % colors.length];
      const sizeRange = CONFIG.sizes[color];
      const size = sizeRange.min + rnd() * (sizeRange.max - sizeRange.min);
      
      const x = (col + 0.5) * cellWidth + (rnd() - 0.5) * cellWidth * 0.4;
      const y = (row + 0.5) * cellHeight + (rnd() - 0.5) * cellHeight * 0.4;
      
      newCells.push(new OrganicCell({
        x: Math.max(100, Math.min(docW - 100, x)),
        y: Math.max(100, Math.min(docH - 100, y)),
        color,
        size,
        rnd,
        id: `cell_${Date.now()}_${i}`,
        bounds,
        fromEdge: false
      }));
    }
    
    setCells(newCells);
  }, [rnd, docW, docH]);
  
  // Animation loop
  useEffect(() => {
    if (cells.length === 0) return;
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTimeRef.current;
      
      if (deltaTime >= 1000 / CONFIG.animation.fps) {
        setCells(currentCells => {
          let newCells = [...currentCells];
          const bounds = { width: docW, height: docH };
          
          // Update
          newCells.forEach(cell => cell.update(deltaTime, newCells));
          
          // Remove dead
          newCells = newCells.filter(cell => !cell.isDead);
          
          // Fusion
          const toRemove = new Set();
          for (let i = 0; i < newCells.length; i++) {
            if (toRemove.has(i)) continue;
            for (let j = i + 1; j < newCells.length; j++) {
              if (toRemove.has(j)) continue;
              if (newCells[i].canFuseWith(newCells[j])) {
                newCells[i].startFusion(newCells[j]);
                toRemove.add(j);
              }
            }
          }
          newCells = newCells.filter((_, idx) => !toRemove.has(idx));
          
          // Coverage check
          coverageCheckRef.current += deltaTime;
          if (coverageCheckRef.current >= CONFIG.coverage.checkInterval) {
            coverageCheckRef.current = 0;
            const coverage = calculateCoverage(newCells, docW, docH);
            
            // Spawn si nécessaire
            if (coverage < CONFIG.coverage.min && newCells.length < CONFIG.maxCells) {
              const colors = ['olive', 'terra', 'sable'];
              const color = colors[Math.floor(rnd() * colors.length)];
              const sizeRange = CONFIG.sizes[color];
              const size = sizeRange.min + rnd() * (sizeRange.max - sizeRange.min);
              
              newCells.push(new OrganicCell({
                x: 0, y: 0,
                color,
                size,
                rnd,
                id: `cell_${Date.now()}_${Math.random()}`,
                bounds,
                fromEdge: true
              }));
            }
          }
          
          return newCells;
        });
        
        lastTimeRef.current = currentTime;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cells.length, rnd, docW, docH]);
  
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: '100%',
        height: `${docH}px`,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden"
      }}
    >
      <svg
        width="100%"
        height={docH}
        viewBox={`0 0 ${docW} ${docH}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          background: CONFIG.colors.bg,
          transform: 'translateZ(0)'
        }}
      >
        <defs>
          <filter id="organic" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix 
              in="blur" 
              type="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" 
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
        
        <g filter="url(#organic)">
          {cells.map(cell => (
            <path
              key={cell.id}
              d={cell.getPath()}
              fill={CONFIG.colors[cell.color]}
              opacity={cell.opacity}
              style={{
                transition: 'none',
                willChange: 'transform'
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
