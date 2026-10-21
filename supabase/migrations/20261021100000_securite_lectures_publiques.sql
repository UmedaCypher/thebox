-- =============================================================================
-- THE BOX — Sécurité des lectures publiques (21/10/2026)
--
-- Constat (diagnostic du 21/10) :
--  * watches  : la règle « Allow public read access to watches of public profiles » exposait
--               toutes les colonnes (prix d'achat, valeur, lieu d'achat) des profils publics.
--  * profiles : la règle « Profiles are viewable by everyone. » (true) exposait toutes les
--               colonnes de tous les profils (nom, téléphone…).
--  * galerie  : get_public_wrist_shots ne tenait pas compte du choix de partage par photo.
--
-- Les pages publiques passent désormais par des fonctions qui ne renvoient que des champs
-- sans risque : get_watch_passport, get_public_collection, get_public_wrist_shots,
-- get_gallery_available_brands. Chaque membre ne lit en direct que ses propres lignes.
-- Ré-exécutable sans risque.
-- =============================================================================

-- 1. Montres : lecture directe réservée au propriétaire
drop policy if exists "Allow public read access to watches of public profiles" on public.watches;

-- 2. Profils : lecture directe réservée au propriétaire
drop policy if exists "Profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can view their own profile and public profiles." on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

-- 3. Galerie : les photos que les membres ont publiées jusqu'ici (profil public) restent visibles,
--    comme avant ; ensuite, chaque photo est partagée ou non au moment de l'ajout.
update public.photos ph
set is_public_gallery = true
from public.watches w
join public.profiles p on p.id = w.user_id
where ph.watch_id = w.id
  and ph.photo_type = 'wrist_shot'
  and coalesce(ph.is_public_gallery, false) = false
  and coalesce(p.is_public, false) = true;

-- 4. Fonctions de la galerie : on remplace les anciennes versions (quelle que soit leur signature)
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.proname in ('get_public_wrist_shots', 'get_gallery_available_brands')
  loop
    execute 'drop function ' || f.sig;
  end loop;
end $$;

create function public.get_public_wrist_shots(
  selected_brand_filter text default null,
  min_wrist_filter numeric default null,
  max_wrist_filter numeric default null,
  page_limit integer default 60,
  page_offset integer default 0
)
returns table (
  photo_id uuid, photo_storage_path text, watch_id uuid, watch_brand text, watch_model text,
  user_username text, user_wrist_size_cm numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select ph.id, ph.storage_path, w.id, w.brand, w.model, p.username,
         coalesce(ph.wrist_shot_on_wrist_size_cm, p.wrist_size_cm)
  from public.photos ph
  join public.watches w on w.id = ph.watch_id
  join public.profiles p on p.id = w.user_id
  where ph.photo_type = 'wrist_shot'
    and ph.is_public_gallery = true
    and (selected_brand_filter is null or w.brand = selected_brand_filter)
    and (min_wrist_filter is null or coalesce(ph.wrist_shot_on_wrist_size_cm, p.wrist_size_cm) >= min_wrist_filter)
    and (max_wrist_filter is null or coalesce(ph.wrist_shot_on_wrist_size_cm, p.wrist_size_cm) <= max_wrist_filter)
  order by ph.created_at desc
  limit least(greatest(page_limit, 1), 200) offset greatest(page_offset, 0);
$$;

create function public.get_gallery_available_brands()
returns table (brand text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct w.brand
  from public.photos ph
  join public.watches w on w.id = ph.watch_id
  where ph.photo_type = 'wrist_shot' and ph.is_public_gallery = true
  order by 1;
$$;

revoke execute on function public.get_public_wrist_shots(text, numeric, numeric, integer, integer) from public;
revoke execute on function public.get_gallery_available_brands() from public;
grant execute on function public.get_public_wrist_shots(text, numeric, numeric, integer, integer) to anon, authenticated;
grant execute on function public.get_gallery_available_brands() to anon, authenticated;

-- 5. Vérification : chaque ligne doit afficher OK
select 'Montres : plus de lecture publique directe' as verification,
       case when not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'watches'
                             and cmd in ('SELECT', 'ALL') and coalesce(qual, '') not ilike '%auth.uid()%') then 'OK' else 'À CORRIGER' end as resultat
union all
select 'Profils : lecture réservée au propriétaire',
       case when not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
                             and cmd in ('SELECT', 'ALL') and coalesce(qual, '') not ilike '%auth.uid()%') then 'OK' else 'À CORRIGER' end
union all
select 'Galerie : photos partagées uniquement',
       case when pg_get_functiondef('public.get_public_wrist_shots(text, numeric, numeric, integer, integer)'::regprocedure) ilike '%is_public_gallery = true%' then 'OK' else 'À CORRIGER' end
union all
select 'Photos visibles dans la galerie : ' || count(*), 'INFO'
from public.photos where photo_type = 'wrist_shot' and is_public_gallery = true;
