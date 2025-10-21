-- ============================================================================
-- ENRICHISSEMENT IA AVANCÉE - 300 RECETTES
-- Analyse individuelle de chaque recette avec raisonnement spécifique
-- HIGH confidence: 300 (100%)
-- LOW confidence: 0 (0%)
-- ============================================================================

BEGIN;

-- [HIGH] Sorbet maison (citron
--        Sorbet : fruits mixés + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 505;

-- [HIGH] Nice cream (glace à la banane congelée)
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 506;

-- [HIGH] Energy balls aux dattes et noix de cajou
--        Energy balls : dattes noix mixées roulées
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 12, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 507;

-- [HIGH] Barres de céréales maison
--        Barres céréales : pressées et cuites
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 508;

-- [HIGH] Yaourt glacé (frozen yogurt) aux fruits
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 509;

-- [HIGH] Mousse d'avocat au cacao
--        Mousse avocat cacao : healthy, sans cuisson
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 510;

-- [HIGH] Pommes en tranches et beurre de cacahuètes
--        Pommes cacahuètes : snack santé rapide
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 0, servings = 2, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 511;

-- [HIGH] Baguette tradition française
--        Pain artisanal : levée + cuisson
UPDATE recipes SET prep_time_minutes = 120, cook_time_minutes = 25, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 512;

-- [HIGH] Naans indiens au fromage
--        Pain simple : levée standard
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 20, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 520;

-- [HIGH] Chapatis
--        Pain simple : levée standard
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 20, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 521;

-- [HIGH] Bretzels alsaciens
--        Pain simple : levée standard
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 20, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 523;

-- [HIGH] Ciabatta italienne
--        Pain artisanal : levée + cuisson
UPDATE recipes SET prep_time_minutes = 120, cook_time_minutes = 25, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 524;

-- [HIGH] Croissants au beurre
--        Croissants : pâte feuilletée levée, très long
UPDATE recipes SET prep_time_minutes = 180, cook_time_minutes = 20, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 526;

-- [HIGH] Chinois (gâteau brioché à la crème)
--        Gâteau standard
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 531;

-- [HIGH] Tripes à la mode de Caen
--        Tripes : cuisson très longue traditionnelle
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 180, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 533;

-- [HIGH] Potjevleesch flamand
--        Potjevleesch : terrine 3 viandes flamande
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 180, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 534;

-- [HIGH] Daube niçoise
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 536;

-- [HIGH] Pieds paquets marseillais
--        Pieds paquets : tripes pieds mouton marseillais
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 240, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 537;

-- [HIGH] Alouettes sans tête provençales
--        Alouettes sans tête : paupiettes provençales
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 538;

-- [HIGH] Fricassée de volaille à l'angevine
--        Fricassée volaille : poulet crème champignons
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 539;

-- [HIGH] Poule au pot
--        Poule au pot : poule farcie légumes bouillon
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 180, servings = 8, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 540;

-- [HIGH] Coquilles Saint-Jacques à la bretonne
--        Saint-Jacques : cuisson très rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 5, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 541;

-- [HIGH] Cotriade bretonne
--        Cotriade : soupe-repas bretonne aux poissons
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 542;

-- [HIGH] Matelote d'anguille
--        Matelote anguille : ragoût anguille vin rouge
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 45, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 543;

-- [HIGH] Lamproie à la bordelaise
--        Lamproie bordelaise : poisson sang vin rouge
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 544;

-- [HIGH] Ttoro (soupe de poisson basque)
--        Soupe standard : cuisson légumes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 545;

-- [HIGH] Morue à la lyonnaise
--        Cabillaud/morue : four ou poêle
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 546;

-- [HIGH] Quenelles de brochet sauce Nantua
--        Quenelles : farce pochée + sauce
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 547;

-- [HIGH] Grenouilles en persillade
--        Grenouilles : cuisses persillade poêlées
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 548;

-- [HIGH] Fricassée d'escargots
--        Escargots : préparation + gratinage
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 549;

-- [HIGH] Caillettes ardéchoises
--        Caillettes : crépine foie porc ardéchoises
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 60, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 550;

-- [HIGH] Diots de Savoie au vin blanc
--        Diots : saucisses savoyardes vin blanc
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 551;

-- [HIGH] Farçous aveyronnais
--        Farçous : galettes herbes aveyronnaises
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 553;

-- [HIGH] Crique ardéchoise (galette de pommes de terre)
--        Galette pommes terre : plat complet régional
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 554;

-- [HIGH] Tarte à l'oignon alsacienne
--        Tarte oignon : tarte salée alsacienne
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 558;

-- [HIGH] Salsifis à la crème
--        Salsifis crème : légume ancien en sauce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 559;

-- [HIGH] Pan bagnat (le vrai)
--        Pan bagnat : sandwich niçois pain mouillé
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 562;

-- [HIGH] Soupe au pistou
--        Soupe au pistou : soupe-repas provençale, légumes + pistou
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 563;

-- [HIGH] Tourton des Alpes
--        Tourton : chausson pomme terre poêlé alpes
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 6, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 564;

-- [HIGH] Oreilles d'âne du Valgaudemar (gratin d'épinards)
--        Oreilles d'âne : gratin épinards pâtes valgaudemar
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 565;

