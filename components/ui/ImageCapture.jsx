'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, X, Upload } from 'lucide-react'

/**
 * Composant de capture d'image : upload fichier + collage clipboard.
 * Mobile-first, optimisé pour screenshots de commandes en ligne.
 */
export default function ImageCapture({ onImage, onCancel }) {
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }, [])

  // Handle paste event for screenshots
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          processFile(item.getAsFile())
          return
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [processFile])

  const handleConfirm = () => {
    if (preview) onImage?.(preview)
  }

  const handleCancel = () => {
    setPreview(null)
    onCancel?.()
  }

  return (
    <div style={styles.container}>
      {!preview ? (
        <>
          <div
            style={styles.dropzone}
            onClick={() => fileRef.current?.click()}
          >
            <Camera size={32} color="#9ca3af" />
            <p style={styles.dropzoneText}>Clique ou colle un screenshot</p>
            <p style={styles.dropzoneHint}>Commande en ligne, liste de notes, etc.</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={e => processFile(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
        </>
      ) : (
        <div style={styles.previewContainer}>
          <img src={preview} alt="Aperçu" style={styles.previewImg} />
          <div style={styles.actions}>
            <button onClick={handleConfirm} style={styles.confirmBtn}>
              <Upload size={16} />
              Analyser
            </button>
            <button onClick={handleCancel} style={styles.cancelBtn}>
              <X size={16} />
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    marginBottom: 16,
  },
  dropzone: {
    border: '2px dashed rgba(22,163,74,0.3)',
    borderRadius: 14,
    padding: '32px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    background: 'rgba(22,163,74,0.03)',
    transition: 'all 0.2s',
  },
  dropzoneText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  dropzoneHint: {
    fontSize: 12,
    color: '#9ca3af',
    margin: 0,
  },
  previewContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.06)',
  },
  previewImg: {
    width: '100%',
    maxHeight: 300,
    objectFit: 'contain',
    display: 'block',
    background: '#f9fafb',
  },
  actions: {
    display: 'flex',
    gap: 8,
    padding: 12,
  },
  confirmBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px',
    border: 'none',
    borderRadius: 10,
    background: '#16a34a',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cancelBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 16px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 10,
    background: 'transparent',
    color: '#6b7280',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
