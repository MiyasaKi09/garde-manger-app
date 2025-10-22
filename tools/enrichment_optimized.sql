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


-- Yaourt grec, miel et noix
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Yaourt grec, miel et noix'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Lacté', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fromage blanc et compote de pommes maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fromage blanc et compote de pommes maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Toast de pain complet, avocat et graines de sésame
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Toast de pain complet, avocat et graines de sésame'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Apéritif')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tartine de chèvre frais, miel et thym
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tartine de chèvre frais, miel et thym'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Saveur-Herbacé', 'Arôme-Caramélisé', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Huevos Rotos (œufs cassés sur frites et jambon Serrano)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Huevos Rotos (œufs cassés sur frites et jambon Serrano)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pan con Tomate (pain grillé à la tomate et ail)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pan con Tomate (pain grillé à la tomate et ail)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Shakshuka (œufs pochés dans une sauce tomate épicée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Shakshuka (œufs pochés dans une sauce tomate épicée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Saveur-Acide', 'Saveur-Épicé', 'Texture-Crémeux', 'Intensité-Léger', 'Intensité-Intense', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Full English Breakfast complet
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Full English Breakfast complet'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Œufs Bénédictine et sauce hollandaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Œufs Bénédictine et sauce hollandaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tamagoyaki (omelette roulée japonaise)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tamagoyaki (omelette roulée japonaise)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gaspacho Andalou traditionnel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gaspacho Andalou traditionnel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salmorejo de Cordoue et ses garnitures
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salmorejo de Cordoue et ses garnitures'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soupe froide de concombre à la menthe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soupe froide de concombre à la menthe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Texture-Liquide', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Velouté froid de courgettes au basilic
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Velouté froid de courgettes au basilic'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Texture-Crémeux', 'Texture-Liquide', 'Arôme-Épicé Frais', 'Été', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Verrine avocat, crevette et pamplemousse
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Verrine avocat, crevette et pamplemousse'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Amer', 'Arôme-Agrumes', 'Apéritif')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade Caprese (tomate, mozzarella, basilic)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade Caprese (tomate, mozzarella, basilic)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade Grecque traditionnelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade Grecque traditionnelle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Taboulé libanais (riche en persil)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Taboulé libanais (riche en persil)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Saveur-Herbacé', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de lentilles vertes du Puy et lardons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de lentilles vertes du Puy et lardons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Végétal', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade César au poulet grillé et copeaux de parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade César au poulet grillé et copeaux de parmesan'
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


-- Salade Niçoise classique
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade Niçoise classique'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de chèvre chaud sur toast
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de chèvre chaud sur toast'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Apéritif')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de pâtes à l''italienne (pesto, tomates séchées)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de pâtes à l''''italienne (pesto, tomates séchées)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de riz au thon, maïs et poivrons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de riz au thon, maïs et poivrons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade piémontaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade piémontaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Houmous de pois chiches maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Houmous de pois chiches maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Baba Ganoush (caviar d''aubergines fumées)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Baba Ganoush (caviar d''''aubergines fumées)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Luxe', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tzatziki grec au concombre et à l''aneth
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tzatziki grec au concombre et à l''''aneth'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Moutabal libanais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Moutabal libanais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tapenade d''olives noires de Provence
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tapenade d''''olives noires de Provence'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Guacamole maison et chips de maïs
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Guacamole maison et chips de maïs'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Mexicaine', 'Végétarien', 'Texture-Croquant')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bruschetta à la tomate fraîche et basilic
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bruschetta à la tomate fraîche et basilic'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Crostinis au chèvre et figues
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crostinis au chèvre et figues'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tortilla de patatas espagnole
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tortilla de patatas espagnole'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Patatas bravas et leur sauce épicée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Patatas bravas et leur sauce épicée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Épicé', 'Texture-Crémeux', 'Intensité-Intense')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pimientos de Padrón grillés
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pimientos de Padrón grillés'
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


