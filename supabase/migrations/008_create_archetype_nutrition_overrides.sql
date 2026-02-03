-- =============================================================================
-- Migration 008: Archetype Nutrition Overrides Table
-- Date: 2026-02-03
-- Description: Create table to store direct CIQUAL links for archetypes with
--              complex transformations that cannot be handled by simple modifiers
--              (e.g., butter, aged cheeses, specific cream percentages)
-- =============================================================================

-- Create archetype_nutrition_overrides table
CREATE TABLE IF NOT EXISTS archetype_nutrition_overrides (
  archetype_id BIGINT PRIMARY KEY REFERENCES archetypes(id) ON DELETE CASCADE,
  nutrition_id BIGINT NOT NULL REFERENCES nutritional_data(id) ON DELETE RESTRICT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_archetype_nutrition_overrides_nutrition_id ON archetype_nutrition_overrides(nutrition_id);

-- Commentaires
COMMENT ON TABLE archetype_nutrition_overrides IS 'Liens directs entre archetypes et nutritional_data pour cas complexes nécessitant codes CIQUAL spécifiques';
COMMENT ON COLUMN archetype_nutrition_overrides.archetype_id IS 'ID de l''archetype qui reçoit un override nutritionnel direct';
COMMENT ON COLUMN archetype_nutrition_overrides.nutrition_id IS 'ID nutritional_data CIQUAL spécifique à utiliser au lieu de l''héritage canonique';
COMMENT ON COLUMN archetype_nutrition_overrides.reason IS 'Raison de l''override (ex: "Beurre - transformation trop complexe pour modificateur")';
