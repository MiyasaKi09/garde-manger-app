/**
 * Passerelle serveur entre la couche de calcul du coût et les écrans.
 *
 * POURQUOI CE FICHIER EST DU CÔTÉ SERVEUR, ET DOIT LE RESTER.
 * `lib/domain/pricing/tranches.js` importe les quatre tranches du référentiel
 * AU BUILD : 670 ko de JSON, figés dans le bundle. Un composant client qui
 * importerait `obtenirIndexPrix` les enverrait au navigateur pour en tirer une
 * ligne de texte de quarante caractères. Les pages garde-manger, courses et
 * planning sont des composants client ; elles reçoivent donc leur estimation
 * DÉJÀ RÉDUITE À DES CHAÎNES par les routes d'API, et le référentiel ne quitte
 * jamais le serveur. La fiche recette, elle, est un composant serveur et appelle
 * ces fonctions directement.
 *
 * Le dossier est préfixé d'un souligné : Next.js exclut du routage les dossiers
 * `_*`, donc rien ici n'est atteignable par URL.
 *
 * CE FICHIER NE CALCULE RIEN. Il assemble : il branche la couche de calcul
 * (lib/domain/pricing/) sur la couche de rédaction (components/pricing/) et
 * rend des objets sérialisables. Toute arithmétique qui apparaîtrait ici serait
 * une seconde vérité sur un nombre que le contrat a déjà tranché ailleurs — à
 * une exception près, signalée sur place : le passage du conditionnement d'un
 * article de courses à une quantité d'achat, qui n'existe nulle part ailleurs.
 */

import { obtenirIndexPrix } from '@/lib/domain/pricing/priceIndex'
import { computeRecipeCost } from '@/lib/domain/pricing/recipeCost'
import { coutDeCarte } from '@/lib/domain/recipes/canonicalCatalog'
import { computeShoppingListCost } from '@/lib/domain/pricing/shoppingListCost'
import { computeWasteValue, SEUILS_ALERTE_JOURS } from '@/lib/domain/pricing/wasteValue'
import { parseQuantity } from '@/lib/parseQuantity'
import { canonicalUnit } from '@/lib/domain/units'
import {
  vueCoutCourses,
  vueCoutRecette,
  vueLotsValorises,
  vueValeurGardeManger,
} from '@/components/pricing/estimationView'
import { comparerEnveloppe, proraterEnveloppe, texteEnveloppe } from '@/components/pricing/budgetEnvelope'

/** Date du jour en ISO UTC — la seule façon de dater sans décalage (CLAUDE.md, piège 4). */
export const aujourdhui = () => new Date().toISOString().slice(0, 10)

export function indexPrix(today = aujourdhui()) {
  return obtenirIndexPrix({ today })
}

/**
 * Métadonnées du référentiel, telles qu'un écran doit pouvoir les écrire.
 * `stale` porte le §5.4 : passé 24 mois, la fonctionnalité s'éteint entièrement
 * et l'interface doit dire que le référentiel est trop ancien — pas afficher
 * des chiffres avec assurance.
 */
export function metaReferentiel(index) {
  return {
    date: index.referenceDate,
    formes: index.formCount,
    licence: index.derivedLicense,
    attributions: index.attributions,
    perime: Boolean(index.stale),
    vide: Boolean(index.empty),
  }
}

/** Coût d'une recette matérialisée : coût par portion et total, en fourchette. */
export function estimationRecette(recette, { today = aujourdhui() } = {}) {
  const index = indexPrix(today)
  const cout = computeRecipeCost(recette, index)
  return {
    ...vueCoutRecette(cout),
    referentiel: metaReferentiel(index),
  }
}

/**
 * Le bloc `cost` des cartes de catalogue, indexé par code de recette.
 *
 * Le calcul est partagé avec `getCanonicalRecipeCards` — même fonction de mise
 * en forme (`coutDeCarte`), donc même carte pour une même recette, qu'elle
 * vienne du corpus versionné ou de la base.
 *
 * §8.4 : aucun classement par prix tant que toutes les couvertures comparées ne
 * sont pas à 100 %. Cette fonction ne trie donc RIEN — elle rend un bloc par
 * recette, dans l'ordre reçu. Le jour où quelqu'un voudra trier, il devra passer
 * par `classerParCout`, qui sépare explicitement le sous-ensemble comparable.
 */
export function coutsDeCartes(recettes, { today = aujourdhui() } = {}) {
  const index = indexPrix(today)
  const parCode = new Map()
  for (const recette of recettes || []) {
    if (!recette?.code) continue
    parCode.set(recette.code, coutDeCarte(recette, index))
  }
  return { parCode, referentiel: metaReferentiel(index) }
}

