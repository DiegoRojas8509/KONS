-- SCRUM-14: a new auth user gets a profile (role ALWAYS 'artist') + a pending artist row, atomically.
-- Metadata only feeds names, so it is trimmed and length-capped (the Auth API can be called without our Zod validation).
-- Note: when promoting someone to operator, also delete their artists row so they do not show up in the review inbox.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_full_name text := left(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 80);
  v_display   text := left(coalesce(
                        nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
                        v_full_name,
                        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
                        'Artista'), 80);
begin
  insert into public.profiles (id, role, full_name, email)
  values (new.id, 'artist', v_full_name, new.email);

  insert into public.artists (profile_id, display_name)
  values (new.id, v_display);

  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
