-- Comparateur : chercher n'importe quelle montre visible publiquement sur Arcora
-- (passeport partagé, collection publique, ou annonce du Marché), en plus de sa propre collection.
-- Mêmes règles de visibilité que get_watch_passport : rien de privé n'est exposé.

create or replace function public.search_public_watches(p_query text default null, p_limit int default 20)
returns table (
  id uuid, brand text, model text, reference_number text, owner_username text,
  photo_path text, on_market boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (
    select nullif(btrim(coalesce(p_query, '')), '') as text
  )
  select w.id, w.brand, w.model, w.reference_number,
    case when coalesce(p.is_public, false) or w.current_status::text in ('for_sale', 'for_exchange') then p.username end,
    (select ph.storage_path from public.photos ph
      where ph.watch_id = w.id and (ph.photo_type <> 'wrist_shot' or coalesce(ph.is_public_gallery, false))
      order by ph.is_main_photo desc, (ph.photo_type = 'watch_only') desc, ph.created_at
      limit 1),
    w.current_status::text in ('for_sale', 'for_exchange')
  from public.watches w
  join public.profiles p on p.id = w.user_id
  cross join q
  where w.user_id <> coalesce((select auth.uid()), '00000000-0000-0000-0000-000000000000'::uuid)
    and (w.passport_public or coalesce(p.is_public, false)
         or (w.current_status::text in ('for_sale', 'for_exchange') and p.username is not null))
    -- Chaque mot cherché doit apparaître dans la marque, le modèle ou la référence (« speedmaster omega » marche)
    and not exists (
      select 1 from unnest(regexp_split_to_array(coalesce(q.text, ''), '\s+')) as word
      where word <> ''
        and (coalesce(w.brand, '') || ' ' || coalesce(w.model, '') || ' ' || coalesce(w.reference_number, ''))
            not ilike '%' || replace(replace(replace(word, '\', '\\'), '%', '\%'), '_', '\_') || '%'
    )
  order by (w.current_status::text in ('for_sale', 'for_exchange')) desc, w.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

revoke execute on function public.search_public_watches(text, int) from public;
grant execute on function public.search_public_watches(text, int) to anon, authenticated;
