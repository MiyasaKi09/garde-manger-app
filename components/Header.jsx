'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
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

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      background: 'linear-gradient(180deg, rgba(255,254,249,0.98) 0%, rgba(250,248,243,0.95) 100%)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(139, 149, 109, 0.2)',
      boxShadow: '0 2px 20px rgba(45, 80, 22, 0.08)',
      zIndex: 100,
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.75rem 2rem',
      }}>
        {/* Ligne du haut - Logo et Auth */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}>
          {/* Logo */}
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            transition: 'transform 0.3s ease',
          }}>
            <div style={{
              width: '45px',
              height: '45px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, var(--forest-400), var(--forest-500))',
                borderRadius: '50%',
                opacity: 0.1,
                animation: 'pulse 3s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '1.8rem', position: 'relative', zIndex: 1 }}>🍄</span>
              
              {/* Petites spores */}
              <div style={{
                position: 'absolute',
                width: '6px',
                height: '6px',
                background: 'var(--forest-400)',
                borderRadius: '50%',
                top: '5px',
                left: '10px',
                animation: 'float 6s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute',
                width: '4px',
                height: '4px',
                background: 'var(--earth-400)',
                borderRadius: '50%',
                bottom: '8px',
                right: '8px',
                animation: 'float 6s ease-in-out infinite 2s',
              }} />
            </div>
            
            <div>
              <span style={{
                fontSize: '1.75rem',
                fontWeight: '600',
                fontFamily: "'Crimson Text', serif",
                background: 'linear-gradient(135deg, var(--forest-600), var(--forest-500))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '0.5px',
              }}>
                Myko
              </span>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--earth-600)',
                marginTop: '-0.25rem',
                fontStyle: 'italic',
              }}>
                Réseau mycorhizien
              </div>
            </div>
          </Link>

          {/* Section Auth */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            {/* Indicateur de saison */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, rgba(230,126,34,0.1), rgba(212,165,116,0.1))',
              borderRadius: '20px',
              border: '1px solid rgba(230,126,34,0.2)',
              fontSize: '0.9rem',
              color: 'var(--earth-600)',
            }}>
              <span style={{ fontSize: '1.1rem' }}>🍂</span>
              <span style={{ fontWeight: '500' }}>Automne</span>
            </div>

            {/* Auth buttons */}
            {loading ? (
              <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
            ) : user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--forest-50)',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  color: 'var(--forest-700)',
                }}>
                  <span>👤</span>
                  <span style={{ fontWeight: '500' }}>
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn secondary"
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.9rem',
                  }}
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn primary"
                style={{
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.95rem',
                }}
              >
                Se connecter
              </Link>
            )}

            {/* Menu mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
              className="mobile-menu-btn"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Navigation principale */}
        <nav style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
        }}>
          {navItems.map(item => (
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
      </div>

      {/* Barre de progression décorative */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, var(--forest-400), var(--autumn-orange), var(--earth-600), var(--mushroom), var(--autumn-gold))',
        opacity: 0.3,
        animation: 'shimmer 3s linear infinite',
      }} />

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}

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
        fontSize: '1.2rem',
        transform: isHovered ? 'scale(1.2) rotate(10deg)' : 'scale(1)',
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
          width: '30px',
          height: '3px',
          background: 'white',
          borderRadius: '2px',
          opacity: 0.8,
        }} />
      )}
    </Link>
  );
}
