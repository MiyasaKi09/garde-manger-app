#!/usr/bin/env node
/**
 * check-corpus-parity — livrable 0b.5 du plan (`docs/PLAN_FINIR_MYKO.md`, §5,
 * phase 0b). ÉCHOUE SI L'EMPREINTE DU CORPUS EN BASE DIFFÈRE DE CELLE DU DÉPÔT.
 *
 * POURQUOI CE CONTRÔLE EXISTE. Le §2.1 du plan mesure un écart que rien ne
 * signalait : la base portait 590 versions de recettes dont 405 planifiables,
 * datées du 31 juillet, quand le dépôt en portait 754 dont 568. Les 48 jumeaux
 * végétariens, les 42 variantes et les 268 reprises n'étaient nulle part. Rien
 * n'échouait pour autant — l'application servait simplement moins que ce que le
 * dépôt contenait, et personne ne pouvait le voir sans compter à la main. Le
 * §9.3 en fait un interdit : « `check-corpus-parity` verte — l'écart base/dépôt
 * ne doit pas pouvoir revenir ».
 *
 * OÙ IL TOURNE, ET POURQUOI PAS AILLEURS. Dans le job `migrate-and-deploy` de
 * `.github/workflows/release-production.yml`, qui porte `SUPABASE_DB_PASSWORD`
 * et construit sa connexion à la base de production ; et dans le job `db-tests`
 * de `.github/workflows/ci.yml`, qui a un Postgres. Il n'a RIEN à faire dans le
 * job `test` de la CI : celui-là tourne sur des valeurs Supabase factices
 * (`NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co`, ci.yml lignes
 * 18-19) et n'a aucune base à lire. L'y placer aurait donné une porte verte sur
 * rien du tout — le défaut que le plan relève déjà pour `npm run prices:check`
 * (§2.2), qui cherche un fichier absent et répond « rien à contrôler ».
 *
 * CE QUE « L'EMPREINTE DU CORPUS » VEUT DIRE ICI, EXACTEMENT. Le chargeur
 * `scripts/data/recipes/build-corpus-v3.mjs` écrit dans
 * `culinary.recipe_versions.content_hash` le md5 du JSON de chaque recette, et
 * les dix tranches de migration du livrable 0a.2 portent les mêmes littéraux
 * puisqu'elles sont générées depuis sa sortie. L'empreinte est donc la liste
 * TRIÉE des couples `CODE → content_hash`, résumée en un sha256 :
 *   — côté dépôt, recalculée depuis `data/recipes/corpus-v3.json` ;
 *   — côté base, lue dans `culinary.recipe_versions` pour le jeu de données
 *     `myko_editorial_v3`.
 * Deux empreintes égales veulent dire : mêmes recettes, même contenu, aucune en
 * trop, aucune en moins.
 *
 * ÉCARTÉ : SE FIER À `ops.import_runs.configuration_hash`. La base y garde le
 * md5 du corpus chargé, et le comparer à celui du dépôt aurait tenu en une
 * requête. C'est une DÉCLARATION, pas un constat : cette ligne est insérée par
 * l'en-tête du chargeur, c'est-à-dire par la PREMIÈRE des dix tranches. Une
 * release interrompue après la tranche 3 laisserait donc la déclaration du
 * corpus complet sur une base qui n'en porte que trois dixièmes, et le contrôle
 * serait vert sur exactement l'accident qu'il doit attraper. On compare ce que
 * la base PORTE, recette par recette.
 *
 * LES RECETTES RETIRÉES DU CATALOGUE NE SONT PAS UN ÉCART, et c'est le seul
 * aménagement. Une recette sortie du corpus n'est jamais supprimée en base :
 * elle est marquée `quality_level = 'D'` et `planning_eligible = false` — la
 * règle que le dépôt s'est donnée pour FR-007, dont vingt-deux créneaux
 * planifiés dépendent, et que rappellent les rollbacks des tranches de corpus.
 * Exiger l'égalité stricte des ensembles ferait donc rougir ce contrôle pour
 * toujours, sur une pierre tombale volontaire. Les recettes de niveau D sont
 * écartées DES DEUX CÔTÉS par la même règle — `quality_level` en base,
 * `confidence` au corpus —, et elles sont COMPTÉES ET NOMMÉES dans la sortie :
 * un aménagement qu'on ne peut pas lire est une exception cachée.
 *
 * LE SECOND REFUS, ET POURQUOI IL EST SÉPARÉ. Le §2.1 chiffre l'écart en deux
 * termes : « 590 lignes, 405 `planning_eligible` […] contre 754 / 568 ». Le
 * second ne se déduit pas du premier — `planning_eligible` est calculé au
 * chargement selon que chaque ingrédient requis trouve sa forme au catalogue
 * d'aliments, si bien qu'un corpus juste peut donner 542 planifiables au lieu
 * de 568 si le catalogue des formes est arrivé APRÈS les tranches (mesuré, et
 * écrit dans l'en-tête de la tranche 01). Le contrôle refuse donc aussi cet
 * écart, sous son propre nom, au lieu de le fondre dans l'empreinte : une
 * empreinte qui échouerait pour une raison de catalogue d'aliments ne dirait
 * pas où chercher.
 *
 * POURQUOI `psql` ET NON LE PILOTE `pg`. `release-production.yml` construit sa
 * connexion en chaîne libpq clé/valeur (`host=… port=… dbname=postgres user=…
 * sslmode=require`, ligne 135), avec `PGPASSWORD` et parfois `PGOPTIONS` dans
 * l'environnement. `pg` n'accepte que les URL : on lui donne cette chaîne et il
 * ne se plaint pas — vérifié, il en déduit `host: "base"` et prend la chaîne
 * entière pour un nom de base. L'échec serait donc tardif et illisible, et il
 * n'apparaîtrait qu'en release. `psql` lit exactement la chaîne que le pipeline
 * fabrique, honore les mêmes variables, et c'est déjà lui qu'emploient toutes
 * les autres étapes de ce job.
 *
 * USAGE :
 *   DATABASE_URL=postgres://… node scripts/db/check-corpus-parity.mjs
 *   DATABASE_URL="host=… port=… dbname=postgres user=… sslmode=require" \
 *     PGPASSWORD=… node scripts/db/check-corpus-parity.mjs
 *
 * Sortie : 0 si la base sert le corpus du dépôt, 1 sinon, avec le détail nommé.
 * Ce script ne fait que LIRE : il n'écrit ni en base ni sur disque.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Le jeu de données du corpus éditorial, tel que le chargeur le déclare. */
