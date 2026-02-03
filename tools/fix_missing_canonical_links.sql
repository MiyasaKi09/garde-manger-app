-- =============================================================================
-- Correction des 6 liens nutritionnels manquants pour aliments canoniques
-- Date: 2026-02-03
-- Description: Lie les 6 aliments canoniques restants aux codes CIQUAL
-- =============================================================================

-- Note: Ce problème est SECONDAIRE par rapport aux process modifiers d'archétypes
-- qui corrigent des erreurs bien plus importantes (-87% sur lait en poudre, etc.)

BEGIN;

-- =============================================================================
-- POISSONS (2 aliments)
-- =============================================================================

-- Lotte (ID 10)
UPDATE canonical_foods
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '26018' LIMIT 1)
WHERE id = 10 AND nutrition_id IS NULL;

RAISE NOTICE 'Lotte (ID 10) liée à CIQUAL 26018';

-- Sole (ID 11)
UPDATE canonical_foods
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '26058' LIMIT 1)
WHERE id = 11 AND nutrition_id IS NULL;

RAISE NOTICE 'Sole (ID 11) liée à CIQUAL 26058';

-- =============================================================================
-- BOISSONS ALCOOLISÉES (2 aliments)
-- =============================================================================

-- Cidre (ID 9)
UPDATE canonical_foods
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '5003' LIMIT 1)
WHERE id = 9 AND nutrition_id IS NULL;

RAISE NOTICE 'Cidre (ID 9) lié à CIQUAL 5003';

-- Bière (ID 8)
UPDATE canonical_foods
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '5001' LIMIT 1)
WHERE id = 8 AND nutrition_id IS NULL;

RAISE NOTICE 'Bière (ID 8) liée à CIQUAL 5001';

-- =============================================================================
-- CATÉGORIES GÉNÉRIQUES (2 aliments)
-- =============================================================================

-- Épices (ID 12) - Utilise "épice aliment moyen"
UPDATE canonical_foods
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11081' LIMIT 1)
WHERE id = 12 AND nutrition_id IS NULL;

RAISE NOTICE 'Épices (ID 12) liées à CIQUAL 11081 (épice moyenne)';

-- Légume (ID 13) - Utilise "légume cuit aliment moyen"
UPDATE canonical_foods
SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20499' LIMIT 1)
WHERE id = 13 AND nutrition_id IS NULL;

RAISE NOTICE 'Légume (ID 13) lié à CIQUAL 20499 (légume cuit moyen)';

-- =============================================================================
-- VÉRIFICATION
-- =============================================================================

DO $$
DECLARE
    linked_count INTEGER;
    rec RECORD;
BEGIN
    -- Compter les liens créés
    SELECT COUNT(*) INTO linked_count
    FROM canonical_foods
    WHERE id IN (8, 9, 10, 11, 12, 13)
      AND nutrition_id IS NOT NULL;

    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'LIENS NUTRITIONNELS CRÉÉS';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Nombre de liens créés : % / 6', linked_count;
    RAISE NOTICE '';

    IF linked_count = 6 THEN
        RAISE NOTICE '✅ Tous les liens ont été créés avec succès!';
    ELSE
        RAISE WARNING '⚠️  Seulement % liens créés sur 6 attendus', linked_count;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'Détail des aliments liés:';
    RAISE NOTICE '';

    FOR rec IN
        SELECT
            cf.id,
            cf.canonical_name,
            nd.source_id AS ciqual_code,
            nd.calories_kcal,
            nd.proteines_g,
            nd.glucides_g,
            nd.lipides_g
        FROM canonical_foods cf
        JOIN nutritional_data nd ON nd.id = cf.nutrition_id
        WHERE cf.id IN (8, 9, 10, 11, 12, 13)
        ORDER BY cf.id
    LOOP
        RAISE NOTICE 'ID % - % → CIQUAL % (% kcal, % g prot, % g gluc, % g lip)',
            LPAD(rec.id::TEXT, 2),
            RPAD(rec.canonical_name, 15),
            rec.ciqual_code,
            rec.calories_kcal,
            rec.proteines_g,
            rec.glucides_g,
            rec.lipides_g;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE 'Aliments restés NON LIÉS (intentionnel):';
    RAISE NOTICE '';

    FOR rec IN
        SELECT id, canonical_name
        FROM canonical_foods
        WHERE nutrition_id IS NULL
        ORDER BY id
    LOOP
        RAISE NOTICE 'ID % - % (catégorie placeholder ou trop générique)',
            LPAD(rec.id::TEXT, 2),
            rec.canonical_name;
    END LOOP;

    RAISE NOTICE '=============================================================================';
END $$;

COMMIT;

\echo ''
\echo '✅ Script fix_missing_canonical_links.sql exécuté avec succès!'
\echo ''
\echo '📝 Note: Ce problème était SECONDAIRE.'
\echo '   Le problème MAJEUR (process modifiers archétypes) nécessite:'
\echo '   1. Migrations 007 et 008'
\echo '   2. populate_process_modifiers.sql'
\echo '   3. populate_archetype_overrides.sql'
\echo '   4. create_nutrition_function_v2.sql'
\echo ''
\echo '   Voir IMPLEMENTATION_SUMMARY.md pour instructions complètes.'
