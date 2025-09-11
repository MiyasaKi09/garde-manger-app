'use client';
import { useEffect, useMemo, useState } from "react";

/* ================= CONFIGURATION MÉTABALLS ================= */
const CONFIG = {
  colors: {
    bg: "var(--cream-100, #f4efe6)",
    olive: "var(--olive-500, #6e8b5e)",
    terra: "var(--terra-500, #c08a5a)",
    sable: "var(--sable-300, #e2c98f)",
  },
  counts: { olive: 4, terra: 3, sable: 4 },
  bubbles: {
    minRadius: 80,
    maxRadius: 150,
    moveSpeed: 0.3,
    fusionThreshold: 0.7, // Distance pour fusion (relatif aux rayons)
    splitThreshold: 180, // Rayon max avant division
    minSplitRadius: 60,
  },
  metaballs: {
    threshold: 1.0, // Seuil pour définir la surface
    gridSize: 8, // Résolution de la grille
    smoothing: 0.5, // Lissage des contours
  },
  physics: {
    attraction: 0.02, // Force d'attraction entre bulles
    repulsion: 0.05, // Force de répulsion si trop proches
    friction: 0.95, // Friction pour ralentir
    boundaryForce: 0.1, // Force pour rester dans les limites
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

/* ================= CLASSE BULLE ================= */
class MetaBubble {
  constructor({ x, y, radius, colorKey, rnd, id }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.targetRadius = radius;
    this.colorKey = colorKey;
    this.rnd = rnd;
    
    // Vélocité et forces
    this.vx = randBetween(rnd, -1, 1);
    this.vy = randBetween(rnd, -1, 1);
    this.fx = 0;
    this.fy = 0;
    
    // États
    this.age = 0;
    this.opacity = 0.8;
    this.canSplit = true;
    this.splitCooldown = 0;
  }
  
  update(allBubbles, bounds) {
    this.age++;
    
    // Réinitialiser les forces
    this.fx = 0;
    this.fy = 0;
    
    // Forces entre bulles
    allBubbles.forEach(other => {
      if (other.id === this.id) return;
      
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // Distance relative aux rayons
        const relativeDistance = distance / (this.radius + other.radius);
        
        if (relativeDistance < 2) {
          if (other.colorKey === this.colorKey) {
            // Attraction entre bulles de même couleur
            const attractionForce = CONFIG.physics.attraction * (2 - relativeDistance);
            this.fx += normalizedDx * attractionForce;
            this.fy += normalizedDy * attractionForce;
          } else {
            // Répulsion entre bulles de couleurs différentes
            const repulsionForce = CONFIG.physics.repulsion / relativeDistance;
            this.fx -= normalizedDx * repulsionForce;
            this.fy -= normalizedDy * repulsionForce;
          }
        }
      }
    });
    
    // Forces de bordure (rester dans l'écran)
    const margin = this.radius + 50;
    if (this.x < margin) this.fx += CONFIG.physics.boundaryForce;
    if (this.x > bounds.width - margin) this.fx -= CONFIG.physics.boundaryForce;
    if (this.y < margin) this.fy += CONFIG.physics.boundaryForce;
    if (this.y > bounds.height - margin) this.fy -= CONFIG.physics.boundaryForce;
    
    // Bruit brownien
    this.fx += (this.rnd() - 0.5) * 0.02;
    this.fy += (this.rnd() - 0.5) * 0.02;
    
    // Mise à jour vélocité
    this.vx += this.fx;
    this.vy += this.fy;
    this.vx *= CONFIG.physics.friction;
    this.vy *= CONFIG.physics.friction;
    
    // Mise à jour position
    this.x += this.vx * CONFIG.bubbles.moveSpeed;
    this.y += this.vy * CONFIG.bubbles.moveSpeed;
    
    // Mise à jour rayon vers la cible
    this.radius += (this.targetRadius - this.radius) * 0.05;
    
    // Cooldown pour split
    if (this.splitCooldown > 0) this.splitCooldown--;
  }
  
  canFuseWith(other) {
    if (other.colorKey !== this.colorKey) return false;
    
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const fusionDistance = (this.radius + other.radius) * CONFIG.bubbles.fusionThreshold;
    
    return distance < fusionDistance;
  }
  
  fuseWith(other) {
    // Conservation de la masse (surface)
    const totalArea = Math.PI * (this.radius * this.radius + other.radius * other.radius);
    const newRadius = Math.sqrt(totalArea / Math.PI);
    
    // Position pondérée par la masse
    const totalMass = this.radius * this.radius + other.radius * other.radius;
    this.x = (this.x * this.radius * this.radius + other.x * other.radius * other.radius) / totalMass;
    this.y = (this.y * this.radius * this.radius + other.y * other.radius * other.radius) / totalMass;
    
    // Nouveau rayon
    this.targetRadius = Math.min(newRadius, CONFIG.bubbles.splitThreshold * 0.8);
    
    // Conservation de la quantité de mouvement
    this.vx = (this.vx * this.radius + other.vx * other.radius) / (this.radius + other.radius);
    this.vy = (this.vy * this.radius + other.vy * other.radius) / (this.radius + other.radius);
    
    this.splitCooldown = 60; // Empêcher split immédiat
  }
  
  shouldSplit() {
    return this.canSplit && 
           this.splitCooldown === 0 && 
           this.radius > CONFIG.bubbles.splitThreshold && 
           this.rnd() < 0.01; // 1% de chance par frame
  }
  
  split() {
    const newRadius = this.radius * 0.7;
    const offset = newRadius * 0.5;
    
    // Angle aléatoire pour la direction de split
    const angle = this.rnd() * Math.PI * 2;
    const offsetX = Math.cos(angle) * offset;
    const offsetY = Math.sin(angle) * offset;
    
    // Nouvelle bulle
    const newBubble = new MetaBubble({
      x: this.x + offsetX,
      y: this.y + offsetY,
      radius: newRadius,
      colorKey: this.colorKey,
      rnd: this.rnd,
      id: this.id + '_split_' + Date.now()
    });
    
    // Vélocités opposées
    newBubble.vx = -this.vx * 0.5 + Math.cos(angle) * 2;
    newBubble.vy = -this.vy * 0.5 + Math.sin(angle) * 2;
    
    // Mise à jour de la bulle actuelle
    this.x -= offsetX;
    this.y -= offsetY;
    this.targetRadius = newRadius;
    this.vx = this.vx * 0.5 - Math.cos(angle) * 2;
    this.vy = this.vy * 0.5 - Math.sin(angle) * 2;
    this.splitCooldown = 120;
    
    return newBubble;
  }
  
  // Contribution à la fonction métaball
  getInfluence(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return this.radius * this.radius;
    
    // Fonction métaball classique
    return (this.radius * this.radius) / (distance * distance);
  }
}

/* ================= GÉNÉRATION DU CHEMIN SVG DEPUIS MÉTABALLS ================= */
function generateMetaballPath(bubbles, bounds) {
  const { threshold, gridSize } = CONFIG.metaballs;
  const width = bounds.width;
  const height = bounds.height;
  
  // Créer une grille de valeurs
  const cols = Math.ceil(width / gridSize);
  const rows = Math.ceil(height / gridSize);
  const grid = [];
  
  for (let y = 0; y <= rows; y++) {
    grid[y] = [];
    for (let x = 0; x <= cols; x++) {
      const px = x * gridSize;
      const py = y * gridSize;
      
      let value = 0;
      bubbles.forEach(bubble => {
        value += bubble.getInfluence(px, py);
      });
      
      grid[y][x] = value;
    }
  }
  
  // Marching squares pour générer les contours
  const paths = [];
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tl = grid[y][x] >= threshold ? 1 : 0;
      const tr = grid[y][x + 1] >= threshold ? 1 : 0;
      const bl = grid[y + 1][x] >= threshold ? 1 : 0;
      const br = grid[y + 1][x + 1] >= threshold ? 1 : 0;
      
      const caseNum = tl * 8 + tr * 4 + br * 2 + bl;
      
      if (caseNum !== 0 && caseNum !== 15) {
        // Il y a une frontière dans cette cellule
        const cellPath = getMarchingSquaresPath(caseNum, x * gridSize, y * gridSize, gridSize);
        if (cellPath) paths.push(cellPath);
      }
    }
  }
  
  return paths.join(' ');
}