export const JEU_DE_DONNEES = 'myko_editorial_v3'

/**
 * Le niveau de qualité qui marque une recette RETIRÉE du catalogue éditorial.
 * Il vaut des deux côtés : `quality_level` en base, `confidence` au corpus.
 */
export const NIVEAU_RETIRE = 'D'

/**
 * L'empreinte d'une recette, telle que le chargeur l'écrit dans
 * `culinary.recipe_versions.content_hash` (`build-corpus-v3.mjs`, `hashRecipe`).
 * La règle est recopiée ici plutôt qu'importée : le chargeur est un script de
 * génération que ce contrôle ne doit pas faire tourner, et `tests/db/corpusParity.test.js`
 * vérifie que les deux règles rendent la même valeur sur le corpus entier, en
 * la confrontant aux littéraux du chargeur SQL commité. Deux écritures et une
 * comparaison valent mieux qu'un import qui rendrait la divergence invisible.
 */
export const empreinteDeRecette = (recette) => createHash('md5').update(JSON.stringify(recette)).digest('hex')

/** Résume une liste de couples `code → empreinte` en une seule valeur comparable. */
export function empreinteDuCorpus(parCode) {
  const lignes = [...parCode.entries()]
    .map(([code, empreinte]) => `${code}\t${empreinte}`)
    .sort()
  return createHash('sha256').update(lignes.join('\n')).digest('hex')
}

