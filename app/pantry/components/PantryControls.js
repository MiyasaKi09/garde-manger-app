// app/pantry/components/PantryControls.js
import { PantryStyles } from './pantryUtils';

export function PantryControls({
  q, setQ, locFilter, setLocFilter, view, setView,
  showAddForm, setShowAddForm, locations, onRefresh
}) {
  return (
    <div style={{
      ...PantryStyles.glassBase,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      display: 'grid',
      gap: 16
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Rechercher un produit..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            minWidth: 220,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #ddd',
            fontSize: '1rem'
          }}
        />
        
        <select
          value={locFilter}
          onChange={(e) => setLocFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #ddd'
          }}
        >
          <option value="Tous">Tous les lieux</option>
          {locations.map(l => (
            <option key={l.id} value={l.name}>{l.name}</option>
          ))}
        </select>
        
        <div style={{display:'flex', gap:8}}>
          <button
            onClick={() => setView('products')}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: view === 'products' ? '#2563eb' : 'white',
              color: view === 'products' ? 'white' : '#374151',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            🎯 Par produits
          </button>
          
          <button
            onClick={() => setView('lots')}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: view === 'lots' ? '#2563eb' : 'white',
              color: view === 'lots' ? 'white' : '#374151',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            📦 Tous les lots
          </button>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: showAddForm ? '#dc2626' : '#16a34a',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {showAddForm ? '❌ Fermer' : '➕ Ajouter'}
        </button>
        
        <button
          onClick={onRefresh}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: '#6b7280',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          🔄 Actualiser
        </button>
      </div>
    </div>
  );
}
