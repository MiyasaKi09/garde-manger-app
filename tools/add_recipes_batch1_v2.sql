-- ========================================================================
-- BATCH 1 : Ajout de 50 Entrées (Bloc 1) - Version Alternative
-- Utilise WHERE NOT EXISTS au lieu de ON CONFLICT
-- ========================================================================

BEGIN;

-- Les INSERT utilisent WHERE NOT EXISTS pour éviter les doublons
-- Si une recette existe déjà avec le même nom, elle sera ignorée

-- 1. Salade niçoise
INSERT INTO recipes (name, role, description)
SELECT 'Salade niçoise', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade niçoise');

-- 2. Salade piémontaise
INSERT INTO recipes (name, role, description)
SELECT 'Salade piémontaise', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade piémontaise');

-- 3. Salade de lentilles
INSERT INTO recipes (name, role, description)
SELECT 'Salade de lentilles', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de lentilles');

-- 4. Salade d'endives aux noix
INSERT INTO recipes (name, role, description)
SELECT 'Salade d''endives aux noix', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade d''endives aux noix');

-- 5. Salade lyonnaise
INSERT INTO recipes (name, role, description)
SELECT 'Salade lyonnaise', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade lyonnaise');

-- 6. Salade de pommes de terre
INSERT INTO recipes (name, role, description)
SELECT 'Salade de pommes de terre', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de pommes de terre');

-- 7. Salade de haricots verts
INSERT INTO recipes (name, role, description)
SELECT 'Salade de haricots verts', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de haricots verts');

-- 8. Salade de betteraves
INSERT INTO recipes (name, role, description)
SELECT 'Salade de betteraves', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de betteraves');

-- 9. Salade de tomates à l'échalote
INSERT INTO recipes (name, role, description)
SELECT 'Salade de tomates à l''échalote', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de tomates à l''échalote');

-- 10. Salade de carottes râpées
INSERT INTO recipes (name, role, description)
SELECT 'Salade de carottes râpées', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de carottes râpées');

-- 11. Céleri rémoulade
INSERT INTO recipes (name, role, description)
SELECT 'Céleri rémoulade', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Céleri rémoulade');

-- 12. Salade de chou blanc
INSERT INTO recipes (name, role, description)
SELECT 'Salade de chou blanc', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de chou blanc');

-- 13. Salade de concombre à la crème
INSERT INTO recipes (name, role, description)
SELECT 'Salade de concombre à la crème', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de concombre à la crème');

-- 14. Salade de mache aux lardons
INSERT INTO recipes (name, role, description)
SELECT 'Salade de mache aux lardons', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de mache aux lardons');

-- 15. Salade de gésiers
INSERT INTO recipes (name, role, description)
SELECT 'Salade de gésiers', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de gésiers');

-- 16. Salade campagnarde
INSERT INTO recipes (name, role, description)
SELECT 'Salade campagnarde', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade campagnarde');

-- 17. Salade d'asperges
INSERT INTO recipes (name, role, description)
SELECT 'Salade d''asperges', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade d''asperges');

-- 18. Salade de chou-fleur
INSERT INTO recipes (name, role, description)
SELECT 'Salade de chou-fleur', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de chou-fleur');

-- 19. Salade aux œufs mimosa
INSERT INTO recipes (name, role, description)
SELECT 'Salade aux œufs mimosa', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade aux œufs mimosa');

-- 20. Salade composée maison
INSERT INTO recipes (name, role, description)
SELECT 'Salade composée maison', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade composée maison');

-- 21. Taboulé libanais
INSERT INTO recipes (name, role, description)
SELECT 'Taboulé libanais', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Taboulé libanais');

-- 22. Salade grecque
INSERT INTO recipes (name, role, description)
SELECT 'Salade grecque', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade grecque');

-- 23. Salade fattouche
INSERT INTO recipes (name, role, description)
SELECT 'Salade fattouche', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade fattouche');

-- 24. Salade tunisienne
INSERT INTO recipes (name, role, description)
SELECT 'Salade tunisienne', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade tunisienne');

-- 25. Salade israélienne
INSERT INTO recipes (name, role, description)
SELECT 'Salade israélienne', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade israélienne');

-- 26. Salade caprese
INSERT INTO recipes (name, role, description)
SELECT 'Salade caprese', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade caprese');

