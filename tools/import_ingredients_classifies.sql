-- ================================================================
-- Script d'importation des ingrédients classifiés
-- Basé sur INGREDIENTS_CLASSIFIES.csv et RECETTES_PROPRES.csv
-- ================================================================
-- 
-- Ce script va simplement :
-- 1. Créer les canonical_foods manquants avec leurs catégories et sous-catégories appropriées
--
-- Note : Pas de création d'archetypes ou de products
-- Les produits n'existent que dans leur catégorie via canonical_foods
-- ================================================================

BEGIN;

-- ================================================================
-- PARTIE 1 : MAPPING DES INGRÉDIENTS -> CATÉGORIES + SOUS-CATÉGORIES
-- ================================================================

-- Tableau temporaire pour le mapping complet
CREATE TEMP TABLE ingredient_mapping (
    ingredient_name TEXT PRIMARY KEY,
    category_name TEXT NOT NULL,
    subcategory_code TEXT NOT NULL,
    primary_unit TEXT DEFAULT 'g',
    density_g_per_ml NUMERIC,
    unit_weight_grams NUMERIC
);

-- FRUITS (Catégorie ID 1)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('pomme', 'Fruits', 'canonical'),
('banane', 'Fruits', 'canonical'),
('citron', 'Fruits', 'canonical'),
('orange', 'Fruits', 'canonical'),
('mangue', 'Fruits', 'canonical'),
('fraise', 'Fruits', 'canonical'),
('framboise', 'Fruits', 'canonical'),
('fruit rouge', 'Fruits', 'cultivar'),
('ananas', 'Fruits', 'canonical'),
('poire', 'Fruits', 'canonical'),
('pêche', 'Fruits', 'canonical'),
('cerise', 'Fruits', 'canonical'),
('myrtille', 'Fruits', 'canonical'),
('raisin', 'Fruits', 'canonical'),
('raisin sec', 'Fruits', 'archétype'),
('pruneau', 'Fruits', 'canonical'),
('abricot', 'Fruits', 'canonical'),
('figue', 'Fruits', 'canonical'),
('figue fraîche', 'Fruits', 'canonical'),
('datte', 'Fruits', 'canonical'),
('fruit de la passion', 'Fruits', 'canonical'),
('fruit confit', 'Fruits', 'canonical'),
('avocat', 'Fruits', 'canonical'),
('avocat mûr', 'Fruits', 'canonical'),
('citron vert', 'Fruits', 'canonical'),
('jus de citron', 'Fruits', 'archétype'),
('jus de citron vert', 'Fruits', 'archétype'),
('jus citron', 'Fruits', 'canonical'),
('jus citron vert', 'Fruits', 'cultivar'),
('jus d''orange', 'Fruits', 'canonical'),
('raisin blanc', 'Fruits', 'cultivar'),
('plantain vert', 'Fruits', 'cultivar');

-- LÉGUMES (Catégorie ID 2)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('tomate', 'Légumes', 'canonical'),
('tomate cerise', 'Légumes', 'cultivar'),
('carotte', 'Légumes', 'canonical'),
('oignon', 'Légumes', 'canonical'),
('oignon rouge', 'Légumes', 'canonical'),
('oignon vert', 'Légumes', 'canonical'),
('oignon nouveu', 'Légumes', 'canonical'),
('ail', 'Légumes', 'canonical'),
('ail (facultatif)', 'Légumes', 'canonical'),
('poireau', 'Légumes', 'canonical'),
('blanc de poireau', 'Légumes', 'cultivar'),
('pomme de terre', 'Légumes', 'canonical'),
('courgette', 'Légumes', 'canonical'),
('aubergine', 'Légumes', 'canonical'),
('poivron', 'Légumes', 'canonical'),
('poivron rouge', 'Légumes', 'canonical'),
('poivron jaune', 'Légumes', 'canonical'),
('épinard', 'Légumes', 'canonical'),
('épinard frais', 'Légumes', 'canonical'),
('brocoli', 'Légumes', 'canonical'),
('chou-fleur', 'Légumes', 'canonical'),
('chou blanc', 'Légumes', 'cultivar'),
('chou vert', 'Légumes', 'cultivar'),
('chou', 'Légumes', 'canonical'),
('chou noir', 'Légumes', 'cultivar'),
('chou de bruxelle', 'Légumes', 'canonical'),
('céleri', 'Légumes', 'canonical'),
('céleri-rave', 'Légumes', 'canonical'),
('céleri rave', 'Légumes', 'canonical'),
('branche de céleri', 'Légumes', 'canonical'),
('céleri branche', 'Légumes', 'canonical'),
('navet', 'Légumes', 'canonical'),
('concombre', 'Légumes', 'canonical'),
('salade', 'Légumes', 'canonical'),
('salade verte', 'Légumes', 'cultivar'),
('salade mélangée', 'Légumes', 'canonical'),
('salade frisée', 'Légumes', 'canonical'),
('laitue romaine', 'Légumes', 'canonical'),
('piment', 'Légumes', 'archétype'),
('piment cayenne', 'Légumes', 'canonical'),
('piment de cayenne', 'Légumes', 'archétype'),
('piment d''espelette', 'Légumes', 'canonical'),
('piment aji', 'Légumes', 'canonical'),
('piment aji amarillo', 'Légumes', 'canonical'),
('piment poblano', 'Légumes', 'canonical'),
('pimiento de padrón', 'Légumes', 'canonical'),
('échalote', 'Légumes', 'canonical'),
('gingembre', 'Légumes', 'canonical'),
('petit pois', 'Légumes', 'canonical'),
('haricot vert', 'Légumes', 'canonical'),
('petit oignon', 'Légumes', 'canonical'),
('petit oignon blanc', 'Légumes', 'cultivar'),
('petit oignon grelot', 'Légumes', 'canonical'),
('fenouil', 'Légumes', 'canonical'),
('potimarron', 'Légumes', 'canonical'),
('potiron', 'Légumes', 'canonical'),
('courge', 'Légumes', 'canonical'),
('patate douce', 'Légumes', 'canonical'),
('betterave', 'Légumes', 'canonical'),
('radis', 'Légumes', 'canonical'),
('panais', 'Légumes', 'canonical'),
('rutabaga', 'Légumes', 'canonical'),
('topinambour', 'Légumes', 'canonical'),
('asperge', 'Légumes', 'canonical'),
('asperge verte', 'Légumes', 'cultivar'),
('endive', 'Légumes', 'canonical'),
('cresson', 'Légumes', 'canonical'),
('oseille', 'Légumes', 'canonical'),
('blette', 'Légumes', 'canonical'),
('artichaut violet', 'Légumes', 'canonical'),
('pousse de soja', 'Légumes', 'canonical'),
('pousse soja', 'Légumes', 'canonical'),
('salsifi', 'Légumes', 'canonical'),
('yuca', 'Légumes', 'canonical'),
('hominy', 'Légumes', 'canonical'),
('maïs', 'Légumes', 'canonical'),
('pois mange-tout', 'Légumes', 'canonical');

