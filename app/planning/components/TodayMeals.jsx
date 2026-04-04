'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/authFetch'
import CookMode from '@/components/CookMode'
import { Loader2 } from 'lucide-react'

/**
 * Extrait le nom du plat à partir des descriptions de plusieurs personnes.
 * "Pizza maison: pâte 120g + passata 70g..." → "Pizza maison"
 * "Wok poulet teriyaki: 200g poulet..." → "Wok poulet teriyaki"
 * Si pas de ":", trouve le préfixe commun entre les descriptions.
 */
function extractDishName(descriptions) {
  if (!descriptions.length) return ''
  if (descriptions.length === 1) {
    const d = descriptions[0] || ''
    const colonIdx = d.indexOf(':')
    return colonIdx > 0 && colonIdx < 60 ? d.substring(0, colonIdx).trim() : d.trim()
  }

  // Try extracting before ":" from the first one
  const first = descriptions[0] || ''
  const colonIdx = first.indexOf(':')
  if (colonIdx > 0 && colonIdx < 60) {
    return first.substring(0, colonIdx).trim()
  }

  // Find common prefix between all descriptions
  let prefix = first
  for (let i = 1; i < descriptions.length; i++) {
    const other = descriptions[i] || ''
    let j = 0
    while (j < prefix.length && j < other.length && prefix[j] === other[j]) j++
    prefix = prefix.substring(0, j)
  }

  // Trim to last space to avoid cutting a word
  const lastSpace = prefix.lastIndexOf(' ')
  if (lastSpace > 5) prefix = prefix.substring(0, lastSpace)

  return prefix.trim() || first.substring(0, 40).trim()
}

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

  // Group: today then tomorrow
  const groups = [
    { date: todayStr, label: "Aujourd'hui", meals: meals.filter(m => m.meal_date === todayStr) },
    { date: tomorrowStr, label: 'Demain', meals: meals.filter(m => m.meal_date === tomorrowStr) },
  ].filter(g => g.meals.length > 0)

  return (
    <>
      <div style={S.container}>
        {groups.map(group => {
          // Group by meal_type → ONE row per plat (not per person)
          const byType = {}
          for (const m of group.meals) {
            if (!byType[m.meal_type]) byType[m.meal_type] = []
            byType[m.meal_type].push(m)
          }

          const mergedMeals = Object.entries(byType)
            .sort(([a], [b]) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b))
            .map(([type, entries]) => {
              // Extract dish name: part before ":" or the common prefix
              const dishName = extractDishName(entries.map(e => e.description))
              const persons = entries.map(e => e.person_name?.charAt(0) || '?')
              return { type, dishName, entries, persons: [...new Set(persons)] }
            })

          // Find next upcoming meal
          const now = new Date()
          const h = now.getHours()
          const nextType = group.date === todayStr
            ? (h < 10 ? 'pdj' : h < 14 ? 'dejeuner' : h < 21 ? 'diner' : null)
            : null

          return (
            <div key={group.date}>
              {groups.length > 1 && <p style={S.dayLabel}>{group.label}</p>}
              {mergedMeals.map((meal, i) => {
                const isGenerating = generatingFor === meal.dishName
                const isNext = meal.type === nextType

                return (
                  <button
                    key={i}
                    onClick={() => handleMealClick({ ...meal.entries[0], description: meal.dishName })}
                    disabled={!!generatingFor}
                    style={{
                      ...S.mealRow,
                      ...(isNext ? S.mealRowNext : {}),
                      opacity: generatingFor && !isGenerating ? 0.5 : 1,
                    }}
                  >
                    <span style={S.mealType}>{MEAL_LABELS[meal.type] || meal.type}</span>
                    <span style={S.mealDesc}>{meal.dishName}</span>
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
