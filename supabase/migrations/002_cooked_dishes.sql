-- Migration 002: Gestion des plats cuisinés
-- Date: 2025-10-27
-- Description: Tables pour tracker les plats préparés, leurs portions et ingrédients utilisés

-- ============================================================================
-- TABLE: cooked_dishes
-- ============================================================================
-- Stocke les plats cuisinés avec portions et DLC

CREATE TABLE IF NOT EXISTS cooked_dishes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations du plat
  name TEXT NOT NULL,
  recipe_id BIGINT REFERENCES recipes(id) ON DELETE SET NULL,
  
  -- Portions
  portions_cooked INTEGER NOT NULL CHECK (portions_cooked > 0),
  portions_remaining INTEGER NOT NULL CHECK (portions_remaining >= 0 AND portions_remaining <= portions_cooked),
  
  -- Stockage et dates
  storage_method TEXT NOT NULL CHECK (storage_method IN ('fridge', 'freezer', 'counter')),
  cooked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiration_date DATE NOT NULL,
  consumed_completely_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes optionnelles
  notes TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_cooked_dishes_user_id ON cooked_dishes(user_id);
CREATE INDEX idx_cooked_dishes_expiration ON cooked_dishes(expiration_date) 
  WHERE portions_remaining > 0;
CREATE INDEX idx_cooked_dishes_recipe_id ON cooked_dishes(recipe_id) 
  WHERE recipe_id IS NOT NULL;
CREATE INDEX idx_cooked_dishes_active ON cooked_dishes(user_id, portions_remaining) 
  WHERE portions_remaining > 0;

-- Commentaires
COMMENT ON TABLE cooked_dishes IS 
'Plats cuisinés avec tracking des portions restantes et DLC';

COMMENT ON COLUMN cooked_dishes.portions_cooked IS 
'Nombre total de portions cuisinées initialement';

COMMENT ON COLUMN cooked_dishes.portions_remaining IS 
'Nombre de portions restantes (0 = tout consommé)';

COMMENT ON COLUMN cooked_dishes.storage_method IS 
'Mode de stockage: fridge (3j), freezer (90j), counter (1j)';

COMMENT ON COLUMN cooked_dishes.consumed_completely_at IS 
'Timestamp quand toutes les portions ont été consommées';

-- ============================================================================
-- TABLE: cooked_dish_ingredients
-- ============================================================================
-- Trace quels ingrédients de l'inventaire ont été utilisés pour chaque plat

