/**
 * Vue d'une estimation : les fragments de texte que les écrans assemblent.
 *
 * POURQUOI CE FICHIER EXISTE ALORS QUE `phraseEstimation` EXISTE DÉJÀ.
 * `lib/domain/pricing/priceMath.js` rend LA phrase du contrat (§7.3), en une
 * seule chaîne. C'est la bonne réponse pour un test, une infobulle ou un log ;
 * ce n'en est pas une pour une page, qui doit poser le montant en gros, la
 * couverture en petit, la date à côté, et la liste des non chiffrés en dessous.
 * Concaténer puis re-découper la phrase serait une analyse syntaxique de notre
 * propre sortie — fragile au premier mot changé.
 *
 * CE QUI EST EMPRUNTÉ AU DOMAINE, ET CE QUI NE L'EST PAS.
 * Toute l'arithmétique et tout le formatage viennent de `priceMath` :
 * `arrondirMontant` / `formaterEuros` portent les pas d'arrondi du §7.2,
 * `moisFrancais` la date du §7.1. Rien n'est recalculé ici, pas même une
 * division. Ce fichier ne décide que de DEUX choses que le domaine ne peut pas
 * décider à sa place :
 *
 *   1. le NOM de ce qu'on compte — « 16 des 19 ingrédients » sur une fiche
 *      recette, « produits » aux courses, « lots » au garde-manger. Le domaine
 *      dit « ingrédients » parce qu'il a été écrit pour la recette ; l'écrire
 *      partout ferait dire au garde-manger qu'il contient des ingrédients ;
 *   2. si la mention « hors pertes de parage » s'applique. Elle n'est PAS
 *      universelle : `wasteValue.js` n'applique aucun rendement (un lot est
 *      déjà dans son état acheté), donc l'y afficher annoncerait une
 *      sous-estimation qui n'existe pas. C'est le seul endroit du dépôt où ce
 *      piège se joue, et il se joue à l'affichage.
 *
 * La duplication qui en résulte est SURVEILLÉE plutôt que subie : un test
 * vérifie que les fragments recomposés, avec le nom « ingrédient », rendent
 * exactement la chaîne de `phraseEstimation`. Le jour où le contrat change de
 * mot, ce test tombe — même dispositif que le verrou entre `moisEntre` et le
 * contrôleur de CI.
 */

import {
  arrondirMontant,
  formaterEuros,
  moisFrancais,
  phraseEstimation,
} from '@/lib/domain/pricing/priceMath'

/**
 * §7.1 — « gratuit », « 0 € » : interdits. On n'affiche pas.
 *
 * Le cas se produit tout seul, sans que personne l'ait voulu : 2 g d'une épice
 * à 1 €/kg valent 0,002 €, que le pas d'arrondi de 0,10 € (§7.2) ramène à zéro.
 * `formaterEuros` écrirait alors « 0,00 € » — un montant faux au sens le plus
 * gênant, puisqu'il affirme la gratuité d'une chose achetée.
 *
 * « Moins de 0,10 € » dit exactement ce qu'on sait : le montant existe, il est
 * sous le pas d'affichage. C'est une DIVERGENCE assumée avec `phraseEstimation`,
 * qui écrirait le zéro ; le contrat prime sur le code là où le code écrirait un
 * mot qu'il interdit lui-même.
 */
function ecrireMontant(valeur, { parPortion = false } = {}) {
  const arrondi = arrondirMontant(valeur, { parPortion })
  if (arrondi == null) return { texte: null, negligeable: false }
  if (arrondi === 0) {
    return { texte: parPortion ? 'moins de 0,05 €' : 'moins de 0,10 €', negligeable: true }
  }
  return { texte: formaterEuros(valeur, { parPortion }), negligeable: false }
}

/**
 * Ce qu'on compte, par surface. Le pluriel est porté explicitement : un
 * `${nom}s` mécanique donnerait « 1 lots » sur le seul cas où la phrase est lue
 * de près, celui du dernier lot qui périme.
 */
export const NOMS = Object.freeze({
  ingredient: Object.freeze({ un: 'ingrédient', plusieurs: 'ingrédients' }),
  produit: Object.freeze({ un: 'produit', plusieurs: 'produits' }),
  lot: Object.freeze({ un: 'lot', plusieurs: 'lots' }),
  article: Object.freeze({ un: 'article', plusieurs: 'articles' }),
})

