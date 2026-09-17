#!/usr/bin/env node
/**
 * CAPTURE DE CE QUE LA BASE SERT — la matérialisation que rejoue la porte de
 * test 0b.3 (`tests/planning/contratOperationnel.test.js`).
 *
 * POURQUOI CE FICHIER EXISTE. La porte de test doit mesurer le CHEMIN BASE et
 * lui seul. Or `npx vitest run` tourne dans le job `test` de
 * `.github/workflows/ci.yml`, qui n'a pas de Postgres : ses variables Supabase
 * sont des valeurs factices (`https://example.supabase.co`, lignes 18-19). Un
 * test qui lirait `data/recipes/corpus-v3.json` pour se donner un catalogue
 * mesurerait exactement ce que la phase 0b corrige — le dépôt, pas la base.
 *
 * Ce script produit donc la seule chose qui manque : la SORTIE de la RPC
 * opérationnelle, prise sur une vraie base, écrite dans un fichier versionné,
 * avec sa provenance. Ce n'est pas un jeu de données inventé pour le test :
 * c'est la réponse de `public.get_operational_recipe_catalog_v3`, page par
 * page, dans l'ordre et aux plafonds de `lib/db/operationalRecipeCatalog.js`.
 *
 * CE QUE LA CAPTURE GARDE, ET CE QU'ELLE JETTE. Elle garde les clés que les
 * quatre critères de 0b.3 mesurent, plus le peu dont
 * `materializeOperationalRecipe` a besoin pour tourner (`servings`, quantités).
 * Elle jette `exactSteps`, `sensory`, `per100g` et les descriptions : la
 * capture entière pèserait plusieurs mébioctets de prose sans rien ajouter aux
 * critères. Les clés retenues sont ÉCRITES dans la provenance — un lecteur doit
 * pouvoir dire ce que le fichier ne contient pas sans le deviner.
 *
 * AUCUNE VALEUR N'EST TRANSFORMÉE. La projection est un choix de clés, pas un
 * calcul : si la RPC rend `origin: null`, le fichier porte `null`. C'est la
 * condition pour que la porte puisse rougir.
 *
 * ÉCRIT ET ÉCARTÉ. Capturer la charge utile ENTIÈRE : écarté pour la taille,
 * et parce que les clés jetées ne portent aucun des quatre critères. Capturer
 * depuis le projet de production : écarté — la RPC exige `auth.uid()`, ce qui
 * demanderait un jeton de service, et le plan interdit de toucher la production
 * autrement que par le pipeline. Les deux bases capturées sont donc celles que
 * la CI sait construire, et le script dit laquelle.
 *
 * USAGE :
 *   DATABASE_URL=postgres://... node scripts/db/capture-catalogue-servi.mjs \
 *     --scenario A --sortie tests/planning/fixtures/catalogue-servi-base-A.json
 *
 * COMMENT OBTENIR LA BASE À CAPTURER. Les deux scénarios ne sont définis qu'à
 * UN endroit — le job `db-tests` de `.github/workflows/ci.yml` — et ce script
 * ne les redéfinit pas : recopier ici la construction ferait deux vérités qui
 * finiraient par diverger. Pour rejouer une capture sur un Postgres local, on
 * exécute dans l'ordre les étapes préfixées `[A]` (ou `[B]`) de ce job, en
 * pointant `DATABASE_URL` sur une base vierge, jusqu'à l'étape « Contrat
 * opérationnel » incluse ; la capture se prend ensuite sur la même base.
 * Les deux ne prouvent pas la même chose (cf. l'en-tête de
 * `supabase/tests/contrat_operationnel.sql`) :
 *   [A] rejoue les chargeurs → éprouve le CODE d'émission ;
 *   [B] n'exécute aucun chargeur → éprouve les MIGRATIONS, c'est-à-dire ce que
 *       le pipeline de production applique.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * Les trois migrations qui décident de ce que la RPC publie et de ce qui
 * remplit les colonnes. La porte de test compare leur empreinte à celle
 * inscrite ici : une capture prise sous une autre projection ne doit pas
 * pouvoir rester verte. Les tranches de corpus n'y sont PAS — elles changent le
 * nombre de recettes, pas le contrat ; les ajouter ferait rougir la porte à
 * chaque lot hebdomadaire de la phase 5, sans qu'aucun contrat n'ait bougé.
 */
export const MIGRATIONS_DU_CONTRAT = Object.freeze([
  'supabase/migrations/20260715190000_v3_operational_recipe_api.sql',
  'supabase/migrations/20260917110000_contrat_operationnel.sql',
  'supabase/migrations/20260917111000_contrat_operationnel_valeurs.sql',
])

