/**
 * Tire des quantités médianes d'un dossier de sources.
 *
 * Chaque site publie SA version : l'un met 1,2 kg de veau pour 6, l'autre 800 g
 * pour 4. Ni l'un ni l'autre n'est « la » recette. Ce qu'on peut en tirer, en
 * revanche, c'est un ordre de grandeur défendable : ramener chaque source à la
 * portion, puis prendre la médiane. La médiane et non la moyenne, parce qu'une
 * seule source aberrante — un site qui compte en grammes ce que les autres
 * comptent en pièces — ne doit pas déplacer le résultat.
 *
 * CE QUE LE SCRIPT NE FAIT PAS : décider à quel ingrédient du catalogue
 * correspond « 2 carottes ». Il propose des candidats et s'arrête là. Le
 * rapprochement d'un texte libre vers une forme canonique est un arbitrage, et
 * un arbitrage silencieux est une erreur qu'on ne retrouve jamais.
 *
 *   node scripts/data/recipes/synthesize-source-quantities.mjs veau-marengo
 *   node scripts/data/recipes/synthesize-source-quantities.mjs --tous --json out.json
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const DIR = join(ROOT, 'data', 'recipes', 'sources')
const CATALOGUE = join(ROOT, 'scripts', 'data', 'out', 'recipe-food-catalog.json')

const normaliser = (texte) => String(texte || '')
  .toLowerCase()
  .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/['’]/g, ' ')
  .replace(/[^a-z0-9,.]+/g, ' ')
  .trim()

/**
 * Les volumes deviennent des grammes via la densité de l'ingrédient ; faute de
 * densité connue, on retient celle de l'eau. L'écart est réel pour l'huile
 * (0,92) et la farine (0,55), négligeable pour un bouillon ou un vin.
 */
const UNITES = {
  g: { grammes: 1 }, gr: { grammes: 1 }, gramme: { grammes: 1 }, grammes: { grammes: 1 },
  kg: { grammes: 1000 },
  mg: { grammes: 0.001 },
  ml: { millilitres: 1 }, cl: { millilitres: 10 }, dl: { millilitres: 100 },
  l: { millilitres: 1000 }, litre: { millilitres: 1000 }, litres: { millilitres: 1000 },
  cas: { millilitres: 15 }, cac: { millilitres: 5 },
  pincee: { grammes: 0.5 }, pincees: { grammes: 0.5 },
}

/**
 * Les unités de comptage françaises : une gousse, un brin, une tranche. Le
 * catalogue porte déjà `grams_per_unit` pour 129 formes, et il fait foi ; ces
 * poids-ci ne servent qu'à défaut, et la synthèse les signale comme des
 * hypothèses. Ils viennent des ordres de grandeur usuels en cuisine, pas d'une
 * table de référence — d'où le marquage.
 */
const PIECES = {
  gousse: 5, gousses: 5,
  brin: 2, brins: 2, branche: 4, branches: 4,
  feuille: 0.3, feuilles: 0.3,
  bouquet: 12, bouquets: 12,
  tranche: 25, tranches: 25,
  sachet: 8, sachets: 8,
  cube: 10, cubes: 10,
  boite: 400, boites: 400,
  filet: 5,
}

/** Formulations longues, ramenées à leur abréviation avant analyse. */
const TOURNURES = [
  [/cuill(?:ere|eres|er)?\s*(?:a|à)\s*soupe/g, 'cas'],
  [/cuill(?:ere|eres|er)?\s*(?:a|à)\s*cafe/g, 'cac'],
  [/c\.?\s*(?:a|à)\s*s\.?\b/g, 'cas'],
  [/c\.?\s*(?:a|à)\s*c\.?\b/g, 'cac'],
  [/cuilleree?s?\b/g, 'cas'],
]

/** Les fractions écrites en toutes lettres, fréquentes dans les listes. */
const FRACTIONS = { demi: 0.5, demie: 0.5, quart: 0.25, tiers: 0.3333 }

const NOMBRES = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7,
  huit: 8, neuf: 9, dix: 10, douze: 12, quinze: 15, vingt: 20,
}

