/**
 * Lecture du référentiel de prix : recollage des tranches, filtrage à l'entrée,
 * index par forme normalisée.
 *
 * Le principe qui gouverne ce fichier est celui du §9 du contrat : « La couche
 * de lecture ne rend QUE les entrées A et B non périmées — le filtrage se fait
 * à l'entrée, une fois, pas dans chaque appelant. » Un appelant qui doit se
 * souvenir d'exclure les entrées en C finira par oublier, et le jour où il
 * oublie, un gabarit non relevé devient un prix affiché.
 *
 * Conséquence assumée de l'API : `trouverPrix` ne rend jamais une entrée en C.
 * Elle rend `{ trouve: false, raison: 'confiance_insuffisante' }`, ce qui n'est
 * pas la même chose que « forme inconnue » et se raconte différemment à
 * l'utilisateur — mais qui produit le même montant, c'est-à-dire aucun.
 */

import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'
import { TRANCHES } from '@/lib/domain/pricing/tranches'
import { AGE_MAX_AFFICHABLE_MOIS, CONFIANCES_RETENUES, moisEntre } from '@/lib/domain/pricing/priceMath'

const VERSION_CONTRAT = '1.0.0'

/**
 * Index vide : l'état NORMAL au démarrage d'un référentiel, pas une panne.
 * Il est exporté parce que tout le reste de la couche doit se comporter
 * correctement avec lui, et qu'un test qui veut « pas de prix du tout » ne doit
 * pas avoir à fabriquer une structure à la main.
 */
export const INDEX_PRIX_VIDE = Object.freeze({
  entries: Object.freeze(new Map()),
  formCount: 0,
  currency: null,
  country: null,
  referenceDate: null,
  priceSetVersions: Object.freeze([]),
  catalogVersions: Object.freeze([]),
  derivedLicense: null,
  attributions: Object.freeze([]),
  ageMonths: null,
  stale: false,
  empty: true,
  rejected: Object.freeze([]),
  conflicts: Object.freeze([]),
})

const estDateIso = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const nombre = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)

/**
 * Une entrée est-elle exploitable ? Le refus est TOUJOURS motivé, et le motif
 * est conservé dans `index.rejected` : une forme non chiffrée doit pouvoir
 * s'expliquer, sans quoi la file de revue n'a rien à relire.
 *
 * Ce contrôle est délibérément un sous-ensemble de
 * scripts/data/prices/check-price-provenance.mjs, et ne le remplace pas. Le
 * contrôleur vérifie la PROVENANCE (licence vérifiée, citation portant le
 * chiffre, arithmétique de conversion recalculée contre le catalogue) et refuse
 * en CI. Ici, à la lecture, on ne revérifie pas la licence d'un fichier déjà
 * versionné : on vérifie ce qui peut rendre un CALCUL faux ou trompeur —
 * confiance, péremption, cohérence des bornes, rendement dans son domaine.
 * Dupliquer le contrôleur ici donnerait deux vérités sur la même règle.
 */
function evaluerEntree(entree, { referenceDate }) {
  if (!entree || typeof entree !== 'object') return { ok: false, raison: 'entree_malformee' }
  const forme = typeof entree.form_normalized === 'string' ? entree.form_normalized : null
  if (!forme) return { ok: false, raison: 'form_normalized_absente' }

  if (!CONFIANCES_RETENUES.has(entree.confidence)) {
    // §4 : « Ici, C équivaut à l'absence. » L'entrée reste au fichier pour la
    // traçabilité ; elle ne devient pas un montant.
    return { ok: false, raison: 'confiance_insuffisante', forme }
  }

  const observeLe = entree.provenance?.observed_on
  if (!estDateIso(observeLe)) return { ok: false, raison: 'observed_on_absente', forme }
  const age = referenceDate ? moisEntre(observeLe, referenceDate) : null
  if (age != null && age > AGE_MAX_AFFICHABLE_MOIS) {
    // §5.3 : au-delà de 24 mois, un indice national ne porte plus la structure
    // relative des prix. On préfère l'absence à un nombre plausible et faux.
    return { ok: false, raison: 'prix_perime', forme, ageMonths: age }
  }

  const perKg = entree.per_kg
  const low = nombre(perKg?.low)
  const central = nombre(perKg?.central)
  const high = nombre(perKg?.high)
  if (low == null || central == null || high == null) return { ok: false, raison: 'per_kg_absent', forme }
  if (!(low > 0 && central > 0 && high > 0)) return { ok: false, raison: 'per_kg_non_positif', forme }
  if (!(low <= central && central <= high)) return { ok: false, raison: 'fourchette_inversee', forme }

  const rendement = nombre(entree.edible_yield?.value)
  if (rendement == null || !(rendement > 0) || rendement > 1) {
    return { ok: false, raison: 'rendement_hors_domaine', forme }
  }
  // §2.2 : un rendement ≠ 1 est une donnée sourcée comme une autre. Sans
  // provenance, il serait la porte de service par laquelle les nombres inventés
  // rentrent — on refuse l'entrée plutôt que de ramener le rendement à 1, ce
  // qui masquerait le défaut au lieu de le signaler.
  if (rendement !== 1 && !entree.edible_yield?.provenance) {
    return { ok: false, raison: 'rendement_non_source', forme }
  }

  return { ok: true, forme, ageMonths: age }
}