/**
 * Passage d'un article de courses aux quantités que la couche de calcul attend.
 *
 * C'EST LA SEULE ARITHMÉTIQUE DE CE FICHIER, et elle mérite son explication.
 * `nutrition_plan_shopping_items` ne porte pas les trois quantités de
 * `finalDemands` : il porte un `quantity` en texte libre (le BESOIN, « 600 g
 * (400 g en stock) ») et un conditionnement éditable par l'utilisateur
 * (`container_qty` × `container_size` `container_unit`). Le contrat impose de
 * chiffrer une liste au CONTENANT (§6.2) : c'est donc le conditionnement qui
 * fait la quantité d'achat.
 *
 * QUAND LE CONDITIONNEMENT MANQUE — et il manque souvent, la page laisse
 * l'utilisateur le saisir — deux réponses étaient possibles :
 *   a) ne pas chiffrer la ligne. Honnête, mais la couverture s'effondrerait sur
 *      un défaut de saisie plutôt que sur un défaut de source, et le total
 *      disparaîtrait pour une raison qui n'a rien à voir avec les prix ;
 *   b) prendre le BESOIN comme quantité d'achat. C'est ce qui est fait, parce
 *      qu'on n'achète jamais moins que ce qu'on utilise : le montant obtenu est
 *      un MINORANT au sens exact du §7.3, du même genre que celui des lignes non
 *      chiffrées. Ce n'est pas un nombre inventé, c'est une quantité connue
 *      employée comme borne inférieure — et l'écran le dit.
 *
 * Le besoin n'est transmis que s'il s'exprime dans la MÊME unité canonique que
 * l'achat. Comparer 600 g à 2 bouteilles suppose une densité que la ligne ne
 * porte pas, et le §1.2 refuse explicitement de supposer 1,00.
 */
export function articleVersLigneDeCout(item) {
  const besoin = parseQuantity(item?.quantity)
  const nbContenants = Number(item?.container_qty)
  const tailleContenant = Number(item?.container_size)
  const uniteContenant = item?.container_unit || null
  const contenantConnu = Number.isFinite(nbContenants) && nbContenants > 0
    && Number.isFinite(tailleContenant) && tailleContenant > 0
    && Boolean(uniteContenant)

  const achatQte = contenantConnu ? nbContenants * tailleContenant : besoin.qty
  const achatUnite = contenantConnu ? uniteContenant : besoin.unit
  const memeUnite = canonicalUnit(besoin.unit) === canonicalUnit(achatUnite)

  return {
    ligne: {
      product_name: item?.product_name,
      category: item?.category ?? null,
      purchase_qty: achatQte,
      purchase_unit: achatUnite,
      exact_required_qty: memeUnite ? besoin.qty : undefined,
      // `NaN` — et non 0 — quand le surplus n'est pas déterminable. La couche de
      // calcul refuse un `NaN` (« quantité absente ») alors qu'elle croirait un
      // 0, et un surplus faussement nul ferait disparaître de l'écran ce qui
      // rejoint pourtant le garde-manger.
      projected_surplus_qty: memeUnite ? Math.max(0, achatQte - besoin.qty) : NaN,
      container_qty: contenantConnu ? nbContenants : null,
      container_size: contenantConnu ? tailleContenant : null,
      container_unit: uniteContenant,
    },
    contenantConnu,
  }
}

/**
 * Coût d'une liste de courses, par semaine et au total.
 *
 * Découpé par `week_label` parce que c'est l'unité que l'utilisateur regarde :
 * un import peut couvrir un mois, et « le total du mois » ne répond pas à la
 * question « combien coûte cette semaine ». Le total reste rendu, pour l'écran
 * planning où un import vaut une semaine.
 */
