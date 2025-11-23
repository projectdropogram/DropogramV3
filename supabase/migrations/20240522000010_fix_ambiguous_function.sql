-- Fix ambiguous function error by dropping all versions first
drop function if exists public.find_nearby_products(double precision, double precision, double precision);
drop function if exists public.find_nearby_products(double precision, double precision, double precision, text);
drop function if exists public.find_nearby_products(double precision, double precision, double precision, text, text);

-- Recreate the function with the correct signature and return types (including lat/long)
create or replace function public.find_nearby_products(
  lat double precision,
  long double precision,
  radius_meters double precision,
  search_text text default null,
  tag_filter text default null
)
returns table (
  id uuid,
  title text,
  description text,
  price numeric,
  image_url text,
  producer_id uuid,
  tags text[],
  lat double precision,
  long double precision,
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
    p.tags,
    st_y(p.location::geometry) as lat,
    st_x(p.location::geometry) as long,
    st_distance(p.location, st_point(long, lat)::geography) as dist_meters
  from
    public.products p
  where
    p.is_active = true
    and st_dwithin(p.location, st_point(long, lat)::geography, radius_meters)
    and (
        search_text is null 
        or 
        p.title ilike '%' || search_text || '%' 
        or 
        p.description ilike '%' || search_text || '%'
    )
    and (
        tag_filter is null
        or
        tag_filter = any(p.tags)
    )
  order by
    p.location <-> st_point(long, lat)::geography;
$$;
