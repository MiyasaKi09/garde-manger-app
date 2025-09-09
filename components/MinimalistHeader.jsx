// components/MinimalistHeader.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Header style "solaax.com" :
 * – Navigation centrée dans une boîte glassmorphique (flottante, arrondie)
 * – CTA "Se connecter" dans la même boîte
 * – Effet shrink au scroll (fond légèrement plus opaque)
 * – Overlay mobile plein écran
 */
export default function MinimalistHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [elevated, setElevated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
            padding: '.5rem 1rem',
            borderRadius: '999px',
            background: elevated ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
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

      {/* Styles globaux */}
      <style jsx global>{`
        body {
          background: linear-gradient(180deg, #0b0f0a, #1c2418);
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
        .myko-solid-btn:hover { background: rgba(255,255,255,0.3); }
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

