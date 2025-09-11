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
    // Nouvelles couleurs exactes du projet
    paper: "#f4efe6", // crème
    earth: "#b1793a", // ocre
    clay:  "#e6d7c4", // argile claire
    moss:  "#6ea067", // vert mousse
  },
  // Configuration pour les bulles organiques nettes
  organicBubbles: {
    count: 8,
    minRadius: 60,
    maxRadius: 140,
    controlPoints: 8,
    morphSpeed: 0.008,
    fusionDistance: 100,
    colors: ['paper', 'earth', 'clay', 'moss']
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

/* ========== Bulle Organique Nette ========== */
class OrganicCrispBubble {
  constructor(x, y, radius, colorKey, seed) {
    this.x = x;
    this.y = y;
    this.baseRadius = radius;
    this.colorKey = colorKey;
    this.seed = seed;
    this.rnd = mulberry32(seed);
    this.age = 0;
    this.time = 0;
    
    // Points de contrôle pour forme organique mais nette
    this.controlPoints = CONFIG.organicBubbles.controlPoints;
    const rndFunc = this.rnd;
    this.deformations = Array(this.controlPoints).fill().map((_, i) => ({
      amplitude: 0.1 + rndFunc() * 0.15,
      frequency: 0.2 + rndFunc() * 0.6,
      phase: rndFunc() * Math.PI * 2,
      baseOffset: (rndFunc() - 0.5) * 0.2
    }));
    
    // Mouvement lent et fluide
    this.velocity = {
      x: (rndFunc() - 0.5) * 0.2,
      y: (rndFunc() - 0.5) * 0.2
    };
    
    this.targetX = x;
    this.targetY = y;
    this.metabolismRate = 0.15 + rndFunc() * 0.25;
  }

  update(time, allBubbles, W, H) {
    this.time = time;
    this.age += 0.016;
    
    // Respiration subtile
    const breathCycle = Math.sin(time * this.metabolismRate) * 0.06;
    this.currentRadius = this.baseRadius * (1 + breathCycle);
    
    // Mise à jour des déformations
    this.deformations.forEach(def => {
      def.currentOffset = def.baseOffset + def.amplitude * Math.sin(time * def.frequency + def.phase);
    });
    
    // Mouvement fluide vers la cible
    this.x += (this.targetX - this.x) * 0.015;
    this.y += (this.targetY - this.y) * 0.015;
    
    // Nouvelle cible périodiquement
    if (Math.floor(time * 8) % 180 === 0 && Math.random() < 0.08) {
      this.targetX = this.currentRadius + Math.random() * (W - this.currentRadius * 2);
      this.targetY = this.currentRadius + Math.random() * (H - this.currentRadius * 2);
    }
    
    // Confinement doux
    this.bounceOffWalls(W, H);
  }

  bounceOffWalls(W, H) {
    const margin = this.currentRadius;
    if (this.x < margin) {
      this.x = margin;
      this.targetX = margin + 50;
    }
    if (this.x > W - margin) {
      this.x = W - margin;
      this.targetX = W - margin - 50;
    }
    if (this.y < margin) {
      this.y = margin;
      this.targetY = margin + 50;
    }
    if (this.y > H - margin) {
      this.y = H - margin;
      this.targetY = H - margin - 50;
    }
  }

  generateSharpPath() {
    const points = [];
    
    for (let i = 0; i < this.controlPoints; i++) {
      const angle = (i / this.controlPoints) * Math.PI * 2;
      const def = this.deformations[i];
      
      // Rayon avec déformation nette
      const radius = this.currentRadius * (1 + def.currentOffset);
      
      const x = this.x + Math.cos(angle) * radius;
      const y = this.y + Math.sin(angle) * radius;
      
      points.push([x, y]);
    }
    
    return this.createCrispPath(points);
  }

  createCrispPath(points) {
    if (points.length < 3) return '';
    
    let path = `M ${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
    
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      const nextNext = points[(i + 2) % points.length];
      
      // Courbes de Bézier pour la fluidité mais sans sur-lissage
      const tension = 0.15; // Moins de tension = plus net
      const cp1x = current[0] + (next[0] - points[(i - 1 + points.length) % points.length][0]) * tension;
      const cp1y = current[1] + (next[1] - points[(i - 1 + points.length) % points.length][1]) * tension;
      const cp2x = next[0] - (nextNext[0] - current[0]) * tension;
      const cp2y = next[1] - (nextNext[1] - current[1]) * tension;
      
      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${next[0].toFixed(1)},${next[1].toFixed(1)}`;
    }
    
    return path + ' Z';
  }

  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  canFuseWith(other) {
    return this.distanceTo(other) < CONFIG.organicBubbles.fusionDistance && 
           Math.abs(CONFIG.organicBubbles.colors.indexOf(this.colorKey) - 
                   CONFIG.organicBubbles.colors.indexOf(other.colorKey)) <= 1;
  }
}

