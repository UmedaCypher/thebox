# Schéma de la base Supabase

`schema.sql` est la trace de la structure de la base de THE BOX (projet Supabase `gwotvurtiyeaslmxnqcw`).
La base de référence reste celle du tableau de bord Supabase : ce fichier sert à garder un historique
lisible dans Git et à savoir, à chaque commit, à quoi ressemblait la base.

## Mettre à jour (à chaque modification de la base)

### Option simple : depuis le tableau de bord
1. Supabase → **Database** → **Schema Visualizer** → **Copy as SQL**.
2. Remplacer tout le contenu sous l'en-tête de `schema.sql`, et mettre à jour la date « Instantané du ».
3. Commit : `git commit -m "chore(db): mise à jour du schéma"`.

### Option complète : avec la CLI Supabase (recommandée)
Cette version inclut aussi les types enum, les politiques RLS, les fonctions RPC et les triggers,
que l'export du tableau de bord n'inclut pas.

```bash
npx supabase login
npx supabase link --project-ref gwotvurtiyeaslmxnqcw
npx supabase db dump --schema public -f supabase/schema/schema_full.sql
```

`db dump` demande Docker et le mot de passe de la base. Le fichier produit ne contient pas de données,
seulement la structure.

## Bonnes habitudes
- Mettre à jour le schéma **dans le même commit** que le code qui l'utilise.
- Noter en une ligne dans le message de commit ce qui a changé (ex. « ajout table wear_logs »).
- Ne jamais commiter de données ni de clés (`.env`, clé `service_role`).

## Migrations

Les changements de structure sont écrits dans `supabase/migrations/`, un fichier daté par évolution.
Après avoir exécuté une migration dans Supabase, refaites l'export ci-dessus pour que `schema.sql` reste fidèle.

- `20261020120000_recadrage_collectionneur.sql` : limite de 6 montres en gratuit, offre Premium (`profiles.plan`),
  calendrier de portage, carnet d'entretien, historique de valeur, wishlist, liste d'attente, passeport public.
- `20261020180000_abonnements_stripe.sql` : table `subscriptions` tenue à jour par le webhook Stripe.
- `20261021100000_securite_lectures_publiques.sql` : fin des lectures publiques directes des montres
  (prix) et des profils (téléphone…) ; galerie limitée aux photos partagées.

## Dernier instantané

21/10/2026, après les trois migrations ci-dessus (exécutées et vérifiées dans Supabase).

## Ce qui n'est décrit que dans les migrations
Créés par les fichiers de `supabase/migrations` (donc tracés) :
- Règles RLS des nouvelles tables (`wear_logs`, `maintenance_entries`, `watch_value_history`,
  `wishlist_items`, `waitlist`, `subscriptions`) et lecture « propriétaire uniquement » sur `watches` et `profiles`
- Fonctions : `free_watch_limit`, `get_watch_passport`, `get_public_collection`,
  `get_public_wrist_shots`, `get_gallery_available_brands`, `private.is_premium`
- Déclencheurs : `profiles_protect_privileges`, `watches_enforce_limit`, `watches_record_value`

## Ce qui manque encore à cette trace
Antérieur aux migrations, visible seulement dans Supabase :
- Types enum : `user_account_type`, `watch_current_status`, `client_status_type`, `invoice_status_type`
- Règles RLS d'origine de `photos` et des tables en pause, règles des buckets `watch.images` et `avatars`
- Fonctions des fonctionnalités en pause : `get_user_conversations`, `create_or_get_conversation`,
  `count_unread_conversations`, `search_market_watches`, `get_market_available_brands`,
  `create_invoice_and_update_inventory`
- Trigger de création du profil à l'inscription (`handle_new_user`), vérifié le 21/10 :
  il ne copie ni `plan` ni `account_type`

Pour tout capturer d'un coup : `npx supabase db dump --schema public` (voir plus haut).
