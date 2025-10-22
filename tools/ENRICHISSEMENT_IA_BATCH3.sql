-- ============================================================================
-- ENRICHISSEMENT IA AVANCÉE - 398 RECETTES
-- Analyse individuelle de chaque recette avec raisonnement spécifique
-- HIGH confidence: 398 (100%)
-- LOW confidence: 0 (0%)
-- ============================================================================

BEGIN;

-- [HIGH] Potage aux tomates
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8998;

-- [HIGH] Potage aux champignons
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8999;

-- [HIGH] Potage aux aubergines
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9000;

-- [HIGH] Potage aux poivrons
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9001;

-- [HIGH] Potage au chou-fleur
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9002;

-- [HIGH] Potage aux brocolis
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9003;

-- [HIGH] Potage aux navets
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9004;

-- [HIGH] Potage aux blettes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9005;

-- [HIGH] Potage au panais
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9006;

-- [HIGH] Potage au potiron
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9007;

-- [HIGH] Potage au chou rouge
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9008;

-- [HIGH] Potage aux artichauts
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9009;

-- [HIGH] Potage méditerranéen
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9010;

-- [HIGH] Crème de champignons
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9011;

-- [HIGH] Crème de poireaux
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9012;

-- [HIGH] Crème de courgettes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9013;

-- [HIGH] Crème de carottes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9014;

-- [HIGH] Crème de céleri
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9015;

-- [HIGH] Crème de brocolis
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9016;

-- [HIGH] Entrecôte grillée
--        Entrecôte grillée : pièce noble, besoin accompagnement
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9018;

-- [HIGH] Faux-filet grillé
--        Faux-filet : pièce noble grillée rapide
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 8, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9019;

-- [HIGH] Rumsteck grillé
--        Rumsteck : viande grillée tendre
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9020;

-- [HIGH] Bavette grillée
--        Bavette : pièce grillée/poêlée savoureuse
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 8, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9021;

-- [HIGH] Aloyau grillé
--        Aloyau : pièce noble dos bœuf
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 12, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9022;

-- [HIGH] Onglet grillé
--        Onglet : bavette grillée rapide
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 8, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9023;

-- [HIGH] Hampe grillée
--        Hampe : pièce grillée persillée
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 8, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9024;

-- [HIGH] Tournedos poêlé
--        Tournedos : médaillon filet poêlé
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9025;

-- [HIGH] Filet de bœuf poêlé
--        Filet bœuf poêlé : pièce noble tendre
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 12, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9026;

-- [HIGH] Pavé de bœuf grillé
--        Pavé bœuf : grosse pièce grillée
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 12, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9027;

-- [HIGH] Steak minute
--        Steak minute : ultra rapide poêlé
UPDATE recipes SET prep_time_minutes = 2, cook_time_minutes = 4, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9028;

-- [HIGH] Côte de bœuf grillée
--        Côte bœuf : pièce XXL grillée partagée
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Grillade', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9029;

-- [HIGH] Araignée de bœuf grillée
--        Araignée bœuf : pièce grillée rare
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 8, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9030;

-- [HIGH] Poire de bœuf grillée
--        Poire bœuf : muscle grillé tendre
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 8, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9031;

-- [HIGH] Merlan de bœuf grillé
--        Merlan bœuf : muscle grillé savoureux
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 8, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9032;

-- [HIGH] Bavette poêlée aux oignons
--        Bavette : pièce grillée/poêlée savoureuse
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 8, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9033;

-- [HIGH] Entrecôte au poivre
--        Entrecôte grillée : pièce noble, besoin accompagnement
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9034;

-- [HIGH] Steak grillé au beurre maître d’hôtel
--        Steak grillé : cuisson rapide, nécessite accompagnement
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9035;

-- [HIGH] Filet grillé aux herbes
--        Filet grillé : pièce noble tendre
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 12, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9036;

-- [HIGH] Daube provençale
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9038;

-- [HIGH] Pot-au-feu
--        Pot-au-feu : bœuf légumes bouillon long
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 180, servings = 8, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9040;

-- [HIGH] Bœuf carottes
--        Bœuf carottes : mijoté classique familial
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 120, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9041;

-- [HIGH] Navarin de bœuf
--        Navarin : ragoût agneau légumes printaniers
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9042;

-- [HIGH] Bœuf aux oignons
--        Bœuf légumes : mijoté familial complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9043;

-- [HIGH] Bœuf aux poivrons
--        Bœuf légumes : mijoté familial complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9044;

-- [HIGH] Bœuf aux champignons
--        Bœuf légumes : mijoté familial complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9045;

-- [HIGH] Bœuf aux carottes et pommes de terre
--        Pommes terre : cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9046;

-- [HIGH] Bœuf aux haricots blancs
--        Bœuf légumineuses : mijoté nourrissant complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9047;

-- [HIGH] Bœuf aux pois chiches
--        Bœuf légumineuses : mijoté nourrissant complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9048;

-- [HIGH] Bœuf aux lentilles
--        Bœuf légumineuses : mijoté nourrissant complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9049;

-- [HIGH] Bœuf aux courgettes
--        Bœuf légumes : mijoté familial complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9050;

-- [HIGH] Bœuf aux aubergines
--        Bœuf légumes : mijoté familial complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9051;

-- [HIGH] Bœuf aux tomates
--        Bœuf tomates : mijoté sauce tomate
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9052;

