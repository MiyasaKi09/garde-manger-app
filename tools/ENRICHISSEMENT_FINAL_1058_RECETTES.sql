-- ============================================================================
-- ENRICHISSEMENT INTELLIGENT - 360 RECETTES
-- HIGH confidence: 324 (90%)
-- LOW confidence: 36 (10%)
-- ============================================================================

BEGIN;

-- [HIGH] Overnight porridge aux graines de chia et fruits rouges (Trempage 8h)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 480, servings = 2, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 2;
-- [HIGH] Porridge salé aux épinards (Version salée)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 2, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 3;
-- [HIGH] Pudding de chia au lait de coco et coulis de mangue (Trempage 4h)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 240, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 6;
-- [HIGH] Granola maison aux noix de pécan et sirop d'érable (Four)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 30, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 7;
-- [HIGH] Muesli Bircher aux pommes râpées et noisettes (Trempage)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 480, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 8;
-- [HIGH] Pancakes américains fluffy au sirop d'érable (Poêle)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 9;
-- [HIGH] Pancakes à la banane sans sucre ajouté (Poêle)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 10;
-- [HIGH] Pancakes salés au saumon fumé et aneth (Poêle)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 11;
-- [HIGH] Porridge d'avoine (Porridge)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 12;
-- [HIGH] Œuf poché sur toast d'avocat (Toast + œuf)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 2, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 27;
-- [HIGH] Œufs au plat et bacon grillé (English style) (English breakfast)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 29;
-- [HIGH] Yaourt grec (Assemblage)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 0, servings = 1, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 32;
-- [HIGH] Huevos Rotos (œufs cassés sur frites et jambon Serrano) (Frites + œufs)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 36;
-- [HIGH] Pan con Tomate (pain grillé à la tomate et ail) (Tapas)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 5, servings = 4, cooking_method = 'Grillage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 37;
-- [HIGH] Shakshuka (œufs pochés dans une sauce tomate épicée) (Œufs en sauce)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 38;
-- [HIGH] Full English Breakfast complet (Complet anglais)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 2, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 39;
-- [HIGH] Œufs Bénédictine et sauce hollandaise (Œufs pochés + hollandaise)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 2, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 40;
-- [HIGH] Tamagoyaki (omelette roulée japonaise) (Omelette)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 2, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 41;
-- [HIGH] Gaspacho Andalou traditionnel (Soupe froide)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 42;
-- [HIGH] Salmorejo de Cordoue et ses garnitures (Soupe froide)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 43;
-- [HIGH] Velouté froid de courgettes au basilic (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 45;
-- [HIGH] Bò bún vietnamien au bœuf (Nouilles)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 57;
-- [HIGH] Houmous de pois chiches maison (Tartinade)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 58;
-- [HIGH] Baba Ganoush (caviar d'aubergines fumées) (Aubergines)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 59;
-- [HIGH] Tzatziki grec au concombre et à l'aneth (Sauce grecque)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 60;
-- [HIGH] Moutabal libanais (Aubergines)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 61;
-- [HIGH] Tapenade d'olives noires de Provence (Tartinable)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 62;
-- [HIGH] Guacamole maison et chips de maïs (Avocat)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 63;
-- [HIGH] Bruschetta à la tomate fraîche et basilic (Pain grillé)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 5, servings = 4, cooking_method = 'Grillage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 64;
-- [HIGH] Crostinis au chèvre et figues (Toasts)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 65;
-- [HIGH] Tartinade de thon et St Môret (Tartinable)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 66;
-- [HIGH] Rillettes de saumon frais et fumé (Tartinable)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 67;
-- [HIGH] Patatas bravas et leur sauce épicée (Tapas)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 69;
-- [HIGH] Croquetas de jamón (croquettes de jambon) (Croquettes)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 20, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 70;
-- [HIGH] Pimientos de Padrón grillés (Poivrons)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 71;
-- [HIGH] Gambas al ajillo (crevettes à l'ail) (Crevettes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 5, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 72;
-- [HIGH] Falafels de pois chiches (Boulettes)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 73;
-- [HIGH] Samoussas aux légumes et épices (Friture)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 12, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 74;
-- [HIGH] Nems au porc et leur sauce (Friture)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 12, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 75;
-- [HIGH] Rouleaux de printemps aux crevettes (Roulage)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 76;
-- [HIGH] Accras de morue antillais (Beignets)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 18, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 77;
-- [HIGH] Arancini siciliens (boules de risotto frites) (Beignets)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 18, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 79;
-- [HIGH] Gressins italiens maison (Pain)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 81;
-- [HIGH] Légumes grillés marinés à l'italienne (antipasti) (Antipasti)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 6, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 82;
-- [HIGH] Artichauts à la romaine (Cuisson longue)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 83;
-- [HIGH] Poivrons marinés à l'huile d'olive et à l'ail (Antipasti)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 6, cooking_method = 'Marinade', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 84;
-- [HIGH] Aubergines à la parmesane (Melanzane alla parmigiana) (Gratin)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 85;
-- [HIGH] Velouté de potimarron et châtaignes (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 86;
-- [HIGH] Soupe à l'oignon gratinée (Soupe gratinée)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 87;
-- [HIGH] Crème de lentilles corail au lait de coco (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 88;
-- [LOW] Soupe de poireaux-pommes de terre (Non reconnu)
-- [HIGH] Velouté Dubarry (chou-fleur) (Soupe)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 90;
-- [HIGH] Minestrone de légumes italiens (Soupe-repas)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 91;
-- [HIGH] Harira marocaine (soupe de rupture du jeûne) (Soupe-repas)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 96;
-- [HIGH] Chorba algérienne (Soupe-repas)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 97;
-- [HIGH] Feuilletés saucisse à la moutarde (Feuilletés)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 99;
-- [HIGH] Roulés de courgette au fromage frais (Roulés)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 5, servings = 4, cooking_method = 'Préparation rapide', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 102;
-- [HIGH] Blinis au saumon fumé et crème à l'aneth (Blinis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 12, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 103;
-- [HIGH] Champignons farcis à l'ail et au persil (Légumes farcis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 104;
-- [HIGH] Tomates provençales au four (Four)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 105;
-- [HIGH] Tarte soleil au pesto et parmesan (Poisson)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 106;
-- [HIGH] Gougères au fromage (Gougères)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 107;
-- [HIGH] Cake salé aux olives et au jambon (Cake)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 108;
-- [HIGH] Muffins salés au chorizo et poivron (Cake)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 109;
-- [HIGH] Madeleines salées au chèvre et romarin (Petits gâteaux)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 110;
-- [LOW] Tarte aux poireaux et lardons (Non reconnu)
-- [LOW] Tarte à la tomate et à la moutarde (Non reconnu)
-- [HIGH] Flammenkueche alsacienne (Tarte flambée)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 116;
-- [HIGH] Calzone (pizza soufflée) (Pizza)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 120;
-- [HIGH] Poulet rôti du dimanche aux herbes de Provence (Volaille rôtie)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 60, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 121;
-- [HIGH] Poulet basquaise (Poulet basquaise)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 50, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 122;
-- [HIGH] Poulet à la crème et aux champignons (Poulet crème)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 123;
-- [HIGH] Poulet vallée d'Auge (au cidre et à la crème) (Poulet au cidre)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 124;
-- [HIGH] Coq au vin (Coq au vin)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 120, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 125;
-- [HIGH] Waterzooi de poulet à la gantoise (Waterzooi)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 126;
-- [HIGH] Escalopes de poulet à la milanaise (Escalope)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 127;
-- [HIGH] Escalopes de poulet panées au citron (Escalope)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 128;
-- [HIGH] Saltimbocca de veau à la romaine (jambon de Parme (Veau italien)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 129;
-- [HIGH] Piccata de veau au citron (Veau au citron)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 130;
-- [HIGH] Blanquette de veau à l'ancienne (Blanquette)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 120, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 131;
-- [HIGH] Osso buco à la milanaise (Osso buco)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 120, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 132;
-- [HIGH] Rôti de veau Orloff (Rôti)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 133;
-- [HIGH] Sauté de veau Marengo (Ragoût veau)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 45, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 134;
-- [HIGH] Paupiettes de veau en sauce (Paupiettes)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 135;
-- [HIGH] Bœuf bourguignon (Bourguignon)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 136;
-- [HIGH] Daube de bœuf provençale (Daube)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 180, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 137;
-- [HIGH] Carbonnade flamande (Carbonnade)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 120, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 138;
-- [HIGH] Hachis Parmentier (Parmentier)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 140;
-- [HIGH] Steak frites (Viande)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 141;
-- [HIGH] Entrecôte grillée (Viande)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 142;
-- [HIGH] Bœuf Stroganoff (Stroganoff)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 145;
-- [HIGH] Goulash de bœuf hongrois (Goulash)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 90, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 146;
-- [HIGH] Chili con carne (Chili)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 147;
-- [HIGH] Boulettes de bœuf à la sauce tomate (Boulettes)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 148;
-- [HIGH] Kefta de bœuf à la marocaine (Kefta)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 149;
-- [HIGH] Bœuf loc lac cambodgien (Bœuf cambodgien)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 150;
-- [HIGH] Bœuf sauté aux oignons (Sauté)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 151;
-- [HIGH] Bibimbap coréen au bœuf (Bowl)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 153;
-- [HIGH] Bulgogi (barbecue coréen) (Viande marinée)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 154;
-- [HIGH] Gyudon japonais (bol de riz au bœuf) (Bowl)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 155;
-- [HIGH] Rôti de porc à la moutarde (Rôti)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 156;
-- [HIGH] Sauté de porc au caramel (Porc caramel)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 158;
-- [HIGH] Porc à l'aigre-douce (Aigre-douce)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 159;
-- [HIGH] Rougail saucisse réunionnais (Rougail)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 160;
-- [HIGH] Saucisses de Toulouse et purée maison (Plat complet)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 161;
-- [HIGH] Travers de porc (ribs) sauce barbecue (Travers)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 90, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 162;
-- [HIGH] Pulled pork (effiloché de porc) (Effiloché longue cuisson)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 240, servings = 8, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 163;
-- [HIGH] Porc Tonkatsu japonais (escalope panée) (Pané japonais)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 164;
-- [HIGH] Jambon à l'os braisé au madère (Braisé)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 120, servings = 6, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 165;
-- [HIGH] Gigot d'agneau de sept heures (Rôti)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 90, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 166;
-- [HIGH] Navarin d'agneau printainier (Navarin)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 90, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 167;
-- [HIGH] Moussaka grecque (Gratin)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 170;
-- [HIGH] Côtelettes d'agneau grillées à l'ail (Agneau)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 173;
-- [HIGH] Shepherd's pie (hachis Parmentier d'agneau) (Parmentier)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 174;
-- [HIGH] Kefta d'agneau et semoule (Kefta)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 175;
-- [HIGH] Magret de canard (Magret)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 176;
-- [HIGH] Canard laqué pékinois (version simplifiée) (Canard laqué)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 90, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 178;
-- [HIGH] Parmentier de canard (Parmentier)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 179;
-- [HIGH] Lapin à la moutarde (Lapin)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 180;
-- [HIGH] Lapin chasseur (Lapin)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 181;
-- [HIGH] Andouillette de Troyes (Charcuterie)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 185;
-- [HIGH] Boudin noir aux pommes (Charcuterie)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 186;
-- [HIGH] Saucisson de Lyon pistaché en brioche (Feuilleté)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 187;
-- [HIGH] Far breton (version salée aux pruneaux et lard) (Far salé)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 188;
-- [HIGH] Galettes de sarrasin bretonnes (Galettes)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 190;
-- [HIGH] Moules marinières (Moules)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 191;
-- [HIGH] Moules à la crème et aux frites (Moules)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 192;
-- [HIGH] Moules à la provençale (Moules)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 194;
-- [HIGH] Paella valenciana (Paella)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 195;
-- [HIGH] Paella aux fruits de mer (Paella)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 196;
-- [HIGH] Zarzuela de mariscos (cassolette de poissons espagnole) (Zarzuela)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 197;
-- [HIGH] Marmitako (ragoût de thon basque) (Marmitako)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 198;
-- [HIGH] Fideuà (paella de vermicelles) (Paella)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 199;
-- [HIGH] Lotte à l'américaine (Poisson)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 200;
-- [HIGH] Bouillabaisse marseillaise (Soupe poisson)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 201;
-- [HIGH] Bourride sétoise (Soupe poisson)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 202;
-- [HIGH] Brandade de morue de Nîmes (Brandade)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 203;
-- [HIGH] Aïoli provençal et ses légumes (Aïoli)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 30, servings = 6, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 204;
-- [HIGH] Pavé de saumon à l'unilatérale (Poisson)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 205;
-- [HIGH] Saumon en papillote (Poisson)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 206;
-- [HIGH] Saumon teriyaki (Viande marinée)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 207;
-- [HIGH] Saumon à la plancha (Poisson)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 208;
-- [HIGH] Lasagnes au saumon et épinards (Lasagnes)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 209;
-- [HIGH] Gravlax de saumon maison (Saumon mariné)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Marinade', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 211;
-- [HIGH] Cabillaud à la bordelaise (Poisson)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 215;
-- [HIGH] Fish and chips britannique (Fish & chips)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Friture', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 217;
-- [HIGH] Waterzooi de poisson (Waterzooi)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 218;
-- [HIGH] Thon mi-cuit au sésame (Poisson)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 220;
-- [HIGH] Steak de thon à la sicilienne (olives (Viande)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 221;
-- [HIGH] Dorade royale au four et fenouil (Poisson)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 223;
-- [HIGH] Filet de sole meunière (Poisson)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 224;
-- [HIGH] Raie au beurre noir et aux câpres (Poisson)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 225;
-- [HIGH] Maquereaux marinés au vin blanc (Poisson)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 226;
-- [HIGH] Sardines grillées au barbecue (Poisson)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Grillade', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 227;
-- [HIGH] Noix de Saint-Jacques snackées (Coquilles)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 5, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 229;
-- [HIGH] Crevettes sautées à l'ail et au persil (Crevettes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 8, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 231;
-- [HIGH] Pâtes aux crevettes (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 233;
-- [HIGH] Crevettes à l'armoricaine (Sauce armoricaine)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 234;
-- [HIGH] Wok de crevettes aux légumes croquants (Wok)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 235;
-- [HIGH] Pad Thaï aux crevettes (Nouilles)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 236;
-- [HIGH] Calamars à la romaine (Fruits de mer)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 238;
-- [HIGH] Encornets farcis à la sétoise (Fruits de mer)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 239;
-- [HIGH] Seiches à la plancha en persillade (Fruits de mer)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 240;
-- [HIGH] Poulpe à la galicienne (Pulpo a la gallega) (Fruits de mer)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = TRUE WHERE id = 241;
-- [HIGH] Dahl de lentilles indien (Dahl)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 243;
-- [HIGH] Bolognaise de lentilles vertes (Sauce lentilles)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 245;
-- [HIGH] Pois chiches rôtis aux épices (Légumineuses)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 247;
-- [HIGH] Chili sin carne (Chili)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 249;
-- [HIGH] Haricots blancs à la bretonne (Légumineuses)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 250;
-- [HIGH] Fèves à la catalane (Légumineuses)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 251;
-- [HIGH] Socca niçoise (galette de farine de pois chiches) (Légumineuses)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 252;
-- [HIGH] Panisses marseillaises (Spécialité marseillaise)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 6, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 253;
-- [HIGH] Lasagnes végétariennes aux légumes du soleil (Lasagnes)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 254;
-- [HIGH] Lasagnes aux épinards et à la ricotta (Lasagnes)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 255;
-- [HIGH] Risotto aux champignons (Risotto)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 256;
-- [HIGH] Pâtes à la sauce tomate et basilic frais (al pomodoro) (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 261;
-- [HIGH] Pâtes all'arrabbiata (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 262;
-- [HIGH] Pâtes alla puttanesca (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 263;
-- [HIGH] Pâtes à la carbonara (la vraie (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 264;
-- [HIGH] Pâtes cacio e pepe (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 265;
-- [HIGH] Pâtes à l'amatriciana (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 266;
-- [HIGH] Pâtes au pesto alla genovese (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 267;
-- [HIGH] Pâtes aux palourdes (alle vongole) (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 268;
-- [HIGH] Pâtes aux fruits de mer (allo scoglio) (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 269;
-- [HIGH] Pâtes alla norma (aubergines (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 270;
-- [HIGH] Gnocchis de pommes de terre (Gnocchis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 271;
-- [HIGH] Gnocchis à la sorrentina (sauce tomate (Gnocchis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 272;
-- [HIGH] Raviolis aux épinards et ricotta (Raviolis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 273;
-- [HIGH] Cannellonis farcis à la bolognaise (Cannellonis)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 274;
-- [HIGH] Macaroni and cheese américain (gratin de macaronis) (Gratin)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 276;
-- [HIGH] One pot pasta tomate (One pot)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 278;
-- [HIGH] Pâtes au citron et à la crème (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 279;
-- [HIGH] Pâtes fraîches maison (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 281;
-- [HIGH] Tofu sauté aux légumes et sauce soja (Tofu)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 282;
-- [HIGH] Tofu mariné et grillé au sésame (Tofu)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 283;
-- [HIGH] Tofu général Tao (Tofu)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 284;
-- [HIGH] Tofu Mapo (recette sichuanaise) (Tofu)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 285;
-- [HIGH] Tofu brouillé (alternative aux œufs) (Tofu)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 287;
-- [HIGH] Tofu Katsu (pané et frit) (Tofu)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 288;
-- [HIGH] Seitan bourguignon (Bourguignon)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 150, servings = 6, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 289;
-- [HIGH] Sauté de seitan et brocolis (Seitan)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 290;
-- [HIGH] Burger de seitan (Burger)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 291;
-- [HIGH] Tempeh laqué à l'indonésienne (Tempeh)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 292;
-- [HIGH] Buddha bowl au quinoa (Buddha bowl)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 293;
-- [HIGH] Quinoa façon taboulé (Salade orientale)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 295;
-- [HIGH] Galettes de quinoa et carottes (Galettes)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 296;
-- [HIGH] Ratatouille niçoise (Ratatouille)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 303;
-- [HIGH] Wok de légumes sauce aigre-douce (Wok)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 307;
-- [HIGH] Légumes rôtis au four (carottes (Légumes rôtis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 308;
-- [LOW] Frites de patates douces au paprika (Non reconnu)
-- [HIGH] Écrasé de pommes de terre à l'huile d'olive et ail (Écrasé)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 314;
-- [HIGH] Pommes de terre suédoises (Hasselback) (Four)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 45, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 315;
-- [HIGH] Pommes dauphine maison (Friture)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 20, servings = 6, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 316;
-- [HIGH] Aligot de l'Aubrac (Aligot)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson sur feu', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 317;
-- [HIGH] Truffade auvergnate (Truffade)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 318;
-- [HIGH] Frites de polenta au parmesan (Polenta)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 320;
-- [HIGH] Polenta crémeuse (Polenta)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 321;
-- [HIGH] Endives braisées au jambon (Endives jambon)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 322;
-- [HIGH] Asperges vertes rôties au parmesan (Légumes rôtis)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 323;
-- [HIGH] Épinards frais à la crème (Épinards)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 325;
-- [HIGH] Choux de Bruxelles rôtis au lard et sirop d'érable (Légumes rôtis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 326;
-- [HIGH] Carottes glacées à l'orange (Légumes glacés)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 327;
-- [HIGH] Betteraves rôties au miel et au thym (Légumes rôtis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 45, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 328;
-- [HIGH] Fenouil braisé à l'anis (Braisé)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 40, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 329;
-- [LOW] Riz pilaf aux amandes et raisins secs (Non reconnu)
-- [HIGH] Semoule aux légumes (accompagnement tajine) (Tajine)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 331;
-- [HIGH] Palak Paneer (épinards au fromage indien) (Palak paneer)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 333;
-- [HIGH] Baingan Bharta (caviar d'aubergine indien) (Aubergines indiennes)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 336;
-- [HIGH] Samosas aux légumes (Friture)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 12, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 337;
-- [HIGH] Pakoras d'oignons (beignets indiens) (Beignets indiens)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 338;
-- [HIGH] Caponata sicilienne (Caponata)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 339;
-- [HIGH] Pâtes aux brocolis et anchois (Pâtes)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 12, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 340;
-- [HIGH] Galettes de sarrasin aux champignons et crème (Galettes)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 342;
-- [HIGH] Crozets en gratin au beaufort (croziflette) (Gratin)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 343;
-- [LOW] Tarte au maroilles (Non reconnu)
-- [HIGH] Pissaladière niçoise (Tarte provençale)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 345;
-- [HIGH] Gözleme turc aux épinards et feta (Crêpe turque)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 347;
-- [HIGH] Börek aux épinards (Feuilleté turc)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 348;
-- [HIGH] Fattoush (salade libanaise au pain pita grillé) (Salade orientale)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 349;
-- [HIGH] Koshari égyptien (riz (Koshari)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 350;
-- [LOW] Mjadra (riz aux lentilles et oignons frits) (Non reconnu)
-- [HIGH] Coleslaw américain (Salade chou)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 353;
-- [LOW] Ajo Blanco (soupe froide d'amandes espagnole) (Non reconnu)
-- [LOW] Vichyssoise (soupe froide poireaux-pommes de terre) (Non reconnu)
-- [LOW] Okroshka (soupe froide russe au kvas) (Non reconnu)
-- [HIGH] Burger de bœuf classique (Burger)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 372;
-- [HIGH] Burger de poulet croustillant (Burger)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 373;
-- [HIGH] Burger végétarien aux haricots noirs (Burger)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 374;
-- [HIGH] Hot-dog new-yorkais (Hot-dog)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 375;
-- [HIGH] Croque-Monsieur (Croque)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 379;
-- [HIGH] Croque-Madame (Croque)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 380;
-- [HIGH] Welsh rarebit (Toast gallois)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Grillade', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 381;
-- [HIGH] Kebab maison (pain pita (Kebab)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Préparation rapide', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 382;
-- [HIGH] Gyros grec au porc (Kebab)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 15, servings = 4, cooking_method = 'Préparation rapide', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 383;
-- [HIGH] Wrap au poulet César (Sandwich)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 5, servings = 4, cooking_method = 'Préparation rapide', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 384;
-- [HIGH] Wrap au houmous (Tartinade)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 385;
-- [HIGH] Bagel au saumon fumé et cream cheese (Bagel)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 5, servings = 2, cooking_method = 'Préparation rapide', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 386;
-- [HIGH] Arepas vénézuéliennes (Empanadas)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 25, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 388;
-- [HIGH] Empanadas argentines à la viande (Empanadas)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 25, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 389;
-- [HIGH] Ramen japonais au porc chashu (Bouillon + nouilles)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 120, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 392;
-- [HIGH] Udon sauté au bœuf (Nouilles)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 393;
-- [HIGH] Soba froides et leur sauce tsuyu (Nouilles)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 8, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 394;
-- [HIGH] Yaki Soba (nouilles sautées japonaises) (Nouilles sautées)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 395;
-- [HIGH] Riz cantonais (Riz sauté)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 396;
-- [HIGH] Nasi Goreng indonésien (Riz sauté)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 397;
-- [LOW] Riz sauté thaï à l'ananas et aux crevettes (Non reconnu)
-- [HIGH] Dan Dan noodles sichuanaises (Nouilles)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 399;
-- [HIGH] Nouilles sautées au poulet et légumes (Nouilles)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 400;
-- [HIGH] Japchae (nouilles de patate douce coréennes) (Nouilles)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 15, servings = 4, cooking_method = 'Sauté au wok', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 401;
-- [HIGH] Laksa de Singapour (soupe de nouilles épicée) (Soupe épicée)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 30, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 403;
-- [HIGH] Oyakodon (bol de riz au poulet et à l'œuf) (Bowl)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 405;
-- [HIGH] Katsudon (bol de riz au porc pané) (Bowl)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 4, cooking_method = 'Cuisson mixte', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 406;
-- [HIGH] Onigiri japonais (boules de riz farcies) (Boules riz)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 407;
-- [HIGH] Congee de riz (porridge de riz salé) (Porridge)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 10, servings = 2, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 408;
-- [LOW] Riz gluant à la mangue thaïlandais (Non reconnu)
-- [HIGH] Kimchi Jjigae (ragoût de kimchi coréen) (Ragoût coréen)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = TRUE, needs_side_dish = FALSE WHERE id = 410;
-- [HIGH] Tteokbokki (gâteaux de riz épicés coréens) (Ragoût coréen)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 411;
-- [LOW] Crème brûlée à la vanille (Non reconnu)
-- [LOW] Mousse au chocolat noir (Non reconnu)
-- [HIGH] Île flottante et sa crème anglaise (Dessert)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 6, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 414;
-- [HIGH] Profiteroles au chocolat chaud (Pâte à choux)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 20, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 415;
-- [LOW] Tarte Tatin aux pommes (Non reconnu)
-- [LOW] Tarte au citron meringuée (Non reconnu)
-- [HIGH] Tarte Bourdaloue (poires et amandes) (Dahl)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 4, cooking_method = 'Mijotage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 418;
-- [HIGH] Clafoutis aux cerises (Clafoutis)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 419;
-- [HIGH] Far breton aux pruneaux (Far)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 45, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 420;
-- [HIGH] Canelés de Bordeaux (Canelés)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 60, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 421;
-- [HIGH] Macarons parisiens (pistache (Macarons)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 15, servings = 24, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 422;
-- [HIGH] Paris-Brest (pâte à choux (Pâte à choux)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 423;
-- [HIGH] Éclair au café ou au chocolat (Pâte à choux)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 20, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 424;
-- [HIGH] Religieuse au chocolat (Pâte à choux)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 20, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 425;
-- [HIGH] Saint-Honoré (Pâte à choux)
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 426;
-- [HIGH] Fraisier (Entremets)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 427;
-- [HIGH] Opéra (Entremets)
UPDATE recipes SET prep_time_minutes = 60, cook_time_minutes = 0, servings = 12, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 428;
-- [HIGH] Mille-feuille (Feuilletage)
UPDATE recipes SET prep_time_minutes = 45, cook_time_minutes = 25, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 429;
-- [HIGH] Soufflé au Grand Marnier (Soufflé)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 430;
-- [LOW] Tiramisu classique au café (Non reconnu)
-- [HIGH] Panna Cotta et son coulis de fruits rouges (Dessert froid)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 433;
-- [LOW] Tiramisu aux fraises (Non reconnu)
-- [HIGH] Panna Cotta au caramel beurre salé (Dessert froid)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 435;
-- [HIGH] Zabaione au Marsala (Crème)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 4, cooking_method = 'Cuisson au bain-marie', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 436;
-- [HIGH] Cannoli siciliens à la ricotta (Pâtisserie)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 12, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 437;
-- [LOW] Torta della nonna (tarte à la crème pâtissière et pignons) (Non reconnu)
-- [LOW] Torta caprese (gâteau au chocolat et amandes) (Non reconnu)
-- [HIGH] Semifreddo au nougat (Glacé)
UPDATE recipes SET prep_time_minutes = 25, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 440;
-- [HIGH] Gelato à la pistache maison (Glace)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 6, cooking_method = 'Turbinage', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 441;
-- [LOW] Affogato (glace vanille noyée dans un expresso) (Non reconnu)
-- [HIGH] Panettone (version maison) (Pain brioché)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 50, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 443;
-- [HIGH] Cantucci (croquants aux amandes) (Biscuits)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 25, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 444;
-- [HIGH] Bonet piémontais (flan au chocolat et amaretti) (Flan)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 40, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 445;
-- [HIGH] Pêches au vin (Fruits)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 0, servings = 4, cooking_method = 'Marinade', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 446;
-- [LOW] Sbrisolona (gâteau friable aux amandes) (Non reconnu)
-- [HIGH] Salame al cioccolato (saucisson au chocolat) (Dessert froid)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 12, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 449;
-- [HIGH] Sfogliatelle napolitaines (Feuilletage)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 20, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 450;
-- [HIGH] Pastiera napolitaine (Tarte)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 60, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 451;
-- [LOW] Cheesecake new-yorkais (Non reconnu)
-- [LOW] Brownie au chocolat et noix de pécan (Non reconnu)
-- [LOW] Cookies aux pépites de chocolat (Non reconnu)
-- [HIGH] Apple pie américaine (Tarte)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 45, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 455;
-- [LOW] Pumpkin pie (tarte à la citrouille) (Non reconnu)
-- [LOW] Pecan pie (tarte aux noix de pécan) (Non reconnu)
-- [LOW] Carrot cake et son glaçage au cream cheese (Non reconnu)
-- [LOW] Red velvet cake (Non reconnu)
-- [LOW] Muffins aux myrtilles (Non reconnu)
-- [LOW] Cupcakes à la vanille et glaçage (Non reconnu)
-- [HIGH] Banana bread (Cake)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 55, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 462;
-- [LOW] Key lime pie (tarte au citron vert) (Non reconnu)
-- [HIGH] Crumble aux pommes et à la cannelle (Crumble)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 464;
-- [HIGH] Sticky toffee pudding (Pudding)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 465;
-- [HIGH] Eton mess (meringue (Dessert)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 6, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 466;
-- [HIGH] Trifle anglais (Dessert)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 468;
-- [HIGH] Banoffee pie (Tarte froide)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 0, servings = 8, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 469;
-- [HIGH] Bread and butter pudding (Pudding)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 470;
-- [HIGH] Shortbread écossais (Biscuits)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 471;
-- [HIGH] Forêt-Noire allemande (Schwarzwälder Kirschtorte) (Gâteau)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 30, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 472;
-- [HIGH] Apfelstrudel autrichien (Strudel)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 8, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 473;
-- [HIGH] Sacher Torte viennoise (Gâteau)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 50, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 474;
-- [HIGH] Linzer Torte (Tarte)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 35, servings = 10, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 475;
-- [HIGH] Churros espagnols et leur chocolat chaud (Beignets)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 6, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 476;
-- [HIGH] Crème catalane (Crème)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 5, servings = 6, cooking_method = 'Cuisson sur feu', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 477;
-- [LOW] Tarta de Santiago (gâteau aux amandes) (Non reconnu)
-- [HIGH] Leche frita (lait frit) (Dessert frit)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 8, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 479;
-- [HIGH] Pastel de nata portugais (Pâtisserie)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 25, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 480;
-- [LOW] Gâteau basque à la crème ou à la cerise (Non reconnu)
-- [HIGH] Loukoumades grecs (beignets au miel) (Beignets)
UPDATE recipes SET prep_time_minutes = 20, cook_time_minutes = 15, servings = 12, cooking_method = 'Friture', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 482;
-- [HIGH] Baklava (Pâtisserie)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 40, servings = 16, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 483;
-- [HIGH] Halva (Confiserie)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 12, cooking_method = 'Cuisson sur feu', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 484;
-- [LOW] Basboussa (gâteau de semoule) (Non reconnu)
-- [HIGH] Cornes de gazelle marocaines (Pâtisserie)
UPDATE recipes SET prep_time_minutes = 40, cook_time_minutes = 25, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 486;
-- [HIGH] Mochi japonais (Dessert japonais)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 0, servings = 12, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 487;
-- [HIGH] Dorayaki (pancakes japonais fourrés) (Poêle)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 15, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 488;
-- [LOW] Gâteau de lune chinois (Non reconnu)
-- [HIGH] Alfajores argentins (Biscuits)
UPDATE recipes SET prep_time_minutes = 30, cook_time_minutes = 15, servings = 12, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 490;
-- [HIGH] Brigadeiros brésiliens (Confiserie)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 10, servings = 24, cooking_method = 'Cuisson sur feu', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 491;
-- [HIGH] Fraises au sucre et jus de citron (Fruits)
UPDATE recipes SET prep_time_minutes = 5, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 494;
-- [HIGH] Poires Belle-Hélène (Fruits)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 20, servings = 4, cooking_method = 'Cuisson à l''eau', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 496;
-- [HIGH] Pêches Melba (Fruits)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 0, servings = 4, cooking_method = 'Sans cuisson', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 497;
-- [HIGH] Pommes au four (Fruits)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 30, servings = 4, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 498;
-- [HIGH] Bananes flambées au rhum (Fruits)
UPDATE recipes SET prep_time_minutes = 10, cook_time_minutes = 10, servings = 4, cooking_method = 'Poêle', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 499;
-- [HIGH] Crumble aux fruits rouges et flocons d'avoine (Crumble)
UPDATE recipes SET prep_time_minutes = 15, cook_time_minutes = 35, servings = 6, cooking_method = 'Cuisson au four', is_complete_meal = FALSE, needs_side_dish = NULL WHERE id = 504;

COMMIT;
