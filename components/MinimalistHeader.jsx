'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function MinimalistHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [elevated, setElevated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
    router.push('/');
  };

  const navItems = useMemo(() => ([
    { href: '/', label: 'Accueil' },
    { href: '/pantry', label: 'Stock' },
    { href: '/recipes', label: 'Recettes' },
    { href: '/planning', label: 'Planning' },
    { href: '/courses', label: 'Courses' },
    { href: '/nutrition', label: 'Nutrition' },
  ]), []);

  const headerHeight = elevated ? 64 : 80;

  // Wordmark éditorial réutilisable (Fraunces + point terracotta)
  const Wordmark = ({ size = '1.4rem' }) => (
    <Link
      href="/"
      aria-label="Myko — accueil"
      style={{
        textDecoration: 'none',
        fontFamily: 'var(--font-display)',
        fontOpticalSizing: 'auto',
        fontSize: size,
        fontWeight: 700,
        color: 'var(--brand-strong)',
        letterSpacing: '-0.03em',
      }}
    >
      myko<span style={{ color: 'var(--terracotta)' }}>.</span>
    </Link>
  );

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
          transition: 'height .25s ease',
          background: 'transparent',
        }}
      >
        {/* Navigation desktop — pilule papier givré éditoriale */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.75rem',
            padding: '.6rem 1.4rem',
            borderRadius: '999px',
            background: elevated ? 'rgba(255,253,247,0.92)' : 'rgba(255,253,247,0.8)',
            border: '1px solid var(--line)',
            backdropFilter: 'blur(14px) saturate(120%)',
            WebkitBackdropFilter: 'blur(14px) saturate(120%)',
            boxShadow: elevated ? 'var(--sh-2)' : 'var(--sh-1)',
            transition: 'background .25s ease, box-shadow .25s ease',
          }}
          className="desktop-nav"
        >
          <span style={{ marginRight: '0.4rem' }}><Wordmark /></span>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`myko-nav-link${active ? ' is-active' : ''}`}
                style={{
                  position: 'relative',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--brand)' : 'var(--ink-2)',
                  transition: 'color .2s ease',
                  padding: '0.5rem 0',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--brand-strong)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--ink-2)'; }}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 2,
                      height: 2,
                      borderRadius: 2,
                      background: 'var(--accent)',
                    }}
                  />
                )}
              </Link>
            );
          })}

          {user ? (
            <button
              onClick={handleLogout}
              className="myko-solid-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '.45rem 1.1rem',
                borderRadius: '999px',
                background: 'var(--brand)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '.9rem',
                textDecoration: 'none',
                border: '1px solid var(--brand)',
                transition: 'background .2s ease, transform .2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-strong)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--brand)'; }}
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="myko-solid-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '.45rem 1.1rem',
                borderRadius: '999px',
                background: 'var(--brand)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '.9rem',
                textDecoration: 'none',
                border: '1px solid var(--brand)',
                transition: 'background .2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-strong)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--brand)'; }}
            >
              Se connecter
            </Link>
          )}
        </div>

        {/* Logo mobile */}
        <span className="mobile-logo" style={{ display: 'none' }}><Wordmark size="1.5rem" /></span>

        {/* Menu burger mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255,253,247,0.9)',
            border: '1px solid var(--line)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            color: 'var(--ink-1)',
            fontSize: '1.2rem',
            cursor: 'pointer',
            boxShadow: 'var(--sh-1)',
            transition: 'all 0.3s ease',
          }}
          className="mobile-menu-btn"
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Menu mobile — dropdown papier */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: headerHeight + 10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            background: 'rgba(255,253,247,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-card)',
            padding: '1.25rem',
            zIndex: 999,
            boxShadow: 'var(--sh-3)',
            animation: 'slideDown 0.3s ease',
          }}
          className="mobile-menu"
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    color: active ? 'var(--brand)' : 'var(--ink-1)',
                    textDecoration: 'none',
                    fontSize: '1.05rem',
                    fontWeight: active ? 600 : 500,
                    padding: '0.7rem 0.9rem',
                    borderRadius: 'var(--r-sm)',
                    background: active ? 'var(--brand-soft)' : 'transparent',
                    transition: 'background 0.2s ease',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Actions utilisateur mobile */}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--line)' }}>
              {user ? (
                <>
                  <div style={{ color: 'var(--ink-3)', fontSize: '0.85rem', marginBottom: '0.75rem', textAlign: 'center' }}>
                    {user.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--brand)',
                      border: '1px solid var(--brand)',
                      borderRadius: 'var(--r-sm)',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--brand)',
                    border: '1px solid var(--brand)',
                    borderRadius: 'var(--r-sm)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  Se connecter
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Overlay pour fermer le menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(24,28,22,0.25)',
            backdropFilter: 'blur(2px)',
            zIndex: 998,
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Spacer dynamique */}
      <div style={{ height: headerHeight }} />

      {/* Styles CSS */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }

          .mobile-logo {
            display: block !important;
          }

          .mobile-menu-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