-- Falafels de pois chiches, sauce tahini
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Falafels de pois chiches, sauce tahini'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Samoussas aux légumes et épices
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Samoussas aux légumes et épices'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Nems au porc et leur sauce
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Nems au porc et leur sauce'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Beignets de calamars à la romaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Beignets de calamars à la romaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Arancini siciliens (boules de risotto frites)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Arancini siciliens (boules de risotto frites)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Focaccia au romarin et à la fleur de sel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Focaccia au romarin et à la fleur de sel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Saveur-Herbacé', 'Saveur-Floral', 'Arôme-Floral')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gressins italiens maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gressins italiens maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Légumes grillés marinés à l''italienne (antipasti)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Légumes grillés marinés à l''''italienne (antipasti)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Artichauts à la romaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Artichauts à la romaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poivrons marinés à l''huile d''olive et à l''ail
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poivrons marinés à l''''huile d''''olive et à l''''ail'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Aubergines à la parmesane (Melanzane alla parmigiana)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Aubergines à la parmesane (Melanzane alla parmigiana)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Velouté de potimarron et châtaignes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Velouté de potimarron et châtaignes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Texture-Liquide', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soupe à l''oignon gratinée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soupe à l''''oignon gratinée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Crème de lentilles corail au lait de coco
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crème de lentilles corail au lait de coco'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Végétarien', 'Texture-Crémeux', 'Arôme-Lacté', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soupe de poireaux-pommes de terre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soupe de poireaux-pommes de terre'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Velouté Dubarry (chou-fleur)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Velouté Dubarry (chou-fleur)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Floral', 'Texture-Crémeux', 'Texture-Liquide', 'Arôme-Floral', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Minestrone de légumes italiens
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Minestrone de légumes italiens'
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


-- Soupe de poisson et sa rouille
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soupe de poisson et sa rouille'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Liquide', 'Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bouillon thaï aux crevettes (Tom Yum)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bouillon thaï aux crevettes (Tom Yum)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soupe Phở au bœuf vietnamienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soupe Phở au bœuf vietnamienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soupe miso japonaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soupe miso japonaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Végétarien', 'Saveur-Umami', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Harira marocaine (soupe de rupture du jeûne)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Harira marocaine (soupe de rupture du jeûne)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Chorba algérienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Chorba algérienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Œufs cocotte à la crème et aux lardons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Œufs cocotte à la crème et aux lardons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Feuilletés saucisse à la moutarde
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Feuilletés saucisse à la moutarde'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Mini-brochettes de poulet mariné au satay
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Mini-brochettes de poulet mariné au satay'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Roulés de courgette au fromage frais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Roulés de courgette au fromage frais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche', 'Arôme-Lacté', 'Été', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Blinis au saumon fumé et crème à l''aneth
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Blinis au saumon fumé et crème à l''''aneth'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux', 'Arôme-Lacté', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Champignons farcis à l''ail et au persil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Champignons farcis à l''''ail et au persil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Umami', 'Saveur-Herbacé', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tomates provençales au four
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tomates provençales au four'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Saveur-Acide', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tarte soleil au pesto et parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tarte soleil au pesto et parmesan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gougères au fromage
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gougères au fromage'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Cake salé aux olives et au jambon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cake salé aux olives et au jambon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Muffins salés au chorizo et poivron
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Muffins salés au chorizo et poivron'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien', 'Saveur-Salé', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Madeleines salées au chèvre et romarin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Madeleines salées au chèvre et romarin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Saveur-Herbacé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Quiche Lorraine traditionnelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Quiche Lorraine traditionnelle'
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


-- Tarte aux poireaux et lardons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tarte aux poireaux et lardons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tarte à la tomate et à la moutarde
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tarte à la tomate et à la moutarde'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tarte fine aux légumes du soleil et chèvre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tarte fine aux légumes du soleil et chèvre'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Quiche sans pâte aux épinards et ricotta
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Quiche sans pâte aux épinards et ricotta'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Flammenkueche alsacienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Flammenkueche alsacienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pizza Margherita
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pizza Margherita'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pizza Reine (jambon, champignons)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pizza Reine (jambon, champignons)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Saveur-Umami', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pizza 4 fromages
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pizza 4 fromages'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Calzone (pizza soufflée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Calzone (pizza soufflée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poulet rôti du dimanche aux herbes de Provence
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poulet rôti du dimanche aux herbes de Provence'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Herbacé', 'Intensité-Moyen', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poulet à la crème et aux champignons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poulet à la crème et aux champignons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Umami', 'Texture-Crémeux', 'Arôme-Terreux', 'Arôme-Lacté', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poulet vallée d''Auge (au cidre et à la crème)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poulet vallée d''''Auge (au cidre et à la crème)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Coq au vin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Coq au vin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Escalopes de poulet panées au citron
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Escalopes de poulet panées au citron'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Acide', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Piccata de veau au citron
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Piccata de veau au citron'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Acide', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Blanquette de veau à l''ancienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Blanquette de veau à l''''ancienne'
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


-- Osso buco à la milanaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Osso buco à la milanaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Rôti de veau Orloff
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Rôti de veau Orloff'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sauté de veau Marengo
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sauté de veau Marengo'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Paupiettes de veau en sauce
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Paupiettes de veau en sauce'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bœuf bourguignon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bœuf bourguignon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Daube de bœuf provençale
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Daube de bœuf provençale'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Carbonnade flamande
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Carbonnade flamande'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pot-au-feu et ses légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pot-au-feu et ses légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Hachis Parmentier
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Hachis Parmentier'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Steak frites, sauce au poivre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Steak frites, sauce au poivre'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Épicé', 'Texture-Crémeux', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Entrecôte grillée, sauce béarnaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Entrecôte grillée, sauce béarnaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Carpaccio de bœuf, parmesan et roquette
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Carpaccio de bœuf, parmesan et roquette'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Saveur-Umami')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Chili con carne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Chili con carne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Boulettes de bœuf à la sauce tomate
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Boulettes de bœuf à la sauce tomate'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Acide', 'Texture-Crémeux', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Kefta de bœuf à la marocaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Kefta de bœuf à la marocaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bœuf sauté aux oignons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bœuf sauté aux oignons'
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


-- Bœuf sauté au gingembre et à la ciboulette
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bœuf sauté au gingembre et à la ciboulette'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Asiatique', 'Saveur-Épicé', 'Intensité-Moyen', 'Arôme-Épicé Chaud')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bulgogi (barbecue coréen)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bulgogi (barbecue coréen)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gyudon japonais (bol de riz au bœuf)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gyudon japonais (bol de riz au bœuf)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Rôti de porc à la moutarde
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Rôti de porc à la moutarde'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sauté de porc au caramel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sauté de porc au caramel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Sucré', 'Intensité-Moyen', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Travers de porc (ribs) sauce barbecue
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Travers de porc (ribs) sauce barbecue'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Texture-Crémeux', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Porc Tonkatsu japonais (escalope panée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Porc Tonkatsu japonais (escalope panée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Souris d''agneau confites au miel et au thym
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Souris d''''agneau confites au miel et au thym'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Saveur-Sucré', 'Saveur-Herbacé', 'Intensité-Riche', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Curry d''agneau à l''indienne (Rogan Josh)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Curry d''''agneau à l''''indienne (Rogan Josh)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Moussaka grecque
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Moussaka grecque'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tajine d''agneau aux pruneaux et amandes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tajine d''''agneau aux pruneaux et amandes'
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


-- Brochettes d''agneau marinées au citron et origan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Brochettes d''''agneau marinées au citron et origan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Acide', 'Arôme-Agrumes', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Côtelettes d''agneau grillées à l''ail
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Côtelettes d''''agneau grillées à l''''ail'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Magret de canard, sauce au poivre vert
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Magret de canard, sauce au poivre vert'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Épicé', 'Texture-Crémeux', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Confit de canard et pommes de terre sarladaises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Confit de canard et pommes de terre sarladaises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Intensité-Riche', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Canard laqué pékinois (version simplifiée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Canard laqué pékinois (version simplifiée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Chinoise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Lapin à la moutarde
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Lapin à la moutarde'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Lapin chasseur
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Lapin chasseur'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Cassoulet de Toulouse
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cassoulet de Toulouse'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Choucroute garnie alsacienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Choucroute garnie alsacienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Petit salé aux lentilles
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Petit salé aux lentilles'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Andouillette de Troyes, sauce moutarde
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Andouillette de Troyes, sauce moutarde'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Boudin noir aux pommes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Boudin noir aux pommes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Saucisson de Lyon pistaché en brioche
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Saucisson de Lyon pistaché en brioche'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Far breton (version salée aux pruneaux et lard)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Far breton (version salée aux pruneaux et lard)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Crêpes salées complètes (jambon, œuf, fromage)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crêpes salées complètes (jambon, œuf, fromage)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Salé', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Galettes de sarrasin bretonnes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Galettes de sarrasin bretonnes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Moules marinières
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Moules marinières'
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


