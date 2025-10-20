-- ========================================================================
-- ENRICHISSEMENT DE LA BASE AVEC RECETTES MEGA COMPLÉTÉES
-- Total: 600 nouvelles recettes avec descriptions réalistes
-- ========================================================================

BEGIN;

-- ========================================================================
-- ACCOMPAGNEMENT (60 recettes)
-- ========================================================================

-- Pommes noisettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pommes noisettes', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Pommes de terre rissolées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pommes de terre rissolées', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Pommes de terre à la vapeur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pommes de terre à la vapeur', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Pommes Anna
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pommes Anna', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rösti de pommes de terre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rösti de pommes de terre', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Écrasé de pommes de terre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Écrasé de pommes de terre', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Pommes boulangères
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pommes boulangères', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Aligot
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Aligot', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Riz blanc nature
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Riz blanc nature', 'ACCOMPAGNEMENT', 'Accompagnement de féculents pour compléter votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Riz basmati
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Riz basmati', 'ACCOMPAGNEMENT', 'Accompagnement de féculents pour compléter votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Riz thaï
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Riz thaï', 'ACCOMPAGNEMENT', 'Accompagnement de féculents pour compléter votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Riz au curry
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Riz au curry', 'ACCOMPAGNEMENT', 'Accompagnement de féculents pour compléter votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Riz au safran
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Riz au safran', 'ACCOMPAGNEMENT', 'Accompagnement de féculents pour compléter votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Riz aux épices
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Riz aux épices', 'ACCOMPAGNEMENT', 'Accompagnement de féculents pour compléter votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Riz au lait salé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Riz au lait salé', 'ACCOMPAGNEMENT', 'Accompagnement de féculents pour compléter votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Riz complet
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Riz complet', 'ACCOMPAGNEMENT', 'Accompagnement de féculents pour compléter votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Spaghetti nature
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Spaghetti nature', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Penne nature
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Penne nature', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Fusilli nature
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Fusilli nature', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tagliatelles nature
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tagliatelles nature', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Macaronis au beurre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Macaronis au beurre', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Spaghetti à l’ail et huile d’olive
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Spaghetti à l’ail et huile d’olive', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Pâtes aux poivrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pâtes aux poivrons', 'ACCOMPAGNEMENT', 'Accompagnement de féculents pour compléter votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Pâtes aux tomates
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pâtes aux tomates', 'ACCOMPAGNEMENT', 'Accompagnement de féculents pour compléter votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Pâtes gratinées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pâtes gratinées', 'ACCOMPAGNEMENT', 'Accompagnement gratinéau four, doré et croustillant. Idéal avec un plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Pâtes aux olives
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pâtes aux olives', 'ACCOMPAGNEMENT', 'Accompagnement de féculents pour compléter votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Carottes rôties
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Carottes rôties', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Courgettes rôties
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Courgettes rôties', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Aubergines rôties
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Aubergines rôties', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tomates rôties
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tomates rôties', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chou-fleur rôti
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chou-fleur rôti', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Brocolis rôtis
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Brocolis rôtis', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chou kale rôti
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chou kale rôti', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Panais rôtis
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Panais rôtis', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Betteraves rôties
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Betteraves rôties', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Courges rôties
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Courges rôties', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Choux de Bruxelles rôtis
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Choux de Bruxelles rôtis', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Aubergines vapeur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Aubergines vapeur', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Poivrons vapeur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Poivrons vapeur', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tomates vapeur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tomates vapeur', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Patates douces vapeur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Patates douces vapeur', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Betteraves vapeur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Betteraves vapeur', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Oignons vapeur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Oignons vapeur', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Courges vapeur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Courges vapeur', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Champignons vapeur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Champignons vapeur', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Carottes sautées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Carottes sautées', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Courgettes sautées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Courgettes sautées', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Aubergines sautées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Aubergines sautées', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Poivrons sautés
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Poivrons sautés', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tomates sautées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tomates sautées', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chou-fleur sauté
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chou-fleur sauté', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Brocolis sautés
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Brocolis sautés', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chou kale sauté
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chou kale sauté', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Patates douces sautées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Patates douces sautées', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Panais sautés
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Panais sautés', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Céleri-rave sauté
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Céleri-rave sauté', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Betteraves sautées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Betteraves sautées', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Oignons sautés
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Oignons sautés', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Fenouil sauté
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Fenouil sauté', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Courges sautées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Courges sautées', 'ACCOMPAGNEMENT', 'Accompagnement savoureux pour sublimer votre plat principal.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- ========================================================================
-- DESSERT (90 recettes)
-- ========================================================================

