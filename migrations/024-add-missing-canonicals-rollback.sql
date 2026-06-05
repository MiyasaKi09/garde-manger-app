-- Rollback migration 024: retire les canoniques ajoutés.
-- Sûr : ne supprime que si AUCUN lot d'inventaire, ingrédient de recette ou
-- ingrédient de recette générée n'y fait référence (évite les violations de FK
-- et la perte de données utilisateur).

DELETE FROM canonical_foods cf
WHERE cf.canonical_name IN (
  'pâtes','boulgour','semoule','naan','nachos','tofu','halloumi','chorizo','guanciale',
  'lieu jaune','sésame','tahini','saindoux','mayonnaise','ketchup','pesto','câpres',
  'gochujang','mirin','nuoc-mâm','kimchi','harissa','ras el-hanout','herbes de Provence',
  'galanga','combava'
)
AND cf.nutrition_id IS NULL
AND NOT EXISTS (SELECT 1 FROM inventory_lots il WHERE il.canonical_food_id = cf.id)
AND NOT EXISTS (SELECT 1 FROM recipe_ingredients ri WHERE ri.canonical_food_id = cf.id)
AND NOT EXISTS (SELECT 1 FROM generated_recipe_ingredients gri WHERE gri.canonical_food_id = cf.id)
AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.canonical_food_id = cf.id);
