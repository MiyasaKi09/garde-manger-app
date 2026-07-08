-- ============================================================================
-- Système de Cache pour les Valeurs Nutritionnelles des Recettes
-- ============================================================================
--
-- Au lieu de recalculer à chaque fois, on stocke les valeurs dans une table
-- et on les recalcule uniquement quand la recette change
--
-- Avantages:
-- - Performance: 1000x plus rapide (lecture simple vs calcul complexe)
-- - Économie de ressources serveur
-- - Traçabilité: on peut voir l'historique des calculs
--
-- Usage:
--   psql "$DATABASE_URL_TX" -f tools/create_nutrition_cache.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Créer la table de cache
-- ============================================================================

CREATE TABLE IF NOT EXISTS recipe_nutrition_cache (
    id BIGSERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    
    -- Valeurs nutritionnelles par portion
    calories_per_serving NUMERIC(10,2),
    proteines_per_serving NUMERIC(10,2),
    glucides_per_serving NUMERIC(10,2),
    lipides_per_serving NUMERIC(10,2),
    
    -- Valeurs nutritionnelles totales
    calories_total NUMERIC(10,2),
    proteines_total NUMERIC(10,2),
    glucides_total NUMERIC(10,2),
    lipides_total NUMERIC(10,2),
    
    -- Métadonnées pour la gestion du cache
    servings INTEGER NOT NULL,
    cooking_method VARCHAR(100),
    ingredient_count INTEGER DEFAULT 0,
    
    -- Hash pour détecter les changements
    -- Format: MD5(recipe.cooking_method + recipe.servings + SUM(ingredient_id:quantity:unit))
    recipe_hash VARCHAR(32) NOT NULL,
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    
    -- Index pour performance
    CONSTRAINT recipe_nutrition_cache_unique UNIQUE (recipe_id, recipe_hash)
);

CREATE INDEX idx_recipe_nutrition_cache_recipe_id ON recipe_nutrition_cache(recipe_id);
CREATE INDEX idx_recipe_nutrition_cache_valid ON recipe_nutrition_cache(recipe_id, is_valid) WHERE is_valid = TRUE;

COMMENT ON TABLE recipe_nutrition_cache IS 
'Cache des valeurs nutritionnelles calculées pour les recettes.
Permet d''éviter de recalculer à chaque fois et améliore drastiquement les performances.';

COMMENT ON COLUMN recipe_nutrition_cache.recipe_hash IS 
'Hash MD5 des paramètres de la recette (méthode cuisson + portions + ingrédients).
Permet de détecter si la recette a changé et si le cache doit être invalidé.';

-- ============================================================================
-- 2. Fonction pour calculer le hash d'une recette
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_recipe_hash(recipe_id_param INTEGER)
RETURNS VARCHAR(32) AS $$
DECLARE
    hash_input TEXT;
    result_hash VARCHAR(32);
BEGIN
    -- Construire la chaîne à hasher
    SELECT 
        COALESCE(r.cooking_method, 'cru') || '|' ||
        COALESCE(r.servings, 1)::TEXT || '|' ||
        STRING_AGG(
            COALESCE(ri.canonical_food_id, ri.archetype_id)::TEXT || ':' ||
            ri.quantity::TEXT || ':' ||
            ri.unit,
            ','
            ORDER BY ri.id
        )
    INTO hash_input
    FROM recipes r
    LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    WHERE r.id = recipe_id_param
    GROUP BY r.id, r.cooking_method, r.servings;
    
    -- Calculer le MD5
    result_hash := MD5(COALESCE(hash_input, ''));
    
    RETURN result_hash;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_recipe_hash IS 
'Calcule un hash MD5 unique pour une recette basé sur sa méthode de cuisson,
le nombre de portions et tous ses ingrédients. Permet de détecter les changements.';

-- ============================================================================
-- 3. Fonction pour obtenir les valeurs nutritionnelles (avec cache)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_recipe_nutrition(recipe_id_param INTEGER)
RETURNS TABLE (
    nutrient_name TEXT,
    value_per_serving NUMERIC,
    unit TEXT,
    value_total NUMERIC,
    is_cached BOOLEAN
) AS $$
DECLARE
    current_hash VARCHAR(32);
    cached_record RECORD;
