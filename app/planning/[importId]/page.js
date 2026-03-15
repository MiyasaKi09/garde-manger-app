'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ChefHat, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ImportDetailPage() {
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

  const persons = useMemo(() => {
    if (!data?.meals) return []
    return [...new Set(data.meals.map(m => m.person_name))].sort()
  }, [data])

  function getMeals(date) {
    if (!data) return []
    return data.meals.filter(m => m.meal_date === date)
  }

  function getTotal(date, person) {
    if (!data) return null
    return data.dailyTotals?.find(t => t.meal_date === date && t.person_name === person)
  }

  const mealOrder = ['pdj', 'dejeuner', 'collation', 'diner']
  const mealLabels = { pdj: 'Petit-déjeuner', dejeuner: 'Déjeuner', collation: 'Collation', diner: 'Dîner' }
  const mealIcons = { pdj: '🌅', dejeuner: '☀️', collation: '🥜', diner: '🌙' }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement...</p></div>
  if (!data) return null

  const dayMeals = getMeals(currentDate)
  const mealTypes = mealOrder.filter(mt => dayMeals.some(m => m.meal_type === mt))

  return (
    <>
      <div className="container">
        {/* Header */}
        <div className="header">
          <button className="back-btn" onClick={() => router.push('/planning')}>
            <ArrowLeft size={18} />
          </button>
          <h1>{data.import?.month_label || 'Planning'}</h1>
          <div className="nav-links">
            <button onClick={() => router.push(`/planning/${importId}/batch`)}>
              <ChefHat size={16} /> Cuisine
            </button>
            <button onClick={() => router.push(`/planning/${importId}/shopping`)}>
              <ShoppingCart size={16} /> Courses
            </button>
          </div>
        </div>

        {/* Day navigation */}
        <div className="day-nav">
          <button className="nav-btn" onClick={() => setDayIndex(Math.max(0, dayIndex - 1))} disabled={dayIndex === 0}>
            <ChevronLeft size={20} />
          </button>
          <div className="day-label">
            {currentDate && new Date(currentDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <button className="nav-btn" onClick={() => setDayIndex(Math.min(dates.length - 1, dayIndex + 1))} disabled={dayIndex >= dates.length - 1}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Meals */}
        <div className="meals">
          {mealTypes.map(mealType => {
            const mealsForType = dayMeals.filter(m => m.meal_type === mealType)
            return (
              <div key={mealType} className="meal-block">
                <div className="meal-type">
                  <span className="meal-icon">{mealIcons[mealType]}</span>
                  <span>{mealLabels[mealType]}</span>
                </div>
                <div className="meal-persons">
                  {persons.map(person => {
                    const meal = mealsForType.find(m => m.person_name === person)
                    if (!meal) return null
                    return (
                      <div key={person} className="person-row">
                        <div className="person-name">{person}</div>
                        <div className="person-detail">
                          <div className="meal-desc">{meal.description}</div>
                          <div className="meal-macros">
                            <span className="kcal">{meal.kcal} kcal</span>
                            <span className="macro">P {meal.protein_g}g</span>
                            <span className="macro">G {meal.carbs_g}g</span>
                            <span className="macro">L {meal.fat_g}g</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Daily totals */}
        <div className="totals">
          {persons.map(person => {
            const total = getTotal(currentDate, person)
            if (!total) return null
            return (
              <div key={person} className={`total-card ${total.validated ? 'valid' : 'warn'}`}>
                <div className="total-person">{person} {total.validated ? '✅' : '⚠️'}</div>
                <div className="total-macros">
                  <span className="total-kcal">{total.kcal} kcal</span>
                  <span>P {total.protein_g}g</span>
                  <span>G {total.carbs_g}g</span>
                  <span>L {total.fat_g}g</span>
                  {total.fiber_g != null && <span>F {total.fiber_g}g</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Day dots */}
        <div className="day-dots">
          {dates.map((d, i) => (
            <button key={d} className={`dot ${i === dayIndex ? 'active' : ''}`} onClick={() => setDayIndex(i)}>
              {new Date(d + 'T00:00:00').getDate()}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .container { padding: 16px; max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }

        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .back-btn { background: none; border: none; color: #6b7280; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; }
        .back-btn:hover { background: rgba(0,0,0,0.05); }
        .header h1 { flex: 1; font-size: 20px; font-weight: 700; color: #1f2937; margin: 0; }
        .nav-links { display: flex; gap: 6px; }
        .nav-links button { display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; font-size: 13px; color: #374151; font-weight: 500; }
        .nav-links button:hover { background: rgba(255,255,255,0.5); }

        .day-nav { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 20px; padding: 12px; background: rgba(255,255,255,0.25); border-radius: 12px; }
        .nav-btn { width: 36px; height: 36px; border-radius: 10px; border: none; background: rgba(255,255,255,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151; }
        .nav-btn:disabled { opacity: 0.2; cursor: not-allowed; }
        .day-label { font-size: 17px; font-weight: 600; color: #1f2937; text-transform: capitalize; }

        .meals { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }

        .meal-block { background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.2); border-radius: 14px; overflow: hidden; }
        .meal-type { display: flex; align-items: center; gap: 8px; padding: 10px 16px; font-size: 14px; font-weight: 700; color: #1f2937; border-bottom: 1px solid rgba(0,0,0,0.04); }
        .meal-icon { font-size: 18px; }

        .meal-persons { }
        .person-row { padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.03); }
        .person-row:last-child { border-bottom: none; }
        .person-name { font-size: 12px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .person-detail { }
        .meal-desc { font-size: 14px; color: #374151; line-height: 1.5; margin-bottom: 6px; }
        .meal-macros { display: flex; gap: 8px; flex-wrap: wrap; }
        .kcal { font-size: 13px; font-weight: 700; color: #1f2937; }
        .macro { font-size: 12px; color: #6b7280; }

        .totals { display: grid; grid-template-columns: repeat(${persons.length}, 1fr); gap: 10px; margin-bottom: 16px; }
        .total-card { background: rgba(255,255,255,0.3); border: 2px solid rgba(34,197,94,0.2); border-radius: 12px; padding: 12px; text-align: center; }
        .total-card.warn { border-color: rgba(234,179,8,0.3); }
        .total-person { font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 6px; }
        .total-macros { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; font-size: 12px; color: #6b7280; }
        .total-kcal { font-weight: 700; color: #1f2937; }

        .day-dots { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; padding: 12px; }
        .dot { width: 32px; height: 32px; border-radius: 8px; border: none; background: rgba(255,255,255,0.3); cursor: pointer; font-size: 12px; font-weight: 500; color: #6b7280; }
        .dot.active { background: #16a34a; color: white; font-weight: 700; }
        .dot:hover:not(.active) { background: rgba(255,255,255,0.5); }
      `}</style>
    </>
  )
}
