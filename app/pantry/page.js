// ==================================================
// 1. Correction de app/pantry/page.js
// ==================================================

'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SmartAddForm } from './components/SmartAddForm';
import { ProductCard } from './components/ProductCard'; // ✅ Utiliser le bon chemin
import { LotsView } from './components/LotsView';
import { PantryStats } from './components/PantryStats';
import { EnhancedLotCard } from './components/EnhancedLotCard';

// ✅ Importer DateHelpers depuis le bon fichier
import { DateHelpers } from './components/pantryUtils';

// Rest of the page component stays the same...
function usePantryData() {
  // ... (votre code existant)
}

// Page principale
export default function PantryPage() {
  // ... (votre code existant - reste identique)
}

// ==================================================
// 2. Correction de app/pantry/components/ProductCard.js
// ==================================================

// app/pantry/components/ProductCard.js
import { useMemo } from 'react';
// ✅ Assurer que l'import est correct
import { DateHelpers } from './pantryUtils';

// Badge de péremption adapté au style Myko
const LifespanBadge = ({ date }) => {
  if (!date) return null;
  
  const days = DateHelpers.daysUntil(date);
  let badgeClass = 'success';
  let text = 'OK';
  
  if (days === null) return null;
  
  if (days < 0) {
    badgeClass = 'danger';
    text = `Périmé ${Math.abs(days)}j`;
  } else if (days === 0) {
    badgeClass = 'danger';
    text = "Aujourd'hui";
  } else if (days === 1) {
    badgeClass = 'warning';
    text = 'Demain';
  } else if (days <= 3) {
    badgeClass = 'warning';
    text = `${days}j`;
  } else if (days <= 7) {
    badgeClass = 'info';
    text = `${days}j`;
  }
  
  return <span className={`badge ${badgeClass}`}>{text}</span>;
};

export function ProductCard({ productId, name, category, unit, lots=[], onOpen, onQuickAction }) {
  const { total, nextDate, locations, urgentCount, lotDetails } = useMemo(() => {
    let total = 0;
    let nextDate = null;
    const locSet = new Set();
    let urgentCount = 0;
    const lotsByLocation = new Map();
    
    for (const lot of lots) {
      total += Number(lot.qty || 0);
      if (lot.location?.name) {
        locSet.add(lot.location.name);
        
        const locName = lot.location.name;
        if (!lotsByLocation.has(locName)) {
          lotsByLocation.set(locName, { qty: 0, count: 0 });
        }
        const locData = lotsByLocation.get(locName);
        locData.qty += Number(lot.qty || 0);
        locData.count += 1;
      }
      
      const d = lot.dlc || lot.best_before;
      if (d && (nextDate === null || new Date(d) < new Date(nextDate))) nextDate = d;
      
      const days = DateHelpers.daysUntil(d);
      if (days !== null && days <= 3) urgentCount++;
    }
    
    return { 
      total: Math.round(total * 100) / 100, 
      nextDate, 
      locations: [...locSet].slice(0, 3),
      urgentCount,
      lotDetails: Array.from(lotsByLocation.entries()).map(([loc, data]) => ({
        location: loc,
        qty: Math.round(data.qty * 100) / 100,
        count: data.count
      }))
    };
  }, [lots]);

  const soon = nextDate ? DateHelpers.daysUntil(nextDate) : null;
  const isUrgent = soon !== null && soon <= 3;

  return (
    <div 
      className={`card interactive ${isUrgent ? 'urgent' : ''}`}
      onClick={() => onOpen && onOpen({ productId, name })}
      style={{ cursor: 'pointer' }}
    >
      {/* En-tête avec nom et badge */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'start',
        marginBottom: '1rem' 
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.25rem',
            color: 'var(--forest-800)',
            fontFamily: "'Crimson Text', Georgia, serif"
          }}>
            {name}
          </h3>
          {category && (
            <div style={{
              fontSize: '0.9rem',
              color: 'var(--forest-600)',
              marginTop: '0.25rem',
              fontWeight: '500'
            }}>
              📂 {category}
            </div>
          )}
        </div>
        <LifespanBadge date={nextDate} />
      </div>

      {/* Quantité totale */}
      <div style={{
        background: 'var(--earth-50)',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          fontSize: '2rem',
          fontWeight: '800',
          color: 'var(--earth-600)',
          lineHeight: 1
        }}>
          {total.toFixed(total % 1 === 0 ? 0 : 1)}
        </div>
        <div style={{
          fontSize: '0.9rem',
          color: 'var(--earth-500)',
          fontWeight: '500',
          marginTop: '0.25rem'
        }}>
          {unit || 'unité'}
        </div>
        
        {urgentCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: 'var(--danger)',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700',
            animation: 'pulse-urgent 2s ease-in-out infinite'
          }}>
            {urgentCount}
          </div>
        )}
      </div>

      {/* Informations sur les lots */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        fontSize: '0.9rem',
        color: 'var(--forest-600)'
      }}>
        <span>📦 {lots.length} lot{lots.length > 1 ? 's' : ''}</span>
        
        {urgentCount > 0 && (
          <span className="badge warning" style={{ fontSize: '0.75rem' }}>
            {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Lieux de stockage */}
      {locations.length > 0 && (
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--forest-500)',
          marginBottom: '1rem'
        }}>
          📍 {locations.join(', ')}
          {locations.length === 3 && '...'}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn primary small"
          onClick={(e) => {
            e.stopPropagation();
            onOpen && onOpen({ productId, name });
          }}
          style={{ flex: 1 }}
        >
          👁️ Détails
        </button>
        
        <button
          className="btn secondary small"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction && onQuickAction('add', { productId, name, category });
          }}
          title="Ajouter un lot"
        >
          ➕
        </button>
      </div>
    </div>
  );
}

// ==================================================
// 3. Vérifiez que pantryUtils.js exporte bien DateHelpers
// ==================================================

// app/pantry/components/pantryUtils.js
export const DateHelpers = {
  daysUntil(date) {
    if (!date) return null;
    const today = new Date(); 
    today.setHours(0,0,0,0);
    const d = new Date(date); 
    d.setHours(0,0,0,0);
    return Math.round((d - today) / 86400000);
  },

  fmtDate(d) {
    if (!d) return '—';
    try {
      const x = new Date(d);
      return x.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
    } catch { 
      return d; 
    }
  }
};

// Autres exports...
export const PantryStyles = {
  // ... vos styles existants
};

export const ProductAI = {
  // ... votre code existant
};

// ==================================================
// INSTRUCTIONS DE DÉBOGAGE
// ==================================================

/* 
Si le problème persiste, ajoutez temporairement ces lignes en haut de ProductCard.js :

console.log('ProductCard: DateHelpers imported =', DateHelpers);
console.log('ProductCard: DateHelpers.daysUntil =', DateHelpers?.daysUntil);

Puis ouvrez la console de votre navigateur pour voir si DateHelpers est bien importé.
*/
