import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  COLONNES_DE_LA_DEMANDE_CANONIQUE,
  SOURCES,
  colonnesAbsentes,
  laDemandeCanoniqueCouvreLaListe,
  ligneTenueParLaDemandeCanonique,
  sourceDeVeriteDeLaListe,
} from '@/lib/domain/courses/sourceDeVerite'
import {
  chargePartageListe,
  documentImprimableListe,
  exporterListeCourses,
} from '@/lib/domain/courses/exportListe'
import { rebuildShoppingListFromImport } from '@/lib/shoppingListBuilder'
import { buildCanonicalPlanPayload, buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

/**
 * Livrable 4.5 — la liste de courses a UNE SEULE source de vérité.
 *
 * Ce fichier ne dit pas « deux sources » : il MESURE ce que la seconde fait à la
 * première, article par article, sur une semaine réellement planifiée par le
 * solveur et publiée par `buildCanonicalPlanPayload` — le même banc que
 * `tests/courses/exportListe.test.js`, pour que les deux parlent de la même
 * semaine.
 *
 * Il tient ensuite la convergence : la route n'est pas supprimée, elle s'efface
 * quand la demande canonique tient la liste, et le bouton disparaît au même
 * endroit et selon la même règle.
 */

const chemin = (relatif) => fileURLToPath(new URL(relatif, import.meta.url))
const lire = (relatif) => readFileSync(chemin(relatif), 'utf8')

/**
 * Passage du payload de publication aux lignes de `nutrition_plan_shopping_items`,
 * recopié de la RPC comme dans `exportListe.test.js` — l'INSERT de
 * `20260717000002_p2_planned_productions.sql:742-770` puis l'UPDATE de
 * `20260721195504_planning_final_demand_truth.sql:296-308`.
 *
 * `canonical_food_id` et `archetype_id` sortent à NULL, et ce n'est pas un
 * raccourci du banc : `shoppingItemFromRequirement` (`finalDemands.js:210-249`)
 * ne rend aucun de ces deux champs, l'INSERT lit donc deux clés absentes du
 * payload. C'est le seul manque mesuré de la demande canonique, et il est
 * couvert ailleurs (voir le dernier `describe`).
 */
function lignesDeBase(shoppingItems, versionId) {
  return shoppingItems.map((item, index) => ({
    id: index + 1,
    import_id: 1,
    plan_version_id: versionId,
    week_label: item.week_label || 'S1',
    category: item.category ?? null,
    product_name: item.product_name,
    quantity: item.display_quantity ?? null,
    checked: false,
    canonical_food_id: null,
    archetype_id: null,
    notes: item.notes ?? null,
    required_qty: item.required_qty ?? null,
    stock_qty: item.stock_qty ?? null,
    reserved_qty: item.reserved_qty ?? null,
    incoming_qty: item.incoming_qty ?? null,
    purchase_qty: item.purchase_qty ?? null,
    purchase_unit: item.purchase_unit ?? null,
    shopping_status: item.shopping_status || 'needed',
    planning_source: 'final_demands',
    aisle_order: item.aisle_order ?? 999,
    shortage_reason: item.shortage_reason ?? null,
    needed_by: item.needed_by ?? null,
    container_qty: item.container_qty ?? null,
    container_size: item.container_size ?? null,
    container_unit: item.container_unit ?? null,
    exact_required_qty: item.exact_required_qty ?? null,
    projected_surplus_qty: item.projected_surplus_qty ?? 0,
    created_lot_ids: null,
  }))
}

/**
 * Un client Supabase de banc : il SERT les tables qu'on lui donne et
 * ENREGISTRE les écritures au lieu de les exécuter. Il ne simule pas la RLS —
 * il n'en a pas besoin : ce qu'on mesure est ce que le chemin hérité ÉCRIRAIT.
 */
function clientDeBanc(tables, journal) {
  const construire = (nom) => {
    const api = {
      select: () => api,
      eq: () => api,
      gt: () => api,
      order: () => api,
      limit: () => api,
      insert: (rows) => {
        journal.push({ op: 'insert', table: nom, rows: Array.isArray(rows) ? rows : [rows] })
        return Promise.resolve({ data: null, error: null })
      },
      update: (patch) => {
        journal.push({ op: 'update', table: nom, patch })
        return { eq: () => Promise.resolve({ data: null, error: null }) }
      },
      delete: () => {
        journal.push({ op: 'delete', table: nom })
        return { eq: () => Promise.resolve({ data: null, error: null }) }
      },
      then: (ok, ko) => Promise.resolve({ data: tables[nom] ?? [], error: null }).then(ok, ko),
    }
    return api
  }
  return { from: construire }
}

/** Le catalogue d'aliments du corpus, celui dont les formes servent les recettes. */
const CATALOGUE = JSON.parse(lire('../../scripts/data/out/recipe-food-catalog.json'))
const canonicalFoods = CATALOGUE.forms.map((forme, index) => ({
  id: index + 1,
  canonical_name: forme.canonical_name,
  keywords: null,
  unit_weight_grams: forme.conversion?.grams_per_unit || null,
  density_g_per_ml: forme.conversion?.density_g_per_ml || null,
}))

const sansAccent = (valeur) => String(valeur)
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// ═══════════════════════════════════════════════════════════════════════════
// 1. LA RÈGLE, SEULE
// ═══════════════════════════════════════════════════════════════════════════

describe('qui détient la liste — la règle, lue ligne par ligne', () => {
  const canonique = { plan_version_id: 'b1e4…', planning_source: 'final_demands' }
  const heritee = { plan_version_id: null, planning_source: null }

  it('une version de plan déclarée suffit', () => {
    expect(ligneTenueParLaDemandeCanonique({ plan_version_id: 'b1e4…', planning_source: null })).toBe(true)
  })

  it('une source de publication canonique suffit, même sans version', () => {
    // Un plan publié par la RPC P2 seule porte `closed_loop`, pas `final_demands`.
    expect(ligneTenueParLaDemandeCanonique({ plan_version_id: null, planning_source: 'closed_loop' })).toBe(true)
    expect(ligneTenueParLaDemandeCanonique({ plan_version_id: null, planning_source: 'final_demands' })).toBe(true)
  })

  it('une ligne héritée n’est pas tenue par la demande canonique', () => {
    expect(ligneTenueParLaDemandeCanonique(heritee)).toBe(false)
    expect(ligneTenueParLaDemandeCanonique({ planning_source: 'legacy_import' })).toBe(false)
  })

  /**
   * LE PIÈGE DE `Number()`, ET SA FAMILLE. Deux fautes de cette famille ont déjà
   * été trouvées dans ce dépôt. Ici la valeur vient d'une ligne de base ou d'un
   * corps de requête : `true`, `[]`, `0` et `''` ne sont pas des identifiants de
   * version, et aucun ne doit ouvrir la porte canonique — ni la fermer sur une
   * ligne qui, elle, la déclare.
   */
  it('ni true, ni [], ni 0, ni la chaîne vide ne valent un identifiant de version', () => {
    for (const valeur of [true, false, [], {}, 0, 1, '', '   ', NaN, null, undefined]) {
      expect(ligneTenueParLaDemandeCanonique({ plan_version_id: valeur, planning_source: null }), String(valeur)).toBe(false)
    }
  })

  it('ni true ni [] ne valent une source de publication', () => {
    for (const valeur of [true, [], ['final_demands'], 0, '', 'final_demandsX', ' ']) {
      expect(ligneTenueParLaDemandeCanonique({ plan_version_id: null, planning_source: valeur }), String(valeur)).toBe(false)
    }
  })

  it('une liste vide n’est tenue par personne, et le dit', () => {
    const verite = sourceDeVeriteDeLaListe([])
    expect(verite.source).toBe(SOURCES.VIDE)
    expect(verite.couverte).toBe(false)
    expect(sourceDeVeriteDeLaListe(null).source).toBe(SOURCES.VIDE)
  })

  it('une liste entièrement héritée revient au chemin hérité', () => {
    const verite = sourceDeVeriteDeLaListe([heritee, heritee, heritee])
    expect(verite.source).toBe(SOURCES.HERITE)
    expect(verite.couverte).toBe(false)
    expect(verite.heritees).toBe(3)
    expect(verite.canoniques).toBe(0)
  })

  /**
   * Le mélange n'est pas un cas d'école : la RPC ne supprime que les lignes NON
   * cochées avant de réinsérer, donc une ligne cochée d'une version antérieure
   * survit à la publication suivante. Une seule ligne canonique doit suffire à
   * interdire l'écrasement — sinon la reconstruction détruirait les lignes de la
   * version active pour conserver une ligne périmée.
   */
  it('une seule ligne canonique donne la liste à la demande canonique', () => {
    const verite = sourceDeVeriteDeLaListe([heritee, heritee, canonique])
    expect(verite.source).toBe(SOURCES.CANONIQUE)
    expect(verite.couverte).toBe(true)
    expect(verite.canoniques).toBe(1)
    expect(verite.heritees).toBe(2)
    expect(laDemandeCanoniqueCouvreLaListe([heritee, heritee, canonique])).toBe(true)
  })

  it('les colonnes absentes d’une ligne sont nommées, pas supposées', () => {
    expect(colonnesAbsentes({ ...canonique, purchase_qty: 420, purchase_unit: 'g' }))
      .toEqual(COLONNES_DE_LA_DEMANDE_CANONIQUE.filter((c) => (
        !['plan_version_id', 'planning_source', 'purchase_qty', 'purchase_unit'].includes(c)
      )))
    expect(colonnesAbsentes(null)).toEqual([...COLONNES_DE_LA_DEMANDE_CANONIQUE])
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 2. LA DIVERGENCE, MESURÉE SUR UNE SEMAINE RÉELLEMENT PUBLIÉE
// ═══════════════════════════════════════════════════════════════════════════

describe('ce que le chemin hérité fait à la liste canonique, article par article', () => {
  // La semaine est planifiée UNE FOIS pour tout le describe : la recherche en
  // faisceau coûte plusieurs secondes et la CI coupe à vingt par test
  // (modèle : tests/planning/varieteSemaine.test.js).
  const debut = '2026-09-21'
  const cible = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }
  const recipes = getCanonicalRecipes({ servings: 2 })
  const plan = generateClosedLoopPlan({
    slots: buildWeekSlots(debut),
    recipes,
    inventoryLots: [],
    constraints: {
      allowShopping: true,
      targetByMeal: { dejeuner: cible, diner: cible },
      maxMinutesByMeal: { dejeuner: 120, diner: 240 },
      preferredActiveMinutes: 30,
    },
    beamWidth: 48,
  })
  const payload = buildCanonicalPlanPayload({
    plan,
    recipes,
    windowStart: debut,
    members: [
      { name: 'Julien', portion_multiplier: 1 },
      { name: 'Zoé', portion_multiplier: 1 },
    ],
    goals: [
      { person_name: 'Julien', target_calories: 2200, target_protein_g: 150, target_carbs_g: 220, target_fat_g: 70, target_fiber_g: 30 },
      { person_name: 'Zoé', target_calories: 1700, target_protein_g: 90, target_carbs_g: 180, target_fat_g: 55, target_fiber_g: 25 },
    ],
    constraints: {},
    inventoryLots: [],
  })

  const VERSION = '7f0b2a10-0000-4000-8000-00000000d1ff'
  const canoniques = lignesDeBase(payload.shopping_items, VERSION)

  // Le chemin hérité, joué sur CETTE semaine : il relit les descriptions des
  // repas que la publication a écrites (`legacy_meals` → `nutrition_plan_meals`).
  const journal = []
  const client = clientDeBanc({
    nutrition_plan_meals: payload.legacy_meals.map((repas) => ({ description: repas.description })),
    canonical_foods: canonicalFoods,
    archetypes: [],
    cultivars: [],
    inventory_lots_resolved: [],
    inventory_lots: [],
    nutrition_plan_shopping_items: canoniques,
  }, journal)
  const resultatHerite = rebuildShoppingListFromImport(client, 'utilisateur-de-banc', 1)

  /** Les lignes que le chemin hérité aurait écrites, telles que la page les relirait. */
  async function lignesReconstruites() {
    await resultatHerite
    const insertion = journal.find((entree) => entree.op === 'insert')
    return (insertion?.rows || []).map((ligne, index) => ({
      id: 1000 + index,
      ...ligne,
      plan_version_id: null,
      planning_source: null,
      purchase_qty: null,
      purchase_unit: null,
      container_qty: null,
      container_size: null,
      container_unit: null,
      aisle_order: null,
      shopping_status: null,
      exact_required_qty: null,
      projected_surplus_qty: 0,
    }))
  }

  it('la semaine publiée porte bien une liste à comparer', () => {
    // Un banc vide passerait toutes les égalités qui suivent.
    expect(canoniques.length).toBe(104)
    expect(payload.legacy_meals.length).toBeGreaterThan(20)
    expect(canoniques.every((ligne) => Number.isFinite(Number(ligne.purchase_qty)) && Number(ligne.purchase_qty) > 0)).toBe(true)
  })

  it('le chemin hérité SUPPRIME la liste publiée avant de réécrire la sienne', async () => {
    await resultatHerite
    const surLaListe = journal.filter((entree) => entree.table === 'nutrition_plan_shopping_items')
    expect(surLaListe.map((entree) => entree.op)).toEqual(['delete', 'insert'])
  })

  it('104 articles entrent, 11 lignes sortent', async () => {
    expect((await resultatHerite).mode).toBe('rebuilt')
    expect((await lignesReconstruites()).length).toBe(11)
  })

  it('101 articles disparaissent, 8 apparaissent, 3 seulement sont communs', async () => {
    const reconstruites = await lignesReconstruites()
    const nomsCanoniques = canoniques.map((ligne) => ligne.product_name)
    const nomsReconstruits = reconstruites.map((ligne) => ligne.product_name)
    const ensembleCanonique = new Set(nomsCanoniques.map(sansAccent))
    const ensembleReconstruit = new Set(nomsReconstruits.map(sansAccent))

    const perdus = nomsCanoniques.filter((nom) => !ensembleReconstruit.has(sansAccent(nom)))
    const apparus = nomsReconstruits.filter((nom) => !ensembleCanonique.has(sansAccent(nom)))
    const communs = nomsCanoniques.filter((nom) => ensembleReconstruit.has(sansAccent(nom)))

    expect(perdus.length).toBe(101)
    expect(apparus.length).toBe(8)
    expect(communs.length).toBe(3)
    // Nommés, pas seulement comptés : « n articles diffèrent » sans les noms
    // serait la phrase qu'on remplace.
    expect(perdus).toContain('Poulet entier cru, prêt à cuire')
    expect(perdus).toContain('Bœuf haché cru 15 % MG')
    expect(perdus).toContain('Aubergine fraîche')
    // Les trois survivants sont nommés eux aussi : ce sont les seuls que les
    // descriptions des collations écrivent en toutes lettres.
    expect(communs.sort((a, b) => a.localeCompare(b, 'fr'))).toEqual(['Miel', 'Noix', 'Pain complet'])
  })

  /**
   * Les huit apparus portent des noms cassés, et la cause est nommée :
   * `parseIngredient` (`lib/ingredientResolver.js:132`) laisse son groupe
   * d'unité `([^\d\s]+)?` mordre sur le nom quand aucune unité n'est écrite.
   * « 1 pomme » y devient unité « pomm », nom « e ».
   */
  it('les articles apparus portent des noms cassés par le reparsage', async () => {
    const noms = (await lignesReconstruites()).map((ligne) => ligne.product_name)
    expect(noms).toContain('pomm e')
    expect(noms).toContain('kiw i')
    expect(noms.filter((nom) => / \w$/.test(nom)).length).toBe(7)
  })

  /**
   * LA CONSÉQUENCE LA PLUS GRAVE, ET ELLE EST SILENCIEUSE.
   * `lib/nutritionPlanService.js:290` ne sert à l'écran que les lignes de la
   * version active ou déjà cochées. Aucune ligne reconstruite ne porte de
   * version : la liste affichée tombe à zéro article, sans message.
   */
  it('aucune ligne reconstruite ne survit au filtre de version : 0 article affiché', async () => {
    const reconstruites = await lignesReconstruites()
    const visibles = reconstruites.filter((ligne) => ligne.plan_version_id === VERSION || ligne.checked)
    expect(reconstruites.length).toBe(11)
    expect(visibles.length).toBe(0)
    // Et la référence : les lignes canoniques, elles, passent toutes.
    expect(canoniques.filter((ligne) => ligne.plan_version_id === VERSION).length).toBe(104)
  })

  it('chaque colonne de la demande canonique est posée par l’une et par aucune de l’autre', async () => {
    const reconstruites = await lignesReconstruites()
    const posees = (lignes, colonne) => lignes.filter((ligne) => {
      const valeur = ligne[colonne]
      return valeur !== null && valeur !== undefined && valeur !== ''
    }).length

    // `container_*` n'est posée que sur les articles à conditionnement déclaré :
    // on mesure le chiffre, on ne suppose pas qu'il vaut 104.
    const attendues = {
      plan_version_id: 104, planning_source: 104, purchase_qty: 104, purchase_unit: 104,
      container_qty: 29, container_size: 29, container_unit: 29,
      aisle_order: 104, shopping_status: 104, exact_required_qty: 104,
    }
    for (const colonne of COLONNES_DE_LA_DEMANDE_CANONIQUE) {
      expect(posees(canoniques, colonne), `canonique ${colonne}`).toBe(attendues[colonne])
      expect(posees(reconstruites, colonne), `reconstruite ${colonne}`).toBe(0)
    }
  })

  it('la règle tranche dans le bon sens sur ces deux listes-là', async () => {
    expect(sourceDeVeriteDeLaListe(canoniques).source).toBe(SOURCES.CANONIQUE)
    expect(sourceDeVeriteDeLaListe(canoniques).canoniques).toBe(104)
    expect(sourceDeVeriteDeLaListe(await lignesReconstruites()).source).toBe(SOURCES.HERITE)
  })

  // ── Ce que les trois sorties de la phase 3 lisent (point c du livrable) ────

  it('les trois sorties rendent 104 articles depuis la source qui reste', () => {
    const copie = exporterListeCourses(canoniques, { semaine: 'S1' })
    const partage = chargePartageListe(canoniques, { semaine: 'S1' })
    const impression = documentImprimableListe(canoniques, { semaine: 'S1' })

    expect(copie.compte.articles).toBe(104)
    expect(partage.compte.articles).toBe(104)
    expect(impression.compte.articles).toBe(104)
    expect(impression.rayons.reduce((somme, rayon) => somme + rayon.articles.length, 0)).toBe(104)
    // Aucune quantité repliée : les trois lisent bien le chiffre canonique.
    expect(copie.anomalies.articles_a_quantite_repliee).toEqual([])
  })

  it('les trois sorties s’effondrent sur ce que le chemin hérité laisse', async () => {
    const reconstruites = await lignesReconstruites()
    const copie = exporterListeCourses(reconstruites, { semaine: 'S1' })
    const partage = chargePartageListe(reconstruites, { semaine: 'S1' })
    const impression = documentImprimableListe(reconstruites, { semaine: 'S1' })

    expect(copie.compte.articles).toBe(11)
    expect(partage.compte.articles).toBe(11)
    expect(impression.compte.articles).toBe(11)
    // Faute de `purchase_qty`, les onze quantités sont repliées sur le texte
    // déjà rédigé — l'export le signale, et c'est tout ce qu'il peut faire.
    expect(copie.anomalies.articles_a_quantite_repliee.length).toBe(11)
    expect(copie.compte.rayons).toBe(2)
  })

  /**
   * Ce que les trois sorties LISENT, enregistré plutôt qu'affirmé : un mandataire
   * note chaque colonne consultée sur chaque ligne. Si la chaîne d'export se
   * mettait à lire une colonne que seule la reconstruction héritée pose, il
   * faudrait le savoir ici.
   */
  it('les trois sorties lisent les colonnes de la demande canonique, et aucune colonne héritée', () => {
    const lues = new Set()
    const espionnees = canoniques.map((ligne) => new Proxy(ligne, {
      get(cible, propriete) {
        if (typeof propriete === 'string') lues.add(propriete)
        return cible[propriete]
      },
    }))

    exporterListeCourses(espionnees, { semaine: 'S1' })
    chargePartageListe(espionnees, { semaine: 'S1' })
    documentImprimableListe(espionnees, { semaine: 'S1' })

    // Les colonnes de quantité et de conditionnement de la demande canonique
    // sont bien celles que la chaîne consulte.
    for (const colonne of ['purchase_qty', 'purchase_unit', 'container_qty', 'container_size', 'container_unit']) {
      expect(lues.has(colonne), colonne).toBe(true)
    }
    // Et aucune colonne que seul le chemin hérité écrirait.
    for (const colonne of ['created_lot_ids', 'archetype_id', 'canonical_food_id']) {
      expect(lues.has(colonne), colonne).toBe(false)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 3. LA CONVERGENCE : LA ROUTE RESTE, LE BOUTON PART OÙ LA DEMANDE COUVRE
// ═══════════════════════════════════════════════════════════════════════════

describe('la route converge au lieu d’être supprimée', () => {
  const route = lire('../../app/api/courses/rebuild/route.js')
  const page = lire('../../app/courses/page.js')

  it('la route existe toujours et expose toujours POST', () => {
    // Une route supprimée laisserait un ancien plan sans liste, et sans message.
    expect(route).toMatch(/export async function POST\(/)
  })

  it('la route lit qui détient la liste AVANT toute écriture', () => {
    const decision = route.indexOf('sourceDeVeriteDeLaListe(')
    const reconstruction = route.indexOf('rebuildShoppingListFromImport(')
    expect(decision).toBeGreaterThan(-1)
    expect(reconstruction).toBeGreaterThan(-1)
    expect(decision).toBeLessThan(reconstruction)
  })

  it('la route rend un refus explicite plutôt que de reconstruire dans le doute', () => {
    // Une lecture en échec ne dit pas « liste héritée » : elle ne dit rien.
    expect(route).toMatch(/lectureError[\s\S]{0,400}status: 503/)
  })

  it('la page et la route tranchent par le MÊME module', () => {
    expect(route).toMatch(/from '@\/lib\/domain\/courses\/sourceDeVerite'/)
    expect(page).toMatch(/from '@\/lib\/domain\/courses\/sourceDeVerite'/)
  })

  it('le bouton de reconstruction est conditionné à l’absence de couverture canonique', () => {
    expect(page).toMatch(/!veriteDeLaListe\.couverte[\s\S]{0,600}handleRebuild/)
  })

  it('la page ne décide pas de la couverture de son côté', () => {
    // Aucune relecture locale de `planning_source` ni de `plan_version_id` :
    // deux règles écrites à deux endroits finissent par ne plus dire pareil.
    expect(page).not.toMatch(/planning_source/)
    expect(page).not.toMatch(/plan_version_id/)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 4. CE QUE LA DEMANDE CANONIQUE NE COUVRE PAS, ET QUI LE COUVRE
// ═══════════════════════════════════════════════════════════════════════════

describe('le seul manque mesuré de la demande canonique, et son rattrapage', () => {
  /**
   * `shoppingItemFromRequirement` ne rend ni `canonical_food_id` ni
   * `archetype_id` : les lignes publiées arrivent sans lien vers le catalogue,
   * et c'est ce lien qui rend un article rangeable au garde-manger.
   *
   * Ce n'est PAS une raison de garder le bouton : deux autres chemins le
   * posent, et aucun des deux ne touche à la liste elle-même.
   */
  it('la publication canonique ne pose pas le lien vers le catalogue', () => {
    const finalDemands = lire('../../lib/domain/planning/finalDemands.js')
    const corps = finalDemands.slice(
      finalDemands.indexOf('function shoppingItemFromRequirement'),
      finalDemands.indexOf('function validateFinalModel'),
    )
    expect(corps.length).toBeGreaterThan(500)
    expect(corps).not.toMatch(/canonical_food_id/)
    expect(corps).not.toMatch(/archetype_id/)
  })

  it('la page relie les articles non liés au chargement, sans passer par la reconstruction', () => {
    const page = lire('../../app/courses/page.js')
    expect(page).toMatch(/\/api\/ingredients\/resolve-pending/)
    expect(page).toMatch(/hasUnlinked/)
  })

  it('le rangement au stock résout le lien article par article s’il manque encore', () => {
    const rangement = lire('../../app/api/courses/add-to-stock/route.js')
    expect(rangement).toMatch(/resolveIngredient\(/)
    expect(rangement).toMatch(/ensureCanonical\(/)
  })
})
