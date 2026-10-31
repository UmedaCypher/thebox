-- =====================================================================================
-- Backoffice : liste d'attente Premium
--
-- La table waitlist reste illisible depuis l'API (aucune politique SELECT) ;
-- seules ces fonctions, réservées à l'administrateur, la lisent.
-- Ré-exécutable sans risque.
-- =====================================================================================

create index if not exists waitlist_created_idx on public.waitlist (created_at desc);

-- Chiffres et dernières inscriptions (200 au plus ; l'export donne tout)
create or replace function public.admin_waitlist()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
    'total', (select count(*) from public.waitlist),
    'last_7d', (select count(*) from public.waitlist where created_at > now() - interval '7 days'),
    'last_30d', (select count(*) from public.waitlist where created_at > now() - interval '30 days'),
    'premium', (select count(*) from public.waitlist where interested_in_premium),
    'members', (select count(*) from public.waitlist w where exists (select 1 from auth.users u where lower(u.email) = lower(w.email))),
    'by_source', coalesce((select jsonb_agg(x order by x.n desc) from (
        select coalesce(source, 'direct') as label, count(*) as n from public.waitlist group by 1) x), '[]'::jsonb),
    'by_watch_count', coalesce((select jsonb_agg(x order by x.ord) from (
        select coalesce(watch_count, 'non précisé') as label, count(*) as n,
               array_position(array['0', '1-2', '3-5', '6-10', '11+'], watch_count) as ord
        from public.waitlist group by watch_count) x), '[]'::jsonb),
    'recent', coalesce((select jsonb_agg(jsonb_build_object(
        'id', w.id, 'email', w.email, 'watch_count', w.watch_count, 'premium', w.interested_in_premium,
        'source', w.source, 'created_at', w.created_at,
        'is_member', exists (select 1 from auth.users u where lower(u.email) = lower(w.email))
      ) order by w.created_at desc) from (select * from public.waitlist order by created_at desc limit 200) w), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.admin_waitlist() from public, anon;
grant execute on function public.admin_waitlist() to authenticated;

-- Export complet, pour l'import dans Brevo
create or replace function public.admin_waitlist_export()
returns table (email text, watch_count text, interested_in_premium boolean, source text, created_at timestamptz, is_member boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  return query
    select w.email, w.watch_count, w.interested_in_premium, w.source, w.created_at,
           exists (select 1 from auth.users u where lower(u.email) = lower(w.email))
    from public.waitlist w order by w.created_at;
end;
$$;
revoke execute on function public.admin_waitlist_export() from public, anon;
grant execute on function public.admin_waitlist_export() to authenticated;

-- Suppression d'une inscription (demande d'effacement d'une personne)
create or replace function public.admin_delete_waitlist(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  delete from public.waitlist where id = p_id;
end;
$$;
revoke execute on function public.admin_delete_waitlist(uuid) from public, anon;
grant execute on function public.admin_delete_waitlist(uuid) to authenticated;
