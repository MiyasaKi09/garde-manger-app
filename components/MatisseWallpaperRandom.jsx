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
    count: 20,
    minRadius: 50,
    maxRadius: 180,
    controlPoints: 16,
    colors: ['earth', 'clay', 'moss', 'terra', 'sable'],
    // Mouvement lent et contemplatif
    moveSpeed: 0.2,
    morphSpeed: 0.3,
    breathSpeed: 0.4,
    // Forces et interactions
    separationRadius: 1.8, // Multiplicateur du rayon pour éviter la superposition
    separationForce: 1.2, // Force de séparation
    magneticRadius: 250,
    attractionForce: 0.2,
    // Fusion et division
    fusionDistance: 30, // Distance pour initier la fusion
    fusionSpeed: 0.008, // Vitesse de fusion très lente
    divisionAge: 500, // Age pour division
    divisionSize: 160, // Taille min pour division
    minFusionAge: 100, // Age minimum pour fusionner
    // Spawn et vie
    spawnMargin: 300,
    floatRange: 120,
    birthDuration: 80, // Frames pour naître
    deathDuration: 100, // Frames pour mourir
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

/* ================= BULLE VIVANTE ================= */
class LivingBubble {
  constructor(x, y, radius, colorKey, seed, birthOffscreen = false) {
    this.id = seed;
    this.x = x;
    this.y = y;
    this.anchorX = x;
    this.anchorY = y;
    this.baseRadius = radius;
    this.currentRadius = birthOffscreen ? radius : 10;
    this.targetRadius = radius;
    this.colorKey = colorKey;
    this.seed = seed;
    this.rnd = mulberry32(seed);
    
    // États de vie
    this.age = 0;
    this.state = birthOffscreen ? 'alive' : 'birth'; // birth, alive, fusing, dividing, dying
    this.stateProgress = 0;
    this.opacity = birthOffscreen ? 0.75 : 0;
    this.targetOpacity = 0.75 + this.rnd() * 0.15;
    
    // Fusion
    this.fusionPartner = null;
    this.fusionForce = 0;
    this.isMaster = false; // Seul le master survit à la fusion
    
    // Division
    this.divisionCooldown = 0;
    
    // Morphing organique
    this.controlPoints = CONFIG.organicBubbles.controlPoints;
    this.morphPhase = this.rnd() * Math.PI * 2;
    this.morphSpeed = CONFIG.organicBubbles.morphSpeed * (0.8 + this.rnd() * 0.4);
    
    // Respiration
    this.breathPhase = this.rnd() * Math.PI * 2;
    this.breathSpeed = CONFIG.organicBubbles.breathSpeed * (0.8 + this.rnd() * 0.4);
    this.breathIntensity = 0.04 + this.rnd() * 0.03;
    
    // Mouvement
    this.floatPhase = this.rnd() * Math.PI * 2;
    this.floatSpeed = CONFIG.organicBubbles.moveSpeed * (0.7 + this.rnd() * 0.6);
    this.floatRadiusX = CONFIG.organicBubbles.floatRange * (0.6 + this.rnd() * 0.8);
    this.floatRadiusY = CONFIG.organicBubbles.floatRange * (0.6 + this.rnd() * 0.8);
    
    // Vitesse et forces
    this.vx = 0;
    this.vy = 0;
    
    // Déformations
    this.deformations = [];
    for (let i = 0; i < this.controlPoints; i++) {
      this.deformations.push({
        amplitude: 0.03 + this.rnd() * 0.05,
        speed: 0.1 + this.rnd() * 0.2,
        phase: this.rnd() * Math.PI * 2,
        current: 0
      });
    }
    
    this.lifeTime = 0;
  }

