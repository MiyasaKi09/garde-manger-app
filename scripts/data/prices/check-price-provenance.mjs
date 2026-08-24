/**
 * Refuse tout prix qui ne satisfait pas le contrat de données.
 *
 * Ce contrôle REFUSE, là où check-arbitration-arithmetic.mjs se contente de
 * signaler. La différence est assumée : un arbitrage douteux est de la prose
 * qu'un relecteur relira de toute façon, tandis qu'un prix douteux est un nombre
 * multiplié par toutes les recettes qui emploient la forme, agrégé dans un
 * panier, arrondi, affiché — et que plus personne ne relira jamais ligne à
 * ligne. Un faux positif coûte ici bien moins cher qu'un silence.
 *
 * CE QU'IL NE SAIT PAS FAIRE, et qu'il faut avoir en tête : détecter un chiffre
 * inventé. Aucun programme ne le sait. « 2,45 €/kg » a exactement la même tête
 * que le prix relevé et que le prix imaginé. Ce que ce script impose, c'est que
 * chaque chiffre porte une SOURCE ACTIVE, une DATE et une CITATION contenant le
 * chiffre lu — c'est-à-dire qu'inventer un prix oblige à inventer aussi la ligne
 * de cotation qui le porte, et cette ligne-là, un humain peut aller la relire.
 * Le contrôle déplace le mensonge d'un endroit invérifiable vers un endroit
 * vérifiable ; il ne le supprime pas.
 *
 * Contrat : data/prices/CONTRAT.md — c'est lui qui fait autorité.
 * Schéma    : data/prices/schema.json
 * Registre  : data/prices/sources.json
 *
 *   node scripts/data/prices/check-price-provenance.mjs                 # référentiel par défaut
 *   node scripts/data/prices/check-price-provenance.mjs <fichier>       # un lot, avant fusion
 *   node scripts/data/prices/check-price-provenance.mjs <fichier> --json
 *
 * Sortie non nulle dès la première violation : appelable tel quel en CI.
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const REFERENTIEL_PAR_DEFAUT = join(ROOT, 'data', 'prices', 'reference-fr.json')
const REGISTRE = join(ROOT, 'data', 'prices', 'sources.json')
const CATALOGUE = join(ROOT, 'scripts', 'data', 'out', 'recipe-food-catalog.json')

export const VERSION_CONTRAT = '1.0.0'

/** Âges, en mois, du §5 du contrat. */
export const AGE_MAX_CONFIANCE_A = 12
export const AGE_MAX_AFFICHABLE = 24

/**
 * Catégories dont le prix bouge avec la saison. Un relevé ponctuel y est
 * automatiquement C : une courgette de juillet n'est pas une courgette de
 * janvier, et l'écart n'est visible dans aucun contrôle de forme.
 */
export const CATEGORIES_SAISONNIERES = new Set(['legumes', 'fruits', 'herbes_aromates'])

/**
 * Rapport D9/D1 au-delà duquel la fourchette ne décrit plus un aliment.
 *
 * Dix a été choisi pour rester bien au-dessus de la dispersion réelle d'un
 * produit frais — un facteur trois entre le moins cher et le plus cher d'un
 * légume est courant, un facteur cinq arrive sur les produits saisonniers. Un
 * facteur dix ne s'explique plus par le marché : il signale qu'on a agrégé deux
 * produits différents sous le même libellé (l'huile d'olive de premier prix et
 * une AOP en bouteille de 25 cl), et la médiane d'un tel mélange ne veut rien
 * dire non plus.
 */
export const RAPPORT_FOURCHETTE_MAX = 10

const CHAMPS_ENTREE = new Set([
  'form', 'form_normalized', 'category', 'observed', 'per_kg', 'edible_yield',
  'confidence', 'confidence_reason', 'provenance', 'reindexation', 'notes',
])
const CHAMPS_OBSERVED = new Set([
  'basis', 'low', 'central', 'high', 'unit', 'dispersion', 'aggregation',
  'n_observations', 'period_start', 'period_end',
])
const CHAMPS_PROVENANCE = new Set([
  'source_code', 'source_url', 'license_code', 'license_url', 'allowed_uses',
  'retrieved_on', 'observed_on', 'source_record_key', 'citation',
])

