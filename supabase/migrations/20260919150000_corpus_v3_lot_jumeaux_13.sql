-- Lot « jumeaux 13 » — cinq recettes neuves, trois rattachements.
--
-- CE QUE CETTE MIGRATION CHARGE. Le lot 2 de l'usine à recettes (plan §5,
-- phase 5) : les jumeaux végétariens des lignées carnées qui n'en avaient pas.
-- Cinq fiches écrites sur dossier de sources — JUM-124 à JUM-128 — et trois
-- recettes qui existaient déjà au corpus et vivaient hors lignée, dont SEUL le
-- `derived_from` change : VAR-035 (Quiche aux poireaux) vers FR-036, RAP-023
-- (Omelette aux champignons) vers DEN-021, FR-027 (Pommes de terre sautées)
-- vers SRC-049.
--
-- POURQUOI UNE MIGRATION À PART, et non une régénération des dix tranches du
-- 17 septembre. Ces tranches sont FIGÉES : `apply-migrations.sh` refuse un
-- fichier dont l'empreinte a changé après enregistrement, et les réécrire
-- arrêterait la release entière par dérive de checksum. Un lot postérieur écrit
-- donc sa propre migration pour les seules recettes qu'il touche — c'est déjà
-- ce que fait 20260918090000 pour les bases partagées.
--
-- CE QU'ELLE ÉCRIT EN BASE, recette par recette, avec l'empreinte que le dépôt
-- calcule pour chacune (`tests/db/corpusParity.test.js` les relit dans CE
-- fichier, et refuse qu'elles s'écartent de la règle du dépôt) :
--   JUM-124 → 09327d2809cf04cc920ec53213391cc2
--   JUM-125 → 3278ba8c9cc7b0f676de982cc0ec6352
--   JUM-126 → 762963512d20dd46d9d53aee3da060c0
--   JUM-127 → 7b3bbba9ce5ec136c6987a6b2a23c45e
--   JUM-128 → 1e397eaf52e17b5f2c94f0970eed758a
--   VAR-035 → ceb9289f4118b8c07fe1254062e400fc
--   RAP-023 → 797843c9add9b5ace0d4f6148c4a9f28
--   FR-027 → 7084d3fdae4bca0c28cac4b43477e61e
--
-- ELLE N'EFFACE AUCUNE VERSION. Les blocs sont ceux que
-- `scripts/data/recipes/build-corpus-v3.mjs` produit pour les tranches :
-- insertion ou mise à jour en place (`ON CONFLICT (recipe_family_id,
-- version_number) DO UPDATE`). Une version garde son identifiant, donc les
-- `culinary.recipe_executions` qui la référencent — et à travers eux les repas
-- déjà planifiés — restent valides.
--
-- VAR-035 EST AUSSI UN PLAT À BASE PARTAGÉE (20260918090000, Pâte brisée de
-- RAP-004). Son bloc réécrit ses composants depuis le corpus, qui porte
-- l'arbitrage : le lien n'est pas perdu. L'ordre chronologique le garantit —
-- cette migration s'applique APRÈS 20260918090000, et c'est elle qui a le
-- dernier mot sur `content_hash`.
--
-- IDEMPOTENTE : un second passage réécrit les mêmes valeurs et ne change rien.
-- À APPLIQUER APRÈS les dix tranches du 17 septembre : les bases dont ces huit
-- recettes dérivent (SRC-009, VAR-001, RAP-042, DEN-017, SRC-021, FR-036,
-- DEN-021, SRC-049) doivent exister pour que `derived_from_version_id` se
-- résolve.

DO $recipe$
DECLARE
  v_family uuid;
  v_version uuid;
  v_component uuid;
  v_missing integer;
  v_static_eligible boolean := true;
BEGIN
  INSERT INTO culinary.recipe_families
    (canonical_name, canonical_name_normalized, culinary_origin, cuisine_origin,
     meal_role, dish_structure, identity_level, sensory_profile,
     status, confidence_level)
  VALUES
    ('Bouchées à la reine aux champignons', 'bouchees a la reine aux champignons', 'France', 'France',
     'meal', 'plat mijoté', 'domestic_standard', 'creamy_savory',
     'candidate', 'B')
  ON CONFLICT (canonical_name_normalized) DO UPDATE SET
    canonical_name = EXCLUDED.canonical_name,
    culinary_origin = EXCLUDED.culinary_origin,
    cuisine_origin = EXCLUDED.cuisine_origin,
    dish_structure = EXCLUDED.dish_structure,
    identity_level = EXCLUDED.identity_level,
    sensory_profile = EXCLUDED.sensory_profile,
    confidence_level = EXCLUDED.confidence_level,
    updated_at = now()
  RETURNING id INTO v_family;

  INSERT INTO culinary.recipe_versions
    (recipe_family_id, version_number, title, short_description, source_dataset_id, source_record_key,
     author_name, source_license, servings, prep_minutes, cook_minutes, difficulty,
     yield_quantity, yield_unit,
     quality_level, publication_status, content_hash,
     sensory_scores, dominant_flavors, aroma_families, target_textures,
     signature_ingredients, identity_guardrails, techniques, variant_candidates,
     allergens, conservation_text, conservation_profile, planning_eligible, eligibility_issues,
     derived_from_version_id, derivation, corpus_poured_on)
  SELECT
    v_family, 3, 'Bouchées à la reine aux champignons', 'La garniture des bouchées à la reine sans poulet ni veau : un kilo de champignons de Paris sautés en plusieurs fournées, liés d''un velouté au lait, au vin blanc et aux jaunes d''œuf.', ds.id, 'JUM-124',
    'Myko', 'editorial', 6, 25, 35, 'moyenne',
    NULL, NULL,
    'B', 'candidate', '09327d2809cf04cc920ec53213391cc2',
    '{"sweet":1,"salty":3,"acidic":1,"bitter":0,"umami":4,"heat":0,"pungency":1,"richness":5,"freshness":1,"intensity":3}'::jsonb, ARRAY['champignon','crème','vin blanc','beurre']::text[],
    ARRAY['beurré','lacté','champignon','épicé doux']::text[], ARRAY['sauce nappante','lamelles de champignon tendres']::text[],
    ARRAY['Champignon de Paris frais','Crème fraîche liquide entière','Jaune d''œuf cru']::text[], ARRAY['Sans la liaison finale au Jaune d''œuf cru et à la Crème fraîche liquide entière, le velouté retombe au rang de béchamel et le plat cesse d''être une sauce à la reine.','Les champignons doivent être sautés en plusieurs fournées et colorés avant d''entrer dans la sauce : jetés crus dans le velouté, ils le délavent de leur eau et la garniture devient grise.','La sauce ne doit jamais bouillir après l''ajout des jaunes, sous peine de grainer irrémédiablement.']::text[],
    ARRAY['sauté','roux','liaison','réduction']::text[], ARRAY['Version aux champignons séchés, d''après marmiton.org : faire tremper 45 g de morilles séchées, les ajouter aux champignons frais et remplacer une partie du lait par l''eau de trempage filtrée.','Version au tofu fumé, d''après chefsimon.com : ajouter 200 g de tofu fumé en dés saisis à part, ce qui rend au plat la protéine que son parent tenait de la volaille.','Version aux tomates séchées, d''après marmiton.org : 40 g de tomates séchées taillées en lanières, ajoutées avec les champignons.']::text[], ARRAY['gluten','lait','œuf','sulfites']::text[],
    'Se garde 2 jours au réfrigérateur à 4 °C en boîte hermétique, la garniture bien refroidie avant fermeture. Réchauffer à feu très doux ou au bain-marie en remuant, sans jamais laisser frémir. La congélation est déconseillée : la liaison jaune d''œuf et crème tranche à la décongélation et les champignons relâchent leur eau.', '{"fridge_hours":48,"eat_immediately":false,"freezable":false,"freezer_months":null,"serve_cold":null,"source":"parsed"}'::jsonb, false, '[]'::jsonb,
    (SELECT base.id FROM culinary.recipe_versions base
       JOIN ops.source_datasets base_ds ON base_ds.id = base.source_dataset_id
      WHERE base_ds.code = 'myko_editorial_v3' AND base.source_record_key = 'SRC-009'), '{}'::jsonb, NULL
  FROM ops.source_datasets ds WHERE ds.code = 'myko_editorial_v3'
  ON CONFLICT (recipe_family_id, version_number) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    source_dataset_id = EXCLUDED.source_dataset_id,
    source_record_key = EXCLUDED.source_record_key,
    servings = EXCLUDED.servings,
    prep_minutes = EXCLUDED.prep_minutes,
    cook_minutes = EXCLUDED.cook_minutes,
    difficulty = EXCLUDED.difficulty,
    yield_quantity = EXCLUDED.yield_quantity,
    yield_unit = EXCLUDED.yield_unit,
    quality_level = EXCLUDED.quality_level,
    publication_status = 'candidate',
    content_hash = EXCLUDED.content_hash,
    sensory_scores = EXCLUDED.sensory_scores,
    dominant_flavors = EXCLUDED.dominant_flavors,
    aroma_families = EXCLUDED.aroma_families,
    target_textures = EXCLUDED.target_textures,
    signature_ingredients = EXCLUDED.signature_ingredients,
    identity_guardrails = EXCLUDED.identity_guardrails,
    techniques = EXCLUDED.techniques,
    variant_candidates = EXCLUDED.variant_candidates,
    allergens = EXCLUDED.allergens,
    conservation_text = EXCLUDED.conservation_text,
    conservation_profile = EXCLUDED.conservation_profile,
    planning_eligible = false,
    eligibility_issues = '[]'::jsonb,
    derived_from_version_id = EXCLUDED.derived_from_version_id,
    derivation = EXCLUDED.derivation,
    -- Le coalesce DANS CET ORDRE, et c'est la règle qui compte : le registre
    -- l'emporte quand il sait, et une date déjà en base n'est JAMAIS effacée
    -- par un registre qui ne sait pas. Un rechargement de corpus ne doit pas
    -- faire disparaître les nouveautés d'un lot passé.
    corpus_poured_on = coalesce(EXCLUDED.corpus_poured_on, culinary.recipe_versions.corpus_poured_on)
  RETURNING id INTO v_version;

  DELETE FROM quality.review_tasks rt
  USING culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version
    AND rt.entity_type = 'recipe_ingredient_requirement'
    AND rt.entity_id = req.id;
  DELETE FROM quality.review_tasks WHERE entity_type = 'recipe_version' AND entity_id = v_version;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id = v_family;

  INSERT INTO culinary.recipe_components (recipe_version_id, name, component_role, position)
  VALUES (v_version, 'plat', 'main', 1)
  RETURNING id INTO v_component;

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'champignon de paris frais' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Champignon de Paris frais', 1050, 'g', 'required',
     'garniture', false, 1);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'lait entier' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Lait entier', 300, 'ml', 'required',
     'liquide', false, 2);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'creme fraiche liquide entiere' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Crème fraîche liquide entière', 200, 'ml', 'required',
     'liaison', false, 3);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'vin blanc sec' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Vin blanc sec', 180, 'ml', 'required',
     'déglaçage', false, 4);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'echalote crue' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Échalote crue', 80, 'g', 'required',
     'aromate', false, 5);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'beurre doux' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Beurre doux', 45, 'g', 'required',
     'matière grasse', false, 6);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'farine de ble t55' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Farine de blé T55', 45, 'g', 'required',
     'liant', false, 7);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'jaune d oeuf cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Jaune d''œuf cru', 2, 'u', 'required',
     'liaison', false, 8);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'persil frais' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Persil frais', 10, 'g', 'required',
     'finition', false, 9);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'sel fin' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Sel fin', 5, 'g', 'required',
     'assaisonnement', false, 10);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'muscade moulue' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Muscade moulue', 1, 'g', 'optional',
     'assaisonnement', true, 11);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'poivre noir moulu' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Poivre noir moulu', 2, 'g', 'optional',
     'assaisonnement', true, 12);

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 1, 'Nettoyer les champignons de Paris à sec, au pinceau ou au torchon, ôter le bout terreux du pied et les tailler en lamelles épaisses. Les répartir en trois tas : une poêle trop chargée les fait bouillir dans leur eau au lieu de les colorer.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 2, 'Chauffer un tiers du beurre à feu vif, jeter le premier tas, attendre deux minutes sans toucher, puis sauter jusqu''à ce que l''eau soit partie et que les bords dorent. Débarrasser et recommencer deux fois. Garder de côté le jus rendu.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 3, 'Baisser le feu, fondre le beurre restant, y suer l''échalote ciselée trois minutes sans coloration. Verser le vin blanc et laisser réduire presque à sec.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 4, 'Poudrer de farine, remuer une minute pour cuire le roux sans le blondir, puis verser le lait en trois fois en fouettant à chaque ajout. Laisser épaissir cinq minutes à petit feu, saler et râper la muscade.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 5, 'Remettre les champignons et leur jus dans le velouté et laisser mijoter dix minutes à découvert, le temps que la sauce reprenne du corps.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 6, 'Hors du feu, délayer les jaunes d''œuf dans la crème, verser en filet dans la garniture en remuant, et réchauffer sans jamais laisser frémir. Rectifier le poivre, parsemer de persil ciselé et garnir aussitôt des croûtes feuilletées tièdes.');

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  SELECT 'recipe_ingredient_requirement', req.id, 'missing_food_form',
         CASE WHEN req.strictness = 'required' THEN 1 ELSE 4 END,
         ARRAY['exact_form_not_in_catalog'],
         jsonb_build_object('recipe_code', 'JUM-124', 'recipe_family', 'Bouchées à la reine aux champignons',
                            'position', req.position, 'strictness', req.strictness),
         'open'
  FROM culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version AND req.preferred_food_form_id IS NULL;

  SELECT count(*) INTO v_missing
  FROM culinary.recipe_ingredient_requirements
  WHERE recipe_version_id = v_version
    AND strictness = 'required'
    AND preferred_food_form_id IS NULL;

  UPDATE culinary.recipe_versions
  SET planning_eligible = v_static_eligible AND v_missing = 0,
      eligibility_issues = CASE WHEN v_missing = 0
        THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object('code', 'unresolved_required_forms', 'count', v_missing))
      END
  WHERE id = v_version;

  IF v_missing > 0 THEN
    INSERT INTO quality.review_tasks
      (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
    VALUES
      ('recipe_version', v_version, 'unresolved_required_ingredient', 1,
       ARRAY['blocking_form_missing'],
       jsonb_build_object('recipe_code', 'JUM-124', 'missing_required_count', v_missing), 'open');
  END IF;

  WITH axis AS (
    INSERT INTO culinary.recipe_variation_axes
      (recipe_family_id, name, selection_mode, required)
    VALUES (v_family, 'Variante culinaire', 'single', false)
    RETURNING id
  )
  INSERT INTO culinary.recipe_variation_options
    (variation_axis_id, name, confidence_level, status)
  SELECT axis.id, variant.name, 'B', 'candidate'
  FROM axis
  CROSS JOIN unnest(ARRAY['Version aux champignons séchés, d''après marmiton.org : faire tremper 45 g de morilles séchées, les ajouter aux champignons frais et remplacer une partie du lait par l''eau de trempage filtrée.','Version au tofu fumé, d''après chefsimon.com : ajouter 200 g de tofu fumé en dés saisis à part, ce qui rend au plat la protéine que son parent tenait de la volaille.','Version aux tomates séchées, d''après marmiton.org : 40 g de tomates séchées taillées en lanières, ajoutées avec les champignons.']::text[]) AS variant(name);

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  VALUES
    ('recipe_version', v_version, 'variant_validation', 5,
     ARRAY['source_backed_variant_needs_test'], '{"recipe_code":"JUM-124","variants":["Version aux champignons séchés, d''après marmiton.org : faire tremper 45 g de morilles séchées, les ajouter aux champignons frais et remplacer une partie du lait par l''eau de trempage filtrée.","Version au tofu fumé, d''après chefsimon.com : ajouter 200 g de tofu fumé en dés saisis à part, ce qui rend au plat la protéine que son parent tenait de la volaille.","Version aux tomates séchées, d''après marmiton.org : 40 g de tomates séchées taillées en lanières, ajoutées avec les champignons."]}'::jsonb, 'open');

  DELETE FROM ops.field_provenance
  WHERE entity_schema = 'culinary' AND entity_table = 'recipe_versions'
    AND entity_id = v_version AND field_name IN ('content', 'sensory_contract');
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name, source_dataset_id,
     source_record_key, normalized_value, transformation_rule, import_run_id, selected)
  SELECT 'culinary', 'recipe_versions', v_version, field_name, ds.id,
         'v3:JUM-124', field_value, transformation_rule, run.id, true
  FROM ops.source_datasets ds
  JOIN LATERAL (
    VALUES
      ('content', to_jsonb('09327d2809cf04cc920ec53213391cc2'::text), 'myko_v3_canonical_recipe'),
      ('sensory_contract', '{"profile":"creamy_savory","scores":{"sweet":1,"salty":3,"acidic":1,"bitter":0,"umami":4,"heat":0,"pungency":1,"richness":5,"freshness":1,"intensity":3},"dominant_flavors":["champignon","crème","vin blanc","beurre"],"aroma_families":["beurré","lacté","champignon","épicé doux"],"target_textures":["sauce nappante","lamelles de champignon tendres"],"signature_ingredients":["Champignon de Paris frais","Crème fraîche liquide entière","Jaune d''œuf cru"],"identity_guardrails":["Sans la liaison finale au Jaune d''œuf cru et à la Crème fraîche liquide entière, le velouté retombe au rang de béchamel et le plat cesse d''être une sauce à la reine.","Les champignons doivent être sautés en plusieurs fournées et colorés avant d''entrer dans la sauce : jetés crus dans le velouté, ils le délavent de leur eau et la garniture devient grise.","La sauce ne doit jamais bouillir après l''ajout des jaunes, sous peine de grainer irrémédiablement."]}'::jsonb, 'myko_v3_sensory_contract')
  ) AS provenance(field_name, field_value, transformation_rule) ON true
  JOIN LATERAL (
    SELECT id FROM ops.import_runs WHERE configuration_hash = '2df664ad1934cc7be1a4b1a4c06cf79d' LIMIT 1
  ) run ON true
  WHERE ds.code = 'myko_editorial_v3';
