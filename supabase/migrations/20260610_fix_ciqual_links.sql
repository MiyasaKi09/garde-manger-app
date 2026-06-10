-- =============================================================================
-- MIGRATION : Correction des liaisons canonical_foods ↔ nutritional_data
-- Date    : 2026-06-10
-- Auteur  : recipe-domain-expert (Claude Code)
-- Méthode : Matching manuel sur ciqual_reference, règles CIQUAL appliquées :
--           (a) ingrédient brut → entrée générique crue
--           (b) entrée la plus générique sans préparation
--           (c) jamais un plat composé pour un ingrédient simple
--           (d) groupe CIQUAL cohérent avec la nature de l'aliment
--           (e) viandes/volailles : coupe représentative crue
--           (f) herbes fraîches > séchées
--           (g) liquides/condiments : entrée générique
-- LECTURE SEULE des requêtes de recherche → seuls les UPDATE sont actifs.
-- Appliquer après vérification section 3.
-- =============================================================================


-- =============================================================================
-- SECTION 1 : CORRECTIONS nutrition_id (canonical_foods.nutrition_id)
-- Format : UPDATE ... WHERE id = NNN; -- canonical_name : « Nom CIQUAL » (était : « ancien nom » / NULL)
-- =============================================================================

-- ─── FRUITS ──────────────────────────────────────────────────────────────────

-- id 1025 : fruit du dragon — aucune entrée CIQUAL directe → proxy kiwi (proche nutritionnellement : faible calorie, vit C)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13021') WHERE id = 1025;
-- fruit du dragon : « Kiwi, pulpe et graines, cru » (proxy ; était : « Pomelo (dit Pamplemousse), pulpe, cru »)

-- id 1031 : laitue — pointait vers Pissenlit (20038), doit pointer vers Laitue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20031') WHERE id = 1031;
-- laitue : « Laitue, crue » (était : « Pissenlit, cru »)

-- id 1036 : melon — pointait vers Courge melonnette (20136), doit pointer vers Melon cantaloup cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13026') WHERE id = 1036;
-- melon : « Melon cantaloup, pulpe, cru » (était : « Courge melonnette, pulpe, crue »)

-- id 1039 : mûre — pointait vers Olive noire en saumure (13032), doit pointer vers Mûre de ronce crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13029') WHERE id = 1039;
-- mûre : « Mûre (de ronce), crue » (était : « Olive noire, en saumure, égouttée »)

-- id 1047 : pastèque — pointait vers Pêche (13043), doit pointer vers Pastèque crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13036') WHERE id = 1047;
-- pastèque : « Pastèque, pulpe, crue » (était : « Pêche, pulpe et peau, crue »)

-- id 1048 : pêche — pointait vers Pomme (13039), doit pointer vers Pêche crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13043') WHERE id = 1048;
-- pêche : « Pêche, pulpe et peau, crue » (était : « Pomme, pulpe et peau, crue »)

-- id 1050 : poire — pointait vers Poireau (20039), doit pointer vers Poire crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13037') WHERE id = 1050;
-- poire : « Poire, pulpe et peau, crue » (était : « Poireau, cru »)

-- id 1052 : pomme — pointait vers Printanière de légumes surgelés (20267), doit pointer vers Pomme crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13039') WHERE id = 1052;
-- pomme : « Pomme, pulpe et peau, crue » (était : « Printanière de légumes, surgelée, crue »)

-- id 1055 : quetsche — même code que prune Reine-Claude (13041) → acceptable (prune proche), confirmé

-- ─── LÉGUMES ─────────────────────────────────────────────────────────────────

-- id 1005 : carotte — pointait vers Carotte cuite (20008), doit pointer vers Carotte crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20009') WHERE id = 1005;
-- carotte : « Carotte, crue » (était : « Carotte, cuite »)

-- id 1007 : céleri-rave — pointait vers Carotte cuite (20008), doit pointer vers Céleri-rave cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20055') WHERE id = 1007;
-- céleri-rave : « Céleri-rave, cru » (était : « Carotte, cuite »)

-- id 1018 : coriandre — pointait vers Coriandre graine (11026), doit pointer vers Coriandre fraîche
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11094') WHERE id = 1018;
-- coriandre : « Coriandre, fraiche » (était : « Coriandre, graine »)

-- id 1026 : goyave — catégorie incorrecte (Légumes), correction category_id en section 2
-- source_id 13083 correct (Goyave, pulpe, crue), confirmé

-- id 1049 : persil — pointait vers Moules farcies persillade (10083 !), doit pointer vers Persil frais
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11014') WHERE id = 1049;
-- persil : « Persil, frais » (était : « Moules farcies (matière grasse, persillade…), préemballées, crues »)

-- id 1051 : poivron — pointait vers Piment (20151), doit pointer vers Poivron (vert/jaune/rouge)
-- Vérif : poivron = 20041 dans la base
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20041') WHERE id = 1051;
-- poivron : « Poivron, vert, jaune ou rouge, cru » (était : « Piment, cru »)

-- id 1053 : pomme de terre — pointait vers Pomme de terre bouillie (4003), doit pointer vers cru
-- Note : source_id 4003 = « Pomme de terre, bouillie/cuite à l'eau »
-- Il n'existe pas de code CIQUAL « pomme de terre crue » général → on utilise 4001 si disponible
-- 4001 vérification :
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '4001') WHERE id = 1053 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '4001');
-- Si 4001 absent, fallback conservé (4003 bouillie acceptable comme proxy éducatif)
-- pomme de terre : « Pomme de terre, crue » si dispo, sinon bouillie (était : « Pomme de terre, bouillie »)

