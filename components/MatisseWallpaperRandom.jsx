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
    count: 20,
    minRadius: 50,
    maxRadius: 180,
    controlPoints: 8,
    morphSpeed: 0.02,
    fusionDistance: 100,
    colors: ['paper', 'earth', 'clay', 'moss'],
    // Nouvelles propriétés pour la fluidité
    fusionSpeed: 0.008, // Vitesse de fusion graduelle
    birthRadius: 20, // Taille de naissance des bulles
    maxAge: 300 // Age max avant division naturelle
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

/* ========== Bulle Organique avec Cycle de Vie ========== */
class LifeCycleBubble {
  constructor(x, y, radius, colorKey, seed, age = 0) {
    this.x = x;
    this.y = y;
    this.baseRadius = radius;
    this.currentRadius = radius;
    this.targetRadius = radius;
    this.colorKey = colorKey;
    this.seed = seed;
    this.rnd = mulberry32(seed);
    this.age = age;
    this.time = 0;
    this.opacity = age === 0 ? 0 : 0.9; // Naissance progressive
    this.targetOpacity = 0.9;
    
    // État de fusion
    this.fusionPartner = null;
    this.fusionProgress = 0;
    this.isFusing = false;
    this.isBeingBorn = age === 0;
    
    // Points de contrôle pour forme organique
    this.controlPoints = CONFIG.organicBubbles.controlPoints;
    const rndFunc = this.rnd;
    this.deformations = Array(this.controlPoints).fill().map((_, i) => ({
      amplitude: 0.08 + rndFunc() * 0.12,
      frequency: 0.15 + rndFunc() * 0.4,
      phase: rndFunc() * Math.PI * 2,
      baseOffset: (rndFunc() - 0.5) * 0.15
    }));
    
    // Mouvement organique
    this.velocity = {
      x: (rndFunc() - 0.5) * 0.3,
      y: (rndFunc() - 0.5) * 0.3
    };
    
    this.targetX = x;
    this.targetY = y;
    this.metabolismRate = 0.2 + rndFunc() * 0.3;
    this.driftSpeed = 0.05 + rndFunc() * 0.15;
  }

  update(time, allBubbles, W, H, scrollY = 0) {
    this.time = time;
    this.age += 0.016;
    
    // Naissance douce
    if (this.isBeingBorn) {
      this.opacity = Math.min(this.opacity + 0.02, this.targetOpacity);
      this.currentRadius = Math.min(this.currentRadius + 1.5, this.targetRadius);
      if (this.opacity >= this.targetOpacity && this.currentRadius >= this.targetRadius - 5) {
        this.isBeingBorn = false;
      }
    }
    
    // Gestion fusion douce
    if (this.isFusing && this.fusionPartner) {
      this.fusionProgress += CONFIG.organicBubbles.fusionSpeed;
      
      // Rapprochement graduel
      const lerpFactor = this.fusionProgress;
      this.x += (this.fusionPartner.x - this.x) * lerpFactor * 0.1;
      this.y += (this.fusionPartner.y - this.y) * lerpFactor * 0.1;
      
      // Fusion des tailles graduellement
      const combinedRadius = Math.sqrt(this.baseRadius ** 2 + this.fusionPartner.baseRadius ** 2) * 0.9;
      this.targetRadius = this.baseRadius + (combinedRadius - this.baseRadius) * lerpFactor;
      
      // Transparence pour la fusion
      this.targetOpacity = 0.9 - lerpFactor * 0.3;
    }
    
    // Ajustement graduel de la taille
    this.currentRadius += (this.targetRadius - this.currentRadius) * 0.05;
    this.opacity += (this.targetOpacity - this.opacity) * 0.03;
    
    // Respiration organique
    const breathCycle = Math.sin(time * this.metabolismRate) * 0.08;
    const finalRadius = this.currentRadius * (1 + breathCycle);
    
    // Mise à jour des déformations
    this.deformations.forEach((def, i) => {
      def.currentOffset = def.baseOffset + 
        def.amplitude * Math.sin(time * def.frequency + def.phase) +
        Math.sin(time * 0.3 + i * 0.7) * 0.05;
    });
    
    // Mouvement brownien doux
    this.velocity.x += Math.sin(time * this.driftSpeed + this.seed) * 0.01;
    this.velocity.y += Math.cos(time * this.driftSpeed * 1.2 + this.seed) * 0.01;
    this.velocity.x *= 0.95; // Friction
    this.velocity.y *= 0.95;
    
    // Effet de scroll parallax fluide
    if (typeof window !== 'undefined' && scrollY) {
      const parallaxFactor = 0.3 + (this.baseRadius / CONFIG.organicBubbles.maxRadius) * 0.4;
      this.y += scrollY * parallaxFactor * 0.001;
    }
    
    // Application du mouvement
    this.x += (this.targetX - this.x) * 0.02 + this.velocity.x;
    this.y += (this.targetY - this.y) * 0.02 + this.velocity.y;
    
    // Nouvelle cible périodiquement
    if (Math.floor(time * 5) % 200 === 0 && Math.random() < 0.08) {
      this.setNewTarget(W, H);
    }
    
    // Confinement avec circulation
    this.handleWorldBounds(W, H);
    
    return finalRadius;
  }
  
