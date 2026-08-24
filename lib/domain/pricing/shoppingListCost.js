/**
 * Coût estimé d'une liste de courses — en contenants, pas en grammes exacts.
 *
 * TOUT L'INTÉRÊT DE CE FICHIER TIENT DANS UN ÉCART. On n'achète pas 230 g
 * d'huile : on achète une bouteille. `finalDemands` le sait déjà et publie les
 * trois quantités qui décrivent l'écart — `exact_required_qty` (le besoin réel),
 * `purchase_qty` (l'achat physique, arrondi au contenant via `USUAL_PACKAGES`)
 * et `projected_surplus_qty` (ce qui restera). Le contrat en tire deux montants
 * qu'il interdit de confondre (§6.2) :
 *
 *   coutAchat     — ce qu'on paie en caisse, assis sur les contenants entiers ;
 *   coutConsomme  — ce que les plats emploient réellement ;
 *   surplus       — la différence, qui n'est PAS une erreur : c'est le stock qui
 *                   rejoint le garde-manger, et il a une valeur.
 *
 * Rendre visible ce surplus est la seule façon d'expliquer pourquoi une semaine
 * à 62 € de courses ne « coûte » pas 62 € de nourriture mangée. Le masquer
 * ferait apparaître un écart inexplicable entre la liste et les fiches recettes.
 */

import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'
import { toGramsV2 } from '@/lib/domain/units'
import { trouverPrix, INDEX_PRIX_VIDE } from '@/lib/domain/pricing/priceIndex'
import {
  arrondirFourchette,
  calculerCouverture,
  composerFourchettes,
  fourchetteLigne,
  masseAcheteeGrammes,
  verdictAffichage,
} from '@/lib/domain/pricing/priceMath'

const nombre = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)

/**
 * Clé de jointure d'une ligne de courses.
 *
 * `finalDemands` ne publie PAS `form_normalized` dans ses items (il l'a en
 * interne, il ne le recopie pas), et `product_name` porte le libellé exact du
 * catalogue quand la ligne vient d'une recette. On accepte donc le repli — mais
 * il est sans danger, et pour une raison précise : le repli passe par
 * `normalizeFoodForm`, c'est-à-dire par la MÊME fonction qui a produit les clés
 * du référentiel. Il ne peut donc produire qu'une correspondance exacte dans
 * l'espace de clés du contrat, ou aucune. Il ne peut pas rapprocher « à peu
 * près » deux aliments voisins, ce qui serait la façon dont un mauvais prix
 * entrerait.
 *
 * La façon dont la jointure a été faite est conservée (`joinedBy`) : une
 * couverture obtenue par libellé mérite d'être relue autrement qu'une couverture
 * obtenue par clé explicite.
 */
function cleDeLigne(item) {
  const explicite = item?.form_normalized || item?.formNormalized
  if (explicite) return { cle: normalizeFoodForm(explicite), joinedBy: 'form_normalized' }
  const libelle = item?.product_name || item?.productName || item?.name
  if (libelle) return { cle: normalizeFoodForm(libelle), joinedBy: 'product_name_normalized' }
  return { cle: null, joinedBy: null }
}

/**
 * Métadonnée de conversion pour passer de l'unité d'achat aux grammes.
 *
 * Ordre : ce que la ligne porte, puis à défaut le facteur que l'entrée de prix
 * a RECOPIÉ du catalogue (`per_kg.conversion`, §1.2). Ce second recours n'est
 * pas une saisie parallèle : le contrôleur vérifie l'égalité stricte de ce
 * facteur avec `conversion.density_g_per_ml` / `conversion.grams_per_unit` de la
 * forme, donc le lire ici revient à lire le catalogue.
 *
 * Aucun repli au-delà. Une ligne en litres sur une forme dont personne ne
 * connaît la densité n'est pas chiffrée — même refus que `toGramsV2`, qui rend
 * `missing_density` plutôt que de supposer 1,00 (l'eau vaut 1,00, l'huile 0,92,
 * le miel 1,42 : supposer 1,00 sur une huile sous-estime de 8 % et personne ne
 * le verrait).
 */
