-- ========================================
-- DONNÉES DE BASE POUR MYKO - MÉTADONNÉES
-- ========================================

-- Insertion des catégories de recettes
INSERT INTO recipe_categories (name, description, icon) VALUES
('Entrées', 'Hors-d''œuvre et amuse-bouches', '🥗'),
('Plats principaux', 'Plats de résistance', '🍽️'),
('Desserts', 'Sucreries et pâtisseries', '🍰'),
('Accompagnements', 'Garnitures et sides', '🥖'),
('Soupes', 'Potages et veloutés', '🍲'),
('Salades', 'Salades composées', '🥙'),
('Petit-déjeuner', 'Repas du matin', '🌅'),
('Apéritifs', 'Finger food et tapas', '🍸'),
('Sauces', 'Condiments et sauces', '🫙'),
('Boissons', 'Cocktails et smoothies', '🥤'),
('Pains', 'Boulangerie maison', '🍞'),
('Conserves', 'Bocaux et fermentations', '🏺')
ON CONFLICT (name) DO NOTHING;

-- Types de cuisine
INSERT INTO cuisine_types (name, country, description) VALUES
('Française', 'France', 'Cuisine traditionnelle française'),
('Italienne', 'Italie', 'Pâtes, pizzas et spécialités italiennes'),
('Asiatique', 'Asie', 'Saveurs d''Asie : Chine, Japon, Thaï, Corée'),
('Méditerranéenne', 'Bassin méditerranéen', 'Cuisine ensoleillée du sud'),
('Mexicaine', 'Mexique', 'Épices et saveurs du Mexique'),
('Indienne', 'Inde', 'Curry et épices de l''Inde'),
('Marocaine', 'Maroc', 'Tajines et couscous'),
('Libanaise', 'Liban', 'Mezze et cuisine du Levant'),
('Américaine', 'États-Unis', 'Comfort food américain'),
('Végétarienne', 'Monde', 'Cuisine sans viande ni poisson'),
('Végétalienne', 'Monde', 'Cuisine 100% végétale'),
('Sans gluten', 'Monde', 'Adaptée aux intolérances'),
('Fusion', 'Monde', 'Mélange créatif de traditions'),
('Bistrot', 'France', 'Cuisine de bistrot parisien'),
('Brasserie', 'France', 'Plats de brasserie')
ON CONFLICT (name) DO NOTHING;

-- Niveaux de difficulté
INSERT INTO difficulty_levels (level, description, time_factor) VALUES
('très_facile', 'Aucune compétence requise, idéal débutant', 0.8),
('facile', 'Techniques de base, accessible à tous', 1.0),
('moyen', 'Quelques techniques spécifiques requises', 1.2),
('difficile', 'Bonne maîtrise culinaire nécessaire', 1.5),
('expert', 'Réservé aux cuisiniers expérimentés', 2.0)
ON CONFLICT (level) DO NOTHING;

-- Types de régimes
INSERT INTO dietary_types (name, description, icon) VALUES
('Végétarien', 'Sans viande ni poisson', '🌱'),
('Végétalien', '100% végétal, sans produits animaux', '🌿'),
('Sans gluten', 'Adapté aux intolérants au gluten', '🚫🌾'),
('Sans lactose', 'Sans produits laitiers', '🚫🥛'),
('Low carb', 'Pauvre en glucides', '⚡'),
('Keto', 'Cétogène, très pauvre en glucides', '🔥'),
('Paleo', 'Régime paléolithique', '🦴'),
('Halal', 'Conforme aux préceptes islamiques', '☪️'),
('Casher', 'Conforme aux préceptes judaïques', '✡️')
ON CONFLICT (name) DO NOTHING;

-- Tags populaires
INSERT INTO recipe_tags (name, description, color) VALUES
('Rapide', 'Prêt en moins de 30 minutes', '#FF6B6B'),
('Économique', 'Budget réduit', '#4ECDC4'),
('Batch cooking', 'Idéal pour préparer à l''avance', '#45B7D1'),
('Comfort food', 'Plat réconfortant', '#FFA07A'),
('Healthy', 'Sain et équilibré', '#98D8C8'),
('Festif', 'Pour les grandes occasions', '#F7DC6F'),
('Été', 'Parfait pour les chaudes journées', '#FFD93D'),
('Hiver', 'Réconfortant par temps froid', '#6C5CE7'),
('Détox', 'Purifiant et léger', '#00B894'),
('Gourmand', 'Plaisir et indulgence', '#E17055'),
('Authentique', 'Recette traditionnelle', '#FDCB6E'),
('Moderne', 'Version contemporaine', '#A29BFE'),
('Enfant', 'Apprécié des plus jeunes', '#FD79A8'),
('Romantique', 'Pour un dîner en amoureux', '#E84393'),
('Brunch', 'Parfait pour le weekend', '#FDCB6E')
ON CONFLICT (name) DO NOTHING;