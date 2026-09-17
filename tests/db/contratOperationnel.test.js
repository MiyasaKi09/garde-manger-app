import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ORIGINS } from '@/lib/domain/foods/origins'
import {
  conservationProfileFromContract,
  conservationProfileFromCorpus,
} from '@/lib/domain/recipes/conservationProfile'
import { materializeOperationalRecipe } from '@/lib/domain/recipes/operationalCatalog'

/**
 * LE CONTRAT OPÉRATIONNEL, VÉRIFIÉ SANS BASE.
 *
 * La vérité de ce chantier se joue sur une base : c'est
 * supabase/tests/contrat_operationnel.sql qui l'établit, rejoué deux fois par le
 * job `db-tests` de la CI — une fois sur la chaîne de publication, une fois sur
 * le chemin des migrations. Ce fichier-ci tient ce que Vitest peut tenir sans
 * Postgres, et rien de plus :
 *
 *   — le TEXTE des migrations dit bien ce qu'on croit qu'il dit (les quatre
 *     champs projetés, la signature inchangée, le vocabulaire recopié à
 *     l'identique depuis lib/domain/foods/origins.js) ;
 *   — les chargeurs GÉNÉRÉS portent les valeurs, forme par forme et recette par
 *     recette, au compte près ;
 *   — le code qui LIT ces champs traite une valeur mal formée comme une absence,
 *     et jamais comme une valeur plausible.
 *
 * Un test qui lit du SQL comme du texte a une limite qu'il vaut mieux écrire :
 * il prouve qu'une projection est écrite, pas qu'elle rend la bonne valeur.
 * C'est exactement la raison d'être des assertions SQL, et c'est pourquoi
 * celles-ci ne les remplacent pas.
 */

const RACINE = process.cwd()
const lire = (...segments) => readFileSync(join(RACINE, ...segments), 'utf8')

const MIGRATION = lire('supabase', 'migrations', '20260917110000_contrat_operationnel.sql')
const ROLLBACK = lire('supabase', 'migrations', '20260917110000_contrat_operationnel_rollback.sql')
const VALEURS = lire('supabase', 'migrations', '20260917111000_contrat_operationnel_valeurs.sql')
const RPC_ORIGINE = lire('supabase', 'migrations', '20260715190000_v3_operational_recipe_api.sql')
const CATALOGUE = JSON.parse(lire('scripts', 'data', 'out', 'recipe-food-catalog.json'))
const CORPUS = JSON.parse(lire('data', 'recipes', 'corpus-v3.json'))
const MANIFESTE = JSON.parse(lire('scripts', 'db', 'migration-manifest.json'))

