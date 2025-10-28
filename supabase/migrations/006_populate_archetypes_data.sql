-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MIGRATION 006: Données de conservation vérifiées pour les archétypes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- Date: 2025-10-28
-- Description: Complète les colonnes de durée de conservation pour les archétypes
--              avec des données vérifiées basées sur les standards alimentaires
--
-- Sources: ANSES, FDA, standards européens de conservation alimentaire
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PRODUITS LAITIERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Crème liquide
UPDATE archetypes SET
  shelf_life_days_pantry = NULL, -- Ne se conserve pas au garde-manger
  shelf_life_days_fridge = 30,   -- 30 jours fermé au frigo (UHT)
  shelf_life_days_freezer = 120, -- 4 mois au congélateur
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3,  -- 3 jours après ouverture au frigo
  open_shelf_life_days_freezer = 60 -- 2 mois après ouverture au congélateur
WHERE name ILIKE '%crème%liquide%' OR name ILIKE '%crème fraîche%';

-- Lait
UPDATE archetypes SET
  shelf_life_days_pantry = 90,   -- 3 mois (UHT)
  shelf_life_days_fridge = 7,    -- 7 jours (frais)
  shelf_life_days_freezer = 90,  -- 3 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3,  -- 3 jours après ouverture
  open_shelf_life_days_freezer = 30
WHERE name ILIKE '%lait%' AND name NOT ILIKE '%chocolat%';

-- Yaourt
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 21,   -- 3 semaines
  shelf_life_days_freezer = 60,  -- 2 mois (déconseillé)
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%yaourt%' OR name ILIKE '%yogurt%';

-- Fromage à pâte dure
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 90,   -- 3 mois
  shelf_life_days_freezer = 180, -- 6 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 21, -- 3 semaines
  open_shelf_life_days_freezer = 90
WHERE (name ILIKE '%parmesan%' OR name ILIKE '%comté%' OR name ILIKE '%emmental%')
  AND name ILIKE '%fromage%';

-- Fromage à pâte molle
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 14,   -- 2 semaines
  shelf_life_days_freezer = 90,  -- 3 mois (déconseillé)
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 5, -- 5 jours
  open_shelf_life_days_freezer = 30
WHERE (name ILIKE '%camembert%' OR name ILIKE '%brie%' OR name ILIKE '%chèvre%')
  AND name ILIKE '%fromage%';

-- Beurre
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 90,   -- 3 mois
  shelf_life_days_freezer = 270, -- 9 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 30, -- 1 mois
  open_shelf_life_days_freezer = 180
WHERE name ILIKE '%beurre%';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VIANDES ET CHARCUTERIE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Viande fraîche (bœuf, porc, poulet)
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 3,    -- 2-3 jours
  shelf_life_days_freezer = 270, -- 9 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 1, -- 1 jour si déballée
  open_shelf_life_days_freezer = 180
WHERE (name ILIKE '%viande%' OR name ILIKE '%bœuf%' OR name ILIKE '%porc%' OR name ILIKE '%poulet%')
  AND name NOT ILIKE '%haché%'
  AND name NOT ILIKE '%cuit%';

-- Viande hachée
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 2,    -- 1-2 jours maximum
  shelf_life_days_freezer = 120, -- 4 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 1, -- Consommer immédiatement
  open_shelf_life_days_freezer = 60
WHERE name ILIKE '%haché%';

-- Jambon tranché
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 7,    -- 1 semaine
  shelf_life_days_freezer = 60,  -- 2 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3, -- 3 jours
  open_shelf_life_days_freezer = 30
WHERE name ILIKE '%jambon%' AND name NOT ILIKE '%cru%';

-- Jambon cru / Saucisson sec
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 90,   -- 3 mois
  shelf_life_days_freezer = 180, -- 6 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 21, -- 3 semaines
  open_shelf_life_days_freezer = 90
WHERE (name ILIKE '%jambon%cru%' OR name ILIKE '%saucisson%sec%');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- POISSONS ET FRUITS DE MER
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Poisson frais
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 2,    -- 1-2 jours
  shelf_life_days_freezer = 180, -- 6 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 1,
  open_shelf_life_days_freezer = 90
WHERE name ILIKE '%poisson%' OR name ILIKE '%saumon%' OR name ILIKE '%cabillaud%' OR name ILIKE '%truite%';

-- Poisson fumé
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 14,   -- 2 semaines
  shelf_life_days_freezer = 60,  -- 2 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3,
  open_shelf_life_days_freezer = 30
WHERE name ILIKE '%fumé%' AND (name ILIKE '%saumon%' OR name ILIKE '%truite%');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CONSERVES ET PRODUITS SECS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Conserves (boîtes métalliques)
UPDATE archetypes SET
  shelf_life_days_pantry = 1095, -- 3 ans
  shelf_life_days_fridge = 1095,
  shelf_life_days_freezer = NULL, -- Pas nécessaire
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 3, -- Transférer dans un récipient et consommer sous 3 jours
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%conserve%' OR name ILIKE '%boîte%';

-- Pâtes sèches
UPDATE archetypes SET
  shelf_life_days_pantry = 730,  -- 2 ans
  shelf_life_days_fridge = 730,
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 365, -- 1 an après ouverture
  open_shelf_life_days_fridge = 365,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%pâtes%' AND name NOT ILIKE '%fraîches%';