END
$recipe$;
DO $recipe$
DECLARE
  v_family uuid;
  v_version uuid;
  v_component uuid;
  v_missing integer;
  v_static_eligible boolean := true;
BEGIN
  INSERT INTO culinary.recipe_families
    (canonical_name, canonical_name_normalized, culinary_origin, cuisine_origin,
     meal_role, dish_structure, identity_level, sensory_profile,
     status, confidence_level)
  VALUES
    ('Risotto au safran', 'risotto au safran', 'Italie', 'Italie',
     'meal', 'risotto', 'named_traditional_dish', 'creamy_aromatic',
     'candidate', 'B')
  ON CONFLICT (canonical_name_normalized) DO UPDATE SET
    canonical_name = EXCLUDED.canonical_name,
    culinary_origin = EXCLUDED.culinary_origin,
    cuisine_origin = EXCLUDED.cuisine_origin,
    dish_structure = EXCLUDED.dish_structure,
    identity_level = EXCLUDED.identity_level,
    sensory_profile = EXCLUDED.sensory_profile,
    confidence_level = EXCLUDED.confidence_level,
    updated_at = now()
  RETURNING id INTO v_family;

  INSERT INTO culinary.recipe_versions
    (recipe_family_id, version_number, title, short_description, source_dataset_id, source_record_key,
     author_name, source_license, servings, prep_minutes, cook_minutes, difficulty,
     yield_quantity, yield_unit,
     quality_level, publication_status, content_hash,
     sensory_scores, dominant_flavors, aroma_families, target_textures,
     signature_ingredients, identity_guardrails, techniques, variant_candidates,
     allergens, conservation_text, conservation_profile, planning_eligible, eligibility_issues,
     derived_from_version_id, derivation, corpus_poured_on)
  SELECT
    v_family, 3, 'Risotto au safran', 'Le milanais mouillé au bouillon de légumes : riz arborio nacré, safran infusé à part, monté hors du feu au beurre froid et au parmesan.', ds.id, 'JUM-125',
    'Myko', 'editorial', 4, 15, 25, 'moyenne',
    NULL, NULL,
    'B', 'candidate', '3278ba8c9cc7b0f676de982cc0ec6352',
    '{"sweet":1,"salty":3,"acidic":1,"bitter":1,"umami":4,"heat":0,"pungency":0,"richness":4,"freshness":1,"intensity":3}'::jsonb, ARRAY['safran','parmesan','beurre','vin blanc']::text[],
    ARRAY['safrané','lacté','beurré']::text[], ARRAY['grain al dente','onde crémeuse']::text[],
    ARRAY['Safran','Riz arborio cru','Parmesan affiné']::text[], ARRAY['Le safran doit être infusé dans du bouillon chaud avant d''entrer dans le riz : jeté sec en fin de cuisson il colore à peine et ne parfume pas.','Le beurre de finition s''incorpore HORS du feu et bien froid : c''est la mantecatura, et c''est elle qui fait l''onde crémeuse ; fondu dans la casserole chaude il rend une matière grasse séparée.','Le bouillon doit être de légumes et non de volaille — c''est la seule chose qui sépare ce plat de sa base, et l''oublier le lui rendrait.']::text[],
    ARRAY['nacrage','mouillement progressif','infusion','mantecatura']::text[], ARRAY['Version aux champignons, d''après 750g.com : 200 g de champignons de Paris sautés à part et ajoutés à la mantecatura.','Version crémée, d''après chefsimon.com et 750g.com : remplacer un tiers du beurre de finition par de la crème épaisse ou du mascarpone.','Version aux tomates séchées, d''après chefsimon.com : un bocal de tomates séchées taillées en lanières, ajoutées aux deux tiers de la cuisson.']::text[], ARRAY['lait','sulfites']::text[],
    'Se mange dans les minutes qui suivent : le grain continue d''absorber et un risotto attendu devient compact. Les restes se gardent 2 jours au réfrigérateur en récipient fermé et ne se réchauffent pas tels quels — les étaler en galettes, les paner et les poêler donne des arancini, seul usage honnête du lendemain. Ne se congèle pas : le grain se délite au dégel.', '{"fridge_hours":48,"eat_immediately":true,"freezable":false,"freezer_months":null,"serve_cold":null,"source":"parsed"}'::jsonb, false, '[]'::jsonb,
    (SELECT base.id FROM culinary.recipe_versions base
       JOIN ops.source_datasets base_ds ON base_ds.id = base.source_dataset_id
      WHERE base_ds.code = 'myko_editorial_v3' AND base.source_record_key = 'VAR-001'), '{}'::jsonb, NULL
  FROM ops.source_datasets ds WHERE ds.code = 'myko_editorial_v3'
  ON CONFLICT (recipe_family_id, version_number) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    source_dataset_id = EXCLUDED.source_dataset_id,
    source_record_key = EXCLUDED.source_record_key,
    servings = EXCLUDED.servings,
    prep_minutes = EXCLUDED.prep_minutes,
    cook_minutes = EXCLUDED.cook_minutes,
    difficulty = EXCLUDED.difficulty,
    yield_quantity = EXCLUDED.yield_quantity,
    yield_unit = EXCLUDED.yield_unit,
    quality_level = EXCLUDED.quality_level,
    publication_status = 'candidate',
    content_hash = EXCLUDED.content_hash,
    sensory_scores = EXCLUDED.sensory_scores,
    dominant_flavors = EXCLUDED.dominant_flavors,
    aroma_families = EXCLUDED.aroma_families,
    target_textures = EXCLUDED.target_textures,
    signature_ingredients = EXCLUDED.signature_ingredients,
    identity_guardrails = EXCLUDED.identity_guardrails,
    techniques = EXCLUDED.techniques,
    variant_candidates = EXCLUDED.variant_candidates,
    allergens = EXCLUDED.allergens,
    conservation_text = EXCLUDED.conservation_text,
    conservation_profile = EXCLUDED.conservation_profile,
    planning_eligible = false,
    eligibility_issues = '[]'::jsonb,
    derived_from_version_id = EXCLUDED.derived_from_version_id,
    derivation = EXCLUDED.derivation,
    -- Le coalesce DANS CET ORDRE, et c'est la règle qui compte : le registre
    -- l'emporte quand il sait, et une date déjà en base n'est JAMAIS effacée
    -- par un registre qui ne sait pas. Un rechargement de corpus ne doit pas
    -- faire disparaître les nouveautés d'un lot passé.
    corpus_poured_on = coalesce(EXCLUDED.corpus_poured_on, culinary.recipe_versions.corpus_poured_on)
  RETURNING id INTO v_version;

  DELETE FROM quality.review_tasks rt
  USING culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version
    AND rt.entity_type = 'recipe_ingredient_requirement'
    AND rt.entity_id = req.id;
  DELETE FROM quality.review_tasks WHERE entity_type = 'recipe_version' AND entity_id = v_version;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id = v_family;

  INSERT INTO culinary.recipe_components (recipe_version_id, name, component_role, position)
  VALUES (v_version, 'plat', 'main', 1)
  RETURNING id INTO v_component;

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'riz arborio cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Riz arborio cru', 250, 'g', 'required',
     'féculent', false, 1);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'bouillon de legumes' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Bouillon de légumes', 1000, 'ml', 'required',
     'mouillement', false, 2);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'vin blanc sec' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Vin blanc sec', 150, 'ml', 'required',
     'déglaçage', false, 3);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'oignon jaune cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Oignon jaune cru', 130, 'g', 'required',
     'base aromatique', false, 4);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'parmesan affine' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Parmesan affiné', 45, 'g', 'required',
     'finition', false, 5);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'beurre doux' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Beurre doux', 40, 'g', 'required',
     'liaison', false, 6);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'huile d olive vierge extra' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Huile d''olive vierge extra', 30, 'ml', 'required',
     'cuisson', false, 7);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'safran' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Safran', 1, 'g', 'required',
     'épice', false, 8);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'sel fin' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Sel fin', 6, 'g', 'required',
     'assaisonnement', false, 9);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'poivre noir moulu' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Poivre noir moulu', 1, 'g', 'required',
     'assaisonnement', false, 10);

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 1, 'Porter le bouillon de légumes à frémissement et l''y maintenir toute la cuisson : un mouillement froid arrête le grain à chaque louche et le risotto met deux fois plus de temps.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 2, 'Prélever une louche de bouillon chaud, y écraser le safran et laisser infuser dix minutes. C''est cette infusion, et non la poudre jetée sèche en fin de cuisson, qui donne au plat sa couleur et son parfum.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 3, 'Suer l''oignon ciselé très fin dans l''huile d''olive et la moitié du beurre, à feu doux, sans lui laisser prendre couleur. Verser le riz et le nacrer deux minutes, en le retournant sans cesse : il est prêt quand le bord de chaque grain devient translucide et que le cœur reste blanc.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 4, 'Déglacer au vin blanc, laisser évaporer entièrement, puis mouiller louche à louche : on n''ajoute la suivante que lorsque la précédente est absorbée. Compter dix-huit minutes, en versant l''infusion de safran à mi-parcours.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 5, 'Hors du feu, incorporer le beurre restant bien froid et le parmesan en battant à la cuillère de bois. Couvrir deux minutes, rectifier sel et poivre : le risotto doit couler lentement quand on incline l''assiette.');

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  SELECT 'recipe_ingredient_requirement', req.id, 'missing_food_form',
         CASE WHEN req.strictness = 'required' THEN 1 ELSE 4 END,
         ARRAY['exact_form_not_in_catalog'],
         jsonb_build_object('recipe_code', 'JUM-125', 'recipe_family', 'Risotto au safran',
                            'position', req.position, 'strictness', req.strictness),
         'open'
  FROM culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version AND req.preferred_food_form_id IS NULL;

  SELECT count(*) INTO v_missing
  FROM culinary.recipe_ingredient_requirements
  WHERE recipe_version_id = v_version
    AND strictness = 'required'
    AND preferred_food_form_id IS NULL;

  UPDATE culinary.recipe_versions
  SET planning_eligible = v_static_eligible AND v_missing = 0,
      eligibility_issues = CASE WHEN v_missing = 0
        THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object('code', 'unresolved_required_forms', 'count', v_missing))
      END
  WHERE id = v_version;

  IF v_missing > 0 THEN
    INSERT INTO quality.review_tasks
      (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
    VALUES
      ('recipe_version', v_version, 'unresolved_required_ingredient', 1,
       ARRAY['blocking_form_missing'],
       jsonb_build_object('recipe_code', 'JUM-125', 'missing_required_count', v_missing), 'open');
  END IF;

  WITH axis AS (
    INSERT INTO culinary.recipe_variation_axes
      (recipe_family_id, name, selection_mode, required)
    VALUES (v_family, 'Variante culinaire', 'single', false)
    RETURNING id
  )
  INSERT INTO culinary.recipe_variation_options
    (variation_axis_id, name, confidence_level, status)
  SELECT axis.id, variant.name, 'B', 'candidate'
  FROM axis
  CROSS JOIN unnest(ARRAY['Version aux champignons, d''après 750g.com : 200 g de champignons de Paris sautés à part et ajoutés à la mantecatura.','Version crémée, d''après chefsimon.com et 750g.com : remplacer un tiers du beurre de finition par de la crème épaisse ou du mascarpone.','Version aux tomates séchées, d''après chefsimon.com : un bocal de tomates séchées taillées en lanières, ajoutées aux deux tiers de la cuisson.']::text[]) AS variant(name);

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  VALUES
    ('recipe_version', v_version, 'variant_validation', 5,
     ARRAY['source_backed_variant_needs_test'], '{"recipe_code":"JUM-125","variants":["Version aux champignons, d''après 750g.com : 200 g de champignons de Paris sautés à part et ajoutés à la mantecatura.","Version crémée, d''après chefsimon.com et 750g.com : remplacer un tiers du beurre de finition par de la crème épaisse ou du mascarpone.","Version aux tomates séchées, d''après chefsimon.com : un bocal de tomates séchées taillées en lanières, ajoutées aux deux tiers de la cuisson."]}'::jsonb, 'open');

  DELETE FROM ops.field_provenance
  WHERE entity_schema = 'culinary' AND entity_table = 'recipe_versions'
    AND entity_id = v_version AND field_name IN ('content', 'sensory_contract');
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name, source_dataset_id,
     source_record_key, normalized_value, transformation_rule, import_run_id, selected)
  SELECT 'culinary', 'recipe_versions', v_version, field_name, ds.id,
         'v3:JUM-125', field_value, transformation_rule, run.id, true
  FROM ops.source_datasets ds
  JOIN LATERAL (
    VALUES
      ('content', to_jsonb('3278ba8c9cc7b0f676de982cc0ec6352'::text), 'myko_v3_canonical_recipe'),
      ('sensory_contract', '{"profile":"creamy_aromatic","scores":{"sweet":1,"salty":3,"acidic":1,"bitter":1,"umami":4,"heat":0,"pungency":0,"richness":4,"freshness":1,"intensity":3},"dominant_flavors":["safran","parmesan","beurre","vin blanc"],"aroma_families":["safrané","lacté","beurré"],"target_textures":["grain al dente","onde crémeuse"],"signature_ingredients":["Safran","Riz arborio cru","Parmesan affiné"],"identity_guardrails":["Le safran doit être infusé dans du bouillon chaud avant d''entrer dans le riz : jeté sec en fin de cuisson il colore à peine et ne parfume pas.","Le beurre de finition s''incorpore HORS du feu et bien froid : c''est la mantecatura, et c''est elle qui fait l''onde crémeuse ; fondu dans la casserole chaude il rend une matière grasse séparée.","Le bouillon doit être de légumes et non de volaille — c''est la seule chose qui sépare ce plat de sa base, et l''oublier le lui rendrait."]}'::jsonb, 'myko_v3_sensory_contract')
  ) AS provenance(field_name, field_value, transformation_rule) ON true
  JOIN LATERAL (
    SELECT id FROM ops.import_runs WHERE configuration_hash = '2df664ad1934cc7be1a4b1a4c06cf79d' LIMIT 1
  ) run ON true
  WHERE ds.code = 'myko_editorial_v3';
