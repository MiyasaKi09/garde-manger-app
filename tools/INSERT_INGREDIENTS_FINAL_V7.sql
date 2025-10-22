-- VERSION 7 - ANALYSE MANUELLE
-- Singularisation + suppression adjectifs inutiles

BEGIN;

-- CANONICAL FOODS

-- amaretto (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('amaretto', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- artichauts violets moyen (1x) - Aliment brut [artichauts violets moyens]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('artichauts violets moyen', 2)
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

-- blanc de poulet (1x) - Aliment brut [blancs de poulet]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('blanc de poulet', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- blancs d'oeufs (1x) - Aliment brut [blancs d'oeufs vieillis]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('blancs d'oeufs', 14)
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

-- branche de thym (2x) - Aliment brut [branches de thym]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('branche de thym', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- brin de thym (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('brin de thym', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- brisée (1x) - Aliment brut [brisées]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('brisée', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- café fort (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('café fort', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- calamar (1x) - Aliment brut [calamars]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('calamar', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- calvado (1x) - Aliment brut [calvados]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('calvado', 14)
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

-- cerneau de noix (1x) - Aliment brut [cerneaux de noix]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cerneau de noix', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- champignon (5x) - Aliment brut [champignons]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('champignon', 3)
ON CONFLICT (canonical_name) DO NOTHING;

-- champignons noir (1x) - Aliment brut [champignons noirs]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('champignons noir', 3)
ON CONFLICT (canonical_name) DO NOTHING;

-- chip de maïs (1x) - Aliment brut [chips de maïs]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('chip de maïs', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- chocolat noir (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('chocolat noir', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- chèvre (1x) - Aliment brut [chèvre frais]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('chèvre', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- cidre brut (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cidre brut', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- citron bio (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('citron bio', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- cive (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cive', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- cognac (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cognac', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- coleslaw (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('coleslaw', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- crème (17x) - Aliment brut [crème fraîche]
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

-- câpre (3x) - Aliment brut [câpres]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('câpre', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- céleri (4x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('céleri', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- côtelette d'agneau (1x) - Aliment brut [côtelettes d'agneau]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('côtelette d'agneau', 9)
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

-- escargot (1x) - Aliment brut [escargots]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('escargot', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- farine (53x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('farine', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- farine de sarrasin (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('farine de sarrasin', 5)
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

-- fleur de sel (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fleur de sel', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage (2x) - Aliment brut [fromage frais]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fromage', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage blanc (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fromage blanc', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage de chèvre (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fromage de chèvre', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- fruit rouge mélangé (1x) - Aliment brut [fruits rouges mélangés]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fruit rouge mélangé', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- fécule de maï (1x) - Aliment brut [fécule de maïs]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('fécule de maï', 14)
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

-- gousse d'ail (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('gousse d'ail', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- graine de chia (2x) - Aliment brut [graines de chia]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('graine de chia', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- graine de sésame (3x) - Aliment brut [graines de sésame]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('graine de sésame', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- graines sésame (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('graines sésame', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- haricot noir (1x) - Aliment brut [haricots noirs]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('haricot noir', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- haricot rouge (2x) - Aliment brut [haricots rouges]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('haricot rouge', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots blancs (1x) - Aliment brut [haricots blancs secs]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('haricots blancs', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots blancs sauce tomate (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('haricots blancs sauce tomate', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- herbes italienne (1x) - Aliment brut [herbes italiennes]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('herbes italienne', 10)
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

-- jaune d'œuf (1x) - Aliment brut [jaunes d'œufs]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('jaune d'œuf', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes oeuf (1x) - Aliment brut [jaunes oeufs]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('jaunes oeuf', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- jus citron (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('jus citron', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- ketchup (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('ketchup', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- lait végétal (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('lait végétal', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- lentille corail (2x) - Aliment brut [lentilles corail]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('lentille corail', 2)
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

-- levure de bière (1x) - Aliment brut [levure de bière fraîche]
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

-- maïzena (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('maïzena', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- mie de pain (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('mie de pain', 5)
ON CONFLICT (canonical_name) DO NOTHING;

-- mirin (5x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('mirin', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- moutarde de Dijon (2x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('moutarde de Dijon', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- mozzarella (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('mozzarella', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- muffins anglais (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('muffins anglais', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- noisette (1x) - Aliment brut [noisettes]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('noisette', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- noix de muscade (5x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('noix de muscade', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- nuoc mam (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('nuoc mam', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- nuoc-mâm (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('nuoc-mâm', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs (1x) - Aliment brut [oeufs entiers]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oeufs', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs (4 gros) (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oeufs (4 gros)', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs dur (1x) - Aliment brut [oeufs durs]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('oeufs dur', 14)
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

-- olive noire (1x) - Aliment brut [olives noires]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('olive noire', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- olive noire dénoyautée (1x) - Aliment brut [olives noires dénoyautées]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('olive noire dénoyautée', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- pain d'épice (1x) - Aliment brut [pain d'épices]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pain d'épice', 5)
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

-- petit oignon (1x) - Aliment brut [petits oignons]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('petit oignon', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- petits oignons blanc (1x) - Aliment brut [petits oignons blancs]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('petits oignons blanc', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- petits oignons grelot (1x) - Aliment brut [petits oignons grelots]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('petits oignons grelot', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- pignon (1x) - Aliment brut [pignons]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pignon', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- pignon de pin (3x) - Aliment brut [pignons de pin]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pignon de pin', 14)
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

-- poivre en grain (1x) - Aliment brut [poivre en grains]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivre en grain', 10)
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

-- poivrons jaune (1x) - Aliment brut [poivrons jaunes]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivrons jaune', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivrons rouge (2x) - Aliment brut [poivrons rouges]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivrons rouge', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- poudre d'amande (3x) - Aliment brut [poudre d'amandes]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poudre d'amande', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- poule (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poule', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet (1,5 kg) (3x) - Aliment brut [poulet fermier (1,5 kg)]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poulet (1,5 kg)', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet (1,8 kg) (1x) - Aliment brut [poulet fermier (1,8 kg)]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poulet (1,8 kg)', 9)
ON CONFLICT (canonical_name) DO NOTHING;

-- pour dorure (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pour dorure', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- pousse de soja (2x) - Aliment brut [pousses de soja]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pousse de soja', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- pruneau dénoyauté (1x) - Aliment brut [pruneaux dénoyautés]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pruneau dénoyauté', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- pruneaux (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pruneaux', 1)
ON CONFLICT (canonical_name) DO NOTHING;

-- pépite de chocolat (1x) - Aliment brut [pépites de chocolat]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pépite de chocolat', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- pépites chocolat (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('pépites chocolat', 14)
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

-- sherry (1x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sherry', 14)
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

-- tomate cerise (1x) - Aliment brut [tomates cerises]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tomate cerise', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- tomme (1x) - Aliment brut [tomme fraîche]
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

-- vert (2x) - Aliment brut [verts]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vert', 14)
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

-- épinards (2x) - Aliment brut [épinards frais]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('épinards', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- œuf (3x) - Aliment brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('œuf', 14)
ON CONFLICT (canonical_name) DO NOTHING;


-- ARCHETYPES

-- agneau haché (1x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('agneau haché', 9)
ON CONFLICT (name) DO NOTHING;

-- ail en poudre (2x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('ail en poudre', 2)
ON CONFLICT (name) DO NOTHING;

-- amande effilée (2x) - Transformation [amandes effilées]
INSERT INTO archetypes (name, category_id)
VALUES ('amande effilée', 14)
ON CONFLICT (name) DO NOTHING;

-- andouillette (1x) - Charcuterie [andouillettes de Troyes]
INSERT INTO archetypes (name, category_id)
VALUES ('andouillette', 9)
ON CONFLICT (name) DO NOTHING;

-- bacon (4x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('bacon', 9)
ON CONFLICT (name) DO NOTHING;

-- baguette (2x) - Pain
INSERT INTO archetypes (name, category_id)
VALUES ('baguette', 5)
ON CONFLICT (name) DO NOTHING;

-- blanc d'oeuf (3x) - Partie d'œuf [blancs d'oeufs]
INSERT INTO archetypes (name, category_id)
VALUES ('blanc d'oeuf', 7)
ON CONFLICT (name) DO NOTHING;

-- boeuf haché (6x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('boeuf haché', 9)
ON CONFLICT (name) DO NOTHING;

-- boudins noir (1x) - Charcuterie [boudins noirs]
INSERT INTO archetypes (name, category_id)
VALUES ('boudins noir', 9)
ON CONFLICT (name) DO NOTHING;

-- bouillon (10x) - Bouillon
INSERT INTO archetypes (name, category_id)
VALUES ('bouillon', 14)
ON CONFLICT (name) DO NOTHING;

-- bouillon de boeuf (5x) - Bouillon
INSERT INTO archetypes (name, category_id)
VALUES ('bouillon de boeuf', 14)
ON CONFLICT (name) DO NOTHING;

-- chair à saucisse (1x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('chair à saucisse', 9)
ON CONFLICT (name) DO NOTHING;

-- chapelure (6x) - Céréale transformée
INSERT INTO archetypes (name, category_id)
VALUES ('chapelure', 5)
ON CONFLICT (name) DO NOTHING;

-- chapelure panko (3x) - Céréale transformée
INSERT INTO archetypes (name, category_id)
VALUES ('chapelure panko', 5)
ON CONFLICT (name) DO NOTHING;

-- chorizo (1x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('chorizo', 9)
ON CONFLICT (name) DO NOTHING;

-- cinq épice (1x) - Mélange d'épices [cinq épices]
INSERT INTO archetypes (name, category_id)
VALUES ('cinq épice', 10)
ON CONFLICT (name) DO NOTHING;

-- comté râpé (1x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('comté râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- confit de canard (1x) - Viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('confit de canard', 9)
ON CONFLICT (name) DO NOTHING;

-- coriandre moulue (2x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('coriandre moulue', 10)
ON CONFLICT (name) DO NOTHING;

-- crevettes cuite (1x) - Transformation [crevettes cuites]
INSERT INTO archetypes (name, category_id)
VALUES ('crevettes cuite', 9)
ON CONFLICT (name) DO NOTHING;

-- crème liquide (4x) - Crème transformée
INSERT INTO archetypes (name, category_id)
VALUES ('crème liquide', 7)
ON CONFLICT (name) DO NOTHING;

-- cumin moulu (1x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('cumin moulu', 10)
ON CONFLICT (name) DO NOTHING;

-- curry (1x) - Mélange d'épices
INSERT INTO archetypes (name, category_id)
VALUES ('curry', 10)
ON CONFLICT (name) DO NOTHING;

-- escalope de porc (1x) - Viande préparée [escalopes de porc]
INSERT INTO archetypes (name, category_id)
VALUES ('escalope de porc', 9)
ON CONFLICT (name) DO NOTHING;

-- escalope de poulet (2x) - Viande préparée [escalopes de poulet]
INSERT INTO archetypes (name, category_id)
VALUES ('escalope de poulet', 9)
ON CONFLICT (name) DO NOTHING;

-- escalope de veau (1x) - Viande préparée [escalopes de veau]
INSERT INTO archetypes (name, category_id)
VALUES ('escalope de veau', 9)
ON CONFLICT (name) DO NOTHING;

-- escalopes de veau (70 g) (1x) - Viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('escalopes de veau (70 g)', 9)
ON CONFLICT (name) DO NOTHING;

-- feuille de brick (1x) - Produit transformé [feuilles de brick]
INSERT INTO archetypes (name, category_id)
VALUES ('feuille de brick', 5)
ON CONFLICT (name) DO NOTHING;

-- flocon d'avoine (5x) - Céréale transformée [flocons d'avoine]
INSERT INTO archetypes (name, category_id)
VALUES ('flocon d'avoine', 5)
ON CONFLICT (name) DO NOTHING;

-- fromage râpé (9x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('fromage râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- galette de riz (2x) - Produit transformé [galettes de riz]
INSERT INTO archetypes (name, category_id)
VALUES ('galette de riz', 5)
ON CONFLICT (name) DO NOTHING;

-- galettes chinoise (1x) - Produit transformé [galettes chinoises]
INSERT INTO archetypes (name, category_id)
VALUES ('galettes chinoise', 5)
ON CONFLICT (name) DO NOTHING;

-- garam masala (1x) - Mélange d'épices
INSERT INTO archetypes (name, category_id)
VALUES ('garam masala', 10)
ON CONFLICT (name) DO NOTHING;

-- gruyère râpé (4x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('gruyère râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- guanciale (1x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('guanciale', 9)
ON CONFLICT (name) DO NOTHING;

-- herbes de Provence (4x) - Mélange d'épices
INSERT INTO archetypes (name, category_id)
VALUES ('herbes de Provence', 10)
ON CONFLICT (name) DO NOTHING;

-- huile d'olive (76x) - Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('huile d'olive', 11)
ON CONFLICT (name) DO NOTHING;

-- huile de coco (1x) - Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('huile de coco', 11)
ON CONFLICT (name) DO NOTHING;

-- huile de friture (4x) - Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('huile de friture', 11)
ON CONFLICT (name) DO NOTHING;

-- huile de sésame (3x) - Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('huile de sésame', 11)
ON CONFLICT (name) DO NOTHING;

-- jambon (3x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('jambon', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon blanc (2x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('jambon blanc', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon cru (1x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('jambon cru', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon cuit (1x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('jambon cuit', 14)
ON CONFLICT (name) DO NOTHING;

-- jambon ibérique (1x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('jambon ibérique', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon serrano (2x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('jambon serrano', 9)
ON CONFLICT (name) DO NOTHING;

-- jambon à l'o (1x) - Charcuterie [jambon à l'os]
INSERT INTO archetypes (name, category_id)
VALUES ('jambon à l'o', 9)
ON CONFLICT (name) DO NOTHING;

-- jaune d'oeuf (8x) - Partie d'œuf [jaunes d'oeufs]
INSERT INTO archetypes (name, category_id)
VALUES ('jaune d'oeuf', 7)
ON CONFLICT (name) DO NOTHING;

-- jaune d'oeuf pour dorure (1x) - Partie d'œuf
INSERT INTO archetypes (name, category_id)
VALUES ('jaune d'oeuf pour dorure', 7)
ON CONFLICT (name) DO NOTHING;

-- jus de citron (15x) - Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('jus de citron', 1)
ON CONFLICT (name) DO NOTHING;

-- jus de citron vert (2x) - Extraction
INSERT INTO archetypes (name, category_id)
VALUES ('jus de citron vert', 1)
ON CONFLICT (name) DO NOTHING;

-- lardon (3x) - Charcuterie [lardons]
INSERT INTO archetypes (name, category_id)
VALUES ('lardon', 9)
ON CONFLICT (name) DO NOTHING;

-- lardons fumé (2x) - Transformation [lardons fumés]
INSERT INTO archetypes (name, category_id)
VALUES ('lardons fumé', 14)
ON CONFLICT (name) DO NOTHING;

-- lasagne (1x) - Céréale transformée [lasagnes]
INSERT INTO archetypes (name, category_id)
VALUES ('lasagne', 5)
ON CONFLICT (name) DO NOTHING;

-- magrets de canard (1x) - Viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('magrets de canard', 9)
ON CONFLICT (name) DO NOTHING;

-- morue dessalée (1x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('morue dessalée', 9)
ON CONFLICT (name) DO NOTHING;

-- nouilles ramen (1x) - Céréale transformée
INSERT INTO archetypes (name, category_id)
VALUES ('nouilles ramen', 5)
ON CONFLICT (name) DO NOTHING;

-- pain (1x) - Pain
INSERT INTO archetypes (name, category_id)
VALUES ('pain', 5)
ON CONFLICT (name) DO NOTHING;

-- pain de campagne (2x) - Pain
INSERT INTO archetypes (name, category_id)
VALUES ('pain de campagne', 5)
ON CONFLICT (name) DO NOTHING;

-- pain de mie (5x) - Pain
INSERT INTO archetypes (name, category_id)
VALUES ('pain de mie', 5)
ON CONFLICT (name) DO NOTHING;

-- pain rassis (1x) - Pain
INSERT INTO archetypes (name, category_id)
VALUES ('pain rassis', 5)
ON CONFLICT (name) DO NOTHING;

-- paprika fumé (2x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('paprika fumé', 10)
ON CONFLICT (name) DO NOTHING;

-- parmesan râpé (6x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('parmesan râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- paupiettes de veau (1x) - Viande préparée
INSERT INTO archetypes (name, category_id)
VALUES ('paupiettes de veau', 9)
ON CONFLICT (name) DO NOTHING;

-- penne (1x) - Céréale transformée
INSERT INTO archetypes (name, category_id)
VALUES ('penne', 5)
ON CONFLICT (name) DO NOTHING;

-- persil haché (3x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('persil haché', 10)
ON CONFLICT (name) DO NOTHING;

-- pois chiches cuit (1x) - Transformation [pois chiches cuits]
INSERT INTO archetypes (name, category_id)
VALUES ('pois chiches cuit', 5)
ON CONFLICT (name) DO NOTHING;

-- poitrine fumée (1x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('poitrine fumée', 14)
ON CONFLICT (name) DO NOTHING;

-- poivre moulu (1x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('poivre moulu', 10)
ON CONFLICT (name) DO NOTHING;

-- porc haché (1x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('porc haché', 9)
ON CONFLICT (name) DO NOTHING;

-- pâte brisée (1x) - Céréale transformée
INSERT INTO archetypes (name, category_id)
VALUES ('pâte brisée', 5)
ON CONFLICT (name) DO NOTHING;

-- pâte feuilletée (4x) - Céréale transformée
INSERT INTO archetypes (name, category_id)
VALUES ('pâte feuilletée', 5)
ON CONFLICT (name) DO NOTHING;

-- pâte à pizza (1x) - Céréale transformée
INSERT INTO archetypes (name, category_id)
VALUES ('pâte à pizza', 5)
ON CONFLICT (name) DO NOTHING;

-- pâtes courte (1x) - Céréale transformée [pâtes courtes]
INSERT INTO archetypes (name, category_id)
VALUES ('pâtes courte', 5)
ON CONFLICT (name) DO NOTHING;

-- quatre-épice (1x) - Mélange d'épices [quatre-épices]
INSERT INTO archetypes (name, category_id)
VALUES ('quatre-épice', 10)
ON CONFLICT (name) DO NOTHING;

-- riz cuit froid (1x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('riz cuit froid', 5)
ON CONFLICT (name) DO NOTHING;

-- sauce d'huître (2x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce d'huître', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce hoisin (1x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce hoisin', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce soja (14x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce soja', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce soja claire (1x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce soja claire', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce soja foncée (1x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce soja foncée', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce tomate (1x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce tomate', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce tonkatsu (1x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce tonkatsu', 14)
ON CONFLICT (name) DO NOTHING;

-- saucisse de strasbourg (1x) - Charcuterie [saucisses de Strasbourg]
INSERT INTO archetypes (name, category_id)
VALUES ('saucisse de strasbourg', 9)
ON CONFLICT (name) DO NOTHING;

-- saucisse de toulouse (1x) - Charcuterie [saucisses de Toulouse]
INSERT INTO archetypes (name, category_id)
VALUES ('saucisse de toulouse', 9)
ON CONFLICT (name) DO NOTHING;

-- saucisses fumée (1x) - Transformation [saucisses fumées]
INSERT INTO archetypes (name, category_id)
VALUES ('saucisses fumée', 14)
ON CONFLICT (name) DO NOTHING;

-- saucisses porc (1x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('saucisses porc', 9)
ON CONFLICT (name) DO NOTHING;

-- saucisson de Lyon pistaché 800g (1x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('saucisson de Lyon pistaché 800g', 9)
ON CONFLICT (name) DO NOTHING;

-- saumon fumé (3x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('saumon fumé', 9)
ON CONFLICT (name) DO NOTHING;

-- semoule (2x) - Céréale transformée
INSERT INTO archetypes (name, category_id)
VALUES ('semoule', 5)
ON CONFLICT (name) DO NOTHING;

-- spaghetti (3x) - Céréale transformée
INSERT INTO archetypes (name, category_id)
VALUES ('spaghetti', 5)
ON CONFLICT (name) DO NOTHING;

-- sucre semoule (3x) - Céréale transformée
INSERT INTO archetypes (name, category_id)
VALUES ('sucre semoule', 5)
ON CONFLICT (name) DO NOTHING;

-- tomate concassée (5x) - Transformation [tomates concassées]
INSERT INTO archetypes (name, category_id)
VALUES ('tomate concassée', 2)
ON CONFLICT (name) DO NOTHING;

-- tomate pelée (2x) - Transformation [tomates pelées]
INSERT INTO archetypes (name, category_id)
VALUES ('tomate pelée', 2)
ON CONFLICT (name) DO NOTHING;

-- tortilla (1x) - Produit transformé [tortillas]
INSERT INTO archetypes (name, category_id)
VALUES ('tortilla', 5)
ON CONFLICT (name) DO NOTHING;

-- vermicelle (2x) - Céréale transformée
INSERT INTO archetypes (name, category_id)
VALUES ('vermicelle', 5)
ON CONFLICT (name) DO NOTHING;

-- vermicelle de riz (3x) - Céréale transformée [vermicelles de riz]
INSERT INTO archetypes (name, category_id)
VALUES ('vermicelle de riz', 5)
ON CONFLICT (name) DO NOTHING;

-- viande d'agneau hachée (2x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('viande d'agneau hachée', 9)
ON CONFLICT (name) DO NOTHING;

-- vinaigre de cidre (2x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre de cidre', 14)
ON CONFLICT (name) DO NOTHING;

-- vinaigre de riz (3x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre de riz', 14)
ON CONFLICT (name) DO NOTHING;

-- vinaigre de xérè (1x) - Préparation [vinaigre de xérès]
INSERT INTO archetypes (name, category_id)
VALUES ('vinaigre de xérè', 14)
ON CONFLICT (name) DO NOTHING;

COMMIT;