/**
 * Libellés humains des sources. Le référentiel porte des codes
 * (`rnm_franceagrimer`), et l'attribution ODbL doit être lisible par un humain :
 * afficher le code brut satisferait la lettre de la licence et pas son objet.
 * Un code inconnu s'affiche tel quel plutôt que d'être masqué — une source non
 * créditée serait un manquement silencieux.
 */
const LIBELLES_SOURCES = Object.freeze({
  rnm_franceagrimer: 'RNM / FranceAgriMer',
  open_prices: 'Open Prices',
  insee: 'INSEE',
})

const pluriel = (n, nom) => `${n} ${n > 1 ? nom.plusieurs : nom.un}`

/**
 * §8 — la phrase de refus. Elle nomme le motif au lieu de se taire : « estimation
 * indisponible » sans raison ressemble à une panne alors que c'est une décision.
 *
 * Les deux motifs de seuil (§8.1) partagent la même formulation parce qu'ils
 * disent la même chose à l'utilisateur — il manque des prix — et diffèrent
 * seulement par la mesure qui a déclenché le refus. Le référentiel périmé et le
 * référentiel vide, eux, ne parlent pas de la recette : ils parlent du
 * référentiel, et méritent leurs propres mots.
 *
 * DIVERGENCE ASSUMÉE avec `phraseEstimation`, qui écrit dans tous les cas « N
 * ingrédients sur M sans prix sourcé ». Sur un référentiel périmé (§5.4) cette
 * phrase est littéralement vraie — plus aucune ligne n'a de prix — et pourtant
 * elle trompe : elle envoie chercher des ingrédients manquants alors que c'est
 * le fichier de prix qui s'est éteint. Le verrou de test ne porte donc que sur
 * le cas affichable, là où les deux textes doivent coïncider au caractère près.
 */
function texteRefus(refus, couverture, nom) {
  if (refus === 'referentiel_perime') {
    return 'Estimation indisponible — le référentiel de prix a plus de deux ans et n’est plus affiché.'
  }
  if (!couverture || !couverture.quantified) {
    return 'Estimation indisponible — rien de quantifié à chiffrer.'
  }
  const manquantes = couverture.quantified - couverture.priced
  return `Estimation indisponible — ${pluriel(manquantes, nom)} sur ${couverture.quantified} sans prix sourcé.`
}

/**
 * @param {Object} params
 * @param {{low:number,central:number,high:number}|null} params.fourchette — brute, non arrondie
 * @param {Object|null} params.couverture — `coverage` rendu par la couche de calcul
 * @param {string|null} params.referenceDate — `reference_date` du référentiel
 * @param {boolean} params.parPortion — change le pas d'arrondi (§7.2)
 * @param {boolean} params.affichable / @param {string|null} params.refus — verdict du §8
 * @param {boolean} params.parageInconnu — faux quand le rendement ne joue pas (garde-manger)
 * @param {{un:string,plusieurs:string}} params.nom — ce qu'on compte
 * @param {number} params.adaptations — lignes chiffrées en confiance B (§7.3, 4ᵉ cas)
 * @param {Array<string>} params.attributions — codes source à créditer (ODbL)
 */
