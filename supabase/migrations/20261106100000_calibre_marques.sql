-- =============================================================================
-- Calibre du mouvement (ex. NH35, 7750, 3235), puis marques et modèles (plus bas)
-- Deux montres identiques à l'œil peuvent cacher des mouvements différents : le calibre
-- complète le type de mouvement (automatique, manuel, quartz) et figure sur le passeport.
-- =============================================================================

alter table public.watches
  add column if not exists caliber text check (char_length(caliber) <= 60);

-- Suggestions : calibres déjà saisis par au moins deux membres, sous leur écriture la plus fréquente.
-- Seuls les noms de calibres sortent, jamais les montres ni leurs propriétaires.
create or replace function public.get_caliber_suggestions()
returns table (caliber text, uses bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select mode() within group (order by btrim(w.caliber)) as caliber, count(*) as uses
  from public.watches w
  where w.caliber is not null and btrim(w.caliber) <> ''
  group by upper(regexp_replace(w.caliber, '[\s.-]', '', 'g'))
  having count(distinct w.user_id) >= 2
  order by count(*) desc
  limit 300;
$$;
revoke execute on function public.get_caliber_suggestions() from public, anon;
grant execute on function public.get_caliber_suggestions() to authenticated;

-- Passeport : on ajoute le calibre (reste identique à la version du 23/10)
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
    'caliber', w.caliber,
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
    'owner_accepts_messages', coalesce(p.allow_private_messages, true) and p.username is not null,
    'is_owner', coalesce(w.user_id = (select auth.uid()), false),
    'listing', case when w.current_status::text in ('for_sale', 'for_exchange') then json_build_object(
        'kind', case when w.current_status::text = 'for_sale' then 'sale' else 'exchange' end,
        'price', case when w.current_status::text = 'for_sale' then w.sale_price end,
        'city', w.sale_city,
        'note', w.sale_note,
        'listed_at', w.listed_at) end,
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
        and (ph.photo_type <> 'wrist_shot' or coalesce(ph.is_public_gallery, false) or w.user_id = (select auth.uid()))), '[]'::json)
  )
  from public.watches w
  left join public.profiles p on p.id = w.user_id
  where w.id = p_watch_id
    and (w.user_id = (select auth.uid()) or w.passport_public or coalesce(p.is_public, false)
         or (w.current_status::text in ('for_sale', 'for_exchange') and p.username is not null));
$$;
revoke execute on function public.get_watch_passport(uuid) from public;
grant execute on function public.get_watch_passport(uuid) to anon, authenticated;

-- =============================================================================
-- Marques et modèles : des noms propres pour des statistiques fiables
-- La saisie reste libre (microbrands, marques anciennes) ; l'app propose la liste officielle,
-- corrige la casse et signale les fautes probables. Les marques inconnues se vérifient au backoffice.
-- =============================================================================

-- Liste officielle : les marques courantes, sans doublon de casse avec celles déjà présentes
insert into public.brands (name)
select x from unnest(array[
  'A. Lange & Söhne', 'Alpina', 'Anordain', 'Archimede', 'Armand Nicolet', 'Audemars Piguet', 'Ball', 'Baltic', 'Baume & Mercier',
  'Bell & Ross', 'Benrus', 'Blancpain', 'Boldr', 'Breguet', 'Breitling', 'Bremont', 'Bulova', 'Bulgari', 'Carl F. Bucherer',
  'Cartier', 'Casio', 'Certina', 'Chopard', 'Christopher Ward', 'Citizen', 'Corum', 'Credor', 'Czapek', 'Damasko', 'Delma',
  'Doxa', 'Dan Henry', 'Eberhard & Co.', 'Edox', 'Enicar', 'Eterna', 'F.P. Journe', 'Farer', 'Fears', 'Fortis', 'Franck Muller',
  'Frederique Constant', 'Furlan Marri', 'G-Shock', 'Garmin', 'Girard-Perregaux', 'Glashütte Original', 'Glycine', 'Grand Seiko',
  'Greubel Forsey', 'Gucci', 'H. Moser & Cie', 'Halios', 'Hamilton', 'Hanhart', 'Heuer', 'Hermès', 'Hublot', 'IWC', 'Jaeger-LeCoultre',
  'Junghans', 'Kurono Tokyo', 'Laco', 'Laurent Ferrier', 'Leuba', 'Lip', 'Longines', 'Lorier', 'Louis Erard', 'Louis Vuitton',
  'Lundis Bleus', 'Maurice Lacroix', 'MB&F', 'Mido', 'Ming', 'Montblanc', 'Movado', 'Mühle Glashütte', 'Nivada Grenchen', 'Nodus',
  'Nomos Glashütte', 'Norqain', 'Omega', 'Oris', 'Orient', 'Orient Star', 'Panerai', 'Parmigiani Fleurier', 'Patek Philippe',
  'Piaget', 'Rado', 'Raymond Weil', 'Richard Mille', 'Rolex', 'San Martin', 'Seiko', 'Sinn', 'Squale', 'Steinhart', 'Studio Underd0g',
  'Swatch', 'TAG Heuer', 'Timex', 'Tissot', 'Tudor', 'Ulysse Nardin', 'Unimatic', 'Universal Genève', 'Urwerk', 'Vacheron Constantin',
  'Vaer', 'Venezianico', 'Vulcain', 'Yema', 'Zenith', 'Zodiac'
]) as x
where not exists (select 1 from public.brands b where lower(b.name) = lower(x));

