// app/pantry/components/PantryStats.js
'use client';

import { useMemo } from 'react';

export default function PantryStats({ stats, onAll, onFresh, onExpiring }) {
  // Protection contre les stats undefined
  const safeStats = useMemo(() => {
    return {
      totalProducts: stats?.totalProducts || 0,
      expiringCount: stats?.expiringCount || 0,
      freshCount: stats?.freshCount || 0
    };
  }, [stats]);

  return (
    <div className="pantry-stats">
      <div className="stats-grid">
        <div className="stat-card" onClick={onAll}>
          <div className="stat-number">{safeStats.totalProducts}</div>
          <div className="stat-label">Total produits</div>
        </div>
        
        <div className="stat-card expiring" onClick={onExpiring}>
          <div className="stat-number">{safeStats.expiringCount}</div>
          <div className="stat-label">À consommer</div>
        </div>
        
        <div className="stat-card fresh" onClick={onFresh}>
          <div className="stat-number">{safeStats.freshCount}</div>
          <div className="stat-label">Longue conservation</div>
        </div>
      </div>
      
      <style jsx>{`
        .pantry-stats {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        
        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--forest-600, #4a7c4a);
          margin-bottom: 0.25rem;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: var(--earth-600, #8b7a5d);
          text-align: center;
          font-weight: 500;
        }
        
        .stat-card.expiring .stat-number {
          color: #ea580c;
        }
        
        .stat-card.fresh .stat-number {
          color: #059669;
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          
          .stat-card {
            padding: 0.75rem;
          }
          
          .stat-number {
            font-size: 1.25rem;
          }
          
          .stat-label {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}
