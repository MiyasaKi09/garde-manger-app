'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check, Package } from 'lucide-react'
import Link from 'next/link'
import './courses.css'

export default function CoursesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [importId, setImportId] = useState(null)
  const [importLabel, setImportLabel] = useState('')
  const [activeWeek, setActiveWeek] = useState(null)
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [containerEdits, setContainerEdits] = useState({})

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await authFetch('/api/planning/imports')
      const d = await res.json()
      if (!d.imports?.length) { setLoading(false); return }

      const latestId = d.imports[0].id
      setImportId(latestId)
      setImportLabel(d.imports[0].month_label || '')

      const res2 = await authFetch(`/api/planning/imports/${latestId}`)
      const d2 = await res2.json()
      setItems(d2.shoppingItems || [])

      const weeks = [...new Set((d2.shoppingItems || []).map(i => i.week_label))].sort()
      if (weeks.length > 0) setActiveWeek(weeks[0])
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

  async function findProduct(name) {
    const n = name.trim().toLowerCase()
    const variants = getSearchVariants(n)

    for (const variant of variants) {
      const { data: archs } = await supabase
        .from('archetypes')
        .select('id, name, shelf_life_days, canonical_food_id, canonical_foods(shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer)')
        .ilike('name', `%${variant}%`)
        .limit(5)

      if (archs?.length) {
        const best = archs.find(a => a.name.toLowerCase() === variant) || archs[0]
        const cf = best.canonical_foods
        return {
          type: 'archetype',
          id: best.id,
          shelf_life_days_pantry: cf?.shelf_life_days_pantry || best.shelf_life_days || 0,
          shelf_life_days_fridge: cf?.shelf_life_days_fridge || 0,
          shelf_life_days_freezer: cf?.shelf_life_days_freezer || 0,
        }
      }

      const { data: cans } = await supabase
        .from('canonical_foods')
        .select('id, canonical_name, shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer')
        .ilike('canonical_name', `%${variant}%`)
        .limit(5)

      if (cans?.length) {
        const best = cans.find(c => c.canonical_name?.toLowerCase() === variant) || cans[0]
        return {
          type: 'canonical',
          id: best.id,
          shelf_life_days_pantry: best.shelf_life_days_pantry || 0,
          shelf_life_days_fridge: best.shelf_life_days_fridge || 0,
          shelf_life_days_freezer: best.shelf_life_days_freezer || 0,
        }
      }
    }

    return null
  }

  function getSearchVariants(name) {
    const variants = [name]
    if (name.endsWith('s') || name.endsWith('x')) {
      variants.push(name.slice(0, -1))
    }
    if (!name.endsWith('s') && !name.endsWith('x')) {
      variants.push(name + 's')
    }
    const noAccents = name.normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (noAccents !== name) variants.push(noAccents)
    const words = name.split(/\s+/).filter(w => w.length > 2 && !['de','du','des','le','la','les','au','aux','en',"d'","l'"].includes(w))
    if (words[0] && words[0] !== name) {
      variants.push(words[0])
      if (words[0].endsWith('s')) variants.push(words[0].slice(0, -1))
    }
    return [...new Set(variants)]
  }

  function parseQty(str) {
    if (!str) return { qty: 1, unit: 'unités' }
    const s = str.trim().toLowerCase()
    const m = s.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l|unités?|pièces?|gousses?|boîtes?|paquets?|bouteilles?|sachets?|tranches?|feuilles?)/)
    if (m) {
      const num = parseFloat(m[1].replace(',', '.'))
      const u = m[2]
      if (u === 'kg') return { qty: num * 1000, unit: 'g' }
      if (u === 'l') return { qty: num * 1000, unit: 'ml' }
      if (u === 'cl') return { qty: num * 10, unit: 'ml' }
      if (u === 'g') return { qty: num, unit: 'g' }
      if (u === 'ml') return { qty: num, unit: 'ml' }
      return { qty: num, unit: 'unités' }
    }
    const numOnly = s.match(/^(\d+(?:[.,]\d+)?)/)
    if (numOnly) return { qty: parseFloat(numOnly[1].replace(',', '.')), unit: 'unités' }
    return { qty: 1, unit: 'unités' }
  }

  function guessStorage(name) {
    const n = name.toLowerCase()
    if (/surgelé|congelé|glace/i.test(n)) {
      return { method: 'freezer', place: 'Congélateur' }
    }
    if (/lait|yaourt|skyr|fromage|crème|beurre|œuf|oeuf|poulet|viande|bœuf|boeuf|porc|veau|agneau|dinde|saumon|cabillaud|truite|poisson|jambon|lardons|saucisse|merguez|chorizo|magret|canard|guanciale|pancetta|bacon/i.test(n)) {
      return { method: 'fridge', place: 'Frigo' }
    }
    if (/artichaut|salade|laitue|tomate|concombre|courgette|aubergine|poivron|brocoli|chou|fenouil|navet|radis|carotte|poireau|champignon|épinard|haricot.?vert|asperge|céleri|betterave|endive|mâche|roquette|persil|coriandre|menthe|basilic|ciboulette|aneth|estragon|cerfeuil/i.test(n)) {
      return { method: 'fridge', place: 'Frigo' }
    }
    if (/frais|fraîche/i.test(n)) {
      return { method: 'fridge', place: 'Frigo' }
    }
    if (/fraise|framboise|myrtille|cerise|pêche|nectarine|abricot|prune|raisin|mangue|kiwi|melon|pastèque|figue|pomme|poire/i.test(n)) {
      return { method: 'fridge', place: 'Frigo' }
    }
    return { method: 'pantry', place: 'Garde-manger' }
  }

  function guessShelfLife(name, storageMethod) {
    const n = name.toLowerCase()
    if (storageMethod === 'freezer') return 180
    if (/huile|vinaigre/i.test(n)) return 365
    if (/cumin|coriandre moulue|cannelle|paprika|curcuma|curry|poivre|muscade|thym séché|origan|herbes de provence|piment|gingembre moulu|ras el hanout|quatre.?épices/i.test(n)) return 365
    if (/conserve|passata|concentré|boîte|bocal/i.test(n)) return 365
    if (/pâtes|riz|semoule|quinoa|lentilles|pois chiche|haricot.?sec|farine|sucre|sel|maïzena|fécule|polenta/i.test(n)) return 365
    if (/moutarde|ketchup|sauce soja|tabasco|worcestershire|sriracha/i.test(n)) return 180
    if (/bouillon|fond/i.test(n)) return 365
    if (/amande|noix|noisette|cacahuète|beurre de cacahuète|fruit.?sec|raisin sec/i.test(n)) return 180
    if (storageMethod === 'fridge') {
      if (/poulet|viande|bœuf|boeuf|porc|veau|agneau|dinde|magret|canard|saucisse|merguez|lardons|guanciale|pancetta|bacon/i.test(n)) return 4
      if (/saumon|cabillaud|truite|poisson/i.test(n)) return 3
      if (/lait/i.test(n)) return 7
      if (/yaourt|skyr/i.test(n)) return 14
      if (/fromage|beurre|crème/i.test(n)) return 21
      if (/œuf|oeuf/i.test(n)) return 28
      if (/salade|laitue|mâche|roquette|épinard/i.test(n)) return 5
      if (/champignon/i.test(n)) return 5
      if (/tomate|concombre|courgette|aubergine|poivron|artichaut/i.test(n)) return 7
      if (/carotte|navet|poireau|chou|fenouil|brocoli|betterave/i.test(n)) return 14
      if (/herbe|persil|coriandre|menthe|basilic|ciboulette/i.test(n)) return 7
      if (/gingembre/i.test(n)) return 21
      if (/pomme|poire|agrume|orange|citron|clémentine/i.test(n)) return 14
      return 7
    }
    return 90
  }

  async function toggleItem(itemId) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const newChecked = !item.checked
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: newChecked, stocking: newChecked } : i))

    try {
      await supabase
        .from('nutrition_plan_shopping_items')
        .update({ checked: newChecked })
        .eq('id', itemId)

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
              {importLabel && <p className="hero-subtitle">{importLabel}</p>}
              {allTotalCount > 0 && (
                <p className="hero-subtitle">{allCheckedCount}/{allTotalCount} articles cochés</p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <div className="courses-progress-bar-outer" style={{ width: 80 }}>
                <div
                  className="courses-progress-bar-inner"
                  style={{ width: allTotalCount ? `${(allCheckedCount / allTotalCount) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

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
