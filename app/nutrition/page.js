'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import NutritionBar from '@/components/ui/NutritionBar'
import PersonSelector from '@/components/ui/PersonSelector'
import { ChevronLeft, ChevronRight, Scale, Plus, TrendingDown } from 'lucide-react'
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

  const latestWeight = weights[0]

  return (
    <>
      <div className="myko-canvas" aria-hidden="true" />
      <div className="nutrition-page">
        <div className="hero-header">
          <div className="hero-content">
            <div className="hero-text">
              <span className="hero-eyebrow">Nutrition</span>
              <h1 className="hero-title">Suivi nutritionnel</h1>
            </div>
            <div className="hero-actions">
              <PersonSelector selected={person} onChange={setPerson} />
            </div>
          </div>
        </div>

        <div className="nutrition-date-nav">
          <button onClick={() => changeDate(-1)} className="nutrition-date-btn">
            <ChevronLeft size={18} />
          </button>
          <span className="nutrition-date-label">
            {isToday ? "Aujourd'hui" : displayDate}
          </span>
          <button onClick={() => changeDate(1)} className="nutrition-date-btn">
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="myko-loading">Chargement...</div>
        ) : (
          <>
            {/* Macros */}
            <div className="nutrition-section-card">
              <h3 className="nutrition-section-title">Macronutriments</h3>
              <NutritionBar label="Calories" value={totals.kcal} target={goals?.target_calories} unit=" kcal" color="#16a34a" />
              <NutritionBar label="Protéines" value={totals.protein_g} target={goals?.target_protein_g} unit="g" color="#3b82f6" />
              <NutritionBar label="Glucides" value={totals.carbs_g} target={goals?.target_carbs_g} unit="g" color="#f59e0b" />
              <NutritionBar label="Lipides" value={totals.fat_g} target={goals?.target_fat_g} unit="g" color="#ef4444" />
              <NutritionBar label="Fibres" value={totals.fiber_g} target={goals?.target_fiber_g || 30} unit="g" color="#8b5cf6" />
            </div>

            {/* Micronutriments */}
            {Object.keys(microTotals).length > 0 && (
              <div className="nutrition-section-card">
                <h3 className="nutrition-section-title">Micronutriments</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
                  {Object.entries(AJR).map(([key, ajr]) => {
                    const val = microTotals[key] || 0
                    if (val === 0) return null
                    const pct = Math.round((val / ajr) * 100)
                    const label = key.replace(/_/g, ' ').replace(/vitamine /g, 'Vit. ').replace(/ (mg|ug)$/g, '')
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: 'rgba(0,0,0,0.02)', borderRadius: 6 }}>
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-3)', textTransform: 'capitalize' }}>{label}</span>
                        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: pct >= 80 ? 'var(--brand)' : pct >= 50 ? '#f59e0b' : '#dc2626' }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Repas du jour */}
            <div className="nutrition-section-card">
              <h3 className="nutrition-section-title">Repas du jour</h3>
              {meals.length === 0 ? (
                <p style={{ color: 'var(--ink-3)', fontSize: 'var(--fs-sm)', textAlign: 'center', padding: 16 }}>
                  Aucun repas enregistré pour cette journée.
                </p>
              ) : (
                meals.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                    <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--brand)', background: 'var(--brand-soft)', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', flexShrink: 0 }}>
                      {m.meal_type === 'pdj' ? 'Petit-déj' : m.meal_type === 'dejeuner' ? 'Déjeuner' : m.meal_type === 'diner' ? 'Dîner' : 'Collation'}
                    </span>
                    <span style={{ flex: 1, fontSize: 'var(--fs-body)' }}>{m.description || 'Repas'}</span>
                    {m.kcal && <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>{Math.round(m.kcal)} kcal</span>}
                  </div>
                ))
              )}
            </div>

            {/* Poids */}
            <div className="nutrition-section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="nutrition-section-title" style={{ margin: 0 }}>Poids</h3>
                <button
                  onClick={() => setShowWeightInput(!showWeightInput)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', background: 'transparent', fontSize: 'var(--fs-sm)', color: 'var(--ink-2)', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <Plus size={14} /> Ajouter
                </button>
              </div>

              {showWeightInput && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    placeholder="Ex: 72.5"
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-body)', fontFamily: 'inherit', background: 'var(--surface)' }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddWeight}
                    style={{ padding: '8px 16px', border: 'none', borderRadius: 'var(--r-sm)', background: 'var(--brand)', color: '#fff', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Enregistrer
                  </button>
                </div>
              )}

              {latestWeight ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <Scale size={20} color="var(--ink-3)" />
                  <div>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink-1)' }}>
                      {latestWeight.weight_kg} kg
                    </span>
                    <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)', marginLeft: 8 }}>
                      {new Date(latestWeight.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {goals?.target_weight_kg && (
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <TrendingDown size={14} color="var(--brand)" />
                      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)', marginLeft: 4 }}>
                        Objectif : {goals.target_weight_kg} kg
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--ink-3)', fontSize: 'var(--fs-sm)' }}>Aucune mesure enregistrée.</p>
              )}

              {weights.length > 1 && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {weights.slice(0, 10).map((w, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>
                          {new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>{w.weight_kg} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