const UNITE_ATTENDUE = { kg: 'EUR/kg', l: 'EUR/l', piece: 'EUR/piece' }
const CONVERSION_ATTENDUE = { kg: 'identity', l: 'density', piece: 'grams_per_piece' }
const RANG_CONFIANCE = { C: 0, B: 1, A: 2 }

/**
 * Reproduit normalizeFoodForm (lib/domain/recipes/materializeRecipe.js).
 *
 * Recopié plutôt qu'importé : ce module est un script Node lancé directement,
 * et materializeRecipe importe par l'alias « @/ » que seuls Next et vitest
 * résolvent. Importer le vrai module obligerait à charger tout le calculateur
 * nutritionnel pour normaliser une chaîne. La contrepartie — deux copies d'une
 * même règle — est tenue par le contrôle form_normalized_mismatch, qui compare
 * la clé du référentiel à celle du catalogue réel : si les deux normalisations
 * divergeaient, toutes les entrées échoueraient d'un coup, bruyamment.
 */
export function normaliserForme(valeur) {
  return String(valeur || '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

const EST_DATE = (valeur) => typeof valeur === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valeur)

/**
 * Écart en mois entre deux dates ISO, par arithmétique de chaîne.
 *
 * Aucun objet Date n'est construit : « 2026-07-31 » lu dans un fuseau à l'ouest
 * de Greenwich devient le 30 juillet, et le décalage d'un jour se propagerait
 * jusque dans le verdict de péremption d'une entrée à la limite des 24 mois
 * (CLAUDE.md, piège 4). Le mois est ici l'unité utile : personne ne réindexe à
 * la journée.
 */
export function moisEntre(depuis, jusqu) {
  const [a1, m1, j1] = depuis.split('-').map(Number)
  const [a2, m2, j2] = jusqu.split('-').map(Number)
  let mois = (a2 - a1) * 12 + (m2 - m1)
  if (j2 < j1) mois -= 1
  return mois
}

/** Tolérance d'arrondi sur un montant recalculé : le centime, ou 0,2 % au-delà de 5 €. */
const tolerance = (attendu) => Math.max(0.011, Math.abs(attendu) * 0.002)

/**
 * Le chiffre lu doit figurer LITTÉRALEMENT dans la citation.
 *
 * On accepte le point comme la virgule décimale, et l'écriture avec ou sans
 * décimale finale, parce que les sources publient « 2,2 » aussi bien que
 * « 2,20 ». On n'accepte pas l'approximation : une citation qui ne porte pas le
 * chiffre n'est pas une citation, c'est un commentaire.
 */
function citationPorteLeChiffre(citation, valeur) {
  const texte = String(citation || '')
  const ecritures = new Set()
  for (const brut of [String(valeur), valeur.toFixed(1), valeur.toFixed(2)]) {
    ecritures.add(brut)
    ecritures.add(brut.replace('.', ','))
  }
  return [...ecritures].some((ecriture) => texte.includes(ecriture))
}

const MARQUEURS_GABARIT = /\b(gabarit|todo|placeholder|fixme|xxx|[àa]\s*remplacer|exemple\s+non\s+relev)/i

/** Convertit une valeur de la base native vers l'euro par kilogramme acheté. */
function versKilo(valeur, base, facteur) {
  if (base === 'kg') return valeur
  if (base === 'l') return valeur / facteur // 1 L pèse `densité` kg
  if (base === 'piece') return valeur / (facteur / 1000)
  return null
}

/**
 * Contrôle un jeu de prix complet.
 *
 * Fonction PURE : aucun accès disque, aucune lecture d'environnement. Le
 * registre et le catalogue sont injectés, ce qui permet aux tests de construire
 * des cas minimaux au lieu de fabriquer un dépôt entier — et ce qui garantit que
 * le contrôle ne dépend pas de l'état du disque au moment où il tourne.
 *
 * @param {object} jeu         le jeu de prix (data/prices/reference-fr.json)
 * @param {object} contexte.sources    le registre (data/prices/sources.json)
 * @param {Array}  contexte.formes     les formes du catalogue (recipe-food-catalog.json .forms)
 * @param {string} [contexte.aujourdhui] date ISO, pour la péremption du jeu entier
 * @returns {{ violations: Array, stats: object }}
 */
export function controlerReferentiel(jeu, { sources, formes, aujourdhui = null } = {}) {
  const violations = []
  const ajouter = (code, forme, message) => violations.push({ code, form: forme, message })

  const parCode = new Map((sources?.sources || []).map((source) => [source.code, source]))
  const parForme = new Map((formes || []).map((forme) => [forme.canonical_name_normalized, forme]))

  // ── Le jeu lui-même ───────────────────────────────────────────────────────
  if (jeu?.schema_version !== VERSION_CONTRAT) {
    ajouter('schema_version_mismatch', null,
      `schema_version « ${jeu?.schema_version} » ≠ ${VERSION_CONTRAT} : on ne lit pas un fichier avec les règles d'une autre version.`)
  }
  if (jeu?.currency !== 'EUR') ajouter('currency_invalid', null, `currency « ${jeu?.currency} » : le référentiel est en euros.`)
  if (!EST_DATE(jeu?.reference_date)) {
    ajouter('date_malformed', null, `reference_date « ${jeu?.reference_date} » : la date à laquelle tous les prix sont ramenés est absente ou malformée.`)
  }
  if (!jeu?.derived_license) {
    ajouter('field_missing', null, 'derived_license : la licence du référentiel produit doit être déclarée, elle n\'est pas forcément celle des sources.')
  }
  if (!Array.isArray(jeu?.entries)) {
    ajouter('field_missing', null, 'entries : le jeu de prix ne porte aucun tableau d\'entrées.')
    return { violations, stats: { entrees: 0, affichables: 0, violations: violations.length } }
  }

  const dateReference = EST_DATE(jeu.reference_date) ? jeu.reference_date : null
  if (dateReference && EST_DATE(aujourdhui) && moisEntre(dateReference, aujourdhui) > AGE_MAX_AFFICHABLE) {
    ajouter('price_set_expired', null,
      `le jeu est daté du ${dateReference}, soit plus de ${AGE_MAX_AFFICHABLE} mois : un référentiel abandonné ne doit pas continuer à afficher des chiffres avec assurance.`)
  }

  const vues = new Set()
  let partageALIdentique = false
  let affichables = 0

  for (const entree of jeu.entries) {
    const forme = entree?.form_normalized || entree?.form || '(sans forme)'

    for (const champ of Object.keys(entree || {})) {
      if (!CHAMPS_ENTREE.has(champ)) {
        ajouter('unknown_field', forme, `champ « ${champ} » non prévu par le contrat : un champ que personne n'a arbitré ne doit pas traverser en silence.`)
      }
    }

    const { observed, per_kg: perKilo, provenance, edible_yield: rendement } = entree || {}
    if (!observed || !perKilo || !provenance || !rendement) {
      for (const [nom, valeur] of [['observed', observed], ['per_kg', perKilo], ['provenance', provenance], ['edible_yield', rendement]]) {
        if (!valeur) ajouter('field_missing', forme, `bloc « ${nom} » absent.`)
      }
      continue
    }
    for (const champ of Object.keys(observed)) {
      if (!CHAMPS_OBSERVED.has(champ)) ajouter('unknown_field', forme, `observed.${champ} non prévu par le contrat.`)
    }
    for (const champ of Object.keys(provenance)) {
      if (!CHAMPS_PROVENANCE.has(champ)) ajouter('unknown_field', forme, `provenance.${champ} non prévu par le contrat.`)
    }

    // ── Doublon ─────────────────────────────────────────────────────────────
    if (vues.has(entree.form_normalized)) {
      ajouter('form_duplicate', forme, 'deux entrées pour la même forme : laquelle des deux fait foi ? Personne ne peut le dire, donc les deux sont refusées.')
    }
    vues.add(entree.form_normalized)

    // ── La forme existe-t-elle, et la clé est-elle la bonne ? ───────────────
    const formeCatalogue = parForme.get(entree.form_normalized)
    if (!formeCatalogue) {
      ajouter('form_unknown', forme, `« ${entree.form_normalized} » est absente du catalogue des formes : un prix qui ne se raccroche à rien ne sera jamais lu, et masque une faute de frappe.`)
    } else if (formeCatalogue.canonical_name !== entree.form) {
      ajouter('form_label_mismatch', forme, `form « ${entree.form} » ≠ libellé du catalogue « ${formeCatalogue.canonical_name} ».`)
    }
    // Contrôlé même quand la forme est introuvable : une clé mal normalisée est
    // la cause la plus probable de l'introuvable, et le dire fait gagner le
    // temps qu'un « form_unknown » seul ferait perdre.
    if (normaliserForme(entree.form) !== entree.form_normalized) {
      ajouter('form_normalized_mismatch', forme, `form_normalized « ${entree.form_normalized} » ≠ normalisation de « ${entree.form} » (« ${normaliserForme(entree.form)} ») : la jointure se ferait dans le vide.`)
    }

    // ── La source ───────────────────────────────────────────────────────────
    const source = parCode.get(provenance.source_code)
    if (!provenance.source_code) {
      ajouter('source_missing', forme, 'provenance.source_code absent : un chiffre sans source n\'est pas une donnée.')
    } else if (!source) {
      ajouter('source_unknown', forme, `source « ${provenance.source_code} » inconnue de data/prices/sources.json : aucun import sans licence connue et usages compatibles.`)
    } else {
      if (source.enabled !== true) {
        ajouter('source_disabled', forme, `source « ${source.code} » désactivée au registre : ${Array.isArray(source.exclusion_reason) ? source.exclusion_reason[0] : (source.exclusion_reason || 'exclue')}`)
      }
      if (!source.license_verified_on) {
        ajouter('source_license_unverified', forme,
          `licence de « ${source.code} » non vérifiée : activer une source est un geste humain et daté — lire la page de licence, inscrire license_verified_on.`)
      }
      if (source.may_source_price === false) {
        ajouter('source_cannot_price', forme,
          `« ${source.code} » ne peut pas porter un prix : ${source.code === 'insee_ipc' ? "l'INSEE publie un rapport entre deux dates, pas un niveau. Fabriquer un prix à partir d'un indice, c'est inventer le niveau en lui donnant l'apparence d'une statistique publique." : 'le registre le lui interdit.'}`)
      }
      if (source.allowed_uses?.redistribute !== true) {
        ajouter('redistribution_not_allowed', forme, `« ${source.code} » n'autorise pas la redistribution, et le dépôt est public.`)
      }
      if (provenance.license_code !== source.license_code) {
        ajouter('license_mismatch', forme, `license_code « ${provenance.license_code} » ≠ registre « ${source.license_code} ».`)
      }
      if (source.allowed_uses?.share_alike === true) partageALIdentique = true
    }

    // ── Les dates ───────────────────────────────────────────────────────────
    for (const champ of ['retrieved_on', 'observed_on']) {
      if (!provenance[champ]) {
        ajouter('date_missing', forme, `provenance.${champ} absente : ${champ === 'observed_on' ? "c'est la date qui vieillit, un relevé de 2024 lu aujourd'hui reste un prix de 2024" : 'sans elle on ne peut pas retrouver l\'état de la page consultée'}.`)
      } else if (!EST_DATE(provenance[champ])) {
        ajouter('date_malformed', forme, `provenance.${champ} « ${provenance[champ]} » n'est pas une date ISO.`)
      }
    }
    const observeLe = EST_DATE(provenance.observed_on) ? provenance.observed_on : null
    const luLe = EST_DATE(provenance.retrieved_on) ? provenance.retrieved_on : null
    if (observeLe && luLe && observeLe > luLe) {
      ajouter('date_inconsistent', forme, `observed_on (${observeLe}) postérieure à retrieved_on (${luLe}) : on ne peut pas lire un prix avant qu'il existe.`)
    }
    if (observeLe && dateReference && observeLe > dateReference) {
      ajouter('date_inconsistent', forme, `observed_on (${observeLe}) postérieure à la date de référence du jeu (${dateReference}).`)
    }

    const age = observeLe && dateReference ? moisEntre(observeLe, dateReference) : null
    const affichable = entree.confidence === 'A' || entree.confidence === 'B'

    if (affichable && age !== null && age > AGE_MAX_AFFICHABLE) {
      ajouter('price_expired', forme,
        `relevé il y a ${age} mois : au-delà de ${AGE_MAX_AFFICHABLE}, un indice national ne porte plus la structure relative des prix (l'huile a pris plus de 60 % en 2022 quand l'indice d'ensemble bougeait de quelques points). L'entrée doit passer en C.`)
    }
    if (affichable && age !== null && age > AGE_MAX_CONFIANCE_A && age <= AGE_MAX_AFFICHABLE && !entree.reindexation) {
      ajouter('reindexation_required', forme, `relevé il y a ${age} mois : au-delà de ${AGE_MAX_CONFIANCE_A}, la réindexation INSEE est obligatoire.`)
    }

    // ── La réindexation ─────────────────────────────────────────────────────
    let facteurReindexation = 1
    if (entree.reindexation) {
      const r = entree.reindexation
      const manquants = ['coicop', 'index_source', 'index_series', 'from_period', 'from_value', 'to_period', 'to_value', 'factor']
        .filter((champ) => r[champ] === undefined || r[champ] === null || r[champ] === '')
      if (manquants.length) {
        ajouter('reindexation_invalid', forme, `réindexation incomplète : ${manquants.join(', ')} — un facteur sans ses deux indices n'est pas vérifiable.`)
      } else if (r.index_source !== 'insee_ipc') {
        ajouter('reindexation_invalid', forme, `index_source « ${r.index_source} » : seul l'IPC INSEE par poste COICOP est admis.`)
      } else if (!(r.from_value > 0) || !(r.to_value > 0)) {
        ajouter('reindexation_invalid', forme, 'valeurs d\'indice non positives.')
      } else if (Math.abs(r.factor - r.to_value / r.from_value) > 1e-4) {
        ajouter('reindexation_invalid', forme, `factor ${r.factor} ≠ ${r.to_value} / ${r.from_value} = ${(r.to_value / r.from_value).toFixed(4)}.`)
      } else {
        facteurReindexation = r.factor
      }
    }

    // ── La citation ─────────────────────────────────────────────────────────
    if (!provenance.citation || String(provenance.citation).trim().length < 20) {
      ajouter('citation_missing', forme,
        'citation absente ou trop courte : c\'est le seul champ qui rende l\'invention coûteuse — sans elle, personne ne peut retourner à la source.')
    } else {
      if (MARQUEURS_GABARIT.test(provenance.citation)) {
        ajouter('citation_is_placeholder', forme, 'la citation porte encore un marqueur de gabarit : ce chiffre n\'a pas été relevé.')
      }
      if (Number.isFinite(observed.central) && !citationPorteLeChiffre(provenance.citation, observed.central)) {
        ajouter('citation_omits_figure', forme,
          `la citation ne contient pas la valeur centrale (${observed.central}) : une citation qui ne porte pas le chiffre n'est pas une citation, c'est un commentaire.`)
      }
    }

    // ── La fourchette ───────────────────────────────────────────────────────
    const bornes = [['low', observed.low], ['central', observed.central], ['high', observed.high]]
    const bornesInvalides = bornes.filter(([, valeur]) => !(Number.isFinite(valeur) && valeur > 0))
    if (bornesInvalides.length) {
      ajouter('range_inverted', forme, `borne(s) ${bornesInvalides.map(([nom]) => nom).join(', ')} absente(s) ou non positive(s) : un prix nul est la façon la plus discrète d'écrire « je ne sais pas ».`)
    } else {
      if (observed.low > observed.high) {
        ajouter('range_inverted', forme, `fourchette inversée : low ${observed.low} > high ${observed.high}.`)
      }
      if (observed.central < observed.low || observed.central > observed.high) {
        ajouter('range_inverted', forme, `valeur centrale ${observed.central} hors de [${observed.low} ; ${observed.high}].`)
      }
      if (observed.high / observed.low > RAPPORT_FOURCHETTE_MAX) {
        ajouter('range_implausible', forme,
          `rapport haut/bas de ${(observed.high / observed.low).toFixed(1)} : au-delà de ${RAPPORT_FOURCHETTE_MAX}, ce ne sont plus des relevés du même produit, et leur médiane ne veut rien dire non plus.`)
      }
    }

    // ── L'unité, la base, la conversion ─────────────────────────────────────
    if (!UNITE_ATTENDUE[observed.basis]) {
      ajouter('basis_incoherent_with_form', forme, `basis « ${observed.basis} » : seules kg, l et piece existent.`)
    } else {
      if (observed.unit !== UNITE_ATTENDUE[observed.basis]) {
        ajouter('basis_incoherent_with_form', forme, `unit « ${observed.unit} » incohérente avec basis « ${observed.basis} » (attendu ${UNITE_ATTENDUE[observed.basis]}).`)
      }
      if (perKilo.conversion?.kind !== CONVERSION_ATTENDUE[observed.basis]) {
        ajouter('basis_incoherent_with_form', forme, `conversion.kind « ${perKilo.conversion?.kind} » incohérente avec basis « ${observed.basis} » (attendu ${CONVERSION_ATTENDUE[observed.basis]}).`)
      }
    }

    // Le facteur n'est jamais ressaisi : il est recopié du catalogue. Deux
    // vérités sur le même nombre finissent toujours par se contredire, et c'est
    // toujours au moment où plus personne ne regarde.
    let facteur = null
    if (observed.basis === 'kg') {
      facteur = 1
    } else {
      const attendu = observed.basis === 'l'
        ? formeCatalogue?.conversion?.density_g_per_ml
        : formeCatalogue?.conversion?.grams_per_unit
      if (formeCatalogue && !(attendu > 0)) {
        ajouter('basis_incoherent_with_form', forme,
          observed.basis === 'l'
            ? `relevé au litre alors que le catalogue ignore la densité de « ${entree.form_normalized} » : sans densité, pas de prix. On n'écrit jamais 1,00 par défaut — l'eau vaut 1,00, l'huile d'olive 0,92, le miel 1,42.`
            : `relevé à la pièce alors que le catalogue ignore la masse d'une pièce de « ${entree.form_normalized} » : sans masse, pas de prix.`)
      } else if (attendu > 0 && Number.isFinite(perKilo.conversion?.factor) && perKilo.conversion.factor !== attendu) {
        ajouter('conversion_factor_mismatch', forme,
          `facteur ${perKilo.conversion.factor} ≠ catalogue ${attendu} : le facteur est recopié du catalogue, jamais ressaisi.`)
      }
      facteur = Number.isFinite(perKilo.conversion?.factor) ? perKilo.conversion.factor : (attendu > 0 ? attendu : null)
    }

    // ── L'arithmétique du pivot, refaite ────────────────────────────────────
    if (facteur !== null && facteur > 0 && UNITE_ATTENDUE[observed.basis]) {
      for (const borne of ['low', 'central', 'high']) {
        const lu = observed[borne]
        const ecrit = perKilo[borne]
        if (!Number.isFinite(lu) || !Number.isFinite(ecrit)) {
          if (!Number.isFinite(ecrit)) ajouter('per_kg_arithmetic', forme, `per_kg.${borne} absent : le pivot est le seul bloc que le calcul lit.`)
          continue
        }
        const attendu = versKilo(lu, observed.basis, facteur) * facteurReindexation
        if (Math.abs(ecrit - attendu) > tolerance(attendu)) {
          ajouter('per_kg_arithmetic', forme,
            `per_kg.${borne} = ${ecrit} alors que ${lu} ${observed.unit}${facteurReindexation !== 1 ? ` réindexé ×${facteurReindexation}` : ''} donne ${attendu.toFixed(3)} €/kg.`)
        }
      }
    }

    // ── Le rendement comestible ─────────────────────────────────────────────
    const valeurRendement = rendement.value
    if (!(Number.isFinite(valeurRendement) && valeurRendement > 0 && valeurRendement <= 1)) {
      ajouter('yield_out_of_range', forme, `edible_yield.value ${valeurRendement} : le rendement vit dans ]0 ; 1].`)
    } else if (rendement.known !== true && valeurRendement !== 1) {
      ajouter('yield_invented', forme,
        `rendement ${valeurRendement} déclaré inconnu : un rendement inconnu vaut 1,00, ce qui fait de l'estimation un minorant déclaré. Un « 0,85 typique » serait une correction inventée, invérifiable et silencieuse.`)
    } else if (rendement.known === true && !rendement.provenance) {
      ajouter('yield_invented', forme, 'rendement déclaré connu sans provenance : le rendement serait la porte de service par laquelle les nombres inventés rentrent.')
    } else if (rendement.known === true && rendement.provenance) {
      const sourceRendement = parCode.get(rendement.provenance.source_code)
      if (!sourceRendement) {
        ajouter('source_unknown', forme, `source « ${rendement.provenance.source_code} » du rendement inconnue du registre.`)
      } else if (sourceRendement.code === 'myko_reasoning' && valeurRendement !== 1) {
        ajouter('yield_invented', forme,
          'myko_reasoning ne peut porter qu\'un rendement de 1,00 par nature du produit. « Un oignon perd à peu près 10 % à l\'épluchage » est exactement le nombre plausible et invérifiable que le contrat proscrit : un rendement < 1 exige une table publiée de parts comestibles.')
      }
    }

    // ── La confiance ────────────────────────────────────────────────────────
    if (!RANG_CONFIANCE[entree.confidence] && entree.confidence !== 'C') {
      ajouter('confidence_unjustified', forme, `confidence « ${entree.confidence} » : seules A, B et C existent.`)
    }
    if (!entree.confidence_reason) {
      ajouter('confidence_unjustified', forme, 'confidence_reason absente : un niveau de confiance doit être un constat, pas une opinion.')
    }
    if (source && entree.confidence && RANG_CONFIANCE[entree.confidence] !== undefined) {
      const plafond = RANG_CONFIANCE[source.grants_confidence] ?? 0
      if (RANG_CONFIANCE[entree.confidence] > plafond) {
        ajouter('confidence_unjustified', forme,
          `confiance ${entree.confidence} alors que « ${source.code} » ne va pas au-delà de ${source.grants_confidence || 'C'}${source.code === 'open_prices' ? " — les contributions sont volontaires, donc l'échantillon n'est représentatif de rien en particulier" : ''}.`)
      }
      if (source.min_observations && observed.n_observations < source.min_observations && entree.confidence !== 'C') {
        ajouter('confidence_unjustified', forme,
          `${observed.n_observations} relevé(s) alors que « ${source.code} » en exige ${source.min_observations} pour dépasser C.`)
      }
    }
    if (entree.confidence === 'A') {
      if (observed.aggregation === 'point') {
        ajouter('confidence_unjustified', forme, 'A sur un relevé ponctuel : A exige une moyenne mensuelle ou annuelle déclarée.')
      }
      if (observed.dispersion !== 'd1_d9') {
        ajouter('confidence_unjustified', forme, `A avec une dispersion « ${observed.dispersion} » : seuls des déciles décrivent une distribution, une plage de cotation plafonne à B.`)
      }
      if (age !== null && age > AGE_MAX_CONFIANCE_A) {
        ajouter('confidence_unjustified', forme, `A sur un relevé de ${age} mois : au-delà de ${AGE_MAX_CONFIANCE_A} mois, la réindexation devient nécessaire et plafonne à B.`)
      }
      if (!provenance.source_record_key) {
        ajouter('confidence_unjustified', forme, 'A sans source_record_key : sans identifiant de ligne, la citation n\'est pas retrouvable dans la source.')
      }
    }
    if (CATEGORIES_SAISONNIERES.has(entree.category) && observed.aggregation === 'point' && entree.confidence !== 'C') {
      ajouter('confidence_unjustified', forme,
        `relevé ponctuel sur une catégorie saisonnière (${entree.category}) : une courgette de juillet n'est pas une courgette de janvier, et l'écart n'apparaît dans aucun contrôle de forme. Une moyenne est exigée.`)
    }

    if (affichable) affichables += 1
  }

  // ── Partage à l'identique ─────────────────────────────────────────────────
  if (partageALIdentique && jeu.derived_license !== 'odbl-1.0') {
    ajouter('share_alike_not_declared', null,
      `une source à partage à l'identique (ODbL) entre dans le référentiel, mais derived_license vaut « ${jeu.derived_license} » : ODbL impose sa licence à la base dérivée. Ce n'est pas un détail juridique lointain, c'est une conséquence sur la licence du dépôt.`)
  }

  return {
    violations,
    stats: {
      entrees: jeu.entries.length,
      affichables,
      formes: vues.size,
      violations: violations.length,
    },
  }
}

// ── Exécution ───────────────────────────────────────────────────────────────
const estAppeleDirectement = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (estAppeleDirectement) {
  const arguments_ = process.argv.slice(2)
  const enJson = arguments_.includes('--json')
  const chemin = arguments_.find((argument) => !argument.startsWith('--')) || REFERENTIEL_PAR_DEFAUT

  // Le référentiel par défaut peut ne pas exister encore : le chantier commence
  // par le contrat, pas par les données. Un fichier explicitement demandé et
  // absent, en revanche, est une erreur d'appel — pas un jeu vide.
  if (!existsSync(chemin)) {
    if (chemin === REFERENTIEL_PAR_DEFAUT) {
      console.log(`Aucun référentiel à ${chemin} — rien à contrôler. Le contrat existe avant les données.`)
      process.exit(0)
    }
    console.error(`Fichier introuvable : ${chemin}`)
    process.exit(2)
  }

  const jeu = JSON.parse(readFileSync(chemin, 'utf8'))
  const sources = JSON.parse(readFileSync(REGISTRE, 'utf8'))
  const formes = JSON.parse(readFileSync(CATALOGUE, 'utf8')).forms

  const aujourdhui = new Date().toISOString().slice(0, 10)
  const { violations, stats } = controlerReferentiel(jeu, { sources, formes, aujourdhui })

  if (enJson) {
    console.log(JSON.stringify({ file: chemin, ...stats, violations }, null, 2))
  } else {
    const parForme = new Map()
    for (const violation of violations) {
      const cle = violation.form || '(jeu de prix)'
      if (!parForme.has(cle)) parForme.set(cle, [])
      parForme.get(cle).push(violation)
    }
    for (const [forme, liste] of parForme) {
      console.log(`\n✗ ${forme}`)
      for (const violation of liste) console.log(`    [${violation.code}] ${violation.message}`)
    }
    console.log(
      `\n${stats.entrees} entrée(s), ${stats.affichables} affichable(s) (A ou B), `
      + `${stats.violations} violation(s) du contrat.`,
    )
    if (!violations.length) console.log('Le référentiel est conforme à data/prices/CONTRAT.md.')
    else console.log('Rappel : ce contrôle ne sait pas détecter un chiffre inventé. Il impose seulement qu\'il soit retrouvable.')
  }

  process.exit(violations.length ? 1 : 0)
}