-- [HIGH] Bœuf au céleri
--        Bœuf légumes : mijoté familial complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9053;

-- [HIGH] Bœuf au chou
--        Bœuf légumes : mijoté familial complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9054;

-- [HIGH] Bœuf aux navets
--        Bœuf légumes : mijoté familial complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9055;

-- [HIGH] Bœuf aux épices
--        Bœuf épices : mijoté parfumé
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9056;

-- [HIGH] Bœuf stroganoff
--        Bœuf Stroganoff : crème moutarde russe
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9057;

-- [HIGH] Bœuf à la moutarde
--        Bœuf moutarde : viande crème moutarde
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9058;

-- [HIGH] Bœuf à la crème
--        Bœuf crème : mijoté sauce crémeuse
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9059;

-- [HIGH] Bœuf au curry doux
--        Bœuf curry : mijoté épices asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9060;

-- [HIGH] Bœuf au paprika
--        Bœuf paprika : mijoté hongrois
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9061;

-- [HIGH] Bœuf sauce tomate
--        Bœuf sauce tomate : mijoté tomates
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9062;

-- [HIGH] Bœuf sauce poivre
--        Bœuf sauce poivre : poêlé crème poivre
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9063;

-- [HIGH] Bœuf sauce au roquefort
--        Bœuf sauce fromage : poêlé crème fromagée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9064;

-- [HIGH] Bœuf sauce au gorgonzola
--        Bœuf sauce fromage : poêlé crème fromagée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9065;

-- [HIGH] Bœuf sauce au chèvre
--        Bœuf sauce fromage : poêlé crème fromagée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9066;

-- [HIGH] Bœuf sauce aux champignons
--        Bœuf sauce champignons : poêlé crème champignons
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9067;

-- [HIGH] Bœuf sauce aux poivrons
--        Bœuf sauce : viande sauce variée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9068;

-- [HIGH] Bœuf sauce aux oignons
--        Bœuf sauce : viande sauce variée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9069;

-- [HIGH] Bœuf sauce au citron
--        Bœuf sauce : viande sauce variée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9070;

-- [HIGH] Bœuf sauce au miel
--        Bœuf sauce : viande sauce variée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9071;

-- [HIGH] Bœuf sauce aux herbes
--        Bœuf sauce : viande sauce variée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9072;

-- [HIGH] Bœuf sauce aux tomates séchées
--        Bœuf sauce tomate : mijoté tomates
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9073;

-- [HIGH] Bœuf sauce au pesto
--        Bœuf sauce : viande sauce variée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9074;

-- [HIGH] Bœuf sauce au curry coco
--        Bœuf sauce : viande sauce variée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9075;

-- [HIGH] Blanquette de veau
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9076;

-- [HIGH] Sauté de veau marengo
--        Veau Marengo : sauté tomates olives
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9077;

-- [HIGH] Veau aux olives
--        Veau olives : mijoté méditerranéen
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9078;

-- [HIGH] Veau aux champignons
--        Veau légumes : mijoté tendre familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9079;

-- [HIGH] Veau aux carottes
--        Veau légumes : mijoté tendre familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9080;

-- [HIGH] Veau aux courgettes
--        Veau légumes : mijoté tendre familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9081;

-- [HIGH] Veau aux tomates
--        Veau légumes : mijoté tendre familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9082;

-- [HIGH] Veau aux poivrons
--        Veau légumes : mijoté tendre familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9083;

-- [HIGH] Veau aux aubergines
--        Veau légumes : mijoté tendre familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9084;

-- [HIGH] Veau aux oignons
--        Veau légumes : mijoté tendre familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9085;

-- [HIGH] Veau aux pommes de terre
--        Pommes terre : cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9086;

-- [HIGH] Veau aux haricots blancs
--        Veau légumineuses : mijoté complet nourrissant
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 50, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9087;

-- [HIGH] Veau aux pois chiches
--        Veau légumineuses : mijoté complet nourrissant
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 50, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9088;

-- [HIGH] Veau aux lentilles
--        Veau légumineuses : mijoté complet nourrissant
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 50, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9089;

-- [HIGH] Veau aux navets
--        Veau légumes : mijoté tendre familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9090;

-- [HIGH] Veau aux épinards
--        Veau légumes : mijoté tendre familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9091;

-- [HIGH] Veau aux herbes
--        Veau légumes : mijoté tendre familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9092;

-- [HIGH] Veau aux champignons sauvages
--        Veau légumes : mijoté tendre familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9093;

-- [HIGH] Veau au curry doux
--        Veau curry : mijoté épices douces
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9094;

-- [HIGH] Escalope de veau grillée
--        Escalope veau : poêlée tendre rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9095;

-- [HIGH] Escalope de veau panée
--        Escalope panée : classique croustillant
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9096;

-- [HIGH] Escalope de veau à la crème
--        Escalope crème : poêlée sauce crémeuse
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9097;

-- [HIGH] Escalope de veau à la moutarde
--        Escalope moutarde : poêlée sauce piquante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9098;

-- [HIGH] Escalope de veau aux champignons
--        Escalope champignons : poêlée crème champignons
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 18, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9099;

-- [HIGH] Escalope de veau au curry doux
--        Escalope curry : poêlée épices douces
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 18, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9100;

