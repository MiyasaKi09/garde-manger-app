-- ======================================================
-- INSERTION INGRÉDIENTS - VERSION 6 INTELLIGENTE
-- ======================================================
-- CANONICAL = aliments BRUTS non transformés
-- ARCHETYPE = tout ce qui est préparé/transformé
-- ======================================================

BEGIN;

-- ======================================================
-- CANONICAL FOODS (aliments bruts)
-- ======================================================

-- ail (25x) - Unité retirée
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('ail', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- amandes effilées (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('amandes effilées', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- amaretto (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('amaretto', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- artichauts violets moyens (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('artichauts violets moyens', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- bananes mûres (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('bananes mûres', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- beurre (61x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('beurre', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- beurre de tourage (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('beurre de tourage', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- beurre fondu (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('beurre fondu', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- beurre mou (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('beurre mou', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- beurre noisette (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('beurre noisette', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- beurre salé (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('beurre salé', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- bicarbonate (4x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('bicarbonate', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- bière ambrée (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('bière ambrée', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- blanc de poireau (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('blanc de poireau', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- blancs d'oeufs (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('blancs d'oeufs', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- blancs d'oeufs vieillis (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('blancs d'oeufs vieillis', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- blancs de poulet (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('blancs de poulet', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- boeuf (gîte, paleron) (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('boeuf (gîte, paleron)', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- boeuf à braiser (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('boeuf à braiser', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- boeuf à mijoter (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('boeuf à mijoter', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- bouquet garni (9x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('bouquet garni', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- branche de céleri (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('branche de céleri', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- branche de thym (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('branche de thym', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- branches de thym (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('branches de thym', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- brin de thym (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('brin de thym', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- brisées (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('brisées', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- café fort (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('café fort', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- calamars (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('calamars', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- calvados (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('calvados', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- canard entier (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('canard entier', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- cannelle (13x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cannelle', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- cassonade (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cassonade', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- cayenne (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cayenne', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- cerneaux de noix (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cerneaux de noix', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- champignons (5x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('champignons', 3)
ON CONFLICT (canonical_name) DO NOTHING;

-- champignons noirs (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('champignons noirs', 3)
ON CONFLICT (canonical_name) DO NOTHING;

-- chips de maïs (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('chips de maïs', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- chocolat noir (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('chocolat noir', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- chèvre (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('chèvre', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- ciboulette (1x) - Synonyme
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('ciboulette', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- cidre brut (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cidre brut', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- citron bio (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('citron bio', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- cognac (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cognac', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- coleslaw (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('coleslaw', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- crème (17x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('crème', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- cuillère (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cuillère', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- cumin (17x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cumin', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- câpres (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('câpres', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- céleri (4x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('céleri', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- côtelettes d'agneau (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('côtelettes d'agneau', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- dashi (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('dashi', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- eau (27x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('eau', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- eau tiède (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('eau tiède', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- entrecôte de boeuf (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('entrecôte de boeuf', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- escargots (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('escargots', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- farine (53x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('farine', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- farine T45 (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('farine T45', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- farine T65 (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('farine T65', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- feta (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('feta', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- feuille de laurier (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('feuille de laurier', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- feuilles de brick (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('feuilles de brick', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- feuilles de laurier (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('feuilles de laurier', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- figues fraîches (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('figues fraîches', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- fleur de sel (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fleur de sel', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage blanc (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fromage blanc', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage de chèvre (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fromage de chèvre', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage frais (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fromage frais', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- fruits rouges mélangés (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fruits rouges mélangés', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- fécule de maïs (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fécule de maïs', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- ganache chocolat (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('ganache chocolat', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- garni (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('garni', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- garrofó (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('garrofó', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- gigot d'agneau (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('gigot d'agneau', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- girofle (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('girofle', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- graines de chia (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('graines de chia', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- graines de sésame (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('graines de sésame', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- graines sésame (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('graines sésame', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots blancs secs (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('haricots blancs secs', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots noirs (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('haricots noirs', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots rouges (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('haricots rouges', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- huile (25x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('huile', 11)
ON CONFLICT (canonical_name) DO NOTHING;

-- huile neutre (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('huile neutre', 11)
ON CONFLICT (canonical_name) DO NOTHING;

-- huile sésame (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('huile sésame', 11)
ON CONFLICT (canonical_name) DO NOTHING;

-- huile végétale (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('huile végétale', 11)
ON CONFLICT (canonical_name) DO NOTHING;

-- jarret de veau en tranches de 4cm (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('jarret de veau en tranches de 4cm', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- jaune d'oeuf pour dorure (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('jaune d'oeuf pour dorure', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes d'oeufs (8x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('jaunes d'oeufs', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes d'œufs (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('jaunes d'œufs', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes oeufs (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('jaunes oeufs', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- jus citron (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('jus citron', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- ketchup (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('ketchup', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- lait entier (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('lait entier', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- lait végétal (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('lait végétal', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- lapin découpé (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('lapin découpé', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- lentilles corail (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('lentilles corail', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- levure (4x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('levure', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- levure boulanger (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('levure boulanger', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- levure chimique (6x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('levure chimique', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- levure de bière (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('levure de bière', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- levure de boulanger (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('levure de boulanger', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- madère (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('madère', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- magrets de canard (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('magrets de canard', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- maïzena (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('maïzena', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- mie de pain (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('mie de pain', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- mirin (5x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('mirin', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- moules (4x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('moules', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- moutarde de Dijon (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('moutarde de Dijon', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- mozzarella (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('mozzarella', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- navets (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('navets', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- noisettes (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('noisettes', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- noix de muscade (5x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('noix de muscade', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- nuoc mam (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('nuoc mam', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs (40x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oeufs', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs (4 gros) (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oeufs (4 gros)', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs durs (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oeufs durs', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs entiers (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oeufs entiers', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs pour meringue (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oeufs pour meringue', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- oignon rouge (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oignon rouge', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- oignon vert (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oignon vert', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- olives (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('olives', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- olives noires (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('olives noires', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- olives noires dénoyautées (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('olives noires dénoyautées', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- paleron de boeuf (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('paleron de boeuf', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- paneer (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('paneer', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- paprika (13x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('paprika', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- paprika doux (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('paprika doux', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- pavés saumon (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pavés saumon', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- pavés saumon 150g (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pavés saumon 150g', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- pecorino romano (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pecorino romano', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- persil plat (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('persil plat', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- petits oignons (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('petits oignons', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- petits oignons blancs (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('petits oignons blancs', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- petits oignons grelots (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('petits oignons grelots', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- pignons (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pignons', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- pignons de pin (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pignons de pin', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- piment cayenne (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('piment cayenne', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- piment d'Espelette (4x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('piment d'Espelette', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- piment de Cayenne (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('piment de Cayenne', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- pois chiches secs (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pois chiches secs', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- pois mange-tout (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pois mange-tout', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- poitrine de porc (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poitrine de porc', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre blanc (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivre blanc', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre en grains (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivre en grains', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre noir (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivre noir', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre vert (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivre vert', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivron rouge (6x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivron rouge', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivrons jaunes (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivrons jaunes', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivrons rouges (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivrons rouges', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- pommes (4x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pommes', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- poudre d'amande (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poudre d'amande', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- poudre d'amandes (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poudre d'amandes', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- poule (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poule', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet découpé (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poulet découpé', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet fermier (1,5 kg) (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poulet fermier (1,5 kg)', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet fermier (1,8 kg) (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poulet fermier (1,8 kg)', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- pour dorure (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pour dorure', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- pousses de soja (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pousses de soja', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- pruneaux (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pruneaux', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- pruneaux dénoyautés (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pruneaux dénoyautés', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- pépites chocolat (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pépites chocolat', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- pépites de chocolat (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pépites de chocolat', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- rhum (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('rhum', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- rhum ambré (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('rhum ambré', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- riz arborio (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('riz arborio', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- riz bomba (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('riz bomba', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- rouge (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('rouge', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- rôti de porc (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('rôti de porc', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- rôti de veau sous-noix (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('rôti de veau sous-noix', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- sablée (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sablée', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- saké (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('saké', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- salade (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('salade', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- sauté de veau (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sauté de veau', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- sirop d'agave (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sirop d'agave', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- steaks de boeuf 180g (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('steaks de boeuf 180g', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre (39x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sucre', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre blanc (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sucre blanc', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre brun (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sucre brun', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre glace (4x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sucre glace', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre pour caramel (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sucre pour caramel', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre pour meringue (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sucre pour meringue', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- tahini (5x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tahini', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- thon au naturel (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('thon au naturel', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- tofu ferme (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tofu ferme', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- tomates cerises (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tomates cerises', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- tomates mûres (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tomates mûres', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- tomates pelées (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tomates pelées', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- tomme (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tomme', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- tonnarelli (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tonnarelli', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- tranches d'emmental (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tranches d'emmental', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- travers de porc (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('travers de porc', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- vanille liquide (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vanille liquide', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- veau pour blanquette (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('veau pour blanquette', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- verts (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('verts', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- viande d'agneau (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('viande d'agneau', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- vin blanc (11x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vin blanc', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- vin rouge (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vin rouge', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- vin rouge de Bourgogne (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vin rouge de Bourgogne', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vinaigre', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre balsamique (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vinaigre balsamique', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre blanc (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vinaigre blanc', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre d'estragon (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vinaigre d'estragon', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- xérès (1x) - Traduction
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('xérès', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- yaourt grec (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('yaourt grec', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- yaourt nature (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('yaourt nature', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- zeste de citron (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('zeste de citron', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- échine de porc (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('échine de porc', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- épaule d'agneau (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('épaule d'agneau', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- œuf (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('œuf', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- œufs (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('œufs', 14)
ON CONFLICT (canonical_name) DO NOTHING;


-- ======================================================
-- ARCHETYPES (produits transformés/préparés)
-- ======================================================

-- agneau haché (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('agneau haché', 9)
ON CONFLICT (name) DO NOTHING;

-- ail en poudre (2x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('ail en poudre', 2)
ON CONFLICT (name) DO NOTHING;

-- andouillettes de Troyes (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('andouillettes de Troyes', 9)
ON CONFLICT (name) DO NOTHING;

-- bacon (4x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('bacon', 9)
ON CONFLICT (name) DO NOTHING;

-- baguette (2x) - Pain (produit cuit)
INSERT INTO archetypes (name, category_id)
VALUES ('baguette', 5)
ON CONFLICT (name) DO NOTHING;

-- biscuits Graham (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('biscuits Graham', 14)
ON CONFLICT (name) DO NOTHING;

-- boeuf haché (6x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('boeuf haché', 9)
ON CONFLICT (name) DO NOTHING;

-- boudins noirs (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('boudins noirs', 9)
ON CONFLICT (name) DO NOTHING;

-- bouillon (10x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('bouillon', 14)
ON CONFLICT (name) DO NOTHING;

-- bouillon de boeuf (5x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('bouillon de boeuf', 9)
ON CONFLICT (name) DO NOTHING;

-- chair à saucisse (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('chair à saucisse', 9)
ON CONFLICT (name) DO NOTHING;

-- chapelure (6x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('chapelure', 5)
ON CONFLICT (name) DO NOTHING;

-- chapelure panko (3x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('chapelure panko', 5)
ON CONFLICT (name) DO NOTHING;

-- chorizo (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('chorizo', 9)
ON CONFLICT (name) DO NOTHING;

-- cinq épices (1x) - Mélange d'épices
INSERT INTO archetypes (name, category_id)
VALUES ('cinq épices', 10)
ON CONFLICT (name) DO NOTHING;

-- comté râpé (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('comté râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- confit de canard (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('confit de canard', 9)
ON CONFLICT (name) DO NOTHING;

-- coriandre moulue (2x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('coriandre moulue', 10)
ON CONFLICT (name) DO NOTHING;

-- crevettes cuites (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('crevettes cuites', 9)
ON CONFLICT (name) DO NOTHING;

-- crème liquide (4x) - Produit laitier transformé
INSERT INTO archetypes (name, category_id)
VALUES ('crème liquide', 7)
ON CONFLICT (name) DO NOTHING;

-- crème épaisse (3x) - Produit laitier transformé
INSERT INTO archetypes (name, category_id)
VALUES ('crème épaisse', 7)
ON CONFLICT (name) DO NOTHING;

-- cumin moulu (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('cumin moulu', 10)
ON CONFLICT (name) DO NOTHING;

-- curry (1x) - Mélange d'épices
INSERT INTO archetypes (name, category_id)
VALUES ('curry', 10)
ON CONFLICT (name) DO NOTHING;

-- escalopes de porc (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('escalopes de porc', 9)
ON CONFLICT (name) DO NOTHING;

-- escalopes de poulet (2x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('escalopes de poulet', 9)
ON CONFLICT (name) DO NOTHING;

-- escalopes de veau (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('escalopes de veau', 9)
ON CONFLICT (name) DO NOTHING;

-- escalopes de veau (70 g) (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('escalopes de veau (70 g)', 9)
ON CONFLICT (name) DO NOTHING;

-- farine de sarrasin (1x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('farine de sarrasin', 5)
ON CONFLICT (name) DO NOTHING;

-- flocons d'avoine (5x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('flocons d'avoine', 5)
ON CONFLICT (name) DO NOTHING;

-- fromage râpé (9x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('fromage râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- galettes chinoises (1x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('galettes chinoises', 5)
ON CONFLICT (name) DO NOTHING;

-- galettes de riz (2x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('galettes de riz', 5)
ON CONFLICT (name) DO NOTHING;

-- garam masala (1x) - Mélange d'épices
INSERT INTO archetypes (name, category_id)
VALUES ('garam masala', 10)
ON CONFLICT (name) DO NOTHING;

-- gruyère râpé (4x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('gruyère râpé', 14)
ON CONFLICT (name) DO NOTHING;

-- guanciale (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('guanciale', 9)
ON CONFLICT (name) DO NOTHING;

-- haricots blancs sauce tomate (1x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('haricots blancs sauce tomate', 2)
ON CONFLICT (name) DO NOTHING;

-- herbes de Provence (4x) - Mélange d'épices
INSERT INTO archetypes (name, category_id)
VALUES ('herbes de Provence', 10)
ON CONFLICT (name) DO NOTHING;

-- herbes italiennes (1x) - Mélange d'épices
INSERT INTO archetypes (name, category_id)
VALUES ('herbes italiennes', 10)
ON CONFLICT (name) DO NOTHING;

-- huile d'olive (76x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('huile d'olive', 11)
ON CONFLICT (name) DO NOTHING;

-- huile de coco (1x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('huile de coco', 11)
ON CONFLICT (name) DO NOTHING;

-- huile de friture (4x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('huile de friture', 11)
ON CONFLICT (name) DO NOTHING;

-- huile de sésame (3x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('huile de sésame', 11)
ON CONFLICT (name) DO NOTHING;

-- jambon (3x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('jambon', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon blanc (2x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('jambon blanc', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon cru (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('jambon cru', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon cuit (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('jambon cuit', 14)
ON CONFLICT (name) DO NOTHING;

-- jambon ibérique (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('jambon ibérique', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon serrano (2x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('jambon serrano', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon à l'os (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('jambon à l'os', 9)
ON CONFLICT (name) DO NOTHING;

-- jaune d'oeuf (2x) - Partie d'œuf séparée
INSERT INTO archetypes (name, category_id)
VALUES ('jaune d'oeuf', 7)
ON CONFLICT (name) DO NOTHING;

-- jus de citron (15x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('jus de citron', 1)
ON CONFLICT (name) DO NOTHING;

-- jus de citron vert (2x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('jus de citron vert', 1)
ON CONFLICT (name) DO NOTHING;

-- lardons (3x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('lardons', 9)
ON CONFLICT (name) DO NOTHING;

-- lardons fumés (2x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('lardons fumés', 14)
ON CONFLICT (name) DO NOTHING;

-- lasagnes (1x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('lasagnes', 5)
ON CONFLICT (name) DO NOTHING;

-- morue dessalée (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('morue dessalée', 9)
ON CONFLICT (name) DO NOTHING;

-- muffins anglais (1x) - Pain (produit cuit)
INSERT INTO archetypes (name, category_id)
VALUES ('muffins anglais', 5)
ON CONFLICT (name) DO NOTHING;

-- nouilles ramen (1x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('nouilles ramen', 5)
ON CONFLICT (name) DO NOTHING;

-- pain (1x) - Pain (produit cuit)
INSERT INTO archetypes (name, category_id)
VALUES ('pain', 5)
ON CONFLICT (name) DO NOTHING;

-- pain d'épices (1x) - Pain (produit cuit)
INSERT INTO archetypes (name, category_id)
VALUES ('pain d'épices', 5)
ON CONFLICT (name) DO NOTHING;

-- pain de campagne (2x) - Pain (produit cuit)
INSERT INTO archetypes (name, category_id)
VALUES ('pain de campagne', 5)
ON CONFLICT (name) DO NOTHING;

-- pain de mie (5x) - Pain (produit cuit)
INSERT INTO archetypes (name, category_id)
VALUES ('pain de mie', 5)
ON CONFLICT (name) DO NOTHING;

-- pain rassis (1x) - Pain (produit cuit)
INSERT INTO archetypes (name, category_id)
VALUES ('pain rassis', 5)
ON CONFLICT (name) DO NOTHING;

-- paprika fumé (2x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('paprika fumé', 10)
ON CONFLICT (name) DO NOTHING;

-- parmesan râpé (6x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('parmesan râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- paupiettes de veau (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('paupiettes de veau', 9)
ON CONFLICT (name) DO NOTHING;

-- penne (1x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('penne', 5)
ON CONFLICT (name) DO NOTHING;

-- persil haché (3x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('persil haché', 10)
ON CONFLICT (name) DO NOTHING;

-- pois chiches cuits (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('pois chiches cuits', 5)
ON CONFLICT (name) DO NOTHING;

-- poitrine fumée (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('poitrine fumée', 14)
ON CONFLICT (name) DO NOTHING;

-- poivre moulu (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('poivre moulu', 10)
ON CONFLICT (name) DO NOTHING;

-- porc haché (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('porc haché', 9)
ON CONFLICT (name) DO NOTHING;

-- pâte brisée (1x) - Préparation pâtissière
INSERT INTO archetypes (name, category_id)
VALUES ('pâte brisée', 14)
ON CONFLICT (name) DO NOTHING;

-- pâte feuilletée (4x) - Préparation pâtissière
INSERT INTO archetypes (name, category_id)
VALUES ('pâte feuilletée', 14)
ON CONFLICT (name) DO NOTHING;

-- pâte à pizza (1x) - Préparation pâtissière
INSERT INTO archetypes (name, category_id)
VALUES ('pâte à pizza', 14)
ON CONFLICT (name) DO NOTHING;

-- pâtes courtes (1x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('pâtes courtes', 5)
ON CONFLICT (name) DO NOTHING;

-- quatre-épices (1x) - Mélange d'épices
INSERT INTO archetypes (name, category_id)
VALUES ('quatre-épices', 10)
ON CONFLICT (name) DO NOTHING;

-- riz cuit froid (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('riz cuit froid', 5)
ON CONFLICT (name) DO NOTHING;

-- sauce d'huître (2x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('sauce d'huître', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce hoisin (1x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('sauce hoisin', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce soja (14x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('sauce soja', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce soja claire (1x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('sauce soja claire', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce soja foncée (1x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('sauce soja foncée', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce tomate (1x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('sauce tomate', 2)
ON CONFLICT (name) DO NOTHING;

-- sauce tomates (1x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('sauce tomates', 2)
ON CONFLICT (name) DO NOTHING;

-- sauce tonkatsu (1x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('sauce tonkatsu', 14)
ON CONFLICT (name) DO NOTHING;

-- saucisses de Strasbourg (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('saucisses de Strasbourg', 9)
ON CONFLICT (name) DO NOTHING;

-- saucisses de Toulouse (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('saucisses de Toulouse', 9)
ON CONFLICT (name) DO NOTHING;

-- saucisses fumées (1x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('saucisses fumées', 14)
ON CONFLICT (name) DO NOTHING;

-- saucisses porc (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('saucisses porc', 9)
ON CONFLICT (name) DO NOTHING;

-- saucisson de Lyon pistaché 800g (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('saucisson de Lyon pistaché 800g', 9)
ON CONFLICT (name) DO NOTHING;

-- saumon fumé (3x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('saumon fumé', 9)
ON CONFLICT (name) DO NOTHING;

-- semoule (2x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('semoule', 5)
ON CONFLICT (name) DO NOTHING;

-- spaghetti (3x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('spaghetti', 5)
ON CONFLICT (name) DO NOTHING;

-- sucre semoule (3x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('sucre semoule', 5)
ON CONFLICT (name) DO NOTHING;

-- tomates concassées (5x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('tomates concassées', 2)
ON CONFLICT (name) DO NOTHING;

-- tortillas (1x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('tortillas', 5)
ON CONFLICT (name) DO NOTHING;

-- tranches de bacon (1x) - Charcuterie/viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('tranches de bacon', 9)
ON CONFLICT (name) DO NOTHING;

-- vermicelle (2x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('vermicelle', 5)
ON CONFLICT (name) DO NOTHING;

-- vermicelles de riz (3x) - Céréale/pâte transformée
INSERT INTO archetypes (name, category_id)
VALUES ('vermicelles de riz', 5)
ON CONFLICT (name) DO NOTHING;

-- viande d'agneau hachée (2x) - Transformation explicite
INSERT INTO archetypes (name, category_id)
VALUES ('viande d'agneau hachée', 9)
ON CONFLICT (name) DO NOTHING;

-- vinaigre de cidre (2x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre de cidre', 14)
ON CONFLICT (name) DO NOTHING;

-- vinaigre de riz (3x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre de riz', 5)
ON CONFLICT (name) DO NOTHING;

-- vinaigre de xérès (1x) - Préparation composée
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre de xérès', 14)
ON CONFLICT (name) DO NOTHING;

COMMIT;
