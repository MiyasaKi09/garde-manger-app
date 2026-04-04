'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

/**
 * Modal glass-morphism réutilisable.
 * Se ferme avec Escape ou clic sur le backdrop.
 */
export default function Modal({ open, onClose, title, children, width = 520 }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose?.()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: width }} onClick={e => e.stopPropagation()}>
        {title && (
          <div style={styles.header}>
            <h3 style={styles.title}>{title}</h3>
            <button onClick={onClose} style={styles.closeBtn} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        )}
        <div style={styles.body}>
          {children}
        </div>
      </div>
    </div>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    width: '100%',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px) saturate(120%)',
    WebkitBackdropFilter: 'blur(20px) saturate(120%)',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 20,
    boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },
  title: {
    margin: 0,
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--ink, #1f281f)',
  },
  closeBtn: {
    border: 'none',
    background: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 6,
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: 20,
  },
}
