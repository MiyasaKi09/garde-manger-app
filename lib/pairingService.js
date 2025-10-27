/**
 * 🧪 Service d'Assemblage Intelligent de Recettes
 * 
 * Combine gastronomie moléculaire et règles culinaires classiques
 * pour suggérer des assemblages de plats harmonieux.
 * 
 * Basé sur 4 algorithmes :
 * 1. Food Pairing (arômes partagés) - 30 points max
 * 2. Règle d'Équilibre (riche ↔ léger) - 25 points max
 * 3. Règle de Contraste (textures opposées) - 20 points max
 * 4. Règle du Terroir (cuisine commune) - 15 points max
 * Bonus Saison - 10 points max
 * 
 * @see ASSEMBLAGE_INTELLIGENT.md pour spécifications complètes
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Matrice de contraste de textures
 * @type {Array<{base: string, contrast: string}>}
 */
const TEXTURE_CONTRASTS = [
  { base: 'Texture-Crémeux', contrast: 'Texture-Croquant' },
  { base: 'Texture-Moelleux', contrast: 'Texture-Ferme' },
  { base: 'Texture-Liquide', contrast: 'Texture-Croquant' },
];

/**
 * Catégories de tags pour analyse
 */
const TAG_CATEGORIES = {
  aromatic: 'Arôme-',
  intensity: 'Intensité-',
  texture: 'Texture-',
  flavor: 'Saveur-',
  season: ['Printemps', 'Été', 'Automne', 'Hiver'],
  cuisine: ['Française', 'Italienne', 'Espagnole', 'Asiatique', 'Chinoise', 
            'Japonaise', 'Thaïlandaise', 'Indienne', 'Mexicaine', 'Américaine', 'Orientale'],
  diet: ['Végétarien', 'Vegan', 'Sans Gluten', 'Sans Lactose'],
};

/**
 * Récupère une recette avec tous ses tags
 * @param {number} recipeId - ID de la recette
 * @returns {Promise<{recipe: Object, tags: Array<string>}>}
 */
async function getRecipeWithTags(recipeId) {
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id, name, description, role, party_size')
    .eq('id', recipeId)
    .single();

  if (recipeError) {
    throw new Error(`Recette non trouvée: ${recipeError.message}`);
  }

  const { data: tagData, error: tagError } = await supabase
    .from('recipe_tags')
    .select('tags(name)')
    .eq('recipe_id', recipeId);

  if (tagError) {
    throw new Error(`Erreur tags: ${tagError.message}`);
  }

  const tags = tagData.map(item => item.tags.name);

  return { recipe, tags };
}

/**
 * Récupère tous les accompagnements possibles avec leurs tags
 * @param {Object} filters - Filtres optionnels (diet, season)
 * @returns {Promise<Array<{recipe: Object, tags: Array<string>}>>}
 */
async function getCandidateSideDishes(filters = {}) {
  // 1. Récupérer tous les accompagnements
  let query = supabase
    .from('recipes')
    .select('id, name, description, role, party_size')
    .eq('role', 'ACCOMPAGNEMENT');

  const { data: sideDishes, error } = await query;

  if (error) {
    throw new Error(`Erreur accompagnements: ${error.message}`);
  }

  // 2. Récupérer les tags pour chaque accompagnement
  const recipesWithTags = await Promise.all(
    sideDishes.map(async (recipe) => {
      const { data: tagData } = await supabase
        .from('recipe_tags')
        .select('tags(name)')
        .eq('recipe_id', recipe.id);

      const tags = tagData ? tagData.map(item => item.tags.name) : [];
      return { recipe, tags };
    })
  );

  // 3. Appliquer les filtres
  let filtered = recipesWithTags;

  if (filters.diet) {
    filtered = filtered.filter(({ tags }) => tags.includes(filters.diet));
  }

  return filtered;
}

/**
 * 1️⃣ FOOD PAIRING : Arômes partagés (gastronomie moléculaire)
 * Score : +10 points par arôme partagé (max 30 points)
 * 
 * @param {Array<string>} mainTags - Tags du plat principal
 * @param {Array<string>} sideTags - Tags de l'accompagnement
 * @returns {{score: number, sharedAromatics: Array<string>}}
 */
function calculateFoodPairingScore(mainTags, sideTags) {
  const mainAromatics = mainTags.filter(tag => tag.startsWith(TAG_CATEGORIES.aromatic));
  const sideAromatics = sideTags.filter(tag => tag.startsWith(TAG_CATEGORIES.aromatic));

  const sharedAromatics = mainAromatics.filter(aromatic => 
    sideAromatics.includes(aromatic)
  );

  const score = Math.min(sharedAromatics.length * 10, 30);

  return { score, sharedAromatics };
}

