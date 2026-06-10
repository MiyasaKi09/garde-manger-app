-- =============================================================================
-- Migration : ajout des aliments courants manquants d'une cuisine française
-- Date      : 2026-06-10
-- Auteur    : recipe-domain-expert
-- Logique   :
--   - Nouveaux CANONIQUES pour les aliments de base sans parent naturel existant.
--   - Nouveaux ARCHÉTYPES pour les transformations de canoniques existants.
--   - Overrides CIQUAL (archetype_nutrition_overrides) pour chaque archétype
--     dont la nutrition diffère significativement du canonique brut.
--   - Toutes les insertions sont idempotentes (ON CONFLICT DO NOTHING ou
--     WHERE NOT EXISTS).
--   - Aucun id n'est fixé manuellement (séquences auto).
-- =============================================================================


-- ============================================================
-- SECTION 1 : NOUVEAUX CANONIQUES
-- ============================================================

-- 1.1 Margarine
-- Pas de canonique parent naturel (matière grasse végétale transformée,
-- distincte du tournesol, colza ou soja bruts).
-- CIQUAL 16615 : "Matière grasse végétale ou margarine, 80% MG, doux"
INSERT INTO canonical_foods
  (canonical_name, category_id, keywords, primary_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   nutrition_id)
SELECT
  'margarine', 11,
  ARRAY['margarine', 'matière grasse végétale', 'tartiner', 'beurre végétal'],
  'g', 180, 90, 365,
  nd.id
FROM nutritional_data nd
WHERE nd.source_id = '16615'
ON CONFLICT (canonical_name) DO NOTHING;

-- 1.2 Lieu noir
-- Poisson blanc distinct du lieu jaune (nutrition différente) et du cabillaud.
-- CIQUAL 26134 : "Lieu noir, cru"
INSERT INTO canonical_foods
  (canonical_name, category_id, keywords, primary_unit, unit_weight_grams,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   nutrition_id)
SELECT
  'lieu noir', 9,
  ARRAY['lieu noir', 'colin', 'poisson blanc', 'merlan noir'],
  'g', NULL, NULL, 2, 90,
  nd.id
FROM nutritional_data nd
WHERE nd.source_id = '26134'
ON CONFLICT (canonical_name) DO NOTHING;

-- 1.3 Colin d'Alaska
-- Espèce distincte du lieu noir et du lieu jaune.
-- CIQUAL 26006 : "Lieu ou colin d'Alaska, cru"
INSERT INTO canonical_foods
  (canonical_name, category_id, keywords, primary_unit, unit_weight_grams,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   nutrition_id)
SELECT
  'colin d''alaska', 9,
  ARRAY['colin d''alaska', 'lieu alaska', 'merlan alaska', 'poisson blanc surgelé'],
  'g', NULL, NULL, 2, 90,
  nd.id
FROM nutritional_data nd
WHERE nd.source_id = '26006'
ON CONFLICT (canonical_name) DO NOTHING;

-- 1.4 Surimi
-- Produit transformé à base de poisson blanc + liants ; nutrition propre,
-- pas réductible à un poisson brut unique.
-- CIQUAL 26046 : "Surimi, bâtonnets, tranche ou râpé saveur crabe"
INSERT INTO canonical_foods
  (canonical_name, category_id, keywords, primary_unit, unit_weight_grams,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   nutrition_id)
SELECT
  'surimi', 9,
  ARRAY['surimi', 'bâtonnet crabe', 'crabe imitation', 'fish sticks'],
  'pièce', 17, NULL, 7, 180,
  nd.id
FROM nutritional_data nd
WHERE nd.source_id = '26046'
ON CONFLICT (canonical_name) DO NOTHING;

-- 1.5 Pousses de soja
-- Légume germé (Haricot mungo germé) — catégorie Légumes, distinct du soja
-- sec ou des fèves de soja.
-- CIQUAL 20183 : "Haricot mungo germé ou pousse de «soja», cru"
INSERT INTO canonical_foods
  (canonical_name, category_id, keywords, primary_unit, unit_weight_grams,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   nutrition_id)
SELECT
  'pousses de soja', 2,
  ARRAY['pousses de soja', 'germes de soja', 'haricot mungo germé', 'bean sprouts'],
  'g', NULL, NULL, 5, 30,
  nd.id
FROM nutritional_data nd
WHERE nd.source_id = '20183'
ON CONFLICT (canonical_name) DO NOTHING;


