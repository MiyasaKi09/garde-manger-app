-- ================================================================================================
-- BASE DE DONNÉES MYKO - ARCHITECTURE COMPLÈTE POUR INTELLIGENCE CULINAIRE
-- ================================================================================================
-- Version finale rationalisée pour supporter :
-- • Gestion anti-gaspillage intelligente
-- • Planning nutritionnel avec règles diététiques  
-- • Courses optimisées
-- • Score Myko multicritères
-- • Saisonnalité et disponibilité
-- • Équilibrage automatique des repas
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
DROP TABLE IF EXISTS ingredient_substitutions CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
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
-- 2. INGRÉDIENTS ET NUTRITION
-- ================================================================================================

-- Ingrédients principaux (base canonique)
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  category VARCHAR(100), -- légume, fruit, protéine, féculent, etc.
  subcategory VARCHAR(100),
  
  -- Informations nutritionnelles de base (pour 100g)
  calories_per_100g DECIMAL(6,2),
  proteins_per_100g DECIMAL(5,2),
  carbs_per_100g DECIMAL(5,2),
  fats_per_100g DECIMAL(5,2),
  fiber_per_100g DECIMAL(5,2),
  
  -- Micronutriments clés
  vitamin_c_per_100g DECIMAL(5,2),
  iron_per_100g DECIMAL(5,2),
  calcium_per_100g DECIMAL(5,2),
  
  -- Caractéristiques Myko
  seasonality JSONB DEFAULT '{"spring": false, "summer": false, "autumn": false, "winter": false}'::jsonb,
  storage_days INTEGER, -- durée de conservation moyenne
  storage_conditions VARCHAR(100), -- 'fridge', 'pantry', 'freezer'
  
  -- Compatibilités
  dietary_compatible TEXT[], -- ['vegetarian', 'vegan', 'gluten_free', etc.]
  allergens TEXT[], -- ['gluten', 'dairy', 'nuts', etc.]
  
  -- Métadonnées
  common_units TEXT[] DEFAULT ARRAY['g', 'ml', 'pièce'], -- unités courantes
  average_piece_weight DECIMAL(6,2), -- poids moyen d'une pièce en grammes
  price_per_kg DECIMAL(6,2), -- prix indicatif par kg
  carbon_footprint DECIMAL(5,2), -- empreinte carbone par kg
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Substitutions d'ingrédients (anti-gaspillage)
CREATE TABLE IF NOT EXISTS ingredient_substitutions (
  id SERIAL PRIMARY KEY,
  original_ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  substitute_ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  ratio DECIMAL(4,2) DEFAULT 1.0, -- ratio de substitution
  context VARCHAR(100), -- 'baking', 'sauce', 'general', etc.
  notes TEXT,
  compatibility_score INTEGER DEFAULT 5, -- score sur 10
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(original_ingredient_id, substitute_ingredient_id, context)
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
  
  -- Règles spécifiques
  rules JSONB, -- règles nutritionnelles avancées
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disponibilité saisonnière détaillée
CREATE TABLE IF NOT EXISTS seasonal_availability (
  id SERIAL PRIMARY KEY,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  month INTEGER CHECK (month BETWEEN 1 AND 12),
  availability_score INTEGER CHECK (availability_score BETWEEN 0 AND 10), -- 10 = pleine saison
  price_factor DECIMAL(3,2) DEFAULT 1.0, -- multiplicateur de prix (1.0 = prix normal)
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 10),
  
  UNIQUE(ingredient_id, month)
);

-- ================================================================================================
-- 3. RECETTES (CŒUR DU SYSTÈME)
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
  
  -- Nutrition calculée (par portion)
  calories_per_serving DECIMAL(6,2),
  proteins_per_serving DECIMAL(5,2),
  carbs_per_serving DECIMAL(5,2),
  fats_per_serving DECIMAL(5,2),
  fiber_per_serving DECIMAL(5,2),
  
  -- Micronutriments par portion
  vitamin_c_per_serving DECIMAL(5,2),
  iron_per_serving DECIMAL(5,2),
  calcium_per_serving DECIMAL(5,2),
  
  -- Coûts et budget
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
  
  -- Régimes alimentaires
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
  
  -- Score Myko (calculé automatiquement)
  myko_score INTEGER DEFAULT 0 CHECK (myko_score BETWEEN 0 AND 100),
  myko_factors JSONB, -- détail des facteurs du score
  
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

