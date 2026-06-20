'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import CookWizard from '@/components/CookWizard'
import './generated-recipe.css'

// ── Constantes micronutriments ────────────────────────────────────────────────

const MICRO_AJR = {
  calcium_mg: 800,
  fer_mg: 14,
  magnesium_mg: 375,
  zinc_mg: 10,
  selenium_ug: 55,
  vitamine_a_ug: 800,
  vitamine_c_mg: 80,
  vitamine_d_ug: 5,
  vitamine_e_mg: 12,
  vitamine_b1_mg: 1.1,
  vitamine_b2_mg: 1.4,
  vitamine_b3_mg: 16,
  vitamine_b6_mg: 1.4,
  vitamine_b9_ug: 200,
  vitamine_b12_ug: 2.5,
  vitamine_k_ug: 75,
  potassium_mg: 2000,
  sodium_mg: 2400,
  phosphore_mg: 700,
}

const MICRO_LABELS = {
  calcium_mg: 'Calcium',
  fer_mg: 'Fer',
  magnesium_mg: 'Magnésium',
  zinc_mg: 'Zinc',
  selenium_ug: 'Sélénium',
  vitamine_a_ug: 'Vit. A',
  vitamine_c_mg: 'Vit. C',
  vitamine_d_ug: 'Vit. D',
  vitamine_e_mg: 'Vit. E',
  vitamine_b1_mg: 'Vit. B1',
  vitamine_b2_mg: 'Vit. B2',
  vitamine_b3_mg: 'Vit. B3',
  vitamine_b6_mg: 'Vit. B6',
  vitamine_b9_ug: 'Vit. B9',
  vitamine_b12_ug: 'Vit. B12',
  vitamine_k_ug: 'Vit. K',
  potassium_mg: 'Potassium',
  sodium_mg: 'Sodium',
  phosphore_mg: 'Phosphore',
}

