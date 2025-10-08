-- ================================================================================================
-- MYKO RECIPES DATABASE - PRODUCTION READY
-- ================================================================================================
-- Base de données des recettes Myko intégrée à l'architecture inventory existante
-- Compatible avec : canonical_foods, cultivars, archetypes, products, inventory_lots
-- 
-- ORDRE D'EXÉCUTION :
-- 1. Ce fichier (tables principales)
-- 2. myko_sample_data.sql (données d'exemple)
-- 3. myko_functions.sql (fonctions avancées)
-- ================================================================================================

-- ================================================================================================
-- 1. TABLES DE RÉFÉRENCE POUR LES RECETTES
-- ================================================================================================

-- Catégories de recettes
CREATE TABLE IF NOT EXISTS recipe_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  
  -- Compatibilité avec les types de repas
  meal_compatibility JSONB DEFAULT '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Types de cuisine
CREATE TABLE IF NOT EXISTS cuisine_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  flag VARCHAR(10), -- emoji drapeau
  region VARCHAR(100),
  typical_ingredients TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Niveaux de difficulté
CREATE TABLE IF NOT EXISTS difficulty_levels (
  id SERIAL PRIMARY KEY,
  level VARCHAR(50) NOT NULL UNIQUE, -- 'facile', 'moyen', 'difficile'
  name VARCHAR(100) NOT NULL, -- nom affiché
  description TEXT,
  min_prep_time INTEGER, -- temps minimum en minutes
  max_prep_time INTEGER, -- temps maximum en minutes
  techniques_required TEXT[], -- techniques nécessaires
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Types de régimes alimentaires
CREATE TABLE IF NOT EXISTS dietary_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  restrictions TEXT[], -- liste des restrictions
  color VARCHAR(7), -- code couleur hex
  icon VARCHAR(20), -- emoji
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Équipements de cuisine
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50), -- 'basic', 'advanced', 'professional'
  description TEXT,
  alternatives TEXT[], -- équipements de substitution
  is_essential BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================================
-- 2. TECHNIQUES DE CUISSON ET IMPACT NUTRITIONNEL
-- ================================================================================================

-- Techniques de cuisson avec impact nutritionnel
CREATE TABLE IF NOT EXISTS cooking_techniques (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50), -- 'wet_heat', 'dry_heat', 'combination', 'raw'
  
  -- Facteurs de rétention nutritionnelle (multiplicateurs)
  calories_retention DECIMAL(3,2) DEFAULT 1.0, -- ex: 0.95 = -5% calories
  protein_retention DECIMAL(3,2) DEFAULT 1.0,
  carbs_retention DECIMAL(3,2) DEFAULT 1.0,
  fat_retention DECIMAL(3,2) DEFAULT 1.0,
  fiber_retention DECIMAL(3,2) DEFAULT 1.0,
  
  -- Vitamines (sensibles à la cuisson)
  vitamin_c_retention DECIMAL(3,2) DEFAULT 1.0, -- souvent < 1.0
  vitamin_b_retention DECIMAL(3,2) DEFAULT 1.0,
  folate_retention DECIMAL(3,2) DEFAULT 1.0,
  
  -- Minéraux (généralement stables)
  minerals_retention DECIMAL(3,2) DEFAULT 1.0,
  
  -- Autres facteurs
  water_loss_factor DECIMAL(3,2) DEFAULT 0.0, -- concentration par perte d'eau
  fat_addition_factor DECIMAL(3,2) DEFAULT 0.0, -- ajout matières grasses
  
  -- Conditions typiques
  typical_temp_celsius INTEGER,
  typical_duration_min INTEGER,
  
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================================
-- 3. SYSTÈME DE SUBSTITUTIONS INTELLIGENTES
-- ================================================================================================

-- Substitutions automatiques entre produits de l'inventory
CREATE TABLE IF NOT EXISTS smart_substitutions (
  id SERIAL PRIMARY KEY,
  
  -- Produit original demandé dans la recette
  original_product_type VARCHAR(20) NOT NULL CHECK (original_product_type IN ('canonical', 'cultivar', 'archetype', 'product')),
  original_product_id BIGINT NOT NULL,
  
  -- Produit de substitution disponible
  substitute_product_type VARCHAR(20) NOT NULL CHECK (substitute_product_type IN ('canonical', 'cultivar', 'archetype', 'product')),
  substitute_product_id BIGINT NOT NULL,
  
  -- Paramètres de conversion
  conversion_ratio DECIMAL(4,2) DEFAULT 1.0, -- ex: 1.2 = besoin 20% de plus
  context VARCHAR(100), -- 'baking', 'sauce', 'raw', 'frying', etc.
  
  -- Évaluation de la substitution
  compatibility_score INTEGER DEFAULT 5 CHECK (compatibility_score BETWEEN 1 AND 10),
  nutrition_impact_factor DECIMAL(3,2) DEFAULT 1.0, -- impact nutritionnel
  flavor_impact VARCHAR(50) DEFAULT 'neutral', -- 'improved', 'neutral', 'degraded'
  texture_impact VARCHAR(50) DEFAULT 'neutral',
  
  -- Métadonnées
  notes TEXT,
  technique_adjustments TEXT, -- adaptations de technique nécessaires
  season_preference TEXT[], -- préférence saisonnière
  auto_generated BOOLEAN DEFAULT FALSE, -- généré auto vs manuel
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(original_product_type, original_product_id, substitute_product_type, substitute_product_id, context)
);

-- ================================================================================================
-- 4. PROFILS NUTRITIONNELS CIBLES
-- ================================================================================================

-- Profils nutritionnels pour équilibrage automatique
CREATE TABLE IF NOT EXISTS nutritional_profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- Répartition macronutriments (en pourcentage)
  target_protein_percent DECIMAL(4,1), -- ex: 20.0 pour 20%
  target_carbs_percent DECIMAL(4,1),   -- ex: 50.0 pour 50%
  target_fats_percent DECIMAL(4,1),    -- ex: 30.0 pour 30%
  
  -- Apports caloriques par repas
  calories_breakfast DECIMAL(6,2),
  calories_lunch DECIMAL(6,2),
  calories_dinner DECIMAL(6,2),
  
  -- Priorités spécifiques Myko (scores sur 10)
  myko_priorities JSONB DEFAULT '{"anti_waste": 8, "seasonal": 7, "inventory_based": 9, "nutrition": 6}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================================
-- 5. TABLE PRINCIPALE DES RECETTES
-- ================================================================================================

-- Recettes Myko
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations de base
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  
  -- Classification
  category_id INTEGER REFERENCES recipe_categories(id),
  cuisine_type_id INTEGER REFERENCES cuisine_types(id),
  difficulty_level_id INTEGER REFERENCES difficulty_levels(id),
  
  -- Portions et temps
  servings INTEGER DEFAULT 4 CHECK (servings > 0),
  prep_min INTEGER DEFAULT 0 CHECK (prep_min >= 0),
  cook_min INTEGER DEFAULT 0 CHECK (cook_min >= 0),
  rest_min INTEGER DEFAULT 0 CHECK (rest_min >= 0),
  
  -- Nutrition calculée automatiquement (par portion)
  calories_per_serving DECIMAL(6,2),
  proteins_per_serving DECIMAL(5,2),
  carbs_per_serving DECIMAL(5,2),
  fats_per_serving DECIMAL(5,2),
  fiber_per_serving DECIMAL(5,2),
  
  -- Micronutriments clés (par portion)
  vitamin_c_per_serving DECIMAL(5,2),
  iron_per_serving DECIMAL(5,2),
  calcium_per_serving DECIMAL(5,2),
  
  -- Budget et coût
  estimated_cost_per_serving DECIMAL(6,2),
  budget_category VARCHAR(20) CHECK (budget_category IN ('économique', 'moyen', 'cher')),
  
  -- Saisonnalité
  season_spring BOOLEAN DEFAULT TRUE,
  season_summer BOOLEAN DEFAULT TRUE,
  season_autumn BOOLEAN DEFAULT TRUE,
  season_winter BOOLEAN DEFAULT TRUE,
  
  -- Compatibilité repas
  meal_breakfast BOOLEAN DEFAULT FALSE,
  meal_lunch BOOLEAN DEFAULT TRUE,
  meal_dinner BOOLEAN DEFAULT TRUE,
  meal_snack BOOLEAN DEFAULT FALSE,
  
  -- Régimes alimentaires (calculés automatiquement)
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_gluten_free BOOLEAN DEFAULT FALSE,
  is_dairy_free BOOLEAN DEFAULT FALSE,
  is_nut_free BOOLEAN DEFAULT FALSE,
  
  -- Instructions
  instructions TEXT NOT NULL,
  chef_tips TEXT,
  serving_suggestions TEXT,
  storage_instructions TEXT,
  
  -- Scoring Myko (calculé automatiquement)
  myko_score INTEGER DEFAULT 0 CHECK (myko_score BETWEEN 0 AND 100),
  myko_factors JSONB, -- détail des facteurs du score
  inventory_compatibility_score INTEGER DEFAULT 0, -- % ingrédients disponibles
  
  -- Métadonnées
  image_url TEXT,
  video_url TEXT,
  source_name VARCHAR(200),
  author_name VARCHAR(200),
  
  -- Statistiques d'utilisation
  times_cooked INTEGER DEFAULT 0,
  avg_rating DECIMAL(2,1) DEFAULT 0,
  last_cooked_at TIMESTAMP WITH TIME ZONE,
  
  -- Système
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_total_time CHECK (prep_min + cook_min + rest_min > 0)
);

