'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

export default function PersonsPage() {
  const router = useRouter()
  const { importId } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [dayIndex, setDayIndex] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const res = await authFetch(`/api/planning/imports/${importId}`)
      if (!res.ok) { router.push('/planning'); return }
      setData(await res.json())
      setLoading(false)
    }
    load()
  }, [importId])

  const dates = useMemo(() => {
    if (!data?.meals) return []
    return [...new Set(data.meals.map(m => m.meal_date))].sort()
  }, [data])

  const currentDate = dates[dayIndex]

  function getMeals(person) {
    if (!data || !currentDate) return []
    return data.meals
      .filter(m => m.meal_date === currentDate && m.person_name === person)
      .sort((a, b) => {
        const order = { pdj: 0, dejeuner: 1, collation: 2, diner: 3 }
        return (order[a.meal_type] || 0) - (order[b.meal_type] || 0)
      })
  }

  function getTotal(person) {
    if (!data || !currentDate) return null
    return data.dailyTotals.find(t => t.meal_date === currentDate && t.person_name === person)
  }

  const mealLabels = { pdj: 'Petit-dejeuner', dejeuner: 'Dejeuner', diner: 'Diner', collation: 'Collation' }
  const mealIcons = { pdj: '🌅', dejeuner: '☀️', diner: '🌙', collation: '🥜' }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement...</p></div>
  }

  return (
    <>
      <div className="container">
        <div className="header-card">
          <button className="back-btn" onClick={() => router.push(`/planning/${importId}`)}>
            <ArrowLeft size={18} /> Retour au calendrier
          </button>
          <h1>Par personne</h1>

          {/* Day selector */}
          <div className="day-nav">
            <button className="nav-btn" onClick={() => setDayIndex(Math.max(0, dayIndex - 1))} disabled={dayIndex === 0}>
              <ChevronLeft size={18} />
            </button>
            <div className="day-label">
              {currentDate && new Date(currentDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <button className="nav-btn" onClick={() => setDayIndex(Math.min(dates.length - 1, dayIndex + 1))} disabled={dayIndex >= dates.length - 1}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="persons-grid">
          {['Julien', 'Zoé'].map(person => {
            const meals = getMeals(person)
            const total = getTotal(person)
            return (
              <div key={person} className="person-column">
                <h2 className="person-name">{person}</h2>

                {meals.map(meal => (
                  <div key={meal.id} className="meal-card">
                    <div className="meal-header">
                      <span>{mealIcons[meal.meal_type]}</span>
                      <span className="meal-type-label">{mealLabels[meal.meal_type]}</span>
                      {meal.day_type && <span className="day-type">{meal.day_type}</span>}
                    </div>
                    <div className="meal-description">{meal.description}</div>
                    <div className="macro-bar">
                      <div className="macro"><span className="macro-val">{meal.kcal}</span><span className="macro-unit">kcal</span></div>
                      <div className="macro prot"><span className="macro-val">{meal.protein_g}</span><span className="macro-unit">P</span></div>
                      <div className="macro carbs"><span className="macro-val">{meal.carbs_g}</span><span className="macro-unit">G</span></div>
                      <div className="macro fat"><span className="macro-val">{meal.fat_g}</span><span className="macro-unit">L</span></div>
                      {meal.fiber_g != null && <div className="macro fiber"><span className="macro-val">{meal.fiber_g}</span><span className="macro-unit">F</span></div>}
                    </div>
                  </div>
                ))}

                {total && (
                  <div className={`total-card ${total.validated ? 'valid' : 'warn'}`}>
                    <div className="total-header">
                      <span>{total.validated ? '✅' : '⚠️'} Total jour</span>
                    </div>
                    <div className="macro-bar total-macros">
                      <div className="macro"><span className="macro-val">{total.kcal}</span><span className="macro-unit">kcal</span></div>
                      <div className="macro prot"><span className="macro-val">{total.protein_g}</span><span className="macro-unit">P</span></div>
                      <div className="macro carbs"><span className="macro-val">{total.carbs_g}</span><span className="macro-unit">G</span></div>
                      <div className="macro fat"><span className="macro-val">{total.fat_g}</span><span className="macro-unit">L</span></div>
                      {total.fiber_g != null && <div className="macro fiber"><span className="macro-val">{total.fiber_g}</span><span className="macro-unit">F</span></div>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .container { padding: 16px; max-width: 1000px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .header-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
        .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #6b7280; cursor: pointer; font-size: 14px; padding: 4px 8px; border-radius: 6px; margin-bottom: 8px; }
        .back-btn:hover { background: rgba(0,0,0,0.05); }
        .header-card h1 { font-size: 22px; font-weight: bold; color: #1f2937; margin: 0 0 12px; }

        .day-nav { display: flex; align-items: center; gap: 12px; justify-content: center; }
        .nav-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.25); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .day-label { font-size: 16px; font-weight: 600; color: #374151; text-transform: capitalize; }

        .persons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .person-column { display: flex; flex-direction: column; gap: 10px; }
        .person-name { font-size: 18px; font-weight: 700; color: #1f2937; margin: 0; padding: 8px 12px; background: rgba(255,255,255,0.3); border-radius: 10px; text-align: center; }

        .meal-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 14px; }
        .meal-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
        .meal-type-label { font-weight: 600; color: #374151; }
        .day-type { font-size: 11px; color: #9ca3af; background: rgba(0,0,0,0.04); padding: 2px 8px; border-radius: 4px; }
        .meal-description { font-size: 13px; color: #374151; line-height: 1.4; margin-bottom: 10px; }

        .macro-bar { display: flex; gap: 6px; flex-wrap: wrap; }
        .macro { display: flex; align-items: baseline; gap: 2px; padding: 3px 8px; border-radius: 6px; background: rgba(0,0,0,0.04); font-size: 12px; }
        .macro-val { font-weight: 700; color: #1f2937; }
        .macro-unit { font-size: 10px; color: #6b7280; }
        .macro.prot { background: rgba(239,68,68,0.08); }
        .macro.prot .macro-val { color: #dc2626; }
        .macro.carbs { background: rgba(59,130,246,0.08); }
        .macro.carbs .macro-val { color: #2563eb; }
        .macro.fat { background: rgba(234,179,8,0.08); }
        .macro.fat .macro-val { color: #ca8a04; }
        .macro.fiber { background: rgba(34,197,94,0.08); }
        .macro.fiber .macro-val { color: #16a34a; }

        .total-card { background: rgba(255,255,255,0.3); border: 2px solid rgba(34,197,94,0.3); border-radius: 12px; padding: 12px; }
        .total-card.warn { border-color: rgba(234,179,8,0.3); }
        .total-header { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
        .total-macros .macro { font-size: 13px; }
        .total-macros .macro-val { font-size: 14px; }

        @media (max-width: 768px) {
          .persons-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
