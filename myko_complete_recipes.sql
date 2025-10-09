-- ============================================
-- SCRIPT: Complétion des données recettes Myko
-- Description: Ajout des ingrédients manquants et liaison des recettes
-- ============================================

-- 1. Vérifier les recettes existantes
SELECT 
  r.id,
  r.name,
  r.description,
  COUNT(ri.id) as nb_ingredients
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
GROUP BY r.id, r.name, r.description
ORDER BY r.id;

-- 2. Vérifier les ingrédients disponibles dans canonical_foods
SELECT 
  id,
  name,
  category,
  subcategory
FROM canonical_foods
ORDER BY category, name;

-- 3. Ajouter les ingrédients manquants dans canonical_foods
-- (Ces ingrédients sont couramment utilisés dans les recettes)

INSERT INTO canonical_foods (name, category, subcategory, myko_category, created_at) VALUES
-- Fruits rouges et baies
('Myrtilles fraîches', 'Fruits', 'Fruits rouges', 'fruits_legumes', NOW()),
('Framboises fraîches', 'Fruits', 'Fruits rouges', 'fruits_legumes', NOW()),
('Mûres fraîches', 'Fruits', 'Fruits rouges', 'fruits_legumes', NOW()),
('Fraises fraîches', 'Fruits', 'Fruits rouges', 'fruits_legumes', NOW()),

-- Céréales et graines
('Granola maison', 'Céréales', 'Granola', 'cereales_graines', NOW()),
('Graines de chia', 'Graines', 'Graines oléagineuses', 'cereales_graines', NOW()),
('Graines de lin', 'Graines', 'Graines oléagineuses', 'cereales_graines', NOW()),
('Graines de tournesol', 'Graines', 'Graines oléagineuses', 'cereales_graines', NOW()),
('Flocons d''avoine', 'Céréales', 'Avoine', 'cereales_graines', NOW()),

-- Ingrédients pour pancakes
('Farine de blé T55', 'Farines', 'Farine de blé', 'cereales_graines', NOW()),
('Levure chimique', 'Additifs', 'Levures', 'condiments_epices', NOW()),
('Lait entier', 'Produits laitiers', 'Laits', 'produits_laitiers', NOW()),
('Œufs de poule', 'Produits animaux', 'Œufs', 'proteines_animales', NOW()),
('Beurre doux', 'Produits laitiers', 'Beurres', 'matieres_grasses', NOW()),
('Sucre blanc', 'Sucrants', 'Sucres raffinés', 'condiments_epices', NOW()),

-- Épices et aromates
('Cannelle moulue', 'Épices', 'Épices douces', 'condiments_epices', NOW()),
('Vanille liquide', 'Arômes', 'Extraits', 'condiments_epices', NOW()),
('Sel fin de cuisine', 'Condiments', 'Sels', 'condiments_epices', NOW()),

-- Légumes méditerranéens
('Quinoa blanc', 'Céréales', 'Pseudo-céréales', 'cereales_graines', NOW()),
('Tomates cerises', 'Légumes', 'Tomates', 'fruits_legumes', NOW()),
('Concombre', 'Légumes', 'Cucurbitacées', 'fruits_legumes', NOW()),
('Poivron rouge', 'Légumes', 'Poivrons', 'fruits_legumes', NOW()),
('Olives noires', 'Légumes', 'Olives', 'fruits_legumes', NOW()),
('Feta', 'Fromages', 'Fromages de brebis', 'produits_laitiers', NOW()),
('Huile d''olive vierge', 'Huiles', 'Huiles végétales', 'matieres_grasses', NOW()),
('Citron jaune', 'Fruits', 'Agrumes', 'fruits_legumes', NOW()),

