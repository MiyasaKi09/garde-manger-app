'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ShoppingCart, Check } from 'lucide-react'

export default function ShoppingPage() {
  const router = useRouter()
  const { importId } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [items, setItems] = useState([])
  const [activeWeek, setActiveWeek] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const res = await fetch(`/api/planning/imports/${importId}`)
      if (!res.ok) { router.push('/planning'); return }
      const d = await res.json()
      setData(d)
      setItems(d.shoppingItems || [])
      // Set first week as active
      const weeks = [...new Set((d.shoppingItems || []).map(i => i.week_label))].sort()
      if (weeks.length > 0) setActiveWeek(weeks[0])
      setLoading(false)
    }
    load()
  }, [importId])

  const weekLabels = useMemo(() => {
    return [...new Set(items.map(i => i.week_label))].sort()
  }, [items])

  const filteredItems = useMemo(() => {
    if (!activeWeek) return []
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
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: newChecked } : i))

    try {
      await supabase
        .from('nutrition_plan_shopping_items')
        .update({ checked: newChecked })
        .eq('id', itemId)
    } catch (err) {
      // Revert on error
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: !newChecked } : i))
    }
  }

  const checkedCount = filteredItems.filter(i => i.checked).length
  const totalCount = filteredItems.length

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement...</p></div>
  if (!data) return null

  return (
    <>
      <div className="container">
        <div className="header-card">
          <button className="back-btn" onClick={() => router.push(`/planning/${importId}`)}>
            <ArrowLeft size={18} /> Retour au calendrier
          </button>
          <h1><ShoppingCart size={22} /> Listes de courses</h1>
          <p>{data.import?.month_label}</p>
        </div>

        {/* Week tabs */}
        <div className="week-tabs">
          {weekLabels.map(week => (
            <button
              key={week}
              className={`week-tab ${activeWeek === week ? 'active' : ''}`}
              onClick={() => setActiveWeek(week)}
            >
              {week}
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="progress-bar-container">
          <div className="progress-text">{checkedCount}/{totalCount} articles</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }}></div>
          </div>
        </div>

        {/* Items grouped by category */}
        {Object.entries(groupedItems).map(([category, catItems]) => (
          <div key={category} className="category-section">
            <div className="category-header">{category}</div>
            <div className="items-list">
              {catItems.map(item => (
                <div
                  key={item.id}
                  className={`item-row ${item.checked ? 'checked' : ''}`}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className={`checkbox ${item.checked ? 'checked' : ''}`}>
                    {item.checked && <Check size={14} />}
                  </div>
                  <div className="item-name">{item.product_name}</div>
                  <div className="item-qty">{item.quantity}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .container { padding: 16px; max-width: 700px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .header-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
        .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #6b7280; cursor: pointer; font-size: 14px; padding: 4px 8px; border-radius: 6px; margin-bottom: 8px; }
        .back-btn:hover { background: rgba(0,0,0,0.05); }
        .header-card h1 { display: flex; align-items: center; gap: 8px; font-size: 22px; font-weight: bold; color: #1f2937; margin: 0 0 4px; }
        .header-card p { color: #6b7280; margin: 0; font-size: 14px; }

        .week-tabs { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
        .week-tab { padding: 8px 18px; background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px; color: #6b7280; transition: all 0.2s; }
        .week-tab:hover { background: rgba(255,255,255,0.4); }
        .week-tab.active { background: #16a34a; color: white; border-color: #16a34a; }

        .progress-bar-container { margin-bottom: 16px; }
        .progress-text { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
        .progress-bar { height: 6px; background: rgba(0,0,0,0.06); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: #16a34a; border-radius: 3px; transition: width 0.3s; }

        .category-section { margin-bottom: 18px; }
        .category-header { font-size: 14px; font-weight: 700; color: #374151; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.06); margin-bottom: 6px; }

        .items-list { display: flex; flex-direction: column; gap: 4px; }
        .item-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; transition: all 0.15s; }
        .item-row:hover { background: rgba(255,255,255,0.35); }
        .item-row.checked { opacity: 0.5; }
        .item-row.checked .item-name { text-decoration: line-through; }

        .checkbox { width: 22px; height: 22px; border-radius: 6px; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .checkbox.checked { background: #16a34a; border-color: #16a34a; color: white; }

        .item-name { flex: 1; font-size: 14px; color: #374151; }
        .item-qty { font-size: 12px; color: #6b7280; text-align: right; max-width: 200px; }

        @media (max-width: 768px) {
          .item-row { flex-wrap: wrap; }
          .item-qty { width: 100%; text-align: left; padding-left: 32px; font-size: 11px; }
        }
      `}</style>
    </>
  )
}
