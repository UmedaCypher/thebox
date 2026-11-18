-- =====================================================================================
-- Correctif : droits du magazine (et des OKR du backoffice).
--
-- Problème : les règles d'accès appelaient private.is_admin(...) directement. Or cette fonction
-- n'est exécutable ni par les visiteurs (anon) ni par les membres connectés (authenticated)
-- (revoke dans 20261029100000_affiliation.sql). Résultat : « permission denied for function is_admin »,
-- donc « Chargement impossible » dans le backoffice, et lecture des articles publiés impossible.
--
-- Correctif :
--   - private.am_i_admin() : « l'utilisateur connecté est-il administrateur ? », sans paramètre
--     (on ne peut pas interroger le statut d'un autre compte), exécutable par les membres connectés ;
--   - les visiteurs lisent les articles publiés sans aucun appel de fonction ;
--   - mêmes réglages pour les images du magazine (storage) et la table admin_okrs.
-- Ré-exécutable sans risque.
-- =====================================================================================

create or replace function private.am_i_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin(auth.uid());
$$;
revoke execute on function private.am_i_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.am_i_admin() to authenticated;

-- Articles : lecture publique des articles publiés, tout le reste réservé à l'administrateur
drop policy if exists "magazine_read_published" on public.magazine_articles;
create policy "magazine_read_published" on public.magazine_articles for select to anon, authenticated
  using (status = 'published');
drop policy if exists "magazine_admin_read" on public.magazine_articles;
create policy "magazine_admin_read" on public.magazine_articles for select to authenticated
  using ((select private.am_i_admin()));
drop policy if exists "magazine_admin_write" on public.magazine_articles;
create policy "magazine_admin_write" on public.magazine_articles for all to authenticated
  using ((select private.am_i_admin())) with check ((select private.am_i_admin()));

-- Images du magazine : écriture réservée à l'administrateur
do $$
begin
  if to_regclass('storage.objects') is not null then
    execute $p$drop policy if exists "magazine_admin_insert" on storage.objects$p$;
    execute $p$create policy "magazine_admin_insert" on storage.objects for insert to authenticated
      with check (bucket_id = 'magazine' and (select private.am_i_admin()))$p$;
    execute $p$drop policy if exists "magazine_admin_update" on storage.objects$p$;
    execute $p$create policy "magazine_admin_update" on storage.objects for update to authenticated
      using (bucket_id = 'magazine' and (select private.am_i_admin()))$p$;
    execute $p$drop policy if exists "magazine_admin_delete" on storage.objects$p$;
    execute $p$create policy "magazine_admin_delete" on storage.objects for delete to authenticated
      using (bucket_id = 'magazine' and (select private.am_i_admin()))$p$;
  end if;
end $$;

-- OKR du backoffice : même erreur, même correctif
do $$
begin
  if to_regclass('public.admin_okrs') is not null then
    execute $p$drop policy if exists "admin_okrs_admin" on public.admin_okrs$p$;
    execute $p$create policy "admin_okrs_admin" on public.admin_okrs for all to authenticated
      using ((select private.am_i_admin())) with check ((select private.am_i_admin()))$p$;
  end if;
end $$;

notify pgrst, 'reload schema';
