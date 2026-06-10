-- =============================================================================
-- MIGRATION : Correction des durées de conservation (DLC/DDM)
-- Date      : 2026-06-10
-- Source    : ANSES, DGCCRF, guides de conservation français
-- Scope     : archetypes (419 lignes) + canonical_foods (268 lignes)
-- =============================================================================

-- ÉTAPE 0 : Ajout de la colonne expiry_kind
-- DLC  = périssables réglementés (viande/poisson frais, charcuterie fraîche,
--         lait cru/pasteurisé, produits laitiers frais, plats frais)
-- DDM  = secs, conserves, surgelés, UHT, épices, huiles, sucres, farines
-- ESTIMATE = fruits/légumes frais bruts (pas de date légale, durée estimée)
-- =============================================================================

ALTER TABLE archetypes
  ADD COLUMN IF NOT EXISTS expiry_kind text
  CHECK (expiry_kind IN ('DLC', 'DDM', 'ESTIMATE'));

-- =============================================================================
-- ÉTAPE 1 : CORRECTIONS archetypes
-- =============================================================================

-- ---- VIANDE HACHÉE : bœuf haché id=304 -----------------------------------------
-- ERREUR CRITIQUE : pantry=28 / fridge=42 (copié-collé depuis les œufs entiers)
-- ANSES : viande hachée fraîche = 1-2j frigo, pas de conservation à température ambiante
UPDATE archetypes
  SET shelf_life_days_pantry  = NULL,
      shelf_life_days_fridge  = 2,
      shelf_life_days_freezer = 120,
      open_shelf_life_days_pantry = NULL,
      open_shelf_life_days_fridge = 1
  WHERE id = 304;
