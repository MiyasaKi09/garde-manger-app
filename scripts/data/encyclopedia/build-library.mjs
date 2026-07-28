/**
 * Construit la bibliothèque documentaire de l'Encyclopédie Myko.
 *
 * Les volumes sont des vues éditoriales : une recette peut apparaître dans
 * plusieurs livres, mais son code canonique n'est jamais dupliqué.
 *
 * Usage :
 *   node scripts/data/encyclopedia/build-library.mjs
 *   node scripts/data/encyclopedia/build-library.mjs --check
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { edition, volumes } from '../../../data/encyclopedia/catalog.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const DATA_DIR = join(ROOT, 'data', 'encyclopedia')
const BOOK_DATA_DIR = join(DATA_DIR, 'books')
const DOCS_DIR = join(ROOT, 'docs', 'encyclopedia')
const VOLUMES_DIR = join(DOCS_DIR, 'volumes')
const BOOK_DOCS_DIR = join(DOCS_DIR, 'books')
const CHECK_MODE = process.argv.includes('--check')

const recipeCorpus = JSON.parse(
  readFileSync(join(ROOT, 'data', 'recipes', 'corpus-v3.json'), 'utf8'),
)
const foodCorpus = JSON.parse(
  readFileSync(join(ROOT, 'data', 'foods', 'f0-corpus.json'), 'utf8'),
)
const ciqualReferenceManifest = JSON.parse(
  readFileSync(join(ROOT, 'data', 'foods', 'ciqual-reference', 'manifest.json'), 'utf8'),
)

const catalogBooks = volumes.flatMap((entry) => entry.books)
const catalogBookByCode = new Map(catalogBooks.map((entry) => [entry.code, entry]))
const bookContents = new Map(
  catalogBooks
    .filter((entry) => entry.content_path)
    .map((entry) => {
      const sourcePath = join(ROOT, entry.content_path)
      if (!existsSync(sourcePath)) {
        throw new Error(`${entry.code} annonce un contenu absent : ${entry.content_path}`)
      }
      return [entry.code, JSON.parse(readFileSync(sourcePath, 'utf8'))]
    }),
)

const normalize = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[œ]/g, 'oe')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const includesAny = (text, patterns) => patterns.some((pattern) => pattern.test(text))

const recipeText = (recipe) => normalize([
  recipe.family,
  recipe.cuisine_origin,
  recipe.category,
  ...(recipe.techniques || []),
  ...(recipe.variants || []),
  ...(recipe.ingredients || []).flatMap((ingredient) => [ingredient.form, ingredient.role]),
  ...(recipe.sensory?.signature_ingredients || []),
  ...(recipe.sensory?.target_textures || []),
].filter(Boolean).join(' '))

const animalMeatPatterns = [
  /\bboeuf\b/, /\bveau\b/, /\bagneau\b/, /\bmouton\b/, /\bporc\b/,
  /\bjambon\b/, /\blardon\b/, /\bpoulet\b/, /\bdinde\b/, /\bcanard\b/,
  /\blapin\b/, /\bpoisson\b/, /\bsaumon\b/, /\bthon\b/, /\bcabillaud\b/,
  /\bmorue\b/, /\bcrevette\b/, /\bmoule\b/, /\bhuitre\b/, /\bpoulpe\b/,
  /\bcalamar\b/, /\banchois\b/, /\bsardine\b/, /\bcrabe\b/, /\bhomard\b/,
]

const animalProductPatterns = [
  ...animalMeatPatterns,
  /\boeuf\b/, /\boeufs\b/, /\blait\b/, /\bbeurre\b/, /\bcreme\b/,
  /\bfromage\b/, /\byaourt\b/, /\bmiel\b/, /\bgelatine\b/,
]

const lensRules = [
  ['V11', (recipe, text) => includesAny(text, [/\bsalade\b/, /\bcrudite\b/, /\btaboule\b/, /\bcarpaccio\b/])],
  ['V12', (recipe, text) => includesAny(text, [/\bsoupe\b/, /\bveloute\b/, /\bbouillon\b/, /\bpotage\b/, /\bpho\b/, /\bramen\b/])],
  ['V13', (recipe, text) => includesAny(text, [/\bboeuf\b/, /\bveau\b/, /\bagneau\b/, /\bmouton\b/])],
  ['V14', (recipe, text) => includesAny(text, [/\bporc\b/, /\bjambon\b/, /\blardon\b/, /\bchorizo\b/, /\bsaucisse\b/])],
  ['V15', (recipe, text) => includesAny(text, [/\bpoulet\b/, /\bdinde\b/, /\bcanard\b/, /\blapin\b/, /\bvolaille\b/])],
  ['V16', (recipe, text) => includesAny(text, [/\bpoisson\b/, /\bsaumon\b/, /\bthon\b/, /\bcabillaud\b/, /\bmorue\b/, /\bsardine\b/, /\banchois\b/])],
  ['V17', (recipe, text) => includesAny(text, [/\bfruit de mer\b/, /\bcrevette\b/, /\bmoule\b/, /\bhuitre\b/, /\bpoulpe\b/, /\bcalamar\b/, /\bcrabe\b/, /\bhomard\b/])],
  ['V18', (recipe, text) => includesAny(text, [/\bitalie\b/, /\bitalien\b/, /\bsicile\b/, /\btoscane\b/, /\bnaples\b/, /\bromain\b/])],
  ['V19', (recipe, text) => includesAny(text, [/\bespagne\b/, /\bespagnol\b/, /\bportugal\b/, /\bportugais\b/, /\bbasque\b/, /\bcatalan\b/])],
  ['V20', (recipe, text) => includesAny(text, [/\bgrece\b/, /\bgrec\b/, /\blevant\b/, /\bliban\b/, /\blibanais\b/, /\bsyrie\b/, /\bturquie\b/, /\bturc\b/, /\bpalestin\b/, /\bchypre\b/])],
  ['V21', (recipe, text) => includesAny(text, [/\bmaghreb\b/, /\bmaroc\b/, /\bmarocain\b/, /\balgerie\b/, /\balgerien\b/, /\btunisie\b/, /\btunisien\b/])],
  ['V22', (recipe, text) => includesAny(text, [/\binde\b/, /\bindien\b/, /\bpakistan\b/, /\bsri lanka\b/, /\bnepal\b/, /\bbangladesh\b/])],
  ['V23', (recipe, text) => includesAny(text, [/\bchine\b/, /\bchinois\b/, /\bjapon\b/, /\bjaponais\b/, /\bcoree\b/, /\bcoreen\b/, /\bthailande\b/, /\bthai\b/, /\bvietnam\b/, /\bvietnamien\b/, /\bindonesie\b/, /\bmalaisie\b/, /\bsingapour\b/, /\bphilippin\b/])],
  ['V24', (recipe, text) => includesAny(text, [/\bmexique\b/, /\bmexicain\b/, /\bargentine\b/, /\bperou\b/, /\bperuvien\b/, /\bbresil\b/, /\bbresilien\b/, /\bcolombie\b/, /\bcubain\b/, /\blatino\b/])],
  ['V25', (recipe, text) => !includesAny(text, animalMeatPatterns)],
  ['V26', (recipe, text) => includesAny(text, [/\bsandwich\b/, /\btartine\b/, /\bwrap\b/, /\bburger\b/, /\btoast\b/, /\bbruschetta\b/])],
  ['V27', (recipe, text) => includesAny(text, [/\bpizza\b/, /\bquiche\b/, /\btarte salee\b/, /\bflammekueche\b/, /\bfocaccia\b/])],
  ['V28', (recipe, text) => includesAny(text, [/\bpate\b/, /\bspaghetti\b/, /\btagliatelle\b/, /\bravioli\b/, /\bgnocchi\b/, /\bnouille\b/, /\budon\b/, /\bsoba\b/])],
  ['V29', (recipe, text) => includesAny(text, [/\briz\b/, /\brisotto\b/, /\bpaella\b/, /\bcouscous\b/, /\bsemoule\b/, /\bquinoa\b/, /\bboulgour\b/, /\bpolenta\b/, /\bcereale\b/])],
  ['V30', (recipe, text) => isDessert(recipe, text) && includesAny(text, [/\bfrance\b/, /\bfrancais\b/, /\bbretagne\b/, /\bnormandie\b/, /\balsace\b/])],
  ['V31', (recipe, text) => isDessert(recipe, text) && !includesAny(text, [/\bfrance\b/, /\bfrancais\b/, /\bbretagne\b/, /\bnormandie\b/, /\balsace\b/])],
  ['V32', (recipe, text) => includesAny(text, [/\boeuf\b/, /\boeufs\b/, /\bomelette\b/, /\bfrittata\b/, /\bbrunch\b/, /\bshakshuka\b/])],
  ['V33', (recipe, text) => includesAny(text, [/\bmijote\b/, /\bbraise\b/, /\bragout\b/, /\bstew\b/, /\bcurry\b/, /\bdaube\b/, /\btajine\b/])],
  ['V34', (recipe, text) => includesAny(text, [/\bgrillade\b/, /\bgrille\b/, /\broti\b/, /\brotissage\b/, /\bcuisson au four\b/, /\bbrochette\b/])],
  ['V35', (recipe) => Number(recipe.prep_minutes || 0) + Number(recipe.cook_minutes || 0) <= 75 && normalize(recipe.difficulty) !== 'difficile'],
  ['V36', (recipe, text) => !includesAny(text, animalProductPatterns)],
  ['V37', (recipe, text) => includesAny(text, [/\bferment\b/, /\bkimchi\b/, /\bchoucroute\b/, /\bconserve\b/, /\bpickle\b/, /\bsaumur\b/, /\blevain\b/])],
  ['V38', (recipe, text) => includesAny(text, [/\breste\b/, /\banti gaspillage\b/, /\bpain rassis\b/, /\bparure\b/, /\bfane\b/, /\bepluchure\b/, /\bcroquette\b/])],
  ['V39', (recipe) => Number(recipe.cook_minutes || 0) >= 120 || Number(recipe.servings || 0) >= 8 || normalize(recipe.difficulty) === 'difficile'],
  ['V40', (recipe, text) => !isDessert(recipe, text) && includesAny(text, [/\bplat\b/, /\bassiette\b/, /\baccompagnement\b/, /\bgarniture\b/, /\bmeal\b/, /\bentree\b/])],
]

function isDessert(recipe, text = recipeText(recipe)) {
  return includesAny(text, [
    /\bdessert\b/, /\bgateau\b/, /\btarte sucree\b/, /\bbiscuit\b/,
    /\bcreme dessert\b/, /\bflan\b/, /\bglace\b/, /\bsorbet\b/,
    /\bentremets\b/, /\bviennoiserie\b/, /\bpatisserie\b/,
  ])
}

const primaryPriority = [
  'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17',
  'V26', 'V27', 'V28', 'V29', 'V32', 'V33', 'V34',
  'V18', 'V19', 'V20', 'V21', 'V22', 'V23', 'V24',
  'V25', 'V35', 'V36', 'V37', 'V38', 'V39', 'V40',
]

const buildRecipeMemberships = () => recipeCorpus.recipes
  .map((recipe) => {
    const text = recipeText(recipe)
    const matches = lensRules
      .filter(([, predicate]) => predicate(recipe, text))
      .map(([code]) => code)

    if (isDessert(recipe, text)) {
      const dessertCode = matches.includes('V30') ? 'V30' : 'V31'
      if (!matches.includes(dessertCode)) matches.push(dessertCode)
    }

    if (!matches.length) matches.push('V40')
    const primaryVolume = isDessert(recipe, text)
      ? (matches.includes('V30') ? 'V30' : 'V31')
      : primaryPriority.find((code) => matches.includes(code)) || 'V40'

    return {
      recipe_code: recipe.code,
      title: recipe.family,
      cuisine_origin: recipe.cuisine_origin,
      category: recipe.category,
      primary_volume: primaryVolume,
      volumes: [...new Set([primaryVolume, ...matches])].sort(),
    }
  })
  .sort((left, right) => left.recipe_code.localeCompare(right.recipe_code, 'fr'))

const techniqueBookCode = (technique) => {
  const text = normalize(technique)
  if (includesAny(text, [/\bdecoup/, /\bemin/, /\btranch/, /\btaill/, /\bcisel/, /\bhach/, /\bparer\b/, /\bdesoss/])) return 'V02-A'
  if (includesAny(text, [/\bmelang/, /\bpetr/, /\bfouett/, /\bbroy/, /\bmix/, /\btamis/, /\bfaconn/, /\becras/])) return 'V02-B'
  if (includesAny(text, [/\bsais/, /\bpoel/, /\brot/, /\bgrill/, /\bfour\b/, /\bfrit/, /\btorref/, /\bflamb/])) return 'V02-C'
  if (includesAny(text, [/\bpoch/, /\bvapeur\b/, /\bbouill/, /\bfrem/, /\bbain marie\b/, /\bblanch/])) return 'V02-D'
  if (includesAny(text, [/\bbrais/, /\bmijot/, /\betuv/, /\bdegl/, /\breduct/, /\bragout\b/, /\bcompot/])) return 'V02-E'
  if (includesAny(text, [/\bpatis/, /\blev/, /\bfeuillet/, /\bpate\b/, /\bbiscuit/, /\bganache\b/, /\bappareil\b/])) return 'V02-F'
  if (includesAny(text, [/\bsauce\b/, /\bliai/, /\bemuls/, /\broux\b/, /\bmonter au beurre\b/, /\bnapper\b/])) return 'V02-G'
  if (includesAny(text, [/\brefroid/, /\bcongel/, /\bsech/, /\bfum/, /\bconserv/, /\bpasteur/])) return 'V02-H'
  if (includesAny(text, [/\bferment/, /\blevain\b/, /\bsous vide\b/, /\bsaumur/])) return 'V02-I'
  return 'V02-J'
}

const buildTechniques = () => {
  const usage = new Map()
  for (const recipe of recipeCorpus.recipes) {
    for (const technique of recipe.techniques || []) {
      const key = normalize(technique)
      if (!key) continue
      const current = usage.get(key) || { name: technique, recipe_codes: [] }
      current.recipe_codes.push(recipe.code)
      usage.set(key, current)
    }
  }

  return [...usage.entries()]
    .sort(([left], [right]) => left.localeCompare(right, 'fr'))
    .map(([normalizedName, item], index) => ({
      code: `TECH-${String(index + 1).padStart(4, '0')}`,
      name: item.name,
      normalized_name: normalizedName,
      book_code: techniqueBookCode(item.name),
      recipe_count: item.recipe_codes.length,
      recipe_codes: [...new Set(item.recipe_codes)].sort(),
    }))
}

const countFoodForms = () => foodCorpus.concepts
  .reduce((count, concept) => count + (concept.forms || []).length, 0)

const countRecipeRole = (recipes, patterns) => recipes
  .filter((recipe) => includesAny(recipeText(recipe), patterns))
  .length

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key)

const isDraftFoodConcept = (concept) => Boolean(
  concept?.canonical_name
  && concept?.category
  && concept?.identity_confidence
  && concept?.status
  && concept?.provenance
  && Array.isArray(concept?.synonyms)
  && Array.isArray(concept?.varieties)
  && Array.isArray(concept?.allergens)
  && Array.isArray(concept?.compatibilities)
  && Array.isArray(concept?.substitutions)
  && concept?.sensory_profile
  && hasOwn(concept, 'seasonality')
  && Array.isArray(concept?.forms)
  && concept.forms.length
  && concept.forms.every((form) => (
    form?.canonical_name
    && form?.default_quantity_unit
    && form?.nutrition
    && Array.isArray(form?.storage)
    && Array.isArray(form?.conversions)
  )),
)

const isValidatedFoodConcept = (concept) => (
  ['validated', 'published'].includes(normalize(concept?.status))
  && isDraftFoodConcept(concept)
)

const isDraftRecipe = (recipe) => Boolean(
  recipe?.code
  && recipe?.family
  && recipe?.cuisine_origin
  && recipe?.category
  && recipe?.meal_role
  && Number(recipe?.servings) > 0
  && Array.isArray(recipe?.sources)
  && recipe.sources.length
  && Array.isArray(recipe?.ingredients)
  && recipe.ingredients.length
  && recipe.ingredients.every((ingredient) => (
    ingredient?.form
    && Number.isFinite(Number(ingredient?.quantity))
    && Number(ingredient.quantity) > 0
    && ingredient?.unit
  ))
  && Array.isArray(recipe?.steps)
  && recipe.steps.length
  && recipe.steps.every((step) => step?.instruction)
  && recipe?.sensory?.profile
  && recipe?.nutrition
  && recipe?.batch
  && recipe?.freezing
  && recipe?.reheating
  && Array.isArray(recipe?.accompaniments)
  && Array.isArray(recipe?.variants)
  && Array.isArray(recipe?.substitutions)
  && recipe?.planning_score
)

const isValidatedRecipe = (recipe) => (
  ['validated', 'published'].includes(normalize(recipe?.status))
  && isDraftRecipe(recipe)
)

const isDraftBookContent = (content) => Boolean(
  content?.validation?.authoring_complete
  && ['draft', 'reviewed', 'validated'].includes(normalize(content?.status)),
)

const isValidatedBookContent = (content) => Boolean(
  normalize(content?.status) === 'validated'
  && content?.validation?.machine_review_status === 'approved'
  && content?.validation?.human_review_status === 'approved'
  && Array.isArray(content?.validation?.publication_blockers)
  && content.validation.publication_blockers.length === 0
)

const completionStatus = ({ inventory, drafted, validated, target }) => {
  if (target && validated >= target) return 'validated'
  if (validated > 0) return 'validation'
  if (drafted > 0) return 'draft'
  if (inventory > 0) return 'inventory'
  return 'structure'
}

const validateDoctrineBook = (entryBook, content, errors) => {
  if (content?.book_code !== entryBook.code) {
    errors.push(`${entryBook.code} référence un contenu portant le code ${content?.book_code || 'absent'}.`)
  }
  if (content?.title !== entryBook.title) {
    errors.push(`${entryBook.code} possède un titre de contenu incohérent.`)
  }
  if (normalize(content?.status) !== normalize(entryBook.content_status)) {
    errors.push(`${entryBook.code} possède des statuts différents dans le catalogue et le contenu.`)
  }
  if (!/^\d+\.\d+\.\d+$/.test(content?.version || '')) {
    errors.push(`${entryBook.code} doit posséder une version sémantique explicite.`)
  }
  if (!content?.objective || !content?.promise) {
    errors.push(`${entryBook.code} doit définir son objectif et sa promesse.`)
  }
  if (!Array.isArray(content?.scope?.includes) || !content.scope.includes.length
    || !Array.isArray(content?.scope?.excludes) || !content.scope.excludes.length) {
    errors.push(`${entryBook.code} doit délimiter ce qu’il couvre et ce qu’il exclut.`)
  }
  if (!Array.isArray(content?.definitions) || !content.definitions.length) {
    errors.push(`${entryBook.code} doit définir son vocabulaire normatif.`)
  }
  if (!Array.isArray(content?.sources) || !content.sources.length) {
    errors.push(`${entryBook.code} doit citer au moins une source.`)
  }
  if (!Array.isArray(content?.rules) || !content.rules.length) {
    errors.push(`${entryBook.code} doit contenir au moins une règle rédigée.`)
  }

  const definitionCodes = new Set()
  for (const definition of content?.definitions || []) {
    if (!definition?.code || !definition?.term || !definition?.definition) {
      errors.push(`${entryBook.code} contient une définition incomplète.`)
    }
    if (definitionCodes.has(definition?.code)) {
      errors.push(`${entryBook.code} duplique la définition ${definition.code}.`)
    }
    definitionCodes.add(definition?.code)
  }

  const sourceCodes = new Set()
  for (const source of content?.sources || []) {
    if (!source?.code || !source?.title || !source?.version || !source?.path
      || !Array.isArray(source?.locators) || !source.locators.length) {
      errors.push(`${entryBook.code} contient une source incomplète.`)
    }
    if (sourceCodes.has(source?.code)) {
      errors.push(`${entryBook.code} duplique la source ${source.code}.`)
    }
    sourceCodes.add(source?.code)
    if (source?.path && !existsSync(join(ROOT, source.path))) {
      errors.push(`${entryBook.code} cite une source absente : ${source.path}.`)
    }
  }

  const ruleCodes = new Set()
  const testCodes = new Set()
  for (const rule of content?.rules || []) {
    if (!rule?.code || !rule?.title || !rule?.rule || !rule?.justification) {
      errors.push(`${entryBook.code} contient une règle incomplète.`)
    }
    if (ruleCodes.has(rule?.code)) {
      errors.push(`${entryBook.code} duplique la règle ${rule.code}.`)
    }
    ruleCodes.add(rule?.code)

    for (const field of ['consequences', 'improves', 'examples', 'counterexamples', 'exceptions', 'tests']) {
      if (!Array.isArray(rule?.[field]) || !rule[field].length) {
        errors.push(`${rule?.code || entryBook.code} doit renseigner ${field}.`)
      }
    }
    for (const example of rule?.examples || []) {
      if (!example?.case || !example?.situation || !example?.decision || !example?.result) {
        errors.push(`${rule.code} contient un exemple incomplet.`)
      }
    }
    for (const counterexample of rule?.counterexamples || []) {
      if (!counterexample?.case || !counterexample?.rejected || !counterexample?.reason) {
        errors.push(`${rule.code} contient un contre-exemple incomplet.`)
      }
    }
    for (const exception of rule?.exceptions || []) {
      if (!exception?.case || !exception?.handling || !exception?.limits) {
        errors.push(`${rule.code} contient une exception incomplète.`)
      }
    }
    for (const test of rule?.tests || []) {
      if (!test?.code || !test?.given || !test?.when || !test?.then || !test?.severity
        || typeof test?.automatable !== 'boolean') {
        errors.push(`${rule.code} contient un test d’acceptation incomplet.`)
      }
      if (testCodes.has(test?.code)) {
        errors.push(`${entryBook.code} duplique le test ${test.code}.`)
      }
      testCodes.add(test?.code)
    }
  }

  if (!Array.isArray(content?.global_exceptions) || !content.global_exceptions.length) {
    errors.push(`${entryBook.code} doit documenter ses exceptions globales.`)
  }
  if (!Array.isArray(content?.global_tests) || !content.global_tests.length) {
    errors.push(`${entryBook.code} doit documenter ses tests globaux.`)
  }
  for (const test of content?.global_tests || []) {
    if (!test?.code || !test?.assertion || !test?.severity
      || typeof test?.automatable !== 'boolean') {
      errors.push(`${entryBook.code} contient un test global incomplet.`)
    }
    if (testCodes.has(test?.code)) {
      errors.push(`${entryBook.code} duplique le test ${test.code}.`)
    }
    testCodes.add(test?.code)
  }
  if (!content?.validation || typeof content.validation.authoring_complete !== 'boolean'
    || !content.validation.machine_review_status || !content.validation.human_review_status
    || !Array.isArray(content.validation.publication_blockers)) {
    errors.push(`${entryBook.code} doit exposer son état de validation complet.`)
  }
  if (normalize(content?.status) === 'validated' && !isValidatedBookContent(content)) {
    errors.push(`${entryBook.code} ne peut être validé sans revues approuvées et sans blocage.`)
  }
}

const validateCatalog = (memberships, techniques, contents) => {
  const errors = []
  const expectedNumbers = Array.from({ length: 48 }, (_, index) => index)
  const actualNumbers = volumes.map((entry) => entry.number)
  const volumeCodes = new Set(volumes.map((entry) => entry.code))
  const volumeSlugs = new Set(volumes.map((entry) => entry.slug))
  const allBooks = volumes.flatMap((entry) => entry.books)
  const bookCodes = new Set(allBooks.map((entry) => entry.code))
  const bookSlugs = new Set(allBooks.map((entry) => `${entry.code.slice(0, 3)}:${entry.slug}`))

  if (JSON.stringify(actualNumbers) !== JSON.stringify(expectedNumbers)) {
    errors.push('Les volumes doivent couvrir V00 à V47 dans l’ordre.')
  }
  if (volumeCodes.size !== volumes.length) errors.push('Les codes de volume doivent être uniques.')
  if (volumeSlugs.size !== volumes.length) errors.push('Les slugs de volume doivent être uniques.')
  if (bookCodes.size !== allBooks.length) errors.push('Les codes de livre doivent être uniques.')
  if (bookSlugs.size !== allBooks.length) errors.push('Les slugs de livre doivent être uniques dans un volume.')

  for (const entry of volumes) {
    if (!entry.title || !entry.mission || !entry.slug || !entry.books.length) {
      errors.push(`${entry.code} est incomplet.`)
    }
    for (const dependency of entry.dependencies) {
      if (!volumeCodes.has(dependency)) errors.push(`${entry.code} dépend d’un volume inconnu : ${dependency}.`)
    }
    for (const entryBook of entry.books) {
      if (!entryBook.mission || !entryBook.required_fields?.length || !entryBook.quality_gates?.length) {
        errors.push(`${entryBook.code} ne possède pas son contrat éditorial complet.`)
      }
      if (!['structure', 'inventory', 'draft', 'reviewed', 'validated'].includes(entryBook.content_status)) {
        errors.push(`${entryBook.code} possède un état de contenu inconnu : ${entryBook.content_status}.`)
      }
      const content = contents.get(entryBook.code)
      if (entryBook.content_path && !content) {
        errors.push(`${entryBook.code} annonce un contenu qui n’a pas été chargé.`)
      }
      if (!entryBook.content_path && content) {
        errors.push(`${entryBook.code} possède un contenu non déclaré dans le catalogue.`)
      }
      if (!entryBook.content_path && !['structure', 'inventory'].includes(entryBook.content_status)) {
        errors.push(`${entryBook.code} ne peut être ${entryBook.content_status} sans source de contenu.`)
      }
      if (content) {
        if (!entryBook.outputs.some((output) => output.endsWith(`${entryBook.code}.md`))) {
          errors.push(`${entryBook.code} doit déclarer sa sortie documentaire propre.`)
        }
        if (entryBook.kind === 'doctrine') {
          validateDoctrineBook(entryBook, content, errors)
        }
      }
    }
  }

  const expectedContentPaths = new Set(
    catalogBooks
      .filter((entry) => entry.content_path)
      .map((entry) => join(ROOT, entry.content_path)),
  )
  if (existsSync(BOOK_DATA_DIR)) {
    for (const filename of readdirSync(BOOK_DATA_DIR)) {
      const path = join(BOOK_DATA_DIR, filename)
      if (filename.endsWith('.json') && !expectedContentPaths.has(path)) {
        errors.push(`Le contenu ${filename} n’est rattaché à aucun livre du catalogue.`)
      }
    }
  }

  const recipeLensCodes = new Set(
    volumes.filter((entry) => entry.number >= 11 && entry.number <= 40).map((entry) => entry.code),
  )
  for (const membership of memberships) {
    if (!recipeLensCodes.has(membership.primary_volume)) {
      errors.push(`${membership.recipe_code} n’a pas de volume principal de rédaction.`)
    }
    for (const volumeCode of membership.volumes) {
      if (!recipeLensCodes.has(volumeCode)) {
        errors.push(`${membership.recipe_code} référence un lot inconnu : ${volumeCode}.`)
      }
    }
  }
  if (memberships.length !== recipeCorpus.recipes.length) {
    errors.push('Toutes les recettes du corpus V3 doivent être indexées.')
  }
  for (const technique of techniques) {
    if (!bookCodes.has(technique.book_code) || !technique.book_code.startsWith('V02-')) {
      errors.push(`${technique.code} n’est pas rattachée à un livre du volume V02.`)
    }
  }

  if (errors.length) {
    throw new Error(`Catalogue encyclopédique invalide :\n- ${errors.join('\n- ')}`)
  }
}

const markdownList = (values) => values.map((value) => `- ${value}`).join('\n')
const entryLabel = (value, singularSuffix, pluralSuffix) => (
  `${value} entrée${value === 1 ? '' : 's'} ${value === 1 ? singularSuffix : pluralSuffix}`
)
const escapeTableCell = (value) => String(value ?? '—')
  .replace(/\|/g, '\\|')
  .replace(/\r?\n/g, ' ')

const buildBookMarkdown = (entryBook, content) => {
  const sourceRows = content.sources.map((source) => {
    const relativePath = source.path.startsWith('docs/encyclopedia/')
      ? `../${source.path.slice('docs/encyclopedia/'.length)}`
      : source.path
    return `| \`${source.code}\` | [${escapeTableCell(source.title)}](${relativePath}) | ${escapeTableCell(source.locators.join(' · '))} | ${escapeTableCell(source.role)} |`
  }).join('\n')

  const definitionRows = content.definitions
    .map((definition) => `| \`${definition.code}\` | **${escapeTableCell(definition.term)}** | ${escapeTableCell(definition.definition)} |`)
    .join('\n')

  const rules = content.rules.map((rule) => {
    const examples = rule.examples.map((example) => `#### ${example.case}

- **Situation :** ${example.situation}
- **Décision attendue :** ${example.decision}
- **Résultat :** ${example.result}`).join('\n\n')
    const counterexamples = rule.counterexamples.map((example) => `#### ${example.case}

- **Comportement refusé :** ${example.rejected}
- **Pourquoi :** ${example.reason}`).join('\n\n')
    const exceptions = rule.exceptions.map((exception) => `#### ${exception.case}

- **Traitement :** ${exception.handling}
- **Limites :** ${exception.limits}`).join('\n\n')
    const tests = rule.tests.map((test) => (
      `| \`${test.code}\` | ${escapeTableCell(test.given)} | ${escapeTableCell(test.when)} | ${escapeTableCell(test.then)} | \`${test.severity}\` | ${test.automatable ? 'oui' : 'non'} |`
    )).join('\n')

    return `## ${rule.code} — ${rule.title}

> **Règle normative —** ${rule.rule}

### Justification

${rule.justification}

### Conséquences

${markdownList(rule.consequences)}

### Usages améliorés

${rule.improves.map((value) => `\`${value}\``).join(' · ')}

### Exemples conformes

${examples}

### Contre-exemples

${counterexamples}

### Exceptions

${exceptions}

### Tests d’acceptation

| Code | Étant donné | Quand | Alors | Sévérité | Automatisable |
|---|---|---|---|---|---:|
${tests}`
  }).join('\n\n')

  const globalExceptions = content.global_exceptions.map((exception) => `### ${exception.code} — ${exception.case}

${exception.rule}

**Garde-fous**

${markdownList(exception.guardrails)}`).join('\n\n')

  const globalTests = content.global_tests.map((test) => (
    `| \`${test.code}\` | ${escapeTableCell(test.assertion)} | \`${test.severity}\` | ${test.automatable ? 'oui' : 'non'} |`
  )).join('\n')

  const blockers = content.validation.publication_blockers.length
    ? markdownList(content.validation.publication_blockers)
    : 'Aucun.'

  return `# ${entryBook.code} — ${content.title}

> ${content.promise}

| Propriété | Valeur |
|---|---|
| Édition | \`${edition.code}\` |
| Version du livre | \`${content.version}\` |
| État | \`${content.status}\` |
| Langue | \`${content.locale}\` |
| Rédigé le | ${content.authored_on} |
| Revue machine | \`${content.validation.machine_review_status}\` |
| Revue humaine | \`${content.validation.human_review_status}\` |

## Objectif

${content.objective}

## Périmètre

### Inclus

${markdownList(content.scope.includes)}

### Exclu

${markdownList(content.scope.excludes)}

## Vocabulaire normatif

| Code | Terme | Définition |
|---|---|---|
${definitionRows}

## Sources fondatrices

| Code | Source | Sections utilisées | Rôle |
|---|---|---|---|
${sourceRows}

## Principes normatifs

${rules}

## Exceptions globales

${globalExceptions}

## Tests globaux

| Code | Assertion | Sévérité | Automatisable |
|---|---|---|---:|
${globalTests}

## État de validation

| Contrôle | État |
|---|---|
| Rédaction matériellement complète | ${content.validation.authoring_complete ? 'oui' : 'non'} |
| Revue machine | \`${content.validation.machine_review_status}\` |
| Revue humaine | \`${content.validation.human_review_status}\` |
| Rôles humains requis | ${content.validation.required_human_roles.map((role) => `\`${role}\``).join(', ')} |

### Blocages avant publication

${blockers}
`
}

const buildVolumeMarkdown = (entry, coverage) => {
  const target = entry.target_metric
    ? Object.entries(entry.target_metric)
      .filter(([key]) => key !== 'key')
      .map(([key, value]) => `${key}: ${value}`)
      .join(' · ')
    : 'aucune cible quantitative'
  const inventory = coverage.inventory_entries == null
    ? 'non mesuré'
    : entryLabel(coverage.inventory_entries, 'repérée', 'repérées')
  const drafted = entryLabel(coverage.drafted_entries || 0, 'réellement rédigée', 'réellement rédigées')
  const validated = entryLabel(coverage.validated_entries || 0, 'validée', 'validées')
  const referenceCorpusBlock = entry.code === 'V01'
    ? `## Corpus source industrialisé

- [Lire le rapport du corpus Ciqual 2025](../ingredients/CIQUAL-2025-CORPUS.md)
- Références de formes alimentaires : ${ciqualReferenceManifest.counts.source_entries}
- Constituants nutritionnels par référence : ${ciqualReferenceManifest.counts.constituents}
- Profils techniquement acceptés : ${ciqualReferenceManifest.counts.accepted}
- Entrées à revoir : ${ciqualReferenceManifest.counts.review}
- Entrées en quarantaine : ${ciqualReferenceManifest.counts.quarantined}
- Candidats de concepts canoniques : ${ciqualReferenceManifest.counts.canonical_candidates}
- Grain : une référence source décrit une forme ; elle ne vaut pas validation d’un ingrédient canonique.
- Réconciliation : \`ciqual_2020\` → \`ciqual_2025\` matérialisée ; validation canonique encore requise.`
    : null

  const books = entry.books.map((entryBook) => {
    const content = bookContents.get(entryBook.code)
    const contentOutput = entryBook.outputs.find((output) => output.endsWith(`${entryBook.code}.md`))
    const contentLink = contentOutput?.startsWith('docs/encyclopedia/')
      ? `../${contentOutput.slice('docs/encyclopedia/'.length)}`
      : contentOutput
    const authoredBlock = content
      ? `### Contenu réellement rédigé

- [Lire le livre intégral](${contentLink})
- Version : \`${content.version}\`
- Principes normatifs : ${content.rules.length}
- Définitions : ${content.definitions.length}
- Tests : ${content.rules.reduce((count, rule) => count + rule.tests.length, 0) + content.global_tests.length}
- Revue humaine : \`${content.validation.human_review_status}\``
      : null

    return `## ${entryBook.code} — ${entryBook.title}

${entryBook.mission}

| Contrat | Valeur |
|---|---|
| Type | \`${entryBook.kind}\` |
| État du contenu | \`${entryBook.content_status}\` |
| Cible propre | ${entryBook.target_entries ?? 'hérite du volume'} |
| Sources | ${entryBook.source_contracts.map((source) => `\`${source}\``).join(', ') || 'doctrine Myko'} |
| Sorties | ${entryBook.outputs.join(', ') || 'fiche versionnée et indexable'} |${authoredBlock ? `\n\n${authoredBlock}` : ''}

### Champs obligatoires

${markdownList(entryBook.required_fields.map((field) => `\`${field}\``))}

### Portes de qualité

${markdownList(entryBook.quality_gates)}
`
  }).join('\n')

  return `# ${entry.code} — ${entry.title}

> ${entry.mission}

| Propriété | Valeur |
|---|---|
| Édition | \`${edition.code}\` |
| Phase | \`${entry.phase}\` |
| Dépendances | ${entry.dependencies.map((dependency) => `\`${dependency}\``).join(', ') || 'aucune'} |
| Sources canoniques | ${entry.source_contracts.map((source) => `\`${source}\``).join(', ') || 'doctrine Myko'} |
| Cible | ${target} |
| Inventaire | ${inventory} |
| Rédaction | ${drafted} |
| Validation | ${validated} |
| État réel | \`${coverage.completion_status}\` |

${referenceCorpusBlock ? `${referenceCorpusBlock}\n\n` : ''}## Définition de terminé

Un livre n’est terminé ni parce que son contrat existe, ni parce que des noms ont été inventoriés. Il est publiable uniquement lorsque sa cible est atteinte avec des fiches intégralement rédigées, sourcées et validées, que toutes ses portes de qualité sont franchies et que chaque référence pointe vers une identité canonique validée. Le volume n’est terminé que lorsque tous ses livres et toutes ses dépendances le sont. Une correction crée une nouvelle version ; elle ne réécrit pas silencieusement l’historique.

${books}
`
}

const buildReadme = (summary, coverage) => `# MYKO — Encyclopédie culinaire

Cette bibliothèque transforme la Bible et le Plan directeur Myko en **48 volumes** et **${summary.books} livres à produire**. Le registre, les contrats et les rattachements constituent l’ossature du chantier ; ils ne sont pas le contenu terminé.

> **Règle de vérité :** inventorié ≠ rédigé ≠ validé. Seules les entrées validées comptent dans la complétude. L’intégration des ingrédients, recettes et interactions reste bloquée tant que les 48 volumes et leurs dépendances ne sont pas validés.

## Contrat d’édition

- Édition : \`${edition.code}\`
- Contrat : \`${edition.contract_version}\`
- État : \`${edition.status}\`
- Volumes structurés : ${summary.volumes}
- Volumes validés : ${summary.validated_volumes}
- Livres structurés : ${summary.books}
- Livres réellement rédigés : ${summary.drafted_books}
- Livres validés : ${summary.validated_books}
- Prêt pour intégration : ${summary.ready_for_integration ? 'oui' : 'non'}
- Recettes inventoriées : ${summary.recipes}
- Appartenances éditoriales : ${summary.recipe_memberships}
- Libellés de techniques extraits : ${summary.techniques}
- Concepts alimentaires du snapshot F0 : ${summary.food_concepts}
- Formes alimentaires du snapshot F0 : ${summary.food_forms}
- Références alimentaires CIQUAL matérialisées : ${summary.food_reference_entries}
- Références CIQUAL techniquement acceptées : ${summary.food_reference_accepted_entries}
- Références CIQUAL à revoir : ${summary.food_reference_review_entries}
- Références CIQUAL en quarantaine : ${summary.food_reference_quarantined_entries}
- Candidats de concepts canoniques : ${summary.food_canonical_candidates}

Les mesures live de Supabase enrichissent uniquement l’inventaire. Elles ne peuvent jamais augmenter le nombre d’entrées validées ni la complétude éditoriale.

## Volumes

| Code | Volume | Phase | Livres | Inventorié | Rédigé | Validé | Cible | État |
|---|---|---:|---:|---:|---:|---:|---:|---|
${volumes.map((entry) => {
    const item = coverage.find((candidate) => candidate.code === entry.code)
    const target = entry.target_metric?.target ?? entry.target_metric?.minimum ?? '—'
    return `| [${entry.code}](volumes/${entry.code}.md) | ${entry.title} | ${entry.phase} | ${entry.books.length} | ${item.inventory_entries ?? '—'} | ${item.drafted_entries} | ${item.validated_entries} | ${target} | ${item.completion_status} |`
  }).join('\n')}

## Ordre de production

Le protocole complet, les critères de passage et l’ordre de dépendance sont décrits dans [PRODUCTION.md](PRODUCTION.md).

## Régénération

\`\`\`bash
npm run encyclopedia:build
npm run encyclopedia:check
\`\`\`

Le second appel échoue si le manifeste, l’index ou les livres générés ne correspondent plus aux sources.
`

const recipeMemberships = buildRecipeMemberships()
const techniques = buildTechniques()
validateCatalog(recipeMemberships, techniques, bookContents)

const draftFoodConcepts = foodCorpus.concepts.filter(isDraftFoodConcept)
const validatedFoodConcepts = foodCorpus.concepts.filter(isValidatedFoodConcept)
const draftRecipes = recipeCorpus.recipes.filter(isDraftRecipe)
const validatedRecipes = recipeCorpus.recipes.filter(isValidatedRecipe)
const draftedBookContents = [...bookContents.values()].filter(isDraftBookContent)
const validatedBookContents = [...bookContents.values()].filter(isValidatedBookContent)
const v00BookContents = [...bookContents.entries()]
  .filter(([bookCode]) => bookCode.startsWith('V00-'))
  .map(([, content]) => content)

const membershipCountsFor = (recipes) => {
  const recipeCodes = new Set(recipes.map((recipe) => recipe.code))
  return Object.fromEntries(
    volumes
      .filter((entry) => entry.number >= 11 && entry.number <= 40)
      .map((entry) => [
        entry.code,
        recipeMemberships.filter((membership) => (
          recipeCodes.has(membership.recipe_code)
          && membership.volumes.includes(entry.code)
        )).length,
      ]),
  )
}

const inventoryMembershipCounts = membershipCountsFor(recipeCorpus.recipes)
const draftMembershipCounts = membershipCountsFor(draftRecipes)
const validatedMembershipCounts = membershipCountsFor(validatedRecipes)

const inventoryCounts = {
  V00: v00BookContents.length,
  V01: foodCorpus.concepts.length,
  V02: techniques.length,
  V03: countRecipeRole(recipeCorpus.recipes, [/\bfond\b/, /\bfumet\b/, /\bbouillon\b/, /\bmarinade\b/, /\bsaumure\b/, /\bpate de base\b/]),
  V04: countRecipeRole(recipeCorpus.recipes, [/\bsauce\b/, /\bpesto\b/, /\bvinaigrette\b/, /\bchutney\b/, /\bjus reduit\b/]),
  V05: countRecipeRole(recipeCorpus.recipes, [/\baccompagnement\b/, /\bgarniture\b/, /\bpuree\b/, /\bgratin\b/, /\bpolenta\b/]),
  V06: recipeCorpus.recipes.filter((recipe) => isDessert(recipe)).length,
  V07: countRecipeRole(recipeCorpus.recipes, [/\bpetit dejeuner\b/, /\bporridge\b/, /\bgranola\b/, /\bpancake\b/, /\bgaufre\b/]),
  V08: countRecipeRole(recipeCorpus.recipes, [/\bcollation\b/, /\bbarre\b/, /\benergy ball\b/, /\bcompote\b/]),
  V09: countRecipeRole(recipeCorpus.recipes, [/\bboisson\b/, /\bsmoothie\b/, /\bcocktail\b/, /\bmocktail\b/, /\binfusion\b/]),
  V10: recipeCorpus.recipes.length,
  ...inventoryMembershipCounts,
}

const draftCounts = {
  V00: v00BookContents.filter(isDraftBookContent).length,
  V01: draftFoodConcepts.length,
  V02: 0,
  V03: 0,
  V04: 0,
  V05: 0,
  V06: draftRecipes.filter((recipe) => isDessert(recipe)).length,
  V07: countRecipeRole(draftRecipes, [/\bpetit dejeuner\b/, /\bporridge\b/, /\bgranola\b/, /\bpancake\b/, /\bgaufre\b/]),
  V08: countRecipeRole(draftRecipes, [/\bcollation\b/, /\bbarre\b/, /\benergy ball\b/, /\bcompote\b/]),
  V09: countRecipeRole(draftRecipes, [/\bboisson\b/, /\bsmoothie\b/, /\bcocktail\b/, /\bmocktail\b/, /\binfusion\b/]),
  V10: draftRecipes.length,
  ...draftMembershipCounts,
}

const validatedCounts = {
  V00: v00BookContents.filter(isValidatedBookContent).length,
  V01: validatedFoodConcepts.length,
  V02: 0,
  V03: 0,
  V04: 0,
  V05: 0,
  V06: validatedRecipes.filter((recipe) => isDessert(recipe)).length,
  V07: countRecipeRole(validatedRecipes, [/\bpetit dejeuner\b/, /\bporridge\b/, /\bgranola\b/, /\bpancake\b/, /\bgaufre\b/]),
  V08: countRecipeRole(validatedRecipes, [/\bcollation\b/, /\bbarre\b/, /\benergy ball\b/, /\bcompote\b/]),
  V09: countRecipeRole(validatedRecipes, [/\bboisson\b/, /\bsmoothie\b/, /\bcocktail\b/, /\bmocktail\b/, /\binfusion\b/]),
  V10: validatedRecipes.length,
  ...validatedMembershipCounts,
}

const coverage = volumes.map((entry) => {
  const target = entry.target_metric?.target ?? entry.target_metric?.minimum ?? null
  const inventoryEntries = inventoryCounts[entry.code] ?? 0
  const draftedEntries = draftCounts[entry.code] ?? 0
  const validatedEntries = validatedCounts[entry.code] ?? 0
  return {
    code: entry.code,
    title: entry.title,
    phase: entry.phase,
    books: entry.books.length,
    current_entries: inventoryEntries,
    inventory_entries: inventoryEntries,
    drafted_entries: draftedEntries,
    validated_entries: validatedEntries,
    inventory_percent: target ? Math.min(100, Math.round((inventoryEntries / target) * 100)) : null,
    draft_percent: target ? Math.min(100, Math.round((draftedEntries / target) * 100)) : null,
    completion_percent: target ? Math.min(100, Math.round((validatedEntries / target) * 100)) : null,
    completion_status: completionStatus({
      inventory: inventoryEntries,
      drafted: draftedEntries,
      validated: validatedEntries,
      target,
    }),
    target,
    target_metric: entry.target_metric,
  }
})

const summary = {
  volumes: volumes.length,
  books: volumes.reduce((count, entry) => count + entry.books.length, 0),
  validated_volumes: coverage.filter((entry) => entry.completion_status === 'validated').length,
  drafted_books: draftedBookContents.length,
  validated_books: validatedBookContents.length,
  ready_for_integration: coverage.every((entry) => entry.completion_status === 'validated'),
  recipes: recipeCorpus.recipes.length,
  drafted_recipes: draftRecipes.length,
  validated_recipes: validatedRecipes.length,
  recipe_memberships: recipeMemberships.reduce((count, item) => count + item.volumes.length, 0),
  techniques: techniques.length,
  food_concepts: foodCorpus.concepts.length,
  drafted_food_concepts: draftFoodConcepts.length,
  validated_food_concepts: validatedFoodConcepts.length,
  food_forms: countFoodForms(),
  food_reference_entries: ciqualReferenceManifest.counts.source_entries,
  food_reference_accepted_entries: ciqualReferenceManifest.counts.accepted,
  food_reference_review_entries: ciqualReferenceManifest.counts.review,
  food_reference_quarantined_entries: ciqualReferenceManifest.counts.quarantined,
  food_canonical_candidates: ciqualReferenceManifest.counts.canonical_candidates,
}

const manifest = {
  edition,
  generated_summary: summary,
  volumes,
}

const index = {
  contract_version: edition.contract_version,
  source_versions: {
    recipes: recipeCorpus.corpus_version,
    foods: foodCorpus.source?.code || 'myko_f0_curated',
    food_references: `${ciqualReferenceManifest.source.code}@${ciqualReferenceManifest.source.version}`,
  },
  summary,
  coverage,
  book_contents: [...bookContents.entries()]
    .map(([bookCode, content]) => ({
      book_code: bookCode,
      version: content.version,
      status: content.status,
      authoring_complete: content.validation.authoring_complete,
      machine_review_status: content.validation.machine_review_status,
      human_review_status: content.validation.human_review_status,
      definition_count: content.definitions.length,
      rule_count: content.rules.length,
      test_count: content.rules.reduce((count, rule) => count + rule.tests.length, 0)
        + content.global_tests.length,
      source_count: content.sources.length,
      publication_blockers: content.validation.publication_blockers,
    }))
    .sort((left, right) => left.book_code.localeCompare(right.book_code, 'fr')),
  techniques,
  recipe_memberships: recipeMemberships,
}

const outputs = new Map([
  [join(DATA_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`],
  [join(DATA_DIR, 'index.json'), `${JSON.stringify(index, null, 2)}\n`],
  [join(DOCS_DIR, 'README.md'), buildReadme(summary, coverage)],
  ...volumes.map((entry) => [
    join(VOLUMES_DIR, `${entry.code}.md`),
    buildVolumeMarkdown(entry, coverage.find((item) => item.code === entry.code)),
  ]),
  ...[...bookContents.entries()].map(([bookCode, content]) => {
    const entryBook = catalogBookByCode.get(bookCode)
    const outputPath = entryBook.outputs.find((output) => output.endsWith(`${bookCode}.md`))
    return [join(ROOT, outputPath), buildBookMarkdown(entryBook, content)]
  }),
])

if (CHECK_MODE) {
  const stale = []
  for (const [path, expected] of outputs) {
    const actual = existsSync(path) ? readFileSync(path, 'utf8') : null
    if (actual !== expected) stale.push(path.replace(`${ROOT}/`, ''))
  }

  const expectedVolumeFiles = new Set(volumes.map((entry) => `${entry.code}.md`))
  if (existsSync(VOLUMES_DIR)) {
    for (const filename of readdirSync(VOLUMES_DIR)) {
      if (filename.endsWith('.md') && !expectedVolumeFiles.has(filename)) {
        stale.push(join('docs', 'encyclopedia', 'volumes', filename))
      }
    }
  }

  const expectedBookFiles = new Set(
    [...bookContents.keys()].map((bookCode) => `${bookCode}.md`),
  )
  if (existsSync(BOOK_DOCS_DIR)) {
    for (const filename of readdirSync(BOOK_DOCS_DIR)) {
      if (filename.endsWith('.md') && !expectedBookFiles.has(filename)) {
        stale.push(join('docs', 'encyclopedia', 'books', filename))
      }
    }
  }

  if (stale.length) {
    console.error(`Encyclopédie non régénérée :\n- ${stale.join('\n- ')}`)
    process.exit(1)
  }
  console.log(`Encyclopédie valide : ${summary.volumes} volumes, ${summary.books} livres, ${summary.recipes} recettes.`)
} else {
  mkdirSync(DATA_DIR, { recursive: true })
  mkdirSync(VOLUMES_DIR, { recursive: true })
  mkdirSync(BOOK_DOCS_DIR, { recursive: true })
  for (const [path, content] of outputs) {
    writeFileSync(path, content)
  }
  console.log(`Encyclopédie générée : ${summary.volumes} volumes, ${summary.books} livres, ${summary.recipes} recettes.`)
}
