'use client'

import { useState, useEffect, useRef } from 'react'
import { authFetch } from '@/lib/authFetch'
import CookMode from '@/components/CookMode'
import MealCookSheet from '@/components/MealCookSheet'
import { ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react'
import './WeekGrid.css'

/** Extrait le nom du plat — repris verbatim de WeeklyPlanView. */
function extractDishName(descriptions) {
  if (!descriptions.length) return ''
  let s = (descriptions[0] || '').trim()
  const colonIdx = s.indexOf(':')
  if (colonIdx > 0 && colonIdx < 60) return s.substring(0, colonIdx).trim()
  return s.replace(/\s*\((?:portion|part)[^)]*\)\s*$/i, '').trim()
}

// Nom de plat d'une ligne de repas (surnom court sinon description nettoyée).
function dishOf(m) {
  return (m?.short_label || '').trim() || extractDishName([m?.description])
}

// La 2e proposition (après la 1re virgule) en italique, comme la maquette
// (« Niçoise revisitée, sardines grillées »).
function renderDishName(name) {
  if (!name) return null
  const i = name.indexOf(', ')
  if (i > 0 && i < name.length - 2) {
    return <>{name.slice(0, i)}<em>, {name.slice(i + 2)}</em></>
  }
  return name
}

const MEAL_LABELS = { pdj: 'Petit-déj', dejeuner: 'Déjeuner', diner: 'Dîner', collation: 'Collation' }
const MEAL_BAR = { pdj: '#D9A33A', dejeuner: '#6FB05A', diner: '#6E7A3F', collation: '#BB5836' }
const MEAL_ORDER = ['pdj', 'dejeuner', 'diner', 'collation']
const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/**
 * La grille (cockpit, panneau droit). Table semaine type×jour.
 * Possède en interne le mode cuisine + l'état « cuisiné ».
 * La navigation de semaine est remontée à la page (onPrevWeek/onNextWeek).
 */
