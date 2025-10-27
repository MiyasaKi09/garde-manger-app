-- =============================================================================
-- MAPPING COMPLET ET CORRECT canonical_foods → Ciqual
-- Généré manuellement avec vérifications
-- Total: 61 liens (incluant les 17 légumes déjà liés)
-- =============================================================================

-- Fruits
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13000') WHERE id = 1009 AND nutrition_id IS NULL; -- abricot
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13004') WHERE id = 1002 AND nutrition_id IS NULL; -- avocat
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13005') WHERE id = 1003 AND nutrition_id IS NULL; -- banane
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13007') WHERE id = 1006 AND nutrition_id IS NULL; -- cassis
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13008') WHERE id = 1008 AND nutrition_id IS NULL; -- cerise
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13009') WHERE id = 1015 AND nutrition_id IS NULL; -- citron
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13067') WHERE id = 1016 AND nutrition_id IS NULL; -- citron vert
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13010') WHERE id = 1017 AND nutrition_id IS NULL; -- coing
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13011') WHERE id = 1019 AND nutrition_id IS NULL; -- datte
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13014') WHERE id = 1022 AND nutrition_id IS NULL; -- fraise
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13015') WHERE id = 1023 AND nutrition_id IS NULL; -- framboise
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13016') WHERE id = 1024 AND nutrition_id IS NULL; -- fruit de la passion
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13083') WHERE id = 1026 AND nutrition_id IS NULL; -- goyave
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13018') WHERE id = 1027 AND nutrition_id IS NULL; -- grenade
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13019') WHERE id = 1028 AND nutrition_id IS NULL; -- groseille
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13021') WHERE id = 1029 AND nutrition_id IS NULL; -- kiwi
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13024') WHERE id = 1034 AND nutrition_id IS NULL; -- mandarine
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13030') WHERE id = 1013 AND nutrition_id IS NULL; -- brugnon
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13054') WHERE id = 1014 AND nutrition_id IS NULL; -- carambole
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '13002') WHERE id = 1010 AND nutrition_id IS NULL; -- ananas

-- Légumes (compléments aux 17 déjà liés)
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20052') WHERE id = 8003 AND nutrition_id IS NULL; -- artichaut
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20073') WHERE id = 8004 AND nutrition_id IS NULL; -- asperge
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20010') WHERE id = 14015 AND nutrition_id IS NULL; -- champignon
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20160') WHERE id = 14014 AND nutrition_id IS NULL; -- cèpe
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20105') WHERE id = 14025 AND nutrition_id IS NULL; -- morille
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20014') WHERE id = 14016 AND nutrition_id IS NULL; -- chou
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20023') WHERE id = 14013 AND nutrition_id IS NULL; -- céleri
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20128') WHERE id = 14005 AND nutrition_id IS NULL; -- courge butternut
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20099') WHERE id = 1033 AND nutrition_id IS NULL; -- mâche
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20181') WHERE id = 14028 AND nutrition_id IS NULL; -- panais

-- Herbes et épices
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11093') WHERE id = 8002 AND nutrition_id IS NULL; -- aneth
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11033') WHERE id = 1004 AND nutrition_id IS NULL; -- basilic
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11042') WHERE id = 14017 AND nutrition_id IS NULL; -- cumin
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11001') WHERE id = 14012 AND nutrition_id IS NULL; -- cannelle

-- Légumineuses
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20501') WHERE id = 14021 AND nutrition_id IS NULL; -- haricot blanc
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '20525') WHERE id = 14023 AND nutrition_id IS NULL; -- haricot rouge

-- Noix et graines
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15000') WHERE id = 11001 AND nutrition_id IS NULL; -- amande
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15024') WHERE id = 1011 AND nutrition_id IS NULL; -- châtaigne
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15004') WHERE id = 14026 AND nutrition_id IS NULL; -- noisette
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15047') WHERE id = 14019 AND nutrition_id IS NULL; -- graine de chia
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '15010') WHERE id = 14020 AND nutrition_id IS NULL; -- graine de sésame

-- Viandes et poissons
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '6101') WHERE id = 14011 AND nutrition_id IS NULL; -- bœuf
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '6250') WHERE id = 4001 AND nutrition_id IS NULL; -- agneau
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '26079') WHERE id = 9001 AND nutrition_id IS NULL; -- anchois

-- Produits de base
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '22000') WHERE id = 14027 AND nutrition_id IS NULL; -- œuf
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '18066') WHERE id = 14018 AND nutrition_id IS NULL; -- eau
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '17270') WHERE id = 14030 AND nutrition_id IS NULL; -- huile d'olive
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '17001') WHERE id = 14031 AND nutrition_id IS NULL; -- huile végétale
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11018') WHERE id = 14032 AND nutrition_id IS NULL; -- vinaigre
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '11104') WHERE id = 14033 AND nutrition_id IS NULL; -- sauce soja
UPDATE canonical_foods SET nutrition_id = (SELECT id FROM nutritional_data WHERE source_id = '54006') WHERE id = 14035 AND nutrition_id IS NULL; -- bouillon

-- Vérification finale
SELECT 
  COUNT(*) FILTER (WHERE nutrition_id IS NOT NULL) AS linked,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE nutrition_id IS NOT NULL) / COUNT(*), 1) AS percentage
FROM canonical_foods;
