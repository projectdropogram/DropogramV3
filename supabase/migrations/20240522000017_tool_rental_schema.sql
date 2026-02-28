-- ============================================================
-- Migration 000017: Tool Rental Schema
-- All tables prefixed with tools_ to guarantee zero collision
-- with existing Dropogram tables (products, orders, reviews, etc.)
-- ============================================================

-- ENUM types
create type tool_category as enum (
  'power_tools', 'hand_tools', 'garden', 'construction',
  'automotive', 'cleaning', 'measuring', 'ladders', 'other'
);

create type tool_condition as enum ('like_new', 'good', 'fair');

create type rental_status as enum (
  'pending', 'approved', 'active', 'completed',
  'cancelled', 'disputed'
);

create type reviewer_role as enum ('renter', 'lender');

-- ============================================================
-- tools_lender_profiles
-- Tool-rental-specific extensions per user (separate from profiles)
-- ============================================================
create table public.tools_lender_profiles (
  user_id             uuid primary key references auth.users on delete cascade,
  is_lender           boolean default false,
  lender_bio          text,
  response_rate       numeric(4,3),
  avg_response_hours  numeric(5,1),
  total_rentals_completed integer default 0,
  is_verified_lender  boolean default false,
  payout_account_id   varchar(255),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.tools_lender_profiles enable row level security;

create policy "Lender profiles viewable by everyone."
  on public.tools_lender_profiles for select using (true);

create policy "Users can insert own lender profile."
  on public.tools_lender_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lender profile."
  on public.tools_lender_profiles for update
  using (auth.uid() = user_id);

-- ============================================================
-- tools_items
-- The core listing entity (analogous to products)
-- ============================================================
create table public.tools_items (
  id                  uuid default gen_random_uuid() primary key,
  lender_id           uuid references auth.users on delete cascade not null,
  title               varchar(120) not null,
  description         text,
  category            tool_category not null default 'other',
  brand               varchar(100),
  model_number        varchar(100),
  condition           tool_condition not null default 'good',
  daily_rate_cents    integer not null check (daily_rate_cents > 0),
  deposit_cents       integer default 0 check (deposit_cents >= 0),
  min_rental_days     smallint default 1 check (min_rental_days >= 1),
  max_rental_days     smallint default 14,
  location            geography(Point, 4326) not null,
  location_city       varchar(100),
  location_state      char(2),
  is_active           boolean default true,
  requires_id_check   boolean default false,
  images              text[] default '{}',
  tags                text[] default '{}',
  total_rentals       integer default 0,
  avg_rating          numeric(3,2),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.tools_items enable row level security;

create policy "Active tool items viewable by everyone."
  on public.tools_items for select
  using (is_active = true);

create policy "Lenders can view own inactive items."
  on public.tools_items for select
  using (auth.uid() = lender_id);

create policy "Authenticated users can insert tool items."
  on public.tools_items for insert
  with check (auth.uid() = lender_id);

create policy "Lenders can update own tool items."
  on public.tools_items for update
  using (auth.uid() = lender_id);

create policy "Lenders can delete own tool items."
  on public.tools_items for delete
  using (auth.uid() = lender_id);

-- ============================================================
-- tools_availability_blocks
-- Prevents double-booking via overlapping range exclusion
-- ============================================================
create extension if not exists btree_gist schema extensions;

create table public.tools_availability_blocks (
  id          uuid default gen_random_uuid() primary key,
  item_id     uuid references public.tools_items on delete cascade not null,
  rental_id   uuid,  -- FK added after tools_rentals is created
  type        text check (type in ('rental', 'manual_block', 'buffer')) not null,
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  note        text,
  created_at  timestamptz default now(),
  -- Prevents any two blocks on the same item from overlapping
  exclude using gist (
    item_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
);

alter table public.tools_availability_blocks enable row level security;

create policy "Availability blocks viewable by everyone."
  on public.tools_availability_blocks for select using (true);

create policy "Lenders can insert availability blocks."
  on public.tools_availability_blocks for insert
  with check (
    exists (
      select 1 from public.tools_items
      where id = item_id and lender_id = auth.uid()
    )
  );

create policy "Lenders can delete own availability blocks."
  on public.tools_availability_blocks for delete
  using (
    exists (
      select 1 from public.tools_items
      where id = item_id and lender_id = auth.uid()
    )
  );

-- ============================================================
-- tools_rentals
-- The transaction entity (analogous to orders)
-- ============================================================
create table public.tools_rentals (
  id                    uuid default gen_random_uuid() primary key,
  renter_id             uuid references auth.users on delete set null,
  lender_id             uuid references auth.users on delete set null,
  item_id               uuid references public.tools_items on delete set null,
  status                rental_status not null default 'pending',
  start_at              timestamptz not null,
  end_at                timestamptz not null,
  daily_rate_cents      integer not null,
  deposit_cents         integer default 0,
  subtotal_cents        integer not null,
  platform_fee_cents    integer not null,
  total_cents           integer not null,
  lender_payout_cents   integer not null,
  pickup_notes          text,
  return_notes          text,
  pre_rental_photos     text[] default '{}',
  post_rental_photos    text[] default '{}',
  cancellation_reason   text,
  cancelled_at          timestamptz,
  cancelled_by          uuid references auth.users,
  dispute_reason        text,
  dispute_opened_at     timestamptz,
  dispute_resolved_at   timestamptz,
  dispute_resolution    text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Now add the FK from availability_blocks to rentals
alter table public.tools_availability_blocks
  add constraint fk_rental
  foreign key (rental_id) references public.tools_rentals(id)
  on delete set null;

alter table public.tools_rentals enable row level security;

create policy "Renters can view own rentals."
  on public.tools_rentals for select
  using (auth.uid() = renter_id);

create policy "Lenders can view rentals for their items."
  on public.tools_rentals for select
  using (auth.uid() = lender_id);

create policy "Authenticated users can create rentals."
  on public.tools_rentals for insert
  with check (auth.uid() = renter_id);

create policy "Lenders can update rental status."
  on public.tools_rentals for update
  using (auth.uid() = lender_id);

create policy "Renters can update own rentals."
  on public.tools_rentals for update
  using (auth.uid() = renter_id);

-- Enable Realtime for rental status changes
alter publication supabase_realtime add table public.tools_rentals;

-- ============================================================
-- tools_reviews
-- Post-rental ratings (isolated from Dropogram reviews table)
-- ============================================================
create table public.tools_reviews (
  id                    uuid default gen_random_uuid() primary key,
  rental_id             uuid references public.tools_rentals on delete cascade not null unique,
  author_id             uuid references auth.users on delete cascade not null,
  subject_id            uuid references auth.users on delete cascade not null,
  item_id               uuid references public.tools_items on delete cascade not null,
  reviewer_role         reviewer_role not null,
  overall_rating        smallint not null check (overall_rating between 1 and 5),
  condition_rating      smallint check (condition_rating between 1 and 5),
  communication_rating  smallint check (communication_rating between 1 and 5),
  body                  text,
  created_at            timestamptz default now()
);

alter table public.tools_reviews enable row level security;

create policy "Reviews viewable by everyone."
  on public.tools_reviews for select using (true);

create policy "Authors can insert own reviews."
  on public.tools_reviews for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.tools_rentals
      where id = rental_id
      and (renter_id = auth.uid() or lender_id = auth.uid())
      and status = 'completed'
    )
  );

-- ============================================================
-- tools_messages
-- Per-rental real-time chat
-- ============================================================
create table public.tools_messages (
  id          uuid default gen_random_uuid() primary key,
  rental_id   uuid references public.tools_rentals on delete cascade not null,
  sender_id   uuid references auth.users on delete cascade not null,
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz default now()
);

alter table public.tools_messages enable row level security;

create policy "Rental participants can view messages."
  on public.tools_messages for select
  using (
    exists (
      select 1 from public.tools_rentals
      where id = rental_id
      and (renter_id = auth.uid() or lender_id = auth.uid())
    )
  );

create policy "Rental participants can send messages."
  on public.tools_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.tools_rentals
      where id = rental_id
      and (renter_id = auth.uid() or lender_id = auth.uid())
    )
  );

