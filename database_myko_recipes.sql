-- ========================================
-- STRUCTURE COMPLÈTE MYKO - BASE DE DONNÉES RECETTES
-- Version optimisée pour 500+ recettes avec métadonnées précises
-- ========================================

-- ========================================
-- 1. TABLES DE MÉTADONNÉES
-- ========================================

-- Catégories de recettes
CREATE TABLE IF NOT EXISTS recipe_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Types de cuisine
CREATE TABLE IF NOT EXISTS cuisine_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  country VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Difficultés
CREATE TABLE IF NOT EXISTS difficulty_levels (
  id SERIAL PRIMARY KEY,
  level VARCHAR(20) NOT NULL UNIQUE CHECK (level IN ('très_facile', 'facile', 'moyen', 'difficile', 'expert')),
  description TEXT,
  time_factor DECIMAL(3,2) DEFAULT 1.0 -- multiplicateur de temps
);

-- Types de régimes alimentaires
CREATE TABLE IF NOT EXISTS dietary_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(10)
);

-- ========================================
-- 2. TABLE PRINCIPALE DES RECETTES
-- ========================================

CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Informations de base
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE, -- pour URLs SEO
  description TEXT,
  short_description VARCHAR(500), -- résumé court
  
  -- Métadonnées culinaires
  category_id INTEGER REFERENCES recipe_categories(id),
  cuisine_type_id INTEGER REFERENCES cuisine_types(id),
  difficulty_level_id INTEGER REFERENCES difficulty_levels(id),
  
  -- Portions et temps
  servings INTEGER NOT NULL DEFAULT 4,
  min_servings INTEGER DEFAULT 1,
  max_servings INTEGER DEFAULT 12,
  prep_min INTEGER NOT NULL DEFAULT 0,
  cook_min INTEGER NOT NULL DEFAULT 0,
  rest_min INTEGER DEFAULT 0, -- temps de repos/refroidissement
  total_min INTEGER GENERATED ALWAYS AS (prep_min + cook_min + rest_min) STORED,
  
  -- Informations nutritionnelles (pour 1 portion)
  calories INTEGER,
  proteins DECIMAL(6,2), -- en grammes
  carbs DECIMAL(6,2), -- en grammes
  fats DECIMAL(6,2), -- en grammes
  fiber DECIMAL(6,2), -- en grammes
  sugar DECIMAL(6,2), -- en grammes
  sodium INTEGER, -- en mg
  
  -- Micronutriments principaux (% AJR pour 1 portion)
  vitamin_c DECIMAL(5,2), -- en %
  vitamin_d DECIMAL(5,2), -- en %
  iron DECIMAL(5,2), -- en %
  calcium DECIMAL(5,2), -- en %
  potassium DECIMAL(5,2), -- en %
  
  -- Coût et praticité
  estimated_cost DECIMAL(6,2), -- coût estimé par portion en euros
  budget_category VARCHAR(20) DEFAULT 'moyen' CHECK (budget_category IN ('économique', 'moyen', 'cher', 'luxe')),
  skill_level VARCHAR(20) DEFAULT 'intermédiaire' CHECK (skill_level IN ('débutant', 'intermédiaire', 'avancé', 'expert')),
  
  -- Saisons et occasions
  season_spring BOOLEAN DEFAULT true,
  season_summer BOOLEAN DEFAULT true,
  season_autumn BOOLEAN DEFAULT true,
  season_winter BOOLEAN DEFAULT true,
  
  -- Occasions de repas
  meal_breakfast BOOLEAN DEFAULT false,
  meal_lunch BOOLEAN DEFAULT true,
  meal_dinner BOOLEAN DEFAULT true,
  meal_snack BOOLEAN DEFAULT false,
  meal_brunch BOOLEAN DEFAULT false,
  
  -- Méthodes de cuisson principales
  cooking_methods TEXT[], -- ['four', 'poêle', 'mijoteuse', 'vapeur', etc.]
  equipment_needed TEXT[], -- ['mixeur', 'robot', 'mandoline', etc.]
  
  -- Régimes alimentaires
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  is_dairy_free BOOLEAN DEFAULT false,
  is_low_carb BOOLEAN DEFAULT false,
  is_keto BOOLEAN DEFAULT false,
  is_paleo BOOLEAN DEFAULT false,
  
  -- Conservation et restes
  shelf_life_days INTEGER DEFAULT 3, -- durée de conservation des restes
  freezable BOOLEAN DEFAULT false,
  freeze_duration_months INTEGER, -- durée de congélation possible
  
  -- Médias
  image_url TEXT,
  video_url TEXT,
  gallery_images TEXT[], -- URLs d'images supplémentaires
  
  -- Instructions et notes
  instructions TEXT NOT NULL,
  chef_tips TEXT, -- conseils du chef
  variations TEXT, -- variantes possibles
  serving_suggestions TEXT, -- suggestions d'accompagnement
  
  -- Métadonnées Myko
  myko_score INTEGER DEFAULT 0, -- score calculé automatiquement
  popularity_score DECIMAL(4,2) DEFAULT 0, -- basé sur les réalisations
  success_rate DECIMAL(4,2) DEFAULT 100, -- taux de réussite %
  
  -- Source et attribution
  source_name VARCHAR(255), -- livre, site, chef, etc.
  source_url TEXT,
  author_name VARCHAR(255),
  
  -- Gestion
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_cooked_at TIMESTAMPTZ -- dernière fois que quelqu'un l'a cuisinée
);

