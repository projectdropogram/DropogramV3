-- Enable PostGIS for geolocation
create extension if not exists postgis schema extensions;

-- Create Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text check (role in ('producer', 'consumer', 'both')) default 'consumer',
  full_name text,
  avatar_url text,
  location geography(Point, 4326), -- Last known location
  updated_at timestamptz default now()
);

-- Create Products table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  producer_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price numeric not null,
  image_url text,
  location geography(Point, 4326) not null, -- Location of the product/service
  is_active boolean default true,
  tags text[],
  created_at timestamptz default now()
);

-- Create Orders table
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  consumer_id uuid references public.profiles(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  status text check (status in ('pending', 'accepted', 'completed', 'cancelled')) default 'pending',
  quantity integer default 1,
  total_price numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- RLS Policies

-- Profiles:
-- Everyone can read profiles (needed for showing producer info)
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

-- Users can insert their own profile
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

-- Users can update own profile
create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Products:
-- Everyone can read active products
create policy "Active products are viewable by everyone." on public.products
  for select using (is_active = true);

-- Producers can insert their own products
create policy "Producers can insert their own products." on public.products
  for insert with check (auth.uid() = producer_id);

-- Producers can update their own products
create policy "Producers can update own products." on public.products
  for update using (auth.uid() = producer_id);

-- Producers can delete their own products
create policy "Producers can delete own products." on public.products
  for delete using (auth.uid() = producer_id);

-- Orders:
-- Consumers can see their own orders
create policy "Consumers can see own orders." on public.orders
  for select using (auth.uid() = consumer_id);

-- Producers can see orders for their products
create policy "Producers can see orders for their products." on public.orders
  for select using (
    exists (
      select 1 from public.products
      where products.id = orders.product_id
      and products.producer_id = auth.uid()
    )
  );

-- Consumers can create orders
create policy "Consumers can create orders." on public.orders
  for insert with check (auth.uid() = consumer_id);

-- Producers can update status of orders for their products
create policy "Producers can update orders for their products." on public.orders
  for update using (
    exists (
      select 1 from public.products
      where products.id = orders.product_id
      and products.producer_id = auth.uid()
    )
  );

-- Functions

-- Find nearby products
-- Returns products within a radius (in meters) sorted by distance
create or replace function public.find_nearby_products(
  lat double precision,
  long double precision,
  radius_meters double precision
)
returns table (
  id uuid,
  title text,
  description text,
  price numeric,
  image_url text,
  producer_id uuid,
  dist_meters double precision
)
language sql
as $$
  select
    p.id,
    p.title,
    p.description,
    p.price,
    p.image_url,
    p.producer_id,
    st_distance(p.location, st_point(long, lat)::geography) as dist_meters
  from
    public.products p
  where
    p.is_active = true
    and st_dwithin(p.location, st_point(long, lat)::geography, radius_meters)
  order by
    p.location <-> st_point(long, lat)::geography;
$$;

-- Storage (Optional: You need to create the bucket 'product-images' in the dashboard, but here is policy)
-- We can't create buckets via SQL easily without pg_net or specific extensions usually, 
-- but we can set policies if the bucket exists.
-- Assuming bucket 'product-images' exists:

-- create policy "Public Access" on storage.objects for select using ( bucket_id = 'product-images' );
-- create policy "Producer Upload" on storage.objects for insert with check ( bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1] );
