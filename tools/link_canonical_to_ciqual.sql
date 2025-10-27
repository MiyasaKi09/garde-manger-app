-- Lier les aliments de base (légumes) de canonical_foods aux codes Ciqual
-- À exécuter après restore_from_latest_export.sh ET reimport_ciqual_secure.sh

-- 1. Pomme de terre → 4003
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '4003')
WHERE LOWER(canonical_name) = 'pomme de terre' AND nutrition_id IS NULL;

-- 2. Tomate → 20047
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20047')
WHERE LOWER(canonical_name) = 'tomate' AND nutrition_id IS NULL;

-- 3. Carotte → 20008
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20008')
WHERE LOWER(canonical_name) = 'carotte' AND nutrition_id IS NULL;

-- 4. Oignon → 20034
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20034')
WHERE LOWER(canonical_name) = 'oignon' AND nutrition_id IS NULL;

-- 5. Échalote → 20068
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20068')
WHERE LOWER(canonical_name) = 'échalote' AND nutrition_id IS NULL;

-- 6. Ail → 11000
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11000')
WHERE LOWER(canonical_name) = 'ail' AND nutrition_id IS NULL;

-- 7. Poireau → 20043
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20043')
WHERE LOWER(canonical_name) = 'poireau' AND nutrition_id IS NULL;

-- 8. Courgette → 20041
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20041')
WHERE LOWER(canonical_name) = 'courgette' AND nutrition_id IS NULL;

-- 9. Aubergine → 20053
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20053')
WHERE LOWER(canonical_name) = 'aubergine' AND nutrition_id IS NULL;

-- 10. Poivron → 20041 (même famille que courgette pour l'instant)
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20151')
WHERE LOWER(canonical_name) LIKE '%poivron%' AND nutrition_id IS NULL;

-- 11. Haricot vert → 20061
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20061')
WHERE LOWER(canonical_name) LIKE '%haricot%vert%' AND nutrition_id IS NULL;

-- 12. Brocoli → 20009
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20009')
WHERE LOWER(canonical_name) = 'brocoli' AND nutrition_id IS NULL;

-- 13. Chou-fleur → 20013
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20013')
WHERE LOWER(canonical_name) = 'chou-fleur' AND nutrition_id IS NULL;

-- 14. Épinard → 20059
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20059')
WHERE LOWER(canonical_name) = 'épinard' AND nutrition_id IS NULL;

-- 15. Salade/Laitue → 20038
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20038')
WHERE LOWER(canonical_name) IN ('salade', 'laitue') AND nutrition_id IS NULL;

-- 16. Concombre → 20019
UPDATE canonical_foods 
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20019')
WHERE LOWER(canonical_name) = 'concombre' AND nutrition_id IS NULL;

-- Vérifier les liens créés
SELECT 
    cf.id,
    cf.canonical_name,
    nd.source_id AS code_ciqual,
    nd.calories_kcal,
    nd.proteines_g,
    nd.vitamine_c_mg,
    nd.potassium_mg
FROM canonical_foods cf
JOIN nutritional_data nd ON cf.nutrition_id = nd.id
ORDER BY cf.canonical_name;

-- Compter
SELECT 
    COUNT(*) AS total_canonical_foods,
    COUNT(nutrition_id) AS avec_nutrition_id,
    COUNT(*) - COUNT(nutrition_id) AS sans_nutrition_id
FROM canonical_foods;
