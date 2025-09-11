'use client';
import { useEffect, useMemo, useState, useRef } from "react";

/* ================= CONFIGURATION ================= */
const CONFIG = {
  colors: {
    bg: "#f4efe6",
    paper: "#f4efe6",
    earth: "#b1793a", 
    clay: "#e6d7c4",
    moss: "#6ea067",
  },
  organicBubbles: {
    count: 25,
    minRadius: 40,
    maxRadius: 150,
    controlPoints: 12,
    morphSpeed: 0.015,
    fusionDistance: 80,
    colors: ['earth', 'clay', 'moss'],
    fusionSpeed: 0.012,
    birthRadius: 15,
    maxAge: 400,
    spawnMargin: 200, // Zone hors écran pour apparition/disparition
    metabolismRange: [0.15, 0.35],
    driftRange: [0.03, 0.12],
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

/* ================= BULLE ORGANIQUE ================= */
class OrganicBubble {
  constructor(x, y, radius, colorKey, seed, age = 0, spawnOffscreen = false) {
    this.x = x;
    this.y = y;
    this.baseRadius = radius;
    this.currentRadius = spawnOffscreen ? radius : CONFIG.organicBubbles.birthRadius;
    this.targetRadius = radius;
    this.colorKey = colorKey;
    this.seed = seed;
    this.rnd = mulberry32(seed);
    this.age = age;
    this.lifePhase = age === 0 ? 'birth' : 'adult';
    this.opacity = spawnOffscreen ? 0.85 : 0;
    this.targetOpacity = 0.85;
    
    // État de fusion
    this.fusionPartner = null;
    this.fusionProgress = 0;
    this.isFusing = false;
    this.isDying = false;
    this.deathProgress = 0;
    
    // Forme organique
    this.controlPoints = CONFIG.organicBubbles.controlPoints;
    this.deformations = this.generateDeformations();
    
    // Mouvement fluide
    this.velocity = {
      x: (this.rnd() - 0.5) * 0.2,
      y: (this.rnd() - 0.5) * 0.2
    };
    
    this.wanderAngle = this.rnd() * Math.PI * 2;
    this.metabolismRate = CONFIG.organicBubbles.metabolismRange[0] + 
                          this.rnd() * (CONFIG.organicBubbles.metabolismRange[1] - CONFIG.organicBubbles.metabolismRange[0]);
    this.driftSpeed = CONFIG.organicBubbles.driftRange[0] + 
                     this.rnd() * (CONFIG.organicBubbles.driftRange[1] - CONFIG.organicBubbles.driftRange[0]);
    
    // Position de spawn pour retour naturel
    this.homeX = x;
    this.homeY = y;
    this.wanderRadius = 100 + this.rnd() * 150;
  }

  generateDeformations() {
    const deformations = [];
    for (let i = 0; i < this.controlPoints; i++) {
      deformations.push({
        amplitude: 0.05 + this.rnd() * 0.1,
        frequency: 0.1 + this.rnd() * 0.3,
        phase: this.rnd() * Math.PI * 2,
        baseOffset: (this.rnd() - 0.5) * 0.08,
        currentOffset: 0
      });
    }
    return deformations;
  }

  update(time, allBubbles, viewportBounds, scrollDelta = 0) {
    this.age += 0.016;
    
    // Gestion des phases de vie
    this.updateLifePhase();
    
    // Mise à jour de la forme
    this.updateShape(time);
    
    // Mise à jour du mouvement
    this.updateMovement(time, viewportBounds, scrollDelta);
    
    // Gestion des fusions
    if (this.isFusing) {
      this.updateFusion();
    }
    
    // Gestion de la mort
    if (this.isDying) {
      this.updateDeath();
    }
    
    // Ajustements progressifs
    this.currentRadius += (this.targetRadius - this.currentRadius) * 0.04;
    this.opacity += (this.targetOpacity - this.opacity) * 0.03;
    
    return this.currentRadius;
  }

  updateLifePhase() {
    if (this.lifePhase === 'birth' && this.currentRadius >= this.targetRadius * 0.95) {
      this.lifePhase = 'adult';
      this.targetOpacity = 0.85;
    } else if (this.lifePhase === 'birth') {
      this.targetOpacity = Math.min(0.85, this.opacity + 0.02);
    }
    
    if (this.age > CONFIG.organicBubbles.maxAge && !this.isFusing && !this.isDying) {
      this.lifePhase = 'old';
    }
  }

  updateShape(time) {
    // Respiration organique
    const breathIntensity = this.lifePhase === 'birth' ? 0.12 : 0.06;
    const breathCycle = Math.sin(time * this.metabolismRate) * breathIntensity;
    
    // Mise à jour des déformations
    this.deformations.forEach((def, i) => {
      const morphIntensity = this.isFusing ? 0.15 : 0.08;
      def.currentOffset = def.baseOffset + 
        def.amplitude * Math.sin(time * def.frequency + def.phase) * morphIntensity +
        Math.sin(time * 0.2 + i * 0.5) * 0.03 +
        breathCycle * 0.5;
    });
  }

  updateMovement(time, viewportBounds, scrollDelta) {
    // Mouvement de dérive organique
    this.wanderAngle += (this.rnd() - 0.5) * 0.1;
    
    const wanderX = Math.cos(this.wanderAngle) * this.driftSpeed;
    const wanderY = Math.sin(this.wanderAngle) * this.driftSpeed;
    
    // Attraction vers la zone d'origine (comportement de groupe)
    const homeDistance = Math.sqrt((this.x - this.homeX) ** 2 + (this.y - this.homeY) ** 2);
    if (homeDistance > this.wanderRadius) {
      const returnForce = Math.min(0.02, homeDistance / 5000);
      this.velocity.x += (this.homeX - this.x) / homeDistance * returnForce;
      this.velocity.y += (this.homeY - this.y) / homeDistance * returnForce;
    }
    
    // Application du mouvement avec friction
    this.velocity.x = (this.velocity.x + wanderX) * 0.96;
    this.velocity.y = (this.velocity.y + wanderY) * 0.96;
    
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    
    // Parallaxe du scroll
    if (scrollDelta !== 0) {
      const parallaxFactor = 0.2 + (this.currentRadius / CONFIG.organicBubbles.maxRadius) * 0.3;
      this.y -= scrollDelta * parallaxFactor;
      this.homeY -= scrollDelta * parallaxFactor;
    }
    
    // Téléportation silencieuse si trop loin hors écran
    this.handleBoundaries(viewportBounds);
  }

  handleBoundaries(bounds) {
    const margin = CONFIG.organicBubbles.spawnMargin;
    const buffer = this.currentRadius + margin;
    
    // Si la bulle sort trop loin, la téléporter de l'autre côté
    if (this.x < bounds.left - buffer) {
      this.x = bounds.right + margin;
      this.homeX = this.x;
    } else if (this.x > bounds.right + buffer) {
      this.x = bounds.left - margin;
      this.homeX = this.x;
    }
    
    if (this.y < bounds.top - buffer) {
      this.y = bounds.bottom + margin;
      this.homeY = this.y;
    } else if (this.y > bounds.bottom + buffer) {
      this.y = bounds.top - margin;
      this.homeY = this.y;
    }
  }

  updateFusion() {
    if (!this.fusionPartner) return;
    
    this.fusionProgress += CONFIG.organicBubbles.fusionSpeed;
    
    // Rapprochement progressif
    const attraction = this.fusionProgress * 0.08;
    this.x += (this.fusionPartner.x - this.x) * attraction;
    this.y += (this.fusionPartner.y - this.y) * attraction;
    
    // Ajustement de taille
    const combinedRadius = Math.sqrt(this.baseRadius ** 2 + this.fusionPartner.baseRadius ** 2) * 0.85;
    this.targetRadius = this.baseRadius + (combinedRadius - this.baseRadius) * this.fusionProgress;
    
    // Transparence progressive
    this.targetOpacity = 0.85 - this.fusionProgress * 0.4;
    
    if (this.fusionProgress >= 1) {
      this.isDying = true;
    }
  }

  updateDeath() {
    this.deathProgress += 0.02;
    this.targetOpacity = Math.max(0, 0.85 - this.deathProgress);
    this.targetRadius = this.currentRadius * (1 - this.deathProgress * 0.3);
    
    if (this.deathProgress >= 1) {
      this.shouldRemove = true;
    }
  }

  generatePath() {
    const points = [];
    const radius = this.currentRadius * (1 + Math.sin(Date.now() * 0.001 * this.metabolismRate) * 0.05);
    
    for (let i = 0; i < this.controlPoints; i++) {
      const angle = (i / this.controlPoints) * Math.PI * 2;
      const def = this.deformations[i];
      const r = radius * (1 + def.currentOffset);
      
      points.push([
        this.x + Math.cos(angle) * r,
        this.y + Math.sin(angle) * r
      ]);
    }
    
    return this.createSmoothPath(points);
  }

  createSmoothPath(points) {
    if (points.length < 3) return '';
    
    let path = `M ${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
    
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      const nextNext = points[(i + 2) % points.length];
      const prev = points[(i - 1 + points.length) % points.length];
      
      const tension = 0.18;
      const cp1x = current[0] + (next[0] - prev[0]) * tension;
      const cp1y = current[1] + (next[1] - prev[1]) * tension;
      const cp2x = next[0] - (nextNext[0] - current[0]) * tension;
      const cp2y = next[1] - (nextNext[1] - current[1]) * tension;
      
      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${next[0].toFixed(1)},${next[1].toFixed(1)}`;
    }
    
    return path + ' Z';
  }

  canFuseWith(other) {
    if (this.isFusing || other.isFusing || this.isDying || other.isDying) return false;
    if (this.lifePhase === 'birth' || other.lifePhase === 'birth') return false;
    
    const distance = Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    return distance < CONFIG.organicBubbles.fusionDistance && 
           this.colorKey === other.colorKey &&
           this.age > 50 && other.age > 50;
  }

  startFusion(partner) {
    this.isFusing = true;
    this.fusionPartner = partner;
    this.fusionProgress = 0;
  }

  shouldDivide() {
    return this.lifePhase === 'old' && 
           !this.isFusing && 
           !this.isDying &&
           this.currentRadius > CONFIG.organicBubbles.maxRadius * 0.8;
  }

  createOffspring(bounds) {
    const angle = Math.random() * Math.PI * 2;
    const distance = this.currentRadius + CONFIG.organicBubbles.birthRadius + 20;
    
    // Créer l'enfant hors écran si possible
    let childX = this.x + Math.cos(angle) * distance;
    let childY = this.y + Math.sin(angle) * distance;
    
    // Vérifier si on peut le placer hors écran
    const margin = CONFIG.organicBubbles.spawnMargin;
    if (childX > bounds.left - margin && childX < bounds.right + margin) {
      // Pousser hors écran horizontalement
      childX = childX < bounds.left + bounds.width / 2 ? 
               bounds.left - margin : 
               bounds.right + margin;
    }
    
    const child = new OrganicBubble(
      childX, childY, 
      this.currentRadius * 0.6,
      this.colorKey, 
      Date.now() + Math.random() * 10000, 
      0
    );
    
    // Réduire le parent
    this.targetRadius = this.currentRadius * 0.7;
    this.age = 100; // Rajeunir
    this.lifePhase = 'adult';
    
    return child;
  }
}

/* ================= HOOKS ================= */
function useAnimationFrame(callback) {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  
  useEffect(() => {
    const animate = time => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [callback]);
}

/* ================= COMPOSANT PRINCIPAL ================= */
export default function OrganicWallpaper() {
  const [bubbles, setBubbles] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const timeRef = useRef(0);
  const mountedRef = useRef(false);
  
  // Initialisation
  useEffect(() => {
    mountedRef.current = true;
    
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    const updateScroll = () => {
      setScrollY(window.scrollY);
    };
    
    updateDimensions();
    updateScroll();
    
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('scroll', updateScroll, { passive: true });
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('scroll', updateScroll);
      mountedRef.current = false;
    };
  }, []);
  
  // Création initiale des bulles
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const rnd = mulberry32(Date.now());
    const { width, height } = dimensions;
    const margin = CONFIG.organicBubbles.spawnMargin;
    
    const initialBubbles = [];
    for (let i = 0; i < CONFIG.organicBubbles.count; i++) {
      // Certaines bulles commencent hors écran
      const spawnOffscreen = rnd() < 0.3;
      let x, y;
      
      if (spawnOffscreen) {
        // Spawn hors écran
        if (rnd() < 0.5) {
          x = rnd() < 0.5 ? -margin : width + margin;
          y = rnd() * height;
        } else {
          x = rnd() * width;
          y = rnd() < 0.5 ? -margin : height + margin;
        }
      } else {
        // Spawn dans l'écran
        x = margin + rnd() * (width - margin * 2);
        y = margin + rnd() * (height - margin * 2);
      }
      
      const radius = CONFIG.organicBubbles.minRadius + 
                    rnd() * (CONFIG.organicBubbles.maxRadius - CONFIG.organicBubbles.minRadius);
      const colorKey = CONFIG.organicBubbles.colors[Math.floor(rnd() * CONFIG.organicBubbles.colors.length)];
      const age = rnd() * 200;
      
      initialBubbles.push(new OrganicBubble(x, y, radius, colorKey, i * 1000, age, spawnOffscreen));
    }
    
    setBubbles(initialBubbles);
  }, [dimensions]);
  
  // Animation principale
  useAnimationFrame(useRef((deltaTime) => {
    if (!mountedRef.current) return;
    
    timeRef.current += deltaTime * 0.001;
    const scrollDelta = scrollY - lastScrollY;
    setLastScrollY(scrollY);
    
    const viewportBounds = {
      left: 0,
      right: dimensions.width,
      top: -scrollY,
      bottom: dimensions.height - scrollY,
      width: dimensions.width,
      height: dimensions.height
    };
    
    setBubbles(currentBubbles => {
      let updatedBubbles = [...currentBubbles];
      
      // Mise à jour des bulles
      updatedBubbles.forEach(bubble => {
        bubble.update(timeRef.current, updatedBubbles, viewportBounds, scrollDelta);
      });
      
      // Détection des fusions
      for (let i = 0; i < updatedBubbles.length; i++) {
        for (let j = i + 1; j < updatedBubbles.length; j++) {
          const bubble1 = updatedBubbles[i];
          const bubble2 = updatedBubbles[j];
          
          if (bubble1.canFuseWith(bubble2) && Math.random() < 0.003) {
            bubble1.startFusion(bubble2);
            bubble2.startFusion(bubble1);
          }
        }
      }
      
      // Création de nouvelles bulles après fusion
      const fusedPairs = [];
      updatedBubbles.forEach((bubble, i) => {
        if (bubble.isFusing && bubble.fusionProgress >= 1 && !fusedPairs.includes(i)) {
          const partner = updatedBubbles.findIndex(b => b === bubble.fusionPartner);
          if (partner !== -1) {
            fusedPairs.push(i, partner);
            
            // Créer une nouvelle bulle fusionnée hors écran si possible
            const newX = bubble.x < viewportBounds.left || bubble.x > viewportBounds.right ?
                        bubble.x : (bubble.x < dimensions.width / 2 ? 
                        viewportBounds.left - CONFIG.organicBubbles.spawnMargin :
                        viewportBounds.right + CONFIG.organicBubbles.spawnMargin);
            const newY = (bubble.y + bubble.fusionPartner.y) / 2;
            
            const fusedBubble = new OrganicBubble(
              newX, newY,
              Math.min(bubble.targetRadius * 1.2, CONFIG.organicBubbles.maxRadius),
              bubble.colorKey,
              Date.now(),
              0
            );
            
            updatedBubbles.push(fusedBubble);
          }
        }
      });
      
      // Divisions
      const newOffspring = [];
      updatedBubbles.forEach(bubble => {
        if (bubble.shouldDivide() && Math.random() < 0.002) {
          const child = bubble.createOffspring(viewportBounds);
          newOffspring.push(child);
        }
      });
      
      updatedBubbles.push(...newOffspring);
      
      // Nettoyage des bulles mortes
      updatedBubbles = updatedBubbles.filter(bubble => !bubble.shouldRemove);
      
      // Maintenir le nombre de bulles
      if (updatedBubbles.length < CONFIG.organicBubbles.count * 0.7) {
        const rnd = mulberry32(Date.now());
        const margin = CONFIG.organicBubbles.spawnMargin;
        
        // Ajouter une nouvelle bulle hors écran
        const side = Math.floor(rnd() * 4);
        let x, y;
        
        switch(side) {
          case 0: // Gauche
            x = -margin;
            y = rnd() * dimensions.height;
            break;
          case 1: // Droite
            x = dimensions.width + margin;
            y = rnd() * dimensions.height;
            break;
          case 2: // Haut
            x = rnd() * dimensions.width;
            y = -margin - scrollY;
            break;
          default: // Bas
            x = rnd() * dimensions.width;
            y = dimensions.height + margin - scrollY;
        }
        
        const newBubble = new OrganicBubble(
          x, y,
          CONFIG.organicBubbles.minRadius + rnd() * (CONFIG.organicBubbles.maxRadius - CONFIG.organicBubbles.minRadius),
          CONFIG.organicBubbles.colors[Math.floor(rnd() * CONFIG.organicBubbles.colors.length)],
          Date.now() + rnd() * 10000,
          0
        );
        
        updatedBubbles.push(newBubble);
      }
      
      return updatedBubbles;
    });
  }).current);
  
  const viewHeight = dimensions.height + CONFIG.organicBubbles.spawnMargin * 2;
  
  return (
    <div
      style={{
        position: "fixed",
        top: -CONFIG.organicBubbles.spawnMargin,
        left: 0,
        right: 0,
        height: viewHeight,
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden"
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${viewHeight}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ 
          background: CONFIG.colors.bg,
          transform: `translateY(${scrollY}px)`,
          willChange: 'transform'
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <radialGradient id="bubbleGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
          </radialGradient>
        </defs>
        
        <g transform={`translate(0, ${CONFIG.organicBubbles.spawnMargin})`}>
          {bubbles.map((bubble, index) => (
            <g key={`${bubble.seed}-${index}`} opacity={bubble.opacity}>
              {/* Ombre douce */}
              <path
                d={bubble.generatePath()}
                fill="rgba(0,0,0,0.08)"
                transform="translate(2, 3)"
                filter="url(#glow)"
              />
              
              {/* Bulle principale */}
              <path
                d={bubble.generatePath()}
                fill={CONFIG.colors[bubble.colorKey]}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.5"
                style={{
                  transition: 'all 0.3s ease-out'
                }}
              />
              
              {/* Reflet */}
              <ellipse
                cx={bubble.x - bubble.currentRadius * 0.2}
                cy={bubble.y - bubble.currentRadius * 0.2}
                rx={bubble.currentRadius * 0.25}
                ry={bubble.currentRadius * 0.15}
                fill="url(#bubbleGradient)"
                opacity={0.6}
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