-- [HIGH] Côte de veau grillée
--        Côte veau grillée : pièce noble grillée
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 12, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9101;

-- [HIGH] Côte de veau au beurre
--        Côte veau : pièce noble poêlée
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 15, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9102;

-- [HIGH] Côte de veau aux herbes
--        Côte veau : pièce noble poêlée
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 15, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9103;

-- [HIGH] Côte de veau aux champignons
--        Côte veau champignons : poêlée crème champignons
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 18, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9104;

-- [HIGH] Filet de veau grillé
--        Filet grillé : pièce noble tendre
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 12, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9105;

-- [HIGH] Filet de veau à la crème
--        Filet veau crème : poêlé sauce crémeuse
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9106;

-- [HIGH] Grenadin de veau au poivre
--        Grenadin veau : médaillon épais poêlé
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 12, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9107;

-- [HIGH] Grenadin de veau aux champignons
--        Grenadin champignons : médaillon crème champignons
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9108;

-- [HIGH] Grenadin de veau au miel
--        Grenadin veau : médaillon épais poêlé
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 12, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9109;

-- [HIGH] Grenadin de veau aux herbes
--        Grenadin veau : médaillon épais poêlé
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 12, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9110;

-- [HIGH] Escalope de veau milanaise
--        Escalope milanaise : panée italienne citron
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9111;

-- [HIGH] Escalope de veau cordon bleu
--        Cordon bleu : escalope farcie jambon fromage
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9112;

-- [HIGH] Côte de veau à la moutarde
--        Côte veau moutarde : poêlée sauce piquante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9113;

-- [HIGH] Filet de veau sauce tomate
--        Filet veau : pièce noble poêlée
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 15, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9114;

-- [HIGH] Gigot d’agneau rôti
--        Gigot agneau : rôti four traditionnel
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9115;

-- [HIGH] Gigot d’agneau aux herbes
--        Gigot agneau : rôti four traditionnel
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9116;

-- [HIGH] Gigot d’agneau au miel
--        Gigot agneau : rôti four traditionnel
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9117;

-- [HIGH] Gigot d’agneau à l’ail
--        Gigot agneau : rôti four traditionnel
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9118;

-- [HIGH] Gigot d’agneau à la moutarde
--        Gigot agneau : rôti four traditionnel
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9119;

-- [HIGH] Gigot d’agneau aux tomates
--        Gigot agneau : rôti four traditionnel
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9120;

-- [HIGH] Carré d’agneau rôti
--        Carré agneau : côtes rôties four noble
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9121;

-- [HIGH] Carré d’agneau grillé
--        Carré agneau : côtes rôties four noble
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9122;

-- [HIGH] Carré d’agneau aux herbes
--        Carré agneau : pièce noble rôtie
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9123;

-- [HIGH] Carré d’agneau au miel
--        Carré agneau miel : rôti glaçage sucré
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9124;

-- [HIGH] Côtelettes d’agneau grillées
--        Côtelettes agneau : grillées rapide, besoin accompagnement
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9125;

-- [HIGH] Côtelettes d’agneau aux herbes
--        Côtelettes agneau : grillées rapide, besoin accompagnement
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9126;

-- [HIGH] Côtelettes d’agneau au curry doux
--        Curry agneau : épicé indien
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9127;

-- [HIGH] Côtelettes d’agneau à la provençale
--        Côtelettes agneau : grillées rapide, besoin accompagnement
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9128;

-- [HIGH] Côtelettes d’agneau au paprika
--        Côtelettes agneau : grillées rapide, besoin accompagnement
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9129;

-- [HIGH] Épaule d’agneau rôtie
--        Épaule agneau : rôtie four longue familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 120, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9130;

-- [HIGH] Épaule d’agneau grillée
--        Épaule agneau : rôtie four longue familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 120, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9131;

-- [HIGH] Épaule d’agneau au miel
--        Épaule agneau miel : rôtie glaçage sucré
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 130, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9132;

-- [HIGH] Épaule d’agneau aux herbes
--        Épaule agneau : rôtie four familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 120, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9133;

-- [HIGH] Épaule d’agneau à la moutarde
--        Épaule agneau : rôtie four familial
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 120, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9134;

-- [HIGH] Navarin d’agneau
--        Navarin agneau : ragoût légumes printaniers
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9135;

-- [HIGH] Ragoût d’agneau
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9136;

-- [HIGH] Agneau aux carottes
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9137;

-- [HIGH] Agneau aux poireaux
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9138;

-- [HIGH] Agneau aux champignons
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9139;

-- [HIGH] Agneau aux pois chiches
--        Agneau légumineuses : mijoté complet méditerranéen
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9140;

-- [HIGH] Agneau aux lentilles
--        Agneau légumineuses : mijoté complet méditerranéen
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9141;

-- [HIGH] Agneau aux haricots blancs
--        Agneau légumineuses : mijoté complet méditerranéen
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9142;

-- [HIGH] Agneau aux tomates
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9143;

-- [HIGH] Agneau aux aubergines
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9144;

-- [HIGH] Agneau aux courgettes
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9145;

-- [HIGH] Agneau aux poivrons
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9146;

-- [HIGH] Agneau au céleri
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9147;

-- [HIGH] Agneau aux navets
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9148;

-- [HIGH] Agneau aux épinards
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9149;

-- [HIGH] Agneau aux pommes de terre
--        Pommes terre : cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9150;

