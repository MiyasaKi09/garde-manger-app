-- ================================================================================================
-- BASE DE DONNÉES MYKO - INTÉGRÉE AVEC SYSTÈME INVENTORY EXISTANT 
-- ================================================================================================
-- Version adaptée pour s'intégrer avec le garde-manger Myko :
-- • canonical_foods (base canonique)
-- • cultivars (variétés spécifiques)  
-- • archetypes (groupes génériques)
-- • products custom (produits personnalisés)
-- • inventory_lots (stocks du garde-manger)
-- ================================================================================================

-- Nettoyage préalable (optionnel - à décommenter si besoin de reset complet)
/*
DROP TABLE IF EXISTS meal_planning CASCADE;
DROP TABLE IF EXISTS recipe_nutrition_details CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipe_steps CASCADE;
DROP TABLE IF EXISTS recipe_equipment CASCADE;
DROP TABLE IF EXISTS recipe_tags CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS inventory_substitutions CASCADE;
DROP TABLE IF EXISTS nutritional_profiles CASCADE;
DROP TABLE IF EXISTS seasonal_availability CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS recipe_categories CASCADE;
DROP TABLE IF EXISTS cuisine_types CASCADE;
DROP TABLE IF EXISTS difficulty_levels CASCADE;
DROP TABLE IF EXISTS dietary_types CASCADE;
*/

-- ================================================================================================
-- 1. TABLES DE RÉFÉRENCE (MASTER DATA)
-- ================================================================================================

-- Catégories de recettes
CREATE TABLE IF NOT EXISTS recipe_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  meal_compatibility JSONB DEFAULT '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Types de cuisine
CREATE TABLE IF NOT EXISTS cuisine_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  flag VARCHAR(10),
  region VARCHAR(100),
  typical_ingredients TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Niveaux de difficulté
CREATE TABLE IF NOT EXISTS difficulty_levels (
  id SERIAL PRIMARY KEY,
  level VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  min_prep_time INTEGER, -- temps minimum en minutes
  max_prep_time INTEGER, -- temps maximum en minutes
  techniques_required TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Types de régimes alimentaires
CREATE TABLE IF NOT EXISTS dietary_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  restrictions TEXT[],
  color VARCHAR(7), -- code couleur hex
  icon VARCHAR(20),
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
-- 2. INTÉGRATION AVEC LE SYSTÈME INVENTORY MYKO EXISTANT
-- ================================================================================================

-- Substitutions intelligentes basées sur l'inventaire disponible
-- CETTE TABLE REMPLACE LA TABLE ingredients - On utilise directement l'inventory !
CREATE TABLE IF NOT EXISTS inventory_substitutions (
  id SERIAL PRIMARY KEY,
  
  -- Ingrédient original (référence flexible vers canonical/cultivar/archetype)
  original_product_type VARCHAR(20) NOT NULL CHECK (original_product_type IN ('canonical', 'cultivar', 'archetype', 'custom')),
  original_product_id BIGINT, -- Compatible avec les tables existantes
  
  -- Ingrédient de substitution
  substitute_product_type VARCHAR(20) NOT NULL CHECK (substitute_product_type IN ('canonical', 'cultivar', 'archetype', 'custom')),
  substitute_product_id BIGINT,
  
  -- Paramètres de substitution
  ratio DECIMAL(4,2) DEFAULT 1.0, -- ratio de substitution (ex: 1.2 = 20% de plus)
  context VARCHAR(100), -- 'baking', 'sauce', 'general', 'frying', etc.
  notes TEXT,
  
  -- Score de compatibilité (pour l'intelligence Myko)
  compatibility_score INTEGER DEFAULT 5 CHECK (compatibility_score BETWEEN 1 AND 10),
  nutrition_impact DECIMAL(3,2) DEFAULT 1.0, -- impact nutritionnel (0.5 = -50%, 1.5 = +50%)
  
  -- Contraintes temporelles et saisonnières
  season_restrictions TEXT[], -- ['winter', 'summer'] si saisonnier
  technique_notes TEXT, -- adaptations de technique nécessaires
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(original_product_type, original_product_id, substitute_product_type, substitute_product_id, context)
);

-- Enrichissement nutritionnel des produits du garde-manger
-- Cette table complète les données existantes avec les infos nutritionnelles précises
CREATE TABLE IF NOT EXISTS inventory_nutrition_enrichment (
  id SERIAL PRIMARY KEY,
  
  -- Référence vers le produit (même système que inventory)
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('canonical', 'cultivar', 'archetype', 'custom')),
  product_id BIGINT,
  
  -- Informations nutritionnelles de base (pour 100g)
  calories_per_100g DECIMAL(6,2),
  proteins_per_100g DECIMAL(5,2),
  carbs_per_100g DECIMAL(5,2),
  fats_per_100g DECIMAL(5,2),
  fiber_per_100g DECIMAL(5,2),
  
  -- Micronutriments clés pour le score Myko
  vitamin_c_per_100g DECIMAL(5,2),
  iron_per_100g DECIMAL(5,2),
  calcium_per_100g DECIMAL(5,2),
  potassium_per_100g DECIMAL(6,2),
  
  -- Métadonnées Myko
  common_units TEXT[] DEFAULT ARRAY['g', 'ml', 'pièce'], -- unités courantes
  average_piece_weight DECIMAL(6,2), -- poids moyen d'une pièce en grammes
  density DECIMAL(5,3) DEFAULT 1.0, -- pour conversion ml/g
  
  -- Compatibilités alimentaires
  dietary_compatible TEXT[], -- ['vegetarian', 'vegan', 'gluten_free', etc.]
  allergens TEXT[], -- ['gluten', 'dairy', 'nuts', etc.]
  
  -- Durée de conservation et stockage
  storage_days_pantry INTEGER,
  storage_days_fridge INTEGER,
  storage_days_freezer INTEGER,
  optimal_storage VARCHAR(20) DEFAULT 'pantry', -- 'pantry', 'fridge', 'freezer'
  
  -- Saisonnalité et prix (pour le score Myko)
  seasonality JSONB DEFAULT '{"spring": true, "summer": true, "autumn": true, "winter": true}'::jsonb,
  price_per_kg DECIMAL(6,2), -- prix indicatif par kg
  carbon_footprint DECIMAL(5,2), -- empreinte carbone par kg
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(product_type, product_id)
);

-- Disponibilité saisonnière détaillée (basée sur l'inventory)
CREATE TABLE IF NOT EXISTS seasonal_availability (
  id SERIAL PRIMARY KEY,
  
  -- Référence produit
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('canonical', 'cultivar', 'archetype', 'custom')),
  product_id BIGINT,
  
  -- Saisonnalité par mois
  month INTEGER CHECK (month BETWEEN 1 AND 12),
  availability_score INTEGER CHECK (availability_score BETWEEN 0 AND 10), -- 10 = pleine saison
  price_factor DECIMAL(3,2) DEFAULT 1.0, -- multiplicateur de prix (1.0 = prix normal)
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 10),
  
  -- Métadonnées régionales
  region VARCHAR(100) DEFAULT 'France',
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(product_type, product_id, month, region)
);

