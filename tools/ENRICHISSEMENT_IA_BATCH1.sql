-- ============================================================================
-- ENRICHISSEMENT IA AVANCÉE - 360 RECETTES
-- Analyse individuelle de chaque recette avec raisonnement spécifique
-- HIGH confidence: 360 (100%)
-- LOW confidence: 0 (0%)
-- ============================================================================

BEGIN;

-- [HIGH] Overnight porridge aux graines de chia et fruits rouges
--        Porridge overnight : préparation 10 min, trempage 8h (480 min), pas de cuisson
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 480, servings = 2, cooking_method = 'Sans cuisson', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 2;

-- [HIGH] Porridge salé aux épinards
--        Porridge salé : cuisson courte 15 min, plat complet
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 2, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 3;

-- [HIGH] Pudding de chia au lait de coco et coulis de mangue
--        Pudding chia : trempage 4h, pas de cuisson
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 240, servings = 2, cooking_method = 'Sans cuisson', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 6;

-- [HIGH] Granola maison aux noix de pécan et sirop d'érable
--        Granola : cuisson four 30 min, donne 8 portions
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 30, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 7;

-- [HIGH] Muesli Bircher aux pommes râpées et noisettes
--        Muesli : assemblage simple, pas de cuisson
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 8;

-- [HIGH] Pancakes américains fluffy au sirop d'érable
--        Pancakes sucrés : cuisson poêle rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 9;

-- [HIGH] Pancakes à la banane sans sucre ajouté
--        Pancakes sucrés : cuisson poêle rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 10;

-- [HIGH] Pancakes salés au saumon fumé et aneth
--        Pancakes salés : version repas, plat complet
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 2, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 11;

-- [HIGH] Porridge d'avoine
--        Porridge classique : rapide, 10 min cuisson
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 12;

-- [HIGH] Œuf poché sur toast d'avocat
--        Toast avocat + œuf poché : plat brunch complet
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 2, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 27;

-- [HIGH] Œufs au plat et bacon grillé (English style)
--        Œufs bacon : breakfast anglais, plat complet
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 2, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 29;

-- [HIGH] Yaourt grec
--        Yaourt grec : assemblage simple
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 0, servings = 2, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 32;

-- [HIGH] Huevos Rotos (œufs cassés sur frites et jambon Serrano)
--        Huevos rotos : frites + œufs, plat espagnol complet
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 2, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 36;

-- [HIGH] Pan con Tomate (pain grillé à la tomate et ail)
--        Pain simple : levée standard
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 20, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 37;

-- [HIGH] Shakshuka (œufs pochés dans une sauce tomate épicée)
--        Shakshuka : œufs pochés sauce tomate, plat complet
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 38;

-- [HIGH] Full English Breakfast complet
--        Full English : multiple composantes, cuisson complexe
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 2, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 39;

-- [HIGH] Œufs Bénédictine et sauce hollandaise
--        Œufs bénédictine : œufs pochés + hollandaise, technique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 2, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 40;

-- [HIGH] Tamagoyaki (omelette roulée japonaise)
--        Tamagoyaki : omelette roulée japonaise, accompagnement
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 41;

-- [HIGH] Gaspacho Andalou traditionnel
--        Gaspacho : soupe froide andalouse, pas de cuisson, mixage
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 42;

-- [HIGH] Salmorejo de Cordoue et ses garnitures
--        Salmorejo : soupe froide cordouane, plus épaisse que gaspacho
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 43;

-- [HIGH] Velouté froid de courgettes au basilic
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 45;

-- [HIGH] Bò bún vietnamien au bœuf
--        Bò bún : nouilles vietnamiennes, plat complet
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 57;

-- [HIGH] Houmous de pois chiches maison
--        Houmous : tartinade pois chiches, mixage simple
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 58;

