-- Script pour insérer quelques recettes de test dans la base de données réelle
-- Utilise la structure définie dans setup_recipes_db.sql

-- D'abord, insérer les catégories si elles n'existent pas
INSERT INTO recipe_categories (name, slug, icon) VALUES 
('Entrées', 'entrees', '🥗'),
('Plats principaux', 'plats-principaux', '🍽️'),
('Soupes', 'soupes', '🍲')
ON CONFLICT (slug) DO NOTHING;

-- Insérer les types de cuisine
INSERT INTO cuisine_types (name, slug, flag) VALUES 
('Française', 'francaise', '🇫🇷'),
('Italienne', 'italienne', '🇮🇹'),
('Indienne', 'indienne', '🇮🇳'),
('Asiatique', 'asiatique', '🥢')
ON CONFLICT (slug) DO NOTHING;

-- Insérer les niveaux de difficulté
INSERT INTO difficulty_levels (level, name, description, sort_order) VALUES 
('très_facile', 'Très facile', 'Accessible à tous, moins de 30min', 1),
('facile', 'Facile', 'Techniques de base, 30-60min', 2),
('moyen', 'Moyen', 'Quelques techniques, 1-2h', 3),
('difficile', 'Difficile', 'Techniques avancées, plus de 2h', 4)
ON CONFLICT (level) DO NOTHING;

