-- ============================================================
-- Migration 000016: Feature flags for parallel-mode operation
-- Adds tools_enabled and dropogram_enabled to app_settings
-- so either capability can be toggled on/off independently.
-- ============================================================

alter table public.app_settings
  add column if not exists tools_enabled boolean default false,
  add column if not exists dropogram_enabled boolean default true;

-- Backfill the existing 'global' row
update public.app_settings
  set tools_enabled = false, dropogram_enabled = true
  where id = 'global';