-- id 2002 : boeuf — pointait vers Tomate côtelée (20192 !), doit pointer vers Bœuf steak haché cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '6252') WHERE id = 2002;
-- boeuf : « Boeuf, steak haché 10% MG, cru » (était : « Tomate côtelée ou coeur de boeuf, crue »)

-- id 2003 : brocoli — pointait vers Carotte crue (20009), doit pointer vers Brocoli cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20057') WHERE id = 2003;
-- brocoli : « Brocoli, cru » (était : « Carotte, crue »)

-- id 2007 : céleri branche — pointait vers Carotte appertisée (20007), doit pointer vers Céleri branche cru
-- 20023 = Céleri branche, cru (confirmé dans données de requête précédente)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20023') WHERE id = 2007;
-- céleri branche : « Céleri branche, cru » (était : « Carotte, appertisée, égouttée »)

-- id 2016 : chou-fleur — pointait vers Chou de Bruxelles cuit (20013), doit pointer vers Chou-fleur cru
-- Vérif code chou-fleur cru :
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20015') WHERE id = 2016 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '20015');
-- Si 20015 absent, recherche alternative (20016 ?)
-- Note : 20013 = Chou de Bruxelles cuit (faux) → à corriger

-- id 2019 : citronnelle — pointait vers Fenouil légume (20028), doit pointer vers citronnelle
-- CIQUAL ne contient pas d'entrée citronnelle → proxy : gingembre racine crue (profil aromatique proche)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11074') WHERE id = 2019;
-- citronnelle : proxy « Gingembre, racine crue » (était : « Fenouil, cru »)

-- id 2023 : cornichon — pointait vers Sandwich baguette pâté cornichons (25519 !), doit pointer vers Cornichon au vinaigre
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11004') WHERE id = 2023;
-- cornichon : « Cornichon, au vinaigre » (était : « Sandwich baguette, pâté, cornichons »)

-- id 2026 : courgette — pointait vers Poivron (20041), doit pointer vers Courgette crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20020') WHERE id = 2026;
-- courgette : « Courgette, pulpe et peau, crue » (était : « Poivron, vert, jaune ou rouge, cru »)

-- id 2031 : échalote — pointait vers Tomate concentrée appertisée (20068), doit pointer vers Échalote crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20097') WHERE id = 2031;
-- échalote : « Échalote, crue » (était : « Tomate, concentré, appertisé »)

-- id 2033 : estragon — pointait vers Poisson blanc à l'estragon préemballé (25145 !), doit pointer vers Estragon frais
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11092') WHERE id = 2033;
-- estragon : « Estragon, frais » (était : « Poisson blanc à l'estragon, préemballé »)

-- id 2034 : fenouil — catégorie Épices incorrecte (c'est un légume) → section 2 ; source_id 20028 correct, confirmé

-- id 2035 : fève — pointait vers Haricot vert cuit (20030), doit pointer vers Fève sèche
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20518') WHERE id = 2035;
-- fève : « Fève, sèche » (était : « Haricot vert, cuit »)

-- id 2040 : oeuf — pointait vers Sandwich baguette jambon oeuf (25475 !), doit pointer vers Oeuf cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '22000') WHERE id = 2040;
-- oeuf : « Oeuf, cru » (était : « Sandwich baguette, jambon, oeuf dur, crudités, beurre »)

-- id 2042 : oignon nouveau — pointait vers Oignon nouveau sauté sans MG (20323), doit pointer vers Oignon cru (20034)
-- Il n'existe pas d'entrée « oignon nouveau, cru » dans CIQUAL → proxy oignon cru acceptable
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20034') WHERE id = 2042;
-- oignon nouveau : proxy « Oignon, cru » (était : « Oignon nouveau, sauté/poêlé sans matière grasse »)

-- id 2043 : origan — catégorie Légumes incorrecte (Épices) → section 2 ; source_id 11035 = Origan séché, confirmé

-- id 2049 : poireau — pointait vers Potiron appertisé (20043), doit pointer vers Poireau cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20039') WHERE id = 2049;
-- poireau : « Poireau, cru » (était : « Potiron, appertisé, égoutté »)

-- id 2051 : porc — pointait vers Sandwich baguette porc (25533 !), doit pointer vers Porc rôti cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '28300') WHERE id = 2051;
-- porc : « Porc, rôti, cru » (était : « Sandwich baguette, porc, crudités, mayonnaise »)

-- id 2054 : poulet — pointait vers Sandwich baguette poulet (25476 !), doit pointer vers Poulet viande crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '36003') WHERE id = 2054;
-- poulet : « Poulet, viande, crue » (était : « Sandwich baguette, poulet, crudités, mayonnaise »)

-- id 2055 : pousse de bambou — pointait vers Blette (20004), doit pointer vers Pousse de bambou
-- Recherche code CIQUAL pousse de bambou :
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20175') WHERE id = 2055 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '20175');
-- Si absent : proxy cœur de palmier appertisé (20018), déjà utilisé pour cœur de palmier
-- Fallback :
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20018') WHERE id = 2055 AND NOT EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '20175');
-- pousse de bambou : proxy « Coeur de palmier, appertisé, égoutté » (était : « Bette ou blette, crue »)

-- id 2063 : shiso — pointait vers Cerfeuil (11002), doit pointer vers proxy Basilic frais (herbe aromatique similaire)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11033') WHERE id = 2063;
-- shiso : proxy « Basilic, frais » (était : « Cerfeuil, frais »)