-- Moules à la crème et aux frites
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Moules à la crème et aux frites'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Intensité-Riche', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Moules au curry
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Moules au curry'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Moules à la provençale
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Moules à la provençale'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Paella valenciana
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Paella valenciana'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Paella aux fruits de mer
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Paella aux fruits de mer'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Saveur-Sucré', 'Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Zarzuela de mariscos (cassolette de poissons espagnole)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Zarzuela de mariscos (cassolette de poissons espagnole)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fideuà (paella de vermicelles)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fideuà (paella de vermicelles)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Lotte à l''américaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Lotte à l''''américaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bouillabaisse marseillaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bouillabaisse marseillaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bourride sétoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bourride sétoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Aïoli provençal et ses légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Aïoli provençal et ses légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Saumon teriyaki
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Saumon teriyaki'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Saumon à la plancha, sauce vierge
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Saumon à la plancha, sauce vierge'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Lasagnes au saumon et épinards
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Lasagnes au saumon et épinards'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tartare de saumon à l''aneth et au citron vert
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tartare de saumon à l''''aneth et au citron vert'
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


-- Brochettes de saumon marinées
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Brochettes de saumon marinées'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Quiche au saumon et poireaux
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Quiche au saumon et poireaux'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Dos de cabillaud en croûte de chorizo
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Dos de cabillaud en croûte de chorizo'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fish and chips britannique
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fish and chips britannique'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Croquant')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Waterzooi de poisson
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Waterzooi de poisson'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Curry de poisson au lait de coco
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Curry de poisson au lait de coco'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Indienne', 'Saveur-Épicé', 'Arôme-Marin', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Steak de thon à la sicilienne (olives, câpres)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Steak de thon à la sicilienne (olives, câpres)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bar en croûte de sel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bar en croûte de sel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Dorade royale au four et fenouil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Dorade royale au four et fenouil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Filet de sole meunière
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Filet de sole meunière'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Raie au beurre noir et aux câpres
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Raie au beurre noir et aux câpres'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Intensité-Riche', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Maquereaux marinés au vin blanc
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Maquereaux marinés au vin blanc'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sardines grillées au barbecue
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sardines grillées au barbecue'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Coquilles Saint-Jacques poêlées, fondue de poireaux
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Coquilles Saint-Jacques poêlées, fondue de poireaux'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Healthy', 'Automne', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Noix de Saint-Jacques snackées, purée de carottes au cumin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Noix de Saint-Jacques snackées, purée de carottes au cumin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Healthy')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Risotto aux Saint-Jacques et asperges
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Risotto aux Saint-Jacques et asperges'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Healthy', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Crevettes sautées à l''ail et au persil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crevettes sautées à l''''ail et au persil'
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


-- Curry de crevettes et lait de coco
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Curry de crevettes et lait de coco'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Indienne', 'Saveur-Épicé', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes aux crevettes, ail, huile et piment
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes aux crevettes, ail, huile et piment'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Wok de crevettes aux légumes croquants
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Wok de crevettes aux légumes croquants'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Asiatique', 'Texture-Croquant', 'Texture-Ferme')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pad Thaï aux crevettes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pad Thaï aux crevettes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Brochettes de gambas à la plancha
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Brochettes de gambas à la plancha'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Calamars à la romaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Calamars à la romaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Encornets farcis à la sétoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Encornets farcis à la sétoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Seiches à la plancha en persillade
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Seiches à la plancha en persillade'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poulpe à la galicienne (Pulpo a la gallega)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poulpe à la galicienne (Pulpo a la gallega)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soupe de lentilles corail, carotte et cumin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soupe de lentilles corail, carotte et cumin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Dahl de lentilles indien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Dahl de lentilles indien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de lentilles, carottes et oignons rouges
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de lentilles, carottes et oignons rouges'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bolognaise de lentilles vertes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bolognaise de lentilles vertes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Végétal', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Curry de pois chiches et épinards
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Curry de pois chiches et épinards'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pois chiches rôtis aux épices
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pois chiches rôtis aux épices'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de pois chiches à la méditerranéenne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de pois chiches à la méditerranéenne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Chili sin carne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Chili sin carne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Haricots blancs à la bretonne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Haricots blancs à la bretonne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fèves à la catalane
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fèves à la catalane'
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


-- Socca niçoise (galette de farine de pois chiches)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Socca niçoise (galette de farine de pois chiches)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Panisses marseillaises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Panisses marseillaises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Lasagnes végétariennes aux légumes du soleil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Lasagnes végétariennes aux légumes du soleil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Lasagnes aux épinards et à la ricotta
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Lasagnes aux épinards et à la ricotta'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Risotto aux champignons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Risotto aux champignons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Risotto aux asperges et parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Risotto aux asperges et parmesan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Risotto à la milanaise (au safran)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Risotto à la milanaise (au safran)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Risotto aux courgettes et menthe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Risotto aux courgettes et menthe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Risotto à la tomate et mozzarella
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Risotto à la tomate et mozzarella'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes à la sauce tomate et basilic frais (al pomodoro)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes à la sauce tomate et basilic frais (al pomodoro)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Texture-Crémeux', 'Arôme-Épicé Frais', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes all''arrabbiata
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes all''''arrabbiata'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes alla puttanesca
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes alla puttanesca'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes à la carbonara (la vraie, sans crème)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes à la carbonara (la vraie, sans crème)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes cacio e pepe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes cacio e pepe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes à l''amatriciana
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes à l''''amatriciana'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes au pesto alla genovese
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes au pesto alla genovese'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes aux palourdes (alle vongole)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes aux palourdes (alle vongole)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes aux fruits de mer (allo scoglio)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes aux fruits de mer (allo scoglio)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Saveur-Sucré', 'Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes alla norma (aubergines, ricotta salata)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes alla norma (aubergines, ricotta salata)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gnocchis de pommes de terre, sauce sauge et beurre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gnocchis de pommes de terre, sauce sauge et beurre'
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


-- Gnocchis à la sorrentina (sauce tomate, mozzarella)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gnocchis à la sorrentina (sauce tomate, mozzarella)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Texture-Crémeux', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Raviolis aux épinards et ricotta, sauce tomate
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Raviolis aux épinards et ricotta, sauce tomate'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Texture-Crémeux', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Cannellonis farcis à la bolognaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cannellonis farcis à la bolognaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Spaghettis aux boulettes de viande (style italo-américain)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Spaghettis aux boulettes de viande (style italo-américain)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Macaroni and cheese américain (gratin de macaronis)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Macaroni and cheese américain (gratin de macaronis)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gratin de pâtes au jambon et béchamel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gratin de pâtes au jambon et béchamel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- One pot pasta tomate, basilic, mozzarella
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'One pot pasta tomate, basilic, mozzarella'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes au citron et à la crème
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes au citron et à la crème'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Texture-Crémeux', 'Arôme-Agrumes', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de pâtes estivale
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de pâtes estivale'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes fraîches maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes fraîches maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tofu sauté aux légumes et sauce soja
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tofu sauté aux légumes et sauce soja'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Asiatique', 'Végétarien', 'Saveur-Umami', 'Texture-Crémeux', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tofu mariné et grillé au sésame
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tofu mariné et grillé au sésame'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tofu général Tao
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tofu général Tao'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tofu Mapo (recette sichuanaise)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tofu Mapo (recette sichuanaise)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Curry de tofu et légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Curry de tofu et légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tofu brouillé (alternative aux œufs)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tofu brouillé (alternative aux œufs)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tofu Katsu (pané et frit)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tofu Katsu (pané et frit)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Seitan bourguignon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Seitan bourguignon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sauté de seitan et brocolis
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sauté de seitan et brocolis'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Burger de seitan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Burger de seitan'
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


-- Tempeh laqué à l''indonésienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tempeh laqué à l''''indonésienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Buddha bowl au quinoa, patates douces et avocat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Buddha bowl au quinoa, patates douces et avocat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de quinoa, concombre, feta et menthe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de quinoa, concombre, feta et menthe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Quinoa façon taboulé
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Quinoa façon taboulé'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Galettes de quinoa et carottes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Galettes de quinoa et carottes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gratin de quinoa aux légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gratin de quinoa aux légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gratin dauphinois traditionnel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gratin dauphinois traditionnel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gratin de courgettes à la menthe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gratin de courgettes à la menthe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Arôme-Épicé Frais', 'Été', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gratin de chou-fleur à la béchamel
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gratin de chou-fleur à la béchamel'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Floral', 'Arôme-Floral', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gratin de brocolis au parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gratin de brocolis au parmesan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tian de légumes provençal
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tian de légumes provençal'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Ratatouille niçoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Ratatouille niçoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Piperade basque
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Piperade basque'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poêlée de légumes du soleil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poêlée de légumes du soleil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poêlée de champignons en persillade
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poêlée de champignons en persillade'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Umami', 'Saveur-Herbacé', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Wok de légumes sauce aigre-douce
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Wok de légumes sauce aigre-douce'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Asiatique', 'Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Légumes rôtis au four (carottes, panais, patates douces)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Légumes rôtis au four (carottes, panais, patates douces)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Frites de patates douces au paprika
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Frites de patates douces au paprika'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Purée de pommes de terre maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Purée de pommes de terre maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Purée de carottes au cumin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Purée de carottes au cumin'
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


