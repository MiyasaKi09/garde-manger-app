import arbitrage from '@/data/recipes/arbitrations/fiches-fusionnees.json'

/**
 * LA FICHE DE CUISINE FUSIONNÉE — livrable 2.3 de docs/PLAN_FINIR_MYKO.md.
 *
 * CE QU'ELLE RÉSOUT. C'est la demande d'origine du foyer : Zoé veut manger
 * moins de viande que Julien, DANS LE MÊME PLAT. Quand Julien mange la version
 * carnée et Zoé son jumeau de même lignée, on ne cuisine pas deux plats : les
 * étapes communes se font une fois, et la fiche ne sépare qu'au point de
 * divergence — la protéine.
 *
 * LA RÈGLE QUI TIENT TOUT CE FICHIER. Le point de divergence se CALCULE, en
 * amont, par `scripts/data/recipes/link-fiches-fusionnees.mjs` — qui aligne les
 * deux listes d'étapes et relève les ingrédients qui séparent les deux
 * recettes —, puis il est DÉCLARÉ, couple par couple, dans
 * `data/recipes/arbitrations/fiches-fusionnees.json`. Ici, à l'exécution, on ne
 * devine RIEN : un couple absent de l'arbitrage n'est pas fusionné, et
 * `raison` dit lequel des cas on est. Une fiche fusionnée à la volée — par
 * ressemblance de titres, par position d'étape, par « c'est sûrement là que ça
 * se sépare » — donnerait à l'écran un découpage qu'aucun relecteur ne pourrait
 * distinguer d'un découpage vrai. C'est précisément ce que ce plan interdit.
 *
 * TROIS REFUS, ET ILS SE DISENT. `non_declare` (le couple n'a pas été relu),
 * `declare_non_fusionnable` (il a été relu ET refusé — le motif est dans
 * l'arbitrage et il s'affiche), `declaration_perimee` (l'arbitrage désigne une
 * étape que la recette servie ne porte plus). Le troisième est le garde-fou du
 * jour où le corpus bouge sans que l'arbitrage suive : plutôt que de rendre une
 * fiche à trous, on refuse et on le dit.
 *
 * CE FICHIER NE LIT NI LA BASE NI LE CORPUS. Il reçoit deux recettes déjà
 * matérialisées — `{ code, family, servings, exactSteps, exactIngredients }` —
 * et fonctionne donc à l'identique sur le chemin base
 * (`getEditorialRecipe`) et sur le chemin JSON du dépôt
 * (`getCanonicalRecipe`). C'est ce qui permet au rapport de qualité de mesurer
 * P9 sans base, et à l'API de servir la même fiche depuis Supabase.
 */

const COTE_CARNE = 'carne'

export const RAISONS = Object.freeze({
  NON_DECLARE: 'non_declare',
  DECLARE_NON_FUSIONNABLE: 'declare_non_fusionnable',
  DECLARATION_PERIMEE: 'declaration_perimee',
  RECETTE_MANQUANTE: 'recette_manquante',
})

const cle = (carne, vege) => `${String(carne || '').toUpperCase()}/${String(vege || '').toUpperCase()}`

const parCouple = new Map((arbitrage.decisions || []).map((decision) => [cle(decision.carne, decision.vege), decision]))

/**
 * La déclaration d'un couple, quel que soit l'ordre des deux codes.
 *
 * L'ordre est indifférent parce que l'appelant ne sait pas toujours lequel des
 * deux plats est le carné : un écran a deux assiettes et deux codes, pas une
 * classification. L'arbitrage, lui, range toujours le carné d'abord, et c'est
 * lui qui tranche — on ne reclassifie pas ici, on lit.
 */
export function declarationFusion(codeA, codeB) {
  const direct = parCouple.get(cle(codeA, codeB))
  if (direct) return { decision: direct, carne: direct.carne, vege: direct.vege }
  const inverse = parCouple.get(cle(codeB, codeA))
  if (inverse) return { decision: inverse, carne: inverse.carne, vege: inverse.vege }
  return null
}

/** Le couple est-il déclaré ET fusionnable ? C'est ce que P9 compte. */
export function coupleFusionnable(codeA, codeB) {
  const declaration = declarationFusion(codeA, codeB)
  return Boolean(declaration?.decision?.fusionnable)
}

