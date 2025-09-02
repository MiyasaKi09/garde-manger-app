export default function SettingsHome() {
  return (
    <div className="container">
      <h1>Paramètres</h1>
      <div className="grid" style={{gap:12}}>
        <a className="card" href="/settings/data">
          <div style={{fontWeight:600}}>Données</div>
          <div style={{opacity:.7}}>Nettoyer produits & alias (supprimer “bizarres”).</div>
        </a>
      </div>
    </div>
  );
}