-- Purée de panais à la noisette
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Purée de panais à la noisette'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Purée de céleri-rave
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Purée de céleri-rave'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Écrasé de pommes de terre à l''huile d''olive et ail
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Écrasé de pommes de terre à l''''huile d''''olive et ail'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pommes de terre suédoises (Hasselback)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pommes de terre suédoises (Hasselback)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pommes dauphine maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pommes dauphine maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Aligot de l''Aubrac
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Aligot de l''''Aubrac'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Truffade auvergnate
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Truffade auvergnate'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poêlée de haricots verts à l''ail et persil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poêlée de haricots verts à l''''ail et persil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Frites de polenta au parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Frites de polenta au parmesan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Intensité-Riche', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Polenta crémeuse
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Polenta crémeuse'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Endives braisées au jambon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Endives braisées au jambon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Amer', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Asperges vertes rôties au parmesan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Asperges vertes rôties au parmesan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Intensité-Moyen', 'Arôme-Végétal', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fondue de poireaux à la crème
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fondue de poireaux à la crème'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Fruité', 'Arôme-Lacté', 'Automne', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Épinards frais à la crème
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Épinards frais à la crème'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Choux de Bruxelles rôtis au lard et sirop d''érable
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Choux de Bruxelles rôtis au lard et sirop d''''érable'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Sucré', 'Intensité-Moyen', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Carottes glacées à l''orange
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Carottes glacées à l''''orange'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Betteraves rôties au miel et au thym
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Betteraves rôties au miel et au thym'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Saveur-Herbacé', 'Intensité-Moyen', 'Arôme-Terreux', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fenouil braisé à l''anis
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fenouil braisé à l''''anis'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Riz pilaf aux amandes et raisins secs
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Riz pilaf aux amandes et raisins secs'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Semoule aux légumes (accompagnement tajine)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Semoule aux légumes (accompagnement tajine)'
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


-- Curry de légumes thaïlandais au lait de coco
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Curry de légumes thaïlandais au lait de coco'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Indienne', 'Végétarien', 'Saveur-Épicé', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Palak Paneer (épinards au fromage indien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Palak Paneer (épinards au fromage indien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Aloo Gobi (curry de chou-fleur et pommes de terre)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Aloo Gobi (curry de chou-fleur et pommes de terre)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Saveur-Épicé', 'Saveur-Floral', 'Arôme-Fruité', 'Arôme-Floral', 'Automne', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Chana Masala (curry de pois chiches épicé)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Chana Masala (curry de pois chiches épicé)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Saveur-Épicé', 'Intensité-Intense')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Baingan Bharta (caviar d''aubergine indien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Baingan Bharta (caviar d''''aubergine indien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Luxe', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Samosas aux légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Samosas aux légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pakoras d''oignons (beignets indiens)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pakoras d''''oignons (beignets indiens)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Caponata sicilienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Caponata sicilienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâtes aux brocolis et anchois
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâtes aux brocolis et anchois'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Risotto de petit épeautre aux champignons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Risotto de petit épeautre aux champignons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Umami', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Galettes de sarrasin aux champignons et crème
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Galettes de sarrasin aux champignons et crème'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Umami', 'Texture-Crémeux', 'Arôme-Terreux', 'Arôme-Lacté', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Crozets en gratin au beaufort (croziflette)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crozets en gratin au beaufort (croziflette)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Intense')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tarte au maroilles
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tarte au maroilles'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pissaladière niçoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pissaladière niçoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tourte aux blettes sucrée-salée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tourte aux blettes sucrée-salée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Saveur-Sucré')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gözleme turc aux épinards et feta
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gözleme turc aux épinards et feta'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Börek aux épinards
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Börek aux épinards'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fattoush (salade libanaise au pain pita grillé)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fattoush (salade libanaise au pain pita grillé)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Koshari égyptien (riz, lentilles, pâtes, sauce tomate)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Koshari égyptien (riz, lentilles, pâtes, sauce tomate)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Acide', 'Texture-Crémeux', 'Long', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Mjadra (riz aux lentilles et oignons frits)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Mjadra (riz aux lentilles et oignons frits)'
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


-- Salade Waldorf (céleri, pomme, noix)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade Waldorf (céleri, pomme, noix)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Coleslaw américain
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Coleslaw américain'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de pommes de terre allemande (Kartoffelsalat)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de pommes de terre allemande (Kartoffelsalat)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de concombre à la danoise (Agurkesalat)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de concombre à la danoise (Agurkesalat)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de betteraves crues, pomme verte et noisettes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de betteraves crues, pomme verte et noisettes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Arôme-Végétal', 'Arôme-Terreux', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de fenouil à l''orange et aux olives noires
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de fenouil à l''''orange et aux olives noires'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de carottes râpées au citron et cumin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de carottes râpées au citron et cumin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de chou rouge aux pommes et aux noix
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de chou rouge aux pommes et aux noix'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de pâtes grecque (feta, olives, concombre)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de pâtes grecque (feta, olives, concombre)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Salé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de lentilles corail, carottes et coco
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de lentilles corail, carottes et coco'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Taboulé de chou-fleur
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Taboulé de chou-fleur'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Saveur-Floral', 'Arôme-Floral', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade d''endives, noix et roquefort
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade d''''endives, noix et roquefort'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Amer', 'Intensité-Intense', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade lyonnaise (lardons, croûtons, œuf poché)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade lyonnaise (lardons, croûtons, œuf poché)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Intensité-Léger')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade landaise (gésiers, magret fumé)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade landaise (gésiers, magret fumé)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de haricots verts, tomates et oignons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de haricots verts, tomates et oignons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Arôme-Végétal', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Ajo Blanco (soupe froide d''amandes espagnole)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Ajo Blanco (soupe froide d''''amandes espagnole)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Vichyssoise (soupe froide poireaux-pommes de terre)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Vichyssoise (soupe froide poireaux-pommes de terre)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soupe froide de melon à la menthe et au porto
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soupe froide de melon à la menthe et au porto'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Texture-Liquide', 'Arôme-Épicé Frais', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Okroshka (soupe froide russe au kvas)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Okroshka (soupe froide russe au kvas)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade de poulpe et pommes de terre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de poulpe et pommes de terre'
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


