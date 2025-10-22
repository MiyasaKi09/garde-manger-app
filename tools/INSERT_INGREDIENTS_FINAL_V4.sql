-- ========================================
-- INSERTION INGRÉDIENTS MANQUANTS - V4 FINALE
-- Classification précise et vérifiée
-- ========================================

BEGIN;

-- ========================================
-- CANONICAL FOODS (Aliments de base)
-- 231 ingrédients
-- ========================================

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

-- ail (utilisé 27x)
-- Variantes: gousse d'ail, gousses d'ail
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('ail', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- huile (utilisé 25x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('huile', 11, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- crème (utilisé 22x)
-- Variantes: crème fraîche, crème
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('crème', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin blanc (utilisé 19x)
-- Variantes: vin blanc sec, vin blanc
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin blanc', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bouquet garni (utilisé 9x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bouquet garni', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes d'oeufs (utilisé 8x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaunes d''oeufs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure chimique (utilisé 6x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure chimique', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivron rouge (utilisé 6x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivron rouge', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mirin (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mirin', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tahini (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tahini', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- champignons (utilisé 5x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('champignons', 3, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bicarbonate (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bicarbonate', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- céleri (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('céleri', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pâte feuilletée (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pâte feuilletée', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poulet fermier (1,5 kg) (utilisé 4x)
-- Variantes: poulet  fermier (1,5 kg), poulet fermier (1,5 kg)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poulet fermier (1,5 kg)', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pommes (utilisé 4x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pommes', 1, NOW(), NOW())
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

-- beurre fondu (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('beurre fondu', 7, NOW(), NOW())
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

-- câpres (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('câpres', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- mozzarella (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('mozzarella', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vin rouge (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vin rouge', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- graines de sésame (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('graines de sésame', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure boulanger (utilisé 3x)
-- Variantes: levure boulanger fraîche, levure boulanger
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure boulanger', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pignons de pin (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pignons de pin', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- cognac (utilisé 3x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('cognac', 14, NOW(), NOW())
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
VALUES ('navets', 2, NOW(), NOW())
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

-- amandes effilées (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('amandes effilées', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- vinaigre blanc (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('vinaigre blanc', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tomates pelées (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tomates pelées', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- dashi (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('dashi', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- nuoc mam (utilisé 2x)
-- Variantes: nuoc mam, nuoc-mâm
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('nuoc mam', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- baguette (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('baguette', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage frais (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fromage frais', 7, NOW(), NOW())
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

-- escalopes de poulet (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('escalopes de poulet', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- branche de céleri (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('branche de céleri', 2, NOW(), NOW())
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
VALUES ('feuille de laurier', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- moutarde de Dijon (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('moutarde de Dijon', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots rouges (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('haricots rouges', 5, NOW(), NOW())
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

-- pavés saumon 150g (utilisé 2x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pavés saumon 150g', 9, NOW(), NOW())
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
VALUES ('feta', 7, NOW(), NOW())
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

-- saucisses porc (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisses porc', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- muffins anglais (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('muffins anglais', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- huile végétale (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('huile végétale', 11, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pain rassis (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain rassis', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- oeufs durs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oeufs durs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- olives noires dénoyautées (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('olives noires dénoyautées', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fromage de chèvre (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fromage de chèvre', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- figues fraîches (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('figues fraîches', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- thon au naturel (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('thon au naturel', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fécule de maïs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fécule de maïs', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- fleur de sel (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('fleur de sel', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- xérès (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('xérès', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pois chiches secs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pois chiches secs', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- champignons noirs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('champignons noirs', 3, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- ciboulette (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('ciboulette', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- levure de bière (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('levure de bière', 14, NOW(), NOW())
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

-- pain (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pain', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jaunes d'œufs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jaunes d''œufs', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- haricots blancs secs (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('haricots blancs secs', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pâtes courtes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pâtes courtes', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- saucisses de Strasbourg (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('saucisses de Strasbourg', 14, NOW(), NOW())
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

-- chèvre (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('chèvre', 7, NOW(), NOW())
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

-- pâte à pizza (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pâte à pizza', 14, NOW(), NOW())
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
VALUES ('petits oignons blancs', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- jarret de veau en tranches de 4cm (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('jarret de veau en tranches de 4cm', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- citron bio (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('citron bio', 1, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- rôti de veau sous-noix (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('rôti de veau sous-noix', 9, NOW(), NOW())
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
VALUES ('feuilles de laurier', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- bière ambrée (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('bière ambrée', 14, NOW(), NOW())
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
VALUES ('vinaigre d''estragon', 10, NOW(), NOW())
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
VALUES ('magrets de canard', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- poivre vert (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('poivre vert', 10, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- canard entier (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('canard entier', 9, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- galettes chinoises (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('galettes chinoises', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- confit de canard (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('confit de canard', 9, NOW(), NOW())
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
VALUES ('pruneaux', 1, NOW(), NOW())
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

-- calamars (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('calamars', 14, NOW(), NOW())
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

-- oignon rouge (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('oignon rouge', 2, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- riz arborio (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('riz arborio', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- tomme (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('tomme', 14, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lait entier (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lait entier', 7, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- pruneaux dénoyautés (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('pruneaux dénoyautés', 1, NOW(), NOW())
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
VALUES ('haricots noirs', 5, NOW(), NOW())
ON CONFLICT (canonical_name) DO NOTHING;

-- lasagnes (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('lasagnes', 14, NOW(), NOW())
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

-- paneer (utilisé 1x)
INSERT INTO canonical_foods (canonical_name, category_id, created_at, updated_at)
VALUES ('paneer', 14, NOW(), NOW())
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


-- ========================================
-- ARCHETYPES (Transformations/Préparations)
-- 82 ingrédients
-- ========================================

-- huile d'olive (utilisé 76x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('huile d''olive', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- cumin (utilisé 17x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('cumin', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- jus de citron (utilisé 15x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('jus de citron', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- sauce soja (utilisé 14x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('sauce soja', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- cannelle (utilisé 13x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('cannelle', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- paprika (utilisé 13x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('paprika', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- bouillon (utilisé 10x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('bouillon', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- fromage râpé (utilisé 9x)
-- Type: Transformation (râpage): fromage
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('fromage râpé', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- chapelure (utilisé 6x)
-- Type: Forme/préparation spécifique
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('chapelure', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- boeuf haché (utilisé 6x)
-- Type: Transformation (hachage): boeuf
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('boeuf haché', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- parmesan râpé (utilisé 6x)
-- Type: Transformation (râpage): parmesan
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('parmesan râpé', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- avoine (utilisé 5x)
-- Type: Correction: flocons d'avoine → avoine
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('avoine', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- pain (utilisé 5x)
-- Type: Correction: pain de mie → pain
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('pain', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- tomates concassées (utilisé 5x)
-- Type: Transformation (concassage): tomates concassées
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('tomates concassées', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- noix de muscade (utilisé 5x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('noix de muscade', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- bouillon de boeuf (utilisé 5x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('bouillon de boeuf', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- bacon (utilisé 4x)
-- Type: Viande préparée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('bacon', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- piment d'Espelette (utilisé 4x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('piment d''Espelette', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- herbes de Provence (utilisé 4x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('herbes de Provence', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- gruyère râpé (utilisé 4x)
-- Type: Transformation (râpage): gruyère
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('gruyère râpé', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- crème liquide (utilisé 4x)
-- Type: Produit laitier transformé
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('crème liquide', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- huile de friture (utilisé 4x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('huile de friture', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- saumon fumé (utilisé 3x)
-- Type: Transformation (fumage): saumon
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('saumon fumé', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- jambon (utilisé 3x)
-- Type: Viande préparée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('jambon', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- lardons (utilisé 3x)
-- Type: Viande préparée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('lardons', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- crème épaisse (utilisé 3x)
-- Type: Produit laitier transformé
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('crème épaisse', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- chapelure panko (utilisé 3x)
-- Type: Forme/préparation spécifique
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('chapelure panko', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- persil haché (utilisé 3x)
-- Type: Transformation (hachage): persil
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('persil haché', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- huile de sésame (utilisé 3x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('huile de sésame', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- vinaigre de riz (utilisé 3x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('vinaigre de riz', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- pain de campagne (utilisé 2x)
-- Type: Forme/préparation spécifique
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('pain de campagne', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- jambon serrano (utilisé 2x)
-- Type: Viande préparée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('jambon serrano', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- jus de citron vert (utilisé 2x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('jus de citron vert', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- paprika fumé (utilisé 2x)
-- Type: Transformation (fumage): paprika
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('paprika fumé', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- coriandre moulue (utilisé 2x)
-- Type: Transformation (broyage): coriandre moulue
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('coriandre moulue', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- oeuf (utilisé 2x)
-- Type: Correction: jaune d'oeuf → oeuf
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('oeuf', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- lardons fumés (utilisé 2x)
-- Type: Transformation (fumage): lardons fumés
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('lardons fumés', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ail en poudre (utilisé 2x)
-- Type: Transformation (broyage): ail
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('ail en poudre', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- sauce d'huître (utilisé 2x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('sauce d''huître', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- vinaigre de cidre (utilisé 2x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('vinaigre de cidre', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- viande d'agneau hachée (utilisé 2x)
-- Type: Transformation (hachage): viande d'agneau hachée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('viande d''agneau hachée', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- jambon blanc (utilisé 2x)
-- Type: Viande préparée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('jambon blanc', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- huile de coco (utilisé 1x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('huile de coco', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- cumin moulu (utilisé 1x)
-- Type: Transformation (broyage): cumin
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('cumin moulu', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- piment cayenne (utilisé 1x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('piment cayenne', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- haricots blancs sauce tomate (utilisé 1x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('haricots blancs sauce tomate', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- cayenne (utilisé 1x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('cayenne', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- vinaigre de xérès (utilisé 1x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('vinaigre de xérès', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- jambon ibérique (utilisé 1x)
-- Type: Viande préparée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('jambon ibérique', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- pois chiches cuits (utilisé 1x)
-- Type: Transformation (cuisson): pois chiches cuits
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('pois chiches cuits', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- maïs (utilisé 1x)
-- Type: Correction: chips de maïs → maïs
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('maïs', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- piment de Cayenne (utilisé 1x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('piment de Cayenne', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- feuilles de brick (utilisé 1x)
-- Type: Forme/préparation spécifique
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('feuilles de brick', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- curry (utilisé 1x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('curry', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- porc haché (utilisé 1x)
-- Type: Transformation (hachage): porc
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('porc haché', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- crevettes cuites (utilisé 1x)
-- Type: Transformation (cuisson): crevettes cuites
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('crevettes cuites', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- morue dessalée (utilisé 1x)
-- Type: Transformation (dessalage): morue dessalée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('morue dessalée', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- quatre-épices (utilisé 1x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('quatre-épices', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- comté râpé (utilisé 1x)
-- Type: Transformation (râpage): comté
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('comté râpé', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- poivre blanc (utilisé 1x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('poivre blanc', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- sauce tomate (utilisé 1x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('sauce tomate', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- jambon cuit (utilisé 1x)
-- Type: Transformation (cuisson): jambon
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('jambon cuit', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- poivre moulu (utilisé 1x)
-- Type: Transformation (broyage): poivre
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('poivre moulu', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- jambon cru (utilisé 1x)
-- Type: Viande préparée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('jambon cru', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- tranches de bacon (utilisé 1x)
-- Type: Viande préparée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('tranches de bacon', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- sauce tomates (utilisé 1x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('sauce tomates', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- poitrine fumée (utilisé 1x)
-- Type: Transformation (fumage): poitrine fumée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('poitrine fumée', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- pain d'épices (utilisé 1x)
-- Type: Forme/préparation spécifique
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('pain d''épices', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- paprika doux (utilisé 1x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('paprika doux', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- sauce soja claire (utilisé 1x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('sauce soja claire', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- sauce soja foncée (utilisé 1x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('sauce soja foncée', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- saucisses fumées (utilisé 1x)
-- Type: Transformation (fumage): saucisses fumées
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('saucisses fumées', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- sauce tonkatsu (utilisé 1x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('sauce tonkatsu', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- jambon à l'os (utilisé 1x)
-- Type: Viande préparée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('jambon à l''os', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- agneau haché (utilisé 1x)
-- Type: Transformation (hachage): agneau
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('agneau haché', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- sauce hoisin (utilisé 1x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('sauce hoisin', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- cinq épices (utilisé 1x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('cinq épices', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- farine de sarrasin (utilisé 1x)
-- Type: Préparation composée
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('farine de sarrasin', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- poivre noir (utilisé 1x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('poivre noir', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- biscuits Graham (utilisé 1x)
-- Type: Transformation (cuisson): biscuits Graham
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('biscuits Graham', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- garam masala (utilisé 1x)
-- Type: Épice/mélange
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('garam masala', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- riz cuit froid (utilisé 1x)
-- Type: Transformation (cuisson): riz froid
INSERT INTO archetypes (name, created_at, updated_at)
VALUES ('riz cuit froid', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Total: 231 canonical + 82 archetypes
