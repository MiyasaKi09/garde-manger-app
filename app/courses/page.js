'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check, Package, ChevronLeft, ChevronRight, RefreshCw, Camera } from 'lucide-react'
import Link from 'next/link'
import './courses.css'

const RAYON_TINTS = ['#E4EBDC', '#F1E9D4', '#EFD9D0', '#E8E2D2', '#EADFCB', '#DEE7EC']

export default function CoursesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [importId, setImportId] = useState(null)
  const [importLabel, setImportLabel] = useState('')
  const [imports, setImports] = useState([])
  const [importIndex, setImportIndex] = useState(0)
  const [activeWeek, setActiveWeek] = useState(null)
  const [activeRayon, setActiveRayon] = useState(null) // null = défaut (1er rayon) · 'TOUT' = tout · sinon = catégorie
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
    setActiveRayon(null)
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

  async function handleFetchImages(replace = false) {
    if (!importId) return
    setFetchingImages(true)
    setFetchResult(null)
    try {
      const res = await authFetch('/api/courses/fetch-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId, replace }),
      })
      const data = await res.json()
      if (data.error) {
        setFetchResult({ error: data.error })
      } else {
        setFetchResult({ updated: data.updated, total: data.total, cleared: data.cleared })
        if (data.updated > 0 || data.cleared > 0) {
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

  // ── Dérivés de la refonte cockpit ──
  const categories = Object.keys(groupedItems)
  const showAll = activeRayon === 'TOUT'
  const currentRayon = showAll ? null : (categories.includes(activeRayon) ? activeRayon : (categories[0] ?? null))
  const currentItems = currentRayon ? groupedItems[currentRayon] : []
  const currentChecked = currentItems.filter(i => i.checked).length
  const currentIndex = currentRayon ? categories.indexOf(currentRayon) : -1
  const pct = totalCount ? Math.round((checkedCount / totalCount) * 100) : 0
  const weekIdx = activeWeek ? weekLabels.indexOf(activeWeek) : -1
  const goWeek = (delta) => {
    const ni = weekIdx + delta
    if (ni >= 0 && ni < weekLabels.length) { setActiveWeek(weekLabels[ni]); setActiveRayon(null) }
  }
  const catTint = (cat) => RAYON_TINTS[Math.max(0, categories.indexOf(cat)) % RAYON_TINTS.length]

  function renderCard(item, tint) {
    const isExpanded = expandedItems.has(item.id)
    const hasContainer = !!(item.container_qty && item.container_size)
    const letter = (item.product_name || '?').trim().charAt(0).toUpperCase()
    return (
      <div key={item.id} className={`cou-card${item.checked ? ' done' : ''}`}>
        <div
          className="cou-card-top"
          role="button"
          tabIndex={0}
          onClick={() => toggleItem(item.id)}
          onKeyDown={e => e.key === 'Enter' && toggleItem(item.id)}
        >
          <span className={`cou-card-chk${item.checked ? ' on' : ''}`}>
            {item.checked && <Check size={12} color="#fff" />}
          </span>
          <div className="cou-card-thumb" style={item.image_url ? undefined : { background: tint }}>
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt="" className="cou-card-img" loading="lazy" />
            ) : (
              <span className="cou-card-mono">{letter}</span>
            )}
          </div>
        </div>
        <div className="cou-card-info">
          <span className="cou-card-nm">{item.product_name}</span>
          <div className="cou-card-foot">
            {item.quantity && <span className="cou-card-qty">{item.quantity}</span>}
            {hasContainer && (
              <span className="cou-card-cond">{item.container_qty} × {item.container_size} {item.container_unit}</span>
            )}
            <button
              className={`cou-card-cont${hasContainer ? ' has' : ''}${isExpanded ? ' on' : ''}`}
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
              <Package size={12} />
            </button>
          </div>
          {item.notes && <span className="cou-card-notes">{item.notes}</span>}
          {item.stocking && <span className="cou-card-tag stocking">rangement…</span>}
          {item.stocked && !item.stocking && (
            <span className="cou-card-tag stocked"><Package size={10} /> rangé</span>
          )}
          {item.stockError && !item.stocking && (
            <span className="cou-card-tag error" title={item.stockErrorMsg || ''}>non rangé</span>
          )}
        </div>
        {isExpanded && (
          <div className="cou-card-picker" onClick={e => e.stopPropagation()}>
            <span className="cou-cont-label">Conditionnement</span>
            <div className="cou-cont-fields">
              <input
                type="number" min="1" placeholder="Nb" className="cou-cont-input qty"
                value={getContainerEdit(item, 'container_qty')}
                onChange={e => setContainerField(item.id, 'container_qty', e.target.value)}
                onBlur={() => saveContainerEdits(item)}
              />
              <span className="cou-cont-x">×</span>
              <input
                type="number" min="0.01" step="0.01" placeholder="Taille" className="cou-cont-input size"
                value={getContainerEdit(item, 'container_size')}
                onChange={e => setContainerField(item.id, 'container_size', e.target.value)}
                onBlur={() => saveContainerEdits(item)}
              />
              <select
                className="cou-cont-unit"
                value={getContainerEdit(item, 'container_unit') || 'L'}
                onChange={e => { setContainerField(item.id, 'container_unit', e.target.value); saveContainerEdits(item) }}
              >
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="cl">cl</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="unités">unités</option>
              </select>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) return (
    <div className="v21-page wide courses-page" aria-busy="true" aria-label="Chargement des courses">
      <div className="v21-skel" style={{ height: 150 }} />
      <div className="cou-board">
        <div className="cou-rail"><div className="v21-skel" style={{ height: 320, margin: '24px' }} /></div>
        <div className="cou-main cou-skel-list">
          {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="v21-skel" style={{ height: 120 }} />)}
        </div>
      </div>
    </div>
  )

  if (!importId || items.length === 0) return (
    <div className="v21-page wide courses-page">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Courses</span>
          <h1 className="v21-title">La liste.</h1>
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
    <div className="v21-page wide courses-page">

      {/* HERO ÉDITORIAL */}
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Courses</span>
          <h1 className="v21-title">La liste.</h1>
          <div className="v21-rule" />
          <p className="v21-lede">{remaining} restant{remaining !== 1 ? 's' : ''} sur cette semaine.</p>
        </div>
        <div className="v21-hero-side">
          <div className="v21-hero-badge">
            <span className="v">{remaining}</span>
            <span className="l">à acheter</span>
          </div>
        </div>
      </header>

      {fetchResult && (
        <div className={`cou-result ${fetchResult.error ? 'error' : 'ok'}`}>
          {fetchResult.error
            ? fetchResult.error
            : fetchResult.items != null
              ? (fetchResult.mode === 'enriched'
                  ? `${fetchResult.items} articles reliés au stock${fetchResult.inStock > 0 ? ` · ${fetchResult.inStock} déjà en stock` : ''}`
                  : `Liste recalculée — ${fetchResult.items} article${fetchResult.items > 1 ? 's' : ''}`)
                + (fetchResult.recipesCreated > 0 ? ` · ${fetchResult.recipesCreated} recette(s) ajoutée(s)` : '')
              : `${fetchResult.updated}/${fetchResult.total} photos${fetchResult.cleared ? ` · ${fetchResult.cleared} hors-sujet retirée${fetchResult.cleared > 1 ? 's' : ''}` : ''}`}
        </div>
      )}

      {/* COCKPIT : rail | cartes */}
      <div className="cou-board">

        {/* ── RAIL ── */}
        <aside className="cou-rail">

          {/* Avancement */}
          <section className="cou-rsec">
            <span className="v21-bl">Avancement</span>
            <div className="cou-big">{checkedCount} <span className="cou-big-of">/ {totalCount}</span></div>
            <span className="cou-rsub">articles rangés</span>
            <div className="cou-prog"><div className="cou-prog-fill" style={{ width: `${pct}%` }} /></div>
            <span className="cou-rsub">{pct} % · {remaining} restant{remaining !== 1 ? 's' : ''}</span>
            {allTotalCount !== totalCount && (
              <span className="cou-rsub">{allCheckedCount}/{allTotalCount} sur tout le plan</span>
            )}
          </section>

          {/* Semaine — un seul sélecteur (évite le doublon semaine/plan) */}
          {(weekLabels.length > 0 || imports.length > 1) && (
            <section className="cou-rsec">
              <span className="v21-bl">Semaine</span>
              {weekLabels.length > 1 ? (
                /* Le plan contient plusieurs semaines → navigation par semaine (+ nav de plan distincte) */
                <>
                  <div className="cou-wk">
                    <button className="cou-wk-btn" onClick={() => goWeek(-1)} disabled={weekIdx <= 0} aria-label="Semaine précédente"><ChevronLeft size={15} /></button>
                    <b>{activeWeek}</b>
                    <button className="cou-wk-btn" onClick={() => goWeek(1)} disabled={weekIdx >= weekLabels.length - 1} aria-label="Semaine suivante"><ChevronRight size={15} /></button>
                  </div>
                  <span className="cou-wk-cap">Semaine {weekIdx + 1} / {weekLabels.length}</span>
                  {imports.length > 1 && (
                    <div className="cou-plan">
                      <button className="cou-wk-btn" onClick={() => goToImport(importIndex + 1)} disabled={importIndex >= imports.length - 1} aria-label="Plan précédent"><ChevronLeft size={14} /></button>
                      <span className="cou-plan-lbl">{importLabel || 'Plan'}</span>
                      <button className="cou-wk-btn" onClick={() => goToImport(importIndex - 1)} disabled={importIndex <= 0} aria-label="Plan suivant"><ChevronRight size={14} /></button>
                    </div>
                  )}
                </>
              ) : imports.length > 1 ? (
                /* Chaque plan = une semaine → la nav de plan EST le sélecteur de semaine */
                <>
                  <div className="cou-wk">
                    <button className="cou-wk-btn" onClick={() => goToImport(importIndex + 1)} disabled={importIndex >= imports.length - 1} aria-label="Semaine précédente"><ChevronLeft size={15} /></button>
                    <b>{activeWeek || importLabel}</b>
                    <button className="cou-wk-btn" onClick={() => goToImport(importIndex - 1)} disabled={importIndex <= 0} aria-label="Semaine suivante"><ChevronRight size={15} /></button>
                  </div>
                  <span className="cou-wk-cap">Semaine {imports.length - importIndex} / {imports.length}</span>
                </>
              ) : (
                /* Une seule semaine */
                <div className="cou-wk"><b>{activeWeek || importLabel || 'Semaine en cours'}</b></div>
              )}
            </section>
          )}

          {/* Rayons (onglets latéraux = parcours) */}
          <section className="cou-rsec cou-rsec-grow">
            <span className="v21-bl">Rayons</span>
            <div className="cou-tabs" role="tablist" aria-label="Filtrer par rayon">
              <button
                role="tab" aria-selected={showAll}
                className={`cou-tab cou-tab-all${showAll ? ' on' : ''}`}
                onClick={() => setActiveRayon('TOUT')}
              >
                <span className="cou-tab-nm">Tout</span>
                <span className="cou-tab-c">{totalCount}</span>
              </button>
              {categories.map((cat, i) => {
                const catItems = groupedItems[cat]
                const catChecked = catItems.filter(it => it.checked).length
                const on = currentRayon === cat
                return (
                  <button
                    key={cat}
                    role="tab" aria-selected={on}
                    className={`cou-tab${on ? ' on' : ''}`}
                    onClick={() => setActiveRayon(cat)}
                  >
                    <span className="cou-tab-pip">{catChecked === catItems.length ? <Check size={11} /> : i + 1}</span>
                    <span className="cou-tab-nm">{cat}</span>
                    <span className="cou-tab-c">{catChecked} / {catItems.length}</span>
                    <span className="cou-tab-mini"><span className="cou-tab-mini-f" style={{ width: `${catItems.length ? (catChecked / catItems.length) * 100 : 0}%` }} /></span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Actions */}
          <section className="cou-ractions">
            <button onClick={handleRebuild} disabled={rebuilding} className="cou-raction"
              title="Synchroniser : créer les recettes du plan, relier les ingrédients, marquer ce que tu as déjà en stock">
              <RefreshCw size={13} /> {rebuilding ? 'Synchro…' : 'Synchroniser le stock'}
            </button>
            <button onClick={() => handleFetchImages(false)} disabled={fetchingImages} className="cou-raction"
              title="Récupère une photo (Open Food Facts) pour les articles qui n'en ont pas">
              <Camera size={13} /> {fetchingImages ? 'Photos…' : 'Photos auto'}
            </button>
            <button onClick={() => handleFetchImages(true)} disabled={fetchingImages} className="cou-raction"
              title="Re-télécharge toutes les photos depuis Open Food Facts et retire les images hors-sujet">
              <RefreshCw size={13} /> {fetchingImages ? 'Photos…' : 'Corriger les photos'}
            </button>
          </section>
        </aside>

        {/* ── MAIN ── */}
        <section className="cou-main">
          {currentRayon === null ? (
            /* Vue « Tout » — toutes les cartes groupées par rayon */
            categories.length === 0 ? (
              <div className="v21-empty cou-empty"><p>Aucun article pour cette semaine.</p></div>
            ) : (
              categories.map(cat => {
                const catItems = groupedItems[cat]
                const catChecked = catItems.filter(it => it.checked).length
                const tint = catTint(cat)
                return (
                  <div key={cat} className="cou-group">
                    <div className="cou-group-h">
                      <span className="v21-bl">{cat}</span>
                      <span className="cou-group-c">{catChecked} / {catItems.length} rangés</span>
                    </div>
                    <div className="cou-grid">{catItems.map(it => renderCard(it, tint))}</div>
                  </div>
                )
              })
            )
          ) : (
            /* Vue rayon focalisé — cartes + parcours */
            <>
              <header className="cou-rayhead">
                <div className="cou-rayhead-l">
                  <span className="v21-bl">Rayon en cours</span>
                  <h2 className="cou-rayhead-nm">{currentRayon}</h2>
                  <span className="cou-rayhead-meta">{currentChecked} / {currentItems.length} cochés · {currentItems.length - currentChecked} restant{currentItems.length - currentChecked !== 1 ? 's' : ''}</span>
                </div>
                <div className="cou-rayhead-count">
                  <span className="cou-rayhead-count-v">{currentItems.length - currentChecked}</span>
                  <span className="cou-rayhead-count-l">restant{currentItems.length - currentChecked !== 1 ? 's' : ''}</span>
                </div>
              </header>
              <div className="cou-prog cou-rayhead-prog"><div className="cou-prog-fill" style={{ width: `${currentItems.length ? (currentChecked / currentItems.length) * 100 : 0}%` }} /></div>

              <div className="cou-grid">{currentItems.map(it => renderCard(it, catTint(currentRayon)))}</div>

              {/* Parcours */}
              <div className="cou-parcours">
                <span className="cou-parcours-step">Rayon <b>{currentIndex + 1}</b> / {categories.length}</span>
                <span className="cou-parcours-mid">{currentItems.length - currentChecked} article{currentItems.length - currentChecked !== 1 ? 's' : ''} restant{currentItems.length - currentChecked !== 1 ? 's' : ''} dans ce rayon</span>
                <span className="cou-parcours-nav">
                  <button
                    className="cou-parcours-btn ghost"
                    disabled={currentIndex <= 0}
                    onClick={() => currentIndex > 0 && setActiveRayon(categories[currentIndex - 1])}
                  >
                    <ChevronLeft size={14} /> Précédent
                  </button>
                  <button
                    className="cou-parcours-btn next"
                    disabled={currentIndex >= categories.length - 1}
                    onClick={() => currentIndex < categories.length - 1 && setActiveRayon(categories[currentIndex + 1])}
                  >
                    {currentIndex < categories.length - 1 ? categories[currentIndex + 1] : 'Fin'} <ChevronRight size={14} />
                  </button>
                </span>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
