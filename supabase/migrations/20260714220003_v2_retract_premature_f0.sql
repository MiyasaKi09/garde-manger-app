-- ============================================================================
-- Migration V2 — Rétractation de la publication prématurée de F0
-- Réf. audit directeur (fix F0) : points 1, 2, 3.
-- ============================================================================
-- Ciqual garantit ses VALEURS nutritionnelles (profil = confiance B), pas notre
-- découpage automatique en concepts/formes/catégories/états. On :
--   1. inscrit le contenu exact de la release F0 dans catalog_release_items ;
--   2. attribue une confiance DISTINCTE à identité/catégorie/états (C/C/D) ;
--   3. conserve les profils nutritionnels Ciqual en confiance B ;
--   4. RÉTRACTE la publication : formes/concepts → candidate, profils dépubliés,
--      release marquée 'retracted', aucun catalogue alimentaire actif.
-- La re-publication passera par une release curée + publish_catalog_release().
-- Idempotent.
-- ============================================================================

-- Les formes F0 = celles ayant un profil nutritionnel Ciqual (data_version 2020-07-07).
CREATE TEMP TABLE _f0_forms ON COMMIT DROP AS
  SELECT DISTINCT p.food_form_id AS id
  FROM catalog.food_nutrition_profiles p
  WHERE p.data_version = '2020-07-07';

CREATE TEMP TABLE _f0_concepts ON COMMIT DROP AS
  SELECT DISTINCT ff.food_concept_id AS id
  FROM catalog.food_forms ff JOIN _f0_forms f ON f.id = ff.id;

-- 1. Contenu exact de la release (traçabilité + rollback).
WITH rel AS (SELECT id FROM ops.catalog_releases WHERE version = 'F0-2020.07.07')
INSERT INTO ops.catalog_release_items (release_id, entity_schema, entity_table, entity_id)
SELECT rel.id, 'catalog', 'food_forms', f.id FROM rel, _f0_forms f
ON CONFLICT DO NOTHING;
WITH rel AS (SELECT id FROM ops.catalog_releases WHERE version = 'F0-2020.07.07')
INSERT INTO ops.catalog_release_items (release_id, entity_schema, entity_table, entity_id)
SELECT rel.id, 'catalog', 'food_concepts', c.id FROM rel, _f0_concepts c
ON CONFLICT DO NOTHING;

-- 2. Confiance granulaire (découpage automatique, à réviser).
UPDATE catalog.food_forms SET identity_confidence = 'C', category_confidence = 'C', state_confidence = 'D'
 WHERE id IN (SELECT id FROM _f0_forms);
UPDATE catalog.food_concepts SET confidence_level = 'C', category_confidence = 'C'
 WHERE id IN (SELECT id FROM _f0_concepts);

-- 3. Les profils nutritionnels Ciqual restent en confiance B (valeur = source fiable).
--    (aucun changement de confidence_level sur food_nutrition_profiles)

-- 4. Rétractation de la publication.
UPDATE catalog.food_forms SET status = 'candidate' WHERE id IN (SELECT id FROM _f0_forms) AND status = 'published';
UPDATE catalog.food_concepts SET status = 'candidate' WHERE id IN (SELECT id FROM _f0_concepts) AND status = 'published';
UPDATE catalog.food_nutrition_profiles SET published_at = NULL WHERE data_version = '2020-07-07';
UPDATE ops.catalog_releases SET status = 'retracted', rolled_back_at = now()
 WHERE version = 'F0-2020.07.07' AND status <> 'retracted';
DELETE FROM ops.active_catalog_release WHERE release_type = 'food';
