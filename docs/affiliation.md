# Programme d'affiliation

Un membre rejoint le programme depuis **Profil → Affiliation** (`/affiliation`), choisit un code et reçoit un lien `https://<domaine>/?ref=<code>`.
Quand une personne arrivée par ce lien (dans les 60 jours, le dernier lien suivi l'emporte) souscrit l'**abonnement annuel**,
l'affilié touche **30 % du montant hors taxes de la première année** (7,50 € pour 30 € TTC).

## Règles appliquées par le code

| Règle | Où |
| --- | --- |
| Lien mémorisé 60 jours dans le navigateur | `src/lib/source.ts` (`captureRef`, `readRef`) |
| Annuel seulement, premier abonnement seulement, pas d'auto-parrainage, affilié actif | `create-checkout-session` |
| 30 % de `total_excluding_tax`, factures annuelles de la première année | `stripe-webhook` (`invoice.paid`) |
| Payable 30 jours après le paiement | `available_at` dans `affiliate_commissions` |
| Annulée si remboursement ou litige avant versement | `stripe-webhook` (`charge.refunded`, `charge.dispute.created`) |
| Virement manuel dès 50 € | section Administration de `/affiliation` |

## Mise en service

1. Exécuter `supabase/migrations/20261029100000_affiliation.sql` dans le SQL Editor.
2. Redéployer `create-checkout-session` et `stripe-webhook` (voir `docs/stripe.md`).
3. Dans le webhook Stripe, cocher en plus `invoice.paid`, `charge.refunded`, `charge.dispute.created`.
4. Pour voir la section Administration : `update profiles set account_type = 'admin' where username = '<ton pseudo>';`

## Chaque mois

1. Ouvrir `/affiliation` avec le compte administrateur : la liste montre les affiliés à qui 50 € ou plus sont dus, avec leur IBAN.
2. Faire chaque virement depuis la banque de la société.
3. Cliquer **Marquer comme versé** : les commissions passent en « versée » et le versement est enregistré.

Un remboursement après versement n'est pas repris automatiquement : il apparaît dans les logs du webhook (« À régulariser »)
et se déduit à la main du versement suivant.

## Points à valider

- Si la société est en franchise de TVA, la base HT est égale au prix payé : la commission devient 9 € au lieu de 7,50 €.
- Faire relire les conditions (`/affiliation/conditions`) par un professionnel, comme les CGU et CGV.
- Les commissions versées sont une charge pour la société : garder les références de virement pour la comptabilité.
