'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { getPersonGoals } from '@/lib/goalsStore'
import GlassCard from '@/components/ui/GlassCard'
import NutritionBar from '@/components/ui/NutritionBar'
import PersonSelector from '@/components/ui/PersonSelector'
import { ChevronLeft, ChevronRight, Scale, Plus, TrendingDown } from 'lucide-react'

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
      const [mealsRes, weightRes] = await Promise.all([
        authFetch(`/api/nutrition/log?from=${date}&to=${date}&person=${person}`),
        authFetch(`/api/nutrition/weight?person=${person}&limit=30`),
      ])

      const mealsData = await mealsRes.json()
      setMeals(mealsData.entries || [])

      // Goals from localStorage — instant, no API call
      setGoals(getPersonGoals(person))

      const weightData = await weightRes.json()
      setWeights(weightData.entries || [])
    } catch (err) {
      console.error('Error loading nutrition data:', err)
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
    } catch (err) {
      console.error('Error saving weight:', err)
    }
  }

  // Aggregate macros from meals
  const totals = meals.reduce((acc, m) => ({
    kcal: acc.kcal + (m.kcal || 0),
    protein_g: acc.protein_g + (m.protein_g || 0),
    carbs_g: acc.carbs_g + (m.carbs_g || 0),
    fat_g: acc.fat_g + (m.fat_g || 0),
    fiber_g: acc.fiber_g + (m.fiber_g || 0),
  }), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 })

  // Aggregate micros from meals
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

  const todayWeight = weights.find(w => w.date === date)
  const latestWeight = weights[0]

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <PersonSelector selected={person} onChange={setPerson} />
        <div style={styles.dateNav}>
          <button onClick={() => changeDate(-1)} style={styles.dateBtn}><ChevronLeft size={18} /></button>
          <span style={styles.dateLabel}>
            {isToday ? 'Aujourd\'hui' : displayDate}
          </span>
          <button onClick={() => changeDate(1)} style={styles.dateBtn}><ChevronRight size={18} /></button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Chargement...</div>
      ) : (
        <>
          {/* Macros */}
          <GlassCard padding={20} radius={16} style={{ marginBottom: 16 }}>
            <h3 style={styles.sectionTitle}>Macronutriments</h3>
            <NutritionBar label="Calories" value={totals.kcal} target={goals?.target_calories} unit=" kcal" color="#16a34a" />
            <NutritionBar label="Protéines" value={totals.protein_g} target={goals?.target_protein_g} unit="g" color="#3b82f6" />
            <NutritionBar label="Glucides" value={totals.carbs_g} target={goals?.target_carbs_g} unit="g" color="#f59e0b" />
            <NutritionBar label="Lipides" value={totals.fat_g} target={goals?.target_fat_g} unit="g" color="#ef4444" />
            <NutritionBar label="Fibres" value={totals.fiber_g} target={goals?.target_fiber_g || 30} unit="g" color="#8b5cf6" />
          </GlassCard>

          {/* Micronutrients */}
          {Object.keys(microTotals).length > 0 && (
            <GlassCard padding={20} radius={16} style={{ marginBottom: 16 }}>
              <h3 style={styles.sectionTitle}>Micronutriments</h3>
              <div style={styles.microGrid}>
                {Object.entries(AJR).map(([key, ajr]) => {
                  const val = microTotals[key] || 0
                  if (val === 0) return null
                  const pct = Math.round((val / ajr) * 100)
                  const label = key.replace(/_/g, ' ').replace(/vitamine /g, 'Vit. ').replace(/ (mg|ug)$/g, '')
                  const unit = key.includes('_ug') ? 'ug' : 'mg'
                  return (
                    <div key={key} style={styles.microItem}>
                      <span style={styles.microLabel}>{label}</span>
                      <span style={{
                        ...styles.microPct,
                        color: pct >= 80 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#dc2626',
                      }}>{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )}

          {/* Meal Log */}
          <GlassCard padding={20} radius={16} style={{ marginBottom: 16 }}>
            <h3 style={styles.sectionTitle}>Repas du jour</h3>
            {meals.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 16 }}>
                Aucun repas enregistré pour cette journée.
              </p>
            ) : (
              meals.map((m, i) => (
                <div key={i} style={styles.mealRow}>
                  <span style={styles.mealTypeTag}>
                    {m.meal_type === 'pdj' ? 'Petit-déj' : m.meal_type === 'dejeuner' ? 'Déjeuner' : m.meal_type === 'diner' ? 'Dîner' : 'Collation'}
                  </span>
                  <span style={{ flex: 1, fontSize: 14 }}>{m.description || 'Repas'}</span>
                  {m.kcal && <span style={{ fontSize: 12, color: '#9ca3af' }}>{Math.round(m.kcal)} kcal</span>}
                </div>
              ))
            )}
          </GlassCard>

          {/* Weight */}
          <GlassCard padding={20} radius={16} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={styles.sectionTitle}>Poids</h3>
              <button onClick={() => setShowWeightInput(!showWeightInput)} style={styles.addWeightBtn}>
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
                  style={styles.weightInput}
                  autoFocus
                />
                <button onClick={handleAddWeight} style={styles.saveWeightBtn}>Enregistrer</button>
              </div>
            )}

            {latestWeight ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <Scale size={20} color="#6b7280" />
                <div>
                  <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink, #1f281f)' }}>
                    {latestWeight.weight_kg} kg
                  </span>
                  <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                    {new Date(latestWeight.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                {goals?.target_weight_kg && (
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <TrendingDown size={14} color="#16a34a" />
                    <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 4 }}>
                      Objectif: {goals.target_weight_kg} kg
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>Aucune mesure enregistrée.</p>
            )}

            {/* Simple weight history */}
            {weights.length > 1 && (
              <div style={{ marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12 }}>
                <div style={styles.weightHistory}>
                  {weights.slice(0, 10).map((w, i) => (
                    <div key={i} style={styles.weightEntry}>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{w.weight_kg} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  )
}

const styles = {
  page: {
    padding: '20px',
    maxWidth: 600,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  dateNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  dateBtn: {
    border: 'none',
    background: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
    padding: 6,
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--ink, #1f281f)',
    minWidth: 160,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 12px',
  },
  microGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 6,
  },
  microItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 8px',
    background: 'rgba(0,0,0,0.02)',
    borderRadius: 6,
  },
  microLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  microPct: {
    fontSize: 12,
    fontWeight: 700,
  },
  mealRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 0',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
  },
  mealTypeTag: {
    fontSize: 10,
    fontWeight: 600,
    color: '#16a34a',
    background: 'rgba(22,163,74,0.08)',
    padding: '2px 8px',
    borderRadius: 6,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  addWeightBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 8,
    background: 'transparent',
    fontSize: 12,
    color: '#6b7280',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  weightInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.6)',
  },
  saveWeightBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 8,
    background: '#16a34a',
    color: 'white',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  weightHistory: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  weightEntry: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}
