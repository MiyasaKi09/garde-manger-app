'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/authFetch'
import GlassCard from '@/components/ui/GlassCard'
import CookMode from '@/components/CookMode'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

/**
 * Extrait le nom du plat à partir des descriptions.
 * Si le préfixe commun est trop court (< 10 chars), utilise la première description.
 */
function extractDishName(descriptions) {
  if (!descriptions.length) return ''
  const first = descriptions[0] || ''
  if (descriptions.length === 1) {
    const colonIdx = first.indexOf(':')
    return colonIdx > 0 && colonIdx < 60 ? first.substring(0, colonIdx).trim() : first.trim()
  }
  // Try colon-based extraction on first description
  const colonIdx = first.indexOf(':')
  if (colonIdx > 0 && colonIdx < 60) return first.substring(0, colonIdx).trim()
  // Find common prefix
  let prefix = first
  for (let i = 1; i < descriptions.length; i++) {
    const other = descriptions[i] || ''
    let j = 0
    while (j < prefix.length && j < other.length && prefix[j] === other[j]) j++
    prefix = prefix.substring(0, j)
  }
  const lastSpace = prefix.lastIndexOf(' ')
  if (lastSpace > 5) prefix = prefix.substring(0, lastSpace)
  prefix = prefix.trim()
  // If common prefix is too short, ends with '+', or seems truncated (ends with number/quantity),
  // just show the first person's full description
  if (prefix.length < 15 || prefix.endsWith('+') || /\d$/.test(prefix)) return first.trim()
  return prefix
}

const MEAL_LABELS = {
  pdj: 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}

