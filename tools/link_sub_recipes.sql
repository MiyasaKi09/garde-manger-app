-- ========================================================================
-- ANALYSE DES SOUS-RECETTES
-- ========================================================================
-- Ce script identifie quelles recettes utilisent des sauces ou d'autres
-- sous-recettes et crée les liens dans recipe_ingredients
-- ========================================================================

BEGIN;

-- ========================================================================
-- 1. IDENTIFIER LES RECETTES QUI UTILISENT BÉCHAMEL
-- ========================================================================

-- Lasagnes utilisent béchamel
INSERT INTO recipe_ingredients (recipe_id, sub_recipe_id, quantity, unit, notes)
SELECT 
    r.id as recipe_id,
    (SELECT id FROM recipes WHERE name = 'Sauce béchamel') as sub_recipe_id,
    500 as quantity,
    'ml' as unit,
    'Pour la sauce blanche' as notes
FROM recipes r
WHERE r.name ~* 'lasagne'
  AND r.role = 'PLAT_PRINCIPAL'
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id 
    AND ri.sub_recipe_id = (SELECT id FROM recipes WHERE name = 'Sauce béchamel')
  );

-- Gratins utilisent béchamel
INSERT INTO recipe_ingredients (recipe_id, sub_recipe_id, quantity, unit, notes)
SELECT 
    r.id as recipe_id,
    (SELECT id FROM recipes WHERE name = 'Sauce béchamel') as sub_recipe_id,
    300 as quantity,
    'ml' as unit,
    'Pour napper le gratin' as notes
FROM recipes r
WHERE r.name ~* 'gratin'
  AND r.role = 'PLAT_PRINCIPAL'
  AND r.name ~* '(endive|chou-fleur|poisson)'
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id 
    AND ri.sub_recipe_id = (SELECT id FROM recipes WHERE name = 'Sauce béchamel')
  );

-- Croque-monsieur utilise béchamel
INSERT INTO recipe_ingredients (recipe_id, sub_recipe_id, quantity, unit, notes)
SELECT 
    r.id as recipe_id,
    (SELECT id FROM recipes WHERE name = 'Sauce béchamel') as sub_recipe_id,
    200 as quantity,
    'ml' as unit,
    'Pour gratiner' as notes
FROM recipes r
WHERE r.name ~* 'croque.monsieur'
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id 
    AND ri.sub_recipe_id = (SELECT id FROM recipes WHERE name = 'Sauce béchamel')
  );

-- ========================================================================
-- 2. IDENTIFIER LES RECETTES QUI UTILISENT SAUCE TOMATE
-- ========================================================================

-- Pâtes à la sauce tomate
INSERT INTO recipe_ingredients (recipe_id, sub_recipe_id, quantity, unit, notes)
SELECT 
    r.id as recipe_id,
    (SELECT id FROM recipes WHERE name = 'Sauce tomate nature') as sub_recipe_id,
    400 as quantity,
    'ml' as unit,
    'Sauce pour les pâtes' as notes
FROM recipes r
WHERE r.name ~* '(spaghetti|penne|pâtes).*tomate'
  AND r.role = 'PLAT_PRINCIPAL'
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id 
    AND ri.sub_recipe_id = (SELECT id FROM recipes WHERE name = 'Sauce tomate nature')
  );

-- Pizzas utilisent sauce tomate
INSERT INTO recipe_ingredients (recipe_id, sub_recipe_id, quantity, unit, notes)
SELECT 
    r.id as recipe_id,
    (SELECT id FROM recipes WHERE name = 'Sauce tomate nature') as sub_recipe_id,
    150 as quantity,
    'ml' as unit,
    'Base de la pizza' as notes
FROM recipes r
WHERE r.name ~* '^pizza'
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id 
    AND ri.sub_recipe_id = (SELECT id FROM recipes WHERE name = 'Sauce tomate nature')
  );

-- ========================================================================
-- 3. IDENTIFIER LES RECETTES QUI UTILISENT BOLOGNAISE
-- ========================================================================

-- Spaghetti bolognaise
INSERT INTO recipe_ingredients (recipe_id, sub_recipe_id, quantity, unit, notes)
SELECT 
    r.id as recipe_id,
    (SELECT id FROM recipes WHERE name = 'Sauce bolognaise') as sub_recipe_id,
    400 as quantity,
    'ml' as unit,
    'Sauce à la viande' as notes
