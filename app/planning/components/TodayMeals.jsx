'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { authFetch } from '@/lib/authFetch'
import CookMode from '@/components/CookMode'
import CookSession from './CookSession'
import { Loader2, ChefHat, RefreshCw, X, Check, Flame, Soup, Sparkles, ThumbsUp, ThumbsDown, Meh } from 'lucide-react'
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

/**
 * LES TROIS GESTES DU RETOUR DE GOÛT (livrable 3.3).
 *
 * Trois, et pas quatre : ce sont EXACTEMENT les trois appréciations que
 * `preferenceFromFeedback` (`lib/domain/planning/tastePreferences.js:298`) sait
 * traduire en préférence lue par la génération suivante. La quatrième valeur
 * acceptée par l'API, `acceptable`, ne change rien au profil — elle confirme
 * l'existant. Elle n'a donc pas de bouton : un bouton sans effet se prend pour
 * un avis pris en compte, et c'est pire que pas de bouton du tout.
 *
 * Ce qui manque encore, et qu'on ne fait pas semblant d'avoir : « trop souvent »
 * (C5.2 du plan de septembre). L'axe `too_repetitive` existe dans la table, mais
 * aucune règle ne le lit aujourd'hui — il n'aurait allongé le délai de retour
 * d'aucun plat. Il faudra une traduction vers `repeat_delay_days` pour qu'il
 * devienne un geste, pas avant.
 */
