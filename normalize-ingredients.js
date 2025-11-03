// Normaliser et regrouper les ingrédients manquants
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
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Catégories d'ingrédients
const categories = {
  'viandes': ['boeuf', 'veau', 'poulet', 'porc', 'agneau', 'canard', 'dinde', 'gibier', 'viande', 'chair', 'bacon', 'lardons', 'jambon', 'saucisse', 'boudin'],
  'poissons': ['poisson', 'saumon', 'thon', 'morue', 'cabillaud', 'lotte', 'sole', 'merlan', 'maquereau', 'anguille'],
  'fruits_mer': ['crevette', 'calamar', 'encornet', 'seiche', 'palourde', 'homard', 'langoustine', 'ecrevisse', 'escargot', 'grenouille'],
  'legumes': ['poireau', 'courgette', 'blette', 'plantain', 'yuca', 'patate'],
  'pates': ['pate', 'linguine', 'tagliatelle', 'penne', 'macaroni', 'gnocchi', 'ravioli', 'cannelloni', 'lasagne', 'nouille', 'vermicelle', 'fideos', 'soba', 'udon'],
  'produits_laitiers': ['fromage', 'creme', 'beurre', 'lait', 'yaourt', 'ricotta', 'mozzarella', 'parmesan', 'comte', 'gruyere', 'chevre', 'feta', 'paneer'],
  'bouillons_sauces': ['bouillon', 'fond', 'fumet', 'sauce', 'pesto', 'mayonnaise', 'aioli', 'tzatziki', 'ketchup'],
  'cereales': ['farine', 'pain', 'riz', 'polenta', 'boulghour', 'semoule', 'crozets'],
  'alcools': ['vin', 'biere', 'cidre', 'calvados', 'cognac', 'rhum', 'porto', 'madere', 'marsala', 'grand marnier', 'amaretto', 'kirsch', 'sake', 'mirin'],
  'epices': ['curry', 'paprika', 'cumin', 'garam masala', 'cinq epices', 'berbere', 'zaatar', 'fenugrec', 'cayenne', 'sumac'],
  'condiments': ['moutarde', 'vinaigre', 'sauce soja', 'nuoc mam', 'miso', 'tahini', 'sambal', 'gochujang', 'kecap manis'],
  'vegetariens': ['tofu', 'tempeh', 'seitan'],
  'divers': []
};

function categorizeIngredient(name) {
  const normalized = normalizeForComparison(name);

  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }

  return 'divers';
}

// Classification des ingrédients selon la hiérarchie canonical -> cultivar -> archetype
// Type: 'canonical' = aliment de base, 'cultivar' = variété, 'archetype' = transformation/préparation