FROM recipes r
WHERE r.name ~* 'spaghetti.*bolognaise'
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id 
    AND ri.sub_recipe_id = (SELECT id FROM recipes WHERE name = 'Sauce bolognaise')
  );

-- Lasagnes bolognaise
INSERT INTO recipe_ingredients (recipe_id, sub_recipe_id, quantity, unit, notes)
SELECT 
    r.id as recipe_id,
    (SELECT id FROM recipes WHERE name = 'Sauce bolognaise') as sub_recipe_id,
    600 as quantity,
    'ml' as unit,
    'Couche de viande' as notes
FROM recipes r
WHERE r.name ~* 'lasagne.*(bolognaise|viande)'
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id 
    AND ri.sub_recipe_id = (SELECT id FROM recipes WHERE name = 'Sauce bolognaise')
  );

-- ========================================================================
-- 4. IDENTIFIER LES RECETTES QUI UTILISENT MAYONNAISE
-- ========================================================================

-- Salades composées avec mayo
INSERT INTO recipe_ingredients (recipe_id, sub_recipe_id, quantity, unit, notes)
SELECT 
    r.id as recipe_id,
    (SELECT id FROM recipes WHERE name = 'Mayonnaise') as sub_recipe_id,
    100 as quantity,
    'ml' as unit,
    'Pour lier la salade' as notes
FROM recipes r
WHERE (r.name ~* 'salade.*(poulet|thon|œuf)' OR r.name = 'Salade César')
  AND r.role IN ('ENTREE', 'PLAT_PRINCIPAL')
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id 
    AND ri.sub_recipe_id = (SELECT id FROM recipes WHERE name = 'Mayonnaise')
  );

-- Burgers avec mayo
INSERT INTO recipe_ingredients (recipe_id, sub_recipe_id, quantity, unit, notes)
SELECT 
    r.id as recipe_id,
    (SELECT id FROM recipes WHERE name = 'Mayonnaise') as sub_recipe_id,
    50 as quantity,
    'ml' as unit,
    'Sauce burger' as notes
FROM recipes r
WHERE r.name ~* '^burger'
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id 
    AND ri.sub_recipe_id = (SELECT id FROM recipes WHERE name = 'Mayonnaise')
  );

-- ========================================================================
-- 5. IDENTIFIER LES RECETTES QUI UTILISENT VINAIGRETTE
-- ========================================================================

-- Salades vertes
INSERT INTO recipe_ingredients (recipe_id, sub_recipe_id, quantity, unit, notes)
SELECT 
    r.id as recipe_id,
    (SELECT id FROM recipes WHERE name = 'Vinaigrette classique') as sub_recipe_id,
    100 as quantity,
    'ml' as unit,
    'Assaisonnement' as notes
FROM recipes r
WHERE r.name ~* '^salade.*(verte|composée|niçoise|grecque)'
  AND r.role IN ('ENTREE', 'PLAT_PRINCIPAL')
  AND NOT EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id 
    AND ri.sub_recipe_id = (SELECT id FROM recipes WHERE name = 'Vinaigrette classique')
  );

COMMIT;

-- ========================================================================
-- VÉRIFICATION FINALE
-- ========================================================================

SELECT 
    '=== STATISTIQUES DES SOUS-RECETTES ===' as info;

-- Compter les liens créés par sauce
SELECT 
    s.name as sauce,
    COUNT(ri.id) as nombre_utilisations,
    STRING_AGG(DISTINCT r.name, ', ' ORDER BY r.name LIMIT 5) as exemples_recettes
FROM recipes s
JOIN recipe_ingredients ri ON ri.sub_recipe_id = s.id
JOIN recipes r ON r.id = ri.recipe_id
WHERE s.role = 'SAUCE'
GROUP BY s.name
ORDER BY COUNT(ri.id) DESC;

-- Recettes utilisant le plus de sous-recettes
SELECT 
    '=== RECETTES COMPLEXES (plusieurs sous-recettes) ===' as info;

SELECT 
    r.name,
    r.role,
    COUNT(ri.sub_recipe_id) as nombre_sous_recettes,
    STRING_AGG(s.name, ', ') as sous_recettes
FROM recipes r
JOIN recipe_ingredients ri ON ri.recipe_id = r.id
JOIN recipes s ON s.id = ri.sub_recipe_id
WHERE ri.sub_recipe_id IS NOT NULL
GROUP BY r.id, r.name, r.role
HAVING COUNT(ri.sub_recipe_id) > 0
ORDER BY COUNT(ri.sub_recipe_id) DESC, r.name
LIMIT 20;