export const CLES_RECETTE = Object.freeze([
  'code', 'servings', 'derivedFrom', 'conservationProfile', 'exactIngredients',
])
export const CLES_INGREDIENT = Object.freeze([
  'formNormalized', 'name', 'quantity', 'unit', 'grams', 'optional', 'origin', 'component',
])

export function empreintesDuContrat(racine = RACINE) {
  const empreintes = {}
  for (const chemin of MIGRATIONS_DU_CONTRAT) {
    empreintes[chemin] = createHash('sha256').update(readFileSync(join(racine, chemin))).digest('hex')
  }
  return empreintes
}

const projeterIngredient = (ingredient) => {
  const garde = {}
  for (const cle of CLES_INGREDIENT) garde[cle] = ingredient?.[cle] ?? null
  return garde
}

const projeterRecette = (recette) => ({
  code: recette?.code ?? null,
  servings: recette?.servings ?? null,
  derivedFrom: recette?.derivedFrom ?? null,
  conservationProfile: recette?.conservationProfile ?? null,
  exactIngredients: (recette?.exactIngredients || []).map(projeterIngredient),
})

/**
 * Lit tout le catalogue servi, page par page, EXACTEMENT comme
 * `listOperationalRecipes` : même taille de page, même plafond d'offset, même
 * arrêt sur page déjà servie. Vérifier sur un seul appel reviendrait à vérifier
 * toujours les cent mêmes codes — la RPC rabote toute demande au-delà de cent
 * sans le dire (migration 20260715190000, ligne 108).
 */
export async function lireCatalogueServi(client) {
  const recettes = []
  const vus = new Set()
  let offset = 0
  let pages = 0
  let contractVersion = null
  let eligibleCount = null
  let arret = 'catalogue_epuise'

  while (true) {
    const { rows } = await client.query(
      'SELECT public.get_operational_recipe_catalog_v3(NULL, 100, $1) AS page',
      [offset],
    )
    const page = rows[0]?.page || {}
    pages += 1
    if (contractVersion === null) contractVersion = page.contractVersion ?? null
    if (eligibleCount === null) {
      const declare = Number(page?.metadata?.eligibleCount)
      eligibleCount = Number.isFinite(declare) ? declare : null
    }
    const lot = Array.isArray(page.recipes) ? page.recipes : []
    if (lot.length === 0) break
    const neuves = lot.filter((recette) => recette?.code && !vus.has(recette.code))
    for (const recette of neuves) vus.add(recette.code)
    recettes.push(...neuves.map(projeterRecette))
    if (neuves.length < lot.length) { arret = 'page_deja_servie'; break }
    if (lot.length < 100) break
    offset += 100
    if (offset > 10000) { arret = 'offset_max_atteint'; break }
  }

  return { recettes, pages, contractVersion, eligibleCount, arret }
}

/**
 * Ce que la BASE porte en composants sous-recette parmi les recettes servies.
 * Sans ce chiffre, la porte comparerait le nombre de `component` publiés à
 * rien du tout, et « 0 publié » passerait pour une réussite alors qu'il peut
 * signifier « la projection est cassée ». Le compte vaut zéro aujourd'hui, et
 * c'est précisément pour cela qu'il doit être LU plutôt que supposé.
 */
export async function compterComponentsPortes(client, codes) {
  const { rows } = await client.query(
    `SELECT count(*)::int AS n
       FROM culinary.recipe_ingredient_requirements req
       JOIN culinary.recipe_components comp ON comp.id = req.component_id
       JOIN culinary.recipe_versions rv ON rv.id = req.recipe_version_id
      WHERE comp.sub_recipe_version_id IS NOT NULL
        AND upper(rv.source_record_key) = ANY($1::text[])`,
    [codes],
  )
  return rows[0]?.n ?? 0
}

/** Les jumeaux végétariens PORTÉS EN BASE, servis ou non, avec leur lignée. */
export async function lireJumeauxEnBase(client) {
  const { rows } = await client.query(
    `SELECT upper(rv.source_record_key) AS code,
            upper(base.source_record_key) AS derived_from,
            rv.planning_eligible
       FROM culinary.recipe_versions rv
       JOIN ops.source_datasets ds ON ds.id = rv.source_dataset_id
       LEFT JOIN culinary.recipe_versions base ON base.id = rv.derived_from_version_id
      WHERE ds.code = 'myko_editorial_v3'
        AND upper(rv.source_record_key) LIKE 'JUM-%'
      ORDER BY 1`,
  )
  return rows.map((ligne) => ({
    code: ligne.code,
    derivedFrom: ligne.derived_from,
    planningEligible: ligne.planning_eligible,
  }))
}