export function estimationCourses(items, { today = aujourdhui(), enveloppe = null, index = null } = {}) {
  // `index` est injectable pour que l'assemblage — regroupement par semaine,
  // comptage des conditionnements manquants, confrontation à l'enveloppe —
  // soit testable sur un référentiel fabriqué. Un test qui dépendrait du
  // référentiel réel mesurerait son avancement, pas la justesse de ce code.
  const idx = index || indexPrix(today)
  const lignes = []
  const parSemaineItems = new Map()
  let sansContenant = 0

  for (const item of items || []) {
    const { ligne, contenantConnu } = articleVersLigneDeCout(item)
    if (!contenantConnu) sansContenant++
    lignes.push(ligne)
    const semaine = item?.week_label || null
    if (!semaine) continue
    const groupe = parSemaineItems.get(semaine) || []
    groupe.push(ligne)
    parSemaineItems.set(semaine, groupe)
  }

  const chiffrer = (lot, manquants, { comparable = false } = {}) => {
    const cout = computeShoppingListCost(lot, idx)
    const vues = vueCoutCourses(cout)
    return {
      ...vues,
      articles: lot.length,
      /**
       * Combien d'articles sont comptés à leur quantité NÉCESSAIRE faute de
       * conditionnement saisi. L'écran doit pouvoir le dire : c'est la
       * différence entre « il manque des prix » et « il manque une saisie », et
       * la seconde, l'utilisateur peut la corriger en trois secondes sur cette
       * page même.
       */
      sansContenant: manquants,
      budget: comparable ? confronter(cout, vues.achat, enveloppe) : null,
    }
  }

  const parSemaine = {}
  for (const [semaine, groupe] of parSemaineItems) {
    const manquants = groupe.filter((l) => !l.container_qty).length
    parSemaine[semaine] = chiffrer(groupe, manquants, { comparable: true })
  }

  return {
    /**
     * Le total ne se confronte à l'enveloppe QUE s'il ne couvre qu'une semaine.
     * Un import peut porter un mois : additionner ses quatre semaines et les
     * comparer à une enveloppe hebdomadaire annoncerait un dépassement
     * mécanique, et les comparer à une enveloppe mensuelle supposerait que ces
     * quatre semaines-là font le mois — ce que personne n'a vérifié.
     */
    total: chiffrer(lignes, sansContenant, { comparable: parSemaineItems.size <= 1 }),
    parSemaine,
    enveloppe,
    referentiel: metaReferentiel(idx),
  }
}

/**
 * Le verdict budgétaire, rendu côté serveur avec le montant.
 *
 * La comparaison a besoin des NOMBRES (bornes de la fourchette), que la vue ne
 * transporte pas — elle ne porte que des chaînes déjà arrondies. La faire ici
 * évite d'avoir à renvoyer les nombres bruts au navigateur juste pour les
 * comparer, et garantit surtout qu'elle est faite une seule fois : deux écrans
 * qui compareraient chacun de leur côté finiraient par ne pas répondre pareil à
 * la même question.
 */
function confronter(cout, vue, enveloppe) {
  if (!enveloppe || !cout?.coutAchat || !vue?.affichable) return null
  const proratee = proraterEnveloppe(enveloppe, 'week')
  const verdict = comparerEnveloppe(cout.coutAchat, proratee, { minorant: vue.minorant })
  if (!verdict) return null
  return { etat: verdict.etat, texte: texteEnveloppe(verdict) }
}

/**
 * Valeur de ce qui va périmer au garde-manger.
 *
 * Les lots arrivent de `/api/pantry` avec leur nom canonique éventuel imbriqué
 * dans `canonical_foods` ; `wasteValue` cherche une clé de forme à plat. On
 * remonte donc le nom canonique en tête de lot AVANT le nom d'affichage : ce
 * dernier peut être un libellé commercial (« Beurre doux Président 250 g ») que
 * `normalizeFoodForm` ne rapprochera d'aucune forme du catalogue. Aucun
 * rapprochement approximatif n'est tenté : sans nom canonique, le lot reste non
 * valorisé, ce que le système sait représenter.
 */
export function estimationGardeManger(lots, { today = aujourdhui() } = {}) {
  const index = indexPrix(today)
  const aplatis = (lots || []).map((lot) => ({
    ...lot,
    canonical_name: lot?.canonical_foods?.canonical_name
      ?? lot?.canonical_name
      ?? lot?.archetypes?.name
      ?? null,
    expiry_kind: lot?.expiry_kind ?? lot?.archetypes?.expiry_kind ?? null,
  }))
  const valeur = computeWasteValue(aplatis, index, { today })
  const bloc = (agregat, { avecLots = true } = {}) => ({
    count: agregat.count,
    vue: vueValeurGardeManger(agregat, {
      referenceDate: index.referenceDate,
      attributions: index.attributions,
    }),
    lots: avecLots ? vueLotsValorises(agregat.lots) : null,
  })
  return {
    aRisque: bloc(valeur.aRisque),
    perime: bloc(valeur.perime),
    // Le stock entier n'envoie que son total : détailler cent lots pour un
    // chiffre unique ferait passer tout l'inventaire une seconde fois sur le
    // réseau, en double des lots que la page a déjà reçus.
    stock: bloc(valeur.stock, { avecLots: false }),
    seuils: SEUILS_ALERTE_JOURS,
    referentiel: metaReferentiel(index),
  }
}