function metaConversion(item, entree) {
  const meta = {
    grams_per_unit: nombre(item?.grams_per_unit ?? item?.gramsPerUnit ?? item?.unit_weight_grams),
    density_g_per_ml: nombre(item?.density_g_per_ml ?? item?.density),
  }
  const conversion = entree?.conversion
  if (meta.grams_per_unit == null && conversion?.kind === 'grams_per_piece') {
    meta.grams_per_unit = nombre(conversion.factor)
  }
  if (meta.density_g_per_ml == null && conversion?.kind === 'density') {
    meta.density_g_per_ml = nombre(conversion.factor)
  }
  return meta
}

/** Une quantité d'achat en grammes, ou un motif de refus. Jamais un repli. */
function enGrammes(quantite, unite, meta) {
  const q = nombre(quantite)
  if (q == null) return { ok: false, grams: null, reason: 'quantite_absente' }
  if (q === 0) return { ok: true, grams: 0, reason: null }
  const conversion = toGramsV2(q, unite || 'g', meta)
  return conversion.ok
    ? { ok: true, grams: conversion.grams, reason: null }
    : { ok: false, grams: null, reason: conversion.reason }
}

/**
 * @param {Array<Object>} items — items de `finalDemands` (`purchase_qty`,
 *   `exact_required_qty`, `projected_surplus_qty`, `purchase_unit`, …)
 * @param {Object} index — index rendu par `buildPriceIndex` / `obtenirIndexPrix`
 */
