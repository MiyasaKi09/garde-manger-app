'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check, Package } from 'lucide-react'
import Link from 'next/link'
import { getFoodEmoji } from '@/lib/foodEmoji'
import './courses.css'

function weekArrowStyle(disabled) {
  return {
    width: 30, height: 30, borderRadius: '50%',
    border: '1px solid var(--line, #d8dcc8)',
    background: 'var(--surface, #fff)',
    color: disabled ? 'var(--ink-3, #b5b8a6)' : 'var(--ink-1, #2f3320)',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontSize: 18, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }
}

export default function CoursesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [importId, setImportId] = useState(null)
  const [importLabel, setImportLabel] = useState('')
  const [imports, setImports] = useState([])
  const [importIndex, setImportIndex] = useState(0)
  const [activeWeek, setActiveWeek] = useState(null)
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [containerEdits, setContainerEdits] = useState({})
  const [fetchingImages, setFetchingImages] = useState(false)
  const [fetchResult, setFetchResult] = useState(null)
  const [rebuilding, setRebuilding] = useState(false)

  async function loadItems(imp) {
    setImportId(imp.id)
    setImportLabel(imp.month_label || '')
    const res = await authFetch(`/api/planning/imports/${imp.id}`)
    const d = await res.json()
    const list = d.shoppingItems || []
    setItems(list)
    const weeks = [...new Set(list.map(i => i.week_label))].sort()
    setActiveWeek(weeks.length > 0 ? weeks[0] : null)
  }

  async function goToImport(idx) {
    if (idx < 0 || idx >= imports.length || idx === importIndex) return
    setImportIndex(idx)
    setExpandedItems(new Set())
    await loadItems(imports[idx])
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await authFetch('/api/planning/imports')
      const d = await res.json()
      if (!d.imports?.length) { setLoading(false); return }

      setImports(d.imports)
      setImportIndex(0)
      await loadItems(d.imports[0])
      setLoading(false)
    }
    load()
  }, [])

  const weekLabels = useMemo(() => {
    return [...new Set(items.map(i => i.week_label))].sort()
  }, [items])

  const filteredItems = useMemo(() => {
    if (!activeWeek) return items
    return items.filter(i => i.week_label === activeWeek)
  }, [items, activeWeek])

  const groupedItems = useMemo(() => {
    const groups = {}
    for (const item of filteredItems) {
      const cat = item.category || 'Autres'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    return groups
  }, [filteredItems])

  async function addToStock(item) {
    try {
      const res = await authFetch('/api/courses/add-to-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          productName: item.product_name,
          quantity: item.quantity,
          canonicalFoodId: item.canonical_food_id ?? null,
          archetypeId: item.archetype_id ?? null,
          containerQty: item.container_qty ?? null,
          containerSize: item.container_size ?? null,
          containerUnit: item.container_unit ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Erreur inconnue' }
      }
      return { success: true, lotsCreated: data.lotsCreated }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function updateContainer(itemId, containerQty, containerSize, containerUnit) {
    try {
      await authFetch(`/api/courses/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container_qty: containerQty, container_size: containerSize, container_unit: containerUnit }),
      })
      setItems(prev => prev.map(i =>
        i.id === itemId ? { ...i, container_qty: containerQty, container_size: containerSize, container_unit: containerUnit } : i
      ))
    } catch {
      // silent — UI already reflects the edit via containerEdits state
    }
  }

  function setContainerField(itemId, field, value) {
    setContainerEdits(prev => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), [field]: value } }))
  }

  function getContainerEdit(item, field) {
    const edits = containerEdits[item.id]
    if (edits && field in edits) return edits[field]
    return item[field] ?? ''
  }

  function saveContainerEdits(item) {
    const edits = containerEdits[item.id] || {}
    const qty = parseInt(edits.container_qty ?? item.container_qty) || null
    const size = parseFloat(String(edits.container_size ?? item.container_size).replace(',', '.')) || null
    const unit = edits.container_unit ?? item.container_unit ?? null
    updateContainer(item.id, qty, size, unit)
  }

  async function toggleItem(itemId) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const newChecked = !item.checked
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: newChecked, stocking: newChecked } : i))

    try {
      await authFetch(`/api/courses/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: newChecked }),
      })

      if (newChecked) {
        try {
          const result = await addToStock(item)
          if (result.success) {
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, stocked: true, stocking: false } : i))
          } else {
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, stocking: false, stockError: true, stockErrorMsg: result.error } : i))
          }
        } catch (stockErr) {
          setItems(prev => prev.map(i => i.id === itemId ? { ...i, stocking: false, stockError: true, stockErrorMsg: stockErr.message } : i))
        }
      } else {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, stocked: false, stocking: false, stockError: false } : i))
      }
    } catch {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: !newChecked, stocking: false } : i))
    }
  }

  async function handleFetchImages() {
    if (!importId) return
    setFetchingImages(true)
    setFetchResult(null)
    try {
      const res = await authFetch('/api/courses/fetch-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId }),
      })
      const data = await res.json()
      if (data.error) {
        setFetchResult({ error: data.error })
      } else {
        setFetchResult({ updated: data.updated, total: data.total })
        if (data.updated > 0) {
          const res2 = await authFetch(`/api/planning/imports/${importId}`)
          const d2 = await res2.json()
          setItems(d2.shoppingItems || [])
        }
      }
    } catch (err) {
      setFetchResult({ error: err.message })
    } finally {
      setFetchingImages(false)
    }
  }

  async function handleRebuild() {
    if (!importId) return
    setRebuilding(true)
    setFetchResult(null)
    try {
      const res = await authFetch('/api/courses/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId }),
      })
      const data = await res.json()
      if (data.error) {
        setFetchResult({ error: data.error })
      } else {
        const res2 = await authFetch(`/api/planning/imports/${importId}`)
        const d2 = await res2.json()
        setItems(d2.shoppingItems || [])
        setFetchResult({ items: data.items, mode: data.mode, inStock: data.inStock, recipesCreated: data.recipesCreated })
      }
    } catch (err) {
      setFetchResult({ error: err.message })
    } finally {
      setRebuilding(false)
    }
  }

  const checkedCount = filteredItems.filter(i => i.checked).length
  const totalCount = filteredItems.length
  const allCheckedCount = items.filter(i => i.checked).length
  const allTotalCount = items.length

  if (loading) return (
    <div className="myko-loading">Chargement...</div>
  )

  if (!importId || items.length === 0) return (
    <>
      <div className="myko-canvas" aria-hidden="true" />
      <div className="courses-page">
        <div className="hero-header">
          <div className="hero-content">
            <div className="hero-text">
              <span className="hero-eyebrow">Courses</span>
              <h1 className="hero-title">Liste de courses</h1>
            </div>
          </div>
        </div>
        <div className="empty-state-card courses-empty">
          <div className="empty-icon"><ShoppingCart size={40} /></div>
          <h3>Pas de liste de courses</h3>
          <p>Demande un planning à Myko pour générer la liste</p>
          <Link href="/planning/assistant" className="courses-cta-btn">Créer un planning</Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className="myko-canvas" aria-hidden="true" />
      <div className="courses-page">
        <div className="hero-header">
          <div className="hero-content">
            <div className="hero-text">
              <span className="hero-eyebrow">Courses</span>
              <h1 className="hero-title">Liste de courses</h1>
              {imports.length > 1 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                  <button
                    onClick={() => goToImport(importIndex + 1)}
                    disabled={importIndex >= imports.length - 1}
                    aria-label="Semaine précédente"
                    style={weekArrowStyle(importIndex >= imports.length - 1)}
                  >‹</button>
                  <p className="hero-subtitle" style={{ margin: 0, minWidth: 180, textAlign: 'center' }}>
                    {importLabel || 'Semaine'}
                  </p>
                  <button
                    onClick={() => goToImport(importIndex - 1)}
                    disabled={importIndex <= 0}
                    aria-label="Semaine suivante"
                    style={weekArrowStyle(importIndex <= 0)}
                  >›</button>
                </div>
              ) : (
                importLabel && <p className="hero-subtitle">{importLabel}</p>
              )}
              {allTotalCount > 0 && (
                <p className="hero-subtitle">{allCheckedCount}/{allTotalCount} articles cochés</p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
              <div className="courses-progress-bar-outer" style={{ width: 80 }}>
                <div
                  className="courses-progress-bar-inner"
                  style={{ width: allTotalCount ? `${(allCheckedCount / allTotalCount) * 100}%` : '0%' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleRebuild}
                  disabled={rebuilding}
                  className="courses-photo-btn"
                  title="Synchroniser : créer les recettes du plan, relier les ingrédients, marquer ce que tu as déjà en stock"
                >
                  {rebuilding ? '...' : '♻️ Stock'}
                </button>
                <button
                  onClick={handleFetchImages}
                  disabled={fetchingImages}
                  className="courses-photo-btn"
                >
                  {fetchingImages ? '...' : 'Photos'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {fetchResult && (
          <div className={`courses-fetch-result ${fetchResult.error ? 'error' : 'success'}`}>
            {fetchResult.error
              ? fetchResult.error
              : fetchResult.items != null
                ? (fetchResult.mode === 'enriched'
                    ? `${fetchResult.items} articles reliés au stock${fetchResult.inStock > 0 ? ` · ${fetchResult.inStock} déjà en stock` : ''}`
                    : `Liste recalculée — ${fetchResult.items} article${fetchResult.items > 1 ? 's' : ''}`)
                  + (fetchResult.recipesCreated > 0 ? ` · ${fetchResult.recipesCreated} recette(s) ajoutée(s)` : '')
                : `${fetchResult.updated}/${fetchResult.total} photos récupérées`}
          </div>
        )}

        {weekLabels.length > 1 && (
          <div className="courses-week-tabs">
            {weekLabels.map(week => (
              <button
                key={week}
                onClick={() => setActiveWeek(week)}
                className={`courses-week-tab${activeWeek === week ? ' active' : ''}`}
              >
                {week}
              </button>
            ))}
          </div>
        )}

        {weekLabels.length > 1 && (
          <div className="courses-week-progress">
            <span className="courses-week-progress-text">{checkedCount}/{totalCount} articles</span>
            <div className="courses-progress-bar-outer" style={{ flex: 1 }}>
              <div
                className="courses-progress-bar-inner"
                style={{ width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {Object.entries(groupedItems).map(([category, catItems]) => {
          const catChecked = catItems.filter(i => i.checked).length
          return (
            <div key={category} className="courses-cat-section">
              <div className="courses-cat-header">
                <span>{category}</span>
                <span>{catChecked}/{catItems.length}</span>
              </div>
              {catItems.map(item => {
                const isExpanded = expandedItems.has(item.id)
                const hasContainer = !!(item.container_qty && item.container_size)
                return (
                  <div key={item.id} className="courses-item-wrapper">
                    <div
                      onClick={() => toggleItem(item.id)}
                      className={`courses-item-row${item.checked ? ' checked' : ''}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && toggleItem(item.id)}
                    >
                      <div className={`courses-checkbox${item.checked ? ' checked' : ''}`}>
                        {item.checked && <Check size={13} color="#fff" />}
                      </div>
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt="" className="courses-item-thumb" loading="lazy" />
                      ) : (
                        <span className="courses-item-emoji">{getFoodEmoji(item.product_name, item.category)}</span>
                      )}
                      <div className="courses-item-label">
                        <span className={`courses-item-name${item.checked ? ' checked' : ''}`}>
                          {item.product_name}
                        </span>
                        {item.notes && (
                          <span className="courses-item-notes">{item.notes}</span>
                        )}
                      </div>
                      {item.quantity && (
                        <span className="courses-item-qty">{item.quantity}</span>
                      )}
                      {item.stocking && (
                        <span className="courses-badge-stocking">...</span>
                      )}
                      {item.stocked && !item.stocking && (
                        <span className="courses-badge-stocked"><Package size={11} /> rangé</span>
                      )}
                      {item.stockError && !item.stocking && (
                        <span className="courses-badge-error" title={item.stockErrorMsg || ''}>non rangé</span>
                      )}
                    </div>
                    <button
                      className={`courses-container-toggle${hasContainer ? ' has-container' : ''}${isExpanded ? ' active' : ''}`}
                      onClick={e => {
                        e.stopPropagation()
                        setExpandedItems(prev => {
                          const next = new Set(prev)
                          next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                          return next
                        })
                      }}
                      title="Conditionnement (nb de contenants)"
                      aria-label="Configurer le conditionnement"
                    >
                      <Package size={13} />
                    </button>
                    {isExpanded && (
                      <div className="container-picker" onClick={e => e.stopPropagation()}>
                        <span className="container-picker-label">Conditionnement</span>
                        <div className="container-picker-fields">
                          <input
                            type="number"
                            min="1"
                            placeholder="Nb"
                            className="container-input container-input-qty"
                            value={getContainerEdit(item, 'container_qty')}
                            onChange={e => setContainerField(item.id, 'container_qty', e.target.value)}
                            onBlur={() => saveContainerEdits(item)}
                          />
                          <span className="container-times">×</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Taille"
                            className="container-input container-input-size"
                            value={getContainerEdit(item, 'container_size')}
                            onChange={e => setContainerField(item.id, 'container_size', e.target.value)}
                            onBlur={() => saveContainerEdits(item)}
                          />
                          <select
                            className="container-unit-select"
                            value={getContainerEdit(item, 'container_unit') || 'L'}
                            onChange={e => {
                              setContainerField(item.id, 'container_unit', e.target.value)
                              saveContainerEdits(item)
                            }}
                          >
                            <option value="L">L</option>
                            <option value="ml">ml</option>
                            <option value="cl">cl</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="unités">unités</option>
                          </select>
                        </div>
                        {item.container_qty && item.container_size && (
                          <span className="container-picker-summary">
                            {item.container_qty} × {item.container_size} {item.container_unit}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )
}