/** Tous les couples déclarés fusionnables, dans l'ordre de l'arbitrage. */
export function couplesFusionnablesDeclares() {
  return (arbitrage.decisions || [])
    .filter((decision) => decision.fusionnable)
    .map((decision) => ({ carne: decision.carne, vege: decision.vege, lignee: decision.lignee }))
}

/** Tous les couples relus, fusionnables ou non — ce que l'arbitrage couvre. */
export function couplesDeclares() {
  return (arbitrage.decisions || []).map((decision) => ({
    carne: decision.carne,
    vege: decision.vege,
    lignee: decision.lignee,
    fusionnable: Boolean(decision.fusionnable),
  }))
}

/**
 * P9 — LES PLATS DISTINCTS À CUISINER, quand deux d'entre eux se cuisinent
 * ensemble.
 *
 * P9 compte ce que le foyer doit RÉELLEMENT préparer : le plat du foyer, plus
 * chaque substitution. Jusqu'à ce livrable, un jumeau végétarien servi à côté
 * de sa version carnée comptait pour un plat de plus — c'était vrai, il fallait
 * bien deux casseroles. Une fiche fusionnée DÉCLARÉE change ce fait : deux
 * assiettes, une seule préparation.
 *
 * LA RÈGLE EXACTE, parce que « compter un couple pour un » est plus subtil
 * qu'il n'y paraît. On n'annule pas un code au profit de l'autre : on met les
 * deux codes dans la MÊME CLASSE dès qu'un créneau les a fait cuisiner
 * ensemble, et on compte les classes. Sans quoi un plat servi fusionné lundi et
 * seul jeudi compterait deux fois, alors que c'est le même plat.
 *
 * Ce qui n'est pas déclaré ne fusionne pas : deux codes servis au même créneau
 * sans déclaration restent deux préparations, et `fusions` liste ce qui a été
 * réuni pour que le chiffre se conteste ligne à ligne.
 *
 * @param {Array<{meal_date?: string, meal_type?: string, slot_key?: string, canonical_recipe_code?: string}>} repas
 */
export function preparationsDistinctes(repas) {
  const parent = new Map()
  const racine = (code) => {
    let courant = code
    while (parent.get(courant) && parent.get(courant) !== courant) courant = parent.get(courant)
    return courant
  }
  const ajouter = (code) => { if (!parent.has(code)) parent.set(code, code) }
  const unir = (gauche, droite) => {
    const [a, b] = [racine(gauche), racine(droite)].sort()
    if (a !== b) parent.set(b, a)
  }

  const parCreneau = new Map()
  for (const meal of repas || []) {
    const code = meal?.canonical_recipe_code
    if (!code) continue
    ajouter(code)
    const creneau = meal.slot_key || `${meal.meal_date}-${meal.meal_type}`
    if (!parCreneau.has(creneau)) parCreneau.set(creneau, new Set())
    parCreneau.get(creneau).add(code)
  }

  const fusions = []
  for (const [creneau, codes] of parCreneau) {
    const liste = [...codes]
    for (let i = 0; i < liste.length; i++) {
      for (let j = i + 1; j < liste.length; j++) {
        if (!coupleFusionnable(liste[i], liste[j])) continue
        const declaration = declarationFusion(liste[i], liste[j])
        fusions.push({ creneau, carne: declaration.carne, vege: declaration.vege })
        unir(liste[i], liste[j])
      }
    }
  }

  const classes = new Map()
  for (const code of parent.keys()) {
    const cleClasse = racine(code)
    if (!classes.has(cleClasse)) classes.set(cleClasse, [])
    classes.get(cleClasse).push(code)
  }

  return {
    preparations: classes.size,
    platsServis: parent.size,
    fusions,
    classes: [...classes.values()].map((codes) => codes.sort()),
  }
}

const refus = (code, message, extra = {}) => ({ fusionnee: false, raison: { code, message, ...extra } })

const etapeDe = (recette, numero) => (recette?.exactSteps || []).find((etape) => Number(etape.n) === Number(numero)) || null