-- ============================================================
-- SECTION 2 : NOUVEAUX ARCHÉTYPES
-- ============================================================
-- Convention shelf_life : durées en jours (pantry/fridge/freezer)
-- expiry_kind : DLC = périssable daté, DDM = sec/conserve, ESTIMATE = frais sans date légale


-- ---- POISSONS / MER ----

-- 2.1 Sardines en conserve (huile) — canonique : sardine
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry, open_shelf_life_days_fridge)
SELECT
  'sardines en conserve', cf.id,
  'appertisation en conserve métallique, huile',
  'DDM', false, 'boîte', 135,
  1460, NULL, NULL, NULL, 3
FROM canonical_foods cf
WHERE cf.canonical_name = 'sardine'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'sardines en conserve');

-- 2.2 Maquereau en conserve — canonique : maquereau
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry, open_shelf_life_days_fridge)
SELECT
  'maquereau en conserve', cf.id,
  'appertisation en conserve métallique, marinade ou huile',
  'DDM', false, 'boîte', 190,
  1460, NULL, NULL, NULL, 3
FROM canonical_foods cf
WHERE cf.canonical_name = 'maquereau'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'maquereau en conserve');

-- 2.3 Sardines fraîches (archétype default) — canonique : sardine
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'sardines fraîches', cf.id,
  'poisson frais entier ou fileté, cru',
  'DLC', true, 'g', NULL,
  NULL, 2, 90,
  2
FROM canonical_foods cf
WHERE cf.canonical_name = 'sardine'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'sardines fraîches');

-- 2.4 Maquereau frais (archétype default) — canonique : maquereau
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'maquereau frais', cf.id,
  'poisson frais entier ou fileté, cru',
  'DLC', true, 'g', NULL,
  NULL, 2, 90,
  2
FROM canonical_foods cf
WHERE cf.canonical_name = 'maquereau'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'maquereau frais');

-- 2.5 Lieu jaune frais (archétype default) — canonique : lieu jaune
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'lieu jaune frais', cf.id,
  'poisson blanc frais, cru',
  'DLC', true, 'g', NULL,
  NULL, 2, 90,
  2
FROM canonical_foods cf
WHERE cf.canonical_name = 'lieu jaune'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'lieu jaune frais');

-- 2.6 Lieu noir frais — canonique : lieu noir
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'lieu noir frais', cf.id,
  'poisson blanc frais, cru',
  'DLC', true, 'g', NULL,
  NULL, 2, 90,
  2
FROM canonical_foods cf
WHERE cf.canonical_name = 'lieu noir'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'lieu noir frais');

-- 2.7 Lieu noir surgelé — canonique : lieu noir
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'lieu noir surgelé', cf.id,
  'surgélation après conditionnement en filets',
  'DDM', false, 'g', NULL,
  NULL, NULL, 180,
  2
FROM canonical_foods cf
WHERE cf.canonical_name = 'lieu noir'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'lieu noir surgelé');

-- 2.8 Colin d'Alaska surgelé — canonique : colin d'alaska
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'colin d''alaska surgelé', cf.id,
  'surgélation après conditionnement en filets ou portions panées',
  'DDM', true, 'g', NULL,
  NULL, NULL, 180,
  2
FROM canonical_foods cf
WHERE cf.canonical_name = 'colin d''alaska'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'colin d''alaska surgelé');


-- ---- CHARCUTERIE ----

-- 2.9 Saucisson sec — canonique : porc
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry, open_shelf_life_days_fridge)
SELECT
  'saucisson sec', cf.id,
  'séchage et maturation de viande de porc hachée, embossée et séchée à l''air',
  'DDM', false, 'g', NULL,
  30, 90, 180,
  14, 21
FROM canonical_foods cf
WHERE cf.canonical_name = 'porc'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'saucisson sec');

-- 2.10 Merguez — canonique : agneau
-- La merguez classique est bœuf + mouton ; on la rattache à agneau (ovin)
-- car c'est la viande dominante et l'agneau est le seul canonique ovin existant.
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'merguez', cf.id,
  'saucisse crue épicée à base de bœuf et mouton/agneau, embossée dans boyau naturel',
  'DLC', false, 'pièce', 80,
  NULL, 3, 60,
  3
FROM canonical_foods cf
WHERE cf.canonical_name = 'agneau'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'merguez');

