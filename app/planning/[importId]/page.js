'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Users, ChefHat, ShoppingCart, Calendar } from 'lucide-react'

export default function ImportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const importId = params.importId

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [selectedPerson, setSelectedPerson] = useState('Julien')
  const [currentWeekIdx, setCurrentWeekIdx] = useState(0)

  useEffect(() => { loadData() }, [importId])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch(`/api/planning/imports/${importId}`)
      if (!res.ok) { router.push('/planning'); return }
      const d = await res.json()
      setData(d)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const weeks = useMemo(() => {
    if (!data?.meals) return []
    const dates = [...new Set(data.meals.map(m => m.meal_date))].sort()
    const weekMap = []
    let currentWeek = []
    let lastMonday = null

    for (const d of dates) {
      const date = new Date(d + 'T00:00:00')
      const day = date.getDay()
      const monday = new Date(date)
      monday.setDate(date.getDate() - ((day + 6) % 7))
      const mondayKey = monday.toISOString().split('T')[0]

      if (lastMonday !== mondayKey) {
        if (currentWeek.length > 0) weekMap.push(currentWeek)
        currentWeek = []
        lastMonday = mondayKey
      }
      currentWeek.push(d)
    }
    if (currentWeek.length > 0) weekMap.push(currentWeek)
    return weekMap
  }, [data])

  const currentWeekDates = weeks[currentWeekIdx] || []

  function getMealsForDay(date, person) {
    if (!data) return []
    return data.meals.filter(m => m.meal_date === date && m.person_name === person)
  }

  function getTotalForDay(date, person) {
    if (!data) return null
    return data.dailyTotals.find(t => t.meal_date === date && t.person_name === person)
  }

  const mealTypeLabels = { pdj: 'P-dej', dejeuner: 'Dej', diner: 'Diner', collation: 'Coll' }
  const mealTypeIcons = { pdj: '🌅', dejeuner: '☀️', diner: '🌙', collation: '🥜' }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{
          width: 40, height: 40, border: '3px solid #e5e7eb',
          borderTop: '3px solid #22c55e', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!data) return null

  return (
    <>
      <div className="container">
        {/* Header */}
        <div className="header-card">
          <button className="back-btn" onClick={() => router.push('/planning')}>
            <ArrowLeft size={18} /> Retour
          </button>
          <h1>{data.import?.month_label || 'Plan importe'}</h1>
          <p>{data.import?.date_range_start && `${new Date(data.import.date_range_start).toLocaleDateString('fr-FR')} — ${new Date(data.import.date_range_end).toLocaleDateString('fr-FR')}`}</p>

          {/* Sub-navigation */}
          <div className="sub-nav">
            <div className="sub-nav-item active">
              <Calendar size={16} /> Calendrier
            </div>
            <div className="sub-nav-item" onClick={() => router.push(`/planning/${importId}/persons`)}>
              <Users size={16} /> Par personne
            </div>
            <div className="sub-nav-item" onClick={() => router.push(`/planning/${importId}/batch`)}>
              <ChefHat size={16} /> Batch cooking
            </div>
            <div className="sub-nav-item" onClick={() => router.push(`/planning/${importId}/shopping`)}>
              <ShoppingCart size={16} /> Courses
            </div>
          </div>
        </div>

        {/* Person toggle + Week nav */}
        <div className="controls">
          <div className="person-toggle">
            {['Julien', 'Zoé'].map(p => (
              <button
                key={p}
                className={`toggle-btn ${selectedPerson === p ? 'active' : ''}`}
                onClick={() => setSelectedPerson(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="week-nav">
            <button className="nav-btn" onClick={() => setCurrentWeekIdx(Math.max(0, currentWeekIdx - 1))} disabled={currentWeekIdx === 0}>
              ←
            </button>
            <span className="week-label">Semaine {currentWeekIdx + 1}/{weeks.length}</span>
            <button className="nav-btn" onClick={() => setCurrentWeekIdx(Math.min(weeks.length - 1, currentWeekIdx + 1))} disabled={currentWeekIdx >= weeks.length - 1}>
              →
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="calendar-grid">
          <div className="grid-header">
            <div className="corner-cell">Repas</div>
            {currentWeekDates.map(date => {
              const d = new Date(date + 'T00:00:00')
              const isToday = new Date().toISOString().split('T')[0] === date
              return (
                <div key={date} className={`day-header ${isToday ? 'today' : ''}`}>
                  <div className="day-name">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                  <div className="day-num">{d.getDate()}</div>
                </div>
              )
            })}
          </div>

          {['pdj', 'dejeuner', 'diner', 'collation'].map(mealType => (
            <div key={mealType} className="meal-row">
              <div className="meal-label">
                <span className="meal-icon">{mealTypeIcons[mealType]}</span>
                <span>{mealTypeLabels[mealType]}</span>
              </div>
              {currentWeekDates.map(date => {
                const meal = getMealsForDay(date, selectedPerson).find(m => m.meal_type === mealType)
                return (
                  <div key={`${mealType}-${date}`} className={`meal-cell ${meal ? 'filled' : ''}`}>
                    {meal ? (
                      <div className="meal-text">
                        <div className="meal-desc">{meal.description?.substring(0, 60)}{meal.description?.length > 60 ? '...' : ''}</div>
                        <div className="meal-kcal">{meal.kcal} kcal</div>
                      </div>
                    ) : (
                      <div className="empty">—</div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Daily totals row */}
          <div className="meal-row totals-row">
            <div className="meal-label"><span className="meal-icon">📊</span><span>Total</span></div>
            {currentWeekDates.map(date => {
              const total = getTotalForDay(date, selectedPerson)
              return (
                <div key={`total-${date}`} className={`meal-cell total-cell ${total?.validated ? 'valid' : 'warning'}`}>
                  {total ? (
                    <div className="total-info">
                      <div className="total-kcal">{total.kcal} kcal</div>
                      <div className="total-macros">{total.protein_g}P {total.carbs_g}G {total.fat_g}L</div>
                      <div className="total-valid">{total.validated ? '✅' : '⚠️'}</div>
                    </div>
                  ) : <div className="empty">—</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .container { padding: 16px; max-width: 1200px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .header-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
        .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #6b7280; cursor: pointer; font-size: 14px; padding: 4px 8px; border-radius: 6px; margin-bottom: 8px; }
        .back-btn:hover { background: rgba(0,0,0,0.05); }
        .header-card h1 { font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 4px; }
        .header-card p { color: #6b7280; margin: 0 0 16px; font-size: 14px; }

        .sub-nav { display: flex; gap: 8px; flex-wrap: wrap; }
        .sub-nav-item { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: #6b7280; transition: all 0.2s; }
        .sub-nav-item:hover { background: rgba(255,255,255,0.5); color: #374151; }
        .sub-nav-item.active { background: #16a34a; color: white; border-color: #16a34a; }

        .controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
        .person-toggle { display: flex; background: rgba(255,255,255,0.25); border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); }
        .toggle-btn { padding: 8px 20px; border: none; background: transparent; cursor: pointer; font-weight: 500; color: #6b7280; transition: all 0.2s; }
        .toggle-btn.active { background: #16a34a; color: white; }
        .week-nav { display: flex; align-items: center; gap: 12px; }
        .nav-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.25); cursor: pointer; font-weight: bold; color: #374151; }
        .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .week-label { font-size: 14px; font-weight: 500; color: #374151; }

        .calendar-grid { background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 16px; overflow-x: auto; }
        .grid-header { display: grid; grid-template-columns: 80px repeat(${currentWeekDates.length}, 1fr); gap: 6px; margin-bottom: 8px; }
        .corner-cell { font-size: 12px; font-weight: 600; color: #6b7280; display: flex; align-items: center; justify-content: center; }
        .day-header { background: rgba(255,255,255,0.5); border-radius: 8px; padding: 6px; text-align: center; }
        .day-header.today { background: #dcfce7; border: 2px solid #22c55e; }
        .day-name { font-size: 11px; color: #6b7280; }
        .day-num { font-size: 16px; font-weight: bold; color: #1f2937; }

        .meal-row { display: grid; grid-template-columns: 80px repeat(${currentWeekDates.length}, 1fr); gap: 6px; margin-bottom: 6px; }
        .meal-label { display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #6b7280; gap: 2px; }
        .meal-icon { font-size: 16px; }
        .meal-cell { border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 6px; min-height: 60px; display: flex; align-items: center; justify-content: center; font-size: 11px; }
        .meal-cell.filled { background: rgba(34,197,94,0.05); border-color: rgba(34,197,94,0.2); }
        .meal-text { text-align: center; }
        .meal-desc { color: #374151; line-height: 1.2; margin-bottom: 2px; }
        .meal-kcal { color: #16a34a; font-weight: 600; font-size: 10px; }
        .empty { color: #d1d5db; }

        .totals-row .meal-label { color: #16a34a; }
        .total-cell { background: rgba(255,255,255,0.4); }
        .total-cell.valid { border-color: rgba(34,197,94,0.3); }
        .total-cell.warning { border-color: rgba(234,179,8,0.3); }
        .total-info { text-align: center; }
        .total-kcal { font-weight: 700; color: #1f2937; font-size: 12px; }
        .total-macros { font-size: 10px; color: #6b7280; }
        .total-valid { font-size: 12px; }

        @media (max-width: 768px) {
          .grid-header, .meal-row { grid-template-columns: 60px repeat(${currentWeekDates.length}, minmax(70px, 1fr)); }
          .meal-desc { font-size: 10px; }
        }
      `}</style>
    </>
  )
}