  update(deltaTime, allBubbles, mousePos, scrollY, dimensions) {
    this.lifeTime += deltaTime;
    this.age += 1;
    
    if (this.divisionCooldown > 0) this.divisionCooldown--;
    
    // Gestion des états
    this.updateState();
    
    // Respiration
    const breathOffset = Math.sin(this.lifeTime * this.breathSpeed + this.breathPhase) * this.breathIntensity;
    const effectiveRadius = this.currentRadius * (1 + breathOffset);
    
    // Mouvement de base (flottement)
    const floatX = Math.sin(this.lifeTime * this.floatSpeed + this.floatPhase) * this.floatRadiusX;
    const floatY = Math.cos(this.lifeTime * this.floatSpeed * 0.7 + this.floatPhase) * this.floatRadiusY;
    
    // Forces entre bulles
    let fx = 0;
    let fy = 0;
    
    allBubbles.forEach(other => {
      if (other === this || other.state === 'dying') return;
      
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 0.1) return; // Éviter division par zéro
      
      const myRadius = effectiveRadius;
      const otherRadius = other.currentRadius * (1 + other.breathIntensity);
      const minDistance = (myRadius + otherRadius) * CONFIG.organicBubbles.separationRadius;
      
      // SÉPARATION - Force forte pour éviter la superposition
      if (distance < minDistance) {
        const overlap = 1 - (distance / minDistance);
        const separationStrength = CONFIG.organicBubbles.separationForce * overlap * overlap;
        fx -= (dx / distance) * separationStrength;
        fy -= (dy / distance) * separationStrength;
      }
      
      // FUSION - Si conditions remplies
      if (this.canFuseWith(other, distance)) {
        if (!this.fusionPartner && !other.fusionPartner) {
          this.initiateFusion(other);
        }
      }
      
      // ATTRACTION DOUCE à moyenne distance (seulement si pas en fusion)
      if (!this.fusionPartner && distance > minDistance && distance < CONFIG.organicBubbles.magneticRadius) {
        const normalizedDist = (distance - minDistance) / (CONFIG.organicBubbles.magneticRadius - minDistance);
        const attraction = CONFIG.organicBubbles.attractionForce * normalizedDist * (1 - normalizedDist);
        fx += (dx / distance) * attraction;
        fy += (dy / distance) * attraction;
      }
    });
    
