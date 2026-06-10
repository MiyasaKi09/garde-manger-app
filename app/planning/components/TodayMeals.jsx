'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { authFetch } from '@/lib/authFetch'
import CookMode from '@/components/CookMode'
import { Loader2, ChefHat, RefreshCw, X, Check, Minus, Plus, Flame, Soup } from 'lucide-react'
import { toast } from '@/components/Toast'
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
  const [loading, setLoading] = useState(true)

  // « Cuisiné » : créneaux faits (clé `${date}|${type}`) + feuille de confirmation
  const [doneSet, setDoneSet] = useState(new Set())
  const [cookSheetMeal, setCookSheetMeal] = useState(null)

  // Restes actifs (cooked_dishes avec portions restantes, non périmés)
  const [leftovers, setLeftovers] = useState([])

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
      : ['Julien']
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
      toast.success(`Repas validé — ${result.leftover.portions_remaining} portion(s) aux restes (DLC ${formatDlc(result.leftover.expiration_date)})`)
    } else if (cookSheetMeal?.eatenDish) {
      toast.success('Reste mangé — portions mises à jour !')
    } else {
      toast.success('Repas validé !')
    }
    loadLeftovers()
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
    const julien = selectedMeal.entries.find(e => e.person_name === 'Julien') || selectedMeal.entries[0]
    const query = julien?.description || selectedMeal.dishName
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
          person_name: 'Julien',
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
                      {d.portions_remaining} portion{d.portions_remaining > 1 ? 's' : ''}
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

      <CookValidationSheet
        open={!!cookSheetMeal}
        meal={cookSheetMeal}
        onClose={() => setCookSheetMeal(null)}
        onDone={handleCooked}
      />
    </>
  )
}

/**
 * Feuille de validation d'un repas (bottom sheet) :
 *   - steppers « portions mangées » par personne (défaut 1, pas de 0,5) ;
 *   - « portions préparées au total » → le surplus part aux restes (cooked_dishes) ;
 *   - reste existant (meal.eatenDish) : décrémente ses portions via eaten_dish_id,
 *     nutrition par portion du plat si disponible, rien à déduire du stock ;
 *   - sinon : déduction FEFO des ingrédients comme avant.
 * POST /api/meals/cook — les kcal/macros envoyés par entry sont les TOTAUX
 * mangés par la personne (valeur du plan × portions_eaten).
 */