END
$recipe$;
DO $recipe$
DECLARE
  v_family uuid;
  v_version uuid;
  v_component uuid;
  v_missing integer;
  v_static_eligible boolean := true;
BEGIN
  INSERT INTO culinary.recipe_families
    (canonical_name, canonical_name_normalized, culinary_origin, cuisine_origin,
     meal_role, dish_structure, identity_level, sensory_profile,
     status, confidence_level)
  VALUES
    ('Nouilles sautées au tofu et aux légumes', 'nouilles sautees au tofu et aux legumes', 'Chine / cuisine domestique internationale', 'Chine / cuisine domestique internationale',
     'meal', 'nouilles sautées', 'domestic_standard', 'savory_umami',
     'candidate', 'B')
  ON CONFLICT (canonical_name_normalized) DO UPDATE SET
    canonical_name = EXCLUDED.canonical_name,
    culinary_origin = EXCLUDED.culinary_origin,
    cuisine_origin = EXCLUDED.cuisine_origin,
    dish_structure = EXCLUDED.dish_structure,
    identity_level = EXCLUDED.identity_level,
    sensory_profile = EXCLUDED.sensory_profile,
    confidence_level = EXCLUDED.confidence_level,
    updated_at = now()
  RETURNING id INTO v_family;

  INSERT INTO culinary.recipe_versions
    (recipe_family_id, version_number, title, short_description, source_dataset_id, source_record_key,
     author_name, source_license, servings, prep_minutes, cook_minutes, difficulty,
     yield_quantity, yield_unit,
     quality_level, publication_status, content_hash,
     sensory_scores, dominant_flavors, aroma_families, target_textures,
     signature_ingredients, identity_guardrails, techniques, variant_candidates,
     allergens, conservation_text, conservation_profile, planning_eligible, eligibility_issues,
     derived_from_version_id, derivation, corpus_poured_on)
  SELECT
    v_family, 3, 'Nouilles sautées au tofu et aux légumes', 'Le wok de nouilles du parent avec du tofu fumé à la place du poulet et sans sauce poisson : brocoli, carotte et poireau saisis croquants, laqués à la sauce soja et au sésame.', ds.id, 'JUM-126',
    'Myko', 'editorial', 4, 15, 15, 'facile',
    NULL, NULL,
    'B', 'candidate', '762963512d20dd46d9d53aee3da060c0',
    '{"sweet":2,"salty":4,"acidic":0,"bitter":1,"umami":4,"heat":0,"pungency":2,"richness":2,"freshness":2,"intensity":3}'::jsonb, ARRAY['soja','sésame grillé','gingembre','tofu fumé']::text[],
    ARRAY['grillé','fumé','piquant frais']::text[], ARRAY['nouilles souples','légumes croquants','cubes de tofu dorés']::text[],
    ARRAY['Tofu fumé','Sauce soja','Huile de sésame grillé']::text[], ARRAY['Le tofu doit être pressé puis saisi à part et remis en fin de cuisson : mélangé cru aux légumes il s''effrite et le plat devient une bouillie.','Les légumes restent croquants — c''est un sauté, pas un mijoté : dès qu''ils rendent leur eau, les nouilles collent et le laquage tourne en sauce.','L''huile de sésame grillé s''ajoute HORS du feu : chauffée, elle perd son parfum et devient amère.']::text[],
    ARRAY['sauté au wok','saisie','blanchiment']::text[], ARRAY['Version aux pousses de bambou et haricots mungo, d''après 750g.com : 230 g de pousses de bambou égouttées et 100 g de haricots mungo ajoutés avec les nouilles.','Version aux champignons, d''après chefsimon.com : 200 g de shiitakés ou de pleurotes saisis avec le tofu.','Version relevée, d''après chefsimon.com : une cuillerée de sriracha dans la sauce soja et un jus de citron vert au service.']::text[], ARRAY['gluten','soja','sésame','œuf']::text[],
    'Se garde 2 jours au réfrigérateur et se réchauffe correctement à la poêle très chaude, avec une cuillerée d''eau. Il se mange aussi froid, en salade de nouilles, avec un trait de citron vert. Ne se congèle pas : les nouilles se défont au dégel et le tofu devient spongieux.', '{"fridge_hours":48,"eat_immediately":false,"freezable":false,"freezer_months":null,"serve_cold":null,"source":"parsed"}'::jsonb, false, '[]'::jsonb,
    (SELECT base.id FROM culinary.recipe_versions base
       JOIN ops.source_datasets base_ds ON base_ds.id = base.source_dataset_id
      WHERE base_ds.code = 'myko_editorial_v3' AND base.source_record_key = 'RAP-042'), '{}'::jsonb, NULL
  FROM ops.source_datasets ds WHERE ds.code = 'myko_editorial_v3'
  ON CONFLICT (recipe_family_id, version_number) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    source_dataset_id = EXCLUDED.source_dataset_id,
    source_record_key = EXCLUDED.source_record_key,
    servings = EXCLUDED.servings,
    prep_minutes = EXCLUDED.prep_minutes,
    cook_minutes = EXCLUDED.cook_minutes,
    difficulty = EXCLUDED.difficulty,
    yield_quantity = EXCLUDED.yield_quantity,
    yield_unit = EXCLUDED.yield_unit,
    quality_level = EXCLUDED.quality_level,
    publication_status = 'candidate',
    content_hash = EXCLUDED.content_hash,
    sensory_scores = EXCLUDED.sensory_scores,
    dominant_flavors = EXCLUDED.dominant_flavors,
    aroma_families = EXCLUDED.aroma_families,
    target_textures = EXCLUDED.target_textures,
    signature_ingredients = EXCLUDED.signature_ingredients,
    identity_guardrails = EXCLUDED.identity_guardrails,
    techniques = EXCLUDED.techniques,
    variant_candidates = EXCLUDED.variant_candidates,
    allergens = EXCLUDED.allergens,
    conservation_text = EXCLUDED.conservation_text,
    conservation_profile = EXCLUDED.conservation_profile,
    planning_eligible = false,
    eligibility_issues = '[]'::jsonb,
    derived_from_version_id = EXCLUDED.derived_from_version_id,
    derivation = EXCLUDED.derivation,
    -- Le coalesce DANS CET ORDRE, et c'est la règle qui compte : le registre
    -- l'emporte quand il sait, et une date déjà en base n'est JAMAIS effacée
    -- par un registre qui ne sait pas. Un rechargement de corpus ne doit pas
    -- faire disparaître les nouveautés d'un lot passé.
    corpus_poured_on = coalesce(EXCLUDED.corpus_poured_on, culinary.recipe_versions.corpus_poured_on)
  RETURNING id INTO v_version;

  DELETE FROM quality.review_tasks rt
  USING culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version
    AND rt.entity_type = 'recipe_ingredient_requirement'
    AND rt.entity_id = req.id;
  DELETE FROM quality.review_tasks WHERE entity_type = 'recipe_version' AND entity_id = v_version;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id = v_family;

  INSERT INTO culinary.recipe_components (recipe_version_id, name, component_role, position)
  VALUES (v_version, 'plat', 'main', 1)
  RETURNING id INTO v_component;

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'brocoli cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Brocoli cru', 500, 'g', 'required',
     'légume', false, 1);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'tofu fume' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Tofu fumé', 400, 'g', 'required',
     'protéine', false, 2);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'nouille de ble chinoise seche' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Nouille de blé chinoise sèche', 250, 'g', 'required',
     'féculent', false, 3);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'carotte crue' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Carotte crue', 240, 'g', 'required',
     'légume', false, 4);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'poireau cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Poireau cru', 150, 'g', 'required',
     'légume', false, 5);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'oignon jaune cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Oignon jaune cru', 120, 'g', 'required',
     'aromatique', false, 6);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'sauce soja' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Sauce soja', 75, 'ml', 'required',
     'assaisonnement', false, 7);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'huile d olive vierge extra' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Huile d''olive vierge extra', 30, 'ml', 'required',
     'cuisson', false, 8);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'ail cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Ail cru', 15, 'g', 'required',
     'aromatique', false, 9);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'gingembre frais' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Gingembre frais', 15, 'g', 'required',
     'aromatique', false, 10);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'huile de sesame grille' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Huile de sésame grillé', 10, 'ml', 'required',
     'finition', false, 11);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'coriandre fraiche' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Coriandre fraîche', 10, 'g', 'required',
     'aromate', false, 12);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'sucre semoule' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Sucre semoule', 10, 'g', 'required',
     'équilibre', false, 13);

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 1, 'Égoutter le tofu fumé, le presser dix minutes entre deux torchons sous une assiette lestée, puis le tailler en cubes de deux centimètres. Un tofu mal essoré ne dore pas, il vapeur.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 2, 'Détailler le brocoli en petits bouquets, la carotte en rondelles biseautées de trois millimètres, le poireau en tronçons de trois centimètres fendus en deux, l''oignon en lamelles. Hacher l''ail et le gingembre séparément.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 3, 'Cuire les nouilles une minute de moins que le temps indiqué sur le paquet, les rafraîchir sous l''eau froide, les égoutter à fond et les huiler d''un filet pour qu''elles ne se collent pas pendant le reste.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 4, 'Saisir les cubes de tofu à feu vif dans la moitié de l''huile d''olive jusqu''à ce que trois faces soient dorées, les réserver. Dans le même wok, jeter carotte et brocoli deux minutes, ajouter poireau et oignon deux minutes de plus : les légumes doivent rester fermes sous la dent.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 5, 'Remettre le tofu, ajouter l''ail, le gingembre et le sucre, faire sauter trente secondes, puis verser les nouilles et la sauce soja. Mélanger vivement une minute pour que tout se laque, terminer hors du feu par l''huile de sésame et la coriandre ciselée.');

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  SELECT 'recipe_ingredient_requirement', req.id, 'missing_food_form',
         CASE WHEN req.strictness = 'required' THEN 1 ELSE 4 END,
         ARRAY['exact_form_not_in_catalog'],
         jsonb_build_object('recipe_code', 'JUM-126', 'recipe_family', 'Nouilles sautées au tofu et aux légumes',
                            'position', req.position, 'strictness', req.strictness),
         'open'
  FROM culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version AND req.preferred_food_form_id IS NULL;

  SELECT count(*) INTO v_missing
  FROM culinary.recipe_ingredient_requirements
  WHERE recipe_version_id = v_version
    AND strictness = 'required'
    AND preferred_food_form_id IS NULL;

  UPDATE culinary.recipe_versions
  SET planning_eligible = v_static_eligible AND v_missing = 0,
      eligibility_issues = CASE WHEN v_missing = 0
        THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object('code', 'unresolved_required_forms', 'count', v_missing))
      END
  WHERE id = v_version;

  IF v_missing > 0 THEN
    INSERT INTO quality.review_tasks
      (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
    VALUES
      ('recipe_version', v_version, 'unresolved_required_ingredient', 1,
       ARRAY['blocking_form_missing'],
       jsonb_build_object('recipe_code', 'JUM-126', 'missing_required_count', v_missing), 'open');
  END IF;

  WITH axis AS (
    INSERT INTO culinary.recipe_variation_axes
      (recipe_family_id, name, selection_mode, required)
    VALUES (v_family, 'Variante culinaire', 'single', false)
    RETURNING id
  )
  INSERT INTO culinary.recipe_variation_options
    (variation_axis_id, name, confidence_level, status)
  SELECT axis.id, variant.name, 'B', 'candidate'
  FROM axis
  CROSS JOIN unnest(ARRAY['Version aux pousses de bambou et haricots mungo, d''après 750g.com : 230 g de pousses de bambou égouttées et 100 g de haricots mungo ajoutés avec les nouilles.','Version aux champignons, d''après chefsimon.com : 200 g de shiitakés ou de pleurotes saisis avec le tofu.','Version relevée, d''après chefsimon.com : une cuillerée de sriracha dans la sauce soja et un jus de citron vert au service.']::text[]) AS variant(name);

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  VALUES
    ('recipe_version', v_version, 'variant_validation', 5,
     ARRAY['source_backed_variant_needs_test'], '{"recipe_code":"JUM-126","variants":["Version aux pousses de bambou et haricots mungo, d''après 750g.com : 230 g de pousses de bambou égouttées et 100 g de haricots mungo ajoutés avec les nouilles.","Version aux champignons, d''après chefsimon.com : 200 g de shiitakés ou de pleurotes saisis avec le tofu.","Version relevée, d''après chefsimon.com : une cuillerée de sriracha dans la sauce soja et un jus de citron vert au service."]}'::jsonb, 'open');

  DELETE FROM ops.field_provenance
  WHERE entity_schema = 'culinary' AND entity_table = 'recipe_versions'
    AND entity_id = v_version AND field_name IN ('content', 'sensory_contract');
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name, source_dataset_id,
     source_record_key, normalized_value, transformation_rule, import_run_id, selected)
  SELECT 'culinary', 'recipe_versions', v_version, field_name, ds.id,
         'v3:JUM-126', field_value, transformation_rule, run.id, true
  FROM ops.source_datasets ds
  JOIN LATERAL (
    VALUES
      ('content', to_jsonb('762963512d20dd46d9d53aee3da060c0'::text), 'myko_v3_canonical_recipe'),
      ('sensory_contract', '{"profile":"savory_umami","scores":{"sweet":2,"salty":4,"acidic":0,"bitter":1,"umami":4,"heat":0,"pungency":2,"richness":2,"freshness":2,"intensity":3},"dominant_flavors":["soja","sésame grillé","gingembre","tofu fumé"],"aroma_families":["grillé","fumé","piquant frais"],"target_textures":["nouilles souples","légumes croquants","cubes de tofu dorés"],"signature_ingredients":["Tofu fumé","Sauce soja","Huile de sésame grillé"],"identity_guardrails":["Le tofu doit être pressé puis saisi à part et remis en fin de cuisson : mélangé cru aux légumes il s''effrite et le plat devient une bouillie.","Les légumes restent croquants — c''est un sauté, pas un mijoté : dès qu''ils rendent leur eau, les nouilles collent et le laquage tourne en sauce.","L''huile de sésame grillé s''ajoute HORS du feu : chauffée, elle perd son parfum et devient amère."]}'::jsonb, 'myko_v3_sensory_contract')
  ) AS provenance(field_name, field_value, transformation_rule) ON true
  JOIN LATERAL (
    SELECT id FROM ops.import_runs WHERE configuration_hash = '2df664ad1934cc7be1a4b1a4c06cf79d' LIMIT 1
  ) run ON true
  WHERE ds.code = 'myko_editorial_v3';
