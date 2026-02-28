-- ============================================================
-- Migration 000018: Enforce blocked users in RLS
-- Fixes the existing gap where is_blocked was only cosmetic
-- ============================================================

create policy "Blocked users cannot insert orders."
  on public.orders for insert
  with check (
    not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_blocked = true
    )
  );

create policy "Blocked users cannot insert products."
  on public.products for insert
  with check (
    not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_blocked = true
    )
  );

-- Also block tool rentals from blocked users
create policy "Blocked users cannot create tool rentals."
  on public.tools_rentals for insert
  with check (
    not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_blocked = true
    )
  );

create policy "Blocked users cannot create tool listings."
  on public.tools_items for insert
  with check (
    not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_blocked = true
    )
  );
