-- Enrichissement massif des recettes
-- Association des tags de difficulté, saisons, occasions, profils

BEGIN;

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
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '38. Taboulé libanais (riche en persil)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 39. Salade de lentilles vertes du Puy et lardons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '39. Salade de lentilles vertes du Puy et lardons'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '39. Salade de lentilles vertes du Puy et lardons'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '39. Salade de lentilles vertes du Puy et lardons'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 40. Salade César au poulet grillé et copeaux de parmesan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '40. Salade César au poulet grillé et copeaux de parmesan'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '40. Salade César au poulet grillé et copeaux de parmesan'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '40. Salade César au poulet grillé et copeaux de parmesan'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '40. Salade César au poulet grillé et copeaux de parmesan'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 3 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 3 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 41. Salade Niçoise classique
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '41. Salade Niçoise classique'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '41. Salade Niçoise classique'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '41. Salade Niçoise classique'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 42. Salade de chèvre chaud sur toast
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '42. Salade de chèvre chaud sur toast'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '42. Salade de chèvre chaud sur toast'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '42. Salade de chèvre chaud sur toast'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '42. Salade de chèvre chaud sur toast'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 43. Salade de pâtes à l'italienne (pesto, tomates séchées)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '43. Salade de pâtes à l''italienne (pesto, tomates séchées)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '43. Salade de pâtes à l''italienne (pesto, tomates séchées)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '43. Salade de pâtes à l''italienne (pesto, tomates séchées)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 44. Salade de riz au thon, maïs et poivrons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '44. Salade de riz au thon, maïs et poivrons'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '44. Salade de riz au thon, maïs et poivrons'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '44. Salade de riz au thon, maïs et poivrons'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 45. Salade piémontaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '45. Salade piémontaise'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '45. Salade piémontaise'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '45. Salade piémontaise'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 46. Bò bún vietnamien au bœuf
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '46. Bò bún vietnamien au bœuf'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 47. Houmous de pois chiches maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '47. Houmous de pois chiches maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '47. Houmous de pois chiches maison'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 48. Baba Ganoush (caviar d'aubergines fumées)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '48. Baba Ganoush (caviar d''aubergines fumées)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '48. Baba Ganoush (caviar d''aubergines fumées)'
  AND t.name = 'usage:Fête'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '48. Baba Ganoush (caviar d''aubergines fumées)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 49. Tzatziki grec au concombre et à l'aneth
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '49. Tzatziki grec au concombre et à l''aneth'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 50. Moutabal libanais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '50. Moutabal libanais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 51. Tapenade d'olives noires de Provence
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '51. Tapenade d''olives noires de Provence'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '51. Tapenade d''olives noires de Provence'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 52. Guacamole maison et chips de maïs
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '52. Guacamole maison et chips de maïs'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '52. Guacamole maison et chips de maïs'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 53. Bruschetta à la tomate fraîche et basilic
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '53. Bruschetta à la tomate fraîche et basilic'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '53. Bruschetta à la tomate fraîche et basilic'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '53. Bruschetta à la tomate fraîche et basilic'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 54. Crostinis au chèvre et figues
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '54. Crostinis au chèvre et figues'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 55. Tartinade de thon et St Môret
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '55. Tartinade de thon et St Môret'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 56. Rillettes de saumon frais et fumé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '56. Rillettes de saumon frais et fumé'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 57. Tortilla de patatas espagnole
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '57. Tortilla de patatas espagnole'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 58. Patatas bravas et leur sauce épicée
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '58. Patatas bravas et leur sauce épicée'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 59. Croquetas de jamón (croquettes de jambon)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '59. Croquetas de jamón (croquettes de jambon)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 60. Pimientos de Padrón grillés
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '60. Pimientos de Padrón grillés'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '60. Pimientos de Padrón grillés'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '60. Pimientos de Padrón grillés'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 4 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 4 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 61. Gambas al ajillo (crevettes à l'ail)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '61. Gambas al ajillo (crevettes à l''ail)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 62. Falafels de pois chiches, sauce tahini
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '62. Falafels de pois chiches, sauce tahini'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 63. Samoussas aux légumes et épices
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '63. Samoussas aux légumes et épices'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '63. Samoussas aux légumes et épices'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 64. Nems au porc et leur sauce
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '64. Nems au porc et leur sauce'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 65. Rouleaux de printemps aux crevettes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '65. Rouleaux de printemps aux crevettes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 66. Accras de morue antillais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '66. Accras de morue antillais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 67. Beignets de calamars à la romaine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '67. Beignets de calamars à la romaine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 68. Arancini siciliens (boules de risotto frites)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '68. Arancini siciliens (boules de risotto frites)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 69. Focaccia au romarin et à la fleur de sel
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '69. Focaccia au romarin et à la fleur de sel'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 70. Gressins italiens maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '70. Gressins italiens maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 71. Légumes grillés marinés à l'italienne (antipasti)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '71. Légumes grillés marinés à l''italienne (antipasti)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '71. Légumes grillés marinés à l''italienne (antipasti)'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '71. Légumes grillés marinés à l''italienne (antipasti)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '71. Légumes grillés marinés à l''italienne (antipasti)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 72. Artichauts à la romaine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '72. Artichauts à la romaine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '72. Artichauts à la romaine'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 73. Poivrons marinés à l'huile d'olive et à l'ail
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '73. Poivrons marinés à l''huile d''olive et à l''ail'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '73. Poivrons marinés à l''huile d''olive et à l''ail'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 74. Aubergines à la parmesane (Melanzane alla parmigiana)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '74. Aubergines à la parmesane (Melanzane alla parmigiana)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '74. Aubergines à la parmesane (Melanzane alla parmigiana)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 75. Velouté de potimarron et châtaignes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '75. Velouté de potimarron et châtaignes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '75. Velouté de potimarron et châtaignes'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 76. Soupe à l'oignon gratinée
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '76. Soupe à l''oignon gratinée'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '76. Soupe à l''oignon gratinée'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 77. Crème de lentilles corail au lait de coco
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '77. Crème de lentilles corail au lait de coco'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '77. Crème de lentilles corail au lait de coco'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 78. Soupe de poireaux-pommes de terre
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '78. Soupe de poireaux-pommes de terre'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '78. Soupe de poireaux-pommes de terre'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 79. Velouté Dubarry (chou-fleur)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '79. Velouté Dubarry (chou-fleur)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '79. Velouté Dubarry (chou-fleur)'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 80. Minestrone de légumes italiens
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '80. Minestrone de légumes italiens'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '80. Minestrone de légumes italiens'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 5 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 5 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 81. Soupe de poisson et sa rouille
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '81. Soupe de poisson et sa rouille'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 82. Bouillon thaï aux crevettes (Tom Yum)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '82. Bouillon thaï aux crevettes (Tom Yum)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 83. Soupe Phở au bœuf vietnamienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '83. Soupe Phở au bœuf vietnamienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 84. Soupe miso japonaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '84. Soupe miso japonaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 85. Harira marocaine (soupe de rupture du jeûne)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '85. Harira marocaine (soupe de rupture du jeûne)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 86. Chorba algérienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '86. Chorba algérienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 87. Œufs cocotte à la crème et aux lardons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '87. Œufs cocotte à la crème et aux lardons'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '87. Œufs cocotte à la crème et aux lardons'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '87. Œufs cocotte à la crème et aux lardons'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 88. Feuilletés saucisse à la moutarde
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '88. Feuilletés saucisse à la moutarde'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 89. Mini-brochettes de poulet mariné au satay
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '89. Mini-brochettes de poulet mariné au satay'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '89. Mini-brochettes de poulet mariné au satay'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '89. Mini-brochettes de poulet mariné au satay'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 90. Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '90. Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '90. Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '90. Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '90. Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 91. Roulés de courgette au fromage frais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '91. Roulés de courgette au fromage frais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '91. Roulés de courgette au fromage frais'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '91. Roulés de courgette au fromage frais'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '91. Roulés de courgette au fromage frais'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 92. Blinis au saumon fumé et crème à l'aneth
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '92. Blinis au saumon fumé et crème à l''aneth'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '92. Blinis au saumon fumé et crème à l''aneth'
  AND t.name = 'usage:Fête'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '92. Blinis au saumon fumé et crème à l''aneth'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 93. Champignons farcis à l'ail et au persil
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '93. Champignons farcis à l''ail et au persil'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '93. Champignons farcis à l''ail et au persil'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 94. Tomates provençales au four
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '94. Tomates provençales au four'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '94. Tomates provençales au four'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 95. Tarte soleil au pesto et parmesan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '95. Tarte soleil au pesto et parmesan'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 96. Gougères au fromage
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '96. Gougères au fromage'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '96. Gougères au fromage'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 97. Cake salé aux olives et au jambon
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '97. Cake salé aux olives et au jambon'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 98. Muffins salés au chorizo et poivron
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '98. Muffins salés au chorizo et poivron'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '98. Muffins salés au chorizo et poivron'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 99. Madeleines salées au chèvre et romarin
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '99. Madeleines salées au chèvre et romarin'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 100. Quiche Lorraine traditionnelle
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '100. Quiche Lorraine traditionnelle'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 6 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 6 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 101. Tarte aux poireaux et lardons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '101. Tarte aux poireaux et lardons'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '101. Tarte aux poireaux et lardons'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 102. Tarte à la tomate et à la moutarde
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '102. Tarte à la tomate et à la moutarde'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '102. Tarte à la tomate et à la moutarde'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 103. Tarte fine aux légumes du soleil et chèvre
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '103. Tarte fine aux légumes du soleil et chèvre'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '103. Tarte fine aux légumes du soleil et chèvre'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 104. Quiche sans pâte aux épinards et ricotta
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '104. Quiche sans pâte aux épinards et ricotta'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 105. Flammenkueche alsacienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '105. Flammenkueche alsacienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 106. Pizza Margherita
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '106. Pizza Margherita'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 107. Pizza Reine (jambon, champignons)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '107. Pizza Reine (jambon, champignons)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '107. Pizza Reine (jambon, champignons)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 108. Pizza 4 fromages
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '108. Pizza 4 fromages'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '108. Pizza 4 fromages'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 109. Calzone (pizza soufflée)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '109. Calzone (pizza soufflée)'
  AND t.name = 'difficulté:Difficile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 110. Poulet rôti du dimanche aux herbes de Provence
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '110. Poulet rôti du dimanche aux herbes de Provence'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 111. Poulet basquaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '111. Poulet basquaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 112. Poulet à la crème et aux champignons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '112. Poulet à la crème et aux champignons'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '112. Poulet à la crème et aux champignons'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '112. Poulet à la crème et aux champignons'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 113. Poulet vallée d'Auge (au cidre et à la crème)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '113. Poulet vallée d''Auge (au cidre et à la crème)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '113. Poulet vallée d''Auge (au cidre et à la crème)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 114. Coq au vin
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '114. Coq au vin'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 115. Waterzooi de poulet à la gantoise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '115. Waterzooi de poulet à la gantoise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 116. Escalopes de poulet à la milanaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '116. Escalopes de poulet à la milanaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 117. Escalopes de poulet panées au citron
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '117. Escalopes de poulet panées au citron'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 118. Saltimbocca de veau à la romaine (jambon de Parme, sauge)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '118. Saltimbocca de veau à la romaine (jambon de Parme, sauge)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 119. Piccata de veau au citron
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '119. Piccata de veau au citron'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 120. Blanquette de veau à l'ancienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '120. Blanquette de veau à l''ancienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '120. Blanquette de veau à l''ancienne'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 7 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 7 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 121. Osso buco à la milanaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '121. Osso buco à la milanaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 122. Rôti de veau Orloff
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '122. Rôti de veau Orloff'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 123. Sauté de veau Marengo
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '123. Sauté de veau Marengo'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 124. Paupiettes de veau en sauce
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '124. Paupiettes de veau en sauce'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 125. Bœuf bourguignon
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '125. Bœuf bourguignon'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '125. Bœuf bourguignon'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 126. Daube de bœuf provençale
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '126. Daube de bœuf provençale'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 127. Carbonnade flamande
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '127. Carbonnade flamande'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 128. Pot-au-feu et ses légumes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '128. Pot-au-feu et ses légumes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '128. Pot-au-feu et ses légumes'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '128. Pot-au-feu et ses légumes'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 129. Hachis Parmentier
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '129. Hachis Parmentier'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 130. Steak frites, sauce au poivre
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '130. Steak frites, sauce au poivre'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 131. Entrecôte grillée, sauce béarnaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '131. Entrecôte grillée, sauce béarnaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '131. Entrecôte grillée, sauce béarnaise'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '131. Entrecôte grillée, sauce béarnaise'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 132. Tartare de bœuf préparé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '132. Tartare de bœuf préparé'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '132. Tartare de bœuf préparé'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 133. Carpaccio de bœuf, parmesan et roquette
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '133. Carpaccio de bœuf, parmesan et roquette'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '133. Carpaccio de bœuf, parmesan et roquette'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 134. Bœuf Stroganoff
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '134. Bœuf Stroganoff'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 135. Goulash de bœuf hongrois
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '135. Goulash de bœuf hongrois'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 136. Chili con carne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '136. Chili con carne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 137. Boulettes de bœuf à la sauce tomate
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '137. Boulettes de bœuf à la sauce tomate'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '137. Boulettes de bœuf à la sauce tomate'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 138. Kefta de bœuf à la marocaine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '138. Kefta de bœuf à la marocaine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 139. Bœuf loc lac cambodgien
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '139. Bœuf loc lac cambodgien'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 140. Bœuf sauté aux oignons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '140. Bœuf sauté aux oignons'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 8 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 8 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 141. Bœuf sauté au gingembre et à la ciboulette
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '141. Bœuf sauté au gingembre et à la ciboulette'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 142. Bibimbap coréen au bœuf
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '142. Bibimbap coréen au bœuf'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 143. Bulgogi (barbecue coréen)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '143. Bulgogi (barbecue coréen)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '143. Bulgogi (barbecue coréen)'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '143. Bulgogi (barbecue coréen)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 144. Gyudon japonais (bol de riz au bœuf)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '144. Gyudon japonais (bol de riz au bœuf)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 145. Rôti de porc à la moutarde
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '145. Rôti de porc à la moutarde'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 146. Filet mignon de porc en croûte
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '146. Filet mignon de porc en croûte'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 147. Sauté de porc au caramel
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '147. Sauté de porc au caramel'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 148. Porc à l'aigre-douce
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '148. Porc à l''aigre-douce'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 149. Rougail saucisse réunionnais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '149. Rougail saucisse réunionnais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 150. Saucisses de Toulouse et purée maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '150. Saucisses de Toulouse et purée maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 151. Travers de porc (ribs) sauce barbecue
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '151. Travers de porc (ribs) sauce barbecue'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '151. Travers de porc (ribs) sauce barbecue'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '151. Travers de porc (ribs) sauce barbecue'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 152. Pulled pork (effiloché de porc)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '152. Pulled pork (effiloché de porc)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 153. Porc Tonkatsu japonais (escalope panée)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '153. Porc Tonkatsu japonais (escalope panée)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 154. Jambon à l'os braisé au madère
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '154. Jambon à l''os braisé au madère'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 155. Gigot d'agneau de sept heures
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '155. Gigot d''agneau de sept heures'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 156. Navarin d'agneau printainier
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '156. Navarin d''agneau printainier'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 157. Souris d'agneau confites au miel et au thym
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '157. Souris d''agneau confites au miel et au thym'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '157. Souris d''agneau confites au miel et au thym'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 158. Curry d'agneau à l'indienne (Rogan Josh)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '158. Curry d''agneau à l''indienne (Rogan Josh)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 159. Moussaka grecque
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '159. Moussaka grecque'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 160. Tajine d'agneau aux pruneaux et amandes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '160. Tajine d''agneau aux pruneaux et amandes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 9 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 9 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 161. Brochettes d'agneau marinées au citron et origan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '161. Brochettes d''agneau marinées au citron et origan'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '161. Brochettes d''agneau marinées au citron et origan'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '161. Brochettes d''agneau marinées au citron et origan'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 162. Côtelettes d'agneau grillées à l'ail
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '162. Côtelettes d''agneau grillées à l''ail'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '162. Côtelettes d''agneau grillées à l''ail'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '162. Côtelettes d''agneau grillées à l''ail'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 163. Shepherd's pie (hachis Parmentier d'agneau)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '163. Shepherd''s pie (hachis Parmentier d''agneau)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 164. Kefta d'agneau et semoule
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '164. Kefta d''agneau et semoule'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 165. Magret de canard, sauce au poivre vert
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '165. Magret de canard, sauce au poivre vert'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 166. Confit de canard et pommes de terre sarladaises
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '166. Confit de canard et pommes de terre sarladaises'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '166. Confit de canard et pommes de terre sarladaises'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '166. Confit de canard et pommes de terre sarladaises'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 167. Canard laqué pékinois (version simplifiée)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '167. Canard laqué pékinois (version simplifiée)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 168. Parmentier de canard
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '168. Parmentier de canard'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 169. Lapin à la moutarde
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '169. Lapin à la moutarde'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 170. Lapin chasseur
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '170. Lapin chasseur'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 171. Cassoulet de Toulouse
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '171. Cassoulet de Toulouse'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '171. Cassoulet de Toulouse'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 172. Choucroute garnie alsacienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '172. Choucroute garnie alsacienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '172. Choucroute garnie alsacienne'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 173. Petit salé aux lentilles
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '173. Petit salé aux lentilles'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 174. Andouillette de Troyes, sauce moutarde
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '174. Andouillette de Troyes, sauce moutarde'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 175. Boudin noir aux pommes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '175. Boudin noir aux pommes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '175. Boudin noir aux pommes'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 176. Saucisson de Lyon pistaché en brioche
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '176. Saucisson de Lyon pistaché en brioche'
  AND t.name = 'difficulté:Difficile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '176. Saucisson de Lyon pistaché en brioche'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 177. Far breton (version salée aux pruneaux et lard)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '177. Far breton (version salée aux pruneaux et lard)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 178. Crêpes salées complètes (jambon, œuf, fromage)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '178. Crêpes salées complètes (jambon, œuf, fromage)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '178. Crêpes salées complètes (jambon, œuf, fromage)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 179. Galettes de sarrasin bretonnes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '179. Galettes de sarrasin bretonnes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 180. Moules marinières
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '180. Moules marinières'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 10 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 10 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 181. Moules à la crème et aux frites
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '181. Moules à la crème et aux frites'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '181. Moules à la crème et aux frites'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 182. Moules au curry
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '182. Moules au curry'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 183. Moules à la provençale
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '183. Moules à la provençale'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 184. Paella valenciana
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '184. Paella valenciana'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 185. Paella aux fruits de mer
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '185. Paella aux fruits de mer'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 186. Zarzuela de mariscos (cassolette de poissons espagnole)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '186. Zarzuela de mariscos (cassolette de poissons espagnole)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 187. Marmitako (ragoût de thon basque)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '187. Marmitako (ragoût de thon basque)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '187. Marmitako (ragoût de thon basque)'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 188. Fideuà (paella de vermicelles)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '188. Fideuà (paella de vermicelles)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 189. Lotte à l'américaine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '189. Lotte à l''américaine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 190. Bouillabaisse marseillaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '190. Bouillabaisse marseillaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 191. Bourride sétoise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '191. Bourride sétoise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 192. Brandade de morue de Nîmes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '192. Brandade de morue de Nîmes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 193. Aïoli provençal et ses légumes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '193. Aïoli provençal et ses légumes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '193. Aïoli provençal et ses légumes'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 194. Pavé de saumon à l'unilatérale
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '194. Pavé de saumon à l''unilatérale'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 195. Saumon en papillote, julienne de légumes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '195. Saumon en papillote, julienne de légumes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '195. Saumon en papillote, julienne de légumes'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 196. Saumon teriyaki
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '196. Saumon teriyaki'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 197. Saumon à la plancha, sauce vierge
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '197. Saumon à la plancha, sauce vierge'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 198. Lasagnes au saumon et épinards
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '198. Lasagnes au saumon et épinards'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 199. Tartare de saumon à l'aneth et au citron vert
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '199. Tartare de saumon à l''aneth et au citron vert'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '199. Tartare de saumon à l''aneth et au citron vert'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 200. Gravlax de saumon maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '200. Gravlax de saumon maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 11 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 11 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 201. Brochettes de saumon marinées
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '201. Brochettes de saumon marinées'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '201. Brochettes de saumon marinées'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '201. Brochettes de saumon marinées'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 202. Quiche au saumon et poireaux
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '202. Quiche au saumon et poireaux'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '202. Quiche au saumon et poireaux'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 203. Dos de cabillaud en croûte de chorizo
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '203. Dos de cabillaud en croûte de chorizo'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 204. Cabillaud à la bordelaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '204. Cabillaud à la bordelaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 205. Cabillaud skrei poêlé, purée de panais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '205. Cabillaud skrei poêlé, purée de panais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 206. Fish and chips britannique
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '206. Fish and chips britannique'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 207. Waterzooi de poisson
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '207. Waterzooi de poisson'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 208. Curry de poisson au lait de coco
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '208. Curry de poisson au lait de coco'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 209. Thon mi-cuit au sésame
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '209. Thon mi-cuit au sésame'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 210. Steak de thon à la sicilienne (olives, câpres)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '210. Steak de thon à la sicilienne (olives, câpres)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 211. Bar en croûte de sel
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '211. Bar en croûte de sel'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 212. Dorade royale au four et fenouil
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '212. Dorade royale au four et fenouil'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 213. Filet de sole meunière
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '213. Filet de sole meunière'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 214. Raie au beurre noir et aux câpres
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '214. Raie au beurre noir et aux câpres'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '214. Raie au beurre noir et aux câpres'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 215. Maquereaux marinés au vin blanc
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '215. Maquereaux marinés au vin blanc'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 216. Sardines grillées au barbecue
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '216. Sardines grillées au barbecue'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '216. Sardines grillées au barbecue'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '216. Sardines grillées au barbecue'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 217. Coquilles Saint-Jacques poêlées, fondue de poireaux
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '217. Coquilles Saint-Jacques poêlées, fondue de poireaux'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '217. Coquilles Saint-Jacques poêlées, fondue de poireaux'
  AND t.name = 'usage:Fête'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '217. Coquilles Saint-Jacques poêlées, fondue de poireaux'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '217. Coquilles Saint-Jacques poêlées, fondue de poireaux'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 218. Noix de Saint-Jacques snackées, purée de carottes au cumin
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '218. Noix de Saint-Jacques snackées, purée de carottes au cumin'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '218. Noix de Saint-Jacques snackées, purée de carottes au cumin'
  AND t.name = 'usage:Fête'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 219. Risotto aux Saint-Jacques et asperges
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '219. Risotto aux Saint-Jacques et asperges'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '219. Risotto aux Saint-Jacques et asperges'
  AND t.name = 'usage:Fête'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '219. Risotto aux Saint-Jacques et asperges'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 220. Crevettes sautées à l'ail et au persil
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '220. Crevettes sautées à l''ail et au persil'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 12 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 12 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 221. Curry de crevettes et lait de coco
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '221. Curry de crevettes et lait de coco'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 222. Pâtes aux crevettes, ail, huile et piment
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '222. Pâtes aux crevettes, ail, huile et piment'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 223. Crevettes à l'armoricaine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '223. Crevettes à l''armoricaine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 224. Wok de crevettes aux légumes croquants
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '224. Wok de crevettes aux légumes croquants'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '224. Wok de crevettes aux légumes croquants'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 225. Pad Thaï aux crevettes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '225. Pad Thaï aux crevettes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 226. Brochettes de gambas à la plancha
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '226. Brochettes de gambas à la plancha'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '226. Brochettes de gambas à la plancha'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '226. Brochettes de gambas à la plancha'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 227. Calamars à la romaine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '227. Calamars à la romaine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 228. Encornets farcis à la sétoise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '228. Encornets farcis à la sétoise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 229. Seiches à la plancha en persillade
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '229. Seiches à la plancha en persillade'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 230. Poulpe à la galicienne (Pulpo a la gallega)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '230. Poulpe à la galicienne (Pulpo a la gallega)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 231. Soupe de lentilles corail, carotte et cumin
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '231. Soupe de lentilles corail, carotte et cumin'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 232. Dahl de lentilles indien
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '232. Dahl de lentilles indien'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 233. Salade de lentilles, carottes et oignons rouges
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '233. Salade de lentilles, carottes et oignons rouges'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '233. Salade de lentilles, carottes et oignons rouges'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '233. Salade de lentilles, carottes et oignons rouges'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 234. Bolognaise de lentilles vertes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '234. Bolognaise de lentilles vertes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 235. Curry de pois chiches et épinards
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '235. Curry de pois chiches et épinards'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 236. Pois chiches rôtis aux épices
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '236. Pois chiches rôtis aux épices'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 237. Salade de pois chiches à la méditerranéenne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '237. Salade de pois chiches à la méditerranéenne'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '237. Salade de pois chiches à la méditerranéenne'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '237. Salade de pois chiches à la méditerranéenne'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 238. Chili sin carne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '238. Chili sin carne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 239. Haricots blancs à la bretonne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '239. Haricots blancs à la bretonne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 240. Fèves à la catalane
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '240. Fèves à la catalane'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '240. Fèves à la catalane'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 13 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 13 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 241. Socca niçoise (galette de farine de pois chiches)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '241. Socca niçoise (galette de farine de pois chiches)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 242. Panisses marseillaises
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '242. Panisses marseillaises'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 243. Lasagnes végétariennes aux légumes du soleil
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '243. Lasagnes végétariennes aux légumes du soleil'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '243. Lasagnes végétariennes aux légumes du soleil'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 244. Lasagnes aux épinards et à la ricotta
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '244. Lasagnes aux épinards et à la ricotta'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 245. Risotto aux champignons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '245. Risotto aux champignons'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '245. Risotto aux champignons'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 246. Risotto aux asperges et parmesan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '246. Risotto aux asperges et parmesan'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '246. Risotto aux asperges et parmesan'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 247. Risotto à la milanaise (au safran)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '247. Risotto à la milanaise (au safran)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 248. Risotto aux courgettes et menthe
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '248. Risotto aux courgettes et menthe'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '248. Risotto aux courgettes et menthe'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '248. Risotto aux courgettes et menthe'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 249. Risotto à la tomate et mozzarella
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '249. Risotto à la tomate et mozzarella'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '249. Risotto à la tomate et mozzarella'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 250. Pâtes à la sauce tomate et basilic frais (al pomodoro)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '250. Pâtes à la sauce tomate et basilic frais (al pomodoro)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '250. Pâtes à la sauce tomate et basilic frais (al pomodoro)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 251. Pâtes all'arrabbiata
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '251. Pâtes all''arrabbiata'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 252. Pâtes alla puttanesca
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '252. Pâtes alla puttanesca'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 253. Pâtes à la carbonara (la vraie, sans crème)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '253. Pâtes à la carbonara (la vraie, sans crème)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '253. Pâtes à la carbonara (la vraie, sans crème)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 254. Pâtes cacio e pepe
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '254. Pâtes cacio e pepe'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 255. Pâtes à l'amatriciana
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '255. Pâtes à l''amatriciana'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 256. Pâtes au pesto alla genovese
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '256. Pâtes au pesto alla genovese'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 257. Pâtes aux palourdes (alle vongole)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '257. Pâtes aux palourdes (alle vongole)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 258. Pâtes aux fruits de mer (allo scoglio)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '258. Pâtes aux fruits de mer (allo scoglio)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 259. Pâtes alla norma (aubergines, ricotta salata)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '259. Pâtes alla norma (aubergines, ricotta salata)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '259. Pâtes alla norma (aubergines, ricotta salata)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 260. Gnocchis de pommes de terre, sauce sauge et beurre
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '260. Gnocchis de pommes de terre, sauce sauge et beurre'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '260. Gnocchis de pommes de terre, sauce sauge et beurre'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '260. Gnocchis de pommes de terre, sauce sauge et beurre'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 14 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 14 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 261. Gnocchis à la sorrentina (sauce tomate, mozzarella)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '261. Gnocchis à la sorrentina (sauce tomate, mozzarella)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '261. Gnocchis à la sorrentina (sauce tomate, mozzarella)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 262. Raviolis aux épinards et ricotta, sauce tomate
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '262. Raviolis aux épinards et ricotta, sauce tomate'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '262. Raviolis aux épinards et ricotta, sauce tomate'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 263. Cannellonis farcis à la bolognaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '263. Cannellonis farcis à la bolognaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 264. Spaghettis aux boulettes de viande (style italo-américain)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '264. Spaghettis aux boulettes de viande (style italo-américain)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 265. Macaroni and cheese américain (gratin de macaronis)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '265. Macaroni and cheese américain (gratin de macaronis)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '265. Macaroni and cheese américain (gratin de macaronis)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 266. Gratin de pâtes au jambon et béchamel
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '266. Gratin de pâtes au jambon et béchamel'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '266. Gratin de pâtes au jambon et béchamel'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 267. One pot pasta tomate, basilic, mozzarella
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '267. One pot pasta tomate, basilic, mozzarella'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '267. One pot pasta tomate, basilic, mozzarella'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 268. Pâtes au citron et à la crème
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '268. Pâtes au citron et à la crème'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '268. Pâtes au citron et à la crème'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 269. Salade de pâtes estivale
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '269. Salade de pâtes estivale'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '269. Salade de pâtes estivale'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '269. Salade de pâtes estivale'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 270. Pâtes fraîches maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '270. Pâtes fraîches maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 271. Tofu sauté aux légumes et sauce soja
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '271. Tofu sauté aux légumes et sauce soja'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '271. Tofu sauté aux légumes et sauce soja'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 272. Tofu mariné et grillé au sésame
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '272. Tofu mariné et grillé au sésame'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '272. Tofu mariné et grillé au sésame'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '272. Tofu mariné et grillé au sésame'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 273. Tofu général Tao
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '273. Tofu général Tao'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 274. Tofu Mapo (recette sichuanaise)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '274. Tofu Mapo (recette sichuanaise)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 275. Curry de tofu et légumes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '275. Curry de tofu et légumes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '275. Curry de tofu et légumes'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 276. Tofu brouillé (alternative aux œufs)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '276. Tofu brouillé (alternative aux œufs)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '276. Tofu brouillé (alternative aux œufs)'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 277. Tofu Katsu (pané et frit)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '277. Tofu Katsu (pané et frit)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 278. Seitan bourguignon
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '278. Seitan bourguignon'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '278. Seitan bourguignon'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 279. Sauté de seitan et brocolis
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '279. Sauté de seitan et brocolis'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 280. Burger de seitan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '280. Burger de seitan'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 15 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 15 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 281. Tempeh laqué à l'indonésienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '281. Tempeh laqué à l''indonésienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 282. Buddha bowl au quinoa, patates douces et avocat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '282. Buddha bowl au quinoa, patates douces et avocat'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '282. Buddha bowl au quinoa, patates douces et avocat'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 283. Salade de quinoa, concombre, feta et menthe
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '283. Salade de quinoa, concombre, feta et menthe'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '283. Salade de quinoa, concombre, feta et menthe'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '283. Salade de quinoa, concombre, feta et menthe'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 284. Quinoa façon taboulé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '284. Quinoa façon taboulé'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '284. Quinoa façon taboulé'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 285. Galettes de quinoa et carottes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '285. Galettes de quinoa et carottes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '285. Galettes de quinoa et carottes'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 286. Gratin de quinoa aux légumes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '286. Gratin de quinoa aux légumes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '286. Gratin de quinoa aux légumes'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '286. Gratin de quinoa aux légumes'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 287. Gratin dauphinois traditionnel
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '287. Gratin dauphinois traditionnel'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '287. Gratin dauphinois traditionnel'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 288. Gratin de courgettes à la menthe
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '288. Gratin de courgettes à la menthe'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '288. Gratin de courgettes à la menthe'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '288. Gratin de courgettes à la menthe'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '288. Gratin de courgettes à la menthe'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 289. Gratin de chou-fleur à la béchamel
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '289. Gratin de chou-fleur à la béchamel'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '289. Gratin de chou-fleur à la béchamel'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '289. Gratin de chou-fleur à la béchamel'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 290. Gratin de brocolis au parmesan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '290. Gratin de brocolis au parmesan'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '290. Gratin de brocolis au parmesan'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 291. Tian de légumes provençal
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '291. Tian de légumes provençal'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '291. Tian de légumes provençal'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 292. Ratatouille niçoise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '292. Ratatouille niçoise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 293. Piperade basque
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '293. Piperade basque'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 294. Poêlée de légumes du soleil
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '294. Poêlée de légumes du soleil'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '294. Poêlée de légumes du soleil'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 295. Poêlée de champignons en persillade
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '295. Poêlée de champignons en persillade'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '295. Poêlée de champignons en persillade'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 296. Wok de légumes sauce aigre-douce
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '296. Wok de légumes sauce aigre-douce'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '296. Wok de légumes sauce aigre-douce'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 297. Légumes rôtis au four (carottes, panais, patates douces)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '297. Légumes rôtis au four (carottes, panais, patates douces)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '297. Légumes rôtis au four (carottes, panais, patates douces)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 298. Frites de patates douces au paprika
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '298. Frites de patates douces au paprika'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 299. Purée de pommes de terre maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '299. Purée de pommes de terre maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '299. Purée de pommes de terre maison'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 300. Purée de carottes au cumin
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '300. Purée de carottes au cumin'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 16 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 16 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 301. Purée de panais à la noisette
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '301. Purée de panais à la noisette'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 302. Purée de céleri-rave
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '302. Purée de céleri-rave'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 303. Écrasé de pommes de terre à l'huile d'olive et ail
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '303. Écrasé de pommes de terre à l''huile d''olive et ail'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '303. Écrasé de pommes de terre à l''huile d''olive et ail'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 304. Pommes de terre suédoises (Hasselback)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '304. Pommes de terre suédoises (Hasselback)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '304. Pommes de terre suédoises (Hasselback)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 305. Pommes dauphine maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '305. Pommes dauphine maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '305. Pommes dauphine maison'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 306. Aligot de l'Aubrac
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '306. Aligot de l''Aubrac'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 307. Truffade auvergnate
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '307. Truffade auvergnate'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 308. Poêlée de haricots verts à l'ail et persil
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '308. Poêlée de haricots verts à l''ail et persil'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 309. Frites de polenta au parmesan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '309. Frites de polenta au parmesan'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 310. Polenta crémeuse
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '310. Polenta crémeuse'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 311. Endives braisées au jambon
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '311. Endives braisées au jambon'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '311. Endives braisées au jambon'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 312. Asperges vertes rôties au parmesan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '312. Asperges vertes rôties au parmesan'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '312. Asperges vertes rôties au parmesan'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 313. Fondue de poireaux à la crème
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '313. Fondue de poireaux à la crème'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '313. Fondue de poireaux à la crème'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '313. Fondue de poireaux à la crème'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '313. Fondue de poireaux à la crème'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 314. Épinards frais à la crème
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '314. Épinards frais à la crème'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '314. Épinards frais à la crème'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 315. Choux de Bruxelles rôtis au lard et sirop d'érable
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '315. Choux de Bruxelles rôtis au lard et sirop d''érable'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '315. Choux de Bruxelles rôtis au lard et sirop d''érable'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 316. Carottes glacées à l'orange
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '316. Carottes glacées à l''orange'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 317. Betteraves rôties au miel et au thym
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '317. Betteraves rôties au miel et au thym'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 318. Fenouil braisé à l'anis
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '318. Fenouil braisé à l''anis'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 319. Riz pilaf aux amandes et raisins secs
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '319. Riz pilaf aux amandes et raisins secs'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 320. Semoule aux légumes (accompagnement tajine)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '320. Semoule aux légumes (accompagnement tajine)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '320. Semoule aux légumes (accompagnement tajine)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 17 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 17 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 321. Curry de légumes thaïlandais au lait de coco
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '321. Curry de légumes thaïlandais au lait de coco'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '321. Curry de légumes thaïlandais au lait de coco'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 322. Palak Paneer (épinards au fromage indien)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '322. Palak Paneer (épinards au fromage indien)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '322. Palak Paneer (épinards au fromage indien)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 323. Aloo Gobi (curry de chou-fleur et pommes de terre)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '323. Aloo Gobi (curry de chou-fleur et pommes de terre)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '323. Aloo Gobi (curry de chou-fleur et pommes de terre)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '323. Aloo Gobi (curry de chou-fleur et pommes de terre)'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 324. Chana Masala (curry de pois chiches épicé)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '324. Chana Masala (curry de pois chiches épicé)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 325. Baingan Bharta (caviar d'aubergine indien)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '325. Baingan Bharta (caviar d''aubergine indien)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '325. Baingan Bharta (caviar d''aubergine indien)'
  AND t.name = 'usage:Fête'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '325. Baingan Bharta (caviar d''aubergine indien)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 326. Samosas aux légumes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '326. Samosas aux légumes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '326. Samosas aux légumes'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 327. Pakoras d'oignons (beignets indiens)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '327. Pakoras d''oignons (beignets indiens)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 328. Caponata sicilienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '328. Caponata sicilienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 329. Pâtes aux brocolis et anchois
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '329. Pâtes aux brocolis et anchois'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 330. Risotto de petit épeautre aux champignons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '330. Risotto de petit épeautre aux champignons'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '330. Risotto de petit épeautre aux champignons'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 331. Galettes de sarrasin aux champignons et crème
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '331. Galettes de sarrasin aux champignons et crème'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '331. Galettes de sarrasin aux champignons et crème'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '331. Galettes de sarrasin aux champignons et crème'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 332. Crozets en gratin au beaufort (croziflette)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '332. Crozets en gratin au beaufort (croziflette)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '332. Crozets en gratin au beaufort (croziflette)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 333. Tarte au maroilles
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '333. Tarte au maroilles'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 334. Pissaladière niçoise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '334. Pissaladière niçoise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 335. Tourte aux blettes sucrée-salée
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '335. Tourte aux blettes sucrée-salée'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 336. Gözleme turc aux épinards et feta
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '336. Gözleme turc aux épinards et feta'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 337. Börek aux épinards
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '337. Börek aux épinards'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 338. Fattoush (salade libanaise au pain pita grillé)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '338. Fattoush (salade libanaise au pain pita grillé)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '338. Fattoush (salade libanaise au pain pita grillé)'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '338. Fattoush (salade libanaise au pain pita grillé)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '338. Fattoush (salade libanaise au pain pita grillé)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 339. Koshari égyptien (riz, lentilles, pâtes, sauce tomate)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '339. Koshari égyptien (riz, lentilles, pâtes, sauce tomate)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '339. Koshari égyptien (riz, lentilles, pâtes, sauce tomate)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 340. Mjadra (riz aux lentilles et oignons frits)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '340. Mjadra (riz aux lentilles et oignons frits)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 18 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 18 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 341. Salade Waldorf (céleri, pomme, noix)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '341. Salade Waldorf (céleri, pomme, noix)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '341. Salade Waldorf (céleri, pomme, noix)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '341. Salade Waldorf (céleri, pomme, noix)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '341. Salade Waldorf (céleri, pomme, noix)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 342. Coleslaw américain
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '342. Coleslaw américain'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 343. Salade de pommes de terre allemande (Kartoffelsalat)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '343. Salade de pommes de terre allemande (Kartoffelsalat)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '343. Salade de pommes de terre allemande (Kartoffelsalat)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '343. Salade de pommes de terre allemande (Kartoffelsalat)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '343. Salade de pommes de terre allemande (Kartoffelsalat)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 344. Salade de concombre à la danoise (Agurkesalat)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '344. Salade de concombre à la danoise (Agurkesalat)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '344. Salade de concombre à la danoise (Agurkesalat)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '344. Salade de concombre à la danoise (Agurkesalat)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 345. Salade de betteraves crues, pomme verte et noisettes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '345. Salade de betteraves crues, pomme verte et noisettes'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '345. Salade de betteraves crues, pomme verte et noisettes'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '345. Salade de betteraves crues, pomme verte et noisettes'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '345. Salade de betteraves crues, pomme verte et noisettes'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 346. Salade de fenouil à l'orange et aux olives noires
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '346. Salade de fenouil à l''orange et aux olives noires'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '346. Salade de fenouil à l''orange et aux olives noires'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '346. Salade de fenouil à l''orange et aux olives noires'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 347. Salade de carottes râpées au citron et cumin
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '347. Salade de carottes râpées au citron et cumin'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '347. Salade de carottes râpées au citron et cumin'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '347. Salade de carottes râpées au citron et cumin'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 348. Salade de chou rouge aux pommes et aux noix
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '348. Salade de chou rouge aux pommes et aux noix'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '348. Salade de chou rouge aux pommes et aux noix'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '348. Salade de chou rouge aux pommes et aux noix'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '348. Salade de chou rouge aux pommes et aux noix'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '348. Salade de chou rouge aux pommes et aux noix'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 349. Salade de pâtes grecque (feta, olives, concombre)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '349. Salade de pâtes grecque (feta, olives, concombre)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '349. Salade de pâtes grecque (feta, olives, concombre)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '349. Salade de pâtes grecque (feta, olives, concombre)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 350. Salade de lentilles corail, carottes et coco
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '350. Salade de lentilles corail, carottes et coco'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '350. Salade de lentilles corail, carottes et coco'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '350. Salade de lentilles corail, carottes et coco'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 351. Taboulé de chou-fleur
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '351. Taboulé de chou-fleur'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '351. Taboulé de chou-fleur'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 352. Salade d'endives, noix et roquefort
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '352. Salade d''endives, noix et roquefort'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '352. Salade d''endives, noix et roquefort'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '352. Salade d''endives, noix et roquefort'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '352. Salade d''endives, noix et roquefort'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 353. Salade lyonnaise (lardons, croûtons, œuf poché)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '353. Salade lyonnaise (lardons, croûtons, œuf poché)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '353. Salade lyonnaise (lardons, croûtons, œuf poché)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '353. Salade lyonnaise (lardons, croûtons, œuf poché)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 354. Salade landaise (gésiers, magret fumé)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '354. Salade landaise (gésiers, magret fumé)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '354. Salade landaise (gésiers, magret fumé)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '354. Salade landaise (gésiers, magret fumé)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 355. Salade de haricots verts, tomates et oignons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '355. Salade de haricots verts, tomates et oignons'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '355. Salade de haricots verts, tomates et oignons'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '355. Salade de haricots verts, tomates et oignons'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 356. Ajo Blanco (soupe froide d'amandes espagnole)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '356. Ajo Blanco (soupe froide d''amandes espagnole)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 357. Vichyssoise (soupe froide poireaux-pommes de terre)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '357. Vichyssoise (soupe froide poireaux-pommes de terre)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '357. Vichyssoise (soupe froide poireaux-pommes de terre)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 358. Soupe froide de melon à la menthe et au porto
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '358. Soupe froide de melon à la menthe et au porto'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '358. Soupe froide de melon à la menthe et au porto'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 359. Okroshka (soupe froide russe au kvas)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '359. Okroshka (soupe froide russe au kvas)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 360. Salade de poulpe et pommes de terre
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '360. Salade de poulpe et pommes de terre'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '360. Salade de poulpe et pommes de terre'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '360. Salade de poulpe et pommes de terre'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '360. Salade de poulpe et pommes de terre'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 19 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 19 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 361. Burger de bœuf classique, cheddar et bacon
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '361. Burger de bœuf classique, cheddar et bacon'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 362. Burger de poulet croustillant
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '362. Burger de poulet croustillant'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 363. Burger végétarien aux haricots noirs
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '363. Burger végétarien aux haricots noirs'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 364. Hot-dog new-yorkais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '364. Hot-dog new-yorkais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 365. Sandwich Club au poulet et bacon
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '365. Sandwich Club au poulet et bacon'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 366. Sandwich Reuben (pastrami, choucroute)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '366. Sandwich Reuben (pastrami, choucroute)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '366. Sandwich Reuben (pastrami, choucroute)'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 367. Pan Bagnat niçois
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '367. Pan Bagnat niçois'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 368. Croque-Monsieur
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '368. Croque-Monsieur'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 369. Croque-Madame
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '369. Croque-Madame'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 370. Welsh rarebit
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '370. Welsh rarebit'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 371. Kebab maison (pain pita, viande grillée, sauce blanche)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '371. Kebab maison (pain pita, viande grillée, sauce blanche)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '371. Kebab maison (pain pita, viande grillée, sauce blanche)'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '371. Kebab maison (pain pita, viande grillée, sauce blanche)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 372. Gyros grec au porc
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '372. Gyros grec au porc'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 373. Wrap au poulet César
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '373. Wrap au poulet César'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 374. Wrap au houmous, falafels et crudités
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '374. Wrap au houmous, falafels et crudités'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '374. Wrap au houmous, falafels et crudités'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 375. Bagel au saumon fumé et cream cheese
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '375. Bagel au saumon fumé et cream cheese'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '375. Bagel au saumon fumé et cream cheese'
  AND t.name = 'usage:Fête'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 376. Focaccia garnie (jambon de parme, roquette, mozzarella)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '376. Focaccia garnie (jambon de parme, roquette, mozzarella)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 377. Arepas vénézuéliennes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '377. Arepas vénézuéliennes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 378. Empanadas argentines à la viande
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '378. Empanadas argentines à la viande'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 379. Tacos al pastor mexicains
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '379. Tacos al pastor mexicains'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 380. Quesadillas au fromage et poulet
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '380. Quesadillas au fromage et poulet'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '380. Quesadillas au fromage et poulet'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 20 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 20 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 381. Ramen japonais au porc chashu
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '381. Ramen japonais au porc chashu'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 382. Udon sauté au bœuf
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '382. Udon sauté au bœuf'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 383. Soba froides et leur sauce tsuyu
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '383. Soba froides et leur sauce tsuyu'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 384. Yaki Soba (nouilles sautées japonaises)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '384. Yaki Soba (nouilles sautées japonaises)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 385. Riz cantonais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '385. Riz cantonais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 386. Nasi Goreng indonésien
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '386. Nasi Goreng indonésien'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 387. Riz sauté thaï à l'ananas et aux crevettes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '387. Riz sauté thaï à l''ananas et aux crevettes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 388. Dan Dan noodles sichuanaises
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '388. Dan Dan noodles sichuanaises'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 389. Nouilles sautées au poulet et légumes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '389. Nouilles sautées au poulet et légumes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '389. Nouilles sautées au poulet et légumes'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 390. Japchae (nouilles de patate douce coréennes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '390. Japchae (nouilles de patate douce coréennes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 391. Soupe de nouilles wonton
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '391. Soupe de nouilles wonton'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 392. Laksa de Singapour (soupe de nouilles épicée)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '392. Laksa de Singapour (soupe de nouilles épicée)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 393. Poulet katsu curry japonais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '393. Poulet katsu curry japonais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 394. Oyakodon (bol de riz au poulet et à l'œuf)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '394. Oyakodon (bol de riz au poulet et à l''œuf)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 395. Katsudon (bol de riz au porc pané)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '395. Katsudon (bol de riz au porc pané)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 396. Onigiri japonais (boules de riz farcies)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '396. Onigiri japonais (boules de riz farcies)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 397. Congee de riz (porridge de riz salé)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '397. Congee de riz (porridge de riz salé)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '397. Congee de riz (porridge de riz salé)'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 398. Riz gluant à la mangue thaïlandais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '398. Riz gluant à la mangue thaïlandais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 399. Kimchi Jjigae (ragoût de kimchi coréen)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '399. Kimchi Jjigae (ragoût de kimchi coréen)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '399. Kimchi Jjigae (ragoût de kimchi coréen)'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 400. Tteokbokki (gâteaux de riz épicés coréens)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '400. Tteokbokki (gâteaux de riz épicés coréens)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 21 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 21 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 401. Crème brûlée à la vanille
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '401. Crème brûlée à la vanille'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '401. Crème brûlée à la vanille'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 402. Mousse au chocolat noir
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '402. Mousse au chocolat noir'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '402. Mousse au chocolat noir'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 403. Île flottante et sa crème anglaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '403. Île flottante et sa crème anglaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '403. Île flottante et sa crème anglaise'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 404. Profiteroles au chocolat chaud
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '404. Profiteroles au chocolat chaud'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '404. Profiteroles au chocolat chaud'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 405. Tarte Tatin aux pommes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '405. Tarte Tatin aux pommes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '405. Tarte Tatin aux pommes'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 406. Tarte au citron meringuée
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '406. Tarte au citron meringuée'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 407. Tarte Bourdaloue (poires et amandes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '407. Tarte Bourdaloue (poires et amandes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '407. Tarte Bourdaloue (poires et amandes)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 408. Clafoutis aux cerises
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '408. Clafoutis aux cerises'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '408. Clafoutis aux cerises'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 409. Far breton aux pruneaux
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '409. Far breton aux pruneaux'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 410. Canelés de Bordeaux
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '410. Canelés de Bordeaux'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 411. Macarons parisiens (pistache, chocolat, framboise)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '411. Macarons parisiens (pistache, chocolat, framboise)'
  AND t.name = 'difficulté:Difficile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '411. Macarons parisiens (pistache, chocolat, framboise)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 412. Paris-Brest (pâte à choux, crème pralinée)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '412. Paris-Brest (pâte à choux, crème pralinée)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '412. Paris-Brest (pâte à choux, crème pralinée)'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '412. Paris-Brest (pâte à choux, crème pralinée)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 413. Éclair au café ou au chocolat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '413. Éclair au café ou au chocolat'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '413. Éclair au café ou au chocolat'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 414. Religieuse au chocolat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '414. Religieuse au chocolat'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '414. Religieuse au chocolat'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 415. Saint-Honoré
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '415. Saint-Honoré'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 416. Fraisier
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '416. Fraisier'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 417. Opéra
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '417. Opéra'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 418. Mille-feuille
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '418. Mille-feuille'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 419. Soufflé au Grand Marnier
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '419. Soufflé au Grand Marnier'
  AND t.name = 'difficulté:Difficile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 420. Riz au lait à la vanille
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '420. Riz au lait à la vanille'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 22 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 22 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 421. Tiramisu classique au café
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '421. Tiramisu classique au café'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 422. Panna Cotta et son coulis de fruits rouges
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '422. Panna Cotta et son coulis de fruits rouges'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 423. Tiramisu aux fraises
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '423. Tiramisu aux fraises'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '423. Tiramisu aux fraises'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 424. Panna Cotta au caramel beurre salé
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '424. Panna Cotta au caramel beurre salé'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '424. Panna Cotta au caramel beurre salé'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 425. Zabaione au Marsala
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '425. Zabaione au Marsala'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 426. Cannoli siciliens à la ricotta
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '426. Cannoli siciliens à la ricotta'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 427. Torta della nonna (tarte à la crème pâtissière et pignons)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '427. Torta della nonna (tarte à la crème pâtissière et pignons)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '427. Torta della nonna (tarte à la crème pâtissière et pignons)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 428. Torta caprese (gâteau au chocolat et amandes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '428. Torta caprese (gâteau au chocolat et amandes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '428. Torta caprese (gâteau au chocolat et amandes)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 429. Semifreddo au nougat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '429. Semifreddo au nougat'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 430. Gelato à la pistache maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '430. Gelato à la pistache maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 431. Affogato (glace vanille noyée dans un expresso)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '431. Affogato (glace vanille noyée dans un expresso)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '431. Affogato (glace vanille noyée dans un expresso)'
  AND t.name = 'profil:Rapide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 432. Panettone (version maison)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '432. Panettone (version maison)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 433. Cantucci (croquants aux amandes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '433. Cantucci (croquants aux amandes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 434. Bonet piémontais (flan au chocolat et amaretti)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '434. Bonet piémontais (flan au chocolat et amaretti)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '434. Bonet piémontais (flan au chocolat et amaretti)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 435. Pêches au vin
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '435. Pêches au vin'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '435. Pêches au vin'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 436. Sbrisolona (gâteau friable aux amandes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '436. Sbrisolona (gâteau friable aux amandes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 437. Crostata à la confiture d'abricots
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '437. Crostata à la confiture d''abricots'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '437. Crostata à la confiture d''abricots'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '437. Crostata à la confiture d''abricots'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 438. Salame al cioccolato (saucisson au chocolat)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '438. Salame al cioccolato (saucisson au chocolat)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '438. Salame al cioccolato (saucisson au chocolat)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 439. Sfogliatelle napolitaines
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '439. Sfogliatelle napolitaines'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 440. Pastiera napolitaine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '440. Pastiera napolitaine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 23 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 23 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 441. Cheesecake new-yorkais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '441. Cheesecake new-yorkais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 442. Brownie au chocolat et noix de pécan
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '442. Brownie au chocolat et noix de pécan'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '442. Brownie au chocolat et noix de pécan'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 443. Cookies aux pépites de chocolat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '443. Cookies aux pépites de chocolat'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '443. Cookies aux pépites de chocolat'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 444. Apple pie américaine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '444. Apple pie américaine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 445. Pumpkin pie (tarte à la citrouille)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '445. Pumpkin pie (tarte à la citrouille)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '445. Pumpkin pie (tarte à la citrouille)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 446. Pecan pie (tarte aux noix de pécan)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '446. Pecan pie (tarte aux noix de pécan)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 447. Carrot cake et son glaçage au cream cheese
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '447. Carrot cake et son glaçage au cream cheese'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 448. Red velvet cake
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '448. Red velvet cake'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 449. Muffins aux myrtilles
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '449. Muffins aux myrtilles'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 450. Cupcakes à la vanille et glaçage
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '450. Cupcakes à la vanille et glaçage'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 451. Banana bread
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '451. Banana bread'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 452. Key lime pie (tarte au citron vert)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '452. Key lime pie (tarte au citron vert)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 453. Crumble aux pommes et à la cannelle
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '453. Crumble aux pommes et à la cannelle'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '453. Crumble aux pommes et à la cannelle'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 454. Sticky toffee pudding
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '454. Sticky toffee pudding'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 455. Eton mess (meringue, fraises, crème)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '455. Eton mess (meringue, fraises, crème)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '455. Eton mess (meringue, fraises, crème)'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '455. Eton mess (meringue, fraises, crème)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 456. Scones britanniques, clotted cream et confiture
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '456. Scones britanniques, clotted cream et confiture'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '456. Scones britanniques, clotted cream et confiture'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 457. Trifle anglais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '457. Trifle anglais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 458. Banoffee pie
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '458. Banoffee pie'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 459. Bread and butter pudding
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '459. Bread and butter pudding'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 460. Shortbread écossais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '460. Shortbread écossais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 24 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 24 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 461. Forêt-Noire allemande (Schwarzwälder Kirschtorte)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '461. Forêt-Noire allemande (Schwarzwälder Kirschtorte)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 462. Apfelstrudel autrichien
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '462. Apfelstrudel autrichien'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 463. Sacher Torte viennoise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '463. Sacher Torte viennoise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 464. Linzer Torte
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '464. Linzer Torte'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 465. Churros espagnols et leur chocolat chaud
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '465. Churros espagnols et leur chocolat chaud'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '465. Churros espagnols et leur chocolat chaud'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 466. Crème catalane
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '466. Crème catalane'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '466. Crème catalane'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 467. Tarta de Santiago (gâteau aux amandes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '467. Tarta de Santiago (gâteau aux amandes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 468. Leche frita (lait frit)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '468. Leche frita (lait frit)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 469. Pastel de nata portugais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '469. Pastel de nata portugais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 470. Gâteau basque à la crème ou à la cerise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '470. Gâteau basque à la crème ou à la cerise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '470. Gâteau basque à la crème ou à la cerise'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '470. Gâteau basque à la crème ou à la cerise'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 471. Loukoumades grecs (beignets au miel)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '471. Loukoumades grecs (beignets au miel)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 472. Baklava
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '472. Baklava'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 473. Halva
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '473. Halva'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 474. Basboussa (gâteau de semoule)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '474. Basboussa (gâteau de semoule)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 475. Cornes de gazelle marocaines
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '475. Cornes de gazelle marocaines'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 476. Mochi japonais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '476. Mochi japonais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 477. Dorayaki (pancakes japonais fourrés)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '477. Dorayaki (pancakes japonais fourrés)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '477. Dorayaki (pancakes japonais fourrés)'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 478. Gâteau de lune chinois
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '478. Gâteau de lune chinois'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 479. Alfajores argentins
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '479. Alfajores argentins'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 480. Brigadeiros brésiliens
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '480. Brigadeiros brésiliens'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 25 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 25 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 481. Salade de fruits frais de saison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '481. Salade de fruits frais de saison'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '481. Salade de fruits frais de saison'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '481. Salade de fruits frais de saison'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 482. Carpaccio d'ananas à la menthe et au citron vert
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '482. Carpaccio d''ananas à la menthe et au citron vert'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '482. Carpaccio d''ananas à la menthe et au citron vert'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 483. Fraises au sucre et jus de citron
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '483. Fraises au sucre et jus de citron'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '483. Fraises au sucre et jus de citron'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 484. Soupe de fraises à la menthe
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '484. Soupe de fraises à la menthe'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '484. Soupe de fraises à la menthe'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 485. Poires Belle-Hélène
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '485. Poires Belle-Hélène'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '485. Poires Belle-Hélène'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 486. Pêches Melba
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '486. Pêches Melba'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '486. Pêches Melba'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 487. Pommes au four, miel et cannelle
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '487. Pommes au four, miel et cannelle'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '487. Pommes au four, miel et cannelle'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 488. Bananes flambées au rhum
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '488. Bananes flambées au rhum'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 489. Salade d'oranges à la cannelle
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '489. Salade d''oranges à la cannelle'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '489. Salade d''oranges à la cannelle'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '489. Salade d''oranges à la cannelle'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 490. Gratin de fruits rouges
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '490. Gratin de fruits rouges'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '490. Gratin de fruits rouges'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 491. Tarte fine aux pommes sur pâte feuilletée
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '491. Tarte fine aux pommes sur pâte feuilletée'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '491. Tarte fine aux pommes sur pâte feuilletée'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 492. Compote de pommes maison sans sucre ajouté
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '492. Compote de pommes maison sans sucre ajouté'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '492. Compote de pommes maison sans sucre ajouté'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 493. Crumble aux fruits rouges et flocons d'avoine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '493. Crumble aux fruits rouges et flocons d''avoine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 494. Sorbet maison (citron, framboise)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '494. Sorbet maison (citron, framboise)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 495. Nice cream (glace à la banane congelée)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '495. Nice cream (glace à la banane congelée)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 496. Energy balls aux dattes et noix de cajou
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '496. Energy balls aux dattes et noix de cajou'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 497. Barres de céréales maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '497. Barres de céréales maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 498. Yaourt glacé (frozen yogurt) aux fruits
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '498. Yaourt glacé (frozen yogurt) aux fruits'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '498. Yaourt glacé (frozen yogurt) aux fruits'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 499. Mousse d'avocat au cacao
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '499. Mousse d''avocat au cacao'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 500. Pommes en tranches et beurre de cacahuètes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '500. Pommes en tranches et beurre de cacahuètes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '500. Pommes en tranches et beurre de cacahuètes'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '500. Pommes en tranches et beurre de cacahuètes'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 26 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 26 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 501. Baguette tradition française
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '501. Baguette tradition française'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 502. Pain de campagne au levain
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '502. Pain de campagne au levain'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 503. Pain complet maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '503. Pain complet maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 504. Pain aux céréales
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '504. Pain aux céréales'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 505. Pain de seigle
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '505. Pain de seigle'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 506. Pain de mie maison
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '506. Pain de mie maison'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 507. Pains à burger (buns)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '507. Pains à burger (buns)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 508. Pains pita
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '508. Pains pita'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 509. Naans indiens au fromage
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '509. Naans indiens au fromage'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '509. Naans indiens au fromage'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 510. Chapatis
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '510. Chapatis'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 511. Pain à la semoule (khobz)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '511. Pain à la semoule (khobz)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 512. Bretzels alsaciens
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '512. Bretzels alsaciens'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 513. Ciabatta italienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '513. Ciabatta italienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 514. Pain brioché
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '514. Pain brioché'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 515. Croissants au beurre
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '515. Croissants au beurre'
  AND t.name = 'difficulté:Difficile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '515. Croissants au beurre'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '515. Croissants au beurre'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 516. Pains au chocolat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '516. Pains au chocolat'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '516. Pains au chocolat'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 517. Pains aux raisins
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '517. Pains aux raisins'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 518. Brioche tressée
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '518. Brioche tressée'
  AND t.name = 'difficulté:Difficile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '518. Brioche tressée'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 519. Kouglof alsacien
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '519. Kouglof alsacien'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 520. Chinois (gâteau brioché à la crème)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '520. Chinois (gâteau brioché à la crème)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '520. Chinois (gâteau brioché à la crème)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 27 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 27 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 521. Baeckeoffe alsacien
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '521. Baeckeoffe alsacien'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 522. Tripes à la mode de Caen
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '522. Tripes à la mode de Caen'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 523. Potjevleesch flamand
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '523. Potjevleesch flamand'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 524. Axoa de veau basque
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '524. Axoa de veau basque'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 525. Daube niçoise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '525. Daube niçoise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 526. Pieds paquets marseillais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '526. Pieds paquets marseillais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 527. Alouettes sans tête provençales
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '527. Alouettes sans tête provençales'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 528. Fricassée de volaille à l'angevine
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '528. Fricassée de volaille à l''angevine'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 529. Poule au pot
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '529. Poule au pot'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 530. Coquilles Saint-Jacques à la bretonne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '530. Coquilles Saint-Jacques à la bretonne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '530. Coquilles Saint-Jacques à la bretonne'
  AND t.name = 'usage:Fête'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 531. Cotriade bretonne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '531. Cotriade bretonne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 532. Matelote d'anguille
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '532. Matelote d''anguille'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 533. Lamproie à la bordelaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '533. Lamproie à la bordelaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 534. Ttoro (soupe de poisson basque)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '534. Ttoro (soupe de poisson basque)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 535. Morue à la lyonnaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '535. Morue à la lyonnaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 536. Quenelles de brochet sauce Nantua
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '536. Quenelles de brochet sauce Nantua'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 537. Grenouilles en persillade
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '537. Grenouilles en persillade'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 538. Fricassée d'escargots
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '538. Fricassée d''escargots'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 539. Caillettes ardéchoises
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '539. Caillettes ardéchoises'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 540. Diots de Savoie au vin blanc
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '540. Diots de Savoie au vin blanc'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 28 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 28 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 541. Pounti auvergnat
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '541. Pounti auvergnat'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 542. Farçous aveyronnais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '542. Farçous aveyronnais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 543. Crique ardéchoise (galette de pommes de terre)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '543. Crique ardéchoise (galette de pommes de terre)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '543. Crique ardéchoise (galette de pommes de terre)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 544. Cardons à la moelle lyonnais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '544. Cardons à la moelle lyonnais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 545. Gratin de cardons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '545. Gratin de cardons'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '545. Gratin de cardons'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 546. Salade de pissenlits aux lardons
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '546. Salade de pissenlits aux lardons'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '546. Salade de pissenlits aux lardons'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '546. Salade de pissenlits aux lardons'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 547. Tarte à l'oignon alsacienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '547. Tarte à l''oignon alsacienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 548. Salsifis à la crème
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '548. Salsifis à la crème'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '548. Salsifis à la crème'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 549. Poêlée de cèpes à la bordelaise
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '549. Poêlée de cèpes à la bordelaise'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '549. Poêlée de cèpes à la bordelaise'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 550. Farcis niçois
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '550. Farcis niçois'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 551. Pan bagnat (le vrai)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '551. Pan bagnat (le vrai)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 552. Soupe au pistou
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '552. Soupe au pistou'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 553. Tourton des Alpes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '553. Tourton des Alpes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 554. Oreilles d'âne du Valgaudemar (gratin d'épinards)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '554. Oreilles d''âne du Valgaudemar (gratin d''épinards)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '554. Oreilles d''âne du Valgaudemar (gratin d''épinards)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 555. Pôchouse de Verdun-sur-le-Doubs (version légumes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '555. Pôchouse de Verdun-sur-le-Doubs (version légumes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '555. Pôchouse de Verdun-sur-le-Doubs (version légumes)'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '555. Pôchouse de Verdun-sur-le-Doubs (version légumes)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 556. Pâté de pommes de terre du Limousin
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '556. Pâté de pommes de terre du Limousin'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '556. Pâté de pommes de terre du Limousin'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 557. Flaugnarde aux pommes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '557. Flaugnarde aux pommes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '557. Flaugnarde aux pommes'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 558. Millassou (galette de pomme de terre)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '558. Millassou (galette de pomme de terre)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '558. Millassou (galette de pomme de terre)'
  AND t.name = 'saison:Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 559. Escargots de Bourgogne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '559. Escargots de Bourgogne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 560. Lentilles vertes du Berry en salade
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '560. Lentilles vertes du Berry en salade'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '560. Lentilles vertes du Berry en salade'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '560. Lentilles vertes du Berry en salade'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 29 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 29 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 561. Ceviche péruvien
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '561. Ceviche péruvien'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 562. Lomo saltado (sauté de bœuf péruvien)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '562. Lomo saltado (sauté de bœuf péruvien)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 563. Aji de gallina (poulet en sauce pimentée)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '563. Aji de gallina (poulet en sauce pimentée)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 564. Feijoada brésilienne
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '564. Feijoada brésilienne'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 565. Pão de queijo (pains au fromage brésiliens)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '565. Pão de queijo (pains au fromage brésiliens)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '565. Pão de queijo (pains au fromage brésiliens)'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 566. Moqueca de peixe (ragoût de poisson brésilien)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '566. Moqueca de peixe (ragoût de poisson brésilien)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '566. Moqueca de peixe (ragoût de poisson brésilien)'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 567. Ropa vieja cubaine (bœuf effiloché)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '567. Ropa vieja cubaine (bœuf effiloché)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 568. Picadillo
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '568. Picadillo'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 569. Arroz con pollo
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '569. Arroz con pollo'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 570. Sancocho (soupe colombienne)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '570. Sancocho (soupe colombienne)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 571. Bandeja paisa (plat complet colombien)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '571. Bandeja paisa (plat complet colombien)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 572. Chiles rellenos (piments farcis mexicains)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '572. Chiles rellenos (piments farcis mexicains)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 573. Mole poblano
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '573. Mole poblano'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 574. Cochinita pibil
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '574. Cochinita pibil'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 575. Pozole (soupe mexicaine)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '575. Pozole (soupe mexicaine)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 576. Tamales
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '576. Tamales'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 577. Pastel de choclo (gâteau de maïs chilien)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '577. Pastel de choclo (gâteau de maïs chilien)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 578. Humitas
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '578. Humitas'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 579. Gallo pinto (riz et haricots du Costa Rica)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '579. Gallo pinto (riz et haricots du Costa Rica)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 580. Patacones (bananes plantain frites)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '580. Patacones (bananes plantain frites)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- --- Batch 30 ---
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 30 ---'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 581. Tajine de poulet aux citrons confits et olives
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '581. Tajine de poulet aux citrons confits et olives'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '581. Tajine de poulet aux citrons confits et olives'
  AND t.name = 'profil:Gourmand'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 582. Tajine de kefta aux œufs
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '582. Tajine de kefta aux œufs'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '582. Tajine de kefta aux œufs'
  AND t.name = 'usage:Petit-déjeuner'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 583. Couscous royal (sept légumes, différentes viandes)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '583. Couscous royal (sept légumes, différentes viandes)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '583. Couscous royal (sept légumes, différentes viandes)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 584. Pastilla au poulet et aux amandes
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '584. Pastilla au poulet et aux amandes'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 585. Rfissa marocaine (poulet, lentilles, msemen)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '585. Rfissa marocaine (poulet, lentilles, msemen)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 586. Tanjia marrakchia
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '586. Tanjia marrakchia'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 587. Bissara (soupe de fèves)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '587. Bissara (soupe de fèves)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '587. Bissara (soupe de fèves)'
  AND t.name = 'saison:Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 588. Zaalouk (salade d'aubergines cuite)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '588. Zaalouk (salade d''aubergines cuite)'
  AND t.name = 'difficulté:Facile'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '588. Zaalouk (salade d''aubergines cuite)'
  AND t.name = 'saison:Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '588. Zaalouk (salade d''aubergines cuite)'
  AND t.name = 'profil:Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 589. Poulet Yassa sénégalais
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '589. Poulet Yassa sénégalais'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 590. Mafé (sauce à base d'arachide)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '590. Mafé (sauce à base d''arachide)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 591. Thieboudienne (riz au poisson sénégalais)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '591. Thieboudienne (riz au poisson sénégalais)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 592. Doro Wat (ragoût de poulet éthiopien)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '592. Doro Wat (ragoût de poulet éthiopien)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '592. Doro Wat (ragoût de poulet éthiopien)'
  AND t.name = 'saison:Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 593. Injera (crêpe éthiopienne au teff)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '593. Injera (crêpe éthiopienne au teff)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 594. Shish Taouk (brochettes de poulet libanaises)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '594. Shish Taouk (brochettes de poulet libanaises)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '594. Shish Taouk (brochettes de poulet libanaises)'
  AND t.name = 'usage:Apéritif'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '594. Shish Taouk (brochettes de poulet libanaises)'
  AND t.name = 'usage:Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 595. Shawarma
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '595. Shawarma'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 596. Manakish au zaatar (pizza libanaise)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '596. Manakish au zaatar (pizza libanaise)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 597. Kibbeh (boulettes de boulgour et viande)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '597. Kibbeh (boulettes de boulgour et viande)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 598. Dolmas (feuilles de vigne farcies)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '598. Dolmas (feuilles de vigne farcies)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 599. Shakshuka (version plus élaborée)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '599. Shakshuka (version plus élaborée)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- 600. Fatteh (plat libanais à base de pain pita)
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '600. Fatteh (plat libanais à base de pain pita)'
  AND t.name = 'difficulté:Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;


COMMIT;

-- ✅ 631 recettes enrichies