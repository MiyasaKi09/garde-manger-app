// app/pantry/components/PantryStats.js - Composant de statistiques
export function PantryStats({ stats }) {
  return (
    <div className="grid cols-4" style={{ marginBottom: '2rem' }}>
      <StatCard 
        icon="📦" 
        value={stats.totalProducts} 
        label="Produits" 
        color="var(--forest-600)" 
      />
      <StatCard 
        icon="📋" 
        value={stats.totalLots} 
        label="Lots totaux" 
        color="var(--earth-600)" 
      />
      <StatCard 
        icon="⚠️" 
        value={stats.soonCount} 
        label="À consommer" 
        color="var(--autumn-orange)" 
        urgent={stats.soonCount > 0}
      />
      <StatCard 
        icon="💀" 
        value={stats.expiredCount} 
        label="Expirés" 
        color="#e74c3c" 
        urgent={stats.expiredCount > 0}
      />
    </div>
  );
}

function StatCard({ icon, value, label, color, urgent = false }) {
  return (
    <div 
      className={`card ${urgent ? 'urgent' : ''}`}
      style={{
        textAlign: 'center',
        padding: '1.5rem 1rem',
        background: urgent ? 'rgba(231, 76, 60, 0.05)' : undefined,
        borderColor: urgent ? 'rgba(231, 76, 60, 0.2)' : undefined
      }}
    >
      <div style={{ 
        fontSize: '2rem', 
        marginBottom: '0.5rem' 
      }}>
        {icon}
      </div>
      <div style={{ 
        fontSize: '2rem', 
        fontWeight: '700', 
        color, 
        marginBottom: '0.25rem' 
      }}>
        {value || 0}
      </div>
      <div style={{ 
        fontSize: '0.9rem', 
        color: 'var(--forest-600)',
        fontWeight: '500'
      }}>
        {label}
      </div>
    </div>
  );
}
