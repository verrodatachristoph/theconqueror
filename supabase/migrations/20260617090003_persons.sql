-- Person lookup (codes used in trips.wer_von_uns). Names & colors are placeholders, easy to change.
create table if not exists public.persons (
  code  text primary key,
  name  text not null,
  farbe text not null   -- hex color
);

-- Example persons so the app isn't empty on first run.
-- Rename / recolor / delete them and add your own in the Admin area (/admin).
insert into public.persons (code, name, farbe) values
  ('A', 'Person A', '#3b6ea5'),  -- blue
  ('B', 'Person B', '#c06b8a')   -- rose
on conflict (code) do nothing;
