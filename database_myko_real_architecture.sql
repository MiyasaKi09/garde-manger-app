-- ================================================================================================
-- BASE DE DONNÉES MYKO - ADAPTÉE À L'ARCHITECTURE EXISTANTE
-- ================================================================================================
-- Version finale respectant la structure inventory réelle :
-- • canonical_foods (base avec nutrition_profile)
-- • cultivars (variétés avec nutrition_override) 
-- • archetypes (transformés avec nutrition_profile)  
-- • products (commerciaux avec nutrition_override)
-- • inventory_lots (stocks existants)
-- ================================================================================================

-- ================================================================================================
-- 1. TABLES DE RÉFÉRENCE (MASTER DATA) - INCHANGÉES
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
  min_prep_time INTEGER,
  max_prep_time INTEGER,
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
  color VARCHAR(7),
  icon VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Équipements de cuisine
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  description TEXT,
  alternatives TEXT[],
  is_essential BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================================
-- 2. INTELLIGENCE DES SUBSTITUTIONS (BASÉE SUR VOTRE LOGIQUE EXISTANTE)
-- ================================================================================================

-- Table des substitutions intelligentes
-- RESPECTE la logique : canonical→cultivars automatiques, archétypes→spécifiques
CREATE TABLE IF NOT EXISTS smart_substitutions (
  id SERIAL PRIMARY KEY,
  
  -- Ingrédient original demandé dans la recette
  original_product_type VARCHAR(20) NOT NULL CHECK (original_product_type IN ('canonical', 'cultivar', 'archetype', 'product')),
  original_product_id BIGINT NOT NULL,
  
  -- Substitution possible 
  substitute_product_type VARCHAR(20) NOT NULL CHECK (substitute_product_type IN ('canonical', 'cultivar', 'archetype', 'product')),
  substitute_product_id BIGINT NOT NULL,
  
  -- Paramètres de substitution
  conversion_ratio DECIMAL(4,2) DEFAULT 1.0, -- ex: 1.2 = 20% de plus needed
  context VARCHAR(100), -- 'baking', 'sauce', 'raw', 'cooking', etc.
  
  -- Métadonnées Myko
  compatibility_score INTEGER DEFAULT 5 CHECK (compatibility_score BETWEEN 1 AND 10),
  nutrition_impact_factor DECIMAL(3,2) DEFAULT 1.0, -- multiplicateur nutritionnel
  flavor_impact VARCHAR(50) DEFAULT 'neutral', -- 'improved', 'neutral', 'degraded'
  texture_impact VARCHAR(50) DEFAULT 'neutral',
  
  -- Notes et restrictions
  notes TEXT,
  technique_adjustments TEXT, -- adaptations de technique nécessaires
  season_preference TEXT[], -- ['spring', 'summer'] si saisonnier
  
  -- Metadata
  auto_generated BOOLEAN DEFAULT FALSE, -- généré automatiquement vs manuel
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(original_product_type, original_product_id, substitute_product_type, substitute_product_id, context)
);

-- Techniques de cuisson et leur impact nutritionnel
-- POUR CALCULER LA NUTRITION FINALE depuis les produits bruts
CREATE TABLE IF NOT EXISTS cooking_techniques (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50), -- 'wet_heat', 'dry_heat', 'combination', 'raw'
  
  -- Impact nutritionnel (facteurs multiplicateurs)
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
  water_loss_factor DECIMAL(3,2) DEFAULT 0.0, -- perte d'eau (concentration)
  fat_addition_factor DECIMAL(3,2) DEFAULT 0.0, -- ajout de matières grasses
  
  -- Temps et conditions typiques
  typical_temp_celsius INTEGER,
  typical_duration_min INTEGER,
  
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profils nutritionnels cibles
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
  
  -- Priorités Myko
  myko_priorities JSONB DEFAULT '{"anti_waste": 8, "seasonal": 7, "inventory_based": 9, "nutrition": 6}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================================
