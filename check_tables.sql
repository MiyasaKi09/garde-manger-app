-- Script pour vérifier la structure des tables existantes
-- À exécuter dans Supabase SQL Editor pour diagnostiquer les types

-- Vérifier la structure de canonical_foods
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'canonical_foods' 
AND column_name = 'id';

-- Vérifier la structure de cultivars
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cultivars' 
AND column_name = 'id';

-- Vérifier la structure de archetypes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'archetypes' 
AND column_name = 'id';

-- Vérifier la structure de reference_categories
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reference_categories' 
AND column_name = 'id';