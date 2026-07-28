/**
 * Exporte le vocabulaire dans lequel les nouvelles recettes doivent être écrites.
 *
 * Le corpus vise 3 000 recettes. Il en compte 309, et déjà 719 formes
 * d'aliments distinctes — soit 2,3 formes inédites par recette. Écrire les
 * 2 700 recettes restantes de la même façon produirait plus de 6 000 formes,
 * dont il faudrait arbitrer chacune à la main. Le travail de résolution
 * croîtrait plus vite que le corpus, et ne finirait jamais.
 *
 * D'où ce fichier : la liste FERMÉE des formes déjà résolues, avec ce qu'il
 * faut pour les employer — unités admises, conversions connues, composition.
 * Une recette écrite dans ce vocabulaire est publiable le jour où elle est
 * écrite. Une recette qui a besoin d'autre chose n'est pas interdite, mais
 * elle passe par l'arbitrage, et elle attend.
 *
 * C'est aussi ce que la Bible demande : « un concept culinaire = un seul
 * ingrédient canonique ». Un vocabulaire fermé rend la règle applicable au lieu
 * de la laisser à l'appréciation de chaque rédacteur.
 *
 *   node scripts/data/recipes/export-authoring-vocabulary.mjs
 *   node scripts/data/recipes/export-authoring-vocabulary.mjs --check
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const CATALOG = join(ROOT, 'scripts', 'data', 'out', 'recipe-food-catalog.json')
const MANIFEST = join(ROOT, 'data', 'encyclopedia', 'manifest.json')
const INDEX = join(ROOT, 'data', 'encyclopedia', 'index.json')
const OUT = join(ROOT, 'data', 'recipes', 'authoring-vocabulary.json')

const checkOnly = process.argv.includes('--check')

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'))
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
const index = JSON.parse(readFileSync(INDEX, 'utf8'))

const MACROS = ['kcal', 'proteinG', 'carbsG', 'fatG']

/**
 * Une forme est employable si le matérialiseur ne la refusera pas :
 * confiance suffisante, macronutriments complets, et conversion connue pour
 * chacune des unités qu'on veut employer. Les trois conditions sont celles de
 * lib/domain/recipes/materializeRecipe.js — les répéter ici serait fragile,
 * alors on les lit dans le catalogue qu'il consomme.
 */
const unitesAdmises = (forme) => {
  const unites = ['g']
  if (Number.isFinite(forme.conversion?.density_g_per_ml)) unites.push('ml')
  // « tranche » et « feuille » sont des alias de « u » côté conversion.
  if (Number.isFinite(forme.conversion?.grams_per_unit)) unites.push('u', 'tranche', 'feuille')
  return unites
}

const usagesParForme = new Map()
for (const recette of corpus.recipes) {
  for (const ingredient of recette.ingredients || []) {
    const entree = usagesParForme.get(ingredient.form) || { recettes: 0, roles: new Set() }
    entree.recettes += 1
    if (ingredient.role) entree.roles.add(ingredient.role)
    usagesParForme.set(ingredient.form, entree)
  }
}

const employables = []
const bloquees = []
for (const forme of catalog.forms) {
  const usage = usagesParForme.get(forme.canonical_name) || { recettes: 0, roles: new Set() }
  const motifs = []
  if (forme.confidence === 'C' || forme.confidence === 'D') motifs.push(`confiance ${forme.confidence} — proxy assumé, non publiable`)
  if (!forme.per100g || !MACROS.every((cle) => Number.isFinite(forme.per100g[cle]))) motifs.push('macronutriments incomplets')

  const commun = {
    nom: forme.canonical_name,
    normalise: forme.canonical_name_normalized,
    categorie: forme.category || null,
    recettes_actuelles: usage.recettes,
    roles_observes: [...usage.roles].sort(),
  }
  if (motifs.length) { bloquees.push({ ...commun, motifs }); continue }
  employables.push({
    ...commun,
    unites: unitesAdmises(forme),
    conversion: forme.conversion || {},
    per100g: forme.per100g,
    source: forme.source,
    ...(forme.derived ? { valeur_derivee: forme.derived.field } : {}),
  })
}

employables.sort((gauche, droite) => droite.recettes_actuelles - gauche.recettes_actuelles
  || gauche.nom.localeCompare(droite.nom, 'fr'))
bloquees.sort((gauche, droite) => gauche.nom.localeCompare(droite.nom, 'fr'))

