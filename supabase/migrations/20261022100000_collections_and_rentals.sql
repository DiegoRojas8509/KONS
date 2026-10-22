-- Renta por colecciones (SCRUM-34).
-- Un cliente renta COLECCIONES completas (nunca obras sueltas): "Selección KONS" curada por el operador (modo sorpresa
-- o abierta) o la galería de un artista (abierta). Una obra pertenece a una sola colección (exclusividad). La
-- solicitud de renta aparta fechas como 'pending'; el operador la confirma o la libera. Dos solicitudes activas no
-- pueden traslaparse sobre la misma colección (restricción de exclusión, atómica).

create extension if not exists btree_gist with schema extensions;

create type public.collection_kind    as enum ('curated', 'artist');
create type public.collection_reveal  as enum ('mystery', 'open');
create type public.collection_status  as enum ('draft', 'published', 'retired');
create type public.rental_plan        as enum ('temporada', 'semestre', 'anual', 'anual_estacional');
create type public.payment_frequency  as enum ('monthly', 'quarterly', 'semiannual', 'annual', 'upfront');
create type public.rental_status      as enum ('pending', 'confirmed', 'declined', 'cancelled');

-- ---------------------------------------------------------------- tables
create table public.collections (
  id                uuid primary key default gen_random_uuid(),
  title             text not null check (length(title) between 2 and 80),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description       text check (length(coalesce(description, '')) <= 600),
  kind              public.collection_kind not null default 'curated',
  reveal            public.collection_reveal not null default 'open',
  source_gallery_id uuid references public.galleries (id) on delete set null,
  cover_artwork_id  uuid references public.artworks (id) on delete set null,
  space_types       text[] not null default '{}',
  palette           text[] not null default '{}',
  monthly_price     numeric not null check (monthly_price > 0),
  status            public.collection_status not null default 'draft',
  created_by        uuid not null references public.profiles (id),
  created_at        timestamptz not null default now()
);
create index collections_status_idx            on public.collections (status);
create index collections_created_by_idx        on public.collections (created_by);
create index collections_source_gallery_idx    on public.collections (source_gallery_id);
create index collections_cover_artwork_idx     on public.collections (cover_artwork_id);

create table public.collection_items (
  collection_id uuid not null references public.collections (id) on delete cascade,
  -- unique: an artwork lives in ONE collection only (exclusivity)
  artwork_id    uuid not null unique references public.artworks (id),
  position      int not null default 0,
  primary key (collection_id, artwork_id)
);

