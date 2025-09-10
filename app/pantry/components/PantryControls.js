// app/pantry/components/PantryControls.js - Adapté au style Myko
export function PantryControls({
  q, setQ, locFilter, setLocFilter, view, setView,
  showAddForm, setShowAddForm, locations, onRefresh
}) {
  return (
    <div className="toolbar">
      {/* Barre de recherche et filtres */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
        <input
          className="input"
          type="search"
          placeholder="🔍 Rechercher un produit..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: '280px' }}
        />
        
        <select
          className="input"
          value={locFilter}
          onChange={(e) => setLocFilter(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          <option value="Tous">📍 Tous les lieux</option>
          {locations.map(l => (
            <option key={l.id} value={l.name}>{l.name}</option>
          ))}
          {locations.length === 0 && (
            <option disabled>(Aucun lieu)</option>
          )}
        </select>
      </div>

      {/* Sélecteur de vue */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        background: 'rgba(255,255,255,0.6)',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--soft-gray)'
      }}>
        <button
          onClick={() => setView('products')}
          className={view === 'products' ? 'btn primary small' : 'btn secondary small'}
          style={{ borderRadius: 'var(--radius-sm)' }}
        >
          📦 Par produits
        </button>
        
        <button
          onClick={() => setView('lots')}
          className={view === 'lots' ? 'btn primary small' : 'btn secondary small'}
          style={{ borderRadius: 'var(--radius-sm)' }}
        >
          📋 Tous les lots
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn secondary"
          onClick={onRefresh}
          title="Rafraîchir les données"
        >
          ↻ Actualiser
        </button>
        
        <button
          className={showAddForm ? 'btn danger' : 'btn primary'}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Fermer' : '➕ Ajouter'}
        </button>
      </div>
    </div>
  );
}
