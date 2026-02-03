-- =============================================================================
-- Populate Process Nutrition Modifiers
-- Date: 2026-02-03
-- Description: Insère les règles de modification nutritionnelle basées sur les
--              processus de transformation des archétypes
-- =============================================================================

-- Vider la table si elle existe déjà (pour permettre réexécution)
TRUNCATE TABLE process_nutrition_modifiers RESTART IDENTITY CASCADE;

-- =============================================================================
-- CATÉGORIE 1: DRYING / DEHYDRATION (8x concentration)
-- Processus: séchage, déshydratation, poudre, atomisation
-- Effet: Élimination quasi-complète de l'eau concentre tous les nutriments 8x
-- Exemples: Lait en poudre, herbes séchées, légumes déshydratés
-- =============================================================================

INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
-- Macronutriments
('séchage|déshydrat|poudre|atomis', 'DRYING', 'calories', 'MULTIPLICATION', 8.0, 'Déshydratation complète concentre calories 8x', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'proteines', 'MULTIPLICATION', 8.0, 'Déshydratation complète concentre protéines 8x', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'glucides', 'MULTIPLICATION', 8.0, 'Déshydratation complète concentre glucides 8x', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'lipides', 'MULTIPLICATION', 8.0, 'Déshydratation complète concentre lipides 8x', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'fibres', 'MULTIPLICATION', 8.0, 'Déshydratation complète concentre fibres 8x', 100),

-- Minéraux (très stables à la déshydratation)
('séchage|déshydrat|poudre|atomis', 'DRYING', 'calcium', 'MULTIPLICATION', 8.0, 'Minéraux concentrés par déshydratation', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'fer', 'MULTIPLICATION', 8.0, 'Minéraux concentrés par déshydratation', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'magnesium', 'MULTIPLICATION', 8.0, 'Minéraux concentrés par déshydratation', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'potassium', 'MULTIPLICATION', 8.0, 'Minéraux concentrés par déshydratation', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'sodium', 'MULTIPLICATION', 8.0, 'Minéraux concentrés par déshydratation', 100),
('séchage|déshydrat|poudre|atomis', 'DRYING', 'zinc', 'MULTIPLICATION', 8.0, 'Minéraux concentrés par déshydratation', 100);

-- =============================================================================
-- CATÉGORIE 2: CONCENTRATION / EVAPORATION (2-3x concentration)
-- Processus: évaporation, réduction, concentration, épaississement
-- Effet: Élimination partielle de l'eau
-- Exemples: Lait concentré, concentré de tomate, réductions
-- =============================================================================

-- Évaporation 60% eau spécifique (2.5x concentration)
INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('évaporation.*60.*eau|évaporation 60', 'CONCENTRATION', 'calories', 'MULTIPLICATION', 2.5, 'Évaporation 60% eau concentre 2.5x', 110),
('évaporation.*60.*eau|évaporation 60', 'CONCENTRATION', 'proteines', 'MULTIPLICATION', 2.5, 'Évaporation 60% eau concentre 2.5x', 110),
('évaporation.*60.*eau|évaporation 60', 'CONCENTRATION', 'glucides', 'MULTIPLICATION', 2.5, 'Évaporation 60% eau concentre 2.5x', 110),
('évaporation.*60.*eau|évaporation 60', 'CONCENTRATION', 'lipides', 'MULTIPLICATION', 2.5, 'Évaporation 60% eau concentre 2.5x', 110),
('évaporation.*60.*eau|évaporation 60', 'CONCENTRATION', 'calcium', 'MULTIPLICATION', 2.5, 'Évaporation 60% eau concentre minéraux 2.5x', 110);

-- Évaporation 50% eau (2x concentration)
INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('évaporation.*50.*eau|évaporation 50', 'CONCENTRATION', 'calories', 'MULTIPLICATION', 2.0, 'Évaporation 50% eau concentre 2x', 110),
('évaporation.*50.*eau|évaporation 50', 'CONCENTRATION', 'proteines', 'MULTIPLICATION', 2.0, 'Évaporation 50% eau concentre 2x', 110),
('évaporation.*50.*eau|évaporation 50', 'CONCENTRATION', 'glucides', 'MULTIPLICATION', 2.0, 'Évaporation 50% eau concentre 2x', 110),
('évaporation.*50.*eau|évaporation 50', 'CONCENTRATION', 'lipides', 'MULTIPLICATION', 2.0, 'Évaporation 50% eau concentre 2x', 110);

