-- Sprint 1: schema + RLS (SCRUM-12, SCRUM-13)
-- Design notes:
--  * Writes are restricted with COLUMN-LEVEL GRANTS (artists can never touch status / reviewed_* / commission_rate)
--    and ROW-LEVEL POLICIES (ownership, workflow state).
--  * Approvals/rejections go through public.review_entity() (operator only, atomic status + review_logs).
--  * anon can read only approved artworks, their images and the public columns of approved artists.
--  * Artworks are never deleted (no DELETE grant): they are marked 'retired'.

-- ---------------------------------------------------------------- enums
create type public.user_role         as enum ('artist', 'client', 'operator');
create type public.review_status     as enum ('pending', 'approved', 'rejected');
create type public.artwork_orientation as enum ('horizontal', 'vertical', 'square');
create type public.artwork_status    as enum ('draft', 'pending_review', 'approved', 'rejected', 'rented', 'sold', 'retired');
create type public.review_entity     as enum ('artist', 'artwork');
create type public.review_decision   as enum ('approved', 'rejected');

-- ---------------------------------------------------------------- tables
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       public.user_role not null default 'artist',
  full_name  text,
  email      text,
  created_at timestamptz not null default now()
);

create table public.artists (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null unique references public.profiles (id) on delete cascade,
  display_name    text not null,
  bio             text,
  statement       text,
  city            text,
  instagram       text,
  commission_rate numeric not null default 0.60 check (commission_rate between 0 and 1),
  status          public.review_status not null default 'pending',
  reviewed_at     timestamptz,
  reviewed_by     uuid references public.profiles (id),
  created_at      timestamptz not null default now()
);

create index artists_reviewed_by_idx on public.artists (reviewed_by);

create table public.galleries (
  id          uuid primary key default gen_random_uuid(),
  artist_id   uuid not null references public.artists (id) on delete cascade,
  title       text not null,
  description text,
  slug        text unique,
  created_at  timestamptz not null default now()
);
create index galleries_artist_id_idx on public.galleries (artist_id);

create table public.artworks (
  id                 uuid primary key default gen_random_uuid(),
  artist_id          uuid not null references public.artists (id),
  gallery_id         uuid references public.galleries (id) on delete set null,
  title              text not null,
  technique          text,
  year               int check (year between 1000 and 2200),
  width_cm           numeric not null check (width_cm > 0),
  height_cm          numeric not null check (height_cm > 0),
  depth_cm           numeric check (depth_cm > 0),
  -- derived from measurements, never captured by the artist
  orientation        public.artwork_orientation generated always as (
                       case when width_cm > height_cm then 'horizontal'::public.artwork_orientation
                            when width_cm < height_cm then 'vertical'::public.artwork_orientation
                            else 'square'::public.artwork_orientation end
                     ) stored,
  dominant_palette   text[] not null default '{}',
  recommended_spaces text[] not null default '{}',
  monthly_rent       numeric not null check (monthly_rent > 0),
  sale_price         numeric check (sale_price > 0),
  status             public.artwork_status not null default 'draft',
  reviewed_at        timestamptz,
  reviewed_by        uuid references public.profiles (id),
  created_at         timestamptz not null default now()
);
create index artworks_artist_id_idx  on public.artworks (artist_id);
create index artworks_gallery_id_idx on public.artworks (gallery_id);
create index artworks_reviewed_by_idx on public.artworks (reviewed_by);
-- catalog filters only ever look at approved works
create index artworks_catalog_rent_idx    on public.artworks (monthly_rent) where status = 'approved';
create index artworks_catalog_palette_idx on public.artworks using gin (dominant_palette) where status = 'approved';
create index artworks_catalog_spaces_idx  on public.artworks using gin (recommended_spaces) where status = 'approved';

create table public.artwork_images (
  id           uuid primary key default gen_random_uuid(),
  artwork_id   uuid not null references public.artworks (id) on delete cascade,
  storage_path text not null,
  position     int not null default 0,
  is_primary   boolean not null default false
);
create index artwork_images_artwork_id_idx on public.artwork_images (artwork_id);
create unique index artwork_images_one_primary_idx on public.artwork_images (artwork_id) where is_primary;

