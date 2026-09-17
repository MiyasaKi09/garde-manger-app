/**
 * LE POINT DE DIVERGENCE ENTRE UN PLAT CARNÉ ET SON JUMEAU VÉGÉTARIEN.
 *
 * POURQUOI CE SCRIPT EXISTE. Le livrable 2.3 de docs/PLAN_FINIR_MYKO.md demande
 * une fiche de cuisine FUSIONNÉE : quand Julien mange la version carnée et Zoé
 * son jumeau de même lignée, on ne cuisine pas deux plats — les étapes communes
 * sont faites une fois, et la fiche ne sépare qu'au point de divergence, la
 * protéine. Le plan pose une règle sur ce point de divergence : il se CALCULE
 * depuis les deux listes d'étapes et le `derived_from` du jumeau, puis il est
 * DÉCLARÉ dans le fichier d'arbitrage ; il n'est jamais deviné à l'exécution.
 *
 * Ce script est la moitié « calcule ». Il ne décide rien : il propose, et la
 * proposition se relit. L'autre moitié est
 * data/recipes/arbitrations/fiches-fusionnees.json, qui ne contient que des
 * couples relus ligne à ligne. Un couple non déclaré n'est pas fusionné — et
 * lib/domain/recipes/ficheFusionnee.js dit alors POURQUOI au lieu d'inventer un
 * découpage à l'écran.
 *
 * CE QU'IL CALCULE, ET COMMENT.
 *
 *   1. Les couples candidats : deux recettes de MÊME LIGNÉE
 *      (`derived_from || code`, la règle de recipeLineage() dans
 *      closedLoopPlanner.js:777), dont l'une est végétarienne et l'autre non.
 *      Le couple n'est donc pas forcément (parent, enfant) : SRC-014-D5
 *      (jambonneau) et SRC-014-D4 (poireau confit) sont deux enfants de
 *      SRC-014, et le planificateur substitue bien l'un à l'autre — mesuré
 *      dans scripts/data/out/rapport-qualite-semaine.txt, semaine du
 *      28 septembre. Ne regarder que les couples parent/enfant aurait manqué
 *      ce cas-là.
 *
 *   2. Les ingrédients divergents : les formes présentes chez l'un et absentes
 *      chez l'autre, comparées sur la forme NORMALISÉE (normalizeName, la même
 *      normalisation que le catalogue). On en tire la protéine de chaque
 *      branche — la forme divergente de rôle « protéine », ou à défaut celle
 *      dont l'origine est animale du côté carné.
 *
 *   3. L'alignement des deux listes d'étapes : Needleman-Wunsch (alignement
 *      global monotone, avec trous) sur une similarité de Jaccard entre les
 *      mots porteurs de chaque instruction. Monotone, parce qu'une recette est
 *      une suite d'opérations et qu'on ne fusionne pas une étape 5 avec une
 *      étape 2 : on cuisinerait dans le désordre. L'alternative envisagée —
 *      apparier chaque étape à sa plus proche sans contrainte d'ordre — a été
 *      écartée pour cette raison.
 *
 *   4. Le verdict par étape : une étape est DIVERGENTE si elle nomme un
 *      ingrédient divergent, si elle n'a pas de vis-à-vis (trou), ou si son
 *      vis-à-vis lui ressemble trop peu (seuil ci-dessous). Sinon elle est
 *      COMMUNE. Les étapes divergentes contiguës forment un seul bloc de
 *      divergence : c'est le moment où les deux poêles se séparent.
 *
 * CE QU'IL NE FAIT PAS. Il n'écrit pas dans l'arbitrage, il n'écrit pas dans le
 * corpus, il ne réécrit aucune instruction. Le texte affiché par la fiche
 * fusionnée est toujours celui d'une étape du corpus, mot pour mot, et
 * l'arbitrage déclare de quel côté il vient : une étape « commune » a deux
 * rédactions, et en choisir une est une décision qui se lit, pas une moyenne
 * qui se calcule.
 *
 * CE QUE VAUT SON ALIGNEMENT, ET IL FAUT LE DIRE. Rejoué sur les HUIT couples
 * que la relecture déclare fusionnables (`--couple A B`), le calcul trouve
 * 0, 0, 2, 4, 2, 1, 6 et 4 blocs non divergents là où la relecture en déclare
 * 1, 1, 5, 5, 3, 2, 6 et 4 — dans l'ordre FR-008/JUM-081, FR-019/JUM-031,
 * SRC-042/JUM-112, FR-037/JUM-043, IT-004/JUM-001, DEN-015/JUM-055,
 * SRC-012/SRC-012-D1, SRC-025/SRC-025-D4.
 *
 * Il SOUS-ESTIME sur six couples et tombe juste sur deux, et la coupure est
 * nette : les deux qu'il retrouve sont les deux dont les étapes communes sont
 * MOT POUR MOT les mêmes des deux côtés (similarité 1 — ce sont des variantes
 * `-D` d'une même fiche). Partout ailleurs la cause est dans le corpus : les
 * recettes anciennes tiennent leur méthode en quatre ou cinq phrases
 * télégraphiques (« Faire fondre oignons, poivrons et ail ») quand les jumeaux,
 * écrits en septembre, en font sept, longues et explicatives. Deux textes qui
 * décrivent le même geste ne partagent alors presque aucun mot, et aucune
 * mesure de similarité lexicale ne les rapprochera. Ce qui est fiable ici, ce
 * sont les INGRÉDIENTS divergents — une différence d'ensembles sur des formes
 * normalisées, sans ambiguïté — et la liste des couples candidats. Le
 * découpage, lui, se relit : c'est pour cela que l'arbitrage existe, et non
 * pour entériner ce fichier.
 *
 *   node scripts/data/recipes/link-fiches-fusionnees.mjs                # relit l'arbitrage contre le corpus
 *   node scripts/data/recipes/link-fiches-fusionnees.mjs --propositions # écrit les propositions à relire
 *   node scripts/data/recipes/link-fiches-fusionnees.mjs --couple A B   # détaille un couple
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const CATALOGUE = join(ROOT, 'scripts', 'data', 'out', 'recipe-food-catalog.json')
const ARBITRAGE = join(ROOT, 'data', 'recipes', 'arbitrations', 'fiches-fusionnees.json')
const PROPOSITIONS = join(ROOT, 'scripts', 'data', 'out', 'fiches-fusionnees-propositions.json')

/**
 * Le seuil de ressemblance au-dessus duquel deux étapes sont PROPOSÉES comme la
 * même opération. Il ne décide rien : aucun couple n'est fusionné sans
 * relecture, et le baisser ne ferait jamais passer une fusion — il ferait
 * grossir la liste à relire.
 *
 * CE QUE CE SEUIL VAUT, MESURÉ. Sur les 150 couples candidats, l'alignement
 * propose 360 blocs communs dont la similarité médiane est de 1,0 : ce sont les
 * couples dont les deux textes sont identiques mot pour mot (les dérivées
 * SRC-…-Dn d'une même source). Entre 0,30 et 1,0 il n'y a presque personne, et
 * c'est pourquoi la valeur exacte du seuil ne change pas grand-chose.
 */
