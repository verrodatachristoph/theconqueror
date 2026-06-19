-- Remove legacy import-only columns. No-op on fresh installs (migration 0002
-- no longer creates them).
drop index if exists public.trips_aera_idx;
alter table public.trips drop column if exists notion_page_id;
alter table public.trips drop column if exists aera;
