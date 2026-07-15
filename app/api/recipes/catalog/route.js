import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { dedupCatalog } from '@/app/recipes/catalogDedup'
import { convertWithMeta } from '@/lib/units'
import { listOperationalRecipes } from '@/lib/db/operationalRecipeCatalog'
import { operationalRecipeCards } from '@/lib/domain/recipes/operationalCatalog'
import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'

export const dynamic = 'force-dynamic'

/**
 * GET /api/recipes/catalog — catalogue unifié de recettes, prêt à afficher.
 *
 * Fait côté serveur ce que la page recettes faisait côté client :
 *   1. Charge les recettes générées (RLS user) + recettes classiques + leurs
 *      ingrédients liés (generated_recipe_ingredients / recipe_ingredients).
 *   2. Normalise vers la forme commune de carte et déduplique (dedupCatalog).
 *   3. Charge le stock (inventory_lots non vides, non expirés) + le mapping
 *      archétype→canonique, et calcule la disponibilité par recette avec
 *      sommation multi-lots ET conversion d'unités (lib/units.convertWithMeta).
 *
 * → 200 {
 *     recipes: [{
 *       key, source: 'generated'|'classic', id, title, description,
 *       image_url, prep_min, cook_min, servings, rating, href,
 *       needs_review?: boolean,           // recettes générées uniquement
 *       availability: {
 *         status: 'anti-gaspi'|'cuisinable'|'presque'|'manque',
 *         missing_count, expiring_count,
 *         // détail utilisé par l'UI (tri mykoScore, libellés « utilise/manque ») :
 *         total, available, missing, missingNames, urgent,
 *         expiringName, expiringDays, percent, mykoScore
 *       } | null                          // null si le stock n'a pas pu être lu
 *     }]
 *   }
 * → 401 { error } si non authentifié
 * → 500 { error } si la lecture des recettes générées échoue
 *
 * Pas de cache serveur (données utilisateur) — mais un seul aller-retour client.
 */

const cap = (x) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x)

/** Statut synthétique — miroir exact de variantOf() côté page. */
export function availabilityStatusOf(s) {
  if (!s || !s.total) return 'manque'
  if (s.urgent > 0) return 'anti-gaspi'
  if (s.missing === 0) return 'cuisinable'
  if (s.missing <= 2) return 'presque'
  return 'manque'
}

/**
 * Disponibilité d'une recette face au stock — logique et seuils identiques à
 * l'ancien checkInventoryAvailability() client (fonction pure, testable).
 *
 * @param {object} recipe   carte avec linked_ingredients, prep_min, cook_min
 * @param {Array}  inv      lots { canonical_food_id, archetype_id, qty_remaining, unit, expiration_date }
 * @param {object} archetypeToCanonical  archetype_id (lot) → canonical_food_id
 * @param {(ing) => string} nameOf       nom affichable d'un ingrédient lié
 * @param {Date}   now
 */
