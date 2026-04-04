'use client'

/**
 * Barre de progression horizontale pour le suivi nutritionnel.
 * Affiche valeur actuelle vs objectif avec code couleur.
 */
export default function NutritionBar({ label, value, target, unit = '', color = '#16a34a' }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 120) : 0
  const isOver = value > target && target > 0
  const display = value != null ? Math.round(value) : '—'
  const targetDisplay = target > 0 ? Math.round(target) : '—'

  return (
    <div style={styles.container}>
      <div style={styles.labelRow}>
        <span style={styles.label}>{label}</span>
        <span style={styles.values}>
          <span style={{ fontWeight: 600, color: isOver ? '#dc2626' : 'var(--ink, #1f281f)' }}>
            {display}
          </span>
          <span style={styles.separator}>/</span>
          <span style={styles.target}>{targetDisplay}{unit}</span>
        </span>
      </div>
      <div style={styles.track}>
        <div style={{
          ...styles.fill,
          width: `${Math.min(pct, 100)}%`,
          background: isOver ? '#dc2626' : color,
        }} />
      </div>
    </div>
  )
}

const styles = {
  container: {
    marginBottom: 12,
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  values: {
    fontSize: 13,
  },
  separator: {
    margin: '0 3px',
    color: '#d1d5db',
  },
  target: {
    color: '#9ca3af',
    fontSize: 12,
  },
  track: {
    height: 6,
    borderRadius: 3,
    background: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.4s ease',
  },
}