/**
 * Côté dépôt. Rend les recettes au catalogue et, à part, celles que le corpus
 * déclare retirées — pour que le nombre écarté soit lisible et non deviné.
 */
export function corpusDuDepot(corpus) {
  const parCode = new Map()
  const retirees = []
  for (const recette of corpus?.recipes || []) {
    const code = String(recette?.code || '').toUpperCase()
    if (recette?.confidence === NIVEAU_RETIRE) { retirees.push(code); continue }
    parCode.set(code, empreinteDeRecette(recette))
  }
  return { parCode, retirees: retirees.sort(), empreinte: empreinteDuCorpus(parCode) }
}

/**
 * Côté base. `lignes` est ce que rend la requête ci-dessous : un objet par
 * version de recette du jeu de données éditorial.
 */
export function corpusDeLaBase(lignes) {
  const parCode = new Map()
  const retirees = []
  for (const ligne of lignes) {
    const code = String(ligne?.code || '').toUpperCase()
    if (ligne?.qualityLevel === NIVEAU_RETIRE) { retirees.push(code); continue }
    parCode.set(code, ligne?.contentHash || null)
  }
  return { parCode, retirees: retirees.sort(), empreinte: empreinteDuCorpus(parCode) }
}

/**
 * Le verdict. Il est PUR — aucune base, aucun fichier — pour que le test du
 * livrable puisse lui présenter l'écart d'aujourd'hui et la parité sans avoir à
 * construire deux Postgres.
 */
export function comparer(depot, base, { publiablesDeclarees = null, planifiablesEnBase = null } = {}) {
  const manquantes = []
  const divergentes = []
  for (const [code, empreinte] of depot.parCode) {
    if (!base.parCode.has(code)) { manquantes.push(code); continue }
    if (base.parCode.get(code) !== empreinte) divergentes.push(code)
  }
  const enTrop = [...base.parCode.keys()].filter((code) => !depot.parCode.has(code))

  const refus = []
  if (depot.empreinte !== base.empreinte) {
    // « Absente du catalogue de la base » ne veut pas dire « ligne absente » :
    // une recette marquée retirée (niveau D) est physiquement là et compte ici
    // comme absente, parce que la base ne la sert plus. La liste des retirées
    // est imprimée juste en dessous pour que les deux se lisent ensemble.
    refus.push(
      `empreinte du corpus : dépôt ${depot.empreinte.slice(0, 16)}…, base ${base.empreinte.slice(0, 16)}… — `
      + `${manquantes.length} recette(s) du dépôt absente(s) du catalogue de la base, `
      + `${divergentes.length} au contenu différent, `
      + `${enTrop.length} au catalogue de la base sans être au corpus`,
    )
  }
  // Le second terme de l'écart du §2.1, refusé sous son propre nom. Il n'est
  // contrôlé que si les deux chiffres sont fournis : un contrôle qui invente sa
  // référence quand elle manque ne contrôle rien.
  if (publiablesDeclarees != null && planifiablesEnBase != null
      && Number(publiablesDeclarees) !== Number(planifiablesEnBase)) {
    refus.push(
      `recettes servables : la base en déclare ${planifiablesEnBase} planifiables pour `
      + `${publiablesDeclarees} publiables au dépôt — une forme manque au catalogue d'aliments, `
      + `ou le catalogue a été appliqué après les tranches de corpus`,
    )
  }
  return {
    parite: refus.length === 0,
    refus,
    manquantes: manquantes.sort(),
    divergentes: divergentes.sort(),
    enTrop: enTrop.sort(),
    retireesAuDepot: depot.retirees,
    retireesEnBase: base.retirees,
    empreinteDepot: depot.empreinte,
    empreinteBase: base.empreinte,
    publiablesDeclarees,
    planifiablesEnBase,
  }
}

/** La requête de lecture, écrite une fois. Elle ne modifie rien. */
export const REQUETE_CORPUS = `
SELECT upper(rv.source_record_key), coalesce(rv.content_hash, ''), rv.quality_level,
       CASE WHEN rv.planning_eligible THEN '1' ELSE '0' END
  FROM culinary.recipe_versions rv
  JOIN ops.source_datasets ds ON ds.id = rv.source_dataset_id
 WHERE ds.code = '${JEU_DE_DONNEES}'
 ORDER BY 1`

