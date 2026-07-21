'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { authFetch } from '@/lib/authFetch'
import CookMode from '@/components/CookMode'
import CookSession from './CookSession'
import { Loader2, ChefHat, RefreshCw, X, Check, Flame, Soup, Sparkles } from 'lucide-react'
import { toast } from '@/components/Toast'
import useStockCoverage from './useStockCoverage'
import StockDot from './StockDot'
import './TodayMeals.css'

const round1 = (v) => Math.round(v * 10) / 10

/** Affiche 1,5 plutôt que 1.5 (et sans décimale inutile). */
const fmtPortions = (v) => String(round1(v)).replace('.', ',')

/** Formate une DLC (date ISO) — comparaisons et affichage en UTC. */
const formatDlc = (d) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** Créneau « en cours » selon l'heure locale (pour manger un reste maintenant). */
function currentMealType() {
  const h = new Date().getHours()
  if (h < 10) return 'pdj'
  if (h < 15) return 'dejeuner'
  if (h < 18) return 'collation'
  return 'diner'
}

/**
 * Extrait le nom du plat à partir des descriptions de plusieurs personnes.
 * Si le préfixe commun est trop court (< 10 chars), utilise la première description.
 */
function extractDishName(descriptions) {
  if (!descriptions.length) return ''
  if (descriptions.length === 1) {
    const d = descriptions[0] || ''
    const colonIdx = d.indexOf(':')
    return colonIdx > 0 && colonIdx < 60 ? d.substring(0, colonIdx).trim() : d.trim()
  }
  const first = descriptions[0] || ''
  const colonIdx = first.indexOf(':')
  if (colonIdx > 0 && colonIdx < 60) {
    return first.substring(0, colonIdx).trim()
  }
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
  if (prefix.length < 10) return first.substring(0, 60).trim()
  return prefix
}

const MEAL_LABELS = {
  pdj: 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}

const MEAL_COLORS = {
  pdj: { bg: '#fef3c7', text: '#92400e', border: 'rgba(245, 158, 11, 0.2)' },
  dejeuner: { bg: '#dbeafe', text: '#1e40af', border: 'rgba(59, 130, 246, 0.2)' },
  diner: { bg: '#ede9fe', text: '#5b21b6', border: 'rgba(139, 92, 246, 0.2)' },
  collation: { bg: '#fce7f3', text: '#9d174d', border: 'rgba(236, 72, 153, 0.2)' },
}

const MEAL_ORDER = ['pdj', 'dejeuner', 'diner', 'collation']

// Couleurs des barres via variables CSS (tokens --m-*)
const MEAL_BAR_VAR = {
  pdj: 'var(--m-pdj)',
  dejeuner: 'var(--m-dej)',
  diner: 'var(--m-din)',
  collation: 'var(--m-col)',
}

/**
 * Affiche les repas d'aujourd'hui et demain.
 * Clic sur un repas → modal choix : Cuisiner ou Changer.
 */
