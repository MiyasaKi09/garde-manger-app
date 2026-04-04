'use client'

/**
 * Bulle de message chat — user (vert, à droite) ou assistant (glass, à gauche).
 */
export default function ChatBubble({ role, children }) {
  const isUser = role === 'user'

  return (
    <div style={isUser ? styles.userRow : styles.assistantRow}>
      {!isUser && <span style={styles.avatar}>👨‍🍳</span>}
      <div style={isUser ? styles.userBubble : styles.assistantBubble}>
        {children}
      </div>
    </div>
  )
}

const styles = {
  userRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  assistantRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  avatar: {
    fontSize: 20,
    marginTop: 4,
    flexShrink: 0,
  },
  userBubble: {
    background: '#16a34a',
    color: 'white',
    padding: '10px 14px',
    borderRadius: '18px 18px 4px 18px',
    maxWidth: '80%',
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  assistantBubble: {
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    padding: '10px 14px',
    borderRadius: '18px 18px 18px 4px',
    maxWidth: '85%',
    fontSize: 14,
    lineHeight: 1.55,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    color: 'var(--ink, #1f281f)',
    wordBreak: 'break-word',
  },
}
