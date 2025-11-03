// Classification intelligente des ingrédients manquants
// En respectant la structure existante
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeForMatching(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/\s+/g, ' ')
    .trim();
}

async function smartClassification() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   CLASSIFICATION INTELLIGENTE DES INGRÉDIENTS MANQUANTS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Charger l'audit
  const audit = JSON.parse(fs.readFileSync('AUDIT_INGREDIENTS_COMPLET.json', 'utf-8'));
  const canonicalFoods = audit.canonical_foods.liste;
  const archetypes = audit.archetypes.liste;

  // Charger les ingrédients manquants
  const missingRaw = fs.readFileSync('INGREDIENTS_NON_TROUVES.txt', 'utf-8');
  const missingIngredients = missingRaw.split('\n').filter(l => l.trim());

  console.log(`📊 ${missingIngredients.length} ingrédients à classifier\n`);

  // Créer des index de recherche normalisés
  const canonicalIndex = new Map();
  canonicalFoods.forEach(cf => {
    canonicalIndex.set(normalizeForMatching(cf.canonical_name), cf);
  });

  const archetypeIndex = new Map();
  archetypes.forEach(arch => {
    archetypeIndex.set(normalizeForMatching(arch.name), arch);
  });

  // Résultats
  const results = {
    deja_existe_canonical: [],
    deja_existe_archetype: [],
    a_creer_canonical: [],
    a_creer_archetype: [],
    a_ignorer: [],
    ambigus: []
  };

  // Éléments à ignorer (doublons, erreurs de format, etc.)
  const toIgnore = new Set([
    'durs', 'chauds', 'verts', 'rouges', 'cuillère', 'rouge', 'nature',
    'sel|poivre', 'poivre|moulin', 'fleur de sel', 'sel', 'huile',
    'muscade', 'persil|frais', 'aneth|frais', 'coriandre fraîche',
    'graines sésame', 'poivre noir', 'poivre', 'salade|feuilles',
    'nori|feuilles', 'pour dorure', 'burger'
  ]);

  console.log('🔍 ANALYSE EN COURS...\n');

  for (const ingredient of missingIngredients) {
    const normalized = normalizeForMatching(ingredient);

    // 1. À ignorer?
    if (toIgnore.has(ingredient) || ingredient.length < 3) {
      results.a_ignorer.push({ nom: ingredient, raison: 'Element invalide ou trop générique' });
      continue;
    }

    // 2. Existe déjà dans canonical?
    if (canonicalIndex.has(normalized)) {
      results.deja_existe_canonical.push({
        nom: ingredient,
        existe_comme: canonicalIndex.get(normalized).canonical_name,
        id: canonicalIndex.get(normalized).id
      });
      continue;
    }

    // 3. Existe déjà dans archetypes?
    if (archetypeIndex.has(normalized)) {
      results.deja_existe_archetype.push({
        nom: ingredient,
        existe_comme: archetypeIndex.get(normalized).name,
        id: archetypeIndex.get(normalized).id
      });
      continue;
    }

    // 4. Classifier l'ingrédient
    const classification = classifyIngredient(ingredient, canonicalFoods);

    if (classification.type === 'canonical') {
      results.a_creer_canonical.push(classification);
    } else if (classification.type === 'archetype') {
      results.a_creer_archetype.push(classification);
    } else {
      results.ambigus.push({ nom: ingredient, suggestion: classification });
    }
  }

  // Afficher les résultats
  console.log('═══════════════════════════════════════════════════════');
  console.log('                   RÉSULTATS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`✅ Déjà existants comme canonical: ${results.deja_existe_canonical.length}`);
  console.log(`✅ Déjà existants comme archetype: ${results.deja_existe_archetype.length}`);
  console.log(`➕ À créer comme canonical: ${results.a_creer_canonical.length}`);
  console.log(`🔧 À créer comme archetype: ${results.a_creer_archetype.length}`);
  console.log(`⏭️  À ignorer: ${results.a_ignorer.length}`);
  console.log(`❓ Ambigus (à valider manuellement): ${results.ambigus.length}\n`);

  // Détails
  if (results.deja_existe_canonical.length > 0) {
    console.log('\n✅ DÉJÀ EXISTANTS (canonical):');
    results.deja_existe_canonical.slice(0, 20).forEach(r => {
      console.log(`   "${r.nom}" → existe déjà: "${r.existe_comme}" (ID ${r.id})`);
    });
    if (results.deja_existe_canonical.length > 20) {
      console.log(`   ... et ${results.deja_existe_canonical.length - 20} autres`);
    }
  }

  if (results.deja_existe_archetype.length > 0) {
    console.log('\n✅ DÉJÀ EXISTANTS (archetype):');
    results.deja_existe_archetype.slice(0, 20).forEach(r => {
      console.log(`   "${r.nom}" → existe déjà: "${r.existe_comme}" (ID ${r.id})`);
    });
    if (results.deja_existe_archetype.length > 20) {
      console.log(`   ... et ${results.deja_existe_archetype.length - 20} autres`);
    }
  }

  if (results.a_creer_canonical.length > 0) {
    console.log('\n➕ À CRÉER (canonical):');
    results.a_creer_canonical.slice(0, 30).forEach(r => {
      console.log(`   - ${r.nom} (${r.primary_unit || 'g'})`);
    });
    if (results.a_creer_canonical.length > 30) {
      console.log(`   ... et ${results.a_creer_canonical.length - 30} autres`);
    }
  }

  if (results.a_creer_archetype.length > 0) {
    console.log('\n🔧 À CRÉER (archetype):');
    results.a_creer_archetype.slice(0, 30).forEach(r => {
      console.log(`   - ${r.nom} (parent: ${r.parent_name}, process: ${r.process})`);
    });
    if (results.a_creer_archetype.length > 30) {
      console.log(`   ... et ${results.a_creer_archetype.length - 30} autres`);
    }
  }

  if (results.ambigus.length > 0) {
    console.log('\n❓ AMBIGUS (à valider manuellement):');
    results.ambigus.slice(0, 30).forEach(r => {
      console.log(`   - ${r.nom}: ${r.suggestion.raison}`);
    });
    if (results.ambigus.length > 30) {
      console.log(`   ... et ${results.ambigus.length - 30} autres`);
    }
  }

  // Sauvegarder
  fs.writeFileSync('CLASSIFICATION_RESULTS.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Résultats sauvegardés: CLASSIFICATION_RESULTS.json\n');

  return results;
}