/**
 * Découpe « 1,2 kg de veau » en quantité, unité et désignation. Renvoie une
 * quantité nulle quand la ligne n'en porte pas (« sel », « poivre ») : ce n'est
 * pas une erreur, c'est un assaisonnement au jugé.
 */
const analyserLigne = (brut) => {
  let texte = normaliser(brut).replace(/(\d),(\d)/g, '$1.$2')
  for (const [motif, court] of TOURNURES) texte = texte.replace(motif, court)

  let quantite = null
  const chiffres = texte.match(/^(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+))?/)
  if (chiffres) {
    quantite = Number(chiffres[1])
    if (chiffres[2]) quantite /= Number(chiffres[2])
    texte = texte.slice(chiffres[0].length).trim()
  } else {
    const mot = texte.split(' ')[0]
    if (NOMBRES[mot] !== undefined) { quantite = NOMBRES[mot]; texte = texte.slice(mot.length).trim() }
    else if (FRACTIONS[mot] !== undefined) { quantite = FRACTIONS[mot]; texte = texte.slice(mot.length).trim() }
  }

  // Le point n'était gardé que pour lire les décimales ; passée la quantité, il
  // ne fait plus que coller aux mots — « 6 gousses d'ail. » ne trouvait pas l'ail.
  texte = texte.replace(/\./g, ' ').replace(/\s+/g, ' ').trim()

  let unite = null
  let piece = null
  const premier = texte.split(' ')[0]?.replace(/\.$/, '')
  if (UNITES[premier]) { unite = premier; texte = texte.slice(texte.split(' ')[0].length).trim() }
  else if (PIECES[premier]) { piece = premier; texte = texte.slice(premier.length).trim() }

  // « 1 kg de veau » → on retire l'article de liaison
  texte = texte.replace(/^(?:de la|de l|du|des|de|d|a la|au|aux|en)\s+/, '').trim()
  texte = traduire(texte)

  return { quantite, unite, piece, designation: texte, brut }
}

/**
 * Ce que les sites écrivent contre ce que le catalogue nomme. Une bonne moitié
 * des lignes non rattachées ne réclamaient aucun nouvel ingrédient : « maïzena »
 * est de la fécule de maïs, « nuoc mam » de la sauce poisson, « ventrèche » du
 * lardon — tous déjà au catalogue. Créer une forme pour chacun aurait dupliqué
 * le concept et cassé les graphes de diversité du planificateur, qui ne
 * rapprochent pas deux synonymes. On traduit donc à la lecture.
 *
 * Ces équivalences valent pour la LECTURE des sources, pas pour la rédaction :
 * une recette publiée nomme toujours la forme canonique.
 */
const SYNONYMES = [
  [/\bmaizena\b|\bfecule de mais\b/g, 'fecule mais'],
  [/\bnuoc ?mam\b|\bsauce de poisson\b/g, 'sauce poisson'],
  [/\bventreche\b|\bpancetta\b|\blard fume\b|\bpoitrine fumee\b/g, 'lardon fume'],
  [/\bvol.?au.?vent\b|\bbouchee.? feuilletee.?\b|\bcroute feuilletee\b/g, 'pate feuilletee'],
  [/\bcoquillettes?\b|\bmacaronis?\b|\bpennes?\b|\bcoudes?\b|\btorsades?\b/g, 'pates seches courtes'],
  [/\blinguines?\b|\btagliatelles?\b|\bspaghettis?\b/g, 'pates seches'],
  [/\bcebettes?\b|\boignons? nouveaux?\b/g, 'ciboule'],
  [/\bdindonneau\b/g, 'dinde'],
  [/\bviande hachee\b|\bboeuf hache\b|\bsteak hache\b/g, 'boeuf hache 15'],
  [/\bcrevettes?\b/g, 'crevette'],
  // Les noms de découpe vendue en boucherie. « Sauté de porc » n'est pas une
  // préparation, c'est de l'épaule détaillée en cubes — et sûrement pas du
  // haché, vers quoi la lecture penchait faute de mieux.
  [/\bsaute de porc\b/g, 'epaule de porc'],
  [/\bporc (?:coupe|en de|en cube|en morceau|en laniere)\w*\b/g, 'epaule de porc'],
  [/\bsaute de veau\b|\bsauté de veau\b/g, 'epaule de veau'],
  [/\bblanquette de (?:dinde|veau)\b/g, 'escalope de dinde'],
]

