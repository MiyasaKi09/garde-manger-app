import { materializeOperationalCatalog } from '@/lib/domain/recipes/operationalCatalog'

/**
 * CE QUE LA RPC OPÉRATIONNELLE ACCEPTE, relevé ligne à ligne dans
 * `supabase/migrations/20260715190000_v3_operational_recipe_api.sql` :
 *
 *   ligne 108 — LIMIT  greatest(1, least(coalesce(p_limit, 100), 100))
 *   ligne 109 — OFFSET greatest(0, least(coalesce(p_offset, 0), 10000))
 *
 * Le plafond de PAGE est doublement dur : demander 500 ne rend pas 500, il rend
 * 100 — sans erreur, sans avertissement, et le `ORDER BY code` fait que ce sont
 * toujours les MÊMES cent. Le plafond d'OFFSET, lui, est à 10 000 : la
 * pagination est donc possible sans toucher à la base, et c'est exactement ce
 * que fait `listOperationalRecipes` ci-dessous.
 *
 * Mesuré en base le 17 septembre 2026 (projet de production, avant la migration
 * de corpus 0a.2) : 324 recettes qualifient, 100 sont rendues. Les 224 absentes
 * se répartissent en 214 codes `SRC-`, 6 `VEG-` et 4 `REAL-` — c'est-à-dire
 * l'intégralité des reprises et des recettes végétariennes versées depuis
 * juillet. Le planificateur ne les avait jamais vues.
 *
 * COÛT ASSUMÉ. Paginer, c'est N/100 allers-retours au lieu d'un, et chaque
 * appel rejoue la CTE `qualified` en entier — mesurée à 80 ms sur les 324
 * lignes d'aujourd'hui par EXPLAIN ANALYZE, hors assemblage JSON des
 * ingrédients et des étapes (la RPC elle-même exige `auth.uid()` et n'a donc
 * pas pu être chronométrée depuis un outil d'administration). Écarté :
 * relever le plafond de la RPC, qui demanderait une migration — 0a.3 dit
 * explicitement qu'aucune migration n'est nécessaire à cette étape, et le
 * contrat opérationnel de la phase 0b rouvrira ce fichier de toute façon.
 */
export const OPERATIONAL_CATALOG_PAGE_SIZE = 100
export const OPERATIONAL_CATALOG_MAX_OFFSET = 10000

/**
 * Catalogue opérationnel COMPLET, page après page, jusqu'à épuisement.
 *
 * La signature ne porte volontairement plus de `limit` : un appelant qui écrit
 * `{ servings }` — les deux sites de planning le font — reçoit désormais tout
 * ce qui qualifie, et il n'existe plus de réglage qui ramène silencieusement le
 * vivier à cent. Ce qui borne la boucle est nommé :
 *
 *   - `pageSize`   : taille de page demandée, ramenée au plafond dur de 100 ;
 *   - `maxRecipes` : arrêt volontaire après N recettes (null = épuisement) ;
 *   - le plafond d'OFFSET de la base, au-delà duquel la RPC reservirait la
 *     même page indéfiniment.
 *
 * Chacun des trois est INSCRIT dans `metadata.stoppedBy`, et `metadata.complete`
 * dit si le catalogue a été lu en entier. Une troncature se lit ; elle ne se
 * devine pas.
 */