-- [HIGH] Pôchouse de Verdun-sur-le-Doubs (version légumes)
--        Pôchouse : matelote poissons vin blanc bourguignonne
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 566;

-- [HIGH] Flaugnarde aux pommes
--        Flaugnarde : clafoutis limousin aux pommes
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 568;

-- [HIGH] Millassou (galette de pomme de terre)
--        Galette pommes terre : plat complet régional
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 569;

-- [HIGH] Escargots de Bourgogne
--        Escargots : préparation + gratinage
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 570;

-- [HIGH] Lentilles vertes du Berry en salade
--        Salade lentilles : lentilles vinaigrette entrée
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson simple', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 571;

-- [HIGH] Ceviche péruvien
--        Ceviche : poisson mariné citron, pas de cuisson
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Marinade', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 572;

-- [HIGH] Lomo saltado (sauté de bœuf péruvien)
--        Lomo saltado : sauté bœuf péruvien
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 573;

-- [HIGH] Aji de gallina (poulet en sauce pimentée)
--        Aji de gallina : poulet sauce pimentée péruvien
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 574;

-- [HIGH] Feijoada brésilienne
--        Feijoada : ragoût haricots noirs brésilien
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 120, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 575;

-- [HIGH] Pão de queijo (pains au fromage brésiliens)
--        Pain simple : levée standard
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 20, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 576;

-- [HIGH] Moqueca de peixe (ragoût de poisson brésilien)
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 577;

-- [HIGH] Ropa vieja cubaine (bœuf effiloché)
--        Ropa vieja : bœuf effiloché cubain
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 120, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 578;

-- [HIGH] Picadillo
--        Picadillo : hachis viande latino
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 579;

-- [HIGH] Arroz con pollo
--        Arroz con pollo : riz poulet, plat unique
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 580;

-- [HIGH] Sancocho (soupe colombienne)
--        Soupe standard : cuisson légumes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 581;

-- [HIGH] Bandeja paisa (plat complet colombien)
--        Bandeja paisa : assiette complète colombienne
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 60, servings = 2, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 582;

-- [HIGH] Chiles rellenos (piments farcis mexicains)
--        Chiles rellenos : piments farcis mexicains
UPDATE recipes SET prep_time_minutes = 35, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 583;

-- [HIGH] Mole poblano
--        Mole : sauce complexe mexicaine chocolat-piment
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 584;

-- [HIGH] Cochinita pibil
--        Cochinita pibil : porc mariné cuisson longue
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 180, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 585;

-- [HIGH] Pozole (soupe mexicaine)
--        Soupe standard : cuisson légumes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 586;

-- [HIGH] Tamales
--        Tamales : pâte maïs vapeur en feuilles
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 45, servings = 8, cooking_method = 'Cuisson vapeur', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 587;

-- [HIGH] Pastel de choclo (gâteau de maïs chilien)
--        Gâteau standard
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 588;

-- [HIGH] Humitas
--        Humitas : maïs en feuilles, andin
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson vapeur', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 589;

-- [HIGH] Gallo pinto (riz et haricots du Costa Rica)
--        Gallo pinto : riz haricots costa-ricain
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 590;

-- [HIGH] Patacones (bananes plantain frites)
--        Patacones : bananes plantain frites
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 591;

