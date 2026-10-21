-- =============================================================================
-- THE BOX — Recadrage « collectionneur » (20/10/2026)
--
-- À exécuter UNE fois dans Supabase → SQL Editor (ou `supabase db push`).
-- Le script est ré-exécutable : il utilise IF NOT EXISTS / DROP ... IF EXISTS.
--
-- Contenu :
--   1. Corrections : statut par défaut des montres, suppressions en cascade
--   2. Offre : colonne profiles.plan (free | premium), protégée contre la modification par l'utilisateur
--   3. Limite de 6 montres en gratuit, appliquée par la base
--   4. Nouvelles tables : wear_logs, maintenance_entries, watch_value_history, wishlist_items, waitlist
--   5. Passeport public et collection publique via des fonctions qui n'exposent jamais les prix
-- =============================================================================

create schema if not exists private;

-- -----------------------------------------------------------------------------
-- 1. Corrections
-- -----------------------------------------------------------------------------

-- Le formulaire pouvait envoyer un statut vide alors que la colonne est NOT NULL.
alter table public.watches alter column current_status set default 'in_collection';

-- Suppression d'une montre : les données liées partent avec elle (avant : suppression une par une côté app).
alter table public.photos drop constraint if exists photos_watch_id_fkey;
alter table public.photos add constraint photos_watch_id_fkey
  foreign key (watch_id) references public.watches(id) on delete cascade;

alter table public.watch_service_history drop constraint if exists watch_service_history_watch_id_fkey;
alter table public.watch_service_history add constraint watch_service_history_watch_id_fkey
  foreign key (watch_id) references public.watches(id) on delete cascade;

alter table public.documents drop constraint if exists documents_watch_id_fkey;
alter table public.documents add constraint documents_watch_id_fkey
  foreign key (watch_id) references public.watches(id) on delete cascade;

alter table public.invoice_items drop constraint if exists invoice_items_watch_id_fkey;
alter table public.invoice_items add constraint invoice_items_watch_id_fkey
  foreign key (watch_id) references public.watches(id) on delete set null;

create index if not exists photos_watch_id_idx on public.photos (watch_id);
create index if not exists watches_user_id_idx on public.watches (user_id);

-- Valeur estimée : jamais négative (déclaratif). NOT VALID : n'échoue pas sur d'éventuelles anciennes valeurs.
alter table public.watches drop constraint if exists watches_estimated_value_check;
alter table public.watches add constraint watches_estimated_value_check check (current_estimated_value >= 0) not valid;

-- Passeport : partage volontaire, montre par montre.
alter table public.watches add column if not exists passport_public boolean not null default false;

-- -----------------------------------------------------------------------------
-- 2. Offre (free / premium), distincte de account_type qui désigne les revendeurs
-- -----------------------------------------------------------------------------

alter table public.profiles add column if not exists plan text not null default 'free';
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'premium'));

-- Un utilisateur ne peut pas s'attribuer lui-même Premium ou un compte revendeur.
-- Seuls le SQL Editor (postgres) et la clé service_role peuvent changer ces colonnes.
create or replace function private.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.plan := 'free';
      new.account_type := 'free';
    else
      new.plan := old.plan;
      new.account_type := old.account_type;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before insert or update on public.profiles
  for each row execute function private.protect_profile_privileges();

create or replace function private.is_premium(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user and (p.plan = 'premium' or coalesce(p.account_type::text, 'free') <> 'free')
  );
$$;
revoke execute on function private.is_premium(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_premium(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Limite de montres en gratuit
-- -----------------------------------------------------------------------------

create or replace function public.free_watch_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 6 $$;
grant execute on function public.free_watch_limit() to anon, authenticated;

create or replace function private.enforce_watch_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_plan text;
  v_account text;
begin
  select p.plan, p.account_type::text into v_plan, v_account
  from public.profiles p where p.id = new.user_id;

  -- Premium, revendeurs et admins : pas de limite.
  if v_plan = 'premium' or coalesce(v_account, 'free') <> 'free' then
    return new;
  end if;

  select count(*) into v_count from public.watches w where w.user_id = new.user_id;
  if v_count >= public.free_watch_limit() then
    raise exception 'WATCH_LIMIT_REACHED'
      using hint = 'La collection gratuite est limitée à ' || public.free_watch_limit() || ' montres.';
  end if;
  return new;
end;
$$;

drop trigger if exists watches_enforce_limit on public.watches;
create trigger watches_enforce_limit
  before insert on public.watches
  for each row execute function private.enforce_watch_limit();

-- -----------------------------------------------------------------------------
-- 4a. Calendrier de portage (gratuit)
-- -----------------------------------------------------------------------------

create table if not exists public.wear_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_id uuid not null references public.watches(id) on delete cascade,
  worn_on date not null,
  note text check (char_length(note) <= 280),
  created_at timestamptz not null default now(),
  constraint wear_logs_unique_day unique (watch_id, worn_on)
);
create index if not exists wear_logs_user_day_idx on public.wear_logs (user_id, worn_on desc);
create index if not exists wear_logs_watch_idx on public.wear_logs (watch_id);

alter table public.wear_logs enable row level security;
drop policy if exists wear_logs_select_own on public.wear_logs;
create policy wear_logs_select_own on public.wear_logs
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists wear_logs_insert_own on public.wear_logs;
create policy wear_logs_insert_own on public.wear_logs
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.watches w where w.id = watch_id and w.user_id = (select auth.uid()))
  );