-- Ingrédients par recette (quantités précises)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  
  -- Quantités
  quantity DECIMAL(8,3) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(20) NOT NULL, -- g, ml, pièce, cuillère, etc.
  
  -- Contexte
  preparation_note VARCHAR(200), -- 'haché', 'en dés', 'râpé', etc.
  is_optional BOOLEAN DEFAULT FALSE,
  is_for_garnish BOOLEAN DEFAULT FALSE,
  
  -- Organisation
  ingredient_group VARCHAR(100), -- 'base', 'sauce', 'garniture', etc.
  sort_order INTEGER DEFAULT 0,
  
  -- Substitutions possibles
  substitution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, ingredient_id, ingredient_group)
);

-- Étapes de préparation
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
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, equipment_id)
);

-- Tags et mots-clés pour recherche
CREATE TABLE IF NOT EXISTS recipe_tags (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  tag VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'technique', 'saveur', 'occasion', 'origine', etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, tag)
);

-- Détails nutritionnels avancés (micronutriments complets)
CREATE TABLE IF NOT EXISTS recipe_nutrition_details (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- Vitamines (par portion)
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
  
  -- Minéraux (par portion)
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
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id)
);

-- ================================================================================================
-- 4. PLANNING DES REPAS
-- ================================================================================================

-- Planning hebdomadaire des repas
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
  
  -- État et suivi
  status VARCHAR(20) DEFAULT 'planifie' CHECK (status IN ('planifie', 'en_cours', 'termine', 'annule', 'reporte')),
  actual_servings INTEGER, -- portions réellement préparées
  
  -- Évaluation post-repas
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
  preparation_time_actual INTEGER, -- temps réel de préparation
  difficulty_felt INTEGER CHECK (difficulty_felt BETWEEN 1 AND 5),
  
  -- Notes
  notes TEXT,
  modifications_made TEXT, -- changements apportés à la recette
  
  -- Gestion des restes
  leftovers_quantity DECIMAL(5,2), -- quantité de restes en portions
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
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active);

-- Index pour les ingrédients
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_seasonality ON ingredients USING GIN(seasonality);
CREATE INDEX IF NOT EXISTS idx_ingredients_dietary ON ingredients USING GIN(dietary_compatible);

-- Index pour le planning
CREATE INDEX IF NOT EXISTS idx_meal_planning_user_date ON meal_planning(user_id, planned_date);
CREATE INDEX IF NOT EXISTS idx_meal_planning_status ON meal_planning(status);
CREATE INDEX IF NOT EXISTS idx_meal_planning_leftovers ON meal_planning(leftovers_quantity) WHERE leftovers_quantity > 0;

