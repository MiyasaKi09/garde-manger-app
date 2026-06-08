-- 20260608_batch_cooking_links.sql
-- Batch cooking « prépa à l'avance » : relie un repas à sa préparation,
-- ajoute le jour de cuisine et un nombre de portions chiffré.
-- Idempotent (IF NOT EXISTS). RLS inchangée (héritée via import_id → import.user_id).

-- 1) Le batch devient une vraie « préparation à l'avance »
ALTER TABLE nutrition_plan_batch_recipes
  ADD COLUMN IF NOT EXISTS cook_date date;          -- quand on cuisine ce lot (ex. le dimanche)
ALTER TABLE nutrition_plan_batch_recipes
  ADD COLUMN IF NOT EXISTS portions_total integer;  -- rendement chiffré (nb de portions produites)

-- 2) LE lien qui manquait : un repas est une portion d'une préparation
ALTER TABLE nutrition_plan_meals
  ADD COLUMN IF NOT EXISTS batch_recipe_id bigint
    REFERENCES nutrition_plan_batch_recipes(id) ON DELETE SET NULL;

-- 3) Index pour les requêtes « repas d'un batch » et « batchs d'une session »
CREATE INDEX IF NOT EXISTS idx_meals_batch_recipe
  ON nutrition_plan_meals(batch_recipe_id);
CREATE INDEX IF NOT EXISTS idx_batch_recipes_cook_date
  ON nutrition_plan_batch_recipes(import_id, cook_date);

-- Suivi des portions restantes = portions_total − (repas liés marqués « cuisiné »),
-- dérivé côté app depuis le journal nutrition (pas de colonne dédiée).
