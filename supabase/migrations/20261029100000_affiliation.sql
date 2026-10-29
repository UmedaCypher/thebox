-- =====================================================================================
-- Programme d'affiliation
--
-- Un membre devient affilié et reçoit un lien personnel (…/?ref=son-code).
-- Quand une personne arrivée par ce lien souscrit l'abonnement ANNUEL, l'affilié touche 30 % du prix
-- hors taxes de la première année. La commission devient payable 30 jours après le paiement
-- (après le délai de rétractation de 14 jours), et elle est annulée en cas de remboursement ou de litige.
-- Les virements sont faits à la main chaque mois, à partir de 50 € dus.
--
-- Écritures :
--  * les membres passent par des fonctions (adhérer, renseigner leurs coordonnées de virement) ;
--  * le webhook Stripe (clé service_role, côté serveur uniquement) crée parrainages et commissions ;
--  * l'administrateur (profiles.account_type = 'admin') enregistre les virements.
-- Ré-exécutable sans risque.
-- =====================================================================================

create or replace function private.is_admin(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = p_user and p.account_type::text = 'admin');
$$;
revoke execute on function private.is_admin(uuid) from public, anon, authenticated;

-- ---------- Affiliés ----------
create table if not exists public.affiliates (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9][a-z0-9._-]{2,29}$'),
  status text not null default 'active' check (status in ('active', 'suspended')),
  payout_holder text check (char_length(payout_holder) <= 120),
  payout_iban text check (payout_iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$'),
  terms_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.affiliates enable row level security;
drop policy if exists "affiliates: lecture de sa fiche" on public.affiliates;
create policy "affiliates: lecture de sa fiche" on public.affiliates
  for select to authenticated using (user_id = (select auth.uid()));
-- Pas d'écriture directe : tout passe par les fonctions ci-dessous.

-- ---------- Parrainages (une personne parrainée n'a qu'un affilié) ----------
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

-- ---------- Adhérer ----------
create or replace function public.join_affiliate_program(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare me uuid := (select auth.uid()); v_code text := lower(btrim(coalesce(p_code, '')));
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.profiles where id = me and username is not null) then raise exception 'USERNAME_REQUIRED'; end if;
  if v_code !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then raise exception 'INVALID_CODE'; end if;
  if exists (select 1 from public.affiliates where user_id = me) then
    return (select code from public.affiliates where user_id = me);
  end if;
  if exists (select 1 from public.affiliates where code = v_code) then raise exception 'CODE_TAKEN'; end if;
  insert into public.affiliates (user_id, code) values (me, v_code);
  return v_code;
end;
$$;
revoke execute on function public.join_affiliate_program(text) from public, anon;
grant execute on function public.join_affiliate_program(text) to authenticated;

-- ---------- Coordonnées de virement (IBAN null : on garde celui déjà enregistré) ----------
create or replace function public.update_affiliate_payout(p_holder text, p_iban text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare me uuid := (select auth.uid()); v_iban text := upper(regexp_replace(coalesce(p_iban, ''), '\s', '', 'g'));
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.affiliates where user_id = me) then raise exception 'NOT_AFFILIATE'; end if;
  if v_iban <> '' and v_iban !~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$' then raise exception 'INVALID_IBAN'; end if;
  update public.affiliates
     set payout_holder = nullif(btrim(coalesce(p_holder, '')), ''), payout_iban = case when p_iban is null then payout_iban else nullif(v_iban, '') end, updated_at = now()
   where user_id = me;
end;
$$;
revoke execute on function public.update_affiliate_payout(text, text) from public, anon;
grant execute on function public.update_affiliate_payout(text, text) to authenticated;

-- ---------- Tableau de bord de l'affilié ----------
create or replace function public.get_my_affiliate()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when a.user_id is null then null else jsonb_build_object(
    'code', a.code,
    'status', a.status,
    'payout_holder', a.payout_holder,
    -- l'IBAN n'est jamais renvoyé en entier : seulement ses 4 derniers caractères
    'payout_iban_last4', right(a.payout_iban, 4),
    'created_at', a.created_at,
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
language plpgsql
stable
security definer
set search_path = ''
as $$
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
returns integer
language plpgsql
security definer
set search_path = ''
as $$
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
