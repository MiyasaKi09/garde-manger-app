-- Script de migration simple pour ajouter les colonnes de métadonnées
-- Exécutez ce script dans votre base de données Supabase

-- Ajouter les colonnes aux tables cultivars et archetypes
ALTER TABLE cultivars 
ADD COLUMN IF NOT EXISTS density_g_per_ml DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS grams_per_unit DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS primary_unit VARCHAR(20);

ALTER TABLE archetypes
ADD COLUMN IF NOT EXISTS density_g_per_ml DECIMAL(6,3),
ADD COLUMN IF NOT EXISTS grams_per_unit DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS primary_unit VARCHAR(20);

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('cultivars', 'archetypes') 
  AND column_name IN ('density_g_per_ml', 'grams_per_unit', 'primary_unit')
ORDER BY table_name, column_name;