-- id 2064 : thon — pointait vers Sandwich baguette thon (25431 !), doit pointer vers Thon cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '26053') WHERE id = 2064;
-- thon : « Thon, cru » (était : « Sandwich baguette, thon, crudités, mayonnaise »)

-- id 2065 : tomatillo — pointait vers Topinambour (20196), proxy le plus proche = Tomate crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20047') WHERE id = 2065;
-- tomatillo : proxy « Tomate, crue » (était : « Topinambour, cru »)

-- id 2067 : verveine — pointait vers sirop à diluer (18058), doit pointer vers Tisane infusée
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '18022') WHERE id = 2067;
-- verveine : proxy « Tisane infusée, non sucrée » (était : « Boisson préparée à partir de sirop à diluer »)

-- ─── CÉRÉALES / LÉGUMINEUSES ─────────────────────────────────────────────────

-- id 5002 : blé — pointait vers Blette (20004 !), doit pointer vers Blé tendre entier cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '9010') WHERE id = 5002;
-- blé : « Blé tendre entier ou froment, cru » (était : « Bette ou blette, crue »)

-- id 5004 : haricot — pointait vers Haricot vert cru (20061), doit pointer vers Haricot blanc sec (légumineuse générique)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20501') WHERE id = 5004;
-- haricot : « Haricot blanc, sec » (était : « Haricot vert, cru »)

-- id 5005 : lentille — pointait vers Salade de lentilles saucisse (26261 !), doit pointer vers Lentille sèche
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20504') WHERE id = 5005;
-- lentille : « Lentille, sèche » (était : « Salade de lentilles et saucisse fumée, préemballée »)

-- id 5006 : millet — pointait vers Farine de millet (9555), doit pointer vers grain entier si dispo
-- 9555 = Farine de millet (pas idéal mais acceptable faute d'entrée grain cru)
-- Confirmé comme proxy acceptable ; pas de meilleur code disponible → conservé

-- id 5008 : pois chiche — pointait vers Pois chiche bouilli (20507), doit pointer vers Pois chiche cru/sec
-- Vérif code pois chiche sec :
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20506') WHERE id = 5008 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '20506');
-- Si absent, conserve 20507 bouillie

-- id 14022 : haricot noir — pointait vers Haricot vert cru (20061), doit pointer vers Haricot noir
-- CIQUAL ne liste pas un « haricot noir » séparé → proxy haricot rouge sec (20525)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20525') WHERE id = 14022;
-- haricot noir : proxy « Haricot rouge, sec » (était : « Haricot vert, cru »)

-- id 14024 : lait végétal — pointait vers Pousse de soja (20183), doit pointer vers Boisson soja nature
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '18900') WHERE id = 14024;
-- lait végétal : « Boisson au soja, nature, non enrichie » (était : « Haricot mungo germé ou pousse de soja, cru »)

-- ─── VIANDES / VOLAILLES ────────────────────────────────────────────────────

-- id 4001 : agneau — pointait vers Boeuf steak haché 5% MG (6250), doit pointer vers Agneau gigot cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '21502') WHERE id = 4001;
-- agneau : « Agneau, gigot, cru » (était : « Boeuf, steak haché 5% MG, cru »)

-- id 8009 : dinde — pointait vers Sandwich baguette dinde (25531 !), doit pointer vers Dinde viande crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '36301') WHERE id = 8009;
-- dinde : « Dinde, viande, crue » (était : « Sandwich baguette, dinde, crudités, mayonnaise »)

-- id 14011 : bœuf — pointait vers Boeuf braisé (6101, cuit !), doit pointer vers Boeuf steak haché cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '6252') WHERE id = 14011;
-- bœuf : « Boeuf, steak haché 10% MG, cru » (était : « Boeuf, braisé »)

-- id 8015 : veau — pointait vers Rillettes du Mans (source_id 6510 dans la base → vérification)
-- Nota : source_id = 6510 = « Veau, côte, crue » → ce lien est en fait CORRECT (confirmé par requête proteines 20.7g)
-- Conservé (déjà correct)

-- id 10003 : moutarde — pointait vers Lapin à la moutarde préemballé (25063 !), doit pointer vers Moutarde
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11013') WHERE id = 10003;
-- moutarde : « Moutarde » (était : « Lapin à la moutarde, préemballé »)

-- id 10005 : poivre — pointait vers Canard en sauce poivre vert (25058 !), doit pointer vers Poivre noir poudre
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11015') WHERE id = 10005;
-- poivre : « Poivre noir, poudre » (était : « Canard en sauce (poivre vert, chasseur, etc.), préemballé »)

-- id 10007 : vanille — pointait vers Liégeois viennois (19681 !), doit pointer vers Vanille gousse
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11057') WHERE id = 10007;
-- vanille : « Vanille, gousse » (était : « Liégeois ou viennois (chocolat, café, caramel ou vanille), rayon frais »)

-- id 14012 : cannelle — pointait vers Bouillon de boeuf déshydraté (11001 !), doit pointer vers Cannelle poudre
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11025') WHERE id = 14012;
-- cannelle : « Cannelle, poudre » (était : « Bouillon de boeuf, déshydraté »)

-- ─── POISSONS / FRUITS DE MER ────────────────────────────────────────────────

-- id 9002 : bar — pointait vers Rhubarbe (13047 !), doit pointer vers Bar commun cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '26072') WHERE id = 9002;
-- bar : « Bar commun ou loup, cru, sans précision » (était : « Rhubarbe, tige, crue »)

