-- Create Favorites table
create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Enable RLS
alter table public.favorites enable row level security;

-- Policies
create policy "Users can view their own favorites." on public.favorites
  for select using (auth.uid() = user_id);

create policy "Users can insert their own favorites." on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own favorites." on public.favorites
  for delete using (auth.uid() = user_id);
