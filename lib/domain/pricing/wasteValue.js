/**
 * Valorisation du gaspillage — en euros, sur des lots réels et des dates réelles.
 *
 * C'est le seul chiffre de cette couche qu'un concurrent ne peut pas produire :
 * il ne porte pas sur une moyenne nationale de foyer, il porte sur CE lot de
 * crème entamé le 12, dont la DLC ajustée tombe demain, et dont il reste 180 g.
 *
 * CE QUI EST REMPLACÉ, ET POURQUOI. `lib/wastePreventionService.js` calcule déjà
 * une valeur : `Math.round(quantitySaved * 5)`, commentée « 5 €/kg de nourriture
 * en moyenne ». Ce 5 n'a ni source, ni date, ni fourchette ; il vaut autant pour
 * le sel que pour le safran ; et il est exactement le nombre plausible et
 * invérifiable que le §0 du contrat proscrit — indétectable ensuite, parce qu'il
 * a la même tête qu'un vrai. Ce module ne le corrige pas d'un meilleur
 * coefficient : il le remplace par un prix sourcé et daté, ligne par ligne, et
 * n'affiche rien pour les lots dont le prix n'existe pas. La colonne
 * `waste_prevention_log.estimated_value_eur` n'est d'ailleurs jamais relue ici :
 * ce serait rapatrier l'ancienne estimation par la fenêtre.
 *
 * L'ASYMÉTRIE À NE PAS RATER : LE RENDEMENT NE S'APPLIQUE PAS ICI.
 * Un lot du garde-manger est déjà dans son état ACHETÉ — il porte sa peau, ses
 * fanes, son os, et `qty_remaining` est la masse physique qui est là. Diviser
 * par le rendement comme le font recipeCost et shoppingListCost gonflerait la
 * valeur du lot d'un facteur 1/rendement sans qu'aucune masse ne lui corresponde.
 * Le rendement sert à passer du comestible à l'acheté ; ici, on part de l'acheté.
 */

import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'
import { toGramsV2 } from '@/lib/domain/units'
import { trouverPrix, INDEX_PRIX_VIDE } from '@/lib/domain/pricing/priceIndex'
import {
  arrondirFourchette,
  calculerCouverture,
  composerFourchettes,
  joursEntre,
  verdictAffichage,
} from '@/lib/domain/pricing/priceMath'

const nombre = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)
const estDateIso = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

/**
 * Seuils d'alerte de CLAUDE.md : DLC à J-3 (règle stricte), DDM à J-7 (le
 * produit reste le plus souvent consommable au-delà). `ESTIMATE` suit la DDM,
 * comme dans wastePreventionService.
 */
export const SEUILS_ALERTE_JOURS = Object.freeze({ DLC: 3, DDM: 7, ESTIMATE: 7 })

/**
 * Actions du journal qui signent une PERTE.
 *
 * `waste_prevention_log` est un journal d'actions ANTI-gaspillage : congeler,
 * cuisiner, donner sont des sauvetages, pas des pertes. La table ne distingue
 * pas les deux — sa colonne `action` est un texte libre documenté comme
 * « consumed, donated, frozen, cooked, shared, composted… ». On ne devine donc
 * pas : la liste des actions qui valent perte est un paramètre, et son défaut
 * est étroit.
 *
 * `composted` y figure délibérément : composter vaut mieux que jeter pour le
 * sol, mais l'argent est dépensé et la nourriture n'a pas été mangée. C'est un
 * arbitrage discutable, donc il est surchargeable — pas enterré dans une
 * condition.
 */
export const ACTIONS_PERTE = Object.freeze(new Set(['discarded', 'jete', 'jeté', 'thrown', 'thrown_away', 'expired', 'composted']))

/**
 * Date de péremption EFFECTIVE d'un lot.
 *
 * L'ordre est celui de `lib/stockAllocator.js`, qui est l'autorité JS de
 * l'allocation FEFO : `adjusted_expiration_date` d'abord — c'est la DLC réduite
 * qu'écrit le trigger `auto_open_lot` à l'ouverture — puis `expiration_date`,
 * puis `best_before`.
 *
 * La vue SQL `inventory_lots_with_effective_dlc` ne fait, elle, que
 * `COALESCE(adjusted, expiration)` et ignore `best_before`. On suit
 * l'allocateur plutôt que la vue : un lot que l'allocateur ordonne par sa
 * `best_before` mais que la valorisation traiterait comme sans date afficherait
 * un garde-manger à risque incohérent avec l'ordre dans lequel on lui dit de
 * consommer.
 */
export function dateEffective(lot) {
  return lot?.adjusted_expiration_date
    ?? lot?.effective_expiration_date
    ?? lot?.expiration_date
    ?? lot?.best_before
    ?? null
}

function cleDeLot(lot) {
  const explicite = lot?.form_normalized || lot?.formNormalized
  if (explicite) return normalizeFoodForm(explicite)
  const libelle = lot?.canonical_name || lot?.canonicalName || lot?.product_name || lot?.productName || lot?.name
  return libelle ? normalizeFoodForm(libelle) : null
}

