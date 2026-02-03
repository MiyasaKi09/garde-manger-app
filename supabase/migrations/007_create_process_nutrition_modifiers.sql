-- =============================================================================
-- Migration 007: Process Nutrition Modifiers Table
-- Date: 2026-02-03
-- Description: Create table to store nutritional modification rules based on
--              archetype transformation processes (drying, concentration, etc.)
-- =============================================================================

-- Create process_nutrition_modifiers table
CREATE TABLE IF NOT EXISTS process_nutrition_modifiers (
  id BIGSERIAL PRIMARY KEY,

  -- Pattern matching for archetype.process column
  process_pattern TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'DRYING',           -- Séchage, déshydratation, poudre (8x concentration)
    'CONCENTRATION',    -- Évaporation, réduction (2-3x concentration)
    'FERMENTATION',     -- Fermentation lactique (légère concentration)
    'AGING',            -- Affinage fromages (3-4x concentration)
    'MECHANICAL',       -- Hachage, découpe (aucun changement)
    'PRESERVATION',     -- Fumage, congélation (perte vitamines mineure)
    'FAT_SEPARATION'    -- Barattage, écrémage (nécessite override direct)
  )),

  -- Modifications nutritionnelles
  nutrient_name TEXT NOT NULL,  -- 'proteines', 'glucides', 'lipides', 'calories', etc.
  factor_type TEXT NOT NULL CHECK (factor_type IN ('RETENTION', 'MULTIPLICATION', 'CONCENTRATION')),
  factor_value NUMERIC NOT NULL CHECK (factor_value >= 0),

  -- Métadonnées et documentation
  description TEXT,
  priority INTEGER DEFAULT 100,  -- Plus haut = appliqué en premier en cas de conflit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_pattern_nutrient UNIQUE (process_pattern, nutrient_name)
);

-- Indexes pour performance
CREATE INDEX idx_process_nutrition_modifiers_pattern ON process_nutrition_modifiers(process_pattern);
CREATE INDEX idx_process_nutrition_modifiers_category ON process_nutrition_modifiers(category);
CREATE INDEX idx_process_nutrition_modifiers_nutrient ON process_nutrition_modifiers(nutrient_name);

-- Commentaires
COMMENT ON TABLE process_nutrition_modifiers IS 'Règles de modification nutritionnelle basées sur les processus de transformation des archétypes';
COMMENT ON COLUMN process_nutrition_modifiers.process_pattern IS 'Pattern regex pour matcher archetype.process (ex: "séchage|déshydrat|poudre")';
COMMENT ON COLUMN process_nutrition_modifiers.factor_type IS 'RETENTION = fraction conservée (0-1), MULTIPLICATION = multiplicateur direct (>0)';
COMMENT ON COLUMN process_nutrition_modifiers.factor_value IS 'Valeur du facteur à appliquer aux valeurs nutritionnelles de base';
COMMENT ON COLUMN process_nutrition_modifiers.priority IS 'Priorité en cas de patterns multiples matchant (plus haut = prioritaire)';
