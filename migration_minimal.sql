-- Script de migration MINIMAL pour ajouter les colonnes de métadonnées
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Ajouter les colonnes manquantes à canonical_foods
ALTER TABLE canonical_foods 
ADD COLUMN IF NOT EXISTS density_g_per_ml DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS grams_per_unit DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS primary_unit VARCHAR(20);

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'canonical_foods' 
  AND column_name IN ('density_g_per_ml', 'grams_per_unit', 'primary_unit')
ORDER BY column_name;