function microUnit(key) {
  if (key.endsWith('_mg')) return 'mg'
  if (key.endsWith('_ug')) return 'µg'
  return ''
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function LinkBadge({ status, canonicalId, archetypeId }) {
  const isLinked = status === 'stock' || status === 'canonical' || status === 'archetype'
  const isUnmatched = !isLinked || (!canonicalId && !archetypeId)
  if (isUnmatched) {
    return <span className="gr-link-badge unmatched" title="Cet ingrédient n'est pas lié au garde-manger">non lié ⚠</span>
  }
  return <span className="gr-link-badge linked" title={`Lié (${status})`}>lié ✓</span>
}

function IngredientSearchDropdown({ ingredientId, onLinked, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [linking, setLinking] = useState(false)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.trim().length < 2) { setResults([]); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await authFetch(`/api/ingredients/search?q=${encodeURIComponent(query.trim())}&limit=8`)
        const data = await res.json().catch(() => ({}))
        setResults(res.ok ? (data.results || []) : [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timerRef.current)
  }, [query])

  async function selectResult(result) {
    setLinking(true)
    try {
      const body = {
        generated_recipe_ingredient_id: ingredientId,
        ...(result.canonical_food_id ? { canonical_food_id: result.canonical_food_id } : {}),
        ...(result.archetype_id ? { archetype_id: result.archetype_id } : {}),
      }
      const res = await authFetch('/api/ingredients/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur de liaison')
      onLinked(data)
    } catch {
      // silently ignore — user can retry
    } finally {
      setLinking(false)
    }
  }

  async function markNonStockable() {
    setLinking(true)
    try {
      const res = await authFetch('/api/ingredients/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated_recipe_ingredient_id: ingredientId, none: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur')
      onLinked(data)
    } catch {
      // silently ignore
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="gr-link-panel">
      <div className="gr-link-search-row">
        <input
          ref={inputRef}
          className="gr-link-input"
          type="text"
          placeholder="Rechercher un ingrédient…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={linking}
          aria-label="Rechercher un ingrédient à lier"
          autoComplete="off"
        />
        {loading && <span className="gr-link-spinner" aria-hidden="true" />}
        <button
          type="button"
          className="gr-link-cancel"
          onClick={onClose}
          aria-label="Annuler la correction"
          disabled={linking}
        >
          ✕
        </button>
      </div>

      {results.length > 0 && (
        <ul className="gr-link-results" role="listbox" aria-label="Résultats">
          {results.map((r, i) => (
            <li key={i} role="option">
              <button
                type="button"
                className="gr-link-result-btn"
                onClick={() => selectResult(r)}
                disabled={linking}
              >
                <span className="gr-link-result-name">{r.name}</span>
                <span className="gr-link-result-type">{r.type === 'canonical' ? 'Canonique' : 'Archétype'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="gr-link-nonstockable"
        onClick={markNonStockable}
        disabled={linking}
      >
        {linking ? 'En cours…' : 'Non stockable (ignorer)'}
      </button>
    </div>
  )
}

// ── Bloc qualité nutrition ────────────────────────────────────────────────────

function NutritionVerificationBadge({ verification }) {
  if (!verification) return null
  const { status, coverage_pct, issues = [], missing = [] } = verification

  let chipClass = 'gr-verif-chip'
  let label = ''
  if (status === 'ok') {
    chipClass += ' ok'
    label = '✓ Nutrition vérifiée CIQUAL'
    if (coverage_pct != null) label += ` · ${Math.round(coverage_pct)} %`
  } else if (status === 'warning') {
    chipClass += ' warning'
    label = '⚠ Nutrition à vérifier'
  } else {
    chipClass += ' error'
    label = 'Nutrition indisponible'
  }

  const hasIssues = (status === 'warning' || status === 'error') && issues.length > 0
  const hasMissing = missing.length > 0

  return (
    <div className="gr-verif-wrap">
      <span className={chipClass}>{label}</span>
      {hasIssues && (
        <ul className="gr-verif-issues">
          {issues.map((iss, i) => (
            <li key={i} className={`gr-verif-issue ${iss.level}`}>{iss.detail}</li>
          ))}
        </ul>
      )}
      {hasMissing && (
        <p className="gr-verif-missing">
          Sans données CIQUAL : {missing.join(', ')}
        </p>
      )}
    </div>
  )
}

// ── Bloc micronutriments ──────────────────────────────────────────────────────

function MicronutrientsBlock({ micronutrients }) {
  if (!micronutrients) return null

  // Conserver l'ordre de MICRO_AJR, ne garder que les clés avec AJR et valeur > 0
  const entries = Object.keys(MICRO_AJR)
    .filter(key => {
      const val = micronutrients[key]
      return typeof val === 'number' && val > 0
    })
    .map(key => ({
      key,
      label: MICRO_LABELS[key] || key,
      value: micronutrients[key],
      unit: microUnit(key),
      ajr: MICRO_AJR[key],
      pct: Math.round((micronutrients[key] / MICRO_AJR[key]) * 100),
    }))

  if (entries.length === 0) return null

  return (
    <div className="gr-micro-block">
      <h3 className="gr-micro-title">Micronutriments par portion</h3>
      <ul className="gr-micro-grid">
        {entries.map(({ key, label, value, unit, pct }) => (
          <li key={key} className="gr-micro-item">
            <span className="gr-micro-label">{label}</span>
            <span className="gr-micro-val">
              {value % 1 === 0 ? value : value.toFixed(1)}{unit}
            </span>
            <span className="gr-micro-pct">{pct} %</span>
          </li>
        ))}
      </ul>
      <p className="gr-micro-note">% des apports journaliers recommandés (AJR)</p>
    </div>
  )
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function GeneratedRecipeDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ingredients')
  const [checkedSteps, setCheckedSteps] = useState(new Set())
  const [linkedIngredients, setLinkedIngredients] = useState(null)
  const [showCook, setShowCook] = useState(false)

  // ── État pour la correction des liens
  const [openLinkId, setOpenLinkId] = useState(null)   // id de l'ingrédient dont le panneau est ouvert
  const [repairing, setRepairing] = useState(false)
  const [repairDone, setRepairDone] = useState(false)

  const fetchLinkedIngredients = useCallback(async () => {
    try {
      const res = await authFetch(`/api/recipes/generated/${id}/available-ingredients`)
      const data = await res.json()
      if (Array.isArray(data.ingredients) && data.ingredients.length) {
        setLinkedIngredients(data.ingredients)
      }
      if (data.nutrition_per_serving) {
        setRecipe(prev => ({ ...prev, nutrition_per_serving: data.nutrition_per_serving }))
      }
    } catch { /* affichage brut en repli */ }
  }, [id])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data, error } = await supabase
        .from('generated_recipes')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        router.push('/recipes')
        return
      }

      setRecipe(data)
      setLoading(false)

      // Ingrédients liés au stock (best-effort, peut être vide si pas encore lié)
      await fetchLinkedIngredients()
    }
    load()
  }, [id, router, fetchLinkedIngredients])

  // ── Callback après liaison d'un ingrédient individuel
  function handleLinked(ingId, linkResponse) {
    const { ingredient, nutrition } = linkResponse
    setLinkedIngredients(prev =>
      (prev || []).map(ing =>
        ing.id === ingId
          ? {
              ...ing,
              match_status: ingredient.match_status,
              canonical_food_id: ingredient.canonical_food_id ?? null,
              archetype_id: ingredient.archetype_id ?? null,
              name: ingredient.raw_name || ing.name,
            }
          : ing
      )
    )
    if (nutrition) {
      setRecipe(prev => ({ ...prev, nutrition_per_serving: nutrition }))
    }
    setOpenLinkId(null)
  }

  // ── Réparer tous les liens
  async function repairAllLinks() {
    if (repairing) return
    setRepairing(true)
    setRepairDone(false)
    try {
      const res = await authFetch('/api/recipes/link-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_id: id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur')

      // Rafraîchir la liste des ingrédients liés
      await fetchLinkedIngredients()

      // Recharger la nutrition recalculée côté serveur (la route renvoie un
      // compteur { updated, failed }, pas les macros — on relit la recette).
      const { data: fresh } = await supabase
        .from('generated_recipes')
        .select('nutrition_per_serving')
        .eq('id', id)
        .single()
      if (fresh?.nutrition_per_serving) {
        setRecipe(prev => ({ ...prev, nutrition_per_serving: fresh.nutrition_per_serving }))
      }
      setRepairDone(true)
    } catch {
      // ignorer silencieusement pour l'instant
    } finally {
      setRepairing(false)
    }
  }

  if (loading) {
    return (
      <div className="v21-page narrow gr-page">
        <div className="v21-skel" style={{ height: 24, width: 90 }} />
        <div className="v21-skel" style={{ height: 56, width: '70%', marginTop: 22 }} />
        <div className="v21-skel" style={{ height: 3, width: 92, marginTop: 22 }} />
        <div className="v21-skel" style={{ height: 220, marginTop: 24 }} />
        <div className="v21-skel" style={{ height: 240, marginTop: 24 }} />
      </div>
    )
  }

  if (!recipe) return null

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const steps = Array.isArray(recipe.steps) ? recipe.steps : []
  const nutrition = recipe.nutrition_per_serving || {}
  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0)
  const hasImage = !!recipe.image_url

  const metaParts = []
  if (recipe.prep_min > 0) metaParts.push(`Prépa ${recipe.prep_min} min`)
  if (recipe.cook_min > 0) metaParts.push(`Cuisson ${recipe.cook_min} min`)
  if (totalTime > 0) metaParts.push(`Total ${totalTime} min`)
  if (recipe.servings) metaParts.push(`${recipe.servings} pers.`)

  function toggleStep(idx) {
    setCheckedSteps(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  // Compte les ingrédients non liés pour afficher le bouton Réparer de façon pertinente
  const unmatchedCount = linkedIngredients
    ? linkedIngredients.filter(ing => {
        const isLinked = ing.match_status === 'stock' || ing.match_status === 'canonical' || ing.match_status === 'archetype'
        return !isLinked || (!ing.canonical_food_id && !ing.archetype_id)
      }).length
    : 0

  return (
    <div className="v21-page narrow gr-page">
      <button className="v21-link gr-back" onClick={() => router.push('/recipes')}>← Recettes</button>

      <header className="gr-head">
        <span className="v21-eyebrow">Recette</span>
        <h1 className="v21-title gr-title">{recipe.title}</h1>
        <div className="v21-rule" />
        {recipe.description && <p className="v21-lede gr-desc">{recipe.description}</p>}
        {metaParts.length > 0 && <p className="gr-meta-line">{metaParts.join('  ·  ')}</p>}
      </header>

      {hasImage && (
        <div className="gr-figure">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={recipe.image_url} alt={recipe.title} />
        </div>
      )}

      {Object.keys(nutrition).length > 0 && (
        <div className="gr-nutrition">
          {nutrition.kcal != null && <div className="gr-nut-item"><span className="gr-nut-val">{nutrition.kcal}</span><span className="gr-nut-label">kcal</span></div>}
          {nutrition.protein_g != null && <div className="gr-nut-item"><span className="gr-nut-val">{nutrition.protein_g}g</span><span className="gr-nut-label">Protéines</span></div>}
          {nutrition.carbs_g != null && <div className="gr-nut-item"><span className="gr-nut-val">{nutrition.carbs_g}g</span><span className="gr-nut-label">Glucides</span></div>}
          {nutrition.fat_g != null && <div className="gr-nut-item"><span className="gr-nut-val">{nutrition.fat_g}g</span><span className="gr-nut-label">Lipides</span></div>}
          {nutrition.fiber_g != null && <div className="gr-nut-item"><span className="gr-nut-val">{nutrition.fiber_g}g</span><span className="gr-nut-label">Fibres</span></div>}
        </div>
      )}

      <NutritionVerificationBadge verification={nutrition.verification} />

      <MicronutrientsBlock micronutrients={nutrition.micronutrients} />

      <button className="v21-btn terra gr-cook-btn" onClick={() => setShowCook(true)}>
        Cuisiner — déduire du garde-manger
      </button>

      <div className="v21-tabs gr-tabs">
        <button className={`v21-tab${activeTab === 'ingredients' ? ' on' : ''}`} onClick={() => setActiveTab('ingredients')}>
          Ingrédients ({ingredients.length})
        </button>
        <button className={`v21-tab${activeTab === 'steps' ? ' on' : ''}`} onClick={() => setActiveTab('steps')}>
          Étapes ({steps.length})
        </button>
      </div>

      {activeTab === 'ingredients' && (
        <div className="gr-section">
          {/* ── Bouton global Réparer les liens ── */}
          {linkedIngredients && (
            <div className="gr-repair-bar">
              <button
                type="button"
                className="gr-repair-btn"
                onClick={repairAllLinks}
                disabled={repairing}
                aria-label="Réparer tous les liens ingrédients"
              >
                {repairing
                  ? 'Réparation…'
                  : repairDone
                    ? 'Liens à jour ✓'
                    : unmatchedCount > 0
                      ? `Réparer les liens (${unmatchedCount} non lié${unmatchedCount > 1 ? 's' : ''})`
                      : 'Réparer les liens'}
              </button>
            </div>
          )}

          {linkedIngredients ? (
            <ul className="gr-ing-list">
              {linkedIngredients.map((ing) => {
                const inStock = ing.available_lots?.length > 0
                const isLinked = ing.match_status === 'stock' || ing.match_status === 'canonical' || ing.match_status === 'archetype'
                const hasIds = !!(ing.canonical_food_id || ing.archetype_id)
                const showLinkPanel = openLinkId === ing.id

                return (
                  <li key={ing.id} className={`gr-ing-item${!isLinked || !hasIds ? ' gr-ing-unmatched' : ''}`}>
                    <span className="gr-ing-qty">
                      {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                    </span>
                    <span className="gr-ing-name">{ing.name}</span>

                    {/* Badge statut lien */}
                    <LinkBadge
                      status={ing.match_status}
                      canonicalId={ing.canonical_food_id}
                      archetypeId={ing.archetype_id}
                    />

                    {/* Badge stock (séparé du badge lien) */}
                    <span
                      className={`gr-ing-stock${inStock ? ' in' : ' out'}`}
                      title={inStock
                        ? `En stock : ${ing.available_lots[0].product_name || ''} (${ing.available_lots[0].quantity_available} ${ing.available_lots[0].unit})`
                        : 'Pas dans le garde-manger'}
                    >
                      {inStock ? '✓ En stock' : 'À acheter'}
                    </span>

                    {/* Bouton Corriger (toujours présent, discret) */}
                    {!showLinkPanel && (
                      <button
                        type="button"
                        className="gr-ing-fix-btn"
                        onClick={() => setOpenLinkId(showLinkPanel ? null : ing.id)}
                        aria-label={`Corriger le lien de ${ing.name}`}
                        aria-expanded={showLinkPanel}
                      >
                        Corriger
                      </button>
                    )}

                    {/* Panneau de recherche inline */}
                    {showLinkPanel && (
                      <IngredientSearchDropdown
                        ingredientId={ing.id}
                        onLinked={(data) => handleLinked(ing.id, data)}
                        onClose={() => setOpenLinkId(null)}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          ) : ingredients.length === 0 ? (
            <p className="gr-empty">Pas d'ingrédients disponibles</p>
          ) : (
            <ul className="gr-ing-list">
              {ingredients.map((ing, i) => (
                <li key={i} className="gr-ing-item">
                  <span className="gr-ing-qty">
                    {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                  </span>
                  <span className="gr-ing-name">{ing.name}</span>
                  {ing.notes && <span className="gr-ing-notes">{ing.notes}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'steps' && (
        <div className="gr-section">
          {steps.length === 0 ? (
            <p className="gr-empty">Pas d'étapes disponibles</p>
          ) : (
            <ol className="gr-step-list">
              {steps.map((step, i) => (
                <li
                  key={i}
                  className={`gr-step-item${checkedSteps.has(i) ? ' done' : ''}`}
                  onClick={() => toggleStep(i)}
                >
                  <div className="gr-step-num">{step.step_no || i + 1}</div>
                  <div className="gr-step-body">
                    <p className="gr-step-text">{step.instruction}</p>
                    {step.duration_min && (
                      <span className="gr-step-dur">⏱ {step.duration_min} min</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {recipe.chef_tips && (
        <div className="gr-tips">
          <span className="v21-bl">Astuces du chef</span>
          <p>{recipe.chef_tips}</p>
        </div>
      )}

      <CookWizard
        open={showCook}
        onClose={() => setShowCook(false)}
        recipe={{ id: recipe.id, name: recipe.title, servings: recipe.servings }}
        apiBase={`/api/recipes/generated/${recipe.id}`}
        mealRecipeId={null}
        onComplete={() => setShowCook(false)}
      />
    </div>
  )
}