function getMarchingSquaresPath(caseNum, x, y, size) {
  const midX = x + size / 2;
  const midY = y + size / 2;
  const rightX = x + size;
  const bottomY = y + size;
  
  // Marching squares lookup table (simplifié)
  switch (caseNum) {
    case 1: return `M ${x} ${midY} L ${midX} ${bottomY}`;
    case 2: return `M ${midX} ${bottomY} L ${rightX} ${midY}`;
    case 3: return `M ${x} ${midY} L ${rightX} ${midY}`;
    case 4: return `M ${midX} ${y} L ${rightX} ${midY}`;
    case 5: return `M ${x} ${midY} L ${midX} ${y} M ${midX} ${bottomY} L ${rightX} ${midY}`;
    case 6: return `M ${midX} ${y} L ${midX} ${bottomY}`;
    case 7: return `M ${x} ${midY} L ${midX} ${y}`;
    case 8: return `M ${x} ${midY} L ${midX} ${y}`;
    case 9: return `M ${midX} ${y} L ${midX} ${bottomY}`;
    case 10: return `M ${x} ${midY} L ${midX} ${bottomY} M ${midX} ${y} L ${rightX} ${midY}`;
    case 11: return `M ${midX} ${y} L ${rightX} ${midY}`;
    case 12: return `M ${x} ${midY} L ${rightX} ${midY}`;
    case 13: return `M ${midX} ${bottomY} L ${rightX} ${midY}`;
    case 14: return `M ${x} ${midY} L ${midX} ${bottomY}`;
    default: return '';
  }
}

