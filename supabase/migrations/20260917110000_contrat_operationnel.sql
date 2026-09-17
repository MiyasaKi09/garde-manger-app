-- Le contrat opérationnel : la base publie enfin les quatre champs dont le
-- moteur a besoin pour décider.
--
-- CE QUI NE MARCHAIT PAS, ET QUI SE VÉRIFIE DANS LE DÉPÔT.
-- `get_operational_recipe_catalog_v3` (20260715190000) est la SEULE porte par
-- laquelle le planificateur de production lit les recettes
-- (app/api/planning/generate-v3/route.js, app/api/planning/alternatives/route.js).
-- Elle ne publiait aucun des quatre champs suivants :
--
--   origin              — 0 occurrence dans 20260715190000 ; le seul « origin »
--                         du fichier est `cuisine_origin`, qui est un PAYS ;
--   conservationProfile — le mot n'existait dans aucune migration du dépôt ;
--                         seule la prose `conservation_text` était publiée ;
--   ingredient.component— 0 occurrence ; seules les RPC ÉDITORIALES le
--                         publient (20260715214547, 20260729140000:255) ;
--   derivedFrom         — 0 occurrence de `derived`, `lineage` ou `parent`,
--                         alors que `derived_from_version_id` existe en base
--                         depuis 20260729140000 (ligne 30) : il n'était
--                         simplement jamais publié.
--
-- Conséquences mesurées, et c'est pour elles que cette migration existe :
--   — l'origine et la conservation étaient RUSTINÉES en JavaScript depuis
--     data/recipes/corpus-v3.json, importé au build
--     (lib/domain/recipes/operationalCatalog.js, lignes 13 et 25). Le fichier
--     écrit lui-même que sans ce raccord « plus aucun plat ne serait
--     végétarien en production » ;
--   — `component` et `derivedFrom` n'étaient rustinés par RIEN.
--     lib/domain/planning/sharedBases.js (509 lignes, testé, câblé au solveur)
--     ne voyait aucune base partagée sur le chemin de production, et
--     `recipeLineage()` (closedLoopPlanner.js:777-779) retombait sur le code de
--     la recette : toute recette était sa propre lignée. Mesuré : 275 des 568
--     recettes portent une lignée distincte de leur code sur le chemin JSON,
--     zéro sur le chemin base, et les 48 jumeaux végétariens ne pouvaient pas
--     jouer leur rôle.
--
-- CE QUE CETTE MIGRATION FAIT, ET CE QU'ELLE NE FAIT PAS.
-- Elle ajoute deux colonnes DÉCLARATIVES — la conservation structurée d'une
-- recette, l'origine biologique d'une forme — et elle enrichit la PROJECTION de
-- la RPC opérationnelle. Elle ne remplit pas ces colonnes : le remplissage des
-- lignes déjà en base est une migration à part (20260917111000), et les
-- chargements futurs les écrivent par la chaîne de publication
-- (scripts/data/foods/build-recipe-food-sql.mjs,
--  scripts/data/recipes/build-corpus-v3.mjs). Une colonne vide dit « personne
-- n'a déclaré », ce qui est vrai tant que le remplissage n'est pas passé, et
-- c'est exactement ce qu'on veut lire.
--
-- LA SIGNATURE DE LA RPC NE CHANGE PAS. Trois arguments, même ordre, mêmes
-- valeurs par défaut, même plafond de page et même plafond d'offset : les deux
-- sites d'appel et leur pagination (lib/db/operationalRecipeCatalog.js) sont
-- inchangés. Seule la projection s'enrichit, et les champs ajoutés sont
-- FACULTATIFS côté lecture — un client qui les ignore lit ce qu'il lisait.
--
-- CE QUI A ÉTÉ ÉCARTÉ.
--   — Poser l'origine sur `catalog.food_concepts.biological_origin`, qui existe
--     depuis 20260714200003 : c'est le CONCEPT, pas la FORME. Une forme
--     composite — pâtes aux œufs, pâte brisée pur beurre — porte l'origine la
--     plus contraignante de ses composants, et deux formes du même concept
--     peuvent différer. La colonne de concept reste non écrite ; la déclarer
--     comme l'origine du planificateur aurait confondu deux niveaux.
--   — Stocker le profil de conservation déjà traduit en camelCase : la base
--     porte la forme DÉCLARÉE par le corpus (snake_case, écrite par
--     scripts/data/recipes/derive-conservation-profiles.mjs). La traduction
--     vers le contrat de lecture est le travail de la RPC, qui renomme déjà
--     tout le reste (prepMinutes, cuisineOrigin, exactIngredients). Deux
--     vocabulaires dans la même colonne auraient rendu la source illisible.
--   — Un défaut sur l'origine. `NULL` veut dire « cette ligne n'a jamais reçu
--     d'origine », `'inconnu'` veut dire « on a cherché et personne n'a
--     tranché » (lib/domain/foods/origins.js). Les deux sont des absences, mais
--     pas la même, et les confondre effacerait le travail d'arbitrage.

