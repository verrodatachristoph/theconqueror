# The Conqueror

A self-hostable family travel map. A world map colors visited countries and
draws great-circle flight arcs; alongside it: statistics, a person filter,
per-stay photos, a head-to-head/achievements/wishlist area, person profiles, a
travel diary, and an admin area. Data lives in Supabase; trips are added via the form.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Map: **custom d3-geo + world-atlas topojson** (choropleth + geoInterpolate
  arcs + d3-zoom). Not react-simple-maps (its peers target React ≤18).
- Charts: Recharts · Data/Storage: Supabase (Postgres + Storage) · Deploy: Vercel

## Data model (Supabase)
- `trips` — stays. `place`, `country`/`country_iso3`, `lat`/`lon` (destination),
  `category`, `travel_mode` (car|plane|train), `departure_*` (departure airport,
  flights only), `arrival_*` (optional destination airport), `start_date`/`end_date`,
  `days` (computed), `travelers` text[] (person codes), `other_travelers`, `comment`,
  `cover_photo_url`, `flight_stops` (jsonb, multi-leg flights).
  (The schema is English; older installs are migrated from German column names by
  `supabase/migrations/…_english_schema.sql`.)
- `persons` — code → name + color (colors are DB-driven; managed in /admin).
- `airports`, `trip_photos`, `wishlist`, `geocode_cache`.
- `app_settings` — single row: home lat/lon/label, default airport, password hash.
- `achievements` — configurable badges (icon/title/metric/target/enabled).
- Storage: private bucket `trip-photos`, signed URLs.
- RLS on all tables; the app reaches the DB server-side with the service role
  behind the password gate, so RLS mainly blocks direct API access.

## Auth (shared password gate)
`src/middleware.ts` redirects to `/login` unless a valid `conq_session` cookie
(HMAC of `AUTH_SECRET`, `src/lib/auth.ts`) is present. `src/app/auth-actions.ts`
checks the password against `app_settings.password_hash` (changeable in /admin),
falling back to `APP_PASSWORD` env for fresh installs.

## Key rules
- A flight **arc** renders only when `travel_mode = 'plane'` AND a departure
  airport with coords exists (else the country is colored but no arc).
- `days` always computed from start/end.
- Person filter (AND semantics) drives map + stats + list together.
- `country` (German name) → ISO alpha-3 (`i18n-iso-countries` + overrides).
  `place` geocoded via Nominatim (1 req/s, cached, country-centroid fallback).
  Photos >1MB are compressed client-side before upload (`src/lib/image.ts`).

## Config that lives in the DB (not the repo)
Persons, home location, default airport, family password, achievements — all
editable in **/admin**. The committed seeds are generic placeholders.

## Layout
- Pages: `/` (map+filter+list), `/tagebuch`, `/statistik`, `/profil/[code]`,
  `/ziele`, `/admin`, `/login`.
- `src/lib/`: `data.ts` (server fetchers), `settings.ts`, `trips.ts`,
  `stats.ts`, `iso.ts`, `geocode.ts` (server), `auth.ts`, `image.ts`.
- Env: see `.env.example`. `scripts/db.mjs` applies SQL; `scripts/seed-airports.mjs`
  loads the worldwide airport list.
