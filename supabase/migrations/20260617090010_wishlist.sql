-- Bucket list of countries the family still wants to visit.
create table if not exists public.wishlist (
  iso3       text primary key,
  land       text not null,
  created_at timestamptz not null default now()
);

alter table public.wishlist enable row level security;
-- No policies: only the service/secret key (behind the app's password gate) touches it.
