'use client'

import { useState, useEffect, useRef } from 'react'
import { authFetch } from '@/lib/authFetch'
import CookMode from '@/components/CookMode'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

/**
 * Extrait le nom du plat à partir des descriptions.
 * Si le préfixe commun est trop court (< 10 chars), utilise la première description.
 */
function extractDishName(descriptions) {
  if (!descriptions.length) return ''
  // On affiche la description complète (Julien si dispo). Le calcul de
  // préfixe commun coupait le nom dès que la version de Zoé divergeait
  // (« Risotto primavera — », « Collation — »). On ne fait plus ça.
  let s = (descriptions[0] || '').trim()
  // Ancien format .xlsx : "Nom du plat: 380g de ..." → garder avant ':'
  const colonIdx = s.indexOf(':')
  if (colonIdx > 0 && colonIdx < 60) return s.substring(0, colonIdx).trim()
  // Retirer un éventuel suffixe "(portion Zoé)" / "(portion …)"
  return s.replace(/\s*\((?:portion|part)[^)]*\)\s*$/i, '').trim()
}

const MEAL_LABELS = {
  pdj: 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}

// Palette repas — refonte « Mycélium » (éditorial, désaturé)
const MEAL_COLORS = {
  pdj: { bg: '#F4EBD6', text: '#9A6B1E', accent: '#C98A2E' },
  dejeuner: { bg: '#E6EFE5', text: '#2F5D3A', accent: '#3F7D52' },
  diner: { bg: '#ECE6F4', text: '#5B4789', accent: '#7A5AA6' },
  collation: { bg: '#F6E5EC', text: '#9C4368', accent: '#B5587E' },
}

const MEAL_ORDER = ['pdj', 'dejeuner', 'diner', 'collation']

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/**
 * Vue hebdomadaire du planning.
 * Clic sur un repas → Claude génère la recette → mode cuisine immersif.
 */
