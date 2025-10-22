-- ========================================
-- VERSION 9 - MAPPING MANUEL COMPLET
-- Chaque ingrédient vérifié individuellement
-- ========================================

BEGIN;

-- ========================================
-- CANONICAL FOODS (aliments bruts)
-- ========================================

-- amaretto (1x) | Liqueur
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('amaretto', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- bicarbonate (4x) | Produit chimique
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('bicarbonate', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- bière (1x) | Type inutile | de: bière ambrée
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('bière', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- bouquet garni (9x) | Assemblage standard
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('bouquet garni', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- calvados (1x) | Eau-de-vie
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('calvados', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- cassonade (3x) | Type différent
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cassonade', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- cerneau de noix (1x) | Singulariser | de: cerneaux de noix
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cerneau de noix', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- champignon (5x) | Singulariser | de: champignons
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('champignon', 3)
ON CONFLICT (canonical_name) DO NOTHING;

-- chocolat noir (3x) | Base
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('chocolat noir', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- chèvre frais (1x) | Fromage frais
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('chèvre frais', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- cidre (1x) | Boisson fermentée | de: cidre brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cidre', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- cognac (3x) | Eau-de-vie
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cognac', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- cumin (17x) | Graine brute
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cumin', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- câpre (3x) | Bouton de fleur | de: câpres
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('câpre', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- céleri (4x) | Base
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('céleri', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- eau (27x) | Liquide brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('eau', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- escargot (1x) | Gastropode | de: escargots
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('escargot', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- feta (1x) | Fromage
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('feta', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- fleur de sel (1x) | Sel spécial
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fleur de sel', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage blanc (1x) | Fromage non affiné
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fromage blanc', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage de chèvre (1x) | Fromage
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fromage de chèvre', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage frais (2x) | Fromage non affiné
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fromage frais', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- fruit rouge (1x) | Retirer mélangés | de: fruits rouges mélangés
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fruit rouge', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- garrofó (1x) | Haricot espagnol
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('garrofó', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- girofle (2x) | Bouton de fleur séché | de: clou de girofle
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('girofle', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- graine de chia (2x) | Singulariser | de: graines de chia
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('graine de chia', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- graine de sésame (3x) | Singulariser | de: graines de sésame
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('graine de sésame', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- haricot blanc (1x) | Variété | de: haricots blancs secs
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('haricot blanc', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- haricot noir (1x) | Variété | de: haricots noirs
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('haricot noir', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- haricot rouge (2x) | Variété | de: haricots rouges
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('haricot rouge', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- lait végétal (2x) | Alternative végétale
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('lait végétal', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- lentille corail (2x) | Variété | de: lentilles corail
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('lentille corail', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- levure (4x) | Micro-organisme
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('levure', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- levure chimique (6x) | Agent levant
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('levure chimique', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- madère (1x) | Vin fortifié
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('madère', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- magret de canard (1x) | Découpe | de: magrets de canard
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('magret de canard', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- mirin (5x) | Vin de riz doux
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('mirin', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- moutarde de Dijon (2x) | Condiment
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('moutarde de Dijon', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- mozzarella (3x) | Fromage
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('mozzarella', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- noisette (1x) | Singulariser | de: noisettes
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('noisette', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- nuoc mam (1x) | Sauce poisson fermentée
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('nuoc mam', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- oignon grelot (1x) | Variété | de: petits oignons grelots
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oignon grelot', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- oignon rouge (1x) | Variété
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oignon rouge', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- oignon vert (1x) | Variété
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oignon vert', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- olive noire (1x) | Retirer dénoyauté | de: olives noires dénoyautées
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('olive noire', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- paneer (1x) | Fromage
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('paneer', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- pecorino romano (2x) | Fromage
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pecorino romano', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- pignon de pin (3x) | Singulariser | de: pignons de pin
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pignon de pin', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- piment cayenne (1x) | Variété
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('piment cayenne', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- pois mange-tout (1x) | Variété
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pois mange-tout', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre blanc (1x) | Variété
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivre blanc', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre noir (1x) | Variété
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivre noir', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre vert (1x) | Variété
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivre vert', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivron jaune (1x) | Couleur importante | de: poivrons jaunes
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivron jaune', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivron rouge (6x) | Couleur importante
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivron rouge', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- poule (1x) | Volaille
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poule', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- pousse de soja (2x) | Germe | de: pousses de soja
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pousse de soja', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- pruneau (1x) | Singulariser | de: pruneaux
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pruneau', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- pépite de chocolat (1x) | Forme | de: pépites de chocolat
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pépite de chocolat', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- raisin sec (1x) | Fruit séché | de: raisins secs
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('raisin sec', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- rhum (3x) | Alcool
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('rhum', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- riz basmati (2x) | Variété de riz
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('riz basmati', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- riz bomba (1x) | Variété
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('riz bomba', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- saké (1x) | Alcool de riz
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('saké', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- salade (3x) | Base
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('salade', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- sirop d'agave (2x) | Sève concentrée
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sirop d'agave', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre (39x) | Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sucre', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre glace (4x) | Forme différente
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sucre glace', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- tofu (1x) | Caillé de soja | de: tofu ferme
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tofu', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- tomate cerise (1x) | Variété | de: tomates cerises
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tomate cerise', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- tomme fraîche (1x) | Fromage frais
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tomme fraîche', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- vin blanc (11x) | Boisson fermentée
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vin blanc', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- vin rouge (3x) | Boisson fermentée
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vin rouge', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- xérès (1x) | Synonyme anglais | de: sherry
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('xérès', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- yaourt (2x) | Produit laitier | de: yaourt nature
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('yaourt', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- yaourt grec (3x) | Produit laitier
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('yaourt grec', 7)
ON CONFLICT (canonical_name) DO NOTHING;


-- ========================================
-- ARCHETYPES (transformés/préparés)
-- ========================================

-- agneau haché (2x) | Hachage | de: viande d'agneau hachée
INSERT INTO archetypes (name, category_id)
VALUES ('agneau haché', 9)
ON CONFLICT (name) DO NOTHING;

-- ail en poudre (2x) | Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('ail en poudre', 2)
ON CONFLICT (name) DO NOTHING;

-- amande effilée (2x) | Transformation | de: amandes effilées
INSERT INTO archetypes (name, category_id)
VALUES ('amande effilée', 14)
ON CONFLICT (name) DO NOTHING;

-- andouillette (1x) | Charcuterie | de: andouillettes de Troyes
INSERT INTO archetypes (name, category_id)
VALUES ('andouillette', 9)
ON CONFLICT (name) DO NOTHING;

-- bacon (4x) | Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('bacon', 9)
ON CONFLICT (name) DO NOTHING;

-- baguette (2x) | Produit cuit
INSERT INTO archetypes (name, category_id)
VALUES ('baguette', 5)
ON CONFLICT (name) DO NOTHING;

-- beurre (61x) | Produit laitier transformé
INSERT INTO archetypes (name, category_id)
VALUES ('beurre', 7)
ON CONFLICT (name) DO NOTHING;

-- beurre noisette (1x) | Beurre cuit
INSERT INTO archetypes (name, category_id)
VALUES ('beurre noisette', 7)
ON CONFLICT (name) DO NOTHING;

-- beurre salé (2x) | Beurre salé
INSERT INTO archetypes (name, category_id)
VALUES ('beurre salé', 7)
ON CONFLICT (name) DO NOTHING;

-- biscuit Graham (1x) | Biscuit | de: biscuits Graham
INSERT INTO archetypes (name, category_id)
VALUES ('biscuit Graham', 14)
ON CONFLICT (name) DO NOTHING;

-- blanc d'oeuf (3x) | Partie séparée | de: blancs d'oeufs
INSERT INTO archetypes (name, category_id)
VALUES ('blanc d'oeuf', 7)
ON CONFLICT (name) DO NOTHING;

-- blanc de poulet (1x) | Partie spécifique | de: blancs de poulet
INSERT INTO archetypes (name, category_id)
VALUES ('blanc de poulet', 9)
ON CONFLICT (name) DO NOTHING;

-- boeuf haché (6x) | Hachage
INSERT INTO archetypes (name, category_id)
VALUES ('boeuf haché', 9)
ON CONFLICT (name) DO NOTHING;

-- boudin noir (1x) | Charcuterie | de: boudins noirs
INSERT INTO archetypes (name, category_id)
VALUES ('boudin noir', 9)
ON CONFLICT (name) DO NOTHING;

-- bouillon (10x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('bouillon', 14)
ON CONFLICT (name) DO NOTHING;

-- bouillon de boeuf (5x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('bouillon de boeuf', 9)
ON CONFLICT (name) DO NOTHING;

-- bouillon de légumes (2x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('bouillon de légumes', 2)
ON CONFLICT (name) DO NOTHING;

-- bouillon de volaille (2x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('bouillon de volaille', 9)
ON CONFLICT (name) DO NOTHING;

-- cannelle (13x) | Écorce séchée
INSERT INTO archetypes (name, category_id)
VALUES ('cannelle', 10)
ON CONFLICT (name) DO NOTHING;

-- chair à saucisse (1x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('chair à saucisse', 9)
ON CONFLICT (name) DO NOTHING;

-- chapelure (6x) | Pain transformé
INSERT INTO archetypes (name, category_id)
VALUES ('chapelure', 5)
ON CONFLICT (name) DO NOTHING;

-- chapelure panko (3x) | Pain transformé
INSERT INTO archetypes (name, category_id)
VALUES ('chapelure panko', 5)
ON CONFLICT (name) DO NOTHING;

-- chip de maïs (1x) | Transformation | de: chips de maïs
INSERT INTO archetypes (name, category_id)
VALUES ('chip de maïs', 5)
ON CONFLICT (name) DO NOTHING;

-- chorizo (1x) | Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('chorizo', 9)
ON CONFLICT (name) DO NOTHING;

-- cinq épices (1x) | Mélange
INSERT INTO archetypes (name, category_id)
VALUES ('cinq épices', 10)
ON CONFLICT (name) DO NOTHING;

-- coleslaw (1x) | Salade préparée
INSERT INTO archetypes (name, category_id)
VALUES ('coleslaw', 14)
ON CONFLICT (name) DO NOTHING;

-- comté râpé (1x) | Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('comté râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- confit de canard (1x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('confit de canard', 9)
ON CONFLICT (name) DO NOTHING;

-- coriandre moulue (2x) | Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('coriandre moulue', 10)
ON CONFLICT (name) DO NOTHING;

-- crevette cuite (1x) | Cuisson | de: crevettes cuites
INSERT INTO archetypes (name, category_id)
VALUES ('crevette cuite', 9)
ON CONFLICT (name) DO NOTHING;

-- crème (5x) | Produit laitier transformé
INSERT INTO archetypes (name, category_id)
VALUES ('crème', 7)
ON CONFLICT (name) DO NOTHING;

-- crème fraîche (17x) | Produit laitier transformé
INSERT INTO archetypes (name, category_id)
VALUES ('crème fraîche', 7)
ON CONFLICT (name) DO NOTHING;

-- crème liquide (4x) | Produit laitier transformé
INSERT INTO archetypes (name, category_id)
VALUES ('crème liquide', 7)
ON CONFLICT (name) DO NOTHING;

-- cumin moulu (1x) | Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('cumin moulu', 10)
ON CONFLICT (name) DO NOTHING;

-- curry (1x) | Mélange
INSERT INTO archetypes (name, category_id)
VALUES ('curry', 10)
ON CONFLICT (name) DO NOTHING;

-- dashi (2x) | Bouillon
INSERT INTO archetypes (name, category_id)
VALUES ('dashi', 14)
ON CONFLICT (name) DO NOTHING;

-- escalope de porc (1x) | Découpe fine | de: escalopes de porc
INSERT INTO archetypes (name, category_id)
VALUES ('escalope de porc', 9)
ON CONFLICT (name) DO NOTHING;

-- escalope de poulet (2x) | Découpe fine | de: escalopes de poulet
INSERT INTO archetypes (name, category_id)
VALUES ('escalope de poulet', 9)
ON CONFLICT (name) DO NOTHING;

-- escalope de veau (1x) | Découpe fine | de: escalopes de veau (70 g)
INSERT INTO archetypes (name, category_id)
VALUES ('escalope de veau', 9)
ON CONFLICT (name) DO NOTHING;

-- farine (53x) | Céréale moulue
INSERT INTO archetypes (name, category_id)
VALUES ('farine', 5)
ON CONFLICT (name) DO NOTHING;

-- farine de sarrasin (1x) | Sarrasin moulu
INSERT INTO archetypes (name, category_id)
VALUES ('farine de sarrasin', 5)
ON CONFLICT (name) DO NOTHING;

-- feuille de brick (1x) | Produit transformé | de: feuilles de brick
INSERT INTO archetypes (name, category_id)
VALUES ('feuille de brick', 5)
ON CONFLICT (name) DO NOTHING;

-- flocon d'avoine (5x) | Transformation | de: flocons d'avoine
INSERT INTO archetypes (name, category_id)
VALUES ('flocon d'avoine', 5)
ON CONFLICT (name) DO NOTHING;

-- fond de veau (4x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('fond de veau', 9)
ON CONFLICT (name) DO NOTHING;

-- fromage râpé (9x) | Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('fromage râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- fumet de poisson (1x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('fumet de poisson', 9)
ON CONFLICT (name) DO NOTHING;

-- fécule de maïs (1x) | Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('fécule de maïs', 14)
ON CONFLICT (name) DO NOTHING;

-- galette chinoise (1x) | Produit transformé | de: galettes chinoises
INSERT INTO archetypes (name, category_id)
VALUES ('galette chinoise', 5)
ON CONFLICT (name) DO NOTHING;

-- galette de riz (2x) | Produit transformé | de: galettes de riz
INSERT INTO archetypes (name, category_id)
VALUES ('galette de riz', 5)
ON CONFLICT (name) DO NOTHING;

-- ganache chocolat (1x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('ganache chocolat', 14)
ON CONFLICT (name) DO NOTHING;

-- garam masala (1x) | Mélange
INSERT INTO archetypes (name, category_id)
VALUES ('garam masala', 10)
ON CONFLICT (name) DO NOTHING;

-- gruyère râpé (4x) | Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('gruyère râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- guanciale (1x) | Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('guanciale', 9)
ON CONFLICT (name) DO NOTHING;

-- haricot blanc sauce tomate (1x) | Préparation | de: haricots blancs sauce tomate
INSERT INTO archetypes (name, category_id)
VALUES ('haricot blanc sauce tomate', 5)
ON CONFLICT (name) DO NOTHING;

-- herbes de Provence (4x) | Mélange d'herbes séchées
INSERT INTO archetypes (name, category_id)
VALUES ('herbes de Provence', 10)
ON CONFLICT (name) DO NOTHING;

-- herbes italiennes (1x) | Mélange
INSERT INTO archetypes (name, category_id)
VALUES ('herbes italiennes', 10)
ON CONFLICT (name) DO NOTHING;

-- huile (25x) | Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('huile', 11)
ON CONFLICT (name) DO NOTHING;

-- huile de coco (1x) | Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('huile de coco', 11)
ON CONFLICT (name) DO NOTHING;

-- huile de friture (4x) | Usage spécifique
INSERT INTO archetypes (name, category_id)
VALUES ('huile de friture', 11)
ON CONFLICT (name) DO NOTHING;

-- huile de sésame (3x) | Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('huile de sésame', 11)
ON CONFLICT (name) DO NOTHING;

-- huile végétale (1x) | Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('huile végétale', 11)
ON CONFLICT (name) DO NOTHING;

-- jambon (3x) | Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('jambon', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon blanc (2x) | Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('jambon blanc', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon cru (1x) | Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('jambon cru', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon cuit (1x) | Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('jambon cuit', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon ibérique (1x) | Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('jambon ibérique', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon serrano (2x) | Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('jambon serrano', 9)
ON CONFLICT (name) DO NOTHING;

-- jaune d'oeuf (8x) | Partie séparée | de: jaunes d'oeufs
INSERT INTO archetypes (name, category_id)
VALUES ('jaune d'oeuf', 7)
ON CONFLICT (name) DO NOTHING;

-- jus de citron (15x) | Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('jus de citron', 1)
ON CONFLICT (name) DO NOTHING;

-- jus de citron vert (2x) | Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('jus de citron vert', 1)
ON CONFLICT (name) DO NOTHING;

-- ketchup (3x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('ketchup', 14)
ON CONFLICT (name) DO NOTHING;

-- lardon (3x) | Charcuterie | de: lardons
INSERT INTO archetypes (name, category_id)
VALUES ('lardon', 9)
ON CONFLICT (name) DO NOTHING;

-- lardon fumé (2x) | Charcuterie fumée | de: lardons fumés
INSERT INTO archetypes (name, category_id)
VALUES ('lardon fumé', 9)
ON CONFLICT (name) DO NOTHING;

-- lasagne (1x) | Pâtes | de: lasagnes
INSERT INTO archetypes (name, category_id)
VALUES ('lasagne', 5)
ON CONFLICT (name) DO NOTHING;

-- mayonnaise (2x) | Émulsion
INSERT INTO archetypes (name, category_id)
VALUES ('mayonnaise', 14)
ON CONFLICT (name) DO NOTHING;

-- maïzena (3x) | Fécule de maïs
INSERT INTO archetypes (name, category_id)
VALUES ('maïzena', 14)
ON CONFLICT (name) DO NOTHING;

-- mie de pain (1x) | Partie de pain
INSERT INTO archetypes (name, category_id)
VALUES ('mie de pain', 5)
ON CONFLICT (name) DO NOTHING;

-- morue dessalée (1x) | Dessalage
INSERT INTO archetypes (name, category_id)
VALUES ('morue dessalée', 9)
ON CONFLICT (name) DO NOTHING;

-- muffin anglais (1x) | Produit cuit | de: muffins anglais
INSERT INTO archetypes (name, category_id)
VALUES ('muffin anglais', 5)
ON CONFLICT (name) DO NOTHING;

-- nouille ramen (1x) | Pâtes | de: nouilles ramen
INSERT INTO archetypes (name, category_id)
VALUES ('nouille ramen', 5)
ON CONFLICT (name) DO NOTHING;

-- oeuf dur (1x) | Cuisson | de: oeufs durs
INSERT INTO archetypes (name, category_id)
VALUES ('oeuf dur', 7)
ON CONFLICT (name) DO NOTHING;

-- pain (1x) | Produit cuit
INSERT INTO archetypes (name, category_id)
VALUES ('pain', 5)
ON CONFLICT (name) DO NOTHING;

-- pain d'épices (1x) | Produit cuit
INSERT INTO archetypes (name, category_id)
VALUES ('pain d'épices', 5)
ON CONFLICT (name) DO NOTHING;

-- pain de campagne (2x) | Produit cuit
INSERT INTO archetypes (name, category_id)
VALUES ('pain de campagne', 5)
ON CONFLICT (name) DO NOTHING;

-- pain de mie (5x) | Produit cuit
INSERT INTO archetypes (name, category_id)
VALUES ('pain de mie', 5)
ON CONFLICT (name) DO NOTHING;

-- pain rassis (1x) | Pain séché
INSERT INTO archetypes (name, category_id)
VALUES ('pain rassis', 5)
ON CONFLICT (name) DO NOTHING;

-- paprika (13x) | Piment séché et moulu
INSERT INTO archetypes (name, category_id)
VALUES ('paprika', 10)
ON CONFLICT (name) DO NOTHING;

-- paprika fumé (2x) | Piment transformé
INSERT INTO archetypes (name, category_id)
VALUES ('paprika fumé', 10)
ON CONFLICT (name) DO NOTHING;

-- parmesan râpé (6x) | Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('parmesan râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- paupiette de veau (1x) | Préparation | de: paupiettes de veau
INSERT INTO archetypes (name, category_id)
VALUES ('paupiette de veau', 9)
ON CONFLICT (name) DO NOTHING;

-- penne (1x) | Pâtes
INSERT INTO archetypes (name, category_id)
VALUES ('penne', 5)
ON CONFLICT (name) DO NOTHING;

-- persil haché (3x) | Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('persil haché', 10)
ON CONFLICT (name) DO NOTHING;

-- pesto (1x) | Sauce préparée
INSERT INTO archetypes (name, category_id)
VALUES ('pesto', 14)
ON CONFLICT (name) DO NOTHING;

-- piment d'Espelette (4x) | Piment séché et moulu
INSERT INTO archetypes (name, category_id)
VALUES ('piment d'Espelette', 10)
ON CONFLICT (name) DO NOTHING;

-- pois chiche cuit (1x) | Cuisson | de: pois chiches cuits
INSERT INTO archetypes (name, category_id)
VALUES ('pois chiche cuit', 5)
ON CONFLICT (name) DO NOTHING;

-- poitrine fumée (1x) | Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('poitrine fumée', 9)
ON CONFLICT (name) DO NOTHING;

-- poivre moulu (1x) | Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('poivre moulu', 10)
ON CONFLICT (name) DO NOTHING;

-- porc haché (1x) | Hachage
INSERT INTO archetypes (name, category_id)
VALUES ('porc haché', 9)
ON CONFLICT (name) DO NOTHING;

-- poudre d'amande (3x) | Transformation | de: poudre d'amandes
INSERT INTO archetypes (name, category_id)
VALUES ('poudre d'amande', 14)
ON CONFLICT (name) DO NOTHING;

-- pâte brisée (1x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('pâte brisée', 14)
ON CONFLICT (name) DO NOTHING;

-- pâte feuilletée (4x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('pâte feuilletée', 14)
ON CONFLICT (name) DO NOTHING;

-- pâte sablée (1x) | Préparation | de: sablée
INSERT INTO archetypes (name, category_id)
VALUES ('pâte sablée', 14)
ON CONFLICT (name) DO NOTHING;

-- pâte à pizza (1x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('pâte à pizza', 14)
ON CONFLICT (name) DO NOTHING;

-- pâtes courtes (1x) | Pâtes
INSERT INTO archetypes (name, category_id)
VALUES ('pâtes courtes', 5)
ON CONFLICT (name) DO NOTHING;

-- quatre-épices (1x) | Mélange
INSERT INTO archetypes (name, category_id)
VALUES ('quatre-épices', 10)
ON CONFLICT (name) DO NOTHING;

-- riz cuit (1x) | Cuisson | de: riz cuit froid
INSERT INTO archetypes (name, category_id)
VALUES ('riz cuit', 5)
ON CONFLICT (name) DO NOTHING;

-- sauce barbecue (1x) | Sauce préparée
INSERT INTO archetypes (name, category_id)
VALUES ('sauce barbecue', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce béchamel (4x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce béchamel', 7)
ON CONFLICT (name) DO NOTHING;

-- sauce d'huître (2x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce d'huître', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce hoisin (1x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce hoisin', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce soja (14x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce soja', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce soja claire (1x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce soja claire', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce soja foncée (1x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce soja foncée', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce tomate (1x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce tomate', 2)
ON CONFLICT (name) DO NOTHING;

-- sauce tonkatsu (1x) | Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce tonkatsu', 14)
ON CONFLICT (name) DO NOTHING;

-- saucisse (1x) | Charcuterie | de: saucisses porc
INSERT INTO archetypes (name, category_id)
VALUES ('saucisse', 9)
ON CONFLICT (name) DO NOTHING;

-- saucisse de Strasbourg (1x) | Charcuterie | de: saucisses de Strasbourg
INSERT INTO archetypes (name, category_id)
VALUES ('saucisse de Strasbourg', 9)
ON CONFLICT (name) DO NOTHING;

-- saucisse de Toulouse (1x) | Charcuterie | de: saucisses de Toulouse
INSERT INTO archetypes (name, category_id)
VALUES ('saucisse de Toulouse', 9)
ON CONFLICT (name) DO NOTHING;

-- saucisse fumée (1x) | Charcuterie | de: saucisses fumées
INSERT INTO archetypes (name, category_id)
VALUES ('saucisse fumée', 9)
ON CONFLICT (name) DO NOTHING;

-- saucisson de Lyon (1x) | Charcuterie | de: saucisson de Lyon pistaché 800g
INSERT INTO archetypes (name, category_id)
VALUES ('saucisson de Lyon', 9)
ON CONFLICT (name) DO NOTHING;

-- saumon fumé (3x) | Fumage
INSERT INTO archetypes (name, category_id)
VALUES ('saumon fumé', 9)
ON CONFLICT (name) DO NOTHING;

-- semoule (2x) | Céréale moulue
INSERT INTO archetypes (name, category_id)
VALUES ('semoule', 5)
ON CONFLICT (name) DO NOTHING;

-- spaghetti (3x) | Pâtes
INSERT INTO archetypes (name, category_id)
VALUES ('spaghetti', 5)
ON CONFLICT (name) DO NOTHING;

-- tahini (5x) | Pâte de sésame
INSERT INTO archetypes (name, category_id)
VALUES ('tahini', 14)
ON CONFLICT (name) DO NOTHING;

-- tomate concassée (5x) | Transformation | de: tomates concassées
INSERT INTO archetypes (name, category_id)
VALUES ('tomate concassée', 2)
ON CONFLICT (name) DO NOTHING;

-- tomate pelée (2x) | Transformation | de: tomates pelées
INSERT INTO archetypes (name, category_id)
VALUES ('tomate pelée', 2)
ON CONFLICT (name) DO NOTHING;

-- tonnarelli (1x) | Pâtes
INSERT INTO archetypes (name, category_id)
VALUES ('tonnarelli', 5)
ON CONFLICT (name) DO NOTHING;

-- tortilla (1x) | Produit cuit | de: tortillas
INSERT INTO archetypes (name, category_id)
VALUES ('tortilla', 5)
ON CONFLICT (name) DO NOTHING;

-- vanille liquide (1x) | Extrait
INSERT INTO archetypes (name, category_id)
VALUES ('vanille liquide', 14)
ON CONFLICT (name) DO NOTHING;

-- vermicelle (2x) | Pâtes
INSERT INTO archetypes (name, category_id)
VALUES ('vermicelle', 5)
ON CONFLICT (name) DO NOTHING;

-- vermicelle de riz (3x) | Pâtes | de: vermicelles de riz
INSERT INTO archetypes (name, category_id)
VALUES ('vermicelle de riz', 5)
ON CONFLICT (name) DO NOTHING;

-- vinaigre (3x) | Fermentation acétique
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre', 14)
ON CONFLICT (name) DO NOTHING;

-- vinaigre balsamique (1x) | Fermentation
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre balsamique', 14)
ON CONFLICT (name) DO NOTHING;

-- vinaigre blanc (2x) | Fermentation
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre blanc', 14)
ON CONFLICT (name) DO NOTHING;

-- vinaigre d'estragon (1x) | Fermentation
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre d'estragon', 14)
ON CONFLICT (name) DO NOTHING;

-- vinaigre de cidre (2x) | Fermentation
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre de cidre', 14)
ON CONFLICT (name) DO NOTHING;

-- vinaigre de riz (3x) | Fermentation
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre de riz', 14)
ON CONFLICT (name) DO NOTHING;

-- vinaigre de xérès (1x) | Fermentation
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre de xérès', 14)
ON CONFLICT (name) DO NOTHING;

-- zeste de citron (1x) | Partie râpée
INSERT INTO archetypes (name, category_id)
VALUES ('zeste de citron', 1)
ON CONFLICT (name) DO NOTHING;

COMMIT;
