import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  dateDeVersement,
  debutDeSemaine,
  joursEntre,
  jourEnFrancais,
  nouveautes,
  phraseDeVersement,
} from '@/lib/domain/recipes/versement'
import {
  materializeOperationalCatalog,
  operationalRecipeCards,
} from '@/lib/domain/recipes/operationalCatalog'

/**
 * LA DATE DE VERSEMENT, CE QU'ELLE PERMET ET CE QU'ELLE NE PERMET PAS.
 *
 * Ce que ce fichier tient, et qu'aucune base n'est requise pour tenir :
 *   — l'arithmétique des semaines, en UTC, y compris le dimanche et les
 *     passages de mois (piège n°4 du CLAUDE.md) ;
 *   — le refus de tout ce qui n'est pas une journée civile — `true`, `''`,
 *     `[]`, `0`, le 30 février (piège n°4 des règles de travail : `Number(true)`
 *     vaut 1 et `Number('')` vaut 0, et une date fabriquée depuis l'un ou
 *     l'autre serait affichée comme vraie) ;
 *   — le fait qu'une carte SANS date ne reçoive jamais de date de repli, ni au
 *     matérialiseur ni à la fabrique de cartes. C'est la seule garde que le SQL
 *     ne peut pas tenir : un repli JavaScript daterait des recettes que la base
 *     ne date pas, et l'écran les montrerait comme des nouveautés ;
 *   — la cohérence registre ↔ migration ↔ chargeur, au code près.
 *
 * Ce qu'il NE tient pas, et qui se joue ailleurs : que la base porte vraiment
 * ces dates, et que les deux RPC les publient. C'est `supabase/tests/date_versement.sql`,
 * rejoué deux fois par le job `db-tests` de la CI — une fois sur la chaîne de
 * publication, une fois sur le chemin des migrations.
 */

const RACINE = process.cwd()
const lire = (...segments) => readFileSync(join(RACINE, ...segments), 'utf8')

const REGISTRE = JSON.parse(lire('data', 'recipes', 'versements.json'))
const CORPUS = JSON.parse(lire('data', 'recipes', 'corpus-v3.json'))
const MIGRATION = lire('supabase', 'migrations', '20260919140000_date_versement.sql')
const ROLLBACK = lire('supabase', 'migrations', '20260919140000_date_versement_rollback.sql')
const VALEURS = lire('supabase', 'migrations', '20260919141000_date_versement_lot_jumeaux.sql')
const VALEURS_ROLLBACK = lire('supabase', 'migrations', '20260919141000_date_versement_lot_jumeaux_rollback.sql')
const CHARGEUR = lire('scripts', 'data', 'recipes', 'build-corpus-v3.mjs')
const ROUTE = lire('app', 'api', 'recipes', 'nouveautes', 'route.js')
const MANIFESTE = JSON.parse(lire('scripts', 'db', 'migration-manifest.json'))

describe('date de versement — la lecture d’une journée civile', () => {
  it('accepte une journée civile et le premier segment d’un horodatage', () => {
    expect(dateDeVersement('2026-09-04')).toBe('2026-09-04')
    expect(dateDeVersement('2026-09-04T12:56:56+00:00')).toBe('2026-09-04')
    expect(dateDeVersement('  2026-09-04  ')).toBe('2026-09-04')
  })

  it('refuse tout ce que Number() rendrait plausible, et rend une ABSENCE', () => {
    // `Number(true)` vaut 1, `Number('')` et `Number([])` valent 0 : trois
    // fautes de cette famille ont déjà été trouvées dans ce dépôt. Aucune de
    // ces valeurs ne doit devenir une date.
    for (const valeur of [true, false, '', [], {}, 0, 1, 20260904, null, undefined, NaN]) {
      expect(dateDeVersement(valeur), `${String(valeur)} ne doit pas être une date`).toBeNull()
    }
  })

  it('refuse une date qui n’existe pas au calendrier', () => {
    expect(dateDeVersement('2026-02-30')).toBeNull()
    expect(dateDeVersement('2026-13-01')).toBeNull()
    expect(dateDeVersement('2026-00-10')).toBeNull()
    expect(dateDeVersement('2026-9-4')).toBeNull()
    expect(dateDeVersement('04/09/2026')).toBeNull()
    // 2026 n'est pas bissextile : le 29 février n'y existe pas.
    expect(dateDeVersement('2026-02-29')).toBeNull()
    expect(dateDeVersement('2024-02-29')).toBe('2024-02-29')
  })
})

