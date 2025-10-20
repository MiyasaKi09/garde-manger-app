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