-- Profils nutritionnels cibles (pour équilibrage automatique)
CREATE TABLE IF NOT EXISTS nutritional_profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- Répartition macro (en pourcentage)
  target_protein_percent DECIMAL(4,1),
  target_carbs_percent DECIMAL(4,1),
  target_fats_percent DECIMAL(4,1),
  
  -- Calories par repas
  calories_breakfast DECIMAL(6,2),
  calories_lunch DECIMAL(6,2),
  calories_dinner DECIMAL(6,2),
  
  -- Règles spécifiques Myko
  rules JSONB, -- règles nutritionnelles avancées
  myko_priorities JSONB, -- priorités spécifiques Myko (anti-gaspillage, etc.)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================================
-- 3. RECETTES CONNECTÉES À L'INVENTORY
-- ================================================================================================

-- Table principale des recettes
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations de base
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL,
  description TEXT,
  short_description TEXT,
  
  -- Classification
  category_id INTEGER REFERENCES recipe_categories(id),
  cuisine_type_id INTEGER REFERENCES cuisine_types(id),
  difficulty_level_id INTEGER REFERENCES difficulty_levels(id),
  
  -- Portions et temps
  servings INTEGER DEFAULT 4 CHECK (servings > 0),
  prep_min INTEGER DEFAULT 0 CHECK (prep_min >= 0),
  cook_min INTEGER DEFAULT 0 CHECK (cook_min >= 0),
  rest_min INTEGER DEFAULT 0 CHECK (rest_min >= 0), -- temps de repos/refroidissement
  
  -- Nutrition calculée automatiquement (par portion)
  calories_per_serving DECIMAL(6,2),
  proteins_per_serving DECIMAL(5,2),
  carbs_per_serving DECIMAL(5,2),
  fats_per_serving DECIMAL(5,2),
  fiber_per_serving DECIMAL(5,2),
  
  -- Micronutriments par portion
  vitamin_c_per_serving DECIMAL(5,2),
  iron_per_serving DECIMAL(5,2),
  calcium_per_serving DECIMAL(5,2),
  
  -- Coûts et budget (calculés depuis l'inventory)
  estimated_cost_per_serving DECIMAL(6,2),
  budget_category VARCHAR(20) CHECK (budget_category IN ('économique', 'moyen', 'cher')),
  
  -- Caractéristiques temporelles
  season_spring BOOLEAN DEFAULT TRUE,
  season_summer BOOLEAN DEFAULT TRUE,
  season_autumn BOOLEAN DEFAULT TRUE,
  season_winter BOOLEAN DEFAULT TRUE,
  
  -- Compatibilité repas
  meal_breakfast BOOLEAN DEFAULT FALSE,
  meal_lunch BOOLEAN DEFAULT TRUE,
  meal_dinner BOOLEAN DEFAULT TRUE,
  meal_snack BOOLEAN DEFAULT FALSE,
  
  -- Régimes alimentaires (calculés automatiquement depuis les ingrédients)
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
  
  -- Score Myko (calculé automatiquement - intègre l'inventory disponible)
  myko_score INTEGER DEFAULT 0 CHECK (myko_score BETWEEN 0 AND 100),
  myko_factors JSONB, -- détail des facteurs du score
  inventory_compatibility_score INTEGER DEFAULT 0, -- score basé sur l'inventory disponible
  
  -- Métadonnées
  image_url TEXT,
  video_url TEXT,
  source_name VARCHAR(200),
  author_name VARCHAR(200),
  prep_complexity INTEGER DEFAULT 3 CHECK (prep_complexity BETWEEN 1 AND 5), -- complexité préparation
  
  -- Statistiques d'usage
  times_cooked INTEGER DEFAULT 0,
  avg_rating DECIMAL(2,1) DEFAULT 0,
  last_cooked_at TIMESTAMP WITH TIME ZONE,
  
  -- Système
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index et contraintes
  UNIQUE(slug),
  CONSTRAINT valid_total_time CHECK (prep_min + cook_min + rest_min > 0)
);

-- Ingrédients par recette (CONNECTÉS À L'INVENTORY EXISTANT !)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- RÉFÉRENCE DIRECTE VERS LE SYSTÈME INVENTORY MYKO EXISTANT
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('canonical', 'cultivar', 'archetype', 'custom')),
  product_id BIGINT, -- Compatible avec canonical_foods.id, cultivars.id, etc.
  
  -- Quantités (mêmes unités que l'inventory)
  quantity DECIMAL(8,3) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(20) NOT NULL, -- g, ml, pièce, cuillère, etc.
  
  -- Contexte et préparation
  preparation_note VARCHAR(200), -- 'haché', 'en dés', 'râpé', etc.
  is_optional BOOLEAN DEFAULT FALSE,
  is_for_garnish BOOLEAN DEFAULT FALSE,
  
  -- Organisation dans la recette
  ingredient_group VARCHAR(100), -- 'base', 'sauce', 'garniture', etc.
  sort_order INTEGER DEFAULT 0,
  
  -- Intelligence Myko : substitutions automatiques possibles
  allow_substitutions BOOLEAN DEFAULT TRUE,
  substitution_notes TEXT,
  critical_ingredient BOOLEAN DEFAULT FALSE, -- si FALSE, peut être substitué automatiquement
  
  -- Gestion des stocks (connexion avec inventory_lots)
  min_freshness_days INTEGER, -- fraîcheur minimum requise
  preferred_storage VARCHAR(20), -- 'pantry', 'fridge', 'freezer'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, product_type, product_id, ingredient_group)
);