-- Concentration générique (réduction, épaississement) - 2x par défaut
INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('réduction|concentration|épaississement', 'CONCENTRATION', 'calories', 'MULTIPLICATION', 2.0, 'Concentration générique 2x', 90),
('réduction|concentration|épaississement', 'CONCENTRATION', 'proteines', 'MULTIPLICATION', 2.0, 'Concentration générique 2x', 90),
('réduction|concentration|épaississement', 'CONCENTRATION', 'glucides', 'MULTIPLICATION', 2.0, 'Concentration générique 2x', 90),
('réduction|concentration|épaississement', 'CONCENTRATION', 'lipides', 'MULTIPLICATION', 2.0, 'Concentration générique 2x', 90),
('réduction|concentration|épaississement', 'CONCENTRATION', 'fibres', 'MULTIPLICATION', 2.0, 'Concentration générique 2x', 90);

-- =============================================================================
-- CATÉGORIE 3: FERMENTATION (légère concentration + changements micronutriments)
-- Processus: fermentation lactique, caillage
-- Effet: Légère perte d'eau (5-10%), amélioration biodisponibilité
-- Exemples: Yaourt, kéfir, fromage frais
-- =============================================================================

INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
-- Macronutriments (légère concentration)
('fermentation lactique', 'FERMENTATION', 'proteines', 'MULTIPLICATION', 1.05, 'Fermentation - légère perte eau concentre protéines 5%', 100),
('fermentation lactique', 'FERMENTATION', 'glucides', 'MULTIPLICATION', 0.95, 'Fermentation - consommation lactose réduit glucides 5%', 100),
('fermentation lactique', 'FERMENTATION', 'calories', 'MULTIPLICATION', 1.02, 'Fermentation - légère augmentation calorique nette', 100),

-- Minéraux (amélioration biodisponibilité)
('fermentation lactique', 'FERMENTATION', 'calcium', 'MULTIPLICATION', 1.10, 'Fermentation améliore biodisponibilité calcium 10%', 100),
('fermentation lactique', 'FERMENTATION', 'magnesium', 'MULTIPLICATION', 1.05, 'Fermentation améliore biodisponibilité magnésium', 100),

-- Vitamines (production de B12 par bactéries)
('fermentation lactique', 'FERMENTATION', 'vitamine_b12', 'MULTIPLICATION', 1.15, 'Fermentation lactique produit vitamine B12', 100),
('fermentation lactique', 'FERMENTATION', 'vitamine_b2', 'MULTIPLICATION', 1.08, 'Fermentation lactique produit vitamine B2', 100);

-- Caillage sans fermentation longue (fromage frais)
INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('caillage lactique égouttage.*0%.*MG', 'FERMENTATION', 'proteines', 'MULTIPLICATION', 1.5, 'Caillage égouttage concentre protéines (0% MG)', 105),
('caillage lactique égouttage.*0%.*MG', 'FERMENTATION', 'lipides', 'MULTIPLICATION', 0.1, 'Fromage 0% MG - élimination quasi-totale lipides', 105),
('caillage lactique égouttage.*0%.*MG', 'FERMENTATION', 'calories', 'MULTIPLICATION', 0.6, 'Fromage 0% MG - réduction calorique importante', 105);

-- =============================================================================
-- CATÉGORIE 4: AGING (affinage fromages - 3-4x concentration)
-- Processus: affinage X mois/semaines
-- Effet: Perte d'eau importante sur période longue, concentration majeure
-- Exemples: Fromages affinés (chèvre sec, comté, parmesan)
-- =============================================================================

INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
-- Affinage long (8+ semaines) - concentration maximale
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'calories', 'MULTIPLICATION', 3.5, 'Affinage concentre calories 3.5x par perte eau', 100),
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'proteines', 'MULTIPLICATION', 3.5, 'Affinage concentre protéines 3.5x', 100),
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'lipides', 'MULTIPLICATION', 3.5, 'Affinage concentre matière grasse 3.5x', 100),
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'glucides', 'MULTIPLICATION', 3.5, 'Affinage concentre glucides résiduels', 100),

-- Minéraux super-concentrés dans fromages affinés
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'calcium', 'MULTIPLICATION', 8.0, 'Calcium très concentré dans fromages affinés', 100),
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'phosphore', 'MULTIPLICATION', 7.0, 'Phosphore concentré dans fromages affinés', 100),
('affinage.*\d+.*semaines|affinage.*\d+.*mois', 'AGING', 'sodium', 'MULTIPLICATION', 4.0, 'Sodium concentré (+ salaison) fromages affinés', 100);

-- =============================================================================
-- CATÉGORIE 5: MECHANICAL (aucun changement nutritionnel)
-- Processus: hachage, découpe, filet, steak, morceaux, broyage
-- Effet: Changement de forme uniquement, 0 impact nutritionnel
-- Note: Ces règles servent de documentation mais ne font rien (1x)
-- =============================================================================

