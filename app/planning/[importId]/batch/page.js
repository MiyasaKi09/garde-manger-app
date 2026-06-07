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

  if (loading) return (
    <div className="v21-page" aria-busy="true" aria-label="Chargement">
      <div className="v21-skel" style={{ height: 90, marginBottom: 24 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="v21-skel" style={{ height: 96, marginBottom: 14 }} />
      ))}
    </div>
  )
  if (!data) return null

  return (
    <>
      <div className="v21-page">
        <button className="bat-back" onClick={() => router.push(`/planning/${importId}`)}>
          <ArrowLeft size={15} /> Retour au calendrier
        </button>

        {/* ═══ HERO ÉDITORIAL ═══ */}
        <header className="v21-hero">
          <div className="v21-hero-text">
            <span className="v21-eyebrow">Planning · batch cooking</span>
            <h1 className="v21-title">Cuisine du jour.</h1>
            <div className="v21-rule" />
            <p className="v21-lede">Ce qu'on prépare, ce qu'on sert — jour après jour.</p>
          </div>
        </header>

        {/* Day by day */}
        {days.map((day, i) => {
          const isFree = day.prep.every(t => /libre|🎉|0\s*min/i.test(t.task))
          const totalMin = day.prep.reduce((s, t) => {
            const m = (t.estimated_time || '').match(/(\d+)\s*min/i)
            return s + (m ? parseInt(m[1]) : 0)
          }, 0)

          return (
            <section key={i} className={`bat-day ${isFree ? 'free' : ''}`}>
              <div className="bat-day-h">
                <span className="bat-day-date">{formatDate(day.date, day.label)}</span>
                {totalMin > 0 && <span className="bat-day-time">{totalMin} min</span>}
                {isFree && <span className="bat-day-free">Repos</span>}
              </div>

              <div className="bat-day-body">
                {/* Prep tasks */}
                {day.prep.map((task, j) => {
                  const isBatch = /batch/i.test(task.task)
                  const isPortionner = /portionner|restes/i.test(task.task)
                  return (
                    <div key={j} className={`bat-task ${isBatch ? 'batch' : ''}`}>
                      <span className="bat-task-bar" aria-hidden="true" style={{ background: isBatch ? '#D9A33A' : isFree ? 'var(--line-strong)' : '#6E7A3F' }} />
                      <span className="bat-task-l">{isBatch ? 'Batch' : isPortionner ? 'Prep' : isFree ? 'Repos' : 'Prep'}</span>
                      <span className="bat-task-t">{task.task}</span>
                      {task.estimated_time && !/🎉/.test(task.estimated_time) && (
                        <span className="bat-task-time">{task.estimated_time}</span>
                      )}
                    </div>
                  )
                })}

                {/* Meals to serve */}
                {day.meals.length > 0 && (
                  <div className="bat-serve">
                    {['dejeuner', 'diner'].map(mt => {
                      const mealsForType = day.meals.filter(m => m.meal_type === mt)
                      if (mealsForType.length === 0) return null
                      return (
                        <div key={mt} className="bat-serve-block">
                          <span className="bat-serve-l">{mt === 'dejeuner' ? 'Midi' : 'Soir'}</span>
                          {mealsForType.map((m, k) => (
                            <div key={k} className="bat-serve-item">
                              <span className="bat-serve-p">{m.person_name}</span>
                              <span className="bat-serve-d">{m.description}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          )
        })}

        {/* Recipes reference */}
        {batchRecipes.length > 0 && (
          <section className="bat-recipes">
            <div className="v21-bh"><span className="v21-bl">Recettes · {batchRecipes.length}</span></div>
            <div className="v21-its">
              {batchRecipes.map((recipe, i) => {
                const name = recipe.name.split('\n')[0].replace(/^B\d+\s*[—–-]\s*/, '')
                const expanded = expandedRecipe === i

                return (
                  <div key={i} className="bat-recipe">
                    <button type="button" className="bat-recipe-head" onClick={() => setExpandedRecipe(expanded ? null : i)} aria-expanded={expanded}>
                      <span className="bat-recipe-name">{name}</span>
                      <span className="bat-recipe-meta">
                        {recipe.rendement && <span>{recipe.rendement.split('\n')[0]}</span>}
                        {recipe.macros_per_100g && <span>{recipe.macros_per_100g}</span>}
                      </span>
                      {expanded ? <ChevronUp size={16} color="var(--ink-3)" /> : <ChevronDown size={16} color="var(--ink-3)" />}
                    </button>
                    {expanded && (
                      <div className="bat-recipe-detail">
                        {recipe.ingredients && <div className="bat-r-block"><span className="bat-r-l">Ingrédients</span><div className="bat-r-t">{recipe.ingredients.replace(/\|/g, '\n')}</div></div>}
                        {recipe.portions && <div className="bat-r-block"><span className="bat-r-l">Portions</span><div className="bat-r-t">{recipe.portions}</div></div>}
                        {recipe.instructions && <div className="bat-r-block"><span className="bat-r-l">Préparation</span><div className="bat-r-t">{recipe.instructions}</div></div>}
                        {recipe.reheat && <div className="bat-r-reheat">{recipe.reheat}</div>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .bat-back {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.03em; text-transform: uppercase;
          background: none; border: none; color: var(--ink-3); cursor: pointer;
          padding: 0; margin-bottom: 20px; transition: color 0.15s ease;
        }
        .bat-back:hover { color: var(--terracotta); }

        .bat-day { padding: 22px 0 4px; border-top: 1px solid var(--line); }
        .bat-day:first-of-type { border-top: none; }
        .bat-day.free { opacity: 0.6; }
        .bat-day-h { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; }
        .bat-day-date {
          font-family: var(--font-display); font-size: 20px; font-weight: 600;
          letter-spacing: -0.02em; color: var(--ink-1); text-transform: capitalize;
        }
        .bat-day-time, .bat-day-free {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.03em; text-transform: uppercase;
          padding: 2px 8px; border-radius: 3px;
        }
        .bat-day-time { color: var(--ink-2); border: 1px solid var(--line-strong); }
        .bat-day-free { color: #fff; background: var(--brand); }

        .bat-task {
          display: grid; grid-template-columns: 8px 64px 1fr auto; align-items: stretch;
          border-bottom: 1px solid var(--line);
        }
        .bat-task-bar { align-self: stretch; }
        .bat-task > span:not(.bat-task-bar) { padding: 11px 14px; display: flex; align-items: center; min-width: 0; }
        .bat-task-l { font-family: var(--font-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-3); }
        .bat-task-t { font-family: var(--font-text); font-size: 14px; color: var(--ink-1); line-height: 1.4; }
        .bat-task-time { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); white-space: nowrap; justify-content: flex-end; }

        .bat-serve { padding: 12px 0 4px 22px; }
        .bat-serve-block { margin-bottom: 10px; }
        .bat-serve-block:last-child { margin-bottom: 0; }
        .bat-serve-l { font-family: var(--font-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-3); display: block; margin-bottom: 4px; }
        .bat-serve-item { display: flex; gap: 10px; padding: 2px 0; }
        .bat-serve-p { font-family: var(--font-mono); font-size: 12px; font-weight: 600; color: var(--brand); min-width: 52px; }
        .bat-serve-d { font-family: var(--font-text); font-size: 13px; color: var(--ink-2); }

        .bat-recipes { margin-top: 34px; padding-top: 8px; border-top: 1.5px solid var(--ink-1); }
        .bat-recipe { border-bottom: 1px solid var(--line); }
        .bat-recipe-head {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 14px 4px; background: transparent; border: none; cursor: pointer; text-align: left;
          transition: background 0.15s ease;
        }
        .bat-recipe-head:hover { background: var(--surface-soft); }
        .bat-recipe-name { font-family: var(--font-display); font-size: 17px; font-weight: 500; color: var(--ink-1); flex: 1; min-width: 0; }
        .bat-recipe-meta { display: flex; gap: 10px; font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.03em; }

        .bat-recipe-detail { padding: 0 4px 16px; }
        .bat-r-block { margin-bottom: 12px; }
        .bat-r-l { display: block; font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .bat-r-t { font-family: var(--font-text); font-size: 13px; color: var(--ink-2); line-height: 1.6; white-space: pre-line; }
        .bat-r-reheat {
          font-family: var(--font-text); font-size: 12px; color: var(--state-soon);
          background: var(--state-soon-bg); border-radius: 3px; padding: 8px 12px;
        }

        @media (max-width: 560px) {
          .bat-task { grid-template-columns: 8px 56px 1fr; }
          .bat-task-time { display: none; }
        }
      `}</style>
    </>
  )
}