describe('date de versement — la semaine, en UTC', () => {
  it('ramène chaque jour au lundi de sa semaine', () => {
    // 2026-09-14 est un lundi ; du 14 au 20, tout ramène au 14.
    for (const jour of ['2026-09-14', '2026-09-15', '2026-09-17', '2026-09-20']) {
      expect(debutDeSemaine(jour)).toBe('2026-09-14')
    }
  })

  it('range le dimanche dans la semaine qui se termine, pas dans celle qui commence', () => {
    expect(debutDeSemaine('2026-09-20')).toBe('2026-09-14') // dimanche
    expect(debutDeSemaine('2026-09-21')).toBe('2026-09-21') // lundi suivant
  })

  it('traverse un changement de mois sans se décaler', () => {
    expect(debutDeSemaine('2026-09-02')).toBe('2026-08-31')
    expect(debutDeSemaine('2026-01-01')).toBe('2025-12-29')
  })

  it('compte les jours en UTC, y compris par-dessus un changement d’heure', () => {
    // Le passage à l'heure d'hiver en France a lieu le 25 octobre 2026. Compté
    // en heure locale, l'écart 24 → 26 octobre ferait 2,04 jours et
    // s'arrondirait encore à 2 ; l'erreur ne se voit que sur une longue série,
    // et c'est précisément pourquoi on ne compte jamais en local.
    expect(joursEntre('2026-10-24', '2026-10-26')).toBe(2)
    expect(joursEntre('2026-09-04', '2026-09-17')).toBe(13)
    expect(joursEntre('2026-09-17', '2026-09-17')).toBe(0)
    expect(joursEntre('2026-09-17', '2026-09-16')).toBe(-1)
    expect(joursEntre('', '2026-09-17')).toBeNull()
  })

  it('dit la journée en français sans passer par le fuseau du navigateur', () => {
    expect(jourEnFrancais('2026-09-04')).toBe('4 septembre 2026')
    expect(jourEnFrancais('2026-01-31')).toBe('31 janvier 2026')
    expect(jourEnFrancais(true)).toBeNull()
  })
})

const carte = (id, date) => ({ key: `canonical-${id}`, id, title: `Plat ${id}`, poured_on: date })

describe('date de versement — ce que l’écran montre', () => {
  it('montre le lot de la semaine quand il y en a un', () => {
    const resume = nouveautes(
      [carte('A', '2026-09-15'), carte('B', '2026-09-16'), carte('C', '2026-09-04'), carte('D', null)],
      { maintenant: '2026-09-17' },
    )
    expect(resume.affichage).toBe('semaine')
    expect(resume.compte).toBe(2)
    expect(resume.recettes.map((r) => r.id)).toEqual(['B', 'A'])
    expect(resume.debutSemaine).toBe('2026-09-14')
    expect(resume.catalogue).toEqual({ total: 4, datees: 3, nonDatees: 1 })
    // Deux journées distinctes dans la semaine : la phrase ne peut pas dire
    // « le 16 » pour une recette arrivée le 15.
    expect(phraseDeVersement(resume)).toBe(
      '2 recettes versées cette semaine, en 2 lots — le dernier le 16 septembre 2026.',
    )
  })

  it('nomme la journée quand la semaine ne porte qu’un lot', () => {
    const resume = nouveautes(
      [carte('A', '2026-09-16'), carte('B', '2026-09-16'), carte('C', null)],
      { maintenant: '2026-09-17' },
    )
    expect(phraseDeVersement(resume)).toBe('2 recettes versées cette semaine, le 16 septembre 2026.')
  })

  it('montre le dernier lot connu, DATÉ, quand la semaine est vide', () => {
    const resume = nouveautes(
      [carte('A', '2026-09-04'), carte('B', '2026-09-04'), carte('C', '2026-08-20'), carte('D', null)],
      { maintenant: '2026-09-17' },
    )
    expect(resume.affichage).toBe('dernier_lot')
    expect(resume.compte).toBe(2)
    expect(resume.dernierVersement).toEqual({ date: '2026-09-04', compte: 2, joursDepuis: 13 })
    // La phrase DIT que la semaine est vide : c'est ce qui distingue un
    // catalogue vivant d'un catalogue immobile.
    expect(phraseDeVersement(resume)).toBe(
      'Aucun lot versé cette semaine. Dernier lot : 2 recettes le 4 septembre 2026, il y a 13 jours.',
    )
  })

  it('dit qu’aucune recette n’est datée plutôt que d’en inventer une', () => {
    const resume = nouveautes([carte('A', null), carte('B', true), carte('C', '')], { maintenant: '2026-09-17' })
    expect(resume.affichage).toBe('aucune_date')
    expect(resume.recettes).toEqual([])
    expect(resume.catalogue.nonDatees).toBe(3)
    expect(phraseDeVersement(resume)).toBe('Aucune recette du catalogue ne porte de date de versement.')
  })

  it('ne casse pas sur une charge utile qui n’a pas la forme attendue', () => {
    // La bande de l'accueil affiche cette phrase depuis une réponse HTTP. Une
    // charge tronquée, ou remplacée par un `{ ok: true }` — ce que rend la
    // doublure d'API des tests e2e pour toute route qu'elle ne connaît pas —
    // doit rendre l'absence, pas lever.
    expect(phraseDeVersement({ ok: true })).toBe('Aucune recette du catalogue ne porte de date de versement.')
    expect(phraseDeVersement(null)).toBe('Aucune recette du catalogue ne porte de date de versement.')
    expect(phraseDeVersement({ affichage: 'dernier_lot', compte: 2, dernierVersement: { date: true } }))
      .toBe('Aucune recette du catalogue ne porte de date de versement.')
  })

  it('accepte le contrat de lecture de la RPC (`pouredOn`) comme celui de la carte', () => {
    const resume = nouveautes([{ id: 'X', pouredOn: '2026-09-16' }], { maintenant: '2026-09-17' })
    expect(resume.affichage).toBe('semaine')
    expect(resume.recettes[0].verseLe).toBe('2026-09-16')
  })

  it('refuse une date de référence illisible au lieu de retomber sur aujourd’hui', () => {
    expect(() => nouveautes([], { maintenant: 'la semaine dernière' })).toThrow(TypeError)
    expect(() => nouveautes([], { maintenant: new Date('nawak') })).toThrow(TypeError)
  })
})