CREATE TABLE IF NOT EXISTS cooked_dish_ingredients (
  id BIGSERIAL PRIMARY KEY,
  dish_id BIGINT NOT NULL REFERENCES cooked_dishes(id) ON DELETE CASCADE,
  lot_id UUID REFERENCES inventory_lots(id) ON DELETE SET NULL,
  
  -- Quantité utilisée
  quantity_used DECIMAL(10, 2) NOT NULL CHECK (quantity_used > 0),
  unit TEXT NOT NULL,
  
  -- Nom du produit (si lot supprimé)
  product_name TEXT,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_cooked_dish_ingredients_dish_id ON cooked_dish_ingredients(dish_id);
CREATE INDEX idx_cooked_dish_ingredients_lot_id ON cooked_dish_ingredients(lot_id) 
  WHERE lot_id IS NOT NULL;

-- Commentaires
COMMENT ON TABLE cooked_dish_ingredients IS 
'Ingrédients utilisés pour chaque plat cuisiné (traçabilité)';

COMMENT ON COLUMN cooked_dish_ingredients.lot_id IS 
'Référence au lot d''inventaire utilisé (NULL si lot supprimé)';

COMMENT ON COLUMN cooked_dish_ingredients.product_name IS 
'Nom du produit sauvegardé pour historique même si lot supprimé';

-- ============================================================================
-- FONCTION: Mettre à jour updated_at automatiquement
-- ============================================================================

CREATE OR REPLACE FUNCTION update_cooked_dishes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cooked_dishes_updated_at
BEFORE UPDATE ON cooked_dishes
FOR EACH ROW
EXECUTE FUNCTION update_cooked_dishes_updated_at();

-- ============================================================================
-- FONCTION: Marquer comme complètement consommé quand portions = 0
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_cooked_dish_consumed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.portions_remaining = 0 AND OLD.portions_remaining > 0 THEN
    NEW.consumed_completely_at = NOW();
  ELSIF NEW.portions_remaining > 0 THEN
    NEW.consumed_completely_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_consumed
BEFORE UPDATE ON cooked_dishes
FOR EACH ROW
WHEN (OLD.portions_remaining IS DISTINCT FROM NEW.portions_remaining)
EXECUTE FUNCTION mark_cooked_dish_consumed();

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE cooked_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooked_dish_ingredients ENABLE ROW LEVEL SECURITY;

-- Policies pour cooked_dishes
CREATE POLICY "Users can view their own cooked dishes"
  ON cooked_dishes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cooked dishes"
  ON cooked_dishes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cooked dishes"
  ON cooked_dishes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cooked dishes"
  ON cooked_dishes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour cooked_dish_ingredients
CREATE POLICY "Users can view ingredients of their own dishes"
  ON cooked_dish_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cooked_dishes 
      WHERE cooked_dishes.id = cooked_dish_ingredients.dish_id 
        AND cooked_dishes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add ingredients to their own dishes"
  ON cooked_dish_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cooked_dishes 
      WHERE cooked_dishes.id = cooked_dish_ingredients.dish_id 
        AND cooked_dishes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients of their own dishes"
  ON cooked_dish_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cooked_dishes 
      WHERE cooked_dishes.id = cooked_dish_ingredients.dish_id 
        AND cooked_dishes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VUE: Plats actifs avec détails
-- ============================================================================

CREATE OR REPLACE VIEW cooked_dishes_active AS
SELECT 
  cd.*,
  cd.expiration_date - CURRENT_DATE AS days_until_expiration,
  r.name AS recipe_name,
  COUNT(cdi.id) AS ingredients_count
FROM cooked_dishes cd
LEFT JOIN recipes r ON cd.recipe_id = r.id
LEFT JOIN cooked_dish_ingredients cdi ON cd.id = cdi.dish_id
WHERE cd.portions_remaining > 0
GROUP BY cd.id, r.name
ORDER BY cd.expiration_date ASC;

COMMENT ON VIEW cooked_dishes_active IS 
'Plats cuisinés actifs (portions restantes > 0) avec détails de la recette et jours restants';

-- ============================================================================
-- VUE: Statistiques des plats cuisinés
-- ============================================================================

CREATE OR REPLACE VIEW cooked_dishes_stats AS
SELECT 
  user_id,
  COUNT(*) AS total_dishes_cooked,
  COUNT(*) FILTER (WHERE portions_remaining > 0) AS dishes_with_leftovers,
  COUNT(*) FILTER (WHERE portions_remaining = 0) AS dishes_fully_consumed,
  SUM(portions_cooked) AS total_portions_cooked,
  SUM(portions_remaining) AS total_portions_remaining,
  SUM(portions_cooked - portions_remaining) AS total_portions_consumed,
  ROUND(
    100.0 * SUM(portions_cooked - portions_remaining) / NULLIF(SUM(portions_cooked), 0),
    2
  ) AS consumption_rate_percent
FROM cooked_dishes
GROUP BY user_id;

COMMENT ON VIEW cooked_dishes_stats IS 
'Statistiques des plats cuisinés par utilisateur (portions cuisinées vs consommées)';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Vérifications finales
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 002 exécutée avec succès';
  RAISE NOTICE '   - Table cooked_dishes créée avec % colonnes', (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'cooked_dishes'
  );
  RAISE NOTICE '   - Table cooked_dish_ingredients créée avec % colonnes', (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'cooked_dish_ingredients'
  );
  RAISE NOTICE '   - % index créés', (
    SELECT COUNT(*) FROM pg_indexes 
    WHERE tablename IN ('cooked_dishes', 'cooked_dish_ingredients')
  );
  RAISE NOTICE '   - % triggers créés', (
    SELECT COUNT(*) FROM pg_trigger 
    WHERE tgrelid IN ('cooked_dishes'::regclass, 'cooked_dish_ingredients'::regclass)
      AND tgname NOT LIKE 'RI_%'
  );
  RAISE NOTICE '   - RLS activé sur 2 tables';
  RAISE NOTICE '   - 2 vues créées (cooked_dishes_active, cooked_dishes_stats)';
END $$;
