-- Allow renters to delete availability blocks when they cancel a rental.
-- The existing policy only allows the lender (tool owner) to delete blocks.
-- This policy allows the renter of the associated rental to delete blocks too.

create policy "Renters can delete blocks for own rentals."
  on public.tools_availability_blocks for delete
  using (
    exists (
      select 1 from public.tools_rentals
      where tools_rentals.id = rental_id
        and tools_rentals.renter_id = auth.uid()
    )
  );
