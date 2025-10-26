-- ================================================================
-- Script de complétion de la base de données
-- Basé sur INGREDIENTS_CLASSIFIES.csv
-- ================================================================
-- 
-- Complète les tables :
-- 1. canonical_foods (classification = "canonical")
-- 2. cultivars (classification = "cultivar")  
-- 3. archetypes (classification = "archétype")
--
-- Respecte la hiérarchie :
-- canonical_foods → cultivars → archetypes
-- ================================================================

BEGIN;

-- ================================================================
-- ÉTAPE 1 : CRÉER TABLE TEMPORAIRE AVEC MAPPING COMPLET
-- ================================================================

CREATE TEMP TABLE ingredients_a_importer (
    ingredient_name TEXT PRIMARY KEY,
    classification TEXT NOT NULL, -- canonical, cultivar, archétype
    category_name TEXT NOT NULL,
    subcategory_code TEXT,
    base_canonical TEXT, -- Pour cultivars et archetypes
    process_type TEXT -- Pour archetypes
);

-- ================================================================
-- CANONICAL_FOODS : Ingrédients de base (classification = "canonical")
-- ================================================================

-- FRUITS (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('pomme', 'canonical', 'Fruits', 'fruits_pome'),
('poire', 'canonical', 'Fruits', 'fruits_pome'),
('citron', 'canonical', 'Fruits', 'fruits_agrumes'),
('orange', 'canonical', 'Fruits', 'fruits_agrumes'),
('citron vert', 'canonical', 'Fruits', 'fruits_agrumes'),
('fraise', 'canonical', 'Fruits', 'fruits_rouges'),
('framboise', 'canonical', 'Fruits', 'fruits_rouges'),
('myrtille', 'canonical', 'Fruits', 'fruits_rouges'),
('mangue', 'canonical', 'Fruits', 'fruits_exotiques'),
('ananas', 'canonical', 'Fruits', 'fruits_exotiques'),
('pêche', 'canonical', 'Fruits', 'fruits_noyau'),
('cerise', 'canonical', 'Fruits', 'fruits_noyau'),
('abricot', 'canonical', 'Fruits', 'fruits_noyau'),
('pruneau', 'canonical', 'Fruits', 'fruits_noyau'),
('figue', 'canonical', 'Fruits', 'fruits_figues_dattes'),
('datte', 'canonical', 'Fruits', 'fruits_figues_dattes'),
('raisin', 'canonical', 'Fruits', 'fruits_raisin'),
('fruit de la passion', 'canonical', 'Fruits', 'fruits_exotiques'),
('tamarin', 'canonical', 'Fruits', 'fruits_exotiques');

-- LÉGUMES (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('oignon', 'canonical', 'Légumes', 'legumes_alliums'),
('ail', 'canonical', 'Légumes', 'legumes_alliums'),
('échalote', 'canonical', 'Légumes', 'legumes_alliums'),
('poireau', 'canonical', 'Légumes', 'legumes_alliums'),
('ciboulette', 'canonical', 'Légumes', 'legumes_alliums'),
('carotte', 'canonical', 'Légumes', 'legumes_racines'),
('pomme de terre', 'canonical', 'Légumes', 'legumes_racines'),
('navet', 'canonical', 'Légumes', 'legumes_racines'),
('betterave', 'canonical', 'Légumes', 'legumes_racines'),
('panais', 'canonical', 'Légumes', 'legumes_racines'),
('patate douce', 'canonical', 'Légumes', 'legumes_racines'),
('radis', 'canonical', 'Légumes', 'legumes_racines'),
('topinambour', 'canonical', 'Légumes', 'legumes_racines'),
('rutabaga', 'canonical', 'Légumes', 'legumes_racines'),
('gingembre', 'canonical', 'Légumes', 'legumes_racines'),
('tomate', 'canonical', 'Légumes', 'legumes_solanacees'),
('poivron', 'canonical', 'Légumes', 'legumes_solanacees'),
('aubergine', 'canonical', 'Légumes', 'legumes_solanacees'),
('piment', 'canonical', 'Légumes', 'legumes_solanacees'),
('courgette', 'canonical', 'Légumes', 'legumes_cucurbitacees'),
('concombre', 'canonical', 'Légumes', 'legumes_cucurbitacees'),
('courge', 'canonical', 'Légumes', 'legumes_cucurbitacees'),
('potiron', 'canonical', 'Légumes', 'legumes_cucurbitacees'),
('potimarron', 'canonical', 'Légumes', 'legumes_cucurbitacees'),
('chou', 'canonical', 'Légumes', 'legumes_cruciferes'),
('chou-fleur', 'canonical', 'Légumes', 'legumes_cruciferes'),
('brocoli', 'canonical', 'Légumes', 'legumes_cruciferes'),
('chou de bruxelle', 'canonical', 'Légumes', 'legumes_cruciferes'),
('épinard', 'canonical', 'Légumes', 'legumes_feuilles'),
('salade', 'canonical', 'Légumes', 'legumes_feuilles'),
('endive', 'canonical', 'Légumes', 'legumes_feuilles'),
('cresson', 'canonical', 'Légumes', 'legumes_feuilles'),
('oseille', 'canonical', 'Légumes', 'legumes_feuilles'),
('blette', 'canonical', 'Légumes', 'legumes_feuilles'),
('laitue romaine', 'canonical', 'Légumes', 'legumes_feuilles'),
('céleri', 'canonical', 'Légumes', 'legumes_tiges'),
('asperge', 'canonical', 'Légumes', 'legumes_tiges'),
('fenouil', 'canonical', 'Légumes', 'legumes_tiges'),
('petit pois', 'canonical', 'Légumes', 'legumes_legumineuses_vertes'),
('haricot vert', 'canonical', 'Légumes', 'legumes_legumineuses_vertes'),
('maïs', 'canonical', 'Légumes', 'legumes_autres'),
('artichaut violet', 'canonical', 'Légumes', 'legumes_autres'),
('salsifi', 'canonical', 'Légumes', 'legumes_autres');

-- CHAMPIGNONS (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('champignon', 'canonical', 'Champignons', 'champignons_commestibles'),
('champignon de Paris', 'canonical', 'Champignons', 'champignons_cultives'),
('cèpe', 'canonical', 'Champignons', 'champignons_sauvages'),
('morille', 'canonical', 'Champignons', 'champignons_sauvages'),
('truffe', 'canonical', 'Champignons', 'champignons_sauvages');

-- ŒUFS (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('œuf', 'canonical', 'Œufs', 'oeufs_poule');

-- CÉRÉALES (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('riz', 'canonical', 'Céréales', 'cereales_grains'),
('blé', 'canonical', 'Céréales', 'cereales_grains'),
('avoine', 'canonical', 'Céréales', 'cereales_grains'),
('sarrasin', 'canonical', 'Céréales', 'pseudo_cereales'),
('quinoa', 'canonical', 'Céréales', 'pseudo_cereales');

-- LÉGUMINEUSES (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('pois chiche', 'canonical', 'Légumineuses', 'legumineuses_seches'),
('lentille', 'canonical', 'Légumineuses', 'legumineuses_seches'),
('haricot blanc', 'canonical', 'Légumineuses', 'legumineuses_seches'),
('haricot rouge', 'canonical', 'Légumineuses', 'legumineuses_seches'),
('haricot noir', 'canonical', 'Légumineuses', 'legumineuses_seches');

-- PRODUITS LAITIERS (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('lait', 'canonical', 'Produits laitiers', 'laitiers_laits'),
('lait végétal', 'canonical', 'Produits laitiers', 'laitiers_laits');

-- VIANDES (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('bœuf', 'canonical', 'Viandes', 'viandes_ruminants'),
('veau', 'canonical', 'Viandes', 'viandes_ruminants'),
('agneau', 'canonical', 'Viandes', 'viandes_ruminants'),
('porc', 'canonical', 'Viandes', 'viandes_porcins'),
('poulet', 'canonical', 'Viandes', 'viandes_volailles'),
('canard', 'canonical', 'Viandes', 'viandes_volailles'),
('lapin', 'canonical', 'Viandes', 'viandes_gibier'),
('chevreuil', 'canonical', 'Viandes', 'viandes_gibier'),
('sanglier', 'canonical', 'Viandes', 'viandes_gibier'),
('lièvre', 'canonical', 'Viandes', 'viandes_gibier'),
('cerf', 'canonical', 'Viandes', 'viandes_gibier'),
('faisan', 'canonical', 'Viandes', 'viandes_gibier'),
('bécasse', 'canonical', 'Viandes', 'viandes_gibier'),
('foie', 'canonical', 'Viandes', 'viandes_autres'),
('foie gras', 'canonical', 'Viandes', 'viandes_autres'),
('mouton', 'canonical', 'Viandes', 'viandes_ruminants');

-- POISSONS (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('saumon', 'canonical', 'Poissons', 'poissons_gras'),
('thon', 'canonical', 'Poissons', 'poissons_gras'),
('cabillaud', 'canonical', 'Poissons', 'poissons_blancs'),
('sole', 'canonical', 'Poissons', 'poissons_blancs'),
('dorade', 'canonical', 'Poissons', 'poissons_blancs'),
('maquereau', 'canonical', 'Poissons', 'poissons_gras'),
('sardine', 'canonical', 'Poissons', 'poissons_gras'),
('lotte', 'canonical', 'Poissons', 'poissons_blancs'),
('crevette', 'canonical', 'Poissons', 'fruits_de_mer'),
('moule', 'canonical', 'Poissons', 'fruits_de_mer'),
('calamar', 'canonical', 'Poissons', 'fruits_de_mer'),
('escargot', 'canonical', 'Poissons', 'fruits_de_mer'),
('homard', 'canonical', 'Poissons', 'fruits_de_mer'),
('langoustine', 'canonical', 'Poissons', 'fruits_de_mer'),
('crabe', 'canonical', 'Poissons', 'fruits_de_mer'),
('écrevisse', 'canonical', 'Poissons', 'fruits_de_mer'),
('palourde', 'canonical', 'Poissons', 'fruits_de_mer');

-- ÉPICES (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('basilic', 'canonical', 'Épices', 'epices_feuilles_herbes'),
('persil', 'canonical', 'Épices', 'epices_feuilles_herbes'),
('coriandre', 'canonical', 'Épices', 'epices_feuilles_herbes'),
('menthe', 'canonical', 'Épices', 'epices_feuilles_herbes'),
('thym', 'canonical', 'Épices', 'epices_feuilles_herbes'),
('romarin', 'canonical', 'Épices', 'epices_feuilles_herbes'),
('laurier', 'canonical', 'Épices', 'epices_feuilles_herbes'),
('aneth', 'canonical', 'Épices', 'epices_feuilles_herbes'),
('sauge', 'canonical', 'Épices', 'epices_feuilles_herbes'),
('estragon', 'canonical', 'Épices', 'epices_feuilles_herbes'),
('citronnelle', 'canonical', 'Épices', 'epices_feuilles_herbes'),
('cumin', 'canonical', 'Épices', 'epices_graines'),
('curcuma', 'canonical', 'Épices', 'epices_racines_rhizomes'),
('poivre', 'canonical', 'Épices', 'epices_ecorces_fruits'),
('cannelle', 'canonical', 'Épices', 'epices_ecorces_fruits'),
('muscade', 'canonical', 'Épices', 'epices_autres'),
('clou de girofle', 'canonical', 'Épices', 'epices_autres'),
('vanille', 'canonical', 'Épices', 'epices_autres'),
('paprika', 'canonical', 'Épices', 'epices_autres'),
('sel', 'canonical', 'Épices', 'epices_autres'),
('origan', 'canonical', 'Épices', 'epices_feuilles_herbes');

-- NOIX ET GRAINES (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('noix', 'canonical', 'Noix et graines', 'noix_amandes'),
('noisette', 'canonical', 'Noix et graines', 'noix_amandes'),
('amande', 'canonical', 'Noix et graines', 'noix_amandes'),
('cacahuète', 'canonical', 'Noix et graines', 'noix_amandes'),
('pistache', 'canonical', 'Noix et graines', 'noix_amandes'),
('noix de pécan', 'canonical', 'Noix et graines', 'noix_amandes'),
('châtaigne', 'canonical', 'Noix et graines', 'noix_amandes'),
('marron', 'canonical', 'Noix et graines', 'noix_amandes'),
('noix cajou', 'canonical', 'Noix et graines', 'noix_amandes'),
('graine de chia', 'canonical', 'Noix et graines', 'graines_courantes'),
('graine de sésame', 'canonical', 'Noix et graines', 'graines_courantes'),
('pignon de pin', 'canonical', 'Noix et graines', 'graines_courantes'),
('pignon', 'canonical', 'Noix et graines', 'graines_courantes');

-- ÉDULCORANTS (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('miel', 'canonical', 'Édulcorants', 'edul_miels'),
('cacao', 'canonical', 'Édulcorants', 'edul_autres'),
('caramel', 'canonical', 'Édulcorants', 'edul_autres'),
('nougat', 'canonical', 'Édulcorants', 'edul_autres'),
('meringue', 'canonical', 'Édulcorants', 'edul_autres');

-- CONSERVES (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('eau', 'canonical', 'Conserves', 'conserves_autres'),
('câpre', 'canonical', 'Conserves', 'conserves_legumes'),
('kimchi', 'canonical', 'Conserves', 'conserves_legumes'),
('choucroute', 'canonical', 'Conserves', 'conserves_legumes');

-- HUILES (canonical)
INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, subcategory_code) VALUES
('saindoux', 'canonical', 'Huiles', 'huiles_autres');

-- ================================================================
-- CULTIVARS : Variétés (classification = "cultivar")
-- ================================================================

INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, base_canonical) VALUES
('fruit rouge', 'cultivar', 'Fruits', 'fraise'),
('tomate cerise', 'cultivar', 'Légumes', 'tomate'),
('chou blanc', 'cultivar', 'Légumes', 'chou'),
('chou vert', 'cultivar', 'Légumes', 'chou'),
('chou noir', 'cultivar', 'Légumes', 'chou'),
('poivron rouge', 'cultivar', 'Légumes', 'poivron'),
('poivron jaune', 'cultivar', 'Légumes', 'poivron'),
('blanc de poireau', 'cultivar', 'Légumes', 'poireau'),
('oignon rouge', 'cultivar', 'Légumes', 'oignon'),
('oignon vert', 'cultivar', 'Légumes', 'oignon'),
('petit oignon blanc', 'cultivar', 'Légumes', 'oignon'),
('épinard frais', 'cultivar', 'Légumes', 'épinard'),
('asperge verte', 'cultivar', 'Légumes', 'asperge'),
('champignon noir', 'cultivar', 'Champignons', 'champignon'),
('riz basmati', 'cultivar', 'Céréales', 'riz'),
('riz Arborio', 'cultivar', 'Céréales', 'riz'),
('riz japonais', 'cultivar', 'Céréales', 'riz'),
('riz gluant', 'cultivar', 'Céréales', 'riz'),
('riz bomba', 'cultivar', 'Céréales', 'riz'),
('lentille corail', 'cultivar', 'Légumineuses', 'lentille'),
('lentille verte', 'cultivar', 'Légumineuses', 'lentille'),
('poivre blanc', 'cultivar', 'Épices', 'poivre'),
('poivre noir', 'cultivar', 'Épices', 'poivre'),
('poivre vert', 'cultivar', 'Épices', 'poivre'),
('raisin blanc', 'cultivar', 'Fruits', 'raisin'),
('thon rouge', 'cultivar', 'Poissons', 'thon'),
('salade verte', 'cultivar', 'Légumes', 'salade'),
('jus citron vert', 'cultivar', 'Fruits', 'citron'),
('vert', 'cultivar', 'Épices', 'poivre'),
('rouge', 'cultivar', 'Épices', 'poivre');

-- ================================================================
-- ARCHETYPES : Produits transformés (classification = "archétype")
-- ================================================================

INSERT INTO ingredients_a_importer (ingredient_name, classification, category_name, base_canonical, process_type) VALUES
-- Produits laitiers transformés
('beurre', 'archétype', 'Produits laitiers', 'lait', 'barattage'),
('beurre salé', 'archétype', 'Produits laitiers', 'lait', 'barattage salé'),
('beurre demi-sel', 'archétype', 'Produits laitiers', 'lait', 'barattage demi-sel'),
('crème liquide', 'archétype', 'Produits laitiers', 'lait', 'écrémage'),
('crème fraîche', 'archétype', 'Produits laitiers', 'lait', 'fermentation'),
('crème fraîche épaisse', 'archétype', 'Produits laitiers', 'lait', 'fermentation épaisse'),
('yaourt', 'archétype', 'Produits laitiers', 'lait', 'fermentation lactique'),
('yaourt grec', 'archétype', 'Produits laitiers', 'lait', 'fermentation et égouttage'),
('yaourt nature', 'archétype', 'Produits laitiers', 'lait', 'fermentation'),
('fromage blanc', 'archétype', 'Produits laitiers', 'lait', 'caillage'),
('fromage frais', 'archétype', 'Produits laitiers', 'lait', 'caillage frais'),
('feta', 'archétype', 'Produits laitiers', 'lait', 'caillage et saumurage'),
('mozzarella', 'archétype', 'Produits laitiers', 'lait', 'filage'),
('parmesan', 'archétype', 'Produits laitiers', 'lait', 'affinage long'),
('gruyère', 'archétype', 'Produits laitiers', 'lait', 'affinage'),
('comté', 'archétype', 'Produits laitiers', 'lait', 'affinage long'),
('cheddar', 'archétype', 'Produits laitiers', 'lait', 'affinage'),
('mascarpone', 'archétype', 'Produits laitiers', 'lait', 'acidification'),
('ricotta', 'archétype', 'Produits laitiers', 'lait', 'cuisson petit-lait'),
('gélatine', 'archétype', 'Produits laitiers', NULL, 'extraction collagène'),
-- Céréales transformées
('farine', 'archétype', 'Céréales', 'blé', 'mouture'),
('farine complète', 'archétype', 'Céréales', 'blé', 'mouture complète'),
('farine de sarrasin', 'archétype', 'Céréales', 'sarrasin', 'mouture'),
('farine de pois chiche', 'archétype', 'Céréales', 'pois chiche', 'mouture'),
('flocon d''avoine', 'archétype', 'Céréales', 'avoine', 'laminage'),
('semoule', 'archétype', 'Céréales', 'blé', 'mouture grossière'),
('chapelure', 'archétype', 'Céréales', 'pain', 'séchage et broyage'),
('chapelure panko', 'archétype', 'Céréales', 'pain', 'séchage japonais'),
('pain', 'archétype', 'Céréales', 'farine', 'cuisson levée'),
('baguette', 'archétype', 'Céréales', 'farine', 'cuisson forme longue'),
('pain de campagne', 'archétype', 'Céréales', 'farine', 'cuisson levain'),
('brioche', 'archétype', 'Céréales', 'farine', 'cuisson enrichie'),
('pâte', 'archétype', 'Céréales', 'farine', 'laminage'),
('pâte feuilletée', 'archétype', 'Céréales', 'farine', 'feuilletage'),
('pâte brisée', 'archétype', 'Céréales', 'farine', 'pétrissage court'),
('pâte courte', 'archétype', 'Céréales', 'farine', 'pétrissage rapide'),
('spaghetti', 'archétype', 'Céréales', 'farine', 'extrusion'),
('penne', 'archétype', 'Céréales', 'farine', 'extrusion'),
('tagliatelle', 'archétype', 'Céréales', 'farine', 'laminage'),
('linguine', 'archétype', 'Céréales', 'farine', 'extrusion'),
('lasagne', 'archétype', 'Céréales', 'farine', 'laminage plaque'),
('vermicelle de riz', 'archétype', 'Céréales', 'riz', 'extrusion'),
('biscuit', 'archétype', 'Céréales', 'farine', 'cuisson sèche'),
('maïzena', 'archétype', 'Céréales', 'maïs', 'extraction amidon'),
-- Fruits et légumes transformés
('jus de citron', 'archétype', 'Fruits', 'citron', 'pressage'),
('jus de citron vert', 'archétype', 'Fruits', 'citron vert', 'pressage'),
('raisin sec', 'archétype', 'Fruits', 'raisin', 'séchage'),
('pruneau', 'archétype', 'Fruits', 'prune', 'séchage'),
('concentré de tomate', 'archétype', 'Conserves', 'tomate', 'réduction'),
('sauce tomate', 'archétype', 'Conserves', 'tomate', 'cuisson'),
('coulis de tomate', 'archétype', 'Conserves', 'tomate', 'mixage'),
-- Viandes transformées
('bœuf haché', 'archétype', 'Viandes', 'bœuf', 'hachage'),
('agneau haché', 'archétype', 'Viandes', 'agneau', 'hachage'),
('porc haché', 'archétype', 'Viandes', 'porc', 'hachage'),
('blanc de poulet', 'archétype', 'Viandes', 'poulet', 'découpe'),
('lardon', 'archétype', 'Viandes', 'porc', 'découpe et fumage'),
('lardon fumé', 'archétype', 'Viandes', 'porc', 'fumage'),
('bacon', 'archétype', 'Viandes', 'porc', 'salaison et fumage'),
('jambon', 'archétype', 'Viandes', 'porc', 'salaison'),
('chorizo', 'archétype', 'Viandes', 'porc', 'embossage et séchage'),
('saucisse de toulouse', 'archétype', 'Viandes', 'porc', 'embossage'),
('magret de canard', 'archétype', 'Viandes', 'canard', 'découpe'),
-- Poissons transformés
('saumon fumé', 'archétype', 'Poissons', 'saumon', 'fumage'),
('anchois', 'archétype', 'Poissons', 'anchois frais', 'salaison'),
('morue dessalée', 'archétype', 'Poissons', 'cabillaud', 'dessalage'),
-- Épices et condiments
('poudre d''amande', 'archétype', 'Noix et graines', 'amande', 'broyage'),
('tahini', 'archétype', 'Noix et graines', 'graine de sésame', 'broyage'),
('moutarde', 'archétype', 'Conserves', 'graine de moutarde', 'broyage et fermentation'),
('pesto', 'archétype', 'Conserves', 'basilic', 'mixage huile'),
('houmous', 'archétype', 'Conserves', 'pois chiche', 'mixage'),
-- Huiles
('huile d''olive', 'archétype', 'Huiles', 'olive', 'pressage'),
('huile végétale', 'archétype', 'Huiles', NULL, 'pressage'),
('huile de sésame', 'archétype', 'Huiles', 'graine de sésame', 'pressage'),
('huile de coco', 'archétype', 'Huiles', 'noix de coco', 'pressage'),
('huile deure', 'archétype', 'Huiles', NULL, 'friture'),
-- Édulcorants transformés
('sucre', 'archétype', 'Édulcorants', 'canne à sucre', 'cristallisation'),
('sucre glace', 'archétype', 'Édulcorants', 'sucre', 'broyage fin'),
('cassonade', 'archétype', 'Édulcorants', 'canne à sucre', 'cristallisation partielle'),
('sirop d''érable', 'archétype', 'Édulcorants', 'érable', 'réduction'),
('sirop d''agave', 'archétype', 'Édulcorants', 'agave', 'extraction et réduction'),
-- Conserves et sauces
('vinaigre', 'archétype', 'Conserves', 'vin', 'fermentation acétique'),
('vinaigre blanc', 'archétype', 'Conserves', 'alcool', 'fermentation acétique'),
('vinaigre balsamique', 'archétype', 'Conserves', 'vin', 'vieillissement'),
('sauce soja', 'archétype', 'Conserves', 'soja', 'fermentation'),
('ketchup', 'archétype', 'Conserves', 'tomate', 'cuisson épices'),
('mayonnaise', 'archétype', 'Conserves', 'œuf', 'émulsion'),
('moutarde de dijon', 'archétype', 'Conserves', 'graine de moutarde', 'broyage dijon'),
-- Œufs transformés
('jaune d''œuf', 'archétype', 'Œufs', 'œuf', 'séparation'),
('blanc d''œuf', 'archétype', 'Œufs', 'œuf', 'séparation'),
-- Légumineuses transformées
('pois chiche sec', 'archétype', 'Légumineuses', 'pois chiche', 'séchage'),
('haricot blanc sec', 'archétype', 'Légumineuses', 'haricot blanc', 'séchage'),
-- Conserves diverses
('olive', 'archétype', 'Conserves', 'olive fraîche', 'saumurage'),
('olive noire', 'archétype', 'Conserves', 'olive fraîche', 'saumurage noir'),
('bouillon', 'archétype', 'Conserves', NULL, 'infusion longue'),
('bouillon légumes', 'archétype', 'Conserves', 'légumes', 'infusion'),
('bouillon de légumes', 'archétype', 'Conserves', 'légumes', 'infusion'),
('bouillon de bœuf', 'archétype', 'Conserves', 'bœuf', 'infusion'),
('bouillon de volaille', 'archétype', 'Conserves', 'poulet', 'infusion'),
('fond de veau', 'archétype', 'Conserves', 'veau', 'réduction'),
('dashi', 'archétype', 'Conserves', 'kombu', 'infusion'),
('vin blanc', 'archétype', 'Conserves', 'raisin blanc', 'fermentation'),
('vin rouge', 'archétype', 'Conserves', 'raisin', 'fermentation'),
('cognac', 'archétype', 'Conserves', 'vin', 'distillation'),
('rhum', 'archétype', 'Conserves', 'canne à sucre', 'distillation'),
('saké', 'archétype', 'Conserves', 'riz', 'fermentation'),
('mirin', 'archétype', 'Conserves', 'riz', 'fermentation sucrée'),
('levure', 'archétype', 'Céréales', NULL, 'fermentation'),
('levure chimique', 'archétype', 'Céréales', NULL, 'mélange chimique'),
('bicarbonate', 'archétype', 'Céréales', NULL, 'extraction chimique'),
('paprika fumé', 'archétype', 'Épices', 'paprika', 'fumage'),
('origan séché', 'archétype', 'Épices', 'origan', 'séchage'),
('herbes de provence', 'archétype', 'Épices', NULL, 'mélange séché'),
('bouquet garni', 'archétype', 'Épices', NULL, 'assemblage'),
('curry', 'archétype', 'Épices', NULL, 'mélange épices'),
('safran', 'archétype', 'Épices', 'crocus', 'séchage pistils'),
('chocolat', 'archétype', 'Édulcorants', 'cacao', 'torréfaction'),
('chocolat noir', 'archétype', 'Édulcorants', 'cacao', 'torréfaction noir'),
('cayenne', 'archétype', 'Épices', 'piment', 'séchage et broyage'),
('piment de cayenne', 'archétype', 'Épices', 'piment', 'séchage'),
('lait de coco', 'archétype', 'Produits laitiers', 'noix de coco', 'pressage'),
('lait concentré sucré', 'archétype', 'Produits laitiers', 'lait', 'concentration'),
('cream cheese', 'archétype', 'Produits laitiers', 'lait', 'caillage crémeux'),
('pecorino romano', 'archétype', 'Produits laitiers', 'lait', 'affinage pecorino'),
('pecorino', 'archétype', 'Produits laitiers', 'lait', 'affinage brebis'),
('garam masala', 'archétype', 'Épices', NULL, 'mélange indien'),
('pâte feuilletée', 'archétype', 'Céréales', 'farine', 'feuilletage beurre');

-- ================================================================
-- ÉTAPE 2 : INSERTION DES CANONICAL_FOODS
-- ================================================================

WITH nouveaux_canonical AS (
    SELECT DISTINCT
        i.ingredient_name,
        rc.id AS category_id,
        rs.id AS subcategory_id,
        COALESCE(i.subcategory_code, 'cereales_autres') AS subcat_code
    FROM 
        ingredients_a_importer i
        JOIN reference_categories rc ON rc.name = i.category_name
        LEFT JOIN reference_subcategories rs ON rs.code = i.subcategory_code
    WHERE 
        i.classification = 'canonical'
        AND NOT EXISTS (
            SELECT 1 
            FROM canonical_foods cf 
            WHERE LOWER(cf.canonical_name) = LOWER(i.ingredient_name)
        )
)
INSERT INTO canonical_foods (canonical_name, category_id, subcategory_id, primary_unit)
SELECT 
    ingredient_name,
    category_id,
    subcategory_id,
    'g' -- Unité par défaut
FROM nouveaux_canonical;

-- ================================================================
-- ÉTAPE 3 : INSERTION DES CULTIVARS
-- ================================================================

WITH nouveaux_cultivars AS (
    SELECT DISTINCT
        i.ingredient_name AS cultivar_name,
        cf.id AS canonical_food_id
    FROM 
        ingredients_a_importer i
        JOIN canonical_foods cf ON LOWER(cf.canonical_name) = LOWER(i.base_canonical)
    WHERE 
        i.classification = 'cultivar'
        AND i.base_canonical IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 
            FROM cultivars cv 
            WHERE LOWER(cv.cultivar_name) = LOWER(i.ingredient_name)
        )
)
INSERT INTO cultivars (cultivar_name, canonical_food_id)
SELECT 
    cultivar_name,
    canonical_food_id
FROM nouveaux_cultivars;

-- ================================================================
-- ÉTAPE 4 : INSERTION DES ARCHETYPES
-- ================================================================

WITH nouveaux_archetypes AS (
    SELECT DISTINCT
        i.ingredient_name AS archetype_name,
        cf.id AS canonical_food_id,
        i.process_type
    FROM 
        ingredients_a_importer i
        LEFT JOIN canonical_foods cf ON LOWER(cf.canonical_name) = LOWER(i.base_canonical)
    WHERE 
        i.classification = 'archétype'
        AND NOT EXISTS (
            SELECT 1 
            FROM archetypes a 
            WHERE LOWER(a.name) = LOWER(i.ingredient_name)
        )
)
INSERT INTO archetypes (name, canonical_food_id, process, is_default, primary_unit)
SELECT 
    archetype_name,
    canonical_food_id,
    process_type,
    FALSE,
    'g'
FROM nouveaux_archetypes;

-- ================================================================
-- ÉTAPE 5 : RAPPORT FINAL
-- ================================================================

DO $$
DECLARE
    count_canonical INT;
    count_cultivars INT;
    count_archetypes INT;
    count_products INT;
BEGIN
    SELECT COUNT(*) INTO count_canonical FROM canonical_foods;
    SELECT COUNT(*) INTO count_cultivars FROM cultivars;
    SELECT COUNT(*) INTO count_archetypes FROM archetypes;
    SELECT COUNT(*) INTO count_products FROM products;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ IMPORT TERMINÉ - BASE DE DONNÉES COMPLÉTÉE';
    RAISE NOTICE '================================================';
    RAISE NOTICE '📊 Totaux après import :';
    RAISE NOTICE '   • canonical_foods : %', count_canonical;
    RAISE NOTICE '   • cultivars        : %', count_cultivars;
    RAISE NOTICE '   • archetypes       : %', count_archetypes;
    RAISE NOTICE '   • products         : %', count_products;
    RAISE NOTICE '================================================';
END $$;

-- Nettoyage
DROP TABLE IF EXISTS ingredients_a_importer;

COMMIT;

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