export function computeRecipeAvailability(recipe, inv, archetypeToCanonical, nameOf, now = new Date()) {
  const linked = recipe.linked_ingredients || []
  if (linked.length === 0) {
    return {
      total: 0, available: 0, missing: 0, missingNames: [], urgent: 0,
      expiringName: null, expiringDays: null, percent: 0, mykoScore: 0,
    }
  }

  let available = 0, urgent = 0
  const missingNames = []
  let expiringName = null, expiringDays = null

  for (const ing of linked) {
    let totalAvailable = 0, earliestExp = null
    for (const lot of inv) {
      let m = false
      if (ing.canonical_food_id && lot.canonical_food_id === ing.canonical_food_id) m = true
      else if (ing.canonical_food_id && lot.archetype_id && archetypeToCanonical[lot.archetype_id] === ing.canonical_food_id) m = true
      else if (ing.archetype_id && lot.archetype_id === ing.archetype_id) m = true
      else if (ing.canonical_form_normalized && lot.form_normalized_candidates?.includes(ing.canonical_form_normalized)) m = true
      if (m) {
        // Convertir la qty du lot vers l'unité de l'ingrédient avant sommation.
        // Un lot inconvertible (ex: g → u sans meta) est exclu de la somme.
        const ingUnit = ing.canonical_form_normalized ? 'g' : (ing.unit || 'g')
        const lotUnit = lot.unit || 'g'
        const converted = convertWithMeta(lot.qty_remaining || 0, lotUnit, ingUnit)
        // convertWithMeta retourne { qty, unit } ; si unit ≠ ingUnit → conversion non fiable → exclure.
        if (converted.unit === ingUnit) {
          totalAvailable += converted.qty
        }
        if (lot.expiration_date) {
          const d = new Date(lot.expiration_date)
          if (!earliestExp || d < earliestExp) earliestExp = d
        }
      }
    }
    const required = ing.canonical_form_normalized ? ing.quantity_grams : (ing.quantity || 1)
    if (totalAvailable >= required) {
      available++
      if (earliestExp) {
        const days = Math.floor((earliestExp - now) / 86400000)
        if (days <= 7) {
          urgent++
          if (expiringDays === null || days < expiringDays) { expiringDays = days; expiringName = nameOf(ing) }
        }
      }
    } else {
      missingNames.push(nameOf(ing))
    }
  }

  const total = linked.length
  const missing = total - available
  const percent = Math.round((available / total) * 100)
  let mykoScore = (percent / 100) * 60 + (urgent / total) * 30
  const t = (recipe.prep_min || 0) + (recipe.cook_min || 0)
  mykoScore += t > 0 ? Math.max(0, 10 - (t / 120) * 10) : 5

  return {
    total, available, missing, missingNames, urgent,
    expiringName, expiringDays, percent, mykoScore: Math.round(mykoScore),
  }
}

