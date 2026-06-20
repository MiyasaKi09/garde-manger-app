'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { authFetch } from '@/lib/authFetch'
import { Loader2, ChefHat, Flame, Soup, X, Minus, Plus, Check, Search, AlertTriangle, Refrigerator } from 'lucide-react'
import './CookSession.css'

const round1 = (v) => Math.round(v * 10) / 10
export const fmtPortions = (v) => String(round1(v)).replace('.', ',')

const formatDlc = (d) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })

const MEAL_LABELS = {
  pdj: 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}

const MEAL_BAR = {
  pdj: 'var(--m-pdj)',
  dejeuner: 'var(--m-dej)',
  diner: 'var(--m-din)',
  collation: 'var(--m-col)',
}

/** Normalise un nom en minuscules sans accents pour la déduplication. */
function normalizeKey(name) {
  return (name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/** Clé unique d'un ingrédient : canonical > archetype > nom normalisé. */
function ingKey(ing) {
  if (ing.canonical_food_id) return `c${ing.canonical_food_id}`
  if (ing.archetype_id) return `a${ing.archetype_id}`
  return `n_${normalizeKey(ing.name)}`
}

/**
 * Fusionne deux listes d'ingrédients.
 * Règle : pour un ingrédient commun aux deux variantes, on garde le MAX de qty
 * (une seule poêle — pas la somme). Les ingrédients exclusifs à une variante
 * sont ajoutés tels quels.
 */
function mergeIngredientLists(listA, listB) {
  const map = new Map()
  for (const ing of listA) {
    map.set(ingKey(ing), { ...ing })
  }
  for (const ing of listB) {
    const k = ingKey(ing)
    if (map.has(k)) {
      const existing = map.get(k)
      map.set(k, { ...existing, qty: Math.max(existing.qty, ing.qty) })
    } else {
      map.set(k, { ...ing })
    }
  }
  return Array.from(map.values())
}

/**
 * Regroupe les entries par variante (short_label || description).
 * Retourne un tableau de { label, entries }.
 */
function groupByVariant(entries) {
  const map = new Map()
  for (const e of entries) {
    const k = (e.short_label || e.description || '').trim()
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(e)
  }
  return Array.from(map.entries()).map(([label, entries]) => ({ label, entries }))
}

/**
 * CookSession — feuille de cuisson flexible.
 *
 * Props :
 *   open        boolean
 *   meal        object (planifié | reste | freeform)
 *   onClose     () => void
 *   onDone      (data) => void
 */
export default function CookSession({ open, meal, onClose, onDone }) {
  // ── Portions
  const [portions, setPortions] = useState({})         // person_name → float
  const [prepared, setPrepared] = useState(1)
  const [preparedTouched, setPreparedTouched] = useState(false)

  // ── Ingrédients
  const [rows, setRows] = useState([])                  // { key, name, canonical_food_id, archetype_id, qty, unit }
  const [loadingIng, setLoadingIng] = useState(false)

  // ── Recherche d'ingrédient libre
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimerRef = useRef(null)

  // ── Nom du plat libre (mode freeform)
  const [freeDishName, setFreeDishName] = useState('')

  // ── Mode batch cook (journée de cuisine)
  const [preparedPortions, setPreparedPortions] = useState(1)
  const [storageMethod, setStorageMethod] = useState('fridge')

  // ── Nutrition par variante (clé = short_label || description → nutrition_per_serving)
  const variantNutritionRef = useRef({})

  // ── Soumission
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [shortfalls, setShortfalls] = useState([])

  const eatenDish = meal?.eatenDish || null
  // isBatchCook : NOUVELLE cuisson d'un batch (mode journée de cuisine)
  const isBatchCook = !!meal?.batch
  // isBatch : réchauffe d'un plat déjà cuisiné en batch (mode existant — ne s'applique QUE si !isBatchCook)
  const isBatch = !isBatchCook && !eatenDish && !meal?.freeform && (meal?.entries || []).some(e => e.batch_recipe_id)
  const isFreeform = !!meal?.freeform
  const mealDate = meal?.entries?.[0]?.meal_date
  const dishName = isFreeform ? freeDishName : (meal?.dishName || '')

  // ── Init à chaque ouverture
  useEffect(() => {
    if (!open || !meal) return
    const init = {}
    for (const e of meal.entries || []) init[e.person_name] = 1
    setPortions(init)
    setPrepared(Object.keys(init).length || 1)
    setPreparedTouched(false)
    setError(null)
    setShortfalls([])
    setSearchQuery('')
    setSearchResults([])
    variantNutritionRef.current = {}
    if (isFreeform) setFreeDishName('')

    if (isBatchCook) {
      // Mode journée de cuisine : portions depuis la prop, reset conservation
      setPreparedPortions(meal.portionsTotal || 1)
      setStorageMethod('fridge')
      loadBatchIngredients()
    } else if (isBatch || eatenDish) {
      setRows([])
      setLoadingIng(false)
    } else {
      loadIngredients()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, meal?.dishName, meal?.batchRecipeId, eatenDish?.id, isFreeform, isBatchCook])

  // ── Fermeture clavier Escape
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // ── Debounce recherche ingrédient
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!searchQuery.trim()) { setSearchResults([]); return }
    searchTimerRef.current = setTimeout(() => {
      fetchSearch(searchQuery.trim())
    }, 250)
    return () => clearTimeout(searchTimerRef.current)
  }, [searchQuery])

  async function fetchSearch(q) {
    setSearchLoading(true)
    try {
      const res = await authFetch(`/api/ingredients/search?q=${encodeURIComponent(q)}&limit=8`)
      const data = await res.json().catch(() => ({}))
      setSearchResults(res.ok ? (data.results || []) : [])
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  /**
   * Mode journée de cuisine : charge les ingrédients du batch depuis
   * GET /api/planning/batch/{batchRecipeId}/ingredients
   */
  async function loadBatchIngredients() {
    setLoadingIng(true)
    setError(null)
    setRows([])
    const id = meal?.batchRecipeId
    if (!id) {
      setLoadingIng(false)
      return
    }
    try {
      const res = await authFetch(`/api/planning/batch/${id}/ingredients`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur chargement ingrédients batch')
      const mapped = (data.ingredients || []).map(ing => ({
        key: ingKey(ing),
        name: ing.name,
        canonical_food_id: ing.canonical_food_id || null,
        archetype_id: ing.archetype_id || null,
        qty: Math.round(ing.quantity || 100),
        unit: ing.unit || 'g',
      }))
      setRows(mapped)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingIng(false)
    }
  }

  /**
   * Charge et fusionne les listes d'ingrédients pour toutes les variantes du créneau.
   * Variante = groupe entries par short_label || description.
   */
  async function loadIngredients() {
    setLoadingIng(true)
    setError(null)
    setRows([])

    if (isFreeform) {
      setLoadingIng(false)
      return
    }

    try {
      const variants = groupByVariant(meal.entries || [])
      let merged = []

      for (const variant of variants) {
        const rep = variant.entries.find(e => e.person_name === 'Julien') || variant.entries[0]
        const q = rep?.description || meal?.dishName
        if (!q) continue

        const recRes = await authFetch(`/api/recipes/generated?q=${encodeURIComponent(q)}`)
        if (!recRes.ok) continue
        const recData = await recRes.json().catch(() => ({}))
        const recipeId = recData.recipe?.id
        if (!recipeId) continue

        // Capturer la nutrition canonique par portion pour cette variante
        if (recData.recipe?.nutrition_per_serving) {
          variantNutritionRef.current[variant.label] = recData.recipe.nutrition_per_serving
        }

        const ingRes = await authFetch(`/api/recipes/generated/${recipeId}/available-ingredients`)
        const ingData = await ingRes.json().catch(() => ({}))

        const variantRows = (ingData.ingredients || []).map(ing => ({
          key: ingKey(ing),
          name: ing.name,
          canonical_food_id: ing.canonical_food_id || null,
          archetype_id: ing.archetype_id || null,
          qty: Math.round(ing.quantity || 0),
          unit: ing.unit || 'g',
        }))

        merged = mergeIngredientLists(merged, variantRows)
      }

      setRows(merged)
    } catch {
      setError('Erreur de chargement des ingrédients')
    } finally {
      setLoadingIng(false)
    }
  }

  function updateRow(key, patch) {
    setRows(rs => rs.map(r => r.key === key ? { ...r, ...patch } : r))
  }

  function removeRow(key) {
    setRows(rs => rs.filter(r => r.key !== key))
  }

  function addSearchResult(result) {
    const newRow = {
      key: ingKey(result),
      name: result.name,
      canonical_food_id: result.canonical_food_id || null,
      archetype_id: result.archetype_id || null,
      qty: 100,
      unit: result.unit || 'g',
    }
    setRows(rs => {
      const exists = rs.find(r => r.key === newRow.key)
      if (exists) return rs
      return [...rs, newRow]
    })
    setSearchQuery('')
    setSearchResults([])
  }

  // ── Calculs portions
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

  // ── Confirmation
  async function confirm() {
    if (saving) return
    if (isFreeform && !freeDishName.trim()) {
      setError('Entrez un nom pour le plat')
      return
    }
    setSaving(true)
    setError(null)
    setShortfalls([])

    try {
      const needs = rows
        .filter(r => (r.canonical_food_id || r.archetype_id) && r.qty > 0)
        .map(r => ({
          ...(r.canonical_food_id ? { canonical_food_id: r.canonical_food_id } : {}),
          ...(r.archetype_id ? { archetype_id: r.archetype_id } : {}),
          qty: r.qty,
          unit: r.unit,
        }))

      // ── Mode journée de cuisine (batch cook) ──
      if (isBatchCook) {
        const body = {
          batchRecipeId: meal.batchRecipeId,
          needs,
          portions: preparedPortions,
          storage_method: storageMethod,
        }
        const res = await authFetch('/api/planning/batch/cook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Erreur')

        onDone?.(data)

        if (data.shortfalls?.length) {
          setShortfalls(data.shortfalls)
          return
        }
        onClose?.()
        return
      }

      // ── Modes existants (repas planifié, reste, réchauffe, freeform) ──
      const entries = (meal.entries || []).map(e => {
        const p = portions[e.person_name] ?? 1
        // Chercher la nutrition canonique de la variante de cette entrée
        const variantKey = (e.short_label || e.description || '').trim()
        const canonicalNutrition = variantNutritionRef.current[variantKey] || null
        const src = eatenDish
          ? {
              kcal: eatenDish.kcal_per_portion,
              protein_g: eatenDish.protein_g_per_portion,
              carbs_g: eatenDish.carbs_g_per_portion,
              fat_g: eatenDish.fat_g_per_portion,
              fiber_g: eatenDish.fiber_g_per_portion,
            }
          : isFreeform
            ? { kcal: null, protein_g: null, carbs_g: null, fat_g: null, fiber_g: null }
            : (canonicalNutrition || e)
        const scale = (v) => (v != null ? round1(Number(v) * p) : null)
        return {
          person_name: e.person_name,
          portions_eaten: p,
          kcal: scale(src.kcal),
          protein_g: scale(src.protein_g),
          carbs_g: scale(src.carbs_g),
          fat_g: scale(src.fat_g),
          fiber_g: scale(src.fiber_g),
          ...(e.micronutrients ? { micronutrients: e.micronutrients } : {}),
        }
      })

      const batchRecipeId = (meal.entries || []).find(e => e.batch_recipe_id)?.batch_recipe_id || null

      const body = {
        meal_date: mealDate,
        meal_type: meal.type,
        dish_name: isFreeform ? freeDishName.trim() : dishName,
        entries,
        ...(needs.length > 0 && !isBatch && !eatenDish ? { needs } : {}),
        ...(batchRecipeId ? { batch_recipe_id: batchRecipeId } : {}),
        ...(eatenDish ? { eaten_dish_id: eatenDish.id } : {}),
        ...(!eatenDish && !isBatch ? { portions_prepared: effectivePrepared } : {}),
      }

      const res = await authFetch('/api/meals/cook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur')

      // Le repas est enregistré : on rafraîchit le parent dans tous les cas.
      onDone?.(data)

      // Stock insuffisant pour certains ingrédients : on GARDE la feuille
      // ouverte pour montrer l'avertissement (sinon onClose le masquerait).
      if (data.shortfalls?.length) {
        setShortfalls(data.shortfalls)
        return
      }
      onClose?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function stepBatchPortions(delta) {
    setPreparedPortions(p => Math.max(0.5, round1(p + delta)))
  }

  if (!open || !meal || typeof document === 'undefined') return null

  // La section ingrédients s'affiche : en batchCook, en normal et en freeform ; pas en réchauffe ni en reste.
  const hasIngSection = isBatchCook || (!eatenDish && !isBatch)

  return createPortal(
    <>
      <div className="cs-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="cs-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={dishName ? `Valider ${dishName}` : 'Cuisiner un plat'}
      >
        {/* Poignée */}
        <div className="cs-handle" aria-hidden="true" />

        {/* Header */}
        <div className="cs-header">
          <div className="cs-header-left">
            <span className="cs-meal-type-wrap">
              <span
                className="cs-meal-bar"
                style={{ background: MEAL_BAR[meal.type] || MEAL_BAR.diner }}
                aria-hidden="true"
              />
              {MEAL_LABELS[meal.type] || meal.type}
              {eatenDish && <span className="cs-badge-reste">Reste</span>}
              {isFreeform && <span className="cs-badge-libre">Libre</span>}
              {isBatch && <span className="cs-badge-batch">Batch</span>}
              {isBatchCook && <span className="cs-badge-batch-cook">Jour de cuisine</span>}
            </span>

            {/* Nom du plat : champ éditable en mode libre, sinon statique */}
            {isFreeform ? (
              <input
                className="cs-freedish-input"
                type="text"
                placeholder="Nom du plat…"
                value={freeDishName}
                maxLength={120}
                onChange={e => setFreeDishName(e.target.value)}
                aria-label="Nom du plat"
                autoFocus
              />
            ) : (
              <h2 className="cs-title">{dishName || 'Repas'}</h2>
            )}

            {/* Macros résumé */}
            {eatenDish && eatenDish.kcal_per_portion != null && (
              <p className="cs-macros">
                {Math.round(eatenDish.kcal_per_portion)} kcal ·{' '}
                {Math.round(eatenDish.protein_g_per_portion || 0)} g P / portion
              </p>
            )}
            {!eatenDish && !isFreeform && meal.entries?.[0]?.kcal && (
              <p className="cs-macros">
                {meal.entries.map(e => `${e.person_name?.charAt(0)}: ${Math.round(e.kcal)} kcal`).join(' · ')}
              </p>
            )}
          </div>
          <button onClick={onClose} className="cs-close" aria-label="Fermer la feuille de cuisson">
            <X size={18} />
          </button>
        </div>

        {/* ── Mode journée de cuisine : Portions préparées + conservation ── */}
        {isBatchCook && (
          <>
            <p className="cs-section-label">Portions préparées</p>
            <div className="cs-portion-list">
              <div className="cs-portion-row">
                <span className="cs-portion-name">Barquettes / portions</span>
                <div className="cs-stepper">
                  <button
                    type="button"
                    onClick={() => stepBatchPortions(-0.5)}
                    aria-label="Moins de portions préparées"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="cs-stepper-val">{fmtPortions(preparedPortions)}</span>
                  <button
                    type="button"
                    onClick={() => stepBatchPortions(0.5)}
                    aria-label="Plus de portions préparées"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            <p className="cs-section-label">Conservation</p>
            <div className="cs-storage-seg" role="group" aria-label="Méthode de conservation">
              <button
                type="button"
                className={`cs-storage-opt${storageMethod === 'fridge' ? ' cs-storage-active' : ''}`}
                onClick={() => setStorageMethod('fridge')}
                aria-pressed={storageMethod === 'fridge'}
              >
                <Refrigerator size={13} aria-hidden="true" />
                Frigo
              </button>
              <button
                type="button"
                className={`cs-storage-opt${storageMethod === 'freezer' ? ' cs-storage-active' : ''}`}
                onClick={() => setStorageMethod('freezer')}
                aria-pressed={storageMethod === 'freezer'}
              >
                <Flame size={13} aria-hidden="true" />
                Congélateur
              </button>
            </div>
          </>
        )}

        {/* ── Portions mangées (modes hors batchCook) ── */}
        {!isBatchCook && (
          <>
            <p className="cs-section-label">Portions mangées</p>
            <div className="cs-portion-list">
              {(meal.entries || []).map(e => (
                <div key={e.person_name} className="cs-portion-row">
                  <span className="cs-portion-name">{e.person_name}</span>
                  <div className="cs-stepper">
                    <button
                      type="button"
                      onClick={() => stepPortion(e.person_name, -0.5)}
                      aria-label={`Moins de portions pour ${e.person_name}`}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="cs-stepper-val">{fmtPortions(portions[e.person_name] ?? 1)}</span>
                    <button
                      type="button"
                      onClick={() => stepPortion(e.person_name, 0.5)}
                      aria-label={`Plus de portions pour ${e.person_name}`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Portions préparées au total (mode normal — hors batchCook et hors batch réchauffe) ── */}
        {!isBatchCook && !eatenDish && !isBatch && (
          <>
            <p className="cs-section-label">Portions préparées au total</p>
            <div className="cs-portion-list">
              <div className="cs-portion-row">
                <span className="cs-portion-name">Préparé</span>
                <div className="cs-stepper">
                  <button
                    type="button"
                    onClick={() => stepPrepared(-0.5)}
                    aria-label="Moins de portions préparées"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="cs-stepper-val">{fmtPortions(effectivePrepared)}</span>
                  <button
                    type="button"
                    onClick={() => stepPrepared(0.5)}
                    aria-label="Plus de portions préparées"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
            {surplus > 0 && (
              <p className="cs-leftover-hint">
                ➜ {fmtPortions(surplus)} portion{surplus > 1 ? 's' : ''} iront aux restes (DLC estimée +3 j)
              </p>
            )}
          </>
        )}

        {/* ── Ingrédients ── */}
        {hasIngSection && (
          <>
            <p className="cs-section-label">Ingrédients à déduire du stock</p>

            {loadingIng ? (
              <p className="cs-hint">
                <Loader2 size={14} className="cs-spin" aria-hidden="true" />
                Chargement des ingrédients…
              </p>
            ) : (
              <>
                {rows.length === 0 && !loadingIng && (
                  <p className="cs-hint">
                    {isFreeform
                      ? 'Ajoutez des ingrédients ci-dessous pour déduire du stock.'
                      : isBatchCook
                        ? 'Aucun ingrédient récupéré — ajoutez-en ci-dessous pour déduire du stock.'
                        : 'Aucun ingrédient lié au stock — seule la nutrition sera enregistrée.'}
                  </p>
                )}

                {rows.length > 0 && (
                  <div className="cs-ing-list" role="list">
                    {rows.map(r => {
                      const linked = !!(r.canonical_food_id || r.archetype_id)
                      return (
                        <div
                          key={r.key}
                          className={`cs-ing-row${!linked ? ' cs-ing-unlinked' : ''}`}
                          role="listitem"
                        >
                          <span className="cs-ing-name" title={r.name}>{r.name}</span>
                          {linked ? (
                            <>
                              <input
                                type="number"
                                min="0"
                                value={r.qty}
                                onChange={e => updateRow(r.key, { qty: Math.max(0, Number(e.target.value)) })}
                                className="cs-ing-qty"
                                aria-label={`Quantité de ${r.name}`}
                              />
                              <span className="cs-ing-unit">{r.unit}</span>
                            </>
                          ) : (
                            <span className="cs-ing-unlinked-note">pas lié au stock</span>
                          )}
                          <button
                            type="button"
                            className="cs-ing-remove"
                            onClick={() => removeRow(r.key)}
                            aria-label={`Supprimer ${r.name}`}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Recherche libre */}
                <div className="cs-search-wrap">
                  <div className="cs-search-field">
                    <Search size={13} className="cs-search-icon" aria-hidden="true" />
                    <input
                      type="text"
                      className="cs-search-input"
                      placeholder="Ajouter un ingrédient…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      aria-label="Rechercher un ingrédient à ajouter"
                      autoComplete="off"
                    />
                    {searchLoading && <Loader2 size={12} className="cs-spin cs-search-loader" aria-hidden="true" />}
                  </div>
                  {searchResults.length > 0 && (
                    <ul className="cs-search-results" role="listbox" aria-label="Résultats de recherche">
                      {searchResults.map((r, i) => (
                        <li key={i} role="option">
                          <button
                            type="button"
                            className="cs-search-item"
                            onClick={() => addSearchResult(r)}
                          >
                            <span className="cs-search-item-name">{r.name}</span>
                            <span className="cs-search-item-unit">{r.unit}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Mode reste existant ── */}
        {eatenDish && (
          <>
            <p className="cs-section-label">Reste du frigo</p>
            <p className="cs-note">
              <Soup size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {fmtPortions(eatenDish.portions_remaining)} portion
                {eatenDish.portions_remaining > 1 ? 's' : ''} restante
                {eatenDish.portions_remaining > 1 ? 's' : ''} ·
                DLC {formatDlc(eatenDish.expiration_date)}.
                Rien à déduire du stock (déjà retiré à la cuisson).
              </span>
            </p>
          </>
        )}

        {/* ── Mode batch ── */}
        {isBatch && (
          <>
            <p className="cs-section-label">Préparé d'avance</p>
            <p className="cs-note">
              <Flame size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Cuisiné lors du batch — réchauffe ta barquette, rien à déduire du stock.</span>
            </p>
          </>
        )}

        {/* ── Avertissement shortfalls (après réponse — non bloquant) ── */}
        {shortfalls.length > 0 && (
          <div className="cs-shortfall-warn" role="alert">
            <AlertTriangle size={15} aria-hidden="true" />
            <span>
              Stock insuffisant pour : {shortfalls.map(s => {
                // Le backend renvoie les shortfalls par id (sans nom) → on
                // retrouve le nom depuis nos lignes d'ingrédients.
                const row = rows.find(r =>
                  (s.canonical_food_id && r.canonical_food_id === s.canonical_food_id) ||
                  (s.archetype_id && r.archetype_id === s.archetype_id)
                )
                return row?.name || `${fmtPortions(s.missing ?? s.qty ?? 0)} ${s.unit || ''}`.trim() || 'ingrédient'
              }).join(', ')} — enregistré quand même. Pense à racheter.
            </span>
          </div>
        )}

        {/* ── Erreur ── */}
        {error && <p className="cs-error" role="alert">{error}</p>}

        {/* ── Bouton confirmer ── */}
        <button
          type="button"
          onClick={confirm}
          disabled={saving || loadingIng}
          className="cs-confirm-btn"
          style={{ opacity: (saving || loadingIng) ? 0.6 : 1 }}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="cs-spin" aria-hidden="true" />
              Enregistrement…
            </>
          ) : isBatchCook ? (
            <><Refrigerator size={17} aria-hidden="true" /> Confirmer — cuisiné &amp; ajouté au stock</>
          ) : eatenDish ? (
            <><Soup size={17} aria-hidden="true" /> Confirmer — reste mangé</>
          ) : isBatch ? (
            <><Flame size={17} aria-hidden="true" /> Confirmer — réchauffé</>
          ) : (
            <><ChefHat size={17} aria-hidden="true" /> Confirmer — cuisiné</>
          )}
        </button>
      </div>
      <style>{`@keyframes cs-spin-anim { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </>,
    document.body
  )
}
