-- =====================================================================================
-- Backoffice : suivi des membres, de l'activité, de l'argent et des affiliés
--
--  * stripe_payments : chaque facture payée, remplie par le webhook Stripe (montants TTC, HT, frais Stripe, remboursements)
--  * admin_expenses  : dépenses saisies à la main dans le backoffice (publicité, outils, matériel…)
--  * fonctions admin_* : lectures et réglages réservés à l'administrateur (profiles.account_type = 'admin')
-- À passer après 20261029100000_affiliation.sql. Ré-exécutable sans risque.
-- =====================================================================================

-- ---------- Paiements Stripe ----------
create table if not exists public.stripe_payments (
  invoice_id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  subscription_id text,
  charge_id text,
  billing_interval text check (billing_interval in ('month', 'year')),
  first_payment boolean not null default false,
  amount_paid_cents integer not null default 0,        -- TTC encaissé
  amount_excl_tax_cents integer not null default 0,    -- HT
  fee_cents integer not null default 0,                -- frais Stripe
  refunded_cents integer not null default 0,
  disputed boolean not null default false,
  currency text not null default 'eur',
  paid_at timestamptz not null default now()
);
create index if not exists stripe_payments_paid_idx on public.stripe_payments (paid_at);
create index if not exists stripe_payments_charge_idx on public.stripe_payments (charge_id);
create index if not exists stripe_payments_sub_idx on public.stripe_payments (subscription_id, paid_at desc);
alter table public.stripe_payments enable row level security;
-- Aucune lecture directe : admin_dashboard() seulement.