/**
 * Projection lue par le calcul. Volontairement étroite : le calcul ne lit que
 * `per_kg` et `edible_yield` (§1.1, §1.3). `observed` et `provenance` suivent
 * pour l'affichage et la citation, jamais pour l'arithmétique.
 */
function projeter(entree, tranche, ageMonths) {
  return Object.freeze({
    form: entree.form,
    formNormalized: entree.form_normalized,
    category: entree.category ?? null,
    perKg: Object.freeze({ low: entree.per_kg.low, central: entree.per_kg.central, high: entree.per_kg.high }),
    conversion: Object.freeze({ ...(entree.per_kg.conversion || {}) }),
    edibleYield: Object.freeze({
      value: entree.edible_yield.value,
      known: Boolean(entree.edible_yield.known),
      note: entree.edible_yield.note ?? null,
    }),
    confidence: entree.confidence,
    confidenceReason: entree.confidence_reason ?? null,
    observed: Object.freeze({ ...(entree.observed || {}) }),
    provenance: Object.freeze({ ...(entree.provenance || {}) }),
    reindexation: entree.reindexation ?? null,
    ageMonths,
    priceSetVersion: tranche.price_set_version ?? null,
    referenceDate: tranche.reference_date ?? null,
  })
}

/**
 * Deux tranches cotent la même forme : laquelle garde-t-on ?
 *
 * Le cas n'est pas théorique — au moment où cette couche est écrite, cinq formes
 * sont cotées par deux tranches à la fois (l'huile d'olive et l'œuf cru, entre
 * autres), toutes à confiance égale. Trancher par ordre d'import ou par nom de
 * fichier serait arbitraire, donc exactement le genre de choix invisible que le
 * §0 proscrit.
 *
 * La règle retenue n'invente aucun critère : elle emprunte au contrat les deux
 * axes selon lesquels il classe DÉJÀ les relevés.
 *   1. la confiance (§4 : A vaut mieux que B, C n'existe pas ici) ;
 *   2. à confiance égale, la fraîcheur de l'observation — le §5 fait de
 *      `observed_on` l'axe le long duquel un prix perd sa validité, donc un
 *      relevé plus récent du même produit est meilleur par la propre échelle du
 *      contrat, pas par une préférence de l'auteur ;
 *   3. à fraîcheur égale, le nombre d'observations, seule mesure de robustesse
 *      que les entrées portent.
 *
 * Ce qui a été ÉCARTÉ : fusionner les deux relevés en une fourchette élargie.
 * Ce serait fabriquer une distribution que ni l'une ni l'autre des sources ne
 * publie, alors que le §3.1 refuse déjà d'écrire une incertitude qu'aucune
 * source ne porte. Et la moyenne des deux centrales serait un nombre qu'aucune
 * citation ne peut plus retrouver.
 *
 * Si les trois critères s'égalisent, il n'existe plus de raison de préférer l'un
 * à l'autre : la forme est refusée entièrement et le conflit est enregistré.
 * Perdre une forme est réparable, choisir en secret ne l'est pas.
 */
function comparerCandidats(a, b) {
  if (a.confidence !== b.confidence) return a.confidence === 'A' ? -1 : 1
  const da = a.provenance?.observed_on || ''
  const db = b.provenance?.observed_on || ''
  if (da !== db) return da > db ? -1 : 1
  const na = Number(a.observed?.n_observations) || 0
  const nb = Number(b.observed?.n_observations) || 0
  if (na !== nb) return nb - na
  return 0
}