create table public.review_logs (
  id          uuid primary key default gen_random_uuid(),
  entity_type public.review_entity not null,
  entity_id   uuid not null,
  reviewer_id uuid not null references public.profiles (id),
  decision    public.review_decision not null,
  notes       text,
  created_at  timestamptz not null default now(),
  -- every rejection must carry its reason
  constraint review_logs_rejection_needs_notes check (decision <> 'rejected' or length(btrim(coalesce(notes, ''))) > 0)
);
create index review_logs_entity_idx on public.review_logs (entity_type, entity_id);
create index review_logs_reviewer_id_idx on public.review_logs (reviewer_id);

-- ---------------------------------------------------------------- helpers (private schema, not exposed by the API)
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_operator()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'operator'
  );
$$;

create function private.current_artist_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select a.id from public.artists a where a.profile_id = (select auth.uid());
$$;

-- artist id of the caller, only when the operator already approved the account
create function private.current_approved_artist_id()
returns uuid language sql stable security definer set search_path = ''
as $$
  select a.id from public.artists a
  where a.profile_id = (select auth.uid()) and a.status = 'approved';
$$;

revoke execute on function private.is_operator(), private.current_artist_id(), private.current_approved_artist_id()
  from public, anon;
grant execute on function private.is_operator(), private.current_artist_id(), private.current_approved_artist_id()
  to authenticated;

