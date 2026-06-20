-- Optional public read-only share link. When share_token is set, the route
-- /s/<token> shows a password-free, read-only view. null = sharing disabled.
alter table public.app_settings add column if not exists share_token text;
