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

  // Tailles sous forme de plages {min, max}
  sizes: {
    olive: { min: 70, max: 150 },
    terra: { min: 70, max: 150 },
    sable: { min: 50, max: 135 },
  },

  // Nombre de cellules
  initialCount: 12,
  maxCells: 20,
  minCells: 10,

  // Physique
  physics: {
    baseSpeed: 15,           // Vitesse de déplacement
    rotationSpeed: 0.6,      // Vitesse de rotation nominale
    rotationVariability: 0.3,// Variabilité supplémentaire de rotation
    friction: 0.94,          // Friction pour l'inertie
    repulsionForce: 20,     // Force de répulsion entre couleurs différentes
    fusionDistance: 30,      // Distance pour fusionner (utilisée qualitativement)
  },

  // Animation
  animation: {
    fps: 30,                 // 30 FPS pour la fluidité
    morphSpeed: 0.1,        // Vitesse de déformation
    scaleSpeed: 0.2,       // Vitesse de dilatation/compression
    scaleRange: [0.5, 1.6],  // Min/max de scale
    pointCount: 8,          // Nombre de points de la forme
    morphIntensity: 0.6,     // Amplitude d’offset angulaire initial et cible
  },

  // Couverture (aire totale des cellules / aire de la page)
  coverage: {
    min: 0.5,
    max: 0.8,
    target: 0.65,
    checkInterval: 2000, // ms
  },
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
    const rotationBase = (rnd() - 0.5) * CONFIG.physics.rotationSpeed;
    this.rotationSpeed = rotationBase * (0.1 + rnd() * CONFIG.physics.rotationVariability);
    this.rotationChangeTimer = rnd() * 5000;

    // Animation
    this.scale = fromEdge ? 0.1 : (0.9 + rnd() * 0.2);
    this.targetScale = 0.9 + rnd() * 0.2;
    this.opacity = fromEdge ? 0 : 1;

    // Forme
    this.points = [];
    this.targetPoints = [];
    const numPoints = CONFIG.animation.pointCount || 6;
    for (let i = 0; i < numPoints; i++) {
      const radius = 0.7 + rnd() * 0.6;
      const angleOffset = (rnd() - 0.5) * CONFIG.animation.morphIntensity;
      this.points.push({ r: radius, a: angleOffset });
      this.targetPoints.push({
        r: 0.7 + rnd() * 0.6,
        a: (rnd() - 0.5) * CONFIG.animation.morphIntensity,
      });
    }

    // Spawn
    if (fromEdge) {
      this.spawnFromEdge();
    } else {
      this.vx = (rnd() - 0.5) * CONFIG.physics.baseSpeed;
      this.vy = (rnd() - 0.5) * CONFIG.physics.baseSpeed;
    }
  }

  spawnFromEdge() {
    const side = Math.floor(this.rnd() * 4);
    const margin = 50;

    switch (side) {
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
    const dt = Math.max(0, deltaTime) / 1000; // Convertir en secondes

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
        const dist = Math.hypot(dx, dy);
        const minDist = this.size * this.scale + other.size * other.scale;

        if (dist < minDist * 1.5 && dist > 0) {
          const force = CONFIG.physics.repulsionForce * (1 - dist / (minDist * 1.3));
          this.vx += (dx / dist) * force * dt;
          this.vy += (dy / dist) * force * dt;
        }
      }
    });

    // Friction
    this.vx *= CONFIG.physics.friction;
    this.vy *= CONFIG.physics.friction;

    // Limiter la vitesse
    const speed = Math.hypot(this.vx, this.vy);
    const maxSpeed = CONFIG.physics.baseSpeed * 2;
    if (speed > maxSpeed && speed > 0) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    // Appliquer le mouvement (×60 pour un ressenti frame-based)
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    // Extinction hors-bords
    if (
      this.x < -100 || this.x > this.bounds.width + 100 ||
      this.y < -100 || this.y > this.bounds.height + 100
    ) {
      this.opacity *= 0.95;
      if (this.opacity < 0.01) {
        this.isDead = true;
      }
    }

    // Animation de scale
    if (Math.random() < 0.01) {
      this.targetScale =
        CONFIG.animation.scaleRange[0] +
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
    const dist = Math.hypot(dx, dy);
    const touchDist = (this.size * this.scale + other.size * other.scale) * 0.8;
    return dist < touchDist;
  }

  // Implémentation simple de fusion "absorbante"
  startFusion(other) {
    const factor = 0.35; // quantité absorbée
    this.size = Math.min(this.baseSize * 1.8, this.size + other.size * factor);
    this.x = (this.x + other.x) / 2;
    this.y = (this.y + other.y) / 2;
    this.scale = Math.min(CONFIG.animation.scaleRange[1], this.scale * 1.02);
    this.opacity = Math.min(1, (this.opacity + other.opacity) / 2);
  }

  getPath() {
    // Garde-fous
    if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.size) || !isFinite(this.scale)) {
      return "";
    }

    const points = [];
    const numPoints = Math.max(3, this.points.length || 8);

    for (let i = 0; i < numPoints; i++) {
      const p = this.points[i] || { r: 1, a: 0 };
      const a = (isFinite(p.a) ? p.a : 0);
      const r = (isFinite(p.r) ? p.r : 1);
      const angle = (i / numPoints) * Math.PI * 2 + a + (isFinite(this.rotation) ? this.rotation : 0);
      const radius = this.size * this.scale * r;
      const px = this.x + Math.cos(angle) * radius;
      const py = this.y + Math.sin(angle) * radius;
      if (!isFinite(px) || !isFinite(py)) return "";
      points.push([px, py]);
    }

    if (!points.length) return "";

    // Courbe de Bézier smooth
    let path = `M ${points[0][0]},${points[0][1]}`;
    const tension = 0.9;
    for (let i = 0; i < numPoints; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % numPoints];
      const p0 = points[(i - 1 + numPoints) % numPoints];
      const p3 = points[(i + 2) % numPoints];

      const cp1x = p1[0] + (p2[0] - p0[0]) * tension / 3;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension / 3;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension / 3;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension / 3;

      if (![cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]].every(isFinite)) return "";
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return path + " Z";
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
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return mulberry32(arr[0] >>> 0);
    }
    return mulberry32(Date.now() >>> 0);
  }, []);

  // Calculer la couverture des cellules
  const calculateCoverage = (cellList, width, height) => {
    const totalPageArea = Math.max(1, width * height);
    let cellsArea = 0;

    cellList.forEach(cell => {
      const radius = Math.max(0, cell.size * cell.scale);
      cellsArea += Math.PI * radius * radius;
    });

    return cellsArea / totalPageArea;
  };

  // Initialisation avec distribution homogène
  useEffect(() => {
    if (!docW || !docH) return;
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
        const { min, max } = CONFIG.sizes[color];
        const size = min + rnd() * (max - min);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rnd, docW, docH]);

  // Boucle d'animation
  useEffect(() => {
    if (cells.length === 0) return;

    const animate = (currentTime) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = currentTime - lastTimeRef.current;

      if (deltaTime >= 1000 / CONFIG.animation.fps) {
        setCells(currentCells => {
          let newCells = currentCells.map(c => c); // shallow copy
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

          // Vérifier la couverture toutes les X secondes
          coverageCheckRef.current += deltaTime;
          if (coverageCheckRef.current >= CONFIG.coverage.checkInterval) {
            coverageCheckRef.current = 0;
            const coverage = calculateCoverage(newCells, docW, docH);

            // Si couverture trop faible, spawn plus fréquent
            if (coverage < CONFIG.coverage.min && newCells.length < CONFIG.maxCells) {
              const colors = ['olive', 'terra', 'sable'];
              const color = colors[Math.floor(rnd() * colors.length)];
              const { min, max } = CONFIG.sizes[color];
              const size = min + rnd() * (max - min);

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
                if (
                  cell.x < 100 || cell.x > docW - 100 ||
                  cell.y < 100 || cell.y > docH - 100
                ) {
                  cell.opacity *= 0.98;
                  if (cell.opacity < 0.01) cell.isDead = true;
                }
              });
              newCells = newCells.filter(cell => !cell.isDead);
            }
          }

          // Spawn occasionnel depuis les bords (ajusté selon la couverture)
          const coverageNow = calculateCoverage(newCells, docW, docH);
          const spawnChance = coverageNow > CONFIG.coverage.target ? 0.002 : 0.008;

          if (newCells.length < CONFIG.maxCells && Math.random() < spawnChance) {
            const colors = ['olive', 'terra', 'sable'];
            const color = colors[Math.floor(rnd() * colors.length)];
            const { min, max } = CONFIG.sizes[color];
            const size = min + rnd() * (max - min);

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
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      lastTimeRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {cells.map(cell => {
            const d = cell.getPath();
            if (!d) return null; // évite les NaN dans d
            return (
              <path
                key={cell.id}
                d={d}
                fill={CONFIG.colors[cell.color]}
                opacity={cell.opacity}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
