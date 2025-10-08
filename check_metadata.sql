-- Script pour examiner les données de métadonnées disponibles dans la base

-- Vérifier l'existence des colonnes de métadonnées
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('canonical_foods', 'cultivars', 'archetypes')
  AND column_name IN ('density_g_per_ml', 'grams_per_unit', 'primary_unit')
ORDER BY table_name, column_name;

-- Examiner les données disponibles dans canonical_foods
SELECT 
  id,
  canonical_name,
  density_g_per_ml,
  grams_per_unit,
  primary_unit,
  CASE 
    WHEN density_g_per_ml IS NOT NULL THEN 'DENSITÉ'
    WHEN grams_per_unit IS NOT NULL THEN 'POIDS_UNITÉ'
    ELSE 'AUCUNE_META'
  END as type_metadata
FROM canonical_foods 
ORDER BY canonical_name;

-- Compter les produits avec métadonnées
SELECT 
  'canonical_foods' as table_name,
  COUNT(*) as total,
  COUNT(density_g_per_ml) as avec_densite,
  COUNT(grams_per_unit) as avec_poids_unitaire,
  COUNT(CASE WHEN density_g_per_ml IS NOT NULL OR grams_per_unit IS NOT NULL THEN 1 END) as avec_metadata
FROM canonical_foods
UNION ALL
SELECT 
  'cultivars' as table_name,
  COUNT(*) as total,
  COUNT(density_g_per_ml) as avec_densite, 
  COUNT(grams_per_unit) as avec_poids_unitaire,
  COUNT(CASE WHEN density_g_per_ml IS NOT NULL OR grams_per_unit IS NOT NULL THEN 1 END) as avec_metadata
FROM cultivars
UNION ALL
SELECT 
  'archetypes' as table_name,
  COUNT(*) as total,
  COUNT(density_g_per_ml) as avec_densite,
  COUNT(grams_per_unit) as avec_poids_unitaire, 
  COUNT(CASE WHEN density_g_per_ml IS NOT NULL OR grams_per_unit IS NOT NULL THEN 1 END) as avec_metadata
FROM archetypes;

-- Voir les lots dans inventory_lots et leurs types
SELECT 
  il.id,
  il.product_type,
  il.product_id,
  il.product_name,
  il.qty_remaining,
  il.unit,
  CASE il.product_type 
    WHEN 'canonical' THEN cf.canonical_name
    WHEN 'cultivar' THEN cv.cultivar_name  
    WHEN 'archetype' THEN ar.archetype_name
    ELSE il.notes
  END as real_name
FROM inventory_lots il
LEFT JOIN canonical_foods cf ON il.product_type = 'canonical' AND il.product_id = cf.id
LEFT JOIN cultivars cv ON il.product_type = 'cultivar' AND il.product_id = cv.id  
LEFT JOIN archetypes ar ON il.product_type = 'archetype' AND il.product_id = ar.id
ORDER BY il.id;