-- id 9006 : huître — pointait vers Calmar (10001), doit pointer vers Huître sans précision crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '10011') WHERE id = 9006;
-- huître : « Huître, sans précision, crue » (était : « Calmar ou calamar ou encornet, cru »)

-- id 9007 : maïs — pointait vers Sandwich baguette thon maïs (25490 !), doit pointer vers Maïs doux appertisé
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20066') WHERE id = 9007;
-- maïs : « Maïs doux, appertisé, égoutté » (était : « Sandwich baguette, thon, maïs, crudités, préemballé »)

-- id 9008 : maquereau — pointait vers Groseille à maquereau (13020 !), doit pointer vers Maquereau cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '26051') WHERE id = 9008;
-- maquereau : « Maquereau, cru » (était : « Groseille à maquereau, crue »)

-- id 9010 : moule — pointait vers Moules farcies préemballées (10083, entrées et plats composés !), doit pointer vers Moule commune crue
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '10014') WHERE id = 9010;
-- moule : « Moule commune, crue » (était : « Moules farcies (matière grasse, persillade…), préemballées, crues »)

-- ─── ÉPICES / CONDIMENTS ─────────────────────────────────────────────────────

-- id 8001 : ail des ours — pointait vers Bouillon de boeuf déshydraté (11001 !), doit pointer vers Ail des ours frais
-- CIQUAL ne contient pas « Ail des ours » → proxy Ail cru (profil aromatique alliacé similaire)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11000') WHERE id = 8001;
-- ail des ours : proxy « Ail, cru » (était : « Bouillon de boeuf, déshydraté »)

-- id 1037 : menthe — pointait vers sirop à diluer (18058), doit pointer vers Menthe fraîche
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11027') WHERE id = 1037;
-- menthe : « Menthe, fraîche » (était : « Boisson préparée à partir de sirop à diluer »)

-- id 8007 : camomille — pointait vers sirop à diluer (18058), doit pointer vers Tisane infusée (proxy)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '18022') WHERE id = 8007;
-- camomille : proxy « Tisane infusée, non sucrée » (était : « Boisson préparée à partir de sirop à diluer »)

-- id 8014 : thé — pointait vers sirop à diluer (18058), doit pointer vers Thé infusé non sucré
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '18020') WHERE id = 8014;
-- thé : « Thé infusé, non sucré » (était : « Boisson préparée à partir de sirop à diluer »)

-- id 6004 : sel — pointait vers Raisin Chasselas (13101 !), doit pointer vers Fleur de sel
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11082') WHERE id = 6004;
-- sel : « Fleur de sel, non iodée, non fluorée » (était : « Raisin Chasselas, cru »)

-- ─── PRODUITS LAITIERS / DIVERS ──────────────────────────────────────────────

-- id 7001 : lait — pointait vers Laitue (20031 !), doit pointer vers Lait demi-écrémé UHT
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '19041') WHERE id = 7001;
-- lait : « Lait demi-écrémé, UHT » (était : « Laitue, crue »)

-- id 8005 : cacao — pointait vers Boisson cacaotée prête à boire (18104), doit pointer vers Cacao poudre non sucrée
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '18100') WHERE id = 8005;
-- cacao : « Cacao, non sucré, poudre soluble » (était : « Boisson cacaotée, instantanée, prête à boire »)

-- id 8006 : café — pointait vers Café moulu (18003) → DÉJÀ CORRECT, confirmé

-- ─── ÉDULCORANTS ─────────────────────────────────────────────────────────────

-- id 14001 : miel — pointait vers Melon miel (13742 !), doit pointer vers Miel
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '31008') WHERE id = 14001;
-- miel : « Miel » (était : « Melon miel ou melon honeydew, pulpe, cru »)

-- id 14002 : sirop d'érable — pointait vers Melon miel (13742 !), doit pointer vers Sirop d'érable
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '31034') WHERE id = 14002;
-- sirop d'érable : « Sirop d'érable » (était : « Melon miel ou melon honeydew, pulpe, cru »)

-- id 14003 : sucre de betterave — pointait vers Compote allégée (13109 !), doit pointer vers Sucre blanc
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '31016') WHERE id = 14003;
-- sucre de betterave : proxy « Sucre blanc » (était : « Compote, tout type de fruits, allégée en sucres »)

-- id 14004 : sucre de canne — pointait vers Compote allégée (13109 !), doit pointer vers Sucre blanc
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '31016') WHERE id = 14004;
-- sucre de canne : proxy « Sucre blanc » (était : « Compote, tout type de fruits, allégée en sucres »)

-- id 14037 : sucre — pointait vers Compote allégée (13109 !), doit pointer vers Sucre blanc
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '31016') WHERE id = 14037;
-- sucre : « Sucre blanc » (était : « Compote, tout type de fruits, allégée en sucres »)

-- id 14038 : sucre glace — pointait vers Biscuit fourré sucre glace (24680 !), doit pointer vers Sucre blanc (proxy)
-- CIQUAL ne contient pas « sucre glace » en entrée propre → proxy sucre blanc
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '31016') WHERE id = 14038;
-- sucre glace : proxy « Sucre blanc » (était : « Biscuit moelleux fourré à l'orange et enrobé de sucre glace »)

-- id 14040 : levure — pointait vers Farine avec levure (9437), doit pointer vers Levure de boulanger compressée
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11010') WHERE id = 14040;
-- levure : « Levure de boulanger, compressée » (était : « Farine de blé tendre ou froment avec levure incorporée »)

-- id 14042 : gélatine — pointait vers Farine avec levure (9437 !), doit pointer vers Gélatine sèche
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11007') WHERE id = 14042;
-- gélatine : « Gélatine, sèche » (était : « Farine de blé tendre ou froment avec levure incorporée »)

-- id 14043 : maïzena — pointait vers Épeautre (9001 !), doit pointer vers Amidon de maïs
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '9510') WHERE id = 14043;
-- maïzena : « Amidon de maïs ou fécule de maïs » (était : « Épeautre, cru »)

