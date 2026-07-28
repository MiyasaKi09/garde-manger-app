/**
 * Trouve les URL publiées d'un plat, au lieu de les deviner.
 *
 * Deviner une URL de recette ne marche pas : on tombe sur un 404, ou pire, sur
 * une page qui existe mais parle d'autre chose. Ce script interroge donc les
 * moteurs de recherche internes des sites qui acceptent la lecture automatique,
 * et ne retient que les liens dont le slug porte réellement les mots du plat.
 *
 * Les sites ont été testés un par un : tous ne publient pas de balisage
 * schema.org/Recipe, et tous n'acceptent pas curl. Seuls ceux qui font les deux
 * sont listés ici — la liste est un constat de terrain, pas une préférence.
 *
 *   node scripts/data/recipes/find-recipe-urls.mjs "Veau Marengo" "Riz cantonais"
 *   node scripts/data/recipes/find-recipe-urls.mjs --plan plan.json "Veau Marengo"
 *
 * La sortie est un plan directement consommable par scrape-recipe-sources.mjs.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const AGENT = 'Mozilla/5.0 (compatible; MykoRecipeResearch/1.0)'

const recuperer = (url) => {
  try {
    return execFileSync('curl', [
      '-sL', '-A', AGENT, '--max-time', '25', '--compressed', url,
    ], { maxBuffer: 32 * 1024 * 1024 }).toString('utf8')
  } catch {
    return ''
  }
}

const sansAccents = (texte) => texte.normalize('NFD').replace(/[̀-ͯ]/g, '')

const slugifier = (nom) => sansAccents(nom.toLowerCase())
  .replace(/œ/g, 'oe').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Les mots vides ne discriminent rien : « de », « au », « à la »… */
const MOTS_VIDES = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'a', 'et', 'en', 'sauce',
  'un', 'une', 'sur', 'dans', 'pour', 'avec',
])

const motsSignifiants = (nom) => slugifier(nom).split('-').filter((mot) => mot.length > 2 && !MOTS_VIDES.has(mot))

/**
 * Un lien n'est retenu que si son slug porte tous les mots signifiants du plat.
 * Sans cette exigence, une recherche « veau Marengo » ramène « terre et mer
 * Marengo », qui est un autre plat.
 */
const correspond = (lien, mots) => {
  const slug = sansAccents(lien.toLowerCase())
  return mots.every((mot) => slug.includes(mot) || slug.includes(mot.replace(/s$/, '')))
}

const SITES = [
  {
    nom: 'marmiton.org',
    recherche: (q) => `https://www.marmiton.org/recettes/recherche.aspx?aqt=${encodeURIComponent(q)}`,
    motif: /\/recettes\/recette_[a-z0-9\-_]+\.aspx/gi,
    absolu: (lien) => `https://www.marmiton.org${lien}`,
  },
  {
    nom: 'chefsimon.com',
    recherche: (q) => `https://chefsimon.com/recettes/search?search_string=${encodeURIComponent(q)}`,
    motif: /\/gourmets\/[a-z0-9\-]+\/recettes\/[a-z0-9\-]+/gi,
    absolu: (lien) => `https://chefsimon.com${lien}`,
  },
  {
    nom: '750g.com',
    recherche: (q) => `https://www.750g.com/recherche?q=${encodeURIComponent(q)}`,
    motif: /\/[a-z0-9\-]+-r\d+\.htm/gi,
    absolu: (lien) => `https://www.750g.com${lien}`,
  },
]

const args = process.argv.slice(2)
let sortie = null
const plats = []
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--plan') { sortie = args[i + 1]; i += 1; continue }
  plats.push(args[i])
}
if (!plats.length) {
  console.error('Usage : find-recipe-urls.mjs [--plan plan.json] "Nom du plat" …')
  process.exit(2)
}

const plan = []
for (const plat of plats) {
  const mots = motsSignifiants(plat)
  const urls = []
  for (const site of SITES) {
    const html = recuperer(site.recherche(plat))
    if (!html) continue
    const liens = [...new Set(html.match(site.motif) || [])]
    const retenus = liens.filter((lien) => correspond(lien, mots)).slice(0, 3)
    urls.push(...retenus.map(site.absolu))
  }
  plan.push({ slug: slugifier(plat), dish: plat, urls })
  const detail = urls.length ? urls.map((u) => new URL(u).hostname.replace(/^www\./, '')).join(', ') : 'rien'
  console.log(`${urls.length ? '✓' : '✗'} ${plat.padEnd(34)} ${urls.length} URL — ${detail}`)
}

const texte = `${JSON.stringify(plan, null, 1)}\n`
if (sortie) {
  writeFileSync(sortie, texte)
  console.log(`\nPlan écrit dans ${sortie}`)
} else {
  console.log(`\n${texte}`)
}
