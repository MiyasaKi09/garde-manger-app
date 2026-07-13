'use client'

/**
 * StoragePlanSheet.jsx
 *
 * Feuille de contrôle « Ranger mes N achats ».
 * Ouverte depuis app/courses/page.js après cochage d'un ou plusieurs articles.
 *
 * Props :
 *   items          array<ShoppingItem>  — snapshot des articles cochés non encore rangés
 *   onClose        () => void           — ferme sans ranger
 *   onItemStored   (itemId, lotIds) => void  — callback après rangement réussi
 *   onDone         ({ stored, errors }) => void  — fin du flux (user clique Terminé)
 */

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, AlertTriangle, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'
import { getFoodEmoji } from '@/lib/foodEmoji'
import './StoragePlanSheet.css'

const STORAGE_LABELS = {
  pantry: 'Garde-manger',
  fridge: 'Frigo',
  freezer: 'Congélateur',
}

function formatDate(value) {
  if (!value) return null
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
    .format(new Date(`${value}T12:00:00Z`))
}

/* ── Détermine si un article nécessite une confirmation de l'utilisateur ────── */
function isToConfirm(item) {
  return (
    item.review_status === 'pending' ||
    item.review_status === 'proposed' ||
    (!item.canonical_food_id && !item.archetype_id)
  )
}