-- Modèles déjà saisis pour une marque, par au moins deux membres (écriture la plus fréquente).
-- Seuls les noms sortent, jamais les montres ni leurs propriétaires.
create or replace function public.get_model_suggestions(p_brand text)
returns table (model text, uses bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select mode() within group (order by btrim(w.model)) as model, count(*) as uses
  from public.watches w
  where lower(btrim(w.brand)) = lower(btrim(p_brand))
  group by lower(regexp_replace(btrim(w.model), '\s+', ' ', 'g'))
  having count(distinct w.user_id) >= 2
  order by count(*) desc
  limit 100;
$$;
revoke execute on function public.get_model_suggestions(text) from public, anon;
grant execute on function public.get_model_suggestions(text) to authenticated;

-- Backoffice : marques saisies hors de la liste officielle
create or replace function public.admin_brand_review()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'official', coalesce((select jsonb_agg(b.name order by lower(b.name)) from public.brands b), '[]'::jsonb),
    'unknown', coalesce((select jsonb_agg(x order by x.watches desc, x.name) from (
        select mode() within group (order by u.brand) as name, count(*) filter (where u.src = 'w') as watches,
               count(*) filter (where u.src = 'l') as wishlist, count(distinct u.user_id) as members
        from (
          select btrim(brand) as brand, user_id, 'w' as src from public.watches
          union all
          select btrim(brand), user_id, 'l' from public.wishlist_items
        ) u
        where not exists (select 1 from public.brands b where lower(b.name) = lower(u.brand))
        group by lower(u.brand)
      ) x), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.admin_brand_review() from public, anon;
grant execute on function public.admin_brand_review() to authenticated;

-- Ajouter une marque à la liste officielle
create or replace function public.admin_add_brand(p_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare v text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  if char_length(v) not between 1 and 80 then raise exception 'INVALID_NAME'; end if;
  insert into public.brands (name) select v
  where not exists (select 1 from public.brands b where lower(b.name) = lower(v));
end;
$$;
revoke execute on function public.admin_add_brand(text) from public, anon;
grant execute on function public.admin_add_brand(text) to authenticated;

-- Fusionner une écriture (faute, casse) dans une marque : montres et wishlist sont renommées
create or replace function public.admin_merge_brand(p_from text, p_to text)
returns integer language plpgsql security definer set search_path = '' as $$
declare v text := btrim(regexp_replace(coalesce(p_to, ''), '\s+', ' ', 'g')); n integer; m integer;
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  if char_length(v) not between 1 and 80 then raise exception 'INVALID_NAME'; end if;
  update public.watches set brand = v where lower(btrim(brand)) = lower(btrim(p_from)) and brand <> v;
  get diagnostics n = row_count;
  update public.wishlist_items set brand = v where lower(btrim(brand)) = lower(btrim(p_from)) and brand <> v;
  get diagnostics m = row_count;
  return n + m;
end;
$$;
revoke execute on function public.admin_merge_brand(text, text) from public, anon;
grant execute on function public.admin_merge_brand(text, text) to authenticated;