describe('contrat opérationnel — la migration', () => {
  it('ajoute les deux colonnes déclaratives de façon idempotente, et son rollback les retire', () => {
    expect(MIGRATION).toContain('ALTER TABLE catalog.food_forms\n  ADD COLUMN IF NOT EXISTS origin text')
    expect(MIGRATION).toContain('ADD COLUMN IF NOT EXISTS conservation_profile jsonb')
    expect(ROLLBACK).toContain('DROP COLUMN IF EXISTS origin')
    expect(ROLLBACK).toContain('DROP COLUMN IF EXISTS conservation_profile')
  })

  it('contraint l’origine au vocabulaire fermé du planificateur, sans en oublier ni en inventer', () => {
    const contrainte = MIGRATION.match(/CONSTRAINT food_forms_origin_check[\s\S]*?\]\)\);/)?.[0]
    expect(contrainte, 'la contrainte de vocabulaire est introuvable').toBeTruthy()
    const valeurs = [...contrainte.matchAll(/'([a-z:_]+)'::text/g)].map((match) => match[1])
    // L'égalité, pas l'inclusion : une valeur en trop côté base accepterait une
    // origine que le moteur ne sait pas lire, une valeur en moins refuserait un
    // chargement légitime. Les deux listes doivent bouger ensemble.
    expect(valeurs).toEqual([...ORIGINS])
  })

  it('projette les quatre champs que le moteur attend, et sous les noms qu’il lit', () => {
    // Ce sont les noms exacts lus par lib/domain/recipes/operationalCatalog.js,
    // lib/domain/planning/sharedBases.js et recipeLineage().
    expect(MIGRATION).toContain("'origin', form.origin")
    expect(MIGRATION).toContain("'conservationProfile', culinary.conservation_profile_contract(recipe.conservation_profile)")
    expect(MIGRATION).toContain("'derivedFrom', recipe.derived_from_code")
    expect(MIGRATION).toContain("'component', CASE WHEN child_version.id IS NULL THEN NULL ELSE jsonb_build_object(")
    for (const cle of ['code', 'name', 'requiredQuantity', 'requiredUnit', 'yieldQuantity', 'yieldUnit']) {
      expect(MIGRATION).toContain(`'${cle}',`)
    }
    // Et la RPC d'origine n'en publiait aucun : c'est la mesure du §0.3 du plan,
    // rejouée ici pour que le point de départ ne se perde pas.
    expect(RPC_ORIGINE).not.toContain("'derivedFrom'")
    expect(RPC_ORIGINE).not.toContain("'conservationProfile'")
    expect(RPC_ORIGINE).not.toContain("'component'")
    expect(RPC_ORIGINE).not.toContain("'origin', form.origin")
  })

  it('ne change pas la signature de la RPC ni ses plafonds', () => {
    const signature = /CREATE OR REPLACE FUNCTION public\.get_operational_recipe_catalog_v3\(\n {2}p_code text DEFAULT NULL,\n {2}p_limit integer DEFAULT 100,\n {2}p_offset integer DEFAULT 0\n\)/
    expect(MIGRATION).toMatch(signature)
    expect(RPC_ORIGINE).toMatch(signature)
    // Les deux plafonds restent ceux sur lesquels la pagination de
    // lib/db/operationalRecipeCatalog.js est calibrée. Les relever ici aurait
    // été un autre chantier, et l'aurait rendue silencieusement fausse.
    expect(MIGRATION).toContain('LIMIT greatest(1, least(coalesce(p_limit, 100), 100))')
    expect(MIGRATION).toContain('OFFSET greatest(0, least(coalesce(p_offset, 0), 10000))')
    // Les deux LEFT JOIN ajoutés ne doivent pas pouvoir faire disparaître un
    // ingrédient ni une recette : c'est ce qui distingue un enrichissement de
    // projection d'un changement de contrat.
    expect(MIGRATION).toContain('LEFT JOIN culinary.recipe_versions base ON base.id = rv.derived_from_version_id')
    expect(MIGRATION).toContain('LEFT JOIN culinary.recipe_components component ON component.id = requirement.component_id')
    expect(MIGRATION).toContain('LEFT JOIN culinary.recipe_versions child_version ON child_version.id = component.sub_recipe_version_id')
  })

  it('est inscrite au manifeste avec son rollback, et n’écrase aucune version existante', () => {
    const versions = MANIFESTE.filter((entree) => entree.github_version.startsWith('20260917'))
    const contrat = MANIFESTE.find((entree) => entree.file === '20260917110000_contrat_operationnel.sql')
    const valeurs = MANIFESTE.find((entree) => entree.file === '20260917111000_contrat_operationnel_valeurs.sql')
    expect(contrat?.role).toBe('apply')
    expect(contrat?.baseline).toBe('new')
    expect(valeurs?.role).toBe('apply')
    expect(valeurs?.baseline).toBe('new')
    for (const fichier of [
      '20260917110000_contrat_operationnel_rollback.sql',
      '20260917111000_contrat_operationnel_valeurs_rollback.sql',
    ]) {
      expect(existsSync(join(RACINE, 'supabase', 'migrations', fichier)), fichier).toBe(true)
      expect(MANIFESTE.find((entree) => entree.file === fichier)?.role).toBe('rollback')
    }
    // Les dix tranches de corpus du 17 septembre gardent leur empreinte : les
    // régénérer avec la colonne nouvelle aurait fait refuser l'application par
    // dérive de checksum, au lieu de réparer la base.
    const tranches = versions.filter((entree) => entree.file.includes('corpus_v3_754_tranche') && entree.role === 'apply')
    expect(tranches).toHaveLength(10)
  })
})

