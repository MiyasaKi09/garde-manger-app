'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ChefHat, CalendarDays, ShoppingBasket, Salad } from 'lucide-react';

/**
 * Barre d'onglets fixée en bas — navigation primaire sur téléphone/tablette
 * (≤ 860px). Remplace la nav du header sur mobile (le header garde marque +
 * déconnexion). Respecte l'aire sûre iOS (env(safe-area-inset-bottom)) et offre
 * des cibles tactiles pleine hauteur. Masquée sur desktop (la nav du header prend
 * le relais). Cachée sur les pages d'auth (login / reset).
 */
const TABS = [
  { href: '/', label: 'Accueil', Icon: Home },
  { href: '/pantry', label: 'Stock', Icon: Package },
  { href: '/recipes', label: 'Recettes', Icon: ChefHat },
  { href: '/planning', label: 'Planning', Icon: CalendarDays },
  { href: '/courses', label: 'Courses', Icon: ShoppingBasket },
  { href: '/nutrition', label: 'Nutrition', Icon: Salad },
];

export default function MobileTabBar() {
  const pathname = usePathname() || '/';
  const isOn = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  // Pas de barre sur les écrans d'authentification.
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) return null;

  return (
    <nav className="myko-tabbar" role="navigation" aria-label="Navigation principale">
      {TABS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`myko-tab${isOn(href) ? ' on' : ''}`}
          aria-current={isOn(href) ? 'page' : undefined}
        >
          <Icon size={22} strokeWidth={2} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}

      <style jsx global>{`
        .myko-tabbar { display: none; }
        @media (max-width: 860px) {
          .myko-tabbar {
            position: fixed; left: 0; right: 0; bottom: 0; z-index: 1000;
            display: flex; align-items: stretch;
            background: rgba(242, 238, 227, 0.94);
            backdrop-filter: saturate(140%) blur(12px);
            -webkit-backdrop-filter: saturate(140%) blur(12px);
            border-top: 1.5px solid var(--ink-1);
            padding-bottom: env(safe-area-inset-bottom);
          }
          .myko-tab {
            flex: 1 1 0; min-width: 0;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 3px; padding: 8px 2px; min-height: 56px;
            text-decoration: none; color: var(--ink-3);
            font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.02em;
            text-transform: uppercase; -webkit-tap-highlight-color: transparent;
            transition: color 0.15s ease;
          }
          .myko-tab svg { stroke: currentColor; }
          .myko-tab.on { color: var(--terracotta); }
          .myko-tab.on span { font-weight: 600; }
          .myko-tab:active { background: var(--surface-soft); }
        }
      `}</style>
    </nav>
  );
}