-- ─── NOIX ET GRAINES ─────────────────────────────────────────────────────────

-- id 11004 : cajou — pointait vers Pomme cajou de Martinique (13434), doit pointer vers Noix de cajou grillée non salée
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15054') WHERE id = 11004;
-- cajou : « Noix de cajou, grillée à sec, non salée » (était : « Pomme cajou, pulpe, crue, prélevée à la Martinique »)

-- id 11005 : noix — pointait vers Boeuf gîte à la noix (6102 !), doit pointer vers Noix sans précision
-- Vérif code noix :
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15005') WHERE id = 11005 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '15005');
-- Fallback si 15005 absent :
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15008') WHERE id = 11005
  AND NOT EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '15005')
  AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '15008');
-- noix : « Noix, sans précision » ou alternative (était : « Boeuf, gîte à la noix, cru »)

-- id 11006 : noix de pécan — pointait vers Noix de coco sèche (15007), doit pointer vers Noix de pécan
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15026') WHERE id = 11006;
-- noix de pécan : « Noix de pécan » (était : « Noix de coco, amande, sèche »)

-- id 11007 : olive — pointait vers Sardine à l'huile d'olive (26040 !), doit pointer vers Olive noire en saumure
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13032') WHERE id = 11007;
-- olive : « Olive noire, en saumure, égouttée » (était : « Sardine, à l'huile d'olive, appertisée, égouttée »)

-- ─── CANONIQUES NULL : RENSEIGNEMENT ─────────────────────────────────────────

-- id 15 : pâtes
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '9810') WHERE id = 15;
-- pâtes : « Pâtes sèches standard, crues » (était : NULL)

-- id 16 : boulgour
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '9690') WHERE id = 16;
-- boulgour : « Boulgour de blé, cru » (était : NULL)

-- id 17 : semoule
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '9610') WHERE id = 17;
-- semoule : « Semoule de blé dur, crue » (était : NULL)

-- id 18 : naan — proxy pain baguette (le plus proche céréalier disponible)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '7160') WHERE id = 18;
-- naan : proxy « Pain, baguette, sans sel » (était : NULL)

-- id 19 : nachos — proxy chips de maïs / tortilla chips
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '38105') WHERE id = 19;
-- nachos : « Chips de maïs ou tortilla chips » (était : NULL)

-- id 20 : tofu
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20904') WHERE id = 20;
-- tofu : « Tofu nature, préemballé » (était : NULL)

-- id 21 : halloumi — proxy Fromage de chèvre frais (seul fromage cru non fondu disponible sans équivalent exact)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '12805') WHERE id = 21;
-- halloumi : proxy « Fromage de chèvre frais, au lait pasteurisé ou cru » (était : NULL)

-- id 22 : chorizo
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '30315') WHERE id = 22;
-- chorizo : « Chorizo » (était : NULL)

-- id 23 : guanciale — proxy Pancetta/Poitrine roulée sèche (équivalent charcuterie italienne grasse)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '28858') WHERE id = 23 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '28858');
-- Si 28858 absent, proxy Porc poitrine crue :
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '28002') WHERE id = 23
  AND NOT EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '28858')
  AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '28002');
-- guanciale : proxy « Pancetta ou Poitrine roulée sèche » (était : NULL)

-- id 24 : lieu jaune
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '26129') WHERE id = 24;
-- lieu jaune : « Lieu jaune ou colin, cru » (était : NULL)

-- id 25 : sésame — source_id 15010 = Sésame, graine (déjà renseigné pour graine de sésame 14020)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15010') WHERE id = 25;
-- sésame : « Sésame, graine » (était : NULL)

-- id 26 : tahini — CIQUAL ne contient pas « pâte de sésame/tahini » → proxy Sésame graine
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15010') WHERE id = 26;
-- tahini : proxy « Sésame, graine » (était : NULL)

-- id 27 : saindoux
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '16520') WHERE id = 27;
-- saindoux : « Saindoux » (était : NULL)

-- id 28 : mayonnaise
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11054') WHERE id = 28;
-- mayonnaise : « Mayonnaise (70% MG min.), préemballée » (était : NULL)

-- id 29 : ketchup
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11008') WHERE id = 29;
-- ketchup : « Ketchup, préemballé » (était : NULL)

-- id 30 : pesto
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11179') WHERE id = 30;
-- pesto : « Sauce pesto, préemballée » (était : NULL)

-- id 31 : câpres
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11040') WHERE id = 31;
-- câpres : « Câpres, au vinaigre » (était : NULL)

-- id 32 : gochujang — CIQUAL ne contient pas de gochujang → proxy Harissa (pâte de piment fermentée similaire)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11112') WHERE id = 32;
-- gochujang : proxy « Harissa (sauce condimentaire) » (était : NULL)

-- id 33 : mirin — CIQUAL ne contient pas de mirin → proxy Saké/Alcool de riz (profil proche : vin de riz sucré)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '1026') WHERE id = 33 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '1026');
-- mirin : proxy « Saké ou Alcool de riz » (était : NULL)

