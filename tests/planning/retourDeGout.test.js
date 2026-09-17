import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))

import { POST } from '@/app/api/meals/feedback/route'
import { authenticateRequest } from '@/lib/apiAuth'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { buildHouseholdTasteProfile, preferenceFromFeedback } from '@/lib/domain/planning/tastePreferences'

/**
 * LE RETOUR DE GOÛT, BRANCHÉ — livrable 3.3, critère P14.
 *
 * CE QUI MANQUAIT. La boucle était complète sauf son premier maillon :
 * `/api/meals/feedback` (92 lignes) écrit dans `meal_taste_feedback`, en tire
 * une préférence dans `member_food_preferences`, que `buildHouseholdTasteProfile`
 * relit et que le planificateur applique à chaque génération. Les deux tables
 * valaient 0 ligne pour une seule raison : `grep -rn "api/meals/feedback" app
 * components lib` ne renvoyait RIEN. Aucun écran n'appelait la route.
 *
 * LES DEUX MOITIÉS DU CRITÈRE, ET POURQUOI IL EN FAUT DEUX. « Des lignes non
 * nulles dans les deux tables » ne prouve rien tout seul : une table qui se
 * remplit sans que personne ne la lise est exactement le défaut qu'on vient de
 * retirer. Ce fichier mesure donc les deux : ce que la route ÉCRIT, et ce que la
 * génération suivante en FAIT.
 *
 * CE QUI N'EST PAS MESURÉ ICI. Le compte de lignes réellement présentes en base
 * — la CI n'a pas de base. Ce qui est vérifié, c'est que l'écriture part et
 * qu'elle porte les bonnes colonnes.
 */

const requete = (corps) => ({ json: async () => corps })

/**
 * Client Supabase minimal qui NOTE chaque table touchée. Le mock partagé ne
 * couvre pas `upsert` ; c'est aussi l'idiome de
 * `tests/planning/tempsSessionRoute.test.js`.
 */
function fauxClient({ erreurInsert = null } = {}) {
  const tables = []
  const inserts = []
  const upserts = []
  const from = vi.fn((table) => {
    tables.push(table)
    return {
      insert: (ligne) => {
        inserts.push({ table, ligne })
        return {
          select: () => ({
            single: async () => (erreurInsert
              ? { data: null, error: erreurInsert }
              : { data: { id: 1, ...ligne }, error: null }),
          }),
        }
      },
      upsert: (ligne, options) => {
        upserts.push({ table, ligne, options })
        return {
          select: () => ({ maybeSingle: async () => ({ data: ligne, error: null }) }),
        }
      },
    }
  })
  return { client: { from }, tables, inserts, upserts }
}

describe('POST /api/meals/feedback — ce que le geste écrit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exige une authentification', async () => {
    authenticateRequest.mockResolvedValue({ supabase: null, user: null, error: 'Non authentifié' })
    expect((await POST(requete({}))).status).toBe(401)
  })

  it('remplit les DEUX tables du critère P14 en un seul appel', async () => {
    const { client, tables, inserts, upserts } = fauxClient()
    authenticateRequest.mockResolvedValue({ supabase: client, user: { id: 'u1' }, error: null })

    const reponse = await POST(requete({
      household_member_id: 'm1',
      meal_date: '2026-09-24',
      meal_type: 'diner',
      canonical_recipe_code: 'FR-008',
      recipe_label: 'Bœuf bourguignon',
      appreciation: 'never_again',
    }))

    expect(reponse.status).toBe(201)
    expect(tables).toEqual(['meal_taste_feedback', 'member_food_preferences'])
    expect(inserts[0].ligne).toMatchObject({
      user_id: 'u1',
      household_member_id: 'm1',
      meal_date: '2026-09-24',
      meal_type: 'diner',
      canonical_recipe_code: 'FR-008',
      appreciation: 'never_again',
    })
    // La préférence porte le sujet « recipe » et l'aversion, jamais un interdit :
    // « plus jamais » est un dégoût, pas une allergie.
    expect(upserts[0].ligne).toMatchObject({
      user_id: 'u1',
      household_member_id: 'm1',
      subject_type: 'recipe',
      subject_value: 'fr 008',
      appreciation: 'disliked',
      strict: false,
    })
  })

  it('laisse NULL ce sur quoi personne ne s’est prononcé', async () => {
    const { client, inserts } = fauxClient()
    authenticateRequest.mockResolvedValue({ supabase: client, user: { id: 'u1' }, error: null })

    await POST(requete({
      household_member_id: 'm1', meal_date: '2026-09-24', meal_type: 'diner',
      canonical_recipe_code: 'FR-008', appreciation: 'loved',
    }))

    // Ne pas avoir dit « trop lourd » n'est pas avoir dit « pas trop lourd ».
    for (const axe of ['portion_fit', 'too_repetitive', 'too_heavy', 'too_light', 'side_dish_fit', 'note']) {
      expect(inserts[0].ligne[axe], axe).toBeNull()
    }
  })

  it('n’enrichit aucun profil quand le repas n’a pas de recette canonique', async () => {
    // Les petits-déjeuners et collations sont des rotations codées en dur (§8
    // du plan) : ils n'ont pas de code. Le retour se consigne, mais il n'y a
    // aucun sujet à apprendre — et la route le dit par `learned: null` plutôt
    // que d'inventer un sujet à partir du libellé affiché.
    const { client, tables } = fauxClient()
    authenticateRequest.mockResolvedValue({ supabase: client, user: { id: 'u1' }, error: null })

    const reponse = await POST(requete({
      household_member_id: 'm1', meal_date: '2026-09-24', meal_type: 'pdj', appreciation: 'loved',
    }))

    expect(reponse.status).toBe(201)
    expect(await reponse.json()).toMatchObject({ learned: null })
    expect(tables).toEqual(['meal_taste_feedback'])
  })

  it('refuse une appréciation hors du vocabulaire, sans rien écrire', async () => {
    const { client, tables } = fauxClient()
    authenticateRequest.mockResolvedValue({ supabase: client, user: { id: 'u1' }, error: null })

    const reponse = await POST(requete({
      household_member_id: 'm1', meal_date: '2026-09-24', meal_type: 'diner', appreciation: 'bof',
    }))
    expect(reponse.status).toBe(400)
    expect(tables).toEqual([])
  })

  it('dit que la migration manque au lieu de perdre le retour en silence', async () => {
    const { client } = fauxClient({ erreurInsert: { code: '42P01', message: 'relation absente' } })
    authenticateRequest.mockResolvedValue({ supabase: client, user: { id: 'u1' }, error: null })

    const reponse = await POST(requete({
      household_member_id: 'm1', meal_date: '2026-09-24', meal_type: 'diner',
      canonical_recipe_code: 'FR-008', appreciation: 'loved',
    }))
    expect(reponse.status).toBe(503)
  })
})

