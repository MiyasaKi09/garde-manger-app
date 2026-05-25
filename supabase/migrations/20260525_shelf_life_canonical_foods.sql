-- Migration: Peupler shelf_life_days sur canonical_foods manquants
-- 39 canonical_foods sans aucune donnée de conservation.
-- Valeurs en jours (garde-manger / frigo / congélateur).

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 365,
  shelf_life_days_freezer = 365
WHERE id = 14 AND canonical_name = 'alcool';          -- spiritueux, vin non ouvert

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 180,
  shelf_life_days_fridge  = 180,
  shelf_life_days_freezer = NULL
WHERE id = 8 AND canonical_name = 'bière';            -- ne congèle pas correctement

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 1,
  shelf_life_days_fridge  = 4,
  shelf_life_days_freezer = 365
WHERE id = 14011 AND canonical_name = 'bœuf';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 5,
  shelf_life_days_freezer = 180
WHERE id = 14035 AND canonical_name = 'bouillon';     -- cube/poudre=pantry, liquide=fridge

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 5,
  shelf_life_days_freezer = 180
WHERE id = 14036 AND canonical_name = 'bouillon de légumes';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 730,
  shelf_life_days_fridge  = 730,
  shelf_life_days_freezer = 730
WHERE id = 14012 AND canonical_name = 'cannelle';     -- épice sèche

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 7,
  shelf_life_days_fridge  = 14,
  shelf_life_days_freezer = 365
WHERE id = 14013 AND canonical_name = 'céleri';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 5,
  shelf_life_days_freezer = 180
WHERE id = 14014 AND canonical_name = 'cèpe';         -- séché=pantry, frais=fridge

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 7,
  shelf_life_days_fridge  = 7,
  shelf_life_days_freezer = 365
WHERE id = 14015 AND canonical_name = 'champignon';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 14,
  shelf_life_days_fridge  = 21,
  shelf_life_days_freezer = 365
WHERE id = 14016 AND canonical_name = 'chou';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 5,
  shelf_life_days_freezer = NULL
WHERE id = 9 AND canonical_name = 'cidre';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 90,
  shelf_life_days_fridge  = 14,
  shelf_life_days_freezer = 365
WHERE id = 14005 AND canonical_name = 'courge butternut';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 730,
  shelf_life_days_fridge  = 730,
  shelf_life_days_freezer = 730
WHERE id = 14017 AND canonical_name = 'cumin';        -- épice sèche

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 365,
  shelf_life_days_freezer = 365
WHERE id = 14018 AND canonical_name = 'eau';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 730,
  shelf_life_days_fridge  = 730,
  shelf_life_days_freezer = 730
WHERE id = 12 AND canonical_name = 'épices';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 730,
  shelf_life_days_fridge  = 365,
  shelf_life_days_freezer = 730
WHERE id = 14042 AND canonical_name = 'gélatine';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 365,
  shelf_life_days_freezer = 365
WHERE id = 14019 AND canonical_name = 'graine de chia';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 365,
  shelf_life_days_freezer = 365
WHERE id = 14020 AND canonical_name = 'graine de sésame';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 5,
  shelf_life_days_freezer = 180
WHERE id = 14021 AND canonical_name = 'haricot blanc';  -- sec=pantry, cuit=fridge

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 5,
  shelf_life_days_freezer = 180
WHERE id = 14022 AND canonical_name = 'haricot noir';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 5,
  shelf_life_days_freezer = 180
WHERE id = 14023 AND canonical_name = 'haricot rouge';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 365,
  shelf_life_days_freezer = 365
WHERE id = 14030 AND canonical_name = 'huile d''olive';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 365,
  shelf_life_days_freezer = 365
WHERE id = 14031 AND canonical_name = 'huile végétale';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 90,
  shelf_life_days_fridge  = 7,
  shelf_life_days_freezer = 90
WHERE id = 14024 AND canonical_name = 'lait végétal';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 7,
  shelf_life_days_fridge  = 7,
  shelf_life_days_freezer = 365
WHERE id = 13 AND canonical_name = 'légume';           -- générique

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 14,
  shelf_life_days_freezer = 365
WHERE id = 14040 AND canonical_name = 'levure';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 365,
  shelf_life_days_freezer = 365
WHERE id = 14041 AND canonical_name = 'levure chimique';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 1,
  shelf_life_days_fridge  = 2,
  shelf_life_days_freezer = 180
WHERE id = 10 AND canonical_name = 'lotte';            -- poisson

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 365,
  shelf_life_days_freezer = 365
WHERE id = 14043 AND canonical_name = 'maïzena';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 5,
  shelf_life_days_freezer = 180
WHERE id = 14025 AND canonical_name = 'morille';       -- séchée=pantry, fraîche=fridge

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 180,
  shelf_life_days_fridge  = 365,
  shelf_life_days_freezer = 365
WHERE id = 14026 AND canonical_name = 'noisette';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 30,
  shelf_life_days_fridge  = 35,
  shelf_life_days_freezer = 365
WHERE id = 14027 AND canonical_name = 'œuf';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 14,
  shelf_life_days_fridge  = 21,
  shelf_life_days_freezer = 365
WHERE id = 14028 AND canonical_name = 'panais';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 3,
  shelf_life_days_fridge  = 7,
  shelf_life_days_freezer = 180
WHERE id = 14029 AND canonical_name = 'salade';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 365,
  shelf_life_days_fridge  = 180,
  shelf_life_days_freezer = 365
WHERE id = 14033 AND canonical_name = 'sauce soja';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 1,
  shelf_life_days_fridge  = 2,
  shelf_life_days_freezer = 180
WHERE id = 11 AND canonical_name = 'sole';             -- poisson

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 730,
  shelf_life_days_fridge  = 730,
  shelf_life_days_freezer = 730
WHERE id = 14037 AND canonical_name = 'sucre';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 730,
  shelf_life_days_fridge  = 730,
  shelf_life_days_freezer = 730
WHERE id = 14038 AND canonical_name = 'sucre glace';

UPDATE canonical_foods SET
  shelf_life_days_pantry  = 730,
  shelf_life_days_fridge  = 730,
  shelf_life_days_freezer = 730
WHERE id = 14032 AND canonical_name = 'vinaigre';