create table public.rental_requests (
  id                uuid primary key default gen_random_uuid(),
  folio             text not null unique default ('R-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  collection_id     uuid not null references public.collections (id),
  plan              public.rental_plan not null,
  payment_frequency public.payment_frequency not null,
  start_date        date not null,
  end_date          date not null,
  period            daterange generated always as (daterange(start_date, end_date, '[)')) stored,
  client_name       text not null check (length(client_name) between 2 and 120),
  company           text check (length(coalesce(company, '')) <= 120),
  email             text not null check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone             text check (length(coalesce(phone, '')) <= 30),
  space_type        text check (length(coalesce(space_type, '')) <= 60),
  city              text check (length(coalesce(city, '')) <= 80),
  message           text check (length(coalesce(message, '')) <= 1000),
  terms_version     text not null,
  accepted_terms_at timestamptz not null,
  status            public.rental_status not null default 'pending',
  reviewed_by       uuid references public.profiles (id),
  reviewed_at       timestamptz,
  review_notes      text check (length(coalesce(review_notes, '')) <= 1000),
  created_at        timestamptz not null default now(),
  constraint rental_requests_dates check (end_date > start_date),
  -- no two active requests may overlap on the same collection
  constraint rental_requests_no_overlap exclude using gist (collection_id with =, period with &&)
    where (status in ('pending', 'confirmed'))
);
create index rental_requests_status_created_idx on public.rental_requests (status, created_at);
create index rental_requests_reviewed_by_idx    on public.rental_requests (reviewed_by);
create index rental_requests_email_idx          on public.rental_requests (lower(email), created_at);

-- ---------------------------------------------------------------- plan rules (editable together with lib/constants/plans.ts)
-- Months blocked by the first block of each plan: the advisor assigns the following rotations by hand (Sprint 2: calendar).
create function private.plan_block_months(p public.rental_plan)
returns int language sql immutable
as $$ select case p when 'temporada' then 4 when 'semestre' then 3 when 'anual' then 4 else 3 end $$;

create function private.plan_allows_frequency(p public.rental_plan, f public.payment_frequency)
returns boolean language sql immutable
as $$
  select case p
    when 'temporada' then f in ('monthly', 'upfront')
    when 'semestre'  then f in ('quarterly', 'semiannual')
    when 'anual'     then f in ('quarterly', 'semiannual', 'annual')
    else f in ('quarterly', 'annual')
  end
$$;

-- ---------------------------------------------------------------- RPC
-- Public (anon): create a rental request. SECURITY DEFINER so anonymous visitors never touch the table directly.
create function public.request_rental(
  p_collection_id uuid,
  p_plan          public.rental_plan,
  p_frequency     public.payment_frequency,
  p_start         date,
  p_client_name   text,
  p_email         text,
  p_company       text default null,
  p_phone         text default null,
  p_space_type    text default null,
  p_city          text default null,
  p_message       text default null,
  p_terms_version text default null,
  p_accepted      boolean default false
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_folio text;
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if not coalesce(p_accepted, false) or p_terms_version is null then
    raise exception 'terms must be accepted' using errcode = '22023';
  end if;
  if not exists (select 1 from public.collections c where c.id = p_collection_id and c.status = 'published') then
    raise exception 'collection not available' using errcode = 'P0002';
  end if;
  if not private.plan_allows_frequency(p_plan, p_frequency) then
    raise exception 'payment frequency not allowed for this plan' using errcode = '22023';
  end if;
  if p_start is null or p_start < current_date or p_start > current_date + interval '18 months' then
    raise exception 'invalid start date' using errcode = '22008';
  end if;
  -- crude anti-abuse: at most 5 requests per e-mail per day
  if (select count(*) from public.rental_requests r where lower(r.email) = v_email and r.created_at > now() - interval '24 hours') >= 5 then
    raise exception 'too many requests' using errcode = '53400';
  end if;

  insert into public.rental_requests (
    collection_id, plan, payment_frequency, start_date, end_date, client_name, company, email, phone,
    space_type, city, message, terms_version, accepted_terms_at)
  values (
    p_collection_id, p_plan, p_frequency, p_start,
    (p_start + make_interval(months => private.plan_block_months(p_plan)))::date,
    btrim(p_client_name), nullif(btrim(coalesce(p_company, '')), ''), v_email, nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_space_type, '')), ''), nullif(btrim(coalesce(p_city, '')), ''),
    nullif(btrim(coalesce(p_message, '')), ''), p_terms_version, now())
  returning folio into v_folio;

  return v_folio;
end;
$$;

-- Public: occupied/held periods of a published collection (no personal data).
create function public.collection_availability(p_collection_id uuid)
returns table (start_date date, end_date date, status public.rental_status)
language sql stable security definer set search_path = ''
as $$
  select r.start_date, r.end_date, r.status
  from public.rental_requests r
  join public.collections c on c.id = r.collection_id
  where r.collection_id = p_collection_id and c.status = 'published'
    and r.status in ('pending', 'confirmed') and r.end_date >= current_date
  order by r.start_date;
$$;

-- Public: how many works a published collection holds (the items of a mystery collection are not readable).
create function public.collection_item_count(p_collection_id uuid)
returns int
language sql stable security definer set search_path = ''
as $$
  select count(*)::int
  from public.collection_items i join public.collections c on c.id = i.collection_id
  where i.collection_id = p_collection_id and c.status = 'published';
$$;