function CookValidationSheet({ open, meal, onClose, onDone }) {
  const [rows, setRows] = useState([])
  const [loadingIng, setLoadingIng] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [portions, setPortions] = useState({})        // person_name → portions mangées
  const [prepared, setPrepared] = useState(1)         // portions préparées au total
  const [preparedTouched, setPreparedTouched] = useState(false)

  const eatenDish = meal?.eatenDish || null
  const mealDate = meal?.entries?.[0]?.meal_date
  const dishName = meal?.dishName
  // Repas « batch » : stock déjà déduit le jour de cuisine → rien à déduire ici.
  const isBatch = !eatenDish && (meal?.entries || []).some(e => e.batch_recipe_id)

  useEffect(() => {
    if (!open || !meal) return
    const init = {}
    for (const e of meal.entries || []) init[e.person_name] = 1
    setPortions(init)
    setPrepared(Object.keys(init).length || 1)
    setPreparedTouched(false)
    setError(null)
    if (isBatch || eatenDish) { setRows([]); setLoadingIng(false) }
    else loadIngredients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, meal?.dishName, eatenDish?.id])

  async function loadIngredients() {
    setLoadingIng(true); setError(null); setRows([])
    try {
      const julien = meal.entries.find(e => e.person_name === 'Julien') || meal.entries[0]
      const q = julien?.description || dishName
      if (!q) { setLoadingIng(false); return }
      const recRes = await authFetch(`/api/recipes/generated?q=${encodeURIComponent(q)}`)
      if (!recRes.ok) { setLoadingIng(false); return }
      const recData = await recRes.json().catch(() => ({}))
      const recipeId = recData.recipe?.id
      if (!recipeId) { setLoadingIng(false); return }
      const ingRes = await authFetch(`/api/recipes/generated/${recipeId}/available-ingredients`)
      const ingData = await ingRes.json().catch(() => ({}))
      const built = (ingData.ingredients || []).map(ing => {
        const lot = ing.available_lots?.[0] || null
        const avail = lot?.quantity_available ?? 0
        const take = lot ? Math.min(ing.quantity || 0, avail) : 0
        return {
          name: ing.name,
          unit: ing.unit || lot?.unit || 'g',
          qty: Math.round(take),
          lot_id: lot?.id || null,
          include: !!lot && take > 0,
        }
      })
      setRows(built)
    } catch {
      setError('Erreur de chargement des ingrédients')
    } finally {
      setLoadingIng(false)
    }
  }

  function updateRow(i, patch) {
    setRows(rs => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  const eatenTotal = round1(Object.values(portions).reduce((s, v) => s + (Number(v) || 0), 0))
  const effectivePrepared = preparedTouched ? Math.max(prepared, eatenTotal) : eatenTotal
  const surplus = Math.max(0, round1(effectivePrepared - eatenTotal))

  function stepPortion(name, delta) {
    setPortions(p => ({ ...p, [name]: Math.max(0.5, round1((p[name] || 1) + delta)) }))
  }

  function stepPrepared(delta) {
    setPreparedTouched(true)
    setPrepared(Math.max(eatenTotal, round1(effectivePrepared + delta)))
  }

  async function confirm() {
    if (saving) return
    setSaving(true); setError(null)
    try {
      const deductions = rows
        .filter(r => r.include && r.lot_id && r.qty > 0)
        .map(r => ({ lot_id: r.lot_id, quantity_used: r.qty, unit: r.unit, product_name: r.name }))
      const entries = (meal.entries || []).map(e => {
        const p = portions[e.person_name] ?? 1
        // Source nutrition : le reste (par portion) si on mange un reste, sinon le plan.
        const src = eatenDish
          ? {
              kcal: eatenDish.kcal_per_portion,
              protein_g: eatenDish.protein_g_per_portion,
              carbs_g: eatenDish.carbs_g_per_portion,
              fat_g: eatenDish.fat_g_per_portion,
              fiber_g: eatenDish.fiber_g_per_portion,
            }
          : e
        // Totaux mangés par la personne = valeur par portion × portions mangées.
        const scale = (v) => (v != null ? round1(Number(v) * p) : null)
        return {
          person_name: e.person_name,
          portions_eaten: p,
          kcal: scale(src.kcal),
          protein_g: scale(src.protein_g),
          carbs_g: scale(src.carbs_g),
          fat_g: scale(src.fat_g),
          fiber_g: scale(src.fiber_g),
          micronutrients: e.micronutrients || undefined,
        }
      })
      const batchRecipeId = (meal.entries || []).find(e => e.batch_recipe_id)?.batch_recipe_id || null
      const res = await authFetch('/api/meals/cook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_date: mealDate,
          meal_type: meal.type,
          dish_name: dishName,
          entries,
          deductions,
          batch_recipe_id: batchRecipeId,
          eaten_dish_id: eatenDish?.id || undefined,
          // Pas de portions_prepared pour un reste mangé (rien de cuisiné) ni un
          // batch (les barquettes restantes sont déjà comptées dans cooked_dishes).
          portions_prepared: (eatenDish || isBatch) ? undefined : effectivePrepared,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur')
      onDone?.(data)
      onClose?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open || !meal || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="tm-overlay" onClick={onClose} />
      <div className="tm-modal" role="dialog" aria-modal="true" aria-label={`Valider ${dishName}`}>
        <div className="tm-modal-top-bar" />

        <div className="tm-modal-header">
          <div>
            <span className="tm-modal-meal-type-wrap">
              <span className="tm-modal-meal-bar" style={{ background: MEAL_BAR_VAR[meal.type] || MEAL_BAR_VAR.diner }} />
              {MEAL_LABELS[meal.type] || meal.type}
              {eatenDish && <span className="tm-leftover-flag">Reste</span>}
            </span>
            <h3 className="tm-modal-title">{dishName}</h3>
            {eatenDish ? (
              eatenDish.kcal_per_portion != null && (
                <p className="tm-modal-macros">
                  {Math.round(eatenDish.kcal_per_portion)} kcal · {Math.round(eatenDish.protein_g_per_portion || 0)}g P / portion
                </p>
              )
            ) : (
              meal.entries?.[0]?.kcal && (
                <p className="tm-modal-macros">
                  {meal.entries.map(e => `${e.person_name?.charAt(0)}: ${Math.round(e.kcal)} kcal`).join(' · ')}
                </p>
              )
            )}
          </div>
          <button onClick={onClose} className="tm-close-btn" aria-label="Fermer"><X size={18} /></button>
        </div>

        {/* ── Portions mangées ── */}
        <p className="tm-section-label">Portions mangées</p>
        <div className="tm-portion-list">
          {(meal.entries || []).map(e => (
            <div key={e.person_name} className="tm-portion-row">
              <span className="tm-portion-name">{e.person_name}</span>
              <div className="tm-stepper">
                <button
                  type="button"
                  onClick={() => stepPortion(e.person_name, -0.5)}
                  aria-label={`Moins de portions pour ${e.person_name}`}
                ><Minus size={13} /></button>
                <span className="tm-stepper-value">{fmtPortions(portions[e.person_name] ?? 1)}</span>
                <button
                  type="button"
                  onClick={() => stepPortion(e.person_name, 0.5)}
                  aria-label={`Plus de portions pour ${e.person_name}`}
                ><Plus size={13} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Portions préparées (ni reste existant, ni batch déjà compté) ── */}
        {!eatenDish && !isBatch && (
          <>
            <p className="tm-section-label">Portions préparées au total</p>
            <div className="tm-portion-list">
              <div className="tm-portion-row">
                <span className="tm-portion-name">Préparé</span>
                <div className="tm-stepper">
                  <button type="button" onClick={() => stepPrepared(-0.5)} aria-label="Moins de portions préparées"><Minus size={13} /></button>
                  <span className="tm-stepper-value">{fmtPortions(effectivePrepared)}</span>
                  <button type="button" onClick={() => stepPrepared(0.5)} aria-label="Plus de portions préparées"><Plus size={13} /></button>
                </div>
              </div>
            </div>
            {surplus > 0 && (
              <p className="tm-leftover-hint">
                ➜ {fmtPortions(surplus)} portion{surplus > 1 ? 's' : ''} iront aux restes (DLC estimée +3 j)
              </p>
            )}
          </>
        )}

        {/* ── Stock ── */}
        <p className="tm-section-label">
          {eatenDish ? 'Reste du frigo' : isBatch ? "Préparé d'avance" : 'À déduire du stock'}
        </p>
        {eatenDish ? (
          <p className="tm-sheet-note">
            <Soup size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              {eatenDish.portions_remaining} portion{eatenDish.portions_remaining > 1 ? 's' : ''} restante{eatenDish.portions_remaining > 1 ? 's' : ''} ·
              DLC {formatDlc(eatenDish.expiration_date)}. Rien à déduire du stock (déjà retiré à la cuisson).
            </span>
          </p>
        ) : isBatch ? (
          <p className="tm-sheet-note">
            <Flame size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Cuisiné lors du batch — réchauffe ta barquette, rien à déduire du stock.</span>
          </p>
        ) : loadingIng ? (
          <p className="tm-sheet-hint">
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', verticalAlign: 'middle', marginRight: 6 }} />
            Chargement…
          </p>
        ) : rows.length === 0 ? (
          <p className="tm-sheet-hint">Aucun ingrédient lié au stock — seule la nutrition sera enregistrée.</p>
        ) : (
          <div className="tm-ing-list">
            {rows.map((r, i) => (
              <div key={i} className="tm-ing-row" style={{ opacity: r.lot_id ? 1 : 0.5 }}>
                <button
                  type="button"
                  onClick={() => r.lot_id && updateRow(i, { include: !r.include })}
                  className={`tm-check${r.include ? ' done' : ''}`}
                  style={{ cursor: r.lot_id ? 'pointer' : 'default' }}
                  aria-label={`${r.include ? 'Exclure' : 'Inclure'} ${r.name}`}
                >
                  {r.include && <Check size={11} color="#fff" />}
                </button>
                <span className="tm-ing-name">{r.name}</span>
                {r.lot_id ? (
                  <>
                    <input
                      type="number" min="0" value={r.qty}
                      onChange={e => updateRow(i, { qty: Math.max(0, Number(e.target.value)) })}
                      className="tm-ing-qty"
                    />
                    <span className="tm-ing-unit">{r.unit}</span>
                  </>
                ) : (
                  <span className="tm-ing-outstock">pas en stock</span>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <p className="tm-swap-error">{error}</p>}

        <button
          onClick={confirm}
          disabled={saving || loadingIng}
          className="tm-confirm-btn"
          style={{ opacity: (saving || loadingIng) ? 0.6 : 1 }}
        >
          {saving
            ? 'Enregistrement…'
            : eatenDish
              ? <><Soup size={17} /> Confirmer — reste mangé</>
              : isBatch
                ? <><Flame size={17} /> Confirmer — réchauffé</>
                : <><ChefHat size={17} /> Confirmer — cuisiné</>}
        </button>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    </>,
    document.body
  )
}
