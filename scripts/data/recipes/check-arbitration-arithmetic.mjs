/**
 * Confronte un ARBITRAGE CANONIQUE à ses propres chiffres et au dossier.
 *
 * L'arbitrage est le cœur du travail éditorial : il dit ce que le dossier de
 * sources montre, où les sources divergent, et ce qu'on a tranché. Rien ne le
 * vérifiait. Le validateur regarde la forme des recettes, le contrôle de prose
 * regarde la recopie, la synthèse propose des quantités — mais aucun ne relit
 * l'arbitrage, et un arbitrage faux est plus coûteux qu'une quantité fausse :
 * c'est lui qui sert de preuve au relecteur suivant.
 *
 * Le batch 3 a montré la famille de fautes que ce script attrape. Deux
 * réfuteurs indépendants, sur des lots différents, ont trouvé les mêmes deux
 * choses :
 *
 * 1. DES ARBITRAGES QUI SE CONTREDISENT EN ARITHMÉTIQUE. « médiane 72 g par
 *    personne, soit 400 g » pour six parts : 72 × 6 fait 432. Un relecteur qui
 *    refait le calcul tombe sur un écart que rien n'explique, et ne sait plus
 *    si c'est la médiane ou le total qui est faux.
 *
 * 2. DES DÉCOMPTES DE SOURCES RECOPIÉS DU SCRIPT DE SYNTHÈSE au lieu d'être
 *    relus sur le dossier. Le script rapproche parfois à faux — le piment de
 *    Cayenne rangé sous « poivre noir moulu », « 4 filets de poulet » sous
 *    « filet mignon de porc » — donc le nombre de sources qu'il rattache à une
 *    ligne n'est pas le nombre de sources du dossier. « huit sources sur neuf »
 *    quand les neuf en portent, « cinq sur sept » quand elles sont six. Le
 *    dénominateur, lui, est vérifiable exactement : c'est le nombre de sources
 *    du dossier, et rien d'autre.
 *
 * Ce script SIGNALE, il ne refuse pas. Un arbitrage est de la prose, et un écart
 * peut être une décision assumée ailleurs dans le paragraphe. C'est au relecteur
 * de trancher, le dossier sous les yeux.
 *
 *   node scripts/data/recipes/check-arbitration-arithmetic.mjs data/recipes/batches/batch3-*.json
 *   node scripts/data/recipes/check-arbitration-arithmetic.mjs --corpus
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const DOSSIERS = join(ROOT, 'data', 'recipes', 'sources')

const CHIFFRES = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6,
  sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12,
}
const MOTS_CHIFFRES = Object.keys(CHIFFRES).join('|')

const nombre = (texte) => {
  const brut = String(texte).replace(/\s/g, '').replace(',', '.')
  const chiffre = Number.parseFloat(brut)
  if (Number.isFinite(chiffre)) return chiffre
  return CHIFFRES[String(texte).toLowerCase()] ?? null
}

/**
 * Tolérance sur l'écart entre « médiane × parts » et le total annoncé.
 *
 * Elle est double parce qu'un seul seuil ne peut pas convenir aux deux bouts de
 * l'échelle. En relatif seul, 1,8 g arrondi à 2 g serait un écart de 11 % — du
 * bruit sur une épice. En absolu seul, 30 g d'écart sur un total de 450 g
 * passerait inaperçu alors qu'il déplace la nutrition.
 *
 * Cinq grammes, parce qu'en dessous l'écart ne peut pas bouger la nutrition
 * affichée d'un plat entier ; 4 %, parce que c'est en dessous de l'arrondi
 * habituel vers un nombre rond (450 pour 456, soit 1,3 %) et au-dessus du bruit.
 */
const tolerance = (attendu) => Math.max(5, attendu * 0.04)

/**
 * Les tournures « médiane X …, soit Y g ».
 *
 * Le motif est BORNÉ À UNE PROPOSITION : sans borne, le « soit » attrapé peut
 * appartenir à une phrase suivante et le contrôle compare deux chiffres qui ne
 * parlent pas du même ingrédient. On interdit donc le point, le point-virgule et
 * le tiret cadratin entre les deux, et on limite la distance.
 */
const MEDIANE = new RegExp(
  // L'unité peut être abrégée (« c. à s. »), donc elle admet un point — mais
  // seulement APRÈS des lettres. Un point admis seul laissait le motif franchir
  // la frontière de phrase que `[^.;—]` est justement là pour tenir.
  String.raw`m[ée]diane[^.;—]{0,70}?(\d+(?:[.,]\d+)?)\s*(?<unite>(?:[a-zàâäéèêëîïôöùûüç]+\.?)?)` +
  String.raw`[^.;—]{0,60}?soit\s+(?:environ\s+|à\s+peu\s+près\s+)?(\d[\d\s]*(?:[.,]\d+)?)\s*(g|ml|cl)\b`,
  'gi',
)

/**
 * Unités de COMPTAGE, où la médiane n'est pas une masse par personne.
 *
 * « médiane 2 cuillerées, soit 30 g » est juste : deux cuillerées pèsent trente
 * grammes, et multiplier 2 par le nombre de parts n'aurait aucun sens. Le
 * contrôle ne s'applique qu'aux médianes exprimées en masse ou en volume — les
 * seules qu'on puisse ramener au total en multipliant par les parts.
 */
const UNITES_DE_COMPTAGE = /^(?:cuiller|cuiller[ée]e?s?|c\.?|pi[èe]ces?|gousses?|tranches?|verres?|sachets?|brins?|pinc[ée]es?|feuilles?|branches?|bottes?|bo[îi]tes?|oeufs?|œufs?|tasses?|louches?|doses?|noix|filets?)$/i

