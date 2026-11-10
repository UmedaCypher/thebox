-- =============================================================================
-- Déclaration de vol
-- Le propriétaire déclare le vol d'une montre de sa collection, avec son numéro de série et ses preuves
-- (facture, papiers, dépôt de plainte). Le numéro de série n'est jamais publié : on peut seulement
-- vérifier un numéro précis. Une montre déclarée volée ne peut pas être mise en vente sur le Marché,
-- ni par son propriétaire, ni par quelqu'un d'autre avec le même numéro de série.
-- =============================================================================

-- Numéro de série : privé, sur la fiche de la montre (jamais dans le passeport public)
alter table public.watches add column if not exists serial_number text check (char_length(serial_number) <= 60);

/** Numéro de série comparable : majuscules, sans espaces ni tirets ni points. */
create or replace function private.serial_key(p text)
returns text language sql immutable set search_path = '' as $$
  select nullif(upper(regexp_replace(coalesce(p, ''), '[\s.\-/]', '', 'g')), '');
$$;

create table if not exists public.stolen_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_id uuid references public.watches(id) on delete set null,
  brand text not null,
  model text not null,
  reference_number text,
  serial_number text not null check (char_length(serial_number) between 3 and 60),
  serial_key text generated always as (private.serial_key(serial_number)) stored,
  stolen_on date not null,
  city text check (char_length(city) <= 80),
  police_report_ref text check (char_length(police_report_ref) <= 80),   -- numéro de plainte (privé)
  description text check (char_length(description) <= 1000),
  is_public boolean not null default true,       -- visible dans la liste des montres volées (sans le numéro de série)
  status text not null default 'stolen' check (status in ('stolen', 'recovered')),
  proofs jsonb not null default '[]'::jsonb,     -- chemins des justificatifs dans le stockage privé « theft-proofs »
  created_at timestamptz not null default now(),
  recovered_at timestamptz
);
create index if not exists stolen_reports_serial_idx on public.stolen_reports (serial_key) where status = 'stolen';
create unique index if not exists stolen_reports_watch_active_idx on public.stolen_reports (watch_id) where status = 'stolen';
alter table public.stolen_reports enable row level security;

-- Le propriétaire gère ses déclarations ; personne d'autre ne lit la table (les fonctions ci-dessous exposent le strict nécessaire)
drop policy if exists "stolen_reports_owner_select" on public.stolen_reports;
create policy "stolen_reports_owner_select" on public.stolen_reports for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "stolen_reports_owner_insert" on public.stolen_reports;
create policy "stolen_reports_owner_insert" on public.stolen_reports for insert to authenticated
  with check (user_id = (select auth.uid())
    and (watch_id is null or exists (select 1 from public.watches w where w.id = watch_id and w.user_id = (select auth.uid()))));
drop policy if exists "stolen_reports_owner_update" on public.stolen_reports;
create policy "stolen_reports_owner_update" on public.stolen_reports for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "stolen_reports_owner_delete" on public.stolen_reports;
create policy "stolen_reports_owner_delete" on public.stolen_reports for delete to authenticated using (user_id = (select auth.uid()));

-- Une montre déclarée volée sort du Marché
create or replace function private.on_stolen_report()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'stolen' and new.watch_id is not null then
    update public.watches set current_status = 'in_collection'
    where id = new.watch_id and current_status::text in ('for_sale', 'for_exchange');
  end if;
  if new.status = 'recovered' and old.status is distinct from 'recovered' then new.recovered_at := now(); end if;
  return new;
end;
$$;
drop trigger if exists stolen_reports_effects on public.stolen_reports;
create trigger stolen_reports_effects before insert or update on public.stolen_reports
  for each row execute function private.on_stolen_report();

-- Mise en vente bloquée si le numéro de série correspond à un vol déclaré (par n'importe quel membre)
create or replace function private.block_stolen_listing()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.current_status::text in ('for_sale', 'for_exchange') and (
       exists (select 1 from public.stolen_reports r where r.watch_id = new.id and r.status = 'stolen')
       or (private.serial_key(new.serial_number) is not null and exists (
             select 1 from public.stolen_reports r where r.serial_key = private.serial_key(new.serial_number) and r.status = 'stolen'))) then
    raise exception 'STOLEN_WATCH' using hint = 'Cette montre est déclarée volée : elle ne peut pas être proposée sur le Marché.';
  end if;
  return new;
end;
$$;
drop trigger if exists watches_block_stolen_listing on public.watches;
create trigger watches_block_stolen_listing before insert or update of current_status, serial_number on public.watches
  for each row execute function private.block_stolen_listing();

-- Vérifier un numéro de série (visiteurs compris) : réponse seulement sur correspondance exacte
create or replace function public.check_stolen_serial(p_serial text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when private.serial_key(p_serial) is null or char_length(private.serial_key(p_serial)) < 4
    then jsonb_build_object('stolen', false, 'invalid', true)
    else coalesce((
      select jsonb_build_object('stolen', true, 'id', r.id, 'brand', r.brand, 'model', r.model, 'reference_number', r.reference_number,
               'stolen_on', r.stolen_on, 'city', r.city, 'owner_username', case when p.allow_private_messages is not false then p.username end)
      from public.stolen_reports r left join public.profiles p on p.id = r.user_id
      where r.serial_key = private.serial_key(p_serial) and r.status = 'stolen'
      order by r.created_at desc limit 1), jsonb_build_object('stolen', false))
  end;
$$;
revoke execute on function public.check_stolen_serial(text) from public;
grant execute on function public.check_stolen_serial(text) to anon, authenticated;

-- Liste publique des vols récents (sans numéro de série ni numéro de plainte)
create or replace function public.list_stolen_watches(p_limit integer default 60)
returns table (id uuid, brand text, model text, reference_number text, stolen_on date, city text, description text,
               photo_path text, owner_username text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.id, r.brand, r.model, r.reference_number, r.stolen_on, r.city, r.description,
         (select ph.storage_path from public.photos ph where ph.watch_id = r.watch_id and ph.photo_type <> 'wrist_shot'
            order by ph.is_main_photo desc, ph.created_at limit 1),
         case when p.allow_private_messages is not false then p.username end,
         r.created_at
  from public.stolen_reports r left join public.profiles p on p.id = r.user_id
  where r.status = 'stolen' and r.is_public
  order by r.stolen_on desc, r.created_at desc
  limit least(greatest(p_limit, 1), 200);
$$;
revoke execute on function public.list_stolen_watches(integer) from public;
grant execute on function public.list_stolen_watches(integer) to anon, authenticated;

-- Justificatifs : stockage privé, un dossier par membre (facture, carte de garantie, plainte)
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('theft-proofs', 'theft-proofs', false, 10485760)
    on conflict (id) do nothing;

    execute $p$drop policy if exists "theft_proofs_owner_read" on storage.objects$p$;
    execute $p$create policy "theft_proofs_owner_read" on storage.objects for select to authenticated
      using (bucket_id = 'theft-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    execute $p$drop policy if exists "theft_proofs_owner_insert" on storage.objects$p$;
    execute $p$create policy "theft_proofs_owner_insert" on storage.objects for insert to authenticated
      with check (bucket_id = 'theft-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    execute $p$drop policy if exists "theft_proofs_owner_delete" on storage.objects$p$;
    execute $p$create policy "theft_proofs_owner_delete" on storage.objects for delete to authenticated
      using (bucket_id = 'theft-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
  end if;
end $$;
