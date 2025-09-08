// app/layout.jsx
import './globals.css';
import './myko-theme.css';
import Link from 'next/link';
import { Suspense } from 'react';
import { SignOutButton } from '@/components/SignOutButton';

export const dynamic = 'force-dynamic';
export const revalidate = false;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'Myko — Réseau mycorhizien',
  description: 'Cultivez les connexions entre cuisine, garde-manger et potager',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="myko-header">
          <div className="header-container">
            <div className="logo-group">
              <Link href="/" className="logo">
                <div className="myko-icon">
                  <span className="spore"></span>
                  <span className="spore"></span>
                  <span className="spore"></span>
                  <span className="mycelium"></span>
                </div>
                <span className="logo-text">Myko</span>
              </Link>

              <nav className="main-nav">
                <Link href="/" className="nav-link"><span className="nav-icon">🏠</span><span>Accueil</span></Link>
                <Link href="/pantry" className="nav-link"><span className="nav-icon">🏺</span><span>Garde-manger</span></Link>
                <Link href="/recipes" className="nav-link"><span className="nav-icon">📖</span><span>Recettes</span></Link>
                <Link href="/garden" className="nav-link"><span className="nav-icon">🌱</span><span>Potager</span></Link>
                <Link href="/planning" className="nav-link"><span className="nav-icon">📅</span><span>Planning</span></Link>
                <Link href="/settings" className="nav-link"><span className="nav-icon">⚙️</span><span>Paramètres</span></Link>
              </nav>
            </div>

            <div className="header-actions">
              <div className="season-indicator">
                <span className="season-icon">🍂</span>
                <span className="season-text">Automne</span>
              </div>
              <Suspense fallback={<div style={{ opacity: 0.7 }}>…</div>}>
                <SignOutButton />
              </Suspense>
            </div>
          </div>
        </header>

        <div className="mycelium-bg" />

        <main className="main-container">
          {/* IMPORTANT: pas de Suspense global ici */}
          {children}
        </main>
      </body>
    </html>
  );
}