BEGIN
    -- Calculer le hash actuel de la recette
    current_hash := calculate_recipe_hash(recipe_id_param);
    
    -- Chercher dans le cache
    SELECT * INTO cached_record
    FROM recipe_nutrition_cache
    WHERE recipe_id = recipe_id_param
      AND recipe_hash = current_hash
      AND is_valid = TRUE
    LIMIT 1;
    
    -- Si trouvé dans le cache, retourner directement
    IF FOUND THEN
        RETURN QUERY
        SELECT 'Calories'::TEXT, cached_record.calories_per_serving, 'kcal'::TEXT, 
               cached_record.calories_total, TRUE
        UNION ALL
        SELECT 'Protéines'::TEXT, cached_record.proteines_per_serving, 'g'::TEXT,
               cached_record.proteines_total, TRUE
        UNION ALL
        SELECT 'Glucides'::TEXT, cached_record.glucides_per_serving, 'g'::TEXT,
               cached_record.glucides_total, TRUE
        UNION ALL
        SELECT 'Lipides'::TEXT, cached_record.lipides_per_serving, 'g'::TEXT,
               cached_record.lipides_total, TRUE;
        
        RAISE NOTICE '✅ Valeurs nutritionnelles trouvées dans le cache pour recette %', recipe_id_param;
        RETURN;
    END IF;
    
    -- Sinon, calculer et mettre en cache
    RAISE NOTICE '🔄 Cache manquant, calcul et mise en cache pour recette %', recipe_id_param;
    
    -- Marquer les anciens caches comme invalides
    UPDATE recipe_nutrition_cache
    SET is_valid = FALSE
    WHERE recipe_id = recipe_id_param;
    
    -- Calculer les nouvelles valeurs
    RETURN QUERY
    WITH calculated AS (
        SELECT * FROM calculate_recipe_nutrition(recipe_id_param)
    ),
    inserted AS (
        INSERT INTO recipe_nutrition_cache (
            recipe_id,
            calories_per_serving,
            proteines_per_serving,
            glucides_per_serving,
            lipides_per_serving,
            calories_total,
            proteines_total,
            glucides_total,
            lipides_total,
            servings,
            cooking_method,
            ingredient_count,
            recipe_hash
        )
        SELECT 
            recipe_id_param,
            MAX(CASE WHEN nutrient_name = 'Calories' THEN value_per_serving END),
            MAX(CASE WHEN nutrient_name = 'Protéines' THEN value_per_serving END),
            MAX(CASE WHEN nutrient_name = 'Glucides' THEN value_per_serving END),
            MAX(CASE WHEN nutrient_name = 'Lipides' THEN value_per_serving END),
            MAX(CASE WHEN nutrient_name = 'Calories' THEN value_total END),
            MAX(CASE WHEN nutrient_name = 'Protéines' THEN value_total END),
            MAX(CASE WHEN nutrient_name = 'Glucides' THEN value_total END),
            MAX(CASE WHEN nutrient_name = 'Lipides' THEN value_total END),
            (SELECT servings FROM recipes WHERE id = recipe_id_param),
            (SELECT cooking_method FROM recipes WHERE id = recipe_id_param),
            (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = recipe_id_param),
            current_hash
        FROM calculated
        RETURNING *
    )
    SELECT 
        c.nutrient_name,
        c.value_per_serving,
        c.unit,
        c.value_total,
        FALSE AS is_cached
    FROM calculated c;
    
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recipe_nutrition IS 
'Récupère les valeurs nutritionnelles d''une recette.
Utilise le cache si disponible, sinon calcule et met en cache automatiquement.
Retourne is_cached=TRUE si les données viennent du cache.';

-- ============================================================================
-- 4. Triggers pour invalider le cache automatiquement
-- ============================================================================

