-- Physical container tracking and barcode snapshots for pantry lots.
--
-- The legacy model only stored a container size on inventory_lots.  It could
-- not distinguish three sealed jars from one open jar, nor keep an opening
-- date per physical package.  This migration keeps inventory_lots as the
-- aggregate stock record and adds one child row per physical container.

alter table public.inventory_lots
  add column if not exists container_count_initial smallint,
  add column if not exists barcode text,
  add column if not exists commercial_name text,
  add column if not exists brand text,
  add column if not exists packaging_type text;

-- Bring the three historical containerized lots onto one unambiguous rule:
-- inventory_lots.qty_remaining is always the total edible quantity, in the
-- same unit as container_unit.  Old rows expressed as "u" are converted.
update public.inventory_lots
set
  initial_qty = initial_qty * container_size,
  qty_remaining = qty_remaining * container_size,
  unit = container_unit
where is_containerized is true
  and lower(unit) in ('u', 'unite', 'unites', 'unité', 'unités')
  and container_size is not null
  and container_unit is not null;

update public.inventory_lots
set container_count_initial = greatest(
  1,
  ceil(initial_qty / nullif(container_size, 0))::integer
)
where is_containerized is true
  and container_size is not null
  and container_count_initial is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inventory_lots_container_shape_check'
      and conrelid = 'public.inventory_lots'::regclass
  ) then
    alter table public.inventory_lots
      add constraint inventory_lots_container_shape_check
      check (
        is_containerized is not true
        or (
          container_size > 0
          and nullif(btrim(container_unit), '') is not null
          and container_count_initial > 0
        )
      ) not valid;
  end if;
end
$$;

alter table public.inventory_lots
  validate constraint inventory_lots_container_shape_check;

create index if not exists inventory_lots_user_barcode_idx
  on public.inventory_lots (user_id, barcode)
  where barcode is not null;

create table if not exists public.inventory_containers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lot_id uuid not null references public.inventory_lots(id) on delete cascade,
  ordinal smallint not null,
  status text not null default 'sealed'
    check (status in ('sealed', 'open', 'empty', 'discarded')),
  initial_quantity numeric(12, 3) not null check (initial_quantity > 0),
  remaining_quantity numeric(12, 3) not null
    check (remaining_quantity >= 0 and remaining_quantity <= initial_quantity),
  unit varchar(20) not null,
  barcode text,
  expiration_date date,
  adjusted_expiration_date date,
  opened_at timestamptz,
  emptied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_containers_ordinal_check check (ordinal > 0),
  constraint inventory_containers_empty_state_check check (
    status not in ('empty', 'discarded') or remaining_quantity = 0
  ),
  constraint inventory_containers_lot_ordinal_key unique (lot_id, ordinal)
);

comment on table public.inventory_containers is
  'One row per physical pantry container. Tracks sealed/open/empty/discarded state and quantity after opening.';
comment on column public.inventory_lots.qty_remaining is
  'Total edible quantity remaining. For containerized lots this is the sum of active inventory_containers.';
comment on column public.inventory_lots.container_count_initial is
  'Number of physical containers initially purchased for a containerized lot.';
comment on column public.inventory_lots.barcode is
  'Barcode snapshot used when the lot was added, including Open Food Facts live matches.';

create index if not exists inventory_containers_user_id_idx
  on public.inventory_containers (user_id);
create index if not exists inventory_containers_lot_status_idx
  on public.inventory_containers (lot_id, status, ordinal);
create index if not exists inventory_containers_user_barcode_idx
  on public.inventory_containers (user_id, barcode)
  where barcode is not null;

alter table public.inventory_containers enable row level security;

drop policy if exists inventory_containers_owner_select on public.inventory_containers;
create policy inventory_containers_owner_select
  on public.inventory_containers for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists inventory_containers_owner_insert on public.inventory_containers;
create policy inventory_containers_owner_insert
  on public.inventory_containers for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.inventory_lots lot
      where lot.id = lot_id and lot.user_id = (select auth.uid())
    )
  );

drop policy if exists inventory_containers_owner_update on public.inventory_containers;
create policy inventory_containers_owner_update
  on public.inventory_containers for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.inventory_lots lot
      where lot.id = lot_id and lot.user_id = (select auth.uid())
    )
  );

drop policy if exists inventory_containers_owner_delete on public.inventory_containers;
create policy inventory_containers_owner_delete
  on public.inventory_containers for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.inventory_containers from public, anon;
grant select, insert, update, delete on table public.inventory_containers to authenticated;

-- Compatibility guard: old clients only sent qty + container_size.  Normalize
-- them before the CHECK constraint and before physical child rows are created.
create or replace function public.prepare_containerized_inventory_lot()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.is_containerized is true then
    if new.container_size is null or new.container_size <= 0
       or nullif(btrim(new.container_unit), '') is null then
      raise exception 'Taille et unité de contenant requises';
    end if;
    if new.container_count_initial is null then
      new.container_count_initial := case
        when lower(new.unit) in ('u', 'unite', 'unites', 'unité', 'unités')
          then greatest(1, ceil(new.initial_qty)::integer)
        else greatest(1, ceil(new.initial_qty / new.container_size)::integer)
      end;
    end if;
    new.initial_qty := new.container_count_initial * new.container_size;
    new.qty_remaining := new.container_count_initial * new.container_size;
    new.unit := new.container_unit;
  end if;
  return new;
