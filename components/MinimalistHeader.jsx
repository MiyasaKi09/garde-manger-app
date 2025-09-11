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
        {/* Navigation desktop - style original */}
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
          className="desktop-nav"
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`myko-nav-link${active ? ' is-active' : ''}`}
                style={{
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: active ? '600' : '500',
                  color: '#fff',
                  opacity: active ? 1 : 0.85,
                  transition: 'opacity .2s ease',
                  padding: '0.5rem 0'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => {
                  if (pathname !== item.href) e.target.style.opacity = '0.85';
                }}
              >
                {item.label}
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
                padding: '.4rem 1rem',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontWeight: '600',
                fontSize: '.9rem',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.25)',
                transition: 'background .2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.35)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
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
                padding: '.4rem 1rem',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontWeight: '600',
                fontSize: '.9rem',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.25)',
                transition: 'background .2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.35)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              Se connecter
            </Link>
          )}
        </div>

        {/* Menu burger mobile - nouveau */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: elevated ? 'rgba(30,30,30,0.35)' : 'rgba(30,30,30,0.25)',
            border: '1px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            color: '#fff',
            fontSize: '1.2rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          className="mobile-menu-btn"
          aria-label="Menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Menu mobile - dropdown */}
      {mobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: headerHeight + 10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            background: 'rgba(30,30,30,0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '16px',
            padding: '1.5rem',
            zIndex: 999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            animation: 'slideDown 0.3s ease'
          }}
          className="mobile-menu"
        >
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  color: pathname === item.href ? '#fff' : 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  fontSize: '1.1rem',
                  fontWeight: pathname === item.href ? '600' : '500',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: pathname === item.href ? 'rgba(255,255,255,0.1)' : 'transparent',
                  transition: 'all 0.3s ease',
                  border: pathname === item.href ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (pathname !== item.href) {
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== item.href) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                {item.label}
              </Link>
            ))}

            {/* Actions utilisateur mobile */}
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              {user ? (
                <>
                  <div style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    {user.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
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
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
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
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(2px)',
            zIndex: 998,
            transition: 'all 0.3s ease'
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
