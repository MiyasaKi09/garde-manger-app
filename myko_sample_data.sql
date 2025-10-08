-- ================================================================================================
-- MYKO RECIPES - DONNÉES D'EXEMPLE ESSENTIELLES
-- ================================================================================================
-- Données de base pour tester le système des recettes Myko
-- À exécuter APRÈS myko_database_main.sql
-- ================================================================================================

-- ================================================================================================
-- 1. DONNÉES DE RÉFÉRENCE DE BASE
-- ================================================================================================

-- Catégories de recettes
INSERT INTO recipe_categories (name, slug, description, icon, meal_compatibility, sort_order) VALUES
('Entrées', 'entrees', 'Entrées et hors-d''œuvres', '🥗', '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}', 1),
('Soupes', 'soupes', 'Soupes et veloutés', '🍲', '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}', 2),
('Plats principaux', 'plats-principaux', 'Plats de résistance', '🍽️', '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}', 3),
('Accompagnements', 'accompagnements', 'Garnitures et accompagnements', '🥔', '{"breakfast": false, "lunch": true, "dinner": true, "snack": false}', 4),
('Desserts', 'desserts', 'Desserts et douceurs', '🍰', '{"breakfast": false, "lunch": true, "dinner": true, "snack": true}', 5),
('Petit-déjeuner', 'petit-dejeuner', 'Petit-déjeuners et brunchs', '🥞', '{"breakfast": true, "lunch": false, "dinner": false, "snack": false}', 6),
('Collations', 'collations', 'Encas et collations', '🥨', '{"breakfast": false, "lunch": false, "dinner": false, "snack": true}', 7),
('Boissons', 'boissons', 'Boissons chaudes et froides', '🥤', '{"breakfast": true, "lunch": true, "dinner": true, "snack": true}', 8),
('Anti-gaspi', 'anti-gaspi', 'Recettes anti-gaspillage Myko', '♻️', '{"breakfast": true, "lunch": true, "dinner": true, "snack": true}', 9)
ON CONFLICT (slug) DO NOTHING;

-- Types de cuisine
INSERT INTO cuisine_types (name, slug, description, flag, region) VALUES
('Française', 'francaise', 'Cuisine traditionnelle française', '🇫🇷', 'France'),
('Méditerranéenne', 'mediterraneenne', 'Cuisine du bassin méditerranéen', '🌊', 'Méditerranée'),
('Italienne', 'italienne', 'Cuisine italienne authentique', '🇮🇹', 'Italie'),
('Asiatique', 'asiatique', 'Cuisines d''Asie', '🥢', 'Asie'),
('Indienne', 'indienne', 'Cuisine indienne épicée', '🇮🇳', 'Inde'),
('Mexicaine', 'mexicaine', 'Cuisine mexicaine traditionnelle', '🇲🇽', 'Mexique'),
('Japonaise', 'japonaise', 'Cuisine japonaise raffinée', '🇯🇵', 'Japon'),
('Fusion', 'fusion', 'Cuisine créative moderne', '✨', 'International'),
('Myko', 'myko', 'Spécialités anti-gaspillage Myko', '🌿', 'Garde-manger')
ON CONFLICT (slug) DO NOTHING;

-- Niveaux de difficulté
INSERT INTO difficulty_levels (level, name, description, min_prep_time, max_prep_time, sort_order) VALUES
('très_facile', 'Très facile', 'Accessible aux débutants complets', 0, 15, 1),
('facile', 'Facile', 'Quelques techniques simples', 10, 30, 2),
('moyen', 'Moyen', 'Techniques intermédiaires requises', 20, 60, 3),
('difficile', 'Difficile', 'Techniques avancées nécessaires', 45, 120, 4),
('expert', 'Expert', 'Niveau chef professionnel', 60, 240, 5)
ON CONFLICT (level) DO NOTHING;

