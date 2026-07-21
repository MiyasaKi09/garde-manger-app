-- Canary transactionnel Planning V5 sur la base cible.
-- Il utilise un foyer et deux recettes éligibles, crée ses ressources de test,
-- publie un plan complet, vérifie la chaîne, puis ROLLBACK : aucune donnée ne
-- subsiste et aucun planning utilisateur n'est remplacé durablement.

BEGIN;

DO $canary$
DECLARE
  v_uid uuid;
  v_member_a uuid;
  v_member_b uuid;
  v_member_a_name text;
  v_member_b_name text;
  v_recipe_a text;
  v_recipe_b text;
  v_canonical_food_id bigint;
  v_dish_id bigint;
  v_lot_id uuid;
  v_start date := current_date + 370;
  v_nonce text := gen_random_uuid()::text;
  v_hash_a text;
  v_hash_b text;
  v_hash_dish text;
  v_hash_production text;
  v_payload jsonb;
  v_result jsonb;
  v_version uuid;
  v_count integer;
BEGIN
  SELECT hm.user_id, hm.id, hm.name
  INTO v_uid, v_member_a, v_member_a_name
  FROM public.household_members hm
  WHERE hm.active = true
  ORDER BY hm.created_at
  LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION '[planning-canary] aucun foyer actif disponible';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_uid::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_uid, 'role', 'authenticated')::text, true);

  v_member_b_name := 'Canary ' || left(v_nonce, 8);
  INSERT INTO public.household_members (user_id, name, preferences)
  VALUES (v_uid, v_member_b_name, '{"planning":{"breakfast":true,"snack":true}}'::jsonb)
  RETURNING id INTO v_member_b;

  SELECT min(source_record_key), max(source_record_key)
  INTO v_recipe_a, v_recipe_b
  FROM (
    SELECT DISTINCT rv.source_record_key
    FROM culinary.recipe_versions rv
    WHERE rv.planning_eligible = true
      AND NULLIF(rv.source_record_key, '') IS NOT NULL
    ORDER BY rv.source_record_key
    LIMIT 2
  ) recipes;
  IF v_recipe_a IS NULL OR v_recipe_b IS NULL OR v_recipe_a = v_recipe_b THEN
    RAISE EXCEPTION '[planning-canary] deux recettes éligibles sont requises';
  END IF;

  SELECT id
  INTO v_canonical_food_id
  FROM public.canonical_foods
  ORDER BY id
  LIMIT 1;
  IF v_canonical_food_id IS NULL THEN
    RAISE EXCEPTION '[planning-canary] un aliment canonique est requis';
  END IF;

  INSERT INTO public.cooked_dishes (
    user_id, name, portions_cooked, portions_remaining, storage_method,
    cooked_at, expiration_date, kcal_per_portion, protein_g_per_portion,
    carbs_g_per_portion, fat_g_per_portion, fiber_g_per_portion,
    canonical_recipe_code
  ) VALUES (
    v_uid, 'Canary reste ' || left(v_nonce, 8), 1, 1, 'fridge',
    now(), v_start + 10, 300, 20, 35, 8, 6, v_recipe_a
  ) RETURNING id INTO v_dish_id;

  INSERT INTO public.inventory_lots (
    user_id, canonical_food_id, initial_qty, qty_remaining, unit, storage_method, acquired_on,
    expiration_date, adjusted_expiration_date, expiration_source,
    expiration_kind, notes
  ) VALUES (
    v_uid, v_canonical_food_id, 2, 2, 'g', 'pantry', v_start - 1,
    v_start, v_start, 'planning_canary', 'DLC', 'canary transactionnel'
  ) RETURNING id INTO v_lot_id;

  v_hash_a := md5(v_nonce || ':base:1') || md5(v_nonce || ':base:2');
  v_hash_b := md5(v_nonce || ':variant:1') || md5(v_nonce || ':variant:2');
  v_hash_dish := md5(v_nonce || ':dish:1') || md5(v_nonce || ':dish:2');
  v_hash_production := md5(v_nonce || ':production:1') || md5(v_nonce || ':production:2');

  v_payload := jsonb_build_object(
    'source', 'planning_v5_transaction_canary',
    'rules_version', 'myko-v5-canary',
    'window_start', v_start,
    'window_end', v_start + 6,
    'month_label', 'Canary V5',
    'input_hash', v_hash_a,
    'input_snapshot', jsonb_build_object('canary', true, 'nonce', v_nonce),
    'objective_scores', '{}'::jsonb,
    'validation_summary', jsonb_build_object('status', 'published', 'canary', true),
    'issues', '[]'::jsonb,
    'recipe_executions', jsonb_build_array(
      jsonb_build_object(
        'execution_key', 'canary-base', 'recipe_code', v_recipe_a, 'servings', 1,
        'selected_configuration', jsonb_build_object('source_mode', 'fresh_recipe', 'allergens', '[]'::jsonb),
        'exact_ingredients_snapshot', '[]'::jsonb, 'exact_steps_snapshot', '[]'::jsonb,
        'nutrition_snapshot', jsonb_build_object('total', jsonb_build_object('kcal', 300, 'proteinG', 20, 'carbsG', 35, 'fatG', 8, 'fiberG', 6)),
        'transformation_plan_snapshot', '[]'::jsonb, 'source_lot_plan_snapshot', '[]'::jsonb,
        'content_hash', v_hash_a
      ),
      jsonb_build_object(
        'execution_key', 'canary-variant', 'recipe_code', v_recipe_b, 'servings', 1,
        'selected_configuration', jsonb_build_object('source_mode', 'fresh_recipe', 'is_variant', true, 'allergens', '[]'::jsonb),
        'exact_ingredients_snapshot', '[]'::jsonb, 'exact_steps_snapshot', '[]'::jsonb,
        'nutrition_snapshot', jsonb_build_object('total', jsonb_build_object('kcal', 320, 'proteinG', 22, 'carbsG', 36, 'fatG', 9, 'fiberG', 7)),
        'transformation_plan_snapshot', '[]'::jsonb, 'source_lot_plan_snapshot', '[]'::jsonb,
        'content_hash', v_hash_b
      ),
      jsonb_build_object(
        'execution_key', 'canary-dish', 'recipe_code', v_recipe_a, 'servings', 0.5,
        'selected_configuration', jsonb_build_object('source_mode', 'existing_dish', 'allergens', '[]'::jsonb),
        'exact_ingredients_snapshot', '[]'::jsonb, 'exact_steps_snapshot', '[]'::jsonb,
        'nutrition_snapshot', jsonb_build_object('total', jsonb_build_object('kcal', 150, 'proteinG', 10, 'carbsG', 17.5, 'fatG', 4, 'fiberG', 3)),
        'transformation_plan_snapshot', '[]'::jsonb, 'source_lot_plan_snapshot', '[]'::jsonb,
        'content_hash', v_hash_dish
      ),
      jsonb_build_object(
        'execution_key', 'canary-production', 'recipe_code', v_recipe_a, 'servings', 3,
        'selected_configuration', jsonb_build_object('source_mode', 'planned_production', 'allergens', '[]'::jsonb),
        'exact_ingredients_snapshot', jsonb_build_array(jsonb_build_object('name', 'Canary grain', 'formNormalized', 'canary grain', 'grams', 10)),
        'exact_steps_snapshot', '[]'::jsonb,
        'nutrition_snapshot', jsonb_build_object('total', jsonb_build_object('kcal', 900, 'proteinG', 60, 'carbsG', 105, 'fatG', 24, 'fiberG', 18)),
        'transformation_plan_snapshot', '[]'::jsonb, 'source_lot_plan_snapshot', '[]'::jsonb,
        'content_hash', v_hash_production
      )
    ),
    'slots', jsonb_build_array(
      jsonb_build_object(
        'slot_key', 'canary-main', 'recipe_code', v_recipe_a, 'execution_key', 'canary-base',
        'meal_date', v_start, 'meal_type', 'dejeuner', 'title', 'Canary base + variante',
        'servings', 2, 'status', 'planned', 'locked', false, 'source', 'canonical_v3',
        'nutrition_by_member', jsonb_build_object(v_member_a_name, jsonb_build_object('kcal', 300), v_member_b_name, jsonb_build_object('kcal', 320)),
        'nutrition_total', jsonb_build_object('kcal', 620, 'proteinG', 42, 'carbsG', 71, 'fatG', 17, 'fiberG', 13),
        'preparation', jsonb_build_object('recipe_code', v_recipe_a), 'stock_summary', '{}'::jsonb
      ),
      jsonb_build_object(
        'slot_key', 'canary-pdj', 'meal_date', v_start, 'meal_type', 'pdj', 'title', 'Canary petit-déjeuner',
        'servings', 1, 'status', 'planned', 'locked', false, 'source', 'support',
        'nutrition_by_member', jsonb_build_object(v_member_a_name, jsonb_build_object('kcal', 200)),
        'nutrition_total', jsonb_build_object('kcal', 200, 'proteinG', 10, 'carbsG', 25, 'fatG', 6, 'fiberG', 4),
        'preparation', jsonb_build_object('mode', 'support'), 'stock_summary', '{}'::jsonb
      ),
      jsonb_build_object(
        'slot_key', 'canary-snack', 'meal_date', v_start, 'meal_type', 'collation', 'title', 'Canary collation',
        'servings', 1, 'status', 'planned', 'locked', false, 'source', 'support',
        'nutrition_by_member', jsonb_build_object(v_member_b_name, jsonb_build_object('kcal', 180)),
        'nutrition_total', jsonb_build_object('kcal', 180, 'proteinG', 8, 'carbsG', 24, 'fatG', 5, 'fiberG', 3),
        'preparation', jsonb_build_object('mode', 'support'), 'stock_summary', '{}'::jsonb
      ),
      jsonb_build_object(
        'slot_key', 'canary-leftover', 'recipe_code', v_recipe_a, 'execution_key', 'canary-dish',
        'cooked_dish_id', v_dish_id, 'meal_date', v_start + 1, 'meal_type', 'diner', 'title', 'Canary reste',
        'servings', 0.5, 'status', 'planned', 'locked', false, 'source', 'cooked_dish',
        'nutrition_by_member', jsonb_build_object(v_member_a_name, jsonb_build_object('kcal', 150)),
        'nutrition_total', jsonb_build_object('kcal', 150, 'proteinG', 10, 'carbsG', 17.5, 'fatG', 4, 'fiberG', 3),
        'preparation', jsonb_build_object('mode', 'reheat', 'recipe_code', v_recipe_a), 'stock_summary', '{}'::jsonb
      ),
      jsonb_build_object(
        'slot_key', 'canary-producer', 'recipe_code', v_recipe_a, 'execution_key', 'canary-production',
        'meal_date', v_start + 2, 'meal_type', 'dejeuner', 'title', 'Canary production',
        'servings', 1, 'status', 'planned', 'locked', false, 'source', 'canonical_v3',
        'nutrition_by_member', jsonb_build_object(v_member_a_name, jsonb_build_object('kcal', 300)),
        'nutrition_total', jsonb_build_object('kcal', 300, 'proteinG', 20, 'carbsG', 35, 'fatG', 8, 'fiberG', 6),
        'preparation', jsonb_build_object('recipe_code', v_recipe_a), 'stock_summary', '{}'::jsonb
      ),
      jsonb_build_object(
        'slot_key', 'canary-consumer', 'recipe_code', v_recipe_a, 'execution_key', 'canary-production',
        'meal_date', v_start + 3, 'meal_type', 'diner', 'title', 'Canary réchauffage',
        'servings', 1, 'status', 'planned', 'locked', false, 'source', 'planned_production',
        'nutrition_by_member', jsonb_build_object(v_member_b_name, jsonb_build_object('kcal', 300)),
        'nutrition_total', jsonb_build_object('kcal', 300, 'proteinG', 20, 'carbsG', 35, 'fatG', 8, 'fiberG', 6),
        'preparation', jsonb_build_object('mode', 'reheat', 'recipe_code', v_recipe_a), 'stock_summary', '{}'::jsonb
      )
    ),
    'legacy_meals', jsonb_build_array(
      jsonb_build_object('slot_key', 'canary-main', 'household_member_id', v_member_a, 'person_name', v_member_a_name, 'meal_date', v_start, 'meal_type', 'dejeuner', 'description', 'Canary base', 'short_label', 'Canary base', 'kcal', 300, 'protein_g', 20, 'carbs_g', 35, 'fat_g', 8, 'fiber_g', 6, 'planned_servings', 1, 'canonical_recipe_code', v_recipe_a, 'demand_key', 'canary-demand-base', 'execution_key', 'canary-base', 'variant_kind', 'household_base'),
      jsonb_build_object('slot_key', 'canary-main', 'household_member_id', v_member_b, 'person_name', v_member_b_name, 'meal_date', v_start, 'meal_type', 'dejeuner', 'description', 'Canary variante', 'short_label', 'Canary variante', 'kcal', 320, 'protein_g', 22, 'carbs_g', 36, 'fat_g', 9, 'fiber_g', 7, 'planned_servings', 1, 'canonical_recipe_code', v_recipe_b, 'demand_key', 'canary-demand-variant', 'execution_key', 'canary-variant', 'variant_kind', 'constraint_substitution'),
      jsonb_build_object('slot_key', 'canary-pdj', 'household_member_id', v_member_a, 'person_name', v_member_a_name, 'meal_date', v_start, 'meal_type', 'pdj', 'description', 'Canary petit-déjeuner', 'short_label', 'Petit-déjeuner', 'kcal', 200, 'protein_g', 10, 'carbs_g', 25, 'fat_g', 6, 'fiber_g', 4, 'planned_servings', 1, 'demand_key', 'canary-demand-pdj'),
      jsonb_build_object('slot_key', 'canary-snack', 'household_member_id', v_member_b, 'person_name', v_member_b_name, 'meal_date', v_start, 'meal_type', 'collation', 'description', 'Canary collation', 'short_label', 'Collation', 'kcal', 180, 'protein_g', 8, 'carbs_g', 24, 'fat_g', 5, 'fiber_g', 3, 'planned_servings', 1, 'demand_key', 'canary-demand-snack'),
      jsonb_build_object('slot_key', 'canary-leftover', 'household_member_id', v_member_a, 'person_name', v_member_a_name, 'meal_date', v_start + 1, 'meal_type', 'diner', 'description', 'Canary reste', 'short_label', 'Reste', 'kcal', 150, 'protein_g', 10, 'carbs_g', 17.5, 'fat_g', 4, 'fiber_g', 3, 'planned_servings', 0.5, 'canonical_recipe_code', v_recipe_a, 'demand_key', 'canary-demand-dish', 'execution_key', 'canary-dish'),
      jsonb_build_object('slot_key', 'canary-producer', 'household_member_id', v_member_a, 'person_name', v_member_a_name, 'meal_date', v_start + 2, 'meal_type', 'dejeuner', 'description', 'Canary production', 'short_label', 'Production', 'kcal', 300, 'protein_g', 20, 'carbs_g', 35, 'fat_g', 8, 'fiber_g', 6, 'planned_servings', 1, 'canonical_recipe_code', v_recipe_a, 'demand_key', 'canary-demand-producer', 'execution_key', 'canary-production'),
      jsonb_build_object('slot_key', 'canary-consumer', 'household_member_id', v_member_b, 'person_name', v_member_b_name, 'meal_date', v_start + 3, 'meal_type', 'diner', 'description', 'Canary réchauffage', 'short_label', 'Réchauffage', 'kcal', 300, 'protein_g', 20, 'carbs_g', 35, 'fat_g', 8, 'fiber_g', 6, 'planned_servings', 1, 'canonical_recipe_code', v_recipe_a, 'demand_key', 'canary-demand-consumer', 'execution_key', 'canary-production')
    ),
    'planned_demands', jsonb_build_array(
      jsonb_build_object('demand_key', 'canary-demand-base', 'slot_key', 'canary-main', 'household_member_id', v_member_a, 'person_name', v_member_a_name, 'meal_date', v_start, 'meal_type', 'dejeuner', 'recipe_code', v_recipe_a, 'requested_servings', 1, 'source_type', 'fresh_recipe', 'source_id', 'canary-main', 'execution_key', 'canary-base', 'nutritional_target', '{}'::jsonb, 'constraints_snapshot', '{"forbiddenForms":[],"allergens":[]}'::jsonb, 'nutrition', '{"kcal":300,"proteinG":20,"carbsG":35,"fatG":8,"fiberG":6}'::jsonb),
      jsonb_build_object('demand_key', 'canary-demand-variant', 'slot_key', 'canary-main', 'household_member_id', v_member_b, 'person_name', v_member_b_name, 'meal_date', v_start, 'meal_type', 'dejeuner', 'recipe_code', v_recipe_b, 'requested_servings', 1, 'source_type', 'fresh_recipe', 'source_id', 'canary-main', 'execution_key', 'canary-variant', 'nutritional_target', '{}'::jsonb, 'constraints_snapshot', '{"forbiddenForms":[],"allergens":[]}'::jsonb, 'nutrition', '{"kcal":320,"proteinG":22,"carbsG":36,"fatG":9,"fiberG":7}'::jsonb),
      jsonb_build_object('demand_key', 'canary-demand-pdj', 'slot_key', 'canary-pdj', 'household_member_id', v_member_a, 'person_name', v_member_a_name, 'meal_date', v_start, 'meal_type', 'pdj', 'requested_servings', 1, 'source_type', 'support', 'source_id', 'canary-pdj', 'nutritional_target', '{}'::jsonb, 'constraints_snapshot', '{"forbiddenForms":[],"allergens":[]}'::jsonb, 'nutrition', '{"kcal":200,"proteinG":10,"carbsG":25,"fatG":6,"fiberG":4}'::jsonb, 'support_items', '[{"food":"canary"}]'::jsonb),
      jsonb_build_object('demand_key', 'canary-demand-snack', 'slot_key', 'canary-snack', 'household_member_id', v_member_b, 'person_name', v_member_b_name, 'meal_date', v_start, 'meal_type', 'collation', 'requested_servings', 1, 'source_type', 'support', 'source_id', 'canary-snack', 'nutritional_target', '{}'::jsonb, 'constraints_snapshot', '{"forbiddenForms":[],"allergens":[]}'::jsonb, 'nutrition', '{"kcal":180,"proteinG":8,"carbsG":24,"fatG":5,"fiberG":3}'::jsonb, 'support_items', '[{"food":"canary"}]'::jsonb),
      jsonb_build_object('demand_key', 'canary-demand-dish', 'slot_key', 'canary-leftover', 'household_member_id', v_member_a, 'person_name', v_member_a_name, 'meal_date', v_start + 1, 'meal_type', 'diner', 'recipe_code', v_recipe_a, 'requested_servings', 0.5, 'source_type', 'existing_dish', 'source_id', v_dish_id::text, 'execution_key', 'canary-dish', 'nutritional_target', '{}'::jsonb, 'constraints_snapshot', '{"forbiddenForms":[],"allergens":[]}'::jsonb, 'nutrition', '{"kcal":150,"proteinG":10,"carbsG":17.5,"fatG":4,"fiberG":3}'::jsonb),
      jsonb_build_object('demand_key', 'canary-demand-producer', 'slot_key', 'canary-producer', 'household_member_id', v_member_a, 'person_name', v_member_a_name, 'meal_date', v_start + 2, 'meal_type', 'dejeuner', 'recipe_code', v_recipe_a, 'requested_servings', 1, 'source_type', 'planned_production', 'source_id', 'canary-fridge', 'execution_key', 'canary-production', 'nutritional_target', '{}'::jsonb, 'constraints_snapshot', '{"forbiddenForms":[],"allergens":[]}'::jsonb, 'nutrition', '{"kcal":300,"proteinG":20,"carbsG":35,"fatG":8,"fiberG":6}'::jsonb),
      jsonb_build_object('demand_key', 'canary-demand-consumer', 'slot_key', 'canary-consumer', 'household_member_id', v_member_b, 'person_name', v_member_b_name, 'meal_date', v_start + 3, 'meal_type', 'diner', 'recipe_code', v_recipe_a, 'requested_servings', 1, 'source_type', 'planned_production', 'source_id', 'canary-fridge', 'execution_key', 'canary-production', 'nutritional_target', '{}'::jsonb, 'constraints_snapshot', '{"forbiddenForms":[],"allergens":[]}'::jsonb, 'nutrition', '{"kcal":300,"proteinG":20,"carbsG":35,"fatG":8,"fiberG":6}'::jsonb),
      jsonb_build_object('demand_key', 'canary-demand-future', 'slot_key', 'canary-producer', 'meal_date', v_start + 2, 'meal_type', 'dejeuner', 'recipe_code', v_recipe_a, 'requested_servings', 1, 'source_type', 'future_buffer', 'source_id', 'canary-freezer', 'execution_key', 'canary-production', 'nutritional_target', '{}'::jsonb, 'constraints_snapshot', '{"forbiddenForms":[],"allergens":[]}'::jsonb, 'nutrition', '{"kcal":300,"proteinG":20,"carbsG":35,"fatG":8,"fiberG":6}'::jsonb)
    ),
    'reservations', jsonb_build_array(
      jsonb_build_object('slot_key', 'canary-pdj', 'lot_id', v_lot_id, 'ingredient_name', 'Canary proche DLC', 'reserved_quantity', 0.5, 'reserved_unit', 'g', 'needed_quantity', 0.5, 'needed_unit', 'g', 'metadata', jsonb_build_object('needed_on', v_start, 'expires_on', v_start, 'support', true)),
      jsonb_build_object('slot_key', 'canary-leftover', 'cooked_dish_id', v_dish_id, 'ingredient_name', 'Canary reste', 'reserved_quantity', 0.5, 'reserved_unit', 'portion', 'needed_quantity', 0.5, 'needed_unit', 'portion', 'metadata', jsonb_build_object('needed_on', v_start + 1, 'expires_on', v_start + 10))
    ),
    'tasks', jsonb_build_array(
      jsonb_build_object('task_key', 'canary-prepare-main', 'slot_key', 'canary-main', 'prep_date', v_start, 'title', 'Canary variante', 'task_type', 'prepare_recipe_variant', 'duration_min', 5, 'priority', 70, 'instructions', '[]'::jsonb),
      jsonb_build_object('task_key', 'canary-support', 'slot_key', 'canary-pdj', 'prep_date', v_start, 'title', 'Canary support', 'task_type', 'prepare_support', 'duration_min', 5, 'priority', 60, 'instructions', '[]'::jsonb),
      jsonb_build_object('task_key', 'canary-reheat-leftover', 'slot_key', 'canary-leftover', 'prep_date', v_start + 1, 'title', 'Canary reste', 'task_type', 'reheat_dish', 'duration_min', 5, 'priority', 80, 'instructions', '[]'::jsonb),
      jsonb_build_object('task_key', 'canary-prepare-production', 'slot_key', 'canary-producer', 'prep_date', v_start + 2, 'title', 'Canary production', 'task_type', 'prepare_recipe', 'duration_min', 10, 'priority', 70, 'instructions', '[]'::jsonb),
      jsonb_build_object('task_key', 'canary-freeze-production', 'slot_key', 'canary-producer', 'prep_date', v_start + 2, 'title', 'Canary congélation', 'task_type', 'freeze_dish', 'duration_min', 5, 'priority', 75, 'instructions', '[]'::jsonb),
      jsonb_build_object('task_key', 'canary-reheat-production', 'slot_key', 'canary-consumer', 'prep_date', v_start + 3, 'title', 'Canary réchauffage', 'task_type', 'reheat_dish', 'duration_min', 5, 'priority', 75, 'instructions', '[]'::jsonb)
    ),
    'dependencies', jsonb_build_array(
      jsonb_build_object('task_key', 'canary-freeze-production', 'depends_on_task_key', 'canary-prepare-production'),
      jsonb_build_object('task_key', 'canary-reheat-production', 'depends_on_task_key', 'canary-prepare-production')
    ),
    'productions', jsonb_build_array(
      jsonb_build_object('production_key', 'canary-fridge', 'task_key', 'canary-prepare-production', 'slot_key', 'canary-producer', 'recipe_code', v_recipe_a, 'execution_key', 'canary-production', 'output_name', 'Canary réfrigéré', 'planned_portions', 2, 'storage_method', 'refrigerator', 'available_from', v_start + 2, 'use_by', v_start + 5),
      jsonb_build_object('production_key', 'canary-freezer', 'task_key', 'canary-freeze-production', 'slot_key', 'canary-producer', 'recipe_code', v_recipe_a, 'execution_key', 'canary-production', 'output_name', 'Canary congelé', 'planned_portions', 1, 'storage_method', 'freezer', 'available_from', v_start + 2, 'use_by', v_start + 32)
    ),
    'consumptions', jsonb_build_array(
      jsonb_build_object('slot_key', 'canary-leftover', 'source', jsonb_build_object('cooked_dish_id', v_dish_id), 'portions', 0.5, 'role', 'main'),
      jsonb_build_object('slot_key', 'canary-producer', 'source', jsonb_build_object('production_key', 'canary-fridge'), 'portions', 1, 'role', 'main'),
      jsonb_build_object('slot_key', 'canary-consumer', 'source', jsonb_build_object('production_key', 'canary-fridge'), 'portions', 1, 'role', 'main')
    ),
    'shopping_items', jsonb_build_array(
      jsonb_build_object('week_label', 'S1', 'category', 'Épicerie', 'product_name', 'Canary grain', 'display_quantity', '1 sachet de 10 g', 'required_qty', 10, 'stock_qty', 1, 'reserved_qty', 1, 'incoming_qty', 1, 'purchase_qty', 10, 'exact_required_qty', 9, 'projected_surplus_qty', 1, 'purchase_unit', 'g', 'container_qty', 1, 'container_size', 10, 'container_unit', 'g', 'purchase_decision', '{"exact_shortage":9,"physical_purchase":10,"projected_surplus":1}'::jsonb, 'shopping_status', 'needed', 'planning_source', 'final_demands', 'aisle_order', 50, 'shortage_reason', 'canary', 'needed_by', v_start + 2)
    )
  );

  SELECT public.publish_canonical_final_demand_plan(v_payload) INTO v_result;
  v_version := (v_result->>'plan_version_id')::uuid;
  IF v_result->>'status' <> 'published' OR (v_result->>'contract_version')::integer <> 5 THEN
    RAISE EXCEPTION '[planning-canary] publication inattendue : %', v_result;
  END IF;

  SELECT count(*) INTO v_count FROM public.planned_demands WHERE plan_version_id = v_version;
  IF v_count <> 8 THEN RAISE EXCEPTION '[planning-canary] demandes : 8 attendues, %', v_count; END IF;
  SELECT count(*) INTO v_count FROM public.meal_plan_slots WHERE plan_version_id = v_version AND source = 'support';
  IF v_count <> 2 THEN RAISE EXCEPTION '[planning-canary] supports : 2 attendus, %', v_count; END IF;
  SELECT count(*) INTO v_count FROM public.planned_demands WHERE plan_version_id = v_version AND recipe_code = v_recipe_b;
  IF v_count <> 1 THEN RAISE EXCEPTION '[planning-canary] variante absente'; END IF;
  SELECT count(*) INTO v_count FROM public.inventory_reservations r JOIN public.inventory_lots l ON l.id = r.lot_id JOIN public.meal_plan_slots s ON s.id = r.slot_id WHERE r.plan_version_id = v_version AND COALESCE(l.adjusted_expiration_date, l.expiration_date) = s.meal_date;
  IF v_count <> 1 THEN RAISE EXCEPTION '[planning-canary] lot proche DLC absent'; END IF;
  SELECT count(*) INTO v_count FROM public.inventory_reservations WHERE plan_version_id = v_version AND cooked_dish_id = v_dish_id;
  IF v_count <> 1 THEN RAISE EXCEPTION '[planning-canary] reste absent'; END IF;
  SELECT count(DISTINCT storage_method) INTO v_count FROM public.planned_productions WHERE plan_version_id = v_version;
  IF v_count <> 2 THEN RAISE EXCEPTION '[planning-canary] réfrigérateur + congélateur attendus'; END IF;
  SELECT count(*) INTO v_count FROM public.prep_task_dependencies WHERE plan_version_id = v_version;
  IF v_count <> 2 THEN RAISE EXCEPTION '[planning-canary] dépendances : 2 attendues, %', v_count; END IF;
  SELECT count(*) INTO v_count FROM public.nutrition_plan_shopping_items WHERE plan_version_id = v_version AND exact_required_qty = 9 AND purchase_qty = 10 AND projected_surplus_qty = 1;
  IF v_count <> 1 THEN RAISE EXCEPTION '[planning-canary] achat physique absent'; END IF;

  RAISE NOTICE '[planning-canary] OK — variante, supports, DLC, reste, réfrigération, congélation et achat physique validés.';
END;
$canary$;

ROLLBACK;
