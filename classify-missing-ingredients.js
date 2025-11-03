// Classifier les ingrédients manquants selon canonical -> cultivar -> archetype
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeForComparison(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Classification hiérarchique des ingrédients
// Format: { canonical_parent, type, process, unit, variants }
const classification = {
  // === ARCHETYPES DE VIANDES ===
  'bœuf haché': {
    canonical_parent: 'bœuf',
    type: 'archetype',
    process: 'haché',
    unit: 'g',
    variants: ['boeuf haché', 'viande hachée', 'viande boeuf', 'boeuf fines', 'steaks hachés']
  },
  'bœuf à braiser': {
    canonical_parent: 'bœuf',
    type: 'archetype',
    process: 'en morceaux',
    unit: 'g',
    variants: ['boeuf à braiser', 'boeuf à mijoter', 'boeuf (gîte, paleron)', 'paleron de boeuf']
  },
  'entrecôte de bœuf': {
    canonical_parent: 'bœuf',
    type: 'archetype',
    process: 'entrecôte',
    unit: 'g',
    variants: ['entrecôte', 'entrecôte de boeuf', 'côte boeuf']
  },
  'steak de bœuf': {
    canonical_parent: 'bœuf',
    type: 'archetype',
    process: 'steak',
    unit: 'pièce',
    variants: ['steaks de boeuf 180g', 'steaks', 'tournedos', 'pavé boeuf', 'faux-filet', 'rumsteck', 'bavette', 'bavette ou rumsteck de boeuf']
  },

  'veau haché': {
    canonical_parent: 'veau',
    type: 'archetype',
    process: 'haché',
    unit: 'g',
    variants: ['veau haché']
  },
  'veau à braiser': {
    canonical_parent: 'veau',
    type: 'archetype',
    process: 'en morceaux',
    unit: 'g',
    variants: ['veau pour blanquette', 'sauté de veau', 'filet veau', 'rôti veau', 'rôti de veau sous-noix']
  },
  'escalope de veau': {
    canonical_parent: 'veau',
    type: 'archetype',
    process: 'escalope',
    unit: 'pièce',
    variants: ['escalopes de veau', 'escalopes veau', 'escalopes de veau (70 g)', 'grenadins veau', 'paupiettes de veau']
  },

  'agneau haché': {
    canonical_parent: 'agneau',
    type: 'archetype',
    process: 'haché',
    unit: 'g',
    variants: ['viande d\'agneau hachée']
  },
  'agneau en morceaux': {
    canonical_parent: 'agneau',
    type: 'archetype',
    process: 'en morceaux',
    unit: 'g',
    variants: ['viande d\'agneau', 'épaule agneau', 'épaule d\'agneau', 'gigot agneau', 'gigot d\'agneau', 'filet agneau']
  },

  // === CHARCUTERIE (Archetypes de porc principalement) ===
  'lardons': {
    canonical_parent: 'porc',
    type: 'archetype',
    process: 'lardons',
    unit: 'g',
    variants: ['lardons', 'lardons fumés', 'lard', 'poitrine fumée']
  },
  'bacon': {
    canonical_parent: 'porc',
    type: 'archetype',
    process: 'bacon',
    unit: 'tranche',
    variants: ['bacon', 'tranches de bacon']
  },
  'jambon cuit': {
    canonical_parent: 'porc',
    type: 'archetype',
    process: 'jambon cuit',
    unit: 'g',
    variants: ['jambon cuit', 'jambon blanc', 'jambon à l\'os']
  },
  'jambon cru': {
    canonical_parent: 'porc',
    type: 'archetype',
    process: 'jambon cru',
    unit: 'g',
    variants: ['jambon cru', 'jambon serrano', 'jambon ibérique', 'guanciale']
  },
  'saucisse': {
    canonical_parent: 'porc',
    type: 'archetype',
    process: 'saucisse',
    unit: 'pièce',
    variants: ['saucisses de Toulouse', 'saucisses fumées', 'saucisses de Strasbourg', 'diots', 'andouillettes de Troyes']
  },
  'chair à saucisse': {
    canonical_parent: 'porc',
    type: 'archetype',
    process: 'chair à saucisse',
    unit: 'g',
    variants: ['chair à saucisse', 'chair saucisse']
  },
  'boudin noir': {
    canonical_parent: 'porc',
    type: 'archetype',
    process: 'boudin',
    unit: 'pièce',
    variants: ['boudins noirs']
  },

  // === POISSONS TRANSFORMÉS ===
  'saumon fumé': {
    canonical_parent: 'saumon',
    type: 'archetype',
    process: 'fumé',
    unit: 'g',
    variants: ['saumon fumé']
  },
  'morue dessalée': {
    canonical_parent: 'morue',
    type: 'archetype',
    process: 'dessalée',
    unit: 'g',
    variants: ['morue dessalée']
  },

  // === PRODUITS LAITIERS ===
  'fromage râpé': {
    canonical_parent: 'fromage',
    type: 'archetype',
    process: 'râpé',
    unit: 'g',
    variants: ['fromage râpé', 'gruyère râpé', 'comté râpé', 'parmesan râpé']
  },
  'fromage frais': {
    canonical_parent: 'fromage',
    type: 'archetype',
    process: 'frais',
    unit: 'g',
    variants: ['fromage frais', 'St Môret', 'chèvre frais', 'fromage Minas', 'tomme fraîche', 'tomme fraîche Cantal']
  },
  'crème fraîche': {
    canonical_parent: 'crème',
    type: 'canonical', // La crème est déjà un canonical
    unit: 'ml',
    variants: ['crème', 'crème fraîche', 'crème fouettée', 'crème liquide']
  },
  'beurre': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'g',
    variants: ['beurre', 'beurre mou', 'beurre fondu', 'beurre froid', 'beurre clarifié', 'beurre manié', 'saindoux']
  },

  // === PÂTES ET FÉCULENTS (Canonicals principalement) ===
  'pâtes': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'g',
    variants: ['pâtes', 'pâtes courtes']
  },
  'linguine': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'g',
    variants: ['linguine', 'trofie ou linguine']
  },
  'tagliatelles': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'g',
    variants: ['tagliatelles']
  },
  'gnocchi': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'g',
    variants: ['gnocchis', 'gnocchi']
  },
  'polenta': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'g',
    variants: ['polenta']
  },

  // === BOUILLONS ET FONDS (Archetypes complexes - préparations culinaires) ===
  'bouillon de bœuf': {
    canonical_parent: 'bœuf',
    type: 'archetype',
    process: 'bouillon',
    unit: 'ml',
    variants: ['bouillon de boeuf']
  },
  'bouillon de volaille': {
    canonical_parent: 'poulet',
    type: 'archetype',
    process: 'bouillon',
    unit: 'ml',
    variants: ['bouillon de volaille', 'bouillon poulet']
  },
  'fumet de poisson': {
    canonical_parent: 'poisson',
    type: 'archetype',
    process: 'fumet',
    unit: 'ml',
    variants: ['fumet de poisson', 'fumet poisson', 'fumet']
  },

  // === PAINS (Canonicals) ===
  'pain de campagne': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'g',
    variants: ['pain de campagne', 'baguette', 'brioche']
  },
  'pain de mie': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'tranche',
    variants: ['pain de mie']
  },

  // === ALCOOLS (Canonicals) ===
  'vin blanc': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'ml',
    variants: ['vin blanc sec', 'vin blanc Anjou']
  },
  'vin rouge': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'ml',
    variants: ['vin rouge de Bourgogne', 'vin rouge', 'rouge']
  },

  // === LÉGUMES TRANSFORMÉS ===
  'patate douce': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'g',
    variants: ['patates douces']
  },

  // === PRODUITS VÉGÉTARIENS (Canonicals) ===
  'tofu': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'g',
    variants: ['tofu', 'tofu ferme', 'tofu soyeux', 'tofu frit']
  },
  'tempeh': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'g',
    variants: ['tempeh']
  },
  'seitan': {
    canonical_parent: null,
    type: 'canonical',
    unit: 'g',
    variants: ['seitan', 'seitan haché']
  },
};

