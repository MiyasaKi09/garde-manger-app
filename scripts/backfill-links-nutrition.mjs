#!/usr/bin/env node
/**
 * Backfill one-shot — relie TOUS les ingrédients des recettes générées et
 * recalcule la nutrition CIQUAL.
 *
 * Répare l'existant écrit par la Routine claude.ai (qui contournait le pipeline
 * de l'app) : noms d'ingrédients re-parsés proprement, unités normalisées
 * (pièces / cuillères…), liens stock recréés, nutrition dérivée du canonique.
 *
 * Utilise le résolveur déterministe (lib/ingredientResolver) et la RPC
 * `calculate_generated_recipe_nutrition` (lib/generatedRecipeNutrition) — les
 * MÊMES que l'app, donc résultat identique au self-heal / bouton « Réparer ».
 *
 * Pré-requis (variables d'env, ou fichier .env à la racine) :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (service role : bypass RLS, écrit pour tous)
 *
 * Usage :
 *   node scripts/backfill-links-nutrition.mjs            # tous les utilisateurs
 *   node scripts/backfill-links-nutrition.mjs <user_id>  # un seul utilisateur
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { linkRecipesForUser } from '../lib/ingredientResolver.js'
import { recomputeGeneratedNutritionBatch } from '../lib/generatedRecipeNutrition.js'

// Chargement .env minimal (sans dépendance) si présent.
try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* pas de .env : on s'appuie sur l'environnement */ }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {
  const onlyUser = process.argv[2] || null

  let userIds = []
  if (onlyUser) {
    userIds = [onlyUser]
  } else {
    const { data, error } = await supabase
      .from('generated_recipes')
      .select('user_id')
    if (error) throw new Error(`Lecture utilisateurs: ${error.message}`)
    userIds = [...new Set((data || []).map(r => r.user_id).filter(Boolean))]
  }

  console.log(`→ ${userIds.length} utilisateur(s) à traiter`)

  let totalRecipes = 0
  let totalMatched = 0
  let totalIng = 0
  let totalNutrition = 0

  for (const userId of userIds) {
    // 1. Re-liaison COMPLÈTE (onlyUnlinked:false → relie aussi l'existant corrompu)
    const res = await linkRecipesForUser(supabase, userId, { all: true, onlyUnlinked: false })
    totalRecipes += res.recipes
    totalMatched += res.ingredients_matched
    totalIng += res.ingredients_total

    // 2. Recalcul nutritionnel CIQUAL de toutes les recettes (re)liées
    const ids = (res.details || []).map(d => d.recipe_id).filter(Boolean)
    const nut = await recomputeGeneratedNutritionBatch(supabase, ids)
    totalNutrition += nut.updated

    console.log(
      `  • ${userId.slice(0, 8)}… : ${res.recipes} recettes, ` +
      `liaison ${res.match_rate}% (${res.ingredients_matched}/${res.ingredients_total}), ` +
      `nutrition ${nut.updated} maj${nut.failed ? `, ${nut.failed} échecs` : ''}`
    )
  }

  console.log(
    `✓ Terminé : ${totalRecipes} recettes, ` +
    `${totalIng ? Math.round((totalMatched / totalIng) * 100) : 0}% d'ingrédients liés, ` +
    `${totalNutrition} nutritions recalculées.`
  )
}

main().catch(err => {
  console.error('✗ Échec backfill:', err.message)
  process.exit(1)
})
