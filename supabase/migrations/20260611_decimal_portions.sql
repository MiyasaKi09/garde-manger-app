-- Portions décimales sur les plats cuisinés/restes : permet « il reste 1,5 portion ».
-- Les vues et le trigger dépendants sont recréés à l'identique.
DROP VIEW IF EXISTS cooked_dishes_active;
DROP VIEW IF EXISTS cooked_dishes_stats;
DROP TRIGGER IF EXISTS trigger_mark_consumed ON cooked_dishes;
ALTER TABLE cooked_dishes ALTER COLUMN portions_cooked TYPE numeric USING portions_cooked::numeric;
ALTER TABLE cooked_dishes ALTER COLUMN portions_remaining TYPE numeric USING portions_remaining::numeric;
CREATE TRIGGER trigger_mark_consumed BEFORE UPDATE ON public.cooked_dishes
  FOR EACH ROW WHEN ((old.portions_remaining IS DISTINCT FROM new.portions_remaining))
  EXECUTE FUNCTION mark_cooked_dish_consumed();
CREATE VIEW cooked_dishes_active AS
 SELECT cd.id, cd.user_id, cd.name, cd.recipe_id, cd.portions_cooked, cd.portions_remaining,
        cd.storage_method, cd.cooked_at, cd.expiration_date, cd.consumed_completely_at,
        cd.notes, cd.created_at, cd.updated_at,
        cd.expiration_date - CURRENT_DATE AS days_until_expiration,
        r.name AS recipe_name, count(cdi.id) AS ingredients_count
   FROM cooked_dishes cd
   LEFT JOIN recipes r ON cd.recipe_id = r.id
   LEFT JOIN cooked_dish_ingredients cdi ON cd.id = cdi.dish_id
  WHERE cd.portions_remaining > 0
  GROUP BY cd.id, r.name
  ORDER BY cd.expiration_date;
CREATE VIEW cooked_dishes_stats AS
 SELECT user_id,
    count(*) AS total_dishes_cooked,
    count(*) FILTER (WHERE portions_remaining > 0) AS dishes_with_leftovers,
    count(*) FILTER (WHERE portions_remaining = 0) AS dishes_fully_consumed,
    sum(portions_cooked) AS total_portions_cooked,
    sum(portions_remaining) AS total_portions_remaining,
    sum(portions_cooked - portions_remaining) AS total_portions_consumed,
    round(100.0 * sum(portions_cooked - portions_remaining)::numeric / NULLIF(sum(portions_cooked), 0)::numeric, 2) AS consumption_rate_percent
   FROM cooked_dishes
  GROUP BY user_id;
