-- Photos per trip (one may be the cover, tracked via trips.cover_photo_url)
create table if not exists public.trip_photos (
  id      uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  url     text not null,
  caption text,
  sort    int not null default 0
);

create index if not exists trip_photos_trip_id_idx on public.trip_photos (trip_id);
