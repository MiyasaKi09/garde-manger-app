-- =============================================================================
-- Populate Archetype Nutrition Overrides
-- Date: 2026-02-03
-- Description: Insère les liens directs entre archetypes et nutritional_data
--              pour les cas complexes nécessitant codes CIQUAL spécifiques
--              (beurre, fromages, crèmes avec % MG spécifiques)
-- =============================================================================

-- Vider la table si elle existe déjà (pour permettre réexécution)
TRUNCATE TABLE archetype_nutrition_overrides CASCADE;

-- =============================================================================
-- BEURRE ET PRODUITS LAITIERS GRAS
-- Ces produits ont des transformations trop complexes pour de simples
-- multiplicateurs (séparation matière grasse, % MG spécifiques)
-- =============================================================================

-- Beurre doux (archetype_id 204)
-- Process: "barattage crème maturation 82% MG"
-- CIQUAL: 16400 series (beurre ~750 kcal, 82g lipides/100g)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason) VALUES
(204, (SELECT id FROM nutritional_data WHERE source_id = '16400' LIMIT 1),
 'Beurre doux - Transformation par barattage trop complexe, utilise code CIQUAL beurre direct');

-- =============================================================================
-- YAOURTS ET PRODUITS FERMENTÉS
-- Les yaourts ont des % MG variables et des profils nutritionnels spécifiques
-- après fermentation qui sont mieux représentés par leurs codes CIQUAL
-- =============================================================================

-- Yaourt nature entier (archetype_id 205)
-- Process: "fermentation lactique 43°C 4h lait entier"
-- CIQUAL: 19023 (yaourt nature ~65 kcal, 3.3g protéines)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason) VALUES
(205, (SELECT id FROM nutritional_data WHERE source_id = '19023' LIMIT 1),
 'Yaourt nature entier - Utilise code CIQUAL yaourt entier spécifique');

-- Yaourt nature 0% MG (archetype_id 206)
-- Process: "fermentation lactique 43°C 4h lait écrémé"
-- CIQUAL: 19038 (yaourt 0% MG ~44 kcal, très faible lipides)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason) VALUES
(206, (SELECT id FROM nutritional_data WHERE source_id = '19038' LIMIT 1),
 'Yaourt nature 0% - Profil lipidique spécifique, code CIQUAL yaourt 0% MG');

-- Yaourt nature brassé (archetype_id 207)
-- CIQUAL: 19024 (yaourt brassé)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason) VALUES
(207, (SELECT id FROM nutritional_data WHERE source_id = '19024' LIMIT 1),
 'Yaourt nature brassé - Texture différente, code CIQUAL spécifique');

-- Yaourt grec nature (archetype_id 208)
-- Process: "fermentation lactique 43°C égouttage 10% MG"
-- CIQUAL: 19200 (yaourt grec, plus concentré en protéines)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason) VALUES
(208, (SELECT id FROM nutritional_data WHERE source_id = '19200' LIMIT 1),
 'Yaourt grec 10% MG - Égouttage concentre protéines, code CIQUAL yaourt grec');

-- Yaourt grec 0% (archetype_id 209)
-- CIQUAL: 19050 (yaourt écrémé concentré)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason) VALUES
(209, (SELECT id FROM nutritional_data WHERE source_id = '19050' LIMIT 1),
 'Yaourt grec 0% - Égouttage + 0% MG, code CIQUAL yaourt écrémé concentré');

-- =============================================================================
-- CRÈMES AVEC % MG SPÉCIFIQUES
-- Les crèmes à différents % MG ont des profils très variables
-- =============================================================================

-- Crème fraîche légère 15% MG (archetype_id 199)
-- Process: "fermentation lactique ensemencement 15% MG"
-- CIQUAL: 19402 (crème 15% MG ~269 kcal, 26g lipides)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason) VALUES
(199, (SELECT id FROM nutritional_data WHERE source_id = '19402' LIMIT 1),
 'Crème fraîche légère 15% MG - % MG spécifique, code CIQUAL crème 15% MG');

-- =============================================================================
-- FROMAGES AFFINÉS (si non couverts par process modifiers)
-- Note: Les fromages avec affinage long sont déjà gérés par les process modifiers,
-- mais les fromages AOC/AOP spécifiques peuvent bénéficier d'overrides directs
-- =============================================================================

-- Bûche de chèvre sec (archetype_id 237)
-- Process: "caillage lactique égouttage moulage bûche affinage 8 semaines"
-- Note: L'affinage 8 semaines sera capturé par process modifier (3.5x),
-- mais si CIQUAL a un code spécifique pour bûche de chèvre affinée, l'utiliser
-- Pour l'instant, on laisse le process modifier faire son travail

-- Crottin de chèvre (archetype_id 238)
-- Même stratégie - process modifier suffit pour l'instant

-- =============================================================================
-- PRODUITS LAITIERS VÉGÉTAUX
-- Ces produits ont des bases différentes (soja, avoine, riz) et ne peuvent
-- pas hériter de la nutrition du lait de vache
-- =============================================================================

-- Lait de riz (archetype_id 223)
-- Process: "cuisson riz broyage filtration"
-- CIQUAL: Rechercher code pour boisson riz
-- Note: À compléter si code CIQUAL disponible

-- Crème de soja (archetype_id 225)
-- CIQUAL: Rechercher code pour crème soja
-- Note: À compléter si code CIQUAL disponible

-- =============================================================================
-- STATISTIQUES ET VÉRIFICATION
-- =============================================================================

DO $$
DECLARE
    total_overrides INTEGER;
    archetype_record RECORD;
BEGIN
    SELECT COUNT(*) INTO total_overrides FROM archetype_nutrition_overrides;

    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'ARCHETYPE NUTRITION OVERRIDES INSÉRÉS';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Total overrides: %', total_overrides;
    RAISE NOTICE '';
    RAISE NOTICE 'Liste des archetypes avec overrides:';
    RAISE NOTICE '';

    FOR archetype_record IN
        SELECT
            a.id,
            a.name,
            a.process,
            nd.source_id,
            nd.calories_kcal,
            nd.proteines_g,
            nd.lipides_g,
            ano.reason
        FROM archetype_nutrition_overrides ano
        JOIN archetypes a ON a.id = ano.archetype_id
        JOIN nutritional_data nd ON nd.id = ano.nutrition_id
        ORDER BY a.id
    LOOP
        RAISE NOTICE 'ID % - %', LPAD(archetype_record.id::TEXT, 3), RPAD(archetype_record.name, 30);
        RAISE NOTICE '  CIQUAL: %  (% kcal, % g prot, % g lipides)',
            archetype_record.source_id,
            archetype_record.calories_kcal,
            archetype_record.proteines_g,
            archetype_record.lipides_g;
        RAISE NOTICE '  Raison: %', archetype_record.reason;
        RAISE NOTICE '';
    END LOOP;

    RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- NOTES POUR EXPANSION FUTURE
-- =============================================================================

-- Les fromages suivants pourraient bénéficier d'overrides directs si les
-- process modifiers ne donnent pas de résultats satisfaisants:
-- - Sainte-Maure (archetype 239)
-- - Pouligny-Saint-Pierre (archetype 282)
-- - Valençay (archetype 280)
-- - Rocamadour (archetype 281)
--
-- Stratégie recommandée: Tester d'abord avec process modifiers (affinage),
-- puis ajouter overrides seulement si nécessaire.

-- Pour les produits laitiers végétaux (lait de riz, crème de soja, etc.),
-- chercher les codes CIQUAL correspondants dans la base et les ajouter ici.
