-- =============================================================================
-- Calibre du mouvement (ex. NH35, 7750, 3235)
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
