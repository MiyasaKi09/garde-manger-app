-- ========================================================================
-- BATCH 1 : Ajout de 50 Entrées (Bloc 1)
-- Vérification anti-doublons intégrée dans le SQL
-- ========================================================================

BEGIN;

-- Les INSERT utilisent ON CONFLICT pour éviter les doublons
-- Si une recette existe déjà avec le même nom, elle sera ignorée

-- 1. Salade niçoise
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade niçoise',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 2. Salade piémontaise
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade piémontaise',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 3. Salade de lentilles
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de lentilles',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 4. Salade d'endives aux noix
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade d''endives aux noix',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 5. Salade lyonnaise
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade lyonnaise',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 6. Salade de pommes de terre
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de pommes de terre',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 7. Salade de haricots verts
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de haricots verts',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 8. Salade de betteraves
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de betteraves',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 9. Salade de tomates à l’échalote
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de tomates à l’échalote',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 10. Salade de carottes râpées
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de carottes râpées',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 11. Céleri rémoulade
INSERT INTO recipes (name, role, description)
VALUES (
  'Céleri rémoulade',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 12. Salade de chou blanc
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de chou blanc',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 13. Salade de concombre à la crème
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de concombre à la crème',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 14. Salade de mache aux lardons
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de mache aux lardons',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 15. Salade de gésiers
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de gésiers',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 16. Salade campagnarde
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade campagnarde',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 17. Salade d’asperges
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade d’asperges',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 18. Salade de chou-fleur
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de chou-fleur',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 19. Salade aux œufs mimosa
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade aux œufs mimosa',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 20. Salade composée maison
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade composée maison',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 21. Taboulé libanais
INSERT INTO recipes (name, role, description)
VALUES (
  'Taboulé libanais',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 22. Salade grecque
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade grecque',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 23. Salade fattouche
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade fattouche',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 24. Salade tunisienne
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade tunisienne',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 25. Salade israélienne
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade israélienne',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 26. Salade caprese
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade caprese',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 27. Salade de pois chiches
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de pois chiches',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 28. Salade de poivrons grillés
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de poivrons grillés',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 29. Salade d’aubergines rôties
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade d’aubergines rôties',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 30. Salade de fèves
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de fèves',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 31. Salade de poulpe méditerranéenne
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de poulpe méditerranéenne',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 32. Salade d’oranges à l’oignon
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade d’oranges à l’oignon',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 33. Salade de courgettes marinées
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de courgettes marinées',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 34. Salade de fenouil à l’orange
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de fenouil à l’orange',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 35. Salade de riz méditerranéenne
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de riz méditerranéenne',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 36. Salade de semoule aux herbes
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de semoule aux herbes',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 37. Salade de boulgour et légumes grillés
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de boulgour et légumes grillés',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 38. Salade de concombre au yaourt
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de concombre au yaourt',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 39. Salade de tomates et olives
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de tomates et olives',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 40. Salade d’artichauts marinés
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade d’artichauts marinés',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 41. Salade de lentilles à la moutarde
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de lentilles à la moutarde',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 42. Salade de pois chiches au cumin
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de pois chiches au cumin',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 43. Salade de haricots rouges mexicaine
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de haricots rouges mexicaine',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 44. Salade de fèves à la menthe
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de fèves à la menthe',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 45. Salade de pois cassés
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de pois cassés',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 46. Salade de quinoa et pois chiches
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de quinoa et pois chiches',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 47. Salade de lentilles corail aux épices
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de lentilles corail aux épices',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 48. Salade de pois chiches et thon
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de pois chiches et thon',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 49. Salade de haricots blancs au persil
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de haricots blancs au persil',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;

-- 50. Salade de soja et légumes croquants
INSERT INTO recipes (name, role, description)
VALUES (
  'Salade de soja et légumes croquants',
  'ENTREE',
  'Entrée classique - À compléter'
)
ON CONFLICT (name) DO NOTHING;


COMMIT;

-- Vérification
SELECT 
  'Batch 1 terminé' as message,
  COUNT(*) as nouvelles_recettes
FROM recipes
WHERE description = 'Entrée classique - À compléter';
