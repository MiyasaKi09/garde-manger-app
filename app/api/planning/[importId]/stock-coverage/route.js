import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { loadResolverData, resolveIngredient, normalizeFood } from '@/lib/ingredientResolver'
import { parsePlanMeal } from '@/lib/recipeImporter'
import {
  aggregateStockByCanonical,
  matchGeneratedRecipe,
  computeDishCoverage,
} from '@/lib/stockCoverage'

export const dynamic = 'force-dynamic'

/**
 * GET /api/planning/[importId]/stock-coverage
 *
 * « Ai-je tout en stock pour faire chaque repas du planning ? »
 * Renvoie, par repas (déjeuner / dîner), un statut de couverture par le stock
 * ACTUEL de l'utilisateur — sans aucun appel IA, 100 % déterministe.
 *
 * Algo de résolution des ingrédients d'un plat (par ordre de priorité) :
 *   1. batch_recipe_id → parse nutrition_plan_batch_recipes.ingredients (texte,
 *      séparateurs « · », « + », retours ligne) → resolveIngredient.
 *   2. sinon matchGeneratedRecipe(description) ; si fiche trouvée → ses
 *      generated_recipe_ingredients DÉJÀ résolus (préchargés en une requête) ;
 *      sinon résoudre recipe.ingredients (jsonb) via resolveIngredient.
 *   3. sinon parsePlanMeal(description) → resolveIngredient de chaque ingrédient.
 *   4. si 0 ingrédient résoluble → status 'unknown' / reason 'no_recipe'.
 *
 * Perf : une requête par table ; résolution mise en cache par SIGNATURE de plat
 * (b:<batchId> sinon normalizeFood(short_label||description)) et mappée à chaque
 * meal.id partageant cette signature.
 *
 * Limites : couverture évaluée INDÉPENDAMMENT par recette (le stock n'est pas
 * réservé entre repas de la semaine).
 */

const STAPLE_CATEGORY_NAMES = new Set(['epices', 'huiles', 'edulcorants'])
const BATCH_SPLIT = /·|\n|\+/