/**
 * Les ingrédients de la fiche, rangés en trois listes.
 *
 * CE QUE « COMMUN » VEUT DIRE ICI, et il faut le dire précisément : une forme
 * que les DEUX recettes portent. Pas « une forme qui va dans le récipient
 * commun » — le gruyère du gratin de brocolis est dans les deux recettes et
 * n'entre qu'à l'étape divergente, où chaque branche prend sa part. La liste
 * dit donc ce qu'il faut sortir en tout ; ce sont les ÉTAPES qui disent quand
 * et où. Le distinguer évite d'écrire à l'écran une phrase (« dans la
 * préparation commune ») qui serait fausse pour une ligne sur dix.
 *
 * LA QUANTITÉ COMMUNE EST UNE SOMME, et c'est la seule règle correcte quand
 * deux recettes se cuisinent ensemble : chaque branche demande la sienne. C'est
 * l'inverse de la règle de `CookSession.mergeIngredientLists`, qui prend le
 * MAXIMUM — elle vaut pour deux entrées d'un MÊME plat (une seule poêle, une
 * seule quantité), pas pour deux recettes différentes cuites ensemble.
 * Confondre les deux ferait sous-déduire du stock tout ce que la seconde
 * assiette consomme.
 *
 * Quand la même forme est exprimée dans deux unités différentes des deux côtés,
 * on NE somme PAS : la ligne reste dans chaque branche et l'écart est rendu
 * dans `ecartsUnite`. Convertir demanderait une densité qu'on n'a pas ici.
 */
function rangerIngredients(carne, vege, exclusions) {
  const exclus = new Set((exclusions || [])
    .filter((exclusion) => exclusion.cote === COTE_CARNE)
    .map((exclusion) => normaliser(exclusion.forme)))

  const parForme = (recette) => new Map((recette.exactIngredients || [])
    .map((ingredient) => [ingredient.formNormalized || normaliser(ingredient.name), ingredient]))

  const formesCarne = parForme(carne)
  const formesVege = parForme(vege)

  const communs = []
  const brancheCarnee = []
  const brancheVegetarienne = []
  const ecartsUnite = []

  for (const [forme, ingredient] of formesCarne) {
    const jumeau = formesVege.get(forme)
    if (!jumeau || exclus.has(forme)) {
      brancheCarnee.push({ ...ingredient, exclu_de_la_base: exclus.has(forme) })
      continue
    }
    if (String(ingredient.unit) !== String(jumeau.unit)) {
      ecartsUnite.push({ forme, uniteCarne: ingredient.unit, uniteVege: jumeau.unit })
      brancheCarnee.push({ ...ingredient })
      continue
    }
    communs.push({
      ...ingredient,
      quantity: arrondi(Number(ingredient.quantity || 0) + Number(jumeau.quantity || 0)),
      grams: sommeOuNull(ingredient.grams, jumeau.grams),
      optional: Boolean(ingredient.optional) && Boolean(jumeau.optional),
      part_carnee: arrondi(Number(ingredient.quantity || 0)),
      part_vegetarienne: arrondi(Number(jumeau.quantity || 0)),
    })
  }

  for (const [forme, ingredient] of formesVege) {
    const jumeau = formesCarne.get(forme)
    if (!jumeau || exclus.has(forme)) {
      brancheVegetarienne.push({ ...ingredient })
      continue
    }
    if (String(ingredient.unit) !== String(jumeau.unit)) brancheVegetarienne.push({ ...ingredient })
  }

  return { communs, brancheCarnee, brancheVegetarienne, ecartsUnite }
}