-- CHAMPIGNONS (Catégorie ID 3)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('champignon', 'Champignons', 'canonical'),
('champignon de Paris', 'Champignons', 'canonical'),
('champignon paris', 'Champignons', 'canonical'),
('champignon noir', 'Champignons', 'cultivar'),
('cèpe', 'Champignons', 'canonical'),
('morille', 'Champignons', 'canonical');

-- ŒUFS (Catégorie ID 4)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('œuf', 'Œufs', 'canonical'),
('jaune d''œuf', 'Œufs', 'archétype'),
('blanc d''œuf', 'Œufs', 'archétype'),
('œuf century', 'Œufs', 'canonical');

-- CÉRÉALES (Catégorie ID 5)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('riz', 'Céréales', 'canonical'),
('riz Arborio', 'Céréales', 'canonical'),
('riz basmati', 'Céréales', 'cultivar'),
('riz bomba', 'Céréales', 'cultivar'),
('riz gluant', 'Céréales', 'cultivar'),
('riz japonais', 'Céréales', 'canonical'),
('riz à sushi', 'Céréales', 'cultivar'),
('farine', 'Céréales', 'archétype'),
('farine t65', 'Céréales', 'archétype'),
('farine t45', 'Céréales', 'archétype'),
('farine complète', 'Céréales', 'archétype'),
('farine de sarrasin', 'Céréales', 'archétype'),
('farine manitoba', 'Céréales', 'archétype'),
('farine de riz gluant', 'Céréales', 'archétype'),
('farine maïs', 'Céréales', 'archétype'),
('farine maïs précuite', 'Céréales', 'archétype'),
('farine de pois chiche', 'Céréales', 'archétype'),
('farine pois chiche', 'Céréales', 'archétype'),
('farine teff', 'Céréales', 'archétype'),
('flocon d''avoine', 'Céréales', 'archétype'),
('flocon avoine', 'Céréales', 'canonical'),
('pain', 'Céréales', 'archétype'),
('pain de campagne', 'Céréales', 'archétype'),
('pain rassi', 'Céréales', 'canonical'),
('baguette', 'Céréales', 'archétype'),
('pain burger', 'Céréales', 'archétype'),
('brioche', 'Céréales', 'archétype'),
('pita', 'Céréales', 'canonical'),
('hot-dog', 'Céréales', 'canonical'),
('muffin anglais', 'Céréales', 'canonical'),
('galette chinoise', 'Céréales', 'canonical'),
('tortilla', 'Céréales', 'canonical'),
('chapelure', 'Céréales', 'archétype'),
('chapelure panko', 'Céréales', 'archétype'),
('panko', 'Céréales', 'archétype'),
('semoule', 'Céréales', 'archétype'),
('polenta', 'Céréales', 'archétype'),
('quinoa', 'Céréales', 'canonical'),
('blé', 'Céréales', 'canonical'),
('sarrasin', 'Céréales', 'canonical'),
('crozet', 'Céréales', 'canonical'),
('boulghour', 'Céréales', 'canonical'),
('masa harina', 'Céréales', 'canonical'),
('biscuit', 'Céréales', 'archétype'),
('biscuit graham', 'Céréales', 'canonical'),
('biscuit digestive', 'Céréales', 'canonical'),
('biscuit sec', 'Céréales', 'archétype'),
('amaretti', 'Céréales', 'canonical'),
('sablée biscuit graham', 'Céréales', 'canonical'),
('sablée', 'Céréales', 'canonical');

-- LÉGUMINEUSES (Catégorie ID 6)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('pois chiche', 'Légumineuses', 'canonical'),
('pois chiche sec', 'Légumineuses', 'archétype'),
('haricot blanc', 'Légumineuses', 'canonical'),
('haricot blanc sec', 'Légumineuses', 'archétype'),
('haricot rouge', 'Légumineuses', 'canonical'),
('haricot noir', 'Légumineuses', 'canonical'),
('lentille', 'Légumineuses', 'canonical'),
('lentille corail', 'Légumineuses', 'canonical'),
('lentille verte', 'Légumineuses', 'canonical'),
('lentille verte berry', 'Légumineuses', 'cultivar'),
('fève fraîche', 'Légumineuses', 'canonical'),
('fève sèche', 'Légumineuses', 'canonical'),
('garrofó', 'Légumineuses', 'canonical'),
('pâte de haricot rouge', 'Légumineuses', 'archétype'),
('haricot blanc sauce tomate', 'Légumineuses', 'archétype');