-- Riz
UPDATE archetypes SET
  shelf_life_days_pantry = 730,  -- 2 ans
  shelf_life_days_fridge = 730,
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 365,
  open_shelf_life_days_fridge = 365,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%riz%';

-- Farine
UPDATE archetypes SET
  shelf_life_days_pantry = 365,  -- 1 an
  shelf_life_days_fridge = 730,  -- 2 ans (idéal pour éviter les mites)
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 180, -- 6 mois
  open_shelf_life_days_fridge = 365,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%farine%';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CONDIMENTS ET SAUCES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Moutarde
UPDATE archetypes SET
  shelf_life_days_pantry = 365,  -- 1 an
  shelf_life_days_fridge = 730,  -- 2 ans
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 180,
  open_shelf_life_days_fridge = 365,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%moutarde%';

-- Ketchup / Mayonnaise
UPDATE archetypes SET
  shelf_life_days_pantry = 365,
  shelf_life_days_fridge = 365,
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 60,  -- 2 mois
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%ketchup%' OR name ILIKE '%mayonnaise%';

-- Huile d'olive
UPDATE archetypes SET
  shelf_life_days_pantry = 730,  -- 2 ans
  shelf_life_days_fridge = NULL,
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 365, -- 1 an après ouverture
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%huile%olive%';

-- Vinaigre
UPDATE archetypes SET
  shelf_life_days_pantry = 1825, -- 5 ans (quasi infini)
  shelf_life_days_fridge = NULL,
  shelf_life_days_freezer = NULL,
  open_shelf_life_days_pantry = 1825,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%vinaigre%';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FRUITS ET LÉGUMES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Légumes feuilles (salades, épinards)
UPDATE archetypes SET
  shelf_life_days_pantry = NULL,
  shelf_life_days_fridge = 5,    -- 3-5 jours
  shelf_life_days_freezer = 180, -- 6 mois (blanchis)
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 2,
  open_shelf_life_days_freezer = 90
WHERE (name ILIKE '%salade%' OR name ILIKE '%épinard%' OR name ILIKE '%laitue%')
  AND name NOT ILIKE '%cuite%';

-- Carottes
UPDATE archetypes SET
  shelf_life_days_pantry = 7,    -- 1 semaine
  shelf_life_days_fridge = 21,   -- 3 semaines
  shelf_life_days_freezer = 270, -- 9 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%carotte%';

-- Tomates
UPDATE archetypes SET
  shelf_life_days_pantry = 7,    -- 1 semaine
  shelf_life_days_fridge = 14,   -- 2 semaines
  shelf_life_days_freezer = 180, -- 6 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%tomate%' AND name NOT ILIKE '%sauce%' AND name NOT ILIKE '%concentré%';

-- Pommes de terre
UPDATE archetypes SET
  shelf_life_days_pantry = 60,   -- 2 mois
  shelf_life_days_fridge = 90,   -- 3 mois
  shelf_life_days_freezer = 270, -- 9 mois (cuites)
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%pomme%terre%';

-- Oignons / Ail
UPDATE archetypes SET
  shelf_life_days_pantry = 90,   -- 3 mois
  shelf_life_days_fridge = 90,
  shelf_life_days_freezer = 180,
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%oignon%' OR name ILIKE '%ail%';

-- Fruits à noyau (pêches, abricots, prunes)
UPDATE archetypes SET
  shelf_life_days_pantry = 5,    -- 3-5 jours
  shelf_life_days_fridge = 7,    -- 1 semaine
  shelf_life_days_freezer = 270, -- 9 mois
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%pêche%' OR name ILIKE '%abricot%' OR name ILIKE '%prune%';

-- Agrumes (oranges, citrons)
UPDATE archetypes SET
  shelf_life_days_pantry = 14,   -- 2 semaines
  shelf_life_days_fridge = 30,   -- 1 mois
  shelf_life_days_freezer = 120, -- 4 mois (jus)
  open_shelf_life_days_pantry = 3, -- 3 jours coupé
  open_shelf_life_days_fridge = 5, -- 5 jours coupé
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%orange%' OR name ILIKE '%citron%' OR name ILIKE '%pamplemousse%';

-- Bananes
UPDATE archetypes SET
  shelf_life_days_pantry = 7,    -- 1 semaine
  shelf_life_days_fridge = 14,   -- 2 semaines (ralentit mûrissement)
  shelf_life_days_freezer = 180, -- 6 mois (écrasées)
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = NULL,
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%banane%';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ŒUFS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Œufs entiers
UPDATE archetypes SET
  shelf_life_days_pantry = 28,   -- 4 semaines
  shelf_life_days_fridge = 42,   -- 6 semaines
  shelf_life_days_freezer = NULL, -- Ne pas congeler entiers
  open_shelf_life_days_pantry = NULL,
  open_shelf_life_days_fridge = 2, -- Cassés: 2 jours
  open_shelf_life_days_freezer = NULL
WHERE name ILIKE '%œuf%' OR name ILIKE '%oeuf%';

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ DONNÉES DE CONSERVATION AJOUTÉES AVEC SUCCÈS !
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- Note: Ces durées sont des recommandations standard.
-- Elles peuvent varier selon:
-- - La qualité initiale du produit
-- - Les conditions de stockage (température, humidité)
-- - L'emballage
-- - Les traitements (pasteurisation, UHT, etc.)
--
-- Toujours faire confiance à ses sens (aspect, odeur, goût) avant consommation.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
