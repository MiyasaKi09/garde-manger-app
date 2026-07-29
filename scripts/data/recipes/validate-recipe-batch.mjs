/**
 * Contrôle un lot de nouvelles recettes AVANT de le verser au corpus.
 *
 * Le corpus vise 3 000 recettes. À ce volume, une recette fausse ne se voit
 * plus : elle se dilue. Le seul moment où on peut encore l'arrêter est celui
 * où elle est écrite. Ce script est ce moment.
 *
 * Il ne corrige rien et ne complète rien. Il refuse, en disant pourquoi.
 *
 *   node scripts/data/recipes/validate-recipe-batch.mjs lot.json
 *   node scripts/data/recipes/validate-recipe-batch.mjs lot.json --json
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '../lib/normalize.mjs'
import { parseCiqualWorkbook } from '../parse/ciqual.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const VOCABULAIRE = join(ROOT, 'data', 'recipes', 'authoring-vocabulary.json')
const REGISTRE = join(ROOT, 'data', 'foods', 'recipe-food-mappings-v3.json')
const CIQUAL = join(ROOT, 'data', 'sources', 'raw', 'ciqual_2020_FR_2020-07-07.xls.gz')

const [source, ...flags] = process.argv.slice(2)
if (!source) {
  console.error('Usage : validate-recipe-batch.mjs <lot.json> [--json]')
  process.exit(2)
}

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const vocabulaire = JSON.parse(readFileSync(VOCABULAIRE, 'utf8'))
const lot = JSON.parse(readFileSync(source, 'utf8'))
const recettes = Array.isArray(lot) ? lot : (lot.recipes || lot.recettes || [])

const formesEmployables = new Map(vocabulaire.formes_employables.map((forme) => [forme.normalise, forme]))
const formesBloquees = new Map(vocabulaire.formes_bloquees.map((forme) => [forme.normalise, forme]))

// Une forme fraîchement arbitrée n'est pas encore au catalogue : celui-ci ne
// connaît que ce que le corpus emploie déjà. Elle deviendra employable à la
// prochaine reconstruction, une fois la recette versée. La refuser ici
// bloquerait à jamais tout ingrédient nouveau — c'est l'ordre normal des
// choses : la recette réclame, l'arbitrage tranche, la recette s'écrit.
const registre = JSON.parse(readFileSync(REGISTRE, 'utf8')).mappings || {}
const arbitreesRecemment = new Set(Object.entries(registre)
  .filter(([cle, mapping]) => !formesEmployables.has(cle) && !formesBloquees.has(cle)
    && (mapping?.confidence || 'B') !== 'C')
  .map(([cle]) => cle))

// Lexique des mots d'aliments français, tiré du classeur ANSES. Il sert à
// distinguer « Moules marinières » — où « moules » est bien un aliment absent
// de la liste — de « Pollo al ajillo » ou « Île flottante », dont le premier mot
// ne désigne aucun aliment français et n'a donc rien à annoncer.
//
// Seul le PREMIER mot de chaque libellé entre au lexique — sa tête. Le classeur
// contient aussi des plats composés, et prendre tous leurs mots y faisait entrer
// des qualificatifs qui ne désignent aucun aliment : « Pan bagnat » donnait
// « bagnat », « Riz cantonais » donnait « cantonais », « Porc, sauté » donnait
// « sauté ». Le contrôle accusait alors le pan bagnat de ne pas contenir de
// bagnat. Un mot de tête, lui, nomme toujours quelque chose qui se mange.
const lexiqueAliments = new Set()
for (const record of parseCiqualWorkbook(CIQUAL).records) {
  const tete = normalizeName(record.alim_nom_fr).split(' ')[0]
  if (tete && tete.length >= 4) lexiqueAliments.add(tete.replace(/s$/, ''))
}
const codesExistants = new Set(corpus.recipes.map((recette) => recette.code))
const famillesExistantes = new Map(corpus.recipes.map((recette) => [normalizeName(recette.family), recette.code]))

const SCORES = ['sweet', 'salty', 'acidic', 'bitter', 'umami', 'heat', 'pungency', 'richness', 'freshness', 'intensity']

/** Mots qui nomment une PRÉPARATION et non un ingrédient : ils ouvrent
 * légitimement un nom de plat sans rien annoncer qui doive figurer en liste. */