export default function WeeklyPlanView({ imports = [] }) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  // Cook mode state
  const [cookModeOpen, setCookModeOpen] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState(null)
  const [generatingFor, setGeneratingFor] = useState(null)
  const [currentMealEntries, setCurrentMealEntries] = useState([])

  // Préchargement invisible : caches mémoire (semaines + fiches recettes).
  const mealsCacheRef = useRef({})   // importId -> meals[]
  const recipeCacheRef = useRef({})  // description -> recipe | false (absent) | null (en cours)

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
  const fmt = d => d.toISOString().split('T')[0]
  const weekStart = fmt(weekDates[0])
  const weekEnd = fmt(weekDates[6])

  // L'import qui COUVRE la semaine affichée (pas juste le dernier généré).
  // Sinon, générer une semaine future masque le planning de la semaine en cours.
  const selectedImport =
    imports.find(i => i.date_range_start === weekStart) ||
    imports.find(i => i.date_range_start <= weekEnd && i.date_range_end >= weekStart) ||
    null
  const selectedImportId = selectedImport?.id || null

  // Résout l'import couvrant une semaine donnée (offset relatif).
  const importIdForOffset = (offset) => {
    const wd = getWeekDates(offset)
    const s = fmt(wd[0]); const e = fmt(wd[6])
    const imp = imports.find(i => i.date_range_start === s) ||
      imports.find(i => i.date_range_start <= e && i.date_range_end >= s)
    return imp?.id || null
  }

  // Charge depuis le cache si dispo (instantané), sinon réseau puis cache.
  async function loadMeals(id) {
    if (mealsCacheRef.current[id]) {
      setMeals(mealsCacheRef.current[id]); setLoading(false); return
    }
    setLoading(true)
    try {
      const res = await authFetch(`/api/planning/imports/${id}`)
      const data = await res.json()
      const m = data.meals || []
      mealsCacheRef.current[id] = m
      setMeals(m)
    } catch (err) {
      console.error('Erreur chargement meals:', err)
      setMeals([])
    } finally {
      setLoading(false)
    }
  }

  // Prefetch silencieux (aucun rendu) — anticipe sans bloquer.
  async function prefetchImport(id) {
    if (!id || mealsCacheRef.current[id]) return
    try {
      const res = await authFetch(`/api/planning/imports/${id}`)
      const data = await res.json()
      mealsCacheRef.current[id] = data.meals || []
    } catch {}
  }

  async function prefetchRecipe(typeMeals) {
    const julien = typeMeals.find(m => m.person_name === 'Julien') || typeMeals[0]
    const q = julien?.description
    if (!q || recipeCacheRef.current[q] !== undefined) return
    recipeCacheRef.current[q] = null // en cours
    try {
      const res = await authFetch(`/api/recipes/generated?q=${encodeURIComponent(q)}`)
      recipeCacheRef.current[q] = res.ok ? ((await res.json()).recipe || false) : false
    } catch { recipeCacheRef.current[q] = false }
  }

  useEffect(() => {
    if (!selectedImportId) { setMeals([]); setLoading(false); return }
    loadMeals(selectedImportId)
  }, [selectedImportId])

  // Précharge les semaines adjacentes → navigation ‹ › instantanée.
  useEffect(() => {
    prefetchImport(importIdForOffset(weekOffset - 1))
    prefetchImport(importIdForOffset(weekOffset + 1))
  }, [weekOffset, imports]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lecture de la fiche déjà générée par la routine (zéro API facturée).
  async function handleMealClick(typeMeals, dishName) {
    const julien = typeMeals.find(m => m.person_name === 'Julien') || typeMeals[0]
    const query = julien?.description
    if (!query) return

    setCurrentMealEntries(typeMeals || [])

    // Préchargé au survol → ouverture instantanée.
    const cached = recipeCacheRef.current[query]
    if (cached) {
      setGeneratedRecipe(cached)
      setCookModeOpen(true)
      return
    }
    if (cached === false) {
      alert("Pas encore de fiche recette pour ce plat. Elle est créée par la routine lors de la génération du planning.")
      return
    }

    setGeneratingFor(dishName)
    try {
      const res = await authFetch(`/api/recipes/generated?q=${encodeURIComponent(query)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        recipeCacheRef.current[query] = false
        alert(res.status === 404
          ? "Pas encore de fiche recette pour ce plat. Elle est créée par la routine lors de la génération du planning."
          : (data.error || 'Erreur lors du chargement de la recette.'))
        return
      }
      recipeCacheRef.current[query] = data.recipe || false
      setGeneratedRecipe(data.recipe)
      setCookModeOpen(true)
    } catch (err) {
      console.error('Erreur recette:', err)
      alert('Erreur lors du chargement de la recette. Réessaie.')
    } finally {
      setGeneratingFor(null)
    }
  }

  if (loading) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)', padding: 'var(--s-7)',
        textAlign: 'center', color: 'var(--ink-3)',
        fontFamily: 'var(--font-text)', fontSize: 13, letterSpacing: '0.02em',
      }}>Chargement du planning…</div>
    )
  }

  if (!imports.length) return null

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

      {!selectedImport && (
        <p style={{ ...styles.noMeal, margin: '4px 0 14px', fontSize: 13 }}>
          Aucun planning pour cette semaine — navigue avec ‹ › ou clique « Demander à Myko ».
        </p>
      )}

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
                  [...new Set(dayMeals.map(m => m.meal_type))]
                    .sort((a, b) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b))
                    .map(type => {
                    const typeMeals = dayMeals.filter(m => m.meal_type === type)
                    const descriptions = typeMeals.map(m => m.description)
                    // Surnom court écrit par la routine si dispo, sinon extraction.
                    const julienRow = typeMeals.find(m => m.person_name === 'Julien') || typeMeals[0]
                    const dishName = (julienRow?.short_label || '').trim() || extractDishName(descriptions)
                    const isGenerating = generatingFor === dishName
                    const colors = MEAL_COLORS[type] || MEAL_COLORS.dejeuner
                    // Seuls déjeuner/dîner ont une fiche recette (pas pdj/collation).
                    const clickable = type === 'dejeuner' || type === 'diner'

                    return (
                      <div key={type} className="weekly-meal-block">
                        <span
                          className="weekly-meal-type"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {MEAL_LABELS[type] || type}
                        </span>
                        {clickable ? (
                          <button
                            onClick={() => handleMealClick(typeMeals, dishName)}
                            onMouseEnter={() => prefetchRecipe(typeMeals)}
                            onFocus={() => prefetchRecipe(typeMeals)}
                            disabled={!!generatingFor}
                            className="weekly-meal-btn"
                            style={{ opacity: generatingFor && !isGenerating ? 0.4 : 1 }}
                            title="Voir la recette"
                          >
                            {isGenerating ? (
                              <Loader2 size={11} style={{ animation: 'spin 1s linear infinite', flexShrink: 0, color: colors.accent }} />
                            ) : null}
                            <span className="weekly-meal-desc">{dishName}</span>
                          </button>
                        ) : (
                          <div className="weekly-meal-btn" style={{ cursor: 'default' }}>
                            <span className="weekly-meal-desc">{dishName}</span>
                          </div>
                        )}
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
/* ===== REFONTE « MYCÉLIUM » — grille semaine ===== */
.weekly-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--s-3);
}
.weekly-day-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  overflow: hidden;
  transition: transform var(--dur) var(--spring),
              box-shadow var(--dur) var(--ease),
              border-color var(--dur) var(--ease);
  animation: cardPop 0.55s var(--spring) both;
}
.weekly-day-card:nth-child(1) { animation-delay: 0.02s; }
.weekly-day-card:nth-child(2) { animation-delay: 0.06s; }
.weekly-day-card:nth-child(3) { animation-delay: 0.10s; }
.weekly-day-card:nth-child(4) { animation-delay: 0.14s; }
.weekly-day-card:nth-child(5) { animation-delay: 0.18s; }
.weekly-day-card:nth-child(6) { animation-delay: 0.22s; }
.weekly-day-card:nth-child(7) { animation-delay: 0.26s; }
.weekly-day-card:hover {
  transform: translateY(-4px) scale(1.012);
  box-shadow: var(--sh-2);
  border-color: var(--line-strong);
}
@keyframes cardPop {
  0%   { opacity: 0; transform: translateY(16px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .weekly-day-card { animation: none; }
}
.weekly-day-today {
  border-color: var(--brand);
  box-shadow: inset 0 3px 0 0 var(--accent);
}
.weekly-day-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--line);
}
.weekly-day-header-today {
  background: var(--brand-soft);
  border-bottom-color: rgba(47, 93, 58, 0.18);
}
.weekly-day-name {
  font-family: var(--font-text);
  font-size: var(--fs-xs); font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--ink-3);
}
.weekly-day-header-today .weekly-day-name { color: var(--brand); }
.weekly-day-num {
  font-family: var(--font-display);
  font-size: 17px; font-weight: 600;
  color: var(--ink-2); line-height: 1;
}
.weekly-day-num-today {
  width: 27px; height: 27px; border-radius: var(--r-pill);
  background: var(--brand); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}
.weekly-meals-wrap {
  padding: 10px 11px 12px;
  display: flex; flex-direction: column; gap: 9px;
}
.weekly-meal-block {
  display: flex; flex-direction: column; gap: 4px;
}
.weekly-meal-block + .weekly-meal-block {
  border-top: 1px solid var(--line);
  padding-top: 9px;
}
.weekly-meal-type {
  align-self: flex-start;
  font-family: var(--font-text);
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  padding: 2px 8px; border-radius: var(--r-pill);
}
.weekly-meal-btn {
  display: flex; align-items: flex-start; gap: 5px;
  width: 100%; padding: 3px 4px; margin: 0;
  border: none; background: transparent;
  cursor: pointer; text-align: left;
  border-radius: var(--r-sm);
  transition: background var(--dur-fast) var(--ease),
              transform var(--dur) var(--spring);
}
button.weekly-meal-btn:hover {
  background: var(--surface-soft);
  transform: translateX(3px);
}
button.weekly-meal-btn:active { transform: scale(0.97); }
button.weekly-meal-btn:disabled { cursor: default; }
.weekly-meal-desc {
  flex: 1; min-width: 0;
  font-family: var(--font-display);
  font-size: 13.5px; font-weight: 600;
  line-height: 1.25; color: var(--ink-1);
  display: -webkit-box;
  -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .weekly-days-grid { grid-template-columns: repeat(2, 1fr); gap: var(--s-2); }
  .weekly-meal-desc { font-size: 13px; }
}
@media (max-width: 480px) {
  .weekly-days-grid { grid-template-columns: 1fr; gap: var(--s-2); }
  .weekly-day-header { padding: 9px 14px 7px; }
  .weekly-meals-wrap { padding: 10px 14px 12px; }
  .weekly-meal-desc { font-size: 14px; }
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
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 18, marginBottom: 'var(--s-5)', padding: '4px 0',
  },
  navArrow: {
    border: '1px solid var(--line-strong)', background: 'var(--surface)',
    borderRadius: 'var(--r-pill)', width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--ink-2)', transition: 'var(--transition-base)',
  },
  weekLabelWrap: { display: 'flex', alignItems: 'center', gap: 10 },
  weekLabel: {
    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
    letterSpacing: '-0.01em', color: 'var(--ink-1)',
  },
  weekSep: { color: 'var(--ink-3)', fontSize: 14 },
  noMeal: {
    fontSize: 13, color: 'var(--ink-3)', textAlign: 'center',
    margin: '14px 0', fontFamily: 'var(--font-text)',
  },
}