-- 3. RECETTES CONNECTÉES À L'INVENTORY EXISTANT
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
  rest_min INTEGER DEFAULT 0 CHECK (rest_min >= 0),
  
  -- Nutrition calculée (par portion) - CALCULÉE DEPUIS LES PRODUITS + CUISSONS
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
  
  -- Score Myko (intègre inventory + saisonnalité + nutrition)
  myko_score INTEGER DEFAULT 0 CHECK (myko_score BETWEEN 0 AND 100),
  myko_factors JSONB,
  inventory_compatibility_score INTEGER DEFAULT 0, -- % ingrédients disponibles
  
  -- Métadonnées
  image_url TEXT,
  video_url TEXT,
  source_name VARCHAR(200),
  author_name VARCHAR(200),
  
  -- Statistiques d'usage
  times_cooked INTEGER DEFAULT 0,
  avg_rating DECIMAL(2,1) DEFAULT 0,
  last_cooked_at TIMESTAMP WITH TIME ZONE,
  
  -- Système
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(slug),
  CONSTRAINT valid_total_time CHECK (prep_min + cook_min + rest_min > 0)
);

-- Ingrédients par recette (UTILISE VOS TABLES EXISTANTES)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- RÉFÉRENCE VERS VOTRE SYSTÈME EXISTANT (même logique que inventory_lots)
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('canonical', 'cultivar', 'archetype', 'product')),
  product_id BIGINT NOT NULL, -- référence vers canonical_foods.id, cultivars.id, etc.
  
  -- Quantités
  quantity DECIMAL(8,3) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(20) NOT NULL, -- utilise primary_unit des tables existantes
  
  -- Préparation et cuisson
  preparation_note VARCHAR(200), -- 'haché', 'en dés', 'râpé'
  cooking_technique_id INTEGER REFERENCES cooking_techniques(id), -- NOUVEAU: technique de cuisson
  cooking_duration_min INTEGER DEFAULT 0, -- durée de cuisson spécifique
  cooking_temperature INTEGER, -- température si applicable
  
  -- Contexte
  is_optional BOOLEAN DEFAULT FALSE,
  is_for_garnish BOOLEAN DEFAULT FALSE,
  ingredient_group VARCHAR(100), -- 'base', 'sauce', 'garniture'
  sort_order INTEGER DEFAULT 0,
  
  -- Intelligence Myko
  allow_auto_substitution BOOLEAN DEFAULT TRUE, -- substitution automatique ok ?
  substitution_priority INTEGER DEFAULT 5, -- 1=critique, 10=très flexible
  min_quality_score INTEGER DEFAULT 1, -- qualité minimum acceptable
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, product_type, product_id, ingredient_group)
);

-- Étapes de préparation avec techniques
CREATE TABLE IF NOT EXISTS recipe_steps (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  step_number INTEGER NOT NULL CHECK (step_number > 0),
  title VARCHAR(200),
  instruction TEXT NOT NULL,
  
  -- Technique et conditions
  primary_technique_id INTEGER REFERENCES cooking_techniques(id),
  duration_min INTEGER DEFAULT 0,
  temperature INTEGER,
  
  -- Équipement
  required_equipment TEXT[],
  optional_equipment TEXT[],
  
  -- Intelligence adaptative
  substitution_adaptations JSONB, -- adaptations si substitutions
  technique_alternatives TEXT, -- alternatives si équipement manquant
  
  -- Aide
  image_url TEXT,
  video_url TEXT,
  chef_tip TEXT,
  common_mistakes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, step_number)
);

-- Équipement requis
CREATE TABLE IF NOT EXISTS recipe_equipment (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  
  is_essential BOOLEAN DEFAULT TRUE,
  usage_note VARCHAR(200),
  alternative_methods TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, equipment_id)
);

-- Tags enrichis
CREATE TABLE IF NOT EXISTS recipe_tags (
  id SERIAL PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  
  tag VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'technique', 'saveur', 'occasion', 'inventory_based'
  auto_generated BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(recipe_id, tag)
);

-- ================================================================================================
-- 4. PLANNING CONNECTÉ À L'INVENTORY
-- ================================================================================================