-- Public: published collections that are held or rented today.
create function public.collections_busy_now()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select distinct r.collection_id
  from public.rental_requests r join public.collections c on c.id = r.collection_id
  where c.status = 'published' and r.status in ('pending', 'confirmed')
    and current_date >= r.start_date and current_date < r.end_date;
$$;

-- Operator only: confirm or release a pending request (a release needs a note).
create function public.review_rental_request(p_id uuid, p_decision text, p_notes text default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_rows int;
begin
  if not (select private.is_operator()) then
    raise exception 'only operators can review' using errcode = '42501';
  end if;
  if p_decision not in ('confirmed', 'declined') then
    raise exception 'invalid decision' using errcode = '22023';
  end if;
  if p_decision = 'declined' and length(btrim(coalesce(p_notes, ''))) = 0 then
    raise exception 'a release requires a note' using errcode = '22023';
  end if;
  update public.rental_requests
     set status = p_decision::public.rental_status, reviewed_by = (select auth.uid()), reviewed_at = now(),
         review_notes = nullif(btrim(p_notes), '')
   where id = p_id and status = 'pending';
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'request not found or not pending' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.request_rental(uuid, public.rental_plan, public.payment_frequency, date, text, text, text, text, text, text, text, text, boolean) from public;
grant  execute on function public.request_rental(uuid, public.rental_plan, public.payment_frequency, date, text, text, text, text, text, text, text, text, boolean) to anon, authenticated;
revoke execute on function public.collection_availability(uuid), public.collection_item_count(uuid), public.collections_busy_now() from public;
grant  execute on function public.collection_availability(uuid), public.collection_item_count(uuid), public.collections_busy_now() to anon, authenticated;
revoke execute on function public.review_rental_request(uuid, text, text) from public, anon;
grant  execute on function public.review_rental_request(uuid, text, text) to authenticated;
revoke execute on function private.plan_block_months(public.rental_plan), private.plan_allows_frequency(public.rental_plan, public.payment_frequency) from public, anon, authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.collections       enable row level security;
alter table public.collection_items  enable row level security;
alter table public.rental_requests   enable row level security;

revoke all on public.collections, public.collection_items, public.rental_requests from anon, authenticated;

-- collections: published ones are public (without created_by); the operator manages everything.
grant select (id, title, slug, description, kind, reveal, source_gallery_id, cover_artwork_id, space_types, palette,
              monthly_price, status, created_at) on public.collections to anon;
grant select, insert, update, delete on public.collections to authenticated;
create policy collections_select_public on public.collections for select to anon, authenticated
  using (status = 'published');
create policy collections_operator_all on public.collections for all to authenticated
  using ((select private.is_operator())) with check ((select private.is_operator()));

-- collection_items: readable only for published OPEN collections (mystery ones keep their content secret);
-- only approved works can be put in a collection.
grant select on public.collection_items to anon;
grant select, insert, update, delete on public.collection_items to authenticated;
create policy collection_items_select_open on public.collection_items for select to anon, authenticated
  using (exists (select 1 from public.collections c
                 where c.id = collection_items.collection_id and c.status = 'published' and c.reveal = 'open'));
create policy collection_items_operator_select on public.collection_items for select to authenticated
  using ((select private.is_operator()));
create policy collection_items_operator_insert on public.collection_items for insert to authenticated
  with check ((select private.is_operator())
              and exists (select 1 from public.artworks a where a.id = collection_items.artwork_id and a.status = 'approved'));
create policy collection_items_operator_update on public.collection_items for update to authenticated
  using ((select private.is_operator())) with check ((select private.is_operator()));
create policy collection_items_operator_delete on public.collection_items for delete to authenticated
  using ((select private.is_operator()));

-- rental_requests: nobody reads or writes it directly except the operator (reads); changes go through the RPCs.
grant select on public.rental_requests to authenticated;
create policy rental_requests_operator_select on public.rental_requests for select to authenticated
  using ((select private.is_operator()));