/**
 * Licence du référentiel recollé.
 *
 * ODbL est à partage à l'identique : dès qu'une entrée retenue s'en réclame,
 * elle contamine le tout et le résultat DOIT s'annoncer en `odbl-1.0` — c'est ce
 * que le contrat impose déjà à `derived_license` au niveau d'un jeu (§10.1), et
 * recoller quatre tranches ne peut pas relâcher la contrainte la plus stricte.
 * Le calcul se fait sur les entrées RETENUES : une tranche ODbL dont toutes les
 * entrées seraient périmées n'imposerait plus rien, puisqu'aucun de ses chiffres
 * ne serait servi.
 */
function licenceComposee(entreesRetenues, tranches) {
  const licences = new Set()
  let partageIdentique = false
  for (const entree of entreesRetenues) {
    if (entree.provenance?.license_code) licences.add(entree.provenance.license_code)
    if (entree.provenance?.allowed_uses?.share_alike) partageIdentique = true
  }
  if (partageIdentique) return 'odbl-1.0'
  if (licences.size === 1) return [...licences][0]
  if (licences.size === 0) return null
  // Plusieurs licences non contaminantes : on ne fabrique pas une licence
  // composite, on énumère. Un humain tranchera au moment de publier.
  return [...licences].sort().join('+')
}

/**
 * Construit l'index à partir de jeux de prix déjà chargés.
 *
 * PURE et injectable : c'est elle que les tests appellent, avec des jeux
 * fabriqués à la main. `obtenirIndexPrix()` n'est qu'un habillage qui lui passe
 * les tranches versionnées. Aucune règle de la couche prix ne doit dépendre de
 * la présence d'un fichier sur le disque.
 *
 * @param {Array<Object>} jeux — jeux de prix au format du contrat
 * @param {{ today?: string|null }} options — date d'affichage (§5.4), ISO
 */
export function buildPriceIndex(jeux, { today = null } = {}) {
  const valides = (jeux || []).filter(
    (jeu) => jeu && typeof jeu === 'object' && Array.isArray(jeu.entries),
  )
  if (!valides.length) return INDEX_PRIX_VIDE

  const rejected = []
  const conflicts = []
  const candidats = new Map()

  for (const jeu of valides) {
    if (jeu.schema_version && jeu.schema_version !== VERSION_CONTRAT) {
      // On ne lit pas un fichier avec les règles d'une autre version : les
      // champs pourraient porter le même nom et un sens différent.
      rejected.push({ formNormalized: null, raison: 'schema_version_incompatible', priceSetVersion: jeu.price_set_version ?? null })
      continue
    }
    const referenceDate = estDateIso(jeu.reference_date) ? jeu.reference_date : null
    for (const entree of jeu.entries) {
      const verdict = evaluerEntree(entree, { referenceDate })
      if (!verdict.ok) {
        rejected.push({ formNormalized: verdict.forme ?? null, raison: verdict.raison, priceSetVersion: jeu.price_set_version ?? null })
        continue
      }
      const projection = projeter(entree, jeu, verdict.ageMonths)
      const liste = candidats.get(verdict.forme) || []
      liste.push(projection)
      candidats.set(verdict.forme, liste)
    }
  }

  const entries = new Map()
  for (const [forme, liste] of candidats) {
    if (liste.length === 1) {
      entries.set(forme, liste[0])
      continue
    }
    const triees = [...liste].sort(comparerCandidats)
    const departageable = comparerCandidats(triees[0], triees[1]) !== 0
    conflicts.push({
      formNormalized: forme,
      retained: departageable ? triees[0].priceSetVersion : null,
      discarded: triees.slice(departageable ? 1 : 0).map((c) => c.priceSetVersion),
      resolved: departageable,
      rule: 'confiance, puis fraicheur de observed_on, puis n_observations',
    })
    if (departageable) entries.set(forme, triees[0])
    else rejected.push({ formNormalized: forme, raison: 'conflit_non_departageable', priceSetVersion: null })
  }

  const retenues = [...entries.values()]
  const datesReference = valides.map((jeu) => jeu.reference_date).filter(estDateIso).sort()
  // La date affichée est la PLUS ANCIENNE des tranches recollées : c'est celle
  // qui date honnêtement l'ensemble. Annoncer la plus récente ferait passer un
  // jeu partiellement ancien pour un jeu frais.
  const referenceDate = datesReference[0] ?? null
  const ageMonths = referenceDate && estDateIso(today) ? moisEntre(referenceDate, today) : null

  return Object.freeze({
    entries,
    formCount: entries.size,
    currency: valides.find((jeu) => jeu.currency)?.currency ?? null,
    country: valides.find((jeu) => jeu.country)?.country ?? null,
    referenceDate,
    priceSetVersions: Object.freeze(valides.map((jeu) => jeu.price_set_version ?? null).filter(Boolean)),
    catalogVersions: Object.freeze([...new Set(valides.map((jeu) => jeu.catalog_version).filter(Boolean))]),
    derivedLicense: licenceComposee(retenues, valides),
    attributions: Object.freeze([...new Set(
      retenues
        .filter((e) => e.provenance?.allowed_uses?.attribution_required)
        .map((e) => e.provenance.source_code)
        .filter(Boolean),
    )].sort()),
    ageMonths,
    // §5.4 : passé 24 mois, la fonctionnalité s'éteint entièrement. Un
    // référentiel abandonné ne doit pas continuer à afficher des chiffres avec
    // assurance.
    stale: ageMonths != null && ageMonths > AGE_MAX_AFFICHABLE_MOIS,
    empty: entries.size === 0,
    rejected: Object.freeze(rejected),
    conflicts: Object.freeze(conflicts),
  })
}