const traduire = (texte) => SYNONYMES.reduce((acc, [motif, cible]) => acc.replace(motif, cible), texte)

const catalogue = JSON.parse(readFileSync(CATALOGUE, 'utf8')).forms

/**
 * Le pluriel français ne se réduit pas au « s » : poireau fait poireaux, chou
 * fait choux. Comparer les deux côtés désaccordés fait manquer des formes
 * pourtant présentes au catalogue — « 3 poireaux » ne trouvait pas « Poireau
 * cru ». On ramène donc chaque mot au singulier avant de comparer.
 */
const singulier = (mot) => mot.replace(/(?:eaux|aux)$/, 'eau').replace(/x$/, '').replace(/s$/, '')

/**
 * Les mots d'état ne désignent aucun aliment. Les laisser servir de clé fait
 * apparier n'importe quoi : « 400 g de flageolets secs » a trouvé « Spaghetti
 * secs », les deux n'ayant en commun que le mot « secs ». Un rapprochement doit
 * tenir sur le nom de l'aliment, jamais sur la façon dont il est conservé.
 */
const MOTS_VIDES = new Set([
  'cru', 'crue', 'cuit', 'cuite', 'frais', 'fraiche', 'sec', 'seche', 'en', 'de',
  'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'a', 'et', 'nature', 'entier',
  'entiere', 'conserve', 'surgele', 'surgelee', 'moulu', 'moulue', 'rape',
  'rapee', 'egoutte', 'egouttee', 'appertise', 'fumee', 'fume', 'liquide',
  'doux', 'douce', 'demi', 'fine', 'fin', 'gros', 'grosse', 'petit', 'petite',
])

// Les clés passent au singulier avant d'être filtrées : « secs » doit être
// reconnu comme « sec », sinon le filtre le laisse passer.
const clesDe = (nom) => normaliser(nom).split(' ')
  .map((mot) => singulier(mot))
  .filter((m) => m.length > 2 && !MOTS_VIDES.has(m))

/**
 * Combien de recettes emploient déjà chaque forme. À égalité de recouvrement,
 * c'est ce qui départage : « poivre » sans autre précision désigne le poivre
 * que le corpus utilise partout, pas le poivre du Sichuan.
 */
const VOCABULAIRE = join(ROOT, 'data', 'recipes', 'authoring-vocabulary.json')
const usage = new Map()
for (const forme of JSON.parse(readFileSync(VOCABULAIRE, 'utf8')).formes_employables) {
  usage.set(forme.nom, forme.recettes_actuelles || 0)
}

/**
 * Le catalogue ne contient que les formes qu'une recette emploie déjà — c'est
 * son rôle. Mais on écrit ici des recettes NOUVELLES, dont les ingrédients
 * viennent d'être arbitrés et qu'aucune recette n'emploie encore : ils seraient
 * invisibles, et on rouvrirait un arbitrage déjà tranché. Le registre des
 * mappings, lui, liste tout ce qu'on sait nourrir. On complète donc avec lui.
 */
const REGISTRE = join(ROOT, 'data', 'foods', 'recipe-food-mappings-v3.json')
const ARBITRAGES = join(ROOT, 'data', 'foods', 'arbitrations')

const nomsArbitres = new Map()
for (const fichier of readdirSync(ARBITRAGES).filter((f) => f.endsWith('.json'))) {
  const lot = JSON.parse(readFileSync(join(ARBITRAGES, fichier), 'utf8'))
  for (const decision of lot.decisions || lot.confirmees || []) {
    if (decision.cle && decision.forme) nomsArbitres.set(decision.cle, decision.forme)
  }
}

