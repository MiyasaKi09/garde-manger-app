-- Fusion des canoniques en doublon (appliquée en base le 2026-06-11) :
--   boeuf(2002)→bœuf(14011), oeuf(2040)→œuf(14027),
--   sésame(25)→graine de sésame(14020), grenoble(47)→noix(11005).
-- Toutes les références (archetypes, lots, recettes, allergies, courses,
-- processes, origines, saisonnalité) sont repointées ; le nom du doublon
-- devient un mot-clé du canonique conservé (le resolver continue de matcher).
DO $$
DECLARE
  pair record;
BEGIN
  FOR pair IN SELECT * FROM (VALUES (14011,2002),(14027,2040),(14020,25),(11005,47)) AS t(keep_id, dup_id)
  LOOP
    UPDATE archetypes SET canonical_food_id = pair.keep_id WHERE canonical_food_id = pair.dup_id;
    UPDATE inventory_lots SET canonical_food_id = pair.keep_id WHERE canonical_food_id = pair.dup_id;
    UPDATE recipe_ingredients SET canonical_food_id = pair.keep_id WHERE canonical_food_id = pair.dup_id;
    UPDATE generated_recipe_ingredients SET canonical_food_id = pair.keep_id WHERE canonical_food_id = pair.dup_id;
    UPDATE cultivars SET canonical_food_id = pair.keep_id WHERE canonical_food_id = pair.dup_id;
    UPDATE user_allergies SET canonical_food_id = pair.keep_id WHERE canonical_food_id = pair.dup_id;
    UPDATE nutrition_plan_shopping_items SET canonical_food_id = pair.keep_id WHERE canonical_food_id = pair.dup_id;
    UPDATE canonical_food_processes SET food_id = pair.keep_id WHERE food_id = pair.dup_id
      AND NOT EXISTS (SELECT 1 FROM canonical_food_processes p2 WHERE p2.food_id = pair.keep_id AND p2.process_id = canonical_food_processes.process_id);
    DELETE FROM canonical_food_processes WHERE food_id = pair.dup_id;
    UPDATE canonical_food_origins SET food_id = pair.keep_id WHERE food_id = pair.dup_id
      AND NOT EXISTS (SELECT 1 FROM canonical_food_origins o2 WHERE o2.food_id = pair.keep_id AND o2.country_id = canonical_food_origins.country_id);
    DELETE FROM canonical_food_origins WHERE food_id = pair.dup_id;
    UPDATE seasonality SET food_id = pair.keep_id WHERE food_id = pair.dup_id
      AND NOT EXISTS (SELECT 1 FROM seasonality s2 WHERE s2.food_id = pair.keep_id);
    DELETE FROM seasonality WHERE food_id = pair.dup_id;
    UPDATE canonical_foods k
    SET keywords = (
      SELECT array_agg(DISTINCT kw) FROM unnest(
        coalesce(k.keywords, '{}') || coalesce(d.keywords, '{}') || ARRAY[d.canonical_name]
      ) AS kw
    )
    FROM canonical_foods d
    WHERE k.id = pair.keep_id AND d.id = pair.dup_id;
    DELETE FROM canonical_foods WHERE id = pair.dup_id;
  END LOOP;
END $$;
