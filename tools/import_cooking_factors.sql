-- ============================================================================
-- Script d'Import des Coefficients de Cuisson pour les Calculs Nutritionnels
-- ============================================================================
-- 
-- Ce script importe les facteurs de rétention et multiplication des nutriments
-- lors de différentes méthodes de cuisson (ébullition, vapeur, friture, etc.)
--
-- Basé sur les données scientifiques de l'USDA et l'ANSES
--
-- Usage:
--   psql "$DATABASE_URL_TX" -f tools/import_cooking_factors.sql
-- ============================================================================

BEGIN;

-- Vérifier que la table existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'cooking_nutrition_factors') THEN
        RAISE EXCEPTION 'La table cooking_nutrition_factors n''existe pas!';
    END IF;
END $$;

-- Supprimer les données existantes (si réimport)
TRUNCATE TABLE cooking_nutrition_factors RESTART IDENTITY CASCADE;

\echo '📥 Import des coefficients de cuisson...'

-- Import des données depuis le CSV
-- Note: Adapter le chemin selon votre environnement
\COPY cooking_nutrition_factors (cooking_method, nutrient_name, factor_type, factor_value) FROM 'data/cooking_factors.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Vérifier l'import
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM cooking_nutrition_factors;
    RAISE NOTICE '✅ % coefficients importés', row_count;
END $$;

-- Afficher un résumé par méthode de cuisson
\echo ''
\echo '📊 Résumé par méthode de cuisson:'
SELECT 
    cooking_method AS "Méthode",
    COUNT(*) AS "Nb facteurs",
    COUNT(DISTINCT nutrient_name) AS "Nb nutriments"
FROM cooking_nutrition_factors
GROUP BY cooking_method
ORDER BY cooking_method;

-- Afficher quelques exemples
\echo ''
\echo '📋 Exemples de coefficients:'
SELECT 
    cooking_method AS "Méthode",
    nutrient_name AS "Nutriment",
    factor_type AS "Type",
    factor_value AS "Valeur"
FROM cooking_nutrition_factors
WHERE cooking_method IN ('ebullition', 'vapeur', 'friture', 'cru')
  AND nutrient_name IN ('vitamine_c', 'proteines', 'lipides')
ORDER BY cooking_method, nutrient_name;

COMMIT;

\echo ''
\echo '✅ Import terminé avec succès!'
\echo ''
\echo '💡 Prochaines étapes:'
\echo '   1. Vérifier les données: SELECT * FROM cooking_nutrition_factors LIMIT 10;'
\echo '   2. Créer la fonction de calcul nutritionnel'
\echo '   3. Tester sur une recette'
