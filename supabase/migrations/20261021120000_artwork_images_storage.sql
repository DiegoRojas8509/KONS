-- SCRUM-19: artwork images in Supabase Storage.
-- Private bucket: objects are only readable when they belong to an approved artwork (or to the owner / an operator,
-- which artwork_images' own RLS already expresses). Files are served through signed URLs.
-- Object path convention: <artist_id>/<artwork_id>/<uuid>.<ext>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artworks', 'artworks', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Read: an object is visible to whoever can see its artwork_images row (approved works for everyone, own/all for artist/operator).
create policy artworks_bucket_select on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'artworks'
    and exists (select 1 from public.artwork_images i where i.storage_path = storage.objects.name)
  );

-- Owners also need to read an object right after uploading it, before its artwork_images row exists.
create policy artworks_bucket_select_owner on storage.objects for select to authenticated
  using (
    bucket_id = 'artworks'
    and (storage.foldername(name))[1] = (select private.current_artist_id())::text
  );

-- Write/delete: only the approved artist who owns the artwork, and only while it is draft/rejected.
create policy artworks_bucket_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'artworks'
    and (storage.foldername(name))[1] = (select private.current_approved_artist_id())::text
    and exists (
      select 1 from public.artworks w
      where w.id::text = (storage.foldername(name))[2]
        and w.artist_id = (select private.current_approved_artist_id())
        and w.status in ('draft', 'rejected')
    )
  );

create policy artworks_bucket_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'artworks'
    and (storage.foldername(name))[1] = (select private.current_approved_artist_id())::text
    and exists (
      select 1 from public.artworks w
      where w.id::text = (storage.foldername(name))[2]
        and w.artist_id = (select private.current_approved_artist_id())
        and w.status in ('draft', 'rejected')
    )
  );

-- Exactly one primary image per artwork. The partial unique index forbids two primaries, so the swap
-- has to clear first and set second, atomically. SECURITY INVOKER: artwork_images RLS still applies.
create function public.set_primary_artwork_image(p_artwork_id uuid, p_image_id uuid)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
  if not exists (select 1 from public.artwork_images where id = p_image_id and artwork_id = p_artwork_id) then
    raise exception 'image not found' using errcode = 'P0002';
  end if;
  update public.artwork_images set is_primary = false where artwork_id = p_artwork_id and is_primary;
  update public.artwork_images set is_primary = true where id = p_image_id;
end;
$$;
revoke execute on function public.set_primary_artwork_image(uuid, uuid) from public, anon;
grant  execute on function public.set_primary_artwork_image(uuid, uuid) to authenticated;