/**
 * Recherche d'un prix, avec sa provenance.
 *
 * Accepte indifféremment un libellé de catalogue (« Oignon jaune cru ») ou une
 * clé déjà normalisée : la normalisation est idempotente, et exiger de
 * l'appelant qu'il sache laquelle il tient serait la garantie qu'un appelant sur
 * cinq se trompe.
 *
 * Rend TOUJOURS un objet motivé, jamais `null` nu : « je n'ai pas ce prix » et
 * « le référentiel est éteint » demandent deux phrases différentes à
 * l'interface, alors qu'un `null` les confond.
 */
export function trouverPrix(index, forme) {
  const idx = index || INDEX_PRIX_VIDE
  if (idx.stale) return { trouve: false, raison: 'referentiel_perime', entree: null }
  const cle = normalizeFoodForm(forme)
  if (!cle) return { trouve: false, raison: 'forme_absente_de_la_demande', entree: null }
  const entree = idx.entries.get(cle)
  if (!entree) {
    // Le motif distingue les deux situations que l'utilisateur vit
    // différemment : « ce référentiel ne couvre encore rien » et « il couvre
    // beaucoup, mais pas cet aliment-là ».
    return { trouve: false, raison: idx.empty ? 'referentiel_vide' : 'forme_non_couverte', entree: null }
  }
  return { trouve: true, raison: null, entree }
}

/** Métadonnées d'affichage : ce que le §7.1 impose de montrer à côté de tout montant. */
export function metadonneesReferentiel(index) {
  const idx = index || INDEX_PRIX_VIDE
  return {
    referenceDate: idx.referenceDate,
    currency: idx.currency,
    country: idx.country,
    formCount: idx.formCount,
    derivedLicense: idx.derivedLicense,
    attributions: idx.attributions,
    priceSetVersions: idx.priceSetVersions,
    ageMonths: idx.ageMonths,
    stale: idx.stale,
    empty: idx.empty,
  }
}

/**
 * Index construit une fois sur les tranches versionnées.
 *
 * Mémoïsé par date d'affichage : `stale` dépend du jour, et un index figé au
 * démarrage d'un serveur qui tourne des mois finirait par mentir sur son propre
 * âge. La clé de cache est la date, pas l'instant — recalculer une fois par jour
 * suffit largement pour un fichier qui ne change qu'au commit.
 */
const cache = new Map()

export function obtenirIndexPrix({ today = null } = {}) {
  const jour = estDateIso(today) ? today : new Date().toISOString().slice(0, 10)
  if (!cache.has(jour)) cache.set(jour, buildPriceIndex(TRANCHES, { today: jour }))
  return cache.get(jour)
}

/** Purge du mémo — réservée aux tests, qui font varier la date d'affichage. */
export function reinitialiserIndexPrix() {
  cache.clear()
}
