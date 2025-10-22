-- ========================================================================
-- ÉTAPE 2 : IMPORTER LES SAUCES ET CONFIGURER LA STRUCTURE
-- ========================================================================
-- IMPORTANT: Exécutez ce script APRÈS avoir exécuté step1.sql
-- et APRÈS avoir fermé/rouvert la connexion PostgreSQL

BEGIN;

-- ========================================================================
-- 1. AJOUTER LA COLONNE is_complete_meal
-- ========================================================================

-- Ajouter la colonne pour distinguer plats complets des plats simples
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS is_complete_meal BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN recipes.is_complete_meal IS 
'TRUE = plat complet (ne nécessite pas d''accompagnement), FALSE = plat principal simple qui nécessite un accompagnement';

-- ========================================================================
-- 2. AJOUTER LA COLONNE needs_side_dish
-- ========================================================================

-- Pour être plus explicite
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS needs_side_dish BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN recipes.needs_side_dish IS
'TRUE = nécessite un accompagnement, FALSE = ne nécessite pas d''accompagnement, NULL = non défini';

-- ========================================================================
-- 3. IMPORTER LES SAUCES CLASSIQUES FRANÇAISES
-- ========================================================================

-- Sauce béchamel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce béchamel', 'SAUCE', 'Sauce blanche onctueuse à base de beurre, farine et lait. Base de nombreuses recettes comme les lasagnes, gratins et croque-monsieur.', 5, 10, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauce hollandaise
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce hollandaise', 'SAUCE', 'Sauce émulsionnée riche à base de jaunes d''œufs et beurre clarifié. Parfaite pour les asperges et œufs bénédictine.', 10, 10, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauce béarnaise
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce béarnaise', 'SAUCE', 'Sauce émulsionnée à l''estragon, variante de la hollandaise. Accompagnement idéal pour les viandes grillées.', 10, 15, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauce au poivre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce au poivre', 'SAUCE', 'Sauce crémeuse au poivre concassé et cognac. Classique pour accompagner les steaks et entrecôtes.', 5, 10, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauce moutarde
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce moutarde', 'SAUCE', 'Sauce crémeuse à la moutarde de Dijon. Parfaite pour les viandes blanches et le lapin.', 5, 10, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauce au beurre blanc
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce au beurre blanc', 'SAUCE', 'Sauce émulsionnée au vin blanc et échalotes. Accompagnement raffiné pour les poissons.', 10, 15, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauce tomate nature
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce tomate nature', 'SAUCE', 'Sauce tomate simple aux oignons et herbes aromatiques. Base polyvalente pour pâtes, pizzas et plats mijotés.', 10, 30, 6)
ON CONFLICT (name) DO NOTHING;

-- Sauce tomate au basilic
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce tomate au basilic', 'SAUCE', 'Sauce tomate parfumée au basilic frais. Idéale pour les pâtes et lasagnes.', 10, 25, 6)
ON CONFLICT (name) DO NOTHING;

-- Sauce bolognaise
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce bolognaise', 'SAUCE', 'Sauce tomate à la viande hachée mijotée longuement. Base traditionnelle des spaghetti bolognaise et lasagnes.', 15, 90, 6)
ON CONFLICT (name) DO NOTHING;

-- Mayonnaise
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Mayonnaise', 'SAUCE', 'Sauce froide émulsionnée à base de jaunes d''œufs et huile. Base de nombreuses sauces froides et accompagnement polyvalent.', 10, 0, 4)
ON CONFLICT (name) DO NOTHING;

-- Aïoli
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Aïoli', 'SAUCE', 'Mayonnaise provençale à l''ail. Accompagnement traditionnel de la bouillabaisse et légumes crus.', 10, 0, 4)
ON CONFLICT (name) DO NOTHING;

-- Pesto
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pesto', 'SAUCE', 'Sauce italienne au basilic, pignons, parmesan et huile d''olive. Parfaite pour les pâtes et bruschetta.', 10, 0, 4)
ON CONFLICT (name) DO NOTHING;

-- Tapenade
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tapenade', 'SAUCE', 'Pâte d''olives noires provençale aux câpres et anchois. Délicieuse en apéritif sur du pain grillé.', 10, 0, 6)
ON CONFLICT (name) DO NOTHING;

-- Guacamole
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Guacamole', 'SAUCE', 'Sauce mexicaine crémeuse à base d''avocats écrasés, citron vert et coriandre. Accompagnement des tacos et nachos.', 10, 0, 4)
ON CONFLICT (name) DO NOTHING;

-- Tzatziki
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tzatziki', 'SAUCE', 'Sauce grecque au yaourt, concombre et menthe. Rafraîchissante avec les grillades et mezze.', 15, 0, 4)
ON CONFLICT (name) DO NOTHING;

