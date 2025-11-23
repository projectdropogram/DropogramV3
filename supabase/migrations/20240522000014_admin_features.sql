-- Add Admin and Blocked columns to profiles
alter table public.profiles 
add column if not exists is_admin boolean default false,
add column if not exists is_blocked boolean default false;

-- Create App Settings table for global toggles
create table public.app_settings (
  id text primary key, -- e.g., 'global'
  enable_real_payments boolean default false,
  updated_at timestamptz default now()
);

-- Insert default settings
insert into public.app_settings (id, enable_real_payments)
values ('global', false)
on conflict (id) do nothing;

-- Enable RLS for App Settings
alter table public.app_settings enable row level security;

-- Policies for App Settings
create policy "Everyone can read app settings." on public.app_settings
  for select using (true);

create policy "Only admins can update app settings." on public.app_settings
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and is_admin = true
    )
  );

-- Policies for Profiles (Update existing or add new)
-- Only admins can update is_blocked or is_admin
-- We need a secure function or policy for this. 
-- For simplicity in this phase, we'll rely on Supabase Dashboard for promoting admins initially,
-- and then admins can use the UI to block users.

-- Create a policy to allow admins to update ANY profile (to block them)
create policy "Admins can update any profile." on public.profiles
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and is_admin = true
    )
  );
