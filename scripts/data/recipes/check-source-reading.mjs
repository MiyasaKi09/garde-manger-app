/**
 * Les erreurs de lecture déjà commises, pour qu'elles ne reviennent pas.
 *
 * Rapprocher un texte libre d'une forme du catalogue se règle par des critères
 * de tri, et chaque critère ajouté peut défaire un cas que le précédent tenait.
 * Les onze cas ci-dessous sont tous des erreurs réelles, trouvées en relisant
 * les synthèses : des pommes devenues des pommes de terre, des flageolets
 * devenus des spaghettis parce qu'ils étaient « secs » tous les deux, un gigot
 * rôti rattaché à de l'agneau haché. Aucune n'aurait été visible dans une
 * recette publiée sans la relire ligne à ligne.
 *
 *   node scripts/data/recipes/check-source-reading.mjs
 */
import { execFileSync } from 'node:child_process'

const cas = [
  ['poulet-vallee-auge',        'Pomme fraîche',        'les pommes de la vallée d’Auge sont un fruit'],
  ['poulet-vallee-auge',        'Cidre brut',           'on mouille au cidre, pas au vinaigre'],
  ['gigot-d-agneau-aux-flageolets', "Gigot d'agneau cru", 'un gigot n’est pas du haché'],
  ['gigot-d-agneau-aux-flageolets', 'Haricot flageolet sec', 'les flageolets ne sont pas des spaghettis'],
  ['saute-de-porc-aux-pruneaux', 'Épaule de porc crue',  'un sauté est de l’épaule, pas du haché'],
  ['veau-marengo',              'Poivre noir moulu',     '« poivre » n’est pas du Sichuan'],
  ['veau-marengo',              'Oignon jaune cru',      '« oignons » est l’oignon courant'],
  ['veau-marengo',              'Beurre doux',           '« beurre » n’est pas clarifié'],
  ['gratin-de-brocolis',        'Brocoli cru',           'le plat porte son ingrédient'],
  ['blanquette-de-dinde',       'Escalope de dinde crue', 'la blanquette de dinde contient de la dinde'],
  ['poireaux-gratines-a-la-bechamel', 'Poireau cru',     'le pluriel en -x se reconnaît'],
]
let echecs = 0
for (const [slug, attendu, pourquoi] of cas) {
  const sortie = execFileSync('node', ['scripts/data/recipes/synthesize-source-quantities.mjs', slug]).toString()
  const ok = sortie.includes(attendu)
  if (!ok) echecs += 1
  console.log(`${ok ? '✓' : '✗'} ${slug.padEnd(34)} ${attendu.padEnd(24)} ${pourquoi}`)
}
console.log(echecs ? `\n${echecs} cas en échec` : '\nTous les cas passent.')
process.exit(echecs ? 1 : 0)
