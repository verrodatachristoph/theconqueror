# 🌍 The Conqueror — a family travel map

A self-hostable web app that turns your family's trips into an interactive world
map: visited countries are shaded, flights are drawn as great-circle arcs, and
every stay can have photos. It also has statistics, head-to-head comparisons,
per-person profiles, a travel diary, achievements, a wishlist, and an admin area
— all behind a simple shared password.

Everything family-specific (people, colors, home location, password, goals)
lives in the database and is editable in the **/admin** area, so you can install
your own copy without touching the code.

---

## ✨ Features

- **World map** — choropleth of visited countries + flight arcs (departure →
  destination), pinch-zoom/pan, auto-fit to the current filter, photo markers.
- **Person filter** — show only the trips that include selected people
  (affects map, stats and lists together).
- **Statistics** — KPIs, charts, **head-to-head** comparison of two people,
  records & highlights (farthest place, continents…), seasonality, top countries.
- **Travel diary** (`/tagebuch`) — chronological timeline with photos.
- **Profiles** (`/profil`) — a page per person with their own map & stats.
- **Goals** (`/ziele`) — achievements, total flown distance, and a wishlist.
- **Add/edit trips** — geocoding, ISO country resolution, airport autocomplete,
  photo upload (auto-compressed if >1 MB).
- **Admin** (`/admin`) — manage people, home location, default airport,
  password, and achievements.

## 🧱 Tech stack

Next.js (App Router) · TypeScript · Tailwind v4 · custom d3-geo map ·
Recharts · Supabase (Postgres + Storage) · deploy on Vercel.

---

## 🚀 Setup

### 0. Prerequisites
- Node.js 20+ and npm
- A free [Supabase](https://supabase.com) project
- (optional) a [Vercel](https://vercel.com) account for deployment

### 1. Clone & install
```bash
git clone <this-repo> the-conqueror && cd the-conqueror
npm install
cp .env.example .env.local
```

### 2. Create a Supabase project
In the Supabase dashboard create a project, then collect from
**Project Settings → API**:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- publishable / anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- secret / service_role key → `SUPABASE_SERVICE_ROLE_KEY`

and from **Project Settings → Database**:
- database password → `SUPABASE_DB_PASSWORD` (only used by local scripts)

Put them all in `.env.local`.

### 3. Set the password gate secrets
```bash
# generate a signing secret
openssl rand -hex 32      # → AUTH_SECRET
```
In `.env.local` set `AUTH_SECRET` to that value and `APP_PASSWORD` to an initial
family password (you can change it later in /admin).

### 4. Apply the database schema
Pick one:

- **SQL editor** — open the Supabase SQL editor and run each file in
  `supabase/migrations/` in numeric order (or paste them all at once).
- **CLI** — `supabase link --project-ref <ref>` then `supabase db push`.
- **Script** — `node scripts/db.mjs apply supabase/migrations/<file>.sql`
  (needs `SUPABASE_DB_PASSWORD`; if the direct DB host is unreachable on your
  network, set `SUPABASE_DB_HOST` to your session pooler host — see `.env.example`).

This also creates a private `trip-photos` storage bucket and seeds two example
people and a set of achievements.

**Recommended:** populate the full worldwide airport list (≈6 000 airports, from
the open OpenFlights dataset) so the trip form can search airports by city name:
```bash
node scripts/seed-airports.mjs
```
Without it you only get a handful of seeded hubs.

### 5. Run it
```bash
npm run dev
```
Open http://localhost:3000, log in with `APP_PASSWORD`, then go to **/admin**:
- rename/recolor/add your family members,
- set your **home location** (used for "farthest trip") and a default airport,
- optionally change the password and tweak the achievements,

then start adding trips with **+ Neuer Aufenthalt**.

---

## ☁️ Deploy to Vercel
1. Push the repo to GitHub and import it in Vercel.
2. Add the env vars in **Settings → Environment Variables** (Production):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `APP_PASSWORD`, `AUTH_SECRET`.
   *(`SUPABASE_DB_PASSWORD` and `SUPABASE_DB_HOST` are only for local DB scripts
   and are **not** needed at runtime.)*
3. **Redeploy** so the new env vars take effect.
4. (optional) add a custom domain.

## 🔐 Security notes
- The app is gated by a single shared password (httpOnly, signed cookie). All
  data access happens server-side with the service-role key, which **never**
  reaches the browser.
- Row Level Security is enabled on every table, so even direct API calls with
  the anon key are denied.
- Never commit `.env.local`. Rotate `AUTH_SECRET`/keys if they leak.

## 📄 License
MIT — see `LICENSE`.