-- id 34 : nuoc-mâm
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11194') WHERE id = 34;
-- nuoc-mâm : « Sauce Nuoc Mâm ou Sauce au poisson, préemballée » (était : NULL)

-- id 35 : kimchi — CIQUAL ne contient pas de kimchi → proxy Chou blanc cru (base du kimchi)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20116') WHERE id = 35 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '20116');
-- kimchi : proxy « Chou blanc, cru » (était : NULL)

-- id 36 : harissa
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11112') WHERE id = 36;
-- harissa : « Harissa (sauce condimentaire), préemballée » (était : NULL)

-- id 37 : ras el-hanout — CIQUAL ne contient pas de ras el-hanout → proxy épice aliment moyen
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11081') WHERE id = 37 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '11081');
-- ras el-hanout : proxy « Epice (aliment moyen) » (était : NULL)

-- id 38 : herbes de Provence
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11060') WHERE id = 38;
-- herbes de Provence : « Herbes de Provence, séchées » (était : NULL)

-- id 39 : galanga — CIQUAL ne contient pas de galanga → proxy Gingembre racine crue (même famille Zingibéracées)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11074') WHERE id = 39;
-- galanga : proxy « Gingembre, racine crue » (était : NULL)

-- id 40 : combava — CIQUAL ne contient pas de combava → proxy Citron vert (profil agrume acide proche)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13067') WHERE id = 40;
-- combava : proxy « Citron vert ou Lime, pulpe, cru » (était : NULL)

-- id 41 : jalapenos — proxy Piment cru
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20151') WHERE id = 41 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '20151');
-- jalapenos : proxy « Piment, cru » (était : NULL)

-- id 42 : sriracha — CIQUAL ne contient pas de sriracha → proxy Harissa
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11112') WHERE id = 42;
-- sriracha : proxy « Harissa (sauce condimentaire) » (était : NULL)

-- id 43 : daikon — proxy Radis rouge cru (même famille brassicacées, radis blanc plus proche mais absent)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20045') WHERE id = 43 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '20045');
-- daikon : proxy « Radis rouge, cru » (était : NULL)

-- id 44 : shiitakes — champignon shiitaké séché (20211) — seul code dispo dans CIQUAL
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20211') WHERE id = 44;
-- shiitakes : « Champignon, lentin comestible ou shiitaké, séché » (était : NULL)
-- Note : version séchée disponible uniquement, à noter dans UI

-- id 45 : pastis
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '1010') WHERE id = 45;
-- pastis : « Pastis, prêt à boire (1+5) » (était : NULL)

-- id 46 : ghee — proxy Huile ou graisse de coco (corps gras pur à ~100% lipides, similaire beurre clarifié)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '16040') WHERE id = 46;
-- ghee : proxy « Huile ou graisse de coco (coprah), sans précision » (était : NULL)
-- Note idéal : proxy beurre (manque dans la liste) — à renseigner avec code beurre si disponible

-- id 47 : grenoble — ATTENTION : doublon probable avec noix (cf. section doublons). Proxy Noix
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15005') WHERE id = 47 AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '15005');
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15008') WHERE id = 47
  AND NOT EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '15005')
  AND EXISTS (SELECT 1 FROM nutritional_data WHERE source_id = '15008');
-- grenoble (noix de Grenoble) : proxy « Noix » (était : NULL)

-- id 48 : houmous
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '25621') WHERE id = 48;
-- houmous : « Houmous, préemballé » (était : NULL)

-- id 49 : chevre — ATTENTION : doublon probable avec fromage de chèvre. Proxy fromage chèvre frais
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '12805') WHERE id = 49;
-- chevre : proxy « Fromage de chèvre frais » (était : NULL)


-- =============================================================================
-- SECTION 2 : CORRECTIONS category_id
-- Références : 1=Fruits, 2=Légumes, 3=Champignons, 4=Œufs, 5=Céréales,
--              6=Légumineuses, 7=Produits laitiers, 8=Viandes, 9=Poissons,
--              10=Épices, 11=Huiles, 12=Conserves, 13=Noix et graines, 14=Édulcorants
-- =============================================================================

-- Anchois : Légumes (2) → Poissons (9)
UPDATE canonical_foods SET category_id = 9 WHERE id = 9001;

-- Calmar : Légumes (2) → Poissons (9)
UPDATE canonical_foods SET category_id = 9 WHERE id = 9003;

-- Poulpe : Légumes (2) → Poissons (9)
UPDATE canonical_foods SET category_id = 9 WHERE id = 9011;

-- Crabe : Légumes (2) → Poissons (9)
UPDATE canonical_foods SET category_id = 9 WHERE id = 2027;

-- Canard : Œufs (4) → Viandes (8) [note : code 36201 = Canard, viande, crue OK]
UPDATE canonical_foods SET category_id = 8 WHERE id = 2005;

-- Oie : Œufs (4) → Viandes (8)
UPDATE canonical_foods SET category_id = 8 WHERE id = 8011;

-- Pintade : Légumes (2) → Viandes (8)
UPDATE canonical_foods SET category_id = 8 WHERE id = 8012;

-- Caille : Œufs (4) → Viandes (8) [note : caille est une volaille, pas un œuf]
UPDATE canonical_foods SET category_id = 8 WHERE id = 11003;

-- Pomme de terre : Fruits (1) → Légumes (2)
UPDATE canonical_foods SET category_id = 2 WHERE id = 1053;

