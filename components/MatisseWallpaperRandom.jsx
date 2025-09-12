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
  counts: { olive: 3, terra: 3, sable: 3 }, // Réduit pour la performance
  sizes: {
    olive: { rx: 160, ry: 220 },
    terra: { rx: 130, ry: 180 },
    sable: { rx: 200, ry: 260 },
  },
  packing: {
    radiusFactor: 0.62,
    padding: 24,
    attemptsPerBlob: 120,
    sideInset: 80,
  },
  shape: {
    points: 8, // SEULEMENT 8 points pour des courbes ultra-smooth
    tension: 0.85, // Tension élevée pour des courbes très douces
    scaleJitter: 0.15,
  },
  // Animation ULTRA optimisée
  morphing: {
    updateInterval: 50, // 20 FPS max pour la fluidité
    deformationSpeed: 0.008, // Très lent et smooth
    maxDeformation: 0.15, // Déformation minimale
    fusionDistance: 180,
    splitProbability: 0, // Désactivé pour la performance
    fusionProbability: 0, // Désactivé pour la performance
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

/* ========== Forme super smooth avec Bézier ========== */
function toCubicPath(points, tension = 0.85) {
  const n = points.length;
  let d = `M ${points[0][0]},${points[0][1]}`;
  
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    
    // Calcul des tangentes pour des courbes ultra-smooth
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
  constructor({ cx, cy, rx, ry, colorKey, rnd, id, startScale = 0 }) {
    this.id = id;
    this.cx = cx;
    this.cy = cy;
    this.baseRx = rx;
    this.baseRy = ry;
    this.colorKey = colorKey;
    this.rnd = rnd;
    
    // Animation d'apparition smooth
    this.scale = startScale; // Commence à 0 pour l'apparition progressive
    this.targetScale = 0.9 + rnd() * 0.2;
    this.opacity = 0;
    this.targetOpacity = 0.7 + rnd() * 0.2;
    
    // États de morphing simplifiés
    this.time = rnd() * Math.PI * 2; // Phase aléatoire pour désynchroniser
    this.angleOffsets = [];
    this.targetAngleOffsets = [];
    this.radiusMultipliers = [];
    this.targetRadiusMultipliers = [];
    
    // Vitesse de déplacement très lente
    this.velocity = { x: 0, y: 0 };
    
    // Initialiser avec des valeurs smooth
    this.initSmoothParams();
  }
  
  initSmoothParams() {
    const { points } = CONFIG.shape;
    for (let i = 0; i < points; i++) {
      // Valeurs initiales très proches du cercle parfait
      this.angleOffsets.push(0);
      this.targetAngleOffsets.push((this.rnd() - 0.5) * 0.1);
      
      this.radiusMultipliers.push(1);
      this.targetRadiusMultipliers.push(0.85 + this.rnd() * 0.3);
    }
  }
  
  update(deltaTime) {
    const { deformationSpeed } = CONFIG.morphing;
    this.time += deltaTime * 0.0005; // Animation très lente
    
    // Apparition progressive au démarrage
    if (this.scale < this.targetScale) {
      this.scale += (this.targetScale - this.scale) * 0.02;
    }
    if (this.opacity < this.targetOpacity) {
      this.opacity += (this.targetOpacity - this.opacity) * 0.02;
    }
    
    // Interpolation ultra-smooth des paramètres
    for (let i = 0; i < CONFIG.shape.points; i++) {
      this.angleOffsets[i] += (this.targetAngleOffsets[i] - this.angleOffsets[i]) * deformationSpeed;
      this.radiusMultipliers[i] += (this.targetRadiusMultipliers[i] - this.radiusMultipliers[i]) * deformationSpeed;
    }
    
    // Mouvement brownien très subtil
    this.velocity.x += (this.rnd() - 0.5) * 0.05;
    this.velocity.y += (this.rnd() - 0.5) * 0.05;
    this.velocity.x *= 0.98; // Forte friction
    this.velocity.y *= 0.98;
    
    this.cx += this.velocity.x * deltaTime * 0.01;
    this.cy += this.velocity.y * deltaTime * 0.01;
    
    // Nouvelles cibles de temps en temps (toutes les ~10 secondes)
    if (Math.random() < 0.001) {
      this.generateNewTargets();
    }
  }
  
  generateNewTargets() {
    const { maxDeformation } = CONFIG.morphing;
    for (let i = 0; i < CONFIG.shape.points; i++) {
      this.targetAngleOffsets[i] = (this.rnd() - 0.5) * maxDeformation * 0.5;
      this.targetRadiusMultipliers[i] = 0.8 + this.rnd() * 0.4;
    }
  }
  
  getPath() {
    const { points, tension } = CONFIG.shape;
    const pts = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      
      // Ondulation organique très douce
      const waveOffset = Math.sin(this.time + i * (Math.PI / 4)) * 0.05;
      
      // Rayon avec variation smooth
      const avgRadius = (this.baseRx + this.baseRy) * 0.5;
      const radius = avgRadius * this.scale * this.radiusMultipliers[i] * (1 + waveOffset);
      
      // Angle avec offset minimal
      const adjustedAngle = angle + this.angleOffsets[i];
      
      const x = this.cx + Math.cos(adjustedAngle) * radius;
      const y = this.cy + Math.sin(adjustedAngle) * radius;
      
      pts.push([x, y]);
    }
    
    return toCubicPath(pts, tension);
  }
}