/**
 * Les tournures « N sources sur M ».
 *
 * « six pages sur trois SITES » n'est pas une fraction : c'est une répartition,
 * six pages réparties sur trois sites. Le dénominateur suivi de « site » est
 * donc écarté — sans cette exception le contrôle criait sur des phrases justes.
 */
const FRACTION = new RegExp(
  String.raw`\b(${MOTS_CHIFFRES}|\d+)\s+(?:sources?|pages?)\s+sur\s+(${MOTS_CHIFFRES}|\d+)\b(?!\s+sites?\b)`,
  'gi',
)

/** Nombre de sources que le dossier porte réellement, ou null s'il est absent. */
const sourcesDuDossier = (recette) => {
  const declare = (recette.sources || []).find((source) => String(source).startsWith('dossier:'))
  if (!declare) return { nom: null, total: null }
  const nom = String(declare).slice('dossier:'.length)
  const chemin = join(DOSSIERS, `${nom}.json`)
  if (!existsSync(chemin)) return { nom, total: null }
  const dossier = JSON.parse(readFileSync(chemin, 'utf8'))
  return { nom, total: (dossier.sources || []).length }
}

export function remarquesSurArbitrage(recette, { total: sourcesReelles = null } = {}) {
  const arbitrage = String(recette.canonical_arbitration || '')
  const parts = Number(recette.servings)
  const remarques = []
  if (!arbitrage) return remarques

  if (Number.isFinite(parts) && parts > 0) {
    for (const trouve of arbitrage.matchAll(MEDIANE)) {
      const mediane = nombre(trouve[1])
      const annonce = nombre(trouve[3])
      if (mediane === null || annonce === null) continue
      if (UNITES_DE_COMPTAGE.test(trouve.groups.unite || '')) continue
      // Une médiane par personne est toujours plus petite que le total : quand
      // ce n'est pas le cas, la phrase ne dit pas « médiane par personne, soit
      // le total » mais autre chose, et le contrôle n'a rien à y voir.
      if (mediane >= annonce) continue
      const attendu = mediane * parts
      const ecart = Math.abs(annonce - attendu)
      if (ecart <= tolerance(attendu)) continue

      // Un arbitrage qui s'écarte de la médiane et le DIT n'est pas incohérent,
      // c'est une décision : « la médiane est 45. On descend à 40 g, soit 160 g »
      // montre son travail, et 40 × 4 fait bien 160. On ne signale donc que si
      // AUCUN des chiffres énoncés entre la médiane et le total ne l'explique.
      const intermediaires = [...trouve[0].matchAll(/(\d+(?:[.,]\d+)?)/g)]
        .map((chiffre) => nombre(chiffre[1]))
        .filter((valeur) => valeur !== null && valeur !== mediane && valeur < annonce)
      if (intermediaires.some((valeur) => Math.abs(annonce - valeur * parts) <= tolerance(valeur * parts))) continue
      remarques.push(
        `arithmétique : « médiane ${mediane} » × ${parts} parts fait ${Math.round(attendu)}, `
        + `mais la phrase annonce ${annonce} ${trouve[4]} — « ${trouve[0].trim()} »`,
      )
    }
  }

  if (sourcesReelles) {
    for (const trouve of arbitrage.matchAll(FRACTION)) {
      const denominateur = nombre(trouve[2])
      if (denominateur === null) continue
      // Un dénominateur PLUS PETIT que le dossier est licite : il compte souvent
      // un sous-ensemble, et la phrase le dit — « les trois sources qui portent
      // le poivron » puis « rouge dans deux sources sur trois ». C'est une
      // tournure juste, et la signaler faisait crier le contrôle sur du bon
      // travail. Seul un dénominateur SUPÉRIEUR au dossier est nécessairement
      // faux : on ne peut pas compter plus de sources qu'il n'en existe.
      if (denominateur <= sourcesReelles) continue
      remarques.push(
        `décompte : « ${trouve[0].trim()} » alors que le dossier ne porte que ${sourcesReelles} sources `
        + `— un dénominateur qui dépasse le dossier ne peut venir que du tableau de synthèse`,
      )
    }
  }

  return remarques
}

// ── Exécution ───────────────────────────────────────────────────────────────
const arguments_ = process.argv.slice(2)
if (arguments_.length) {
  const recettes = []
  if (arguments_.includes('--corpus')) {
    recettes.push(...JSON.parse(readFileSync(CORPUS, 'utf8')).recipes)
  }
  for (const fichier of arguments_.filter((argument) => !argument.startsWith('--'))) {
    recettes.push(...(JSON.parse(readFileSync(fichier, 'utf8')).recipes || []))
  }

  let signalees = 0
  let remarquesTotal = 0
  for (const recette of recettes) {
    const { nom, total } = sourcesDuDossier(recette)
    const remarques = remarquesSurArbitrage(recette, { total })
    if (!remarques.length) continue
    signalees += 1
    remarquesTotal += remarques.length
    console.log(`\n${recette.code}  ${recette.family}${nom ? `  [dossier:${nom}, ${total ?? '?'} sources]` : ''}`)
    for (const remarque of remarques) console.log(`  · ${remarque}`)
  }

  const avecArbitrage = recettes.filter((recette) => recette.canonical_arbitration).length
  console.log(
    `\n${recettes.length} recette(s) lues, ${avecArbitrage} avec arbitrage — `
    + `${signalees} signalée(s), ${remarquesTotal} remarque(s).`,
  )
  console.log('Ce contrôle signale et ne refuse pas : c\'est au relecteur de trancher, le dossier sous les yeux.')
}