drop policy if exists wear_logs_update_own on public.wear_logs;
create policy wear_logs_update_own on public.wear_logs
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.watches w where w.id = watch_id and w.user_id = (select auth.uid()))
  );
drop policy if exists wear_logs_delete_own on public.wear_logs;
create policy wear_logs_delete_own on public.wear_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- 4b. Carnet d'entretien (Premium pour l'ajout ; lecture toujours possible)
-- -----------------------------------------------------------------------------

create table if not exists public.maintenance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_id uuid not null references public.watches(id) on delete cascade,
  performed_on date not null,
  kind text not null check (kind in ('revision', 'polissage', 'reglage', 'etancheite', 'reparation', 'pile', 'bracelet', 'autre')),
  provider text check (char_length(provider) <= 120),
  cost numeric(10, 2) check (cost >= 0),
  notes text check (char_length(notes) <= 2000),
  next_due_on date,
  created_at timestamptz not null default now()
);
create index if not exists maintenance_watch_idx on public.maintenance_entries (watch_id, performed_on desc);
create index if not exists maintenance_user_due_idx on public.maintenance_entries (user_id, next_due_on);

alter table public.maintenance_entries enable row level security;
drop policy if exists maintenance_select_own on public.maintenance_entries;
create policy maintenance_select_own on public.maintenance_entries
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists maintenance_insert_premium on public.maintenance_entries;
create policy maintenance_insert_premium on public.maintenance_entries
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (select private.is_premium((select auth.uid())))
    and exists (select 1 from public.watches w where w.id = watch_id and w.user_id = (select auth.uid()))
  );
drop policy if exists maintenance_update_premium on public.maintenance_entries;
create policy maintenance_update_premium on public.maintenance_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select private.is_premium((select auth.uid())))
    and exists (select 1 from public.watches w where w.id = watch_id and w.user_id = (select auth.uid()))
  );
drop policy if exists maintenance_delete_own on public.maintenance_entries;
create policy maintenance_delete_own on public.maintenance_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- 4c. Historique de valeur (déclaratif) : rempli automatiquement quand la valeur estimée change
-- -----------------------------------------------------------------------------

create table if not exists public.watch_value_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_id uuid not null references public.watches(id) on delete cascade,
  value numeric(14, 2) not null check (value >= 0),
  recorded_at timestamptz not null default now()
);
create index if not exists value_history_watch_idx on public.watch_value_history (watch_id, recorded_at);
create index if not exists value_history_user_idx on public.watch_value_history (user_id, recorded_at);

alter table public.watch_value_history enable row level security;
drop policy if exists value_history_select_own on public.watch_value_history;
create policy value_history_select_own on public.watch_value_history
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists value_history_delete_own on public.watch_value_history;
create policy value_history_delete_own on public.watch_value_history
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function private.record_watch_value()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.current_estimated_value is not null
     and (tg_op = 'INSERT' or new.current_estimated_value is distinct from old.current_estimated_value) then
    insert into public.watch_value_history (user_id, watch_id, value)
    values (new.user_id, new.id, new.current_estimated_value);
  end if;
  return new;
end;
$$;

drop trigger if exists watches_record_value on public.watches;
create trigger watches_record_value
  after insert or update of current_estimated_value on public.watches
  for each row execute function private.record_watch_value();

-- Point de départ pour les montres déjà saisies.
insert into public.watch_value_history (user_id, watch_id, value, recorded_at)
select w.user_id, w.id, w.current_estimated_value, coalesce(w.updated_at, w.created_at, now())
from public.watches w
where w.current_estimated_value is not null
  and not exists (select 1 from public.watch_value_history h where h.watch_id = w.id);

