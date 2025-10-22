-- ========================================================================
-- NETTOYAGE DES DOUBLONS AVANT AJOUT DE LA CONTRAINTE UNIQUE
-- ========================================================================

BEGIN;

-- ===== ANALYSE DES DOUBLONS =====
-- 10 recettes en double détectées (IDs 13-22 sont des duplicatas des IDs 2-11)

-- ===== STRATÉGIE =====
-- On garde le premier ID (le plus ancien) et on supprime le second
-- Par exemple : Granola maison {7, 18} → on garde 7, on supprime 18

-- ===== VÉRIFICATION DES DÉPENDANCES =====
-- Avant de supprimer, vérifions si ces recettes ont des données liées

-- 1. Associations avec les tags
SELECT 
    'Tags associés aux doublons' as type,
    r.id,
    r.name,
    COUNT(rt.tag_id) as nombre_tags
FROM recipes r
LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
WHERE r.id IN (13, 14, 15, 16, 17, 18, 19, 20, 21, 22)
GROUP BY r.id, r.name
ORDER BY r.id;

-- 2. Ingrédients liés
SELECT 
    'Ingrédients liés aux doublons' as type,
    r.id,
    r.name,
    COUNT(ri.id) as nombre_ingredients
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
WHERE r.id IN (13, 14, 15, 16, 17, 18, 19, 20, 21, 22)
GROUP BY r.id, r.name
ORDER BY r.id;

-- 3. Instructions liées
SELECT 
    'Instructions liées aux doublons' as type,
    r.id,
    r.name,
    COUNT(i.id) as nombre_instructions
FROM recipes r
LEFT JOIN instructions i ON r.id = i.recipe_id
WHERE r.id IN (13, 14, 15, 16, 17, 18, 19, 20, 21, 22)
GROUP BY r.id, r.name
ORDER BY r.id;

-- ===== MIGRATION DES DONNÉES =====
-- Si les doublons (IDs 13-22) ont des données, on les migre vers les originaux (IDs 2-11)

-- Migrer les tags de 13 → 2 (Overnight porridge)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT 2, tag_id FROM recipe_tags WHERE recipe_id = 13
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Migrer les tags de 14 → 3 (Porridge salé)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT 3, tag_id FROM recipe_tags WHERE recipe_id = 14
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Migrer les tags de 15 → 4 (Smoothie bowl tropical)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT 4, tag_id FROM recipe_tags WHERE recipe_id = 15
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Migrer les tags de 16 → 5 (Smoothie bowl vert)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT 5, tag_id FROM recipe_tags WHERE recipe_id = 16
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Migrer les tags de 17 → 6 (Pudding de chia)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT 6, tag_id FROM recipe_tags WHERE recipe_id = 17
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Migrer les tags de 18 → 7 (Granola maison)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT 7, tag_id FROM recipe_tags WHERE recipe_id = 18
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Migrer les tags de 19 → 8 (Muesli Bircher)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT 8, tag_id FROM recipe_tags WHERE recipe_id = 19
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Migrer les tags de 20 → 9 (Pancakes américains)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT 9, tag_id FROM recipe_tags WHERE recipe_id = 20
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Migrer les tags de 21 → 10 (Pancakes à la banane)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT 10, tag_id FROM recipe_tags WHERE recipe_id = 21
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Migrer les tags de 22 → 11 (Pancakes salés)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT 11, tag_id FROM recipe_tags WHERE recipe_id = 22
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- ===== SUPPRESSION DES DOUBLONS =====
-- Supprimer d'abord les associations dans recipe_tags (clé étrangère)
DELETE FROM recipe_tags WHERE recipe_id IN (13, 14, 15, 16, 17, 18, 19, 20, 21, 22);

-- Supprimer les ingrédients liés (si présents)
DELETE FROM recipe_ingredients WHERE recipe_id IN (13, 14, 15, 16, 17, 18, 19, 20, 21, 22);

-- Supprimer les instructions liées (si présentes)
DELETE FROM instructions WHERE recipe_id IN (13, 14, 15, 16, 17, 18, 19, 20, 21, 22);

-- Enfin, supprimer les recettes doublons
DELETE FROM recipes WHERE id IN (13, 14, 15, 16, 17, 18, 19, 20, 21, 22);

-- ===== VÉRIFICATION =====
-- Confirmer qu'il n'y a plus de doublons
SELECT 
    'Vérification finale' as etape,
    name,
    COUNT(*) as nombre
FROM recipes
GROUP BY name
HAVING COUNT(*) > 1;

-- Afficher le résultat
SELECT 
    '✅ Doublons supprimés avec succès !' as message,
    COUNT(DISTINCT name) as recettes_uniques,
    COUNT(*) as total_recettes
FROM recipes;

COMMIT;

-- ========================================================================
-- PROCHAINE ÉTAPE : Maintenant tu peux exécuter add_unique_constraint.sql
-- ========================================================================
