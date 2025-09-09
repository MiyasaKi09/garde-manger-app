// components/MinimalistHeader.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * Header "solaax-like" pour Myko
 * — Transparent au dessus du hero, verre dépoli + hairline
 * — Nav centrée, uppercase (optionnelle), soulignement fin sur l'onglet actif
 * — Réduction de hauteur au scroll
 * — Overlay mobile plein écran
 * — Conserve la logique d'auth Supabase (login/logout)
 *
 * ⚙️ Dépend uniquement de CSS inline + <style jsx global>, pas de Tailwind.
 * ✅ Drop-in replacement de votre MinimalistHeader existant.
 */
export default function MinimalistHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [elevated, setElevated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // --- AUTH ---
  useEffect(() => {
    let unsub = null;
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    unsub = data?.subscription;

    const onScroll = () => setElevated(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      unsub?.unsubscribe?.();
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

  const headerHeight = elevated ? 60 : 80;

  return (
    <>
      <header
        role="banner"
        style={{
          position: 'fixed',
          inset: '0 auto auto 0',
          right: 0,
          height: headerHeight,
          zIndex: 1000,
          transition: 'height .25s ease, background .25s ease, box-shadow .25s ease, border-color .25s ease',
          background: elevated ? 'rgba(253, 252, 248, 0.92)' : 'rgba(253, 252, 248, 0.08)',
          WebkitBackdropFilter: 'blur(18px)',
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${elevated ? 'rgba(45,80,22,.12)' : 'rgba(45,80,22,.08)'}`,
          boxShadow: elevated ? '0 6px 24px rgba(0,0,0,.06)' : 'none',
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
          gap: '1rem',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '.75rem', textDecoration: 'none' }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--forest-500), var(--forest-700))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.35)',
              }}>
                <span aria-hidden>🍄</span>
              </div>
              <span style={{ fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-.2px', color: 'var(--forest-800)', fontFamily: 'Inter, system-ui, sans-serif' }}>Myko</span>
            </Link>
          </div>

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
            {user ? (
              <>
                <span className="myko-desktop-only" style={{ fontSize: '.92rem', color: 'var(--forest-700)', opacity: .85 }}>
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="myko-ghost-btn myko-desktop-only"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link href="/login" className="myko-cta">
                Se connecter
              </Link>
            )}

            {/* Burger */}
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

      {/* Overlay mobile plein écran */}
      {mobileOpen && (
        <div
          id="myko-mobile-menu"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(253,252,248,.96)',
            WebkitBackdropFilter: 'blur(18px)',
            backdropFilter: 'blur(18px)',
            animation: 'myko-fade-in .25s ease',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            role="menu"
            aria-label="Menu mobile"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 640,
              margin: '100px auto 0 auto',
              padding: '1rem 1.25rem',
              display: 'grid',
              gap: '0.5rem',
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`myko-mobile-link${pathname === item.href ? ' is-active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <div style={{ height: 8 }} />
            {user ? (
              <button onClick={handleLogout} className="myko-mobile-logout">Déconnexion</button>
            ) : (
              <Link href="/login" className="myko-mobile-login" onClick={() => setMobileOpen(false)}>
                Se connecter
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Spacer pour compenser le header fixed */}
      <div style={{ height: headerHeight }} />

      {/* Styles globaux dédiés au header */}
      <style jsx global>{`
        .myko-center-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
        }
        .myko-nav-link {
          position: relative;
          text-decoration: none;
          font-size: 0.93rem;
          font-weight: 600;
          letter-spacing: .02em;
          color: var(--forest-700);
          opacity: .78;
          transition: opacity .2s ease, color .2s ease;
        }
        .myko-nav-link:hover { opacity: 1; }
        .myko-nav-link.is-active { opacity: 1; color: var(--forest-800); }
        .myko-nav-link::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: -6px;
          height: 1px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .25s ease;
        }
        .myko-nav-link.is-active::after { transform: scaleX(1); }

        .myko-cta {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          text-decoration: none;
          padding: .55rem 1.1rem;
          border-radius: 999px;
          background: var(--forest-700);
          color: #fff;
          font-weight: 600;
          font-size: .92rem;
          transition: transform .15s ease, background .2s ease;
        }
        .myko-cta:hover { transform: translateY(-1px); background: var(--forest-800); }

        .myko-ghost-btn {
          background: transparent;
          border: 1px solid var(--forest-400);
          color: var(--forest-700);
          padding: .5rem 1rem;
          border-radius: 999px;
          font-size: .9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background .2s ease, color .2s ease, border-color .2s ease;
        }
        .myko-ghost-btn:hover { background: var(--forest-600); color: #fff; border-color: var(--forest-600); }

        .myko-burger {
          display: none;
          background: transparent;
          border: none;
          padding: .5rem;
          cursor: pointer;
          color: var(--forest-900);
        }

        .myko-mobile-link {
          display: block;
          padding: .9rem 1rem;
          border-radius: 12px;
          text-decoration: none;
          font-size: 1.05rem;
          color: var(--forest-700);
          background: transparent;
          transition: background .2s ease, color .2s ease;
        }
        .myko-mobile-link:hover { background: rgba(45,80,22,.06); }
        .myko-mobile-link.is-active { background: rgba(45,80,22,.08); color: var(--forest-900); }

        .myko-mobile-login, .myko-mobile-logout {
          display: inline-flex; align-items: center; justify-content: center;
          text-decoration: none; cursor: pointer;
          width: 100%; padding: .9rem 1rem; border-radius: 999px;
          font-weight: 600; font-size: 1rem;
        }
        .myko-mobile-login { background: var(--forest-700); color: #fff; }
        .myko-mobile-login:hover { background: var(--forest-800); }
        .myko-mobile-logout { background: transparent; color: var(--forest-700); border: 1px solid var(--forest-400); }
        .myko-mobile-logout:hover { background: var(--forest-600); color: #fff; border-color: var(--forest-600); }

        @keyframes myko-fade-in { from { opacity: 0 } to { opacity: 1 } }

        /* Responsive */
        @media (max-width: 1024px) {
          .myko-center-nav { display: none; }
          .myko-desktop-only { display: none; }
          .myko-burger { display: inline-flex; }
        }
      `}</style>
    </>
  );
}

/**
 * 📌 Notes d'intégration
 * 1) Le composant est un drop-in : il suffit de garder <MinimalistHeader /> dans app/layout.js
 * 2) La hauteur du header est automatiquement compensée par un spacer. Si vous avez déjà un spacer, supprimez-le.
 * 3) Les variables CSS utilisées (existant chez vous) :
 *    --forest-50/400/500/600/700/800/900, --mushroom
 * 4) Pour une barre plus marquée au scroll, augmentez l'opacité de borderBottom lorsque elevated = true.
 * 5) Pour forcer un header toujours 100% transparent (au-dessus d'un hero), remplacez background par 'transparent' et supprimez le borderBottom à l'état non scrollé.
 */
