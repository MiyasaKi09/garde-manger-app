-- ========================================================================
-- BATCH 21 : 100 recettes (PLAT_PRINCIPAL)
-- Source : bloc12_streetfood_complet.txt
-- ========================================================================

BEGIN;

-- 1. Crêpe jambon
INSERT INTO recipes (name, role, description)
VALUES ('Crêpe jambon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Crêpe fromage
INSERT INTO recipes (name, role, description)
VALUES ('Crêpe fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Crêpe complète
INSERT INTO recipes (name, role, description)
VALUES ('Crêpe complète', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Crêpe au saumon
INSERT INTO recipes (name, role, description)
VALUES ('Crêpe au saumon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Crêpe aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Crêpe aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Crêpe aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Crêpe aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Crêpe au poulet
INSERT INTO recipes (name, role, description)
VALUES ('Crêpe au poulet', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Crêpe au thon
INSERT INTO recipes (name, role, description)
VALUES ('Crêpe au thon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Galette saucisse
INSERT INTO recipes (name, role, description)
VALUES ('Galette saucisse', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Galette au jambon
INSERT INTO recipes (name, role, description)
VALUES ('Galette au jambon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Galette aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Galette aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Galette au fromage
INSERT INTO recipes (name, role, description)
VALUES ('Galette au fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Galette complète
INSERT INTO recipes (name, role, description)
VALUES ('Galette complète', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Galette au poulet
INSERT INTO recipes (name, role, description)
VALUES ('Galette au poulet', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Galette au saumon
INSERT INTO recipes (name, role, description)
VALUES ('Galette au saumon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Galette aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Galette aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Wrap-crêpe
INSERT INTO recipes (name, role, description)
VALUES ('Wrap-crêpe', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Crêpe roulée fromage
INSERT INTO recipes (name, role, description)
VALUES ('Crêpe roulée fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Galette roulée jambon
INSERT INTO recipes (name, role, description)
VALUES ('Galette roulée jambon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Crêpe gratinée
INSERT INTO recipes (name, role, description)
VALUES ('Crêpe gratinée', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Beignets de légumes
INSERT INTO recipes (name, role, description)
VALUES ('Beignets de légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Beignets de poulet
INSERT INTO recipes (name, role, description)
VALUES ('Beignets de poulet', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Beignets de poisson
INSERT INTO recipes (name, role, description)
VALUES ('Beignets de poisson', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Beignets de crevettes
INSERT INTO recipes (name, role, description)
VALUES ('Beignets de crevettes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Beignets de calamars
INSERT INTO recipes (name, role, description)
VALUES ('Beignets de calamars', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Tempura de légumes
INSERT INTO recipes (name, role, description)
VALUES ('Tempura de légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Tempura de crevettes
INSERT INTO recipes (name, role, description)
VALUES ('Tempura de crevettes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Tempura de poisson
INSERT INTO recipes (name, role, description)
VALUES ('Tempura de poisson', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Nuggets de poulet
INSERT INTO recipes (name, role, description)
VALUES ('Nuggets de poulet', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Nuggets de poisson
INSERT INTO recipes (name, role, description)
VALUES ('Nuggets de poisson', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Nuggets de légumes
INSERT INTO recipes (name, role, description)
VALUES ('Nuggets de légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Onion rings
INSERT INTO recipes (name, role, description)
VALUES ('Onion rings', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Frites classiques
INSERT INTO recipes (name, role, description)
VALUES ('Frites classiques', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Frites de patates douces
INSERT INTO recipes (name, role, description)
VALUES ('Frites de patates douces', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Chips maison
INSERT INTO recipes (name, role, description)
VALUES ('Chips maison', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Galettes de pommes de terre
INSERT INTO recipes (name, role, description)
VALUES ('Galettes de pommes de terre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Croquettes de pommes de terre
INSERT INTO recipes (name, role, description)
VALUES ('Croquettes de pommes de terre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Croquettes de fromage
INSERT INTO recipes (name, role, description)
VALUES ('Croquettes de fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Accras de légumes
INSERT INTO recipes (name, role, description)
VALUES ('Accras de légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Accras de morue
INSERT INTO recipes (name, role, description)
VALUES ('Accras de morue', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Wrap végétarien
INSERT INTO recipes (name, role, description)
VALUES ('Wrap végétarien', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Wrap falafel
INSERT INTO recipes (name, role, description)
VALUES ('Wrap falafel', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Wrap houmous
INSERT INTO recipes (name, role, description)
VALUES ('Wrap houmous', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Sandwich aux crudités
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich aux crudités', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Sandwich aux œufs
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich aux œufs', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Salade de pâtes street food
INSERT INTO recipes (name, role, description)
VALUES ('Salade de pâtes street food', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Salade de riz street food
INSERT INTO recipes (name, role, description)
VALUES ('Salade de riz street food', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Salade de pois chiches
INSERT INTO recipes (name, role, description)
VALUES ('Salade de pois chiches', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Salade de lentilles
INSERT INTO recipes (name, role, description)
VALUES ('Salade de lentilles', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Taboulé
INSERT INTO recipes (name, role, description)
VALUES ('Taboulé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 51. Houmous et crudités
INSERT INTO recipes (name, role, description)
VALUES ('Houmous et crudités', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 52. Baba ganoush et crudités
INSERT INTO recipes (name, role, description)
VALUES ('Baba ganoush et crudités', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 53. Falafels et salade
INSERT INTO recipes (name, role, description)
VALUES ('Falafels et salade', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 54. Légumes grillés pita
INSERT INTO recipes (name, role, description)
VALUES ('Légumes grillés pita', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 55. Brochettes de légumes
INSERT INTO recipes (name, role, description)
VALUES ('Brochettes de légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 56. Mini pizzas végétariennes
INSERT INTO recipes (name, role, description)
VALUES ('Mini pizzas végétariennes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 57. Crackers maison
INSERT INTO recipes (name, role, description)
VALUES ('Crackers maison', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 58. Tartinade au fromage frais
INSERT INTO recipes (name, role, description)
VALUES ('Tartinade au fromage frais', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 59. Chips de légumes
INSERT INTO recipes (name, role, description)
VALUES ('Chips de légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 60. Soupe froide street food
INSERT INTO recipes (name, role, description)
VALUES ('Soupe froide street food', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 61. Mini burgers
INSERT INTO recipes (name, role, description)
VALUES ('Mini burgers', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 62. Mini hot-dogs
INSERT INTO recipes (name, role, description)
VALUES ('Mini hot-dogs', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 63. Mini pizzas
INSERT INTO recipes (name, role, description)
VALUES ('Mini pizzas', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 64. Mini quiches
INSERT INTO recipes (name, role, description)
VALUES ('Mini quiches', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 65. Mini tartes salées
INSERT INTO recipes (name, role, description)
VALUES ('Mini tartes salées', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 66. Mini sandwichs
INSERT INTO recipes (name, role, description)
VALUES ('Mini sandwichs', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 67. Mini wraps
INSERT INTO recipes (name, role, description)
VALUES ('Mini wraps', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 68. Mini kebabs
INSERT INTO recipes (name, role, description)
VALUES ('Mini kebabs', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 69. Mini tacos
INSERT INTO recipes (name, role, description)
VALUES ('Mini tacos', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 70. Mini croque-monsieur
INSERT INTO recipes (name, role, description)
VALUES ('Mini croque-monsieur', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 71. Mini paninis
INSERT INTO recipes (name, role, description)
VALUES ('Mini paninis', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 72. Mini crêpes
INSERT INTO recipes (name, role, description)
VALUES ('Mini crêpes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 73. Mini galettes
INSERT INTO recipes (name, role, description)
VALUES ('Mini galettes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 74. Mini brochettes
INSERT INTO recipes (name, role, description)
VALUES ('Mini brochettes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 75. Mini samoussas
INSERT INTO recipes (name, role, description)
VALUES ('Mini samoussas', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 76. Mini nems
INSERT INTO recipes (name, role, description)
VALUES ('Mini nems', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 77. Mini baozi
INSERT INTO recipes (name, role, description)
VALUES ('Mini baozi', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 78. Mini arancini
INSERT INTO recipes (name, role, description)
VALUES ('Mini arancini', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 79. Mini accras
INSERT INTO recipes (name, role, description)
VALUES ('Mini accras', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 80. Mini beignets salés
INSERT INTO recipes (name, role, description)
VALUES ('Mini beignets salés', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 81. Burger sucré-salé
INSERT INTO recipes (name, role, description)
VALUES ('Burger sucré-salé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 82. Hot-dog exotique
INSERT INTO recipes (name, role, description)
VALUES ('Hot-dog exotique', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 83. Pizza sushi
INSERT INTO recipes (name, role, description)
VALUES ('Pizza sushi', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 84. Wrap dessert salé
INSERT INTO recipes (name, role, description)
VALUES ('Wrap dessert salé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 85. Sandwich fusion asiatique
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich fusion asiatique', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 86. Kebab exotique
INSERT INTO recipes (name, role, description)
VALUES ('Kebab exotique', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 87. Tacos sucré-salé
INSERT INTO recipes (name, role, description)
VALUES ('Tacos sucré-salé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 88. Crêpe fusion
INSERT INTO recipes (name, role, description)
VALUES ('Crêpe fusion', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 89. Bao burger
INSERT INTO recipes (name, role, description)
VALUES ('Bao burger', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 90. Ramen burger
INSERT INTO recipes (name, role, description)
VALUES ('Ramen burger', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 91. Sushi burrito
INSERT INTO recipes (name, role, description)
VALUES ('Sushi burrito', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 92. Pizza burger
INSERT INTO recipes (name, role, description)
VALUES ('Pizza burger', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 93. Croissant sandwich
INSERT INTO recipes (name, role, description)
VALUES ('Croissant sandwich', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 94. Donut burger
INSERT INTO recipes (name, role, description)
VALUES ('Donut burger', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 95. Pita sucrée-salée
INSERT INTO recipes (name, role, description)
VALUES ('Pita sucrée-salée', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 96. Empanada fusion
INSERT INTO recipes (name, role, description)
VALUES ('Empanada fusion', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 97. Spring roll sucré-salé
INSERT INTO recipes (name, role, description)
VALUES ('Spring roll sucré-salé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 98. Tartine expérimentale
INSERT INTO recipes (name, role, description)
VALUES ('Tartine expérimentale', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 99. Brochette fusion
INSERT INTO recipes (name, role, description)
VALUES ('Brochette fusion', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 100. Snack hybride surprise
INSERT INTO recipes (name, role, description)
VALUES ('Snack hybride surprise', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 21 terminé' as message,
  COUNT(*) as total_recettes
FROM recipes;
