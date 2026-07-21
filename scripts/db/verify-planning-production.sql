-- Vérification non destructive du contrat Planning après migration et avant
-- déploiement applicatif. Toute violation arrête psql avec ON_ERROR_STOP=1.

DO $$
DECLARE
  v_compat jsonb;
  v_count integer;
BEGIN
  SELECT public.planning_schema_compatibility() INTO v_compat;
  IF COALESCE((v_compat->>'compatible')::boolean, false) IS NOT TRUE
     OR (v_compat->>'contract_version')::integer <> 5 THEN
    RAISE EXCEPTION '[planning-release] contrat incompatible : %', v_compat;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.inventory_reservations r
  JOIN public.inventory_lots l ON l.id = r.lot_id
  JOIN public.meal_plan_slots s ON s.id = r.slot_id
  WHERE r.status = 'active'
    AND COALESCE(l.adjusted_expiration_date, l.expiration_date) IS NOT NULL
    AND COALESCE(l.adjusted_expiration_date, l.expiration_date) < s.meal_date;
  IF v_count <> 0 THEN
    RAISE EXCEPTION '[planning-release] % réservation(s) actives après péremption', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.inventory_reservations r
  JOIN public.meal_plan_versions v ON v.id = r.plan_version_id
  WHERE r.status = 'active'
    AND v.status NOT IN ('published', 'review_required');
  IF v_count <> 0 THEN
    RAISE EXCEPTION '[planning-release] % réservation(s) sur une version inactive', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.inventory_reservations r
  JOIN public.meal_plan_slots s ON s.id = r.slot_id
  WHERE r.plan_version_id <> s.plan_version_id;
  IF v_count <> 0 THEN
    RAISE EXCEPTION '[planning-release] % réservation(s) inter-version', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.prep_task_dependencies d
  JOIN public.nutrition_plan_prep_tasks child ON child.id = d.task_id
  JOIN public.nutrition_plan_prep_tasks parent ON parent.id = d.depends_on_task_id
  WHERE d.plan_version_id <> child.plan_version_id
     OR d.plan_version_id <> parent.plan_version_id;
  IF v_count <> 0 THEN
    RAISE EXCEPTION '[planning-release] % dépendance(s) de tâche inter-version', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.meal_plan_versions v
  JOIN public.meal_plan_validation_issues i ON i.plan_version_id = v.id
  WHERE v.status = 'published'
    AND i.resolved_at IS NULL
    AND i.severity IN ('blocker', 'error');
  IF v_count <> 0 THEN
    RAISE EXCEPTION '[planning-release] % blocage(s) sur un plan publié', v_count;
  END IF;

  -- Un plan de l'ancien moteur peut rester publié dans l'historique passé,
  -- mais jamais pour une fenêtre encore active ou future.
  SELECT count(*) INTO v_count
  FROM public.meal_plan_versions
  WHERE rules_version = 'legacy-myko-v3-weekly-deterministic-2'
    AND status = 'published'
    AND window_end >= current_date;
  IF v_count <> 0 THEN
    RAISE EXCEPTION '[planning-release] % plan(s) legacy encore publiés sur l’horizon actif', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.planned_demands
  WHERE status <> 'consumed'
    AND person_name IS NOT NULL
    AND requested_servings > 2;
  IF v_count <> 0 THEN
    RAISE EXCEPTION '[planning-release] % demande(s) au-dessus de 2 portions', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.meal_plan_slots s
  JOIN public.meal_plan_versions v ON v.id = s.plan_version_id
  WHERE v.rules_version LIKE 'myko-v5-%'
    AND abs(s.servings - COALESCE((
      SELECT sum(d.requested_servings)
      FROM public.planned_demands d
      WHERE d.slot_id = s.id AND d.source_type <> 'future_buffer'
    ), 0)) > 0.011;
  IF v_count <> 0 THEN
    RAISE EXCEPTION '[planning-release] % créneau(x) déséquilibrés avec les demandes', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.planned_productions p
  JOIN public.meal_plan_versions v ON v.id = p.plan_version_id
  WHERE v.rules_version LIKE 'myko-v5-%'
    AND abs(p.planned_portions - COALESCE((
      SELECT sum(d.requested_servings)
      FROM public.planned_demands d
      WHERE d.plan_version_id = p.plan_version_id
        AND d.source_id = p.production_key
        AND d.source_type IN ('planned_production', 'future_buffer')
    ), 0)) > 0.011;
  IF v_count <> 0 THEN
    RAISE EXCEPTION '[planning-release] % production(s) déséquilibrées', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.nutrition_plan_shopping_items i
  JOIN public.meal_plan_versions v ON v.id = i.plan_version_id
  WHERE v.rules_version LIKE 'myko-v5-%'
    AND (
      i.purchase_qty + 0.001 < i.exact_required_qty
      OR abs(i.projected_surplus_qty - greatest(0, i.purchase_qty - i.exact_required_qty)) > 0.001
      OR abs(i.required_qty - i.stock_qty - i.exact_required_qty) > 0.001
    );
  IF v_count <> 0 THEN
    RAISE EXCEPTION '[planning-release] % décision(s) d’achat incohérentes', v_count;
  END IF;

  RAISE NOTICE '[planning-release] contrat V5 et invariants de production valides.';
END $$;
