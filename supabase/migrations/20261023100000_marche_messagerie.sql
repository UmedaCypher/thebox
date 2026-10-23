-- =============================================================================
-- THE BOX — Marché et messagerie (23/10/2026)
--
--  1. Annonces : une montre « à vendre » ou « à échanger » apparaît dans le Marché,
--     avec un prix demandé, une ville et un mot facultatifs. Jamais le prix d'achat ni la valeur.
--  2. Marché : recherche filtrée via une fonction qui ne renvoie que des champs publics.
--  3. Passeport et profil public : affichent l'annonce et l'option « accepte les messages ».
--  4. Messagerie : une conversation par paire de membres, lecture réservée aux participants,
--     envoi uniquement via des fonctions (blocage, limites anti-spam, longueur).
--  5. Blocage d'un membre et signalement d'un message.
--
-- Remplace les anciennes fonctions search_market_watches, get_market_available_brands,
-- get_user_conversations, create_or_get_conversation et count_unread_conversations, et toutes les anciennes règles
-- d'accès des tables conversations, conversation_participants et messages.
-- Ré-exécutable sans risque.
-- =============================================================================

create schema if not exists private;

-- -----------------------------------------------------------------------------
-- 1. Annonces
-- -----------------------------------------------------------------------------

alter table public.watches
  add column if not exists listed_at timestamptz,
  add column if not exists sale_city text,
  add column if not exists sale_note text;

alter table public.watches drop constraint if exists watches_sale_city_len;
alter table public.watches add constraint watches_sale_city_len check (sale_city is null or char_length(sale_city) <= 80) not valid;
alter table public.watches drop constraint if exists watches_sale_note_len;
alter table public.watches add constraint watches_sale_note_len check (sale_note is null or char_length(sale_note) <= 1000) not valid;
alter table public.watches drop constraint if exists watches_sale_price_positive;
alter table public.watches add constraint watches_sale_price_positive check (sale_price is null or sale_price >= 0) not valid;

-- Date de mise en annonce tenue par la base (le client ne peut pas « remonter » son annonce),
-- et pseudo obligatoire pour publier une annonce (c'est lui qui s'affiche dans le Marché).
create or replace function private.track_listing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.current_status::text in ('for_sale', 'for_exchange') then
    if tg_op = 'UPDATE' and old.current_status::text in ('for_sale', 'for_exchange') then
      new.listed_at := coalesce(old.listed_at, now());
    else
      new.listed_at := now();
    end if;
    if not exists (select 1 from public.profiles p where p.id = new.user_id and p.username is not null) then
      raise exception 'USERNAME_REQUIRED';
    end if;
  else
    new.listed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists watches_track_listing on public.watches;
create trigger watches_track_listing
  before insert or update on public.watches
  for each row execute function private.track_listing();

-- Annonces déjà existantes
update public.watches
set listed_at = coalesce(updated_at, created_at, now())
where current_status::text in ('for_sale', 'for_exchange') and listed_at is null;

create index if not exists watches_market_idx on public.watches (current_status, listed_at desc);

-- -----------------------------------------------------------------------------
-- 2. Blocages et signalements
-- -----------------------------------------------------------------------------

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);
alter table public.user_blocks enable row level security;
drop policy if exists user_blocks_select_own on public.user_blocks;
create policy user_blocks_select_own on public.user_blocks
  for select to authenticated using ((select auth.uid()) = blocker_id);
revoke all on public.user_blocks from anon;
revoke insert, update, delete on public.user_blocks from authenticated;
grant select on public.user_blocks to authenticated;

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  unique (reporter_id, message_id)
);
alter table public.message_reports enable row level security;
-- Aucune politique : lecture et écriture uniquement via la fonction report_message
-- et, pour l'équipe, depuis le SQL Editor.
revoke all on public.message_reports from anon, authenticated;

create or replace function private.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_blocks
                 where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;
