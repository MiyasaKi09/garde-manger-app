'use client';
import { useEffect, useMemo, useState } from "react";

/* ================= REGLAGES ================= */
const CONFIG = {
  tileWidth: 1000,
  // Palette (le fond reste crème via CSS global ; ici taches seulement)
  colors: {
    bg:    "var(--cream-100, #f4efe6)",
    olive: "var(--olive-500, #6e8b5e)",
    terra: "var(--terra-500, #c08a5a)",
    sable: "var(--sable-300, #e2c98f)",
  },
  // Combien de taches
  counts: { olive: 6, terra: 5, sable: 6 },
  // Tailles nominales (elles seront randomisées autour)
  sizes: {
    olive: { rx: 160, ry: 220 },
    terra: { rx: 130, ry: 180 },
    sable: { rx: 200, ry: 260 },
  },
  // Anti-chevauchement : facteur de rayon effectif + padding
  packing: {
    radiusFactor: 0.62, // 0.6–0.7 : marge "convexe" de la tache
    padding: 24,        // px supplémentaires entre taches
    attemptsPerBlob: 120, // nb d'essais pour placer une tache
    sideInset: 80,      // marge latérale pour éviter les bords
  },
  // Forme : très douce, basse fréquence
  shape: {
    points: 72,          // résolution (plus = plus lisse)
    noiseAmp: 0.16,      // amplitude des déformations (0.10–0.20 doux)
    harmonicMin: 3,      // k min (3–5)
    harmonicMax: 5,      // k max
    tension: 0.52,       // tension Catmull-Rom (0.45–0.6 doux)
    scaleJitter: 0.12,   // variation de taille ±12%
    rotate: true,
  },
  // NOUVEAU: Animations
  animations: {
    duration: {
      slow: '45s',
      medium: '35s', 
      fast: '25s'
    },
    delays: {
      olive: '0s',
      terra: '15s',
      sable: '30s'
    }
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
function useRNG() {
  return useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return mulberry32(a[0]);
    }
    return mulberry32(Date.now() & 0xffffffff);
  }, []);
}
const randBetween = (rnd, a, b) => a + rnd() * (b - a);

/* ========== Forme lisse sans "pics" (super-ellipse + harmoniques basses) ========== */
function toCubicPath(points, tension = 0.52) {
  // points: [[x,y], ...] fermé (le 1er = le 0)
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

function makeSmoothBlob({ cx, cy, rx, ry, rnd }) {
  const {
    points,
    noiseAmp,
    harmonicMin,
    harmonicMax,
    rotate,
    scaleJitter,
    tension,
  } = CONFIG.shape;

  const k = Math.floor(randBetween(rnd, harmonicMin, harmonicMax + 1)); // harmonique 3–5
  const ampA = randBetween(rnd, -noiseAmp, noiseAmp);
  const ampB = randBetween(rnd, -noiseAmp, noiseAmp);

  const sJ = 1 + randBetween(rnd, -scaleJitter, scaleJitter);
  const _rx = rx * sJ;
  const _ry = ry * sJ;

  const rot = rotate ? randBetween(rnd, 0, Math.PI * 2) : 0;
  const cosR = Math.cos(rot), sinR = Math.sin(rot);

  const pts = [];
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2;
    // super-ellipse radiale avec déformation harmonique basse fréquence
    const rMod = 1 + ampA * Math.cos(k * t) + ampB * Math.sin(k * t);
    const x0 = Math.cos(t) * _rx * rMod;
    const y0 = Math.sin(t) * _ry * rMod;
    // rotation
    const xr = x0 * cosR - y0 * sinR;
    const yr = x0 * sinR + y0 * cosR;
    pts.push([cx + xr, cy + yr]);
  }
  return toCubicPath(pts, tension);
}

/* ========== Placement anti-chevauchement ========== */
function tryPlaceBlobs({
  rnd,
  count,
  baseRx,
  baseRy,
  colorKey,
  H,
  W,
  placedSoFar,
}) {
  const { sideInset, padding, attemptsPerBlob, radiusFactor } = CONFIG.packing;
  const blobs = [];
  let placed = 0;

  // Pour le test de chevauchement : rayon effectif ~ moyenne * facteur
  const effRadius = (rx, ry) => ((rx + ry) * 0.5) * radiusFactor;

  while (placed < count) {
    let ok = false;
    let tries = 0;
    let cx = 0, cy = 0, rx = 0, ry = 0, path = "";

    while (!ok && tries < attemptsPerBlob) {
      tries++;

      // zone de placement
      const minX = sideInset, maxX = W - sideInset;
      const minY = sideInset, maxY = H - sideInset;

      // taille random douce
      const rxJ = baseRx * (0.9 + rnd() * 0.2);
      const ryJ = baseRy * (0.9 + rnd() * 0.2);

      cx = randBetween(rnd, minX, maxX);
      cy = randBetween(rnd, minY, maxY);

      const rEff = effRadius(rxJ, ryJ) + padding;

      // test contre les déjà placés (toutes couleurs confondues)
      ok = placedSoFar.every(blob => {
        const dx = cx - blob.cx;
        const dy = cy - blob.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist >= rEff + blob.rEff;
      });

      if (ok) {
        rx = rxJ;
        ry = ryJ;
        path = makeSmoothBlob({ cx, cy, rx, ry, rnd });
        placedSoFar.push({ cx, cy, rEff });
      }
    }

    if (ok) {
      blobs.push({ cx, cy, rx, ry, path, colorKey });
      placed++;
    } else {
      // Si on n'arrive pas à placer, on s'arrête
      console.warn(`Impossible de placer blob ${placed + 1}/${count} pour ${colorKey}`);
      break;
    }
  }

  return blobs;
}