-- PRODUITS LAITIERS (Catégorie ID 7)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('lait', 'Produits laitiers', 'canonical'),
('lait entier', 'Produits laitiers', 'canonical'),
('lait végétal', 'Produits laitiers', 'canonical'),
('lait de coco', 'Produits laitiers', 'archétype'),
('lait coco', 'Produits laitiers', 'canonical'),
('lait concentré sucré', 'Produits laitiers', 'archétype'),
('crème liquide', 'Produits laitiers', 'archétype'),
('crème fraîche', 'Produits laitiers', 'archétype'),
('crème fraîche épaisse', 'Produits laitiers', 'archétype'),
('beurre', 'Produits laitiers', 'archétype'),
('beurre salé', 'Produits laitiers', 'archétype'),
('beurre demi-sel', 'Produits laitiers', 'archétype'),
('yaourt', 'Produits laitiers', 'archétype'),
('yaourt grec', 'Produits laitiers', 'archétype'),
('yaourt nature', 'Produits laitiers', 'archétype'),
('fromage blanc', 'Produits laitiers', 'archétype'),
('fromage frais', 'Produits laitiers', 'archétype'),
('fromage de chèvre', 'Produits laitiers', 'archétype'),
('chèvre frais', 'Produits laitiers', 'canonical'),
('feta', 'Produits laitiers', 'archétype'),
('mozzarella', 'Produits laitiers', 'archétype'),
('parmesan', 'Produits laitiers', 'archétype'),
('gruyère', 'Produits laitiers', 'archétype'),
('comté', 'Produits laitiers', 'archétype'),
('cheddar', 'Produits laitiers', 'archétype'),
('beaufort', 'Produits laitiers', 'canonical'),
('maroille', 'Produits laitiers', 'canonical'),
('pecorino romano', 'Produits laitiers', 'archétype'),
('pecorino', 'Produits laitiers', 'archétype'),
('ricotta', 'Produits laitiers', 'archétype'),
('ricotta salata', 'Produits laitiers', 'canonical'),
('mascarpone', 'Produits laitiers', 'archétype'),
('cream cheese', 'Produits laitiers', 'archétype'),
('st môret', 'Produits laitiers', 'canonical'),
('paneer', 'Produits laitiers', 'canonical'),
('fromage mina', 'Produits laitiers', 'archétype'),
('tomme fraîche', 'Produits laitiers', 'canonical'),
('tomme fraîche cantal', 'Produits laitiers', 'canonical'),
('tranche d''emmental', 'Produits laitiers', 'canonical'),
('tzatziki', 'Produits laitiers', 'canonical'),
('kéfir', 'Produits laitiers', 'canonical'),
('babeurre', 'Produits laitiers', 'archétype'),
('glace vanille', 'Produits laitiers', 'canonical'),
('glace chocolat', 'Produits laitiers', 'canonical'),
('glace fraise', 'Produits laitiers', 'canonical');