-- 2.11 Chorizo (archétype default) — canonique : chorizo
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry, open_shelf_life_days_fridge)
SELECT
  'chorizo', cf.id,
  'saucisse sèche ou semi-sèche de porc épicée au paprika',
  'DDM', true, 'g', NULL,
  30, 60, 180,
  14, 21
FROM canonical_foods cf
WHERE cf.canonical_name = 'chorizo'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'chorizo');


-- ---- HUILES ----

-- 2.12 Huile de tournesol — canonique : tournesol
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, density_g_per_ml,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'huile de tournesol', cf.id,
  'extraction et raffinage des graines de tournesol',
  'DDM', true, 'ml', 0.92,
  540, NULL, NULL,
  90
FROM canonical_foods cf
WHERE cf.canonical_name = 'tournesol'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'huile de tournesol');

-- 2.13 Huile de colza — canonique : huile végétale
-- Le colza n'a pas de canonique propre ; huile végétale est le bon parent.
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, density_g_per_ml,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'huile de colza', cf.id,
  'extraction et raffinage des graines de colza (canola)',
  'DDM', false, 'ml', 0.92,
  540, NULL, NULL,
  90
FROM canonical_foods cf
WHERE cf.canonical_name = 'huile végétale'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'huile de colza');

-- 2.14 Huile de sésame — canonique : graine de sésame
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, density_g_per_ml,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'huile de sésame', cf.id,
  'extraction à froid ou torréfaction des graines de sésame',
  'DDM', false, 'ml', 0.92,
  365, NULL, NULL,
  60
FROM canonical_foods cf
WHERE cf.canonical_name = 'graine de sésame'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'huile de sésame');


-- ---- VINAIGRES ----

-- 2.15 Vinaigre balsamique — canonique : vinaigre
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, density_g_per_ml,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'vinaigre balsamique', cf.id,
  'réduction et vieillissement du moût de raisin (acide acétique + sucres)',
  'DDM', false, 'ml', 1.22,
  1460, NULL, NULL,
  365
FROM canonical_foods cf
WHERE cf.canonical_name = 'vinaigre'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'vinaigre balsamique');

-- 2.16 Vinaigre de cidre — canonique : vinaigre
-- Archétype déjà existant sous ce nom dans la liste... vérifié absent.
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, density_g_per_ml,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'vinaigre de cidre', cf.id,
  'fermentation acétique du cidre de pomme',
  'DDM', false, 'ml', 1.01,
  1460, NULL, NULL,
  365
FROM canonical_foods cf
WHERE cf.canonical_name = 'vinaigre'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'vinaigre de cidre');


-- ---- RIZ ----

-- 2.17 Riz blanc long grain — canonique : riz
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'riz blanc long grain', cf.id,
  'riz décortiqué et blanchi, grain long, cru',
  'DDM', true, 'g', NULL,
  1095, NULL, NULL,
  365
FROM canonical_foods cf
WHERE cf.canonical_name = 'riz'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'riz blanc long grain');

-- 2.18 Riz basmati — canonique : riz
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'riz basmati', cf.id,
  'riz long grain parfumé, décortiqué et blanchi, variété basmati',
  'DDM', false, 'g', NULL,
  1095, NULL, NULL,
  365
FROM canonical_foods cf
WHERE cf.canonical_name = 'riz'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'riz basmati');

-- 2.19 Riz complet — canonique : riz
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'riz complet', cf.id,
  'riz décortiqué uniquement (son conservé), grain long ou rond',
  'DDM', false, 'g', NULL,
  365, NULL, NULL,
  180
FROM canonical_foods cf
WHERE cf.canonical_name = 'riz'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'riz complet');

-- 2.20 Vermicelles de riz — canonique : riz
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'vermicelles de riz', cf.id,
  'farine de riz extrudée en filaments fins, séchée',
  'DDM', false, 'g', NULL,
  730, NULL, NULL,
  180
FROM canonical_foods cf
WHERE cf.canonical_name = 'riz'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'vermicelles de riz');


-- ---- PÂTES ----

-- 2.21 Pâtes sèches standard — canonique : blé
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'pâtes sèches', cf.id,
  'semoule de blé dur extrudée et séchée (spaghetti, penne, fusilli…)',
  'DDM', false, 'g', NULL,
  730, NULL, NULL,
  180
FROM canonical_foods cf
WHERE cf.canonical_name = 'blé'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'pâtes sèches');

