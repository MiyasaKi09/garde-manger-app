// app/layout.js
import './globals.css';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';

export const metadata = {
  title: 'Garde-Manger & Potager',
  description: 'Site perso mono-utilisateur',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <header
          style={{
            position: 'sticky',
            top: 0,
            background: '#fff',
            borderBottom: '1px solid #eee',
            zIndex: 10,
          }}
        >
          <div className="container" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>🌱 Myko</strong>
              <nav style={{ marginLeft: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/">Accueil</Link>
                <Link href="/pantry">Garde-manger</Link>
                <Link href="/recipes">Recettes</Link>
                <Link href="/garden">Potager</Link>
                <Link href="/planning">Planning</Link>
                <Link href="/settings">Paramètres</Link>
              </nav>
            </div>
            {/* Bouton déconnexion (client component) */}
            <SignOutButton />
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
