/**
 * Arithmétique commune de la couche prix — pure, sans I/O, sans référentiel.
 *
 * Ce fichier existe pour une raison écrite noir sur blanc dans le contrat
 * (data/prices/CONTRAT.md §2.4) : « Les deux chemins — coût d'une recette et
 * coût d'une liste de courses — passent par le même helper. Appliquer le
 * rendement dans l'un et pas dans l'autre ferait deux montants différents pour
 * le même oignon. » La même exigence vaut pour la composition des fourchettes
 * (§3.2) et pour les arrondis d'affichage (§7.2) : trois règles que le contrat
 * énonce une fois et qu'il ne faut donc écrire qu'une fois.
 *
 * Rien ici ne lit le référentiel : ces fonctions sont testables sur des nombres
 * nus, et c'est voulu — la règle de composition d'une fourchette ne doit pas
 * dépendre de la présence d'un fichier de données.
 */

/** Seuils d'affichage du §8.1. Les deux sont nécessaires, cf. `estAffichable`. */
export const SEUIL_COUVERTURE_LIGNES = 70
export const SEUIL_COUVERTURE_MASSE = 90

/** §5.3 — au-delà, l'entrée est périmée ; §5.4 — au-delà, le jeu entier s'éteint. */
export const AGE_MAX_AFFICHABLE_MOIS = 24
/** §5 — au-delà, la réindexation INSEE devient obligatoire et la confiance plafonne à B. */
export const AGE_MAX_CONFIANCE_A_MOIS = 12

/**
 * §4 — « Ici, C équivaut à l'absence. » Une entrée en C n'est pas une ligne peu
 * fiable qu'on afficherait avec une réserve : c'est une ligne non chiffrée.
 */
export const CONFIANCES_RETENUES = Object.freeze(new Set(['A', 'B']))

const EST_DATE_ISO = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

/**
 * Écart en mois entre deux dates ISO, par arithmétique de chaîne.
 *
 * Aucun objet Date n'est construit : « 2026-07-31 » lu dans un fuseau à l'ouest
 * de Greenwich devient le 30 juillet, et ce décalage d'un jour se propagerait
 * jusque dans le verdict de péremption d'une entrée à la limite des 24 mois
 * (CLAUDE.md, piège 4).
 *
 * L'algorithme est volontairement identique à `moisEntre` de
 * scripts/data/prices/check-price-provenance.mjs, et NON importé de lui : la
 * couche de domaine ne doit pas dépendre d'un script de CI — c'est la CI qui
 * dépend du domaine, jamais l'inverse. Un test verrouille l'égalité des deux
 * implémentations sur une table de dates limites, pour que la duplication soit
 * surveillée plutôt que subie.
 */
export function moisEntre(depuis, jusqu) {
  if (!EST_DATE_ISO(depuis) || !EST_DATE_ISO(jusqu)) return null
  const [a1, m1, j1] = depuis.split('-').map(Number)
  const [a2, m2, j2] = jusqu.split('-').map(Number)
  let mois = (a2 - a1) * 12 + (m2 - m1)
  if (j2 < j1) mois -= 1
  return mois
}

/**
 * Jours entre deux dates ISO, en UTC strict (CLAUDE.md, piège 4).
 * Négatif si `jusqu` est passée. `null` si l'une des deux est absente ou mal formée
 * — surtout pas 0, qui se confondrait avec « périme aujourd'hui ».
 */
export function joursEntre(depuis, jusqu) {
  if (!EST_DATE_ISO(depuis) || !EST_DATE_ISO(jusqu)) return null
  const minuitUtc = (iso) => {
    const [annee, mois, jour] = iso.split('-').map(Number)
    return Date.UTC(annee, mois - 1, jour)
  }
  return Math.round((minuitUtc(jusqu) - minuitUtc(depuis)) / 86400000)
}

