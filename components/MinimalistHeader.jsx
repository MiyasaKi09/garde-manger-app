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
