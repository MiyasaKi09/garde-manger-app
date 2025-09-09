// components/MinimalistHeader.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Header style solaax + Background Matisse très marqué
 * – Nav centrée dans une boîte glassmorphique
 * – Fond global sombre avec motifs organiques type "Matisse"
 */
export default function MinimalistHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [elevated, setElevated] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    const onScroll = () => setElevated(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = useMemo(() => ([
    { href: '/pantry', label: 'Garde-manger' },
    { href: '/recipes', label: 'Recettes' },
    { href: '/garden', label: 'Potager' },
    { href: '/planning', label: 'Planning' },
    { href: '/shopping', label: 'Courses' },
  ]), []);

  const headerHeight = elevated ? 64 : 80;

  return (
    <>
      <header
        role="banner"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'height .25s ease, background .25s ease',
          background: 'transparent',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            padding: '.6rem 1.2rem',
            borderRadius: '999px',
            background: elevated ? 'rgba(30,30,30,0.35)' : 'rgba(30,30,30,0.25)',
            border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`myko-nav-link${active ? ' is-active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}

          {user ? (
            <button onClick={handleLogout} className="myko-solid-btn">Déconnexion</button>
          ) : (
            <Link href="/login" className="myko-solid-btn">Se connecter</Link>
          )}
        </div>
      </header>

      {/* Spacer dynamique */}
      <div style={{ height: headerHeight }} />

      {/* Effet Matisse fort */}
      <div className="matisse-bg" aria-hidden />

      <style jsx global>{`
        body {
          background: #0a0f0a;
          color: #fff;
        }

        .myko-nav-link {
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          color: #fff;
          opacity: .85;
          transition: opacity .2s ease;
        }
        .myko-nav-link:hover { opacity: 1; }
        .myko-nav-link.is-active { opacity: 1; font-weight: 600; }

        .myko-solid-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: .4rem 1rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.2);
          color: #fff;
          font-weight: 600;
          font-size: .9rem;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.25);
          transition: background .2s ease;
        }
        .myko-solid-btn:hover { background: rgba(255,255,255,0.35); }

        /* Effet Matisse très fort */
        .matisse-bg {
          position: fixed;
          inset: 0;
          z-index: -1;
          background: linear-gradient(180deg, #0a0f0a 0%, #1c2418 100%);
        }
        .matisse-bg::before,
        .matisse-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 35% 20% at 15% 25%, rgba(92,129,81,0.8) 0 50%, transparent 51%),
            radial-gradient(ellipse 30% 15% at 70% 30%, rgba(175,133,76,0.7) 0 50%, transparent 51%),
            radial-gradient(ellipse 40% 20% at 25% 70%, rgba(114,146,96,0.8) 0 45%, transparent 46%),
            radial-gradient(ellipse 30% 15% at 80% 75%, rgba(84,62,33,0.7) 0 48%, transparent 49%);
          mix-blend-mode: multiply;
          filter: blur(4px) contrast(1.2);
          opacity: 0.9;
        }
        .matisse-bg::after {
          opacity: 0.6;
          background:
            radial-gradient(ellipse 20% 10% at 40% 40%, rgba(162,125,71,0.8) 0 50%, transparent 51%),
            radial-gradient(ellipse 18% 9% at 65% 55%, rgba(122,157,108,0.8) 0 50%, transparent 51%);
          filter: blur(2px);
        }
      `}</style>
    </>
  );
}


/* ------------------------------------------------------
   Background organique type "Matisse" — VERSION FORTE
   ➜ Multicouches, contrastes élevés, teintes terre/vert, léger parallax
   ➜ Pur CSS (aucune image), animation lente
   ➜ Place <MatisseBackgroundStrong /> juste après <MinimalistHeader />
------------------------------------------------------ */
export function MatisseBackgroundStrong(){
  return (
    <div aria-hidden className="matisse-strong">
      <div className="matisse-layer l1" />
      <div className="matisse-layer l2" />
      <div className="matisse-layer l3" />
      <div className="matisse-grain" />
      <div className="matisse-vignette" />
    </div>
  );
}

<style jsx global>{`
  :root{
    --m-earth:#6f4f28;    /* terre brûlée */
    --m-earth-d:#3f2b16;  /* terre sombre */
    --m-moss:#6ea067;     /* mousse */
    --m-fern:#2e5a35;     /* fougère */
    --m-deep:#0c110c;     /* fond */
    --m-olive:#4d6a3b;    /* olive */
    --m-clay:#b88958;     /* argile */
  }

  .matisse-strong{ position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; background: radial-gradient(1200px 900px at 15% -10%, rgba(110,160,103,.15), transparent 60%), radial-gradient(1000px 800px at 85% -15%, rgba(184,137,88,.12), transparent 60%), linear-gradient(180deg, #0a0e0a 0%, #10160f 40%, #0a0e0a 100%); }

  .matisse-layer{ position:absolute; inset:-10%; mix-blend-mode:normal; opacity:.95; }

  /* L1 : masses principales (grosses découpes) */
  .matisse-layer.l1{ background:
    radial-gradient(ellipse 50% 22% at 10% 26%, var(--m-fern) 0 48%, transparent 49%),
    radial-gradient(ellipse 32% 14% at 28% 14%, var(--m-moss) 0 48%, transparent 49%),
    radial-gradient(ellipse 44% 18% at 80% 18%, var(--m-earth-d) 0 48%, transparent 49%),
    radial-gradient(ellipse 36% 16% at 70% 36%, var(--m-earth) 0 48%, transparent 49%),
    radial-gradient(ellipse 48% 20% at 8% 72%, #0b140c 0 45%, transparent 46%),
    radial-gradient(ellipse 38% 18% at 86% 78%, #0c160d 0 45%, transparent 46%);
    filter: blur(2px);
    transform: translate3d(0,0,0);
    animation: m-shift-1 80s linear infinite;
  }

  /* L2 : découpes moyennes (couleurs d'accent) */
  .matisse-layer.l2{ opacity:.9; background:
    radial-gradient(ellipse 22% 10% at 22% 40%, var(--m-clay) 0 50%, transparent 51%),
    radial-gradient(ellipse 18% 9%  at 60% 58%, var(--m-moss) 0 50%, transparent 51%),
    radial-gradient(ellipse 16% 8%  at 75% 32%, var(--m-olive) 0 50%, transparent 51%),
    radial-gradient(ellipse 18% 9%  at 40% 78%, #21351f 0 50%, transparent 51%);
    filter: blur(1.2px);
    animation: m-shift-2 65s linear infinite reverse;
  }

  /* L3 : petites formes contrastées (coup de pinceau) */
  .matisse-layer.l3{ opacity:.8; background:
    radial-gradient(ellipse 14% 6% at 18% 22%, rgba(255,255,255,.06) 0 48%, transparent 49%),
    radial-gradient(ellipse 12% 5% at 78% 26%, rgba(255,255,255,.05) 0 48%, transparent 49%),
    radial-gradient(ellipse 10% 4% at 66% 74%, rgba(255,255,255,.05) 0 48%, transparent 49%),
    radial-gradient(ellipse 9% 4%  at 30% 64%, rgba(255,255,255,.04) 0 48%, transparent 49%);
    filter: blur(.7px);
    animation: m-shift-3 55s linear infinite;
  }

  /* Grain doux pour donner un côté papier */
  .matisse-grain{ position:absolute; inset:0; background-image: repeating-radial-gradient(circle at 10% 10%, rgba(255,255,255,.03) 0 1px, transparent 1px 3px); opacity:.25; mix-blend-mode:overlay; }

  /* Vignette pour garder la lisibilité au centre */
  .matisse-vignette{ position:absolute; inset:-5%; background: radial-gradient(60% 40% at 50% 35%, transparent 0 55%, rgba(0,0,0,.25) 70%, rgba(0,0,0,.55) 100%); }

  @keyframes m-shift-1{ 0%{ transform: translate3d(0,0,0) } 50%{ transform: translate3d(2%, -1%, 0) } 100%{ transform: translate3d(0,0,0) } }
  @keyframes m-shift-2{ 0%{ transform: translate3d(0,0,0) } 50%{ transform: translate3d(-2%, 1%, 0) } 100%{ transform: translate3d(0,0,0) } }
  @keyframes m-shift-3{ 0%{ transform: translate3d(0,0,0) } 50%{ transform: translate3d(1%, 2%, 0) } 100%{ transform: translate3d(0,0,0) } }
`}</style>

/* ------------------------------------------------------
   Exemple d'intégration (app/layout.js)
------------------------------------------------------
<body style={{ background: '#0a0e0a' }}>
  <MinimalistHeader />
  <MatisseBackgroundStrong />
  <main style={{ position:'relative', zIndex:1 }}>…</main>
</body>
*/


/* ------------------------------------------------------
   MatisseCutoutsBG — fond "découpes" façon Matisse (SVG net, très fort)
   Couleurs : liées à tes variables projet
   Usage : <MatisseCutoutsBG /> juste après <MinimalistHeader />
------------------------------------------------------ */
export function MatisseCutoutsBG() {
  return (
    <div aria-hidden style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
      <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Palette paramétrable via CSS variables */}
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
          <style>
            {`
              .paper { fill: var(--paper, #f6f7f3); }
              .earth { fill: var(--earth, #b1793a); }
              .clay { fill: var(--clay, #c9b098); }
              .moss { fill: var(--moss, #6ea067); }
              .deep { fill: url(#bgGrad); }
            `}
          </style>
        </defs>

        {/* Fond */}
        <rect className="deep" x="0" y="0" width="1000" height="1000" />

        {/* Bandeau gauche (négatif papier) */}
        <g>
          <path className="paper" d="M40,60 C40,60 80,50 120,60 C140,70 160,95 170,130 C180,160 180,210 170,250 C160,295 140,330 120,360 C100,390 85,420 80,460 C70,520 90,560 110,610 C130,655 150,700 140,740 C120,820 60,860 40,860 L40,60 Z"/>
          {/* Découpes ocres à l'intérieur (stries) */}
          <path className="earth" d="M90,140 C140,110 200,120 240,160 C210,180 170,200 120,230 C110,200 100,170 90,140 Z"/>
          <path className="earth" d="M95,260 C165,225 225,230 270,270 C240,290 175,320 110,350 C105,320 100,290 95,260 Z"/>
          <path className="earth" d="M95,380 C170,345 245,350 290,395 C255,420 175,450 110,480 C103,446 99,413 95,380 Z"/>
          <path className="earth" d="M95,500 C165,468 235,472 280,515 C240,540 170,565 110,595 C104,564 100,532 95,500 Z"/>
          <path className="earth" d="M95,620 C160,595 225,598 265,640 C230,662 165,690 115,715 C107,683 101,651 95,620 Z"/>
        </g>

        {/* Bandeau droit (papier clair + formes) */}
        <g>
          <path className="clay" d="M880,80 C930,120 950,170 950,230 C950,320 900,370 870,430 C845,480 845,530 865,580 C890,640 930,690 940,750 C950,820 915,880 860,910 C800,940 740,930 700,900 C760,860 775,820 770,770 C765,720 735,680 720,640 C700,585 710,525 735,480 C760,435 800,410 820,360 C850,290 830,210 800,160 C830,150 860,150 880,80 Z"/>
          <path className="paper" d="M760,840 C800,800 820,760 805,715 C792,680 760,650 740,620 C765,640 790,640 815,630 C845,620 875,600 895,575 C905,615 910,655 905,700 C900,760 870,815 820,860 C800,860 780,850 760,840 Z"/>
        </g>

        {/* Quelques touches mousse/vert (rares) pour rester terreux */}
        <path className="moss" d="M640,170 C700,150 760,165 790,210 C760,220 705,235 655,255 C648,225 645,195 640,170 Z" opacity=".55"/>
        <path className="moss" d="M620,420 C675,400 735,410 760,450 C735,460 680,480 640,495 C633,470 628,445 620,420 Z" opacity=".5"/>

        {/* Grain subtil sur tout l'écran */}
        <rect x="0" y="0" width="1000" height="1000" filter="url(#grain)" opacity="0.18" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------
   Variables conseillées (à placer dans :root)
   --paper: #f6f7f3; // clair
   --earth: #b1793a; // ocre terre
   --clay:  #c9b098; // argile
   --moss:  #6ea067; // mousse
   --bg-top:    #0b0f0a; // vert-noir
   --bg-bottom: #1a2318; // vert profond
------------------------------------------------------ */
