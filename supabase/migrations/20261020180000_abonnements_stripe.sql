-- =============================================================================
-- THE BOX — Abonnements Premium via Stripe (20/10/2026)
--
-- À exécuter APRÈS 20261020120000_recadrage_collectionneur.sql.
-- Ré-exécutable sans risque.
--
-- La table est écrite uniquement par la fonction stripe-webhook (clé service_role).
-- Les utilisateurs peuvent seulement lire leur propre ligne.
-- C'est le webhook qui met profiles.plan à 'premium' ou 'free' : l'app ne le fait jamais.
-- =============================================================================

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
-- Aucune politique insert/update/delete : seule la clé service_role (qui ignore la RLS) écrit.

revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

-- Vérification après coup :
--   select p.username, p.plan, s.status, s.current_period_end
--   from public.subscriptions s join public.profiles p on p.id = s.user_id;