/**
 * LA SECONDE MOITIÉ DE P14 : « une génération postérieure à un avis négatif ne
 * ressert pas le plat. »
 *
 * On rejoue la chaîne réelle, sans base : ce que la route STOCKE
 * (`preferenceFromFeedback`, la fonction qu'elle appelle ligne 72) devient ce
 * que la génération LIT (`buildHouseholdTasteProfile`, la fonction que
 * `generate-v3/route.js` appelle pour chaque génération), et on replanifie la
 * même semaine avec les mêmes entrées.
 *
 * Les deux semaines sont planifiées UNE FOIS au niveau du `describe` : vingt
 * secondes par test en CI, et une recherche en faisceau de largeur 48 sur le
 * corpus en coûte plusieurs à elle seule. C'est le modèle de
 * `tests/planning/varieteSemaine.test.js`.
 */
const TARGET = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }
const DEBUT = '2026-09-21'

const semaine = (recipes, tasteProfile) => generateClosedLoopPlan({
  slots: buildWeekSlots(DEBUT),
  recipes,
  inventoryLots: [],
  constraints: {
    allowShopping: true,
    targetByMeal: { dejeuner: TARGET, diner: TARGET },
    maxMinutesByMeal: { dejeuner: 120, diner: 240 },
    preferredActiveMinutes: 30,
    ...(tasteProfile ? { tasteProfile } : {}),
  },
  beamWidth: 48,
})

describe('un avis négatif change la semaine suivante', () => {
  const recipes = getCanonicalRecipes({ servings: 2 })
  const avant = semaine(recipes, null)
  const codesAvant = avant.slots.map((slot) => slot.recipeCode)

  // Le plat le PLUS servi de la semaine : celui dont le retrait est le plus
  // exigeant pour le moteur. Refuser un plat servi une seule fois serait un
  // test complaisant.
  const comptes = new Map()
  for (const code of codesAvant) comptes.set(code, (comptes.get(code) || 0) + 1)
  const refuse = [...comptes.entries()]
    .sort((gauche, droite) => droite[1] - gauche[1] || String(gauche[0]).localeCompare(String(droite[0])))[0][0]

  // Exactement ce que la route écrit dans `member_food_preferences`.
  const preference = preferenceFromFeedback({
    appreciation: 'never_again',
    canonical_recipe_code: refuse,
    recipe_label: recipes.find((recette) => recette.code === refuse)?.family || refuse,
  })
  const profil = buildHouseholdTasteProfile([{
    household_member_id: 'm1', ...preference,
  }])
  const apres = semaine(recipes, profil)

  it('part d’une semaine qui sert bien le plat refusé', () => {
    // Le témoin : sans lui, « le plat n'est pas servi » pourrait n'être que le
    // moteur qui ne l'avait jamais choisi.
    expect(codesAvant).toContain(refuse)
  })

  it('traduit « plus jamais » en aversion, pas en interdit', () => {
    expect(preference).toMatchObject({ subject_type: 'recipe', appreciation: 'disliked', strict: false })
    expect(profil.isEmpty).toBe(false)
  })

  it('ne ressert pas le plat refusé à la génération suivante', () => {
    const codesApres = apres.slots.map((slot) => slot.recipeCode)
    expect(codesApres, `${refuse} servi ${comptes.get(refuse)} fois avant l’avis`).not.toContain(refuse)
  })

  it('remplit quand même les quatorze créneaux', () => {
    // Retirer un plat ne doit pas laisser un trou : un avis qui casse la semaine
    // ne serait pas un avis pris en compte, ce serait une panne.
    expect(apres.slots.length).toBe(14)
    expect(apres.slots.filter((slot) => slot.recipeCode).length).toBe(14)
  })
})
