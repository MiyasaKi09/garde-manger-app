'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/authFetch'
import GlassCard from '@/components/ui/GlassCard'
import { ChefHat, ChevronLeft, ChevronRight } from 'lucide-react'

const MEAL_LABELS = {
  pdj: 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

/**
 * Vue hebdomadaire du planning en cours.
 * Affiche les repas jour par jour avec highlight sur aujourd'hui.
 */
export default function WeeklyPlanView({ importId }) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

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
                [...new Set(dayMeals.map(m => m.meal_type))].map(type => {
                  const typeMeals = dayMeals.filter(m => m.meal_type === type)
                  return (
                    <div key={type} style={styles.mealBlock}>
                      <span style={styles.mealType}>{MEAL_LABELS[type] || type}</span>
                      {typeMeals.map((m, i) => (
                        <p key={i} style={styles.mealDesc}>
                          <span style={styles.personTag}>{m.person_name?.charAt(0)}</span>
                          {m.description}
                        </p>
                      ))}
                    </div>
                  )
                })
              )}
            </GlassCard>
          )
        })}
      </div>
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
    marginBottom: 4,
  },
  mealType: {
    fontSize: 10,
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mealDesc: {
    fontSize: 12,
    margin: '2px 0',
    lineHeight: 1.3,
    color: 'var(--ink, #1f281f)',
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
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