export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // 1. Recettes (2 sources) + stock, en parallèle.
  const [operationalCatalog, genResult, clsResult, invResult] = await Promise.all([
    listOperationalRecipes(supabase),
    supabase
      .from('generated_recipes')
      .select('id, title, description, servings, prep_min, cook_min, source, created_at, rating, cook_count, image_url, status')
      .order('created_at', { ascending: false }),
    supabase
      .from('recipes')
      .select('id, name, description, prep_time_minutes, cook_time_minutes, servings')
      .order('name', { ascending: true }),
    supabase
      .from('inventory_lots')
      .select('canonical_food_id, archetype_id, qty_remaining, unit, expiration_date')
      .gt('qty_remaining', 0)
      .gt('expiration_date', new Date().toISOString()),
  ])

  if (genResult.error) {
    return NextResponse.json({ error: genResult.error.message }, { status: 500 })
  }

  const genData = genResult.data || []
  const clsData = clsResult.error ? [] : (clsResult.data || []) // non-critique si échoue

  // 2. Ingrédients liés des deux sources, en parallèle.
  const [linkedIngsResult, clsLinkedIngsResult] = await Promise.all([
    genData.length
      ? supabase
          .from('generated_recipe_ingredients')
          .select('generated_recipe_id, canonical_food_id, archetype_id, quantity, unit')
          .in('generated_recipe_id', genData.map(r => r.id))
      : Promise.resolve({ data: [], error: null }),
    clsData.length
      ? supabase
          .from('recipe_ingredients')
          .select('recipe_id, canonical_food_id, archetype_id, quantity, unit')
          .in('recipe_id', clsData.map(r => r.id))
      : Promise.resolve({ data: [], error: null }),
  ])

  const ingsByRecipe = {}
  ;(linkedIngsResult.data || []).forEach(ing => {
    (ingsByRecipe[ing.generated_recipe_id] = ingsByRecipe[ing.generated_recipe_id] || []).push(ing)
  })
  const clsIngsByRecipe = {}
  ;(clsLinkedIngsResult.data || []).forEach(ing => {
    (clsIngsByRecipe[ing.recipe_id] = clsIngsByRecipe[ing.recipe_id] || []).push(ing)
  })

  // 3. Normaliser vers la forme commune de carte.
  const canonical = operationalRecipeCards(operationalCatalog.recipes)
  const generated = genData.map(r => ({
    key: `gen-${r.id}`,
    source: 'generated',
    id: r.id,
    title: r.title,
    description: r.description,
    image_url: r.image_url,
    prep_min: r.prep_min,
    cook_min: r.cook_min,
    servings: r.servings,
    rating: r.rating,
    href: `/recipes/generated/${r.id}`,
    needs_review: r.status === 'needs_review',
    linked_ingredients: ingsByRecipe[r.id] || [],
  }))

  const classic = clsData.map(r => ({
    key: `cls-${r.id}`,
    source: 'classic',
    id: r.id,
    title: r.name,
    description: r.description,
    image_url: null,
    prep_min: r.prep_time_minutes,
    cook_min: r.cook_time_minutes,
    servings: r.servings,
    rating: null,
    href: `/recipes/${r.id}`,
    linked_ingredients: clsIngsByRecipe[r.id] || [],
  }))

  // 4. Déduplication : une recette V3 validée prime sur les sources historiques.
  const deduped = dedupCatalog([...canonical, ...generated, ...classic])

  // 5. Disponibilité face au stock (miroir de l'ancien calcul client).
  //    Si le stock n'a pas pu être lu, availability = null (l'UI dégrade en « mut »).
  let availabilityByKey = null
  if (!invResult.error) {
    const inv = invResult.data || []

    // archetype d'un lot → canonique + noms des ingrédients liés, en parallèle.
    const lotArcheIds = [...new Set(inv.filter(l => l.archetype_id).map(l => l.archetype_id))]
    const canonIds = new Set(inv.filter(lot => lot.canonical_food_id).map(lot => lot.canonical_food_id))
    const archeNameIds = new Set()
    deduped.forEach(r => (r.linked_ingredients || []).forEach(ing => {
      if (ing.canonical_food_id) canonIds.add(ing.canonical_food_id)
      if (ing.archetype_id) archeNameIds.add(ing.archetype_id)
    }))
    const requestedArcheIds = [...new Set([...lotArcheIds, ...archeNameIds])]

    const [archeMapResult, canonNameResult] = await Promise.all([
      requestedArcheIds.length
        ? supabase.from('archetypes').select('id, canonical_food_id, name').in('id', requestedArcheIds)
        : Promise.resolve({ data: [] }),
      canonIds.size
        ? supabase.from('canonical_foods').select('id, canonical_name').in('id', [...canonIds])
        : Promise.resolve({ data: [] }),
    ])

    const archetypeMapping = {}
    ;(archeMapResult.data || []).forEach(a => { archetypeMapping[a.id] = a.canonical_food_id })
    const canonName = {}, archeName = {}
    ;(canonNameResult.data || []).forEach(c => { canonName[c.id] = c.canonical_name })
    ;(archeMapResult.data || []).forEach(a => { archeName[a.id] = a.name })
    const nameOf = (ing) => cap(ing.canonical_form_name || canonName[ing.canonical_food_id] || archeName[ing.archetype_id] || 'ingrédient')
    const inventoryWithNames = inv.map((lot) => ({
      ...lot,
      form_normalized_candidates: [
        canonName[lot.canonical_food_id],
        archeName[lot.archetype_id],
      ].filter(Boolean).map(normalizeFoodForm),
    }))

    const now = new Date()
    availabilityByKey = {}
    for (const recipe of deduped) {
      const s = computeRecipeAvailability(recipe, inventoryWithNames, archetypeMapping, nameOf, now)
      availabilityByKey[recipe.key] = {
        status: availabilityStatusOf(s),
        missing_count: s.missing,
        expiring_count: s.urgent,
        ...s,
      }
    }
  }

  // 6. Réponse : cartes prêtes à afficher (sans la liste d'ingrédients, inutile à l'UI).
  const recipesOut = deduped.map(({ linked_ingredients, ...card }) => ({
    ...card,
    availability: availabilityByKey ? (availabilityByKey[card.key] || null) : null,
  }))

  return NextResponse.json({
    recipes: recipesOut,
    canonical_catalog: operationalCatalog.metadata,
  })
}
