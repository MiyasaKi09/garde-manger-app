// app/layout.js
import './globals.css';
import Link from 'next/link';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = false;
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'Myko — Réseau mycorhizien',
  description: 'Cultivez les connexions entre cuisine, garde-manger et potager',
};

function Navigation() {
  return (
    <header 
      className="myko-header"
      style={{
        position: 'sticky',
        top: 0,
        background: 'linear-gradient(180deg, rgba(255,254,249,0.98) 0%, rgba(250,248,243,0.95) 100%)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(139, 149, 109, 0.2)',
        boxShadow: '0 2px 12px rgba(45, 80, 22, 0.08)',
        zIndex: 100,
        transition: 'all 0.3s ease',
      }}
    >
      <div 
        className="header-container"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '2rem',
        }}
      >
        {/* Logo et navigation principale */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Logo animé */}
          <Link 
            href="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div 
              className="logo-icon"
              style={{
                width: '45px',
                height: '45px',
                position: 'relative',
              }}
            >
              {/* Icône mycorhizienne */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, var(--forest-400), var(--forest-500))',
                  borderRadius: '50%',
                  opacity: 0.1,
                  animation: 'pulse 3s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '1.5rem',
                }}
              >
                🍄
              </div>
              {/* Petites spores flottantes */}
              <div
                style={{
                  position: 'absolute',
                  width: '6px',
                  height: '6px',
                  background: 'var(--forest-400)',
                  borderRadius: '50%',
                  top: '5px',
                  left: '10px',
                  animation: 'float 6s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '4px',
                  height: '4px',
                  background: 'var(--earth-400)',
                  borderRadius: '50%',
                  bottom: '8px',
                  right: '8px',
                  animation: 'float 6s ease-in-out infinite 2s',
                }}
              />
            </div>
            <span 
              style={{
                fontSize: '1.75rem',
                fontWeight: '600',
                fontFamily: "'Crimson Text', serif",
                background: 'linear-gradient(135deg, var(--forest-600), var(--forest-500))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '0.5px',
              }}
            >
              Myko
            </span>
          </Link>

          {/* Navigation principale */}
          <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <NavLink href="/" icon="🏠" label="Accueil" />
            <NavLink href="/pantry" icon="🏺" label="Garde-manger" accent="var(--forest-500)" />
            <NavLink href="/recipes" icon="📖" label="Recettes" accent="var(--autumn-orange)" />
            <NavLink href="/garden" icon="🌱" label="Potager" accent="var(--earth-600)" />
            <NavLink href="/planning" icon="📅" label="Planning" accent="var(--mushroom)" />
            <NavLink href="/settings" icon="⚙️" label="Paramètres" />
          </nav>
        </div>

        {/* Actions utilisateur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Indicateur de saison */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, rgba(230,126,34,0.1), rgba(212,165,116,0.1))',
              borderRadius: '20px',
              border: '1px solid rgba(230,126,34,0.2)',
              fontSize: '0.9rem',
              color: 'var(--earth-600)',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🍂</span>
            <span style={{ fontWeight: '500' }}>Automne</span>
          </div>

          {/* Bouton connexion */}
          <Link
            href="/login"
            className="btn primary"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.95rem',
            }}
          >
            Connexion
          </Link>
        </div>
      </div>

      {/* Barre de progression du réseau (décorative) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, var(--forest-400), var(--autumn-orange), var(--earth-600), var(--mushroom))',
          opacity: 0.3,
          animation: 'shimmer 3s linear infinite',
        }}
      />
    </header>
  );
}

function NavLink({ href, icon, label, accent }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.5rem 0.875rem',
        textDecoration: 'none',
        color: 'var(--forest-700)',
        borderRadius: '20px',
        transition: 'all 0.3s ease',
        fontSize: '0.95rem',
        fontWeight: '450',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = accent 
          ? `linear-gradient(135deg, ${accent}15, ${accent}08)`
          : 'var(--forest-50)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span 
        style={{ 
          fontSize: '1.1rem',
          transition: 'transform 0.3s ease',
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navigation />
        
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
            minHeight: 'calc(100vh - 80px)',
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span 
                    style={{
                      width: '10px',
                      height: '10px',
                      background: 'var(--forest-400)',
                      borderRadius: '50%',
                      animation: 'pulse-dot 1.4s ease-in-out infinite',
                    }}
                  />
                  <span 
                    style={{
                      width: '10px',
                      height: '10px',
                      background: 'var(--earth-400)',
                      borderRadius: '50%',
                      animation: 'pulse-dot 1.4s ease-in-out infinite 0.2s',
                    }}
                  />
                  <span 
                    style={{
                      width: '10px',
                      height: '10px',
                      background: 'var(--mushroom)',
                      borderRadius: '50%',
                      animation: 'pulse-dot 1.4s ease-in-out infinite 0.4s',
                    }}
                  />
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
