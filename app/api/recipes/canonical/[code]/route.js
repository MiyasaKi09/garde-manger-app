import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { getEditorialRecipe } from '@/lib/db/operationalRecipeCatalog'
import { blocNutritionPubliee } from '@/lib/domain/recipes/macrosParPortion'
import {
  decisionOptionCarnee,
  ingredientsApresDecision,
  optionsCarnees,
  phraseOptionCarnee,
} from '@/lib/domain/recipes/optionCarnee'

export const dynamic = 'force-dynamic'

const CODE = /^[a-z0-9-]+$/i

function requestedServings(request) {
  const value = Number(new URL(request.url).searchParams.get('portions'))
  return Number.isFinite(value) && value >= 1 && value <= 24 ? value : null
}

/**
 * Les mangeurs du créneau, quand l'écran les nomme.
 *
 * `?mangeurs=Julien,Zoé` : l'écran qui ouvre une fiche depuis le planning
 * connaît les assiettes du créneau, la fiche d'une recette ouverte depuis le
 * catalogue n'en a aucune. Sans paramètre, la décision porte sur TOUS les
 * membres actifs du foyer — c'est le périmètre honnête d'une fiche consultée
 * hors planning, et c'est ce que la réponse déclare dans
 * `option_carnee.perimetre`.
 */
function requestedEaters(request) {
  const brut = String(new URL(request.url).searchParams.get('mangeurs') || '').trim()
  if (!brut) return null
  const noms = brut.split(',').map((nom) => nom.trim()).filter(Boolean)
  return noms.length ? noms : null
}

/**
 * LA FICHE D'UNE RECETTE CANONIQUE — et les deux règles du livrable 3.6.
 *
 * P18, PREMIÈRE CLAUSE : les macros par portion viennent de
 * `blocNutritionPubliee`, la même fonction que lisent les deux autres écrans.
 * Elles ne sont plus recomposées ici.
 *
 * P18, SECONDE CLAUSE : ce bloc écrivait `Number(nutrition.kcal) || 0`. Une
 * valeur absente devenait **zéro kilocalorie**, un nombre, affiché avec le même
 * aplomb qu'une mesure — et indétectable ensuite. Il rend désormais `null` et un
 * CODE DE REFUS, exactement comme la couche prix rend
 * `couverture_masse_insuffisante` plutôt qu'un montant inventé.
 *
 * RÉSERVE (a) : l'option carnée facultative d'un plat végétarien — les lardons
 * de la salade de chèvre chaud, le thon des œufs mimosa — est AFFICHÉE, et elle
 * est RETIRÉE de la liste d'ingrédients dès qu'un mangeur du créneau a déclaré
 * manger moins de viande. Elle était jusqu'ici servie à tout le monde, marquée
 * « Facultatif » et rien de plus : `optionalNonVegetarian` était calculé par le
 * moteur et aucun écran ne le lisait (§2.4 du plan).
 */
function normalizeRecipe(recipe, { mangeurs = [], perimetre = 'foyer' } = {}) {
  const decision = decisionOptionCarnee({ recipe, mangeurs })
  const ingredients = ingredientsApresDecision(recipe, decision)
  return {
    id: `canonical-${recipe.code}`,
    code: recipe.code,
    title: recipe.family,
    name: recipe.family,
    description: [recipe.cuisineOrigin, recipe.category].filter(Boolean).join(' · '),
    prep_min: Number(recipe.prepMinutes) || 0,
    cook_min: Number(recipe.cookMinutes) || 0,
    servings: Number(recipe.servings) || 1,
    ...blocNutritionPubliee(recipe),
    ingredients: ingredients.map((ingredient) => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: ingredient.optional ? 'Facultatif' : null,
    })),
    // L'option est rendue MÊME retirée : une option retirée sans être nommée
    // serait un ingrédient disparu, et le plan demande qu'elle soit affichée.
    option_carnee: decision.options.length
      ? {
        options: decision.options.map((option) => ({
          name: option.name,
          quantity: option.quantity,
          unit: option.unit,
          origin: option.origin,
        })),
        retiree: decision.retiree,
        motif: decision.motif,
        declare_par: decision.declarePar,
        perimetre,
        phrase: phraseOptionCarnee(decision),
      }
      : null,
    steps: (recipe.exactSteps || []).map((step, index) => ({
      n: step.n || index + 1,
      instruction: step.instruction,
      duration_min: Number(step.duration_min ?? step.durationMinutes) || null,
    })),
    canonical: true,
  }
}

export async function GET(request, { params }) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const code = String(params.code || '').trim()
  if (!CODE.test(code)) return NextResponse.json({ error: 'Code recette invalide' }, { status: 400 })

  try {
    const recipe = await getEditorialRecipe(supabase, code, { servings: requestedServings(request) })
    if (!recipe) return NextResponse.json({ error: 'Recette introuvable' }, { status: 404 })

    // Les membres ne sont chargés QUE si la recette porte une option CARNÉE,
    // c'est-à-dire un ingrédient facultatif dont l'origine déclarée n'est pas
    // compatible avec un régime végétarien. Mesuré le 17 septembre 2026 sur les
    // 568 recettes publiables : 25 en portent une (12 végétariennes — la réserve
    // (a) du livrable 3.6 — et 13 déjà carnées). Sur les 543 autres, la décision
    // est sans objet : `decisionOptionCarnee` rendrait `options: []` quels que
    // soient les mangeurs, et l'aller-retour serait payé pour rien.
    //
    // ERRATUM DE RELECTURE. Cette garde testait `ingredient.optional` seul, et
    // le commentaire au-dessus annonçait pourtant « douze recettes publiables
    // sur cinq cent soixante-huit ». Les deux ne décrivaient pas le même
    // ensemble : 333 des 568 publiables portent au moins un ingrédient
    // facultatif — une herbe, un zeste, un accompagnement —, si bien que la
    // requête supplémentaire était faite sur 333 fiches au lieu de 25. La
    // réponse servie ne changeait pas d'un octet (sans option carnée,
    // `option_carnee` vaut déjà `null`) ; c'est le chiffre écrit qui ne
    // décrivait pas le code, et le coût annoncé qui n'était pas le coût payé.
    const porteUneOption = optionsCarnees(recipe).length > 0
    let mangeurs = []
    let perimetre = 'aucun'
    if (porteUneOption) {
      const { data: membres } = await supabase
        .from('household_members')
        .select('id, name, preferences')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at')
      const demandes = requestedEaters(request)
      const tous = membres || []
      mangeurs = demandes ? tous.filter((membre) => demandes.includes(membre.name)) : tous
      perimetre = demandes ? 'creneau' : 'foyer'
    }

    return NextResponse.json({ recipe: normalizeRecipe(recipe, { mangeurs, perimetre }) }, {
      // La réponse dépend désormais des membres et des mangeurs demandés : le
      // cache reste privé et court, et il est indexé par l'URL, qui porte
      // `mangeurs`. Un cache partagé servirait la fiche d'un foyer à un autre.
      headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=1800' },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Recette indisponible' }, { status: 500 })
  }
}