export async function GET(request, { params }) {
  try {
    const { supabase, user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: authError || 'Non authentifié' }, { status: 401 })
    }

    const { importId } = await params

    // Propriété de l'import (RLS + contrôle explicite → 404 si absent/autre user).
    const { data: imp } = await supabase
      .from('nutrition_plan_imports')
      .select('id')
      .eq('id', importId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!imp) {
      return NextResponse.json({ error: 'Import introuvable' }, { status: 404 })
    }

    // Chargements parallèles (une requête par table).
    const [
      { data: meals },
      resolverData,
      { data: cfs },
      { data: cats },
      { data: archs },
      { data: stockLots },
      { data: batchRecipes },
      { data: recipes },
    ] = await Promise.all([
      supabase
        .from('nutrition_plan_meals')
        .select('*')
        .eq('import_id', importId)
        .in('meal_type', ['dejeuner', 'diner']),
      loadResolverData(supabase, user.id),
      supabase
        .from('canonical_foods')
        .select('id, canonical_name, category_id, unit_weight_grams, density_g_per_ml'),
      supabase.from('reference_categories').select('id, name'),
      supabase.from('archetypes').select('id, canonical_food_id'),
      supabase
        .from('inventory_lots_resolved')
        .select('resolved_canonical_food_id, resolved_archetype_id, qty_remaining, unit')
        .eq('user_id', user.id)
        .gt('qty_remaining', 0),
      supabase.from('nutrition_plan_batch_recipes').select('id, name, ingredients').eq('import_id', importId),
      supabase
        .from('generated_recipes')
        .select('id, title, name_normalized, ingredients')
        .eq('user_id', user.id),
    ])

    const { candidates, stock } = resolverData

    // Index meta canonical : id → { category_id, unit_weight_grams, density…, name }.
    const canonicalMetaById = new Map()
    for (const c of cfs || []) {
      canonicalMetaById.set(c.id, {
        category_id: c.category_id ?? null,
        unit_weight_grams: c.unit_weight_grams ?? null,
        density_g_per_ml: c.density_g_per_ml ?? null,
        canonical_name: c.canonical_name || '',
      })
    }

    // archetypeId → canonicalId.
    const archetypeCanonicalMap = new Map()
    for (const a of archs || []) {
      if (a.canonical_food_id != null) archetypeCanonicalMap.set(a.id, a.canonical_food_id)
    }

    // Catégories staples (Épices / Huiles / Édulcorants) → ids.
    const stapleCategoryIds = new Set()
    for (const cat of cats || []) {
      if (STAPLE_CATEGORY_NAMES.has(normalizeFood(cat.name))) stapleCategoryIds.add(cat.id)
    }

    // Stock agrégé par canonical.
    const stockByCanonical = aggregateStockByCanonical(stockLots || [], canonicalMetaById, archetypeCanonicalMap)

    const batchById = new Map((batchRecipes || []).map(b => [b.id, b]))
    const recipeList = recipes || []

    // ── Préchargement des generated_recipe_ingredients des fiches matchées ──
    // 1er passage : déterminer la fiche matchée par signature pour collecter
    // les recipe ids à batch-loader en UNE requête.
    const matchCache = new Map() // signature → fiche|null|undefined (undefined = pas batch)
    const signatureOfMeal = new Map() // meal.id → signature
    const wantRecipeIds = new Set()

    for (const m of meals || []) {
      const sig = m.batch_recipe_id ? `b:${m.batch_recipe_id}` : normalizeFood(m.short_label || m.description || '')
      signatureOfMeal.set(m.id, sig)
      if (matchCache.has(sig)) continue
      if (m.batch_recipe_id) {
        matchCache.set(sig, undefined) // signature batch (pas de fiche)
        continue
      }
      const hit = matchGeneratedRecipe(m.short_label || m.description || '', recipeList)
      matchCache.set(sig, hit || null)
      if (hit) wantRecipeIds.add(hit.id)
    }

    // Batch-load de TOUS les ingrédients résolus des fiches matchées.
    const genIngsByRecipe = new Map()
    if (wantRecipeIds.size) {
      const { data: genIngs } = await supabase
        .from('generated_recipe_ingredients')
        .select('generated_recipe_id, raw_name, quantity, unit, canonical_food_id, archetype_id')
        .in('generated_recipe_id', [...wantRecipeIds])
      for (const gi of genIngs || []) {
        if (!genIngsByRecipe.has(gi.generated_recipe_id)) genIngsByRecipe.set(gi.generated_recipe_id, [])
        genIngsByRecipe.get(gi.generated_recipe_id).push(gi)
      }
    }

    // ── Résolution + couverture par signature (cache) ──
    const coverageBySig = new Map()

    const resolveList = (list) =>
      (list || []).map(raw => resolveIngredient(raw, { candidates, stock }))

    for (const m of meals || []) {
      const sig = signatureOfMeal.get(m.id)
      if (coverageBySig.has(sig)) continue

      let resolvedIngredients = []

      if (m.batch_recipe_id && batchById.has(m.batch_recipe_id)) {
        // 1. Batch : parse le texte des ingrédients.
        const txt = batchById.get(m.batch_recipe_id).ingredients || ''
        const parts = txt.split(BATCH_SPLIT).map(s => s.trim()).filter(Boolean)
        resolvedIngredients = resolveList(parts)
      } else {
        const hit = matchCache.get(sig)
        if (hit) {
          // 2a. Fiche matchée → ingrédients déjà résolus (préchargés).
          const pre = genIngsByRecipe.get(hit.id)
          if (pre && pre.length) {
            resolvedIngredients = pre
          } else {
            // 2b. Pas de lignes résolues → résoudre la jsonb ingredients de la fiche.
            resolvedIngredients = resolveList(hit.ingredients)
          }
        } else {
          // 3. Repli : parse la description du repas.
          const parsed = parsePlanMeal(m.description || '')
          if (parsed?.ingredients?.length) {
            resolvedIngredients = resolveList(parsed.ingredients)
          }
        }
      }

      // Ne garder que les ingrédients réellement résolubles (canonical/archetype).
      const usable = resolvedIngredients.filter(
        i => i && (i.canonical_food_id || i.archetype_id != null),
      )

      if (!usable.length) {
        coverageBySig.set(sig, { status: 'unknown', have: 0, need: 0, missing: [], staplesMissing: [], reason: 'no_recipe' })
        continue
      }

      const cov = computeDishCoverage(usable, {
        stockByCanonical,
        canonicalMetaById,
        archetypeCanonicalMap,
        stapleCategoryIds,
      })
      coverageBySig.set(sig, cov)
    }

    // ── Mapping par meal.id + summary ──
    const mealsOut = {}
    const summary = { full: 0, partial: 0, none: 0, unknown: 0 }
    for (const m of meals || []) {
      const sig = signatureOfMeal.get(m.id)
      const cov = coverageBySig.get(sig) || { status: 'unknown', have: 0, need: 0, missing: [], staplesMissing: [], reason: 'no_recipe' }
      mealsOut[String(m.id)] = cov
      summary[cov.status] = (summary[cov.status] || 0) + 1
    }

    return NextResponse.json({
      import_id: Number(importId),
      generated_at: new Date().toISOString(),
      meals: mealsOut,
      summary,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