/**
 * 2️⃣ RÈGLE D'ÉQUILIBRE : Plat riche ↔ Accompagnement léger/acide
 * Score : +25 points si équilibré
 * 
 * @param {Array<string>} mainTags - Tags du plat principal
 * @param {Array<string>} sideTags - Tags de l'accompagnement
 * @returns {{score: number, balanced: boolean, reason: string}}
 */
function calculateBalanceScore(mainTags, sideTags) {
  const isMainRich = mainTags.includes('Intensité-Riche') || mainTags.includes('Intensité-Intense');
  const isSideLight = sideTags.includes('Intensité-Léger');
  const isSideAcidic = sideTags.includes('Saveur-Acide');

  if (isMainRich && (isSideLight || isSideAcidic)) {
    return {
      score: 25,
      balanced: true,
      reason: isSideLight 
        ? 'Accompagnement léger pour équilibrer plat riche'
        : 'Accompagnement acidulé pour couper le gras',
    };
  }

  return { score: 0, balanced: false, reason: null };
}

/**
 * 3️⃣ RÈGLE DE CONTRASTE : Textures opposées
 * Score : +20 points par contraste détecté
 * 
 * @param {Array<string>} mainTags - Tags du plat principal
 * @param {Array<string>} sideTags - Tags de l'accompagnement
 * @returns {{score: number, contrasts: Array<string>}}
 */
function calculateContrastScore(mainTags, sideTags) {
  const contrasts = [];

  for (const { base, contrast } of TEXTURE_CONTRASTS) {
    if (mainTags.includes(base) && sideTags.includes(contrast)) {
      contrasts.push(`${base} ↔ ${contrast}`);
    }
    // Vérifier aussi dans l'autre sens
    if (mainTags.includes(contrast) && sideTags.includes(base)) {
      contrasts.push(`${contrast} ↔ ${base}`);
    }
  }

  const score = Math.min(contrasts.length * 20, 20);

  return { score, contrasts };
}

/**
 * 4️⃣ RÈGLE DU TERROIR : Cuisine commune
 * Score : +15 points par cuisine partagée
 * 
 * @param {Array<string>} mainTags - Tags du plat principal
 * @param {Array<string>} sideTags - Tags de l'accompagnement
 * @returns {{score: number, sharedCuisines: Array<string>}}
 */
function calculateTerroirScore(mainTags, sideTags) {
  const mainCuisines = mainTags.filter(tag => TAG_CATEGORIES.cuisine.includes(tag));
  const sideCuisines = sideTags.filter(tag => TAG_CATEGORIES.cuisine.includes(tag));

  const sharedCuisines = mainCuisines.filter(cuisine => 
    sideCuisines.includes(cuisine)
  );

  const score = Math.min(sharedCuisines.length * 15, 15);

  return { score, sharedCuisines };
}

/**
 * ⭐ BONUS SAISON : Même saison
 * Score : +10 points si saison commune
 * 
 * @param {Array<string>} mainTags - Tags du plat principal
 * @param {Array<string>} sideTags - Tags de l'accompagnement
 * @returns {{score: number, season: string|null}}
 */
function calculateSeasonBonus(mainTags, sideTags) {
  const mainSeasons = mainTags.filter(tag => TAG_CATEGORIES.season.includes(tag));
  const sideSeasons = sideTags.filter(tag => TAG_CATEGORIES.season.includes(tag));

  const sharedSeasons = mainSeasons.filter(season => 
    sideSeasons.includes(season)
  );

  if (sharedSeasons.length > 0) {
    return { score: 10, season: sharedSeasons[0] };
  }

  return { score: 0, season: null };
}

/**
 * Calcule le score total de pairing entre un plat principal et un accompagnement
 * 
 * @param {Array<string>} mainTags - Tags du plat principal
 * @param {Array<string>} sideTags - Tags de l'accompagnement
 * @returns {{totalScore: number, details: Object}}
 */
function calculatePairingScore(mainTags, sideTags) {
  const foodPairing = calculateFoodPairingScore(mainTags, sideTags);
  const balance = calculateBalanceScore(mainTags, sideTags);
  const contrast = calculateContrastScore(mainTags, sideTags);
  const terroir = calculateTerroirScore(mainTags, sideTags);
  const season = calculateSeasonBonus(mainTags, sideTags);

  const totalScore = 
    foodPairing.score + 
    balance.score + 
    contrast.score + 
    terroir.score + 
    season.score;

  return {
    totalScore,
    details: {
      foodPairing,
      balance,
      contrast,
      terroir,
      season,
    },
  };
}

