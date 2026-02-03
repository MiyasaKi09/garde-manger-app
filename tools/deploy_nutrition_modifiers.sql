-- =============================================================================
-- DÉPLOIEMENT COMPLET : Système de Modificateurs Nutritionnels
-- Date: 2026-02-03
-- =============================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🚀 DÉPLOIEMENT DU SYSTÈME DE MODIFICATEURS NUTRITIONNELS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : CRÉER LES TABLES
-- =============================================================================

\echo '📦 Étape 1/5 : Création des tables...'
\echo ''

-- Table process_nutrition_modifiers
CREATE TABLE IF NOT EXISTS process_nutrition_modifiers (
  id BIGSERIAL PRIMARY KEY,
  process_pattern TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'DRYING', 'CONCENTRATION', 'FERMENTATION', 'AGING',
    'MECHANICAL', 'PRESERVATION', 'FAT_SEPARATION'
  )),
  nutrient_name TEXT NOT NULL,
  factor_type TEXT NOT NULL CHECK (factor_type IN ('RETENTION', 'MULTIPLICATION', 'CONCENTRATION')),
  factor_value NUMERIC NOT NULL CHECK (factor_value >= 0),
  description TEXT,
  priority INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_pattern_nutrient UNIQUE (process_pattern, nutrient_name)
);

CREATE INDEX IF NOT EXISTS idx_process_nutrition_modifiers_pattern ON process_nutrition_modifiers(process_pattern);
CREATE INDEX IF NOT EXISTS idx_process_nutrition_modifiers_category ON process_nutrition_modifiers(category);
CREATE INDEX IF NOT EXISTS idx_process_nutrition_modifiers_nutrient ON process_nutrition_modifiers(nutrient_name);

\echo '  ✓ Table process_nutrition_modifiers créée'

-- Table archetype_nutrition_overrides
CREATE TABLE IF NOT EXISTS archetype_nutrition_overrides (
  archetype_id BIGINT PRIMARY KEY REFERENCES archetypes(id) ON DELETE CASCADE,
  nutrition_id BIGINT NOT NULL REFERENCES nutritional_data(id) ON DELETE RESTRICT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archetype_nutrition_overrides_nutrition_id ON archetype_nutrition_overrides(nutrition_id);

\echo '  ✓ Table archetype_nutrition_overrides créée'
\echo ''

-- =============================================================================
-- ÉTAPE 2 : PEUPLER LES MODIFICATEURS
-- =============================================================================

\echo '📝 Étape 2/5 : Population des modificateurs de processus...'
\echo ''

-- Vider d'abord si existe
TRUNCATE TABLE process_nutrition_modifiers RESTART IDENTITY CASCADE;

-- DRYING (8x concentration)
INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('séchage|déshydrat|poudre|atomis', 'DRYING', 'calories', 'MULTIPLICATION', 8.0, 'Déshydratation complète concentre calories 8x', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'proteines', 'MULTIPLICATION', 8.0, 'Déshydratation complète concentre protéines 8x', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'glucides', 'MULTIPLICATION', 8.0, 'Déshydratation complète concentre glucides 8x', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'lipides', 'MULTIPLICATION', 8.0, 'Déshydratation complète concentre lipides 8x', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'fibres', 'MULTIPLICATION', 8.0, 'Déshydratation complète concentre fibres 8x', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'calcium', 'MULTIPLICATION', 8.0, 'Minéraux concentrés par déshydratation', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'fer', 'MULTIPLICATION', 8.0, 'Minéraux concentrés par déshydratation', 100);

\echo '  ✓ DRYING (8x) : 7 règles'

-- CONCENTRATION 60% (2.5x)
INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('évaporation.*60.*eau|évaporation 60', 'CONCENTRATION', 'calories', 'MULTIPLICATION', 2.5, 'Évaporation 60% eau concentre 2.5x', 110),
('évaporation.*60.*eau|évaporation 60', 'CONCENTRATION', 'proteines', 'MULTIPLICATION', 2.5, 'Évaporation 60% eau concentre 2.5x', 110),
('évaporation.*60.*eau|évaporation 60', 'CONCENTRATION', 'glucides', 'MULTIPLICATION', 2.5, 'Évaporation 60% eau concentre 2.5x', 110),
('évaporation.*60.*eau|évaporation 60', 'CONCENTRATION', 'lipides', 'MULTIPLICATION', 2.5, 'Évaporation 60% eau concentre 2.5x', 110),
('évaporation.*60.*eau|évaporation 60', 'CONCENTRATION', 'calcium', 'MULTIPLICATION', 2.5, 'Évaporation 60% eau concentre minéraux 2.5x', 110);

\echo '  ✓ CONCENTRATION 60% (2.5x) : 5 règles'

-- CONCENTRATION générique (2x)
INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('réduction|concentration|épaississement', 'CONCENTRATION', 'calories', 'MULTIPLICATION', 2.0, 'Concentration générique 2x', 90),
('réduction|concentration|épaississement', 'CONCENTRATION', 'proteines', 'MULTIPLICATION', 2.0, 'Concentration générique 2x', 90),
('réduction|concentration|épaississement', 'CONCENTRATION', 'glucides', 'MULTIPLICATION', 2.0, 'Concentration générique 2x', 90),
('réduction|concentration|épaississement', 'CONCENTRATION', 'lipides', 'MULTIPLICATION', 2.0, 'Concentration générique 2x', 90);

\echo '  ✓ CONCENTRATION générique (2x) : 4 règles'

-- FERMENTATION
INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('fermentation lactique', 'FERMENTATION', 'proteines', 'MULTIPLICATION', 1.05, 'Fermentation - légère perte eau concentre protéines 5%', 100),
('fermentation lactique', 'FERMENTATION', 'glucides', 'MULTIPLICATION', 0.95, 'Fermentation - consommation lactose réduit glucides 5%', 100),
('fermentation lactique', 'FERMENTATION', 'calories', 'MULTIPLICATION', 1.02, 'Fermentation - légère augmentation calorique nette', 100),
('fermentation lactique', 'FERMENTATION', 'calcium', 'MULTIPLICATION', 1.10, 'Fermentation améliore biodisponibilité calcium 10%', 100);

\echo '  ✓ FERMENTATION (1.05x) : 4 règles'

-- AGING (fromages affinés)
INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'calories', 'MULTIPLICATION', 3.5, 'Affinage concentre calories 3.5x par perte eau', 100),
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'proteines', 'MULTIPLICATION', 3.5, 'Affinage concentre protéines 3.5x', 100),
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'lipides', 'MULTIPLICATION', 3.5, 'Affinage concentre matière grasse 3.5x', 100),
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'glucides', 'MULTIPLICATION', 3.5, 'Affinage concentre glucides résiduels', 100),
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'calcium', 'MULTIPLICATION', 8.0, 'Calcium très concentré dans fromages affinés', 100);