-- ========================================
-- 3. TABLES LIÉES AUX INGRÉDIENTS
-- ========================================

-- Ingrédients de recette (liaison avec canonical_foods existant)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- Référence flexible aux produits (comme inventory_lots)
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('canonical', 'cultivar', 'archetype', 'custom')),
  product_id BIGINT, -- ID du produit selon le type
  custom_name VARCHAR(255), -- si product_type = 'custom'
  
  -- Quantité
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  
  -- Options
  is_optional BOOLEAN DEFAULT false,
  is_garnish BOOLEAN DEFAULT false,
  preparation_note VARCHAR(255), -- "émincé", "en dés", etc.
  
  -- Position dans la recette
  ingredient_group VARCHAR(100), -- "Pâte", "Garniture", "Sauce", etc.
  position INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Étapes de recette détaillées
CREATE TABLE IF NOT EXISTS recipe_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  
  step_number INTEGER NOT NULL,
  title VARCHAR(255), -- titre optionnel de l'étape
  instruction TEXT NOT NULL,
  
  -- Timing
  duration_min INTEGER, -- temps spécifique à cette étape
  temperature INTEGER, -- température four/cuisson
  temperature_unit VARCHAR(5) DEFAULT '°C',
  
  -- Médias
  image_url TEXT,
  video_url TEXT,
  
  -- Conseils
  tip TEXT,
  warning TEXT, -- mise en garde importante
  
  -- Métadonnées
  is_preparation BOOLEAN DEFAULT false, -- étape de préparation vs cuisson
  equipment_needed VARCHAR(255), -- équipement spécifique à cette étape
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ustensiles nécessaires
CREATE TABLE IF NOT EXISTS recipe_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  
  equipment_name VARCHAR(255) NOT NULL,
  is_essential BOOLEAN DEFAULT true, -- essentiel vs optionnel
  alternative TEXT, -- alternative si pas disponible
  quantity INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. TAGS ET RELATIONS
-- ========================================

