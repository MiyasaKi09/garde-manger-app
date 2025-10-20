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