const ingredientClassification = {
  // VIANDES - Archetypes (transformations de canonical_food "bœuf", "veau", etc.)
  'bœuf haché': { type: 'archetype', canonical: 'bœuf', process: 'haché', variants: ['boeuf haché', 'viande hachée', 'viande boeuf'] },
  'bœuf à braiser': { type: 'archetype', canonical: 'bœuf', process: 'à braiser', variants: ['boeuf à braiser', 'boeuf à mijoter', 'boeuf (gîte, paleron)', 'paleron de boeuf'] },
  'bœuf effiloché': { type: 'archetype', canonical: 'bœuf', process: 'effiloché', variants: ['boeuf effiloché'] },

  'veau haché': { type: 'archetype', canonical: 'veau', process: 'haché', variants: ['veau haché'] },
  'veau à braiser': { type: 'archetype', canonical: 'veau', process: 'à braiser', variants: ['veau pour blanquette', 'sauté de veau'] },

  'agneau haché': { type: 'archetype', canonical: 'agneau', process: 'haché', variants: ['viande d\'agneau hachée', 'viande d\'agneau'] },

  // Charcuterie
  'lardons': ['lardons', 'lardons fumés', 'lard', 'poitrine fumée'],
  'jambon cuit': ['jambon cuit', 'jambon blanc'],
  'jambon cru': ['jambon cru', 'jambon serrano', 'jambon ibérique', 'guanciale'],
  'bacon': ['bacon', 'tranches de bacon'],
  'saucisse': ['saucisses de Toulouse', 'saucisses fumées', 'saucisses de Strasbourg', 'chair à saucisse', 'chair saucisse'],

  // Produits laitiers
  'fromage râpé': ['fromage râpé', 'gruyère râpé', 'comté râpé', 'parmesan râpé'],
  'fromage frais': ['fromage frais', 'St Môret', 'chèvre frais'],
  'fromage': ['fromage', 'fromage de chèvre'],
  'crème fraîche': ['crème', 'crème fraîche'],
  'beurre': ['beurre', 'beurre mou', 'beurre fondu', 'beurre froid'],

  // Pâtes
  'pâtes': ['pâtes', 'pâtes courtes'],
  'nouilles': ['nouilles', 'nouilles chinoises'],
  'vermicelles': ['vermicelle'],

  // Pains
  'pain de campagne': ['pain de campagne', 'baguette'],
  'pain de mie': ['pain de mie'],
  'pain rassis': ['pain rassis', 'mie de pain', 'mie pain'],
  'pain burger': ['pains burger', 'burger'],

  // Farines
  'farine': ['farine', 'farine T45', 'farine T65', 'farine type 00', 'farine manitoba'],
  'farine complète': ['farine complète', 'farine teff'],

  // Bouillons
  'bouillon de bœuf': ['bouillon de boeuf'],
  'bouillon de volaille': ['bouillon de volaille', 'bouillon poulet'],
  'fumet de poisson': ['fumet de poisson', 'fumet poisson', 'fumet'],

  // Sauces
  'sauce soja': ['sauce soja claire', 'sauce soja foncée'],

  // Alcools
  'vin blanc': ['vin blanc sec', 'vin blanc Anjou'],
  'vin rouge': ['vin rouge de Bourgogne', 'rouge'],
  'bière': ['bière', 'bière blonde'],
  'bière brune': ['bière brune', 'bière ambrée'],

  // Légumes
  'poireaux': ['poireaux', 'blanc de poireau'],
  'patates douces': ['patates douces'],

  // Fruits
  'fruits rouges': ['fruits rouges', 'fruits rouges mélangés'],
  'fruits': ['fruits', 'fruits variés'],

  // Poissons
  'poisson blanc': ['poisson blanc', 'poisson', 'poissons blancs variés', 'poissons variés'],

  // Fruits de mer
  'fruits de mer': ['fruits de mer variés', 'fruits mer'],

  // Épices
  'paprika': ['paprika', 'paprika ', 'paprika doux'],
  'noix de muscade': ['noix de muscade'],

  // Condiments
  'mayonnaise': ['mayonnaise'],
  'aïoli': ['aïoli'],
  'pesto': ['pesto'],
  'tzatziki': ['tzatziki'],

  // Autres
  'œufs': ['durs', 'ronds', 'chauds', 'nature', 'verts'],
  'huile de friture': ['huile de friture', 'huile'],
  'bouquet garni': ['bouquet garni', 'garni'],
  'herbes de Provence': ['herbes de Provence'],
};

