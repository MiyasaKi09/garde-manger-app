'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const navItems = [
    { href: '/', label: 'Accueil', icon: '🏠', color: 'var(--forest-500)' },
    { href: '/pantry', label: 'Garde-manger', icon: '🏺', color: 'var(--earth-600)' },
    { href: '/recipes', label: 'Recettes', icon: '📖', color: 'var(--autumn-orange)' },
    { href: '/garden', label: 'Potager', icon: '🌱', color: 'var(--forest-400)' },
    { href: '/planning', label: 'Planning', icon: '📅', color: 'var(--mushroom)' },
    { href: '/shopping', label: 'Courses', icon: '🛒', color: 'var(--autumn-gold)' },
  ];

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      background: 'rgba(255, 254, 249, 0.98)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(139, 149, 109, 0.2)',
      boxShadow: '0 2px 20px rgba(45, 80, 22, 0.08)',
      zIndex: 100,
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.75rem 1rem',
      }}>
        
        {/* Ligne principale - Logo, Navigation, Auth */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          
          {/* Logo - NOUVEAU : Lien vers accueil */}
          <Link 
            href="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              color: 'var(--forest-700)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(58, 107, 30, 0.05)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Icône animée */}
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, var(--forest-500), var(--forest-400))',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(58, 107, 30, 0.2)',
              transition: 'all 0.3s ease'
            }}>
              <span style={{ fontSize: '18px' }}>🌿</span>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              lineHeight: '1.2'
            }}>
              <div style={{
                fontFamily: 'Crimson Text, serif',
                fontSize: '1.4rem',
                fontWeight: '600',
                color: 'var(--forest-700)',
                letterSpacing: '-0.01em'
              }}>
                Myko
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--earth-600)',
                fontWeight: '400',
                marginTop: '-2px'
              }}>
                Écosystème
              </div>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <nav style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center'
          }}
          className="desktop-nav"
          >
            {navItems.slice(1).map(item => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                color={item.color}
                isActive={pathname === item.href}
              />
            ))}
          </nav>

          {/* Actions utilisateur */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {loading ? (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--soft-gray)',
                animation: 'pulse 2s infinite'
              }} />
            ) : user ? (
              <>
                {/* Avatar utilisateur */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--forest-400), var(--earth-500))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                title={user.email}
                >
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--soft-gray)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--forest-600)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--forest-50)';
                    e.target.style.borderColor = 'var(--forest-300)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.borderColor = 'var(--soft-gray)';
                  }}
                  className="desktop-only"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'linear-gradient(135deg, var(--forest-500), var(--forest-400))',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(58, 107, 30, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(58, 107, 30, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(58, 107, 30, 0.2)';
                }}
              >
                Se connecter
              </Link>
            )}

            {/* Bouton menu mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                width: '40px',
                height: '40px',
                background: 'transparent',
                border: '1px solid var(--soft-gray)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: 'var(--forest-600)',
                transition: 'all 0.3s ease'
              }}
              className="mobile-menu-btn"
              aria-label="Menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(255, 254, 249, 0.98)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(139, 149, 109, 0.2)',
              borderTop: 'none',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              boxShadow: '0 8px 32px rgba(45, 80, 22, 0.15)',
              padding: '1rem',
              zIndex: 1000
            }}
            className="mobile-menu"
          >
            <nav style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    textDecoration: 'none',
                    color: pathname === item.href ? 'white' : 'var(--forest-700)',
                    background: pathname === item.href 
                      ? `linear-gradient(135deg, ${item.color}dd, ${item.color})` 
                      : 'transparent',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.3s ease',
                    fontSize: '1rem',
                    fontWeight: pathname === item.href ? '600' : '450'
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== item.href) {
                      e.target.style.background = `linear-gradient(135deg, ${item.color}15, ${item.color}08)`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== item.href) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Actions utilisateur mobile */}
              {user ? (
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--soft-gray)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                    padding: '0.5rem'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--forest-400), var(--earth-500))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: 'var(--forest-600)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user.email}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'var(--forest-50)',
                      border: '1px solid var(--forest-300)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--forest-700)',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🚪 Déconnexion
                  </button>
                </div>
              ) : (
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--soft-gray)'
                }}>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, var(--forest-500), var(--forest-400))',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(58, 107, 30, 0.2)'
                    }}
                  >
                    🔑 Se connecter
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Styles CSS intégrés pour la responsivité */}
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          
          .mobile-menu-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          
          .desktop-only {
            display: none !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-menu {
            display: none !important;
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </header>
  );
}

// Composant NavLink pour la navigation desktop
function NavLink({ href, icon, label, color, isActive }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 1rem',
        textDecoration: 'none',
        color: isActive ? 'white' : 'var(--forest-700)',
        background: isActive 
          ? `linear-gradient(135deg, ${color}dd, ${color})` 
          : isHovered 
            ? `linear-gradient(135deg, ${color}15, ${color}08)`
            : 'transparent',
        borderRadius: '24px',
        transition: 'all 0.3s ease',
        fontSize: '0.95rem',
        fontWeight: isActive ? '600' : '450',
        position: 'relative',
        overflow: 'hidden',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered || isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
        border: `1px solid ${isActive ? color : 'transparent'}`,
      }}
    >
      <span style={{
        fontSize: '1.1rem',
        transform: isHovered ? 'scale(1.15) rotate(5deg)' : 'scale(1)',
        transition: 'transform 0.3s ease',
      }}>
        {icon}
      </span>
      <span>{label}</span>
      
      {isActive && (
        <div style={{
          position: 'absolute',
          bottom: '3px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '24px',
          height: '2px',
          background: 'white',
          borderRadius: '1px',
          opacity: 0.8,
        }} />
      )}
    </Link>
  );
}
