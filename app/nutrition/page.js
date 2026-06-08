'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
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

const MEAL_LABELS = { pdj: 'Petit-déj', dejeuner: 'Déjeuner', diner: 'Dîner' }
const mealLabel = (t) => MEAL_LABELS[t] || 'Collation'
const MEAL_BAR = { pdj: '#D9A33A', dejeuner: '#6FB05A', diner: '#6E7A3F', collation: '#BB5836' }

// Macros affichés en anneaux (calories reste le grand nombre du rail)
const MACROS = [
  { key: 'protein_g', label: 'Protéines', tkey: 'target_protein_g', unit: 'g', color: '#3b6ea5' },
  { key: 'carbs_g', label: 'Glucides', tkey: 'target_carbs_g', unit: 'g', color: 'var(--saffron)' },
  { key: 'fat_g', label: 'Lipides', tkey: 'target_fat_g', unit: 'g', color: 'var(--terracotta)' },
  { key: 'fiber_g', label: 'Fibres', tkey: 'target_fiber_g', unit: 'g', color: 'var(--olive)' },
]

const RING_R = 46
const RING_C = 2 * Math.PI * RING_R

function Ring({ value, target, unit, label, color }) {
  const pct = target ? Math.round((value / target) * 100) : 0
  const dash = Math.min(RING_C, (Math.min(100, pct) / 100) * RING_C)
  return (
    <div className="nut-ring">
      <div className="nut-ring-c">
        <svg viewBox="0 0 110 110" width="110" height="110" aria-hidden="true">
          <circle cx="55" cy="55" r={RING_R} fill="none" stroke="var(--line)" strokeWidth="9" />
          <circle cx="55" cy="55" r={RING_R} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={`${dash} ${RING_C}`} transform="rotate(-90 55 55)" />
        </svg>
        <div className="nut-ring-mid">
          <span className="nut-ring-v">{Math.round(value || 0)}</span>
          <span className="nut-ring-u">/ {Math.round(target || 0)} {unit}</span>
        </div>
      </div>
      <span className="nut-ring-l">{label}</span>
      <span className="nut-ring-p" style={{ color }}>{target ? `${pct} %` : '—'}</span>
    </div>
  )
}