const nombreFini = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * §2.4 — passage des grammes de la FORME (état comestible du catalogue, mesure
 * Ciqual) à la masse ACHETÉE, celle qu'on paie.
 *
 *     masse_achetée = grammes_forme / rendement
 *
 * Le rendement vaut 1,00 tant qu'il n'est pas sourcé (§2.3), et le sens de
 * l'erreur est alors connu : sans correction de parage, l'estimation est un
 * MINORANT. C'est la seule raison pour laquelle 1,00 est acceptable là où 0,85
 * ne le serait pas — 1,00 est une erreur déclarée, 0,85 serait une fiction.
 *
 * Un rendement hors de ]0, 1] n'est pas corrigé en silence : il est refusé
 * (`null`), parce qu'un rendement > 1 signifierait qu'on achète moins que ce
 * qu'on mange, et qu'un rendement ≤ 0 ferait diverger la division.
 */
export function masseAcheteeGrammes(grammesForme, rendement) {
  const g = nombreFini(grammesForme)
  const r = nombreFini(rendement)
  if (g == null || g < 0) return null
  if (r == null || !(r > 0) || r > 1) return null
  return g / r
}

/**
 * Fourchette d'une ligne : €/kg × masse achetée. Le rendement est appliqué ICI
 * et nulle part ailleurs dans la chaîne recette/courses — l'appliquer deux fois
 * gonflerait le coût du carré du rendement, ce qui est indétectable à l'œil.
 *
 * `perKg` est le seul bloc du référentiel que le calcul lit (§1.1) ; `observed`
 * reste réservé à l'affichage de la base native.
 */
export function fourchetteLigne(perKg, grammesForme, rendement = 1) {
  const masse = masseAcheteeGrammes(grammesForme, rendement)
  if (masse == null) return null
  const low = nombreFini(perKg?.low)
  const central = nombreFini(perKg?.central)
  const high = nombreFini(perKg?.high)
  if (low == null || central == null || high == null) return null
  if (!(low <= central && central <= high)) return null
  const kg = masse / 1000
  return { low: low * kg, central: central * kg, high: high * kg }
}

/**
 * §3.2 — LA règle de composition. On n'additionne JAMAIS les bornes.
 *
 *     central = Σ centralᵢ
 *     dᵢ      = (highᵢ − lowᵢ) / 2
 *     demi    = √(Σ dᵢ²)
 *     bas     = max(0, central − demi)   ·   haut = central + demi
 *
 * Additionner vingt bornes basses décrirait un panier où les vingt ingrédients
 * seraient simultanément dans leur décile le moins cher : un panier de
 * probabilité ~0,1²⁰, donc plus bas que tout panier réel. La somme des centres,
 * elle, est exacte sans aucune hypothèse (l'espérance d'une somme est la somme
 * des espérances, même sous dépendance). La quadrature a les bonnes bornes :
 * √(Σd²) ≥ max d — le panier n'est jamais annoncé plus serré que sa ligne la
 * plus incertaine — et √(Σd²) ≤ Σd — il est toujours plus serré que la somme
 * naïve.
 *
 * L'objection sérieuse (un mouvement d'ensemble déplace toutes les lignes dans
 * le même sens, et la quadrature sous-estime alors la largeur) est traitée
 * ailleurs et une seule fois : par la péremption et la réindexation du §5. Les
 * deux mécanismes sont orthogonaux par construction ; les mélanger compterait
 * deux fois la même incertitude.
 *
 * Une liste vide rend `null` et non un zéro : « rien de chiffré » et « chiffré à
 * zéro » sont deux affirmations différentes, et 0 € est précisément la façon la
 * plus discrète d'écrire « je ne sais pas ».
 */
export function composerFourchettes(fourchettes) {
  const retenues = (fourchettes || []).filter((f) => f && Number.isFinite(f.central))
  if (!retenues.length) return null
  let central = 0
  let sommeCarres = 0
  for (const f of retenues) {
    central += f.central
    const demi = (Number(f.high) - Number(f.low)) / 2
    if (Number.isFinite(demi) && demi > 0) sommeCarres += demi * demi
  }
  const demi = Math.sqrt(sommeCarres)
  return { low: Math.max(0, central - demi), central, high: central + demi }
}

/** Homothétie d'une fourchette (mise à l'échelle, coût par portion). Linéaire, donc sans perte. */
export function diviserFourchette(fourchette, diviseur) {
  const d = nombreFini(diviseur)
  if (!fourchette || d == null || !(d > 0)) return null
  return { low: fourchette.low / d, central: fourchette.central / d, high: fourchette.high / d }
}