-- ================================================================================================
-- 6. INGRÉDIENTS DE RECETTES (CONNECTÉS À L'INVENTORY)
-- ================================================================================================

-- Ingrédients par recette - utilise le système inventory existant
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- RÉFÉRENCE DIRECTE VERS LE SYSTÈME INVENTORY EXISTANT
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('canonical', 'cultivar', 'archetype', 'product')),
  product_id BIGINT NOT NULL, -- ID vers canonical_foods.id, cultivars.id, etc.
  
  -- Quantités
  quantity DECIMAL(8,3) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(20) NOT NULL, -- g, ml, pièce, etc.
  
  -- Préparation et cuisson
  preparation_note VARCHAR(200), -- 'haché', 'en dés', 'râpé', etc.
  cooking_technique_id INTEGER REFERENCES cooking_techniques(id),
  cooking_duration_min INTEGER DEFAULT 0,
  cooking_temperature INTEGER, -- °C si applicable
  
  -- Organisation dans la recette
  ingredient_group VARCHAR(100), -- 'base', 'sauce', 'garniture', etc.
  sort_order INTEGER DEFAULT 0,
  is_optional BOOLEAN DEFAULT FALSE,
  is_for_garnish BOOLEAN DEFAULT FALSE,
  
  -- Intelligence Myko pour substitutions
  allow_auto_substitution BOOLEAN DEFAULT TRUE,
  substitution_priority INTEGER DEFAULT 5 CHECK (substitution_priority BETWEEN 1 AND 10), -- 1=critique, 10=flexible
  min_quality_score INTEGER DEFAULT 1, -- qualité minimum acceptable
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, product_type, product_id, ingredient_group)
);

