-- Insertion des ingrédients manquants V2
-- Généré automatiquement (version corrigée)
-- ======================================================================

BEGIN;

-- =====================================================
-- CANONICAL FOODS (aliments de base)
-- =====================================================

-- beurre (utilisé 61x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('beurre', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- farine (utilisé 53x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('farine', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre (utilisé 39x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- eau (utilisé 27x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('eau', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- gousse d'ail (utilisé 27x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('gousse d''ail', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- huile (utilisé 25x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('huile', 11, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jus de citron (utilisé 15x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jus de citron', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sauce soja (utilisé 14x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sauce soja', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin blanc (utilisé 11x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin blanc', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaune d'oeuf (utilisé 10x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaune d''oeuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bouillon (utilisé 10x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bouillon', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bouquet garni (utilisé 9x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bouquet garni', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivron rouge (utilisé 8x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivron rouge', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- basilic frais (utilisé 8x)(juste basilic)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('basilic frais', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin blanc sec (utilisé 8x)A + (pas besoin de sec)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin blanc sec', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure chimique (utilisé 6x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure chimique', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chapelure (utilisé 6x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chapelure', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- flocon d'avoine (utilisé 5x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('flocon d''avoine', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain de mie (utilisé 5x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain de mie', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- persil frais (utilisé 5x)(pas besoin de frais)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('persil frais', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mirin (utilisé 5x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mirin', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tahini (utilisé 5x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tahini', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poireal (utilisé 5x)(connait pas cette igrédient)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poireal', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- champignon (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('champignon', 3, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- crème (utilisé 5x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('crème', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- œuf (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('œuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bicarbonate (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bicarbonate', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bacon (utilisé 4x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bacon', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- céleri (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('céleri', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- herbe de Provence (utilisé 4x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('herbe de Provence', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poudre d'amande (utilisé 4x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poudre d''amande', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet fermier (1,5 kg) (utilisé 4x)juste poulet
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poulet fermier (1,5 kg)', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre glace (utilisé 4x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre glace', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- aneth frais (utilisé 3x)(pas besoin de frais)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('aneth frais', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- yaourt grec (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('yaourt grec', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vermicelle de riz (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vermicelle de riz', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- salade (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('salade', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- menthe fraîche (utilisé 3x)(pas besoin de frais)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('menthe fraîche', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- câpre (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('câpre', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- coriandre fraîche (utilisé 3x)(pas besoin de frais)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('coriandre fraîche', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mozzarella (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mozzarella', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin rouge (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin rouge', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- graine de sésame (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('graine de sésame', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pignon de pin (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pignon de pin', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lardon (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lardon', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cognac (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cognac', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chapelure panko (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chapelure panko', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- branche de thym (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('branche de thym', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- maïzena (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('maïzena', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- ketchup (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('ketchup', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre de riz (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre de riz', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rhum (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rhum', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- spaghetti (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('spaghetti', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cassonade (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cassonade', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chocolat noir (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chocolat noir', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- blanc d'oeuf (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('blanc d''oeuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre semoule (utilisé 3x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre semoule', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- graine de chia (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('graine de chia', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lait végétal (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lait végétal', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- yaourt nature (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('yaourt nature', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sirop d'agave (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sirop d''agave', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- épinard frais (utilisé 2x)(pas besoin de frais)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('épinard frais', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- amande effilée (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('amande effilée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain de campagne (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain de campagne', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre blanc (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre blanc', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon serrano (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon serrano', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- dashi (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('dashi', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jus de citron vert (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jus de citron vert', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- baguette (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('baguette', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage frais (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fromage frais', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pousse de soja (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pousse de soja', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- galette de riz (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('galette de riz', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- semoule (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('semoule', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- persil plat (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('persil plat', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lentille corail (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lentille corail', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- viande d'agneau (utilisé 2x)juste agneau ou préciser piece de viande et mettre en archétype
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('viande d''agneau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vermicelle (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vermicelle', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure boulanger (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure boulanger', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escalope de poulet (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escalope de poulet', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- branche de céleri (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('branche de céleri', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- boeuf à braiser (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('boeuf à braiser', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- moutarde de Dijon (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('moutarde de Dijon', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- haricot rouge (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('haricot rouge', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sauce d'huître (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sauce d''huître', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre de cidre (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre de cidre', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lapin découpé (utilisé 2x)juste lapin
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lapin découpé', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pecorino romano (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pecorino romano', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre blanc (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre blanc', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon blanc (utilisé 2x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon blanc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pavé saumon 150g (utilisé 2x)A et pas de poids dans le nom
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pavé saumon 150g', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- girofle (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('girofle', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vert (utilisé 2x)?? pas de sens
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vert', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- garni (utilisé 2x) ?? pas de sens
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('garni', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fruit rouges mélangé (utilisé 1x) pas un bon ingrédient
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fruit rouges mélangé', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- feta (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('feta', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- noisette (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('noisette', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cerneal de noix (utilisé 1x)cerneau de noix
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cerneal de noix', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saucisse porc (utilisé 1x)saucisse DE porc + A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisse porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- muffin anglais (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('muffin anglais', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- huile végétale (utilisé 1x)A maisodublon avec juste huile
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('huile végétale', 11, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre de xérè (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre de xérè', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain rassis (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain rassis', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon ibérique (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon ibérique', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeuf dur (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeuf dur', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- nuoc mam (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('nuoc mam', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- eau de cuisson (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('eau de cuisson', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chip de maï (utilisé 1x)chips de maïs + A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chip de maï', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage de chèvre (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fromage de chèvre', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- figue fraîche (utilisé 1x)(pas besoin de frais)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('figue fraîche', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- St Môret (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('St Môret', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saumon frais (utilisé 1x)(pas besoin de frais)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saumon frais', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fécule de maï (utilisé 1x)déja maizena dans la liste
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fécule de maï', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pimiento de Padrón (utilisé 1x)dans cultivar
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pimiento de Padrón', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- ail (facultatif) (utilisé 1x)déja gousse d'ail dans la liste
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('ail (facultatif)', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sherry (utilisé 1x)?? pas de sens
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sherry', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pois chiches sec (utilisé 1x)juste pois chiches
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pois chiches sec', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- feuille de brick (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('feuille de brick', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- champignon noir (utilisé 1x)pas précis ou trop précis
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('champignon noir', 3, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- nuoc-mâm (utilisé 1x)déja présent dans la liste sans le trait d'union
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('nuoc-mâm', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- morue dessalée (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('morue dessalée', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cive (utilisé 1x)?? pas de sens
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cive', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- quatre-épice (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('quatre-épice', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- riz Arborio (utilisé 1x)cultivar
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('riz Arborio', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure de bière fraîche (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure de bière fraîche', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- malt d'orge ou sucre (utilisé 1x)pas de sens il y a plusieurs ingrédients
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('malt d''orge ou sucre', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivron jaune (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivron jaune', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tomate cerise (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tomate cerise', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre balsamique (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre balsamique', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- artichaut violets moyen (utilisé 1x) trop précis
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('artichaut violets moyen', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain (utilisé 1x)déja dans la liste
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaune d'œuf (utilisé 1x)déja dans la liste
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaune d''œuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- haricot blancs sec (utilisé 1x)juste haricot blancs
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('haricot blancs sec', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pâte courte (utilisé 1x)pas assez précis et archétype
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pâte courte', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saucisse de Strasbourg (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisse de Strasbourg', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chorizo (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chorizo', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chèvre frais (utilisé 1x)A
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chèvre frais', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- eau tiède (utilisé 1x)juste eau et déja présent
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('eau tiède', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage blanc (utilisé 1x)déja présent
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fromage blanc', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- thym frais (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('thym frais', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- blanc de poulet (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('blanc de poulet', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cidre brut (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cidre brut', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- calvado (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('calvado', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet fermier (1,8 kg) (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poulet fermier (1,8 kg)', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- petit oignons grelot (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('petit oignons grelot', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- herbe italienne (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('herbe italienne', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- zeste de citron (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('zeste de citron', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escalope de veau (70 g) (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escalope de veau (70 g)', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon cru (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon cru', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sauge fraîche (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sauge fraîche', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escalope de veau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escalope de veau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- veau pour blanquette (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('veau pour blanquette', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- blanc de poireau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('blanc de poireau', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- petit oignons blanc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('petit oignons blanc', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rôti de veau sous-noix (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rôti de veau sous-noix', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tranche de bacon (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tranche de bacon', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tranche d'emmental (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tranche d''emmental', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sauté de veau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sauté de veau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- paupiette de veau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('paupiette de veau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- petit oignon (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('petit oignon', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin rouge de Bourgogne (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin rouge de Bourgogne', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- paleron de boeuf (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('paleron de boeuf', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bière ambrée (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bière ambrée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain d'épice (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain d''épice', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- brin de thym (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('brin de thym', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- steak de boeuf 180g (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('steak de boeuf 180g', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre en grain (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivre en grain', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- entrecôte de boeuf (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('entrecôte de boeuf', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre d'estragon (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre d''estragon', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- estragon frais (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('estragon frais', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bavette ou rumsteck de boeuf (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bavette ou rumsteck de boeuf', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- boeuf à mijoter (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('boeuf à mijoter', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sauce soja claire (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sauce soja claire', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sauce soja foncée (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sauce soja foncée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pomme ou poire (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pomme ou poire', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saké (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saké', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oignon vert (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oignon vert', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rôti de porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rôti de porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- anana (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('anana', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saucisse de Toulouse (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisse de Toulouse', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- traver de porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('traver de porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- échine de porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('échine de porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- coleslaw (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('coleslaw', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tortilla (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tortilla', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escalope de porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escalope de porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sauce tonkatsu (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sauce tonkatsu', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon à l'o (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon à l''o', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- madère (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('madère', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- gigot d'agneau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('gigot d''agneau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- épaule d'agneau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('épaule d''agneau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- côtelette d'agneau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('côtelette d''agneau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pignon (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pignon', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- magret de canard (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('magret de canard', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre vert (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivre vert', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sauce hoisin (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sauce hoisin', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cinq épice (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cinq épice', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- galette chinoise (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('galette chinoise', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- andouillette de Troye (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('andouillette de Troye', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- boudin noir (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('boudin noir', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saucisson de Lyon pistaché 800g (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisson de Lyon pistaché 800g', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure de boulanger (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure de boulanger', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaune d'oeuf pour dorure (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaune d''oeuf pour dorure', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pruneal (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pruneal', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vanille liquide (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vanille liquide', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- farine de sarrasin (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('farine de sarrasin', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- riz bomba (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('riz bomba', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet découpé (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poulet découpé', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- garrofó (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('garrofó', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- calamar (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('calamar', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- penne (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('penne', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rouge (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rouge', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- olive noire (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('olive noire', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- guanciale (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('guanciale', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tonnarelli (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tonnarelli', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- biscuit Graham (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('biscuit Graham', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre brun (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre brun', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pépite de chocolat (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pépite de chocolat', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- farine T65 (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('farine T65', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure boulanger fraîche (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure boulanger fraîche', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeuf (4) (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeuf (4)', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pépite chocolat (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pépite chocolat', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- beurre noisette (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('beurre noisette', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jus citron (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jus citron', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oignon rouge (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oignon rouge', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- riz arborio (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('riz arborio', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tomme fraîche (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tomme fraîche', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rhum ambré (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rhum ambré', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- blanc d'oeufs vieillis (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('blanc d''oeufs vieillis', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- huile neutre (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('huile neutre', 11, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pavé saumon (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pavé saumon', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- graine sésame (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('graine sésame', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- haricot noir (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('haricot noir', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- maï (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('maï', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lasagne (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lasagne', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- trofie ou linguine (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('trofie ou linguine', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tofu ferme (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tofu ferme', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- huile sésame (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('huile sésame', 11, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pois mange-tout (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pois mange-tout', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- raisin sec (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('raisin sec', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- paneer (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('paneer', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- nouille ramen (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('nouille ramen', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poitrine de porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poitrine de porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sablée (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sablée', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeuf pour meringue (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeuf pour meringue', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre pour meringue (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre pour meringue', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaune oeuf (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaune oeuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- café fort (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('café fort', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cuillère (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cuillère', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- amaretto (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('amaretto', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- brisée (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('brisée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pour dorure (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pour dorure', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- boeuf (gîte, paleron) (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('boeuf (gîte, paleron)', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- farine T45 (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('farine T45', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- beurre de tourage (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('beurre de tourage', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poule (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poule', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chair à saucisse (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chair à saucisse', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mie de pain (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mie de pain', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escargot (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escargot', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;


-- =====================================================
-- ARCHETYPES (transformations, préparations)
-- =====================================================

-- huile d'olive (utilisé 76x)
-- TODO: Lier à canonical_food_id pour 'huile d'olive'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'huile d''olive',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: huile d''olive'
)
ON CONFLICT (name) DO NOTHING;

-- cumin (utilisé 17x)
-- TODO: Lier à canonical_food_id pour 'cumin'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'cumin',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: cumin'
)
ON CONFLICT (name) DO NOTHING;

-- crème fraîche (utilisé 17x)
-- TODO: Lier à canonical_food_id pour 'crème'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'crème fraîche',
  'frais',
  NOW(),
  NOW(),
  'Auto-généré - base: crème'
)
ON CONFLICT (name) DO NOTHING;

-- cannelle (utilisé 13x)
-- TODO: Lier à canonical_food_id pour 'cannelle'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'cannelle',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: cannelle'
)
ON CONFLICT (name) DO NOTHING;

-- paprika (utilisé 13x)
-- TODO: Lier à canonical_food_id pour 'paprika'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'paprika',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: paprika'
)
ON CONFLICT (name) DO NOTHING;

-- fromage râpé (utilisé 9x)
-- TODO: Lier à canonical_food_id pour 'fromage'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'fromage râpé',
  'râpage',
  NOW(),
  NOW(),
  'Auto-généré - base: fromage'
)
ON CONFLICT (name) DO NOTHING;

-- boeuf haché (utilisé 6x)
-- TODO: Lier à canonical_food_id pour 'boeuf'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'boeuf haché',
  'hachage',
  NOW(),
  NOW(),
  'Auto-généré - base: boeuf'
)
ON CONFLICT (name) DO NOTHING;

-- parmesan râpé (utilisé 6x)
-- TODO: Lier à canonical_food_id pour 'parmesan'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'parmesan râpé',
  'râpage',
  NOW(),
  NOW(),
  'Auto-généré - base: parmesan'
)
ON CONFLICT (name) DO NOTHING;

-- tomate concassée (utilisé 5x)
-- TODO: Lier à canonical_food_id pour 'tomate concassée'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'tomate concassée',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: tomate concassée'
)
ON CONFLICT (name) DO NOTHING;

-- noix de muscade (utilisé 5x)
-- TODO: Lier à canonical_food_id pour 'noix de muscade'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'noix de muscade',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: noix de muscade'
)
ON CONFLICT (name) DO NOTHING;

-- piment d'Espelette (utilisé 4x)
-- TODO: Lier à canonical_food_id pour 'piment d'Espelette'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'piment d''Espelette',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: piment d''Espelette'
)
ON CONFLICT (name) DO NOTHING;

-- gruyère râpé (utilisé 4x)
-- TODO: Lier à canonical_food_id pour 'gruyère'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'gruyère râpé',
  'râpage',
  NOW(),
  NOW(),
  'Auto-généré - base: gruyère'
)
ON CONFLICT (name) DO NOTHING;

-- crème liquide (utilisé 4x)
-- TODO: Lier à canonical_food_id pour 'crème liquide'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'crème liquide',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: crème liquide'
)
ON CONFLICT (name) DO NOTHING;

-- huile de friture (utilisé 4x)
-- TODO: Lier à canonical_food_id pour 'huile de friture'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'huile de friture',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: huile de friture'
)
ON CONFLICT (name) DO NOTHING;

-- beurre fondu (utilisé 3x)
-- TODO: Lier à canonical_food_id pour 'beurre fondu'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'beurre fondu',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: beurre fondu'
)
ON CONFLICT (name) DO NOTHING;

-- saumon fumé (utilisé 3x)
-- TODO: Lier à canonical_food_id pour 'saumon'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'saumon fumé',
  'fumage',
  NOW(),
  NOW(),
  'Auto-généré - base: saumon'
)
ON CONFLICT (name) DO NOTHING;

-- persil haché (utilisé 3x)
-- TODO: Lier à canonical_food_id pour 'persil'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'persil haché',
  'hachage',
  NOW(),
  NOW(),
  'Auto-généré - base: persil'
)
ON CONFLICT (name) DO NOTHING;

-- feuille de laurier (utilisé 3x)
-- TODO: Lier à canonical_food_id pour 'feuille de laurier'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'feuille de laurier',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: feuille de laurier'
)
ON CONFLICT (name) DO NOTHING;

-- huile de sésame (utilisé 3x)
-- TODO: Lier à canonical_food_id pour 'huile de sésame'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'huile de sésame',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: huile de sésame'
)
ON CONFLICT (name) DO NOTHING;

-- tomate pelée (utilisé 2x)
-- TODO: Lier à canonical_food_id pour 'tomate'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'tomate pelée',
  'épluchage',
  NOW(),
  NOW(),
  'Auto-généré - base: tomate'
)
ON CONFLICT (name) DO NOTHING;

-- paprika fumé (utilisé 2x)
-- TODO: Lier à canonical_food_id pour 'paprika'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'paprika fumé',
  'fumage',
  NOW(),
  NOW(),
  'Auto-généré - base: paprika'
)
ON CONFLICT (name) DO NOTHING;

-- coriandre moulue (utilisé 2x)
-- TODO: Lier à canonical_food_id pour 'coriandre'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'coriandre moulue',
  'broyage',
  NOW(),
  NOW(),
  'Auto-généré - base: coriandre'
)
ON CONFLICT (name) DO NOTHING;

-- lardon fumé (utilisé 2x)
-- TODO: Lier à canonical_food_id pour 'lardon'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'lardon fumé',
  'fumage',
  NOW(),
  NOW(),
  'Auto-généré - base: lardon'
)
ON CONFLICT (name) DO NOTHING;

-- ail en poudre (utilisé 2x)
-- TODO: Lier à canonical_food_id pour 'ail'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'ail en poudre',
  'séchage et broyage',
  NOW(),
  NOW(),
  'Auto-généré - base: ail'
)
ON CONFLICT (name) DO NOTHING;

-- viande d'agneau hachée (utilisé 2x)
-- TODO: Lier à canonical_food_id pour 'viande d'agneau'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'viande d''agneau hachée',
  'hachage',
  NOW(),
  NOW(),
  'Auto-généré - base: viande d''agneau'
)
ON CONFLICT (name) DO NOTHING;

-- beurre salé (utilisé 2x)
-- TODO: Lier à canonical_food_id pour 'beurre salé'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'beurre salé',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: beurre salé'
)
ON CONFLICT (name) DO NOTHING;

-- beurre mou (utilisé 2x)
-- TODO: Lier à canonical_food_id pour 'beurre mou'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'beurre mou',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: beurre mou'
)
ON CONFLICT (name) DO NOTHING;

-- huile de coco (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'huile de coco'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'huile de coco',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: huile de coco'
)
ON CONFLICT (name) DO NOTHING;

-- cumin moulu (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'cumin'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'cumin moulu',
  'broyage',
  NOW(),
  NOW(),
  'Auto-généré - base: cumin'
)
ON CONFLICT (name) DO NOTHING;

-- piment cayenne (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'piment cayenne'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'piment cayenne',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: piment cayenne'
)
ON CONFLICT (name) DO NOTHING;

-- cayenne (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'cayenne'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'cayenne',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: cayenne'
)
ON CONFLICT (name) DO NOTHING;

-- pois chiches cuit (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'pois chiches'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'pois chiches cuit',
  'cuisson',
  NOW(),
  NOW(),
  'Auto-généré - base: pois chiches'
)
ON CONFLICT (name) DO NOTHING;

-- olive noires dénoyautée (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'olive noires'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'olive noires dénoyautée',
  'dénoyautage',
  NOW(),
  NOW(),
  'Auto-généré - base: olive noires'
)
ON CONFLICT (name) DO NOTHING;

-- thon au naturel (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'thon'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'thon au naturel',
  'nature',
  NOW(),
  NOW(),
  'Auto-généré - base: thon'
)
ON CONFLICT (name) DO NOTHING;

-- piment de Cayenne (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'piment de Cayenne'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'piment de Cayenne',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: piment de Cayenne'
)
ON CONFLICT (name) DO NOTHING;

-- fleur de sel (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'fleur de sel'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'fleur de sel',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: fleur de sel'
)
ON CONFLICT (name) DO NOTHING;

-- curry (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'curry'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'curry',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: curry'
)
ON CONFLICT (name) DO NOTHING;

-- porc haché (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'porc'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'porc haché',
  'hachage',
  NOW(),
  NOW(),
  'Auto-généré - base: porc'
)
ON CONFLICT (name) DO NOTHING;

-- crevette cuite (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'crevette'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'crevette cuite',
  'cuisson',
  NOW(),
  NOW(),
  'Auto-généré - base: crevette'
)
ON CONFLICT (name) DO NOTHING;

-- comté râpé (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'comté'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'comté râpé',
  'râpage',
  NOW(),
  NOW(),
  'Auto-généré - base: comté'
)
ON CONFLICT (name) DO NOTHING;

-- poivre blanc (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'poivre blanc'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'poivre blanc',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: poivre blanc'
)
ON CONFLICT (name) DO NOTHING;

-- jambon cuit (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'jambon'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'jambon cuit',
  'cuisson',
  NOW(),
  NOW(),
  'Auto-généré - base: jambon'
)
ON CONFLICT (name) DO NOTHING;

-- poivre moulu (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'poivre'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'poivre moulu',
  'broyage',
  NOW(),
  NOW(),
  'Auto-généré - base: poivre'
)
ON CONFLICT (name) DO NOTHING;

-- jarret de veau en tranches de 4cm (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'jarret de veau de 4cm'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'jarret de veau en tranches de 4cm',
  'tranchage',
  NOW(),
  NOW(),
  'Auto-généré - base: jarret de veau de 4cm'
)
ON CONFLICT (name) DO NOTHING;

-- poitrine fumée (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'poitrine'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'poitrine fumée',
  'fumage',
  NOW(),
  NOW(),
  'Auto-généré - base: poitrine'
)
ON CONFLICT (name) DO NOTHING;

-- paprika dou (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'paprika dou'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'paprika dou',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: paprika dou'
)
ON CONFLICT (name) DO NOTHING;

-- saucisse fumée (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'saucisse'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'saucisse fumée',
  'fumage',
  NOW(),
  NOW(),
  'Auto-généré - base: saucisse'
)
ON CONFLICT (name) DO NOTHING;

-- agneau haché (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'agneau'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'agneau haché',
  'hachage',
  NOW(),
  NOW(),
  'Auto-généré - base: agneau'
)
ON CONFLICT (name) DO NOTHING;

-- poivre noir (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'poivre noir'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'poivre noir',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: poivre noir'
)
ON CONFLICT (name) DO NOTHING;

-- pruneal dénoyauté (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'pruneal'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'pruneal dénoyauté',
  'dénoyautage',
  NOW(),
  NOW(),
  'Auto-généré - base: pruneal'
)
ON CONFLICT (name) DO NOTHING;

-- garam masala (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'garam masala'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'garam masala',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: garam masala'
)
ON CONFLICT (name) DO NOTHING;

-- riz cuit froid (utilisé 1x)
-- TODO: Lier à canonical_food_id pour 'riz froid'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'riz cuit froid',
  'cuisson',
  NOW(),
  NOW(),
  'Auto-généré - base: riz froid'
)
ON CONFLICT (name) DO NOTHING;


COMMIT;

-- =====================================================
-- RÉSUMÉ
-- =====================================================
-- Total: 260 canonical_foods + 52 archetypes
--
-- NOTES:
-- - Les sous-recettes (bouillon, pâte feuilletée, etc.) doivent être
--   créées séparément dans la table 'recipes'
-- - Les archetypes avec TODO nécessitent de lier le canonical_food_id
--   correspondant après insertion
