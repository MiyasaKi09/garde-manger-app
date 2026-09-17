#!/usr/bin/env node
/**
 * build-corpus-migration.mjs — découpe le chargeur du corpus V3 en migrations.
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * `scripts/data/recipes/build-corpus-v3.mjs` produit un chargeur d'un seul
 * tenant, `scripts/data/out/corpus-v3-load.sql`. Il pesait 12,9 Mo au corpus de
 * 706 recettes, il en pèse 14,0 au corpus de 754, et le plan (§5, phase 0a.2) a
 * mesuré qu'un fichier de cette taille expire côté psql sur la base distante.
 * Le générateur écrit déjà des tranches sous `scripts/data/out/corpus-v3-chunks/`
 * — mais une par recette, soit 756 fichiers, ce qui ne fait pas 756 migrations.
 *
 * Ce script regroupe ces tranches en un petit nombre de fichiers de migration,
 * chacun sous un budget d'octets, et chacun appliqué dans SA PROPRE transaction
 * par `scripts/db/apply-migrations.sh`. Trois conséquences voulues :
 *   — aucun fichier n'atteint la taille qui expire ;
 *   — une tranche qui échoue ne défait pas celles qui l'ont précédée, et un
 *     nouvel `apply` reprend là où il s'est arrêté ;
 *   — le registre de migrations enregistre chaque tranche séparément, donc un
 *     second `apply` n'en rejoue aucune.
 *
 * CE QUE LE DÉCOUPAGE DOIT RESPECTER
 * ----------------------------------
 * L'ordre. Une recette dérivée résout sa base par une sous-requête sur le code
 * de celle-ci (`build-corpus-v3.mjs`, `lienDeBase`) : chargée avant sa base,
 * elle se poserait avec un parent nul et rien ne le dirait. Le générateur émet
 * déjà toutes les bases avant toutes les dérivées ; ce script conserve son
 * ordre, et les tranches s'appliquent dans l'ordre de leur nom de fichier
 * (`LC_ALL=C sort`, cf. apply-migrations.sh). Vérifié sur le corpus du
 * 4 septembre : aucune dérivée n'a pour parent une autre dérivée, une seule
 * frontière bases/dérivées est donc à respecter, et non une chaîne.
 *
 * L'en-tête d'abord. `000-header.sql` déclare le jeu de données, l'exécution
 * d'import et le jeu de règles ; chaque bloc recette relit cette exécution par
 * son empreinte pour écrire sa provenance. Il ouvre donc la première tranche.
 * `999-composition.sql` — la béchamel du croque-monsieur, puis les retraits —
 * ferme la dernière.
 *
 * CE QUE LE SCRIPT NE FAIT PAS
 * ----------------------------
 * Il n'applique rien. Il écrit des fichiers sous `supabase/migrations/`, que
 * `release-production.yml` applique. Il ne supprime aucun fichier existant : si
 * un découpage antérieur laisse des tranches devenues inutiles, il les NOMME et
 * sort en erreur plutôt que d'effacer une migration peut-être déjà appliquée en
 * production.
 *
 * Usage :
 *   node scripts/data/recipes/build-corpus-v3.mjs   # produit les tranches
 *   node scripts/db/build-corpus-migration.mjs      # les regroupe en migrations
 *   node scripts/db/build-manifest.mjs              # les inscrit au manifeste
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../..')
const CHUNK_DIR = resolve(REPO_ROOT, 'scripts/data/out/corpus-v3-chunks')
const REPORT = resolve(REPO_ROOT, 'scripts/data/out/corpus-v3-report.json')
const MIGRATIONS_DIR = resolve(REPO_ROOT, 'supabase/migrations')

/**
 * Horodatage de la première tranche, et pas plus.
 *
 * Il est FIGÉ : `apply-migrations.sh` refuse un fichier dont l'empreinte a
 * changé après son enregistrement, et le registre est indexé par version. Une
 * version recalculée à chaque exécution rendrait le rejeu impossible. Un
 * rechargement ultérieur du corpus écrira donc ses propres tranches sous un
 * NOUVEL horodatage, déclaré ici, sans toucher aux précédentes.
 */
const VERSION_PREMIERE_TRANCHE = '20260917091000'
const PAS_ENTRE_TRANCHES_MINUTES = 10

