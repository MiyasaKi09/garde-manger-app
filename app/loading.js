// Coquille instantanée affichée pendant le chargement d'une page (chunk + données),
// au lieu d'un écran vide. Next l'affiche dès le clic (avec le prefetch des liens).
export default function Loading() {
  return (
    <div className="v21-page wide" aria-busy="true" aria-label="Chargement">
      <div style={{ padding: '6px 0 26px' }}>
        <div className="v21-skel" style={{ height: 13, width: 96, marginBottom: 18, borderRadius: 3 }} />
        <div className="v21-skel" style={{ height: 52, width: '48%', maxWidth: 440, marginBottom: 16, borderRadius: 3 }} />
        <div className="v21-skel" style={{ height: 2, width: 60, marginBottom: 16 }} />
        <div className="v21-skel" style={{ height: 15, width: '34%', maxWidth: 340, borderRadius: 3 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="v21-skel" style={{ height: 148, borderRadius: 3 }} />
        ))}
      </div>
    </div>
  )
}
