-- Migration 022: Complétion précise des process génériques (100 archetypes)
-- Date: 2025-11-06
-- Description: Remplace "transformation de base" par des process précis et spécifiques

DO $$
BEGIN

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '   COMPLÉTION PRÉCISE DES PROCESS (100 archetypes)';
  RAISE NOTICE '═══════════════════════════════════════════════════════';

  -- =====================================================
  -- LAITS (10 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥛 LAITS';

  UPDATE archetypes SET process = 'pasteurisation UHT 140°C' WHERE id = 185; -- Lait entier UHT
  UPDATE archetypes SET process = 'pasteurisation UHT 140°C écrémage partiel' WHERE id = 186; -- Lait demi-écrémé UHT
  UPDATE archetypes SET process = 'pasteurisation UHT 140°C écrémage total' WHERE id = 187; -- Lait écrémé UHT
  UPDATE archetypes SET process = 'pasteurisation fraîche 72°C' WHERE id = 188; -- Lait entier frais
  UPDATE archetypes SET process = 'pasteurisation fraîche 72°C écrémage partiel' WHERE id = 189; -- Lait demi-écrémé frais
  UPDATE archetypes SET process = 'pasteurisation fraîche 72°C écrémage total' WHERE id = 190; -- Lait écrémé frais
  UPDATE archetypes SET process = 'évaporation 60% eau' WHERE id = 191; -- Lait concentré non sucré
  UPDATE archetypes SET process = 'évaporation 60% eau + sucrage' WHERE id = 192; -- Lait concentré sucré
  UPDATE archetypes SET process = 'déshydratation complète atomisation' WHERE id = 193; -- Lait en poudre
  UPDATE archetypes SET process = 'hydrolyse enzymatique lactose' WHERE id = 194; -- Lait sans lactose

  RAISE NOTICE '  ✅ 10 laits complétés';

  -- =====================================================
  -- CRÈMES (9 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍶 CRÈMES';

  UPDATE archetypes SET process = 'écrémage centrifugation 30% MG' WHERE id = 195; -- Crème liquide 30%
  UPDATE archetypes SET process = 'écrémage centrifugation 15% MG' WHERE id = 196; -- Crème liquide 15%
  UPDATE archetypes SET process = 'écrémage centrifugation 35% MG maturation' WHERE id = 197; -- Crème épaisse 35%
  UPDATE archetypes SET process = 'fermentation lactique ensemencement 35% MG' WHERE id = 198; -- Crème fraîche épaisse
  UPDATE archetypes SET process = 'fermentation lactique ensemencement 15% MG' WHERE id = 199; -- Crème fraîche légère
  UPDATE archetypes SET process = 'pasteurisation UHT 140°C 30% MG' WHERE id = 200; -- Crème UHT liquide
  UPDATE archetypes SET process = 'fouettage + gaz propulseur pression' WHERE id = 201; -- Crème fouettée en bombe
  UPDATE archetypes SET process = 'cuisson anglaise jaunes œufs vanille' WHERE id = 202; -- Crème anglaise
  UPDATE archetypes SET process = 'fouettage mécanique incorporation air' WHERE id = 203; -- Chantilly

  RAISE NOTICE '  ✅ 9 crèmes complétées';

  -- =====================================================
  -- BEURRE (1 archetype)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🧈 BEURRE';

  UPDATE archetypes SET process = 'barattage crème maturation 82% MG' WHERE id = 204; -- Beurre doux

  RAISE NOTICE '  ✅ 1 beurre complété';

  -- =====================================================
  -- YAOURTS NATURE (8 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥣 YAOURTS NATURE';

  UPDATE archetypes SET process = 'fermentation lactique 43°C 4h lait entier' WHERE id = 205; -- Yaourt nature entier
  UPDATE archetypes SET process = 'fermentation lactique 43°C 4h lait écrémé' WHERE id = 206; -- Yaourt nature 0%
  UPDATE archetypes SET process = 'fermentation lactique 43°C brassage' WHERE id = 207; -- Yaourt nature brassé
  UPDATE archetypes SET process = 'fermentation lactique 43°C égouttage 10% MG' WHERE id = 208; -- Yaourt grec nature
  UPDATE archetypes SET process = 'fermentation lactique 43°C égouttage 0% MG' WHERE id = 209; -- Yaourt grec 0%
  UPDATE archetypes SET process = 'fermentation lactique 43°C lait brebis' WHERE id = 210; -- Yaourt lait de brebis
  UPDATE archetypes SET process = 'fermentation lactique 43°C lait chèvre' WHERE id = 211; -- Yaourt lait de chèvre
  UPDATE archetypes SET process = 'fermentation lactique ultrafiltration 0% MG' WHERE id = 212; -- Skyr nature

  RAISE NOTICE '  ✅ 8 yaourts nature complétés';

  -- =====================================================
  -- YAOURTS AROMATISÉS (2 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍦 YAOURTS AROMATISÉS';

  UPDATE archetypes SET process = 'fermentation lactique + arôme vanille' WHERE id = 213; -- Yaourt vanille
  UPDATE archetypes SET process = 'fermentation lactique + préparation fruits' WHERE id = 214; -- Yaourt aux fruits

  RAISE NOTICE '  ✅ 2 yaourts aromatisés complétés';

  -- =====================================================
  -- FROMAGES BLANCS (4 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥄 FROMAGES BLANCS';

  UPDATE archetypes SET process = 'caillage lactique égouttage 0% MG' WHERE id = 215; -- Fromage blanc 0%
  UPDATE archetypes SET process = 'caillage lactique égouttage 20% MG' WHERE id = 216; -- Fromage blanc 20%
  UPDATE archetypes SET process = 'caillage lactique égouttage 40% MG' WHERE id = 217; -- Fromage blanc 40%
  UPDATE archetypes SET process = 'caillage lactique égouttage petit format' WHERE id = 218; -- Petit-suisse

  RAISE NOTICE '  ✅ 4 fromages blancs complétés';

  -- =====================================================
  -- FROMAGES FRAIS (4 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🧀 FROMAGES FRAIS';

  UPDATE archetypes SET process = 'caillage lactique égouttage faisselle' WHERE id = 219; -- Faisselle
  UPDATE archetypes SET process = 'caillage lactique égouttage tartinage' WHERE id = 234; -- Fromage à tartiner nature
  UPDATE archetypes SET process = 'caillage présure égouttage grains cottage' WHERE id = 230; -- Cottage cheese
  UPDATE archetypes SET process = 'caillage acide lactoserum filtration' WHERE id = 231; -- Ricotta

  RAISE NOTICE '  ✅ 4 fromages frais complétés';

  -- =====================================================
  -- FROMAGES À PÂTE FRAÎCHE RICHE (2 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🧈 FROMAGES À PÂTE FRAÎCHE RICHE';

  UPDATE archetypes SET process = 'caillage acide crème égouttage 75% MG' WHERE id = 232; -- Mascarpone
  UPDATE archetypes SET process = 'caillage lactique crème tartinage Philadelphia' WHERE id = 233; -- Cream cheese

  RAISE NOTICE '  ✅ 2 fromages frais riches complétés';

  -- =====================================================
  -- LAITS FERMENTÉS (4 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🥛 LAITS FERMENTÉS';

  UPDATE archetypes SET process = 'fermentation grains kéfir levures bactéries' WHERE id = 227; -- Kéfir
  UPDATE archetypes SET process = 'fermentation lactique bactéries bifidus' WHERE id = 228; -- Lait fermenté
  UPDATE archetypes SET process = 'fermentation lactique babeurre Bretagne' WHERE id = 229; -- Lait ribot

  RAISE NOTICE '  ✅ 3 laits fermentés complétés';

  -- =====================================================
  -- LAITS VÉGÉTAUX (5 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🌾 LAITS VÉGÉTAUX';

  UPDATE archetypes SET process = 'broyage amandes filtration émulsion' WHERE id = 221; -- Lait d'amande
  UPDATE archetypes SET process = 'hydrolyse enzymatique avoine filtration' WHERE id = 222; -- Lait d'avoine
  UPDATE archetypes SET process = 'cuisson riz broyage filtration' WHERE id = 223; -- Lait de riz
  UPDATE archetypes SET process = 'pressage chair coco dilution' WHERE id = 224; -- Lait de coco
  UPDATE archetypes SET process = 'broyage soja cuisson filtration' WHERE id = 220; -- Lait de soja

  RAISE NOTICE '  ✅ 5 laits végétaux complétés';

  -- =====================================================
  -- CRÈMES VÉGÉTALES (2 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🌾 CRÈMES VÉGÉTALES';

  UPDATE archetypes SET process = 'concentration crème soja épaississement' WHERE id = 225; -- Crème de soja
  UPDATE archetypes SET process = 'concentration lait avoine épaississement' WHERE id = 226; -- Crème d'avoine

  RAISE NOTICE '  ✅ 2 crèmes végétales complétées';

  -- =====================================================
  -- FROMAGES CHÈVRE PÂTE MOLLE (6 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🐐 FROMAGES CHÈVRE PÂTE MOLLE';

  UPDATE archetypes SET process = 'caillage lactique égouttage moulage bûche affinage 1 semaine' WHERE id = 235; -- Bûche de chèvre fraîche
  UPDATE archetypes SET process = 'caillage lactique égouttage moulage bûche affinage 3 semaines' WHERE id = 236; -- Bûche de chèvre demi-sec
  UPDATE archetypes SET process = 'caillage lactique égouttage moulage bûche affinage 8 semaines' WHERE id = 237; -- Bûche de chèvre sec
  UPDATE archetypes SET process = 'caillage lactique égouttage moulage crottin affinage 2-4 semaines' WHERE id = 238; -- Crottin de chèvre
  UPDATE archetypes SET process = 'caillage lactique moulage bûche cendré paille affinage 3 semaines' WHERE id = 239; -- Sainte-Maure

  RAISE NOTICE '  ✅ 5 fromages chèvre pâte molle complétés';

  -- =====================================================
  -- FROMAGES CHÈVRE AOC (4 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🏔️ FROMAGES CHÈVRE AOC';

  UPDATE archetypes SET process = 'caillage lactique moulage pyramide tronquée affinage 5 semaines AOC' WHERE id = 282; -- Pouligny-Saint-Pierre
  UPDATE archetypes SET process = 'caillage lactique moulage pyramide affinage 4 semaines AOC' WHERE id = 280; -- Valençay
  UPDATE archetypes SET process = 'caillage lactique moulage rond affinage 2 semaines AOC' WHERE id = 281; -- Rocamadour
  UPDATE archetypes SET process = 'caillage lactique moulage rond affinage 2-4 semaines AOC' WHERE id = 283; -- Picodon

  RAISE NOTICE '  ✅ 4 fromages chèvre AOC complétés';

  -- =====================================================
  -- FROMAGES BREBIS (3 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🐑 FROMAGES BREBIS';

  UPDATE archetypes SET process = 'caillage présure pressé non cuit affinage 4 mois AOC Pays Basque' WHERE id = 265; -- Ossau-Iraty
  UPDATE archetypes SET process = 'caillage présure pressé cuit affinage 8 mois pecora italien' WHERE id = 274; -- Pecorino
  UPDATE archetypes SET process = 'caillage lactique moulage rond affinage 2 semaines Cévennes' WHERE id = 284; -- Pélardon

  RAISE NOTICE '  ✅ 3 fromages brebis complétés';

  -- =====================================================
  -- FROMAGES PÂTE MOLLE CROÛTE FLEURIE (7 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🍄 FROMAGES PÂTE MOLLE CROÛTE FLEURIE';

  UPDATE archetypes SET process = 'caillage présure moulage affinagesurface Penicillium camemberti 3 semaines' WHERE id = 240; -- Camembert
  UPDATE archetypes SET process = 'caillage présure moulage meule affinage surface Penicillium 4 semaines' WHERE id = 241; -- Brie
  UPDATE archetypes SET process = 'caillage présure moulage affinage surface Penicillium 4 semaines' WHERE id = 242; -- Coulommiers
  UPDATE archetypes SET process = 'caillage présure crème ajoutée affinage surface Penicillium 2 semaines' WHERE id = 243; -- Chaource
  UPDATE archetypes SET process = 'caillage lactique moulage rond affinage surface Penicillium 3 semaines' WHERE id = 244; -- Saint-Marcellin
  UPDATE archetypes SET process = 'caillage présure triple crème 75% MG affinage Penicillium 2 semaines' WHERE id = 245; -- Brillat-Savarin
  UPDATE archetypes SET process = 'caillage présure moulage cœur affinage surface Penicillium 3 semaines' WHERE id = 246; -- Neufchâtel
  UPDATE archetypes SET process = 'caillage présure triple crème affinage surface Penicillium 3 semaines' WHERE id = 247; -- Explorateur

  RAISE NOTICE '  ✅ 8 fromages pâte molle croûte fleurie complétés';

  -- =====================================================
  -- FROMAGES PÂTE MOLLE CROÛTE LAVÉE (8 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🧼 FROMAGES PÂTE MOLLE CROÛTE LAVÉE';

  UPDATE archetypes SET process = 'caillage présure lavage croûte Brevibacterium marc raisin affinage 3 semaines' WHERE id = 248; -- Munster
  UPDATE archetypes SET process = 'caillage présure lavage croûte eau-de-vie affinage 4 semaines' WHERE id = 249; -- Époisses
  UPDATE archetypes SET process = 'caillage présure lavage croûte bière affinage 3 semaines' WHERE id = 250; -- Maroilles
  UPDATE archetypes SET process = 'caillage présure lavage croûte affinage 6 semaines' WHERE id = 251; -- Pont-l'Évêque
  UPDATE archetypes SET process = 'caillage présure lavage croûte rocou affinage 3 mois' WHERE id = 252; -- Livarot
  UPDATE archetypes SET process = 'caillage présure pressé non cuit lavage croûte affinage 6 semaines' WHERE id = 253; -- Reblochon
  UPDATE archetypes SET process = 'caillage présure lavage croûte saumure épicéa affinage 6 semaines' WHERE id = 254; -- Mont d'Or
  UPDATE archetypes SET process = 'caillage présure lavage croûte saumure affinage 3 semaines' WHERE id = 255; -- Vacherin

  RAISE NOTICE '  ✅ 8 fromages pâte molle croûte lavée complétés';

  -- =====================================================
  -- FROMAGES PÂTE PRESSÉE NON CUITE (9 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '⚖️ FROMAGES PÂTE PRESSÉE NON CUITE';

  UPDATE archetypes SET process = 'caillage présure pressage mécanique affinage 3-6 mois' WHERE id = 256; -- Cantal
  UPDATE archetypes SET process = 'caillage présure pressage mécanique affinage 6 semaines' WHERE id = 257; -- Saint-Nectaire
  UPDATE archetypes SET process = 'caillage présure pressage mécanique raie horizontale affinage 2 mois' WHERE id = 258; -- Morbier
  UPDATE archetypes SET process = 'caillage présure pressage mécanique affinage 2-6 mois' WHERE id = 259; -- Tomme de Savoie
  UPDATE archetypes SET process = 'caillage présure pressage mécanique affinage 3 mois fonte raclette' WHERE id = 260; -- Raclette
  UPDATE archetypes SET process = 'caillage présure pressage mécanique affinage 3-24 mois' WHERE id = 261; -- Cheddar
  UPDATE archetypes SET process = 'caillage présure pressage mécanique affinage 4-18 mois' WHERE id = 262; -- Gouda
  UPDATE archetypes SET process = 'caillage présure pressage mécanique affinage 4-10 mois' WHERE id = 263; -- Edam
  UPDATE archetypes SET process = 'caillage présure pressage mécanique affinage 6-24 mois coloration rocou' WHERE id = 264; -- Mimolette

  RAISE NOTICE '  ✅ 9 fromages pâte pressée non cuite complétés';

  -- =====================================================
  -- FROMAGES ITALIENS À PÂTE FILÉE (2 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🇮🇹 FROMAGES PÂTE FILÉE';

  UPDATE archetypes SET process = 'caillage présure filage eau chaude 80°C affinage 2 mois' WHERE id = 266; -- Provolone

  RAISE NOTICE '  ✅ 1 fromage pâte filée complété';

  -- =====================================================
  -- FROMAGES ESPAGNOLS (1 archetype)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🇪🇸 FROMAGES ESPAGNOLS';

  UPDATE archetypes SET process = 'caillage présure pressage affinage 3-12 mois lait brebis' WHERE id = 267; -- Manchego

  RAISE NOTICE '  ✅ 1 fromage espagnol complété';

  -- =====================================================
  -- FROMAGES PÂTE PRESSÉE CUITE (6 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '🔥 FROMAGES PÂTE PRESSÉE CUITE';

  UPDATE archetypes SET process = 'caillage présure chauffage 53°C pressage affinage 6 mois' WHERE id = 268; -- Abondance
  UPDATE archetypes SET process = 'caillage présure chauffage 54°C pressage meule 40kg affinage 9-12 mois' WHERE id = 269; -- Beaufort
  UPDATE archetypes SET process = 'caillage présure chauffage 55°C pressage meule affinage 8-24 mois' WHERE id = 270; -- Comté
  UPDATE archetypes SET process = 'caillage présure chauffage 55°C pressage affinage 6-12 mois' WHERE id = 271; -- Gruyère
  UPDATE archetypes SET process = 'caillage présure chauffage 53°C pressage meule 80kg affinage 5 mois' WHERE id = 272; -- Emmental
  UPDATE archetypes SET process = 'caillage présure chauffage 55°C pressage meule affinage 12-36 mois' WHERE id = 273; -- Parmesan
  UPDATE archetypes SET process = 'caillage présure chauffage 48°C pressage affinage 3 mois' WHERE id = 275; -- Fontina

  RAISE NOTICE '  ✅ 7 fromages pâte pressée cuite complétés';

  -- =====================================================
  -- FROMAGES À PÂTE PERSILLÉE (4 archetypes)
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '💙 FROMAGES PÂTE PERSILLÉE';

  UPDATE archetypes SET process = 'caillage présure ensemencement Penicillium roqueforti piquage affinage 3 mois' WHERE id = 276; -- Roquefort
  UPDATE archetypes SET process = 'caillage présure ensemencement Penicillium roqueforti piquage affinage 2 mois' WHERE id = 277; -- Bleu d'Auvergne
  UPDATE archetypes SET process = 'caillage présure ensemencement Penicillium roqueforti piquage affinage 3-4 mois' WHERE id = 278; -- Fourme d'Ambert
  UPDATE archetypes SET process = 'caillage présure ensemencement Penicillium roqueforti piquage affinage 3-4 mois' WHERE id = 279; -- Gorgonzola

  RAISE NOTICE '  ✅ 4 fromages pâte persillée complétés';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Complétion de 100 process terminée';
  RAISE NOTICE '';

END $$;

-- Vérification
SELECT
  'Archetypes avec process générique restant' as status,
  COUNT(*) as count
FROM archetypes
WHERE process = 'transformation de base' OR process = 'base';