-- -----------------------------------------------------------------------------
-- 4d. Wishlist (Premium pour l'ajout)
-- -----------------------------------------------------------------------------

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null check (char_length(brand) between 1 and 80),
  model text not null check (char_length(model) between 1 and 120),
  reference_number text check (char_length(reference_number) <= 60),
  target_price numeric(12, 2) check (target_price >= 0),
  priority smallint not null default 2 check (priority between 1 and 3),
  notes text check (char_length(notes) <= 1000),
  acquired_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists wishlist_user_idx on public.wishlist_items (user_id, priority, created_at desc);

alter table public.wishlist_items enable row level security;
drop policy if exists wishlist_select_own on public.wishlist_items;
create policy wishlist_select_own on public.wishlist_items
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists wishlist_insert_premium on public.wishlist_items;
create policy wishlist_insert_premium on public.wishlist_items
  for insert to authenticated with check (
    (select auth.uid()) = user_id and (select private.is_premium((select auth.uid())))
  );
drop policy if exists wishlist_update_own on public.wishlist_items;
create policy wishlist_update_own on public.wishlist_items
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists wishlist_delete_own on public.wishlist_items;
create policy wishlist_delete_own on public.wishlist_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- 4e. Liste d'attente (écriture publique, lecture réservée à l'admin)
-- -----------------------------------------------------------------------------

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  watch_count text check (watch_count in ('0', '1-2', '3-5', '6-10', '11+')),
  interested_in_premium boolean not null default false,
  source text check (char_length(source) <= 60),
  created_at timestamptz not null default now()
);
create unique index if not exists waitlist_email_unique on public.waitlist (lower(email));

alter table public.waitlist enable row level security;
drop policy if exists waitlist_insert_anyone on public.waitlist;
create policy waitlist_insert_anyone on public.waitlist
  for insert to anon, authenticated with check (true);
-- Aucune politique SELECT : personne ne peut lire la liste via l'API.
-- Consultation : SQL Editor →  select source, watch_count, count(*) from public.waitlist group by 1, 2;

-- -----------------------------------------------------------------------------
-- 5. Lecture publique sans prix ni données d'achat
-- -----------------------------------------------------------------------------

-- Passeport d'une montre : visible par son propriétaire, ou par tous si partagé
-- (passport_public) ou si le profil du propriétaire est public.
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
    'is_owner', coalesce(w.user_id = (select auth.uid()), false),
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
        -- une photo au poignet n'est montrée que si son auteur l'a partagée dans la galerie
        and (ph.photo_type <> 'wrist_shot' or coalesce(ph.is_public_gallery, false) or w.user_id = (select auth.uid()))), '[]'::json)
  )
  from public.watches w
  left join public.profiles p on p.id = w.user_id
  where w.id = p_watch_id
    and (w.user_id = (select auth.uid()) or w.passport_public or coalesce(p.is_public, false));
$$;
revoke execute on function public.get_watch_passport(uuid) from public;
grant execute on function public.get_watch_passport(uuid) to anon, authenticated;

-- Collection publique d'un membre (profil public uniquement).
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
    'watches', case when coalesce(p.is_public, false) then coalesce((
      select json_agg(json_build_object(
        'id', w.id, 'brand', w.brand, 'model', w.model,
        'reference_number', w.reference_number, 'year_of_production', w.year_of_production,
        'main_photo_path', (select ph.storage_path from public.photos ph where ph.watch_id = w.id
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
-- 6. Droits d'accès explicites sur les nouvelles tables (la sécurité ligne à ligne s'applique en plus)
-- -----------------------------------------------------------------------------

grant select, insert, update, delete on public.wear_logs, public.maintenance_entries, public.wishlist_items to authenticated;
grant select, delete on public.watch_value_history to authenticated;
grant insert on public.waitlist to anon, authenticated;

-- -----------------------------------------------------------------------------
-- À vérifier à la main (non visible dans l'export du schéma) :
--  * La politique SELECT de public.watches ne doit autoriser QUE le propriétaire
--    (les lectures publiques passent désormais par les deux fonctions ci-dessus).
--  * get_public_wrist_shots doit filtrer sur photos.is_public_gallery = true.
--  * Si un trigger handle_new_user existe sur auth.users, il ne doit pas copier account_type ou plan
--    depuis les métadonnées d'inscription (sinon un inscrit pourrait s'attribuer un compte pro).
-- -----------------------------------------------------------------------------
