-- Helper function to create a product with separate Lat/Long parameters
-- This makes it easier to call from Plasmic or other frontends that don't handle PostGIS geometry types natively.

create or replace function public.create_product(
  title text,
  description text,
  price numeric,
  image_url text,
  lat double precision,
  long double precision
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_id uuid;
begin
  -- Ensure user is logged in
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.products (
    title,
    description,
    price,
    image_url,
    location,
    producer_id
  )
  values (
    title,
    description,
    price,
    image_url,
    st_point(long, lat)::geography, -- Convert lat/long to Geography
    auth.uid()
  )
  returning id into new_id;

  return new_id;
end;
$$;
