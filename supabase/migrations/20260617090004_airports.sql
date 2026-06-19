-- Airport lookup for flight arc origins. The form offers these as autocomplete;
-- unlisted airports may be added by free text and geocoded on save.
create table if not exists public.airports (
  iata text primary key,
  name text not null,
  lat  numeric not null,
  lon  numeric not null
);

insert into public.airports (iata, name, lat, lon) values
  ('FRA', 'Frankfurt',                50.0379,   8.5622),
  ('STR', 'Stuttgart',                48.6899,   9.2220),
  ('FKB', 'Karlsruhe/Baden-Baden',    48.7794,   8.0805),
  ('MUC', 'München',                  48.3538,  11.7861),
  ('AMS', 'Amsterdam Schiphol',       52.3105,   4.7683),
  ('ZRH', 'Zürich',                   47.4647,   8.5492),
  ('VIE', 'Wien',                     48.1103,  16.5697),
  ('PMI', 'Palma de Mallorca',        39.5517,   2.7388),
  ('BCN', 'Barcelona',                41.2974,   2.0833),
  ('LHR', 'London Heathrow',          51.4700,  -0.4543),
  ('IST', 'Istanbul',                 41.2753,  28.7519),
  ('DXB', 'Dubai',                    25.2532,  55.3657)
on conflict (iata) do update
  set name = excluded.name,
      lat  = excluded.lat,
      lon  = excluded.lon;
