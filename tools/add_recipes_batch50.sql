-- ========================================================================
-- BATCH 50 : 10 recettes (ENTREE)
-- Source : bloc1_entrees.txt
-- ========================================================================

BEGIN;

-- 1. Quiche aux asperges
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux asperges', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Quiche à la carotte
INSERT INTO recipes (name, role, description)
VALUES ('Quiche à la carotte', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Quiche au chèvre
INSERT INTO recipes (name, role, description)
VALUES ('Quiche au chèvre', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Quiche aux lardons
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux lardons', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Quiche aux aubergines
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux aubergines', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Quiche au chou-fleur
INSERT INTO recipes (name, role, description)
VALUES ('Quiche au chou-fleur', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Quiche au bacon et fromage
INSERT INTO recipes (name, role, description)
VALUES ('Quiche au bacon et fromage', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Quiche aux poivrons
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux poivrons', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Quiche aux oignons caramélisés
INSERT INTO recipes (name, role, description)
VALUES ('Quiche aux oignons caramélisés', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Quiche au tofu et légumes
INSERT INTO recipes (name, role, description)
VALUES ('Quiche au tofu et légumes', 'ENTREE', 'Entrée - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 50 terminé' as message,
  COUNT(*) as total_recettes
FROM recipes;