-- VIANDES (Catégorie ID 8)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('bœuf', 'Viandes', 'canonical'),
('bœuf haché', 'Viandes', 'archétype'),
('steak de bœuf', 'Viandes', 'archétype'),
('entrecôte', 'Viandes', 'archétype'),
('entrecôte de bœuf', 'Viandes', 'archétype'),
('bavette', 'Viandes', 'archétype'),
('bavette de bœuf', 'Viandes', 'canonical'),
('filet de bœuf', 'Viandes', 'archétype'),
('faux-filet', 'Viandes', 'archétype'),
('rumsteck', 'Viandes', 'archétype'),
('côte de bœuf', 'Viandes', 'archétype'),
('paleron de bœuf', 'Viandes', 'canonical'),
('pavé de bœuf', 'Viandes', 'archétype'),
('araignée de bœuf', 'Viandes', 'canonical'),
('poire de bœuf', 'Viandes', 'canonical'),
('steak', 'Viandes', 'archétype'),
('chateaubriand', 'Viandes', 'canonical'),
('tournedo', 'Viandes', 'canonical'),
('porc', 'Viandes', 'canonical'),
('porc haché', 'Viandes', 'archétype'),
('rôti de porc', 'Viandes', 'archétype'),
('échine de porc', 'Viandes', 'canonical'),
('escalope de porc', 'Viandes', 'archétype'),
('filet mignon porc', 'Viandes', 'archétype'),
('côte de porc', 'Viandes', 'archétype'),
('traver de porc', 'Viandes', 'canonical'),
('poitrine de porc', 'Viandes', 'canonical'),
('poitrine porc', 'Viandes', 'canonical'),
('foie porc', 'Viandes', 'canonical'),
('veau', 'Viandes', 'canonical'),
('veau haché', 'Viandes', 'archétype'),
('escalope de veau', 'Viandes', 'archétype'),
('côte de veau', 'Viandes', 'archétype'),
('filet de veau', 'Viandes', 'archétype'),
('grenadin veau', 'Viandes', 'canonical'),
('veau pour blanquette', 'Viandes', 'canonical'),
('jarret de veau', 'Viandes', 'canonical'),
('rôti de veau sous-noix', 'Viandes', 'archétype'),
('rôti de veau', 'Viandes', 'archétype'),
('sauté de veau', 'Viandes', 'canonical'),
('paupiette de veau', 'Viandes', 'canonical'),
('os veau', 'Viandes', 'canonical'),
('agneau', 'Viandes', 'canonical'),
('agneau haché', 'Viandes', 'archétype'),
('gigot d''agneau', 'Viandes', 'archétype'),
('épaule d''agneau', 'Viandes', 'archétype'),
('épaule agneau', 'Viandes', 'archétype'),
('côtelette d''agneau', 'Viandes', 'archétype'),
('côtelette agneau', 'Viandes', 'archétype'),
('carré agneau', 'Viandes', 'archétype'),
('filet d''agneau', 'Viandes', 'archétype'),
('poulet', 'Viandes', 'canonical'),
('poulet haché', 'Viandes', 'archétype'),
('blanc de poulet', 'Viandes', 'archétype'),
('escalope de poulet', 'Viandes', 'archétype'),
('poule', 'Viandes', 'canonical'),
('carcasse volaille', 'Viandes', 'canonical'),
('canard', 'Viandes', 'canonical'),
('magret de canard', 'Viandes', 'archétype'),
('magret canard', 'Viandes', 'archétype'),
('confit de canard', 'Viandes', 'canonical'),
('confit canard', 'Viandes', 'canonical'),
('lapin', 'Viandes', 'canonical'),
('jambon', 'Viandes', 'archétype'),
('jambon serrano', 'Viandes', 'archétype'),
('jambon ibérique', 'Viandes', 'archétype'),
('jambon cru', 'Viandes', 'archétype'),
('jambon blanc', 'Viandes', 'archétype'),
('jambon à l''os', 'Viandes', 'archétype'),
('lardon', 'Viandes', 'archétype'),
('lardon fumé', 'Viandes', 'archétype'),
('lardon végétal', 'Viandes', 'archétype'),
('lard', 'Viandes', 'archétype'),
('poitrine fumée', 'Viandes', 'canonical'),
('bacon', 'Viandes', 'archétype'),
('tranche de bacon', 'Viandes', 'archétype'),
('chorizo', 'Viandes', 'archétype'),
('saucisse porc', 'Viandes', 'archétype'),
('saucisse de toulouse', 'Viandes', 'archétype'),
('saucisse fumée', 'Viandes', 'archétype'),
('saucisson de lyon pistaché', 'Viandes', 'canonical'),
('andouillette de troye', 'Viandes', 'canonical'),
('boudin noir', 'Viandes', 'archétype'),
('diot', 'Viandes', 'canonical'),
('chair à saucisse', 'Viandes', 'archétype'),
('chair saucisse', 'Viandes', 'archétype'),
('guanciale', 'Viandes', 'canonical'),
('foie gras', 'Viandes', 'canonical'),
('foie', 'Viandes', 'canonical'),
('mouton', 'Viandes', 'canonical'),
('tripe', 'Viandes', 'canonical'),
('chevreuil', 'Viandes', 'canonical'),
('sanglier', 'Viandes', 'canonical'),
('lièvre', 'Viandes', 'canonical'),
('cerf', 'Viandes', 'canonical'),
('faisan', 'Viandes', 'canonical'),
('bécasse', 'Viandes', 'canonical');

-- POISSONS ET FRUITS DE MER (Catégorie ID 9)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('saumon', 'Poissons', 'canonical'),
('saumon fumé', 'Poissons', 'archétype'),
('saumon frais', 'Poissons', 'canonical'),
('pavé de saumon', 'Poissons', 'archétype'),
('thon', 'Poissons', 'canonical'),
('thon frais', 'Poissons', 'canonical'),
('thon rouge', 'Poissons', 'cultivar'),
('thon au naturel', 'Poissons', 'canonical'),
('thon au naturel en conserve', 'Poissons', 'canonical'),
('steak de thon', 'Poissons', 'archétype'),
('morue dessalée', 'Poissons', 'canonical'),
('cabillaud', 'Poissons', 'canonical'),
('dorade', 'Poissons', 'canonical'),
('sole', 'Poissons', 'canonical'),
('aile de raie', 'Poissons', 'canonical'),
('maquereau', 'Poissons', 'canonical'),
('sardine', 'Poissons', 'canonical'),
('lotte', 'Poissons', 'canonical'),
('anguille', 'Poissons', 'canonical'),
('lamproie', 'Poissons', 'canonical'),
('anchois', 'Poissons', 'canonical'),
('filet anchois', 'Poissons', 'archétype'),
('crevette', 'Poissons', 'canonical'),
('moule', 'Poissons', 'canonical'),
('noix saint-jacque', 'Poissons', 'canonical'),
('saint-jacque', 'Poissons', 'canonical'),
('calamar', 'Poissons', 'canonical'),
('encornet', 'Poissons', 'canonical'),
('seiche', 'Poissons', 'canonical'),
('poulpe', 'Poissons', 'canonical'),
('palourde', 'Poissons', 'canonical'),
('escargot', 'Poissons', 'canonical'),
('homard', 'Poissons', 'canonical'),
('langoustine', 'Poissons', 'canonical'),
('crabe', 'Poissons', 'canonical'),
('écrevisse', 'Poissons', 'canonical'),
('grenouille', 'Poissons', 'canonical'),
('quenelle brochet', 'Poissons', 'canonical'),
('gâteau de poisson', 'Poissons', 'canonical');

