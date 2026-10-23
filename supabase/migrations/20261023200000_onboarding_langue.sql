-- =============================================================================
-- THE BOX — Accueil des nouveaux membres et langue (23/10/2026)
--
--  * profiles.onboarded_at : date à laquelle le membre a terminé l'accueil.
--    Tant qu'elle est vide, l'app affiche l'accueil (langue, pseudo, première montre).
--    Les membres existants qui ont déjà un pseudo ou une montre en sont dispensés.
--  * profiles.preferred_language : « fr », « en », ou vide (= langue du système).
--    Les anciennes valeurs (« fr-FR »…) sont remises à vide.
-- Ré-exécutable sans risque.
-- =============================================================================

alter table public.profiles add column if not exists onboarded_at timestamptz;

update public.profiles p
set onboarded_at = coalesce(p.created_at, now())
where p.onboarded_at is null
  and (p.username is not null or exists (select 1 from public.watches w where w.user_id = p.id));

update public.profiles set preferred_language = null
where preferred_language is not null and preferred_language not in ('fr', 'en');

alter table public.profiles drop constraint if exists profiles_preferred_language_check;
alter table public.profiles add constraint profiles_preferred_language_check
  check (preferred_language is null or preferred_language in ('fr', 'en'));

-- Vérification
select 'Membres à accueillir (sans pseudo ni montre)' as verification, count(*)::text as resultat
from public.profiles where onboarded_at is null
union all
select 'Membres déjà accueillis', count(*)::text from public.profiles where onboarded_at is not null
union all
select 'Langues choisies', coalesce(string_agg(distinct preferred_language, ', '), 'aucune (langue du système)')
from public.profiles;
