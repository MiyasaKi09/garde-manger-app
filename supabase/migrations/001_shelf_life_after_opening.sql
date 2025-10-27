-- Migration 001: Gestion DLC après ouverture
-- Date: 2025-10-27
-- Description: Ajout des colonnes pour tracker l'ouverture des produits et la DLC ajustée

-- Ajout des colonnes à inventory_lots
ALTER TABLE inventory_lots
ADD COLUMN IF NOT EXISTS adjusted_expiration_date DATE,
ADD COLUMN IF NOT EXISTS is_opened BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP;

-- Index pour améliorer les performances des requêtes sur la DLC ajustée
CREATE INDEX IF NOT EXISTS idx_inventory_lots_adjusted_exp 
ON inventory_lots(adjusted_expiration_date) 
WHERE adjusted_expiration_date IS NOT NULL;

-- Index pour filtrer les lots ouverts
CREATE INDEX IF NOT EXISTS idx_inventory_lots_is_opened 
ON inventory_lots(is_opened) 
WHERE is_opened = TRUE;

-- Commentaires pour documentation
COMMENT ON COLUMN inventory_lots.adjusted_expiration_date IS 
'Date de péremption recalculée après ouverture du produit (ex: lait ouvert = DLC originale - 7 jours)';

COMMENT ON COLUMN inventory_lots.is_opened IS 
'Indique si le produit a été ouvert (bouteille, paquet, bocal, etc.)';

COMMENT ON COLUMN inventory_lots.opened_at IS 
'Timestamp précis de l''ouverture du produit pour calculs de fraîcheur';

-- Fonction trigger pour valider que adjusted_expiration_date <= expiration_date
CREATE OR REPLACE FUNCTION validate_adjusted_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.adjusted_expiration_date IS NOT NULL 
     AND NEW.expiration_date IS NOT NULL 
     AND NEW.adjusted_expiration_date > NEW.expiration_date THEN
    RAISE EXCEPTION 'La DLC ajustée ne peut pas être supérieure à la DLC originale';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_adjusted_expiration
BEFORE INSERT OR UPDATE ON inventory_lots
FOR EACH ROW
EXECUTE FUNCTION validate_adjusted_expiration();

-- Vue pour faciliter les requêtes sur la "vraie" DLC (prend en compte l'ajustement)
CREATE OR REPLACE VIEW inventory_lots_with_effective_dlc AS
SELECT 
  il.*,
  COALESCE(il.adjusted_expiration_date, il.expiration_date) as effective_expiration_date,
  CASE 
    WHEN il.adjusted_expiration_date IS NOT NULL THEN 
      il.adjusted_expiration_date - CURRENT_DATE
    WHEN il.expiration_date IS NOT NULL THEN
      il.expiration_date - CURRENT_DATE
    ELSE NULL
  END as days_until_expiration
FROM inventory_lots il;

COMMENT ON VIEW inventory_lots_with_effective_dlc IS 
'Vue avec DLC effective (ajustée si ouverte, sinon originale) et jours restants calculés';
