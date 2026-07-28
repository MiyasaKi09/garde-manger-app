/**
 * Source éditoriale canonique de l'Encyclopédie Myko.
 *
 * Ce fichier décrit la bibliothèque, pas les objets culinaires eux-mêmes.
 * Les ingrédients et recettes restent dans catalog.* et culinary.* ; les
 * volumes sont des vues éditoriales versionnées sur ces sources de vérité.
 */

export const edition = {
  code: 'MYKO-ENC-1',
  contract_version: 'myko-encyclopedia-v1',
  version: 1,
  title: 'MYKO — Encyclopédie culinaire',
  subtitle: 'Bibliothèque documentaire du réseau cuisine, stock, nutrition et planning',
  locale: 'fr-FR',
  released_on: '2026-07-28',
  status: 'authoring',
  integration_policy: 'blocked_until_all_volumes_validated',
  doctrine: [
    'Un concept culinaire possède une seule identité canonique.',
    'Un volume organise la connaissance sans dupliquer les objets canoniques.',
    'Toute donnée factuelle est sourcée, versionnée et associée à un niveau de confiance.',
    'Une recette publiée est immuable ; une correction crée une nouvelle version.',
    'L’IA assemble et explique uniquement à partir du corpus validé.',
    'Chaque ajout doit améliorer au moins la planification, la nutrition, le stock, les courses, les substitutions ou le batch cooking.',
    'Une entrée inventoriée ou rédigée ne compte jamais comme validée.',
    'Les ingrédients, recettes et interactions ne sont intégrés au produit qu’après validation de tous les volumes dont ils dépendent.',
  ],
  architecture: [
    'Produits commerciaux',
    'Ingrédients canoniques',
    'Techniques et préparations',
    'Sauces et accompagnements',
    'Recettes et assiettes',
    'Menus',
    'Planning',
  ],
  global_targets: {
    food_concepts_minimum: 3000,
    food_concepts_ambition: 4500,
    techniques: 250,
    preparations: 250,
    sauces: 300,
    accompaniments: 300,
    recipes: 2000,
    desserts: 350,
    breakfasts: 120,
    snacks: 120,
    beverages: 150,
  },
}

export const requiredFieldsByKind = {
  doctrine: ['objectif', 'règle', 'justification', 'exemples', 'exceptions', 'tests'],
  reference: ['code_stable', 'nom_canonique', 'définition', 'provenance', 'confiance', 'statut'],
  catalog: ['code_stable', 'nom_canonique', 'taxonomie', 'provenance', 'confiance', 'statut'],
  technique: ['code_stable', 'matériel', 'difficulté', 'temps', 'paramètres', 'impacts_nutritionnels', 'compatibilités', 'sécurité'],
  recipe: [
    'code_stable',
    'famille',
    'origine',
    'rôle_repas',
    'ingrédients_canoniques',
    'étapes',
    'nutrition',
    'profil_sensoriel',
    'batch',
    'congélation',
    'réchauffage',
    'accompagnements',
    'variantes',
    'substitutions',
    'score_planning',
  ],
  operations: ['entrées', 'sorties', 'règles', 'invariants', 'modes_dégradés', 'observabilité', 'tests'],
  quality: ['contrôle', 'sévérité', 'preuve', 'seuil', 'action_corrective', 'test_non_régression'],
}

export const qualityGatesByKind = {
  doctrine: ['version explicite', 'règles non contradictoires', 'exemples et contre-exemples', 'validation humaine'],
  reference: ['identité unique', 'provenance complète', 'confiance ≥ B avant publication', 'historique conservé'],
  catalog: ['aucun doublon normalisé', 'code stable', 'couverture mesurée', 'publication atomique'],
  technique: ['paramètres mesurables', 'risques sanitaires documentés', 'effets nutritionnels explicités', 'compatibilités testées'],
  recipe: ['formes exactes', 'unités convertibles', 'macros déterministes', 'étapes cohérentes', 'identité culinaire préservée'],
  operations: ['déterminisme', 'idempotence', 'traçabilité', 'mode dégradé explicite', 'non-régression'],
  quality: ['preuve reproductible', 'seuil machine-readable', 'responsable identifié', 'blocage de publication si critique'],
}

const book = (suffix, title, mission, options = {}) => ({
  suffix,
  title,
  mission,
  kind: options.kind || 'reference',
  source_contracts: options.source_contracts || [],
  target_entries: options.target_entries ?? null,
  content_status: options.content_status || 'structure',
  required_fields: options.required_fields || requiredFieldsByKind[options.kind || 'reference'],
  quality_gates: options.quality_gates || qualityGatesByKind[options.kind || 'reference'],
  outputs: options.outputs || [],
})

