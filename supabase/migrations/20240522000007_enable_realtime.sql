-- Enable Realtime for the orders table
-- This allows clients to subscribe to changes (INSERT, UPDATE, DELETE)
begin;
  -- Check if publication exists (it usually does in Supabase)
  -- If not, we create it. If it does, we add the table.
  
  -- Ideally we just run this:
  alter publication supabase_realtime add table public.orders;
  
commit;