/**
 * Génère une explication textuelle du score de pairing
 * 
 * @param {Object} scoreDetails - Détails du score (retour de calculatePairingScore)
 * @returns {Array<{type: string, description: string, score: number}>}
 */
function generateReasons(scoreDetails) {
  const reasons = [];

  // Food Pairing
  if (scoreDetails.foodPairing.score > 0) {
    reasons.push({
      type: 'food_pairing',
      description: `Arômes partagés : ${scoreDetails.foodPairing.sharedAromatics.join(', ')}`,
      score: scoreDetails.foodPairing.score,
    });
  }

  // Équilibre
  if (scoreDetails.balance.score > 0) {
    reasons.push({
      type: 'balance',
      description: scoreDetails.balance.reason,
      score: scoreDetails.balance.score,
    });
  }

  // Contraste
  if (scoreDetails.contrast.score > 0) {
    reasons.push({
      type: 'contrast',
      description: `Contraste de textures : ${scoreDetails.contrast.contrasts.join(', ')}`,
      score: scoreDetails.contrast.score,
    });
  }

  // Terroir
  if (scoreDetails.terroir.score > 0) {
    reasons.push({
      type: 'terroir',
      description: `Cuisine commune : ${scoreDetails.terroir.sharedCuisines.join(', ')}`,
      score: scoreDetails.terroir.score,
    });
  }

  // Saison
  if (scoreDetails.season.score > 0) {
    reasons.push({
      type: 'season',
      description: `Saison : ${scoreDetails.season.season}`,
      score: scoreDetails.season.score,
    });
  }

  return reasons;
}

/**
 * 🎯 FONCTION PRINCIPALE : Suggère des accompagnements pour un plat principal
 * 
 * @param {number} mainRecipeId - ID du plat principal
 * @param {Object} options - Options de recherche
 * @param {string} options.diet - Régime alimentaire (optionnel)
 * @param {string} options.season - Saison préférée (optionnel)
 * @param {number} options.maxSuggestions - Nombre max de suggestions (défaut: 5)
 * @returns {Promise<Array<Object>>} - Suggestions triées par score décroissant
 */
export async function suggestPairings(mainRecipeId, options = {}) {
  const { diet, season, maxSuggestions = 5 } = options;

  // 1. Récupérer le plat principal avec ses tags
  const { recipe: mainRecipe, tags: mainTags } = await getRecipeWithTags(mainRecipeId);

  console.log(`🍽️ Recherche d'accompagnements pour : ${mainRecipe.name}`);
  console.log(`📋 Tags du plat : ${mainTags.join(', ')}`);

  // 2. Récupérer les accompagnements candidats
  const candidates = await getCandidateSideDishes({ diet });

  console.log(`🔍 ${candidates.length} accompagnements candidats trouvés`);

  // 3. Calculer le score pour chaque accompagnement
  const suggestions = candidates.map(({ recipe, tags }) => {
    const { totalScore, details } = calculatePairingScore(mainTags, tags);
    const reasons = generateReasons(details);

    return {
      recipe: {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        role: recipe.role,
        party_size: recipe.party_size,
      },
      tags,
      score: totalScore,
      scorePercentage: Math.round((totalScore / 100) * 100), // Score sur 100
      reasons,
      details,
    };
  });

  // 4. Trier par score décroissant et limiter
  const topSuggestions = suggestions
    .filter(s => s.score > 0) // Exclure scores à 0
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);

  console.log(`✅ ${topSuggestions.length} suggestions générées`);

  return topSuggestions;
}

/**
 * 🔍 Fonction de débogage : Affiche les détails d'un pairing
 */
export async function debugPairing(mainRecipeId, sideRecipeId) {
  const { recipe: mainRecipe, tags: mainTags } = await getRecipeWithTags(mainRecipeId);
  const { recipe: sideRecipe, tags: sideTags } = await getRecipeWithTags(sideRecipeId);

  const { totalScore, details } = calculatePairingScore(mainTags, sideTags);
  const reasons = generateReasons(details);

  return {
    main: { recipe: mainRecipe, tags: mainTags },
    side: { recipe: sideRecipe, tags: sideTags },
    score: totalScore,
    scorePercentage: Math.round((totalScore / 100) * 100),
    reasons,
    details,
  };
}
