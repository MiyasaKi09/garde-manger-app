-- ============================================================================
-- Migration: 20260708_waste_prevention_log.sql
-- Table de journalisation anti-gaspillage — Phase 1 / §C5 de l'audit juillet 2026
-- ============================================================================
--
-- CONTEXTE
-- --------
-- wastePreventionService.js référençait une table waste_prevention_log qui
-- n'existait pas dans le schéma (constat §C5 — table manquante parmi les
-- requêtes cassées de l'anti-gaspillage).
--
-- DESCRIPTION
-- -----------
-- Enregistre les actions anti-gaspillage déclenchées par l'application :
-- consommation d'un lot proche de sa DLC, don, congélation préventive, etc.
-- Permet de calculer le volume de gaspillage évité (en kg et en €).
--
-- COLONNES
-- --------
-- id                  : UUID généré automatiquement (PK)
-- user_id             : utilisateur propriétaire de l'action (FK auth.users)
-- lot_id              : lot concerné (FK inventory_lots, SET NULL si lot supprimé)
-- action              : type d'action ('consumed', 'donated', 'frozen', 'cooked', etc.)
-- quantity            : quantité traitée
-- unit                : unité de la quantité (libre, alignée sur inventory_lots.unit)
-- estimated_value_eur : valeur marchande estimée sauvée (pour statistiques)
-- created_at          : horodatage de l'action
--
-- RLS
-- ---
-- Policy per-user : chaque utilisateur voit uniquement ses propres entrées.
-- (Même pattern que inventory_lots dans 20260708_rls_user_tables.sql)
--
-- IDEMPOTENCE
-- -----------
-- CREATE TABLE IF NOT EXISTS + IF NOT EXISTS sur les index + DO $$ sur les policies.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waste_prevention_log (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             UUID        DEFAULT auth.uid()
                                    REFERENCES auth.users(id) ON DELETE SET NULL,
    -- lot_id : SET NULL si le lot est supprimé (l'historique est conservé)
    lot_id              UUID        REFERENCES public.inventory_lots(id) ON DELETE SET NULL,
    action              TEXT,
    quantity            NUMERIC,
    unit                TEXT,
    estimated_value_eur NUMERIC,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.waste_prevention_log IS
'Journal des actions anti-gaspillage : consommation préventive, congélation,
don, cuisson d''un lot proche de sa DLC. Utilisé par wastePreventionService.js
pour calculer le volume de gaspillage évité (kg, €).';

COMMENT ON COLUMN public.waste_prevention_log.action IS
'Type d''action : consumed, donated, frozen, cooked, shared, composted…';

COMMENT ON COLUMN public.waste_prevention_log.estimated_value_eur IS
'Valeur marchande approximative sauvée (optionnel, pour tableau de bord anti-gaspillage).';

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_wpl_user_id
    ON public.waste_prevention_log (user_id);

CREATE INDEX IF NOT EXISTS idx_wpl_user_created_at
    ON public.waste_prevention_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wpl_lot_id
    ON public.waste_prevention_log (lot_id)
    WHERE lot_id IS NOT NULL;

-- ============================================================================
-- RLS — policies per-utilisateur
-- ============================================================================
ALTER TABLE public.waste_prevention_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'waste_prevention_log'
      AND policyname = 'wpl_select_own'
  ) THEN
    CREATE POLICY wpl_select_own ON public.waste_prevention_log
      FOR SELECT USING ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'waste_prevention_log'
      AND policyname = 'wpl_insert_own'
  ) THEN
    CREATE POLICY wpl_insert_own ON public.waste_prevention_log
      FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'waste_prevention_log'
      AND policyname = 'wpl_update_own'
  ) THEN
    CREATE POLICY wpl_update_own ON public.waste_prevention_log
      FOR UPDATE
      USING     ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'waste_prevention_log'
      AND policyname = 'wpl_delete_own'
  ) THEN
    CREATE POLICY wpl_delete_own ON public.waste_prevention_log
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
    WHERE table_schema = 'public' AND table_name = 'waste_prevention_log'
  ) THEN
    RAISE NOTICE 'Migration 20260708_waste_prevention_log : table créée avec RLS activé.';
  END IF;
END $$;
