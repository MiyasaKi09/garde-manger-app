import Link from 'next/link'

export default function SettingsHome() {
  return (
    <div className="v21-page narrow">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Compte & préférences</span>
          <h1 className="v21-title">Paramètres</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Réglages du foyer, du planning et de la sécurité.</p>
        </div>
      </header>

      <section className="v21-section flush">
        <div className="v21-bh"><span className="v21-bl">Planning & nutrition</span></div>
        <div className="v21-its">
          <Link href="/settings/planning" className="v21-it v21-link-row">
            <span className="v21-it-main">
              <span className="v21-it-name">Objectifs, repas et produits interdits</span>
              <span className="v21-it-sub">Questionnaire par personne, calcul des besoins, petits-déjeuners, collations et interdits stricts</span>
            </span>
            <span className="v21-it-r">Configurer →</span>
          </Link>
        </div>
      </section>

      <section className="v21-section flush">
        <div className="v21-bh"><span className="v21-bl">Compte</span></div>
        <div className="v21-its">
          <Link href="/settings/security" className="v21-it v21-link-row">
            <span className="v21-it-main">
              <span className="v21-it-name">Sécurité</span>
              <span className="v21-it-sub">Mot de passe · sessions des appareils</span>
            </span>
            <span className="v21-it-r">Gérer →</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
