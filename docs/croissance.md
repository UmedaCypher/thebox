# Croissance : aperçus de liens, pages « au poignet », stories, rappel du soir

## Mise en place

1. **SQL** (SQL Editor de Supabase), dans l'ordre :
   `20261111100000_comparateur_public.sql`, puis `20261111110000_croissance.sql`.
2. **Fonction send-push** : la redéployer pour le nouveau rappel « série en jeu »
   (Supabase → Edge Functions → send-push → copier le contenu de `supabase/functions/send-push/index.ts` → Deploy,
   ou `supabase functions deploy send-push`).
3. Rien à faire côté Cloudflare : le Worker (`worker/index.ts`) part avec le déploiement habituel.

## Ce que fait chaque pièce

- **Aperçus de liens** : un passeport ou un profil partagé sur WhatsApp, Instagram ou iMessage affiche
  le nom de la montre, le prix si elle est à vendre, et sa photo. Le Worker lit les données publiques
  avec la clé publique (`dist/app-config.json`, écrit à la construction). En cas de souci, la page s'affiche sans aperçu.
- **Pages « au poignet »** : `/au-poignet/` et une page par modèle ayant au moins 2 photos publiques.
  Moins de 3 photos : page visible mais `noindex` et hors sitemap. Les pages se régénèrent chaque nuit
  (tâche pg_cron `site-rebuild-daily`, même Deploy Hook que le magazine) et à chaque publication d'article.
- **Stories** : Wrist Check avec photo, résultat du timegrapher, passeport (onglet Passeport de la fiche, si le partage est activé).
- **Rappel du soir** : à 20 h, si la série dure depuis au moins 2 jours et que rien n'est noté aujourd'hui.
  Activé par défaut, réglable dans Compte → Notifications.
- **Entonnoir** (backoffice) : inscription, 1re montre, 1er Wrist Check, 1re photo, retour après 7 jours.