export function computeShoppingListCost(items, index) {
  const idx = index || INDEX_PRIX_VIDE
  const lignes = []

  for (const item of items || []) {
    const { cle, joinedBy } = cleDeLigne(item)
    const base = {
      name: item?.product_name || item?.productName || item?.name || null,
      formNormalized: cle,
      joinedBy,
      category: item?.category ?? null,
      containerQty: nombre(item?.container_qty ?? item?.containerQty),
      containerSize: nombre(item?.container_size ?? item?.containerSize),
      containerUnit: item?.container_unit ?? item?.containerUnit ?? null,
      purchaseUnit: item?.purchase_unit ?? item?.purchaseUnit ?? 'g',
    }

    const recherche = cle
      ? trouverPrix(idx, cle)
      : { trouve: false, raison: 'forme_absente_de_la_ligne', entree: null }

    const entree = recherche.entree
    const meta = metaConversion(item, entree)
    const unite = base.purchaseUnit
    const achat = enGrammes(item?.purchase_qty ?? item?.purchaseQty, unite, meta)
    const besoin = enGrammes(item?.exact_required_qty ?? item?.exactRequiredQty, unite, meta)
    const surplus = enGrammes(item?.projected_surplus_qty ?? item?.projectedSurplusQty ?? 0, unite, meta)

    // `grams` est la masse ACHETÉE : c'est elle qui pèse dans la couverture par
    // masse d'une liste de courses, puisque c'est elle qu'on paie.
    const ligne = { ...base, grams: achat.grams, requiredGrams: besoin.grams, surplusGrams: surplus.grams }

    if (!achat.ok) {
      lignes.push({ ...ligne, priced: false, reason: `masse_indeterminee:${achat.reason}`, entry: entree, purchaseRange: null, consumedRange: null, surplusRange: null })
      continue
    }
    if (!recherche.trouve) {
      lignes.push({ ...ligne, priced: false, reason: recherche.raison, entry: null, purchaseRange: null, consumedRange: null, surplusRange: null })
      continue
    }

    /**
     * Le rendement s'applique ici comme dans recipeCost — une seule fois, au
     * passage de la forme à la masse achetée (§2.4).
     *
     * LIMITE CONNUE, ÉCRITE PLUTÔT QUE MASQUÉE : `finalDemands` arrondit au
     * contenant sur des grammes de FORME (état comestible du catalogue), et le
     * rendement est appliqué après cet arrondi. L'ordre juste serait l'inverse —
     * convertir en masse achetée, puis arrondir au contenant — car un rendement
     * de 0,80 peut faire passer d'une à deux bottes de poireaux. Tant que tous
     * les rendements valent 1,00 faute de source (§2.3, et aucune des 534 formes
     * du catalogue ne porte `edible_yield_ratio`), l'écart est nul. Le jour où
     * un rendement est sourcé, c'est l'arrondi au contenant de `finalDemands`
     * qu'il faudra déplacer, pas ce calcul-ci — et ce commentaire est là pour
     * qu'on sache où regarder.
     */
    const rendement = entree.edibleYield.value
    const purchaseRange = fourchetteLigne(entree.perKg, achat.grams, rendement)
    if (!purchaseRange) {
      lignes.push({ ...ligne, priced: false, reason: 'fourchette_incalculable', entry: entree, purchaseRange: null, consumedRange: null, surplusRange: null })
      continue
    }

    lignes.push({
      ...ligne,
      priced: true,
      reason: null,
      entry: entree,
      confidence: entree.confidence,
      yieldKnown: entree.edibleYield.known,
      purchasedGrams: masseAcheteeGrammes(achat.grams, rendement),
      purchaseRange,
      // Les deux montants dérivés emploient le MÊME prix au kilo et le MÊME
      // rendement, appliqués à des masses différentes : c'est la seule façon
      // dont `coutAchat`, `coutConsomme` et `surplus` restent additifs au centre.
      consumedRange: besoin.ok ? fourchetteLigne(entree.perKg, besoin.grams, rendement) : null,
      surplusRange: surplus.ok ? fourchetteLigne(entree.perKg, surplus.grams, rendement) : null,
    })
  }

  const chiffrees = lignes.filter((l) => l.priced)
  const couverture = calculerCouverture(lignes)
  const coutAchat = composerFourchettes(chiffrees.map((l) => l.purchaseRange))
  const coutConsomme = composerFourchettes(chiffrees.map((l) => l.consumedRange))
  const surplus = composerFourchettes(chiffrees.map((l) => l.surplusRange))
  const verdict = verdictAffichage(couverture, { referentielPerime: Boolean(idx.stale) })

  return {
    currency: idx.currency,
    referenceDate: idx.referenceDate,

    /** Ce qu'on paie en caisse. C'est le seul montant qu'une liste de courses doit afficher (§6.2). */
    coutAchat,
    /** Ce que les plats emploieront réellement sur ce qui est acheté. */
    coutConsomme,
    /** Ce qui restera au garde-manger : acheté, payé, pas encore mangé. */
    surplus,

    coutAchatArrondi: arrondirFourchette(coutAchat),
    coutConsommeArrondi: arrondirFourchette(coutConsomme),
    surplusArrondi: arrondirFourchette(surplus),

    /**
     * Les CENTRES s'additionnent exactement — `coutAchat.central` vaut
     * `coutConsomme.central + surplus.central`, parce que la somme des centres
     * est exacte sans hypothèse (§3.2) et que les trois portent le même prix.
     * Les BORNES, elles, ne s'additionnent pas : chaque agrégat compose sa
     * propre quadrature sur ses propres lignes, et √(a²+b²) < a+b. Une interface
     * qui vérifierait `bas(achat) === bas(consommé) + bas(surplus)` trouverait un
     * écart qui n'est pas une erreur.
     */
    centresAdditifs: true,

    coverage: couverture,
    minorant: couverture.pct !== 100 || couverture.yieldKnownPct !== 100,
    parageInconnu: couverture.yieldKnownPct !== 100,

    displayable: verdict.affichable,
    displayRefusal: verdict.refus,

    lines: lignes,
    attributions: idx.attributions ?? [],
  }
}
