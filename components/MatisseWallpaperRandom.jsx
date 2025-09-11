'use client';
import { useEffect, useMemo, useState } from "react";

/* ================= REGLAGES ================= */
const CONFIG = {
  tileWidth: 1000,
  colors: {
    bg:    "var(--cream-100, #f4efe6)",
    olive: "var(--olive-500, #6e8b5e)",
    terra: "var(--terra-500, #c08a5a)",
    sable: "var(--sable-300, #e2c98f)",
  },
  counts: { olive: 6, terra: 5, sable: 6 },
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
    points: 36, // Réduit pour des morphings plus fluides
    noiseAmp: 0.25, // Augmenté pour plus de déformation
    harmonicMin: 2,
    harmonicMax: 6,
    tension: 0.45,
    scaleJitter: 0.15,
    rotate: true,
  },
  // NOUVEAU: Morphing dynamique
  morphing: {
    updateInterval: 150, // Mise à jour toutes les 150ms
    deformationSpeed: 0.02, // Vitesse de déformation
    fusionDistance: 180, // Distance pour déclencher fusion
    maxDeformation: 0.4, // Déformation maximale
    splitProbability: 0.003, // Probabilité de division par frame
    fusionProbability: 0.008, // Probabilité de fusion par frame
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

/* ========== Forme dynamique avec morphing ========== */
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

class MorphingBlob {
  constructor({ cx, cy, rx, ry, colorKey, rnd, id }) {
    this.id = id;
    this.cx = cx;
    this.cy = cy;
    this.baseRx = rx;
    this.baseRy = ry;
    this.colorKey = colorKey;
    this.rnd = rnd;
    
    // États de morphing
    this.time = 0;
    this.deformParams = [];
    this.targetDeformParams = [];
    this.velocity = { x: 0, y: 0 };
    this.scale = 1;
    this.targetScale = 1;
    this.opacity = 0.8;
    this.targetOpacity = 0.8;
    
    // Initialiser les paramètres de déformation
    this.initDeformParams();
    this.generateTargetParams();
  }
  
  initDeformParams() {
    const { points } = CONFIG.shape;
    for (let i = 0; i < points; i++) {
      this.deformParams.push({
        radiusMultiplier: 1,
        angleOffset: 0,
        noise: 0
      });
      this.targetDeformParams.push({
        radiusMultiplier: 1,
        angleOffset: 0,
        noise: 0
      });
    }
  }
  
  generateTargetParams() {
    const { maxDeformation } = CONFIG.morphing;
    for (let i = 0; i < this.deformParams.length; i++) {
      this.targetDeformParams[i] = {
        radiusMultiplier: 0.7 + this.rnd() * 0.6,
        angleOffset: (this.rnd() - 0.5) * maxDeformation,
        noise: (this.rnd() - 0.5) * maxDeformation
      };
    }
    this.targetScale = 0.8 + this.rnd() * 0.4;
    this.targetOpacity = 0.6 + this.rnd() * 0.3;
  }
  
  update() {
    const { deformationSpeed } = CONFIG.morphing;
    this.time += 0.016; // ~60fps
    
    // Interpolation vers les cibles
    for (let i = 0; i < this.deformParams.length; i++) {
      const current = this.deformParams[i];
      const target = this.targetDeformParams[i];
      
      current.radiusMultiplier += (target.radiusMultiplier - current.radiusMultiplier) * deformationSpeed;
      current.angleOffset += (target.angleOffset - current.angleOffset) * deformationSpeed;
      current.noise += (target.noise - current.noise) * deformationSpeed;
    }
    
    this.scale += (this.targetScale - this.scale) * deformationSpeed;
    this.opacity += (this.targetOpacity - this.opacity) * deformationSpeed;
    
    // Mouvement brownien
    this.velocity.x += (this.rnd() - 0.5) * 0.5;
    this.velocity.y += (this.rnd() - 0.5) * 0.5;
    this.velocity.x *= 0.98; // Friction
    this.velocity.y *= 0.98;
    
    this.cx += this.velocity.x;
    this.cy += this.velocity.y;
    
    // Générer de nouvelles cibles périodiquement
    if (this.time % 3 < 0.016) { // Toutes les 3 secondes environ
      this.generateTargetParams();
    }
  }
  
  getPath() {
    const { points, tension } = CONFIG.shape;
    const pts = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const params = this.deformParams[i];
      
      // Rayon de base avec déformation
      const baseRadius = (this.baseRx + this.baseRy) * 0.5;
      const radius = baseRadius * this.scale * params.radiusMultiplier;
      
      // Position avec bruit et décalage d'angle
      const adjustedAngle = angle + params.angleOffset + Math.sin(this.time * 2 + i * 0.5) * 0.1;
      const noiseOffset = Math.sin(this.time * 3 + i * 0.3) * params.noise * 20;
      
      const x = this.cx + Math.cos(adjustedAngle) * (radius + noiseOffset);
      const y = this.cy + Math.sin(adjustedAngle) * (radius + noiseOffset);
      
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
    return this.colorKey === other.colorKey && 
           this.distanceTo(other) < CONFIG.morphing.fusionDistance;
  }
  
  fuseWith(other) {
    // Fusionner les positions (moyenne pondérée)
    const totalScale = this.scale + other.scale;
    this.cx = (this.cx * this.scale + other.cx * other.scale) / totalScale;
    this.cy = (this.cy * this.scale + other.cy * other.scale) / totalScale;
    this.scale = Math.min(totalScale * 0.7, 2); // Limite la taille
    this.targetScale = this.scale;
    
    // Fusionner les paramètres de déformation
    for (let i = 0; i < this.deformParams.length; i++) {
      this.deformParams[i].radiusMultiplier = 
        (this.deformParams[i].radiusMultiplier + other.deformParams[i].radiusMultiplier) * 0.6;
    }
    
    this.generateTargetParams();
  }
  
  split() {
    const newBlob = new MorphingBlob({
      cx: this.cx + (this.rnd() - 0.5) * 100,
      cy: this.cy + (this.rnd() - 0.5) * 100,
      rx: this.baseRx * 0.7,
      ry: this.baseRy * 0.7,
      colorKey: this.colorKey,
      rnd: this.rnd,
      id: this.id + '_split_' + Date.now()
    });
    
    this.scale *= 0.8;
    this.targetScale = this.scale;
    newBlob.scale = 0.6;
    newBlob.targetScale = 0.6;
    
    return newBlob;
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
          return dist < (rx + ry + blob.baseRx + blob.baseRy) * 0.3;
        });
        
        if (!tooClose) {
          allBlobs.push(new MorphingBlob({
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

/* ================= COMPOSANT PRINCIPAL ================= */
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
  
  // Créer les blobs initiaux
  useEffect(() => {
    const W = Math.max(docW, CONFIG.tileWidth);
    const H = docH;
    const initialBlobs = createInitialBlobs(rnd, W, H);
    setBlobs(initialBlobs);
  }, [rnd, docW, docH]);
  
  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setBlobs(currentBlobs => {
        const newBlobs = [...currentBlobs];
        const { splitProbability, fusionProbability } = CONFIG.morphing;
        
        // Mettre à jour tous les blobs
        newBlobs.forEach(blob => blob.update());
        
        // Gestion des fusions
        for (let i = newBlobs.length - 1; i >= 0; i--) {
          for (let j = i - 1; j >= 0; j--) {
            if (newBlobs[i].canFuseWith(newBlobs[j]) && rnd() < fusionProbability) {
              newBlobs[i].fuseWith(newBlobs[j]);
              newBlobs.splice(j, 1);
              i--; // Ajuster l'index
              break;
            }
          }
        }
        
        // Gestion des divisions
        const blobsToAdd = [];
        newBlobs.forEach(blob => {
          if (blob.scale > 1.2 && rnd() < splitProbability) {
            const splitBlob = blob.split();
            blobsToAdd.push(splitBlob);
          }
        });
        
        // Limiter le nombre total de blobs
        const allBlobs = [...newBlobs, ...blobsToAdd];
        if (allBlobs.length > 25) {
          // Supprimer les plus petits blobs
          allBlobs.sort((a, b) => a.scale - b.scale);
          return allBlobs.slice(allBlobs.length - 25);
        }
        
        return allBlobs;
      });
    }, CONFIG.morphing.updateInterval);
    
    return () => clearInterval(interval);
  }, [rnd]);
  
  const { W, H } = useMemo(() => ({
    W: Math.max(docW, CONFIG.tileWidth),
    H: docH
  }), [docW, docH]);
  
  return (
    <div
      aria-hidden
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
        style={{ background: CONFIG.colors.bg }}
      >
        <rect x="0" y="0" width={W} height={H} fill={CONFIG.colors.bg} />
        
        {/* Defs pour les filtres de fusion */}
        <defs>
          <filter id="gooey" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
        
        {/* Rendu des blobs avec tension de surface */}
        <g filter="url(#gooey)">
          {blobs.map((blob) => (
            <path
              key={blob.id}
              d={blob.getPath()}
              fill={CONFIG.colors[blob.colorKey]}
              opacity={blob.opacity}
              style={{
                transition: 'opacity 0.5s ease'
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