function classifyIngredient(name, canonicalFoods) {
  const normalized = normalizeForMatching(name);

  // Trouver les IDs des canonical existants
  const laitId = canonicalFoods.find(cf => normalizeForMatching(cf.canonical_name) === 'lait')?.id || 7001;
  const boeufId = canonicalFoods.find(cf => normalizeForMatching(cf.canonical_name) === 'boeuf')?.id || 14011;
  const porcId = canonicalFoods.find(cf => normalizeForMatching(cf.canonical_name) === 'porc')?.id || 2051;
  const veauId = canonicalFoods.find(cf => normalizeForMatching(cf.canonical_name) === 'veau')?.id || 8015;
  const agneauId = canonicalFoods.find(cf => normalizeForMatching(cf.canonical_name) === 'agneau')?.id || 4001;
  const pouletId = canonicalFoods.find(cf => normalizeForMatching(cf.canonical_name) === 'poulet')?.id || 2054;
  const saumonId = canonicalFoods.find(cf => normalizeForMatching(cf.canonical_name) === 'saumon')?.id || 2062;
  const bleId = canonicalFoods.find(cf => normalizeForMatching(cf.canonical_name) === 'ble')?.id || null;

  // === PRODUITS LAITIERS (archetypes de lait) ===
  if (normalized.includes('fromage') || normalized.includes('chevre frais') ||
      normalized.includes('feta') || normalized.includes('ricotta') ||
      normalized.includes('mascarpone') || normalized.includes('cream cheese')) {
    return {
      type: 'archetype',
      nom: name,
      parent_id: laitId,
      parent_name: 'lait',
      process: 'fromage',
      primary_unit: 'g'
    };
  }

  if (normalized.includes('creme') && !normalized.includes('glace')) {
    return {
      type: 'archetype',
      nom: name,
      parent_id: laitId,
      parent_name: 'lait',
      process: 'crème',
      primary_unit: 'ml'
    };
  }

  // === VIANDES (archetypes) ===
  if (normalized.includes('boeuf') || normalized.includes('bœuf')) {
    return {
      type: 'archetype',
      nom: name,
      parent_id: boeufId,
      parent_name: 'bœuf',
      process: detectProcess(name),
      primary_unit: detectUnit(name)
    };
  }

  if (normalized.includes('veau')) {
    return {
      type: 'archetype',
      nom: name,
      parent_id: veauId,
      parent_name: 'veau',
      process: detectProcess(name),
      primary_unit: detectUnit(name)
    };
  }

  if (normalized.includes('agneau')) {
    return {
      type: 'archetype',
      nom: name,
      parent_id: agneauId,
      parent_name: 'agneau',
      process: detectProcess(name),
      primary_unit: detectUnit(name)
    };
  }

  // === CHARCUTERIE (archetypes de porc) ===
  if (normalized.includes('lard') || normalized.includes('bacon') || normalized.includes('jambon') ||
      normalized.includes('saucisse') || normalized.includes('boudin')) {
    return {
      type: 'archetype',
      nom: name,
      parent_id: porcId,
      parent_name: 'porc',
      process: detectProcess(name),
      primary_unit: detectUnit(name)
    };
  }

  // === BOUILLONS (archetypes) ===
  if (normalized.includes('bouillon') || normalized.includes('fond') || normalized.includes('fumet')) {
    let parentId = null, parentName = '';
    if (normalized.includes('boeuf')) { parentId = boeufId; parentName = 'bœuf'; }
    else if (normalized.includes('volaille') || normalized.includes('poulet')) { parentId = pouletId; parentName = 'poulet'; }
    else if (normalized.includes('poisson')) { parentId = saumonId; parentName = 'poisson'; }

    if (parentId) {
      return {
        type: 'archetype',
        nom: name,
        parent_id: parentId,
        parent_name: parentName,
        process: 'bouillon',
        primary_unit: 'ml'
      };
    }
  }

  // === ALCOOLS (canonical) ===
  if (normalized.includes('vin') || normalized.includes('biere') || normalized.includes('cidre') ||
      normalized.includes('calvados') || normalized.includes('cognac') || normalized.includes('rhum') ||
      normalized.includes('porto') || normalized.includes('marsala') || normalized.includes('grand marnier') ||
      normalized.includes('amaretto') || normalized.includes('kirsch')) {
    return {
      type: 'canonical',
      nom: name,
      primary_unit: 'ml',
      category_id: null
    };
  }

  // === PÂTES/PAIN (canonical pour simplicité) ===
  if (normalized.includes('pate') || normalized.includes('linguine') || normalized.includes('tagliatelle') ||
      normalized.includes('gnocchi') || normalized.includes('ravioli') || normalized.includes('cannelloni') ||
      normalized.includes('nouille')) {
    return {
      type: 'canonical',
      nom: name,
      primary_unit: 'g',
      category_id: null
    };
  }

  if (normalized.includes('pain') || normalized.includes('baguette') || normalized.includes('brioche')) {
    return {
      type: 'canonical',
      nom: name,
      primary_unit: 'g',
      category_id: null
    };
  }

  // === FARINES ===
  if (normalized.includes('farine')) {
    return {
      type: 'canonical',
      nom: name,
      primary_unit: 'g',
      category_id: null
    };
  }

  // === PRODUITS VÉGÉTARIENS ===
  if (normalized.includes('tofu') || normalized.includes('tempeh') || normalized.includes('seitan')) {
    return {
      type: 'canonical',
      nom: name,
      primary_unit: 'g',
      category_id: null
    };
  }

  // === FRUITS DE MER ===
  if (normalized.includes('crevette') || normalized.includes('calamar') || normalized.includes('palourde') ||
      normalized.includes('homard') || normalized.includes('langoust')) {
    return {
      type: 'canonical',
      nom: name,
      primary_unit: 'g',
      category_id: null
    };
  }

  // === POISSONS ===
  if (normalized.includes('poisson') || normalized.includes('saumon') || normalized.includes('morue') ||
      normalized.includes('cabillaud') || normalized.includes('lotte') || normalized.includes('sole')) {
    return {
      type: 'canonical',
      nom: name,
      primary_unit: 'g',
      category_id: null
    };
  }

  // === ÉPICES ===
  if (normalized.includes('epice') || normalized.includes('curry') || normalized.includes('paprika') ||
      normalized.includes('cumin') || normalized.includes('garam masala') || normalized.includes('cinq epices')) {
    return {
      type: 'canonical',
      nom: name,
      primary_unit: 'g',
      category_id: null
    };
  }

  // === LÉGUMES ===
  if (normalized.includes('legume') || normalized.includes('courgette') || normalized.includes('patate') ||
      normalized.includes('poireau') || normalized.includes('blette')) {
    return {
      type: 'canonical',
      nom: name,
      primary_unit: 'g',
      category_id: null
    };
  }

  // Par défaut: canonical
  return {
    type: 'ambiguous',
    nom: name,
    raison: 'Classification incertaine - à vérifier manuellement'
  };
}

