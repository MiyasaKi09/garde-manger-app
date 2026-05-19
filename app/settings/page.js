export default function SettingsHome() {
  return (
    <>
      <div className="myko-canvas" aria-hidden="true" />
      <div className="myko-page-container">
        <div className="hero-header">
          <div className="hero-content">
            <div className="hero-text">
              <span className="hero-eyebrow">Paramètres</span>
              <h1 className="hero-title">Réglages</h1>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <a className="myko-card" href="/settings/data" style={{ display: 'block', textDecoration: 'none', padding: 'var(--s-4) var(--s-5)' }}>
            <div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>Données</div>
            <div style={{ opacity: 0.7, color: 'var(--ink-2)', fontSize: 'var(--fs-sm)', marginTop: 4 }}>Nettoyer produits &amp; alias (supprimer "bizarres").</div>
          </a>
        </div>
      </div>
    </>
  )
}
