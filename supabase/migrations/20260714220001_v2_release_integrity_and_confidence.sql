-- ============================================================================
-- Migration V2 — Intégrité des releases, confiance granulaire, immuabilité
-- Réf. audit directeur (fix F0) : points 3, 7, 8, 14.
-- ============================================================================
-- 1. Confiance DISTINCTE : nutrition (source Ciqual = B) ≠ identité/catégorie/états
--    (découpage automatique = C/D, à réviser). §2.3.
-- 2. Release réellement atomique + rollback par pointeur : catalog_release_items
--    (contenu exact) + active_catalog_release (pointeur actif). §7.6-7.7.
-- 3. Immuabilité d'une recette publiée + d'un snapshot d'exécution. §4.2, §4.9.
-- Idempotent.
-- ============================================================================

-- ── 1. Confiance granulaire (identité/catégorie/états) ──────────────────────
DO $$
DECLARE ck text := $ck$ IN ('D','C','B','A','A+') $ck$;
BEGIN
  -- concepts : la confiance d'IDENTITÉ = confidence_level existant ; on ajoute catégorie.
  ALTER TABLE catalog.food_concepts
    ADD COLUMN IF NOT EXISTS category_confidence text NOT NULL DEFAULT 'D';
  -- formes : identité, catégorie, états culinaires (chacun distinct de la nutrition).
  ALTER TABLE catalog.food_forms
    ADD COLUMN IF NOT EXISTS identity_confidence text NOT NULL DEFAULT 'D',
    ADD COLUMN IF NOT EXISTS category_confidence text NOT NULL DEFAULT 'D',
    ADD COLUMN IF NOT EXISTS state_confidence   text NOT NULL DEFAULT 'D';
END $$;

-- Contraintes de domaine (idempotentes).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_food_concepts_cat_conf') THEN
    ALTER TABLE catalog.food_concepts ADD CONSTRAINT chk_food_concepts_cat_conf
      CHECK (category_confidence IN ('D','C','B','A','A+'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_food_forms_conf') THEN
    ALTER TABLE catalog.food_forms ADD CONSTRAINT chk_food_forms_conf
      CHECK (identity_confidence IN ('D','C','B','A','A+')
         AND category_confidence IN ('D','C','B','A','A+')
         AND state_confidence   IN ('D','C','B','A','A+'));
  END IF;
END $$;

COMMENT ON COLUMN catalog.food_forms.identity_confidence IS
  'Confiance sur l''identité de la forme (découpage auto ≠ nutrition Ciqual). Distinct du profil nutritionnel.';
COMMENT ON COLUMN catalog.food_forms.category_confidence IS 'Confiance sur le rangement (catégorie Myko).';
COMMENT ON COLUMN catalog.food_forms.state_confidence IS 'Confiance sur les états culinaires extraits (cuisson, os, peau…).';

-- ── 2. Release atomique + rollback par pointeur ─────────────────────────────
CREATE TABLE IF NOT EXISTS ops.catalog_release_items (
  release_id    uuid NOT NULL REFERENCES ops.catalog_releases(id) ON DELETE CASCADE,
  entity_schema text NOT NULL,
  entity_table  text NOT NULL,
  entity_id     uuid NOT NULL,
  content_hash  text,
  PRIMARY KEY (release_id, entity_schema, entity_table, entity_id)
);
COMMENT ON TABLE ops.catalog_release_items IS 'Contenu EXACT d''une release (entités + hash) — permet un rollback précis (§7.6).';

CREATE TABLE IF NOT EXISTS ops.active_catalog_release (
  release_type text PRIMARY KEY,
  release_id   uuid NOT NULL REFERENCES ops.catalog_releases(id),
  activated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE ops.active_catalog_release IS
  'Pointeur de release ACTIVE par type. Le rollback repointe ici, sans supprimer de données (§7.7).';

ALTER TABLE ops.catalog_release_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops.active_catalog_release ENABLE ROW LEVEL SECURITY;

-- ── 3. Immuabilité : recette publiée + snapshot d'exécution ─────────────────
CREATE OR REPLACE FUNCTION culinary.tg_recipe_version_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.publication_status = 'published' THEN
      RAISE EXCEPTION 'recipe_versions %: une version publiée est immuable (suppression interdite)', OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  -- UPDATE : sur une version publiée, le CONTENU est figé ; seule la transition
  -- de statut (published → superseded/archived) est autorisée.
  IF OLD.publication_status = 'published' THEN
    IF NEW.content_hash IS DISTINCT FROM OLD.content_hash
       OR NEW.title      IS DISTINCT FROM OLD.title
       OR NEW.servings   IS DISTINCT FROM OLD.servings
       OR NEW.recipe_family_id IS DISTINCT FROM OLD.recipe_family_id
       OR NEW.version_number   IS DISTINCT FROM OLD.version_number THEN
      RAISE EXCEPTION 'recipe_versions %: contenu d''une version publiée immuable (créer une nouvelle version)', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_recipe_versions_immutable ON culinary.recipe_versions;
CREATE TRIGGER trg_recipe_versions_immutable
  BEFORE UPDATE OR DELETE ON culinary.recipe_versions
  FOR EACH ROW EXECUTE FUNCTION culinary.tg_recipe_version_immutable();

CREATE OR REPLACE FUNCTION culinary.tg_execution_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'recipe_executions %: snapshot d''exécution immuable (aucune modification/suppression)',
    COALESCE(OLD.id, NEW.id);
END $$;

DROP TRIGGER IF EXISTS trg_recipe_executions_immutable ON culinary.recipe_executions;
CREATE TRIGGER trg_recipe_executions_immutable
  BEFORE UPDATE OR DELETE ON culinary.recipe_executions
  FOR EACH ROW EXECUTE FUNCTION culinary.tg_execution_immutable();