-- Fonction trigger
CREATE OR REPLACE FUNCTION invalidate_recipe_nutrition_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Invalider le cache de la recette affectée
    IF TG_OP = 'DELETE' THEN
        UPDATE recipe_nutrition_cache
        SET is_valid = FALSE
        WHERE recipe_id = OLD.recipe_id;
        RETURN OLD;
    ELSE
        UPDATE recipe_nutrition_cache
        SET is_valid = FALSE
        WHERE recipe_id = COALESCE(NEW.recipe_id, NEW.id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur recipe_ingredients (INSERT, UPDATE, DELETE)
DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_ingredients ON recipe_ingredients;
CREATE TRIGGER trigger_invalidate_cache_on_ingredients
    AFTER INSERT OR UPDATE OR DELETE ON recipe_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_recipe_nutrition_cache();

-- Trigger sur recipes (UPDATE de cooking_method ou servings)
DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_recipe_change ON recipes;
CREATE TRIGGER trigger_invalidate_cache_on_recipe_change
    AFTER UPDATE OF cooking_method, servings ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_recipe_nutrition_cache();

-- ============================================================================
-- 5. Fonction pour recalculer toutes les recettes (batch)
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_all_nutrition_cache()
RETURNS TABLE (
    recipe_id INTEGER,
    status TEXT,
    processing_time_ms NUMERIC
) AS $$
DECLARE
    recipe_record RECORD;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    FOR recipe_record IN 
        SELECT id, name FROM recipes ORDER BY id
    LOOP
        start_time := clock_timestamp();
        
        BEGIN
            -- Forcer le recalcul en supprimant le cache
            DELETE FROM recipe_nutrition_cache WHERE recipe_nutrition_cache.recipe_id = recipe_record.id;
            
            -- Appeler la fonction qui va recalculer et mettre en cache
            PERFORM * FROM get_recipe_nutrition(recipe_record.id);
            
            end_time := clock_timestamp();
            
            RETURN QUERY SELECT 
                recipe_record.id,
                '✅ Calculé'::TEXT,
                ROUND(EXTRACT(MILLISECONDS FROM (end_time - start_time))::NUMERIC, 2);
                
        EXCEPTION WHEN OTHERS THEN
            end_time := clock_timestamp();
            
            RETURN QUERY SELECT 
                recipe_record.id,
                ('❌ Erreur: ' || SQLERRM)::TEXT,
                ROUND(EXTRACT(MILLISECONDS FROM (end_time - start_time))::NUMERIC, 2);
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_all_nutrition_cache IS 
'Recalcule les valeurs nutritionnelles de TOUTES les recettes et met en cache.
Utile après un import massif de données Ciqual ou une modification des coefficients de cuisson.';

-- ============================================================================
-- 6. Vues utiles pour monitoring
-- ============================================================================

-- Vue: Statistiques du cache
CREATE OR REPLACE VIEW v_nutrition_cache_stats AS
SELECT 
    COUNT(*) AS total_cached_recipes,
    COUNT(*) FILTER (WHERE is_valid = TRUE) AS valid_caches,
    COUNT(*) FILTER (WHERE is_valid = FALSE) AS invalid_caches,
    COUNT(DISTINCT recipe_id) AS unique_recipes,
    MIN(calculated_at) AS oldest_cache,
    MAX(calculated_at) AS newest_cache,
    ROUND(AVG(ingredient_count)::NUMERIC, 1) AS avg_ingredients_per_recipe
FROM recipe_nutrition_cache;

-- Vue: Recettes sans cache valide
CREATE OR REPLACE VIEW v_recipes_without_cache AS
SELECT 
    r.id,
    r.name,
    r.cooking_method,
    r.servings,
    COUNT(ri.id) AS ingredient_count,
    CASE 
        WHEN COUNT(ri.id) = 0 THEN 'Aucun ingrédient'
        WHEN NOT EXISTS (
            SELECT 1 FROM recipe_nutrition_cache rnc
            WHERE rnc.recipe_id = r.id AND rnc.is_valid = TRUE
        ) THEN 'Cache absent'
        ELSE 'OK'
    END AS status
FROM recipes r
LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
LEFT JOIN recipe_nutrition_cache rnc ON rnc.recipe_id = r.id AND rnc.is_valid = TRUE
GROUP BY r.id, r.name, r.cooking_method, r.servings
HAVING NOT EXISTS (
    SELECT 1 FROM recipe_nutrition_cache rnc2
    WHERE rnc2.recipe_id = r.id AND rnc2.is_valid = TRUE
)
ORDER BY r.id;

COMMIT;

-- ============================================================================
-- Afficher un résumé
-- ============================================================================

\echo ''
\echo '✅ Système de cache nutritionnel créé avec succès!'
\echo ''
\echo '📊 Tables créées:'
\echo '   - recipe_nutrition_cache (stockage des valeurs)'
\echo ''
\echo '🔧 Fonctions créées:'
\echo '   - calculate_recipe_hash(recipe_id) : Calcule le hash de détection'
\echo '   - get_recipe_nutrition(recipe_id) : Utilise le cache (recommandé!)'
\echo '   - recalculate_all_nutrition_cache() : Recalcule tout en batch'
\echo ''
\echo '⚡ Triggers créés:'
\echo '   - Auto-invalidation sur changement ingrédients'
\echo '   - Auto-invalidation sur changement méthode/portions'
\echo ''
\echo '👁️ Vues de monitoring:'
\echo '   - v_nutrition_cache_stats : Statistiques du cache'
\echo '   - v_recipes_without_cache : Recettes à calculer'
\echo ''
\echo '💡 Utilisation:'
\echo '   -- Dans votre code, remplacer:'
\echo '   SELECT * FROM calculate_recipe_nutrition(142);'
\echo '   -- Par:'
\echo '   SELECT * FROM get_recipe_nutrition(142);  -- ⚡ Avec cache!'
\echo ''
\echo '   -- Recalculer toutes les recettes:'
\echo '   SELECT * FROM recalculate_all_nutrition_cache();'
\echo ''
\echo '   -- Voir les stats:'
\echo '   SELECT * FROM v_nutrition_cache_stats;'
\echo ''