function detectProcess(name) {
  const normalized = normalizeForMatching(name);
  if (normalized.includes('hache')) return 'haché';
  if (normalized.includes('braiser') || normalized.includes('mijoter')) return 'en morceaux';
  if (normalized.includes('steak') || normalized.includes('tournedos') || normalized.includes('pave')) return 'steak';
  if (normalized.includes('entrecote')) return 'entrecôte';
  if (normalized.includes('cote')) return 'côte';
  if (normalized.includes('escalope')) return 'escalope';
  if (normalized.includes('roti')) return 'rôti';
  if (normalized.includes('gigot')) return 'gigot';
  if (normalized.includes('epaule')) return 'épaule';
  if (normalized.includes('cotelette')) return 'côtelette';
  if (normalized.includes('fume')) return 'fumé';
  if (normalized.includes('dessale')) return 'dessalé';
  return 'transformation';
}

function detectUnit(name) {
  const normalized = normalizeForMatching(name);
  if (normalized.includes('steak') || normalized.includes('escalope') || normalized.includes('cotelette')) return 'pièce';
  if (normalized.includes('tranche')) return 'tranche';
  if (normalized.includes('bouillon') || normalized.includes('fond') || normalized.includes('fumet')) return 'ml';
  return 'g';
}

smartClassification().catch(console.error);
