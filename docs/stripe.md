# Mettre en place le paiement Stripe

Le paiement passe par **Stripe Checkout** (page de paiement hébergée par Stripe) et l'**espace client Stripe**
(changer de carte, télécharger les factures, résilier). L'app ne voit jamais de numéro de carte.

```
App ──► create-checkout-session ──► page de paiement Stripe
                                        │ paiement réussi
Stripe ──► stripe-webhook ──► table subscriptions + profiles.plan = 'premium'
App ──► create-portal-session ──► espace client Stripe (résiliation, factures)
```

Compter une heure en mode test, puis 30 minutes pour passer en réel une fois la SASU créée.
On travaille d'abord en **mode test** (interrupteur « Mode test » en haut du tableau de bord Stripe) : aucun vrai paiement.

## 1. Compte Stripe

1. Créer le compte sur stripe.com avec l'adresse de la société. En mode test, aucune pièce n'est demandée.
2. **Paramètres → Informations publiques** :
   - nom affiché : le nom de l'app ;
   - e-mail et téléphone du support ;
   - adresse des **CGV** : `https://<votre-domaine>/cgv`, et de la **confidentialité** : `https://<votre-domaine>/confidentialite`.
3. **Paramètres → Image de marque** : icône (`public/icons/icon-512x512.png`), couleur principale `#c2a072` (laiton),
   couleur d'accent `#1f0e11`. La page de paiement et les reçus prennent ces couleurs.

## 2. Produit, prix et TVA

1. **Catalogue de produits → Ajouter un produit** « Premium » avec **deux prix récurrents**, en cochant
   « Le prix inclut les taxes » (prix TTC) :
   - 2 € **par mois** ;
   - 20 € **par an**.

   Copier l'identifiant de chaque prix (`price_…`).
2. **TVA** (à confirmer avec le comptable) :
   - **SASU redevable de la TVA** : Paramètres → Taxes → **Taux de taxe** → créer « TVA », 20 %, France, **inclus** dans le prix.
     Copier son identifiant (`txr_…`) : il servira au secret `STRIPE_TAX_RATE`, et la TVA apparaîtra sur les factures.
   - **SASU en franchise de TVA** : ne pas créer de taux, et ajouter la mention « TVA non applicable, art. 293 B du CGI »
     dans Paramètres → Facturation → Factures → **Pied de page**.
   - Stripe Tax (calcul automatique, payant au volume) n'est utile qu'au-delà de 10 000 € de ventes par an à des particuliers d'autres pays de l'UE.

## 3. E-mails et espace client

1. **Paramètres → Facturation → Abonnements et e-mails** :
   - activer « Envoyer des reçus de paiement » et « Envoyer des factures finalisées » ;
   - activer le **rappel avant renouvellement** pour les abonnements annuels (les CGV le promettent : un à trois mois avant l'échéance,
     choisir 30 jours) ;
   - activer les e-mails en cas d'échec de paiement et la relance automatique des paiements échoués.
2. **Paramètres → Facturation → Portail client** : activer
   « Mettre à jour le moyen de paiement », « Historique des factures », « Annuler l'abonnement »
   (résiliation **à la fin de la période**), et « Changer de formule » entre mensuel et annuel.
   Renseigner le lien de retour : `https://<votre-domaine>/profil`.

## 4. Clés et secrets Supabase

1. Stripe → **Développeurs → Clés API** → copier la clé secrète (`sk_test_…`). Ne jamais la mettre dans le code ni dans `.env`.
2. Supabase → **Edge Functions → Secrets** → ajouter :

| Nom | Valeur |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `STRIPE_PRICE_MONTHLY` | `price_…` du prix mensuel |
| `STRIPE_PRICE_YEARLY` | `price_…` du prix annuel |
| `SITE_URL` | l'adresse du site, sans `/` final |
| `STRIPE_TAX_RATE` | `txr_…` si la société est redevable de la TVA (sinon ne pas créer ce secret) |
| `STRIPE_TERMS_CONSENT` | `on` pour faire aussi cocher les CGV sur la page Stripe (facultatif : l'app les fait déjà accepter) |
| `STRIPE_WEBHOOK_SECRET` | ajouté à l'étape 6 |

## 5. Déployer les trois fonctions

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

## 6. Webhook Stripe

Stripe → Développeurs → **Webhooks** → Ajouter une destination :

- URL : `https://gwotvurtiyeaslmxnqcw.supabase.co/functions/v1/stripe-webhook`
- Événements : `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`

Copier le **secret de signature** (`whsec_…`) dans le secret Supabase `STRIPE_WEBHOOK_SECRET`.

## 7. Activer dans l'app

Dans `src/lib/features.ts` : `PAYMENTS_ENABLED = true` (je peux le faire pour toi), et vérifier que les prix affichés
(`PRICES`) sont les mêmes que dans Stripe.

## 8. Tester (mode test)

1. Avec un compte gratuit : Premium → cocher les CGV → payer avec la carte `4242 4242 4242 4242`,
   n'importe quelle date future et n'importe quel code.
   Pour tester la validation bancaire (3-D Secure) : `4000 0025 0000 3155`. Paiement refusé : `4000 0000 0000 9995`.
2. De retour sur l'app, Premium s'active en quelques secondes.
   Contrôle dans le SQL Editor : `select p.username, p.plan, s.status from subscriptions s join profiles p on p.id = s.user_id;`
3. Profil → **Gérer mon abonnement** → Annuler : l'abonnement reste actif jusqu'à la fin de la période,
   puis le compte repasse en gratuit automatiquement.
4. En cas de souci : Stripe → Webhooks → la destination affiche chaque envoi et la réponse ;
   Supabase → Edge Functions → stripe-webhook → Logs.

## 9. Passer en réel

1. Stripe → **Activer le compte** : informations de la SASU (SIREN, adresse de domiciliation), pièce d'identité du président,
   IBAN du compte professionnel. La validation prend de quelques minutes à quelques jours.
2. Basculer le tableau de bord en **mode réel**, puis refaire les étapes 2, 3, 4 et 6 : nouveau produit et prix,
   nouveau taux de TVA, nouvelle clé `sk_live_…`, nouveau webhook et son `whsec_…`.
3. Remplacer les secrets Supabase par les valeurs réelles. Le code ne change pas.
4. Faire un vrai paiement avec ta propre carte, vérifier la facture reçue par e-mail, puis le rembourser depuis Stripe
   (Paiements → le paiement → Rembourser) et résilier.

## Avant d'encaisser

- Les **CGV**, les **mentions légales** et la **confidentialité** sont rédigées : il reste à remplir les informations
  de la société dans `src/lib/legal.ts` (dénomination, adresse, RCS, téléphone, médiateur). Les champs vides s'affichent
  « à compléter » sur les pages. Faire relire le tout par un professionnel.
- **Médiateur de la consommation** : obligatoire dès la première vente à un particulier.
- Dans les apps Android et iOS, le Premium passera par l'achat intégré (voir le plan de lancement) ; Stripe reste pour le web.
