# Mettre en place le paiement Stripe

Le paiement passe par **Stripe Checkout** (page de paiement hébergée par Stripe) et l'**espace client Stripe**
(changer de carte, télécharger les factures, résilier). L'app ne voit jamais de numéro de carte.

```
App ──► create-checkout-session ──► page de paiement Stripe
                                        │ paiement réussi
Stripe ──► stripe-webhook ──► table subscriptions + profiles.plan = 'premium'
App ──► create-portal-session ──► espace client Stripe (résiliation, factures)
```

Commencez en **mode test** (interrupteur « Mode test » en haut du tableau de bord Stripe) : aucun vrai paiement.

## 1. Base de données

Supabase → **SQL Editor** → coller et exécuter `supabase/migrations/20261020180000_abonnements_stripe.sql`
(après la migration du recadrage).

## 2. Stripe

1. **Produit et prix** : Catalogue de produits → Ajouter un produit « The Box Premium » avec **deux prix récurrents** :
   - 2 € **par mois** ;
   - 20 € **par an**.

   Copier l'identifiant de chaque prix (`price_…`).
2. **Clé secrète** : Développeurs → Clés API → copier la clé secrète (`sk_test_…`).
3. **Espace client** : Paramètres → Facturation → Portail client → activer
   « Mettre à jour le moyen de paiement », « Historique des factures » et « Annuler l'abonnement »
   (résiliation à la fin de la période).

## 3. Secrets Supabase

Supabase → **Edge Functions** → **Secrets** → ajouter :

| Nom | Valeur |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `STRIPE_PRICE_MONTHLY` | `price_…` du prix mensuel |
| `STRIPE_PRICE_YEARLY` | `price_…` du prix annuel |
| `SITE_URL` | l'adresse de l'app, sans `/` final (ex. `https://thebox.app`) |
| `STRIPE_WEBHOOK_SECRET` | ajouté à l'étape 5 |

## 4. Déployer les trois fonctions

**Sans terminal** : Supabase → Edge Functions → **Deploy a new function** → **Via Editor**,
nommer la fonction, coller le contenu du fichier, **Deploy**. À faire pour :

- `create-checkout-session` → `supabase/functions/create-checkout-session/index.ts`
- `create-portal-session` → `supabase/functions/create-portal-session/index.ts`
- `stripe-webhook` → `supabase/functions/stripe-webhook/index.ts`
  puis, dans les réglages de cette fonction, **désactiver « Enforce JWT verification »**
  (c'est Stripe qui l'appelle ; la sécurité vient de la signature Stripe).

**Avec le terminal** (équivalent) :

```bash
npx supabase login
npx supabase link --project-ref gwotvurtiyeaslmxnqcw
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-portal-session
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

## 5. Webhook Stripe

Stripe → Développeurs → **Webhooks** → Ajouter une destination :

- URL : `https://gwotvurtiyeaslmxnqcw.supabase.co/functions/v1/stripe-webhook`
- Événements : `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`

Copier le **secret de signature** (`whsec_…`) dans le secret Supabase `STRIPE_WEBHOOK_SECRET`.

## 6. Activer dans l'app

Dans `src/lib/features.ts` : `PAYMENTS_ENABLED = true`, et vérifier que `PREMIUM_PRICES` affiche les mêmes prix que Stripe.

## 7. Tester

1. Se connecter avec un compte gratuit → Premium → cocher les CGV → payer avec la carte `4242 4242 4242 4242`,
   n'importe quelle date future et n'importe quel code.
2. De retour sur l'app, Premium s'active en quelques secondes.
   Contrôle : `select p.username, p.plan, s.status from subscriptions s join profiles p on p.id = s.user_id;`
3. Profil → Gérer mon abonnement → Annuler : l'abonnement reste actif jusqu'à la fin de la période,
   puis le compte repasse en gratuit automatiquement.
4. En cas de souci : Stripe → Webhooks → la destination affiche chaque envoi et la réponse ;
   Supabase → Edge Functions → stripe-webhook → Logs.

## 8. Passer en réel

Refaire les étapes 2, 3 et 5 en **mode réel** (nouvelle clé `sk_live_…`, nouveau prix, nouveau webhook et son `whsec_…`),
puis remplacer les secrets Supabase. Le code ne change pas.

## Avant d'encaisser

- **CGV** : la page actuelle est un modèle avec des champs `[…]`. Elle doit décrire l'abonnement, son prix,
  son renouvellement, la résiliation et le droit de rétractation de 14 jours. L'app fait cocher l'acceptation
  des CGV et la demande d'accès immédiat avant le paiement. Faites valider le texte par un professionnel.
- **TVA** : Stripe Tax peut calculer et ajouter la TVA automatiquement ; à activer selon votre statut
  (micro-entreprise en franchise ou non).
- **Mentions légales** : à compléter (éditeur, hébergeur, contact).