-- Types de régimes alimentaires
INSERT INTO dietary_types (name, slug, description, color, icon) VALUES
('Végétarien', 'vegetarien', 'Sans viande ni poisson', '#22c55e', '🌱'),
('Végétalien', 'vegetalien', 'Sans produits animaux', '#16a34a', '🌿'),
('Sans gluten', 'sans-gluten', 'Sans gluten ni blé', '#f59e0b', '🌾'),
('Sans lactose', 'sans-lactose', 'Sans produits laitiers', '#3b82f6', '🥛'),
('Cétogène', 'cetogene', 'Très faible en glucides', '#dc2626', '🥑'),
('Paléo', 'paleo', 'Régime paléolithique', '#92400e', '🥩'),
('Méditerranéen', 'mediterraneen', 'Régime méditerranéen', '#0ea5e9', '🫒'),
('Anti-gaspi', 'anti-gaspi', 'Optimisé anti-gaspillage', '#22c55e', '♻️')
ON CONFLICT (slug) DO NOTHING;

-- Équipements de cuisine essentiels
INSERT INTO equipment (name, category, description, is_essential) VALUES
('Couteau de chef', 'basic', 'Couteau polyvalent pour la plupart des découpes', true),
('Planche à découper', 'basic', 'Surface de travail pour la préparation', true),
('Casserole', 'basic', 'Pour cuissons liquides et mijotés', true),
('Poêle', 'basic', 'Pour saisir, sauter et griller', true),
('Four', 'basic', 'Pour rôtir, gratiner et pâtisserie', true),
('Mixeur plongeant', 'advanced', 'Pour mixer soupes et sauces', false),
('Robot culinaire', 'advanced', 'Pour hacher et mélanger rapidement', false),
('Mandoline', 'advanced', 'Pour découpes précises et uniformes', false),
('Thermomètre culinaire', 'professional', 'Pour contrôler la cuisson', false),
('Balance de précision', 'basic', 'Pour mesures précises', true)
ON CONFLICT (name) DO NOTHING;

-- ================================================================================================
-- 2. TECHNIQUES DE CUISSON AVEC IMPACT NUTRITIONNEL
-- ================================================================================================

INSERT INTO cooking_techniques (name, category, calories_retention, protein_retention, carbs_retention, fat_retention, fiber_retention, vitamin_c_retention, vitamin_b_retention, folate_retention, minerals_retention, typical_temp_celsius, typical_duration_min, description) VALUES

-- Cuissons sans chaleur
('Cru', 'raw', 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, NULL, 0, 'Aucune cuisson - conservation maximale des nutriments'),
('Marinade', 'raw', 1.00, 1.00, 1.00, 1.00, 1.00, 0.95, 1.00, 0.98, 1.00, NULL, 30, 'Macération dans un liquide acide'),

-- Cuissons humides (wet heat)
('Vapeur', 'wet_heat', 1.00, 1.00, 1.00, 1.00, 1.00, 0.85, 0.90, 0.85, 1.00, 100, 15, 'Cuisson douce préservant les nutriments'),
('Bouilli', 'wet_heat', 0.95, 0.95, 0.98, 1.00, 1.00, 0.50, 0.60, 0.45, 0.80, 100, 20, 'Cuisson dans eau bouillante - perte vitamines hydrosolubles'),
('Poché', 'wet_heat', 0.98, 0.98, 1.00, 1.00, 1.00, 0.75, 0.80, 0.70, 0.95, 80, 10, 'Cuisson douce dans liquide frémissant'),
('Braisé', 'combination', 1.00, 1.00, 1.00, 1.05, 1.00, 0.70, 0.75, 0.60, 1.00, 160, 90, 'Cuisson lente en milieu humide'),
('Mijoté', 'combination', 1.00, 1.00, 1.00, 1.00, 1.00, 0.70, 0.75, 0.65, 1.00, 85, 60, 'Cuisson lente à feu doux'),