export async function listOperationalRecipes(supabase, {
  code = null,
  offset = 0,
  servings = null,
  pageSize = OPERATIONAL_CATALOG_PAGE_SIZE,
  maxRecipes = null,
} = {}) {
  if (!supabase) throw new Error('Client Supabase authentifié requis')

  const size = Math.max(1, Math.min(Math.trunc(Number(pageSize)) || OPERATIONAL_CATALOG_PAGE_SIZE, OPERATIONAL_CATALOG_PAGE_SIZE))
  const requestedMax = Math.trunc(Number(maxRecipes))
  const ceiling = Number.isFinite(requestedMax) && requestedMax > 0 ? requestedMax : Infinity
  const startOffset = Math.max(0, Math.trunc(Number(offset)) || 0)

  const records = []
  const seenCodes = new Set()
  let firstPayload = null
  let pageOffset = startOffset
  let pageCount = 0
  let stoppedBy = 'catalogue_epuise'

  while (true) {
    const { data, error } = await supabase.rpc('get_operational_recipe_catalog_v3', {
      p_code: code,
      p_limit: size,
      p_offset: pageOffset,
    })
    if (error) throw new Error(`Catalogue recettes V3 indisponible: ${error.message}`)
    pageCount += 1
    if (firstPayload === null) firstPayload = data

    const page = Array.isArray(data?.recipes) ? data.recipes : []
    // Un code déjà vu ne peut venir que du plafond d'OFFSET : passé 10 000, la
    // base rabote la valeur et reservirait éternellement la même page. On
    // s'arrête et on le dit, plutôt que de boucler ou de servir deux fois les
    // mêmes plats au solveur.
    const fresh = page.filter((record) => {
      const key = record?.code
      if (!key || seenCodes.has(key)) return false
      seenCodes.add(key)
      return true
    })
    records.push(...fresh)

    if (fresh.length < page.length) { stoppedBy = 'page_deja_servie'; break }
    // La RPC déclare elle-même combien de recettes qualifient (`eligibleCount`).
    // On s'arrête dès qu'on les a toutes, au lieu de réclamer une page vide
    // pour s'en apercevoir : sur un catalogue multiple de cent, cet aller-retour
    // de trop rejouerait pour rien la CTE de qualification (80 ms mesurées sur
    // les 324 lignes d'aujourd'hui).
    const declaredOnPage = Number(data?.metadata?.eligibleCount)
    if (Number.isFinite(declaredOnPage) && records.length >= Math.max(0, declaredOnPage - startOffset)) break
    if (page.length < size) break
    if (records.length >= ceiling) { stoppedBy = 'max_recettes_atteint'; break }
    pageOffset += size
    if (pageOffset > OPERATIONAL_CATALOG_MAX_OFFSET) { stoppedBy = 'offset_max_atteint'; break }
  }

  const kept = Number.isFinite(ceiling) ? records.slice(0, ceiling) : records
  // `eligibleCount` est déclaré par la RPC elle-même (ligne 250 de la
  // migration) : c'est le nombre de recettes qui qualifient, toutes pages
  // confondues. On s'en sert pour dire si la lecture est complète au lieu de
  // le supposer. Absent (RPC plus ancienne), on ne fabrique pas le chiffre :
  // le verdict repose alors sur la seule raison d'arrêt.
  const declaredEligible = Number(firstPayload?.metadata?.eligibleCount)
  const eligibleCount = Number.isFinite(declaredEligible) ? declaredEligible : null
  //
  // `complete` répond à UNE question : « le catalogue a-t-il été lu en entier
  // depuis `offset` ? » — et non « a-t-on obtenu ce qu'on demandait ». La
  // nuance n'est pas théorique : une lecture volontairement bornée à 150 sur
  // 500 rendait « complète » sous la première rédaction de ce fichier, et le
  // consommateur n'avait alors aucun moyen de distinguer un vivier entier d'un
  // vivier coupé. C'est précisément le défaut qu'on retire.
  const expected = eligibleCount === null ? null : Math.max(0, eligibleCount - startOffset)
  const complete = expected === null
    ? stoppedBy === 'catalogue_epuise'
    : kept.length >= expected

  return materializeOperationalCatalog({
    ...firstPayload,
    metadata: {
      ...(firstPayload?.metadata || {}),
      limit: size,
      offset: startOffset,
      pageSize: size,
      pageCount,
      // Le chiffre du critère 0a.3 : combien de recettes la génération a
      // réellement REÇUES. Il voyage jusqu'au résumé de
      // `app/api/planning/generate-v3/route.js`, où il est journalisé à chaque
      // génération — c'est la seule mesure qui distingue un vivier élargi d'un
      // plafond revenu en silence.
      receivedCount: kept.length,
      eligibleCount,
      maxRecipes: Number.isFinite(ceiling) ? ceiling : null,
      complete,
      stoppedBy,
    },
    recipes: kept,
  }, { servings })
}

export async function listEditorialRecipes(supabase, {
  code = null,
  limit = 500,
  offset = 0,
  servings = null,
  quantityScale = 1,
} = {}) {
  if (!supabase) throw new Error('Client Supabase authentifié requis')

  const { data, error } = await supabase.rpc('get_editorial_recipe_catalog_v3', {
    p_code: code,
    p_limit: limit,
    p_offset: offset,
  })
  if (error) throw new Error(`Catalogue recettes V3 indisponible: ${error.message}`)

  return materializeOperationalCatalog(data, { servings, quantityScale })
}

export async function getEditorialRecipe(supabase, code, options = {}) {
  const catalog = await listEditorialRecipes(supabase, { ...options, code, limit: 1, offset: 0 })
  const recipe = catalog.recipes[0] || null
  if (!recipe || options.includeComponents === false) return recipe

  const components = recipe.exactIngredients
    .map((ingredient) => ingredient.component)
    .filter((component, index, items) => component?.code && items.findIndex((item) => item?.code === component.code) === index)

  const subRecipes = {}
  await Promise.all(components.map(async (component) => {
    const required = Number(component.requiredQuantity)
    const declaredYield = Number(component.yieldQuantity)
    const quantityScale = required > 0 && declaredYield > 0 ? required / declaredYield : 1
    const childCatalog = await listEditorialRecipes(supabase, {
      code: component.code,
      limit: 1,
      quantityScale,
    })
    const child = childCatalog.recipes[0]
    if (child) subRecipes[component.code] = { ...child, requestedYield: component.requiredQuantity, requestedUnit: component.requiredUnit }
  }))

  return { ...recipe, subRecipes }
}

export async function getOperationalRecipe(supabase, code, options = {}) {
  // Un code désigne au plus une recette : rien à paginer, et une page de 1
  // avec un arrêt déclaré évite l'aller-retour supplémentaire que ferait une
  // boucle qui cherche la page suivante.
  const catalog = await listOperationalRecipes(supabase, {
    ...options,
    code,
    offset: 0,
    pageSize: 1,
    maxRecipes: 1,
  })
  return catalog.recipes[0] || null
}
