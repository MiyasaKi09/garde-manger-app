'use client';
import { useEffect, useMemo, useState, useRef } from "react";

/* ================= REGLAGES ================= */
const CONFIG = {
  tileWidth: 1000,
  colors: {
    bg:    "var(--cream-100, #f4efe6)",
    olive: "var(--olive-500, #6e8b5e)",
    terra: "var(--terra-500, #c08a5a)",
    sable: "var(--sable-300, #e2c98f)",
  },
  counts: { olive: 4, terra: 3, sable: 4 }, // Nombre initial de cellules
  sizes: {
    olive: { rx: 160, ry: 220 },
    terra: { rx: 130, ry: 180 },
    sable: { rx: 200, ry: 260 },
  },
  shape: {
    points: 6, // Peu de points pour des formes lisses
    tension: 0.95, // Tension maximale pour ultra-lissage
    variability: 0.4, // Variabilité dans les formes
  },
  // Animation avec vie cellulaire
  life: {
    updateInterval: 50, // 20 FPS
    deformationSpeed: 0.008,
    rotationSpeed: 0.1,
    movementSpeed: 2.0, // Vitesse de base du mouvement
    
    // Vie cellulaire
    fusionDistance: 180,
    fusionProbability: 0.08,
    splitThreshold: 1.8,
    splitProbability: 0.05,
    
    // Dilatation/compression
    minScale: 0.4,
    maxScale: 2.0,
    scaleSpeed: 0.02,
    
    // Pulsation variable
    pulseSpeedMin: 0.2,
    pulseSpeedMax: 2.0,
    pulseAmplitude: 0.12,
    
    // Spawn et disparition
    spawnRate: 0.003,
    maxBlobs: 20,
    boundaryMargin: 400, // Zone hors écran pour spawn/despawn
  }
};

/* ================= RNG ================= */
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randBetween = (rnd, a, b) => a + rnd() * (b - a);

/* ========== Forme ultra-lisse avec Bézier ========== */
function toCubicPath(points, tension = 0.95) {
  const n = points.length;
  if (n < 3) return '';
  
  let d = `M ${points[0][0]},${points[0][1]}`;
  
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    
    const d1x = (p2[0] - p0[0]) * tension;
    const d1y = (p2[1] - p0[1]) * tension;
    const d2x = (p3[0] - p1[0]) * tension;
    const d2y = (p3[1] - p1[1]) * tension;
    
    const c1x = p1[0] + d1x / 3;
    const c1y = p1[1] + d1y / 3;
    const c2x = p2[0] - d2x / 3;
    const c2y = p2[1] - d2y / 3;
    
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d + " Z";
}

class MorphingBlob {
  constructor({ cx, cy, rx, ry, colorKey, rnd, id, viewBounds, startFromEdge = false }) {
    this.id = id;
    this.cx = cx;
    this.cy = cy;
    this.baseRx = rx;
    this.baseRy = ry;
    this.colorKey = colorKey;
    this.rnd = rnd;
    this.viewBounds = viewBounds;
    this.isDead = false;
    this.age = 0; // Age du blob pour gérer l'apparition/disparition
    
    // Si spawn depuis le bord
    if (startFromEdge) {
      this.spawnFromEdge();
      this.scale = 0.3; // Commence petit
      this.opacity = 0; // Commence invisible
    } else {
      // Blobs initiaux
      this.scale = 0.7 + rnd() * 0.4;
      this.opacity = 0.8; // Visible directement
    }
    
    this.targetScale = 0.8 + rnd() * 0.6;
    this.targetOpacity = 0.6 + rnd() * 0.3;
    
    // Pulsation unique
    this.pulseSpeed = CONFIG.life.pulseSpeedMin + 
                      rnd() * (CONFIG.life.pulseSpeedMax - CONFIG.life.pulseSpeedMin);
    this.pulsePhase = rnd() * Math.PI * 2;
    
    // Rotation
    this.rotation = rnd() * Math.PI * 2;
    this.rotationSpeed = (rnd() - 0.5) * CONFIG.life.rotationSpeed;
    
    // Vitesse de mouvement
    this.velocity = {
      x: (rnd() - 0.5) * CONFIG.life.movementSpeed,
      y: (rnd() - 0.5) * CONFIG.life.movementSpeed
    };
    
    // Forme
    this.time = rnd() * Math.PI * 2;
    this.shapeParams = [];
    this.targetShapeParams = [];
    
    this.initVariableShape();
  }
  
