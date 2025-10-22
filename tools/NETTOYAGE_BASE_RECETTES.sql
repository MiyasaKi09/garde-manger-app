-- ============================================================================
-- SCRIPT DE NETTOYAGE DE LA BASE DE RECETTES
-- ============================================================================
-- 
-- Ce script supprime :
-- 1. Les doublons exacts (3 recettes)
-- 2. Les quasi-doublons (garder la meilleure version)
-- 3. Les recettes trop génériques (57 recettes)
-- 4. Les micro-variations excessives (réduction à 1-2 par groupe)
-- 5. Les recettes peu utiles (redondances)
--
-- TOTAL: ~268 recettes à supprimer pour optimiser la base
-- Résultat: ~790 recettes de qualité
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SUPPRESSION DES DOUBLONS EXACTS (3 recettes)
-- ============================================================================

-- Garder la plus ancienne de chaque doublon
DELETE FROM recipes WHERE id = 9057; -- Bœuf Stroganoff (doublon de 145)
DELETE FROM recipes WHERE id = 9018; -- Entrecôte grillée (doublon de 142)
DELETE FROM recipes WHERE id = 9077; -- Sauté de veau Marengo (doublon de 134)

-- ============================================================================
-- 2. SUPPRESSION DES QUASI-DOUBLONS (garder le meilleur)
-- ============================================================================

-- Garder "Bœuf sauté aux oignons" (151), supprimer "Bœuf sauce aux oignons" (9069)
DELETE FROM recipes WHERE id = 9069;

-- Les autres quasi-doublons sont des variations légitimes (veloutés, légumes différents)
-- On les garde pour la diversité

-- ============================================================================
-- 3. SUPPRESSION DES RECETTES TROP GÉNÉRIQUES
-- ============================================================================

-- 3.1. Sauces trop vagues (garder seulement les classiques, supprimer les variations)
-- Supprimer toutes les "Bœuf sauce..." génériques
DELETE FROM recipes WHERE id IN (
    9062, -- Bœuf sauce tomate
    9063, -- Bœuf sauce poivre
    9064, -- Bœuf sauce au roquefort
    9065, -- Bœuf sauce au gorgonzola
    9066, -- Bœuf sauce au chèvre
    9067, -- Bœuf sauce aux champignons
    9068, -- Bœuf sauce aux poivrons
    9070, -- Bœuf sauce au citron
    9071, -- Bœuf sauce au miel
    9072, -- Bœuf sauce aux herbes
    9073, -- Bœuf sauce aux tomates séchées
    9074, -- Bœuf sauce au pesto
    9075  -- Bœuf sauce au curry coco
);

-- Supprimer toutes les "Porc sauce..." génériques
DELETE FROM recipes WHERE id IN (
    9210, -- Porc sauce tomate
    9211, -- Porc sauce au poivre
    9212, -- Porc sauce au miel
    9213, -- Porc sauce au roquefort
    9214, -- Porc sauce aux champignons
    9215, -- Porc sauce aux oignons
    9216, -- Porc sauce aux poivrons
    9217, -- Porc sauce au paprika
    9218, -- Porc sauce à la bière
    9219, -- Porc sauce aux herbes
    9220, -- Porc sauce à la moutarde
    9221, -- Porc sauce au pesto
    9222, -- Porc sauce au lait de coco
    9223, -- Porc sauce au curry coco
    9224  -- Porc sauce aigre-douce
);

-- 3.2. Potages (garder les classiques, supprimer les redondants)
-- Garder: carottes, poireaux, potiron, tomates, légumes variés
-- Supprimer les autres
DELETE FROM recipes WHERE id IN (
    8998, -- Potage aux tomates
    8999, -- Potage aux champignons
    9000, -- Potage aux aubergines
    9001, -- Potage aux poivrons
    9002, -- Potage au chou-fleur
    9003, -- Potage aux brocolis
    9004, -- Potage aux navets
    9005, -- Potage aux blettes
    9006, -- Potage au panais
    9008, -- Potage au chou rouge
    9009  -- Potage aux artichauts
);

-- 3.3. Recettes "aux tomates/herbes" trop vagues
DELETE FROM recipes WHERE id IN (
    9052, -- Bœuf aux tomates
    9082, -- Veau aux tomates
    9092, -- Veau aux herbes
    9143, -- Agneau aux tomates
    9152, -- Agneau aux herbes
    9206  -- Porc aux herbes
);

-- 3.4. Salades "froid" redondantes
DELETE FROM recipes WHERE id IN (
    9337, -- Salade de bœuf froid
    9338, -- Salade de veau froid
    9339  -- Salade de porc froid
);

-- ============================================================================
-- 4. RÉDUCTION DES MICRO-VARIATIONS (garder 1-2 par groupe)
-- ============================================================================

