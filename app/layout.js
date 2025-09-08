// app/layout.jsx
import './globals.css';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';
import { Suspense } from 'react';

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
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
                <Link href="/" className="nav-link">
                  <span className="nav-icon">🏠</span>
                  <span>Accueil</span>
                </Link>
                <Link href="/pantry" className="nav-link">
                  <span className="nav-icon">🏺</span>
                  <span>Garde-manger</span>
                </Link>
                <Link href="/recipes" className="nav-link">
                  <span className="nav-icon">📖</span>
                  <span>Recettes</span>
                </Link>
                <Link href="/garden" className="nav-link">
                  <span className="nav-icon">🌱</span>
                  <span>Potager</span>
                </Link>
                <Link href="/planning" className="nav-link">
                  <span className="nav-icon">📅</span>
                  <span>Planning</span>
                </Link>
                <Link href="/settings" className="nav-link">
                  <span className="nav-icon">⚙️</span>
                  <span>Paramètres</span>
                </Link>
              </nav>
            </div>
            
            <div className="header-actions">
              <div className="season-indicator">
                <span className="season-icon">🍂</span>
                <span className="season-text">Automne</span>
              </div>
              <SignOutButton />
            </div>
          </div>
        </header>
        
        <div className="mycelium-bg"></div>
        
        <main className="main-container">
          <Suspense fallback={
            <div className="loading-container">
              <div className="loading-mycelium">
                <span></span><span></span><span></span>
              </div>
              <p>Connexion au réseau mycorhizien...</p>
            </div>
          }>
            {children}
          </Suspense>
        </main>

        <style jsx global>{`
          :root {
            --primary-green: #2d5016;
            --forest-green: #1a3409;
            --sage-green: #87a96b;
            --moss-green: #8b956d;
            --earth-brown: #8b6f47;
            --bark-brown: #5c4033;
            --cream: #faf8f3;
            --warm-white: #fffef9;
            --mushroom: #d2c4b0;
            --spore: #a0826d;
            --gold-accent: #d4a574;
            --autumn-orange: #e67e22;
            --soft-shadow: 0 2px 8px rgba(45, 80, 22, 0.08);
            --medium-shadow: 0 4px 16px rgba(45, 80, 22, 0.12);
            --large-shadow: 0 8px 32px rgba(45, 80, 22, 0.16);
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(180deg, var(--cream) 0%, var(--warm-white) 100%);
            color: var(--primary-green);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
          }

          h1, h2, h3 {
            font-family: 'Crimson Text', Georgia, serif;
            font-weight: 600;
            color: var(--forest-green);
            letter-spacing: -0.02em;
          }

          h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
          h2 { font-size: 1.875rem; margin-bottom: 0.75rem; }
          h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }

          /* Header Styles */
          .myko-header {
            position: sticky;
            top: 0;
            background: linear-gradient(180deg, rgba(255,254,249,0.98) 0%, rgba(250,248,243,0.95) 100%);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(139, 149, 109, 0.2);
            box-shadow: var(--soft-shadow);
            z-index: 100;
            transition: all 0.3s ease;
          }

          .header-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0.75rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .logo-group {
            display: flex;
            align-items: center;
            gap: 2rem;
          }

          .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
            color: var(--forest-green);
            transition: transform 0.3s ease;
          }

          .logo:hover {
            transform: translateY(-2px);
          }

          .myko-icon {
            width: 40px;
            height: 40px;
            position: relative;
          }

          .spore {
            position: absolute;
            width: 8px;
            height: 8px;
            background: var(--sage-green);
            border-radius: 50%;
            animation: float 6s ease-in-out infinite;
          }

          .spore:nth-child(1) { top: 5px; left: 10px; animation-delay: 0s; }
          .spore:nth-child(2) { top: 15px; left: 25px; animation-delay: 2s; background: var(--moss-green); }
          .spore:nth-child(3) { top: 25px; left: 8px; animation-delay: 4s; background: var(--earth-brown); }

          .mycelium {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--mushroom), transparent);
            animation: pulse 3s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scaleX(0.5); }
            50% { opacity: 0.8; transform: translate(-50%, -50%) scaleX(1); }
          }

          .logo-text {
            font-family: 'Crimson Text', serif;
            font-size: 1.75rem;
            font-weight: 600;
            letter-spacing: 0.05em;
          }

          .main-nav {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }

          .nav-link {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 0.75rem;
            text-decoration: none;
            color: var(--primary-green);
            border-radius: 20px;
            transition: all 0.3s ease;
            font-size: 0.95rem;
            font-weight: 450;
            position: relative;
            overflow: hidden;
          }

          .nav-link::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--sage-green), var(--moss-green));
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: -1;
          }

          .nav-link:hover {
            color: white;
            transform: translateY(-2px);
            box-shadow: var(--soft-shadow);
          }

          .nav-link:hover::before {
            opacity: 1;
          }

          .nav-icon {
            font-size: 1.1rem;
            display: inline-block;
            transition: transform 0.3s ease;
          }

          .nav-link:hover .nav-icon {
            transform: scale(1.2) rotate(10deg);
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 1.5rem;
          }

          .season-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 0.8rem;
            background: linear-gradient(135deg, rgba(230, 126, 34, 0.1), rgba(212, 165, 116, 0.1));
            border-radius: 20px;
            border: 1px solid rgba(230, 126, 34, 0.2);
            font-size: 0.9rem;
            color: var(--earth-brown);
          }

          .season-icon {
            font-size: 1.1rem;
            animation: sway 4s ease-in-out infinite;
          }

          @keyframes sway {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
          }

          /* Background mycelium network */
          .mycelium-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0.03;
            z-index: 0;
            background-image: 
              radial-gradient(circle at 20% 30%, var(--sage-green) 1px, transparent 1px),
              radial-gradient(circle at 80% 60%, var(--moss-green) 1px, transparent 1px),
              radial-gradient(circle at 40% 80%, var(--mushroom) 1px, transparent 1px);
            background-size: 100px 100px, 150px 150px, 200px 200px;
            animation: drift 60s linear infinite;
          }

          @keyframes drift {
            0% { transform: translate(0, 0); }
            100% { transform: translate(-50px, -50px); }
          }

          /* Main container */
          .main-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem 1.5rem;
            position: relative;
            z-index: 1;
            min-height: calc(100vh - 80px);
          }

          /* Loading state */
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            gap: 1rem;
            color: var(--moss-green);
          }

          .loading-mycelium {
            display: flex;
            gap: 0.5rem;
          }

          .loading-mycelium span {
            width: 10px;
            height: 10px;
            background: var(--sage-green);
            border-radius: 50%;
            animation: loading-pulse 1.4s ease-in-out infinite;
          }

          .loading-mycelium span:nth-child(2) {
            animation-delay: 0.2s;
            background: var(--moss-green);
          }

          .loading-mycelium span:nth-child(3) {
            animation-delay: 0.4s;
            background: var(--mushroom);
          }

          @keyframes loading-pulse {
            0%, 80%, 100% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            40% {
              transform: scale(1.2);
              opacity: 1;
            }
          }

          /* Card styles globaux */
          .card {
            background: var(--warm-white);
            border: 1px solid rgba(139, 149, 109, 0.2);
            border-radius: 12px;
            padding: 1rem;
            transition: all 0.3s ease;
            box-shadow: var(--soft-shadow);
          }

          .card:hover {
            transform: translateY(-2px);
            box-shadow: var(--medium-shadow);
            border-color: var(--sage-green);
          }

          /* Buttons */
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 1.25rem;
            background: linear-gradient(135deg, var(--sage-green), var(--moss-green));
            color: white;
            border: none;
            border-radius: 24px;
            font-weight: 500;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            box-shadow: var(--soft-shadow);
          }

          .btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--medium-shadow);
            background: linear-gradient(135deg, var(--moss-green), var(--sage-green));
          }

          .btn-secondary {
            background: transparent;
            color: var(--primary-green);
            border: 2px solid var(--sage-green);
          }

          .btn-secondary:hover {
            background: var(--sage-green);
            color: white;
          }

          /* Responsive */
          @media (max-width: 768px) {
            .header-container {
              padding: 0.75rem 1rem;
            }
            
            .main-nav {
              flex-wrap: wrap;
            }
            
            .nav-link span:not(.nav-icon) {
              display: none;
            }
            
            .season-indicator .season-text {
              display: none;
            }
            
            h1 { font-size: 2rem; }
            h2 { font-size: 1.5rem; }
          }
        `}</style>
      </body>
    </html>
  );
}
