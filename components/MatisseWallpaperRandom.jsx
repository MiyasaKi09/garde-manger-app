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
  counts: { olive: 5, terra: 4, sable: 5 }, // Plus de cellules pour la vie
  sizes: {
    olive: { rx: 160, ry: 220 },
    terra: { rx: 130, ry: 180 },
    sable: { rx: 200, ry: 260 },
  },
  shape: {
    points: 6, // Moins de points pour plus de fluidité
    tension: 0.95, // Tension maximale pour ultra-lissage
    variability: 0.4, // Plus de variabilité dans les formes
  },
  // Animation avec vie cellulaire
  life: {
    updateInterval: 50, // 20 FPS
    deformationSpeed: 0.008,
    rotationSpeed: 0.1,
    movementSpeed: 1.2, // Vitesse de déplacement aléatoire
    
    // Vie cellulaire
    fusionDistance: 200, // Distance pour fusionner
    fusionProbability: 0.15, // Probabilité de fusion
    splitThreshold: 1.8, // Taille pour division
    splitProbability: 0.1, // Probabilité de division
    
    // Dilatation/compression
    minScale: 0.4,
    maxScale: 2.0,
    scaleSpeed: 0.01,
    
    // Spawn et disparition
    spawnRate: 0.002, // Probabilité d'apparition
    maxBlobs: 25, // Maximum de blobs
    boundaryMargin: 300, // Marge hors écran pour spawn/despawn
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
    
    // Tangentes ultra-lisses
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
  constructor({ cx, cy, rx, ry, colorKey, rnd, id, viewBounds, isNewSpawn = false }) {
    this.id = id;
    this.cx = cx;
    this.cy = cy;
    this.baseRx = rx;
    this.baseRy = ry;
    this.colorKey = colorKey;
    this.rnd = rnd;
    this.viewBounds = viewBounds;
    this.isDead = false;
    
    // Si nouveau spawn, apparaître hors écran
    if (isNewSpawn) {
      this.spawnFromOutside();
    }
    
    // Scale variable pour dilatation/compression
    this.scale = isNewSpawn ? 0.1 : (0.6 + rnd() * 0.8);
    this.targetScale = 0.8 + rnd() * 0.6;
    this.opacity = isNewSpawn ? 0 : (0.5 + rnd() * 0.4);
    this.targetOpacity = 0.6 + rnd() * 0.3;
    
    // Rotation
    this.rotation = rnd() * Math.PI * 2;
    this.rotationSpeed = (rnd() - 0.5) * CONFIG.life.rotationSpeed;
    
    // Mouvement aléatoire Brownien
    this.velocity = {
      x: (rnd() - 0.5) * CONFIG.life.movementSpeed,
      y: (rnd() - 0.5) * CONFIG.life.movementSpeed
    };
    
    // Forme variable
    this.time = rnd() * Math.PI * 2;
    this.shapeParams = [];
    this.targetShapeParams = [];
    
    this.initVariableShape();
  }
  
  spawnFromOutside() {
    const { boundaryMargin } = CONFIG.life;
    const side = Math.floor(this.rnd() * 4); // 0: haut, 1: droite, 2: bas, 3: gauche
    
    switch(side) {
      case 0: // Haut
        this.cx = randBetween(this.rnd, 0, this.viewBounds.width);
        this.cy = -boundaryMargin;
        break;
      case 1: // Droite
        this.cx = this.viewBounds.width + boundaryMargin;
        this.cy = randBetween(this.rnd, 0, this.viewBounds.height);
        break;
      case 2: // Bas
        this.cx = randBetween(this.rnd, 0, this.viewBounds.width);
        this.cy = this.viewBounds.height + boundaryMargin;
        break;
      case 3: // Gauche
        this.cx = -boundaryMargin;
        this.cy = randBetween(this.rnd, 0, this.viewBounds.height);
        break;
    }
  }
  
  initVariableShape() {
    const { points, variability } = CONFIG.shape;
    for (let i = 0; i < points; i++) {
      // Forme plus variable
      const radiusVar = 0.5 + this.rnd() * 1.0; // Grande variabilité
      const angleVar = (this.rnd() - 0.5) * variability;
      
      this.shapeParams.push({
        radius: radiusVar,
        angleOffset: angleVar,
        phase: this.rnd() * Math.PI * 2
      });
      
      this.targetShapeParams.push({
        radius: 0.5 + this.rnd() * 1.0,
        angleOffset: (this.rnd() - 0.5) * variability,
        phase: this.rnd() * Math.PI * 2
      });
    }
  }
  
  update(deltaTime, allBlobs) {
    const { deformationSpeed, movementSpeed, scaleSpeed, minScale, maxScale, pulseAmplitude } = CONFIG.life;
    this.time += deltaTime * 0.0008;
    this.pulsePhase += deltaTime * 0.001 * this.pulseSpeed; // Pulsation à vitesse variable
    
    // Vérifier si hors limites pour mourir
    if (this.isOutOfBounds()) {
      this.opacity *= 0.95; // Fade out rapide
      if (this.opacity < 0.01) {
        this.isDead = true;
        return;
      }
    } else {
      // Fade in si dans les limites
      this.opacity += (this.targetOpacity - this.opacity) * 0.02;
    }
    
    // Rotation continue
    this.rotation += this.rotationSpeed * deltaTime * 0.001;
    
    // Mouvement Brownien aléatoire PLUS FORT
    this.velocity.x += (this.rnd() - 0.5) * movementSpeed * 0.3;
    this.velocity.y += (this.rnd() - 0.5) * movementSpeed * 0.3;
    
    // Friction réduite pour plus de mouvement
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
    
    // Appliquer le mouvement
    this.cx += this.velocity.x;
    this.cy += this.velocity.y;
    
    // Dilatation/compression avec pulsation à vitesse variable
    const pulsation = Math.sin(this.pulsePhase) * pulseAmplitude;
    this.targetScale = Math.max(minScale, Math.min(maxScale, 
      this.targetScale + (this.rnd() - 0.5) * 0.02));
    
    // Appliquer la pulsation au scale actuel
    const pulsedScale = this.targetScale * (1 + pulsation);
    this.scale += (pulsedScale - this.scale) * scaleSpeed;
    
    // Morphing de la forme
    for (let i = 0; i < this.shapeParams.length; i++) {
      const param = this.shapeParams[i];
      const target = this.targetShapeParams[i];
      
      param.radius += (target.radius - param.radius) * deformationSpeed;
      param.angleOffset += (target.angleOffset - param.angleOffset) * deformationSpeed;
      param.phase += deltaTime * 0.001;
    }
    
    // Nouvelles cibles occasionnelles
    if (Math.random() < 0.005) {
      this.generateNewTargets();
    }
    
    // Changement de direction plus fréquent et plus fort
    if (Math.random() < 0.02) {
      this.velocity.x = (this.rnd() - 0.5) * movementSpeed * 3;
      this.velocity.y = (this.rnd() - 0.5) * movementSpeed * 3;
    }
    
    // Changement occasionnel de vitesse de pulsation
    if (Math.random() < 0.002) {
      this.pulseSpeed = CONFIG.life.pulseSpeedMin + 
                       this.rnd() * (CONFIG.life.pulseSpeedMax - CONFIG.life.pulseSpeedMin);
    }
  }
  
  generateNewTargets() {
    const { variability } = CONFIG.shape;
    for (let i = 0; i < this.targetShapeParams.length; i++) {
      this.targetShapeParams[i] = {
        radius: 0.4 + this.rnd() * 1.2,
        angleOffset: (this.rnd() - 0.5) * variability,
        phase: this.targetShapeParams[i].phase
      };
    }
    this.rotationSpeed = (this.rnd() - 0.5) * CONFIG.life.rotationSpeed;
  }
  
  isOutOfBounds() {
    const { boundaryMargin } = CONFIG.life;
    const margin = boundaryMargin + this.baseRx * this.scale;
    
    return (
      this.cx < -margin ||
      this.cx > this.viewBounds.width + margin ||
      this.cy < -margin ||
      this.cy > this.viewBounds.height + margin
    );
  }
  
  getPath() {
    const { points, tension } = CONFIG.shape;
    const pts = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const param = this.shapeParams[i];
      
      // Ondulation organique complexe
      const wave1 = Math.sin(param.phase + this.time) * 0.15;
      const wave2 = Math.cos(param.phase * 2 + this.time * 1.5) * 0.1;
      
      // Rayon très variable
      const avgRadius = (this.baseRx + this.baseRy) * 0.5;
      const radius = avgRadius * this.scale * param.radius * (1 + wave1 + wave2);
      
      // Angle avec décalage et rotation
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
    const combinedSize = (this.scale + other.scale) * 0.5;
    return this.distanceTo(other) < CONFIG.life.fusionDistance * combinedSize;
  }
  
  fuseWith(other) {
    // Fusion pondérée par la taille
    const totalScale = this.scale + other.scale;
    this.cx = (this.cx * this.scale + other.cx * other.scale) / totalScale;
    this.cy = (this.cy * this.scale + other.cy * other.scale) / totalScale;
    
    // Combiner les vitesses
    this.velocity.x = (this.velocity.x + other.velocity.x) * 0.5;
    this.velocity.y = (this.velocity.y + other.velocity.y) * 0.5;
    
    // Nouvelle taille (pas juste la somme pour éviter l'explosion)
    this.scale = Math.min(CONFIG.life.maxScale, totalScale * 0.7);
    this.targetScale = this.scale;
    
    // Mélanger les formes
    for (let i = 0; i < this.shapeParams.length; i++) {
      this.shapeParams[i].radius = (this.shapeParams[i].radius + other.shapeParams[i].radius) * 0.5;
    }
    
    this.generateNewTargets();
  }
  
  split() {
    const angle = this.rnd() * Math.PI * 2;
    const distance = 50 + this.rnd() * 100;
    
    const newBlob = new MorphingBlob({
      cx: this.cx + Math.cos(angle) * distance,
      cy: this.cy + Math.sin(angle) * distance,
      rx: this.baseRx,
      ry: this.baseRy,
      colorKey: this.colorKey,
      rnd: this.rnd,
      id: this.id + '_split_' + Date.now(),
      viewBounds: this.viewBounds,
      isNewSpawn: false
    });
    
    // Réduire la taille des deux blobs
    this.scale *= 0.7;
    this.targetScale = this.scale;
    newBlob.scale = this.scale * 0.8;
    newBlob.targetScale = newBlob.scale;
    
    // Donner des vitesses opposées
    newBlob.velocity.x = -this.velocity.x + (this.rnd() - 0.5) * 2;
    newBlob.velocity.y = -this.velocity.y + (this.rnd() - 0.5) * 2;
    
    return newBlob;
  }
}

