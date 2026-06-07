'use client'

import { useState, useEffect, useRef } from 'react'
import { authFetch } from '@/lib/authFetch'
import CookMode from '@/components/CookMode'
import MealCookSheet from '@/components/MealCookSheet'
import { ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react'

/**
 * Extrait le nom du plat à partir des descriptions.
 * Repris verbatim de WeeklyPlanView (même logique de nommage).
 */
function extractDishName(descriptions) {
  if (!descriptions.length) return ''
  let s = (descriptions[0] || '').trim()
  const colonIdx = s.indexOf(':')
  if (colonIdx > 0 && colonIdx < 60) return s.substring(0, colonIdx).trim()
  return s.replace(/\s*\((?:portion|part)[^)]*\)\s*$/i, '').trim()
}

const MEAL_LABELS = {
  pdj: 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}

// Barre de couleur par repas — alignée sur WeeklyPlanView + v21.css.
const MEAL_BAR = { pdj: '#D9A33A', dejeuner: '#6FB05A', diner: '#6E7A3F', collation: '#BB5836' }

const MEAL_ORDER = ['pdj', 'dejeuner', 'diner', 'collation']

const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

// Initiale convive pour le tag mono (J / Z).
function personInitial(name) {
  if (!name) return ''
  const n = name.trim().toLowerCase()
  if (n.startsWith('jul')) return 'J'
  if (n.startsWith('zo')) return 'Z'
  return name.trim().charAt(0).toUpperCase()
}

// Nom compact pour la grille : on coupe avant le premier séparateur de
// composition (« & » / « , ») pour rester lisible dans une cellule étroite.
function conciseDish(s) {
  if (!s) return ''
  let c = s.split(' & ')[0].split(/,\s/)[0].trim()
  if (c.length > 42) c = c.slice(0, 40).trim() + '…'
  return c
}

/**
 * La grille (cockpit, panneau droit). Table semaine type×jour.
 * Possède en interne le mode cuisine + l'état « cuisiné » (repris de WeeklyPlanView).
 * La navigation de semaine est remontée à la page parente (onPrevWeek/onNextWeek)
 * pour que le rail + les courses suivent la même semaine.
 */
