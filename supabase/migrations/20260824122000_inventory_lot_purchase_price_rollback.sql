-- Rollback de 20260824122000_inventory_lot_purchase_price.sql
--
-- ATTENTION : ce rollback DÉTRUIT des observations du foyer — ce qui a
-- réellement été payé, lot par lot. Ce sont les seules données de tout le
-- chantier prix qui ne se reconstituent depuis AUCUN artefact ni aucune source
-- publique : un ticket de caisse ne se relit pas deux fois. Ne jouer ce fichier
-- qu'après export.
--
-- L'index partiel disparaît avec les colonnes qu'il indexe ; il est nommé ici
-- pour que la suppression reste lisible même si l'ordre change un jour.

BEGIN;

DROP INDEX IF EXISTS public.inventory_lots_user_priced_idx;

ALTER TABLE public.inventory_lots
  DROP CONSTRAINT IF EXISTS inventory_lots_purchase_price_check,
  DROP CONSTRAINT IF EXISTS inventory_lots_purchase_price_shape_check;

ALTER TABLE public.inventory_lots
  DROP COLUMN IF EXISTS purchase_price,
  DROP COLUMN IF EXISTS purchase_currency,
  DROP COLUMN IF EXISTS purchase_price_basis,
  DROP COLUMN IF EXISTS purchase_price_source;

COMMIT;
