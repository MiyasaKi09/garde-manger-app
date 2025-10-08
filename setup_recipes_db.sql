-- Script de peuplement de la base de données Myko avec 500 recettes authentiques

-- 1. D'abord, créer la structure de base (tables de référence)
DO $$ 
BEGIN
  -- Vérifier si les tables existent déjà
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recipe_categories') THEN
    -- Créer les tables de base si elles n'existent pas
    CREATE TABLE recipe_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(10),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE cuisine_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL,
      description TEXT,
      flag VARCHAR(10),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE difficulty_levels (
      id SERIAL PRIMARY KEY,
      level VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      sort_order INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Insérer les données de base
    INSERT INTO recipe_categories (name, slug, description, icon) VALUES
    ('Entrées', 'entrees', 'Entrées et hors-d''œuvres', '🥗'),
    ('Soupes', 'soupes', 'Soupes et veloutés', '🍲'),
    ('Plats principaux', 'plats-principaux', 'Plats de résistance', '🍽️'),
    ('Accompagnements', 'accompagnements', 'Garnitures et accompagnements', '🥔'),
    ('Desserts', 'desserts', 'Desserts et douceurs', '🍰'),
    ('Salades', 'salades', 'Salades et crudités', '🥬'),
    ('Apéritifs', 'aperitifs', 'Amuse-bouches et apéritifs', '🍸'),
    ('Petit-déjeuner', 'petit-dejeuner', 'Petit-déjeuners et brunchs', '🥞');

    INSERT INTO cuisine_types (name, slug, description, flag) VALUES
    ('Française', 'francaise', 'Cuisine traditionnelle française', '🇫🇷'),
    ('Méditerranéenne', 'mediterraneenne', 'Cuisine du bassin méditerranéen', '🌊'),
    ('Italienne', 'italienne', 'Cuisine italienne authentique', '🇮🇹'),
    ('Asiatique', 'asiatique', 'Cuisines d''Asie', '🥢'),
    ('Végétarienne', 'vegetarienne', 'Cuisine sans viande ni poisson', '🌱'),
    ('Fusion', 'fusion', 'Cuisine créative et moderne', '✨');

    INSERT INTO difficulty_levels (level, name, description, sort_order) VALUES
    ('très_facile', 'Très facile', 'Accessible aux débutants', 1),
    ('facile', 'Facile', 'Quelques techniques simples', 2),
    ('moyen', 'Moyen', 'Techniques intermédiaires', 3),
    ('difficile', 'Difficile', 'Techniques avancées', 4),
    ('expert', 'Expert', 'Niveau chef professionnel', 5);

    -- Créer la table principale des recettes si elle n'existe pas
    CREATE TABLE IF NOT EXISTS recipes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      slug VARCHAR(200) NOT NULL,
      description TEXT,
      short_description TEXT,
      instructions TEXT NOT NULL,
      
      -- Métadonnées catégorisation
      category_id INTEGER REFERENCES recipe_categories(id),
      cuisine_type_id INTEGER REFERENCES cuisine_types(id),
      difficulty_level_id INTEGER REFERENCES difficulty_levels(id),
      
      -- Informations pratiques
      servings INTEGER DEFAULT 4,
      prep_min INTEGER DEFAULT 0,
      cook_min INTEGER DEFAULT 0,
      rest_min INTEGER DEFAULT 0,
      
      -- Nutrition (pour 1 portion)
      calories INTEGER,
      proteins DECIMAL(5,1),
      carbs DECIMAL(5,1),
      fats DECIMAL(5,1),
      fiber DECIMAL(5,1),
      vitamin_c DECIMAL(5,1),
      iron DECIMAL(5,1),
      calcium DECIMAL(5,1),
      
      -- Coûts et budget
      estimated_cost DECIMAL(6,2),
      budget_category VARCHAR(20),
      
      -- Niveau et compétences
      skill_level VARCHAR(50),
      
      -- Saisonnalité
      season_spring BOOLEAN DEFAULT TRUE,
      season_summer BOOLEAN DEFAULT TRUE,
      season_autumn BOOLEAN DEFAULT TRUE,
      season_winter BOOLEAN DEFAULT TRUE,
      
      -- Types de repas
      meal_breakfast BOOLEAN DEFAULT FALSE,
      meal_lunch BOOLEAN DEFAULT TRUE,
      meal_dinner BOOLEAN DEFAULT TRUE,
      meal_snack BOOLEAN DEFAULT FALSE,
      
      -- Régimes alimentaires
      is_vegetarian BOOLEAN DEFAULT FALSE,
      is_vegan BOOLEAN DEFAULT FALSE,
      is_gluten_free BOOLEAN DEFAULT FALSE,
      
      -- Informations supplémentaires
      chef_tips TEXT,
      serving_suggestions TEXT,
      
      -- Source et attribution
      source_name VARCHAR(200),
      author_name VARCHAR(200),
      
      -- Système
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Index et contraintes
      UNIQUE(slug),
      CHECK (servings > 0),
      CHECK (prep_min >= 0),
      CHECK (cook_min >= 0)
    );

    -- Créer les index pour les performances
    CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine_type_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty_level_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_vegetarian ON recipes(is_vegetarian);
    CREATE INDEX IF NOT EXISTS idx_recipes_seasons ON recipes(season_spring, season_summer, season_autumn, season_winter);
    
  END IF;
END $$;

-- 2. Insérer les recettes depuis le fichier JSON généré
-- Note : Cette partie sera exécutée via un script Node.js pour lire le JSON

COMMENT ON TABLE recipes IS 'Table principale des 500 recettes Myko avec métadonnées complètes';
COMMENT ON COLUMN recipes.estimated_cost IS 'Coût estimé par portion en euros';
COMMENT ON COLUMN recipes.budget_category IS 'Catégorie budgétaire: economique, moyen, cher';
COMMENT ON COLUMN recipes.skill_level IS 'Niveau requis: debutant, intermediaire, avance, expert';

-- Message de succès
SELECT 'Structure de base créée avec succès !' as status;