-- ── 1. L'origine biologique, portée par la FORME ────────────────────────────
-- Le vocabulaire est FERMÉ et vit dans lib/domain/foods/origins.js ; la liste
-- du CHECK ci-dessous en est la copie, et tests/db/contratOperationnel.test.js
-- refuse que les deux divergent. On ne complète jamais une origine par une
-- regex sur le nom : c'est la faute que ce vocabulaire a été créé pour retirer
-- (22 plats classés végétariens contenaient du bouillon de volaille).
ALTER TABLE catalog.food_forms
  ADD COLUMN IF NOT EXISTS origin text;

ALTER TABLE catalog.food_forms
  ADD COLUMN IF NOT EXISTS origin_source text;

ALTER TABLE catalog.food_forms
  DROP CONSTRAINT IF EXISTS food_forms_origin_check;
ALTER TABLE catalog.food_forms
  ADD CONSTRAINT food_forms_origin_check
  CHECK (origin IS NULL OR origin = ANY (ARRAY[
    'vegetal'::text,
    'mineral'::text,
    'animal:viande'::text,
    'animal:volaille'::text,
    'animal:poisson'::text,
    'animal:fruits_de_mer'::text,
    'animal:oeuf'::text,
    'animal:lait'::text,
    'animal:miel'::text,
    'animal:autre'::text,
    'inconnu'::text
  ]));

COMMENT ON COLUMN catalog.food_forms.origin IS
  'Origine biologique DÉCLARÉE de la forme, vocabulaire fermé de lib/domain/foods/origins.js. NULL = jamais déclarée ; ''inconnu'' = cherchée et non tranchée. Jamais devinée sur le nom.';
COMMENT ON COLUMN catalog.food_forms.origin_source IS
  'D''où vient la décision d''origine : ''arbitrage:lot21'' pour une décision explicite, ''ciqual:<groupe>'' pour une case du classeur sans ambiguïté. NULL quand l''origine est ''inconnu'' ou non déclarée.';

