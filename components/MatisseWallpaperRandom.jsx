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
    radiusFactor: 0.62, // 0.6–0.7 : marge “convexe” de la tache
    padding: 24,        // px supplémentaires entre taches
    attemptsPerBlob: 120, // nb d’essais pour placer une tache
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

/* ========== Forme lisse sans “pics” (super-ellipse + harmoniques basses) ========== */
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
      ok = placedSoFar.every((b) => {
        const dx = b.cx - cx;
        const dy = b.cy - cy;
        const minDist = b.rEff + rEff;
        return dx * dx + dy * dy >= minDist * minDist;
      });

      // test interne à ce groupe
      if (ok) {
        ok = blobs.every((b) => {
          const dx = b.cx - cx;
          const dy = b.cy - cy;
          const minDist = b.rEff + rEff;
          return dx * dx + dy * dy >= minDist * minDist;
        });
      }

      if (ok) {
        rx = rxJ;
        ry = ryJ;
        path = makeSmoothBlob({ cx, cy, rx, ry, rnd });
      }
    }

    if (ok) {
      const obj = { cx, cy, rx, ry, rEff: effRadius(rx, ry), colorKey, path };
      blobs.push(obj);
      placedSoFar.push(obj); // important : on empile globalement
      placed++;
    } else {
      // on stoppe si ça ne passe plus (évite boucle longue)
      break;
    }
  }
  return blobs;
}

/* ==================== Composant ==================== */
export default function MatisseWallpaperRandom() {
  const rnd = useRNG();
  const [docH, setDocH] = useState(2000);

  useEffect(() => {
    const update = () => {
      const h =
        document.documentElement.scrollHeight ||
        document.body.scrollHeight ||
        window.innerHeight;
      setDocH(Math.max(h, window.innerHeight));
    };
    update();

    // maj auto si le contenu change
    const mo = new MutationObserver(update);
    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", update);
    return () => {
      mo.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const W = CONFIG.tileWidth;
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

  const all = [...sableBlobs, ...oliveBlobs, ...terraBlobs];

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        height: `${H}px`,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fond papier peint (crème via var CSS) */}
        <rect x="0" y="0" width={W} height={H} fill={CONFIG.colors.bg} />

        {/* Taches (sans crème) – formes douces, pas de pics */}
        {all.map((b, i) => (
          <path
            key={i}
            d={b.path}
            style={{ fill: CONFIG.colors[b.colorKey] }}
            opacity={0.9}
          />
        ))}
      </svg>
    </div>
  );
}
