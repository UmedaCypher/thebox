-- =====================================================================================
-- Parrainage et affiliation
--
-- Trois types, un seul lien …/?ref=code :
--  * member  (parrainage membre)  : tout membre avec un pseudo. Son code est son pseudo.
--                                   Le filleul reçoit 30 jours de Premium à l'inscription ;
--                                   le parrain reçoit 30 jours quand le filleul a ajouté 3 montres (12 fois par an au plus).
--  * creator (ambassadeur créateur): validé par l'administrateur. 30 % du prix hors taxes de la première année
--                                   de chaque abonnement annuel ; le filleul reçoit 90 jours de Premium.
--  * pro     (partenaire pro)      : validé par l'administrateur. Pas de commission, visibilité ;
--                                   le filleul reçoit 90 jours de Premium.
--
-- Commissions (créateurs) : payables 30 jours après le paiement, annulées en cas de remboursement ou de litige,
-- virées à la main chaque mois dès 50 €.
-- Pendant la bêta (app_settings.founders_open), chaque inscrit devient « membre fondateur ».
--
-- Écritures : les membres passent par des fonctions ; le webhook Stripe (service_role) crée les commissions ;
-- l'administrateur (profiles.account_type = 'admin') valide les affiliés et enregistre les virements.
-- Ré-exécutable sans risque.
-- =====================================================================================

create or replace function private.is_admin(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = p_user and p.account_type::text = 'admin');
$$;
revoke execute on function private.is_admin(uuid) from public, anon, authenticated;

/** Avantages de chaque type. Garder identique à src/lib/features.ts (AFFILIATE_TYPES). */
create or replace function private.affiliate_perks(p_kind text)
returns table (commission_rate numeric, welcome_days integer, reward_days integer)
language sql immutable set search_path = '' as $$
  select v.commission_rate, v.welcome_days, v.reward_days from (values
    ('member', 0::numeric, 30, 30),
    ('creator', 0.30::numeric, 90, 0),
    ('pro', 0::numeric, 90, 0)
  ) v(kind, commission_rate, welcome_days, reward_days)
  where v.kind = p_kind;
$$;
revoke execute on function private.affiliate_perks(text) from public, anon, authenticated;

-- ---------- Réglages de l'app (modifiables depuis le backoffice) ----------
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
insert into public.app_settings (key, value) values ('founders_open', 'true'::jsonb) on conflict (key) do nothing;

