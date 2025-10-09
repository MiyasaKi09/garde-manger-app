-- ============================================
-- SCRIPT: Correction des relations Supabase
-- Description: Corriger les clés étrangères et relations manquantes
-- ============================================

-- 1. Vérifier l'état actuel des tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('recipe_ingredients', 'canonical_foods', 'recipes')
ORDER BY table_name, ordinal_position;

-- 2. Supprimer les contraintes existantes si elles existent (pour éviter les conflits)
ALTER TABLE IF EXISTS recipe_ingredients 
DROP CONSTRAINT IF EXISTS recipe_ingredients_recipe_id_fkey;

ALTER TABLE IF EXISTS recipe_ingredients 
DROP CONSTRAINT IF EXISTS recipe_ingredients_canonical_food_id_fkey;

-- 3. S'assurer que les colonnes existent avec les bons types
-- Vérifier que canonical_food_id existe dans recipe_ingredients
DO $$
BEGIN
    -- Ajouter la colonne si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' 
        AND column_name = 'canonical_food_id'
    ) THEN
        ALTER TABLE recipe_ingredients 
        ADD COLUMN canonical_food_id INTEGER;
    END IF;
END $$;

-- 4. Créer les contraintes de clés étrangères
-- Relation recipe_ingredients -> recipes
ALTER TABLE recipe_ingredients 
ADD CONSTRAINT recipe_ingredients_recipe_id_fkey 
FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;

-- Relation recipe_ingredients -> canonical_foods
ALTER TABLE recipe_ingredients 
ADD CONSTRAINT recipe_ingredients_canonical_food_id_fkey 
FOREIGN KEY (canonical_food_id) REFERENCES canonical_foods(id) ON DELETE SET NULL;

-- 5. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id 
ON recipe_ingredients(recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_canonical_food_id 
ON recipe_ingredients(canonical_food_id);

-- 6. Vérifier que les relations sont bien créées
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'recipe_ingredients';

-- 7. Vérifier les données existantes
SELECT 
    'recipe_ingredients' as table_name,
    COUNT(*) as total_rows,
    COUNT(recipe_id) as with_recipe_id,
    COUNT(canonical_food_id) as with_canonical_food_id
FROM recipe_ingredients;

-- 8. Exemple de données pour test (optionnel)
-- Insérer une recette test si elle n'existe pas
INSERT INTO recipes (id, name, description, is_active, created_at)
VALUES (
    'd5c72246-a320-49f6-babc-4e0249de6402',
    'Recette de test',
    'Recette pour tester les relations',
    true,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Message de confirmation
SELECT 'Relations créées avec succès!' as status;