-- Insérer quelques recettes de test
INSERT INTO recipes (
  title, slug, description, short_description, instructions,
  category_id, cuisine_type_id, difficulty_level_id,
  servings, prep_min, cook_min, rest_min,
  calories, proteins, carbs, fats, fiber,
  estimated_cost, budget_category, skill_level,
  season_spring, season_summer, season_autumn, season_winter,
  meal_breakfast, meal_lunch, meal_dinner, meal_snack,
  is_vegetarian, is_vegan, is_gluten_free,
  chef_tips, author_name
) VALUES 
(
  'Ratatouille Provençale',
  'ratatouille-provencale',
  'Mijoté de légumes du soleil : aubergines, courgettes, tomates, poivrons. Un classique de la cuisine française parfait pour l''été.',
  'Délicieux plat de légumes méditerranéens',
  'Couper tous les légumes en dés réguliers. Dans une large poêle, faire revenir séparément les aubergines, puis les courgettes, puis les poivrons dans l''huile d''olive. Réserver chaque légume. Dans la même poêle, faire revenir l''oignon émincé, ajouter l''ail haché. Remettre tous les légumes, ajouter les tomates concassées, les herbes de Provence, le thym, le laurier. Saler, poivrer. Mijoter à feu doux 45 minutes en remuant de temps en temps.',
  (SELECT id FROM recipe_categories WHERE slug = 'plats-principaux'),
  (SELECT id FROM cuisine_types WHERE slug = 'francaise'),
  (SELECT id FROM difficulty_levels WHERE level = 'facile'),
  6, 30, 45, 0,
  180, 6.2, 22.5, 9.1, 8.3,
  3.50, 'économique', 'débutant',
  false, true, true, false,
  false, true, true, false,
  true, true, true,
  'Cuire les légumes séparément d''abord pour une meilleure texture. La ratatouille est encore meilleure réchauffée le lendemain.',
  'Chef Myko'
),
(
  'Curry de lentilles corail',
  'curry-lentilles-corail',
  'Curry végétarien aux lentilles corail, lait de coco et épices indiennes. Riche en protéines et en saveurs.',
  'Curry végétarien épicé et nutritif',
  'Rincer les lentilles corail à l''eau froide. Dans une casserole, faire chauffer l''huile et faire revenir l''oignon émincé jusqu''à ce qu''il soit translucide. Ajouter l''ail, le gingembre râpé et les épices (curcuma, cumin, coriandre, garam masala). Faire revenir 1 minute. Ajouter les lentilles, les tomates concassées et le lait de coco. Porter à ébullition puis réduire le feu et laisser mijoter 25-30 minutes jusqu''à ce que les lentilles soient tendres. Saler, poivrer et ajouter le jus de citron. Garnir de coriandre fraîche.',
  (SELECT id FROM recipe_categories WHERE slug = 'plats-principaux'),
  (SELECT id FROM cuisine_types WHERE slug = 'indienne'),
  (SELECT id FROM difficulty_levels WHERE level = 'moyen'),
  4, 20, 35, 0,
  320, 18.4, 42.1, 12.3, 16.2,
  2.80, 'économique', 'intermédiaire',
  true, true, true, true,
  false, true, true, false,
  true, true, true,
  'Rincer les lentilles corail avant cuisson pour éviter l''écume. Ajuster la consistance avec un peu d''eau si nécessaire.',
  'Chef Myko'
),
(
  'Soupe de potimarron rôti',
  'soupe-potimarron-roti',
  'Velouté onctueux de potimarron rôti avec une pointe de gingembre. Parfait pour les soirées d''automne.',
  'Velouté automnal réconfortant',
  'Préchauffer le four à 200°C. Couper le potimarron en quartiers, retirer les graines. Badigeonner d''huile d''olive et rôtir 30 minutes. Pendant ce temps, faire suer l''oignon dans une casserole avec un peu d''huile. Ajouter le gingembre râpé. Quand le potimarron est tendre, retirer la chair et l''ajouter à la casserole. Verser le bouillon, porter à ébullition et laisser mijoter 15 minutes. Mixer jusqu''à obtenir un velouté lisse. Ajouter la crème, saler et poivrer. Servir avec des graines de courge grillées.',
  (SELECT id FROM recipe_categories WHERE slug = 'soupes'),
  (SELECT id FROM cuisine_types WHERE slug = 'francaise'),
  (SELECT id FROM difficulty_levels WHERE level = 'facile'),
  6, 20, 45, 0,
  145, 4.1, 18.2, 7.3, 5.1,
  2.20, 'économique', 'débutant',
  false, false, true, true,
  false, true, true, false,
  true, true, true,
  'Rôtir le potimarron au four développe ses saveurs. Garder quelques graines pour les faire griller en accompagnement.',
  'Chef Myko'
),
(
  'Risotto aux champignons',
  'risotto-champignons',
  'Risotto crémeux aux champignons de saison et parmesan. Un classique italien réconfortant.',
  'Risotto italien authentique',
  'Faire revenir les champignons émincés dans une poêle avec un peu d''huile. Réserver. Dans une casserole, faire chauffer le bouillon et le maintenir chaud. Dans une autre casserole, faire revenir l''oignon finement émincé dans l''huile d''olive jusqu''à ce qu''il soit translucide. Ajouter le riz Arborio et nacrer pendant 2 minutes en remuant. Verser le vin blanc et laisser évaporer. Ajouter le bouillon chaud louche par louche, en remuant constamment et en attendant que chaque louche soit absorbée avant d''en ajouter une nouvelle. Continuer pendant 18-20 minutes. Incorporer les champignons, le beurre et le parmesan râpé. Rectifier l''assaisonnement.',
  (SELECT id FROM recipe_categories WHERE slug = 'plats-principaux'),
  (SELECT id FROM cuisine_types WHERE slug = 'italienne'),
  (SELECT id FROM difficulty_levels WHERE level = 'difficile'),
  4, 20, 35, 0,
  380, 14.2, 58.1, 12.8, 3.2,
  4.50, 'moyen', 'avancé',
  false, false, true, true,
  false, true, true, false,
  true, false, true,
  'Ne jamais arrêter de remuer et maintenir le bouillon chaud. Le riz doit être crémeux mais encore légèrement croquant.',
  'Chef Myko'
),
(
  'Salade de quinoa aux légumes',
  'salade-quinoa-legumes',
  'Salade complète et nutritive avec quinoa, légumes croquants et vinaigrette aux herbes.',
  'Salade complète et équilibrée',
  'Rincer le quinoa à l''eau froide jusqu''à ce que l''eau soit claire. Le cuire dans 2 fois son volume d''eau salée pendant 15 minutes. Égoutter et laisser refroidir. Pendant ce temps, préparer les légumes : couper les tomates cerises en deux, émincer le concombre, râper la carotte, hacher finement les herbes. Préparer la vinaigrette en mélangeant l''huile d''olive, le vinaigre de citron, la moutarde, sel et poivre. Mélanger le quinoa refroidi avec tous les légumes et la vinaigrette. Laisser mariner 30 minutes au frais avant de servir.',
  (SELECT id FROM recipe_categories WHERE slug = 'entrees'),
  (SELECT id FROM cuisine_types WHERE slug = 'francaise'),
  (SELECT id FROM difficulty_levels WHERE level = 'très_facile'),
  4, 25, 15, 30,
  285, 12.1, 38.2, 10.4, 6.8,
  3.20, 'économique', 'débutant',
  true, true, true, false,
  false, true, true, true,
  true, true, true,
  'Bien rincer le quinoa avant cuisson pour éviter l''amertume. Cette salade se conserve 2-3 jours au réfrigérateur.',
  'Chef Myko'
),
(
  'Pad Thaï aux légumes',
  'pad-thai-legumes',
  'Nouilles de riz sautées à la thaïlandaise avec légumes croquants et sauce aigre-douce.',
  'Nouilles thaï authentiques végétariennes',
  'Faire tremper les nouilles de riz dans l''eau chaude selon les instructions du paquet. Préparer tous les légumes : émincer l''ail et les échalotes, couper les poivrons en julienne, les champignons en lamelles. Dans un wok ou une grande poêle, faire chauffer l''huile à feu vif. Faire sauter l''ail et les échalotes 1 minute. Ajouter les légumes les plus fermes d''abord (poivrons, champignons), puis les plus tendres (germes de soja). Ajouter les nouilles égouttées et la sauce (sauce soja, sauce de poisson végétarienne, sucre, jus de citron vert, pâte de tamarin). Faire sauter 2-3 minutes. Servir immédiatement avec cacahuètes concassées, coriandre fraîche et quartiers de citron vert.',
  (SELECT id FROM recipe_categories WHERE slug = 'plats-principaux'),
  (SELECT id FROM cuisine_types WHERE slug = 'asiatique'),
  (SELECT id FROM difficulty_levels WHERE level = 'moyen'),
  4, 25, 15, 0,
  340, 14.8, 52.3, 10.1, 4.5,
  3.80, 'économique', 'intermédiaire',
  true, true, true, true,
  false, true, true, false,
  true, true, true,
  'Préparer tous les ingrédients avant de commencer la cuisson car tout va très vite au wok. Ne pas trop cuire les légumes, ils doivent rester croquants.',
  'Chef Myko'
);

-- Ajouter quelques informations pour le système Myko
UPDATE recipes SET 
  created_at = NOW() - (random() * INTERVAL '30 days'),
  updated_at = NOW() - (random() * INTERVAL '10 days');

COMMENT ON TABLE recipes IS 'Table des recettes Myko avec 6 recettes de test insérées';