END
$recipe$;
DO $recipe$
DECLARE
  v_family uuid;
  v_version uuid;
  v_component uuid;
  v_missing integer;
  v_static_eligible boolean := true;
BEGIN
  INSERT INTO culinary.recipe_families
    (canonical_name, canonical_name_normalized, culinary_origin, cuisine_origin,
     meal_role, dish_structure, identity_level, sensory_profile,
     status, confidence_level)
  VALUES
    ('Ragoût de pois chiches à la tomate', 'ragout de pois chiches a la tomate', 'Maghreb / cuisine domestique adaptée', 'Maghreb / cuisine domestique adaptée',
     'meal', 'plat complet mijoté', 'domestic_standard', 'earthy_tomato',
     'candidate', 'B')
  ON CONFLICT (canonical_name_normalized) DO UPDATE SET
    canonical_name = EXCLUDED.canonical_name,
    culinary_origin = EXCLUDED.culinary_origin,
    cuisine_origin = EXCLUDED.cuisine_origin,
    dish_structure = EXCLUDED.dish_structure,
    identity_level = EXCLUDED.identity_level,
    sensory_profile = EXCLUDED.sensory_profile,
    confidence_level = EXCLUDED.confidence_level,
    updated_at = now()
  RETURNING id INTO v_family;

  INSERT INTO culinary.recipe_versions
    (recipe_family_id, version_number, title, short_description, source_dataset_id, source_record_key,
     author_name, source_license, servings, prep_minutes, cook_minutes, difficulty,
     yield_quantity, yield_unit,
     quality_level, publication_status, content_hash,
     sensory_scores, dominant_flavors, aroma_families, target_textures,
     signature_ingredients, identity_guardrails, techniques, variant_candidates,
     allergens, conservation_text, conservation_profile, planning_eligible, eligibility_issues,
     derived_from_version_id, derivation, corpus_poured_on)
  SELECT
    v_family, 3, 'Ragoût de pois chiches à la tomate', 'Le mijoté de pois chiches du parent sans le poulet : double ration de légumineuse, tomate concassée compotée et une pointe de cannelle, lié en écrasant une louche de grains.', ds.id, 'JUM-127',
    'Myko', 'editorial', 4, 15, 45, 'facile',
    NULL, NULL,
    'B', 'candidate', '7b3bbba9ce5ec136c6987a6b2a23c45e',
    '{"sweet":2,"salty":2,"acidic":2,"bitter":0,"umami":3,"heat":0,"pungency":1,"richness":2,"freshness":1,"intensity":3}'::jsonb, ARRAY['pois chiche','tomate','cannelle','oignon fondu']::text[],
    ARRAY['épicé doux','tomate cuite','légumineuse']::text[], ARRAY['grains fondants','sauce nappante']::text[],
    ARRAY['Pois chiche cuit, égoutté','Tomate concassée en conserve','Cannelle moulue']::text[], ARRAY['La tomate doit compoter seule avant l''arrivée du bouillon : versée en même temps, elle reste acide et le ragoût garde un goût de conserve.','La liaison se fait en écrasant une louche de pois chiches, jamais à la farine : c''est ce qui donne au plat sa texture sans lui ajouter un féculent qu''il n''a pas.','La cannelle est ce qui rattache ce ragoût au mijoté maghrébin dont il dérive ; la retirer en fait un plat de légumineuse méditerranéen sans identité.']::text[],
    ARRAY['compotage','mijotage','liaison par écrasement']::text[], ARRAY['Version aux légumes racines, d''après chefsimon.com : une carotte, un navet, une branche de céleri et un morceau de fenouil taillés en dés, ajoutés avec l''oignon.','Version cuminée, d''après chefsimon.com : remplacer la cannelle par une demi-cuillerée à café de cumin et une pointe de piment d''Espelette.','Version à l''œuf dur et au pain frit, d''après marmiton.org : un œuf dur écrasé et une tranche de pain frite mixée, incorporés en fin de cuisson comme liant.']::text[], ARRAY[]::text[],
    'Se garde 4 jours au réfrigérateur entre 0 et 4 °C et se bonifie au repos, les pois chiches continuant d''absorber la sauce. Se congèle 3 mois en portions ; ajouter une cuillerée d''eau ou de bouillon au réchauffage, le ragoût ayant encore épaissi.', '{"fridge_hours":96,"eat_immediately":false,"freezable":true,"freezer_months":3,"serve_cold":null,"source":"parsed"}'::jsonb, false, '[]'::jsonb,
    (SELECT base.id FROM culinary.recipe_versions base
       JOIN ops.source_datasets base_ds ON base_ds.id = base.source_dataset_id
      WHERE base_ds.code = 'myko_editorial_v3' AND base.source_record_key = 'DEN-017'), '{}'::jsonb, NULL
  FROM ops.source_datasets ds WHERE ds.code = 'myko_editorial_v3'
  ON CONFLICT (recipe_family_id, version_number) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    source_dataset_id = EXCLUDED.source_dataset_id,
    source_record_key = EXCLUDED.source_record_key,
    servings = EXCLUDED.servings,
    prep_minutes = EXCLUDED.prep_minutes,
    cook_minutes = EXCLUDED.cook_minutes,
    difficulty = EXCLUDED.difficulty,
    yield_quantity = EXCLUDED.yield_quantity,
    yield_unit = EXCLUDED.yield_unit,
    quality_level = EXCLUDED.quality_level,
    publication_status = 'candidate',
    content_hash = EXCLUDED.content_hash,
    sensory_scores = EXCLUDED.sensory_scores,
    dominant_flavors = EXCLUDED.dominant_flavors,
    aroma_families = EXCLUDED.aroma_families,
    target_textures = EXCLUDED.target_textures,
    signature_ingredients = EXCLUDED.signature_ingredients,
    identity_guardrails = EXCLUDED.identity_guardrails,
    techniques = EXCLUDED.techniques,
    variant_candidates = EXCLUDED.variant_candidates,
    allergens = EXCLUDED.allergens,
    conservation_text = EXCLUDED.conservation_text,
    conservation_profile = EXCLUDED.conservation_profile,
    planning_eligible = false,
    eligibility_issues = '[]'::jsonb,
    derived_from_version_id = EXCLUDED.derived_from_version_id,
    derivation = EXCLUDED.derivation,
    -- Le coalesce DANS CET ORDRE, et c'est la règle qui compte : le registre
    -- l'emporte quand il sait, et une date déjà en base n'est JAMAIS effacée
    -- par un registre qui ne sait pas. Un rechargement de corpus ne doit pas
    -- faire disparaître les nouveautés d'un lot passé.
    corpus_poured_on = coalesce(EXCLUDED.corpus_poured_on, culinary.recipe_versions.corpus_poured_on)
  RETURNING id INTO v_version;

  DELETE FROM quality.review_tasks rt
  USING culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version
    AND rt.entity_type = 'recipe_ingredient_requirement'
    AND rt.entity_id = req.id;
  DELETE FROM quality.review_tasks WHERE entity_type = 'recipe_version' AND entity_id = v_version;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id = v_family;

  INSERT INTO culinary.recipe_components (recipe_version_id, name, component_role, position)
  VALUES (v_version, 'plat', 'main', 1)
  RETURNING id INTO v_component;

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'pois chiche cuit egoutte' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Pois chiche cuit, égoutté', 500, 'g', 'required',
     'légumineuse', false, 1);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'tomate concassee en conserve' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Tomate concassée en conserve', 400, 'g', 'required',
     'sauce', false, 2);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'bouillon de legumes' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Bouillon de légumes', 300, 'ml', 'required',
     'mouillement', false, 3);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'poivron rouge frais' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Poivron rouge frais', 150, 'g', 'required',
     'légume', false, 4);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'oignon jaune cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Oignon jaune cru', 120, 'g', 'required',
     'aromatique', false, 5);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'huile d olive vierge extra' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Huile d''olive vierge extra', 20, 'g', 'required',
     'matière grasse', false, 6);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'ail cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Ail cru', 10, 'g', 'required',
     'aromatique', false, 7);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'cannelle moulue' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Cannelle moulue', 3, 'g', 'required',
     'épice', false, 8);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'sel fin' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Sel fin', 4, 'g', 'required',
     'assaisonnement', false, 9);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'poivre noir moulu' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Poivre noir moulu', 1, 'g', 'required',
     'assaisonnement', false, 10);

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 1, 'Émincer l''oignon en demi-lunes et le poivron rouge en lanières d''un demi-centimètre, hacher l''ail. Rincer et égoutter les pois chiches.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 2, 'Chauffer l''huile d''olive dans une cocotte et y faire fondre l''oignon huit minutes à feu moyen, jusqu''à ce qu''il devienne translucide sans brunir. Ajouter le poivron et poursuivre cinq minutes.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 3, 'Ajouter l''ail et la cannelle, remuer trente secondes pour que l''épice s''ouvre dans le gras sans brûler, puis verser la tomate concassée et laisser compoter dix minutes à découvert, le temps qu''elle perde son acidité.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 4, 'Ajouter les pois chiches et le bouillon de légumes, saler, couvrir à demi et laisser mijoter vingt-cinq minutes à petit feu : le ragoût est prêt quand la sauce nappe la cuillère et qu''un grain s''écrase sans résistance.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 5, 'Écraser à la fourchette une louche de pois chiches contre la paroi de la cocotte et la remettre dans le ragoût : c''est elle qui lie la sauce, sans farine. Rectifier le poivre et laisser reposer dix minutes hors du feu avant de servir.');

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  SELECT 'recipe_ingredient_requirement', req.id, 'missing_food_form',
         CASE WHEN req.strictness = 'required' THEN 1 ELSE 4 END,
         ARRAY['exact_form_not_in_catalog'],
         jsonb_build_object('recipe_code', 'JUM-127', 'recipe_family', 'Ragoût de pois chiches à la tomate',
                            'position', req.position, 'strictness', req.strictness),
         'open'
  FROM culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version AND req.preferred_food_form_id IS NULL;

  SELECT count(*) INTO v_missing
  FROM culinary.recipe_ingredient_requirements
  WHERE recipe_version_id = v_version
    AND strictness = 'required'
    AND preferred_food_form_id IS NULL;

  UPDATE culinary.recipe_versions
  SET planning_eligible = v_static_eligible AND v_missing = 0,
      eligibility_issues = CASE WHEN v_missing = 0
        THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object('code', 'unresolved_required_forms', 'count', v_missing))
      END
  WHERE id = v_version;

  IF v_missing > 0 THEN
    INSERT INTO quality.review_tasks
      (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
    VALUES
      ('recipe_version', v_version, 'unresolved_required_ingredient', 1,
       ARRAY['blocking_form_missing'],
       jsonb_build_object('recipe_code', 'JUM-127', 'missing_required_count', v_missing), 'open');
  END IF;

  WITH axis AS (
    INSERT INTO culinary.recipe_variation_axes
      (recipe_family_id, name, selection_mode, required)
    VALUES (v_family, 'Variante culinaire', 'single', false)
    RETURNING id
  )
  INSERT INTO culinary.recipe_variation_options
    (variation_axis_id, name, confidence_level, status)
  SELECT axis.id, variant.name, 'B', 'candidate'
  FROM axis
  CROSS JOIN unnest(ARRAY['Version aux légumes racines, d''après chefsimon.com : une carotte, un navet, une branche de céleri et un morceau de fenouil taillés en dés, ajoutés avec l''oignon.','Version cuminée, d''après chefsimon.com : remplacer la cannelle par une demi-cuillerée à café de cumin et une pointe de piment d''Espelette.','Version à l''œuf dur et au pain frit, d''après marmiton.org : un œuf dur écrasé et une tranche de pain frite mixée, incorporés en fin de cuisson comme liant.']::text[]) AS variant(name);

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  VALUES
    ('recipe_version', v_version, 'variant_validation', 5,
     ARRAY['source_backed_variant_needs_test'], '{"recipe_code":"JUM-127","variants":["Version aux légumes racines, d''après chefsimon.com : une carotte, un navet, une branche de céleri et un morceau de fenouil taillés en dés, ajoutés avec l''oignon.","Version cuminée, d''après chefsimon.com : remplacer la cannelle par une demi-cuillerée à café de cumin et une pointe de piment d''Espelette.","Version à l''œuf dur et au pain frit, d''après marmiton.org : un œuf dur écrasé et une tranche de pain frite mixée, incorporés en fin de cuisson comme liant."]}'::jsonb, 'open');

  DELETE FROM ops.field_provenance
  WHERE entity_schema = 'culinary' AND entity_table = 'recipe_versions'
    AND entity_id = v_version AND field_name IN ('content', 'sensory_contract');
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name, source_dataset_id,
     source_record_key, normalized_value, transformation_rule, import_run_id, selected)
  SELECT 'culinary', 'recipe_versions', v_version, field_name, ds.id,
         'v3:JUM-127', field_value, transformation_rule, run.id, true
  FROM ops.source_datasets ds
  JOIN LATERAL (
    VALUES
      ('content', to_jsonb('7b3bbba9ce5ec136c6987a6b2a23c45e'::text), 'myko_v3_canonical_recipe'),
      ('sensory_contract', '{"profile":"earthy_tomato","scores":{"sweet":2,"salty":2,"acidic":2,"bitter":0,"umami":3,"heat":0,"pungency":1,"richness":2,"freshness":1,"intensity":3},"dominant_flavors":["pois chiche","tomate","cannelle","oignon fondu"],"aroma_families":["épicé doux","tomate cuite","légumineuse"],"target_textures":["grains fondants","sauce nappante"],"signature_ingredients":["Pois chiche cuit, égoutté","Tomate concassée en conserve","Cannelle moulue"],"identity_guardrails":["La tomate doit compoter seule avant l''arrivée du bouillon : versée en même temps, elle reste acide et le ragoût garde un goût de conserve.","La liaison se fait en écrasant une louche de pois chiches, jamais à la farine : c''est ce qui donne au plat sa texture sans lui ajouter un féculent qu''il n''a pas.","La cannelle est ce qui rattache ce ragoût au mijoté maghrébin dont il dérive ; la retirer en fait un plat de légumineuse méditerranéen sans identité."]}'::jsonb, 'myko_v3_sensory_contract')
  ) AS provenance(field_name, field_value, transformation_rule) ON true
  JOIN LATERAL (
    SELECT id FROM ops.import_runs WHERE configuration_hash = '2df664ad1934cc7be1a4b1a4c06cf79d' LIMIT 1
  ) run ON true
  WHERE ds.code = 'myko_editorial_v3';
