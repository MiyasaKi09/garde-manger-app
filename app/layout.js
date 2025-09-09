// app/layout.js
import './globals.css';

export const metadata = {
  title: 'Myko',
  description: 'Garde-manger, recettes et potager',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <header style={{
          position: 'sticky',
          top: 0,
          background: '#fff',
          borderBottom: '1px solid #eee',
          zIndex: 10,
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <a href="/" style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold',
              textDecoration: 'none',
              color: '#2d5016'
            }}>
              🍄 Myko
            </a>
            <nav style={{ display: 'flex', gap: '1rem' }}>
              <a href="/pantry" style={{ textDecoration: 'none', color: '#333' }}>Garde-manger</a>
              <a href="/recipes" style={{ textDecoration: 'none', color: '#333' }}>Recettes</a>
              <a href="/garden" style={{ textDecoration: 'none', color: '#333' }}>Potager</a>
            </nav>
          </div>
        </header>

        <main style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
