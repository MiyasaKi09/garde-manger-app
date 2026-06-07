import Link from 'next/link'

export default function SettingsHome() {
  return (
    <div className="v21-page narrow">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Paramètres</span>
          <h1 className="v21-title">Réglages</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Gérez vos données et la configuration de Myko.</p>
        </div>
      </header>

      <section className="v21-section flush">
        <div className="v21-bh"><span className="v21-bl">Général</span></div>
        <div className="v21-its">
          <Link href="/settings/data" className="v21-it compact">
            <span className="v21-it-bar" aria-hidden="true" />
            <span className="v21-it-n">Données</span>
            <span className="v21-it-st">Gérer →</span>
          </Link>
        </div>
        <p className="v21-next">Nettoyer produits &amp; alias (supprimer les entrées « bizarres »).</p>
      </section>
    </div>
  )
}