\echo '  ✓ AGING (3.5x) : 5 règles'

-- PRESERVATION
INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('fumage|fumé', 'PRESERVATION', 'vitamine_c', 'RETENTION', 0.85, 'Fumage - perte vitamine C 15%', 100),
('fumage|fumé', 'PRESERVATION', 'vitamine_b1', 'RETENTION', 0.90, 'Fumage - perte vitamine B1 10%', 100),
('congélation|congelé|surgelé', 'PRESERVATION', 'vitamine_c', 'RETENTION', 0.95, 'Congélation - perte vitamine C minimale 5%', 100);

\echo '  ✓ PRESERVATION (0.85-0.95x) : 3 règles'

\echo ''
\echo '  📊 Total : 28 règles de modification insérées'
\echo ''

-- =============================================================================
-- ÉTAPE 3 : PEUPLER LES OVERRIDES
-- =============================================================================

\echo '🎯 Étape 3/5 : Population des overrides directs...'
\echo ''

-- Vider d'abord si existe
TRUNCATE TABLE archetype_nutrition_overrides CASCADE;

-- Beurre
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT 204, id, 'Beurre doux - Transformation trop complexe, utilise code CIQUAL beurre direct'
FROM nutritional_data WHERE source_id = '16400' LIMIT 1;

\echo '  ✓ Beurre (ID 204) → CIQUAL 16400'

-- Yaourts
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT 205, id, 'Yaourt nature entier - Code CIQUAL yaourt entier spécifique'
FROM nutritional_data WHERE source_id = '19023' LIMIT 1;

INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT 206, id, 'Yaourt nature 0% - Profil lipidique spécifique, code CIQUAL yaourt 0% MG'
FROM nutritional_data WHERE source_id = '19038' LIMIT 1;

INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT 207, id, 'Yaourt nature brassé - Texture différente, code CIQUAL spécifique'
FROM nutritional_data WHERE source_id = '19024' LIMIT 1;

\echo '  ✓ Yaourts (IDs 205-207) → CIQUAL 19023, 19038, 19024'

-- Crème légère
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT 199, id, 'Crème fraîche légère 15% MG - % MG spécifique, code CIQUAL crème 15% MG'
FROM nutritional_data WHERE source_id = '19402' LIMIT 1;

\echo '  ✓ Crème légère (ID 199) → CIQUAL 19402'

\echo ''
\echo '  📊 Total : 5 overrides directs insérés'
\echo ''

-- =============================================================================
-- ÉTAPE 4 : DÉPLOYER LA NOUVELLE FONCTION
-- =============================================================================

\echo '⚙️  Étape 4/5 : Déploiement de calculate_recipe_nutrition v2...'
\echo ''

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS calculate_recipe_nutrition(INTEGER);

-- Créer la nouvelle fonction avec process modifiers
CREATE OR REPLACE FUNCTION calculate_recipe_nutrition(recipe_id_param INTEGER)
RETURNS TABLE (
    nutrient_name TEXT,
    value_per_serving NUMERIC,
    unit TEXT,
    value_total NUMERIC
) AS $$
DECLARE
    cooking_method_var TEXT;
    servings_var INTEGER;
BEGIN
    SELECT COALESCE(LOWER(cooking_method), 'cru'), COALESCE(servings, 1)
    INTO cooking_method_var, servings_var
    FROM recipes WHERE id = recipe_id_param;

    IF cooking_method_var IS NULL THEN
        RAISE EXCEPTION 'Recette % introuvable', recipe_id_param;
    END IF;

    RETURN QUERY
    WITH ingredient_base AS (
        SELECT
            ri.quantity, ri.unit, ri.archetype_id,
            a.process AS archetype_process,
            cf.canonical_name, cf.id AS canonical_food_id,
            COALESCE(ano.nutrition_id, cf.nutrition_id) AS nutrition_id_to_use
        FROM recipe_ingredients ri
        LEFT JOIN archetypes a ON a.id = ri.archetype_id
        LEFT JOIN canonical_foods cf ON cf.id = COALESCE(ri.canonical_food_id, a.canonical_food_id)
        LEFT JOIN archetype_nutrition_overrides ano ON ano.archetype_id = a.id
        WHERE ri.recipe_id = recipe_id_param AND cf.id IS NOT NULL
    ),
    process_factors AS (
        SELECT DISTINCT ON (ib.archetype_id, pnm.nutrient_name)
            ib.archetype_id, pnm.nutrient_name, pnm.factor_type, pnm.factor_value
        FROM ingredient_base ib
        CROSS JOIN process_nutrition_modifiers pnm
        WHERE ib.archetype_process IS NOT NULL
          AND ib.archetype_process ~* pnm.process_pattern
        ORDER BY ib.archetype_id, pnm.nutrient_name, pnm.priority DESC
    ),
    ingredient_nutrition AS (
        SELECT
            ib.quantity, ib.unit, ib.canonical_name,
            COALESCE(nd.calories_kcal, 0) * COALESCE((SELECT factor_value FROM process_factors pf WHERE pf.archetype_id = ib.archetype_id AND pf.nutrient_name = 'calories' AND pf.factor_type = 'MULTIPLICATION'), 1.0) * (ib.quantity / 100.0) AS ingredient_calories,
            COALESCE(nd.proteines_g, 0) * COALESCE((SELECT factor_value FROM process_factors pf WHERE pf.archetype_id = ib.archetype_id AND pf.nutrient_name = 'proteines' AND pf.factor_type = 'MULTIPLICATION'), 1.0) * (ib.quantity / 100.0) AS ingredient_proteines,
            COALESCE(nd.glucides_g, 0) * COALESCE((SELECT factor_value FROM process_factors pf WHERE pf.archetype_id = ib.archetype_id AND pf.nutrient_name = 'glucides' AND pf.factor_type = 'MULTIPLICATION'), 1.0) * (ib.quantity / 100.0) AS ingredient_glucides,
            COALESCE(nd.lipides_g, 0) * COALESCE((SELECT factor_value FROM process_factors pf WHERE pf.archetype_id = ib.archetype_id AND pf.nutrient_name = 'lipides' AND pf.factor_type = 'MULTIPLICATION'), 1.0) * (ib.quantity / 100.0) AS ingredient_lipides
        FROM ingredient_base ib
        LEFT JOIN nutritional_data nd ON nd.id = ib.nutrition_id_to_use
    ),
    raw_totals AS (
        SELECT SUM(ingredient_calories) AS total_calories_raw, SUM(ingredient_proteines) AS total_proteines_raw,
               SUM(ingredient_glucides) AS total_glucides_raw, SUM(ingredient_lipides) AS total_lipides_raw
        FROM ingredient_nutrition
    ),
    cooking_factors AS (
        SELECT nutrient_name, factor_type, factor_value
        FROM cooking_nutrition_factors WHERE LOWER(cooking_method) = cooking_method_var
    ),
    adjusted_totals AS (
        SELECT rt.total_calories_raw AS total_calories,
               rt.total_proteines_raw * COALESCE((SELECT factor_value FROM cooking_factors WHERE nutrient_name = 'proteines' AND factor_type = 'RETENTION'), 1.0) AS total_proteines,
               rt.total_glucides_raw * COALESCE((SELECT factor_value FROM cooking_factors WHERE nutrient_name = 'glucides' AND factor_type = 'RETENTION'), 1.0) AS total_glucides,
               CASE WHEN EXISTS (SELECT 1 FROM cooking_factors WHERE nutrient_name = 'lipides' AND factor_type = 'MULTIPLICATION')
                    THEN rt.total_lipides_raw * (SELECT factor_value FROM cooking_factors WHERE nutrient_name = 'lipides' AND factor_type = 'MULTIPLICATION')
                    ELSE rt.total_lipides_raw * COALESCE((SELECT factor_value FROM cooking_factors WHERE nutrient_name = 'lipides' AND factor_type = 'RETENTION'), 1.0)
               END AS total_lipides
        FROM raw_totals rt
    )
    SELECT 'Calories'::TEXT, ROUND((total_calories / servings_var)::NUMERIC, 1), 'kcal'::TEXT, ROUND(total_calories::NUMERIC, 1) FROM adjusted_totals
    UNION ALL SELECT 'Protéines'::TEXT, ROUND((total_proteines / servings_var)::NUMERIC, 1), 'g'::TEXT, ROUND(total_proteines::NUMERIC, 1) FROM adjusted_totals
    UNION ALL SELECT 'Glucides'::TEXT, ROUND((total_glucides / servings_var)::NUMERIC, 1), 'g'::TEXT, ROUND(total_glucides::NUMERIC, 1) FROM adjusted_totals
    UNION ALL SELECT 'Lipides'::TEXT, ROUND((total_lipides / servings_var)::NUMERIC, 1), 'g'::TEXT, ROUND(total_lipides::NUMERIC, 1) FROM adjusted_totals;
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Erreur calcul nutritionnel: %', SQLERRM; RETURN;
END;
$$ LANGUAGE plpgsql;

