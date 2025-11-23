-- Allow producers to view their own products (even if inactive)
create policy "Producers can view own products." on public.products
  for select using (auth.uid() = producer_id);
