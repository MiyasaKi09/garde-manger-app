-- ================================================================================================
-- MYKO RECIPES - FONCTIONS AVANCÉES ET INTELLIGENCE
-- ================================================================================================
-- Fonctions pour calculer la nutrition, le score Myko et gérer les substitutions
-- À exécuter APRÈS myko_database_main.sql ET myko_sample_data.sql
-- ================================================================================================

-- ================================================================================================
-- 1. FONCTION D'EXTRACTION NUTRITION DEPUIS L'INVENTORY
-- ================================================================================================

-- Fonction pour extraire la nutrition depuis vos tables existantes
CREATE OR REPLACE FUNCTION extract_nutrition_from_product(
    p_product_type VARCHAR(20), 
    p_product_id BIGINT
) 
RETURNS JSONB AS $$
DECLARE
    nutrition_data JSONB := '{}'::jsonb;
    canonical_nutrition JSONB;
    override_nutrition JSONB;
BEGIN
    -- Logique selon le type de produit (respecte votre architecture)
    CASE p_product_type
        WHEN 'canonical' THEN
            -- Nutrition directe depuis canonical_foods
            SELECT nutrition_profile INTO canonical_nutrition 
            FROM canonical_foods 
            WHERE id = p_product_id;
            nutrition_data := COALESCE(canonical_nutrition, '{}'::jsonb);
            
        WHEN 'cultivar' THEN
            -- Cultivar: nutrition_override OU nutrition du canonical parent
            SELECT cv.nutrition_override, cf.nutrition_profile 
            INTO override_nutrition, canonical_nutrition
            FROM cultivars cv
            JOIN canonical_foods cf ON cv.canonical_food_id = cf.id
            WHERE cv.id = p_product_id;
            
            -- Prioriser l'override du cultivar
            nutrition_data := COALESCE(override_nutrition, canonical_nutrition, '{}'::jsonb);
            
        WHEN 'archetype' THEN
            -- Archetype: nutrition_profile OU nutrition du parent
            SELECT 
                a.nutrition_profile,
                CASE 
                    WHEN a.canonical_food_id IS NOT NULL THEN cf.nutrition_profile
                    WHEN a.cultivar_id IS NOT NULL THEN COALESCE(cv.nutrition_override, cf2.nutrition_profile)
                    ELSE NULL
                END as parent_nutrition
            INTO override_nutrition, canonical_nutrition
            FROM archetypes a
            LEFT JOIN canonical_foods cf ON a.canonical_food_id = cf.id
            LEFT JOIN cultivars cv ON a.cultivar_id = cv.id
            LEFT JOIN canonical_foods cf2 ON cv.canonical_food_id = cf2.id
            WHERE a.id = p_product_id;
            
            nutrition_data := COALESCE(override_nutrition, canonical_nutrition, '{}'::jsonb);
            
        WHEN 'product' THEN
            -- Product commercial: nutrition_override OU nutrition de l'archetype
            SELECT 
                p.nutrition_override,
                a.nutrition_profile,
                CASE 
                    WHEN a.canonical_food_id IS NOT NULL THEN cf.nutrition_profile
                    WHEN a.cultivar_id IS NOT NULL THEN COALESCE(cv.nutrition_override, cf2.nutrition_profile)
                    ELSE NULL
                END as fallback_nutrition
            INTO override_nutrition, canonical_nutrition, canonical_nutrition
            FROM products p
            JOIN archetypes a ON p.archetype_id = a.id
            LEFT JOIN canonical_foods cf ON a.canonical_food_id = cf.id
            LEFT JOIN cultivars cv ON a.cultivar_id = cv.id
            LEFT JOIN canonical_foods cf2 ON cv.canonical_food_id = cf2.id
            WHERE p.id::text = p_product_id::text;
            
            nutrition_data := COALESCE(override_nutrition, canonical_nutrition, '{}'::jsonb);
    END CASE;
    
    RETURN nutrition_data;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- 2. FONCTION DE CONVERSION D'UNITÉS
-- ================================================================================================