END
$recipe$;
DO $recipe$
DECLARE
  v_family uuid;
  v_version uuid;
  v_component uuid;
  v_missing integer;
  v_static_eligible boolean := true;
BEGIN
  INSERT INTO culinary.recipe_families
    (canonical_name, canonical_name_normalized, culinary_origin, cuisine_origin,
     meal_role, dish_structure, identity_level, sensory_profile,
     status, confidence_level)
  VALUES
    ('Poivrons farcis au quinoa et aux légumes', 'poivrons farcis au quinoa et aux legumes', 'France', 'France',
     'meal', 'légume farci', 'domestic_standard', 'roasted_vegetal',
     'candidate', 'B')
  ON CONFLICT (canonical_name_normalized) DO UPDATE SET
    canonical_name = EXCLUDED.canonical_name,
    culinary_origin = EXCLUDED.culinary_origin,
    cuisine_origin = EXCLUDED.cuisine_origin,
    dish_structure = EXCLUDED.dish_structure,
    identity_level = EXCLUDED.identity_level,
    sensory_profile = EXCLUDED.sensory_profile,
    confidence_level = EXCLUDED.confidence_level,
    updated_at = now()
  RETURNING id INTO v_family;

  INSERT INTO culinary.recipe_versions
    (recipe_family_id, version_number, title, short_description, source_dataset_id, source_record_key,
     author_name, source_license, servings, prep_minutes, cook_minutes, difficulty,
     yield_quantity, yield_unit,
     quality_level, publication_status, content_hash,
     sensory_scores, dominant_flavors, aroma_families, target_textures,
     signature_ingredients, identity_guardrails, techniques, variant_candidates,
     allergens, conservation_text, conservation_profile, planning_eligible, eligibility_issues,
     derived_from_version_id, derivation, corpus_poured_on)
  SELECT
    v_family, 3, 'Poivrons farcis au quinoa et aux légumes', 'Les poivrons farcis du parent sans lardons ni bouillon de volaille : une farce de quinoa, de tomate fondue et de feta, liée à l''œuf et rôtie au four.', ds.id, 'JUM-128',
    'Myko', 'editorial', 4, 25, 40, 'facile',
    NULL, NULL,
    'B', 'candidate', '1e397eaf52e17b5f2c94f0970eed758a',
    '{"sweet":2,"salty":3,"acidic":2,"bitter":0,"umami":3,"heat":0,"pungency":1,"richness":3,"freshness":2,"intensity":3}'::jsonb, ARRAY['poivron rôti','feta','tomate','herbes fraîches']::text[],
    ARRAY['rôti','lacté salé','herbacé']::text[], ARRAY['paroi de poivron fondante','farce granuleuse']::text[],
    ARRAY['Poivron rouge frais','Quinoa cru','Feta']::text[], ARRAY['Le quinoa doit être rincé avant cuisson : sa saponine rend toute la farce amère et rien ne la rattrape ensuite.','Les poivrons se blanchissent avant d''être farcis — c''est ce que fait le parent, et c''est ce qui leur évite de s''affaisser en quarante minutes de four.','La tomate doit avoir rendu son eau avant d''entrer dans la farce, sinon la farce se délite et le fond du plat se remplit de jus.']::text[],
    ARRAY['blanchiment','farce','cuisson au four']::text[], ARRAY['Version à l''aubergine, d''après marmiton.org : une aubergine en dés revenue avec l''oignon, qui remplace un tiers du quinoa.','Version aux raisins et pignons, d''après 750g.com : 80 g de raisins secs et 40 g de pignons de pin dans la farce, et du fromage de chèvre frais à la place de la feta.','Version à la mozzarella, d''après chefsimon.com : mozzarella en dés à la place de la feta, posée sur le dessus pour gratiner les dix dernières minutes.']::text[], ARRAY['lait','œuf']::text[],
    'Trois jours au réfrigérateur entre 0 et 4 °C en boîte hermétique, réchauffés vingt minutes à 160 °C plutôt qu''au micro-ondes qui détrempe la peau. La congélation tient deux mois mais ramollit beaucoup le poivron au dégel : mieux vaut congeler la farce seule et garnir des poivrons frais le jour du repas.', '{"fridge_hours":72,"eat_immediately":false,"freezable":null,"freezer_months":null,"serve_cold":null,"source":"parsed"}'::jsonb, false, '[]'::jsonb,
    (SELECT base.id FROM culinary.recipe_versions base
       JOIN ops.source_datasets base_ds ON base_ds.id = base.source_dataset_id
      WHERE base_ds.code = 'myko_editorial_v3' AND base.source_record_key = 'SRC-021'), '{}'::jsonb, NULL
  FROM ops.source_datasets ds WHERE ds.code = 'myko_editorial_v3'
  ON CONFLICT (recipe_family_id, version_number) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    source_dataset_id = EXCLUDED.source_dataset_id,
    source_record_key = EXCLUDED.source_record_key,
    servings = EXCLUDED.servings,
    prep_minutes = EXCLUDED.prep_minutes,
    cook_minutes = EXCLUDED.cook_minutes,
    difficulty = EXCLUDED.difficulty,
    yield_quantity = EXCLUDED.yield_quantity,
    yield_unit = EXCLUDED.yield_unit,
    quality_level = EXCLUDED.quality_level,
    publication_status = 'candidate',
    content_hash = EXCLUDED.content_hash,
    sensory_scores = EXCLUDED.sensory_scores,
    dominant_flavors = EXCLUDED.dominant_flavors,
    aroma_families = EXCLUDED.aroma_families,
    target_textures = EXCLUDED.target_textures,
    signature_ingredients = EXCLUDED.signature_ingredients,
    identity_guardrails = EXCLUDED.identity_guardrails,
    techniques = EXCLUDED.techniques,
    variant_candidates = EXCLUDED.variant_candidates,
    allergens = EXCLUDED.allergens,
    conservation_text = EXCLUDED.conservation_text,
    conservation_profile = EXCLUDED.conservation_profile,
    planning_eligible = false,
    eligibility_issues = '[]'::jsonb,
    derived_from_version_id = EXCLUDED.derived_from_version_id,
    derivation = EXCLUDED.derivation,
    -- Le coalesce DANS CET ORDRE, et c'est la règle qui compte : le registre
    -- l'emporte quand il sait, et une date déjà en base n'est JAMAIS effacée
    -- par un registre qui ne sait pas. Un rechargement de corpus ne doit pas
    -- faire disparaître les nouveautés d'un lot passé.
    corpus_poured_on = coalesce(EXCLUDED.corpus_poured_on, culinary.recipe_versions.corpus_poured_on)
  RETURNING id INTO v_version;

  DELETE FROM quality.review_tasks rt
  USING culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version
    AND rt.entity_type = 'recipe_ingredient_requirement'
    AND rt.entity_id = req.id;
  DELETE FROM quality.review_tasks WHERE entity_type = 'recipe_version' AND entity_id = v_version;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id = v_family;

  INSERT INTO culinary.recipe_components (recipe_version_id, name, component_role, position)
  VALUES (v_version, 'plat', 'main', 1)
  RETURNING id INTO v_component;

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'poivron rouge frais' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Poivron rouge frais', 600, 'g', 'required',
     'légume support', false, 1);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'feta' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Feta', 225, 'g', 'required',
     'protéine', false, 2);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'quinoa cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Quinoa cru', 220, 'g', 'required',
     'féculent', false, 3);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'tomate rapee' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Tomate râpée', 200, 'g', 'required',
     'base humide', false, 4);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'oignon jaune cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Oignon jaune cru', 120, 'g', 'required',
     'aromate', false, 5);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'huile d olive vierge extra' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Huile d''olive vierge extra', 60, 'g', 'required',
     'matière grasse', false, 6);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'oeuf cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Œuf cru', 50, 'g', 'required',
     'liant', false, 7);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'ail cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Ail cru', 5, 'g', 'required',
     'aromate', false, 8);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'bouillon de legumes' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Bouillon de légumes', 7, 'g', 'required',
     'liquide de cuisson', false, 9);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'coriandre fraiche' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Coriandre fraîche', 15, 'g', 'optional',
     'herbe', true, 10);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'persil frais' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Persil frais', 10, 'g', 'optional',
     'herbe', true, 11);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'sel fin' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Sel fin', 4, 'g', 'optional',
     'assaisonnement', true, 12);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'poivre noir moulu' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Poivre noir moulu', 1, 'g', 'optional',
     'assaisonnement', true, 13);

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 1, 'Rincer le quinoa à l''eau froide jusqu''à ce qu''elle sorte claire : la saponine de l''enveloppe est amère et c''est elle qu''on emporte. Le cuire douze minutes dans deux fois son volume d''eau où l''on aura émietté le bouillon de légumes, puis le laisser gonfler cinq minutes à couvert, hors du feu.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 2, 'Couper le chapeau des poivrons, retirer graines et cloisons blanches, et les blanchir cinq minutes à l''eau bouillante salée : c''est ce qui leur permet de tenir quarante minutes au four sans s''affaisser. Les égoutter tête en bas sur un torchon.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 3, 'Faire suer l''oignon ciselé et l''ail haché dans la moitié de l''huile d''olive, ajouter la tomate râpée et laisser réduire dix minutes, jusqu''à ce que le mélange ne rende plus d''eau au fond de la poêle.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 4, 'Mélanger hors du feu le quinoa, la tomate à l''oignon, la feta émiettée, l''œuf battu et les herbes ciselées. Goûter avant de saler : la feta apporte déjà beaucoup de sel.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 5, 'Garnir les poivrons sans tasser la farce, les ranger serrés dans un plat pour qu''ils se tiennent debout, arroser du reste d''huile et enfourner quarante minutes à 180 °C. Ils sont cuits quand la pointe d''un couteau traverse la paroi sans résistance et que la surface de la farce a pris couleur.');

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  SELECT 'recipe_ingredient_requirement', req.id, 'missing_food_form',
         CASE WHEN req.strictness = 'required' THEN 1 ELSE 4 END,
         ARRAY['exact_form_not_in_catalog'],
         jsonb_build_object('recipe_code', 'JUM-128', 'recipe_family', 'Poivrons farcis au quinoa et aux légumes',
                            'position', req.position, 'strictness', req.strictness),
         'open'
  FROM culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version AND req.preferred_food_form_id IS NULL;

  SELECT count(*) INTO v_missing
  FROM culinary.recipe_ingredient_requirements
  WHERE recipe_version_id = v_version
    AND strictness = 'required'
    AND preferred_food_form_id IS NULL;

  UPDATE culinary.recipe_versions
  SET planning_eligible = v_static_eligible AND v_missing = 0,
      eligibility_issues = CASE WHEN v_missing = 0
        THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object('code', 'unresolved_required_forms', 'count', v_missing))
      END
  WHERE id = v_version;

  IF v_missing > 0 THEN
    INSERT INTO quality.review_tasks
      (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
    VALUES
      ('recipe_version', v_version, 'unresolved_required_ingredient', 1,
       ARRAY['blocking_form_missing'],
       jsonb_build_object('recipe_code', 'JUM-128', 'missing_required_count', v_missing), 'open');
  END IF;

  WITH axis AS (
    INSERT INTO culinary.recipe_variation_axes
      (recipe_family_id, name, selection_mode, required)
    VALUES (v_family, 'Variante culinaire', 'single', false)
    RETURNING id
  )
  INSERT INTO culinary.recipe_variation_options
    (variation_axis_id, name, confidence_level, status)
  SELECT axis.id, variant.name, 'B', 'candidate'
  FROM axis
  CROSS JOIN unnest(ARRAY['Version à l''aubergine, d''après marmiton.org : une aubergine en dés revenue avec l''oignon, qui remplace un tiers du quinoa.','Version aux raisins et pignons, d''après 750g.com : 80 g de raisins secs et 40 g de pignons de pin dans la farce, et du fromage de chèvre frais à la place de la feta.','Version à la mozzarella, d''après chefsimon.com : mozzarella en dés à la place de la feta, posée sur le dessus pour gratiner les dix dernières minutes.']::text[]) AS variant(name);

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  VALUES
    ('recipe_version', v_version, 'variant_validation', 5,
     ARRAY['source_backed_variant_needs_test'], '{"recipe_code":"JUM-128","variants":["Version à l''aubergine, d''après marmiton.org : une aubergine en dés revenue avec l''oignon, qui remplace un tiers du quinoa.","Version aux raisins et pignons, d''après 750g.com : 80 g de raisins secs et 40 g de pignons de pin dans la farce, et du fromage de chèvre frais à la place de la feta.","Version à la mozzarella, d''après chefsimon.com : mozzarella en dés à la place de la feta, posée sur le dessus pour gratiner les dix dernières minutes."]}'::jsonb, 'open');

  DELETE FROM ops.field_provenance
  WHERE entity_schema = 'culinary' AND entity_table = 'recipe_versions'
    AND entity_id = v_version AND field_name IN ('content', 'sensory_contract');
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name, source_dataset_id,
     source_record_key, normalized_value, transformation_rule, import_run_id, selected)
  SELECT 'culinary', 'recipe_versions', v_version, field_name, ds.id,
         'v3:JUM-128', field_value, transformation_rule, run.id, true
  FROM ops.source_datasets ds
  JOIN LATERAL (
    VALUES
      ('content', to_jsonb('1e397eaf52e17b5f2c94f0970eed758a'::text), 'myko_v3_canonical_recipe'),
      ('sensory_contract', '{"profile":"roasted_vegetal","scores":{"sweet":2,"salty":3,"acidic":2,"bitter":0,"umami":3,"heat":0,"pungency":1,"richness":3,"freshness":2,"intensity":3},"dominant_flavors":["poivron rôti","feta","tomate","herbes fraîches"],"aroma_families":["rôti","lacté salé","herbacé"],"target_textures":["paroi de poivron fondante","farce granuleuse"],"signature_ingredients":["Poivron rouge frais","Quinoa cru","Feta"],"identity_guardrails":["Le quinoa doit être rincé avant cuisson : sa saponine rend toute la farce amère et rien ne la rattrape ensuite.","Les poivrons se blanchissent avant d''être farcis — c''est ce que fait le parent, et c''est ce qui leur évite de s''affaisser en quarante minutes de four.","La tomate doit avoir rendu son eau avant d''entrer dans la farce, sinon la farce se délite et le fond du plat se remplit de jus."]}'::jsonb, 'myko_v3_sensory_contract')
  ) AS provenance(field_name, field_value, transformation_rule) ON true
  JOIN LATERAL (
    SELECT id FROM ops.import_runs WHERE configuration_hash = '2df664ad1934cc7be1a4b1a4c06cf79d' LIMIT 1
  ) run ON true
  WHERE ds.code = 'myko_editorial_v3';
