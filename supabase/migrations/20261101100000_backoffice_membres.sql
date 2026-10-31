-- =====================================================================================
-- Backoffice : derniers membres inscrits (comptes créés dans l'app)
-- Réservé à l'administrateur. Ré-exécutable sans risque.
-- =====================================================================================

create or replace function public.admin_members(p_search text default null, p_limit integer default 100)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_q text := lower(btrim(coalesce(p_search, '')));
begin
  if not private.is_admin((select auth.uid())) then raise exception 'FORBIDDEN'; end if;
  return coalesce((select jsonb_agg(x order by x.created_at desc) from (
    select
      u.id,
      u.email,
      p.username,
      u.created_at,
      u.last_sign_in_at,
      u.email_confirmed_at is not null as confirmed,
      s.source,
      s.referrer_kind,
      rp.username as referrer,
      coalesce(s.founder, false) as founder,
      (select count(*) from public.watches w where w.user_id = u.id) as watches,
      case
        when exists (select 1 from public.subscriptions sub where sub.user_id = u.id and sub.status in ('active', 'trialing', 'past_due')) then 'paying'
        when p.account_type::text = 'admin' then 'admin'
        when exists (select 1 from public.premium_grants g where g.user_id = u.id and g.starts_at <= now() and g.ends_at > now()) then 'offered'
        else 'free'
      end as plan
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.member_signups s on s.user_id = u.id
    left join public.profiles rp on rp.id = s.referrer_id
    where v_q = '' or lower(u.email) like '%' || v_q || '%' or lower(coalesce(p.username, '')) like '%' || v_q || '%'
       or lower(coalesce(s.source, '')) = v_q
    order by u.created_at desc
    limit least(greatest(coalesce(p_limit, 100), 1), 500)
  ) x), '[]'::jsonb);
end;
$$;
revoke execute on function public.admin_members(text, integer) from public, anon;
grant execute on function public.admin_members(text, integer) to authenticated;