-- Burger de bœuf classique, cheddar et bacon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Burger de bœuf classique, cheddar et bacon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Burger de poulet croustillant
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Burger de poulet croustillant'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Texture-Croquant')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Burger végétarien aux haricots noirs
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Burger végétarien aux haricots noirs'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Hot-dog new-yorkais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Hot-dog new-yorkais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sandwich Club au poulet et bacon
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sandwich Club au poulet et bacon'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Pique-nique')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sandwich Reuben (pastrami, choucroute)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sandwich Reuben (pastrami, choucroute)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Hiver', 'Pique-nique')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pan Bagnat niçois
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pan Bagnat niçois'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Croque-Monsieur
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Croque-Monsieur'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Croque-Madame
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Croque-Madame'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Welsh rarebit
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Welsh rarebit'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Kebab maison (pain pita, viande grillée, sauce blanche)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Kebab maison (pain pita, viande grillée, sauce blanche)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Crémeux', 'Texture-Croquant', 'Intensité-Moyen', 'Arôme-Caramélisé', 'Été', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Wrap au poulet César
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Wrap au poulet César'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Pique-nique')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Wrap au houmous, falafels et crudités
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Wrap au houmous, falafels et crudités'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Pique-nique')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Focaccia garnie (jambon de parme, roquette, mozzarella)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Focaccia garnie (jambon de parme, roquette, mozzarella)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Arepas vénézuéliennes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Arepas vénézuéliennes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tacos al pastor mexicains
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tacos al pastor mexicains'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Mexicaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Quesadillas au fromage et poulet
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Quesadillas au fromage et poulet'
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


