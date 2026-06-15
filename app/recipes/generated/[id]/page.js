'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import CookWizard from '@/components/CookWizard'
import StockBadge from '@/components/StockBadge'
import './generated-recipe.css'

export default function GeneratedRecipeDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ingredients')
  const [checkedSteps, setCheckedSteps] = useState(new Set())
  const [linkedIngredients, setLinkedIngredients] = useState(null) // ingrédients liés + stock
  const [stockLoading, setStockLoading] = useState(false)
  const [showCook, setShowCook] = useState(false)

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
      setStockLoading(true)
      try {
        const res = await authFetch(`/api/recipes/generated/${id}/available-ingredients`)
        const json = await res.json()
        if (Array.isArray(json.ingredients) && json.ingredients.length) {
          setLinkedIngredients(json.ingredients)
        }
      } catch { /* affichage brut en repli */ }
      finally { setStockLoading(false) }
    }
    load()
  }, [id, router])

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
          {linkedIngredients ? (
            <ul className="gr-ing-list">
              {linkedIngredients.map((ing) => {
                const inStock = ing.available_lots?.length > 0
                const hasEnough = ing.has_enough === true
                const stockTitle = hasEnough
                  ? `En stock${ing.available_lots[0]?.product_name ? ` : ${ing.available_lots[0].product_name}` : ''}`
                  : inStock
                    ? `Stock insuffisant (disponible : ${ing.available_lots[0]?.quantity_available ?? '?'} ${ing.available_lots[0]?.unit ?? ''})`
                    : 'À acheter — absent du garde-manger'
                return (
                  <li key={ing.id} className="gr-ing-item">
                    <span className="gr-ing-qty">
                      {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                    </span>
                    <span className="gr-ing-name">{ing.name}</span>
                    <StockBadge
                      inStock={inStock}
                      hasEnough={hasEnough}
                      title={stockTitle}
                      variant="chip"
                    />
                  </li>
                )
              })}
            </ul>
          ) : stockLoading ? (
            <ul className="gr-ing-list">
              {ingredients.map((ing, i) => (
                <li key={i} className="gr-ing-item">
                  <span className="gr-ing-qty">
                    {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                  </span>
                  <span className="gr-ing-name">{ing.name}</span>
                  <StockBadge loading={true} inStock={false} hasEnough={false} variant="chip" />
                </li>
              ))}
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