export default function WeekGrid({ meals = [], weekDates = [], weekOffset = 0, onPrevWeek, onNextWeek }) {
  // Filtre convive : 'all' | 'Julien' | 'Zoé'
  const [person, setPerson] = useState('all')

  // Cook mode state
  const [cookModeOpen, setCookModeOpen] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState(null)
  const [generatingFor, setGeneratingFor] = useState(null)
  const [currentMealEntries, setCurrentMealEntries] = useState([])

  // « Cuisiné » : créneaux faits (clé `${date}|${type}`) + feuille de confirmation
  const [doneSet, setDoneSet] = useState(new Set())
  const [cookSheetMeal, setCookSheetMeal] = useState(null)

  const recipeCacheRef = useRef({}) // description -> recipe | false | null

  // ⚠️ Date LOCALE (pas toISOString, qui repasse en UTC et décale -1 jour en UTC+).
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const todayStr = fmt(new Date())

  // État « cuisiné » de la semaine affichée (depuis meal_log) — recharge au changement de semaine.
  useEffect(() => {
    loadDone()
  }, [weekOffset]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Sous-ensemble de repas respectant le filtre convive.
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

  // Lecture de la fiche déjà générée par la routine (zéro API facturée).
  async function handleMealClick(typeMeals, dishName) {
    const julien = typeMeals.find(m => m.person_name === 'Julien') || typeMeals[0]
    const query = julien?.description
    if (!query) return

    setCurrentMealEntries(typeMeals || [])

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

  // Index repas par date.
  const mealsByDate = {}
  for (const m of meals) {
    if (!mealsByDate[m.meal_date]) mealsByDate[m.meal_date] = []
    mealsByDate[m.meal_date].push(m)
  }

  // Plage de dates (libellé court « 8 au 14 juin »).
  const rangeLabel = weekDates.length === 7
    ? `${weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
    : ''
  const rangeShort = weekDates.length === 7
    ? `${weekDates[0].getDate()} – ${weekDates[6].getDate()} ${weekDates[6].toLocaleDateString('fr-FR', { month: 'long' })}`
    : ''

  // Rend une cellule de repas pour un jour × type.
  function renderCell(dateStr, type) {
    const dayMeals = mealsByDate[dateStr] || []
    const allTypeMeals = dayMeals.filter(m => m.meal_type === type)
    const typeMeals = filterByPerson(allTypeMeals)
    const label = MEAL_LABELS[type]

    if (!typeMeals.length) {
      return (
        <div key={type} className="wg-cell" data-type={label}>
          <span className="wg-empty">—</span>
        </div>
      )
    }

    const descriptions = typeMeals.map(m => m.description)
    const julienRow = typeMeals.find(m => m.person_name === 'Julien') || typeMeals[0]
    const shortLabel = (julienRow?.short_label || '').trim()
    const fullName = extractDishName(descriptions)
    const dishName = shortLabel || conciseDish(fullName)
    const fullTitle = shortLabel || fullName
    const isGenerating = generatingFor === dishName
    const clickable = type === 'dejeuner' || type === 'diner'
    const done = doneSet.has(`${typeMeals[0]?.meal_date}|${type}`)
    const dishStyle = done ? { textDecoration: 'line-through', opacity: 0.5 } : undefined

    // Tag convive : on n'affiche que les exceptions (un seul convive) en vue « Tous ».
    const initials = [...new Set(typeMeals.map(m => personInitial(m.person_name)).filter(Boolean))]
    const whoTag = initials.join('·')
    const showWho = person === 'all' && whoTag && whoTag !== 'J·Z'

    return (
      <div
        key={type}
        className="wg-cell"
        data-type={label}
        style={{ opacity: generatingFor && !isGenerating ? 0.4 : 1 }}
      >
        <span className="wg-mk" style={{ background: MEAL_BAR[type] || MEAL_BAR.diner }} aria-hidden="true" />
        {clickable ? (
          <button
            onClick={() => handleMealClick(typeMeals, dishName)}
            onMouseEnter={() => prefetchRecipe(typeMeals)}
            onFocus={() => prefetchRecipe(typeMeals)}
            disabled={!!generatingFor}
            className="wg-dish-btn"
            title={fullTitle}
          >
            {isGenerating && (
              <Loader2 size={11} style={{ animation: 'wgspin 1s linear infinite', flexShrink: 0, color: 'var(--ink-3)' }} />
            )}
            <span className="wg-dish" style={dishStyle}>{dishName}</span>
          </button>
        ) : (
          <span className="wg-dish wg-dish-static" style={dishStyle} title={fullTitle}>{dishName}</span>
        )}
        <span className="wg-cell-foot">
          {showWho ? <span className="wg-who">{whoTag}</span> : <span aria-hidden="true" />}
          <button
            onClick={(e) => { e.stopPropagation(); toggleDone(typeMeals, type) }}
            title={done ? 'Cuisiné — annuler' : 'Marquer cuisiné'}
            className={`wg-check${done ? ' on' : ''}`}
          >
            {done && <Check size={10} color="#fff" />}
          </button>
        </span>
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
        {/* En-tête de colonnes */}
        <div className="wg-ghead">
          <div className="wg-hcell wg-corner">Jour</div>
          {MEAL_ORDER.map(type => (
            <div key={type} className="wg-hcell">
              <span className="wg-hmk" style={{ background: MEAL_BAR[type] }} />
              <span className="wg-hl">{MEAL_LABELS[type]}</span>
            </div>
          ))}
        </div>

        {/* 7 lignes-jour */}
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

      {/* Animation spinner */}
      {generatingFor && (
        <style>{`@keyframes wgspin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      )}

      {/* Cook Mode + feuille « cuisiné » — montés ici comme dans WeeklyPlanView */}
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

      <style jsx>{`
/* ── Panneau droit : la grille ── */
.wg-right { min-width: 0; }

/* En-tête : label sombre + légende */
.wg-head {
  display: flex; justify-content: space-between; align-items: center; gap: 24px;
  padding: 18px 42px; border-bottom: 1px solid var(--ink-1);
}
.wg-lbl {
  display: inline-block;
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase;
  background: var(--ink-1); color: var(--paper); padding: 4px 9px; border-radius: 3px;
}
.wg-legend { display: flex; gap: 18px; flex-wrap: wrap; }
.wg-legend span {
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.04em; text-transform: uppercase;
  color: var(--ink-2); display: inline-flex; align-items: center; gap: 7px;
}
.wg-legend i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; flex: none; }

/* Filtres convive + nav semaine */
.wg-filt {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  border-bottom: 1px solid var(--ink-1); padding: 10px 42px;
}
.wg-filt-lab {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--ink-3); margin-right: 4px;
}
.wg-chip {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.02em;
  padding: 6px 12px; border: 1px solid var(--line-strong); border-radius: 999px;
  color: var(--ink-2); cursor: pointer; background: transparent;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.wg-chip:hover { border-color: var(--ink-1); color: var(--ink-1); }
.wg-chip.on { background: var(--terracotta); color: #fff; border-color: var(--terracotta); font-weight: 600; }
.wg-wknav {
  margin-left: auto; display: flex; align-items: center; gap: 12px;
  font-family: var(--font-mono); font-size: 11px; color: var(--ink-2);
}
.wg-wknav-arrow {
  border: none; background: transparent; cursor: pointer; color: var(--ink-2);
  display: inline-flex; align-items: center; justify-content: center; padding: 2px; line-height: 1;
  transition: color 0.15s ease;
}
.wg-wknav-arrow:hover { color: var(--terracotta); }

/* La grille : table semaine */
.wg-grid { display: grid; grid-template-columns: 132px repeat(4, 1fr); padding: 0 42px; }
.wg-ghead, .wg-row { display: contents; }

/* En-tête de colonnes */
.wg-hcell {
  padding: 13px 14px; border-bottom: 1px solid var(--ink-1);
  display: flex; align-items: center; gap: 8px;
}
.wg-hcell.wg-corner {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--ink-3);
}
.wg-hmk { width: 8px; height: 8px; border-radius: 2px; flex: none; }
.wg-hl {
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.09em; text-transform: uppercase;
  color: var(--ink-2);
}

/* Filets : colonne jour + filets verticaux entre colonnes */
.wg-daycell, .wg-cell { border-bottom: 1px solid var(--line); border-left: 1px solid var(--line); }
.wg-hcell.wg-corner, .wg-daycell { border-left: none; }

/* Cellule jour (gauche) */
.wg-daycell {
  padding: 14px 14px 14px 0; display: flex; flex-direction: column;
  justify-content: flex-start; gap: 4px;
}
.wg-dow { font-family: var(--font-display); font-weight: 600; font-size: 19px; letter-spacing: -0.01em; line-height: 1; }
.wg-dnum { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.04em; color: var(--ink-3); text-transform: uppercase; }
.wg-dnum b { color: var(--terracotta); font-weight: 600; }
.wg-today-tag {
  margin-top: 4px; align-self: flex-start;
  font-family: var(--font-mono); font-size: 8.5px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
  color: #fff; background: var(--terracotta); padding: 3px 7px; border-radius: 3px; white-space: nowrap;
}

/* Ligne d'aujourd'hui appuyée */
.wg-today .wg-daycell, .wg-today .wg-cell { background: rgba(187, 88, 54, 0.04); }

/* Cellule de repas */
.wg-cell { padding: 12px 13px; display: flex; flex-direction: column; min-width: 0; gap: 6px; }
.wg-mk { width: 7px; height: 7px; border-radius: 2px; flex: none; }
.wg-dish-btn {
  display: flex; align-items: flex-start; gap: 7px; text-align: left;
  border: none; background: transparent; padding: 0; margin: 0; cursor: pointer; min-width: 0;
  appearance: none; -webkit-appearance: none; font: inherit; color: inherit; box-shadow: none;
}
.wg-dish-btn:disabled { cursor: default; }
.wg-dish {
  font-family: var(--font-display); font-weight: 500; font-size: 14.5px; line-height: 1.22; letter-spacing: -0.005em;
  color: var(--ink-1); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.wg-dish-btn:hover:not(:disabled) .wg-dish { color: var(--terracotta); }
.wg-dish-static { cursor: default; }
.wg-cell-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; }
.wg-who { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.04em; color: var(--ink-2); }
.wg-empty { font-family: var(--font-mono); font-size: 13px; color: var(--ink-3); }

/* Case « cuisiné » par cellule */
.wg-check {
  width: 16px; height: 16px; border-radius: 3px; flex: none; padding: 0;
  border: 1.5px solid var(--line-strong); background: transparent;
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.wg-check:hover { border-color: var(--terracotta); }
.wg-check.on { background: var(--brand); border-color: var(--brand); }

.wg-dish-btn:focus-visible, .wg-check:focus-visible,
.wg-chip:focus-visible, .wg-wknav-arrow:focus-visible {
  outline: 2px solid var(--brand); outline-offset: 2px; border-radius: 3px;
}

/* Responsive : la grille se replie en cartes-jour empilées */
@media (max-width: 880px) {
  .wg-head { flex-direction: column; align-items: flex-start; gap: 14px; padding: 16px 22px; }
  .wg-filt { overflow-x: auto; padding-left: 22px; padding-right: 22px; }
  .wg-wknav { display: none; }
  .wg-grid { display: block; padding: 0; }
  .wg-ghead { display: none; }
  .wg-row { display: block; }
  .wg-daycell {
    flex-direction: row; align-items: baseline; gap: 12px;
    padding: 18px 22px 10px; border-left: none; border-bottom: 1px solid var(--ink-1);
  }
  .wg-today-tag { margin-top: 0; margin-left: auto; }
  .wg-cell { border-left: none; padding: 11px 22px; flex-direction: column; }
  .wg-cell .wg-dish { -webkit-line-clamp: unset; font-size: 15px; }
  .wg-cell::before {
    content: attr(data-type); display: block;
    font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--ink-3); margin-bottom: 5px;
  }
}
      `}</style>
    </section>
  )
}
