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

  async function addToStock(productName, quantityStr) {
    try {
      const parsed = parseQty(quantityStr)
      const match = await findProduct(productName)
      const storage = guessStorage(productName)

      let shelfDays = null
      if (match) {
        const fromProduct = storage.method === 'fridge' ? match.shelf_life_days_fridge
          : storage.method === 'freezer' ? match.shelf_life_days_freezer
          : match.shelf_life_days_pantry
        if (fromProduct && fromProduct > 0) shelfDays = fromProduct
      }
      if (!shelfDays) shelfDays = guessShelfLife(productName, storage.method)

      const expDate = new Date()
      expDate.setDate(expDate.getDate() + shelfDays)
      const expirationDate = expDate.toISOString().split('T')[0]

      const lotData = {
        canonical_food_id: match?.type === 'canonical' ? match.id : null,
        archetype_id: match?.type === 'archetype' ? match.id : null,
        cultivar_id: null,
        qty_remaining: parsed.qty,
        initial_qty: parsed.qty,
        unit: parsed.unit,
        storage_method: storage.method,
        storage_place: storage.place,
        expiration_date: expirationDate,
        acquired_on: new Date().toISOString().split('T')[0],
        notes: match ? null : productName,
        is_containerized: false,
        container_size: null,
        container_unit: null,
      }

      const { data: lot, error } = await supabase
        .from('inventory_lots')
        .insert([lotData])
        .select()
        .single()

      if (error) {
        return { success: false, error: `${error.message} (code: ${error.code}, details: ${error.details})` }
      }
      return { success: true, lot }
    } catch (err) {
      return { success: false, error: err.message }
    }
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
          const result = await addToStock(item.product_name, item.quantity)
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
              {catItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`courses-item-row${item.checked ? ' checked' : ''}`}
                >
                  <div className={`courses-checkbox${item.checked ? ' checked' : ''}`}>
                    {item.checked && <Check size={13} color="#fff" />}
                  </div>
                  <span className={`courses-item-name${item.checked ? ' checked' : ''}`}>
                    {item.product_name}
                  </span>
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
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