const SEUIL_RESSEMBLANCE = 0.30

/** Pénalité de trou de l'alignement : une étape sans vis-à-vis coûte moins qu'un mauvais appariement. */
const PENALITE_TROU = -0.35

const ORIGINES_VEGETARIENNES = new Set(['vegetal', 'mineral', 'animal:oeuf', 'animal:lait', 'animal:miel'])
const ORIGINES_CARNEES = new Set(['animal:viande', 'animal:volaille', 'animal:poisson', 'animal:fruits_de_mer', 'animal:autre'])

/**
 * Mots vides. Ils sont retirés avant la comparaison parce qu'ils sont dans
 * toutes les instructions : les garder ferait ressembler deux étapes qui n'ont
 * en commun que la grammaire française.
 */
const MOTS_VIDES = new Set((
  'les des une aux dans sur sous pour par avec sans cette ces son leur leurs puis ensuite qui que quoi elle est sont ont ete plus moins tout toute tous toutes bien peu tres deux trois quatre cinq six sept huit neuf dix minutes minute heure heures fois jusqu pas mais donc car quand comme lors apres avant pendant environ elles ils faire fait faut bien encore aussi autre autres meme leur'
).split(' '))

const motsPorteurs = (texte) => new Set(
  normalizeName(texte).split(' ').filter((mot) => mot.length > 2 && !MOTS_VIDES.has(mot)),
)

