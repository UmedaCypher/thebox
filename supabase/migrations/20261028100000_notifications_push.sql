-- =====================================================================================
-- Notifications push
--
--  * push_subscriptions : un appareil abonné (navigateur aujourd'hui ; appli Android / iOS demain).
--  * notification_prefs : ce que chaque membre veut recevoir, et à quelle heure.
--  * notifications      : la file d'envoi. Les déclencheurs et les tâches planifiées y ajoutent
--                         des lignes ; la fonction Edge « send-push » les envoie puis les marque.
--
-- Cinq notifications :
--  1. message      : un nouveau message (immédiat).
--  2. daily        : rappel du jour, « quelle montre aujourd'hui ? » (sur demande, à l'heure choisie,
--                    seulement si rien n'est noté).
--  3. maintenance  : entretien à prévoir, 7 jours avant et le jour même (Premium).
--  4. recap        : bilan du mois écoulé, le 1er du mois.
--  5. wishlist     : une montre de la wishlist vient d'être mise en vente sur le Marché (Premium).
--
-- Prérequis côté Supabase (voir docs/notifications.md) :
--  * extensions pg_net et pg_cron ;
--  * deux secrets dans le coffre (Vault) : push_function_url et push_secret.
-- Sans eux, la migration passe quand même : les notifications s'accumulent simplement dans la file.
-- =====================================================================================

-- ---------- Extensions (si disponibles) ----------
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
  end if;
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
  end if;
end $$;

-- ---------- Appareils abonnés ----------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'web' check (kind in ('web', 'fcm', 'apns')),
  -- web : point de terminaison du service push du navigateur ; fcm / apns : jeton de l'appareil
  endpoint text not null unique check (char_length(endpoint) <= 1000),
  p256dh text check (char_length(p256dh) <= 200),
  auth text check (char_length(auth) <= 100),
  user_agent text check (char_length(user_agent) <= 300),
  -- langue de l'app sur cet appareil, pour rédiger la notification
  lang text not null default 'fr' check (lang in ('fr', 'en')),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "push_subscriptions: lecture des siens" on public.push_subscriptions;
create policy "push_subscriptions: lecture des siens" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "push_subscriptions: ajout des siens" on public.push_subscriptions;
create policy "push_subscriptions: ajout des siens" on public.push_subscriptions
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "push_subscriptions: mise à jour des siens" on public.push_subscriptions;
create policy "push_subscriptions: mise à jour des siens" on public.push_subscriptions
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "push_subscriptions: suppression des siens" on public.push_subscriptions;
create policy "push_subscriptions: suppression des siens" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

-- Un appareil peut changer de compte (déconnexion, autre membre) : on rattache le point de terminaison
-- au membre connecté, quel que soit son ancien propriétaire.
drop function if exists public.register_push_subscription(text, text, text, text, text);
create or replace function public.register_push_subscription(
  p_kind text, p_endpoint text, p_p256dh text, p_auth text, p_user_agent text, p_lang text default 'fr'
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare me uuid := (select auth.uid());
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_kind not in ('web', 'fcm', 'apns') or coalesce(char_length(p_endpoint), 0) < 10 then raise exception 'INVALID'; end if;
  insert into public.push_subscriptions (user_id, kind, endpoint, p256dh, auth, user_agent, lang)
  values (me, p_kind, p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300), case when p_lang = 'en' then 'en' else 'fr' end)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, kind = excluded.kind, p256dh = excluded.p256dh,
        auth = excluded.auth, user_agent = excluded.user_agent, lang = excluded.lang, created_at = now();
  insert into public.notification_prefs (user_id) values (me) on conflict do nothing;
end;
$$;
revoke execute on function public.register_push_subscription(text, text, text, text, text, text) from public, anon;
grant execute on function public.register_push_subscription(text, text, text, text, text, text) to authenticated;

-- ---------- Préférences ----------
create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  messages boolean not null default true,
  daily_reminder boolean not null default false,
  reminder_hour smallint not null default 9 check (reminder_hour between 5 and 22),
  maintenance boolean not null default true,
  monthly_recap boolean not null default true,
  wishlist boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
drop policy if exists "notification_prefs: les siennes" on public.notification_prefs;
create policy "notification_prefs: les siennes" on public.notification_prefs
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Préférence effective : sans ligne, les valeurs par défaut s'appliquent.
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
              when 'maintenance' then np.maintenance
              when 'recap' then np.monthly_recap
              when 'wishlist' then np.wishlist
              else true end
       from public.notification_prefs np where np.user_id = p_user),
    p_kind <> 'daily')
  and exists (select 1 from public.push_subscriptions s where s.user_id = p_user);
$$;
revoke execute on function private.wants(uuid, text) from public, anon, authenticated;

