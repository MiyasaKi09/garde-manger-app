'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
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
      const res = await authFetch(`/api/planning/imports/${importId}`)
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
      const res = await authFetch(`/api/courses/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: newChecked }),
      })
      if (!res.ok) throw new Error('Erreur réseau')
    } catch (err) {
      // Revert on error
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: !newChecked } : i))
    }
  }

  const checkedCount = filteredItems.filter(i => i.checked).length
  const totalCount = filteredItems.length

  if (loading) return (
    <div className="v21-page" aria-busy="true" aria-label="Chargement des courses">
      <div className="v21-skel" style={{ height: 90, marginBottom: 20 }} />
      <div className="v21-skel" style={{ height: 38, width: 200, marginBottom: 18 }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="v21-skel" style={{ height: 48, marginBottom: 1, borderRadius: 0 }} />
        ))}
      </div>
    </div>
  )
  if (!data) return null

  return (
    <>
      <div className="v21-page">
        <button className="shop-back" onClick={() => router.push(`/planning/${importId}`)}>
          <ArrowLeft size={15} /> Retour au calendrier
        </button>

        {/* ═══ HERO ÉDITORIAL ═══ */}
        <header className="v21-hero">
          <div className="v21-hero-text">
            <span className="v21-eyebrow"><ShoppingCart size={12} /> Courses{data.import?.month_label ? ` · ${data.import.month_label}` : ''}</span>
            <h1 className="v21-title">Listes de courses.</h1>
            <div className="v21-rule" />
            <p className="v21-lede">Ce qu'il reste à rapporter, semaine par semaine.</p>
          </div>
          <div className="v21-hero-badge">
            <span className="v">{Math.max(totalCount - checkedCount, 0)}</span>
            <span className="l">{totalCount > 0 ? 'articles restants' : 'rien à acheter'}</span>
          </div>
        </header>

        {/* Week tabs */}
        {weekLabels.length > 0 && (
          <div className="v21-tabs" role="tablist" aria-label="Semaines">
            {weekLabels.map(week => (
              <button
                key={week}
                role="tab"
                aria-selected={activeWeek === week}
                className={`v21-tab ${activeWeek === week ? 'on' : ''}`}
                onClick={() => setActiveWeek(week)}
              >
                {week}
              </button>
            ))}
          </div>
        )}

        {/* Progress */}
        <div className="shop-prog-wrap">
          <span className="shop-prog-t">{checkedCount} / {totalCount} articles</span>
          <div className="v21-prog"><div className="v21-prog-fill" style={{ width: totalCount ? `${(checkedCount / totalCount) * 100}%` : '0%' }} /></div>
        </div>

        {/* Items grouped by category */}
        {Object.entries(groupedItems).map(([category, catItems]) => (
          <section key={category} className="shop-cat">
            <div className="v21-bh"><span className="v21-bl">{category}</span></div>
            <div className="v21-its">
              {catItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`v21-it compact shop-it ${item.checked ? 'is-checked' : ''}`}
                  onClick={() => toggleItem(item.id)}
                >
                  <span className="v21-it-bar" aria-hidden="true" style={{ background: item.checked ? 'var(--sage, #6FB05A)' : 'var(--line-strong)' }} />
                  <span className="shop-check-wrap"><span className={`shop-box ${item.checked ? 'on' : ''}`}>{item.checked && <Check size={12} color="#fff" />}</span></span>
                  <span className="v21-it-n shop-name">{item.product_name}</span>
                  <span className="v21-it-q shop-qty">{item.quantity}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <style jsx>{`
        .shop-back {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.03em; text-transform: uppercase;
          background: none; border: none; color: var(--ink-3); cursor: pointer;
          padding: 0; margin-bottom: 20px; transition: color 0.15s ease;
        }
        .shop-back:hover { color: var(--terracotta); }

        .shop-prog-wrap { padding: 18px 0 6px; }
        .shop-prog-t { font-family: var(--font-mono); font-size: 11px; color: var(--ink-2); letter-spacing: 0.03em; }

        .shop-cat { padding-top: 22px; }

        /* Ligne d'article : barre | case | nom | quantité (grille .v21-it.compact étendue) */
        .v21-it.shop-it {
          grid-template-columns: 8px 30px 1fr auto;
          width: 100%; border: none; border-bottom: 1px solid var(--line);
          background: transparent; cursor: pointer; text-align: left; font: inherit;
        }
        .shop-check-wrap { padding: 0 !important; justify-content: center; }
        .shop-box {
          width: 18px; height: 18px; border-radius: 3px; flex-shrink: 0;
          border: 1.5px solid var(--line-strong); background: transparent;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .shop-box.on { background: var(--brand); border-color: var(--brand); }
        .v21-it.is-checked .shop-name { text-decoration: line-through; color: var(--ink-3); }
        .v21-it.is-checked { opacity: 0.6; }
        .shop-qty { white-space: nowrap; text-align: right; }

        @media (max-width: 560px) {
          .v21-it.shop-it { grid-template-columns: 8px 30px 1fr; }
          .shop-qty { display: none; }
        }
      `}</style>
    </>
  )
}