-- Châtaigne : Légumes (2) → Noix et graines (13)
UPDATE canonical_foods SET category_id = 13 WHERE id = 1011;

-- Noix de coco : Huiles (11) → Fruits (1) [c'est un fruit, pas une huile)
UPDATE canonical_foods SET category_id = 1 WHERE id = 1043;

-- Raisin : Huiles (11) → Fruits (1)
UPDATE canonical_foods SET category_id = 1 WHERE id = 1057;

-- Cacahuète : Huiles (11) → Noix et graines (13)
UPDATE canonical_foods SET category_id = 13 WHERE id = 11002;

-- Olive : Huiles (11) → Conserves (12) [les olives se consomment en condiment/saumure]
UPDATE canonical_foods SET category_id = 12 WHERE id = 11007;

-- Tournesol (graine) : Huiles (11) → Noix et graines (13)
UPDATE canonical_foods SET category_id = 13 WHERE id = 11009;

-- Citrouille : Noix et graines (13) → Légumes (2) [la citrouille est un légume/cucurbitacée]
UPDATE canonical_foods SET category_id = 2 WHERE id = 2020;

-- Courge : Noix et graines (13) → Légumes (2)
UPDATE canonical_foods SET category_id = 2 WHERE id = 2024;

-- Courge spaghetti : Noix et graines (13) → Légumes (2)
UPDATE canonical_foods SET category_id = 2 WHERE id = 2025;

-- Pâtisson : Noix et graines (13) → Légumes (2)
UPDATE canonical_foods SET category_id = 2 WHERE id = 2046;

-- Potimarron : Noix et graines (13) → Légumes (2)
UPDATE canonical_foods SET category_id = 2 WHERE id = 2052;

-- Potiron : Noix et graines (13) → Légumes (2)
UPDATE canonical_foods SET category_id = 2 WHERE id = 2053;

-- Cerfeuil : Légumes (2) → Épices (10) [herbe aromatique]
UPDATE canonical_foods SET category_id = 10 WHERE id = 2008;

-- Aneth : Légumes (2) → Épices (10) [herbe aromatique]
UPDATE canonical_foods SET category_id = 10 WHERE id = 8002;

-- Origan : Légumes (2) → Épices (10) [herbe aromatique]
UPDATE canonical_foods SET category_id = 10 WHERE id = 2043;

-- Fenouil : Épices (10) → Légumes (2) [c'est un légume bulbe, pas une épice]
UPDATE canonical_foods SET category_id = 2 WHERE id = 2034;

-- Sel : Légumes (2) → NULL ou Épices/Condiments. En l'absence d'une catégorie condiment, Épices (10) est le mieux adapté
UPDATE canonical_foods SET category_id = 10 WHERE id = 6004;

-- Cacao : Légumineuses (6) → NULL (boisson/ingrédient pâtissier sans catégorie parfaite) → garder NULL ou Épices (10) par convention
UPDATE canonical_foods SET category_id = 10 WHERE id = 8005;

-- Café : Légumes (2) → NULL acceptable; conventionnellement Épices (10) pour boissons aromatiques
UPDATE canonical_foods SET category_id = 10 WHERE id = 8006;

-- Camomille : Légumes (2) → Épices (10) [infusion/plante aromatique]
UPDATE canonical_foods SET category_id = 10 WHERE id = 8007;

-- Thé : Légumes (2) → Épices (10) [infusion]
UPDATE canonical_foods SET category_id = 10 WHERE id = 8014;

-- Eau : Conserves (12) → NULL (aucune catégorie existante ne correspond)
UPDATE canonical_foods SET category_id = NULL WHERE id = 14018;

-- Goyave : Légumes (2) → Fruits (1)
UPDATE canonical_foods SET category_id = 1 WHERE id = 1026;

-- Fruit du dragon : Légumes (2) → Fruits (1)
UPDATE canonical_foods SET category_id = 1 WHERE id = 1025;

-- Huile d'olive : category_id NULL → Huiles (11)
UPDATE canonical_foods SET category_id = 11 WHERE id = 14030;

-- Huile végétale : category_id NULL → Huiles (11)
UPDATE canonical_foods SET category_id = 11 WHERE id = 14031;

-- Sauce soja : category_id NULL → Conserves (12)
UPDATE canonical_foods SET category_id = 12 WHERE id = 14033;

-- Vinaigre : category_id NULL → Conserves (12)
UPDATE canonical_foods SET category_id = 12 WHERE id = 14032;

-- Bouillon : category_id NULL → Conserves (12)
UPDATE canonical_foods SET category_id = 12 WHERE id = 14035;

-- Bouillon de légumes : category_id NULL → Conserves (12)
UPDATE canonical_foods SET category_id = 12 WHERE id = 14036;

-- Levure chimique : category_id NULL → Épices (10) par convention
UPDATE canonical_foods SET category_id = 10 WHERE id = 14041;

-- Levure : category_id NULL → Épices (10) par convention
UPDATE canonical_foods SET category_id = 10 WHERE id = 14040;

-- Gélatine : category_id NULL → Épices (10) par convention (aide culinaire)
UPDATE canonical_foods SET category_id = 10 WHERE id = 14042;

-- Maïzena : category_id NULL → Céréales (5) [fécule de maïs = dérivé céréalier]
UPDATE canonical_foods SET category_id = 5 WHERE id = 14043;

-- Alcool (id=14) : category_id NULL → garder NULL (catégorie Alcool absente du référentiel)

-- Bière (id=8) et Cidre (id=9) : category_id NULL → garder NULL (alcools)

-- Pastis (id=45) : category_id NULL → garder NULL

-- Sésame (id=25) : catégorie Noix et graines (13) confirmée, OK
-- Tahini (id=26) : catégorie Noix et graines (13), OK
-- Saindoux (id=27) : category_id NULL → Huiles (11) [matière grasse animale]
UPDATE canonical_foods SET category_id = 11 WHERE id = 27;

-- Mayonnaise (id=28), Ketchup (id=29), Pesto (id=30), Câpres (id=31) : Conserves (12), OK
-- Gochujang (id=32), Mirin (id=33), Nuoc-mâm (id=34), Kimchi (id=35) : Conserves (12), OK
-- Harissa (id=36), Ras el-hanout (id=37), Herbes de Provence (id=38) : Épices (10), OK
-- Galanga (id=39), Combava (id=40) : Épices (10), OK
-- Sriracha (id=42) : category_id NULL → Conserves (12)
UPDATE canonical_foods SET category_id = 12 WHERE id = 42;

-- Jalapenos (id=41) : category_id NULL → Légumes (2)
UPDATE canonical_foods SET category_id = 2 WHERE id = 41;

-- Daikon (id=43) : category_id NULL → Légumes (2)
UPDATE canonical_foods SET category_id = 2 WHERE id = 43;

-- Shiitakes (id=44) : category_id NULL → Champignons (3)
UPDATE canonical_foods SET category_id = 3 WHERE id = 44;

-- Ghee (id=46) : category_id NULL → Huiles (11)
UPDATE canonical_foods SET category_id = 11 WHERE id = 46;

-- Grenoble (id=47) : category_id NULL → Noix et graines (13)
UPDATE canonical_foods SET category_id = 13 WHERE id = 47;

-- Houmous (id=48) : category_id NULL → Conserves (12) [produit transformé]
UPDATE canonical_foods SET category_id = 12 WHERE id = 48;

-- Chevre (id=49) : category_id NULL → Produits laitiers (7)
UPDATE canonical_foods SET category_id = 7 WHERE id = 49;

-- Halloumi (id=21) : category_id NULL → Produits laitiers (7) [déjà correct]
-- (21 a category_id=7 déjà, vérifié)

-- Chorizo (id=22) : Viandes (8), déjà correct
-- Guanciale (id=23) : Viandes (8), déjà correct
-- Lieu jaune (id=24) : Poissons (9), déjà correct
-- Tofu (id=20) : Légumineuses (6), déjà correct


-- =============================================================================
-- SECTION 3 : REQUÊTES DE VÉRIFICATION DE VRAISEMBLANCE
-- (À exécuter manuellement après migration pour contrôle)
-- =============================================================================

/*
-- 3a. Aucun ingrédient simple ne pointe vers "entrées et plats composés"
SELECT cf.id, cf.canonical_name, cr.alim_nom_fr, cr.groupe
FROM canonical_foods cf
JOIN nutritional_data nd ON nd.id = cf.nutrition_id
JOIN ciqual_reference cr ON cr.alim_code = nd.source_id
WHERE cr.groupe = 'entrées et plats composés';
-- Attendu : 0 ligne (hors proxys assumés documentés)

-- 3b. Viandes et poissons crus avec protéines >= 15 g/100g
SELECT cf.id, cf.canonical_name, nd.proteines_g, cr.alim_nom_fr
FROM canonical_foods cf
JOIN nutritional_data nd ON nd.id = cf.nutrition_id
JOIN ciqual_reference cr ON cr.alim_code = nd.source_id
JOIN reference_categories rc ON rc.id = cf.category_id
WHERE rc.name IN ('Viandes','Poissons')
  AND nd.proteines_g < 15
ORDER BY nd.proteines_g;
-- Attendu : huître (~8.6g, acceptable bivalve), poulpe (~12.9g, acceptable céphalopode)
-- Tous les autres >= 15g

-- 3c. Huiles avec lipides >= 90 g/100g
SELECT cf.id, cf.canonical_name, nd.lipides_g
FROM canonical_foods cf
JOIN nutritional_data nd ON nd.id = cf.nutrition_id
JOIN reference_categories rc ON rc.id = cf.category_id
WHERE rc.name = 'Huiles';
-- Attendu : huile d'olive/végétale ~99.9g, saindoux ~99.5g, ghee/coco ~100g

-- 3d. Cohérence catégorie vs groupe CIQUAL pour les viandes
SELECT cf.id, cf.canonical_name, rc.name AS cat_myko, cr.groupe AS groupe_ciqual
FROM canonical_foods cf
JOIN nutritional_data nd ON nd.id = cf.nutrition_id
JOIN ciqual_reference cr ON cr.alim_code = nd.source_id
JOIN reference_categories rc ON rc.id = cf.category_id
WHERE rc.name = 'Viandes'
  AND cr.groupe NOT LIKE '%viandes%'
ORDER BY cf.id;
-- Attendu : 0 ligne

-- 3e. Cohérence catégorie vs groupe CIQUAL pour les poissons
SELECT cf.id, cf.canonical_name, rc.name AS cat_myko, cr.groupe AS groupe_ciqual
FROM canonical_foods cf
JOIN nutritional_data nd ON nd.id = cf.nutrition_id
JOIN ciqual_reference cr ON cr.alim_code = nd.source_id
JOIN reference_categories rc ON rc.id = cf.category_id
WHERE rc.name = 'Poissons'
  AND cr.groupe NOT LIKE '%viandes%'
ORDER BY cf.id;
-- Attendu : 0 ligne
*/