-- Ramen japonais au porc chashu
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Ramen japonais au porc chashu'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Udon sauté au bœuf
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Udon sauté au bœuf'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soba froides et leur sauce tsuyu
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soba froides et leur sauce tsuyu'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Yaki Soba (nouilles sautées japonaises)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Yaki Soba (nouilles sautées japonaises)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Végétarien', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Riz cantonais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Riz cantonais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Chinoise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Nasi Goreng indonésien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Nasi Goreng indonésien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Riz sauté thaï à l''ananas et aux crevettes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Riz sauté thaï à l''''ananas et aux crevettes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Dan Dan noodles sichuanaises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Dan Dan noodles sichuanaises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Nouilles sautées au poulet et légumes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Nouilles sautées au poulet et légumes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Japchae (nouilles de patate douce coréennes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Japchae (nouilles de patate douce coréennes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soupe de nouilles wonton
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soupe de nouilles wonton'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Laksa de Singapour (soupe de nouilles épicée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Laksa de Singapour (soupe de nouilles épicée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Épicé', 'Texture-Liquide', 'Intensité-Intense')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poulet katsu curry japonais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poulet katsu curry japonais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Indienne', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Katsudon (bol de riz au porc pané)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Katsudon (bol de riz au porc pané)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Onigiri japonais (boules de riz farcies)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Onigiri japonais (boules de riz farcies)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Congee de riz (porridge de riz salé)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Congee de riz (porridge de riz salé)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Riz gluant à la mangue thaïlandais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Riz gluant à la mangue thaïlandais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Thaïlandaise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Kimchi Jjigae (ragoût de kimchi coréen)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Kimchi Jjigae (ragoût de kimchi coréen)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tteokbokki (gâteaux de riz épicés coréens)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tteokbokki (gâteaux de riz épicés coréens)'
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


-- Crème brûlée à la vanille
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crème brûlée à la vanille'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Mousse au chocolat noir
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Mousse au chocolat noir'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Île flottante et sa crème anglaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Île flottante et sa crème anglaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Profiteroles au chocolat chaud
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Profiteroles au chocolat chaud'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tarte Tatin aux pommes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tarte Tatin aux pommes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tarte au citron meringuée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tarte au citron meringuée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tarte Bourdaloue (poires et amandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tarte Bourdaloue (poires et amandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Clafoutis aux cerises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Clafoutis aux cerises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Far breton aux pruneaux
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Far breton aux pruneaux'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Canelés de Bordeaux
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Canelés de Bordeaux'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Macarons parisiens (pistache, chocolat, framboise)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Macarons parisiens (pistache, chocolat, framboise)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Paris-Brest (pâte à choux, crème pralinée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Paris-Brest (pâte à choux, crème pralinée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Éclair au café ou au chocolat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Éclair au café ou au chocolat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Amer')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Religieuse au chocolat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Religieuse au chocolat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Saint-Honoré
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Saint-Honoré'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Healthy')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fraisier
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fraisier'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Opéra
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Opéra'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Mille-feuille
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Mille-feuille'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soufflé au Grand Marnier
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soufflé au Grand Marnier'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Riz au lait à la vanille
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Riz au lait à la vanille'
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


-- Tiramisu classique au café
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tiramisu classique au café'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Saveur-Amer')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Panna Cotta et son coulis de fruits rouges
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Panna Cotta et son coulis de fruits rouges'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Fruité')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tiramisu aux fraises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tiramisu aux fraises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien', 'Arôme-Fruité', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Panna Cotta au caramel beurre salé
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Panna Cotta au caramel beurre salé'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Salé', 'Saveur-Sucré', 'Intensité-Riche', 'Arôme-Lacté', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Zabaione au Marsala
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Zabaione au Marsala'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Cannoli siciliens à la ricotta
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cannoli siciliens à la ricotta'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Torta della nonna (tarte à la crème pâtissière et pignons)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Torta della nonna (tarte à la crème pâtissière et pignons)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Torta caprese (gâteau au chocolat et amandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Torta caprese (gâteau au chocolat et amandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Semifreddo au nougat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Semifreddo au nougat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gelato à la pistache maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gelato à la pistache maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Affogato (glace vanille noyée dans un expresso)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Affogato (glace vanille noyée dans un expresso)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Rapide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Panettone (version maison)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Panettone (version maison)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Cantucci (croquants aux amandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cantucci (croquants aux amandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Croquant', 'Texture-Ferme')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bonet piémontais (flan au chocolat et amaretti)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bonet piémontais (flan au chocolat et amaretti)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pêches au vin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pêches au vin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sbrisolona (gâteau friable aux amandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sbrisolona (gâteau friable aux amandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Crostata à la confiture d''abricots
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crostata à la confiture d''''abricots'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Saveur-Sucré', 'Intensité-Riche', 'Arôme-Fruité', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salame al cioccolato (saucisson au chocolat)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salame al cioccolato (saucisson au chocolat)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sfogliatelle napolitaines
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sfogliatelle napolitaines'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pastiera napolitaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pastiera napolitaine'
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


-- Cheesecake new-yorkais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cheesecake new-yorkais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Brownie au chocolat et noix de pécan
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Brownie au chocolat et noix de pécan'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Cookies aux pépites de chocolat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cookies aux pépites de chocolat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Apple pie américaine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Apple pie américaine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pumpkin pie (tarte à la citrouille)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pumpkin pie (tarte à la citrouille)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pecan pie (tarte aux noix de pécan)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pecan pie (tarte aux noix de pécan)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Carrot cake et son glaçage au cream cheese
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Carrot cake et son glaçage au cream cheese'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Red velvet cake
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Red velvet cake'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Muffins aux myrtilles
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Muffins aux myrtilles'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Cupcakes à la vanille et glaçage
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cupcakes à la vanille et glaçage'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Banana bread
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Banana bread'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Key lime pie (tarte au citron vert)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Key lime pie (tarte au citron vert)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Arôme-Agrumes', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Crumble aux pommes et à la cannelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crumble aux pommes et à la cannelle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Arôme-Épicé Chaud', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sticky toffee pudding
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sticky toffee pudding'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Eton mess (meringue, fraises, crème)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Eton mess (meringue, fraises, crème)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Fruité', 'Arôme-Lacté', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Scones britanniques, clotted cream et confiture
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Scones britanniques, clotted cream et confiture'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Saveur-Sucré', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Trifle anglais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Trifle anglais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Banoffee pie
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Banoffee pie'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bread and butter pudding
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bread and butter pudding'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Shortbread écossais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Shortbread écossais'
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


