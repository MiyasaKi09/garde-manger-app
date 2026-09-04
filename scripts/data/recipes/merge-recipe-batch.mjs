/**
 * Verse un lot de recettes validées dans le corpus, et reconstruit ce qui en dépend.
 *
 * Le corpus ne porte pas que des recettes : il porte aussi trois graphes —
 * formes d'aliments, techniques, arômes — et un classement des formes par
 * fréquence. Le planificateur s'en sert pour la diversité. Ajouter des recettes
 * sans les reconstruire laisserait des graphes qui décrivent un corpus qui
 * n'existe plus.
 *
 * Le lot doit avoir passé validate-recipe-batch.mjs. Ce script le revérifie
 * quand même sur le point qui ne pardonne pas — l'unicité des codes et des
 * familles — parce qu'un doublon versé est bien plus coûteux à retirer qu'à
 * refuser.
 *
 *   node scripts/data/recipes/merge-recipe-batch.mjs lot.json
 *   node scripts/data/recipes/merge-recipe-batch.mjs lot.json --dry-run
 *   node scripts/data/recipes/merge-recipe-batch.mjs --retirer FR-007 --motif "…"
 *
 * `--retirer` fait la même opération en soustrayant : retirer une recette du
 * corpus demande de reconstruire les mêmes graphes qu'en ajouter une. Le premier
 * cas est apparu avec la reprise du corpus historique, qui met au jour des
 * doublons — « Ratatouille provençale » et « Ratatouille » sont le même plat, et
 * le moteur de diversité en comptait deux.
 *
 * Un retrait ne supprime RIEN en base. Il sort la recette du corpus, donc des
 * prochains chargements et du catalogue, et inscrit le retrait à un registre que
 * la migration lira pour marquer la ligne. Les repas déjà planifiés qui la
 * référencent gardent leur instantané d'exécution — ingrédients, étapes et
 * nutrition figés au moment de la planification — et restent donc lisibles.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '../lib/normalize.mjs'
import { applyConservationProfiles, loadManualDecisions } from './derive-conservation-profiles.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const REGISTRE_RETRAITS = join(ROOT, 'data', 'recipes', 'retraits.json')

const arguments_ = process.argv.slice(2)
const valeurDe = (nom) => {
  const position = arguments_.indexOf(nom)
  return position >= 0 ? arguments_[position + 1] : null
}
// `--corpus` désigne une COPIE de travail du corpus : c'est ce qui permet de
// vérifier un versement (profils de conservation compris) sans toucher au
// corpus du dépôt. Sans l'option, le corpus versionné.
const CORPUS = valeurDe('--corpus') || join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const aRetirer = valeurDe('--retirer')
const motifDuRetrait = valeurDe('--motif')
const valeursDOptions = new Set(['--retirer', '--motif', '--corpus'].map(valeurDe).filter(Boolean))
const source = aRetirer ? null : arguments_.find((argument) => !argument.startsWith('--') && !valeursDOptions.has(argument)) || null
if (!source && !aRetirer) {
  console.error('Usage : merge-recipe-batch.mjs <lot.json> [--dry-run] [--corpus <copie.json>]')
  console.error('        merge-recipe-batch.mjs --retirer <CODE> --motif "<pourquoi>"')
  process.exit(2)
}
const simulation = arguments_.includes('--dry-run')

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const lot = source ? JSON.parse(readFileSync(source, 'utf8')) : { recipes: [] }
const nouvelles = Array.isArray(lot) ? lot : (lot.recipes || lot.recettes || [])

const parCode = new Map(corpus.recipes.map((recette) => [recette.code, recette]))
const parFamille = new Map(corpus.recipes.map((recette) => [normalizeName(recette.family), recette]))
const codes = new Set(parCode.keys())
const familles = new Set(parFamille.keys())

/**
 * Une recette du lot peut REMPLACER une recette du corpus, en déclarant laquelle.
 *
 * C'est ce que demande la reprise du corpus historique : réécrire une recette
 * maigre depuis un dossier de sources ne l'ajoute pas, cela la remplace. Garder
 * son CODE compte — le planning et l'historique des repas s'y réfèrent, et lui
 * en donner un neuf orphelinerait ce qui a déjà été cuisiné.
 *
 * Le remplacement doit se dire, et se dire juste : la recette remplacée doit
 * exister, et le code annoncé doit être celui qu'on écrit. Un remplacement qui
 * se trompe de cible est un remplacement qui n'a pas regardé — la même règle que
 * pour les arbitrages d'ingrédients.
 */