-- Pas de règles nécessaires - si aucun pattern ne matche, le système utilise 1x par défaut

-- =============================================================================
-- CATÉGORIE 6: PRESERVATION (perte vitamines mineure)
-- Processus: fumage, congélation, mise en bocal
-- Effet: Légère perte de vitamines sensibles
-- Exemples: Poissons fumés, légumes congelés
-- =============================================================================

INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
-- Fumage
('fumage|fumé', 'PRESERVATION', 'vitamine_c', 'RETENTION', 0.85, 'Fumage - perte vitamine C 15%', 100),
('fumage|fumé', 'PRESERVATION', 'vitamine_b1', 'RETENTION', 0.90, 'Fumage - perte vitamine B1 10%', 100),
('fumage|fumé', 'PRESERVATION', 'vitamine_b6', 'RETENTION', 0.92, 'Fumage - légère perte B6', 100),

-- Congélation (perte minimale)
('congélation|congelé|surgelé', 'PRESERVATION', 'vitamine_c', 'RETENTION', 0.95, 'Congélation - perte vitamine C minimale 5%', 100),
('congélation|congelé|surgelé', 'PRESERVATION', 'vitamine_b9', 'RETENTION', 0.97, 'Congélation - perte folates minimale', 100),

-- Mise en bocal / Appertisation
('mise en bocal|appertis|conserve', 'PRESERVATION', 'vitamine_c', 'RETENTION', 0.80, 'Appertisation - perte vitamine C 20%', 100),
('mise en bocal|appertis|conserve', 'PRESERVATION', 'vitamine_b1', 'RETENTION', 0.85, 'Appertisation - perte B1 15%', 100);

-- =============================================================================
-- CATÉGORIE 7: SALAISON / SAUMURE (conservation + concentration légère)
-- Processus: salaison, saumurage
-- Effet: Déshydratation osmotique partielle, augmentation sodium
-- Exemples: Jambon salé, poissons salés
-- =============================================================================

INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('salaison|saumur', 'PRESERVATION', 'proteines', 'MULTIPLICATION', 1.15, 'Salaison - légère concentration protéines par perte eau', 100),
('salaison|saumur', 'PRESERVATION', 'lipides', 'MULTIPLICATION', 1.10, 'Salaison - légère concentration lipides', 100),
('salaison|saumur', 'PRESERVATION', 'sodium', 'MULTIPLICATION', 25.0, 'Salaison - augmentation massive sodium', 100),
('salaison|saumur', 'PRESERVATION', 'calories', 'MULTIPLICATION', 1.12, 'Salaison - légère concentration calorique', 100);

-- =============================================================================
-- CATÉGORIE 8: CUISSON (géré par cooking_nutrition_factors)
-- Note: Les processus contenant "cuisson" ne doivent PAS matcher ici pour
-- éviter double application avec cooking_nutrition_factors de la recette
-- =============================================================================

-- Pas de règles ici - la cuisson est gérée séparément dans le contexte de la recette

-- =============================================================================
-- CATÉGORIE 9: EXTRACTION (dépend fortement du produit)
-- Processus: extraction, pressage (huiles, jus)
-- Note: Ces produits nécessitent généralement des overrides CIQUAL directs
-- =============================================================================

-- Jus de fruits (perte fibres, concentration sucres)
INSERT INTO process_nutrition_modifiers (process_pattern, category, nutrient_name, factor_type, factor_value, description, priority) VALUES
('extraction.*jus|pressage.*jus', 'CONCENTRATION', 'glucides', 'MULTIPLICATION', 1.2, 'Extraction jus concentre sucres 20%', 100),
('extraction.*jus|pressage.*jus', 'CONCENTRATION', 'fibres', 'MULTIPLICATION', 0.1, 'Extraction jus élimine 90% fibres', 100),
('extraction.*jus|pressage.*jus', 'CONCENTRATION', 'vitamine_c', 'MULTIPLICATION', 1.1, 'Jus conserve vitamine C', 100);

-- =============================================================================
-- STATISTIQUES
-- =============================================================================

-- Compter les règles insérées par catégorie
DO $$
DECLARE
    total_rules INTEGER;
    by_category RECORD;
BEGIN
    SELECT COUNT(*) INTO total_rules FROM process_nutrition_modifiers;
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'RÈGLES DE MODIFICATION NUTRITIONNELLE INSÉRÉES';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Total règles: %', total_rules;
    RAISE NOTICE '';
    RAISE NOTICE 'Par catégorie:';

    FOR by_category IN
        SELECT category, COUNT(*) as count
        FROM process_nutrition_modifiers
        GROUP BY category
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  % : % règles', RPAD(by_category.category, 20), by_category.count;
    END LOOP;
    RAISE NOTICE '=============================================================================';
END $$;