function jaccard(a, b) {
  let commun = 0
  for (const mot of a) if (b.has(mot)) commun++
  const union = a.size + b.size - commun
  return union ? commun / union : 0
}

function chargerCorpus() {
  const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
  const catalogue = JSON.parse(readFileSync(CATALOGUE, 'utf8'))
  const origineParForme = new Map(catalogue.forms.map((forme) => [forme.canonical_name_normalized, forme.origin]))
  return { corpus, origineParForme }
}

/**
 * L'origine d'une forme, ou `null` quand le catalogue ne la porte pas. `null`
 * n'est pas « végétal » : 219 formes du corpus sont absentes du catalogue (ce
 * sont celles qui bloquent la publication de leur recette), et les traiter
 * comme végétales ferait passer une palette de porc fumée pour un légume.
 */
const origineDe = (origineParForme, forme) => origineParForme.get(normalizeName(forme)) ?? null

function estVegetarienne(recette, origineParForme) {
  return (recette.ingredients || [])
    .filter((ingredient) => !ingredient.optional)
    .every((ingredient) => ORIGINES_VEGETARIENNES.has(origineDe(origineParForme, ingredient.form) ?? 'inconnu'))
}

const lignee = (recette) => recette.derived_from || recette.code

/** Les couples (carné, végé) de même lignée, tous deux pourvus d'étapes. */
export function couplesCandidats(corpus, origineParForme) {
  const parLignee = new Map()
  for (const recette of corpus.recipes) {
    const cle = lignee(recette)
    if (!parLignee.has(cle)) parLignee.set(cle, [])
    parLignee.get(cle).push(recette)
  }
  const couples = []
  for (const [cle, groupe] of parLignee) {
    if (groupe.length < 2) continue
    const veges = groupe.filter((recette) => estVegetarienne(recette, origineParForme) && (recette.steps || []).length)
    const carnes = groupe.filter((recette) => !estVegetarienne(recette, origineParForme) && (recette.steps || []).length)
    for (const vege of veges) {
      for (const carne of carnes) couples.push({ lignee: cle, carne, vege })
    }
  }
  return couples.sort((gauche, droite) => gauche.carne.code.localeCompare(droite.carne.code)
    || gauche.vege.code.localeCompare(droite.vege.code))
}

/**
 * Les ingrédients qui séparent les deux recettes, et la protéine de chaque
 * branche. La protéine est celle que le corpus DÉCLARE : le rôle « protéine »
 * d'abord, l'origine animale ensuite pour le côté carné. Quand aucun des deux
 * ne tranche, la liste sort vide et la proposition le dit — c'est un couple à
 * relire de plus près, pas un couple à compléter.
 */
export function ingredientsDivergents(carne, vege, origineParForme) {
  const formesCarne = new Map((carne.ingredients || []).map((ingredient) => [normalizeName(ingredient.form), ingredient]))
  const formesVege = new Map((vege.ingredients || []).map((ingredient) => [normalizeName(ingredient.form), ingredient]))
  const seulementCarne = [...formesCarne].filter(([forme]) => !formesVege.has(forme)).map(([, ingredient]) => ingredient)
  const seulementVege = [...formesVege].filter(([forme]) => !formesCarne.has(forme)).map(([, ingredient]) => ingredient)
  const communes = [...formesCarne].filter(([forme]) => formesVege.has(forme)).map(([, ingredient]) => ingredient)

  const estProteine = (ingredient) => String(ingredient.role || '').toLowerCase().includes('protéine')
  const proteineCarne = seulementCarne.filter((ingredient) => estProteine(ingredient)
    || ORIGINES_CARNEES.has(origineDe(origineParForme, ingredient.form) ?? ''))
  const proteineVege = seulementVege.filter((ingredient) => estProteine(ingredient))

  return { seulementCarne, seulementVege, communes, proteineCarne, proteineVege }
}

/**
 * Alignement global monotone des deux listes d'étapes. Rend une suite de
 * cellules { carne, vege, similarite } où chaque numéro d'étape apparaît une
 * fois et une seule, y compris en trou (`null` en face).
 */