-- Tags libres pour les recettes
CREATE TABLE IF NOT EXISTS recipe_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- couleur hex #ff0000
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Association recettes-tags
CREATE TABLE IF NOT EXISTS recipe_tag_relations (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES recipe_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- Relations entre recettes (inspirations, variantes)
CREATE TABLE IF NOT EXISTS recipe_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  related_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  relation_type VARCHAR(50) NOT NULL CHECK (relation_type IN ('variante', 'inspiration', 'accompagnement', 'dessert', 'entrée')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(recipe_id, related_recipe_id, relation_type)
);

-- ========================================
-- 5. PLANNING ET RÉALISATIONS
-- ========================================

-- Planning des repas (pour intégration Myko)
CREATE TABLE IF NOT EXISTS meal_planning (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  planned_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'brunch')),
  
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  planned_portions INTEGER NOT NULL DEFAULT 4,
  
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'postponed', 'cancelled')),
  
  -- Résultats
  actual_portions INTEGER, -- portions réellement cuisinées
  cooking_time_min INTEGER, -- temps réel de cuisson
  difficulty_felt INTEGER CHECK (difficulty_felt >= 1 AND difficulty_felt <= 5), -- difficulté ressentie
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  
  -- Notes
  cooking_notes TEXT, -- notes de l'utilisateur
  modifications TEXT, -- modifications apportées
  
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Historique des réalisations
CREATE TABLE IF NOT EXISTS cooking_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  cooked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  portions_made INTEGER NOT NULL,
  portions_left INTEGER DEFAULT 0, -- restes
  
  -- Évaluation
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  taste_rating INTEGER CHECK (taste_rating >= 1 AND taste_rating <= 5),
  success BOOLEAN DEFAULT true,
  
  -- Temps
  actual_prep_time INTEGER, -- temps réel de préparation
  actual_cook_time INTEGER, -- temps réel de cuisson
  
  -- Notes
  notes TEXT,
  modifications TEXT,
  would_cook_again BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 6. INDEX POUR PERFORMANCES
-- ========================================

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes USING gin(to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS idx_recipes_description ON recipes USING gin(to_tsvector('french', description));
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine_type_id);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty_level_id);
CREATE INDEX IF NOT EXISTS idx_recipes_total_time ON recipes(total_min);
CREATE INDEX IF NOT EXISTS idx_recipes_servings ON recipes(servings);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active) WHERE is_active = true;

-- Index pour les régimes
CREATE INDEX IF NOT EXISTS idx_recipes_vegetarian ON recipes(is_vegetarian) WHERE is_vegetarian = true;
CREATE INDEX IF NOT EXISTS idx_recipes_vegan ON recipes(is_vegan) WHERE is_vegan = true;
CREATE INDEX IF NOT EXISTS idx_recipes_gluten_free ON recipes(is_gluten_free) WHERE is_gluten_free = true;

-- Index pour les saisons
CREATE INDEX IF NOT EXISTS idx_recipes_seasons ON recipes(season_spring, season_summer, season_autumn, season_winter);

-- Index pour les repas
CREATE INDEX IF NOT EXISTS idx_recipes_meals ON recipes(meal_breakfast, meal_lunch, meal_dinner, meal_snack);

-- Index pour les ingrédients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_product ON recipe_ingredients(product_type, product_id);

-- Index pour les étapes
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id, step_number);

