-- ============================================================================
-- Migration V2 — RPC de scan code-barres (produits commerciaux V2)
-- Réf. MYKO_DATA_FOUNDATION_V2 §9.1 (le client lit via des vues/RPC contrôlées)
-- et §3.9 (commercial_products) + §3.5 (nutrition portée par la forme).
-- ============================================================================
-- Le schéma `catalog` n'est pas exposé à l'API : le client passe par cette RPC
-- SECURITY DEFINER en `public`, qui ne renvoie QUE des données publiées.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.scan_commercial_product(p_barcode text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = catalog, public, pg_temp
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'found', true,
        'barcode', cp.barcode,
        'commercial_name', cp.commercial_name,
        'brand', cp.brand,
        'package_quantity', cp.package_quantity,
        'package_unit', cp.package_unit,
        'packaging_type', cp.packaging_type,
        'match_confidence', cp.match_confidence,
        'food_form', CASE WHEN ff.id IS NULL THEN NULL ELSE jsonb_build_object(
          'id', ff.id,
          'name', ff.canonical_name,
          'concept', fc.canonical_name,
          'category', cat.code
        ) END,
        'nutrition_per_100g', (
          SELECT jsonb_object_agg(v.nutrient_code, v.amount)
          FROM catalog.food_nutrition_profiles p
          JOIN catalog.food_nutrient_values v ON v.nutrition_profile_id = p.id
          WHERE p.food_form_id = ff.id AND p.is_primary AND p.published_at IS NOT NULL
        )
      )
      FROM catalog.commercial_products cp
      LEFT JOIN catalog.food_forms ff
             ON ff.id = cp.food_form_id AND ff.status = 'published'
      LEFT JOIN catalog.food_concepts fc ON fc.id = ff.food_concept_id
      LEFT JOIN catalog.food_categories cat ON cat.id = fc.category_id
      WHERE cp.barcode = p_barcode AND cp.status = 'published'
      LIMIT 1
    ),
    jsonb_build_object('found', false, 'barcode', p_barcode)
  );
$$;

COMMENT ON FUNCTION public.scan_commercial_product(text) IS
  'Scan code-barres V2 : renvoie le produit commercial publié + sa forme liée + nutrition/100 g. SECURITY DEFINER, données publiées uniquement (§9.1).';

-- Accès : lecture pour utilisateurs authentifiés ; jamais anon.
REVOKE ALL ON FUNCTION public.scan_commercial_product(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.scan_commercial_product(text) TO authenticated;
