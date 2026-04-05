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
          const res = await authFetch('/api/courses/add-to-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemId: item.id,
              productName: item.product_name,
              quantity: item.quantity,
            }),
          })
          const data = await res.json()
          if (res.ok && data.success) {
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, stocked: true, stocking: false } : i))
          } else {
            console.error('Erreur ajout stock:', data.error)
            setItems(prev => prev.map(i => i.id === itemId ? { ...i, stocking: false, stockError: true } : i))
          }
        } catch (stockErr) {
          console.error('Erreur ajout stock:', stockErr)
          setItems(prev => prev.map(i => i.id === itemId ? { ...i, stocking: false } : i))
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
                  <span style={S.stockErrorBadge}>non rangé</span>
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
