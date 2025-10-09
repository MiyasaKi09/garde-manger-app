-- Script pour créer la recette manquante avec l'ID spécifique
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si la recette existe
SELECT COUNT(*) as existe FROM recipes WHERE id = 'd5c72246-a320-49f6-babc-4e0249de6402';

-- 2. Créer la recette si elle n'existe pas
INSERT INTO recipes (
    id,
    name,
    description,
    short_description,
    prep_min,
    cook_min,
    rest_min,
    servings,
    instructions,
    chef_tips,
    is_vegetarian,
    is_vegan,
    is_gluten_free,
    myko_score,
    is_active,
    created_at,
    updated_at
) VALUES (
    'd5c72246-a320-49f6-babc-4e0249de6402',
    'Ratatouille provençale',
    'Un délicieux mijoté de légumes du soleil, parfait pour l''été. Cette recette traditionnelle met en valeur les saveurs méditerranéennes.',
    'Mijoté de légumes du soleil : aubergines, courgettes, tomates, poivrons',
    30,
    60,
    0,
    6,
    '1. Couper tous les légumes en dés. Faire revenir séparément aubergines, courgettes, poivrons. Ajouter les tomates, l''ail, les herbes de Provence. Mijoter 45 min.',
    'Cuire les légumes séparément d''abord pour une meilleure texture',
    true,
    true,
    true,
    95,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 3. Vérifier que la recette a été créée
SELECT * FROM recipes WHERE id = 'd5c72246-a320-49f6-babc-4e0249de6402';