describe('contrat opérationnel — la chaîne de publication', () => {
  it('le chargeur de formes écrit l’origine déclarée pour chacune des formes du catalogue', () => {
    const sql = lire('scripts', 'data', 'out', 'recipe-food-load.sql')
    const ecritures = [...sql.matchAll(/SET origin = '([^']*)', origin_source = (NULL|'(?:[^']|'')*')/g)]
    expect(ecritures).toHaveLength(CATALOGUE.forms.length)
    for (const forme of CATALOGUE.forms) {
      expect(ORIGINS, forme.canonical_name_normalized).toContain(forme.origin)
    }
    const origines = ecritures.map((match) => match[1]).sort()
    expect(origines).toEqual(CATALOGUE.forms.map((forme) => forme.origin).sort())
    // L'écriture est hors du `IF v_form IS NULL`, sinon elle ne toucherait que
    // les formes que ce chargement crée — quatorze sur 549 — et le catalogue
    // resterait sans origine sur une base déjà chargée.
    expect(sql).toContain('  END IF;\n\n  -- L\'ORIGINE BIOLOGIQUE, ÉCRITE APRÈS LE IF ET NON DEDANS.')
  })

  it('le chargeur de corpus écrit le profil de conservation déclaré', () => {
    const sql = lire('scripts', 'data', 'out', 'corpus-v3-load.sql')
    const colonnes = sql.match(/allergens, conservation_text, conservation_profile, planning_eligible/g) || []
    expect(colonnes).toHaveLength(CORPUS.recipes.length)
    const misesAJour = sql.match(/conservation_profile = EXCLUDED\.conservation_profile/g) || []
    expect(misesAJour).toHaveLength(CORPUS.recipes.length)
    // Le profil part dans la forme DÉCLARÉE par le corpus : c'est la RPC qui
    // traduit. Si le chargeur se mettait à écrire du camelCase, la fonction de
    // traduction rendrait six champs nuls sans que rien ne le signale.
    const temoin = CORPUS.recipes.find((recette) => recette.conservation_profile?.fridge_hours > 0)
    expect(sql).toContain(`"fridge_hours":${temoin.conservation_profile.fridge_hours}`)
    expect(sql).not.toContain('"fridgeHours"')
  })

  it('la publication F0 déclare une origine quand elle en a une, et n’en invente pas', () => {
    const emetteur = lire('scripts', 'data', 'publish', 'emit-publish.mjs')
    expect(emetteur).toContain('update catalog.food_forms ff')
    expect(emetteur).toContain("set origin = b.f->>'o', origin_source = b.f->>'os'")
    // Sans la clé `o`, la ligne n'est pas touchée : une origine déjà déclarée
    // par un autre chargeur ne doit jamais être remise à NULL par celui-ci.
    expect(emetteur).toContain("and b.f ? 'o'")
    const publication = lire('scripts', 'data', 'out', 'f0-publish', '10a-forms.sql')
    expect(publication).toContain("set origin = b.f->>'o', origin_source = b.f->>'os'")
  })

  it('la migration de valeurs porte les 549 origines et les profils de toutes les recettes déclarées', () => {
    const origines = [...VALEURS.matchAll(/^ {4}\('[^']*', '([a-z:_]+)', (?:NULL|'(?:[^']|'')*')\),?$/gm)]
    expect(origines).toHaveLength(CATALOGUE.forms.length)
    const profils = [...VALEURS.matchAll(/^ {4}\('([A-Z0-9-]+)', '\{/gm)]
    const declarees = CORPUS.recipes.filter((recette) => recette.conservation_profile)
    expect(profils).toHaveLength(declarees.length)
    expect(profils.map((match) => match[1]).sort()).toEqual(declarees.map((recette) => recette.code).sort())
    // Idempotence : chaque UPDATE est gardé. Un second passage n'écrit rien, et
    // un chargement de corpus postérieur n'est pas défait par cette migration.
    expect(VALEURS).toContain('AND (ff.origin IS DISTINCT FROM origines.origin')
    expect(VALEURS).toContain('AND rv.conservation_profile IS DISTINCT FROM profils.conservation_profile')
  })
})

describe('contrat opérationnel — ce que le moteur lit', () => {
  const profilBase = {
    fridgeHours: 72, eatImmediately: false, freezable: true,
    freezerMonths: 3, serveCold: null, source: 'parsed',
  }
  const recetteServie = (extra = {}) => ({
    code: 'TEST-001',
    servings: 2,
    exactIngredients: [{ formNormalized: 'lentille verte seche crue', quantity: 200, unit: 'g', grams: 200 }],
    exactSteps: [],
    ...extra,
  })

  it('accepte le profil publié par la base et le rend dans le vocabulaire du moteur', () => {
    const recette = materializeOperationalRecipe(recetteServie({ conservationProfile: profilBase }))
    expect(recette.conservationProfile).toEqual(profilBase)
  })

  it('traite un profil mal formé comme une absence, jamais comme une valeur plausible', () => {
    // Le cas qui coûterait cher : la base publie encore le profil en snake_case
    // (RPC antérieure, déploiement à moitié migré). Sans la porte de lecture, il
    // passerait le test « c'est un objet » et rendrait des durées indéfinies.
    const snake = { fridge_hours: 72, freezable: true, source: 'parsed' }
    expect(conservationProfileFromContract(snake)).toEqual({
      fridgeHours: null, eatImmediately: false, freezable: true, freezerMonths: null, serveCold: null, source: 'parsed',
    })
    expect(conservationProfileFromContract(null)).toBeNull()
    expect(conservationProfileFromContract('72h')).toBeNull()
    expect(conservationProfileFromContract([])).toBeNull()
    expect(conservationProfileFromContract({ fridgeHours: 0 }).fridgeHours).toBeNull()
    expect(conservationProfileFromContract({ fridgeHours: -4 }).fridgeHours).toBeNull()
    expect(conservationProfileFromContract({ freezable: 'oui' }).freezable).toBeNull()
    expect(conservationProfileFromContract({}).eatImmediately).toBe(false)
  })

  it('lit la même vérité que le corpus, champ pour champ, sur tout le corpus', () => {
    // La base publie la traduction, le corpus publie la déclaration : les deux
    // chemins doivent rendre le MÊME objet, sinon le retrait des raccords JSON
    // (livrable 0b.4) changerait des décisions de production sans le dire.
    for (const recette of CORPUS.recipes) {
      const parCorpus = conservationProfileFromCorpus(recette.conservation_profile)
      const parContrat = conservationProfileFromContract({
        fridgeHours: recette.conservation_profile.fridge_hours,
        eatImmediately: recette.conservation_profile.eat_immediately,
        freezable: recette.conservation_profile.freezable,
        freezerMonths: recette.conservation_profile.freezer_months,
        serveCold: recette.conservation_profile.serve_cold,
        source: recette.conservation_profile.source,
      })
      expect(parContrat, recette.code).toEqual(parCorpus)
    }
  })

  it('ne lit plus que l’origine publiée par la base, et rend « inconnu » quand elle se tait', () => {
    // CE TEST A CHANGÉ D'ATTENTE AVEC LE LIVRABLE 0b.4, ET LA CIBLE A CHANGÉ
    // AVEC LUI. Il s'appelait « préfère l'origine publiée par la base au raccord
    // JSON, ET GARDE LE RACCORD QUAND LA BASE SE TAIT », et sa seconde
    // assertion attendait 'vegetal' : le raccord de
    // `lib/domain/recipes/operationalCatalog.js` allait chercher l'origine de
    // « lentille verte seche crue » dans `scripts/data/out/recipe-food-catalog.json`
    // quand la charge utile n'en portait pas. Le livrable 0b.4 a retiré ce
    // raccord — c'est son objet même, et le §9.3 du plan en fait un interdit :
    // « zéro champ du contrat opérationnel rustiné depuis le JSON ».
    //
    // L'attente n'est pas abaissée, elle est DURCIE : là où le fichier embarqué
    // pouvait combler un silence de la base par une valeur juste, il ne le peut
    // plus, et le silence ressort comme silence. C'est ce que le dépôt demande
    // partout ailleurs — une absence se dit, elle ne se complète pas.
    //
    // Ce qui a rendu ce changement possible plutôt que dangereux est mesuré :
    // la porte 0b.3 passe sur le chemin base, raccords neutralisés, et
    // `tests/planning/retraitRaccordsJson.test.js` rejoue la mesure — 0 origine
    // « inconnu » et 0 profil absent sur les 509 recettes servies, en [A] comme
    // en [B], 227 plats végétariens, les mêmes chiffres avec les raccords et
    // sans eux.
    const servieAvecOrigine = materializeOperationalRecipe(recetteServie({
      exactIngredients: [{ formNormalized: 'lentille verte seche crue', quantity: 200, unit: 'g', grams: 200, origin: 'animal:viande' }],
    }))
    // L'origine publiée par la base est la seule source, même quand elle
    // contredit le catalogue embarqué : le contrôle de cette contradiction
    // appartient à `tests/planning/retraitRaccordsJson.test.js`, qui confronte
    // les deux déclarations forme par forme sur le catalogue servi, et non au
    // matérialiseur, qui ne doit rien arbitrer.
    expect(servieAvecOrigine.exactIngredients[0].origin).toBe('animal:viande')

    // La base se tait : plus rien ne comble. C'est l'assertion qui a changé, et
    // c'est elle qui interdit le retour du raccord — cette forme-là porte bien
    // `origin: vegetal` dans le catalogue embarqué (vérifié), donc un raccord
    // réintroduit rendrait 'vegetal' et ferait rougir cette ligne.
    const servieSansOrigine = materializeOperationalRecipe(recetteServie())
    expect(servieSansOrigine.exactIngredients[0].origin).toBe('inconnu')

    const horsVocabulaire = materializeOperationalRecipe(recetteServie({
      exactIngredients: [{ formNormalized: 'inexistante au catalogue', quantity: 1, unit: 'u', grams: 1, origin: 'animal:licorne' }],
    }))
    expect(horsVocabulaire.exactIngredients[0].origin).toBe('inconnu')
  })

  it('met le component à l’échelle des portions sans perdre le code de la base', () => {
    const recette = materializeOperationalRecipe(recetteServie({
      servings: 4,
      exactIngredients: [{
        formNormalized: 'lait entier', quantity: 250, unit: 'ml', grams: 257.5,
        component: { code: 'FR-024', name: 'Béchamel maison', requiredQuantity: 240, requiredUnit: 'g', yieldQuantity: 870, yieldUnit: 'g' },
      }],
    }), { servings: 2 })
    expect(recette.exactIngredients[0].component).toEqual({
      code: 'FR-024', name: 'Béchamel maison', requiredQuantity: 120, requiredUnit: 'g', yieldQuantity: 870, yieldUnit: 'g',
    })
  })
})
