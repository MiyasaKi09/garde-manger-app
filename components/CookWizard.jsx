'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import Modal from '@/components/ui/Modal'
import GlassCard from '@/components/ui/GlassCard'
import { ChefHat, Check, Minus, Plus, Users } from 'lucide-react'

const PEOPLE = ['Julien', 'Zoé']
const MEAL_TYPES = [
  { id: 'pdj', label: 'Petit-déj' },
  { id: 'dejeuner', label: 'Déjeuner' },
  { id: 'diner', label: 'Dîner' },
  { id: 'collation', label: 'Collation' },
]
const STORAGE_METHODS = [
  { id: 'fridge', label: 'Frigo', icon: '🧊' },
  { id: 'freezer', label: 'Congélateur', icon: '❄️' },
  { id: 'counter', label: 'Comptoir', icon: '🍽️' },
]

/**
 * CookWizard — 4-step modal for cooking a recipe.
 * Step 1: Portions + who eats + storage
 * Step 2: Ingredients — match inventory lots
 * Step 3: Confirm deductions
 * Step 4: Done — log who ate what
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {object} props.recipe - { id, name, servings }
 * @param {function} props.onComplete - Called after successful cook
 */
export default function CookWizard({ open, onClose, recipe, onComplete }) {
  const [step, setStep] = useState(1)
  const [portions, setPortions] = useState(recipe?.servings || 2)
  const [storageMethod, setStorageMethod] = useState('fridge')
  const [mealType, setMealType] = useState('diner')
  const [eaters, setEaters] = useState(
    PEOPLE.reduce((acc, p) => ({ ...acc, [p]: { enabled: true, portions: 1 } }), {})
  )
  const [ingredients, setIngredients] = useState([])
  const [matchedLots, setMatchedLots] = useState({})
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  const [cooking, setCooking] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Load recipe ingredients when opening
  useEffect(() => {
    if (open && recipe?.id) {
      loadIngredients()
    }
  }, [open, recipe?.id])

  async function loadIngredients() {
    setLoadingIngredients(true)
    try {
      const res = await authFetch(`/api/recipes/${recipe.id}/available-ingredients`)
      const data = await res.json()
      if (data.ingredients) {
        setIngredients(data.ingredients)
        // Auto-match lots (FEFO — first expiring first out)
        const matched = {}
        for (const ing of data.ingredients) {
          if (ing.available_lots?.length > 0) {
            const lot = ing.available_lots[0] // Already sorted by expiry
            matched[ing.id] = {
              lot_id: lot.id,
              quantity_used: ing.quantity || 0,
              unit: ing.unit || lot.unit,
              product_name: ing.name,
            }
          }
        }
        setMatchedLots(matched)
      }
    } catch (err) {
      console.error('Error loading ingredients:', err)
    } finally {
      setLoadingIngredients(false)
    }
  }

  async function handleCook() {
    setCooking(true)
    setError(null)
    try {
      // Build ingredients list for API
      const ingredientsPayload = Object.values(matchedLots).filter(m => m.lot_id && m.quantity_used > 0)

      const res = await authFetch(`/api/recipes/${recipe.id}/cook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portions,
          storageMethod,
          notes: null,
          ingredients: ingredientsPayload,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur cuisine')

      setResult(data)
      setStep(4)
    } catch (err) {
      setError(err.message)
    } finally {
      setCooking(false)
    }
  }

  async function handleLogMeals() {
    // Log meal for each enabled eater
    const enabledEaters = Object.entries(eaters).filter(([_, e]) => e.enabled)
    const today = new Date().toISOString().split('T')[0]

    for (const [name, config] of enabledEaters) {
      // Calculate per-person nutrition based on portions ratio
      const ratio = config.portions / portions
      const nutrition = result?.dish ? {
        kcal: null, // Will be calculated from recipe_nutrition_cache
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        fiber_g: null,
      } : {}

      try {
        await authFetch('/api/nutrition/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            person_name: name,
            meal_date: today,
            meal_type: mealType,
            cooked_dish_id: result?.dish?.id || null,
            recipe_id: recipe.id,
            description: recipe.name,
            portions_eaten: config.portions,
            ...nutrition,
          }),
        })
      } catch (err) {
        console.error(`Error logging meal for ${name}:`, err)
      }
    }

    onComplete?.(result)
    onClose()
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={recipe?.name || 'Cuisiner'} width={480}>
      {/* Step indicator */}
      <div style={styles.steps}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{
            ...styles.stepDot,
            background: s <= step ? '#16a34a' : 'rgba(0,0,0,0.08)',
            color: s <= step ? 'white' : '#9ca3af',
          }}>
            {s < step ? <Check size={12} /> : s}
          </div>
        ))}
      </div>

      {/* Step 1: Portions */}
      {step === 1 && (
        <div>
          <h4 style={styles.stepTitle}>Combien de portions ?</h4>

          <div style={styles.portionControl}>
            <button onClick={() => setPortions(Math.max(1, portions - 1))} style={styles.pmBtn}><Minus size={16} /></button>
            <span style={styles.portionNum}>{portions}</span>
            <button onClick={() => setPortions(portions + 1)} style={styles.pmBtn}><Plus size={16} /></button>
          </div>

          <h4 style={styles.stepTitle}>Qui mange ?</h4>
          {PEOPLE.map(name => (
            <GlassCard key={name} padding={12} radius={10} style={{ marginBottom: 8 }}>
              <div style={styles.eaterRow}>
                <button
                  onClick={() => setEaters(prev => ({
                    ...prev,
                    [name]: { ...prev[name], enabled: !prev[name].enabled }
                  }))}
                  style={{
                    ...styles.checkbox,
                    background: eaters[name].enabled ? '#16a34a' : 'transparent',
                    borderColor: eaters[name].enabled ? '#16a34a' : '#d1d5db',
                  }}
                >
                  {eaters[name].enabled && <Check size={12} color="white" />}
                </button>
                <span style={{ flex: 1, fontWeight: 500 }}>{name}</span>
                {eaters[name].enabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => setEaters(prev => ({
                      ...prev,
                      [name]: { ...prev[name], portions: Math.max(0.5, prev[name].portions - 0.5) }
                    }))} style={styles.pmBtnSm}><Minus size={12} /></button>
                    <span style={{ fontSize: 14, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>
                      {eaters[name].portions}
                    </span>
                    <button onClick={() => setEaters(prev => ({
                      ...prev,
                      [name]: { ...prev[name], portions: prev[name].portions + 0.5 }
                    }))} style={styles.pmBtnSm}><Plus size={12} /></button>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>part{eaters[name].portions > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}

          <h4 style={styles.stepTitle}>Type de repas</h4>
          <div style={styles.chipRow}>
            {MEAL_TYPES.map(mt => (
              <button
                key={mt.id}
                onClick={() => setMealType(mt.id)}
                style={{
                  ...styles.chip,
                  ...(mealType === mt.id ? styles.chipActive : {}),
                }}
              >
                {mt.label}
              </button>
            ))}
          </div>

          <h4 style={styles.stepTitle}>Stockage des restes</h4>
          <div style={styles.chipRow}>
            {STORAGE_METHODS.map(sm => (
              <button
                key={sm.id}
                onClick={() => setStorageMethod(sm.id)}
                style={{
                  ...styles.chip,
                  ...(storageMethod === sm.id ? styles.chipActive : {}),
                }}
              >
                {sm.icon} {sm.label}
              </button>
            ))}
          </div>

          <button onClick={() => setStep(2)} style={styles.nextBtn}>
            Suivant — Ingrédients
          </button>
        </div>
      )}

      {/* Step 2: Ingredients */}
      {step === 2 && (
        <div>
          <h4 style={styles.stepTitle}>Ingrédients utilisés</h4>
          {loadingIngredients ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>Chargement...</p>
          ) : ingredients.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>
              Aucun ingrédient trouvé pour cette recette.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ingredients.map(ing => {
                const match = matchedLots[ing.id]
                const hasLot = match?.lot_id
                return (
                  <GlassCard key={ing.id} padding={10} radius={10}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{ing.name}</span>
                        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                          {ing.quantity} {ing.unit}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: hasLot ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.1)',
                        color: hasLot ? '#16a34a' : '#f59e0b',
                      }}>
                        {hasLot ? 'En stock' : 'Manquant'}
                      </span>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          )}

          <div style={styles.navRow}>
            <button onClick={() => setStep(1)} style={styles.backBtn}>Retour</button>
            <button onClick={() => setStep(3)} style={styles.nextBtn}>Confirmer</button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div>
          <h4 style={styles.stepTitle}>Résumé</h4>
          <GlassCard padding={16} radius={12} style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>
              <ChefHat size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {recipe?.name}
            </p>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6b7280' }}>
              {portions} portion{portions > 1 ? 's' : ''} — stockage {storageMethod === 'fridge' ? 'frigo' : storageMethod === 'freezer' ? 'congélateur' : 'comptoir'}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              <Users size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {Object.entries(eaters).filter(([_, e]) => e.enabled).map(([name, e]) => `${name} (${e.portions})`).join(', ')}
            </p>
          </GlassCard>

          {Object.values(matchedLots).filter(m => m.lot_id).length > 0 && (
            <>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                Sera déduit de l'inventaire :
              </p>
              {Object.values(matchedLots).filter(m => m.lot_id && m.quantity_used > 0).map((m, i) => (
                <p key={i} style={{ fontSize: 13, margin: '2px 0', paddingLeft: 12 }}>
                  - {m.product_name}: {m.quantity_used} {m.unit}
                </p>
              ))}
            </>
          )}

          {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{error}</p>}

          <div style={styles.navRow}>
            <button onClick={() => setStep(2)} style={styles.backBtn}>Retour</button>
            <button onClick={handleCook} disabled={cooking} style={{
              ...styles.cookBtn,
              opacity: cooking ? 0.6 : 1,
            }}>
              {cooking ? 'Cuisson...' : 'Cuisiner !'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🍳</div>
          <h4 style={{ fontSize: 18, fontWeight: 600, color: '#16a34a', marginBottom: 8 }}>
            Bon appétit !
          </h4>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
            {result?.message || `${recipe?.name} est prêt.`}
          </p>

          <button onClick={handleLogMeals} style={styles.cookBtn}>
            Enregistrer les repas
          </button>
          <button onClick={onClose} style={{ ...styles.backBtn, marginTop: 8, width: '100%' }}>
            Fermer sans enregistrer
          </button>
        </div>
      )}
    </Modal>
  )
}

const styles = {
  steps: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    margin: '16px 0 8px',
  },
  portionControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '12px 0',
  },
  portionNum: {
    fontSize: 28,
    fontWeight: 700,
    color: '#16a34a',
    minWidth: 40,
    textAlign: 'center',
  },
  pmBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#374151',
  },
  pmBtnSm: {
    width: 24,
    height: 24,
    borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#374151',
    padding: 0,
  },
  eaterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    padding: '6px 12px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: '#374151',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: 'rgba(22,163,74,0.1)',
    borderColor: '#16a34a',
    color: '#16a34a',
    fontWeight: 600,
  },
  navRow: {
    display: 'flex',
    gap: 8,
    marginTop: 20,
  },
  nextBtn: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: 10,
    background: '#16a34a',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  backBtn: {
    padding: '12px 16px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 10,
    background: 'transparent',
    color: '#6b7280',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cookBtn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #16a34a, #059669)',
    color: 'white',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
  },
}