const remplacements = new Map()
const collisions = []
for (const recette of nouvelles) {
  const remplace = String(recette.remplace || '').trim()
  if (remplace) {
    const cible = parCode.get(remplace)
    if (!cible) { collisions.push(`${recette.code} annonce remplacer ${remplace}, absent du corpus`); continue }
    if (remplace !== recette.code) {
      collisions.push(`${recette.code} annonce remplacer ${remplace} : une reprise garde le code de la recette qu'elle remplace, sans quoi le planning perd sa référence`)
      continue
    }
    const familleCible = normalizeName(cible.family)
    const familleNeuve = normalizeName(recette.family)
    // Renommer est permis — « Soupe à l'oignon » peut devenir « Soupe à l'oignon
    // gratinée » — mais pas vers un nom qu'une AUTRE recette porte déjà.
    const occupant = parFamille.get(familleNeuve)
    if (occupant && occupant.code !== recette.code) {
      collisions.push(`${recette.code} prend le nom « ${recette.family} », déjà porté par ${occupant.code}`)
      continue
    }
    remplacements.set(recette.code, { avant: cible, apres: recette, renomme: familleCible !== familleNeuve })
    continue
  }
  if (codes.has(recette.code)) collisions.push(`code déjà pris : ${recette.code} — ajouter « remplace » pour assumer une reprise`)
  if (familles.has(normalizeName(recette.family))) collisions.push(`famille déjà présente : ${recette.family}`)
  codes.add(recette.code)
  familles.add(normalizeName(recette.family))
}
if (collisions.length) {
  console.error('Fusion refusée :')
  for (const collision of collisions) console.error(`  - ${collision}`)
  process.exit(1)
}

// ── Retrait d'une recette ───────────────────────────────────────────────────
// Un retrait se refuse dans trois cas, et chacun protège d'un corpus incohérent
// plutôt que d'un caprice.
const retraits = []
if (aRetirer) {
  const cible = parCode.get(aRetirer)
  if (!cible) {
    console.error(`Retrait refusé : ${aRetirer} n'est pas au corpus.`)
    process.exit(1)
  }
  if (!String(motifDuRetrait || '').trim()) {
    console.error('Retrait refusé : un retrait sans motif ne se relit pas. Ajoutez --motif.')
    process.exit(1)
  }
  const derivees = corpus.recipes.filter((recette) => recette.derived_from === aRetirer)
  if (derivees.length) {
    console.error(`Retrait refusé : ${derivees.length} variante(s) dérivent de ${aRetirer} — ${derivees.map((r) => r.code).join(', ')}.`)
    console.error('Retirer leur base les laisserait orphelines. Retirez-les d\'abord, ou renoncez.')
    process.exit(1)
  }
  // Le corpus ne modélise pas encore les sous-recettes par code, mais une
  // recette citée comme composant d'une autre le serait par son nom de famille.
  const citee = corpus.recipes.filter((recette) => recette.code !== aRetirer
    && (recette.ingredients || []).some((ingredient) => normalizeName(ingredient.form) === normalizeName(cible.family)))
  if (citee.length) {
    console.error(`Retrait refusé : ${citee.map((r) => r.code).join(', ')} emploient « ${cible.family} » comme ingrédient.`)
    process.exit(1)
  }
  retraits.push({ code: aRetirer, family: cible.family, motif: String(motifDuRetrait).trim() })
}

