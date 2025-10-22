-- VERSION 8 - MAPPING MANUEL COMPLET

BEGIN;

-- CANONICAL FOODS

-- artichaut violet (1x) - Retirer taille [de: artichauts violets moyens]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('artichaut violet', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- bicarbonate (4x) - Produit brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('bicarbonate', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- bouquet garni (9x) - Assemblage standard
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('bouquet garni', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- cassonade (3x) - Type différent
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cassonade', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- champignon (5x) - Singulariser [de: champignons]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('champignon', 3)
ON CONFLICT (canonical_name) DO NOTHING;

-- cumin (17x) - Graine brute
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('cumin', 10)
ON CONFLICT (canonical_name) DO NOTHING;

-- céleri (4x) - Base
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('céleri', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- eau (27x) - Liquide brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('eau', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- levure (4x) - Produit brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('levure', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- levure chimique (6x) - Produit brut
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('levure chimique', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- poivron rouge (6x) - Couleur importante
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('poivron rouge', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- salade (3x) - Légume
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('salade', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre (39x) - Base
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sucre', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- sucre glace (4x) - Forme différente
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('sucre glace', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- tomate cerise (1x) - Variété [de: tomates cerises]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('tomate cerise', 2)
ON CONFLICT (canonical_name) DO NOTHING;

-- vin blanc (11x) - Produit
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('vin blanc', 14)
ON CONFLICT (canonical_name) DO NOTHING;

-- yaourt (2x) - Produit laitier [de: yaourt nature]
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('yaourt', 7)
ON CONFLICT (canonical_name) DO NOTHING;

-- yaourt grec (3x) - Produit laitier
INSERT INTO canonical_foods (canonical_name, category_id)
VALUES ('yaourt grec', 7)
ON CONFLICT (canonical_name) DO NOTHING;


-- ARCHETYPES

-- ail en poudre (2x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('ail en poudre', 2)
ON CONFLICT (name) DO NOTHING;

-- bacon (4x) - Charcuterie
INSERT INTO archetypes (name, category_id)
VALUES ('bacon', 9)
ON CONFLICT (name) DO NOTHING;

-- baguette (2x) - Pain cuit
INSERT INTO archetypes (name, category_id)
VALUES ('baguette', 5)
ON CONFLICT (name) DO NOTHING;

-- beurre (61x) - Produit laitier transformé (barattage)
INSERT INTO archetypes (name, category_id)
VALUES ('beurre', 7)
ON CONFLICT (name) DO NOTHING;

-- beurre noisette (1x) - Beurre cuit
INSERT INTO archetypes (name, category_id)
VALUES ('beurre noisette', 7)
ON CONFLICT (name) DO NOTHING;

-- beurre salé (2x) - Beurre avec sel ajouté
INSERT INTO archetypes (name, category_id)
VALUES ('beurre salé', 7)
ON CONFLICT (name) DO NOTHING;

-- blanc d'oeuf (3x) - Partie séparée [de: blancs d'oeufs]
INSERT INTO archetypes (name, category_id)
VALUES ('blanc d'oeuf', 7)
ON CONFLICT (name) DO NOTHING;

-- boeuf haché (6x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('boeuf haché', 9)
ON CONFLICT (name) DO NOTHING;

-- bouillon (10x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('bouillon', 14)
ON CONFLICT (name) DO NOTHING;

-- bouillon de boeuf (5x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('bouillon de boeuf', 9)
ON CONFLICT (name) DO NOTHING;

-- cannelle (13x) - Écorce séchée
INSERT INTO archetypes (name, category_id)
VALUES ('cannelle', 10)
ON CONFLICT (name) DO NOTHING;

-- chapelure (6x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('chapelure', 5)
ON CONFLICT (name) DO NOTHING;

-- coriandre moulue (2x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('coriandre moulue', 10)
ON CONFLICT (name) DO NOTHING;

-- crème (5x) - Produit laitier transformé
INSERT INTO archetypes (name, category_id)
VALUES ('crème', 7)
ON CONFLICT (name) DO NOTHING;

-- crème fraîche (17x) - Produit laitier transformé
INSERT INTO archetypes (name, category_id)
VALUES ('crème fraîche', 7)
ON CONFLICT (name) DO NOTHING;

-- crème liquide (4x) - Produit laitier transformé
INSERT INTO archetypes (name, category_id)
VALUES ('crème liquide', 7)
ON CONFLICT (name) DO NOTHING;

-- cumin moulu (1x) - Graine moulue
INSERT INTO archetypes (name, category_id)
VALUES ('cumin moulu', 10)
ON CONFLICT (name) DO NOTHING;

-- curry (1x) - Mélange
INSERT INTO archetypes (name, category_id)
VALUES ('curry', 10)
ON CONFLICT (name) DO NOTHING;

-- farine (53x) - Céréale moulue
INSERT INTO archetypes (name, category_id)
VALUES ('farine', 5)
ON CONFLICT (name) DO NOTHING;

-- farine de sarrasin (1x) - Sarrasin moulu
INSERT INTO archetypes (name, category_id)
VALUES ('farine de sarrasin', 5)
ON CONFLICT (name) DO NOTHING;

-- flocon d'avoine (5x) - Transformation [de: flocons d'avoine]
INSERT INTO archetypes (name, category_id)
VALUES ('flocon d'avoine', 5)
ON CONFLICT (name) DO NOTHING;

-- fond de veau (4x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('fond de veau', 9)
ON CONFLICT (name) DO NOTHING;

-- fromage râpé (9x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('fromage râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- garam masala (1x) - Mélange
INSERT INTO archetypes (name, category_id)
VALUES ('garam masala', 10)
ON CONFLICT (name) DO NOTHING;

-- gruyère râpé (4x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('gruyère râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- huile (25x) - Extraction (générique)
INSERT INTO archetypes (name, category_id)
VALUES ('huile', 11)
ON CONFLICT (name) DO NOTHING;

-- huile d'olive (76x) - Extraction olive
INSERT INTO archetypes (name, category_id)
VALUES ('huile d'olive', 11)
ON CONFLICT (name) DO NOTHING;

-- huile de friture (4x) - Huile pour usage spécifique
INSERT INTO archetypes (name, category_id)
VALUES ('huile de friture', 11)
ON CONFLICT (name) DO NOTHING;

-- huile de sésame (3x) - Extraction sésame
INSERT INTO archetypes (name, category_id)
VALUES ('huile de sésame', 11)
ON CONFLICT (name) DO NOTHING;

-- huile végétale (1x) - Extraction végétale
INSERT INTO archetypes (name, category_id)
VALUES ('huile végétale', 11)
ON CONFLICT (name) DO NOTHING;

-- jaune d'oeuf (8x) - Partie séparée [de: jaunes d'oeufs]
INSERT INTO archetypes (name, category_id)
VALUES ('jaune d'oeuf', 7)
ON CONFLICT (name) DO NOTHING;

-- jus de citron (15x) - Extraction citron
INSERT INTO archetypes (name, category_id)
VALUES ('jus de citron', 1)
ON CONFLICT (name) DO NOTHING;

-- pain (1x) - Pain cuit
INSERT INTO archetypes (name, category_id)
VALUES ('pain', 5)
ON CONFLICT (name) DO NOTHING;

-- pain de campagne (2x) - Pain cuit
INSERT INTO archetypes (name, category_id)
VALUES ('pain de campagne', 5)
ON CONFLICT (name) DO NOTHING;

-- pain de mie (5x) - Pain cuit
INSERT INTO archetypes (name, category_id)
VALUES ('pain de mie', 5)
ON CONFLICT (name) DO NOTHING;

-- paprika (13x) - Piment séché et moulu
INSERT INTO archetypes (name, category_id)
VALUES ('paprika', 10)
ON CONFLICT (name) DO NOTHING;

-- paprika fumé (2x) - Piment séché, moulu et fumé
INSERT INTO archetypes (name, category_id)
VALUES ('paprika fumé', 10)
ON CONFLICT (name) DO NOTHING;

-- parmesan râpé (6x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('parmesan râpé', 7)
ON CONFLICT (name) DO NOTHING;

-- persil haché (3x) - Transformation
INSERT INTO archetypes (name, category_id)
VALUES ('persil haché', 10)
ON CONFLICT (name) DO NOTHING;

-- pâte feuilletée (4x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('pâte feuilletée', 14)
ON CONFLICT (name) DO NOTHING;

-- sauce béchamel (4x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce béchamel', 7)
ON CONFLICT (name) DO NOTHING;

-- sauce soja (14x) - Préparation
INSERT INTO archetypes (name, category_id)
VALUES ('sauce soja', 14)
ON CONFLICT (name) DO NOTHING;

-- saumon fumé (3x) - Fumage
INSERT INTO archetypes (name, category_id)
VALUES ('saumon fumé', 9)
ON CONFLICT (name) DO NOTHING;

-- tomate concassée (5x) - Transformation [de: tomates concassées]
INSERT INTO archetypes (name, category_id)
VALUES ('tomate concassée', 2)
ON CONFLICT (name) DO NOTHING;

-- tomate pelée (2x) - Transformation [de: tomates pelées]
INSERT INTO archetypes (name, category_id)
VALUES ('tomate pelée', 2)
ON CONFLICT (name) DO NOTHING;

-- vermicelle de riz (3x) - Pâtes [de: vermicelles de riz]
INSERT INTO archetypes (name, category_id)
VALUES ('vermicelle de riz', 5)
ON CONFLICT (name) DO NOTHING;

COMMIT;