export default function TodayMeals({ importId }) {
  const [meals, setMeals] = useState([])
  const [householdMembers, setHouseholdMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // « Cuisiné » : créneaux faits (clé `${date}|${type}`) + feuille de confirmation
  const [doneSet, setDoneSet] = useState(new Set())
  const [cookSheetMeal, setCookSheetMeal] = useState(null)

  // Restes actifs (cooked_dishes avec portions restantes, non périmés)
  const [leftovers, setLeftovers] = useState([])

  // Re-planning dynamique : proposé après création de restes, ou improvisation
  const [replanOffered, setReplanOffered] = useState(false)
  const [replanSending, setReplanSending] = useState(false)
  const [improviseOpen, setImproviseOpen] = useState(false)
  const [improviseText, setImproviseText] = useState('')
  const [improviseSlot, setImproviseSlot] = useState('diner')

  // Cook mode
  const [cookModeOpen, setCookModeOpen] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState(null)
  const [cachedRecipeId, setCachedRecipeId] = useState(null)
  const [generatingRecipe, setGeneratingRecipe] = useState(false)

  // Choice modal
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [showChoice, setShowChoice] = useState(false)

  // Modify-meal mode
  const [swapMode, setSwapMode] = useState(false)
  const [swapDirection, setSwapDirection] = useState('')
  const [swapping, setSwapping] = useState(false)
  const [swapError, setSwapError] = useState('')
  const [swapSuccess, setSwapSuccess] = useState(false)

  const recipeCacheRef = useRef({})

  const { coverageByMeal } = useStockCoverage(importId)

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  useEffect(() => {
    if (!importId) { setLoading(false); return }
    loadMeals()
    loadDone()
  }, [importId])

  useEffect(() => { loadLeftovers() }, [])

  async function loadLeftovers() {
    try {
      const res = await authFetch('/api/cooked-dishes?active=true')
      const data = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(data.dishes)) setLeftovers(data.dishes)
    } catch {}
  }

  /** « Manger maintenant » sur un reste → même sheet, préremplie pour le créneau en cours. */
  function eatLeftover(dish) {
    const type = currentMealType()
    const planEntries = meals.filter(m => m.meal_date === todayStr && m.meal_type === type)
    const persons = planEntries.length
      ? [...new Set(planEntries.map(e => e.person_name).filter(Boolean))]
      : householdMembers.map(member => member.name).filter(Boolean)
    setCookSheetMeal({
      type,
      dishName: dish.name,
      entries: persons.map(name => ({ person_name: name, meal_date: todayStr })),
      eatenDish: dish,
    })
  }

  function handleCooked(result) {
    if (cookSheetMeal) setDoneSet(s => new Set(s).add(mealKey(cookSheetMeal)))
    if (result?.leftover) {
      toast.success(`Repas validé — ${fmtPortions(result.leftover.portions_remaining)} portion(s) aux restes (DLC ${formatDlc(result.leftover.expiration_date)})`)
      setReplanOffered(true)
    } else if (cookSheetMeal?.eatenDish) {
      toast.success('Reste mangé — portions mises à jour !')
    } else {
      toast.success('Repas validé !')
    }
    loadLeftovers()
  }

  /**
   * Re-planning dynamique : la Routine claude.ai réorganise la fin de semaine
   * (restes d'abord, stock, budget nutritionnel restant). `pinned` fixe un
   * repas décidé par l'utilisateur (« ce soir je fais des bolognaises »).
   */
  async function requestReplan({ reason, pinned } = {}) {
    if (replanSending) return
    setReplanSending(true)
    try {
      const res = await authFetch('/api/routine/replan-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ import_id: importId, reason, pinned }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) {
        toast.error(data.error || 'Impossible de lancer la réorganisation')
        return
      }
      toast.success('Réorganisation lancée — la routine met à jour la semaine (1-2 min)…')
      setReplanOffered(false)
      setImproviseOpen(false)
      setImproviseText('')
    } catch {
      toast.error('Erreur réseau — réorganisation non lancée')
    } finally {
      setReplanSending(false)
    }
  }

  function submitImprovise() {
    const text = improviseText.trim()
    if (!text) {
      toast.warning('Décrivez le plat que vous voulez cuisiner')
      return
    }
    requestReplan({
      reason: 'envie',
      pinned: { meal_date: todayStr, meal_type: improviseSlot, description: text },
    })
  }

  // Fermeture par Escape sur la bottom sheet
  useEffect(() => {
    if (!showChoice) return
    function onKeyDown(e) {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showChoice])

  async function loadDone() {
    try {
      const res = await authFetch(`/api/nutrition/log?from=${todayStr}&to=${tomorrowStr}`)
      const data = await res.json()
      const s = new Set()
      for (const e of (data.entries || [])) {
        if (e.meal_date && e.meal_type) s.add(`${e.meal_date}|${e.meal_type}`)
      }
      setDoneSet(s)
    } catch {}
  }

  const mealKey = (meal) => `${meal.entries?.[0]?.meal_date}|${meal.type}`
  const isDone = (meal) => doneSet.has(mealKey(meal))

  async function toggleDone(meal) {
    const key = mealKey(meal)
    const date = meal.entries?.[0]?.meal_date
    if (doneSet.has(key)) {
      try {
        // batch_recipe_id → l'API re-crédite la portion batch décomptée
        const batchRecipeId = (meal.entries || []).find(e => e.batch_recipe_id)?.batch_recipe_id || null
        await authFetch('/api/meals/cook', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meal_date: date, meal_type: meal.type, batch_recipe_id: batchRecipeId }),
        })
        setDoneSet(s => { const n = new Set(s); n.delete(key); return n })
        loadLeftovers() // le reste créé par ce créneau a pu être supprimé
      } catch {}
    } else {
      setCookSheetMeal(meal)
    }
  }

  async function loadMeals() {
    try {
      const res = await authFetch(`/api/planning/imports/${importId}`)
      const data = await res.json()
      if (data.meals) setMeals(data.meals)
      if (Array.isArray(data.householdMembers)) setHouseholdMembers(data.householdMembers)
    } catch (err) {
      console.error('Erreur chargement meals:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleMealClick(meal) {
    if (!meal.dishName) return
    setSelectedMeal(meal)
    setShowChoice(true)
    setSwapMode(false)
    setSwapError('')
    setSwapDirection('')
    setSwapSuccess(false)
  }

  function closeModal() {
    setShowChoice(false)
    setSelectedMeal(null)
    setSwapMode(false)
    setSwapError('')
    setSwapDirection('')
  }

  // ── COOK FLOW ──
  async function handleCook() {
    if (!selectedMeal || generatingRecipe) return
    const representative = selectedMeal.entries[0]
    const query = representative?.description || selectedMeal.dishName
    if (!query) return
    setGeneratingRecipe(true)
    setShowChoice(false)

    // Réutilise le helper partagé mais sans setGeneratingFor (on a generatingRecipe ici)
    try {
      const res = await authFetch(`/api/recipes/generated?q=${encodeURIComponent(query)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(
          res.status === 404
            ? "Pas encore de fiche recette pour ce plat. Elle est créée lors de la génération du planning."
            : (data.error || 'Erreur lors du chargement de la recette.')
        )
        return
      }
      setGeneratedRecipe(data.recipe)
      setCachedRecipeId(data.recipe?.id || null)
      setCookModeOpen(true)
    } catch (err) {
      console.error('Error loading recipe:', err)
      toast.error('Erreur lors du chargement de la recette. Réessaie.')
    } finally {
      setGeneratingRecipe(false)
    }
  }

  async function handleRate(rating) {
    if (!cachedRecipeId || !rating) return
    try {
      await authFetch('/api/ai/recipe/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: cachedRecipeId, rating, cooked: true }),
      })
    } catch (err) {
      console.error('Error rating recipe:', err)
    }
  }

  // ── MODIFY FLOW ──
  async function handleModify() {
    if (!selectedMeal || swapping) return
    setSwapping(true)
    setSwapError('')

    try {
      const res = await authFetch('/api/routine/modify-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          import_id: importId,
          meal_date: selectedMeal.entries[0].meal_date,
          meal_type: selectedMeal.type,
          person_name: selectedMeal.entries[0].person_name,
          direction: swapDirection || '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification')
      setSwapSuccess(true)
      setTimeout(() => {
        closeModal()
        loadMeals()
      }, 1400)
    } catch (err) {
      setSwapError(err.message)
    } finally {
      setSwapping(false)
    }
  }

  if (loading) return <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>...</p>
  if (!importId || meals.length === 0) return null

  const groups = [
    { date: todayStr, label: "Aujourd'hui", meals: meals.filter(m => m.meal_date === todayStr) },
    { date: tomorrowStr, label: 'Demain', meals: meals.filter(m => m.meal_date === tomorrowStr) },
  ].filter(g => g.meals.length > 0)

  if (groups.length === 0) {
    const todayLabel = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    return (
      <div style={{ padding: '14px 0' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{todayLabel}</p>
        <p style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-1)', fontSize: 19, margin: '0 0 10px' }}>Rien de prévu aujourd'hui</p>
        <a href="/planning" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--terracotta)', textDecoration: 'none' }}>
          Voir le planning de la semaine →
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="tm-container">
        {/* Re-planning dynamique proposé quand des restes viennent d'être créés */}
        {replanOffered && (
          <div className="tm-replan-cta" role="status">
            <span className="tm-replan-text">
              Des restes ont été créés — réorganiser la suite de la semaine pour les utiliser ?
            </span>
            <div className="tm-replan-actions">
              <button
                className="tm-replan-yes"
                disabled={replanSending}
                onClick={() => requestReplan({ reason: 'leftovers' })}
              >
                {replanSending ? 'Lancement…' : 'Réorganiser'}
              </button>
              <button className="tm-replan-later" onClick={() => setReplanOffered(false)}>
                Plus tard
              </button>
            </div>
          </div>
        )}

        {/* Cuisiner un plat libre (hors planning) */}
        <div className="tm-improvise">
          <button
            className="tm-improvise-open"
            style={{ marginRight: 8 }}
            onClick={() => setCookSheetMeal({
              type: currentMealType(),
              freeform: true,
              entries: (householdMembers.length
                ? householdMembers
                : [...new Set(meals.map(meal => meal.person_name).filter(Boolean))].map(name => ({ name })))
                .map(member => ({ person_name: member.name, meal_date: todayStr })),
            })}
          >
            <ChefHat size={13} aria-hidden="true" />
            Cuisiner un plat libre
          </button>
        </div>

        {/* Improviser : l'utilisateur impose un plat, la routine réajuste le reste */}
        <div className="tm-improvise">
          {!improviseOpen ? (
            <button className="tm-improvise-open" onClick={() => setImproviseOpen(true)}>
              <Sparkles size={13} aria-hidden="true" />
              Improviser un repas
            </button>
          ) : (
            <div className="tm-improvise-form">
              <input
                type="text"
                className="tm-improvise-input"
                placeholder="Ex : bolognaise maison avec ce qu'on a"
                value={improviseText}
                maxLength={200}
                onChange={(e) => setImproviseText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitImprovise() }}
                aria-label="Plat que vous voulez cuisiner"
                autoFocus
              />
              <select
                className="tm-improvise-slot"
                value={improviseSlot}
                onChange={(e) => setImproviseSlot(e.target.value)}
                aria-label="Créneau du repas improvisé"
              >
                <option value="dejeuner">Déjeuner</option>
                <option value="diner">Dîner</option>
              </select>
              <button className="tm-replan-yes" disabled={replanSending} onClick={submitImprovise}>
                {replanSending ? '…' : 'Caler ce plat'}
              </button>
              <button
                className="tm-replan-later"
                onClick={() => { setImproviseOpen(false); setImproviseText('') }}
                aria-label="Annuler l'improvisation"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {leftovers.length > 0 && (
          <div className="tm-leftovers">
            <p className="tm-leftovers-title">
              <Soup size={13} />
              Restes à manger
            </p>
            {leftovers.map(d => {
              const days = d.days_until_expiration
              const badgeClass = days <= 1 ? ' tm-dlc-red' : days <= 3 ? ' tm-dlc-orange' : ''
              return (
                <div key={d.id} className="tm-leftover-row">
                  <div className="tm-leftover-info">
                    <span className="tm-leftover-name">{d.name}</span>
                    <span className="tm-leftover-meta">
                      {fmtPortions(d.portions_remaining)} portion{d.portions_remaining > 1 ? 's' : ''}
                      {d.storage_method === 'freezer' ? ' · congelé' : ''}
                    </span>
                  </div>
                  <span className={`tm-dlc-badge${badgeClass}`}>
                    {days <= 0 ? "Aujourd'hui" : `J-${days}`}
                  </span>
                  <button className="tm-eat-now-btn" onClick={() => eatLeftover(d)}>
                    Manger maintenant
                  </button>
                </div>
              )
            })}
          </div>
        )}
        {groups.map(group => {
          const byType = {}
          for (const m of group.meals) {
            if (!byType[m.meal_type]) byType[m.meal_type] = []
            byType[m.meal_type].push(m)
          }

          const mergedMeals = Object.entries(byType)
            .sort(([a], [b]) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b))
            .map(([type, entries]) => {
              const dishName = extractDishName(entries.map(e => e.description))
              const persons = entries.map(e => e.person_name?.charAt(0) || '?')
              return { type, dishName, entries, persons: [...new Set(persons)] }
            })

          return (
            <div key={group.date}>
              {groups.length > 1 && <p className="tm-day-label">{group.label}</p>}
              {mergedMeals.map((meal, i) => {
                const isGenerating = generatingRecipe && selectedMeal?.dishName === meal.dishName
                const done = isDone(meal)
                const isMainMeal = meal.type === 'dejeuner' || meal.type === 'diner'
                const coveredEntry = meal.entries.find(entry => coverageByMeal[entry.id]) || meal.entries[0]
                const stockCov = (isMainMeal && coveredEntry?.id)
                  ? coverageByMeal[coveredEntry.id]
                  : null
                return (
                  <div key={i} className="tm-meal" style={{ opacity: generatingRecipe && !isGenerating ? 0.5 : 1 }}>
                    <span className="tm-meal-bar" style={{ background: MEAL_BAR_VAR[meal.type] || MEAL_BAR_VAR.diner }} />
                    <span className="tm-meal-label">{MEAL_LABELS[meal.type] || meal.type}</span>
                    <span
                      onClick={() => !generatingRecipe && handleMealClick(meal)}
                      className={`tm-meal-name${done ? ' tm-meal-name-done' : ''}`}
                      style={{ cursor: meal.dishName ? 'pointer' : 'default' }}
                    >
                      {meal.dishName}
                    </span>
                    {stockCov && (
                      <StockDot
                        status={stockCov.status}
                        have={stockCov.have}
                        need={stockCov.need}
                        missing={stockCov.missing || []}
                        faded={done}
                      />
                    )}
                    <span className="tm-meal-right">
                      {isGenerating
                        ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite', color: 'var(--ink-3)' }} />
                        : <span className="tm-meal-who">{meal.persons.join('·')}</span>}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleDone(meal) }}
                        title={done ? 'Cuisiné — annuler' : 'Marquer cuisiné'}
                        className={`tm-check${done ? ' done' : ''}`}
                      >
                        {done && <Check size={11} color="#fff" />}
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {generatingRecipe && (
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      )}

      {/* ═══ CHOICE MODAL (portail → couvre TOUTE la page) ═══ */}
      {showChoice && selectedMeal && typeof document !== 'undefined' && createPortal(
        <>
          <div className="tm-overlay" onClick={closeModal} />
          <div
            className="tm-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Options pour ${selectedMeal.dishName}`}
          >
            {/* Decorative top bar */}
            <div className="tm-modal-top-bar" />

            {/* Header */}
            <div className="tm-modal-header">
              <div>
                <span className="tm-modal-meal-type-wrap">
                  <span className="tm-modal-meal-bar" style={{ background: MEAL_BAR_VAR[selectedMeal.type] || MEAL_BAR_VAR.diner }} />
                  {MEAL_LABELS[selectedMeal.type] || selectedMeal.type}
                </span>
                <h3 className="tm-modal-title">{selectedMeal.dishName}</h3>
                {selectedMeal.entries[0]?.kcal && (
                  <p className="tm-modal-macros">
                    {selectedMeal.entries.map(e => `${e.person_name?.charAt(0)}: ${e.kcal} kcal`).join(' · ')}
                  </p>
                )}
              </div>
              <button onClick={closeModal} className="tm-close-btn" aria-label="Fermer"><X size={18} /></button>
            </div>

            {/* ── DEFAULT: choice buttons ── */}
            {!swapMode && !swapSuccess && (
              <div className="tm-choice-buttons">
                <button onClick={handleCook} className="tm-cook-btn">
                  <ChefHat size={18} />
                  Cuisiner
                </button>
                <button onClick={() => setSwapMode(true)} className="tm-swap-btn">
                  <RefreshCw size={18} />
                  Changer ce plat
                </button>
              </div>
            )}

            {/* ── MODIFY MODE ── */}
            {swapMode && !swapSuccess && (
              <div className="tm-swap-section">
                <label htmlFor="tm-swap-input" className="sr-only">Direction de modification (optionnel)</label>
                <input
                  id="tm-swap-input"
                  aria-label="Direction de modification (optionnel)"
                  type="text"
                  value={swapDirection}
                  onChange={e => setSwapDirection(e.target.value)}
                  placeholder="Ex : plus végétarien, moins gras, j'ai du saumon… (optionnel)"
                  className="tm-swap-input"
                  onKeyDown={e => e.key === 'Enter' && handleModify()}
                  autoFocus
                  disabled={swapping}
                />
                <button onClick={handleModify} disabled={swapping} className="tm-generate-btn">
                  {swapping ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Claude réfléchit à un nouveau repas… (30–60s)
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Régénérer le repas
                    </>
                  )}
                </button>
                {swapError && <p className="tm-swap-error">{swapError}</p>}
                {!swapping && (
                  <button onClick={() => setSwapMode(false)} className="tm-cancel-link">Annuler</button>
                )}
              </div>
            )}

            {/* ── SUCCESS ── */}
            {swapSuccess && (
              <div className="tm-success-section">
                <div className="tm-success-icon">
                  <Check size={28} color="white" />
                </div>
                <p className="tm-success-label">Repas modifié !</p>
              </div>
            )}
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </>,
        document.body
      )}

      <CookMode
        open={cookModeOpen}
        onClose={() => { setCookModeOpen(false); setGeneratedRecipe(null) }}
        recipe={generatedRecipe}
        steps={generatedRecipe?.steps || []}
        ingredients={generatedRecipe?.ingredients || []}
        recipeId={cachedRecipeId}
        onRate={handleRate}
        mealEntries={selectedMeal?.entries || []}
      />

      <CookSession
        open={!!cookSheetMeal}
        meal={cookSheetMeal}
        onClose={() => setCookSheetMeal(null)}
        onDone={handleCooked}
      />
    </>
  )
}

// CookValidationSheet supprimée — remplacée par CookSession (voir ./CookSession.jsx).