-- 27. Salade de pois chiches
INSERT INTO recipes (name, role, description)
SELECT 'Salade de pois chiches', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de pois chiches');

-- 28. Salade de poivrons grillés
INSERT INTO recipes (name, role, description)
SELECT 'Salade de poivrons grillés', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de poivrons grillés');

-- 29. Salade d'aubergines rôties
INSERT INTO recipes (name, role, description)
SELECT 'Salade d''aubergines rôties', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade d''aubergines rôties');

-- 30. Salade de fèves
INSERT INTO recipes (name, role, description)
SELECT 'Salade de fèves', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de fèves');

-- 31. Salade de poulpe méditerranéenne
INSERT INTO recipes (name, role, description)
SELECT 'Salade de poulpe méditerranéenne', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de poulpe méditerranéenne');

-- 32. Salade d'oranges à l'oignon
INSERT INTO recipes (name, role, description)
SELECT 'Salade d''oranges à l''oignon', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade d''oranges à l''oignon');

-- 33. Salade de courgettes marinées
INSERT INTO recipes (name, role, description)
SELECT 'Salade de courgettes marinées', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de courgettes marinées');

-- 34. Salade de fenouil à l'orange
INSERT INTO recipes (name, role, description)
SELECT 'Salade de fenouil à l''orange', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de fenouil à l''orange');

-- 35. Salade de riz méditerranéenne
INSERT INTO recipes (name, role, description)
SELECT 'Salade de riz méditerranéenne', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de riz méditerranéenne');

-- 36. Salade de semoule aux herbes
INSERT INTO recipes (name, role, description)
SELECT 'Salade de semoule aux herbes', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de semoule aux herbes');

-- 37. Salade de boulgour et légumes grillés
INSERT INTO recipes (name, role, description)
SELECT 'Salade de boulgour et légumes grillés', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de boulgour et légumes grillés');

-- 38. Salade de concombre au yaourt
INSERT INTO recipes (name, role, description)
SELECT 'Salade de concombre au yaourt', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de concombre au yaourt');

-- 39. Salade de tomates et olives
INSERT INTO recipes (name, role, description)
SELECT 'Salade de tomates et olives', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de tomates et olives');

-- 40. Salade d'artichauts marinés
INSERT INTO recipes (name, role, description)
SELECT 'Salade d''artichauts marinés', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade d''artichauts marinés');

-- 41. Salade de lentilles à la moutarde
INSERT INTO recipes (name, role, description)
SELECT 'Salade de lentilles à la moutarde', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de lentilles à la moutarde');

-- 42. Salade de pois chiches au cumin
INSERT INTO recipes (name, role, description)
SELECT 'Salade de pois chiches au cumin', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de pois chiches au cumin');

-- 43. Salade de haricots rouges mexicaine
INSERT INTO recipes (name, role, description)
SELECT 'Salade de haricots rouges mexicaine', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de haricots rouges mexicaine');

-- 44. Salade de fèves à la menthe
INSERT INTO recipes (name, role, description)
SELECT 'Salade de fèves à la menthe', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de fèves à la menthe');

-- 45. Salade de pois cassés
INSERT INTO recipes (name, role, description)
SELECT 'Salade de pois cassés', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de pois cassés');

-- 46. Salade de quinoa et pois chiches
INSERT INTO recipes (name, role, description)
SELECT 'Salade de quinoa et pois chiches', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de quinoa et pois chiches');

-- 47. Salade de lentilles corail aux épices
INSERT INTO recipes (name, role, description)
SELECT 'Salade de lentilles corail aux épices', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de lentilles corail aux épices');

-- 48. Salade de pois chiches et thon
INSERT INTO recipes (name, role, description)
SELECT 'Salade de pois chiches et thon', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de pois chiches et thon');

-- 49. Salade de haricots blancs au persil
INSERT INTO recipes (name, role, description)
SELECT 'Salade de haricots blancs au persil', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de haricots blancs au persil');

-- 50. Salade de soja et légumes croquants
INSERT INTO recipes (name, role, description)
SELECT 'Salade de soja et légumes croquants', 'ENTREE', 'Entrée classique - À compléter'
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = 'Salade de soja et légumes croquants');

COMMIT;

-- Vérification
SELECT 
  'Batch 1 terminé' as message,
  COUNT(*) as nouvelles_recettes
FROM recipes
WHERE description = 'Entrée classique - À compléter';