/**
 * Masse restante d'un lot, en grammes.
 *
 * On ne lit QUE `qty_remaining`, et c'est le cœur du traitement du lot ENTAMÉ :
 * une bouteille d'huile ouverte dont il reste 0,25 L vaut le quart d'une
 * bouteille, pas une bouteille. Le contenant d'origine n'est jamais reconstitué
 * — ni par `initial_qty` quand il est absent, ni par la taille du conditionnement
 * usuel. Un lot dont on ignore ce qui reste n'est pas valorisé.
 *
 * La conversion réutilise `metaConversion` du même esprit que la liste de
 * courses : métadonnée de la ligne d'abord, puis facteur recopié du catalogue
 * que porte l'entrée de prix. Sans facteur, refus (`missing_density`), jamais
 * densité 1,00.
 */
function masseRestanteGrammes(lot, entree) {
  const qte = nombre(lot?.qty_remaining ?? lot?.qtyRemaining ?? lot?.quantity ?? lot?.qty)
  if (qte == null || qte < 0) return { ok: false, grams: null, reason: 'quantite_absente' }
  const conversion = entree?.conversion
  const meta = {
    grams_per_unit: nombre(lot?.grams_per_unit ?? lot?.gramsPerUnit ?? lot?.unit_weight_grams)
      ?? (conversion?.kind === 'grams_per_piece' ? nombre(conversion.factor) : null),
    density_g_per_ml: nombre(lot?.density_g_per_ml ?? lot?.density)
      ?? (conversion?.kind === 'density' ? nombre(conversion.factor) : null),
  }
  const res = toGramsV2(qte, lot?.unit || 'g', meta)
  return res.ok ? { ok: true, grams: res.grams, reason: null } : { ok: false, grams: null, reason: res.reason }
}

/**
 * Valorise une ligne (lot ou entrée de journal) au prix sourcé de sa forme.
 * Rend toujours un objet motivé : un lot non valorisé doit pouvoir s'expliquer.
 */
function valoriser(source, idx, { expiryKind = 'DLC', today = null } = {}) {
  const cle = cleDeLot(source)
  const recherche = cle
    ? trouverPrix(idx, cle)
    : { trouve: false, raison: 'forme_absente_du_lot', entree: null }
  const entree = recherche.entree
  const masse = masseRestanteGrammes(source, entree)
  const echeance = dateEffective(source)
  const joursRestants = today && estDateIso(echeance) ? joursEntre(today, echeance) : null

  const base = {
    lotId: source?.id ?? source?.lot_id ?? null,
    name: source?.canonical_name || source?.product_name || source?.name || null,
    formNormalized: cle,
    grams: masse.grams,
    unit: source?.unit ?? null,
    qtyRemaining: nombre(source?.qty_remaining ?? source?.qtyRemaining ?? source?.quantity ?? source?.qty),
    isOpened: Boolean(source?.is_opened || source?.opened_at),
    openedAt: source?.opened_at ?? null,
    effectiveDate: echeance,
    // `adjusted_expiration_date` présente signifie que l'ouverture a raccourci
    // la date : le dire permet d'expliquer pourquoi un lot acheté hier est déjà
    // urgent.
    dateShortenedByOpening: Boolean(source?.adjusted_expiration_date),
    expiryKind,
    daysLeft: joursRestants,
  }

  if (!masse.ok) return { ...base, priced: false, reason: `masse_indeterminee:${masse.reason}`, range: null, entry: null }
  if (!recherche.trouve) return { ...base, priced: false, reason: recherche.raison, range: null, entry: null }

  const perKg = entree.perKg
  const kg = masse.grams / 1000
  return {
    ...base,
    priced: true,
    reason: null,
    // Aucune division par le rendement : cf. l'en-tête du fichier. Le lot EST
    // le produit acheté.
    range: { low: perKg.low * kg, central: perKg.central * kg, high: perKg.high * kg },
    confidence: entree.confidence,
    entry: entree,
  }
}

/**
 * Résout le `expiry_kind` d'un lot dans la hiérarchie, comme le fait
 * `analyzeWasteRisks`. Le défaut est `DLC`, c'est-à-dire le seuil le plus
 * strict : se tromper vers l'alerte trop tôt fait perdre une journée de
 * fraîcheur, se tromper vers l'alerte trop tard fait perdre le lot.
 */
function kindDeLot(lot) {
  return lot?.expiry_kind
    ?? lot?.expiryKind
    ?? lot?.archetypes?.expiry_kind
    ?? lot?.products?.archetypes?.expiry_kind
    ?? 'DLC'
}

/**
 * Valorise le garde-manger à risque.
 *
 * @param {Array<Object>} lots — lots (`qty_remaining`, `unit`, dates, `is_opened`)
 * @param {Object} index — index de prix
 * @param {{ today: string }} options — date d'observation, ISO, injectée pour que
 *   le résultat soit déterministe en test et comparé en UTC (CLAUDE.md, piège 4)
 */
