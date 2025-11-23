-- Update find_nearby_products to support search
-- Drops the old function first to ensure signature update works cleanly if needed (though create or replace usually handles it, changing params can be tricky)
drop function if exists public.find_nearby_products(double precision, double precision, double precision);

create or replace function public.find_nearby_products(
  lat double precision,
  long double precision,
  radius_meters double precision,
  search_text text default null
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
    and (
        search_text is null 
        or p.title ilike '%' || search_text || '%' 
        or p.description ilike '%' || search_text || '%'
    )
  order by
    p.location <-> st_point(long, lat)::geography;
$$;
