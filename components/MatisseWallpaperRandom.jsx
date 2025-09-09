'use client';
import { useEffect, useMemo, useState } from "react";

/* ============== Réglages (tu peux les ajuster) ============== */
const CONFIG = {
  tileWidth: 1000,          // largeur logique du motif (viewBox X)
  blobScale: 1,             // échelle globale des blobs
  // Quantités (augmente si tu veux plus de taches)
  counts: {
    cream: 5,               // gros aplats crème (fond déjà crème + renforts doux)
    olive: 5,               // taches olive
    terra: 4,               // taches terracotta
  },
  // Forme : moins de waves + jitter doux => silhouettes "Matisse", rondes
  shape: {
    waves: { min: 10, max: 14 },
    jitter: { min: 0.16, max: 0.26 },
    rotate: true,
  },
  // Tailles de base (seront randomisées autour de ces valeurs)
  size: {
    cream: { rx: 220, ry: 300 },
    olive: { rx: 140, ry: 210 },
    terra: { rx: 120, ry: 160 },
  },
  // Distance minimale entre centres pour limiter les chevauchements
  spacing: {
    cream: 240,
    olive: 190,
    terra: 160,
  },
  // Couleurs (via variables CSS, avec fallbacks)
  colors: {
    cream: "var(--cream-100, #f4efe6)",
    olive: "var(--olive-500, #6e8b5e)",
    terra: "var(--terra-500, #c08a5a)",
  },
};

/* ==================== utilitaires ==================== */
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

// Génère un blob lisse (Catmull-Rom -> cubic Bézier)
function makeBlobPath({ cx, cy, rx, ry, waves, jitter, rnd, rotate = 0 }) {
  const pts = [];
  const rot = (rotate * Math.PI) / 180;
  for (let i = 0; i < waves; i++) {
    const t = (i / waves) * Math.PI * 2;
    const amp = 1 + (rnd() * 2 - 1) * jitter;
    const phase = t + (rnd() * 2 - 1) * 0.35;
    const x0 = Math.cos(phase) * rx * amp;
    const y0 = Math.sin(phase) * ry * amp;
    const x = cx + x0 * Math.cos(rot) - y0 * Math.sin(rot);
    const y = cy + x0 * Math.sin(rot) + y0 * Math.cos(rot);
    pts.push([x, y]);
  }
  const toBezier = (p0, p1, p2, p3, tension = 0.6) => {
    const d1x = (p2[0] - p0[0]) * tension,
      d1y = (p2[1] - p0[1]) * tension,
      d2x = (p3[0] - p1[0]) * tension,
      d2y = (p3[1] - p1[1]) * tension;
    const c1 = [p1[0] + d1x / 3, p1[1] + d1y / 3];
    const c2 = [p2[0] - d2x / 3, p2[1] - d2y / 3];
    return [c1, c2, p2];
  };
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    const [c1, c2, p] = toBezier(p0, p1, p2, p3, 0.6);
    d += ` C ${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p[0]},${p[1]}`;
  }
  return d + " Z";
}

// Échantillonnage de centres avec distance minimale (rejet simple)
function sampleCenters({
  count,
  minY,
  maxY,
  minX = 80,
  maxX = CONFIG.tileWidth - 80,
  minDist,
  rnd,
}) {
  const centers = [];
  let guard = 0;
  while (centers.length < count && guard < 5000) {
    guard++;
    const x = minX + rnd() * (maxX - minX);
    const y = minY + rnd() * (maxY - minY);
    if (
      centers.every(
        (c) => (c.x - x) ** 2 + (c.y - y) ** 2 >= (minDist * minDist)
      )
    ) {
      centers.push({ x, y });
    }
  }
  return centers;
}

