-- =============================================================================
-- Backoffice : indicateurs clés (ARPU, MRR, churn, actifs…) et OKR
-- Les indicateurs mesurent ; les OKR fixent un cap : un objectif qualitatif, et 2 à 4 résultats clés
-- chiffrés, chacun relié à un indicateur calculé ici. La progression se lit en direct dans /admin.
-- =============================================================================

-- ---------- Indicateurs ----------
create or replace function public.admin_kpis()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb; rates jsonb;
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;

  with
  active_subs as (
    select s.user_id, s.stripe_subscription_id from public.subscriptions s where s.status in ('active', 'trialing', 'past_due')
  ),
  last_pay as (
    select distinct on (p.subscription_id) p.subscription_id, p.billing_interval, p.amount_excl_tax_cents
    from public.stripe_payments p order by p.subscription_id, p.paid_at desc
  ),
  mrr as (
    select coalesce(sum(case when l.billing_interval = 'year' then l.amount_excl_tax_cents / 12.0 else l.amount_excl_tax_cents end), 0) as cents
    from active_subs a join last_pay l on l.subscription_id = a.stripe_subscription_id
  ),
  -- Activité : un membre est actif un jour donné s'il a porté une montre, ajouté une montre ou une photo,
  -- écrit un message ou déclenché un événement produit.
  activity as (
    select user_id, created_at from public.wear_logs where created_at > now() - interval '30 days'
    union all select user_id, created_at from public.watches where created_at > now() - interval '30 days'
    union all select user_id, created_at from public.photos where created_at > now() - interval '30 days'
    union all select sender_id, created_at from public.messages where created_at > now() - interval '30 days'
    union all select user_id, created_at from public.product_events where created_at > now() - interval '30 days'
  ),
  counts as (
    select
      (select count(*) from public.profiles) as members,
      (select count(*) from active_subs) as paying,
      (select count(distinct user_id) from activity where created_at > now() - interval '1 day') as dau,
      (select count(distinct user_id) from activity where created_at > now() - interval '7 days') as wau,
      (select count(distinct user_id) from activity) as mau,
      (select count(distinct user_id) from public.wear_logs where created_at > now() - interval '7 days') as wearers_7d,
      (select coalesce(sum(amount_excl_tax_cents - refunded_cents), 0) from public.stripe_payments where paid_at > now() - interval '30 days') as revenue_30d_cents,
      -- Résiliations des 30 derniers jours, rapportées aux abonnés actifs + résiliés de la période
      (select count(*) from public.subscriptions where status in ('canceled', 'unpaid', 'incomplete_expired') and updated_at > now() - interval '30 days') as churned_30d,
      (select count(*) from public.watches where current_status in ('for_sale', 'for_exchange')) as listings,
      (select count(*) from public.conversations where watch_id is not null and created_at > now() - interval '30 days') as listing_conversations_30d,
      (select count(*) from public.watches where created_at > now() - interval '30 days') as watches_30d
  )
  select jsonb_build_object(
    'generated_at', now(),
    'members', c.members,
    'paying', c.paying,
    'mrr_cents', round(m.cents)::bigint,
    'arr_cents', round(m.cents * 12)::bigint,
    -- ARPU : revenu HT des 30 derniers jours (remboursements déduits) par membre inscrit
    'arpu_cents', case when c.members = 0 then null else round(c.revenue_30d_cents::numeric / c.members, 1) end,
    -- ARPPU : revenu mensuel récurrent par membre payant
    'arppu_cents', case when c.paying = 0 then null else round(m.cents / c.paying, 1) end,
    'revenue_30d_cents', c.revenue_30d_cents,
    'conversion_pct', case when c.members = 0 then null else round(100.0 * c.paying / c.members, 2) end,
    'churn_30d_pct', case when c.paying + c.churned_30d = 0 then null else round(100.0 * c.churned_30d / (c.paying + c.churned_30d), 1) end,
    -- Durée de vie estimée (LTV) = ARPPU / churn mensuel
    'ltv_cents', case when c.paying = 0 or c.churned_30d = 0 then null
                      else round((m.cents / c.paying) / (c.churned_30d::numeric / (c.paying + c.churned_30d)))::bigint end,
    'dau', c.dau, 'wau', c.wau, 'mau', c.mau,
    'stickiness_pct', case when c.mau = 0 then null else round(100.0 * c.dau / c.mau, 1) end,
    'wearers_7d', c.wearers_7d,
    'listings', c.listings,
    'listing_conversations_30d', c.listing_conversations_30d,
    'watches_30d', c.watches_30d,
    'founders_taken', (select count(*) from public.founders_offer_claims)
  ) into v
  from counts c cross join mrr m;

  -- Taux déjà calculés par le tableau de bord (activation, rétention, partage)
  rates := public.admin_dashboard() -> 'rates';
  v := v || jsonb_build_object(
    'activation_pct', (rates ->> 'activation')::numeric,
    'retention_pct', (rates ->> 'retention')::numeric
  );
  return v;
end;
$$;
revoke execute on function public.admin_kpis() from public, anon;
grant execute on function public.admin_kpis() to authenticated;

-- ---------- OKR ----------
create table if not exists public.admin_okrs (
  id uuid primary key default gen_random_uuid(),
  period text not null,                         -- ex. « T1 2027 »
  objective text not null check (char_length(objective) between 1 and 200),
  key_result text not null check (char_length(key_result) between 1 and 200),
  metric text not null,                         -- clé d'un indicateur de admin_kpis() (ex. 'wau', 'mrr_cents')
  target numeric not null,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.admin_okrs enable row level security;
-- Réservée au backoffice : seuls les administrateurs lisent et écrivent
drop policy if exists "admin_okrs_admin" on public.admin_okrs;
create policy "admin_okrs_admin" on public.admin_okrs for all to authenticated
  using (private.is_admin((select auth.uid()))) with check (private.is_admin((select auth.uid())));

-- Premiers OKR proposés (à ajuster dans le backoffice) ; insérés une seule fois
insert into public.admin_okrs (period, objective, key_result, metric, target, sort)
select * from (values
  ('T1 2027', 'Faire d''Arcora le carnet quotidien du collectionneur', 'Membres qui font un Wrist Check chaque semaine', 'wearers_7d', 200, 1),
  ('T1 2027', 'Faire d''Arcora le carnet quotidien du collectionneur', 'Activation : 3 montres dans la première semaine (%)', 'activation_pct', 40, 2),
  ('T1 2027', 'Faire d''Arcora le carnet quotidien du collectionneur', 'Rétention à 30 jours (%)', 'retention_pct', 35, 3),
  ('T1 2027', 'Prouver que Premium vaut son prix', 'Places de l''offre fondateurs prises', 'founders_taken', 100, 4),
  ('T1 2027', 'Prouver que Premium vaut son prix', 'Revenu mensuel récurrent (€ HT)', 'mrr_cents', 30000, 5),
  ('T1 2027', 'Prouver que Premium vaut son prix', 'Taux de conversion gratuit → Premium (%)', 'conversion_pct', 5, 6),
  ('T1 2027', 'Lancer le Marché entre collectionneurs', 'Annonces en ligne', 'listings', 50, 7),
  ('T1 2027', 'Lancer le Marché entre collectionneurs', 'Conversations ouvertes sur une annonce (30 jours)', 'listing_conversations_30d', 100, 8)
) as x(period, objective, key_result, metric, target, sort)
where not exists (select 1 from public.admin_okrs);