/* ================= HOOK DE TAILLE ================= */
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
  const { width: docW, height: docH } = useWindowSize();
  
  // RNG
  const rnd = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return mulberry32(a[0]);
    }
    return mulberry32(Date.now() & 0xffffffff);
  }, []);
  
  // Initialisation des bulles
  useEffect(() => {
    const initialBubbles = [];
    let id = 0;
    
    ['olive', 'terra', 'sable'].forEach(colorKey => {
      const count = CONFIG.counts[colorKey];
      
      for (let i = 0; i < count; i++) {
        const radius = randBetween(rnd, CONFIG.bubbles.minRadius, CONFIG.bubbles.maxRadius);
        const x = randBetween(rnd, radius + 100, docW - radius - 100);
        const y = randBetween(rnd, radius + 100, docH - radius - 100);
        
        initialBubbles.push(new MetaBubble({
          x, y, radius, colorKey, rnd, id: id++
        }));
      }
    });
    
    setBubbles(initialBubbles);
  }, [rnd, docW, docH]);
  
  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(currentBubbles => {
        if (currentBubbles.length === 0) return currentBubbles;
        
        const bounds = { width: docW, height: docH };
        const newBubbles = [...currentBubbles];
        
        // Mise à jour de toutes les bulles
        newBubbles.forEach(bubble => bubble.update(newBubbles, bounds));
        
        // Gestion des fusions
        for (let i = newBubbles.length - 1; i >= 0; i--) {
          for (let j = i - 1; j >= 0; j--) {
            if (newBubbles[i].canFuseWith(newBubbles[j])) {
              newBubbles[i].fuseWith(newBubbles[j]);
              newBubbles.splice(j, 1);
              i--; // Ajuster l'index
              break;
            }
          }
        }
        
        // Gestion des divisions
        const bubblesAdded = [];
        newBubbles.forEach(bubble => {
          if (bubble.shouldSplit()) {
            const splitBubble = bubble.split();
            bubblesAdded.push(splitBubble);
          }
        });
        
        // Limiter le nombre total
        const allBubbles = [...newBubbles, ...bubblesAdded];
        if (allBubbles.length > 15) {
          allBubbles.sort((a, b) => a.radius - b.radius);
          return allBubbles.slice(-15);
        }
        
        return allBubbles;
      });
    }, 50); // 20 FPS pour fluidité
    
    return () => clearInterval(interval);
  }, [docW, docH]);
  
  // Grouper par couleur pour le rendu
  const bubblesByColor = useMemo(() => {
    const groups = { olive: [], terra: [], sable: [] };
    bubbles.forEach(bubble => {
      if (groups[bubble.colorKey]) {
        groups[bubble.colorKey].push(bubble);
      }
    });
    return groups;
  }, [bubbles]);
  
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        height: `${docH}px`,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden"
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${docW} ${docH}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ background: CONFIG.colors.bg }}
      >
        <rect x="0" y="0" width={docW} height={docH} fill={CONFIG.colors.bg} />
        
        {/* Rendu des métaballs par couleur */}
        {Object.entries(bubblesByColor).map(([colorKey, colorBubbles]) => {
          if (colorBubbles.length === 0) return null;
          
          const path = generateMetaballPath(colorBubbles, { width: docW, height: docH });
          
          return (
            <path
              key={colorKey}
              d={path}
              fill={CONFIG.colors[colorKey]}
              opacity="0.8"
              style={{
                filter: 'blur(1px)', // Léger lissage
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
