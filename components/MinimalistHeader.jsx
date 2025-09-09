'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function MinimalistHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Gestion de l'auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Effet de scroll
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/pantry', label: 'Garde-manger' },
    { href: '/recipes', label: 'Recettes' },
    { href: '/garden', label: 'Potager' },
    { href: '/planning', label: 'Planning' },
    { href: '/shopping', label: 'Courses' },
  ];

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: scrolled ? '60px' : '80px',
        background: scrolled 
          ? 'rgba(253, 252, 248, 0.95)' 
          : 'rgba(253, 252, 248, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(45, 80, 22, 0.08)',
        zIndex: 1000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          height: '100%',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo minimaliste */}
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            transition: 'opacity 0.3s ease',
            opacity: 1,
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--forest-500), var(--forest-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'transform 0.3s ease',
            }}>
              <span style={{ 
                fontSize: '1.2rem',
                filter: 'grayscale(0.3)',
              }}>🍄</span>
            </div>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: '500',
              color: 'var(--forest-700)',
              letterSpacing: '-0.5px',
              fontFamily: "'Inter', sans-serif",
            }}>
              Myko
            </span>
          </Link>

          {/* Navigation centrale - Desktop */}
          <nav style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '2.5rem',
          }}
          className="desktop-nav"
          >
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: pathname === item.href ? 'var(--forest-700)' : 'var(--forest-600)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: pathname === item.href ? '500' : '400',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  opacity: pathname === item.href ? 1 : 0.7,
                }}
                onMouseEnter={(e) => {
                  if (pathname !== item.href) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== item.href) {
                    e.currentTarget.style.opacity = '0.7';
                  }
                }}
              >
                {item.label}
                {pathname === item.href && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'var(--forest-500)',
                    borderRadius: '1px',
                  }} />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions à droite */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
          }}>
            {user ? (
              <>
                <span style={{
                  fontSize: '0.9rem',
                  color: 'var(--forest-600)',
                  opacity: 0.8,
                }}
                className="desktop-only"
                >
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--forest-400)',
                    color: 'var(--forest-600)',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '24px',
                    fontSize: '0.9rem',
                    fontWeight: '450',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--forest-500)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = 'var(--forest-500)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--forest-600)';
                    e.currentTarget.style.borderColor = 'var(--forest-400)';
                  }}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                style={{
                  background: 'var(--forest-600)',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '24px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  display: 'inline-block',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--forest-700)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--forest-600)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Se connecter
              </Link>
            )}

            {/* Menu mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-only"
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                padding: '0.5rem',
                cursor: 'pointer',
                color: 'var(--forest-700)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
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

      {/* Menu mobile overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(253, 252, 248, 0.98)',
          backdropFilter: 'blur(20px)',
          zIndex: 999,
          padding: '2rem',
          animation: 'slideDown 0.3s ease',
        }}>
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  color: pathname === item.href ? 'var(--forest-700)' : 'var(--forest-600)',
                  textDecoration: 'none',
                  fontSize: '1.1rem',
                  fontWeight: pathname === item.href ? '500' : '400',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: pathname === item.href ? 'var(--forest-50)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Spacer pour compenser le header fixed */}
      <div style={{ height: '80px' }} />

      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: block !important;
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
