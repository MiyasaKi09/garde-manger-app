// app/pantry/components/PantryStats.js
import { useMemo } from 'react';
import { daysUntil } from '@/lib/dates'; // ✅ Import unifié

export function PantryStats({ lots }) {
  const stats = useMemo(() => {
    const totalLots = lots?.length || 0;
    
    if (totalLots === 0) {
      return {
        totalLots: 0,
        totalProducts: 0,
        expiringSoon: 0,
        expired: 0,
        byCategory: {},
        byLocation: {},
        urgencyBreakdown: { urgent: 0, warning: 0, ok: 0 }
      };
    }

    let expiringSoon = 0;
    let expired = 0;
    const categoryCount = new Map();
    const locationCount = new Map();
    const productIds = new Set();
    const urgencyBreakdown = { urgent: 0, warning: 0, ok: 0 };

    for (const lot of lots) {
      // Compter les produits uniques
      if (lot.product?.id) {
        productIds.add(lot.product.id);
      }

      // Analyser les dates de péremption
      const days = daysUntil(lot.best_before || lot.dlc);
      if (days !== null) {
        if (days < 0) {
          expired++;
          urgencyBreakdown.urgent++;
        } else if (days <= 7) {
          expiringSoon++;
          if (days <= 3) {
            urgencyBreakdown.urgent++;
          } else {
            urgencyBreakdown.warning++;
          }
        } else {
          urgencyBreakdown.ok++;
        }
      } else {
        urgencyBreakdown.ok++;
      }

      // Compter par catégorie
      const category = lot.product?.category || 'Sans catégorie';
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);

      // Compter par lieu
      const location = lot.location?.name || 'Sans lieu';
      locationCount.set(location, (locationCount.get(location) || 0) + 1);
    }

    return {
      totalLots,
      totalProducts: productIds.size,
      expiringSoon,
      expired,
      byCategory: Object.fromEntries(categoryCount),
      byLocation: Object.fromEntries(locationCount),
      urgencyBreakdown
    };
  }, [lots]);

  return (
    <div className="pantry-stats">
      <h2 style={{ 
        marginBottom: '1.5rem', 
        color: 'var(--forest-700)',
        textAlign: 'center'
      }}>
        📊 Statistiques du garde-manger
      </h2>

      {/* Statistiques principales */}
      <div className="grid cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--forest-600)' }}>
            {stats.totalLots}
          </div>
          <div style={{ color: 'var(--medium-gray)', fontSize: '0.9rem' }}>
            Lots totaux
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--earth-600)' }}>
            {stats.totalProducts}
          </div>
          <div style={{ color: 'var(--medium-gray)', fontSize: '0.9rem' }}>
            Produits différents
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--autumn-orange)' }}>
            {stats.expiringSoon}
          </div>
          <div style={{ color: 'var(--medium-gray)', fontSize: '0.9rem' }}>
            Expire bientôt
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#e74c3c' }}>
            {stats.expired}
          </div>
          <div style={{ color: 'var(--medium-gray)', fontSize: '0.9rem' }}>
            Expirés
          </div>
        </div>
      </div>

      {/* Répartition par urgence */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--forest-700)' }}>
          ⏰ Répartition par urgence
        </h3>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              height: '20px',
              borderRadius: '10px',
              overflow: 'hidden',
              background: 'var(--soft-gray)'
            }}>
              <div
                style={{
                  width: `${(stats.urgencyBreakdown.urgent / stats.totalLots) * 100}%`,
                  background: '#e74c3c'
                }}
              />
              <div
                style={{
                  width: `${(stats.urgencyBreakdown.warning / stats.totalLots) * 100}%`,
                  background: 'var(--autumn-orange)'
                }}
              />
              <div
                style={{
                  width: `${(stats.urgencyBreakdown.ok / stats.totalLots) * 100}%`,
                  background: 'var(--forest-500)'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#e74c3c' }}>
                🚨 Urgent: {stats.urgencyBreakdown.urgent}
              </span>
              <span style={{ color: 'var(--autumn-orange)' }}>
                ⚠️ Attention: {stats.urgencyBreakdown.warning}
              </span>
              <span style={{ color: 'var(--forest-500)' }}>
                ✅ OK: {stats.urgencyBreakdown.ok}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid cols-2">
        {/* Par catégorie */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--forest-700)' }}>
            📂 Par catégorie
          </h3>
          
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {Object.entries(stats.byCategory)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([category, count]) => (
              <div key={category} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem',
                background: 'var(--forest-50)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <span style={{ fontSize: '0.9rem' }}>{category}</span>
                <span style={{ fontWeight: '600', color: 'var(--forest-600)' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Par lieu */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--forest-700)' }}>
            📍 Par lieu
          </h3>
          
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {Object.entries(stats.byLocation)
              .sort(([,a], [,b]) => b - a)
              .map(([location, count]) => (
              <div key={location} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.5rem',
                background: 'var(--earth-50)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <span style={{ fontSize: '0.9rem' }}>{location}</span>
                <span style={{ fontWeight: '600', color: 'var(--earth-600)' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
