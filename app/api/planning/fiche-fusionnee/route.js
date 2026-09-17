import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/apiAuth'
import { getEditorialRecipe } from '@/lib/db/operationalRecipeCatalog'
import { RAISONS, declarationFusion, ficheFusionnee } from '@/lib/domain/recipes/ficheFusionnee'

export const dynamic = 'force-dynamic'

const CODE = /^[a-z0-9-]+$/i

/**
 * GET /api/planning/fiche-fusionnee — la fiche de cuisine d'un couple
 * (plat carné, jumeau végétarien de même lignée), livrable 2.3.
 *
 * LECTURE SEULE. Rien n'est écrit, rien n'est réservé : cette route sert un
 * découpage d'étapes et une liste d'ingrédients, elle ne décide d'aucun repas.
 *
 * ELLE NE FUSIONNE PAS PLUS QUE CE QUI EST DÉCLARÉ. Le couple est cherché dans
 * `data/recipes/arbitrations/fiches-fusionnees.json` AVANT toute lecture de
 * base : un couple non déclaré rend son refus en 200 avec sa raison, sans
 * charger deux recettes pour rien. Un couple déclaré non fusionnable rend le
 * motif de la relecture, que l'écran affiche tel quel — c'est ce qui permet à
 * l'utilisateur de savoir POURQUOI deux casseroles sont nécessaires, au lieu de
 * conclure que l'application ne sait pas fusionner.
 *
 * LES PORTIONS SONT CELLES DE CHAQUE BRANCHE. `portionsA` et `portionsB` sont
 * les parts réellement servies pour les codes `a` et `b` ; chaque recette est
 * mise à l'échelle de sa branche avant la fusion, et la casserole commune
 * reçoit la somme. Sans elles, on servirait les portions d'écriture du corpus
 * — six parts de basquaise pour un dîner à deux.
 *
 * LES PARAMÈTRES SUIVENT `a` ET `b`, PAS LES RÔLES. L'écran qui appelle a deux
 * codes et deux assiettes ; il ne sait pas — et n'a pas à savoir — lequel des
 * deux est le plat carné. C'est l'arbitrage qui le dit, et c'est ici que les
 * portions sont remises sur la bonne branche.
 */
export async function GET(request) {
  const { supabase, user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const url = new URL(request.url)
  const premier = String(url.searchParams.get('a') || '').trim()
  const second = String(url.searchParams.get('b') || '').trim()
  if (!CODE.test(premier) || !CODE.test(second)) {
    return NextResponse.json({ error: 'Deux codes recette sont requis (a, b)' }, { status: 400 })
  }

  const declaration = declarationFusion(premier, second)
  if (!declaration) {
    return NextResponse.json({
      fusionnee: false,
      raison: {
        code: RAISONS.NON_DECLARE,
        message: `Le couple ${premier} / ${second} n'a pas été relu : aucune fusion n'est déclarée pour lui.`,
      },
    })
  }

  const parts = (nom) => {
    const valeur = Number(url.searchParams.get(nom))
    return Number.isFinite(valeur) && valeur > 0 && valeur <= 24 ? valeur : null
  }
  const mangeurs = (nom) => String(url.searchParams.get(nom) || '')
    .split(',').map((item) => item.trim()).filter(Boolean).slice(0, 8)

  // Remise des paramètres sur la branche que l'arbitrage désigne.
  const aEstCarne = declaration.carne.toUpperCase() === premier.toUpperCase()
  const portionsCarne = aEstCarne ? parts('portionsA') : parts('portionsB')
  const portionsVege = aEstCarne ? parts('portionsB') : parts('portionsA')
  const mangeursCarne = aEstCarne ? mangeurs('mangeursA') : mangeurs('mangeursB')
  const mangeursVege = aEstCarne ? mangeurs('mangeursB') : mangeurs('mangeursA')

  try {
    const [carne, vege] = await Promise.all([
      getEditorialRecipe(supabase, declaration.carne, { servings: portionsCarne, includeComponents: false }),
      getEditorialRecipe(supabase, declaration.vege, { servings: portionsVege, includeComponents: false }),
    ])
    if (!carne || !vege) {
      return NextResponse.json({
        fusionnee: false,
        raison: {
          code: RAISONS.RECETTE_MANQUANTE,
          message: `Le catalogue ne sert pas ${!carne ? declaration.carne : declaration.vege} : la fiche ne peut pas être fusionnée.`,
        },
      })
    }

    return NextResponse.json(ficheFusionnee({ carne, vege, mangeursCarne, mangeursVege }), {
      // La fiche ne dépend que du corpus et des portions demandées : elle se
      // cache brièvement côté navigateur, comme la fiche canonique.
      headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=1800' },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Fiche indisponible' }, { status: 500 })
  }
}
