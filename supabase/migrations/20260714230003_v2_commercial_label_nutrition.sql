-- ============================================================================
-- Migration V2 — Nutrition des produits commerciaux : étiquette d'abord (fix R0, 48)
-- ============================================================================
-- Le rapprochement OFF pouvait donner la nutrition d'une forme GÉNÉRIQUE Ciqual à un
-- produit COMPOSÉ (« Curry de pois chiches », « Haricots à la tomate », « Quinoa aux
-- amandes »…) : matériellement faux. Règle correcte :
--   produit commercial  -> nutrition de son ÉTIQUETTE en priorité ;
--   forme générique      -> uniquement pour l'IDENTITÉ culinaire + conversions ;
--   produit composé sans étiquette -> pas de nutrition (jamais celle d'une forme simple).
-- Idempotent.
-- ============================================================================

ALTER TABLE catalog.commercial_products
  ADD COLUMN IF NOT EXISTS label_nutriments jsonb,
  ADD COLUMN IF NOT EXISTS is_composite boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN catalog.commercial_products.label_nutriments IS
  'Valeurs nutritionnelles de l''ÉTIQUETTE (pour 100 g/ml), source OFF. Prioritaires sur la forme générique.';
COMMENT ON COLUMN catalog.commercial_products.is_composite IS
  'Produit transformé/composé (plusieurs ingrédients) : ne jamais lui appliquer la nutrition d''une forme simple.';

CREATE OR REPLACE FUNCTION public.scan_commercial_product(p_barcode text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = catalog, public, pg_temp AS $$
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
        'is_composite', cp.is_composite,
        -- la forme reste renvoyée pour l'IDENTITÉ + les conversions, jamais imposée pour la nutrition d'un composé.
        'food_form', CASE WHEN ff.id IS NULL THEN NULL ELSE jsonb_build_object(
          'id', ff.id, 'name', ff.canonical_name, 'concept', fc.canonical_name, 'category', cat.code,
          'used_for', CASE WHEN cp.is_composite THEN 'identity_only' ELSE 'identity_and_nutrition' END
        ) END,
        'nutrition_source', CASE
          WHEN cp.label_nutriments IS NOT NULL AND cp.label_nutriments <> '{}'::jsonb THEN 'label'
          WHEN cp.is_composite THEN NULL
          WHEN ff.id IS NOT NULL THEN 'generic_form'
          ELSE NULL END,
        'nutrition_per_100g', CASE
          -- 1. étiquette du produit : prioritaire
          WHEN cp.label_nutriments IS NOT NULL AND cp.label_nutriments <> '{}'::jsonb THEN cp.label_nutriments
          -- 2. produit composé sans étiquette : PAS de nutrition générique (faux)
          WHEN cp.is_composite THEN NULL
          -- 3. produit simple : nutrition de la forme générique publiée
          ELSE (
            SELECT jsonb_object_agg(v.nutrient_code, v.amount)
            FROM catalog.food_nutrition_profiles p
            JOIN catalog.food_nutrient_values v ON v.nutrition_profile_id = p.id
            WHERE p.food_form_id = ff.id AND p.is_primary AND p.published_at IS NOT NULL
          ) END
      )
      FROM catalog.commercial_products cp
      LEFT JOIN catalog.food_forms ff ON ff.id = cp.food_form_id AND ff.status = 'published'
      LEFT JOIN catalog.food_concepts fc ON fc.id = ff.food_concept_id
      LEFT JOIN catalog.food_categories cat ON cat.id = fc.category_id
      WHERE cp.barcode = p_barcode AND cp.status = 'published'
      LIMIT 1
    ),
    jsonb_build_object('found', false, 'barcode', p_barcode)
  );
$$;

-- Backfill : marquer les produits COMPOSÉS déjà présents (seed #101) par motif de nom,
-- afin que la règle « pas de nutrition générique pour un composé » s'applique dès le merge.
UPDATE catalog.commercial_products
SET is_composite = true
WHERE is_composite = false
  AND commercial_name ~* '(curry|à la |aux |cuisin|croquant|gourmand|savora|prépar|prepar|sauce|farci|nappé|fumé|mariné)';

REVOKE ALL ON FUNCTION public.scan_commercial_product(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.scan_commercial_product(text) TO authenticated;
