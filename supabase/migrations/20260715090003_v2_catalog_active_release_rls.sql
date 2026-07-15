-- ============================================================================
-- Migration V2 — Lecture catalogue scopée à la release active
-- Réf. audit directeur : cohérence entre set publié et pointeur actif.
-- ============================================================================
-- Nouvelle helper SECURITY DEFINER : catalog.is_in_active_release(uuid).
-- Politiques SELECT sur catalog.food_forms et chemins nutritionnels mises à
-- jour : authenticated ne voit une forme que si elle est dans la release active.
-- Reviewer et publisher conservent la visibilité complète (candidats inclus).
-- NOTE : scan_commercial_product() est mise à jour dans 090004 (après l'ajout
-- de la colonne label_nutrition_complete) pour éviter toute référence anticipée.
-- Idempotent (CREATE OR REPLACE, DROP POLICY IF EXISTS).
-- ============================================================================

-- ── 1. Fonction helper : la forme est-elle dans la release active ? ────────
CREATE OR REPLACE FUNCTION catalog.is_in_active_release(p_form_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM catalog.food_forms ff
    JOIN ops.catalog_release_items ri
      ON ri.entity_id     = ff.id
     AND ri.entity_schema = 'catalog'
     AND ri.entity_table  = 'food_forms'
    JOIN ops.active_catalog_release ar
      ON ar.release_id = ri.release_id
    WHERE ff.id     = p_form_id
      AND ff.status = 'published'
  )
$$;

COMMENT ON FUNCTION catalog.is_in_active_release(uuid) IS
  'Renvoie true si la forme est publiée ET appartient aux items de la release catalogue active. '
  'SECURITY DEFINER : accède à ops sans exposer les tables ops à authenticated.';

-- Droits sur le helper.
REVOKE ALL ON FUNCTION catalog.is_in_active_release(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION catalog.is_in_active_release(uuid)
  TO authenticated, data_reader, data_reviewer, data_publisher;

-- ── 2. Politique de lecture food_forms pour authenticated ─────────────────
-- Remplace la policy existante (status='published') en ajoutant la contrainte
-- de release active. Doit être la seule policy en lecture pour authenticated.
DROP POLICY IF EXISTS p_food_forms_read ON catalog.food_forms;
CREATE POLICY p_food_forms_read ON catalog.food_forms
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND catalog.is_in_active_release(id)
  );

-- Policy distincte pour data_reviewer et data_publisher : visibilité totale
-- (candidats + publiés) pour le travail de revue et de publication.
DROP POLICY IF EXISTS p_food_forms_staff_read ON catalog.food_forms;
CREATE POLICY p_food_forms_staff_read ON catalog.food_forms
  FOR SELECT TO data_reviewer, data_publisher
  USING (true);

-- ── 3. Profils nutritionnels : suivent la release active ─────────────────
DROP POLICY IF EXISTS p_nutrition_profiles_read ON catalog.food_nutrition_profiles;
CREATE POLICY p_nutrition_profiles_read ON catalog.food_nutrition_profiles
  FOR SELECT TO authenticated
  USING (
    published_at IS NOT NULL
    AND catalog.is_in_active_release(food_form_id)
  );

-- Staff : visibilité totale des profils (publiés + non publiés).
DROP POLICY IF EXISTS p_nutrition_profiles_staff_read ON catalog.food_nutrition_profiles;
CREATE POLICY p_nutrition_profiles_staff_read ON catalog.food_nutrition_profiles
  FOR SELECT TO data_reviewer, data_publisher
  USING (true);

-- ── 4. Valeurs de nutriments : suivent la release active ─────────────────
DROP POLICY IF EXISTS p_nutrient_values_read ON catalog.food_nutrient_values;
CREATE POLICY p_nutrient_values_read ON catalog.food_nutrient_values
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM catalog.food_nutrition_profiles p
      WHERE p.id            = food_nutrient_values.nutrition_profile_id
        AND p.published_at  IS NOT NULL
        AND catalog.is_in_active_release(p.food_form_id)
    )
  );

DROP POLICY IF EXISTS p_nutrient_values_staff_read ON catalog.food_nutrient_values;
CREATE POLICY p_nutrient_values_staff_read ON catalog.food_nutrient_values
  FOR SELECT TO data_reviewer, data_publisher
  USING (true);

-- ── 5. food_concepts : la policy existante (status='published') est conservée.
-- Un concept peut être publié même si certaines de ses formes sont hors release.
-- On n'ajoute pas de filtre release ici pour éviter les ruptures de navigation.

-- ── 6. scan_commercial_product ────────────────────────────────────────────
-- La refonte de cette fonction (filtre release active + label_nutrition_complete)
-- est effectuée dans la migration suivante 090004, qui ajoute d'abord la colonne
-- label_nutrition_complete sur catalog.commercial_products avant de (re)créer
-- la fonction. Séparer les deux migrations évite toute référence de colonne
-- anticipée dans un corps LANGUAGE sql validé à la création.
-- (Aucun code ici — voir 20260715090004_v2_off_label_completeness.sql.)
