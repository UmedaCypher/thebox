# Parrainage, affiliation et backoffice

Tout est fait dans l'app, sans outil externe. Un seul lien : `https://arcora.app/?ref=<code>`.

## Les trois types

| Type | Qui | Code | Ce que gagne le parrain | Ce que gagne le filleul |
| --- | --- | --- | --- | --- |
| Parrainage membre | tout membre avec un pseudo | son pseudo | 1 mois de Premium quand le filleul a ajouté 3 montres (12 mois par an au plus) | 1 mois de Premium à l'inscription |
| Ambassadeur créateur | sur demande, validé dans le backoffice | choisi à la demande | 30 % du prix HT de la première année de chaque abonnement annuel (7,50 € pour 30 € TTC) | 3 mois de Premium à l'inscription |
| Partenaire pro | sur demande, validé dans le backoffice | choisi à la demande, avec QR code | visibilité (pas de commission) | 3 mois de Premium à l'inscription |

Pas de prime par palier. Les valeurs sont dans `private.affiliate_perks()` (migration du 29/10) et `AFFILIATE_TYPES` (`src/lib/features.ts`) : les changer aux deux endroits.

Pendant la bêta, chaque inscrit devient **membre fondateur** (badge à vie). Interrupteur dans le backoffice → Réglages.

## Comment ça marche

1. Le visiteur arrive par `?ref=code` (ou un lien court `/yt`, `/podcast`, `/ig`, `/tiktok`, `/discord`, ou `?src=` / `?utm_source=`).
   L'app retient le code 60 jours et la provenance.
2. À la première connexion après l'inscription, l'app appelle `record_signup` : provenance, parrain, fondateur,
   et Premium de bienvenue offert (table `premium_grants`).
3. Quand le filleul ajoute sa 3e montre (déclencheur sur `watches`), il compte comme « activé » et son parrain membre reçoit son mois.
4. Au paiement annuel, `create-checkout-session` retient l'ambassadeur créateur (dernier lien suivi, sinon celui de l'inscription,
   dans les 12 mois). Le webhook calcule la commission, payable 30 jours après, annulée si remboursement ou litige.
5. Les partages de passeport et d'image du mois portent le lien de parrainage du membre et sont comptés (`product_events`).

## Backoffice (`/admin`)

Réservé au compte administrateur. Il montre :

- membres, Premium payants et offerts, revenu mensuel récurrent, fondateurs, montres, activité, Marché ;
- les 4 indicateurs du plan de lancement (activation, partage, rétention, conversion) avec leurs objectifs ;
- inscriptions par semaine et membres au total ;
- argent sur 12 mois : CA TTC et HT, remboursements, frais Stripe, commissions, dépenses, résultat ;
- saisie des dépenses (publicité, outils…) ;
- affiliés : demandes à valider ou refuser, type, suspension, chiffres ; meilleurs parrains membres ;
- virements à faire (dès 50 €) ;
- provenance des inscrits, marques les plus enregistrées ;
- réglages : inscriptions fondateurs, Premium offert à un membre.

## Mise en service

1. SQL Editor : exécuter les migrations dans l'ordre (voir le fichier combiné envoyé, ou `supabase/migrations/`) :
   `20261023100000`, `20261023200000`, `20261028100000`, `20261029100000`, `20261030100000`.
2. Te passer administrateur : `update profiles set account_type = 'admin' where username = '<ton pseudo>';`
3. Redéployer `create-checkout-session` et `stripe-webhook`, et cocher dans le webhook Stripe
   `invoice.paid`, `charge.refunded`, `charge.dispute.created` (voir `docs/stripe.md`).

## Chaque mois

Backoffice → Virements à faire : virer depuis la banque, puis **Marquer comme versé**.
Un remboursement après versement n'est pas repris automatiquement : il apparaît dans les logs du webhook (« À régulariser »).
