-- ============================================================================
-- ENRICHISSEMENT INTELLIGENT DE TOUTES LES RECETTES
-- Date: 2025-10-20
-- Total: 6 recettes
-- ============================================================================

BEGIN;

-- Overnight porridge aux graines de chia et fruits rouges (Trempage 8h)
UPDATE recipes SET 
  prep_time_minutes = 10, 
  cook_time_minutes = 480, 
  servings = 2, 
  cooking_method = 'Sans cuisson', 
  is_complete_meal = FALSE, 
  needs_side_dish = NULL 
WHERE id = 2;

-- Porridge salé aux épinards, feta et œuf mollet (Version salée)
UPDATE recipes SET 
  prep_time_minutes = 10, 
  cook_time_minutes = 15, 
  servings = 2, 
  cooking_method = 'Mijotage', 
  is_complete_meal = TRUE, 
  needs_side_dish = FALSE 
WHERE id = 3;

-- Pudding de chia au lait de coco et coulis de mangue (Trempage 4h)
UPDATE recipes SET 
  prep_time_minutes = 10, 
  cook_time_minutes = 240, 
  servings = 4, 
  cooking_method = 'Sans cuisson', 
  is_complete_meal = FALSE, 
  needs_side_dish = NULL 
WHERE id = 6;

-- Granola maison aux noix de pécan et sirop d'érable (Four)
UPDATE recipes SET 
  prep_time_minutes = 10, 
  cook_time_minutes = 30, 
  servings = 8, 
  cooking_method = 'Cuisson au four', 
  is_complete_meal = FALSE, 
  needs_side_dish = NULL 
WHERE id = 7;

-- Muesli Bircher aux pommes râpées et noisettes (Trempage)
UPDATE recipes SET 
  prep_time_minutes = 10, 
  cook_time_minutes = 480, 
  servings = 4, 
  cooking_method = 'Sans cuisson', 
  is_complete_meal = FALSE, 
  needs_side_dish = NULL 
WHERE id = 8;

-- Pancakes américains fluffy au sirop d'érable (Poêle)
UPDATE recipes SET 
  prep_time_minutes = 10, 
  cook_time_minutes = 15, 
  servings = 4, 
  cooking_method = 'Poêle', 
  is_complete_meal = FALSE, 
  needs_side_dish = NULL 
WHERE id = 9;

COMMIT;

-- ✅ ENRICHISSEMENT TERMINÉ
