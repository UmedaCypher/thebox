# Activer les notifications push

Les notifications partent de la base de données : un message, une mise en vente ou une tâche planifiée
ajoute une ligne dans la file `notifications`, et la fonction `send-push` l'envoie aux appareils abonnés.

```
nouveau message ─┐
mise en vente ───┤──► table notifications ──(pg_net)──► fonction send-push ──► navigateur / téléphone
tâches pg_cron ──┘
```

| Notification | Quand | Pour qui |
| --- | --- | --- |
| Nouveau message | tout de suite | tous |
| Rappel du jour | à l'heure choisie, si rien n'est noté | sur demande (désactivé par défaut) |
| Bilan du mois | le 1er à 9 h (heure de Paris en hiver) | tous |
| Entretien à prévoir | 7 jours avant et le jour même, à 9 h | Premium |
| Wishlist sur le Marché | dès la mise en vente | Premium |

Chacun choisit ce qu'il reçoit dans **Profil → Notifications**.
Sur iPhone, le site doit d'abord être ajouté à l'écran d'accueil (iOS 16.4 ou plus récent). L'app iOS native lèvera cette contrainte.

## 1. Générer les clés VAPID (une fois)

Dans un terminal, à la racine du projet :

```bash
npx web-push generate-vapid-keys
```

Garder les deux valeurs : **Public Key** et **Private Key**. Ne jamais changer ces clés ensuite :
tous les appareils abonnés devraient se réabonner.

## 2. Base de données

1. Supabase → **Database → Extensions** : activer **pg_net** et **pg_cron**.
2. Supabase → **SQL Editor** : exécuter `supabase/migrations/20261028100000_notifications_push.sql`.
   Le message « pg_cron absent » ne doit pas apparaître ; sinon, activer pg_cron puis relancer le fichier.
3. Toujours dans le SQL Editor, enregistrer l'adresse de la fonction et un secret partagé dans le coffre
   (remplacer `UN_SECRET_LONG` par une longue chaîne aléatoire, par exemple générée par un gestionnaire de mots de passe) :

```sql
select vault.create_secret('https://gwotvurtiyeaslmxnqcw.supabase.co/functions/v1/send-push', 'push_function_url');
select vault.create_secret('UN_SECRET_LONG', 'push_secret');
```

## 3. Secrets de la fonction

Supabase → **Edge Functions → Secrets** :

| Nom | Valeur |
| --- | --- |
| `PUSH_SECRET` | le même `UN_SECRET_LONG` que dans le coffre |
| `VAPID_PUBLIC_KEY` | Public Key de l'étape 1 |
| `VAPID_PRIVATE_KEY` | Private Key de l'étape 1 |
| `VAPID_SUBJECT` | `mailto:` suivi de l'adresse de contact, ex. `mailto:contact@exemple.fr` |
| `SITE_URL` | déjà présent pour Stripe (adresse du site, sans `/` final) |

## 4. Déployer la fonction

**Sans terminal** : Edge Functions → **Deploy a new function → Via Editor**, nom `send-push`,
coller `supabase/functions/send-push/index.ts`, **Deploy**, puis dans ses réglages
**désactiver « Enforce JWT verification »** (c'est la base qui l'appelle, avec l'en-tête secret).

**Avec le terminal** :

```bash
npx supabase functions deploy send-push --no-verify-jwt
```

## 5. Côté site

Ajouter la clé publique aux variables d'environnement du site (fichier `.env` en local,
réglages de l'hébergeur en production), puis redéployer :

```
VITE_VAPID_PUBLIC_KEY=la Public Key de l'étape 1
```

## 6. Tester

1. Ouvrir le site sur un ordinateur (Chrome ou Edge), **Profil → Notifications → Activer sur cet appareil**, accepter.
2. Depuis un autre compte, envoyer un message à ce membre : la notification arrive en quelques secondes.
3. En cas de silence, regarder dans le SQL Editor :

```sql
select id, kind, created_at, sent_at, attempts, error from public.notifications order by id desc limit 10;
```

   - `sent_at` vide et `attempts` à 0 : la fonction n'est pas appelée (étapes 2.3 et 4).
   - `error` = `aucun appareil` : le membre n'a pas activé les notifications sur un appareil.
   - autre `error` : lire le message, et les journaux de la fonction dans Supabase → Edge Functions → send-push → Logs.

## Plus tard : apps Android et iOS

Les apps natives (Capacitor) s'abonneront avec un jeton Firebase (Android) ou Apple (iOS), enregistré dans la même table
`push_subscriptions` avec `kind = 'fcm'` ou `'apns'`. Il faudra alors ajouter l'envoi correspondant dans `send-push` ;
la file, les préférences et les textes restent les mêmes.
