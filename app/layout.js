// app/layout.jsx
import './globals.css';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = false;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'Myko',
  description: 'Garde-manger, recettes & potager - Site perso mono-utilisateur',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <header style={{position:'sticky',top:0,background:'#fff',borderBottom:'1px solid #eee',zIndex:10}}>
          <div className="container" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap', padding:'10px 16px'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <strong>🌱 Myko</strong>
              <nav style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <Link href="/">Accueil</Link>
                <Link href="/pantry">Garde-manger</Link>
                <Link href="/recipes">Recettes</Link>
                <Link href="/garden">Potager</Link>
                <Link href="/planning">Planning</Link>
                <Link href="/settings">Paramètres</Link>
              </nav>
            </div>
            <SignOutButton />
          </div>
        </header>
        
        <main className="container" style={{padding:'16px'}}>
          {/* Empêche les "blank screen" sur erreurs d'hydratation/useSearchParams */}
          <Suspense fallback={<div>Chargement…</div>}>
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  );
}
