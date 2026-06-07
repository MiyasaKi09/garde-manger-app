'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getFoodEmoji } from '@/lib/foodEmoji'
import './courses.css'

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
      // Ouvre sur la semaine qui couvre aujourd'hui (comme le planning), sinon la dernière.
      const today = new Date().toISOString().split('T')[0]
      let idx = d.imports.findIndex(i =>
        i.date_range_start && i.date_range_end &&
        i.date_range_start <= today && i.date_range_end >= today)
      if (idx < 0) idx = 0
      setImportIndex(idx)
      await loadItems(d.imports[idx])
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
  const remaining = totalCount - checkedCount

  if (loading) return (
    <div className="v21-page courses-page" aria-busy="true" aria-label="Chargement des courses">
      <div className="v21-skel" style={{ height: 150 }} />
      <div className="cou-skel-list">
        {[0, 1, 2, 3, 4].map(i => <div key={i} className="v21-skel" style={{ height: 52 }} />)}
      </div>
    </div>
  )

  if (!importId || items.length === 0) return (
    <div className="v21-page courses-page">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Courses</span>
          <h1 className="v21-title">Liste.</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Rien à acheter pour l'instant.</p>
        </div>
      </header>
      <div className="v21-empty cou-empty">
        <div className="cou-empty-ico"><ShoppingCart size={32} /></div>
        <p>Demande un planning à Myko pour générer la liste de courses.</p>
        <Link href="/planning/assistant" className="v21-btn">Créer un planning</Link>
      </div>
    </div>
  )

  return (
    <div className="v21-page courses-page">

      {/* HERO ÉDITORIAL */}
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Courses</span>
          <h1 className="v21-title">Liste.</h1>
          <div className="v21-rule" />
          <p className="v21-lede">{remaining} restant{remaining !== 1 ? 's' : ''} sur cette semaine.</p>
        </div>
        <div className="v21-hero-side">
          <div className="cou-actions">
            <button onClick={handleRebuild} disabled={rebuilding} className="v21-btn ghost sm"
              title="Synchroniser : créer les recettes du plan, relier les ingrédients, marquer ce que tu as déjà en stock">
              {rebuilding ? '…' : 'Stock'}
            </button>
            <button onClick={handleFetchImages} disabled={fetchingImages} className="v21-btn ghost sm">
              {fetchingImages ? '…' : 'Photos'}
            </button>
          </div>
        </div>
      </header>

      {/* PROGRESSION GLOBALE */}
      <section className="v21-section strong cou-overview">
        <div className="cou-bignum-row">
          <div className="v21-bignum">{checkedCount} / {totalCount}</div>
          {allTotalCount !== totalCount && (
            <span className="cou-allcount">{allCheckedCount}/{allTotalCount} au total</span>
          )}
        </div>
        <div className="v21-prog"><div className="v21-prog-fill" style={{ width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }} /></div>

        {imports.length > 1 && (
          <div className="cou-impnav">
            <button onClick={() => goToImport(importIndex + 1)} disabled={importIndex >= imports.length - 1}
              className="cou-impbtn" aria-label="Semaine précédente">
              <ChevronLeft size={16} />
            </button>
            <span className="cou-implabel">{importLabel || 'Semaine'}</span>
            <button onClick={() => goToImport(importIndex - 1)} disabled={importIndex <= 0}
              className="cou-impbtn" aria-label="Semaine suivante">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        {imports.length <= 1 && importLabel && <p className="cou-implabel-static">{importLabel}</p>}
      </section>

      {fetchResult && (
        <div className={`cou-result ${fetchResult.error ? 'error' : 'ok'}`}>
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

      {/* ONGLETS DE SEMAINE */}
      {weekLabels.length > 1 && (
        <div className="v21-tabs" role="tablist" aria-label="Filtrer par semaine">
          {weekLabels.map(week => (
            <button
              key={week}
              role="tab"
              aria-selected={activeWeek === week}
              onClick={() => setActiveWeek(week)}
              className={`v21-tab ${activeWeek === week ? 'on' : ''}`}
            >
              {week}
            </button>
          ))}
        </div>
      )}

      {/* CATÉGORIES */}
      {Object.entries(groupedItems).map(([category, catItems]) => {
        const catChecked = catItems.filter(i => i.checked).length
        return (
          <section key={category} className="cou-cat">
            <div className="cou-cat-h">
              <span className="v21-cat">{category}</span>
              <span className="cou-cat-c">{catChecked} / {catItems.length}</span>
            </div>
            <div className="cou-items">
              {catItems.map(item => {
                const isExpanded = expandedItems.has(item.id)
                const hasContainer = !!(item.container_qty && item.container_size)
                return (
                  <div key={item.id} className="cou-item-wrap">
                    <div
                      onClick={() => toggleItem(item.id)}
                      className={`cou-row${item.checked ? ' checked' : ''}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && toggleItem(item.id)}
                    >
                      <span className={`cou-check${item.checked ? ' on' : ''}`}>
                        {item.checked && <Check size={12} color="#fff" />}
                      </span>
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt="" className="cou-thumb" loading="lazy" />
                      ) : (
                        <span className="cou-emoji">{getFoodEmoji(item.product_name, item.category)}</span>
                      )}
                      <span className="cou-label">
                        <span className={`cou-name${item.checked ? ' checked' : ''}`}>{item.product_name}</span>
                        {item.notes && <span className="cou-notes">{item.notes}</span>}
                      </span>
                      {item.quantity && <span className="cou-qty">{item.quantity}</span>}
                      {item.stocking && <span className="cou-badge stocking">…</span>}
                      {item.stocked && !item.stocking && (
                        <span className="cou-badge stocked"><Package size={11} /> rangé</span>
                      )}
                      {item.stockError && !item.stocking && (
                        <span className="cou-badge error" title={item.stockErrorMsg || ''}>non rangé</span>
                      )}
                      <button
                        className={`cou-cont-toggle${hasContainer ? ' has' : ''}${isExpanded ? ' on' : ''}`}
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
                    </div>
                    {isExpanded && (
                      <div className="cou-cont-picker" onClick={e => e.stopPropagation()}>
                        <span className="cou-cont-label">Conditionnement</span>
                        <div className="cou-cont-fields">
                          <input
                            type="number"
                            min="1"
                            placeholder="Nb"
                            className="cou-cont-input qty"
                            value={getContainerEdit(item, 'container_qty')}
                            onChange={e => setContainerField(item.id, 'container_qty', e.target.value)}
                            onBlur={() => saveContainerEdits(item)}
                          />
                          <span className="cou-cont-x">×</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Taille"
                            className="cou-cont-input size"
                            value={getContainerEdit(item, 'container_size')}
                            onChange={e => setContainerField(item.id, 'container_size', e.target.value)}
                            onBlur={() => saveContainerEdits(item)}
                          />
                          <select
                            className="cou-cont-unit"
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
                          <span className="cou-cont-sum">
                            {item.container_qty} × {item.container_size} {item.container_unit}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
