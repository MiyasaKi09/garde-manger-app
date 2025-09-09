'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container">
      <section className="hero-section card" style={{ padding: '3rem', marginBottom: '2rem' }}>
        <h1>Bienvenue dans Myko 🌿</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--earth-600)', marginBottom: '2rem' }}>
          Votre réseau mycorhizien qui connecte garde-manger, recettes et potager.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/pantry" className="btn primary">
            Explorer le garde-manger
          </Link>
          <Link href="/recipes" className="btn secondary">
            Voir les recettes
          </Link>
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Actions rapides</h2>
        <div className="grid cols-4">
          <QuickCard href="/pantry" icon="🏺" title="Garde-manger" />
          <QuickCard href="/recipes" icon="📖" title="Recettes" />
          <QuickCard href="/garden" icon="🌱" title="Potager" />
          <QuickCard href="/planning" icon="📅" title="Planning" />
        </div>
      </section>
    </div>
  );
}

function QuickCard({ href, icon, title }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ 
        padding: '2rem', 
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h3>
      </div>
    </Link>
  );
}