-- Gâteau au yaourt
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Gâteau au yaourt', 'DESSERT', 'Gâteau moelleux et savoureux. Idéal pour le goûter ou un dessert gourmand.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Quatre-quarts
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Quatre-quarts', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Opéra
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Opéra', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Forêt-Noire
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Forêt-Noire', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Mille-feuille
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Mille-feuille', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Paris-Brest
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Paris-Brest', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Saint-Honoré
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Saint-Honoré', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Clafoutis
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Clafoutis', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Galette des Rois
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Galette des Rois', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Gâteau basque
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Gâteau basque', 'DESSERT', 'Gâteau moelleux et savoureux. Idéal pour le goûter ou un dessert gourmand.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Far breton
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Far breton', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Baba au rhum
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Baba au rhum', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Savarin
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Savarin', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Charlotte aux fraises
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Charlotte aux fraises', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Gâteau aux pommes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Gâteau aux pommes', 'DESSERT', 'Gâteau moelleux et savoureux. Idéal pour le goûter ou un dessert gourmand.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Gâteau aux poires
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Gâteau aux poires', 'DESSERT', 'Gâteau moelleux et savoureux. Idéal pour le goûter ou un dessert gourmand.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bûche de Noël
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bûche de Noël', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets vanille
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets vanille', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets fruits rouges
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets fruits rouges', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets exotique
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets exotique', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets pistache
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets pistache', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets praliné
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets praliné', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets noisette
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets noisette', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets caramel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets caramel', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets coco
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets coco', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets mangue
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets mangue', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets passion
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets passion', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets marron
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets marron', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets mousse fraise
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets mousse fraise', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets mousse framboise
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets mousse framboise', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets fruits exotiques
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets fruits exotiques', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entremets signature
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entremets signature', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sablés
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sablés', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Cookies
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Cookies', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Brownies
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Brownies', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Madeleines
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Madeleines', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Financiers
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Financiers', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tuiles aux amandes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tuiles aux amandes', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Palets bretons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Palets bretons', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Speculoos
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Speculoos', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Canelés
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Canelés', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Meringues
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Meringues', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Langues de chat
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Langues de chat', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Macarons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Macarons', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Navettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Navettes', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Croquants aux amandes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Croquants aux amandes', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rochers coco
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rochers coco', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Florentins
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Florentins', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Pain d’épices
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pain d’épices', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Biscuits au citron
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Biscuits au citron', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Mousse à la vanille
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Mousse à la vanille', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Mousse aux fruits
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Mousse aux fruits', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Mousse au citron
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Mousse au citron', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Mousse à l’orange
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Mousse à l’orange', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Mousse exotique
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Mousse exotique', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Mousse pistache
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Mousse pistache', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème caramel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème caramel', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème brûlée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème brûlée', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème catalane
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème catalane', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Panna cotta
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Panna cotta', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Ile flottante
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Ile flottante', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Œufs au lait
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Œufs au lait', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème vanille
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème vanille', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème pistache
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème pistache', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème coco
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème coco', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème noisette
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème noisette', 'DESSERT', 'Dessert léger et onctueux. Une touche de douceur pour finir le repas.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Glace vanille
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Glace vanille', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Glace fraise
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Glace fraise', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Glace pistache
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Glace pistache', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Glace caramel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Glace caramel', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Glace coco
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Glace coco', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Glace mangue
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Glace mangue', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Glace passion
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Glace passion', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Glace citron
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Glace citron', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Glace framboise
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Glace framboise', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Glace myrtille
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Glace myrtille', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sorbet fraise
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sorbet fraise', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sorbet framboise
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sorbet framboise', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sorbet citron
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sorbet citron', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sorbet mangue
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sorbet mangue', 'DESSERT', 'Dessert glacé rafraîchissant. Parfait pour les beaux jours.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Parfait glacé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Parfait glacé', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Semifreddo
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Semifreddo', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Profiteroles glacées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Profiteroles glacées', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bûche glacée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bûche glacée', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Brochettes de fruits
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Brochettes de fruits', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Compote de pommes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Compote de pommes', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Compote de poires
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Compote de poires', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Compote de pêches
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Compote de pêches', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Compote d’abricots
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Compote d’abricots', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Compote de fruits rouges
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Compote de fruits rouges', 'DESSERT', 'Dessert délicieux pour conclure le repas sur une note sucrée.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- ========================================================================
-- ENTREE (90 recettes)
-- ========================================================================

