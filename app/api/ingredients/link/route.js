import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { recomputeGeneratedNutrition } from '@/lib/generatedRecipeNutrition'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ingredients/link
 *
 * Correction MANUELLE du lien d'un ingrédient de recette générée : relie une
 * ligne `generated_recipe_ingredients` à un aliment (canonical OU archetype) —
 * ou la marque comme non stockable — puis recalcule la nutrition CIQUAL de la
 * recette. Sert à l'outil de réparation côté fiche recette.
 *
 *   body: { generated_recipe_ingredient_id, canonical_food_id? | archetype_id? | none?:true }
 *
 * Propriété garantie par la RLS : le SELECT/UPDATE ne renvoie la ligne que si la
 * recette parente appartient à l'utilisateur.
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  const { generated_recipe_ingredient_id, canonical_food_id, archetype_id, none } = body || {}

  if (!generated_recipe_ingredient_id) {
    return NextResponse.json({ error: 'generated_recipe_ingredient_id requis' }, { status: 400 })
  }
  if (!none && !canonical_food_id && !archetype_id) {
    return NextResponse.json({ error: 'canonical_food_id, archetype_id ou none requis' }, { status: 400 })
  }

  // 1. Charger la ligne (RLS : seulement si la recette appartient à l'utilisateur)
  const { data: row, error: rowErr } = await supabase
    .from('generated_recipe_ingredients')
    .select('id, generated_recipe_id')
    .eq('id', generated_recipe_ingredient_id)
    .maybeSingle()
  if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'Ingrédient introuvable' }, { status: 404 })

  // 2. Mettre à jour le lien. Contrainte gri_not_both_entities : une seule entité.
  let update
  if (none) {
    update = { canonical_food_id: null, archetype_id: null, match_status: 'unmatched' }
  } else if (archetype_id) {
    update = { canonical_food_id: null, archetype_id, match_status: 'archetype' }
  } else {
    update = { canonical_food_id, archetype_id: null, match_status: 'canonical' }
  }

  const { data: updated, error: updErr } = await supabase
    .from('generated_recipe_ingredients')
    .update(update)
    .eq('id', generated_recipe_ingredient_id)
    .select('id, raw_name, quantity, unit, match_status, canonical_food_id, archetype_id')
    .maybeSingle()
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  // 3. Recalcul nutritionnel de la recette
  let nutrition = null
  try {
    nutrition = await recomputeGeneratedNutrition(supabase, row.generated_recipe_id)
  } catch {
    // best-effort : la liaison est faite même si le recalcul échoue
  }

  return NextResponse.json({ ingredient: updated, nutrition })
}
