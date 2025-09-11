'use client';
import { useEffect, useMemo, useState, useRef, useCallback } from "react";

/* ================= CONFIGURATION ================= */
const CONFIG = {
  colors: {
    bg: "#f4efe6",
    paper: "#f4efe6",
    earth: "#b1793a", 
    clay: "#e6d7c4",
    moss: "#6ea067",
    terra: "#c08a5a",
    sable: "#e2c98f",
  },
  organicBubbles: {
    count: 18, // Moins de bulles pour plus d'élégance
    minRadius: 60,
    maxRadius: 200,
    controlPoints: 16, // Plus de points pour des formes plus fluides
    colors: ['earth', 'clay', 'moss', 'terra', 'sable'],
    // Mouvement très lent et contemplatif
    moveSpeed: 0.15, // Très lent
    morphSpeed: 0.3, // Morphing lent
    breathSpeed: 0.4, // Respiration lente
    // Interactions magnétiques douces
    magneticRadius: 250, // Zone d'influence magnétique
    repulsionForce: 0.8, // Force de répulsion douce
    attractionForce: 0.3, // Attraction subtile
    // Spawn et vie
    spawnMargin: 300,
    floatRange: 150, // Distance de flottement autour du point d'ancrage
    // Effets visuels
    blurAmount: 0.5,
    glowIntensity: 0.4,
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

/* ================= BULLE CONTEMPLATIVE ================= */
class ContemplativeBubble {
  constructor(x, y, radius, colorKey, seed) {
    this.x = x;
    this.y = y;
    this.anchorX = x; // Point d'ancrage pour le flottement
    this.anchorY = y;
    this.radius = radius;
    this.colorKey = colorKey;
    this.seed = seed;
    this.rnd = mulberry32(seed);
    
    // État visuel
    this.opacity = 0;
    this.targetOpacity = 0.7 + this.rnd() * 0.2; // Variation d'opacité
    this.scale = 0.3;
    this.targetScale = 1;
    
    // Morphing organique
    this.controlPoints = CONFIG.organicBubbles.controlPoints;
    this.morphPhase = this.rnd() * Math.PI * 2;
    this.morphSpeed = CONFIG.organicBubbles.morphSpeed * (0.8 + this.rnd() * 0.4);
    
    // Respiration
    this.breathPhase = this.rnd() * Math.PI * 2;
    this.breathSpeed = CONFIG.organicBubbles.breathSpeed * (0.8 + this.rnd() * 0.4);
    this.breathIntensity = 0.03 + this.rnd() * 0.04;
    
    // Mouvement lent et fluide
    this.floatPhase = this.rnd() * Math.PI * 2;
    this.floatSpeed = CONFIG.organicBubbles.moveSpeed * (0.7 + this.rnd() * 0.6);
    this.floatRadiusX = CONFIG.organicBubbles.floatRange * (0.6 + this.rnd() * 0.8);
    this.floatRadiusY = CONFIG.organicBubbles.floatRange * (0.6 + this.rnd() * 0.8);
    
    // Forces magnétiques
    this.vx = 0;
    this.vy = 0;
    this.magneticInfluence = 0;
    
    // Déformations individuelles pour chaque point
    this.deformations = [];
    for (let i = 0; i < this.controlPoints; i++) {
      this.deformations.push({
        amplitude: 0.02 + this.rnd() * 0.06,
        speed: 0.1 + this.rnd() * 0.3,
        phase: this.rnd() * Math.PI * 2,
        current: 0
      });
    }
    
    // Temps de vie
    this.age = 0;
    this.lifeTime = 0;
  }

  update(deltaTime, allBubbles, mousePos, scrollY) {
    this.lifeTime += deltaTime;
    this.age += deltaTime;
    
    // Apparition progressive
    if (this.scale < this.targetScale) {
      this.scale += (this.targetScale - this.scale) * 0.02;
    }
    if (this.opacity < this.targetOpacity) {
      this.opacity += (this.targetOpacity - this.opacity) * 0.01;
    }
    
    // Respiration organique
    const breathOffset = Math.sin(this.lifeTime * this.breathSpeed + this.breathPhase) * this.breathIntensity;
    const currentRadius = this.radius * this.scale * (1 + breathOffset);
    
    // Mouvement de flottement lent autour du point d'ancrage
    const floatX = Math.sin(this.lifeTime * this.floatSpeed + this.floatPhase) * this.floatRadiusX;
    const floatY = Math.cos(this.lifeTime * this.floatSpeed * 0.7 + this.floatPhase) * this.floatRadiusY;
    
    // Forces magnétiques entre bulles
    let fx = 0;
    let fy = 0;
    let nearbyCount = 0;
    
    allBubbles.forEach(other => {
      if (other === this) return;
      
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < CONFIG.organicBubbles.magneticRadius && distance > 0) {
        nearbyCount++;
        const normalizedDist = distance / CONFIG.organicBubbles.magneticRadius;
        
        // Répulsion douce quand trop proche
        if (distance < (currentRadius + other.radius * other.scale) * 1.2) {
          const repulsion = CONFIG.organicBubbles.repulsionForce * (1 - normalizedDist);
          fx -= (dx / distance) * repulsion;
          fy -= (dy / distance) * repulsion;
        } 
        // Attraction très subtile à moyenne distance
        else if (distance < CONFIG.organicBubbles.magneticRadius * 0.7) {
          const attraction = CONFIG.organicBubbles.attractionForce * normalizedDist * (1 - normalizedDist);
          fx += (dx / distance) * attraction;
          fy += (dy / distance) * attraction;
        }
      }
    });
    
    // Influence magnétique progressive
    this.magneticInfluence = Math.min(1, nearbyCount / 3);
    
    // Interaction avec la souris (très subtile)
    if (mousePos) {
      const mouseDx = mousePos.x - this.x;
      const mouseDy = mousePos.y - this.y;
      const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
      
      if (mouseDistance < 200 && mouseDistance > 0) {
        const mouseInfluence = (1 - mouseDistance / 200) * 0.5;
        fx -= (mouseDx / mouseDistance) * mouseInfluence;
        fy -= (mouseDy / mouseDistance) * mouseInfluence;
      }
    }
    
    // Application des forces avec friction importante
    this.vx = (this.vx + fx) * 0.92;
    this.vy = (this.vy + fy) * 0.92;
    
    // Limite de vitesse très basse pour garder le mouvement lent
    const maxSpeed = 0.5;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }
    
    // Mise à jour de la position avec retour élastique vers l'ancre
    const targetX = this.anchorX + floatX + this.vx * 10;
    const targetY = this.anchorY + floatY + this.vy * 10;
    
    this.x += (targetX - this.x) * 0.03;
    this.y += (targetY - this.y) * 0.03;
    
    // Parallaxe subtile au scroll
    if (scrollY !== undefined) {
      const parallaxFactor = 0.1 + (this.radius / CONFIG.organicBubbles.maxRadius) * 0.2;
      this.anchorY -= scrollY * parallaxFactor;
    }
    
    // Mise à jour des déformations organiques
    this.morphPhase += deltaTime * this.morphSpeed;
    this.deformations.forEach((def, i) => {
      def.current = def.amplitude * Math.sin(this.lifeTime * def.speed + def.phase + this.morphPhase);
    });
    
    return currentRadius;
  }

  generatePath() {
    const points = [];
    const baseRadius = this.radius * this.scale;
    
    // Respiration
    const breathOffset = Math.sin(this.lifeTime * this.breathSpeed + this.breathPhase) * this.breathIntensity;
    
    for (let i = 0; i < this.controlPoints; i++) {
      const angle = (i / this.controlPoints) * Math.PI * 2;
      const def = this.deformations[i];
      
      // Influence magnétique sur la forme
      const magneticDeform = this.magneticInfluence * Math.sin(angle * 2 + this.morphPhase) * 0.02;
      
      // Rayon avec toutes les déformations
      const r = baseRadius * (1 + breathOffset + def.current + magneticDeform);
      
      points.push([
        this.x + Math.cos(angle) * r,
        this.y + Math.sin(angle) * r
      ]);
    }
    
    return this.createOrganicPath(points);
  }

  createOrganicPath(points) {
    if (points.length < 3) return '';
    
    // Créer un path très fluide avec des courbes de Bézier
    let path = `M ${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
    
    // Calcul des points de contrôle pour des courbes très douces
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      const prev = points[(i - 1 + points.length) % points.length];
      const nextNext = points[(i + 2) % points.length];
      
      // Tension plus élevée pour des courbes plus douces
      const tension = 0.25;
      
      const cp1x = current[0] + (next[0] - prev[0]) * tension;
      const cp1y = current[1] + (next[1] - prev[1]) * tension;
      const cp2x = next[0] - (nextNext[0] - current[0]) * tension;
      const cp2y = next[1] - (nextNext[1] - current[1]) * tension;
      
      path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${next[0].toFixed(2)},${next[1].toFixed(2)}`;
    }
    
    return path + ' Z';
  }

  handleBoundaries(width, height) {
    const margin = CONFIG.organicBubbles.spawnMargin;
    const buffer = this.radius + margin;
    
    // Téléportation douce si trop loin
    if (this.x < -buffer) {
      this.x = width + buffer;
      this.anchorX = this.x;
    } else if (this.x > width + buffer) {
      this.x = -buffer;
      this.anchorX = this.x;
    }
    
    if (this.y < -buffer) {
      this.y = height + buffer;
      this.anchorY = this.y;
    } else if (this.y > height + buffer) {
      this.y = -buffer;
      this.anchorY = this.y;
    }
  }
}