    // Gestion spéciale pour la fusion
    if (this.state === 'fusing' && this.fusionPartner) {
      const dx = this.fusionPartner.x - this.x;
      const dy = this.fusionPartner.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0.1) {
        // Force d'attraction progressive pour la fusion
        const fusionAttraction = this.fusionForce * 2;
        fx += (dx / distance) * fusionAttraction;
        fy += (dy / distance) * fusionAttraction;
      }
    }
    
    // Interaction souris (répulsion douce)
    if (mousePos) {
      const mouseDx = mousePos.x - this.x;
      const mouseDy = mousePos.y - this.y;
      const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
      
      if (mouseDistance < 200 && mouseDistance > 0) {
        const mouseInfluence = (1 - mouseDistance / 200) * 0.4;
        fx -= (mouseDx / mouseDistance) * mouseInfluence;
        fy -= (mouseDy / mouseDistance) * mouseInfluence;
      }
    }
    
    // Application des forces avec friction
    this.vx = (this.vx + fx) * 0.9;
    this.vy = (this.vy + fy) * 0.9;
    
    // Limite de vitesse
    const maxSpeed = this.state === 'fusing' ? 1 : 0.5;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }
    
    // Position cible avec retour élastique
    const targetX = this.anchorX + floatX + this.vx * 15;
    const targetY = this.anchorY + floatY + this.vy * 15;
    
    // Mouvement plus rapide si en fusion
    const lerpFactor = this.state === 'fusing' ? 0.05 : 0.03;
    this.x += (targetX - this.x) * lerpFactor;
    this.y += (targetY - this.y) * lerpFactor;
    
    // Parallaxe scroll
    if (scrollY !== undefined && scrollY !== 0) {
      const parallaxFactor = 0.1 + (this.currentRadius / CONFIG.organicBubbles.maxRadius) * 0.2;
      this.anchorY -= scrollY * parallaxFactor;
    }
    
    // Mise à jour morphing
    this.morphPhase += deltaTime * this.morphSpeed;
    this.deformations.forEach((def, i) => {
      const fusionDeform = this.state === 'fusing' ? Math.sin(this.stateProgress * Math.PI) * 0.1 : 0;
      def.current = def.amplitude * Math.sin(this.lifeTime * def.speed + def.phase + this.morphPhase) + fusionDeform;
    });
    
    // Gestion des limites
    this.handleBoundaries(dimensions.width, dimensions.height);
    
    // Vérification division
    if (this.shouldDivide()) {
      this.initiateDivision();
    }
    
    return effectiveRadius;
  }

  updateState() {
    switch(this.state) {
      case 'birth':
        this.stateProgress += 1 / CONFIG.organicBubbles.birthDuration;
        this.currentRadius = 10 + (this.targetRadius - 10) * this.easeOutCubic(this.stateProgress);
        this.opacity = this.targetOpacity * this.easeOutCubic(this.stateProgress);
        
        if (this.stateProgress >= 1) {
          this.state = 'alive';
          this.stateProgress = 0;
          this.currentRadius = this.targetRadius;
          this.opacity = this.targetOpacity;
        }
        break;
        
      case 'fusing':
        if (this.fusionPartner && !this.isMaster) {
          this.fusionForce += CONFIG.organicBubbles.fusionSpeed;
          this.stateProgress = this.fusionForce;
          
          // Réduction progressive
          this.targetRadius = this.baseRadius * (1 - this.fusionForce * 0.5);
          this.currentRadius += (this.targetRadius - this.currentRadius) * 0.05;
          this.targetOpacity = this.opacity * (1 - this.fusionForce * 0.6);
          this.opacity += (this.targetOpacity - this.opacity) * 0.03;
          
          if (this.fusionForce >= 1) {
            this.state = 'dying';
            this.stateProgress = 0;
          }
        } else if (this.isMaster && this.fusionPartner) {
          // Le master grandit
          this.fusionForce += CONFIG.organicBubbles.fusionSpeed;
          const growthFactor = 1 + this.fusionForce * 0.3;
          this.targetRadius = Math.min(this.baseRadius * growthFactor, CONFIG.organicBubbles.maxRadius);
          this.currentRadius += (this.targetRadius - this.currentRadius) * 0.03;
          
          if (this.fusionForce >= 1 || this.fusionPartner.state === 'dying') {
            // Fusion complète
            const partnerRadius = this.fusionPartner.baseRadius;
            this.baseRadius = Math.sqrt(this.baseRadius * this.baseRadius + partnerRadius * partnerRadius * 0.7);
            this.targetRadius = Math.min(this.baseRadius, CONFIG.organicBubbles.maxRadius);
            this.state = 'alive';
            this.stateProgress = 0;
            this.fusionPartner = null;
            this.fusionForce = 0;
            this.age = 0; // Rajeunit après fusion
          }
        }
        break;
        
      case 'dividing':
        this.stateProgress += 1 / 60; // 1 seconde pour diviser
        
        // Oscillation pendant la division
        const oscillation = Math.sin(this.stateProgress * Math.PI * 4) * 0.1;
        this.currentRadius = this.targetRadius * (1 + oscillation);
        
        if (this.stateProgress >= 1) {
          this.state = 'alive';
          this.stateProgress = 0;
          this.divisionCooldown = 200;
        }
        break;
        
      case 'dying':
        this.stateProgress += 1 / CONFIG.organicBubbles.deathDuration;
        this.currentRadius = this.baseRadius * (1 - this.easeInCubic(this.stateProgress));
        this.opacity = this.targetOpacity * (1 - this.easeInCubic(this.stateProgress));
        
        if (this.stateProgress >= 1) {
          this.shouldRemove = true;
        }
        break;
        
      case 'alive':
        // Ajustements progressifs
        this.currentRadius += (this.targetRadius - this.currentRadius) * 0.02;
        this.opacity += (this.targetOpacity - this.opacity) * 0.02;
        break;
    }
  }

  canFuseWith(other, distance) {
    // Conditions strictes pour la fusion
    if (this.state !== 'alive' || other.state !== 'alive') return false;
    if (this.age < CONFIG.organicBubbles.minFusionAge || other.age < CONFIG.organicBubbles.minFusionAge) return false;
    if (this.divisionCooldown > 0 || other.divisionCooldown > 0) return false;
    
    // Distance et compatibilité
    if (distance > CONFIG.organicBubbles.fusionDistance) return false;
    
    // Couleurs similaires (adjacentes dans le tableau)
    const colorIndex1 = CONFIG.organicBubbles.colors.indexOf(this.colorKey);
    const colorIndex2 = CONFIG.organicBubbles.colors.indexOf(other.colorKey);
    const colorDiff = Math.abs(colorIndex1 - colorIndex2);
    if (colorDiff > 1 && colorDiff !== CONFIG.organicBubbles.colors.length - 1) return false;
    
    // Éviter les bulles trop grandes
    const combinedSize = Math.sqrt(this.currentRadius * this.currentRadius + other.currentRadius * other.currentRadius);
    if (combinedSize > CONFIG.organicBubbles.maxRadius * 1.2) return false;
    
    return true;
  }

  initiateFusion(other) {
    // Déterminer qui est le master (la plus grande bulle)
    if (this.currentRadius >= other.currentRadius) {
      this.isMaster = true;
      other.isMaster = false;
    } else {
      this.isMaster = false;
      other.isMaster = true;
    }
    
    this.state = 'fusing';
    this.fusionPartner = other;
    this.fusionForce = 0;
    this.stateProgress = 0;
    
    other.state = 'fusing';
    other.fusionPartner = this;
    other.fusionForce = 0;
    other.stateProgress = 0;
  }

  shouldDivide() {
    return this.state === 'alive' &&
           this.age > CONFIG.organicBubbles.divisionAge &&
           this.currentRadius > CONFIG.organicBubbles.divisionSize &&
           this.divisionCooldown <= 0 &&
           Math.random() < 0.001; // Probabilité faible
  }

  initiateDivision() {
    this.state = 'dividing';
    this.stateProgress = 0;
    this.targetRadius = this.currentRadius * 0.7;
    this.baseRadius = this.targetRadius;
    this.age = 100; // Rajeunit
  }

  createOffspring(dimensions) {
    const angle = Math.random() * Math.PI * 2;
    const distance = this.currentRadius * 2.5;
    
    // Position de l'enfant (essayer de le mettre hors écran)
    let childX = this.x + Math.cos(angle) * distance;
    let childY = this.y + Math.sin(angle) * distance;
    
    // Si possible, pousser hors écran
    const margin = CONFIG.organicBubbles.spawnMargin;
    if (childX > 0 && childX < dimensions.width) {
      childX = childX < dimensions.width / 2 ? -margin : dimensions.width + margin;
    }
    
    const childRadius = this.currentRadius * 0.6;
    const child = new LivingBubble(
      childX, childY, childRadius,
      this.colorKey, Date.now() + Math.random() * 10000
    );
    
    return child;
  }

  generatePath() {
    const points = [];
    const baseRadius = this.currentRadius;
    const breathOffset = Math.sin(this.lifeTime * this.breathSpeed + this.breathPhase) * this.breathIntensity;
    
    for (let i = 0; i < this.controlPoints; i++) {
      const angle = (i / this.controlPoints) * Math.PI * 2;
      const def = this.deformations[i];
      
      // Déformation spéciale pour la division
      let divisionDeform = 0;
      if (this.state === 'dividing') {
        divisionDeform = Math.sin(angle * 2 + this.stateProgress * Math.PI * 4) * 
                        this.stateProgress * (1 - this.stateProgress) * 0.2;
      }
      
      const r = baseRadius * (1 + breathOffset + def.current + divisionDeform);
      
      points.push([
        this.x + Math.cos(angle) * r,
        this.y + Math.sin(angle) * r
      ]);
    }
    
    return this.createOrganicPath(points);
  }

  createOrganicPath(points) {
    if (points.length < 3) return '';
    
    let path = `M ${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
    
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      const prev = points[(i - 1 + points.length) % points.length];
      const nextNext = points[(i + 2) % points.length];
      
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
    const buffer = this.currentRadius + margin;
    
    if (this.x < -buffer) {
      this.x = width + buffer - 10;
      this.anchorX = this.x;
    } else if (this.x > width + buffer) {
      this.x = -buffer + 10;
      this.anchorX = this.x;
    }
    
    if (this.y < -buffer) {
      this.y = height + buffer - 10;
      this.anchorY = this.y;
    } else if (this.y > height + buffer) {
      this.y = -buffer + 10;
      this.anchorY = this.y;
    }
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  easeInCubic(t) {
    return t * t * t;
  }
}

/* ================= HOOK SOURIS ================= */
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
export default function LivingOrganicWallpaper() {
  const [bubbles, setBubbles] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const animationRef = useRef();
  const lastTimeRef = useRef(0);
  const mousePos = useMousePosition();
  
  // Dimensions et scroll
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
  
  // Initialisation
  useEffect(() => {
    const rnd = mulberry32(Date.now());
    const { width, height } = dimensions;
    
    const initialBubbles = [];
    for (let i = 0; i < CONFIG.organicBubbles.count; i++) {
      // Distribution organique en clusters
      const cluster = Math.floor(rnd() * 3);
      let x, y;
      
      switch(cluster) {
        case 0: // Cluster gauche
          x = width * 0.25 + (rnd() - 0.5) * 200;
          y = height * 0.5 + (rnd() - 0.5) * 300;
          break;
        case 1: // Cluster droit
          x = width * 0.75 + (rnd() - 0.5) * 200;
          y = height * 0.4 + (rnd() - 0.5) * 300;
          break;
        default: // Centre
          x = width * 0.5 + (rnd() - 0.5) * 300;
          y = height * 0.6 + (rnd() - 0.5) * 200;
      }
      
      // Variation de taille
      let radius;
      const sizeRoll = rnd();
      if (sizeRoll < 0.15) {
        radius = CONFIG.organicBubbles.maxRadius * (0.8 + rnd() * 0.2);
      } else if (sizeRoll < 0.5) {
        radius = CONFIG.organicBubbles.minRadius + 
                (CONFIG.organicBubbles.maxRadius - CONFIG.organicBubbles.minRadius) * 0.5;
      } else {
        radius = CONFIG.organicBubbles.minRadius + rnd() * 30;
      }
      
      const colorKey = CONFIG.organicBubbles.colors[Math.floor(rnd() * CONFIG.organicBubbles.colors.length)];
      const birthOffscreen = rnd() < 0.3;
      
      if (birthOffscreen) {
        const side = Math.floor(rnd() * 4);
        switch(side) {
          case 0: x = -CONFIG.organicBubbles.spawnMargin; break;
          case 1: x = width + CONFIG.organicBubbles.spawnMargin; break;
          case 2: y = -CONFIG.organicBubbles.spawnMargin; break;
          case 3: y = height + CONFIG.organicBubbles.spawnMargin; break;
        }
      }
      
      initialBubbles.push(new LivingBubble(x, y, radius, colorKey, i * 1000 + Date.now(), birthOffscreen));
    }
    
    setBubbles(initialBubbles);
  }, [dimensions]);
  
  // Animation principale
  useEffect(() => {
    const animate = (currentTime) => {
      const deltaTime = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = currentTime;
      
      if (deltaTime > 0 && deltaTime < 0.1) {
        setBubbles(currentBubbles => {
          let updatedBubbles = [...currentBubbles];
          
          // Mise à jour
          updatedBubbles.forEach(bubble => {
            bubble.update(deltaTime, updatedBubbles, mousePos, scrollY, dimensions);
          });
          
          // Divisions
          const newBubbles = [];
          updatedBubbles.forEach(bubble => {
            if (bubble.state === 'dividing' && bubble.stateProgress >= 0.5 && !bubble.hasSpawnedChild) {
              const child = bubble.createOffspring(dimensions);
              newBubbles.push(child);
              bubble.hasSpawnedChild = true;
            }
          });
          
          updatedBubbles.push(...newBubbles);
          
          // Nettoyage
          updatedBubbles = updatedBubbles.filter(bubble => !bubble.shouldRemove);
          
          // Maintenir population minimale
          if (updatedBubbles.length < CONFIG.organicBubbles.count * 0.7) {
            const rnd = mulberry32(Date.now());
            const side = Math.floor(rnd() * 4);
            let x, y;
            
            const margin = CONFIG.organicBubbles.spawnMargin;
            switch(side) {
              case 0:
                x = -margin;
                y = rnd() * dimensions.height;
                break;
              case 1:
                x = dimensions.width + margin;
                y = rnd() * dimensions.height;
                break;
              case 2:
                x = rnd() * dimensions.width;
                y = -margin;
                break;
              default:
                x = rnd() * dimensions.width;
                y = dimensions.height + margin;
            }
            
            const radius = CONFIG.organicBubbles.minRadius + 
                          rnd() * (CONFIG.organicBubbles.maxRadius - CONFIG.organicBubbles.minRadius) * 0.7;
            const colorKey = CONFIG.organicBubbles.colors[Math.floor(rnd() * CONFIG.organicBubbles.colors.length)];
            
            updatedBubbles.push(new LivingBubble(x, y, radius, colorKey, Date.now() + rnd() * 10000));
          }
          
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
  }, [dimensions, mousePos,
