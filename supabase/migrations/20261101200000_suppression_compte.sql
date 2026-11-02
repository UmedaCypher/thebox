-- =====================================================================================
-- Suppression du compte par le membre lui-même (exigée par Google Play et l'App Store, et par le RGPD)
--
-- L'app efface d'abord les photos du membre dans le stockage (ses fichiers), puis appelle delete_my_account().
-- La fonction efface ses données dans l'ordre, puis le compte de connexion.
-- Refus : abonnement Stripe encore actif et non résilié (il faut d'abord le résilier),
--         commissions d'ambassadeur non versées (il faut d'abord nous écrire).
-- Ce qui reste, anonymisé : paiements Stripe et commissions (obligation comptable), messages reçus par les autres.
-- Ré-exécutable sans risque.
-- =====================================================================================

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid());
begin
  if me is null then raise exception 'AUTH_REQUIRED'; end if;

  if exists (select 1 from public.subscriptions s where s.user_id = me
             and s.status in ('active', 'trialing', 'past_due') and not coalesce(s.cancel_at_period_end, false)) then
    raise exception 'ACTIVE_SUBSCRIPTION';
  end if;
  if to_regclass('public.affiliate_commissions') is not null and exists (
       select 1 from public.affiliate_commissions c where c.affiliate_id = me and c.status = 'pending') then
    raise exception 'AFFILIATE_BALANCE';
  end if;

  -- Messagerie : ses messages et sa place dans les conversations
  delete from public.messages where sender_id = me;
  delete from public.conversation_participants where user_id = me;
  update public.conversations set created_by = null where created_by = me;

  -- Anciennes tables de l'espace revendeur (en pause) : rien à effacer pour un collectionneur, mais on nettoie
  if to_regclass('public.invoices') is not null then
    delete from public.invoice_items where invoice_id in (select id from public.invoices where pro_id = me or client_profile_id = me);
    delete from public.invoices where pro_id = me or client_profile_id = me;
  end if;
  if to_regclass('public.documents') is not null then delete from public.documents where pro_id = me; end if;
  if to_regclass('public.watch_service_history') is not null then
    update public.watch_service_history set service_provider_pro_id = null where service_provider_pro_id = me;
    delete from public.watch_service_history where pro_id = me;
  end if;
  if to_regclass('public.external_clients') is not null then delete from public.external_clients where pro_id = me; end if;
  if to_regclass('public.locations') is not null then
    update public.watches set current_location_id = null where current_location_id in (select id from public.locations where pro_id = me);
    delete from public.locations where pro_id = me;
  end if;

  -- Collection (photos, ports, entretiens, valeurs suivent par cascade)
  delete from public.photos where user_id = me;
  delete from public.watches where user_id = me;

  -- Affiliation : on garde la trace comptable des versements, sans lien vers le compte
  if to_regclass('public.affiliate_payouts') is not null then
    update public.affiliate_payouts set created_by = null where created_by = me;
  end if;

  delete from public.profiles where id = me;
  delete from auth.users where id = me;
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
