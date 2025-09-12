'use client';
import { useEffect, useMemo, useState } from "react";

/* ================= REGLAGES OPTIMISES ================= */
const CONFIG = {
  tileWidth: 1000,
  colors: {
    bg:    "var(--cream-100, #f4efe6)",
    olive: "var(--olive-500, #6e8b5e)",
    terra: "var(--terra-500, #c08a5a)",
    sable: "var(--sable-300, #e2c98f)",
  },
  // RÉDUIT le nombre de blobs pour de meilleures performances
  counts: { olive: 4, terra: 3, sable: 4 },
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
    points: 24, // RÉDUIT pour de meilleures performances
    noiseAmp: 0.2,
    harmonicMin: 2,
    harmonicMax: 4,
    tension: 0.45,
    scaleJitter: 0.15,
    rotate: true,
  },
  // Animation plus lente et moins intensive
  morphing: {
    updateInterval: 300, // PLUS LENT : mise à jour toutes les 300ms
    deformationSpeed: 0.01, // PLUS LENT
    fusionDistance: 200,
    maxDeformation: 0.3, // RÉDUIT
    splitProbability: 0.001, // RÉDUIT
    fusionProbability: 0.002, // RÉDUIT
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

/* ========== Forme statique optimisée ========== */
function toCubicPath(points, tension = 0.45) {
  const n = points.length;
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

// Version simplifiée du blob avec moins d'animations
class OptimizedBlob {
  constructor({ cx, cy, rx, ry, colorKey, rnd, id }) {
    this.id = id;
    this.cx = cx;
    this.cy = cy;
    this.baseRx = rx;
    this.baseRy = ry;
    this.colorKey = colorKey;
    this.rnd = rnd;
    
    // États simplifiés
    this.time = rnd() * 100; // Décalage initial
    this.basePoints = this.generateBasePoints();
    this.scale = 0.9 + rnd() * 0.2;
    this.opacity = 0.7 + rnd() * 0.2;
    this.rotationSpeed = (rnd() - 0.5) * 0.002; // TRÈS lent
  }
  
  generateBasePoints() {
    const { points } = CONFIG.shape;
    const pts = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radiusVar = 0.8 + this.rnd() * 0.4;
      const radius = ((this.baseRx + this.baseRy) * 0.5) * radiusVar;
      
      const x = this.cx + Math.cos(angle) * radius;
      const y = this.cy + Math.sin(angle) * radius;
      
      pts.push([x, y]);
    }
    
    return pts;
  }
  
  update() {
    this.time += 0.016;
  }
  
  getPath() {
    // Animation très subtile basée sur le temps
    const animatedPoints = this.basePoints.map((point, i) => {
      const wave = Math.sin(this.time * 0.5 + i * 0.3) * 3; // Mouvement très subtil
      const rotation = this.time * this.rotationSpeed;
      
      // Rotation autour du centre
      const dx = point[0] - this.cx;
      const dy = point[1] - this.cy;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      
      return [
        this.cx + dx * cos - dy * sin + wave,
        this.cy + dx * sin + dy * cos + wave * 0.5
      ];
    });
    
    return toCubicPath(animatedPoints, CONFIG.shape.tension);
  }
  
  distanceTo(other) {
    const dx = this.cx - other.cx;
    const dy = this.cy - other.cy;
    return Math.sqrt(dx * dx + dy * dy);
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
      let placed = false;
      
      for (let attempt = 0; attempt < attempts; attempt++) {
        const cx = randBetween(rnd, CONFIG.packing.sideInset, W - CONFIG.packing.sideInset);
        const cy = randBetween(rnd, CONFIG.packing.sideInset, H - CONFIG.packing.sideInset);
        
        // Vérifier la distance avec les autres blobs
        const tooClose = allBlobs.some(blob => {
          const dx = cx - blob.cx;
          const dy = cy - blob.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist < (rx + ry + blob.baseRx + blob.baseRy) * 0.4;
        });
        
        if (!tooClose) {
          allBlobs.push(new OptimizedBlob({
            cx, cy, rx, ry, colorKey, rnd, id: blobId++
          }));
          placed = true;
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

/* ================= COMPOSANT PRINCIPAL OPTIMISÉ ================= */
export default function MatisseWallpaperRandom() {
  const [blobs, setBlobs] = useState([]);
  const { width: docW, height: docH } = useWindowSize();
  
  // Initialisation avec RNG
  const rnd = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return mulberry32(a[0]);
    }
    return mulberry32(Date.now() & 0xffffffff);
  }, []);
  
  // Créer les blobs initiaux (une seule fois)
  useEffect(() => {
    const W = Math.max(docW, CONFIG.tileWidth);
    const H = docH;
    const initialBlobs = createInitialBlobs(rnd, W, H);
    setBlobs(initialBlobs);
  }, [rnd, docW, docH]);
  
  // Animation loop OPTIMISÉE
  useEffect(() => {
    let animationId;
    
    const animate = () => {
      setBlobs(currentBlobs => {
        // Mise à jour simple et rapide
        currentBlobs.forEach(blob => blob.update());
        return [...currentBlobs]; // Force re-render
      });
      
      // Utilise setTimeout au lieu de setInterval pour de meilleures performances
      setTimeout(() => {
        animationId = requestAnimationFrame(animate);
      }, CONFIG.morphing.updateInterval);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);
  
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
        overflow: "hidden"
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
          // Optimisation du rendu
          shapeRendering: "geometricPrecision"
        }}
      >
        <rect x="0" y="0" width={W} height={H} fill={CONFIG.colors.bg} />
        
        {/* Filtres simplifiés pour de meilleures performances */}
        <defs>
          <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        
        {/* Rendu des blobs optimisé */}
        {blobs.map((blob) => (
          <path
            key={blob.id}
            d={blob.getPath()}
            fill={CONFIG.colors[blob.colorKey]}
            opacity={blob.opacity}
            filter="url(#softBlur)"
            style={{
              // CSS optimisé pour les performances
              willChange: 'auto',
              transform: 'translateZ(0)', // Force GPU acceleration
            }}
          />
        ))}
      </svg>
    </div>
  );
}