describe('date de versement — aucune date n’est fabriquée en chemin', () => {
  const chargeRpc = {
    contractVersion: 'v3-editorial-1',
    metadata: { source: 'supabase' },
    recipes: [
      { code: 'JUM-001', family: 'Jumeau', servings: 2, pouredOn: '2026-09-04', exactIngredients: [], exactSteps: [], variants: [] },
      { code: 'FR-002', family: 'Ancien', servings: 2, exactIngredients: [], exactSteps: [], variants: [] },
    ],
  }

  it('porte la date jusqu’à la carte, et laisse NULL ce que la base laisse NULL', () => {
    const cartes = operationalRecipeCards(materializeOperationalCatalog(chargeRpc).recipes)
    expect(cartes.map((c) => [c.id, c.poured_on])).toEqual([
      ['JUM-001', '2026-09-04'],
      ['FR-002', null],
    ])
  })

  it('ne montre QUE la recette datée, même à une date où le lot est de la semaine', () => {
    const cartes = operationalRecipeCards(materializeOperationalCatalog(chargeRpc).recipes)
    const resume = nouveautes(cartes, { maintenant: '2026-09-04' })
    expect(resume.affichage).toBe('semaine')
    expect(resume.recettes.map((r) => r.id)).toEqual(['JUM-001'])
    expect(resume.catalogue.nonDatees).toBe(1)
  })
})