-- ---------- Affiliés (créateurs et pros) ----------
create table if not exists public.affiliates (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9][a-z0-9._-]{2,29}$'),
  kind text not null default 'creator' check (kind in ('creator', 'pro')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  website text check (char_length(website) <= 200),
  payout_holder text check (char_length(payout_holder) <= 120),
  payout_iban text check (payout_iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$'),
  terms_accepted_at timestamptz not null default now(),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Bases où une première version de cette migration a déjà été passée
alter table public.affiliates add column if not exists kind text not null default 'creator';
alter table public.affiliates add column if not exists website text;
alter table public.affiliates add column if not exists approved_at timestamptz;
alter table public.affiliates drop constraint if exists affiliates_status_check;
alter table public.affiliates add constraint affiliates_status_check check (status in ('pending', 'active', 'suspended'));
alter table public.affiliates drop constraint if exists affiliates_kind_check;
alter table public.affiliates add constraint affiliates_kind_check check (kind in ('creator', 'pro'));
alter table public.affiliates alter column status set default 'pending';

alter table public.affiliates enable row level security;
drop policy if exists "affiliates: lecture de sa fiche" on public.affiliates;
create policy "affiliates: lecture de sa fiche" on public.affiliates
  for select to authenticated using (user_id = (select auth.uid()));
-- Pas d'écriture directe : tout passe par les fonctions ci-dessous.

-- ---------- Inscriptions : provenance, parrain, fondateur ----------
create table if not exists public.member_signups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  source text check (char_length(source) <= 60),
  ref text check (char_length(ref) <= 30),
  referrer_id uuid references auth.users(id) on delete set null,
  referrer_kind text check (referrer_kind in ('member', 'creator', 'pro')),
  founder boolean not null default false,
  activated_at timestamptz,        -- 3e montre ajoutée
  created_at timestamptz not null default now()
);
create index if not exists member_signups_referrer_idx on public.member_signups (referrer_id);
create index if not exists member_signups_created_idx on public.member_signups (created_at);
alter table public.member_signups enable row level security;
drop policy if exists "member_signups: lecture de la sienne" on public.member_signups;
create policy "member_signups: lecture de la sienne" on public.member_signups
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------- Premium offert (parrainage, geste de l'administrateur) ----------
create table if not exists public.premium_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  days integer not null check (days between 1 and 3650),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  reason text not null check (reason in ('welcome', 'referral', 'admin')),
  source_user uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists premium_grants_user_idx on public.premium_grants (user_id, ends_at desc);
create unique index if not exists premium_grants_once_idx on public.premium_grants (user_id, reason, source_user) where source_user is not null;
alter table public.premium_grants enable row level security;
drop policy if exists "premium_grants: lecture des siens" on public.premium_grants;
create policy "premium_grants: lecture des siens" on public.premium_grants
  for select to authenticated using (user_id = (select auth.uid()));

/** Ajoute des jours de Premium à la suite de ceux déjà offerts. Renvoie false si déjà accordé pour cette source. */
create or replace function private.grant_premium(p_user uuid, p_days integer, p_reason text, p_source uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_start timestamptz;
begin
  if p_days is null or p_days <= 0 then return false; end if;
  select greatest(now(), coalesce(max(ends_at), now())) into v_start from public.premium_grants where user_id = p_user;
  insert into public.premium_grants (user_id, days, starts_at, ends_at, reason, source_user)
  values (p_user, p_days, v_start, v_start + make_interval(days => p_days), p_reason, p_source)
  on conflict do nothing;
  return found;
end;
$$;
revoke execute on function private.grant_premium(uuid, integer, text, uuid) from public, anon, authenticated;

-- Premium : abonnement, compte pro/admin, ou jours offerts en cours
create or replace function private.is_premium(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user and (p.plan = 'premium' or coalesce(p.account_type::text, 'free') <> 'free')
  ) or exists (
    select 1 from public.premium_grants g where g.user_id = p_user and g.starts_at <= now() and g.ends_at > now()
  );
$$;
revoke execute on function private.is_premium(uuid) from public, anon;
grant execute on function private.is_premium(uuid) to authenticated;

-- ---------- Événements produit (suivi de l'activation) ----------
create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  event text not null check (event in ('signup', 'first_watch', 'third_watch', 'passport_shared', 'month_shared', 'link_shared')),
  created_at timestamptz not null default now()
);
create index if not exists product_events_event_idx on public.product_events (event, created_at);
create unique index if not exists product_events_milestone_idx on public.product_events (user_id, event)
  where event in ('signup', 'first_watch', 'third_watch');
alter table public.product_events enable row level security;
-- Ni lecture ni écriture directe : track_event() et les déclencheurs.

create or replace function public.track_event(p_event text)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid());
begin
  if me is null or p_event not in ('passport_shared', 'month_shared', 'link_shared') then return; end if;
  -- Un même partage n'est compté qu'une fois par heure
  if exists (select 1 from public.product_events where user_id = me and event = p_event and created_at > now() - interval '1 hour') then return; end if;
  insert into public.product_events (user_id, event) values (me, p_event);
end;
$$;
revoke execute on function public.track_event(text) from public, anon;
grant execute on function public.track_event(text) to authenticated;

-- ---------- Inscription : appelée une fois par l'app, juste après la création du compte ----------
create or replace function public.record_signup(p_ref text, p_source text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  v_ref text := lower(btrim(coalesce(p_ref, '')));
  v_created timestamptz;
  v_referrer uuid; v_kind text; v_founder boolean; v_welcome integer := 0;
  v_row public.member_signups;
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_row from public.member_signups where user_id = me;
  if found then return jsonb_build_object('founder', v_row.founder, 'referrer_kind', v_row.referrer_kind, 'welcome_days', 0); end if;

  -- Seuls les comptes récents sont rattachés (le lien ne sert pas à un membre déjà inscrit)
  select created_at into v_created from auth.users where id = me;
  v_founder := coalesce((select (value)::boolean from public.app_settings where key = 'founders_open'), false);

  if v_ref <> '' and v_created > now() - interval '14 days' then
    select a.user_id, a.kind into v_referrer, v_kind from public.affiliates a where a.code = v_ref and a.status = 'active';
    if v_referrer is null then
      select p.id, 'member' into v_referrer, v_kind from public.profiles p where lower(p.username) = v_ref;
    end if;
    if v_referrer = me then v_referrer := null; v_kind := null; end if;
  end if;

  insert into public.member_signups (user_id, source, ref, referrer_id, referrer_kind, founder, created_at)
  values (me, left(nullif(btrim(p_source), ''), 60), case when v_referrer is not null then v_ref end, v_referrer, v_kind, v_founder,
          coalesce(v_created, now()))
  on conflict (user_id) do nothing;
  insert into public.product_events (user_id, event, created_at) values (me, 'signup', coalesce(v_created, now())) on conflict do nothing;

  if v_referrer is not null then
    select welcome_days into v_welcome from private.affiliate_perks(v_kind);
    perform private.grant_premium(me, v_welcome, 'welcome', v_referrer);
  end if;
  return jsonb_build_object('founder', v_founder, 'referrer_kind', v_kind, 'welcome_days', coalesce(v_welcome, 0));
end;
$$;
revoke execute on function public.record_signup(text, text) from public, anon;
grant execute on function public.record_signup(text, text) to authenticated;

-- ---------- Montres ajoutées : 1re, 3e (activation) et récompense du parrain ----------
create or replace function private.on_watch_added()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_count integer; v_signup public.member_signups; v_reward integer;
begin
  select count(*) into v_count from public.watches where user_id = new.user_id;
  if v_count >= 1 then
    insert into public.product_events (user_id, event) values (new.user_id, 'first_watch') on conflict do nothing;
  end if;
  if v_count >= 3 then
    insert into public.product_events (user_id, event) values (new.user_id, 'third_watch') on conflict do nothing;
    update public.member_signups set activated_at = now() where user_id = new.user_id and activated_at is null
      returning * into v_signup;
    -- Parrainage membre : 30 jours au parrain, 12 fois par an au plus
    if v_signup.referrer_kind = 'member' and v_signup.referrer_id is not null
       and (select count(*) from public.premium_grants g where g.user_id = v_signup.referrer_id and g.reason = 'referral'
            and g.created_at > now() - interval '365 days') < 12 then
      select reward_days into v_reward from private.affiliate_perks('member');
      perform private.grant_premium(v_signup.referrer_id, v_reward, 'referral', new.user_id);
    end if;
  end if;
  return null;
end;
$$;
drop trigger if exists watches_track_activation on public.watches;
create trigger watches_track_activation after insert on public.watches
  for each row execute function private.on_watch_added();

-- ---------- Abonnements parrainés par un créateur (rempli par le webhook) ----------
create table if not exists public.affiliate_referrals (
  referred_user_id uuid primary key references auth.users(id) on delete cascade,
  affiliate_id uuid not null references public.affiliates(user_id) on delete cascade,
  stripe_subscription_id text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists affiliate_referrals_affiliate_idx on public.affiliate_referrals (affiliate_id);
alter table public.affiliate_referrals enable row level security;
-- Aucune lecture directe : l'affilié voit des totaux, jamais l'identité des personnes parrainées.

-- ---------- Versements ----------
create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(user_id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  reference text check (char_length(reference) <= 140),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index if not exists affiliate_payouts_affiliate_idx on public.affiliate_payouts (affiliate_id);
alter table public.affiliate_payouts enable row level security;
drop policy if exists "affiliate_payouts: lecture des siens" on public.affiliate_payouts;
create policy "affiliate_payouts: lecture des siens" on public.affiliate_payouts
  for select to authenticated using (affiliate_id = (select auth.uid()));

-- ---------- Commissions ----------
create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(user_id) on delete cascade,
  referred_user_id uuid references auth.users(id) on delete set null,
  stripe_invoice_id text not null unique,
  stripe_charge_id text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'eur',
  -- pending : en attente (ou payable si available_at est passée) · paid : versée · cancelled : annulée
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  available_at timestamptz not null,
  paid_at timestamptz,
  payout_id uuid references public.affiliate_payouts(id) on delete set null,
  cancel_reason text,
  created_at timestamptz not null default now()
);
create index if not exists affiliate_commissions_affiliate_idx on public.affiliate_commissions (affiliate_id, status);
create index if not exists affiliate_commissions_charge_idx on public.affiliate_commissions (stripe_charge_id);
create index if not exists affiliate_commissions_payout_idx on public.affiliate_commissions (payout_id);
alter table public.affiliate_commissions enable row level security;
-- Lecture via get_my_affiliate() uniquement (sans l'identité des personnes parrainées).

-- ---------- Demander à devenir ambassadeur ou partenaire pro ----------
drop function if exists public.join_affiliate_program(text);
create or replace function public.join_affiliate_program(p_code text, p_kind text default 'creator', p_website text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); v_code text := lower(btrim(coalesce(p_code, '')));
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.profiles where id = me and username is not null) then raise exception 'USERNAME_REQUIRED'; end if;
  if p_kind not in ('creator', 'pro') then raise exception 'INVALID_KIND'; end if;
  if v_code !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then raise exception 'INVALID_CODE'; end if;
  if exists (select 1 from public.affiliates where user_id = me) then
    return (select code from public.affiliates where user_id = me);
  end if;
  -- Un code ne doit pas être le pseudo d'un autre membre (les pseudos servent au parrainage membre)
  if exists (select 1 from public.affiliates where code = v_code)
     or exists (select 1 from public.profiles where lower(username) = v_code and id <> me) then
    raise exception 'CODE_TAKEN';
  end if;
  insert into public.affiliates (user_id, code, kind, website)
  values (me, v_code, p_kind, left(nullif(btrim(coalesce(p_website, '')), ''), 200));
  return v_code;
end;
$$;
revoke execute on function public.join_affiliate_program(text, text, text) from public, anon;
grant execute on function public.join_affiliate_program(text, text, text) to authenticated;

-- ---------- Coordonnées de virement (IBAN null : on garde celui déjà enregistré) ----------
create or replace function public.update_affiliate_payout(p_holder text, p_iban text)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); v_iban text := upper(regexp_replace(coalesce(p_iban, ''), '\s', '', 'g'));
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.affiliates where user_id = me) then raise exception 'NOT_AFFILIATE'; end if;
  if v_iban <> '' and v_iban !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$' then raise exception 'INVALID_IBAN'; end if;
  update public.affiliates
     set payout_holder = nullif(btrim(coalesce(p_holder, '')), ''),
         payout_iban = case when p_iban is null then payout_iban else nullif(v_iban, '') end,
         updated_at = now()
   where user_id = me;
end;
$$;
revoke execute on function public.update_affiliate_payout(text, text) from public, anon;
grant execute on function public.update_affiliate_payout(text, text) to authenticated;

-- ---------- Parrainage membre : chiffres du membre connecté ----------
create or replace function public.get_my_referrals()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'invited', (select count(*) from public.member_signups s where s.referrer_id = me.uid),
    'active', (select count(*) from public.member_signups s where s.referrer_id = me.uid and s.activated_at is not null),
    'days_earned', (select coalesce(sum(days), 0) from public.premium_grants g where g.user_id = me.uid and g.reason = 'referral'),
    'rewards_left', greatest(0, 12 - (select count(*) from public.premium_grants g where g.user_id = me.uid and g.reason = 'referral'
                                       and g.created_at > now() - interval '365 days')),
    'premium_until', (select max(ends_at) from public.premium_grants g where g.user_id = me.uid and g.ends_at > now()),
    'founder', coalesce((select founder from public.member_signups s where s.user_id = me.uid), false)
  )
  from (select (select auth.uid()) as uid) me;
$$;
revoke execute on function public.get_my_referrals() from public, anon;
grant execute on function public.get_my_referrals() to authenticated;

-- ---------- Espace ambassadeur / partenaire ----------
create or replace function public.get_my_affiliate()
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when a.user_id is null then null else jsonb_build_object(
    'code', a.code,
    'kind', a.kind,
    'status', a.status,
    'website', a.website,
    'payout_holder', a.payout_holder,
    -- l'IBAN n'est jamais renvoyé en entier : seulement ses 4 derniers caractères
    'payout_iban_last4', right(a.payout_iban, 4),
    'created_at', a.created_at,
    'signups', (select count(*) from public.member_signups s where s.referrer_id = a.user_id),
    'referrals', (select count(*) from public.affiliate_referrals r where r.affiliate_id = a.user_id),
    'pending_cents', (select coalesce(sum(amount_cents), 0) from public.affiliate_commissions c
                       where c.affiliate_id = a.user_id and c.status = 'pending' and c.available_at > now()),
    'due_cents', (select coalesce(sum(amount_cents), 0) from public.affiliate_commissions c
                   where c.affiliate_id = a.user_id and c.status = 'pending' and c.available_at <= now()),
    'paid_cents', (select coalesce(sum(amount_cents), 0) from public.affiliate_commissions c
                    where c.affiliate_id = a.user_id and c.status = 'paid'),
    'commissions', coalesce((select jsonb_agg(jsonb_build_object(
        'created_at', c.created_at, 'amount_cents', c.amount_cents, 'available_at', c.available_at, 'paid_at', c.paid_at,
        'status', case when c.status = 'pending' and c.available_at <= now() then 'due' else c.status end
      ) order by c.created_at desc)
      from (select * from public.affiliate_commissions c2 where c2.affiliate_id = a.user_id order by c2.created_at desc limit 50) c), '[]'::jsonb)
  ) end
  from (select (select auth.uid()) as uid) me
  left join public.affiliates a on a.user_id = me.uid;
$$;
revoke execute on function public.get_my_affiliate() from public, anon;
grant execute on function public.get_my_affiliate() to authenticated;

-- ---------- Administration des virements ----------
create or replace function public.get_affiliate_payouts_due(p_min_cents integer default 5000)
returns table (affiliate_id uuid, code text, username text, payout_holder text, payout_iban text, due_cents bigint, commissions bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  return query
    select a.user_id, a.code, p.username, a.payout_holder, a.payout_iban, sum(c.amount_cents)::bigint, count(*)::bigint
    from public.affiliate_commissions c
    join public.affiliates a on a.user_id = c.affiliate_id
    left join public.profiles p on p.id = a.user_id
    where c.status = 'pending' and c.available_at <= now() and a.status = 'active'
    group by a.user_id, a.code, p.username, a.payout_holder, a.payout_iban
    having sum(c.amount_cents) >= greatest(0, p_min_cents)
    order by sum(c.amount_cents) desc;
end;
$$;
revoke execute on function public.get_affiliate_payouts_due(integer) from public, anon;
grant execute on function public.get_affiliate_payouts_due(integer) to authenticated;

-- Après avoir fait le virement : marque comme versées toutes les commissions payables de cet affilié.
create or replace function public.record_affiliate_payout(p_affiliate uuid, p_reference text)
returns integer language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); v_total integer; v_payout uuid;
begin
  if not private.is_admin(me) then raise exception 'FORBIDDEN'; end if;
  select coalesce(sum(amount_cents), 0) into v_total from public.affiliate_commissions
   where affiliate_id = p_affiliate and status = 'pending' and available_at <= now();
  if v_total <= 0 then raise exception 'NOTHING_DUE'; end if;
  insert into public.affiliate_payouts (affiliate_id, amount_cents, reference, created_by)
  values (p_affiliate, v_total, left(p_reference, 140), me) returning id into v_payout;
  update public.affiliate_commissions set status = 'paid', paid_at = now(), payout_id = v_payout
   where affiliate_id = p_affiliate and status = 'pending' and available_at <= now();
  return v_total;
end;
$$;
revoke execute on function public.record_affiliate_payout(uuid, text) from public, anon;
grant execute on function public.record_affiliate_payout(uuid, text) to authenticated;
