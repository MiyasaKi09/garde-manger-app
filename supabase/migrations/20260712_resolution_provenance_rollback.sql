-- ============================================================================
-- Rollback: 20260712_resolution_provenance_rollback.sql
-- ============================================================================
-- Annule 20260712_resolution_provenance.sql :
--   1. Restaure la RPC replace_generated_recipe_ingredients en v1 (Vague 1,
--      sans les colonnes de provenance).
--   2. Supprime les contraintes CHECK, index et colonnes ajoutées.
--
-- Idempotent : DROP ... IF EXISTS partout.
-- ============================================================================


-- ============================================================================
-- 1. RPC — restaurer la v1 (20260711_cooking_sessions.sql)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.replace_generated_recipe_ingredients(
  p_recipe_id bigint,
  p_rows      jsonb
)
RETURNS int
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_count int := 0;
  v_row   jsonb;
BEGIN
  -- Vérifier que la recette appartient à l'utilisateur courant
  IF NOT EXISTS (
    SELECT 1 FROM public.generated_recipes
     WHERE id      = p_recipe_id
       AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION
      'Recette générée introuvable ou non autorisée : %', p_recipe_id;
  END IF;

  -- Supprimer les ingrédients existants
  DELETE FROM public.generated_recipe_ingredients
   WHERE generated_recipe_id = p_recipe_id;

  -- Insérer les nouveaux ingrédients
  FOR v_row IN
    SELECT * FROM jsonb_array_elements(COALESCE(p_rows, '[]'::jsonb))
  LOOP
    INSERT INTO public.generated_recipe_ingredients (
      generated_recipe_id,
      raw_name,
      quantity,
      unit,
      notes,
      canonical_food_id,
      archetype_id,
      match_status
    ) VALUES (
      p_recipe_id,
      v_row->>'raw_name',
      (v_row->>'quantity')::numeric,
      v_row->>'unit',
      v_row->>'notes',
      (v_row->>'canonical_food_id')::bigint,
      (v_row->>'archetype_id')::bigint,
      COALESCE(v_row->>'match_status', 'unmatched')
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;


-- ============================================================================
-- 2. generated_recipes.status
-- ============================================================================
ALTER TABLE public.generated_recipes
  DROP CONSTRAINT IF EXISTS generated_recipes_status_check;
ALTER TABLE public.generated_recipes
  DROP COLUMN IF EXISTS status;


-- ============================================================================
-- 3. nutrition_plan_shopping_items
-- ============================================================================
DROP INDEX IF EXISTS public.idx_npsi_review_status;
ALTER TABLE public.nutrition_plan_shopping_items
  DROP CONSTRAINT IF EXISTS npsi_review_status_check;
ALTER TABLE public.nutrition_plan_shopping_items
  DROP COLUMN IF EXISTS match_confidence,
  DROP COLUMN IF EXISTS resolution_source,
  DROP COLUMN IF EXISTS resolved_at,
  DROP COLUMN IF EXISTS review_status;


-- ============================================================================
-- 4. generated_recipe_ingredients
-- ============================================================================
DROP INDEX IF EXISTS public.idx_gri_review_status;
ALTER TABLE public.generated_recipe_ingredients
  DROP CONSTRAINT IF EXISTS gri_review_status_check;
ALTER TABLE public.generated_recipe_ingredients
  DROP COLUMN IF EXISTS match_confidence,
  DROP COLUMN IF EXISTS resolution_source,
  DROP COLUMN IF EXISTS resolved_at,
  DROP COLUMN IF EXISTS review_status;