end
$$;

drop trigger if exists inventory_lots_prepare_containers on public.inventory_lots;
create trigger inventory_lots_prepare_containers
  before insert on public.inventory_lots
  for each row
  when (new.is_containerized is true)
  execute function public.prepare_containerized_inventory_lot();

-- Create the physical rows automatically in the same transaction as the lot.
create or replace function public.create_inventory_containers_for_lot()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.is_containerized is true then
    insert into public.inventory_containers (
      user_id,
      lot_id,
      ordinal,
      status,
      initial_quantity,
      remaining_quantity,
      unit,
      barcode,
      expiration_date
    )
    select
      new.user_id,
      new.id,
      n,
      'sealed',
      new.container_size,
      new.container_size,
      new.container_unit,
      new.barcode,
      new.expiration_date
    from generate_series(1, new.container_count_initial) as n;
  end if;
  return new;
end
$$;

drop trigger if exists inventory_lots_create_containers on public.inventory_lots;
create trigger inventory_lots_create_containers
  after insert on public.inventory_lots
  for each row
  when (new.is_containerized is true)
  execute function public.create_inventory_containers_for_lot();

-- Backfill physical rows for historical containerized lots.  This is done
-- after the trigger is created because existing rows are UPDATEd, not INSERTed.
insert into public.inventory_containers (
  user_id,
  lot_id,
  ordinal,
  status,
  initial_quantity,
  remaining_quantity,
  unit,
  barcode,
  expiration_date,
  adjusted_expiration_date,
  opened_at
)
select
  lot.user_id,
  lot.id,
  n,
  case
    when greatest(0, least(lot.container_size, lot.qty_remaining - ((n - 1) * lot.container_size))) = 0 then 'empty'
    when lot.is_opened is true and n = 1 then 'open'
    else 'sealed'
  end,
  lot.container_size,
  greatest(0, least(lot.container_size, lot.qty_remaining - ((n - 1) * lot.container_size))),
  lot.container_unit,
  lot.barcode,
  lot.expiration_date,
  case when lot.is_opened is true and n = 1 then lot.adjusted_expiration_date end,
  case when lot.is_opened is true and n = 1 then lot.opened_at end
from public.inventory_lots lot
cross join lateral generate_series(1, lot.container_count_initial) as n
where lot.is_containerized is true
  and not exists (
    select 1 from public.inventory_containers c where c.lot_id = lot.id
  );

-- Keep the aggregate lot in sync whenever a physical container changes.
create or replace function public.sync_inventory_lot_from_containers()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_lot_id uuid := coalesce(new.lot_id, old.lot_id);
begin
  update public.inventory_lots lot
  set
    qty_remaining = coalesce((
      select sum(c.remaining_quantity)
      from public.inventory_containers c
      where c.lot_id = v_lot_id
        and c.status in ('sealed', 'open')
    ), 0),
    is_opened = exists (
      select 1 from public.inventory_containers c
      where c.lot_id = v_lot_id and c.status = 'open'
    ),
    opened_at = (
      select min(c.opened_at)::timestamp
      from public.inventory_containers c
      where c.lot_id = v_lot_id and c.status = 'open'
    ),
    adjusted_expiration_date = (
      select min(c.adjusted_expiration_date)
      from public.inventory_containers c
      where c.lot_id = v_lot_id and c.status = 'open'
    ),
    updated_at = now()
  where lot.id = v_lot_id;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists inventory_containers_sync_lot on public.inventory_containers;
create trigger inventory_containers_sync_lot
  after insert or update or delete on public.inventory_containers
  for each row execute function public.sync_inventory_lot_from_containers();

