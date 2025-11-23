-- Create Reviews table
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null unique,
  rating int check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamptz default now()
);

-- Enable RLS for Reviews
alter table public.reviews enable row level security;

-- Policies for Reviews
create policy "Users can read all reviews." on public.reviews
  for select using (true);

create policy "Users can create reviews for their own orders." on public.reviews
  for insert with check (
    exists (
      select 1 from public.orders
      where id = order_id
      and consumer_id = auth.uid()
    )
  );

-- Create Follows table
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  producer_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (follower_id, producer_id)
);

-- Enable RLS for Follows
alter table public.follows enable row level security;

-- Policies for Follows
create policy "Users can read all follows." on public.follows
  for select using (true);

create policy "Users can follow others." on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow." on public.follows
  for delete using (auth.uid() = follower_id);
