'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { getRecipeStyle } from '@/lib/foodEmoji'
import CookWizard from '@/components/CookWizard'
import './generated-recipe.css'

export default function GeneratedRecipeDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ingredients')
  const [checkedSteps, setCheckedSteps] = useState(new Set())
  const [linkedIngredients, setLinkedIngredients] = useState(null) // ingrédients liés + stock
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
      try {
        const res = await authFetch(`/api/recipes/generated/${id}/available-ingredients`)
        const json = await res.json()
        if (Array.isArray(json.ingredients) && json.ingredients.length) {
          setLinkedIngredients(json.ingredients)
        }
      } catch { /* affichage brut en repli */ }
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <>
        <div className="myko-canvas" aria-hidden="true" />
        <div className="gr-page">
          <div className="gr-loading">Chargement...</div>
        </div>
      </>
    )
  }

  if (!recipe) return null

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const steps = Array.isArray(recipe.steps) ? recipe.steps : []
  const nutrition = recipe.nutrition_per_serving || {}
  const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0)
  const style = getRecipeStyle(null, recipe.title)
  const hasImage = !!recipe.image_url

  function toggleStep(idx) {
    setCheckedSteps(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  return (
    <>
      <div className="myko-canvas" aria-hidden="true" />
      <div className="gr-page">
        <button className="gr-back" onClick={() => router.push('/recipes')}>← Retour</button>

        <div className="gr-hero" style={hasImage ? undefined : {
          background: `linear-gradient(135deg, ${style.bg} 0%, ${style.bgEnd} 100%)`
        }}>
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.image_url} alt={recipe.title} className="gr-hero-img" />
          ) : (
            <span className="gr-hero-emoji">{style.emoji}</span>
          )}
          <div className="gr-hero-overlay">
            <h1 className="gr-title">{recipe.title}</h1>
            {recipe.description && <p className="gr-desc">{recipe.description}</p>}
          </div>
        </div>

        <div className="gr-meta-row">
          {recipe.prep_min > 0 && (
            <div className="gr-meta-chip">
              <span className="gr-meta-icon">🔪</span>
              <span>Prépa {recipe.prep_min}min</span>
            </div>
          )}
          {recipe.cook_min > 0 && (
            <div className="gr-meta-chip">
              <span className="gr-meta-icon">🔥</span>
              <span>Cuisson {recipe.cook_min}min</span>
            </div>
          )}
          {totalTime > 0 && (
            <div className="gr-meta-chip">
              <span className="gr-meta-icon">⏱</span>
              <span>Total {totalTime}min</span>
            </div>
          )}
          {recipe.servings && (
            <div className="gr-meta-chip">
              <span className="gr-meta-icon">👥</span>
              <span>{recipe.servings} pers.</span>
            </div>
          )}
        </div>

        {Object.keys(nutrition).length > 0 && (
          <div className="gr-nutrition-bar">
            {nutrition.kcal != null && <div className="gr-nut-item"><span className="gr-nut-val">{nutrition.kcal}</span><span className="gr-nut-label">kcal</span></div>}
            {nutrition.protein_g != null && <div className="gr-nut-item"><span className="gr-nut-val">{nutrition.protein_g}g</span><span className="gr-nut-label">Protéines</span></div>}
            {nutrition.carbs_g != null && <div className="gr-nut-item"><span className="gr-nut-val">{nutrition.carbs_g}g</span><span className="gr-nut-label">Glucides</span></div>}
            {nutrition.fat_g != null && <div className="gr-nut-item"><span className="gr-nut-val">{nutrition.fat_g}g</span><span className="gr-nut-label">Lipides</span></div>}
            {nutrition.fiber_g != null && <div className="gr-nut-item"><span className="gr-nut-val">{nutrition.fiber_g}g</span><span className="gr-nut-label">Fibres</span></div>}
          </div>
        )}

        <button className="gr-cook-btn" onClick={() => setShowCook(true)}>
          👨‍🍳 Cuisiner — déduire du garde-manger
        </button>

        <div className="gr-tabs">
          <button className={`gr-tab${activeTab === 'ingredients' ? ' active' : ''}`} onClick={() => setActiveTab('ingredients')}>
            Ingrédients ({ingredients.length})
          </button>
          <button className={`gr-tab${activeTab === 'steps' ? ' active' : ''}`} onClick={() => setActiveTab('steps')}>
            Étapes ({steps.length})
          </button>
        </div>

        {activeTab === 'ingredients' && (
          <div className="gr-section">
            {linkedIngredients ? (
              <ul className="gr-ing-list">
                {linkedIngredients.map((ing) => {
                  const inStock = ing.available_lots?.length > 0
                  return (
                    <li key={ing.id} className="gr-ing-item">
                      <span className="gr-ing-qty">
                        {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                      </span>
                      <span className="gr-ing-name">{ing.name}</span>
                      <span
                        className="gr-ing-stock"
                        title={inStock
                          ? `En stock : ${ing.available_lots[0].product_name || ''} (${ing.available_lots[0].quantity_available} ${ing.available_lots[0].unit})`
                          : 'Pas dans le garde-manger'}
                        style={{
                          marginLeft: 'auto',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: inStock ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)',
                          color: inStock ? '#16a34a' : '#d97706',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {inStock ? '✓ En stock' : 'À acheter'}
                      </span>
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
                        <span className="gr-step-dur">⏱ {step.duration_min}min</span>
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
            <h3 className="gr-tips-title">💡 Astuces du chef</h3>
            <p>{recipe.chef_tips}</p>
          </div>
        )}
      </div>

      <CookWizard
        open={showCook}
        onClose={() => setShowCook(false)}
        recipe={{ id: recipe.id, name: recipe.title, servings: recipe.servings }}
        apiBase={`/api/recipes/generated/${recipe.id}`}
        mealRecipeId={null}
        onComplete={() => setShowCook(false)}
      />
    </>
  )
}
