-- Trips / stays
create table if not exists public.trips (
  id              uuid primary key default gen_random_uuid(),
  ort             text,                               -- place
  land            text,                               -- country name as entered
  land_iso3       text,                               -- ISO 3166-1 alpha-3
  lat             numeric,                            -- destination (arc end)
  lon             numeric,
  art             text,                               -- type of stay (hotel, …)
  anreise         text check (anreise in ('Auto', 'Flugzeug', 'Zug')),
  abflug_iata     text,                               -- departure airport, flights only
  abflug_lat      numeric,                            -- arc start (from airports lookup)
  abflug_lon      numeric,
  datum_start     date,
  datum_ende      date,
  tage            int,                                -- computed from start/end on write
  wer_von_uns     text[] not null default '{}',       -- person codes
  wer_sonst       text,
  kommentar       text,
  cover_photo_url text,
  created_at      timestamptz not null default now()
);

create index if not exists trips_land_iso3_idx on public.trips (land_iso3);
create index if not exists trips_wer_von_uns_idx on public.trips using gin (wer_von_uns);

-- Legacy/incomplete flights that still need a departure airport
create index if not exists trips_flights_need_airport_idx
  on public.trips (id)
  where anreise = 'Flugzeug' and abflug_iata is null;