-- [HIGH] Agneau aux oignons
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9151;

-- [HIGH] Agneau aux herbes
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9152;

-- [HIGH] Agneau au curry doux
--        Curry agneau : épicé indien
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9153;

-- [HIGH] Agneau korma
--        Agneau korma : curry doux crémeux amandes
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 50, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9154;

-- [HIGH] Agneau massala
--        Agneau massala : curry épices complexes
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 50, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9155;

-- [HIGH] Agneau à la tomate
--        Agneau légumes : mijoté savoureux complet
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9156;

-- [HIGH] Agneau à la moutarde
--        Agneau sauce : mijoté sauce savoureuse
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9157;

-- [HIGH] Agneau à la crème
--        Agneau sauce : mijoté sauce savoureuse
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9158;

-- [HIGH] Agneau au paprika
--        Agneau épices : mijoté oriental épicé
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9159;

-- [HIGH] Agneau au romarin
--        Agneau aromatisé : mijoté parfumé
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 80, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9160;

-- [HIGH] Agneau au thym
--        Agneau aromatisé : mijoté parfumé
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 80, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9161;

-- [HIGH] Agneau au miel
--        Agneau aromatisé : mijoté parfumé
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 80, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9162;

-- [HIGH] Agneau aux épices
--        Agneau épices : mijoté oriental épicé
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9163;

-- [HIGH] Agneau aux pruneaux
--        Agneau fruits : mijoté sucré-salé oriental
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9164;

-- [HIGH] Agneau aux figues
--        Agneau fruits : mijoté sucré-salé oriental
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9165;

-- [HIGH] Agneau aux abricots
--        Agneau fruits : mijoté sucré-salé oriental
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9166;

-- [HIGH] Agneau aux poires
--        Agneau fruits : mijoté sucré-salé oriental
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9167;

-- [HIGH] Agneau aux pommes
--        Agneau accompagnement : mijoté savoureux
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 80, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9168;

-- [HIGH] Agneau au citron
--        Agneau aromatisé : mijoté parfumé
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 80, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9169;

-- [HIGH] Agneau aux olives
--        Agneau accompagnement : mijoté savoureux
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 80, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9170;

-- [HIGH] Agneau au gingembre
--        Agneau sauce : mijoté sauce savoureuse
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9171;

-- [HIGH] Rôti de porc aux herbes
--        Rôti de porc : cuisson four longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 75, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9172;

-- [HIGH] Rôti de porc au miel
--        Rôti de porc : cuisson four longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 75, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9174;

-- [HIGH] Rôti de porc au paprika
--        Rôti de porc : cuisson four longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 75, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9175;

-- [HIGH] Rôti de porc au curry doux
--        Rôti de porc : cuisson four longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 75, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9176;

-- [HIGH] Rôti de porc à l’ail
--        Rôti de porc : cuisson four longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 75, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9177;

-- [HIGH] Rôti de porc aux pommes
--        Rôti de porc : cuisson four longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 75, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9178;

-- [HIGH] Rôti de porc aux pruneaux
--        Rôti de porc : cuisson four longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 75, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9179;

-- [HIGH] Côtes de porc grillées
--        Côtes porc grillées : rapide savoureux
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 15, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9180;

-- [HIGH] Côtes de porc marinées
--        Côtes porc : poêlées rapide économique
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9181;

-- [HIGH] Côtes de porc au barbecue
--        Côtes porc BBQ : marinées grillées sauce
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9182;

-- [HIGH] Côtes de porc au miel
--        Côtes porc miel : glacées four sucrées
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 18, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9183;

-- [HIGH] Côtes de porc aux herbes
--        Côtes porc : poêlées rapide économique
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9184;

-- [HIGH] Côtes de porc au curry doux
--        Côtes porc : poêlées rapide économique
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9185;

-- [HIGH] Filet mignon grillé
--        Filet grillé : pièce noble tendre
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 12, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9186;

-- [HIGH] Filet mignon au miel
--        Filet mignon miel : rôti glaçage sucré
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9187;

-- [HIGH] Filet mignon à la moutarde
--        Filet mignon moutarde : rôti croûte
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9188;

-- [HIGH] Filet mignon au romarin
--        Filet mignon herbes : rôti aromatisé
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 18, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9189;

-- [HIGH] Sauté de porc au curry doux
--        Sauté porc : wok rapide asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9191;

-- [HIGH] Sauté de porc aux champignons
--        Sauté porc : wok rapide asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9192;

-- [HIGH] Sauté de porc aux oignons
--        Sauté porc : wok rapide asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9193;

-- [HIGH] Sauté de porc aux poivrons
--        Sauté porc : wok rapide asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9194;

-- [HIGH] Sauté de porc aux tomates
--        Sauté porc : wok rapide asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9195;

-- [HIGH] Sauté de porc aux carottes
--        Sauté porc légumes : wok rapide
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9196;

-- [HIGH] Sauté de porc aux courgettes
--        Sauté porc : wok rapide asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9197;

-- [HIGH] Sauté de porc aux aubergines
--        Sauté porc légumes : wok rapide
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9198;

-- [HIGH] Sauté de porc au miel
--        Sauté porc miel : wok sucré-salé
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 18, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9199;

-- [HIGH] Porc aux pruneaux
--        Porc fruits : mijoté sucré-salé automnal
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9200;