-- Légumineuses et épices indiennes
('Lentilles corail', 'Légumineuses', 'Lentilles', 'proteines_vegetales', NOW()),
('Lait de coco', 'Laits végétaux', 'Laits de coco', 'produits_laitiers', NOW()),
('Curcuma moulu', 'Épices', 'Épices chaudes', 'condiments_epices', NOW()),
('Cumin moulu', 'Épices', 'Épices chaudes', 'condiments_epices', NOW()),
('Coriandre moulue', 'Épices', 'Épices douces', 'condiments_epices', NOW()),
('Gingembre frais', 'Légumes', 'Racines', 'fruits_legumes', NOW()),
('Ail', 'Légumes', 'Alliacées', 'fruits_legumes', NOW()),
('Oignon jaune', 'Légumes', 'Alliacées', 'fruits_legumes', NOW()),

-- Légumes pour tarte
('Courgettes', 'Légumes', 'Cucurbitacées', 'fruits_legumes', NOW()),
('Aubergines', 'Légumes', 'Solanacées', 'fruits_legumes', NOW()),
('Pâte brisée', 'Pâtisserie', 'Pâtes', 'cereales_graines', NOW()),
('Gruyère râpé', 'Fromages', 'Fromages à pâte dure', 'produits_laitiers', NOW())

ON CONFLICT (name) DO NOTHING;

-- 4. Lier les recettes à leurs ingrédients
-- Smoothie bowl aux baies (ID 1)
INSERT INTO recipe_ingredients (recipe_id, canonical_food_id, quantity, unit, notes, created_at)
SELECT 1, cf.id, ri.quantity, ri.unit, ri.notes, NOW()
FROM (VALUES
  ('Myrtilles fraîches', 100, 'g', 'Fraîches ou surgelées'),
  ('Framboises fraîches', 80, 'g', 'Fraîches de préférence'),
  ('Fraises fraîches', 120, 'g', 'Équeutées et coupées'),
  ('Granola maison', 50, 'g', 'Croustillant'),
  ('Graines de chia', 15, 'g', 'Trempées 10 min'),
  ('Graines de lin', 10, 'g', 'Moulues'),
  ('Lait entier', 200, 'ml', 'Ou lait végétal'),
  ('Miel', 20, 'g', 'Au goût')
) AS ri(name, quantity, unit, notes)
JOIN canonical_foods cf ON cf.name = ri.name
ON CONFLICT (recipe_id, canonical_food_id) DO NOTHING;

-- Pancakes moelleux (ID 2)
INSERT INTO recipe_ingredients (recipe_id, canonical_food_id, quantity, unit, notes, created_at)
SELECT 2, cf.id, ri.quantity, ri.unit, ri.notes, NOW()
FROM (VALUES
  ('Farine de blé T55', 250, 'g', 'Tamisée'),
  ('Levure chimique', 10, 'g', '2 cuillères à café'),
  ('Sucre blanc', 40, 'g', 'Sucre en poudre'),
  ('Sel fin de cuisine', 3, 'g', 'Une pincée'),
  ('Lait entier', 300, 'ml', 'À température ambiante'),
  ('Œufs de poule', 2, 'unité', 'Gros œufs'),
  ('Beurre doux', 50, 'g', 'Fondu et refroidi'),
  ('Vanille liquide', 5, 'ml', 'Extrait naturel')
) AS ri(name, quantity, unit, notes)
JOIN canonical_foods cf ON cf.name = ri.name
ON CONFLICT (recipe_id, canonical_food_id) DO NOTHING;

-- Porridge aux fruits (ID 3)
INSERT INTO recipe_ingredients (recipe_id, canonical_food_id, quantity, unit, notes, created_at)
SELECT 3, cf.id, ri.quantity, ri.unit, ri.notes, NOW()
FROM (VALUES
  ('Flocons d''avoine', 80, 'g', 'Gros flocons'),
  ('Lait entier', 250, 'ml', 'Ou lait d''amande'),
  ('Miel', 25, 'g', 'Miel d''acacia'),
  ('Cannelle moulue', 2, 'g', 'En poudre'),
  ('Pommes', 150, 'g', 'Coupées en dés'),
  ('Noix', 30, 'g', 'Concassées')
) AS ri(name, quantity, unit, notes)
JOIN canonical_foods cf ON cf.name = ri.name
ON CONFLICT (recipe_id, canonical_food_id) DO NOTHING;

