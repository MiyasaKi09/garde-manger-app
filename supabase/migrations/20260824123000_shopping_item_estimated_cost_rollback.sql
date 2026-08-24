-- Rollback de 20260824123000_shopping_item_estimated_cost.sql
--
-- ATTENTION : ce rollback DÉTRUIT l'archive des estimations annoncées. Elle ne
-- se recalcule pas : recalculer avec le référentiel d'aujourd'hui répondrait à
-- une autre question que « qu'avions-nous annoncé ce jour-là ? », et donnerait
-- à un référentiel corrigé l'air d'avoir toujours eu raison. Exporter avant.

BEGIN;

DROP INDEX IF EXISTS public.idx_npsi_priced;

ALTER TABLE public.nutrition_plan_shopping_items
  DROP CONSTRAINT IF EXISTS npsi_purchase_cost_check;

ALTER TABLE public.nutrition_plan_shopping_items
  DROP COLUMN IF EXISTS purchase_cost_low,
  DROP COLUMN IF EXISTS purchase_cost_central,
  DROP COLUMN IF EXISTS purchase_cost_high,
  DROP COLUMN IF EXISTS purchase_cost_currency,
  DROP COLUMN IF EXISTS purchase_cost_confidence,
  DROP COLUMN IF EXISTS purchase_cost_yield_known,
  DROP COLUMN IF EXISTS price_set_version,
  DROP COLUMN IF EXISTS price_set_reference_date,
  DROP COLUMN IF EXISTS priced_at;

COMMIT;