-- [HIGH] Porc aux pommes
--        Porc fruits : mijoté sucré-salé automnal
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9201;

-- [HIGH] Porc aux poires
--        Porc fruits : mijoté sucré-salé automnal
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9202;

-- [HIGH] Porc aux figues
--        Porc fruits : mijoté sucré-salé automnal
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9203;

-- [HIGH] Porc aux raisins secs
--        Porc fruits : mijoté sucré-salé automnal
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9204;

-- [HIGH] Porc aux marrons
--        Porc fruits : mijoté sucré-salé automnal
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9205;

-- [HIGH] Porc aux herbes
--        Porc aromatisé : mijoté savoureux
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9206;

-- [HIGH] Porc au gingembre
--        Porc asiatique : wok ou mijoté épices
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9207;

-- [HIGH] Porc à la moutarde
--        Porc aromatisé : mijoté savoureux
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9208;

-- [HIGH] Porc au curry doux
--        Porc curry : mijoté épices asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9209;

-- [HIGH] Porc sauce tomate
--        Porc sauce tomate : mijoté italien
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9210;

-- [HIGH] Porc sauce soja
--        Porc sauce : viande sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9211;

-- [HIGH] Porc sauce au miel
--        Porc sauce miel : glacé sucré-salé
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9212;

-- [HIGH] Porc sauce au roquefort
--        Porc sauce fromage : poêlé crème fromagée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9213;

-- [HIGH] Porc sauce aux champignons
--        Porc sauce : viande sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9214;

-- [HIGH] Porc sauce aux oignons
--        Porc sauce : viande sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9215;

-- [HIGH] Porc sauce aux poivrons
--        Porc sauce : viande sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9216;

-- [HIGH] Porc sauce au paprika
--        Porc sauce paprika : mijoté épicé
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9217;

-- [HIGH] Porc sauce à la bière
--        Porc sauce bière : mijoté flamand
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9218;

-- [HIGH] Porc sauce aux herbes
--        Porc sauce : mijoté sauce variée
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9219;

-- [HIGH] Porc sauce aux tomates séchées
--        Porc sauce tomate : mijoté italien
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9220;

-- [HIGH] Porc sauce au pesto
--        Porc sauce : mijoté sauce variée
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9221;

-- [HIGH] Porc sauce au lait de coco
--        Porc sauce : mijoté sauce variée
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9222;

-- [HIGH] Porc sauce au curry coco
--        Porc sauce : viande sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9223;

-- [HIGH] Porc sauce aigre-douce
--        Porc aigre-doux : sauce sucrée chinoise
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9224;

-- [HIGH] Chevreuil rôti
--        Gibier rôti : four mariné sauce fruits
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9225;

-- [HIGH] Chevreuil aux herbes
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9226;

-- [HIGH] Chevreuil au miel
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9227;

-- [HIGH] Chevreuil au poivre
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9228;

-- [HIGH] Chevreuil au romarin
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9229;

-- [HIGH] Sanglier rôti
--        Gibier rôti : four mariné sauce fruits
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9230;

-- [HIGH] Sanglier au miel
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9231;

-- [HIGH] Sanglier aux pruneaux
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9232;

-- [HIGH] Cerf rôti
--        Gibier rôti : four mariné sauce fruits
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9233;

-- [HIGH] Cerf au poivre
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9234;

-- [HIGH] Cerf aux champignons
--        Gibier accompagnement : mijoté sauce forestière
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9235;

-- [HIGH] Lièvre rôti
--        Lièvre rôti : four mariné
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9236;

-- [HIGH] Lièvre aux herbes
--        Lièvre aromatisé : mijoté sauce
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9237;

-- [HIGH] Lièvre à la moutarde
--        Lièvre aromatisé : mijoté sauce
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9238;

-- [HIGH] Faisan rôti
--        Volaille gibier rôtie : four noble festive
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9239;

-- [HIGH] Faisan aux raisins
--        Volaille gibier fruits : rôtie four sucré-salé
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 50, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9240;

-- [HIGH] Civet de sanglier
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9241;

-- [HIGH] Civet de chevreuil
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9242;

-- [HIGH] Civet de lièvre
--        Civet lièvre : mariné sang vin rouge long
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9243;

-- [HIGH] Civet de cerf
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9244;

-- [HIGH] Sanglier aux carottes
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9245;

-- [HIGH] Sanglier aux champignons
--        Gibier accompagnement : mijoté sauce forestière
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9246;

-- [HIGH] Sanglier aux pommes
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9247;

-- [HIGH] Chevreuil aux airelles
--        Gibier accompagnement : mijoté sauce forestière
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9248;

-- [HIGH] Chevreuil aux champignons
--        Gibier accompagnement : mijoté sauce forestière
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9249;

-- [HIGH] Chevreuil aux pruneaux
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9250;

-- [HIGH] Lièvre aux poires
--        Lièvre fruits : mijoté sucré-salé
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9251;

-- [HIGH] Lièvre aux figues
--        Lièvre fruits : mijoté sucré-salé
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9252;

-- [HIGH] Cerf aux marrons
--        Gibier accompagnement : mijoté sauce forestière
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9253;

-- [HIGH] Cerf aux myrtilles
--        Gibier accompagnement : mijoté sauce forestière
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9254;

-- [HIGH] Faisan aux poires
--        Volaille gibier fruits : rôtie four sucré-salé
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 50, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9255;

