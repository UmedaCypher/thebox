# Guide pour les agents de code

Ce fichier décrit le projet et les règles à respecter quand un agent (Claude Code,
Cursor, Codex, DeepSeek Harness…) travaille sur ce dépôt. Il complète le `README.md`,
qui décrit le produit et l'offre.

## Le projet

**Arcora** — l'écrin numérique des collectionneurs de montres : une fiche
(« passeport ») par montre, un calendrier de portage, une galerie de photos au poignet.
Application web installable (PWA), en français (le magazine a aussi du contenu EN).

## Stack

- **Vite + React 19 + TypeScript** (SPA, `vite.config.ts`), React Router 7.
- **Supabase** : base Postgres, auth, storage, edge functions (`supabase/`).
- **Cloudflare Workers** pour l'hébergement (`wrangler.jsonc`) : le site statique est
  construit par Vite dans `./dist/`, un petit Worker (`worker/index.ts`) ajoute les
  aperçus de liens pour `/passeport/*` et `/profil/*`.
- **Magazine** : sous-projet séparé dans `site/`, build propre, copié dans `dist/`.
- Pas de Tailwind : styles en CSS global (`src/index.css`, `src/App.css`).
- Pas de suite de tests automatisés dans le dépôt.

## Structure

```
src/
  pages/        écrans (fichier = route)
  components/   composants réutilisables
  contexts/     contextes React (auth, etc.)
  hooks/        hooks partagés
  lib/          clients et utilitaires (dont Supabase)
  i18n/         traductions
  paused/       écrans/fonctionnalités désactivées, conservés
  types.ts      types partagés
site/           magazine (build séparé)
worker/         Cloudflare Worker (aperçus de liens)
supabase/
  migrations/   migrations SQL horodatées
  functions/    edge functions
  schema/       schéma de référence
docs/           notes fonctionnelles (affiliation, stripe, notifications, magazine…)
```

## Commandes

```bash
npm ci                 # installe (Node épinglé par .node-version)
npm run dev            # serveur de dev Vite
npm run lint           # ESLint — à lancer avant chaque commit
npm run build          # tsc -b + vite build + build du magazine (copie dans dist/)
npm run preview        # sert le build local
npm run dev:magazine   # dev du sous-projet site/ uniquement
```

Variables d'environnement : copier `.env.example` vers `.env` (ou `.env.local`).
Les variables `VITE_*` sont **embarquées dans le bundle client** : elles ne doivent
jamais contenir de secret serveur. Toute nouvelle variable utile doit être ajoutée à
`.env.example` **et** aux Build variables de Cloudflare.

## Conventions de code

- TypeScript strict ; typer les props et les retours plutôt que `any`.
- Composants fonction + hooks ; pas de classes.
- Copie d'interface en **français**, ton éditorial cohérent avec le reste de l'app.
- Réutiliser les composants et les variables CSS existants plutôt que d'introduire
  une nouvelle bibliothèque d'UI.
- Les fichiers inutilisés mais conservés (écrans désactivés) vont dans `src/paused/`,
  on ne les supprime pas sans demande explicite.

## Base de données Supabase

- Toute modification de schéma passe par une **migration** dans
  `supabase/migrations/`, nommée `AAAAMMJJHHMMSS_slug_court.sql` (timestamp croissant).
- Ne jamais modifier une migration déjà appliquée : en ajouter une nouvelle.
- Les nouvelles tables ont la **RLS activée** avec des policies explicites ; ne pas
  désactiver la RLS sur des tables existantes.
- **Pas de DDL ni de DML sur la base de production en direct.** Pour un agent, l'accès
  à la base est en lecture seule : proposer le SQL sous forme de fichier de migration
  et laisser un humain l'appliquer.
- Les identifiants Supabase (URL, clés) passent par les variables `VITE_SUPABASE_*` ;
  la clé `service_role` n'a rien à faire dans le code client.

## Déploiement et branches

- **`main` est la production** : un merge sur `main` déclenche un déploiement
  Cloudflare. Il n'y a pas de CI qui valide les PR à la place d'un humain.
- Ne jamais pousser directement sur `main`, jamais de force-push.
- Travailler sur une branche `feature/…`, `fix/…` ou `chore/…`, puis ouvrir une PR
  vers `main` avec un résumé de ce qui change et de ce qui a été vérifié.
- Lancer `npm run lint` avant de pousser ; lancer `npm run build` quand le changement
  touche du code ou le magazine (inutile pour une modification de documentation).
- **Merger uniquement sur demande explicite d'un humain**, et de préférence en
  squash (une PR = un commit sur `main`).

## Récapitulatif pour un agent

1. `git fetch origin && git switch -c feature/… origin/main`
2. coder + `npm run lint` (+ `npm run build` si code)
3. commit clair en français, push de la branche, PR vers `main`
4. attendre la validation humaine
5. merge en squash **seulement** si on te le demande
