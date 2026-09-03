/**
 * Déclare le rôle d'assiette « dessert » sur les recettes qui en sont.
 *
 * Le planificateur a servi un KOUIGN-AMANN comme repas du soir, trois fois dans
 * la même semaine, à 1006 kcal pour 7,8 g de protéines et 0,64 g de fibres. Le
 * moteur n'y était pour rien : sur les 576 recettes du corpus, 285 ne déclarent
 * aucun rôle d'assiette, et AUCUNE des recettes sucrées n'en déclarait. Le
 * kouign-amann portait `plate: null`. Rien ne pouvait savoir que ce n'était pas
 * un dîner.
 *
 * Déclarer le rôle ne retire RIEN du corpus. Une recette sucrée reste publiable
 * et planifiable : elle change de place dans le repas, elle n'en sort pas. Le
 * moteur refuse qu'elle occupe un créneau de repas et l'autorise en fin de repas,
 * à une portion calibrée sur le budget énergétique restant.
 *
 * POURQUOI CETTE LISTE EST ÉCRITE À LA MAIN, et non déduite de la catégorie :
 * parce que la catégorie ment. « Idli » est rangé en « gâteau vapeur fermenté »
 * et « Tteokbokki » en « gâteaux de riz pimentés » — le mot « gâteau » y désigne
 * une galette de riz salée dans un cas, un plat de rue pimenté dans l'autre. Une
 * règle sur le libellé les aurait classés desserts et les aurait sortis des
 * repas, ce qui est exactement la faute qu'on répare, dans l'autre sens. Le même
 * piège avait déjà pris le moteur, qui captait « Tarte aux poireaux et lardons »
 * par un motif sur « tarte aux ».
 *
 *   node scripts/data/recipes/assign-dessert-roles.mjs --dry-run
 *   node scripts/data/recipes/assign-dessert-roles.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')

/**
 * Le script n'écrit QUE lancé en ligne de commande.
 *
 * Le test qui relit ses décisions IMPORTE ce module, et le code de premier
 * niveau réécrivait alors corpus-v3.json au milieu d'une suite où d'autres
 * tests lisent ce même fichier. Le symptôme était déroutant : un test de
 * planification passait seul et échouait en suite complète, selon l'ordre.
 * Une donnée versionnée ne se réécrit pas par effet de bord d'un import.
 */
const lanceALaMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
const dryRun = !lanceALaMain || process.argv.includes('--dry-run')

/**
 * Les desserts, un par un, avec ce qui les y range.
 *
 * `accepts` reste vide : un dessert ne se complète pas, il complète. Le champ
 * `reason` porte la nuance que le rôle seul ne dit pas — notamment le poids,
 * parce qu'un kouign-amann et une part de riz au lait ne pèsent pas la même
 * chose en fin de repas et que le moteur sert une FRACTION de la portion.
 */