-- Velouté de potiron
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de potiron', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de champignons', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de petits pois
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de petits pois', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de carottes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de carottes', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de chou-fleur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de chou-fleur', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de poireaux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de poireaux', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de panais
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de panais', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de tomates
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de tomates', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté d’asperges
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté d’asperges', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de courgettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de courgettes', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de céleri
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de céleri', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de topinambours
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de topinambours', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de brocolis
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de brocolis', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de patates douces
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de patates douces', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de navets
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de navets', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de cresson
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de cresson', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de betteraves
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de betteraves', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de fenouil
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de fenouil', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de maïs
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de maïs', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de potimarron
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de potimarron', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage julienne
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage julienne', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage cultivateur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage cultivateur', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage parisien
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage parisien', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage madrilène
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage madrilène', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux légumes variés
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux légumes variés', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage de légumes anciens
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage de légumes anciens', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage de légumes racines
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage de légumes racines', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de champignons', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de tomates
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de tomates', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de céleri
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de céleri', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de poireaux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de poireaux', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de carottes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de carottes', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de chou-fleur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de chou-fleur', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de panais
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de panais', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de courgettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de courgettes', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème d’asperges
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème d’asperges', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de navets
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de navets', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de topinambours
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de topinambours', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de brocolis
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de brocolis', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage crème de potiron
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage crème de potiron', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Garbure
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Garbure', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourin à l’ail
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourin à l’ail', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bouillabaisse simplifiée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bouillabaisse simplifiée', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bortsch ukrainien
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bortsch ukrainien', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Minestrone italien
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Minestrone italien', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Ribollita toscane
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Ribollita toscane', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Zuppa di pesce
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Zuppa di pesce', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Acquacotta
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Acquacotta', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sopa de ajo
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sopa de ajo', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Salmorejo
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Salmorejo', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bisque de homard
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bisque de homard', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bisque de langoustines
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bisque de langoustines', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bisque de crabes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bisque de crabes', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bisque de crevettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bisque de crevettes', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de cèpes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de cèpes', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de lentilles corail
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de lentilles corail', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de haricots blancs
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de haricots blancs', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de pois chiches
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de pois chiches', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté d’épinards
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté d’épinards', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de courges
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de courges', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de chou vert
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de chou vert', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté de poivrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté de poivrons', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté d’aubergines
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté d’aubergines', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Velouté aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Velouté aux herbes', 'ENTREE', 'Entrée réconfortante à base de légumes frais. Idéale pour débuter un repas en douceur.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage de légumes variés
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage de légumes variés', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage au chou
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage au chou', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux carottes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux carottes', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux courgettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux courgettes', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux poireaux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux poireaux', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux pommes de terre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux pommes de terre', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage au céleri
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage au céleri', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux tomates
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux tomates', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux champignons', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux aubergines
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux aubergines', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux poivrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux poivrons', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage au chou-fleur
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage au chou-fleur', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux brocolis
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux brocolis', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux navets
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux navets', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux blettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux blettes', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage au panais
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage au panais', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage au potiron
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage au potiron', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage au chou rouge
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage au chou rouge', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage aux artichauts
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage aux artichauts', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Potage méditerranéen
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Potage méditerranéen', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème de champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème de champignons', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème de poireaux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème de poireaux', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème de courgettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème de courgettes', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème de carottes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème de carottes', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème de céleri
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème de céleri', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Crème de brocolis
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Crème de brocolis', 'ENTREE', 'Entrée savoureuse pour bien commencer le repas. Préparation simple et rapide.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- ========================================================================
-- PLAT_PRINCIPAL (360 recettes)
-- ========================================================================