END
$recipe$;
DO $recipe$
DECLARE
  v_family uuid;
  v_version uuid;
  v_component uuid;
  v_missing integer;
  v_static_eligible boolean := true;
BEGIN
  INSERT INTO culinary.recipe_families
    (canonical_name, canonical_name_normalized, culinary_origin, cuisine_origin,
     meal_role, dish_structure, identity_level, sensory_profile,
     status, confidence_level)
  VALUES
    ('Quiche aux poireaux', 'quiche aux poireaux', 'France', 'France',
     'meal', 'tarte salée', 'domestic_standard', 'creamy_savory',
     'candidate', 'B')
  ON CONFLICT (canonical_name_normalized) DO UPDATE SET
    canonical_name = EXCLUDED.canonical_name,
    culinary_origin = EXCLUDED.culinary_origin,
    cuisine_origin = EXCLUDED.cuisine_origin,
    dish_structure = EXCLUDED.dish_structure,
    identity_level = EXCLUDED.identity_level,
    sensory_profile = EXCLUDED.sensory_profile,
    confidence_level = EXCLUDED.confidence_level,
    updated_at = now()
  RETURNING id INTO v_family;

  INSERT INTO culinary.recipe_versions
    (recipe_family_id, version_number, title, short_description, source_dataset_id, source_record_key,
     author_name, source_license, servings, prep_minutes, cook_minutes, difficulty,
     yield_quantity, yield_unit,
     quality_level, publication_status, content_hash,
     sensory_scores, dominant_flavors, aroma_families, target_textures,
     signature_ingredients, identity_guardrails, techniques, variant_candidates,
     allergens, conservation_text, conservation_profile, planning_eligible, eligibility_issues,
     derived_from_version_id, derivation, corpus_poured_on)
  SELECT
    v_family, 3, 'Quiche aux poireaux', 'Tarte salée aux poireaux fondus dans un appareil œufs-crème, gratinée au gruyère', ds.id, 'VAR-035',
    'Myko', 'editorial', 6, 20, 35, 'facile',
    NULL, NULL,
    'B', 'candidate', 'ceb9289f4118b8c07fe1254062e400fc',
    '{"sweet":3,"salty":3,"acidic":0,"bitter":0,"umami":3,"heat":0,"pungency":1,"richness":4,"freshness":1,"intensity":2}'::jsonb, ARRAY['poireau fondu','crème','gruyère','muscade']::text[],
    ARRAY['végétal cuit','lactée','muscade','beurre']::text[], ARRAY['pâte sablée','intérieur_fondant_ou_crémeux','dessus_doré']::text[],
    ARRAY['Poireau cru','Crème fraîche liquide entière','Gruyère râpé']::text[], ARRAY['Les poireaux doivent avoir rendu et perdu toute leur eau avant d''entrer : c''est la cause numéro un d''une quiche détrempée','Fond cuit à blanc quinze minutes, sinon la pâte reste crue sous la garniture','Poireaux refroidis avant l''appareil — tièdes, ils font cailler l''œuf','On sort la quiche quand le centre tremble encore : elle finit de prendre au repos']::text[],
    ARRAY['fondue de poireaux','cuisson à blanc','appareil','cuisson au four','repos']::text[], ARRAY['Au chèvre frais : 150 g à la place du gruyère, en morceaux répartis sur les poireaux (marmiton, chefsimon)','Aux lardons fumés, 100 g pour quatre, rissolés et égouttés (marmiton, deux pages)','Au saumon frais : 300 g en dés avec un oignon et de la moutarde de Dijon dans l''appareil (marmiton)','Au morbier en fines lamelles, 100 g pour quatre (750g)','Sans pâte : poireaux et patate douce liés à quatre œufs et 20 cl de crème, cuits directement au plat (chefsimon)','Au jambon de Parme et à la muscade, deux tranches taillées en lanières (chefsimon)']::text[], ARRAY['gluten','lait','œuf']::text[],
    'Se garde 3 jours au réfrigérateur et se réchauffe 12 minutes à 180 °C, jamais au micro-ondes qui ramollit la pâte. Elle se mange aussi froide, ce qui en fait un déjeuner de bureau. Se congèle 2 mois cuite, en parts filmées séparément, et se réchauffe sans décongélation, 20 minutes à 180 °C. La fondue de poireaux se prépare 3 jours à l''avance et se congèle 3 mois : c''est elle qui prend le temps, et la quiche se monte alors en dix minutes.', '{"fridge_hours":72,"eat_immediately":false,"freezable":true,"freezer_months":2,"serve_cold":null,"source":"parsed"}'::jsonb, false, '[]'::jsonb,
    (SELECT base.id FROM culinary.recipe_versions base
       JOIN ops.source_datasets base_ds ON base_ds.id = base.source_dataset_id
      WHERE base_ds.code = 'myko_editorial_v3' AND base.source_record_key = 'FR-036'), '{}'::jsonb, NULL
  FROM ops.source_datasets ds WHERE ds.code = 'myko_editorial_v3'
  ON CONFLICT (recipe_family_id, version_number) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    source_dataset_id = EXCLUDED.source_dataset_id,
    source_record_key = EXCLUDED.source_record_key,
    servings = EXCLUDED.servings,
    prep_minutes = EXCLUDED.prep_minutes,
    cook_minutes = EXCLUDED.cook_minutes,
    difficulty = EXCLUDED.difficulty,
    yield_quantity = EXCLUDED.yield_quantity,
    yield_unit = EXCLUDED.yield_unit,
    quality_level = EXCLUDED.quality_level,
    publication_status = 'candidate',
    content_hash = EXCLUDED.content_hash,
    sensory_scores = EXCLUDED.sensory_scores,
    dominant_flavors = EXCLUDED.dominant_flavors,
    aroma_families = EXCLUDED.aroma_families,
    target_textures = EXCLUDED.target_textures,
    signature_ingredients = EXCLUDED.signature_ingredients,
    identity_guardrails = EXCLUDED.identity_guardrails,
    techniques = EXCLUDED.techniques,
    variant_candidates = EXCLUDED.variant_candidates,
    allergens = EXCLUDED.allergens,
    conservation_text = EXCLUDED.conservation_text,
    conservation_profile = EXCLUDED.conservation_profile,
    planning_eligible = false,
    eligibility_issues = '[]'::jsonb,
    derived_from_version_id = EXCLUDED.derived_from_version_id,
    derivation = EXCLUDED.derivation,
    -- Le coalesce DANS CET ORDRE, et c'est la règle qui compte : le registre
    -- l'emporte quand il sait, et une date déjà en base n'est JAMAIS effacée
    -- par un registre qui ne sait pas. Un rechargement de corpus ne doit pas
    -- faire disparaître les nouveautés d'un lot passé.
    corpus_poured_on = coalesce(EXCLUDED.corpus_poured_on, culinary.recipe_versions.corpus_poured_on)
  RETURNING id INTO v_version;

  DELETE FROM quality.review_tasks rt
  USING culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version
    AND rt.entity_type = 'recipe_ingredient_requirement'
    AND rt.entity_id = req.id;
  DELETE FROM quality.review_tasks WHERE entity_type = 'recipe_version' AND entity_id = v_version;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id = v_family;

  INSERT INTO culinary.recipe_components (recipe_version_id, name, component_role, position)
  VALUES (v_version, 'plat', 'main', 1)
  RETURNING id INTO v_component;

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'poireau cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Poireau cru', 500, 'g', 'required',
     'légume', false, 1);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'creme fraiche liquide entiere' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Crème fraîche liquide entière', 300, 'ml', 'required',
     'appareil', false, 2);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'pate brisee crue' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Pâte brisée crue', 250, 'g', 'required',
     'fond', false, 3);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'gruyere rape' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Gruyère râpé', 160, 'g', 'required',
     'fromage', false, 4);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'lait entier' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Lait entier', 150, 'ml', 'required',
     'appareil', false, 5);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'oeuf cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Œuf cru', 4, 'u', 'required',
     'appareil', false, 6);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'muscade moulue' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Muscade moulue', 0.5, 'g', 'required',
     'épice', false, 7);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'sel fin' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Sel fin', 5, 'g', 'required',
     'assaisonnement', false, 8);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'poivre noir moulu' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Poivre noir moulu', 2, 'g', 'required',
     'assaisonnement', false, 9);

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 1, 'Fendre les poireaux en quatre dans la longueur et les rincer sous l''eau en écartant les feuilles : le sable se loge entre les couches et ne part pas d''un simple rinçage extérieur. Un grain de sable dans une quiche se sent à chaque bouchée et ne s''explique par rien d''autre.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 2, 'Émincer les poireaux en tronçons d''un demi-centimètre, blanc et vert tendre compris, et les faire fondre à couvert vingt minutes à feu doux, sans matière grasse ajoutée mais avec deux cuillerées d''eau. Découvrir ensuite cinq à dix minutes pour évaporer complètement le liquide rendu. Cinq cents grammes de poireaux contiennent près d''un verre d''eau : versée crue sur un fond de pâte, elle le rend mou et détache la garniture.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 3, 'Foncer un moule de la pâte brisée, piquer le fond à la fourchette et le cuire à blanc quinze minutes à 180 °C, lesté de billes ou de légumes secs. La cuisson à blanc est ce qui sépare une quiche d''une pâte crue noyée : le fond doit être sec et sablé avant de recevoir quoi que ce soit d''humide.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 4, 'Battre les œufs avec la crème et le lait, saler, poivrer et râper la muscade. Ne pas fouetter au batteur : une masse aérée gonfle au four puis retombe en laissant un creux, alors qu''un appareil simplement mélangé à la fourchette prend en flan lisse.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 5, 'Répartir les poireaux refroidis sur le fond précuit, parsemer les deux tiers du gruyère, verser l''appareil et terminer par le reste du fromage. Les poireaux doivent être froids : posés tièdes, ils commencent à cuire l''œuf avant même le four et l''appareil devient granuleux.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 6, 'Enfourner à 180 °C pour trente-cinq minutes, jusqu''à ce que le centre soit juste pris et tremble encore légèrement quand on secoue le moule. Une quiche cuite jusqu''à immobilité complète est une quiche sèche : elle finit de prendre pendant les dix minutes de repos hors du four, qui sont nécessaires avant de découper.');

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  SELECT 'recipe_ingredient_requirement', req.id, 'missing_food_form',
         CASE WHEN req.strictness = 'required' THEN 1 ELSE 4 END,
         ARRAY['exact_form_not_in_catalog'],
         jsonb_build_object('recipe_code', 'VAR-035', 'recipe_family', 'Quiche aux poireaux',
                            'position', req.position, 'strictness', req.strictness),
         'open'
  FROM culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version AND req.preferred_food_form_id IS NULL;

  SELECT count(*) INTO v_missing
  FROM culinary.recipe_ingredient_requirements
  WHERE recipe_version_id = v_version
    AND strictness = 'required'
    AND preferred_food_form_id IS NULL;

  UPDATE culinary.recipe_versions
  SET planning_eligible = v_static_eligible AND v_missing = 0,
      eligibility_issues = CASE WHEN v_missing = 0
        THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object('code', 'unresolved_required_forms', 'count', v_missing))
      END
  WHERE id = v_version;

  IF v_missing > 0 THEN
    INSERT INTO quality.review_tasks
      (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
    VALUES
      ('recipe_version', v_version, 'unresolved_required_ingredient', 1,
       ARRAY['blocking_form_missing'],
       jsonb_build_object('recipe_code', 'VAR-035', 'missing_required_count', v_missing), 'open');
  END IF;

  WITH axis AS (
    INSERT INTO culinary.recipe_variation_axes
      (recipe_family_id, name, selection_mode, required)
    VALUES (v_family, 'Variante culinaire', 'single', false)
    RETURNING id
  )
  INSERT INTO culinary.recipe_variation_options
    (variation_axis_id, name, confidence_level, status)
  SELECT axis.id, variant.name, 'B', 'candidate'
  FROM axis
  CROSS JOIN unnest(ARRAY['Au chèvre frais : 150 g à la place du gruyère, en morceaux répartis sur les poireaux (marmiton, chefsimon)','Aux lardons fumés, 100 g pour quatre, rissolés et égouttés (marmiton, deux pages)','Au saumon frais : 300 g en dés avec un oignon et de la moutarde de Dijon dans l''appareil (marmiton)','Au morbier en fines lamelles, 100 g pour quatre (750g)','Sans pâte : poireaux et patate douce liés à quatre œufs et 20 cl de crème, cuits directement au plat (chefsimon)','Au jambon de Parme et à la muscade, deux tranches taillées en lanières (chefsimon)']::text[]) AS variant(name);

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  VALUES
    ('recipe_version', v_version, 'variant_validation', 5,
     ARRAY['source_backed_variant_needs_test'], '{"recipe_code":"VAR-035","variants":["Au chèvre frais : 150 g à la place du gruyère, en morceaux répartis sur les poireaux (marmiton, chefsimon)","Aux lardons fumés, 100 g pour quatre, rissolés et égouttés (marmiton, deux pages)","Au saumon frais : 300 g en dés avec un oignon et de la moutarde de Dijon dans l''appareil (marmiton)","Au morbier en fines lamelles, 100 g pour quatre (750g)","Sans pâte : poireaux et patate douce liés à quatre œufs et 20 cl de crème, cuits directement au plat (chefsimon)","Au jambon de Parme et à la muscade, deux tranches taillées en lanières (chefsimon)"]}'::jsonb, 'open');

  DELETE FROM ops.field_provenance
  WHERE entity_schema = 'culinary' AND entity_table = 'recipe_versions'
    AND entity_id = v_version AND field_name IN ('content', 'sensory_contract');
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name, source_dataset_id,
     source_record_key, normalized_value, transformation_rule, import_run_id, selected)
  SELECT 'culinary', 'recipe_versions', v_version, field_name, ds.id,
         'v3:VAR-035', field_value, transformation_rule, run.id, true
  FROM ops.source_datasets ds
  JOIN LATERAL (
    VALUES
      ('content', to_jsonb('ceb9289f4118b8c07fe1254062e400fc'::text), 'myko_v3_canonical_recipe'),
      ('sensory_contract', '{"profile":"creamy_savory","scores":{"sweet":3,"salty":3,"acidic":0,"bitter":0,"umami":3,"heat":0,"pungency":1,"richness":4,"freshness":1,"intensity":2},"dominant_flavors":["poireau fondu","crème","gruyère","muscade"],"aroma_families":["végétal cuit","lactée","muscade","beurre"],"target_textures":["pâte sablée","intérieur_fondant_ou_crémeux","dessus_doré"],"signature_ingredients":["Poireau cru","Crème fraîche liquide entière","Gruyère râpé"],"identity_guardrails":["Les poireaux doivent avoir rendu et perdu toute leur eau avant d''entrer : c''est la cause numéro un d''une quiche détrempée","Fond cuit à blanc quinze minutes, sinon la pâte reste crue sous la garniture","Poireaux refroidis avant l''appareil — tièdes, ils font cailler l''œuf","On sort la quiche quand le centre tremble encore : elle finit de prendre au repos"]}'::jsonb, 'myko_v3_sensory_contract')
  ) AS provenance(field_name, field_value, transformation_rule) ON true
  JOIN LATERAL (
    SELECT id FROM ops.import_runs WHERE configuration_hash = '2df664ad1934cc7be1a4b1a4c06cf79d' LIMIT 1
  ) run ON true
  WHERE ds.code = 'myko_editorial_v3';