revoke execute on function private.is_blocked_between(uuid, uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_blocked_between(uuid, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Marché
-- -----------------------------------------------------------------------------

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('search_market_watches', 'get_market_available_brands', 'search_market', 'get_market_filters')
  loop
    execute 'drop function ' || f.sig;
  end loop;
end $$;

create function public.search_market(
  p_query text default null,
  p_brand text default null,
  p_kind text default null,          -- 'sale' | 'exchange'
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_condition text default null,
  p_box_papers text default null,
  p_min_diameter numeric default null,
  p_max_diameter numeric default null,
  p_sort text default 'recent',      -- 'recent' | 'price_asc' | 'price_desc'
  p_limit integer default 48,
  p_offset integer default 0
)
returns table (
  watch_id uuid, brand text, model text, reference_number text, year_of_production smallint,
  case_diameter_mm numeric, condition text, box_papers_status text, kind text,
  sale_price numeric, sale_city text, listed_at timestamptz, main_photo_path text,
  seller_username text, seller_is_public boolean, is_mine boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select w.id, w.brand, w.model, w.reference_number, w.year_of_production::smallint,
         w.case_diameter_mm, w.condition, w.box_papers_status,
         case when w.current_status::text = 'for_sale' then 'sale' else 'exchange' end,
         case when w.current_status::text = 'for_sale' then w.sale_price end,
         w.sale_city, w.listed_at,
         (select ph.storage_path from public.photos ph
          where ph.watch_id = w.id and (ph.photo_type <> 'wrist_shot' or coalesce(ph.is_public_gallery, false))
          order by ph.is_main_photo desc, (ph.photo_type = 'watch_only') desc, ph.created_at limit 1),
         p.username, coalesce(p.is_public, false), w.user_id = (select auth.uid())
  from public.watches w
  join public.profiles p on p.id = w.user_id
  where w.current_status::text in ('for_sale', 'for_exchange')
    and p.username is not null
    and ((select auth.uid()) is null or not private.is_blocked_between((select auth.uid()), w.user_id))
    and (nullif(btrim(p_query), '') is null
         or strpos(lower(w.brand || ' ' || w.model || ' ' || coalesce(w.reference_number, '')), lower(btrim(p_query))) > 0)
    and (p_brand is null or w.brand = p_brand)
    and (p_kind is null or (p_kind = 'sale' and w.current_status::text = 'for_sale')
                        or (p_kind = 'exchange' and w.current_status::text = 'for_exchange'))
    and (p_min_price is null or (w.current_status::text = 'for_sale' and w.sale_price >= p_min_price))
    and (p_max_price is null or (w.current_status::text = 'for_sale' and w.sale_price <= p_max_price))
    and (p_condition is null or w.condition = p_condition)
    and (p_box_papers is null or w.box_papers_status = p_box_papers)
    and (p_min_diameter is null or w.case_diameter_mm >= p_min_diameter)
    and (p_max_diameter is null or w.case_diameter_mm <= p_max_diameter)
  order by
    case when p_sort = 'price_asc' then case when w.current_status::text = 'for_sale' then w.sale_price end end asc nulls last,
    case when p_sort = 'price_desc' then case when w.current_status::text = 'for_sale' then w.sale_price end end desc nulls last,
    w.listed_at desc nulls last
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
$$;

-- Valeurs proposées dans les filtres : uniquement celles présentes dans les annonces.
create function public.get_market_filters()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  with l as (
    select w.* from public.watches w join public.profiles p on p.id = w.user_id
    where w.current_status::text in ('for_sale', 'for_exchange') and p.username is not null
  )
  select json_build_object(
    'brands', coalesce((select json_agg(x order by x) from (select distinct brand as x from l) s), '[]'::json),
    'conditions', coalesce((select json_agg(x order by x) from (select distinct condition as x from l where condition is not null) s), '[]'::json),
    'box_papers', coalesce((select json_agg(x order by x) from (select distinct box_papers_status as x from l where box_papers_status is not null) s), '[]'::json),
    'count', (select count(*) from l)
  );
$$;

revoke execute on function public.search_market(text, text, text, numeric, numeric, text, text, numeric, numeric, text, integer, integer) from public;
revoke execute on function public.get_market_filters() from public;
grant execute on function public.search_market(text, text, text, numeric, numeric, text, text, numeric, numeric, text, integer, integer) to anon, authenticated;
grant execute on function public.get_market_filters() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Passeport et profil public : annonce et messages
-- -----------------------------------------------------------------------------

-- Visible par le propriétaire, ou par tous si le passeport est partagé, si le profil est public
-- ou si la montre est en annonce.
create or replace function public.get_watch_passport(p_watch_id uuid)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'id', w.id,
    'brand', w.brand,
    'model', w.model,
    'reference_number', w.reference_number,
    'year_of_production', w.year_of_production,
    'movement', w.movement,
    'case_diameter_mm', w.case_diameter_mm,
    'lug_to_lug_mm', w.lug_to_lug_mm,
    'lug_width_mm', w.lug_width_mm,
    'case_material', w.case_material,
    'dial_color', w.dial_color,
    'bracelet_material', w.bracelet_material,
    'bracelet_type', w.bracelet_type,
    'condition', w.condition,
    'box_papers_status', w.box_papers_status,
    'owner_username', p.username,
    'owner_is_public', coalesce(p.is_public, false),
    'owner_accepts_messages', coalesce(p.allow_private_messages, true) and p.username is not null,
    'is_owner', coalesce(w.user_id = (select auth.uid()), false),
    'listing', case when w.current_status::text in ('for_sale', 'for_exchange') then json_build_object(
        'kind', case when w.current_status::text = 'for_sale' then 'sale' else 'exchange' end,
        'price', case when w.current_status::text = 'for_sale' then w.sale_price end,
        'city', w.sale_city,
        'note', w.sale_note,
        'listed_at', w.listed_at) end,
    'service_count', (select count(*) from public.maintenance_entries m where m.watch_id = w.id),
    'last_service_on', greatest(
        w.last_service_date,
        (select max(m.performed_on) from public.maintenance_entries m where m.watch_id = w.id
           and m.kind in ('revision', 'etancheite', 'reparation'))),
    'wear_count', (select count(*) from public.wear_logs l where l.watch_id = w.id),
    'photos', coalesce((
      select json_agg(json_build_object('storage_path', ph.storage_path, 'photo_type', ph.photo_type, 'is_main_photo', ph.is_main_photo)
                      order by ph.is_main_photo desc, ph.created_at)
      from public.photos ph
      where ph.watch_id = w.id
        and (ph.photo_type <> 'wrist_shot' or coalesce(ph.is_public_gallery, false) or w.user_id = (select auth.uid()))), '[]'::json)
  )
  from public.watches w
  left join public.profiles p on p.id = w.user_id
  where w.id = p_watch_id
    and (w.user_id = (select auth.uid()) or w.passport_public or coalesce(p.is_public, false)
         or (w.current_status::text in ('for_sale', 'for_exchange') and p.username is not null));
$$;
revoke execute on function public.get_watch_passport(uuid) from public;
grant execute on function public.get_watch_passport(uuid) to anon, authenticated;

create or replace function public.get_public_collection(p_username text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'id', case when coalesce(p.is_public, false) then p.id end,
    'username', p.username,
    'profile_picture_url', case when coalesce(p.is_public, false) then p.profile_picture_url end,
    'created_at', case when coalesce(p.is_public, false) then p.created_at end,
    'is_public', coalesce(p.is_public, false),
    'accepts_messages', coalesce(p.is_public, false) and coalesce(p.allow_private_messages, true),
    'watches', case when coalesce(p.is_public, false) then coalesce((
      select json_agg(json_build_object(
        'id', w.id, 'brand', w.brand, 'model', w.model,
        'reference_number', w.reference_number, 'year_of_production', w.year_of_production,
        'kind', case w.current_status::text when 'for_sale' then 'sale' when 'for_exchange' then 'exchange' end,
        'sale_price', case when w.current_status::text = 'for_sale' then w.sale_price end,
        'main_photo_path', (select ph.storage_path from public.photos ph where ph.watch_id = w.id
                              and (ph.photo_type <> 'wrist_shot' or coalesce(ph.is_public_gallery, false))
                            order by ph.is_main_photo desc, (ph.photo_type = 'watch_only') desc, ph.created_at limit 1)
      ) order by w.created_at desc)
      from public.watches w where w.user_id = p.id), '[]'::json) else '[]'::json end
  )
  from public.profiles p
  where p.username = p_username;
$$;
revoke execute on function public.get_public_collection(text) from public;
grant execute on function public.get_public_collection(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Messagerie : structure
-- -----------------------------------------------------------------------------

alter table public.conversations
  add column if not exists pair_key text,
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists watch_id uuid references public.watches (id) on delete set null;

-- Une seule conversation par paire de membres : on rattache les anciennes conversations
-- (la plus ancienne par paire garde la clé, les doublons éventuels restent lisibles).
with pairs as (
  select cp.conversation_id, min(cp.user_id::text) as a, max(cp.user_id::text) as b, count(*) as n
  from public.conversation_participants cp group by cp.conversation_id
), ranked as (
  select pairs.conversation_id, pairs.a || ':' || pairs.b as k,
         row_number() over (partition by pairs.a, pairs.b order by c.created_at) as rn
  from pairs join public.conversations c on c.id = pairs.conversation_id
  where pairs.n = 2
)
update public.conversations c set pair_key = ranked.k
from ranked
where c.id = ranked.conversation_id and ranked.rn = 1 and c.pair_key is null
  and not exists (select 1 from public.conversations x where x.pair_key = ranked.k);

create unique index if not exists conversations_pair_key_key on public.conversations (pair_key);
create index if not exists conversation_participants_user_idx on public.conversation_participants (user_id);
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
create index if not exists messages_sender_created_idx on public.messages (sender_id, created_at desc);

alter table public.messages drop constraint if exists messages_content_len;
alter table public.messages add constraint messages_content_len
  check (char_length(btrim(content)) between 1 and 2000) not valid;

create or replace function private.is_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.conversation_participants
                 where conversation_id = p_conversation_id and user_id = (select auth.uid()));
$$;
revoke execute on function private.is_participant(uuid) from public, anon;
grant execute on function private.is_participant(uuid) to authenticated;

-- Règles d'accès : on repart de zéro sur les trois tables.
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('conversations', 'conversation_participants', 'messages')
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create policy conversations_select_participant on public.conversations
  for select to authenticated using ((select private.is_participant(id)));
create policy participants_select_own on public.conversation_participants
  for select to authenticated using ((select auth.uid()) = user_id);
create policy messages_select_participant on public.messages
  for select to authenticated using ((select private.is_participant(conversation_id)));

-- Écritures uniquement via les fonctions ci-dessous.
revoke all on public.conversations, public.conversation_participants, public.messages from anon;
revoke insert, update, delete on public.conversations, public.conversation_participants, public.messages from authenticated;
grant select on public.conversations, public.conversation_participants, public.messages to authenticated;

-- Nouveaux messages en direct (Supabase Realtime respecte les règles de lecture ci-dessus).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 6. Messagerie : fonctions
-- -----------------------------------------------------------------------------

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('get_user_conversations', 'create_or_get_conversation', 'count_unread_conversations', 'start_conversation', 'send_message',
                        'mark_conversation_read', 'get_my_conversations', 'get_unread_count', 'set_block', 'report_message')
  loop
    execute 'drop function ' || f.sig;
  end loop;
end $$;

-- Ouvre (ou retrouve) la conversation avec un membre : depuis une annonce / un passeport (p_watch_id)
-- ou depuis un profil public (p_username).
create function public.start_conversation(p_username text default null, p_watch_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  target uuid;
  k text;
  conv uuid;
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.profiles where id = me and username is not null) then
    raise exception 'USERNAME_REQUIRED';
  end if;

  if p_watch_id is not null then
    select w.user_id into target
    from public.watches w join public.profiles p on p.id = w.user_id
    where w.id = p_watch_id
      and (w.passport_public or coalesce(p.is_public, false)
           or (w.current_status::text in ('for_sale', 'for_exchange') and p.username is not null));
  else
    select p.id into target from public.profiles p
    where p.username = p_username and coalesce(p.is_public, false);
  end if;

  if target is null then raise exception 'NOT_FOUND'; end if;
  if target = me then raise exception 'SELF'; end if;
  if private.is_blocked_between(me, target) then raise exception 'BLOCKED'; end if;

  k := least(me::text, target::text) || ':' || greatest(me::text, target::text);
  select id into conv from public.conversations where pair_key = k;

  if conv is not null then
    if p_watch_id is not null then
      update public.conversations set watch_id = p_watch_id where id = conv;
    end if;
    return conv;
  end if;

  if not coalesce((select allow_private_messages from public.profiles where id = target), true) then
    raise exception 'MESSAGES_DISABLED';
  end if;
  if (select count(*) from public.conversations where created_by = me and created_at > now() - interval '1 day') >= 20 then
    raise exception 'RATE_LIMIT';
  end if;

  insert into public.conversations (pair_key, created_by, watch_id)
  values (k, me, p_watch_id)
  on conflict (pair_key) do nothing
  returning id into conv;

  if conv is null then
    select id into conv from public.conversations where pair_key = k;
    return conv;
  end if;

  insert into public.conversation_participants (conversation_id, user_id, last_read_at)
  values (conv, me, now()), (conv, target, null)
  on conflict do nothing;
  return conv;
end;
$$;

create function public.send_message(p_conversation_id uuid, p_content text)
returns public.messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  other uuid;
  body text := btrim(coalesce(p_content, ''));
  msg public.messages;
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.conversation_participants where conversation_id = p_conversation_id and user_id = me) then
    raise exception 'NOT_FOUND';
  end if;
  if char_length(body) < 1 or char_length(body) > 2000 then raise exception 'INVALID_CONTENT'; end if;

  select user_id into other from public.conversation_participants
  where conversation_id = p_conversation_id and user_id <> me limit 1;
  if other is not null and private.is_blocked_between(me, other) then raise exception 'BLOCKED'; end if;

  if (select count(*) from public.messages where sender_id = me and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'RATE_LIMIT';
  end if;

  insert into public.messages (conversation_id, sender_id, content)
  values (p_conversation_id, me, body)
  returning * into msg;

  update public.conversations set updated_at = now() where id = p_conversation_id;
  update public.conversation_participants set last_read_at = now()
  where conversation_id = p_conversation_id and user_id = me;
  return msg;
end;
$$;

create function public.mark_conversation_read(p_conversation_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.conversation_participants set last_read_at = now()
  where conversation_id = p_conversation_id and user_id = (select auth.uid());
$$;

-- Liste des conversations (ou une seule avec p_conversation_id, même encore vide).
create function public.get_my_conversations(p_conversation_id uuid default null)
returns table (
  conversation_id uuid, other_username text, other_avatar_url text, other_is_public boolean,
  watch_id uuid, watch_brand text, watch_model text, watch_photo_path text,
  watch_kind text, watch_sale_price numeric,
  last_message text, last_message_at timestamptz, last_from_me boolean,
  unread_count integer, blocked_by_me boolean, updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, op.username, op.profile_picture_url, coalesce(op.is_public, false),
         w.id, w.brand, w.model,
         (select ph.storage_path from public.photos ph
          where ph.watch_id = w.id and (ph.photo_type <> 'wrist_shot' or coalesce(ph.is_public_gallery, false))
          order by ph.is_main_photo desc, (ph.photo_type = 'watch_only') desc, ph.created_at limit 1),
         case w.current_status::text when 'for_sale' then 'sale' when 'for_exchange' then 'exchange' end,
         case when w.current_status::text = 'for_sale' then w.sale_price end,
         lm.content, lm.created_at, lm.sender_id = mine.user_id,
         (select count(*)::integer from public.messages m
          where m.conversation_id = c.id and m.sender_id <> mine.user_id
            and m.created_at > coalesce(mine.last_read_at, '-infinity'::timestamptz)),
         exists (select 1 from public.user_blocks b where b.blocker_id = mine.user_id and b.blocked_id = o.user_id),
         c.updated_at
  from public.conversation_participants mine
  join public.conversations c on c.id = mine.conversation_id
  left join public.conversation_participants o on o.conversation_id = c.id and o.user_id <> mine.user_id
  left join public.profiles op on op.id = o.user_id
  left join public.watches w on w.id = c.watch_id
  left join lateral (
    select m.content, m.created_at, m.sender_id from public.messages m
    where m.conversation_id = c.id order by m.created_at desc limit 1
  ) lm on true
  where mine.user_id = (select auth.uid())
    and (p_conversation_id is null or c.id = p_conversation_id)
    and (lm.created_at is not null or c.id = p_conversation_id)
  order by coalesce(lm.created_at, c.created_at) desc
  limit 200;
$$;

create function public.get_unread_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.conversation_participants mine
  join public.messages m on m.conversation_id = mine.conversation_id
  where mine.user_id = (select auth.uid())
    and m.sender_id <> mine.user_id
    and m.created_at > coalesce(mine.last_read_at, '-infinity'::timestamptz)
    and not exists (select 1 from public.user_blocks b where b.blocker_id = mine.user_id and b.blocked_id = m.sender_id);
$$;

-- Bloque ou débloque l'autre participant d'une conversation.
create function public.set_block(p_conversation_id uuid, p_blocked boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  other uuid;
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.conversation_participants where conversation_id = p_conversation_id and user_id = me) then
    raise exception 'NOT_FOUND';
  end if;
  select user_id into other from public.conversation_participants
  where conversation_id = p_conversation_id and user_id <> me limit 1;
  if other is null then raise exception 'NOT_FOUND'; end if;
  if p_blocked then
    insert into public.user_blocks (blocker_id, blocked_id) values (me, other) on conflict do nothing;
  else
    delete from public.user_blocks where blocker_id = me and blocked_id = other;
  end if;
end;
$$;

create function public.report_message(p_message_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare me uuid := (select auth.uid());
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (
    select 1 from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id and cp.user_id = me
    where m.id = p_message_id and m.sender_id <> me
  ) then
    raise exception 'NOT_FOUND';
  end if;
  insert into public.message_reports (reporter_id, message_id, reason)
  values (me, p_message_id, left(nullif(btrim(p_reason), ''), 500))
  on conflict (reporter_id, message_id) do nothing;
end;
$$;

do $$
declare fn text;
begin
  foreach fn in array array[
    'public.start_conversation(text, uuid)', 'public.send_message(uuid, text)', 'public.mark_conversation_read(uuid)',
    'public.get_my_conversations(uuid)', 'public.get_unread_count()', 'public.set_block(uuid, boolean)',
    'public.report_message(uuid, text)']
  loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 7. Vérification : chaque ligne doit afficher OK
-- -----------------------------------------------------------------------------
select 'Messages : lecture réservée aux participants' as verification,
       case when not exists (select 1 from pg_policies where schemaname = 'public'
                             and tablename in ('conversations', 'conversation_participants', 'messages')
                             and (cmd <> 'SELECT' or coalesce(qual, '') not ilike '%auth.uid()%' and coalesce(qual, '') not ilike '%is_participant%'))
            then 'OK' else 'À CORRIGER' end as resultat
union all
select 'Messages : aucune écriture directe',
       case when not has_table_privilege('authenticated', 'public.messages', 'INSERT')
             and not has_table_privilege('authenticated', 'public.conversation_participants', 'UPDATE')
            then 'OK' else 'À CORRIGER' end
union all
select 'Montres : toujours pas de lecture publique directe',
       case when not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'watches'
                             and cmd in ('SELECT', 'ALL') and coalesce(qual, '') not ilike '%auth.uid()%') then 'OK' else 'À CORRIGER' end
union all
select 'Messages en direct (Realtime)',
       case when exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages')
            then 'OK' else 'INFO : Realtime absent, l''app recharge les messages régulièrement' end
union all
select 'Annonces en ligne : ' || count(*), 'INFO'
from public.watches where current_status::text in ('for_sale', 'for_exchange');