-- Forêt-Noire allemande (Schwarzwälder Kirschtorte)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Forêt-Noire allemande (Schwarzwälder Kirschtorte)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Apfelstrudel autrichien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Apfelstrudel autrichien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sacher Torte viennoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sacher Torte viennoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Linzer Torte
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Linzer Torte'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Churros espagnols et leur chocolat chaud
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Churros espagnols et leur chocolat chaud'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Espagnole', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Crème catalane
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crème catalane'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tarta de Santiago (gâteau aux amandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tarta de Santiago (gâteau aux amandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Leche frita (lait frit)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Leche frita (lait frit)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pastel de nata portugais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pastel de nata portugais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gâteau basque à la crème ou à la cerise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gâteau basque à la crème ou à la cerise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Loukoumades grecs (beignets au miel)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Loukoumades grecs (beignets au miel)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Caramélisé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Baklava
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Baklava'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Halva
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Halva'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Basboussa (gâteau de semoule)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Basboussa (gâteau de semoule)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Cornes de gazelle marocaines
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cornes de gazelle marocaines'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Mochi japonais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Mochi japonais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Dorayaki (pancakes japonais fourrés)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Dorayaki (pancakes japonais fourrés)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Japonaise', 'Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gâteau de lune chinois
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gâteau de lune chinois'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Chinoise', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Alfajores argentins
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Alfajores argentins'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Brigadeiros brésiliens
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Brigadeiros brésiliens'
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


-- Salade de fruits frais de saison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade de fruits frais de saison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Carpaccio d''ananas à la menthe et au citron vert
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Carpaccio d''''ananas à la menthe et au citron vert'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Saveur-Herbacé', 'Arôme-Agrumes', 'Arôme-Végétal', 'Arôme-Épicé Frais')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fraises au sucre et jus de citron
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fraises au sucre et jus de citron'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Texture-Liquide', 'Arôme-Fruité', 'Arôme-Agrumes', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soupe de fraises à la menthe
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soupe de fraises à la menthe'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé', 'Texture-Liquide', 'Arôme-Fruité', 'Arôme-Épicé Frais', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poires Belle-Hélène
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poires Belle-Hélène'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pêches Melba
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pêches Melba'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pommes au four, miel et cannelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pommes au four, miel et cannelle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Fruité', 'Arôme-Caramélisé', 'Arôme-Épicé Chaud', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bananes flambées au rhum
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bananes flambées au rhum'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salade d''oranges à la cannelle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salade d''''oranges à la cannelle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Agrumes', 'Arôme-Épicé Chaud')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gratin de fruits rouges
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gratin de fruits rouges'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Fruité')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tarte fine aux pommes sur pâte feuilletée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tarte fine aux pommes sur pâte feuilletée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Arôme-Végétal', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Compote de pommes maison sans sucre ajouté
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Compote de pommes maison sans sucre ajouté'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Crumble aux fruits rouges et flocons d''avoine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crumble aux fruits rouges et flocons d''''avoine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Fruité')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sorbet maison (citron, framboise)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sorbet maison (citron, framboise)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Acide', 'Arôme-Fruité', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Nice cream (glace à la banane congelée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Nice cream (glace à la banane congelée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Energy balls aux dattes et noix de cajou
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Energy balls aux dattes et noix de cajou'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Barres de céréales maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Barres de céréales maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Yaourt glacé (frozen yogurt) aux fruits
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Yaourt glacé (frozen yogurt) aux fruits'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Sucré', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Mousse d''avocat au cacao
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Mousse d''''avocat au cacao'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Amer')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pommes en tranches et beurre de cacahuètes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pommes en tranches et beurre de cacahuètes'
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


-- Baguette tradition française
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Baguette tradition française'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pain de campagne au levain
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pain de campagne au levain'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pain complet maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pain complet maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pain aux céréales
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pain aux céréales'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pain de seigle
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pain de seigle'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pain de mie maison
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pain de mie maison'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pains à burger (buns)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pains à burger (buns)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Américaine', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pains pita
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pains pita'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Naans indiens au fromage
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Naans indiens au fromage'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Indienne', 'Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Chapatis
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Chapatis'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pain à la semoule (khobz)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pain à la semoule (khobz)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bretzels alsaciens
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bretzels alsaciens'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Ciabatta italienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Ciabatta italienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pain brioché
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pain brioché'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Croissants au beurre
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Croissants au beurre'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche', 'Arôme-Lacté', 'Petit-déjeuner')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pains au chocolat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pains au chocolat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pains aux raisins
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pains aux raisins'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Brioche tressée
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Brioche tressée'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Kouglof alsacien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Kouglof alsacien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Chinois (gâteau brioché à la crème)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Chinois (gâteau brioché à la crème)'
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