/* ========== Placement initial ========== */
function createInitialBlobs(rnd, W, H) {
  const allBlobs = [];
  let blobId = 0;
  
  ['olive', 'terra', 'sable'].forEach(colorKey => {
    const count = CONFIG.counts[colorKey];
    const { rx, ry } = CONFIG.sizes[colorKey];
    
    for (let i = 0; i < count; i++) {
      const attempts = 50;
      
      for (let attempt = 0; attempt < attempts; attempt++) {
        const cx = randBetween(rnd, CONFIG.packing.sideInset, W - CONFIG.packing.sideInset);
        const cy = randBetween(rnd, CONFIG.packing.sideInset, H - CONFIG.packing.sideInset);
        
        // Vérifier la distance avec les autres blobs
        const tooClose = allBlobs.some(blob => {
          const dx = cx - blob.cx;
          const dy = cy - blob.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist < (rx + ry + blob.baseRx + blob.baseRy) * 0.35;
        });
        
        if (!tooClose) {
          allBlobs.push(new MorphingBlob({
            cx, cy, rx, ry, colorKey, rnd, 
            id: blobId++,
            startScale: 0 // Commence à 0 pour l'apparition smooth
          }));
          break;
        }
      }
    }
  });
  
  return allBlobs;
}

/* ================= Hook de dimension écran ================= */
function useWindowSize() {
  const [size, setSize] = useState({ width: 1200, height: 800 });
  
  useEffect(() => {
    function updateSize() {
      setSize({ 
        width: window.innerWidth, 
        height: Math.max(window.innerHeight, document.documentElement.scrollHeight)
      });
    }
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return size;
}

/* ================= COMPOSANT PRINCIPAL ================= */
export default function MatisseWallpaperRandom() {
  const [blobs, setBlobs] = useState([]);
  const { width: docW, height: docH } = useWindowSize();
  const animationRef = useRef();
  const lastTimeRef = useRef(0);
  
  // Initialisation avec RNG
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
  
  // Animation loop optimisée
  useEffect(() => {
    if (blobs.length === 0) return;
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTimeRef.current;
      
      // Limiter à 20 FPS pour la performance
      if (deltaTime >= CONFIG.morphing.updateInterval) {
        setBlobs(currentBlobs => {
          const newBlobs = [...currentBlobs];
          
          // Mettre à jour chaque blob avec le deltaTime
          newBlobs.forEach(blob => blob.update(deltaTime));
          
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
  }, [blobs.length]);
  
  const { W, H } = useMemo(() => ({
    W: Math.max(docW, CONFIG.tileWidth),
    H: docH
  }), [docW, docH]);
  
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        height: `${H}px`,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        willChange: 'transform' // Optimisation GPU
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          background: CONFIG.colors.bg,
          transform: 'translateZ(0)' // Force GPU
        }}
      >
        <rect x="0" y="0" width={W} height={H} fill={CONFIG.colors.bg} />
        
        {/* Filtre très léger pour l'effet organique */}
        <defs>
          <filter id="organic" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix 
              in="blur" 
              type="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" 
              result="goo" 
            />
            <feBlend in="SourceGraphic" in2="goo" mode="normal"/>
          </filter>
        </defs>
        
        {/* Rendu des blobs avec effet organique léger */}
        <g filter="url(#organic)">
          {blobs.map((blob) => (
            <path
              key={blob.id}
              d={blob.getPath()}
              fill={CONFIG.colors[blob.colorKey]}
              opacity={blob.opacity}
              style={{
                transform: 'translateZ(0)', // Force GPU pour chaque blob
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
