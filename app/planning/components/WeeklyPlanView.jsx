'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/authFetch'
import GlassCard from '@/components/ui/GlassCard'
import CookMode from '@/components/CookMode'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const MEAL_LABELS = {
  pdj: 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

/**
 * Vue hebdomadaire du planning.
 * Clic sur un repas → Claude génère la recette → mode cuisine immersif.
 */
export default function WeeklyPlanView({ importId }) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  // Cook mode state
  const [cookModeOpen, setCookModeOpen] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState(null)
  const [generatingFor, setGeneratingFor] = useState(null) // meal description being generated

  const getWeekDates = (offset) => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      days.push(d)
    }
    return days
  }

  const weekDates = getWeekDates(weekOffset)
  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!importId) { setLoading(false); return }
    loadMeals()
  }, [importId])

  async function loadMeals() {
    try {
      const res = await authFetch(`/api/planning/imports/${importId}`)
      const data = await res.json()
      if (data.meals) setMeals(data.meals)
    } catch (err) {
      console.error('Erreur chargement meals:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleMealClick(meal) {
    // Deduplicate: get unique descriptions for this meal type + date
    const desc = meal.description
    if (!desc) return

    setGeneratingFor(desc)

    try {
      const res = await authFetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: desc,
          persons: ['Julien', 'Zoé'],
          servings: 2,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur génération')

      setGeneratedRecipe(data.recipe)
      setCookModeOpen(true)
    } catch (err) {
      console.error('Error generating recipe:', err)
      alert('Erreur lors de la génération de la recette. Réessaie.')
    } finally {
      setGeneratingFor(null)
    }
  }

  if (loading) {
    return <GlassCard padding={24} style={{ textAlign: 'center', color: '#9ca3af' }}>Chargement du planning...</GlassCard>
  }

  if (!importId) return null

  const mealsByDate = {}
  for (const m of meals) {
    if (!mealsByDate[m.meal_date]) mealsByDate[m.meal_date] = []
    mealsByDate[m.meal_date].push(m)
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Week navigation */}
      <div style={styles.weekNav}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={styles.navArrow}>
          <ChevronLeft size={18} />
        </button>
        <span style={styles.weekLabel}>
          {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          {' — '}
          {weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
        <button onClick={() => setWeekOffset(w => w + 1)} style={styles.navArrow}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Days */}
      <div style={styles.daysGrid}>
        {weekDates.map(date => {
          const dateStr = date.toISOString().split('T')[0]
          const isToday = dateStr === todayStr
          const dayMeals = mealsByDate[dateStr] || []
          const dayName = DAY_NAMES[date.getDay()]
          const dayNum = date.getDate()

          return (
            <GlassCard
              key={dateStr}
              padding={10}
              radius={12}
              style={{
                ...styles.dayCard,
                ...(isToday ? styles.todayCard : {}),
              }}
            >
              <div style={{ ...styles.dayHeader, ...(isToday ? { color: '#16a34a' } : {}) }}>
                <span style={styles.dayName}>{dayName}</span>
                <span style={styles.dayNum}>{dayNum}</span>
              </div>
              {dayMeals.length === 0 ? (
                <p style={styles.noMeal}>—</p>
              ) : (
                // Group meals by type, show unique descriptions
                [...new Set(dayMeals.map(m => m.meal_type))].map(type => {
                  const typeMeals = dayMeals.filter(m => m.meal_type === type)
                  // Deduplicate descriptions (same meal for Julien & Zoé)
                  const uniqueDescs = [...new Set(typeMeals.map(m => m.description))]
                  const persons = typeMeals.map(m => m.person_name?.charAt(0)).join('')

                  return (
                    <div key={type} style={styles.mealBlock}>
                      <span style={styles.mealType}>{MEAL_LABELS[type] || type}</span>
                      {uniqueDescs.map((desc, i) => {
                        const isGenerating = generatingFor === desc
                        return (
                          <button
                            key={i}
                            onClick={() => handleMealClick(typeMeals.find(m => m.description === desc))}
                            disabled={!!generatingFor}
                            style={{
                              ...styles.mealBtn,
                              opacity: generatingFor && !isGenerating ? 0.5 : 1,
                            }}
                          >
                            {isGenerating ? (
                              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                            ) : (
                              <span style={styles.personTag}>{persons}</span>
                            )}
                            <span style={styles.mealDescText}>{desc}</span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </GlassCard>
          )
        })}
      </div>

      {/* Loading spinner animation */}
      {generatingFor && (
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      )}

      {/* Cook Mode */}
      <CookMode
        open={cookModeOpen}
        onClose={() => {
          setCookModeOpen(false)
          setGeneratedRecipe(null)
        }}
        recipe={generatedRecipe}
        steps={generatedRecipe?.steps || []}
        ingredients={generatedRecipe?.ingredients || []}
      />
    </div>
  )
}

const styles = {
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  navArrow: {
    border: 'none',
    background: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
    padding: 6,
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--ink, #1f281f)',
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 8,
  },
  dayCard: {
    minHeight: 100,
  },
  todayCard: {
    border: '2px solid rgba(22,163,74,0.4)',
    background: 'rgba(22,163,74,0.06)',
  },
  dayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
    color: '#6b7280',
  },
  dayName: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayNum: {
    fontSize: 16,
    fontWeight: 700,
  },
  noMeal: {
    fontSize: 12,
    color: '#d1d5db',
    textAlign: 'center',
    margin: '8px 0',
  },
  mealBlock: {
    marginBottom: 6,
  },
  mealType: {
    fontSize: 10,
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mealBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    padding: '4px 6px',
    margin: '2px 0',
    border: '1px solid transparent',
    borderRadius: 6,
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'all 0.15s',
    fontSize: 12,
    lineHeight: 1.3,
    color: 'var(--ink, #1f281f)',
  },
  mealDescText: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  personTag: {
    fontSize: 9,
    fontWeight: 700,
    background: 'rgba(22,163,74,0.12)',
    color: '#16a34a',
    borderRadius: 4,
    padding: '1px 4px',
    flexShrink: 0,
  },
}
