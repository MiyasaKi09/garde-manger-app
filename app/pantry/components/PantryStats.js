// app/pantry/components/PantryStats.js
import { PantryStyles } from './pantryUtils';

function Stat({ value, label, tone }) {
  const color = tone === 'danger' ? '#dc2626' :
                tone === 'warning' ? '#ea580c' :
                tone === 'muted' ? '#57534e' : '#16a34a';
  
  return (
    <div style={{ 
      ...PantryStyles.glassBase, 
      borderRadius: 12, 
      padding: 12, 
      textAlign: 'center' 
    }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '.9rem', color: '#57534e' }}>{label}</div>
    </div>
  );
}

export function PantryStats({ stats }) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
      gap: 16, 
      marginBottom: 20 
    }}>
      <Stat value={stats.totalProducts} label="Produits" />
      <Stat value={stats.totalLots} label="Lots" />
      <Stat 
        value={stats.expiredCount} 
        label="Périmés" 
        tone={stats.expiredCount > 0 ? 'danger' : 'muted'} 
      />
      <Stat 
        value={stats.soonCount} 
        label="Urgents" 
        tone={stats.soonCount > 0 ? 'warning' : 'muted'} 
      />
    </div>
  );
}
