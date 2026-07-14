-- ============================================================================
-- Publication F0 FONCTIONNEL (release F0.1) — pilotée par les recettes R0.
-- Réf. audit directeur : F0 = ingrédients des recettes, publié ATOMIQUEMENT.
-- ============================================================================
-- Pour chaque aliment de la liste fonctionnelle R0 ayant une nutrition Ciqual,
-- on sélectionne la meilleure forme candidate, on l'inscrit dans une release,
-- on relève la confiance d'identité (validée par usage recette : C → B), puis on
-- PUBLIE en UNE transaction via ops.publish_catalog_release(). Les aliments sans
-- correspondance Ciqual propre (crème, sel, haut de cuisse spécifique) restent à
-- créer/structurer (golden corpus) — non publiés.
-- Idempotent.
-- ============================================================================
DO $$
DECLARE v_rel uuid;
  functional text[] := ARRAY[
    'moutarde','lentille verte','carotte','oeuf','pois chiche','quinoa','cabillaud',
    'citron','tomate','oignon jaune','oignon rouge','poivron rouge','haricot vert',
    'ail','persil','comte','riz blanc','pomme de terre'
  ];
BEGIN
  INSERT INTO ops.catalog_releases(release_type,version,status,manifest,checksums,quality_report)
  VALUES('food','F0.1-functional-r0','publishing',
         jsonb_build_object('derived_from','recipes:r0','source','ciqual_2020'),
         '{}'::jsonb,
         jsonb_build_object('note','F0 fonctionnel : formes requises par les recettes R0, validées et publiées.'))
  ON CONFLICT (version) DO UPDATE SET status='publishing' RETURNING id INTO v_rel;

  -- Meilleure forme candidate Ciqual (avec nutrition) par aliment fonctionnel.
  CREATE TEMP TABLE _m ON COMMIT DROP AS
  SELECT DISTINCT ON (fn) fn, form_id, concept_id FROM (
    SELECT f.fn, ff.id AS form_id, fc.id AS concept_id,
           length(fc.canonical_name_normalized) AS cl, length(ff.canonical_name_normalized) AS fl
    FROM unnest(functional) AS f(fn)
    JOIN catalog.food_concepts fc ON fc.status<>'rejected'
      AND (fc.canonical_name_normalized = f.fn OR position(f.fn IN fc.canonical_name_normalized) > 0)
    JOIN catalog.food_forms ff ON ff.food_concept_id = fc.id AND ff.status<>'rejected'
    JOIN catalog.food_nutrition_profiles p ON p.food_form_id = ff.id AND p.data_version='2020-07-07'
  ) s ORDER BY fn, cl, fl;

  INSERT INTO ops.catalog_release_items(release_id,entity_schema,entity_table,entity_id)
  SELECT v_rel,'catalog','food_forms',form_id FROM _m
  ON CONFLICT DO NOTHING;
  INSERT INTO ops.catalog_release_items(release_id,entity_schema,entity_table,entity_id)
  SELECT DISTINCT v_rel,'catalog','food_concepts',concept_id FROM _m
  ON CONFLICT DO NOTHING;

  -- Confiance d'identité/catégorie relevée à B (validée par usage dans une recette).
  UPDATE catalog.food_forms SET identity_confidence='B', category_confidence='B'
   WHERE id IN (SELECT form_id FROM _m);
  UPDATE catalog.food_concepts SET confidence_level='B', category_confidence='B'
   WHERE id IN (SELECT concept_id FROM _m);

  -- Publication ATOMIQUE.
  PERFORM ops.publish_catalog_release(v_rel);
END $$;
