-- ============================================================================
-- Migration V2 — Immuabilité des tables ENFANTS d'une recette publiée (fix R0, 47)
-- ============================================================================
-- La PR #102 figeait recipe_versions mais pas ses enfants : une recette publiée
-- pouvait garder son titre/hash tout en voyant ses ingrédients ou étapes modifiés.
-- On bloque toute modification/suppression d'un enfant dont la VERSION parente est
-- publiée : composants, exigences d'ingrédients, options, étapes, branches.
-- Idempotent.
-- ============================================================================

-- Enfants portant recipe_version_id directement.
CREATE OR REPLACE FUNCTION culinary.tg_child_of_published_version()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $fn$
DECLARE v_ver uuid; v_pub text;
BEGIN
  v_ver := COALESCE(NEW.recipe_version_id, OLD.recipe_version_id);
  SELECT publication_status INTO v_pub FROM culinary.recipe_versions WHERE id = v_ver;
  IF v_pub = 'published' THEN
    RAISE EXCEPTION '%: enfant d''une recette publiée immuable (créer une nouvelle version)', TG_TABLE_NAME;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $fn$;

-- recipe_requirement_options : version via requirement_id -> ingredient_requirements.
CREATE OR REPLACE FUNCTION culinary.tg_option_of_published_version()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $fn$
DECLARE v_pub text;
BEGIN
  SELECT rv.publication_status INTO v_pub
  FROM culinary.recipe_ingredient_requirements r
  JOIN culinary.recipe_versions rv ON rv.id = r.recipe_version_id
  WHERE r.id = COALESCE(NEW.requirement_id, OLD.requirement_id);
  IF v_pub = 'published' THEN
    RAISE EXCEPTION 'recipe_requirement_options: option d''une recette publiée immuable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $fn$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['recipe_components','recipe_ingredient_requirements','recipe_steps','recipe_instruction_branches'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_immutable ON culinary.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_immutable BEFORE UPDATE OR DELETE ON culinary.%I FOR EACH ROW EXECUTE FUNCTION culinary.tg_child_of_published_version()', t, t);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_recipe_requirement_options_immutable ON culinary.recipe_requirement_options;
CREATE TRIGGER trg_recipe_requirement_options_immutable
  BEFORE UPDATE OR DELETE ON culinary.recipe_requirement_options
  FOR EACH ROW EXECUTE FUNCTION culinary.tg_option_of_published_version();
