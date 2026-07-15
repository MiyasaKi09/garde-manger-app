-- ============================================================================
-- Migration V2 — Qualité nutritionnelle des étiquettes OFF (fix audit, point 48+)
-- Étend 20260714230003 : ajoute label_nutrition_complete, label_nutrition_confidence,
-- label_nutrition_review_status sur catalog.commercial_products.
-- Migration de données : nettoie les valeurs JSON null dans label_nutriments
-- et initialise label_nutrition_complete selon la présence des 4 macros.
-- scan_commercial_product() mise à jour : la branche étiquette ne s'active
-- que si label_nutrition_complete = true.
-- Idempotent (ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE).
-- ============================================================================

-- ── 1. Nouvelles colonnes ────────────────────────────────────────────────────
ALTER TABLE catalog.commercial_products
  ADD COLUMN IF NOT EXISTS label_nutrition_complete     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS label_nutrition_confidence   text,
  ADD COLUMN IF NOT EXISTS label_nutrition_review_status text NOT NULL DEFAULT 'unreviewed';

COMMENT ON COLUMN catalog.commercial_products.label_nutrition_complete IS
  'True si label_nutriments contient au minimum énergie (kcal), protéines, glucides et lipides non nuls. '
  'Seules les étiquettes complètes sont utilisées comme source de nutrition.';
COMMENT ON COLUMN catalog.commercial_products.label_nutrition_confidence IS
  'Confiance évaluée sur les valeurs d''étiquette (D/C/B/A/A+). Null si pas d''étiquette.';
COMMENT ON COLUMN catalog.commercial_products.label_nutrition_review_status IS
  'Statut de validation humaine de l''étiquette : unreviewed | reviewed_ok | reviewed_suspect | rejected.';

-- Contrainte de domaine sur le statut de revue (idempotente).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_label_review_status'
  ) THEN
    ALTER TABLE catalog.commercial_products
      ADD CONSTRAINT chk_label_review_status
        CHECK (label_nutrition_review_status IN ('unreviewed','reviewed_ok','reviewed_suspect','rejected'));
  END IF;
END $$;

-- ── 2. Migration de données ──────────────────────────────────────────────────

-- 2a. Nettoyer les clés dont la valeur est JSON null dans label_nutriments.
--     Une étiquette entièrement nulle devient '{}', pas NULL.
UPDATE catalog.commercial_products
   SET label_nutriments = (
     SELECT COALESCE(jsonb_object_agg(kv.key, kv.value), '{}')
     FROM jsonb_each(label_nutriments) AS kv(key, value)
     WHERE kv.value IS DISTINCT FROM 'null'::jsonb
   )
 WHERE label_nutriments IS NOT NULL;

-- 2b. Initialiser label_nutrition_complete pour les lignes existantes.
--     Critère : les 4 macros essentiels sont présents et non-nuls dans l'étiquette.
UPDATE catalog.commercial_products
   SET label_nutrition_complete = (
     label_nutriments IS NOT NULL
     AND label_nutriments != '{}'::jsonb
     AND EXISTS (
       SELECT 1 FROM jsonb_each(label_nutriments) AS kv(k, v)
       WHERE kv.k ILIKE '%kcal%' AND kv.v IS DISTINCT FROM 'null'::jsonb
     )
     AND EXISTS (
       SELECT 1 FROM jsonb_each(label_nutriments) AS kv(k, v)
       WHERE kv.k ILIKE '%prot%' AND kv.v IS DISTINCT FROM 'null'::jsonb
     )
     AND EXISTS (
       SELECT 1 FROM jsonb_each(label_nutriments) AS kv(k, v)
       WHERE (kv.k ILIKE '%fat%' OR kv.k ILIKE '%lipid%' OR kv.k ILIKE '%gras%')
         AND kv.v IS DISTINCT FROM 'null'::jsonb
     )
     AND EXISTS (
       SELECT 1 FROM jsonb_each(label_nutriments) AS kv(k, v)
       WHERE (kv.k ILIKE '%carb%' OR kv.k ILIKE '%glucid%')
         AND kv.v IS DISTINCT FROM 'null'::jsonb
     )
   )
 WHERE label_nutriments IS NOT NULL;