-- ÉPICES ET AROMATES (Catégorie ID 10)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('sel', 'Épices', 'canonical'),
('gros sel', 'Épices', 'canonical'),
('fleur de sel', 'Épices', 'canonical'),
('poivre', 'Épices', 'archétype'),
('poivre blanc', 'Épices', 'cultivar'),
('poivre noir', 'Épices', 'cultivar'),
('poivre vert', 'Épices', 'cultivar'),
('poivre en grain', 'Épices', 'canonical'),
('poivrelu', 'Épices', 'canonical'),
('muscade', 'Épices', 'archétype'),
('cumin', 'Épices', 'archétype'),
('curry', 'Épices', 'archétype'),
('curcuma', 'Épices', 'archétype'),
('paprika', 'Épices', 'archétype'),
('paprika fumé', 'Épices', 'canonical'),
('paprika doux', 'Épices', 'canonical'),
('cannelle', 'Épices', 'archétype'),
('vanille', 'Épices', 'canonical'),
('vanille liquide', 'Épices', 'canonical'),
('origan', 'Épices', 'canonical'),
('origan séché', 'Épices', 'archétype'),
('basilic', 'Épices', 'canonical'),
('basilic frais', 'Épices', 'canonical'),
('thym', 'Épices', 'canonical'),
('thym frais', 'Épices', 'canonical'),
('branche de thym', 'Épices', 'canonical'),
('brin de thym', 'Épices', 'canonical'),
('romarin', 'Épices', 'canonical'),
('laurier', 'Épices', 'canonical'),
('feuille de laurier', 'Épices', 'canonical'),
('persil', 'Épices', 'canonical'),
('persil frais', 'Épices', 'canonical'),
('coriandre', 'Épices', 'canonical'),
('coriandre fraîche', 'Épices', 'canonical'),
('coriandrelue', 'Épices', 'canonical'),
('menthe', 'Épices', 'canonical'),
('menthe fraîche', 'Épices', 'canonical'),
('aneth', 'Épices', 'canonical'),
('aneth frais', 'Épices', 'canonical'),
('ciboulette', 'Épices', 'canonical'),
('sauge', 'Épices', 'canonical'),
('sauge fraîche', 'Épices', 'canonical'),
('estragon', 'Épices', 'canonical'),
('estragon frais', 'Épices', 'canonical'),
('cive', 'Épices', 'canonical'),
('herbes de provence', 'Épices', 'canonical'),
('herbes italienne', 'Épices', 'canonical'),
('bouquet garni', 'Épices', 'canonical'),
('garni', 'Épices', 'canonical'),
('quatre-épices', 'Épices', 'canonical'),
('cinq épices', 'Épices', 'canonical'),
('garam masala', 'Épices', 'archétype'),
('berbéré épices', 'Épices', 'canonical'),
('épices speculoo', 'Épices', 'canonical'),
('épices pain épices', 'Épices', 'canonical'),
('girofle', 'Épices', 'archétype'),
('clou de girofle', 'Épices', 'canonical'),
('safran', 'Épices', 'archétype'),
('vert', 'Épices', 'cultivar'),
('rouge', 'Épices', 'cultivar'),
('dur', 'Épices', 'canonical'),
('nature', 'Épices', 'canonical'),
('graine', 'Épices', 'canonical'),
('cayenne', 'Épices', 'archétype'),
('citronnelle', 'Épices', 'canonical'),
('fenugrec', 'Épices', 'canonical'),
('zaatar', 'Épices', 'canonical'),
('sumac', 'Épices', 'canonical'),
('ani', 'Épices', 'canonical');

-- HUILES ET MATIÈRES GRASSES (Catégorie ID 11)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('huile d''olive', 'Huiles', 'archétype'),
('huile olive', 'Huiles', 'archétype'),
('huile végétale', 'Huiles', 'archétype'),
('huile de coco', 'Huiles', 'archétype'),
('huile de sésame', 'Huiles', 'archétype'),
('huile sésame', 'Huiles', 'archétype'),
('huile neutre', 'Huiles', 'archétype'),
('huile deure', 'Huiles', 'archétype'),
('huile piment', 'Huiles', 'archétype'),
('saindoux', 'Huiles', 'canonical');

-- CONSERVES ET SAUCES (Catégorie ID 12)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('concentré de tomate', 'Conserves', 'archétype'),
('sauce tomate', 'Conserves', 'archétype'),
('coulis de tomate', 'Conserves', 'archétype'),
('sauce soja', 'Conserves', 'archétype'),
('sauce soja claire', 'Conserves', 'archétype'),
('sauce soja foncée', 'Conserves', 'archétype'),
('sauce d''huître', 'Conserves', 'archétype'),
('sauce huître', 'Conserves', 'archétype'),
('sauce huître végétale', 'Conserves', 'archétype'),
('sauce poisson', 'Conserves', 'archétype'),
('nuoc mam', 'Conserves', 'archétype'),
('nuoc-mâm', 'Conserves', 'canonical'),
('sauce hoisin', 'Conserves', 'archétype'),
('sauce tonkatsu', 'Conserves', 'archétype'),
('sauce barbecue', 'Conserves', 'archétype'),
('sauce béchamel', 'Conserves', 'archétype'),
('sauce bolognaise', 'Conserves', 'archétype'),
('sauce nantua', 'Conserves', 'archétype'),
('sauce césar', 'Conserves', 'archétype'),
('sauce yakisoba', 'Conserves', 'archétype'),
('moutarde', 'Conserves', 'archétype'),
('moutarde de dijon', 'Conserves', 'canonical'),
('ketchup', 'Conserves', 'archétype'),
('mayonnaise', 'Conserves', 'archétype'),
('pesto', 'Conserves', 'archétype'),
('houmous', 'Conserves', 'archétype'),
('tahini', 'Conserves', 'archétype'),
('aïoli', 'Conserves', 'archétype'),
('gochujang', 'Conserves', 'archétype'),
('sambal oelek', 'Conserves', 'archétype'),
('kecap mani', 'Conserves', 'canonical'),
('pâte laksa', 'Conserves', 'archétype'),
('pâte piment', 'Conserves', 'archétype'),
('pâte sésame', 'Conserves', 'archétype'),
('pâte achiote', 'Conserves', 'archétype'),
('pâte arachide', 'Conserves', 'archétype'),
('vinaigre', 'Conserves', 'archétype'),
('vinaigre blanc', 'Conserves', 'archétype'),
('vinaigre de riz', 'Conserves', 'archétype'),
('vinaigre de cidre', 'Conserves', 'archétype'),
('vinaigre balsamique', 'Conserves', 'archétype'),
('vinaigre de xérè', 'Conserves', 'archétype'),
('vinaigre à l''estragon', 'Conserves', 'archétype'),
('vinaigre noir', 'Conserves', 'archétype'),
('choucroute', 'Conserves', 'canonical'),
('kimchi', 'Conserves', 'canonical'),
('olive', 'Conserves', 'archétype'),
('olive noire', 'Conserves', 'archétype'),
('olive verte', 'Conserves', 'archétype'),
('câpre', 'Conserves', 'canonical'),
('cornichon', 'Conserves', 'canonical'),
('falafel', 'Conserves', 'canonical'),
('chip de maïs', 'Conserves', 'canonical'),
('coleslaw', 'Conserves', 'canonical'),
('confiture abricot', 'Conserves', 'canonical'),
('confiture framboise', 'Conserves', 'canonical');

