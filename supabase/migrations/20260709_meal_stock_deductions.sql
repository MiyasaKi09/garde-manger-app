-- ============================================================================
-- Migration: 20260709_meal_stock_deductions.sql
-- Traçabilité des déductions de stock lors de la validation d'un repas (C3)
-- ============================================================================
--
-- CONTEXTE
-- --------
-- Audit C3 (AUDIT_COMPLET_2026-07.md) : l'annulation d'un repas cuisiné ne
-- restituait pas les lots déduits de l'inventaire car rien ne traçait quels
-- lots avaient été consommés ni en quelle quantité.
-- La RPC consume_lots_fefo (20260609) supprime automatiquement le lot quand
-- son qty_remaining atteint 0 — la restauration exige donc aussi un snapshot
-- suffisant pour recréer le lot s'il a été supprimé.
--
-- DESCRIPTION
-- -----------
-- Chaque ligne enregistre une déduction effectuée sur un lot lors de la
-- validation d'un repas (POST /api/meals/cook).
-- Lors de l'annulation (DELETE /api/meals/cook), on relit ces lignes pour :
--   • re-créditer qty_remaining sur les lots encore présents ;
--   • recréer entièrement les lots supprimés depuis lot_snapshot.
--
-- IDENTIFICATION DU REPAS
-- -----------------------
-- Les clés user_id + meal_date + meal_type reproduisent exactement celles
-- utilisées par le handler DELETE (cf. route.js : const { meal_date, meal_type }
-- = body). Il n'y a pas de person_name : le DELETE supprime tous les logs du
-- créneau sans filtrer par personne.
--
-- SNAPSHOT DU LOT
-- ---------------
-- lot_snapshot conserve les champs d'identité du lot au moment de la déduction :
--   canonical_food_id, cultivar_id, archetype_id, product_id,
--   unit, expiration_date, adjusted_expiration_date,
--   storage_place, storage_method, is_opened, opened_at, acquired_on.
-- Ces champs sont suffisants pour recréer le lot dans inventory_lots si la RPC
-- l'a supprimé après vidage.
--
-- RLS
-- ---
-- Policies per-user (même pattern DO $$ que 20260708_waste_prevention_log.sql).
-- user_id ON DELETE CASCADE : les déductions sont supprimées si l'utilisateur
-- est supprimé (contrairement à waste_prevention_log où c'est SET NULL).
--
-- IDEMPOTENCE
-- -----------
-- CREATE TABLE IF NOT EXISTS + IF NOT EXISTS sur les index + DO $$ sur les
-- policies.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meal_stock_deductions (
    id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    -- user_id : CASCADE — les déductions suivent la suppression du compte
    user_id       UUID        DEFAULT auth.uid()
                              REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Identification du créneau : mêmes clés que le DELETE handler de route.js
    meal_date     DATE        NOT NULL,
    meal_type     TEXT        NOT NULL,
    -- lot_id : SET NULL si le lot est supprimé après insertion
    -- (la RPC consume_lots_fefo peut supprimer le lot avant que la FK ne soit
    -- enregistrée — dans ce cas lot_id reste NULL dès l'insert, cf. POST)
    lot_id        UUID        REFERENCES public.inventory_lots(id) ON DELETE SET NULL,
    -- lot_snapshot : champs d'identité du lot au moment de la déduction,
    -- suffisant pour recréer le lot si consume_lots_fefo l'a supprimé
    lot_snapshot  JSONB       NOT NULL,
    -- qty_deducted : quantité réellement déduite du lot (bornée à qty_remaining
    -- au moment de la déduction, comme dans consume_lots_fefo)
    qty_deducted  NUMERIC     NOT NULL CHECK (qty_deducted > 0),
    -- restored : passe à true lors du DELETE /api/meals/cook
    restored      BOOLEAN     NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.meal_stock_deductions IS
'Traçabilité des déductions de stock lors de la validation d''un repas cuisiné
(POST /api/meals/cook). Permet de restaurer les lots lors de l''annulation
(DELETE /api/meals/cook) — résout l''audit C3 (AUDIT_COMPLET_2026-07.md).';

COMMENT ON COLUMN public.meal_stock_deductions.lot_snapshot IS
'Champs d''identité du lot au moment de la déduction :
canonical_food_id, cultivar_id, archetype_id, product_id, unit,
expiration_date, adjusted_expiration_date, storage_place, storage_method,
is_opened, opened_at, acquired_on.
Utilisé pour recréer le lot si la RPC consume_lots_fefo l''a supprimé
(lot vidé → DELETE automatique dans la RPC).';

COMMENT ON COLUMN public.meal_stock_deductions.lot_id IS
'FK vers inventory_lots (SET NULL si le lot est supprimé).
NULL dès l''insertion si le lot avait déjà été vidé/supprimé par la RPC
au moment de l''enregistrement de la déduction.';

COMMENT ON COLUMN public.meal_stock_deductions.restored IS
'true si la quantité a déjà été restituée à l''inventaire lors d''un
DELETE /api/meals/cook. Les lignes restored=true ne sont plus traitées.';

-- ============================================================================
-- Index
-- ============================================================================

-- Index principal : requête du DELETE handler pour charger les déductions
-- d'un créneau (user_id + meal_date + meal_type + restored = false)
CREATE INDEX IF NOT EXISTS idx_msd_user_meal
    ON public.meal_stock_deductions (user_id, meal_date, meal_type);

-- Index secondaire : retrouver les déductions d'un lot donné
CREATE INDEX IF NOT EXISTS idx_msd_lot_id
    ON public.meal_stock_deductions (lot_id)
    WHERE lot_id IS NOT NULL;

-- ============================================================================
-- RLS — policies per-utilisateur
-- ============================================================================
ALTER TABLE public.meal_stock_deductions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'meal_stock_deductions'
      AND policyname = 'msd_select_own'
  ) THEN
    -- USING : chaque utilisateur ne voit que ses propres déductions
    CREATE POLICY msd_select_own ON public.meal_stock_deductions
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'meal_stock_deductions'
      AND policyname = 'msd_insert_own'
  ) THEN
    -- WITH CHECK : on ne peut insérer que des lignes pour soi-même
    CREATE POLICY msd_insert_own ON public.meal_stock_deductions
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'meal_stock_deductions'
      AND policyname = 'msd_update_own'
  ) THEN
    -- USING : seules les lignes de l'utilisateur sont modifiables
    -- WITH CHECK : la mise à jour doit rester sur les siennes (user_id immuable)
    CREATE POLICY msd_update_own ON public.meal_stock_deductions
      FOR UPDATE
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'meal_stock_deductions'
      AND policyname = 'msd_delete_own'
  ) THEN
    -- USING : seul l'utilisateur peut supprimer ses propres lignes
    CREATE POLICY msd_delete_own ON public.meal_stock_deductions
      FOR DELETE USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

-- ============================================================================
-- Vérification
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'meal_stock_deductions'
  ) THEN
    RAISE NOTICE 'Migration 20260709_meal_stock_deductions : table créée avec RLS activé.';
  END IF;
END $$;