-- Le planificateur lit l'origine forme par forme au fil des ingrédients : un
-- index partiel sur les origines déclarées sert les contrôles de couverture
-- (« quelles formes n'en ont pas ? ») sans peser sur les écritures du
-- chargement.
CREATE INDEX IF NOT EXISTS idx_food_forms_origin
  ON catalog.food_forms (origin)
  WHERE origin IS NOT NULL;

-- ── 2. Le profil de conservation, porté par la VERSION de recette ───────────
-- La prose reste (`conservation_text`) : elle se lit à l'écran. Ce qui se
-- calcule — combien de jours au frais, congelable ou non, servi froid — est
-- désormais structuré, comme le corpus le déclare depuis C1.2.
ALTER TABLE culinary.recipe_versions
  ADD COLUMN IF NOT EXISTS conservation_profile jsonb;

ALTER TABLE culinary.recipe_versions
  DROP CONSTRAINT IF EXISTS recipe_versions_conservation_profile_check;
ALTER TABLE culinary.recipe_versions
  ADD CONSTRAINT recipe_versions_conservation_profile_check
  CHECK (conservation_profile IS NULL OR jsonb_typeof(conservation_profile) = 'object');

COMMENT ON COLUMN culinary.recipe_versions.conservation_profile IS
  'Profil de conservation DÉCLARÉ, dans la forme du corpus : {fridge_hours, eat_immediately, freezable, freezer_months, serve_cold, source}. NULL = non déclaré, et le planificateur ne produit alors aucune portion d''avance.';

-- ── 3. La traduction du profil vers le contrat de lecture ───────────────────
-- Le moteur lit `{fridgeHours, eatImmediately, freezable, freezerMonths,
-- serveCold, source}` et RIEN d'autre (lib/domain/recipes/conservationProfile.js).
-- Cette fonction est la seule traduction côté base, et elle applique les mêmes
-- règles que son homologue JavaScript, une par une :
--   — une durée absente, non numérique ou ≤ 0 vaut null (et non zéro : un zéro
--     se lirait « à consommer immédiatement », ce qui est une affirmation) ;
--   — `eatImmediately` vaut false tant que le corpus n'a pas écrit true : ne
--     pas l'avoir déclaré n'est pas déclarer qu'il faut manger tout de suite ;
--   — `freezable` et `serveCold` valent null quand ils ne sont pas des
--     booléens : ne pas savoir si un plat se congèle n'est pas savoir qu'il ne
--     se congèle pas.
-- Une valeur qui n'a pas la bonne forme retombe donc sur l'absence, jamais sur
-- une valeur plausible.
CREATE OR REPLACE FUNCTION culinary.conservation_profile_contract(p_profile jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $function$
DECLARE
  v_fridge numeric;
  v_freezer numeric;
BEGIN
  IF p_profile IS NULL OR jsonb_typeof(p_profile) <> 'object' THEN
    RETURN NULL;
  END IF;

  IF jsonb_typeof(p_profile -> 'fridge_hours') = 'number' THEN
    v_fridge := (p_profile ->> 'fridge_hours')::numeric;
    IF v_fridge <= 0 THEN v_fridge := NULL; END IF;
  END IF;

  IF jsonb_typeof(p_profile -> 'freezer_months') = 'number' THEN
    v_freezer := (p_profile ->> 'freezer_months')::numeric;
    IF v_freezer <= 0 THEN v_freezer := NULL; END IF;
  END IF;

  RETURN jsonb_build_object(
    'fridgeHours', to_jsonb(v_fridge),
    'eatImmediately', to_jsonb(coalesce(p_profile -> 'eat_immediately' = to_jsonb(true), false)),
    'freezable', CASE WHEN jsonb_typeof(p_profile -> 'freezable') = 'boolean'
      THEN p_profile -> 'freezable' ELSE 'null'::jsonb END,
    'freezerMonths', to_jsonb(v_freezer),
    'serveCold', CASE WHEN jsonb_typeof(p_profile -> 'serve_cold') = 'boolean'
      THEN p_profile -> 'serve_cold' ELSE 'null'::jsonb END,
    'source', CASE WHEN jsonb_typeof(p_profile -> 'source') = 'string'
      THEN p_profile -> 'source' ELSE 'null'::jsonb END
  );
END;
$function$;

COMMENT ON FUNCTION culinary.conservation_profile_contract(jsonb) IS
  'Traduit le profil de conservation déclaré (snake_case du corpus) vers le contrat de lecture camelCase du moteur. Une valeur mal formée retombe sur l''absence, jamais sur une valeur plausible.';

-- ── 4. La RPC opérationnelle publie les quatre champs ───────────────────────
-- Le texte ci-dessous est celui de 20260715190000, PATCHÉ et non réécrit : une
-- recopie à la main a déjà produit dans ce dépôt des références à des tables
-- qui n'existent pas (cf. 20260729140000). Les seuls écarts avec l'original
-- sont marqués « CONTRAT OPÉRATIONNEL ».
CREATE OR REPLACE FUNCTION public.get_operational_recipe_catalog_v3(
  p_code text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  WITH qualified AS MATERIALIZED (
    SELECT
      rv.id AS recipe_version_id,
      rv.recipe_family_id,
      upper(rv.source_record_key) AS code,
      rv.title,
      rv.servings,
      rv.prep_minutes,
      rv.cook_minutes,
      rv.rest_minutes,
      rv.difficulty,
      rv.quality_level,
      rv.publication_status,
      rv.sensory_scores,
      rv.dominant_flavors,
      rv.aroma_families,
      rv.target_textures,
      rv.signature_ingredients,
      rv.identity_guardrails,
      rv.techniques,
      rv.variant_candidates,
      rv.allergens,
      rv.conservation_text,
      -- CONTRAT OPÉRATIONNEL : la conservation structurée et la lignée.
      rv.conservation_profile,
      upper(base.source_record_key) AS derived_from_code,
      rf.canonical_name AS family_name,
      rf.description,
      rf.cuisine_origin,
      rf.identity_level,
      rf.sensory_profile,
      rf.dish_structure,
      rf.status AS family_status,
      rf.confidence_level AS family_confidence,
      sd.code AS source_dataset_code,
      sd.current_version AS source_dataset_version,
      sd.name AS source_dataset_name,
      rv.source_url,
      rv.source_license
    FROM culinary.recipe_versions rv
    JOIN culinary.recipe_families rf ON rf.id = rv.recipe_family_id
    LEFT JOIN ops.source_datasets sd ON sd.id = rv.source_dataset_id
    -- CONTRAT OPÉRATIONNEL : la base d'une recette dérivée. LEFT, parce qu'une
    -- recette de plein droit n'en a pas — et son `derivedFrom` doit alors être
    -- nul, pas égal à son propre code : c'est le lecteur qui décide ce que vaut
    -- une lignée absente (recipeLineage, closedLoopPlanner.js:777).
    LEFT JOIN culinary.recipe_versions base ON base.id = rv.derived_from_version_id
    WHERE rv.planning_eligible
      AND rv.eligibility_issues = '[]'::jsonb
      AND rv.quality_level IN ('A', 'B')
      AND rf.confidence_level IN ('A', 'B')
      AND rv.source_record_key IS NOT NULL
      AND (p_code IS NULL OR upper(rv.source_record_key) = upper(btrim(p_code)))
      AND NOT EXISTS (
        SELECT 1
        FROM culinary.recipe_ingredient_requirements requirement
        WHERE requirement.recipe_version_id = rv.id
          AND (
            requirement.preferred_food_form_id IS NULL
            OR NOT EXISTS (
              SELECT 1
              FROM catalog.food_unit_conversions conversion
              WHERE conversion.food_form_id = requirement.preferred_food_form_id
                AND conversion.from_unit = requirement.unit
                AND conversion.to_unit = 'g'
                AND conversion.factor > 0
                AND conversion.status IN ('candidate', 'published')
                AND conversion.confidence_level IN ('A', 'B')
            )
            OR NOT EXISTS (
              SELECT 1
              FROM catalog.food_nutrition_profiles profile
              WHERE profile.food_form_id = requirement.preferred_food_form_id
                AND profile.is_primary
                AND profile.basis_quantity = 100
                AND profile.basis_unit = 'g'
                AND profile.confidence_level IN ('A', 'B')
                AND (
                  SELECT count(DISTINCT value.nutrient_code)
                  FROM catalog.food_nutrient_values value
                  WHERE value.nutrition_profile_id = profile.id
                    AND value.nutrient_code IN ('energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g')
                ) = 4
            )
          )
      )
  ),
  paged AS (
    SELECT *
    FROM qualified
    ORDER BY code
    LIMIT greatest(1, least(coalesce(p_limit, 100), 100))
    OFFSET greatest(0, least(coalesce(p_offset, 0), 10000))
  ),
  assembled AS (
    SELECT
      recipe.code,
      jsonb_build_object(
        'familyId', recipe.recipe_family_id,
        'recipeVersionId', recipe.recipe_version_id,
        'code', recipe.code,
        'family', recipe.family_name,
        'title', recipe.title,
        'description', recipe.description,
        'cuisineOrigin', recipe.cuisine_origin,
        'identityLevel', recipe.identity_level,
        'category', recipe.dish_structure,
        'servings', recipe.servings,
        'prepMinutes', coalesce(recipe.prep_minutes, 0),
        'cookMinutes', coalesce(recipe.cook_minutes, 0),
        'restMinutes', coalesce(recipe.rest_minutes, 0),
        'difficulty', recipe.difficulty,
        'confidence', recipe.quality_level,
        'familyConfidence', recipe.family_confidence,
        'catalogStatus', 'operational_candidate',
        'publicationStatus', recipe.publication_status,
        'familyStatus', recipe.family_status,
        'allergens', to_jsonb(recipe.allergens),
        'techniques', to_jsonb(recipe.techniques),
        'variants', to_jsonb(recipe.variant_candidates),
        'conservation', recipe.conservation_text,
        -- CONTRAT OPÉRATIONNEL : le profil traduit vers le contrat de lecture,
        -- et la lignée. `derivedFrom` porte le CODE de la base, pas son uuid :
        -- c'est le code que le moteur compare (recipeLineage), et un uuid
        -- changerait à chaque rechargement du corpus.
        'conservationProfile', culinary.conservation_profile_contract(recipe.conservation_profile),
        'derivedFrom', recipe.derived_from_code,
        'canonicalArbitration', NULL,
        'sensory', jsonb_build_object(
          'profile', recipe.sensory_profile,
          'scores', recipe.sensory_scores,
          'dominant_flavors', to_jsonb(recipe.dominant_flavors),
          'aroma_families', to_jsonb(recipe.aroma_families),
          'target_textures', to_jsonb(recipe.target_textures),
          'signature_ingredients', to_jsonb(recipe.signature_ingredients),
          'identity_guardrails', to_jsonb(recipe.identity_guardrails)
        ),
        'sources', jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
          'dataset', recipe.source_dataset_code,
          'datasetName', recipe.source_dataset_name,
          'version', recipe.source_dataset_version,
          'recordKey', recipe.code,
          'url', recipe.source_url,
          'license', recipe.source_license
        ))),
        'exactIngredients', coalesce(ingredients.items, '[]'::jsonb),
        'exactSteps', coalesce(steps.items, '[]'::jsonb)
      ) AS payload
    FROM paged recipe
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object(
          'foodFormId', form.id,
          'name', form.canonical_name,
          'formNormalized', form.canonical_name_normalized,
          'quantity', requirement.quantity,
          'unit', requirement.unit,
          'grams', round(requirement.quantity * conversion.factor, 4),
          'per100g', nutrients.per_100g,
          'role', requirement.culinary_role,
          'preparationNote', requirement.preparation_note,
          'optional', requirement.is_optional,
          'strictness', requirement.strictness,
          'category', category.code,
          'source', nutrition_source.code,
          'sourceRecordKey', profile.source_record_key,
          -- CONTRAT OPÉRATIONNEL : l'origine biologique de la forme. Sans elle,
          -- chaque ingrédient servi par l'API était « inconnu » et plus aucun
          -- plat n'était végétarien en production (operationalCatalog.js:13).
          'origin', form.origin,
          -- CONTRAT OPÉRATIONNEL : la base partagée qu'un ingrédient déclare.
          -- Même forme que dans la RPC éditoriale (20260729140000:255), pour
          -- qu'un plat ait le même component quel que soit le chemin.
          'component', CASE WHEN child_version.id IS NULL THEN NULL ELSE jsonb_build_object(
            'code', upper(child_version.source_record_key),
            'name', component.name,
            'requiredQuantity', component.required_quantity,
            'requiredUnit', component.required_unit,
            'yieldQuantity', child_version.yield_quantity,
            'yieldUnit', child_version.yield_unit
          ) END
        ) ORDER BY requirement.position
      ) AS items
      FROM culinary.recipe_ingredient_requirements requirement
      JOIN catalog.food_forms form ON form.id = requirement.preferred_food_form_id
      JOIN catalog.food_concepts concept ON concept.id = form.food_concept_id
      JOIN catalog.food_categories category ON category.id = concept.category_id
      -- CONTRAT OPÉRATIONNEL : deux LEFT JOIN, donc aucun ingrédient ne
      -- disparaît faute de composant. Un ingrédient ordinaire rend
      -- `component: null`, ce que materializeOperationalRecipe attend déjà.
      LEFT JOIN culinary.recipe_components component ON component.id = requirement.component_id
      LEFT JOIN culinary.recipe_versions child_version ON child_version.id = component.sub_recipe_version_id
      JOIN LATERAL (
        SELECT candidate.factor
        FROM catalog.food_unit_conversions candidate
        WHERE candidate.food_form_id = form.id
          AND candidate.from_unit = requirement.unit
          AND candidate.to_unit = 'g'
          AND candidate.factor > 0
          AND candidate.status IN ('candidate', 'published')
          AND candidate.confidence_level IN ('A', 'B')
        ORDER BY CASE candidate.status WHEN 'published' THEN 0 ELSE 1 END,
                 CASE candidate.confidence_level WHEN 'A' THEN 0 ELSE 1 END
        LIMIT 1
      ) conversion ON true
      JOIN LATERAL (
        SELECT candidate.id, candidate.source_dataset_id, candidate.source_record_key
        FROM catalog.food_nutrition_profiles candidate
        WHERE candidate.food_form_id = form.id
          AND candidate.is_primary
          AND candidate.basis_quantity = 100
          AND candidate.basis_unit = 'g'
          AND candidate.confidence_level IN ('A', 'B')
        ORDER BY CASE candidate.confidence_level WHEN 'A' THEN 0 ELSE 1 END,
                 candidate.published_at DESC NULLS LAST
        LIMIT 1
      ) profile ON true
      LEFT JOIN ops.source_datasets nutrition_source ON nutrition_source.id = profile.source_dataset_id
      JOIN LATERAL (
        SELECT jsonb_build_object(
          'kcal', max(value.amount) FILTER (WHERE value.nutrient_code = 'energy_kcal'),
          'proteinG', max(value.amount) FILTER (WHERE value.nutrient_code = 'protein_g'),
          'carbsG', max(value.amount) FILTER (WHERE value.nutrient_code = 'carbohydrate_g'),
          'fatG', max(value.amount) FILTER (WHERE value.nutrient_code = 'fat_g'),
          'fiberG', max(value.amount) FILTER (WHERE value.nutrient_code = 'fiber_g'),
          'saltG', max(value.amount) FILTER (WHERE value.nutrient_code = 'salt_g'),
          'sugarsG', max(value.amount) FILTER (WHERE value.nutrient_code = 'sugars_g'),
          'saturatedFatG', max(value.amount) FILTER (WHERE value.nutrient_code = 'saturated_fat_g')
        ) AS per_100g
        FROM catalog.food_nutrient_values value
        WHERE value.nutrition_profile_id = profile.id
        HAVING count(DISTINCT value.nutrient_code) FILTER (
          WHERE value.nutrient_code IN ('energy_kcal', 'protein_g', 'carbohydrate_g', 'fat_g')
        ) = 4
      ) nutrients ON true
      WHERE requirement.recipe_version_id = recipe.recipe_version_id
    ) ingredients ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object(
        'n', step.step_number,
        'instruction', step.instruction,
        'activeMinutes', step.active_minutes,
        'passiveMinutes', step.passive_minutes,
        'temperatureC', step.temperature_c,
        'targetCoreTemperatureC', step.target_core_temperature_c,
        'equipmentCodes', to_jsonb(step.equipment_codes),
        'safetyCritical', step.safety_critical
      ) ORDER BY step.step_number) AS items
      FROM culinary.recipe_steps step
      WHERE step.recipe_version_id = recipe.recipe_version_id
        AND step.branch_id IS NULL
    ) steps ON true
  )
  SELECT jsonb_build_object(
    -- CONTRAT OPÉRATIONNEL : la version du contrat change avec la projection.
    -- Un lecteur qui voudrait un jour savoir s'il parle à une base qui publie
    -- les quatre champs le lit ici plutôt que de sonder une recette.
    'contractVersion', 'v3-operational-2',
    'metadata', jsonb_build_object(
      'source', 'supabase',
      'catalogStatus', 'operational_candidate',
      'corpusVersion', coalesce((SELECT max(source_dataset_version) FROM qualified), 'unknown'),
      'eligibleCount', (SELECT count(*) FROM qualified),
      'returnedCount', count(*),
      'limit', greatest(1, least(coalesce(p_limit, 100), 100)),
      'offset', greatest(0, least(coalesce(p_offset, 0), 10000))
    ),
    'recipes', coalesce(jsonb_agg(assembled.payload ORDER BY assembled.code), '[]'::jsonb)
  )
  INTO result
  FROM assembled;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_operational_recipe_catalog_v3(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_operational_recipe_catalog_v3(text, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_operational_recipe_catalog_v3(text, integer, integer) TO authenticated;

COMMENT ON FUNCTION public.get_operational_recipe_catalog_v3(text, integer, integer) IS
  'Contrat de lecture V3 authentifié. Expose les candidats opérationnels passant les portes de forme exacte, de conversion et de macros déterministes ; ne les publie pas. Depuis le contrat opérationnel (20260917110000), publie aussi l''origine de chaque forme, le profil de conservation, la base partagée d''un ingrédient et la lignée de la recette.';
