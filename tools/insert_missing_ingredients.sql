-- Insertion des ingrédients manquants
-- Généré automatiquement
-- ======================================================================

BEGIN;

-- =====================================================
-- CANONICAL FOODS
-- =====================================================

-- beurre (utilisé 61x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('beurre', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- farine (utilisé 53x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('farine', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs (utilisé 40x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeufs', 14, NOW(), NOW())
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
VALUES ('huile', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oignons (utilisé 23x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oignons', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- carottes (utilisé 22x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('carottes', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tomates (utilisé 21x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tomates', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pommes de terre (utilisé 20x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pommes de terre', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cumin (utilisé 17x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cumin', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cannelle (utilisé 13x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cannelle', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- paprika (utilisé 13x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('paprika', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- champignons de Paris (utilisé 13x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('champignons de Paris', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin blanc (utilisé 11x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin blanc', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- échalotes (utilisé 10x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('échalotes', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bouquet garni (utilisé 9x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bouquet garni', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes d'oeufs (utilisé 8x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaunes d''oeufs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- basilic frais (utilisé 8x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('basilic frais', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin blanc sec (utilisé 8x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin blanc sec', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure chimique (utilisé 6x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure chimique', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivron rouge (utilisé 6x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivron rouge', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- courgettes (utilisé 6x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('courgettes', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chapelure (utilisé 6x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chapelure', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- flocons d'avoine (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('flocons d''avoine', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain de mie (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain de mie', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- persil frais (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('persil frais', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mirin (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mirin', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tahini (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tahini', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- aubergines (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('aubergines', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tomates concassées (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tomates concassées', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- noix de muscade (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('noix de muscade', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poireaux (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poireaux', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivrons (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivrons', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- champignons (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('champignons', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bicarbonate (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bicarbonate', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bacon (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bacon', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- piment d'Espelette (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('piment d''Espelette', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- céleri (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('céleri', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- concentré de tomates (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('concentré de tomates', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- herbes de Provence (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('herbes de Provence', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pommes (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pommes', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- citrons (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('citrons', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- épinards (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('épinards', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- moules (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('moules', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre glace (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre glace', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- œuf (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('œuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- aneth frais (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('aneth frais', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- yaourt grec (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('yaourt grec', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tomates mûres (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tomates mûres', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vermicelles de riz (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vermicelles de riz', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- salade (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('salade', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- menthe fraîche (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('menthe fraîche', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- câpres (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('câpres', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- coriandre fraîche (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('coriandre fraîche', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mozzarella (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mozzarella', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- petits pois (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('petits pois', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin rouge (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin rouge', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pois chiches (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pois chiches', 14, NOW(), NOW())
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

-- lardons (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lardons', 14, NOW(), NOW())
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

-- navets (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('navets', 14, NOW(), NOW())
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

-- poudre d'amandes (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poudre d''amandes', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- blancs d'oeufs (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('blancs d''oeufs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre semoule (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre semoule', 9, NOW(), NOW())
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

-- épinards frais (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('épinards frais', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- amandes effilées (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('amandes effilées', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain de campagne (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain de campagne', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre blanc (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre blanc', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon serrano (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon serrano', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tomates pelées (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tomates pelées', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- dashi (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('dashi', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cacahuètes (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cacahuètes', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- baguette (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('baguette', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- crevettes (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('crevettes', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pousses de soja (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pousses de soja', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- galettes de riz (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('galettes de riz', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- semoule (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('semoule', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivrons rouges (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivrons rouges', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- persil plat (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('persil plat', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lentilles corail (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lentilles corail', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- viande d'agneau (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('viande d''agneau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vermicelle (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vermicelle', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mayonnaise (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mayonnaise', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure boulanger (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure boulanger', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaune d'oeuf (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaune d''oeuf', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lardons fumés (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lardons fumés', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escalopes de poulet (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escalopes de poulet', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- branche de céleri (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('branche de céleri', 14, NOW(), NOW())
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

-- feuille de laurier (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('feuille de laurier', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- moutarde de Dijon (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('moutarde de Dijon', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots rouges (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('haricots rouges', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots verts (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('haricots verts', 14, NOW(), NOW())
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
VALUES ('verts', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- garni (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('garni', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fruits rouges mélangés (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fruits rouges mélangés', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- feta (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('feta', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- noisettes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('noisettes', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bananes mûres (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bananes mûres', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- œufs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('œufs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cerneaux de noix (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cerneaux de noix', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- piment cayenne (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('piment cayenne', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saucisses porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisses porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- muffins anglais (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('muffins anglais', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cayenne (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cayenne', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- huile végétale (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('huile végétale', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain rassis (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain rassis', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon ibérique (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon ibérique', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs durs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeufs durs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- nuoc mam (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('nuoc mam', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pois chiches cuits (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pois chiches cuits', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- eau de cuisson (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('eau de cuisson', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- olives noires dénoyautées (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('olives noires dénoyautées', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- avocats (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('avocats', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chips de maïs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chips de maïs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- figues fraîches (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('figues fraîches', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- thon au naturel (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('thon au naturel', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- St Môret (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('St Môret', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saumon frais (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saumon frais', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- piment de Cayenne (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('piment de Cayenne', 14, NOW(), NOW())
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

-- ail (facultatif) (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('ail (facultatif)', 2, NOW(), NOW())
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

-- curry (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('curry', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- champignons noirs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('champignons noirs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- nuoc-mâm (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('nuoc-mâm', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- crevettes cuites (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('crevettes cuites', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- morue dessalée (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('morue dessalée', 14, NOW(), NOW())
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
VALUES ('levure de bière fraîche', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- malt d'orge ou sucre (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('malt d''orge ou sucre', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivrons jaunes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivrons jaunes', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tomates cerises (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tomates cerises', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre balsamique (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre balsamique', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- artichauts violets moyens (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('artichauts violets moyens', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- châtaignes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('châtaignes', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes d'œufs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaunes d''œufs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre blanc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivre blanc', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots blancs secs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('haricots blancs secs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lentilles (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lentilles', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saucisses de Strasbourg (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisses de Strasbourg', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pesto (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pesto', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- olives (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('olives', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chorizo (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chorizo', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poudre d'amande (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poudre d''amande', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- chèvre frais (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chèvre frais', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- eau tiède (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('eau tiède', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet  fermier (1,5 kg) (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poulet  fermier (1,5 kg)', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- thym frais (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('thym frais', 10, NOW(), NOW())
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
VALUES ('calvados', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet fermier (1,8 kg) (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poulet fermier (1,8 kg)', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- petits oignons grelots (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('petits oignons grelots', 2, NOW(), NOW())
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

-- sauge fraîche (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sauge fraîche', 14, NOW(), NOW())
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
VALUES ('blanc de poireau', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- petits oignons blancs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('petits oignons blancs', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- citron bio (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('citron bio', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rôti de veau sous-noix (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rôti de veau sous-noix', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tranches de bacon (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tranches de bacon', 14, NOW(), NOW())
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
VALUES ('petits oignons', 2, NOW(), NOW())
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
VALUES ('feuilles de laurier', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bière ambrée (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bière ambrée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain d'épices (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain d''épices', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- brin de thym (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('brin de thym', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- steaks de boeuf 180g (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('steaks de boeuf 180g', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre en grains (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivre en grains', 10, NOW(), NOW())
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

-- paprika doux (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('paprika doux', 10, NOW(), NOW())
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

-- saucisses fumées (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisses fumées', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- branche de thym (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('branche de thym', 10, NOW(), NOW())
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
VALUES ('tortillas', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escalopes de porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escalopes de porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jambon à l'os (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jambon à l''os', 14, NOW(), NOW())
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

-- côtelettes d'agneau (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('côtelettes d''agneau', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pignons (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pignons', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- magrets de canard (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('magrets de canard', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre vert (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivre vert', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- canard entier (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('canard entier', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cinq épices (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cinq épices', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oignons nouveaux (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oignons nouveaux', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- galettes chinoises (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('galettes chinoises', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- confit de canard (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('confit de canard', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- andouillettes de Troyes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('andouillettes de Troyes', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- boudins noirs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('boudins noirs', 14, NOW(), NOW())
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

-- calamars (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('calamars', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fumet de poisson (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fumet de poisson', 9, NOW(), NOW())
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
VALUES ('olives noires', 14, NOW(), NOW())
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

-- biscuits Graham (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('biscuits Graham', 14, NOW(), NOW())
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

-- levure boulanger fraîche (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure boulanger fraîche', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs (4 gros) (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeufs (4 gros)', 14, NOW(), NOW())
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

-- lait entier (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lait entier', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pruneaux dénoyautés (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pruneaux dénoyautés', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs entiers (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeufs entiers', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rhum ambré (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rhum ambré', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- blancs d'oeufs vieillis (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('blancs d''oeufs vieillis', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- ganache chocolat (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('ganache chocolat', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- huile neutre (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('huile neutre', 14, NOW(), NOW())
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
VALUES ('lasagnes', 14, NOW(), NOW())
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
VALUES ('huile sésame', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pois mange-tout (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pois mange-tout', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- endives (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('endives', 14, NOW(), NOW())
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
VALUES ('nouilles ramen', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poitrine de porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poitrine de porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sablée (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sablée', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs pour meringue (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeufs pour meringue', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre pour meringue (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('sucre pour meringue', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cerises (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cerises', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes oeufs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaunes oeufs', 14, NOW(), NOW())
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
VALUES ('brisées', 14, NOW(), NOW())
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
VALUES ('chair à saucisse', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mie de pain (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mie de pain', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- escargots (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escargots', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;


-- =====================================================
-- ARCHETYPES
-- =====================================================

-- huile d'olive (utilisé 76x)
-- TODO: Vérifier canonical_food_id pour 'huile d'olive'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'huile d''olive',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: huile d''olive')
ON CONFLICT DO NOTHING;

-- crème fraîche (utilisé 17x)
-- TODO: Vérifier canonical_food_id pour 'crème'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'crème fraîche',
  'frais',
  NOW(),
  NOW(),
  'Auto-généré - base: crème')
ON CONFLICT DO NOTHING;

-- jus de citron (utilisé 15x)
-- TODO: Vérifier canonical_food_id pour 'jus de citron'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'jus de citron',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: jus de citron')
ON CONFLICT DO NOTHING;

-- sauce soja (utilisé 14x)
-- TODO: Vérifier canonical_food_id pour 'sauce soja'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'sauce soja',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: sauce soja')
ON CONFLICT DO NOTHING;

-- bouillon (utilisé 10x)
-- TODO: Vérifier canonical_food_id pour 'bouillon'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'bouillon',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: bouillon')
ON CONFLICT DO NOTHING;

-- fromage râpé (utilisé 9x)
-- TODO: Vérifier canonical_food_id pour 'fromage'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'fromage râpé',
  'râpage',
  NOW(),
  NOW(),
  'Auto-généré - base: fromage')
ON CONFLICT DO NOTHING;

-- boeuf haché (utilisé 6x)
-- TODO: Vérifier canonical_food_id pour 'boeuf'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'boeuf haché',
  'hachage',
  NOW(),
  NOW(),
  'Auto-généré - base: boeuf')
ON CONFLICT DO NOTHING;

-- parmesan râpé (utilisé 6x)
-- TODO: Vérifier canonical_food_id pour 'parmesan'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'parmesan râpé',
  'râpage',
  NOW(),
  NOW(),
  'Auto-généré - base: parmesan')
ON CONFLICT DO NOTHING;

-- bouillon de boeuf (utilisé 5x)
-- TODO: Vérifier canonical_food_id pour 'bouillon de boeuf'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'bouillon de boeuf',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: bouillon de boeuf')
ON CONFLICT DO NOTHING;

-- crème (utilisé 5x)
-- TODO: Vérifier canonical_food_id pour 'crème'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'crème',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: crème')
ON CONFLICT DO NOTHING;

-- pâte feuilletée (utilisé 4x)
-- TODO: Vérifier canonical_food_id pour 'pâte feuilletée'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'pâte feuilletée',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: pâte feuilletée')
ON CONFLICT DO NOTHING;

-- gruyère râpé (utilisé 4x)
-- TODO: Vérifier canonical_food_id pour 'gruyère'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'gruyère râpé',
  'râpage',
  NOW(),
  NOW(),
  'Auto-généré - base: gruyère')
ON CONFLICT DO NOTHING;

-- crème liquide (utilisé 4x)
-- TODO: Vérifier canonical_food_id pour 'crème liquide'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'crème liquide',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: crème liquide')
ON CONFLICT DO NOTHING;

-- fond de veau (utilisé 4x)
-- TODO: Vérifier canonical_food_id pour 'fond de veau'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'fond de veau',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: fond de veau')
ON CONFLICT DO NOTHING;

-- huile de friture (utilisé 4x)
-- TODO: Vérifier canonical_food_id pour 'huile de friture'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'huile de friture',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: huile de friture')
ON CONFLICT DO NOTHING;

-- sauce béchamel (utilisé 4x)
-- TODO: Vérifier canonical_food_id pour 'sauce béchamel'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'sauce béchamel',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: sauce béchamel')
ON CONFLICT DO NOTHING;

-- beurre fondu (utilisé 3x)
-- TODO: Vérifier canonical_food_id pour 'beurre fondu'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'beurre fondu',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: beurre fondu')
ON CONFLICT DO NOTHING;

-- saumon fumé (utilisé 3x)
-- TODO: Vérifier canonical_food_id pour 'saumon'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'saumon fumé',
  'fumage',
  NOW(),
  NOW(),
  'Auto-généré - base: saumon')
ON CONFLICT DO NOTHING;

-- persil haché (utilisé 3x)
-- TODO: Vérifier canonical_food_id pour 'persil'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'persil haché',
  'hachage',
  NOW(),
  NOW(),
  'Auto-généré - base: persil')
ON CONFLICT DO NOTHING;

-- huile de sésame (utilisé 3x)
-- TODO: Vérifier canonical_food_id pour 'huile de sésame'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'huile de sésame',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: huile de sésame')
ON CONFLICT DO NOTHING;

-- vinaigre de riz (utilisé 3x)
-- TODO: Vérifier canonical_food_id pour 'vinaigre de riz'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'vinaigre de riz',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: vinaigre de riz')
ON CONFLICT DO NOTHING;

-- jus de citron vert (utilisé 2x)
-- TODO: Vérifier canonical_food_id pour 'jus de citron vert'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'jus de citron vert',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: jus de citron vert')
ON CONFLICT DO NOTHING;

-- fromage frais (utilisé 2x)
-- TODO: Vérifier canonical_food_id pour 'fromage'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'fromage frais',
  'frais',
  NOW(),
  NOW(),
  'Auto-généré - base: fromage')
ON CONFLICT DO NOTHING;

-- paprika fumé (utilisé 2x)
-- TODO: Vérifier canonical_food_id pour 'paprika'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'paprika fumé',
  'fumage',
  NOW(),
  NOW(),
  'Auto-généré - base: paprika')
ON CONFLICT DO NOTHING;

-- coriandre moulue (utilisé 2x)
-- TODO: Vérifier canonical_food_id pour 'coriandre'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'coriandre moulue',
  'broyage',
  NOW(),
  NOW(),
  'Auto-généré - base: coriandre')
ON CONFLICT DO NOTHING;

-- bouillon de légumes (utilisé 2x)
-- TODO: Vérifier canonical_food_id pour 'bouillon de légumes'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'bouillon de légumes',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: bouillon de légumes')
ON CONFLICT DO NOTHING;

-- bouillon de volaille (utilisé 2x)
-- TODO: Vérifier canonical_food_id pour 'bouillon de volaille'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'bouillon de volaille',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: bouillon de volaille')
ON CONFLICT DO NOTHING;

-- ail en poudre (utilisé 2x)
-- TODO: Vérifier canonical_food_id pour 'ail'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'ail en poudre',
  'séchage et broyage',
  NOW(),
  NOW(),
  'Auto-généré - base: ail')
ON CONFLICT DO NOTHING;

-- sauce d'huître (utilisé 2x)
-- TODO: Vérifier canonical_food_id pour 'sauce d'huître'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'sauce d''huître',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: sauce d''huître')
ON CONFLICT DO NOTHING;

-- vinaigre de cidre (utilisé 2x)
-- TODO: Vérifier canonical_food_id pour 'vinaigre de cidre'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'vinaigre de cidre',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: vinaigre de cidre')
ON CONFLICT DO NOTHING;

-- viande d'agneau hachée (utilisé 2x)
-- TODO: Vérifier canonical_food_id pour 'viande d'agneau'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'viande d''agneau hachée',
  'hachage',
  NOW(),
  NOW(),
  'Auto-généré - base: viande d''agneau')
ON CONFLICT DO NOTHING;

-- huile de coco (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'huile de coco'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'huile de coco',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: huile de coco')
ON CONFLICT DO NOTHING;

-- cumin moulu (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'cumin'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'cumin moulu',
  'broyage',
  NOW(),
  NOW(),
  'Auto-généré - base: cumin')
ON CONFLICT DO NOTHING;

-- haricots blancs sauce tomate (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'haricots blancs sauce tomate'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'haricots blancs sauce tomate',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: haricots blancs sauce tomate')
ON CONFLICT DO NOTHING;

-- vinaigre de xérès (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'vinaigre de xérès'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'vinaigre de xérès',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: vinaigre de xérès')
ON CONFLICT DO NOTHING;

-- fromage de chèvre (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'fromage de chèvre'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'fromage de chèvre',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: fromage de chèvre')
ON CONFLICT DO NOTHING;

-- porc haché (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'porc'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'porc haché',
  'hachage',
  NOW(),
  NOW(),
  'Auto-généré - base: porc')
ON CONFLICT DO NOTHING;

-- comté râpé (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'comté'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'comté râpé',
  'râpage',
  NOW(),
  NOW(),
  'Auto-généré - base: comté')
ON CONFLICT DO NOTHING;

-- pâtes courtes (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'pâtes courtes'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'pâtes courtes',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: pâtes courtes')
ON CONFLICT DO NOTHING;

-- pâte brisée (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'pâte brisée'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'pâte brisée',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: pâte brisée')
ON CONFLICT DO NOTHING;

-- fromage blanc (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'fromage blanc'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'fromage blanc',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: fromage blanc')
ON CONFLICT DO NOTHING;

-- pâte à pizza (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'pâte à pizza'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'pâte à pizza',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: pâte à pizza')
ON CONFLICT DO NOTHING;

-- sauce tomate (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'sauce tomate'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'sauce tomate',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: sauce tomate')
ON CONFLICT DO NOTHING;

-- jambon cuit (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'jambon'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'jambon cuit',
  'cuisson',
  NOW(),
  NOW(),
  'Auto-généré - base: jambon')
ON CONFLICT DO NOTHING;

-- poivre moulu (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'poivre'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'poivre moulu',
  'broyage',
  NOW(),
  NOW(),
  'Auto-généré - base: poivre')
ON CONFLICT DO NOTHING;

-- jarret de veau en tranches de 4cm (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'jarret de veau de 4cm'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'jarret de veau en tranches de 4cm',
  'tranchage',
  NOW(),
  NOW(),
  'Auto-généré - base: jarret de veau de 4cm')
ON CONFLICT DO NOTHING;

-- sauce tomates (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'sauce tomates'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'sauce tomates',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: sauce tomates')
ON CONFLICT DO NOTHING;

-- poitrine fumée (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'poitrine'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'poitrine fumée',
  'fumage',
  NOW(),
  NOW(),
  'Auto-généré - base: poitrine')
ON CONFLICT DO NOTHING;

-- sauce soja claire (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'sauce soja claire'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'sauce soja claire',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: sauce soja claire')
ON CONFLICT DO NOTHING;

-- sauce soja foncée (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'sauce soja foncée'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'sauce soja foncée',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: sauce soja foncée')
ON CONFLICT DO NOTHING;

-- sauce barbecue (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'sauce barbecue'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'sauce barbecue',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: sauce barbecue')
ON CONFLICT DO NOTHING;

-- sauce tonkatsu (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'sauce tonkatsu'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'sauce tonkatsu',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: sauce tonkatsu')
ON CONFLICT DO NOTHING;

-- agneau haché (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'agneau'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'agneau haché',
  'hachage',
  NOW(),
  NOW(),
  'Auto-généré - base: agneau')
ON CONFLICT DO NOTHING;

-- sauce hoisin (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'sauce hoisin'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'sauce hoisin',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: sauce hoisin')
ON CONFLICT DO NOTHING;

-- ganache ou crème (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'ganache ou crème'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'ganache ou crème',
  NULL,
  NOW(),
  NOW(),
  'Auto-généré - base: ganache ou crème')
ON CONFLICT DO NOTHING;

-- riz cuit froid (utilisé 1x)
-- TODO: Vérifier canonical_food_id pour 'riz froid'
INSERT INTO archetypes (name, process, created_at, updated_at, notes)
VALUES (
  'riz cuit froid',
  'cuisson',
  NOW(),
  NOW(),
  'Auto-généré - base: riz froid')
ON CONFLICT DO NOTHING;


COMMIT;

-- Total: 316 canonical_foods + 56 archetypes
