-- ========================================================================
-- BATCH 2 : Ajout de 50 recettes (ENTREE)
-- ========================================================================

BEGIN;

-- 1. Salade de pois gourmands
INSERT INTO recipes (name, role, description)
VALUES ('Salade de pois gourmands', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Salade de lentilles aux œufs durs
INSERT INTO recipes (name, role, description)
VALUES ('Salade de lentilles aux œufs durs', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Salade de pois chiches à la coriandre
INSERT INTO recipes (name, role, description)
VALUES ('Salade de pois chiches à la coriandre', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Salade de haricots verts et rouges
INSERT INTO recipes (name, role, description)
VALUES ('Salade de haricots verts et rouges', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Salade de lupins
INSERT INTO recipes (name, role, description)
VALUES ('Salade de lupins', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Salade de lentilles à la feta
INSERT INTO recipes (name, role, description)
VALUES ('Salade de lentilles à la feta', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Salade de pois chiches et tomates séchées
INSERT INTO recipes (name, role, description)
VALUES ('Salade de pois chiches et tomates séchées', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Salade de haricots noirs façon tex-mex
INSERT INTO recipes (name, role, description)
VALUES ('Salade de haricots noirs façon tex-mex', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Salade de pois cassés aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Salade de pois cassés aux herbes', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Salade de lentilles au saumon fumé
INSERT INTO recipes (name, role, description)
VALUES ('Salade de lentilles au saumon fumé', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Soupe à l’oignon gratinée
INSERT INTO recipes (name, role, description)
VALUES ('Soupe à l’oignon gratinée', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Soupe poireaux-pommes de terre
INSERT INTO recipes (name, role, description)
VALUES ('Soupe poireaux-pommes de terre', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Soupe de légumes anciens
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de légumes anciens', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Soupe de chou
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de chou', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Soupe de carottes
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de carottes', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Soupe de potiron
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de potiron', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Soupe de cresson
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de cresson', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Soupe de poireaux
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de poireaux', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Soupe de céleri
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de céleri', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Soupe de navets
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de navets', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Soupe paysanne
INSERT INTO recipes (name, role, description)
VALUES ('Soupe paysanne', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Soupe de tomates
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de tomates', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Soupe de champignons
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de champignons', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Soupe de courgettes
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de courgettes', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Soupe de brocoli
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de brocoli', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Soupe de petits pois
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de petits pois', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Soupe de potimarron
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de potimarron', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Soupe de panais
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de panais', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Soupe d’orties
INSERT INTO recipes (name, role, description)
VALUES ('Soupe d’orties', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Soupe de topinambours
INSERT INTO recipes (name, role, description)
VALUES ('Soupe de topinambours', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Velouté de potiron
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de potiron', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Velouté de carottes
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de carottes', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Velouté de champignons
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de champignons', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Velouté de brocoli
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de brocoli', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Velouté de panais
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de panais', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Velouté de céleri
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de céleri', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Velouté de chou-fleur
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de chou-fleur', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Velouté de courgettes
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de courgettes', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Velouté de petits pois
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de petits pois', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Velouté d’asperges
INSERT INTO recipes (name, role, description)
VALUES ('Velouté d’asperges', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Velouté de patates douces
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de patates douces', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Velouté de butternut
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de butternut', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Velouté de tomates
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de tomates', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Velouté de chou kale
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de chou kale', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Velouté de cresson
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de cresson', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Velouté de fenouil
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de fenouil', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Velouté de navets
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de navets', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Velouté de pois cassés
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de pois cassés', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Velouté de potimarron
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de potimarron', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Velouté de champignons et truffe
INSERT INTO recipes (name, role, description)
VALUES ('Velouté de champignons et truffe', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 2 terminé' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'ENTREE') as recettes_entree
FROM recipes;
-- ========================================================================
-- BATCH 3 : Ajout de 50 recettes (ENTREE)
-- ========================================================================

BEGIN;

-- 1. Minestrone italien
INSERT INTO recipes (name, role, description)
VALUES ('Minestrone italien', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Gaspacho andalou
INSERT INTO recipes (name, role, description)
VALUES ('Gaspacho andalou', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Chorba algérienne
INSERT INTO recipes (name, role, description)
VALUES ('Chorba algérienne', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Soupe miso
INSERT INTO recipes (name, role, description)
VALUES ('Soupe miso', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Soupe pho simplifiée
INSERT INTO recipes (name, role, description)
VALUES ('Soupe pho simplifiée', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Soupe tom kha thaï
INSERT INTO recipes (name, role, description)
VALUES ('Soupe tom kha thaï', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Soupe ramen maison
INSERT INTO recipes (name, role, description)
VALUES ('Soupe ramen maison', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Soupe dhal indien
INSERT INTO recipes (name, role, description)
VALUES ('Soupe dhal indien', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Soupe mexicaine au maïs
INSERT INTO recipes (name, role, description)
VALUES ('Soupe mexicaine au maïs', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Soupe russe bortsch
INSERT INTO recipes (name, role, description)
VALUES ('Soupe russe bortsch', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Soupe polonaise zurek
INSERT INTO recipes (name, role, description)
VALUES ('Soupe polonaise zurek', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Soupe grecque avgolemono
INSERT INTO recipes (name, role, description)
VALUES ('Soupe grecque avgolemono', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Soupe turque aux lentilles
INSERT INTO recipes (name, role, description)
VALUES ('Soupe turque aux lentilles', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Soupe harira marocaine
INSERT INTO recipes (name, role, description)
VALUES ('Soupe harira marocaine', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Soupe vietnamienne de crevettes
INSERT INTO recipes (name, role, description)
VALUES ('Soupe vietnamienne de crevettes', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Soupe chinoise aux champignons noirs
INSERT INTO recipes (name, role, description)
VALUES ('Soupe chinoise aux champignons noirs', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Soupe coréenne kimchi jjigae
INSERT INTO recipes (name, role, description)
VALUES ('Soupe coréenne kimchi jjigae', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Soupe égyptienne aux lentilles
INSERT INTO recipes (name, role, description)
VALUES ('Soupe égyptienne aux lentilles', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Soupe israélienne aux pois chiches
INSERT INTO recipes (name, role, description)
VALUES ('Soupe israélienne aux pois chiches', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Soupe brésilienne de poisson
INSERT INTO recipes (name, role, description)
VALUES ('Soupe brésilienne de poisson', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Tarte aux poireaux
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux poireaux', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Tarte aux courgettes
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux courgettes', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Tarte aux tomates
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux tomates', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Tarte aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux champignons', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Tarte à l’oignon
INSERT INTO recipes (name, role, description)
VALUES ('Tarte à l’oignon', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Tarte épinards-ricotta
INSERT INTO recipes (name, role, description)
VALUES ('Tarte épinards-ricotta', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Tarte au saumon
INSERT INTO recipes (name, role, description)
VALUES ('Tarte au saumon', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Tarte aux asperges
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux asperges', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Tarte au chèvre et courgettes
INSERT INTO recipes (name, role, description)
VALUES ('Tarte au chèvre et courgettes', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Tarte provençale
INSERT INTO recipes (name, role, description)
VALUES ('Tarte provençale', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Tarte ratatouille
INSERT INTO recipes (name, role, description)
VALUES ('Tarte ratatouille', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Tarte aux carottes
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux carottes', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Tarte aux brocolis
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux brocolis', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Tarte aux endives
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux endives', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Tarte au chou-fleur
INSERT INTO recipes (name, role, description)
VALUES ('Tarte au chou-fleur', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Tarte à la patate douce
INSERT INTO recipes (name, role, description)
VALUES ('Tarte à la patate douce', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Tarte poireaux-saumon
INSERT INTO recipes (name, role, description)
VALUES ('Tarte poireaux-saumon', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Tarte à la feta et tomates
INSERT INTO recipes (name, role, description)
VALUES ('Tarte à la feta et tomates', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Tarte aux aubergines
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux aubergines', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Tarte aux herbes fraîches
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux herbes fraîches', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Quiche lorraine
INSERT INTO recipes (name, role, description)
VALUES ('Quiche lorraine', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Quiche saumon-épinards
INSERT INTO recipes (name, role, description)
VALUES ('Quiche saumon-épinards', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Quiche aux poireaux
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux poireaux', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Quiche aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux champignons', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Quiche au jambon
INSERT INTO recipes (name, role, description)
VALUES ('Quiche au jambon', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Quiche au thon
INSERT INTO recipes (name, role, description)
VALUES ('Quiche au thon', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Quiche tomates-mozzarella
INSERT INTO recipes (name, role, description)
VALUES ('Quiche tomates-mozzarella', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Quiche aux courgettes
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux courgettes', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Quiche au brocoli
INSERT INTO recipes (name, role, description)
VALUES ('Quiche au brocoli', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Quiche à la feta et épinards
INSERT INTO recipes (name, role, description)
VALUES ('Quiche à la feta et épinards', 'ENTREE', 'Entrée classique - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 3 terminé' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'ENTREE') as recettes_entree
FROM recipes;
-- ========================================================================
-- BATCH 4 : Ajout de 50 recettes (PLAT)
-- ========================================================================

BEGIN;

-- 1. Bœuf bourguignon
INSERT INTO recipes (name, role, description)
VALUES ('Bœuf bourguignon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Daube provençale
INSERT INTO recipes (name, role, description)
VALUES ('Daube provençale', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Pot-au-feu
INSERT INTO recipes (name, role, description)
VALUES ('Pot-au-feu', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Steak tartare
INSERT INTO recipes (name, role, description)
VALUES ('Steak tartare', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Steak au poivre
INSERT INTO recipes (name, role, description)
VALUES ('Steak au poivre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Entrecôte grillée
INSERT INTO recipes (name, role, description)
VALUES ('Entrecôte grillée', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Côte de bœuf au four
INSERT INTO recipes (name, role, description)
VALUES ('Côte de bœuf au four', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Bavette à l’échalote
INSERT INTO recipes (name, role, description)
VALUES ('Bavette à l’échalote', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Rôti de bœuf
INSERT INTO recipes (name, role, description)
VALUES ('Rôti de bœuf', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Bœuf carottes
INSERT INTO recipes (name, role, description)
VALUES ('Bœuf carottes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Langue de bœuf sauce piquante
INSERT INTO recipes (name, role, description)
VALUES ('Langue de bœuf sauce piquante', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Joue de bœuf braisée
INSERT INTO recipes (name, role, description)
VALUES ('Joue de bœuf braisée', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Bœuf aux oignons
INSERT INTO recipes (name, role, description)
VALUES ('Bœuf aux oignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Bœuf miroton
INSERT INTO recipes (name, role, description)
VALUES ('Bœuf miroton', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Paleron braisé
INSERT INTO recipes (name, role, description)
VALUES ('Paleron braisé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Brochettes de bœuf
INSERT INTO recipes (name, role, description)
VALUES ('Brochettes de bœuf', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Filet de bœuf Wellington
INSERT INTO recipes (name, role, description)
VALUES ('Filet de bœuf Wellington', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Curry de bœuf à la française
INSERT INTO recipes (name, role, description)
VALUES ('Curry de bœuf à la française', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Ragoût de bœuf aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Ragoût de bœuf aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Hachis parmentier au bœuf
INSERT INTO recipes (name, role, description)
VALUES ('Hachis parmentier au bœuf', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Blanquette de veau
INSERT INTO recipes (name, role, description)
VALUES ('Blanquette de veau', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Osso buco
INSERT INTO recipes (name, role, description)
VALUES ('Osso buco', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Escalope de veau à la crème
INSERT INTO recipes (name, role, description)
VALUES ('Escalope de veau à la crème', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Grenadins de veau
INSERT INTO recipes (name, role, description)
VALUES ('Grenadins de veau', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Rôti de veau au four
INSERT INTO recipes (name, role, description)
VALUES ('Rôti de veau au four', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Sauté de veau marengo
INSERT INTO recipes (name, role, description)
VALUES ('Sauté de veau marengo', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Navarin de veau
INSERT INTO recipes (name, role, description)
VALUES ('Navarin de veau', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Tendrons de veau braisés
INSERT INTO recipes (name, role, description)
VALUES ('Tendrons de veau braisés', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Veau aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Veau aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Escalope milanaise
INSERT INTO recipes (name, role, description)
VALUES ('Escalope milanaise', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Côtes de veau grillées
INSERT INTO recipes (name, role, description)
VALUES ('Côtes de veau grillées', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Veau aux olives
INSERT INTO recipes (name, role, description)
VALUES ('Veau aux olives', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Veau à la provençale
INSERT INTO recipes (name, role, description)
VALUES ('Veau à la provençale', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Veau orloff
INSERT INTO recipes (name, role, description)
VALUES ('Veau orloff', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Jarret de veau confit
INSERT INTO recipes (name, role, description)
VALUES ('Jarret de veau confit', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Veau au curry doux
INSERT INTO recipes (name, role, description)
VALUES ('Veau au curry doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Veau aux carottes
INSERT INTO recipes (name, role, description)
VALUES ('Veau aux carottes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Sauté de veau aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Sauté de veau aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Tête de veau sauce gribiche
INSERT INTO recipes (name, role, description)
VALUES ('Tête de veau sauce gribiche', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Veau en cocotte aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Veau en cocotte aux herbes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Navarin d’agneau
INSERT INTO recipes (name, role, description)
VALUES ('Navarin d’agneau', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Gigot d’agneau rôti
INSERT INTO recipes (name, role, description)
VALUES ('Gigot d’agneau rôti', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Curry d’agneau doux
INSERT INTO recipes (name, role, description)
VALUES ('Curry d’agneau doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Côtes d’agneau grillées
INSERT INTO recipes (name, role, description)
VALUES ('Côtes d’agneau grillées', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Souris d’agneau confite
INSERT INTO recipes (name, role, description)
VALUES ('Souris d’agneau confite', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Agneau à la provençale
INSERT INTO recipes (name, role, description)
VALUES ('Agneau à la provençale', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Tajine d’agneau aux pruneaux
INSERT INTO recipes (name, role, description)
VALUES ('Tajine d’agneau aux pruneaux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Épaule d’agneau au four
INSERT INTO recipes (name, role, description)
VALUES ('Épaule d’agneau au four', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Agneau aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Agneau aux herbes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Agneau à la marocaine
INSERT INTO recipes (name, role, description)
VALUES ('Agneau à la marocaine', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 4 terminé' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'PLAT_PRINCIPAL') as recettes_plat_principal
FROM recipes;
-- ========================================================================
-- BATCH 5 : Ajout de 50 recettes (PLAT)
-- ========================================================================

BEGIN;

-- 1. Spaghetti carbonara
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti carbonara', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Spaghetti bolognaise
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti bolognaise', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Penne all’arrabbiata
INSERT INTO recipes (name, role, description)
VALUES ('Penne all’arrabbiata', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Spaghetti aglio e olio
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti aglio e olio', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Tagliatelles Alfredo
INSERT INTO recipes (name, role, description)
VALUES ('Tagliatelles Alfredo', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Penne au pesto
INSERT INTO recipes (name, role, description)
VALUES ('Penne au pesto', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Rigatoni à la puttanesca
INSERT INTO recipes (name, role, description)
VALUES ('Rigatoni à la puttanesca', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Spaghetti alle vongole
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti alle vongole', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Farfalle aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Farfalle aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Pâtes à la Norma
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes à la Norma', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Fusilli sauce tomate
INSERT INTO recipes (name, role, description)
VALUES ('Fusilli sauce tomate', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Linguine aux palourdes
INSERT INTO recipes (name, role, description)
VALUES ('Linguine aux palourdes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Pâtes au gorgonzola
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes au gorgonzola', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Pâtes au saumon fumé
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes au saumon fumé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Pâtes quatre fromages
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes quatre fromages', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Spaghetti au thon
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti au thon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Pâtes au jambon et petits pois
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes au jambon et petits pois', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Spaghetti primavera
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti primavera', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Pâtes à la sauce arrabbiata
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes à la sauce arrabbiata', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Rigatoni au ragoût
INSERT INTO recipes (name, role, description)
VALUES ('Rigatoni au ragoût', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Orecchiette aux brocolis
INSERT INTO recipes (name, role, description)
VALUES ('Orecchiette aux brocolis', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Pasta alla genovese
INSERT INTO recipes (name, role, description)
VALUES ('Pasta alla genovese', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Pasta alla gricia
INSERT INTO recipes (name, role, description)
VALUES ('Pasta alla gricia', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Pasta alla norma
INSERT INTO recipes (name, role, description)
VALUES ('Pasta alla norma', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Trofie au pesto
INSERT INTO recipes (name, role, description)
VALUES ('Trofie au pesto', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Bigoli in salsa
INSERT INTO recipes (name, role, description)
VALUES ('Bigoli in salsa', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Cavatelli aux tomates cerises
INSERT INTO recipes (name, role, description)
VALUES ('Cavatelli aux tomates cerises', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Paccheri farcis
INSERT INTO recipes (name, role, description)
VALUES ('Paccheri farcis', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Pici all’aglione
INSERT INTO recipes (name, role, description)
VALUES ('Pici all’aglione', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Strozzapreti à la saucisse
INSERT INTO recipes (name, role, description)
VALUES ('Strozzapreti à la saucisse', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Pizzoccheri à la valtellina
INSERT INTO recipes (name, role, description)
VALUES ('Pizzoccheri à la valtellina', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Tagliatelle aux cèpes
INSERT INTO recipes (name, role, description)
VALUES ('Tagliatelle aux cèpes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Mafaldine au ragoût
INSERT INTO recipes (name, role, description)
VALUES ('Mafaldine au ragoût', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Casarecce à la ricotta
INSERT INTO recipes (name, role, description)
VALUES ('Casarecce à la ricotta', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Bucatini all’amatriciana
INSERT INTO recipes (name, role, description)
VALUES ('Bucatini all’amatriciana', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Malloreddus à la sarde
INSERT INTO recipes (name, role, description)
VALUES ('Malloreddus à la sarde', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Garganelli à la crème
INSERT INTO recipes (name, role, description)
VALUES ('Garganelli à la crème', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Culurgiones sardes
INSERT INTO recipes (name, role, description)
VALUES ('Culurgiones sardes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Linguine alle cozze
INSERT INTO recipes (name, role, description)
VALUES ('Linguine alle cozze', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Cavatappi au speck
INSERT INTO recipes (name, role, description)
VALUES ('Cavatappi au speck', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Risotto aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Risotto milanais au safran
INSERT INTO recipes (name, role, description)
VALUES ('Risotto milanais au safran', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Risotto aux asperges
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux asperges', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Risotto aux fruits de mer
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux fruits de mer', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Risotto aux courgettes
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux courgettes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Risotto au poulet
INSERT INTO recipes (name, role, description)
VALUES ('Risotto au poulet', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Risotto aux épinards
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux épinards', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Risotto aux carottes
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux carottes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Risotto au parmesan
INSERT INTO recipes (name, role, description)
VALUES ('Risotto au parmesan', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Risotto aux poireaux
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux poireaux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 5 terminé' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'PLAT_PRINCIPAL') as recettes_plat_principal
FROM recipes;
-- ========================================================================
-- BATCH 6 : Ajout de 50 recettes (PLAT)
-- ========================================================================

BEGIN;

-- 1. Cabillaud au four à la provençale
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud au four à la provençale', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Cabillaud au four à l’ail et citron
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud au four à l’ail et citron', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Cabillaud au four à la crème
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud au four à la crème', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Cabillaud au four aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud au four aux herbes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Cabillaud au four aux tomates
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud au four aux tomates', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Cabillaud au four aux poivrons
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud au four aux poivrons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Cabillaud au four aux courgettes
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud au four aux courgettes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Cabillaud au four aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud au four aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Cabillaud au four au curry doux
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud au four au curry doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Cabillaud au four au pesto
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud au four au pesto', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Colin au four au beurre
INSERT INTO recipes (name, role, description)
VALUES ('Colin au four au beurre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Colin au four aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Colin au four aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Colin au four à la moutarde
INSERT INTO recipes (name, role, description)
VALUES ('Colin au four à la moutarde', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Colin au four aux épices
INSERT INTO recipes (name, role, description)
VALUES ('Colin au four aux épices', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Merlan au four à l’ail
INSERT INTO recipes (name, role, description)
VALUES ('Merlan au four à l’ail', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Merlan au four aux tomates
INSERT INTO recipes (name, role, description)
VALUES ('Merlan au four aux tomates', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Merlan au four au vin blanc
INSERT INTO recipes (name, role, description)
VALUES ('Merlan au four au vin blanc', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Merlan au four aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Merlan au four aux herbes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Lieu noir au four
INSERT INTO recipes (name, role, description)
VALUES ('Lieu noir au four', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Lieu noir au four au citron
INSERT INTO recipes (name, role, description)
VALUES ('Lieu noir au four au citron', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Cabillaud à la crème
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud à la crème', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Cabillaud sauce moutarde
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud sauce moutarde', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Cabillaud sauce tomate
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud sauce tomate', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Cabillaud sauce curry doux
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud sauce curry doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Cabillaud sauce au vin blanc
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud sauce au vin blanc', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Cabillaud sauce aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud sauce aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Colin sauce à l’oseille
INSERT INTO recipes (name, role, description)
VALUES ('Colin sauce à l’oseille', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Colin sauce moutarde
INSERT INTO recipes (name, role, description)
VALUES ('Colin sauce moutarde', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Colin sauce au beurre blanc
INSERT INTO recipes (name, role, description)
VALUES ('Colin sauce au beurre blanc', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Merlan sauce tomate
INSERT INTO recipes (name, role, description)
VALUES ('Merlan sauce tomate', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Merlan sauce crème
INSERT INTO recipes (name, role, description)
VALUES ('Merlan sauce crème', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Merlan sauce aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Merlan sauce aux herbes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Lieu noir sauce au curry doux
INSERT INTO recipes (name, role, description)
VALUES ('Lieu noir sauce au curry doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Lieu noir sauce au beurre
INSERT INTO recipes (name, role, description)
VALUES ('Lieu noir sauce au beurre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Lieu noir sauce tomate
INSERT INTO recipes (name, role, description)
VALUES ('Lieu noir sauce tomate', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Cabillaud sauce aux poireaux
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud sauce aux poireaux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Cabillaud sauce aux carottes
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud sauce aux carottes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Colin sauce aux oignons
INSERT INTO recipes (name, role, description)
VALUES ('Colin sauce aux oignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Merlan sauce aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Merlan sauce aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Cabillaud sauce au citron
INSERT INTO recipes (name, role, description)
VALUES ('Cabillaud sauce au citron', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Saumon au four
INSERT INTO recipes (name, role, description)
VALUES ('Saumon au four', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Saumon grillé
INSERT INTO recipes (name, role, description)
VALUES ('Saumon grillé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Saumon en papillote
INSERT INTO recipes (name, role, description)
VALUES ('Saumon en papillote', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Saumon à la crème
INSERT INTO recipes (name, role, description)
VALUES ('Saumon à la crème', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Saumon au pesto
INSERT INTO recipes (name, role, description)
VALUES ('Saumon au pesto', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Saumon au miel
INSERT INTO recipes (name, role, description)
VALUES ('Saumon au miel', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Saumon au citron
INSERT INTO recipes (name, role, description)
VALUES ('Saumon au citron', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Saumon aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Saumon aux herbes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Saumon au curry doux
INSERT INTO recipes (name, role, description)
VALUES ('Saumon au curry doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Saumon sauce soja
INSERT INTO recipes (name, role, description)
VALUES ('Saumon sauce soja', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 6 terminé' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'PLAT_PRINCIPAL') as recettes_plat_principal
FROM recipes;
-- ========================================================================
-- BATCH 7 : Ajout de 50 recettes (PLAT)
-- ========================================================================

BEGIN;

-- 1. Poulet rôti nature
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti nature', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Poulet rôti aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux herbes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Poulet rôti à l’ail
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti à l’ail', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Poulet rôti au citron
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti au citron', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Poulet rôti à la moutarde
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti à la moutarde', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Poulet rôti au miel
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti au miel', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Poulet rôti au paprika
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti au paprika', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Poulet rôti au curry doux
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti au curry doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Poulet rôti aux tomates
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux tomates', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Poulet rôti aux poivrons
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux poivrons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Poulet rôti aux courgettes
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux courgettes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Poulet rôti aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Poulet rôti aux carottes
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux carottes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Poulet rôti aux pommes de terre
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux pommes de terre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Poulet rôti aux oignons
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux oignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Poulet rôti aux épinards
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux épinards', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Poulet rôti aux aubergines
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux aubergines', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Poulet rôti aux herbes de Provence
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux herbes de Provence', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Poulet rôti au vin blanc
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti au vin blanc', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Poulet rôti au beurre
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti au beurre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Poulet à la crème
INSERT INTO recipes (name, role, description)
VALUES ('Poulet à la crème', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Poulet à la moutarde
INSERT INTO recipes (name, role, description)
VALUES ('Poulet à la moutarde', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Poulet basquaise
INSERT INTO recipes (name, role, description)
VALUES ('Poulet basquaise', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Poulet au curry doux
INSERT INTO recipes (name, role, description)
VALUES ('Poulet au curry doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Poulet chasseur
INSERT INTO recipes (name, role, description)
VALUES ('Poulet chasseur', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Poulet à la provençale
INSERT INTO recipes (name, role, description)
VALUES ('Poulet à la provençale', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Poulet aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Poulet au vin blanc
INSERT INTO recipes (name, role, description)
VALUES ('Poulet au vin blanc', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Poulet aux poivrons
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux poivrons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Poulet aux carottes
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux carottes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Poulet aux oignons
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux oignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Poulet au paprika
INSERT INTO recipes (name, role, description)
VALUES ('Poulet au paprika', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Poulet au citron
INSERT INTO recipes (name, role, description)
VALUES ('Poulet au citron', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Poulet aux olives
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux olives', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Poulet au lait de coco
INSERT INTO recipes (name, role, description)
VALUES ('Poulet au lait de coco', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Poulet aux tomates
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux tomates', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Poulet au gingembre
INSERT INTO recipes (name, role, description)
VALUES ('Poulet au gingembre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Poulet aux épinards
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux épinards', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Poulet aux courgettes
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux courgettes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Poulet au fromage
INSERT INTO recipes (name, role, description)
VALUES ('Poulet au fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Poulet au cidre
INSERT INTO recipes (name, role, description)
VALUES ('Poulet au cidre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Poulet à la bière
INSERT INTO recipes (name, role, description)
VALUES ('Poulet à la bière', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Poulet au vin rouge
INSERT INTO recipes (name, role, description)
VALUES ('Poulet au vin rouge', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Poulet aux pruneaux
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux pruneaux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Poulet aux marrons
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux marrons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Poulet aux pommes
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux pommes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Poulet aux poires
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux poires', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Poulet aux raisins secs
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux raisins secs', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Poulet aux figues
INSERT INTO recipes (name, role, description)
VALUES ('Poulet aux figues', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Poulet au curry et lait de coco
INSERT INTO recipes (name, role, description)
VALUES ('Poulet au curry et lait de coco', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 7 terminé' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'PLAT_PRINCIPAL') as recettes_plat_principal
FROM recipes;
-- ========================================================================
-- BATCH 8 : Ajout de 50 recettes (DESSERT)
-- ========================================================================

BEGIN;

-- 1. Gâteau au yaourt
INSERT INTO recipes (name, role, description)
VALUES ('Gâteau au yaourt', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Quatre-quarts
INSERT INTO recipes (name, role, description)
VALUES ('Quatre-quarts', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Moelleux au chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Moelleux au chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Fondant au chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Fondant au chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Opéra
INSERT INTO recipes (name, role, description)
VALUES ('Opéra', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Forêt-Noire
INSERT INTO recipes (name, role, description)
VALUES ('Forêt-Noire', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Mille-feuille
INSERT INTO recipes (name, role, description)
VALUES ('Mille-feuille', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Paris-Brest
INSERT INTO recipes (name, role, description)
VALUES ('Paris-Brest', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Saint-Honoré
INSERT INTO recipes (name, role, description)
VALUES ('Saint-Honoré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Tarte Tatin
INSERT INTO recipes (name, role, description)
VALUES ('Tarte Tatin', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Clafoutis
INSERT INTO recipes (name, role, description)
VALUES ('Clafoutis', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Kouign-amann
INSERT INTO recipes (name, role, description)
VALUES ('Kouign-amann', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Galette des Rois
INSERT INTO recipes (name, role, description)
VALUES ('Galette des Rois', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Gâteau basque
INSERT INTO recipes (name, role, description)
VALUES ('Gâteau basque', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Far breton
INSERT INTO recipes (name, role, description)
VALUES ('Far breton', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Baba au rhum
INSERT INTO recipes (name, role, description)
VALUES ('Baba au rhum', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Savarin
INSERT INTO recipes (name, role, description)
VALUES ('Savarin', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Charlotte aux fraises
INSERT INTO recipes (name, role, description)
VALUES ('Charlotte aux fraises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Gâteau aux pommes
INSERT INTO recipes (name, role, description)
VALUES ('Gâteau aux pommes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Gâteau aux poires
INSERT INTO recipes (name, role, description)
VALUES ('Gâteau aux poires', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Tarte aux pommes
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux pommes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Tarte aux poires
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux poires', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Tarte aux prunes
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux prunes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Tarte aux cerises
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux cerises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Tarte aux fraises
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux fraises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Tarte aux framboises
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux framboises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Tarte aux myrtilles
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux myrtilles', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Tarte aux mûres
INSERT INTO recipes (name, role, description)
VALUES ('Tarte aux mûres', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Tarte au citron
INSERT INTO recipes (name, role, description)
VALUES ('Tarte au citron', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Tarte au chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Tarte au chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Tarte amandine
INSERT INTO recipes (name, role, description)
VALUES ('Tarte amandine', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Tarte bourdaloue
INSERT INTO recipes (name, role, description)
VALUES ('Tarte bourdaloue', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Tarte tatin
INSERT INTO recipes (name, role, description)
VALUES ('Tarte tatin', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Tarte normande
INSERT INTO recipes (name, role, description)
VALUES ('Tarte normande', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Tarte tropézienne
INSERT INTO recipes (name, role, description)
VALUES ('Tarte tropézienne', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Tarte sablée fruits rouges
INSERT INTO recipes (name, role, description)
VALUES ('Tarte sablée fruits rouges', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Tarte exotique mangue
INSERT INTO recipes (name, role, description)
VALUES ('Tarte exotique mangue', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Tarte coco
INSERT INTO recipes (name, role, description)
VALUES ('Tarte coco', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Tarte pistache
INSERT INTO recipes (name, role, description)
VALUES ('Tarte pistache', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Tarte noisette
INSERT INTO recipes (name, role, description)
VALUES ('Tarte noisette', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Bûche de Noël
INSERT INTO recipes (name, role, description)
VALUES ('Bûche de Noël', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Entremets chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Entremets chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Entremets vanille
INSERT INTO recipes (name, role, description)
VALUES ('Entremets vanille', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Entremets fruits rouges
INSERT INTO recipes (name, role, description)
VALUES ('Entremets fruits rouges', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Entremets exotique
INSERT INTO recipes (name, role, description)
VALUES ('Entremets exotique', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Entremets pistache
INSERT INTO recipes (name, role, description)
VALUES ('Entremets pistache', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Entremets praliné
INSERT INTO recipes (name, role, description)
VALUES ('Entremets praliné', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Entremets café
INSERT INTO recipes (name, role, description)
VALUES ('Entremets café', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Entremets noisette
INSERT INTO recipes (name, role, description)
VALUES ('Entremets noisette', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Entremets caramel
INSERT INTO recipes (name, role, description)
VALUES ('Entremets caramel', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 8 terminé' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'DESSERT') as recettes_dessert
FROM recipes;
-- ========================================================================
-- BATCH 9 : Ajout de 50 recettes (DESSERT)
-- ========================================================================

BEGIN;

-- 1. Entremets coco
INSERT INTO recipes (name, role, description)
VALUES ('Entremets coco', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Entremets mangue
INSERT INTO recipes (name, role, description)
VALUES ('Entremets mangue', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Entremets passion
INSERT INTO recipes (name, role, description)
VALUES ('Entremets passion', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Entremets marron
INSERT INTO recipes (name, role, description)
VALUES ('Entremets marron', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Entremets mousse chocolat blanc
INSERT INTO recipes (name, role, description)
VALUES ('Entremets mousse chocolat blanc', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Entremets mousse chocolat noir
INSERT INTO recipes (name, role, description)
VALUES ('Entremets mousse chocolat noir', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Entremets mousse fraise
INSERT INTO recipes (name, role, description)
VALUES ('Entremets mousse fraise', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Entremets mousse framboise
INSERT INTO recipes (name, role, description)
VALUES ('Entremets mousse framboise', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Entremets fruits exotiques
INSERT INTO recipes (name, role, description)
VALUES ('Entremets fruits exotiques', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Entremets signature
INSERT INTO recipes (name, role, description)
VALUES ('Entremets signature', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Sablés
INSERT INTO recipes (name, role, description)
VALUES ('Sablés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Cookies
INSERT INTO recipes (name, role, description)
VALUES ('Cookies', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Brownies
INSERT INTO recipes (name, role, description)
VALUES ('Brownies', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Madeleines
INSERT INTO recipes (name, role, description)
VALUES ('Madeleines', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Financiers
INSERT INTO recipes (name, role, description)
VALUES ('Financiers', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Tuiles aux amandes
INSERT INTO recipes (name, role, description)
VALUES ('Tuiles aux amandes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Palets bretons
INSERT INTO recipes (name, role, description)
VALUES ('Palets bretons', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Speculoos
INSERT INTO recipes (name, role, description)
VALUES ('Speculoos', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Canelés
INSERT INTO recipes (name, role, description)
VALUES ('Canelés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Meringues
INSERT INTO recipes (name, role, description)
VALUES ('Meringues', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Langues de chat
INSERT INTO recipes (name, role, description)
VALUES ('Langues de chat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Macarons
INSERT INTO recipes (name, role, description)
VALUES ('Macarons', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Chouquettes
INSERT INTO recipes (name, role, description)
VALUES ('Chouquettes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Navettes
INSERT INTO recipes (name, role, description)
VALUES ('Navettes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Croquants aux amandes
INSERT INTO recipes (name, role, description)
VALUES ('Croquants aux amandes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Rochers coco
INSERT INTO recipes (name, role, description)
VALUES ('Rochers coco', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Florentins
INSERT INTO recipes (name, role, description)
VALUES ('Florentins', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Pain d’épices
INSERT INTO recipes (name, role, description)
VALUES ('Pain d’épices', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Biscuits au chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Biscuits au chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Biscuits au citron
INSERT INTO recipes (name, role, description)
VALUES ('Biscuits au citron', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Mousse au chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Mousse au chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Mousse au café
INSERT INTO recipes (name, role, description)
VALUES ('Mousse au café', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Mousse à la vanille
INSERT INTO recipes (name, role, description)
VALUES ('Mousse à la vanille', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Mousse aux fruits
INSERT INTO recipes (name, role, description)
VALUES ('Mousse aux fruits', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Mousse au citron
INSERT INTO recipes (name, role, description)
VALUES ('Mousse au citron', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Mousse à l’orange
INSERT INTO recipes (name, role, description)
VALUES ('Mousse à l’orange', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Mousse exotique
INSERT INTO recipes (name, role, description)
VALUES ('Mousse exotique', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Mousse pistache
INSERT INTO recipes (name, role, description)
VALUES ('Mousse pistache', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Crème caramel
INSERT INTO recipes (name, role, description)
VALUES ('Crème caramel', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Crème brûlée
INSERT INTO recipes (name, role, description)
VALUES ('Crème brûlée', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Crème catalane
INSERT INTO recipes (name, role, description)
VALUES ('Crème catalane', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Panna cotta
INSERT INTO recipes (name, role, description)
VALUES ('Panna cotta', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Ile flottante
INSERT INTO recipes (name, role, description)
VALUES ('Ile flottante', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Œufs au lait
INSERT INTO recipes (name, role, description)
VALUES ('Œufs au lait', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Crème vanille
INSERT INTO recipes (name, role, description)
VALUES ('Crème vanille', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Crème chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Crème chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Crème café
INSERT INTO recipes (name, role, description)
VALUES ('Crème café', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Crème pistache
INSERT INTO recipes (name, role, description)
VALUES ('Crème pistache', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Crème coco
INSERT INTO recipes (name, role, description)
VALUES ('Crème coco', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Crème noisette
INSERT INTO recipes (name, role, description)
VALUES ('Crème noisette', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 9 terminé' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'DESSERT') as recettes_dessert
FROM recipes;