/**
 * Budget d'octets par tranche.
 *
 * 1,4 Mo est du même ordre que les chargeurs de catalogue déjà appliqués
 * (2,4 Mo) et dix fois sous la taille qui expire. Le corpus de 754 recettes pèse
 * 14,0 Mo : on obtient une dizaine de tranches, un nombre qu'un relecteur peut
 * encore lire. Une recette n'est jamais coupée en deux : le budget est un
 * plafond souple, franchi par le dernier bloc ajouté.
 */
const BUDGET_OCTETS = 1_400_000

const NOM_BASE = 'corpus_v3_754_tranche'

function versionTranche(index) {
  const base = VERSION_PREMIERE_TRANCHE
  const d = new Date(Date.UTC(
    Number(base.slice(0, 4)), Number(base.slice(4, 6)) - 1, Number(base.slice(6, 8)),
    Number(base.slice(8, 10)), Number(base.slice(10, 12)), Number(base.slice(12, 14)),
  ))
  d.setUTCMinutes(d.getUTCMinutes() + index * PAS_ENTRE_TRANCHES_MINUTES)
  const p = (n, w = 2) => String(n).padStart(w, '0')
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`
}

/** Le code de la recette portée par un bloc `DO $recipe$`. */
const codeDuBloc = (sql) => sql.match(/ds\.id, '([A-Z0-9-]+)',/)?.[1] ?? null

/**
 * Codes déjà chargés par une migration de corpus antérieure.
 *
 * Sert au rollback, et à lui seul : une tranche ne « défait » que ce qu'elle a
 * introduit. Une recette que la base portait déjà avant ce chargement doit
 * rester ce qu'elle était, pas être mise hors service par un rollback.
 */
function codesDejaCharges(fichiersGeneres) {
  const codes = new Set()
  for (const nom of readdirSync(MIGRATIONS_DIR)) {
    if (!nom.endsWith('.sql') || !nom.includes('corpus_v3')) continue
    if (fichiersGeneres.has(nom)) continue
    const sql = readFileSync(join(MIGRATIONS_DIR, nom), 'utf8')
    for (const m of sql.matchAll(/ds\.id, '([A-Z0-9-]+)',/g)) codes.add(m[1])
  }
  return codes
}

if (!existsSync(CHUNK_DIR)) {
  console.error(`Tranches absentes : ${CHUNK_DIR}\nLancer d'abord : node scripts/data/recipes/build-corpus-v3.mjs`)
  process.exit(1)
}

const rapport = JSON.parse(readFileSync(REPORT, 'utf8'))
const fichiersRecettes = readdirSync(CHUNK_DIR).filter((f) => f.endsWith('-recipe.sql')).sort()
const entete = readFileSync(join(CHUNK_DIR, '000-header.sql'), 'utf8')
const composition = readFileSync(join(CHUNK_DIR, '999-composition.sql'), 'utf8')

if (fichiersRecettes.length !== rapport.recipe_count) {
  console.error(`Incohérence : ${fichiersRecettes.length} tranches de recette pour ${rapport.recipe_count} recettes déclarées.`)
  process.exit(1)
}

// Groupement par budget, dans l'ordre d'émission — bases puis dérivées.
const groupes = []
let courant = { blocs: [], codes: [], octets: 0 }
for (const fichier of fichiersRecettes) {
  const bloc = readFileSync(join(CHUNK_DIR, fichier), 'utf8')
  const code = codeDuBloc(bloc)
  if (!code) {
    console.error(`Bloc sans code de recette : ${fichier}`)
    process.exit(1)
  }
  courant.blocs.push(bloc)
  courant.codes.push(code)
  courant.octets += Buffer.byteLength(bloc)
  if (courant.octets >= BUDGET_OCTETS) {
    groupes.push(courant)
    courant = { blocs: [], codes: [], octets: 0 }
  }
}
if (courant.blocs.length) groupes.push(courant)

const total = groupes.length
const nomsGeneres = new Set()
for (let i = 0; i < total; i += 1) {
  const v = versionTranche(i)
  nomsGeneres.add(`${v}_${NOM_BASE}_${String(i + 1).padStart(2, '0')}.sql`)
  nomsGeneres.add(`${v}_${NOM_BASE}_${String(i + 1).padStart(2, '0')}_rollback.sql`)
}
const dejaCharges = codesDejaCharges(nomsGeneres)

