'use client';
import { useEffect, useMemo, useState } from "react";

// PRNG simple pour l'aléatoire
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function useSeededRandom() {
  return useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return mulberry32(a[0]);
    }
    return mulberry32(Date.now() & 0xffffffff);
  }, []);
}

// Génère une forme douce (type Matisse) via Catmull-Rom → cubic Bézier
function makeBlobPath({ cx, cy, rx, ry, waves, jitter, rnd, rotate = 0 }) {
  const pts = [];
  const rot = (rotate * Math.PI) / 180;
  for (let i = 0; i < waves; i++) {
    const t = (i / waves) * Math.PI * 2;
    const amp = 1 + (rnd() * 2 - 1) * jitter; // ±jitter (plus bas = plus rond)
    const phase = t + (rnd() * 2 - 1) * 0.35; // phase aléatoire (rend organique)
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

export default function MatisseWallpaperRandom() {
  const rnd = useSeededRandom();
  const [offset, setOffset] = useState(0);

  // === Réglages principaux ===
  const speed = 0.25;  // vitesse de défilement du papier-peint (plus petit = plus lent)
  const H = 1000;      // hauteur de la tuile (viewBox)

  useEffect(() => {
    const onScroll = () => setOffset((-(window.scrollY * speed)) % H);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Palette : fond crème + 2 teintes naturelles (olive & terracotta)
  const cream = "var(--cream-100, #f4efe6)";
  const olive = "var(--olive-500, #6e8b5e)";
  const terra = "var(--terra-500, #c08a5a)";

  // Formes très rondes / douces : peu de "waves", jitter modéré
  const creamBlobs = Array.from({ length: 4 }, (_, i) =>
    makeBlobPath({
      cx: 160 + i * 240 + (rnd() - 0.5) * 40,
      cy: 480 + (rnd() - 0.5) * 120,
      rx: 240 + rnd() * 80,
      ry: 320 + rnd() * 110,
      waves: 14 + Math.floor(rnd() * 4), // 14–18 → formes rondes
      jitter: 0.22,                      // plus bas = plus doux
      rnd,
      rotate: rnd() * 180,
    })
  );

  const oliveBlobs = Array.from({ length: 2 }, () =>
    makeBlobPath({
      cx: 200 + rnd() * 600,
      cy: 320 + rnd() * 360,
      rx: 140 + rnd() * 50,
      ry: 190 + rnd() * 60,
      waves: 12,
      jitter: 0.2,
      rnd,
      rotate: rnd() * 180,
    })
  );

  const terraBlobs = Array.from({ length: 2 }, () =>
    makeBlobPath({
      cx: 120 + rnd() * 760,
      cy: 240 + rnd() * 520,
      rx: 110 + rnd() * 40,
      ry: 70 + rnd() * 30,
      waves: 10,
      jitter: 0.18,
      rnd,
      rotate: rnd() * 180,
    })
  );

  const Tile = ({ y }) => (
    <g transform={`translate(0, ${y})`}>
      {/* fond crème plein */}
      <rect x="0" y="0" width="1000" height="1000" fill={cream} />
      {/* blobs crème dominants */}
      {creamBlobs.map((d, i) => (
        <path key={`c${y}-${i}`} d={d} style={{ fill: cream }} opacity={0.98} />
      ))}
      {/* accents olive + terracotta */}
      {oliveBlobs.map((d, i) => (
        <path key={`o${y}-${i}`} d={d} style={{ fill: olive }} opacity={0.85} />
      ))}
      {terraBlobs.map((d, i) => (
        <path key={`t${y}-${i}`} d={d} style={{ fill: terra }} opacity={0.85} />
      ))}
    </g>
  );

  const y0 = offset;     // [-1000, 0]
  const y1 = offset + H; // [0, 1000]

  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Tile y={y0} />
        <Tile y={y1} />
      </svg>
    </div>
  );
}
