-- Phase 1 — lien ingrédients des recettes Myko ↔ entités d'inventaire.
-- Table dédiée (alignée sur "generated_recipes = catalogue"), zéro impact
-- sur recipe_ingredients (legacy catalogue statique).
-- Appliquée en prod via Supabase migration le 2026-05-18.

CREATE TABLE IF NOT EXISTS public.generated_recipe_ingredients (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  generated_recipe_id bigint NOT NULL REFERENCES public.generated_recipes(id) ON DELETE CASCADE,
  raw_name text NOT NULL,
  quantity numeric,
  unit text,
  notes text,
  canonical_food_id bigint REFERENCES public.canonical_foods(id),
  archetype_id bigint REFERENCES public.archetypes(id),
  match_status text NOT NULL DEFAULT 'unmatched',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gri_not_both_entities CHECK (NOT (canonical_food_id IS NOT NULL AND archetype_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_gri_recipe ON public.generated_recipe_ingredients(generated_recipe_id);
CREATE INDEX IF NOT EXISTS idx_gri_canonical ON public.generated_recipe_ingredients(canonical_food_id);
CREATE INDEX IF NOT EXISTS idx_gri_archetype ON public.generated_recipe_ingredients(archetype_id);
