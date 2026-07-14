-- ============================================================================
-- Migration V2 — Séparer les PLATS PRÉPARÉS du catalogue d'ingrédients
-- Réf. audit directeur (fix F0, point 11).
-- ============================================================================
-- Des plats préparés (omelettes, sandwich, plat en sauce, gnocchi, viennoiseries
-- composées…) avaient été publiés comme « concepts alimentaires ». Ce ne sont pas
-- des ingrédients. On les marque 'rejected' : exclus de toute release d'ingrédients.
-- (Ils pourront devenir des recettes/plats côté `culinary`, pas des food_forms.)
-- Idempotent.
-- ============================================================================

WITH dishes AS (
  SELECT fc.id FROM catalog.food_concepts fc
  JOIN catalog.food_categories cat ON cat.id = fc.category_id
  WHERE cat.code = 'preparations_culinaires'
     OR fc.canonical_name_normalized ~
        '(omelette|sandwich|profiterole|chausson|quenelle|gnocchi|pizza|lasagne|gratin|tarte|quiche|viande en sauce)'
)
UPDATE catalog.food_forms ff SET status = 'rejected'
FROM dishes d
JOIN catalog.food_forms f2 ON f2.food_concept_id = d.id
WHERE ff.id = f2.id AND ff.status <> 'rejected';

WITH dishes AS (
  SELECT fc.id FROM catalog.food_concepts fc
  JOIN catalog.food_categories cat ON cat.id = fc.category_id
  WHERE cat.code = 'preparations_culinaires'
     OR fc.canonical_name_normalized ~
        '(omelette|sandwich|profiterole|chausson|quenelle|gnocchi|pizza|lasagne|gratin|tarte|quiche|viande en sauce)'
)
UPDATE catalog.food_concepts fc SET status = 'rejected'
FROM dishes d WHERE fc.id = d.id AND fc.status <> 'rejected';