const MEAL_COLORS = {
  pdj: { bg: '#fef3c7', text: '#92400e', accent: '#f59e0b' },
  dejeuner: { bg: '#dbeafe', text: '#1e40af', accent: '#3b82f6' },
  diner: { bg: '#ede9fe', text: '#5b21b6', accent: '#8b5cf6' },
  collation: { bg: '#fce7f3', text: '#9d174d', accent: '#ec4899' },
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

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
  const [generatingFor, setGeneratingFor] = useState(null)
  const [currentMealEntries, setCurrentMealEntries] = useState([])

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

  async function handleMealClick(meal, mealEntries) {
    const desc = meal.description
    if (!desc) return

    setGeneratingFor(desc)
    setCurrentMealEntries(mealEntries || [])

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
        <div style={styles.weekLabelWrap}>
          <span style={styles.weekLabel}>
            {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </span>
          <span style={styles.weekSep}>—</span>
          <span style={styles.weekLabel}>
            {weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </span>
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)} style={styles.navArrow}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Days */}
      <div className="weekly-days-grid">
        {weekDates.map(date => {
          const dateStr = date.toISOString().split('T')[0]
          const isToday = dateStr === todayStr
          const dayMeals = mealsByDate[dateStr] || []
          const dayName = DAY_NAMES[date.getDay()]
          const dayNum = date.getDate()

          return (
            <div
              key={dateStr}
              className={`weekly-day-card${isToday ? ' weekly-day-today' : ''}`}
            >
              {/* Day header */}
              <div className={`weekly-day-header${isToday ? ' weekly-day-header-today' : ''}`}>
                <span className="weekly-day-name">{dayName}</span>
                <span className={`weekly-day-num${isToday ? ' weekly-day-num-today' : ''}`}>{dayNum}</span>
              </div>

              {/* Meals */}
              <div className="weekly-meals-wrap">
                {dayMeals.length === 0 ? (
                  <p style={styles.noMeal}>—</p>
                ) : (
                  [...new Set(dayMeals.map(m => m.meal_type))].map(type => {
                    const typeMeals = dayMeals.filter(m => m.meal_type === type)
                    const descriptions = typeMeals.map(m => m.description)
                    const dishName = extractDishName(descriptions)
                    const isGenerating = generatingFor === dishName
                    const colors = MEAL_COLORS[type] || MEAL_COLORS.dejeuner

                    return (
                      <div key={type} className="weekly-meal-block">
                        <span
                          className="weekly-meal-type"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {MEAL_LABELS[type] || type}
                        </span>
                        <button
                          onClick={() => handleMealClick({ ...typeMeals[0], description: dishName }, typeMeals)}
                          disabled={!!generatingFor}
                          className="weekly-meal-btn"
                          style={{ opacity: generatingFor && !isGenerating ? 0.4 : 1 }}
                        >
                          {isGenerating ? (
                            <Loader2 size={11} style={{ animation: 'spin 1s linear infinite', flexShrink: 0, color: colors.accent }} />
                          ) : null}
                          <span className="weekly-meal-desc">{dishName}</span>
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Loading spinner animation */}
      {generatingFor && (
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      )}

      {/* Responsive styles */}
      <style jsx>{`
        .weekly-days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }
        .weekly-day-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 14px;
          min-height: 120px;
          overflow: hidden;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .weekly-day-today {
          border: 2px solid rgba(74, 124, 74, 0.35);
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 4px 16px rgba(74, 124, 74, 0.1);
        }
        .weekly-day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px 6px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }
        .weekly-day-header-today {
          background: linear-gradient(135deg, rgba(74, 124, 74, 0.06), rgba(139, 181, 139, 0.08));
          border-bottom: 1px solid rgba(74, 124, 74, 0.1);
        }
        .weekly-day-name {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #9ca3af;
        }
        .weekly-day-num {
          font-family: 'Crimson Text', Georgia, serif;
          font-size: 18px;
          font-weight: 700;
          color: #6b7280;
        }
        .weekly-day-num-today {
          color: #4a7c4a;
          background: rgba(74, 124, 74, 0.1);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .weekly-meals-wrap {
          padding: 6px 8px 8px;
        }
        .weekly-meal-block {
          margin-bottom: 6px;
        }
        .weekly-meal-type {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 5px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          font-family: 'Inter', sans-serif;
        }
        .weekly-meal-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          width: 100%;
          padding: 3px 4px;
          margin: 2px 0 0;
          border: none;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          text-align: left;
          transition: all 0.15s;
          font-size: 11.5px;
          line-height: 1.3;
          color: var(--ink, #1f281f);
        }
        .weekly-meal-desc {
          flex: 1;
          min-width: 0;
          word-break: break-word;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .weekly-days-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
          .weekly-day-card {
            min-height: 90px;
          }
          .weekly-meal-type {
            font-size: 8px;
            padding: 1px 5px;
          }
          .weekly-meal-btn {
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .weekly-days-grid {
            grid-template-columns: 1fr;
            gap: 4px;
          }
          .weekly-day-card {
            min-height: auto;
            border-radius: 12px;
          }
          .weekly-meals-wrap {
            padding: 4px 8px 6px;
          }
          .weekly-day-header {
            padding: 6px 10px 4px;
          }
          .weekly-meal-btn {
            font-size: 12px;
            padding: 4px 6px;
          }
          .weekly-meal-type {
            font-size: 9px;
            padding: 2px 8px;
          }
        }
      `}</style>

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
        mealEntries={currentMealEntries}
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
    marginBottom: 16,
    padding: '8px 0',
  },
  navArrow: {
    border: 'none',
    background: 'rgba(74, 124, 74, 0.08)',
    borderRadius: 10,
    padding: 8,
    cursor: 'pointer',
    color: '#4a7c4a',
    display: 'flex',
    transition: 'all 0.2s',
  },
  weekLabelWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  weekLabel: {
    fontFamily: "'Crimson Text', Georgia, serif",
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--forest-800, #2d5a2d)',
  },
  weekSep: {
    color: '#9ca3af',
    fontSize: 14,
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 8,
    overflowX: 'auto',
  },
  dayCard: {
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: 14,
    minHeight: 120,
    overflow: 'hidden',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  todayCard: {
    border: '2px solid rgba(74, 124, 74, 0.35)',
    background: 'rgba(255, 255, 255, 0.8)',
    boxShadow: '0 4px 16px rgba(74, 124, 74, 0.1)',
  },
  dayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px 6px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  todayHeader: {
    background: 'linear-gradient(135deg, rgba(74, 124, 74, 0.06), rgba(139, 181, 139, 0.08))',
    borderBottom: '1px solid rgba(74, 124, 74, 0.1)',
  },
  dayName: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#9ca3af',
  },
  dayNum: {
    fontFamily: "'Crimson Text', Georgia, serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#6b7280',
  },
  todayNum: {
    color: '#4a7c4a',
    background: 'rgba(74, 124, 74, 0.1)',
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealsWrap: {
    padding: '6px 8px 8px',
  },
  noMeal: {
    fontSize: 12,
    color: '#d1d5db',
    textAlign: 'center',
    margin: '12px 0',
  },
  mealBlock: {
    marginBottom: 6,
  },
  mealType: {
    display: 'inline-block',
    fontSize: 9,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontFamily: "'Inter', sans-serif",
  },
  mealBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    padding: '3px 4px',
    margin: '2px 0 0',
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    textAlign: 'left',
    transition: 'all 0.15s',
    fontSize: 11.5,
    lineHeight: 1.3,
    color: 'var(--ink, #1f281f)',
  },
  mealDescText: {
    flex: 1,
    minWidth: 0,
    wordBreak: 'break-word',
    fontWeight: 500,
  },
}
