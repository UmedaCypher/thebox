-- =============================================================================
-- Offre membres fondateurs : les 100 premiers abonnés paient la première année
-- 1 €/mois ou 9,99 €/an (au lieu de 2,99 €/mois ou 29,90 €/an), puis le tarif normal.
-- La remise est appliquée par create-checkout-session (coupons Stripe) ;
-- une place est comptée au premier paiement (webhook invoice.paid).
-- =============================================================================

create table if not exists public.founders_offer_claims (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_subscription_id text,
  billing_interval text check (billing_interval in ('month', 'year')),
  claimed_at timestamptz not null default now()
);
-- Lu et écrit seulement par les fonctions ci-dessous et par le webhook (clé de service) : aucune politique.
alter table public.founders_offer_claims enable row level security;

insert into public.app_settings (key, value) values ('founders_offer_limit', '100'::jsonb) on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('founders_offer_open', 'true'::jsonb) on conflict (key) do nothing;

-- Places restantes, affichées sur la page Premium (visiteurs compris)
create or replace function public.get_founders_offer()
returns jsonb language sql stable security definer set search_path = '' as $$
  with s as (
    select coalesce((select (value)::text::int from public.app_settings where key = 'founders_offer_limit'), 100) as lim,
           coalesce((select (value)::text::boolean from public.app_settings where key = 'founders_offer_open'), true) as is_open,
           (select count(*)::int from public.founders_offer_claims) as taken
  )
  select jsonb_build_object(
    'limit', lim, 'taken', taken, 'remaining', greatest(lim - taken, 0),
    'open', is_open and taken < lim,
    'claimed', exists (select 1 from public.founders_offer_claims c where c.user_id = (select auth.uid()))
  ) from s;
$$;
revoke execute on function public.get_founders_offer() from public;
grant execute on function public.get_founders_offer() to anon, authenticated;

-- Backoffice : ouvrir ou fermer l'offre
create or replace function public.admin_set_founders_offer_open(p_open boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  insert into public.app_settings (key, value) values ('founders_offer_open', to_jsonb(p_open))
  on conflict (key) do update set value = excluded.value;
end;
$$;
revoke execute on function public.admin_set_founders_offer_open(boolean) from public, anon;
grant execute on function public.admin_set_founders_offer_open(boolean) to authenticated;
