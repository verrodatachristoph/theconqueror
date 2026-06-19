# Supabase schema

Apply the migrations in `supabase/migrations/` (numeric order). They are
idempotent — safe to re-run.

| # | file | what |
|---|------|------|
| 1 | `…01_extensions.sql` | pgcrypto |
| 2 | `…02_trips.sql` | trips table + indexes |
| 3 | `…03_persons.sql` | persons + two example persons |
| 4 | `…04_airports.sql` | airports lookup + common hubs |
| 5 | `…05_trip_photos.sql` | trip_photos |
| 6 | `…06_rls.sql` | RLS, is_allowed(), allowed_emails |
| 7 | `…07_storage.sql` | private `trip-photos` bucket + policies |
| 8 | `…08_geocode_cache.sql` | geocode cache |
| 9 | `…09_ziel_airport.sql` | destination airport columns |
| 10 | `…10_wishlist.sql` | wishlist |
| 11 | `…11_app_settings.sql` | home / default airport / password hash |
| 12 | `…12_achievements.sql` | configurable achievements |

## How to apply

**Option A — Supabase SQL Editor:** paste each migration (or the concatenation
of all of them) into the SQL editor and run it.

**Option B — Supabase CLI:**
```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

**Option C — direct connection:** `node scripts/db.mjs apply supabase/migrations/<file>.sql`
(reads `SUPABASE_DB_PASSWORD` / optional `SUPABASE_DB_HOST` from `.env.local`).

See the main `README.md` for the full setup walkthrough.