export function vueEstimation({
  fourchette = null,
  couverture = null,
  referenceDate = null,
  parPortion = false,
  affichable = true,
  refus = null,
  parageInconnu = false,
  nom = NOMS.ingredient,
  adaptations = 0,
  attributions = [],
} = {}) {
  const mois = moisFrancais(referenceDate)
  const credits = (attributions || []).map((code) => LIBELLES_SOURCES[code] || code)
  const socle = {
    affichable: false,
    refus,
    negligeable: false,
    montant: null,
    bas: null,
    haut: null,
    fourchette: null,
    prefixe: null,
    minorant: false,
    couvertureTexte: null,
    nonChiffres: couverture?.unpriced?.filter(Boolean) || [],
    nonChiffresTexte: null,
    parageTexte: null,
    adaptationsTexte: null,
    mois,
    referentielTexte: mois ? `référentiel ${mois}` : null,
    attributionTexte: credits.length ? credits.join(' · ') : null,
    indisponibleTexte: texteRefus(refus, couverture, nom),
    phrase: phraseEstimation({ fourchette, couverture, referenceDate, parPortion, affichable, refus }),
    pct: couverture?.pct ?? null,
    pctByMass: couverture?.pctByMass ?? null,
    priced: couverture?.priced ?? 0,
    quantified: couverture?.quantified ?? 0,
  }

  if (!affichable || !fourchette || !couverture) return socle

  const complete = couverture.pct === 100
  const nonChiffres = couverture.unpriced.filter(Boolean)
  const central = ecrireMontant(fourchette.central, { parPortion })

  return {
    ...socle,
    affichable: true,
    indisponibleTexte: null,
    negligeable: central.negligeable,
    /**
     * §7.1 : « au moins » dès que la couverture est partielle. Ce n'est pas une
     * précaution de style — une somme partielle est un minorant, les lignes
     * manquantes ne pouvant qu'ajouter.
     *
     * Sauf sur un montant négligeable, où « Au moins moins de 0,10 € » n'est
     * pas une phrase. L'information ne se perd pas pour autant : `minorant`
     * reste vrai, et la phrase de couverture juste à côté dit sur combien de
     * lignes porte l'estimation.
     */
    prefixe: central.negligeable ? null : (complete ? 'Estimation ≈' : 'Au moins'),
    minorant: !complete,
    montant: central.texte,
    // Les bornes suivent le sort du centre : les laisser à « 0,00 € » sur un
    // montant négligeable donnerait à n'importe quel composant de quoi écrire
    // le zéro par la petite porte.
    bas: central.negligeable ? null : formaterEuros(fourchette.low, { parPortion }),
    haut: central.negligeable ? null : formaterEuros(fourchette.high, { parPortion }),
    // Une fourchette s'affiche COMME une fourchette : les deux bornes, jamais
    // le seul centre. L'euro est répété sur les deux bornes — l'exemple du §7.3
    // l'omet sur la borne basse, `phraseEstimation` le garde ; on suit le code,
    // parce que c'est lui qui rend la phrase que le test verrouille, et qu'un
    // symbole de devise n'est pas une règle du contrat.
    //
    // Rien quand le montant est négligeable : « 0,00 € – 0,00 € » n'ajouterait
    // aucune information et réintroduirait par la fourchette le zéro que le
    // §7.1 interdit d'écrire.
    fourchette: central.negligeable
      ? null
      : `${formaterEuros(fourchette.low, { parPortion })} – ${formaterEuros(fourchette.high, { parPortion })}`,
    couvertureTexte: complete
      // §8.5 : même à 100 %, le compte s'affiche. « 19 sur 19 » est une
      // information, pas du bruit — c'est ce qui distingue une estimation
      // complète d'une estimation qui se tait sur ce qu'elle ignore.
      ? `${couverture.priced} ${nom.plusieurs} sur ${couverture.quantified}`
      : `estimation portant sur ${couverture.priced} des ${couverture.quantified} ${nom.plusieurs} (${couverture.pctByMass} % de la masse)`,
    nonChiffres,
    nonChiffresTexte: !complete && nonChiffres.length ? `non chiffrés : ${nonChiffres.join(', ')}` : null,
    // §2.3 : le rendement laissé à 1,00 faute de source sous-estime la masse
    // achetée. On le dit là où il joue, et nulle part ailleurs.
    parageTexte: parageInconnu ? 'hors pertes de parage' : null,
    // §7.3, 4ᵉ cas : la confiance B signale un relevé adapté (forme voisine,
    // agrégat de contributions, plage de cotation, réindexation). Le dire évite
    // de faire passer une adaptation pour une cotation directe.
    adaptationsTexte: adaptations > 0
      ? `estimation appuyée sur ${adaptations > 1 ? 'des relevés adaptés' : 'un relevé adapté'}`
      : null,
  }
}

/**
 * Recompose la phrase du contrat à partir des fragments, dans l'ordre du §7.3.
 *
 * Elle n'est pas destinée à l'affichage — les pages posent les fragments
 * elles-mêmes — mais aux surfaces étroites (attribut `title`, résumé lu par un
 * lecteur d'écran) et surtout au test qui verrouille l'égalité avec
 * `phraseEstimation`. `avecAdaptations` est faux par défaut pour cette raison :
 * la phrase du domaine ne porte pas la mention de confiance B.
 */