/**
 * §7.2 — la précision affichée ne doit jamais dépasser la précision de
 * l'estimation. Un panier annoncé à ±15 % et affiché « 43,27 € » revendique une
 * exactitude de caisse enregistreuse qu'il n'a pas.
 *
 * Le pas dépend du montant, et le coût PAR PORTION a son pas propre (0,05 €) :
 * appliquer le pas des petits montants (0,10 €) à une portion à 1,20 € ferait
 * disparaître la moitié de l'information utile.
 */
export function arrondirMontant(montant, { parPortion = false } = {}) {
  const v = nombreFini(montant)
  if (v == null) return null
  const pas = parPortion ? 0.05 : v < 10 ? 0.1 : v < 100 ? 0.5 : 1
  return Math.round(v / pas) * pas
}

export function arrondirFourchette(fourchette, options = {}) {
  if (!fourchette) return null
  return {
    low: arrondirMontant(fourchette.low, options),
    central: arrondirMontant(fourchette.central, options),
    high: arrondirMontant(fourchette.high, options),
  }
}

/**
 * Écriture française d'un montant déjà arrondi. Le nombre de décimales suit le
 * pas d'arrondi : afficher « 104,00 € » pour un montant arrondi à l'euro
 * réintroduirait par la virgule la précision que l'arrondi venait d'enlever.
 *
 * Formatage manuel plutôt que `toLocaleString` : la couche de domaine doit
 * rendre la même chaîne sur un poste français, sur un runner de CI en anglais
 * et dans un test — la locale du processus n'a pas à décider d'un séparateur
 * décimal qui, lui, est fixé par le contrat.
 */
export function formaterEuros(montant, { parPortion = false } = {}) {
  const v = arrondirMontant(montant, { parPortion })
  if (v == null) return null
  const decimales = !parPortion && v >= 100 ? 0 : 2
  return `${v.toFixed(decimales).replace('.', ',')} €`
}

/**
 * §6 — décalque de `nutritionCoverage` (lib/domain/nutrition/calculator.js),
 * avec `withData` devenu `priced`.
 *
 * DEUX MESURES, PARCE QU'UNE SEULE MENT. Le nombre de lignes traite le poivre
 * (2 g) et le bœuf (1,2 kg) à égalité : une recette où seul le bœuf manque
 * afficherait 92 % de couverture et un montant absurde. C'est `pctByMass` qui
 * attrape ce cas, et c'est pour cela que les deux seuils du §8.1 sont
 * conjonctifs et non alternatifs.
 *
 * Ce qui a été ÉCARTÉ : la pondération par la valeur, qui semble la mesure
 * juste et qui est circulaire — on ne peut pas pondérer par le coût des lignes
 * dont on ignore précisément le coût. On pondère donc par ce qu'on connaît de
 * façon certaine avant tout calcul : le nombre de lignes et la masse.
 *
 * La masse n'est pas parfaite non plus (100 g de safran ne pèsent pas ce qu'ils
 * coûtent), mais elle a la propriété décisive d'être connue AVANT de connaître
 * les prix, donc de ne pas présupposer le résultat.
 */
export function calculerCouverture(lignes) {
  let quantified = 0
  let priced = 0
  let masseQuantifiee = 0
  let masseChiffree = 0
  let rendementConnu = 0
  const unpriced = []

  for (const ligne of lignes || []) {
    const g = nombreFini(ligne?.grams)
    if (g == null || g <= 0) continue // même seuil que la nutrition : non quantifié, donc hors couverture
    quantified++
    masseQuantifiee += g
    if (!ligne.priced) {
      unpriced.push(ligne?.name ?? null)
      continue
    }
    priced++
    masseChiffree += g
    if (ligne.yieldKnown) rendementConnu++
  }

  const pourcent = (part, total) => (total > 0 ? Math.round((part / total) * 100) : null)

  return {
    pct: pourcent(priced, quantified),
    quantified,
    priced,
    unpriced,
    pctByMass: pourcent(masseChiffree, masseQuantifiee),
    yieldKnownPct: pourcent(rendementConnu, priced),
    quantifiedMassG: masseQuantifiee,
    pricedMassG: masseChiffree,
  }
}