-- Atomic state machine used by the application.  SECURITY INVOKER keeps RLS
-- active, and the explicit owner check makes the tenant boundary visible.
create or replace function public.manage_inventory_container(
  p_lot_id uuid,
  p_action text,
  p_quantity numeric default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_lot public.inventory_lots%rowtype;
  v_container public.inventory_containers%rowtype;
  v_needed numeric;
  v_take numeric;
  v_available numeric;
  v_open_days integer;
  v_open_expiration date;
  v_summary jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Non authentifié';
  end if;
  if p_action not in ('open', 'consume', 'discard_open') then
    raise exception 'Action contenant invalide';
  end if;

  select * into v_lot
  from public.inventory_lots
  where id = p_lot_id and user_id = (select auth.uid())
  for update;

  if not found then raise exception 'Lot introuvable'; end if;
  if v_lot.is_containerized is not true then
    raise exception 'Ce lot ne contient pas de contenants suivis';
  end if;

  select coalesce(sum(remaining_quantity), 0) into v_available
  from public.inventory_containers
  where lot_id = p_lot_id and status in ('sealed', 'open');

  select coalesce(
    case v_lot.storage_method
      when 'fridge' then a.open_shelf_life_days_fridge
      when 'freezer' then a.open_shelf_life_days_freezer
      else a.open_shelf_life_days_pantry
    end,
    a.open_shelf_life_days,
    p.shelf_life_after_opening_days
  ) into v_open_days
  from public.inventory_lots lot
  left join public.archetypes a on a.id = lot.archetype_id
  left join public.products p on p.id = lot.product_id
  where lot.id = p_lot_id;

  if v_open_days is null then
    v_open_expiration := v_lot.expiration_date;
  elsif v_lot.expiration_date is null then
    v_open_expiration := current_date + v_open_days;
  else
    v_open_expiration := least(v_lot.expiration_date, current_date + v_open_days);
  end if;

  if p_action = 'open' then
    if not exists (
      select 1 from public.inventory_containers
      where lot_id = p_lot_id and status = 'open'
    ) then
      select * into v_container
      from public.inventory_containers
      where lot_id = p_lot_id and status = 'sealed'
      order by ordinal
      limit 1
      for update;
      if not found then raise exception 'Aucun contenant fermé disponible'; end if;

      update public.inventory_containers
      set status = 'open', opened_at = now(),
          adjusted_expiration_date = v_open_expiration, updated_at = now()
      where id = v_container.id;
    end if;
  elsif p_action = 'discard_open' then
    update public.inventory_containers
    set status = 'discarded', remaining_quantity = 0,
        emptied_at = now(), updated_at = now()
    where lot_id = p_lot_id and status = 'open';
    if not found then raise exception 'Aucun contenant ouvert à jeter'; end if;
  else
    if p_quantity is null or p_quantity <= 0 then
      raise exception 'La quantité à consommer doit être positive';
    end if;
    if p_quantity > v_available then
      raise exception 'Quantité demandée supérieure au stock disponible';
    end if;

    v_needed := p_quantity;
    while v_needed > 0 loop
      select * into v_container
      from public.inventory_containers
      where lot_id = p_lot_id and status = 'open'
      order by ordinal
      limit 1
      for update;

      if not found then
        select * into v_container
        from public.inventory_containers
        where lot_id = p_lot_id and status = 'sealed'
        order by ordinal
        limit 1
        for update;
        if not found then raise exception 'Stock contenant incohérent'; end if;

        update public.inventory_containers
        set status = 'open', opened_at = now(),
            adjusted_expiration_date = v_open_expiration, updated_at = now()
        where id = v_container.id
        returning * into v_container;
      end if;

      v_take := least(v_needed, v_container.remaining_quantity);
      update public.inventory_containers
      set
        remaining_quantity = remaining_quantity - v_take,
        status = case when remaining_quantity - v_take = 0 then 'empty' else 'open' end,
        emptied_at = case when remaining_quantity - v_take = 0 then now() else emptied_at end,
        updated_at = now()
      where id = v_container.id;
      v_needed := v_needed - v_take;
    end loop;
  end if;

  select jsonb_build_object(
    'lot_id', p_lot_id,
    'quantity_remaining', coalesce(sum(remaining_quantity) filter (where status in ('sealed', 'open')), 0),
    'sealed_count', count(*) filter (where status = 'sealed'),
    'open_count', count(*) filter (where status = 'open'),
    'empty_count', count(*) filter (where status = 'empty'),
    'discarded_count', count(*) filter (where status = 'discarded')
  ) into v_summary
  from public.inventory_containers
  where lot_id = p_lot_id;

  return v_summary;
end
$$;

revoke all on function public.manage_inventory_container(uuid, text, numeric) from public, anon;
grant execute on function public.manage_inventory_container(uuid, text, numeric) to authenticated;

-- Backward-compatible, tenant-safe wrapper for clients deployed before this
-- migration.  The former SECURITY DEFINER version did not verify ownership.
create or replace function public.split_containerized_lot(
  p_lot_id uuid,
  p_quantity_consumed numeric,
  p_consumed_unit varchar
)
returns table (
  original_lot_id uuid,
  new_lot_id uuid,
  containers_fully_consumed integer,
  partial_container_remaining numeric,
  message text
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
  v_size numeric;
begin
  select container_size into v_size
  from public.inventory_lots
  where id = p_lot_id and user_id = (select auth.uid());
  if not found then raise exception 'Lot introuvable'; end if;

  v_result := public.manage_inventory_container(p_lot_id, 'consume', p_quantity_consumed);
  return query select
    p_lot_id,
    null::uuid,
    floor(p_quantity_consumed / nullif(v_size, 0))::integer,
    case
      when (v_result->>'open_count')::integer > 0
        then mod(p_quantity_consumed, v_size)
      else 0::numeric
    end,
    format('%s %s consommés', p_quantity_consumed, p_consumed_unit);
end
$$;

revoke all on function public.split_containerized_lot(uuid, numeric, character varying) from public, anon;
grant execute on function public.split_containerized_lot(uuid, numeric, character varying) to authenticated;
revoke all on function public.create_inventory_containers_for_lot() from public, anon, authenticated;
revoke all on function public.sync_inventory_lot_from_containers() from public, anon, authenticated;
revoke all on function public.prepare_containerized_inventory_lot() from public, anon, authenticated;