/**
 * Ouvre un client Postgres et pose le jeton d'authentification que la RPC exige
 * (`auth.uid() IS NULL` la fait échouer), LOCAL à une transaction en lecture.
 *
 * `pg` est chargé ici et non en tête de fichier : ce module est aussi importé
 * par `tests/planning/contratOperationnel.test.js`, qui n'a pas de base à lire
 * dans le job `test` de la CI et n'a alors aucune raison de charger un pilote
 * Postgres.
 */
export async function ouvrirLectureAuthentifiee(url) {
  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  await client.query('BEGIN')
  await client.query("SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true)")
  return client
}

/** Ferme la lecture en ANNULANT la transaction : ce script n'écrit jamais. */
export async function fermerLecture(client) {
  try { await client.query('ROLLBACK') } finally { await client.end() }
}

async function principal() {
  const args = process.argv.slice(2)
  const lireOption = (nom, defaut) => {
    const index = args.indexOf(nom)
    return index >= 0 && args[index + 1] ? args[index + 1] : defaut
  }
  const scenario = lireOption('--scenario', 'A')
  const sortie = lireOption('--sortie', join('tests', 'planning', 'fixtures', `catalogue-servi-base-${scenario}.json`))
  const description = lireOption('--description', '')
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL est requis (postgres://...)')

  // La transaction ne fait que lire, et elle est annulée : ce script ne peut
  // pas modifier la base qu'il capture.
  const client = await ouvrirLectureAuthentifiee(url)
  try {
    const catalogue = await lireCatalogueServi(client)
    const codes = catalogue.recettes.map((recette) => recette.code)
    const componentsPortesEnBase = await compterComponentsPortes(client, codes)
    const jumeauxEnBase = await lireJumeauxEnBase(client)
    const { rows: versions } = await client.query(
      `SELECT count(*)::int AS versions,
              count(*) FILTER (WHERE rv.planning_eligible)::int AS planifiables
         FROM culinary.recipe_versions rv
         JOIN ops.source_datasets ds ON ds.id = rv.source_dataset_id
        WHERE ds.code = 'myko_editorial_v3'`,
    )

    const document = {
      provenance: {
        scenario,
        description,
        capturéLe: new Date().toISOString().slice(0, 10),
        contractVersion: catalogue.contractVersion,
        arretDeLecture: catalogue.arret,
        pagesLues: catalogue.pages,
        empreintesDuContrat: empreintesDuContrat(),
        clesGardees: { recette: [...CLES_RECETTE], ingredient: [...CLES_INGREDIENT] },
        clesJetees: ['exactSteps', 'sensory', 'per100g', 'description', 'techniques', 'variants', 'allergens'],
        comptes: {
          versionsV3: versions[0]?.versions ?? null,
          planifiables: versions[0]?.planifiables ?? null,
          servies: catalogue.recettes.length,
          eligibleCountDeclareParLaRpc: catalogue.eligibleCount,
          ingredientsServis: catalogue.recettes.reduce((total, r) => total + r.exactIngredients.length, 0),
          componentsPortesEnBase,
          jumeauxEnBase: jumeauxEnBase.length,
        },
        regenerer: `DATABASE_URL=postgres://... node scripts/db/capture-catalogue-servi.mjs --scenario ${scenario}`,
      },
      componentsPortesEnBase,
      jumeauxEnBase,
      recipes: catalogue.recettes,
    }

    const chemin = resolve(RACINE, sortie)
    mkdirSync(dirname(chemin), { recursive: true })
    // Une recette par ligne : le fichier reste un JSON valide, et une capture
    // rejouée se relit en diff au lieu d'être une ligne de 900 kio que personne
    // ne peut comparer.
    const { recipes, ...entete } = document
    const lignesEntete = Object.entries(entete)
      .map(([cle, valeur]) => `  ${JSON.stringify(cle)}: ${JSON.stringify(valeur, null, 2).split('\n').join('\n  ')}`)
    const corps = recipes.map((recette) => `    ${JSON.stringify(recette)}`).join(',\n')
    writeFileSync(chemin, `{\n${lignesEntete.join(',\n')},\n  "recipes": [\n${corps}\n  ]\n}\n`)
    process.stdout.write(
      `capture ${scenario} : ${catalogue.recettes.length} recettes, ` +
      `${document.provenance.comptes.ingredientsServis} ingrédients, ` +
      `${componentsPortesEnBase} components portés en base, ` +
      `${jumeauxEnBase.length} jumeaux → ${sortie}\n`,
    )
  } finally {
    await fermerLecture(client)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  principal().catch((erreur) => {
    process.stderr.write(`${erreur.stack || erreur.message}\n`)
    process.exitCode = 1
  })
}