-- Fonction pour convertir les unités en grammes
CREATE OR REPLACE FUNCTION convert_to_grams(
    p_product_type VARCHAR(20),
    p_product_id BIGINT,
    p_quantity DECIMAL(8,3),
    p_unit VARCHAR(20)
)
RETURNS DECIMAL(8,2) AS $$
DECLARE
    result_grams DECIMAL(8,2);
    density DECIMAL(6,3);
    grams_per_unit DECIMAL(8,2);
BEGIN
    -- Si déjà en grammes
    IF p_unit = 'g' THEN
        RETURN p_quantity;
    END IF;
    
    -- Conversion millilitres vers grammes (utilise density)
    IF p_unit = 'ml' THEN
        SELECT 
            CASE p_product_type
                WHEN 'canonical' THEN (SELECT density_g_per_ml FROM canonical_foods WHERE id = p_product_id)
                WHEN 'cultivar' THEN (SELECT density_g_per_ml FROM cultivars WHERE id = p_product_id)
                WHEN 'archetype' THEN (SELECT density_g_per_ml FROM archetypes WHERE id = p_product_id)
                ELSE NULL
            END INTO density;
        
        RETURN p_quantity * COALESCE(density, 1.0);
    END IF;
    
    -- Conversion pièces vers grammes (utilise grams_per_unit)
    IF p_unit = 'pièce' OR p_unit = 'unité' THEN
        SELECT 
            CASE p_product_type
                WHEN 'canonical' THEN (SELECT grams_per_unit FROM canonical_foods WHERE id = p_product_id)
                WHEN 'cultivar' THEN (SELECT grams_per_unit FROM cultivars WHERE id = p_product_id)
                WHEN 'archetype' THEN (SELECT grams_per_unit FROM archetypes WHERE id = p_product_id)
                ELSE NULL
            END INTO grams_per_unit;
        
        RETURN p_quantity * COALESCE(grams_per_unit, 100.0);
    END IF;
    
    -- Conversions standard
    CASE p_unit
        WHEN 'kg' THEN RETURN p_quantity * 1000;
        WHEN 'l' THEN RETURN p_quantity * 1000; -- approximation 1L = 1kg pour liquides
        WHEN 'cuillère à soupe', 'c. à s.' THEN RETURN p_quantity * 15; -- ~15g
        WHEN 'cuillère à café', 'c. à c.' THEN RETURN p_quantity * 5;   -- ~5g
        WHEN 'tasse' THEN RETURN p_quantity * 200; -- ~200g
        ELSE RETURN p_quantity; -- fallback
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- 3. FONCTION DE CALCUL NUTRITIONNEL AVEC CUISSON
-- ================================================================================================

-- Fonction principale pour calculer la nutrition d'une recette
CREATE OR REPLACE FUNCTION calculate_recipe_nutrition_with_cooking()
RETURNS TRIGGER AS $$
DECLARE
    total_calories DECIMAL(8,2) := 0;
    total_proteins DECIMAL(8,2) := 0;
    total_carbs DECIMAL(8,2) := 0;
    total_fats DECIMAL(8,2) := 0;
    total_fiber DECIMAL(8,2) := 0;
    total_vitamin_c DECIMAL(8,2) := 0;
    total_iron DECIMAL(8,2) := 0;
    total_calcium DECIMAL(8,2) := 0;
    
    ingredient_record RECORD;
    nutrition_data JSONB;
    quantity_grams DECIMAL(8,2);
    
    -- Facteurs de rétention de la technique de cuisson
    cal_retention DECIMAL(3,2) := 1.0;
    prot_retention DECIMAL(3,2) := 1.0;
    carb_retention DECIMAL(3,2) := 1.0;
    fat_retention DECIMAL(3,2) := 1.0;
    fiber_retention DECIMAL(3,2) := 1.0;
    vitc_retention DECIMAL(3,2) := 1.0;
    mineral_retention DECIMAL(3,2) := 1.0;
