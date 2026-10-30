# Arcora

L'écrin numérique des collectionneurs de montres : une fiche (passeport) par montre, un calendrier de portage,
une galerie de photos au poignet filtrable par tour de poignet. Application web installable (PWA).

## Offre

| Gratuit | Premium |
| --- | --- |
| 6 montres | Collection illimitée |
| Passeport partageable | Carnet d'entretien et rappels |
| Calendrier de portage et image du mois | Statistiques : coût par port, montres dormantes, rotation |
| Galerie au poignet | Historique de la valeur déclarée |
| | Wishlist avec prix cible |
| | Inventaire PDF pour l'assurance |

Les prix et valeurs sont déclarés par l'utilisateur et ne sont jamais publics.
Réglages produit (limite gratuite, mode liste d'attente, adresse de contact) : `src/lib/features.ts`.

## Lancer en local

```bash
npm install
cp .env.example .env   # puis renseigner l'URL et la clé anon Supabase
npm run dev
```

`npm run build` vérifie les types et construit l'application ; `npm run lint` contrôle le code.

## Structure

- `src/components/ui` : composants du système de design « Écrin » (boutons, champs, coussin, feuille…)
- `src/index.css` : couleurs, typographie et espacements ; thème sombre « écrin » et thème clair « soie »
- `src/lib/api.ts` : tous les accès à Supabase
- `src/pages` : un dossier par écran
- `src/paused` : messagerie, marché et espace revendeur, en pause
- `supabase/migrations` : scripts SQL à exécuter dans Supabase, dans l'ordre
- `supabase/schema` : trace du schéma de la base

## Paiement

Abonnement Premium via Stripe Checkout et trois fonctions Supabase (`supabase/functions`).
Mise en place pas à pas : [`docs/stripe.md`](docs/stripe.md). Désactivé tant que `PAYMENTS_ENABLED` vaut `false`.

## Base de données

Chaque évolution de la base est un fichier de `supabase/migrations`, à coller dans
Supabase → SQL Editor (ou `npx supabase db push`). Voir `supabase/schema/README.md` pour tenir la trace à jour.