-- NOIX ET GRAINES (Catégorie ID 13)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('noix', 'Noix et graines', 'canonical'),
('cerneau de noix', 'Noix et graines', 'canonical'),
('noix de pécan', 'Noix et graines', 'canonical'),
('noix pécan', 'Noix et graines', 'canonical'),
('noisette', 'Noix et graines', 'canonical'),
('amande', 'Noix et graines', 'canonical'),
('poudre d''amande', 'Noix et graines', 'archétype'),
('cacahuète', 'Noix et graines', 'canonical'),
('beurre cacahuète', 'Noix et graines', 'archétype'),
('pignon de pin', 'Noix et graines', 'canonical'),
('pignon', 'Noix et graines', 'canonical'),
('graine de chia', 'Noix et graines', 'canonical'),
('graine de sésame', 'Noix et graines', 'canonical'),
('graine sésame', 'Noix et graines', 'canonical'),
('pistache', 'Noix et graines', 'canonical'),
('noix cajou', 'Noix et graines', 'canonical'),
('noix de cocoe', 'Noix et graines', 'canonical'),
('châtaigne', 'Noix et graines', 'canonical'),
('marron', 'Noix et graines', 'canonical');

-- ÉDULCORANTS (Catégorie ID 14)
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('sucre', 'Édulcorants', 'archétype'),
('sucre glace', 'Édulcorants', 'archétype'),
('cassonade', 'Édulcorants', 'archétype'),
('miel', 'Édulcorants', 'canonical'),
('sirop d''érable', 'Édulcorants', 'archétype'),
('sirop érable', 'Édulcorants', 'archétype'),
('sirop d''agave', 'Édulcorants', 'archétype'),
('sirop sucre', 'Édulcorants', 'archétype'),
('sirop maïs', 'Édulcorants', 'archétype'),
('sirop doré', 'Édulcorants', 'archétype');

-- PÂTES ET NOUILLES
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('pâte', 'Céréales', 'archétype'),
('pâte feuilletée', 'Céréales', 'archétype'),
('pâte brisée', 'Céréales', 'archétype'),
('pâte courte', 'Céréales', 'archétype'),
('feuilletée', 'Céréales', 'canonical'),
('brisée', 'Céréales', 'canonical'),
('phyllo', 'Céréales', 'archétype'),
('pâte phyllo', 'Céréales', 'archétype'),
('feuille de brick', 'Céréales', 'canonical'),
('galette de riz', 'Céréales', 'canonical'),
('gâteau de riz', 'Céréales', 'canonical'),
('spaghetti', 'Céréales', 'archétype'),
('penne', 'Céréales', 'archétype'),
('tagliatelle', 'Céréales', 'archétype'),
('linguine', 'Céréales', 'archétype'),
('lasagne', 'Céréales', 'archétype'),
('tonnarelli', 'Céréales', 'canonical'),
('trofie', 'Céréales', 'canonical'),
('orecchiette', 'Céréales', 'canonical'),
('macaroni', 'Céréales', 'canonical'),
('gnocchi', 'Céréales', 'canonical'),
('ravioli frais', 'Céréales', 'canonical'),
('cannelloni', 'Céréales', 'canonical'),
('vermicelle de riz', 'Céréales', 'archétype'),
('nouille de riz', 'Céréales', 'canonical'),
('nouille', 'Céréales', 'archétype'),
('nouille ramen', 'Céréales', 'canonical'),
('nouille udon', 'Céréales', 'archétype'),
('nouille soba', 'Céréales', 'archétype'),
('nouille chinoise', 'Céréales', 'canonical'),
('nouille patate douce', 'Céréales', 'canonical'),
('fideo', 'Céréales', 'canonical');