const INDEX = catalogue.map((forme) => ({
  nom: forme.canonical_name,
  cles: clesDe(forme.canonical_name),
  conversion: forme.conversion || {},
  unites: forme.units_used || [],
  confiance: forme.confidence,
  usage: usage.get(forme.canonical_name) || 0,
}))

const dejaIndexees = new Set(INDEX.map((f) => normaliser(f.nom)))
const registre = JSON.parse(readFileSync(REGISTRE, 'utf8')).mappings || {}
for (const [cle, entree] of Object.entries(registre)) {
  if (dejaIndexees.has(cle)) continue
  const nom = nomsArbitres.get(cle) || cle
  INDEX.push({
    nom,
    cles: clesDe(nom),
    conversion: {},
    unites: [],
    confiance: entree.confidence || 'B',
    // Aucune recette ne l'emploie encore : c'est un fait, pas un défaut.
    usage: 0,
    inedite: true,
  })
}

/**
 * Exiger que TOUS les mots-clés d'une forme figurent dans la ligne ne marche
 * pas : « 75 g de beurre » ne contient pas « doux », et ne trouverait donc
 * jamais « Beurre doux ». On note plutôt le recouvrement, et on propose les
 * meilleurs candidats — la ligne la plus précise gagne, à égalité de tête.
 */
const contient = (texte, mot) => {
  const cible = singulier(mot)
  return texte.split(' ').some((present) => singulier(present) === cible)
}

const candidats = (designation) => {
  const texte = ` ${designation} `
  const notes = []
  for (const forme of INDEX) {
    if (!forme.cles.length) continue
    const trouves = forme.cles.filter((cle) => contient(texte, cle))
    if (!trouves.length) continue
    // « Épaule de veau crue » reste proposable pour une ligne qui dit seulement
    // « veau », mais passe derrière les formes dont la tête, elle, correspond.
    notes.push({ forme, trouves: trouves.length, tete: contient(texte, forme.cles[0]) ? 1 : 0 })
  }
  return notes
    .sort((a, b) => b.tete - a.tete
      || b.trouves - a.trouves
      // À recouvrement égal, c'est l'usage du corpus qui tranche. Compter les
      // mots ne suffit pas : « Poivre du Sichuan » est plus court que « Poivre
      // noir moulu » et serait choisi pour une ligne qui dit juste « poivre »,
      // alors qu'il n'est employé nulle part et reste un proxy non publiable.
      || b.forme.usage - a.forme.usage
      || a.forme.cles.length - b.forme.cles.length)
    .slice(0, 4)
    .map((n) => n.forme)
}

/** « 6 personnes », « pour 4 », « 4 parts » → 6, 4, 4. */
const portionsDe = (valeur) => {
  const texte = normaliser(Array.isArray(valeur) ? valeur[0] : valeur)
  const trouve = texte.match(/(\d+)/)
  return trouve ? Number(trouve[1]) : null
}

const mediane = (valeurs) => {
  const tri = [...valeurs].sort((a, b) => a - b)
  const milieu = Math.floor(tri.length / 2)
  return tri.length % 2 ? tri[milieu] : (tri[milieu - 1] + tri[milieu]) / 2
}

const args = process.argv.slice(2)
const sortieJson = args.includes('--json') ? args[args.indexOf('--json') + 1] : null
const slugs = args.filter((a) => !a.startsWith('--') && a !== sortieJson)
const fichiers = (slugs.length && !args.includes('--tous'))
  ? slugs.map((s) => `${s}.json`)
  : readdirSync(DIR).filter((f) => f.endsWith('.json'))

const rapport = []

