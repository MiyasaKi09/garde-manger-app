'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'

const MEAL_ORDER = ['pdj', 'dejeuner', 'collation', 'diner']
const MEAL_LABELS = { pdj: 'Petit-déjeuner', dejeuner: 'Déjeuner', collation: 'Collation', diner: 'Dîner' }
const MEAL_BAR = { pdj: 'var(--m-pdj)', dejeuner: 'var(--m-dej)', collation: 'var(--m-col)', diner: 'var(--m-din)' }

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function PlanningDetailPage() {
  const { importId } = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [dayIndex, setDayIndex] = useState(0)
  const [person, setPerson] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await authFetch(`/api/planning/imports/${importId}`)
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error || 'Planning introuvable')
        if (!cancelled) setData(payload)
      } catch (requestError) {
        if (!cancelled) setError(requestError.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [importId])

  const people = useMemo(() => {
    const members = (data?.householdMembers || []).filter(member => member.active !== false).map(member => member.name).filter(Boolean)
    return members.length ? members : [...new Set((data?.meals || []).map(meal => meal.person_name).filter(Boolean))].sort()
  }, [data])

  useEffect(() => {
    if (people.length && !people.includes(person)) setPerson(people[0])
  }, [people, person])

  const dates = useMemo(() => [...new Set((data?.meals || []).map(meal => meal.meal_date).filter(Boolean))].sort(), [data])
  const currentDate = dates[dayIndex] || null
  const meals = (data?.meals || [])
    .filter(meal => meal.meal_date === currentDate && meal.person_name === person)
    .sort((left, right) => MEAL_ORDER.indexOf(left.meal_type) - MEAL_ORDER.indexOf(right.meal_type))
  const total = (data?.dailyTotals || []).find(row => row.meal_date === currentDate && row.person_name === person)
  const tasks = (data?.prepTasks || []).filter(task => task.prep_date === currentDate)

  if (loading) {
    return (
      <div className="v21-page" aria-busy="true" aria-label="Chargement du planning">
        <div className="v21-skel" style={{ height: 100, marginBottom: 20 }} />
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="v21-skel" style={{ height: 68, marginBottom: 1, borderRadius: 0 }} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="v21-page">
        <h1 className="v21-title">Planning introuvable.</h1>
        <p className="v21-lede">{error}</p>
        <button className="v21-btn" onClick={() => router.push('/planning')}>Retour au planning</button>
      </div>
    )
  }

  const reviewRequired = data?.readiness?.reason === 'review_required'

  return (
    <div className="v21-page wide">
      <Link className="plan-detail-back" href="/planning"><ArrowLeft size={15} /> Retour au planning</Link>

      <header className="v21-hero plan-detail-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Planning · version {data?.activePlanVersion?.rules_version || 'importée'}</span>
          <h1 className="v21-title">La semaine.</h1>
          <div className="v21-rule" />
          <p className="v21-lede">{data?.import?.date_range_start && data?.import?.date_range_end
            ? `Du ${formatDate(data.import.date_range_start)} au ${formatDate(data.import.date_range_end)}.`
            : 'Repas, nutrition et préparation issus du même plan publié.'}</p>
        </div>
        <nav className="plan-detail-links" aria-label="Vues du planning">
          <Link href={`/planning/${importId}/persons`}>Par personne</Link>
          <Link href={`/planning/${importId}/batch`}>Préparation</Link>
          <Link href={`/planning/${importId}/shopping`}>Courses</Link>
        </nav>
      </header>

      {reviewRequired && (
        <div className="plan-detail-warning" role="status">
          Ce planning doit être revu avant exécution. Les créneaux protégés restent inchangés.
        </div>
      )}

      <div className="plan-detail-toolbar">
        <button onClick={() => setDayIndex(index => Math.max(0, index - 1))} disabled={dayIndex === 0} aria-label="Jour précédent"><ChevronLeft size={16} /></button>
        <strong>{currentDate ? formatDate(currentDate) : 'Aucun jour planifié'}</strong>
        <button onClick={() => setDayIndex(index => Math.min(dates.length - 1, index + 1))} disabled={!dates.length || dayIndex >= dates.length - 1} aria-label="Jour suivant"><ChevronRight size={16} /></button>
      </div>

      <div className="v21-tabs plan-detail-people" role="tablist" aria-label="Membre du foyer">
        {people.map(name => (
          <button key={name} role="tab" aria-selected={name === person} className={`v21-tab ${name === person ? 'on' : ''}`} onClick={() => setPerson(name)}>{name}</button>
        ))}
      </div>

      <section className="plan-detail-grid">
        <div>
          <div className="v21-bh"><span className="v21-bl">Repas de {person || 'la journée'}</span></div>
          <div className="v21-meals">
            {meals.length ? meals.map(meal => (
              <div key={meal.id} className="v21-meal plan-detail-meal">
                <span className="v21-meal-bar" style={{ background: MEAL_BAR[meal.meal_type] || MEAL_BAR.diner }} />
                <span className="v21-meal-l">{MEAL_LABELS[meal.meal_type] || meal.meal_type}</span>
                <div className="plan-detail-meal-body">
                  {meal.recipe_href
                    ? <Link href={meal.recipe_href} className="v21-meal-n">{meal.description}</Link>
                    : <span className="v21-meal-n">{meal.description}</span>}
                  <span className="plan-detail-macros">{Math.round(meal.kcal || 0)} kcal · {Math.round(meal.protein_g || 0)} P · {Math.round(meal.carbs_g || 0)} G · {Math.round(meal.fat_g || 0)} L</span>
                </div>
              </div>
            )) : <p className="v21-next">Aucun repas pour ce membre ce jour-là.</p>}
          </div>
          {total && (
            <div className={`plan-detail-total ${total.validated === false ? 'warn' : ''}`}>
              <span>Total journalier{total.validated == null ? '' : total.validated ? ' · dans la cible' : ' · à revoir'}</span>
              <strong>{Math.round(total.kcal || 0)} kcal · {Math.round(total.protein_g || 0)} P · {Math.round(total.carbs_g || 0)} G · {Math.round(total.fat_g || 0)} L</strong>
            </div>
          )}
        </div>

        <aside>
          <div className="v21-bh"><span className="v21-bl">Préparations du foyer</span></div>
          {tasks.length ? tasks.map(task => (
            <div key={task.id} className="plan-detail-task">
              <strong>{task.task}</strong>
              <span>{task.estimated_time || 'Durée non renseignée'}</span>
            </div>
          )) : <p className="v21-next">Aucune préparation prévue ce jour-là.</p>}
        </aside>
      </section>

      <style jsx>{`
        .plan-detail-back { display:inline-flex; align-items:center; gap:7px; color:var(--ink-3); text-decoration:none; font:600 11px var(--font-mono); text-transform:uppercase; margin-bottom:20px; }
        .plan-detail-hero { align-items:flex-end; }
        .plan-detail-links { display:flex; gap:14px; flex-wrap:wrap; }
        .plan-detail-links :global(a) { color:var(--terracotta); font:600 11px var(--font-mono); text-transform:uppercase; text-decoration:none; }
        .plan-detail-warning { padding:12px 14px; margin-bottom:18px; border:1px solid var(--state-soon); color:var(--ink-1); background:color-mix(in srgb, var(--state-soon) 9%, transparent); }
        .plan-detail-toolbar { display:flex; align-items:center; justify-content:center; gap:14px; padding:12px 0; border-block:1px solid var(--line); }
        .plan-detail-toolbar button { display:flex; border:1px solid var(--line-strong); background:transparent; padding:7px; cursor:pointer; }
        .plan-detail-toolbar button:disabled { opacity:.3; cursor:not-allowed; }
        .plan-detail-toolbar strong { min-width:260px; text-align:center; font:600 17px var(--font-display); text-transform:capitalize; }
        .plan-detail-people { margin:18px 0; width:max-content; max-width:100%; overflow:auto; }
        .plan-detail-grid { display:grid; grid-template-columns:minmax(0,2fr) minmax(240px,1fr); gap:42px; }
        .plan-detail-meal { grid-template-columns:8px 110px minmax(0,1fr); align-items:start; }
        .plan-detail-meal-body { display:flex; flex-direction:column; gap:5px; min-width:0; }
        .plan-detail-meal-body :global(a) { text-decoration:none; }
        .plan-detail-macros { color:var(--ink-3); font:11px var(--font-mono); }
        .plan-detail-total { display:flex; justify-content:space-between; gap:12px; margin-top:16px; padding-top:14px; border-top:2px solid var(--ink-1); font:11px var(--font-mono); }
        .plan-detail-total.warn { color:var(--state-soon); }
        .plan-detail-task { display:flex; flex-direction:column; gap:5px; padding:12px 0; border-bottom:1px solid var(--line); }
        .plan-detail-task strong { font:600 14px var(--font-text); }
        .plan-detail-task span { color:var(--ink-3); font:11px var(--font-mono); }
        @media (max-width:760px) { .plan-detail-grid { grid-template-columns:1fr; gap:28px; } .plan-detail-hero { align-items:flex-start; } .plan-detail-toolbar strong { min-width:0; flex:1; } }
        @media (max-width:520px) { .plan-detail-meal { grid-template-columns:8px minmax(0,1fr); } .plan-detail-meal > .v21-meal-l { display:none; } .plan-detail-total { flex-direction:column; } }
      `}</style>
    </div>
  )
}