/* ==================== Composant ==================== */
// v3 : grand lé statique, qui suit le scroll (pas de modulo ni “sauts”)
export default function MatisseWallpaperRandom() {
  const rnd = useRNG();
  const [docH, setDocH] = useState(2000); // hauteur du “lé”

  useEffect(() => {
    const update = () => {
      const h =
        document.documentElement.scrollHeight ||
        document.body.scrollHeight ||
        window.innerHeight;
      setDocH(Math.max(h, window.innerHeight));
    };
    update();
    window.addEventListener("resize", update);
    // Optionnel : observer les mutations si ton contenu change dynamiquement
    const mo = new MutationObserver(update);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("resize", update);
      mo.disconnect();
    };
  }, []);

  const W = CONFIG.tileWidth;
  const H = docH; // un seul grand motif aussi haut que la page

  // Zones verticales pour répartir les groupes (limite le recouvrement)
  const bandH = Math.max(600, Math.floor(H / 4));

  // Centres par couleur
  const cCream = sampleCenters({
    count: CONFIG.counts.cream,
    minY: 0,
    maxY: H,
    minDist: CONFIG.spacing.cream,
    rnd,
  });
  const cOlive = sampleCenters({
    count: CONFIG.counts.olive,
    minY: bandH * 0.3,
    maxY: H - bandH * 0.3,
    minDist: CONFIG.spacing.olive,
    rnd,
  });
  const cTerra = sampleCenters({
    count: CONFIG.counts.terra,
    minY: bandH * 0.1,
    maxY: H - bandH * 0.1,
    minDist: CONFIG.spacing.terra,
    rnd,
  });

  // Helper taille/forme
  const rBetween = (a, b) => a + rnd() * (b - a);
  const waves = () =>
    Math.floor(rBetween(CONFIG.shape.waves.min, CONFIG.shape.waves.max));
  const jitter = () => rBetween(CONFIG.shape.jitter.min, CONFIG.shape.jitter.max);
  const rot = () => (CONFIG.shape.rotate ? rnd() * 180 : 0);

  // Génère chemins
  const creamPaths = cCream.map(({ x, y }) =>
    makeBlobPath({
      cx: x,
      cy: y,
      rx: CONFIG.size.cream.rx * CONFIG.blobScale * rBetween(0.9, 1.15),
      ry: CONFIG.size.cream.ry * CONFIG.blobScale * rBetween(0.9, 1.15),
      waves: waves(),
      jitter: jitter(),
      rnd,
      rotate: rot(),
    })
  );
  const olivePaths = cOlive.map(({ x, y }) =>
    makeBlobPath({
      cx: x,
      cy: y,
      rx: CONFIG.size.olive.rx * CONFIG.blobScale * rBetween(0.9, 1.1),
      ry: CONFIG.size.olive.ry * CONFIG.blobScale * rBetween(0.9, 1.1),
      waves: waves(),
      jitter: jitter(),
      rnd,
      rotate: rot(),
    })
  );
  const terraPaths = cTerra.map(({ x, y }) =>
    makeBlobPath({
      cx: x,
      cy: y,
      rx: CONFIG.size.terra.rx * CONFIG.blobScale * rBetween(0.9, 1.1),
      ry: CONFIG.size.terra.ry * CONFIG.blobScale * rBetween(0.9, 1.1),
      waves: waves(),
      jitter: jitter(),
      rnd,
      rotate: rot(),
    })
  );

  return (
    <div
      aria-hidden
      style={{
        position: "absolute", // suit le scroll naturellement
        top: 0,
        left: 0,
        width: "100%",
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
        {/* fond crème plein */}
        <rect x="0" y="0" width={W} height={H} fill={CONFIG.colors.cream} />

        {/* aplats crème (léger renfort/variation) */}
        {creamPaths.map((d, i) => (
          <path key={`c${i}`} d={d} style={{ fill: CONFIG.colors.cream }} opacity={0.98} />
        ))}

        {/* taches olive & terracotta (plus nombreuses) */}
        {olivePaths.map((d, i) => (
          <path key={`o${i}`} d={d} style={{ fill: CONFIG.colors.olive }} opacity={0.88} />
        ))}
        {terraPaths.map((d, i) => (
          <path key={`t${i}`} d={d} style={{ fill: CONFIG.colors.terra }} opacity={0.88} />
        ))}
      </svg>
    </div>
  );
}
