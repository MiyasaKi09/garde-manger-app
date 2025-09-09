'use client';
import { useEffect, useMemo, useState } from "react";

// petit PRNG deterministe pour un seed donné
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// génère une “forme découpée” type Matisse (courbe douce) autour d’un centre
function makeWavyPath(cx, cy, rx, ry, waves, rnd) {
  // on construit une poly-courbe fermée avec des petites ondulations
  const pts = [];
  for (let i = 0; i < waves; i++) {
    const t = (i / waves) * Math.PI * 2;
    const jitterR = (rnd() - 0.5) * 0.25; // ±25% de variation
    const rrx = rx * (1 + jitterR);
    const rry = ry * (1 + jitterR);
    const x = cx + Math.cos(t) * rrx;
    const y = cy + Math.sin(t) * rry;
    pts.push([x, y]);
  }
  // lissage simple en Q (quadratic bezier) entre les points
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const p0 = pts[i - 1];
    const cx1 = (p0[0] + p[0]) / 2;
    const cy1 = (p0[1] + p[1]) / 2;
    d += ` Q ${cx1},${cy1} ${p[0]},${p[1]}`;
  }
  // fermer avec le premier point
  const pLast = pts[pts.length - 1];
  const pFirst = pts[0];
  const cxClose = (pLast[0] + pFirst[0]) / 2;
  const cyClose = (pLast[1] + pFirst[1]) / 2;
  d += ` Q ${cxClose},${cyClose} ${pFirst[0]},${pFirst[1]} Z`;
  return d;
}

export default function MatisseCutoutsBGRandom() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // seed différent à chaque chargement (crypto si dispo)
  const seed = useMemo(() => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0];
    }
    return Date.now() & 0xffffffff;
  }, []);
  const rnd = useMemo(() => mulberry32(seed), [seed]);

  if (!mounted) return null; // évite mismatch SSR/CSR

  // génère quelques grandes formes “papier”
  const leftPaper = makeWavyPath(140, 480, 120, 380, 18, rnd);
  const rightClay = makeWavyPath(860, 520, 120, 360, 16, rnd);
  // stries ocres internes côté gauche
  const stripes = Array.from({ length: 5 }, (_, i) =>
    makeWavyPath(140 + (rnd() - .5) * 10, 220 + i * 100, 90 - i * 8, 30 + rnd()*10, 10, rnd)
  );

  return (
    <div aria-hidden style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
      <svg
        width="100%" height="100%"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--bg-top, #0b0f0a)"/>
            <stop offset="100%" stopColor="var(--bg-bottom, #1a2318)"/>
          </linearGradient>
          <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0 .05 .15 .05 0"/>
            </feComponentTransfer>
            <feBlend mode="multiply" in2="SourceGraphic"/>
          </filter>
        </defs>

        {/* fond dégradé */}
        <rect x="0" y="0" width="1000" height="1000" fill="url(#bgGrad)" />

        {/* grandes masses */}
        <path d={leftPaper} style={{ fill: "var(--paper, #f6f7f3)" }} />
        <path d={rightClay} style={{ fill: "var(--clay, #c9b098)" }} />

        {/* stries ocres (gauche) */}
        {stripes.map((d, i) => (
          <path key={i} d={d} style={{ fill: "var(--earth, #b1793a)" }} opacity={0.95}/>
        ))}

        {/* quelques touches mousse aléatoires */}
        {[0,1].map((k) => {
          const d = makeWavyPath(600 + rnd()*200, 260 + rnd()*260, 60 + rnd()*40, 20 + rnd()*20, 10, rnd);
          return <path key={`m${k}`} d={d} style={{ fill: "var(--moss, #6ea067)" }} opacity={0.5} />;
        })}

        {/* grain */}
        <rect x="0" y="0" width="1000" height="1000" filter="url(#grain)" opacity=".18"/>
      </svg>
    </div>
  );
}
