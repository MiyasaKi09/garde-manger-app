-- Enrichissement massif des recettes
-- Association des tags de difficulté, saisons, occasions, profils

BEGIN;

-- Batch 1

-- Enrichissement de 631 recettes

-- Liste de 3000 Recettes du Monde, Faisables en France
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Liste de 3000 Recettes du Monde, Faisables en France'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 1 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 1 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Porridge d'avoine, pommes et cannelle
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Porridge d''avoine, pommes et cannelle'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Porridge d''avoine, pommes et cannelle'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Porridge d''avoine, pommes et cannelle'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Overnight porridge aux graines de chia et fruits rouges
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Overnight porridge aux graines de chia et fruits rouges'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Overnight porridge aux graines de chia et fruits rouges'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Porridge salé aux épinards, feta et œuf mollet
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Porridge salé aux épinards, feta et œuf mollet'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Porridge salé aux épinards, feta et œuf mollet'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Smoothie bowl tropical mangue-ananas-coco
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Smoothie bowl tropical mangue-ananas-coco'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Smoothie bowl tropical mangue-ananas-coco'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Smoothie bowl tropical mangue-ananas-coco'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Smoothie bowl vert épinards, kiwi et banane
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Smoothie bowl vert épinards, kiwi et banane'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Smoothie bowl vert épinards, kiwi et banane'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Smoothie bowl vert épinards, kiwi et banane'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Pudding de chia au lait de coco et coulis de mangue
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pudding de chia au lait de coco et coulis de mangue'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Granola maison aux noix de pécan et sirop d'érable
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Granola maison aux noix de pécan et sirop d''érable'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Granola maison aux noix de pécan et sirop d''érable'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Muesli Bircher aux pommes râpées et noisettes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Muesli Bircher aux pommes râpées et noisettes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Muesli Bircher aux pommes râpées et noisettes'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Muesli Bircher aux pommes râpées et noisettes'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Pancakes américains fluffy au sirop d'érable
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pancakes américains fluffy au sirop d''érable'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pancakes américains fluffy au sirop d''érable'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Pancakes à la banane sans sucre ajouté
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pancakes à la banane sans sucre ajouté'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pancakes à la banane sans sucre ajouté'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Pancakes salés au saumon fumé et aneth
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pancakes salés au saumon fumé et aneth'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pancakes salés au saumon fumé et aneth'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pancakes salés au saumon fumé et aneth'
  AND t.name = 'usage:Fête'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Crêpes fines au sucre et citron
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Crêpes fines au sucre et citron'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Gaufres de Liège au sucre perlé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Gaufres de Liège au sucre perlé'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Gaufres salées au jambon et fromage
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Gaufres salées au jambon et fromage'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Gaufres salées au jambon et fromage'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Œufs brouillés crémeux à la ciboulette
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Œufs brouillés crémeux à la ciboulette'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Œufs brouillés crémeux à la ciboulette'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Œuf poché sur toast d'avocat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Œuf poché sur toast d''avocat'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Œuf poché sur toast d''avocat'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Omelette aux champignons de Paris et persil
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Omelette aux champignons de Paris et persil'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Omelette aux champignons de Paris et persil'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Œufs au plat et bacon grillé (English style)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Œufs au plat et bacon grillé (English style)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Œufs au plat et bacon grillé (English style)'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Œufs au plat et bacon grillé (English style)'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Œufs au plat et bacon grillé (English style)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Pain perdu à la cannelle
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pain perdu à la cannelle'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pain perdu à la cannelle'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Brioche perdue aux fruits rouges
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Brioche perdue aux fruits rouges'
  AND t.name = 'difficulté:Difficile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Brioche perdue aux fruits rouges'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 2 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 2 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 21. Yaourt grec, miel et noix
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '21. Yaourt grec, miel et noix'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '21. Yaourt grec, miel et noix'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 22. Fromage blanc et compote de pommes maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '22. Fromage blanc et compote de pommes maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '22. Fromage blanc et compote de pommes maison'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '22. Fromage blanc et compote de pommes maison'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 23. Toast de pain complet, avocat et graines de sésame
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '23. Toast de pain complet, avocat et graines de sésame'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '23. Toast de pain complet, avocat et graines de sésame'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 24. Tartine de chèvre frais, miel et thym
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '24. Tartine de chèvre frais, miel et thym'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '24. Tartine de chèvre frais, miel et thym'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '24. Tartine de chèvre frais, miel et thym'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 25. Huevos Rotos (œufs cassés sur frites et jambon Serrano)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '25. Huevos Rotos (œufs cassés sur frites et jambon Serrano)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '25. Huevos Rotos (œufs cassés sur frites et jambon Serrano)'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 26. Pan con Tomate (pain grillé à la tomate et ail)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '26. Pan con Tomate (pain grillé à la tomate et ail)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '26. Pan con Tomate (pain grillé à la tomate et ail)'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '26. Pan con Tomate (pain grillé à la tomate et ail)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 27. Shakshuka (œufs pochés dans une sauce tomate épicée)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '27. Shakshuka (œufs pochés dans une sauce tomate épicée)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '27. Shakshuka (œufs pochés dans une sauce tomate épicée)'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '27. Shakshuka (œufs pochés dans une sauce tomate épicée)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 28. Full English Breakfast complet
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '28. Full English Breakfast complet'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 29. Œufs Bénédictine et sauce hollandaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '29. Œufs Bénédictine et sauce hollandaise'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '29. Œufs Bénédictine et sauce hollandaise'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 30. Tamagoyaki (omelette roulée japonaise)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '30. Tamagoyaki (omelette roulée japonaise)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 31. Gaspacho Andalou traditionnel
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '31. Gaspacho Andalou traditionnel'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 32. Salmorejo de Cordoue et ses garnitures
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '32. Salmorejo de Cordoue et ses garnitures'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 33. Soupe froide de concombre à la menthe
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '33. Soupe froide de concombre à la menthe'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 34. Velouté froid de courgettes au basilic
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '34. Velouté froid de courgettes au basilic'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '34. Velouté froid de courgettes au basilic'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '34. Velouté froid de courgettes au basilic'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 35. Verrine avocat, crevette et pamplemousse
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '35. Verrine avocat, crevette et pamplemousse'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '35. Verrine avocat, crevette et pamplemousse'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 36. Salade Caprese (tomate, mozzarella, basilic)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '36. Salade Caprese (tomate, mozzarella, basilic)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '36. Salade Caprese (tomate, mozzarella, basilic)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '36. Salade Caprese (tomate, mozzarella, basilic)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 37. Salade Grecque traditionnelle
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '37. Salade Grecque traditionnelle'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '37. Salade Grecque traditionnelle'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '37. Salade Grecque traditionnelle'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 38. Taboulé libanais (riche en persil)
INSERT INTO recipe_tags (recipe_id, tag_id)
COMMIT;