-- Cuissons sèches (dry heat)
('Sauté', 'dry_heat', 1.05, 1.00, 1.00, 1.10, 1.00, 0.70, 0.85, 0.75, 1.00, 180, 5, 'Cuisson rapide à feu vif avec matière grasse'),
('Grillé', 'dry_heat', 0.90, 0.95, 1.00, 0.85, 1.00, 0.60, 0.80, 0.70, 1.00, 200, 8, 'Cuisson directe sur grill - perte de graisses'),
('Rôti', 'dry_heat', 0.95, 1.00, 1.00, 0.90, 1.00, 0.65, 0.85, 0.75, 1.00, 180, 45, 'Cuisson au four chaleur sèche'),
('Frit', 'dry_heat', 1.30, 0.95, 1.00, 2.00, 1.00, 0.40, 0.70, 0.50, 1.00, 170, 3, 'Cuisson dans huile chaude - ajout calories'),

-- Cuissons spéciales
('Confit', 'combination', 1.20, 1.00, 1.00, 1.50, 1.00, 0.80, 0.90, 0.85, 1.00, 65, 120, 'Cuisson lente dans la graisse'),
('Fumé', 'dry_heat', 0.90, 0.98, 1.00, 0.95, 1.00, 0.60, 0.75, 0.70, 1.00, 80, 180, 'Cuisson et aromatisation par fumée'),
('Sous-vide', 'wet_heat', 1.00, 1.00, 1.00, 1.00, 1.00, 0.95, 0.98, 0.95, 1.00, 65, 90, 'Cuisson sous vide à basse température')

ON CONFLICT (name) DO NOTHING;

-- ================================================================================================
-- 3. PROFILS NUTRITIONNELS CIBLES
-- ================================================================================================

INSERT INTO nutritional_profiles (name, description, target_protein_percent, target_carbs_percent, target_fats_percent, calories_breakfast, calories_lunch, calories_dinner, myko_priorities) VALUES

('Équilibré Myko', 'Répartition équilibrée avec priorité anti-gaspillage', 20.0, 50.0, 30.0, 350, 500, 450, '{"anti_waste": 10, "seasonal": 8, "inventory_based": 9, "nutrition": 7}'::jsonb),

('Sportif Myko', 'Riche en protéines avec gestion inventory', 25.0, 45.0, 30.0, 400, 600, 500, '{"anti_waste": 8, "seasonal": 6, "inventory_based": 9, "nutrition": 10}'::jsonb),

('Minceur Myko', 'Contrôle calorique intelligent', 25.0, 40.0, 35.0, 250, 400, 350, '{"anti_waste": 9, "seasonal": 8, "inventory_based": 8, "nutrition": 9}'::jsonb),

('Famille Myko', 'Adapté aux familles avec enfants', 18.0, 55.0, 27.0, 300, 450, 400, '{"anti_waste": 10, "seasonal": 7, "inventory_based": 10, "nutrition": 6}'::jsonb),

('Étudiant Myko', 'Économique et rapide', 20.0, 50.0, 30.0, 300, 400, 350, '{"anti_waste": 10, "seasonal": 5, "inventory_based": 10, "nutrition": 5}'::jsonb),

('Végétarien Myko', 'Sans viande avec équilibre protéique', 22.0, 50.0, 28.0, 350, 480, 420, '{"anti_waste": 9, "seasonal": 9, "inventory_based": 8, "nutrition": 8}'::jsonb)

ON CONFLICT (name) DO NOTHING;

-- ================================================================================================
-- 4. EXEMPLES DE SUBSTITUTIONS AUTOMATIQUES
-- ================================================================================================

-- Note: Ces substitutions seront complétées par la fonction auto-génération
-- Voici quelques exemples manuels pour des cas spécifiques

INSERT INTO smart_substitutions (original_product_type, original_product_id, substitute_product_type, substitute_product_id, conversion_ratio, context, compatibility_score, flavor_impact, texture_impact, notes, auto_generated) VALUES