-- Étapes de préparation (avec intelligence inventory)
CREATE TABLE IF NOT EXISTS recipe_steps (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  step_number INTEGER NOT NULL CHECK (step_number > 0),
  title VARCHAR(200),
  instruction TEXT NOT NULL,
  
  -- Temps et conditions
  duration_min INTEGER DEFAULT 0,
  temperature INTEGER, -- température en °C
  technique VARCHAR(100), -- 'sauter', 'mijoter', 'fouetter', etc.
  
  -- Équipement requis
  equipment_needed TEXT[],
  
  -- Intelligence Myko : adaptations selon l'inventory
  inventory_adaptations JSONB, -- adaptations selon les produits disponibles
  substitution_instructions TEXT, -- instructions si substitutions nécessaires
  
  -- Aide visuelle
  image_url TEXT,
  video_url TEXT,
  
  -- Conseils
  chef_tip TEXT,
  common_mistakes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, step_number)
);

-- Équipement requis par recette
CREATE TABLE IF NOT EXISTS recipe_equipment (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  
  is_essential BOOLEAN DEFAULT TRUE, -- obligatoire vs recommandé
  usage_note VARCHAR(200), -- comment l'équipement est utilisé
  alternative_methods TEXT, -- méthodes alternatives si équipement manquant
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, equipment_id)
);

-- Tags et mots-clés pour recherche (enrichis avec inventory)
CREATE TABLE IF NOT EXISTS recipe_tags (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  tag VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'technique', 'saveur', 'occasion', 'origine', 'inventory_based', etc.
  
  -- Intelligence Myko : tags automatiques basés sur l'inventory
  auto_generated BOOLEAN DEFAULT FALSE,
  inventory_based BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, tag)
);

-- Détails nutritionnels avancés (calculés depuis l'inventory enrichment)
CREATE TABLE IF NOT EXISTS recipe_nutrition_details (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- Vitamines (par portion) - calculées automatiquement
  vitamin_a DECIMAL(6,2),
  vitamin_b1 DECIMAL(6,2),
  vitamin_b2 DECIMAL(6,2),
  vitamin_b3 DECIMAL(6,2),
  vitamin_b6 DECIMAL(6,2),
  vitamin_b12 DECIMAL(6,2),
  folate DECIMAL(6,2),
  vitamin_d DECIMAL(6,2),
  vitamin_e DECIMAL(6,2),
  vitamin_k DECIMAL(6,2),
  
  -- Minéraux (par portion) - calculés automatiquement
  potassium DECIMAL(6,2),
  sodium DECIMAL(6,2),
  magnesium DECIMAL(6,2),
  phosphorus DECIMAL(6,2),
  zinc DECIMAL(6,2),
  selenium DECIMAL(6,2),
  
  -- Autres nutriments
  omega_3 DECIMAL(6,2),
  omega_6 DECIMAL(6,2),
  cholesterol DECIMAL(6,2),
  
  -- Métadonnées de calcul
  calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_inventory_ids INTEGER[], -- IDs des produits utilisés pour le calcul
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id)
);

-- ================================================================================================
-- 4. PLANNING DES REPAS CONNECTÉ À L'INVENTORY
-- ================================================================================================

