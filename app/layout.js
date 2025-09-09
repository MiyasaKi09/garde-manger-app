// app/layout.js (Server Component)
import './globals.css';
import Link from 'next/link';
import { Suspense } from 'react';
import HeaderAuth from '@/components/HeaderAuth';
import NavLink from '@/components/NavLink';

// — Runtime / cache controls
export const dynamic = 'force-dynamic';
export const revalidate = false;
export const fetchCache = 'force-no-store';

// — Metadata
export const metadata = {
  title: 'Myko — Réseau mycorhizien',
  description: 'Cultivez les connexions entre cuisine, garde-manger et potager',
  metadataBase: new URL('https://myko.app'), // ajuste si besoin
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F6F2' },
    { media: '(prefers-color-scheme: dark)', color: '#0C0F0C' },
  ],
  openGraph: {
    title: 'Myko — Réseau mycorhizien',
    description:
      'Évitez le gaspillage en connectant garde-manger, recettes et potager.',
    type: 'website',
    url: 'https://myko.app',
    siteName: 'Myko',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="mk-html">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="mk-body">
        {/* Canvas mycélien (fond organique) */}
        <div aria-hidden="true" className="mycelium-bg mk-mycelium-bg" />

        {/* Header */}
        <header className="myko-header mk-header" role="banner" data-elevation="1">
          <div className="header-container mk-container">
            <div className="logo-group mk-logo">
              <Link href="/" className="logo mk-logo-link" aria-label="Accueil Myko">
                <div className="myko-icon mk-icon" aria-hidden="true">
                  <span className="spore mk-spore"></span>
                  <span className="spore mk-spore"></span>
                  <span className="spore mk-spore"></span>
                  <span className="mycelium mk-mycelium-line"></span>
                </div>
                <span className="logo-text mk-wordmark">Myko</span>
              </Link>

              <nav className="main-nav mk-nav" aria-label="Navigation principale">
                <NavLink href="/" icon="🏠">Accueil</NavLink>
                <NavLink href="/pantry" icon="🏺">Garde-manger</NavLink>
                <NavLink href="/recipes" icon="📖">Recettes</NavLink>
                <NavLink href="/garden" icon="🌱">Potager</NavLink>
                <NavLink href="/planning" icon="📅">Planning</NavLink>
                <NavLink href="/settings" icon="⚙️">Paramètres</NavLink>
              </nav>
            </div>

            <div className="header-actions mk-actions">
              <div
                className="season-indicator mk-season"
                title="Saison en cours"
                aria-label="Saison actuelle : Automne"
              >
                <span className="season-icon mk-season-ico" aria-hidden="true">🍂</span>
                <span className="season-text mk-season-text">Automne</span>
              </div>

              {/* Client component (session / avatar / CTA) */}
              <HeaderAuth />
            </div>
          </div>
        </header>

        {/* Main */}
        <main id="main-content" className="main-container mk-main" role="main">
          <Suspense
            fallback={
              <div className="loading-container mk-loading" role="status" aria-live="polite">
                <div className="loading-mycelium mk-loading-orb" aria-hidden="true">
                  <span></span><span></span><span></span>
                </div>
                <p className="mk-loading-text">Connexion au réseau mycorhizien…</p>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>

        {/* Footer — discret, poétique */}
        <footer className="mk-footer" role="contentinfo">
          <div className="mk-container mk-footer-inner">
            <p className="mk-footline">
              <span className="mk-footmark">Myko</span>
              <span className="mk-footsep">•</span>
              <span className="mk-footmotto">
                « Ne laisse rien mourir en silence. Donne une seconde vie à chaque aliment. »
              </span>
            </p>
            <nav aria-label="Liens de bas de page" className="mk-footer-nav">
              <Link href="/about" className="mk-footer-link">À propos</Link>
              <Link href="/privacy" className="mk-footer-link">Confidentialité</Link>
              <Link href="/terms" className="mk-footer-link">Conditions</Link>
            </nav>
          </div>
        </footer>

        {/* Skip link pour accessibilité clavier */}
        <a href="#main-content" className="mk-skip">Aller au contenu</a>
      </body>
    </html>
  );
}