END
$recipe$;
DO $recipe$
DECLARE
  v_family uuid;
  v_version uuid;
  v_component uuid;
  v_missing integer;
  v_static_eligible boolean := true;
BEGIN
  INSERT INTO culinary.recipe_families
    (canonical_name, canonical_name_normalized, culinary_origin, cuisine_origin,
     meal_role, dish_structure, identity_level, sensory_profile,
     status, confidence_level)
  VALUES
    ('Omelette aux champignons', 'omelette aux champignons', 'France', 'France',
     'meal', 'omelette', 'domestic_standard', 'earthy_herbal',
     'candidate', 'B')
  ON CONFLICT (canonical_name_normalized) DO UPDATE SET
    canonical_name = EXCLUDED.canonical_name,
    culinary_origin = EXCLUDED.culinary_origin,
    cuisine_origin = EXCLUDED.cuisine_origin,
    dish_structure = EXCLUDED.dish_structure,
    identity_level = EXCLUDED.identity_level,
    sensory_profile = EXCLUDED.sensory_profile,
    confidence_level = EXCLUDED.confidence_level,
    updated_at = now()
  RETURNING id INTO v_family;

  INSERT INTO culinary.recipe_versions
    (recipe_family_id, version_number, title, short_description, source_dataset_id, source_record_key,
     author_name, source_license, servings, prep_minutes, cook_minutes, difficulty,
     yield_quantity, yield_unit,
     quality_level, publication_status, content_hash,
     sensory_scores, dominant_flavors, aroma_families, target_textures,
     signature_ingredients, identity_guardrails, techniques, variant_candidates,
     allergens, conservation_text, conservation_profile, planning_eligible, eligibility_issues,
     derived_from_version_id, derivation, corpus_poured_on)
  SELECT
    v_family, 3, 'Omelette aux champignons', 'Champignons de Paris poêlés à sec puis au beurre, enfermés dans une omelette baveuse crémée', ds.id, 'RAP-023',
    'Myko', 'editorial', 4, 10, 10, 'facile',
    NULL, NULL,
    'B', 'candidate', '797843c9add9b5ace0d4f6148c4a9f28',
    '{"sweet":1,"salty":2,"acidic":0,"bitter":0,"umami":4,"heat":0,"pungency":0,"richness":4,"freshness":1,"intensity":2}'::jsonb, ARRAY['œuf','champignon','beurre']::text[],
    ARRAY['œuf cuit','champignon_terreux','beurre']::text[], ARRAY['moelleux','champignon_fondant']::text[],
    ARRAY['Œuf cru','Champignon de Paris frais','Beurre doux']::text[], ARRAY['Les champignons se poêlent à sec d''abord : ajoutés crus dans les œufs, ils rendent leur eau dedans','Les œufs se battent dix secondes, sans mousser','L''omelette sort baveuse de la poêle — elle finit de cuire dans l''assiette','Deux œufs par personne : en dessous ce n''est plus un plat']::text[],
    ARRAY['poêlage','sauté','cuisson courte']::text[], ARRAY['Aux lardons et pommes de terre cuites, en omelette paysanne (marmiton)','Aux courgettes et échalotes, à l''ail et au thym (marmiton)','Au pesto, deux cuillerées à soupe dans les œufs battus (marmiton)','Au jambon cru et à la ciboulette, en omelette brouillée (chefsimon)','À la feta émiettée, 50 g pour une omelette de trois œufs (chefsimon)','Au chou-fleur, aux pousses d''épinards et au curry (chefsimon)']::text[], ARRAY['œuf','lait']::text[],
    'Se mange à la minute : une omelette réchauffée devient caoutchouteuse et rend son eau, et aucune méthode ne le corrige. Les champignons poêlés, eux, se préparent la veille et se gardent 2 jours au réfrigérateur — c''est la moitié du travail faite d''avance, et l''omelette tombe alors à dix minutes. Ne pas congeler le plat monté.', '{"fridge_hours":null,"eat_immediately":true,"freezable":false,"freezer_months":null,"serve_cold":null,"source":"parsed"}'::jsonb, false, '[]'::jsonb,
    (SELECT base.id FROM culinary.recipe_versions base
       JOIN ops.source_datasets base_ds ON base_ds.id = base.source_dataset_id
      WHERE base_ds.code = 'myko_editorial_v3' AND base.source_record_key = 'DEN-021'), '{}'::jsonb, NULL
  FROM ops.source_datasets ds WHERE ds.code = 'myko_editorial_v3'
  ON CONFLICT (recipe_family_id, version_number) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    source_dataset_id = EXCLUDED.source_dataset_id,
    source_record_key = EXCLUDED.source_record_key,
    servings = EXCLUDED.servings,
    prep_minutes = EXCLUDED.prep_minutes,
    cook_minutes = EXCLUDED.cook_minutes,
    difficulty = EXCLUDED.difficulty,
    yield_quantity = EXCLUDED.yield_quantity,
    yield_unit = EXCLUDED.yield_unit,
    quality_level = EXCLUDED.quality_level,
    publication_status = 'candidate',
    content_hash = EXCLUDED.content_hash,
    sensory_scores = EXCLUDED.sensory_scores,
    dominant_flavors = EXCLUDED.dominant_flavors,
    aroma_families = EXCLUDED.aroma_families,
    target_textures = EXCLUDED.target_textures,
    signature_ingredients = EXCLUDED.signature_ingredients,
    identity_guardrails = EXCLUDED.identity_guardrails,
    techniques = EXCLUDED.techniques,
    variant_candidates = EXCLUDED.variant_candidates,
    allergens = EXCLUDED.allergens,
    conservation_text = EXCLUDED.conservation_text,
    conservation_profile = EXCLUDED.conservation_profile,
    planning_eligible = false,
    eligibility_issues = '[]'::jsonb,
    derived_from_version_id = EXCLUDED.derived_from_version_id,
    derivation = EXCLUDED.derivation,
    -- Le coalesce DANS CET ORDRE, et c'est la règle qui compte : le registre
    -- l'emporte quand il sait, et une date déjà en base n'est JAMAIS effacée
    -- par un registre qui ne sait pas. Un rechargement de corpus ne doit pas
    -- faire disparaître les nouveautés d'un lot passé.
    corpus_poured_on = coalesce(EXCLUDED.corpus_poured_on, culinary.recipe_versions.corpus_poured_on)
  RETURNING id INTO v_version;

  DELETE FROM quality.review_tasks rt
  USING culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version
    AND rt.entity_type = 'recipe_ingredient_requirement'
    AND rt.entity_id = req.id;
  DELETE FROM quality.review_tasks WHERE entity_type = 'recipe_version' AND entity_id = v_version;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id = v_family;

  INSERT INTO culinary.recipe_components (recipe_version_id, name, component_role, position)
  VALUES (v_version, 'plat', 'main', 1)
  RETURNING id INTO v_component;

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'champignon de paris frais' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Champignon de Paris frais', 300, 'g', 'required',
     'garniture', false, 1);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'oeuf cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Œuf cru', 8, 'u', 'required',
     'protéine', false, 2);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'creme fraiche liquide entiere' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Crème fraîche liquide entière', 45, 'g', 'required',
     'liaison', false, 3);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'beurre doux' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Beurre doux', 30, 'g', 'required',
     'cuisson', false, 4);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'persil frais' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Persil frais', 8, 'g', 'required',
     'aromate', false, 5);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'sel fin' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Sel fin', 4, 'g', 'required',
     'assaisonnement', false, 6);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'poivre noir moulu' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Poivre noir moulu', 1, 'g', 'required',
     'assaisonnement', false, 7);

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 1, 'Nettoyer les champignons au pinceau ou à l''essuie-tout humide plutôt qu''à l''eau, et les émincer en lamelles de trois millimètres. Un champignon lavé boit l''eau comme une éponge et la rendra dans la poêle, ce qui double le temps de cuisson.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 2, 'Chauffer une grande poêle à feu vif SANS matière grasse et y jeter les champignons. Ils rendent leur eau dans les deux minutes et bouillent ; laisser l''eau s''évaporer complètement sans baisser le feu. C''est le geste qui distingue un champignon doré d''un champignon gris et mou : le beurre ajouté trop tôt se dilue dans cette eau au lieu de saisir.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 3, 'Quand la poêle grésille à sec, ajouter la moitié du beurre et laisser colorer trois à quatre minutes en remuant peu. Saler à ce moment seulement — salés au départ, les champignons rendent leur eau plus vite et n''ont plus rien à dorer. Réserver dans une assiette.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 4, 'Casser les huit œufs dans un saladier, ajouter la crème, le reste du sel et le poivre, et battre à la fourchette une dizaine de secondes seulement : juste assez pour que jaunes et blancs soient mêlés, pas assez pour faire mousser. Une omelette battue en mousse gonfle au feu puis retombe en donnant une texture caoutchouteuse.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 5, 'Remettre la poêle à feu moyen avec le reste du beurre. Quand la mousse retombe et que le beurre chante sans brunir, verser les œufs d''un coup. Attendre dix secondes, puis ramener sans arrêt les bords cuits vers le centre à la spatule en inclinant la poêle pour que le liquide gagne la place libérée.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 6, 'Arrêter ce mouvement quand il reste une surface encore brillante et liquide sur le dessus — environ trois minutes. Répartir alors les champignons et le persil ciselé sur une moitié, laisser dix secondes, puis rabattre l''autre moitié dessus et faire glisser dans le plat.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 7, 'Servir immédiatement. Une omelette continue de cuire sur son propre plat pendant une bonne minute, ce qui est prévu : baveuse dans la poêle, elle arrive juste prise dans l''assiette. Attendre cinq minutes suffit à la rendre sèche.');

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  SELECT 'recipe_ingredient_requirement', req.id, 'missing_food_form',
         CASE WHEN req.strictness = 'required' THEN 1 ELSE 4 END,
         ARRAY['exact_form_not_in_catalog'],
         jsonb_build_object('recipe_code', 'RAP-023', 'recipe_family', 'Omelette aux champignons',
                            'position', req.position, 'strictness', req.strictness),
         'open'
  FROM culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version AND req.preferred_food_form_id IS NULL;

  SELECT count(*) INTO v_missing
  FROM culinary.recipe_ingredient_requirements
  WHERE recipe_version_id = v_version
    AND strictness = 'required'
    AND preferred_food_form_id IS NULL;

  UPDATE culinary.recipe_versions
  SET planning_eligible = v_static_eligible AND v_missing = 0,
      eligibility_issues = CASE WHEN v_missing = 0
        THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object('code', 'unresolved_required_forms', 'count', v_missing))
      END
  WHERE id = v_version;

  IF v_missing > 0 THEN
    INSERT INTO quality.review_tasks
      (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
    VALUES
      ('recipe_version', v_version, 'unresolved_required_ingredient', 1,
       ARRAY['blocking_form_missing'],
       jsonb_build_object('recipe_code', 'RAP-023', 'missing_required_count', v_missing), 'open');
  END IF;

  WITH axis AS (
    INSERT INTO culinary.recipe_variation_axes
      (recipe_family_id, name, selection_mode, required)
    VALUES (v_family, 'Variante culinaire', 'single', false)
    RETURNING id
  )
  INSERT INTO culinary.recipe_variation_options
    (variation_axis_id, name, confidence_level, status)
  SELECT axis.id, variant.name, 'B', 'candidate'
  FROM axis
  CROSS JOIN unnest(ARRAY['Aux lardons et pommes de terre cuites, en omelette paysanne (marmiton)','Aux courgettes et échalotes, à l''ail et au thym (marmiton)','Au pesto, deux cuillerées à soupe dans les œufs battus (marmiton)','Au jambon cru et à la ciboulette, en omelette brouillée (chefsimon)','À la feta émiettée, 50 g pour une omelette de trois œufs (chefsimon)','Au chou-fleur, aux pousses d''épinards et au curry (chefsimon)']::text[]) AS variant(name);

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  VALUES
    ('recipe_version', v_version, 'variant_validation', 5,
     ARRAY['source_backed_variant_needs_test'], '{"recipe_code":"RAP-023","variants":["Aux lardons et pommes de terre cuites, en omelette paysanne (marmiton)","Aux courgettes et échalotes, à l''ail et au thym (marmiton)","Au pesto, deux cuillerées à soupe dans les œufs battus (marmiton)","Au jambon cru et à la ciboulette, en omelette brouillée (chefsimon)","À la feta émiettée, 50 g pour une omelette de trois œufs (chefsimon)","Au chou-fleur, aux pousses d''épinards et au curry (chefsimon)"]}'::jsonb, 'open');

  DELETE FROM ops.field_provenance
  WHERE entity_schema = 'culinary' AND entity_table = 'recipe_versions'
    AND entity_id = v_version AND field_name IN ('content', 'sensory_contract');
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name, source_dataset_id,
     source_record_key, normalized_value, transformation_rule, import_run_id, selected)
  SELECT 'culinary', 'recipe_versions', v_version, field_name, ds.id,
         'v3:RAP-023', field_value, transformation_rule, run.id, true
  FROM ops.source_datasets ds
  JOIN LATERAL (
    VALUES
      ('content', to_jsonb('797843c9add9b5ace0d4f6148c4a9f28'::text), 'myko_v3_canonical_recipe'),
      ('sensory_contract', '{"profile":"earthy_herbal","scores":{"sweet":1,"salty":2,"acidic":0,"bitter":0,"umami":4,"heat":0,"pungency":0,"richness":4,"freshness":1,"intensity":2},"dominant_flavors":["œuf","champignon","beurre"],"aroma_families":["œuf cuit","champignon_terreux","beurre"],"target_textures":["moelleux","champignon_fondant"],"signature_ingredients":["Œuf cru","Champignon de Paris frais","Beurre doux"],"identity_guardrails":["Les champignons se poêlent à sec d''abord : ajoutés crus dans les œufs, ils rendent leur eau dedans","Les œufs se battent dix secondes, sans mousser","L''omelette sort baveuse de la poêle — elle finit de cuire dans l''assiette","Deux œufs par personne : en dessous ce n''est plus un plat"]}'::jsonb, 'myko_v3_sensory_contract')
  ) AS provenance(field_name, field_value, transformation_rule) ON true
  JOIN LATERAL (
    SELECT id FROM ops.import_runs WHERE configuration_hash = '2df664ad1934cc7be1a4b1a4c06cf79d' LIMIT 1
  ) run ON true
  WHERE ds.code = 'myko_editorial_v3';
END
$recipe$;
DO $recipe$
DECLARE
  v_family uuid;
  v_version uuid;
  v_component uuid;
  v_missing integer;
  v_static_eligible boolean := true;
