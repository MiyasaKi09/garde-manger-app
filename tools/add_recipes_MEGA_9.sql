-- ========================================================================
-- BATCH 50 : 10 recettes (ENTREE)
-- Source : bloc1_entrees.txt
-- ========================================================================

BEGIN;

-- 1. Quiche aux asperges
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux asperges', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Quiche à la carotte
INSERT INTO recipes (name, role, description)
VALUES ('Quiche à la carotte', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Quiche au chèvre
INSERT INTO recipes (name, role, description)
VALUES ('Quiche au chèvre', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Quiche aux lardons
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux lardons', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Quiche aux aubergines
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux aubergines', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Quiche au chou-fleur
INSERT INTO recipes (name, role, description)
VALUES ('Quiche au chou-fleur', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Quiche au bacon et fromage
INSERT INTO recipes (name, role, description)
VALUES ('Quiche au bacon et fromage', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Quiche aux poivrons
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux poivrons', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Quiche aux oignons caramélisés
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux oignons caramélisés', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Quiche au tofu et légumes
INSERT INTO recipes (name, role, description)
VALUES ('Quiche au tofu et légumes', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 50 terminé' as message,
  COUNT(*) as total_recettes
FROM recipes;


-- ========================================================================
-- BATCH 51 : 100 recettes (DESSERT)
-- Source : bloc20_desserts_complet.txt
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

-- 51. Entremets coco
INSERT INTO recipes (name, role, description)
VALUES ('Entremets coco', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 52. Entremets mangue
INSERT INTO recipes (name, role, description)
VALUES ('Entremets mangue', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 53. Entremets passion
INSERT INTO recipes (name, role, description)
VALUES ('Entremets passion', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 54. Entremets marron
INSERT INTO recipes (name, role, description)
VALUES ('Entremets marron', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 55. Entremets mousse chocolat blanc
INSERT INTO recipes (name, role, description)
VALUES ('Entremets mousse chocolat blanc', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 56. Entremets mousse chocolat noir
INSERT INTO recipes (name, role, description)
VALUES ('Entremets mousse chocolat noir', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 57. Entremets mousse fraise
INSERT INTO recipes (name, role, description)
VALUES ('Entremets mousse fraise', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 58. Entremets mousse framboise
INSERT INTO recipes (name, role, description)
VALUES ('Entremets mousse framboise', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 59. Entremets fruits exotiques
INSERT INTO recipes (name, role, description)
VALUES ('Entremets fruits exotiques', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 60. Entremets signature
INSERT INTO recipes (name, role, description)
VALUES ('Entremets signature', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 61. Sablés
INSERT INTO recipes (name, role, description)
VALUES ('Sablés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 62. Cookies
INSERT INTO recipes (name, role, description)
VALUES ('Cookies', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 63. Brownies
INSERT INTO recipes (name, role, description)
VALUES ('Brownies', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 64. Madeleines
INSERT INTO recipes (name, role, description)
VALUES ('Madeleines', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 65. Financiers
INSERT INTO recipes (name, role, description)
VALUES ('Financiers', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 66. Tuiles aux amandes
INSERT INTO recipes (name, role, description)
VALUES ('Tuiles aux amandes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 67. Palets bretons
INSERT INTO recipes (name, role, description)
VALUES ('Palets bretons', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 68. Speculoos
INSERT INTO recipes (name, role, description)
VALUES ('Speculoos', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 69. Canelés
INSERT INTO recipes (name, role, description)
VALUES ('Canelés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 70. Meringues
INSERT INTO recipes (name, role, description)
VALUES ('Meringues', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 71. Langues de chat
INSERT INTO recipes (name, role, description)
VALUES ('Langues de chat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 72. Macarons
INSERT INTO recipes (name, role, description)
VALUES ('Macarons', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 73. Chouquettes
INSERT INTO recipes (name, role, description)
VALUES ('Chouquettes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 74. Navettes
INSERT INTO recipes (name, role, description)
VALUES ('Navettes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 75. Croquants aux amandes
INSERT INTO recipes (name, role, description)
VALUES ('Croquants aux amandes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 76. Rochers coco
INSERT INTO recipes (name, role, description)
VALUES ('Rochers coco', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 77. Florentins
INSERT INTO recipes (name, role, description)
VALUES ('Florentins', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 78. Pain d’épices
INSERT INTO recipes (name, role, description)
VALUES ('Pain d’épices', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 79. Biscuits au chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Biscuits au chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 80. Biscuits au citron
INSERT INTO recipes (name, role, description)
VALUES ('Biscuits au citron', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 81. Mousse au chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Mousse au chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 82. Mousse au café
INSERT INTO recipes (name, role, description)
VALUES ('Mousse au café', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 83. Mousse à la vanille
INSERT INTO recipes (name, role, description)
VALUES ('Mousse à la vanille', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 84. Mousse aux fruits
INSERT INTO recipes (name, role, description)
VALUES ('Mousse aux fruits', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 85. Mousse au citron
INSERT INTO recipes (name, role, description)
VALUES ('Mousse au citron', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 86. Mousse à l’orange
INSERT INTO recipes (name, role, description)
VALUES ('Mousse à l’orange', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 87. Mousse exotique
INSERT INTO recipes (name, role, description)
VALUES ('Mousse exotique', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 88. Mousse pistache
INSERT INTO recipes (name, role, description)
VALUES ('Mousse pistache', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 89. Crème caramel
INSERT INTO recipes (name, role, description)
VALUES ('Crème caramel', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 90. Crème brûlée
INSERT INTO recipes (name, role, description)
VALUES ('Crème brûlée', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 91. Crème catalane
INSERT INTO recipes (name, role, description)
VALUES ('Crème catalane', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 92. Panna cotta
INSERT INTO recipes (name, role, description)
VALUES ('Panna cotta', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 93. Ile flottante
INSERT INTO recipes (name, role, description)
VALUES ('Ile flottante', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 94. Œufs au lait
INSERT INTO recipes (name, role, description)
VALUES ('Œufs au lait', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 95. Crème vanille
INSERT INTO recipes (name, role, description)
VALUES ('Crème vanille', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 96. Crème chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Crème chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 97. Crème café
INSERT INTO recipes (name, role, description)
VALUES ('Crème café', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 98. Crème pistache
INSERT INTO recipes (name, role, description)
VALUES ('Crème pistache', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 99. Crème coco
INSERT INTO recipes (name, role, description)
VALUES ('Crème coco', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 100. Crème noisette
INSERT INTO recipes (name, role, description)
VALUES ('Crème noisette', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 51 terminé' as message,
  COUNT(*) as total_recettes
FROM recipes;


-- ========================================================================
-- BATCH 52 : 100 recettes (DESSERT)
-- Source : bloc20_desserts_complet.txt
-- ========================================================================

BEGIN;

-- 1. Glace vanille
INSERT INTO recipes (name, role, description)
VALUES ('Glace vanille', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Glace chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Glace chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Glace fraise
INSERT INTO recipes (name, role, description)
VALUES ('Glace fraise', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Glace pistache
INSERT INTO recipes (name, role, description)
VALUES ('Glace pistache', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Glace café
INSERT INTO recipes (name, role, description)
VALUES ('Glace café', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Glace caramel
INSERT INTO recipes (name, role, description)
VALUES ('Glace caramel', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Glace coco
INSERT INTO recipes (name, role, description)
VALUES ('Glace coco', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Glace mangue
INSERT INTO recipes (name, role, description)
VALUES ('Glace mangue', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Glace passion
INSERT INTO recipes (name, role, description)
VALUES ('Glace passion', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Glace citron
INSERT INTO recipes (name, role, description)
VALUES ('Glace citron', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Glace framboise
INSERT INTO recipes (name, role, description)
VALUES ('Glace framboise', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Glace myrtille
INSERT INTO recipes (name, role, description)
VALUES ('Glace myrtille', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Sorbet fraise
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet fraise', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Sorbet framboise
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet framboise', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Sorbet citron
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet citron', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Sorbet mangue
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet mangue', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Parfait glacé
INSERT INTO recipes (name, role, description)
VALUES ('Parfait glacé', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Semifreddo
INSERT INTO recipes (name, role, description)
VALUES ('Semifreddo', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Profiteroles glacées
INSERT INTO recipes (name, role, description)
VALUES ('Profiteroles glacées', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Bûche glacée
INSERT INTO recipes (name, role, description)
VALUES ('Bûche glacée', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Salade de fruits
INSERT INTO recipes (name, role, description)
VALUES ('Salade de fruits', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Brochettes de fruits
INSERT INTO recipes (name, role, description)
VALUES ('Brochettes de fruits', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Compote de pommes
INSERT INTO recipes (name, role, description)
VALUES ('Compote de pommes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Compote de poires
INSERT INTO recipes (name, role, description)
VALUES ('Compote de poires', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Compote de pêches
INSERT INTO recipes (name, role, description)
VALUES ('Compote de pêches', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Compote d’abricots
INSERT INTO recipes (name, role, description)
VALUES ('Compote d’abricots', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Compote de fruits rouges
INSERT INTO recipes (name, role, description)
VALUES ('Compote de fruits rouges', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Compote exotique
INSERT INTO recipes (name, role, description)
VALUES ('Compote exotique', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Poire Belle-Hélène
INSERT INTO recipes (name, role, description)
VALUES ('Poire Belle-Hélène', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Pêche Melba
INSERT INTO recipes (name, role, description)
VALUES ('Pêche Melba', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Banane flambée
INSERT INTO recipes (name, role, description)
VALUES ('Banane flambée', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Ananas rôti
INSERT INTO recipes (name, role, description)
VALUES ('Ananas rôti', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Fraises Melba
INSERT INTO recipes (name, role, description)
VALUES ('Fraises Melba', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Fraises chantilly
INSERT INTO recipes (name, role, description)
VALUES ('Fraises chantilly', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Myrtilles au yaourt
INSERT INTO recipes (name, role, description)
VALUES ('Myrtilles au yaourt', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Framboises au coulis
INSERT INTO recipes (name, role, description)
VALUES ('Framboises au coulis', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Pommes au four
INSERT INTO recipes (name, role, description)
VALUES ('Pommes au four', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Poires pochées
INSERT INTO recipes (name, role, description)
VALUES ('Poires pochées', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Abricots rôtis
INSERT INTO recipes (name, role, description)
VALUES ('Abricots rôtis', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Clémentines confites
INSERT INTO recipes (name, role, description)
VALUES ('Clémentines confites', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Riz au lait
INSERT INTO recipes (name, role, description)
VALUES ('Riz au lait', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Semoule au lait
INSERT INTO recipes (name, role, description)
VALUES ('Semoule au lait', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Tapioca au lait
INSERT INTO recipes (name, role, description)
VALUES ('Tapioca au lait', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Gâteau de riz
INSERT INTO recipes (name, role, description)
VALUES ('Gâteau de riz', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Flan pâtissier
INSERT INTO recipes (name, role, description)
VALUES ('Flan pâtissier', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Flan au caramel
INSERT INTO recipes (name, role, description)
VALUES ('Flan au caramel', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Flan coco
INSERT INTO recipes (name, role, description)
VALUES ('Flan coco', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Yaourt maison
INSERT INTO recipes (name, role, description)
VALUES ('Yaourt maison', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Yaourt grec
INSERT INTO recipes (name, role, description)
VALUES ('Yaourt grec', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Fromage blanc sucré
INSERT INTO recipes (name, role, description)
VALUES ('Fromage blanc sucré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 51. Faisselle au miel
INSERT INTO recipes (name, role, description)
VALUES ('Faisselle au miel', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 52. Petit-suisse sucré
INSERT INTO recipes (name, role, description)
VALUES ('Petit-suisse sucré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 53. Kéfir sucré
INSERT INTO recipes (name, role, description)
VALUES ('Kéfir sucré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 54. Lassi sucré
INSERT INTO recipes (name, role, description)
VALUES ('Lassi sucré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 55. Lait de poule
INSERT INTO recipes (name, role, description)
VALUES ('Lait de poule', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 56. Chocolat liégeois
INSERT INTO recipes (name, role, description)
VALUES ('Chocolat liégeois', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 57. Café liégeois
INSERT INTO recipes (name, role, description)
VALUES ('Café liégeois', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 58. Liégeois caramel
INSERT INTO recipes (name, role, description)
VALUES ('Liégeois caramel', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 59. Dessert lacté vanille
INSERT INTO recipes (name, role, description)
VALUES ('Dessert lacté vanille', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 60. Dessert lacté chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Dessert lacté chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 61. Croissant
INSERT INTO recipes (name, role, description)
VALUES ('Croissant', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 62. Pain au chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Pain au chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 63. Pain aux raisins
INSERT INTO recipes (name, role, description)
VALUES ('Pain aux raisins', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 64. Brioche nature
INSERT INTO recipes (name, role, description)
VALUES ('Brioche nature', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 65. Brioche au sucre
INSERT INTO recipes (name, role, description)
VALUES ('Brioche au sucre', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 66. Brioche tressée
INSERT INTO recipes (name, role, description)
VALUES ('Brioche tressée', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 67. Kougelhopf sucré
INSERT INTO recipes (name, role, description)
VALUES ('Kougelhopf sucré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 68. Chausson aux pommes
INSERT INTO recipes (name, role, description)
VALUES ('Chausson aux pommes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 69. Chausson aux poires
INSERT INTO recipes (name, role, description)
VALUES ('Chausson aux poires', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 70. Chausson aux abricots
INSERT INTO recipes (name, role, description)
VALUES ('Chausson aux abricots', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 71. Chausson aux cerises
INSERT INTO recipes (name, role, description)
VALUES ('Chausson aux cerises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 72. Brioche suisse
INSERT INTO recipes (name, role, description)
VALUES ('Brioche suisse', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 73. Brioche parisienne
INSERT INTO recipes (name, role, description)
VALUES ('Brioche parisienne', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 74. Pain viennois sucré
INSERT INTO recipes (name, role, description)
VALUES ('Pain viennois sucré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 75. Babka sucrée
INSERT INTO recipes (name, role, description)
VALUES ('Babka sucrée', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 76. Panettone
INSERT INTO recipes (name, role, description)
VALUES ('Panettone', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 77. Stollen
INSERT INTO recipes (name, role, description)
VALUES ('Stollen', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 78. Cinnamon rolls
INSERT INTO recipes (name, role, description)
VALUES ('Cinnamon rolls', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 79. Pain aux noix sucré
INSERT INTO recipes (name, role, description)
VALUES ('Pain aux noix sucré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 80. Pain au miel
INSERT INTO recipes (name, role, description)
VALUES ('Pain au miel', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 81. Baklava
INSERT INTO recipes (name, role, description)
VALUES ('Baklava', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 82. Loukoums
INSERT INTO recipes (name, role, description)
VALUES ('Loukoums', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 83. Maamoul
INSERT INTO recipes (name, role, description)
VALUES ('Maamoul', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 84. Ghribia
INSERT INTO recipes (name, role, description)
VALUES ('Ghribia', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 85. Cornes de gazelle
INSERT INTO recipes (name, role, description)
VALUES ('Cornes de gazelle', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 86. Makrout
INSERT INTO recipes (name, role, description)
VALUES ('Makrout', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 87. Halva
INSERT INTO recipes (name, role, description)
VALUES ('Halva', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 88. Basboussa
INSERT INTO recipes (name, role, description)
VALUES ('Basboussa', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 89. Atayef
INSERT INTO recipes (name, role, description)
VALUES ('Atayef', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 90. Chebakia
INSERT INTO recipes (name, role, description)
VALUES ('Chebakia', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 91. Sellou
INSERT INTO recipes (name, role, description)
VALUES ('Sellou', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 92. Zlabia
INSERT INTO recipes (name, role, description)
VALUES ('Zlabia', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 93. Knefeh
INSERT INTO recipes (name, role, description)
VALUES ('Knefeh', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 94. Katayef
INSERT INTO recipes (name, role, description)
VALUES ('Katayef', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 95. Mhalbi
INSERT INTO recipes (name, role, description)
VALUES ('Mhalbi', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 96. Rfis
INSERT INTO recipes (name, role, description)
VALUES ('Rfis', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 97. Baghrir sucré
INSERT INTO recipes (name, role, description)
VALUES ('Baghrir sucré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 98. Msemen sucré
INSERT INTO recipes (name, role, description)
VALUES ('Msemen sucré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 99. Sfenj sucré
INSERT INTO recipes (name, role, description)
VALUES ('Sfenj sucré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 100. Chamiya
INSERT INTO recipes (name, role, description)
VALUES ('Chamiya', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 52 terminé' as message,
  COUNT(*) as total_recettes
FROM recipes;


-- ========================================================================
-- BATCH 53 : 100 recettes (DESSERT)
-- Source : bloc20_desserts_complet.txt
-- ========================================================================

BEGIN;

-- 1. Tarte tropézienne
INSERT INTO recipes (name, role, description)
VALUES ('Tarte tropézienne', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Canelés bordelais
INSERT INTO recipes (name, role, description)
VALUES ('Canelés bordelais', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Navettes marseillaises
INSERT INTO recipes (name, role, description)
VALUES ('Navettes marseillaises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Pompe à l’huile
INSERT INTO recipes (name, role, description)
VALUES ('Pompe à l’huile', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Gâteau nantais
INSERT INTO recipes (name, role, description)
VALUES ('Gâteau nantais', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Gâteau de Savoie
INSERT INTO recipes (name, role, description)
VALUES ('Gâteau de Savoie', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Bugnes lyonnaises
INSERT INTO recipes (name, role, description)
VALUES ('Bugnes lyonnaises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Merveilles bordelaises
INSERT INTO recipes (name, role, description)
VALUES ('Merveilles bordelaises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Croquants de Cordes
INSERT INTO recipes (name, role, description)
VALUES ('Croquants de Cordes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Fouace aveyronnaise
INSERT INTO recipes (name, role, description)
VALUES ('Fouace aveyronnaise', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Tourteau fromager
INSERT INTO recipes (name, role, description)
VALUES ('Tourteau fromager', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Crozets sucrés
INSERT INTO recipes (name, role, description)
VALUES ('Crozets sucrés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Gâteau ardéchois
INSERT INTO recipes (name, role, description)
VALUES ('Gâteau ardéchois', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Pogne de Romans
INSERT INTO recipes (name, role, description)
VALUES ('Pogne de Romans', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Gâteau de Metz
INSERT INTO recipes (name, role, description)
VALUES ('Gâteau de Metz', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Gâteau breton
INSERT INTO recipes (name, role, description)
VALUES ('Gâteau breton', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Fouace d’Auvergne
INSERT INTO recipes (name, role, description)
VALUES ('Fouace d’Auvergne', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Pastis landais
INSERT INTO recipes (name, role, description)
VALUES ('Pastis landais', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Croustade gersoise
INSERT INTO recipes (name, role, description)
VALUES ('Croustade gersoise', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Croustillons normands
INSERT INTO recipes (name, role, description)
VALUES ('Croustillons normands', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Crêpes sucrées
INSERT INTO recipes (name, role, description)
VALUES ('Crêpes sucrées', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Gaufres de Liège
INSERT INTO recipes (name, role, description)
VALUES ('Gaufres de Liège', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Gaufres de Bruxelles
INSERT INTO recipes (name, role, description)
VALUES ('Gaufres de Bruxelles', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Pancakes
INSERT INTO recipes (name, role, description)
VALUES ('Pancakes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Blini sucré
INSERT INTO recipes (name, role, description)
VALUES ('Blini sucré', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Crêpes Suzette
INSERT INTO recipes (name, role, description)
VALUES ('Crêpes Suzette', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Crêpes au chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Crêpes au chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Crêpes aux fruits
INSERT INTO recipes (name, role, description)
VALUES ('Crêpes aux fruits', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Crêpes flambées
INSERT INTO recipes (name, role, description)
VALUES ('Crêpes flambées', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Gaufres au sucre
INSERT INTO recipes (name, role, description)
VALUES ('Gaufres au sucre', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Gaufres au chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Gaufres au chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Gaufres aux fruits
INSERT INTO recipes (name, role, description)
VALUES ('Gaufres aux fruits', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Crêpes fourrées
INSERT INTO recipes (name, role, description)
VALUES ('Crêpes fourrées', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Gaufres fourrées
INSERT INTO recipes (name, role, description)
VALUES ('Gaufres fourrées', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Crêpes dentelles
INSERT INTO recipes (name, role, description)
VALUES ('Crêpes dentelles', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Crêpes mille trous
INSERT INTO recipes (name, role, description)
VALUES ('Crêpes mille trous', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Crêpes marocaines
INSERT INTO recipes (name, role, description)
VALUES ('Crêpes marocaines', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Crêpes japonaises
INSERT INTO recipes (name, role, description)
VALUES ('Crêpes japonaises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Dorayaki
INSERT INTO recipes (name, role, description)
VALUES ('Dorayaki', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Taiyaki
INSERT INTO recipes (name, role, description)
VALUES ('Taiyaki', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Beignets aux pommes
INSERT INTO recipes (name, role, description)
VALUES ('Beignets aux pommes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Beignets aux poires
INSERT INTO recipes (name, role, description)
VALUES ('Beignets aux poires', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Beignets aux bananes
INSERT INTO recipes (name, role, description)
VALUES ('Beignets aux bananes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Beignets aux cerises
INSERT INTO recipes (name, role, description)
VALUES ('Beignets aux cerises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Beignets aux fraises
INSERT INTO recipes (name, role, description)
VALUES ('Beignets aux fraises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Beignets aux framboises
INSERT INTO recipes (name, role, description)
VALUES ('Beignets aux framboises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Beignets aux myrtilles
INSERT INTO recipes (name, role, description)
VALUES ('Beignets aux myrtilles', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Beignets aux raisins secs
INSERT INTO recipes (name, role, description)
VALUES ('Beignets aux raisins secs', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Beignets fourrés confiture
INSERT INTO recipes (name, role, description)
VALUES ('Beignets fourrés confiture', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Beignets fourrés chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Beignets fourrés chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 51. Beignets fourrés crème
INSERT INTO recipes (name, role, description)
VALUES ('Beignets fourrés crème', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 52. Beignets fourrés caramel
INSERT INTO recipes (name, role, description)
VALUES ('Beignets fourrés caramel', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 53. Donuts nature
INSERT INTO recipes (name, role, description)
VALUES ('Donuts nature', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 54. Donuts chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Donuts chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 55. Donuts glacés
INSERT INTO recipes (name, role, description)
VALUES ('Donuts glacés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 56. Donuts fourrés
INSERT INTO recipes (name, role, description)
VALUES ('Donuts fourrés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 57. Churros
INSERT INTO recipes (name, role, description)
VALUES ('Churros', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 58. Bugnes sucrées
INSERT INTO recipes (name, role, description)
VALUES ('Bugnes sucrées', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 59. Oreillettes
INSERT INTO recipes (name, role, description)
VALUES ('Oreillettes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 60. Pets-de-nonne
INSERT INTO recipes (name, role, description)
VALUES ('Pets-de-nonne', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 61. Confiture de fraises
INSERT INTO recipes (name, role, description)
VALUES ('Confiture de fraises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 62. Confiture de framboises
INSERT INTO recipes (name, role, description)
VALUES ('Confiture de framboises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 63. Confiture de myrtilles
INSERT INTO recipes (name, role, description)
VALUES ('Confiture de myrtilles', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 64. Confiture de cerises
INSERT INTO recipes (name, role, description)
VALUES ('Confiture de cerises', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 65. Confiture d’abricots
INSERT INTO recipes (name, role, description)
VALUES ('Confiture d’abricots', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 66. Confiture de pêches
INSERT INTO recipes (name, role, description)
VALUES ('Confiture de pêches', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 67. Confiture de poires
INSERT INTO recipes (name, role, description)
VALUES ('Confiture de poires', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 68. Confiture de pommes
INSERT INTO recipes (name, role, description)
VALUES ('Confiture de pommes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 69. Confiture de figues
INSERT INTO recipes (name, role, description)
VALUES ('Confiture de figues', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 70. Confiture de rhubarbe
INSERT INTO recipes (name, role, description)
VALUES ('Confiture de rhubarbe', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 71. Confiture de prunes
INSERT INTO recipes (name, role, description)
VALUES ('Confiture de prunes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 72. Confiture de coings
INSERT INTO recipes (name, role, description)
VALUES ('Confiture de coings', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 73. Gelée de groseilles
INSERT INTO recipes (name, role, description)
VALUES ('Gelée de groseilles', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 74. Gelée de cassis
INSERT INTO recipes (name, role, description)
VALUES ('Gelée de cassis', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 75. Gelée de mûres
INSERT INTO recipes (name, role, description)
VALUES ('Gelée de mûres', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 76. Gelée de sureau
INSERT INTO recipes (name, role, description)
VALUES ('Gelée de sureau', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 77. Gelée de pomme
INSERT INTO recipes (name, role, description)
VALUES ('Gelée de pomme', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 78. Gelée de poire
INSERT INTO recipes (name, role, description)
VALUES ('Gelée de poire', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 79. Gelée de raisin
INSERT INTO recipes (name, role, description)
VALUES ('Gelée de raisin', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 80. Gelée de fleurs
INSERT INTO recipes (name, role, description)
VALUES ('Gelée de fleurs', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 81. Fruits confits assortis
INSERT INTO recipes (name, role, description)
VALUES ('Fruits confits assortis', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 82. Oranges confites
INSERT INTO recipes (name, role, description)
VALUES ('Oranges confites', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 83. Citrons confits sucrés
INSERT INTO recipes (name, role, description)
VALUES ('Citrons confits sucrés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 84. Clémentines confites
INSERT INTO recipes (name, role, description)
VALUES ('Clémentines confites', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 85. Cerises confites
INSERT INTO recipes (name, role, description)
VALUES ('Cerises confites', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 86. Prunes confites
INSERT INTO recipes (name, role, description)
VALUES ('Prunes confites', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 87. Poires confites
INSERT INTO recipes (name, role, description)
VALUES ('Poires confites', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 88. Pommes confites
INSERT INTO recipes (name, role, description)
VALUES ('Pommes confites', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 89. Abricots confits
INSERT INTO recipes (name, role, description)
VALUES ('Abricots confits', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 90. Ananas confit
INSERT INTO recipes (name, role, description)
VALUES ('Ananas confit', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 91. Gingembre confit
INSERT INTO recipes (name, role, description)
VALUES ('Gingembre confit', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 92. Marrons glacés
INSERT INTO recipes (name, role, description)
VALUES ('Marrons glacés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 93. Caramels mous
INSERT INTO recipes (name, role, description)
VALUES ('Caramels mous', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 94. Caramels durs
INSERT INTO recipes (name, role, description)
VALUES ('Caramels durs', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 95. Nougat
INSERT INTO recipes (name, role, description)
VALUES ('Nougat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 96. Calissons
INSERT INTO recipes (name, role, description)
VALUES ('Calissons', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 97. Pâte de fruits
INSERT INTO recipes (name, role, description)
VALUES ('Pâte de fruits', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 98. Sucettes maison
INSERT INTO recipes (name, role, description)
VALUES ('Sucettes maison', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 99. Guimauves
INSERT INTO recipes (name, role, description)
VALUES ('Guimauves', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 100. Dragées
INSERT INTO recipes (name, role, description)
VALUES ('Dragées', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 53 terminé' as message,
  COUNT(*) as total_recettes
FROM recipes;


-- ========================================================================
-- BATCH 54 : 100 recettes (DESSERT)
-- Source : bloc20_desserts_complet.txt
-- ========================================================================

BEGIN;

-- 1. Truffes au chocolat
INSERT INTO recipes (name, role, description)
VALUES ('Truffes au chocolat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Rochers pralinés
INSERT INTO recipes (name, role, description)
VALUES ('Rochers pralinés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Tablette chocolat noir
INSERT INTO recipes (name, role, description)
VALUES ('Tablette chocolat noir', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Tablette chocolat lait
INSERT INTO recipes (name, role, description)
VALUES ('Tablette chocolat lait', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Tablette chocolat blanc
INSERT INTO recipes (name, role, description)
VALUES ('Tablette chocolat blanc', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Orangettes
INSERT INTO recipes (name, role, description)
VALUES ('Orangettes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Mendiants
INSERT INTO recipes (name, role, description)
VALUES ('Mendiants', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Pralinés
INSERT INTO recipes (name, role, description)
VALUES ('Pralinés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Chocolats fourrés caramel
INSERT INTO recipes (name, role, description)
VALUES ('Chocolats fourrés caramel', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Chocolats fourrés praliné
INSERT INTO recipes (name, role, description)
VALUES ('Chocolats fourrés praliné', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Chocolats fourrés ganache
INSERT INTO recipes (name, role, description)
VALUES ('Chocolats fourrés ganache', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Chocolats fourrés liqueur
INSERT INTO recipes (name, role, description)
VALUES ('Chocolats fourrés liqueur', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Chocolat chaud
INSERT INTO recipes (name, role, description)
VALUES ('Chocolat chaud', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Chocolat viennois
INSERT INTO recipes (name, role, description)
VALUES ('Chocolat viennois', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Chocolat épicé
INSERT INTO recipes (name, role, description)
VALUES ('Chocolat épicé', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Chocolat à l’ancienne
INSERT INTO recipes (name, role, description)
VALUES ('Chocolat à l’ancienne', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Brownies chocolat intense
INSERT INTO recipes (name, role, description)
VALUES ('Brownies chocolat intense', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Cookies chocolatés
INSERT INTO recipes (name, role, description)
VALUES ('Cookies chocolatés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Fudge
INSERT INTO recipes (name, role, description)
VALUES ('Fudge', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Barres chocolatées maison
INSERT INTO recipes (name, role, description)
VALUES ('Barres chocolatées maison', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Glace au thé vert
INSERT INTO recipes (name, role, description)
VALUES ('Glace au thé vert', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Glace au sésame noir
INSERT INTO recipes (name, role, description)
VALUES ('Glace au sésame noir', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Glace au wasabi
INSERT INTO recipes (name, role, description)
VALUES ('Glace au wasabi', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Glace à la lavande
INSERT INTO recipes (name, role, description)
VALUES ('Glace à la lavande', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Glace à la rose
INSERT INTO recipes (name, role, description)
VALUES ('Glace à la rose', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Glace au jasmin
INSERT INTO recipes (name, role, description)
VALUES ('Glace au jasmin', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Glace au basilic
INSERT INTO recipes (name, role, description)
VALUES ('Glace au basilic', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Glace au romarin
INSERT INTO recipes (name, role, description)
VALUES ('Glace au romarin', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Glace au fromage
INSERT INTO recipes (name, role, description)
VALUES ('Glace au fromage', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Glace à la bière
INSERT INTO recipes (name, role, description)
VALUES ('Glace à la bière', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Glace au vin
INSERT INTO recipes (name, role, description)
VALUES ('Glace au vin', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Glace au champagne
INSERT INTO recipes (name, role, description)
VALUES ('Glace au champagne', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Sorbet tomate
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet tomate', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Sorbet concombre
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet concombre', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Sorbet carotte
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet carotte', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Sorbet betterave
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet betterave', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Sorbet fenouil
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet fenouil', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Sorbet céleri
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet céleri', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Sorbet avocat
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet avocat', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Sorbet original
INSERT INTO recipes (name, role, description)
VALUES ('Sorbet original', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Entremets miroir
INSERT INTO recipes (name, role, description)
VALUES ('Entremets miroir', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Entremets à étages
INSERT INTO recipes (name, role, description)
VALUES ('Entremets à étages', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Gâteaux sculptés
INSERT INTO recipes (name, role, description)
VALUES ('Gâteaux sculptés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Gâteaux 3D
INSERT INTO recipes (name, role, description)
VALUES ('Gâteaux 3D', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Cupcakes décorés
INSERT INTO recipes (name, role, description)
VALUES ('Cupcakes décorés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Cake design
INSERT INTO recipes (name, role, description)
VALUES ('Cake design', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Layer cake
INSERT INTO recipes (name, role, description)
VALUES ('Layer cake', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Rainbow cake
INSERT INTO recipes (name, role, description)
VALUES ('Rainbow cake', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Cheesecake
INSERT INTO recipes (name, role, description)
VALUES ('Cheesecake', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Red velvet cake
INSERT INTO recipes (name, role, description)
VALUES ('Red velvet cake', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 51. Carrot cake
INSERT INTO recipes (name, role, description)
VALUES ('Carrot cake', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 52. Banana bread
INSERT INTO recipes (name, role, description)
VALUES ('Banana bread', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 53. Number cake
INSERT INTO recipes (name, role, description)
VALUES ('Number cake', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 54. Letter cake
INSERT INTO recipes (name, role, description)
VALUES ('Letter cake', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 55. Pièce montée moderne
INSERT INTO recipes (name, role, description)
VALUES ('Pièce montée moderne', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 56. Macarons créatifs
INSERT INTO recipes (name, role, description)
VALUES ('Macarons créatifs', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 57. Biscuits décorés
INSERT INTO recipes (name, role, description)
VALUES ('Biscuits décorés', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 58. Pâtisserie florale
INSERT INTO recipes (name, role, description)
VALUES ('Pâtisserie florale', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 59. Pâtisserie aux fleurs comestibles
INSERT INTO recipes (name, role, description)
VALUES ('Pâtisserie aux fleurs comestibles', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 60. Pâtisserie expérimentale
INSERT INTO recipes (name, role, description)
VALUES ('Pâtisserie expérimentale', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 61. Tiramisu
INSERT INTO recipes (name, role, description)
VALUES ('Tiramisu', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 62. Panna cotta
INSERT INTO recipes (name, role, description)
VALUES ('Panna cotta', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 63. Cassata sicilienne
INSERT INTO recipes (name, role, description)
VALUES ('Cassata sicilienne', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 64. Sfogliatella
INSERT INTO recipes (name, role, description)
VALUES ('Sfogliatella', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 65. Pastel de nata
INSERT INTO recipes (name, role, description)
VALUES ('Pastel de nata', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 66. Churros espagnols
INSERT INTO recipes (name, role, description)
VALUES ('Churros espagnols', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 67. Flan mexicain
INSERT INTO recipes (name, role, description)
VALUES ('Flan mexicain', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 68. Tres leches cake
INSERT INTO recipes (name, role, description)
VALUES ('Tres leches cake', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 69. Dulce de leche
INSERT INTO recipes (name, role, description)
VALUES ('Dulce de leche', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 70. Cajeta
INSERT INTO recipes (name, role, description)
VALUES ('Cajeta', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 71. Cheesecake new-yorkais
INSERT INTO recipes (name, role, description)
VALUES ('Cheesecake new-yorkais', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 72. Apple pie
INSERT INTO recipes (name, role, description)
VALUES ('Apple pie', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 73. Pecan pie
INSERT INTO recipes (name, role, description)
VALUES ('Pecan pie', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 74. Pumpkin pie
INSERT INTO recipes (name, role, description)
VALUES ('Pumpkin pie', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 75. Key lime pie
INSERT INTO recipes (name, role, description)
VALUES ('Key lime pie', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 76. Baklava turc
INSERT INTO recipes (name, role, description)
VALUES ('Baklava turc', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 77. Kardinalschnitten autrichien
INSERT INTO recipes (name, role, description)
VALUES ('Kardinalschnitten autrichien', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 78. Sachertorte
INSERT INTO recipes (name, role, description)
VALUES ('Sachertorte', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 79. Strudel
INSERT INTO recipes (name, role, description)
VALUES ('Strudel', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 80. Dobos torte
INSERT INTO recipes (name, role, description)
VALUES ('Dobos torte', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 81. Bûche de Noël
INSERT INTO recipes (name, role, description)
VALUES ('Bûche de Noël', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 82. Galette des Rois
INSERT INTO recipes (name, role, description)
VALUES ('Galette des Rois', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 83. Couronne des Rois
INSERT INTO recipes (name, role, description)
VALUES ('Couronne des Rois', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 84. Cakes de fête
INSERT INTO recipes (name, role, description)
VALUES ('Cakes de fête', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 85. Cake marbré festif
INSERT INTO recipes (name, role, description)
VALUES ('Cake marbré festif', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 86. Cake aux fruits secs
INSERT INTO recipes (name, role, description)
VALUES ('Cake aux fruits secs', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 87. Cake aux fruits confits
INSERT INTO recipes (name, role, description)
VALUES ('Cake aux fruits confits', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 88. Cake au chocolat festif
INSERT INTO recipes (name, role, description)
VALUES ('Cake au chocolat festif', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 89. Cake aux épices
INSERT INTO recipes (name, role, description)
VALUES ('Cake aux épices', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 90. Cake aux marrons
INSERT INTO recipes (name, role, description)
VALUES ('Cake aux marrons', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 91. Cake aux agrumes
INSERT INTO recipes (name, role, description)
VALUES ('Cake aux agrumes', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 92. Cake au vin
INSERT INTO recipes (name, role, description)
VALUES ('Cake au vin', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 93. Mousse festive
INSERT INTO recipes (name, role, description)
VALUES ('Mousse festive', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 94. Crème festive
INSERT INTO recipes (name, role, description)
VALUES ('Crème festive', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 95. Entremets festif
INSERT INTO recipes (name, role, description)
VALUES ('Entremets festif', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 96. Bûche glacée festive
INSERT INTO recipes (name, role, description)
VALUES ('Bûche glacée festive', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 97. Pièce montée
INSERT INTO recipes (name, role, description)
VALUES ('Pièce montée', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 98. Dessert de mariage
INSERT INTO recipes (name, role, description)
VALUES ('Dessert de mariage', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 99. Dessert de baptême
INSERT INTO recipes (name, role, description)
VALUES ('Dessert de baptême', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 100. Dessert d’anniversaire
INSERT INTO recipes (name, role, description)
VALUES ('Dessert d’anniversaire', 'DESSERT', 'Dessert - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 54 terminé' as message,
  COUNT(*) as total_recettes
FROM recipes;


-- ========================================================================
-- BATCH 55 : 100 recettes (PLAT_PRINCIPAL)
-- Source : bloc2_plats_traditionnels_complet.txt
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

-- 51. Collier d’agneau mijoté
INSERT INTO recipes (name, role, description)
VALUES ('Collier d’agneau mijoté', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 52. Agneau au thym
INSERT INTO recipes (name, role, description)
VALUES ('Agneau au thym', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 53. Agneau aux légumes printaniers
INSERT INTO recipes (name, role, description)
VALUES ('Agneau aux légumes printaniers', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 54. Agneau braisé au vin blanc
INSERT INTO recipes (name, role, description)
VALUES ('Agneau braisé au vin blanc', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 55. Keftas d’agneau
INSERT INTO recipes (name, role, description)
VALUES ('Keftas d’agneau', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 56. Agneau aux aubergines
INSERT INTO recipes (name, role, description)
VALUES ('Agneau aux aubergines', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 57. Agneau sauce yaourt et menthe
INSERT INTO recipes (name, role, description)
VALUES ('Agneau sauce yaourt et menthe', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 58. Ragoût d’agneau aux pommes de terre
INSERT INTO recipes (name, role, description)
VALUES ('Ragoût d’agneau aux pommes de terre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 59. Agneau au miel et épices
INSERT INTO recipes (name, role, description)
VALUES ('Agneau au miel et épices', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 60. Chops d’agneau à l’ail
INSERT INTO recipes (name, role, description)
VALUES ('Chops d’agneau à l’ail', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 61. Rôti de porc au four
INSERT INTO recipes (name, role, description)
VALUES ('Rôti de porc au four', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 62. Filet mignon à la moutarde
INSERT INTO recipes (name, role, description)
VALUES ('Filet mignon à la moutarde', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 63. Côtes de porc grillées
INSERT INTO recipes (name, role, description)
VALUES ('Côtes de porc grillées', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 64. Porc au caramel à la française
INSERT INTO recipes (name, role, description)
VALUES ('Porc au caramel à la française', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 65. Porc aux pruneaux
INSERT INTO recipes (name, role, description)
VALUES ('Porc aux pruneaux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 66. Échine de porc braisée
INSERT INTO recipes (name, role, description)
VALUES ('Échine de porc braisée', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 67. Porc au cidre
INSERT INTO recipes (name, role, description)
VALUES ('Porc au cidre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 68. Sauté de porc au paprika
INSERT INTO recipes (name, role, description)
VALUES ('Sauté de porc au paprika', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 69. Jambon braisé
INSERT INTO recipes (name, role, description)
VALUES ('Jambon braisé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 70. Porc à la bière
INSERT INTO recipes (name, role, description)
VALUES ('Porc à la bière', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 71. Travers de porc barbecue
INSERT INTO recipes (name, role, description)
VALUES ('Travers de porc barbecue', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 72. Porc au miel et soja
INSERT INTO recipes (name, role, description)
VALUES ('Porc au miel et soja', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 73. Porc aux lentilles
INSERT INTO recipes (name, role, description)
VALUES ('Porc aux lentilles', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 74. Porc aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Porc aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 75. Porc aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Porc aux herbes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 76. Porc aux pommes
INSERT INTO recipes (name, role, description)
VALUES ('Porc aux pommes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 77. Porc au curry doux
INSERT INTO recipes (name, role, description)
VALUES ('Porc au curry doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 78. Ragoût de porc paysan
INSERT INTO recipes (name, role, description)
VALUES ('Ragoût de porc paysan', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 79. Grillades de porc marinées
INSERT INTO recipes (name, role, description)
VALUES ('Grillades de porc marinées', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 80. Jarret de porc braisé
INSERT INTO recipes (name, role, description)
VALUES ('Jarret de porc braisé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 81. Poulet rôti aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux herbes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 82. Canard rôti à l’orange
INSERT INTO recipes (name, role, description)
VALUES ('Canard rôti à l’orange', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 83. Pintade rôtie au four
INSERT INTO recipes (name, role, description)
VALUES ('Pintade rôtie au four', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 84. Chapon rôti festif
INSERT INTO recipes (name, role, description)
VALUES ('Chapon rôti festif', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 85. Poulet rôti au citron
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti au citron', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 86. Poulet rôti aux pommes de terre
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux pommes de terre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 87. Canard rôti au miel
INSERT INTO recipes (name, role, description)
VALUES ('Canard rôti au miel', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 88. Poulet rôti basquaise
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti basquaise', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 89. Poularde rôtie aux marrons
INSERT INTO recipes (name, role, description)
VALUES ('Poularde rôtie aux marrons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 90. Poulet rôti à l’ail
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti à l’ail', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 91. Poulet rôti au beurre
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti au beurre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 92. Poulet rôti aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 93. Canette rôtie au thym
INSERT INTO recipes (name, role, description)
VALUES ('Canette rôtie au thym', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 94. Poulet rôti fermier
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti fermier', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 95. Pintade rôtie aux raisins
INSERT INTO recipes (name, role, description)
VALUES ('Pintade rôtie aux raisins', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 96. Poulet rôti moutarde
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti moutarde', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 97. Poulet rôti provençal
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti provençal', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 98. Poulet rôti aux olives
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti aux olives', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 99. Canard rôti au vin rouge
INSERT INTO recipes (name, role, description)
VALUES ('Canard rôti au vin rouge', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 100. Poulet rôti à la bière
INSERT INTO recipes (name, role, description)
VALUES ('Poulet rôti à la bière', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 55 terminé' as message,
  COUNT(*) as total_recettes
FROM recipes;