export function recomposerPhrase(vue, { avecAdaptations = false } = {}) {
  if (!vue?.affichable) return vue?.indisponibleTexte ?? null
  // Le montant négligeable est la seule divergence volontaire avec
  // `phraseEstimation`, qui écrirait « 0,00 € (0,00 € – 0,00 €) ». Le §7.1
  // interdit d'écrire zéro ; le contrat prime là où le code écrirait un mot
  // qu'il proscrit lui-même.
  const tete = vue.fourchette
    ? `${vue.prefixe} ${vue.montant} (${vue.fourchette})`
    : [vue.prefixe, vue.montant].filter(Boolean).join(' ')
  const morceaux = [tete, vue.couvertureTexte]
  if (vue.nonChiffresTexte) morceaux.push(vue.nonChiffresTexte)
  if (vue.parageTexte) morceaux.push(vue.parageTexte)
  if (avecAdaptations && vue.adaptationsTexte) morceaux.push(vue.adaptationsTexte)
  if (vue.referentielTexte) morceaux.push(vue.referentielTexte)
  return morceaux.join(' · ')
}

/**
 * Vue du coût porté par une carte de catalogue.
 *
 * `canonical_quality.cost` est construit par la couche de domaine sous la forme
 * exacte des arguments de `vueEstimation` : la carte transporte des nombres et
 * un verdict, la rédaction se fait ici. C'est ce qui permet à une page cliente
 * de mettre en mots une estimation sans embarquer les 670 ko du référentiel —
 * `priceMath`, dont ce fichier dépend, ne lit aucun JSON.
 */
export function vueCoutCarte(cost) {
  return cost ? vueEstimation(cost) : null
}

/** Compte les lignes chiffrées en confiance B — l'argument `adaptations` ci-dessus. */
export function compterAdaptations(lignes) {
  return (lignes || []).filter((ligne) => ligne?.priced && ligne.confidence === 'B').length
}

/**
 * Vue d'un coût de recette : ce que le plat CONSOMME, par portion (§6.2).
 *
 * Le total de la recette est rendu à côté, mais c'est bien le coût par portion
 * qui est la grandeur comparable d'une fiche à l'autre — et c'est lui qui porte
 * le pas d'arrondi propre du §7.2 (0,05 €).
 */
export function vueCoutRecette(cout, { attributions } = {}) {
  if (!cout) return null
  const commun = {
    couverture: cout.coverage,
    referenceDate: cout.referenceDate,
    affichable: cout.displayable,
    refus: cout.displayRefusal,
    parageInconnu: cout.parageInconnu,
    nom: NOMS.ingredient,
    adaptations: compterAdaptations(cout.lines),
    attributions: attributions || cout.attributions,
  }
  return {
    servings: cout.servings,
    parPortion: vueEstimation({ ...commun, fourchette: cout.coutConsomme.parPortion, parPortion: true }),
    total: vueEstimation({ ...commun, fourchette: cout.coutConsomme.total }),
  }
}

/**
 * Vue d'une liste de courses : ce qu'on paie en CAISSE (§6.2), donc des
 * contenants entiers et non des grammes exacts.
 *
 * `surplus` n'est rendu que s'il est intégralement déterminé — voir
 * `surplusEntierementConnu`. Un surplus calculé sur la moitié des lignes
 * afficherait « dont 4 € rejoindront le garde-manger » alors que le vrai
 * chiffre serait le double, et il n'y aurait aucun moyen de s'en apercevoir.
 */
export function vueCoutCourses(cout, { attributions } = {}) {
  if (!cout) return null
  const commun = {
    couverture: cout.coverage,
    referenceDate: cout.referenceDate,
    affichable: cout.displayable,
    refus: cout.displayRefusal,
    parageInconnu: cout.parageInconnu,
    nom: NOMS.article,
    adaptations: compterAdaptations(cout.lines),
    attributions: attributions || cout.attributions,
  }
  const surplusConnu = surplusEntierementConnu(cout.lines)
  return {
    achat: vueEstimation({ ...commun, fourchette: cout.coutAchat }),
    surplus: surplusConnu && cout.surplus
      ? vueEstimation({ ...commun, fourchette: cout.surplus })
      : null,
    consomme: surplusConnu && cout.coutConsomme
      ? vueEstimation({ ...commun, fourchette: cout.coutConsomme })
      : null,
  }
}

/** Vrai si CHAQUE ligne chiffrée porte son besoin et son surplus. Cf. ci-dessus. */
export function surplusEntierementConnu(lignes) {
  const chiffrees = (lignes || []).filter((ligne) => ligne?.priced)
  return chiffrees.length > 0 && chiffrees.every((ligne) => ligne.consumedRange && ligne.surplusRange)
}