  setNewTarget(W, H) {
    // Éviter les bords pour éviter les "pops"
    const margin = this.currentRadius + 50;
    this.targetX = margin + Math.random() * (W - margin * 2);
    this.targetY = margin + Math.random() * (H - margin * 2);
  }
  
  handleWorldBounds(W, H) {
    const margin = this.currentRadius + 20;
    
    // Circulation fluide au lieu de rebond
    if (this.x < -margin) {
      this.x = W + margin;
      this.targetX = W - margin;
    }
    if (this.x > W + margin) {
      this.x = -margin;
      this.targetX = margin;
    }
    if (this.y < -margin) {
      this.y = H + margin;
      this.targetY = H - margin;
    }
    if (this.y > H + margin) {
      this.y = -margin;
      this.targetY = margin;
    }
  }

  generateSharpPath() {
    const points = [];
    const finalRadius = this.currentRadius;
    
    for (let i = 0; i < this.controlPoints; i++) {
      const angle = (i / this.controlPoints) * Math.PI * 2;
      const def = this.deformations[i];
      
      const radius = finalRadius * (1 + def.currentOffset);
      
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
      
      const tension = 0.12;
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
    if (this.isFusing || other.isFusing || this.isBeingBorn || other.isBeingBorn) return false;
    
    return this.distanceTo(other) < CONFIG.organicBubbles.fusionDistance && 
           Math.abs(CONFIG.organicBubbles.colors.indexOf(this.colorKey) - 
                   CONFIG.organicBubbles.colors.indexOf(other.colorKey)) <= 1 &&
           this.age > 30 && other.age > 30; // Maturité requise
  }
  
  startFusion(partner) {
    this.isFusing = true;
    this.fusionPartner = partner;
    this.fusionProgress = 0;
  }
  
  shouldDivide() {
    return !this.isFusing && 
           !this.isBeingBorn && 
           this.currentRadius > CONFIG.organicBubbles.maxRadius * 0.9 && 
           this.age > CONFIG.organicBubbles.maxAge;
  }
  
  createOffspring(W, H) {
    const angle = Math.random() * Math.PI * 2;
    const distance = this.currentRadius * 1.5;
    const childRadius = this.currentRadius * 0.6;
    
    const childX = this.x + Math.cos(angle) * distance;
    const childY = this.y + Math.sin(angle) * distance;
    
    // Ajuster la position pour éviter les bords
    const margin = childRadius + 30;
    const safeX = Math.max(margin, Math.min(W - margin, childX));
    const safeY = Math.max(margin, Math.min(H - margin, childY));
    
    const child = new LifeCycleBubble(
      safeX, safeY, CONFIG.organicBubbles.birthRadius, 
      this.colorKey, Date.now() + Math.random() * 10000, 0
    );
    
    child.targetRadius = childRadius;
    
    // Réduire la taille du parent
    this.targetRadius = this.currentRadius * 0.7;
    this.age = 0; // Rajeunir le parent
    
    return child;
  }
}

/* ========== Création initiale avec spawn organique ========== */
function createOrganicBubbles(rnd, W, H) {
  const bubbles = [];
  const { count, minRadius, maxRadius, colors } = CONFIG.organicBubbles;
  
  for (let i = 0; i < count; i++) {
    // Spawn avec marges pour éviter les "pops"
    const margin = maxRadius + 50;
    const x = margin + rnd() * (W - margin * 2);
    const y = margin + rnd() * (H - margin * 2);
    
    const sizeRoll = rnd();
    let radius;
    if (sizeRoll < 0.6) {
      radius = maxRadius * 0.7 + rnd() * (maxRadius * 0.3);
    } else {
      radius = minRadius + rnd() * (maxRadius - minRadius) * 0.6;
    }
    
    const colorKey = colors[Math.floor(rnd() * colors.length)];
    const age = rnd() * 100; // Age initial varié
    
    bubbles.push(new LifeCycleBubble(x, y, radius, colorKey, i * 1000 + Date.now(), age));
  }
  
  return bubbles;
}

/* ================= Hooks sécurisés ================= */
function useWindowSize() {
  const [size, setSize] = useState({ width: 1200, height: 800 });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    function updateSize() {
      setSize({ 
        width: window.innerWidth, 
        height: Math.max(window.innerHeight, document.documentElement.scrollHeight * 1.5) // Plus grand pour le scroll
      });
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    function updateScroll() {
      setScrollY(window.scrollY);
    }
    
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);
  return scrollY;
}

/* ================= COMPOSANT PRINCIPAL ================= */
export default function MatisseWallpaperRandom() {
  const [bubbles, setBubbles] = useState([]);
  const [time, setTime] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { width: docW, height: docH } = useWindowSize();
  const scrollY = useScrollPosition();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const rnd = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return mulberry32(a[0]);
    }
    return mulberry32(Date.now() & 0xffffffff);
  }, []);
  
  // Initialisation
  useEffect(() => {
    if (!mounted) return;
    
    const W = Math.max(docW, CONFIG.tileWidth);
    const H = docH;
    const organicBubbles = createOrganicBubbles(rnd, W, H);
    setBubbles(organicBubbles);
  }, [rnd, docW, docH, mounted]);
  
  // Animation avec gestion cycle de vie
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setTime(prev => prev + 0.016);
      
      setBubbles(currentBubbles => {
        const W = Math.max(docW, CONFIG.tileWidth);
        const H = docH;
        let updatedBubbles = [...currentBubbles];
        
        // Mise à jour de toutes les bulles
        updatedBubbles.forEach(bubble => {
          bubble.update(time, updatedBubbles, W, H, scrollY);
        });
        
        // Gestion des fusions organiques
        for (let i = 0; i < updatedBubbles.length; i++) {
          for (let j = i + 1; j < updatedBubbles.length; j++) {
            const bubble1 = updatedBubbles[i];
            const bubble2 = updatedBubbles[j];
            
            if (bubble1.canFuseWith(bubble2) && Math.random() < 0.002) {
              // Commencer la fusion
              bubble1.startFusion(bubble2);
              bubble2.startFusion(bubble1);
            }
          }
        }
        
        // Compléter les fusions
        const completedFusions = [];
        updatedBubbles.forEach((bubble, index) => {
          if (bubble.isFusing && bubble.fusionProgress > 1) {
            completedFusions.push(index);
          }
        });
        
        // Créer les nouvelles bulles fusionnées
        if (completedFusions.length >= 2) {
          const bubble1 = updatedBubbles[completedFusions[0]];
          const bubble2 = updatedBubbles[completedFusions[1]];
          
          const newX = (bubble1.x + bubble2.x) / 2;
          const newY = (bubble1.y + bubble2.y) / 2;
          const newRadius = Math.min(bubble1.targetRadius, CONFIG.organicBubbles.maxRadius * 1.2);
          
          const fusedBubble = new LifeCycleBubble(
            newX, newY, CONFIG.organicBubbles.birthRadius, 
            bubble1.colorKey, Date.now(), 0
          );
          fusedBubble.targetRadius = newRadius;
          
          // Supprimer les bulles fusionnées et ajouter la nouvelle
          updatedBubbles = updatedBubbles.filter((_, idx) => !completedFusions.includes(idx));
          updatedBubbles.push(fusedBubble);
        }
        
        // Divisions organiques
        const newBubbles = [];
        updatedBubbles.forEach(bubble => {
          if (bubble.shouldDivide() && Math.random() < 0.001) {
            const offspring = bubble.createOffspring(W, H);
            newBubbles.push(offspring);
          }
        });
        
        // Ajouter les nouvelles bulles
        updatedBubbles.push(...newBubbles);
        
        // Limiter le nombre total
        if (updatedBubbles.length > CONFIG.organicBubbles.count * 1.5) {
          updatedBubbles.sort((a, b) => a.currentRadius - b.currentRadius);
          updatedBubbles = updatedBubbles.slice(-CONFIG.organicBubbles.count * 1.2);
        }
        
        return updatedBubbles;
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, [time, docW, docH, scrollY, mounted]);
  
  const { W, H } = useMemo(() => ({
    W: Math.max(docW, CONFIG.tileWidth),
    H: docH
  }), [docW, docH]);
  
  if (!mounted) {
    return (
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: CONFIG.colors.bg
        }}
      />
    );
  }
  
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
          <radialGradient id="crispGradient" cx="25%" cy="25%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.03)" />
          </radialGradient>
        </defs>
        
        <g>
          {bubbles.map((bubble, index) => (
            <g key={`${bubble.seed}-${index}`}>
              <path
                d={bubble.generateSharpPath()}
                fill="rgba(0,0,0,0.03)"
                transform="translate(1,1)"
              />
              
              <path
                d={bubble.generateSharpPath()}
                fill={CONFIG.colors[bubble.colorKey]}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.5"
                shapeRendering="geometricPrecision"
                opacity={bubble.opacity}
                style={{
                  transition: 'opacity 0.5s ease'
                }}
              />
              
              <ellipse
                cx={bubble.x - bubble.currentRadius * 0.15}
                cy={bubble.y - bubble.currentRadius * 0.15}
                rx={bubble.currentRadius * 0.2}
                ry={bubble.currentRadius * 0.1}
                fill="url(#crispGradient)"
                opacity={bubble.opacity * 0.4}
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