BEGIN
    -- Parcourir tous les ingrédients de la recette
    FOR ingredient_record IN 
        SELECT ri.*, ct.calories_retention, ct.protein_retention, ct.carbs_retention, 
               ct.fat_retention, ct.fiber_retention, ct.vitamin_c_retention, 
               ct.minerals_retention
        FROM recipe_ingredients ri
        LEFT JOIN cooking_techniques ct ON ri.cooking_technique_id = ct.id
        WHERE ri.recipe_id = NEW.id
    LOOP
        -- Extraire les données nutritionnelles du produit
        nutrition_data := extract_nutrition_from_product(
            ingredient_record.product_type, 
            ingredient_record.product_id
        );
        
        -- Convertir la quantité en grammes
        quantity_grams := convert_to_grams(
            ingredient_record.product_type,
            ingredient_record.product_id,
            ingredient_record.quantity,
            ingredient_record.unit
        );
        
        -- Récupérer les facteurs de rétention de la technique de cuisson
        cal_retention := COALESCE(ingredient_record.calories_retention, 1.0);
        prot_retention := COALESCE(ingredient_record.protein_retention, 1.0);
        carb_retention := COALESCE(ingredient_record.carbs_retention, 1.0);
        fat_retention := COALESCE(ingredient_record.fat_retention, 1.0);
        fiber_retention := COALESCE(ingredient_record.fiber_retention, 1.0);
        vitc_retention := COALESCE(ingredient_record.vitamin_c_retention, 1.0);
        mineral_retention := COALESCE(ingredient_record.minerals_retention, 1.0);
        
        -- Calculer la contribution de chaque nutriment
        IF nutrition_data ? 'calories_per_100g' THEN
            total_calories := total_calories + (
                (nutrition_data->>'calories_per_100g')::DECIMAL * quantity_grams / 100 * cal_retention
            );
        END IF;
        
        IF nutrition_data ? 'proteins_per_100g' THEN
            total_proteins := total_proteins + (
                (nutrition_data->>'proteins_per_100g')::DECIMAL * quantity_grams / 100 * prot_retention
            );
        END IF;
        
        IF nutrition_data ? 'carbs_per_100g' THEN
            total_carbs := total_carbs + (
                (nutrition_data->>'carbs_per_100g')::DECIMAL * quantity_grams / 100 * carb_retention
            );
        END IF;
        
        IF nutrition_data ? 'fats_per_100g' THEN
            total_fats := total_fats + (
                (nutrition_data->>'fats_per_100g')::DECIMAL * quantity_grams / 100 * fat_retention
            );
        END IF;
        
        IF nutrition_data ? 'fiber_per_100g' THEN
            total_fiber := total_fiber + (
                (nutrition_data->>'fiber_per_100g')::DECIMAL * quantity_grams / 100 * fiber_retention
            );
        END IF;
        
        IF nutrition_data ? 'vitamin_c_per_100g' THEN
            total_vitamin_c := total_vitamin_c + (
                (nutrition_data->>'vitamin_c_per_100g')::DECIMAL * quantity_grams / 100 * vitc_retention
            );
        END IF;
        
        IF nutrition_data ? 'iron_per_100g' THEN
            total_iron := total_iron + (
                (nutrition_data->>'iron_per_100g')::DECIMAL * quantity_grams / 100 * mineral_retention
            );
        END IF;
        
        IF nutrition_data ? 'calcium_per_100g' THEN
            total_calcium := total_calcium + (
                (nutrition_data->>'calcium_per_100g')::DECIMAL * quantity_grams / 100 * mineral_retention
            );
        END IF;
    END LOOP;
    
    -- Mettre à jour les valeurs par portion
    IF NEW.servings > 0 THEN
        NEW.calories_per_serving := ROUND(total_calories / NEW.servings, 1);
        NEW.proteins_per_serving := ROUND(total_proteins / NEW.servings, 1);
        NEW.carbs_per_serving := ROUND(total_carbs / NEW.servings, 1);
        NEW.fats_per_serving := ROUND(total_fats / NEW.servings, 1);
        NEW.fiber_per_serving := ROUND(total_fiber / NEW.servings, 1);
        NEW.vitamin_c_per_serving := ROUND(total_vitamin_c / NEW.servings, 1);
        NEW.iron_per_serving := ROUND(total_iron / NEW.servings, 1);
        NEW.calcium_per_serving := ROUND(total_calcium / NEW.servings, 1);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- 4. FONCTION DE CALCUL DU SCORE MYKO
-- ================================================================================================