-- ================================================================================================
-- 7. ÉTAPES DE PRÉPARATION
-- ================================================================================================

-- Étapes de préparation des recettes
CREATE TABLE IF NOT EXISTS recipe_steps (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  step_number INTEGER NOT NULL CHECK (step_number > 0),
  title VARCHAR(200),
  instruction TEXT NOT NULL,
  
  -- Technique et conditions
  primary_technique_id INTEGER REFERENCES cooking_techniques(id),
  duration_min INTEGER DEFAULT 0,
  temperature INTEGER, -- température en °C
  
  -- Équipement
  required_equipment TEXT[], -- équipement obligatoire
  optional_equipment TEXT[], -- équipement recommandé
  
  -- Adaptations intelligentes
  substitution_adaptations JSONB, -- adaptations si substitutions appliquées
  technique_alternatives TEXT, -- alternatives si équipement manquant
  
  -- Aide multimédia
  image_url TEXT,
  video_url TEXT,
  
  -- Conseils
  chef_tip TEXT,
  common_mistakes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, step_number)
);

-- ================================================================================================
-- 8. ÉQUIPEMENT ET TAGS
-- ================================================================================================

-- Équipement requis par recette
CREATE TABLE IF NOT EXISTS recipe_equipment (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  
  is_essential BOOLEAN DEFAULT TRUE, -- obligatoire vs recommandé
  usage_note VARCHAR(200),
  alternative_methods TEXT, -- méthodes alternatives
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, equipment_id)
);

-- Tags pour recherche et classification
CREATE TABLE IF NOT EXISTS recipe_tags (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  tag VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'technique', 'saveur', 'occasion', 'inventory_based'
  auto_generated BOOLEAN DEFAULT FALSE, -- tag automatique vs manuel
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, tag)
);

-- ================================================================================================
-- 9. PLANNING DES REPAS
-- ================================================================================================