const TYPES_DE_PLAT = new Set([
  'soupe', 'veloute', 'potage', 'bouillon', 'consomme', 'gaspacho', 'minestrone',
  'gratin', 'tarte', 'tourte', 'quiche', 'pizza', 'galette', 'crepe', 'omelette',
  'frittata', 'salade', 'terrine', 'pate', 'rillettes', 'mousse', 'creme', 'flan',
  'gateau', 'cake', 'biscuit', 'sable', 'clafoutis', 'crumble', 'compote', 'confit',
  'daube', 'ragout', 'blanquette', 'navarin', 'pot', 'chou', 'risotto', 'paella',
  'curry', 'tajine', 'couscous', 'chili', 'dal', 'ratatouille', 'caponata',
  'poelee', 'brochette', 'boulette', 'polpette', 'kofta', 'croquette', 'beignet',
  'roti', 'braise', 'grille', 'sauce', 'puree', 'quatre', 'pain', 'brioche',
  'sandwich', 'wrap', 'bowl', 'assiette', 'escalope', 'filet', 'pave', 'steak',
  'panade', 'panzanella', 'horiatiki', 'gemista', 'fasolakia', 'mutabbal',
  'zaalouk', 'chorba', 'kefta', 'taktouka', 'loubia', 'tzatziki', 'involtini',
  'albondigas', 'escalivada', 'pisto', 'patatas', 'polpettone', 'frittatine',
  // Une paupiette est une escalope roulée autour d'une farce : un montage, pas
  // un aliment. Le nom n'annonce donc aucun ingrédient à retrouver dans la liste.
  'paupiette', 'roulade', 'ballotine', 'bouchee', 'socca', 'anchoiade',
  'pissaladiere', 'tapenade', 'croque', 'pistou',
  // Le classeur porte « Sauté de veau » comme plat composé, ce qui fait entrer
  // « sauté » au lexique des aliments. C'est une découpe et une cuisson, pas un
  // ingrédient : un sauté de porc n'a pas à contenir du sauté.
  'saute', 'sautee', 'mijote', 'fricassee', 'potage', 'veloute',
  // Noms de plats que le classeur porte comme aliments composés : « Cassoulet »,
  // « Osso buco », « Piperade » y ont leur entrée, si bien que leur premier mot
  // entre au lexique et que le contrôle réclame un cassoulet dans le cassoulet.
  'cassoulet', 'osso', 'buco', 'piperade', 'ratatouille', 'parmigiana',
  'bouillabaisse', 'remoulade', 'pilaf', 'sarladaise', 'sarladaises',
  'potee', 'souffle',
  // « Coquilles Saint-Jacques » désigne le plat servi dans sa coquille : c'est
  // un contenant, pas un ingrédient. Ce qui se mange est la noix, et c'est elle
  // que la liste doit porter — le contrôle a d'ailleurs bien fait son travail en
  // arrêtant une version écrite au Saint-pierre.
  'coquille', 'coquilles',
])
const UNITES = new Set(['g', 'ml', 'u', 'tranche', 'feuille'])
// « documented_variation » désigne une recette dérivée : elle n'a pas d'identité
// propre au répertoire, elle emprunte celle de sa base et s'en écarte d'un delta
// documenté. Elle se valide comme les autres — même vocabulaire, mêmes bornes.
const IDENTITES = new Set(['named_traditional_dish', 'domestic_standard', 'documented_variation'])
const DIFFICULTES = new Set(['facile', 'moyenne', 'difficile'])

/**
 * Une recette n'est publiable que si TOUS ses ingrédients non optionnels se
 * convertissent en grammes et portent une composition complète. On refait ici
 * le calcul du matérialiseur, sur le même catalogue, pour pouvoir refuser avant
 * d'écrire plutôt que de le découvrir après.
 */
const grammes = (ingredient, forme) => {
  const quantite = Number(ingredient.quantity)
  if (!Number.isFinite(quantite) || quantite <= 0) return null
  if (ingredient.unit === 'g') return quantite
  if (ingredient.unit === 'ml') {
    const densite = forme.conversion?.density_g_per_ml
    return Number.isFinite(densite) ? quantite * densite : null
  }
  if (['u', 'tranche', 'feuille'].includes(ingredient.unit)) {
    const masse = forme.conversion?.grams_per_unit
    return Number.isFinite(masse) ? quantite * masse : null
  }
  return null
}

