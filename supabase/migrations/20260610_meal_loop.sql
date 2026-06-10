-- Boucle repas → restes → planning (juin 2026)
-- 1. Nutrition par portion sur les plats cuisinés/restes : permet de loguer
--    correctement la nutrition quand on mange un reste, et d'ajuster le planning.
-- 2. Traçabilité des lots créés depuis la liste de courses : permet de retirer
--    proprement le lot du stock si l'article est décoché.

ALTER TABLE cooked_dishes ADD COLUMN IF NOT EXISTS kcal_per_portion numeric;
ALTER TABLE cooked_dishes ADD COLUMN IF NOT EXISTS protein_g_per_portion numeric;
ALTER TABLE cooked_dishes ADD COLUMN IF NOT EXISTS carbs_g_per_portion numeric;
ALTER TABLE cooked_dishes ADD COLUMN IF NOT EXISTS fat_g_per_portion numeric;
ALTER TABLE cooked_dishes ADD COLUMN IF NOT EXISTS fiber_g_per_portion numeric;
ALTER TABLE cooked_dishes ADD COLUMN IF NOT EXISTS source_meal_type text;

ALTER TABLE nutrition_plan_shopping_items ADD COLUMN IF NOT EXISTS created_lot_ids uuid[];