const normaliser = (valeur) => String(valeur || '')
  .replace(/œ/gi, 'oe').replace(/æ/gi, 'ae')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[’']/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const arrondi = (valeur) => Math.round(Number(valeur || 0) * 100) / 100

const sommeOuNull = (gauche, droite) => {
  if (gauche == null || droite == null) return null
  return arrondi(Number(gauche) + Number(droite))
}

/**
 * La fiche fusionnée d'un couple, ou son refus motivé.
 *
 * @param {object} options
 * @param {object} options.carne  recette matérialisée de la version carnée, déjà mise à l'échelle
 * @param {object} options.vege   recette matérialisée du jumeau, déjà mise à l'échelle
 * @param {string[]} [options.mangeursCarne]  qui mange la version carnée (affichage)
 * @param {string[]} [options.mangeursVege]   qui mange le jumeau (affichage)
 */
export function ficheFusionnee({ carne, vege, mangeursCarne = [], mangeursVege = [] }) {
  if (!carne?.code || !vege?.code) {
    return refus(RAISONS.RECETTE_MANQUANTE, 'Les deux recettes du couple sont nécessaires pour fusionner une fiche.')
  }

  const declaration = declarationFusion(carne.code, vege.code)
  if (!declaration) {
    return refus(
      RAISONS.NON_DECLARE,
      `Le couple ${carne.code} / ${vege.code} n'a pas été relu : aucune fusion n'est déclarée pour lui.`,
    )
  }

  // Les rôles viennent de l'arbitrage, jamais de l'ordre des arguments : un
  // appelant qui les inverse obtiendrait sinon une fiche où la branche
  // végétarienne porte la viande.
  const [cote, contre] = declaration.carne === carne.code ? [carne, vege] : [vege, carne]
  const [mangeursCote, mangeursContre] = declaration.carne === carne.code
    ? [mangeursCarne, mangeursVege]
    : [mangeursVege, mangeursCarne]

  const { decision } = declaration
  if (!decision.fusionnable) {
    return refus(
      RAISONS.DECLARE_NON_FUSIONNABLE,
      decision.motif,
      { carne: decision.carne, vege: decision.vege },
    )
  }

  const blocs = []
  for (const bloc of decision.blocs || []) {
    const etapesCarne = (bloc.carne || []).map((numero) => ({ n: numero, etape: etapeDe(cote, numero) }))
    const etapesVege = (bloc.vege || []).map((numero) => ({ n: numero, etape: etapeDe(contre, numero) }))
    const manquante = [...etapesCarne, ...etapesVege].find((item) => !item.etape)
    if (manquante) {
      return refus(
        RAISONS.DECLARATION_PERIMEE,
        `L'arbitrage désigne une étape ${manquante.n} que la recette servie ne porte plus : la fiche n'est pas fusionnée tant que le couple n'est pas relu.`,
        { carne: decision.carne, vege: decision.vege },
      )
    }
    if (bloc.role === 'divergente') {
      blocs.push({
        role: 'divergente',
        carne: etapesCarne.map((item) => item.etape),
        vege: etapesVege.map((item) => item.etape),
      })
      continue
    }
    // Un bloc commun ou parallèle porte UN texte, celui du côté déclaré, et il
    // est rendu mot pour mot. Les deux côtés restent exposés pour que l'écran
    // puisse dire à quelles étapes de chaque recette ce bloc correspond.
    const source = bloc.texte === COTE_CARNE ? etapesCarne : etapesVege
    blocs.push({
      role: bloc.role,
      texte: bloc.texte,
      etapes: source.map((item) => item.etape),
      correspondances: { carne: bloc.carne || [], vege: bloc.vege || [] },
    })
  }

  // LE POINT DE DIVERGENCE : le premier bloc divergent qui suit un bloc commun.
  // C'est là, et seulement là, que la préparation commune se répartit entre les
  // deux assiettes. Un bloc divergent placé AVANT tout bloc commun (le poulet
  // qu'on colore à part, les lentilles qu'on cuit d'avance) n'est pas un point
  // de divergence : rien n'a encore été mis en commun.
  const premierCommun = blocs.findIndex((bloc) => bloc.role !== 'divergente')
  const pointDeDivergence = premierCommun < 0
    ? null
    : blocs.findIndex((bloc, index) => index > premierCommun && bloc.role === 'divergente')

  const ingredients = rangerIngredients(cote, contre, decision.exclus_de_la_base_commune)

  return {
    fusionnee: true,
    carne: { code: cote.code, family: cote.family, servings: cote.servings, mangeurs: mangeursCote },
    vege: { code: contre.code, family: contre.family, servings: contre.servings, mangeurs: mangeursContre },
    lignee: decision.lignee,
    proteines: { carne: decision.proteine_carne || [], vege: decision.proteine_vege || [] },
    exclusions: decision.exclus_de_la_base_commune || [],
    motif: decision.motif,
    blocs,
    pointDeDivergence: pointDeDivergence >= 0 ? pointDeDivergence : null,
    ingredients,
    // Ce que la fiche fait gagner, compté et non promis : le nombre de blocs
    // faits une seule fois pour les deux assiettes. Les blocs « parallèles »
    // n'en sont pas — ils se lisent une fois, ils se font deux fois — et ils
    // sont comptés à part pour que personne ne les additionne par mégarde.
    compte: {
      blocsCommuns: blocs.filter((bloc) => bloc.role === 'commune').length,
      blocsParalleles: blocs.filter((bloc) => bloc.role === 'parallele').length,
      blocsDivergents: blocs.filter((bloc) => bloc.role === 'divergente').length,
      etapesCarne: (cote.exactSteps || []).length,
      etapesVege: (contre.exactSteps || []).length,
    },
  }
}
