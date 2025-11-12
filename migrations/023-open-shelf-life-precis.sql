-- Migration 023: Complétion précise des open_shelf_life (261 valeurs)
-- Date: 2025-11-06
-- Description: Complète les durées après ouverture de manière réaliste selon les types de produits

DO $$
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   COMPLÉTION PRÉCISE OPEN_SHELF_LIFE (261 valeurs)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- =====================================================
  -- OPEN_FRIDGE: LÉGUMES TRANSFORMÉS GRILLÉS/CUITS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🔥 LÉGUMES GRILLÉS/CUITS (open_fridge: 3 jours)';

  UPDATE archetypes SET open_shelf_life_days_fridge = 3
  WHERE id IN (10, 15, 22, 59); -- Poivrons grillés, aubergines grillées, courgettes grillées, pommes au four

  -- =====================================================
  -- OPEN_FRIDGE: PURÉES ET COMPOTES
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥄 PURÉES/COMPOTES (open_fridge: 5 jours)';

  UPDATE archetypes SET open_shelf_life_days_fridge = 5
  WHERE id IN (16, 52, 62, 68, 74, 79, 84, 89, 92); -- Purées légumes/fruits, compotes, coulis

  -- =====================================================
  -- OPEN_FRIDGE: JUS FRAIS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥤 JUS FRAIS (open_fridge: 2-3 jours)';

  UPDATE archetypes SET open_shelf_life_days_fridge = 2
  WHERE id IN (8, 27, 34, 55, 64, 70, 76, 81, 86, 95); -- Jus de légumes/fruits

  -- =====================================================
  -- OPEN_FRIDGE: CONSERVES/BOCAUX/CONFITS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🏺 CONSERVES/BOCAUX (open_fridge: 7 jours)';

  UPDATE archetypes SET open_shelf_life_days_fridge = 7
  WHERE id IN (1, 2, 3, 5, 14, 36, 37, 38, 40, 69, 71, 80, 82, 85, 87); -- Tomates confites, conserves, bocaux, confitures maison

  -- =====================================================
  -- OPEN_FRIDGE: LACTO-FERMENTÉS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🦠 LACTO-FERMENTÉS (open_fridge: 14-30 jours)';

  UPDATE archetypes SET open_shelf_life_days_fridge = 30
  WHERE id IN (6, 12, 23, 25, 30, 31, 105); -- Lacto-fermentés longue durée

  -- =====================================================
  -- OPEN_FRIDGE: PRODUITS SÉCHÉS/DÉSHYDRATÉS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '☀️ PRODUITS SÉCHÉS (open_fridge: 90 jours)';

  UPDATE archetypes SET open_shelf_life_days_fridge = 90
  WHERE id IN (17, 24, 26, 33, 46, 48, 50, 51, 58, 61, 67, 73, 88, 93); -- Chips, séchés, déshydratés

  -- =====================================================
  -- OPEN_FRIDGE: PURÉES CONGELÉES
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '❄️ PURÉES CONGELÉES (open_fridge: 3 jours après décongélation)';

  UPDATE archetypes SET open_shelf_life_days_fridge = 3
  WHERE id IN (13, 18, 19, 20, 28, 32, 45, 47, 57, 66, 72, 91, 97); -- Purées/produits congelés

  -- =====================================================
  -- OPEN_FRIDGE: HERBES CONGELÉES
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🌿 HERBES CONGELÉES (open_fridge: 7 jours)';

  UPDATE archetypes SET open_shelf_life_days_fridge = 7
  WHERE id IN (108, 112, 116, 125, 128, 132, 141, 148); -- Herbes congelées

  -- =====================================================
  -- OPEN_FRIDGE: POUDRES/ÉPICES
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🧂 POUDRES/SELS AROMATISÉS (open_fridge: 180 jours)';

  UPDATE archetypes SET open_shelf_life_days_fridge = 180
  WHERE id IN (9, 35, 39, 49, 98, 99, 109, 113, 118, 122, 139); -- Poudres, sels, épices

  -- =====================================================
  -- OPEN_FRIDGE: PAINS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍞 PAINS (open_fridge: 3 jours)';

  UPDATE archetypes SET open_shelf_life_days_fridge = 3
  WHERE id IN (321, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441); -- Pains divers

  -- =====================================================
  -- OPEN_PANTRY: PÂTES SÈCHES
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍝 PÂTES SÈCHES (open_pantry: 180 jours)';

  UPDATE archetypes SET open_shelf_life_days_pantry = 180
  WHERE id IN (322, 323, 324, 330, 457, 458, 459, 460, 461, 463, 464, 465, 466, 467, 468, 469, 470); -- Pâtes sèches

  -- =====================================================
  -- OPEN_PANTRY: CHAPELURE/SEMOULE
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🌾 CHAPELURE/SEMOULE (open_pantry: 90 jours)';

  UPDATE archetypes SET open_shelf_life_days_pantry = 90
  WHERE id IN (306, 329); -- Chapelure, semoule

  -- =====================================================
  -- OPEN_PANTRY: PAINS (ambiant = court)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥖 PAINS AMBIANT (open_pantry: 1-2 jours)';

  UPDATE archetypes SET open_shelf_life_days_pantry = 1
  WHERE id IN (321, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441); -- Pains rassissent vite

  -- =====================================================
  -- OPEN_PANTRY: ALCOOLS (bière/cidre)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍺 BIÈRE/CIDRE (open_pantry: 3 jours - perd CO2)';

  UPDATE archetypes SET open_shelf_life_days_pantry = 3
  WHERE id IN (339, 340, 341, 342, 343, 344); -- Bières et cidres

  -- =====================================================
  -- OPEN_PANTRY: SAUCE TOMATE (conserve)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍅 SAUCE TOMATE CONSERVE (open_pantry: 7 jours mais FRIGO conseillé)';

  UPDATE archetypes SET open_shelf_life_days_pantry = 7
  WHERE id = 327; -- Sauce tomate

  -- =====================================================
  -- OPEN_PANTRY: LAITS UHT (doit aller au frigo après ouverture!)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥛 LAITS UHT/VÉGÉTAUX (open_pantry: 0 - doit aller au frigo après ouverture)';

  -- Note: Ces produits n'ont PAS de open_pantry car ils doivent aller au frigo après ouverture
  -- On ajoute uniquement l'open_fridge

  UPDATE archetypes SET open_shelf_life_days_fridge = 3
  WHERE id IN (185, 186, 187, 188, 189, 190, 191, 192, 194, 220, 221, 222, 224, 228, 229); -- Laits

  UPDATE archetypes SET open_shelf_life_days_fridge = 90
  WHERE id = 193; -- Lait en poudre (se conserve mieux)

  -- =====================================================
  -- OPEN_PANTRY: LÉGUMES/FRUITS TRANSFORMÉS
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥫 LÉGUMES/FRUITS TRANSFORMÉS (open_pantry: 7 jours puis FRIGO)';

  -- Tomates transformées
  UPDATE archetypes SET open_shelf_life_days_pantry = 3
  WHERE id IN (1, 2, 3, 5, 6, 8, 10, 15, 16, 22, 48); -- Tomates, poivrons, aubergines, courgettes transformés

  -- Ketchup (plus stable grâce au sucre/vinaigre)
  UPDATE archetypes SET open_shelf_life_days_pantry = 90
  WHERE id = 7; -- Ketchup maison

  -- Lacto-fermentés (se conservent longtemps)
  UPDATE archetypes SET open_shelf_life_days_pantry = 30
  WHERE id IN (12, 23, 25, 30, 31, 105); -- Lacto-fermentés

  -- Produits séchés/déshydratés (très stable)
  UPDATE archetypes SET open_shelf_life_days_pantry = 180
  WHERE id IN (9, 17, 24, 26, 33, 35, 39, 46, 49, 50, 51, 58, 61, 67, 73, 88, 93, 98, 99); -- Séchés, poudres

  -- Produits congelés (pas de pantry après ouverture)
  UPDATE archetypes SET open_shelf_life_days_pantry = 0
  WHERE id IN (13, 18, 19, 20, 28, 32, 45, 47, 57, 66, 72, 91, 97, 108, 112, 116, 125, 128, 132, 141, 148); -- Congelés = frigo uniquement

  -- Compotes/purées/jus frais (doivent aller au frigo)
  UPDATE archetypes SET open_shelf_life_days_pantry = 0
  WHERE id IN (21, 34, 42, 52, 55, 59, 62, 64, 68, 69, 70, 71, 74, 76, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 89, 92, 95, 118); -- Frais seulement

  -- Confitures (longue conservation grâce au sucre)
  UPDATE archetypes SET open_shelf_life_days_pantry = 30
  WHERE id IN (69, 80, 85); -- Confitures maison

  -- Sels aromatisés (très stable)
  UPDATE archetypes SET open_shelf_life_days_pantry = 365
  WHERE id IN (109, 113, 122, 139); -- Sels

  -- Herbes congelées (pas de pantry)
  UPDATE archetypes SET open_shelf_life_days_pantry = 0
  WHERE id IN (108, 112, 116, 125, 128, 132, 141, 148); -- Herbes congelées

  -- Produits animaux (œufs, viandes) - PAS de pantry après ouverture
  UPDATE archetypes SET open_shelf_life_days_pantry = 0
  WHERE id IN (302, 304, 305, 318); -- Blanc d'œuf, bœuf haché, etc.

  RAISE NOTICE '';
  RAISE NOTICE '✅ Complétion de 261 open_shelf_life terminée';
  RAISE NOTICE '';

END $$;

-- Vérification
SELECT
  'Archetypes SANS open_fridge (qui ont fridge)' as status,
  COUNT(*) as count
FROM archetypes
WHERE shelf_life_days_fridge IS NOT NULL
  AND open_shelf_life_days_fridge IS NULL;

SELECT
  'Archetypes SANS open_pantry (qui ont pantry)' as status,
  COUNT(*) as count
FROM archetypes
WHERE shelf_life_days_pantry IS NOT NULL
  AND open_shelf_life_days_pantry IS NULL;