/* ========== Création des bulles initiales ========== */
function createOrganicBubbles(rnd, W, H) {
  const bubbles = [];
  const { count, minRadius, maxRadius, colors } = CONFIG.organicBubbles;
  
  for (let i = 0; i < count; i++) {
    const x = minRadius + rnd() * (W - minRadius * 2);
    const y = minRadius + rnd() * (H - minRadius * 2);
    
    // Privilégier les grosses tailles (70% de grosses bulles)
    const sizeRoll = rnd();
    let radius;
    if (sizeRoll < 0.7) {
      // Grosses bulles
      radius = maxRadius * 0.8 + rnd() * (maxRadius * 0.2);
    } else {
      // Moyennes bulles
      radius = minRadius + rnd() * (maxRadius - minRadius) * 0.6;
    }
    
    const colorKey = colors[Math.floor(rnd() * colors.length)];
    
    bubbles.push(new OrganicCrispBubble(x, y, radius, colorKey, i * 1000 + Date.now()));
  }
  
  return bubbles;
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
  const [bubbles, setBubbles] = useState([]);
  const [time, setTime] = useState(0);
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
  
  // Créer les bulles organiques initiales
  useEffect(() => {
    const W = Math.max(docW, CONFIG.tileWidth);
    const H = docH;
    const organicBubbles = createOrganicBubbles(rnd, W, H);
    setBubbles(organicBubbles);
  }, [rnd, docW, docH]);
  
  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => prev + 0.016);
      
      setBubbles(currentBubbles => {
        const W = Math.max(docW, CONFIG.tileWidth);
        const H = docH;
        const updatedBubbles = [...currentBubbles];
        
        // Mettre à jour toutes les bulles
        updatedBubbles.forEach(bubble => {
          bubble.update(time, updatedBubbles, W, H);
        });
        
        // Fusion très occasionnelle
        for (let i = 0; i < updatedBubbles.length; i++) {
          for (let j = i + 1; j < updatedBubbles.length; j++) {
            if (updatedBubbles[i].canFuseWith(updatedBubbles[j])) {
              if (Math.random() < 0.003) { // Très rare
                const bubble1 = updatedBubbles[i];
                const bubble2 = updatedBubbles[j];
                
                const newX = (bubble1.x + bubble2.x) / 2;
                const newY = (bubble1.y + bubble2.y) / 2;
                const newRadius = Math.min(
                  Math.sqrt(bubble1.baseRadius ** 2 + bubble2.baseRadius ** 2) * 0.85,
                  CONFIG.organicBubbles.maxRadius * 1.3
                );
                const newColorKey = bubble1.colorKey;
                
                const fusedBubble = new OrganicCrispBubble(
                  newX, newY, newRadius, newColorKey, Date.now() + i * j
                );
                
                updatedBubbles.splice(j, 1);
                updatedBubbles.splice(i, 1);
                updatedBubbles.push(fusedBubble);
                return updatedBubbles;
              }
            }
          }
        }
        
        // Division très rare pour les énormes bulles
        updatedBubbles.forEach((bubble, index) => {
          if (bubble.baseRadius > CONFIG.organicBubbles.maxRadius * 1.2 && Math.random() < 0.0008) {
            const childRadius = bubble.baseRadius * 0.6;
            const angle = Math.random() * Math.PI * 2;
            const distance = childRadius * 2;
            
            const child = new OrganicCrispBubble(
              bubble.x + Math.cos(angle) * distance,
              bubble.y + Math.sin(angle) * distance,
              childRadius,
              bubble.colorKey,
              Date.now() + index * 10000
            );
            
            bubble.baseRadius *= 0.75;
            updatedBubbles.push(child);
          }
        });
        
        return updatedBubbles;
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, [time, docW, docH]);
  
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
        
        <defs>
          {/* Gradient pour effet de profondeur sans flou */}
          <radialGradient id="crispGradient" cx="25%" cy="25%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.03)" />
          </radialGradient>
        </defs>
        
        {/* Rendu des bulles organiques SANS filtres de flou */}
        <g>
          {bubbles.map((bubble, index) => (
            <g key={index}>
              {/* Ombre légère et nette */}
              <path
                d={bubble.generateSharpPath()}
                fill="rgba(0,0,0,0.04)"
                transform="translate(1.5,1.5)"
              />
              
              {/* Bulle principale avec contour net */}
              <path
                d={bubble.generateSharpPath()}
                fill={CONFIG.colors[bubble.colorKey]}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                shapeRendering="geometricPrecision"
                opacity="0.9"
              />
              
              {/* Reflet subtil et net */}
              <ellipse
                cx={bubble.x - bubble.currentRadius * 0.2}
                cy={bubble.y - bubble.currentRadius * 0.2}
                rx={bubble.currentRadius * 0.25}
                ry={bubble.currentRadius * 0.12}
                fill="url(#crispGradient)"
                opacity="0.4"
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