-- [HIGH] Faisan aux pommes
--        Volaille gibier : rôtie four savoureuse
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9256;

-- [HIGH] Faisan aux champignons
--        Volaille gibier : rôtie four savoureuse
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9257;

-- [HIGH] Bécasse mijotée
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9258;

-- [HIGH] Bécasse aux pruneaux
--        Volaille gibier fruits : rôtie four sucré-salé
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 50, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9259;

-- [HIGH] Burger classique
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9260;

-- [HIGH] Burger au fromage
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9261;

-- [HIGH] Burger au bacon
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9262;

-- [HIGH] Burger au bleu
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9263;

-- [HIGH] Burger au roquefort
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9264;

-- [HIGH] Burger au chèvre
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9265;

-- [HIGH] Burger au gorgonzola
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9266;

-- [HIGH] Burger au pesto
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9267;

-- [HIGH] Burger au curry doux
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9268;

-- [HIGH] Burger au poulet et bœuf
--        Burger bœuf : classique cheddar bacon
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9269;

-- [HIGH] Burger aux champignons
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9270;

-- [HIGH] Burger aux oignons
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9271;

-- [HIGH] Burger aux tomates
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9272;

-- [HIGH] Burger aux poivrons
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9273;

-- [HIGH] Burger aux aubergines
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9274;

-- [HIGH] Burger aux courgettes
--        Burger : sandwich garni complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9275;

-- [HIGH] Sandwich au steak
--        Sandwich steak : pain garni steak poêlé
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 2, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9276;

-- [HIGH] Sandwich au rôti de bœuf
--        Sandwich bœuf : pain garni viande froide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 2, cooking_method = 'Sans cuisson', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9277;

-- [HIGH] Wrap au bœuf grillé
--        Wrap : tortilla roulée garnie
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 2, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9278;

-- [HIGH] Wrap au bœuf aux herbes
--        Wrap : tortilla roulée garnie
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 2, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9279;

-- [HIGH] Boulettes de bœuf
--        Boulettes bœuf : façonnées poêlées sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9280;

-- [HIGH] Boulettes de veau
--        Boulettes veau : façonnées sauce tomate
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9281;

-- [HIGH] Boulettes d’agneau
--        Boulettes : façonnées poêlées sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9282;

-- [HIGH] Boulettes de porc
--        Boulettes porc : façonnées sauce tomate
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9283;

-- [HIGH] Boulettes au curry doux
--        Boulettes : façonnées poêlées sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9284;

-- [HIGH] Boulettes à la tomate
--        Boulettes : façonnées poêlées sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9285;

-- [HIGH] Boulettes au fromage
--        Boulettes : façonnées poêlées sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9286;

-- [HIGH] Boulettes aux herbes
--        Boulettes : façonnées poêlées sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9287;

-- [HIGH] Boulettes aux champignons
--        Boulettes : façonnées poêlées sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9288;

-- [HIGH] Boulettes aux oignons
--        Boulettes : façonnées poêlées sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9289;

-- [HIGH] Steak haché poêlé
--        Steak haché : rapide polyvalent
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9290;

-- [HIGH] Steak haché au barbecue
--        Steak haché : rapide polyvalent
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9291;

-- [HIGH] Steak haché au fromage
--        Steak haché : rapide polyvalent
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9292;

-- [HIGH] Steak haché aux herbes
--        Steak haché : rapide polyvalent
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9293;

-- [HIGH] Steak haché aux oignons
--        Steak haché : rapide polyvalent
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9294;

-- [HIGH] Steak haché au poivre
--        Steak haché : rapide polyvalent
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9295;

-- [HIGH] Polpette italiennes
--        Polpette : boulettes italiennes sauce tomate
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9296;

-- [HIGH] Keftas d’agneau
--        Kefta : brochettes viande épicées
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9297;

-- [HIGH] Keftas de bœuf
--        Kefta : brochettes viande épicées
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9298;

-- [HIGH] Keftas de veau
--        Kefta : brochettes viande épicées
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9299;

-- [HIGH] Chateaubriand
--        Chateaubriand : cœur filet bœuf noble
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9300;

-- [HIGH] Tournedos Rossini
--        Tournedos : médaillon filet poêlé
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9301;

-- [HIGH] Filet de bœuf Wellington
--        Bœuf Wellington : filet pâte feuilletée luxe
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9302;

-- [HIGH] Entrecôte maître d’hôtel
--        Entrecôte grillée : pièce noble, besoin accompagnement
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9303;

-- [HIGH] Côte de bœuf XXL
--        Côte bœuf : pièce XXL grillée partagée
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Grillade', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9304;

-- [HIGH] Magret de canard au foie gras
--        Magret/aiguillettes : canard poêlé rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9305;

-- [HIGH] Gigot d’agneau pascal
--        Gigot agneau : rôti four traditionnel
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9306;

-- [HIGH] Épaule d’agneau de fête
--        Épaule agneau fête : rôtie farcie festive
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9307;

-- [HIGH] Navarin d’agneau royal
--        Navarin agneau : ragoût légumes printaniers
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9308;

-- [HIGH] Cerf aux truffes
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9309;

-- [HIGH] Chevreuil au foie gras
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9310;

-- [HIGH] Sanglier de fête
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9311;

