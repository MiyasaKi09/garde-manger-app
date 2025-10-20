-- ========================================================================
-- BATCH 18 : 100 recettes (PLAT_PRINCIPAL)
-- Source : bloc12_streetfood_complet.txt
-- ========================================================================

BEGIN;

-- 1. Sandwich jambon beurre
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich jambon beurre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Sandwich jambon fromage
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich jambon fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Sandwich poulet crudités
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich poulet crudités', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Sandwich thon mayonnaise
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich thon mayonnaise', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Sandwich au fromage
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Sandwich au saumon fumé
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au saumon fumé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Sandwich au rôti de bœuf
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au rôti de bœuf', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Sandwich au jambon cru
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au jambon cru', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Sandwich aux légumes grillés
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich aux légumes grillés', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Sandwich au poulet curry
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au poulet curry', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Sandwich au thon crudités
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au thon crudités', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Sandwich au chèvre
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au chèvre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Sandwich au bleu
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au bleu', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Sandwich au camembert
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au camembert', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Sandwich au comté
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au comté', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Sandwich au jambon de pays
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au jambon de pays', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Sandwich à la dinde
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich à la dinde', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Sandwich au pastrami
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au pastrami', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Sandwich au saucisson
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich au saucisson', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Sandwich aux rillettes
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich aux rillettes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Croque-monsieur
INSERT INTO recipes (name, role, description)
VALUES ('Croque-monsieur', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Croque-madame
INSERT INTO recipes (name, role, description)
VALUES ('Croque-madame', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Panini jambon fromage
INSERT INTO recipes (name, role, description)
VALUES ('Panini jambon fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Panini poulet mozzarella
INSERT INTO recipes (name, role, description)
VALUES ('Panini poulet mozzarella', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Panini thon fromage
INSERT INTO recipes (name, role, description)
VALUES ('Panini thon fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Panini légumes grillés
INSERT INTO recipes (name, role, description)
VALUES ('Panini légumes grillés', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Panini au saumon
INSERT INTO recipes (name, role, description)
VALUES ('Panini au saumon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Panini au chèvre
INSERT INTO recipes (name, role, description)
VALUES ('Panini au chèvre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Sandwich chaud au pastrami
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud au pastrami', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Sandwich chaud au rôti de bœuf
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud au rôti de bœuf', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Sandwich chaud au poulet
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud au poulet', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Sandwich chaud au jambon cru
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud au jambon cru', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Sandwich chaud au fromage
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud au fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Sandwich chaud au saumon
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud au saumon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Sandwich chaud au bacon
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud au bacon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Sandwich chaud au thon
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud au thon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Sandwich chaud au camembert
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud au camembert', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Sandwich chaud au comté
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud au comté', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Sandwich chaud au bleu
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud au bleu', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Sandwich chaud aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Sandwich chaud aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Burger classique
INSERT INTO recipes (name, role, description)
VALUES ('Burger classique', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Cheeseburger
INSERT INTO recipes (name, role, description)
VALUES ('Cheeseburger', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Double cheeseburger
INSERT INTO recipes (name, role, description)
VALUES ('Double cheeseburger', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Bacon burger
INSERT INTO recipes (name, role, description)
VALUES ('Bacon burger', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Chicken burger
INSERT INTO recipes (name, role, description)
VALUES ('Chicken burger', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Fish burger
INSERT INTO recipes (name, role, description)
VALUES ('Fish burger', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Veggie burger
INSERT INTO recipes (name, role, description)
VALUES ('Veggie burger', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Burger au bleu
INSERT INTO recipes (name, role, description)
VALUES ('Burger au bleu', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Burger au roquefort
INSERT INTO recipes (name, role, description)
VALUES ('Burger au roquefort', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Burger au chèvre
INSERT INTO recipes (name, role, description)
VALUES ('Burger au chèvre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 51. Burger au camembert
INSERT INTO recipes (name, role, description)
VALUES ('Burger au camembert', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 52. Burger au comté
INSERT INTO recipes (name, role, description)
VALUES ('Burger au comté', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 53. Burger au reblochon
INSERT INTO recipes (name, role, description)
VALUES ('Burger au reblochon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 54. Burger au gorgonzola
INSERT INTO recipes (name, role, description)
VALUES ('Burger au gorgonzola', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 55. Burger au pesto
INSERT INTO recipes (name, role, description)
VALUES ('Burger au pesto', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 56. Burger au curry doux
INSERT INTO recipes (name, role, description)
VALUES ('Burger au curry doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 57. Burger au bacon et œuf
INSERT INTO recipes (name, role, description)
VALUES ('Burger au bacon et œuf', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 58. Burger au poulet pané
INSERT INTO recipes (name, role, description)
VALUES ('Burger au poulet pané', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 59. Burger au poisson pané
INSERT INTO recipes (name, role, description)
VALUES ('Burger au poisson pané', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 60. Burger au tofu
INSERT INTO recipes (name, role, description)
VALUES ('Burger au tofu', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 61. Wrap poulet crudités
INSERT INTO recipes (name, role, description)
VALUES ('Wrap poulet crudités', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 62. Wrap thon crudités
INSERT INTO recipes (name, role, description)
VALUES ('Wrap thon crudités', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 63. Wrap saumon crudités
INSERT INTO recipes (name, role, description)
VALUES ('Wrap saumon crudités', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 64. Wrap légumes grillés
INSERT INTO recipes (name, role, description)
VALUES ('Wrap légumes grillés', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 65. Wrap falafel
INSERT INTO recipes (name, role, description)
VALUES ('Wrap falafel', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 66. Wrap au poulet curry
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au poulet curry', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 67. Wrap au poulet barbecue
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au poulet barbecue', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 68. Wrap au bœuf
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au bœuf', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 69. Wrap au porc
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au porc', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 70. Wrap au jambon cru
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au jambon cru', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 71. Wrap au jambon blanc
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au jambon blanc', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 72. Wrap au fromage
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 73. Wrap au chèvre
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au chèvre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 74. Wrap au bleu
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au bleu', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 75. Wrap au camembert
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au camembert', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 76. Wrap au comté
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au comté', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 77. Wrap au pesto
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au pesto', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 78. Wrap au thon mayonnaise
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au thon mayonnaise', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 79. Wrap aux crevettes
INSERT INTO recipes (name, role, description)
VALUES ('Wrap aux crevettes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 80. Wrap au saumon fumé
INSERT INTO recipes (name, role, description)
VALUES ('Wrap au saumon fumé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 81. Kebab classique
INSERT INTO recipes (name, role, description)
VALUES ('Kebab classique', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 82. Kebab au poulet
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au poulet', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 83. Kebab au bœuf
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au bœuf', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 84. Kebab à l’agneau
INSERT INTO recipes (name, role, description)
VALUES ('Kebab à l’agneau', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 85. Kebab aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Kebab aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 86. Kebab au poisson
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au poisson', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 87. Kebab au falafel
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au falafel', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 88. Kebab au fromage
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au fromage', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 89. Kebab au curry doux
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au curry doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 90. Kebab au paprika
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au paprika', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 91. Kebab à la sauce blanche
INSERT INTO recipes (name, role, description)
VALUES ('Kebab à la sauce blanche', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 92. Kebab à la sauce piquante
INSERT INTO recipes (name, role, description)
VALUES ('Kebab à la sauce piquante', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 93. Kebab à la sauce au yaourt
INSERT INTO recipes (name, role, description)
VALUES ('Kebab à la sauce au yaourt', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 94. Kebab à la sauce barbecue
INSERT INTO recipes (name, role, description)
VALUES ('Kebab à la sauce barbecue', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 95. Kebab au miel
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au miel', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 96. Kebab au pesto
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au pesto', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 97. Kebab au poulet mariné
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au poulet mariné', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 98. Kebab au bœuf mariné
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au bœuf mariné', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 99. Kebab au poisson mariné
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au poisson mariné', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 100. Kebab au tofu
INSERT INTO recipes (name, role, description)
VALUES ('Kebab au tofu', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 18 terminé' as message,
  COUNT(*) as total_recettes
FROM recipes;