  spawnFromEdge() {
    const { boundaryMargin } = CONFIG.life;
    const side = Math.floor(this.rnd() * 4);
    const spawnDistance = 80; // Réduit pour les petites tailles
    
    switch(side) {
      case 0: // Haut
        this.cx = randBetween(this.rnd, 100, this.viewBounds.width - 100);
        this.cy = -spawnDistance;
        this.velocity.y = Math.abs(this.rnd() + 0.5) * CONFIG.life.movementSpeed;
        this.velocity.x = (this.rnd() - 0.5) * CONFIG.life.movementSpeed * 0.5;
        break;
      case 1: // Droite
        this.cx = this.viewBounds.width + spawnDistance;
        this.cy = randBetween(this.rnd, 100, this.viewBounds.height - 100);
        this.velocity.x = -Math.abs(this.rnd() + 0.5) * CONFIG.life.movementSpeed;
        this.velocity.y = (this.rnd() - 0.5) * CONFIG.life.movementSpeed * 0.5;
        break;
      case 2: // Bas
        this.cx = randBetween(this.rnd, 100, this.viewBounds.width - 100);
        this.cy = this.viewBounds.height + spawnDistance;
        this.velocity.y = -Math.abs(this.rnd() + 0.5) * CONFIG.life.movementSpeed;
        this.velocity.x = (this.rnd() - 0.5) * CONFIG.life.movementSpeed * 0.5;
        break;
      case 3: // Gauche
        this.cx = -spawnDistance;
        this.cy = randBetween(this.rnd, 100, this.viewBounds.height - 100);
        this.velocity.x = Math.abs(this.rnd() + 0.5) * CONFIG.life.movementSpeed;
        this.velocity.y = (this.rnd() - 0.5) * CONFIG.life.movementSpeed * 0.5;
        break;
    }
  }
  
  initVariableShape() {
    const { points, variability } = CONFIG.shape;
    for (let i = 0; i < points; i++) {
      const radiusVar = 0.6 + this.rnd() * 0.8;
      const angleVar = (this.rnd() - 0.5) * variability * 0.5;
      
      this.shapeParams.push({
        radius: radiusVar,
        angleOffset: angleVar,
        phase: this.rnd() * Math.PI * 2
      });
      
      this.targetShapeParams.push({
        radius: 0.6 + this.rnd() * 0.8,
        angleOffset: (this.rnd() - 0.5) * variability * 0.5,
        phase: this.rnd() * Math.PI * 2
      });
    }
  }
  