-- Exemples avec des IDs fictifs - à adapter selon vos vraies données
-- ('canonical', 1, 'cultivar', 2, 1.0, 'general', 9, 'neutral', 'neutral', 'Tomate standard → Tomate cerise', true),
-- ('canonical', 3, 'archetype', 4, 1.2, 'sauce', 7, 'improved', 'different', 'Tomate fraîche → Purée (besoin 20% plus)', false),

-- Substitutions génériques (à compléter avec vrais IDs)
('canonical', 999, 'cultivar', 999, 1.0, 'general', 9, 'neutral', 'neutral', 'Substitution automatique canonical vers cultivar', true)

ON CONFLICT (original_product_type, original_product_id, substitute_product_type, substitute_product_id, context) DO NOTHING;

-- ================================================================================================
-- 5. RECETTES D'EXEMPLE POUR TESTER LE SYSTÈME
-- ================================================================================================

-- Exemple 1: Salade de tomates (utilise des produits de base)
INSERT INTO recipes (
    title, slug, description, short_description,
    category_id, cuisine_type_id, difficulty_level_id,
    servings, prep_min, cook_min, rest_min,
    meal_lunch, meal_dinner, meal_snack,
    season_spring, season_summer, season_autumn, season_winter,
    is_vegetarian, is_vegan, is_gluten_free, is_dairy_free,
    instructions, chef_tips,
    myko_score, is_active
) VALUES (
    'Salade de tomates du jardin',
    'salade-tomates-jardin',
    'Une salade fraîche et colorée qui met en valeur les tomates de saison. Parfaite pour utiliser les tomates du garde-manger avant qu''elles ne s''abîment.',
    'Salade simple et fraîche avec tomates, basilic et vinaigrette maison',
    (SELECT id FROM recipe_categories WHERE slug = 'entrees'),
    (SELECT id FROM cuisine_types WHERE slug = 'mediterraneenne'),
    (SELECT id FROM difficulty_levels WHERE level = 'très_facile'),
    4, 15, 0, 10,
    true, true, true,
    false, true, true, false,
    true, true, true, true,
    'Laver et découper les tomates en quartiers. Ciseler le basilic. Préparer une vinaigrette avec huile d''olive, vinaigre balsamique, sel et poivre. Mélanger délicatement tous les ingrédients. Laisser reposer 10 minutes avant de servir.',
    'Choisir des tomates bien mûres pour plus de saveur. La salade est meilleure à température ambiante.',
    85, true
);

-- Exemple 2: Ratatouille anti-gaspi
INSERT INTO recipes (
    title, slug, description, short_description,
    category_id, cuisine_type_id, difficulty_level_id,
    servings, prep_min, cook_min, rest_min,
    meal_lunch, meal_dinner,
    season_summer, season_autumn,
    is_vegetarian, is_vegan, is_gluten_free, is_dairy_free,
    instructions, chef_tips, serving_suggestions,
    myko_score, is_active
) VALUES (
    'Ratatouille du garde-manger',
    'ratatouille-garde-manger',
    'Recette parfaite pour utiliser tous les légumes d''été qui commencent à ramollir. Une ratatouille généreuse qui se bonifie en refroidissant.',
    'Mijoté de légumes d''été, idéal pour écouler le stock de légumes',
    (SELECT id FROM recipe_categories WHERE slug = 'plats-principaux'),
    (SELECT id FROM cuisine_types WHERE slug = 'francaise'),
    (SELECT id FROM difficulty_levels WHERE level = 'facile'),
    6, 20, 45, 0,
    true, true,
    true, true,
    true, true, true, true,
    'Découper tous les légumes en cubes réguliers. Faire revenir l''oignon et l''ail. Ajouter les aubergines, puis les courgettes, les poivrons et enfin les tomates. Assaisonner et laisser mijoter 45 minutes en remuant de temps en temps.',
    'Ne pas hésiter à utiliser des légumes légèrement flétris, ils donneront plus de saveur. Se conserve 3 jours au frais.',
    'Excellent chaud ou froid, avec du pain grillé, du riz ou des pâtes',
    92, true
);