-- AUTRES INGRÉDIENTS DIVERS
INSERT INTO ingredient_category_mapping (ingredient_name, category_name, classification) VALUES
('levure', 'Céréales', 'archétype'),
('levure chimique', 'Céréales', 'archétype'),
('levure boulanger', 'Céréales', 'canonical'),
('levure de boulanger', 'Céréales', 'archétype'),
('levure de bière fraîche', 'Céréales', 'canonical'),
('levure boulanger fraîche', 'Céréales', 'canonical'),
('levure nutritionnelle', 'Céréales', 'canonical'),
('bicarbonate', 'Céréales', 'archétype'),
('gélatine', 'Produits laitiers', 'archétype'),
('agar-agar', 'Produits laitiers', 'canonical'),
('maïzena', 'Céréales', 'archétype'),
('fécule de maïs', 'Céréales', 'archétype'),
('fécule maïs', 'Céréales', 'canonical'),
('fécule', 'Céréales', 'archétype'),
('fécule manioc', 'Céréales', 'canonical'),
('chocolat', 'Édulcorants', 'archétype'),
('chocolat noir', 'Édulcorants', 'archétype'),
('pépite de chocolat', 'Édulcorants', 'canonical'),
('pépite chocolat', 'Édulcorants', 'canonical'),
('cacao', 'Édulcorants', 'canonical'),
('caramel', 'Édulcorants', 'canonical'),
('caramel beurre salé', 'Édulcorants', 'archétype'),
('dulce de leche', 'Édulcorants', 'canonical'),
('nougat', 'Édulcorants', 'canonical'),
('eau', 'Conserves', 'canonical'),
('eau de fleur d''oranger', 'Conserves', 'canonical'),
('bouillon', 'Conserves', 'archétype'),
('bouillon légumes', 'Conserves', 'archétype'),
('bouillon de légumes', 'Conserves', 'archétype'),
('bouillon de bœuf', 'Conserves', 'archétype'),
('bouillon de volaille', 'Conserves', 'archétype'),
('bouillon poulet', 'Conserves', 'archétype'),
('fond de veau', 'Conserves', 'archétype'),
('fumet de poisson', 'Conserves', 'archétype'),
('fumet poisson', 'Conserves', 'archétype'),
('fumet', 'Conserves', 'archétype'),
('dashi', 'Conserves', 'archétype'),
('vin blanc', 'Conserves', 'archétype'),
('vin rouge', 'Conserves', 'archétype'),
('vin blanc anjou', 'Conserves', 'cultivar'),
('vin blanc savoie', 'Conserves', 'cultivar'),
('vin rouge de bourgogne', 'Conserves', 'cultivar'),
('cognac', 'Conserves', 'archétype'),
('calvados', 'Conserves', 'archétype'),
('rhum', 'Conserves', 'archétype'),
('rhum ambré', 'Conserves', 'canonical'),
('madère', 'Conserves', 'canonical'),
('porto', 'Conserves', 'archétype'),
('marsala', 'Conserves', 'canonical'),
('sherry', 'Conserves', 'canonical'),
('saké', 'Conserves', 'archétype'),
('mirin', 'Conserves', 'archétype'),
('cidre', 'Conserves', 'canonical'),
('cidre brut', 'Conserves', 'canonical'),
('bière', 'Conserves', 'canonical'),
('bière ambrée', 'Conserves', 'canonical'),
('bière blonde', 'Conserves', 'canonical'),
('bière brune', 'Conserves', 'canonical'),
('aquavit', 'Conserves', 'canonical'),
('kirsch', 'Conserves', 'archétype'),
('grand marnier', 'Conserves', 'canonical'),
('amaretto', 'Conserves', 'canonical'),
('café fort', 'Conserves', 'canonical'),
('burger', 'Céréales', 'canonical'),
('tofu', 'Produits laitiers', 'archétype'),
('tofu ferme', 'Produits laitiers', 'archétype'),
('tofu soyeux', 'Produits laitiers', 'archétype'),
('seitan', 'Céréales', 'archétype'),
('tempeh', 'Céréales', 'archétype'),
('umeboshi', 'Conserves', 'canonical'),
('furikake', 'Épices', 'canonical'),
('nori', 'Conserves', 'canonical'),
('tamarin', 'Fruits', 'canonical'),
('zeste', 'Fruits', 'archétype'),
('zeste de citron', 'Fruits', 'archétype'),
('malt', 'Céréales', 'canonical'),
('pain d''épices', 'Céréales', 'canonical'),
('meringue', 'Édulcorants', 'canonical'),
('fondant', 'Édulcorants', 'archétype'),
('fondant blanc', 'Édulcorants', 'archétype'),
('fondant chocolat', 'Édulcorants', 'archétype'),
('glaçage chocolat', 'Édulcorants', 'canonical'),
('crème pâtissière', 'Produits laitiers', 'archétype'),
('crème pâtissière chocolat', 'Produits laitiers', 'archétype'),
('crème pâtissière ou cerise', 'Produits laitiers', 'archétype'),
('crème anglaise', 'Produits laitiers', 'archétype'),
('crème d''amande', 'Noix et graines', 'archétype'),
('crème au beurre café', 'Produits laitiers', 'archétype'),
('crème chiboust', 'Produits laitiers', 'archétype'),
('crèmesseline', 'Produits laitiers', 'archétype'),
('crèmesseline pralinée', 'Produits laitiers', 'archétype'),
('crème marron', 'Noix et graines', 'archétype'),
('ganache chocolat', 'Édulcorants', 'archétype'),
('praliné', 'Noix et graines', 'canonical'),
('pralin', 'Noix et graines', 'canonical'),
('pâte d''amande', 'Noix et graines', 'archétype'),
('pâte d''amande rose', 'Noix et graines', 'archétype'),
('pâte noisette', 'Noix et graines', 'archétype'),
('pâte pistache', 'Noix et graines', 'archétype'),
('joconde', 'Céréales', 'canonical'),
('purée potiron', 'Légumes', 'canonical'),
('chaud', 'Conserves', 'canonical'),
('rond', 'Légumes', 'canonical'),
('duxelle champignon', 'Champignons', 'canonical'),
('truffe', 'Champignons', 'canonical');

-- ================================================================
-- PARTIE 2 : INSERTION DES CANONICAL_FOODS MANQUANTS
-- ================================================================

-- Insérer les canonical_foods qui n'existent pas encore
WITH new_canonicals AS (
    SELECT DISTINCT
        icm.ingredient_name,
        rc.id AS category_id
    FROM 
        ingredient_category_mapping icm
        JOIN reference_categories rc ON rc.name = icm.category_name
    WHERE 
        icm.classification = 'canonical'
        AND NOT EXISTS (
            SELECT 1 
            FROM canonical_foods cf 
            WHERE LOWER(cf.canonical_name) = LOWER(icm.ingredient_name)
        )
)
INSERT INTO canonical_foods (canonical_name, category_id, primary_unit)
SELECT 
    ingredient_name,
    category_id,
    'g' -- Unité par défaut en grammes
