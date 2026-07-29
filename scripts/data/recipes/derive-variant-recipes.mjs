/**
 * Étend des variantes déclarées en recettes dérivées complètes.
 *
 * Jusqu'ici une variante n'était qu'une phrase : « Version aux poireaux
 * dominants ». On ne pouvait pas cliquer dessus, on ne pouvait pas la planifier,
 * et surtout on ne pouvait pas la peser — le corpus ne savait pas ce qu'elle
 * changeait. Une variante devient donc une recette à part entière, obtenue en
 * appliquant à sa base un DELTA STRUCTURÉ : quelques opérations sur la liste
 * d'ingrédients, quelques réécritures d'étapes. Le reste est hérité.
 *
 * Écrire le delta plutôt que la recette entière n'est pas une économie de
 * frappe, c'est une garantie : la dérivée ne peut pas dériver. Si la base
 * change de quantités, ses variantes suivent ; et aucune ne peut porter un
 * ingrédient que sa base ne portait pas sans le déclarer explicitement.
 *
 *   node scripts/data/recipes/derive-variant-recipes.mjs derivations.json --lot lot.json
 *   node scripts/data/recipes/derive-variant-recipes.mjs derivations.json --check
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const VOCABULAIRE = join(ROOT, 'data', 'recipes', 'authoring-vocabulary.json')

/** Opérations reconnues sur les ingrédients. Vocabulaire fermé, comme partout ailleurs. */
const OPERATIONS = new Set(['remove', 'add', 'substitute', 'scale', 'set'])
/** Opérations reconnues sur les étapes. */
const OPERATIONS_ETAPES = new Set(['replace', 'insert', 'remove'])

/**
 * Mots vides du français culinaire. Pour vérifier qu'une étape ne parle plus
 * d'un ingrédient retiré, on cherche les mots PORTEURS de son nom — « crue »,
 * « frais » ou « de » ne désignent rien à eux seuls.
 */
const MOTS_VIDES = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'l', 'a', 'au', 'aux', 'en', 'et', 'ou',
  'cru', 'crue', 'crus', 'crues', 'cuit', 'cuite', 'cuits', 'cuites',
  'frais', 'fraiche', 'fraiches', 'sec', 'seche', 'seches', 'sechee', 'sechees',
  'moulu', 'moulue', 'entier', 'entiere', 'demi', 'fin', 'fine', 'liquide',
  'nature', 'naturel', 'naturelle', 'conserve', 'surgele', 'surgelee',
  'doux', 'douce', 'sale', 'salee', 'blanc', 'blanche', 'noir', 'noire',
  'rouge', 'vert', 'verte', 'jaune', 'gros', 'grosse', 'petit', 'petite',
  'extra', 'vierge', 'pur', 'pure', 'sans', 'avec', 'type', 'sorte',
])

/** Mots porteurs d'un nom de forme, dans l'ordre du libellé. */
const motsPorteurs = (forme) => normalizeName(forme).split(' ').filter((mot) => mot.length > 2 && !MOTS_VIDES.has(mot))

/**
 * Un pluriel français simple, pour que « lardons » dans une étape reconnaisse
 * la forme « Lardon fumé ». On ne cherche pas la morphologie complète : la
 * troncature au radical suffit et se trompe du bon côté — elle signale trop,
 * jamais trop peu.
 */
const radical = (mot) => mot.replace(/(?:eaux|aux)$/, 'eau').replace(/[sx]$/, '')

const nombre = (valeur) => {
  const n = Number(valeur)
  return Number.isFinite(n) ? n : null
}

/** Arrondi de quantité : au gramme près, sauf sous 10 g où le demi-gramme compte. */
const arrondirQuantite = (valeur) => (valeur < 10 ? Math.round(valeur * 2) / 2 : Math.round(valeur))

/**
 * Profil sensoriel d'une dérivée. Tout est hérité SAUF les ingrédients
 * signature, qui doivent suivre le delta : une variante sans farce ne peut pas
 * revendiquer le pain de mie de sa base parmi ses ingrédients signature. Deux
 * signatures au moins sont exigées à la publication — la dérivée qui tombe en
 * dessous se signale, elle ne se complète pas d'office.
 */