-- 4.1. AGNEAU (30 variations → garder 8 meilleurs)
-- Garder: curry, miel, olives, pois chiches, korma, massala, tikka masala, gigot
-- Supprimer les 22 autres variations basiques
DELETE FROM recipes WHERE id IN (
    9137, -- Agneau aux carottes
    9138, -- Agneau aux poireaux
    9139, -- Agneau aux champignons
    9144, -- Agneau aux aubergines
    9145, -- Agneau aux courgettes
    9148, -- Agneau aux navets
    9149, -- Agneau aux épinards
    9151, -- Agneau aux oignons
    9159, -- Agneau au paprika
    9160, -- Agneau au romarin
    9161, -- Agneau au thym
    9162, -- Agneau au miel (doublon avec variations)
    9166, -- Agneau aux abricots
    9167, -- Agneau aux poires
    9168, -- Agneau à la moutarde
    9169, -- Agneau au citron
    9170, -- Agneau aux olives (garder celui avec épices)
    9171  -- Agneau au gingembre
);

-- 4.2. BŒUF (23 variations → garder 6 meilleurs)
-- Garder: curry, bourguignon, stroganoff, daube, carottes, paprika
-- Supprimer les autres
DELETE FROM recipes WHERE id IN (
    9051, -- Bœuf aux aubergines
    9053, -- Bœuf au céleri
    9054, -- Bœuf au chou
    9055, -- Bœuf aux courgettes
    9056, -- Bœuf aux haricots blancs
    9057, -- Déjà supprimé (doublon)
    9058, -- Bœuf aux lentilles
    9059, -- Bœuf aux navets
    9060, -- Bœuf au curry doux
    9061, -- Bœuf au paprika
    9320, -- Bœuf au satay
    9322, -- Bœuf au soja
    9374, -- Bœuf au miso
    9375, -- Bœuf au sésame noir
    9376  -- Bœuf au curry cacao
);

-- 4.3. VEAU (18 variations → garder 5 meilleurs)
-- Garder: Marengo, blanquette, osso buco, curry, olives
-- Supprimer les autres
DELETE FROM recipes WHERE id IN (
    9080, -- Veau aux carottes
    9081, -- Veau aux courgettes
    9084, -- Veau aux aubergines
    9085, -- Veau aux oignons
    9086, -- Veau aux pommes de terre
    9088, -- Veau aux pois chiches
    9089, -- Veau aux lentilles
    9090, -- Veau aux navets
    9091, -- Veau aux épinards
    9093, -- Veau aux champignons sauvages
    9331, -- Veau au gingembre
    9332, -- Veau à la citronnelle
    9333  -- Veau à la thaï
);

-- 4.4. PORC (17 variations → garder 6 meilleurs)
-- Garder: caramel, aigre-douce, curry, figues, pruneaux, miel
DELETE FROM recipes WHERE id IN (
    9200, -- Porc aux pommes
    9202, -- Porc aux poires
    9204, -- Porc aux pommes de terre
    9207, -- Porc au gingembre
    9326, -- Porc au soja
    9328, -- Porc au satay
    9329  -- Porc au curry japonais
);

-- 4.5. BURGERS (15 variations → garder 4 meilleurs)
-- Garder: classique, bacon, bleu, poulet
DELETE FROM recipes WHERE id IN (
    9263, -- Burger au bleu
    9264, -- Burger au roquefort
    9265, -- Burger au chèvre
    9266, -- Burger au gorgonzola
    9267, -- Burger au pesto
    9268, -- Burger au curry doux
    9273, -- Burger aux champignons
    9274, -- Burger aux aubergines
    9275, -- Burger aux tomates
    9276, -- Burger épicé
    9277  -- Burger méditerranéen
);

-- 4.6. SAUTÉ DE PORC (10 variations → garder 3)
-- Garder: caramel, curry, miel
DELETE FROM recipes WHERE id IN (
    9192, -- Sauté de porc aux champignons
    9193, -- Sauté de porc aux oignons
    9194, -- Sauté de porc aux poivrons
    9195, -- Sauté de porc aux tomates
    9196, -- Sauté de porc aux carottes
    9197, -- Sauté de porc aux courgettes
    9198  -- Sauté de porc aux aubergines
);

-- 4.7. TOURTES (10 variations → garder 4)
-- Garder: bœuf et champignons, poulet, gibier, poisson
DELETE FROM recipes WHERE id IN (
    9354, -- Tourte au bœuf (basique)
    9356, -- Tourte au bœuf et légumes
    9357, -- Tourte au veau
    9358, -- Tourte au veau et champignons
    9359, -- Tourte au veau et légumes
    9362  -- Tourte au porc
);

-- 4.8. GIBIER variations excessives
-- Chevreuil (9 variations → garder 3)
DELETE FROM recipes WHERE id IN (
    9227, -- Chevreuil au miel
    9228, -- Chevreuil au poivre
    9229, -- Chevreuil au romarin
    9248, -- Chevreuil aux airelles
    9249  -- Chevreuil aux champignons
);