-- Planning des repas avec gestion inventory
CREATE TABLE IF NOT EXISTS meal_planning (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timing
  planned_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('petit-dejeuner', 'dejeuner', 'diner', 'collation')),
  meal_component VARCHAR(20) NOT NULL CHECK (meal_component IN ('entree', 'principal', 'dessert', 'boisson')),
  
  -- Recette
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  planned_servings INTEGER DEFAULT NULL,
  
  -- Substitutions appliquées automatiquement
  applied_substitutions JSONB, -- substitutions Myko appliquées
  inventory_snapshot JSONB, -- snapshot inventory au moment planning
  
  -- État
  status VARCHAR(20) DEFAULT 'planifie' CHECK (status IN ('planifie', 'en_cours', 'termine', 'annule', 'reporte')),
  actual_servings INTEGER,
  
  -- Retours d'expérience
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
  preparation_time_actual INTEGER,
  difficulty_felt INTEGER CHECK (difficulty_felt BETWEEN 1 AND 5),
  
  -- Notes
  notes TEXT,
  modifications_made TEXT,
  substitutions_feedback TEXT, -- retour sur les substitutions appliquées
  
  -- Gestion des restes (CONNECTÉE À inventory_lots !)
  leftovers_quantity DECIMAL(5,2),
  leftovers_inventory_lot_id UUID, -- référence vers nouveau lot créé
  leftovers_used_date DATE,
  leftovers_recipe_id UUID REFERENCES recipes(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, planned_date, meal_type, meal_component)
);

-- ================================================================================================
-- 5. FONCTIONS INTELLIGENTES 
-- ================================================================================================

-- Fonction pour extraire la nutrition depuis vos tables existantes
CREATE OR REPLACE FUNCTION extract_nutrition_from_product(
  p_product_type VARCHAR(20), 
  p_product_id BIGINT
) 
RETURNS JSONB AS $$
DECLARE
  nutrition_data JSONB := '{}'::jsonb;
  canonical_nutrition JSONB;
  override_nutrition JSONB;
BEGIN
  -- Logique selon le type de produit
  CASE p_product_type
    WHEN 'canonical' THEN
      -- Nutrition directe depuis canonical_foods
      SELECT nutrition_profile INTO canonical_nutrition 
      FROM canonical_foods 
      WHERE id = p_product_id;
      nutrition_data := COALESCE(canonical_nutrition, '{}'::jsonb);
      
    WHEN 'cultivar' THEN
      -- Cultivar: nutrition_override OU nutrition du canonical parent
      SELECT cv.nutrition_override, cf.nutrition_profile 
      INTO override_nutrition, canonical_nutrition
      FROM cultivars cv
      JOIN canonical_foods cf ON cv.canonical_food_id = cf.id
      WHERE cv.id = p_product_id;
      
      -- Prioriser l'override du cultivar
      nutrition_data := COALESCE(override_nutrition, canonical_nutrition, '{}'::jsonb);
      
    WHEN 'archetype' THEN
      -- Archetype: nutrition_profile OU nutrition du parent (canonical/cultivar)
      SELECT 
        a.nutrition_profile,
        cf.nutrition_profile as canonical_nutrition,
        cv.nutrition_override as cultivar_override
      INTO override_nutrition, canonical_nutrition, override_nutrition
      FROM archetypes a
      LEFT JOIN canonical_foods cf ON a.canonical_food_id = cf.id
      LEFT JOIN cultivars cv ON a.cultivar_id = cv.id
      WHERE a.id = p_product_id;
      
      -- Prioriser archetype > cultivar override > canonical
      nutrition_data := COALESCE(
        (SELECT nutrition_profile FROM archetypes WHERE id = p_product_id),
        override_nutrition,
        canonical_nutrition, 
        '{}'::jsonb
      );
      
    WHEN 'product' THEN
      -- Product commercial: nutrition_override OU nutrition de l'archetype parent
      SELECT 
        p.nutrition_override,
        a.nutrition_profile,
        cf.nutrition_profile as canonical_nutrition
      INTO override_nutrition, canonical_nutrition, canonical_nutrition
      FROM products p
      JOIN archetypes a ON p.archetype_id = a.id
      LEFT JOIN canonical_foods cf ON a.canonical_food_id = cf.id
      WHERE p.id::text = p_product_id::text; -- conversion pour UUID
      
      nutrition_data := COALESCE(override_nutrition, canonical_nutrition, '{}'::jsonb);
  END CASE;
  
  RETURN nutrition_data;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer nutrition d'une recette avec techniques de cuisson
