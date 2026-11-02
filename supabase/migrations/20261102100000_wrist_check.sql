-- =====================================================================================
-- Wrist Check : série de portage, photos datées, votes « Au poignet ? » et classement par poignet
--
--  * Le Wrist Check est le portage du jour (wear_logs), avec des photos au poignet facultatives
--    rattachées au jour porté (photos.worn_on).
--  * Série : jours consécutifs portés. Un jour compte s'il est noté au plus tard 2 jours après
--    (rattrapage d'hier et d'avant-hier). Au-delà, la série est « en pause », jamais « perdue ».
--    Les jours ajoutés plus tard restent dans l'historique, sans compter pour la série.
--  * Paliers : 7, 14, 30, 50, 100, 180, 365 jours ; photos : 10, 50, 100, 250 wrist shots.
--  * Votes sur les photos publiques : un cœur, et « Au poignet ? » Petite / Parfaite / Grande.
--    On ne vote pas sur ses propres photos ; un vote par membre et par photo, modifiable.
-- Ré-exécutable sans risque.
-- =====================================================================================

-- ---------- Photos datées ----------
alter table public.photos add column if not exists worn_on date;
create index if not exists photos_user_worn_idx on public.photos (user_id, worn_on desc) where worn_on is not null;
create index if not exists photos_gallery_idx on public.photos (created_at desc) where photo_type = 'wrist_shot' and is_public_gallery = true;