-- ── 3. Mise à jour de scan_commercial_product ────────────────────────────────
-- Note : cette version s'applique APRÈS 20260715090003 qui a déjà changé la
-- fonction. On re-crée ici avec la logique label_nutrition_complete intégrée
-- ET le filtre release active, pour que les migrations soient idempotentes dans
-- n'importe quel ordre entre 090003 et 090004.
CREATE OR REPLACE FUNCTION public.scan_commercial_product(p_barcode text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = catalog, ops, public, pg_temp
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'found',           true,
        'barcode',         cp.barcode,
        'commercial_name', cp.commercial_name,
        'brand',           cp.brand,
        'package_quantity', cp.package_quantity,
        'package_unit',    cp.package_unit,
        'packaging_type',  cp.packaging_type,
        'match_confidence', cp.match_confidence,
        'is_composite',    cp.is_composite,
        'label_nutrition_complete', cp.label_nutrition_complete,
        'food_form', CASE WHEN ff.id IS NULL THEN NULL ELSE jsonb_build_object(
          'id',       ff.id,
          'name',     ff.canonical_name,
          'concept',  fc.canonical_name,
          'category', cat.code,
          'used_for', CASE WHEN cp.is_composite THEN 'identity_only' ELSE 'identity_and_nutrition' END
        ) END,
        -- Source de nutrition choisie selon la règle de priorité :
        --   1. étiquette complète et validée (label_nutrition_complete = true) ;
        --   2. composé sans étiquette complète → aucune nutrition (jamais la forme générique) ;
        --   3. produit simple → nutrition de la forme générique publiée (release active).
        'nutrition_source', CASE
          WHEN cp.label_nutrition_complete           THEN 'label'
          WHEN cp.is_composite                       THEN NULL
          WHEN ff.id IS NOT NULL                     THEN 'generic_form'
          ELSE NULL
        END,
        'nutrition_per_100g', CASE
          -- 1. Étiquette du produit, complète et validée.
          WHEN cp.label_nutrition_complete
            THEN cp.label_nutriments
          -- 2. Produit composé sans étiquette complète : pas de nutrition générique.
          WHEN cp.is_composite
            THEN NULL
          -- 3. Produit simple : nutrition de la forme générique dans la release active.
          ELSE (
            SELECT jsonb_object_agg(v.nutrient_code, v.amount)
            FROM food_nutrition_profiles p
            JOIN food_nutrient_values v ON v.nutrition_profile_id = p.id
            WHERE p.food_form_id = ff.id
              AND p.is_primary
              AND p.published_at IS NOT NULL
          )
        END
      )
      FROM commercial_products cp
      -- Forme : publiée ET dans la release catalogue active.
      LEFT JOIN food_forms ff
             ON ff.id     = cp.food_form_id
            AND ff.status = 'published'
            AND EXISTS (
              SELECT 1
              FROM catalog_release_items ri
              JOIN active_catalog_release ar ON ar.release_id = ri.release_id
              WHERE ri.entity_id     = ff.id
                AND ri.entity_schema = 'catalog'
                AND ri.entity_table  = 'food_forms'
            )
      LEFT JOIN food_concepts   fc  ON fc.id  = ff.food_concept_id
      LEFT JOIN food_categories cat ON cat.id = fc.category_id
      WHERE cp.barcode = p_barcode
        AND cp.status  = 'published'
      LIMIT 1
    ),
    jsonb_build_object('found', false, 'barcode', p_barcode)
  );
$$;

COMMENT ON FUNCTION public.scan_commercial_product(text) IS
  'Scan code-barres V2 : étiquette uniquement si label_nutrition_complete=true ; composé sans étiquette complète → nutrition null ; '
  'produit simple → forme générique (release active). SECURITY DEFINER (§9.1).';

REVOKE ALL ON FUNCTION public.scan_commercial_product(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.scan_commercial_product(text) TO authenticated;