export function alignerEtapes(etapesCarne, etapesVege) {
  const motsCarne = etapesCarne.map((etape) => motsPorteurs(etape.instruction))
  const motsVege = etapesVege.map((etape) => motsPorteurs(etape.instruction))
  const hauteur = etapesCarne.length
  const largeur = etapesVege.length
  const score = Array.from({ length: hauteur + 1 }, () => new Array(largeur + 1).fill(0))
  for (let i = 1; i <= hauteur; i++) score[i][0] = score[i - 1][0] + PENALITE_TROU
  for (let j = 1; j <= largeur; j++) score[0][j] = score[0][j - 1] + PENALITE_TROU
  for (let i = 1; i <= hauteur; i++) {
    for (let j = 1; j <= largeur; j++) {
      score[i][j] = Math.max(
        score[i - 1][j - 1] + jaccard(motsCarne[i - 1], motsVege[j - 1]),
        score[i - 1][j] + PENALITE_TROU,
        score[i][j - 1] + PENALITE_TROU,
      )
    }
  }
  const cellules = []
  let i = hauteur
  let j = largeur
  const egal = (gauche, droite) => Math.abs(gauche - droite) < 1e-9
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && egal(score[i][j], score[i - 1][j - 1] + jaccard(motsCarne[i - 1], motsVege[j - 1]))) {
      cellules.push({ carne: i, vege: j, similarite: Math.round(jaccard(motsCarne[i - 1], motsVege[j - 1]) * 1000) / 1000 })
      i--
      j--
    } else if (i > 0 && egal(score[i][j], score[i - 1][j] + PENALITE_TROU)) {
      cellules.push({ carne: i, vege: null, similarite: 0 })
      i--
    } else {
      cellules.push({ carne: null, vege: j, similarite: 0 })
      j--
    }
  }
  return cellules.reverse()
}

/** Une étape nomme-t-elle un ingrédient divergent ? Comparaison sur les mots porteurs de la forme. */
function nommeUnIngredient(instruction, ingredients) {
  const mots = motsPorteurs(instruction)
  return ingredients.some((ingredient) => {
    const motsForme = [...motsPorteurs(ingredient.form)].filter((mot) => mot.length > 3)
    return motsForme.length > 0 && motsForme.some((mot) => mots.has(mot))
  })
}

/**
 * La proposition de fiche fusionnée pour un couple : une suite de blocs
 * `commune` et `divergente`, dans l'ordre de la cuisine.
 */
export function proposerFiche(carne, vege, origineParForme) {
  const divergents = ingredientsDivergents(carne, vege, origineParForme)
  const etapesCarne = carne.steps || []
  const etapesVege = vege.steps || []
  const cellules = alignerEtapes(etapesCarne, etapesVege)

  const marquees = cellules.map((cellule) => {
    const instructionCarne = cellule.carne ? etapesCarne[cellule.carne - 1].instruction : null
    const instructionVege = cellule.vege ? etapesVege[cellule.vege - 1].instruction : null
    const nommeDivergent = (instructionCarne && nommeUnIngredient(instructionCarne, divergents.seulementCarne))
      || (instructionVege && nommeUnIngredient(instructionVege, divergents.seulementVege))
    const trou = !cellule.carne || !cellule.vege
    const tropDifferentes = cellule.similarite < SEUIL_RESSEMBLANCE
    return {
      ...cellule,
      role: (trou || nommeDivergent || tropDifferentes) ? 'divergente' : 'commune',
      motif: trou ? 'sans vis-à-vis' : nommeDivergent ? 'nomme un ingrédient divergent' : tropDifferentes ? 'ressemblance sous le seuil' : 'appariée',
    }
  })

  const blocs = []
  for (const cellule of marquees) {
    const precedent = blocs[blocs.length - 1]
    if (cellule.role === 'commune') {
      blocs.push({
        role: 'commune',
        carne: cellule.carne,
        vege: cellule.vege,
        similarite: cellule.similarite,
      })
      continue
    }
    if (precedent?.role === 'divergente') {
      if (cellule.carne) precedent.etapes_carne.push(cellule.carne)
      if (cellule.vege) precedent.etapes_vege.push(cellule.vege)
      precedent.motifs.push(cellule.motif)
      continue
    }
    blocs.push({
      role: 'divergente',
      etapes_carne: cellule.carne ? [cellule.carne] : [],
      etapes_vege: cellule.vege ? [cellule.vege] : [],
      motifs: [cellule.motif],
    })
  }

  const premiereDivergence = blocs.findIndex((bloc) => bloc.role === 'divergente')
  return {
    carne: carne.code,
    vege: vege.code,
    lignee: lignee(vege) === lignee(carne) ? lignee(vege) : null,
    famille_carne: carne.family,
    famille_vege: vege.family,
    etapes: { carne: etapesCarne.length, vege: etapesVege.length },
    communes: blocs.filter((bloc) => bloc.role === 'commune').length,
    divergences: blocs.filter((bloc) => bloc.role === 'divergente').length,
    premiere_divergence: premiereDivergence < 0 ? null : premiereDivergence + 1,
    proteine_carne: divergents.proteineCarne.map((ingredient) => ingredient.form),
    proteine_vege: divergents.proteineVege.map((ingredient) => ingredient.form),
    autres_divergents_carne: divergents.seulementCarne
      .filter((ingredient) => !divergents.proteineCarne.includes(ingredient)).map((ingredient) => ingredient.form),
    autres_divergents_vege: divergents.seulementVege
      .filter((ingredient) => !divergents.proteineVege.includes(ingredient)).map((ingredient) => ingredient.form),
    ingredients_communs: divergents.communes.length,
    blocs,
  }
}

