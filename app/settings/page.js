export default function SettingsHome() {
  return (
    <div className="container">
      <h1>Paramètres</h1>

      <div className="grid" style={{gap:12}}>
        <a className="card" href="/settings/data">
          <div style={{fontWeight:600}}>Données</div>
          <div style={{opacity:.7}}>Nettoyer les produits & alias, supprimer les entrées “bizarres”.</div>
        </a>

        {/* Tu pourras ajouter d’autres sections ici plus tard */}
      </div>
    </div>
  );
}