-- [HIGH] Lièvre à la royale
--        Lièvre à la royale : farci mijoté luxe
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 180, servings = 8, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9312;

-- [HIGH] Bécasse truffée
--        Volaille gibier truffée : rôtie luxueuse
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 50, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9313;

-- [HIGH] Terrine de gibier royale
--        Terrine gibier : farce four pâté
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 90, servings = 10, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9314;

-- [HIGH] Filet de bœuf aux morilles
--        Filet bœuf morilles : poêlé sauce champignons luxe
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9315;

-- [HIGH] Rôti de veau aux morilles
--        Rôti veau morilles : four sauce luxueuse
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9316;

-- [HIGH] Bœuf teriyaki
--        Viande marinée asiatique : nécessite riz
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9317;

-- [HIGH] Bœuf sauté thaï
--        Bœuf sauté thaï : wok épices asiatiques
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 12, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9318;

-- [HIGH] Bœuf curry coco
--        Bœuf curry : mijoté épices asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9319;

-- [HIGH] Bœuf au satay
--        Bœuf satay : brochettes sauce cacahuète
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 15, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9320;

-- [HIGH] Bœuf bulgogi
--        Viande marinée asiatique : nécessite riz
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9321;

-- [HIGH] Bœuf au soja
--        Bœuf soja : sauté sauce soja
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9322;

-- [HIGH] Agneau tikka masala
--        Agneau tikka masala : tandoori sauce épicée
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9323;

-- [HIGH] Agneau curry thaï
--        Curry agneau : épicé indien
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9324;

-- [HIGH] Porc au caramel
--        Porc caramel : sucré-salé asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9325;

-- [HIGH] Porc au soja
--        Porc asiatique : wok ou mijoté épices
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9326;

-- [HIGH] Porc à l’aigre-douce
--        Porc aigre-doux : sauce sucrée chinoise
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9327;

-- [HIGH] Porc au satay
--        Porc asiatique : wok ou mijoté épices
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9328;

-- [HIGH] Porc au curry japonais
--        Porc curry : mijoté épices asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9329;

-- [HIGH] Porc teriyaki
--        Viande marinée asiatique : nécessite riz
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 9330;

-- [HIGH] Veau au gingembre
--        Veau asiatique : wok épices
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9331;

-- [HIGH] Veau à la citronnelle
--        Veau asiatique : wok épices
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9332;

-- [HIGH] Veau à la thaï
--        Veau asiatique : wok épices
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9333;

-- [HIGH] Rosbif froid
--        Rosbif froid : rôti refroidi tranché
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9334;

-- [HIGH] Rôti de veau froid
--        Rôti veau froid : four refroidi tranché
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9335;

-- [HIGH] Rôti de porc froid
--        Rôti de porc : cuisson four longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 75, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9336;

-- [HIGH] Salade de bœuf froid
--        Salade bœuf froid : bœuf cuit refroidi salade
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9337;

-- [HIGH] Salade de veau froid
--        Salade veau froid : veau cuit refroidi salade
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9338;

-- [HIGH] Salade de porc froid
--        Salade porc froid : porc cuit refroidi salade
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9339;

-- [HIGH] Carpaccio de bœuf
--        Bœuf cru : tranché fin ou haché assaisonné
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9340;

-- [HIGH] Carpaccio de veau
--        Veau cru : préparation raffinée froide
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9341;

-- [HIGH] Carpaccio d’agneau
--        Agneau cru : tranché fin ou haché raffiné
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9342;

-- [HIGH] Carpaccio de gibier
--        Carpaccio/tartare gibier : cru tranché raffiné
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9343;

-- [HIGH] Tartare de bœuf
--        Bœuf cru : tranché fin ou haché assaisonné
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9344;

-- [HIGH] Tartare de veau
--        Veau cru : préparation raffinée froide
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9345;

-- [HIGH] Tartare d’agneau
--        Agneau cru : tranché fin ou haché raffiné
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9346;

-- [HIGH] Tartare de gibier
--        Carpaccio/tartare gibier : cru tranché raffiné
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9347;

-- [HIGH] Rillettes de bœuf
--        Rillettes : mixage poisson/viande cuite
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9348;

-- [HIGH] Rillettes de porc
--        Rillettes : mixage poisson/viande cuite
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9349;

-- [HIGH] Terrine de gibier
--        Terrine gibier : farce four pâté
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 90, servings = 10, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9350;

-- [HIGH] Terrine de bœuf
--        Terrine bœuf : farce four pâté
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 90, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9351;

-- [HIGH] Terrine de veau
--        Terrine veau : farce four entrée
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 90, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 9352;

-- [HIGH] Terrine de sanglier
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9353;

-- [HIGH] Tourte au bœuf
--        Tourte : pâte brisée garnie four
UPDATE recipes SET prep_time_minutes = 35, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9354;

-- [HIGH] Tourte au bœuf et champignons
--        Bœuf légumes : mijoté familial complet
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9355;

-- [HIGH] Tourte au bœuf et légumes
--        Tourte : pâte brisée garnie four
UPDATE recipes SET prep_time_minutes = 35, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9356;

-- [HIGH] Tourte au veau
--        Tourte veau : pâte brisée garnie four
UPDATE recipes SET prep_time_minutes = 35, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9357;

-- [HIGH] Tourte au veau et champignons
--        Tourte veau : pâte brisée garnie four
UPDATE recipes SET prep_time_minutes = 35, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9358;