function sensorielDerive(sensoriel, ingredients, substitutions = new Map()) {
  if (!sensoriel) return sensoriel
  const presentes = new Set(ingredients.map((ingredient) => normalizeName(ingredient.form)))
  const signatures = (sensoriel.signature_ingredients || [])
    // Une substitution garde la signature à sa place : le veau du Marengo cède
    // au poulet, il ne disparaît pas de ce qui fait le plat.
    .map((forme) => substitutions.get(normalizeName(forme)) || forme)
    .filter((forme) => presentes.has(normalizeName(forme)))
  return { ...sensoriel, signature_ingredients: signatures }
}

/**
 * Applique un delta à une recette de base et rend la recette dérivée complète.
 * Rend aussi la liste des anomalies : le script n'écrit rien tant qu'il en reste.
 */
export function deriver(base, delta, { vocabulaire = null } = {}) {
  const anomalies = []
  const refuser = (message) => anomalies.push(`${delta.code || '(sans code)'} — ${message}`)

  // ── L'étiquette doit exister dans la base ────────────────────────────────
  // Sans ce contrôle on pourrait inventer une variante que le corpus n'a jamais
  // annoncée : la dérivée serait alors une recette de mémoire déguisée.
  const etiquettes = (base.variants || []).map((v) => normalizeName(v))
  if (!delta.variant_label) refuser('aucune étiquette de variante déclarée')
  else if (!etiquettes.includes(normalizeName(delta.variant_label))) {
    refuser(`l'étiquette « ${delta.variant_label} » ne figure pas parmi les variantes de ${base.code}`)
  }

  // ── Ingrédients ──────────────────────────────────────────────────────────
  const ingredients = (base.ingredients || []).map((ingredient) => ({ ...ingredient }))
  const indexer = () => new Map(ingredients.map((ingredient, position) => [normalizeName(ingredient.form), position]))
  const retires = []
  const ajoutes = []
  const substitutions = new Map()

  for (const operation of delta.operations || []) {
    const op = operation.op
    if (!OPERATIONS.has(op)) {
      refuser(`opération inconnue « ${op} » (attendu : ${[...OPERATIONS].join(', ')})`)
      continue
    }
    const index = indexer()

    if (op === 'add') {
      if (!operation.form) { refuser('« add » sans forme'); continue }
      if (index.has(normalizeName(operation.form))) {
        refuser(`« ${operation.form} » est déjà dans ${base.code} : employer « scale » ou « set »`)
        continue
      }
      const quantite = nombre(operation.quantity)
      if (quantite == null || quantite <= 0) { refuser(`« add ${operation.form} » sans quantité positive`); continue }
      ingredients.push({
        form: operation.form,
        quantity: quantite,
        unit: operation.unit || 'g',
        role: operation.role || 'garniture',
        optional: Boolean(operation.optional),
      })
      ajoutes.push(operation.form)
      continue
    }

    // Toutes les autres opérations visent un ingrédient existant. Une cible
    // absente est refusée plutôt qu'ignorée : un delta silencieux produirait
    // une « variante » identique à sa base, et personne ne le verrait.
    const cible = index.get(normalizeName(operation.form))
    if (cible == null) {
      refuser(`« ${op} » vise « ${operation.form} », absent de ${base.code}`)
      continue
    }
    // Certaines bases portent deux fois la même forme (deux lignes de thym
    // frais, deux lignes de persil). L'index n'en retient qu'une, et l'autre
    // survivrait au retrait sans que rien ne le dise.
    const doublons = ingredients.filter((ingredient) => normalizeName(ingredient.form) === normalizeName(operation.form)).length
    if (doublons > 1) {
      refuser(`« ${operation.form} » figure ${doublons} fois dans ${base.code} : la cible de « ${op} » est ambiguë, corriger la base d'abord`)
      continue
    }

    if (op === 'remove') {
      retires.push(ingredients[cible].form)
      ingredients.splice(cible, 1)
      continue
    }

    if (op === 'scale') {
      const facteur = nombre(operation.factor)
      if (facteur == null || facteur <= 0) { refuser(`« scale ${operation.form} » sans facteur positif`); continue }
      if (facteur === 1) { refuser(`« scale ${operation.form} » de facteur 1 ne change rien`); continue }
      ingredients[cible].quantity = arrondirQuantite(ingredients[cible].quantity * facteur)
      continue
    }

    if (op === 'set') {
      const quantite = nombre(operation.quantity)
      if (quantite == null || quantite <= 0) { refuser(`« set ${operation.form} » sans quantité positive`); continue }
      const memeQuantite = quantite === ingredients[cible].quantity
      const memeRole = !operation.role || operation.role === ingredients[cible].role
      const memeOption = operation.optional == null || Boolean(operation.optional) === ingredients[cible].optional
      if (memeQuantite && memeRole && memeOption) { refuser(`« set ${operation.form} » à sa valeur d'origine ne change rien`); continue }
      // Un ingrédient facultatif peut devenir indispensable dans la variante :
      // la fécule n'est qu'un secours dans une blanquette à la crème, elle est
      // la seule liaison dans celle qui s'en passe.
      if (operation.optional != null) ingredients[cible].optional = Boolean(operation.optional)
      if (operation.unit && operation.unit !== ingredients[cible].unit) ingredients[cible].unit = operation.unit
      // Le rôle suit parfois la quantité : retirer la farce d'une poule au pot
      // laisse son ail dans le bouillon, où il n'est plus « farce » mais
      // aromate. Sans quoi la recette dérivée décrirait une farce absente.
      if (operation.role) ingredients[cible].role = operation.role
      ingredients[cible].quantity = quantite
      continue
    }

    if (op === 'substitute') {
      if (!operation.with) { refuser(`« substitute ${operation.form} » sans forme de remplacement`); continue }
      if (index.has(normalizeName(operation.with))) {
        refuser(`« ${operation.with} » est déjà dans ${base.code} : employer « remove » puis « scale »`)
        continue
      }
      retires.push(ingredients[cible].form)
      ajoutes.push(operation.with)
      substitutions.set(normalizeName(ingredients[cible].form), operation.with)
      const quantite = operation.quantity == null ? ingredients[cible].quantity : nombre(operation.quantity)
      if (quantite == null || quantite <= 0) { refuser(`« substitute ${operation.form} » avec une quantité non positive`); continue }
      ingredients[cible] = {
        form: operation.with,
        quantity: quantite,
        unit: operation.unit || ingredients[cible].unit,
        role: operation.role || ingredients[cible].role,
        optional: operation.optional == null ? ingredients[cible].optional : Boolean(operation.optional),
      }
    }
  }

  // ── Le vocabulaire fermé s'applique aussi aux ajouts ─────────────────────
  // Une dérivée qui invente une forme est une dérivée qu'on ne peut pas peser.
  if (vocabulaire) {
    const nommer = (forme) => (typeof forme === 'string' ? forme : (forme.nom || forme.name || ''))
    const employables = new Set(vocabulaire.formes_employables.map((forme) => normalizeName(nommer(forme))))
    const bloquees = new Map((vocabulaire.formes_bloquees || [])
      .map((forme) => [normalizeName(nommer(forme)), (forme.motifs || []).join(', ') || 'forme bloquée']))
    for (const forme of ajoutes) {
      const cle = normalizeName(forme)
      if (bloquees.has(cle)) refuser(`« ${forme} » est bloquée au vocabulaire : ${bloquees.get(cle)}`)
      else if (!employables.has(cle)) refuser(`« ${forme} » ne figure pas au vocabulaire employable`)
    }
  }

  // ── Étapes ───────────────────────────────────────────────────────────────
  let etapes = (base.steps || []).map((etape) => ({ ...etape }))
  for (const operation of delta.steps || []) {
    const op = operation.op
    if (!OPERATIONS_ETAPES.has(op)) {
      refuser(`opération d'étape inconnue « ${op} » (attendu : ${[...OPERATIONS_ETAPES].join(', ')})`)
      continue
    }
    if (op === 'insert') {
      const apres = nombre(operation.after)
      if (apres == null || apres < 0 || apres > etapes.length) { refuser(`« insert » après l'étape ${operation.after}, hors de portée`); continue }
      if (!operation.instruction) { refuser('« insert » sans instruction'); continue }
      etapes.splice(apres, 0, { n: 0, instruction: operation.instruction })
      continue
    }
    const position = etapes.findIndex((etape) => etape.n === nombre(operation.n))
    if (position < 0) { refuser(`l'étape ${operation.n} n'existe pas dans ${base.code}`); continue }
    if (op === 'remove') { etapes.splice(position, 1); continue }
    if (!operation.instruction) { refuser(`« replace » de l'étape ${operation.n} sans instruction`); continue }
    if (operation.instruction === etapes[position].instruction) { refuser(`« replace » de l'étape ${operation.n} par un texte identique`); continue }
    etapes[position] = { n: etapes[position].n, instruction: operation.instruction }
  }
  etapes = etapes.map((etape, position) => ({ n: position + 1, instruction: etape.instruction }))

  // ── Le contrôle qui compte : une étape ne parle pas d'un absent ──────────
  // Retirer les lardons en gardant « faire rissoler les lardons » produit une
  // recette incohérente que rien d'autre n'attraperait — la nutrition est juste,
  // le vocabulaire est propre, et le plat est infaisable.
  const prose = etapes.map((etape) => normalizeName(etape.instruction)).join(' ')
  const motsProse = new Set(prose.split(' ').map(radical))
  // C'est le MOT DE TÊTE qui nomme l'ingrédient — le français l'annonce en
  // premier, « lardon » dans « lardon fumé ». Exiger que tout le libellé
  // survive laisserait passer « rissoler les lardons » après un retrait, faute
  // du mot « fumé » dans l'étape.
  const tete = (forme) => motsPorteurs(forme)[0] || null
  // Une substitution à l'intérieur d'un même concept — tomate fraîche pour
  // tomate en conserve — laisse légitimement le mot « tomate » dans les
  // étapes. Le contrôle ne vise pas ces cas : il vise l'ingrédient qui
  // disparaît de la liste sans disparaître de la méthode.
  const tetesAjoutees = new Set(ajoutes.map((forme) => radical(tete(forme) || '')))
  // Un même mot peut nommer deux choses : le jaune d'œuf cru d'une mayonnaise
  // et les jaunes durs qu'on tamise sont tous deux « des jaunes ». Le contrôle
  // ne sait pas les distinguer, alors le rédacteur le déclare — et doit dire
  // pourquoi, faute de quoi la dérogation deviendrait un réflexe.
  const homonymes = new Map((delta.homonymes || [])
    .map((entree) => [normalizeName(entree.form || ''), String(entree.raison || '').trim()]))
  for (const forme of retires) {
    const mot = tete(forme)
    if (!mot || tetesAjoutees.has(radical(mot))) continue
    if (!motsProse.has(radical(mot))) continue
    const cle = normalizeName(forme)
    if (homonymes.has(cle)) {
      if (!homonymes.get(cle)) refuser(`homonyme déclaré pour « ${forme} » sans raison : dire ce que le mot désigne encore`)
      continue
    }
    refuser(`« ${forme} » est retiré mais les étapes en parlent encore (« ${mot} ») : réécrire l'étape concernée, ou déclarer un homonyme si le mot y désigne autre chose`)
  }
  for (const [cle] of homonymes) {
    if (!retires.some((forme) => normalizeName(forme) === cle)) {
      refuser(`homonyme déclaré pour une forme qui n'est pas retirée (« ${cle} »)`)
    }
  }
  // Symétrique : un ingrédient ajouté que nulle étape n'emploie ne sera jamais
  // cuisiné. Il pèserait sur la nutrition sans exister dans l'assiette.
  for (const forme of ajoutes) {
    const mot = tete(forme)
    if (mot && !motsProse.has(radical(mot))) {
      refuser(`« ${forme} » est ajouté mais aucune étape ne l'emploie : réécrire l'étape concernée`)
    }
  }

  // ── Une dérivée doit dériver ─────────────────────────────────────────────
  const memeIngredients = JSON.stringify(ingredients) === JSON.stringify(base.ingredients || [])
  const memeEtapes = JSON.stringify(etapes.map((e) => e.instruction)) === JSON.stringify((base.steps || []).map((e) => e.instruction))
  if (memeIngredients && memeEtapes) refuser('le delta ne change rien : ce n\'est pas une variante')

  const recette = {
    code: delta.code,
    family: delta.family,
    derived_from: base.code,
    derivation: {
      variant_label: delta.variant_label,
      rationale: delta.rationale || null,
      operations: delta.operations || [],
      steps: delta.steps || [],
    },
    cuisine_origin: delta.cuisine_origin || base.cuisine_origin,
    identity_level: delta.identity_level || 'documented_variation',
    category: delta.category || base.category,
    status: delta.status || base.status,
    confidence: delta.confidence || base.confidence,
    servings: delta.servings || base.servings,
    prep_minutes: delta.prep_minutes == null ? base.prep_minutes : delta.prep_minutes,
    cook_minutes: delta.cook_minutes == null ? base.cook_minutes : delta.cook_minutes,
    difficulty: delta.difficulty || base.difficulty,
    sources: delta.sources || base.sources,
    canonical_arbitration: delta.canonical_arbitration
      || `Variante documentée de ${base.family} (${base.code}) : ${delta.variant_label}. `
       + `Les quantités non modifiées et la méthode non réécrite sont celles de la base, dont le dossier de sources fait foi.`,
    ingredients,
    steps: etapes,
    techniques: delta.techniques || base.techniques,
    variants: [],
    sensory: delta.sensory || sensorielDerive(base.sensory, ingredients, substitutions),
    conservation: delta.conservation || base.conservation,
    allergens: delta.allergens || base.allergens,
  }

  return { recette, anomalies }
}

