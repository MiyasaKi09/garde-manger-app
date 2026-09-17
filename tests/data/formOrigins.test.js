import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ORIGINS, isFishOrigin, isMeatOrigin } from '@/lib/domain/foods/origins'
import { ORIGINS as ORIGINS_DU_BUILD } from '../../scripts/data/lib/origins.mjs'
import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'

// Chaque forme du catalogue publié porte une ORIGINE déclarée — par un
// arbitrage (lot21) ou par une case Ciqual sans ambiguïté — et jamais devinée
// sur son nom. Ces tests tiennent le contrat sur TOUT le catalogue : rien
// d'employé par une recette publiable ne reste 'inconnu', les formes carnées
// que la mesure avait trouvées cachées hors des catégories viandes / volailles
// / poissons ressortent animales, et le tofu cesse d'être une viande.

const root = process.cwd()
const lire = (...segments) => JSON.parse(readFileSync(join(root, ...segments), 'utf8'))
const catalog = lire('scripts', 'data', 'out', 'recipe-food-catalog.json')
const report = lire('scripts', 'data', 'out', 'recipe-food-match-report.json')
const corpus = lire('data', 'recipes', 'corpus-v3.json')
const lot21 = lire('data', 'foods', 'arbitrations', 'lot21-origine-des-formes.json')

const parCle = new Map(catalog.forms.map((form) => [form.canonical_name_normalized, form]))
const publiables = new Set(report.recipe_eligibility.filter((recipe) => recipe.eligible_for_publication).map((recipe) => recipe.code))
const employees = new Set()
for (const recipe of corpus.recipes) {
  if (!publiables.has(recipe.code)) continue
  for (const ingredient of recipe.ingredients) employees.add(normalizeFoodForm(ingredient.form))
}
const forme = (cle) => {
  const form = parCle.get(cle)
  expect(form, `forme absente du catalogue : ${cle}`).toBeTruthy()
  return form
}
const animale = (origin) => isMeatOrigin(origin) || isFishOrigin(origin)

// Annexe A3 du plan : les 40 formes carnées hors des catégories viandes /
// volailles / poissons, par clé normalisée. Les « (×2) » et « (×3) » de
// l'annexe sont développés en formes distinctes.
const ANNEXE_A3 = [
  'boeuf a braiser cru', 'boeuf a braiser cru en petits cubes', 'boudin noir a cuire', 'chicharron de porc',
  'chorizo asturien', 'chorizo criollo', 'confit de canard cuit', 'confit de canard cuit effiloche',
  'foie gras de canard cru', 'gesier de canard confit', 'jambon blanc cuit', 'jambon de bayonne', 'jambon serrano',
  'lardon fume cru', 'merguez crue', 'saucisse chinoise lap cheong', 'saucisse de montbeliard', 'saucisse de morteau',
  'saucisse de toulouse crue',
  'bouillon d agneau', 'bouillon d agneau non sale', 'bouillon d anchois', 'bouillon d anchois et algue',
  'bouillon de boeuf', 'bouillon de boeuf non sale', 'bouillon de crevette', 'bouillon de porc et poulet',
  'bouillon de poulet', 'bouillon de veau non sale', 'bouillon de volaille', 'bouillon de volaille clair',
  'bouillon de volaille non sale', 'dashi', 'fumet de poisson',
  'gelatine feuille', 'sauce poisson', 'saindoux', 'sauce huitre', 'sauce worcestershire',
]
// La quarantième forme de l'annexe, « Sauce soja légère spéciale poisson », y
// figurait sur le seul mot « poisson » de son nom. C'est une sauce soja POUR
// le poisson vapeur (蒸魚豉油), pas une sauce DE poisson : le lot21 la déclare
// végétale et la retire de la liste, en le disant.
const RETIREE_DE_A3 = 'sauce soja legere speciale poisson'

