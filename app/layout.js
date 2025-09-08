// app/layout.js
import './globals.css';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';

export const metadata = {
  title: 'Myko',
  description: 'Site perso mono-utilisateur',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <header className="p-4 flex justify-between items-center border-b">
          <nav style={{display:'flex', gap:12}}>
            <Link href="/">Accueil</Link>
            <Link href="/pantry">Garde-manger</Link>
            <Link href="/recipes">Recettes</Link>
            <Link href="/garden">Potager</Link>
            <Link href="/settings">Paramètres</Link>
          </nav>
          <SignOutButton />
        </header>
        <main className="container p-4">{children}</main>
      </body>
    </html>
  );
}