/* ================= Hook de dimension écran ================= */
function useWindowSize() {
  const [size, setSize] = useState({ width: 1200, height: 800 }); // fallback SSR
  useEffect(() => {
    function updateSize() {
      setSize({ 
        width: window.innerWidth, 
        height: Math.max(window.innerHeight, document.documentElement.scrollHeight)
      });
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);
  return size;
}

/* ================= COMPOSANT PRINCIPAL ================= */
export default function MatisseWallpaperRandom() {
  const rnd = useRNG();
  const { width: docW, height: docH } = useWindowSize();

  // génération des blobs avec anti-chevauchement
  const blobs = useMemo(() => {
    const W = Math.max(docW, CONFIG.tileWidth);
    const H = docH;

    // placement global anti-chevauchement (toutes couleurs confondues)
    const placedGlobal = [];

    const oliveBlobs = tryPlaceBlobs({
      rnd,
      count: CONFIG.counts.olive,
      baseRx: CONFIG.sizes.olive.rx,
      baseRy: CONFIG.sizes.olive.ry,
      colorKey: "olive",
      H,
      W,
      placedSoFar: placedGlobal,
    });

    const terraBlobs = tryPlaceBlobs({
      rnd,
      count: CONFIG.counts.terra,
      baseRx: CONFIG.sizes.terra.rx,
      baseRy: CONFIG.sizes.terra.ry,
      colorKey: "terra",
      H,
      W,
      placedSoFar: placedGlobal,
    });

    const sableBlobs = tryPlaceBlobs({
      rnd,
      count: CONFIG.counts.sable,
      baseRx: CONFIG.sizes.sable.rx,
      baseRy: CONFIG.sizes.sable.ry,
      colorKey: "sable",
      H,
      W,
      placedSoFar: placedGlobal,
    });

    return {
      olive: oliveBlobs,
      terra: terraBlobs,
      sable: sableBlobs,
      W,
      H
    };
  }, [rnd, docW, docH]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        height: `${blobs.H}px`,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden"
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${blobs.W} ${blobs.H}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ background: CONFIG.colors.bg }}
      >
        {/* Fond papier peint (crème via var CSS) */}
        <rect x="0" y="0" width={blobs.W} height={blobs.H} fill={CONFIG.colors.bg} />

        {/* Groupes de taches avec animations différentes */}
        <g className="olive-group">
          {blobs.olive.map((b, i) => (
            <path
              key={`olive-${i}`}
              d={b.path}
              fill={CONFIG.colors.olive}
              opacity="0.9"
              style={{
                animation: `organicFloat1 ${CONFIG.animations.duration.slow} ease-in-out infinite`,
                animationDelay: `${i * 3}s`,
                transformOrigin: `${b.cx}px ${b.cy}px`
              }}
            />
          ))}
        </g>

        <g className="terra-group">
          {blobs.terra.map((b, i) => (
            <path
              key={`terra-${i}`}
              d={b.path}
              fill={CONFIG.colors.terra}
              opacity="0.8"
              style={{
                animation: `organicFloat2 ${CONFIG.animations.duration.medium} ease-in-out infinite reverse`,
                animationDelay: `${CONFIG.animations.delays.terra}`,
                animationDelay: `${i * 4}s`,
                transformOrigin: `${b.cx}px ${b.cy}px`
              }}
            />
          ))}
        </g>

        <g className="sable-group">
          {blobs.sable.map((b, i) => (
            <path
              key={`sable-${i}`}
              d={b.path}
              fill={CONFIG.colors.sable}
              opacity="0.7"
              style={{
                animation: `organicFloat3 ${CONFIG.animations.duration.fast} ease-in-out infinite`,
                animationDelay: `${CONFIG.animations.delays.sable}`,
                animationDelay: `${i * 2}s`,
                transformOrigin: `${b.cx}px ${b.cy}px`
              }}
            />
          ))}
        </g>
      </svg>

      {/* CSS pour les animations */}
      <style jsx>{`
        @keyframes organicFloat1 {
          0%, 100% { 
            transform: translate(0px, 0px) rotate(0deg) scale(1); 
          }
          25% { 
            transform: translate(15px, -25px) rotate(1deg) scale(1.02); 
          }
          50% { 
            transform: translate(-10px, 20px) rotate(-0.5deg) scale(0.98); 
          }
          75% { 
            transform: translate(-20px, -10px) rotate(1.2deg) scale(1.01); 
          }
        }

        @keyframes organicFloat2 {
          0%, 100% { 
            transform: translate(0px, 0px) rotate(0deg) scale(1); 
          }
          33% { 
            transform: translate(-18px, 30px) rotate(-0.8deg) scale(1.03); 
          }
          66% { 
            transform: translate(25px, -15px) rotate(0.6deg) scale(0.97); 
          }
        }

        @keyframes organicFloat3 {
          0%, 100% { 
            transform: translate(0px, 0px) rotate(0deg) scale(1); 
          }
          20% { 
            transform: translate(12px, 18px) rotate(0.4deg) scale(1.01); 
          }
          40% { 
            transform: translate(-15px, -12px) rotate(-0.7deg) scale(0.99); 
          }
          60% { 
            transform: translate(8px, -20px) rotate(0.5deg) scale(1.02); 
          }
          80% { 
            transform: translate(-10px, 15px) rotate(-0.3deg) scale(0.98); 
          }
        }

        /* Réduction sur mobile pour les performances */
        @media (max-width: 768px) {
          .olive-group, .terra-group, .sable-group {
            animation-duration: 60s !important;
          }
        }

        /* Respect des préférences d'accessibilité */
        @media (prefers-reduced-motion: reduce) {
          .olive-group, .terra-group, .sable-group {
            animation: none !important;
          }
          .olive-group path, .terra-group path, .sable-group path {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