-- Planning hebdomadaire des repas (avec gestion inventory intelligente)
CREATE TABLE IF NOT EXISTS meal_planning (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timing
  planned_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('petit-dejeuner', 'dejeuner', 'diner', 'collation')),
  meal_component VARCHAR(20) NOT NULL CHECK (meal_component IN ('entree', 'principal', 'dessert', 'boisson')),
  
  -- Recette planifiée
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  planned_servings INTEGER DEFAULT NULL, -- peut différer des portions de base
  
  -- Intelligence Myko : Substitutions automatiques réalisées
  substitutions_applied JSONB, -- substitutions appliquées automatiquement
  inventory_snapshot JSONB, -- snapshot de l'inventory au moment de la planification
  
  -- État et suivi
  status VARCHAR(20) DEFAULT 'planifie' CHECK (status IN ('planifie', 'en_cours', 'termine', 'annule', 'reporte')),
  actual_servings INTEGER, -- portions réellement préparées
  
  -- Évaluation post-repas
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
  preparation_time_actual INTEGER, -- temps réel de préparation
  difficulty_felt INTEGER CHECK (difficulty_felt BETWEEN 1 AND 5),
  
  -- Notes et adaptations
  notes TEXT,
  modifications_made TEXT, -- changements apportés à la recette
  inventory_issues TEXT, -- problèmes d'inventory rencontrés
  
  -- Gestion des restes (CONNECTÉE À L'INVENTORY !)
  leftovers_quantity DECIMAL(5,2), -- quantité de restes en portions
  leftovers_added_to_inventory BOOLEAN DEFAULT FALSE, -- ajouté au garde-manger ?
  leftovers_inventory_lot_id UUID, -- référence vers inventory_lots si ajouté
  leftovers_used_date DATE, -- quand les restes ont été consommés
  leftovers_recipe_id UUID REFERENCES recipes(id), -- recette utilisée pour les restes
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, planned_date, meal_type, meal_component)
);

-- ================================================================================================
-- 5. INDEX ET OPTIMISATIONS
-- ================================================================================================