-- Salade de quinoa méditerranéenne (ID 4) - si elle existe
INSERT INTO recipe_ingredients (recipe_id, canonical_food_id, quantity, unit, notes, created_at)
SELECT 4, cf.id, ri.quantity, ri.unit, ri.notes, NOW()
FROM (VALUES
  ('Quinoa blanc', 200, 'g', 'Rincé à l''eau froide'),
  ('Tomates cerises', 300, 'g', 'Coupées en deux'),
  ('Concombre', 200, 'g', 'Coupé en dés'),
  ('Poivron rouge', 150, 'g', 'Coupé en lanières'),
  ('Olives noires', 100, 'g', 'Dénoyautées'),
  ('Feta', 150, 'g', 'Émiettée'),
  ('Huile d''olive vierge', 60, 'ml', 'Première pression'),
  ('Citron jaune', 1, 'unité', 'Jus seulement'),
  ('Ail', 2, 'gousse', 'Hachée finement')
) AS ri(name, quantity, unit, notes)
JOIN canonical_foods cf ON cf.name = ri.name
WHERE EXISTS (SELECT 1 FROM recipes WHERE id = 4)
ON CONFLICT (recipe_id, canonical_food_id) DO NOTHING;

-- Curry de lentilles épicé (ID 5) - si elle existe
INSERT INTO recipe_ingredients (recipe_id, canonical_food_id, quantity, unit, notes, created_at)
SELECT 5, cf.id, ri.quantity, ri.unit, ri.notes, NOW()
FROM (VALUES
  ('Lentilles corail', 300, 'g', 'Rincées'),
  ('Lait de coco', 400, 'ml', 'Épais'),
  ('Oignon jaune', 200, 'g', 'Émincé'),
  ('Ail', 4, 'gousse', 'Hachées'),
  ('Gingembre frais', 20, 'g', 'Râpé'),
  ('Curcuma moulu', 10, 'g', '2 cuillères à café'),
  ('Cumin moulu', 5, 'g', '1 cuillère à café'),
  ('Coriandre moulue', 5, 'g', '1 cuillère à café'),
  ('Tomates cerises', 200, 'g', 'Coupées en quartiers'),
  ('Huile d''olive vierge', 30, 'ml', 'Pour la cuisson')
) AS ri(name, quantity, unit, notes)
JOIN canonical_foods cf ON cf.name = ri.name
WHERE EXISTS (SELECT 1 FROM recipes WHERE id = 5)
ON CONFLICT (recipe_id, canonical_food_id) DO NOTHING;

-- 5. Mettre à jour les scores Myko en fonction des ingrédients ajoutés
UPDATE recipes SET 
  myko_score = CASE 
    WHEN id = 1 THEN 88  -- Smoothie très sain
    WHEN id = 2 THEN 65  -- Pancakes moyens
    WHEN id = 3 THEN 82  -- Porridge sain
    WHEN id = 4 THEN 92  -- Salade très équilibrée
    WHEN id = 5 THEN 89  -- Curry très nutritif
    ELSE myko_score
  END,
  updated_at = NOW()
WHERE id IN (1, 2, 3, 4, 5);

-- 6. Vérification finale des liaisons
SELECT 
  r.id,
  r.name as recipe_name,
  r.myko_score,
  COUNT(ri.id) as nb_ingredients,
  STRING_AGG(cf.name, ', ' ORDER BY cf.name) as ingredients
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN canonical_foods cf ON ri.canonical_food_id = cf.id
GROUP BY r.id, r.name, r.myko_score
ORDER BY r.id;