-- Baeckeoffe alsacien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Baeckeoffe alsacien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tripes à la mode de Caen
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tripes à la mode de Caen'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Potjevleesch flamand
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Potjevleesch flamand'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Daube niçoise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Daube niçoise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pieds paquets marseillais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pieds paquets marseillais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Alouettes sans tête provençales
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Alouettes sans tête provençales'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fricassée de volaille à l''angevine
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fricassée de volaille à l''''angevine'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poule au pot
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poule au pot'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Coquilles Saint-Jacques à la bretonne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Coquilles Saint-Jacques à la bretonne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien', 'Healthy')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Cotriade bretonne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cotriade bretonne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Matelote d''anguille
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Matelote d''''anguille'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Lamproie à la bordelaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Lamproie à la bordelaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Ttoro (soupe de poisson basque)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Ttoro (soupe de poisson basque)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Texture-Liquide', 'Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Morue à la lyonnaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Morue à la lyonnaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Quenelles de brochet sauce Nantua
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Quenelles de brochet sauce Nantua'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Grenouilles en persillade
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Grenouilles en persillade'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Saveur-Herbacé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fricassée d''escargots
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fricassée d''''escargots'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Caillettes ardéchoises
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Caillettes ardéchoises'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Diots de Savoie au vin blanc
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Diots de Savoie au vin blanc'
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


-- Pounti auvergnat
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pounti auvergnat'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Farçous aveyronnais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Farçous aveyronnais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Crique ardéchoise (galette de pommes de terre)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Crique ardéchoise (galette de pommes de terre)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Cardons à la moelle lyonnais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cardons à la moelle lyonnais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gratin de cardons
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gratin de cardons'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tarte à l''oignon alsacienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tarte à l''''oignon alsacienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Salsifis à la crème
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Salsifis à la crème'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux', 'Arôme-Lacté')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poêlée de cèpes à la bordelaise
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poêlée de cèpes à la bordelaise'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Farcis niçois
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Farcis niçois'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pan bagnat (le vrai)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pan bagnat (le vrai)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Soupe au pistou
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Soupe au pistou'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tourton des Alpes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tourton des Alpes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Oreilles d''âne du Valgaudemar (gratin d''épinards)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Oreilles d''''âne du Valgaudemar (gratin d''''épinards)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pôchouse de Verdun-sur-le-Doubs (version légumes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pôchouse de Verdun-sur-le-Doubs (version légumes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Hiver')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pâté de pommes de terre du Limousin
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pâté de pommes de terre du Limousin'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Flaugnarde aux pommes
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Flaugnarde aux pommes'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Millassou (galette de pomme de terre)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Millassou (galette de pomme de terre)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Arôme-Fruité', 'Automne')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Escargots de Bourgogne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Escargots de Bourgogne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Lentilles vertes du Berry en salade
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Lentilles vertes du Berry en salade'
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


-- Ceviche péruvien
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Ceviche péruvien'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Lomo saltado (sauté de bœuf péruvien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Lomo saltado (sauté de bœuf péruvien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Intensité-Moyen')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Aji de gallina (poulet en sauce pimentée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Aji de gallina (poulet en sauce pimentée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Saveur-Épicé', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Feijoada brésilienne
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Feijoada brésilienne'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pão de queijo (pains au fromage brésiliens)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pão de queijo (pains au fromage brésiliens)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Intensité-Riche')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Moqueca de peixe (ragoût de poisson brésilien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Moqueca de peixe (ragoût de poisson brésilien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Marin')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Picadillo
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Picadillo'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Arroz con pollo
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Arroz con pollo'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Sancocho (soupe colombienne)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Sancocho (soupe colombienne)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bandeja paisa (plat complet colombien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bandeja paisa (plat complet colombien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Chiles rellenos (piments farcis mexicains)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Chiles rellenos (piments farcis mexicains)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Mexicaine', 'Végétarien', 'Saveur-Épicé')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Mole poblano
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Mole poblano'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Cochinita pibil
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Cochinita pibil'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pozole (soupe mexicaine)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pozole (soupe mexicaine)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Mexicaine', 'Végétarien', 'Texture-Liquide')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tamales
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tamales'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Pastel de choclo (gâteau de maïs chilien)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Pastel de choclo (gâteau de maïs chilien)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Humitas
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Humitas'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Gallo pinto (riz et haricots du Costa Rica)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Gallo pinto (riz et haricots du Costa Rica)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Patacones (bananes plantain frites)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Patacones (bananes plantain frites)'
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


-- Tajine de poulet aux citrons confits et olives
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tajine de poulet aux citrons confits et olives'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Française', 'Orientale', 'Saveur-Salé', 'Saveur-Acide', 'Intensité-Riche', 'Arôme-Agrumes')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tajine de kefta aux œufs
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tajine de kefta aux œufs'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Couscous royal (sept légumes, différentes viandes)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Couscous royal (sept légumes, différentes viandes)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Rfissa marocaine (poulet, lentilles, msemen)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Rfissa marocaine (poulet, lentilles, msemen)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Long')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Tanjia marrakchia
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Tanjia marrakchia'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Bissara (soupe de fèves)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Bissara (soupe de fèves)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Liquide', 'Printemps')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Zaalouk (salade d''aubergines cuite)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Zaalouk (salade d''''aubergines cuite)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Été')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Poulet Yassa sénégalais
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Poulet Yassa sénégalais'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Festif')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Mafé (sauce à base d''arachide)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Mafé (sauce à base d''''arachide)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien', 'Texture-Crémeux')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Thieboudienne (riz au poisson sénégalais)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Thieboudienne (riz au poisson sénégalais)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Arôme-Marin', 'Festif')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Injera (crêpe éthiopienne au teff)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Injera (crêpe éthiopienne au teff)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Shish Taouk (brochettes de poulet libanaises)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Shish Taouk (brochettes de poulet libanaises)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Barbecue')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Shawarma
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Shawarma'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Manakish au zaatar (pizza libanaise)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Manakish au zaatar (pizza libanaise)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Italienne', 'Orientale', 'Végétarien')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Dolmas (feuilles de vigne farcies)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Dolmas (feuilles de vigne farcies)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Arôme-Végétal')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Shakshuka (version plus élaborée)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Shakshuka (version plus élaborée)'
),
tag_refs AS (
  SELECT id, name FROM tags WHERE name IN ('Orientale', 'Végétarien', 'Difficile')
)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipe_ref r
CROSS JOIN tag_refs t
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


-- Fatteh (plat libanais à base de pain pita)
WITH recipe_ref AS (
  SELECT id FROM recipes WHERE name = 'Fatteh (plat libanais à base de pain pita)'
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