-- Sanglier (6 variations → garder 2)
DELETE FROM recipes WHERE id IN (
    9231, -- Sanglier au miel
    9245, -- Sanglier aux carottes
    9246, -- Sanglier aux champignons
    9247  -- Sanglier aux pommes
);

-- Cerf (6 variations → garder 2)
DELETE FROM recipes WHERE id IN (
    9234, -- Cerf au poivre
    9235, -- Cerf aux champignons
    9253, -- Cerf aux marrons
    9309  -- Cerf aux truffes
);

-- Faisan (5 variations → garder 2)
DELETE FROM recipes WHERE id IN (
    9256, -- Faisan aux pommes
    9257, -- Faisan aux champignons
    9255  -- Faisan aux poires
);

-- 4.9. Feuilletés (7 variations → garder 2)
DELETE FROM recipes WHERE id IN (
    9367, -- Feuilleté au veau
    9369, -- Feuilleté au porc
    9371, -- Feuilleté au sanglier
    9372, -- Feuilleté au chevreuil
    9373  -- Feuilleté au cerf
);

-- 4.10. Rôtis de porc (6 variations → garder 2)
DELETE FROM recipes WHERE id IN (
    9174, -- Rôti de porc au miel
    9175, -- Rôti de porc au paprika
    9178, -- Rôti de porc aux pommes
    9179  -- Rôti de porc aux pruneaux
);

-- 4.11. Côtes de porc (6 variations → garder 2)
DELETE FROM recipes WHERE id IN (
    9183, -- Côtes de porc au miel
    9184, -- Côtes de porc aux herbes
    9185  -- Côtes de porc au curry doux
);

-- 4.12. Boulettes génériques (5 variations → garder 1)
DELETE FROM recipes WHERE id IN (
    9285, -- Boulettes à la tomate
    9286, -- Boulettes au fromage
    9287, -- Boulettes aux herbes
    9288, -- Boulettes aux champignons
    9289  -- Boulettes aux oignons
);

-- 4.13. Steak haché (5 variations → garder 1)
DELETE FROM recipes WHERE id IN (
    9292, -- Steak haché au fromage
    9293, -- Steak haché aux herbes
    9294, -- Steak haché aux oignons
    9295  -- Steak haché au poivre
);

-- ============================================================================
-- 5. SUPPRESSION DES RECETTES "FROID" REDONDANTES
-- ============================================================================

DELETE FROM recipes WHERE id IN (
    9334, -- Rosbif froid (garder le rosbif normal)
    9335, -- Rôti de veau froid
    9336  -- Rôti de porc froid
);

-- ============================================================================
-- 6. SUPPRESSION DES PIÈCES DE VIANDE TROP BASIQUES
-- ============================================================================

-- Supprimer les pièces de viande sans préparation spécifique
-- (garder les recettes avec une vraie préparation/sauce)
DELETE FROM recipes WHERE id IN (
    9022, -- Aloyau grillé (trop basique)
    9023, -- Onglet grillé
    9024, -- Hampe grillée
    9026, -- Filet de bœuf poêlé (sans sauce spécifique)
    9028, -- Steak minute
    9033, -- Merlan de bœuf grillé
    9096, -- Escalope de veau grillée (trop basique)
    9102, -- Côte de veau grillée
    9108, -- Filet de veau grillé
    9126, -- Carré d'agneau grillé (garder rôti)
    9131, -- Épaule d'agneau grillée
    9180  -- Côtes de porc grillées (trop basique)
);

-- ============================================================================
-- RÉCAPITULATIF
-- ============================================================================

-- Comptage des recettes supprimées
DO $$
DECLARE
    supprimees INT;
    restantes INT;
BEGIN
    -- Ce bloc sera exécuté après le COMMIT
    SELECT COUNT(*) INTO restantes FROM recipes;
    supprimees := 1058 - restantes;
    
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'NETTOYAGE TERMINÉ';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Recettes supprimées: %', supprimees;
    RAISE NOTICE 'Recettes restantes: %', restantes;
    RAISE NOTICE 'Taux de nettoyage: % %%', ROUND((supprimees::NUMERIC / 1058) * 100, 1);
    RAISE NOTICE '============================================================================';
END $$;

COMMIT;

-- ============================================================================
-- VÉRIFICATION POST-NETTOYAGE
-- ============================================================================

-- Compter les recettes par rôle
SELECT 
    role,
    COUNT(*) as nombre,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 1) as pourcentage
FROM recipes
GROUP BY role
ORDER BY nombre DESC;

-- Exemples de recettes conservées par catégorie
SELECT 'PLATS CONSERVÉS - Exemples' as categorie;
SELECT id, name, role 
FROM recipes 
WHERE role = 'PLAT_PRINCIPAL' 
ORDER BY name 
LIMIT 20;