-- new auth user -> profile. Role is ALWAYS 'artist': operators are promoted manually, never from client metadata.
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (new.id, 'artist', new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------- review RPC (operator only, atomic)
create function public.review_entity(
  p_entity_type public.review_entity,
  p_entity_id   uuid,
  p_decision    public.review_decision,
  p_notes       text default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_reviewer uuid := (select auth.uid());
  v_rows int;
begin
  if not (select private.is_operator()) then
    raise exception 'only operators can review' using errcode = '42501';
  end if;
  if p_decision = 'rejected' and length(btrim(coalesce(p_notes, ''))) = 0 then
    raise exception 'a rejection requires a note' using errcode = '22023';
  end if;

  if p_entity_type = 'artist' then
    update public.artists
       set status = p_decision::text::public.review_status, reviewed_at = now(), reviewed_by = v_reviewer
     where id = p_entity_id and status = 'pending';
  else
    update public.artworks
       set status = p_decision::text::public.artwork_status, reviewed_at = now(), reviewed_by = v_reviewer
     where id = p_entity_id and status = 'pending_review';
  end if;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'entity not found or not pending review' using errcode = 'P0002';
  end if;

  insert into public.review_logs (entity_type, entity_id, reviewer_id, decision, notes)
  values (p_entity_type, p_entity_id, v_reviewer, p_decision, nullif(btrim(p_notes), ''));
end;
$$;
revoke execute on function public.review_entity(public.review_entity, uuid, public.review_decision, text) from public, anon;
grant  execute on function public.review_entity(public.review_entity, uuid, public.review_decision, text) to authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.profiles       enable row level security;
alter table public.artists        enable row level security;
alter table public.galleries      enable row level security;
alter table public.artworks       enable row level security;
alter table public.artwork_images enable row level security;
alter table public.review_logs    enable row level security;

-- Supabase grants ALL on new tables to anon/authenticated by default: start from zero.
revoke all on public.profiles, public.artists, public.galleries, public.artworks,
              public.artwork_images, public.review_logs from anon, authenticated;

-- profiles: read own (operator reads all); the user can only edit full_name. No client insert/delete.
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_operator()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- artists: status / reviewed_* / commission_rate are not grantable columns -> only review_entity() changes them.
grant select on public.artists to authenticated;
grant select (id, display_name, bio, statement, city, instagram) on public.artists to anon;
grant insert (profile_id, display_name, bio, statement, city, instagram) on public.artists to authenticated;
grant update (display_name, bio, statement, city, instagram) on public.artists to authenticated;
create policy artists_select_public on public.artists for select to anon, authenticated
  using (status = 'approved');
create policy artists_select_own_or_operator on public.artists for select to authenticated
  using (profile_id = (select auth.uid()) or (select private.is_operator()));
create policy artists_insert_own on public.artists for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy artists_update_own on public.artists for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- galleries: only an approved artist manages its own; operator reads all.
grant select, insert, update, delete on public.galleries to authenticated;
create policy galleries_select on public.galleries for select to authenticated
  using (artist_id = (select private.current_artist_id()) or (select private.is_operator()));
create policy galleries_insert on public.galleries for insert to authenticated
  with check (artist_id = (select private.current_approved_artist_id()));
create policy galleries_update on public.galleries for update to authenticated
  using (artist_id = (select private.current_approved_artist_id()))
  with check (artist_id = (select private.current_approved_artist_id()));
create policy galleries_delete on public.galleries for delete to authenticated
  using (artist_id = (select private.current_approved_artist_id()));

-- artworks: no DELETE grant (retire instead). reviewed_* and sale_price-for-anon are not exposed.
grant select (id, artist_id, gallery_id, title, technique, year, width_cm, height_cm, depth_cm, orientation,
              dominant_palette, recommended_spaces, monthly_rent, status, created_at)
  on public.artworks to anon;   -- sale_price is not promoted: not public
grant select on public.artworks to authenticated;
grant insert (artist_id, gallery_id, title, technique, year, width_cm, height_cm, depth_cm,
              dominant_palette, recommended_spaces, monthly_rent, sale_price)
  on public.artworks to authenticated;
grant update (gallery_id, title, technique, year, width_cm, height_cm, depth_cm,
              dominant_palette, recommended_spaces, monthly_rent, sale_price, status)
  on public.artworks to authenticated;
create policy artworks_select_public on public.artworks for select to anon, authenticated
  using (status = 'approved');
create policy artworks_select_own_or_operator on public.artworks for select to authenticated
  using (artist_id = (select private.current_artist_id()) or (select private.is_operator()));
create policy artworks_insert_own on public.artworks for insert to authenticated
  with check (
    artist_id = (select private.current_approved_artist_id())
    and (gallery_id is null or exists (select 1 from public.galleries g where g.id = gallery_id and g.artist_id = artist_id))
  );
-- editable only while draft/rejected; the artist can move it to draft, pending_review or retired, never to approved.
create policy artworks_update_own on public.artworks for update to authenticated
  using (artist_id = (select private.current_approved_artist_id()) and status in ('draft', 'rejected'))
  with check (
    artist_id = (select private.current_approved_artist_id())
    and status in ('draft', 'pending_review', 'retired')
    and (gallery_id is null or exists (select 1 from public.galleries g where g.id = gallery_id and g.artist_id = artist_id))
  );

-- artwork_images: public for approved works; the owner manages them only while the work is draft/rejected.
grant select on public.artwork_images to anon, authenticated;
grant insert, update, delete on public.artwork_images to authenticated;
create policy artwork_images_select_public on public.artwork_images for select to anon, authenticated
  using (exists (select 1 from public.artworks w where w.id = artwork_id and w.status = 'approved'));
create policy artwork_images_select_own_or_operator on public.artwork_images for select to authenticated
  using ((select private.is_operator())
         or exists (select 1 from public.artworks w where w.id = artwork_id and w.artist_id = (select private.current_artist_id())));
create policy artwork_images_insert_own on public.artwork_images for insert to authenticated
  with check (exists (select 1 from public.artworks w
                      where w.id = artwork_id and w.artist_id = (select private.current_approved_artist_id())
                        and w.status in ('draft', 'rejected')));
create policy artwork_images_update_own on public.artwork_images for update to authenticated
  using (exists (select 1 from public.artworks w
                 where w.id = artwork_id and w.artist_id = (select private.current_approved_artist_id())
                   and w.status in ('draft', 'rejected')))
  with check (exists (select 1 from public.artworks w
                      where w.id = artwork_id and w.artist_id = (select private.current_approved_artist_id())
                        and w.status in ('draft', 'rejected')));
create policy artwork_images_delete_own on public.artwork_images for delete to authenticated
  using (exists (select 1 from public.artworks w
                 where w.id = artwork_id and w.artist_id = (select private.current_approved_artist_id())
                   and w.status in ('draft', 'rejected')));

-- review_logs: only operators write; artists read the logs of their own artist record / artworks (to see rejection notes).
grant select, insert on public.review_logs to authenticated;
create policy review_logs_select on public.review_logs for select to authenticated
  using (
    (select private.is_operator())
    or (entity_type = 'artist'  and entity_id = (select private.current_artist_id()))
    or (entity_type = 'artwork' and exists (select 1 from public.artworks w
                                            where w.id = entity_id and w.artist_id = (select private.current_artist_id())))
  );
create policy review_logs_insert_operator on public.review_logs for insert to authenticated
  with check ((select private.is_operator()) and reviewer_id = (select auth.uid()));
