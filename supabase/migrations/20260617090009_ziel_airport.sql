-- Optional destination airport for flights, so an arc can run airport -> airport
-- (e.g. FRA -> HER for Kreta). When unset, the arc ends at the geocoded Ort.
alter table public.trips add column if not exists ziel_iata text;
alter table public.trips add column if not exists ziel_lat  numeric;
alter table public.trips add column if not exists ziel_lon  numeric;