-- ---------- Dépenses saisies à la main ----------
create table if not exists public.admin_expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null default current_date,
  category text not null check (category in ('ads', 'tools', 'hosting', 'design', 'legal', 'other')),
  label text not null check (char_length(label) between 1 and 140),
  amount_cents integer not null check (amount_cents > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists admin_expenses_spent_idx on public.admin_expenses (spent_on);
alter table public.admin_expenses enable row level security;

-- ---------- Tableau de bord ----------
create or replace function public.admin_dashboard()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb;
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;

  with
  weeks as (
    select generate_series(date_trunc('week', now()) - interval '25 weeks', date_trunc('week', now()), interval '1 week') as w
  ),
  months as (
    select generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') as m
  ),
  active_subs as (
    select s.user_id, s.stripe_subscription_id from public.subscriptions s where s.status in ('active', 'trialing', 'past_due')
  ),
  last_pay as (
    select distinct on (p.subscription_id) p.subscription_id, p.billing_interval, p.amount_excl_tax_cents
    from public.stripe_payments p order by p.subscription_id, p.paid_at desc
  ),
  cohort as (  -- inscrits d'il y a 7 à 37 jours : assez de recul pour mesurer l'activation
    select p.id, p.created_at from public.profiles p
    where p.created_at between now() - interval '37 days' and now() - interval '7 days'
  ),
  cohort30 as (  -- inscrits d'il y a 30 à 60 jours : pour la rétention
    select p.id, p.created_at from public.profiles p
    where p.created_at between now() - interval '60 days' and now() - interval '30 days'
  )
  select jsonb_build_object(
    'generated_at', now(),
    'founders_open', coalesce((select (value)::boolean from public.app_settings where key = 'founders_open'), false),
    'totals', jsonb_build_object(
      'members', (select count(*) from public.profiles),
      'members_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
      'members_30d', (select count(*) from public.profiles where created_at > now() - interval '30 days'),
      'founders', (select count(*) from public.member_signups where founder),
      'premium_paying', (select count(*) from active_subs),
      'premium_offered', (select count(distinct g.user_id) from public.premium_grants g
                           where g.starts_at <= now() and g.ends_at > now()
                             and not exists (select 1 from active_subs a where a.user_id = g.user_id)),
      'mrr_cents', (select coalesce(sum(case when l.billing_interval = 'year' then l.amount_excl_tax_cents / 12.0 else l.amount_excl_tax_cents end), 0)::integer
                    from active_subs a join last_pay l on l.subscription_id = a.stripe_subscription_id),
      'watches', (select count(*) from public.watches),
      'watches_value_eur', (select coalesce(sum(current_estimated_value), 0)::bigint from public.watches),
      'collectors_3plus', (select count(*) from (select user_id from public.watches group by user_id having count(*) >= 3) x),
      'listings', (select count(*) from public.watches where current_status in ('for_sale', 'for_exchange')),
      'wears_30d', (select count(*) from public.wear_logs where created_at > now() - interval '30 days'),
      'wearers_30d', (select count(distinct user_id) from public.wear_logs where created_at > now() - interval '30 days'),
      'messages_30d', (select count(*) from public.messages where created_at > now() - interval '30 days')
    ),
    'rates', jsonb_build_object(
      'activation', (select case when count(*) = 0 then null else round(100.0 * count(*) filter (where exists (
                        select 1 from public.product_events e where e.user_id = c.id and e.event = 'third_watch'
                        and e.created_at <= c.created_at + interval '7 days')) / count(*), 1) end from cohort c),
      'activation_base', (select count(*) from cohort),
      'sharing', (select case when count(*) = 0 then null else round(100.0 * count(*) filter (where exists (
                     select 1 from public.product_events e where e.user_id = p.id and e.event in ('passport_shared', 'month_shared', 'link_shared')))
                     / count(*), 1) end from public.profiles p),
      'retention', (select case when count(*) = 0 then null else round(100.0 * count(*) filter (where
                       exists (select 1 from public.wear_logs w where w.user_id = c.id and w.created_at >= c.created_at + interval '30 days')
                       or exists (select 1 from public.watches w where w.user_id = c.id and w.created_at >= c.created_at + interval '30 days'))
                       / count(*), 1) end from cohort30 c),
      'retention_base', (select count(*) from cohort30),
      'conversion', (select case when count(*) = 0 then null else round(100.0 * (select count(*) from active_subs) / count(*), 1) end from public.profiles)
    ),
    'weekly', (select jsonb_agg(jsonb_build_object(
        'week', to_char(w, 'YYYY-MM-DD'),
        'signups', (select count(*) from public.profiles p where p.created_at >= w and p.created_at < w + interval '1 week'),
        'members', (select count(*) from public.profiles p where p.created_at < w + interval '1 week'),
        'activated', (select count(*) from public.product_events e where e.event = 'third_watch' and e.created_at >= w and e.created_at < w + interval '1 week'),
        'watches', (select count(*) from public.watches x where x.created_at >= w and x.created_at < w + interval '1 week'),
        'premium_starts', (select count(*) from public.stripe_payments s where s.first_payment and s.paid_at >= w and s.paid_at < w + interval '1 week')
      ) order by w) from weeks),
    'monthly', (select jsonb_agg(jsonb_build_object(
        'month', to_char(m, 'YYYY-MM'),
        'revenue_cents', (select coalesce(sum(amount_paid_cents), 0) from public.stripe_payments s where s.paid_at >= m and s.paid_at < m + interval '1 month'),
        'revenue_excl_tax_cents', (select coalesce(sum(amount_excl_tax_cents), 0) from public.stripe_payments s where s.paid_at >= m and s.paid_at < m + interval '1 month'),
        'refunds_cents', (select coalesce(sum(refunded_cents), 0) from public.stripe_payments s where s.paid_at >= m and s.paid_at < m + interval '1 month'),
        'stripe_fees_cents', (select coalesce(sum(fee_cents), 0) from public.stripe_payments s where s.paid_at >= m and s.paid_at < m + interval '1 month'),
        'commissions_cents', (select coalesce(sum(amount_cents), 0) from public.affiliate_commissions c where c.status <> 'cancelled' and c.created_at >= m and c.created_at < m + interval '1 month'),
        'payouts_cents', (select coalesce(sum(amount_cents), 0) from public.affiliate_payouts p where p.created_at >= m and p.created_at < m + interval '1 month'),
        'expenses_cents', (select coalesce(sum(amount_cents), 0) from public.admin_expenses e where e.spent_on >= m::date and e.spent_on < (m + interval '1 month')::date)
      ) order by m) from months),
    'sources', coalesce((select jsonb_agg(x order by x.n desc) from (
        select coalesce(s.source, case s.referrer_kind when 'member' then 'parrainage' when 'creator' then 'ambassadeur' when 'pro' then 'pro' end, 'direct') as label,
               count(*) as n,
               count(*) filter (where s.activated_at is not null) as activated
        from public.member_signups s where s.created_at > now() - interval '90 days'
        group by 1) x), '[]'::jsonb),
    'brands', coalesce((select jsonb_agg(x order by x.n desc) from (
        select brand, count(*) as n from public.watches group by brand order by count(*) desc limit 8) x), '[]'::jsonb),
    'expenses', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'spent_on', e.spent_on, 'category', e.category, 'label', e.label, 'amount_cents', e.amount_cents)
        order by e.spent_on desc, e.created_at desc) from (select * from public.admin_expenses order by spent_on desc, created_at desc limit 60) e), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;