-- [HIGH] Tourte au veau et légumes
--        Tourte veau : pâte brisée garnie four
UPDATE recipes SET prep_time_minutes = 35, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9359;

-- [HIGH] Tourte à l’agneau
--        Tourte agneau : pâte brisée garnie four
UPDATE recipes SET prep_time_minutes = 35, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9360;

-- [HIGH] Tourte à l’agneau et légumes
--        Tourte agneau : pâte brisée garnie four
UPDATE recipes SET prep_time_minutes = 35, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9361;

-- [HIGH] Tourte au porc
--        Tourte porc : pâte brisée garnie four
UPDATE recipes SET prep_time_minutes = 35, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9362;

-- [HIGH] Tourte au porc et légumes
--        Tourte porc : pâte brisée garnie four
UPDATE recipes SET prep_time_minutes = 35, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9363;

-- [HIGH] Tourte au gibier
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9364;

-- [HIGH] Tourte au gibier et champignons
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 100, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9365;

-- [HIGH] Feuilleté au bœuf
--        Feuilleté bœuf : pâte feuilletée garnie
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9366;

-- [HIGH] Feuilleté au veau
--        Feuilleté veau : pâte feuilletée garnie
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9367;

-- [HIGH] Feuilleté à l’agneau
--        Feuilleté agneau : pâte feuilletée garnie
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9368;

-- [HIGH] Feuilleté au porc
--        Feuilleté porc : pâte feuilletée garnie
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9369;

-- [HIGH] Feuilleté au gibier
--        Feuilleté gibier : pâte feuilletée garnie
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9370;

-- [HIGH] Feuilleté au sanglier
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9371;

-- [HIGH] Feuilleté au chevreuil
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9372;

-- [HIGH] Feuilleté au cerf
--        Gibier : mijoté mariné sauce puissante
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9373;

-- [HIGH] Bœuf au miso
--        Bœuf miso : sauté pâte miso japonais
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9374;

-- [HIGH] Bœuf au sésame noir
--        Bœuf sésame : sauté graines sésame
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9375;

-- [HIGH] Bœuf au curry cacao
--        Bœuf curry : mijoté épices asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9376;

-- [HIGH] Sauce béchamel
--        Béchamel : sauce blanche roux lait
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 6, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9377;

-- [HIGH] Sauce hollandaise
--        Hollandaise : sauce beurre jaunes œufs
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 8, servings = 4, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9378;

-- [HIGH] Sauce béarnaise
--        Béarnaise : sauce estragon échalotes
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 8, servings = 4, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9379;

-- [HIGH] Sauce au poivre
--        Sauce poivre : crème poivre concassé
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9380;

-- [HIGH] Sauce moutarde
--        Sauce moutarde : crème moutarde
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 8, servings = 4, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9381;

-- [HIGH] Sauce au beurre blanc
--        Beurre blanc : réduction vin blanc beurre
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9382;

-- [HIGH] Sauce tomate nature
--        Sauce tomate : tomates mijotées herbes
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 30, servings = 6, cooking_method = 'Mijotage', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9383;

-- [HIGH] Sauce tomate au basilic
--        Sauce tomate : tomates mijotées herbes
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 30, servings = 6, cooking_method = 'Mijotage', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9384;

-- [HIGH] Sauce bolognaise
--        Sauce bolognaise : viande tomate longue
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 8, cooking_method = 'Mijotage', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9385;

-- [HIGH] Mayonnaise
--        Sauce : préparation liquide accompagnement
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 6, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9386;

-- [HIGH] Aïoli
--        Aïoli : mayonnaise ail provençale
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9387;

-- [HIGH] Pesto
--        Sauce : préparation liquide accompagnement
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 6, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9388;

-- [HIGH] Tapenade
--        Tapenade/tartinade : mixage ingrédients
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9389;

-- [HIGH] Guacamole
--        Guacamole : écrasé avocat, très rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9390;

-- [HIGH] Tzatziki
--        Tzatziki : sauce grecque concombre-yaourt
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9391;

-- [HIGH] Salsa
--        Sauce : préparation liquide accompagnement
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 6, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9392;

-- [HIGH] Vinaigrette classique
--        Vinaigrette classique : huile vinaigre moutarde
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9393;

-- [HIGH] Sauce soja sucrée
--        Sauce soja : soja sucré réduit
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 5, servings = 4, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9394;

-- [HIGH] Sauce curry
--        Sauce curry : épices crème
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9395;

-- [HIGH] Sauce barbecue
--        Sauce BBQ : tomate fumée sucrée
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 6, cooking_method = 'Cuisson douce', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9396;

-- [HIGH] Bouillon de légumes
--        Bouillon légumes : mijotéclarifier base
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 60, servings = 10, cooking_method = 'Mijotage', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9397;

-- [HIGH] Bouillon de volaille
--        Bouillon volaille : carcasse mijoté fond
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 120, servings = 10, cooking_method = 'Mijotage', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9398;

-- [HIGH] Fond de veau
--        Fond veau : os mijotés long réduit
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 240, servings = 10, cooking_method = 'Mijotage', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9399;

-- [HIGH] Fumet de poisson
--        Fumet poisson : arêtes têtes court
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 8, cooking_method = 'Mijotage', is_complete_meal = NULL, needs_side_dish = NULL WHERE id = 9400;

COMMIT;
