// app/layout.js
import './globals.css';
import { Suspense } from 'react';
import MinimalistHeader from '@/components/MinimalistHeader';

export const metadata = {
  title: 'Myko — Réseau mycorhizien',
  description: 'Cultivez les connexions entre cuisine, garde-manger et potager',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MinimalistHeader />

      <body style={{ background: '#0a0e0a' }}>
        <MinimalistHeader />
        <MatisseBackgroundStrong />
        <main style={{ position:'relative', zIndex:1 }}>{children}</main>
      </body>
      
                  
        {/* Pattern de fond organique subtil */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.02,
            zIndex: 0,
            background: `
              radial-gradient(circle at 20% 30%, var(--forest-400) 1px, transparent 1px),
              radial-gradient(circle at 60% 70%, var(--earth-400) 1px, transparent 1px),
              radial-gradient(circle at 80% 20%, var(--mushroom) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px, 150px 150px, 200px 200px',
            animation: 'drift 120s linear infinite',
          }}
        />

        <main 
          className="main-container"
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '2rem',
            minHeight: 'calc(100vh - 150px)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Suspense
            fallback={
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '300px',
                  gap: '1rem',
                }}
              >
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p style={{ color: 'var(--forest-600)', fontSize: '0.95rem' }}>
                  Connexion au réseau mycorhizien...
                </p>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  );
}