-- ---------- File d'envoi ----------
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('message', 'daily', 'maintenance', 'recap', 'wishlist')),
  data jsonb not null default '{}'::jsonb,
  -- évite d'envoyer deux fois la même chose (même rappel, même bilan, même annonce)
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  attempts smallint not null default 0,
  error text
);
create index if not exists notifications_pending_idx on public.notifications (created_at) where sent_at is null;
create index if not exists notifications_user_idx on public.notifications (user_id);
alter table public.notifications enable row level security;
drop policy if exists "notifications: lecture des siennes" on public.notifications;
create policy "notifications: lecture des siennes" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
-- Aucune écriture depuis l'app : seuls les déclencheurs (security definer) et la fonction d'envoi écrivent.

create or replace function private.enqueue(p_user uuid, p_kind text, p_data jsonb, p_dedupe text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.wants(p_user, p_kind) then return; end if;
  insert into public.notifications (user_id, kind, data, dedupe_key)
  values (p_user, p_kind, coalesce(p_data, '{}'::jsonb), p_dedupe)
  on conflict (dedupe_key) do nothing;
end;
$$;
revoke execute on function private.enqueue(uuid, text, jsonb, text) from public, anon, authenticated;

-- La fonction d'envoi réserve un lot de notifications ; SKIP LOCKED évite qu'un même envoi parte deux fois
-- si deux appels se croisent. Une réservation de plus de 5 minutes sans envoi est reprise.
create or replace function public.claim_notifications(p_limit int default 200)
returns setof public.notifications
language sql
security definer
set search_path = ''
as $$
  update public.notifications n set claimed_at = now(), attempts = n.attempts + 1
  where n.id in (
    select id from public.notifications
    where sent_at is null and attempts < 3
      and (claimed_at is null or claimed_at < now() - interval '5 minutes')
      and created_at > now() - interval '2 days'
    order by created_at
    limit greatest(1, least(p_limit, 500))
    for update skip locked
  )
  returning n.*;
$$;
revoke execute on function public.claim_notifications(int) from public, anon, authenticated;
grant execute on function public.claim_notifications(int) to service_role;

-- ---------- Appel de la fonction d'envoi ----------
-- Dès qu'une notification entre dans la file, on réveille « send-push » (appel asynchrone via pg_net).
-- L'adresse et le secret viennent du coffre ; s'ils manquent, on ne fait rien (la tâche de rattrapage enverra).
create or replace function private.wake_push_sender()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_url text; v_secret text;
begin
  if to_regnamespace('net') is null or to_regclass('vault.decrypted_secrets') is null then return; end if;
  execute $q$select (select decrypted_secret from vault.decrypted_secrets where name = 'push_function_url'),
                    (select decrypted_secret from vault.decrypted_secrets where name = 'push_secret')$q$
    into v_url, v_secret;
  if v_url is null or v_secret is null then return; end if;
  execute 'select net.http_post(url := $1, headers := $2, body := $3, timeout_milliseconds := 10000)'
    using v_url, jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret), '{}'::jsonb;
exception when others then
  -- Une panne de l'envoi ne doit jamais bloquer l'action du membre (envoyer un message, mettre en vente…).
  raise warning 'wake_push_sender: %', sqlerrm;
end;
$$;
revoke execute on function private.wake_push_sender() from public, anon, authenticated;

create or replace function private.on_notifications_inserted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.wake_push_sender();
  return null;
end;
$$;
drop trigger if exists notifications_wake on public.notifications;
create trigger notifications_wake after insert on public.notifications
  for each statement execute function private.on_notifications_inserted();

-- ---------- 1. Nouveau message ----------
create or replace function private.on_message_inserted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare r record; v_sender text;
begin
  select username into v_sender from public.profiles where id = new.sender_id;
  for r in
    select cp.user_id from public.conversation_participants cp
    where cp.conversation_id = new.conversation_id and cp.user_id <> new.sender_id
  loop
    perform private.enqueue(r.user_id, 'message', jsonb_build_object(
      'conversation_id', new.conversation_id,
      'sender', coalesce(v_sender, ''),
      'excerpt', left(regexp_replace(new.content, '\s+', ' ', 'g'), 120)
    ), 'message:' || new.id);
  end loop;
  return null;
exception when others then
  raise warning 'on_message_inserted: %', sqlerrm;
  return null;
end;
$$;
drop trigger if exists messages_notify on public.messages;
create trigger messages_notify after insert on public.messages
  for each row execute function private.on_message_inserted();

-- ---------- 5. Wishlist : une montre recherchée arrive sur le Marché ----------
-- Correspondance volontairement simple : même marque, et le modèle de la wishlist contenu dans celui de
-- l'annonce (ou l'inverse), sans tenir compte des majuscules. Une seule notification par membre et par annonce.
create or replace function private.on_watch_listed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare r record;
begin
  if new.current_status::text not in ('for_sale', 'for_exchange') then return null; end if;
  if tg_op = 'UPDATE' and old.current_status::text in ('for_sale', 'for_exchange') then return null; end if;
  for r in
    select distinct wi.user_id from public.wishlist_items wi
    where wi.acquired_at is null
      and wi.user_id <> new.user_id
      and lower(btrim(wi.brand)) = lower(btrim(new.brand))
      and (lower(new.model) like '%' || lower(btrim(wi.model)) || '%' or lower(wi.model) like '%' || lower(btrim(new.model)) || '%')
      and private.is_premium(wi.user_id)
  loop
    perform private.enqueue(r.user_id, 'wishlist', jsonb_build_object(
      'watch_id', new.id, 'brand', new.brand, 'model', new.model,
      'price', new.sale_price, 'exchange', new.current_status::text = 'for_exchange'
    ), 'wishlist:' || r.user_id || ':' || new.id);
  end loop;
  return null;
