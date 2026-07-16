-- Physical pantry container state machine.
-- Run after 00_bootstrap_ci.sql and all migrations.
begin;

select plan(8);

select has_table('public', 'inventory_containers', 'physical container table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.inventory_containers'::regclass),
  'RLS is enabled on inventory_containers'
);
select ok(
  not has_table_privilege('anon', 'public.inventory_containers', 'select'),
  'anonymous role cannot read containers'
);

insert into auth.users(id)
values ('10000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

insert into public.canonical_foods(canonical_name, primary_unit, source, verified)
values ('__test_contenants_beurre', 'g', 'curated', true)
on conflict (canonical_name) do nothing;

insert into public.archetypes(name, canonical_food_id, primary_unit, is_default)
select '__test_contenants_beurre_doux', id, 'g', true
from public.canonical_foods
where canonical_name = '__test_contenants_beurre'
  and not exists (select 1 from public.archetypes where name = '__test_contenants_beurre_doux');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select lives_ok($test$
  insert into public.inventory_lots(
    id, user_id, archetype_id, qty_remaining, initial_qty, unit,
    storage_method, storage_place, acquired_on, expiration_date,
    is_containerized, container_count_initial, container_size, container_unit,
    barcode, commercial_name
  )
  select
    '20000000-0000-4000-8000-000000000001',
    auth.uid(),
    id,
    500, 500, 'g', 'fridge', 'Réfrigérateur', current_date, current_date + 30,
    true, 2, 250, 'g', '3564707087384', 'Beurre test 2 × 250 g'
  from public.archetypes where name = '__test_contenants_beurre_doux'
$test$, 'a 2 × 250 g lot can be created');

select is(
  (select count(*)::integer from public.inventory_containers where lot_id = '20000000-0000-4000-8000-000000000001'),
  2,
  'two physical containers are created atomically'
);

select lives_ok(
  $$ select public.manage_inventory_container('20000000-0000-4000-8000-000000000001', 'open', null) $$,
  'the first container can be opened'
);

select is(
  (select count(*)::integer from public.inventory_containers where lot_id = '20000000-0000-4000-8000-000000000001' and status = 'open'),
  1,
  'exactly one container is open'
);

select public.manage_inventory_container('20000000-0000-4000-8000-000000000001', 'consume', 100);
select is(
  (select qty_remaining from public.inventory_lots where id = '20000000-0000-4000-8000-000000000001'),
  400::numeric,
  'consuming 100 g synchronizes the aggregate lot to 400 g'
);

select * from finish();
rollback;
