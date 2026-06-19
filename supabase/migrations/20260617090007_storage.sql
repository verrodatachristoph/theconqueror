-- ============================================================================
-- Private storage bucket for trip photos. Display via signed URLs.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', false)
on conflict (id) do nothing;

-- Allowlisted authenticated users may manage objects in the trip-photos bucket.
do $$
declare
  cmd text;
begin
  foreach cmd in array array['select', 'insert', 'update', 'delete']
  loop
    execute format('drop policy if exists %I on storage.objects', 'trip_photos_' || cmd);
  end loop;

  create policy trip_photos_select on storage.objects
    for select to authenticated
    using (bucket_id = 'trip-photos' and public.is_allowed());

  create policy trip_photos_insert on storage.objects
    for insert to authenticated
    with check (bucket_id = 'trip-photos' and public.is_allowed());

  create policy trip_photos_update on storage.objects
    for update to authenticated
    using (bucket_id = 'trip-photos' and public.is_allowed())
    with check (bucket_id = 'trip-photos' and public.is_allowed());

  create policy trip_photos_delete on storage.objects
    for delete to authenticated
    using (bucket_id = 'trip-photos' and public.is_allowed());
end $$;
