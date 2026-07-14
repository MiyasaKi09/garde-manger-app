-- ============================================================================
-- Migration V2 · 0001 — Schémas & rôles techniques (fondation tabula rasa)
-- Réf. MYKO_DATA_FOUNDATION_V2 §2.1 (schémas) et §9.4 (rôles techniques).
-- ============================================================================
--
-- CONTEXTE
-- --------
-- Refonte « tabula rasa » : le catalogue aliments/recettes est reconstruit dans
-- des schémas PostgreSQL dédiés, isolés de l'ancien `public` (V1). Cette première
-- migration ne crée QUE les schémas et les rôles de groupe. Aucune table, aucun
-- import. Elle est ADDITIVE : elle ne touche pas au schéma `public` legacy, qui
-- continue de faire tourner l'application V1 jusqu'à la bascule (Phase 6).
--
-- IDEMPOTENCE
-- -----------
-- `CREATE SCHEMA IF NOT EXISTS` + garde `pg_roles` pour les rôles.
-- ============================================================================

-- ── Schémas (zones de confiance & domaines) ─────────────────────────────────
CREATE SCHEMA IF NOT EXISTS source_raw;  -- Zone 0 : copies brutes immuables
CREATE SCHEMA IF NOT EXISTS staging;     -- Zone 1 : enregistrements parsés, non fiables
CREATE SCHEMA IF NOT EXISTS catalog;     -- Zone 3 : aliments, formes, nutrition, conservation
CREATE SCHEMA IF NOT EXISTS culinary;    -- Zone 3 : familles, versions, variantes, étapes
CREATE SCHEMA IF NOT EXISTS inventory;   -- stock réel : lieux, lots, mouvements, réservations
CREATE SCHEMA IF NOT EXISTS planning;    -- plans, repas, courses, tâches, snapshots
CREATE SCHEMA IF NOT EXISTS private;     -- foyer, profils, préférences, objectifs, feedback
CREATE SCHEMA IF NOT EXISTS quality;     -- anomalies, revues, scores, rapports, décisions
CREATE SCHEMA IF NOT EXISTS ops;         -- imports, versions de données, releases, audits

COMMENT ON SCHEMA source_raw IS 'Zone 0 — sources téléchargées, immuables, jamais exposées au client.';
COMMENT ON SCHEMA staging IS 'Zone 1 — enregistrements parsés, identités non garanties, aucun usage produit.';
COMMENT ON SCHEMA catalog IS 'Zone 3 — aliments/formes/nutrition/conservation/conversions publiés.';
COMMENT ON SCHEMA culinary IS 'Zone 3 — familles de recettes, versions immuables, variantes, étapes.';
COMMENT ON SCHEMA ops IS 'Fabrique de données — sources, runs, provenance, releases.';
COMMENT ON SCHEMA quality IS 'Qualité — anomalies, tâches de revue, scores, décisions.';

-- ── Rôles techniques de groupe (NOLOGIN) ────────────────────────────────────
-- Séparation essentielle (§9.4) : un import compromis ne peut pas publier.
-- Ce sont des rôles de groupe sans login ; le wiring applicatif (JWT/claims)
-- se fera lors de la mise en place des services d'import. Créés ici pour poser
-- la structure de droits.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'data_reader') THEN
    CREATE ROLE data_reader NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'data_importer') THEN
    CREATE ROLE data_importer NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'data_reviewer') THEN
    CREATE ROLE data_reviewer NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'data_publisher') THEN
    CREATE ROLE data_publisher NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_server') THEN
    CREATE ROLE app_server NOLOGIN;
  END IF;
END $$;

COMMENT ON ROLE data_reader   IS 'Lecture du catalogue publié.';
COMMENT ON ROLE data_importer IS 'Écrit uniquement en source_raw et staging (jamais catalog/culinary).';
COMMENT ON ROLE data_reviewer IS 'Résout les tâches de qualité (quality.review_tasks).';
COMMENT ON ROLE data_publisher IS 'Publie une release validée (ops.catalog_releases).';
COMMENT ON ROLE app_server    IS 'Opérations privées de l''application (routes serveur / RPC).';

-- ── USAGE de base sur les schémas ───────────────────────────────────────────
-- anon : AUCUN accès aux schémas V2 (pas de GRANT USAGE).
-- authenticated : USAGE en lecture sur les schémas publiés (tables filtrées par RLS).
GRANT USAGE ON SCHEMA catalog, culinary TO authenticated;

-- Rôles techniques : usage ciblé.
GRANT USAGE ON SCHEMA source_raw, staging TO data_importer;
GRANT USAGE ON SCHEMA catalog, culinary TO data_reader, data_publisher;
GRANT USAGE ON SCHEMA quality TO data_reviewer, data_publisher;
GRANT USAGE ON SCHEMA ops TO data_publisher, data_importer;
GRANT USAGE ON SCHEMA private, inventory, planning TO app_server;

-- Le rôle applicatif serveur hérite des droits de lecture catalogue.
GRANT data_reader TO app_server;
