-- Migration: Ajouter colonnes IDs, notes et conditionnement sur nutrition_plan_shopping_items
-- Objectifs :
--   1. Lier les articles de courses à la hiérarchie ingrédients (canonical_food_id, archetype_id)
--      pour remplacer le matching par nom (string) par un matching par ID fiable.
--   2. Stocker des notes de variétés (ex: "Charlotte, Monalisa") pour la consolidation.
--   3. Permettre de préciser le conditionnement (ex: 3 bouteilles de 1L) pour créer
--      le bon nombre de lots dans inventory_lots avec la bonne taille de contenant.

-- IDs ingrédients
ALTER TABLE nutrition_plan_shopping_items
  ADD COLUMN IF NOT EXISTS canonical_food_id BIGINT REFERENCES canonical_foods(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archetype_id      BIGINT REFERENCES archetypes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes             TEXT;

-- Conditionnement
ALTER TABLE nutrition_plan_shopping_items
  ADD COLUMN IF NOT EXISTS container_qty  INTEGER,
  ADD COLUMN IF NOT EXISTS container_size NUMERIC,
  ADD COLUMN IF NOT EXISTS container_unit TEXT;

-- Index pour les lookups par ingredient
CREATE INDEX IF NOT EXISTS idx_npsi_canonical_food ON nutrition_plan_shopping_items(canonical_food_id) WHERE canonical_food_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_npsi_archetype      ON nutrition_plan_shopping_items(archetype_id)      WHERE archetype_id IS NOT NULL;