exception when others then
  raise warning 'on_watch_listed: %', sqlerrm;
  return null;
end;
$$;
drop trigger if exists watches_wishlist_notify on public.watches;
create trigger watches_wishlist_notify after insert or update of current_status on public.watches
  for each row execute function private.on_watch_listed();

-- ---------- 2. Rappel du jour (appelé toutes les heures) ----------
create or replace function private.queue_daily_reminders()
returns int
language plpgsql
security definer
set search_path = ''
as $$
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
  select t.user_id, 'daily', '{}'::jsonb, 'daily:' || t.user_id || ':' || t.local_day
  from targets t
  where not exists (select 1 from public.wear_logs wl where wl.user_id = t.user_id and wl.worn_on = t.local_day)
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------- 3. Entretien à prévoir (appelé chaque matin) ----------
create or replace function private.queue_maintenance_reminders()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare n int;
begin
  with latest as (
    -- la dernière intervention de chaque montre porte la prochaine échéance
    select distinct on (m.watch_id) m.id, m.user_id, m.watch_id, m.next_due_on
    from public.maintenance_entries m
    order by m.watch_id, m.performed_on desc, m.created_at desc
  )
  insert into public.notifications (user_id, kind, data, dedupe_key)
  select l.user_id, 'maintenance',
         jsonb_build_object('watch_id', l.watch_id, 'brand', w.brand, 'model', w.model,
                            'due_on', l.next_due_on, 'today', l.next_due_on = current_date),
         'maintenance:' || l.id || ':' || l.next_due_on || ':' || (l.next_due_on = current_date)
  from latest l
  join public.watches w on w.id = l.watch_id
  where l.next_due_on in (current_date, current_date + 7)
    and private.is_premium(l.user_id)
    and private.wants(l.user_id, 'maintenance')
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------- 4. Bilan du mois (appelé le 1er) ----------
create or replace function private.queue_monthly_recaps()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare n int; v_start date := (date_trunc('month', current_date) - interval '1 month')::date;
begin
  insert into public.notifications (user_id, kind, data, dedupe_key)
  select wl.user_id, 'recap',
         jsonb_build_object('month', to_char(v_start, 'YYYY-MM'),
                            'days', count(distinct wl.worn_on), 'watches', count(distinct wl.watch_id)),
         'recap:' || wl.user_id || ':' || to_char(v_start, 'YYYY-MM')
  from public.wear_logs wl
  where wl.worn_on >= v_start and wl.worn_on < (v_start + interval '1 month')::date
    and private.wants(wl.user_id, 'recap')
  group by wl.user_id
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function private.queue_daily_reminders() from public, anon, authenticated;
revoke execute on function private.queue_maintenance_reminders() from public, anon, authenticated;
revoke execute on function private.queue_monthly_recaps() from public, anon, authenticated;

-- ---------- Tâches planifiées (pg_cron, heures UTC) ----------
do $$
begin
  if to_regnamespace('cron') is null then
    raise notice 'pg_cron absent : activez-le puis relancez ce bloc pour planifier les rappels.';
    return;
  end if;
  perform cron.unschedule(jobname) from cron.job
   where jobname in ('push-daily', 'push-maintenance', 'push-recap', 'push-retry');
  perform cron.schedule('push-daily', '0 * * * *', 'select private.queue_daily_reminders()');
  perform cron.schedule('push-maintenance', '0 8 * * *', 'select private.queue_maintenance_reminders()');
  perform cron.schedule('push-recap', '0 8 1 * *', 'select private.queue_monthly_recaps()');
  -- rattrapage : renvoie ce qui n'est pas parti (fonction indisponible, appareil hors ligne…)
  perform cron.schedule('push-retry', '*/10 * * * *',
    $j$select private.wake_push_sender() where exists (select 1 from public.notifications where sent_at is null and attempts < 3 and created_at > now() - interval '2 days')$j$);
end $$;

-- Ménage : on garde 60 jours d'historique.
create or replace function private.purge_notifications()
returns void language sql security definer set search_path = '' as $$
  delete from public.notifications where created_at < now() - interval '60 days';
$$;
revoke execute on function private.purge_notifications() from public, anon, authenticated;
do $$
begin
  if to_regnamespace('cron') is not null then
    perform cron.unschedule(jobname) from cron.job where jobname = 'push-purge';
    perform cron.schedule('push-purge', '30 3 * * *', 'select private.purge_notifications()');
  end if;
end $$;
