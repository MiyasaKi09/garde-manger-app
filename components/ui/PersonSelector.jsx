'use client'

/**
 * Toggle entre les personnes (Julien / Zoé).
 */
export default function PersonSelector({ people = ['Julien', 'Zoé'], selected, onChange }) {
  return (
    <div style={styles.container}>
      {people.map(name => (
        <button
          key={name}
          onClick={() => onChange(name)}
          style={{
            ...styles.btn,
            ...(selected === name ? styles.btnActive : {}),
          }}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

const styles = {
  container: {
    display: 'inline-flex',
    gap: 2,
    padding: 2,
    background: 'rgba(0,0,0,0.04)',
    borderRadius: 10,
  },
  btn: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: '#6b7280',
    transition: 'all 0.15s',
  },
  btnActive: {
    background: 'white',
    color: '#16a34a',
    fontWeight: 600,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
}