function WeightCurve({ weights, target }) {
  const pts = [...weights].filter(w => w.weight_kg != null)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-12)
  if (pts.length < 2) {
    return <p className="v21-next" style={{ marginTop: 0 }}>Pas assez de mesures pour tracer une courbe.</p>
  }
  const W = 800, H = 200, padL = 42, padR = 16, padT = 16, padB = 26
  const vals = pts.map(p => p.weight_kg).concat(target ? [target] : [])
  let minV = Math.min(...vals), maxV = Math.max(...vals)
  const span = Math.max(1, maxV - minV)
  minV = minV - span * 0.18
  maxV = maxV + span * 0.18
  const x = i => padL + (i / (pts.length - 1)) * (W - padL - padR)
  const y = v => padT + (1 - (v - minV) / (maxV - minV)) * (H - padT - padB)
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.weight_kg).toFixed(1)}`).join(' ')
  const yTicks = [maxV, (minV + maxV) / 2, minV]
  const fmtD = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const xi = [0, Math.floor((pts.length - 1) / 2), pts.length - 1]
  return (
    <svg className="nut-curve" viewBox={`0 0 ${W} ${H}`}>
      {yTicks.map((t, i) => (
        <g key={`y${i}`}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <text x={padL - 7} y={y(t) + 3} textAnchor="end" className="nut-curve-tk">{t.toFixed(1)}</text>
        </g>
      ))}
      {target ? (
        <g>
          <line x1={padL} y1={y(target)} x2={W - padR} y2={y(target)} stroke="var(--terracotta)" strokeWidth="1.2" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
          <text x={W - padR} y={y(target) - 5} textAnchor="end" className="nut-curve-obj">objectif {target}</text>
        </g>
      ) : null}
      <polyline points={line} fill="none" stroke="var(--terracotta)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => (
        <circle key={`d${i}`} cx={x(i)} cy={y(p.weight_kg)} r="3" fill="var(--paper)" stroke="var(--terracotta)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      ))}
      {xi.map((i, k) => (
        <text key={`x${k}`} x={x(i)} y={H - 8} textAnchor={k === 0 ? 'start' : k === xi.length - 1 ? 'end' : 'middle'} className="nut-curve-tk">{fmtD(pts[i].date)}</text>
      ))}
    </svg>
  )
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
  const displayDate = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateLabel = isToday ? "Aujourd'hui" : displayDate.charAt(0).toUpperCase() + displayDate.slice(1)

  const latestWeight = weights[0]
  const activeMicros = Object.entries(AJR).filter(([key]) => (microTotals[key] || 0) > 0)

  const sortedW = [...weights].filter(w => w.weight_kg != null).sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const wDelta = sortedW.length >= 2 ? (sortedW[sortedW.length - 1].weight_kg - sortedW[0].weight_kg) : null
  const calPct = goals?.target_calories ? Math.round((totals.kcal / goals.target_calories) * 100) : 0

  return (
    <div className="v21-page wide nutrition-page">

      {/* HERO ÉDITORIAL */}
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Nutrition</span>
          <h1 className="v21-title">Suivi.</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Ce qui nourrit {person}, jour après jour.</p>
        </div>
        <div className="v21-hero-side">
          <PersonSelector selected={person} onChange={setPerson} />
        </div>
      </header>

      {loading ? (
        <div className="nut-board" aria-busy="true" aria-label="Chargement">
          <div className="nut-rail"><div className="v21-skel" style={{ height: 280, margin: 24 }} /></div>
          <div className="nut-main">
            <div className="v21-skel" style={{ height: 150 }} />
            <div className="v21-skel" style={{ height: 150, marginTop: 18 }} />
          </div>
        </div>
      ) : (
        <div className="nut-board">

          {/* ── RAIL ── */}
          <aside className="nut-rail">
            <div className="nut-daynav">
              <button onClick={() => changeDate(-1)} className="nut-daybtn" aria-label="Jour précédent"><ChevronLeft size={15} /></button>
              <b>{dateLabel}</b>
              <button onClick={() => changeDate(1)} className="nut-daybtn" aria-label="Jour suivant"><ChevronRight size={15} /></button>
            </div>

            <section className="nut-rsec">
              <span className="v21-bl">Aujourd'hui</span>
              <div className="nut-big">{Math.round(totals.kcal).toLocaleString('fr-FR')}</div>
              <span className="nut-rsub">
                / {goals?.target_calories ? goals.target_calories.toLocaleString('fr-FR') : '—'} kcal{goals?.target_calories ? ` · ${calPct} %` : ''}
              </span>
              {goals?.target_calories && <div className="nut-prog"><div className="nut-prog-f" style={{ width: `${Math.min(100, calPct)}%` }} /></div>}
            </section>

            <section className="nut-rsec">
              <span className="v21-bl">Poids</span>
              {latestWeight ? (
                <>
                  <div className="nut-big sm">{latestWeight.weight_kg}<span className="nut-big-u"> kg</span></div>
                  <span className="nut-rsub">
                    {goals?.target_weight_kg ? `objectif ${goals.target_weight_kg}` : 'pas d’objectif'}
                    {wDelta != null ? ` · ${wDelta <= 0 ? '▼' : '▲'} ${Math.abs(wDelta).toFixed(1)} kg` : ''}
                  </span>
                </>
              ) : (
                <span className="nut-rsub">Aucune mesure enregistrée.</span>
              )}
              <button onClick={() => setShowWeightInput(!showWeightInput)} className="nut-raction" style={{ marginTop: 14 }}>
                <Plus size={13} /> Ajouter un poids
              </button>
              {showWeightInput && (
                <div className="nut-weight-form">
                  <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="Ex : 72.5" className="nut-input" autoFocus />
                  <button onClick={handleAddWeight} className="v21-btn sm">OK</button>
                </div>
              )}
            </section>

            <section className="nut-ractions">
              <Link href="/planning/assistant" className="nut-raction">✦ Demander à Myko</Link>
            </section>
          </aside>

          {/* ── MAIN ── */}
          <section className="nut-main">

            {/* MACROS — anneaux */}
            <div className="nut-msec">
              <div className="v21-bh"><span className="v21-bl">Macronutriments</span></div>
              <div className="nut-rings">
                {MACROS.map(m => (
                  <Ring key={m.key} value={totals[m.key]} target={goals?.[m.tkey] || (m.key === 'fiber_g' ? 30 : null)} unit={m.unit} label={m.label} color={m.color} />
                ))}
              </div>
              {!goals && (
                <p className="v21-next">Pas encore d'objectifs. <Link href="/nutrition/onboarding" className="v21-link">Les définir →</Link></p>
              )}
            </div>

            {/* MICRONUTRIMENTS */}
            {activeMicros.length > 0 && (
              <div className="nut-msec">
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
                        <span className="nut-micro-v"><b>{pct}</b> %</span>
                        <span className={`nut-micro-bar ${cls}`} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* POIDS — courbe */}
            {weights.length > 1 && (
              <div className="nut-msec">
                <div className="v21-bh">
                  <span className="v21-bl">Poids · évolution</span>
                  {wDelta != null && <span className="nut-msec-meta">{wDelta <= 0 ? '▼' : '▲'} {Math.abs(wDelta).toFixed(1)} kg{goals?.target_weight_kg ? ` · reste ${(latestWeight.weight_kg - goals.target_weight_kg).toFixed(1)} kg` : ''}</span>}
                </div>
                <WeightCurve weights={weights} target={goals?.target_weight_kg} />
              </div>
            )}

            {/* REPAS DU JOUR */}
            <div className="nut-msec">
              <div className="v21-bh"><span className="v21-bl">Repas du jour</span></div>
              {meals.length === 0 ? (
                <div className="v21-empty"><p>Aucun repas enregistré pour cette journée.</p></div>
              ) : (
                <div className="nut-meals">
                  {meals.map((m, i) => (
                    <div key={i} className="nut-meal">
                      <span className="nut-meal-bar" style={{ background: MEAL_BAR[m.meal_type] || MEAL_BAR.collation }} />
                      <span className="nut-meal-t">{mealLabel(m.meal_type)}</span>
                      <span className="nut-meal-mid">
                        <span className="nut-meal-n">{m.description || 'Repas'}</span>
                        {(m.protein_g != null || m.carbs_g != null || m.fat_g != null) && (
                          <span className="nut-meal-macros">P {Math.round(m.protein_g || 0)} · G {Math.round(m.carbs_g || 0)} · L {Math.round(m.fat_g || 0)}</span>
                        )}
                      </span>
                      {m.kcal != null && <span className="nut-meal-k">{Math.round(m.kcal)} kcal</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