// ─── Sorties ───────────────────────────────────────────────────────────────

function lireArbitrage() {
  if (!existsSync(ARBITRAGE)) return null
  return JSON.parse(readFileSync(ARBITRAGE, 'utf8'))
}

function detaillerCouple(corpus, origineParForme, codeCarne, codeVege) {
  const byCode = new Map(corpus.recipes.map((recette) => [recette.code, recette]))
  const carne = byCode.get(codeCarne)
  const vege = byCode.get(codeVege)
  if (!carne || !vege) {
    process.stdout.write(`Couple introuvable au corpus : ${codeCarne} / ${codeVege}\n`)
    return
  }
  const fiche = proposerFiche(carne, vege, origineParForme)
  process.stdout.write(`${carne.code} « ${carne.family} » (${fiche.etapes.carne} étapes)\n`)
  process.stdout.write(`${vege.code} « ${vege.family} » (${fiche.etapes.vege} étapes) — lignée ${fiche.lignee}\n`)
  process.stdout.write(`protéine carnée : ${fiche.proteine_carne.join(', ') || '— aucune tranchée'}\n`)
  process.stdout.write(`protéine végé   : ${fiche.proteine_vege.join(', ') || '— aucune tranchée'}\n`)
  process.stdout.write(`autres divergents carné : ${fiche.autres_divergents_carne.join(', ') || '—'}\n`)
  process.stdout.write(`autres divergents végé  : ${fiche.autres_divergents_vege.join(', ') || '—'}\n`)
  for (const bloc of fiche.blocs) {
    if (bloc.role === 'commune') {
      process.stdout.write(`\n[COMMUNE  sim ${bloc.similarite}] carné ${bloc.carne} ↔ végé ${bloc.vege}\n`)
      process.stdout.write(`   C${bloc.carne}: ${carne.steps[bloc.carne - 1].instruction.slice(0, 200)}\n`)
      process.stdout.write(`   V${bloc.vege}: ${vege.steps[bloc.vege - 1].instruction.slice(0, 200)}\n`)
    } else {
      process.stdout.write(`\n[DIVERGENTE] carné ${bloc.etapes_carne.join(',') || '—'} | végé ${bloc.etapes_vege.join(',') || '—'} (${[...new Set(bloc.motifs)].join(' ; ')})\n`)
      for (const n of bloc.etapes_carne) process.stdout.write(`   C${n}: ${carne.steps[n - 1].instruction.slice(0, 200)}\n`)
      for (const n of bloc.etapes_vege) process.stdout.write(`   V${n}: ${vege.steps[n - 1].instruction.slice(0, 200)}\n`)
    }
  }
}