CREATE OR REPLACE FUNCTION calculate_recipe_nutrition_with_cooking()
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
  nutrition_data JSONB;
  technique_record RECORD;
  quantity_grams DECIMAL(8,2);
BEGIN
  -- Parcourir tous les ingrédients
  FOR ingredient_record IN 
    SELECT ri.*, ct.calories_retention, ct.protein_retention, ct.carbs_retention, 
           ct.fat_retention, ct.fiber_retention, ct.vitamin_c_retention, 
           ct.minerals_retention
    FROM recipe_ingredients ri
    LEFT JOIN cooking_techniques ct ON ri.cooking_technique_id = ct.id
    WHERE ri.recipe_id = NEW.id
  LOOP
    -- Extraire nutrition du produit
    nutrition_data := extract_nutrition_from_product(
      ingredient_record.product_type, 
      ingredient_record.product_id
    );
    
    -- Convertir quantité en grammes (utiliser density/grams_per_unit des tables existantes)
    quantity_grams := ingredient_record.quantity;
    IF ingredient_record.unit = 'ml' THEN
      -- Utiliser density depuis les tables existantes
      quantity_grams := ingredient_record.quantity * COALESCE(
        CASE ingredient_record.product_type
          WHEN 'canonical' THEN (SELECT density_g_per_ml FROM canonical_foods WHERE id = ingredient_record.product_id)
          WHEN 'cultivar' THEN (SELECT density_g_per_ml FROM cultivars WHERE id = ingredient_record.product_id)
          WHEN 'archetype' THEN (SELECT density_g_per_ml FROM archetypes WHERE id = ingredient_record.product_id)
        END, 1.0
      );
    ELSIF ingredient_record.unit = 'pièce' THEN
      quantity_grams := ingredient_record.quantity * COALESCE(
        CASE ingredient_record.product_type
          WHEN 'canonical' THEN (SELECT grams_per_unit FROM canonical_foods WHERE id = ingredient_record.product_id)
          WHEN 'cultivar' THEN (SELECT grams_per_unit FROM cultivars WHERE id = ingredient_record.product_id)
          WHEN 'archetype' THEN (SELECT grams_per_unit FROM archetypes WHERE id = ingredient_record.product_id)
        END, 100.0
      );
    END IF;
    
    -- Calculer contribution avec impact cuisson
    IF nutrition_data ? 'calories_per_100g' THEN
      total_calories := total_calories + (
        (nutrition_data->>'calories_per_100g')::DECIMAL * quantity_grams / 100 *
        COALESCE(ingredient_record.calories_retention, 1.0)
      );
    END IF;
    
    IF nutrition_data ? 'proteins_per_100g' THEN
      total_proteins := total_proteins + (
        (nutrition_data->>'proteins_per_100g')::DECIMAL * quantity_grams / 100 *
        COALESCE(ingredient_record.protein_retention, 1.0)
      );
    END IF;
    
    -- Continuer pour les autres nutriments...
    
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

-- Trigger pour calculer nutrition avec cuisson
CREATE TRIGGER trigger_calculate_nutrition_with_cooking
    BEFORE INSERT OR UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_recipe_nutrition_with_cooking();

-- Fonction pour auto-générer les substitutions canonique→cultivars
CREATE OR REPLACE FUNCTION auto_generate_canonical_substitutions() RETURNS VOID AS $$
DECLARE
  canonical_record RECORD;
  cultivar_record RECORD;