-- Index pour les recherches textuelles
CREATE INDEX IF NOT EXISTS idx_recipes_title_search ON recipes USING GIN(to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS idx_recipes_description_search ON recipes USING GIN(to_tsvector('french', description));
CREATE INDEX IF NOT EXISTS idx_ingredients_name_search ON ingredients USING GIN(to_tsvector('french', name));

-- ================================================================================================
-- 6. FONCTIONS ET TRIGGERS AUTOMATIQUES
-- ================================================================================================

-- Fonction pour calculer automatiquement les valeurs nutritionnelles d'une recette
CREATE OR REPLACE FUNCTION calculate_recipe_nutrition()
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
BEGIN
    -- Calculer la nutrition totale basée sur les ingrédients
    FOR ingredient_record IN 
        SELECT ri.quantity, ri.unit, i.calories_per_100g, i.proteins_per_100g, 
               i.carbs_per_100g, i.fats_per_100g, i.fiber_per_100g,
               i.vitamin_c_per_100g, i.iron_per_100g, i.calcium_per_100g,
               i.average_piece_weight
        FROM recipe_ingredients ri
        JOIN ingredients i ON ri.ingredient_id = i.id
        WHERE ri.recipe_id = NEW.id
    LOOP
        DECLARE
            quantity_in_grams DECIMAL(8,2);
        BEGIN
            -- Convertir la quantité en grammes selon l'unité
            IF ingredient_record.unit = 'g' THEN
                quantity_in_grams := ingredient_record.quantity;
            ELSIF ingredient_record.unit = 'ml' THEN
                quantity_in_grams := ingredient_record.quantity; -- approximation 1ml = 1g pour liquides
            ELSIF ingredient_record.unit = 'pièce' AND ingredient_record.average_piece_weight IS NOT NULL THEN
                quantity_in_grams := ingredient_record.quantity * ingredient_record.average_piece_weight;
            ELSE
                quantity_in_grams := ingredient_record.quantity; -- fallback
            END IF;
            
            -- Calculer la contribution nutritionnelle (pour 100g → pour quantity)
            total_calories := total_calories + (COALESCE(ingredient_record.calories_per_100g, 0) * quantity_in_grams / 100);
            total_proteins := total_proteins + (COALESCE(ingredient_record.proteins_per_100g, 0) * quantity_in_grams / 100);
            total_carbs := total_carbs + (COALESCE(ingredient_record.carbs_per_100g, 0) * quantity_in_grams / 100);
            total_fats := total_fats + (COALESCE(ingredient_record.fats_per_100g, 0) * quantity_in_grams / 100);
            total_fiber := total_fiber + (COALESCE(ingredient_record.fiber_per_100g, 0) * quantity_in_grams / 100);
            total_vitamin_c := total_vitamin_c + (COALESCE(ingredient_record.vitamin_c_per_100g, 0) * quantity_in_grams / 100);
            total_iron := total_iron + (COALESCE(ingredient_record.iron_per_100g, 0) * quantity_in_grams / 100);
            total_calcium := total_calcium + (COALESCE(ingredient_record.calcium_per_100g, 0) * quantity_in_grams / 100);
        END;
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

-- Trigger pour recalculer la nutrition automatiquement
CREATE TRIGGER trigger_calculate_nutrition
    BEFORE INSERT OR UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_recipe_nutrition();

-- Fonction pour calculer le score Myko d'une recette
CREATE OR REPLACE FUNCTION calculate_myko_score()
RETURNS TRIGGER AS $$
DECLARE
    score INTEGER := 0;
    factors JSONB := '{}'::jsonb;
    seasonal_bonus INTEGER := 0;
    nutrition_score INTEGER := 0;
    complexity_penalty INTEGER := 0;
BEGIN
    -- Score nutritionnel (40 points max)
    IF NEW.calories_per_serving BETWEEN 200 AND 600 THEN
        nutrition_score := nutrition_score + 15;
        factors := factors || '{"calories_balanced": true}'::jsonb;
    END IF;
    
    IF NEW.proteins_per_serving >= 10 THEN
        nutrition_score := nutrition_score + 10;
        factors := factors || '{"good_protein": true}'::jsonb;
    END IF;
    
    IF NEW.fiber_per_serving >= 3 THEN
        nutrition_score := nutrition_score + 10;
        factors := factors || '{"high_fiber": true}'::jsonb;
    END IF;
    
    IF NEW.vitamin_c_per_serving >= 10 THEN
        nutrition_score := nutrition_score + 5;
        factors := factors || '{"vitamin_c_rich": true}'::jsonb;
    END IF;
    
    -- Score saisonnier (20 points max)
    CASE EXTRACT(MONTH FROM NOW())
        WHEN 3,4,5 THEN -- Printemps
            IF NEW.season_spring THEN seasonal_bonus := 20; END IF;
        WHEN 6,7,8 THEN -- Été
            IF NEW.season_summer THEN seasonal_bonus := 20; END IF;
        WHEN 9,10,11 THEN -- Automne
            IF NEW.season_autumn THEN seasonal_bonus := 20; END IF;
        WHEN 12,1,2 THEN -- Hiver
            IF NEW.season_winter THEN seasonal_bonus := 20; END IF;
    END CASE;
    
    -- Pénalité de complexité (0-20 points de malus)
    IF NEW.prep_min + NEW.cook_min > 120 THEN
        complexity_penalty := 20;
        factors := factors || '{"too_long": true}'::jsonb;
    ELSIF NEW.prep_min + NEW.cook_min > 60 THEN
        complexity_penalty := 10;
        factors := factors || '{"long_prep": true}'::jsonb;
    END IF;
    
    -- Bonus régimes spéciaux (20 points max)
    IF NEW.is_vegetarian THEN
        score := score + 5;
        factors := factors || '{"vegetarian": true}'::jsonb;
    END IF;
    
    IF NEW.is_vegan THEN
        score := score + 10;
        factors := factors || '{"vegan": true}'::jsonb;
    END IF;
    
    -- Calcul final
    score := nutrition_score + seasonal_bonus + score - complexity_penalty;
    score := GREATEST(0, LEAST(100, score)); -- Clamp entre 0 et 100
    
    NEW.myko_score := score;
    NEW.myko_factors := factors;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer le score Myko
CREATE TRIGGER trigger_calculate_myko_score
    BEFORE INSERT OR UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_myko_score();

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
CREATE TRIGGER trigger_ingredients_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_meal_planning_updated_at BEFORE UPDATE ON meal_planning FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================================================
-- 7. VUES POUR REQUÊTES COMPLEXES
-- ================================================================================================

-- Vue pour les recettes avec informations complètes
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
    END as is_seasonal_now

FROM recipes r
LEFT JOIN recipe_categories rc ON r.category_id = rc.id
LEFT JOIN cuisine_types ct ON r.cuisine_type_id = ct.id  
LEFT JOIN difficulty_levels dl ON r.difficulty_level_id = dl.id
WHERE r.is_active = true;

-- Vue pour le planning avec détails des recettes
CREATE OR REPLACE VIEW meal_planning_complete AS
SELECT 
    mp.*,
    r.title as recipe_title,
    r.prep_min,
    r.cook_min,
    r.myko_score,
    r.calories_per_serving,
    rc.name as category_name,
    rc.icon as category_icon,
    
    -- Statut des restes
    CASE 
        WHEN mp.leftovers_quantity > 0 AND mp.leftovers_used_date IS NULL THEN 'available'
        WHEN mp.leftovers_quantity > 0 AND mp.leftovers_used_date IS NOT NULL THEN 'used'
        ELSE 'none'
    END as leftovers_status

FROM meal_planning mp
LEFT JOIN recipes r ON mp.recipe_id = r.id
LEFT JOIN recipe_categories rc ON r.category_id = rc.id;

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
('Conserves', 'conserves', 'Confitures, pickles et conserves', '🫙', '{"breakfast": true, "lunch": false, "dinner": false, "snack": true}')
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
('Fusion', 'fusion', 'Cuisine créative moderne', '✨', 'International')
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
('Casher', 'casher', 'Conforme aux règles casher', '#7c3aed', '✡️')
ON CONFLICT (slug) DO NOTHING;

-- Profils nutritionnels types
INSERT INTO nutritional_profiles (name, description, target_protein_percent, target_carbs_percent, target_fats_percent, calories_breakfast, calories_lunch, calories_dinner) VALUES
('Équilibré standard', 'Répartition nutritionnelle équilibrée pour adulte actif', 20.0, 50.0, 30.0, 350, 500, 450),
('Sportif', 'Riche en protéines pour sportifs', 25.0, 45.0, 30.0, 400, 600, 500),
('Minceur', 'Contrôle calorique pour perte de poids', 25.0, 40.0, 35.0, 250, 400, 350),
('Sénior', 'Adapté aux besoins des personnes âgées', 22.0, 48.0, 30.0, 300, 450, 400),
('Enfant', 'Équilibré pour enfants en croissance', 18.0, 55.0, 27.0, 300, 400, 350)
ON CONFLICT (name) DO NOTHING;

-- Message de succès
SELECT 'Base de données Myko créée avec succès ! 🌿' as status, 
       'Prêt pour l''intelligence culinaire complète' as message;