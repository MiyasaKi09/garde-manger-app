'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/authFetch'
import CookMode from '@/components/CookMode'
import { Loader2 } from 'lucide-react'

const MEAL_LABELS = {
  pdj: 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}
const MEAL_ORDER = ['pdj', 'dejeuner', 'diner', 'collation']

/**
 * Affiche uniquement les repas d'aujourd'hui et demain.
 * Clic sur un repas → génère la recette via Claude → CookMode.
 * Conçu pour la home bento.
 */
export default function TodayMeals({ importId }) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [cookModeOpen, setCookModeOpen] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState(null)
  const [generatingFor, setGeneratingFor] = useState(null)

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  useEffect(() => {
    if (!importId) { setLoading(false); return }
    loadMeals()
  }, [importId])

  async function loadMeals() {
    try {
      const res = await authFetch(`/api/planning/imports/${importId}`)
      const data = await res.json()
      if (data.meals) {
        // Only keep today + tomorrow
        const filtered = data.meals.filter(m =>
          m.meal_date === todayStr || m.meal_date === tomorrowStr
        )
        setMeals(filtered)
      }
    } catch (err) {
      console.error('Erreur chargement meals:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleMealClick(meal) {
    if (!meal.description || generatingFor) return
    setGeneratingFor(meal.description)
    try {
      const res = await authFetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: meal.description,
          persons: ['Julien', 'Zoé'],
          servings: 2,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedRecipe(data.recipe)
      setCookModeOpen(true)
    } catch (err) {
      console.error('Error generating recipe:', err)
    } finally {
      setGeneratingFor(null)
    }
  }

  if (loading) return <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>...</p>
  if (!importId || meals.length === 0) return null

  // Group: today then tomorrow, by meal type
  const groups = [
    { date: todayStr, label: "Aujourd'hui", meals: meals.filter(m => m.meal_date === todayStr) },
    { date: tomorrowStr, label: 'Demain', meals: meals.filter(m => m.meal_date === tomorrowStr) },
  ].filter(g => g.meals.length > 0)

  return (
    <>
      <div style={S.container}>
        {groups.map(group => {
          // Deduplicate by meal_type + description
          const byType = {}
          for (const m of group.meals) {
            const key = `${m.meal_type}|${m.description}`
            if (!byType[key]) byType[key] = { ...m, persons: [] }
            byType[key].persons.push(m.person_name?.charAt(0) || '?')
          }
          const uniqueMeals = Object.values(byType).sort(
            (a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type)
          )

          // Find next upcoming meal (first today meal not yet past, or first tomorrow)
          const now = new Date()
          const currentHour = now.getHours()
          const isNextMeal = (m) => {
            if (group.date === tomorrowStr) return false
            if (m.meal_type === 'pdj' && currentHour < 10) return true
            if (m.meal_type === 'dejeuner' && currentHour < 14) return true
            if (m.meal_type === 'diner' && currentHour < 21) return true
            return false
          }

          return (
            <div key={group.date}>
              {groups.length > 1 && (
                <p style={S.dayLabel}>{group.label}</p>
              )}
              {uniqueMeals.map((meal, i) => {
                const isGenerating = generatingFor === meal.description
                const next = isNextMeal(meal) && i === uniqueMeals.findIndex(m => isNextMeal(m))

                return (
                  <button
                    key={i}
                    onClick={() => handleMealClick(meal)}
                    disabled={!!generatingFor}
                    style={{
                      ...S.mealRow,
                      ...(next ? S.mealRowNext : {}),
                      opacity: generatingFor && !isGenerating ? 0.5 : 1,
                    }}
                  >
                    <span style={S.mealType}>{MEAL_LABELS[meal.meal_type] || meal.meal_type}</span>
                    <span style={S.mealDesc}>{meal.description}</span>
                    {isGenerating ? (
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0, color: '#16a34a' }} />
                    ) : (
                      <span style={S.mealPersons}>{meal.persons.join('')}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {generatingFor && (
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      )}

      <CookMode
        open={cookModeOpen}
        onClose={() => { setCookModeOpen(false); setGeneratedRecipe(null) }}
        recipe={generatedRecipe}
        steps={generatedRecipe?.steps || []}
        ingredients={generatedRecipe?.ingredients || []}
      />
    </>
  )
}

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    margin: '8px 0 4px',
  },
  mealRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '10px 12px',
    border: '1px solid transparent',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'all 0.15s',
    fontSize: 14,
    color: 'var(--ink, #1f281f)',
  },
  mealRowNext: {
    background: 'rgba(22,163,74,0.06)',
    borderColor: 'rgba(22,163,74,0.2)',
  },
  mealType: {
    fontSize: 10,
    fontWeight: 700,
    color: '#16a34a',
    background: 'rgba(22,163,74,0.08)',
    padding: '2px 8px',
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flexShrink: 0,
    minWidth: 52,
    textAlign: 'center',
  },
  mealDesc: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  mealPersons: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6b9d6b',
    background: 'rgba(22,163,74,0.08)',
    borderRadius: 4,
    padding: '1px 5px',
    flexShrink: 0,
  },
}