/* ================= HOOK POUR LA SOURIS ================= */
function useMousePosition() {
  const [mousePos, setMousePos] = useState(null);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    const handleMouseLeave = () => {
      setMousePos(null);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  
  return mousePos;
}

/* ================= COMPOSANT PRINCIPAL ================= */
export default function ContemplativeOrganicWallpaper() {
  const [bubbles, setBubbles] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const animationRef = useRef();
  const lastTimeRef = useRef(0);
  const mousePos = useMousePosition();
  
  // Gestion des dimensions et du scroll
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    const updateScroll = () => {
      const newScrollY = window.scrollY;
      const delta = newScrollY - lastScrollY.current;
      lastScrollY.current = newScrollY;
      setScrollY(delta);
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('scroll', updateScroll, { passive: true });
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('scroll', updateScroll);
    };
  }, []);
  
  // Initialisation des bulles
  useEffect(() => {
    const rnd = mulberry32(Date.now());
    const { width, height } = dimensions;
    const margin = 100;
    
    const initialBubbles = [];
    for (let i = 0; i < CONFIG.organicBubbles.count; i++) {
      // Distribution plus organique
      const clusterX = width * (0.2 + rnd() * 0.6);
      const clusterY = height * (0.2 + rnd() * 0.6);
      
      const x = clusterX + (rnd() - 0.5) * 300;
      const y = clusterY + (rnd() - 0.5) * 300;
      
      // Variation de taille plus organique
      let radius;
      const sizeRoll = rnd();
      if (sizeRoll < 0.2) {
        // Quelques très grandes bulles
        radius = CONFIG.organicBubbles.maxRadius * (0.8 + rnd() * 0.2);
      } else if (sizeRoll < 0.5) {
        // Bulles moyennes
        radius = CONFIG.organicBubbles.minRadius + (CONFIG.organicBubbles.maxRadius - CONFIG.organicBubbles.minRadius) * 0.5;
      } else {
        // Petites bulles
        radius = CONFIG.organicBubbles.minRadius + rnd() * 40;
      }
      
      const colorKey = CONFIG.organicBubbles.colors[Math.floor(rnd() * CONFIG.organicBubbles.colors.length)];
      
      initialBubbles.push(new ContemplativeBubble(x, y, radius, colorKey, i * 1000 + Date.now()));
    }
    
    setBubbles(initialBubbles);
  }, [dimensions]);
  
  // Animation loop
  useEffect(() => {
    const animate = (currentTime) => {
      const deltaTime = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = currentTime;
      
      if (deltaTime > 0 && deltaTime < 0.1) { // Limite le delta pour éviter les sauts
        setBubbles(currentBubbles => {
          const updatedBubbles = [...currentBubbles];
          
          updatedBubbles.forEach(bubble => {
            bubble.update(deltaTime, updatedBubbles, mousePos, scrollY);
            bubble.handleBoundaries(dimensions.width, dimensions.height);
          });
          
          // Reset scrollY après utilisation
          setScrollY(0);
          
          return updatedBubbles;
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, mousePos, scrollY]);
  
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden"
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ 
          background: CONFIG.colors.bg,
        }}
      >
        <defs>
          {/* Filtre de flou doux */}
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
            <feBlend in="blur" in2="SourceGraphic" mode="normal" />
          </filter>
          
          {/* Gradient de lumière plus subtil */}
          <radialGradient id="lightGradient" cx="35%" cy="35%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.15)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" stopOpacity="0" />
          </radialGradient>
          
          {/* Gradient d'ombre interne */}
          <radialGradient id="innerShadow" cx="50%" cy="50%">
            <stop offset="70%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </radialGradient>
        </defs>
        
        <g>
          {bubbles.map((bubble, index) => {
            const radius = bubble.radius * bubble.scale;
            return (
              <g 
                key={`${bubble.seed}-${index}`} 
                opacity={bubble.opacity}
                style={{
                  transition: 'opacity 2s ease-in-out'
                }}
              >
                {/* Ombre très douce et diffuse */}
                <ellipse
                  cx={bubble.x + 3}
                  cy={bubble.y + 5}
                  rx={radius * 1.1}
                  ry={radius * 0.9}
                  fill="rgba(0,0,0,0.04)"
                  filter="url(#softGlow)"
                />
                
                {/* Bulle principale avec forme organique */}
                <path
                  d={bubble.generatePath()}
                  fill={CONFIG.colors[bubble.colorKey]}
                  fillOpacity="0.85"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.3"
                />
                
                {/* Overlay d'ombre interne subtile */}
                <path
                  d={bubble.generatePath()}
                  fill="url(#innerShadow)"
                  opacity="0.3"
                />
                
                {/* Reflet de lumière très doux */}
                <ellipse
                  cx={bubble.x - radius * 0.25}
                  cy={bubble.y - radius * 0.25}
                  rx={radius * 0.35}
                  ry={radius * 0.25}
                  fill="url(#lightGradient)"
                  opacity="0.5"
                  transform={`rotate(-30 ${bubble.x} ${bubble.y})`}
                />
                
                {/* Petit éclat de lumière */}
                <circle
                  cx={bubble.x - radius * 0.3}
                  cy={bubble.y - radius * 0.35}
                  r={radius * 0.05}
                  fill="rgba(255,255,255,0.6)"
                  opacity={bubble.magneticInfluence * 0.3 + 0.2}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