\echo '  ✓ Fonction calculate_recipe_nutrition v2 déployée'
\echo ''

-- =============================================================================
-- ÉTAPE 5 : INVALIDER LE CACHE
-- =============================================================================

\echo '🗑️  Étape 5/5 : Invalidation du cache nutritionnel...'
\echo ''

TRUNCATE TABLE recipe_nutrition_cache;

\echo '  ✓ Cache nutritionnel vidé (toutes les recettes seront recalculées)'
\echo ''

COMMIT;

-- =============================================================================
-- VÉRIFICATIONS
-- =============================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ VÉRIFICATIONS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Compter les modificateurs
SELECT COUNT(*) AS "Règles de modification" FROM process_nutrition_modifiers;

-- Compter les overrides
SELECT COUNT(*) AS "Overrides directs" FROM archetype_nutrition_overrides;

-- Compter les archétypes qui matchent
SELECT COUNT(DISTINCT a.id) AS "Archétypes avec modificateurs"
FROM archetypes a
CROSS JOIN process_nutrition_modifiers pnm
WHERE a.process IS NOT NULL AND a.process ~* pnm.process_pattern;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo '📝 Prochaines étapes :'
\echo '   1. Tester avec une recette existante'
\echo '   2. Vérifier que les valeurs nutritionnelles sont correctes'
\echo '   3. Consulter IMPLEMENTATION_SUMMARY.md pour plus de détails'
\echo ''
