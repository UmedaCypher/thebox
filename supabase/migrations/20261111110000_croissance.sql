-- =============================================================================
-- Croissance : pages « au poignet » par modèle, rappel du soir pour la série,
-- entonnoir d'activation au backoffice, reconstruction quotidienne du site.
-- =============================================================================

-- ---------- 1. Pages publiques par modèle ----------
-- Les photos au poignet publiques, regroupées par modèle (marque + modèle, sans tenir compte de la casse).
-- Lu à la construction du site (clé publique) : uniquement ce que la Galerie montre déjà à tous.
create or replace function public.get_wrist_models(p_min_photos int default 2)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  with shots as (
    select lower(btrim(w.brand)) as kb, lower(btrim(w.model)) as km, w.brand, w.model,
           w.case_diameter_mm, w.lug_to_lug_mm, w.reference_number,
           ph.id, ph.storage_path, ph.created_at, p.username,
           coalesce(ph.wrist_shot_on_wrist_size_cm, p.wrist_size_cm) as wrist,
           (select count(*) from public.photo_likes l where l.photo_id = ph.id) as likes,
           (select count(*) from public.photo_fit_votes v where v.photo_id = ph.id and v.fit = 'small') as fit_small,
           (select count(*) from public.photo_fit_votes v where v.photo_id = ph.id and v.fit = 'perfect') as fit_perfect,
           (select count(*) from public.photo_fit_votes v where v.photo_id = ph.id and v.fit = 'large') as fit_large
    from public.photos ph
    join public.watches w on w.id = ph.watch_id
    join public.profiles p on p.id = ph.user_id
    where ph.photo_type = 'wrist_shot' and ph.is_public_gallery = true
      and btrim(coalesce(w.brand, '')) <> '' and btrim(coalesce(w.model, '')) <> ''
  ),
  models as (
    select kb, km,
           mode() within group (order by brand) as brand,
           mode() within group (order by model) as model,
           count(*) as photo_count,
           min(wrist) as wrist_min, max(wrist) as wrist_max,
           percentile_disc(0.5) within group (order by case_diameter_mm) as case_diameter_mm,
           percentile_disc(0.5) within group (order by lug_to_lug_mm) as lug_to_lug_mm,
           mode() within group (order by reference_number) as reference_number,
           sum(fit_small) as fit_small, sum(fit_perfect) as fit_perfect, sum(fit_large) as fit_large,
           max(created_at) as updated_at
    from shots
    group by kb, km
    having count(*) >= greatest(coalesce(p_min_photos, 2), 1)
  )
  select coalesce(json_agg(json_build_object(
    'brand', m.brand, 'model', m.model, 'reference_number', m.reference_number,
    'photo_count', m.photo_count, 'wrist_min', m.wrist_min, 'wrist_max', m.wrist_max,
    'case_diameter_mm', m.case_diameter_mm, 'lug_to_lug_mm', m.lug_to_lug_mm,
    'fit_small', m.fit_small, 'fit_perfect', m.fit_perfect, 'fit_large', m.fit_large,
    'updated_at', m.updated_at,
    'photos', (
      select json_agg(json_build_object(
        'path', s.storage_path, 'wrist', s.wrist, 'username', s.username, 'likes', s.likes,
        'fit_small', s.fit_small, 'fit_perfect', s.fit_perfect, 'fit_large', s.fit_large, 'created_at', s.created_at
      ) order by s.wrist nulls last, s.created_at desc)
      from (select * from shots s2 where s2.kb = m.kb and s2.km = m.km order by s2.likes desc, s2.created_at desc limit 36) s)
  ) order by m.photo_count desc, m.brand, m.model), '[]'::json)
  from (select * from models order by photo_count desc limit 1000) m;
$$;
revoke execute on function public.get_wrist_models(int) from public;
grant execute on function public.get_wrist_models(int) to anon, authenticated;

-- ---------- 2. Rappel du soir : la série en cours s'arrête à minuit ----------
alter table public.notification_prefs add column if not exists streak_reminder boolean not null default true;

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('message', 'daily', 'maintenance', 'recap', 'wishlist', 'streak'));

create or replace function private.wants(p_user uuid, p_kind text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select case p_kind
              when 'message' then np.messages
              when 'daily' then np.daily_reminder
              when 'streak' then np.streak_reminder
              when 'maintenance' then np.maintenance
              when 'recap' then np.monthly_recap
              when 'wishlist' then np.wishlist
              else true end
       from public.notification_prefs np where np.user_id = p_user),
    p_kind <> 'daily')
  and exists (select 1 from public.push_subscriptions s where s.user_id = p_user);
$$;
revoke execute on function private.wants(uuid, text) from public, anon, authenticated;