describe('origine des formes du catalogue', () => {
  it('emploie le même vocabulaire dans le build et dans le planificateur', () => {
    expect([...ORIGINS_DU_BUILD]).toEqual([...ORIGINS])
  })

  it('porte une origine du vocabulaire sur chaque forme publiée, avec sa source', () => {
    expect(catalog.forms.length).toBeGreaterThan(500)
    for (const form of catalog.forms) {
      expect(ORIGINS, form.canonical_name).toContain(form.origin)
      if (form.origin === 'inconnu') expect(form.origin_source, form.canonical_name).toBeNull()
      else expect(form.origin_source, form.canonical_name).toMatch(/^(arbitrage:lot21|ciqual:)/)
    }
  })

  it('ne laisse aucune forme employée par une recette publiable en origine inconnue', () => {
    const inconnues = catalog.forms
      .filter((form) => form.origin === 'inconnu' && employees.has(form.canonical_name_normalized))
      .map((form) => form.canonical_name)
    expect(inconnues).toEqual([])
    expect(report.unknown_origin_in_publishable_recipes).toEqual([])
  })

  it('fait ressortir animales les 39 formes carnées cachées hors catégorie (annexe A3)', () => {
    expect(ANNEXE_A3).toHaveLength(39)
    for (const cle of ANNEXE_A3) {
      const form = forme(cle)
      expect(animale(form.origin), `${form.canonical_name} : ${form.origin}`).toBe(true)
    }
    const sauceSoja = forme(RETIREE_DE_A3)
    expect(sauceSoja.origin).toBe('vegetal')
    expect(sauceSoja.origin_source).toBe('arbitrage:lot21')
  })

  it('déclare « Tofu ferme » végétal malgré sa catégorie de rangement', () => {
    const tofu = forme('tofu ferme')
    expect(tofu.category).toBe('viandes')
    expect(tofu.origin).toBe('vegetal')
    expect(tofu.origin_source).toBe('arbitrage:lot21')
  })

  it('ne cache aucun non-animal non déclaré dans les catégories viandes / volailles / poissons', () => {
    const suspectes = catalog.forms
      .filter((form) => ['viandes', 'volailles', 'poissons_fruits_de_mer'].includes(form.category) && !animale(form.origin))
      .map((form) => [form.canonical_name_normalized, form.origin, form.origin_source])
    // Trois substituts végétaux, tous DÉCLARÉS : une exception qui ne viendrait
    // pas d'un arbitrage serait une erreur de résolution. Ciqual les range en
    // « substituts de produits carnés », sous-groupe des viandes ; c'est la
    // raison d'être de la règle (b) qui refuse de trancher sur cette case, et
    // du lot21 qui les déclare pour ce qu'ils SONT — soja, gluten de blé.
    expect(suspectes.sort()).toEqual([
      ['seitan', 'vegetal', 'arbitrage:lot21'],
      ['tofu ferme', 'vegetal', 'arbitrage:lot21'],
      ['tofu fume', 'vegetal', 'arbitrage:lot21'],
    ])
  })

  it('ne cache aucun animal non déclaré dans les catégories végétales', () => {
    const vegetales = ['legumes', 'legumineuses', 'cereales_feculents', 'herbes_aromates', 'epices', 'fruits']
    const suspectes = catalog.forms
      .filter((form) => vegetales.includes(form.category) && form.origin !== 'vegetal')
      .map((form) => [form.canonical_name_normalized, form.origin, form.origin_source])
      .sort()
    // Trois pâtes AUX ŒUFS rangées en céréales : composites, elles portent
    // leur composant le plus contraignant, et chacune est déclarée par le lot21.
    // Et le kimchi, qui n'est PAS déclaré : adossé au proxy « Chou blanc, cru »,
    // il ressortait végétal sur la foi d'un chou alors que le kimchi de chou est
    // ordinairement monté au jeotgal (crevette ou anchois salés) et que rien ici
    // ne dit si celui-ci l'est. 'inconnu' est la valeur exacte de ce qu'on sait.
    expect(suspectes).toEqual([
      ['kimchi de chou fermente mur', 'inconnu', null],
      ['nouille de ble chinoise seche', 'animal:oeuf', 'arbitrage:lot21'],
      ['nouille ramen fraiche', 'animal:oeuf', 'arbitrage:lot21'],
      ['pates fraiches aux oeufs crues', 'animal:oeuf', 'arbitrage:lot21'],
    ])
  })

  it('ne laisse jamais un proxy assumé déclarer l’origine de la forme qu’il approxime', () => {
    // Un mapping de confiance C ou D dit d'où viennent les CALORIES, pas ce que
    // l'aliment est : « Piment ancho séché » était végétal parce que le paprika
    // l'est, « Yaourt grec » du lait parce que le fromage blanc en est, et
    // « Kimchi de chou fermenté mûr » végétal parce qu'un chou l'est. Les
    // cinquante premiers disaient juste, le dernier non — et rien ne les
    // distinguait. La règle (b) se tait donc devant un proxy : ces formes sont
    // déclarées au lot21, ou elles restent 'inconnu'.
    const proxys = catalog.forms.filter((form) => ['C', 'D'].includes(form.confidence))
    expect(proxys.length).toBeGreaterThan(40)
    const heritees = proxys
      .filter((form) => form.origin_source && form.origin_source.startsWith('ciqual:'))
      .map((form) => [form.canonical_name, form.origin_source])
    expect(heritees).toEqual([])
    for (const form of proxys) {
      expect(form.origin_source, form.canonical_name).toBe(form.origin === 'inconnu' ? null : 'arbitrage:lot21')
    }
  })

  it('applique chaque décision du lot21 à une forme du catalogue, avec un motif', () => {
    expect(lot21.decisions.length).toBeGreaterThan(150)
    for (const decision of lot21.decisions) {
      expect(normalizeFoodForm(decision.forme), decision.cle).toBe(decision.cle)
      expect(decision.verdict, decision.cle).toBe('origine')
      expect(ORIGINS, decision.cle).toContain(decision.origin)
      expect(decision.origin, decision.cle).not.toBe('inconnu')
      expect(String(decision.motif || '').trim().length, decision.cle).toBeGreaterThan(20)
      const form = forme(decision.cle)
      expect(form.origin, decision.cle).toBe(decision.origin)
      expect(form.origin_source, decision.cle).toBe('arbitrage:lot21')
    }
  })

  it('lit poisson contre fruits de mer sur l’animal, pas sur l’usage', () => {
    expect(forme('sauce poisson').origin).toBe('animal:poisson')
    expect(forme('dashi').origin).toBe('animal:poisson')
    expect(forme('fumet de poisson').origin).toBe('animal:poisson')
    expect(forme('sauce huitre').origin).toBe('animal:fruits_de_mer')
    expect(forme('bouillon de crevette').origin).toBe('animal:fruits_de_mer')
  })
})