BEGIN
  -- Pour chaque canonical_food, créer des substitutions automatiques vers tous ses cultivars
  FOR canonical_record IN SELECT id FROM canonical_foods LOOP
    FOR cultivar_record IN 
      SELECT id FROM cultivars WHERE canonical_food_id = canonical_record.id 
    LOOP
      INSERT INTO smart_substitutions (
        original_product_type, original_product_id,
        substitute_product_type, substitute_product_id,
        conversion_ratio, context, compatibility_score, 
        auto_generated
      ) VALUES (
        'canonical', canonical_record.id,
        'cultivar', cultivar_record.id,
        1.0, 'general', 9, 
        TRUE
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- 6. VUES INTELLIGENTES
-- ================================================================================================

-- Vue des recettes avec compatibilité inventory
CREATE OR REPLACE VIEW recipes_with_inventory AS
SELECT 
    r.*,
    rc.name as category_name,
    (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = r.id) as total_ingredients,
    (
      SELECT COUNT(*)
      FROM recipe_ingredients ri
      WHERE ri.recipe_id = r.id
      AND EXISTS (
        SELECT 1 FROM inventory_lots il
        WHERE il.product_type = ri.product_type 
        AND il.product_id = ri.product_id
        AND il.qty_remaining > 0
        AND (il.expiration_date IS NULL OR il.expiration_date > CURRENT_DATE)
      )
    ) as available_ingredients,
    CASE 
      WHEN (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = r.id) = 0 THEN 0
      ELSE ROUND(
        (SELECT COUNT(*)::DECIMAL FROM recipe_ingredients ri
         WHERE ri.recipe_id = r.id
         AND EXISTS (SELECT 1 FROM inventory_lots il
                     WHERE il.product_type = ri.product_type 
                     AND il.product_id = ri.product_id
                     AND il.qty_remaining > 0)) * 100 / 
        (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = r.id)
      )
    END as inventory_match_percent
FROM recipes r
LEFT JOIN recipe_categories rc ON r.category_id = rc.id
WHERE r.is_active = true;

-- ================================================================================================
-- 7. DONNÉES DE BASE
-- ================================================================================================

-- Techniques de cuisson communes
INSERT INTO cooking_techniques (name, category, calories_retention, protein_retention, vitamin_c_retention, description) VALUES
('Cru', 'raw', 1.0, 1.0, 1.0, 'Aucune cuisson'),
('Vapeur', 'wet_heat', 1.0, 1.0, 0.85, 'Cuisson douce préservant les nutriments'),
('Bouilli', 'wet_heat', 0.95, 0.95, 0.50, 'Cuisson dans l''eau bouillante'),
('Sauté', 'dry_heat', 1.05, 1.0, 0.70, 'Cuisson rapide à la poêle'),
('Grillé', 'dry_heat', 0.90, 0.95, 0.60, 'Cuisson au grill'),
('Rôti', 'dry_heat', 0.95, 1.0, 0.65, 'Cuisson au four'),
('Mijoté', 'combination', 1.0, 1.0, 0.70, 'Cuisson lente en sauce'),
('Frit', 'dry_heat', 1.30, 0.95, 0.40, 'Cuisson dans l''huile chaude')
ON CONFLICT (name) DO NOTHING;

-- Catégories de recettes
INSERT INTO recipe_categories (name, slug, description, icon, meal_compatibility) VALUES
('Entrées', 'entrees', 'Entrées et hors-d''œuvres', '🥗', '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}'),
('Plats principaux', 'plats-principaux', 'Plats de résistance', '🍽️', '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}'),
('Desserts', 'desserts', 'Desserts et douceurs', '🍰', '{"breakfast": false, "lunch": true, "dinner": true, "snack": true}'),
('Anti-gaspi', 'anti-gaspi', 'Recettes anti-gaspillage', '♻️', '{"breakfast": true, "lunch": true, "dinner": true, "snack": true}')
ON CONFLICT (slug) DO NOTHING;

-- Générer automatiquement les substitutions canonical→cultivars
SELECT auto_generate_canonical_substitutions();

-- Message de succès
SELECT 'Base de données Myko ADAPTÉE À L''ARCHITECTURE EXISTANTE ! 🎯' as status, 
       'Utilise nutrition_profile des tables existantes + techniques de cuisson' as message,
       'Substitutions canonique→cultivars auto-générées !' as bonus;