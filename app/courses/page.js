'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check, ChevronLeft, Package } from 'lucide-react'
import Link from 'next/link'

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

      // Get latest import
      const res = await authFetch('/api/planning/imports')
      const d = await res.json()
      if (!d.imports?.length) { setLoading(false); return }

      const latestId = d.imports[0].id
      setImportId(latestId)
      setImportLabel(d.imports[0].month_label || '')

      // Get shopping items
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
      // 1. Parse quantity
      const parsed = parseQty(quantityStr)

      // 2. Find matching product
      const match = await findProduct(productName)

      // 3. Guess storage
      const storage = guessStorage(productName)

      // 4. Compute expiration date from product shelf life
      const DEFAULT_SHELF = { pantry: 30, fridge: 7, freezer: 90 }
      let shelfDays = DEFAULT_SHELF[storage.method] || 7
      if (match) {
        const fromProduct = storage.method === 'fridge' ? match.shelf_life_days_fridge
          : storage.method === 'freezer' ? match.shelf_life_days_freezer
          : match.shelf_life_days_pantry
        if (fromProduct && fromProduct > 0) shelfDays = fromProduct
      }
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + shelfDays)
      const expirationDate = expDate.toISOString().split('T')[0]
      console.log('addToStock expiration:', shelfDays, 'days →', expirationDate)

      // 5. Build lot data exactly like SmartAddForm does
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

      console.log('addToStock match:', JSON.stringify(match))
      console.log('addToStock storage:', storage.method, '→ shelfDays:', shelfDays, '→ expDate:', expirationDate)
      console.log('addToStock inserting:', JSON.stringify(lotData))

      const { data: lot, error } = await supabase
        .from('inventory_lots')
        .insert([lotData])
        .select()
        .single()

      if (error) {
        console.error('Insert lot error:', JSON.stringify(error))
        return { success: false, error: `${error.message} (code: ${error.code}, details: ${error.details})` }
      }
      console.log('Lot created:', lot?.id)
      return { success: true, lot }
    } catch (err) {
      console.error('addToStock error:', err)
      return { success: false, error: err.message }
    }
  }

  async function findProduct(name) {
    const n = name.trim().toLowerCase()
    const variants = getSearchVariants(n)

    for (const variant of variants) {
      // Try archetype (with shelf life from canonical parent)
      const { data: archs } = await supabase
        .from('archetypes')
        .select('id, name, shelf_life_days, canonical_food_id, canonical_foods(shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer)')
        .ilike('name', `%${variant}%`)
        .limit(5)

      if (archs?.length) {
        const best = archs.find(a => a.name.toLowerCase() === variant) || archs[0]
        return {
          type: 'archetype',
          id: best.id,
          shelf_life_days_pantry: best.shelf_life_days || best.canonical_foods?.shelf_life_days_pantry || 30,
          shelf_life_days_fridge: best.shelf_life_days || best.canonical_foods?.shelf_life_days_fridge || 7,
          shelf_life_days_freezer: (best.shelf_life_days || 30) * 10 || best.canonical_foods?.shelf_life_days_freezer || 90,
        }
      }

      // Try canonical_food
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
          shelf_life_days_pantry: best.shelf_life_days_pantry || 30,
          shelf_life_days_fridge: best.shelf_life_days_fridge || 7,
          shelf_life_days_freezer: best.shelf_life_days_freezer || 90,
        }
      }
    }

    return null
  }

  function getSearchVariants(name) {
    const variants = [name]
    // Singular: remove trailing s/x
    if (name.endsWith('s') || name.endsWith('x')) {
      variants.push(name.slice(0, -1))
    }
    // Plural: add s
    if (!name.endsWith('s') && !name.endsWith('x')) {
      variants.push(name + 's')
    }
    // Remove accents
    const noAccents = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (noAccents !== name) variants.push(noAccents)
    // First meaningful word only (for compound names like "Huile d'olive")
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
    if (/lait|yaourt|skyr|fromage|crème|beurre|œuf|oeuf|poulet|viande|bœuf|boeuf|porc|veau|agneau|dinde|saumon|cabillaud|truite|poisson|jambon|lardons|saucisse/i.test(name)) {
      return { method: 'fridge', place: 'Frigo' }
    }
    if (/surgelé|congelé|glace/i.test(name)) {
      return { method: 'freezer', place: 'Congélateur' }
    }
    return { method: 'pantry', place: 'Garde-manger' }
  }

  async function toggleItem(itemId) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const newChecked = !item.checked
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: newChecked, stocking: newChecked } : i))

    try {
      // Update checked status
      await supabase
        .from('nutrition_plan_shopping_items')
        .update({ checked: newChecked })
        .eq('id', itemId)

      // Add to stock when checking
      if (newChecked) {
        try {
          const result = await addToStock(item.product_name, item.quantity)
          if (result.success) {
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, stocked: true, stocking: false } : i))
          } else {
            console.error('Erreur ajout stock:', result.error)
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, stocking: false, stockError: true, stockErrorMsg: result.error } : i))
          }
        } catch (stockErr) {
          console.error('Erreur ajout stock:', stockErr)
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
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#7f8c7f' }}>Chargement...</p>
    </div>
  )

  if (!importId || items.length === 0) return (
    <div style={S.page}>
      <div style={S.emptyState}>
        <ShoppingCart size={40} color="#d1d5db" />
        <p style={{ color: '#9ca3af', marginTop: 12 }}>Pas de liste de courses</p>
        <p style={{ color: '#9ca3af', fontSize: 13 }}>Demande un planning a Myko pour generer la liste</p>
        <Link href="/planning/assistant" style={S.ctaBtn}>Creer un planning</Link>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerTop}>
          <div>
            <h1 style={S.title}><ShoppingCart size={22} /> Courses</h1>
            {importLabel && <p style={S.subtitle}>{importLabel}</p>}
          </div>
          <div style={S.globalProgress}>
            <span style={S.progressText}>{allCheckedCount}/{allTotalCount}</span>
            <div style={S.progressBarOuter}>
              <div style={{ ...S.progressBarInner, width: allTotalCount ? `${(allCheckedCount / allTotalCount) * 100}%` : '0%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Week tabs */}
      {weekLabels.length > 1 && (
        <div style={S.weekTabs}>
          {weekLabels.map(week => (
            <button
              key={week}
              onClick={() => setActiveWeek(week)}
              style={{
                ...S.weekTab,
                ...(activeWeek === week ? S.weekTabActive : {}),
              }}
            >
              {week}
            </button>
          ))}
        </div>
      )}

      {/* Per-week progress */}
      {weekLabels.length > 1 && (
        <div style={S.weekProgress}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{checkedCount}/{totalCount} articles</span>
          <div style={{ ...S.progressBarOuter, flex: 1 }}>
            <div style={{ ...S.progressBarInner, width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }} />
          </div>
        </div>
      )}

      {/* Items by category */}
      {Object.entries(groupedItems).map(([category, catItems]) => {
        const catChecked = catItems.filter(i => i.checked).length
        return (
          <div key={category} style={S.catSection}>
            <div style={S.catHeader}>
              <span>{category}</span>
              <span style={S.catCount}>{catChecked}/{catItems.length}</span>
            </div>
            {catItems.map(item => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                style={{
                  ...S.itemRow,
                  opacity: item.checked ? 0.5 : 1,
                }}
              >
                <div style={{
                  ...S.checkbox,
                  ...(item.checked ? S.checkboxChecked : {}),
                }}>
                  {item.checked && <Check size={13} color="#fff" />}
                </div>
                <span style={{
                  ...S.itemName,
                  textDecoration: item.checked ? 'line-through' : 'none',
                }}>
                  {item.product_name}
                </span>
                {item.quantity && (
                  <span style={S.itemQty}>{item.quantity}</span>
                )}
                {item.stocking && (
                  <span style={S.stockingBadge}>...</span>
                )}
                {item.stocked && !item.stocking && (
                  <span style={S.stockedBadge}><Package size={11} /> rangé</span>
                )}
                {item.stockError && !item.stocking && (
                  <span style={S.stockErrorBadge} title={item.stockErrorMsg || ''}>non rangé</span>
                )}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}

const glass = {
  background: 'rgba(255,255,255,0.6)',
  backdropFilter: 'blur(12px) saturate(120%)',
  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
  border: '1px solid rgba(255,255,255,0.35)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
}

const S = {
  page: {
    padding: '12px',
    maxWidth: 640,
    margin: '0 auto',
    paddingBottom: 40,
  },
  header: {
    ...glass,
    borderRadius: 20,
    padding: '20px 16px',
    marginBottom: 12,
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--ink, #1f281f)',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    margin: '4px 0 0',
  },
  globalProgress: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  progressText: {
    fontSize: 13,
    fontWeight: 700,
    color: '#16a34a',
  },
  progressBarOuter: {
    width: 80,
    height: 6,
    background: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    background: '#16a34a',
    borderRadius: 3,
    transition: 'width 0.3s',
  },
  weekTabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 10,
  },
  weekTab: {
    padding: '8px 18px',
    ...glass,
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  weekTabActive: {
    background: '#16a34a',
    color: 'white',
    borderColor: '#16a34a',
  },
  weekProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    padding: '0 4px',
  },
  catSection: {
    marginBottom: 12,
  },
  catHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
    padding: '8px 4px 6px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    marginBottom: 4,
  },
  catCount: {
    fontSize: 11,
    fontWeight: 600,
    color: '#9ca3af',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 12px',
    ...glass,
    borderRadius: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'all 0.15s',
    marginBottom: 4,
    fontSize: 14,
    color: 'var(--ink, #1f281f)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    border: '2px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  checkboxChecked: {
    background: '#16a34a',
    borderColor: '#16a34a',
  },
  itemName: {
    flex: 1,
    fontWeight: 500,
  },
  itemQty: {
    fontSize: 12,
    color: '#6b7280',
    flexShrink: 0,
  },
  emptyState: {
    ...glass,
    borderRadius: 20,
    padding: '40px 20px',
    textAlign: 'center',
    marginTop: 20,
  },
  stockingBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#9ca3af',
    flexShrink: 0,
  },
  stockedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 10,
    fontWeight: 600,
    color: '#16a34a',
    background: 'rgba(22, 163, 74, 0.08)',
    padding: '2px 7px',
    borderRadius: 6,
    flexShrink: 0,
  },
  stockErrorBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#ef4444',
    background: 'rgba(239, 68, 68, 0.08)',
    padding: '2px 7px',
    borderRadius: 6,
    flexShrink: 0,
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #16a34a, #059669)',
    color: 'white',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    marginTop: 16,
  },
}