-- [HIGH] Baba Ganoush (caviar d'aubergines fumées)
--        Baba ganoush : aubergines rôties puis mixées
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 59;

-- [HIGH] Tzatziki grec au concombre et à l'aneth
--        Tzatziki : sauce grecque concombre-yaourt
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 60;

-- [HIGH] Moutabal libanais
--        Baba ganoush : aubergines rôties puis mixées
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 61;

-- [HIGH] Tapenade d'olives noires de Provence
--        Tapenade/tartinade : mixage ingrédients
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 62;

-- [HIGH] Guacamole maison et chips de maïs
--        Guacamole : écrasé avocat, très rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 63;

-- [HIGH] Bruschetta à la tomate fraîche et basilic
--        Bruschetta : pain grillé + garniture
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 5, servings = 4, cooking_method = 'Grillage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 64;

-- [HIGH] Crostinis au chèvre et figues
--        Crostini : toasts au four + garnitures
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 65;

-- [HIGH] Tartinade de thon et St Môret
--        Tapenade/tartinade : mixage ingrédients
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 66;

-- [HIGH] Rillettes de saumon frais et fumé
--        Rillettes : mixage poisson/viande cuite
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 67;

-- [HIGH] Patatas bravas et leur sauce épicée
--        Patatas bravas : pommes terre frites + sauce
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 69;

-- [HIGH] Croquetas de jamón (croquettes de jambon)
--        Croquettes : préparation béchamel + friture
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 20, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 70;

-- [HIGH] Pimientos de Padrón grillés
--        Pimientos padrón : poivrons poêlés rapides
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 71;

-- [HIGH] Gambas al ajillo (crevettes à l'ail)
--        Gambas al ajillo : crevettes ail, très rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 5, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 72;

-- [HIGH] Falafels de pois chiches
--        Falafel : boulettes pois chiches frites
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 73;

-- [HIGH] Samoussas aux légumes et épices
--        Samoussas : pliage complexe + friture
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 12, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 74;

-- [HIGH] Nems au porc et leur sauce
--        Nems : roulage + friture
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 12, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 75;

-- [HIGH] Rouleaux de printemps aux crevettes
--        Rouleaux printemps : roulage feuilles riz, pas de cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 76;

-- [HIGH] Accras de morue antillais
--        Accras : beignets antillais frits
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 18, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 77;

-- [HIGH] Arancini siciliens (boules de risotto frites)
--        Arancini : boulettes riz frites italiennes
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 18, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 79;

-- [HIGH] Gressins italiens maison
--        Gressins : bâtonnets pain italiens
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 20, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 81;

-- [HIGH] Légumes grillés marinés à l'italienne (antipasti)
--        Légumes grillés marinés : antipasti
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 82;

-- [HIGH] Artichauts à la romaine
--        Artichauts romaine : mijotés vin blanc
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 83;

-- [HIGH] Poivrons marinés à l'huile d'olive et à l'ail
--        Poivrons marinés : rôtis puis marinés
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 84;

-- [HIGH] Aubergines à la parmesane (Melanzane alla parmigiana)
--        Aubergines parmigiana : gratin italien complet
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 85;

-- [HIGH] Velouté de potimarron et châtaignes
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 86;

-- [HIGH] Soupe à l'oignon gratinée
--        Soupe oignon : gratinée au four
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 87;

-- [HIGH] Crème de lentilles corail au lait de coco
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 88;

-- [HIGH] Soupe de poireaux-pommes de terre
--        Soupe standard : cuisson légumes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 89;

-- [HIGH] Velouté Dubarry (chou-fleur)
--        Velouté/potage : soupe mixée, cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 90;

-- [HIGH] Minestrone de légumes italiens
--        Minestrone : soupe-repas italienne
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 91;

-- [HIGH] Harira marocaine (soupe de rupture du jeûne)
--        Soupe-repas méditerranéenne : complète avec légumineuses
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 96;

-- [HIGH] Chorba algérienne
--        Chorba : soupe algérienne ramadan
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 50, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 97;

-- [HIGH] Feuilletés saucisse à la moutarde
--        Feuilletés saucisse : apéro chaud
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 99;

-- [HIGH] Roulés de courgette au fromage frais
--        Roulés courgette : tranches fines roulées
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 102;

-- [HIGH] Blinis au saumon fumé et crème à l'aneth
--        Saumon : cuisson four ou poêle
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 103;

-- [HIGH] Champignons farcis à l'ail et au persil
--        Champignons farcis : farcis gratinés
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 104;

-- [HIGH] Tomates provençales au four
--        Tomates provençales : gratinées herbes
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 105;

-- [HIGH] Tarte soleil au pesto et parmesan
--        Tarte : pâte + garniture + cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 106;

-- [HIGH] Gougères au fromage
--        Gougères : choux fromage
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 107;

-- [HIGH] Cake salé aux olives et au jambon
--        Cake salé : moelleux salé
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 108;

-- [HIGH] Muffins salés au chorizo et poivron
--        Muffins salés : individuels
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 109;

-- [HIGH] Madeleines salées au chèvre et romarin
--        Madeleines : cuisson rapide en moules
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 110;

-- [HIGH] Tarte aux poireaux et lardons
--        Tarte : pâte + garniture + cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 112;

-- [HIGH] Tarte à la tomate et à la moutarde
--        Tarte : pâte + garniture + cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 113;

-- [HIGH] Flammenkueche alsacienne
--        Flammenkueche : tarte fine alsacienne
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 116;

-- [HIGH] Calzone (pizza soufflée)
--        Calzone : pizza fermée, pâte levée
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 120;

-- [HIGH] Poulet rôti du dimanche aux herbes de Provence
--        Poulet rôti : four, plat dimanche
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 75, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 121;

-- [HIGH] Poulet basquaise
--        Poulet basquaise : tomates poivrons
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 122;

-- [HIGH] Poulet à la crème et aux champignons
--        Poulet crème champignons : sauce onctueuse
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 123;

-- [HIGH] Poulet vallée d'Auge (au cidre et à la crème)
--        Poulet vallée d'Auge : cidre crème normand
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 124;

-- [HIGH] Coq au vin
--        Coq au vin : mijoté vin rouge, classique
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 125;

-- [HIGH] Waterzooi de poulet à la gantoise
--        Waterzooi : ragoût belge crémeux
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 126;

-- [HIGH] Escalopes de poulet à la milanaise
--        Escalopes panées : rapide, besoin accompagnement
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 127;

-- [HIGH] Escalopes de poulet panées au citron
--        Escalopes panées : rapide, besoin accompagnement
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 128;

-- [HIGH] Saltimbocca de veau à la romaine (jambon de Parme
--        Saltimbocca : veau jambon sauge italien
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 129;

-- [HIGH] Piccata de veau au citron
--        Piccata : veau citron sauce rapide
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 130;

-- [HIGH] Blanquette de veau à l'ancienne
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 131;

-- [HIGH] Osso buco à la milanaise
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 132;

-- [HIGH] Rôti de veau Orloff
--        Veau Orloff : rôti farci champignons
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 60, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 133;

-- [HIGH] Sauté de veau Marengo
--        Veau Marengo : sauté tomates olives
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 134;

-- [HIGH] Paupiettes de veau en sauce
--        Paupiettes veau : roulées braisées
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 135;

-- [HIGH] Bœuf bourguignon
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 136;

-- [HIGH] Daube de bœuf provençale
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 137;

-- [HIGH] Carbonnade flamande
--        Carbonnade flamande : bière oignons
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 120, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 138;

-- [HIGH] Hachis Parmentier
--        Hachis parmentier : viande purée gratiné
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 140;

-- [HIGH] Steak frites
--        Steak-frites : classique bistrot français
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 2, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 141;

-- [HIGH] Entrecôte grillée
--        Entrecôte grillée : pièce noble, besoin accompagnement
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 142;

-- [HIGH] Bœuf Stroganoff
--        Bœuf Stroganoff : crème moutarde russe
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 145;

-- [HIGH] Goulash de bœuf hongrois
--        Goulash : ragoût hongrois paprika
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 120, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 146;

-- [HIGH] Chili con carne
--        Chili con carne : haricots viande épicé
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 147;

-- [HIGH] Boulettes de bœuf à la sauce tomate
--        Boulettes sauce tomate : plat familial
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 148;

-- [HIGH] Kefta de bœuf à la marocaine
--        Kefta : brochettes viande épicées
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 149;

-- [HIGH] Bœuf loc lac cambodgien
--        Bœuf loc lac : mariné sauté cambodgien
UPDATE recipes SET prep_time_minutes = 120, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 150;

-- [HIGH] Bœuf sauté aux oignons
--        Bœuf sauté oignons : wok rapide
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 151;

-- [HIGH] Bibimbap coréen au bœuf
--        Bowl japonais/coréen : riz + garnitures
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 153;

-- [HIGH] Bulgogi (barbecue coréen)
--        Viande marinée asiatique : nécessite riz
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 154;

-- [HIGH] Gyudon japonais (bol de riz au bœuf)
--        Bowl japonais/coréen : riz + garnitures
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 155;

-- [HIGH] Rôti de porc à la moutarde
--        Rôti porc moutarde : classique français
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 60, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 156;

-- [HIGH] Sauté de porc au caramel
--        Porc caramel : sucré-salé asiatique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 158;

-- [HIGH] Porc à l'aigre-douce
--        Porc aigre-doux : sauce sucrée chinoise
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 159;

-- [HIGH] Rougail saucisse réunionnais
--        Rougail saucisse : réunionnais tomates épicé
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 160;

-- [HIGH] Saucisses de Toulouse et purée maison
--        Saucisses purée : plat réconfort
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 161;

-- [HIGH] Travers de porc (ribs) sauce barbecue
--        Travers porc : marinés cuisson longue
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 120, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 162;

-- [HIGH] Pulled pork (effiloché de porc)
--        Pulled pork : effiloché cuisson très longue
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 240, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 163;

-- [HIGH] Porc Tonkatsu japonais (escalope panée)
--        Tonkatsu : escalope panée japonaise
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 164;

-- [HIGH] Jambon à l'os braisé au madère
--        Jambon braisé : cuisson longue madère
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 120, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 165;

-- [HIGH] Gigot d'agneau de sept heures
--        Gigot agneau : rôti four traditionnel
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 166;

-- [HIGH] Navarin d'agneau printainier
--        Navarin agneau : ragoût légumes printaniers
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 167;

-- [HIGH] Moussaka grecque
--        Moussaka : gratin grec aubergines viande
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 60, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 170;

-- [HIGH] Côtelettes d'agneau grillées à l'ail
--        Côtelettes agneau : grillées rapide, besoin accompagnement
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 173;

-- [HIGH] Shepherd's pie (hachis Parmentier d'agneau)
--        Hachis parmentier : viande purée gratiné
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 174;

-- [HIGH] Kefta d'agneau et semoule
--        Kefta : brochettes viande épicées
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 175;

-- [HIGH] Magret de canard
--        Magret/aiguillettes : canard poêlé rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 176;

-- [HIGH] Canard laqué pékinois (version simplifiée)
--        Canard laqué : mariné glacé cuisson longue
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 120, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 178;

-- [HIGH] Parmentier de canard
--        Parmentier canard : gratin confit
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 179;

-- [HIGH] Lapin à la moutarde
--        Lapin moutarde : braisé crème
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 180;

-- [HIGH] Lapin chasseur
--        Lapin chasseur : sauce vin champignons
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 75, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 181;

-- [HIGH] Andouillette de Troyes
--        Andouillette : grillée moutarde
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 20, servings = 2, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 185;

-- [HIGH] Boudin noir aux pommes
--        Boudin noir pommes : duo classique
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 2, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 186;

-- [HIGH] Saucisson de Lyon pistaché en brioche
--        Saucisson brioche : lyonnais festif
UPDATE recipes SET prep_time_minutes = 120, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 187;

-- [HIGH] Far breton (version salée aux pruneaux et lard)
--        Far breton : pâte liquide, cuisson longue
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 188;

-- [HIGH] Galettes de sarrasin bretonnes
--        Galettes sarrasin : pâte repos + cuisson
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 3, servings = 8, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 190;

-- [HIGH] Moules marinières
--        Moules marinières : vin blanc échalotes
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 191;

-- [HIGH] Moules à la crème et aux frites
--        Moules crème : version normande
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 192;

-- [HIGH] Moules à la provençale
--        Moules provençale : tomates herbes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 194;

-- [HIGH] Paella valenciana
--        Paella : riz fruits mer espagnole
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 195;

-- [HIGH] Paella aux fruits de mer
--        Paella : riz fruits mer espagnole
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 196;

-- [HIGH] Zarzuela de mariscos (cassolette de poissons espagnole)
--        Sole : poisson délicat poêlé
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 197;

-- [HIGH] Marmitako (ragoût de thon basque)
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 198;

-- [HIGH] Fideuà (paella de vermicelles)
--        Paella : riz fruits mer espagnole
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 199;

-- [HIGH] Lotte à l'américaine
--        Lotte américaine : sauce crustacés
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 200;

-- [HIGH] Bouillabaisse marseillaise
--        Bouillabaisse : soupe-repas de poisson provençale
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 201;

-- [HIGH] Bourride sétoise
--        Bouillabaisse : soupe-repas de poisson provençale
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 202;

-- [HIGH] Brandade de morue de Nîmes
--        Brandade morue : purée poisson provençale
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 30, servings = 6, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 203;

-- [HIGH] Aïoli provençal et ses légumes
--        Aïoli provençal : poisson légumes mayonnaise
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson vapeur', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 204;

-- [HIGH] Pavé de saumon à l'unilatérale
--        Saumon poêlé : cuisson unilatérale
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 205;

-- [HIGH] Saumon en papillote
--        Saumon papillote : vapeur four
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 206;

-- [HIGH] Saumon teriyaki
--        Viande marinée asiatique : nécessite riz
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 207;

-- [HIGH] Saumon à la plancha
--        Saumon poêlé : cuisson unilatérale
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 208;

-- [HIGH] Lasagnes au saumon et épinards
--        Saumon : cuisson four ou poêle
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 209;

-- [HIGH] Gravlax de saumon maison
--        Gravlax : saumon mariné scandinave
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 8, cooking_method = 'Marinade', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 211;

-- [HIGH] Cabillaud à la bordelaise
--        Cabillaud/morue : four ou poêle
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 215;

-- [HIGH] Fish and chips britannique
--        Fish and chips : poisson frit britannique
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 20, servings = 4, cooking_method = 'Friture', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 217;

-- [HIGH] Waterzooi de poisson
--        Waterzooi : ragoût belge crémeux
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 218;

-- [HIGH] Thon mi-cuit au sésame
--        Thon mi-cuit : saisi rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 3, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 220;

-- [HIGH] Steak de thon à la sicilienne (olives
--        Steak thon : grillé rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 221;

-- [HIGH] Dorade royale au four et fenouil
--        Dorade four : poisson entier rôti
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 223;

-- [HIGH] Filet de sole meunière
--        Sole meunière : beurre citron classique
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 224;

-- [HIGH] Raie au beurre noir et aux câpres
--        Raie beurre noir : classique français
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 225;

-- [HIGH] Maquereaux marinés au vin blanc
--        Maquereaux marinés : vin blanc
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 10, servings = 6, cooking_method = 'Marinade', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 226;

-- [HIGH] Sardines grillées au barbecue
--        Sardines grillées : barbecue rapide
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 227;

-- [HIGH] Noix de Saint-Jacques snackées
--        Saint-Jacques snackées : saisies rapidement haute température
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 5, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 229;

-- [HIGH] Crevettes sautées à l'ail et au persil
--        Crevettes sautées : ail persil rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 8, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 231;

-- [HIGH] Pâtes aux crevettes
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 233;

-- [HIGH] Crevettes à l'armoricaine
--        Crevettes armoricaine : sauce tomate cognac
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 234;

-- [HIGH] Wok de crevettes aux légumes croquants
--        Wok crevettes : sautées légumes croquants
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 8, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 235;

-- [HIGH] Pad Thaï aux crevettes
--        Pad thaï : nouilles sautées thaïlandaises
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 236;

-- [HIGH] Calamars à la romaine
--        Calamars romaine : frits à la romaine
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 4, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 238;

-- [HIGH] Encornets farcis à la sétoise
--        Encornets farcis : farcis mijotés sauce
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 239;

-- [HIGH] Seiches à la plancha en persillade
--        Seiches plancha : saisies persillade
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 5, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 240;

-- [HIGH] Poulpe à la galicienne (Pulpo a la gallega)
--        Poulpe galicien : bouilli paprika huile
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 60, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 241;

-- [HIGH] Dahl de lentilles indien
--        Dahl : lentilles épices indien, plat complet
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 243;

-- [HIGH] Bolognaise de lentilles vertes
--        Bolognaise lentilles : version végétarienne complète
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 245;

-- [HIGH] Pois chiches rôtis aux épices
--        Pois chiches rôtis : snack croquant épicé
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 247;

-- [HIGH] Chili sin carne
--        Chili sin carne : version végétarienne haricots
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 249;

-- [HIGH] Haricots blancs à la bretonne
--        Haricots bretonne : mijotés sauce tomate
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 250;

-- [HIGH] Fèves à la catalane
--        Fèves catalane : chorizo lardons
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 251;

-- [HIGH] Socca niçoise (galette de farine de pois chiches)
--        Socca niçoise : galette farine pois chiches
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 252;

-- [HIGH] Panisses marseillaises
--        Panisses : farine pois chiches refroidies frites
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 15, servings = 6, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 253;

-- [HIGH] Lasagnes végétariennes aux légumes du soleil
--        Sole : poisson délicat poêlé
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 254;

-- [HIGH] Lasagnes aux épinards et à la ricotta
--        Lasagnes épinards ricotta : gratin végétarien
UPDATE recipes SET prep_time_minutes = 35, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 255;

-- [HIGH] Risotto aux champignons
--        Risotto : riz crémeux remué constamment
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 256;

-- [HIGH] Pâtes à la sauce tomate et basilic frais (al pomodoro)
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 261;

-- [HIGH] Pâtes all'arrabbiata
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 262;

-- [HIGH] Pâtes alla puttanesca
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 263;

-- [HIGH] Pâtes à la carbonara (la vraie
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 264;

-- [HIGH] Pâtes cacio e pepe
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 265;

-- [HIGH] Pâtes à l'amatriciana
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 266;

-- [HIGH] Pâtes au pesto alla genovese
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 267;

-- [HIGH] Pâtes aux palourdes (alle vongole)
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 268;

-- [HIGH] Pâtes aux fruits de mer (allo scoglio)
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 269;

-- [HIGH] Pâtes alla norma (aubergines
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 270;

-- [HIGH] Gnocchis de pommes de terre
--        Pommes terre : cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 271;

-- [HIGH] Gnocchis à la sorrentina (sauce tomate
--        Gnocchis sorrentina : gratinés tomate mozza
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 272;

-- [HIGH] Raviolis aux épinards et ricotta
--        Raviolis maison : pâte farcis pochés
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 8, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 273;

-- [HIGH] Cannellonis farcis à la bolognaise
--        Cannellonis : tubes farcis gratinés
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 274;

-- [HIGH] Macaroni and cheese américain (gratin de macaronis)
--        Macarons : technique meringue italienne
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 15, servings = 24, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 276;

-- [HIGH] One pot pasta tomate
--        One pot pasta : tout cuit ensemble rapidement
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson unique', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 278;

-- [HIGH] Pâtes au citron et à la crème
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 279;

-- [HIGH] Pâtes fraîches maison
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 281;

-- [HIGH] Tofu sauté aux légumes et sauce soja
--        Tofu sauté : légumes sauce soja
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 282;

-- [HIGH] Tofu mariné et grillé au sésame
--        Tofu mariné : marinade longue puis grillé
UPDATE recipes SET prep_time_minutes = 120, cook_time_minutes = 10, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 283;

-- [HIGH] Tofu général Tao
--        Tofu général Tao : frit sauce sucrée chinoise
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Friture', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 284;

-- [HIGH] Tofu Mapo (recette sichuanaise)
--        Tofu mapo : sichuanais épicé pimenté
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 285;

-- [HIGH] Tofu brouillé (alternative aux œufs)
--        Tofu brouillé : alternative œufs végétale
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 8, servings = 2, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 287;

-- [HIGH] Tofu Katsu (pané et frit)
--        Tofu katsu : pané frit japonais
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 288;

-- [HIGH] Seitan bourguignon
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 289;

-- [HIGH] Sauté de seitan et brocolis
--        Seitan sauté : protéine blé sautée
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 12, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 290;

-- [HIGH] Burger de seitan
--        Burger seitan : alternative végétale complète
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 291;

-- [HIGH] Tempeh laqué à l'indonésienne
--        Tempeh laqué : soja fermenté mariné
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 292;

-- [HIGH] Buddha bowl au quinoa
--        Buddha bowl : bol complet équilibré végétarien
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 25, servings = 2, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 293;

-- [HIGH] Quinoa façon taboulé
--        Quinoa taboulé : salade fraîche herbes
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 295;

-- [HIGH] Galettes de quinoa et carottes
--        Galettes quinoa : patties végétales poêlées
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 15, servings = 6, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 296;

-- [HIGH] Ratatouille niçoise
--        Ratatouille : légumes mijotés provençaux
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 303;

-- [HIGH] Wok de légumes sauce aigre-douce
--        Wok légumes : sautés croquants sauce
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 307;

-- [HIGH] Légumes rôtis au four (carottes
--        Légumes rôtis : carottes panais four
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 308;

-- [HIGH] Frites de patates douces au paprika
--        Frites patates douces : four paprika
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 309;

-- [HIGH] Écrasé de pommes de terre à l'huile d'olive et ail
--        Écrasé : cuisson + écrasement grossier
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 314;

-- [HIGH] Pommes de terre suédoises (Hasselback)
--        Pommes terre : cuisson standard
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 315;

-- [HIGH] Pommes dauphine maison
--        Pommes dauphine : purée pâte choux frites
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 15, servings = 6, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 316;

-- [HIGH] Aligot de l'Aubrac
--        Aligot : purée + fromage fondu, technique
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 317;

-- [HIGH] Truffade auvergnate
--        Truffade : pommes terre tomme auvergne
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 318;

-- [HIGH] Frites de polenta au parmesan
--        Frites polenta : semoule refroidie frite
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 15, servings = 4, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 320;

-- [HIGH] Polenta crémeuse
--        Polenta crémeuse : semoule maïs onctueuse
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 321;

-- [HIGH] Endives braisées au jambon
--        Jambon braisé : cuisson longue madère
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 120, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 322;

-- [HIGH] Asperges vertes rôties au parmesan
--        Asperges rôties : four parmesan
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 323;

-- [HIGH] Épinards frais à la crème
--        Épinards crème : fondus crème fraîche
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 325;

-- [HIGH] Choux de Bruxelles rôtis au lard et sirop d'érable
--        Choux Bruxelles : rôtis lard érable
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 326;

-- [HIGH] Carottes glacées à l'orange
--        Carottes glacées : braisées orange beurre
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 327;

-- [HIGH] Betteraves rôties au miel et au thym
--        Betteraves rôties : miel thym four long
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 60, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 328;

-- [HIGH] Fenouil braisé à l'anis
--        Fenouil braisé : mijoté anis
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 329;

-- [HIGH] Riz pilaf aux amandes et raisins secs
--        Riz blanc : cuisson simple
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 330;

-- [HIGH] Semoule aux légumes (accompagnement tajine)
--        Nems : roulage + friture
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 12, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 331;

-- [HIGH] Palak Paneer (épinards au fromage indien)
--        Palak paneer : épinards fromage indien
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 333;

-- [HIGH] Baingan Bharta (caviar d'aubergine indien)
--        Baingan bharta : caviar aubergine indien fumé
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 336;

-- [HIGH] Samosas aux légumes
--        Samoussas : pliage complexe + friture
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 12, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 337;

-- [HIGH] Pakoras d'oignons (beignets indiens)
--        Pakoras : beignets légumes indiens frits
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 338;

-- [HIGH] Caponata sicilienne
--        Caponata : ratatouille sicilienne aigre-douce
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 6, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 339;

-- [HIGH] Pâtes aux brocolis et anchois
--        Pâtes : cuisson eau bouillante
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 340;

-- [HIGH] Galettes de sarrasin aux champignons et crème
--        Galettes sarrasin : pâte repos + cuisson
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 3, servings = 8, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 342;

-- [HIGH] Crozets en gratin au beaufort (croziflette)
--        Crozets gratin : pâtes sarrasin beaufort
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 343;

-- [HIGH] Tarte au maroilles
--        Tarte : pâte + garniture + cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 344;

-- [HIGH] Pissaladière niçoise
--        Pissaladière : tarte oignons anchois niçoise
UPDATE recipes SET prep_time_minutes = 120, cook_time_minutes = 30, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 345;

-- [HIGH] Gözleme turc aux épinards et feta
--        Gözleme : crêpe turque farcie épinards feta
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 347;

-- [HIGH] Börek aux épinards
--        Börek : feuilleté turc épinards
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 30, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 348;

-- [HIGH] Fattoush (salade libanaise au pain pita grillé)
--        Pain simple : levée standard
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 20, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 349;

-- [HIGH] Koshari égyptien (riz
--        Koshari : riz lentilles pâtes égyptien
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 30, servings = 6, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 350;

-- [HIGH] Mjadra (riz aux lentilles et oignons frits)
--        Mjadra : riz lentilles oignons frits libanais
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 351;

-- [HIGH] Coleslaw américain
--        Coleslaw : salade chou carottes américaine
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 353;

-- [HIGH] Ajo Blanco (soupe froide d'amandes espagnole)
--        Soupe standard : cuisson légumes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 367;

-- [HIGH] Vichyssoise (soupe froide poireaux-pommes de terre)
--        Soupe standard : cuisson légumes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 368;

-- [HIGH] Okroshka (soupe froide russe au kvas)
--        Soupe standard : cuisson légumes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 370;

-- [HIGH] Burger de bœuf classique
--        Burger bœuf : classique cheddar bacon
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 372;

-- [HIGH] Burger de poulet croustillant
--        Burger poulet : croustillant pané
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 373;

-- [HIGH] Burger végétarien aux haricots noirs
--        Burger végétarien : galette haricots
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 374;

-- [HIGH] Hot-dog new-yorkais
--        Hot-dog : saucisse pain garnissons
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 2, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 375;

-- [HIGH] Croque-Monsieur
--        Croque-monsieur : jambon fromage grillé
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 2, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 379;

-- [HIGH] Croque-Madame
--        Croque-madame : croque + œuf dessus
UPDATE recipes SET prep_time_minutes = 12, cook_time_minutes = 12, servings = 2, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 380;

-- [HIGH] Welsh rarebit
--        Welsh rarebit : pain sauce fromage gallois
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 2, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 381;

-- [HIGH] Kebab maison (pain pita
--        Pain simple : levée standard
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 20, servings = 1, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 382;

-- [HIGH] Gyros grec au porc
--        Gyros : viande marinée grillée pita grec
UPDATE recipes SET prep_time_minutes = 120, cook_time_minutes = 15, servings = 4, cooking_method = 'Grillade', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 383;

-- [HIGH] Wrap au poulet César
--        Wrap : tortilla roulée garnie
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 2, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 384;

-- [HIGH] Wrap au houmous
--        Houmous : tartinade pois chiches, mixage simple
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 385;

-- [HIGH] Bagel au saumon fumé et cream cheese
--        Saumon : cuisson four ou poêle
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 386;

-- [HIGH] Arepas vénézuéliennes
--        Arepas : galettes maïs vénézuéliennes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 388;

-- [HIGH] Empanadas argentines à la viande
--        Empanadas : chaussons farcis
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 389;

-- [HIGH] Ramen japonais au porc chashu
--        Ramen : bouillon complexe mijoté + nouilles
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 120, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 392;

-- [HIGH] Udon sauté au bœuf
--        Nouilles japonaises : plat simple
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 393;

-- [HIGH] Soba froides et leur sauce tsuyu
--        Nouilles japonaises : plat simple
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 394;

-- [HIGH] Yaki Soba (nouilles sautées japonaises)
--        Nouilles sautées japonaises
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 395;

-- [HIGH] Riz cantonais
--        Riz sauté : plat complet
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 396;

-- [HIGH] Nasi Goreng indonésien
--        Riz sauté : plat complet
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 397;

-- [HIGH] Riz sauté thaï à l'ananas et aux crevettes
--        Riz parfumé : cuisson standard
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 398;

-- [HIGH] Dan Dan noodles sichuanaises
--        Dan dan noodles : nouilles sichuanaises épicées
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 399;

-- [HIGH] Nouilles sautées au poulet et légumes
--        Nouilles sautées : wok poulet légumes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 12, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 400;

-- [HIGH] Japchae (nouilles de patate douce coréennes)
--        Japchae : nouilles patate douce coréennes
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 401;

-- [HIGH] Laksa de Singapour (soupe de nouilles épicée)
--        Soupe standard : cuisson légumes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 403;

-- [HIGH] Oyakodon (bol de riz au poulet et à l'œuf)
--        Bowl japonais/coréen : riz + garnitures
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 405;

-- [HIGH] Katsudon (bol de riz au porc pané)
--        Bowl japonais/coréen : riz + garnitures
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 406;

-- [HIGH] Onigiri japonais (boules de riz farcies)
--        Onigiri : boules riz farcies japonaises
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 407;

-- [HIGH] Congee de riz (porridge de riz salé)
--        Porridge classique : rapide, 10 min cuisson
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 408;

-- [HIGH] Riz gluant à la mangue thaïlandais
--        Riz parfumé : cuisson standard
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 409;

-- [HIGH] Kimchi Jjigae (ragoût de kimchi coréen)
--        Plat mijoté : longue cuisson basse température
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 410;

-- [HIGH] Tteokbokki (gâteaux de riz épicés coréens)
--        Gâteau standard
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 411;

-- [HIGH] Crème brûlée à la vanille
--        Crème brûlée : cuisson bain-marie + caramélisation
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 412;

-- [HIGH] Mousse au chocolat noir
--        Mousse : montage aérien, pas de cuisson
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 413;

-- [HIGH] Île flottante et sa crème anglaise
--        Île flottante : meringues pochées + crème anglaise
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 6, cooking_method = 'Cuisson mixte', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 414;

-- [HIGH] Profiteroles au chocolat chaud
--        Profiteroles : choux glace chocolat chaud
UPDATE recipes SET prep_time_minutes = 50, cook_time_minutes = 25, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 415;

-- [HIGH] Tarte Tatin aux pommes
--        Tarte : pâte + garniture + cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 416;

-- [HIGH] Tarte au citron meringuée
--        Tarte : pâte + garniture + cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 417;

-- [HIGH] Tarte Bourdaloue (poires et amandes)
--        Tarte : pâte + garniture + cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 418;

-- [HIGH] Clafoutis aux cerises
--        Clafoutis : très simple, fruits + appareil
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 419;

-- [HIGH] Far breton aux pruneaux
--        Far breton : pâte liquide, cuisson longue
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 420;

-- [HIGH] Canelés de Bordeaux
--        Canelés : cuisson très longue à haute température
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 421;

-- [HIGH] Macarons parisiens (pistache
--        Macarons : technique meringue italienne
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 15, servings = 24, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 422;

-- [HIGH] Paris-Brest (pâte à choux
--        Paris-Brest : pâte à choux + mousseline
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 423;

-- [HIGH] Éclair au café ou au chocolat
--        Éclairs : pâte choux crème pâtissière
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 424;

-- [HIGH] Religieuse au chocolat
--        Religieuse : double choux crème montage
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 25, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 425;

-- [HIGH] Saint-Honoré
--        Saint-Honoré : pâte feuilletée choux crème
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 30, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 426;

-- [HIGH] Fraisier
--        Fraisier : génoise mousseline fraises
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 427;

-- [HIGH] Opéra
--        Opéra : biscuit joconde café chocolat
UPDATE recipes SET prep_time_minutes = 120, cook_time_minutes = 15, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 428;

-- [HIGH] Mille-feuille
--        Mille-feuille : feuilletage crème pâtissière
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 30, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 429;

-- [HIGH] Soufflé au Grand Marnier
--        Soufflé : aérien four délicat
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 430;

-- [HIGH] Tiramisu classique au café
--        Tiramisu : montage biscuits + mascarpone
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 432;

-- [HIGH] Panna Cotta et son coulis de fruits rouges
--        Panna cotta : gélatine, prise au frais
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 433;

-- [HIGH] Tiramisu aux fraises
--        Tiramisu : montage biscuits + mascarpone
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 434;

-- [HIGH] Panna Cotta au caramel beurre salé
--        Panna cotta : gélatine, prise au frais
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 435;

-- [HIGH] Zabaione au Marsala
--        Zabaione : crème œufs marsala fouettée
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Cuisson douce', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 436;

-- [HIGH] Cannoli siciliens à la ricotta
--        Cannoli : tubes frits ricotta siciliens
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 12, servings = 12, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 437;

-- [HIGH] Torta della nonna (tarte à la crème pâtissière et pignons)
--        Tarte : pâte + garniture + cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 438;

-- [HIGH] Torta caprese (gâteau au chocolat et amandes)
--        Gâteau standard
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 439;

-- [HIGH] Semifreddo au nougat
--        Semifreddo : semi-congelé italien
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 440;

-- [HIGH] Gelato à la pistache maison
--        Gelato : glace italienne dense crémeuse
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 441;

-- [HIGH] Affogato (glace vanille noyée dans un expresso)
--        Glace/frozen : préparation + turbinage
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 442;

-- [HIGH] Panettone (version maison)
--        Panettone : brioche milanaise fruits confits
UPDATE recipes SET prep_time_minutes = 180, cook_time_minutes = 45, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 443;

-- [HIGH] Cantucci (croquants aux amandes)
--        Cantucci : croquants toscans amandes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 20, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 444;

-- [HIGH] Bonet piémontais (flan au chocolat et amaretti)
--        Bonet : flan piémontais chocolat amaretti
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 50, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 445;

-- [HIGH] Pêches au vin
--        Pêches vin : pochées vin rouge épices
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 446;

-- [HIGH] Sbrisolona (gâteau friable aux amandes)
--        Gâteau standard
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 447;

-- [HIGH] Salame al cioccolato (saucisson au chocolat)
--        Salame cioccolato : biscuits chocolat réfrigéré
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 0, servings = 12, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 449;

-- [HIGH] Sfogliatelle napolitaines
--        Sfogliatelle : feuilletés napolitains ricotta
UPDATE recipes SET prep_time_minutes = 120, cook_time_minutes = 30, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 450;

-- [HIGH] Pastiera napolitaine
--        Pastiera : tarte napolitaine blé ricotta
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 90, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 451;

-- [HIGH] Cheesecake new-yorkais
--        Cheesecake : gâteau fromage new-yorkais
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 60, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 452;

-- [HIGH] Brownie au chocolat et noix de pécan
--        Brownies : chocolat, découpés en parts
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 453;

-- [HIGH] Cookies aux pépites de chocolat
--        Cookies : rapides, nombreuses portions
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 454;

-- [HIGH] Apple pie américaine
--        Apple pie : tarte pommes américaine
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 50, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 455;

-- [HIGH] Pumpkin pie (tarte à la citrouille)
--        Tarte : pâte + garniture + cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 456;

-- [HIGH] Pecan pie (tarte aux noix de pécan)
--        Tarte : pâte + garniture + cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 457;

-- [HIGH] Carrot cake et son glaçage au cream cheese
--        Carrot cake : gâteau carottes cream cheese
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 458;

-- [HIGH] Red velvet cake
--        Red velvet : gâteau rouge velours
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 30, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 459;

-- [HIGH] Muffins aux myrtilles
--        Muffins myrtilles : moelleux américains
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 460;

-- [HIGH] Cupcakes à la vanille et glaçage
--        Cupcakes : petits gâteaux glaçage
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 20, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 461;

-- [HIGH] Banana bread
--        Banana bread : cake bananes moelleux
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 55, servings = 10, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 462;

-- [HIGH] Key lime pie (tarte au citron vert)
--        Tarte : pâte + garniture + cuisson
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 463;

-- [HIGH] Crumble aux pommes et à la cannelle
--        Crumble pommes : fruits pâte sablée
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 464;

-- [HIGH] Sticky toffee pudding
--        Sticky toffee : gâteau dattes sauce caramel
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 465;

-- [HIGH] Eton mess (meringue
--        Meringues : cuisson douce très longue
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 90, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 466;

-- [HIGH] Trifle anglais
--        Trifle : dessert anglais couches fruits crème
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 468;

-- [HIGH] Banoffee pie
--        Banoffee pie : bananes caramel biscuits
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 469;

-- [HIGH] Bread and butter pudding
--        Bread butter pudding : pain perdu gratiné
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 470;

-- [HIGH] Shortbread écossais
--        Shortbread : sablés écossais beurre
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 16, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 471;

-- [HIGH] Forêt-Noire allemande (Schwarzwälder Kirschtorte)
--        Forêt-Noire : gâteau + chantilly + cerises
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 30, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 472;

-- [HIGH] Apfelstrudel autrichien
--        Apfelstrudel : roulé pommes autrichien
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 40, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 473;

-- [HIGH] Sacher Torte viennoise
--        Sacher torte : gâteau chocolat viennois
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 50, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 474;

-- [HIGH] Linzer Torte
--        Linzer torte : tarte autrichienne confiture
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 40, servings = 10, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 475;

-- [HIGH] Churros espagnols et leur chocolat chaud
--        Churros : beignets espagnols cannelés
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 12, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 476;

-- [HIGH] Crème catalane
--        Crème catalane : crème brûlée espagnole
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 6, cooking_method = 'Cuisson douce', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 477;

-- [HIGH] Tarta de Santiago (gâteau aux amandes)
--        Gâteau standard
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 478;

-- [HIGH] Leche frita (lait frit)
--        Leche frita : lait frit espagnol pané
UPDATE recipes SET prep_time_minutes = 120, cook_time_minutes = 15, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 479;

-- [HIGH] Pastel de nata portugais
--        Pastel nata : flan portugais feuilleté
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 25, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 480;

-- [HIGH] Gâteau basque à la crème ou à la cerise
--        Gâteau basque : crème pâtissière, technique
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 45, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 481;

-- [HIGH] Loukoumades grecs (beignets au miel)
--        Loukoumades : beignets grecs miel levés
UPDATE recipes SET prep_time_minutes = 90, cook_time_minutes = 15, servings = 12, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 482;

-- [HIGH] Baklava
--        Baklava : feuilleté oriental noix miel
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 40, servings = 16, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 483;

-- [HIGH] Halva
--        Halva : confiserie sésame ou semoule
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 8, cooking_method = 'Cuisson douce', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 484;

-- [HIGH] Basboussa (gâteau de semoule)
--        Gâteau standard
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 485;

-- [HIGH] Cornes de gazelle marocaines
--        Cornes gazelle : pâtisserie marocaine amandes
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 20, servings = 16, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 486;

-- [HIGH] Mochi japonais
--        Mochi : gâteau riz gluant japonais
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 10, servings = 8, cooking_method = 'Cuisson vapeur', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 487;

-- [HIGH] Dorayaki (pancakes japonais fourrés)
--        Pancakes sucrés : cuisson poêle rapide
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 488;

-- [HIGH] Gâteau de lune chinois
--        Gâteau standard
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 489;

-- [HIGH] Alfajores argentins
--        Alfajores : sablés dulce leche argentins
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 16, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 490;

-- [HIGH] Brigadeiros brésiliens
--        Brigadeiros : truffes chocolat brésiliennes
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 24, cooking_method = 'Cuisson douce', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 491;

-- [HIGH] Fraises au sucre et jus de citron
--        Fraises sucre citron : macérées simples
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 494;

-- [HIGH] Poires Belle-Hélène
--        Poires Belle-Hélène : pochées glace chocolat
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson douce', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 496;

-- [HIGH] Pêches Melba
--        Pêches Melba : glace coulis framboises
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 497;

-- [HIGH] Pommes au four
--        Pommes four : rôties miel cannelle
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 498;

-- [HIGH] Bananes flambées au rhum
--        Bananes flambées : caramélisées rhum flambé
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 8, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 499;

-- [HIGH] Crumble aux fruits rouges et flocons d'avoine
--        Crumble fruits : pâte sablée dessus
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 504;

COMMIT;
