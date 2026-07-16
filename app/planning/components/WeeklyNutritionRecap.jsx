'use client'

import { CheckCircle2, Gauge } from 'lucide-react'
import { aggregateDailyTotals } from '@/lib/nutritionPlanService'

const METRICS = [
  { key: 'protein_g', goal: 'target_protein_g', label: 'Protéines', unit: 'g' },
  { key: 'carbs_g', goal: 'target_carbs_g', label: 'Glucides', unit: 'g' },
  { key: 'fat_g', goal: 'target_fat_g', label: 'Lipides', unit: 'g' },
  { key: 'fiber_g', goal: 'target_fiber_g', label: 'Fibres', unit: 'g' },
]

const percent = (value, target) => target > 0 ? Math.round((value / target) * 100) : null
const clamp = (value) => Math.max(0, Math.min(100, value || 0))

export function buildWeeklyNutritionRows(meals = [], goals = []) {
  const daily = aggregateDailyTotals(meals, goals)
  const byPerson = new Map()
  for (const day of daily) {
    if (!byPerson.has(day.person_name)) {
      byPerson.set(day.person_name, { days: 0, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, fiberDays: 0 })
    }
    const person = byPerson.get(day.person_name)
    person.days += 1
    person.kcal += day.kcal
    person.protein_g += day.protein_g
    person.carbs_g += day.carbs_g
    person.fat_g += day.fat_g
    if (day.fiber_g != null) { person.fiber_g += day.fiber_g; person.fiberDays += 1 }
  }

  const goalByPerson = new Map((goals || []).filter((goal) => goal?.person_name).map((goal) => [goal.person_name, goal]))
  return [...byPerson.entries()].map(([person, values]) => {
    const avg = {
      kcal: Math.round(values.kcal / values.days),
      protein_g: Math.round(values.protein_g / values.days),
      carbs_g: Math.round(values.carbs_g / values.days),
      fat_g: Math.round(values.fat_g / values.days),
      fiber_g: values.fiberDays ? Math.round(values.fiber_g / values.fiberDays) : null,
    }
    const goal = goalByPerson.get(person) || {}
    const target = Number(goal.target_calories) || null
    const coverage = percent(avg.kcal, target)
    const deviation = target ? Math.abs(avg.kcal - target) / target : null
    const tone = deviation == null ? 'none' : deviation <= 0.05 ? 'ok' : deviation <= 0.1 ? 'warn' : 'off'
    return { person, avg, goal, target, coverage, tone, days: values.days }
  })
}

export default function WeeklyNutritionRecap({ meals = [], goals = [] }) {
  const rows = buildWeeklyNutritionRows(meals, goals)
  if (!rows.length) return null

  return (
    <section className="wnr" aria-labelledby="wnr-title">
      <header className="wnr-head">
        <div>
          <span className="wnr-eyebrow">Équilibre personnalisé</span>
          <h2 id="wnr-title">Prévisions quotidiennes</h2>
        </div>
        <p>Portions calculées séparément pour chaque convive sur les objectifs actifs.</p>
      </header>

      <div className="wnr-grid">
        {rows.map(({ person, avg, goal, target, coverage, tone, days }) => (
          <article key={person} className={`wnr-card wnr-${tone}`}>
            <header>
              <div className="wnr-person"><span>{person.slice(0, 1)}</span><b>{person}</b></div>
              <span className="wnr-status">
                {tone === 'ok' ? <CheckCircle2 size={14} /> : <Gauge size={14} />}
                {coverage == null ? 'Sans cible' : `${coverage} % de la cible`}
              </span>
            </header>

            <div className="wnr-energy">
              <strong>{avg.kcal.toLocaleString('fr-FR')}</strong>
              <span>kcal / jour</span>
              {target && <em>objectif {target.toLocaleString('fr-FR')}</em>}
            </div>
            {target && (
              <div className="wnr-track" role="progressbar" aria-label={`Énergie de ${person}`} aria-valuenow={clamp(coverage)} aria-valuemin="0" aria-valuemax="100">
                <i style={{ width: `${clamp(coverage)}%` }} />
              </div>
            )}

            <dl className="wnr-metrics">
              {METRICS.map((metric) => {
                const value = avg[metric.key]
                const metricTarget = Number(goal[metric.goal]) || null
                const metricCoverage = percent(value, metricTarget)
                return (
                  <div key={metric.key}>
                    <dt>{metric.label}</dt>
                    <dd><b>{value ?? '—'} {value != null ? metric.unit : ''}</b>{metricTarget && <span>/ {metricTarget} {metric.unit}</span>}</dd>
                    {metricTarget && <i><b style={{ width: `${clamp(metricCoverage)}%` }} /></i>}
                  </div>
                )
              })}
            </dl>
            <footer>Moyenne calculée sur {days} jour{days > 1 ? 's' : ''}</footer>
          </article>
        ))}
      </div>
    </section>
  )
}
