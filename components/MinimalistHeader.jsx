// components/MinimalistHeader.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * MinimalistHeader — version plus proche de solaax.com
 * — Barre pleine largeur, **sans boîte flottante** ni bord arrondi
 * — Transparente en haut, légère teinte sombre au scroll (pas de glassmorphism)
 * — Nav centrée, uppercase optionnel, hairline 1px sous l'onglet actif
 * — Mobile : overlay simple, sombre
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

  const headerHeight = elevated ? 56 : 72;

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
          zIndex: 1000,
          transition: 'height .2s ease, background .2s ease, border-color .2s ease',
          background: elevated ? 'rgba(10, 12, 9, 0.6)' : 'transparent',
          borderBottom: elevated ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
        aria-label="En-tête Myko"
      >
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          height: '100%',
          padding: '0 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', textDecoration: 'none' }}>
            <div aria-hidden style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(145deg, #2e4d27, #1f341b)' }} />
            <span style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '.02em', color: 'var(--paper-50)' }}>Myko</span>
          </Link>

          {/* Nav centrée (desktop) */}
          <nav className="myko-center-nav" aria-label="Navigation principale">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`myko-nav-link${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions droites */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '.6rem' }}>
            {user ? (
              <>
                <span className="myko-desktop-only" style={{ fontSize: '.9rem', color: 'var(--paper-300)', opacity: .9 }}>
                  {user.email?.split('@')[0]}
                </span>
                <button onClick={handleLogout} className="myko-outline-btn myko-desktop-only">Déconnexion</button>
              </>
            ) : (
              <Link href="/login" className="myko-solid-btn">Se connecter</Link>
            )}
            <button
              className="myko-burger myko-mobile-only"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
              aria-controls="myko-mobile-menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          id="myko-mobile-menu"
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(9,11,8,.96)',
            animation: 'myko-fade-in .2s ease',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div role="menu" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, margin: '88px auto 0', padding: '0 1.25rem', display: 'grid', gap: '.5rem' }}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`myko-mobile-link${pathname === item.href ? ' is-active' : ''}`}>
                {item.label}
              </Link>
            ))}
            <div style={{ height: 10 }} />
            {user ? (
              <button onClick={handleLogout} className="myko-mobile-logout">Déconnexion</button>
            ) : (
              <Link href="/login" className="myko-mobile-login" onClick={() => setMobileOpen(false)}>Se connecter</Link>
            )}
          </div>
        </div>
      )}

      {/* Spacer dynamique */}
      <div style={{ height: headerHeight }} />

      <style jsx global>{`
        :root{
          /* Palette sombre terre/forêt */
          --paper-950:#0a0c09; /* fond global */
          --paper-900:#121710;
          --paper-700:#1b2418;
          --paper-300:#d8dbd2;
          --paper-100:#ecefe7;
          --paper-50:#f6f7f3;
          --accent-500:#8ab075; /* mousse */
          --accent-600:#739a5d;
        }

        /* NAV */
        .myko-center-nav{ display:flex; align-items:center; justify-content:center; gap:2rem; }
        .myko-nav-link{ position:relative; text-decoration:none; font-size:.92rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--paper-300); opacity:.88; transition:opacity .2s ease,color .2s ease; }
        .myko-nav-link:hover{ opacity:1 }
        .myko-nav-link.is-active{ color:var(--paper-50); opacity:1 }
        .myko-nav-link::after{ content:''; position:absolute; left:0; right:0; bottom:-8px; height:1px; background:currentColor; transform:scaleX(0); transform-origin:left; transition:transform .25s ease }
        .myko-nav-link.is-active::after{ transform:scaleX(1) }

        /* Boutons */
        .myko-solid-btn{ display:inline-flex; align-items:center; gap:.5rem; padding:.5rem 1rem; border-radius:999px; background:var(--accent-600); color:#fff; text-decoration:none; font-weight:600; font-size:.9rem; }
        .myko-solid-btn:hover{ background:var(--accent-500) }
        .myko-outline-btn{ background:transparent; border:1px solid rgba(255,255,255,.18); color:var(--paper-100); padding:.45rem 1rem; border-radius:999px; font-size:.9rem; font-weight:600; cursor:pointer }
        .myko-outline-btn:hover{ border-color:rgba(255,255,255,.36) }

        /* Burger + responsive */
        .myko-burger{ display:none; background:transparent; border:none; padding:.5rem; cursor:pointer; color:var(--paper-50) }
        @media (max-width: 1024px){ .myko-center-nav{ display:none } .myko-desktop-only{ display:none } .myko-burger{ display:inline-flex } }

        /* Mobile overlay */
        .myko-mobile-link{ display:block; padding:1rem 1rem; border-radius:10px; text-decoration:none; font-size:1.05rem; color:var(--paper-100); transition:background .2s ease }
        .myko-mobile-link:hover{ background:rgba(255,255,255,.04) }
        .myko-mobile-link.is-active{ background:rgba(255,255,255,.07); color:#fff }
        .myko-mobile-login,.myko-mobile-logout{ display:inline-flex; align-items:center; justify-content:center; width:100%; padding:.9rem 1rem; border-radius:999px; font-weight:700; font-size:1rem; text-decoration:none }
        .myko-mobile-login{ background:var(--accent-600); color:#fff }
        .myko-mobile-login:hover{ background:var(--accent-500) }
        .myko-mobile-logout{ background:transparent; color:var(--paper-100); border:1px solid rgba(255,255,255,.18) }

        @keyframes myko-fade-in{ from{opacity:0} to{opacity:1} }
      `}</style>
    </>
  );
}

/* ------------------------------------------------------
   Background organique type "Matisse" sombre
   À placer dans app/layout.js juste après <MinimalistHeader />
   <MatisseBackground />
------------------------------------------------------ */
export function MatisseBackground(){
  return (
    <div aria-hidden className="matisse-bg" />
  );
}

<style jsx global>{`
  .matisse-bg{
    position: fixed; inset: 0; z-index: 0; pointer-events:none;
    /* Base sombre */
    background:
      radial-gradient(1200px 800px at 20% -10%, rgba(114,146,96,.10), transparent 60%),
      radial-gradient(900px 700px at 80% -20%, rgba(175,133,76,.10), transparent 60%),
      linear-gradient(180deg, var(--paper-950), var(--paper-900));
  }
  /* Découpes organiques superposées (effet papier découpé) */
  .matisse-bg::before,
  .matisse-bg::after{
    content:''; position:absolute; inset:0; opacity:.9;
    background:
      /* feuilles grandes */
      radial-gradient(ellipse 36% 18% at 15% 28%, rgba(62,92,54,.55) 0 45%, transparent 46%),
      radial-gradient(ellipse 22% 12% at 32% 18%, rgba(92,129,81,.55) 0 48%, transparent 49%),
      radial-gradient(ellipse 28% 14% at 78% 20%, rgba(63,44,23,.55) 0 45%, transparent 46%),
      radial-gradient(ellipse 24% 12% at 70% 36%, rgba(99,73,39,.55) 0 47%, transparent 48%),
      /* silhouettes plus lointaines */
      radial-gradient(ellipse 40% 20% at 10% 70%, rgba(21,28,19,.65) 0 40%, transparent 41%),
      radial-gradient(ellipse 30% 16% at 82% 78%, rgba(26,34,24,.65) 0 42%, transparent 43%);
    filter: blur(2px);
  }
  .matisse-bg::after{
    opacity:.5;
    background:
      radial-gradient(ellipse 18% 9% at 25% 40%, rgba(162,125,71,.35) 0 48%, transparent 49%),
      radial-gradient(ellipse 16% 8% at 60% 58%, rgba(122,157,108,.35) 0 48%, transparent 49%),
      radial-gradient(ellipse 14% 7% at 75% 32%, rgba(84,62,33,.35) 0 48%, transparent 49%);
    filter: blur(1.5px);
  }
`}</style>

/* ------------------------------------------------------
   Exemple d'intégration dans app/layout.js (extrait)
------------------------------------------------------
<head>…</head>
<body style={{ background: 'var(--paper-950)', color: 'var(--paper-50)' }}>
  <MinimalistHeader />
  <MatisseBackground />
  <main style={{ position:'relative', zIndex:1 }}>…</main>
</body>
*/