-- ================================================================================================
-- 6. INGRÉDIENTS D'EXEMPLE POUR LES RECETTES
-- ================================================================================================

-- Note: Les IDs des produits doivent correspondre à vos vraies données
-- Voici la structure pour les ingrédients de la salade de tomates

/*
-- Exemple d'ingrédients pour la salade (à adapter avec vos vrais IDs)
INSERT INTO recipe_ingredients (recipe_id, product_type, product_id, quantity, unit, preparation_note, ingredient_group, sort_order, allow_auto_substitution) VALUES
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 'canonical', [ID_TOMATE], 500, 'g', 'en quartiers', 'base', 1, true),
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 'canonical', [ID_BASILIC], 20, 'g', 'ciselé', 'base', 2, true),
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 'canonical', [ID_HUILE_OLIVE], 30, 'ml', '', 'sauce', 3, false),
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 'canonical', [ID_VINAIGRE], 15, 'ml', '', 'sauce', 4, true);
*/

-- ================================================================================================
-- 7. ÉTAPES D'EXEMPLE
-- ================================================================================================

-- Étapes pour la salade de tomates
INSERT INTO recipe_steps (recipe_id, step_number, title, instruction, primary_technique_id, duration_min) VALUES
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 1, 'Préparation des tomates', 'Laver soigneusement les tomates et les découper en quartiers réguliers. Retirer le pédoncule si nécessaire.', (SELECT id FROM cooking_techniques WHERE name = 'Cru'), 5),
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 2, 'Préparation des herbes', 'Laver et sécher le basilic. Ciseler finement les feuilles avec un couteau bien aiguisé.', (SELECT id FROM cooking_techniques WHERE name = 'Cru'), 3),
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 3, 'Vinaigrette', 'Dans un petit bol, mélanger l''huile d''olive, le vinaigre balsamique, le sel et le poivre. Émulsionner à la fourchette.', (SELECT id FROM cooking_techniques WHERE name = 'Cru'), 2),
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 4, 'Assemblage', 'Dans un saladier, mélanger délicatement les tomates, le basilic et la vinaigrette. Laisser reposer 10 minutes avant de servir.', (SELECT id FROM cooking_techniques WHERE name = 'Marinade'), 10);

-- ================================================================================================
-- 8. TAGS D'EXEMPLE
-- ================================================================================================

INSERT INTO recipe_tags (recipe_id, tag, category, auto_generated) VALUES
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 'été', 'saison', true),
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 'rapide', 'temps', true),
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 'fraîcheur', 'saveur', false),
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 'méditerranéen', 'origine', false),
((SELECT id FROM recipes WHERE slug = 'salade-tomates-jardin'), 'anti-gaspi', 'inventory_based', true),

((SELECT id FROM recipes WHERE slug = 'ratatouille-garde-manger'), 'légumes', 'ingrédient', true),
((SELECT id FROM recipes WHERE slug = 'ratatouille-garde-manger'), 'mijoté', 'technique', true),
((SELECT id FROM recipes WHERE slug = 'ratatouille-garde-manger'), 'batch-cooking', 'préparation', false),
((SELECT id FROM recipes WHERE slug = 'ratatouille-garde-manger'), 'anti-gaspi', 'inventory_based', true),
((SELECT id FROM recipes WHERE slug = 'ratatouille-garde-manger'), 'provençal', 'saveur', false);

-- ================================================================================================
-- MESSAGE DE SUCCÈS
-- ================================================================================================

SELECT 
    '✅ Données d''exemple Myko chargées !' as status,
    (SELECT COUNT(*) FROM recipes WHERE is_active = true) || ' recettes créées' as recipes_count,
    (SELECT COUNT(*) FROM cooking_techniques) || ' techniques de cuisson' as techniques_count,
    'Prêt pour les fonctions avancées !' as next_step;