function main() {
  const args = process.argv.slice(2)
  const { corpus, origineParForme } = chargerCorpus()

  const indexCouple = args.indexOf('--couple')
  if (indexCouple >= 0) {
    detaillerCouple(corpus, origineParForme, args[indexCouple + 1], args[indexCouple + 2])
    return
  }

  const couples = couplesCandidats(corpus, origineParForme)
  const propositions = couples.map(({ carne, vege }) => proposerFiche(carne, vege, origineParForme))

  if (args.includes('--propositions')) {
    writeFileSync(PROPOSITIONS, `${JSON.stringify({
      genere_par: 'scripts/data/recipes/link-fiches-fusionnees.mjs',
      corpus_version: corpus.corpus_version,
      seuil_ressemblance: SEUIL_RESSEMBLANCE,
      avertissement: 'Propositions à RELIRE. Rien ici n\'est appliqué : seul data/recipes/arbitrations/fiches-fusionnees.json fait foi. '
        + 'L\'alignement des ÉTAPES sous-estime les blocs communs (rejoué sur les HUIT couples déclarés fusionnables : '
        + '0, 0, 2, 4, 2, 1, 6, 4 calculés contre 1, 1, 5, 5, 3, 2, 6, 4 relus — il ne tombe juste que sur les deux couples '
        + 'dont les étapes communes sont mot pour mot identiques des deux côtés) : '
        + 'ce qui se lit sans réserve ici, ce sont les couples candidats et les ingrédients qui les séparent.',
      couples: propositions.length,
      propositions,
    }, null, 2)}\n`)
    process.stdout.write(`${propositions.length} proposition(s) écrites dans ${PROPOSITIONS}\n`)
  }

  const arbitrage = lireArbitrage()
  const decisions = arbitrage?.decisions || []
  const declarees = new Set(decisions.map((decision) => `${decision.carne}/${decision.vege}`))
  const fusionnables = decisions.filter((decision) => decision.fusionnable)
  const sansEtapeCommune = propositions.filter((proposition) => proposition.communes === 0)

  process.stdout.write(`\nCouples candidats (même lignée, l'un carné, l'autre végétarien) : ${propositions.length}\n`)
  process.stdout.write(`Couples sans AUCUNE étape commune calculée — le calcul ne propose rien à fusionner : ${sansEtapeCommune.length}\n`)
  process.stdout.write(`Couples relus et déclarés : ${declarees.size} — dont ${fusionnables.length} fusionnables, ${decisions.length - fusionnables.length} refusés\n`)
  process.stdout.write(`Couples candidats qui restent à relire : ${propositions.filter((proposition) => !declarees.has(`${proposition.carne}/${proposition.vege}`)).length}\n`)

  // La DÉRIVE : un couple déclaré que le corpus ne présente plus comme
  // candidat (recette retirée, origine retranchée, lignée changée). C'est le
  // seul contrôle que ce script fait sur l'arbitrage ; le reste — couverture
  // des étapes, ordre, rien de carné dans le pot commun — est vérifié à chaque
  // exécution de la suite par tests/data/fichesFusionnees.test.js.
  const declareesHorsCandidats = [...declarees].filter((cle) => !propositions.some((proposition) => `${proposition.carne}/${proposition.vege}` === cle))
  if (declareesHorsCandidats.length) {
    process.stdout.write(`ATTENTION — déclarés mais plus candidats au corpus : ${declareesHorsCandidats.join(', ')}\n`)
  }
  const ecartsEtapes = decisions.filter((decision) => decision.fusionnable).flatMap((decision) => {
    const proposition = propositions.find((item) => item.carne === decision.carne && item.vege === decision.vege)
    if (!proposition) return []
    const declareesCarne = decision.blocs.flatMap((bloc) => bloc.carne || []).length
    const declareesVege = decision.blocs.flatMap((bloc) => bloc.vege || []).length
    return declareesCarne === proposition.etapes.carne && declareesVege === proposition.etapes.vege
      ? []
      : [`${decision.carne}/${decision.vege} : ${declareesCarne}/${declareesVege} étapes déclarées pour ${proposition.etapes.carne}/${proposition.etapes.vege} au corpus`]
  })
  if (ecartsEtapes.length) {
    process.stdout.write(`ATTENTION — l'arbitrage ne couvre plus toutes les étapes :\n  ${ecartsEtapes.join('\n  ')}\n`)
  }

  const repartition = new Map()
  for (const proposition of propositions) {
    const cle = `${proposition.communes} commune(s) / ${proposition.divergences} divergence(s)`
    repartition.set(cle, (repartition.get(cle) || 0) + 1)
  }
  process.stdout.write('\nRépartition des propositions :\n')
  for (const [cle, nombre] of [...repartition].sort((gauche, droite) => droite[1] - gauche[1])) {
    process.stdout.write(`  ${String(nombre).padStart(3)} × ${cle}\n`)
  }
}

if (process.argv[1] && process.argv[1].endsWith('link-fiches-fusionnees.mjs')) main()
