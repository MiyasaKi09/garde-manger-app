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
  const people = useMemo(() => {
    const configured = (data?.householdMembers || []).map(member => member.name).filter(Boolean)
    return configured.length ? configured : [...new Set((data?.meals || []).map(meal => meal.person_name).filter(Boolean))].sort()
  }, [data])

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

  const mealLabels = { pdj: 'Petit-déj', dejeuner: 'Déjeuner', diner: 'Dîner', collation: 'Collation' }
  const MEAL_BAR = { pdj: 'var(--m-pdj)', dejeuner: 'var(--m-dej)', diner: 'var(--m-din)', collation: 'var(--m-col)' }

  if (loading) {
    return (
      <div className="v21-page wide" aria-busy="true" aria-label="Chargement">
        <div className="v21-skel" style={{ height: 90, marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[0, 1].map(c => (
            <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="v21-skel" style={{ height: 56, borderRadius: 0 }} />)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="v21-page wide">
        <button className="pers-back" onClick={() => router.push(`/planning/${importId}`)}>
          <ArrowLeft size={15} /> Retour au calendrier
        </button>

        {/* ═══ HERO ÉDITORIAL ═══ */}
        <header className="v21-hero">
          <div className="v21-hero-text">
            <span className="v21-eyebrow">Planning · par personne</span>
            <h1 className="v21-title">Par personne.</h1>
            <div className="v21-rule" />
            <p className="v21-lede">Les assiettes du foyer, jour par jour.</p>
          </div>
          {/* Day selector */}
          <div className="pers-daynav">
            <button className="pers-arrow" onClick={() => setDayIndex(Math.max(0, dayIndex - 1))} disabled={dayIndex === 0} aria-label="Jour précédent">
              <ChevronLeft size={16} />
            </button>
            <span className="pers-day-label">
              {currentDate && new Date(currentDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <button className="pers-arrow" onClick={() => setDayIndex(Math.min(dates.length - 1, dayIndex + 1))} disabled={dayIndex >= dates.length - 1} aria-label="Jour suivant">
              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        <div className="pers-grid">
          {people.map(person => {
            const meals = getMeals(person)
            const total = getTotal(person)
            return (
              <section key={person} className="pers-col">
                <div className="v21-bh"><span className="v21-bl">{person}</span></div>

                <div className="v21-meals">
                  {meals.map(meal => (
                    <div key={meal.id} className="v21-meal pers-meal">
                      <span className="v21-meal-bar" style={{ background: MEAL_BAR[meal.meal_type] || MEAL_BAR.diner }} />
                      <span className="v21-meal-l">{mealLabels[meal.meal_type] || meal.meal_type}</span>
                      <div className="pers-meal-body">
                        <span className="v21-meal-n">{meal.description}</span>
                        <div className="pers-macros">
                          <span className="pers-m"><b>{meal.kcal}</b> kcal</span>
                          <span className="pers-m"><b>{meal.protein_g}</b>P</span>
                          <span className="pers-m"><b>{meal.carbs_g}</b>G</span>
                          <span className="pers-m"><b>{meal.fat_g}</b>L</span>
                          {meal.fiber_g != null && <span className="pers-m"><b>{meal.fiber_g}</b>F</span>}
                          {meal.day_type && <span className="pers-daytype">{meal.day_type}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {total && (
                  <div className={`pers-total ${total.validated ? 'ok' : 'warn'}`}>
                    <span className="pers-total-l">Total jour · {total.validated ? 'dans la cible' : 'hors cible'}</span>
                    <div className="pers-macros pers-macros-total">
                      <span className="pers-m"><b>{total.kcal}</b> kcal</span>
                      <span className="pers-m"><b>{total.protein_g}</b>P</span>
                      <span className="pers-m"><b>{total.carbs_g}</b>G</span>
                      <span className="pers-m"><b>{total.fat_g}</b>L</span>
                      {total.fiber_g != null && <span className="pers-m"><b>{total.fiber_g}</b>F</span>}
                    </div>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .pers-back {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.03em; text-transform: uppercase;
          background: none; border: none; color: var(--ink-3); cursor: pointer;
          padding: 0; margin-bottom: 20px; transition: color 0.15s ease;
        }
        .pers-back:hover { color: var(--terracotta); }

        .pers-daynav { display: flex; align-items: center; gap: 12px; }
        .pers-arrow {
          width: 34px; height: 34px; border-radius: 3px;
          border: 1px solid var(--line-strong); background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center; color: var(--ink-2);
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .pers-arrow:hover:not(:disabled) { border-color: var(--ink-1); color: var(--ink-1); }
        .pers-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
        .pers-day-label {
          font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.03em; text-transform: uppercase;
          color: var(--ink-2); min-width: 150px; text-align: center;
        }

        .pers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 0; }
        .pers-col { padding: 30px 0; min-width: 0; }
        .pers-col { border-right: 1px solid var(--line); padding-left: 32px; padding-right: 32px; }
        .pers-col:first-child { padding-left: 0; }
        .pers-col:last-child { border-right: none; padding-right: 0; }

        /* Ligne repas adaptée : barre | label | corps (nom + macros) */
        .v21-meal.pers-meal { grid-template-columns: 8px 92px 1fr; align-items: start; }
        .pers-meal-body { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .pers-macros { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
        .pers-m { font-family: var(--font-mono); font-size: 11px; color: var(--ink-3); }
        .pers-m b { font-weight: 600; color: var(--ink-2); font-variant-numeric: tabular-nums; }
        .pers-daytype {
          font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--ink-3); border: 1px solid var(--line); border-radius: 3px; padding: 1px 6px;
        }

        .pers-total {
          display: flex; flex-direction: column; gap: 8px;
          margin-top: 14px; padding: 14px 0 0; border-top: 1.5px solid var(--ink-1);
        }
        .pers-total-l {
          font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.04em; text-transform: uppercase;
          color: var(--ink-2);
        }
        .pers-total.warn .pers-total-l { color: var(--state-soon); }
        .pers-total.ok .pers-total-l { color: var(--state-fresh); }
        .pers-macros-total .pers-m { font-size: 12px; }
        .pers-macros-total .pers-m b { font-size: 13px; color: var(--ink-1); }

        @media (max-width: 768px) {
          .pers-grid { grid-template-columns: 1fr; }
          .pers-col { border-right: none; border-bottom: 1px solid var(--line); padding-left: 0; padding-right: 0; }
          .pers-col:last-child { border-bottom: none; }
        }
        @media (max-width: 560px) {
          .v21-meal.pers-meal { grid-template-columns: 8px 1fr; }
          .v21-meal.pers-meal .v21-meal-l { display: none; }
        }
      `}</style>
    </>
  )
}
