'use client'

import { aggregateDailyTotals } from '@/lib/nutritionPlanService'

/**
 * Bandeau « prévisions nutritionnelles de la semaine » (cockpit planning).
 * Moyennes journalières par personne, calculées sur les jours ayant des repas,
 * comparées aux cibles de user_health_goals quand elles existent.
 *
 * Pastille : verte si la moyenne kcal est à ±5 % de la cible, orange à ±10 %,
 * rouge au-delà, grise sans cible.
 */
export default function WeeklyNutritionRecap({ meals = [], goals = [] }) {
  if (!meals.length) return null

  const daily = aggregateDailyTotals(meals, goals)
  if (!daily.length) return null

  // Moyennes par personne sur les jours présents
  const byPerson = new Map()
  for (const d of daily) {
    if (!byPerson.has(d.person_name)) {
      byPerson.set(d.person_name, { days: 0, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, fiberDays: 0 })
    }
    const p = byPerson.get(d.person_name)
    p.days += 1
    p.kcal += d.kcal
    p.protein_g += d.protein_g
    p.carbs_g += d.carbs_g
    p.fat_g += d.fat_g
    if (d.fiber_g != null) { p.fiber_g += d.fiber_g; p.fiberDays += 1 }
  }

  const goalByPerson = new Map()
  for (const g of goals || []) {
    if (g?.person_name) goalByPerson.set(g.person_name, g)
  }

  const rows = [...byPerson.entries()].map(([person, p]) => {
    const avg = {
      kcal: Math.round(p.kcal / p.days / 10) * 10,
      protein_g: Math.round(p.protein_g / p.days),
      carbs_g: Math.round(p.carbs_g / p.days),
      fat_g: Math.round(p.fat_g / p.days),
      fiber_g: p.fiberDays ? Math.round(p.fiber_g / p.fiberDays) : null,
    }
    const target = Number(goalByPerson.get(person)?.target_calories) || null
    let tone = 'none'
    if (target) {
      const dev = Math.abs(avg.kcal - target) / target
      tone = dev <= 0.05 ? 'ok' : dev <= 0.10 ? 'warn' : 'off'
    }
    return { person, avg, target, tone, days: p.days }
  })

  return (
    <section className="wnr" aria-label="Prévisions nutritionnelles de la semaine">
      <span className="wnr-lbl">Prévisions / jour</span>
      {rows.map(({ person, avg, target, tone, days }) => (
        <span key={person} className="wnr-person">
          <i className={`wnr-dot wnr-${tone}`} aria-hidden="true" />
          <b>{person}</b>
          <span className="wnr-kcal">
            Ø {avg.kcal} kcal{target ? ` (cible ${target})` : ''}
          </span>
          <span className="wnr-macros">
            P {avg.protein_g} g · G {avg.carbs_g} g · L {avg.fat_g} g
            {avg.fiber_g != null ? ` · F ${avg.fiber_g} g` : ''}
          </span>
          {days < 7 && <span className="wnr-days">({days} j)</span>}
        </span>
      ))}
    </section>
  )
}