async function analyzeAndNormalize() {
  console.log('=== NORMALISATION DES INGRÉDIENTS MANQUANTS ===\n');

  // Lire la liste des ingrédients manquants
  const content = fs.readFileSync('INGREDIENTS_NON_TROUVES.txt', 'utf-8');
  const missingIngredients = content.split('\n').filter(line => line.trim());

  console.log(`📊 ${missingIngredients.length} ingrédients manquants\n`);

  // Charger les ingrédients existants
  const { data: existingCanonical } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name, primary_unit');

  const { data: existingArchetypes } = await supabase
    .from('archetypes')
    .select('id, name, primary_unit');

  console.log(`✅ ${existingCanonical.length} aliments canoniques existants`);
  console.log(`✅ ${existingArchetypes.length} archetypes existants\n`);

  // Analyser et regrouper
  const normalized = new Map(); // nom normalisé -> liste de variantes
  const mapping = {}; // variante -> nom canonique
  const toCreate = []; // ingrédients à créer

  // D'abord, appliquer les groupes de variantes prédéfinis
  for (const [canonical, variants] of Object.entries(variantGroups)) {
    for (const variant of variants) {
      if (missingIngredients.includes(variant)) {
        mapping[variant] = canonical;
        if (!normalized.has(canonical)) {
          normalized.set(canonical, []);
        }
        normalized.get(canonical).push(variant);
      }
    }
  }

  // Ensuite, traiter les ingrédients non groupés
  for (const ingredient of missingIngredients) {
    if (!mapping[ingredient]) {
      // Vérifier s'il existe déjà sous une autre forme
      const normalizedName = normalizeForComparison(ingredient);

      let found = false;

      // Chercher dans les canoniques existants
      for (const canon of existingCanonical) {
        if (normalizeForComparison(canon.canonical_name) === normalizedName) {
          mapping[ingredient] = canon.canonical_name;
          found = true;
          break;
        }
      }

      // Chercher dans les archetypes existants
      if (!found) {
        for (const arch of existingArchetypes) {
          if (normalizeForComparison(arch.name) === normalizedName) {
            mapping[ingredient] = arch.name;
            found = true;
            break;
          }
        }
      }

      // Si pas trouvé, ajouter comme nouvel ingrédient à créer
      if (!found) {
        const category = categorizeIngredient(ingredient);
        toCreate.push({
          name: ingredient,
          category: category
        });
        mapping[ingredient] = ingredient;
      }
    }
  }

  // Résumé
  console.log('=== RÉSUMÉ DE LA NORMALISATION ===\n');
  console.log(`📦 ${normalized.size} groupes de variantes créés`);
  console.log(`✅ ${Object.keys(mapping).length} mappings créés`);
  console.log(`➕ ${toCreate.length} nouveaux ingrédients à créer\n`);

  // Afficher les groupes
  console.log('=== GROUPES DE VARIANTES ===\n');
  for (const [canonical, variants] of normalized.entries()) {
    if (variants.length > 1) {
      console.log(`📌 ${canonical}:`);
      variants.forEach(v => console.log(`   - ${v}`));
      console.log('');
    }
  }

  // Afficher les ingrédients à créer par catégorie
  console.log('\n=== INGRÉDIENTS À CRÉER PAR CATÉGORIE ===\n');
  const byCategory = {};
  toCreate.forEach(ing => {
    if (!byCategory[ing.category]) {
      byCategory[ing.category] = [];
    }
    byCategory[ing.category].push(ing.name);
  });

  for (const [category, ingredients] of Object.entries(byCategory)) {
    console.log(`📁 ${category.toUpperCase()} (${ingredients.length}):`);
    ingredients.slice(0, 10).forEach(name => console.log(`   - ${name}`));
    if (ingredients.length > 10) {
      console.log(`   ... et ${ingredients.length - 10} autres`);
    }
    console.log('');
  }

  // Sauvegarder les résultats
  fs.writeFileSync('INGREDIENTS_MAPPING.json', JSON.stringify(mapping, null, 2));
  fs.writeFileSync('INGREDIENTS_TO_CREATE.json', JSON.stringify(toCreate, null, 2));

  console.log('✅ Fichiers sauvegardés:');
  console.log('   - INGREDIENTS_MAPPING.json (mapping variantes -> canoniques)');
  console.log('   - INGREDIENTS_TO_CREATE.json (nouveaux ingrédients à créer)');
}

analyzeAndNormalize().catch(console.error);