-- 2.22 Pâtes complètes — canonique : blé
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'pâtes complètes', cf.id,
  'semoule de blé complet extrudée et séchée',
  'DDM', false, 'g', NULL,
  365, NULL, NULL,
  180
FROM canonical_foods cf
WHERE cf.canonical_name = 'blé'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'pâtes complètes');

-- 2.23 Galette de sarrasin — canonique : sarrasin
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'galette de sarrasin', cf.id,
  'galette bretonne à base de farine de sarrasin (blé noir), nature',
  'DLC', true, 'pièce', 60,
  NULL, 5, 60,
  5
FROM canonical_foods cf
WHERE cf.canonical_name = 'sarrasin'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'galette de sarrasin');


-- ---- FARINE ----

-- 2.24 Farine de blé T55 — canonique : blé
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'farine de blé T55', cf.id,
  'farine blanche tout usage (panification), taux cendres 0,50-0,60%',
  'DDM', false, 'g', NULL,
  365, NULL, NULL,
  180
FROM canonical_foods cf
WHERE cf.canonical_name = 'blé'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'farine de blé T55');

-- 2.25 Farine de blé T45 (pâtisserie) — canonique : blé
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'farine de blé T45', cf.id,
  'farine blanche très fine pour pâtisserie, taux cendres < 0,50%',
  'DDM', false, 'g', NULL,
  365, NULL, NULL,
  180
FROM canonical_foods cf
WHERE cf.canonical_name = 'blé'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'farine de blé T45');

-- 2.26 Farine complète T110 — canonique : blé
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'farine complète T110', cf.id,
  'farine semi-complète à fort taux d''extraction, taux cendres 0,90-1,10%',
  'DDM', false, 'g', NULL,
  180, NULL, NULL,
  90
FROM canonical_foods cf
WHERE cf.canonical_name = 'blé'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'farine complète T110');


-- ---- FLOCONS / CÉRÉALES PETIT-DÉJEUNER ----

-- 2.27 Flocons d'avoine — déjà archétype ? OUI : "flocon d'avoine" (singulier, minuscule).
-- L'archétype existant s'appelle exactement "flocon d'avoine" — pas de doublon.

-- 2.28 Muesli — canonique : avoine
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'muesli', cf.id,
  'mélange de flocons de céréales, fruits secs et noix, non cuit',
  'DDM', false, 'g', NULL,
  365, NULL, NULL,
  90
FROM canonical_foods cf
WHERE cf.canonical_name = 'avoine'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'muesli');

-- 2.29 Biscottes — canonique : blé
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'biscottes', cf.id,
  'pain de mie tranché, cuit une seconde fois pour déshydratation',
  'DDM', false, 'pièce', 10,
  365, NULL, NULL,
  30
FROM canonical_foods cf
WHERE cf.canonical_name = 'blé'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'biscottes');

-- 2.30 Crackers nature — canonique : blé
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'crackers nature', cf.id,
  'biscuit sec salé à base de farine de blé, nature',
  'DDM', false, 'pièce', 8,
  365, NULL, NULL,
  30
FROM canonical_foods cf
WHERE cf.canonical_name = 'blé'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'crackers nature');


-- ---- CHOCOLAT ----

-- 2.31 Chocolat blanc — canonique : cacao
-- Le beurre de cacao est la fraction utilisée ; cacao reste le parent logique.
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'chocolat blanc', cf.id,
  'tablette à base de beurre de cacao, lait et sucre, sans pâte de cacao',
  'DDM', false, 'g', NULL,
  365, NULL, NULL,
  90
FROM canonical_foods cf
WHERE cf.canonical_name = 'cacao'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'chocolat blanc');

-- 2.32 Chocolat au lait — canonique : cacao
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'chocolat au lait', cf.id,
  'tablette de chocolat à teneur réduite en cacao avec addition de lait en poudre',
  'DDM', false, 'g', NULL,
  365, NULL, NULL,
  90
FROM canonical_foods cf
WHERE cf.canonical_name = 'cacao'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'chocolat au lait');


-- ---- CONSERVES / ÉPICERIE SALÉE ----

-- 2.33 Maïs en conserve — canonique : maïs
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'maïs en conserve', cf.id,
  'grains de maïs doux appertisés en boîte métallique, égouttés',
  'DDM', false, 'boîte', 285,
  1460, NULL, NULL,
  3
FROM canonical_foods cf
WHERE cf.canonical_name = 'maïs'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'maïs en conserve');

