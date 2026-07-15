-- ============================================================================
-- Migration V2 — Immuabilité complète des recettes (fix audit directeur)
-- Étend 20260714230002 : bloque INSERT en plus de UPDATE/DELETE sur les
-- enfants d'une version publiée ; bloque toute modification des tables de
-- variation quand la famille possède au moins une version publiée.
-- Idempotent (CREATE OR REPLACE, DROP TRIGGER IF EXISTS).
-- ============================================================================

-- ── Aide : famille avec au moins une version publiée ────────────────────────
CREATE OR REPLACE FUNCTION culinary.family_has_published_version(p_family_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM culinary.recipe_versions
    WHERE recipe_family_id = p_family_id
      AND publication_status = 'published'
  )
$$;

COMMENT ON FUNCTION culinary.family_has_published_version(uuid) IS
  'Renvoie true si la famille possède au moins une version publiée (utilisé par les triggers de variation).';

-- ── Trigger enfants portant recipe_version_id ────────────────────────────────
-- Remplace la version précédente (UPDATE OR DELETE) ; ajoute le blocage INSERT.
CREATE OR REPLACE FUNCTION culinary.tg_child_of_published_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
DECLARE
  v_ver uuid;
  v_pub text;
BEGIN
  -- Pour INSERT : OLD est null → on lit depuis NEW.
  -- Pour DELETE : NEW est null → on lit depuis OLD.
  IF TG_OP = 'DELETE' THEN
    v_ver := OLD.recipe_version_id;
  ELSE
    v_ver := NEW.recipe_version_id;
  END IF;

  SELECT publication_status INTO v_pub
  FROM culinary.recipe_versions
  WHERE id = v_ver;

  IF v_pub = 'published' THEN
    RAISE EXCEPTION '%: enfant d''une recette publiée immuable (créer une nouvelle version)',
      TG_TABLE_NAME;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $fn$;

-- Réinstaller sur les 4 tables enfants directes (INSERT OR UPDATE OR DELETE).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'recipe_components',
    'recipe_ingredient_requirements',
    'recipe_steps',
    'recipe_instruction_branches'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_immutable ON culinary.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_immutable'
      ' BEFORE INSERT OR UPDATE OR DELETE ON culinary.%I'
      ' FOR EACH ROW EXECUTE FUNCTION culinary.tg_child_of_published_version()',
      t, t
    );
  END LOOP;
END $$;

-- ── Trigger recipe_requirement_options (via requirement_id → version) ────────
-- Idem : ajoute INSERT au blocage UPDATE OR DELETE existant.
CREATE OR REPLACE FUNCTION culinary.tg_option_of_published_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
DECLARE
  v_req_id uuid;
  v_pub    text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_req_id := OLD.requirement_id;
  ELSE
    v_req_id := NEW.requirement_id;
  END IF;

  SELECT rv.publication_status INTO v_pub
  FROM culinary.recipe_ingredient_requirements req
  JOIN culinary.recipe_versions rv ON rv.id = req.recipe_version_id
  WHERE req.id = v_req_id;

  IF v_pub = 'published' THEN
    RAISE EXCEPTION
      'recipe_requirement_options: option d''une recette publiée immuable (créer une nouvelle version)';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $fn$;

DROP TRIGGER IF EXISTS trg_recipe_requirement_options_immutable ON culinary.recipe_requirement_options;
CREATE TRIGGER trg_recipe_requirement_options_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON culinary.recipe_requirement_options
  FOR EACH ROW EXECUTE FUNCTION culinary.tg_option_of_published_version();

-- ── Trigger tables de variation (niveau famille) ─────────────────────────────
-- Bloque INSERT/UPDATE/DELETE sur recipe_variation_axes, recipe_variation_options,
-- recipe_configuration_rules quand la famille a au moins une version publiée.
-- Pour recipe_variation_options, le family_id est résolu via l'axe parent.

CREATE OR REPLACE FUNCTION culinary.tg_variation_of_published_family()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
DECLARE
  v_family_id uuid;
  v_axis_id   uuid;
BEGIN
  IF TG_TABLE_NAME = 'recipe_variation_options' THEN
    -- La forme cible son family_id via l'axe.
    IF TG_OP = 'DELETE' THEN
      v_axis_id := OLD.variation_axis_id;
    ELSE
      v_axis_id := NEW.variation_axis_id;
    END IF;
    SELECT ax.recipe_family_id INTO v_family_id
    FROM culinary.recipe_variation_axes ax
    WHERE ax.id = v_axis_id;
  ELSE
    -- recipe_variation_axes et recipe_configuration_rules portent recipe_family_id directement.
    IF TG_OP = 'DELETE' THEN
      v_family_id := OLD.recipe_family_id;
    ELSE
      v_family_id := NEW.recipe_family_id;
    END IF;
  END IF;

  IF culinary.family_has_published_version(v_family_id) THEN
    RAISE EXCEPTION
      '%: lié à une famille ayant une version publiée — immuable (créer une nouvelle version)',
      TG_TABLE_NAME;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $fn$;

COMMENT ON FUNCTION culinary.tg_variation_of_published_family() IS
  'Bloque toute modification des axes/options/règles de variation quand la famille a une version publiée.';

-- Axes de variation
DROP TRIGGER IF EXISTS trg_recipe_variation_axes_immutable ON culinary.recipe_variation_axes;
CREATE TRIGGER trg_recipe_variation_axes_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON culinary.recipe_variation_axes
  FOR EACH ROW EXECUTE FUNCTION culinary.tg_variation_of_published_family();

-- Options de variation
DROP TRIGGER IF EXISTS trg_recipe_variation_options_immutable ON culinary.recipe_variation_options;
CREATE TRIGGER trg_recipe_variation_options_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON culinary.recipe_variation_options
  FOR EACH ROW EXECUTE FUNCTION culinary.tg_variation_of_published_family();

-- Règles de compatibilité
DROP TRIGGER IF EXISTS trg_recipe_configuration_rules_immutable ON culinary.recipe_configuration_rules;
CREATE TRIGGER trg_recipe_configuration_rules_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON culinary.recipe_configuration_rules
  FOR EACH ROW EXECUTE FUNCTION culinary.tg_variation_of_published_family();