const rapports = []
const codesDuLot = new Set()
const famillesDuLot = new Map()

for (const [rang, recette] of recettes.entries()) {
  const refus = []
  const reserves = []
  const dire = (message) => refus.push(message)

  // ── identité ────────────────────────────────────────────────────────────
  const code = String(recette.code || '').trim()
  if (!code) dire('code absent')
  // Une dérivée suffixe le code de sa base : SRC-008-D1 se lit « première
  // variante de SRC-008 », et le lien de parenté reste visible à l'œil nu.
  else if (!/^[A-Z0-9]{2,6}-\d{3,4}(?:-D\d{1,2})?$/.test(code)) dire(`code « ${code} » hors format PREFIXE-NNN[-DN]`)
  else if (codesExistants.has(code)) dire(`code « ${code} » déjà pris par le corpus`)
  else if (codesDuLot.has(code)) dire(`code « ${code} » en double dans le lot`)
  codesDuLot.add(code)

  const famille = String(recette.family || '').trim()
  if (!famille) dire('family absent')
  else {
    const cle = normalizeName(famille)
    if (famillesExistantes.has(cle)) dire(`« ${famille} » existe déjà au corpus sous ${famillesExistantes.get(cle)}`)
    else if (famillesDuLot.has(cle)) dire(`« ${famille} » en double dans le lot (${famillesDuLot.get(cle)})`)
    famillesDuLot.set(cle, code)
  }

  if (!String(recette.cuisine_origin || '').trim()) dire('cuisine_origin absent')
  if (!IDENTITES.has(recette.identity_level)) dire(`identity_level « ${recette.identity_level} » inconnu`)
  if (!String(recette.category || '').trim()) dire('category absente')
  if (!DIFFICULTES.has(recette.difficulty)) dire(`difficulty « ${recette.difficulty} » inconnue`)
  if (!['A', 'B', 'C'].includes(recette.confidence)) dire('confidence absente ou invalide')

  const portions = Number(recette.servings)
  if (!Number.isInteger(portions) || portions < 1 || portions > 12) dire(`servings « ${recette.servings} » hors bornes 1-12`)
  const prep = Number(recette.prep_minutes)
  const cuisson = Number(recette.cook_minutes)
  if (!Number.isFinite(prep) || prep < 0 || prep > 240) dire(`prep_minutes « ${recette.prep_minutes} » hors bornes`)
  if (!Number.isFinite(cuisson) || cuisson < 0 || cuisson > 720) dire(`cook_minutes « ${recette.cook_minutes} » hors bornes`)

  // ── ingrédients ─────────────────────────────────────────────────────────
  const ingredients = recette.ingredients || []
  if (ingredients.length < 3) dire(`${ingredients.length} ingrédient(s) — trois au minimum`)
  let kcal = 0
  let proteines = 0
  let glucides = 0
  let lipides = 0
  let masseTotale = 0
  // Un ingrédient tout juste arbitré n'a pas encore de masse : le catalogue ne
  // le portera qu'après reconstruction. Continuer à totaliser sans lui donnerait
  // un chiffre faux — une poule au pot annoncée à 215 kcal la part, sa poule non
  // comptée. On mesure ou on s'abstient, on n'estime pas à moitié.
  let peseeIncomplete = false
  for (const ingredient of ingredients) {
    const libelle = String(ingredient.form || '').trim()
    if (!libelle) { dire('un ingrédient sans `form`'); continue }
    if (!UNITES.has(ingredient.unit)) { dire(`« ${libelle} » : unité « ${ingredient.unit} » non gérée`); continue }
    if (!String(ingredient.role || '').trim()) reserves.push(`« ${libelle} » sans rôle`)

    const cle = normalizeName(libelle)
    const forme = formesEmployables.get(cle)
    if (!forme && arbitreesRecemment.has(cle)) {
      reserves.push(`« ${libelle} » vient d'être arbitrée : elle ne sera employable qu'après reconstruction du catalogue`)
      peseeIncomplete = true
      continue
    }
    if (!forme) {
      const bloquee = formesBloquees.get(cle)
      const motif = bloquee ? `bloquée : ${bloquee.motifs.join(' ; ')}` : 'absente du vocabulaire'
      if (ingredient.optional) { reserves.push(`« ${libelle} » ${motif} (optionnel, ignoré au calcul)`); continue }
      dire(`« ${libelle} » ${motif}`)
      continue
    }
    if (!forme.unites.includes(ingredient.unit)) {
      dire(`« ${libelle} » ne se convertit pas en « ${ingredient.unit} » (unités admises : ${forme.unites.join(', ')})`)
      continue
    }
    const masse = grammes(ingredient, forme)
    if (masse == null) { dire(`« ${libelle} » : quantité ou conversion inexploitable`); continue }
    if (ingredient.optional) continue
    masseTotale += masse
    kcal += masse * forme.per100g.kcal / 100
    proteines += masse * forme.per100g.proteinG / 100
    glucides += masse * forme.per100g.carbsG / 100
    lipides += masse * forme.per100g.fatG / 100
  }

  // ── vraisemblance ───────────────────────────────────────────────────────
  if (peseeIncomplete) {
    reserves.push('vraisemblance nutritionnelle non vérifiée : des ingrédients arbitrés ne sont pas encore au catalogue — à revalider après reconstruction')
  } else if (portions > 0 && masseTotale > 0) {
    const parPart = kcal / portions
    const grammesParPart = masseTotale / portions
    // Une tapenade se sert à la cuillère, une anchoïade à la tartine : leur
    // portion n'a pas à peser ce que pèse un plat. Le plancher suit donc le rôle
    // d'assiette déclaré, au lieu de traiter un condiment comme un repas raté.
    const role = recette.plate?.role
    const planchezGrammes = role === 'component' ? 20 : (role === 'side' ? 60 : 80)
    const plancherKcal = role === 'component' ? 30 : (role === 'side' ? 60 : 80)
    if (parPart < plancherKcal) dire(`${Math.round(parPart)} kcal par part — trop peu, vérifiez les quantités`)
    if (parPart > 1600) dire(`${Math.round(parPart)} kcal par part — invraisemblable`)
    if (grammesParPart < planchezGrammes) dire(`${Math.round(grammesParPart)} g par part — portion irréaliste pour un rôle « ${role} »`)
    if (grammesParPart > 1200) reserves.push(`${Math.round(grammesParPart)} g par part — portion très généreuse`)
    // L'identité énergétique doit tenir : si elle dérape, une composition est fausse.
    const reconstruit = 4 * proteines + 4 * glucides + 9 * lipides
    if (kcal > 0 && Math.abs(reconstruit - kcal) / kcal > 0.35) {
      reserves.push(`écart de ${Math.round(Math.abs(reconstruit - kcal) / kcal * 100)} % entre l'énergie et les macros`)
    }
  }

  // ── le nom annonce-t-il un ingrédient qui n'y est pas ? ─────────────────
  //
  // Contrôle né d'une vraie faute : une recette « Moules marinières » est
  // passée avec échalote, vin blanc, beurre et persil — et aucune moule. Les
  // étapes en parlaient, la liste d'ingrédients n'en portait pas, et le calcul
  // nutritionnel tombait dans les bornes parce que le pain et le beurre
  // suffisaient à faire le poids. Le premier mot significatif d'un nom de plat
  // en désigne presque toujours soit l'ingrédient principal, soit le type de
  // préparation. S'il n'est ni l'un ni l'autre, quelque chose manque.
  const motsDuNom = normalizeName(famille).split(' ').filter((mot) => mot.length >= 4)
  const premier = motsDuNom[0]
  const racineDuPremier = premier ? premier.replace(/s$/, '') : ''
  // Le nom du plat est souvent au pluriel — « Paupiettes de veau », « Œufs
  // mimosa ». Interroger la liste des types avec le mot tel quel la manque.
  const estUnTypeDePlat = TYPES_DE_PLAT.has(premier) || TYPES_DE_PLAT.has(racineDuPremier)
  if (premier && !estUnTypeDePlat && lexiqueAliments.has(racineDuPremier)) {
    const contexte = normalizeName([
      ...ingredients.map((ingredient) => ingredient.form),
      recette.category, recette.cuisine_origin,
    ].filter(Boolean).join(' '))
    if (!contexte.includes(racineDuPremier)) {
      dire(`le nom annonce « ${premier} », introuvable dans les ingrédients — ingrédient principal manquant ?`)
    }
  }

  // ── étapes et techniques ────────────────────────────────────────────────
  const etapes = recette.steps || []
  if (etapes.length < 3) dire(`${etapes.length} étape(s) — trois au minimum`)
  etapes.forEach((etape, i) => {
    if (Number(etape.n) !== i + 1) dire(`étape ${i + 1} numérotée « ${etape.n} »`)
    if (String(etape.instruction || '').trim().length < 15) dire(`étape ${i + 1} trop courte pour être exécutable`)
  })
  if (!(recette.techniques || []).length) dire('aucune technique déclarée')

  // ── empreinte sensorielle ───────────────────────────────────────────────
  const sensoriel = recette.sensory || {}
  if (!String(sensoriel.profile || '').trim()) dire('sensory.profile absent')
  const scores = sensoriel.scores || {}
  for (const cle of SCORES) {
    const valeur = Number(scores[cle])
    if (!Number.isInteger(valeur) || valeur < 0 || valeur > 5) dire(`sensory.scores.${cle} = « ${scores[cle] }» hors 0-5`)
  }
  if (Object.keys(scores).length !== SCORES.length) dire(`sensory.scores porte ${Object.keys(scores).length} clés au lieu de ${SCORES.length}`)
  if ((sensoriel.dominant_flavors || []).length < 2) dire('moins de deux saveurs dominantes')
  if ((sensoriel.aroma_families || []).length < 2) dire('moins de deux familles aromatiques')
  if (!(sensoriel.target_textures || []).length) dire('aucune texture cible')
  if ((sensoriel.identity_guardrails || []).length < 2) dire('moins de deux garde-fous d’identité')
  const signatures = sensoriel.signature_ingredients || []
  if (signatures.length < 2) dire('moins de deux ingrédients signature')
  const libelles = new Set(ingredients.map((ingredient) => ingredient.form))
  for (const signature of signatures) {
    if (!libelles.has(signature)) dire(`ingrédient signature « ${signature} » absent de la liste d'ingrédients`)
  }

  // ── conservation et allergènes ──────────────────────────────────────────
  if (String(recette.conservation || '').trim().length < 15) dire('conservation absente ou trop vague')
  if (!Array.isArray(recette.allergens)) dire('allergens doit être une liste, même vide')
  if (!Array.isArray(recette.sources) || !recette.sources.length) dire('aucune source déclarée')

  rapports.push({
    rang,
    code: code || `(sans code, rang ${rang})`,
    famille,
    valide: refus.length === 0,
    refus,
    reserves,
    // Rien plutôt qu'un total amputé : afficher « 215 kcal » pour une poule au
    // pot dont la poule n'est pas comptée serait pire que ne rien afficher.
    nutrition: (portions > 0 && !peseeIncomplete) ? {
      kcal_par_part: Math.round(kcal / portions),
      proteines_par_part: Math.round(proteines / portions * 10) / 10,
      grammes_par_part: Math.round(masseTotale / portions),
    } : null,
    peseeIncomplete,
  })
}