const volume = (number, title, mission, options, books) => {
  const code = `V${String(number).padStart(2, '0')}`
  return {
    number,
    code,
    slug: options.slug,
    title,
    mission,
    phase: number <= 10 ? 'fondations' : number <= 40 ? 'rédaction' : 'moteur',
    dependencies: options.dependencies || [],
    source_contracts: options.source_contracts || [],
    target_metric: options.target_metric || null,
    books: books.map((entry, index) => ({
      ...entry,
      code: `${code}-${entry.suffix}`,
      slug: entry.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      position: index + 1,
      source_contracts: entry.source_contracts.length
        ? entry.source_contracts
        : options.source_contracts || [],
    })),
  }
}

const recipeLensVolume = (number, title, mission, target, lens) => volume(
  number,
  title,
  mission,
  {
    slug: title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    dependencies: ['V01', 'V02', 'V03', 'V04', 'V05', 'V10'],
    source_contracts: ['culinary.recipe_families', 'culinary.recipe_versions', 'culinary.recipe_ingredient_requirements', 'culinary.recipe_steps'],
    target_metric: { key: `recipe_memberships.${String(number).padStart(2, '0')}`, target, unit: 'recettes référencées', mode: 'editorial_lens' },
  },
  [
    book('A', `Catalogue ${lens}`, 'Lister les identités canoniques couvertes par ce lot sans rédiger de doublon.', { kind: 'catalog' }),
    book('B', 'Recettes de référence', 'Rédiger et versionner les recettes canoniques avec leurs formes exactes.', { kind: 'recipe' }),
    book('C', 'Variantes et sous-recettes', 'Documenter uniquement les variantes culinaires valides et les préparations réutilisables.', { kind: 'recipe' }),
    book('D', 'Compatibilités et saisonnalité', 'Relier sauces, accompagnements, saisons, textures et occasions de service.', { kind: 'reference' }),
    book('E', 'Nutrition, batch, stock et QA', 'Mesurer l’aptitude au planning, à la conservation, au réchauffage et au contrôle qualité.', { kind: 'quality' }),
  ],
)

