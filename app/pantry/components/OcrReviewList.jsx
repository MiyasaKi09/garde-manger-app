'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/authFetch'
import { supabase } from '@/lib/supabaseClient'
import ImageCapture from '@/components/ui/ImageCapture'
import GlassCard from '@/components/ui/GlassCard'
import { Check, X, Loader2, Trash2, Edit3 } from 'lucide-react'

const CATEGORIES = [
  'Protéines', 'Légumes', 'Fruits', 'Crémerie', 'Féculents',
  'Épicerie', 'Surgelés', 'Condiments', 'Boissons', 'Sucré', 'Herbes', 'Autre'
]

/**
 * Flow OCR complet : capture image -> extraction -> review -> ajout batch.
 */
export default function OcrReviewList({ onClose, onItemsAdded }) {
  const [step, setStep] = useState('capture') // capture | loading | review | done
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)

  const handleImage = async (imageBase64) => {
    setStep('loading')
    setError(null)

    try {
      const res = await authFetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur OCR')

      if (data.items?.length > 0) {
        setItems(data.items.map((item, i) => ({ ...item, id: i, selected: true })))
        setStep('review')
      } else {
        setError('Aucun produit détecté dans l\'image. Essaie avec un screenshot plus net.')
        setStep('capture')
      }
    } catch (err) {
      setError(err.message)
      setStep('capture')
    }
  }

  const toggleItem = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i))
  }

  const updateItem = (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleAddAll = async () => {
    const selected = items.filter(i => i.selected)
    if (selected.length === 0) return

    setAdding(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Batch insert into inventory_lots
      const lots = selected.map(item => ({
        user_id: user.id,
        qty_remaining: item.quantity || 1,
        initial_qty: item.quantity || 1,
        unit: item.unit || 'pièce(s)',
        storage_method: guessStorage(item.category),
        notes: item.name,
        acquired_on: new Date().toISOString().split('T')[0],
      }))

      const { error: insertError } = await supabase
        .from('inventory_lots')
        .insert(lots)

      if (insertError) throw insertError

      setStep('done')
      setTimeout(() => {
        onItemsAdded?.(selected.length)
        onClose?.()
      }, 1500)
    } catch (err) {
      setError(err.message)
      setAdding(false)
    }
  }

  const selectedCount = items.filter(i => i.selected).length

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>
            {step === 'capture' && 'Scanner une liste'}
            {step === 'loading' && 'Analyse en cours...'}
            {step === 'review' && `${items.length} produits détectés`}
            {step === 'done' && 'Ajoutés !'}
          </h3>
          <button onClick={onClose} style={styles.closeBtn}><X size={18} /></button>
        </div>

        <div style={styles.body}>
          {/* Step: Capture */}
          {step === 'capture' && (
            <>
              <ImageCapture onImage={handleImage} onCancel={onClose} />
              {error && <p style={styles.error}>{error}</p>}
            </>
          )}

          {/* Step: Loading */}
          {step === 'loading' && (
            <div style={styles.loadingState}>
              <Loader2 size={32} color="#16a34a" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#6b7280', marginTop: 12 }}>Myko analyse l'image...</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Step: Review */}
          {step === 'review' && (
            <>
              <div style={styles.itemList}>
                {items.map(item => (
                  <GlassCard key={item.id} padding={10} radius={10} style={styles.itemCard}>
                    <div style={styles.itemRow}>
                      <button
                        onClick={() => toggleItem(item.id)}
                        style={{
                          ...styles.checkbox,
                          background: item.selected ? '#16a34a' : 'transparent',
                          borderColor: item.selected ? '#16a34a' : '#d1d5db',
                        }}
                      >
                        {item.selected && <Check size={12} color="white" />}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input
                          value={item.name}
                          onChange={e => updateItem(item.id, { name: e.target.value })}
                          style={styles.nameInput}
                        />
                        <div style={styles.detailRow}>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateItem(item.id, { quantity: parseFloat(e.target.value) || 1 })}
                            style={styles.qtyInput}
                          />
                          <input
                            value={item.unit}
                            onChange={e => updateItem(item.id, { unit: e.target.value })}
                            style={styles.unitInput}
                          />
                          <select
                            value={item.category}
                            onChange={e => updateItem(item.id, { category: e.target.value })}
                            style={styles.catSelect}
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={styles.itemActions}>
                        {item.confidence < 0.7 && (
                          <span style={styles.lowConfidence} title="Confiance faible">?</span>
                        )}
                        <button onClick={() => removeItem(item.id)} style={styles.removeBtn}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <div style={styles.actions}>
                <button
                  onClick={handleAddAll}
                  disabled={adding || selectedCount === 0}
                  style={{
                    ...styles.addBtn,
                    opacity: adding || selectedCount === 0 ? 0.5 : 1,
                  }}
                >
                  {adding ? 'Ajout en cours...' : `Ajouter ${selectedCount} produit${selectedCount > 1 ? 's' : ''}`}
                </button>
                <button onClick={() => setStep('capture')} style={styles.retryBtn}>
                  Rescanner
                </button>
              </div>
            </>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div style={styles.doneState}>
              <div style={{ fontSize: 48 }}>✅</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#16a34a' }}>
                {selectedCount} produit{selectedCount > 1 ? 's' : ''} ajouté{selectedCount > 1 ? 's' : ''} !
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function guessStorage(category) {
  const fridge = ['Protéines', 'Crémerie', 'Légumes', 'Fruits', 'Herbes']
  const freezer = ['Surgelés']
  if (fridge.includes(category)) return 'fridge'
  if (freezer.includes(category)) return 'freezer'
  return 'pantry'
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90vh',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px 20px 0 0',
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
    color: '#1f2937',
  },
  closeBtn: {
    border: 'none',
    background: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 6,
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
  },
  loadingState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  doneState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 16,
  },
  itemCard: {
    opacity: 1,
    transition: 'opacity 0.2s',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: 2,
  },
  nameInput: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    fontSize: 14,
    fontWeight: 500,
    color: '#1f2937',
    padding: '2px 0',
    fontFamily: 'inherit',
    outline: 'none',
  },
  detailRow: {
    display: 'flex',
    gap: 6,
    marginTop: 4,
  },
  qtyInput: {
    width: 50,
    padding: '4px 6px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.6)',
    color: '#374151',
  },
  unitInput: {
    width: 70,
    padding: '4px 6px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.6)',
    color: '#374151',
  },
  catSelect: {
    flex: 1,
    padding: '4px 6px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.6)',
    color: '#374151',
  },
  itemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  lowConfidence: {
    width: 18,
    height: 18,
    borderRadius: 9,
    background: 'rgba(245,158,11,0.15)',
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    border: 'none',
    background: 'none',
    color: '#d1d5db',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  addBtn: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: 10,
    background: '#16a34a',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  retryBtn: {
    padding: '12px 16px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 10,
    background: 'transparent',
    color: '#6b7280',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
    padding: '8px 12px',
    background: 'rgba(220,38,38,0.06)',
    borderRadius: 8,
  },
}