const ecrits = []
for (const [i, groupe] of groupes.entries()) {
  const numero = String(i + 1).padStart(2, '0')
  const version = versionTranche(i)
  const premiere = i === 0
  const derniere = i === total - 1
  const nouveaux = groupe.codes.filter((c) => !dejaCharges.has(c))

  const enTete = `-- Corpus culinaire V3 — ${rapport.recipe_count} recettes, tranche ${numero} sur ${total}.
--
-- Chargement du corpus du dépôt (${rapport.recipe_count} recettes, ${rapport.recipes_static_eligible} publiables) dans une base restée
-- au corpus précédent. Le chargeur d'un seul tenant pèse ${(rapport.sql_bytes / 1_048_576).toFixed(1).replace('.', ',')} Mo ; le plan a
-- mesuré qu'à cette taille il expire côté psql sur la base distante (§5, phase
-- 0a.2). Il est donc découpé en ${total} tranches, chacune appliquée dans sa propre
-- transaction : une tranche qui échoue laisse les précédentes en place, un
-- nouvel « apply » reprend à celle qui a échoué, et un second « apply » n'en
-- rejoue aucune.
--
-- Cette tranche porte ${groupe.codes.length} recettes, de ${groupe.codes[0]} à ${groupe.codes.at(-1)},
-- dont ${nouveaux.length} qu'aucune migration antérieure n'avait chargées.
--${premiere ? `
-- Première tranche : elle ouvre par la déclaration du jeu de données, de
-- l'exécution d'import et du jeu de règles sensorielles. Chaque bloc recette
-- relit cette exécution par son empreinte pour écrire sa provenance, ici et
-- dans les tranches suivantes.
--` : ''}${derniere ? `
-- Dernière tranche : elle ferme par la composition réelle du croque-monsieur
-- (sa béchamel devient une sous-recette) et par les retraits déclarés dans
-- data/recipes/retraits.json.
--` : ''}
-- CE CHARGEMENT N'EFFACE AUCUNE VERSION DE RECETTE. Il insère ou met à jour en
-- place (\`ON CONFLICT (recipe_family_id, version_number) DO UPDATE\`) : une
-- version garde son identifiant, donc les \`culinary.recipe_executions\` qui la
-- référencent, et à travers eux les \`planned_productions\` et les
-- \`planned_consumptions\` d'un plan publié, restent valides. Ce qui est effacé
-- puis réécrit se limite aux enfants de la version — étapes, exigences,
-- composants, axes de variation, tâches de revue — que le planning ne
-- référence pas : un repas déjà planifié lit l'instantané figé de son
-- \`recipe_execution\`, pas la recette vivante. Et si une suppression était un
-- jour tentée, la base la refuserait : \`recipe_executions.recipe_version_id\`
-- n'a pas de clause ON DELETE et \`planned_productions.recipe_execution_id\`
-- porte ON DELETE RESTRICT.
--
-- Une recette sortie du corpus n'est pas supprimée non plus : elle est MARQUÉE
-- (\`quality_level = 'D'\`, \`planning_eligible = false\`), la règle que le dépôt
-- s'est déjà donnée pour FR-007, dont vingt-deux créneaux planifiés dépendent.
--
-- À APPLIQUER APRÈS LE CATALOGUE D'ALIMENTS (20260917090000), et l'ordre des
-- versions le garantit. C'est au chargement d'une recette que ses besoins sont
-- rattachés à des formes : un catalogue arrivé après ne rattache rien. Mesuré
-- sur une base reconstruite à l'état de la production — catalogue appliqué
-- APRÈS ces tranches : \`planning_eligible\` reste à 542 ; catalogue appliqué
-- AVANT : 568.
--
-- Généré par scripts/db/build-corpus-migration.mjs depuis la sortie de
-- scripts/data/recipes/build-corpus-v3.mjs. Ne pas éditer à la main.
-- corpus_hash = ${rapport.corpus_hash}

`

  const corps = [
    premiere ? entete.trimStart() : '',
    ...groupe.blocs,
    derniere ? composition.trimStart() : '',
  ].filter(Boolean).join('\n')

  const fichier = `${version}_${NOM_BASE}_${numero}.sql`
  writeFileSync(join(MIGRATIONS_DIR, fichier), `${enTete}${corps}\n`)

  // ── Rollback ──────────────────────────────────────────────────────────────
  // Il ne supprime pas : il met hors service. Une version peut avoir été
  // planifiée entre l'application et le retour en arrière, et sa suppression
  // serait alors refusée par la base — ou, pire, réussirait en emportant ce qui
  // en dépend. Le retrait tient aux deux colonnes que l'application lit déjà :
  // `quality_level = 'D'` sort du catalogue éditorial, `planning_eligible =
  // false` sort du planificateur, et `eligibility_issues` porte le motif.
  const listeNouveaux = nouveaux.length
    ? nouveaux.map((c) => `    '${c}'`).join(',\n')
    : null
  const rollback = `-- Rollback de la tranche ${numero} du corpus V3 à ${rapport.recipe_count} recettes.
--
-- IL NE SUPPRIME RIEN, et c'est le seul comportement sûr : entre l'application
-- et le retour en arrière, un plan a pu être publié sur l'une de ces recettes.
-- Supprimer la version serait refusé par la base — \`recipe_executions\` la
-- référence sans clause ON DELETE — et la contourner orphelinerait un repas
-- déjà cuisiné. Ce qu'un rollback de tranche défait, c'est donc la MISE EN
-- SERVICE des recettes que la tranche a introduites, exactement comme le dépôt
-- retire FR-007 : hors du catalogue éditorial (\`quality_level\` 'D', qui n'admet
-- que A et B) et hors du planificateur (\`planning_eligible = false\`), motif
-- écrit dans \`eligibility_issues\`. ${listeNouveaux
  ? `Cette tranche en a introduit ${nouveaux.length}.`
  : 'Cette tranche n\'en a introduit aucune.'}
--
-- CE QU'IL NE REND PAS. Les autres recettes de cette tranche existaient avant
-- ce chargement et ont été mises à jour en place. Ce fichier ne restaure pas
-- leur contenu antérieur : pour cela, il faut rejouer la migration de corpus
-- précédente, qui est conservée dans ce dépôt
-- (\`20260731120000_corpus_v3_589_variantes.sql\`). C'est dit ici plutôt que
-- laissé à deviner.
${listeNouveaux ? `
UPDATE culinary.recipe_versions rv
SET quality_level = 'D',
    planning_eligible = false,
    eligibility_issues = jsonb_build_array(jsonb_build_object(
      'code', 'recipe_rolled_back',
      'migration', '${version}_${NOM_BASE}_${numero}',
      'reason', 'Version introduite par le chargement du corpus à ${rapport.recipe_count} recettes, retirée du service par rollback.'
    ))
FROM ops.source_datasets ds
WHERE ds.id = rv.source_dataset_id
  AND ds.code = 'myko_editorial_v3'
  AND upper(rv.source_record_key) IN (
${listeNouveaux}
  );
` : `
-- Cette tranche n'a introduit AUCUNE recette nouvelle : elle n'a mis à jour que
-- des versions déjà présentes. Il n'y a donc rien à mettre hors service, et ce
-- fichier n'exécute aucune instruction.
`}`
  writeFileSync(join(MIGRATIONS_DIR, `${version}_${NOM_BASE}_${numero}_rollback.sql`), rollback)

  ecrits.push({ fichier, recettes: groupe.codes.length, nouvelles: nouveaux.length, octets: Buffer.byteLength(corps) })
}

// Tranches d'un découpage antérieur qui ne sont plus produites : on les nomme,
// on ne les efface pas — elles ont pu être appliquées.
const orphelines = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.includes(`_${NOM_BASE}_`) && !nomsGeneres.has(f))
if (orphelines.length) {
  console.error(`Tranches d'un découpage antérieur, non régénérées :\n${orphelines.map((f) => `  ${f}`).join('\n')}`)
  console.error('Les retirer à la main après avoir vérifié qu\'aucune n\'est au registre de la base.')
  process.exit(1)
}

const totalOctets = ecrits.reduce((s, e) => s + e.octets, 0)
console.log(JSON.stringify({
  corpus_hash: rapport.corpus_hash,
  recettes: rapport.recipe_count,
  publiables: rapport.recipes_static_eligible,
  tranches: ecrits.length,
  recettes_nouvelles: ecrits.reduce((s, e) => s + e.nouvelles, 0),
  octets_total: totalOctets,
  octets_max_tranche: Math.max(...ecrits.map((e) => e.octets)),
  fichiers: ecrits.map((e) => `${e.fichier} (${e.recettes} recettes, ${e.nouvelles} nouvelles)`),
}, null, 2))
