-- Add theme column to app_settings
alter table public.app_settings 
add column if not exists theme text default 'original';