-- 2.34 Lait de coco (conserve) — canonique : noix de coco
-- L'archétype "Lait de coco" existe déjà (capitale L).
-- On vérifie : "Lait de coco" = existant. On ne crée pas de doublon.
-- En revanche, "crème de coco" (concentration supérieure) est absent.
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, density_g_per_ml,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'crème de coco', cf.id,
  'pulpe de noix de coco broyée, centrifugée, concentration supérieure au lait de coco',
  'DDM', false, 'ml', 0.96,
  730, NULL, NULL,
  5
FROM canonical_foods cf
WHERE cf.canonical_name = 'noix de coco'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'crème de coco');

-- 2.35 Bouillon cube de volaille — canonique : bouillon
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'bouillon cube de volaille', cf.id,
  'concentré déshydraté de bouillon de volaille en cube ou granulés',
  'DDM', false, 'cube', 10,
  730, NULL, NULL,
  180
FROM canonical_foods cf
WHERE cf.canonical_name = 'bouillon'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'bouillon cube de volaille');

-- 2.36 Bouillon cube de bœuf — canonique : bouillon
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'bouillon cube de bœuf', cf.id,
  'concentré déshydraté de bouillon de bœuf en cube ou granulés',
  'DDM', false, 'cube', 10,
  730, NULL, NULL,
  180
FROM canonical_foods cf
WHERE cf.canonical_name = 'bouillon'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'bouillon cube de bœuf');

-- 2.37 Bouillon cube de légumes — canonique : bouillon de légumes
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'bouillon cube de légumes', cf.id,
  'concentré déshydraté de légumes en cube ou granulés',
  'DDM', false, 'cube', 10,
  730, NULL, NULL,
  180
FROM canonical_foods cf
WHERE cf.canonical_name = 'bouillon de légumes'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'bouillon cube de légumes');

-- 2.38 Fromage fondu en tranchettes — canonique : lait
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'fromage fondu en tranchettes', cf.id,
  'fromage fondu à tartiner ou garnir, conditionné en tranches individuelles',
  'DLC', false, 'tranchette', 20,
  NULL, 30, 90,
  14
FROM canonical_foods cf
WHERE cf.canonical_name = 'lait'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'fromage fondu en tranchettes');

-- 2.39 Pousses de soja fraîches — canonique : pousses de soja
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'pousses de soja fraîches', cf.id,
  'haricot mungo germé frais, cru, vendu en barquette réfrigérée',
  'DLC', true, 'g', NULL,
  NULL, 5, 30,
  5
FROM canonical_foods cf
WHERE cf.canonical_name = 'pousses de soja'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'pousses de soja fraîches');

-- 2.40 Pousses de soja en conserve — canonique : pousses de soja
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'pousses de soja en conserve', cf.id,
  'haricot mungo germé appertisé en boîte métallique, égoutté',
  'DDM', false, 'boîte', 285,
  1460, NULL, NULL,
  3
FROM canonical_foods cf
WHERE cf.canonical_name = 'pousses de soja'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'pousses de soja en conserve');

-- 2.41 Café moulu — canonique : café
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_pantry)
SELECT
  'café moulu', cf.id,
  'grains de café torréfiés et moulus, conditionné sous atmosphère protectrice',
  'DDM', true, 'g', NULL,
  365, NULL, NULL,
  30
FROM canonical_foods cf
WHERE cf.canonical_name = 'café'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'café moulu');

-- 2.42 Surimi en bâtonnets — canonique : surimi
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'surimi en bâtonnets', cf.id,
  'bâtonnets de chair de poisson reconstitués, arôme crabe, pasteurisés',
  'DLC', true, 'pièce', 17,
  NULL, 7, 90,
  3
FROM canonical_foods cf
WHERE cf.canonical_name = 'surimi'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'surimi en bâtonnets');

-- 2.43 Margarine à tartiner — canonique : margarine
INSERT INTO archetypes
  (name, canonical_food_id, process, expiry_kind, is_default,
   primary_unit, grams_per_unit,
   shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer,
   open_shelf_life_days_fridge)
SELECT
  'margarine à tartiner', cf.id,
  'matière grasse végétale à 80% MG, conditionnée en barquette, usage tartinage et cuisson',
  'DLC', true, 'g', NULL,
  NULL, 90, 365,
  90
FROM canonical_foods cf
WHERE cf.canonical_name = 'margarine'
  AND NOT EXISTS (SELECT 1 FROM archetypes a WHERE a.name = 'margarine à tartiner');


