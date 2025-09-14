// ================================================================
// 2. app/pantry/components/LifespanBadge.js - VERSION UNIFIÉE
// ================================================================

import { daysUntil } from '@/lib/dates';

export function LifespanBadge({ date }) {
  if (!date) return null;
  
  const days = daysUntil(date);
  if (days === null) return null;

  let status = 'ok';
  let icon = '🌿';
  let label = `${days} j`;
  let color = '#16a34a';
  
  if (days < 0) {
    status = 'expired';
    icon = '🍂';
    label = `Périmé ${Math.abs(days)}j`;
    color = '#dc2626';
  } else if (days === 0) {
    status = 'today';
    icon = '⚡';
    label = "Aujourd'hui";
    color = '#ea580c';
  } else if (days <= 3) {
    status = 'urgent';
    icon = '⏰';
    label = `${days}j`;
    color = '#ca8a04';
  } else if (days <= 7) {
    status = 'soon';
    icon = '📅';
    label = `${days}j`;
    color = '#22c55e';
  }

  return (
    <span
      className={`lifespan-badge ${status}`}
      style={{
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 6,
        padding: '4px 10px', 
        borderRadius: 999,
        background: `${color}15`, 
        border: `1px solid ${color}40`, 
        color,
        fontSize: '0.75rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
      }}
      title={date || ''}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