/** Point d'entrée CLI. */
function principal() {
  const [source, ...drapeaux] = process.argv.slice(2)
  if (!source) {
    console.error('Usage : derive-variant-recipes.mjs <derivations.json> [--lot <sortie.json>] [--check]')
    process.exit(2)
  }
  const sortie = (() => {
    const position = drapeaux.indexOf('--lot')
    return position >= 0 ? drapeaux[position + 1] : null
  })()

  const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
  const vocabulaire = JSON.parse(readFileSync(VOCABULAIRE, 'utf8'))
  const parCode = new Map(corpus.recipes.map((recette) => [recette.code, recette]))
  const codesPris = new Set(corpus.recipes.map((recette) => recette.code))
  const famillesPrises = new Set(corpus.recipes.map((recette) => normalizeName(recette.family)))

  const fichier = JSON.parse(readFileSync(source, 'utf8'))
  const deltas = Array.isArray(fichier) ? fichier : (fichier.derivations || [])

  const recettes = []
  const anomalies = []
  for (const delta of deltas) {
    if (!delta.code) { anomalies.push('une dérivation sans code'); continue }
    if (codesPris.has(delta.code)) { anomalies.push(`${delta.code} — code déjà pris au corpus`); continue }
    if (!delta.family) { anomalies.push(`${delta.code} — sans nom de famille`); continue }
    if (famillesPrises.has(normalizeName(delta.family))) { anomalies.push(`${delta.code} — famille « ${delta.family} » déjà présente`); continue }
    const base = parCode.get(delta.base)
    if (!base) { anomalies.push(`${delta.code} — base « ${delta.base} » introuvable au corpus`); continue }
    if (base.derived_from) { anomalies.push(`${delta.code} — ${delta.base} est elle-même une dérivée : pas de dérivation en cascade`); continue }
    codesPris.add(delta.code)
    famillesPrises.add(normalizeName(delta.family))

    const resultat = deriver(base, delta, { vocabulaire })
    anomalies.push(...resultat.anomalies)
    if (!resultat.anomalies.length) recettes.push(resultat.recette)
  }

  if (anomalies.length) {
    console.error(`${anomalies.length} anomalie(s) — rien n'est écrit :`)
    for (const anomalie of anomalies) console.error(`  - ${anomalie}`)
    process.exit(1)
  }

  console.log(`${recettes.length} recette(s) dérivée(s) sans anomalie.`)
  for (const recette of recettes) {
    console.log(`  ${recette.code}  ${recette.family}  ← ${recette.derived_from}  (${recette.ingredients.length} ingrédients, ${recette.steps.length} étapes)`)
  }
  if (sortie && !drapeaux.includes('--check')) {
    writeFileSync(sortie, `${JSON.stringify({ recipes: recettes }, null, 2)}\n`, 'utf8')
    console.log(`\nLot écrit : ${sortie}`)
  }
}

if (process.argv[1] && process.argv[1].endsWith('derive-variant-recipes.mjs')) principal()