/**
 * §8 — le verdict d'affichage, rendu une fois pour toutes les surfaces.
 *
 * Il rend un code de refus plutôt qu'un booléen nu, pour que l'interface puisse
 * dire POURQUOI il n'y a pas de montant : « estimation indisponible » sans motif
 * ressemble à une panne, alors que c'est un choix.
 *
 * Noter ce que ce verdict ne fait PAS : il ne rend pas la recette inéligible
 * (§6.1). `materializeRecipe` bloque sur une couverture nutritionnelle
 * incomplète ; le prix ne bloque rien. Une recette dont on ignore le prix reste
 * parfaitement cuisinable.
 */
export function verdictAffichage(couverture, { referentielPerime = false } = {}) {
  if (referentielPerime) return { affichable: false, refus: 'referentiel_perime' }
  if (!couverture || couverture.quantified === 0) return { affichable: false, refus: 'rien_de_quantifie' }
  if (couverture.priced === 0) return { affichable: false, refus: 'aucune_ligne_chiffree' }
  if (couverture.pct < SEUIL_COUVERTURE_LIGNES) return { affichable: false, refus: 'couverture_lignes_insuffisante' }
  if (couverture.pctByMass < SEUIL_COUVERTURE_MASSE) return { affichable: false, refus: 'couverture_masse_insuffisante' }
  return { affichable: true, refus: null }
}

/**
 * §7.1 et §7.3 — le vocabulaire, centralisé.
 *
 * Cette fonction n'est pas un composant : elle rend une chaîne, pas du JSX, et
 * elle vit dans le domaine pour une raison précise — le contrat INTERDIT
 * certains mots (« prix », « vous paierez », un montant sans date) et en IMPOSE
 * d'autres (« au moins » dès que la couverture est partielle). Laisser chaque
 * écran composer sa phrase, c'est accepter que le cinquième écrive « Prix
 * total : 4,30 € ». La règle est écrite une fois, ici, et les surfaces la
 * consomment.
 *
 * « Au moins » n'est pas une précaution de style : une somme partielle est
 * mathématiquement un minorant, puisque les lignes manquantes ne peuvent
 * qu'ajouter. Le rendement inconnu va dans le même sens (§2.3), d'où la mention
 * « hors pertes de parage ».
 */
export function phraseEstimation({
  fourchette,
  couverture,
  referenceDate,
  parPortion = false,
  affichable = true,
  refus = null,
} = {}) {
  if (!affichable || !fourchette || !couverture) {
    const manquantes = couverture ? couverture.quantified - couverture.priced : null
    return manquantes != null && couverture?.quantified
      ? `Estimation indisponible — ${manquantes} ingrédient${manquantes > 1 ? 's' : ''} sur ${couverture.quantified} sans prix sourcé.`
      : `Estimation indisponible${refus ? ` (${refus})` : ''}.`
  }

  const complete = couverture.pct === 100
  const montant = formaterEuros(fourchette.central, { parPortion })
  const bas = formaterEuros(fourchette.low, { parPortion })
  const haut = formaterEuros(fourchette.high, { parPortion })
  const mois = referenceDate ? moisFrancais(referenceDate) : null

  const tete = complete
    ? `Estimation ≈ ${montant} (${bas} – ${haut})`
    : `Au moins ${montant} (${bas} – ${haut})`

  const morceaux = [tete]
  morceaux.push(complete
    ? `${couverture.priced} ingrédients sur ${couverture.quantified}`
    : `estimation portant sur ${couverture.priced} des ${couverture.quantified} ingrédients (${couverture.pctByMass} % de la masse)`)
  if (!complete && couverture.unpriced.length) {
    morceaux.push(`non chiffrés : ${couverture.unpriced.filter(Boolean).join(', ')}`)
  }
  // §2.3 : le rendement par défaut fait de l'estimation un minorant, et on le dit.
  if (couverture.yieldKnownPct !== 100) morceaux.push('hors pertes de parage')
  // §7.1 : un montant sans date est une affirmation intemporelle. Un prix n'en est jamais une.
  if (mois) morceaux.push(`référentiel ${mois}`)

  return morceaux.join(' · ')
}

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export function moisFrancais(dateIso) {
  if (!EST_DATE_ISO(dateIso)) return null
  const [annee, mois] = dateIso.split('-').map(Number)
  return `${MOIS_FR[mois - 1]} ${annee}`
}
