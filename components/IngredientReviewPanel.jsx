'use client'

import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '@/lib/authFetch'
import { toast } from '@/components/Toast'
import './IngredientReviewPanel.css'

/**
 * Panneau « Aliments à confirmer » — vague 2 (liaisons).
 * Liste les liaisons en attente (review_status pending/proposed) sur les
 * ingrédients de fiches recettes et les articles de courses, plus les
 * aliments canoniques auto-créés (verified=false).
 * Actions : Confirmer, ou Re-lier via une mini-recherche du référentiel.
 *
 * Consomme GET/POST /api/ingredients/review.
 */
export default function IngredientReviewPanel({ open, onClose, onChanged }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busyKey, setBusyKey] = useState(null)
  // relink : { target, id } en cours de re-liaison
  const [relinkTarget, setRelinkTarget] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/ingredients/review')
      const json = await res.json().catch(() => ({}))
      if (res.ok) setData(json)
      else toast.error(json.error || 'Erreur de chargement des liaisons')
    } catch {
      toast.error('Erreur de chargement des liaisons')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (open) load() }, [open, load])

  // Recherche référentiel pour la re-liaison
  useEffect(() => {
    if (!relinkTarget || query.trim().length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await authFetch(`/api/ingredients/search?q=${encodeURIComponent(query.trim())}&limit=6`)
        const json = await res.json().catch(() => ({}))
        setResults(json.results || [])
      } catch { setResults([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [query, relinkTarget])

  async function act(body, key) {
    setBusyKey(key)
    try {
      const res = await authFetch('/api/ingredients/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(json.error || 'Action impossible'); return }
      setRelinkTarget(null); setQuery(''); setResults([])
      await load()
      onChanged?.()
    } finally {
      setBusyKey(null)
    }
  }

  if (!open) return null

  const groups = [
    { key: 'shopping_items', title: 'Articles de courses', target: 'shopping_item', nameOf: it => it.product_name },
    { key: 'recipe_ingredients', title: 'Ingrédients de recettes', target: 'recipe_ingredient', nameOf: it => `${it.raw_name}${it.recipe_title ? ` — ${it.recipe_title}` : ''}` },
    { key: 'canonicals', title: 'Aliments créés automatiquement', target: 'canonical', nameOf: it => it.canonical_name },
  ]
  const total = groups.reduce((n, g) => n + (data?.[g.key]?.length || 0), 0)

  return (
    <div className="irp-overlay" onClick={onClose}>
      <div className="irp-card" role="dialog" aria-modal="true" aria-label="Aliments à confirmer" onClick={e => e.stopPropagation()}>
        <div className="irp-head">
          <span className="irp-title">Aliments à confirmer</span>
          <button className="irp-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {loading && <p className="irp-empty">Chargement…</p>}
        {!loading && total === 0 && (
          <p className="irp-empty">Tout est confirmé — rien à revoir ✨</p>
        )}

        {!loading && groups.map(g => {
          const items = data?.[g.key] || []
          if (!items.length) return null
          return (
            <section key={g.key} className="irp-group">
              <h3 className="irp-group-title">{g.title}</h3>
              {items.map(it => {
                const key = `${g.target}:${it.id}`
                const isRelinking = relinkTarget && relinkTarget.key === key
                return (
                  <div key={key} className="irp-row">
                    <div className="irp-row-main">
                      <span className="irp-name">{g.nameOf(it)}</span>
                      {it.review_status === 'proposed' && <span className="irp-badge proposed">proposé</span>}
                      {it.review_status === 'pending' && <span className="irp-badge pending">à valider</span>}
                      {g.key === 'canonicals' && <span className="irp-badge pending">auto</span>}
                    </div>
                    <div className="irp-actions">
                      <button
                        className="irp-btn confirm"
                        disabled={busyKey === key}
                        onClick={() => act({ action: 'confirm', target: g.target, id: it.id }, key)}
                      >
                        Confirmer
                      </button>
                      {g.target !== 'canonical' && (
                        <button
                          className="irp-btn"
                          onClick={() => { setRelinkTarget(isRelinking ? null : { key, target: g.target, id: it.id }); setQuery(''); setResults([]) }}
                        >
                          Re-lier
                        </button>
                      )}
                    </div>
                    {isRelinking && (
                      <div className="irp-relink">
                        <input
                          autoFocus
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          placeholder="Chercher l'aliment correct…"
                          className="irp-input"
                        />
                        {results.map((r, i) => (
                          <button
                            key={i}
                            className="irp-result"
                            disabled={busyKey === key}
                            onClick={() => act({
                              action: 'relink',
                              target: g.target,
                              id: it.id,
                              canonical_food_id: r.canonical_food_id || null,
                              archetype_id: r.canonical_food_id ? null : (r.archetype_id || null),
                            }, key)}
                          >
                            {r.name} <span className="irp-result-type">{r.canonical_food_id ? 'aliment' : 'variante'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </section>
          )
        })}
      </div>
    </div>
  )
}