describe('date de versement — registre, migration et chargeur disent la même chose', () => {
  const lots = REGISTRE.versements
  const codesDuRegistre = lots.flatMap((lot) => lot.codes)

  it('le registre ne porte que des lots datés, prouvés, et sans code en double', () => {
    expect(lots.length).toBeGreaterThan(0)
    for (const lot of lots) {
      expect(dateDeVersement(lot.verse_le), `lot ${lot.lot}`).toBe(lot.verse_le)
      expect(lot.preuve?.commit).toMatch(/^[0-9a-f]{40}$/)
      expect(lot.codes.length).toBeGreaterThan(0)
    }
    expect(new Set(codesDuRegistre).size).toBe(codesDuRegistre.length)
  })

  it('chaque code du registre existe au corpus', () => {
    const auCorpus = new Set(CORPUS.recipes.map((recette) => recette.code))
    const absents = codesDuRegistre.filter((code) => !auCorpus.has(code))
    expect(absents).toEqual([])
  })

  it('le registre porte de quoi remplir l’écran — le seuil du plan est de 30', () => {
    // §5, phase 5 : « ≥ 30 recettes datées visibles depuis l'accueil ». Le
    // registre est la seule source de ces recettes ; s'il descend sous ce
    // seuil, l'écran n'a plus de lot à montrer et ce test le dit ici, avant la
    // base.
    expect(codesDuRegistre.length).toBeGreaterThanOrEqual(30)
  })

  it('la migration de valeurs porte EXACTEMENT les codes et la date du registre', () => {
    for (const lot of lots) {
      expect(VALEURS).toContain(`SET corpus_poured_on = DATE '${lot.verse_le}'`)
      expect(VALEURS_ROLLBACK).toContain(`rv.corpus_poured_on = DATE '${lot.verse_le}'`)
    }
    const codesEcrits = [...VALEURS.matchAll(/'([A-Z]+-\d+)'/g)].map((trouve) => trouve[1])
    // L'égalité, pas l'inclusion : un code en trop daterait une recette que
    // personne n'a versée ce jour-là, un code en moins la laisserait invisible.
    expect([...codesEcrits].sort()).toEqual([...codesDuRegistre].sort())
    const codesRendus = [...VALEURS_ROLLBACK.matchAll(/'([A-Z]+-\d+)'/g)].map((trouve) => trouve[1])
    expect([...codesRendus].sort()).toEqual([...codesDuRegistre].sort())
  })

  it('la migration ajoute la colonne de façon idempotente, et son rollback la retire', () => {
    expect(MIGRATION).toContain('ADD COLUMN IF NOT EXISTS corpus_poured_on date')
    expect(MIGRATION).toContain('CREATE INDEX IF NOT EXISTS idx_recipe_versions_corpus_poured_on')
    expect(MIGRATION).toContain('recipe_versions_corpus_poured_on_check')
    expect(ROLLBACK).toContain('DROP COLUMN IF EXISTS corpus_poured_on')
    expect(ROLLBACK).toContain('DROP FUNCTION IF EXISTS public.get_recipe_pour_summary_v3(date)')
    // Le second passage ne doit toucher aucune ligne : c'est la clause qui le
    // garantit, et elle vaut pour chaque lot du registre.
    expect(VALEURS).toContain('IS DISTINCT FROM')
  })

  it('la migration projette la date dans la RPC ÉDITORIALE, celle que l’écran lit', () => {
    expect(MIGRATION).toContain("'pouredOn', recipe.corpus_poured_on")
    expect(MIGRATION).toContain("'latestPouredOn', (SELECT max(corpus_poured_on) FROM qualified)")
    // La signature ne bouge pas : les deux sites d'appel et leur pagination
    // sont inchangés.
    expect(MIGRATION).toContain('public.get_editorial_recipe_catalog_v3(\n  p_code text DEFAULT NULL,\n  p_limit integer DEFAULT 500,\n  p_offset integer DEFAULT 0\n)')
    // Et elle ne touche PAS la RPC opérationnelle : le solveur n'a pas à savoir
    // qu'une recette est nouvelle.
    expect(MIGRATION).not.toContain('get_operational_recipe_catalog_v3')
  })

  it('le chargeur lit le registre et n’efface jamais une date déjà connue', () => {
    expect(CHARGEUR).toContain("'versements.json'")
    expect(CHARGEUR).toContain('corpus_poured_on = coalesce(EXCLUDED.corpus_poured_on, culinary.recipe_versions.corpus_poured_on)')
    // Aucun repli : une recette absente du registre part avec NULL.
    expect(CHARGEUR).toContain("return jour ? `DATE ${q(jour)}` : 'NULL'")
  })

  it('la route de l’accueil ne lit que des métadonnées que la RPC déclare', () => {
    // Le défaut que ce contrôle vise : une clé renommée d'un côté et pas de
    // l'autre. La route rendrait alors `null` sans erreur, et la bande de
    // l'accueil afficherait une absence là où la base a un chiffre — la phase 4
    // a déjà payé une divergence de ce genre entre un contrat et son lecteur.
    const resume = MIGRATION.slice(MIGRATION.indexOf('get_recipe_pour_summary_v3'))
    const cles = [...ROUTE.matchAll(/metadata\.([A-Za-z]+)/g)].map((trouve) => trouve[1])
    expect(cles.length).toBeGreaterThan(0)
    for (const cle of new Set(cles)) {
      expect(resume, `la RPC ne déclare pas metadata.${cle}`).toContain(`'${cle}',`)
    }
    // Et la route appelle bien CETTE fonction-là.
    expect(ROUTE).toContain("supabase.rpc('get_recipe_pour_summary_v3'")
  })

  it('les quatre fichiers de migration sont au manifeste, avec les objets attendus', () => {
    const parFichier = new Map(MANIFESTE.map((entree) => [entree.file, entree]))
    for (const fichier of [
      '20260919140000_date_versement.sql',
      '20260919140000_date_versement_rollback.sql',
      '20260919141000_date_versement_lot_jumeaux.sql',
      '20260919141000_date_versement_lot_jumeaux_rollback.sql',
    ]) {
      expect(parFichier.has(fichier), `${fichier} absent du manifeste`).toBe(true)
    }
    expect(parFichier.get('20260919140000_date_versement.sql').expected_objects).toEqual([
      { type: 'column', schema: 'culinary', table: 'recipe_versions', name: 'corpus_poured_on' },
      { type: 'function', schema: 'public', name: 'get_recipe_pour_summary_v3' },
    ])
  })
})