revoke execute on function public.admin_dashboard() from public, anon;
grant execute on function public.admin_dashboard() to authenticated;

-- ---------- Affiliés et meilleurs parrains ----------
create or replace function public.admin_affiliates()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'affiliates', coalesce((select jsonb_agg(jsonb_build_object(
        'user_id', a.user_id, 'code', a.code, 'kind', a.kind, 'status', a.status, 'website', a.website,
        'username', p.username, 'created_at', a.created_at, 'has_iban', a.payout_iban is not null,
        'signups', (select count(*) from public.member_signups s where s.referrer_id = a.user_id),
        'activated', (select count(*) from public.member_signups s where s.referrer_id = a.user_id and s.activated_at is not null),
        'subscriptions', (select count(*) from public.affiliate_referrals r where r.affiliate_id = a.user_id),
        'pending_cents', (select coalesce(sum(amount_cents), 0) from public.affiliate_commissions c where c.affiliate_id = a.user_id and c.status = 'pending' and c.available_at > now()),
        'due_cents', (select coalesce(sum(amount_cents), 0) from public.affiliate_commissions c where c.affiliate_id = a.user_id and c.status = 'pending' and c.available_at <= now()),
        'paid_cents', (select coalesce(sum(amount_cents), 0) from public.affiliate_commissions c where c.affiliate_id = a.user_id and c.status = 'paid')
      ) order by (a.status = 'pending') desc, a.created_at desc)
      from public.affiliates a left join public.profiles p on p.id = a.user_id), '[]'::jsonb),
    'top_members', coalesce((select jsonb_agg(x order by x.invited desc) from (
        select p.username, count(*) as invited, count(*) filter (where s.activated_at is not null) as activated
        from public.member_signups s join public.profiles p on p.id = s.referrer_id
        where s.referrer_kind = 'member'
        group by p.username order by count(*) desc limit 10) x), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.admin_affiliates() from public, anon;
grant execute on function public.admin_affiliates() to authenticated;

-- ---------- Actions de l'administrateur ----------
create or replace function public.admin_update_affiliate(p_user uuid, p_kind text, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  if p_kind not in ('creator', 'pro') or p_status not in ('pending', 'active', 'suspended') then raise exception 'INVALID_KIND'; end if;
  update public.affiliates
     set kind = p_kind, status = p_status, updated_at = now(),
         approved_at = case when p_status = 'active' then coalesce(approved_at, now()) else approved_at end
   where user_id = p_user;
end;
$$;
revoke execute on function public.admin_update_affiliate(uuid, text, text) from public, anon;
grant execute on function public.admin_update_affiliate(uuid, text, text) to authenticated;

create or replace function public.admin_set_founders_open(p_open boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  insert into public.app_settings (key, value, updated_at) values ('founders_open', to_jsonb(coalesce(p_open, false)), now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
end;
$$;
revoke execute on function public.admin_set_founders_open(boolean) from public, anon;
grant execute on function public.admin_set_founders_open(boolean) to authenticated;

create or replace function public.admin_add_expense(p_spent_on date, p_category text, p_label text, p_amount_cents integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  insert into public.admin_expenses (spent_on, category, label, amount_cents, created_by)
  values (coalesce(p_spent_on, current_date), p_category, btrim(p_label), p_amount_cents, (select auth.uid()))
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.admin_add_expense(date, text, text, integer) from public, anon;
grant execute on function public.admin_add_expense(date, text, text, integer) to authenticated;

create or replace function public.admin_delete_expense(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  delete from public.admin_expenses where id = p_id;
end;
$$;
revoke execute on function public.admin_delete_expense(uuid) from public, anon;
grant execute on function public.admin_delete_expense(uuid) to authenticated;

-- Offrir du Premium à un membre (co-animateur, invité, geste commercial)
create or replace function public.admin_grant_premium(p_username text, p_days integer)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  select id into v_user from public.profiles where lower(username) = lower(btrim(p_username));
  if v_user is null then raise exception 'NOT_FOUND'; end if;
  if p_days is null or p_days not between 1 and 3650 then raise exception 'INVALID_DAYS'; end if;
  perform private.grant_premium(v_user, p_days, 'admin', null);
  return (select max(ends_at) from public.premium_grants where user_id = v_user);
end;
$$;
revoke execute on function public.admin_grant_premium(text, integer) from public, anon;
grant execute on function public.admin_grant_premium(text, integer) to authenticated;
