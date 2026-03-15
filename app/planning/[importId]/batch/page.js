'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'

export default function BatchPage() {
  const router = useRouter()
  const { importId } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [expandedRecipe, setExpandedRecipe] = useState(null)

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

  // Build a day-by-day view: prep tasks + meals to cook that day
  const days = useMemo(() => {
    if (!data) return []
    const prepTasks = data.prepTasks || []
    const meals = data.meals || []
    const map = {}

    // Group prep tasks by date
    for (const task of prepTasks) {
      const key = task.prep_date || 'unknown'
      if (!map[key]) map[key] = { date: task.prep_date, label: task.prep_label, prep: [], meals: [] }
      map[key].prep.push(task)
      if (task.prep_label && !map[key].label) map[key].label = task.prep_label
    }

    // Add meals for each prep day (dejeuner + diner only)
    for (const key of Object.keys(map)) {
      if (!map[key].date) continue
      const dayMeals = meals
        .filter(m => m.meal_date === map[key].date && (m.meal_type === 'dejeuner' || m.meal_type === 'diner'))
        .sort((a, b) => (a.meal_type === 'dejeuner' ? 0 : 1) - (b.meal_type === 'dejeuner' ? 0 : 1))
      map[key].meals = dayMeals
    }

    return Object.values(map).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }, [data])

  const batchRecipes = data?.batchRecipes || []

  function formatDate(date, label) {
    if (label) return label
    if (!date) return '—'
    return new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const mealLabels = { dejeuner: 'Midi', diner: 'Soir' }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement...</p></div>
  if (!data) return null

  return (
    <>
      <div className="container">
        <div className="header">
          <button className="back-btn" onClick={() => router.push(`/planning/${importId}`)}>
            <ArrowLeft size={18} />
          </button>
          <h1>Cuisine du jour</h1>
        </div>

        {/* Day by day */}
        {days.map((day, i) => {
          const isFree = day.prep.every(t => /libre|🎉|0\s*min/i.test(t.task))
          const totalMin = day.prep.reduce((s, t) => {
            const m = (t.estimated_time || '').match(/(\d+)\s*min/i)
            return s + (m ? parseInt(m[1]) : 0)
          }, 0)

          return (
            <div key={i} className={`day ${isFree ? 'free' : ''}`}>
              <div className="day-date">
                <span>{formatDate(day.date, day.label)}</span>
                {totalMin > 0 && <span className="day-time">{totalMin} min</span>}
                {isFree && <span className="day-badge-free">Repos</span>}
              </div>

              <div className="day-content">
                {/* Prep tasks */}
                {day.prep.map((task, j) => {
                  const isBatch = /batch/i.test(task.task)
                  const isPortionner = /portionner|restes/i.test(task.task)
                  return (
                    <div key={j} className={`task ${isBatch ? 'batch' : ''} ${isFree ? 'task-free' : ''}`}>
                      <div className="task-label">{isBatch ? '🍳 Batch' : isPortionner ? '📦 Prep' : isFree ? '🎉' : '🔪 Prep'}</div>
                      <div className="task-text">{task.task}</div>
                      {task.estimated_time && !/🎉/.test(task.estimated_time) && (
                        <div className="task-time">{task.estimated_time}</div>
                      )}
                    </div>
                  )
                })}

                {/* Meals to serve */}
                {day.meals.length > 0 && (
                  <div className="day-meals">
                    {['dejeuner', 'diner'].map(mt => {
                      const mealsForType = day.meals.filter(m => m.meal_type === mt)
                      if (mealsForType.length === 0) return null
                      return (
                        <div key={mt} className="serve-block">
                          <div className="serve-label">{mt === 'dejeuner' ? '☀️ Midi' : '🌙 Soir'}</div>
                          {mealsForType.map((m, k) => (
                            <div key={k} className="serve-item">
                              <span className="serve-person">{m.person_name}</span>
                              <span className="serve-desc">{m.description}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Recipes reference */}
        {batchRecipes.length > 0 && (
          <div className="recipes-section">
            <h2>Recettes ({batchRecipes.length})</h2>
            {batchRecipes.map((recipe, i) => {
              const name = recipe.name.split('\n')[0].replace(/^B\d+\s*[—–-]\s*/, '')
              const expanded = expandedRecipe === i

              return (
                <div key={i} className="recipe">
                  <div className="recipe-head" onClick={() => setExpandedRecipe(expanded ? null : i)}>
                    <div className="recipe-name">{name}</div>
                    <div className="recipe-meta">
                      {recipe.rendement && <span>{recipe.rendement.split('\n')[0]}</span>}
                      {recipe.macros_per_100g && <span>{recipe.macros_per_100g}</span>}
                    </div>
                    {expanded ? <ChevronUp size={18} color="#9ca3af" /> : <ChevronDown size={18} color="#9ca3af" />}
                  </div>
                  {expanded && (
                    <div className="recipe-detail">
                      {recipe.ingredients && <div className="r-block"><div className="r-label">Ingrédients</div><div className="r-text">{recipe.ingredients.replace(/\|/g, '\n')}</div></div>}
                      {recipe.portions && <div className="r-block"><div className="r-label">Portions</div><div className="r-text">{recipe.portions}</div></div>}
                      {recipe.instructions && <div className="r-block"><div className="r-label">Préparation</div><div className="r-text">{recipe.instructions}</div></div>}
                      {recipe.reheat && <div className="r-reheat">{recipe.reheat}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .container { padding: 16px; max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }

        .header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .back-btn { background: none; border: none; color: #6b7280; cursor: pointer; padding: 6px; border-radius: 8px; display: flex; }
        .header h1 { font-size: 20px; font-weight: 700; color: #1f2937; margin: 0; }

        .day { margin-bottom: 20px; }
        .day.free { opacity: 0.6; }
        .day-date { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; text-transform: capitalize; }
        .day-date span:first-child { font-size: 15px; font-weight: 700; color: #1f2937; }
        .day-time { font-size: 12px; font-weight: 600; color: #2563eb; background: rgba(59,130,246,0.08); padding: 2px 8px; border-radius: 5px; }
        .day-badge-free { font-size: 12px; font-weight: 600; color: #16a34a; background: rgba(34,197,94,0.08); padding: 2px 8px; border-radius: 5px; }

        .day-content { background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; overflow: hidden; }

        .task { display: flex; align-items: baseline; gap: 8px; padding: 10px 14px; border-bottom: 1px solid rgba(0,0,0,0.03); }
        .task.batch { background: rgba(234,179,8,0.04); }
        .task-label { font-size: 12px; font-weight: 600; color: #6b7280; white-space: nowrap; min-width: 70px; }
        .task-text { font-size: 14px; color: #374151; line-height: 1.4; flex: 1; }
        .task-time { font-size: 12px; color: #6b7280; white-space: nowrap; }

        .day-meals { padding: 8px 14px 10px; border-top: 1px solid rgba(0,0,0,0.06); }
        .serve-block { margin-bottom: 6px; }
        .serve-block:last-child { margin-bottom: 0; }
        .serve-label { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 4px; }
        .serve-item { display: flex; gap: 8px; padding: 2px 0; font-size: 13px; }
        .serve-person { font-weight: 600; color: #16a34a; min-width: 50px; }
        .serve-desc { color: #374151; }

        .recipes-section { margin-top: 32px; padding-top: 20px; border-top: 2px solid rgba(0,0,0,0.06); }
        .recipes-section h2 { font-size: 17px; font-weight: 700; color: #1f2937; margin: 0 0 12px; }

        .recipe { background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; margin-bottom: 8px; overflow: hidden; }
        .recipe-head { display: flex; align-items: center; padding: 12px 14px; cursor: pointer; gap: 10px; }
        .recipe-head:hover { background: rgba(255,255,255,0.2); }
        .recipe-name { font-size: 15px; font-weight: 600; color: #1f2937; flex: 1; }
        .recipe-meta { display: flex; gap: 8px; font-size: 11px; color: #6b7280; }

        .recipe-detail { padding: 0 14px 14px; }
        .r-block { margin-bottom: 10px; }
        .r-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
        .r-text { font-size: 13px; color: #374151; line-height: 1.6; white-space: pre-line; }
        .r-reheat { font-size: 12px; color: #92400e; background: rgba(234,179,8,0.06); padding: 6px 10px; border-radius: 6px; }
      `}</style>
    </>
  )
}
