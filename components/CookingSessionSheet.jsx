'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Minus, Plus, Search, ChefHat, Check } from 'lucide-react'
import { authFetch } from '@/lib/authFetch'
import { toast } from '@/components/Toast'
import './CookingSessionSheet.css'

// ── Constants ─────────────────────────────────────────────────────────────────

const MEAL_TYPES = [
  { id: 'pdj', label: 'Petit-déj' },
  { id: 'dejeuner', label: 'Déjeuner' },
  { id: 'diner', label: 'Dîner' },
  { id: 'collation', label: 'Collation' },
]

const STORAGE_METHODS = [
  { id: 'fridge', label: 'Frigo' },
  { id: 'freezer', label: 'Congélateur' },
]

// Cycling order for ingredient action state
const ACTION_CYCLE = ['used', 'quantity', 'substituted', 'skipped']

const ACTION_LABELS = {
  used: '✓ Utilisé',
  quantity: '✎ Quantité',
  substituted: '⇄ Remplacé',
  skipped: '— Non utilisé',
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return dateStr
  }
}

/** Scale allocation quantities by ratio, rounding to 2 decimals. */
function scaleAllocations(allocations, ratio) {
  if (!allocations || !allocations.length) return []
  return allocations.map(a => ({
    ...a,
    qty: Math.round(a.qty * ratio * 100) / 100,
  }))
}

/** Round to 2 decimal places, drop trailing zeros for display. */
function fmt(n) {
  return parseFloat((Math.round(n * 100) / 100).toFixed(2))
}

// ── Default ingredient state factory ─────────────────────────────────────────