-- Planning hebdomadaire connecté à l'inventory
CREATE TABLE IF NOT EXISTS meal_planning (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Planification temporelle
  planned_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('petit-dejeuner', 'dejeuner', 'diner', 'collation')),
  meal_component VARCHAR(20) NOT NULL CHECK (meal_component IN ('entree', 'principal', 'dessert', 'boisson')),
  
  -- Recette planifiée
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  planned_servings INTEGER,
  
  -- Intelligence Myko appliquée
  applied_substitutions JSONB, -- substitutions automatiques appliquées
  inventory_snapshot JSONB, -- état de l'inventory au moment du planning
  
  -- Suivi d'exécution
  status VARCHAR(20) DEFAULT 'planifie' CHECK (status IN ('planifie', 'en_cours', 'termine', 'annule', 'reporte')),
  actual_servings INTEGER,
  
  -- Évaluation post-repas
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
  preparation_time_actual INTEGER,
  difficulty_felt INTEGER CHECK (difficulty_felt BETWEEN 1 AND 5),
  
  -- Notes et retours
  notes TEXT,
  modifications_made TEXT,
  substitutions_feedback TEXT, -- retour sur les substitutions
  
  -- Gestion des restes (connectée à inventory_lots)
  leftovers_quantity DECIMAL(5,2),
  leftovers_inventory_lot_id UUID, -- nouveau lot créé dans inventory_lots
  leftovers_used_date DATE,
  leftovers_recipe_id UUID REFERENCES recipes(id), -- recette pour utiliser les restes
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, planned_date, meal_type, meal_component)
);

-- ================================================================================================
-- 10. INDEX POUR PERFORMANCES
-- ================================================================================================

-- Index pour les recettes
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine_type_id);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty_level_id);
CREATE INDEX IF NOT EXISTS idx_recipes_dietary ON recipes(is_vegetarian, is_vegan, is_gluten_free, is_dairy_free);
CREATE INDEX IF NOT EXISTS idx_recipes_seasons ON recipes(season_spring, season_summer, season_autumn, season_winter);
CREATE INDEX IF NOT EXISTS idx_recipes_meals ON recipes(meal_breakfast, meal_lunch, meal_dinner, meal_snack);
CREATE INDEX IF NOT EXISTS idx_recipes_times ON recipes(prep_min, cook_min);
CREATE INDEX IF NOT EXISTS idx_recipes_myko_score ON recipes(myko_score DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_inventory_score ON recipes(inventory_compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active) WHERE is_active = true;

-- Index pour les ingrédients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_product ON recipe_ingredients(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_substitutable ON recipe_ingredients(allow_auto_substitution) WHERE allow_auto_substitution = true;
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_group ON recipe_ingredients(recipe_id, ingredient_group);

-- Index pour les substitutions
CREATE INDEX IF NOT EXISTS idx_substitutions_original ON smart_substitutions(original_product_type, original_product_id);
CREATE INDEX IF NOT EXISTS idx_substitutions_substitute ON smart_substitutions(substitute_product_type, substitute_product_id);
CREATE INDEX IF NOT EXISTS idx_substitutions_score ON smart_substitutions(compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_substitutions_context ON smart_substitutions(context);

-- Index pour le planning
CREATE INDEX IF NOT EXISTS idx_planning_user_date ON meal_planning(user_id, planned_date);
CREATE INDEX IF NOT EXISTS idx_planning_status ON meal_planning(status);
CREATE INDEX IF NOT EXISTS idx_planning_leftovers ON meal_planning(leftovers_quantity) WHERE leftovers_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_planning_recipe ON meal_planning(recipe_id);

-- Index pour recherche textuelle
CREATE INDEX IF NOT EXISTS idx_recipes_search_title ON recipes USING GIN(to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS idx_recipes_search_description ON recipes USING GIN(to_tsvector('french', description));

-- ================================================================================================
-- 11. TRIGGERS POUR UPDATED_AT
-- ================================================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_recipes_updated_at 
    BEFORE UPDATE ON recipes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_meal_planning_updated_at 
    BEFORE UPDATE ON meal_planning 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_recipe_categories_updated_at 
    BEFORE UPDATE ON recipe_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================================================
-- 12. POLITIQUES RLS (ROW LEVEL SECURITY)
-- ================================================================================================

-- Activer RLS sur les tables sensibles
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_planning ENABLE ROW LEVEL SECURITY;

-- Politique pour les recettes : les utilisateurs peuvent voir toutes les recettes publiques + leurs propres recettes
CREATE POLICY "recipes_select_policy" ON recipes
    FOR SELECT USING (
        user_id IS NULL OR -- recettes publiques
        user_id = auth.uid() OR -- ses propres recettes
        is_active = true -- recettes actives seulement
    );

-- Politique pour les recettes : les utilisateurs peuvent modifier leurs propres recettes
CREATE POLICY "recipes_modify_policy" ON recipes
    FOR ALL USING (user_id = auth.uid());

-- Politique pour le planning : chaque utilisateur voit son propre planning
CREATE POLICY "meal_planning_policy" ON meal_planning
    FOR ALL USING (user_id = auth.uid());

-- ================================================================================================
-- MESSAGE DE SUCCÈS
-- ================================================================================================

SELECT 
    '✅ Base de données Myko créée avec succès!' as status,
    'Tables principales créées et optimisées' as message,
    'Prêt pour les données d''exemple et fonctions avancées' as next_step;