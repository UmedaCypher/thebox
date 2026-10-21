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

## Ce qui manque encore à cette trace
- Types enum : `user_account_type`, `watch_status` (nom à confirmer), `client_status_type`, `invoice_status_type`
- Politiques RLS de chaque table et des buckets `watch.images` et `avatars`
- Fonctions RPC : `get_user_conversations`, `create_or_get_conversation`, `count_unread_conversations`,
  `get_public_wrist_shots`, `get_gallery_available_brands`, `search_market_watches`,
  `get_market_available_brands`, `create_invoice_and_update_inventory`
- Trigger de création du profil à l'inscription (`handle_new_user`)
