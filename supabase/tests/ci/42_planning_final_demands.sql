-- Assertions CI — Planning V5, modèle unique de demande finale.
-- Scénario A : migration hors périmètre, test ignoré.
-- Scénario B : contrat, structures et invariants de publication obligatoires.

DO $$
DECLARE
  v_exists boolean;
  v_count integer;
  v_def text;
  v_compat jsonb;
BEGIN
  SELECT to_regclass('public.planned_demands') IS NOT NULL INTO v_exists;
  IF NOT v_exists THEN
    RAISE NOTICE '[planning-v5] migration hors périmètre — assertions ignorées.';
    RETURN;
  END IF;

  SELECT count(*) INTO v_count
  FROM information_schema.columns
  WHERE (table_schema, table_name, column_name) IN (
    ('public', 'meal_plan_slots', 'execution_key'),
    ('public', 'nutrition_plan_meals', 'demand_key'),
    ('public', 'nutrition_plan_meals', 'execution_key'),
    ('public', 'nutrition_plan_meals', 'constraints_snapshot'),
    ('public', 'nutrition_plan_meals', 'planning_status'),
    ('public', 'nutrition_plan_meals', 'micronutrients'),
    ('public', 'nutrition_plan_shopping_items', 'exact_required_qty'),
    ('public', 'nutrition_plan_shopping_items', 'projected_surplus_qty'),
    ('public', 'nutrition_plan_shopping_items', 'purchase_decision'),
    ('public', 'planned_productions', 'recipe_execution_id'),
    ('public', 'cooked_dishes', 'canonical_recipe_code'),
    ('public', 'cooked_dishes', 'canonical_recipe_execution_id'),
    ('public', 'cooked_dishes', 'planned_production_id'),
    ('public', 'cooked_dishes', 'source_plan_version_id')
  );
  IF v_count <> 14 THEN
    RAISE EXCEPTION '[planning-v5] colonnes additives : 14 attendues, % trouvées', v_count;
  END IF;

  IF to_regprocedure('public.publish_canonical_final_demand_plan(jsonb)') IS NULL
     OR to_regprocedure('public.planning_schema_compatibility()') IS NULL THEN
    RAISE EXCEPTION '[planning-v5] fonctions de contrat absentes';
  END IF;

  SELECT public.planning_schema_compatibility() INTO v_compat;
  IF COALESCE((v_compat->>'compatible')::boolean, false) IS NOT TRUE
     OR (v_compat->>'contract_version')::integer <> 5 THEN
    RAISE EXCEPTION '[planning-v5] contrat incompatible : %', v_compat;
  END IF;

  v_def := pg_get_functiondef('public.publish_canonical_final_demand_plan(jsonb)'::regprocedure);
  IF v_def NOT LIKE '%execution_demand_servings_mismatch%'
     OR v_def NOT LIKE '%shopping_resource_balance_invalid%'
     OR v_def NOT LIKE '%production_final_demand_portions_mismatch%'
     OR v_def NOT LIKE '%forbidden_food_in_final_demand%'
     OR v_def NOT LIKE '%reservation_after_lot_expiry%' THEN
    RAISE EXCEPTION '[planning-v5] invariants atomiques incomplets';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'planned_productions'
    AND t.tgname = 'trg_sync_materialized_production_identity'
    AND NOT t.tgisinternal;
  IF v_count <> 1 THEN
    RAISE EXCEPTION '[planning-v5] trigger identité plat absent';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'planned_demands'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%requested_servings <=%2%';
  IF v_count < 1 THEN
    RAISE EXCEPTION '[planning-v5] plafond de portion finale absent';
  END IF;

  SELECT count(*) INTO v_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_planned_demands_slot_id',
      'idx_planned_demands_user_id',
      'idx_planned_productions_recipe_execution_id',
      'idx_cooked_dishes_canonical_recipe_execution_id',
      'idx_cooked_dishes_planned_production_id',
      'idx_cooked_dishes_source_plan_version_id'
    );
  IF v_count <> 6 THEN
    RAISE EXCEPTION '[planning-v5] index de clés étrangères : 6 attendus, % trouvés', v_count;
  END IF;

  RAISE NOTICE '[planning-v5] contrat, identité et invariants présents.';
END $$;