/* ========== Gestion de la population de blobs ========== */
function spawnNewBlob(rnd, viewBounds) {
  const colors = ['olive', 'terra', 'sable'];
  const colorKey = colors[Math.floor(rnd() * colors.length)];
  const { rx, ry } = CONFIG.sizes[colorKey];
  
  return new MorphingBlob({
    cx: 0, cy: 0, // Sera défini par spawnFromOutside
    rx, ry, colorKey, rnd,
    id: 'blob_' + Date.now() + '_' + Math.random(),
    viewBounds,
    isNewSpawn: true
  });
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
      // Placer les blobs initiaux DANS l'écran, pas en dehors
      const cx = randBetween(rnd, 100, W - 100);
      const cy = randBetween(rnd, 100, H - 100);
      
      allBlobs.push(new MorphingBlob({
        cx, cy, rx, ry, colorKey, rnd,
        id: blobId++,
        viewBounds,
        isNewSpawn: false
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
  
  // Animation loop avec vie cellulaire
  useEffect(() => {
    if (blobs.length === 0) return;
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTimeRef.current;
      
      if (deltaTime >= CONFIG.life.updateInterval) {
        setBlobs(currentBlobs => {
          let newBlobs = [...currentBlobs];
          const viewBounds = { width: docW, height: docH };
          
          // Mettre à jour tous les blobs
          newBlobs.forEach(blob => blob.update(deltaTime, newBlobs));
          
          // Retirer les blobs morts
          newBlobs = newBlobs.filter(blob => !blob.isDead);
          
          // Fusion
          if (Math.random() < CONFIG.life.fusionProbability) {
            for (let i = newBlobs.length - 1; i >= 0; i--) {
              for (let j = i - 1; j >= 0; j--) {
                if (newBlobs[i] && newBlobs[j] && newBlobs[i].canFuseWith(newBlobs[j])) {
                  newBlobs[i].fuseWith(newBlobs[j]);
                  newBlobs.splice(j, 1);
                  i--;
                  break;
                }
              }
            }
          }
          
          // Division
          const blobsToAdd = [];
          newBlobs.forEach(blob => {
            if (blob.scale > CONFIG.life.splitThreshold && 
                Math.random() < CONFIG.life.splitProbability) {
              blobsToAdd.push(blob.split());
            }
          });
          newBlobs = [...newBlobs, ...blobsToAdd];
          
          // Spawn de nouveaux blobs
          if (newBlobs.length < CONFIG.life.maxBlobs && 
              Math.random() < CONFIG.life.spawnRate) {
            newBlobs.push(spawnNewBlob(rnd, viewBounds));
          }
          
          // Limiter le nombre de blobs
          if (newBlobs.length > CONFIG.life.maxBlobs) {
            // Garder les blobs les plus proches du centre
            newBlobs.sort((a, b) => {
              const distA = Math.abs(a.cx - docW/2) + Math.abs(a.cy - docH/2);
              const distB = Math.abs(b.cx - docW/2) + Math.abs(b.cy - docH/2);
              return distA - distB;
            });
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
        
        {/* Filtre organique amélioré */}
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
