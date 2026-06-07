'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import NutritionBar from '@/components/ui/NutritionBar'
import PersonSelector from '@/components/ui/PersonSelector'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import './nutrition.css'

// AJR (Apports Journaliers Recommandés) for micronutrient %
const AJR = {
  calcium_mg: 800, fer_mg: 14, magnesium_mg: 375, zinc_mg: 10,
  selenium_ug: 55, vitamine_a_ug: 800, vitamine_c_mg: 80,
  vitamine_d_ug: 5, vitamine_e_mg: 12, vitamine_b1_mg: 1.1,
  vitamine_b2_mg: 1.4, vitamine_b3_mg: 16, vitamine_b6_mg: 1.4,
  vitamine_b9_ug: 200, vitamine_b12_ug: 2.5, vitamine_k_ug: 75,
  potassium_mg: 2000, sodium_mg: 2400, phosphore_mg: 700,
}

const MEAL_LABELS = {
  pdj: 'Petit-déj', dejeuner: 'Déjeuner', diner: 'Dîner',
}
const mealLabel = (t) => MEAL_LABELS[t] || 'Collation'

export default function NutritionPage() {
  const router = useRouter()
  const [person, setPerson] = useState('Julien')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [meals, setMeals] = useState([])
  const [goals, setGoals] = useState(null)
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWeightInput, setShowWeightInput] = useState(false)
  const [newWeight, setNewWeight] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else loadData()
    })
  }, [])

  useEffect(() => { loadData() }, [person, date])

  async function loadData() {
    setLoading(true)
    try {
      const [mealsRes, goalsRes, weightRes] = await Promise.all([
        authFetch(`/api/nutrition/log?from=${date}&to=${date}&person=${person}`),
        authFetch('/api/nutrition/goals'),
        authFetch(`/api/nutrition/weight?person=${person}&limit=30`),
      ])

      const mealsData = await mealsRes.json()
      setMeals(mealsData.entries || [])

      const goalsData = await goalsRes.json()
      const allGoals = goalsData.goals || []
      setGoals(allGoals.find(g => g.person_name === person) || allGoals[0] || null)

      const weightData = await weightRes.json()
      setWeights(weightData.entries || [])
    } catch {
      // erreur silencieuse en prod
    } finally {
      setLoading(false)
    }
  }

  async function handleAddWeight() {
    if (!newWeight) return
    try {
      await authFetch('/api/nutrition/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_name: person, date, weight_kg: parseFloat(newWeight) }),
      })
      setShowWeightInput(false)
      setNewWeight('')
      loadData()
    } catch {
      // erreur silencieuse en prod
    }
  }

  const totals = meals.reduce((acc, m) => ({
    kcal: acc.kcal + (m.kcal || 0),
    protein_g: acc.protein_g + (m.protein_g || 0),
    carbs_g: acc.carbs_g + (m.carbs_g || 0),
    fat_g: acc.fat_g + (m.fat_g || 0),
    fiber_g: acc.fiber_g + (m.fiber_g || 0),
  }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 })

  const microTotals = meals.reduce((acc, m) => {
    if (m.micronutrients) {
      for (const [key, val] of Object.entries(m.micronutrients)) {
        acc[key] = (acc[key] || 0) + (val || 0)
      }
    }
    return acc
  }, {})

  const changeDate = (delta) => {
    const d = new Date(date)
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().split('T')[0])
  }

  const isToday = date === new Date().toISOString().split('T')[0]
  const displayDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
  const dateLabel = isToday ? "Aujourd'hui" : displayDate.charAt(0).toUpperCase() + displayDate.slice(1)

  const latestWeight = weights[0]
  const activeMicros = Object.entries(AJR).filter(([key]) => (microTotals[key] || 0) > 0)

  return (
    <div className="v21-page nutrition-page">

      {/* HERO ÉDITORIAL */}
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Nutrition</span>
          <h1 className="v21-title">Suivi.</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Ce qui nourrit, jour après jour.</p>
        </div>
        <div className="v21-hero-side">
          <PersonSelector selected={person} onChange={setPerson} />
        </div>
      </header>

      {/* NAVIGATION DE DATE — contrôles mono */}
      <div className="nut-datenav">
        <button onClick={() => changeDate(-1)} className="nut-datebtn" aria-label="Jour précédent">
          <ChevronLeft size={16} />
        </button>
        <span className="nut-datelabel">{dateLabel}</span>
        <button onClick={() => changeDate(1)} className="nut-datebtn" aria-label="Jour suivant">
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="nut-skel-wrap" aria-busy="true" aria-label="Chargement">
          <div className="v21-skel" style={{ height: 220 }} />
          <div className="v21-skel" style={{ height: 160 }} />
        </div>
      ) : (
        <>
          {/* MACROS */}
          <section className="v21-section strong">
            <div className="v21-bh"><span className="v21-bl">Macronutriments</span></div>
            <div className="v21-macros">
              <NutritionBar label="Calories" value={totals.kcal} target={goals?.target_calories} unit=" kcal" color="var(--brand)" />
              <NutritionBar label="Protéines" value={totals.protein_g} target={goals?.target_protein_g} unit="g" color="#3b82f6" />
              <NutritionBar label="Glucides" value={totals.carbs_g} target={goals?.target_carbs_g} unit="g" color="var(--saffron)" />
              <NutritionBar label="Lipides" value={totals.fat_g} target={goals?.target_fat_g} unit="g" color="var(--terracotta)" />
              <NutritionBar label="Fibres" value={totals.fiber_g} target={goals?.target_fiber_g || 30} unit="g" color="var(--olive)" />
            </div>
            {!goals && (
              <p className="v21-next">
                Pas encore d'objectifs. <Link href="/nutrition/onboarding" className="v21-link">Les définir →</Link>
              </p>
            )}
          </section>

          {/* MICRONUTRIMENTS */}
          {activeMicros.length > 0 && (
            <section className="v21-section">
              <div className="v21-bh"><span className="v21-bl">Micronutriments</span></div>
              <div className="nut-micros">
                {activeMicros.map(([key, ajr]) => {
                  const val = microTotals[key] || 0
                  const pct = Math.round((val / ajr) * 100)
                  const label = key.replace(/_/g, ' ').replace(/vitamine /g, 'Vit. ').replace(/ (mg|ug)$/g, '')
                  const cls = pct >= 80 ? 'ok' : pct >= 50 ? 'mid' : 'low'
                  return (
                    <div key={key} className="nut-micro">
                      <span className="nut-micro-l">{label}</span>
                      <span className={`nut-micro-v ${cls}`}>{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* REPAS DU JOUR */}
          <section className="v21-section">
            <div className="v21-bh"><span className="v21-bl">Repas du jour</span></div>
            {meals.length === 0 ? (
              <div className="v21-empty"><p>Aucun repas enregistré pour cette journée.</p></div>
            ) : (
              <div className="nut-meals">
                {meals.map((m, i) => (
                  <div key={i} className="nut-meal">
                    <span className="nut-meal-t">{mealLabel(m.meal_type)}</span>
                    <span className="nut-meal-n">{m.description || 'Repas'}</span>
                    {m.kcal != null && <span className="nut-meal-k">{Math.round(m.kcal)} kcal</span>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* POIDS */}
          <section className="v21-section flush">
            <div className="v21-bh">
              <span className="v21-bl">Poids</span>
              <button onClick={() => setShowWeightInput(!showWeightInput)} className="v21-btn ghost sm">
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {showWeightInput && (
              <div className="nut-weight-form">
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  placeholder="Ex : 72.5"
                  className="nut-input"
                  autoFocus
                />
                <button onClick={handleAddWeight} className="v21-btn">Enregistrer</button>
              </div>
            )}

            {latestWeight ? (
              <div className="nut-weight-now">
                <span className="nut-weight-v">{latestWeight.weight_kg}<span className="nut-weight-u"> kg</span></span>
                <span className="nut-weight-d">
                  {new Date(latestWeight.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
                {goals?.target_weight_kg && (
                  <span className="nut-weight-goal">Objectif {goals.target_weight_kg} kg</span>
                )}
              </div>
            ) : (
              <p className="v21-next" style={{ marginTop: 0 }}>Aucune mesure enregistrée.</p>
            )}

            {weights.length > 1 && (
              <div className="nut-weight-hist">
                {weights.slice(0, 10).map((w, i) => (
                  <div key={i} className="nut-weight-row">
                    <span className="nut-weight-row-d">
                      {new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="nut-weight-row-v">{w.weight_kg} kg</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
