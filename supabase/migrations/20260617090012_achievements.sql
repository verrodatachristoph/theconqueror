-- Configurable achievements. `metric` references an aggregate the app knows how
-- to compute (trips, countries, continents, flights, maxDays, maxKm,
-- familyTrips, years); `target` is the threshold. Editable in the Admin area.
create table if not exists public.achievements (
  id      text primary key,
  icon    text not null,
  title   text not null,
  descr   text not null,
  metric  text not null,
  target  int  not null,
  sort    int  not null default 0,
  enabled boolean not null default true
);

insert into public.achievements (id, icon, title, descr, metric, target, sort) values
  ('first',   '🧳', 'Erste Schritte',    'Die erste Reise',                 'trips',       1,    10),
  ('c10',     '🗺️', 'Länder-Sammler',    '10 Länder besucht',               'countries',   10,   20),
  ('c20',     '🌍', 'Weltenbummler',     '20 Länder besucht',               'countries',   20,   30),
  ('cont3',   '🧭', 'Kontinent-Hüpfer',  '3 Kontinente bereist',            'continents',  3,    40),
  ('fly20',   '✈️', 'Vielflieger',       '20 Flüge',                        'flights',     20,   50),
  ('trips50', '🏅', 'Reise-Veteran',     '50 Reisen insgesamt',             'trips',       50,   60),
  ('long21',  '🏖️', 'Langzeit-Urlauber', 'Ein Aufenthalt ≥ 21 Tage',        'maxDays',     21,   70),
  ('far',     '🛫', 'Fernweh',           'Ein Ziel ≥ 10.000 km entfernt',   'maxKm',       10000, 80),
  ('family5', '👨‍👩‍👧‍👦', 'Familienbande',  '5 Reisen mit allen dabei',        'familyTrips', 5,    90),
  ('years5',  '📅', 'Treue Reisende',    'Reisen in 5 verschiedenen Jahren', 'years',      5,    100)
on conflict (id) do nothing;

alter table public.achievements enable row level security;
-- No policies: only the service/secret key (behind the password gate) reads/writes.