/* ── Composant principal ────────────────────────────────────────────────────── */
export default function StoragePlanSheet({ items, onClose, onItemStored, onDone }) {
  // 'plan' → 'storing' → 'done'
  const [phase, setPhase] = useState('plan')

  // Quantités éditables (pour les lignes « à confirmer »)
  const [quantityEdits, setQuantityEdits] = useState({})
  const [storageEdits, setStorageEdits] = useState({})
  const [dateEdits, setDateEdits] = useState({})

  // Décisions serveur : même moteur que celui qui crée effectivement les lots.
  const [storagePlans, setStoragePlans] = useState({})
  const [planStatus, setPlanStatus] = useState('loading')
  const [planError, setPlanError] = useState(null)

  // Lignes dépliées (auto-dépliées si review_status nécessite confirmation)
  const [expandedItems, setExpandedItems] = useState(() => {
    const set = new Set()
    items.forEach(i => { if (isToConfirm(i)) set.add(i.id) })
    return set
  })

  // Progression
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  // Résultats par item : { ok, lotIds? } ou { ok: false, error }
  const [results, setResults] = useState({})

  const storedCount = useMemo(() => Object.values(results).filter(r => r.ok).length, [results])
  const errorCount  = useMemo(() => Object.values(results).filter(r => !r.ok).length,  [results])
  const toConfirmCount = items.filter(item =>
    isToConfirm(item) || storagePlans[item.id]?.requiresConfirmation
  ).length
  const unresolvedStorageCount = items.filter(item => {
    const decision = storagePlans[item.id]
    return !decision || !decision.valid || (decision.requiresConfirmation && !storageEdits[item.id])
  }).length

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  useEffect(() => {
    let cancelled = false

    async function loadStoragePlans() {
      setPlanStatus('loading')
      setPlanError(null)
      try {
        const res = await authFetch('/api/courses/storage-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map(item => ({
              id: item.id,
              productName: item.product_name,
              category: item.category,
              canonicalFoodId: item.canonical_food_id ?? null,
              archetypeId: item.archetype_id ?? null,
              purchaseState: item.purchase_state ?? 'unknown',
              foodState: item.food_state ?? 'unknown',
            })),
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Décision de conservation indisponible')

        const next = {}
        for (const entry of data.decisions || []) {
          if (entry.decision) next[entry.id] = entry.decision
          else next[entry.id] = { valid: false, requiresConfirmation: true, error: entry.error }
        }
        if (cancelled) return
        setStoragePlans(next)
        setExpandedItems(previous => {
          const expanded = new Set(previous)
          items.forEach(item => {
            if (next[item.id]?.requiresConfirmation || !next[item.id]?.valid) expanded.add(item.id)
          })
          return expanded
        })
        setPlanStatus('ready')
      } catch (error) {
        if (cancelled) return
        setPlanError(error.message)
        setPlanStatus('error')
      }
    }

    loadStoragePlans()
    return () => { cancelled = true }
  }, [items])

  function toggleExpanded(itemId) {
    setExpandedItems(prev => {
      const next = new Set(prev)
      next.has(itemId) ? next.delete(itemId) : next.add(itemId)
      return next
    })
  }

  /* ── Lancement du rangement en pool de 3 ──────────────────────────────────── */
  async function handleStore() {
    setPhase('storing')
    setProgress({ done: 0, total: items.length })

    let idx = 0

    async function worker() {
      while (true) {
        const i = idx++
        if (i >= items.length) break
        const item = items[i]

        // Quantité : édit utilisateur (si non vide) ou valeur DB
        const qty =
          quantityEdits[item.id] !== undefined && quantityEdits[item.id] !== ''
            ? quantityEdits[item.id]
            : item.quantity

        let result
        try {
          const res = await authFetch('/api/courses/add-to-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemId: item.id,
              productName: item.product_name,
              quantity: qty,
              category: item.category,
              canonicalFoodId: item.canonical_food_id ?? null,
              archetypeId:     item.archetype_id ?? null,
              containerQty:    item.container_qty ?? null,
              containerSize:   item.container_size ?? null,
              containerUnit:   item.container_unit ?? null,
              purchaseState:   item.purchase_state ?? 'unknown',
              foodState:       item.food_state ?? 'unknown',
              storageMethod:   storageEdits[item.id] ?? null,
              useByDate:       dateEdits[item.id] || null,
            }),
          })
          const data = await res.json()
          const itemResult =
            data.items?.find(r => r.id === item.id) ?? data.items?.[0]
          const ok = itemResult?.ok ?? data.success ?? false

          if (ok) {
            const lotIds = itemResult?.lot_id
              ? [itemResult.lot_id]
              : (data.lotIds || [])
            result = { ok: true, lotIds }

            // Persiste les lot_ids sur l'article (best-effort)
            try {
              await authFetch(`/api/courses/shopping-items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ created_lot_ids: lotIds }),
              })
            } catch { /* best effort */ }

            onItemStored(item.id, lotIds)
          } else {
            result = {
              ok: false,
              error: itemResult?.error || data.error || 'Erreur inconnue',
            }
          }
        } catch (err) {
          result = { ok: false, error: err.message }
        }

        setResults(prev => ({ ...prev, [item.id]: result }))
        setProgress(prev => ({ ...prev, done: prev.done + 1 }))
      }
    }

    // Pool de 3 workers concurrents
    const pool = Array.from({ length: Math.min(3, items.length) }, () => worker())
    await Promise.all(pool)
    setPhase('done')
  }

  function handleDone() {
    onDone({ stored: storedCount, errors: errorCount })
  }

  /* ── Rendu ─────────────────────────────────────────────────────────────────── */
  const canClose = phase !== 'storing'

  const content = (
    <div
      className="sps-backdrop"
      onClick={canClose ? onClose : undefined}
      role="presentation"
    >
      <div
        className="sps-sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Ranger les achats"
      >

        {/* ── Header ── */}
        <div className="sps-header">
          <div className="sps-header-left">
            <span className="sps-header-icon"><Package size={15} /></span>
            <span className="sps-header-title">
              Ranger {items.length} achat{items.length !== 1 ? 's' : ''}
            </span>
            {phase === 'plan' && toConfirmCount > 0 && (
              <span className="sps-header-warn">
                <AlertTriangle size={11} />
                {toConfirmCount} à confirmer
              </span>
            )}
          </div>
          {canClose && (
            <button
              className="sps-close"
              onClick={onClose}
              aria-label="Fermer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Barre de progression (pendant le rangement) ── */}
        {(phase === 'storing' || phase === 'done') && (
          <div className="sps-progress-wrap">
            <div className="sps-progress">
              <div className="sps-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="sps-progress-label">
              {progress.done} / {progress.total}
            </span>
          </div>
        )}

        {phase === 'plan' && planStatus === 'loading' && (
          <div className="sps-plan-state" role="status">
            Vérification des lieux et des dates…
          </div>
        )}
        {phase === 'plan' && planStatus === 'error' && (
          <div className="sps-plan-state error" role="alert">
            <AlertTriangle size={12} /> {planError}
          </div>
        )}

        {/* ── Liste des articles ── */}
        <div className="sps-body">
          {items.map(item => {
            const decision = storagePlans[item.id]
            const selectedMethod = storageEdits[item.id] || decision?.method || null
            const storage = {
              label: selectedMethod ? STORAGE_LABELS[selectedMethod] : 'À confirmer',
              badge: selectedMethod || 'pending',
            }
            const confirm  = isToConfirm(item) || decision?.requiresConfirmation || !decision?.valid
            const result   = results[item.id]
            const expanded = expandedItems.has(item.id) && !result
            const qty      = quantityEdits[item.id] !== undefined
              ? quantityEdits[item.id]
              : (item.quantity || '')

            return (
              <div
                key={item.id}
                className={[
                  'sps-row',
                  confirm  ? 'to-confirm' : '',
                  result?.ok           ? 'stored'  : '',
                  result && !result.ok ? 'errored' : '',
                ].filter(Boolean).join(' ')}
              >
                {/* Ligne principale */}
                <div className="sps-row-main">
                  <span className="sps-row-emoji">
                    {getFoodEmoji(item.product_name, item.category)}
                  </span>
                  <span className="sps-row-name">{item.product_name}</span>
                  {qty && <span className="sps-row-qty">{qty}</span>}
                  <span className={`sps-badge sps-badge-${storage.badge}`}>
                    {storage.label}
                  </span>

                  {/* État : résultat ou bouton déplier */}
                  {result?.ok && (
                    <span className="sps-row-ok" aria-label="Rangé">
                      <Check size={13} />
                    </span>
                  )}
                  {result && !result.ok && (
                    <span className="sps-row-err-icon" title={result.error}>!</span>
                  )}
                  {!result && confirm && (
                    <button
                      className="sps-row-expand"
                      onClick={() => toggleExpanded(item.id)}
                      aria-label={expanded ? 'Réduire' : 'Modifier la quantité'}
                      aria-expanded={expanded}
                    >
                      {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                </div>

                {!result && decision?.valid && selectedMethod && (
                  <div className="sps-row-meta">
                    <span>{decision.reason}</span>
                    {decision.expirationDate && (
                      <span>· {decision.expiryKind === 'DDM' ? 'DDM' : 'DLC'} {formatDate(decision.expirationDate)}</span>
                    )}
                    <span>· source {decision.storageSource.replaceAll('_', ' ')}</span>
                  </div>
                )}

                {/* Détail déplié (articles à confirmer) */}
                {expanded && (
                  <div className="sps-row-detail">
                    {isToConfirm(item) && (
                      <span className="sps-row-warn-label">
                        <AlertTriangle size={10} /> Produit non confirmé — vérifiez la quantité
                      </span>
                    )}
                    <div className="sps-row-edit">
                      <label className="sps-edit-label" htmlFor={`qty-${item.id}`}>
                        Quantité
                      </label>
                      <input
                        id={`qty-${item.id}`}
                        className="sps-edit-input"
                        type="text"
                        value={qty}
                        onChange={e =>
                          setQuantityEdits(prev => ({ ...prev, [item.id]: e.target.value }))
                        }
                        placeholder={item.quantity || 'ex : 500 g'}
                      />
                    </div>
                    {(decision?.requiresConfirmation || !decision?.valid) && (
                      <div className="sps-row-edit">
                        <label className="sps-edit-label" htmlFor={`storage-${item.id}`}>
                          Où était le produit en magasin ?
                        </label>
                        <select
                          id={`storage-${item.id}`}
                          className="sps-edit-input"
                          value={storageEdits[item.id] || ''}
                          onChange={event => setStorageEdits(previous => ({
                            ...previous,
                            [item.id]: event.target.value,
                          }))}
                        >
                          <option value="">Choisir…</option>
                          <option value="pantry" disabled={decision?.forbiddenMethods?.includes('pantry')}>Garde-manger</option>
                          <option value="fridge" disabled={decision?.forbiddenMethods?.includes('fridge')}>Réfrigérateur</option>
                          <option value="freezer" disabled={decision?.forbiddenMethods?.includes('freezer')}>Congélateur</option>
                        </select>
                      </div>
                    )}
                    <div className="sps-row-edit">
                      <label className="sps-edit-label" htmlFor={`date-${item.id}`}>
                        DLC de l'emballage <span className="sps-edit-optional">(facultatif)</span>
                      </label>
                      <input
                        id={`date-${item.id}`}
                        className="sps-edit-input"
                        type="date"
                        value={dateEdits[item.id] || ''}
                        onChange={event => setDateEdits(previous => ({
                          ...previous,
                          [item.id]: event.target.value,
                        }))}
                      />
                    </div>
                  </div>
                )}

                {/* Message d'erreur */}
                {result && !result.ok && (
                  <div className="sps-row-error-msg">{result.error}</div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Pied de page ── */}
        <div className="sps-footer">
          {phase === 'plan' && (
            <>
              <button className="sps-btn-ghost" onClick={onClose}>
                Annuler
              </button>
              <button
                className="sps-btn-primary"
                onClick={handleStore}
                disabled={planStatus !== 'ready' || unresolvedStorageCount > 0}
              >
                <Package size={14} />
                {unresolvedStorageCount > 0
                  ? `${unresolvedStorageCount} lieu${unresolvedStorageCount > 1 ? 'x' : ''} à confirmer`
                  : 'Tout ranger'}
              </button>
            </>
          )}

          {phase === 'storing' && (
            <span className="sps-status-label">Rangement en cours…</span>
          )}

          {phase === 'done' && errorCount === 0 && (
            <button className="sps-btn-primary" onClick={handleDone}>
              <Check size={14} /> Terminé — {storedCount} article{storedCount !== 1 ? 's' : ''} rangé{storedCount !== 1 ? 's' : ''}
            </button>
          )}

          {phase === 'done' && errorCount > 0 && (
            <>
              <span className="sps-status-label error">
                {errorCount} article{errorCount !== 1 ? 's' : ''} non rangé{errorCount !== 1 ? 's' : ''}
              </span>
              <button className="sps-btn-primary" onClick={handleDone}>
                Fermer
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