export function computeWasteValue(lots, index, { today = null, seuils = SEUILS_ALERTE_JOURS } = {}) {
  const idx = index || INDEX_PRIX_VIDE
  const jour = estDateIso(today) ? today : new Date().toISOString().slice(0, 10)

  const toutes = []
  const perimes = []
  const imminents = []

  for (const lot of lots || []) {
    const kind = kindDeLot(lot)
    const ligne = valoriser(lot, idx, { expiryKind: kind, today: jour })
    toutes.push(ligne)
    if (ligne.daysLeft == null) continue // sans date, un lot n'est ni périmé ni imminent — il est hors sujet
    if (ligne.daysLeft < 0) perimes.push(ligne)
    else if (ligne.daysLeft <= (seuils[kind] ?? seuils.DLC)) imminents.push(ligne)
  }

  const agreger = (lignes) => {
    const couverture = calculerCouverture(lignes)
    const fourchette = composerFourchettes(lignes.filter((l) => l.priced).map((l) => l.range))
    const verdict = verdictAffichage(couverture, { referentielPerime: Boolean(idx.stale) })
    return {
      lots: lignes,
      count: lignes.length,
      range: fourchette,
      rangeArrondi: arrondirFourchette(fourchette),
      coverage: couverture,
      /**
       * Le refus d'affichage porte sur le TOTAL, jamais sur la ligne.
       * La valeur d'un lot est un nombre sourcé isolément, avec sa propre
       * provenance : la montrer est toujours honnête. C'est le total silencieux
       * sur la moitié de la masse qui trompe — d'où les seuils du §8.1 appliqués
       * à l'agrégat seul.
       */
      displayable: verdict.affichable,
      displayRefusal: verdict.refus,
      minorant: couverture.pct !== 100,
    }
  }

  return {
    today: jour,
    currency: idx.currency,
    referenceDate: idx.referenceDate,
    /** Périmés : la perte est déjà consommée, elle se constate. */
    perime: agreger(perimes),
    /** Imminents : la perte est encore évitable, et c'est le montant qui doit motiver. */
    aRisque: agreger(imminents),
    /** Tout le garde-manger valorisé, pour un « valeur du stock » honnête. */
    stock: agreger(toutes),
    attributions: idx.attributions ?? [],
  }
}

/**
 * Valorise l'historique : ce qui a été perdu sur une période.
 *
 * Les lignes attendues sont celles de `waste_prevention_log`, ENRICHIES de leur
 * forme. La table ne porte que `lot_id`, en `ON DELETE SET NULL` : une fois le
 * lot supprimé, plus rien ne relie la ligne à un aliment, et elle devient
 * définitivement invalorisable. C'est une limite du schéma, pas du calcul — on
 * la constate (`forme_absente_du_lot`) au lieu de la combler par une moyenne.
 *
 * `estimated_value_eur` de la table n'est jamais lue : c'est le champ que
 * remplissait l'estimation à 5 €/kg. Reprendre sa valeur reviendrait à
 * blanchir un chiffre inventé en le faisant passer par une base de données.
 *
 * @param {Array<Object>} entrees — lignes de journal `{ action, quantity, unit,
 *   created_at, form_normalized|canonical_name, … }`
 * @param {Object} index
 * @param {{ from?: string, to?: string, actionsPerte?: Set<string> }} options
 */
export function computeWasteHistoryValue(entrees, index, { from = null, to = null, actionsPerte = ACTIONS_PERTE } = {}) {
  const idx = index || INDEX_PRIX_VIDE
  const dansLaPeriode = (ligne) => {
    const date = String(ligne?.created_at ?? ligne?.createdAt ?? '').slice(0, 10)
    if (!estDateIso(date)) return false
    if (from && date < from) return false
    if (to && date > to) return false
    return true
  }

  const pertes = []
  const sauvetages = []
  for (const ligne of entrees || []) {
    if (!dansLaPeriode(ligne)) continue
    const action = String(ligne?.action ?? '').toLowerCase()
    const valorisee = valoriser(ligne, idx, { today: null })
    ;(actionsPerte.has(action) ? pertes : sauvetages).push({ ...valorisee, action })
  }

  const agreger = (lignes) => {
    const couverture = calculerCouverture(lignes)
    const fourchette = composerFourchettes(lignes.filter((l) => l.priced).map((l) => l.range))
    const verdict = verdictAffichage(couverture, { referentielPerime: Boolean(idx.stale) })
    return {
      entries: lignes,
      count: lignes.length,
      range: fourchette,
      rangeArrondi: arrondirFourchette(fourchette),
      coverage: couverture,
      displayable: verdict.affichable,
      displayRefusal: verdict.refus,
      minorant: couverture.pct !== 100,
    }
  }

  return {
    from,
    to,
    currency: idx.currency,
    referenceDate: idx.referenceDate,
    /** Ce qui a été perdu : jeté, périmé, composté. */
    jete: agreger(pertes),
    /**
     * Ce qui a été sauvé. Le montant est réel mais son sens est plus faible :
     * congeler un lot le déplace dans le temps, il ne garantit pas qu'il sera
     * mangé. On le rend séparément pour que l'interface ne l'additionne pas au
     * précédent — « X € jetés » et « Y € sauvés » ne se compensent pas.
     */
    evite: agreger(sauvetages),
    attributions: idx.attributions ?? [],
  }
}
