import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { linkRecipesForUser } from '@/lib/ingredientResolver'
import { ensureRecipesForImport } from '@/lib/recipeImporter'
import { rebuildShoppingListFromImport } from '@/lib/shoppingListBuilder'
import { SOURCES, sourceDeVeriteDeLaListe } from '@/lib/domain/courses/sourceDeVerite'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/courses/rebuild  body: { importId? }
 *
 * LA ROUTE N'EST PAS SUPPRIMÉE — ELLE CONVERGE (livrable 4.5).
 *
 * Elle reconstruisait la liste de courses depuis les descriptions des repas,
 * en concurrence avec la demande canonique. Deux sources de vérité pour la même
 * liste, et la mesure dit laquelle perd : sur la semaine du 21 septembre 2026
 * réellement publiée au banc de `tests/courses/exportListe.test.js`, 100 articles
 * canoniques entrent et 11 lignes sortent, dont 0 reste visible à l'écran faute
 * de `plan_version_id`
 * (`lib/domain/courses/sourceDeVerite.js` porte la mesure complète,
 * `tests/courses/sourceDeVeriteListe.test.js` la rejoue).
 *
 * Elle est conservée parce qu'un plan ancien — importé avant la chaîne
 * canonique — n'a aucun autre moyen d'obtenir une liste reliée au stock. Une
 * route supprimée lui rendrait une liste vide sans rien dire.
 *
 * Elle commence donc par LIRE qui détient la liste :
 *   — demande canonique → elle n'écrit RIEN et le déclare (`converged: true`) ;
 *   — chemin hérité (aucune ligne canonique) → elle reconstruit comme avant.
 *
 * La lecture est faite ici, côté serveur, et pas déduite du corps de la requête :
 * un appelant ne peut pas se déclarer hérité pour obtenir l'écrasement.
 */
export async function POST(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body = {}
  try { body = await request.json() } catch {}
  let importId = body?.importId

  // Dernier import si non fourni
  if (!importId) {
    const { data: imports } = await supabase
      .from('nutrition_plan_imports')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
    importId = imports?.[0]?.id
  }
  if (!importId) {
    return NextResponse.json({ error: 'Aucun plan à recalculer' }, { status: 404 })
  }

  // ── La convergence : qui détient la liste de cet import ? ──────────────────
  // RLS scope la lecture à l'utilisateur via import_id → nutrition_plan_imports.
  const { data: lignes, error: lectureError } = await supabase
    .from('nutrition_plan_shopping_items')
    .select('plan_version_id, planning_source, purchase_qty, purchase_unit, container_qty, container_size, container_unit, aisle_order, shopping_status, exact_required_qty')
    .eq('import_id', importId)

  if (lectureError) {
    // On ne reconstruit pas « dans le doute » : une lecture qui échoue ne dit
    // pas que la liste est héritée, elle ne dit rien. Écraser sur un silence
    // serait exactement la faute qu'on corrige.
    return NextResponse.json({ error: `Source de la liste indéterminée — ${lectureError.message}` }, { status: 503 })
  }

  const verite = sourceDeVeriteDeLaListe(lignes)
  if (verite.source === SOURCES.CANONIQUE) {
    return NextResponse.json({
      success: true,
      importId,
      converged: true,
      mode: 'demande_canonique',
      source: verite.source,
      items: verite.total,
      canoniques: verite.canoniques,
      heritees: verite.heritees,
      colonnesPreservees: verite.colonnesPerdues,
    })
  }

  try {
    // 1. Faire grossir la base : créer/dédupliquer les recettes du plan (sans API)
    const recipeSync = await ensureRecipesForImport(supabase, user.id, importId)
    // 2. Relier les ingrédients (auto-création conservatrice des canoniques)
    await linkRecipesForUser(supabase, user.id, { onlyUnlinked: true })
    // 3. Enrichir la liste de courses (non destructeur : marque « déjà en stock »)
    const result = await rebuildShoppingListFromImport(supabase, user.id, importId)
    if (result.aborted) {
      return NextResponse.json({
        error: result.reason, aborted: true,
        recipesCreated: recipeSync.created, recipesMatched: recipeSync.matched,
      })
    }
    return NextResponse.json({
      success: true, importId,
      converged: false,
      source: verite.source,
      items: result.items, mode: result.mode, inStock: result.inStock,
      recipesCreated: recipeSync.created, recipesMatched: recipeSync.matched,
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
