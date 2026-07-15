-- ============================================================================
-- Bootstrap CI — reproduit le socle Supabase sur un Postgres vanille (tests).
-- ============================================================================
-- Les migrations V2 s'appuient sur des rôles et un schéma `auth` fournis par la
-- plateforme Supabase. Sur le Postgres éphémère de la CI, on les crée en amont
-- (stubs) pour que `apply-migrations.sh` puis les tests SQL s'exécutent tels quels.
-- N'EST JAMAIS appliqué à la vraie base Supabase (uniquement en CI).
-- Idempotent.
-- ============================================================================

-- Rôles de base Supabase (les migrations 0005 leur accordent des privilèges).
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','authenticator','supabase_admin','supabase_auth_admin'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN', r);
    END IF;
  END LOOP;
END $$;

-- Schéma + fonctions d'auth (stubs). auth.uid()/auth.role() renvoient NULL en CI.
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.role', true), '') $$;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
  LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;

-- Extensions couramment requises par le socle.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