  update(deltaTime) {
    const { deformationSpeed, movementSpeed, scaleSpeed, minScale, maxScale, pulseAmplitude, boundaryMargin } = CONFIG.life;
    
    this.age += deltaTime;
    this.time += deltaTime * 0.0008;
    this.pulsePhase += deltaTime * 0.001 * this.pulseSpeed;
    
    // Apparition progressive (première seconde)
    if (this.age < 1000) {
      this.opacity = Math.min(this.targetOpacity, this.opacity + 0.03);
      this.scale = Math.min(this.targetScale, this.scale + 0.02);
    }
    
    // Vérifier si vraiment hors limites
    const margin = boundaryMargin;
    const isOut = (
      this.cx < -margin ||
      this.cx > this.viewBounds.width + margin ||
      this.cy < -margin ||
      this.cy > this.viewBounds.height + margin
    );
    
    // Disparition progressive si hors limites
    if (isOut && this.age > 2000) { // Attendre 2 secondes avant de pouvoir mourir
      this.opacity *= 0.9;
      if (this.opacity < 0.01) {
        this.isDead = true;
        return;
      }
    }
    
    // Rotation
    this.rotation += this.rotationSpeed * deltaTime * 0.001;
    
    // Mouvement Brownien
    this.velocity.x += (this.rnd() - 0.5) * movementSpeed * 0.15;
    this.velocity.y += (this.rnd() - 0.5) * movementSpeed * 0.15;
    
    // Friction légère
    this.velocity.x *= 0.97;
    this.velocity.y *= 0.97;
    
    // Limiter la vitesse max
    const maxVel = movementSpeed * 3;
    this.velocity.x = Math.max(-maxVel, Math.min(maxVel, this.velocity.x));
    this.velocity.y = Math.max(-maxVel, Math.min(maxVel, this.velocity.y));
    
    // Appliquer le mouvement
    this.cx += this.velocity.x;
    this.cy += this.velocity.y;
    
    // Pulsation QUASI INVISIBLE
    const pulsation = Math.sin(this.pulsePhase) * pulseAmplitude; // Amplitude 0.02 = quasi invisible
    const pulsedScale = this.targetScale * (1 + pulsation);
    this.scale += (pulsedScale - this.scale) * scaleSpeed * 0.1; // Encore plus lent
    this.scale = Math.max(minScale, Math.min(maxScale, this.scale));
    
    // Morphing de forme
    for (let i = 0; i < this.shapeParams.length; i++) {
      const param = this.shapeParams[i];
      const target = this.targetShapeParams[i];
      
      param.radius += (target.radius - param.radius) * deformationSpeed;
      param.angleOffset += (target.angleOffset - param.angleOffset) * deformationSpeed;
      param.phase += deltaTime * 0.001;
    }
    
    // Changements occasionnels
    if (Math.random() < 0.003) {
      this.generateNewTargets();
    }
    
    if (Math.random() < 0.01) {
      // Impulsion de mouvement
      this.velocity.x += (this.rnd() - 0.5) * movementSpeed * 2;
      this.velocity.y += (this.rnd() - 0.5) * movementSpeed * 2;
    }
    
    if (Math.random() < 0.001) {
      // Changer la vitesse de pulsation
      this.pulseSpeed = CONFIG.life.pulseSpeedMin + 
                       this.rnd() * (CONFIG.life.pulseSpeedMax - CONFIG.life.pulseSpeedMin);
    }
  }
  
  generateNewTargets() {
    const { variability } = CONFIG.shape;
    for (let i = 0; i < this.targetShapeParams.length; i++) {
      this.targetShapeParams[i] = {
        radius: 0.5 + this.rnd() * 1.0,
        angleOffset: (this.rnd() - 0.5) * variability * 0.5,
        phase: this.targetShapeParams[i].phase
      };
    }
    this.targetScale = 0.7 + this.rnd() * 0.8;
    this.rotationSpeed = (this.rnd() - 0.5) * CONFIG.life.rotationSpeed;
  }
  
  getPath() {
    const { points, tension } = CONFIG.shape;
    const pts = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const param = this.shapeParams[i];
      
      const wave1 = Math.sin(param.phase + this.time) * 0.1;
      const wave2 = Math.cos(param.phase * 2 + this.time * 1.5) * 0.05;
      
      const avgRadius = (this.baseRx + this.baseRy) * 0.5;
      const radius = avgRadius * this.scale * param.radius * (1 + wave1 + wave2);
      
      const adjustedAngle = angle + param.angleOffset + this.rotation;
      
      const x = this.cx + Math.cos(adjustedAngle) * radius;
      const y = this.cy + Math.sin(adjustedAngle) * radius;
      
      pts.push([x, y]);
    }
    
