/**
 * Collecte les sources d'une recette : plusieurs sites, données brutes, empreintes.
 *
 * Une recette du corpus ne doit pas sortir d'une mémoire. Elle se construit en
 * confrontant plusieurs versions publiées, et le dossier qu'écrit ce script est
 * la trace de cette confrontation : qui dit quoi, avec quelles quantités, et à
 * quelle date on l'a lu.
 *
 * CE QUI EST REPRIS ET CE QUI NE L'EST PAS
 * Les listes d'ingrédients et leurs quantités sont des faits : une daube porte
 * du bœuf, du vin et des olives, et aucun site ne possède ce constat. On les
 * relève donc, on les compare et on en tire une médiane. Le TEXTE des étapes,
 * lui, est une œuvre — il n'est jamais recopié dans le corpus. Le dossier le
 * conserve à titre de preuve de lecture ; la recette publiée le reformule.
 *
 * L'attrition est normale : selon les sites, entre un tiers et la moitié des
 * pages refusent la lecture automatique ou ne portent aucun balisage Recipe.
 * Le script le dit plutôt que de faire comme si.
 *
 *   node scripts/data/recipes/scrape-recipe-sources.mjs plan.json
 *
 * plan.json : [{ "slug": "daube-provencale", "dish": "Daube provençale",
 *                "urls": ["https://…", "https://…"] }]
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const OUT_DIR = join(ROOT, 'data', 'recipes', 'sources')

const [plan] = process.argv.slice(2)
if (!plan) {
  console.error('Usage : scrape-recipe-sources.mjs <plan.json>')
  process.exit(2)
}

const AGENT = 'Mozilla/5.0 (compatible; MykoRecipeResearch/1.0)'

const recuperer = (url) => {
  try {
    const html = execFileSync('curl', [
      '-sL', '-A', AGENT, '--max-time', '30', '--compressed', url,
    ], { maxBuffer: 32 * 1024 * 1024 }).toString('utf8')
    return html.length > 500 ? html : null
  } catch {
    return null
  }
}

/** Le balisage schema.org/Recipe, quand le site le publie. */
const extraireRecette = (html) => {
  const blocs = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const [, brut] of blocs) {
    let donnees
    try { donnees = JSON.parse(brut.trim()) } catch { continue }
    const candidats = Array.isArray(donnees) ? donnees : (donnees['@graph'] || [donnees])
    for (const objet of candidats) {
      const type = objet?.['@type']
      const estRecette = type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))
      if (!estRecette) continue
      const etapes = []
      const aplatir = (valeur) => {
        if (!valeur) return
        if (typeof valeur === 'string') { etapes.push(valeur); return }
        if (Array.isArray(valeur)) { valeur.forEach(aplatir); return }
        if (valeur.text) etapes.push(valeur.text)
        if (valeur.itemListElement) aplatir(valeur.itemListElement)
      }
      aplatir(objet.recipeInstructions)
      return {
        nom: objet.name || null,
        portions: objet.recipeYield ?? null,
        duree_preparation: objet.prepTime || null,
        duree_cuisson: objet.cookTime || null,
        // Certains sites publient une chaîne unique au lieu d'un tableau.
        ingredients: [objet.recipeIngredient || objet.ingredients || []].flat()
          .map((ligne) => String(ligne).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).trim())
          .filter(Boolean),
        // Conservées comme preuve de lecture, PAS pour être recopiées.
        etapes_source: etapes.map((texte) => String(texte).trim()).filter(Boolean),
      }
    }
  }
  return null
}

const plans = JSON.parse(readFileSync(plan, 'utf8'))
mkdirSync(OUT_DIR, { recursive: true })

let totalSources = 0
let totalPlats = 0
const echecs = []

for (const item of plans) {
  const sources = []
  for (const url of item.urls || []) {
    const html = recuperer(url)
    if (!html) { echecs.push({ dish: item.dish, url, motif: 'page inaccessible' }); continue }
    const recette = extraireRecette(html)
    if (!recette || !recette.ingredients.length) {
      echecs.push({ dish: item.dish, url, motif: 'aucun balisage Recipe exploitable' })
      continue
    }
    sources.push({
      url,
      site: new URL(url).hostname.replace(/^www\./, ''),
      ...recette,
      sha256_page: createHash('sha256').update(html).digest('hex').slice(0, 16),
    })
  }
  if (!sources.length) {
    console.log(`✗ ${item.dish} — aucune source exploitable`)
    continue
  }
  const chemin = join(OUT_DIR, `${item.slug}.json`)
  writeFileSync(chemin, `${JSON.stringify({
    dish: item.dish,
    slug: item.slug,
    sources_count: sources.length,
    avertissement: "Les étapes source sont conservées comme preuve de lecture. La recette du corpus les REFORMULE ; elle ne les recopie pas.",
    sources,
  }, null, 2)}\n`)
  totalSources += sources.length
  totalPlats += 1
  console.log(`✓ ${item.dish} — ${sources.length} source(s) : ${sources.map((s) => s.site).join(', ')}`)
}

console.log(`\n${totalPlats} plat(s) documenté(s), ${totalSources} source(s) relevée(s).`)
if (echecs.length) {
  console.log(`${echecs.length} URL sans suite :`)
  for (const echec of echecs) console.log(`   ${echec.motif.padEnd(34)} ${echec.url}`)
}
if (!existsSync(OUT_DIR)) process.exit(1)