function defaultIngState(ing) {
  return {
    action: (ing.status === 'missing') ? 'skipped' : 'used',
    actualQty: ing.planned_quantity,
    actualUnit: ing.planned_unit,
    sub: null,      // { type, canonical_food_id, archetype_id, name, unit }
    subQty: 0,
    subUnit: '',
    missingAnswer: (ing.status === 'missing') ? null : 'ok',
    // 'ok' means: not missing — skip the missing-box
    source: (ing.allocations && ing.allocations.length > 0) ? 'inventory' : 'external',
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * CookingSessionSheet — feuille unique de cuisson (remplace CookWizard).
 *
 * Props:
 *   open {boolean}
 *   onClose {function}
 *   recipeSource {'curated'|'ai'}
 *   recipeId {number|string}         — pour source curated
 *   generatedRecipeId {number|string} — pour source ai
 *   defaultServings {number}
 *   onCommitted {function}           — appelé après commit réussi (optionnel)
 *
 * Corriger behavior (choix simple documenté) :
 *   Corriger = POST undo sur la séance committée → créer un NOUVEAU brouillon
 *   → réappliquer les états d'ingrédients mémorisés → édition et re-commit.
 *   Cela évite de tenter un re-commit sur une séance 'undone' (rejeté par l'API).
 */
export default function CookingSessionSheet({
  open,
  onClose,
  recipeSource,
  recipeId,
  generatedRecipeId,
  defaultServings = 4,
  onCommitted,
}) {
  // ── Session ────────────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState(null)
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(false)
  const [sessionError, setSessionError] = useState(null)

  // ── Portions ───────────────────────────────────────────────────────────────
  const [servings, setServings] = useState(defaultServings)

  // ── Per-ingredient states (indexed, parallel to session.ingredients) ───────
  const [ingStates, setIngStates] = useState([])

  // ── Extra ingredients added by user ───────────────────────────────────────
  // Each: { name, entity_type, entity_id, qty, unit, source:'inventory'|'external' }
  const [extraIngs, setExtraIngs] = useState([])

  // ── Inline search (substitutions + extra) ─────────────────────────────────
  // searchTarget: null | 'sub:<idx>' | 'extra'
  const [searchTarget, setSearchTarget] = useState(null)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchDebounce = useRef(null)

  // ── Final block ────────────────────────────────────────────────────────────
  const [portionsObtained, setPortionsObtained] = useState(defaultServings)
  const [portionsEaten, setPortionsEaten] = useState(defaultServings)
  const [mealDate, setMealDate] = useState(todayISO())
  const [mealType, setMealType] = useState('diner')
  const [storageMethod, setStorageMethod] = useState('fridge')

  // ── Persons ────────────────────────────────────────────────────────────────
  const [availablePersons, setAvailablePersons] = useState([])
  const [selectedPersons, setSelectedPersons] = useState([])
  const [customPerson, setCustomPerson] = useState('')

  // ── Commit/undo state ──────────────────────────────────────────────────────
  const [committing, setCommitting] = useState(false)
  const [committed, setCommitted] = useState(false)
  const [commitError, setCommitError] = useState(null)
  const [undoing, setUndoing] = useState(false)

  // ── Computed ratio ─────────────────────────────────────────────────────────
  const plannedServings = session?.planned_servings || defaultServings
  const ratio = servings / plannedServings

  // ── Lifecycle: init on open ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    // Reset ephemeral state
    setCommitted(false)
    setCommitError(null)
    setExtraIngs([])
    setSearchTarget(null)
    setSearchQ('')
    setSearchResults([])
    setMealDate(todayISO())
    setMealType('diner')
    setStorageMethod('fridge')
    setCustomPerson('')

    const sv = defaultServings || 4
    setServings(sv)
    setPortionsObtained(sv)
    setPortionsEaten(sv)

    startDraftSession(sv)
    loadPersons()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Block body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // ESC closes (only when not committed)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !committed) onClose?.()
  }, [committed, onClose])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleKeyDown])

  // ── API: create draft session ──────────────────────────────────────────────
  async function startDraftSession(sv, prevIngStates = null) {
    setLoadingSession(true)
    setSessionError(null)
    setSession(null)
    try {
      const body = { recipe_source: recipeSource, servings: sv }
      if (recipeSource === 'curated' && recipeId) body.recipe_id = Number(recipeId)
      if (recipeSource === 'ai' && generatedRecipeId) body.generated_recipe_id = Number(generatedRecipeId)

      const res = await authFetch('/api/cooking-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création de la séance')

      setSessionId(data.session.id)
      setSession(data.session)

      // Build ingredient states — restore previous states if available (Corriger flow)
      const newStates = (data.session.ingredients || []).map((ing, i) => {
        if (prevIngStates && prevIngStates[i]) {
          // Re-apply user choices, but refresh actualQty from new planned_quantity
          return {
            ...prevIngStates[i],
            actualQty: prevIngStates[i].action !== 'quantity'
              ? ing.planned_quantity
              : prevIngStates[i].actualQty,
            actualUnit: prevIngStates[i].actualUnit || ing.planned_unit,
          }
        }
        return defaultIngState(ing)
      })
      setIngStates(newStates)
    } catch (err) {
      setSessionError(err.message)
    } finally {
      setLoadingSession(false)
    }
  }

  // ── API: load persons ──────────────────────────────────────────────────────
  async function loadPersons() {
    try {
      const res = await authFetch('/api/nutrition/goals')
      const data = await res.json()
      if (Array.isArray(data.goals)) {
        const names = [...new Set(data.goals.map(g => g.person_name).filter(Boolean))]
        setAvailablePersons(names)
        setSelectedPersons(names)
      }
    } catch {
      // Non bloquant — l'utilisateur peut saisir manuellement
    }
  }

  // ── Portions change ────────────────────────────────────────────────────────
  function changeServings(delta) {
    const next = Math.max(1, servings + delta)
    setServings(next)
    setPortionsObtained(next)
    setPortionsEaten(prev => Math.min(prev, next))

    // Recalculate actualQty for non-manually-modified ingredients
    if (session) {
      const newRatio = next / plannedServings
      setIngStates(prev => prev.map((s, i) => {
        const ing = session.ingredients[i]
        if (!ing || s.action === 'quantity') return s // user set quantity manually → keep
        return { ...s, actualQty: fmt(ing.planned_quantity * newRatio) }
      }))
    }
  }

  // ── Ingredient action cycling ──────────────────────────────────────────────
  function cycleAction(idx) {
    setIngStates(prev => {
      const updated = [...prev]
      const cur = updated[idx]
      const pos = ACTION_CYCLE.indexOf(cur.action)
      const next = ACTION_CYCLE[(pos + 1) % ACTION_CYCLE.length]
      updated[idx] = { ...cur, action: next }
      return updated
    })
  }

  // ── Missing ingredient answer ──────────────────────────────────────────────
  function answerMissing(idx, answer) {
    setIngStates(prev => {
      const updated = [...prev]
      const cur = updated[idx]
      let action = cur.action
      let source = cur.source
      if (answer === 'skipped') {
        action = 'skipped'
      } else if (answer === 'substituted') {
        action = 'substituted'
        setTimeout(() => openSearch(`sub:${idx}`), 0)
      } else if (answer === 'external') {
        action = 'used'
        source = 'external'
      }
      updated[idx] = { ...cur, missingAnswer: answer, action, source }
      return updated
    })
  }

  // ── Search ────────────────────────────────────────────────────────────────
  function openSearch(target) {
    setSearchTarget(target)
    setSearchQ('')
    setSearchResults([])
  }

  function closeSearch() {
    setSearchTarget(null)
    setSearchQ('')
    setSearchResults([])
  }

  function triggerSearch(q) {
    setSearchQ(q)
    clearTimeout(searchDebounce.current)
    if (!q.trim()) { setSearchResults([]); return }
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await authFetch(`/api/ingredients/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 280)
  }

  function selectResult(result) {
    if (!searchTarget) return
    if (searchTarget.startsWith('sub:')) {
      const idx = parseInt(searchTarget.split(':')[1], 10)
      setIngStates(prev => {
        const updated = [...prev]
        const cur = updated[idx]
        updated[idx] = {
          ...cur,
          action: 'substituted',
          sub: result,
          subQty: cur.actualQty,
          subUnit: result.unit || cur.actualUnit,
        }
        return updated
      })
    } else if (searchTarget === 'extra') {
      setExtraIngs(prev => [...prev, {
        name: result.name,
        entity_type: result.type,
        entity_id: result.canonical_food_id || result.archetype_id || null,
        qty: 100,
        unit: result.unit || 'g',
        source: 'external',
      }])
    }
    closeSearch()
  }

  // ── Extra ingredient helpers ───────────────────────────────────────────────
  function updateExtra(idx, field, value) {
    setExtraIngs(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  function removeExtra(idx) {
    setExtraIngs(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Build commit payload ───────────────────────────────────────────────────
  function buildPayload() {
    const ingredientRows = (session?.ingredients || []).map((ing, i) => {
      const s = ingStates[i] || defaultIngState(ing)
      const scaledAllocs = scaleAllocations(ing.allocations, ratio)
      const scaledQty = fmt(ing.planned_quantity * ratio)

      // actual_action: 'quantity' → 'used'; rest pass through
      const actual_action = s.action === 'quantity' ? 'used' : s.action

      let actual_entity_type = ing.planned_entity_type
      let actual_entity_id = ing.planned_entity_id
      let actual_quantity = s.action === 'quantity' ? s.actualQty : scaledQty
      let actual_unit = s.actualUnit || ing.planned_unit
      let source = (ing.allocations?.length > 0 && s.source !== 'external') ? 'inventory' : 'external'

      if (s.action === 'substituted' && s.sub) {
        actual_entity_type = s.sub.type
        actual_entity_id = s.sub.canonical_food_id || s.sub.archetype_id || null
        actual_quantity = s.subQty
        actual_unit = s.subUnit || s.sub.unit || ing.planned_unit
        source = 'external'
      }

      if (s.source === 'external') source = 'external'

      return {
        planned_name: ing.planned_name,
        planned_entity_type: ing.planned_entity_type,
        planned_entity_id: ing.planned_entity_id,
        planned_quantity: scaledQty,
        planned_unit: ing.planned_unit,
        actual_action,
        actual_entity_type,
        actual_entity_id,
        actual_quantity,
        actual_unit,
        source,
        allocations: scaledAllocs.map(a => ({ lot_id: a.lot_id, qty: a.qty })),
      }
    })

    const extraRows = extraIngs.map(e => ({
      planned_name: e.name,
      planned_entity_type: e.entity_type,
      planned_entity_id: e.entity_id,
      planned_quantity: e.qty,
      planned_unit: e.unit,
      actual_action: 'extra',
      actual_entity_type: e.entity_type,
      actual_entity_id: e.entity_id,
      actual_quantity: e.qty,
      actual_unit: e.unit,
      source: e.source,
      allocations: [],
    }))

    const portionsLeft = Math.max(0, portionsObtained - portionsEaten)
    const persons = [
      ...selectedPersons,
      ...(customPerson.trim() ? [customPerson.trim()] : []),
    ]

    return {
      actual_servings: portionsObtained,
      portions_eaten: portionsEaten,
      portions_left: portionsLeft,
      meal_date: mealDate || todayISO(),
      meal_type: mealType,
      storage_method: portionsLeft > 0 ? storageMethod : null,
      persons,
      ingredients: [...ingredientRows, ...extraRows],
    }
  }

  // ── Commit ────────────────────────────────────────────────────────────────
  async function handleCommit() {
    if (!sessionId) return
    setCommitting(true)
    setCommitError(null)
    try {
      const res = await authFetch(`/api/cooking-sessions/${sessionId}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (res.status === 409) throw new Error(data.message || 'Séance déjà validée ou conflit de stock')
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la validation')
      setCommitted(true)
      onCommitted?.()
    } catch (err) {
      setCommitError(err.message)
    } finally {
      setCommitting(false)
    }
  }

  // ── Undo ──────────────────────────────────────────────────────────────────
  async function handleUndo() {
    if (!sessionId) return
    setUndoing(true)
    try {
      const res = await authFetch(`/api/cooking-sessions/${sessionId}/undo`, { method: 'POST' })
      const data = await res.json()
      if (res.status === 409) {
        toast.error(data.message || 'Impossible d\'annuler : des portions ont déjà été consommées')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'annulation')
      toast.success('Cuisson annulée — stock restauré')
      onClose?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUndoing(false)
    }
  }

  // ── Corriger (undo + nouveau brouillon + réapplication des états) ──────────
  // Choix documenté : POST undo → POST nouveau cooking-sessions → réappliquer
  // les ingStates en mémoire → l'utilisateur peut modifier et re-committer.
  // Un re-commit direct sur une séance 'undone' serait rejeté par l'API (409).
  async function handleCorrect() {
    if (!sessionId) return
    setUndoing(true)
    try {
      // 1. Annuler la séance committée
      const undoRes = await authFetch(`/api/cooking-sessions/${sessionId}/undo`, { method: 'POST' })
      const undoData = await undoRes.json()
      if (undoRes.status === 409) {
        toast.error(undoData.message || 'Impossible de corriger : des portions ont déjà été consommées')
        return
      }
      if (!undoRes.ok) throw new Error(undoData.error || 'Erreur lors de l\'annulation')

      // 2. Sauvegarder les états courants pour les réappliquer
      const savedIngStates = ingStates
      const savedExtraIngs = extraIngs

      // 3. Créer un nouveau brouillon
      await startDraftSession(servings, savedIngStates)
      setExtraIngs(savedExtraIngs)

      // 4. Réinitialiser le statut committed
      setCommitted(false)
      setCommitError(null)
      toast.info('Séance annulée — modifiez et re-validez')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUndoing(false)
    }
  }

  // ── Early return if closed ─────────────────────────────────────────────────
  if (!open) return null

  // ── Derived values ─────────────────────────────────────────────────────────
  const ings = session?.ingredients || []
  const portionsLeft = Math.max(0, portionsObtained - portionsEaten)
  const recipeTitle = session?.recipe?.title || ''

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="css-backdrop" onClick={committed ? undefined : onClose} role="presentation">
      <div
        className="css-sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Cuisiner ${recipeTitle}`}
      >
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="css-header">
          <div className="css-header-top">
            <div className="css-header-text">
              <span className="css-eyebrow">Cuisiner</span>
              <h2 className="css-recipe-title">
                {loadingSession ? 'Préparation…' : recipeTitle || 'Recette'}
              </h2>
            </div>
            {!committed && (
              <button className="css-close-btn" onClick={onClose} aria-label="Fermer">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Portions stepper — visible once session loaded */}
          {!loadingSession && session && !committed && (
            <div className="css-portions-header">
              <span className="css-portions-hl">Portions</span>
              <div className="css-stepper">
                <button
                  className="css-step-btn"
                  onClick={() => changeServings(-1)}
                  disabled={servings <= 1}
                  aria-label="Réduire les portions"
                >
                  <Minus size={14} />
                </button>
                <span className="css-step-val">{servings}</span>
                <button
                  className="css-step-btn"
                  onClick={() => changeServings(1)}
                  aria-label="Augmenter les portions"
                >
                  <Plus size={14} />
                </button>
              </div>
              {plannedServings !== servings && (
                <span className="css-portions-hint">recette : {plannedServings}</span>
              )}
            </div>
          )}
        </div>

        {/* ── BODY ────────────────────────────────────────────────────────── */}
        <div className="css-body">

          {/* Loading */}
          {loadingSession && (
            <div className="css-loading">
              <span className="css-spinner" aria-hidden="true" />
              <span>Préparation de la séance…</span>
            </div>
          )}

          {/* Error */}
          {sessionError && !loadingSession && (
            <div className="css-session-error">
              <p>{sessionError}</p>
              <button
                className="css-btn-secondary"
                onClick={() => startDraftSession(servings)}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* ── Committed state ─────────────────────────────────────────── */}
          {committed && (
            <div className="css-committed">
              <div className="css-committed-icon-wrap" aria-hidden="true">
                <ChefHat size={28} />
              </div>
              <p className="css-committed-title">Cuisson enregistrée</p>
              <p className="css-committed-sub">
                {portionsObtained} portion{portionsObtained > 1 ? 's' : ''} obtenue{portionsObtained > 1 ? 's' : ''}
                {portionsLeft > 0 ? ` · ${portionsLeft} en ${storageMethod === 'fridge' ? 'frigo' : 'congélo'}` : ''}
              </p>
              <div className="css-committed-actions">
                <button
                  className="css-committed-undo"
                  onClick={handleUndo}
                  disabled={undoing}
                >
                  {undoing ? 'Annulation…' : 'Annuler'}
                </button>
                <button
                  className="css-committed-correct"
                  onClick={handleCorrect}
                  disabled={undoing}
                >
                  Corriger
                </button>
              </div>
            </div>
          )}

          {/* ── Main editing content ─────────────────────────────────────── */}
          {!loadingSession && !sessionError && session && !committed && (
            <>
              {/* ── Ingredient list ─────────────────────────────────────── */}
              <section className="css-section">
                <h3 className="css-section-title">Ingrédients</h3>

                <div className="css-ing-list">
                  {ings.map((ing, i) => {
                    const s = ingStates[i] || defaultIngState(ing)
                    const scaledQty = fmt(ing.planned_quantity * ratio)
                    const scaledAllocs = scaleAllocations(ing.allocations, ratio)
                    const isMissing = ing.status === 'missing' || ing.status === 'partial'
                    const needsAnswer = isMissing && s.missingAnswer === null

                    return (
                      <div
                        key={i}
                        className={`css-ing-row${isMissing ? ' css-ing-missing' : ''}${s.action === 'skipped' ? ' css-ing-skipped' : ''}`}
                      >
                        {/* Row header */}
                        <div className="css-ing-head">
                          <div className="css-ing-ident">
                            <span className="css-ing-name">{ing.planned_name}</span>
                            <span className="css-ing-qty">
                              {scaledQty}&thinsp;{ing.planned_unit}
                            </span>
                          </div>

                          {/* Action cycle button (hidden when needs missing answer) */}
                          {!needsAnswer && (
                            <button
                              className={`css-action-chip css-action-${s.action}`}
                              onClick={() => cycleAction(i)}
                              title="Changer l'état"
                            >
                              {ACTION_LABELS[s.action]}
                            </button>
                          )}
                        </div>

                        {/* Missing box — explicit question */}
                        {needsAnswer && (
                          <div className="css-missing-box">
                            <span className="css-missing-label">
                              {ing.status === 'missing' ? 'Pas en stock' : 'Quantité insuffisante'}
                              {ing.missing_qty > 0 ? ` — manque ${fmt(ing.missing_qty)} ${ing.planned_unit}` : ''}
                            </span>
                            <div className="css-missing-choices">
                              <button className="css-missing-btn" onClick={() => answerMissing(i, 'external')}>
                                J'en avais (hors stock)
                              </button>
                              <button className="css-missing-btn" onClick={() => answerMissing(i, 'substituted')}>
                                Je l'ai remplacé
                              </button>
                              <button className="css-missing-btn" onClick={() => answerMissing(i, 'skipped')}>
                                Non utilisé
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline quantity edit */}
                        {!needsAnswer && s.action === 'quantity' && (
                          <div className="css-inline-qty">
                            <input
                              type="number"
                              className="css-qty-input"
                              value={s.actualQty}
                              min="0"
                              step="0.1"
                              aria-label={`Quantité de ${ing.planned_name}`}
                              onChange={e => {
                                const v = parseFloat(e.target.value) || 0
                                setIngStates(prev => {
                                  const u = [...prev]; u[i] = { ...u[i], actualQty: v }; return u
                                })
                              }}
                            />
                            <input
                              type="text"
                              className="css-unit-input"
                              value={s.actualUnit}
                              aria-label="Unité"
                              onChange={e => {
                                const v = e.target.value
                                setIngStates(prev => {
                                  const u = [...prev]; u[i] = { ...u[i], actualUnit: v }; return u
                                })
                              }}
                            />
                          </div>
                        )}

                        {/* Substitution block */}
                        {!needsAnswer && s.action === 'substituted' && (
                          <div className="css-sub-block">
                            {s.sub ? (
                              <>
                                <span className="css-sub-name">{s.sub.name}</span>
                                <div className="css-inline-qty">
                                  <input
                                    type="number"
                                    className="css-qty-input"
                                    value={s.subQty}
                                    min="0"
                                    step="0.1"
                                    aria-label={`Quantité de ${s.sub.name}`}
                                    onChange={e => {
                                      const v = parseFloat(e.target.value) || 0
                                      setIngStates(prev => {
                                        const u = [...prev]; u[i] = { ...u[i], subQty: v }; return u
                                      })
                                    }}
                                  />
                                  <input
                                    type="text"
                                    className="css-unit-input"
                                    value={s.subUnit}
                                    aria-label="Unité du substitut"
                                    onChange={e => {
                                      const v = e.target.value
                                      setIngStates(prev => {
                                        const u = [...prev]; u[i] = { ...u[i], subUnit: v }; return u
                                      })
                                    }}
                                  />
                                  <button className="css-sub-change" onClick={() => openSearch(`sub:${i}`)}>
                                    Changer
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button className="css-search-trigger" onClick={() => openSearch(`sub:${i}`)}>
                                <Search size={13} aria-hidden="true" />
                                Choisir un substitut
                              </button>
                            )}
                          </div>
                        )}

                        {/* Multi-lot allocations (only when relevant) */}
                        {scaledAllocs.length > 0 && s.action !== 'skipped' && (
                          <div className="css-allocs">
                            {scaledAllocs.map((a, ai) => (
                              <span key={ai} className="css-alloc-chip">
                                {a.qty}&thinsp;{ing.planned_unit}
                                {a.label ? ` — ${a.label}` : ` — lot ${ai + 1}`}
                                {a.expiration_date ? ` · ${fmtDate(a.expiration_date)}` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Extra ingredients */}
                {extraIngs.length > 0 && (
                  <div className="css-extra-list">
                    <h4 className="css-extra-title">Ingrédients ajoutés</h4>
                    {extraIngs.map((e, i) => (
                      <div key={i} className="css-extra-row">
                        <span className="css-ing-name">{e.name}</span>
                        <div className="css-inline-qty">
                          <input
                            type="number"
                            className="css-qty-input"
                            value={e.qty}
                            min="0"
                            step="0.1"
                            aria-label={`Quantité de ${e.name}`}
                            onChange={ev => updateExtra(i, 'qty', parseFloat(ev.target.value) || 0)}
                          />
                          <input
                            type="text"
                            className="css-unit-input"
                            value={e.unit}
                            aria-label="Unité"
                            onChange={ev => updateExtra(i, 'unit', ev.target.value)}
                          />
                        </div>
                        <button
                          className="css-remove-extra"
                          onClick={() => removeExtra(i)}
                          aria-label={`Retirer ${e.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button className="css-add-ing-btn" onClick={() => openSearch('extra')}>
                  + Ajouter un ingrédient
                </button>
              </section>

              {/* ── Search panel ──────────────────────────────────────────── */}
              {searchTarget && (
                <div className="css-search-panel" role="search">
                  <div className="css-search-head">
                    <span className="css-search-label">
                      {searchTarget === 'extra' ? 'Ajouter un ingrédient' : 'Choisir un substitut'}
                    </span>
                    <button className="css-search-close" onClick={closeSearch} aria-label="Fermer la recherche">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="css-search-field">
                    <Search size={14} className="css-search-icon" aria-hidden="true" />
                    <input
                      type="text"
                      className="css-search-input"
                      placeholder="Rechercher un aliment…"
                      value={searchQ}
                      onChange={e => triggerSearch(e.target.value)}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                    />
                  </div>
                  {searchLoading && (
                    <p className="css-search-status">Recherche…</p>
                  )}
                  {!searchLoading && searchResults.length > 0 && (
                    <ul className="css-search-results" role="listbox">
                      {searchResults.slice(0, 8).map((r, ri) => (
                        <li
                          key={ri}
                          className="css-search-result"
                          role="option"
                          onClick={() => selectResult(r)}
                          tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && selectResult(r)}
                        >
                          <span className="css-result-name">{r.name}</span>
                          {r.unit && <span className="css-result-meta">{r.unit}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!searchLoading && searchQ && searchResults.length === 0 && (
                    <p className="css-search-status">Aucun résultat pour « {searchQ} »</p>
                  )}
                </div>
              )}

              {/* ── Final block ───────────────────────────────────────────── */}
              <section className="css-section css-bilan">
                <h3 className="css-section-title">Bilan</h3>

                {/* Portions row */}
                <div className="css-bilan-portions">
                  <div className="css-bilan-item">
                    <label className="css-bilan-label">Portions obtenues</label>
                    <div className="css-stepper">
                      <button
                        className="css-step-btn"
                        onClick={() => setPortionsObtained(v => Math.max(1, v - 1))}
                        aria-label="Réduire"
                      ><Minus size={14} /></button>
                      <span className="css-step-val">{portionsObtained}</span>
                      <button
                        className="css-step-btn"
                        onClick={() => setPortionsObtained(v => v + 1)}
                        aria-label="Augmenter"
                      ><Plus size={14} /></button>
                    </div>
                  </div>

                  <div className="css-bilan-item">
                    <label className="css-bilan-label">Mangées maintenant</label>
                    <div className="css-stepper">
                      <button
                        className="css-step-btn"
                        onClick={() => setPortionsEaten(v => Math.max(0, v - 1))}
                        aria-label="Réduire"
                      ><Minus size={14} /></button>
                      <span className="css-step-val">{portionsEaten}</span>
                      <button
                        className="css-step-btn"
                        onClick={() => setPortionsEaten(v => Math.min(v + 1, portionsObtained))}
                        aria-label="Augmenter"
                      ><Plus size={14} /></button>
                    </div>
                  </div>

                  <div className="css-bilan-item css-bilan-rest">
                    <span className="css-bilan-label">Restantes</span>
                    <span className="css-bilan-rest-val">{portionsLeft}</span>
                  </div>
                </div>

                {/* Storage — uniquement si des portions restent */}
                {portionsLeft > 0 && (
                  <div className="css-field-group">
                    <label className="css-field-label">Rangement des restes</label>
                    <div className="css-chip-row">
                      {STORAGE_METHODS.map(sm => (
                        <button
                          key={sm.id}
                          className={`css-chip${storageMethod === sm.id ? ' css-chip-on' : ''}`}
                          onClick={() => setStorageMethod(sm.id)}
                        >
                          {sm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repas */}
                <div className="css-field-group">
                  <label className="css-field-label">Repas</label>
                  <div className="css-meal-row">
                    <input
                      type="date"
                      className="css-date-input"
                      value={mealDate}
                      onChange={e => setMealDate(e.target.value)}
                      aria-label="Date du repas"
                    />
                    <div className="css-chip-row">
                      {MEAL_TYPES.map(mt => (
                        <button
                          key={mt.id}
                          className={`css-chip${mealType === mt.id ? ' css-chip-on' : ''}`}
                          onClick={() => setMealType(mt.id)}
                        >
                          {mt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Personnes */}
                <div className="css-field-group">
                  <label className="css-field-label">Personnes</label>
                  {availablePersons.length > 0 ? (
                    <div className="css-chip-row">
                      {availablePersons.map(p => (
                        <button
                          key={p}
                          className={`css-chip css-chip-person${selectedPersons.includes(p) ? ' css-chip-on' : ''}`}
                          onClick={() => setSelectedPersons(prev =>
                            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                          )}
                        >
                          {selectedPersons.includes(p) && <Check size={10} aria-hidden="true" />}
                          {p}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="css-date-input"
                      placeholder="Noms (optionnel)"
                      value={customPerson}
                      onChange={e => setCustomPerson(e.target.value)}
                    />
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div className="css-footer">
          {commitError && (
            <p className="css-commit-error" role="alert">{commitError}</p>
          )}
          {!committed && session && !loadingSession && !sessionError && (
            <button
              className="css-commit-btn"
              onClick={handleCommit}
              disabled={committing}
            >
              {committing ? 'Enregistrement…' : 'Valider la cuisson'}
            </button>
          )}
          {committed && (
            <button className="css-close-main-btn" onClick={onClose}>
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