    return toCubicPath(pts, tension);
  }
  
  distanceTo(other) {
    const dx = this.cx - other.cx;
    const dy = this.cy - other.cy;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  canFuseWith(other) {
    if (this.colorKey !== other.colorKey) return false;
    if (this.age < 1000 || other.age < 1000) return false; // Pas de fusion au début
    const combinedSize = (this.scale + other.scale) * 0.5;
    return this.distanceTo(other) < CONFIG.life.fusionDistance * combinedSize;
  }
  
  fuseWith(other) {
    const totalScale = this.scale + other.scale;
    this.cx = (this.cx * this.scale + other.cx * other.scale) / totalScale;
    this.cy = (this.cy * this.scale + other.cy * other.scale) / totalScale;
    
    this.velocity.x = (this.velocity.x + other.velocity.x) * 0.5;
    this.velocity.y = (this.velocity.y + other.velocity.y) * 0.5;
    
    this.scale = Math.min(CONFIG.life.maxScale, totalScale * 0.65);
    this.targetScale = this.scale;
    
    for (let i = 0; i < this.shapeParams.length; i++) {
      this.shapeParams[i].radius = (this.shapeParams[i].radius + other.shapeParams[i].radius) * 0.5;
    }
    
    this.generateNewTargets();
  }
  
  split() {
    const angle = this.rnd() * Math.PI * 2;
    const distance = 30 + this.rnd() * 50;
    
    const newBlob = new MorphingBlob({
      cx: this.cx + Math.cos(angle) * distance,
      cy: this.cy + Math.sin(angle) * distance,
      rx: this.baseRx,
      ry: this.baseRy,
      colorKey: this.colorKey,
      rnd: this.rnd,
      id: this.id + '_split_' + Date.now(),
      viewBounds: this.viewBounds,
      startFromEdge: false
    });
    
    this.scale *= 0.65;
    this.targetScale = this.scale;
    newBlob.scale = this.scale;
    newBlob.targetScale = this.scale;
    newBlob.opacity = this.opacity;
    newBlob.age = 1000; // Commence déjà "adulte"
    
    newBlob.velocity.x = Math.cos(angle) * CONFIG.life.movementSpeed;
    newBlob.velocity.y = Math.sin(angle) * CONFIG.life.movementSpeed;
    this.velocity.x = -newBlob.velocity.x;
    this.velocity.y = -newBlob.velocity.y;
    
    return newBlob;
  }
}

/* ========== Placement initial ========== */
function createInitialBlobs(rnd, W, H) {
  const allBlobs = [];
  let blobId = 0;
  const viewBounds = { width: W, height: H };
  
  ['olive', 'terra', 'sable'].forEach(colorKey => {
    const count = CONFIG.counts[colorKey];
    const { rx, ry } = CONFIG.sizes[colorKey];
    
    for (let i = 0; i < count; i++) {
      // Distribuer sur toute la hauteur de la page
      const cx = randBetween(rnd, 150, W - 150);
      const cy = randBetween(rnd, 150, H - 150);
      
      allBlobs.push(new MorphingBlob({
        cx, cy, rx, ry, colorKey, rnd,
        id: blobId++,
        viewBounds,
        startFromEdge: false
      }));
    }
  });
  
  return allBlobs;
}