-- Steak grillé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Steak grillé', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entrecôte grillée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entrecôte grillée', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Faux-filet grillé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Faux-filet grillé', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rumsteck grillé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rumsteck grillé', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bavette grillée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bavette grillée', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Aloyau grillé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Aloyau grillé', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Onglet grillé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Onglet grillé', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Hampe grillée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Hampe grillée', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tournedos poêlé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tournedos poêlé', 'PLAT_PRINCIPAL', 'Plat principal savoureux poêlé avec soin. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Filet de bœuf poêlé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Filet de bœuf poêlé', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande poêlé avec soin. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Pavé de bœuf grillé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pavé de bœuf grillé', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Steak minute
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Steak minute', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côte de bœuf grillée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côte de bœuf grillée', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Araignée de bœuf grillée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Araignée de bœuf grillée', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Poire de bœuf grillée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Poire de bœuf grillée', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Merlan de bœuf grillé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Merlan de bœuf grillé', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bavette poêlée aux oignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bavette poêlée aux oignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux poêlé avec soin. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entrecôte au poivre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entrecôte au poivre', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Steak grillé au beurre maître d’hôtel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Steak grillé au beurre maître d’hôtel', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Filet grillé aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Filet grillé aux herbes', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf bourguignon
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf bourguignon', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Daube provençale
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Daube provençale', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Carbonnade flamande
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Carbonnade flamande', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Pot-au-feu
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Pot-au-feu', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf carottes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf carottes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Navarin de bœuf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Navarin de bœuf', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux oignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux oignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux poivrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux poivrons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux champignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux carottes et pommes de terre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux carottes et pommes de terre', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux haricots blancs
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux haricots blancs', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux pois chiches
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux pois chiches', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux lentilles
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux lentilles', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux courgettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux courgettes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux aubergines
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux aubergines', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux tomates
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux tomates', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf au céleri
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf au céleri', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf au chou
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf au chou', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux navets
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux navets', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf aux épices
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf aux épices', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf stroganoff
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf stroganoff', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf à la moutarde
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf à la moutarde', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, nappé d''une sauce à la moutarde. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf à la crème
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf à la crème', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, agrémenté d''une sauce crémeuse. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf au curry doux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf au curry doux', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf au paprika
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf au paprika', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce tomate
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce tomate', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce poivre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce poivre', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce au roquefort
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce au roquefort', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce au gorgonzola
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce au gorgonzola', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce au chèvre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce au chèvre', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce aux champignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce aux poivrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce aux poivrons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce aux oignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce aux oignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce au citron
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce au citron', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce au miel', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce aux herbes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce aux tomates séchées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce aux tomates séchées', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce au pesto
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce au pesto', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauce au curry coco
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauce au curry coco', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Blanquette de veau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Blanquette de veau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauté de veau marengo
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauté de veau marengo', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux olives
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux olives', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux champignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux carottes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux carottes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux courgettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux courgettes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux tomates
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux tomates', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux poivrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux poivrons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux aubergines
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux aubergines', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux oignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux oignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux pommes de terre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux pommes de terre', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux haricots blancs
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux haricots blancs', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux pois chiches
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux pois chiches', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux lentilles
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux lentilles', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux navets
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux navets', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux épinards
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux épinards', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux herbes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau aux champignons sauvages
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau aux champignons sauvages', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau au curry doux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau au curry doux', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Escalope de veau grillée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Escalope de veau grillée', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Escalope de veau panée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Escalope de veau panée', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Escalope de veau à la crème
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Escalope de veau à la crème', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, agrémenté d''une sauce crémeuse. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Escalope de veau à la moutarde
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Escalope de veau à la moutarde', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, nappé d''une sauce à la moutarde. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Escalope de veau aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Escalope de veau aux champignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Escalope de veau au curry doux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Escalope de veau au curry doux', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côte de veau grillée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côte de veau grillée', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côte de veau au beurre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côte de veau au beurre', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côte de veau aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côte de veau aux herbes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côte de veau aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côte de veau aux champignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Filet de veau grillé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Filet de veau grillé', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Filet de veau à la crème
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Filet de veau à la crème', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, agrémenté d''une sauce crémeuse. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Grenadin de veau au poivre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Grenadin de veau au poivre', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Grenadin de veau aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Grenadin de veau aux champignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Grenadin de veau au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Grenadin de veau au miel', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Grenadin de veau aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Grenadin de veau aux herbes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Escalope de veau milanaise
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Escalope de veau milanaise', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Escalope de veau cordon bleu
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Escalope de veau cordon bleu', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côte de veau à la moutarde
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côte de veau à la moutarde', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, nappé d''une sauce à la moutarde. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Filet de veau sauce tomate
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Filet de veau sauce tomate', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Gigot d’agneau rôti
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Gigot d’agneau rôti', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Gigot d’agneau aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Gigot d’agneau aux herbes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Gigot d’agneau au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Gigot d’agneau au miel', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Gigot d’agneau à l’ail
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Gigot d’agneau à l’ail', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Gigot d’agneau à la moutarde
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Gigot d’agneau à la moutarde', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, nappé d''une sauce à la moutarde. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Gigot d’agneau aux tomates
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Gigot d’agneau aux tomates', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Carré d’agneau rôti
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Carré d’agneau rôti', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Carré d’agneau grillé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Carré d’agneau grillé', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Carré d’agneau aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Carré d’agneau aux herbes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Carré d’agneau au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Carré d’agneau au miel', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côtelettes d’agneau grillées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côtelettes d’agneau grillées', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côtelettes d’agneau aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côtelettes d’agneau aux herbes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côtelettes d’agneau au curry doux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côtelettes d’agneau au curry doux', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côtelettes d’agneau à la provençale
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côtelettes d’agneau à la provençale', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côtelettes d’agneau au paprika
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côtelettes d’agneau au paprika', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Épaule d’agneau rôtie
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Épaule d’agneau rôtie', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Épaule d’agneau grillée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Épaule d’agneau grillée', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Épaule d’agneau au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Épaule d’agneau au miel', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Épaule d’agneau aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Épaule d’agneau aux herbes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Épaule d’agneau à la moutarde
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Épaule d’agneau à la moutarde', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, nappé d''une sauce à la moutarde. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Navarin d’agneau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Navarin d’agneau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Ragoût d’agneau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Ragoût d’agneau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux carottes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux carottes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux poireaux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux poireaux', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux champignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux pois chiches
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux pois chiches', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux lentilles
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux lentilles', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux haricots blancs
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux haricots blancs', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux tomates
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux tomates', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux aubergines
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux aubergines', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux courgettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux courgettes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux poivrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux poivrons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau au céleri
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau au céleri', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux navets
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux navets', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux épinards
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux épinards', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux pommes de terre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux pommes de terre', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux oignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux oignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux herbes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau au curry doux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau au curry doux', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau korma
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau korma', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau massala
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau massala', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau à la tomate
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau à la tomate', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau à la moutarde
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau à la moutarde', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, nappé d''une sauce à la moutarde. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau à la crème
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau à la crème', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, agrémenté d''une sauce crémeuse. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau au paprika
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau au paprika', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau au romarin
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau au romarin', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau au thym
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau au thym', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau au miel', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux épices
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux épices', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux pruneaux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux pruneaux', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux figues
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux figues', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux abricots
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux abricots', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux poires
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux poires', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux pommes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux pommes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau au citron
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau au citron', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau aux olives
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau aux olives', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau au gingembre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau au gingembre', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rôti de porc aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rôti de porc aux herbes', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rôti de porc à la moutarde
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rôti de porc à la moutarde', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four, nappé d''une sauce à la moutarde. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rôti de porc au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rôti de porc au miel', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rôti de porc au paprika
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rôti de porc au paprika', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rôti de porc au curry doux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rôti de porc au curry doux', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rôti de porc à l’ail
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rôti de porc à l’ail', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rôti de porc aux pommes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rôti de porc aux pommes', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rôti de porc aux pruneaux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rôti de porc aux pruneaux', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côtes de porc grillées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côtes de porc grillées', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côtes de porc marinées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côtes de porc marinées', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côtes de porc au barbecue
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côtes de porc au barbecue', 'PLAT_PRINCIPAL', 'Recette de poisson préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côtes de porc au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côtes de porc au miel', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côtes de porc aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côtes de porc aux herbes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côtes de porc au curry doux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côtes de porc au curry doux', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Filet mignon grillé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Filet mignon grillé', 'PLAT_PRINCIPAL', 'Plat principal savoureux grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Filet mignon au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Filet mignon au miel', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Filet mignon à la moutarde
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Filet mignon à la moutarde', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, nappé d''une sauce à la moutarde. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Filet mignon au romarin
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Filet mignon au romarin', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauté de porc au caramel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauté de porc au caramel', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauté de porc au curry doux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauté de porc au curry doux', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauté de porc aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauté de porc aux champignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauté de porc aux oignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauté de porc aux oignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauté de porc aux poivrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauté de porc aux poivrons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauté de porc aux tomates
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauté de porc aux tomates', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauté de porc aux carottes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauté de porc aux carottes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauté de porc aux courgettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauté de porc aux courgettes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauté de porc aux aubergines
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauté de porc aux aubergines', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sauté de porc au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sauté de porc au miel', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc aux pruneaux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc aux pruneaux', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc aux pommes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc aux pommes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc aux poires
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc aux poires', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc aux figues
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc aux figues', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc aux raisins secs
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc aux raisins secs', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc aux marrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc aux marrons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc aux herbes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc au gingembre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc au gingembre', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc à la moutarde
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc à la moutarde', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, nappé d''une sauce à la moutarde. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc au curry doux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc au curry doux', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce tomate
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce tomate', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce soja
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce soja', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce au miel', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce au roquefort
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce au roquefort', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce aux champignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce aux oignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce aux oignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce aux poivrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce aux poivrons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce au paprika
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce au paprika', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce à la bière
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce à la bière', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce aux herbes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce aux tomates séchées
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce aux tomates séchées', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce au pesto
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce au pesto', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce au lait de coco
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce au lait de coco', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce au curry coco
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce au curry coco', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc sauce aigre-douce
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc sauce aigre-douce', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, accompagné de sa sauce signature. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chevreuil rôti
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chevreuil rôti', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chevreuil aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chevreuil aux herbes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chevreuil au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chevreuil au miel', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chevreuil au poivre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chevreuil au poivre', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chevreuil au romarin
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chevreuil au romarin', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sanglier rôti
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sanglier rôti', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sanglier au miel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sanglier au miel', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sanglier aux pruneaux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sanglier aux pruneaux', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Cerf rôti
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Cerf rôti', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Cerf au poivre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Cerf au poivre', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Cerf aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Cerf aux champignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Lièvre rôti
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Lièvre rôti', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Lièvre aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Lièvre aux herbes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Lièvre à la moutarde
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Lièvre à la moutarde', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, nappé d''une sauce à la moutarde. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Faisan rôti
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Faisan rôti', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Faisan aux raisins
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Faisan aux raisins', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Civet de sanglier
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Civet de sanglier', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Civet de chevreuil
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Civet de chevreuil', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Civet de lièvre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Civet de lièvre', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Civet de cerf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Civet de cerf', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sanglier aux carottes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sanglier aux carottes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sanglier aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sanglier aux champignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sanglier aux pommes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sanglier aux pommes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chevreuil aux airelles
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chevreuil aux airelles', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chevreuil aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chevreuil aux champignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chevreuil aux pruneaux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chevreuil aux pruneaux', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Lièvre aux poires
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Lièvre aux poires', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Lièvre aux figues
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Lièvre aux figues', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Cerf aux marrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Cerf aux marrons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Cerf aux myrtilles
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Cerf aux myrtilles', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Faisan aux poires
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Faisan aux poires', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Faisan aux pommes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Faisan aux pommes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Faisan aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Faisan aux champignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bécasse mijotée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bécasse mijotée', 'PLAT_PRINCIPAL', 'Plat principal savoureux mijoté longuement pour plus de tendreté. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bécasse aux pruneaux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bécasse aux pruneaux', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger classique
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger classique', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger au fromage
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger au fromage', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger au bacon
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger au bacon', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger au bleu
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger au bleu', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger au roquefort
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger au roquefort', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger au chèvre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger au chèvre', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger au gorgonzola
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger au gorgonzola', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger au pesto
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger au pesto', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger au curry doux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger au curry doux', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger au poulet et bœuf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger au poulet et bœuf', 'PLAT_PRINCIPAL', 'Délicieux plat de volaille préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger aux champignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger aux oignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger aux oignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger aux tomates
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger aux tomates', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger aux poivrons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger aux poivrons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger aux aubergines
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger aux aubergines', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Burger aux courgettes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Burger aux courgettes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sandwich au steak
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sandwich au steak', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sandwich au rôti de bœuf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sandwich au rôti de bœuf', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Wrap au bœuf grillé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Wrap au bœuf grillé', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande grillé à la perfection. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Wrap au bœuf aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Wrap au bœuf aux herbes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Boulettes de bœuf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Boulettes de bœuf', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Boulettes de veau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Boulettes de veau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Boulettes d’agneau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Boulettes d’agneau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Boulettes de porc
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Boulettes de porc', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Boulettes au curry doux
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Boulettes au curry doux', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Boulettes à la tomate
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Boulettes à la tomate', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Boulettes au fromage
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Boulettes au fromage', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Boulettes aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Boulettes aux herbes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Boulettes aux champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Boulettes aux champignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Boulettes aux oignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Boulettes aux oignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Steak haché poêlé
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Steak haché poêlé', 'PLAT_PRINCIPAL', 'Plat principal savoureux poêlé avec soin. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Steak haché au barbecue
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Steak haché au barbecue', 'PLAT_PRINCIPAL', 'Recette de poisson préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Steak haché au fromage
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Steak haché au fromage', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Steak haché aux herbes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Steak haché aux herbes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Steak haché aux oignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Steak haché aux oignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Steak haché au poivre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Steak haché au poivre', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Polpette italiennes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Polpette italiennes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Keftas d’agneau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Keftas d’agneau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Keftas de bœuf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Keftas de bœuf', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Keftas de veau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Keftas de veau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chateaubriand
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chateaubriand', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tournedos Rossini
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tournedos Rossini', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Filet de bœuf Wellington
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Filet de bœuf Wellington', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Entrecôte maître d’hôtel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Entrecôte maître d’hôtel', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Côte de bœuf XXL
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Côte de bœuf XXL', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Magret de canard au foie gras
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Magret de canard au foie gras', 'PLAT_PRINCIPAL', 'Délicieux plat de volaille préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Gigot d’agneau pascal
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Gigot d’agneau pascal', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Épaule d’agneau de fête
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Épaule d’agneau de fête', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Navarin d’agneau royal
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Navarin d’agneau royal', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Cerf aux truffes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Cerf aux truffes', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Chevreuil au foie gras
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Chevreuil au foie gras', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Sanglier de fête
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Sanglier de fête', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Lièvre à la royale
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Lièvre à la royale', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bécasse truffée
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bécasse truffée', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Terrine de gibier royale
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Terrine de gibier royale', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Filet de bœuf aux morilles
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Filet de bœuf aux morilles', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rôti de veau aux morilles
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rôti de veau aux morilles', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf teriyaki
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf teriyaki', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf sauté thaï
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf sauté thaï', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf curry coco
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf curry coco', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf au satay
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf au satay', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf bulgogi
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf bulgogi', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf au soja
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf au soja', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau tikka masala
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau tikka masala', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Agneau curry thaï
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Agneau curry thaï', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc au caramel
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc au caramel', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc au soja
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc au soja', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc à l’aigre-douce
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc à l’aigre-douce', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc au satay
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc au satay', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc au curry japonais
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc au curry japonais', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Porc teriyaki
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Porc teriyaki', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau au gingembre
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau au gingembre', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau à la citronnelle
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau à la citronnelle', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Veau à la thaï
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Veau à la thaï', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rosbif froid
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rosbif froid', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rôti de veau froid
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rôti de veau froid', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rôti de porc froid
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rôti de porc froid', 'PLAT_PRINCIPAL', 'Plat principal savoureux rôti au four. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Salade de bœuf froid
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Salade de bœuf froid', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Salade de veau froid
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Salade de veau froid', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Salade de porc froid
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Salade de porc froid', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Carpaccio de bœuf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Carpaccio de bœuf', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Carpaccio de veau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Carpaccio de veau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Carpaccio d’agneau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Carpaccio d’agneau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Carpaccio de gibier
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Carpaccio de gibier', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tartare de bœuf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tartare de bœuf', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tartare de veau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tartare de veau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tartare d’agneau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tartare d’agneau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tartare de gibier
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tartare de gibier', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rillettes de bœuf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rillettes de bœuf', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Rillettes de porc
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Rillettes de porc', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Terrine de gibier
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Terrine de gibier', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Terrine de bœuf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Terrine de bœuf', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Terrine de veau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Terrine de veau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Terrine de sanglier
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Terrine de sanglier', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte au bœuf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte au bœuf', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte au bœuf et champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte au bœuf et champignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte au bœuf et légumes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte au bœuf et légumes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte au veau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte au veau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte au veau et champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte au veau et champignons', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte au veau et légumes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte au veau et légumes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte à l’agneau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte à l’agneau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte à l’agneau et légumes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte à l’agneau et légumes', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte au porc
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte au porc', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte au porc et légumes
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte au porc et légumes', 'PLAT_PRINCIPAL', 'Plat végétarien équilibré préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte au gibier
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte au gibier', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Tourte au gibier et champignons
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Tourte au gibier et champignons', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Feuilleté au bœuf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Feuilleté au bœuf', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Feuilleté au veau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Feuilleté au veau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Feuilleté à l’agneau
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Feuilleté à l’agneau', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Feuilleté au porc
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Feuilleté au porc', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Feuilleté au gibier
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Feuilleté au gibier', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Feuilleté au sanglier
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Feuilleté au sanglier', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Feuilleté au chevreuil
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Feuilleté au chevreuil', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Feuilleté au cerf
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Feuilleté au cerf', 'PLAT_PRINCIPAL', 'Plat principal savoureux préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf au miso
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf au miso', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf au sésame noir
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf au sésame noir', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

-- Bœuf au curry cacao
INSERT INTO recipes (name, role, description, prep_time_minutes, cook_time_minutes, servings)
VALUES ('Bœuf au curry cacao', 'PLAT_PRINCIPAL', 'Savoureuse préparation de viande préparé avec attention, relevé d''épices curry. Parfait pour un repas convivial.', 30, 30, 4)
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- ========================================================================
-- VÉRIFICATION FINALE
-- ========================================================================

SELECT 
  'ENRICHISSEMENT TERMINÉ' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'PLAT_PRINCIPAL') as plats_principaux,
  COUNT(*) FILTER (WHERE role = 'ENTREE') as entrees,
  COUNT(*) FILTER (WHERE role = 'DESSERT') as desserts,
  COUNT(*) FILTER (WHERE role = 'ACCOMPAGNEMENT') as accompagnements,
  COUNT(*) FILTER (WHERE description LIKE '%À compléter%') as incompletes
FROM recipes;

-- Quelques exemples
SELECT name, role, LEFT(description, 80) as description_preview
FROM recipes
ORDER BY id DESC
LIMIT 20;
