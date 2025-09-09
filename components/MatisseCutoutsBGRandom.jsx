'use client';
import { useEffect, useMemo, useState } from "react";

// === v2: formes plus organiques + dominance crème ===
// - Gros blobs crème + quelques accents terre/mousse
// - Courbes lissées (Catmull-Rom -> cubic Bézier)
// - Nouveau seed à chaque chargement

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// blob organique avec variations d'angle et de rayon
function makeBlobPath({ cx, cy, rx, ry, waves, jitter, rnd, rotate = 0 }) {
  const pts = [];
  const rot = (rotate * Math.PI) / 180;
  for (let i = 0; i < waves; i++) {
    const t = (i / waves) * Math.PI * 2;
    const amp = 1 + (rnd() * 2 - 1) * jitter;         // variation ±jitter
    const phase = t + (rnd() * 2 - 1) * 0.25;         // phase aléatoire
    const x0 = Math.cos(phase) * rx * amp;
    const y0 = Math.sin(phase) * ry * amp;
    const x = cx + x0 * Math.cos(rot) - y0 * Math.sin(rot);
    const y = cy + x0 * Math.sin(rot) + y0 * Math.cos(rot);
    pts.push([x, y]);
  }
  // Catmull-Rom -> cubic Bézier
  const catmullRom2bezier = (p0, p1, p2, p3, t = 0.72) => {
    const d1x = (p2[0] - p0[0]) * t, d1y = (p2[1] - p0[1]) * t;
    const d2x = (p3[0] - p1[0]) * t, d2y = (p3[1] - p1[1]) * t;
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
    const [c1, c2, p] = catmullRom2bezier(p0, p1, p2, p3);
    d += ` C ${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p[0]},${p[1]}`;
  }
  return d + " Z";
}

export default function MatisseCutoutsBGRandom() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const seed = useMemo(() => {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0];
    }
    return Date.now() & 0xffffffff;
  }, []);
  const rnd = useMemo(() => mulberry32(seed), [seed]);

  if (!mounted) return null; // évite le mismatch SSR

  // === Palette via CSS vars (fallbacks)
  const paper = "var(--paper, #f4efe6)"; // crème dominant
  const earth = "var(--earth, #b1793a)"; // ocre
  const clay  = "var(--clay, #e6d7c4)";  // argile claire
  const moss  = "var(--moss, #6ea067)";  // accents verts

  // Gros blobs crème (dominants)
  const creamBlobs = Array.from({ length: 4 }, (_, i) =>
    makeBlobPath({
      cx: 200 + i * 180 + (rnd() - 0.5) * 60,
      cy: 420 + (rnd() - 0.5) * 140,
      rx: 200 + rnd() * 80,
      ry: 280 + rnd() * 100,
      waves: 30 + Math.floor(rnd() * 12),
      jitter: 0.5,
      rnd,
      rotate: rnd() * 180,
    })
  );

  // Accents argile
  const clayBlobs = Array.from({ length: 2 }, () =>
    makeBlobPath({
      cx: 720 + (rnd() - 0.5) * 140,
      cy: 520 + (rnd() - 0.5) * 180,
      rx: 160 + rnd() * 60,
      ry: 230 + rnd() * 80,
      waves: 26 + Math.floor(rnd() * 10),
      jitter: 0.46,
      rnd,
      rotate: rnd() * 180,
    })
  );

  // Stries ocres (gauche)
  const earthStripes = Array.from({ length: 6 }, (_, i) =>
    makeBlobPath({
      cx: 220 + (rnd() - 0.5) * 40,
      cy: 200 + i * (95 + rnd() * 20),
      rx: 120 - i * 12 + rnd() * 12,
      ry: 30 + rnd() * 16,
      waves: 18,
      jitter: 0.38,
      rnd,
      rotate: rnd() * 40,
    })
  );

  // Quelques touches mousse
  const mossAccents = Array.from({ length: 2 }, () =>
    makeBlobPath({
      cx: 560 + rnd() * 300,
      cy: 220 + rnd() * 320,
      rx: 70 + rnd() * 50,
      ry: 24 + rnd() * 24,
      waves: 16,
      jitter: 0.42,
      rnd,
      rotate: rnd() * 180,
    })
  );

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
        <defs>
          <linearGradient id="bgGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--bg-top, #0b0f0a)" />
            <stop offset="100%" stopColor="var(--bg-bottom, #1a2318)" />
          </linearGradient>
          <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0 .05 .15 .05 0" />
            </feComponentTransfer>
            <feBlend mode="multiply" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Fond général */}
        <rect x="0" y="0" width="1000" height="1000" fill="url(#bgGrad)" />

        {/* Crème dominant */}
        {creamBlobs.map((d, i) => (
          <path key={`c${i}`} d={d} style={{ fill: paper }} opacity={0.97} />
        ))}

        {/* Stries ocres dessous */}
        {earthStripes.map((d, i) => (
          <path key={`e${i}`} d={d} style={{ fill: earth }} opacity={0.9} />
        ))}

        {/* Accents argile + mousse */}
        {clayBlobs.map((d, i) => (
          <path key={`k${i}`} d={d} style={{ fill: clay }} opacity={0.92} />
        ))}
        {mossAccents.map((d, i) => (
          <path key={`m${i}`} d={d} style={{ fill: moss }} opacity={0.55} />
        ))}

        {/* Grain discret */}
        <rect
          x="0"
          y="0"
          width="1000"
          height="1000"
          filter="url(#grain)"
          opacity=".12"
        />
      </svg>
    </div>
  );
}