/* ================= Hook de dimension de la page ================= */
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
export default function MatisseWallpaperRandom() {
  const [blobs, setBlobs] = useState([]);
  const { width: docW, height: docH } = usePageSize();
  const animationRef = useRef();
  const lastTimeRef = useRef(0);
  
  const rnd = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return mulberry32(a[0]);
    }
    return mulberry32(Date.now() & 0xffffffff);
  }, []);
  
  // Créer les blobs initiaux
  useEffect(() => {
    const W = Math.max(docW, CONFIG.tileWidth);
    const H = docH;
    const initialBlobs = createInitialBlobs(rnd, W, H);
    setBlobs(initialBlobs);
  }, [rnd, docW, docH]);
  
  // Animation loop
  useEffect(() => {
    if (blobs.length === 0) return;
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTimeRef.current;
      
      if (deltaTime >= CONFIG.life.updateInterval) {
        setBlobs(currentBlobs => {
          let newBlobs = [...currentBlobs];
          const viewBounds = { width: docW, height: docH };
          
          // Mettre à jour tous les blobs
          newBlobs.forEach(blob => blob.update(deltaTime));
          
          // Retirer les blobs morts
          newBlobs = newBlobs.filter(blob => !blob.isDead);
          
          // Fusion - vraie fusion en une seule cellule
          const toRemove = new Set();
          for (let i = 0; i < newBlobs.length; i++) {
            if (toRemove.has(i)) continue;
            
            for (let j = i + 1; j < newBlobs.length; j++) {
              if (toRemove.has(j)) continue;
              
              if (newBlobs[i].canFuseWith(newBlobs[j])) {
                // Fusionner j dans i
                newBlobs[i].fuseWith(newBlobs[j]);
                toRemove.add(j); // Marquer j pour suppression
              }
            }
          }
          
          // Supprimer les blobs fusionnés
          if (toRemove.size > 0) {
            newBlobs = newBlobs.filter((_, index) => !toRemove.has(index));
          }
          
          // Division (plus fréquente pour les grosses cellules)
          const blobsToAdd = [];
          newBlobs.forEach(blob => {
            if (blob.age > 3000) { // Au moins 3 secondes d'âge
              // Plus la cellule est grosse, plus elle a de chance de se diviser
              const splitChance = blob.scale > CONFIG.life.multiSplitThreshold ? 
                CONFIG.life.splitProbability * 2 : // Double chance si très grosse
                blob.scale > CONFIG.life.splitThreshold ? 
                CONFIG.life.splitProbability : 0;
              
              if (Math.random() < splitChance) {
                const newBlobs = blob.split();
                blobsToAdd.push(...newBlobs);
              }
            }
          });
          newBlobs = [...newBlobs, ...blobsToAdd];
          
          // Spawn de nouveaux blobs depuis les bords
          if (newBlobs.length < CONFIG.life.maxBlobs && 
              Math.random() < CONFIG.life.spawnRate) {
            const colors = ['olive', 'terra', 'sable'];
            const colorKey = colors[Math.floor(rnd() * colors.length)];
            const { rx, ry } = CONFIG.sizes[colorKey];
            
            newBlobs.push(new MorphingBlob({
              cx: 0, cy: 0, rx, ry, colorKey, rnd,
              id: 'blob_' + Date.now() + '_' + Math.random(),
              viewBounds,
              startFromEdge: true
            }));
          }
          
          // Limiter le nombre
          if (newBlobs.length > CONFIG.life.maxBlobs) {
            newBlobs.sort((a, b) => b.opacity - a.opacity);
            newBlobs = newBlobs.slice(0, CONFIG.life.maxBlobs);
          }
          
          return newBlobs;
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
  }, [blobs.length, rnd, docW, docH]);
  
  const { W, H } = useMemo(() => ({
    W: Math.max(docW, CONFIG.tileWidth),
    H: docH
  }), [docW, docH]);
  
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: '100%',
        height: `${H}px`,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        willChange: 'transform'
      }}
    >
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          background: CONFIG.colors.bg,
          transform: 'translateZ(0)'
        }}
      >
        <rect x="0" y="0" width={W} height={H} fill={CONFIG.colors.bg} />
        
        <defs>
          <filter id="organic" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix 
              in="blur" 
              type="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" 
              result="goo" 
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
        
        <g filter="url(#organic)">
          {blobs.map((blob) => (
            <path
              key={blob.id}
              d={blob.getPath()}
              fill={CONFIG.colors[blob.colorKey]}
              opacity={blob.opacity}
              style={{
                transform: 'translateZ(0)',
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