const ajouts = nouvelles.filter((recette) => !remplacements.has(recette.code))
const recettesFusionnees = [
  ...corpus.recipes.filter((recette) => recette.code !== aRetirer).map((recette) => {
    const reprise = remplacements.get(recette.code)
    if (!reprise || reprise.avant !== recette) return recette
    // Le champ `remplace` est une consigne de fusion, pas une donnée de recette :
    // il ne doit pas entrer au corpus.
    const { remplace, ...propre } = reprise.apres
    return propre
  }),
  ...ajouts,
]

// Le profil de conservation STRUCTURÉ (conservation_profile) est dérivé de la
// prose et des arbitrages manuels par derive-conservation-profiles.mjs. Il est
// recalculé ici pour TOUTES les recettes — celles du lot n'en ont pas encore,
// et une reprise peut avoir changé la prose d'une recette existante. Le moteur
// ne lit que ce profil : une recette versée sans lui ne serait jamais
// produite d'avance, sans qu'aucun message le dise.
let recettes
try {
  recettes = applyConservationProfiles(recettesFusionnees, loadManualDecisions())
} catch (erreur) {
  // Typiquement : une reprise a changé la prose d'une recette qu'un arbitrage
  // manuel avait tranchée sur l'ancien texte. On refuse plutôt que d'appliquer
  // un verdict pris sur un texte qui n'existe plus.
  console.error(`Fusion refusée : ${erreur.message}`)
  process.exit(1)
}
const versees = new Set([...ajouts, ...remplacements.values()].map((entree) => (entree.apres || entree).code))
const sansProfil = recettes.filter((recette) => versees.has(recette.code) && !recette.conservation_profile)

if (remplacements.size) {
  console.log(`${remplacements.size} recette(s) reprise(s) :`)
  for (const [code, { avant, apres, renomme }] of remplacements) {
    const etapes = `${(avant.steps || []).length} → ${(apres.steps || []).length} étapes`
    const ingredients = `${(avant.ingredients || []).length} → ${(apres.ingredients || []).length} ingrédients`
    console.log(`  ${code}  ${renomme ? `« ${avant.family} » → « ${apres.family} »` : avant.family}  (${etapes}, ${ingredients})`)
  }
}

/** Reconstruit un graphe « valeur → recettes qui l'emploient », trié par fréquence. */
const construireGraphe = (extraire, cleValeur) => {
  const parValeur = new Map()
  for (const recette of recettes) {
    for (const valeur of new Set(extraire(recette))) {
      if (!valeur) continue
      if (!parValeur.has(valeur)) parValeur.set(valeur, [])
      parValeur.get(valeur).push(recette.code)
    }
  }
  return [...parValeur.entries()]
    .map(([valeur, listeRecettes]) => ({ [cleValeur]: valeur, recipe_count: listeRecettes.length, recipes: listeRecettes }))
    .sort((gauche, droite) => droite.recipe_count - gauche.recipe_count
      || String(gauche[cleValeur]).localeCompare(String(droite[cleValeur]), 'fr'))
}

const grapheFormes = (() => {
  const parNormalise = new Map()
  for (const recette of recettes) {
    for (const ingredient of recette.ingredients || []) {
      const normalise = normalizeName(ingredient.form)
      if (!normalise) continue
      if (!parNormalise.has(normalise)) parNormalise.set(normalise, { name: ingredient.form, normalized: normalise, recipes: [] })
      const entree = parNormalise.get(normalise)
      if (!entree.recipes.includes(recette.code)) entree.recipes.push(recette.code)
    }
  }
  return [...parNormalise.values()]
    .map((entree) => ({ name: entree.name, normalized: entree.normalized, recipe_count: entree.recipes.length, recipes: entree.recipes }))
    .sort((gauche, droite) => droite.recipe_count - gauche.recipe_count
      || gauche.name.localeCompare(droite.name, 'fr'))
})()

