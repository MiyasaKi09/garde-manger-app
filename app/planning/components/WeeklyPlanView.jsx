'use client'

import { useState, useEffect, useRef } from 'react'
import { authFetch } from '@/lib/authFetch'
import CookMode from '@/components/CookMode'
import MealCookSheet from '@/components/MealCookSheet'
import { ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react'
import { toast } from '@/components/Toast'
import { openMealRecipe } from './openMealRecipe'
import useStockCoverage from './useStockCoverage'
import StockDot from './StockDot'

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

// V21 — barre de couleur par repas, via tokens CSS --m-*
const MEAL_BAR = { pdj: 'var(--m-pdj)', dejeuner: 'var(--m-dej)', diner: 'var(--m-din)', collation: 'var(--m-col)' }

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

  // « Cuisiné » : créneaux faits (clé `${date}|${type}`) + feuille de confirmation
  const [doneSet, setDoneSet] = useState(new Set())
  const [cookSheetMeal, setCookSheetMeal] = useState(null)

  // Préchargement invisible : caches mémoire (semaines + fiches recettes).
  const mealsCacheRef = useRef({})   // importId -> meals[]
  const recipeCacheRef = useRef({})  // description -> recipe | false (absent) | null (en cours)

  const { coverageByMeal } = useStockCoverage(selectedImportId)

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
      console.error('Erreur chargement planning:', err)
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

  // État « cuisiné » de la semaine affichée (depuis meal_log).
  useEffect(() => {
    loadDone()
  }, [selectedImportId, weekOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDone() {
    try {
      const wd = getWeekDates(weekOffset)
      const from = wd[0].toISOString().split('T')[0]
      const to = wd[6].toISOString().split('T')[0]
      const res = await authFetch(`/api/nutrition/log?from=${from}&to=${to}`)
      const data = await res.json()
      const s = new Set()
      for (const e of (data.entries || [])) {
        if (e.meal_date && e.meal_type) s.add(`${e.meal_date}|${e.meal_type}`)
      }
      setDoneSet(s)
    } catch {}
  }

  async function toggleDone(typeMeals, type) {
    const date = typeMeals?.[0]?.meal_date
    if (!date) return
    const key = `${date}|${type}`
    if (doneSet.has(key)) {
      try {
        await authFetch('/api/meals/cook', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meal_date: date, meal_type: type }),
        })
        setDoneSet(s => { const n = new Set(s); n.delete(key); return n })
      } catch {}
    } else {
      const julien = typeMeals.find(m => m.person_name === 'Julien') || typeMeals[0]
      const dishName = (julien?.short_label || '').trim() || extractDishName(typeMeals.map(m => m.description))
      setCookSheetMeal({ type, dishName, entries: typeMeals })
    }
  }

  // Lecture de la fiche déjà générée par la routine (zéro API facturée).
  async function handleMealClick(typeMeals, dishName) {
    setCurrentMealEntries(typeMeals || [])
    await openMealRecipe({
      typeMeals,
      recipeCacheRef,
      setGeneratingFor,
      setGeneratedRecipe,
      setCookModeOpen,
      authFetch,
      toastError: toast.error,
      dishName,
    })
  }

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Chargement du planning">
        <div className="v21-skel" style={{ height: 36, width: 260, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="v21-skel" style={{ height: 64, marginBottom: 1, borderRadius: 0 }} />
          ))}
        </div>
      </div>
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
      <div className="weekly-nav">
        <button onClick={() => setWeekOffset(w => w - 1)} className="weekly-nav-arrow" aria-label="Semaine précédente">
          <ChevronLeft size={16} />
        </button>
        <div className="weekly-nav-label">
          <span>{weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
          <span className="weekly-nav-sep">—</span>
          <span>{weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)} className="weekly-nav-arrow" aria-label="Semaine suivante">
          <ChevronRight size={16} />
        </button>
      </div>

      {!selectedImport && (
        <p className="weekly-empty">
          Aucun planning pour cette semaine — navigue avec ‹ › ou clique « Demander à Myko ».
        </p>
      )}

      {/* Days — sections à filets, lignes de repas V21 */}
      <div className="weekly-days">
        {weekDates.map(date => {
          const dateStr = date.toISOString().split('T')[0]
          const isToday = dateStr === todayStr
          const dayMeals = mealsByDate[dateStr] || []
          const dayName = DAY_NAMES_FULL[date.getDay()]
          const dayNum = date.getDate()
          const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short' })

          return (
            <section key={dateStr} className="weekly-day">
              {/* Day header */}
              <div className="weekly-day-h">
                <span className={`weekly-day-tag${isToday ? ' on' : ''}`}>
                  {dayName} {dayNum} {monthLabel}
                </span>
                {isToday && <span className="weekly-day-today">Aujourd'hui</span>}
              </div>

              {/* Meals */}
              {dayMeals.length === 0 ? (
                <p className="weekly-noMeal">Rien de prévu</p>
              ) : (
                <div className="v21-meals">
                  {[...new Set(dayMeals.map(m => m.meal_type))]
                    .sort((a, b) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b))
                    .map(type => {
                    const typeMeals = dayMeals.filter(m => m.meal_type === type)
                    const descriptions = typeMeals.map(m => m.description)
                    // Surnom court écrit par la routine si dispo, sinon extraction.
                    const julienRow = typeMeals.find(m => m.person_name === 'Julien') || typeMeals[0]
                    const dishName = (julienRow?.short_label || '').trim() || extractDishName(descriptions)
                    const isGenerating = generatingFor === dishName
                    // Seuls déjeuner/dîner ont une fiche recette (pas pdj/collation).
                    const clickable = type === 'dejeuner' || type === 'diner'
                    const done = doneSet.has(`${typeMeals[0]?.meal_date}|${type}`)
                    const descStyle = done ? { textDecoration: 'line-through', opacity: 0.5 } : undefined

                    // Couverture stock pour déjeuner/dîner
                    const stockCov = (clickable && julienRow?.id)
                      ? coverageByMeal[julienRow.id]
                      : null

                    return (
                      <div key={type} className="v21-meal" style={{ opacity: generatingFor && !isGenerating ? 0.4 : 1 }}>
                        <span className="v21-meal-bar" style={{ background: MEAL_BAR[type] || MEAL_BAR.diner }} />
                        <span className="v21-meal-l">{MEAL_LABELS[type] || type}</span>
                        {clickable ? (
                          <button
                            onClick={() => handleMealClick(typeMeals, dishName)}
                            onMouseEnter={() => prefetchRecipe(typeMeals)}
                            onFocus={() => prefetchRecipe(typeMeals)}
                            disabled={!!generatingFor}
                            className="weekly-meal-btn"
                            title="Voir la recette"
                          >
                            {isGenerating ? (
                              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', flexShrink: 0, color: 'var(--ink-3)' }} />
                            ) : null}
                            <span className="v21-meal-n" style={descStyle}>{dishName}</span>
                          </button>
                        ) : (
                          <span className="v21-meal-n" style={{ ...descStyle, cursor: 'default' }}>{dishName}</span>
                        )}
                        {stockCov && (
                          <StockDot
                            status={stockCov.status}
                            have={stockCov.have}
                            need={stockCov.need}
                            missing={stockCov.missing || []}
                            faded={done}
                          />
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleDone(typeMeals, type) }}
                          title={done ? 'Cuisiné — annuler' : 'Marquer cuisiné'}
                          className={`weekly-check${done ? ' on' : ''}`}
                        >
                          {done && <Check size={11} color="#fff" />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {/* Loading spinner animation */}
      {generatingFor && (
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      )}

      {/* Styles V21 — filets, surlignage, lignes de repas */}
      <style jsx>{`
/* ── Navigation de semaine ── */
.weekly-nav {
  display: flex; align-items: center; justify-content: center;
  gap: 18px; padding: 4px 0 18px;
}
.weekly-nav-arrow {
  border: 1px solid var(--line-strong); background: transparent;
  border-radius: 3px; width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ink-2);
  transition: border-color 0.15s ease, color 0.15s ease;
}
.weekly-nav-arrow:hover { border-color: var(--ink-1); color: var(--ink-1); }
.weekly-nav-label {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--font-display); font-size: 19px; font-weight: 600;
  letter-spacing: -0.01em; color: var(--ink-1);
}
.weekly-nav-sep { color: var(--ink-3); font-size: 14px; }

.weekly-empty {
  font-family: var(--font-text); font-size: 13px; color: var(--ink-3);
  text-align: center; margin: 4px 0 14px;
}

/* ── Jours : sections empilées à filets ── */
.weekly-days { display: flex; flex-direction: column; }
.weekly-day { padding: 18px 0 4px; border-top: 1px solid var(--line); }
.weekly-day:first-child { border-top: none; }
.weekly-day-h { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.weekly-day-tag {
  display: inline-block;
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--ink-2);
}
.weekly-day-tag.on {
  background: var(--terracotta); color: #fff;
  padding: 4px 9px; border-radius: 3px;
}
.weekly-day-today {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--terracotta);
}
.weekly-noMeal {
  font-family: var(--font-text); font-size: 13px; color: var(--ink-3);
  margin: 2px 0 10px;
}

/* ── Nom de plat cliquable : occupe la colonne 1fr de .v21-meal ── */
.weekly-meal-btn {
  display: flex; align-items: center; gap: 8px;
  min-width: 0; padding: 0; margin: 0;
  border: none; background: transparent; cursor: pointer; text-align: left;
}
.weekly-meal-btn:disabled { cursor: default; }
.weekly-meal-btn:hover:not(:disabled) .v21-meal-n { color: var(--terracotta); }

/* ── Case « cuisiné » (colonne auto de droite) ── */
.weekly-check {
  width: 18px; height: 18px; border-radius: 3px; flex-shrink: 0; padding: 0;
  border: 1.5px solid var(--line-strong); background: transparent;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.weekly-check.on { background: var(--brand); border-color: var(--brand); }

.weekly-meal-btn:focus-visible, .weekly-check:focus-visible,
.weekly-nav-arrow:focus-visible {
  outline: 2px solid var(--brand); outline-offset: 2px; border-radius: 3px;
}

@media (max-width: 560px) {
  .weekly-nav-label { font-size: 16px; }
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

      <MealCookSheet
        open={!!cookSheetMeal}
        meal={cookSheetMeal}
        onClose={() => setCookSheetMeal(null)}
        onDone={() => { if (cookSheetMeal) setDoneSet(s => new Set(s).add(`${cookSheetMeal.entries?.[0]?.meal_date}|${cookSheetMeal.type}`)) }}
      />
    </div>
  )
}
