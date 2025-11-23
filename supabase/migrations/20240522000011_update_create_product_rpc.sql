-- Update create_product to accept tags
create or replace function public.create_product(
  title text,
  description text,
  price numeric,
  image_url text,
  lat double precision,
  long double precision,
  tags text[] default null
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
    producer_id,
    tags
  )
  values (
    title,
    description,
    price,
    image_url,
    st_point(long, lat)::geography,
    auth.uid(),
    tags
  )
  returning id into new_id;

  return new_id;
end;
$$;