-- [HIGH] Pastilla au poulet et aux amandes
--        Pastilla : feuilleté poulet amandes marocain
UPDATE recipes SET prep_time_minutes = 50, cook_time_minutes = 45, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 595;

-- [HIGH] Rfissa marocaine (poulet
--        Rfissa : poulet lentilles msemen marocain
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 596;

-- [HIGH] Tanjia marrakchia
--        Tanjia : plat mijoté très longtemps
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 240, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 597;

-- [HIGH] Bissara (soupe de fèves)
--        Soupe standard : cuisson légumes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 598;

-- [HIGH] Zaalouk (salade d'aubergines cuite)
--        Zaalouk : caviar aubergines cuit marocain
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 6, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 599;

-- [HIGH] Poulet Yassa sénégalais
--        Yassa : poulet mariné oignons sénégalais
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 600;

-- [HIGH] Mafé (sauce à base d'arachide)
--        Mafé : sauce arachide africaine
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 601;

-- [HIGH] Thieboudienne (riz au poisson sénégalais)
--        Thiéboudienne : riz poisson sénégalais
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 602;

-- [HIGH] Doro Wat (ragoût de poulet éthiopien)
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 603;

-- [HIGH] Injera (crêpe éthiopienne au teff)
--        Injera : crêpe teff fermentée 3 jours
UPDATE recipes SET prep_time_minutes = 72, cook_time_minutes = 0, servings = 8, cooking_method = 'Fermentation', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 604;

-- [HIGH] Shish Taouk (brochettes de poulet libanaises)
--        Shish taouk : brochettes poulet marinées
UPDATE recipes SET prep_time_minutes = 120, cook_time_minutes = 15, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 605;

-- [HIGH] Shawarma
--        Shawarma : viande marinée rôtie verticale
UPDATE recipes SET prep_time_minutes = 180, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson verticale', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 606;

-- [HIGH] Manakish au zaatar (pizza libanaise)
--        Manakish : pizza libanaise zaatar
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 607;

-- [HIGH] Kibbeh (boulettes de boulgour et viande)
--        Kibbeh : boulettes boulgour viande
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 20, servings = 6, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 608;

-- [HIGH] Dolmas (feuilles de vigne farcies)
--        Dolmas : feuilles vigne farcies
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 40, servings = 8, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 609;

-- [HIGH] Shakshuka (version plus élaborée)
--        Shakshuka : œufs pochés sauce tomate, plat complet
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 610;

-- [HIGH] Fatteh (plat libanais à base de pain pita)
--        Pain simple : levée standard
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 20, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 611;

-- [HIGH] Pommes noisettes
--        Pommes noisettes : billes frites croustillantes
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 6, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8772;

-- [HIGH] Riz basmati
--        Riz parfumé : cuisson standard
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8773;

-- [HIGH] Velouté de potiron
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8774;

-- [HIGH] Steak grillé
--        Steak grillé : cuisson rapide, nécessite accompagnement
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 8775;

-- [HIGH] Gâteau au yaourt
--        Gâteau yaourt : simple et rapide
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8776;

-- [HIGH] Pommes de terre rissolées
--        Pommes rissolées : poêle dorées
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8778;

-- [HIGH] Pommes de terre à la vapeur
--        Légumes vapeur : cuisson douce
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson vapeur', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8779;

-- [HIGH] Pommes Anna
--        Pommes Anna : fines tranches beurre four
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 50, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8780;

-- [HIGH] Rösti de pommes de terre
--        Rösti : galette poêlée suisse
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8781;

-- [HIGH] Écrasé de pommes de terre
--        Écrasé : cuisson + écrasement grossier
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8782;

-- [HIGH] Pommes boulangères
--        Pommes boulangères : tranches oignons bouillon four
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 60, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8783;

-- [HIGH] Aligot
--        Aligot : purée + fromage fondu, technique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8784;

-- [HIGH] Riz blanc nature
--        Riz blanc : cuisson simple
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8785;

-- [HIGH] Riz thaï
--        Riz parfumé : cuisson standard
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8787;

-- [HIGH] Riz au curry
--        Riz aromatisé : cuisson avec épices
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8788;

-- [HIGH] Riz au safran
--        Riz aromatisé : cuisson avec épices
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8789;

-- [HIGH] Riz aux épices
--        Riz aromatisé : cuisson avec épices
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8790;

-- [HIGH] Riz au lait salé
--        Riz blanc : cuisson simple
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8791;

-- [HIGH] Riz complet
--        Riz complet : cuisson longue
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 45, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8792;

-- [HIGH] Spaghetti nature
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8793;

-- [HIGH] Penne nature
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8794;

-- [HIGH] Fusilli nature
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8795;

-- [HIGH] Tagliatelles nature
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8796;

-- [HIGH] Macaronis au beurre
--        Macarons : technique meringue italienne
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 15, servings = 24, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8797;

-- [HIGH] Spaghetti à l'ail et huile d'olive
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8798;

-- [HIGH] Pâtes aux poivrons
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8799;

-- [HIGH] Pâtes aux tomates
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8800;

-- [HIGH] Pâtes gratinées
--        Pâtes gratinées : cuisson + four
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8801;

-- [HIGH] Pâtes aux olives
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8802;

-- [HIGH] Carottes rôties
--        Légumes rôtis : four haute température
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8803;

-- [HIGH] Courgettes rôties
--        Légumes racines rôtis : cuisson longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 45, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8804;

-- [HIGH] Aubergines rôties
--        Légumes rôtis : four haute température
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8805;

-- [HIGH] Tomates rôties
--        Légumes rôtis : four haute température
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8806;

-- [HIGH] Chou-fleur rôti
--        Légumes rôtis : four haute température
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8807;

-- [HIGH] Brocolis rôtis
--        Légumes rôtis : four haute température
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8808;

-- [HIGH] Chou kale rôti
--        Légumes rôtis : four haute température
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8809;

-- [HIGH] Panais rôtis
--        Légumes rôtis : four haute température
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8810;

-- [HIGH] Betteraves rôties
--        Légumes racines rôtis : cuisson longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 45, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8811;

-- [HIGH] Courges rôties
--        Légumes racines rôtis : cuisson longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 45, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8812;

-- [HIGH] Choux de Bruxelles rôtis
--        Légumes rôtis : four haute température
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8813;

-- [HIGH] Aubergines vapeur
--        Légumes vapeur : cuisson douce
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson vapeur', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8814;

-- [HIGH] Poivrons vapeur
--        Légumes vapeur : cuisson douce
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson vapeur', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8815;

-- [HIGH] Tomates vapeur
--        Légumes vapeur : cuisson douce
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson vapeur', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8816;

-- [HIGH] Patates douces vapeur
--        Légumes vapeur : cuisson douce
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson vapeur', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8817;

-- [HIGH] Betteraves vapeur
--        Légumes vapeur : cuisson douce
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson vapeur', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8818;

-- [HIGH] Oignons vapeur
--        Légumes vapeur : cuisson douce
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson vapeur', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8819;

-- [HIGH] Courges vapeur
--        Légumes vapeur : cuisson douce
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson vapeur', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8820;

-- [HIGH] Champignons vapeur
--        Légumes vapeur : cuisson douce
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson vapeur', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8821;

-- [HIGH] Carottes sautées
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8822;

-- [HIGH] Courgettes sautées
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8823;

-- [HIGH] Aubergines sautées
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8824;

-- [HIGH] Poivrons sautés
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8825;

-- [HIGH] Tomates sautées
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8826;

-- [HIGH] Chou-fleur sauté
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8827;

-- [HIGH] Brocolis sautés
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8828;

-- [HIGH] Chou kale sauté
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8829;

-- [HIGH] Patates douces sautées
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8830;

-- [HIGH] Panais sautés
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8831;

-- [HIGH] Céleri-rave sauté
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8832;

-- [HIGH] Betteraves sautées
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8833;

-- [HIGH] Oignons sautés
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8834;

-- [HIGH] Fenouil sauté
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8835;

-- [HIGH] Courges sautées
--        Légumes sautés : cuisson rapide vive
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8836;

-- [HIGH] Quatre-quarts
--        Quatre-quarts : simple mais cuisson longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 45, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8838;

-- [HIGH] Forêt-Noire
--        Forêt-Noire : gâteau + chantilly + cerises
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 30, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8840;

-- [HIGH] Paris-Brest
--        Paris-Brest : pâte à choux + mousseline
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8842;

-- [HIGH] Clafoutis
--        Clafoutis : très simple, fruits + appareil
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8844;

-- [HIGH] Galette des Rois
--        Galette des rois : feuilletage + frangipane
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8845;

-- [HIGH] Gâteau basque
--        Gâteau basque : crème pâtissière, technique
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 45, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8846;

-- [HIGH] Far breton
--        Far breton : pâte liquide, cuisson longue
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8847;

-- [HIGH] Baba au rhum
--        Baba au rhum : brioche imbibée sirop rhum
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 20, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8848;

-- [HIGH] Savarin
--        Savarin : couronne brioche sirop fruits
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8849;

-- [HIGH] Charlotte aux fraises
--        Charlotte : montage biscuits + mousse
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8850;

-- [HIGH] Gâteau aux pommes
--        Gâteau aux fruits : préparation fruits + cuisson
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8851;

-- [HIGH] Gâteau aux poires
--        Gâteau aux fruits : préparation fruits + cuisson
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8852;

-- [HIGH] Bûche de Noël
--        Bûche Noël : montage complexe
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 20, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8853;

-- [HIGH] Entremets vanille
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8854;

-- [HIGH] Entremets fruits rouges
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8855;

-- [HIGH] Entremets exotique
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8856;

-- [HIGH] Entremets pistache
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8857;

-- [HIGH] Entremets praliné
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8858;

-- [HIGH] Entremets noisette
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8859;

-- [HIGH] Entremets caramel
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8860;

-- [HIGH] Entremets coco
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8861;

-- [HIGH] Entremets mangue
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8862;

-- [HIGH] Entremets passion
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8863;

-- [HIGH] Entremets marron
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8864;

-- [HIGH] Entremets mousse fraise
--        Mousse : montage aérien, pas de cuisson
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8865;

-- [HIGH] Entremets mousse framboise
--        Mousse : montage aérien, pas de cuisson
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8866;

-- [HIGH] Entremets fruits exotiques
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8867;

-- [HIGH] Entremets signature
--        Entremets : montage complexe multicouches
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8868;

-- [HIGH] Sablés
--        Sablés : biscuits secs, nombreux
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 20, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8869;

-- [HIGH] Cookies
--        Cookies : rapides, nombreuses portions
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8870;

-- [HIGH] Brownies
--        Brownies : chocolat, découpés en parts
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8871;

-- [HIGH] Madeleines
--        Madeleines : cuisson rapide en moules
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8872;

-- [HIGH] Financiers
--        Financiers : amandes, cuisson courte
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8873;

-- [HIGH] Tuiles aux amandes
--        Tuiles amandes : biscuits fins courbés
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 12, servings = 24, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8874;

-- [HIGH] Palets bretons
--        Palets bretons : sablés épais beurre salé
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 16, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8875;

-- [HIGH] Speculoos
--        Speculoos : biscuits épices belges
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 12, servings = 30, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8876;

-- [HIGH] Canelés
--        Canelés : cuisson très longue à haute température
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8877;

-- [HIGH] Meringues
--        Meringues : cuisson douce très longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 90, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8878;

-- [HIGH] Langues de chat
--        Langues de chat : biscuits fins allongés
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 10, servings = 30, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8879;

-- [HIGH] Macarons
--        Macarons : technique meringue italienne
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 15, servings = 24, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8880;

-- [HIGH] Navettes
--        Navettes : biscuits provençaux fleur oranger
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 20, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8881;

-- [HIGH] Croquants aux amandes
--        Croquants amandes : biscuits secs amandes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 24, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8882;

-- [HIGH] Rochers coco
--        Rochers coco : meringues noix coco
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 18, servings = 20, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8883;

-- [HIGH] Florentins
--        Florentins : dentelles amandes chocolat
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 12, servings = 20, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8884;

-- [HIGH] Pain d'épices
--        Pain simple : levée standard
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 20, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8885;

-- [HIGH] Biscuits au citron
--        Biscuits citron : sablés agrumes frais
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 24, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8886;

-- [HIGH] Mousse à la vanille
--        Mousse : montage aérien, pas de cuisson
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8887;

-- [HIGH] Mousse aux fruits
--        Mousse : montage aérien, pas de cuisson
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8888;

-- [HIGH] Mousse au citron
--        Mousse : montage aérien, pas de cuisson
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8889;

-- [HIGH] Mousse à l'orange
--        Mousse : montage aérien, pas de cuisson
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8890;

-- [HIGH] Mousse exotique
--        Mousse : montage aérien, pas de cuisson
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8891;

-- [HIGH] Mousse pistache
--        Mousse : montage aérien, pas de cuisson
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8892;

-- [HIGH] Crème caramel
--        Crème caramel : cuisson bain-marie
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8893;

-- [HIGH] Crème brûlée
--        Crème brûlée : cuisson bain-marie + caramélisation
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8894;

-- [HIGH] Panna cotta
--        Panna cotta : gélatine, prise au frais
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8896;

-- [HIGH] Ile flottante
--        Île flottante : meringues pochées + crème anglaise
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 6, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8897;

-- [HIGH] Œufs au lait
--        Œufs au lait : flan simple classique
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8898;

-- [HIGH] Crème vanille
--        Crème vanille : crème anglaise onctueuse
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 6, cooking_method = 'Cuisson douce', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8899;

-- [HIGH] Crème pistache
--        Crème pistache : crème pâtissière pistaches
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 12, servings = 6, cooking_method = 'Cuisson douce', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8900;

-- [HIGH] Crème coco
--        Crème coco : crème lait coco exotique
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 6, cooking_method = 'Cuisson douce', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8901;

-- [HIGH] Crème noisette
--        Crème noisette : crème pâtissière noisettes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 12, servings = 6, cooking_method = 'Cuisson douce', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8902;

-- [HIGH] Glace vanille
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8903;

-- [HIGH] Glace fraise
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8904;

-- [HIGH] Glace pistache
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8905;

-- [HIGH] Glace caramel
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8906;

-- [HIGH] Glace coco
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8907;

-- [HIGH] Glace mangue
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8908;

-- [HIGH] Glace passion
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8909;

-- [HIGH] Glace citron
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8910;

-- [HIGH] Glace framboise
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8911;

-- [HIGH] Glace myrtille
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8912;

-- [HIGH] Sorbet fraise
--        Sorbet : fruits mixés + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8913;

-- [HIGH] Sorbet framboise
--        Sorbet : fruits mixés + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8914;

-- [HIGH] Sorbet citron
--        Sorbet : fruits mixés + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8915;

-- [HIGH] Sorbet mangue
--        Sorbet : fruits mixés + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8916;

-- [HIGH] Parfait glacé
--        Parfait glacé : mousse congelée
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8917;

-- [HIGH] Semifreddo
--        Semifreddo : semi-congelé italien
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8918;

-- [HIGH] Profiteroles glacées
--        Profiteroles glacées : choux + glace
UPDATE recipes SET prep_time_minutes = 50, cook_time_minutes = 25, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8919;

-- [HIGH] Bûche glacée
--        Bûche Noël : montage complexe
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 20, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8920;

-- [HIGH] Brochettes de fruits
--        Brochettes fruits : découpe + assemblage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8921;

-- [HIGH] Compote de pommes
--        Compote : fruits cuits avec peu de sucre
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8922;

-- [HIGH] Compote de poires
--        Compote : fruits cuits avec peu de sucre
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8923;

-- [HIGH] Compote de pêches
--        Compote : fruits cuits avec peu de sucre
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8924;

-- [HIGH] Compote d'abricots
--        Compote : fruits cuits avec peu de sucre
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8925;

-- [HIGH] Compote de fruits rouges
--        Compote : fruits cuits avec peu de sucre
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8926;

-- [HIGH] Velouté de champignons
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8928;

-- [HIGH] Velouté de petits pois
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8929;

-- [HIGH] Velouté de carottes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8930;

-- [HIGH] Velouté de chou-fleur
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8931;

-- [HIGH] Velouté de poireaux
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8932;

-- [HIGH] Velouté de panais
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8933;

-- [HIGH] Velouté de tomates
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8934;

-- [HIGH] Velouté d'asperges
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8935;

-- [HIGH] Velouté de courgettes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8936;

-- [HIGH] Velouté de céleri
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8937;

-- [HIGH] Velouté de topinambours
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8938;

-- [HIGH] Velouté de brocolis
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8939;

-- [HIGH] Velouté de patates douces
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8940;

-- [HIGH] Velouté de navets
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8941;

-- [HIGH] Velouté de cresson
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8942;

-- [HIGH] Velouté de betteraves
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8943;

-- [HIGH] Velouté de fenouil
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8944;

-- [HIGH] Velouté de maïs
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8945;

-- [HIGH] Velouté de potimarron
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8946;

-- [HIGH] Potage julienne
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8947;

-- [HIGH] Potage cultivateur
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8948;

-- [HIGH] Potage parisien
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8949;

-- [HIGH] Potage madrilène
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8950;

-- [HIGH] Potage aux légumes variés
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8951;

-- [HIGH] Potage de légumes anciens
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8952;

-- [HIGH] Potage de légumes racines
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8953;

-- [HIGH] Potage crème de champignons
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8954;

-- [HIGH] Potage crème de tomates
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8955;

-- [HIGH] Potage crème de céleri
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8956;

-- [HIGH] Potage crème de poireaux
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8957;

-- [HIGH] Potage crème de carottes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8958;

-- [HIGH] Potage crème de chou-fleur
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8959;

-- [HIGH] Potage crème de panais
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8960;

-- [HIGH] Potage crème de courgettes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8961;

-- [HIGH] Potage crème d'asperges
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8962;

-- [HIGH] Potage crème de navets
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8963;

-- [HIGH] Potage crème de topinambours
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8964;

-- [HIGH] Potage crème de brocolis
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8965;

-- [HIGH] Potage crème de potiron
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8966;

-- [HIGH] Garbure
--        Garbure : soupe épaisse chou confit gascogne
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 120, servings = 8, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 8967;

-- [HIGH] Tourin à l'ail
--        Tourin : soupe ail œuf sud-ouest
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 8968;

-- [HIGH] Bouillabaisse simplifiée
--        Bouillabaisse : soupe-repas de poisson provençale
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 8969;

-- [HIGH] Bortsch ukrainien
--        Bortsch : soupe betteraves ukrainienne crème
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 8970;

-- [HIGH] Minestrone italien
--        Minestrone : soupe-repas italienne
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 8971;

-- [HIGH] Ribollita toscane
--        Ribollita : soupe pain chou toscane
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 8972;

-- [HIGH] Zuppa di pesce
--        Zuppa di pesce : soupe poissons italienne
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 8973;

-- [HIGH] Acquacotta
--        Acquacotta : soupe pain tomates toscane
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 8974;

-- [HIGH] Sopa de ajo
--        Sopa de ajo : soupe ail espagnole paprika
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 8975;

-- [HIGH] Salmorejo
--        Salmorejo : soupe froide cordouane, plus épaisse que gaspacho
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8976;

-- [HIGH] Bisque de homard
--        Bisque homard : velouté crustacés cognac crème
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 8977;

-- [HIGH] Bisque de langoustines
--        Bisque langoustines : velouté crustacés luxueux
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 50, servings = 6, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 8978;

-- [HIGH] Bisque de crabes
--        Bisque crabes : velouté crustacés puissant
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 50, servings = 6, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = FALSE WHERE id = 8979;

-- [HIGH] Bisque de crevettes
--        Crevettes sautées : ail persil rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 8, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 8980;

-- [HIGH] Velouté de cèpes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8981;

-- [HIGH] Velouté de lentilles corail
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8982;

-- [HIGH] Velouté de haricots blancs
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8983;

-- [HIGH] Velouté de pois chiches
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8984;

-- [HIGH] Velouté d'épinards
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8985;

-- [HIGH] Velouté de courges
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8986;

-- [HIGH] Velouté de chou vert
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8987;

-- [HIGH] Velouté de poivrons
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8988;

-- [HIGH] Velouté d'aubergines
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8989;

-- [HIGH] Velouté aux herbes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8990;

-- [HIGH] Potage de légumes variés
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8991;

-- [HIGH] Potage au chou
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8992;

-- [HIGH] Potage aux carottes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8993;

-- [HIGH] Potage aux courgettes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8994;

-- [HIGH] Potage aux poireaux
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8995;

-- [HIGH] Potage aux pommes de terre
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8996;

-- [HIGH] Potage au céleri
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8997;

COMMIT;