-- Fonction pour calculer le score Myko avec intelligence inventory
CREATE OR REPLACE FUNCTION calculate_myko_score_with_inventory()
RETURNS TRIGGER AS $$
DECLARE
    score INTEGER := 0;
    factors JSONB := '{}'::jsonb;
    
    -- Composantes du score
    nutrition_score INTEGER := 0;
    seasonal_bonus INTEGER := 0;
    inventory_bonus INTEGER := 0;
    complexity_penalty INTEGER := 0;
    dietary_bonus INTEGER := 0;
    
    -- Variables inventory
    ingredient_record RECORD;
    available_count INTEGER := 0;
    total_ingredients INTEGER := 0;
    expiring_soon_count INTEGER := 0;
    
    current_month INTEGER;
BEGIN
    current_month := EXTRACT(MONTH FROM NOW());
    
    -- 1. SCORE NUTRITIONNEL (30 points max)
    -- Équilibre calorique
    IF NEW.calories_per_serving BETWEEN 200 AND 600 THEN
        nutrition_score := nutrition_score + 10;
        factors := factors || '{"calories_balanced": true}'::jsonb;
    ELSIF NEW.calories_per_serving > 600 THEN
        nutrition_score := nutrition_score + 5;
        factors := factors || '{"high_calories": true}'::jsonb;
    END IF;
    
    -- Apport protéique
    IF NEW.proteins_per_serving >= 15 THEN
        nutrition_score := nutrition_score + 10;
        factors := factors || '{"high_protein": true}'::jsonb;
    ELSIF NEW.proteins_per_serving >= 8 THEN
        nutrition_score := nutrition_score + 6;
        factors := factors || '{"good_protein": true}'::jsonb;
    END IF;
    
    -- Fibres
    IF NEW.fiber_per_serving >= 5 THEN
        nutrition_score := nutrition_score + 8;
        factors := factors || '{"high_fiber": true}'::jsonb;
    ELSIF NEW.fiber_per_serving >= 3 THEN
        nutrition_score := nutrition_score + 4;
        factors := factors || '{"moderate_fiber": true}'::jsonb;
    END IF;
    
    -- Vitamines et minéraux
    IF NEW.vitamin_c_per_serving >= 20 THEN
        nutrition_score := nutrition_score + 2;
        factors := factors || '{"vitamin_c_rich": true}'::jsonb;
    END IF;
    
    -- 2. SCORE SAISONNIER (15 points max)
    CASE current_month
        WHEN 3,4,5 THEN -- Printemps
            IF NEW.season_spring THEN seasonal_bonus := 15; END IF;
        WHEN 6,7,8 THEN -- Été
            IF NEW.season_summer THEN seasonal_bonus := 15; END IF;
        WHEN 9,10,11 THEN -- Automne
            IF NEW.season_autumn THEN seasonal_bonus := 15; END IF;
        WHEN 12,1,2 THEN -- Hiver
            IF NEW.season_winter THEN seasonal_bonus := 15; END IF;
    END CASE;
    
    IF seasonal_bonus > 0 THEN
        factors := factors || '{"seasonal": true}'::jsonb;
    END IF;
    
    -- 3. SCORE INVENTORY (30 points max - LE PLUS IMPORTANT)
    SELECT COUNT(*) INTO total_ingredients
    FROM recipe_ingredients ri
    WHERE ri.recipe_id = NEW.id;
    
    IF total_ingredients > 0 THEN
        -- Compter ingrédients disponibles et ceux qui expirent bientôt
        FOR ingredient_record IN 
            SELECT ri.product_type, ri.product_id, ri.quantity
            FROM recipe_ingredients ri
            WHERE ri.recipe_id = NEW.id
        LOOP
            -- Vérifier disponibilité dans l'inventory
            IF EXISTS (
                SELECT 1 FROM inventory_lots il
                WHERE il.product_type = ingredient_record.product_type
                AND il.product_id = ingredient_record.product_id
                AND il.qty_remaining > 0
                AND (il.expiration_date IS NULL OR il.expiration_date > CURRENT_DATE)
            ) THEN
                available_count := available_count + 1;
                
                -- Bonus si l'ingrédient expire bientôt (anti-gaspi)
                IF EXISTS (
                    SELECT 1 FROM inventory_lots il
                    WHERE il.product_type = ingredient_record.product_type
                    AND il.product_id = ingredient_record.product_id
                    AND il.expiration_date IS NOT NULL
                    AND il.expiration_date <= CURRENT_DATE + INTERVAL '3 days'
                    AND il.expiration_date > CURRENT_DATE
                ) THEN
                    expiring_soon_count := expiring_soon_count + 1;
                END IF;
            END IF;
        END LOOP;
        
        -- Calculer le bonus inventory (30 points max)
        inventory_bonus := ROUND((available_count::DECIMAL / total_ingredients) * 25);
        
        -- Bonus anti-gaspi pour ingrédients qui expirent bientôt
        inventory_bonus := inventory_bonus + (expiring_soon_count * 2);
        inventory_bonus := LEAST(inventory_bonus, 30);
        
        -- Mettre à jour le score de compatibilité inventory
        NEW.inventory_compatibility_score := ROUND((available_count::DECIMAL / total_ingredients) * 100);
        
        -- Facteurs détaillés
        IF available_count = total_ingredients THEN
            factors := factors || '{"all_ingredients_available": true}'::jsonb;
        ELSIF available_count >= (total_ingredients * 0.8) THEN
            factors := factors || '{"most_ingredients_available": true}'::jsonb;
        END IF;
        
        IF expiring_soon_count > 0 THEN
            factors := factors || json_build_object('anti_waste_opportunity', expiring_soon_count)::jsonb;
        END IF;
    ELSE
        NEW.inventory_compatibility_score := 0;
    END IF;
    
    -- 4. PÉNALITÉ DE COMPLEXITÉ (0-20 points de malus)
    DECLARE
        total_time INTEGER := NEW.prep_min + NEW.cook_min + NEW.rest_min;
    BEGIN
        IF total_time > 180 THEN -- Plus de 3h
            complexity_penalty := 20;
            factors := factors || '{"very_long": true}'::jsonb;
        ELSIF total_time > 120 THEN -- Plus de 2h
            complexity_penalty := 15;
            factors := factors || '{"long": true}'::jsonb;
        ELSIF total_time > 60 THEN -- Plus de 1h
            complexity_penalty := 8;
            factors := factors || '{"moderate_time": true}'::jsonb;
        END IF;
    END;
    
    -- 5. BONUS RÉGIMES SPÉCIAUX (15 points max)
    IF NEW.is_vegan THEN
        dietary_bonus := dietary_bonus + 8;
        factors := factors || '{"vegan": true}'::jsonb;
    ELSIF NEW.is_vegetarian THEN
        dietary_bonus := dietary_bonus + 5;
        factors := factors || '{"vegetarian": true}'::jsonb;
    END IF;
    
    IF NEW.is_gluten_free THEN
        dietary_bonus := dietary_bonus + 3;
        factors := factors || '{"gluten_free": true}'::jsonb;
    END IF;
    
    IF NEW.is_dairy_free THEN
        dietary_bonus := dietary_bonus + 2;
        factors := factors || '{"dairy_free": true}'::jsonb;
    END IF;
    
    dietary_bonus := LEAST(dietary_bonus, 15);
    
    -- 6. BONUS SPÉCIAL MYKO (10 points max)
    DECLARE
        myko_bonus INTEGER := 0;
    BEGIN
        -- Bonus si catégorie anti-gaspi
        IF EXISTS (
            SELECT 1 FROM recipe_categories rc 
            WHERE rc.id = NEW.category_id AND rc.slug = 'anti-gaspi'
        ) THEN
            myko_bonus := myko_bonus + 5;
            factors := factors || '{"anti_gaspi_recipe": true}'::jsonb;
        END IF;
        
        -- Bonus si cuisine Myko
        IF EXISTS (
            SELECT 1 FROM cuisine_types ct 
            WHERE ct.id = NEW.cuisine_type_id AND ct.slug = 'myko'
        ) THEN
            myko_bonus := myko_bonus + 3;
            factors := factors || '{"myko_cuisine": true}'::jsonb;
        END IF;
        
        -- Bonus si très facile (encourage l'utilisation)
        IF EXISTS (
            SELECT 1 FROM difficulty_levels dl 
            WHERE dl.id = NEW.difficulty_level_id AND dl.level = 'très_facile'
        ) THEN
            myko_bonus := myko_bonus + 2;
            factors := factors || '{"very_easy": true}'::jsonb;
        END IF;
        
        dietary_bonus := dietary_bonus + myko_bonus;
    END;
    
    -- 7. CALCUL FINAL
    score := nutrition_score + seasonal_bonus + inventory_bonus + dietary_bonus - complexity_penalty;
    score := GREATEST(0, LEAST(100, score)); -- Clamp entre 0 et 100
    
    -- Détails des scores dans les facteurs
    factors := factors || json_build_object(
        'nutrition_score', nutrition_score,
        'seasonal_bonus', seasonal_bonus,
        'inventory_bonus', inventory_bonus,
        'dietary_bonus', dietary_bonus,
        'complexity_penalty', complexity_penalty,
        'available_ingredients', available_count,
        'total_ingredients', total_ingredients,
        'expiring_ingredients', expiring_soon_count,
        'final_score', score
    )::jsonb;
    
    NEW.myko_score := score;
    NEW.myko_factors := factors;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- 5. FONCTION POUR AUTO-GÉNÉRER LES SUBSTITUTIONS
-- ================================================================================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS auto_generate_canonical_substitutions();

-- Fonction pour auto-générer les substitutions canonical → cultivars
CREATE OR REPLACE FUNCTION auto_generate_canonical_substitutions() 
RETURNS TABLE(generated_count INTEGER, message TEXT) AS $$
DECLARE
    canonical_record RECORD;
    cultivar_record RECORD;
    substitution_count INTEGER := 0;
BEGIN
    -- Pour chaque canonical_food, créer des substitutions vers tous ses cultivars
    FOR canonical_record IN 
        SELECT id, canonical_name FROM canonical_foods 
    LOOP
        FOR cultivar_record IN 
            SELECT id, cultivar_name FROM cultivars 
            WHERE canonical_food_id = canonical_record.id 
        LOOP
            INSERT INTO smart_substitutions (
                original_product_type, original_product_id,
                substitute_product_type, substitute_product_id,
                conversion_ratio, context, compatibility_score, 
                flavor_impact, texture_impact, notes, auto_generated
            ) VALUES (
                'canonical', canonical_record.id,
                'cultivar', cultivar_record.id,
                1.0, 'general', 9, 
                'neutral', 'neutral',
                'Substitution automatique: ' || canonical_record.canonical_name || ' → ' || cultivar_record.cultivar_name,
                TRUE
            ) ON CONFLICT (original_product_type, original_product_id, substitute_product_type, substitute_product_id, context) 
            DO NOTHING;
            
            substitution_count := substitution_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN QUERY SELECT substitution_count, 'Substitutions canonical→cultivar générées automatiquement';
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- 6. VUES INTELLIGENTES COMPLÈTES
-- ================================================================================================

-- Vue complète des recettes avec informations enrichies
CREATE OR REPLACE VIEW recipes_complete AS
SELECT 
    r.*,
    -- Informations des tables de référence
    rc.name as category_name,
    rc.icon as category_icon,
    rc.meal_compatibility,
    ct.name as cuisine_name,
    ct.flag as cuisine_flag,
    dl.name as difficulty_name,
    dl.level as difficulty_level,
    
    -- Calculs dérivés
    (r.prep_min + r.cook_min + r.rest_min) as total_time_min,
    
    -- Compteurs
    (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = r.id) as ingredients_count,
    (SELECT COUNT(*) FROM recipe_steps WHERE recipe_id = r.id) as steps_count,
    (SELECT COUNT(*) FROM recipe_equipment WHERE recipe_id = r.id) as equipment_count,
    
    -- Tags
    (SELECT ARRAY_AGG(tag) FROM recipe_tags WHERE recipe_id = r.id) as tags,
    
    -- Saisonnalité actuelle
    CASE 
        WHEN EXTRACT(MONTH FROM NOW()) IN (3,4,5) THEN r.season_spring
        WHEN EXTRACT(MONTH FROM NOW()) IN (6,7,8) THEN r.season_summer  
        WHEN EXTRACT(MONTH FROM NOW()) IN (9,10,11) THEN r.season_autumn
        ELSE r.season_winter
    END as is_seasonal_now,
    
    -- Informations inventory en temps réel
    (
        SELECT COUNT(*)
        FROM recipe_ingredients ri
        WHERE ri.recipe_id = r.id
        AND EXISTS (
            SELECT 1 FROM inventory_lots il
            WHERE il.product_type = ri.product_type 
            AND il.product_id = ri.product_id
            AND il.qty_remaining > 0
            AND (il.expiration_date IS NULL OR il.expiration_date > CURRENT_DATE)
        )
    ) as available_ingredients_count,
    
    -- Pourcentage d'ingrédients disponibles
    CASE 
        WHEN (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = r.id) = 0 THEN 0
        ELSE ROUND(
            (SELECT COUNT(*)::DECIMAL FROM recipe_ingredients ri
             WHERE ri.recipe_id = r.id
             AND EXISTS (SELECT 1 FROM inventory_lots il
                         WHERE il.product_type = ri.product_type 
                         AND il.product_id = ri.product_id
                         AND il.qty_remaining > 0
                         AND (il.expiration_date IS NULL OR il.expiration_date > CURRENT_DATE))) * 100 / 
            (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = r.id)
        )
    END as inventory_availability_percent,
    
    -- Ingrédients qui expirent bientôt (bonus anti-gaspi)
    (
        SELECT COUNT(*)
        FROM recipe_ingredients ri
        WHERE ri.recipe_id = r.id
        AND EXISTS (
            SELECT 1 FROM inventory_lots il
            WHERE il.product_type = ri.product_type 
            AND il.product_id = ri.product_id
            AND il.expiration_date IS NOT NULL
            AND il.expiration_date <= CURRENT_DATE + INTERVAL '3 days'
            AND il.expiration_date > CURRENT_DATE
        )
    ) as expiring_ingredients_count

FROM recipes r
LEFT JOIN recipe_categories rc ON r.category_id = rc.id
LEFT JOIN cuisine_types ct ON r.cuisine_type_id = ct.id  
LEFT JOIN difficulty_levels dl ON r.difficulty_level_id = dl.id
WHERE r.is_active = true;

-- ================================================================================================
-- 7. TRIGGERS POUR AUTOMATISATION
-- ================================================================================================

-- Trigger pour calcul automatique nutrition + score Myko
CREATE TRIGGER trigger_calculate_nutrition_and_score
    BEFORE INSERT OR UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_recipe_nutrition_with_cooking();

-- Ce trigger appelle aussi automatiquement le calcul du score Myko
CREATE TRIGGER trigger_calculate_myko_score
    AFTER INSERT OR UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_myko_score_with_inventory();

-- ================================================================================================
-- 8. FONCTIONS UTILITAIRES POUR L'APPLICATION
-- ================================================================================================

-- Fonction pour obtenir les recettes recommandées selon l'inventory
CREATE OR REPLACE FUNCTION get_recommended_recipes(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
    recipe_id UUID,
    title VARCHAR(300),
    myko_score INTEGER,
    inventory_match_percent INTEGER,
    expiring_ingredients INTEGER,
    category_name VARCHAR(100),
    total_time_min INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.title,
        r.myko_score,
        r.inventory_availability_percent,
        r.expiring_ingredients_count,
        r.category_name,
        r.total_time_min
    FROM recipes_complete r
    WHERE r.inventory_availability_percent >= 50 -- Au moins 50% des ingrédients disponibles
    ORDER BY 
        r.expiring_ingredients_count DESC, -- Priorité anti-gaspi
        r.inventory_availability_percent DESC,
        r.myko_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour recalculer tous les scores Myko
CREATE OR REPLACE FUNCTION recalculate_all_myko_scores()
RETURNS TABLE(updated_count INTEGER, message TEXT) AS $$
DECLARE
    recipe_count INTEGER;
BEGIN
    -- Forcer le recalcul en mettant à jour updated_at
    UPDATE recipes SET updated_at = NOW() WHERE is_active = true;
    
    GET DIAGNOSTICS recipe_count = ROW_COUNT;
    
    RETURN QUERY SELECT recipe_count, 'Scores Myko recalculés pour toutes les recettes actives';
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- MESSAGE DE SUCCÈS
-- ================================================================================================

SELECT 
    '🧠 Fonctions intelligentes Myko créées !' as status,
    'Calcul nutrition + score + substitutions automatiques' as features,
    'Système prêt pour la production !' as message;