export default function WeekGrid({ meals = [], weekDates = [], weekOffset = 0, onPrevWeek, onNextWeek }) {
  const [person, setPerson] = useState('all') // 'all' | 'Julien' | 'Zoé'

  const [cookModeOpen, setCookModeOpen] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState(null)
  const [generatingFor, setGeneratingFor] = useState(null)
  const [currentMealEntries, setCurrentMealEntries] = useState([])

  const [doneSet, setDoneSet] = useState(new Set())
  const [cookSheetMeal, setCookSheetMeal] = useState(null)

  const recipeCacheRef = useRef({})

  // ⚠️ Date LOCALE (toISOString décalerait de -1 jour en UTC+).
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const todayStr = fmt(new Date())

  useEffect(() => { loadDone() }, [weekOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDone() {
    if (!weekDates.length) return
    try {
      const from = fmt(weekDates[0])
      const to = fmt(weekDates[6])
      const res = await authFetch(`/api/nutrition/log?from=${from}&to=${to}`)
      const data = await res.json()
      const s = new Set()
      for (const e of (data.entries || [])) {
        if (e.meal_date && e.meal_type) s.add(`${e.meal_date}|${e.meal_type}`)
      }
      setDoneSet(s)
    } catch {}
  }

  function filterByPerson(typeMeals) {
    if (person === 'all') return typeMeals
    return typeMeals.filter(m => m.person_name === person)
  }

  async function prefetchRecipe(typeMeals) {
    const julien = typeMeals.find(m => m.person_name === 'Julien') || typeMeals[0]
    const q = julien?.description
    if (!q || recipeCacheRef.current[q] !== undefined) return
    recipeCacheRef.current[q] = null
    try {
      const res = await authFetch(`/api/recipes/generated?q=${encodeURIComponent(q)}`)
      recipeCacheRef.current[q] = res.ok ? ((await res.json()).recipe || false) : false
    } catch { recipeCacheRef.current[q] = false }
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

  async function handleMealClick(typeMeals, dishName) {
    const julien = typeMeals.find(m => m.person_name === 'Julien') || typeMeals[0]
    const query = julien?.description
    if (!query) return
    setCurrentMealEntries(typeMeals || [])

    const cached = recipeCacheRef.current[query]
    if (cached) { setGeneratedRecipe(cached); setCookModeOpen(true); return }
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

  const mealsByDate = {}
  for (const m of meals) {
    if (!mealsByDate[m.meal_date]) mealsByDate[m.meal_date] = []
    mealsByDate[m.meal_date].push(m)
  }

  const rangeLabel = weekDates.length === 7
    ? `${weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
    : ''
  const rangeShort = weekDates.length === 7
    ? `${weekDates[0].getDate()} – ${weekDates[6].getDate()} ${weekDates[6].toLocaleDateString('fr-FR', { month: 'long' })}`
    : ''

  function renderCell(dateStr, type) {
    const dayMeals = mealsByDate[dateStr] || []
    const allTypeMeals = dayMeals.filter(m => m.meal_type === type)
    const typeMeals = filterByPerson(allTypeMeals)
    const label = MEAL_LABELS[type]

    if (!typeMeals.length) {
      return <div key={type} className="wg-cell" data-type={label}><span className="wg-empty">—</span></div>
    }

    const julienRow = typeMeals.find(m => m.person_name === 'Julien') || typeMeals[0]
    const dishName = dishOf(julienRow)
    const isGenerating = generatingFor === dishName
    const clickable = type === 'dejeuner' || type === 'diner'
    const done = doneSet.has(`${typeMeals[0]?.meal_date}|${type}`)
    const dishStyle = done ? { textDecoration: 'line-through', opacity: 0.5 } : undefined

    // Plat spécial = déjeuner/dîner où les convives ont des plats DIFFÉRENTS
    // (le « carné pour Julien / végé pour Zoé » hebdomadaire). On compare les
    // surnoms (donc une simple différence de portion ne compte pas).
    const labels = [...new Set(allTypeMeals.map(dishOf))]
    const isSpecial = (type === 'dejeuner' || type === 'diner') && labels.length > 1
    const altMeal = isSpecial ? allTypeMeals.find(m => dishOf(m) !== dishName) : null

    return (
      <div key={type} className={`wg-cell${isSpecial ? ' wg-special' : ''}`} data-type={label} style={{ opacity: generatingFor && !isGenerating ? 0.4 : 1 }}>
        {clickable ? (
          <button
            onClick={() => handleMealClick(typeMeals, dishName)}
            onMouseEnter={() => prefetchRecipe(typeMeals)}
            onFocus={() => prefetchRecipe(typeMeals)}
            disabled={!!generatingFor}
            className="wg-dish-btn"
            title={dishName}
          >
            {isGenerating && <Loader2 size={11} className="wg-spin" />}
            <span className="wg-dish" style={dishStyle}>{renderDishName(dishName)}</span>
          </button>
        ) : (
          <span className="wg-dish wg-dish-static" style={dishStyle} title={dishName}>{renderDishName(dishName)}</span>
        )}
        {isSpecial && person === 'all' && altMeal && (
          <span className="wg-alt"><span className="wg-alt-k">{altMeal.person_name}</span>{renderDishName(dishOf(altMeal))}</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); toggleDone(typeMeals, type) }}
          title={done ? 'Cuisiné — annuler' : 'Marquer cuisiné'}
          className={`wg-check${done ? ' on' : ''}`}
        >
          {done && <Check size={10} color="#fff" />}
        </button>
      </div>
    )
  }

  return (
    <section className="wg-right">
      {/* En-tête : label + légende des types de repas */}
      <div className="wg-head">
        <span className="wg-lbl">La grille{rangeLabel ? ` · ${rangeLabel}` : ''}</span>
        <div className="wg-legend">
          <span><i style={{ background: MEAL_BAR.pdj }} />Petit-déj</span>
          <span><i style={{ background: MEAL_BAR.dejeuner }} />Déjeuner</span>
          <span><i style={{ background: MEAL_BAR.diner }} />Dîner</span>
          <span><i style={{ background: MEAL_BAR.collation }} />Collation</span>
        </div>
      </div>

      {/* Filtres convive + navigation de semaine */}
      <div className="wg-filt">
        <span className="wg-filt-lab">Convive</span>
        <button className={`wg-chip${person === 'all' ? ' on' : ''}`} onClick={() => setPerson('all')}>Tous</button>
        <button className={`wg-chip${person === 'Julien' ? ' on' : ''}`} onClick={() => setPerson('Julien')}>Julien</button>
        <button className={`wg-chip${person === 'Zoé' ? ' on' : ''}`} onClick={() => setPerson('Zoé')}>Zoé</button>
        <span className="wg-wknav">
          <button className="wg-wknav-arrow" onClick={onPrevWeek} aria-label="Semaine précédente"><ChevronLeft size={15} /></button>
          {rangeShort}
          <button className="wg-wknav-arrow" onClick={onNextWeek} aria-label="Semaine suivante"><ChevronRight size={15} /></button>
        </span>
      </div>

      {/* La grille : colonne Jour + 4 colonnes type de repas */}
      <div className="wg-grid">
        <div className="wg-ghead">
          <div className="wg-hcell wg-corner">Jour</div>
          {MEAL_ORDER.map(type => (
            <div key={type} className="wg-hcell">
              <span className="wg-hmk" style={{ background: MEAL_BAR[type] }} />
              <span className="wg-hl">{MEAL_LABELS[type]}</span>
            </div>
          ))}
        </div>

        {weekDates.map(date => {
          const dateStr = fmt(date)
          const isToday = dateStr === todayStr
          const dayName = DAY_NAMES_FULL[date.getDay()]
          const dayNum = date.getDate()
          const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short' })

          return (
            <div key={dateStr} className={`wg-row${isToday ? ' wg-today' : ''}`}>
              <div className="wg-daycell">
                <span className="wg-dow">{dayName}</span>
                <span className="wg-dnum">{isToday ? <b>{dayNum}</b> : dayNum} {monthLabel}</span>
                {isToday && <span className="wg-today-tag">Aujourd'hui</span>}
              </div>
              {MEAL_ORDER.map(type => renderCell(dateStr, type))}
            </div>
          )
        })}
      </div>

      <CookMode
        open={cookModeOpen}
        onClose={() => { setCookModeOpen(false); setGeneratedRecipe(null) }}
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
    </section>
  )
}
