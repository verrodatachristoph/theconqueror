-- Multi-leg flights: ordered intermediate stops between departure and
-- destination. Each element: { "iata": text, "lat": number, "lon": number }.
-- A flight with k stops counts as k+1 legs.
alter table public.trips add column if not exists flug_stops jsonb not null default '[]'::jsonb;
