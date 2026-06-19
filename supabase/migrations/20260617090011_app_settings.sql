-- Single-row app configuration, editable in the Admin area.
-- Seeded generically here; real values are set in the app/DB, never committed.
create table if not exists public.app_settings (
  id              int primary key default 1 check (id = 1),
  home_lat        numeric,
  home_lon        numeric,
  home_label      text not null default 'Zuhause',
  default_airport text,
  password_hash   text,            -- null => fall back to APP_PASSWORD env (fresh installs)
  updated_at      timestamptz not null default now()
);

insert into public.app_settings (id) values (1)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;
-- No policies: only the service/secret key (behind the password gate) reads/writes.