-- Index pour le planning
CREATE INDEX IF NOT EXISTS idx_meal_planning_date ON meal_planning(planned_date);
CREATE INDEX IF NOT EXISTS idx_meal_planning_user ON meal_planning(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_planning_recipe ON meal_planning(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_planning_status ON meal_planning(status);

-- Index pour l'historique
CREATE INDEX IF NOT EXISTS idx_cooking_history_user ON cooking_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cooking_history_recipe ON cooking_history(recipe_id);
CREATE INDEX IF NOT EXISTS idx_cooking_history_date ON cooking_history(cooked_date);

-- ========================================
-- 7. TRIGGERS ET FONCTIONS
-- ========================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_recipes_updated_at 
  BEFORE UPDATE ON recipes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_planning_updated_at 
  BEFORE UPDATE ON meal_planning 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer le score Myko automatiquement
CREATE OR REPLACE FUNCTION calculate_myko_score(recipe_row recipes)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  base_score INTEGER := 50;
BEGIN
  -- Score de base
  score := base_score;
  
  -- Bonus équilibre nutritionnel (+20 points max)
  IF recipe_row.proteins > 15 THEN score := score + 5; END IF;
  IF recipe_row.fiber > 5 THEN score := score + 5; END IF;
  IF recipe_row.vegetables_count > 2 THEN score := score + 5; END IF; -- à implémenter
  IF recipe_row.sodium < 800 THEN score := score + 5; END IF;
  
  -- Bonus praticité (+15 points max)
  IF recipe_row.total_min <= 30 THEN score := score + 8; 
  ELSIF recipe_row.total_min <= 60 THEN score := score + 4; END IF;
  
  IF recipe_row.skill_level = 'débutant' THEN score := score + 4;
  ELSIF recipe_row.skill_level = 'intermédiaire' THEN score := score + 2; END IF;
  
  -- Bonus saisonnier (+10 points max)
  -- Calculé selon la saison actuelle
  
  -- Bonus popularité (+15 points max)
  IF recipe_row.popularity_score > 4.0 THEN score := score + 10;
  ELSIF recipe_row.popularity_score > 3.0 THEN score := score + 5; END IF;
  
  IF recipe_row.success_rate > 90 THEN score := score + 5; END IF;
  
  -- Malus
  IF recipe_row.total_min > 120 THEN score := score - 10; END IF;
  IF recipe_row.estimated_cost > 8.0 THEN score := score - 5; END IF;
  
  -- Limiter entre 0 et 100
  RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql;

-- Trigger pour recalculer le score Myko
CREATE OR REPLACE FUNCTION update_myko_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.myko_score := calculate_myko_score(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_recipes_myko_score 
  BEFORE INSERT OR UPDATE ON recipes 
  FOR EACH ROW EXECUTE FUNCTION update_myko_score();

-- ========================================
-- 8. ROW LEVEL SECURITY
-- ========================================

-- Activer RLS sur toutes les tables sensibles
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_history ENABLE ROW LEVEL SECURITY;

-- Politiques pour les recettes (publiques en lecture, privées en écriture)
CREATE POLICY "Recipes are viewable by everyone" ON recipes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create their own recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques similaires pour les autres tables...
-- (à compléter selon les besoins)

-- ========================================
-- 9. VUES UTILES
-- ========================================

-- Vue complète des recettes avec métadonnées
CREATE OR REPLACE VIEW recipes_detailed AS
SELECT 
  r.*,
  rc.name AS category_name,
  rc.icon AS category_icon,
  ct.name AS cuisine_name,
  ct.country AS cuisine_country,
  dl.level AS difficulty_name,
  dl.description AS difficulty_description,
  
  -- Statistiques calculées
  COALESCE(ch.times_cooked, 0) AS times_cooked,
  COALESCE(ch.avg_rating, 0) AS avg_rating,
  COALESCE(ch.last_cooked, NULL) AS last_cooked_date
  
FROM recipes r
LEFT JOIN recipe_categories rc ON r.category_id = rc.id
LEFT JOIN cuisine_types ct ON r.cuisine_type_id = ct.id  
LEFT JOIN difficulty_levels dl ON r.difficulty_level_id = dl.id
LEFT JOIN (
  SELECT 
    recipe_id,
    COUNT(*) AS times_cooked,
    AVG((difficulty_rating + taste_rating) / 2.0) AS avg_rating,
    MAX(cooked_date) AS last_cooked
  FROM cooking_history 
  GROUP BY recipe_id
) ch ON r.id = ch.recipe_id
WHERE r.is_active = true;

COMMENT ON TABLE recipes IS 'Table principale des recettes avec métadonnées complètes pour Myko';
COMMENT ON VIEW recipes_detailed IS 'Vue enrichie des recettes avec statistiques et relations';