-- Nouvelle structure inventory_lots pour le garde-manger (VERSION FINALE CORRIGÉE)
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer l'ancienne table si elle existe (ATTENTION: cela supprime toutes les données)
DROP TABLE IF EXISTS inventory_lots CASCADE;
DROP VIEW IF EXISTS pantry_view CASCADE;
DROP VIEW IF EXISTS pantry CASCADE; -- au cas où l'ancienne vue existe

-- 2. Créer la nouvelle table inventory_lots
CREATE TABLE inventory_lots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Référence flexible vers différents types de produits
  product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('canonical', 'cultivar', 'archetype', 'custom')),
  product_id BIGINT, -- Compatible avec les tables existantes qui utilisent BIGINT
  
  -- Informations sur le lot
  qty_remaining DECIMAL(10,3) NOT NULL DEFAULT 0,
  initial_qty DECIMAL(10,3) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'unités',
  
  -- Stockage
  storage_method VARCHAR(20) NOT NULL DEFAULT 'pantry' CHECK (storage_method IN ('pantry', 'fridge', 'freezer')),
  storage_place VARCHAR(100) DEFAULT 'Garde-manger',
  
  -- Dates
  acquired_on DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE,
  
  -- Métadonnées
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Créer les index pour les performances
CREATE INDEX idx_inventory_lots_user_id ON inventory_lots(user_id);
CREATE INDEX idx_inventory_lots_product ON inventory_lots(product_type, product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_inventory_lots_storage ON inventory_lots(storage_method);
CREATE INDEX idx_inventory_lots_expiration ON inventory_lots(expiration_date);

-- 4. Créer un trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_inventory_lots_updated_at 
BEFORE UPDATE ON inventory_lots 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Créer une vue enrichie pour l'affichage (remplace l'ancienne vue "pantry")
CREATE OR REPLACE VIEW pantry_view AS
SELECT 
  il.id,
  il.qty_remaining,
  il.initial_qty,
  il.unit,
  il.storage_method,
  il.storage_place,
  il.acquired_on,
  il.expiration_date,
  il.notes,
  il.user_id,
  il.created_at,
  il.updated_at,
  
  -- Nom du produit selon le type (colonnes corrigées)
  CASE 
    WHEN il.product_type = 'canonical' THEN cf.canonical_name
    WHEN il.product_type = 'cultivar' THEN cv.cultivar_name
    WHEN il.product_type = 'archetype' THEN arch.name
    WHEN il.product_type = 'custom' THEN il.notes
    ELSE 'Produit inconnu'
  END AS product_name,
  
  -- Catégorie
  CASE 
    WHEN il.product_type = 'canonical' THEN cf.category_id
    WHEN il.product_type = 'cultivar' THEN cf_cv.category_id
    WHEN il.product_type = 'archetype' THEN cf_arch.category_id
    ELSE NULL
  END AS category_id,
  
  -- Nom de catégorie
  rc.name AS category_name,
  
  -- Informations sur l'expiration
  CASE 
    WHEN il.expiration_date IS NULL THEN 'no_date'
    WHEN il.expiration_date < CURRENT_DATE THEN 'expired'
    WHEN il.expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'expiring_soon'
    ELSE 'good'
  END AS expiration_status,
  
  CASE 
    WHEN il.expiration_date IS NULL THEN NULL
    ELSE il.expiration_date - CURRENT_DATE
  END AS days_until_expiration

FROM inventory_lots il
-- Jointures avec les vraies colonnes
LEFT JOIN canonical_foods cf ON (il.product_type = 'canonical' AND il.product_id = cf.id)
LEFT JOIN cultivars cv ON (il.product_type = 'cultivar' AND il.product_id = cv.id)
LEFT JOIN canonical_foods cf_cv ON (il.product_type = 'cultivar' AND cv.canonical_food_id = cf_cv.id)
LEFT JOIN archetypes arch ON (il.product_type = 'archetype' AND il.product_id = arch.id)
LEFT JOIN canonical_foods cf_arch ON (il.product_type = 'archetype' AND arch.canonical_food_id = cf_arch.id)
LEFT JOIN reference_categories rc ON (
  CASE 
    WHEN il.product_type = 'canonical' THEN cf.category_id
    WHEN il.product_type = 'cultivar' THEN cf_cv.category_id
    WHEN il.product_type = 'archetype' THEN cf_arch.category_id
    ELSE NULL
  END = rc.id
);

-- 6. Créer une vue alternative simple si les jointures échouent
CREATE OR REPLACE VIEW pantry AS
SELECT 
  il.*,
  -- Nom simplifié du produit
  CASE 
    WHEN il.product_type = 'custom' THEN il.notes
    ELSE CONCAT(il.product_type, '_', il.product_id)
  END AS product_name,
  
  -- Informations sur l'expiration
  CASE 
    WHEN il.expiration_date IS NULL THEN 'no_date'
    WHEN il.expiration_date < CURRENT_DATE THEN 'expired'
    WHEN il.expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'expiring_soon'
    ELSE 'good'
  END AS expiration_status,
  
  CASE 
    WHEN il.expiration_date IS NULL THEN NULL
    ELSE il.expiration_date - CURRENT_DATE
  END AS days_until_expiration

FROM inventory_lots il;

-- 7. Activer RLS (Row Level Security)
ALTER TABLE inventory_lots ENABLE ROW LEVEL SECURITY;

-- 8. Politique de sécurité : les utilisateurs ne voient que leurs propres lots
CREATE POLICY "Users can view their own inventory lots" ON inventory_lots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory lots" ON inventory_lots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory lots" ON inventory_lots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory lots" ON inventory_lots
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Donner les permissions aux vues
GRANT SELECT ON pantry_view TO authenticated;
GRANT SELECT ON pantry TO authenticated;

-- 10. Ajouter quelques données de test (optionnel)
-- Décommentez ces lignes pour avoir des données de test
/*
INSERT INTO inventory_lots (product_type, product_id, qty_remaining, initial_qty, unit, storage_method, storage_place, expiration_date, user_id)
VALUES 
  ('canonical', 1001, 5.0, 5.0, 'unités', 'fridge', 'Réfrigérateur', CURRENT_DATE + INTERVAL '2 days', auth.uid()),
  ('canonical', 1002, 3.0, 3.0, 'unités', 'pantry', 'Garde-manger', CURRENT_DATE + INTERVAL '5 days', auth.uid()),
  ('cultivar', 52, 2.0, 2.0, 'unités', 'pantry', 'Garde-manger', CURRENT_DATE + INTERVAL '3 days', auth.uid());
*/

-- 11. Vérifier que tout fonctionne
-- Vous pouvez exécuter ces requêtes pour tester :
-- SELECT * FROM pantry_view LIMIT 5;
-- SELECT * FROM pantry LIMIT 5;

COMMENT ON TABLE inventory_lots IS 'Table des lots d''inventaire du garde-manger avec support flexible des types de produits (BIGINT compatibility)';
COMMENT ON VIEW pantry_view IS 'Vue enrichie pour l''affichage du garde-manger avec informations de produit et catégorie';
COMMENT ON VIEW pantry IS 'Vue simple de fallback pour l''inventaire';

-- Fin du script