export const volumes = [
  volume(0, 'Vision du projet', 'Fixer la doctrine unique qui gouverne toutes les données et tous les usages Myko.', {
    slug: 'vision-du-projet',
    source_contracts: ['Myko-Corpus-Bible-v1', 'MYKO-Encyclopedie-Culinaire-Plan-Directeur'],
    target_metric: { key: 'documents', target: 6, unit: 'livres fondateurs', mode: 'document' },
  }, [
    book('A', 'Philosophie', 'Définir pourquoi Myko raisonne sur des objets culinaires validés plutôt que sur du texte généré.', { kind: 'doctrine' }),
    book('B', 'Architecture globale', 'Décrire les dépendances des produits commerciaux jusqu’au planning.', { kind: 'doctrine' }),
    book('C', 'Principes de qualité', 'Établir les niveaux de preuve, de confiance et les conditions de publication.', { kind: 'quality' }),
    book('D', 'Règles de normalisation', 'Fixer identifiants, noms, unités, états, synonymes et déduplication.', { kind: 'doctrine' }),
    book('E', 'Cycle de vie des données', 'Décrire import, validation, publication, correction, retrait et historique.', { kind: 'operations' }),
    book('F', 'Roadmap', 'Ordonner les lots par dépendances et par gain réel pour le produit.', { kind: 'operations' }),
  ]),

  volume(1, 'Bible des ingrédients', 'Fournir l’identité et les propriétés de chaque ingrédient manipulé par Myko.', {
    slug: 'bible-des-ingredients',
    dependencies: ['V00'],
    source_contracts: ['catalog.food_categories', 'catalog.food_concepts', 'catalog.food_forms', 'catalog.food_nutrition_profiles'],
    target_metric: { key: 'food_concepts', minimum: 3000, target: 4500, unit: 'ingrédients canoniques', mode: 'canonical' },
  }, [
    book('A', 'Philosophie des ingrédients', 'Définir la frontière entre concept, variété, forme culinaire et produit commercial.', { kind: 'doctrine' }),
    book('B', 'Taxonomie complète', 'Classer fruits, légumes, céréales, légumineuses, viandes, poissons, laitages, matières grasses, aromates, épices, condiments, champignons, boissons et produits transformés.', { kind: 'catalog', target_entries: 4500 }),
    book('C', 'Conventions de nommage', 'Garantir un nom canonique non ambigu et stable dans le temps.', { kind: 'doctrine' }),
    book('D', 'Synonymes', 'Relier langues, usages régionaux, marques et fautes courantes au concept unique.', { kind: 'reference' }),
    book('E', 'Variétés et cultivars', 'Distinguer les variétés lorsque leurs usages, saisons ou données diffèrent réellement.', { kind: 'reference' }),
    book('F', 'Formes culinaires', 'Décrire états physiques, cuisson, conservation, découpe, peau, os et préparation.', { kind: 'catalog' }),
    book('G', 'Unités', 'Définir les unités autorisées et leur contexte d’usage.', { kind: 'reference' }),
    book('H', 'Densités et conversions', 'Rendre déterministes les conversions masse, volume et unité.', { kind: 'reference' }),
    book('I', 'Conservation', 'Documenter température, emballage, état ouvert et durées fiables.', { kind: 'reference' }),
    book('J', 'Saisonnalité', 'Décrire disponibilité, origine et qualité par mois et région.', { kind: 'reference' }),
    book('K', 'Nutrition', 'Relier chaque forme à un profil nutritionnel sourcé et versionné.', { kind: 'reference' }),
    book('L', 'Allergènes', 'Maintenir allergènes réglementaires, traces et dérivés.', { kind: 'reference' }),
    book('M', 'Compatibilités', 'Décrire rôles culinaires, associations et incompatibilités.', { kind: 'reference' }),
    book('N', 'Substitutions', 'Autoriser seulement les remplacements validés avec facteurs et impacts.', { kind: 'reference' }),
    book('O', 'Profils sensoriels', 'Décrire saveurs, arômes, textures, intensité et richesse.', { kind: 'reference' }),
    book('P', 'Open Food Facts et produits', 'Relier les codes-barres et produits commerciaux à leurs formes canoniques.', { kind: 'catalog' }),
    book('Q', 'Historique', 'Tracer les fusions, scissions, corrections et changements de confiance.', { kind: 'quality' }),
  ]),

  volume(2, 'Bible des techniques', 'Canonicaliser les gestes qui transforment les ingrédients et structurent les recettes.', {
    slug: 'bible-des-techniques',
    dependencies: ['V01'],
    source_contracts: ['culinary.recipe_versions.techniques', 'culinary.recipe_steps'],
    target_metric: { key: 'techniques', target: 250, unit: 'techniques canoniques', mode: 'extracted' },
  }, [
    book('A', 'Découpes et tailles', 'Décrire les géométries, rendements, matériels et risques de découpe.', { kind: 'technique' }),
    book('B', 'Préparations mécaniques', 'Couvrir mélanges, pétrissages, fouettages, broyage, tamisage et mise en forme.', { kind: 'technique' }),
    book('C', 'Cuissons sèches', 'Couvrir saisie, poêle, four, rôtissage, grillade et friture.', { kind: 'technique' }),
    book('D', 'Cuissons humides', 'Couvrir pochage, vapeur, frémissement, ébullition et bain-marie.', { kind: 'technique' }),
    book('E', 'Cuissons mixtes', 'Couvrir braisage, mijotage, étuvage, déglaçage et réduction.', { kind: 'technique' }),
    book('F', 'Pâtisserie et boulangerie', 'Couvrir pâtes, levées, feuilletages, appareils et cuissons dédiées.', { kind: 'technique' }),
    book('G', 'Sauces, liaisons et émulsions', 'Couvrir roux, réduction, liaison, montage et émulsion.', { kind: 'technique' }),
    book('H', 'Conservation et transformation', 'Couvrir refroidissement, congélation, séchage, fumage et mise en conserve.', { kind: 'technique' }),
    book('I', 'Fermentation et sous-vide', 'Décrire les procédés pilotés par temps, température, pression et microbiologie.', { kind: 'technique' }),
    book('J', 'Dressage et contrôle', 'Décrire finition, repos, contrôle de cuisson et critères de service.', { kind: 'technique' }),
  ]),

  volume(3, 'Préparations intermédiaires', 'Transformer les bases réutilisables en objets versionnés et composables.', {
    slug: 'preparations-intermediaires',
    dependencies: ['V01', 'V02'],
    source_contracts: ['culinary.recipe_components', 'culinary.recipe_versions'],
    target_metric: { key: 'preparations', target: 250, unit: 'préparations', mode: 'canonical' },
  }, [
    book('A', 'Fonds et fumets', 'Canonicaliser les liquides d’extraction et leurs réductions.', { kind: 'recipe' }),
    book('B', 'Bouillons', 'Documenter bouillons de viande, poisson, légumes et variantes fonctionnelles.', { kind: 'recipe' }),
    book('C', 'Pâtes de base', 'Couvrir pâtes brisée, sablée, feuilletée, à pizza, à choux et apparentées.', { kind: 'recipe' }),
    book('D', 'Appareils', 'Couvrir appareils salés, sucrés, farces et mélanges structurants.', { kind: 'recipe' }),
    book('E', 'Crèmes et bases pâtissières', 'Couvrir crèmes, curds, caramels et inserts réutilisables.', { kind: 'recipe' }),
    book('F', 'Marinades et saumures', 'Documenter composition, durée, sécurité et impact sensoriel.', { kind: 'recipe' }),
    book('G', 'Pâtes levées', 'Couvrir fermentation, pointage, façonnage et cuisson.', { kind: 'recipe' }),
    book('H', 'Rendements et réemploi', 'Décrire quantité produite, pertes, conservation et recettes consommatrices.', { kind: 'quality' }),
  ]),

  volume(4, 'Sauces', 'Fournir des sauces canoniques compatibles avec la composition d’assiettes.', {
    slug: 'sauces',
    dependencies: ['V01', 'V02', 'V03'],
    source_contracts: ['culinary.recipe_families', 'culinary.recipe_versions'],
    target_metric: { key: 'sauces', target: 300, unit: 'sauces', mode: 'recipe_role' },
  }, [
    book('A', 'Sauces françaises', 'Documenter sauces mères, dérivées et sauces de la cuisine française.', { kind: 'recipe' }),
    book('B', 'Sauces italiennes', 'Documenter sauces tomate, pesto, fonds et émulsions italiennes.', { kind: 'recipe' }),
    book('C', 'Sauces d’Asie', 'Documenter sauces fermentées, pimentées, aigres-douces et bouillons concentrés.', { kind: 'recipe' }),
    book('D', 'Sauces du Mexique et d’Amérique latine', 'Documenter salsas, moles et sauces aux piments.', { kind: 'recipe' }),
    book('E', 'Sauces indiennes et sud-asiatiques', 'Documenter masalas, chutneys et bases de curry.', { kind: 'recipe' }),
    book('F', 'Sauces froides', 'Couvrir vinaigrettes, mayonnaises, yaourts et sauces non chauffées.', { kind: 'recipe' }),
    book('G', 'Sauces chaudes', 'Couvrir sauces minute, mijotées et nappantes.', { kind: 'recipe' }),
    book('H', 'Émulsions', 'Documenter émulsions stables et instables, température et rattrapage.', { kind: 'technique' }),
    book('I', 'Réductions, jus et glaçages', 'Documenter concentration, texture, salinité et rendement.', { kind: 'recipe' }),
    book('J', 'Compatibilités et service', 'Relier chaque sauce aux ingrédients, plats, saisons et régimes compatibles.', { kind: 'reference' }),
  ]),

  volume(5, 'Accompagnements', 'Permettre au planning de composer une assiette plutôt que de choisir une recette isolée.', {
    slug: 'accompagnements',
    dependencies: ['V01', 'V02', 'V03', 'V04'],
    source_contracts: ['culinary.recipe_families', 'culinary.recipe_versions'],
    target_metric: { key: 'accompaniments', target: 300, unit: 'accompagnements', mode: 'recipe_role' },
  }, [
    book('A', 'Pommes de terre', 'Couvrir vapeur, purées, rôties, sautées, frites et gratins.', { kind: 'recipe' }),
    book('B', 'Riz', 'Couvrir cuissons absorbées, pilafs, vapeur et riz assaisonnés.', { kind: 'recipe' }),
    book('C', 'Pâtes et nouilles', 'Couvrir formats simples destinés à accompagner un plat.', { kind: 'recipe' }),
    book('D', 'Polenta, semoules et céréales', 'Couvrir textures, hydratation et maintien au chaud.', { kind: 'recipe' }),
    book('E', 'Légumes', 'Couvrir légumes rôtis, vapeur, sautés, braisés et glacés.', { kind: 'recipe' }),
    book('F', 'Purées', 'Documenter purées simples, composées et textures adaptées.', { kind: 'recipe' }),
    book('G', 'Gratins', 'Documenter liaison, croûte, cuisson et réchauffage.', { kind: 'recipe' }),
    book('H', 'Salades', 'Couvrir salades d’accompagnement, assaisonnement et tenue.', { kind: 'recipe' }),
    book('I', 'Légumineuses', 'Couvrir cuisson, digestibilité, assaisonnement et batch.', { kind: 'recipe' }),
    book('J', 'Matrice de compatibilité', 'Relier accompagnements, sauces et plats avec contraintes nutritionnelles.', { kind: 'reference' }),
  ]),

  volume(6, 'Desserts', 'Structurer un corpus de desserts fiables, portionnables et planifiables.', {
    slug: 'desserts',
    dependencies: ['V01', 'V02', 'V03'],
    source_contracts: ['culinary.recipe_families', 'culinary.recipe_versions'],
    target_metric: { key: 'desserts', target: 350, unit: 'desserts', mode: 'recipe_role' },
  }, [
    book('A', 'Tartes', 'Couvrir fonds, garnitures, cuisson et conservation.', { kind: 'recipe' }),
    book('B', 'Gâteaux', 'Couvrir appareils, levée, cuisson et portionnage.', { kind: 'recipe' }),
    book('C', 'Crèmes et flans', 'Couvrir coagulation, texture et refroidissement.', { kind: 'recipe' }),
    book('D', 'Entremets', 'Couvrir assemblage, inserts, prise et finition.', { kind: 'recipe' }),
    book('E', 'Biscuits et petits gâteaux', 'Couvrir façonnage, cuisson et stockage.', { kind: 'recipe' }),
    book('F', 'Glaces et desserts froids', 'Couvrir foisonnement, cristallisation et chaîne du froid.', { kind: 'recipe' }),
    book('G', 'Viennoiseries', 'Couvrir pâtes levées feuilletées, tourage et cuisson.', { kind: 'recipe' }),
    book('H', 'Desserts fruités', 'Couvrir saisonnalité, maturité et équilibre sucre-acidité.', { kind: 'recipe' }),
  ]),

  volume(7, 'Petit-déjeuners', 'Fournir des prises matinales simples, diversifiées et nutritionnellement composables.', {
    slug: 'petits-dejeuners',
    dependencies: ['V01', 'V03', 'V06'],
    source_contracts: ['culinary.recipe_families', 'planning support slots'],
    target_metric: { key: 'breakfasts', target: 120, unit: 'petits-déjeuners', mode: 'meal_role' },
  }, [
    book('A', 'Porridges', 'Couvrir céréales, liquides, textures et toppings.', { kind: 'recipe' }),
    book('B', 'Préparations de la veille', 'Couvrir overnight oats, chia et préparations réfrigérées.', { kind: 'recipe' }),
    book('C', 'Tartines et pains', 'Couvrir bases, garnitures et assemblages rapides.', { kind: 'recipe' }),
    book('D', 'Œufs et salé', 'Couvrir œufs, légumes, fromages et assiettes matinales.', { kind: 'recipe' }),
    book('E', 'Granolas et céréales', 'Couvrir cuisson, portionnage et stockage.', { kind: 'recipe' }),
    book('F', 'Pancakes, crêpes et gaufres', 'Couvrir pâtes, cuisson et variantes.', { kind: 'recipe' }),
    book('G', 'Assemblages nutritionnels', 'Définir des compositions ajustables par personne sans faux grammage.', { kind: 'operations' }),
  ]),

  volume(8, 'Collations', 'Proposer des collations réalistes, préparables et cohérentes avec les repas de la journée.', {
    slug: 'collations',
    dependencies: ['V01', 'V03', 'V06'],
    source_contracts: ['culinary.recipe_families', 'planning support slots'],
    target_metric: { key: 'snacks', target: 120, unit: 'collations', mode: 'meal_role' },
  }, [
    book('A', 'Fruits', 'Décrire portions usuelles, saison, maturité et associations.', { kind: 'reference' }),
    book('B', 'Yaourts et laitages', 'Décrire formats, garnitures et alternatives validées.', { kind: 'reference' }),
    book('C', 'Oléagineux et graines', 'Décrire portions, allergènes et profils nutritionnels.', { kind: 'reference' }),
    book('D', 'Préparations maison', 'Couvrir compotes, cakes, tartinades et portions préparables.', { kind: 'recipe' }),
    book('E', 'Barres et bouchées', 'Couvrir barres, energy balls et conservation.', { kind: 'recipe' }),
    book('F', 'Règles de cohérence', 'Interdire toute collation dépendant d’une préparation non planifiée.', { kind: 'operations' }),
  ]),

  volume(9, 'Boissons', 'Documenter boissons chaudes, froides et festives avec portions et contraintes explicites.', {
    slug: 'boissons',
    dependencies: ['V01', 'V02', 'V03'],
    source_contracts: ['culinary.recipe_families', 'catalog.food_forms'],
    target_metric: { key: 'beverages', target: 150, unit: 'boissons', mode: 'recipe_role' },
  }, [
    book('A', 'Boissons chaudes', 'Couvrir cafés, thés, chocolats et préparations lactées.', { kind: 'recipe' }),
    book('B', 'Boissons froides', 'Couvrir eaux aromatisées, thés glacés et boissons maison.', { kind: 'recipe' }),
    book('C', 'Smoothies', 'Couvrir équilibre, texture, densité et conservation courte.', { kind: 'recipe' }),
    book('D', 'Cocktails', 'Documenter doses, dilution, glace et alcool.', { kind: 'recipe' }),
    book('E', 'Mocktails', 'Documenter structure aromatique sans simple substitution de l’alcool.', { kind: 'recipe' }),
    book('F', 'Infusions', 'Couvrir plante, température, durée et précautions.', { kind: 'recipe' }),
  ]),

  volume(10, 'Catalogue maître des recettes', 'Valider les identités des recettes avant toute rédaction détaillée.', {
    slug: 'catalogue-maitre-des-recettes',
    dependencies: ['V01', 'V02', 'V03', 'V04', 'V05'],
    source_contracts: ['culinary.recipe_families', 'culinary.recipe_versions'],
    target_metric: { key: 'recipe_families', target: 2000, unit: 'familles de recettes', mode: 'canonical' },
  }, [
    book('A', 'Taxonomie des familles', 'Définir familles, sous-familles, rôles de repas et structures de plats.', { kind: 'catalog' }),
    book('B', 'Catalogue des identités', 'Lister nom, origine, rôle et critères d’identité sans dupliquer la rédaction.', { kind: 'catalog', target_entries: 2000 }),
    book('C', 'Matrice de complétude', 'Mesurer ingrédients exacts, étapes, nutrition, sensoriel, conservation et planning.', { kind: 'quality' }),
    book('D', 'Déduplication et arbitrage', 'Fusionner les doublons et consigner les décisions canoniques.', { kind: 'quality' }),
    book('E', 'Ordre de rédaction', 'Prioriser les lots selon couverture, utilité et dépendances.', { kind: 'operations' }),
  ]),

  recipeLensVolume(11, 'Salades et crudités', 'Rédiger salades, crudités et assiettes froides avec tenue et assaisonnement maîtrisés.', 90, 'des salades'),
  recipeLensVolume(12, 'Soupes, veloutés et bouillons-repas', 'Rédiger les préparations liquides de l’entrée au plat complet.', 90, 'des soupes'),
  recipeLensVolume(13, 'Bœuf, veau et agneau', 'Rédiger les viandes rouges selon morceau, cuisson et rendement.', 85, 'des viandes rouges'),
  recipeLensVolume(14, 'Porc et charcuteries cuisinées', 'Rédiger les recettes de porc avec sécurité, gras et salinité maîtrisés.', 75, 'du porc'),
  recipeLensVolume(15, 'Volaille et lapin', 'Rédiger volailles et lapin selon morceau, peau, os et température à cœur.', 95, 'des volailles'),
  recipeLensVolume(16, 'Poissons', 'Rédiger poissons entiers, filets et préparations en respectant cuisson et fragilité.', 90, 'des poissons'),
  recipeLensVolume(17, 'Fruits de mer et coquillages', 'Rédiger crustacés, coquillages et céphalopodes avec sécurité et saisonnalité.', 70, 'des fruits de mer'),
  recipeLensVolume(18, 'Cuisine italienne', 'Rédiger un corpus italien fidèle aux identités régionales et aux techniques.', 100, 'de la cuisine italienne'),
  recipeLensVolume(19, 'Cuisines ibériques', 'Rédiger cuisines espagnole, portugaise et basque sans les homogénéiser.', 75, 'des cuisines ibériques'),
  recipeLensVolume(20, 'Cuisines grecque et levantine', 'Rédiger les cuisines grecque, chypriote, turque et levantine avec leurs marqueurs.', 85, 'des cuisines grecque et levantine'),
  recipeLensVolume(21, 'Cuisines du Maghreb', 'Rédiger les cuisines marocaine, algérienne et tunisienne avec variantes régionales.', 80, 'des cuisines du Maghreb'),
  recipeLensVolume(22, 'Cuisines indienne et sud-asiatiques', 'Rédiger épices, currys, pains et riz selon les traditions régionales.', 105, 'des cuisines sud-asiatiques'),
  recipeLensVolume(23, 'Cuisines d’Asie de l’Est et du Sud-Est', 'Rédiger Chine, Japon, Corée et Asie du Sud-Est sans substitutions culturelles abusives.', 150, 'des cuisines d’Asie'),
  recipeLensVolume(24, 'Cuisines mexicaine et latino-américaines', 'Rédiger maïs, piments, haricots, marinades et cuisines régionales américaines.', 100, 'des cuisines latino-américaines'),
  recipeLensVolume(25, 'Cuisine végétarienne et légumineuses', 'Rédiger des plats végétariens complets fondés sur la cuisine plutôt que sur des remplacements artificiels.', 150, 'de la cuisine végétarienne'),
  recipeLensVolume(26, 'Sandwichs, tartines et wraps', 'Rédiger les assemblages portables avec structure, humidité et conservation maîtrisées.', 80, 'des sandwichs'),
  recipeLensVolume(27, 'Pizzas, quiches et tartes salées', 'Rédiger pâtes, garnitures, cuisson et réchauffage des tartes salées.', 90, 'des tartes salées'),
  recipeLensVolume(28, 'Pâtes, nouilles et raviolis', 'Rédiger formats, sauces, cuisson et assemblages autour des pâtes.', 120, 'des pâtes et nouilles'),
  recipeLensVolume(29, 'Riz, céréales et semoules', 'Rédiger absorption, pilaf, risotto, paella, couscous et bols céréaliers.', 110, 'du riz et des céréales'),
  recipeLensVolume(30, 'Desserts français', 'Rédiger le patrimoine pâtissier français avec techniques et températures précises.', 120, 'des desserts français'),
  recipeLensVolume(31, 'Desserts du monde', 'Rédiger les desserts internationaux en préservant ingrédients et gestes identitaires.', 130, 'des desserts du monde'),
  recipeLensVolume(32, 'Œufs et brunch salé', 'Rédiger œufs, omelettes, galettes et plats salés de petit-déjeuner.', 80, 'des œufs et brunchs'),
  recipeLensVolume(33, 'Mijotés, braisés et plats en sauce', 'Rédiger les cuissons longues, rendements, refroidissement et réchauffage.', 130, 'des plats mijotés'),
  recipeLensVolume(34, 'Grillades, rôtis et cuissons au four', 'Rédiger les cuissons sèches autour de la coloration et de la température à cœur.', 110, 'des grillades et rôtis'),
  recipeLensVolume(35, 'Plats complets du quotidien', 'Rédiger les repas réalistes, équilibrés et faisables en semaine.', 180, 'des plats du quotidien'),
  recipeLensVolume(36, 'Cuisine végétalienne', 'Rédiger des plats végétaliens autonomes, complets et culturellement cohérents.', 100, 'de la cuisine végétalienne'),
  recipeLensVolume(37, 'Fermentations et conserves maison', 'Rédiger les transformations microbiennes et conserves avec sécurité renforcée.', 60, 'des fermentations'),
  recipeLensVolume(38, 'Cuisine économique et anti-gaspillage', 'Rédiger les usages fiables des restes, surplus, parures et produits urgents.', 120, 'de la cuisine anti-gaspillage'),
  recipeLensVolume(39, 'Cuisine festive et invités', 'Rédiger des menus à forte qualité de service, anticipables et scalables.', 100, 'de la cuisine festive'),
  recipeLensVolume(40, 'Assemblages et assiettes canoniques', 'Relier plat, sauce, accompagnements, garnitures et portions en assiettes complètes.', 150, 'des assiettes'),

  volume(41, 'Menus', 'Assembler les objets culinaires en menus cohérents selon saison, occasion et contraintes.', {
    slug: 'menus',
    dependencies: ['V04', 'V05', 'V06', 'V07', 'V08', 'V09', 'V10'],
    source_contracts: ['culinary recipes', 'planning menus'],
    target_metric: { key: 'menus', target: 72, unit: 'menus canoniques', mode: 'operations' },
  }, [
    book('A', 'Menus saisonniers', 'Composer des menus à partir de produits réellement saisonniers.', { kind: 'operations' }),
    book('B', 'Menus invités', 'Composer service, quantités et anticipation pour recevoir.', { kind: 'operations' }),
    book('C', 'Menus batch cooking', 'Composer des productions réutilisées sans monotonie.', { kind: 'operations' }),
    book('D', 'Menus sportifs', 'Composer des menus autour d’objectifs nutritionnels individuels.', { kind: 'operations' }),
    book('E', 'Menus végétariens', 'Composer des semaines végétariennes complètes et variées.', { kind: 'operations' }),
    book('F', 'Menus économiques', 'Composer des menus sous contrainte de budget et de gaspillage.', { kind: 'operations' }),
    book('G', 'Contrat de menu', 'Définir structure, portions, dépendances et critères de validation.', { kind: 'doctrine' }),
  ]),

  volume(42, 'Planning', 'Transformer le corpus en semaines exécutables, expliquées et cohérentes dans le temps.', {
    slug: 'planning',
    dependencies: ['V10', 'V41', 'V43', 'V44', 'V45'],
    source_contracts: ['planning canonical plan', 'meal plan versions', 'planned demands'],
    target_metric: { key: 'planning_rules', target: 40, unit: 'règles de planification', mode: 'operations' },
  }, [
    book('A', 'Règles de génération', 'Définir entrées, candidats, contraintes dures et modes dégradés.', { kind: 'operations' }),
    book('B', 'Fonction de score', 'Documenter chaque terme de score, unité, poids et priorité.', { kind: 'operations' }),
    book('C', 'Diversité et rotation', 'Définir répétitions, familles, cuisines et historique multi-semaines.', { kind: 'operations' }),
    book('D', 'Batch et préparations', 'Planifier productions, dépendances, refroidissement et réemploi.', { kind: 'operations' }),
    book('E', 'Nutrition personnalisée', 'Ajuster l’assiette par personne sans dénaturer la recette.', { kind: 'operations' }),
    book('F', 'Explications et arbitrages', 'Expliquer les choix, compromis et alertes en langage utilisateur.', { kind: 'operations' }),
    book('G', 'Publication et suivi', 'Définir aperçu, validation, publication, consommation, feedback et régénération.', { kind: 'operations' }),
  ]),

  volume(43, 'Données nutritionnelles', 'Garantir des calculs nutritionnels déterministes, sourcés et personnalisables.', {
    slug: 'donnees-nutritionnelles',
    dependencies: ['V01', 'V10'],
    source_contracts: ['catalog.food_nutrition_profiles', 'catalog.food_nutrient_values', 'nutrition targets'],
    target_metric: { key: 'nutrient_dimensions', target: 60, unit: 'dimensions nutritionnelles', mode: 'reference' },
  }, [
    book('A', 'Macronutriments', 'Définir énergie, protéines, glucides, lipides, fibres et leurs calculs.', { kind: 'reference' }),
    book('B', 'Micronutriments', 'Définir vitamines, minéraux, unités et couverture.', { kind: 'reference' }),
    book('C', 'Objectifs individuels', 'Documenter calculs, ajustements, limites et validation des objectifs.', { kind: 'operations' }),
    book('D', 'Calculs et transformations', 'Documenter rendements, pertes de cuisson et changement de base.', { kind: 'operations' }),
    book('E', 'Scores et incertitude', 'Séparer valeur mesurée, calculée, estimée et indisponible.', { kind: 'quality' }),
  ]),

  volume(44, 'Stock', 'Maintenir une vérité physique simple pour les lots, dates, contenants et réservations.', {
    slug: 'stock',
    dependencies: ['V01', 'V03', 'V10'],
    source_contracts: ['inventory lots', 'cooked dishes', 'inventory reservations'],
    target_metric: { key: 'stock_rules', target: 25, unit: 'règles de stock', mode: 'operations' },
  }, [
    book('A', 'Lots et identités', 'Définir produit, forme canonique, quantité, unité et provenance.', { kind: 'operations' }),
    book('B', 'DLC, DDM et ouverture', 'Calculer la date effective selon achat, ouverture et préparation.', { kind: 'operations' }),
    book('C', 'Conversions et contenants', 'Gérer unités, tare, volume, portion et emplacement.', { kind: 'operations' }),
    book('D', 'Réservations et FEFO', 'Garantir qu’un même lot n’est jamais promis deux fois.', { kind: 'operations' }),
    book('E', 'Mouvements et audit', 'Tracer entrée, consommation, perte, correction et annulation.', { kind: 'quality' }),
  ]),

  volume(45, 'Courses', 'Transformer la demande finale en liste d’achat compréhensible et exécutable.', {
    slug: 'courses',
    dependencies: ['V01', 'V10', 'V42', 'V44'],
    source_contracts: ['planned demands', 'shopping items', 'commercial products'],
    target_metric: { key: 'shopping_rules', target: 25, unit: 'règles de courses', mode: 'operations' },
  }, [
    book('A', 'Construction intelligente', 'Partir des demandes exactes après couverture du stock.', { kind: 'operations' }),
    book('B', 'Fusion et unités', 'Fusionner seulement les demandes compatibles et afficher des quantités humaines.', { kind: 'operations' }),
    book('C', 'Substitutions', 'Proposer des remplacements validés avec impact explicite.', { kind: 'operations' }),
    book('D', 'Produits et budget', 'Relier quantité culinaire, conditionnement commercial, prix et préférence.', { kind: 'operations' }),
    book('E', 'Rangement au retour', 'Transformer les achats en lots bien rangés avec dates réalistes.', { kind: 'operations' }),
  ]),

  volume(46, 'IA culinaire', 'Encadrer l’IA comme moteur d’assemblage et d’explication, jamais comme source de vérité.', {
    slug: 'ia-culinaire',
    dependencies: ['V00', 'V10', 'V42', 'V47'],
    source_contracts: ['published Myko corpus', 'decision traces', 'user feedback'],
    target_metric: { key: 'ai_rules', target: 30, unit: 'règles IA', mode: 'operations' },
  }, [
    book('A', 'Périmètre de décision', 'Définir ce que l’IA peut choisir et ce qu’elle ne peut jamais inventer.', { kind: 'doctrine' }),
    book('B', 'Contraintes et garde-fous', 'Formaliser corpus autorisé, données interdites et sorties validables.', { kind: 'operations' }),
    book('C', 'Explications', 'Exiger une justification reliée aux objets et règles réellement utilisés.', { kind: 'operations' }),
    book('D', 'Apprentissage et feedback', 'Transformer les retours utilisateurs en préférences explicites et réversibles.', { kind: 'operations' }),
    book('E', 'Évaluation', 'Mesurer factualité, adhérence, sécurité, coût et non-régression.', { kind: 'quality' }),
  ]),

  volume(47, 'Assurance qualité', 'Empêcher qu’un objet incomplet ou incohérent pilote Myko.', {
    slug: 'assurance-qualite',
    dependencies: ['V00', 'V01', 'V02', 'V10', 'V42', 'V43', 'V44', 'V45', 'V46'],
    source_contracts: ['quality.review_tasks', 'CI tests', 'catalog releases'],
    target_metric: { key: 'qa_checks', target: 100, unit: 'contrôles automatiques', mode: 'quality' },
  }, [
    book('A', 'Contrôles automatiques', 'Définir schémas, contraintes, intégrité référentielle et contrôles métier.', { kind: 'quality' }),
    book('B', 'Validation humaine', 'Définir tâches de revue, preuves et responsabilité de publication.', { kind: 'quality' }),
    book('C', 'Fixtures et jeux d’or', 'Maintenir des cas représentatifs et reproductibles.', { kind: 'quality' }),
    book('D', 'Non-régression', 'Couvrir calculs, sécurité, parcours utilisateur et production.', { kind: 'quality' }),
    book('E', 'Santé du corpus', 'Suivre couverture, confiance, anomalies, dérive et dette documentaire.', { kind: 'quality' }),
  ]),
]
