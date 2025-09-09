// lib/dates.js
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}
export function fmtDate(d) {
  if (!d) return '—';
  try {
    const x = new Date(d);
    return x.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
  } catch { return d; }
}
