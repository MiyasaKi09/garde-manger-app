-- INSERTION DES INGRÉDIENTS MANQUANTS V3
-- Classification intelligente et vérification des doublons
-- ======================================================================

BEGIN;

-- ======================================================================
-- CANONICAL FOODS
-- ======================================================================

-- beurre (utilisé 61x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('beurre', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- farine (utilisé 53x)
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

-- gousses d'ail (utilisé 25x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('gousses d''ail', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- huile (utilisé 25x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('huile', 11, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bouquet garni (utilisé 9x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bouquet garni', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes d'oeufs (utilisé 8x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaunes d''oeuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin blanc sec (utilisé 8x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin blanc', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- concentré de tomate (utilisé 7x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('concentré de tomate', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- parmesan (utilisé 7x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('parmesan', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure chimique (utilisé 6x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure chimique', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivron rouge (utilisé 6x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivron rouge', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chapelure (utilisé 6x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chapelure', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- flocons d'avoine (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('flocons d''avoine', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mirin (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mirin', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- crème (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('crème', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tahini (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tahini', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tomates concassées (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tomates concassée', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- champignons (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('champignon', 3, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bicarbonate (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bicarbonate', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bacon (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bacon', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pâte feuilletée (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pâte feuilletée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- herbes de Provence (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('herbes de Provence', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- crème liquide (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('crème liquide', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre glace (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre glace', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lait de coco (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lait de coco', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- yaourt grec (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('yaourt grec', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vermicelles de riz (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vermicelles de riz', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- salade (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('salade', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- câpres (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('câpre', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mozzarella (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mozzarella', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin rouge (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin rouge', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- graines de sésame (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('graines de sésame', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pignons de pin (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pignons de pin', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poudre d'amandes (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poudre d''amande', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lardons (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lardon', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- crème fraîche épaisse (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('crème épaisse', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet fermier (1,5 kg) (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poulet fermier (1,5 kg)', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cognac (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cognac', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chapelure panko (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chapelure panko', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- maïzena (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('maïzena', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- ketchup (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('ketchup', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rhum (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rhum', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- spaghetti (utilisé 3x)
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

-- blancs d'oeufs (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('blancs d''oeuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre semoule (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre semoule', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- graines de chia (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('graines de chia', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lait végétal (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lait végétal', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- yaourt nature (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('yaourt nature', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sirop d'agave (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sirop d''agave', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- amandes effilées (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('amandes effilée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre blanc (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre blanc', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon serrano (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon serrano', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- dashi (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('dashi', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- baguette (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('baguette', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage frais (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fromage', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pousses de soja (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pousses de soja', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- galettes de riz (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('galettes de riz', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- coulis de tomate (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('coulis de tomate', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- semoule (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('semoule', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivrons rouges (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivrons rouge', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- persil plat (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('persil plat', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lentilles corail (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lentilles corail', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- branche de céleri (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('céleri', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- viande d'agneau (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('viande d''agneau', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vermicelle (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vermicelle', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mayonnaise (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mayonnaise', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaune d'oeuf (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaune d''oeuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escalopes de poulet (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escalopes de poulet', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- gousse d'ail (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('gousse d''ail', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- boeuf à braiser (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('boeuf à braiser', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- branches de thym (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('branches de thym', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- moutarde de Dijon (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('moutarde de Dijon', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots rouges (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('haricots rouges', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lapin découpé (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lapin découpé', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- beurre salé (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('beurre salé', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pecorino romano (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pecorino romano', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- beurre mou (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('beurre mou', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre blanc (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre blanc', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon blanc (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon blanc', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pavés saumon 150g (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pavés saumon 150g', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- riz basmati (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('riz basmati', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- girofle (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('girofle', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- verts (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vert', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- garni (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('garni', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fruits rouges mélangés (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fruits rouges mélangés', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- feta (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('feta', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- œufs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('œuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- noisettes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('noisette', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lait concentré sucré (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lait concentré sucré', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cerneaux de noix (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cerneaux de noix', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saucisses porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisses porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- muffins anglais (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('muffins anglai', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- huile végétale (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('huile végétale', 11, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain rassis (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain rassi', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon ibérique (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon ibérique', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs durs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeufs dur', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- nuoc mam (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('nuoc mam', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- olives noires dénoyautées (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('olives noires dénoyautée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chips de maïs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chips de maïs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage de chèvre (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fromage de chèvre', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- thon au naturel (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('thon au naturel', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- St Môret (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('St Môret', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fécule de maïs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fécule de maïs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pimientos de Padrón (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pimientos de Padrón', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fleur de sel (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fleur de sel', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sherry (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sherry', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pois chiches secs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pois chiches secs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- feuilles de brick (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('feuilles de brick', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- champignons noirs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('champignons noir', 3, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- nuoc-mâm (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('nuoc-mâm', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cive (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cive', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- quatre-épices (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('quatre-épices', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- riz Arborio (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('riz Arborio', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure de bière fraîche (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure de bière', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivrons jaunes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivrons jaune', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tomates cerises (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tomates cerise', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre balsamique (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre balsamique', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- artichauts violets moyens (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('artichauts violets moyen', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes d'œufs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaunes d''œuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre blanc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivre blanc', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots blancs secs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('haricots blancs secs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pâtes courtes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pâtes courte', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saucisses de Strasbourg (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisses de Strasbourg', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure boulanger fraîche (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure boulanger', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pesto (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pesto', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chorizo (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chorizo', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chèvre frais (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chèvre', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pâte brisée (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pâte brisée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- eau tiède (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('eau tiède', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage blanc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fromage blanc', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- blancs de poulet (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('blancs de poulet', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cidre brut (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cidre brut', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- calvados (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('calvado', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet fermier (1,8 kg) (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poulet fermier (1,8 kg)', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- petits oignons grelots (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('petits oignons grelot', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- herbes italiennes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('herbes italiennes', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- zeste de citron (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('zeste de citron', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escalopes de veau (70 g) (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escalopes de veau (70 g)', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon cru (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon cru', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escalopes de veau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escalopes de veau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- veau pour blanquette (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('veau pour blanquette', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- blanc de poireau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('blanc de poireau', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- petits oignons blancs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('petits oignons blanc', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jarret de veau en tranches de 4cm (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jarret de veau en tranches de 4cm', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rôti de veau sous-noix (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rôti de veau sous-noix', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tranches de bacon (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tranches de bacon', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tranches d'emmental (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tranches d''emmental', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sauté de veau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sauté de veau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- paupiettes de veau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('paupiettes de veau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- petits oignons (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('petits oignon', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin rouge de Bourgogne (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin rouge de Bourgogne', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- paleron de boeuf (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('paleron de boeuf', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- feuilles de laurier (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('feuilles de laurier', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bière ambrée (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bière ambrée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain d'épices (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain d''épices', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- steaks de boeuf 180g (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('steaks de boeuf 180g', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre en grains (utilisé 1x)
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

-- boeuf à mijoter (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('boeuf à mijoter', 9, NOW(), NOW())
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

-- saucisses de Toulouse (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisses de Toulouse', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- travers de porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('travers de porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- échine de porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('échine de porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- coleslaw (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('coleslaw', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tortillas (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tortilla', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escalopes de porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escalopes de porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon à l'os (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon à l''o', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- madère (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('madère', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- gigot d'agneau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('gigot d''agneau', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- épaule d'agneau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('épaule d''agneau', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- côtelettes d'agneau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('côtelettes d''agneau', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pignons (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pignon', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- magrets de canard (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('magrets de canard', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre vert (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivre vert', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cinq épices (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cinq épices', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- galettes chinoises (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('galettes chinoise', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- confit de canard (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('confit de canard', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- andouillettes de Troyes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('andouillettes de Troye', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- boudins noirs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('boudins noir', 14, NOW(), NOW())
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

-- pruneaux (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pruneaux', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vanille liquide (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vanille liquide', 14, NOW(), NOW())
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

-- penne (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('penne', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rouge (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rouge', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- olives noires (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('olives noire', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- guanciale (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('guanciale', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tonnarelli (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tonnarelli', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre noir (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivre noir', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cream cheese (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cream cheese', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre brun (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre brun', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pépites de chocolat (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pépites de chocolat', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- farine T65 (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('farine T65', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs (4 gros) (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeufs (4 )', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pépites chocolat (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pépites chocolat', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- beurre noisette (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('beurre noisette', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jus citron (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jus citron', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre pour caramel (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre pour caramel', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- burger (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('burger', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cheddar (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cheddar', 14, NOW(), NOW())
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
VALUES ('tomme', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pruneaux dénoyautés (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pruneaux dénoyauté', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs entiers (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeufs entier', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rhum ambré (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rhum ambré', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- blancs d'oeufs vieillis (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('blancs d''oeufs vieilli', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- ganache chocolat (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('ganache chocolat', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- huile neutre (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('huile neutre', 11, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pavés saumon (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pavés saumon', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- graines sésame (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('graines sésame', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots noirs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('haricots noirs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lasagnes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lasagne', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- ricotta (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('ricotta', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pecorino (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pecorino', 14, NOW(), NOW())
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

-- raisins secs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('raisins sec', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- paneer (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('paneer', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- garam masala (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('garam masala', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- nouilles ramen (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('nouilles ramen', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poitrine de porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poitrine de porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sablée (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sablée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs pour meringue (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeufs pour meringue', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre pour meringue (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre pour meringue', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes oeufs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaunes oeuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mascarpone (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mascarpone', 14, NOW(), NOW())
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

-- brisées (utilisé 1x)
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

-- chair à saucisse (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chair à saucisse', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mie de pain (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mie de pain', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escargots (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escargot', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;


-- ======================================================================
-- ARCHETYPES
-- ======================================================================

-- huile d'olive (utilisé 76x)
-- Base: olive
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('huile d''olive', NULL, NOW(), NOW(), 'Base: olive')
ON CONFLICT (name) DO NOTHING;

-- cumin (utilisé 17x)
-- Base: cumin
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('cumin', 'broyage', NOW(), NOW(), 'Base: cumin')
ON CONFLICT (name) DO NOTHING;

-- gingembre (utilisé 16x)
-- Base: gingembre
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('gingembre', 'broyage', NOW(), NOW(), 'Base: gingembre')
ON CONFLICT (name) DO NOTHING;

-- jus de citron (utilisé 15x)
-- Base: citron
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('jus de citron', NULL, NOW(), NOW(), 'Base: citron')
ON CONFLICT (name) DO NOTHING;

-- sauce soja (utilisé 14x)
-- Base: soja
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('sauce soja', NULL, NOW(), NOW(), 'Base: soja')
ON CONFLICT (name) DO NOTHING;

-- cannelle (utilisé 13x)
-- Base: cannelle
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('cannelle', 'broyage', NOW(), NOW(), 'Base: cannelle')
ON CONFLICT (name) DO NOTHING;

-- paprika (utilisé 13x)
-- Base: paprika
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('paprika', 'broyage', NOW(), NOW(), 'Base: paprika')
ON CONFLICT (name) DO NOTHING;

-- bouillon (utilisé 10x)
-- Base: bouillon
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('bouillon', NULL, NOW(), NOW(), 'Base: bouillon')
ON CONFLICT (name) DO NOTHING;

-- fromage râpé (utilisé 9x)
-- Base: fromage
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('fromage râpé', 'râpage', NOW(), NOW(), 'Base: fromage')
ON CONFLICT (name) DO NOTHING;

-- coriandre (utilisé 6x)
-- Base: coriandre
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('coriandre', 'broyage', NOW(), NOW(), 'Base: coriandre')
ON CONFLICT (name) DO NOTHING;

-- boeuf haché (utilisé 6x)
-- Base: boeuf
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('boeuf haché', NULL, NOW(), NOW(), 'Base: boeuf')
ON CONFLICT (name) DO NOTHING;

-- parmesan râpé (utilisé 6x)
-- Base: parmesan
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('parmesan râpé', 'râpage', NOW(), NOW(), 'Base: parmesan')
ON CONFLICT (name) DO NOTHING;

-- pain de mie (utilisé 5x)
-- Base: mie
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('pain de mie', NULL, NOW(), NOW(), 'Base: mie')
ON CONFLICT (name) DO NOTHING;

-- piment (utilisé 5x)
-- Base: piment
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('piment', 'broyage', NOW(), NOW(), 'Base: piment')
ON CONFLICT (name) DO NOTHING;

-- noix de muscade (utilisé 5x)
-- Base: noix de muscade
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('noix de muscade', 'broyage', NOW(), NOW(), 'Base: noix de muscade')
ON CONFLICT (name) DO NOTHING;

-- bouillon de boeuf (utilisé 5x)
-- Base: de boeuf
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('bouillon de boeuf', NULL, NOW(), NOW(), 'Base: de boeuf')
ON CONFLICT (name) DO NOTHING;

-- curcuma (utilisé 5x)
-- Base: curcuma
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('curcuma', 'broyage', NOW(), NOW(), 'Base: curcuma')
ON CONFLICT (name) DO NOTHING;

-- muscade (utilisé 5x)
-- Base: muscade
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('muscade', 'broyage', NOW(), NOW(), 'Base: muscade')
ON CONFLICT (name) DO NOTHING;

-- piment d'Espelette (utilisé 4x)
-- Base: piment d'Espelette
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('piment d''Espelette', 'broyage', NOW(), NOW(), 'Base: piment d''Espelette')
ON CONFLICT (name) DO NOTHING;

-- gruyère râpé (utilisé 4x)
-- Base: gruyère
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('gruyère râpé', 'râpage', NOW(), NOW(), 'Base: gruyère')
ON CONFLICT (name) DO NOTHING;

-- fond de veau (utilisé 4x)
-- Base: de veau
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('fond de veau', NULL, NOW(), NOW(), 'Base: de veau')
ON CONFLICT (name) DO NOTHING;

-- huile de friture (utilisé 4x)
-- Base: friture
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('huile de friture', NULL, NOW(), NOW(), 'Base: friture')
ON CONFLICT (name) DO NOTHING;

-- sauce béchamel (utilisé 4x)
-- Base: béchamel
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('sauce béchamel', NULL, NOW(), NOW(), 'Base: béchamel')
ON CONFLICT (name) DO NOTHING;

-- beurre fondu (utilisé 3x)
-- Base: beurre u
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('beurre fondu', NULL, NOW(), NOW(), 'Base: beurre u')
ON CONFLICT (name) DO NOTHING;

-- saumon fumé (utilisé 3x)
-- Base: saumon
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('saumon fumé', 'fumage', NOW(), NOW(), 'Base: saumon')
ON CONFLICT (name) DO NOTHING;

-- coriandre fraîche (utilisé 3x)
-- Base: coriandre
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('coriandre fraîche', 'broyage', NOW(), NOW(), 'Base: coriandre')
ON CONFLICT (name) DO NOTHING;

-- safran (utilisé 3x)
-- Base: safran
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('safran', 'broyage', NOW(), NOW(), 'Base: safran')
ON CONFLICT (name) DO NOTHING;

-- persil haché (utilisé 3x)
-- Base: persil
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('persil haché', NULL, NOW(), NOW(), 'Base: persil')
ON CONFLICT (name) DO NOTHING;

-- huile de sésame (utilisé 3x)
-- Base: sésame
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('huile de sésame', NULL, NOW(), NOW(), 'Base: sésame')
ON CONFLICT (name) DO NOTHING;

-- vinaigre de riz (utilisé 3x)
-- Base: riz
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('vinaigre de riz', NULL, NOW(), NOW(), 'Base: riz')
ON CONFLICT (name) DO NOTHING;

-- pain de campagne (utilisé 2x)
-- Base: campagne
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('pain de campagne', NULL, NOW(), NOW(), 'Base: campagne')
ON CONFLICT (name) DO NOTHING;

-- tomates pelées (utilisé 2x)
-- Base: tomates
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('tomates pelées', NULL, NOW(), NOW(), 'Base: tomates')
ON CONFLICT (name) DO NOTHING;

-- jus de citron vert (utilisé 2x)
-- Base: citron vert
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('jus de citron vert', NULL, NOW(), NOW(), 'Base: citron vert')
ON CONFLICT (name) DO NOTHING;

-- paprika fumé (utilisé 2x)
-- Base: paprika
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('paprika fumé', 'fumage', NOW(), NOW(), 'Base: paprika')
ON CONFLICT (name) DO NOTHING;

-- coriandre moulue (utilisé 2x)
-- Base: coriandre
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('coriandre moulue', 'broyage', NOW(), NOW(), 'Base: coriandre')
ON CONFLICT (name) DO NOTHING;

-- bouillon de légumes (utilisé 2x)
-- Base: de légume
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('bouillon de légumes', NULL, NOW(), NOW(), 'Base: de légume')
ON CONFLICT (name) DO NOTHING;

-- bouillon de volaille (utilisé 2x)
-- Base: de volaille
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('bouillon de volaille', NULL, NOW(), NOW(), 'Base: de volaille')
ON CONFLICT (name) DO NOTHING;

-- lardons fumés (utilisé 2x)
-- Base: lardons
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('lardons fumés', 'fumage', NOW(), NOW(), 'Base: lardons')
ON CONFLICT (name) DO NOTHING;

-- ail en poudre (utilisé 2x)
-- Base: ail
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('ail en poudre', 'broyage', NOW(), NOW(), 'Base: ail')
ON CONFLICT (name) DO NOTHING;

-- sauce d'huître (utilisé 2x)
-- Base: d'huître
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('sauce d''huître', NULL, NOW(), NOW(), 'Base: d''huître')
ON CONFLICT (name) DO NOTHING;

-- vinaigre de cidre (utilisé 2x)
-- Base: cidre
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('vinaigre de cidre', NULL, NOW(), NOW(), 'Base: cidre')
ON CONFLICT (name) DO NOTHING;

-- viande d'agneau hachée (utilisé 2x)
-- Base: viande d'agneau
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('viande d''agneau hachée', NULL, NOW(), NOW(), 'Base: viande d''agneau')
ON CONFLICT (name) DO NOTHING;

-- huile de coco (utilisé 1x)
-- Base: coco
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('huile de coco', NULL, NOW(), NOW(), 'Base: coco')
ON CONFLICT (name) DO NOTHING;

-- cumin moulu (utilisé 1x)
-- Base: cumin
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('cumin moulu', 'broyage', NOW(), NOW(), 'Base: cumin')
ON CONFLICT (name) DO NOTHING;

-- piment cayenne (utilisé 1x)
-- Base: piment cayenne
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('piment cayenne', 'broyage', NOW(), NOW(), 'Base: piment cayenne')
ON CONFLICT (name) DO NOTHING;

-- haricots blancs sauce tomate (utilisé 1x)
-- Base: haricots blancs tomate
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('haricots blancs sauce tomate', NULL, NOW(), NOW(), 'Base: haricots blancs tomate')
ON CONFLICT (name) DO NOTHING;

-- cayenne (utilisé 1x)
-- Base: cayenne
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('cayenne', 'broyage', NOW(), NOW(), 'Base: cayenne')
ON CONFLICT (name) DO NOTHING;

-- vinaigre de xérès (utilisé 1x)
-- Base: xérè
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('vinaigre de xérès', NULL, NOW(), NOW(), 'Base: xérè')
ON CONFLICT (name) DO NOTHING;

-- pois chiches cuits (utilisé 1x)
-- Base: pois chiches cuits
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('pois chiches cuits', NULL, NOW(), NOW(), 'Base: pois chiches cuits')
ON CONFLICT (name) DO NOTHING;

-- piment de Cayenne (utilisé 1x)
-- Base: piment de Cayenne
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('piment de Cayenne', 'broyage', NOW(), NOW(), 'Base: piment de Cayenne')
ON CONFLICT (name) DO NOTHING;

-- curry (utilisé 1x)
-- Base: curry
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('curry', 'broyage', NOW(), NOW(), 'Base: curry')
ON CONFLICT (name) DO NOTHING;

-- porc haché (utilisé 1x)
-- Base: porc
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('porc haché', NULL, NOW(), NOW(), 'Base: porc')
ON CONFLICT (name) DO NOTHING;

-- crevettes cuites (utilisé 1x)
-- Base: crevettes
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('crevettes cuites', NULL, NOW(), NOW(), 'Base: crevettes')
ON CONFLICT (name) DO NOTHING;

-- morue dessalée (utilisé 1x)
-- Base: morue
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('morue dessalée', NULL, NOW(), NOW(), 'Base: morue')
ON CONFLICT (name) DO NOTHING;

-- comté râpé (utilisé 1x)
-- Base: comté
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('comté râpé', 'râpage', NOW(), NOW(), 'Base: comté')
ON CONFLICT (name) DO NOTHING;

-- pâte à pizza (utilisé 1x)
-- Base: pizza
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('pâte à pizza', NULL, NOW(), NOW(), 'Base: pizza')
ON CONFLICT (name) DO NOTHING;

-- sauce tomate (utilisé 1x)
-- Base: tomate
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('sauce tomate', NULL, NOW(), NOW(), 'Base: tomate')
ON CONFLICT (name) DO NOTHING;

-- jambon cuit (utilisé 1x)
-- Base: jambon
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('jambon cuit', NULL, NOW(), NOW(), 'Base: jambon')
ON CONFLICT (name) DO NOTHING;

-- poivre moulu (utilisé 1x)
-- Base: poivre
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('poivre moulu', 'broyage', NOW(), NOW(), 'Base: poivre')
ON CONFLICT (name) DO NOTHING;

-- sauce tomates (utilisé 1x)
-- Base: tomate
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('sauce tomates', NULL, NOW(), NOW(), 'Base: tomate')
ON CONFLICT (name) DO NOTHING;

-- poitrine fumée (utilisé 1x)
-- Base: poitrine
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('poitrine fumée', 'fumage', NOW(), NOW(), 'Base: poitrine')
ON CONFLICT (name) DO NOTHING;

-- paprika doux (utilisé 1x)
-- Base: paprika doux
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('paprika doux', 'broyage', NOW(), NOW(), 'Base: paprika doux')
ON CONFLICT (name) DO NOTHING;

-- sauce soja claire (utilisé 1x)
-- Base: soja claire
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('sauce soja claire', NULL, NOW(), NOW(), 'Base: soja claire')
ON CONFLICT (name) DO NOTHING;

-- sauce soja foncée (utilisé 1x)
-- Base: soja foncée
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('sauce soja foncée', NULL, NOW(), NOW(), 'Base: soja foncée')
ON CONFLICT (name) DO NOTHING;

-- saucisses fumées (utilisé 1x)
-- Base: saucisses
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('saucisses fumées', 'fumage', NOW(), NOW(), 'Base: saucisses')
ON CONFLICT (name) DO NOTHING;

-- sauce barbecue (utilisé 1x)
-- Base: barbecue
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('sauce barbecue', NULL, NOW(), NOW(), 'Base: barbecue')
ON CONFLICT (name) DO NOTHING;

-- sauce tonkatsu (utilisé 1x)
-- Base: tonkatsu
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('sauce tonkatsu', NULL, NOW(), NOW(), 'Base: tonkatsu')
ON CONFLICT (name) DO NOTHING;

-- agneau haché (utilisé 1x)
-- Base: agneau
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('agneau haché', NULL, NOW(), NOW(), 'Base: agneau')
ON CONFLICT (name) DO NOTHING;

-- sauce hoisin (utilisé 1x)
-- Base: hoisin
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('sauce hoisin', NULL, NOW(), NOW(), 'Base: hoisin')
ON CONFLICT (name) DO NOTHING;

-- farine de sarrasin (utilisé 1x)
-- Base: sarrasin
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('farine de sarrasin', NULL, NOW(), NOW(), 'Base: sarrasin')
ON CONFLICT (name) DO NOTHING;

-- fumet de poisson (utilisé 1x)
-- Base: de poisson
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('fumet de poisson', NULL, NOW(), NOW(), 'Base: de poisson')
ON CONFLICT (name) DO NOTHING;

-- biscuits Graham (utilisé 1x)
-- Base: biscuits Graham
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('biscuits Graham', NULL, NOW(), NOW(), 'Base: biscuits Graham')
ON CONFLICT (name) DO NOTHING;

-- riz cuit froid (utilisé 1x)
-- Base: riz froid
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES ('riz cuit froid', NULL, NOW(), NOW(), 'Base: riz froid')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Total: 254 canonical + 73 archetypes
