'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function MinimalistHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [elevated, setElevated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const plusRef = useRef(null);

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

  // Fermer le dropdown Plus au clic extérieur
  useEffect(() => {
    if (!plusOpen) return;
    const handleClickOutside = (e) => {
      if (plusRef.current && !plusRef.current.contains(e.target)) {
        setPlusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [plusOpen]);

  // Fermer le dropdown Plus à la touche Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPlusOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setMobileMenuOpen(false);
    router.push('/');
  };

  const primaryNavItems = [
    { href: '/', label: "Aujourd'hui" },
    { href: '/courses', label: 'Courses' },
    { href: '/recipes', label: 'Cuisiner' },
    { href: '/pantry', label: 'Stock' },
  ];

  const plusItems = [
    { href: '/planning', label: 'Planning' },
    { href: '/nutrition', label: 'Nutrition' },
    { href: '/garden', label: 'Potager' },
    { href: '/settings', label: 'Paramètres' },
  ];

  // Actif sur les sous-pages (ex. /recipes/123 → Cuisiner actif)
  const isOn = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  // Plus est actif si on est dans l'une de ses destinations
  const isPlusActive = plusItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <header role="banner" className={`myko-hd${elevated ? ' is-elevated' : ''}`}>
        <Link href="/" aria-label="Myko — accueil" className="myko-hd-brand">myko<span>.</span></Link>

        <nav className="myko-hd-nav" aria-label="Navigation principale">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`myko-hd-link${isOn(item.href) ? ' on' : ''}`}
            >
              {item.label}
            </Link>
          ))}

          {/* Dropdown Plus — desktop */}
          <div className="myko-hd-plus" ref={plusRef}>
            <button
              className={`myko-hd-link myko-hd-plus-btn${isPlusActive ? ' on' : ''}`}
              aria-expanded={plusOpen}
              aria-haspopup="menu"
              onClick={() => setPlusOpen((v) => !v)}
            >
              Plus<span className="myko-hd-plus-caret" aria-hidden="true">▾</span>
            </button>
            {plusOpen && (
              <div className="myko-hd-plus-dropdown" role="menu">
                {plusItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    className={`myko-hd-plus-item${isOn(item.href) ? ' on' : ''}`}
                    onClick={() => setPlusOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
          <span aria-hidden="true">{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>
      </header>

      {mobileMenuOpen && (
        <>
          <div className="myko-hd-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="myko-hd-sheet">
            <nav aria-label="Menu mobile">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`myko-hd-mlink${isOn(item.href) ? ' on' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
              {/* Section Plus — mobile */}
              <div className="myko-hd-msection" aria-hidden="true">Plus</div>
              {plusItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`myko-hd-mlink myko-hd-mlink-sub${isOn(item.href) ? ' on' : ''}`}
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
        .myko-hd-nav{display:flex;gap:4px;flex-wrap:wrap;align-items:center}
        .myko-hd-link{font-family:var(--font-mono);font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-2);text-decoration:none;padding:7px 12px;border-radius:3px;transition:color .15s ease,background .15s ease}
        .myko-hd-link:hover{color:var(--ink-1)}
        .myko-hd-link:focus-visible{outline:2px solid var(--terracotta);outline-offset:2px}
        .myko-hd-link.on{background:var(--terracotta);color:#fff;font-weight:600}
        .myko-hd-cta{margin-left:auto;font-family:var(--font-mono);font-size:11.5px;letter-spacing:.04em;color:#fff;background:var(--brand);border:none;border-radius:3px;padding:9px 18px;text-decoration:none;cursor:pointer;transition:background .2s ease;white-space:nowrap}
        .myko-hd-cta:hover{background:var(--brand-strong)}
        .myko-hd-burger{display:none;margin-left:auto;width:44px;height:44px;border-radius:10px;background:var(--surface);border:1px solid var(--line);color:var(--ink-1);font-size:1.1rem;cursor:pointer;box-shadow:var(--sh-1)}
        .myko-hd-spacer{height:66px}
        .myko-hd-overlay{position:fixed;inset:0;background:rgba(24,28,22,.28);backdrop-filter:blur(2px);z-index:998}
        .myko-hd-sheet{position:fixed;top:74px;left:50%;transform:translateX(-50%);width:92%;max-width:420px;background:rgba(252,248,238,.98);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--line);border-radius:var(--r-card);box-shadow:var(--sh-3);padding:14px;z-index:999;animation:mykoSlideDown .25s ease}
        .myko-hd-sheet nav{display:flex;flex-direction:column;gap:4px}
        .myko-hd-mlink{font-family:var(--font-mono);font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-1);text-decoration:none;padding:11px 12px;border-radius:4px;display:block}
        .myko-hd-mlink:focus-visible{outline:2px solid var(--terracotta);outline-offset:2px}
        .myko-hd-mlink.on{background:var(--terracotta);color:#fff;font-weight:600}
        .myko-hd-msection{font-family:var(--font-mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);padding:10px 12px 4px;margin-top:4px;border-top:1px solid var(--line)}
        .myko-hd-mlink-sub{padding-left:22px}
        .myko-hd-mfoot{margin-top:10px;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:10px;align-items:center}
        .myko-hd-mfoot span{font-family:var(--font-mono);font-size:11px;color:var(--ink-3)}
        .myko-hd-cta.full{margin:0;width:100%;text-align:center;border-radius:3px;padding:12px}
        /* Plus dropdown — desktop */
        .myko-hd-plus{position:relative}
        .myko-hd-plus-btn{background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:0}
        .myko-hd-plus-caret{font-size:8px;margin-left:4px;line-height:1;vertical-align:middle;opacity:.7;transition:transform .18s ease}
        .myko-hd-plus-btn[aria-expanded="true"] .myko-hd-plus-caret{transform:rotate(180deg)}
        .myko-hd-plus-dropdown{position:absolute;top:calc(100% + 8px);left:0;min-width:164px;background:rgba(252,248,238,.98);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--line);border-radius:var(--r-card);box-shadow:var(--sh-3);padding:6px;z-index:1001;animation:mykoDropDown .18s ease;display:flex;flex-direction:column;gap:2px}
        .myko-hd-plus-item{font-family:var(--font-mono);font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-1);text-decoration:none;padding:9px 14px;border-radius:3px;transition:background .12s ease,color .12s ease;white-space:nowrap;display:block}
        .myko-hd-plus-item:hover{background:var(--ink-1);color:#fff}
        .myko-hd-plus-item:focus-visible{outline:2px solid var(--terracotta);outline-offset:2px}
        .myko-hd-plus-item.on{background:var(--terracotta);color:#fff;font-weight:600}
        @keyframes mykoSlideDown{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
        @keyframes mykoDropDown{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:820px){.myko-hd-nav,.myko-hd>.myko-hd-cta{display:none}.myko-hd-burger{display:inline-flex;align-items:center;justify-content:center}}
      `}</style>
    </>
  );
}
