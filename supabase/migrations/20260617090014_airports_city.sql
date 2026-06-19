-- City for airport search + a trigram-ish lower index for fast ILIKE lookups.
alter table public.airports add column if not exists city text;

create index if not exists airports_name_lower_idx on public.airports (lower(name));
create index if not exists airports_city_lower_idx on public.airports (lower(city));
