import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { normalizeRecipeName } from '@/lib/recipeNormalizer'

export const dynamic = 'force-dynamic'

// Lecture seule des fiches déjà générées par la routine. AUCUN appel Anthropic.
//
// GET /api/recipes/generated?id=<generated_recipe_id>
//   Fetch exact par id (scopé utilisateur) — chemin FK-first : les repas v5
//   portent nutrition_plan_meals.generated_recipe_id.
//
// GET /api/recipes/generated?q=<description du repas>
//   Repli fuzzy : matche la description du repas à la meilleure fiche
//   generated_recipes de l'utilisateur par recouvrement de mots (le titre de
//   la fiche est une forme courte de la description, pas une égalité stricte).

const STOPWORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'aux', 'au', 'a', 'et', 'en',
  'l', 'd', 'un', 'une', 'sur', 'fines', 'maison', 'facon', 'fine',
  'portion', 'julien', 'zoe',
])

function tokens(str) {
  return normalizeRecipeName(str || '')
    .split('-')
    .filter(t => t.length >= 3 && !STOPWORDS.has(t))
}

export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const RECIPE_COLUMNS =
    'id,title,name_normalized,description,servings,prep_min,cook_min,ingredients,steps,chef_tips,nutrition_per_serving'

  // ── Chemin exact par id (FK des repas v5) ──
  const id = request.nextUrl.searchParams.get('id')
  if (id) {
    const { data: recipe, error } = await supabase
      .from('generated_recipes')
      .select(RECIPE_COLUMNS)
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) {
      return NextResponse.json({ error: 'Erreur lecture recette' }, { status: 500 })
    }
    if (!recipe) {
      return NextResponse.json({ error: 'Fiche recette introuvable' }, { status: 404 })
    }
    return NextResponse.json({ recipe })
  }

  // ── Repli fuzzy par description ──
  const q = request.nextUrl.searchParams.get('q') || ''
  if (!q.trim()) {
    return NextResponse.json({ error: 'Paramètre id ou q requis' }, { status: 400 })
  }

  const { data: recipes, error } = await supabase
    .from('generated_recipes')
    .select(RECIPE_COLUMNS)
    .eq('user_id', user.id)
  if (error) {
    return NextResponse.json({ error: 'Erreur lecture recettes' }, { status: 500 })
  }
  if (!recipes?.length) {
    return NextResponse.json({ error: 'Aucune fiche recette' }, { status: 404 })
  }

  const qSet = new Set(tokens(q))
  let best = null
  let bestScore = 0
  for (const r of recipes) {
    const rTokens = tokens(r.name_normalized || r.title)
    if (!rTokens.length) continue
    const overlap = rTokens.filter(t => qSet.has(t)).length
    const ratio = overlap / rTokens.length
    // Score privilégiant les fiches dont les mots-clés sont dans le repas.
    const score = overlap + ratio
    if (overlap > bestScore || (overlap === bestScore && best && ratio > best._ratio)) {
      bestScore = overlap
      best = { ...r, _ratio: ratio }
    }
  }

  // Au moins 2 mots-clés significatifs en commun pour éviter les faux positifs.
  if (!best || bestScore < 2) {
    return NextResponse.json(
      { error: 'Aucune fiche correspondante pour ce plat' },
      { status: 404 },
    )
  }

  delete best._ratio
  return NextResponse.json({ recipe: best })
}