alter publication supabase_realtime add table public.tools_messages;

-- ============================================================
-- Storage: tool-images bucket
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('tool-images', 'tool-images', true)
  on conflict (id) do nothing;

create policy "Tool images publicly readable."
  on storage.objects for select
  using (bucket_id = 'tool-images');

create policy "Authenticated users can upload tool images."
  on storage.objects for insert
  with check (
    bucket_id = 'tool-images'
    and auth.uid() is not null
  );

create policy "Users can update own tool images."
  on storage.objects for update
  using (
    bucket_id = 'tool-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own tool images."
  on storage.objects for delete
  using (
    bucket_id = 'tool-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- RPC: find_nearby_tools
-- ============================================================
create or replace function public.find_nearby_tools(
  lat            double precision,
  long           double precision,
  radius_meters  double precision,
  category_filter text default null,
  search_text    text default null,
  start_at       timestamptz default null,
  end_at         timestamptz default null
)
returns table (
  id                uuid,
  lender_id         uuid,
  title             varchar,
  description       text,
  category          tool_category,
  condition         tool_condition,
  brand             varchar,
  daily_rate_cents  integer,
  deposit_cents     integer,
  avg_rating        numeric,
  total_rentals     integer,
  images            text[],
  tags              text[],
  location_city     varchar,
  location_state    char,
  item_lat          double precision,
  item_lng          double precision,
  dist_meters       double precision,
  is_available      boolean
)
language sql
as $$
  select
    i.id,
    i.lender_id,
    i.title,
    i.description,
    i.category,
    i.condition,
    i.brand,
    i.daily_rate_cents,
    i.deposit_cents,
    i.avg_rating,
    i.total_rentals,
    i.images,
    i.tags,
    i.location_city,
    i.location_state,
    st_y(i.location::geometry) as item_lat,
    st_x(i.location::geometry) as item_lng,
    st_distance(i.location, st_point(long, lat)::geography) as dist_meters,
    not exists (
      select 1 from public.tools_availability_blocks ab
      where ab.item_id = i.id
        and tstzrange(ab.start_at, ab.end_at, '[)')
          && tstzrange(
               coalesce(find_nearby_tools.start_at, now()),
               coalesce(find_nearby_tools.end_at, now() + interval '1 day'),
               '[)'
             )
    ) as is_available
  from public.tools_items i
  where
    i.is_active = true
    and st_dwithin(i.location, st_point(long, lat)::geography, radius_meters)
    and (category_filter is null or i.category::text = category_filter)
    and (
      search_text is null
      or i.title ilike '%' || search_text || '%'
      or i.description ilike '%' || search_text || '%'
      or search_text ilike any(i.tags)
    )
  order by
    i.location <-> st_point(long, lat)::geography;
$$;

-- ============================================================
-- RPC: get_pricing_quote
-- ============================================================
create or replace function public.get_pricing_quote(
  p_item_id  uuid,
  p_start_at timestamptz,
  p_end_at   timestamptz
)
returns json
language plpgsql
as $$
declare
  v_item          public.tools_items%rowtype;
  v_total_days    numeric(6,2);
  v_subtotal      integer;
  v_platform_fee  integer;
  v_lender_payout integer;
  v_total         integer;
begin
  select * into v_item from public.tools_items where id = p_item_id;

  if not found then
    raise exception 'Item not found';
  end if;

  if p_start_at < now() then
    raise exception 'Start date must be in the future';
  end if;

  v_total_days := greatest(
    extract(epoch from (p_end_at - p_start_at)) / 86400.0,
    1
  );

  if v_total_days < v_item.min_rental_days then
    raise exception 'Minimum rental is % day(s)', v_item.min_rental_days;
  end if;

  if v_total_days > v_item.max_rental_days then
    raise exception 'Maximum rental is % day(s)', v_item.max_rental_days;
  end if;

  v_subtotal      := round(v_item.daily_rate_cents * v_total_days);
  v_platform_fee  := round(v_subtotal * 0.15);
  v_lender_payout := v_subtotal - v_platform_fee;
  v_total         := v_subtotal + v_item.deposit_cents;

  return json_build_object(
    'total_days',         v_total_days,
    'daily_rate_cents',   v_item.daily_rate_cents,
    'subtotal_cents',     v_subtotal,
    'platform_fee_cents', v_platform_fee,
    'lender_payout_cents', v_lender_payout,
    'deposit_cents',      v_item.deposit_cents,
    'total_cents',        v_total,
    'line_items', json_build_array(
      json_build_object('label', 'Rental (' || v_total_days || ' days)', 'amount_cents', v_subtotal),
      json_build_object('label', 'Refundable deposit', 'amount_cents', v_item.deposit_cents),
      json_build_object('label', 'Platform fee (15%)', 'amount_cents', v_platform_fee)
    )
  );
end;
$$;

-- ============================================================
-- RPC: create_tool_rental (SECURITY DEFINER - transactional)
-- ============================================================
create or replace function public.create_tool_rental(
  p_item_id      uuid,
  p_start_at     timestamptz,
  p_end_at       timestamptz,
  p_pickup_notes text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_renter_id     uuid;
  v_item          public.tools_items%rowtype;
  v_quote         json;
  v_rental_id     uuid;
begin
  v_renter_id := auth.uid();
  if v_renter_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_item from public.tools_items where id = p_item_id and is_active = true;
  if not found then
    raise exception 'Item not available';
  end if;

  if v_item.lender_id = v_renter_id then
    raise exception 'Cannot rent your own item';
  end if;

  v_quote := public.get_pricing_quote(p_item_id, p_start_at, p_end_at);

  insert into public.tools_rentals (
    renter_id, lender_id, item_id, status,
    start_at, end_at,
    daily_rate_cents, deposit_cents,
    subtotal_cents, platform_fee_cents, total_cents, lender_payout_cents,
    pickup_notes
  ) values (
    v_renter_id, v_item.lender_id, p_item_id, 'pending',
    p_start_at, p_end_at,
    (v_quote->>'daily_rate_cents')::integer,
    (v_quote->>'deposit_cents')::integer,
    (v_quote->>'subtotal_cents')::integer,
    (v_quote->>'platform_fee_cents')::integer,
    (v_quote->>'total_cents')::integer,
    (v_quote->>'lender_payout_cents')::integer,
    p_pickup_notes
  )
  returning id into v_rental_id;

  -- EXCLUDE constraint catches double-booking
  begin
    insert into public.tools_availability_blocks (item_id, rental_id, type, start_at, end_at)
    values (p_item_id, v_rental_id, 'rental', p_start_at, p_end_at);
  exception when exclusion_violation then
    delete from public.tools_rentals where id = v_rental_id;
    raise exception 'These dates are no longer available. Please choose different dates.';
  end;

  -- Update item rental count
  update public.tools_items
    set total_rentals = total_rentals + 1,
        updated_at = now()
    where id = p_item_id;

  return v_rental_id;
end;
$$;

-- ============================================================
-- RPC: create_tool_item (SECURITY DEFINER)
-- ============================================================
create or replace function public.create_tool_item(
  p_title          varchar,
  p_description    text,
  p_category       text,
  p_brand          varchar default null,
  p_model_number   varchar default null,
  p_condition      text default 'good',
  p_daily_rate_cents integer default 1000,
  p_deposit_cents  integer default 0,
  p_min_rental_days smallint default 1,
  p_max_rental_days smallint default 14,
  p_lat            double precision default 0,
  p_long           double precision default 0,
  p_location_city  varchar default null,
  p_location_state char default null,
  p_images         text[] default '{}',
  p_tags           text[] default '{}'
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_user_id  uuid;
  v_item_id  uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.tools_items (
    lender_id, title, description, category, brand, model_number,
    condition, daily_rate_cents, deposit_cents,
    min_rental_days, max_rental_days,
    location, location_city, location_state,
    images, tags
  ) values (
    v_user_id, p_title, p_description, p_category::tool_category,
    p_brand, p_model_number,
    p_condition::tool_condition, p_daily_rate_cents, p_deposit_cents,
    p_min_rental_days, p_max_rental_days,
    st_point(p_long, p_lat)::geography, p_location_city, p_location_state,
    p_images, p_tags
  )
  returning id into v_item_id;

  -- Ensure lender profile exists
  insert into public.tools_lender_profiles (user_id, is_lender)
  values (v_user_id, true)
  on conflict (user_id) do update set is_lender = true, updated_at = now();

  return v_item_id;
end;
$$;
