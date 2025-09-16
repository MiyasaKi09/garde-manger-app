// app/pantry/components/LifespanBadge.js
'use client';

import { daysUntil, formatDate, getExpirationStatus } from './pantryUtils';

export default function LifespanBadge({ date, size = 'md', showDate = false }) {
  const d = daysUntil(date);
  const s = getExpirationStatus(d);

  const paddings = size === 'sm' ? '4px 8px' : '6px 10px';
  const fontSize = size === 'sm' ? '11px' : '12px';
  const radius = size === 'sm' ? '9999px' : '12px';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        title={date ? `Expire le ${formatDate(date)}` : 'Pas de date'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: paddings,
          fontSize,
          fontWeight: 700,
          color: s.color,
          background: s.bgColor,
          border: `1px solid ${s.color}20`,
          borderRadius: radius,
          lineHeight: 1,
          minWidth: size === 'sm' ? 0 : 44,
        }}
      >
        {s.label}
      </span>

      {showDate && date && (
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {formatDate(date)}
        </span>
      )}
    </div>
  );
}