const DESSERTS = [
  { code: 'DESS-001', reason: 'Crêpes fines : dessert, et petit-déjeuner selon la garniture. Le corpus la range déjà dans les deux usages ; le rôle dessert l\'écarte des créneaux de repas sans lui retirer sa place au petit-déjeuner, qui passe par la rotation des supports et non par le catalogue des plats.' },
  { code: 'DESS-003', reason: 'Gâteau au yaourt : gâteau de ménage, servi en part.' },
  { code: 'DESS-004', reason: 'Tiramisu : dessert froid, servi en verrine ou en part.' },
  { code: 'DESS-005', reason: 'Mousse au chocolat : dessert froid, portion individuelle.' },
  { code: 'DESS-006', reason: 'Flan pâtissier : pâtisserie servie en part. Sa pâte brisée pèse 44 % des calories de la fiche, ce qui en fait un dessert lourd — le moteur en sert une fraction.' },
  { code: 'DESS-007', reason: 'Crumble aux pommes : dessert chaud, servi en part.' },
  { code: 'DESS-008', reason: 'Riz au lait : dessert lacté, portion individuelle. L\'un des plus légers du lot, donc un bon candidat quand le budget énergétique restant est modeste.' },
  { code: 'DESS-009', reason: 'Banana bread : gâteau, servi en tranche.' },
  { code: 'DESS-010', reason: 'Fondant au chocolat : gâteau, portion individuelle.' },
  { code: 'DESS-011', reason: 'Tarte au citron meringuée : tarte sucrée, servie en part. Sa pâte sablée en porte le tiers des calories.' },
  { code: 'FR-030', reason: 'Clafoutis aux cerises : dessert cuit au four, servi en part.' },
  { code: 'FR-032', reason: 'Tarte tatin : tarte sucrée, servie en part.' },
  { code: 'FR-039', reason: 'Tarte aux pommes alsacienne : tarte sucrée, servie en part. Elle porte le même piège que la tatin — le mot « tarte » ne dit pas si elle est salée, seul le contenu tranche.' },
  { code: 'DESS-012', reason: 'Panna cotta : dessert froid, portion individuelle.' },
  { code: 'FR-040', reason: 'Madeleines au miel : petit gâteau, se compte en pièces. Un dessert de fin de repas naturellement léger.' },
  { code: 'REAL-089', reason: 'Kouign-amann : pâtisserie levée feuilletée bretonne. C\'est la recette qui a rendu le défaut visible — servie trois fois comme repas du soir, à 1006 kcal la portion pour 7,8 g de protéines. Elle reste au corpus et devient ce qu\'elle est : un dessert riche, servi à une fraction de sa part.' },
  { code: 'REAL-090', reason: 'Cannelés de Bordeaux : petit gâteau, se compte en pièces.' },
  { code: 'REAL-122', reason: 'Pastéis de nata : petite pâtisserie portugaise, se compte en pièces.' },
]

/**
 * Ce que la catégorie a capturé À TORT, consigné pour que le prochain lot ne
 * refasse pas le rapprochement. Ces deux plats sont SALÉS.
 */
const FAUX_AMIS = [
  { code: 'REAL-182', pourquoi: 'Idli — « gâteau vapeur fermenté » au corpus, mais c\'est une galette de riz et de lentille urad fermentée, cuite à la vapeur et mangée salée, au petit-déjeuner ou au déjeuner, avec un sambar ou un chutney. Aucun sucre.' },
  { code: 'REAL-231', pourquoi: 'Tteokbokki — « gâteaux de riz pimentés » au corpus, mais c\'est un plat de rue coréen mijoté dans une sauce au gochujang. Le « gâteau » y désigne le tteok, un cylindre de riz, et le plat est franchement pimenté.' },
]

const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
const parCode = new Map(corpus.recipes.map((recette) => [recette.code, recette]))

const poses = []
const refus = []
for (const decision of DESSERTS) {
  const recette = parCode.get(decision.code)
  if (!recette) {
    refus.push(`${decision.code} : absent du corpus`)
    continue
  }
  // Un rôle déjà déclaré ne se réécrit pas en silence : le rôle DÉCLARÉ prime
  // sur toute déduction, y compris la nôtre.
  if (recette.plate?.role && recette.plate.role !== 'dessert') {
    refus.push(`${decision.code} ${recette.family} : déclare déjà « ${recette.plate.role} », non écrasé`)
    continue
  }
  recette.plate = { role: 'dessert', accepts: [], reason: decision.reason }
  poses.push(`${decision.code.padEnd(10)} ${recette.family}`)
}

console.log(`${poses.length} rôle(s) « dessert » posé(s) :`)
for (const ligne of poses) console.log(`  ${ligne}`)

if (refus.length) {
  console.log(`\n${refus.length} refus :`)
  for (const ligne of refus) console.log(`  ${ligne}`)
}

console.log('\nÉcartés à dessein, la catégorie les rangeait à tort parmi les sucrés :')
for (const faux of FAUX_AMIS) {
  const recette = parCode.get(faux.code)
  console.log(`  ${faux.code.padEnd(10)} ${recette?.family || '?'} — ${faux.pourquoi}`)
}

const parRole = {}
for (const recette of corpus.recipes) {
  const role = recette.plate?.role || '(non déclaré)'
  parRole[role] = (parRole[role] || 0) + 1
}
console.log('\nRépartition des rôles au corpus :', JSON.stringify(parRole))

if (dryRun) {
  console.log('\nSimulation : rien écrit.')
} else {
  writeFileSync(CORPUS, `${JSON.stringify(corpus, null, 2)}\n`)
  console.log(`\n${CORPUS} mis à jour.`)
}

export { DESSERTS, FAUX_AMIS }
