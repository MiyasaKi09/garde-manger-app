// app/pantry/components/PantryStats.js - Adapté au style Myko
import { PantryStyles } from './pantryUtils';

function Stat({ value, label, tone, icon }) {
  const color = tone === 'danger' ? 'var(--danger)' :
                tone === 'warning' ? 'var(--autumn-orange)' :
                tone === 'muted' ? 'var(--dark-gray)' : 'var(--forest-600)';
  
  return (
    <div className="card" style={{ 
      textAlign: 'center',
      padding: '1rem',
      background: tone === 'danger' ? 'rgba(231, 76, 60, 0.05)' :
                  tone === 'warning' ? 'rgba(243, 156, 18, 0.05)' :
                  'linear-gradient(145deg, var(--warm-white), rgba(250, 248, 243, 0.95))'
    }}>
      <div style={{ 
        fontSize: '2rem', 
        fontWeight: 800, 
        color,
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        {icon && <span style={{ fontSize: '1.5rem' }}>{icon}</span>}
        {value}
      </div>
      <div style={{ 
        fontSize: '0.95rem', 
        color: 'var(--forest-500)',
        fontWeight: '500'
      }}>
        {label}
      </div>
    </div>
  );
}

export function PantryStats({ stats }) {
  return (
    <div className="grid cols-4" style={{ marginBottom: '1.5rem' }}>
      <Stat 
        value={stats.totalProducts} 
        label="Produits" 
        icon="📦"
      />
      <Stat 
        value={stats.totalLots} 
        label="Lots totaux" 
        icon="📋"
      />
      <Stat 
        value={stats.expiredCount} 
        label="Périmés" 
        tone={stats.expiredCount > 0 ? 'danger' : 'muted'}
        icon="⚠️"
      />
      <Stat 
        value={stats.soonCount} 
        label="Urgents" 
        tone={stats.soonCount > 0 ? 'warning' : 'muted'}
        icon="⏰"
      />
    </div>
  );
}