FROM new_canonicals;

-- Log du nombre d'insertions
DO $$
DECLARE
    inserted_count INT;
BEGIN
    SELECT COUNT(*) INTO inserted_count
    FROM ingredient_category_mapping icm
    JOIN reference_categories rc ON rc.name = icm.category_name
    WHERE icm.classification = 'canonical'
    AND EXISTS (
        SELECT 1 
        FROM canonical_foods cf 
        WHERE LOWER(cf.canonical_name) = LOWER(icm.ingredient_name)
    );
    
    RAISE NOTICE '✅ % canonical_foods créés ou vérifiés', inserted_count;
END $$;

-- ================================================================
-- PARTIE 3 : CRÉATION DES ARCHÉTYPES PAR DÉFAUT
-- ================================================================

-- Pour les ingrédients classifiés comme "canonical", créer un archétype par défaut
WITH canonical_archetypes AS (
    SELECT DISTINCT
        cf.id AS canonical_food_id,
        cf.canonical_name AS archetype_name
    FROM 
        ingredient_category_mapping icm
        JOIN canonical_foods cf ON LOWER(cf.canonical_name) = LOWER(icm.ingredient_name)
    WHERE 
        icm.classification = 'canonical'
        AND NOT EXISTS (
            SELECT 1 
            FROM archetypes a 
            WHERE a.canonical_food_id = cf.id 
            AND a.is_default = TRUE
        )
)
INSERT INTO archetypes (canonical_food_id, name, is_default, primary_unit)
SELECT 
    canonical_food_id,
    archetype_name || ' (standard)',
    TRUE,
    'g'
FROM canonical_archetypes;

-- Pour les ingrédients classifiés comme "archétype", créer l'archétype
WITH archetype_entries AS (
    SELECT DISTINCT
        cf.id AS canonical_food_id,
        icm.ingredient_name AS archetype_name
    FROM 
        ingredient_category_mapping icm
        JOIN reference_categories rc ON rc.name = icm.category_name
        JOIN canonical_foods cf ON cf.category_id = rc.id
    WHERE 
        icm.classification = 'archétype'
        -- Trouver le canonical_food correspondant par correspondance de mots-clés
        AND (
            LOWER(cf.canonical_name) = ANY(string_to_array(LOWER(icm.ingredient_name), ' '))
            OR LOWER(icm.ingredient_name) LIKE '%' || LOWER(cf.canonical_name) || '%'
        )
        AND NOT EXISTS (
            SELECT 1 
            FROM archetypes a 
            WHERE LOWER(a.name) = LOWER(icm.ingredient_name)
        )
    LIMIT 1
)
INSERT INTO archetypes (canonical_food_id, name, is_default, primary_unit, process)
SELECT 
    canonical_food_id,
    archetype_name,
    FALSE,
    'g',
    'transformé'
FROM archetype_entries;

-- Log du nombre d'archétypes créés
DO $$
DECLARE
    archetype_count INT;
BEGIN
    SELECT COUNT(*) INTO archetype_count FROM archetypes;
    RAISE NOTICE '✅ Total archétypes dans la base : %', archetype_count;
END $$;

-- ================================================================
-- PARTIE 4 : CRÉATION DES PRODUITS AUTO-GÉNÉRÉS PAR DÉFAUT
-- ================================================================

-- Créer un produit auto-généré pour chaque archétype qui n'en a pas
WITH missing_products AS (
    SELECT 
        a.id AS archetype_id,
        a.name AS archetype_name,
        cf.canonical_name
    FROM 
        archetypes a
        LEFT JOIN canonical_foods cf ON cf.id = a.canonical_food_id
    WHERE 
        NOT EXISTS (
            SELECT 1 
            FROM products p 
            WHERE p.archetype_id = a.id 
            AND p.is_auto_generated = TRUE
        )
)
INSERT INTO products (
    archetype_id, 
    name, 
    is_default, 
    is_auto_generated, 
    package_unit
)
SELECT 
    archetype_id,
    COALESCE(canonical_name, archetype_name) || ' (générique)',
    TRUE,
    TRUE,
    'g'
FROM missing_products;

-- Log final
DO $$
DECLARE
    product_count INT;
BEGIN
    SELECT COUNT(*) INTO product_count FROM products WHERE is_auto_generated = TRUE;
    RAISE NOTICE '✅ Total produits auto-générés : %', product_count;
END $$;

-- ================================================================
-- PARTIE 5 : STATISTIQUES FINALES
-- ================================================================

DO $$
DECLARE
    total_canonical INT;
    total_archetypes INT;
    total_products INT;
    total_categories INT;
BEGIN
    SELECT COUNT(*) INTO total_canonical FROM canonical_foods;
    SELECT COUNT(*) INTO total_archetypes FROM archetypes;
    SELECT COUNT(*) INTO total_products FROM products;
    SELECT COUNT(DISTINCT category_id) INTO total_categories FROM canonical_foods;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '📊 STATISTIQUES FINALES';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Canonical Foods : %', total_canonical;
    RAISE NOTICE '✅ Archétypes : %', total_archetypes;
    RAISE NOTICE '✅ Produits : %', total_products;
    RAISE NOTICE '✅ Catégories utilisées : %', total_categories;
    RAISE NOTICE '================================================';
END $$;

-- Nettoyage
DROP TABLE IF EXISTS ingredient_category_mapping;

-- Rétablir les triggers
SET session_replication_role = 'origin';

COMMIT;

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