async function classifyIngredients() {
  console.log('=== CLASSIFICATION DES INGRÉDIENTS MANQUANTS ===\n');

  // Lire la liste
  const content = fs.readFileSync('INGREDIENTS_NON_TROUVES.txt', 'utf-8');
  const missingIngredients = content.split('\n').filter(line => line.trim());

  console.log(`📊 ${missingIngredients.length} ingrédients à classifier\n`);

  // Charger les canonical_foods existants
  const { data: existingCanonical } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name, primary_unit');

  const existingCanonicalMap = new Map();
  existingCanonical.forEach(c => {
    existingCanonicalMap.set(normalizeForComparison(c.canonical_name), c);
  });

  // Préparer les résultats
  const toCreateCanonical = [];
  const toCreateArchetypes = [];
  const mapping = {};
  const unclassified = [];

  // Classifier chaque ingrédient
  for (const ingredient of missingIngredients) {
    let found = false;

    // Chercher dans la classification prédéfinie
    for (const [canonicalName, config] of Object.entries(classification)) {
      if (config.variants && config.variants.includes(ingredient)) {
        mapping[ingredient] = canonicalName;

        if (config.type === 'canonical') {
          // Vérifier si le canonical existe déjà
          if (!existingCanonicalMap.has(normalizeForComparison(canonicalName))) {
            toCreateCanonical.push({
              canonical_name: canonicalName,
              primary_unit: config.unit,
              category_id: null // À définir manuellement
            });
          }
        } else if (config.type === 'archetype') {
          // Trouver l'ID du canonical parent
          const parentCanonical = existingCanonicalMap.get(normalizeForComparison(config.canonical_parent));

          if (parentCanonical) {
            toCreateArchetypes.push({
              name: canonicalName,
              canonical_food_id: parentCanonical.id,
              process: config.process,
              primary_unit: config.unit
            });
          } else {
            console.log(`⚠️  Parent canonical "${config.canonical_parent}" non trouvé pour "${canonicalName}"`);
          }
        }

        found = true;
        break;
      }
    }

    if (!found) {
      unclassified.push(ingredient);
    }
  }

  // Résumé
  console.log('=== RÉSUMÉ DE LA CLASSIFICATION ===\n');
  console.log(`✅ ${Object.keys(mapping).length} ingrédients classifiés`);
  console.log(`📦 ${toCreateCanonical.length} nouveaux canonical_foods à créer`);
  console.log(`🔧 ${toCreateArchetypes.length} nouveaux archetypes à créer`);
  console.log(`❓ ${unclassified.length} ingrédients non classifiés\n`);

  // Détails
  if (toCreateCanonical.length > 0) {
    console.log('=== CANONICAL_FOODS À CRÉER ===');
    toCreateCanonical.forEach(c => console.log(`  - ${c.canonical_name} (${c.primary_unit})`));
    console.log('');
  }

  if (toCreateArchetypes.length > 0) {
    console.log('=== ARCHETYPES À CRÉER ===');
    toCreateArchetypes.slice(0, 20).forEach(a => console.log(`  - ${a.name} (process: ${a.process}, parent: ${a.canonical_food_id})`));
    if (toCreateArchetypes.length > 20) {
      console.log(`  ... et ${toCreateArchetypes.length - 20} autres`);
    }
    console.log('');
  }

  if (unclassified.length > 0) {
    console.log('=== NON CLASSIFIÉS (à traiter manuellement) ===');
    unclassified.slice(0, 50).forEach(name => console.log(`  - ${name}`));
    if (unclassified.length > 50) {
      console.log(`  ... et ${unclassified.length - 50} autres`);
    }
    console.log('');
  }

  // Sauvegarder
  fs.writeFileSync('CANONICAL_TO_CREATE.json', JSON.stringify(toCreateCanonical, null, 2));
  fs.writeFileSync('ARCHETYPES_TO_CREATE.json', JSON.stringify(toCreateArchetypes, null, 2));
  fs.writeFileSync('UNCLASSIFIED_INGREDIENTS.json', JSON.stringify(unclassified, null, 2));
  fs.writeFileSync('INGREDIENTS_MAPPING.json', JSON.stringify(mapping, null, 2));

  console.log('✅ Fichiers sauvegardés:');
  console.log('   - CANONICAL_TO_CREATE.json');
  console.log('   - ARCHETYPES_TO_CREATE.json');
  console.log('   - UNCLASSIFIED_INGREDIENTS.json');
  console.log('   - INGREDIENTS_MAPPING.json');
}

classifyIngredients().catch(console.error);