const valides = rapports.filter((rapport) => rapport.valide)
const refuses = rapports.filter((rapport) => !rapport.valide)

if (flags.includes('--json')) {
  process.stdout.write(`${JSON.stringify({ total: rapports.length, valides: valides.length, rapports }, null, 2)}\n`)
} else {
  console.log(`Lot : ${rapports.length} recettes — ${valides.length} valides, ${refuses.length} refusées\n`)
  for (const rapport of refuses) {
    console.log(`✗ ${rapport.code}  ${rapport.famille}`)
    for (const motif of rapport.refus) console.log(`     ${motif}`)
  }
  const avecReserves = valides.filter((rapport) => rapport.reserves.length)
  if (avecReserves.length) {
    console.log(`\n${avecReserves.length} recettes valides avec réserve :`)
    for (const rapport of avecReserves) {
      console.log(`  ~ ${rapport.code} — ${rapport.reserves.join(' ; ')}`)
    }
  }
  if (valides.length) {
    console.log('\nValides :')
    for (const rapport of valides) {
      const n = rapport.nutrition
      console.log(`  ✓ ${rapport.code}  ${rapport.famille.slice(0, 40).padEnd(42)} ${n ? `${n.kcal_par_part} kcal · ${n.proteines_par_part} g prot · ${n.grammes_par_part} g` : (rapport.peseeIncomplete ? 'nutrition à revalider après reconstruction' : '')}`)
    }
  }
}

process.exit(refuses.length ? 1 : 0)
