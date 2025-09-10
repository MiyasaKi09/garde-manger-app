// app/pantry/components/UI/LifespanBadge.js
import { DateHelpers } from '../pantryUtils';

export function LifespanBadge({ date }) {
  const d = DateHelpers.daysUntil(date);
  if (d === null) return null;

  let status='ok', icon='🌿', label=`${d} j`, color='#16a34a';
  if (d < 0)      { status='expired'; icon='🍂'; label=`Périmé ${Math.abs(d)}j`; color='#dc2626'; }
  else if (d===0) { status='today';   icon='⚡'; label="Aujourd'hui";           color='#ea580c'; }
  else if (d<=3)  { status='urgent';  icon='⏰'; label=`${d}j`;                  color='#ca8a04'; }
  else if (d<=7)  { status='soon';    icon='📅'; label=`${d}j`;                  color='#22c55e'; }

  return (
    <span
      className={`lifespan-badge ${status}`}
      style={{
        display:'inline-flex', 
        alignItems:'center', 
        gap:6,
        padding:'4px 10px', 
        borderRadius:999,
        background:`${color}15`, 
        border:`1px solid ${color}40`, 
        color
      }}
      title={date || ''}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
