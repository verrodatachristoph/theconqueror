-- Rename the schema to English (idempotent). Brings existing installs from the
-- original German column names to English; a no-op once already applied.
do $$
declare
  r record;
  renames text[][] := array[
    -- table, old, new
    ['trips','ort','place'],
    ['trips','land','country'],
    ['trips','land_iso3','country_iso3'],
    ['trips','art','category'],
    ['trips','abflug_iata','departure_iata'],
    ['trips','abflug_lat','departure_lat'],
    ['trips','abflug_lon','departure_lon'],
    ['trips','ziel_iata','arrival_iata'],
    ['trips','ziel_lat','arrival_lat'],
    ['trips','ziel_lon','arrival_lon'],
    ['trips','flug_stops','flight_stops'],
    ['trips','datum_start','start_date'],
    ['trips','datum_ende','end_date'],
    ['trips','tage','days'],
    ['trips','wer_von_uns','travelers'],
    ['trips','wer_sonst','other_travelers'],
    ['trips','kommentar','comment'],
    ['trips','anreise','travel_mode'],
    ['persons','farbe','color'],
    ['wishlist','land','country'],
    ['achievements','descr','description']
  ];
  i int;
begin
  for i in 1 .. array_length(renames, 1) loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = renames[i][1] and column_name = renames[i][2]
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = renames[i][1] and column_name = renames[i][3]
    ) then
      execute format('alter table public.%I rename column %I to %I', renames[i][1], renames[i][2], renames[i][3]);
    end if;
  end loop;
end $$;

-- travel_mode enum values German -> English (+ refreshed check constraint)
alter table public.trips drop constraint if exists trips_anreise_check;
alter table public.trips drop constraint if exists trips_travel_mode_check;
update public.trips set travel_mode = case travel_mode
  when 'Auto' then 'car' when 'Flugzeug' then 'plane' when 'Zug' then 'train'
  else travel_mode end
  where travel_mode in ('Auto', 'Flugzeug', 'Zug');
alter table public.trips add constraint trips_travel_mode_check
  check (travel_mode in ('car', 'plane', 'train'));

-- Indexes that referenced renamed columns / German predicates
alter index if exists trips_land_iso3_idx rename to trips_country_iso3_idx;
alter index if exists trips_wer_von_uns_idx rename to trips_travelers_idx;
drop index if exists trips_flights_need_airport_idx;
create index if not exists trips_flights_need_airport_idx
  on public.trips (id)
  where travel_mode = 'plane' and departure_iata is null;
