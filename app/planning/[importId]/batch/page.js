'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Clock, ChefHat, ChevronDown, ChevronUp, Flame, Users, UtensilsCrossed } from 'lucide-react'

export default function BatchPage() {
  const router = useRouter()
  const { importId } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [expandedRecipes, setExpandedRecipes] = useState({})

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

  // Group prep tasks by date, and attach meals for that day
  const dailyPlan = useMemo(() => {
    if (!data) return []
    const prepTasks = data.prepTasks || []
    const meals = data.meals || []
    const days = {}

    // Add prep tasks grouped by date
    for (const task of prepTasks) {
      const key = task.prep_date || task.prep_label || 'other'
      if (!days[key]) days[key] = { date: task.prep_date, label: task.prep_label, tasks: [], meals: [] }
      days[key].tasks.push(task)
      if (!days[key].label) days[key].label = task.prep_label
    }

    // Add meals for days that have prep tasks
    for (const key of Object.keys(days)) {
      if (!days[key].date) continue
      const dayMeals = meals.filter(m => m.meal_date === days[key].date)
      // Group by person
      const byPerson = {}
      for (const m of dayMeals) {
        if (!byPerson[m.person_name]) byPerson[m.person_name] = []
        byPerson[m.person_name].push(m)
      }
      days[key].meals = byPerson
    }

    // Sort by date
    return Object.values(days).sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return a.date.localeCompare(b.date)
    })
  }, [data])

  const batchRecipes = data?.batchRecipes || []

  function toggleRecipe(idx) {
    setExpandedRecipes(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  function formatDate(dateStr, label) {
    if (label) return label
    if (!dateStr) return '—'
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const mealLabels = { pdj: 'P-dej', dejeuner: 'Dej', diner: 'Dîner', collation: 'Coll' }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement...</p></div>
  if (!data) return null

  return (
    <>
      <div className="container">
        <div className="header-card">
          <button className="back-btn" onClick={() => router.push(`/planning/${importId}`)}>
            <ArrowLeft size={18} /> Retour au calendrier
          </button>
          <h1><ChefHat size={22} /> Cuisine & Préparations</h1>
          <p>{data.import?.month_label}</p>
        </div>

        {/* Daily Plan */}
        <div className="section">
          <h2><Clock size={20} /> Jour par jour</h2>
          <div className="daily-list">
            {dailyPlan.map((day, i) => {
              const isFree = day.tasks.every(t => /libre|🎉|0\s*min/i.test(t.task) || /🎉/.test(t.estimated_time))
              const totalTime = day.tasks.reduce((sum, t) => {
                const m = (t.estimated_time || '').match(/(\d+)\s*min/i)
                return sum + (m ? parseInt(m[1]) : 0)
              }, 0)

              return (
                <div key={i} className={`day-card ${isFree ? 'free' : ''}`}>
                  <div className="day-header">
                    <div className="day-date">{formatDate(day.date, day.label)}</div>
                    {totalTime > 0 && <div className="day-time">{totalTime} min</div>}
                    {isFree && <div className="day-free">Repos</div>}
                  </div>

                  <div className="day-tasks">
                    {day.tasks.map((task, j) => (
                      <div key={j} className="task-row">
                        <div className="task-icon">{/batch/i.test(task.task) ? '🍳' : /portionner|restes/i.test(task.task) ? '📦' : /libre|🎉/i.test(task.task) ? '🎉' : '🔪'}</div>
                        <div className="task-content">
                          <div className="task-text">{task.task}</div>
                          {task.estimated_time && !/🎉/.test(task.estimated_time) && (
                            <div className="task-time"><Clock size={12} /> {task.estimated_time}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {Object.keys(day.meals).length > 0 && (
                    <div className="day-meals">
                      <div className="meals-label"><UtensilsCrossed size={13} /> Repas du jour</div>
                      {Object.entries(day.meals).map(([person, personMeals]) => (
                        <div key={person} className="person-meals">
                          <span className="person-tag">{person}</span>
                          {personMeals
                            .filter(m => m.meal_type === 'dejeuner' || m.meal_type === 'diner')
                            .sort((a, b) => (a.meal_type === 'dejeuner' ? 0 : 1) - (b.meal_type === 'dejeuner' ? 0 : 1))
                            .map((m, k) => (
                              <span key={k} className="meal-chip">
                                {mealLabels[m.meal_type]}: {m.description?.substring(0, 40)}{m.description?.length > 40 ? '...' : ''}
                              </span>
                            ))
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Batch Recipes */}
        {batchRecipes.length > 0 && (
          <div className="section">
            <h2><ChefHat size={20} /> Recettes batch ({batchRecipes.length})</h2>
            <div className="recipes-list">
              {batchRecipes.map((recipe, i) => {
                const expanded = expandedRecipes[i]
                const recipeName = recipe.name.split('\n')[0].replace(/^B\d+\s*[—–-]\s*/, '')
                const timing = recipe.name.includes('\n') ? recipe.name.split('\n')[1].replace(/[()]/g, '').trim() : recipe.timing

                return (
                  <div key={i} className="recipe-card">
                    <div className="recipe-header" onClick={() => toggleRecipe(i)}>
                      <div className="recipe-title">
                        <h3>{recipeName}</h3>
                        <div className="recipe-badges">
                          {timing && <span className="timing-badge"><Clock size={12} /> {timing}</span>}
                          {recipe.rendement && <span className="yield-badge"><Flame size={12} /> {recipe.rendement.split('\n')[0]}</span>}
                          {recipe.macros_per_100g && <span className="macro-badge">{recipe.macros_per_100g}</span>}
                        </div>
                      </div>
                      {expanded ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#6b7280" />}
                    </div>

                    {expanded && (
                      <div className="recipe-body">
                        {recipe.ingredients && (
                          <div className="recipe-section">
                            <div className="section-label">Ingrédients</div>
                            <div className="detail-text">{recipe.ingredients.replace(/\|/g, '\n').replace(/•/g, '•')}</div>
                          </div>
                        )}

                        {recipe.portions && (
                          <div className="recipe-section">
                            <div className="section-label"><Users size={13} /> Portions par personne</div>
                            <div className="detail-text">{recipe.portions}</div>
                          </div>
                        )}

                        {recipe.instructions && (
                          <div className="recipe-section">
                            <div className="section-label">Préparation</div>
                            <div className="detail-text">{recipe.instructions}</div>
                          </div>
                        )}

                        {recipe.reheat && recipe.reheat !== recipe.instructions && (
                          <div className="reheat-box">
                            {recipe.reheat}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .container { padding: 16px; max-width: 800px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
        .header-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 20px; margin-bottom: 20px; }
        .back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #6b7280; cursor: pointer; font-size: 14px; padding: 4px 8px; border-radius: 6px; margin-bottom: 8px; }
        .back-btn:hover { background: rgba(0,0,0,0.05); }
        .header-card h1 { display: flex; align-items: center; gap: 8px; font-size: 22px; font-weight: bold; color: #1f2937; margin: 0 0 4px; }
        .header-card p { color: #6b7280; margin: 0; font-size: 14px; }

        .section { margin-bottom: 28px; }
        .section h2 { display: flex; align-items: center; gap: 8px; font-size: 18px; color: #1f2937; margin: 0 0 14px; }

        .daily-list { display: flex; flex-direction: column; gap: 12px; }
        .day-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 14px; padding: 16px; }
        .day-card.free { background: rgba(34,197,94,0.04); border-color: rgba(34,197,94,0.15); }

        .day-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .day-date { font-size: 15px; font-weight: 700; color: #1f2937; text-transform: capitalize; flex: 1; }
        .day-time { font-size: 13px; font-weight: 600; color: #2563eb; background: rgba(59,130,246,0.08); padding: 2px 10px; border-radius: 6px; }
        .day-free { font-size: 13px; font-weight: 600; color: #16a34a; background: rgba(34,197,94,0.08); padding: 2px 10px; border-radius: 6px; }

        .day-tasks { display: flex; flex-direction: column; gap: 6px; }
        .task-row { display: flex; gap: 10px; align-items: flex-start; }
        .task-icon { font-size: 18px; flex-shrink: 0; width: 28px; text-align: center; }
        .task-content { flex: 1; }
        .task-text { font-size: 14px; color: #374151; line-height: 1.4; }
        .task-time { font-size: 12px; color: #6b7280; margin-top: 2px; display: flex; align-items: center; gap: 4px; }

        .day-meals { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.06); }
        .meals-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
        .person-meals { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 4px; }
        .person-tag { font-size: 11px; font-weight: 700; color: #16a34a; background: rgba(34,197,94,0.08); padding: 2px 8px; border-radius: 4px; }
        .meal-chip { font-size: 12px; color: #374151; background: rgba(0,0,0,0.03); padding: 3px 8px; border-radius: 6px; }

        .recipes-list { display: flex; flex-direction: column; gap: 10px; }
        .recipe-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 14px; overflow: hidden; }
        .recipe-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; cursor: pointer; gap: 12px; }
        .recipe-header:hover { background: rgba(255,255,255,0.15); }
        .recipe-title { flex: 1; }
        .recipe-title h3 { font-size: 16px; font-weight: 700; color: #1f2937; margin: 0 0 6px; }
        .recipe-badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .timing-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; background: rgba(59,130,246,0.08); color: #2563eb; border-radius: 5px; font-size: 11px; font-weight: 500; }
        .yield-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; background: rgba(234,179,8,0.08); color: #92400e; border-radius: 5px; font-size: 11px; font-weight: 500; }
        .macro-badge { padding: 2px 8px; background: rgba(34,197,94,0.08); color: #16a34a; border-radius: 5px; font-size: 11px; font-weight: 500; }

        .recipe-body { padding: 0 16px 16px; }
        .recipe-section { margin-bottom: 12px; }
        .section-label { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .detail-text { font-size: 13px; color: #374151; line-height: 1.6; white-space: pre-line; }
        .reheat-box { background: rgba(234,179,8,0.06); border: 1px solid rgba(234,179,8,0.15); padding: 8px 12px; border-radius: 8px; font-size: 12px; color: #92400e; line-height: 1.4; }

        @media (max-width: 768px) {
          .recipe-badges { gap: 4px; }
          .day-header { flex-wrap: wrap; }
        }
      `}</style>
    </>
  )
}