-- ---------- Série de portage ----------
create or replace function private.wear_streak(p_user uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_tz text;
  v_today date;
  v_last date;
  v_current int := 0;
  v_last_len int := 0;
  v_best int := 0;
  v_status text;
  v_photos int;
  v_badges jsonb;
begin
  select coalesce(nullif(p.time_zone, ''), 'Europe/Paris') into v_tz from public.profiles p where p.id = p_user;
  v_tz := coalesce(v_tz, 'Europe/Paris');
  v_today := (now() at time zone v_tz)::date;

  with days as (
    select distinct wl.worn_on as d
    from public.wear_logs wl
    where wl.user_id = p_user
      and wl.worn_on <= v_today
      and (wl.created_at at time zone v_tz)::date <= wl.worn_on + 2
  ),
  runs as (
    select min(d) as start_day, max(d) as end_day, count(*)::int as len
    from (select d, d - (row_number() over (order by d))::int as grp from days) g
    group by grp
  )
  select (select max(end_day) from runs),
         (select coalesce(max(len), 0) from runs),
         (select len from runs order by end_day desc limit 1),
         (select coalesce(jsonb_agg(jsonb_build_object('days', m, 'earned_on', e) order by m), '[]'::jsonb)
          from (select m, (select min(r.start_day + (m - 1)) from runs r where r.len >= m) as e
                from unnest(array[7, 14, 30, 50, 100, 180, 365]) m) x
          where e is not null)
    into v_last, v_best, v_last_len, v_badges;

  if v_last is null then
    v_status := 'none';
  elsif v_last = v_today then
    v_status := 'done';  v_current := v_last_len;
  elsif v_last >= v_today - 3 then
    v_status := 'open';  v_current := v_last_len;   -- aujourd'hui (et peut-être hier, avant-hier) restent à noter
  else
    v_status := 'paused';
  end if;

  select count(*)::int into v_photos from public.photos ph where ph.user_id = p_user and ph.photo_type = 'wrist_shot';

  return jsonb_build_object(
    'today', v_today,
    'status', v_status,
    'current', v_current,
    'best', v_best,
    'paused_length', case when v_status = 'paused' then v_last_len else 0 end,
    'last_day', v_last,
    -- jours encore rattrapables (hier, avant-hier) quand la série est ouverte
    'catch_up', case when v_status = 'open' then (
        select coalesce(jsonb_agg(d::date order by d), '[]'::jsonb)
        from generate_series(greatest(v_last + 1, v_today - 2), v_today - 1, interval '1 day') d) else '[]'::jsonb end,
    'next_milestone', (select min(m) from unnest(array[7, 14, 30, 50, 100, 180, 365]) m where m > v_current),
    'badges', v_badges,
    'logged_today', exists (select 1 from public.wear_logs wl where wl.user_id = p_user and wl.worn_on = v_today),
    'photo_today', exists (select 1 from public.photos ph where ph.user_id = p_user and ph.worn_on = v_today),
    'photos', v_photos,
    'photo_badges', (select coalesce(jsonb_agg(m order by m), '[]'::jsonb) from unnest(array[10, 50, 100, 250]) m where v_photos >= m),
    'next_photo_milestone', (select min(m) from unnest(array[10, 50, 100, 250]) m where m > v_photos)
  );
end;
$$;
revoke execute on function private.wear_streak(uuid) from public, anon, authenticated;

create or replace function public.get_my_wear_streak()
returns jsonb language sql volatile security definer set search_path = '' as $$
  select private.wear_streak((select auth.uid()));
$$;
revoke execute on function public.get_my_wear_streak() from public, anon;
grant execute on function public.get_my_wear_streak() to authenticated;

-- Rappel du jour : on ajoute la série en cours, pour un message encourageant
create or replace function private.queue_daily_reminders()
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with targets as (
    select np.user_id,
           (now() at time zone coalesce(nullif(p.time_zone, ''), 'Europe/Paris'))::date as local_day
    from public.notification_prefs np
    join public.profiles p on p.id = np.user_id
    where np.daily_reminder
      and extract(hour from now() at time zone coalesce(nullif(p.time_zone, ''), 'Europe/Paris')) = np.reminder_hour
      and exists (select 1 from public.push_subscriptions s where s.user_id = np.user_id)
      and exists (select 1 from public.watches w where w.user_id = np.user_id)
  )
  insert into public.notifications (user_id, kind, data, dedupe_key)
  select t.user_id, 'daily',
         jsonb_build_object('streak', coalesce((private.wear_streak(t.user_id) ->> 'current')::int, 0)),
         'daily:' || t.user_id || ':' || t.local_day
  from targets t
  where not exists (select 1 from public.wear_logs wl where wl.user_id = t.user_id and wl.worn_on = t.local_day)
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function private.queue_daily_reminders() from public, anon, authenticated;

-- ---------- Cœurs et votes « Au poignet ? » ----------
create table if not exists public.photo_likes (
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);
create index if not exists photo_likes_user_idx on public.photo_likes (user_id);
alter table public.photo_likes enable row level security;

create table if not exists public.photo_fit_votes (
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  fit text not null check (fit in ('small', 'perfect', 'large')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);
create index if not exists photo_fit_votes_user_idx on public.photo_fit_votes (user_id);
alter table public.photo_fit_votes enable row level security;
-- Ni lecture ni écriture directe : les fonctions ci-dessous seulement.

create or replace function private.photo_social(p_photo uuid, p_me uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'likes', (select count(*) from public.photo_likes l where l.photo_id = p_photo),
    'liked', exists (select 1 from public.photo_likes l where l.photo_id = p_photo and l.user_id = p_me),
    'fit_small', (select count(*) from public.photo_fit_votes v where v.photo_id = p_photo and v.fit = 'small'),
    'fit_perfect', (select count(*) from public.photo_fit_votes v where v.photo_id = p_photo and v.fit = 'perfect'),
    'fit_large', (select count(*) from public.photo_fit_votes v where v.photo_id = p_photo and v.fit = 'large'),
    'my_fit', (select v.fit from public.photo_fit_votes v where v.photo_id = p_photo and v.user_id = p_me)
  );
$$;
revoke execute on function private.photo_social(uuid, uuid) from public, anon, authenticated;

/** Vérifie qu'on peut réagir à une photo : publique, au poignet, et pas la sienne. */
create or replace function private.check_votable(p_photo uuid, p_me uuid)
returns void language plpgsql stable security definer set search_path = '' as $$
declare v_owner uuid;
begin
  if p_me is null then raise exception 'AUTH_REQUIRED'; end if;
  select ph.user_id into v_owner from public.photos ph
   where ph.id = p_photo and ph.photo_type = 'wrist_shot' and ph.is_public_gallery = true;
  if v_owner is null then raise exception 'NOT_FOUND'; end if;
  if v_owner = p_me then raise exception 'SELF'; end if;
end;
$$;
revoke execute on function private.check_votable(uuid, uuid) from public, anon, authenticated;

create or replace function public.set_photo_fit(p_photo uuid, p_fit text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid());
begin
  perform private.check_votable(p_photo, me);
  if p_fit is null then
    delete from public.photo_fit_votes where photo_id = p_photo and user_id = me;
  elsif p_fit in ('small', 'perfect', 'large') then
    insert into public.photo_fit_votes (photo_id, user_id, fit) values (p_photo, me, p_fit)
    on conflict (photo_id, user_id) do update set fit = excluded.fit, updated_at = now();
  else
    raise exception 'INVALID_CONTENT';
  end if;
  return private.photo_social(p_photo, me);
end;
$$;
revoke execute on function public.set_photo_fit(uuid, text) from public, anon;
grant execute on function public.set_photo_fit(uuid, text) to authenticated;

create or replace function public.toggle_photo_like(p_photo uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid());
begin
  perform private.check_votable(p_photo, me);
  if exists (select 1 from public.photo_likes where photo_id = p_photo and user_id = me) then
    delete from public.photo_likes where photo_id = p_photo and user_id = me;
  else
    insert into public.photo_likes (photo_id, user_id) values (p_photo, me);
  end if;
  return private.photo_social(p_photo, me);
end;
$$;
revoke execute on function public.toggle_photo_like(uuid) from public, anon;
grant execute on function public.toggle_photo_like(uuid) to authenticated;

-- ---------- Galerie : réactions, date portée, une photo par montre, « du jour » ----------
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p
           where p.pronamespace = 'public'::regnamespace and p.proname = 'get_public_wrist_shots'
  loop execute 'drop function ' || f.sig; end loop;
end $$;

create function public.get_public_wrist_shots(
  selected_brand_filter text default null,
  min_wrist_filter numeric default null,
  max_wrist_filter numeric default null,
  page_limit integer default 60,
  page_offset integer default 0,
  p_today boolean default false,         -- uniquement les Wrist Checks du jour
  p_latest_per_watch boolean default true -- une seule photo (la plus récente) par montre
)
returns table (
  photo_id uuid, photo_storage_path text, watch_id uuid, watch_brand text, watch_model text,
  user_username text, user_wrist_size_cm numeric, worn_on date, created_at timestamptz, is_mine boolean,
  likes bigint, liked boolean, fit_small bigint, fit_perfect bigint, fit_large bigint, my_fit text
)
language sql stable security definer set search_path = '' as $$
  with me as (select (select auth.uid()) as uid),
  base as (
    select ph.id, ph.storage_path, w.id as wid, w.brand, w.model, p.username,
           coalesce(ph.wrist_shot_on_wrist_size_cm, p.wrist_size_cm) as wrist, ph.worn_on, ph.created_at, ph.user_id
    from public.photos ph
    join public.watches w on w.id = ph.watch_id
    join public.profiles p on p.id = w.user_id
    where ph.photo_type = 'wrist_shot'
      and ph.is_public_gallery = true
      and (selected_brand_filter is null or w.brand = selected_brand_filter)
      and (min_wrist_filter is null or coalesce(ph.wrist_shot_on_wrist_size_cm, p.wrist_size_cm) >= min_wrist_filter)
      and (max_wrist_filter is null or coalesce(ph.wrist_shot_on_wrist_size_cm, p.wrist_size_cm) <= max_wrist_filter)
      and (not p_today or ph.worn_on >= (now() at time zone 'Europe/Paris')::date - 1)
  ),
  picked as (
    select * from base b
    where not p_latest_per_watch
       or b.id = (select b2.id from base b2 where b2.wid = b.wid order by b2.created_at desc limit 1)
  )
  select b.id, b.storage_path, b.wid, b.brand, b.model, b.username, b.wrist, b.worn_on, b.created_at,
         b.user_id = me.uid,
         (select count(*) from public.photo_likes l where l.photo_id = b.id),
         exists (select 1 from public.photo_likes l where l.photo_id = b.id and l.user_id = me.uid),
         (select count(*) from public.photo_fit_votes v where v.photo_id = b.id and v.fit = 'small'),
         (select count(*) from public.photo_fit_votes v where v.photo_id = b.id and v.fit = 'perfect'),
         (select count(*) from public.photo_fit_votes v where v.photo_id = b.id and v.fit = 'large'),
         (select v.fit from public.photo_fit_votes v where v.photo_id = b.id and v.user_id = me.uid)
  from picked b cross join me
  order by b.created_at desc
  limit least(greatest(page_limit, 1), 200) offset greatest(page_offset, 0);
$$;
revoke execute on function public.get_public_wrist_shots(text, numeric, numeric, integer, integer, boolean, boolean) from public;
grant execute on function public.get_public_wrist_shots(text, numeric, numeric, integer, integer, boolean, boolean) to anon, authenticated;

-- ---------- Classement : ce qui tombe le mieux pour une fourchette de poignets ----------
create or replace function public.get_fit_ranking(
  p_min_wrist numeric default null, p_max_wrist numeric default null, p_min_votes integer default 5, p_limit integer default 30
)
returns table (
  brand text, model text, votes bigint, perfect_pct numeric, small_pct numeric, large_pct numeric,
  photos bigint, photo_storage_path text, case_diameter_mm numeric, lug_to_lug_mm numeric
)
language sql stable security definer set search_path = '' as $$
  with v as (
    select lower(btrim(w.brand)) as kb, lower(btrim(w.model)) as km, w.brand, w.model, w.case_diameter_mm, w.lug_to_lug_mm,
           ph.id as pid, ph.storage_path, ph.created_at, fv.fit
    from public.photo_fit_votes fv
    join public.photos ph on ph.id = fv.photo_id and ph.photo_type = 'wrist_shot' and ph.is_public_gallery = true
    join public.watches w on w.id = ph.watch_id
    join public.profiles p on p.id = ph.user_id
    where (p_min_wrist is null or coalesce(ph.wrist_shot_on_wrist_size_cm, p.wrist_size_cm) >= p_min_wrist)
      and (p_max_wrist is null or coalesce(ph.wrist_shot_on_wrist_size_cm, p.wrist_size_cm) <= p_max_wrist)
  )
  select max(brand), max(model), count(*),
         round(100.0 * count(*) filter (where fit = 'perfect') / count(*), 0),
         round(100.0 * count(*) filter (where fit = 'small') / count(*), 0),
         round(100.0 * count(*) filter (where fit = 'large') / count(*), 0),
         count(distinct pid),
         (array_agg(storage_path order by created_at desc))[1],
         max(case_diameter_mm), max(lug_to_lug_mm)
  from v
  group by kb, km
  having count(*) >= greatest(coalesce(p_min_votes, 5), 1)
  order by 4 desc, 3 desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;
revoke execute on function public.get_fit_ranking(numeric, numeric, integer, integer) from public;
grant execute on function public.get_fit_ranking(numeric, numeric, integer, integer) to anon, authenticated;
