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
  
  // Tailles de base des cellules
  sizes: {
    olive: 100,
    terra: 85,
    sable: 115,
  },
  
  // Nombre initial de cellules
  initialCount: 12,
  maxCells: 20,
  
  // Physique
  physics: {
    baseSpeed: 15, // Vitesse de déplacement
    rotationSpeed: 0.4, // Vitesse de rotation
    friction: 0.94, // Friction pour l'inertie
    repulsionForce: 150, // Force de répulsion entre couleurs différentes
    fusionDistance: 30, // Distance pour fusionner
  },
  
  // Animation
  animation: {
    fps: 30, // 30 FPS pour la fluidité
    morphSpeed: 0.01, // Vitesse de déformation
    scaleSpeed: 0.002, // Vitesse de dilatation/compression
    scaleRange: [0.8, 1.3], // Min/max de scale
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

/* ================= CLASSE CELLULE ================= */
class Cell {
  constructor({ x, y, color, size, rnd, id, bounds, fromEdge = false }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.color = color;
    this.baseSize = size;
    this.size = size;
    this.bounds = bounds;
    this.rnd = rnd;
    this.isDead = false;
    
    // État de fusion
    this.isFusing = false;
    this.fusionProgress = 0;
    this.fusionTarget = null;
    
    // Physique
    this.vx = 0;
    this.vy = 0;
    this.rotation = rnd() * Math.PI * 2;
    // Rotation très variable et potentiellement très lente
    const rotationBase = (rnd() - 0.5) * CONFIG.physics.rotationSpeed;
    this.rotationSpeed = rotationBase * (0.1 + rnd() * CONFIG.physics.rotationVariability);
    // Changement de direction de rotation occasionnel
    this.rotationChangeTimer = rnd() * 5000;
    
    // Animation
    this.scale = fromEdge ? 0.1 : (0.9 + rnd() * 0.2);
    this.targetScale = 0.9 + rnd() * 0.2;
    this.opacity = fromEdge ? 0 : 1;
    
    // Forme avec plus de points et plus de variabilité
    this.points = [];
    this.targetPoints = [];
    const numPoints = CONFIG.animation.pointCount;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      // Variabilité initiale plus importante
      const radius = 0.7 + rnd() * 0.6;
      const angleOffset = (rnd() - 0.5) * CONFIG.animation.morphIntensity;
      this.points.push({ r: radius, a: angleOffset });
      this.targetPoints.push({ 
        r: 0.7 + rnd() * 0.6, 
        a: (rnd() - 0.5) * CONFIG.animation.morphIntensity 
      });
    }
    
    // Si spawn depuis le bord
    if (fromEdge) {
      this.spawnFromEdge();
    } else {
      // Vitesse initiale aléatoire
      this.vx = (rnd() - 0.5) * CONFIG.physics.baseSpeed;
      this.vy = (rnd() - 0.5) * CONFIG.physics.baseSpeed;
    }
  }
  
  spawnFromEdge() {
    const side = Math.floor(this.rnd() * 4);
    const margin = 50;
    
    switch(side) {
      case 0: // Haut
        this.x = this.rnd() * this.bounds.width;
        this.y = -margin;
        this.vx = (this.rnd() - 0.5) * CONFIG.physics.baseSpeed * 0.5;
        this.vy = Math.abs(this.rnd() * CONFIG.physics.baseSpeed);
        break;
      case 1: // Droite
        this.x = this.bounds.width + margin;
        this.y = this.rnd() * this.bounds.height;
        this.vx = -Math.abs(this.rnd() * CONFIG.physics.baseSpeed);
        this.vy = (this.rnd() - 0.5) * CONFIG.physics.baseSpeed * 0.5;
        break;
      case 2: // Bas
        this.x = this.rnd() * this.bounds.width;
        this.y = this.bounds.height + margin;
        this.vx = (this.rnd() - 0.5) * CONFIG.physics.baseSpeed * 0.5;
        this.vy = -Math.abs(this.rnd() * CONFIG.physics.baseSpeed);
        break;
      case 3: // Gauche
        this.x = -margin;
        this.y = this.rnd() * this.bounds.height;
        this.vx = Math.abs(this.rnd() * CONFIG.physics.baseSpeed);
        this.vy = (this.rnd() - 0.5) * CONFIG.physics.baseSpeed * 0.5;
        break;
    }
  }
  
  update(deltaTime, allCells) {
    const dt = deltaTime / 1000; // Convertir en secondes
    
    // Fade in/out
    if (this.scale < 1) {
      this.scale = Math.min(1, this.scale + 0.05);
      this.opacity = Math.min(1, this.opacity + 0.05);
    }
    
    // Rotation
    this.rotation += this.rotationSpeed;
    
    // Forces aléatoires pour le mouvement brownien
    this.vx += (this.rnd() - 0.5) * 30 * dt;
    this.vy += (this.rnd() - 0.5) * 30 * dt;
    
    // Répulsion entre cellules de couleurs différentes
    allCells.forEach(other => {
      if (other.id !== this.id && other.color !== this.color) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = this.size * this.scale + other.size * other.scale;
        
        if (dist < minDist * 1.5 && dist > 0) {
          const force = CONFIG.physics.repulsionForce * (1 - dist / (minDist * 1.5));
          this.vx += (dx / dist) * force * dt;
          this.vy += (dy / dist) * force * dt;
        }
      }
    });
    
    // Friction
    this.vx *= CONFIG.physics.friction;
    this.vy *= CONFIG.physics.friction;
    
    // Limiter la vitesse
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > CONFIG.physics.baseSpeed * 2) {
      this.vx = (this.vx / speed) * CONFIG.physics.baseSpeed * 2;
      this.vy = (this.vy / speed) * CONFIG.physics.baseSpeed * 2;
    }
    
    // Appliquer le mouvement
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    
    // Rebond aux bords
    if (this.x < -100 || this.x > this.bounds.width + 100 ||
        this.y < -100 || this.y > this.bounds.height + 100) {
      this.opacity *= 0.95;
      if (this.opacity < 0.01) {
        this.isDead = true;
      }
    }
    
    // Animation de scale (dilatation/compression)
    if (Math.random() < 0.01) {
      this.targetScale = CONFIG.animation.scaleRange[0] + 
                        this.rnd() * (CONFIG.animation.scaleRange[1] - CONFIG.animation.scaleRange[0]);
    }
    this.scale += (this.targetScale - this.scale) * CONFIG.animation.scaleSpeed;
    
    // Morphing de la forme
    for (let i = 0; i < this.points.length; i++) {
      if (Math.random() < 0.005) {
        this.targetPoints[i].r = 1 + (this.rnd() - 0.5) * 0.4;
        this.targetPoints[i].a = (this.rnd() - 0.5) * 0.3;
      }
      this.points[i].r += (this.targetPoints[i].r - this.points[i].r) * CONFIG.animation.morphSpeed;
      this.points[i].a += (this.targetPoints[i].a - this.points[i].a) * CONFIG.animation.morphSpeed;
    }
    
    // Impulsion occasionnelle
    if (Math.random() < 0.02) {
      this.vx += (this.rnd() - 0.5) * CONFIG.physics.baseSpeed;
      this.vy += (this.rnd() - 0.5) * CONFIG.physics.baseSpeed;
    }
  }
  
  canFuseWith(other) {
    if (this.color !== other.color) return false;
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const touchDist = (this.size * this.scale + other.size * other.scale) * 0.8;
    return dist < touchDist;
  }
  
  fuseWith(other) {
    // Cette méthode n'est plus utilisée directement
    // Utiliser startFusion() et completeFusion() à la place
  }
  
  getPath() {
    const points = [];
    const numPoints = this.points.length;
    
    for (let i = 0; i < numPoints; i++) {
      const p = this.points[i];
      const angle = (i / numPoints) * Math.PI * 2 + p.a + this.rotation;
      const radius = this.size * this.scale * p.r;
      points.push([
        this.x + Math.cos(angle) * radius,
        this.y + Math.sin(angle) * radius
      ]);
    }
    
    // Créer une courbe de Bézier smooth
    let path = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < numPoints; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % numPoints];
      const p0 = points[(i - 1 + numPoints) % numPoints];
      const p3 = points[(i + 2) % numPoints];
      
      const tension = 0.9;
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension / 3;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension / 3;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension / 3;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension / 3;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    path += ' Z';
    
    return path;
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
  const lastTimeRef = useRef(0);
  const coverageCheckRef = useRef(0);
  
  const rnd = useMemo(() => {
    const seed = typeof crypto !== "undefined" && crypto.getRandomValues ? 
      new Uint32Array(1)[0] : Date.now();
    return mulberry32(seed);
  }, []);
  
  // Calculer la couverture des cellules
  const calculateCoverage = (cellList, width, height) => {
    const totalPageArea = width * height;
    let cellsArea = 0;
    
    cellList.forEach(cell => {
      const radius = cell.size * cell.scale;
      cellsArea += Math.PI * radius * radius;
    });
    
    return cellsArea / totalPageArea;
  };
  
  // Initialisation avec distribution homogène
  useEffect(() => {
    const bounds = { width: docW, height: docH };
    const newCells = [];
    const colors = ['olive', 'terra', 'sable'];
    
    // Grille pour distribution homogène
    const cols = 4;
    const rows = 3;
    const cellWidth = docW / cols;
    const cellHeight = docH / rows;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols && newCells.length < CONFIG.initialCount; col++) {
        const color = colors[newCells.length % colors.length];
        const sizeRange = CONFIG.sizes[color];
        const size = sizeRange.min + rnd() * (sizeRange.max - sizeRange.min);
        const x = (col + 0.5) * cellWidth + (rnd() - 0.5) * cellWidth * 0.3;
        const y = (row + 0.5) * cellHeight + (rnd() - 0.5) * cellHeight * 0.3;
        
        newCells.push(new Cell({
          x: Math.max(100, Math.min(docW - 100, x)),
          y: Math.max(100, Math.min(docH - 100, y)),
          color,
          size,
          rnd,
          id: `cell_${Date.now()}_${newCells.length}`,
          bounds,
          fromEdge: false
        }));
      }
    }
    
    setCells(newCells);
  }, [rnd, docW, docH]);
  
  // Boucle d'animation
  useEffect(() => {
    if (cells.length === 0) return;
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTimeRef.current;
      
      if (deltaTime >= 1000 / CONFIG.animation.fps) {
        setCells(currentCells => {
          let newCells = [...currentCells];
          const bounds = { width: docW, height: docH };
          
          // Mise à jour de chaque cellule
          newCells.forEach(cell => cell.update(deltaTime, newCells));
          
          // Retirer les cellules mortes
          newCells = newCells.filter(cell => !cell.isDead);
          
          // Fusion organique des cellules de même couleur
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
          
          // Vérifier la couverture toutes les 2 secondes
          coverageCheckRef.current += deltaTime;
          if (coverageCheckRef.current >= CONFIG.coverage.checkInterval) {
            coverageCheckRef.current = 0;
            const coverage = calculateCoverage(newCells, docW, docH);
            
            // Si couverture trop faible, spawn plus fréquent
            if (coverage < CONFIG.coverage.min && newCells.length < CONFIG.maxCells) {
              const colors = ['olive', 'terra', 'sable'];
              const color = colors[Math.floor(rnd() * colors.length)];
              const sizeRange = CONFIG.sizes[color];
              const size = sizeRange.min + rnd() * (sizeRange.max - sizeRange.min);
              
              newCells.push(new Cell({
                x: 0, y: 0,
                color,
                size,
                rnd,
                id: `cell_${Date.now()}_${Math.random()}`,
                bounds,
                fromEdge: true
              }));
            }
            // Si couverture trop élevée, réduire les spawns ou laisser mourir
            else if (coverage > CONFIG.coverage.max && newCells.length > CONFIG.minCells) {
              // Les cellules en bordure meurent plus vite
              newCells.forEach(cell => {
                if (cell.x < 100 || cell.x > docW - 100 || 
                    cell.y < 100 || cell.y > docH - 100) {
                  cell.opacity *= 0.98;
                }
              });
            }
          }
          
          // Spawn occasionnel depuis les bords (ajusté selon la couverture)
          const coverage = calculateCoverage(newCells, docW, docH);
          const spawnChance = coverage > CONFIG.coverage.target ? 0.002 : 0.008;
          
          if (newCells.length < CONFIG.maxCells && Math.random() < spawnChance) {
            const colors = ['olive', 'terra', 'sable'];
            const color = colors[Math.floor(rnd() * colors.length)];
            const sizeRange = CONFIG.sizes[color];
            const size = sizeRange.min + rnd() * (sizeRange.max - sizeRange.min);
            
            newCells.push(new Cell({
              x: 0, y: 0,
              color,
              size,
              rnd,
              id: `cell_${Date.now()}_${Math.random()}`,
              bounds,
              fromEdge: true
            }));
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
          <filter id="organic">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix 
              in="blur" 
              type="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" 
            />
          </filter>
        </defs>
        
        <g filter="url(#organic)">
          {cells.map(cell => (
            <path
              key={cell.id}
              d={cell.getPath()}
              fill={CONFIG.colors[cell.color]}
              opacity={cell.opacity}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
