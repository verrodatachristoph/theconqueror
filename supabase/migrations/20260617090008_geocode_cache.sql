-- Geocode cache so re-imports don't re-hit Nominatim.
create table if not exists public.geocode_cache (
  query      text primary key,   -- normalized "ort, land" (lower-cased, trimmed)
  lat        numeric not null,
  lon        numeric not null,
  source     text not null,      -- 'nominatim' | 'country-centroid' | 'manual'
  created_at timestamptz not null default now()
);

alter table public.geocode_cache enable row level security;
-- No policies: only the service/secret key (used by the import script) may touch it.
