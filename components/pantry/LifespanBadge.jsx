// components/pantry/LifespanBadge.jsx
'use client';
import { daysUntil } from '@/lib/dates';

export default function LifespanBadge({ date }) {
  const d = daysUntil(date);
  if (d === null) return null;

  let status='ok', icon='🌿', label=`${d} j`, color='var(--success)';
  if (d < 0)      { status='expired'; icon='🍂'; label=`Périmé ${Math.abs(d)}j`; color='var(--danger)'; }
  else if (d===0) { status='today';   icon='⚡'; label="Aujourd'hui";           color='var(--autumn-orange)'; }
  else if (d<=3)  { status='urgent';  icon='⏰'; label=`${d}j`;                  color='var(--autumn-yellow)'; }
  else if (d<=7)  { status='soon';    icon='📅'; label=`${d}j`;                  color='var(--forest-500)'; }

  return (
    <span
      className={`lifespan-badge ${status}`}
      style={{
        display:'inline-flex',alignItems:'center',gap:6,
        padding:'4px 10px', borderRadius:999,
        background:`linear-gradient(135deg, ${color}15, ${color}08)`,
        border:`1px solid ${color}40`, color
      }}
      title={date || ''}
    >
      <span>{icon}</span><span>{label}</span>
    </span>
  );
}
