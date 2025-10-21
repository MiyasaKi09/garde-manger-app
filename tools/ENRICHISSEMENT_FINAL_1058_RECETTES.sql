-- ============================================================================
-- ENRICHISSEMENT INTELLIGENT - 360 RECETTES
-- HIGH confidence: 105 (35%)
-- LOW confidence: 195 (65%)
-- ============================================================================

BEGIN;

-- [LOW] Sorbet maison (citron (Non reconnu)
-- [LOW] Nice cream (glace à la banane congelée) (Non reconnu)
-- [LOW] Energy balls aux dattes et noix de cajou (Non reconnu)
-- [LOW] Barres de céréales maison (Non reconnu)
-- [LOW] Yaourt glacé (frozen yogurt) aux fruits (Non reconnu)
-- [LOW] Mousse d'avocat au cacao (Non reconnu)
-- [LOW] Pommes en tranches et beurre de cacahuètes (Non reconnu)
-- [LOW] Baguette tradition française (Non reconnu)
-- [LOW] Naans indiens au fromage (Non reconnu)
-- [LOW] Chapatis (Non reconnu)
-- [LOW] Bretzels alsaciens (Non reconnu)
-- [LOW] Ciabatta italienne (Non reconnu)
-- [LOW] Croissants au beurre (Non reconnu)
-- [LOW] Chinois (gâteau brioché à la crème) (Non reconnu)
-- [LOW] Tripes à la mode de Caen (Non reconnu)
-- [LOW] Potjevleesch flamand (Non reconnu)
-- [HIGH] Daube niçoise (Daube)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 180, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 536;
-- [LOW] Pieds paquets marseillais (Non reconnu)
-- [LOW] Alouettes sans tête provençales (Non reconnu)
-- [LOW] Fricassée de volaille à l'angevine (Non reconnu)
-- [HIGH] Poule au pot (Plat traditionnel)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 180, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 540;
-- [HIGH] Coquilles Saint-Jacques à la bretonne (Coquilles)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 5, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 541;
-- [LOW] Cotriade bretonne (Non reconnu)
-- [LOW] Matelote d'anguille (Non reconnu)
-- [LOW] Lamproie à la bordelaise (Non reconnu)
-- [LOW] Ttoro (soupe de poisson basque) (Non reconnu)
-- [LOW] Morue à la lyonnaise (Non reconnu)
-- [LOW] Quenelles de brochet sauce Nantua (Non reconnu)
-- [LOW] Grenouilles en persillade (Non reconnu)
-- [LOW] Fricassée d'escargots (Non reconnu)
-- [LOW] Caillettes ardéchoises (Non reconnu)
-- [LOW] Diots de Savoie au vin blanc (Non reconnu)
-- [LOW] Farçous aveyronnais (Non reconnu)
-- [LOW] Crique ardéchoise (galette de pommes de terre) (Non reconnu)
-- [LOW] Tarte à l'oignon alsacienne (Non reconnu)
-- [LOW] Salsifis à la crème (Non reconnu)
-- [LOW] Pan bagnat (le vrai) (Non reconnu)
-- [LOW] Soupe au pistou (Non reconnu)
-- [LOW] Tourton des Alpes (Non reconnu)
-- [HIGH] Oreilles d'âne du Valgaudemar (gratin d'épinards) (Gratin)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 565;
-- [LOW] Pôchouse de Verdun-sur-le-Doubs (version légumes) (Non reconnu)
-- [LOW] Flaugnarde aux pommes (Non reconnu)
-- [LOW] Millassou (galette de pomme de terre) (Non reconnu)
-- [LOW] Escargots de Bourgogne (Non reconnu)
-- [LOW] Lentilles vertes du Berry en salade (Non reconnu)
-- [HIGH] Ceviche péruvien (Ceviche)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Marinade', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 572;
-- [LOW] Lomo saltado (sauté de bœuf péruvien) (Non reconnu)
-- [LOW] Aji de gallina (poulet en sauce pimentée) (Non reconnu)
-- [HIGH] Feijoada brésilienne (Feijoada)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 120, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 575;
-- [LOW] Pão de queijo (pains au fromage brésiliens) (Non reconnu)
-- [LOW] Moqueca de peixe (ragoût de poisson brésilien) (Non reconnu)
-- [LOW] Ropa vieja cubaine (bœuf effiloché) (Non reconnu)
-- [LOW] Picadillo (Non reconnu)
-- [LOW] Arroz con pollo (Non reconnu)
-- [LOW] Sancocho (soupe colombienne) (Non reconnu)
-- [LOW] Bandeja paisa (plat complet colombien) (Non reconnu)
-- [LOW] Chiles rellenos (piments farcis mexicains) (Non reconnu)
-- [LOW] Mole poblano (Non reconnu)
-- [LOW] Cochinita pibil (Non reconnu)
-- [LOW] Pozole (soupe mexicaine) (Non reconnu)
-- [LOW] Tamales (Non reconnu)
-- [LOW] Pastel de choclo (gâteau de maïs chilien) (Non reconnu)
-- [LOW] Humitas (Non reconnu)
-- [LOW] Gallo pinto (riz et haricots du Costa Rica) (Non reconnu)
-- [LOW] Patacones (bananes plantain frites) (Non reconnu)
-- [HIGH] Pastilla au poulet et aux amandes (Pastilla)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 595;
-- [LOW] Rfissa marocaine (poulet (Non reconnu)
-- [LOW] Tanjia marrakchia (Non reconnu)
-- [HIGH] Bissara (soupe de fèves) (Légumineuses)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 598;
-- [LOW] Zaalouk (salade d'aubergines cuite) (Non reconnu)
-- [HIGH] Poulet Yassa sénégalais (Yassa)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 600;
-- [HIGH] Mafé (sauce à base d'arachide) (Mafé)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 601;
-- [LOW] Thieboudienne (riz au poisson sénégalais) (Non reconnu)
-- [HIGH] Doro Wat (ragoût de poulet éthiopien) (Doro wat)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 603;
-- [HIGH] Injera (crêpe éthiopienne au teff) (Injera)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Fermentation', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 604;
-- [LOW] Shish Taouk (brochettes de poulet libanaises) (Non reconnu)
-- [HIGH] Shawarma (Kebab)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Préparation rapide', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 606;
-- [HIGH] Manakish au zaatar (pizza libanaise) (Pizza)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 607;
-- [LOW] Kibbeh (boulettes de boulgour et viande) (Non reconnu)
-- [LOW] Dolmas (feuilles de vigne farcies) (Non reconnu)
-- [HIGH] Shakshuka (version plus élaborée) (Œufs en sauce)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 610;
-- [LOW] Fatteh (plat libanais à base de pain pita) (Non reconnu)
-- [LOW] Pommes noisettes (Non reconnu)
-- [LOW] Riz basmati (Non reconnu)
-- [HIGH] Velouté de potiron (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8774;
-- [HIGH] Steak grillé (Viande)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 8775;
-- [LOW] Gâteau au yaourt (Non reconnu)
-- [LOW] Pommes de terre rissolées (Non reconnu)
-- [LOW] Pommes de terre à la vapeur (Non reconnu)
-- [LOW] Pommes Anna (Non reconnu)
-- [LOW] Rösti de pommes de terre (Non reconnu)
-- [HIGH] Écrasé de pommes de terre (Écrasé)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8782;
-- [LOW] Pommes boulangères (Non reconnu)
-- [HIGH] Aligot (Aligot)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson sur feu', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8784;
-- [LOW] Riz blanc nature (Non reconnu)
-- [LOW] Riz thaï (Non reconnu)
-- [HIGH] Riz au curry (Curry)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8788;
-- [LOW] Riz au safran (Non reconnu)
-- [LOW] Riz aux épices (Non reconnu)
-- [LOW] Riz au lait salé (Non reconnu)
-- [LOW] Riz complet (Non reconnu)
-- [HIGH] Spaghetti nature (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8793;
-- [HIGH] Penne nature (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8794;
-- [HIGH] Fusilli nature (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8795;
-- [HIGH] Tagliatelles nature (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8796;
-- [HIGH] Macaronis au beurre (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8797;
-- [HIGH] Spaghetti à l'ail et huile d'olive (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8798;
-- [HIGH] Pâtes aux poivrons (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8799;
-- [HIGH] Pâtes aux tomates (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8800;
-- [HIGH] Pâtes gratinées (Gratin)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8801;
-- [HIGH] Pâtes aux olives (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8802;
-- [LOW] Carottes rôties (Non reconnu)
-- [LOW] Courgettes rôties (Non reconnu)
-- [LOW] Aubergines rôties (Non reconnu)
-- [LOW] Tomates rôties (Non reconnu)
-- [LOW] Chou-fleur rôti (Non reconnu)
-- [LOW] Brocolis rôtis (Non reconnu)
-- [LOW] Chou kale rôti (Non reconnu)
-- [LOW] Panais rôtis (Non reconnu)
-- [HIGH] Betteraves rôties (Légumes rôtis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 45, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8811;
-- [LOW] Courges rôties (Non reconnu)
-- [HIGH] Choux de Bruxelles rôtis (Légumes rôtis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8813;
-- [LOW] Aubergines vapeur (Non reconnu)
-- [LOW] Poivrons vapeur (Non reconnu)
-- [LOW] Tomates vapeur (Non reconnu)
-- [LOW] Patates douces vapeur (Non reconnu)
-- [LOW] Betteraves vapeur (Non reconnu)
-- [LOW] Oignons vapeur (Non reconnu)
-- [LOW] Courges vapeur (Non reconnu)
-- [LOW] Champignons vapeur (Non reconnu)
-- [LOW] Carottes sautées (Non reconnu)
-- [LOW] Courgettes sautées (Non reconnu)
-- [LOW] Aubergines sautées (Non reconnu)
-- [LOW] Poivrons sautés (Non reconnu)
-- [LOW] Tomates sautées (Non reconnu)
-- [LOW] Chou-fleur sauté (Non reconnu)
-- [LOW] Brocolis sautés (Non reconnu)
-- [LOW] Chou kale sauté (Non reconnu)
-- [LOW] Patates douces sautées (Non reconnu)
-- [LOW] Panais sautés (Non reconnu)
-- [LOW] Céleri-rave sauté (Non reconnu)
-- [LOW] Betteraves sautées (Non reconnu)
-- [LOW] Oignons sautés (Non reconnu)
-- [LOW] Fenouil sauté (Non reconnu)
-- [LOW] Courges sautées (Non reconnu)
-- [LOW] Quatre-quarts (Non reconnu)
-- [HIGH] Forêt-Noire (Gâteau)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 30, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8840;
-- [HIGH] Paris-Brest (Pâte à choux)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8842;
-- [HIGH] Clafoutis (Clafoutis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8844;
-- [LOW] Galette des Rois (Non reconnu)
-- [LOW] Gâteau basque (Non reconnu)
-- [HIGH] Far breton (Far)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8847;
-- [LOW] Baba au rhum (Non reconnu)
-- [LOW] Savarin (Non reconnu)
-- [HIGH] Charlotte aux fraises (Poisson)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8850;
-- [LOW] Gâteau aux pommes (Non reconnu)
-- [LOW] Gâteau aux poires (Non reconnu)
-- [LOW] Bûche de Noël (Non reconnu)
-- [LOW] Entremets vanille (Non reconnu)
-- [LOW] Entremets fruits rouges (Non reconnu)
-- [LOW] Entremets exotique (Non reconnu)
-- [LOW] Entremets pistache (Non reconnu)
-- [LOW] Entremets praliné (Non reconnu)
-- [LOW] Entremets noisette (Non reconnu)
-- [LOW] Entremets caramel (Non reconnu)
-- [LOW] Entremets coco (Non reconnu)
-- [LOW] Entremets mangue (Non reconnu)
-- [LOW] Entremets passion (Non reconnu)
-- [LOW] Entremets marron (Non reconnu)
-- [LOW] Entremets mousse fraise (Non reconnu)
-- [LOW] Entremets mousse framboise (Non reconnu)
-- [LOW] Entremets fruits exotiques (Non reconnu)
-- [LOW] Entremets signature (Non reconnu)
-- [LOW] Sablés (Non reconnu)
-- [LOW] Cookies (Non reconnu)
-- [LOW] Brownies (Non reconnu)
-- [LOW] Madeleines (Non reconnu)
-- [LOW] Financiers (Non reconnu)
-- [LOW] Tuiles aux amandes (Non reconnu)
-- [LOW] Palets bretons (Non reconnu)
-- [LOW] Speculoos (Non reconnu)
-- [HIGH] Canelés (Canelés)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8877;
-- [LOW] Meringues (Non reconnu)
-- [LOW] Langues de chat (Non reconnu)
-- [HIGH] Macarons (Macarons)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 15, servings = 24, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8880;
-- [LOW] Navettes (Non reconnu)
-- [LOW] Croquants aux amandes (Non reconnu)
-- [LOW] Rochers coco (Non reconnu)
-- [LOW] Florentins (Non reconnu)
-- [LOW] Pain d'épices (Non reconnu)
-- [LOW] Biscuits au citron (Non reconnu)
-- [LOW] Mousse à la vanille (Non reconnu)
-- [LOW] Mousse aux fruits (Non reconnu)
-- [LOW] Mousse au citron (Non reconnu)
-- [LOW] Mousse à l'orange (Non reconnu)
-- [LOW] Mousse exotique (Non reconnu)
-- [LOW] Mousse pistache (Non reconnu)
-- [LOW] Crème caramel (Non reconnu)
-- [LOW] Crème brûlée (Non reconnu)
-- [HIGH] Panna cotta (Dessert froid)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8896;
-- [LOW] Ile flottante (Non reconnu)
-- [LOW] Œufs au lait (Non reconnu)
-- [LOW] Crème vanille (Non reconnu)
-- [LOW] Crème pistache (Non reconnu)
-- [LOW] Crème coco (Non reconnu)
-- [LOW] Crème noisette (Non reconnu)
-- [LOW] Glace vanille (Non reconnu)
-- [LOW] Glace fraise (Non reconnu)
-- [LOW] Glace pistache (Non reconnu)
-- [LOW] Glace caramel (Non reconnu)
-- [LOW] Glace coco (Non reconnu)
-- [LOW] Glace mangue (Non reconnu)
-- [LOW] Glace passion (Non reconnu)
-- [LOW] Glace citron (Non reconnu)
-- [LOW] Glace framboise (Non reconnu)
-- [LOW] Glace myrtille (Non reconnu)
-- [LOW] Sorbet fraise (Non reconnu)
-- [LOW] Sorbet framboise (Non reconnu)
-- [LOW] Sorbet citron (Non reconnu)
-- [LOW] Sorbet mangue (Non reconnu)
-- [LOW] Parfait glacé (Non reconnu)
-- [HIGH] Semifreddo (Glacé)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8918;
-- [HIGH] Profiteroles glacées (Pâte à choux)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 20, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8919;
-- [LOW] Bûche glacée (Non reconnu)
-- [LOW] Brochettes de fruits (Non reconnu)
-- [LOW] Compote de pommes (Non reconnu)
-- [LOW] Compote de poires (Non reconnu)
-- [LOW] Compote de pêches (Non reconnu)
-- [LOW] Compote d'abricots (Non reconnu)
-- [LOW] Compote de fruits rouges (Non reconnu)
-- [HIGH] Velouté de champignons (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8928;
-- [HIGH] Velouté de petits pois (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8929;
-- [HIGH] Velouté de carottes (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8930;
-- [HIGH] Velouté de chou-fleur (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8931;
-- [HIGH] Velouté de poireaux (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8932;
-- [HIGH] Velouté de panais (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8933;
-- [HIGH] Velouté de tomates (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8934;
-- [HIGH] Velouté d'asperges (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8935;
-- [HIGH] Velouté de courgettes (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8936;
-- [HIGH] Velouté de céleri (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8937;
-- [HIGH] Velouté de topinambours (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8938;
-- [HIGH] Velouté de brocolis (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8939;
-- [HIGH] Velouté de patates douces (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8940;
-- [HIGH] Velouté de navets (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8941;
-- [HIGH] Velouté de cresson (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8942;
-- [HIGH] Velouté de betteraves (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8943;
-- [HIGH] Velouté de fenouil (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8944;
-- [HIGH] Velouté de maïs (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8945;
-- [HIGH] Velouté de potimarron (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8946;
-- [HIGH] Potage julienne (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8947;
-- [HIGH] Potage cultivateur (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8948;
-- [HIGH] Potage parisien (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8949;
-- [HIGH] Potage madrilène (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8950;
-- [HIGH] Potage aux légumes variés (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8951;
-- [HIGH] Potage de légumes anciens (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8952;
-- [HIGH] Potage de légumes racines (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8953;
-- [HIGH] Potage crème de champignons (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8954;
-- [HIGH] Potage crème de tomates (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8955;
-- [HIGH] Potage crème de céleri (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8956;
-- [HIGH] Potage crème de poireaux (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8957;
-- [HIGH] Potage crème de carottes (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8958;
-- [HIGH] Potage crème de chou-fleur (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8959;
-- [HIGH] Potage crème de panais (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8960;
-- [HIGH] Potage crème de courgettes (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8961;
-- [HIGH] Potage crème d'asperges (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8962;
-- [HIGH] Potage crème de navets (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8963;
-- [HIGH] Potage crème de topinambours (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8964;
-- [HIGH] Potage crème de brocolis (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8965;
-- [HIGH] Potage crème de potiron (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8966;
-- [LOW] Garbure (Non reconnu)
-- [LOW] Tourin à l'ail (Non reconnu)
-- [HIGH] Bouillabaisse simplifiée (Soupe poisson)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8969;
-- [LOW] Bortsch ukrainien (Non reconnu)
-- [HIGH] Minestrone italien (Soupe-repas)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8971;
-- [LOW] Ribollita toscane (Non reconnu)
-- [LOW] Zuppa di pesce (Non reconnu)
-- [LOW] Acquacotta (Non reconnu)
-- [LOW] Sopa de ajo (Non reconnu)
-- [HIGH] Salmorejo (Soupe froide)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8976;
-- [HIGH] Bisque de homard (Bisque)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8977;
-- [HIGH] Bisque de langoustines (Bisque)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8978;
-- [HIGH] Bisque de crabes (Bisque)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8979;
-- [HIGH] Bisque de crevettes (Bisque)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8980;
-- [HIGH] Velouté de cèpes (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8981;
-- [HIGH] Velouté de lentilles corail (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8982;
-- [HIGH] Velouté de haricots blancs (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8983;
-- [HIGH] Velouté de pois chiches (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8984;
-- [HIGH] Velouté d'épinards (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8985;
-- [HIGH] Velouté de courges (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8986;
-- [HIGH] Velouté de chou vert (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8987;
-- [HIGH] Velouté de poivrons (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8988;
-- [HIGH] Velouté d'aubergines (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8989;
-- [HIGH] Velouté aux herbes (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8990;
-- [HIGH] Potage de légumes variés (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8991;
-- [HIGH] Potage au chou (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8992;
-- [HIGH] Potage aux carottes (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8993;
-- [HIGH] Potage aux courgettes (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8994;
-- [HIGH] Potage aux poireaux (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8995;
-- [HIGH] Potage aux pommes de terre (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8996;
-- [HIGH] Potage au céleri (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8997;

COMMIT;
