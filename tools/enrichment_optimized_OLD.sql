-- Enrichissement Optimisé v3
-- Insertion en masse des associations recipe_tags

BEGIN;

-- Insertion via WITH clause pour performances

-- Liste de 3000 Recettes du Monde, Faisables en France
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Liste de 3000 Recettes du Monde, Faisables en France'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 1 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 1 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Porridge d''avoine, pommes et cannelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Porridge d''''avoine, pommes et cannelle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Arôme-Épicé Chaud', 'Automne', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Overnight porridge aux graines de chia et fruits rouges
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Overnight porridge aux graines de chia et fruits rouges'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Fruité', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Porridge salé aux épinards, feta et œuf mollet
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Porridge salé aux épinards, feta et œuf mollet'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Smoothie bowl tropical mangue-ananas-coco
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Smoothie bowl tropical mangue-ananas-coco'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Smoothie bowl vert épinards, kiwi et banane
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Smoothie bowl vert épinards, kiwi et banane'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pudding de chia au lait de coco et coulis de mangue
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pudding de chia au lait de coco et coulis de mangue'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Végétarien', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Granola maison aux noix de pécan et sirop d''érable
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Granola maison aux noix de pécan et sirop d''''érable'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Muesli Bircher aux pommes râpées et noisettes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Muesli Bircher aux pommes râpées et noisettes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pancakes américains fluffy au sirop d''érable
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pancakes américains fluffy au sirop d''''érable'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien', 'Saveur-Sucré')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pancakes à la banane sans sucre ajouté
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pancakes à la banane sans sucre ajouté'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pancakes salés au saumon fumé et aneth
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pancakes salés au saumon fumé et aneth'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Saveur-Salé', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Crêpes fines au sucre et citron
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crêpes fines au sucre et citron'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gaufres de Liège au sucre perlé
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gaufres de Liège au sucre perlé'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gaufres salées au jambon et fromage
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gaufres salées au jambon et fromage'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Salé', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Œufs brouillés crémeux à la ciboulette
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Œufs brouillés crémeux à la ciboulette'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Œuf poché sur toast d''avocat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Œuf poché sur toast d''''avocat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Léger', 'Apéritif')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Omelette aux champignons de Paris et persil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Omelette aux champignons de Paris et persil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Umami', 'Saveur-Herbacé', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Œufs au plat et bacon grillé (English style)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Œufs au plat et bacon grillé (English style)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pain perdu à la cannelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pain perdu à la cannelle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Épicé Chaud')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Brioche perdue aux fruits rouges
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Brioche perdue aux fruits rouges'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Fruité')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 2 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 2 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 21. Yaourt grec, miel et noix
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '21. Yaourt grec, miel et noix'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Lacté', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 22. Fromage blanc et compote de pommes maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '22. Fromage blanc et compote de pommes maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 23. Toast de pain complet, avocat et graines de sésame
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '23. Toast de pain complet, avocat et graines de sésame'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Apéritif')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 24. Tartine de chèvre frais, miel et thym
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '24. Tartine de chèvre frais, miel et thym'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Saveur-Herbacé', 'Arôme-Caramélisé', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 25. Huevos Rotos (œufs cassés sur frites et jambon Serrano)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '25. Huevos Rotos (œufs cassés sur frites et jambon Serrano)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 26. Pan con Tomate (pain grillé à la tomate et ail)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '26. Pan con Tomate (pain grillé à la tomate et ail)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 27. Shakshuka (œufs pochés dans une sauce tomate épicée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '27. Shakshuka (œufs pochés dans une sauce tomate épicée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Saveur-Acide', 'Saveur-Épicé', 'Texture-Crémeux', 'Intensité-Léger', 'Intensité-Intense', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 28. Full English Breakfast complet
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '28. Full English Breakfast complet'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 29. Œufs Bénédictine et sauce hollandaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '29. Œufs Bénédictine et sauce hollandaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 30. Tamagoyaki (omelette roulée japonaise)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '30. Tamagoyaki (omelette roulée japonaise)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 31. Gaspacho Andalou traditionnel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '31. Gaspacho Andalou traditionnel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 32. Salmorejo de Cordoue et ses garnitures
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '32. Salmorejo de Cordoue et ses garnitures'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 33. Soupe froide de concombre à la menthe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '33. Soupe froide de concombre à la menthe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Texture-Liquide', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 34. Velouté froid de courgettes au basilic
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '34. Velouté froid de courgettes au basilic'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Texture-Crémeux', 'Texture-Liquide', 'Arôme-Épicé Frais', 'Été', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 35. Verrine avocat, crevette et pamplemousse
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '35. Verrine avocat, crevette et pamplemousse'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Amer', 'Arôme-Agrumes', 'Apéritif')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 36. Salade Caprese (tomate, mozzarella, basilic)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '36. Salade Caprese (tomate, mozzarella, basilic)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 37. Salade Grecque traditionnelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '37. Salade Grecque traditionnelle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 38. Taboulé libanais (riche en persil)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '38. Taboulé libanais (riche en persil)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Saveur-Herbacé', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 39. Salade de lentilles vertes du Puy et lardons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '39. Salade de lentilles vertes du Puy et lardons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Végétal', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 40. Salade César au poulet grillé et copeaux de parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '40. Salade César au poulet grillé et copeaux de parmesan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Saveur-Umami', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 3 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 3 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 41. Salade Niçoise classique
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '41. Salade Niçoise classique'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 42. Salade de chèvre chaud sur toast
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '42. Salade de chèvre chaud sur toast'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Apéritif')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 43. Salade de pâtes à l''italienne (pesto, tomates séchées)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '43. Salade de pâtes à l''''italienne (pesto, tomates séchées)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 44. Salade de riz au thon, maïs et poivrons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '44. Salade de riz au thon, maïs et poivrons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 45. Salade piémontaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '45. Salade piémontaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 47. Houmous de pois chiches maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '47. Houmous de pois chiches maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 48. Baba Ganoush (caviar d''aubergines fumées)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '48. Baba Ganoush (caviar d''''aubergines fumées)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Luxe', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 49. Tzatziki grec au concombre et à l''aneth
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '49. Tzatziki grec au concombre et à l''''aneth'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 50. Moutabal libanais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '50. Moutabal libanais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 51. Tapenade d''olives noires de Provence
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '51. Tapenade d''''olives noires de Provence'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 52. Guacamole maison et chips de maïs
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '52. Guacamole maison et chips de maïs'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Mexicaine', 'Végétarien', 'Texture-Croquant')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 53. Bruschetta à la tomate fraîche et basilic
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '53. Bruschetta à la tomate fraîche et basilic'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 54. Crostinis au chèvre et figues
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '54. Crostinis au chèvre et figues'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 57. Tortilla de patatas espagnole
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '57. Tortilla de patatas espagnole'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 58. Patatas bravas et leur sauce épicée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '58. Patatas bravas et leur sauce épicée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Épicé', 'Texture-Crémeux', 'Intensité-Intense')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 60. Pimientos de Padrón grillés
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '60. Pimientos de Padrón grillés'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 4 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 4 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 62. Falafels de pois chiches, sauce tahini
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '62. Falafels de pois chiches, sauce tahini'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 63. Samoussas aux légumes et épices
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '63. Samoussas aux légumes et épices'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 64. Nems au porc et leur sauce
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '64. Nems au porc et leur sauce'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 67. Beignets de calamars à la romaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '67. Beignets de calamars à la romaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 68. Arancini siciliens (boules de risotto frites)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '68. Arancini siciliens (boules de risotto frites)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 69. Focaccia au romarin et à la fleur de sel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '69. Focaccia au romarin et à la fleur de sel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Saveur-Herbacé', 'Saveur-Floral', 'Arôme-Floral')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 70. Gressins italiens maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '70. Gressins italiens maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 71. Légumes grillés marinés à l''italienne (antipasti)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '71. Légumes grillés marinés à l''''italienne (antipasti)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 72. Artichauts à la romaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '72. Artichauts à la romaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 73. Poivrons marinés à l''huile d''olive et à l''ail
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '73. Poivrons marinés à l''''huile d''''olive et à l''''ail'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 74. Aubergines à la parmesane (Melanzane alla parmigiana)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '74. Aubergines à la parmesane (Melanzane alla parmigiana)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 75. Velouté de potimarron et châtaignes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '75. Velouté de potimarron et châtaignes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Texture-Liquide', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 76. Soupe à l''oignon gratinée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '76. Soupe à l''''oignon gratinée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 77. Crème de lentilles corail au lait de coco
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '77. Crème de lentilles corail au lait de coco'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Végétarien', 'Texture-Crémeux', 'Arôme-Lacté', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 78. Soupe de poireaux-pommes de terre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '78. Soupe de poireaux-pommes de terre'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 79. Velouté Dubarry (chou-fleur)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '79. Velouté Dubarry (chou-fleur)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Floral', 'Texture-Crémeux', 'Texture-Liquide', 'Arôme-Floral', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 80. Minestrone de légumes italiens
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '80. Minestrone de légumes italiens'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 5 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 5 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 81. Soupe de poisson et sa rouille
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '81. Soupe de poisson et sa rouille'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Liquide', 'Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 82. Bouillon thaï aux crevettes (Tom Yum)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '82. Bouillon thaï aux crevettes (Tom Yum)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 83. Soupe Phở au bœuf vietnamienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '83. Soupe Phở au bœuf vietnamienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 84. Soupe miso japonaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '84. Soupe miso japonaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Végétarien', 'Saveur-Umami', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 85. Harira marocaine (soupe de rupture du jeûne)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '85. Harira marocaine (soupe de rupture du jeûne)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 86. Chorba algérienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '86. Chorba algérienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 87. Œufs cocotte à la crème et aux lardons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '87. Œufs cocotte à la crème et aux lardons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 88. Feuilletés saucisse à la moutarde
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '88. Feuilletés saucisse à la moutarde'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 89. Mini-brochettes de poulet mariné au satay
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '89. Mini-brochettes de poulet mariné au satay'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 90. Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '90. Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 91. Roulés de courgette au fromage frais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '91. Roulés de courgette au fromage frais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche', 'Arôme-Lacté', 'Été', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 92. Blinis au saumon fumé et crème à l''aneth
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '92. Blinis au saumon fumé et crème à l''''aneth'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux', 'Arôme-Lacté', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 93. Champignons farcis à l''ail et au persil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '93. Champignons farcis à l''''ail et au persil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Umami', 'Saveur-Herbacé', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 94. Tomates provençales au four
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '94. Tomates provençales au four'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Saveur-Acide', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 95. Tarte soleil au pesto et parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '95. Tarte soleil au pesto et parmesan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 96. Gougères au fromage
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '96. Gougères au fromage'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 97. Cake salé aux olives et au jambon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '97. Cake salé aux olives et au jambon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 98. Muffins salés au chorizo et poivron
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '98. Muffins salés au chorizo et poivron'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien', 'Saveur-Salé', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 99. Madeleines salées au chèvre et romarin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '99. Madeleines salées au chèvre et romarin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Saveur-Herbacé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 100. Quiche Lorraine traditionnelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '100. Quiche Lorraine traditionnelle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 6 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 6 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 101. Tarte aux poireaux et lardons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '101. Tarte aux poireaux et lardons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 102. Tarte à la tomate et à la moutarde
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '102. Tarte à la tomate et à la moutarde'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 103. Tarte fine aux légumes du soleil et chèvre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '103. Tarte fine aux légumes du soleil et chèvre'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 104. Quiche sans pâte aux épinards et ricotta
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '104. Quiche sans pâte aux épinards et ricotta'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 105. Flammenkueche alsacienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '105. Flammenkueche alsacienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 106. Pizza Margherita
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '106. Pizza Margherita'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 107. Pizza Reine (jambon, champignons)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '107. Pizza Reine (jambon, champignons)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Saveur-Umami', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 108. Pizza 4 fromages
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '108. Pizza 4 fromages'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 109. Calzone (pizza soufflée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '109. Calzone (pizza soufflée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 110. Poulet rôti du dimanche aux herbes de Provence
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '110. Poulet rôti du dimanche aux herbes de Provence'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Herbacé', 'Intensité-Moyen', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 112. Poulet à la crème et aux champignons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '112. Poulet à la crème et aux champignons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Umami', 'Texture-Crémeux', 'Arôme-Terreux', 'Arôme-Lacté', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 113. Poulet vallée d''Auge (au cidre et à la crème)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '113. Poulet vallée d''''Auge (au cidre et à la crème)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 114. Coq au vin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '114. Coq au vin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 117. Escalopes de poulet panées au citron
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '117. Escalopes de poulet panées au citron'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Acide', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 119. Piccata de veau au citron
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '119. Piccata de veau au citron'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Acide', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 120. Blanquette de veau à l''ancienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '120. Blanquette de veau à l''''ancienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 7 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 7 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 121. Osso buco à la milanaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '121. Osso buco à la milanaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 122. Rôti de veau Orloff
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '122. Rôti de veau Orloff'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 123. Sauté de veau Marengo
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '123. Sauté de veau Marengo'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 124. Paupiettes de veau en sauce
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '124. Paupiettes de veau en sauce'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 125. Bœuf bourguignon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '125. Bœuf bourguignon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 126. Daube de bœuf provençale
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '126. Daube de bœuf provençale'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 127. Carbonnade flamande
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '127. Carbonnade flamande'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 128. Pot-au-feu et ses légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '128. Pot-au-feu et ses légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 129. Hachis Parmentier
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '129. Hachis Parmentier'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 130. Steak frites, sauce au poivre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '130. Steak frites, sauce au poivre'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Épicé', 'Texture-Crémeux', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 131. Entrecôte grillée, sauce béarnaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '131. Entrecôte grillée, sauce béarnaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 133. Carpaccio de bœuf, parmesan et roquette
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '133. Carpaccio de bœuf, parmesan et roquette'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Saveur-Umami')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 136. Chili con carne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '136. Chili con carne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 137. Boulettes de bœuf à la sauce tomate
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '137. Boulettes de bœuf à la sauce tomate'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Acide', 'Texture-Crémeux', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 138. Kefta de bœuf à la marocaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '138. Kefta de bœuf à la marocaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 140. Bœuf sauté aux oignons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '140. Bœuf sauté aux oignons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 8 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 8 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 141. Bœuf sauté au gingembre et à la ciboulette
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '141. Bœuf sauté au gingembre et à la ciboulette'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Asiatique', 'Saveur-Épicé', 'Intensité-Moyen', 'Arôme-Épicé Chaud')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 143. Bulgogi (barbecue coréen)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '143. Bulgogi (barbecue coréen)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 144. Gyudon japonais (bol de riz au bœuf)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '144. Gyudon japonais (bol de riz au bœuf)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 145. Rôti de porc à la moutarde
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '145. Rôti de porc à la moutarde'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 147. Sauté de porc au caramel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '147. Sauté de porc au caramel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Sucré', 'Intensité-Moyen', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 151. Travers de porc (ribs) sauce barbecue
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '151. Travers de porc (ribs) sauce barbecue'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Texture-Crémeux', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 153. Porc Tonkatsu japonais (escalope panée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '153. Porc Tonkatsu japonais (escalope panée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 157. Souris d''agneau confites au miel et au thym
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '157. Souris d''''agneau confites au miel et au thym'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Saveur-Sucré', 'Saveur-Herbacé', 'Intensité-Riche', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 158. Curry d''agneau à l''indienne (Rogan Josh)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '158. Curry d''''agneau à l''''indienne (Rogan Josh)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 159. Moussaka grecque
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '159. Moussaka grecque'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 160. Tajine d''agneau aux pruneaux et amandes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '160. Tajine d''''agneau aux pruneaux et amandes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 9 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 9 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 161. Brochettes d''agneau marinées au citron et origan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '161. Brochettes d''''agneau marinées au citron et origan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Acide', 'Arôme-Agrumes', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 162. Côtelettes d''agneau grillées à l''ail
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '162. Côtelettes d''''agneau grillées à l''''ail'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 165. Magret de canard, sauce au poivre vert
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '165. Magret de canard, sauce au poivre vert'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Épicé', 'Texture-Crémeux', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 166. Confit de canard et pommes de terre sarladaises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '166. Confit de canard et pommes de terre sarladaises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Intensité-Riche', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 167. Canard laqué pékinois (version simplifiée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '167. Canard laqué pékinois (version simplifiée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Chinoise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 169. Lapin à la moutarde
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '169. Lapin à la moutarde'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 170. Lapin chasseur
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '170. Lapin chasseur'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 171. Cassoulet de Toulouse
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '171. Cassoulet de Toulouse'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 172. Choucroute garnie alsacienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '172. Choucroute garnie alsacienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 173. Petit salé aux lentilles
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '173. Petit salé aux lentilles'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 174. Andouillette de Troyes, sauce moutarde
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '174. Andouillette de Troyes, sauce moutarde'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 175. Boudin noir aux pommes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '175. Boudin noir aux pommes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 176. Saucisson de Lyon pistaché en brioche
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '176. Saucisson de Lyon pistaché en brioche'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 177. Far breton (version salée aux pruneaux et lard)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '177. Far breton (version salée aux pruneaux et lard)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 178. Crêpes salées complètes (jambon, œuf, fromage)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '178. Crêpes salées complètes (jambon, œuf, fromage)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Salé', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 179. Galettes de sarrasin bretonnes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '179. Galettes de sarrasin bretonnes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 180. Moules marinières
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '180. Moules marinières'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 10 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 10 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 181. Moules à la crème et aux frites
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '181. Moules à la crème et aux frites'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Intensité-Riche', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 182. Moules au curry
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '182. Moules au curry'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 183. Moules à la provençale
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '183. Moules à la provençale'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 184. Paella valenciana
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '184. Paella valenciana'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 185. Paella aux fruits de mer
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '185. Paella aux fruits de mer'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Saveur-Sucré', 'Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 186. Zarzuela de mariscos (cassolette de poissons espagnole)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '186. Zarzuela de mariscos (cassolette de poissons espagnole)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 188. Fideuà (paella de vermicelles)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '188. Fideuà (paella de vermicelles)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 189. Lotte à l''américaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '189. Lotte à l''''américaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 190. Bouillabaisse marseillaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '190. Bouillabaisse marseillaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 191. Bourride sétoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '191. Bourride sétoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 193. Aïoli provençal et ses légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '193. Aïoli provençal et ses légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 196. Saumon teriyaki
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '196. Saumon teriyaki'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 197. Saumon à la plancha, sauce vierge
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '197. Saumon à la plancha, sauce vierge'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 198. Lasagnes au saumon et épinards
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '198. Lasagnes au saumon et épinards'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 199. Tartare de saumon à l''aneth et au citron vert
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '199. Tartare de saumon à l''''aneth et au citron vert'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Acide', 'Arôme-Agrumes', 'Arôme-Végétal', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 11 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 11 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 201. Brochettes de saumon marinées
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '201. Brochettes de saumon marinées'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 202. Quiche au saumon et poireaux
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '202. Quiche au saumon et poireaux'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 203. Dos de cabillaud en croûte de chorizo
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '203. Dos de cabillaud en croûte de chorizo'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 206. Fish and chips britannique
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '206. Fish and chips britannique'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Croquant')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 207. Waterzooi de poisson
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '207. Waterzooi de poisson'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 208. Curry de poisson au lait de coco
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '208. Curry de poisson au lait de coco'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Indienne', 'Saveur-Épicé', 'Arôme-Marin', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 210. Steak de thon à la sicilienne (olives, câpres)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '210. Steak de thon à la sicilienne (olives, câpres)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 211. Bar en croûte de sel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '211. Bar en croûte de sel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 212. Dorade royale au four et fenouil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '212. Dorade royale au four et fenouil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 213. Filet de sole meunière
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '213. Filet de sole meunière'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 214. Raie au beurre noir et aux câpres
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '214. Raie au beurre noir et aux câpres'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Intensité-Riche', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 215. Maquereaux marinés au vin blanc
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '215. Maquereaux marinés au vin blanc'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 216. Sardines grillées au barbecue
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '216. Sardines grillées au barbecue'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 217. Coquilles Saint-Jacques poêlées, fondue de poireaux
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '217. Coquilles Saint-Jacques poêlées, fondue de poireaux'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Healthy', 'Automne', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 218. Noix de Saint-Jacques snackées, purée de carottes au cumin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '218. Noix de Saint-Jacques snackées, purée de carottes au cumin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Healthy')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 219. Risotto aux Saint-Jacques et asperges
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '219. Risotto aux Saint-Jacques et asperges'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Healthy', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 220. Crevettes sautées à l''ail et au persil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '220. Crevettes sautées à l''''ail et au persil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Herbacé', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 12 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 12 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 221. Curry de crevettes et lait de coco
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '221. Curry de crevettes et lait de coco'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Indienne', 'Saveur-Épicé', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 222. Pâtes aux crevettes, ail, huile et piment
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '222. Pâtes aux crevettes, ail, huile et piment'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 224. Wok de crevettes aux légumes croquants
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '224. Wok de crevettes aux légumes croquants'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Asiatique', 'Texture-Croquant', 'Texture-Ferme')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 225. Pad Thaï aux crevettes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '225. Pad Thaï aux crevettes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 226. Brochettes de gambas à la plancha
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '226. Brochettes de gambas à la plancha'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 227. Calamars à la romaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '227. Calamars à la romaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 228. Encornets farcis à la sétoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '228. Encornets farcis à la sétoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 229. Seiches à la plancha en persillade
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '229. Seiches à la plancha en persillade'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 230. Poulpe à la galicienne (Pulpo a la gallega)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '230. Poulpe à la galicienne (Pulpo a la gallega)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 231. Soupe de lentilles corail, carotte et cumin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '231. Soupe de lentilles corail, carotte et cumin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 232. Dahl de lentilles indien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '232. Dahl de lentilles indien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 233. Salade de lentilles, carottes et oignons rouges
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '233. Salade de lentilles, carottes et oignons rouges'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 234. Bolognaise de lentilles vertes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '234. Bolognaise de lentilles vertes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Végétal', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 235. Curry de pois chiches et épinards
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '235. Curry de pois chiches et épinards'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 236. Pois chiches rôtis aux épices
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '236. Pois chiches rôtis aux épices'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 237. Salade de pois chiches à la méditerranéenne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '237. Salade de pois chiches à la méditerranéenne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 238. Chili sin carne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '238. Chili sin carne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 239. Haricots blancs à la bretonne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '239. Haricots blancs à la bretonne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 240. Fèves à la catalane
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '240. Fèves à la catalane'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 13 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 13 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 241. Socca niçoise (galette de farine de pois chiches)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '241. Socca niçoise (galette de farine de pois chiches)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 242. Panisses marseillaises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '242. Panisses marseillaises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 243. Lasagnes végétariennes aux légumes du soleil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '243. Lasagnes végétariennes aux légumes du soleil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 244. Lasagnes aux épinards et à la ricotta
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '244. Lasagnes aux épinards et à la ricotta'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 245. Risotto aux champignons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '245. Risotto aux champignons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 246. Risotto aux asperges et parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '246. Risotto aux asperges et parmesan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 247. Risotto à la milanaise (au safran)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '247. Risotto à la milanaise (au safran)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 248. Risotto aux courgettes et menthe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '248. Risotto aux courgettes et menthe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 249. Risotto à la tomate et mozzarella
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '249. Risotto à la tomate et mozzarella'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 250. Pâtes à la sauce tomate et basilic frais (al pomodoro)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '250. Pâtes à la sauce tomate et basilic frais (al pomodoro)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Texture-Crémeux', 'Arôme-Épicé Frais', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 251. Pâtes all''arrabbiata
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '251. Pâtes all''''arrabbiata'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 252. Pâtes alla puttanesca
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '252. Pâtes alla puttanesca'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 253. Pâtes à la carbonara (la vraie, sans crème)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '253. Pâtes à la carbonara (la vraie, sans crème)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 254. Pâtes cacio e pepe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '254. Pâtes cacio e pepe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 255. Pâtes à l''amatriciana
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '255. Pâtes à l''''amatriciana'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 256. Pâtes au pesto alla genovese
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '256. Pâtes au pesto alla genovese'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 257. Pâtes aux palourdes (alle vongole)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '257. Pâtes aux palourdes (alle vongole)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 258. Pâtes aux fruits de mer (allo scoglio)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '258. Pâtes aux fruits de mer (allo scoglio)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Saveur-Sucré', 'Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 259. Pâtes alla norma (aubergines, ricotta salata)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '259. Pâtes alla norma (aubergines, ricotta salata)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 260. Gnocchis de pommes de terre, sauce sauge et beurre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '260. Gnocchis de pommes de terre, sauce sauge et beurre'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Texture-Crémeux', 'Intensité-Riche', 'Arôme-Fruité', 'Arôme-Lacté', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 14 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 14 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 261. Gnocchis à la sorrentina (sauce tomate, mozzarella)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '261. Gnocchis à la sorrentina (sauce tomate, mozzarella)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Texture-Crémeux', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 262. Raviolis aux épinards et ricotta, sauce tomate
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '262. Raviolis aux épinards et ricotta, sauce tomate'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Texture-Crémeux', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 263. Cannellonis farcis à la bolognaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '263. Cannellonis farcis à la bolognaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 264. Spaghettis aux boulettes de viande (style italo-américain)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '264. Spaghettis aux boulettes de viande (style italo-américain)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 265. Macaroni and cheese américain (gratin de macaronis)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '265. Macaroni and cheese américain (gratin de macaronis)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 266. Gratin de pâtes au jambon et béchamel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '266. Gratin de pâtes au jambon et béchamel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 267. One pot pasta tomate, basilic, mozzarella
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '267. One pot pasta tomate, basilic, mozzarella'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 268. Pâtes au citron et à la crème
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '268. Pâtes au citron et à la crème'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Texture-Crémeux', 'Arôme-Agrumes', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 269. Salade de pâtes estivale
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '269. Salade de pâtes estivale'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 270. Pâtes fraîches maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '270. Pâtes fraîches maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 271. Tofu sauté aux légumes et sauce soja
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '271. Tofu sauté aux légumes et sauce soja'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Asiatique', 'Végétarien', 'Saveur-Umami', 'Texture-Crémeux', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 272. Tofu mariné et grillé au sésame
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '272. Tofu mariné et grillé au sésame'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 273. Tofu général Tao
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '273. Tofu général Tao'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 274. Tofu Mapo (recette sichuanaise)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '274. Tofu Mapo (recette sichuanaise)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 275. Curry de tofu et légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '275. Curry de tofu et légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 276. Tofu brouillé (alternative aux œufs)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '276. Tofu brouillé (alternative aux œufs)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 277. Tofu Katsu (pané et frit)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '277. Tofu Katsu (pané et frit)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 278. Seitan bourguignon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '278. Seitan bourguignon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 279. Sauté de seitan et brocolis
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '279. Sauté de seitan et brocolis'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 280. Burger de seitan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '280. Burger de seitan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 15 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 15 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 281. Tempeh laqué à l''indonésienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '281. Tempeh laqué à l''''indonésienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 282. Buddha bowl au quinoa, patates douces et avocat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '282. Buddha bowl au quinoa, patates douces et avocat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 283. Salade de quinoa, concombre, feta et menthe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '283. Salade de quinoa, concombre, feta et menthe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 284. Quinoa façon taboulé
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '284. Quinoa façon taboulé'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 285. Galettes de quinoa et carottes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '285. Galettes de quinoa et carottes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 286. Gratin de quinoa aux légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '286. Gratin de quinoa aux légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 287. Gratin dauphinois traditionnel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '287. Gratin dauphinois traditionnel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 288. Gratin de courgettes à la menthe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '288. Gratin de courgettes à la menthe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 289. Gratin de chou-fleur à la béchamel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '289. Gratin de chou-fleur à la béchamel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Floral', 'Arôme-Floral', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 290. Gratin de brocolis au parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '290. Gratin de brocolis au parmesan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 291. Tian de légumes provençal
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '291. Tian de légumes provençal'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 292. Ratatouille niçoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '292. Ratatouille niçoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 293. Piperade basque
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '293. Piperade basque'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 294. Poêlée de légumes du soleil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '294. Poêlée de légumes du soleil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 295. Poêlée de champignons en persillade
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '295. Poêlée de champignons en persillade'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Umami', 'Saveur-Herbacé', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 296. Wok de légumes sauce aigre-douce
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '296. Wok de légumes sauce aigre-douce'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Asiatique', 'Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 297. Légumes rôtis au four (carottes, panais, patates douces)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '297. Légumes rôtis au four (carottes, panais, patates douces)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 298. Frites de patates douces au paprika
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '298. Frites de patates douces au paprika'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 299. Purée de pommes de terre maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '299. Purée de pommes de terre maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 300. Purée de carottes au cumin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '300. Purée de carottes au cumin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 16 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 16 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 301. Purée de panais à la noisette
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '301. Purée de panais à la noisette'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 302. Purée de céleri-rave
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '302. Purée de céleri-rave'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 303. Écrasé de pommes de terre à l''huile d''olive et ail
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '303. Écrasé de pommes de terre à l''''huile d''''olive et ail'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 304. Pommes de terre suédoises (Hasselback)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '304. Pommes de terre suédoises (Hasselback)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 305. Pommes dauphine maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '305. Pommes dauphine maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 306. Aligot de l''Aubrac
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '306. Aligot de l''''Aubrac'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 307. Truffade auvergnate
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '307. Truffade auvergnate'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 308. Poêlée de haricots verts à l''ail et persil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '308. Poêlée de haricots verts à l''''ail et persil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 309. Frites de polenta au parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '309. Frites de polenta au parmesan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Intensité-Riche', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 310. Polenta crémeuse
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '310. Polenta crémeuse'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 311. Endives braisées au jambon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '311. Endives braisées au jambon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Amer', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 312. Asperges vertes rôties au parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '312. Asperges vertes rôties au parmesan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Intensité-Moyen', 'Arôme-Végétal', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 313. Fondue de poireaux à la crème
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '313. Fondue de poireaux à la crème'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Fruité', 'Arôme-Lacté', 'Automne', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 314. Épinards frais à la crème
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '314. Épinards frais à la crème'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 315. Choux de Bruxelles rôtis au lard et sirop d''érable
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '315. Choux de Bruxelles rôtis au lard et sirop d''''érable'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Sucré', 'Intensité-Moyen', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 316. Carottes glacées à l''orange
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '316. Carottes glacées à l''''orange'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 317. Betteraves rôties au miel et au thym
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '317. Betteraves rôties au miel et au thym'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Saveur-Herbacé', 'Intensité-Moyen', 'Arôme-Terreux', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 318. Fenouil braisé à l''anis
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '318. Fenouil braisé à l''''anis'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 319. Riz pilaf aux amandes et raisins secs
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '319. Riz pilaf aux amandes et raisins secs'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 320. Semoule aux légumes (accompagnement tajine)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '320. Semoule aux légumes (accompagnement tajine)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 17 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 17 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 321. Curry de légumes thaïlandais au lait de coco
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '321. Curry de légumes thaïlandais au lait de coco'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Indienne', 'Végétarien', 'Saveur-Épicé', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 322. Palak Paneer (épinards au fromage indien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '322. Palak Paneer (épinards au fromage indien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 323. Aloo Gobi (curry de chou-fleur et pommes de terre)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '323. Aloo Gobi (curry de chou-fleur et pommes de terre)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Saveur-Épicé', 'Saveur-Floral', 'Arôme-Fruité', 'Arôme-Floral', 'Automne', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 324. Chana Masala (curry de pois chiches épicé)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '324. Chana Masala (curry de pois chiches épicé)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Saveur-Épicé', 'Intensité-Intense')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 325. Baingan Bharta (caviar d''aubergine indien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '325. Baingan Bharta (caviar d''''aubergine indien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Luxe', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 326. Samosas aux légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '326. Samosas aux légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 327. Pakoras d''oignons (beignets indiens)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '327. Pakoras d''''oignons (beignets indiens)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 328. Caponata sicilienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '328. Caponata sicilienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 329. Pâtes aux brocolis et anchois
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '329. Pâtes aux brocolis et anchois'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 330. Risotto de petit épeautre aux champignons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '330. Risotto de petit épeautre aux champignons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 331. Galettes de sarrasin aux champignons et crème
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '331. Galettes de sarrasin aux champignons et crème'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Umami', 'Texture-Crémeux', 'Arôme-Terreux', 'Arôme-Lacté', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 332. Crozets en gratin au beaufort (croziflette)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '332. Crozets en gratin au beaufort (croziflette)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Intense')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 333. Tarte au maroilles
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '333. Tarte au maroilles'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 334. Pissaladière niçoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '334. Pissaladière niçoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 335. Tourte aux blettes sucrée-salée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '335. Tourte aux blettes sucrée-salée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Saveur-Sucré')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 336. Gözleme turc aux épinards et feta
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '336. Gözleme turc aux épinards et feta'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 337. Börek aux épinards
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '337. Börek aux épinards'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 338. Fattoush (salade libanaise au pain pita grillé)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '338. Fattoush (salade libanaise au pain pita grillé)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 339. Koshari égyptien (riz, lentilles, pâtes, sauce tomate)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '339. Koshari égyptien (riz, lentilles, pâtes, sauce tomate)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Texture-Crémeux', 'Long', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 340. Mjadra (riz aux lentilles et oignons frits)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '340. Mjadra (riz aux lentilles et oignons frits)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 18 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 18 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 341. Salade Waldorf (céleri, pomme, noix)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '341. Salade Waldorf (céleri, pomme, noix)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 342. Coleslaw américain
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '342. Coleslaw américain'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 343. Salade de pommes de terre allemande (Kartoffelsalat)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '343. Salade de pommes de terre allemande (Kartoffelsalat)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 344. Salade de concombre à la danoise (Agurkesalat)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '344. Salade de concombre à la danoise (Agurkesalat)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 345. Salade de betteraves crues, pomme verte et noisettes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '345. Salade de betteraves crues, pomme verte et noisettes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Arôme-Végétal', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 346. Salade de fenouil à l''orange et aux olives noires
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '346. Salade de fenouil à l''''orange et aux olives noires'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 347. Salade de carottes râpées au citron et cumin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '347. Salade de carottes râpées au citron et cumin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 348. Salade de chou rouge aux pommes et aux noix
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '348. Salade de chou rouge aux pommes et aux noix'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 349. Salade de pâtes grecque (feta, olives, concombre)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '349. Salade de pâtes grecque (feta, olives, concombre)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 350. Salade de lentilles corail, carottes et coco
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '350. Salade de lentilles corail, carottes et coco'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 351. Taboulé de chou-fleur
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '351. Taboulé de chou-fleur'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Saveur-Floral', 'Arôme-Floral', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 352. Salade d''endives, noix et roquefort
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '352. Salade d''''endives, noix et roquefort'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Amer', 'Intensité-Intense', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 353. Salade lyonnaise (lardons, croûtons, œuf poché)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '353. Salade lyonnaise (lardons, croûtons, œuf poché)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Intensité-Léger')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 354. Salade landaise (gésiers, magret fumé)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '354. Salade landaise (gésiers, magret fumé)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 355. Salade de haricots verts, tomates et oignons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '355. Salade de haricots verts, tomates et oignons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Arôme-Végétal', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 356. Ajo Blanco (soupe froide d''amandes espagnole)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '356. Ajo Blanco (soupe froide d''''amandes espagnole)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 357. Vichyssoise (soupe froide poireaux-pommes de terre)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '357. Vichyssoise (soupe froide poireaux-pommes de terre)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 358. Soupe froide de melon à la menthe et au porto
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '358. Soupe froide de melon à la menthe et au porto'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Texture-Liquide', 'Arôme-Épicé Frais', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 359. Okroshka (soupe froide russe au kvas)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '359. Okroshka (soupe froide russe au kvas)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 360. Salade de poulpe et pommes de terre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '360. Salade de poulpe et pommes de terre'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 19 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 19 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 361. Burger de bœuf classique, cheddar et bacon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '361. Burger de bœuf classique, cheddar et bacon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 362. Burger de poulet croustillant
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '362. Burger de poulet croustillant'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Texture-Croquant')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 363. Burger végétarien aux haricots noirs
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '363. Burger végétarien aux haricots noirs'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 364. Hot-dog new-yorkais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '364. Hot-dog new-yorkais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 365. Sandwich Club au poulet et bacon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '365. Sandwich Club au poulet et bacon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Pique-nique')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 366. Sandwich Reuben (pastrami, choucroute)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '366. Sandwich Reuben (pastrami, choucroute)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Hiver', 'Pique-nique')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 367. Pan Bagnat niçois
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '367. Pan Bagnat niçois'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 368. Croque-Monsieur
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '368. Croque-Monsieur'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 369. Croque-Madame
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '369. Croque-Madame'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 370. Welsh rarebit
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '370. Welsh rarebit'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 371. Kebab maison (pain pita, viande grillée, sauce blanche)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '371. Kebab maison (pain pita, viande grillée, sauce blanche)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 373. Wrap au poulet César
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '373. Wrap au poulet César'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Pique-nique')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 374. Wrap au houmous, falafels et crudités
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '374. Wrap au houmous, falafels et crudités'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Pique-nique')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 376. Focaccia garnie (jambon de parme, roquette, mozzarella)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '376. Focaccia garnie (jambon de parme, roquette, mozzarella)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 377. Arepas vénézuéliennes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '377. Arepas vénézuéliennes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 379. Tacos al pastor mexicains
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '379. Tacos al pastor mexicains'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Mexicaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 380. Quesadillas au fromage et poulet
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '380. Quesadillas au fromage et poulet'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Mexicaine', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 20 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 20 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 381. Ramen japonais au porc chashu
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '381. Ramen japonais au porc chashu'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 382. Udon sauté au bœuf
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '382. Udon sauté au bœuf'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 383. Soba froides et leur sauce tsuyu
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '383. Soba froides et leur sauce tsuyu'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 384. Yaki Soba (nouilles sautées japonaises)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '384. Yaki Soba (nouilles sautées japonaises)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Végétarien', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 385. Riz cantonais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '385. Riz cantonais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Chinoise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 386. Nasi Goreng indonésien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '386. Nasi Goreng indonésien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 387. Riz sauté thaï à l''ananas et aux crevettes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '387. Riz sauté thaï à l''''ananas et aux crevettes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 388. Dan Dan noodles sichuanaises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '388. Dan Dan noodles sichuanaises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 389. Nouilles sautées au poulet et légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '389. Nouilles sautées au poulet et légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 390. Japchae (nouilles de patate douce coréennes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '390. Japchae (nouilles de patate douce coréennes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 391. Soupe de nouilles wonton
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '391. Soupe de nouilles wonton'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 392. Laksa de Singapour (soupe de nouilles épicée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '392. Laksa de Singapour (soupe de nouilles épicée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Épicé', 'Texture-Liquide', 'Intensité-Intense')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 393. Poulet katsu curry japonais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '393. Poulet katsu curry japonais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Indienne', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 395. Katsudon (bol de riz au porc pané)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '395. Katsudon (bol de riz au porc pané)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 396. Onigiri japonais (boules de riz farcies)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '396. Onigiri japonais (boules de riz farcies)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 397. Congee de riz (porridge de riz salé)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '397. Congee de riz (porridge de riz salé)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 398. Riz gluant à la mangue thaïlandais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '398. Riz gluant à la mangue thaïlandais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 399. Kimchi Jjigae (ragoût de kimchi coréen)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '399. Kimchi Jjigae (ragoût de kimchi coréen)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 400. Tteokbokki (gâteaux de riz épicés coréens)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '400. Tteokbokki (gâteaux de riz épicés coréens)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Épicé', 'Intensité-Intense')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 21 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 21 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 401. Crème brûlée à la vanille
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '401. Crème brûlée à la vanille'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 402. Mousse au chocolat noir
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '402. Mousse au chocolat noir'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 403. Île flottante et sa crème anglaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '403. Île flottante et sa crème anglaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 404. Profiteroles au chocolat chaud
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '404. Profiteroles au chocolat chaud'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 405. Tarte Tatin aux pommes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '405. Tarte Tatin aux pommes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 406. Tarte au citron meringuée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '406. Tarte au citron meringuée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 407. Tarte Bourdaloue (poires et amandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '407. Tarte Bourdaloue (poires et amandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 408. Clafoutis aux cerises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '408. Clafoutis aux cerises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 409. Far breton aux pruneaux
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '409. Far breton aux pruneaux'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 410. Canelés de Bordeaux
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '410. Canelés de Bordeaux'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 411. Macarons parisiens (pistache, chocolat, framboise)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '411. Macarons parisiens (pistache, chocolat, framboise)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 412. Paris-Brest (pâte à choux, crème pralinée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '412. Paris-Brest (pâte à choux, crème pralinée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 413. Éclair au café ou au chocolat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '413. Éclair au café ou au chocolat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Amer')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 414. Religieuse au chocolat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '414. Religieuse au chocolat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 415. Saint-Honoré
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '415. Saint-Honoré'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Healthy')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 416. Fraisier
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '416. Fraisier'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 417. Opéra
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '417. Opéra'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 418. Mille-feuille
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '418. Mille-feuille'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 419. Soufflé au Grand Marnier
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '419. Soufflé au Grand Marnier'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 420. Riz au lait à la vanille
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '420. Riz au lait à la vanille'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 22 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 22 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 421. Tiramisu classique au café
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '421. Tiramisu classique au café'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Amer')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 422. Panna Cotta et son coulis de fruits rouges
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '422. Panna Cotta et son coulis de fruits rouges'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Fruité')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 423. Tiramisu aux fraises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '423. Tiramisu aux fraises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Arôme-Fruité', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 424. Panna Cotta au caramel beurre salé
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '424. Panna Cotta au caramel beurre salé'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Saveur-Sucré', 'Intensité-Riche', 'Arôme-Lacté', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 425. Zabaione au Marsala
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '425. Zabaione au Marsala'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 426. Cannoli siciliens à la ricotta
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '426. Cannoli siciliens à la ricotta'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 427. Torta della nonna (tarte à la crème pâtissière et pignons)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '427. Torta della nonna (tarte à la crème pâtissière et pignons)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 428. Torta caprese (gâteau au chocolat et amandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '428. Torta caprese (gâteau au chocolat et amandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 429. Semifreddo au nougat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '429. Semifreddo au nougat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 430. Gelato à la pistache maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '430. Gelato à la pistache maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 431. Affogato (glace vanille noyée dans un expresso)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '431. Affogato (glace vanille noyée dans un expresso)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Rapide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 432. Panettone (version maison)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '432. Panettone (version maison)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 433. Cantucci (croquants aux amandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '433. Cantucci (croquants aux amandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Croquant', 'Texture-Ferme')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 434. Bonet piémontais (flan au chocolat et amaretti)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '434. Bonet piémontais (flan au chocolat et amaretti)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 435. Pêches au vin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '435. Pêches au vin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 436. Sbrisolona (gâteau friable aux amandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '436. Sbrisolona (gâteau friable aux amandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 437. Crostata à la confiture d''abricots
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '437. Crostata à la confiture d''''abricots'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Saveur-Sucré', 'Intensité-Riche', 'Arôme-Fruité', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 438. Salame al cioccolato (saucisson au chocolat)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '438. Salame al cioccolato (saucisson au chocolat)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 439. Sfogliatelle napolitaines
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '439. Sfogliatelle napolitaines'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 440. Pastiera napolitaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '440. Pastiera napolitaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 23 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 23 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 441. Cheesecake new-yorkais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '441. Cheesecake new-yorkais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 442. Brownie au chocolat et noix de pécan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '442. Brownie au chocolat et noix de pécan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 443. Cookies aux pépites de chocolat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '443. Cookies aux pépites de chocolat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 444. Apple pie américaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '444. Apple pie américaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 445. Pumpkin pie (tarte à la citrouille)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '445. Pumpkin pie (tarte à la citrouille)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 446. Pecan pie (tarte aux noix de pécan)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '446. Pecan pie (tarte aux noix de pécan)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 447. Carrot cake et son glaçage au cream cheese
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '447. Carrot cake et son glaçage au cream cheese'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 448. Red velvet cake
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '448. Red velvet cake'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 449. Muffins aux myrtilles
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '449. Muffins aux myrtilles'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 450. Cupcakes à la vanille et glaçage
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '450. Cupcakes à la vanille et glaçage'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 451. Banana bread
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '451. Banana bread'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 452. Key lime pie (tarte au citron vert)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '452. Key lime pie (tarte au citron vert)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Arôme-Agrumes', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 453. Crumble aux pommes et à la cannelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '453. Crumble aux pommes et à la cannelle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Arôme-Épicé Chaud', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 454. Sticky toffee pudding
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '454. Sticky toffee pudding'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 455. Eton mess (meringue, fraises, crème)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '455. Eton mess (meringue, fraises, crème)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Fruité', 'Arôme-Lacté', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 456. Scones britanniques, clotted cream et confiture
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '456. Scones britanniques, clotted cream et confiture'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Saveur-Sucré', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 457. Trifle anglais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '457. Trifle anglais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 458. Banoffee pie
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '458. Banoffee pie'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 459. Bread and butter pudding
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '459. Bread and butter pudding'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 460. Shortbread écossais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '460. Shortbread écossais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 24 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 24 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 461. Forêt-Noire allemande (Schwarzwälder Kirschtorte)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '461. Forêt-Noire allemande (Schwarzwälder Kirschtorte)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 462. Apfelstrudel autrichien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '462. Apfelstrudel autrichien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 463. Sacher Torte viennoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '463. Sacher Torte viennoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 464. Linzer Torte
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '464. Linzer Torte'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 465. Churros espagnols et leur chocolat chaud
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '465. Churros espagnols et leur chocolat chaud'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 466. Crème catalane
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '466. Crème catalane'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 467. Tarta de Santiago (gâteau aux amandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '467. Tarta de Santiago (gâteau aux amandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 468. Leche frita (lait frit)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '468. Leche frita (lait frit)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 469. Pastel de nata portugais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '469. Pastel de nata portugais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 470. Gâteau basque à la crème ou à la cerise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '470. Gâteau basque à la crème ou à la cerise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 471. Loukoumades grecs (beignets au miel)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '471. Loukoumades grecs (beignets au miel)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 472. Baklava
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '472. Baklava'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 473. Halva
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '473. Halva'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 474. Basboussa (gâteau de semoule)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '474. Basboussa (gâteau de semoule)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 475. Cornes de gazelle marocaines
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '475. Cornes de gazelle marocaines'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 476. Mochi japonais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '476. Mochi japonais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 477. Dorayaki (pancakes japonais fourrés)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '477. Dorayaki (pancakes japonais fourrés)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 478. Gâteau de lune chinois
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '478. Gâteau de lune chinois'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Chinoise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 479. Alfajores argentins
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '479. Alfajores argentins'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 480. Brigadeiros brésiliens
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '480. Brigadeiros brésiliens'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 25 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 25 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 481. Salade de fruits frais de saison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '481. Salade de fruits frais de saison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 482. Carpaccio d''ananas à la menthe et au citron vert
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '482. Carpaccio d''''ananas à la menthe et au citron vert'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Arôme-Agrumes', 'Arôme-Végétal', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 483. Fraises au sucre et jus de citron
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '483. Fraises au sucre et jus de citron'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Texture-Liquide', 'Arôme-Fruité', 'Arôme-Agrumes', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 484. Soupe de fraises à la menthe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '484. Soupe de fraises à la menthe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Texture-Liquide', 'Arôme-Fruité', 'Arôme-Épicé Frais', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 485. Poires Belle-Hélène
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '485. Poires Belle-Hélène'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 486. Pêches Melba
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '486. Pêches Melba'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 487. Pommes au four, miel et cannelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '487. Pommes au four, miel et cannelle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Fruité', 'Arôme-Caramélisé', 'Arôme-Épicé Chaud', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 488. Bananes flambées au rhum
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '488. Bananes flambées au rhum'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 489. Salade d''oranges à la cannelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '489. Salade d''''oranges à la cannelle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Agrumes', 'Arôme-Épicé Chaud')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 490. Gratin de fruits rouges
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '490. Gratin de fruits rouges'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Fruité')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 491. Tarte fine aux pommes sur pâte feuilletée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '491. Tarte fine aux pommes sur pâte feuilletée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Arôme-Végétal', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 492. Compote de pommes maison sans sucre ajouté
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '492. Compote de pommes maison sans sucre ajouté'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 493. Crumble aux fruits rouges et flocons d''avoine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '493. Crumble aux fruits rouges et flocons d''''avoine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Fruité')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 494. Sorbet maison (citron, framboise)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '494. Sorbet maison (citron, framboise)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Arôme-Fruité', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 495. Nice cream (glace à la banane congelée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '495. Nice cream (glace à la banane congelée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 496. Energy balls aux dattes et noix de cajou
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '496. Energy balls aux dattes et noix de cajou'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 497. Barres de céréales maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '497. Barres de céréales maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 498. Yaourt glacé (frozen yogurt) aux fruits
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '498. Yaourt glacé (frozen yogurt) aux fruits'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 499. Mousse d''avocat au cacao
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '499. Mousse d''''avocat au cacao'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Amer')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 500. Pommes en tranches et beurre de cacahuètes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '500. Pommes en tranches et beurre de cacahuètes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche', 'Arôme-Fruité', 'Arôme-Lacté', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 26 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 26 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 501. Baguette tradition française
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '501. Baguette tradition française'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 502. Pain de campagne au levain
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '502. Pain de campagne au levain'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 503. Pain complet maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '503. Pain complet maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 504. Pain aux céréales
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '504. Pain aux céréales'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 505. Pain de seigle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '505. Pain de seigle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 506. Pain de mie maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '506. Pain de mie maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 507. Pains à burger (buns)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '507. Pains à burger (buns)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 508. Pains pita
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '508. Pains pita'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 509. Naans indiens au fromage
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '509. Naans indiens au fromage'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 510. Chapatis
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '510. Chapatis'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 511. Pain à la semoule (khobz)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '511. Pain à la semoule (khobz)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 512. Bretzels alsaciens
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '512. Bretzels alsaciens'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 513. Ciabatta italienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '513. Ciabatta italienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 514. Pain brioché
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '514. Pain brioché'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 515. Croissants au beurre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '515. Croissants au beurre'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche', 'Arôme-Lacté', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 516. Pains au chocolat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '516. Pains au chocolat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 517. Pains aux raisins
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '517. Pains aux raisins'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 518. Brioche tressée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '518. Brioche tressée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 519. Kouglof alsacien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '519. Kouglof alsacien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 520. Chinois (gâteau brioché à la crème)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '520. Chinois (gâteau brioché à la crème)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Chinoise', 'Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 27 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 27 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 521. Baeckeoffe alsacien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '521. Baeckeoffe alsacien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 522. Tripes à la mode de Caen
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '522. Tripes à la mode de Caen'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 523. Potjevleesch flamand
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '523. Potjevleesch flamand'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 525. Daube niçoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '525. Daube niçoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 526. Pieds paquets marseillais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '526. Pieds paquets marseillais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 527. Alouettes sans tête provençales
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '527. Alouettes sans tête provençales'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 528. Fricassée de volaille à l''angevine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '528. Fricassée de volaille à l''''angevine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 529. Poule au pot
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '529. Poule au pot'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 530. Coquilles Saint-Jacques à la bretonne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '530. Coquilles Saint-Jacques à la bretonne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Healthy')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 531. Cotriade bretonne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '531. Cotriade bretonne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 532. Matelote d''anguille
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '532. Matelote d''''anguille'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 533. Lamproie à la bordelaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '533. Lamproie à la bordelaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 534. Ttoro (soupe de poisson basque)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '534. Ttoro (soupe de poisson basque)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Liquide', 'Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 535. Morue à la lyonnaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '535. Morue à la lyonnaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 536. Quenelles de brochet sauce Nantua
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '536. Quenelles de brochet sauce Nantua'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 537. Grenouilles en persillade
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '537. Grenouilles en persillade'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 538. Fricassée d''escargots
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '538. Fricassée d''''escargots'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 539. Caillettes ardéchoises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '539. Caillettes ardéchoises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 540. Diots de Savoie au vin blanc
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '540. Diots de Savoie au vin blanc'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 28 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 28 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 541. Pounti auvergnat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '541. Pounti auvergnat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 542. Farçous aveyronnais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '542. Farçous aveyronnais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 543. Crique ardéchoise (galette de pommes de terre)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '543. Crique ardéchoise (galette de pommes de terre)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 544. Cardons à la moelle lyonnais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '544. Cardons à la moelle lyonnais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 545. Gratin de cardons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '545. Gratin de cardons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 547. Tarte à l''oignon alsacienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '547. Tarte à l''''oignon alsacienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 548. Salsifis à la crème
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '548. Salsifis à la crème'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 549. Poêlée de cèpes à la bordelaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '549. Poêlée de cèpes à la bordelaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 550. Farcis niçois
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '550. Farcis niçois'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 551. Pan bagnat (le vrai)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '551. Pan bagnat (le vrai)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 552. Soupe au pistou
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '552. Soupe au pistou'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 553. Tourton des Alpes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '553. Tourton des Alpes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 554. Oreilles d''âne du Valgaudemar (gratin d''épinards)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '554. Oreilles d''''âne du Valgaudemar (gratin d''''épinards)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 555. Pôchouse de Verdun-sur-le-Doubs (version légumes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '555. Pôchouse de Verdun-sur-le-Doubs (version légumes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 556. Pâté de pommes de terre du Limousin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '556. Pâté de pommes de terre du Limousin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 557. Flaugnarde aux pommes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '557. Flaugnarde aux pommes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 558. Millassou (galette de pomme de terre)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '558. Millassou (galette de pomme de terre)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 559. Escargots de Bourgogne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '559. Escargots de Bourgogne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 560. Lentilles vertes du Berry en salade
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '560. Lentilles vertes du Berry en salade'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Végétal', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 29 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 29 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 561. Ceviche péruvien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '561. Ceviche péruvien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 562. Lomo saltado (sauté de bœuf péruvien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '562. Lomo saltado (sauté de bœuf péruvien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 563. Aji de gallina (poulet en sauce pimentée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '563. Aji de gallina (poulet en sauce pimentée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Épicé', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 564. Feijoada brésilienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '564. Feijoada brésilienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 565. Pão de queijo (pains au fromage brésiliens)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '565. Pão de queijo (pains au fromage brésiliens)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 566. Moqueca de peixe (ragoût de poisson brésilien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '566. Moqueca de peixe (ragoût de poisson brésilien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 568. Picadillo
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '568. Picadillo'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 569. Arroz con pollo
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '569. Arroz con pollo'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 570. Sancocho (soupe colombienne)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '570. Sancocho (soupe colombienne)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 571. Bandeja paisa (plat complet colombien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '571. Bandeja paisa (plat complet colombien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 572. Chiles rellenos (piments farcis mexicains)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '572. Chiles rellenos (piments farcis mexicains)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Mexicaine', 'Végétarien', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 573. Mole poblano
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '573. Mole poblano'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 574. Cochinita pibil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '574. Cochinita pibil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 575. Pozole (soupe mexicaine)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '575. Pozole (soupe mexicaine)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Mexicaine', 'Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 576. Tamales
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '576. Tamales'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 577. Pastel de choclo (gâteau de maïs chilien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '577. Pastel de choclo (gâteau de maïs chilien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 578. Humitas
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '578. Humitas'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 579. Gallo pinto (riz et haricots du Costa Rica)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '579. Gallo pinto (riz et haricots du Costa Rica)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 580. Patacones (bananes plantain frites)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '580. Patacones (bananes plantain frites)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- --- Batch 30 ---
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '--- Batch 30 ---'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 581. Tajine de poulet aux citrons confits et olives
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '581. Tajine de poulet aux citrons confits et olives'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Orientale', 'Saveur-Salé', 'Saveur-Acide', 'Intensité-Riche', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 582. Tajine de kefta aux œufs
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '582. Tajine de kefta aux œufs'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 583. Couscous royal (sept légumes, différentes viandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '583. Couscous royal (sept légumes, différentes viandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 585. Rfissa marocaine (poulet, lentilles, msemen)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '585. Rfissa marocaine (poulet, lentilles, msemen)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 586. Tanjia marrakchia
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '586. Tanjia marrakchia'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 587. Bissara (soupe de fèves)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '587. Bissara (soupe de fèves)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 588. Zaalouk (salade d''aubergines cuite)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '588. Zaalouk (salade d''''aubergines cuite)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 589. Poulet Yassa sénégalais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '589. Poulet Yassa sénégalais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Festif')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 590. Mafé (sauce à base d''arachide)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '590. Mafé (sauce à base d''''arachide)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 591. Thieboudienne (riz au poisson sénégalais)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '591. Thieboudienne (riz au poisson sénégalais)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Marin', 'Festif')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 593. Injera (crêpe éthiopienne au teff)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '593. Injera (crêpe éthiopienne au teff)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 594. Shish Taouk (brochettes de poulet libanaises)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '594. Shish Taouk (brochettes de poulet libanaises)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 595. Shawarma
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '595. Shawarma'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 596. Manakish au zaatar (pizza libanaise)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '596. Manakish au zaatar (pizza libanaise)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 598. Dolmas (feuilles de vigne farcies)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '598. Dolmas (feuilles de vigne farcies)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 599. Shakshuka (version plus élaborée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '599. Shakshuka (version plus élaborée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Difficile')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- 600. Fatteh (plat libanais à base de pain pita)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = '600. Fatteh (plat libanais à base de pain pita)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

COMMIT;