/**
 * Vue d'un agrégat de garde-manger (périmé, à risque, stock).
 *
 * `parageInconnu` vaut FAUX, et c'est le point qui compte : `wasteValue.js`
 * n'applique aucun rendement puisqu'un lot est déjà dans son état acheté.
 * Reprendre ici la mention « hors pertes de parage » annoncerait une
 * sous-estimation qui n'existe pas — et un chiffre trop prudent est aussi faux
 * qu'un chiffre trop confiant.
 */
export function vueValeurGardeManger(agregat, { referenceDate, attributions } = {}) {
  if (!agregat) return null
  return vueEstimation({
    fourchette: agregat.range,
    couverture: agregat.coverage,
    referenceDate,
    affichable: agregat.displayable,
    refus: agregat.displayRefusal,
    parageInconnu: false,
    nom: NOMS.lot,
    adaptations: compterAdaptations(agregat.lots || agregat.entries),
    attributions,
  })
}

/**
 * Les lots valorisés un par un, prêts à s'afficher.
 *
 * LE POINT QUI JUSTIFIE CETTE FONCTION : le refus d'affichage du §8 porte sur
 * le TOTAL, jamais sur la ligne. `wasteValue.js` le dit dans son propre code —
 * la valeur d'un lot est un nombre sourcé isolément, avec sa provenance ; c'est
 * le total silencieux sur la moitié de la masse qui trompe. Un garde-manger
 * dont l'agrégat est refusé peut donc quand même nommer les lots qu'il sait
 * chiffrer, et c'est précisément ce qu'il faut faire : « la crème et le poulet
 * valent 6,40 € et périment jeudi » est utile même quand « votre garde-manger à
 * risque vaut X € » ne l'est pas.
 *
 * Les lots non chiffrés restent dans la liste, sans montant. Les faire
 * disparaître ferait croire que le garde-manger à risque se limite à ce qu'on
 * sait valoriser.
 */
export function vueLotsValorises(lignes, { limite = null } = {}) {
  // Tri par valeur décroissante puis par urgence : ce qu'on montre en premier
  // doit être ce qu'il vaut le plus la peine de sauver ce soir. Les lots non
  // chiffrés ferment la marche sans disparaître — les faire sortir de la liste
  // ferait croire que le garde-manger à risque se limite à ce qu'on sait
  // valoriser. Le tri se fait sur les nombres BRUTS, avant tout arrondi : trier
  // sur les montants formatés mettrait deux lots à 2,04 € et 2,44 € à égalité
  // parce qu'ils s'écrivent tous deux « 2,00 € » après le pas de 0,10 €.
  const triees = [...(lignes || [])].sort((a, b) => {
    if (Boolean(a?.priced) !== Boolean(b?.priced)) return a?.priced ? -1 : 1
    const ecart = (b?.range?.central ?? 0) - (a?.range?.central ?? 0)
    if (ecart !== 0) return ecart
    return (a?.daysLeft ?? 999) - (b?.daysLeft ?? 999)
  })
  const rangees = triees.map((ligne) => ({
    id: ligne.lotId ?? null,
    nom: ligne.name,
    joursRestants: ligne.daysLeft ?? null,
    typeDate: ligne.expiryKind ?? null,
    ouvert: Boolean(ligne.isOpened),
    dateRaccourcieParOuverture: Boolean(ligne.dateShortenedByOpening),
    grammes: ligne.grams ?? null,
    chiffre: Boolean(ligne.priced),
    // Un lot est un montant modeste : le pas des petits montants (0,10 €) du
    // §7.2 s'applique, jamais celui du coût par portion. Et deux grammes d'une
    // épice bon marché s'écrivent « moins de 0,10 € », jamais « 0,00 € » — un
    // lot acheté n'est pas gratuit (§7.1).
    montant: ligne.priced ? ecrireMontant(ligne.range?.central).texte : null,
    fourchette: ligne.priced && !ecrireMontant(ligne.range?.central).negligeable
      ? `${formaterEuros(ligne.range?.low)} – ${formaterEuros(ligne.range?.high)}`
      : null,
    motif: ligne.priced ? null : ligne.reason,
  }))
  return limite ? rangees.slice(0, limite) : rangees
}