/** Techniques, arômes, profils et catégories déjà employés : le rédacteur doit
 * réutiliser avant d'inventer, sinon les graphes de diversité du planificateur
 * se remplissent de synonymes qui ne se rencontrent jamais. */
const compter = (valeurs) => {
  const compte = new Map()
  for (const valeur of valeurs) compte.set(valeur, (compte.get(valeur) || 0) + 1)
  return [...compte.entries()]
    .sort((gauche, droite) => droite[1] - gauche[1] || gauche[0].localeCompare(droite[0], 'fr'))
    .map(([nom, recettes]) => ({ nom, recettes }))
}

const techniques = compter(corpus.recipes.flatMap((recette) => recette.techniques || []))
const aromes = compter(corpus.recipes.flatMap((recette) => recette.sensory?.aroma_families || []))
const profils = compter(corpus.recipes.map((recette) => recette.sensory?.profile).filter(Boolean))
const categories = compter(corpus.recipes.map((recette) => recette.category).filter(Boolean))
const textures = compter(corpus.recipes.flatMap((recette) => recette.sensory?.target_textures || []))
const cuisines = compter(corpus.recipes.map((recette) => recette.cuisine_origin).filter(Boolean))

/** Ce qui reste à écrire, volume éditorial par volume éditorial. */
const parVolume = new Map()
for (const appartenance of index.recipe_memberships || []) {
  for (const volume of appartenance.volumes || []) {
    parVolume.set(volume, (parVolume.get(volume) || 0) + 1)
  }
}
const creneaux = manifest.volumes
  .filter((volume) => volume.target_metric?.mode === 'editorial_lens')
  .map((volume) => {
    const actuel = parVolume.get(volume.code) || 0
    return {
      volume: volume.code,
      titre: volume.title,
      mission: volume.mission,
      cible_appartenances: volume.target_metric.target,
      appartenances_actuelles: actuel,
      reste: Math.max(0, volume.target_metric.target - actuel),
    }
  })
  .sort((gauche, droite) => droite.reste - gauche.reste)

const cibleRecettes = manifest.volumes.find((volume) => volume.code === 'V10')?.target_metric?.target ?? null

const charge = {
  schema: 'myko://authoring-vocabulary/v1',
  genere_depuis: {
    corpus: 'data/recipes/corpus-v3.json',
    catalogue: 'scripts/data/out/recipe-food-catalog.json',
    manifeste: 'data/encyclopedia/manifest.json',
  },
  regle: "Une nouvelle recette n'emploie que des formes de `formes_employables`, avec une unité "
    + "listée dans `unites`. Toute autre forme rend la recette non publiable et l'envoie à "
    + "l'arbitrage. Réutiliser une technique, un arôme, un profil ou une catégorie existants "
    + "avant d'en créer un : les graphes de diversité du planificateur ne rapprochent pas deux "
    + 'synonymes.',
  etat: {
    recettes_actuelles: corpus.recipes.length,
    cible_recettes: cibleRecettes,
    reste_a_ecrire: cibleRecettes == null ? null : Math.max(0, cibleRecettes - corpus.recipes.length),
    formes_employables: employables.length,
    formes_bloquees: bloquees.length,
  },
  formes_employables: employables,
  formes_bloquees: bloquees,
  techniques,
  aromes,
  profils_sensoriels: profils,
  textures,
  categories,
  cuisines,
  creneaux_editoriaux: creneaux,
}

const texte = `${JSON.stringify(charge, null, 2)}\n`

if (checkOnly) {
  if (!existsSync(OUT)) {
    console.error('Vocabulaire de rédaction absent — lancez la génération.')
    process.exit(1)
  }
  if (readFileSync(OUT, 'utf8') !== texte) {
    console.error('Vocabulaire de rédaction périmé : le corpus ou le catalogue a changé depuis sa génération.')
    process.exit(1)
  }
  console.log(`Vocabulaire valide : ${employables.length} formes employables, ${bloquees.length} bloquées.`)
} else {
  writeFileSync(OUT, texte)
  console.log(`Vocabulaire de rédaction : ${employables.length} formes employables, ${bloquees.length} bloquées.`)
  console.log(`  recettes : ${corpus.recipes.length} / ${cibleRecettes ?? '?'}`)
  console.log(`  techniques ${techniques.length} · arômes ${aromes.length} · profils ${profils.length} · catégories ${categories.length}`)
}