-- Index pour les recettes (recherche et filtrage)
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine_type_id);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty_level_id);
CREATE INDEX IF NOT EXISTS idx_recipes_dietary ON recipes(is_vegetarian, is_vegan, is_gluten_free);
CREATE INDEX IF NOT EXISTS idx_recipes_seasons ON recipes(season_spring, season_summer, season_autumn, season_winter);
CREATE INDEX IF NOT EXISTS idx_recipes_meals ON recipes(meal_breakfast, meal_lunch, meal_dinner, meal_snack);
CREATE INDEX IF NOT EXISTS idx_recipes_times ON recipes(prep_min, cook_min);
CREATE INDEX IF NOT EXISTS idx_recipes_myko_score ON recipes(myko_score DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_inventory_compatibility ON recipes(inventory_compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active);

-- Index pour les ingrédients connectés à l'inventory
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_product ON recipe_ingredients(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_substitutions ON recipe_ingredients(allow_substitutions) WHERE allow_substitutions = true;

-- Index pour les enrichissements nutritionnels
CREATE INDEX IF NOT EXISTS idx_inventory_nutrition_product ON inventory_nutrition_enrichment(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_nutrition_dietary ON inventory_nutrition_enrichment USING GIN(dietary_compatible);

-- Index pour les substitutions
CREATE INDEX IF NOT EXISTS idx_inventory_substitutions_original ON inventory_substitutions(original_product_type, original_product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_substitutions_substitute ON inventory_substitutions(substitute_product_type, substitute_product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_substitutions_compatibility ON inventory_substitutions(compatibility_score DESC);

-- Index pour la saisonnalité
CREATE INDEX IF NOT EXISTS idx_seasonal_availability_product ON seasonal_availability(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_availability_month ON seasonal_availability(month);

-- Index pour le planning
CREATE INDEX IF NOT EXISTS idx_meal_planning_user_date ON meal_planning(user_id, planned_date);
CREATE INDEX IF NOT EXISTS idx_meal_planning_status ON meal_planning(status);
CREATE INDEX IF NOT EXISTS idx_meal_planning_leftovers ON meal_planning(leftovers_quantity) WHERE leftovers_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_meal_planning_inventory_lot ON meal_planning(leftovers_inventory_lot_id) WHERE leftovers_inventory_lot_id IS NOT NULL;

-- Index pour les recherches textuelles
CREATE INDEX IF NOT EXISTS idx_recipes_title_search ON recipes USING GIN(to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS idx_recipes_description_search ON recipes USING GIN(to_tsvector('french', description));

-- ================================================================================================
-- 6. FONCTIONS INTELLIGENTES CONNECTÉES À L'INVENTORY
-- ================================================================================================

-- Fonction pour calculer automatiquement les valeurs nutritionnelles d'une recette
-- UTILISE L'INVENTORY NUTRITION ENRICHMENT !
CREATE OR REPLACE FUNCTION calculate_recipe_nutrition_from_inventory()
RETURNS TRIGGER AS $$
DECLARE
    total_calories DECIMAL(8,2) := 0;
    total_proteins DECIMAL(8,2) := 0;
    total_carbs DECIMAL(8,2) := 0;
    total_fats DECIMAL(8,2) := 0;
    total_fiber DECIMAL(8,2) := 0;
    total_vitamin_c DECIMAL(8,2) := 0;
    total_iron DECIMAL(8,2) := 0;
    total_calcium DECIMAL(8,2) := 0;
    ingredient_record RECORD;
    nutrition_record RECORD;
BEGIN
    -- Calculer la nutrition totale basée sur les ingrédients de l'inventory
    FOR ingredient_record IN 
        SELECT ri.quantity, ri.unit, ri.product_type, ri.product_id
        FROM recipe_ingredients ri
        WHERE ri.recipe_id = NEW.id
    LOOP
        -- Récupérer les données nutritionnelles depuis inventory_nutrition_enrichment
        SELECT * INTO nutrition_record
        FROM inventory_nutrition_enrichment ine
        WHERE ine.product_type = ingredient_record.product_type 
        AND ine.product_id = ingredient_record.product_id;
        
        IF nutrition_record IS NOT NULL THEN
            DECLARE
                quantity_in_grams DECIMAL(8,2);
            BEGIN
                -- Convertir la quantité en grammes selon l'unité
                IF ingredient_record.unit = 'g' THEN
                    quantity_in_grams := ingredient_record.quantity;
                ELSIF ingredient_record.unit = 'ml' THEN
                    quantity_in_grams := ingredient_record.quantity * COALESCE(nutrition_record.density, 1.0);
                ELSIF ingredient_record.unit = 'pièce' AND nutrition_record.average_piece_weight IS NOT NULL THEN
                    quantity_in_grams := ingredient_record.quantity * nutrition_record.average_piece_weight;
                ELSE
                    quantity_in_grams := ingredient_record.quantity; -- fallback
                END IF;
                
                -- Calculer la contribution nutritionnelle (pour 100g → pour quantity)
                total_calories := total_calories + (COALESCE(nutrition_record.calories_per_100g, 0) * quantity_in_grams / 100);
                total_proteins := total_proteins + (COALESCE(nutrition_record.proteins_per_100g, 0) * quantity_in_grams / 100);
                total_carbs := total_carbs + (COALESCE(nutrition_record.carbs_per_100g, 0) * quantity_in_grams / 100);
                total_fats := total_fats + (COALESCE(nutrition_record.fats_per_100g, 0) * quantity_in_grams / 100);
                total_fiber := total_fiber + (COALESCE(nutrition_record.fiber_per_100g, 0) * quantity_in_grams / 100);
                total_vitamin_c := total_vitamin_c + (COALESCE(nutrition_record.vitamin_c_per_100g, 0) * quantity_in_grams / 100);
                total_iron := total_iron + (COALESCE(nutrition_record.iron_per_100g, 0) * quantity_in_grams / 100);
                total_calcium := total_calcium + (COALESCE(nutrition_record.calcium_per_100g, 0) * quantity_in_grams / 100);
            END;
        END IF;
    END LOOP;
    
    -- Mettre à jour les valeurs par portion
    NEW.calories_per_serving := ROUND(total_calories / NEW.servings, 1);
    NEW.proteins_per_serving := ROUND(total_proteins / NEW.servings, 1);
    NEW.carbs_per_serving := ROUND(total_carbs / NEW.servings, 1);
    NEW.fats_per_serving := ROUND(total_fats / NEW.servings, 1);
    NEW.fiber_per_serving := ROUND(total_fiber / NEW.servings, 1);
    NEW.vitamin_c_per_serving := ROUND(total_vitamin_c / NEW.servings, 1);
    NEW.iron_per_serving := ROUND(total_iron / NEW.servings, 1);
    NEW.calcium_per_serving := ROUND(total_calcium / NEW.servings, 1);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour recalculer la nutrition automatiquement depuis l'inventory
CREATE TRIGGER trigger_calculate_nutrition_from_inventory
    BEFORE INSERT OR UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_recipe_nutrition_from_inventory();

-- Fonction pour calculer le score Myko AVEC INVENTORY INTELLIGENCE
CREATE OR REPLACE FUNCTION calculate_myko_score_with_inventory()
RETURNS TRIGGER AS $$
DECLARE
    score INTEGER := 0;
    factors JSONB := '{}'::jsonb;
    seasonal_bonus INTEGER := 0;
    nutrition_score INTEGER := 0;
    complexity_penalty INTEGER := 0;
    inventory_bonus INTEGER := 0;
    ingredient_record RECORD;
    available_count INTEGER := 0;
    total_ingredients INTEGER := 0;
BEGIN
    -- Score nutritionnel (30 points max)
    IF NEW.calories_per_serving BETWEEN 200 AND 600 THEN
        nutrition_score := nutrition_score + 10;
        factors := factors || '{"calories_balanced": true}'::jsonb;
    END IF;
    
    IF NEW.proteins_per_serving >= 10 THEN
        nutrition_score := nutrition_score + 8;
        factors := factors || '{"good_protein": true}'::jsonb;
    END IF;
    
    IF NEW.fiber_per_serving >= 3 THEN
        nutrition_score := nutrition_score + 7;
        factors := factors || '{"high_fiber": true}'::jsonb;
    END IF;
    
    IF NEW.vitamin_c_per_serving >= 10 THEN
        nutrition_score := nutrition_score + 5;
        factors := factors || '{"vitamin_c_rich": true}'::jsonb;
    END IF;
    
    -- Score saisonnier (15 points max)
    CASE EXTRACT(MONTH FROM NOW())
        WHEN 3,4,5 THEN -- Printemps
            IF NEW.season_spring THEN seasonal_bonus := 15; END IF;
        WHEN 6,7,8 THEN -- Été
            IF NEW.season_summer THEN seasonal_bonus := 15; END IF;
        WHEN 9,10,11 THEN -- Automne
            IF NEW.season_autumn THEN seasonal_bonus := 15; END IF;
        WHEN 12,1,2 THEN -- Hiver
            IF NEW.season_winter THEN seasonal_bonus := 15; END IF;
    END CASE;
    
    -- NOUVEAU : Score d'availability inventory (25 points max - LE PLUS IMPORTANT !)
    SELECT COUNT(*) INTO total_ingredients
    FROM recipe_ingredients ri
    WHERE ri.recipe_id = NEW.id;
    
    IF total_ingredients > 0 THEN
        -- Compter combien d'ingrédients sont disponibles dans l'inventory
        FOR ingredient_record IN 
            SELECT ri.product_type, ri.product_id, ri.quantity, ri.unit
            FROM recipe_ingredients ri
            WHERE ri.recipe_id = NEW.id
        LOOP
            -- Vérifier si l'ingrédient est disponible dans l'inventory
            IF EXISTS (
                SELECT 1 FROM inventory_lots il
                WHERE il.product_type = ingredient_record.product_type
                AND il.product_id = ingredient_record.product_id
                AND il.qty_remaining > 0
                AND (il.expiration_date IS NULL OR il.expiration_date > CURRENT_DATE)
            ) THEN
                available_count := available_count + 1;
            END IF;
        END LOOP;
        
        -- Calculer le bonus inventory (25 points max)
        inventory_bonus := ROUND((available_count::DECIMAL / total_ingredients) * 25);
        
        IF available_count = total_ingredients THEN
            factors := factors || '{"all_ingredients_available": true}'::jsonb;
        ELSIF available_count >= (total_ingredients * 0.8) THEN
            factors := factors || '{"most_ingredients_available": true}'::jsonb;
        END IF;
        
        -- Stocker le score de compatibilité inventory
        NEW.inventory_compatibility_score := ROUND((available_count::DECIMAL / total_ingredients) * 100);
    END IF;
    
    -- Pénalité de complexité (0-15 points de malus)
    IF NEW.prep_min + NEW.cook_min > 120 THEN
        complexity_penalty := 15;
        factors := factors || '{"too_long": true}'::jsonb;
    ELSIF NEW.prep_min + NEW.cook_min > 60 THEN
        complexity_penalty := 8;
        factors := factors || '{"long_prep": true}'::jsonb;
    END IF;
    
    -- Bonus régimes spéciaux (15 points max)
    IF NEW.is_vegetarian THEN
        score := score + 3;
        factors := factors || '{"vegetarian": true}'::jsonb;
    END IF;
    
    IF NEW.is_vegan THEN
        score := score + 7;
        factors := factors || '{"vegan": true}'::jsonb;
    END IF;
    
    IF NEW.is_gluten_free THEN
        score := score + 5;
        factors := factors || '{"gluten_free": true}'::jsonb;
    END IF;
    
    -- Calcul final (max 100 points)
    score := nutrition_score + seasonal_bonus + inventory_bonus + score - complexity_penalty;
    score := GREATEST(0, LEAST(100, score)); -- Clamp entre 0 et 100
    
    -- Ajouter les scores détaillés aux factors
    factors := factors || json_build_object(
        'nutrition_score', nutrition_score,
        'seasonal_bonus', seasonal_bonus,
        'inventory_bonus', inventory_bonus,
        'complexity_penalty', complexity_penalty,
        'available_ingredients', available_count,
        'total_ingredients', total_ingredients
    )::jsonb;
    
    NEW.myko_score := score;
    NEW.myko_factors := factors;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer le score Myko avec inventory intelligence
CREATE TRIGGER trigger_calculate_myko_score_with_inventory
    BEFORE INSERT OR UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_myko_score_with_inventory();

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER trigger_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_inventory_nutrition_updated_at BEFORE UPDATE ON inventory_nutrition_enrichment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_meal_planning_updated_at BEFORE UPDATE ON meal_planning FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================================================
-- 7. VUES INTELLIGENTES CONNECTÉES À L'INVENTORY
-- ================================================================================================

-- Vue pour les recettes avec informations complètes ET inventory
CREATE OR REPLACE VIEW recipes_complete AS
SELECT 
    r.*,
    rc.name as category_name,
    rc.icon as category_icon,
    ct.name as cuisine_name,
    ct.flag as cuisine_flag,
    dl.name as difficulty_name,
    dl.level as difficulty_level,
    (r.prep_min + r.cook_min + r.rest_min) as total_time_min,
    
    -- Compteurs
    (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = r.id) as ingredients_count,
    (SELECT COUNT(*) FROM recipe_steps WHERE recipe_id = r.id) as steps_count,
    
    -- Tags
    (SELECT ARRAY_AGG(tag) FROM recipe_tags WHERE recipe_id = r.id) as tags,
    
    -- Saisonnalité actuelle
    CASE 
        WHEN EXTRACT(MONTH FROM NOW()) IN (3,4,5) THEN r.season_spring
        WHEN EXTRACT(MONTH FROM NOW()) IN (6,7,8) THEN r.season_summer  
        WHEN EXTRACT(MONTH FROM NOW()) IN (9,10,11) THEN r.season_autumn
        ELSE r.season_winter
    END as is_seasonal_now,
    
    -- NOUVEAU : Informations inventory
    (
        SELECT COUNT(*)
        FROM recipe_ingredients ri
        JOIN inventory_lots il ON (
            ri.product_type = il.product_type 
            AND ri.product_id = il.product_id 
            AND il.qty_remaining > 0
            AND (il.expiration_date IS NULL OR il.expiration_date > CURRENT_DATE)
        )
        WHERE ri.recipe_id = r.id
    ) as available_ingredients_count,
    
    -- Pourcentage d'ingrédients disponibles
    CASE 
        WHEN (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = r.id) = 0 THEN 0
        ELSE ROUND(
            (
                SELECT COUNT(*)::DECIMAL
                FROM recipe_ingredients ri
                JOIN inventory_lots il ON (
                    ri.product_type = il.product_type 
                    AND ri.product_id = il.product_id 
                    AND il.qty_remaining > 0
                    AND (il.expiration_date IS NULL OR il.expiration_date > CURRENT_DATE)
                )
                WHERE ri.recipe_id = r.id
            ) * 100 / (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = r.id)
        )
    END as inventory_availability_percent

FROM recipes r
LEFT JOIN recipe_categories rc ON r.category_id = rc.id
LEFT JOIN cuisine_types ct ON r.cuisine_type_id = ct.id  
LEFT JOIN difficulty_levels dl ON r.difficulty_level_id = dl.id
WHERE r.is_active = true;

-- Vue pour les ingrédients avec inventory disponible
CREATE OR REPLACE VIEW recipe_ingredients_with_inventory AS
SELECT 
    ri.*,
    -- Informations sur le produit (depuis les tables existantes)
    CASE 
        WHEN ri.product_type = 'canonical' THEN (SELECT canonical_name FROM canonical_foods WHERE id = ri.product_id)
        WHEN ri.product_type = 'cultivar' THEN (SELECT cultivar_name FROM cultivars WHERE id = ri.product_id)
        WHEN ri.product_type = 'archetype' THEN (SELECT name FROM archetypes WHERE id = ri.product_id)
        ELSE 'Produit personnalisé'
    END as product_name,
    
    -- Enrichissement nutritionnel disponible
    ine.calories_per_100g,
    ine.proteins_per_100g,
    ine.carbs_per_100g,
    ine.dietary_compatible,
    ine.allergens,
    
    -- Inventory disponible
    COALESCE(
        (SELECT SUM(il.qty_remaining) 
         FROM inventory_lots il 
         WHERE il.product_type = ri.product_type 
         AND il.product_id = ri.product_id 
         AND il.qty_remaining > 0
         AND (il.expiration_date IS NULL OR il.expiration_date > CURRENT_DATE)
        ), 0
    ) as available_quantity,
    
    -- Statut de disponibilité
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM inventory_lots il 
            WHERE il.product_type = ri.product_type 
            AND il.product_id = ri.product_id 
            AND il.qty_remaining >= ri.quantity
            AND (il.expiration_date IS NULL OR il.expiration_date > CURRENT_DATE)
        ) THEN 'sufficient'
        WHEN EXISTS (
            SELECT 1 FROM inventory_lots il 
            WHERE il.product_type = ri.product_type 
            AND il.product_id = ri.product_id 
            AND il.qty_remaining > 0
            AND (il.expiration_date IS NULL OR il.expiration_date > CURRENT_DATE)
        ) THEN 'partial'
        ELSE 'unavailable'
    END as inventory_status,
    
    -- Date d'expiration la plus proche
    (SELECT MIN(il.expiration_date) 
     FROM inventory_lots il 
     WHERE il.product_type = ri.product_type 
     AND il.product_id = ri.product_id 
     AND il.qty_remaining > 0
    ) as nearest_expiration

FROM recipe_ingredients ri
LEFT JOIN inventory_nutrition_enrichment ine ON (
    ri.product_type = ine.product_type 
    AND ri.product_id = ine.product_id
);

-- Vue pour le planning avec détails inventory
CREATE OR REPLACE VIEW meal_planning_complete AS
SELECT 
    mp.*,
    r.title as recipe_title,
    r.prep_min,
    r.cook_min,
    r.myko_score,
    r.inventory_compatibility_score,
    r.calories_per_serving,
    rc.name as category_name,
    rc.icon as category_icon,
    
    -- Statut des restes
    CASE 
        WHEN mp.leftovers_quantity > 0 AND mp.leftovers_used_date IS NULL THEN 'available'
        WHEN mp.leftovers_quantity > 0 AND mp.leftovers_used_date IS NOT NULL THEN 'used'
        ELSE 'none'
    END as leftovers_status,
    
    -- Référence vers l'inventory lot des restes
    il.storage_method as leftovers_storage,
    il.expiration_date as leftovers_expiration

FROM meal_planning mp
LEFT JOIN recipes r ON mp.recipe_id = r.id
LEFT JOIN recipe_categories rc ON r.category_id = rc.id
LEFT JOIN inventory_lots il ON mp.leftovers_inventory_lot_id = il.id;

-- ================================================================================================
-- 8. DONNÉES DE BASE ESSENTIELLES
-- ================================================================================================

-- Catégories de recettes
INSERT INTO recipe_categories (name, slug, description, icon, meal_compatibility) VALUES
('Entrées', 'entrees', 'Entrées et hors-d''œuvres', '🥗', '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}'),
('Soupes', 'soupes', 'Soupes et veloutés', '🍲', '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}'),
('Plats principaux', 'plats-principaux', 'Plats de résistance', '🍽️', '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}'),
('Accompagnements', 'accompagnements', 'Garnitures et accompagnements', '🥔', '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}'),
('Desserts', 'desserts', 'Desserts et douceurs', '🍰', '{"breakfast": false, "lunch": true, "dinner": true, "snack": true}'),
('Petit-déjeuner', 'petit-dejeuner', 'Petit-déjeuners et brunchs', '🥞', '{"breakfast": true, "lunch": false, "dinner": false, "snack": false}'),
('Collations', 'collations', 'Encas et collations', '🥨', '{"breakfast": false, "lunch": false, "dinner": false, "snack": true}'),
('Boissons', 'boissons', 'Boissons chaudes et froides', '🥤', '{"breakfast": true, "lunch": true, "dinner": true, "snack": true}'),
('Conserves', 'conserves', 'Confitures, pickles et conserves', '🫙', '{"breakfast": true, "lunch": false, "dinner": false, "snack": true}'),
('Anti-gaspi', 'anti-gaspi', 'Recettes pour utiliser les restes', '♻️', '{"breakfast": true, "lunch": true, "dinner": true, "snack": true}')
ON CONFLICT (slug) DO NOTHING;

-- Types de cuisine
INSERT INTO cuisine_types (name, slug, description, flag, region) VALUES
('Française', 'francaise', 'Cuisine traditionnelle française', '🇫🇷', 'France'),
('Méditerranéenne', 'mediterraneenne', 'Cuisine du bassin méditerranéen', '🌊', 'Méditerranée'),
('Italienne', 'italienne', 'Cuisine italienne authentique', '🇮🇹', 'Italie'),
('Asiatique', 'asiatique', 'Cuisines d''Asie', '🥢', 'Asie'),
('Indienne', 'indienne', 'Cuisine indienne épicée', '🇮🇳', 'Inde'),
('Mexicaine', 'mexicaine', 'Cuisine mexicaine traditionnelle', '🇲🇽', 'Mexique'),
('Japonaise', 'japonaise', 'Cuisine japonaise raffinée', '🇯🇵', 'Japon'),
('Libanaise', 'libanaise', 'Cuisine du Levant', '🇱🇧', 'Liban'),
('Marocaine', 'marocaine', 'Cuisine du Maghreb', '🇲🇦', 'Maroc'),
('Fusion', 'fusion', 'Cuisine créative moderne', '✨', 'International'),
('Myko', 'myko', 'Spécialités anti-gaspillage Myko', '🌿', 'Garde-manger')
ON CONFLICT (slug) DO NOTHING;

-- Niveaux de difficulté
INSERT INTO difficulty_levels (level, name, description, min_prep_time, max_prep_time, sort_order) VALUES
('très_facile', 'Très facile', 'Accessible aux débutants complets', 0, 15, 1),
('facile', 'Facile', 'Quelques techniques simples', 10, 30, 2),
('moyen', 'Moyen', 'Techniques intermédiaires requises', 20, 60, 3),
('difficile', 'Difficile', 'Techniques avancées nécessaires', 45, 120, 4),
('expert', 'Expert', 'Niveau chef professionnel', 60, 240, 5)
ON CONFLICT (level) DO NOTHING;

-- Types de régimes alimentaires
INSERT INTO dietary_types (name, slug, description, color, icon) VALUES
('Végétarien', 'vegetarien', 'Sans viande ni poisson', '#22c55e', '🌱'),
('Végétalien', 'vegetalien', 'Sans produits animaux', '#16a34a', '🌿'),
('Sans gluten', 'sans-gluten', 'Sans gluten ni blé', '#f59e0b', '🌾'),
('Sans lactose', 'sans-lactose', 'Sans produits laitiers', '#3b82f6', '🥛'),
('Cétogène', 'cetogene', 'Très faible en glucides', '#dc2626', '🥑'),
('Paléo', 'paleo', 'Régime paléolithique', '#92400e', '🥩'),
('Méditerranéen', 'mediterraneen', 'Régime méditerranéen', '#0ea5e9', '🫒'),
('Halal', 'halal', 'Conforme aux règles halal', '#059669', '☪️'),
('Casher', 'casher', 'Conforme aux règles casher', '#7c3aed', '✡️'),
('Anti-gaspi', 'anti-gaspi', 'Optimisé anti-gaspillage', '#22c55e', '♻️')
ON CONFLICT (slug) DO NOTHING;

-- Profils nutritionnels types avec priorités Myko
INSERT INTO nutritional_profiles (name, description, target_protein_percent, target_carbs_percent, target_fats_percent, calories_breakfast, calories_lunch, calories_dinner, myko_priorities) VALUES
('Équilibré Myko', 'Répartition équilibrée avec priorité anti-gaspillage', 20.0, 50.0, 30.0, 350, 500, 450, '{"anti_waste": 10, "seasonal": 8, "inventory_based": 9, "nutrition": 7}'::jsonb),
('Sportif Myko', 'Riche en protéines avec gestion inventory', 25.0, 45.0, 30.0, 400, 600, 500, '{"anti_waste": 8, "seasonal": 6, "inventory_based": 9, "nutrition": 10}'::jsonb),
('Minceur Myko', 'Contrôle calorique intelligent', 25.0, 40.0, 35.0, 250, 400, 350, '{"anti_waste": 9, "seasonal": 8, "inventory_based": 8, "nutrition": 9}'::jsonb),
('Famille Myko', 'Adapté aux familles avec enfants', 18.0, 55.0, 27.0, 300, 450, 400, '{"anti_waste": 10, "seasonal": 7, "inventory_based": 10, "nutrition": 6}'::jsonb),
('Étudiant Myko', 'Économique et rapide', 20.0, 50.0, 30.0, 300, 400, 350, '{"anti_waste": 10, "seasonal": 5, "inventory_based": 10, "nutrition": 5}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Message de succès
SELECT 'Base de données Myko CONNECTÉE À L''INVENTORY créée avec succès ! 🌿🔗' as status, 
       'Intelligence culinaire complète avec integration inventory 4 niveaux' as message,
       'Prêt pour la gestion anti-gaspillage avancée !' as next_step;