BEGIN
  INSERT INTO culinary.recipe_families
    (canonical_name, canonical_name_normalized, culinary_origin, cuisine_origin,
     meal_role, dish_structure, identity_level, sensory_profile,
     status, confidence_level)
  VALUES
    ('Pommes de terre sautées', 'pommes de terre sautees', 'France', 'France',
     'meal', 'accompagnement', 'domestic_standard', 'savory_crisp',
     'candidate', 'B')
  ON CONFLICT (canonical_name_normalized) DO UPDATE SET
    canonical_name = EXCLUDED.canonical_name,
    culinary_origin = EXCLUDED.culinary_origin,
    cuisine_origin = EXCLUDED.cuisine_origin,
    dish_structure = EXCLUDED.dish_structure,
    identity_level = EXCLUDED.identity_level,
    sensory_profile = EXCLUDED.sensory_profile,
    confidence_level = EXCLUDED.confidence_level,
    updated_at = now()
  RETURNING id INTO v_family;

  INSERT INTO culinary.recipe_versions
    (recipe_family_id, version_number, title, short_description, source_dataset_id, source_record_key,
     author_name, source_license, servings, prep_minutes, cook_minutes, difficulty,
     yield_quantity, yield_unit,
     quality_level, publication_status, content_hash,
     sensory_scores, dominant_flavors, aroma_families, target_textures,
     signature_ingredients, identity_guardrails, techniques, variant_candidates,
     allergens, conservation_text, conservation_profile, planning_eligible, eligibility_issues,
     derived_from_version_id, derivation, corpus_poured_on)
  SELECT
    v_family, 3, 'Pommes de terre sautées', 'Pommes de terre précuites à l''eau puis rissolées à l''huile d''olive avec ail', ds.id, 'FR-027',
    'Myko', 'editorial', 4, 15, 35, 'facile',
    NULL, NULL,
    'B', 'candidate', '7084d3fdae4bca0c28cac4b43477e61e',
    '{"sweet":1,"salty":3,"acidic":0,"bitter":0,"umami":1,"heat":0,"pungency":2,"richness":3,"freshness":1,"intensity":3}'::jsonb, ARRAY['pomme de terre rissolée','ail','huile d''olive']::text[],
    ARRAY['ail','herbacé','grillé']::text[], ARRAY['croûte croustillante','cœur fondant','contraste marqué']::text[],
    ARRAY['Pomme de terre crue, épluchée','Huile d''olive vierge extra','Ail cru']::text[], ARRAY['Le contraste entre une croûte dorée et un cœur fondant est tout le plat : sans coloration, ce sont des pommes de terre à l''eau réchauffées.','L''ail entre dans les deux dernières minutes et jamais au départ ; brûlé, son amertume couvre la pomme de terre et le plat devient inmangeable.','Une variété à chair ferme est indispensable : une farineuse se délite à la précuisson et on obtient un écrasé huileux au lieu de morceaux distincts.']::text[],
    ARRAY['parage','précuisson à l''eau salée','séchage','sauter en poêle','finition aromatique']::text[], ARRAY['Rattes non épluchées sautées à l''huile d''olive avec deux gousses d''ail en chemise, laurier et thym frais, finies au gros sel (Marmiton)','À la graisse d''oie, avec échalote, ail, romarin et thym (Chef Simon)','Au chorizo doux ou fort et à l''oignon, relevées d''une pincée de piment (Chef Simon)','Relevées de trois pincées de curry (Marmiton)','À l''ail et au persil, sept gousses pour trois personnes (Marmiton)']::text[], ARRAY[]::text[],
    'Deux jours au réfrigérateur dans une boîte fermée, mais la croûte ne se rattrape pas au micro-ondes. Réchauffer à la poêle bien chaude, à sec ou avec une goutte d''huile, cinq minutes à découvert en retournant une fois. Ne pas congeler : les morceaux se délitent à la décongélation et rendent leur eau dans la poêle.', '{"fridge_hours":48,"eat_immediately":false,"freezable":false,"freezer_months":null,"serve_cold":null,"source":"parsed"}'::jsonb, false, '[]'::jsonb,
    (SELECT base.id FROM culinary.recipe_versions base
       JOIN ops.source_datasets base_ds ON base_ds.id = base.source_dataset_id
      WHERE base_ds.code = 'myko_editorial_v3' AND base.source_record_key = 'SRC-049'), '{}'::jsonb, NULL
  FROM ops.source_datasets ds WHERE ds.code = 'myko_editorial_v3'
  ON CONFLICT (recipe_family_id, version_number) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    source_dataset_id = EXCLUDED.source_dataset_id,
    source_record_key = EXCLUDED.source_record_key,
    servings = EXCLUDED.servings,
    prep_minutes = EXCLUDED.prep_minutes,
    cook_minutes = EXCLUDED.cook_minutes,
    difficulty = EXCLUDED.difficulty,
    yield_quantity = EXCLUDED.yield_quantity,
    yield_unit = EXCLUDED.yield_unit,
    quality_level = EXCLUDED.quality_level,
    publication_status = 'candidate',
    content_hash = EXCLUDED.content_hash,
    sensory_scores = EXCLUDED.sensory_scores,
    dominant_flavors = EXCLUDED.dominant_flavors,
    aroma_families = EXCLUDED.aroma_families,
    target_textures = EXCLUDED.target_textures,
    signature_ingredients = EXCLUDED.signature_ingredients,
    identity_guardrails = EXCLUDED.identity_guardrails,
    techniques = EXCLUDED.techniques,
    variant_candidates = EXCLUDED.variant_candidates,
    allergens = EXCLUDED.allergens,
    conservation_text = EXCLUDED.conservation_text,
    conservation_profile = EXCLUDED.conservation_profile,
    planning_eligible = false,
    eligibility_issues = '[]'::jsonb,
    derived_from_version_id = EXCLUDED.derived_from_version_id,
    derivation = EXCLUDED.derivation,
    -- Le coalesce DANS CET ORDRE, et c'est la règle qui compte : le registre
    -- l'emporte quand il sait, et une date déjà en base n'est JAMAIS effacée
    -- par un registre qui ne sait pas. Un rechargement de corpus ne doit pas
    -- faire disparaître les nouveautés d'un lot passé.
    corpus_poured_on = coalesce(EXCLUDED.corpus_poured_on, culinary.recipe_versions.corpus_poured_on)
  RETURNING id INTO v_version;

  DELETE FROM quality.review_tasks rt
  USING culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version
    AND rt.entity_type = 'recipe_ingredient_requirement'
    AND rt.entity_id = req.id;
  DELETE FROM quality.review_tasks WHERE entity_type = 'recipe_version' AND entity_id = v_version;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id = v_version;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id = v_family;

  INSERT INTO culinary.recipe_components (recipe_version_id, name, component_role, position)
  VALUES (v_version, 'plat', 'main', 1)
  RETURNING id INTO v_component;

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'pomme de terre crue epluchee' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Pomme de terre crue, épluchée', 850, 'g', 'required',
     'féculent', false, 1);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'huile d olive vierge extra' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Huile d''olive vierge extra', 30, 'g', 'required',
     'matière grasse de cuisson', false, 2);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'ail cru' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Ail cru', 15, 'g', 'required',
     'aromatique', false, 3);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'sel fin' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Sel fin', 8, 'g', 'required',
     'assaisonnement', false, 4);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'poivre noir moulu' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Poivre noir moulu', 1, 'g', 'required',
     'assaisonnement', false, 5);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'thym frais' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Thym frais', 2, 'g', 'optional',
     'aromate', true, 6);

  INSERT INTO culinary.recipe_ingredient_requirements
    (recipe_version_id, component_id, requirement_type, preferred_food_form_id,
     source_name, quantity, unit, strictness, culinary_role, is_optional, position)
  VALUES
    (v_version, v_component, 'exact_form',
     (SELECT ff.id FROM catalog.food_forms ff
      WHERE ff.canonical_name_normalized = 'persil frais' AND ff.status <> 'rejected'
      ORDER BY CASE ff.status WHEN 'published' THEN 0 ELSE 1 END, ff.confidence_level
      LIMIT 1),
     'Persil frais', 15, 'g', 'optional',
     'aromate', true, 7);

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 1, 'Prendre environ 1 kg de pommes de terre à chair ferme pour les 850 g de chair annoncés : charlotte, belle de Fontenay ou ratte, dont la tenue supporte le double passage à l''eau puis à la poêle. Une variété farineuse s''y effondrerait en bouillie sans jamais dorer.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 2, 'Les peler et les tailler en rondelles épaisses de cinq millimètres ou en cubes de deux centimètres, mais d''un calibre régulier : un mélange de tailles donne inévitablement des morceaux brûlés à côté de morceaux encore crus, et la poêle ne pardonne pas cette approximation.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 3, 'Les plonger sept à huit minutes dans une grande eau salée bouillante, jusqu''à ce qu''elles cèdent en surface tout en restant fermes au cœur, puis les égoutter et les laisser sécher dix minutes à l''air libre sur un torchon. Cette précuisson est ce qui permet un intérieur fondant en vingt minutes de poêle ; à cru, il faut compter le double et le résultat reste inégal.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 4, 'Chauffer l''huile dans une grande poêle jusqu''à ce que la surface ondule, puis déposer les morceaux en une seule couche, à plat. Faire deux fournées plutôt que d''entasser : serrées, les pommes de terre cuisent dans la vapeur de leur propre eau et ne dorent jamais.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 5, 'Laisser cinq bonnes minutes sans y toucher avant de retourner. La croûte a besoin d''un temps de contact continu pour se former, et remuer trop tôt l''arrache par plaques. Continuer ensuite à retourner toutes les trois ou quatre minutes jusqu''à ce que toutes les faces soient dorées.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 6, 'Ajouter l''ail haché et le thym effeuillé seulement dans les deux dernières minutes, feu baissé. L''ail brûle en moins d''une minute sur une poêle à cette température et vire à l''amer : mis au départ, il gâche l''ensemble du plat sans qu''on puisse le rattraper.');

  INSERT INTO culinary.recipe_steps (recipe_version_id, step_number, instruction)
  VALUES (v_version, 7, 'Saler à la sortie de la poêle, poivrer, parsemer de persil grossièrement haché et servir aussitôt, à découvert. Sous un couvercle ou dans un plat en attente, la croûte s''amollit en quelques minutes et tout le travail des étapes précédentes est perdu.');

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  SELECT 'recipe_ingredient_requirement', req.id, 'missing_food_form',
         CASE WHEN req.strictness = 'required' THEN 1 ELSE 4 END,
         ARRAY['exact_form_not_in_catalog'],
         jsonb_build_object('recipe_code', 'FR-027', 'recipe_family', 'Pommes de terre sautées',
                            'position', req.position, 'strictness', req.strictness),
         'open'
  FROM culinary.recipe_ingredient_requirements req
  WHERE req.recipe_version_id = v_version AND req.preferred_food_form_id IS NULL;

  SELECT count(*) INTO v_missing
  FROM culinary.recipe_ingredient_requirements
  WHERE recipe_version_id = v_version
    AND strictness = 'required'
    AND preferred_food_form_id IS NULL;

  UPDATE culinary.recipe_versions
  SET planning_eligible = v_static_eligible AND v_missing = 0,
      eligibility_issues = CASE WHEN v_missing = 0
        THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object('code', 'unresolved_required_forms', 'count', v_missing))
      END
  WHERE id = v_version;

  IF v_missing > 0 THEN
    INSERT INTO quality.review_tasks
      (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
    VALUES
      ('recipe_version', v_version, 'unresolved_required_ingredient', 1,
       ARRAY['blocking_form_missing'],
       jsonb_build_object('recipe_code', 'FR-027', 'missing_required_count', v_missing), 'open');
  END IF;

  WITH axis AS (
    INSERT INTO culinary.recipe_variation_axes
      (recipe_family_id, name, selection_mode, required)
    VALUES (v_family, 'Variante culinaire', 'single', false)
    RETURNING id
  )
  INSERT INTO culinary.recipe_variation_options
    (variation_axis_id, name, confidence_level, status)
  SELECT axis.id, variant.name, 'B', 'candidate'
  FROM axis
  CROSS JOIN unnest(ARRAY['Rattes non épluchées sautées à l''huile d''olive avec deux gousses d''ail en chemise, laurier et thym frais, finies au gros sel (Marmiton)','À la graisse d''oie, avec échalote, ail, romarin et thym (Chef Simon)','Au chorizo doux ou fort et à l''oignon, relevées d''une pincée de piment (Chef Simon)','Relevées de trois pincées de curry (Marmiton)','À l''ail et au persil, sept gousses pour trois personnes (Marmiton)']::text[]) AS variant(name);

  INSERT INTO quality.review_tasks
    (entity_type, entity_id, task_type, priority, reason_codes, proposed_changes, status)
  VALUES
    ('recipe_version', v_version, 'variant_validation', 5,
     ARRAY['source_backed_variant_needs_test'], '{"recipe_code":"FR-027","variants":["Rattes non épluchées sautées à l''huile d''olive avec deux gousses d''ail en chemise, laurier et thym frais, finies au gros sel (Marmiton)","À la graisse d''oie, avec échalote, ail, romarin et thym (Chef Simon)","Au chorizo doux ou fort et à l''oignon, relevées d''une pincée de piment (Chef Simon)","Relevées de trois pincées de curry (Marmiton)","À l''ail et au persil, sept gousses pour trois personnes (Marmiton)"]}'::jsonb, 'open');

  DELETE FROM ops.field_provenance
  WHERE entity_schema = 'culinary' AND entity_table = 'recipe_versions'
    AND entity_id = v_version AND field_name IN ('content', 'sensory_contract');
  INSERT INTO ops.field_provenance
    (entity_schema, entity_table, entity_id, field_name, source_dataset_id,
     source_record_key, normalized_value, transformation_rule, import_run_id, selected)
  SELECT 'culinary', 'recipe_versions', v_version, field_name, ds.id,
         'v3:FR-027', field_value, transformation_rule, run.id, true
  FROM ops.source_datasets ds
  JOIN LATERAL (
    VALUES
      ('content', to_jsonb('7084d3fdae4bca0c28cac4b43477e61e'::text), 'myko_v3_canonical_recipe'),
      ('sensory_contract', '{"profile":"savory_crisp","scores":{"sweet":1,"salty":3,"acidic":0,"bitter":0,"umami":1,"heat":0,"pungency":2,"richness":3,"freshness":1,"intensity":3},"dominant_flavors":["pomme de terre rissolée","ail","huile d''olive"],"aroma_families":["ail","herbacé","grillé"],"target_textures":["croûte croustillante","cœur fondant","contraste marqué"],"signature_ingredients":["Pomme de terre crue, épluchée","Huile d''olive vierge extra","Ail cru"],"identity_guardrails":["Le contraste entre une croûte dorée et un cœur fondant est tout le plat : sans coloration, ce sont des pommes de terre à l''eau réchauffées.","L''ail entre dans les deux dernières minutes et jamais au départ ; brûlé, son amertume couvre la pomme de terre et le plat devient inmangeable.","Une variété à chair ferme est indispensable : une farineuse se délite à la précuisson et on obtient un écrasé huileux au lieu de morceaux distincts."]}'::jsonb, 'myko_v3_sensory_contract')
  ) AS provenance(field_name, field_value, transformation_rule) ON true
  JOIN LATERAL (
    SELECT id FROM ops.import_runs WHERE configuration_hash = '2df664ad1934cc7be1a4b1a4c06cf79d' LIMIT 1
  ) run ON true
  WHERE ds.code = 'myko_editorial_v3';
END
$recipe$;