-- ============================================================
-- SECTION 3 : OVERRIDES CIQUAL
-- Pour chaque archétype dont la nutrition diffère du canonique brut,
-- on pointe directement l'entrée CIQUAL la plus représentative.
-- ============================================================

-- 3.1 Sardines en conserve → CIQUAL 26034 (sardine à l'huile, appertisée, égouttée)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Sardine appertisée à l''huile : teneur en lipides et sodium significativement différente de la sardine crue'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'sardines en conserve'
  AND nd.source_id = '26034'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.2 Maquereau en conserve → CIQUAL 26051 (maquereau cru — le plus proche disponible)
-- Note : pas de code CIQUAL spécifique pour maquereau en conserve dans nutritional_data ;
-- on utilise le cru en attendant une entrée plus précise.
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Maquereau en conserve : en l''absence d''entrée CIQUAL dédiée pour la conserve, référence au maquereau cru'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'maquereau en conserve'
  AND nd.source_id = '26051'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.3 Saucisson sec → CIQUAL 30300
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Saucisson sec : viande de porc séchée et salée, profil lipidique et sodique radicalement différent du porc frais'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'saucisson sec'
  AND nd.source_id = '30300'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.4 Merguez → CIQUAL 30150 (merguez crue, aliment moyen)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Merguez crue : mélange bœuf/mouton épicé, teneur en graisses et sel différente du canonique agneau brut'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'merguez'
  AND nd.source_id = '30150'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.5 Chorizo → CIQUAL 30315
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Chorizo : saucisse sèche de porc épicée au paprika, profil calorique et sodique très différent du porc brut'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'chorizo'
  AND nd.source_id = '30315'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.6 Huile de tournesol → CIQUAL 17440
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Huile de tournesol : corps gras pur à 100% lipides, nutrition radicalement différente de la graine brute'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'huile de tournesol'
  AND nd.source_id = '17440'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.7 Huile de colza → CIQUAL 17130
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Huile de colza : corps gras pur, enrichi en oméga-3 (acide alpha-linolénique), profil propre'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'huile de colza'
  AND nd.source_id = '17130'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.8 Huile de sésame → CIQUAL 17400
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Huile de sésame : corps gras pur torréfié, profil en acides gras spécifique (sésamol, sesamine)'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'huile de sésame'
  AND nd.source_id = '17400'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.9 Vinaigre balsamique → CIQUAL 11091
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Vinaigre balsamique : teneur en sucres élevée (moût de raisin concentré), calorique vs vinaigre ordinaire'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'vinaigre balsamique'
  AND nd.source_id = '11091'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.10 Vinaigre de cidre → CIQUAL 11090
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Vinaigre de cidre : acidité et profil minéral propre à la fermentation du cidre'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'vinaigre de cidre'
  AND nd.source_id = '11090'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.11 Riz basmati → CIQUAL 9119 (riz thaï ou basmati, cru)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Riz basmati cru : index glycémique plus bas que le riz blanc standard, profil glucidique distinct'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'riz basmati'
  AND nd.source_id = '9119'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.12 Riz complet → CIQUAL 9102 (riz complet, cru)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Riz complet : son conservé, teneur en fibres et micronutriments significativement plus élevée que le riz blanc'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'riz complet'
  AND nd.source_id = '9102'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.13 Vermicelles de riz → CIQUAL 9900 (vermicelle de riz, sèche)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Vermicelles de riz sèches : composition différente du riz blanc cru (amidon rétrogradé, pas de protéines de son)'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'vermicelles de riz'
  AND nd.source_id = '9900'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.14 Pâtes sèches → CIQUAL 9810 (pâtes sèches standard, crues)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Pâtes sèches standard crues : semoule de blé dur, profil protéique et glucidique distinct du blé grain entier'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'pâtes sèches'
  AND nd.source_id = '9810'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.15 Pâtes complètes → CIQUAL 9870
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Pâtes complètes crues : semoule de blé complet, fibres × 2,5 par rapport aux pâtes blanches'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'pâtes complètes'
  AND nd.source_id = '9870'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.16 Galette de sarrasin → CIQUAL 23801
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Galette de sarrasin préemballée : sans gluten, profil glucidique et lipidique propre à la préparation'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'galette de sarrasin'
  AND nd.source_id = '23801'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.17 Farine de blé T55 → CIQUAL 9436
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Farine T55 : farine blanche panification, teneur protéique et glucidique propre au blé moulé raffiné'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'farine de blé T55'
  AND nd.source_id = '9436'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.18 Farine de blé T45 → CIQUAL 9440
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Farine T45 pâtisserie : extraction plus poussée, teneur en amidon légèrement supérieure à T55'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'farine de blé T45'
  AND nd.source_id = '9440'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.19 Farine complète T110 → CIQUAL 9410
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Farine T110 semi-complète : fibres × 3 vs T55, teneur en minéraux (magnésium, fer) significativement plus haute'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'farine complète T110'
  AND nd.source_id = '9410'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.20 Muesli → CIQUAL 32128 (muesli floconneux traditionnel)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Muesli floconneux : mélange céréales + fruits secs, profil sucres et fibres distinct du grain d''avoine brut'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'muesli'
  AND nd.source_id = '32128'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.21 Biscottes → CIQUAL 7300
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Biscotte classique : pain déshydraté, densité calorique et sodique différente du pain frais'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'biscottes'
  AND nd.source_id = '7300'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.22 Crackers nature → CIQUAL 38402
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Crackers nature : biscuit sec salé, teneur en lipides (matière grasse ajoutée) et sel distincte de la farine'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'crackers nature'
  AND nd.source_id = '38402'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.23 Chocolat blanc → CIQUAL 31010
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Chocolat blanc : pas de pâte de cacao, profil sucres et lipides (beurre de cacao + lait) très différent du cacao poudre'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'chocolat blanc'
  AND nd.source_id = '31010'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.24 Chocolat au lait → CIQUAL 31004
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Chocolat au lait en tablette : addition de lait en poudre et sucre, profil calorique et sucres distinct du cacao brut'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'chocolat au lait'
  AND nd.source_id = '31004'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.25 Maïs en conserve → CIQUAL 20066
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Maïs doux appertisé égoutté : teneur en sucres différente du maïs grain sec, sodium ajouté'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'maïs en conserve'
  AND nd.source_id = '20066'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.26 Crème de coco → CIQUAL 18041 (même entrée que lait de coco — seule disponible)
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Crème de coco : concentration en matière grasse supérieure au lait de coco, même référence CIQUAL disponible (18041)'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'crème de coco'
  AND nd.source_id = '18041'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.27 Bouillon cube de volaille → CIQUAL 11174
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Bouillon cube déshydraté de volaille : très riche en sodium (> 10 000 mg/100g), profil radicalement différent du bouillon liquide'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'bouillon cube de volaille'
  AND nd.source_id = '11174'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.28 Fromage fondu en tranchettes → CIQUAL 12300
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Fromage fondu en tranchettes : sels de fonte ajoutés, teneur en sodium et calcium distincte du fromage affiné'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'fromage fondu en tranchettes'
  AND nd.source_id = '12300'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.29 Pousses de soja en conserve → CIQUAL 20029 (haricot mungo appertisé égoutté)
-- Vérifions d'abord que ce code existe dans nutritional_data.
-- Note : si absent, l'INSERT ne fera rien (sous-requête retourne 0 lignes).
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Pousses de soja appertisées : processus thermique, perte en vitamine C et légère modification du profil vs frais'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'pousses de soja en conserve'
  AND nd.source_id = '20029'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.30 Café moulu → CIQUAL 18003
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Café moulu : torréfaction produit des molécules de Maillard, perte chlorogénique vs grain vert, profil propre'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'café moulu'
  AND nd.source_id = '18003'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.31 Margarine à tartiner → CIQUAL 16615
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Margarine 80% MG : corps gras végétal émulsionné, profil en acides gras (trans ou non) propre à la formulation'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'margarine à tartiner'
  AND nd.source_id = '16615'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );

-- 3.32 Surimi en bâtonnets → CIQUAL 26046
INSERT INTO archetype_nutrition_overrides (archetype_id, nutrition_id, reason)
SELECT a.id, nd.id,
  'Surimi bâtonnets : produit transformé (fécule, arôme crabe, sel), profil très différent du poisson brut'
FROM archetypes a, nutritional_data nd
WHERE a.name = 'surimi en bâtonnets'
  AND nd.source_id = '26046'
  AND NOT EXISTS (
    SELECT 1 FROM archetype_nutrition_overrides ano
    WHERE ano.archetype_id = a.id AND ano.nutrition_id = nd.id
  );