/**
 * Lit la base par psql. Le séparateur est une tabulation : ni les codes de
 * recette, ni les empreintes hexadécimales, ni les niveaux de qualité n'en
 * contiennent.
 */
export function lireLaBase(url, { psql = 'psql' } = {}) {
  const sortie = execFileSync(psql, [url, '-v', 'ON_ERROR_STOP=1', '-tAF', '\t', '-c', REQUETE_CORPUS], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return sortie.split('\n')
    .map((ligne) => ligne.trimEnd())
    .filter(Boolean)
    .map((ligne) => {
      const [code, contentHash, qualityLevel, planifiable] = ligne.split('\t')
      return { code, contentHash: contentHash || null, qualityLevel, planningEligible: planifiable === '1' }
    })
}

function principal() {
  const url = process.env.DATABASE_URL
  if (!url) {
    // Pas de base = pas de contrôle, et on le dit en échouant. Répondre « rien à
    // contrôler » ferait de ce script une porte verte sur une absence.
    process.stderr.write('check-corpus-parity : DATABASE_URL est absent, aucune base à lire.\n')
    return 1
  }

  const corpus = JSON.parse(readFileSync(join(RACINE, 'data', 'recipes', 'corpus-v3.json'), 'utf8'))
  const rapport = JSON.parse(readFileSync(join(RACINE, 'scripts', 'data', 'out', 'corpus-v3-report.json'), 'utf8'))
  const depot = corpusDuDepot(corpus)
  const lignes = lireLaBase(url)
  const base = corpusDeLaBase(lignes)
  const verdict = comparer(depot, base, {
    publiablesDeclarees: rapport.recipes_static_eligible,
    planifiablesEnBase: lignes.filter((ligne) => ligne.planningEligible).length,
  })

  const dire = (texte) => process.stdout.write(`${texte}\n`)
  // Les listes sont tronquées : un journal de release qui déroule cent
  // soixante codes sur une ligne ne se lit pas, et le compte suffit à décider.
  const extrait = (titre, codes) => {
    if (codes.length === 0) return
    dire(`${titre} (${codes.length}) : ${codes.slice(0, 40).join(', ')}${codes.length > 40 ? ', …' : ''}`)
  }
  dire(`corpus du dépôt : ${depot.parCode.size} recettes au catalogue, ${depot.retirees.length} retirée(s)`)
  dire(`corpus en base  : ${base.parCode.size} recettes au catalogue, ${base.retirees.length} retirée(s)`)
  dire(`empreinte dépôt : ${verdict.empreinteDepot}`)
  dire(`empreinte base  : ${verdict.empreinteBase}`)
  dire(`servables       : ${verdict.planifiablesEnBase} planifiables en base pour ${verdict.publiablesDeclarees} publiables au dépôt`)
  extrait('retirées au corpus du dépôt', verdict.retireesAuDepot)
  extrait('retirées en base (niveau D)', verdict.retireesEnBase)

  if (verdict.parite) {
    dire('check-corpus-parity : la base sert le corpus du dépôt.')
    return 0
  }

  for (const motif of verdict.refus) {
    process.stdout.write(`::error title=Parité corpus base/dépôt::${motif}\n`)
  }
  extrait('du dépôt, absentes du catalogue de la base', verdict.manquantes)
  extrait('au contenu différent', verdict.divergentes)
  extrait('au catalogue de la base sans être au corpus', verdict.enTrop)
  process.stderr.write(
    'La base ne sert pas le corpus du dépôt. Appliquer les tranches de corpus '
    + '(livrable 0a.2) puis relancer ; ne pas déployer sur cet écart.\n',
  )
  return 1
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    process.exitCode = principal()
  } catch (erreur) {
    process.stderr.write(`check-corpus-parity : ${erreur.stack || erreur.message}\n`)
    process.exitCode = 1
  }
}