-- Salsa
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Salsa', 'SAUCE', 'Sauce mexicaine fraîche aux tomates, oignons, piment et coriandre. Accompagnement des tacos et fajitas.', 15, 0, 4)
ON CONFLICT (name) DO NOTHING;

-- Vinaigrette classique
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Vinaigrette classique', 'SAUCE', 'Assaisonnement simple à base d''huile, vinaigre et moutarde. Pour toutes les salades vertes.', 5, 0, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauce soja sucrée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce soja sucrée', 'SAUCE', 'Sauce asiatique à base de sauce soja, miel et gingembre. Parfaite pour les woks et marinades.', 5, 5, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauce curry
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce curry', 'SAUCE', 'Sauce crémeuse aux épices curry et lait de coco. Base des plats indiens et thaïlandais.', 10, 20, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauce barbecue
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauce barbecue', 'SAUCE', 'Sauce sucrée-salée à base de tomate, vinaigre et épices. Idéale pour les grillades et burgers.', 10, 30, 6)
ON CONFLICT (name) DO NOTHING;

-- ========================================================================
-- 4. AJOUTER DES RECETTES DE BASES (BOUILLONS, FONDS)
-- ========================================================================

-- Bouillon de légumes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bouillon de légumes', 'SAUCE', 'Bouillon aromatique à base de légumes mijotés. Base de nombreuses soupes et sauces.', 15, 60, 8)
ON CONFLICT (name) DO NOTHING;

-- Bouillon de volaille
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bouillon de volaille', 'SAUCE', 'Bouillon riche préparé avec une carcasse de poulet. Base des soupes et risottos.', 15, 120, 8)
ON CONFLICT (name) DO NOTHING;

-- Fond de veau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Fond de veau', 'SAUCE', 'Fond brun concentré à base d''os de veau rôtis. Base noble des grandes sauces françaises.', 30, 240, 10)
ON CONFLICT (name) DO NOTHING;

-- Fumet de poisson
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Fumet de poisson', 'SAUCE', 'Bouillon délicat à base d''arêtes de poisson. Base des sauces pour fruits de mer.', 15, 30, 6)
ON CONFLICT (name) DO NOTHING;

-- ========================================================================
-- 5. CATÉGORISER LES PLATS COMPLETS EXISTANTS
-- ========================================================================

-- Les plats qui sont déjà complets (ne nécessitent pas d'accompagnement)
UPDATE recipes
SET 
    is_complete_meal = TRUE,
    needs_side_dish = FALSE
WHERE name ~* '(paella|couscous|pot-au-feu|blanquette|cassoulet|choucroute|tajine|curry|risotto|pasta|spaghetti|lasagne|gratin complet|pizza|burger|sandwich|wrap|bowl|poke|salade composée|quiche|tarte salée complète)'
AND role = 'PLAT_PRINCIPAL';

-- Les plats qui nécessitent un accompagnement
UPDATE recipes
SET 
    is_complete_meal = FALSE,
    needs_side_dish = TRUE
WHERE name ~* '(steak|côtelette|entrecôte|pavé|filet|rôti(?! complet)|poulet grillé|poisson grillé|escalope)'
AND role = 'PLAT_PRINCIPAL'
AND is_complete_meal IS NULL;

COMMIT;

-- ========================================================================
-- VÉRIFICATION FINALE
-- ========================================================================

SELECT 
    '=== STRUCTURE AMÉLIORÉE ===' as info;

-- Compter par rôle
SELECT 
    role,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_complete_meal = TRUE) as plats_complets,
    COUNT(*) FILTER (WHERE needs_side_dish = TRUE) as besoin_accompagnement,
    COUNT(*) FILTER (WHERE is_complete_meal IS NULL) as non_categorises
FROM recipes
GROUP BY role
ORDER BY 
    CASE role
        WHEN 'PLAT_PRINCIPAL' THEN 1
        WHEN 'ENTREE' THEN 2
        WHEN 'ACCOMPAGNEMENT' THEN 3
        WHEN 'DESSERT' THEN 4
        WHEN 'SAUCE' THEN 5
    END;

-- Exemples de sauces
SELECT 
    '=== EXEMPLES DE SAUCES ===' as info;

SELECT name, description
FROM recipes
WHERE role = 'SAUCE'
ORDER BY name
LIMIT 10;

-- Exemples de plats complets
SELECT 
    '=== EXEMPLES DE PLATS COMPLETS ===' as info;

SELECT name
FROM recipes
WHERE is_complete_meal = TRUE
ORDER BY name
LIMIT 10;

-- Exemples de plats nécessitant accompagnement
SELECT 
    '=== EXEMPLES DE PLATS NÉCESSITANT ACCOMPAGNEMENT ===' as info;

SELECT name
FROM recipes
WHERE needs_side_dish = TRUE
ORDER BY name
LIMIT 10;