-- À 20 h (heure du membre), série d'au moins 2 jours et rien de noté aujourd'hui : un seul rappel par jour.
-- Pas de doublon avec le rappel du matin : celui-ci ne vise que les séries en cours.
create or replace function private.queue_streak_reminders()
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with targets as (
    select p.id as user_id,
           (now() at time zone coalesce(nullif(p.time_zone, ''), 'Europe/Paris'))::date as local_day
    from public.profiles p
    left join public.notification_prefs np on np.user_id = p.id
    where coalesce(np.streak_reminder, true)
      and extract(hour from now() at time zone coalesce(nullif(p.time_zone, ''), 'Europe/Paris')) = 20
      and exists (select 1 from public.push_subscriptions s where s.user_id = p.id)
      -- noté hier : la série est encore vivante, elle s'arrête si rien n'est noté aujourd'hui
      and exists (select 1 from public.wear_logs wl where wl.user_id = p.id
                  and wl.worn_on = (now() at time zone coalesce(nullif(p.time_zone, ''), 'Europe/Paris'))::date - 1)
  ),
  streaks as (
    select t.user_id, t.local_day, coalesce((private.wear_streak(t.user_id) ->> 'current')::int, 0) as streak
    from targets t
    where not exists (select 1 from public.wear_logs wl where wl.user_id = t.user_id and wl.worn_on = t.local_day)
  )
  insert into public.notifications (user_id, kind, data, dedupe_key)
  select s.user_id, 'streak', jsonb_build_object('streak', s.streak), 'streak:' || s.user_id || ':' || s.local_day
  from streaks s
  where s.streak >= 2
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function private.queue_streak_reminders() from public, anon, authenticated;

-- ---------- 3. Entonnoir d'activation (backoffice) ----------
-- Pour les inscrits d'une période : combien ont ajouté une montre, noté un Wrist Check,
-- et sont revenus (une action) au moins 7 jours après leur inscription.
create or replace function public.admin_funnel(p_days int default 30)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare r json;
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  with cohort as (
    select p.id, p.created_at from public.profiles p
    where p.created_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 365))
  ),
  steps as (
    select c.id, c.created_at,
      exists (select 1 from public.watches w where w.user_id = c.id) as has_watch,
      exists (select 1 from public.wear_logs l where l.user_id = c.id) as has_wear,
      exists (select 1 from public.photos ph where ph.user_id = c.id and ph.photo_type = 'wrist_shot') as has_wrist_photo,
      (c.created_at <= now() - interval '7 days') as old_enough,
      exists (select 1 from public.wear_logs l where l.user_id = c.id and l.created_at >= c.created_at + interval '7 days')
        or exists (select 1 from public.watches w where w.user_id = c.id and w.created_at >= c.created_at + interval '7 days')
        or exists (select 1 from public.photos ph where ph.user_id = c.id and ph.created_at >= c.created_at + interval '7 days') as returned
    from cohort c
  )
  select json_build_object(
    'days', p_days,
    'signups', count(*),
    'with_watch', count(*) filter (where has_watch),
    'with_wear', count(*) filter (where has_wear),
    'with_wrist_photo', count(*) filter (where has_wrist_photo),
    'eligible_d7', count(*) filter (where old_enough),
    'returned_d7', count(*) filter (where old_enough and returned)
  ) into r from steps;
  return r;
end;
$$;
revoke execute on function public.admin_funnel(int) from public, anon;
grant execute on function public.admin_funnel(int) to authenticated;

-- ---------- 4. Reconstruction quotidienne du site (pages au poignet à jour) ----------
create or replace function private.trigger_site_rebuild()
returns void language plpgsql security definer set search_path = '' as $$
declare hook text;
begin
  if to_regclass('vault.decrypted_secrets') is not null then
    execute 'select decrypted_secret from vault.decrypted_secrets where name = $1 limit 1' into hook using 'magazine_deploy_hook';
  end if;
  if hook is not null then
    execute 'select net.http_post(url := $1, body := $2, timeout_milliseconds := 10000)' using hook, '{}'::jsonb;
  end if;
exception when others then
  raise warning 'trigger_site_rebuild: %', sqlerrm;
end;
$$;
revoke execute on function private.trigger_site_rebuild() from public, anon, authenticated;

do $$
begin
  if to_regnamespace('cron') is null then
    raise notice 'pg_cron absent : rappel du soir et reconstruction quotidienne non planifiés.';
    return;
  end if;
  perform cron.unschedule(jobname) from cron.job where jobname in ('push-streak', 'site-rebuild-daily');
  perform cron.schedule('push-streak', '5 * * * *', 'select private.queue_streak_reminders()');
  perform cron.schedule('site-rebuild-daily', '15 3 * * *', 'select private.trigger_site_rebuild()');
end;
$$;