-- bœuf haché : ANSES 1-2 j frigo (était pantry=28 / fridge=42 — valeurs d'œufs)

-- ---- BLANC / JAUNE D'OEUF séparés -----------------------------------------------
-- blanc d'œuf séparé id=302, jaune d'œuf id=318
-- Un œuf entier en coquille : 28j ambiant / 35j frigo — logique
-- Blanc ou jaune séparés : 2j frigo (DGCCRF : « utiliser dans les 48h »)
UPDATE archetypes
  SET shelf_life_days_pantry  = NULL,
      shelf_life_days_fridge  = 2,
      shelf_life_days_freezer = 60,
      open_shelf_life_days_pantry = NULL,
      open_shelf_life_days_fridge = 1
  WHERE id IN (302, 318);
-- blanc/jaune séparés : DGCCRF 2j frigo (était pantry=28 / fridge=42 — valeurs de l'œuf entier)

-- ---- BOUILLON DE BOEUF préparé id=305 -------------------------------------------
-- ERREUR CRITIQUE : pantry=28 / fridge=42 — même copie-colle que les œufs
-- Bouillon maison préparé : 3-4j frigo (ANSES), pas de conservation à température ambiante
UPDATE archetypes
  SET shelf_life_days_pantry  = NULL,
      shelf_life_days_fridge  = 4,
      shelf_life_days_freezer = 120,
      open_shelf_life_days_pantry = NULL,
      open_shelf_life_days_fridge = 3
  WHERE id = 305;
-- bouillon maison : ANSES 3-4j frigo (était pantry=28/fridge=42)

-- ---- LAITS FRAIS PASTEURISÉS : id 188/189/190 -----------------------------------
-- ERREUR : shelf_life_days_pantry=90 — le lait frais pasteurisé n'a AUCUNE durée
-- à température ambiante sans réfrigération ; il doit rester au frigo
-- DGCCRF : lait frais pasteurisé = 7j au frigo fermé
UPDATE archetypes
  SET shelf_life_days_pantry  = NULL,
      shelf_life_days_fridge  = 7,
      shelf_life_days_freezer = 60,
      open_shelf_life_days_pantry = NULL,
      open_shelf_life_days_fridge = 3
  WHERE id IN (188, 189, 190);
-- laits frais pasteurisés : DGCCRF 7j frigo fermé (était pantry=90)

-- ---- LAIT EN POUDRE id=193 -------------------------------------------------------
-- ERREUR : pantry=90j — le lait en poudre fermé se garde 12-24 mois
-- DGCCRF/fabricants : boite fermée ~730j ; ouverte ~30j (humidité)
UPDATE archetypes
  SET shelf_life_days_pantry         = 730,
      shelf_life_days_fridge         = NULL,
      shelf_life_days_freezer        = NULL,
      open_shelf_life_days_pantry    = 30,
      open_shelf_life_days_fridge    = 30
  WHERE id = 193;
-- lait en poudre : fabricants 12-24 mois fermé (était 90j)

-- ---- CRÈME ANGLAISE id=202 -------------------------------------------------------
-- ERREUR : shelf_life_days_pantry=30 / shelf_life_days_fridge=30 (fermée)
-- La crème anglaise maison contient des jaunes d'œufs cuits : 2-3j frigo max (ANSES)
-- Le pantry=30 est aberrant (pas de conservation à température ambiante)
UPDATE archetypes
  SET shelf_life_days_pantry  = NULL,
      shelf_life_days_fridge  = 3,
      shelf_life_days_freezer = 60,
      open_shelf_life_days_pantry = NULL,
      open_shelf_life_days_fridge = 2
  WHERE id = 202;
-- crème anglaise maison : ANSES 2-3j frigo (était pantry=30 / fridge=30)

-- ---- CRÈME PÂTISSIÈRE id=414 et variante chocolat id=415 ------------------------
-- ERREUR : shelf_life_days_fridge=30 (fermée)
-- La crème pâtissière est classée par l'ANSES dans les préparations à risque élevé
-- (amidon + œufs + lait chauffé = milieu favorable Bacillus cereus) : 2-3j max
UPDATE archetypes
  SET shelf_life_days_pantry  = NULL,
      shelf_life_days_fridge  = 3,
      shelf_life_days_freezer = 30,
      open_shelf_life_days_pantry = NULL,
      open_shelf_life_days_fridge = 2
  WHERE id IN (414, 415);
-- crème pâtissière : ANSES 2-3j frigo maximum (était 30j)

-- ---- CONFITURES : pantry incohérent pour bocaux non ouverts ---------------------
-- Confiture d'abricots id=69 : pantry=5 (absurde, c'est un produit stérilisé sucré)
-- Confiture de pêches  id=80 : pantry=5
-- Confiture de prunes  id=85 : pantry=5
-- DGCCRF : confitures maison bocaux stérilisés = 12-24 mois en garde-manger
UPDATE archetypes
  SET shelf_life_days_pantry  = 365,
      shelf_life_days_fridge  = 365,
      shelf_life_days_freezer = 1800
  WHERE id IN (69, 80, 85);
-- confitures maison : DGCCRF 12-24 mois garde-manger (était pantry=5j)

-- ---- TOMATES SÉCHÉES id=1 -------------------------------------------------------
-- ERREUR CRITIQUE : shelf_life_days_pantry=7 / fridge=14 / freezer=180
-- Les tomates séchées (sèches) se conservent 6-12 mois à température ambiante
UPDATE archetypes
  SET shelf_life_days_pantry  = 365,
      shelf_life_days_fridge  = 180,
      shelf_life_days_freezer = 1800
  WHERE id = 1;
-- tomates séchées : 12 mois garde-manger (était pantry=7j — valeur de fraîches)

-- ---- TOMATES PELÉES EN BOCAUX (stérilisées) id=5 --------------------------------
-- ERREUR CRITIQUE : shelf_life_days_pantry=7 / fridge=14 / freezer=180
-- Conserves stérilisées = 2-5 ans (730-1825j) en garde-manger
UPDATE archetypes
  SET shelf_life_days_pantry  = 1095,
      shelf_life_days_fridge  = 1095,
      shelf_life_days_freezer = 1800,
      open_shelf_life_days_pantry = NULL,
      open_shelf_life_days_fridge = 3,
      open_shelf_life_days_freezer = 60
  WHERE id = 5;
-- tomates pelées en bocaux stérilisés : 3 ans garde-manger (était pantry=7j)

-- ---- ABRICOTS SÉCHÉS id=67 -------------------------------------------------------
-- ERREUR : shelf_life_days_pantry=5 / shelf_life_days_fridge=7 (valeurs de frais)
-- DGCCRF : fruits séchés = 6-12 mois en garde-manger
UPDATE archetypes
  SET shelf_life_days_pantry  = 365,
      shelf_life_days_fridge  = 180,
      shelf_life_days_freezer = 730
  WHERE id = 67;
-- abricots séchés : 12 mois garde-manger (était pantry=5j — valeur de frais)

-- ---- ABRICOTS AU SIROP MAISON id=71 ----------------------------------------------
-- ERREUR : shelf_life_days_pantry=5 (bocal stérilisé !)
-- Bocal maison stérilisé : 12 mois garde-manger
UPDATE archetypes
  SET shelf_life_days_pantry  = 365,
      shelf_life_days_fridge  = 365,
      shelf_life_days_freezer = 1800
  WHERE id = 71;
-- abricots au sirop maison : bocal stérilisé = 12 mois (était pantry=5j)

-- ---- PÊCHES SÉCHÉES id=78 --------------------------------------------------------
-- ERREUR : shelf_life_days_pantry=5 / fridge=7 / open_pantry=0
-- Fruits séchés = 6-12 mois garde-manger, open_pantry non nul
UPDATE archetypes
  SET shelf_life_days_pantry       = 365,
      shelf_life_days_fridge       = 180,
      shelf_life_days_freezer      = 730,
      open_shelf_life_days_pantry  = 180,
      open_shelf_life_days_fridge  = 90
  WHERE id = 78;
-- pêches séchées : 12 mois garde-manger (était pantry=5j)

-- ---- PÊCHES AU SIROP MAISON id=82 ------------------------------------------------
-- ERREUR : shelf_life_days_pantry=5 (bocal stérilisé)
UPDATE archetypes
  SET shelf_life_days_pantry  = 365,
      shelf_life_days_fridge  = 365,
      shelf_life_days_freezer = 1800
  WHERE id = 82;
-- pêches au sirop maison bocal stérilisé : 12 mois (était pantry=5j)

-- ---- PRUNES AU SIROP MAISON id=87 ------------------------------------------------
-- ERREUR : shelf_life_days_pantry=5
UPDATE archetypes
  SET shelf_life_days_pantry  = 365,
      shelf_life_days_fridge  = 365,
      shelf_life_days_freezer = 1800
  WHERE id = 87;
-- prunes au sirop maison bocal stérilisé : 12 mois (était pantry=5j)

-- ---- PRUNEAUX (prunes séchées) id=83 --------------------------------------------
-- ERREUR : shelf_life_days_pantry=5 / open_pantry=0 (valeurs de frais)
-- Pruneaux = fruits séchés = 6-12 mois
UPDATE archetypes
  SET shelf_life_days_pantry       = 365,
      shelf_life_days_fridge       = 180,
      shelf_life_days_freezer      = 730,
      open_shelf_life_days_pantry  = 180,
      open_shelf_life_days_fridge  = 90
  WHERE id = 83;
-- pruneaux : 12 mois garde-manger (était pantry=5j)

-- ---- POUDRE D'ABRICOT id=99 ------------------------------------------------------
-- ERREUR : shelf_life_days_pantry=5 / fridge=7 (valeurs de frais, pas de poudre séchée)
-- Poudre de fruit séché : 12 mois garde-manger
UPDATE archetypes
  SET shelf_life_days_pantry  = 365,
      shelf_life_days_fridge  = 180,
      shelf_life_days_freezer = 730
  WHERE id = 99;
-- poudre d'abricot : 12 mois garde-manger (était pantry=5j)

-- ---- CHIPS DE CAROTTE SÉCHÉES id=26 ---------------------------------------------
-- ERREUR : shelf_life_days_pantry=7 / fridge=21 (valeurs de carottes fraîches)
-- Chips séchées = 3-6 mois garde-manger
UPDATE archetypes
  SET shelf_life_days_pantry  = 90,
      shelf_life_days_fridge  = 90,
      shelf_life_days_freezer = 270
  WHERE id = 26;
-- chips de carotte séchées : 3 mois (était pantry=7j — valeur de fraîches)

-- ---- PURÉE DE CAROTTES CONGELÉE id=28 -------------------------------------------
-- ERREUR : shelf_life_days_pantry=7 / fridge=21 (valeurs de carottes fraîches)
-- Purée congelée maison = 6-9 mois congélateur, pas de durée pantry/fridge pour un congelé
UPDATE archetypes
  SET shelf_life_days_pantry  = NULL,
      shelf_life_days_fridge  = NULL,
      shelf_life_days_freezer = 270,
      open_shelf_life_days_pantry = NULL,
      open_shelf_life_days_fridge = 3
  WHERE id = 28;
-- purée carottes congelée : pas de durée pantry/fridge, 9 mois congélateur (était pantry=7)

-- ---- PÂTE DE TOMATE SÉCHÉE id=48 -------------------------------------------------
-- Valeur pantry=7 / fridge=14 (valeur de coulis frais, pas de poudre)
-- Pâte de tomate séchée (produit sec) : 12 mois garde-manger
UPDATE archetypes
  SET shelf_life_days_pantry       = 365,
      shelf_life_days_fridge       = 180,
      shelf_life_days_freezer      = 730,
      open_shelf_life_days_pantry  = 30,
      open_shelf_life_days_fridge  = 90
  WHERE id = 48;
-- pâte de tomate séchée (poudre) : 12 mois garde-manger (était pantry=7j)

-- ---- POUDRE D'AIL id=39 / POUDRE D'OIGNON id=35 --------------------------------
-- Valeurs correctes pantry=90 mais devraient être 730j pour épice séchée broyée
-- NOTE : 90j est défendable (qualité organoleptique), mais 730j est la norme industrielle
-- On laisse à 90j et note comme "défendable mais conservateur"

-- ---- SAUCE TOMATE archetype id=327 -----------------------------------------------
-- PROBLÈME : pantry=730 sans fridge — une sauce tomate cuisinée maison
-- ne se conserve pas 2 ans à température ambiante
-- Si conserve stérilisée bocal : pantry=730 OK ; si fraîche : fridge seulement
-- On corrige pour une sauce non stérilisée (usage courant) :
UPDATE archetypes
  SET shelf_life_days_pantry  = NULL,
      shelf_life_days_fridge  = 7,
      shelf_life_days_freezer = 180,
      open_shelf_life_days_pantry = NULL,
      open_shelf_life_days_fridge = 5,
      open_shelf_life_days_freezer = NULL
  WHERE id = 327;
-- sauce tomate cuite : 7j frigo / 6 mois congélateur (était pantry=730 sans fridge !)

-- ---- PÂTE BRISÉE id=323 / PÂTE À PIZZA id=470 ----------------------------------
-- PROBLÈME : pantry=730j — une pâte crue ne se conserve pas 2 ans à l'air
-- Pâte crue réfrigérée : 2-3 jours frigo / 3 mois congélateur
UPDATE archetypes
  SET shelf_life_days_pantry  = NULL,
      shelf_life_days_fridge  = 3,
      shelf_life_days_freezer = 90
  WHERE id IN (323, 470);
-- pâtes crues : 3j frigo / 3 mois congélateur (était pantry=730)

-- ---- INFUSION DE MENTHE CONCENTRÉE id=118 ----------------------------------------
-- ERREUR : open_shelf_life_days_fridge=180j — une infusion ouverte
-- Infusion concentrée maison au frigo ouvert : 5-7j max
UPDATE archetypes
  SET open_shelf_life_days_fridge = 7
  WHERE id = 118;
-- infusion menthe ouverte : 7j frigo (était open_fridge=180j)

-- ---- LAITUE ROMAINE id=486 -------------------------------------------------------
-- ERREUR : shelf_life_days_fridge=21 — laitue fraîche = 5-7j frigo
UPDATE archetypes
  SET shelf_life_days_fridge       = 7,
      open_shelf_life_days_fridge  = 2
  WHERE id = 486;
-- laitue romaine fraîche : 7j frigo (était 21j)

-- ---- HERBES SÉCHÉES : freezer=7300j (20 ans) -------------------------------------
-- Valeur absurde sur le plan logistique (20 ans au congélateur)
-- Les herbes séchées ne doivent pas être congelées usuellement ; si congélation = 2 ans max
-- Concerné : thym séché/poudre (106/107), romarin (110/111), sauge (137/138),
--            origan (134/135), laurier (143/144), ciboulette lyophilisée (133),
--            graines aneth/coriandre/fenouil moulues (130/126/147)
UPDATE archetypes
  SET shelf_life_days_freezer         = 730,
      open_shelf_life_days_freezer    = 365
  WHERE id IN (106, 107, 110, 111, 134, 135, 137, 138, 143, 144);
-- herbes séchées/poudre : freezer ramené à 2 ans (était 7300j = 20 ans absurdes)

UPDATE archetypes
  SET shelf_life_days_freezer         = 730,
      open_shelf_life_days_freezer    = 365
  WHERE id IN (133, 130, 126, 147);
-- lyophilisé/graines moulues : freezer ramené à 2 ans (était 7300j)

-- ---- CHIPS DE CAROTTE (id=26) : déjà corrigé ci-dessus -------------------------

-- =============================================================================
-- ÉTAPE 2 : CORRECTIONS canonical_foods
-- =============================================================================

-- Céréales sèches : fridge=7 absurde — les grains secs ne vont pas au frigo
-- épeautre(5003), millet(5006), orge(5007), quinoa(4002), sarrasin(4004)
UPDATE canonical_foods
  SET shelf_life_days_fridge  = NULL,
      shelf_life_days_freezer = 730
  WHERE id IN (5003, 5006, 5007, 4002, 4004);
-- céréales sèches : pas de fridge nécessaire (était fridge=7j aberrant)

-- Maïs id=9007 : pantry=5 (valeur de maïs frais en épi) → maïs grain sec = 730j
UPDATE canonical_foods
  SET shelf_life_days_pantry  = 730,
      shelf_life_days_fridge  = NULL,
      shelf_life_days_freezer = 730
  WHERE id = 9007;
-- maïs (grain sec) : 730j garde-manger (était pantry=5j — valeur de maïs frais)

-- Sucre de betterave/canne : 99999 → 3650 (10 ans, pratiquement indéfini)
UPDATE canonical_foods
  SET shelf_life_days_pantry  = 3650,
      shelf_life_days_fridge  = 3650,
      shelf_life_days_freezer = 3650
  WHERE id IN (14003, 14004);
-- sucre : 99999 → 3650j (10 ans, valeur lisible)

-- Sel id=6004 : 99999 → 3650
UPDATE canonical_foods
  SET shelf_life_days_pantry  = 3650,
      shelf_life_days_fridge  = 3650,
      shelf_life_days_freezer = 3650
  WHERE id = 6004;
-- sel : 99999 → 3650j

-- Miel id=14001 : freezer=99999 → 3650 ; fridge=1095 → NULL (le miel ne va pas au frigo)
UPDATE canonical_foods
  SET shelf_life_days_fridge  = NULL,
      shelf_life_days_freezer = 3650
  WHERE id = 14001;
-- miel : fridge NULL (cristallise), freezer 3650 (était 99999)

-- Sirop d'érable id=14002 : freezer=99999 → 3650
UPDATE canonical_foods
  SET shelf_life_days_freezer = 3650
  WHERE id = 14002;
-- sirop d'érable : freezer 3650 (était 99999)

-- Laitue id=1031 : pantry=14 (aberrant) → 2-3j ; fridge=30 → 7j max
-- La laitue fraîche non lavée se garde 2-3j à l'air libre et 5-7j au frigo
UPDATE canonical_foods
  SET shelf_life_days_pantry  = 2,
      shelf_life_days_fridge  = 7,
      shelf_life_days_freezer = 0
  WHERE id = 1031;
-- laitue fraîche : 2j pantry / 7j frigo (était pantry=14 / fridge=30 — trop long)

-- Pomme de terre id=1053 : fridge=60j → NULL (ne doit pas aller au frigo)
-- La pomme de terre noircit au frigo (amidon → sucres). Conservation = cave/garde-manger
UPDATE canonical_foods
  SET shelf_life_days_fridge  = NULL
  WHERE id = 1053;
-- pomme de terre : fridge NULL (noircit au frigo — était fridge=60)

-- Citron/citron vert/orange/pamplemousse/mandarine/grenade : freezer=0 → 90
-- On peut congeler le zeste et le jus de ces fruits (usage courant)
UPDATE canonical_foods
  SET shelf_life_days_freezer = 90
  WHERE id IN (1015, 1016, 1027, 1034, 1044, 1045);
-- agrumes/grenade : freezer 90j (jus/zeste congelés — était 0)

-- Cacahuète id=11002 : fridge=30j → 180j (oléagineux sec = 6-12 mois)
UPDATE canonical_foods
  SET shelf_life_days_fridge = 180
  WHERE id = 11002;
-- cacahuète : fridge 180j (était 30j incohérent)

-- Noix de coco id=1043 : fridge=7j → entière fermée = 4 mois frigo
UPDATE canonical_foods
  SET shelf_life_days_fridge = 120
  WHERE id = 1043;
-- noix de coco (entière) : fridge 120j (était 7j — valeur de noix ouverte)

-- Huître id=9006 : freezer=0 → les huîtres peuvent se congeler (chair seulement)
UPDATE canonical_foods
  SET shelf_life_days_freezer = 60
  WHERE id = 9006;
-- huître : freezer 60j possible (chair) — était 0

-- =============================================================================
-- ÉTAPE 3 : Compléter les 35 canonical_foods SANS aucune durée
-- =============================================================================

-- Céréales
UPDATE canonical_foods SET shelf_life_days_pantry=730, shelf_life_days_fridge=NULL, shelf_life_days_freezer=730 WHERE id = 16; -- boulgour (grain sec)
UPDATE canonical_foods SET shelf_life_days_pantry=3,   shelf_life_days_fridge=7,    shelf_life_days_freezer=90  WHERE id = 18; -- naan (pain plat)
UPDATE canonical_foods SET shelf_life_days_pantry=30,  shelf_life_days_fridge=NULL, shelf_life_days_freezer=NULL WHERE id = 19; -- nachos (chips sèches)
UPDATE canonical_foods SET shelf_life_days_pantry=730, shelf_life_days_fridge=NULL, shelf_life_days_freezer=NULL WHERE id = 15; -- pâtes (sèches)
UPDATE canonical_foods SET shelf_life_days_pantry=730, shelf_life_days_fridge=NULL, shelf_life_days_freezer=NULL WHERE id = 17; -- semoule (sèche)

-- Conserves / condiments
UPDATE canonical_foods SET shelf_life_days_pantry=730,  shelf_life_days_fridge=180, shelf_life_days_freezer=NULL WHERE id = 31; -- câpres (saumure, 2 ans fermées)
UPDATE canonical_foods SET shelf_life_days_pantry=365,  shelf_life_days_fridge=30,  shelf_life_days_freezer=NULL WHERE id = 32; -- gochujang (pâte fermentée)
UPDATE canonical_foods SET shelf_life_days_pantry=365,  shelf_life_days_fridge=180, shelf_life_days_freezer=NULL WHERE id = 29; -- ketchup (acide, fermé)
UPDATE canonical_foods SET shelf_life_days_pantry=NULL, shelf_life_days_fridge=180, shelf_life_days_freezer=NULL WHERE id = 35; -- kimchi (réfrigéré)
UPDATE canonical_foods SET shelf_life_days_pantry=365,  shelf_life_days_fridge=90,  shelf_life_days_freezer=NULL WHERE id = 28; -- mayonnaise (industrielle)
UPDATE canonical_foods SET shelf_life_days_pantry=730,  shelf_life_days_fridge=NULL,shelf_life_days_freezer=NULL WHERE id = 33; -- mirin (alcool sucré)
UPDATE canonical_foods SET shelf_life_days_pantry=730,  shelf_life_days_fridge=NULL,shelf_life_days_freezer=NULL WHERE id = 34; -- nuoc-mâm (sauce poisson, très stable)
UPDATE canonical_foods SET shelf_life_days_pantry=NULL, shelf_life_days_fridge=7,   shelf_life_days_freezer=60  WHERE id = 30; -- pesto (frais, réfrigéré)

-- Épices
UPDATE canonical_foods SET shelf_life_days_pantry=14,   shelf_life_days_fridge=21,  shelf_life_days_freezer=90  WHERE id = 40; -- combava (fruit frais)
UPDATE canonical_foods SET shelf_life_days_pantry=14,   shelf_life_days_fridge=30,  shelf_life_days_freezer=90  WHERE id = 39; -- galanga (rhizome frais)
UPDATE canonical_foods SET shelf_life_days_pantry=365,  shelf_life_days_fridge=60,  shelf_life_days_freezer=NULL WHERE id = 36; -- harissa (pâte piquante)
UPDATE canonical_foods SET shelf_life_days_pantry=730,  shelf_life_days_fridge=NULL,shelf_life_days_freezer=NULL WHERE id = 38; -- herbes de Provence (mélange sec)
UPDATE canonical_foods SET shelf_life_days_pantry=730,  shelf_life_days_fridge=NULL,shelf_life_days_freezer=NULL WHERE id = 37; -- ras el-hanout (mélange sec)

-- Huiles / matières grasses
UPDATE canonical_foods SET shelf_life_days_pantry=365,  shelf_life_days_fridge=180, shelf_life_days_freezer=NULL WHERE id = 27; -- saindoux (réfrigéré après ouverture)

-- Légumineuses
UPDATE canonical_foods SET shelf_life_days_pantry=NULL, shelf_life_days_fridge=5,   shelf_life_days_freezer=90  WHERE id = 20; -- tofu (réfrigéré)

-- Noix et graines
UPDATE canonical_foods SET shelf_life_days_pantry=730,  shelf_life_days_fridge=NULL,shelf_life_days_freezer=730 WHERE id = 25; -- sésame (graine sèche)
UPDATE canonical_foods SET shelf_life_days_pantry=180,  shelf_life_days_fridge=90,  shelf_life_days_freezer=NULL WHERE id = 26; -- tahini (pâte de sésame)

-- Poissons
UPDATE canonical_foods SET shelf_life_days_pantry=NULL, shelf_life_days_fridge=2,   shelf_life_days_freezer=60  WHERE id = 24; -- lieu jaune (poisson frais)

-- Produits laitiers
UPDATE canonical_foods SET shelf_life_days_pantry=NULL, shelf_life_days_fridge=14,  shelf_life_days_freezer=60  WHERE id = 21; -- halloumi

-- Viandes
UPDATE canonical_foods SET shelf_life_days_pantry=NULL, shelf_life_days_fridge=7,   shelf_life_days_freezer=120 WHERE id = 22; -- chorizo (charcuterie séchée ouverte)
UPDATE canonical_foods SET shelf_life_days_pantry=NULL, shelf_life_days_fridge=7,   shelf_life_days_freezer=120 WHERE id = 23; -- guanciale (charcuterie séchée)

-- Sans catégorie (id sans catégorie assignée)
UPDATE canonical_foods SET shelf_life_days_pantry=NULL, shelf_life_days_fridge=21,  shelf_life_days_freezer=60  WHERE id = 49; -- chevre (fromage de chèvre générique)
UPDATE canonical_foods SET shelf_life_days_pantry=14,   shelf_life_days_fridge=30,  shelf_life_days_freezer=90  WHERE id = 43; -- daikon (radis blanc)
UPDATE canonical_foods SET shelf_life_days_pantry=90,   shelf_life_days_fridge=180, shelf_life_days_freezer=NULL WHERE id = 46; -- ghee (beurre clarifié)
UPDATE canonical_foods SET shelf_life_days_pantry=180,  shelf_life_days_fridge=365, shelf_life_days_freezer=365 WHERE id = 47; -- grenoble (noix de Grenoble)
UPDATE canonical_foods SET shelf_life_days_pantry=NULL, shelf_life_days_fridge=7,   shelf_life_days_freezer=60  WHERE id = 48; -- houmous (pâte de pois chiches)
UPDATE canonical_foods SET shelf_life_days_pantry=14,   shelf_life_days_fridge=21,  shelf_life_days_freezer=90  WHERE id = 41; -- jalapenos (piment frais)
UPDATE canonical_foods SET shelf_life_days_pantry=1825, shelf_life_days_fridge=NULL,shelf_life_days_freezer=NULL WHERE id = 45; -- pastis (alcool, quasi indéfini)
UPDATE canonical_foods SET shelf_life_days_pantry=NULL, shelf_life_days_fridge=7,   shelf_life_days_freezer=180 WHERE id = 44; -- shiitakes (champignons frais)
UPDATE canonical_foods SET shelf_life_days_pantry=365,  shelf_life_days_fridge=60,  shelf_life_days_freezer=NULL WHERE id = 42; -- sriracha (sauce piquante acide)

-- =============================================================================
-- ÉTAPE 4 : Attribution de l'expiry_kind
-- =============================================================================

-- DDM par défaut pour tout (on surcharge ensuite avec DLC et ESTIMATE)
UPDATE archetypes SET expiry_kind = 'DDM';

-- DLC : périssables réglementés (viandes/poissons/charcuteries fraîches,
--        lait cru/pasteurisé, produits laitiers frais, préparations cuites réfrigérées)

-- Laits frais (pasteurisés + fermentés + ribot)
UPDATE archetypes SET expiry_kind = 'DLC'
  WHERE id IN (185, 186, 187, 188, 189, 190, 193, 194, 228, 229);
-- Note : UHT (185-187, 194) reste techniquement DDM mais la colonne pantry/fridge
--        est fixée, on leur assigne DLC car ouverts ils deviennent périssables rapides
-- Correction : les laits UHT fermés sont DDM, on réassigne
UPDATE archetypes SET expiry_kind = 'DDM'
  WHERE id IN (185, 186, 187, 194);
UPDATE archetypes SET expiry_kind = 'DLC'
  WHERE id IN (188, 189, 190, 228, 229);

-- Yaourts et produits laitiers fermentés frais
UPDATE archetypes SET expiry_kind = 'DLC'
  WHERE id IN (205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 333, 334, 335, 227);

-- Fromages frais et à pâte molle (DLC réglementaire)
UPDATE archetypes SET expiry_kind = 'DLC'
  WHERE id IN (
    215, 216, 217, 218, 219, 230, 231, 232, 233, 234,
    235, 236, 237, 238, 239, 240, 241, 242, 243, 244,
    245, 246, 247, 248, 249, 250, 251, 252, 253, 254,
    255, 316, 402, 316, 419
  );

-- Crèmes fraîches et préparations laitières fraîches
UPDATE archetypes SET expiry_kind = 'DLC'
  WHERE id IN (195, 196, 197, 198, 199, 202, 203, 310, 311, 337, 411, 412, 413, 414, 415, 416);

-- Viandes fraîches (boucherie)
UPDATE archetypes SET expiry_kind = 'DLC'
  WHERE process ILIKE '%hachage%'
    AND (shelf_life_days_fridge IS NOT NULL AND shelf_life_days_fridge <= 3);
UPDATE archetypes SET expiry_kind = 'DLC'
  WHERE id IN (
    298, 299, 303, 304, 325, 345, 346, 347, 348, 349,
    350, 351, 352, 353, 354, 355, 356, 357, 358, 359,
    360, 361, 362, 363, 364, 365, 366, 367, 368, 369,
    370, 371, 372, 373, 374, 375, 376, 377, 378
  );

-- Charcuteries et abats frais
UPDATE archetypes SET expiry_kind = 'DLC'
  WHERE id IN (
    379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389
  );

-- Poissons et fruits de mer frais/fumés
UPDATE archetypes SET expiry_kind = 'DLC'
  WHERE id IN (
    427, 488, 489, 490, 491, 328
  );

-- Préparations cuites réfrigérées (crème anglaise, bouillon, etc.)
UPDATE archetypes SET expiry_kind = 'DLC'
  WHERE id IN (305, 315, 534);

-- ESTIMATE : fruits et légumes frais bruts (pas de date réglementaire légale)
UPDATE archetypes SET expiry_kind = 'ESTIMATE'
  WHERE storage_profile IS NULL
    AND shelf_life_days_fridge IS NOT NULL
    AND shelf_life_days_fridge <= 15
    AND shelf_life_days_pantry IS NULL
    AND process IN (
      'courgettes', 'poireaux entiers', 'blettes', 'laitue romaine',
      'partie blanche', 'mélange légumes cuits', 'laitue romaine'
    );

UPDATE archetypes SET expiry_kind = 'ESTIMATE'
  WHERE id IN (
    482, 483, 484, 485, 486, 487
  );

-- ESTIMATE : tous les archétypes de type "frais brut végétal" non déjà classés DLC
-- identifiés par storage_profile réfrigéré + process de préparation simple + durée courte
UPDATE archetypes SET expiry_kind = 'ESTIMATE'
  WHERE expiry_kind = 'DDM'
    AND storage_profile = 'réfrigéré'
    AND shelf_life_days_fridge <= 7
    AND process IN ('grillage', 'cuisson vapeur', 'cuisson four', 'extraction', 'mixage et filtrage');

-- =============================================================================
-- VÉRIFICATION ATTENDUE (commentaire, pas exécuté) :
-- SELECT expiry_kind, COUNT(*) FROM archetypes GROUP BY expiry_kind ORDER BY expiry_kind;
-- Résultat attendu approximatif :
--   DLC      ~120-140 entrées (viandes, poissons, laitiers frais, charcuteries)
--   DDM      ~220-240 entrées (secs, conserves, UHT, épices, surgelés)
--   ESTIMATE ~40-60  entrées (fruits/légumes frais bruts)
-- Total      ~419
-- =============================================================================
