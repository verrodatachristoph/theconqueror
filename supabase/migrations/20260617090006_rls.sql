-- ============================================================================
-- Auth allowlist + Row Level Security
-- Family app: only signed-in users whose email is in allowed_emails get access.
-- ============================================================================

-- Allowlist of family email addresses. Seed your real addresses here (see below).
create table if not exists public.allowed_emails (
  email text primary key
);

-- OPTIONAL: allowed_emails + is_allowed() back a future Supabase-Auth setup.
-- The app currently uses a shared password gate (see README), so RLS mainly
-- protects the DB against direct API access. If you wire Supabase Auth later,
-- add your addresses here, e.g.
-- insert into public.allowed_emails (email) values
--   ('you@example.com')
-- on conflict (email) do nothing;

-- Helper: is the current JWT's email on the allowlist? (case-insensitive)
create or replace function public.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.allowed_emails ae
    where ae.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_allowed() from public;
grant execute on function public.is_allowed() to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.trips          enable row level security;
alter table public.persons        enable row level security;
alter table public.airports       enable row level security;
alter table public.trip_photos    enable row level security;
alter table public.allowed_emails enable row level security;

-- One permissive policy per table for allowlisted authenticated users.
-- allowed_emails itself stays locked (no policies -> only service role can touch it).

do $$
declare
  t text;
begin
  foreach t in array array['trips', 'persons', 'airports', 'trip_photos']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_allowed_all', t);
    execute format($f$
      create policy %I on public.%I
        for all
        to authenticated
        using (public.is_allowed())
        with check (public.is_allowed())
    $f$, t || '_allowed_all', t);
  end loop;
end $$;