for (const fichier of fichiers.sort()) {
  const dossier = JSON.parse(readFileSync(join(DIR, fichier), 'utf8'))
  const parForme = new Map()
  const orphelines = []
  let portionsRetenues = []

  for (const source of dossier.sources) {
    const portions = portionsDe(source.portions)
    if (portions) portionsRetenues.push(portions)
    for (const ligne of source.ingredients || []) {
      const { quantite, unite, piece, designation, brut } = analyserLigne(ligne)
      const propositions = candidats(designation)
      if (!propositions.length) { orphelines.push({ site: source.site, ligne: brut }); continue }
      const forme = propositions[0]

      let grammes = null
      let suppose = false
      if (quantite !== null) {
        if (unite && UNITES[unite].grammes) grammes = quantite * UNITES[unite].grammes
        else if (unite && UNITES[unite].millilitres) {
          const densite = forme.conversion.density_g_per_ml ?? 1
          grammes = quantite * UNITES[unite].millilitres * densite
        } else if (forme.conversion.grams_per_unit) {
          grammes = quantite * forme.conversion.grams_per_unit
        } else if (piece) {
          grammes = quantite * PIECES[piece]
          suppose = true
        }
      }

      const entree = parForme.get(forme.nom) || {
        forme: forme.nom, confiance: forme.confiance, citations: 0, sites: new Set(),
        grammes: [], sansQuantite: 0, supposes: 0, nonConvertis: [],
        alternatives: propositions.slice(1).map((p) => p.nom), exemples: [],
      }
      // Une même source peut citer deux fois l'eau : c'est un site, pas deux.
      entree.sites.add(source.site + source.url)
      entree.citations = entree.sites.size
      if (grammes !== null && portions) entree.grammes.push(grammes / portions)
      // « sel » sans nombre est un assaisonnement au jugé. « 2 oignons » est une
      // quantité bien réelle qu'on ne sait pas peser : les deux cas n'appellent
      // pas la même suite, et les confondre ferait disparaître le second.
      else if (quantite === null) entree.sansQuantite += 1
      else entree.nonConvertis.push(brut)
      if (suppose) entree.supposes += 1
      if (entree.exemples.length < 3) entree.exemples.push(brut)
      parForme.set(forme.nom, entree)
    }
  }

  const total = dossier.sources.length
  const formes = [...parForme.values()]
    .map(({ sites, ...e }) => ({
      ...e,
      presence: `${e.citations}/${total}`,
      g_par_portion: e.grammes.length ? Math.round(mediane(e.grammes) * 10) / 10 : null,
      etendue: e.grammes.length > 1
        ? [Math.round(Math.min(...e.grammes)), Math.round(Math.max(...e.grammes))]
        : null,
    }))
    .sort((a, b) => b.citations - a.citations || (b.g_par_portion ?? 0) - (a.g_par_portion ?? 0))

  rapport.push({
    dish: dossier.dish,
    slug: dossier.slug,
    sources: total,
    portions_sources: portionsRetenues,
    formes,
    orphelines,
  })
}

if (sortieJson) {
  writeFileSync(sortieJson, `${JSON.stringify(rapport, null, 1)}\n`)
  console.log(`Synthèse écrite dans ${sortieJson}`)
}

for (const plat of rapport) {
  const socle = plat.formes.filter((f) => f.citations >= Math.ceil(plat.sources / 2))
  console.log(`\n━━ ${plat.dish}  (${plat.sources} sources)`)
  for (const forme of socle) {
    const quantite = forme.g_par_portion === null ? 'au jugé' : `${forme.g_par_portion} g/pers`
    const etendue = forme.etendue ? ` [${forme.etendue[0]}–${forme.etendue[1]}]` : ''
    const doute = forme.confiance === 'C' ? ' ⚠ proxy C' : ''
    const hypothese = forme.supposes ? ` ~${forme.supposes} poids de pièce supposé` : ''
    console.log(`   ${forme.presence.padStart(5)}  ${forme.forme.padEnd(34)} ${quantite}${etendue}${doute}${hypothese}`)
  }
  const marge = plat.formes.length - socle.length
  if (marge) console.log(`   … ${marge} forme(s) minoritaire(s)`)
  if (plat.orphelines.length) {
    const uniques = [...new Set(plat.orphelines.map((o) => o.ligne))]
    console.log(`   ✗ ${uniques.length} ligne(s) sans forme au catalogue : ${uniques.slice(0, 6).join(' | ')}`)
  }
}
