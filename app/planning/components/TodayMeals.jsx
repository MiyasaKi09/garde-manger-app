'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/authFetch'
import CookMode from '@/components/CookMode'
import { Loader2, ChefHat, RefreshCw, X, Check } from 'lucide-react'

/**
 * Extrait le nom du plat à partir des descriptions de plusieurs personnes.
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
  return prefix.trim() || first.substring(0, 40).trim()
}

const MEAL_LABELS = {
  pdj: 'Petit-déj',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}
const MEAL_ORDER = ['pdj', 'dejeuner', 'diner', 'collation']

/**
 * Affiche les repas d'aujourd'hui et demain.
 * Clic sur un repas → modal choix : Cuisiner ou Changer.
 */
export default function TodayMeals({ importId }) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)

  // Cook mode
  const [cookModeOpen, setCookModeOpen] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState(null)
  const [cachedRecipeId, setCachedRecipeId] = useState(null)
  const [generatingRecipe, setGeneratingRecipe] = useState(false)

  // Choice modal
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [showChoice, setShowChoice] = useState(false)

  // Swap mode
  const [swapMode, setSwapMode] = useState(false)
  const [swapPreference, setSwapPreference] = useState('')
  const [swapping, setSwapping] = useState(false)
  const [swapResult, setSwapResult] = useState(null)
  const [swapError, setSwapError] = useState('')
  const [swapSuccess, setSwapSuccess] = useState(false)

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  useEffect(() => {
    if (!importId) { setLoading(false); return }
    loadMeals()
  }, [importId])

  async function loadMeals() {
    try {
      const res = await authFetch(`/api/planning/imports/${importId}`)
      const data = await res.json()
      if (data.meals) {
        const filtered = data.meals.filter(m =>
          m.meal_date === todayStr || m.meal_date === tomorrowStr
        )
        setMeals(filtered)
      }
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
    setSwapResult(null)
    setSwapError('')
    setSwapPreference('')
    setSwapSuccess(false)
  }

  function closeModal() {
    setShowChoice(false)
    setSelectedMeal(null)
    setSwapMode(false)
    setSwapResult(null)
    setSwapError('')
    setSwapPreference('')
  }

  // ── COOK FLOW ──
  async function handleCook() {
    if (!selectedMeal || generatingRecipe) return
    setGeneratingRecipe(true)
    setShowChoice(false)

    try {
      const res = await authFetch('/api/ai/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: selectedMeal.dishName,
          persons: ['Julien', 'Zoé'],
          servings: 2,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedRecipe(data.recipe)
      setCachedRecipeId(data.recipeDbId || null)
      setCookModeOpen(true)
    } catch (err) {
      console.error('Error generating recipe:', err)
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

  // ── SWAP FLOW ──
  async function handleSwap() {
    if (!selectedMeal || swapping) return
    setSwapping(true)
    setSwapError('')
    setSwapResult(null)

    try {
      const res = await authFetch('/api/ai/plan/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importId,
          mealDate: selectedMeal.entries[0].meal_date,
          mealType: selectedMeal.type,
          currentDescription: selectedMeal.dishName,
          preference: swapPreference || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur swap')
      setSwapResult(data.replacement)
    } catch (err) {
      setSwapError(err.message)
    } finally {
      setSwapping(false)
    }
  }

  async function confirmSwap() {
    // The swap is already saved by the API — just close and reload
    setSwapSuccess(true)
    setTimeout(() => {
      closeModal()
      loadMeals()
    }, 600)
  }

  if (loading) return <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>...</p>
  if (!importId || meals.length === 0) return null

  // Group: today then tomorrow
  const groups = [
    { date: todayStr, label: "Aujourd'hui", meals: meals.filter(m => m.meal_date === todayStr) },
    { date: tomorrowStr, label: 'Demain', meals: meals.filter(m => m.meal_date === tomorrowStr) },
  ].filter(g => g.meals.length > 0)

  return (
    <>
      <div style={S.container}>
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

          const now = new Date()
          const h = now.getHours()
          const nextType = group.date === todayStr
            ? (h < 10 ? 'pdj' : h < 14 ? 'dejeuner' : h < 21 ? 'diner' : null)
            : null

          return (
            <div key={group.date}>
              {groups.length > 1 && <p style={S.dayLabel}>{group.label}</p>}
              {mergedMeals.map((meal, i) => {
                const isGenerating = generatingRecipe && selectedMeal?.dishName === meal.dishName
                const isNext = meal.type === nextType

                return (
                  <button
                    key={i}
                    onClick={() => handleMealClick(meal)}
                    disabled={generatingRecipe}
                    style={{
                      ...S.mealRow,
                      ...(isNext ? S.mealRowNext : {}),
                      opacity: generatingRecipe && !isGenerating ? 0.5 : 1,
                    }}
                  >
                    <span style={S.mealType}>{MEAL_LABELS[meal.type] || meal.type}</span>
                    <span style={S.mealDesc}>{meal.dishName}</span>
                    {isGenerating ? (
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0, color: '#16a34a' }} />
                    ) : (
                      <span style={S.mealPersons}>{meal.persons.join('')}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {generatingRecipe && (
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      )}

      {/* ═══ CHOICE MODAL ═══ */}
      {showChoice && selectedMeal && (
        <>
          <div style={S.overlay} onClick={closeModal} />
          <div style={S.modal}>
            {/* Header */}
            <div style={S.modalHeader}>
              <div>
                <span style={S.modalMealType}>{MEAL_LABELS[selectedMeal.type] || selectedMeal.type}</span>
                <h3 style={S.modalTitle}>{selectedMeal.dishName}</h3>
                {selectedMeal.entries[0]?.kcal && (
                  <p style={S.modalMacros}>
                    {selectedMeal.entries.map(e => `${e.person_name?.charAt(0)}: ${e.kcal} kcal`).join(' · ')}
                  </p>
                )}
              </div>
              <button onClick={closeModal} style={S.closeBtn}><X size={18} /></button>
            </div>

            {/* ── DEFAULT: choice buttons ── */}
            {!swapMode && !swapResult && (
              <div style={S.choiceButtons}>
                <button onClick={handleCook} style={S.cookBtn}>
                  <ChefHat size={18} />
                  Cuisiner
                </button>
                <button onClick={() => setSwapMode(true)} style={S.swapBtn}>
                  <RefreshCw size={18} />
                  Changer ce plat
                </button>
              </div>
            )}

            {/* ── SWAP MODE: input + generate ── */}
            {swapMode && !swapResult && (
              <div style={S.swapSection}>
                <input
                  type="text"
                  value={swapPreference}
                  onChange={e => setSwapPreference(e.target.value)}
                  placeholder="Qu'est-ce que tu préfères ? (optionnel)"
                  style={S.swapInput}
                  onKeyDown={e => e.key === 'Enter' && handleSwap()}
                  autoFocus
                />
                <button onClick={handleSwap} disabled={swapping} style={S.generateBtn}>
                  {swapping ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Myko cherche...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Trouver une alternative
                    </>
                  )}
                </button>
                {swapError && <p style={S.swapError}>{swapError}</p>}
                <button onClick={() => setSwapMode(false)} style={S.cancelLink}>Annuler</button>
              </div>
            )}

            {/* ── SWAP RESULT: show replacement ── */}
            {swapResult && !swapSuccess && (
              <div style={S.swapResultSection}>
                <p style={S.swapResultLabel}>Nouveau plat :</p>
                <h4 style={S.swapResultName}>{swapResult.name || extractDishName([swapResult.j?.desc, swapResult.z?.desc].filter(Boolean))}</h4>
                {swapResult.j && (
                  <p style={S.swapResultMacro}>
                    Julien : {swapResult.j.desc} — {swapResult.j.kcal} kcal
                  </p>
                )}
                {swapResult.z && (
                  <p style={S.swapResultMacro}>
                    Zoé : {swapResult.z.desc} — {swapResult.z.kcal} kcal
                  </p>
                )}
                <div style={S.swapResultButtons}>
                  <button onClick={confirmSwap} style={S.confirmBtn}>
                    <Check size={16} /> Confirmer
                  </button>
                  <button onClick={() => { setSwapResult(null); setSwapMode(true) }} style={S.retrySwapBtn}>
                    Autre choix
                  </button>
                </div>
              </div>
            )}

            {/* ── SWAP SUCCESS ── */}
            {swapSuccess && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Check size={32} color="#16a34a" />
                <p style={{ color: '#16a34a', fontWeight: 600, marginTop: 8 }}>Plat changé !</p>
              </div>
            )}
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </>
      )}

      <CookMode
        open={cookModeOpen}
        onClose={() => { setCookModeOpen(false); setGeneratedRecipe(null) }}
        recipe={generatedRecipe}
        steps={generatedRecipe?.steps || []}
        ingredients={generatedRecipe?.ingredients || []}
        recipeId={cachedRecipeId}
        onRate={handleRate}
      />
    </>
  )
}

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    margin: '8px 0 4px',
  },
  mealRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '10px 12px',
    border: '1px solid transparent',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    transition: 'all 0.15s',
    fontSize: 14,
    color: 'var(--ink, #1f281f)',
  },
  mealRowNext: {
    background: 'rgba(22,163,74,0.06)',
    borderColor: 'rgba(22,163,74,0.2)',
  },
  mealType: {
    fontSize: 10,
    fontWeight: 700,
    color: '#16a34a',
    background: 'rgba(22,163,74,0.08)',
    padding: '2px 8px',
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flexShrink: 0,
    minWidth: 52,
    textAlign: 'center',
  },
  mealDesc: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  mealPersons: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6b9d6b',
    background: 'rgba(22,163,74,0.08)',
    borderRadius: 4,
    padding: '1px 5px',
    flexShrink: 0,
  },

  // Overlay + Modal
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 1100,
  },
  modal: {
    position: 'fixed',
    bottom: 0, left: 0, right: 0,
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px 24px 0 0',
    padding: '20px 20px 32px',
    zIndex: 1101,
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 -4px 30px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalMealType: {
    fontSize: 10,
    fontWeight: 700,
    color: '#16a34a',
    background: 'rgba(22,163,74,0.08)',
    padding: '2px 8px',
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--ink, #1f281f)',
    margin: '6px 0 4px',
  },
  modalMacros: {
    fontSize: 12,
    color: '#6b7280',
    margin: 0,
  },
  closeBtn: {
    border: 'none',
    background: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    padding: 8,
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    flexShrink: 0,
  },

  // Choice buttons
  choiceButtons: {
    display: 'flex',
    gap: 10,
  },
  cookBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 0',
    background: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(22,163,74,0.25)',
  },
  swapBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 0',
    background: 'transparent',
    color: '#374151',
    border: '1.5px solid rgba(0,0,0,0.12)',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Swap section
  swapSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  swapInput: {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid rgba(0,0,0,0.1)',
    borderRadius: 12,
    fontSize: 14,
    fontFamily: 'inherit',
    color: 'var(--ink, #1f281f)',
    outline: 'none',
    background: 'rgba(255,255,255,0.8)',
    boxSizing: 'border-box',
  },
  generateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 0',
    background: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  swapError: {
    color: '#dc2626',
    fontSize: 13,
    margin: 0,
    textAlign: 'center',
  },
  cancelLink: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: '4px 0',
    textAlign: 'center',
  },

  // Swap result
  swapResultSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  swapResultLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    margin: 0,
  },
  swapResultName: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--ink, #1f281f)',
    margin: '0 0 4px',
  },
  swapResultMacro: {
    fontSize: 13,
    color: '#374151',
    margin: '2px 0',
    lineHeight: 1.4,
  },
  swapResultButtons: {
    display: 'flex',
    gap: 10,
    marginTop: 12,
  },
  confirmBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '14px 0',
    background: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  retrySwapBtn: {
    flex: 1,
    padding: '14px 0',
    background: 'transparent',
    color: '#6b7280',
    border: '1.5px solid rgba(0,0,0,0.1)',
    borderRadius: 14,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'center',
  },
}
