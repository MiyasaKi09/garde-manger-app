-- Reprise de données Planning après activation du contrat V5.
--
-- Les versions de l'ancien moteur restent intégralement consultables. La
-- semaine active auditée ne doit toutefois plus être présentée comme fiable,
-- et aucune réservation de lot périmé avant son usage ne peut rester active.

UPDATE public.meal_plan_versions
SET rules_version = 'legacy-myko-v3-weekly-deterministic-2',
    validation_summary = COALESCE(validation_summary, '{}'::jsonb)
      || jsonb_build_object(
        'legacy_engine', true,
        'legacy_audit_reason', 'quantities_preceded_final_personal_demands'
      ),
    updated_at = now()
WHERE source = 'canonical_v3_deterministic'
  AND rules_version = 'myko-v3-weekly-deterministic-2';

UPDATE public.meal_plan_versions
SET status = 'review_required',
    validation_summary = COALESCE(validation_summary, '{}'::jsonb)
      || jsonb_build_object(
        'status', 'review_required',
        'legacy_active_week_reviewed_at', now()
      ),
    updated_at = now()
WHERE status = 'published'
  AND rules_version = 'legacy-myko-v3-weekly-deterministic-2'
  AND window_start = DATE '2026-07-20'
  AND window_end = DATE '2026-07-26';

UPDATE public.inventory_reservations r
SET status = 'released',
    released_at = now(),
    metadata = COALESCE(r.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'release_reason', 'lot_expired_before_planned_use',
        'released_by', 'planning_v5_legacy_repair'
      )
FROM public.inventory_lots l,
     public.meal_plan_slots s,
     public.meal_plan_versions v
WHERE r.lot_id = l.id
  AND r.slot_id = s.id
  AND r.plan_version_id = v.id
  AND s.plan_version_id = v.id
  AND r.status = 'active'
  AND v.rules_version = 'legacy-myko-v3-weekly-deterministic-2'
  AND COALESCE(l.adjusted_expiration_date, l.expiration_date) IS NOT NULL
  AND COALESCE(l.adjusted_expiration_date, l.expiration_date) < s.meal_date;