const TASTE_ACTIONS = [
  { value: 'loved', label: 'Aimé', Icon: ThumbsUp, effect: 'Ce plat deviendra un favori du profil' },
  { value: 'to_adjust', label: 'À revoir', Icon: Meh, effect: 'Ce plat sera évité sans être exclu' },
  { value: 'never_again', label: 'Plus jamais', Icon: ThumbsDown, effect: 'Ce plat ne sera plus proposé' },
]

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

  // Retour de goût (livrable 3.3) : ce que chacun a déjà déclaré depuis
  // l'ouverture de l'écran, par `${date}|${prise}|${personne}`, et l'envoi en
  // cours. Le profil de goûts n'est pas rechargé ici : il est lu par la
  // génération suivante, pas par cet écran.
  const [tasteGiven, setTasteGiven] = useState({})
  const [tasteSending, setTasteSending] = useState(null)

  // Modify-meal mode
  const [swapMode, setSwapMode] = useState(false)
  const [swapDirection, setSwapDirection] = useState('')
  const [swapping, setSwapping] = useState(false)
  const [swapError, setSwapError] = useState('')
  const [swapSuccess, setSwapSuccess] = useState(false)

  // Alternatives déterministes (livrable 3.2) : ce que le moteur propose pour
  // ce créneau, avec les conséquences de chaque échange sur le reste de la
  // semaine. `altElapsedMs` est le temps réellement mesuré du dernier appel —
  // affiché parce que c'est le critère du livrable, et qu'un chiffre annoncé
  // sans mesure est un chiffre faux.
  const [altLoading, setAltLoading] = useState(false)
  const [altError, setAltError] = useState('')
  const [alternatives, setAlternatives] = useState([])
  const [altCurrent, setAltCurrent] = useState(null)
  const [altElapsedMs, setAltElapsedMs] = useState(null)
  const [applyingCode, setApplyingCode] = useState(null)

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

  /**
   * DONNER SON AVIS SUR UN REPAS, EN UN GESTE (livrable 3.3).
   *
   * La boucle existait en entier sauf ce clic : `/api/meals/feedback` écrit dans
   * `meal_taste_feedback`, en tire une préférence dans `member_food_preferences`,
   * que `buildHouseholdTasteProfile` relit et que le planificateur applique. Les
   * deux tables valaient 0 ligne parce qu'aucun écran n'appelait la route.
   *
   * L'AVIS EST INDIVIDUEL, ET IL LE RESTE. Un bouton par personne présente au
   * créneau : enregistrer l'avis de l'un au nom des deux fabriquerait une
   * déclaration que personne n'a faite, et le profil de l'autre porterait une
   * préférence qu'il n'a pas exprimée.
   */
  async function sendTaste(meal, eater, appreciation) {
    const key = `${eater.mealDate}|${meal.type}|${eater.key}`
    if (tasteSending) return
    setTasteSending(`${key}|${appreciation}`)
    try {
      const res = await authFetch('/api/meals/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_member_id: eater.memberId || null,
          meal_date: eater.mealDate,
          meal_type: meal.type,
          canonical_recipe_code: eater.recipeCode || null,
          recipe_label: meal.dishName || null,
          appreciation,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Avis non enregistré')
        return
      }
      setTasteGiven((state) => ({ ...state, [key]: appreciation }))
      // On dit ce qui a été appris, ou qu'il n'a rien été appris ET pourquoi
      // quand on le sait. Un « merci » uniforme laisserait croire que le profil
      // a bougé même quand la ligne n'a pas pu lui être rattachée.
      if (data.learned) {
        toast.success(`Avis de ${eater.name} enregistré — le profil en tient compte à la prochaine génération`)
      } else {
        // Le cas connu : la ligne de repas n'est rattachée à aucun membre du
        // foyer, donc il n'y a pas de profil à enrichir. Le retour est consigné
        // quand même, et on le dit — plutôt qu'un « merci » qui laisserait
        // croire que la prochaine génération en tiendra compte.
        toast.success(`Avis de ${eater.name} enregistré — sans effet sur le profil`
          + (eater.memberId ? '' : ' (ce repas n’est rattaché à aucun membre du foyer)'))
      }
    } catch {
      toast.error('Erreur réseau — avis non enregistré')
    } finally {
      setTasteSending(null)
    }
  }

  /**
   * Les mangeurs d'un créneau, un par personne. L'identifiant de membre vient
   * de la ligne de repas quand elle le porte, sinon du foyer par son nom : sans
   * lui, la route enregistre le retour mais n'enrichit aucun profil.
   */
  function eatersOf(meal) {
    const seen = new Map()
    for (const entry of meal.entries || []) {
      const name = entry.person_name || 'Le foyer'
      if (seen.has(name)) continue
      seen.set(name, {
        key: name,
        name,
        memberId: entry.household_member_id
          || householdMembers.find((member) => member.name === name)?.id
          || null,
        mealDate: entry.meal_date,
        recipeCode: entry.canonical_recipe_code || null,
      })
    }
    return [...seen.values()]
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
    setAlternatives([])
    setAltCurrent(null)
    setAltError('')
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

  // ── REMPLACER CE REPAS (livrable 3.2) ──
  /**
   * CE QUI CHANGE, ET POURQUOI. Ce bouton partait vers `/api/routine/modify-meal`,
   * c'est-à-dire vers un modèle de langage qui écrivait la semaine en base
   * HORS moteur, hors règles de répétition et hors invariants, en 30 à 60
   * secondes. `/api/planning/alternatives` existait depuis des mois —
   * déterministe, sous les mêmes règles que la génération — et n'avait AUCUN
   * appelant. C'est lui qu'on appelle désormais d'abord.
   *
   * Chaque proposition arrive avec ses CONSÉQUENCES : ce qu'elle franchit dans
   * la semaine, ce qu'il faudra acheter, l'écart nutritionnel. Le foyer choisit
   * en sachant, ce que la Routine ne permettait pas — elle décidait.
   *
   * LA ROUTINE RESTE, pour l'instant. Son retrait est le livrable 4.4, et le
   * plan le dit : « les alternatives déterministes doivent exister avant qu'on
   * débranche la Routine, sinon on retire une fonction sans rien rendre ». Elle
   * est reléguée au second rang, avec son coût affiché.
   */
  async function loadAlternatives(meal) {
    const mealDate = meal?.entries?.[0]?.meal_date
    setAlternatives([])
    setAltCurrent(null)
    setAltElapsedMs(null)
    if (!importId || !mealDate) {
      setAltError('Ce repas n’appartient pas à une semaine publiée : le moteur ne peut pas proposer d’alternative.')
      return
    }
    // Les petits-déjeuners et collations sont des rotations codées en dur
    // (§8 du plan) : le moteur n'a pas de créneau à leur opposer, et un 404 mal
    // traduit laisserait croire à une panne. On le dit.
    if (!['dejeuner', 'diner'].includes(meal.type)) {
      setAltError('Les petits-déjeuners et collations sont des rotations fixes : le moteur ne propose pas d’alternative pour ce créneau.')
      return
    }
    setAltLoading(true)
    setAltError('')
    const started = Date.now()
    try {
      const res = await authFetch('/api/planning/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ import_id: importId, meal_date: mealDate, meal_type: meal.type }),
      })
      const data = await res.json().catch(() => ({}))
      setAltElapsedMs(Date.now() - started)
      if (!res.ok) {
        setAltError(data.error || 'Le moteur n’a pas pu proposer d’alternative.')
        return
      }
      setAlternatives(data.alternatives || [])
      setAltCurrent(data.current || null)
      if (!(data.alternatives || []).length) {
        setAltError('Aucune alternative ne passe les contraintes du foyer pour ce créneau.')
      }
    } catch {
      setAltElapsedMs(Date.now() - started)
      setAltError('Erreur réseau — aucune alternative chargée.')
    } finally {
      setAltLoading(false)
    }
  }

  /**
   * Applique l'alternative retenue. Elle passe par la génération ciblée, donc
   * par la transaction de publication : c'est le seul chemin qui écrit un plan
   * (§9.3 du plan). Le créneau est figé sur le plat choisi ; les treize autres
   * ne bougent pas.
   */
  async function applyAlternative(meal, alternative) {
    const mealDate = meal?.entries?.[0]?.meal_date
    if (!importId || !mealDate || applyingCode) return
    setApplyingCode(alternative.recipeCode)
    setAltError('')
    try {
      const res = await authFetch('/api/planning/generate-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          import_id: importId,
          scope: 'meals',
          meals: [{ date: mealDate, type: meal.type }],
          chosen_recipes: [{ meal_date: mealDate, meal_type: meal.type, recipe_code: alternative.recipeCode }],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAltError(data.error || 'Le remplacement n’a pas pu être publié.')
        return
      }
      setSwapSuccess(true)
      if (data.status === 'review_required') {
        toast.warning(data.issues?.[0]?.message || 'Repas remplacé — la semaine demande une revue')
      }
      setTimeout(() => {
        closeModal()
        loadMeals()
      }, 1200)
    } catch {
      setAltError('Erreur réseau — le repas n’a pas été remplacé.')
    } finally {
      setApplyingCode(null)
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
                // Seuls les mangeurs dont l'assiette porte une recette
                // canonique peuvent donner un avis que le profil apprendra.
                const eaters = eatersOf(meal).filter((eater) => eater.recipeCode)
                return (
                  <div key={i} className="tm-meal-block">
                  <div className="tm-meal" style={{ opacity: generatingRecipe && !isGenerating ? 0.5 : 1 }}>
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
                  {/* Retour de goût (livrable 3.3) : un geste par personne, sur
                      chaque repas qui porte une recette — on n'attend pas qu'il
                      soit coché « cuisiné », parce qu'un repas sauté est aussi
                      un avis.
                      PAS sur les petits-déjeuners et collations : ce sont des
                      rotations codées en dur (§8 du plan), sans code canonique,
                      donc sans sujet que le profil puisse apprendre. Trois
                      boutons y enregistreraient un avis que rien ne relit —
                      exactement ce qu'on refuse ailleurs dans cet écran. */}
                  {eaters.length > 0 && (
                    <div className="tm-taste">
                      <span className="tm-taste-label">Votre avis</span>
                      {eaters.map((eater) => (
                        <span key={eater.key} className="tm-taste-person">
                          {eaters.length > 1 && <span className="tm-taste-who">{eater.name}</span>}
                          {TASTE_ACTIONS.map(({ value, label, Icon, effect }) => {
                            const stateKey = `${eater.mealDate}|${meal.type}|${eater.key}`
                            const chosen = tasteGiven[stateKey] === value
                            const sending = tasteSending === `${stateKey}|${value}`
                            return (
                              <button
                                key={value}
                                type="button"
                                className={`tm-taste-btn${chosen ? ' on' : ''}`}
                                disabled={!!tasteSending}
                                aria-pressed={chosen}
                                title={`${eater.name} — ${effect}`}
                                onClick={(e) => { e.stopPropagation(); sendTaste(meal, eater, value) }}
                              >
                                {sending
                                  ? <Loader2 size={11} className="tm-taste-spin" />
                                  : <Icon size={11} aria-hidden="true" />}
                                {label}
                              </button>
                            )
                          })}
                        </span>
                      ))}
                    </div>
                  )}
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
                <button
                  onClick={() => { setSwapMode(true); loadAlternatives(selectedMeal) }}
                  className="tm-swap-btn"
                >
                  <RefreshCw size={18} />
                  Changer ce plat
                </button>
              </div>
            )}

            {/* ── ALTERNATIVES DÉTERMINISTES (livrable 3.2) ── */}
            {swapMode && !swapSuccess && (
              <div className="tm-alt-section">
                <p className="tm-alt-title">
                  Propositions du moteur
                  {altElapsedMs != null && !altLoading && (
                    <span className="tm-alt-timing"> · {(altElapsedMs / 1000).toFixed(1).replace('.', ',')} s</span>
                  )}
                </p>
                {altLoading && (
                  <p className="tm-alt-loading">
                    <Loader2 size={13} className="tm-taste-spin" /> Le moteur classe les plats possibles…
                  </p>
                )}
                {altError && <p className="tm-swap-error">{altError}</p>}
                {alternatives.map((alternative) => {
                  const applying = applyingCode === alternative.recipeCode
                  const delta = alternative.nutritionDelta || null
                  return (
                    <button
                      key={alternative.recipeCode}
                      type="button"
                      className={`tm-alt-row${alternative.compatible ? '' : ' tm-alt-warn'}`}
                      disabled={!!applyingCode}
                      onClick={() => applyAlternative(selectedMeal, alternative)}
                    >
                      <span className="tm-alt-kind">{alternative.kindLabel}</span>
                      <span className="tm-alt-name">
                        {applying && <Loader2 size={12} className="tm-taste-spin" />}
                        {alternative.title}
                      </span>
                      <span className="tm-alt-meta">
                        {alternative.totalMinutes != null && <span>{alternative.totalMinutes} min</span>}
                        {alternative.cuisine && <span>{alternative.cuisine}</span>}
                        {/* La couverture stock est un fait mesuré : on l'affiche
                            telle quelle, sans l'arrondir à « disponible ». */}
                        {alternative.stockCoverage != null && (
                          <span>stock {Math.round(alternative.stockCoverage * 100)} %</span>
                        )}
                        {delta?.kcal != null && delta.kcal !== 0 && (
                          <span>{delta.kcal > 0 ? '+' : ''}{delta.kcal} kcal</span>
                        )}
                        {delta?.proteinG != null && delta.proteinG !== 0 && (
                          <span>{delta.proteinG > 0 ? '+' : ''}{delta.proteinG} g protéines</span>
                        )}
                      </span>
                      {/* Ce que l'échange COÛTE au reste de la semaine. Une
                          alternative qui franchit une règle n'est pas cachée —
                          elle est proposée avec sa conséquence, à l'utilisateur
                          de trancher. */}
                      {!alternative.compatible && (
                        <span className="tm-alt-consequence">
                          {(alternative.consequences || []).map((violation) => violation.message || violation.code).join(' · ')}
                        </span>
                      )}
                      {(alternative.missingIngredients || []).length > 0 && (
                        <span className="tm-alt-missing">
                          à acheter : {alternative.missingIngredients.join(', ')}
                        </span>
                      )}
                    </button>
                  )
                })}
                {altCurrent && alternatives.length > 0 && (
                  <p className="tm-alt-current">Aujourd’hui : {altCurrent.title}</p>
                )}
                {!applyingCode && (
                  <button onClick={() => setSwapMode(false)} className="tm-cancel-link">Annuler</button>
                )}
              </div>
            )}

            {/* ── MODIFY MODE — la Routine, jusqu'au livrable 4.4 ──
                Elle reste le second recours tant que rien ne la remplace pour
                une demande en toutes lettres (« j'ai du saumon »). Son coût est
                affiché : trente à soixante secondes, contre le dixième de
                seconde du moteur ci-dessus. */}
            {swapMode && !swapSuccess && !altLoading && (
              <div className="tm-swap-section">
                <p className="tm-alt-title">Ou décrire ce que vous voulez</p>
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
