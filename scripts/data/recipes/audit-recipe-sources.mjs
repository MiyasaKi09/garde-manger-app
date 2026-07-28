/**
 * Vérifie que chaque dossier de sources tient debout avant qu'on en écrive une recette.
 *
 * Un moteur de recherche interne ramène ce qui ressemble, pas ce qu'on a demandé :
 * chercher « gratin de poireaux » rapporte un gratin de panais, un gratin au
 * saumon, un gratin de pâtes. Rien dans le dossier ne signale l'écart — sauf ici.
 *
 * Trois exigences, et la raison de chacune :
 *   1. deux sources au moins, sur deux sites distincts. Une seule version publiée
 *      n'est pas un fait vérifié, c'est le choix d'un auteur. Deux versions du même
 *      site non plus : la même rédaction, les mêmes habitudes.
 *   2. le titre de chaque source porte les mots du plat. Un plat porte parfois
 *      plusieurs noms (« bœuf mode » et « bœuf-carottes » désignent le même
 *      ragoût) : c'est à déclarer explicitement dans `alias`, pas à laisser passer.
 *   3. des quantités lisibles. Une liste d'ingrédients sans nombres ne permet
 *      aucune médiane.
 *
 *   node scripts/data/recipes/audit-recipe-sources.mjs [slug…]
 *
 * Sort en échec si un dossier ne passe pas : c'est un garde-fou d'écriture,
 * pas un rapport d'information.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const DIR = join(ROOT, 'data', 'recipes', 'sources')

/** La ligature œ doit devenir « oe », sinon « bœuf » ne reconnaît jamais « boeuf ». */
const normaliser = (texte) => String(texte || '')
  .toLowerCase()
  .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const MOTS_VIDES = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'a', 'et', 'en', 'un', 'une',
  'sur', 'dans', 'pour', 'avec', 'recette', 'facile', 'maison', 'rapide', 'ma',
  'mon', 'mes', 'grand', 'mere', 'meilleure', 'express', 'traditionnelle',
])

const motsSignifiants = (nom) => normaliser(nom).split(' ')
  .filter((mot) => mot.length > 2 && !MOTS_VIDES.has(mot))

/**
 * Noms alternatifs légitimes d'un même plat, déclarés à la main. Chaque entrée
 * est une affirmation : « ces deux titres désignent bien la même préparation ».
 */
const ALIAS = {
  'boeuf-mode-carottes': ['boeuf mode', 'boeuf carottes'],
  'poireaux-gratines-a-la-bechamel': ['gratin de poireaux'],
  'langue-de-boeuf-sauce-piquante': ['langue de boeuf sauce tomate piquante'],
  'potage-parmentier': ['soupe poireaux pommes de terre'],
  'lentilles-en-salade-tiede': ['salade de lentilles'],
  // « spaghetti » est une forme de pâtes, et « à la provençale » une sauce tomate.
  'pates-au-thon-et-a-la-tomate': [
    'spaghetti tomate thon', 'spaghetti thon provencale', 'pates provencale thon',
  ],
}

const CHIFFRES = /\d|demi|quart|une? |pinc[ée]e|cuill|gousse|brin|feuille|sachet|bouquet/i

/**
 * Le piège inverse de l'exigence sur les mots : un titre peut porter TOUS les
 * mots du plat et désigner autre chose. « Pâtes au thon et à la tomate » a
 * ramené un gratin, une salade et des mini-quiches — trois plats différents qui
 * contiennent tous des pâtes, du thon et de la tomate. On refuse donc une source
 * dont le titre annonce un type de plat que le nom demandé ne mentionne pas.
 */
const TYPES_DE_PLAT = [
  'gratin', 'salade', 'quiche', 'tarte', 'tourte', 'soupe', 'veloute', 'cake',
  'muffin', 'flan', 'terrine', 'verrine', 'pizza', 'burger', 'wrap', 'sandwich',
  'omelette', 'crumble', 'lasagnes', 'risotto', 'gaufre', 'beignet', 'brochette',
  'papillote', 'samoussa', 'croquette', 'nuggets', 'smoothie', 'confiture',
  'sorbet', 'glace', 'mousse', 'clafoutis', 'brioche', 'pain', 'pate en croute',
]

const demandes = process.argv.slice(2)
const fichiers = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .filter((f) => !demandes.length || demandes.includes(basename(f, '.json')))

let refuses = 0
let acceptes = 0

for (const fichier of fichiers.sort()) {
  const slug = basename(fichier, '.json')
  const dossier = JSON.parse(readFileSync(join(DIR, fichier), 'utf8'))
  const sources = dossier.sources || []
  const attendus = motsSignifiants(dossier.dish)
  const alias = (ALIAS[slug] || []).map(normaliser)

  /**
   * Une source faible n'invalide pas le dossier : elle est simplement écartée du
   * calcul. Ce qui compte, c'est qu'il reste assez de sources solides derrière.
   */
  const remarques = []
  const solides = sources.filter((source) => {
    const titre = normaliser(source.nom)
    if (!titre) { remarques.push(`${source.site} : source sans titre`); return false }
    const couvertParAlias = alias.some((a) => a.split(' ').every((mot) => titre.includes(mot)))
    const manquants = attendus.filter((mot) => !titre.includes(mot) && !titre.includes(mot.replace(/s$/, '')))
    if (manquants.length && !couvertParAlias) {
      remarques.push(`écartée — ${source.site} annonce « ${source.nom} », ${manquants.join(', ')} hors titre`)
      return false
    }
    const typeIntrus = TYPES_DE_PLAT.find((type) => titre.includes(type) && !normaliser(dossier.dish).includes(type))
    if (typeIntrus && !couvertParAlias) {
      remarques.push(`écartée — ${source.site} annonce « ${source.nom} », c'est un ${typeIntrus}`)
      return false
    }
    const lignes = source.ingredients || []
    const chiffrees = lignes.filter((ligne) => CHIFFRES.test(ligne)).length
    if (!lignes.length || chiffrees / lignes.length < 0.5) {
      remarques.push(`écartée — ${source.site} : ${chiffrees}/${lignes.length} lignes chiffrées`)
      return false
    }
    return true
  })

  const sites = new Set(solides.map((s) => s.site))
  const griefs = []
  // Le dépôt est public : la prose des sources n'y a pas sa place, même par mégarde.
  const bavardes = sources.filter((s) => s.etapes_source)
  if (bavardes.length) griefs.push(`${bavardes.length} source(s) portent le texte des étapes — seul l'empreinte doit rester`)
  if (solides.length < 2) griefs.push(`${solides.length} source(s) solide(s) sur ${sources.length} relevée(s)`)
  else if (sites.size < 2) griefs.push(`${solides.length} sources solides mais un seul site (${[...sites][0]})`)

  if (griefs.length) {
    refuses += 1
    console.log(`✗ ${dossier.dish}`)
    for (const grief of griefs) console.log(`    ${grief}`)
    for (const remarque of remarques) console.log(`    ${remarque}`)
  } else {
    acceptes += 1
    const reste = remarques.length ? `  (${remarques.length} écartée(s))` : ''
    console.log(`✓ ${dossier.dish.padEnd(36)} ${solides.length} source(s) / ${sites.size} site(s)${reste}`)
  }
}

console.log(`\n${acceptes} dossier(s) exploitable(s), ${refuses} à reprendre.`)
if (refuses) process.exit(1)
