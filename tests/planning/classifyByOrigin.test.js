import { describe, expect, it } from 'vitest'
import corpus from '@/data/recipes/corpus-v3.json'
import foodCatalog from '@/scripts/data/out/recipe-food-catalog.json'
import { classifyRecipe, violatesHardConstraints } from '@/lib/domain/planning/closedLoopPlanner'
import { getCanonicalRecipe, getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { normalizeFoodForm } from '@/lib/domain/recipes/materializeRecipe'
import { ingredientOrigin, isFishOrigin, isMeatOrigin } from '@/lib/domain/foods/origins'
import { toGramsV2 } from '@/lib/domain/units'

// La classification carné / végétarien lit l'ORIGINE déclarée de chaque
// ingrédient, et rien d'autre. Ces tests la rejouent sur TOUT le vivier
// publiable — pas un échantillon — et sur les cas que la mesure du plan a
// nommés : le boudin servi en « variante végétarienne », la soupe à l'oignon
// au bouillon de volaille, le tofu compté comme viande.

const recettes = getCanonicalRecipes()
const parCle = new Map(foodCatalog.forms.map((form) => [form.canonical_name_normalized, form]))
const nomsObligatoires = (recipe) => (recipe.exactIngredients || []).filter((ingredient) => !ingredient.optional)

/**
 * Recette matérialisée depuis ses ingrédients ÉDITORIAUX, avec l'origine et la
 * nutrition du catalogue — sans le filtre de confiance de materializeRecipe,
 * qui saute les proxys de confiance C et rendrait une recette non publiable
 * faussement végétarienne en oubliant justement son bouillon d'anchois.
 */
function depuisLeCorpus(code, { sans = [] } = {}) {
  const editorial = corpus.recipes.find((recipe) => recipe.code === code)
  expect(editorial, code).toBeTruthy()
  const exactIngredients = editorial.ingredients
    .filter((ingredient) => !sans.includes(ingredient.form))
    .map((ingredient) => {
      const form = parCle.get(normalizeFoodForm(ingredient.form))
      expect(form, `${code} : ${ingredient.form} absent du catalogue`).toBeTruthy()
      const conversion = toGramsV2(Number(ingredient.quantity), ingredient.unit, form.conversion || {})
      return {
        name: ingredient.form,
        formNormalized: form.canonical_name_normalized,
        role: ingredient.role,
        optional: Boolean(ingredient.optional),
        grams: conversion.ok ? conversion.grams : Number(ingredient.quantity),
        per100g: form.per100g,
        category: form.category,
        origin: ingredientOrigin(form),
      }
    })
  return { ...editorial, exactIngredients }
}

describe('classification par origine, sur tout le vivier publiable', () => {
  it('ne rétrécit pas le vivier', () => {
    expect(recettes.length).toBeGreaterThanOrEqual(520)
  })

  it('ne classe végétarienne aucune recette contenant viande, volaille, poisson ou fruits de mer', () => {
    const fautives = recettes
      .filter((recipe) => classifyRecipe(recipe).vegetarian)
      .filter((recipe) => nomsObligatoires(recipe).some((ingredient) => {
        const origin = ingredientOrigin(ingredient)
        return isMeatOrigin(origin) || isFishOrigin(origin)
      }))
      .map((recipe) => recipe.code)
    expect(fautives).toEqual([])
  })

  // Le test ci-dessus ne peut PAS échouer tant que l'origine est vraie : il
  // relit `vegetarian` avec la définition qui l'a produit (« toutes les
  // origines obligatoires sont compatibles »), donc il vérifie le code et pas
  // la donnée. Un catalogue où tout serait déclaré « vegetal » le passerait.
  // Celui-ci est le contre-témoin indépendant : il rejoue la MESURE d'origine
  // (annexe A2 du plan) — les mots carnés dans les NOMS des ingrédients d'un
  // plat classé végétarien — sur les 706 recettes du corpus, ingrédients
  // écartés par un bloqueur compris. C'est le seul des deux qui tombe si une
  // origine est fausse.
  const MOTS_CARNES = [
    'boudin', 'lardons?', 'jambon', 'jambonneau', 'saucisses?', 'saucisson', 'chorizo', 'chourico', 'linguica',
    'bacon', 'poulet', 'volaille', 'b(?:œ|oe)uf', 'veau', 'porc', 'agneau', 'mouton', 'canard', 'dinde', 'oie',
    'pintade', 'caille', 'poule', 'lapin', 'gibier', 'merguez', 'guanciale', 'pancetta', 'chashu', 'morcilla',
    'abats', 'tripes', 'andouille', 'rillettes', 'terrine', 'charcuterie', 'foie', 'g(?:é|e)sier', 'magret',
    'lard', 'viande', 'steak', 'saindoux', 'chouri(?:ç|c)o', 'lingui(?:ç|c)a',
    'anchois', 'thon', 'saumon', 'cabillaud', 'morue', 'sardine', 'maquereau', 'colin', 'truite', 'hareng',
    'merlu', 'congre', 'brochet', 'rouget', 'bar', 'lieu', 'saint-pierre', 'poisson', 'fumet', 'dashi',
    'bonite', 'nuoc', 'surimi', 'eomuk',
    'crevettes?', 'moule', 'calamar', 'poulpe', 'seiche', 'encornet', 'homard', 'langoustine', 'crabe',
    'coquille', 'jacques', 'fruits de mer', 'hu(?:î|i)tre', 'bulot', 'bigorneau', 'caviar', 'tarama',
    'g(?:é|e)latine', 'worcestershire', 'escargot', 'grenouille',
  ]
  // La liste a été réglée CONTRE le catalogue, pas au jugé : sans « bar »,
  // « lieu », « saint-pierre », « jacques », « fruits de mer », « chouriço »
  // et « linguiça », sept formes animales du catalogue échappaient au
  // contre-témoin, qui aurait alors validé leur origine sans la regarder.
  // « confit » en a été retiré : il désigne une préparation, pas un animal,
  // et « Citron confit au sel » l'aurait fait crier à tort — « canard » et
  // « gésier » attrapent déjà les trois formes confites du catalogue.
  //
  // La seule forme végétale que le motif attrape reste « Sauce soja légère
  // spéciale poisson » : sauce soja POUR le poisson vapeur, déclarée végétale
  // par le lot21 et retirée de l'annexe A3 pour la même raison (voir
  // tests/data/formOrigins.test.js). On la nomme ici plutôt que d'affaiblir
  // le motif : une exception déclarée se relit, un mot retiré ne se voit plus.
  // Et « Saucisse végétale au tofu », entrée au catalogue avec les jumeaux
  // végétariens : le mot « saucisse » y désigne la FORME du produit, pas sa
  // matière — le libellé Ciqual dit lui-même « convient aux véganes ». Elle est
  // la protéine du cassoulet végétarien, qui serait sinon dénoncé par son
  // propre ingrédient. Nommée ici, comme la précédente, plutôt que de retirer
  // « saucisse » du motif : le mot doit continuer d'attraper la Morteau.
  const FAUSSE_ALERTE_CONNUE = ['Sauce soja légère spéciale poisson', 'Saucisse végétale au tofu']
  // Frontières Unicode : `\b` ne voit pas « é », et « bœuf » ne s'écrit pas
  // « boeuf » dans le corpus. Sans elles, « eau » sortirait de « veau ».
  const MOT_CARNE = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${MOTS_CARNES.join('|')})(?![\\p{L}\\p{N}_])`, 'iu')

  it('ne classe végétarienne, sur tout le corpus, aucune recette dont un ingrédient PORTE un nom carné', () => {
    const tout = getCanonicalRecipes({ eligibleOnly: false })
    expect(tout.length).toBeGreaterThanOrEqual(706)
    const fautives = tout
      .filter((recipe) => classifyRecipe(recipe).vegetarian)
      .map((recipe) => [
        recipe.code,
        [...nomsObligatoires(recipe), ...(recipe.blockedIngredients || [])]
          .map((ingredient) => ingredient.name)
          .filter((nom) => MOT_CARNE.test(nom) && !FAUSSE_ALERTE_CONNUE.includes(nom)),
      ])
      .filter(([, mots]) => mots.length)
    expect(fautives).toEqual([])
  })

  it('trouve bien un mot carné quand il y en a un (le contre-témoin sait échouer)', () => {
    // Un test qui ne peut pas échouer ne prouve rien : on vérifie que le
    // motif attrape les formes que la mesure du 3 septembre avait vues
    // classées végétariennes, et qu'il ne se déclenche pas sur les faux amis.
    for (const nom of ['Boudin noir à cuire', 'Bouillon de volaille', 'Bœuf haché cru', 'Sauce Worcestershire', 'Gélatine feuille', 'Bouillon d’anchois']) {
      expect(MOT_CARNE.test(nom), nom).toBe(true)
    }
    // Et sur TOUT le catalogue : aucune forme d'origine animale ne doit
    // échapper au motif, sans quoi le contre-témoin se tairait sur elle.
    const echappees = foodCatalog.forms
      .filter((form) => form.origin.startsWith('animal:') && !['animal:oeuf', 'animal:lait', 'animal:miel'].includes(form.origin))
      .filter((form) => !MOT_CARNE.test(form.canonical_name))
      .map((form) => form.canonical_name)
    expect(echappees).toEqual([])
    const faussesAlertes = foodCatalog.forms
      .filter((form) => !form.origin.startsWith('animal:') && MOT_CARNE.test(form.canonical_name))
      .map((form) => form.canonical_name)
    expect(faussesAlertes.sort()).toEqual([...FAUSSE_ALERTE_CONNUE].sort())
    for (const nom of ['Eau glacée', 'Oignon nouveau cru', 'Lait de coco', 'Tofu ferme', 'Chou-fleur frais']) {
      expect(MOT_CARNE.test(nom), nom).toBe(false)
    }
  })

  it('ne laisse aucune origine inconnue dans une recette publiable', () => {
    const inconnues = recettes
      .map((recipe) => [recipe.code, classifyRecipe(recipe).unknownOrigins])
      .filter(([, unknown]) => unknown.length)
    expect(inconnues).toEqual([])
  })

  it('tient carné et poisson comme des lectures indépendantes de l’origine', () => {
    for (const recipe of recettes) {
      const classification = classifyRecipe(recipe)
      const origins = nomsObligatoires(recipe).map(ingredientOrigin)
      expect(classification.meat, recipe.code).toBe(origins.some(isMeatOrigin))
      expect(classification.fish, recipe.code).toBe(origins.some(isFishOrigin))
      // Végétarien IMPLIQUE ni viande ni poisson, mais pas l'inverse : un plat
      // à l'escargot ('animal:autre') ou à la forme non arbitrée ('inconnu')
      // n'est ni l'un ni l'autre et n'est pas végétarien pour autant. Écrire
      // ici l'équivalence graverait dans le test une coïncidence du corpus du
      // jour (aucune des deux origines n'y figure) et couvrirait la lecture
      // faible que violatesHardConstraints faisait du régime végétarien.
      if (classification.vegetarian) {
        expect(classification.meat, recipe.code).toBe(false)
        expect(classification.fish, recipe.code).toBe(false)
      }
    }
  })

  it('ne tient plus le boudin noir (SRC-032-D4) pour une variante végétarienne', () => {
    const recipe = getCanonicalRecipe('SRC-032-D4')
    expect(recipe.eligible).toBe(true)
    const classification = classifyRecipe(recipe)
    expect(classification.vegetarian).toBe(false)
    expect(classification.meat).toBe(true)
    expect(classification.mainProtein).toBe('viande')
  })

  it('lit le bouillon de volaille de la soupe à l’oignon (FR-012)', () => {
    const recipe = getCanonicalRecipe('FR-012')
    expect(recipe.eligible).toBe(true)
    const classification = classifyRecipe(recipe)
    expect(classification.vegetarian).toBe(false)
    expect(classification.meat).toBe(true)
    // Carnée par son bouillon, mais sa protéine principale est le gruyère
    // (180 g, 48 g de protéines) et non les 7 g du litre et demi de bouillon.
    expect(classification.mainProtein).toBe('laitiers')
  })

  it('garde carnée une recette dont la viande a été écartée par un bloqueur', () => {
    // GR-001 (moussaka) n'est pas publiable : son « Agneau haché cru » est un
    // proxy de confiance C, que materializeRecipe écarte de la nutrition. Il
    // reste dans `blockedIngredients` avec son origine, et la moussaka reste
    // carnée — avant, l'agneau tu la faisait passer pour végétarienne.
    const moussaka = getCanonicalRecipes({ eligibleOnly: false }).find((recipe) => recipe.code === 'GR-001')
    expect(moussaka.eligible).toBe(false)
    expect(moussaka.blockedIngredients.map((ingredient) => [ingredient.name, ingredient.origin, ingredient.blockedBy]))
      .toEqual([['Agneau haché cru', 'animal:viande', 'food_form_low_confidence']])
    const classification = classifyRecipe(moussaka)
    expect(classification.vegetarian).toBe(false)
    expect(classification.meat).toBe(true)
  })

  it('donne au pastitsio (VAR-014) le bœuf pour protéine principale', () => {
    const recipe = getCanonicalRecipe('VAR-014')
    expect(recipe.eligible).toBe(true)
    const classification = classifyRecipe(recipe)
    expect(classification.mainProtein).toBe('boeuf')
    expect(classification.redMeat).toBe(true)
    expect(classification.meat).toBe(true)
    expect(classification.fish).toBe(false)
  })

  it('ne fait plus du tofu une viande', () => {
    // Aucune des dix recettes au tofu du corpus n'est végétarienne — chacune
    // porte du porc, du bœuf, un bouillon de volaille ou d'anchois, des
    // crevettes ou des krupuk — et aucune n'est encore publiable. Le doenjang
    // jjigae (REAL-233) est le cas le plus net : tofu ET bouillon d'anchois.
    // Avant ce chantier, « Tofu ferme » en catégorie viandes le rendait carné.
    const tofus = corpus.recipes.filter((recipe) => recipe.ingredients.some((ingredient) => /tofu/i.test(ingredient.form)))
    expect(tofus.length).toBeGreaterThanOrEqual(10)
    expect(parCle.get('tofu ferme').origin).toBe('vegetal')

    const jjigae = depuisLeCorpus('REAL-233')
    const classification = classifyRecipe(jjigae)
    expect(classification.meat).toBe(false)
    expect(classification.fish).toBe(true)
    expect(classification.vegetarian).toBe(false)

    // Le même plat sans son bouillon d'anchois est végétarien : c'est le
    // bouillon qui le rendait non végétarien, pas le tofu.
    const sansBouillon = classifyRecipe(depuisLeCorpus('REAL-233', { sans: ['Bouillon d’anchois'] }))
    expect(sansBouillon.vegetarian).toBe(true)
    expect(sansBouillon.meat).toBe(false)
    expect(sansBouillon.fish).toBe(false)
    expect(sansBouillon.mainProtein).toBe('vegetal')
  })
})

describe('classification par origine, règles unitaires', () => {
  const recette = (ingredients, extra = {}) => ({
    code: 'T', family: 'Test', eligible: true, servings: 2, prepMinutes: 10, cookMinutes: 10,
    allergens: [], techniques: [], sensory: { profile: 'warm_aromatic', scores: {} },
    exactIngredients: ingredients.map((ingredient) => ({ optional: false, formNormalized: normalizeFoodForm(ingredient.name), ...ingredient })),
    ...extra,
  })

  it('ne lit ni la catégorie ni le nom pour trancher carné / végétarien', () => {
    const boudin = classifyRecipe(recette([{ name: 'Boudin noir à cuire', category: 'produits_transformes', origin: 'animal:viande', grams: 300 }]))
    expect(boudin).toMatchObject({ meat: true, vegetarian: false })
    const tofu = classifyRecipe(recette([{ name: 'Tofu ferme', category: 'viandes', origin: 'vegetal', grams: 300 }]))
    expect(tofu).toMatchObject({ meat: false, fish: false, vegetarian: true, mainProtein: 'vegetal' })
    const coeurDeBoeuf = classifyRecipe(recette([{ name: 'Tomate cœur de bœuf', origin: 'vegetal', grams: 300 }]))
    expect(coeurDeBoeuf).toMatchObject({ meat: false, redMeat: false, vegetarian: true })
  })

  it('rend non végétarienne, et visible, une origine inconnue', () => {
    const classification = classifyRecipe(recette([
      { name: 'Poulet rôti', category: 'volailles', grams: 300 },
      { name: 'Carotte crue', origin: 'vegetal', grams: 200 },
    ]))
    expect(classification.vegetarian).toBe(false)
    expect(classification.meat).toBe(false)
    expect(classification.unknownOrigins).toEqual(['Poulet rôti'])
    expect(classification.mainProtein).toBe('inconnu')
  })

  it('ignore un ingrédient optionnel', () => {
    const classification = classifyRecipe(recette([
      { name: 'Lentilles vertes', origin: 'vegetal', grams: 300 },
      { name: 'Lardon fumé cru', origin: 'animal:viande', grams: 80, optional: true },
    ]))
    expect(classification).toMatchObject({ vegetarian: true, meat: false, mainProtein: 'lentilles' })
    // … mais le dit : qui sert ce plat à un végétarien doit omettre les lardons.
    expect(classification.optionalNonVegetarian).toEqual(['Lardon fumé cru'])
  })

  it('choisit la protéine principale par le rôle déclaré, puis par la masse de protéines', () => {
    const soupe = classifyRecipe(recette([
      { name: 'Bouillon de volaille', origin: 'animal:volaille', grams: 1500, per100g: { proteinG: 0.5 } },
      { name: 'Gruyère râpé', origin: 'animal:lait', grams: 180, per100g: { proteinG: 27 } },
    ]))
    expect(soupe).toMatchObject({ meat: true, vegetarian: false, mainProtein: 'laitiers' })
    const lentilles = classifyRecipe(recette([
      { name: 'Lentilles vertes', origin: 'vegetal', grams: 300, per100g: { proteinG: 24 }, role: 'base' },
      { name: 'Lardon fumé cru', origin: 'animal:viande', grams: 100, per100g: { proteinG: 15 }, role: 'protéine' },
    ]))
    expect(lentilles).toMatchObject({ meat: true, mainProtein: 'porc', redMeat: false })
    const truite = classifyRecipe(recette([{ name: 'Truite crue', origin: 'animal:poisson', grams: 300 }]))
    expect(truite).toMatchObject({ fish: true, fattyFish: false, mainProtein: 'poisson' })
  })

  it('juge le végétalien sur l’origine déclarée, pas sur les mots', () => {
    const ghee = recette([{ name: 'Ghee', origin: 'animal:lait', grams: 30 }, { name: 'Riz basmati cru', origin: 'vegetal', grams: 200 }])
    expect(violatesHardConstraints(ghee, { diets: ['vegan'] })).toBe('vegan_diet')
    const coco = recette([{ name: 'Lait de coco', origin: 'vegetal', grams: 400 }, { name: 'Riz basmati cru', origin: 'vegetal', grams: 200 }])
    expect(violatesHardConstraints(coco, { diets: ['vegan'] })).toBeNull()
    expect(violatesHardConstraints(coco, { diets: ['végétarien'] })).toBeNull()
    const boudin = recette([{ name: 'Boudin noir à cuire', origin: 'animal:viande', grams: 300 }])
    expect(violatesHardConstraints(boudin, { diets: ['végétarien'] })).toBe('vegetarian_diet')
  })

  it('refuse à un végétarien ce qui n’est ni viande ni poisson mais n’est pas déclaré compatible', () => {
    // Les deux portes du moteur (le solveur par violatesHardConstraints, la
    // couche personnalisée par recipeAllowed) doivent dire la même chose sur
    // la même assiette. Elles divergeaient exactement là où l'information
    // manque : `meat || fish` laissait passer 'inconnu' et 'animal:autre'.
    // Le chemin API sert des recettes de la base, dont toutes les formes ne
    // sont pas arbitrées : ce cas n'est pas théorique.
    const escargots = recette([
      { name: 'Escargot cru', origin: 'animal:autre', grams: 200 },
      { name: 'Beurre doux', origin: 'animal:lait', grams: 60 },
    ])
    expect(classifyRecipe(escargots)).toMatchObject({ meat: false, fish: false, vegetarian: false })
    expect(violatesHardConstraints(escargots, { diets: ['végétarien'] })).toBe('vegetarian_diet')

    const nonArbitree = recette([
      { name: 'Sauce yakisoba', grams: 40 },
      { name: 'Chou blanc frais', origin: 'vegetal', grams: 400 },
    ])
    expect(classifyRecipe(nonArbitree)).toMatchObject({ meat: false, fish: false, vegetarian: false, unknownOrigins: ['Sauce yakisoba'] })
    expect(violatesHardConstraints(nonArbitree, { diets: ['végétarien'] })).toBe('vegetarian_diet')
  })
})