const fusionne = {
  ...corpus,
  recipes: recettes,
  food_form_graph: grapheFormes,
  technique_graph: construireGraphe((recette) => recette.techniques || [], 'technique'),
  aroma_graph: construireGraphe((recette) => recette.sensory?.aroma_families || [], 'aroma'),
  forms_order: grapheFormes.map((forme, rang) => ({ rank: rang + 1, name: forme.name, recipe_count: forme.recipe_count })),
}

if (retraits.length) {
  for (const retrait of retraits) {
    console.log(`Retrait : ${retrait.code} « ${retrait.family} »`)
    console.log(`  motif : ${retrait.motif}`)
  }
}
console.log(`Recettes : ${corpus.recipes.length} → ${recettes.length} (${ajouts.length} ajout·s, ${remplacements.size} reprise·s, ${retraits.length} retrait·s)`)
console.log(`  profils de conservation : ${recettes.filter((recette) => recette.conservation_profile).length} / ${recettes.length}`)
if (sansProfil.length) {
  // Pas un refus : la recette est versée, mais elle ne sera jamais produite
  // d'avance tant que sa prose ne dit rien de lisible ou qu'aucun arbitrage
  // manuel ne la tranche. Le dire ici évite de le découvrir dans un planning.
  console.log(`\n⚠ ${sansProfil.length} recette(s) versée(s) sans profil de conservation lisible — à arbitrer dans data/recipes/arbitrations/conservation-manuelle.json :`)
  for (const recette of sansProfil) console.log(`    ${recette.code}  « ${recette.conservation || '(pas de prose)'} »`)
}
console.log(`  formes d'aliments : ${corpus.food_form_graph.length} → ${fusionne.food_form_graph.length}`)
console.log(`  techniques        : ${corpus.technique_graph.length} → ${fusionne.technique_graph.length}`)
console.log(`  arômes            : ${corpus.aroma_graph.length} → ${fusionne.aroma_graph.length}`)

// Une forme inédite est le signal qui compte : elle veut dire que le lot est
// sorti du vocabulaire fermé, et qu'il faudra arbitrer avant de publier.
const formesAvant = new Set(corpus.food_form_graph.map((forme) => forme.normalized))
const inedites = fusionne.food_form_graph.filter((forme) => !formesAvant.has(forme.normalized))
if (inedites.length) {
  console.log(`\n⚠ ${inedites.length} forme(s) inédite(s) — hors vocabulaire fermé, à arbitrer :`)
  for (const forme of inedites) console.log(`    ${forme.name} (${forme.recipe_count} recette·s)`)
}

if (simulation) {
  console.log('\nSimulation : rien écrit.')
} else {
  writeFileSync(CORPUS, `${JSON.stringify(fusionne, null, 2)}\n`)
  // Le registre des retraits survit au corpus : celui-ci ne garde que ce qui
  // existe, or la base garde la ligne et il faut pouvoir la marquer. Sans ce
  // registre, un retrait se ferait dans le corpus et nulle part ailleurs — la
  // recette continuerait d'être offerte par le catalogue.
  if (retraits.length) {
    const registre = existsSync(REGISTRE_RETRAITS)
      ? JSON.parse(readFileSync(REGISTRE_RETRAITS, 'utf8'))
      : { retraits: [] }
    for (const retrait of retraits) {
      const deja = registre.retraits.findIndex((entree) => entree.code === retrait.code)
      if (deja >= 0) registre.retraits[deja] = retrait
      else registre.retraits.push(retrait)
    }
    registre.retraits.sort((gauche, droite) => gauche.code.localeCompare(droite.code))
    writeFileSync(REGISTRE_RETRAITS, `${JSON.stringify(registre, null, 2)}\n`)
    console.log(`Registre des retraits : ${registre.retraits.length} entrée(s).`)
  }
  console.log('\nCorpus écrit. Enchaînez :')
  console.log('  node scripts/data/foods/build-recipe-food-corpus.mjs')
  console.log('  node scripts/data/recipes/export-authoring-vocabulary.mjs')
  console.log('  npm run encyclopedia:build')
}
