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

  // Actif aussi sur les sous-pages (ex. /recipes/123 → onglet Recettes)
  const isOn = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <header role="banner" className={`myko-hd${elevated ? ' is-elevated' : ''}`}>
        <Link href="/" aria-label="Myko — accueil" className="myko-hd-brand">myko<span>.</span></Link>
        <nav className="myko-hd-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`myko-hd-link${isOn(item.href) ? ' on' : ''}`}>{item.label}</Link>
          ))}
        </nav>
        {user ? (
          <button onClick={handleLogout} className="myko-hd-cta">Déconnexion</button>
        ) : (
          <Link href="/login" className="myko-hd-cta">Se connecter</Link>
        )}
        <button
          className="myko-hd-burger"
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {mobileMenuOpen && (
        <>
          <div className="myko-hd-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="myko-hd-sheet">
            <nav>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`myko-hd-mlink${isOn(item.href) ? ' on' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="myko-hd-mfoot">
              {user ? (
                <>
                  <span>{user.email}</span>
                  <button onClick={handleLogout} className="myko-hd-cta full">Déconnexion</button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="myko-hd-cta full">Se connecter</Link>
              )}
            </div>
          </div>
        </>
      )}

      <div className="myko-hd-spacer" />

      <style jsx global>{`
        .myko-hd{position:fixed;top:0;left:0;right:0;z-index:1000;display:flex;align-items:center;gap:8px;height:66px;padding:0 clamp(18px,4vw,42px);background:rgba(242,238,227,0.82);backdrop-filter:saturate(140%) blur(12px);-webkit-backdrop-filter:saturate(140%) blur(12px);border-bottom:1.5px solid var(--ink-1);transition:box-shadow .25s ease}
        .myko-hd.is-elevated{box-shadow:var(--sh-1)}
        .myko-hd-brand{font-family:var(--font-display);font-optical-sizing:auto;font-weight:700;font-size:1.4rem;letter-spacing:-.03em;color:var(--brand-strong);text-decoration:none;margin-right:1.4rem}
        .myko-hd-brand span{color:var(--terracotta)}
        .myko-hd-nav{display:flex;gap:4px;flex-wrap:wrap}
        .myko-hd-link{font-family:var(--font-mono);font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-2);text-decoration:none;padding:7px 12px;border-radius:3px;transition:color .15s ease,background .15s ease}
        .myko-hd-link:hover{color:var(--ink-1)}
        .myko-hd-link.on{background:var(--terracotta);color:#fff;font-weight:600}
        .myko-hd-cta{margin-left:auto;font-family:var(--font-mono);font-size:11.5px;letter-spacing:.04em;color:#fff;background:var(--brand);border:none;border-radius:3px;padding:9px 18px;text-decoration:none;cursor:pointer;transition:background .2s ease;white-space:nowrap}
        .myko-hd-cta:hover{background:var(--brand-strong)}
        .myko-hd-burger{display:none;margin-left:auto;width:44px;height:44px;border-radius:10px;background:var(--surface);border:1px solid var(--line);color:var(--ink-1);font-size:1.1rem;cursor:pointer;box-shadow:var(--sh-1)}
        .myko-hd-spacer{height:66px}
        .myko-hd-overlay{position:fixed;inset:0;background:rgba(24,28,22,.28);backdrop-filter:blur(2px);z-index:998}
        .myko-hd-sheet{position:fixed;top:74px;left:50%;transform:translateX(-50%);width:92%;max-width:420px;background:rgba(252,248,238,.98);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--line);border-radius:var(--r-card);box-shadow:var(--sh-3);padding:14px;z-index:999;animation:mykoSlideDown .25s ease}
        .myko-hd-sheet nav{display:flex;flex-direction:column;gap:4px}
        .myko-hd-mlink{font-family:var(--font-mono);font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-1);text-decoration:none;padding:11px 12px;border-radius:4px}
        .myko-hd-mlink.on{background:var(--terracotta);color:#fff;font-weight:600}
        .myko-hd-mfoot{margin-top:10px;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:10px;align-items:center}
        .myko-hd-mfoot span{font-family:var(--font-mono);font-size:11px;color:var(--ink-3)}
        .myko-hd-cta.full{margin:0;width:100%;text-align:center;border-radius:3px;padding:12px}
        @keyframes mykoSlideDown{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
        @media(max-width:820px){.myko-hd-nav,.myko-hd>.myko-hd-cta{display:none}.myko-hd-burger{display:inline-flex;align-items:center;justify-content:center}}
      `}</style>
    </>
  );
}
